// Teste: baixas do Contas a pagar (cpe) e configuração do Direcionar (dpc) passam a ir para o servidor (18/11/2026). Dados INVENTADOS. Uso: node scripts/testar-sync-contas-a-pagar.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
globalThis.document = globalThis.document || { addEventListener(){}, removeEventListener(){}, getElementById(){ return null; } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const { reducer } = await jiti.import("@/apps/montagem/state/reducer");
const { novo: inicial } = await jiti.import("@/apps/montagem/state/store");
const sm = await jiti.import("@/apps/montagem/lib/sync-modulos");
const ep = await jiti.import("@/apps/montagem/lib/estado-patch");
const perm = await jiti.import("@/server/permissoes.js");
let ok = 0, falha = 0;
const t = (n, c, x) => { if(c){ ok++; console.log("  OK   "+n); } else { falha++; console.log("  FALHA "+n+(x ? " -> "+x : "")); } };
const bx = (id, chave, v) => ({id, chave, data:"2026-11-18", forma:"PIX", conta:"c1", principal:v, juros:0, multa:0, desc:0, por:1, em:1000+v, desc_txt:"Conta "+id});

t("módulos cpe e dpc estão na lista de sincronia", sm.modulosLigados().includes("cpe") && sm.modulosLigados().includes("dpc"));
t("servidor aceita cpe e dpc para o Financeiro", perm.podeModulo({perfil:"USER", setores:["financeiro"]}, "cpe") && perm.podeModulo({perfil:"USER", setores:["financeiro"]}, "dpc") && !perm.podeModulo({perfil:"USER", setores:["montagem"]}, "cpe"));

// ---- duas pessoas: A (primeira a subir) e B (tem uma baixa só dela)
let A = inicial(), B = inicial();
A = reducer(A, {type:"CPE_BAIXA", baixas:[bx("bxA", "conta|1", 100)]});
A = reducer(A, {type:"CPE_FILIAL", chave:"conta|9", filial:"46", por:1, desc:"x", valor:5});
B = reducer(B, {type:"CPE_BAIXA", baixas:[bx("bxB", "conta|2", 200)]});
const noServidor = JSON.parse(JSON.stringify(sm.fatiaDoModulo(A, "cpe")));   // A sobe a carga inicial
t("fatia do cpe leva baixas, classe e histórico com id", noServidor.baixas.length===1 && noServidor.classe["fil|conta|9"]==="46" && noServidor.hist.every(h => h.id));
// B recebe pela primeira vez: junta
B = reducer(B, {type:"SYNC_MODULO", chave:"cpe", conteudo:noServidor});
t("B recebeu a baixa de A", B.cpe.baixas.some(x => x.id==="bxA"));
t("B NÃO perdeu a baixa dela", B.cpe.baixas.some(x => x.id==="bxB"));
t("B recebeu a troca de CNPJ de A", B.cpe.classe["fil|conta|9"]==="46");
t("histórico de B tem as duas baixas", B.cpe.hist.filter(h => h.acao==="Deu baixa").length===2);
// B manda a diferença; o servidor aplica
const fatB = sm.fatiaDoModulo(B, "cpe"); let srv = JSON.parse(JSON.stringify(noServidor));
Object.keys(fatB).forEach(k => { const op = ep.diff(noServidor[k], JSON.parse(JSON.stringify(fatB[k]))); if(op) srv[k] = ep.aplicar(srv[k], op); });
t("servidor ficou com as duas baixas", srv.baixas.length===2 && srv.baixas.some(x => x.id==="bxA") && srv.baixas.some(x => x.id==="bxB"));
const opB = ep.diff(noServidor.baixas, JSON.parse(JSON.stringify(fatB.baixas)));
t("B mandou só a baixa nova (não a lista inteira)", opB && opB.$a && opB.$a.u.length===1 && opB.$a.u[0].id==="bxB", JSON.stringify(opB).slice(0, 120));
const opH = ep.diff(noServidor.hist, JSON.parse(JSON.stringify(fatB.hist)));
t("histórico também vai linha por linha", opH && opH.$a && !opH.$set);
// A desfaz a própria baixa; B (já sincronizado) recebe e a baixa SOME (não ressuscita)
let srv2 = Object.assign({}, srv, {baixas:srv.baixas.filter(x => x.id!=="bxA")});
B = reducer(B, {type:"SYNC_MODULO", chave:"cpe", conteudo:{baixas:srv2.baixas}});
t("baixa desfeita por A some em B (depois da primeira chegada vale o servidor)", !B.cpe.baixas.some(x => x.id==="bxA") && B.cpe.baixas.some(x => x.id==="bxB"));
// receber de novo o mesmo conteúdo não muda nada (não regrava sem parar)
const antes = JSON.stringify(sm.fatiaDoModulo(B, "cpe")); B = reducer(B, {type:"SYNC_MODULO", chave:"cpe", conteudo:{baixas:srv2.baixas}});
t("receber o mesmo conteúdo não muda nada", JSON.stringify(sm.fatiaDoModulo(B, "cpe"))===antes);

// ---- configuração do Direcionar
let L = inicial(), M = inicial();
L = Object.assign({}, L, {dp:Object.assign({}, L.dp, {contasRep:{Thalita:"dL"}, contasRepExtra:{}, limiteAlto:3000})});   // Lucas marcou à mão
M = Object.assign({}, M, {dp:Object.assign({}, M.dp, {contasRep:{Thalita:"dAuto", Anne:"dM"}, contasRepExtra:{Thalita:{auto:true, de:"Maquininha"}}, limiteAlto:2000})});   // Marcus subiu primeiro
const srvD = JSON.parse(JSON.stringify(sm.fatiaDoModulo(M, "dpc")));
t("fatia do dpc leva só a configuração (sem a fila)", srvD.contasRep && srvD.limiteAlto===2000 && srvD.pix===undefined);
L = reducer(L, {type:"SYNC_MODULO", chave:"dpc", conteudo:srvD});
t("conta fixa marcada à mão vence a automática na primeira chegada", L.dp.contasRep.Thalita==="dL" && !(L.dp.contasRepExtra.Thalita||{}).auto, JSON.stringify(L.dp.contasRep));
t("conta fixa que só o servidor tinha chega", L.dp.contasRep.Anne==="dM");
t("valor fora do normal vem do servidor", L.dp.limiteAlto===2000);
t("a fila de pedidos não é mexida", Array.isArray(L.dp.pix));
L = reducer(L, {type:"SYNC_MODULO", chave:"dpc", conteudo:{contasRep:{Anne:"dM"}}});
t("depois da primeira chegada vale o servidor (conta fixa solta por outra pessoa some)", L.dp.contasRep.Thalita===undefined && L.dp.contasRep.Anne==="dM");
console.log(ok+" ok, "+falha+" falha"); process.exit(falha ? 1 : 0);
