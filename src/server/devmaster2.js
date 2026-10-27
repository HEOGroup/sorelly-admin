// DevMaster API 2 (somente LEITURA). Spec em docs/devmaster/openapi.yaml.
//   GET {DEVMASTER_API_URL_V2}/{codigo}   cabeçalho  Token: <JWT>   corpo JSON opcional {pagina, registros, campos, ordem, filtro, empresa, filial}
//   {codigo} = código da tabela (ex.: dmaam clientes, dmaaa produtos, dmabh pedidos de venda; dicionário em dmzag e dmzae).
// O GET leva um CORPO JSON, coisa que o fetch do Node não permite; por isso usa node:https. A chave NUNCA vai para o Git nem para a tela: fica só no .env.local do servidor.
// Escritas (POST) NÃO existem aqui de propósito: a Sorelly só lê do DevMaster.
import http from "node:http";
import https from "node:https";
import tls from "node:tls";

const CODIGO = /^[a-z]{2,5}\d{0,3}$/;   // dmaam, dmaam01, dmzag...
const TEMPO = 30000;

// O servidor da DevMaster entrega o certificado SEM o certificado intermediário ("unable to verify the first certificate").
// Navegadores e o Windows completam sozinhos; o Node não. Por isso, além das autoridades padrão, usamos as do sistema (onde o Windows já tem o intermediário).
// Em servidor Linux (Vercel) isso não resolve: lá a DevMaster precisa mandar a cadeia completa ou o intermediário vai em NODE_EXTRA_CA_CERTS. A verificação do certificado continua LIGADA.
let agente = null;
function agenteTls() {
  if (agente) return agente;
  let ca;
  try { ca = [...tls.getCACertificates("default"), ...tls.getCACertificates("system")]; } catch (x) { ca = undefined; }
  agente = new https.Agent(ca ? { ca, keepAlive: true } : { keepAlive: true });
  return agente;
}

function config() {
  const base = (process.env.DEVMASTER_API_URL_V2 || "").trim().replace(/\/+$/, "");
  const chave = (process.env.DEVMASTER_API_KEY_V2 || "").trim();
  if (!base || !chave) throw Object.assign(new Error("A DevMaster (API 2) ainda não está configurada no servidor (DEVMASTER_API_URL_V2 e DEVMASTER_API_KEY_V2)."), { statusCode: 503 });
  return { base, chave };
}

// Tabelas e relatórios que o token libera (claim "tabelas"), lidos do próprio token. Só o JWT é decodificado aqui; a assinatura quem confere é o DevMaster.
export function liberadoNoToken() {
  const { chave } = config();
  try {
    const p = JSON.parse(Buffer.from(chave.split(".")[1], "base64url").toString("utf8"));
    const l = Array.isArray(p.tabelas) ? p.tabelas : [];
    return { tabelas: l.filter((x) => !x.startsWith("rel:")).sort(), relatorios: l.filter((x) => x.startsWith("rel:")).map((x) => x.slice(4)).sort(), expiraEm: p.exp ? new Date(p.exp * 1000).toISOString() : null };
  } catch (x) { return { tabelas: [], relatorios: [], expiraEm: null }; }
}

function pedir(caminho, corpo) {
  const { base, chave } = config();
  const url = new URL(base + caminho);
  const dados = corpo && Object.keys(corpo).length ? JSON.stringify(corpo) : null;
  const lib = url.protocol === "http:" ? http : https;
  return new Promise((resolve, reject) => {
    const req = lib.request(url, { method: "GET", ...(lib === https ? { agent: agenteTls() } : {}), headers: { Token: chave, Accept: "application/json", ...(dados ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(dados) } : {}) }, timeout: TEMPO }, (res) => {
      const partes = [];
      res.on("data", (c) => partes.push(c));
      res.on("end", () => {
        const texto = Buffer.concat(partes).toString("utf8");
        let json = null; try { json = JSON.parse(texto); } catch (x) { /* resposta que não é JSON */ }
        resolve({ status: res.statusCode, json, texto });
      });
    });
    req.on("timeout", () => req.destroy(new Error("tempo")));
    req.on("error", (e) => { console.error("[devmaster2]", e && e.message); reject(Object.assign(new Error("A DevMaster (API 2) não respondeu."), { statusCode: 503 })); });
    if (dados) req.write(dados);
    req.end();
  });
}

// Lista os registros de uma tabela. opcoes: {pagina, registros (máx. 500), campos:[...], ordem:"campo desc", filtro:{...}, empresa, filial}
export async function consultarTabela(codigo, opcoes = {}) {
  if (!CODIGO.test(codigo)) throw Object.assign(new Error("Código de tabela inválido."), { statusCode: 400 });
  const corpo = {};
  if (Number.isInteger(opcoes.pagina) && opcoes.pagina >= 0) corpo.pagina = opcoes.pagina;
  corpo.registros = Math.min(500, Math.max(1, Number.isInteger(opcoes.registros) ? opcoes.registros : 50));
  if (Array.isArray(opcoes.campos) && opcoes.campos.length) corpo.campos = opcoes.campos.map(String).slice(0, 80);
  if (typeof opcoes.ordem === "string" && opcoes.ordem) corpo.ordem = opcoes.ordem.slice(0, 200);
  if (opcoes.filtro && typeof opcoes.filtro === "object") corpo.filtro = opcoes.filtro;
  if (opcoes.empresa) corpo.empresa = String(opcoes.empresa);
  if (opcoes.filial) corpo.filial = String(opcoes.filial);
  const r = await pedir("/" + codigo, corpo);
  if (r.status === 200 && Array.isArray(r.json)) return { codigo, registros: r.json.length, itens: r.json };
  const msg = (r.json && ((Array.isArray(r.json.erros) && r.json.erros.map((x) => x.mensagem).join("; ")) || r.json.erro || r.json.mensagem || r.json.message || r.json.error)) || (r.texto ? String(r.texto).slice(0, 200) : "") || ("a DevMaster respondeu " + r.status);
  throw Object.assign(new Error(r.status === 403 ? "O token da DevMaster não libera a tabela " + codigo + "." : String(msg)), { statusCode: r.status === 403 ? 403 : r.status === 404 ? 404 : r.status === 400 ? 400 : 503 });
}

// ---------------------------------------------------------------------------------------------------------------------
// Revendedoras com KIT ATIVO. Na DevMaster, o kit consignado é o CONDICIONAL (tabela dmafi): status "A" = aberto (tem saldo, sem fechamento), "F" = fechado.
// Uma revendedora pode ter vários condicionais abertos (o kit vem em 1 a 4 condicionais). Cada revendedora é o cliente (dmaam, aam_codigo = afi_cliente).
// Resultado em cache por 10 minutos. dias (opcional): só conta condicionais abertos criados nos últimos N dias (os de anos atrás costumam ser kits esquecidos).
const TTL_KIT = 10 * 60 * 1000;
const G = globalThis;

export async function todasAsPaginas(codigo, base) {
  let pagina = 0, tudo = [];
  for (;;) {
    const r = await consultarTabela(codigo, { ...base, pagina, registros: 500, ordem: "dm_id" });
    tudo = tudo.concat(r.itens);
    if (r.registros < 500 || pagina >= 60) return tudo;
    pagina++;
  }
}

export async function revendedorasComKitAtivo({ dias, forcar = false } = {}) {
  const chave = String(dias || 0), c = (G.__sorellyKitAtivo = G.__sorellyKitAtivo || {});
  if (!forcar && c[chave] && Date.now() - c[chave].em < TTL_KIT) return c[chave].dados;
  const cond = await todasAsPaginas("dmafi", { filtro: { afi_status: "A" }, campos: ["afi_codigo", "afi_cliente", "afi_vendedor", "afi_data", "afi_valorsaldo", "afi_valormerc", "afi_qtditens", "afi_xreposicao"] });
  const corte = dias ? Date.now() - dias * 86400000 : 0;
  const porCliente = new Map();
  for (const x of cond) {
    if (corte && new Date(x.afi_data).getTime() < corte) continue;
    const k = x.afi_cliente; if (!k) continue;
    const m = porCliente.get(k) || { codigo: k, representante: x.afi_vendedor || "", condicionaisAbertos: 0, valorSaldo: 0, primeiroKit: x.afi_data, ultimoKit: x.afi_data, reposicao: false };
    m.condicionaisAbertos++; m.valorSaldo += Number(x.afi_valorsaldo || 0);
    if (x.afi_data < m.primeiroKit) m.primeiroKit = x.afi_data;
    if (x.afi_data > m.ultimoKit) { m.ultimoKit = x.afi_data; m.representante = x.afi_vendedor || m.representante; }
    if (x.afi_xreposicao === "S") m.reposicao = true;
    porCliente.set(k, m);
  }
  const codigos = [...porCliente.keys()], pessoas = new Map();
  for (let i = 0; i < codigos.length; i += 250) {
    const lote = await consultarTabela("dmaam", { registros: 500, campos: ["aam_codigo", "aam_nome", "aam_municipio", "aam_estado", "aam_celular", "aam_whatsapp"], filtro: { aam_codigo: { in: codigos.slice(i, i + 250) } } });
    lote.itens.forEach((p) => pessoas.set(p.aam_codigo, p));
  }
  const itens = codigos.map((k) => { const m = porCliente.get(k), p = pessoas.get(k) || {};
    return { ...m, valorSaldo: Math.round(m.valorSaldo * 100) / 100, nome: p.aam_nome || "", cidade: p.aam_municipio || "", uf: p.aam_estado || "", celular: p.aam_celular || p.aam_whatsapp || "" }; })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const dados = { geradoEm: new Date().toISOString(), dias: dias || null, condicionaisAbertos: cond.length, revendedoras: itens.length, itens };
  c[chave] = { dados, em: Date.now() };
  return dados;
}
