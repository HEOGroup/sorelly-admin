export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Uma peça bipada que NÃO está nas condicionais marcadas (24/11/2026, Marcus: "a revendedora mistura as peças"). Diz que peça é e se ela já passou pelas mãos DESTA revendedora.
//   GET /api/representante/peca?cod=010571&q=CL2542   (q = código da peça ou número de barras da etiqueta)
//   -> {achou, codigo, desc, valor, historico:[{numero, emissao, status, enviada, vendida, devolvida}]}   historico = condicionais DELA em que a peça já esteve (mais nova primeiro, até 6)
// Só leitura, API 2 da DevMaster. Mesma trava da rota das condicionais: representante só consulta revendedora da própria carteira.
import { erro, json, rota } from "@/server/http";
import { consultarTabela, todasAsPaginas } from "@/server/devmaster2";
import { nomeNormal, vendedores } from "@/server/revendedoras";
import { codigosDe } from "@/server/rep-codigos";

const sem = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const d10 = (v) => String(v || "").slice(0, 10);
const STATUS = { A: "aberta", F: "fechada", R: "resíduo", J: "jurídico" };

export const GET = rota(async (req, { eu, url }) => {
  const cod = String(url.searchParams.get("cod") || "").trim(), q = String(url.searchParams.get("q") || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!/^\d{1,10}$/.test(cod)) return erro("Informe ?cod=código da revendedora.", 400);
  if (!/^[A-Z0-9]{1,20}$/.test(q)) return erro("Informe ?q=código da peça ou número de barras (só letras e números).", 400);
  // trava de carteira (igual à rota das condicionais)
  const abertas = await todasAsPaginas("dmafi", { filtro: { afi_cliente: cod, afi_status: "A" }, campos: ["afi_codigo", "afi_vendedor"] });
  if (eu.repCod) { if (abertas.length && !abertas.some((x) => codigosDe(eu).includes(x.afi_vendedor))) return erro("Essa revendedora não é da sua carteira.", 403); }
  else if (eu.perfil !== "ADMIN" && abertas.length) {
    const mapa = await vendedores();
    if (!abertas.some((x) => sem(mapa.get(x.afi_vendedor)).split(" ")[0] === sem(eu.nome).split(" ")[0])) return erro("Essa revendedora não é da sua carteira.", 403);
  }
  // 1) que peça é: pelo código escrito ou pelo número de barras (com ou sem zeros na frente)
  const semZeros = q.replace(/^0+/, "");
  const barras = [...new Set([q, semZeros, /^\d+$/.test(q) ? q.padStart(8, "0") : ""].filter(Boolean))];
  let prod = (await consultarTabela("dmaaa", { registros: 1, filtro: { aaa_codigo: q }, campos: ["aaa_codigo", "aaa_descricao", "aaa_codbarras"] })).itens[0];
  if (!prod && /^\d{4,}$/.test(q)) prod = (await consultarTabela("dmaaa", { registros: 1, filtro: { aaa_codbarras: { in: barras } }, campos: ["aaa_codigo", "aaa_descricao", "aaa_codbarras"] })).itens[0];
  if (!prod) return json({ achou: false, q, historico: [] });
  const codigo = String(prod.aaa_codigo).trim();
  // 2) as condicionais DELA (de qualquer situação) em que essa peça já esteve
  const todas = await todasAsPaginas("dmafi", { filtro: { afi_cliente: cod }, campos: ["afi_codigo", "afi_data", "afi_status"] });
  const porNum = new Map(todas.map((c) => [c.afi_codigo, c]));
  let itens = [];
  const nums = [...porNum.keys()];
  for (let i = 0; i < nums.length; i += 100) {
    itens = itens.concat(await todasAsPaginas("dmafj", { filtro: { afj_condicional: { in: nums.slice(i, i + 100) }, afj_produto: codigo }, campos: ["afj_condicional", "afj_quantidade", "afj_qtdvendido", "afj_qtdretorno", "afj_valorun"] }));
  }
  const historico = itens.map((i) => { const c = porNum.get(i.afj_condicional) || {}; return { numero: i.afj_condicional, emissao: d10(c.afi_data), status: STATUS[c.afi_status] || String(c.afi_status || ""), enviada: Number(i.afj_quantidade) || 0, vendida: Number(i.afj_qtdvendido) || 0, devolvida: Number(i.afj_qtdretorno) || 0 }; })
    .sort((a, b) => String(b.emissao).localeCompare(String(a.emissao))).slice(0, 6);
  const valor = Number((itens[0] || {}).afj_valorun) || 0;
  return json({ achou: true, codigo, desc: nomeNormal(String(prod.aaa_descricao || "").trim()), valor, historico });
});
