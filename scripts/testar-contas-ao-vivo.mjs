// Teste: pago e a pagar do mês na tela de Faturamento vêm ao vivo da lista completa (DevMaster + Pix lançado no admin + lançamentos à mão), sem duplicar (22/11/2026). Dados INVENTADOS. Uso: node scripts/testar-contas-ao-vivo.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const fin = await jiti.import("@/apps/montagem/domain/financeiro");
const ce = await jiti.import("@/apps/montagem/domain/contas-empresa");
let ok = 0, falha = 0;
const t = (n, c, x) => { if(c){ ok++; console.log("  OK   "+n); } else { falha++; console.log("  FALHA "+n+(x ? " -> "+x : "")); } };
const iso = (d) => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const hoje = new Date(), hojeIso = iso(hoje), ontem = iso(new Date(hoje.getTime()-86400000)), anteontem = iso(new Date(hoje.getTime()-2*86400000));
const ym = hojeIso.slice(0,7), ano = String(hoje.getFullYear()), mes = hoje.getMonth();
const futuro = new Date(hoje.getFullYear(), hoje.getMonth()+2, 15), ymF = iso(futuro).slice(0,7), anoF = String(futuro.getFullYear()), mesF = futuro.getMonth();
// linhas no formato do servidor
const apagarRow = (venc, valor) => ["01", "6.01.01", "Fornecedores", "BAN", "1", "01", "000999", "Fornecedor X", ontem, venc, valor, valor, 0];
const pagaRow = (baixa, valor, extra) => Object.assign(["01", "6.01.01", "Fornecedores", "BAN", "2", "01", "000999", "Fornecedor X", baixa, baixa, valor], extra || {});
const sBase = (extra) => Object.assign({ contasPagar:{ [ano]:{ [mes]:{pago:100, apagar:200} } }, contasPagasDiario:{} }, extra);
// 1) sem DevMaster: igual a antes
const antes = fin.contasDoMes(sBase(), ano, mes);
t("sem DevMaster vale o número lançado", antes.pago===100 && antes.apagar===200 && !antes.aoVivo, JSON.stringify(antes));
// 2) com DevMaster: mês atual
ce.definirContasServidor({ apagar:[apagarRow(hojeIso, 1000), apagarRow(hojeIso, 500.5)], pagas:[pagaRow(ontem, 3000), pagaRow(ontem, 250.25)], geradoEm:"teste" });
const v = fin.contasDoMes(sBase(), ano, mes);
t("mês atual: pago = baixas da DevMaster", Math.abs(v.pago-3250.25)<0.01, v.pago);
t("mês atual: a pagar = títulos em aberto da DevMaster", Math.abs(v.apagar-1500.5)<0.01, v.apagar);
t("marca que veio ao vivo", v.aoVivo===true);
// 3) fixado e manual não mudam
const fx = fin.contasDoMes(sBase({ contasPagar:{ [ano]:{ [mes]:{pago:7, apagar:8, fixado:true} } } }), ano, mes);
t("mês fixado continua com o valor fixado", fx.pago===7 && fx.apagar===8 && !fx.aoVivo);
const mn = fin.contasDoMes(sBase({ contasPagar:{ [ano]:{ [mes]:{pago:9, apagar:10, manual:true} } } }), ano, mes);
t("valor manual do financeiro vale sobre o ao vivo", mn.pago===9 && mn.apagar===10 && !mn.aoVivo);
// 4) mês futuro: o previsto não cai
ce.definirContasServidor({ apagar:[apagarRow(iso(futuro), 1000)], pagas:[], geradoEm:"teste" });
const ft = fin.contasDoMes(sBase({ contasPagar:{ [anoF]:{ [mesF]:{pago:0, apagar:50000} } } }), anoF, mesF);
t("mês futuro usa o previsto quando ele é maior que o lançado", ft.pago===0 && ft.apagar===50000 && ft.aoVivo===true, JSON.stringify(ft));
const ft2 = fin.contasDoMes(sBase({ contasPagar:{ [anoF]:{ [mesF]:{pago:0, apagar:300} } } }), anoF, mesF);
t("mês futuro usa o lançado quando ele é maior que o previsto", ft2.apagar===1000, JSON.stringify(ft2));
// 5) lançamento à mão entra uma vez, vindo SÓ do estado (tela de Faturamento aberta sozinha, sem passar antes por Contas a pagar)
ce.definirContasServidor({ apagar:[apagarRow(hojeIso, 1000)], pagas:[pagaRow(ontem, 500)], geradoEm:"teste" });
const lancX = [{ id:"x1", nat:"3.01.01.12", natNome:"Bônus", nome:"Bônus de teste", pref:"BON", venc:hojeIso, valor:250, filial:"fora", status:"apagar" }];
const lm = fin.contasDoMes(sBase({ cpe:{ lanc:lancX } }), ano, mes);
t("lançamento à mão do estado soma no a pagar", Math.abs(lm.apagar-1250)<0.01, lm.apagar);
const lm2 = fin.contasDoMes(sBase({ cpe:{ lanc:lancX } }), ano, mes);
t("ler de novo o lançamento não duplica", Math.abs(lm2.apagar-1250)<0.01, lm2.apagar);
const sem = fin.contasDoMes(sBase({ cpe:{ lanc:[] } }), ano, mes);
t("tirar o lançamento do estado tira da soma", Math.abs(sem.apagar-1000)<0.01, sem.apagar);
// 6) Pix lançado no admin: só conta depois da última baixa da DevMaster, uma vez só (também vindo só do estado)
const pf = { fornecedores:[{id:1, nome:"Point", tipo:"fornecedor"}], pedidos:[], lancamentos:[
  { id:1, fornId:1, valor:400, data:anteontem, revendedora:"Ana" },
  { id:2, fornId:1, valor:300, data:hojeIso, revendedora:"Bia" } ] };
const px = fin.contasDoMes(sBase({ pf }), ano, mes);
t("Pix do admin depois da última baixa soma uma vez", Math.abs(px.pago-800)<0.01, px.pago);
const px2 = fin.contasDoMes(sBase({ pf }), ano, mes);
t("ler de novo não duplica", Math.abs(px2.pago-800)<0.01, px2.pago);
console.log("\n"+ok+" ok, "+falha+" falha(s)");
process.exit(falha ? 1 : 0);
