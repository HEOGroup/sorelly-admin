// Faturamento REAL puxado da DevMaster (pedido do Marcus, 27/10/2026): notas fiscais de saída (dmabl), só as EMITIDAS de
// verdade (abl_nfeautorizada:"S" — a DevMaster mistura orçamento "ORC" com nota emitida na mesma tabela), TES S001/S002,
// sem clientes do grupo "FUNCIONÁRIOS" (dmaam.aam_grupo "0002", visto no cadastro do cliente — ver dmalv).
import { consultarTabela, todasAsPaginas } from "./devmaster2.js";

const TES_FATURAMENTO = ["S001", "S002"];
const GRUPO_FUNCIONARIOS = "0002";

// Soma o valor das notas emitidas (TES de faturamento, sem funcionários) do dia 1 do mês de `ateIso` até `ateIso` (inclusive).
// `ateIso`: "AAAA-MM-DD". Devolve {valor, notas}.
export async function faturamentoMesAte(ateIso) {
  const fim = new Date(ateIso + "T23:59:59");
  const inicioMes = new Date(fim.getFullYear(), fim.getMonth(), 1);
  const iso = (d) => d.toISOString().slice(0, 19);
  const notas = await todasAsPaginas("dmabl", {
    filtro: { abl_emissao: { gte: iso(inicioMes), lte: iso(fim) }, abl_nfeautorizada: "S", abl_tespadrao: { in: TES_FATURAMENTO } },
    campos: ["abl_cliente", "abl_valortotal"],
  });
  const clientes = [...new Set(notas.map((x) => x.abl_cliente).filter(Boolean))];
  const grupoDe = new Map();
  for (let i = 0; i < clientes.length; i += 250) {
    const lote = await consultarTabela("dmaam", { registros: 500, campos: ["aam_codigo", "aam_grupo"], filtro: { aam_codigo: { in: clientes.slice(i, i + 250) } } });
    lote.itens.forEach((c) => grupoDe.set(c.aam_codigo, c.aam_grupo));
  }
  const semFuncionario = notas.filter((x) => grupoDe.get(x.abl_cliente) !== GRUPO_FUNCIONARIOS);
  const valor = Math.round(semFuncionario.reduce((a, x) => a + Number(x.abl_valortotal || 0), 0) * 100) / 100;
  return { valor, notas: semFuncionario.length };
}
