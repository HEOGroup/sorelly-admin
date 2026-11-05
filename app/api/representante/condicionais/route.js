export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Condicionais ABERTAS de uma revendedora, com todas as peças (05/11/2026, Marcus: "tudo que é fake sai, puxa da DevMaster"). Só leitura, API 2.
//   GET /api/representante/condicionais?cod=010571  -> {cod, total, condicionais:[{numero, emissao, previsao, vendedor, pecas, valor, grupos:[{cod, nome, itens:[{codigo, desc, valor, qtd}]}]}]}
// Mesmo formato que o app já usa na conferência das peças (grupos → itens). Expositor (vendedor 04 / previsão no ano 3000) e Encomenda (91) ficam de fora: não entram na contagem do kit.
import { erro, json, rota } from "@/server/http";
import { consultarTabela, todasAsPaginas } from "@/server/devmaster2";
import { nomeNormal, vendedores } from "@/server/revendedoras";

const GRUPOS = { "01": "Anéis", "02": "Brincos", "04": "Colares", "06": "Pulseiras", "07": "Tornozeleiras", "08": "Suporte", "11": "Religiosos", "14": "Material de uso geral", "16": "Sorelly Premium", "19": "Brincos Select", "30": "Brinco Duo", "42": "Anéis Select", "45": "Bracelete", BD: "Collection" };
const sem = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const d10 = (v) => String(v || "").slice(0, 10);

export const GET = rota(async (req, { eu, url }) => {
  // A revendedora nova ainda não tem o código no sistema: a ligação com a DevMaster é pelo CPF (aam_cpfcnpj, só números). Também aceita ?cod=.
  let cod = url.searchParams.get("cod") || "";
  const cpf = String(url.searchParams.get("cpf") || "").replace(/\D/g, "");
  if (!cod && cpf) {
    if (cpf.length !== 11) return erro("CPF inválido: precisa ter 11 números.", 400);
    const ach = await consultarTabela("dmaam", { registros: 5, filtro: { aam_cpfcnpj: cpf }, campos: ["aam_codigo", "aam_nome"] });
    if (!ach.itens.length) return json({ cpf: "***" + cpf.slice(-4), cod: null, total: 0, condicionais: [], aviso: "Nenhum cliente com esse CPF na DevMaster." });
    if (ach.itens.length > 1) return json({ cpf: "***" + cpf.slice(-4), cod: null, total: 0, condicionais: [], aviso: "Mais de um cliente com esse CPF na DevMaster: avise o Cadastro." });
    cod = String(ach.itens[0].aam_codigo).trim();
  }
  if (!/^\d{1,10}$/.test(cod)) return erro("Informe ?cpf=11 números ou ?cod=código da revendedora.", 400);
  const cods = await todasAsPaginas("dmafi", { filtro: { afi_cliente: cod, afi_status: "A" }, campos: ["afi_codigo", "afi_data", "afi_prevdevol", "afi_vendedor", "afi_qtditens", "afi_valormerc"] });
  const kits = cods.filter((x) => x.afi_vendedor !== "04" && x.afi_vendedor !== "91" && Number(String(x.afi_prevdevol || "0").slice(0, 4)) < 2100);
  const mapa = await vendedores();
  // A representante só vê revendedora com condicional no vendedor dela; a Diretoria vê todas.
  if (eu.perfil !== "ADMIN" && kits.length && !kits.some((x) => sem(mapa.get(x.afi_vendedor)).split(" ")[0] === sem(eu.nome).split(" ")[0])) return erro("Essa revendedora não é da sua carteira.", 403);
  // ?recente=1: só o kit mais novo (o que está sendo ENTREGUE). A revendedora costuma ter o kit anterior ainda aberto até o acerto; esse não entra na conferência do kit novo.
  if (url.searchParams.get("recente") === "1") { kits.sort((a, b) => String(b.afi_data).localeCompare(String(a.afi_data))); kits.splice(1); }
  const numeros = kits.map((x) => x.afi_codigo);
  const resumo = url.searchParams.get("resumo") === "1";   // ?resumo=1: só número, peças, valor e previsão (sem a lista de peças): é o que o acerto usa para saber quais condicionais voltam
  const itens = numeros.length && !resumo ? await todasAsPaginas("dmafj", { filtro: { afj_condicional: { in: numeros } }, campos: ["afj_condicional", "afj_produto", "afj_descricao", "afj_quantidade", "afj_valorun"] }) : [];
  const prods = [...new Set(itens.map((i) => String(i.afj_produto || "").trim()))], grupoDe = new Map();
  for (let i = 0; i < prods.length; i += 100) {
    const r = await consultarTabela("dmaaa", { registros: 100, filtro: { aaa_codigo: { in: prods.slice(i, i + 100) } }, campos: ["aaa_codigo", "aaa_grupo"] });
    (r.itens || []).forEach((x) => grupoDe.set(String(x.aaa_codigo).trim(), String(x.aaa_grupo || "").trim()));
  }
  const condicionais = kits.sort((a, b) => String(b.afi_data).localeCompare(String(a.afi_data))).map((c) => {
    const por = new Map();
    itens.filter((i) => i.afj_condicional === c.afi_codigo).forEach((i) => {
      const codigo = String(i.afj_produto || "").trim(), g = grupoDe.get(codigo) || "00";
      if (!por.has(g)) por.set(g, { cod: g, nome: GRUPOS[g] || "Grupo " + g, itens: [] });
      por.get(g).itens.push({ codigo, desc: nomeNormal(String(i.afj_descricao || "").trim()).toUpperCase(), valor: Number(i.afj_valorun) || 0, qtd: Number(i.afj_quantidade) || 0 });
    });
    return { numero: c.afi_codigo, emissao: d10(c.afi_data), previsao: d10(c.afi_prevdevol), vendedor: mapa.get(c.afi_vendedor) || c.afi_vendedor, pecas: Number(c.afi_qtditens) || 0, valor: Number(c.afi_valormerc) || 0, grupos: [...por.values()].sort((a, b) => a.cod.localeCompare(b.cod)) };
  });
  return json({ cod, total: condicionais.length, condicionais });
});
