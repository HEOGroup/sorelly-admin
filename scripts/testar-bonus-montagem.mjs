// Teste do bônus da montagem de kits (12/11/2026): roda as contas de domain/bonus-montagem.js.
//   node scripts/testar-bonus-montagem.mjs
// Parte 1: a regra (sempre roda). Parte 2: outubro/2026 contra a planilha Bonus_outubro_2026.xlsx (só neste computador, onde existe o arquivo de dados reais).
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dominio = path.join(raiz, "src/apps/montagem/domain");
const bm = await import(pathToFileURL(path.join(dominio, "bonus-montagem.js")).href);

let ok = 0, erro = 0;
const igual = (nome, veio, esperado) => {
  const a = JSON.stringify(veio), b = JSON.stringify(esperado);
  if (a === b) ok++; else { erro++; console.log("ERRO", nome, "| veio", a, "| esperado", b); }
};
const c = bm.CFG_PADRAO;

// ── 1. a regra ──
igual("7 normais = nada", bm.bonusDoDia(7, 0, c).total, 0);
igual("8 normais = R$ 15", bm.bonusDoDia(8, 0, c).total, 15);
igual("11 normais = R$ 21", bm.bonusDoDia(11, 0, c).total, 21);
igual("16 normais = R$ 31", bm.bonusDoDia(16, 1, c).total, 31);
igual("5 especiais = nada", bm.bonusDoDia(0, 5, c).total, 0);
igual("6 especiais = R$ 15", bm.bonusDoDia(0, 6, c).total, 15);
igual("8 especiais = R$ 21", bm.bonusDoDia(0, 8, c).total, 21);
igual("8 normais + 6 especiais = R$ 30", bm.bonusDoDia(8, 6, c).total, 30);
igual("supervisão 8 normais = R$ 2", bm.supervisaoDoDia(8, 0, c).normal, 2);
igual("supervisão 11 normais = R$ 5", bm.supervisaoDoDia(11, 0, c).normal, 5);
igual("supervisão 4 normais = nada", bm.supervisaoDoDia(4, 0, c).normal, 0);
igual("supervisão 8 especiais = R$ 5", bm.supervisaoDoDia(0, 8, c).especial, 5);
igual("sem nota não corta", bm.fatorDaNota(null, c), 1);
igual("nota 2,4 não paga", bm.fatorDaNota(2.4, c), 0);
igual("nota 2,5 paga metade", bm.fatorDaNota(2.5, c), 0.5);
igual("nota 3,4 paga metade", bm.fatorDaNota(3.4, c), 0.5);
igual("nota 3,5 paga tudo", bm.fatorDaNota(3.5, c), 1);

// lançar um dia, corrigir e tirar
let s = { bm: bm.bmMigrar(null) };
let r = bm.bmReduz(s, { op: "dia_set", data: "2026-11-03", hoje: "2026-11-12", itens: [{ c: "Ivanete", n: 10, e: 0 }, { c: "Pamela", n: 7, e: 6 }, { c: "Larissa", n: 0, e: 0 }] });
s = Object.assign({}, s, r.patch);
let res = bm.resumoMes(s.bm, "2026-11");
igual("lançar: 2 colaboradoras", res.linhas.length, 3);   // Ivanete, Pamela e a Maria Vitória (recebe a supervisão)
igual("lançar: Ivanete R$ 19", res.linhas.find((x) => x.c === "Ivanete").pagar, 19);
igual("lançar: Pamela R$ 15 (só o especial)", res.linhas.find((x) => x.c === "Pamela").pagar, 15);
igual("lançar: supervisão normal R$ 4 para a Maria Vitória", res.linhas.find((x) => x.c === "Maria Vitória").sup, 4);
igual("lançar: supervisão especial sem destino R$ 2", res.supSemDestino, 2);
r = bm.bmReduz(s, { op: "dia_set", data: "2026-11-03", hoje: "2026-11-12", itens: [{ c: "Ivanete", n: 0, e: 0 }] });
s = Object.assign({}, s, r.patch);
igual("tirar: Ivanete sai do dia", Object.keys(bm.lancadoNoDia(s.bm, "2026-11-03")), ["Pamela"]);
igual("data no futuro é recusada", Object.keys(bm.bmReduz(s, { op: "dia_set", data: "2026-11-20", hoje: "2026-11-12", itens: [{ c: "Ivanete", n: 9, e: 0 }] }).patch).length, 0);
igual("quantidade acima de 99 é recusada", Object.keys(bm.bmReduz(s, { op: "dia_set", data: "2026-11-04", hoje: "2026-11-12", itens: [{ c: "Ivanete", n: 120, e: 0 }] }).patch).length, 0);
// a nota vem de fora (fonte única: domain/avaliacoes-kits.js) e corta só o bônus, nunca a supervisão
const avk = await import(pathToFileURL(path.join(dominio, "avaliacoes-kits.js")).href);
const leitura = avk.avkSemear(null, { lidoEm: "2026-11-12T10:00", meses: { "2026-11": { porMontadora: [{ nome: "Pamela", aval: 12, nota: 3.1 }, { nome: "Ivanete", aval: 0, nota: 1 }] } } });
igual("fonte única: só quem tem avaliação entra", avk.notasDoMes(leitura, "2026-11"), { Pamela: { q: 12, nota: 3.1 } });
res = bm.resumoMes(s.bm, "2026-11", avk.notasDoMes(leitura, "2026-11"));
igual("nota 3,1: Pamela recebe metade", res.linhas.find((x) => x.c === "Pamela").pagar, 7.5);
igual("sem notas: ninguém é cortado", bm.resumoMes(s.bm, "2026-11").linhas.find((x) => x.c === "Pamela").pagar, 15);
igual("leitura mais velha não entra", avk.avkSemear(leitura, { lidoEm: "2026-11-11T10:00", meses: {} }).lidoEm, "2026-11-12T10:00");
igual("leitura mais nova entra", avk.avkSemear(leitura, { lidoEm: "2026-11-13T10:00", meses: { "2026-12": { porMontadora: [] } } }).lidoEm, "2026-11-13T10:00");
igual("leitura mais nova guarda os meses de antes", Object.keys(avk.avkSemear(leitura, { lidoEm: "2026-11-13T10:00", meses: { "2026-12": { porMontadora: [] } } }).meses).sort(), ["2026-11", "2026-12"]);
igual("total do mês pesa pela quantidade", avk.totalDoMes([{ aval: 3, nota: 5, certo: 5, capricho: 5, combinou: 5, n5: 3, b35: 0, b25: 0 }, { aval: 1, nota: 1, certo: 1, capricho: 1, combinou: 1, n5: 0, b35: 1, b25: 1 }]).nota, 4);

// ── 2. outubro/2026 contra a planilha ──
const arqLocal = path.join(dominio, "bonus-montagem.local.js");
if (!fs.existsSync(arqLocal)) console.log("(sem bonus-montagem.local.js neste computador: a conferência com a planilha foi pulada)");
else {
  const local = (await import(pathToFileURL(arqLocal).href)).default;
  const out = bm.resumoMes(bm.bmMigrar(null, local), "2026-10");
  // aba "Resumo por colaboradora": [kits normais, kits especiais, dias com bônus, bônus a pagar, supervisão, total]
  const PLANILHA = { Ivanete: [304, 12, 21, 533, 0, 533], Pamela: [260, 12, 21, 465, 0, 465], "Paula Melissa": [235, 12, 20, 406, 0, 406], Larissa: [198, 20, 13, 293, 0, 293],
    "Jenifer Mariah": [168, 9, 13, 239, 0, 239], "Letícia": [151, 1, 12, 224, 0, 224], Tainara: [140, 6, 11, 179, 0, 179], "Milenna Rafaela": [138, 2, 8, 136, 0, 136],
    "Eduarda Helena": [94, 3, 7, 123, 0, 123], Rakiely: [101, 0, 5, 83, 0, 83], Jordana: [117, 0, 4, 64, 0, 64], "Maria Vitória": [54, 7, 2, 36, 637, 673] };
  igual("outubro: 12 colaboradoras", out.linhas.length, 12);
  Object.keys(PLANILHA).forEach((nome) => { const l = out.linhas.find((x) => x.c === nome) || {}; igual("outubro: " + nome, [l.n, l.e, l.diasBonus, l.pagar, l.sup, l.total], PLANILHA[nome]); });
  igual("outubro: totais", [out.tot.n, out.tot.e, out.tot.diasBonus, out.tot.bNormal, out.tot.bEspecial, out.tot.pagar, out.tot.sup, out.tot.total], [1960, 84, 137, 2781, 0, 2781, 637, 3418]);
  igual("outubro: supervisão especial", out.supEspecial, 0);
  const dias = bm.diasDoMes(bm.bmMigrar(null, local), "2026-10", "");
  igual("outubro: dia 01/10 (77 normais, 1 especial, supervisão R$ 25)", [dias.linhas[0].d, dias.linhas[0].n, dias.linhas[0].e, dias.linhas[0].sup], ["2026-10-01", 77, 1, 25]);
  igual("outubro: dia 02/10 (90 normais, 2 especiais, supervisão R$ 37)", [dias.linhas[1].n, dias.linhas[1].e, dias.linhas[1].sup], [90, 2, 37]);
  igual("outubro: soma dos dias = total do mês", [dias.tot.bonus, dias.tot.sup], [2781, 637]);
}

console.log(erro ? `REPROVADO: ${erro} erro(s), ${ok} certo(s)` : `APROVADO: ${ok} verificações`);
process.exit(erro ? 1 : 0);
