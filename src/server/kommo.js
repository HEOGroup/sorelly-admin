// Kommo (CRM) · SÓ LEITURA (17/11/2026). Acesso: KOMMO_API_URL + KOMMO_ACCESS_TOKEN no .env.local / Vercel. Nunca escreve no Kommo.
// Devolve só nomes de etapa e QUANTIDADE de leads por etapa (sem dados de pessoa). Cache de 5 min por servidor.
import https from "node:https";
import tls from "node:tls";

const FUNIL_CADASTRO = 14137091;   // funil "Cadastro" (14 etapas), id visto em 17/11/2026
let agente, cache = null;

function ag() {
  if (agente) return agente;
  let ca; try { ca = [...tls.getCACertificates("default"), ...tls.getCACertificates("system")]; } catch (x) { ca = undefined; }   // antivírus do Windows troca o certificado
  agente = new https.Agent(ca ? { ca, keepAlive: true } : { keepAlive: true });
  return agente;
}

function pedir(rota) {
  const base = String(process.env.KOMMO_API_URL || "").replace(/\/+$/, ""), token = process.env.KOMMO_ACCESS_TOKEN || "";
  if (!base || !token) throw Object.assign(new Error("Falta KOMMO_API_URL ou KOMMO_ACCESS_TOKEN (veja .env.exemplo)."), { statusCode: 503 });
  return new Promise((ok, erro) => {
    const req = https.request(new URL(base + rota), { method: "GET", agent: ag(), timeout: 30000, headers: { Authorization: "Bearer " + token, Accept: "application/json" } }, (res) => {
      const p = []; res.on("data", (c) => p.push(c));
      res.on("end", () => { const t = Buffer.concat(p).toString("utf8"); let j = null; try { j = JSON.parse(t); } catch (x) { /* vazio (204) */ } ok({ status: res.statusCode, j }); });
    });
    req.on("timeout", () => req.destroy(new Error("tempo esgotado"))); req.on("error", erro); req.end();
  });
}

export async function kommoFunilCadastro({ forcar = false } = {}) {
  if (!forcar && cache && Date.now() - cache.em < 300000) return cache.v;
  const f = await pedir("/api/v4/leads/pipelines/" + FUNIL_CADASTRO);
  if (f.status !== 200) throw Object.assign(new Error("Kommo não respondeu (" + f.status + ")."), { statusCode: 503 });
  const etapas = ((f.j._embedded && f.j._embedded.statuses) || []).sort((a, b) => a.sort - b.sort).map((s) => ({ id: s.id, nome: s.name, n: 0 }));
  const porId = Object.fromEntries(etapas.map((s) => [s.id, s]));
  let total = 0;
  for (let pg = 1; pg <= 40; pg++) {   // até 10.000 leads
    const r = await pedir("/api/v4/leads?limit=250&page=" + pg + "&filter[pipeline_id]=" + FUNIL_CADASTRO);
    if (r.status === 204 || !r.j) break;
    if (r.status !== 200) throw Object.assign(new Error("Kommo não respondeu (" + r.status + ")."), { statusCode: 503 });
    const ls = (r.j._embedded && r.j._embedded.leads) || [];
    ls.forEach((l) => { if (porId[l.status_id]) porId[l.status_id].n++; total++; });
    if (ls.length < 250) break;
  }
  const v = { funil: FUNIL_CADASTRO, total, etapas, atualizadoEm: new Date().toISOString() };
  cache = { v, em: Date.now() };
  return v;
}
