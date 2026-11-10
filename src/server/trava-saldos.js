// Trava dos saldos das contas (10/11/2026). Na sexta 06/11 uma tela que ainda não tinha baixado o servidor gravou o modelo vazio de saldosContas e apagou todos os saldos lançados.
// protegerSaldos(velho, novo): devolve para `novo` (o que a tela mandou) todo dia, fechamento, aporte ou ajuste que já existe em `velho` (o que está guardado) e que a tela não trouxe.
// O que a tela manda para um dia que ela traz VALE (editar um dia, tirar uma conta do dia). Para excluir um dia de propósito a tela grava o dia vazio ({}). Devolve quantos itens foram devolvidos.
const CHAVES = ["saldos", "fechamentos", "aportes", "ajustes"];
const objeto = (x) => !!x && typeof x === "object" && !Array.isArray(x);

export function protegerSaldos(velho, novo) {
  if (!objeto(velho) || !objeto(novo)) return 0;
  let devolvidos = 0;
  for (const k of CHAVES) {
    const v = velho[k];
    if (!objeto(v)) continue;
    if (!objeto(novo[k])) novo[k] = {};
    for (const d of Object.keys(v)) if (!(d in novo[k])) { novo[k][d] = v[d]; devolvidos++; }
  }
  return devolvidos;
}
