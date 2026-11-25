// Kommo → Kits novos (25/11/2026, pedido do Leonardo). Lê os eventos de mudança de etapa da Kommo e põe as revendedoras aprovadas nos Kits novos
// (módulo kndados), como o admin antigo fazia ao aprovar (ReviewKommoLead → CriarKitNovoDeLead). As regras ficam em kits-novos-kommo-regras.js.
// SÓ LÊ a Kommo (nunca escreve nela). Grava no kndados com gravarModulo (transação com o módulo travado + registro em estado_modulo_log).
//
// Quando roda: agendador da Vercel (vercel.json, a cada 2 minutos, rota /api/kommo/kits-novos) e, no servidor local, o relógio do instrumentation.js.
// Liga só com KITS_NOVOS_KOMMO=1 e KOMMO_API_URL + KOMMO_ACCESS_TOKEN (o .env de desenvolvimento aponta para o banco de produção).
// Onde parou fica no módulo knkommo (chave "estado": cursor = segundos da Kommo). Sem cursor, começa 2 horas antes; a carga do que veio antes
// é o script scripts/kits-novos-kommo-carga.mjs (mostra o relatório e só grava com --aplicar).
import { kommoGet, kommoLigada } from "./kommo.js";
import { lerModulo } from "./app-rep/base.js";
import { gravarModulo } from "./estado-modulo.js";
import { KOMMO, aplicarEventos, classificarEvento } from "./kits-novos-kommo-regras.js";

export function kommoKitsLigado() { return kommoLigada() && process.env.KITS_NOVOS_KOMMO === "1"; }

async function lista(rota, chave) {
  const r = await kommoGet(rota);
  if (r.status === 204 || !r.j) return [];
  if (r.status !== 200) throw new Error("Kommo respondeu " + r.status + " em " + rota.split("?")[0]);
  return (r.j._embedded && r.j._embedded[chave]) || [];
}

// eventos de mudança de etapa entre dois instantes (segundos), do mais antigo para o mais novo
async function eventos(de, ate) {
  const out = [];
  for (let pg = 1; pg <= 80; pg++) {
    const ls = await lista(`/api/v4/events?limit=100&page=${pg}&filter[type]=lead_status_changed&filter[created_at][from]=${de}&filter[created_at][to]=${ate}`, "events");
    out.push(...ls);
    if (ls.length < 100) break;
  }
  return out.map(classificarEvento).filter(Boolean).sort((a, b) => a.em - b.em);
}

// leads (com contatos e etiquetas) e o contato principal de cada um, em lotes de 50
async function dadosDosLeads(ids) {
  const leads = {}, contatos = {};
  for (let i = 0; i < ids.length; i += 50) {
    const lote = ids.slice(i, i + 50);
    (await lista("/api/v4/leads?limit=50&with=contacts&" + lote.map((id) => "filter[id][]=" + id).join("&"), "leads")).forEach((l) => { leads[l.id] = l; });
  }
  const cids = [...new Set(Object.values(leads).map((l) => l._embedded && l._embedded.contacts && l._embedded.contacts[0] && l._embedded.contacts[0].id).filter(Boolean))];
  for (let i = 0; i < cids.length; i += 50) {
    (await lista("/api/v4/contacts?limit=50&" + cids.slice(i, i + 50).map((id) => "filter[id][]=" + id).join("&"), "contacts")).forEach((c) => { contatos[c.id] = c; });
  }
  return { leads, contatos };
}

let etapasCache = null;
async function etapasAprovadas() {
  if (etapasCache && Date.now() - etapasCache.em < 3600000) return etapasCache.v;
  const r = await kommoGet("/api/v4/leads/pipelines/" + KOMMO.FUNIL_APROVADAS);
  const v = {};
  ((r.j && r.j._embedded && r.j._embedded.statuses) || []).forEach((s) => { v[s.id] = String(s.name || "").trim(); });
  etapasCache = { v, em: Date.now() };
  return v;
}

let rodando = false;
/**
 * Uma rodada. desde = segundos (sem ele, de onde parou); simular = só calcula, não grava nada (nem o cursor).
 * Devolve {de, ate, eventos, criados, liberados, vinculados, desfeitos, etiquetas, semDados, gravados, erros, exemplos?}.
 */
export async function sincronizarKommoKitsNovos({ desde, ate: ateIn, simular = false } = {}) {
  const r = { em: new Date().toISOString(), eventos: 0, gravados: 0, erros: [] };
  if (!kommoLigada()) { r.erros.push("Kommo desligada: falta KOMMO_API_URL ou KOMMO_ACCESS_TOKEN."); return r; }
  if (!simular && !kommoKitsLigado()) { r.erros.push("Kits novos pela Kommo desligado: falta KITS_NOVOS_KOMMO=1."); return r; }
  if (rodando) { r.erros.push("Já está rodando."); return r; }
  rodando = true;
  try {
    const st = (await lerModulo("knkommo")).estado || {};
    const ate = ateIn || Math.floor(Date.now() / 1000);
    const de = desde || st.cursor || ate - 7200;
    Object.assign(r, { de, ate });
    const evs = await eventos(de, ate);
    r.eventos = evs.length;
    if (evs.length) {
      const precisa = [...new Set(evs.filter((e) => e.tipo === "aprovou" || e.tipo === "liberou").map((e) => e.lead))];
      const [{ leads, contatos }, etapas, kn] = await Promise.all([dadosDosLeads(precisa), etapasAprovadas(), lerModulo("kndados")]);
      const dados = { leads, contatos, etapas, padrao: (kn.cfg && kn.cfg.valorPadrao) || 7000 };
      const plano = aplicarEventos(kn, evs, dados);
      Object.assign(r, plano.resumo);
      if (simular) {
        r.gravados = Object.keys(plano.chaves).length;
        r.exemplos = Object.values(plano.chaves).slice(0, 400).map((k) => ({ id: k.id, st: k.st, cad: k.cad, reg: k.reg, cid: k.cid, ent: k.ent, val: k.val, kEt: k.kEt, temTel: !!k.tel, rep: k.rep, nome: k.nome }));
        return r;
      }
      if (Object.keys(plano.chaves).length) {
        // dentro da trava refaz a conta com o que está guardado AGORA (alguém pode ter mexido num kit entre a leitura e a gravação)
        r.versao = await gravarModulo("kndados", plano.chaves, "chaves", "kommo", (guardado) => {
          const de2 = aplicarEventos(guardado, evs, dados);
          r.gravados = Object.keys(de2.chaves).length;
          return Object.assign({}, guardado, de2.chaves);
        });
      }
    }
    if (!simular) {
      // guarda onde parou com 2 minutos de folga (evento que a Kommo registra atrasado entra na próxima; repetir um evento não muda nada)
      const cursor = Math.max(de, ate - 120);
      await gravarModulo("knkommo", { estado: { cursor, em: r.em, ultima: { eventos: r.eventos, criados: r.criados || 0, liberados: r.liberados || 0, vinculados: r.vinculados || 0, desfeitos: r.desfeitos || 0, erros: r.erros } } }, "chaves", "kommo");
    }
  } catch (e) {
    r.erros.push(e.message);
  } finally {
    rodando = false;
  }
  globalThis.__kommoKitsUltima = r;
  return r;
}
export function ultimaKommoKits() { return globalThis.__kommoKitsUltima || null; }

// relógio do servidor local (instrumentation.js): a cada 2 minutos, só com KITS_NOVOS_KOMMO=1
export function agendarKommoKitsNovos() {
  if (!kommoKitsLigado() || globalThis.__kommoKitsRelogio) return;
  globalThis.__kommoKitsRelogio = setInterval(() => { sincronizarKommoKitsNovos().catch((e) => console.error("[kommo-kits]", e)); }, 120000);
  setTimeout(() => sincronizarKommoKitsNovos().catch(() => {}), 8000);
}
