// Sincronização admin → app da representante (05/11/2026; contrato, seção 3). Roda no servidor a cada 60 s (instrumentation.js) e sob demanda
// (POST /api/app-rep/sincronizar, Diretoria). Três passos, cada um independente (erro num não para os outros):
//  1) Kits novos: o que a Michele direcionou (módulo kn, status "direcionada") vai para o app da representante (PUT /admin/kits-novos/:id);
//     o que voltou para ela (status "aguardando", sem representante) sai do app (DELETE). Guarda o que já foi enviado em ks_<id> (módulo rpo).
//  2) Respostas: puxa quem agendou ou recusou (GET /admin/kits-novos/respostas?desde=). Agendou e tem listagem aberta naquele dia: o kit novo
//     entra na listagem (como NOVA_INCLUIR); sem listagem, fica "agendado para dd/mm" para a Michele incluir. Recusou: o kit volta para a Michele,
//     com a recusa registrada (conta para o bloqueio de 2 recusas).
//  3) Kit pronto: kit do app bipado = aviso no celular da representante (POST /admin/listagens/avisos), uma vez por kit.
import { emTransacao, gravarItens, lerPrefixos, lerPrefixosCli } from "../estado-itens.js";
import { gravarModulo, lerModulo, sem } from "./base.js";
import { gravarModulo as gravarModuloSeguro } from "../estado-modulo.js";
import { publicarFichas } from "./fichas-admin-rep.js";
import { chamarApp, configurado, podeGravar } from "./cliente-app.js";
import { MAX_LISTAGEM, PRAZO_PEDIDO_HORAS, capacidade, horasAteRetirada, montarKits, montarListagens, vivo } from "../../apps/montagem/domain/app-rep.js";
import { PERFIS0 } from "../../apps/kits-novos/domain/regioes-rep.js";
import { enderecoDe, foneContato, primeiroNome, trabalhoDe } from "../../apps/kits-novos/domain/padroniza.js";

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const hash = (t) => { let h = 7; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 1000003; return String(h); };
const texto = (v, max) => (v == null ? null : String(v).trim().slice(0, max) || null);

// Nome da representante no quadro dos kits novos ("Thalita") → código do vendedor (Agendamento: "BI" = "Thalita Torazzi").
// Ordem: nome ou apelido igual ao do Agendamento; nome completo do mapa das representantes (PERFIS0.completo, "Thalita Torazzi Arndt",
// que começa com o nome do Agendamento); primeiro nome, só se for de UMA representante ativa (há 3 Thalitas: BI, CV e CU).
function codigosDasReps(ag) {
  const ativos = ((ag.config && ag.config.representantes) || []).filter((r) => r && r.nome && r.codigo && r.ativo !== false);
  const porNome = new Map();
  ativos.forEach((r) => [r.nome].concat(r.apelidos || []).forEach((n) => { if (n) porNome.set(sem(n), String(r.codigo)); }));
  const cache = new Map();
  return {
    get(nomeQuadro) {
      const n = sem(nomeQuadro);
      if (!n) return undefined;
      if (cache.has(n)) return cache.get(n);
      let cod = porNome.get(n);
      if (!cod) {
        const chave = Object.keys(PERFIS0).find((k) => sem(k) === n);
        const completo = sem((chave && PERFIS0[chave].completo) || nomeQuadro);
        const pelaFrente = ativos.filter((r) => completo === sem(r.nome) || completo.startsWith(sem(r.nome) + " "));
        if (pelaFrente.length === 1) cod = String(pelaFrente[0].codigo);
      }
      if (!cod) {
        const primeiro = n.split(" ")[0];
        const mesmos = ativos.filter((r) => sem(r.nome).split(" ")[0] === primeiro);
        if (mesmos.length === 1) cod = String(mesmos[0].codigo);
      }
      cache.set(n, cod);
      return cod;
    },
  };
}
// Endereço da casa que veio do cadastro da DevMaster (dm), se o kit não tem o campo end (Marcus, 26/11/2026: o endereço da casa também vai para o app)
function casaDevMaster(d) { const m = (d && d.dm) || {}; return [enderecoDe(m.end), m.bai, m.cep ? String(m.cep).replace(/^(d{5})(d{3})$/, "$1-$2") : ""].filter(Boolean).join(" · "); }
// corpo do PUT /admin/kits-novos/:externalId (validação do backend: kits-novos.validation.ts)
export function payloadKit(item, dados, repCod) {
  const d = dados || {};
  // contatos de referência: no kndados ficam em c1n/c1t/c1r, c2…, c3… (25/11/2026: antes o app recebia a lista vazia)
  const doKit = [1, 2, 3].map((n) => ({ nome: d["c" + n + "n"], fone: d["c" + n + "t"], rel: d["c" + n + "r"] }));
  const refs = (Array.isArray(d.refs) ? d.refs : Array.isArray(d.contatos) ? d.contatos : doKit)
    .map((c) => ({ nome: texto(primeiroNome(c.nome), 255) || "", telefone: texto(foneContato(c.fone || c.telefone), 40) || "", relacao: texto(c.rel || c.relacao, 120) || "" }))
    .filter((c) => c.nome || c.telefone).slice(0, 10);
  const prata = /prata/i.test(String(d.mod || item.mod || ""));
  const tr = trabalhoDe({ prof: d.prof || item.profissao, trab: d.trab || item.trab, trabEnd: d.trabEnd || item.trabEnd });   // Marcus, 26/11/2026: profissão, local e endereço do trabalho padronizados também para o app
  return {
    representanteCod: repCod, nome: texto(item.nome || d.nome, 255) || "Revendedora nova", telefone: texto(foneContato(d.tel || d.fone || d.celular || d.whats || item.fone), 40),
    cidade: texto(item.cidade || d.cid, 255) || "Curitiba", bairro: texto(item.bairro || d.bai, 255),
    tipoKit: (prata ? "Kit Prata" : "Kit Misto") + (item.expositor || /EXPOSITOR/i.test(String(d.obs || "")) ? " + expositor" : ""), valor: r2(item.valor || d.val || 0),
    profissao: texto(tr.prof, 255), enderecoResidencial: texto(d.end || d.endereco || item.endereco || casaDevMaster(d), 500),
    enderecoTrabalho: texto([tr.local, tr.end].filter(Boolean).join(" · "), 500), disponibilidade: texto(d.disp || item.disp, 500),
    contatos: refs,
  };
}

async function enviarKitsNovos(r) {
  const [kn, dados, ag, ks] = await Promise.all([lerModulo("kn"), lerModulo("kndados").catch(() => ({})), lerModulo("agend"), lerPrefixos("rpo", ["ks_"])]);
  const reps = codigosDasReps(ag);
  for (const [chave, item] of Object.entries(kn)) {
    if (!chave.startsWith("k_") || !item || !item.id || !String(item.id).startsWith("KN")) continue;
    const id = String(item.id), st = ks["ks_" + id];
    const repCod = item.status === "direcionada" && item.rep ? reps.get(sem(item.rep)) : null;
    try {
      if (repCod) {
        const p = payloadKit(item, dados["r_" + id.slice(2)], repCod), h = hash(JSON.stringify(p));
        if (st && st.hash === h && !st.retirado) continue;
        const res = await chamarApp("PUT", "/admin/kits-novos/" + encodeURIComponent(id), p);
        if (!res.ok) { r.erros.push(`kit ${id}: ${res.erro}`); continue; }
        await gravarItens("rpo", { ["ks_" + id]: { repCod, rep: item.rep, hash: h, enviadoEm: new Date().toISOString(), retirado: false } }, "app", "sincronizar");
        r.enviados++;
      } else if (st && !st.retirado && (!item.rep || !["direcionada", "na listagem"].includes(item.status))) {   // voltou para a Michele, entregue, cancelado ou excluído no quadro
        const res = await chamarApp("DELETE", "/admin/kits-novos/" + encodeURIComponent(id));
        if (!res.ok && res.status !== 404) { r.erros.push(`retirar ${id}: ${res.erro}`); continue; }
        await gravarItens("rpo", { ["ks_" + id]: Object.assign({}, st, { retirado: true, retiradoEm: new Date().toISOString() }) }, "app", "sincronizar");
        r.retirados++;
      } else if (item.rep && item.status === "direcionada" && !repCod) {
        r.erros.push(`kit ${id}: representante "${item.rep}" sem código no Agendamento (Configurador)`);
      }
    } catch (e) { r.erros.push(`kit ${id}: ${e.message}`); }
  }
}

// agendou: põe o kit novo na listagem aberta da representante naquele dia (se houver e couber)
async function incluirNaListagem(item, resp, repNome) {
  return emTransacao("rpo", async (cli) => {
    const rpo = await lerPrefixosCli(cli, "rpo", ["l_", "lx_", "k_", "kx_", "ke_"]);
    const ls = montarListagens(rpo).filter((l) => String(l.repCod) === String(resp.representanteCod) && !l.fechada && l.data === resp.agendadoPara);
    const kits = montarKits(rpo);
    const l = ls.find((x) => kits.filter((k) => k.lid === x.id).length < capacidade(x));
    if (!l) return null;
    const id = "KN" + Date.now().toString(36);
    const k = {
      id, lid: l.id, rev: item.nome, bairro: item.bairro || "—", endereco: null, prio: false, tipo: "ac_kit", vendas: [], valor: item.valor || 0, manual: false, defPor: null, defEm: Date.now(),
      pref: { aro: "", ouro: 0, evitar: null, enc: 0 }, status: "pendente", designada: null, motivo: null, ajustes: 0, montId: null, iniM: null, fimM: null, pausaMs: 0, pausadoEm: null, tempoM: null,
      supId: null, supEm: null, bipId: null, iniB: null, fimB: null, valorReal: null, divReg: false, corrigido: false, retEm: null, retPor: null, ultimaHora: false,
      atrasado: horasAteRetirada(l) < PRAZO_PEDIDO_HORAS, aval: null, ordem: kits.filter((x) => x.lid === l.id).length + 1,
      tipoKit: item.expositor ? "kit_novo_exp" : "kit_novo", cond: { nums: [], pegas: false, nova: "" }, origemNova: item.id, porApp: true, fone: "",
      horaAtend: null, periodoAtend: resp.periodo || null, regrasVersaoId: null, remarcacoes: 0, remarcacoesLista: [], origem: "app", repCod: String(resp.representanteCod), rep: repNome, criadoEm: new Date().toISOString(),
    };
    await gravarItens("rpo", { ["k_" + id]: k }, "app", "sincronizar", cli);
    return { lid: l.id, kitId: id };
  });
}

// A resposta do app também fica no próprio kit novo (kndados), para todo mundo ver no quadro e no detalhe (25/11/2026; antes só no módulo kn,
// lido do navegador de quem tinha a Montagem aberta). Recusa: tira a representante do kit e grava a recusa (recs), que conta no bloqueio.
async function respostaNoKit(resp, item) {
  const id = String(resp.externalId || "").replace(/^KN/, ""), chave = "r_" + id;
  const quando = String(resp.respondidoEm || new Date().toISOString());
  const app = { tipo: resp.status, data: resp.agendadoPara || null, periodo: resp.periodo || null, motivo: resp.motivo || null, rep: item.rep || null, em: quando };
  const muda = (k) => {
    if (!k || !k.id || k.excluido) return null;
    if (k.app && k.app.em === quando && k.app.tipo === resp.status) return null;   // já gravada
    const n = Object.assign({}, k, { app });
    if (resp.status === "agendado") {
      n.agDia = app.data; n.agPer = app.periodo;
      n.hist = (k.hist || []).concat([{ em: Date.now(), quem: "App da representante", txt: item.rep + " agendou pelo app" + (app.data ? " para " + app.data.split("-").reverse().join("/") : "") + (app.periodo ? " (" + app.periodo + ")" : "") }]);
    } else if (resp.status === "recusado") {
      if (k.rep && sem(k.rep) === sem(item.rep)) n.rep = "";
      n.recs = (k.recs || []).concat([{ rep: item.rep, iso: quando.slice(0, 10), motivo: app.motivo || "Recusou pelo app", via: "app" }]);
      n.hist = (k.hist || []).concat([{ em: Date.now(), quem: "App da representante", txt: item.rep + " recusou pelo app: " + (app.motivo || "sem motivo") }]);
    } else return null;
    return n;
  };
  const kn = await lerModulo("kndados");
  if (!muda(kn[chave])) return;
  await gravarModuloSeguro("kndados", { [chave]: muda(kn[chave]) }, "chaves", "app-rep", (guardado, novo) => {
    const n = muda(guardado[chave]);
    return n ? Object.assign({}, guardado, { [chave]: n }) : guardado;
  });
}

async function puxarRespostas(r) {
  const ks = await lerPrefixos("rpo", ["ks_"]);
  const cursor = ks.ks_cursor && ks.ks_cursor.desde;
  const res = await chamarApp("GET", "/admin/kits-novos/respostas" + (cursor ? "?desde=" + encodeURIComponent(cursor) : ""));
  if (!res.ok) { r.erros.push("respostas: " + res.erro); return; }
  const lista = (res.corpo && Array.isArray(res.corpo.data)) ? res.corpo.data : [];
  if (!lista.length) return;
  const [kn, ag] = await Promise.all([lerModulo("kn"), lerModulo("agend")]);
  const reps = codigosDasReps(ag);
  let maior = cursor || null;
  for (const resp of lista) {
    if (!maior || String(resp.respondidoEm) > maior) maior = resp.respondidoEm;
    const item = kn["k_" + resp.externalId];
    if (!item || !item.rep || reps.get(sem(item.rep)) !== String(resp.representanteCod)) continue;   // kit já é de outra representante: ignora
    try {
      let novo = null;
      if (resp.status === "agendado") {
        const ag2 = { data: resp.agendadoPara || null, periodo: resp.periodo || null, em: resp.respondidoEm };
        const inc = item.status === "direcionada" && ag2.data ? await incluirNaListagem(item, resp, item.rep) : null;
        novo = Object.assign({}, item, { agendamentoApp: ag2 }, inc ? { status: "na listagem", lid: inc.lid, kitId: inc.kitId } : {});
      } else if (resp.status === "recusado" && item.status === "direcionada") {
        const iso = String(resp.respondidoEm || "").slice(0, 10), data = iso.split("-").reverse().slice(0, 2).join("/");
        const rec = { rep: item.rep, rev: item.nome, data, iso, motivo: resp.motivo || "Recusou pelo app" };
        novo = Object.assign({}, item, { status: "aguardando", rep: null, agendamentoApp: null, recusadaPor: (item.recusadaPor || []).concat([item.rep]), recusasApp: (item.recusasApp || []).concat([rec]) });
      }
      if (novo) { await gravarModulo("kn", { ["k_" + item.id]: novo }, "app-rep"); r.respostas++; }
      if (novo) await respostaNoKit(resp, item).catch((e) => r.erros.push(`resposta no kit ${resp.externalId}: ${e.message}`));
    } catch (e) { r.erros.push(`resposta ${resp.externalId}: ${e.message}`); }
  }
  if (maior && maior !== cursor) await gravarItens("rpo", { ks_cursor: { desde: maior, em: new Date().toISOString() } }, "app", "sincronizar");
}

async function avisarProntos(r) {
  const rpo = await lerPrefixos("rpo", ["l_", "lx_", "k_", "kx_", "ke_", "ks_"]);
  const ls = new Map(montarListagens(rpo).map((l) => [l.id, l]));
  for (const k of montarKits(rpo)) {
    if (k.status !== "bipado" || rpo["ks_aviso_" + k.id] || !k.repCod) continue;
    const l = ls.get(k.lid); if (!l) continue;
    const naLista = montarKits(rpo).filter((x) => x.lid === l.id), prontos = naLista.filter((x) => x.status === "bipado" || x.status === "retirado").length;
    const res = await chamarApp("POST", "/admin/listagens/avisos", {
      representanteCod: String(k.repCod), tipo: "kit_pronto", listagemId: l.id, titulo: "Kit pronto para retirar",
      mensagem: `${k.rev} está pronto · ${prontos} de ${naLista.length} da listagem das ${l.horario}.`.slice(0, 240),
    }).catch((e) => ({ ok: false, erro: e.message }));
    if (res.ok) { await gravarItens("rpo", { ["ks_aviso_" + k.id]: { em: new Date().toISOString() } }, "app", "sincronizar"); r.avisos++; }
  }
}

// Resultado da última rodada guardado no banco (módulo knkommo, chave appsinc), para a equipe e o Claude verem o que o servidor publicado fez (26/11/2026).
// A hora da última rodada (em) também serve de trava para a rodada puxada pela tela (app/api/app-rep/sincronizar, ?rodar=1).
async function guardarResultado(r) {
  try {
    const resumo = { enviados: r.enviados, retirados: r.retirados, respostas: r.respostas, avisos: r.avisos, fichas: r.fichas || null, erros: r.erros.slice(0, 5) };
    await gravarModuloSeguro("knkommo", { appsinc: Object.assign({ em: r.em }, resumo) }, "chaves", "app-rep");
  } catch (e) { /* guardar o resultado nunca derruba a sincronização */ }
}
let rodando = false;
export async function sincronizarApp() {
  const r = { enviados: 0, retirados: 0, respostas: 0, avisos: 0, erros: [], em: new Date().toISOString() };
  try { r.fichas = await publicarFichas(); if (r.fichas.erros.length) r.erros.push(...r.fichas.erros); } catch (e) { r.erros.push("fichas: " + e.message); }   // ficha das revendedoras no admin das representantes (endereço da casa, trabalho, referências)
  if (!podeGravar()) { r.erros.push("Sincronização desligada (MOBILE_API_URL, MOBILE_API_KEY e APP_REP_SINCRONIZAR=1). configurado=" + configurado() + ", VERCEL_ENV=" + (process.env.VERCEL_ENV || "vazio") + ", NODE_ENV=" + (process.env.NODE_ENV || "vazio") + ", flag=" + (process.env.APP_REP_SINCRONIZAR || "vazio") + ", versao=1033a8c4"); await guardarResultado(r); return r; }
  if (rodando) { r.erros.push("Já está sincronizando."); return r; }
  rodando = true;
  try {
    for (const passo of [enviarKitsNovos, puxarRespostas, avisarProntos]) {
      try { await passo(r); } catch (e) { r.erros.push(passo.name + ": " + e.message); }
    }
  } finally { rodando = false; }
  globalThis.__appRepUltimaSinc = r;
  await guardarResultado(r);
  return r;
}
export function ultimaSincronizacao() { return globalThis.__appRepUltimaSinc || null; }

// liga o relógio (instrumentation.js): a cada 60 s, só com APP_REP_SINCRONIZAR=1
export function agendarSincronizacao() {
  if (!podeGravar() || globalThis.__appRepRelogio) return;
  globalThis.__appRepRelogio = setInterval(() => { sincronizarApp().catch((e) => console.error("[app-rep] sincronizar", e)); }, 60000);
  setTimeout(() => sincronizarApp().catch(() => {}), 5000);
}

export { MAX_LISTAGEM, vivo, codigosDasReps };
