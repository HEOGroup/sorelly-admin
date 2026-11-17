// Teste do Pagamento em joias (RH, 17/11/2026): pedido, etapas em ordem, cancelamento, resumo e recibo. Roda o domínio de verdade, sem navegador.
// Uso: node scripts/testar-joias-pagamento.mjs   (saída 1 = alguma verificação falhou)
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.argv[2] || process.cwd();
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const J = await jiti.import("@/apps/montagem/domain/joias-pagamento");

let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if(cond){ ok++; console.log("  OK   "+nome); } else { falha++; console.log("  FALHA "+nome+(extra ? " -> "+extra : "")); } };
const JP = (s, a) => { const r = J.jpReduz(s, Object.assign({por:"Teste", agora:"2026-11-17T09:00:00"}, a)); return {s:Object.assign({}, s, r.patch), msg:r.msg, mudou:Object.keys(r.patch).length>0}; };

let s = {jp:J.jpMigrar(null)};
t("nasce vazio", Array.isArray(s.jp.itens) && s.jp.itens.length===0);
t("custo padrão é 20%", J.CUSTO_PADRAO===20 && J.pctCusto("")===20 && J.pctCusto(150)===20 && J.pctCusto(10)===10);

let r = JP(s, {op:"add", item:{pessoa:"", setor:"Marketing", valor:500}}); t("recusa sem nome", !r.mudou);
r = JP(s, {op:"add", item:{pessoa:"Ana", setor:"Inexistente", valor:500}}); t("recusa setor inválido", !r.mudou);
r = JP(s, {op:"add", item:{pessoa:"Ana", setor:"Marketing", valor:0}}); t("recusa sem valor", !r.mudou);
r = JP(s, {op:"add", item:{id:"x1", pessoa:" Ana Paula ", setor:"Marketing", motivo:"Modelo para fotos", descricao:"Fotos da semana", valor:500, custoPct:"", pecas:"a2357 cl2771"}});
s = r.s;
let x = s.jp.itens[0];
t("registra o pedido (nome limpo, peças em maiúscula, custo 20%)", r.mudou && x.pessoa==="Ana Paula" && x.situacao==="Pedido" && x.pecas==="A2357 CL2771" && x.custoPct===20 && x.mes==="2026-11");
t("custo de R$ 500,00 a 20% é R$ 100,00", J.custoDe(x)===100);
t("não registra o mesmo id duas vezes", !JP(s, {op:"add", item:{id:"x1", pessoa:"Ana", setor:"Marketing", valor:100}}).mudou);

t("não separa antes de autorizar", !JP(s, {op:"etapa", id:"x1", para:"Separado"}).mudou);
t("não retira antes de separar", !JP(s, {op:"etapa", id:"x1", para:"Retirado"}).mudou);
r = JP(s, {op:"etapa", id:"x1", para:"Autorizado", por:"Marcus"}); s = r.s; x = s.jp.itens[0];
t("autoriza e guarda quem", x.situacao==="Autorizado" && x.autorizadoPor==="Marcus");
t("não autoriza duas vezes", !JP(s, {op:"etapa", id:"x1", para:"Autorizado"}).mudou);
r = JP(s, {op:"etapa", id:"x1", para:"Separado", por:"Rayssa", pecas:"a2357 b5222"}); s = r.s; x = s.jp.itens[0];
t("separa, guarda quem e atualiza as peças", x.situacao==="Separado" && x.separadoPor==="Rayssa" && x.pecas==="A2357 B5222");
r = JP(s, {op:"etapa", id:"x1", para:"Retirado", por:"Amanda", recebeu:""}); s = r.s; x = s.jp.itens[0];
t("retira (quem recebeu cai no nome da pessoa)", x.situacao==="Retirado" && x.recebeu==="Ana Paula" && x.retiradoPor==="Amanda");
t("histórico guarda as 4 etapas", x.historico.length===4 && x.historico.map(h=>h.ato).join(",")==="Pedido criado,Autorizado,Separado,Retirado");
t("não cancela o que já foi retirado", !JP(s, {op:"cancelar", id:"x1"}).mudou);
t("não apaga o que já foi retirado", !JP(s, {op:"apagar", id:"x1"}).mudou);
t("recibo traz pessoa, valor, peças e as três datas", /Ana Paula/.test(J.jpRecibo(x)) && /R\$ 500,00/.test(J.jpRecibo(x)) && /A2357 B5222/.test(J.jpRecibo(x)) && /Retirado por: Ana Paula em 17\/11\/2026/.test(J.jpRecibo(x)));

r = JP(s, {op:"add", item:{id:"x2", pessoa:"Beatriz", setor:"Marketing", valor:200, custoPct:30}}); s = r.s;
r = JP(s, {op:"add", item:{id:"x3", pessoa:"Deysiane", setor:"Produção", valor:300}}); s = r.s;
r = JP(s, {op:"cancelar", id:"x3"}); s = r.s;
t("cancela um pedido", s.jp.itens.find(i=>i.id==="x3").situacao==="Cancelado");
const res = J.jpResumo(s.jp);
t("resumo por mês e setor não conta o cancelado", res.length===1 && res[0].setor==="Marketing" && res[0].qtd===2 && res[0].valor===700 && res[0].custo===160 && res[0].retirado===500, JSON.stringify(res));
r = JP(s, {op:"apagar", id:"x3"}); s = r.s;
t("apaga o cancelado", !s.jp.itens.some(i=>i.id==="x3"));
t("apaga um pedido", JP(s, {op:"apagar", id:"x2"}).s.jp.itens.length===1);
t("pagamento que não existe", !JP(s, {op:"etapa", id:"nada", para:"Autorizado"}).mudou);

console.log("\n"+ok+" verificações OK, "+falha+" com falha.");
process.exit(falha ? 1 : 0);
