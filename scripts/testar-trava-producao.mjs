// Teste da trava da Produção no servidor (src/server/trava-producao.js): o que quem NÃO é da Diretoria não pode mudar.
//   node --import ./scripts/registrar-carregador.mjs scripts/testar-trava-producao.mjs
import { protegerProducao } from "../src/server/trava-producao.js";

let ok = 0, mal = 0;
const confere = (nome, cond) => { if (cond) ok++; else { mal++; console.log("FALHOU:", nome); } };
const HOJE = "2026-11-19";   // quinta-feira; o dia útil anterior é 18/11
const L = (func, codigo, qtd, unidade) => ({ func, codigo, qtd, valor: 10, unidade: unidade || "SERENITY" });
const guardado = () => ({ lancamentos: {
  "2026-11-10": [L("Ana", "A1", 100)],
  "2026-11-18": [L("Ana", "A1", 150), L("Externa Um", "BB1", 200, "CASA")],
  "2026-11-19": [L("Ana", "A1", 150), L("Externa Um", "BB1", 746, "CASA")],
} });

// 1) página antiga salva o dia de hoje sem as linhas da Externa: voltam
let g = guardado(), n = guardado(); n.lancamentos["2026-11-19"] = [L("Ana", "A1", 150), L("Bia", "B2", 80)];
let c = protegerProducao(g, n, HOJE);
confere("conta o dia corrigido", c === 1);
confere("linha da Externa volta", n.lancamentos["2026-11-19"].some((l) => l.func === "Externa Um" && l.qtd === 746));
confere("linha nova da Bia continua", n.lancamentos["2026-11-19"].some((l) => l.func === "Bia" && l.qtd === 80));
confere("linha travada da Ana fica", n.lancamentos["2026-11-19"].some((l) => l.func === "Ana" && l.qtd === 150));

// 2) funcionária muda a linha já lançada da Ana: volta como estava
g = guardado(); n = guardado(); n.lancamentos["2026-11-19"][0].qtd = 999;
protegerProducao(g, n, HOJE);
confere("quantidade da Ana volta para 150", n.lancamentos["2026-11-19"].find((l) => l.func === "Ana").qtd === 150);

// 3) dia fechado: nada muda (mudança e apagar)
g = guardado(); n = guardado(); n.lancamentos["2026-11-10"] = [L("Ana", "A1", 5)];
protegerProducao(g, n, HOJE);
confere("dia antigo volta como estava", n.lancamentos["2026-11-10"][0].qtd === 100);
g = guardado(); n = guardado(); delete n.lancamentos["2026-11-10"];
protegerProducao(g, n, HOJE);
confere("dia antigo apagado volta", !!n.lancamentos["2026-11-10"]);
g = guardado(); n = guardado(); n.lancamentos["2026-11-05"] = [L("Bia", "B2", 50)];
protegerProducao(g, n, HOJE);
confere("dia antigo novo é recusado", !n.lancamentos["2026-11-05"]);
g = guardado(); n = guardado(); n.lancamentos["2026-11-20"] = [L("Bia", "B2", 50)];
protegerProducao(g, n, HOJE);
confere("dia de amanhã é recusado", !n.lancamentos["2026-11-20"]);

// 4) funcionária tenta criar linha externa: ignorada
g = guardado(); n = guardado(); n.lancamentos["2026-11-19"].push(L("Bia", "B2", 30, "CASA"));
protegerProducao(g, n, HOJE);
confere("linha externa nova de funcionária é ignorada", !n.lancamentos["2026-11-19"].some((l) => l.func === "Bia"));

// 5) externa por nome (Didi/Externa) mesmo como Sorelly
g = guardado(); g.lancamentos["2026-11-19"].push(L("Didi", "BB9", 100, "SORELLY")); n = guardado(); n.lancamentos["2026-11-19"].push(L("Didi", "BB9", 100, "SORELLY"));
n.lancamentos["2026-11-19"] = n.lancamentos["2026-11-19"].filter((l) => l.func !== "Didi");
protegerProducao(g, n, HOJE);
confere("Didi não some por gravação de funcionária", n.lancamentos["2026-11-19"].some((l) => l.func === "Didi"));

// 6) gravação normal não mexe em nada
g = guardado(); n = guardado(); n.lancamentos["2026-11-19"].push(L("Bia", "B2", 80));
c = protegerProducao(g, n, HOJE);
confere("funcionária nova no dia aberto passa", c === 0 && n.lancamentos["2026-11-19"].length === 3);
confere("gravação sem lancamentos não quebra", protegerProducao(g, { historico: [] }, HOJE) >= 0);

console.log(ok + " ok, " + mal + " falharam");
process.exit(mal ? 1 : 0);
