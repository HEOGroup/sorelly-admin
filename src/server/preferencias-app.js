// Preferências do kit lidas DIRETO do app da revendedora (só leitura, nunca grava no app). Marcus, 02/11/2026: "de todas, não amostra".
// Rotas usadas no app (guia em docs/app-sorelly/API-LEITURA.md): GET /revendedoras/kit-preferences (lista, 100 por página) e GET /revendedoras/kit-preferences/:id (respostas).
// MOBILE_API_URL já termina em /api; MOBILE_API_KEY é o ADMIN_SECRET do app (só no servidor). A carga roda em SEGUNDO PLANO e guarda tudo no banco
// (sorelly.preferencia_app): a tela abre na hora e cada atualização relê só quem mudou desde a última vez. Sem telefone e sem e-mail: a tela não precisa.
import { consulta } from "./db.js";
import { listaRevendedoras } from "./revendedoras.js";

const G = globalThis;
const A_CADA = 24 * 60 * 60 * 1000;   // relê o app no máximo uma vez por dia (ou quando a Diretoria pede)
const SIMULTANEAS = 8;
const estado = () => (G.__sorellyPrefApp = G.__sorellyPrefApp || { rodando: false, etapa: "", feitos: 0, total: 0, erro: "", concluidaEm: 0, verificouBanco: false });

function config() {
  const base = (process.env.MOBILE_API_URL || "").trim().replace(/\/+$/, ""), chave = (process.env.MOBILE_API_KEY || "").trim();
  if (!base || !chave) throw Object.assign(new Error("A API do app ainda não está configurada no servidor (MOBILE_API_URL e MOBILE_API_KEY)."), { statusCode: 503 });
  return { base, chave };
}

// GET com até 3 novas tentativas (o app responde 429 ou 5xx de vez em quando)
async function ler(rota, tentativa = 0) {
  const { base, chave } = config();
  try {
    const r = await fetch(base + rota, { headers: { Authorization: "Bearer " + chave, "X-App-Version": "3.5.0", Accept: "application/json" }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error("o app respondeu " + r.status);
    return await r.json();
  } catch (x) {
    if (tentativa < 3) { await new Promise((z) => setTimeout(z, 800 * (tentativa + 1))); return ler(rota, tentativa + 1); }
    throw Object.assign(new Error("O app não respondeu: " + (x && x.message)), { statusCode: 503 });
  }
}

async function garantirTabela() {
  if (G.__sorellyPrefAppTabela) return;
  await consulta(`create table if not exists sorelly.preferencia_app (
    id int primary key, nome text not null default '', cidade text not null default '', estado text not null default '',
    tem_prefs boolean not null default false, atualizado_em timestamptz, observacoes text not null default '', respostas jsonb not null default '{}'::jsonb,
    lido_em timestamptz not null default now())`);
  await consulta("create table if not exists sorelly.preferencia_app_estado (id int primary key, concluida_em timestamptz, total int)");
  G.__sorellyPrefAppTabela = true;
}

// Lê a lista inteira e depois só as respostas de quem é novo ou atualizou. Nunca roda duas vezes ao mesmo tempo.
export async function sincronizarPreferencias() {
  const s = estado();
  if (s.rodando) return;
  s.rodando = true; s.erro = ""; s.feitos = 0; s.total = 0; s.etapa = "Lendo a lista do app";
  try {
    await garantirTabela();
    const lista = []; let pag = 1, paginas = 1;
    while (pag <= paginas) {
      const j = await ler("/revendedoras/kit-preferences?page=" + pag + "&pageSize=100&orderBy=nome&order=asc");
      paginas = j.totalPages || 1; lista.push(...(j.data || [])); pag++;
      s.etapa = "Lendo a lista do app (" + lista.length + " de " + (j.total || "?") + ")";
    }
    const guardado = new Map((await consulta("select id, atualizado_em, tem_prefs from sorelly.preferencia_app")).rows.map((x) => [x.id, x]));
    const mudou = (x) => { const g = guardado.get(x.id), quando = x.preferencias.atualizadoEm; return x.preferencias.temPreferencias && (!g || !g.tem_prefs || !g.atualizado_em || new Date(g.atualizado_em).getTime() !== new Date(quando).getTime()); };
    const fila = lista.filter(mudou); s.total = fila.length; s.etapa = "Lendo as respostas de " + fila.length + " revendedoras";
    const detalhes = new Map();
    await Promise.all(Array.from({ length: SIMULTANEAS }, async () => {
      while (fila.length) { const x = fila.shift(); try { detalhes.set(x.id, await ler("/revendedoras/kit-preferences/" + x.id)); } catch (e) { s.erro = "Algumas respostas não vieram; a próxima leitura tenta de novo."; } s.feitos++; }
    }));
    s.etapa = "Guardando no banco";
    // 1) quem existe no app (nome e região; as respostas já guardadas ficam como estão)
    for (let k = 0; k < lista.length; k += 500) {
      const l = lista.slice(k, k + 500);
      await consulta(`insert into sorelly.preferencia_app (id, nome, cidade, estado, tem_prefs)
        select * from unnest($1::int[], $2::text[], $3::text[], $4::text[], $5::boolean[])
        on conflict (id) do update set nome = excluded.nome, cidade = excluded.cidade, estado = excluded.estado, tem_prefs = excluded.tem_prefs, lido_em = now()`,
      [l.map((x) => x.id), l.map((x) => x.nome || ""), l.map((x) => (x.regiao && x.regiao.cidade) || ""), l.map((x) => (x.regiao && x.regiao.estado) || ""), l.map((x) => !!x.preferencias.temPreferencias)]);
    }
    // 2) respostas lidas agora (data da atualização, observações e respostas por bloco)
    const novos = lista.filter((x) => detalhes.has(x.id));
    for (let k = 0; k < novos.length; k += 200) {
      const l = novos.slice(k, k + 200);
      await consulta(`update sorelly.preferencia_app t set atualizado_em = v.quando, observacoes = v.obs, respostas = v.resp::jsonb
        from unnest($1::int[], $2::timestamptz[], $3::text[], $4::text[]) as v(id, quando, obs, resp) where t.id = v.id`,
      [l.map((x) => x.id), l.map((x) => x.preferencias.atualizadoEm), l.map((x) => (detalhes.get(x.id).preferencias || {}).observations || ""), l.map((x) => JSON.stringify((detalhes.get(x.id).preferencias || {}).answers || {}))]);
    }
    const n = await consulta("select count(*)::int as n from sorelly.preferencia_app");
    await consulta("insert into sorelly.preferencia_app_estado (id, concluida_em, total) values (1, now(), $1) on conflict (id) do update set concluida_em = now(), total = $1", [n.rows[0].n]);
    s.concluidaEm = Date.now(); s.etapa = "";
  } catch (x) {
    s.erro = (x && x.message) || "Falhou a leitura do app."; s.etapa = "";
  } finally { s.rodando = false; }
}

// Dispara a leitura em segundo plano quando nunca houve ou já passou o prazo (ou quando a Diretoria pede).
export async function iniciarPreferencias({ forcar = false } = {}) {
  const s = estado();
  if (s.rodando) return;
  if (!s.verificouBanco) {
    s.verificouBanco = true;
    try { await garantirTabela(); const r = await consulta("select concluida_em from sorelly.preferencia_app_estado where id = 1"); if (r.rows[0] && r.rows[0].concluida_em) s.concluidaEm = new Date(r.rows[0].concluida_em).getTime(); } catch (x) { /* sem banco: tenta ler do app mesmo assim */ }
  }
  if (forcar || !s.concluidaEm || Date.now() - s.concluidaEm > A_CADA) sincronizarPreferencias().catch(() => {});
}

// ISO em UTC -> horário de São Paulo ("2026-11-02T19:12:41"), igual ao resto do módulo
const sp = (d) => (d ? new Date(new Date(d).getTime() - 3 * 3600 * 1000).toISOString().slice(0, 19) : null);

const norm = (x) => String(x || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z ]/g, " ").replace(/s+/g, " ").trim();
const SEM_KIT = ["Expositor", "Encomenda"];   // revendedora "com kit" = tem condicional aberto que NÃO seja só expositor ou encomenda (kit principal, kit novo ou reposição): 2.047 em 02/11/2026, igual à conta do Marcus

// Só entram na tela as revendedoras com kit ativo na DevMaster (Marcus, 02/11/2026: as outras ficam guardadas, mas não aparecem nem contam).
// O app não manda o código da DevMaster nesta rota, então o cruzamento é pelo nome (sem acento, sem caixa).
export async function dadosPreferencias() {
  await garantirTabela();
  const r = await consulta("select id, nome, cidade, estado, tem_prefs, atualizado_em, observacoes, respostas from sorelly.preferencia_app order by nome");
  const s = estado();
  let kit = null;
  try { const l = await listaRevendedoras(); kit = new Map(); l.itens.filter((i) => (i.conds || []).some((c) => !SEM_KIT.includes(c.t))).forEach((i) => { if (!kit.has(norm(i.nome))) kit.set(norm(i.nome), i); }); } catch (x) { kit = null; }   // DevMaster fora do ar: mostra todas, avisando
  const mapa = (x) => { const k = kit && kit.get(norm(x.nome)); return { x, k }; };
  const todas = r.rows.map(mapa), vistas = kit ? todas.filter((a) => a.k) : todas;
  return {
    status: { rodando: s.rodando, etapa: s.etapa, feitos: s.feitos, total: s.total, erro: s.erro, concluidaEm: s.concluidaEm || null },
    total: r.rows.length,                                   // todas as revendedoras do app
    semFiltro: !kit,                                        // true = a DevMaster não respondeu, nada foi filtrado
    comKitNaDevmaster: kit ? kit.size : null,              // revendedoras com kit ativo na DevMaster
    foraDoKit: kit ? todas.length - vistas.length : 0,      // do app, guardadas, sem kit ativo: não aparecem nem contam
    foraDoKitComRespostas: kit ? todas.filter((a) => !a.k && a.x.tem_prefs).length : 0,
    revendedoras: vistas.map(({ x, k }) => ({ id: x.id, idExterno: x.id, nome: x.nome, cidade: x.cidade, estado: x.estado, representante: k ? k.representante : "",
      preferencias: x.tem_prefs && x.atualizado_em ? { atualizadoEm: sp(x.atualizado_em), fonte: "app", atualizadoPor: "app", observacoes: x.observacoes || "", respostas: x.respostas || {} } : null })),
  };
}
