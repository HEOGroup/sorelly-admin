// Teste: Pix confirmado no Direcionar para um prestador da família vira repasse, abate a dívida e aparece em Contas a pagar (18/11/2026). Dados INVENTADOS. Uso: node scripts/testar-pix-prestador-familia.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const { reducer } = await jiti.import("@/apps/montagem/state/reducer");
const { novo: inicial } = await jiti.import("@/apps/montagem/state/store");
const ffm = await jiti.import("@/apps/montagem/domain/financeiro-familiar");
let ok = 0, falha = 0;
const t = (n, c, x) => { if(c){ ok++; console.log("  OK   "+n); } else { falha++; console.log("  FALHA "+n+(x ? " -> "+x : "")); } };
let s = inicial();
const ff = JSON.parse(JSON.stringify(s.ff || ffm.ffDemo()));
ff.personas = [{id:"p1", nome:"Sócio Um", ativo:true}, {id:"p2", nome:"Sócio Dois", ativo:true}];
ff.prest = [{id:"pr1", nome:"Prestador Alfa", ativo:true, servico:"Teste", chavePix:"", responsavelId:"p1"}, {id:"pr2", nome:"Prestador Beta", ativo:true, servico:"", chavePix:"", responsavelId:"p2"}];
ff.dividas = [{id:"d1", prestId:"pr1", valor:1000, data:"2026-09-01", prazo:"2026-12-31", descricao:"Serviço A"}, {id:"d2", prestId:"pr2", valor:500, data:"2026-10-01", prazo:"", descricao:"Serviço B"}];
ff.repasses = [];
s = Object.assign({}, s, {ff});
// 1) linhas em Contas a pagar
let it = ffm.itensDividasPrestadores(s.ff, "2026-11-18");
const a1 = it.find(x => x.id==="ffd|d1"), b1 = it.find(x => x.id==="ffd|d2");
t("dívida com prazo vence no prazo", a1 && a1.venc==="2026-12-31" && a1.valor===1000 && a1.status==="apagar", JSON.stringify(a1));
t("dívida sem prazo vence no fim do mês", b1 && b1.venc==="2026-11-30", b1 && b1.venc);
t("dono = sócio responsável", a1 && a1.rateioTxt==="Sócio Um" && b1.rateioTxt==="Sócio Dois");
// 2) destinos dos prestadores
s = reducer(s, {type:"CP", op:"destinos_prest"});
const dA = s.cp.destinos.find(d => d.nome==="Prestador Alfa");
t("prestador com dívida vira destino", dA && dA.tipo==="PRESTADOR" && dA.prestFamId==="pr1");
const nAntes = s.cp.destinos.length; s = reducer(s, {type:"CP", op:"destinos_prest"});
t("não repete destino", s.cp.destinos.length===nAntes);
// 3) Pix confirmado no Direcionar
s = Object.assign({}, s, { dp: Object.assign({}, s.dp || {}, { pix: [{id:"PF1", origem:"interno", quem:"TESTE REVENDEDORA", valor:300, pagos:[], divisoes:[{destinoId:dA.id, valor:300}], status:"fila", forma:"pix"}], regras:[] }) });
s = reducer(s, {type:"DP", op:"confirma", id:"PF1", por:"Teste"});
t("virou 1 repasse do Direcionar", s.ff.repasses.filter(r => r.origemDirecionar==="PF1#0").length===1);
it = ffm.itensDividasPrestadores(s.ff, "2026-11-18");
t("dívida caiu de 1000 para 700", it.find(x => x.id==="ffd|d1").valor===700, JSON.stringify(it.find(x => x.id==="ffd|d1")));
t("conta no sócio certo (Pix do sócio)", s.ff.repasses[0].origemPixPersonaId==="p1");
s = reducer(s, {type:"DP", op:"confirma", id:"PF1", por:"Teste"});
t("confirmar de novo não duplica", s.ff.repasses.filter(r => r.origemDirecionar==="PF1#0").length===1);
// 4) quita tudo => vira paga
s = Object.assign({}, s, { dp: Object.assign({}, s.dp, { pix: s.dp.pix.concat([{id:"PF2", origem:"interno", quem:"TESTE 2", valor:700, pagos:[], divisoes:[{destinoId:dA.id, valor:700}], status:"fila", forma:"pix"}]) }) });
s = reducer(s, {type:"DP", op:"confirma", id:"PF2", por:"Teste"});
it = ffm.itensDividasPrestadores(s.ff, "2026-11-18");
t("quitada vira Paga", it.find(x => x.id==="ffd|d1").status==="pago");
// 5) reabrir retira
s = reducer(s, {type:"DP", op:"reabre", id:"PF2"});
it = ffm.itensDividasPrestadores(s.ff, "2026-11-18");
t("reabrir o Pix devolve o saldo", it.find(x => x.id==="ffd|d1").status==="apagar" && it.find(x => x.id==="ffd|d1").valor===700);
// 6) a sugestão de "prestador menor" não usa o prestador da família
const dir = await jiti.import("@/apps/montagem/domain/direcionar-pix");
const sug = dir.sugerir({id:"x", origem:"interno", valor:100, pagos:[]}, {cp:s.cp, regras:dir.REGRAS0, cnpjs:[], regrasPx:[]});
t("sugestão não oferece prestador da família", !sug.opcoes.some(o => /Prestador (Alfa|Beta)/.test(o.nome)));
console.log(ok+" ok, "+falha+" falha"); process.exit(falha ? 1 : 0);
