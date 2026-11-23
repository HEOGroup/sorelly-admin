// Teste da chegada das comissões do servidor no navegador (23/11/2026): o que só existia no navegador não se perde na primeira vez; depois vale o servidor.
// Uso: node scripts/testar-comis-servidor.mjs   (saída 1 = alguma verificação falhou)
import { createJiti } from "jiti"; import path from "node:path";
const raiz = process.cwd(); const guard = {};
globalThis.localStorage = { getItem(k){ return guard[k] ?? null; }, setItem(k, v){ guard[k] = v; }, removeItem(k){ delete guard[k]; } };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const { reducer } = await jiti.import("@/apps/montagem/state/reducer");
const { novo: inicial } = await jiti.import("@/apps/montagem/state/store");
let ok = 0, falha = 0; const t = (n, c, x) => { if(c){ ok++; console.log("  OK   "+n); } else { falha++; console.log("  FALHA "+n+(x ? " -> "+x : "")); } };
let s = inicial();
s = Object.assign({}, s, {comis:Object.assign({}, s.comis, {reps:[{nome:"Vanessa", pct:10, grupo:"A"}], fech:{"2026-11-21|Vanessa":{km:120, kmPor:"rep", pagamentos:[{valor:50, ts:"t1", forma:"pix"}]}, "2026-11-11|Dayanne":{pagamentos:[{valor:30, ts:"t9"}]}}})});
// servidor manda: sem lista de percentuais, e para a mesma data da Vanessa um pagamento diferente
s = reducer(s, {type:"SYNC_MODULO", chave:"comis", conteudo:{pctPadrao:8, reps:[], fech:{"2026-11-21|Vanessa":{pagamentos:[{valor:70, ts:"t2", forma:"pix"}]}}}});
const f = s.comis.fech["2026-11-21|Vanessa"];
t("1ª vez: pagamentos do servidor e do navegador ficam os dois", f.pagamentos.length===2, JSON.stringify(f.pagamentos));
t("1ª vez: o km que só estava no navegador continua", f.km===120);
t("1ª vez: data que só existia no navegador continua", !!s.comis.fech["2026-11-11|Dayanne"]);
t("1ª vez: lista de percentuais do navegador vale se o servidor não tem", s.comis.reps.length===1 && s.comis.reps[0].pct===10);
t("marca de primeira vez gravada", s.comis._srv===true);
t("cópia de segurança guardada no navegador", !!guard.sorelly_comis_antes_servidor);
// segunda vez: vale o servidor (um pagamento foi apagado em outro computador)
s = reducer(s, {type:"SYNC_MODULO", chave:"comis", conteudo:{fech:{"2026-11-21|Vanessa":{km:120, kmPor:"rep", pagamentos:[{valor:70, ts:"t2", forma:"pix"}]}}}});
t("depois: vale o servidor (pagamento apagado some)", s.comis.fech["2026-11-21|Vanessa"].pagamentos.length===1);
console.log(ok+" certos, "+falha+" falhas"); process.exit(falha ? 1 : 0);
