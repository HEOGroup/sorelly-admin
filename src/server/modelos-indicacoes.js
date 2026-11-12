// Marketing › Modelos › Influencers (etapa 2 da ideia do Nickolas, 12/11/2026): conta, no app, quantas revendedoras cada influencer trouxe pelo link dela.
// Só leitura (GET) na API do app (MOBILE_API_URL + MOBILE_API_KEY). Guia: docs/app-sorelly/API-LEITURA.md, rota GET /admin/indicacoes?revendedoraId=<id>.
// A influencer precisa ter cadastro no app (o id dela é o "ID no app"); o link é <INDICACOES_FORM_BASE_URL>/?id=<id> e cada pessoa que se cadastra por ele vira uma indicação dela.
// Status da indicação: criado → em_andamento → cadastro_aprovado → finalizado (kit entregue); cancelado fica de fora. "Trouxe" = cadastro_aprovado + finalizado (decisão a confirmar com o Marcus).
// Cache de 5 minutos na memória do servidor; ?atualizar=1 ignora.

import http from "node:http";
import https from "node:https";
import tls from "node:tls";

function config() {
  const base = (process.env.MOBILE_API_URL || "").trim().replace(/\/+$/, ""), chave = (process.env.MOBILE_API_KEY || "").trim();
  if (!base || !chave) throw Object.assign(new Error("A API do app ainda não está configurada no servidor (MOBILE_API_URL e MOBILE_API_KEY)."), { statusCode: 503 });
  return { base, chave };
}
// Antivírus e proxies do Windows (Avast) trocam o certificado: além das autoridades padrão usamos as do sistema (a verificação continua LIGADA).
let agente = null;
function agenteTls() {
  if (agente) return agente;
  let ca;
  try { ca = [...tls.getCACertificates("default"), ...tls.getCACertificates("system")]; } catch (x) { ca = undefined; }
  agente = new https.Agent(ca ? { ca, keepAlive: true } : { keepAlive: true });
  return agente;
}
function pedir(rota) {
  const { base, chave } = config();
  const url = new URL(base + rota);
  const lib = url.protocol === "http:" ? http : https;
  return new Promise((resolve, reject) => {
    const req = lib.request(url, { method: "GET", ...(lib === https ? { agent: agenteTls() } : {}), headers: { Authorization: "Bearer " + chave, "X-App-Version": "3.5.0", Accept: "application/json" }, timeout: 20000 }, (res) => {
      const partes = [];
      res.on("data", (c) => partes.push(c));
      res.on("end", () => { const texto = Buffer.concat(partes).toString("utf8"); let j = null; try { j = JSON.parse(texto); } catch (x) { /* resposta que não é JSON */ } resolve({ status: res.statusCode, json: j }); });
    });
    req.on("timeout", () => req.destroy(new Error("tempo esgotado")));
    req.on("error", (x) => reject(x));
    req.end();
  });
}
async function ler(rota, tentativa = 0) {
  try {
    const r = await pedir(rota);
    if (r.status < 200 || r.status >= 300 || r.json === null) throw new Error("o app respondeu " + r.status);
    return r.json;
  } catch (x) {
    if (tentativa < 2) { await new Promise((z) => setTimeout(z, 600 * (tentativa + 1))); return ler(rota, tentativa + 1); }
    throw Object.assign(new Error("O app não respondeu: " + (x && x.message) + (x && x.code ? " (" + x.code + ")" : "")), { statusCode: 503 });
  }
}

const STATUS = ["criado", "em_andamento", "cadastro_aprovado", "finalizado", "cancelado"];
const cache = new Map();   // id -> {em, todas}
const VALE = 5 * 60 * 1000;

// todas as indicações de UMA revendedora do app (todas as páginas, 200 por vez), com cache de 5 minutos
async function todasDe(id, forcar) {
  const g = cache.get(id);
  if (!forcar && g && Date.now() - g.em < VALE) return g.todas;
  const todas = [];
  for (let offset = 0, mais = true; mais && offset < 5000; offset += 200) {
    const j = await ler("/admin/indicacoes?revendedoraId=" + id + "&limit=200&offset=" + offset);
    todas.push(...(j.indicacoes || []));
    mais = !!(j.paginacao && j.paginacao.hasMore);
  }
  cache.set(id, { em: Date.now(), todas });
  return todas;
}
function contar(todas) {
  const c = Object.fromEntries(STATUS.map((s) => [s, 0])); c.total = 0;
  for (const x of todas) { if (c[x.status] !== undefined) c[x.status]++; c.total++; }
  c.trouxe = c.cadastro_aprovado + c.finalizado;
  return c;
}

// quem foi indicada por essa influencer: nome e WhatsApp completos (pedido do Marcus, 12/11/2026), com a situação de cada uma
export async function listarIndicadas(id, { forcar = false } = {}) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw Object.assign(new Error("ID no app inválido."), { statusCode: 400 });
  const todas = await todasDe(n, forcar);
  return todas.map((x) => ({ id: x.id, nome: (x.indicada && x.indicada.nome) || "", whatsapp: (x.indicada && x.indicada.whatsapp) || "", status: x.status, statusLabel: x.statusLabel || x.status, criadoEm: x.criadoEm, statusAlteradoEm: x.statusAlteradoEm }));
}

// ids = lista de números (ID no app de cada influencer). Devolve {id: contagem}; quem falhar vem com {erro}.
export async function contarIndicacoes(ids, { forcar = false } = {}) {
  const lista = [...new Set((ids || []).map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 60);
  const saida = {};
  for (const id of lista) {
    try { saida[id] = contar(await todasDe(id, forcar)); }
    catch (x) { saida[id] = { erro: (x && x.message) || "falhou" }; }
  }
  return saida;
}
