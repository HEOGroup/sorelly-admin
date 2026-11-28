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

// 26/11/2026 (Marcus: "as representantes reclamam que está lento para bipar"): cada peça fora do kit fazia 5 ou mais consultas SEGUIDAS na DevMaster.
// Agora: a lista de condicionais da revendedora fica guardada por 2 minutos (é a mesma em todas as bipadas), a peça e a lista são buscadas AO MESMO TEMPO e os itens são buscados em paralelo.
const cacheRev = (globalThis.__sorellyPecaRev = globalThis.__sorellyPecaRev || new Map());
function condicionaisDe(cod) {
  const c = cacheRev.get(cod); if (c && Date.now() - c.em < 120000) return c.p;
  const p = todasAsPaginas("dmafi", { filtro: { afi_cliente: cod }, campos: ["afi_codigo", "afi_data", "afi_status", "afi_vendedor"] });
  cacheRev.set(cod, { p, em: Date.now() }); p.catch(() => cacheRev.delete(cod));
  if (cacheRev.size > 300) cacheRev.delete(cacheRev.keys().next().value);
  return p;
}
const achaProduto = async (q, barras) => {
  const campos = ["aaa_codigo", "aaa_descricao", "aaa_codbarras"];
  const porCodigo = (await consultarTabela("dmaaa", { registros: 1, filtro: { aaa_codigo: q }, campos })).itens[0];
  if (porCodigo || !/^\d{4,}$/.test(q)) return porCodigo;
  return (await consultarTabela("dmaaa", { registros: 1, filtro: { aaa_codbarras: { in: barras } }, campos })).itens[0];
};

export const GET = rota(async (req, { eu, url }) => {
  const cod = String(url.searchParams.get("cod") || "").trim(), q = String(url.searchParams.get("q") || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z0-9]{1,20}$/.test(q)) return erro("Informe ?q=código da peça ou número de barras (só letras e números).", 400);
  // 28/11/2026 (Marcus): ?leve=1 = só o cadastro oficial do produto (número de barras -> código comercial), para a bipagem mostrar COL0088 e não 00033139.
  // Não traz nada de revendedora (sem histórico, sem valor), por isso não precisa do código dela. Uma consulta só, só leitura.
  if (url.searchParams.get("leve")) {
    const p = await achaProduto(q, [...new Set([q, q.replace(/^0+/, ""), /^\d+$/.test(q) ? q.padStart(8, "0") : ""].filter(Boolean))]);
    return json(p ? { achou: true, codigo: String(p.aaa_codigo).trim(), desc: nomeNormal(String(p.aaa_descricao || "").trim()) } : { achou: false, q });
  }
  if (!/^\d{1,10}$/.test(cod)) return erro("Informe ?cod=código da revendedora.", 400);
  // trava de carteira (igual à rota das condicionais)
  const semZeros = q.replace(/^0+/, "");
  const barras = [...new Set([q, semZeros, /^\d+$/.test(q) ? q.padStart(8, "0") : ""].filter(Boolean))];
  const [todas, prod] = await Promise.all([condicionaisDe(cod), achaProduto(q, barras)]);
  const abertas = todas.filter((x) => x.afi_status === "A");
  if (eu.repCod) { if (abertas.length && !abertas.some((x) => codigosDe(eu).includes(x.afi_vendedor))) return erro("Essa revendedora não é da sua carteira.", 403); }
  else if (eu.perfil !== "ADMIN" && abertas.length) {
    const mapa = await vendedores();
    if (!abertas.some((x) => sem(mapa.get(x.afi_vendedor)).split(" ")[0] === sem(eu.nome).split(" ")[0])) return erro("Essa revendedora não é da sua carteira.", 403);
  }
  if (!prod) return json({ achou: false, q, historico: [] });
  const codigo = String(prod.aaa_codigo).trim();
  // 2) as condicionais DELA (de qualquer situação) em que essa peça já esteve
  const porNum = new Map(todas.map((c) => [c.afi_codigo, c]));
  const nums = [...porNum.keys()], lotes = [];
  for (let i = 0; i < nums.length; i += 100) lotes.push(nums.slice(i, i + 100));
  const itens = (await Promise.all(lotes.map((lote) => todasAsPaginas("dmafj", { filtro: { afj_condicional: { in: lote }, afj_produto: codigo }, campos: ["afj_condicional", "afj_quantidade", "afj_qtdvendido", "afj_qtdretorno", "afj_valorun"] })))).flat();
  const historico = itens.map((i) => { const c = porNum.get(i.afj_condicional) || {}; return { numero: i.afj_condicional, emissao: d10(c.afi_data), status: STATUS[c.afi_status] || String(c.afi_status || ""), enviada: Number(i.afj_quantidade) || 0, vendida: Number(i.afj_qtdvendido) || 0, devolvida: Number(i.afj_qtdretorno) || 0 }; })
    .sort((a, b) => String(b.emissao).localeCompare(String(a.emissao))).slice(0, 6);
  const valor = Number((itens[0] || {}).afj_valorun) || 0;
  return json({ achou: true, codigo, desc: nomeNormal(String(prod.aaa_descricao || "").trim()), valor, historico });
});
