import { createJiti } from "jiti"; import path from "node:path";
const raiz = process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const C = await jiti.import("@/apps/montagem/domain/comissoes");
let ok=0, falha=0; const t=(n,c,x)=>{ if(c){ok++; console.log("  OK   "+n);} else {falha++; console.log("  FALHA "+n+(x?" -> "+x:""));} };
const ts = "2026-11-12T15:00:00.000Z";
// acerto da Vanessa de R$ 1.000,00: R$ 600,00 por Pix normal e R$ 400,00 por Pix direto para ela; tudo conferido
const base = {id:"A1", tipo:"acerto", tipoKit:"acerto_kit", rev:"Fulana", rep:"Vanessa", data:"2026-11-12", hora:"10:00", valorAcerto:1000, valorDevido:1000,
  pagamentos:[{forma:"pix", valor:600, descricao:"PIX - SAFRA - 34"},{forma:"pix_representante", valor:400, descricao:""}],
  recebimento:{ok:true, em:ts, prom:{ok:true, em:ts}}};
const s1 = {acertosConsignado:[Object.assign({}, base, {fin:{0:{por:"Nayale", ts, conta:"PIX - SAFRA - 34"}, 1:{por:"Nayale", ts, rep:"Vanessa"}}})], comis:{}};
const c = C.comisEfetiva(s1); const itens = C.itensComissao(c, s1, Date.now());
const g = C.grupoDaRep(c, "Vanessa"), data = C.remessaPorData(c, g, "2026-11-12");
const rs = C.resumoSituacao(c, itens, "Vanessa", data, Date.parse("2026-11-25T12:00:00Z"));
console.log("itens:", itens.map(i=>i.id+" pixRep="+i.pixRep+" com="+i.comissao+" pago="+i.valorPago+" dest="+i.dest+" conf="+i.confirmado).join(" | "));
console.log("resumo: comissaoTotal", rs.comissaoTotal, "confirmado", rs.confirmado, "direto", rs.direto, "aPagar", rs.aPagar, "pagos", rs.pagos, "falta", rs.falta);
t("comissão total = 8% de R$ 1.000,00 = R$ 80,00 (antes dava R$ 48,00)", rs.comissaoTotal===80, rs.comissaoTotal);
t("confirmado R$ 80,00", rs.confirmado===80, rs.confirmado);
t("Pix direto de R$ 400,00 entra como já pago", rs.direto===400 && rs.pagos===400, rs.direto+"/"+rs.pagos);
t("restante = 80 - 400 = -320 (ela recebeu a mais; abate do que a empresa deve)", rs.falta===-320, rs.falta);
// Pix direto ainda sem OK do financeiro: comissão fica pendente e não é marcável como pagamento comum
const s2 = {acertosConsignado:[Object.assign({}, base, {fin:{0:{por:"Nayale", ts, conta:"PIX - SAFRA - 34"}}})], comis:{}};
const it2 = C.itensComissao(C.comisEfetiva(s2), s2, Date.now()); const a2 = it2.find(i=>i.id==="A1#1"), b2 = it2.find(i=>i.id==="A1#1x");
t("sem OK: comissão do Pix direto fica pendente, com motivo", a2 && !a2.confirmado && /Pix representante/.test(a2.motivo), a2 && a2.motivo);
t("sem OK: o pagamento direto ainda não tem dona", b2 && b2.pixRep && !b2.dest && !b2.pagoDireto);
// Pix foi para OUTRA representante: comissão é de quem fez o acerto; o pago é de quem recebeu
const s3 = {acertosConsignado:[Object.assign({}, base, {fin:{0:{por:"N", ts, conta:"x"}, 1:{por:"N", ts, rep:"Dayanne"}}})], comis:{}};
const c3 = C.comisEfetiva(s3), it3 = C.itensComissao(c3, s3, Date.now());
const rV = C.resumoSituacao(c3, it3, "Vanessa", data, Date.now()), rD = C.resumoSituacao(c3, it3, "Dayanne", C.remessaPorData(c3, C.grupoDaRep(c3,"Dayanne"), "2026-11-12"), Date.now());
t("Pix para outra: Vanessa fica com a comissão inteira (R$ 80,00) e nada pago", rV.comissaoTotal===80 && rV.pagos===0, rV.comissaoTotal+"/"+rV.pagos);
t("Pix para outra: Dayanne tem R$ 400,00 já pagos e comissão R$ 0,00", rD.pagos===400 && rD.comissaoTotal===0, rD.pagos+"/"+rD.comissaoTotal);
console.log(ok+" certos, "+falha+" falhas"); process.exit(falha?1:0);
