// Teste: "Encerrar conta" no Financeiro familiar tira as parcelas em aberto e guarda o histórico pago (19/11/2026). Dados INVENTADOS. Uso: node scripts/testar-encerrar-conta.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const ffm = await jiti.import("@/apps/montagem/domain/financeiro-familiar");
let ok = 0, falha = 0;
const t = (n, c, x) => { if(c){ ok++; console.log("  OK   "+n); } else { falha++; console.log("  FALHA "+n+(x ? " -> "+x : "")); } };
const base = () => ({ ff: { personas:[{id:"p1", nome:"Sócio Um", ativo:true}], contas:[
  {id:"c1", personaId:"p1", descricao:"Conta com histórico", categoria:"OUTROS", dia:13, forma:"PIX", encerraEm:null},
  {id:"c2", personaId:"p1", descricao:"Conta sem pagamento", categoria:"OUTROS", dia:5, forma:"PIX", encerraEm:null}],
  parcelas:{
    c1:{"2026-08":{valor:100, pagamentos:[{valor:100, em:"2026-08-13"}]}, "2026-09":{valor:100, pagamentos:[{valor:100, em:"2026-09-14"}]}, "2026-10":{valor:100, pagamentos:[]}, "2026-11":{valor:100, pagamentos:[]}, "2026-12":{valor:100, pagamentos:[]}},
    c2:{"2026-11":{valor:50, pagamentos:[]}, "2026-12":{valor:50, pagamentos:[]}}},
  repasses:[], prest:[], dividas:[], hist:[], liberados:[] } });
const run = (s, a) => ffm.ffReduz(s, Object.assign({type:"FF", por:"teste"}, a));
// 1) conta com histórico: tira as abertas, guarda as pagas
let r = run(base(), {op:"conta_encerrar", id:"c1"});
const s1 = { ff: r.patch.ff };
const ff1 = s1.ff;
t("operação aceita", !!r.patch.ff, r.msg);
t("conta continua na lista", ff1.contas.some(c => c.id==="c1"));
t("parcelas pagas ficam (ago e set)", Object.keys(ff1.parcelas.c1).join(",")==="2026-08,2026-09", Object.keys(ff1.parcelas.c1).join(","));
t("encerraEm = último mês pago", ff1.contas.find(c => c.id==="c1").encerraEm==="2026-09");
t("pagamentos intactos", ff1.parcelas.c1["2026-08"].pagamentos.length===1 && ff1.parcelas.c1["2026-09"].pagamentos[0].valor===100);
const aberto = ffm.parcelasDe(ff1, {}, "2026-11-19").filter(x => x.conta.id==="c1" && x.status!=="PAGO");
t("nada em aberto na conta encerrada", aberto.length===0, aberto.length+" abertas");
// 2) conta sem nenhum pagamento: sai por inteiro
const r2 = run(base(), {op:"conta_encerrar", id:"c2"});
const ff2 = r2.patch.ff;
t("conta sem pagamento sai inteira", !ff2.contas.some(c => c.id==="c2") && !ff2.parcelas.c2);
t("outra conta não é tocada", ff2.contas.some(c => c.id==="c1") && Object.keys(ff2.parcelas.c1).length===5);
// 3) segunda vez: nada para tirar
const r3 = run(s1, {op:"conta_encerrar", id:"c1"});
t("encerrar de novo recusa", !r3.patch.ff, r3.msg);
// 4) conta que não existe
const r4 = run(base(), {op:"conta_encerrar", id:"zzz"});
t("conta inexistente recusa", !r4.patch.ff, r4.msg);
console.log("\n"+ok+" ok, "+falha+" falha(s)");
process.exit(falha ? 1 : 0);
