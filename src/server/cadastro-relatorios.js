// Relatórios do Cadastro de revendedoras AO VIVO (25/11/2026), como no admin antigo:
//   • Funil "Desempenho": conta, na Kommo, os leads criados no período por valor do campo Desempenho (2092644), em todos os funis
//     (antigo: aggregateDesempenhoStockFromKommo). A conta do funil (acumulado, % do início...) é a mesma de domain/cadastro-leads.js (montaFunil).
//   • Campanhas (tráfego): Meta Marketing API, gasto, impressões, cliques, CPC e CTR por campanha e por anúncio (antigo: GetMetaCampaignsDashboard),
//     e o funil só dos leads com a tag FACEBOOK ADS.
// Só LÊ a Kommo e a Meta. Guarda cada resposta 10 minutos (a Kommo aceita ~7 chamadas por segundo; o período "Tudo" lê milhares de leads).
// Variáveis: KOMMO_API_URL + KOMMO_ACCESS_TOKEN; FACEBOOK_API_TOKEN e, opcional, FACEBOOK_AD_ACCOUNT_IDS (lista "act_1,act_2"; sem ela, as contas ativas com "sorelly" no nome).
import { kommoGet, kommoLigada } from "./kommo.js";

const CAMPO_DESEMPENHO = 2092644, TAG_FB = "facebook ads", META = "https://graph.facebook.com/v22.0";
const VALORES = new Set(["contato-inicial", "responderam", "iniciou-cadastro", "enviou-dados", "iniciou-análise", "aprovada", "cadastradas", "nao-respondem", "reprovadas"]);
const erroHttp = (msg, statusCode) => Object.assign(new Error(msg), { statusCode });
const cache = globalThis.__cadRel || (globalThis.__cadRel = new Map());
async function guardado(chave, fn) {
  const c = cache.get(chave);
  if (c && Date.now() - c.em < 600000) return c.v;
  const v = await fn();
  cache.set(chave, { v, em: Date.now() });
  if (cache.size > 60) cache.delete(cache.keys().next().value);
  return v;
}
const seg = (dia, fim) => Math.floor(Date.parse(dia + (fim ? "T23:59:59-03:00" : "T00:00:00-03:00")) / 1000);
const diaValido = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ""));

/** Estoque do Desempenho no período: {todos:{estoque,total}, fb:{estoque,total}}. de/ate = "AAAA-MM-DD" (sem eles = tudo). */
export async function estoqueDesempenho(de, ate) {
  if (!kommoLigada()) throw erroHttp("Kommo desligada: falta KOMMO_API_URL ou KOMMO_ACCESS_TOKEN.", 503);
  const filtro = diaValido(de) && diaValido(ate) ? `&filter[created_at][from]=${seg(de)}&filter[created_at][to]=${seg(ate, true)}` : "";
  return guardado("des:" + filtro, async () => {
    const todos = { estoque: {}, total: 0 }, fb = { estoque: {}, total: 0 };
    const conta = (l) => {
      const f = (l.custom_fields_values || []).find((x) => Number(x.field_id) === CAMPO_DESEMPENHO);
      const v = f && f.values && f.values[0] ? String(f.values[0].value || "").trim() : "";
      if (!VALORES.has(v)) return;
      todos.estoque[v] = (todos.estoque[v] || 0) + 1; todos.total++;
      if (((l._embedded && l._embedded.tags) || []).some((t) => String(t.name || "").trim().toLowerCase() === TAG_FB)) { fb.estoque[v] = (fb.estoque[v] || 0) + 1; fb.total++; }
    };
    // páginas de 250, 4 de cada vez (até 200 páginas, como o antigo)
    let fim = false;
    for (let pg = 1; pg <= 200 && !fim; pg += 4) {
      const lote = await Promise.all([0, 1, 2, 3].map((k) => kommoGet(`/api/v4/leads?limit=250&page=${pg + k}&with=tags${filtro}`)));
      for (const r of lote) {
        if (r.status === 204 || !r.j) { fim = true; continue; }
        if (r.status !== 200) throw erroHttp("A Kommo não respondeu (" + r.status + ").", 503);
        const ls = (r.j._embedded && r.j._embedded.leads) || [];
        ls.forEach(conta);
        if (ls.length < 250) fim = true;
      }
    }
    return { todos, fb, atualizadoEm: new Date().toISOString() };
  });
}

// ---------- Meta Ads ----------
async function meta(caminho) {
  const token = String(process.env.FACEBOOK_API_TOKEN || "").trim();
  if (!token) throw erroHttp("Meta Ads desligada: falta FACEBOOK_API_TOKEN no servidor.", 503);
  const url = caminho.startsWith("http") ? caminho : META + caminho + (caminho.includes("?") ? "&" : "?") + "access_token=" + encodeURIComponent(token);
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw erroHttp("A Meta Ads não respondeu (" + r.status + (j.error && j.error.message ? ": " + j.error.message : "") + ").", 502);
  return j;
}
async function todasPaginas(caminho, max = 20) {
  const out = []; let j = await meta(caminho);
  for (let i = 0; i < max; i++) { out.push(...(j.data || [])); const prox = j.paging && j.paging.next; if (!prox) break; j = await meta(prox); }
  return out;
}
async function contas() {
  return guardado("meta:contas", async () => {
    const lista = await todasPaginas("/me/adaccounts?fields=id,account_id,name,account_status,currency&limit=50", 5);
    const quero = String(process.env.FACEBOOK_AD_ACCOUNT_IDS || "").split(",").map((x) => x.trim()).filter(Boolean).map((x) => (x.startsWith("act_") ? x : "act_" + x));
    return (quero.length ? lista.filter((a) => quero.includes(a.id)) : lista.filter((a) => a.account_status === 1 && /sorelly/i.test(a.name || ""))).map((a) => ({ id: a.id, nome: a.name, moeda: a.currency }));
  });
}
// período da Meta: sem datas = últimos 730 dias (como o antigo)
function periodoMeta(de, ate) {
  if (diaValido(de) && diaValido(ate)) return { since: de, until: ate };
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  return { since: new Date(Date.parse(hoje + "T12:00:00Z") - 729 * 86400000).toISOString().slice(0, 10), until: hoje };
}
const linha = (x, nome) => ({ id: String(x.campaign_id || x.ad_id), nome: x[nome] || "", gasto: Number(x.spend || 0), impressoes: Number(x.impressions || 0), cliques: Number(x.clicks || 0), alcance: Number(x.reach || 0) });

/** Campanhas no período (todas as contas) + o estoque do Desempenho só dos leads de anúncio (FACEBOOK ADS). */
export async function campanhasMeta(de, ate) {
  const p = periodoMeta(de, ate), tr = encodeURIComponent(JSON.stringify(p));
  return guardado("meta:camp:" + p.since + p.until, async () => {
    const cs = await contas();
    const linhas = [];
    for (const c of cs) {
      const ds = await todasPaginas(`/${c.id}/insights?level=campaign&fields=campaign_id,campaign_name,spend,impressions,clicks,cpc,ctr,reach&time_range=${tr}&limit=250`);
      ds.forEach((x) => linhas.push(Object.assign(linha(x, "campaign_name"), { conta: c.nome })));
    }
    return { periodo: p, contas: cs, campanhas: linhas, atualizadoEm: new Date().toISOString() };
  });
}
/** Anúncios de uma campanha no período. */
export async function anunciosMeta(campanhaId, de, ate) {
  if (!/^\d+$/.test(String(campanhaId))) throw erroHttp("Campanha inválida.", 400);
  const p = periodoMeta(de, ate), tr = encodeURIComponent(JSON.stringify(p));
  return guardado("meta:ads:" + campanhaId + p.since + p.until, async () => {
    const ds = await todasPaginas(`/${campanhaId}/insights?level=ad&fields=ad_id,ad_name,spend,impressions,clicks,cpc,ctr,reach&time_range=${tr}&limit=250`);
    return { periodo: p, anuncios: ds.map((x) => linha(x, "ad_name")).sort((a, b) => b.gasto - a.gasto) };
  });
}
