// DevMaster (ERP): lista de revendedoras. Contrato copiado do admin antigo (apps/backend/src/lib/indicacoes/devmaster*.ts):
//   GET {DEVMASTER_API_URL}/appsorelly/revendedoras   com o cabeçalho  token: <DEVMASTER_API_KEY>   (Bearer e x-api-key o ERP ignora)
//   devolve uma lista de {id, nome, cpfcnpj, email, celular, municipio, uf, vendedor, nome_fantasia}. A lista inteira vem de uma vez, por isso fica em cache por 10 minutos.
// A chave NUNCA vai para o Git nem para o front: fica só no .env do servidor. Aqui só há LEITURA da DevMaster; nada é escrito lá.
const TTL = 10 * 60 * 1000;
const G = globalThis;   // cache sobrevive às recargas do modo de desenvolvimento

const texto = (v) => (typeof v === "string" ? v.trim() : "");
export const norm = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const semZeros = (t) => String(t || "").trim().replace(/^0+(?=\d)/, "");

async function pedir(caminho) {
  const base = (process.env.DEVMASTER_API_URL || "").replace(/\/$/, ""), chave = process.env.DEVMASTER_API_KEY || "";
  if (!base || !chave) { const e = new Error("A DevMaster ainda não está configurada no servidor (DEVMASTER_API_URL e DEVMASTER_API_KEY)."); e.statusCode = 503; throw e; }
  let r;
  try { r = await fetch(base + caminho, { headers: { token: chave }, signal: AbortSignal.timeout(30000), cache: "no-store" }); }
  catch (x) { const e = new Error("A DevMaster não respondeu."); e.statusCode = 503; throw e; }
  const corpo = await r.json().catch(() => null);
  if (r.status !== 200 || !Array.isArray(corpo)) { const e = new Error("A DevMaster respondeu fora do esperado (" + r.status + ")."); e.statusCode = 503; throw e; }
  return corpo;
}

export async function listaDevmaster(forcar = false) {
  const cache = G.__sorellyDevmasterCache;
  if (!forcar && cache && Date.now() - cache.em < TTL) return cache.itens;
  if (G.__sorellyDevmasterPendente) return G.__sorellyDevmasterPendente;
  G.__sorellyDevmasterPendente = pedir("/appsorelly/revendedoras").then((bruto) => {
    const itens = bruto.filter((x) => x && typeof x.id === "string" && typeof x.nome === "string")
      .map((x) => ({ codigo: x.id, nome: texto(x.nome), documento: texto(x.cpfcnpj), email: texto(x.email), celular: texto(x.celular), cidade: texto(x.municipio), uf: texto(x.uf), vendedor: texto(x.vendedor), fantasia: texto(x.nome_fantasia) }));
    G.__sorellyDevmasterCache = { itens, em: Date.now() }; return itens;
  }).finally(() => { G.__sorellyDevmasterPendente = null; });
  return G.__sorellyDevmasterPendente;
}

// vendedor "02" casa com "02", "2" ou um texto que contenha "02" como palavra (ex.: "02 - SORELLY"); sem filtro devolve todas
export const casaVendedor = (item, filtro) => {
  if (!filtro) return true;
  const v = norm(item.vendedor), f = norm(filtro);
  return v === f || semZeros(v) === semZeros(f) || new RegExp("(^|[^0-9a-z])" + f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^0-9a-z]|$)").test(v);
};
