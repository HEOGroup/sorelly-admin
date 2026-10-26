// Aba Revendedoras (base de todos os setores): lê da DevMaster API 2 (só leitura) e entrega ao sistema a lista e a ficha de cada revendedora.
// Regras (Marcus, 26/10/2026; casos Valéria Nogueira e Ana Claudia Adriano; decisões em docs/DECISOES.md):
//  - Revendedora = quem tem condicional ABERTO (dmafi, status "A") com previsão de devolução em 2026. Cliente sem condicional não entra.
//  - Vendedor 04 (Expositor) e 91 (Encomendas) NÃO são representantes: são só a marca do tipo de condicional. A representante da revendedora é a das outras condicionais:
//    a do kit principal (o condicional grande mais antigo, sem a marca de reposição).
//  - Tipo da condicional: Expositor (vendedor 04 ou previsão no ano 3000), Encomenda (vendedor 91), Reposição (marca S), Kit principal (o mais antigo sem a marca),
//    Kit novo (criado 20 dias ou mais depois do principal) e Reposição / peças do próximo mês (criado antes de 20 dias). A funcionária vai poder corrigir o tipo (etapa 3).
import { consultarTabela, todasAsPaginas } from "./devmaster2.js";

const TTL = 10 * 60 * 1000;
const G = globalThis;
const NAO_REP = new Set(["04", "91"]);
const PARTICULAS = new Set(["da", "de", "do", "dos", "das", "e"]);

// "NAYALE EMANUELE CALIXTO" vira "Nayale Emanuele Calixto"
export function nomeNormal(t) {
  return String(t || "").trim().replace(/\s+/g, " ").toLowerCase().split(" ")
    .map((p, i) => (i > 0 && PARTICULAS.has(p)) ? p : p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}
const semCodigoNoFim = (t) => String(t || "").replace(/\s+\d{4,}\s*$/, "");   // alguns vendedores vêm como "NOME 002910"

async function vendedores() {
  if (G.__sorellyVend && Date.now() - G.__sorellyVend.em < TTL * 6) return G.__sorellyVend.mapa;
  const itens = await todasAsPaginas("dmaao", { campos: ["aao_codigo", "aao_nome"] });
  const mapa = new Map(itens.map((x) => [String(x.aao_codigo).trim(), nomeNormal(semCodigoNoFim(x.aao_nome))]));
  G.__sorellyVend = { mapa, em: Date.now() };
  return mapa;
}

// A DevMaster guarda o município do cliente como CÓDIGO (ex.: 3782); o nome está na tabela dmaal (Municípios).
async function municipios(codigos) {
  const c = (G.__sorellyMun = G.__sorellyMun || new Map()), faltam = [...new Set(codigos.filter(Boolean))].filter((k) => !c.has(k));
  for (let i = 0; i < faltam.length; i += 250) {
    const r = await consultarTabela("dmaal", { registros: 500, campos: ["aal_codigo", "aal_descricao", "aal_estado"], filtro: { aal_codigo: { in: faltam.slice(i, i + 250) } } });
    r.itens.forEach((m) => c.set(String(m.aal_codigo), { nome: nomeNormal(m.aal_descricao), uf: String(m.aal_estado || "").toUpperCase() }));
  }
  return c;
}

const ano = (x) => Number(String(x.afi_prevdevol || "").slice(0, 4));
const t = (d) => new Date(d).getTime();

// Define o tipo de cada condicional aberto de UMA revendedora (lista já filtrada). Devolve Map(codigo → tipo).
export function tiposDasCondicionais(lista) {
  const tipos = new Map();
  const comuns = [];
  for (const x of lista) {
    if (x.afi_vendedor === "04" || ano(x) >= 2100) tipos.set(x.afi_codigo, "Expositor");
    else if (x.afi_vendedor === "91") tipos.set(x.afi_codigo, "Encomenda");
    else if (x.afi_xreposicao === "S") tipos.set(x.afi_codigo, "Reposição");
    else comuns.push(x);
  }
  comuns.sort((a, b) => t(a.afi_data) - t(b.afi_data));
  comuns.forEach((x, i) => {
    if (i === 0) tipos.set(x.afi_codigo, "Kit principal");
    else tipos.set(x.afi_codigo, (t(x.afi_data) - t(comuns[0].afi_data)) / 86400000 >= 20 ? "Kit novo" : "Reposição / peças do próximo mês");
  });
  return tipos;
}

// Representante da revendedora: vendedor do kit principal (ignora expositor e encomendas). Sem nenhum: vazio.
function representanteDe(lista) {
  const reais = lista.filter((x) => !NAO_REP.has(x.afi_vendedor) && ano(x) < 2100);
  if (!reais.length) return "";
  const p = reais.filter((x) => x.afi_xreposicao !== "S").sort((a, b) => t(a.afi_data) - t(b.afi_data))[0] || reais.sort((a, b) => t(a.afi_data) - t(b.afi_data))[0];
  return p.afi_vendedor;
}

// A primeira leva: revendedoras com condicional aberto e previsão em 2026. Cache de 10 minutos.
export async function listaRevendedoras({ forcar = false } = {}) {
  if (!forcar && G.__sorellyRevs && G.__sorellyRevs.v === 2 && Date.now() - G.__sorellyRevs.em < TTL) return G.__sorellyRevs.dados;
  const [cond, vend] = await Promise.all([
    todasAsPaginas("dmafi", { filtro: { afi_status: "A", afi_prevdevol: { between: ["2026-01-01T00:00:00", "2026-12-31T23:59:59"] } }, campos: ["afi_codigo", "afi_cliente", "afi_vendedor", "afi_data", "afi_xreposicao", "afi_prevdevol", "afi_qtditens", "afi_valormerc"] }),
    vendedores(),
  ]);
  const porCliente = new Map();
  cond.forEach((x) => { if (x.afi_cliente) (porCliente.get(x.afi_cliente) || porCliente.set(x.afi_cliente, []).get(x.afi_cliente)).push(x); });
  const codigos = [...porCliente.keys()], pessoas = new Map();
  for (let i = 0; i < codigos.length; i += 250) {
    const lote = await consultarTabela("dmaam", { registros: 500, campos: ["aam_codigo", "aam_nome", "aam_municipio", "aam_estado", "aam_celular", "aam_whatsapp", "aam_situacao"], filtro: { aam_codigo: { in: codigos.slice(i, i + 250) } } });
    lote.itens.forEach((p) => pessoas.set(p.aam_codigo, p));
  }
  const mun = await municipios([...pessoas.values()].map((p) => String(p.aam_municipio || "")));
  const itens = codigos.map((cod) => {
    const rep = representanteDe(porCliente.get(cod)), p = pessoas.get(cod) || {}, m = mun.get(String(p.aam_municipio || "")) || {};
    const lista = porCliente.get(cod), tipos = tiposDasCondicionais(lista);
    // conds: cada condicional aberto, compacto (t = tipo, p = peças, v = valor, d = previsão de devolução; vazio = sem previsão ou expositor)
    const conds = lista.map((x) => ({ t: tipos.get(x.afi_codigo), p: Number(x.afi_qtditens) || 0, v: Number(x.afi_valormerc) || 0, d: ano(x) >= 2100 ? "" : String(x.afi_prevdevol || "").slice(0, 10) }));
    return { cod, repCod: rep, representante: rep ? (vend.get(rep) || rep) : "Sem representante", nome: nomeNormal(p.aam_nome), cidade: m.nome || "", uf: m.uf || String(p.aam_estado || "").toUpperCase(),
      celular: p.aam_celular || p.aam_whatsapp || "", situacao: p.aam_situacao === "A" ? "Ativa" : p.aam_situacao === "B" ? "Bloqueada" : "Inativa", conds };
  }).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const dados = { geradoEm: new Date().toISOString(), total: itens.length, itens };
  G.__sorellyRevs = { dados, em: Date.now(), v: 2 };
  return dados;
}

// Ficha: cadastro + todas as condicionais abertas (da última para a primeira), com o tipo de cada uma.
export async function fichaRevendedora(cod) {
  if (!/^\d{1,10}$/.test(cod)) throw Object.assign(new Error("Código inválido."), { statusCode: 400 });
  const [pes, cond, vend] = await Promise.all([
    consultarTabela("dmaam", { registros: 1, filtro: { aam_codigo: cod }, campos: ["aam_codigo", "aam_nome", "aam_fantasia", "aam_endereco", "aam_numero", "aam_complemento", "aam_bairro", "aam_municipio", "aam_estado", "aam_cep", "aam_celular", "aam_whatsapp", "aam_telefone1", "aam_email", "aam_instagram", "aam_datacadastro", "aam_situacao"] }),
    todasAsPaginas("dmafi", { filtro: { afi_cliente: cod, afi_status: "A" }, campos: ["afi_codigo", "afi_data", "afi_prevdevol", "afi_vendedor", "afi_qtditens", "afi_valormerc", "afi_valorsaldo", "afi_xreposicao", "afi_obs", "afi_codagendamento"] }),
    vendedores(),
  ]);
  const p = pes.itens[0];
  if (!p) throw Object.assign(new Error("Revendedora não encontrada."), { statusCode: 404 });
  const mun = (await municipios([String(p.aam_municipio || "")])).get(String(p.aam_municipio || "")) || {};
  const tipos = tiposDasCondicionais(cond), rep = representanteDe(cond);
  const condicionais = cond.sort((a, b) => t(b.afi_data) - t(a.afi_data)).map((x) => ({
    codigo: x.afi_codigo, emissao: String(x.afi_data || "").slice(0, 10), previsao: ano(x) >= 2100 ? null : String(x.afi_prevdevol || "").slice(0, 10),
    vendedorCod: x.afi_vendedor, vendedor: vend.get(x.afi_vendedor) || x.afi_vendedor, pecas: x.afi_qtditens, valor: x.afi_valormerc, saldo: x.afi_valorsaldo,
    tipo: tipos.get(x.afi_codigo), observacao: x.afi_obs || "", agenda: x.afi_codagendamento || "" }));
  const endereco = [p.aam_endereco, p.aam_numero, p.aam_complemento].filter(Boolean).join(", ");
  return {
    cod, nome: nomeNormal(p.aam_nome), fantasia: nomeNormal(p.aam_fantasia), repCod: rep, representante: rep ? (vend.get(rep) || rep) : "Sem representante",
    situacaoCadastro: p.aam_situacao === "A" ? "Ativa" : p.aam_situacao === "B" ? "Bloqueada" : "Inativa",
    cadastradaEm: String(p.aam_datacadastro || "").slice(0, 10),
    endereco: nomeNormal(endereco), bairro: nomeNormal(p.aam_bairro), cidade: mun.nome || "", uf: mun.uf || String(p.aam_estado || "").toUpperCase(), cep: p.aam_cep || "",
    celular: p.aam_celular || "", whatsapp: p.aam_whatsapp || "", telefone: p.aam_telefone1 || "", email: String(p.aam_email || "").toLowerCase(), instagram: p.aam_instagram || "",
    condicionais,
  };
}
