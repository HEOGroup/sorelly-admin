// Teste do lançamento da funcionária (domain/producao.js): preço automático, dia travado, dias antigos fechados e bônus por dia.
//   node --import ./scripts/registrar-carregador.mjs scripts/testar-producao-trava.mjs
import { prReduz, prDemo, bonusDoDia, precoPorCodigo, travadasDoDia, diaAbertoFuncionaria } from "../src/apps/montagem/domain/producao.js";

let ok = 0, mal = 0;
const confere = (nome, cond) => { if (cond) ok++; else { mal++; console.log("FALHOU:", nome); } };
const HOJE = "2026-11-18";   // quarta-feira
const base = prDemo();
base.lancamentos = {
  "2026-11-10": [{ func: "Ana Teste", codigo: "BB1512", qtd: 150, valor: 40, unidade: "SERENITY" }],
  "2026-11-18": [{ func: "Ana Teste", codigo: "BB1512", qtd: 150, valor: 40, unidade: "SERENITY" }],
};
const s = { pr: base };
const F = (extra) => Object.assign({ op: "dia_salvar", admin: false, por: "Bia", agora: HOJE }, extra);

// bônus por dia
confere("299 = 0", bonusDoDia(299) === 0);
confere("300 = 15", bonusDoDia(300) === 15);
confere("349 = 15", bonusDoDia(349) === 15);
confere("350 = 20", bonusDoDia(350) === 20);
confere("399 = 20", bonusDoDia(399) === 20);
confere("400 = 25", bonusDoDia(400) === 25);

// dias abertos: hoje e o dia útil anterior
confere("hoje aberto", diaAbertoFuncionaria("2026-11-18", "2026-11-18"));
confere("ontem aberto", diaAbertoFuncionaria("2026-11-17", "2026-11-18"));
confere("anteontem fechado", !diaAbertoFuncionaria("2026-11-16", "2026-11-18"));
confere("amanhã fechado", !diaAbertoFuncionaria("2026-11-19", "2026-11-18"));
confere("segunda abre a sexta", diaAbertoFuncionaria("2026-11-13", "2026-11-16"));
confere("segunda não abre a quinta", !diaAbertoFuncionaria("2026-11-12", "2026-11-16"));

// preço do código vem do último lançamento; unidade vale a escolhida
confere("preço do código", precoPorCodigo(base).BB1512.valor === 40);
let r = prReduz(s, F({ dia: "2026-11-17", linhas: [{ func: "Bia Teste", codigo: "BB1512", qtd: 100, valor: 999, unidade: "SORELLY" }] }));
confere("lança dia aberto", r.patch.pr && r.patch.pr.lancamentos["2026-11-17"].length === 1);
confere("preço automático (40, não 999)", r.patch.pr.lancamentos["2026-11-17"][0].valor === 40);
confere("vale a unidade escolhida (SORELLY)", r.patch.pr.lancamentos["2026-11-17"][0].unidade === "SORELLY");
r = prReduz(s, F({ dia: "2026-11-17", linhas: [{ func: "Bia Teste", codigo: "ZZ9999", qtd: 10, valor: 50, unidade: "SORELLY" }] }));
confere("código sem preço = 0", r.patch.pr.lancamentos["2026-11-17"][0].valor === 0);

// dia antigo: ninguém da equipe mexe
r = prReduz(s, F({ dia: "2026-11-10", linhas: [{ func: "Bia Teste", codigo: "BB1512", qtd: 80, valor: 1, unidade: "SORELLY" }] }));
confere("dia antigo recusado", !r.patch.pr && /travado/.test(r.msg));
r = prReduz(s, F({ dia: "2026-11-10", linhas: [] }));
confere("não apaga dia antigo", !r.patch.pr);

// dia lançado fica travado para a funcionária (hoje)
confere("travada", travadasDoDia(base, "2026-11-18")["ana teste"] === 1);
r = prReduz(s, F({ dia: "2026-11-18", linhas: [{ func: "Ana Teste", codigo: "BB1512", qtd: 160, valor: 40, unidade: "SERENITY" }] }));
confere("não muda dia lançado", !r.patch.pr && /travado/.test(r.msg));
r = prReduz(s, F({ dia: "2026-11-18", linhas: [] }));
confere("não apaga dia lançado", !r.patch.pr);
r = prReduz(s, F({ dia: "2026-11-18", linhas: [{ func: "Ana Teste", codigo: "BB1512", qtd: 150, valor: 40, unidade: "SERENITY" }, { func: "Bia Teste", codigo: "BB1512", qtd: 80, valor: 1, unidade: "SORELLY" }] }));
confere("outra funcionária lança no mesmo dia", r.patch.pr && r.patch.pr.lancamentos["2026-11-18"].length === 2);
confere("a travada fica como estava", r.patch.pr.lancamentos["2026-11-18"].some((l) => l.func === "Ana Teste" && l.qtd === 150));

// a Diretoria corrige qualquer dia
r = prReduz(s, { op: "dia_salvar", admin: true, por: "Marcus", agora: HOJE, dia: "2026-11-10", linhas: [{ func: "Ana Teste", codigo: "BB1512", qtd: 160, valor: 40, unidade: "SERENITY" }] });
confere("Diretoria corrige dia antigo", r.patch.pr && r.patch.pr.lancamentos["2026-11-10"][0].qtd === 160);

// envio do dia em lote (Leci, Didi, Dávila): vários códigos de uma vez, todos ou nenhum
r = prReduz(s, { op: "mov_lote", admin: true, por: "Marcus", agora: HOJE, func: "Leci", dia: HOJE, itens: [{ codigo: "bb1512", qtd: 100 }, { codigo: "B5259", qtd: "50" }] });
confere("lote grava 2 envios da Leci", r.patch.pr && r.patch.pr.movCasa.length === 2 && r.patch.pr.movCasa.every((m) => m.func === "Leci"));
confere("lote guarda código em maiúsculas", r.patch.pr.movCasa[0].codigo === "BB1512");
r = prReduz(s, { op: "mov_lote", admin: true, por: "Marcus", agora: HOJE, func: "Didi", dia: HOJE, itens: [{ codigo: "BB1512", qtd: 100 }, { codigo: "", qtd: 5 }] });
confere("lote com linha errada não grava nada", !r.patch.pr && /Linha 2/.test(r.msg));
r = prReduz(s, { op: "mov_lote", admin: true, por: "Marcus", agora: HOJE, dia: HOJE, itens: [{ codigo: "X1", qtd: 5 }] });
confere("envio sem nome é da Dávila", r.patch.pr.movCasa[0].func === "Davila Aline");

console.log(ok + " ok, " + mal + " falharam");
process.exit(mal ? 1 : 0);
