// Painel das representantes com dados REAIS do app (05/11/2026, Marcus): quantas revendedoras cada representante tem e quanto vendeu pelo app.
// Só leitura (GET) na API do app (MOBILE_API_URL + MOBILE_API_KEY). Guia: docs/app-sorelly/API-LEITURA.md
//   /admin/representantes                      -> cadastro: código, nome, CPF/CNPJ, % de comissão, ativo, revendedorasCount (revendedoras vinculadas no app)
//   /representantes/home-summary?representativeCod=X&incluirInativas=true -> vendido, valor de acerto, peças, condicionais (soma dos cartões da home de cada revendedora)
// Cache de 5 minutos na memória do servidor (são 28 chamadas); ?atualizar=1 ignora o cache.

import http from "node:http";
import https from "node:https";
import tls from "node:tls";

function config() {
  const base = (process.env.MOBILE_API_URL || "").trim().replace(/\/+$/, ""), chave = (process.env.MOBILE_API_KEY || "").trim();
  if (!base || !chave) throw Object.assign(new Error("A API do app ainda não está configurada no servidor (MOBILE_API_URL e MOBILE_API_KEY)."), { statusCode: 503 });
  return { base, chave };
}
// Antivírus e proxies do Windows (Avast) trocam o certificado da conexão segura; o Node sozinho não confia neles. Como em src/server/devmaster2.js: além das autoridades padrão,
// usamos as do sistema. A verificação do certificado continua LIGADA (nada de rejectUnauthorized:false).
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
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

// roda no máximo `n` chamadas ao mesmo tempo (não derruba a API do app)
async function emLotes(lista, n, fn) {
  const saida = new Array(lista.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, lista.length) }, async () => { while (i < lista.length) { const k = i++; saida[k] = await fn(lista[k], k); } }));
  return saida;
}

let cache = null; // {em, dados}
export async function painelRepresentantes({ forcar = false } = {}) {
  if (!forcar && cache && Date.now() - cache.em < 5 * 60 * 1000) return { ...cache.dados, cache: true };
  const cad = await ler("/admin/representantes");
  const reps = Array.isArray(cad && cad.data) ? cad.data : [];
  const resumos = await emLotes(reps, 5, async (r) => {
    try { return await ler("/representantes/home-summary?representativeCod=" + encodeURIComponent(r.cod) + "&incluirInativas=true"); } catch { return null; }
  });
  const itens = reps.map((r, k) => {
    const h = resumos[k];
    return {
      cod: String(r.cod), nome: String(r.nome || ""), ativo: r.ativo !== false, comissaoPct: num(r.commissionPct),
      revendedorasNoApp: num(r.revendedorasCount),   // revendedoras vinculadas a ela no app
      revendedorasComVenda: h ? num(h.revendedorasCount) : null,   // revendedoras que entram na soma da home (com cartão de vendas)
      vendido: h ? num(h.totalSales) : null, valorAcerto: h ? num(h.settlementValue) : null, pecas: h ? num(h.piecesSold) : null,
      condicionais: h ? num(h.enabledCondicionaisCount) : null, acertoMaisCedo: h ? h.earliestSettlementDate || null : null,
      leitura: h ? "ok" : "falhou",
    };
  }).sort((a, b) => (b.vendido || 0) - (a.vendido || 0) || a.nome.localeCompare(b.nome));
  const dados = { atualizadoEm: new Date().toISOString(), total: itens.length, falhas: itens.filter((i) => i.leitura !== "ok").length, itens };
  cache = { em: Date.now(), dados };
  return { ...dados, cache: false };
}
