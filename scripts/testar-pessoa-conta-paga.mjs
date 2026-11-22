// Teste: mudar a pessoa de uma conta JÁ PAGA no Financeiro familiar, sem estornar e sem baixar de novo (pedido da Anamaria, 22/11/2026). Dados INVENTADOS. Uso: node scripts/testar-pessoa-conta-paga.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const m = await jiti.import("@/apps/montagem/domain/financeiro-familiar");
let ok = 0, falha = 0;
const t = (n, c, x) => { if(c){ ok++; console.log("  OK   "+n); } else { falha++; console.log("  FALHA "+n+(x ? " -> "+x : "")); } };
const base = () => ({ personas:[{id:"marcus", nome:"Marcus", tipo:"SOCIO", ativo:true}, {id:"anamaria", nome:"Anamaria", tipo:"SOCIO", ativo:true}, {id:"familia", nome:"Casa/Família", tipo:"CASA", ativo:true}],
  contas:[{id:"c1", personaId:"marcus", descricao:"Seguro", categoria:"SEGURO", dia:10, forma:"PIX", encerraEm:null}],
  parcelas:{ c1:{ "2026-08":{valor:500, pagamentos:[{valor:500, em:"2026-08-10", forma:"PIX", conta:"Conta Marcus — Nubank"}]}, "2026-11":{valor:500, pagamentos:[{valor:500, em:"2026-11-10", forma:"PIX", conta:"Conta Marcus — Nubank"}]}, "2026-12":{valor:500, pagamentos:[]} } },
  contasBanc:[], repasses:[], prest:[], dividas:[], hist:[], liberados:[], pix:[] });
const run = (ff, a) => m.ffReduz({ ff }, Object.assign({type:"FF", por:"teste"}, a));
// 1) muda a pessoa de uma conta com meses pagos, inclusive mês passado travado
let r = run(base(), {op:"conta_set", id:"c1", patch:{personaId:"anamaria"}});
const ff1 = r.patch.ff;
t("a operação foi aceita", !!ff1, r.msg);
t("a pessoa da conta mudou", ff1.contas[0].personaId==="anamaria");
t("o pagamento de agosto (mês passado) continua igual", ff1.parcelas.c1["2026-08"].pagamentos.length===1 && ff1.parcelas.c1["2026-08"].pagamentos[0].valor===500);
t("o pagamento de novembro continua igual", ff1.parcelas.c1["2026-11"].pagamentos.length===1 && ff1.parcelas.c1["2026-11"].pagamentos[0].em==="2026-11-10");
t("nada foi estornado nem baixado de novo (mesmo número de pagamentos)", ff1.parcelas.c1["2026-08"].pagamentos.length + ff1.parcelas.c1["2026-11"].pagamentos.length === 2);
const pagasAna = m.parcelasDe(ff1, {}, "2026-11-22").filter((x) => x.pago > 0 && m.daPessoa(x.conta, "anamaria"));
const pagasMar = m.parcelasDe(ff1, {}, "2026-11-22").filter((x) => x.pago > 0 && m.daPessoa(x.conta, "marcus"));
t("as parcelas pagas passam a aparecer na Anamaria", pagasAna.length===2, pagasAna.length);
t("e saem do Marcus", pagasMar.length===0, pagasMar.length);
t("a mudança fica no histórico", ff1.hist.length>0 && /Editou conta/.test(ff1.hist[0].acao), ff1.hist[0] && ff1.hist[0].acao);
// 2) Família (divide entre os sócios)
const r2 = run(base(), {op:"conta_set", id:"c1", patch:{personaId:m.FAMILIA4}});
const ff2 = r2.patch.ff;
t("Família vira conta dividida entre os sócios", ff2 && ff2.contas[0].rateio && ff2.contas[0].rateio.length>=2, JSON.stringify(ff2 && ff2.contas[0].rateio));
t("na Família o pagamento também continua", ff2.parcelas.c1["2026-08"].pagamentos.length===1);
// 3) voltar para uma pessoa limpa o rateio
const r3 = run(ff2, {op:"conta_set", id:"c1", patch:{personaId:"marcus"}});
t("voltar para uma pessoa tira a divisão", r3.patch.ff && r3.patch.ff.contas[0].personaId==="marcus" && !(r3.patch.ff.contas[0].rateio && r3.patch.ff.contas[0].rateio.length), JSON.stringify(r3.patch.ff && r3.patch.ff.contas[0].rateio));
// 4) conta que não existe
const r4 = run(base(), {op:"conta_set", id:"zzz", patch:{personaId:"anamaria"}});
t("conta inexistente é recusada", !r4.patch.ff, r4.msg);
console.log("\n"+ok+" ok, "+falha+" falha(s)");
process.exit(falha ? 1 : 0);
