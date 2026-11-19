// Teste do controle por código da produção externa (domain/producao-casa.js), com a lista que o Marcus passou em 18/11/2026.
//   node scripts/testar-producao-casa.mjs
import { situacaoPorCodigo, validarEnvio, limpaCodigo } from "../src/apps/montagem/domain/producao-casa.js";

let ok = 0, mal = 0;
const confere = (nome, cond) => { if (cond) ok++; else { mal++; console.log("FALHOU:", nome); } };
const env = [
  { dia: "2026-11-16", codigo: "BB1517", qtd: 682, feitas: 200 },
  { dia: "2026-11-16", codigo: "2B0133", qtd: 396, feitas: 382 },
  { dia: "2026-11-16", codigo: "BB1513", qtd: 348, feitas: 200 },
  { dia: "2026-11-17", codigo: "BB1538", qtd: 700, feitas: 200 },
  { dia: "2026-11-17", codigo: "IO766", qtd: 492, feitas: 0 },
];
const dev = [
  { dia: "2026-11-17", codigo: "2B0133", qtd: 382 },
  { dia: "2026-11-18", codigo: "BB1517", qtd: 200 }, { dia: "2026-11-18", codigo: "BB1513", qtd: 200 }, { dia: "2026-11-18", codigo: "BB1538", qtd: 200 },
];
const r = situacaoPorCodigo(env, dev), por = Object.fromEntries(r.linhas.map((l) => [l.codigo, l]));
confere("total enviado", r.tot.enviado === 2618);
confere("total devolvido", r.tot.devolvido === 982);
confere("total com ela", r.tot.comEla === 1636);
confere("BB1517 com ela 482", por.BB1517.comEla === 482 && por.BB1517.aDevolver === 0 && por.BB1517.faltaFazer === 482);
confere("BB1513 com ela 148", por.BB1513.comEla === 148);
confere("BB1538 com ela 500", por.BB1538.comEla === 500);
confere("2B0133 com ela 14", por["2B0133"].comEla === 14 && por["2B0133"].devolvido === 382);
confere("IO766 com ela 492, nada feito", por.IO766.comEla === 492 && por.IO766.feitas === 0 && por.IO766.faltaFazer === 492);
confere("feitas a devolver zeradas (o que ela fez já voltou)", r.tot.aDevolver === 0);
confere("feitas totais = devolvidas totais", r.tot.feitas === 982);
confere("ordem: envio mais novo primeiro", r.linhas[0].ultimoEnvio === "2026-11-17");
const a2 = situacaoPorCodigo([{ dia: "2026-11-16", codigo: "X1", qtd: 100, feitas: 60 }], [{ dia: "2026-11-17", codigo: "X1", qtd: 20 }]).linhas[0];
confere("feitas esperando voltar", a2.aDevolver === 40 && a2.comEla === 80 && a2.faltaFazer === 40);
const a3 = situacaoPorCodigo([], [{ dia: "2026-11-17", codigo: "Z9", qtd: 10 }]).linhas[0];
confere("devolvida sem envio lançado", a3.semEnvio === true && a3.comEla === -10 && a3.aMais === true);
confere("código limpo (maiúsculas, sem espaço)", limpaCodigo(" bb 1517 ") === "BB1517");
confere("envio válido", validarEnvio({ dia: "2026-11-16", codigo: "bb1517", qtd: "682", feitas: "200" }).mov.codigo === "BB1517");
confere("recusa sem código", !!validarEnvio({ dia: "2026-11-16", codigo: "", qtd: 10 }).erro);
confere("recusa quantidade zero", !!validarEnvio({ dia: "2026-11-16", codigo: "BB1", qtd: 0 }).erro);
confere("recusa feitas acima do enviado", !!validarEnvio({ dia: "2026-11-16", codigo: "BB1517", qtd: 100, feitas: 101 }).erro);
confere("recusa data inválida", !!validarEnvio({ dia: "16/11", codigo: "BB1517", qtd: 10 }).erro);
console.log(ok + " ok, " + mal + " falharam");
process.exit(mal ? 1 : 0);
