// Teste: OBSERVAÇÕES DA CONTA da Família (Marcus, 22/11/2026). Dados INVENTADOS.
// Uso: node scripts/testar-nota-da-conta.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const ffm = await jiti.import("@/apps/montagem/domain/financeiro-familiar");
let ok = 0, falha = 0;
const t = (n, c, x) => { if(c){ ok++; console.log("  OK   "+n); } else { falha++; console.log("  FALHA "+n+(x ? " -> "+x : "")); } };
const ff0 = () => ({personas:[{id:"marcus", nome:"Marcus", tipo:"SOCIO", ativo:true}], categorias:[], contasBanc:[], contas:[{id:"c1", personaId:"marcus", descricao:"Conta Teste", categoria:"OUTROS", dia:5, forma:"Boleto", obs:"antiga"}], parcelas:{c1:{"2026-12":{valor:100, pagamentos:[]}}}, pix:[], pixMeta:{}, repasses:[], dividas:[], prest:[], hist:[], liberados:[], fechamentos:{}, transf:[], regras:[], prolabore:{}});
const run = (ff, a) => { const r = ffm.ffReduz({ff:ff}, Object.assign({type:"FF", por:"Teste"}, a)); return {ff:(r.patch && r.patch.ff) || ff, msg:r.msg, vazio:!(r.patch && r.patch.ff)}; };
let r = run(ff0(), {op:"conta_nota", id:"c1", txt:"  Pagar   só depois do dia 10  "});
t("anota e limpa os espaços", r.ff.contas[0].notas && r.ff.contas[0].notas[0].txt==="Pagar só depois do dia 10", JSON.stringify(r.ff.contas[0].notas));
t("guarda quem anotou e a data", r.ff.contas[0].notas[0].por==="Teste" && /^\d{4}-\d{2}-\d{2}T/.test(r.ff.contas[0].notas[0].em));
t("a observação antiga continua", r.ff.contas[0].obs==="antiga");
r = run(r.ff, {op:"conta_nota", id:"c1", txt:"Segunda nota"});
t("a segunda nota entra depois da primeira", r.ff.contas[0].notas.length===2 && r.ff.contas[0].notas[1].txt==="Segunda nota");
r = run(r.ff, {op:"conta_nota", id:"c1", txt:"   "});
t("texto vazio é recusado", r.vazio && /Escreva/.test(r.msg || ""), r.msg);
r = run(ff0(), {op:"conta_nota", id:"xx", txt:"a"});
t("conta que não existe é recusada", r.vazio);
console.log("\n"+ok+" ok, "+falha+" com falha");
process.exit(falha ? 1 : 0);
