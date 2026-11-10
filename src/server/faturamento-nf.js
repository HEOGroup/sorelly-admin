// Faturamento do relatório de notas fiscais do Marcus, reproduzido pela DevMaster (09/11/2026, conferido ao centavo com os dias 04, 05, 06 e 09/11 e 326 acertos).
// REGRA: títulos a receber (dmabg) com EMISSÃO no mês, de qualquer forma de pagamento, SEM clientes do grupo FUNCIONÁRIOS (dmaam.aam_grupo "0002").
//   Faturado acumulado = soma de abg_valor. Acertos acumulados = clientes DISTINTOS no mês (cada revendedora conta uma vez, mesmo com mais de um título).
// A regra antiga (notas de saída dmabl, faturamento.js) dava um valor muito menor e foi abandonada em 29/10/2026.
// Devolve o acumulado do mês dia a dia: [{dia, acertos, valor}], do dia 1 até `ateIso` (inclusive).
import { todasAsPaginas } from "./devmaster2.js";

const G = globalThis;

async function funcionarias() {
  if (G.__sorellyNFFunc && Date.now() - G.__sorellyNFFunc.em < 60 * 60 * 1000) return G.__sorellyNFFunc.set;
  const set = new Set((await todasAsPaginas("dmaam", { filtro: { aam_grupo: "0002" }, campos: ["aam_codigo"] })).map((x) => x.aam_codigo));
  G.__sorellyNFFunc = { set, em: Date.now() };
  return set;
}

export async function faturamentoNFDoMes(ateIso) {
  const ym = ateIso.slice(0, 7), func = await funcionarias();
  const titulos = await todasAsPaginas("dmabg", { filtro: { abg_emissao: { between: [ym + "-01T00:00:00", ateIso + "T23:59:59"] } }, campos: ["abg_cliente", "abg_valor", "abg_emissao"] });
  const porDia = {};
  titulos.forEach((x) => {
    const c = x.abg_cliente; if (!c || c === "000000" || func.has(c)) return;
    const d = String(x.abg_emissao).slice(0, 10), o = porDia[d] || (porDia[d] = { val: 0, cli: new Set() });
    o.val += Number(x.abg_valor) || 0; o.cli.add(c);
  });
  const dias = [], vistos = new Set(); let acum = 0;
  const ultimo = Number(ateIso.slice(8, 10));
  for (let n = 1; n <= ultimo; n++) {
    const d = ym + "-" + String(n).padStart(2, "0"), o = porDia[d];
    if (o) { acum += o.val; o.cli.forEach((c) => vistos.add(c)); }
    dias.push({ dia: d, acertos: vistos.size, valor: Math.round(acum * 100) / 100 });
  }
  return dias;
}
