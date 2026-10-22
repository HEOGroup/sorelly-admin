// DevMaster (ERP): lista de revendedoras. Contrato copiado do admin antigo (apps/backend/src/lib/indicacoes/devmaster*.ts):
//   GET {DEVMASTER_API_URL}/appsorelly/revendedoras   com o cabeçalho  token: <DEVMASTER_API_KEY>   (Bearer e x-api-key o ERP ignora)
//   devolve uma lista de {id, nome, cpfcnpj, email, celular, municipio, uf, vendedor, nome_fantasia}. A lista inteira vem de uma vez, por isso fica em cache por 10 minutos.
// A chave NUNCA vai para o Git nem para o front: fica só no .env do servidor. Aqui só há LEITURA da DevMaster; nada é escrito lá.
import { consulta } from "./db.js";
import { soDiretoria } from "./auth.js";

const TTL = 10 * 60 * 1000;
let cache = null, pendente = null;

const texto = (v) => (typeof v === "string" ? v.trim() : "");
const norm = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const semZeros = (t) => String(t || "").trim().replace(/^0+(?=\d)/, "");

async function pedir(caminho) {
  const base = (process.env.DEVMASTER_API_URL || "").replace(/\/$/, ""), chave = process.env.DEVMASTER_API_KEY || "";
  if (!base || !chave) { const e = new Error("A DevMaster ainda não está configurada no servidor (DEVMASTER_API_URL e DEVMASTER_API_KEY)."); e.statusCode = 503; throw e; }
  let r;
  try { r = await fetch(base + caminho, { headers: { token: chave }, signal: AbortSignal.timeout(30000) }); }
  catch { const e = new Error("A DevMaster não respondeu."); e.statusCode = 503; throw e; }
  const corpo = await r.json().catch(() => null);
  if (r.status !== 200 || !Array.isArray(corpo)) { const e = new Error("A DevMaster respondeu fora do esperado (" + r.status + ")."); e.statusCode = 503; throw e; }
  return corpo;
}

export async function listaDevmaster(forcar = false) {
  if (!forcar && cache && Date.now() - cache.em < TTL) return cache.itens;
  if (pendente) return pendente;
  pendente = pedir("/appsorelly/revendedoras").then((bruto) => {
    const itens = bruto.filter((x) => x && typeof x.id === "string" && typeof x.nome === "string")
      .map((x) => ({ codigo: x.id, nome: texto(x.nome), documento: texto(x.cpfcnpj), email: texto(x.email), celular: texto(x.celular), cidade: texto(x.municipio), uf: texto(x.uf), vendedor: texto(x.vendedor), fantasia: texto(x.nome_fantasia) }));
    cache = { itens, em: Date.now() }; return itens;
  }).finally(() => { pendente = null; });
  return pendente;
}

// vendedor "02" casa com "02", "2" ou um texto que contenha "02" como palavra (ex.: "02 - SORELLY"); sem filtro devolve todas
const casaVendedor = (item, filtro) => {
  if (!filtro) return true;
  const v = norm(item.vendedor), f = norm(filtro);
  return v === f || semZeros(v) === semZeros(f) || new RegExp("(^|[^0-9a-z])" + f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^0-9a-z]|$)").test(v);
};

export async function rotasDevmaster(app) {
  const auth = { onRequest: [app.autenticar] }, dir = { onRequest: [app.autenticar, soDiretoria] };
  const tratar = (fn) => async (req, reply) => { try { return await fn(req, reply); } catch (e) { if (e.statusCode === 503) return reply.code(503).send({ erro: e.message }); throw e; } };

  // lista (opcional: ?vendedor=02&busca=ana&atualizar=1)
  app.get("/devmaster/revendedoras", { ...auth, schema: { querystring: { type: "object", properties: { vendedor: { type: "string" }, busca: { type: "string" }, atualizar: { type: "string" } } } } }, tratar(async (req) => {
    const q = req.query, b = norm(q.busca), d = (q.busca || "").replace(/\D/g, "");
    const todas = await listaDevmaster(q.atualizar === "1");
    const itens = todas.filter((i) => casaVendedor(i, q.vendedor) && (!b || norm(i.nome).includes(b) || (d.length >= 3 && (i.documento.replace(/\D/g, "").includes(d) || i.celular.replace(/\D/g, "").includes(d)))));
    return { total: itens.length, totalDevmaster: todas.length, itens };
  }));

  // quais valores existem no campo "vendedor" (para saber como a representante Sorelly 02 aparece)
  app.get("/devmaster/vendedores", auth, tratar(async () => {
    const c = {}; (await listaDevmaster()).forEach((i) => { c[i.vendedor || "(vazio)"] = (c[i.vendedor || "(vazio)"] || 0) + 1; });
    return { vendedores: Object.entries(c).map(([vendedor, revendedoras]) => ({ vendedor, revendedoras })).sort((a, b) => b.revendedoras - a.revendedoras) };
  }));

  // grava no banco as revendedoras internas (tabela atendimento_revendedora): cria as novas e atualiza nome e telefone das que já têm o mesmo código
  app.post("/devmaster/sincronizar-internas", { ...dir, schema: { body: { type: "object", required: ["vendedor"], properties: { vendedor: { type: "string", minLength: 1 } } } } }, tratar(async (req) => {
    const lista = (await listaDevmaster(true)).filter((i) => casaVendedor(i, req.body.vendedor));
    let criadas = 0, atualizadas = 0;
    for (const i of lista) {
      const contatos = JSON.stringify(i.celular ? [{ nome: "WhatsApp da revendedora", fone: i.celular }] : []);
      const ja = await consulta('select id from sorelly.atendimento_revendedora where "codigoExterno" = $1 limit 1', [i.codigo]);
      if (ja.rows[0]) {
        await consulta('update sorelly.atendimento_revendedora set nome = $2, contatos = case when $3::jsonb = \'[]\'::jsonb then contatos else $3::jsonb end, "updatedAt" = now() where id = $1', [ja.rows[0].id, i.nome, contatos]);
        atualizadas++;
      } else {
        await consulta('insert into sorelly.atendimento_revendedora (id, nome, "codigoExterno", contatos, "updatedAt") values (gen_random_uuid()::text, $1, $2, $3::jsonb, now())', [i.nome, i.codigo, contatos]);
        criadas++;
      }
    }
    return { vendedor: req.body.vendedor, encontradas: lista.length, criadas, atualizadas };
  }));
}
