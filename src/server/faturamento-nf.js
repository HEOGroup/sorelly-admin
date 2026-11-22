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

// formas de pagamento (dmacd): "Acerto - loja" e "Acerto - loja interno" = a revendedora NÃO pagou (regra do Marcus de 27/10/2026). Serve para separar Contas a receber (pagou na hora) e Inadimplência (saldo em aberto).
async function formasAcerto() {
  if (G.__sorellyNFFormas && Date.now() - G.__sorellyNFFormas.em < 60 * 60 * 1000) return G.__sorellyNFFormas.set;
  const set = new Set((await todasAsPaginas("dmacd", { filtro: {}, campos: ["acd_codigo", "acd_descricao"] })).filter((x) => /^ACERTO/i.test(String(x.acd_descricao || ""))).map((x) => x.acd_codigo));
  G.__sorellyNFFormas = { set, em: Date.now() };
  return set;
}

export async function faturamentoNFDoMes(ateIso) {
  const ym = ateIso.slice(0, 7), func = await funcionarias(), ace = await formasAcerto();
  const titulos = await todasAsPaginas("dmabg", { filtro: { abg_emissao: { between: [ym + "-01T00:00:00", ateIso + "T23:59:59"] } }, campos: ["abg_cliente", "abg_valor", "abg_saldo", "abg_tipodoc", "abg_emissao"] });
  const porDia = {};
  titulos.forEach((x) => {
    const c = x.abg_cliente; if (!c || c === "000000" || func.has(c)) return;
    const d = String(x.abg_emissao).slice(0, 10), o = porDia[d] || (porDia[d] = { val: 0, cr: 0, ina: 0, cli: new Set() }), v = Number(x.abg_valor) || 0;
    o.val += v; o.cli.add(c);
    if (ace.has(x.abg_tipodoc)) o.ina += Number(x.abg_saldo) || 0; else o.cr += v;   // cr = pagou na hora (Pix, link, cartão, dinheiro); ina = acerto-loja ainda em aberto
  });
  const dias = [], vistos = new Set(); let acum = 0, crAc = 0, inaAc = 0;
  const ultimo = Number(ateIso.slice(8, 10));
  for (let n = 1; n <= ultimo; n++) {
    const d = ym + "-" + String(n).padStart(2, "0"), o = porDia[d];
    if (o) { acum += o.val; crAc += o.cr; inaAc += o.ina; o.cli.forEach((c) => vistos.add(c)); }
    dias.push({ dia: d, acertos: vistos.size, valor: Math.round(acum * 100) / 100, cr: Math.round(crAc * 100) / 100, ina: Math.round(inaAc * 100) / 100 });
  }
  return dias;
}
