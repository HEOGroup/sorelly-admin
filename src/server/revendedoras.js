// Aba Revendedoras (base de todos os setores): lê da DevMaster API 2 (só leitura) e entrega ao sistema a lista e a ficha de cada revendedora.
// Regras (Marcus, 26/10/2026; casos Valéria Nogueira e Ana Claudia Adriano; decisões em docs/DECISOES.md):
//  - Revendedora = quem tem condicional ABERTO (dmafi, status "A") com previsão de devolução em 2026. Cliente sem condicional não entra.
//  - Vendedor 04 (Expositor) e 91 (Encomendas) NÃO são representantes: são só a marca do tipo de condicional. A representante da revendedora é a das outras condicionais:
//    a do kit principal (o condicional grande mais antigo, sem a marca de reposição).
//  - Tipo da condicional: Expositor (vendedor 04 ou previsão no ano 3000), Encomenda (vendedor 91), Reposição (marca S), Kit principal (o mais antigo sem a marca),
//    Kit novo (criado 20 dias ou mais depois do principal) e Reposição / peças do próximo mês (criado antes de 20 dias). A funcionária vai poder corrigir o tipo (etapa 3).
import { consultarTabela, todasAsPaginas } from "./devmaster2.js";
import { composicaoDoCliente, composicaoGeral, iniciarCargaBrindes, resumoVendas, situacaoBrindes, ultimasVendasDaMedia } from "./vendas-brinde.js";

const TTL = 10 * 60 * 1000;
const DIAS_JANELA = 90;   // devolução prevista para até 90 dias à frente
const DIAS_EMISSAO = 180; // Marcus, 29/10/2026: condicional emitido nos últimos 180 dias (com 90 dava 2.069; a DevMaster do Marcus mostra 2.074)

// Quantas revendedoras (clientes distintos) têm condicional ABERTO emitido nos últimos 180 dias, com devolução prevista
// para até 90 dias à frente. Usado pela atualização automática do total de revendedoras (server/revendedoras-dia.js).
export async function contarRevendedorasHoje() {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const iso = (d) => d.toISOString().slice(0, 19);
  const cond = await todasAsPaginas("dmafi", {
    filtro: { afi_status: "A", afi_data: { gte: iso(new Date(hoje.getTime() - DIAS_EMISSAO * 86400000)) }, afi_prevdevol: { lte: iso(new Date(hoje.getTime() + DIAS_JANELA * 86400000)) } },
    campos: ["afi_cliente"],
  });
  return new Set(cond.map((x) => x.afi_cliente).filter(Boolean)).size;
}
const G = globalThis;
const NAO_REP = new Set(["04", "91"]);
// "Vendedor Sorelly" (atendimento interno) = os três vendedores da própria Sorelly: 02 SORELLY, FE SORELLY FUNCIONARIOS e BY SORELLY REPRESENTANTE.
// Conferido com a tela de retorno de condicionais da DevMaster em 27/10/2026: 203 revendedoras, 232 condicionais, 23.401 peças e R$ 2.114.086,00 (bateu certinho).
export const VENDEDORES_SORELLY = ["02", "FE", "BY"];
const PARTICULAS = new Set(["da", "de", "do", "dos", "das", "e"]);

// "NAYALE EMANUELE CALIXTO" vira "Nayale Emanuele Calixto"
export function nomeNormal(t) {
  return String(t || "").trim().replace(/\s+/g, " ").toLowerCase().split(" ")
    .map((p, i) => (i > 0 && PARTICULAS.has(p)) ? p : p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}
const semCodigoNoFim = (t) => String(t || "").replace(/\s+\d{4,}\s*$/, "");   // alguns vendedores vêm como "NOME 002910"

export async function vendedores() {
  if (G.__sorellyVend && Date.now() - G.__sorellyVend.em < TTL * 6) return G.__sorellyVend.mapa;
  const itens = await todasAsPaginas("dmaao", { campos: ["aao_codigo", "aao_nome"] });
  const mapa = new Map(itens.map((x) => [String(x.aao_codigo).trim(), nomeNormal(semCodigoNoFim(x.aao_nome))]));
  G.__sorellyVend = { mapa, em: Date.now() };
  return mapa;
}

// A DevMaster guarda o município do cliente como CÓDIGO (ex.: 3782); o nome está na tabela dmaal (Municípios).
export async function municipios(codigos) {
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
export function representanteDe(lista) {
  const reais = lista.filter((x) => !NAO_REP.has(x.afi_vendedor) && ano(x) < 2100);
  if (!reais.length) return "";
  const p = reais.filter((x) => x.afi_xreposicao !== "S").sort((a, b) => t(a.afi_data) - t(b.afi_data))[0] || reais.sort((a, b) => t(a.afi_data) - t(b.afi_data))[0];
  return p.afi_vendedor;
}

// ── Expositores (Marcus, 26/10/2026): condicional aberto com previsão no ano 3000 (ou vendedor 04). Os modelos vêm dos itens do condicional (dmafj) e são agrupados para contar juntos (ex.: todos os "dois andares").
const GRUPOS = [[/DOIS ANDARES|2 ANDARES/, "Dois andares"], [/BANDEJA/, "Bandeja"], [/COLAR/, "Colar"], [/PULSEIRA|TORNOZELEIRA|BRACELETE|REL[OÓ]GIO/, "Pulseira"], [/\bANE(L|IS)\b|AN[EÉ]IS/, "Anel"], [/BRINCO/, "Brinco"], [/BUSTO/, "Busto"], [/DISPLAY|CUBO/, "Display e cubo"]];
export function grupoModelo(desc) { const d = String(desc || "").toUpperCase(); for (const [re, g] of GRUPOS) if (re.test(d)) return g; return "Outros"; }

async function itensDeExpositor(codigos) {
  const c = (G.__sorellyItensExp3 = G.__sorellyItensExp3 || new Map()), faltam = [...new Set(codigos)].filter((k) => !c.has(k));
  for (let i = 0; i < faltam.length; i += 100) {
    const lote = faltam.slice(i, i + 100);
    const r = await todasAsPaginas("dmafj", { filtro: { afj_condicional: { in: lote } }, campos: ["afj_condicional", "afj_produto", "afj_descricao", "afj_quantidade", "afj_valorun"] });
    lote.forEach((k) => c.set(k, []));
    r.forEach((x) => { const l = c.get(x.afj_condicional); if (l) l.push({ g: /^(MP|EX|MU|PJ)/i.test(String(x.afj_produto||"").trim()) ? grupoModelo(x.afj_descricao) : "Peças de joia", m: nomeNormal(String(x.afj_descricao || "").trim()), c: String(x.afj_produto || "").trim(), q: Number(x.afj_quantidade) || 0, v: Number(x.afj_valorun) || 0 }); });
  }
  return c;
}

// Últimas vendas (acertos fechados, tabela dmach "Vendas") de cada revendedora: as 3 mais novas dos últimos 20 meses. Cache de 30 minutos por revendedora.
async function vendasDe(clientes) {
  const c = (G.__sorellyVendasRev = G.__sorellyVendasRev || new Map()), agora = Date.now();
  const faltam = [...new Set(clientes)].filter((k) => !c.has(k) || agora - c.get(k).em > 30 * 60 * 1000 || !c.get(k).m);
  const desde = new Date(agora - 760 * 86400000).toISOString().slice(0, 10) + "T00:00:00";   // 24 meses
  const lotes = []; for (let i = 0; i < faltam.length; i += 100) lotes.push(faltam.slice(i, i + 100));
  const um = async (lote) => {
    const r = await todasAsPaginas("dmach", { filtro: { ach_cliente: { in: lote }, ach_situacao: "F", ach_emissao: { gte: desde } }, campos: ["ach_cliente", "ach_emissao", "ach_valormerc"] });
    const por = new Map(lote.map((k) => [k, []]));
    r.forEach((x) => { const l = por.get(x.ach_cliente); if (l) l.push({ d: String(x.ach_emissao || "").slice(0, 10), v: Number(x.ach_valormerc) || 0 }); });
    por.forEach((l, k) => { l.sort((a, b) => b.d.localeCompare(a.d)); const m = {}; l.forEach((x) => { const mes = x.d.slice(0, 7); m[mes] = Math.round(((m[mes] || 0) + x.v) * 100) / 100; }); c.set(k, { em: agora, v: l.slice(0, 3), m }); });
  };
  for (let k = 0; k < lotes.length; k += 4) await Promise.all(lotes.slice(k, k + 4).map(um));
  const m = new Map(); clientes.forEach((k) => m.set(k, c.get(k) || { v: [], m: {} })); return m;
}

// A primeira leva: revendedoras com condicional aberto e previsão em 2026. Cache de 10 minutos.
async function listaBase({ forcar = false } = {}) {
  if (!forcar && G.__sorellyRevs && G.__sorellyRevs.v === 11 && Date.now() - G.__sorellyRevs.em < TTL) return G.__sorellyRevs.dados;
  const campos = ["afi_codigo", "afi_cliente", "afi_vendedor", "afi_data", "afi_xreposicao", "afi_prevdevol", "afi_qtditens", "afi_valormerc", "afi_obs"];
  const [c26, cExp, vend] = await Promise.all([
    todasAsPaginas("dmafi", { filtro: { afi_status: "A", afi_prevdevol: { between: ["2026-01-01T00:00:00", "2026-12-31T23:59:59"] } }, campos }),
    todasAsPaginas("dmafi", { filtro: { afi_status: "A", afi_prevdevol: { gte: "2100-01-01T00:00:00" } }, campos }),
    vendedores(),
  ]);
  const cond = c26.concat(cExp);
  const porCliente = new Map();
  cond.forEach((x) => { if (x.afi_cliente) (porCliente.get(x.afi_cliente) || porCliente.set(x.afi_cliente, []).get(x.afi_cliente)).push(x); });
  const codigos = [...porCliente.keys()], pessoas = new Map();
  for (let i = 0; i < codigos.length; i += 250) {
    const lote = await consultarTabela("dmaam", { registros: 500, campos: ["aam_codigo", "aam_nome", "aam_municipio", "aam_estado", "aam_celular", "aam_whatsapp", "aam_situacao", "aam_nascimento", "aam_datacadastro", "aam_email", "aam_instagram", "aam_bairro", "aam_cep", "aam_xenviaapp", "aam_pessoa"], filtro: { aam_codigo: { in: codigos.slice(i, i + 250) } } });
    lote.itens.forEach((p) => pessoas.set(p.aam_codigo, p));
  }
  const mun = await municipios([...pessoas.values()].map((p) => String(p.aam_municipio || "")));
  // tipos por revendedora; expositores: itens (modelos) e as 3 últimas vendas
  const tiposPor = new Map(codigos.map((k) => [k, tiposDasCondicionais(porCliente.get(k))]));
  const expCods = [], comExp = [];
  codigos.forEach((k) => { const tp = tiposPor.get(k); let tem = false; porCliente.get(k).forEach((x) => { if (tp.get(x.afi_codigo) === "Expositor") { expCods.push(x.afi_codigo); tem = true; } }); if (tem) comExp.push(k); });
  const [itensExp, vendas] = await Promise.all([itensDeExpositor(expCods), vendasDe(codigos)]);
  const itens = codigos.map((cod) => {
    const lista = porCliente.get(cod), tipos = tiposPor.get(cod), rep = representanteDe(lista), p = pessoas.get(cod) || {}, m = mun.get(String(p.aam_municipio || "")) || {};
    // conds: cada condicional aberto, compacto (t = tipo, p = peças, v = valor, d = previsão de devolução (vazio = sem previsão ou expositor), e = emissão, it = modelos do expositor)
    const conds = lista.map((x) => { const t = tipos.get(x.afi_codigo), o = { t, n: String(x.afi_codigo || "").trim(), vd: String(x.afi_vendedor || "").trim(), ob: String(x.afi_obs || "").trim(), p: Number(x.afi_qtditens) || 0, v: Number(x.afi_valormerc) || 0, d: ano(x) >= 2100 ? "" : String(x.afi_prevdevol || "").slice(0, 10), e: String(x.afi_data || "").slice(0, 10) }; if (t === "Expositor") o.it = itensExp.get(x.afi_codigo) || []; return o; });
    const item = { cod, repCod: rep, representante: rep ? (vend.get(rep) || rep) : "Sem representante", nome: nomeNormal(p.aam_nome), cidade: m.nome || "", uf: m.uf || String(p.aam_estado || "").toUpperCase(),
      celular: p.aam_celular || p.aam_whatsapp || "", situacao: p.aam_situacao === "A" ? "Ativa" : p.aam_situacao === "B" ? "Bloqueada" : "Inativa", conds,
      nasc: p.aam_pessoa === "J" ? "" : String(p.aam_nascimento || "").slice(0, 10), cadastro: String(p.aam_datacadastro || "").slice(0, 10), email: String(p.aam_email || "").toLowerCase(), instagram: p.aam_instagram || "", bairro: nomeNormal(p.aam_bairro), cep: p.aam_cep || "", app: p.aam_xenviaapp === "S" };
    if (vendas.has(cod)) { item.vendas = vendas.get(cod).v; item.vm = vendas.get(cod).m; }
    return item;
  }).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const dados = { geradoEm: new Date().toISOString(), total: itens.length, itens };
  G.__sorellyRevs = { dados, em: Date.now(), v: 11 };
  return dados;
}

// Lista final: base da DevMaster + vendas SEM brinde de 2026 (banco). Enquanto a carga dos brindes não termina, vão as vendas brutas e o aviso "brinde.pronto = false".
export async function listaRevendedoras({ forcar = false } = {}) {
  const base = await listaBase({ forcar });
  const st = await situacaoBrindes();
  iniciarCargaBrindes({ forcar });
  if (!st.pronto) return Object.assign({}, base, { brinde: st });
  const comp = await composicaoGeral();
  const itens = base.itens.map((i) => { const c = comp.get(i.cod); return Object.assign({}, i, { vendas: c ? c.v : [], vm: c ? c.vm : {}, bm: c ? c.bm : {}, tm: c ? c.tm : {}, nm: c ? c.nm : {}, am: c ? c.am : {}, liquida: true }); });
  return Object.assign({}, base, { itens, vendasMes: await resumoVendas(), brinde: await situacaoBrindes() });
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
  const expCods = cond.filter((x) => tipos.get(x.afi_codigo) === "Expositor").map((x) => x.afi_codigo);
  const [itensExp, vendasRev] = await Promise.all([itensDeExpositor(expCods), vendasDe([cod])]);
  // histórico completo (Marcus, 27/10/2026): todas as condicionais que a revendedora já teve e todas as vendas (acertos)
  const [histRaw, vendasRaw] = await Promise.all([
    todasAsPaginas("dmafi", { filtro: { afi_cliente: cod }, campos: ["afi_codigo", "afi_data", "afi_status", "afi_prevdevol", "afi_vendedor", "afi_qtditens", "afi_valormerc", "afi_valorvendido", "afi_valorretornado", "afi_valorsaldo", "afi_dtfechamento", "afi_dataacerto", "afi_codagendamento", "afi_xreposicao", "afi_obs"] }),
    todasAsPaginas("dmach", { filtro: { ach_cliente: cod }, campos: ["ach_codigo", "ach_emissao", "ach_situacao", "ach_datacanc", "ach_vendedor", "ach_valormerc", "ach_valordesc", "ach_valoracres", "ach_valortotal", "ach_tipopag"] }),
  ]);
  const st = await situacaoBrindes(), comp = st.pronto ? await composicaoDoCliente(cod) : new Map(), arred = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const d10 = (v) => String(v || "").slice(0, 10), nomeSit = { A: "Aberta", F: "Fechada" };
  const tipoHist = (x) => tipos.get(x.afi_codigo) || (x.afi_vendedor === "04" || ano(x) >= 2100 ? "Expositor" : x.afi_vendedor === "91" ? "Encomenda" : x.afi_xreposicao === "S" ? "Reposição" : "Kit");
  const historico = histRaw.sort((a, b) => t(b.afi_data) - t(a.afi_data)).map((x) => ({
    codigo: x.afi_codigo, emissao: d10(x.afi_data), tipo: tipoHist(x), situacao: nomeSit[x.afi_status] || String(x.afi_status || ""), vendedor: vend.get(x.afi_vendedor) || x.afi_vendedor || "",
    pecas: Number(x.afi_qtditens) || 0, valor: Number(x.afi_valormerc) || 0, vendido: Number(x.afi_valorvendido) || 0, retornado: Number(x.afi_valorretornado) || 0, saldo: Number(x.afi_valorsaldo) || 0,
    previsao: ano(x) >= 2100 ? "" : d10(x.afi_prevdevol), fechamento: d10(x.afi_dtfechamento), acerto: d10(x.afi_dataacerto),
    agenda: String(x.afi_codagendamento || ""), obs: String(x.afi_obs || "").trim() }));
  const vendasTodas = vendasRaw.sort((a, b) => String(b.ach_emissao || "").localeCompare(String(a.ach_emissao || ""))).map((x) => ({
    codigo: x.ach_codigo, emissao: d10(x.ach_emissao), situacao: x.ach_datacanc ? "Cancelada" : x.ach_situacao === "F" ? "Fechada" : String(x.ach_situacao || ""), representante: vend.get(x.ach_vendedor) || x.ach_vendedor || "",
    venda: Number(x.ach_valormerc) || 0, comissao: Number(x.ach_valordesc) || 0, acrescimo: Number(x.ach_valoracres) || 0, acerto: Number(x.ach_valortotal) || 0, pagamento: String(x.ach_tipopag || "") }));
  const condicionais = cond.sort((a, b) => t(b.afi_data) - t(a.afi_data)).map((x) => ({
    codigo: x.afi_codigo, emissao: String(x.afi_data || "").slice(0, 10), previsao: ano(x) >= 2100 ? null : String(x.afi_prevdevol || "").slice(0, 10),
    vendedorCod: x.afi_vendedor, vendedor: vend.get(x.afi_vendedor) || x.afi_vendedor, pecas: x.afi_qtditens, valor: x.afi_valormerc, saldo: x.afi_valorsaldo,
    tipo: tipos.get(x.afi_codigo), itens: itensExp.get(x.afi_codigo) || [], observacao: x.afi_obs || "", agenda: x.afi_codagendamento || "" }));
  const endereco = [p.aam_endereco, p.aam_numero, p.aam_complemento].filter(Boolean).join(", ");
  return {
    cod, nome: nomeNormal(p.aam_nome), fantasia: nomeNormal(p.aam_fantasia), repCod: rep, representante: rep ? (vend.get(rep) || rep) : "Sem representante",
    situacaoCadastro: p.aam_situacao === "A" ? "Ativa" : p.aam_situacao === "B" ? "Bloqueada" : "Inativa",
    cadastradaEm: String(p.aam_datacadastro || "").slice(0, 10),
    endereco: nomeNormal(endereco), bairro: nomeNormal(p.aam_bairro), cidade: mun.nome || "", uf: mun.uf || String(p.aam_estado || "").toUpperCase(), cep: p.aam_cep || "",
    celular: p.aam_celular || "", whatsapp: p.aam_whatsapp || "", telefone: p.aam_telefone1 || "", email: String(p.aam_email || "").toLowerCase(), instagram: p.aam_instagram || "",
    condicionais, ...(() => {
      const vtE = vendasTodas.map((v) => { const c = comp.get(v.codigo); return { ...v, ...(c ? { dia: c.dia, vendedorCod: c.vendedor, brinde: c.brinde, troca: c.troca, indicacao: c.indicacao, premiacao: c.premiacao, outros: c.outros, liquida: c.liquida, acertoLiq: c.acertoLiq } : { brinde: null, troca: null, indicacao: null, premiacao: null, outros: null, liquida: null, acertoLiq: null }) }; });
      const f26 = vtE.filter((v) => v.situacao === "Fechada" && v.liquida !== null), vmL = {};
      f26.forEach((v) => { const m = v.emissao.slice(0, 7); vmL[m] = arred((vmL[m] || 0) + v.liquida); });
      const soma = (k) => arred(f26.reduce((a, v) => a + (v[k] || 0), 0)); // "bruto" = valor de venda da DevMaster (campo venda)
      return { historico, vendasTodas: vtE, brinde: st,
        vendas: st.pronto ? ultimasVendasDaMedia(f26.map((v) => ({ data: v.dia || v.emissao, valor: v.liquida, brinde: v.brinde, vendedor: v.vendedorCod }))) : (vendasRev.get(cod) || { v: [] }).v,
        vendasMes: st.pronto ? vmL : (vendasRev.get(cod) || { m: {} }).m,
        resumo2026: st.pronto ? { n: f26.length, bruto: soma("venda"), liquida: soma("liquida"), brinde: soma("brinde"), troca: soma("troca"), indicacao: soma("indicacao"), premiacao: soma("premiacao"), outros: soma("outros") } : null };
    })(),
  };
}

// ── Agenda do Agendamento (Marcus, 29/10/2026): TODAS as revendedoras com kit ativo.
// Regra: condicional ABERTO (dmafi, status "A") com devolução prevista até 120 dias à frente; a data de emissão NÃO limita (qualquer emissão, "desde 01/01/0100").
// Sem limite para trás: quem já passou da data prevista e continua aberta entra como atrasada. Expositor (previsão no ano 3000) fica de fora pela própria data.
// A data do acerto de cada revendedora = devolução prevista do kit principal (ou do kit novo); sem eles, a mais próxima das outras. Só leitura; cache de 10 min.
const DIAS_AGENDA = 120;
export async function listaAgenda({ forcar = false } = {}) {
  const c = G.__sorellyAgenda;
  if (!forcar && c && c.dados && Date.now() - c.em < TTL) return c.dados;
  if (c && c.pend) return c.pend;
  const pend = (async () => {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const iso = (d) => d.toISOString().slice(0, 19);
    const dia = (x) => String(x || "").slice(0, 10);
    const limite = iso(new Date(hoje.getTime() + DIAS_AGENDA * 86400000));
    const campos = ["afi_codigo", "afi_cliente", "afi_vendedor", "afi_data", "afi_xreposicao", "afi_prevdevol", "afi_qtditens", "afi_valormerc"];
    const [cond, vend] = await Promise.all([todasAsPaginas("dmafi", { filtro: { afi_status: "A", afi_prevdevol: { lte: limite } }, campos }), vendedores()]);
    const porCliente = new Map();
    cond.forEach((x) => { if (x.afi_cliente) (porCliente.get(x.afi_cliente) || porCliente.set(x.afi_cliente, []).get(x.afi_cliente)).push(x); });
    const codigos = [...porCliente.keys()], pessoas = new Map();
    for (let i = 0; i < codigos.length; i += 250) {
      const lote = await consultarTabela("dmaam", { registros: 500, campos: ["aam_codigo", "aam_nome", "aam_municipio", "aam_estado", "aam_celular", "aam_whatsapp", "aam_situacao"], filtro: { aam_codigo: { in: codigos.slice(i, i + 250) } } });
      lote.itens.forEach((p) => pessoas.set(p.aam_codigo, p));
    }
    const mun = await municipios([...pessoas.values()].map((p) => String(p.aam_municipio || "")));
    const itens = codigos.map((cod) => {
      const lista = porCliente.get(cod), tipos = tiposDasCondicionais(lista), rep = representanteDe(lista), p = pessoas.get(cod) || {}, m = mun.get(String(p.aam_municipio || "")) || {};
      const principais = lista.filter((x) => ["Kit principal", "Kit novo"].includes(tipos.get(x.afi_codigo)));
      const base = (principais.length ? principais : lista).filter((x) => x.afi_prevdevol).sort((a, b) => String(a.afi_prevdevol).localeCompare(String(b.afi_prevdevol)));
      const kp = lista.filter((x) => tipos.get(x.afi_codigo) === "Kit principal").sort((a, b) => t(a.afi_data) - t(b.afi_data))[0] || base[0] || lista[0];
      return {
        cod, nome: nomeNormal(p.aam_nome), celular: p.aam_celular || p.aam_whatsapp || "", cidade: m.nome || "", uf: m.uf || String(p.aam_estado || "").toUpperCase(),
        repCod: rep, representante: rep ? (vend.get(rep) || rep) : "Sem representante",
        prev: base[0] ? dia(base[0].afi_prevdevol) : "", emissao: kp ? dia(kp.afi_data) : "",
        kits: lista.length, pecas: lista.reduce((s, x) => s + (Number(x.afi_qtditens) || 0), 0), valor: Math.round(lista.reduce((s, x) => s + (Number(x.afi_valormerc) || 0), 0) * 100) / 100,
      };
    }).filter((i) => i.prev).sort((a, b) => a.prev.localeCompare(b.prev) || a.nome.localeCompare(b.nome, "pt-BR"));
    const dados = { geradoEm: new Date().toISOString(), hoje: dia(iso(hoje)), janelaDias: DIAS_AGENDA, total: itens.length, itens };
    G.__sorellyAgenda = { dados, em: Date.now() };
    return dados;
  })().finally(() => { if (G.__sorellyAgenda) delete G.__sorellyAgenda.pend; });
  G.__sorellyAgenda = Object.assign({}, c, { pend });
  return pend;
}
