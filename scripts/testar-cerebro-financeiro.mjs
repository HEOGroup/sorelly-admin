// Teste do cérebro do Financeiro v1 (18/11/2026): regras de orientação por CNPJ com dados INVENTADOS. Uso: node scripts/testar-cerebro-financeiro.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const { orientacaoDoDia } = await jiti.import("@/apps/montagem/domain/cerebro-financeiro");
let ok = 0, falha = 0;
const t = (n, c, x) => { if(c){ ok++; console.log("  OK   "+n); } else { falha++; console.log("  FALHA "+n+(x ? " -> "+x : "")); } };

const sc = (saldos) => ({
  blocos:[{id:"34", nome:"34"}, {id:"46", nome:"46"}, {id:"59", nome:"59"}, {id:"67", nome:"67"}],
  contas:[
    {id:"sicredi_34", nome:"Sicredi Sorelly 34", bloco:"34", tipo:"PJ", limite:50000}, {id:"sicredi_rot_34", nome:"Sicredi Rotativo 34", bloco:"34", tipo:"PJ", limite:65000},
    {id:"safra_34", nome:"Safra 34", bloco:"34", tipo:"PJ", limite:45000}, {id:"unicred_34", nome:"Unicred 34", bloco:"34", tipo:"PJ", limite:20000},
    {id:"sicredi_46", nome:"Sicredi 46", bloco:"46", tipo:"PJ", limite:20000}, {id:"bradesco_46", nome:"Bradesco 46", bloco:"46", tipo:"PJ", limite:7200},
    {id:"sicredi_59", nome:"Sicredi 59", bloco:"59", tipo:"PJ", limite:50000},
    {id:"sicredi_axis_67", nome:"Sicredi Axis 67", bloco:"67", tipo:"PJ", limite:3000}],
  saldos:saldos});
const HOJE = "2026-11-18";
const s1 = sc({"2026-11-18":{sicredi_34:5897.94, sicredi_rot_34:-59928.5, safra_34:-41802.89, unicred_34:-19664.58, sicredi_46:101902.05, bradesco_46:2892.71, sicredi_59:40404.08, sicredi_axis_67:141.43}});
const itens = [
  {filial:"34", venc:"2025-11-15", valor:4065}, {filial:"34", venc:"2026-10-07", valor:1356.54}, {filial:"34", venc:"2026-11-19", valor:31165.10}, {filial:"34", venc:"2026-11-23", valor:65710.25},
  {filial:"67", venc:"2026-11-19", valor:18508.18},
  {filial:"59", venc:"2026-11-21", valor:77887.95},
  {filial:"46", venc:"2026-11-19", valor:20000}];
let av = orientacaoDoDia(s1, itens, HOJE);
const de = (c, tipo) => av.filter(a => a.cnpj===c && a.tipo===tipo);
const a67 = de("67", "Cobertura")[0];
t("Axis: contas de amanhã passam do disponível e é urgente", a67 && a67.pri===1 && Math.abs(a67.valor-(18508.18-3141.43))<0.01, JSON.stringify(a67));
const a34 = de("34", "Cobertura")[0];
t("34: o pico de 23/11 só vira aviso de atenção (dentro de 10 dias)", a34 && a34.pri===2 && a34.quando==="2026-11-23", JSON.stringify(a34));
t("34: conta atrasada entra na soma (cheque de 2025)", a34 && a34.texto.indexOf("atrasadas")>=0);
const rot = de("34", "Rotativo")[0];
t("34: o saldo positivo do Sicredi amortiza o Rotativo (R$ 5.897,94)", rot && Math.abs(rot.valor-5897.94)<0.01, JSON.stringify(rot));
const neg = de("34", "Conta negativa");
t("34: três negativas na ordem Safra, Rotativo + Sicredi, Unicred", neg.length===3 && /Safra/.test(neg[0].texto) && /Rotativo/.test(neg[1].texto) && /Unicred/.test(neg[2].texto), neg.map(x => x.texto.slice(0, 22)).join(" | "));
t("34: Rotativo + Sicredi contam juntos (−R$ 54.030,56)", neg[1] && Math.abs(neg[1].valor-54030.56)<0.01, JSON.stringify(neg[1]));
t("59: o disponível cobre e não há aviso de cobertura", de("59", "Cobertura").length===0);
t("46: tem folga e não há aviso de cobertura", de("46", "Cobertura").length===0);

// até R$ 2.000 negativo: manda só o suficiente
const s2 = sc({"2026-11-18":{sicredi_34:100, sicredi_rot_34:0, safra_34:0, unicred_34:0, sicredi_46:50000, bradesco_46:-1500, sicredi_59:1000, sicredi_axis_67:1000}});
av = orientacaoDoDia(s2, [], HOJE);
const peq = de("46", "Conta negativa")[0];
t("conta com pouco negativo: manda só o suficiente para ficar positiva", peq && peq.pri===2 && Math.abs(peq.valor-1500)<0.01 && /só R\$ 1\.500,00/.test(peq.texto), JSON.stringify(peq));

// vence hoje: urgente
av = orientacaoDoDia(s2, [{filial:"59", venc:"2026-11-18", valor:60000}], HOJE);
t("conta de hoje maior que o disponível: urgente", de("59", "Cobertura")[0] && de("59", "Cobertura")[0].pri===1);
// título sem vencimento ou com valor zero não entra
av = orientacaoDoDia(s2, [{filial:"59", venc:"", valor:999999}, {filial:"59", venc:"2026-11-19", valor:0}], HOJE);
t("título sem vencimento ou valor zero não gera aviso", de("59", "Cobertura").length===0);
// saldos
av = orientacaoDoDia({blocos:[], contas:[], saldos:{}}, [], HOJE);
t("sem nenhum saldo lançado: avisa", av.length===1 && av[0].tipo==="Saldos");
av = orientacaoDoDia(sc({"2026-11-16":{sicredi_34:1}}), [], HOJE);
t("saldo de dias atrás: avisa a data do último e segue com ele", av.some(a => a.tipo==="Saldos" && a.quando==="2026-11-16"));
// ordenação: urgente primeiro
av = orientacaoDoDia(s1, itens, HOJE);
t("avisos urgentes vêm primeiro", av[0].pri===1 && av.every((a, i) => i===0 || a.pri>=av[i-1].pri));
console.log(ok+" ok, "+falha+" falha"); process.exit(falha ? 1 : 0);
