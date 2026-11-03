// Pós-vendas (Marcus, 02/11/2026): tela de contatos da Letícia. Junta a lista de revendedoras com kit ativo (DevMaster, só leitura),
// o uso real do app (GET /admin/resellers/:id do app, só leitura) (nada é gravado na DevMaster nem no app).
// Uso do app = pedidos lançados pela revendedora (o campo "última vez vista" do app não serve: só é gravado na criação da conta).
import { consulta } from "./db.js";
import { listaRevendedoras } from "./revendedoras.js";

const G = globalThis;
const A_CADA = 24 * 60 * 60 * 1000;
const SIMULTANEAS = 8;
const SEM_KIT = ["Expositor", "Encomenda"];   // kit ativo = condicional aberto que não seja só expositor ou encomenda
const estado = () => (G.__sorellyUsoApp = G.__sorellyUsoApp || { rodando: false, feitos: 0, total: 0, erro: "", concluidaEm: 0, verificouBanco: false });
const norm = (x) => String(x || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();

function config() {
  const base = (process.env.MOBILE_API_URL || "").trim().replace(/\/+$/, ""), chave = (process.env.MOBILE_API_KEY || "").trim();
  if (!base || !chave) throw Object.assign(new Error("A API do app ainda não está configurada no servidor (MOBILE_API_URL e MOBILE_API_KEY)."), { statusCode: 503 });
  return { base, chave };
}
async function ler(rota, tentativa = 0) {
  const { base, chave } = config();
  try {
    const r = await fetch(base + rota, { headers: { Authorization: "Bearer " + chave, "X-App-Version": "3.5.0", Accept: "application/json" }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error("o app respondeu " + r.status);
    return await r.json();
  } catch (x) {
    if (tentativa < 3) { await new Promise((z) => setTimeout(z, 700 * (tentativa + 1))); return ler(rota, tentativa + 1); }
    throw Object.assign(new Error("O app não respondeu: " + (x && x.message)), { statusCode: 503 });
  }
}

async function garantirTabelas() {
  if (G.__sorellyPvTabelas) return;
  await consulta("create table if not exists sorelly.uso_app (id int primary key, pedidos int not null default 0, clientes int not null default 0, vendido numeric not null default 0, ultimo_pedido timestamptz, lido_em timestamptz not null default now())");
  await consulta("create table if not exists sorelly.uso_app_estado (id int primary key, concluida_em timestamptz)");
  G.__sorellyPvTabelas = true;
}

// Lê o uso de cada conta do app (ids já guardados pela leitura das preferências). Roda em segundo plano, uma vez por dia.
export async function sincronizarUso() {
  const s = estado();
  if (s.rodando) return;
  s.rodando = true; s.erro = ""; s.feitos = 0; s.total = 0;
  try {
    await garantirTabelas();
    const ids = (await consulta("select id from sorelly.preferencia_app order by id")).rows.map((x) => x.id);
    s.total = ids.length;
    const fila = [...ids], lidos = [];
    await Promise.all(Array.from({ length: SIMULTANEAS }, async () => {
      while (fila.length) {
        const id = fila.shift();
        try {
          const d = (await ler("/admin/resellers/" + id + "?period=all")).data || {}, u = d.ultimo_pedido;
          const quando = u ? (typeof u === "string" ? u : u.created_at || u.data || u.updated_at || null) : null;   // o app manda o último pedido como texto ("2026-10-30 21:16:07.67")
          lidos.push({ id, pedidos: Number(d.total_pedidos) || 0, clientes: Number(d.total_clientes) || 0, vendido: Number(d.total_vendido) || 0, ultimo: quando && !Number.isNaN(new Date(String(quando).replace(" ", "T")).getTime()) ? new Date(String(quando).replace(" ", "T")).toISOString() : null });
        } catch (x) { s.erro = "Algumas contas não vieram; a próxima leitura tenta de novo."; }
        s.feitos++;
      }
    }));
    for (let k = 0; k < lidos.length; k += 500) {
      const l = lidos.slice(k, k + 500);
      await consulta(`insert into sorelly.uso_app (id, pedidos, clientes, vendido, ultimo_pedido)
        select * from unnest($1::int[], $2::int[], $3::int[], $4::numeric[], $5::timestamptz[])
        on conflict (id) do update set pedidos = excluded.pedidos, clientes = excluded.clientes, vendido = excluded.vendido, ultimo_pedido = excluded.ultimo_pedido, lido_em = now()`,
      [l.map((x) => x.id), l.map((x) => x.pedidos), l.map((x) => x.clientes), l.map((x) => x.vendido), l.map((x) => x.ultimo)]);
    }
    if (!lidos.length) throw new Error("Nenhuma conta do app foi lida; a próxima abertura da tela tenta de novo.");   // nunca marca como concluída uma leitura vazia
    await consulta("insert into sorelly.uso_app_estado (id, concluida_em) values (1, now()) on conflict (id) do update set concluida_em = now()");
    s.concluidaEm = Date.now();
  } catch (x) { s.erro = (x && x.message) || "Falhou a leitura do uso do app."; }
  finally { s.rodando = false; }
}

export async function iniciarUso({ forcar = false } = {}) {
  const s = estado();
  if (s.rodando) return;
  if (!s.verificouBanco) {
    s.verificouBanco = true;
    try { await garantirTabelas(); const r = await consulta("select concluida_em from sorelly.uso_app_estado where id = 1"); if (r.rows[0] && r.rows[0].concluida_em) s.concluidaEm = new Date(r.rows[0].concluida_em).getTime(); } catch (x) { /* sem banco: tenta mesmo assim */ }
  }
  if (forcar || !s.concluidaEm || Date.now() - s.concluidaEm > A_CADA) sincronizarUso().catch(() => {});
}

const media = (v) => (v && v.length ? Math.round((v.reduce((a, x) => a + (Number(x.v) || 0), 0) / v.length) * 100) / 100 : 0);
const diasDesde = (iso) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : null);

// Uma linha por revendedora com kit ativo, com tudo o que a tela filtra.
export async function contatos() {
  await garantirTabelas();
  const [lista, apps, prefs] = await Promise.all([
    listaRevendedoras(),
    consulta("select a.id, a.nome, u.id is not null as lido, u.pedidos, u.clientes, u.vendido, u.ultimo_pedido from sorelly.preferencia_app a left join sorelly.uso_app u on u.id = a.id"),
    consulta("select nome, tem_prefs from sorelly.preferencia_app"),
  ]);
  const porNome = new Map(); apps.rows.forEach((x) => { const k = norm(x.nome); if (!porNome.has(k)) porNome.set(k, x); });
  const temPref = new Map(); prefs.rows.forEach((x) => { const k = norm(x.nome); if (x.tem_prefs) temPref.set(k, true); });
  const s = estado();
  const linhas = lista.itens.filter((i) => (i.conds || []).some((c) => !SEM_KIT.includes(c.t))).map((i) => {
    const a = porNome.get(norm(i.nome)), k = norm(i.nome);
    const dias = a && a.ultimo_pedido ? diasDesde(a.ultimo_pedido) : null;
    let app = "Sem o app";
    if (a) app = !a.lido ? "Lendo o app" : !a.pedidos && !a.clientes ? "Nunca lançou venda" : dias == null || dias > 30 ? "Parou de lançar" : "Usando";
    const previsoes = (i.conds || []).filter((c) => !SEM_KIT.includes(c.t) && c.d).map((c) => c.d).sort();
    const prox = previsoes[0] || "";
    return {
      cod: i.cod, nome: i.nome, representante: i.representante, celular: i.celular, cidade: i.cidade, uf: i.uf,
      media: media(i.vendas), nVendas: (i.vendas || []).length, ultimaVenda: (i.vendas && i.vendas[0] && i.vendas[0].d) || "",
      proximoAcerto: prox, diaAcerto: prox ? Number(prox.slice(8, 10)) : null, valorKit: (i.conds || []).filter((c) => !SEM_KIT.includes(c.t)).reduce((t, c) => t + (c.v || 0), 0),
      app, diasUltimoPedido: dias, ultimoPedido: a && a.ultimo_pedido ? new Date(a.ultimo_pedido).toISOString().slice(0, 10) : "", pedidosApp: a ? a.pedidos || 0 : 0, temPreferencias: !!temPref.get(k),
    };
  }).sort((x, y) => x.nome.localeCompare(y.nome, "pt-BR"));
  return { geradoEm: new Date().toISOString(), uso: { rodando: s.rodando, feitos: s.feitos, total: s.total, erro: s.erro, concluidaEm: s.concluidaEm || null }, linhas };
}

