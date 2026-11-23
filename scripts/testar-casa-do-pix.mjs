// Teste: PARA QUAL CASA o Pix da Casa foi (Marcus, 22/11/2026). Dados INVENTADOS.
// Confere: o campo "casa" do Pix (pix_add, pix_editar, pix_set), a cópia da Contas a receber (espelharNaFamilia) e a validação do lançamento.
// Uso: node scripts/testar-casa-do-pix.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const ffm = await jiti.import("@/apps/montagem/domain/financeiro-familiar");
const ra = await jiti.import("@/apps/montagem/domain/recebimentos-antecipados");
let ok = 0, falha = 0;
const t = (n, c, x) => { if(c){ ok++; console.log("  OK   "+n); } else { falha++; console.log("  FALHA "+n+(x ? " -> "+x : "")); } };
const ff0 = () => ({personas:[{id:"familia", nome:"Casa/Família", tipo:"FAMILIAR", ativo:true}, {id:"anabeatriz", nome:"Ana Beatriz", tipo:"SOCIO", ativo:true}], categorias:[], contasBanc:[{id:"cb1", nome:"Conta Teste", personaId:"familia", ativo:true}], contas:[], parcelas:{}, pix:[], pixMeta:{}, repasses:[], dividas:[], prest:[], hist:[], liberados:[], fechamentos:{}, transf:[], regras:[], prolabore:{}});
const red = (ff, a) => { const r = ffm.ffReduz({ff:ff}, Object.assign({type:"FF", por:"teste"}, a)); return {ff:(r.patch && r.patch.ff) || ff, msg:r.msg}; };

console.log("1) pix_add / pix_editar / pix_set");
let ff = ff0();
let r = red(ff, {op:"pix_add", personaId:"familia", data:"2026-11-10", valor:1000, origem:"Rev Teste Silva", contaId:"cb1", casa:"casaalphaville"});
ff = (r && r.ff) || ff; let px = ff.pix[0];
t("pix_add grava a casa", px && px.casa==="casaalphaville", JSON.stringify(px));
r = red(ff, {op:"pix_add", personaId:"familia", data:"2026-11-10", valor:500, origem:"Rev Teste Dois", contaId:"cb1", casa:"casa-inventada"});
ff = (r && r.ff) || ff;
t("casa inválida não grava", ff.pix[1] && ff.pix[1].casa===undefined, JSON.stringify(ff.pix[1]));
r = red(ff, {op:"pix_editar", id:ff.pix[0].id, patch:{casa:"juan"}}); ff = (r && r.ff) || ff;
t("pix_editar troca a casa", ff.pix[0].casa==="juan", JSON.stringify(ff.pix[0]));
r = red(ff, {op:"pix_editar", id:ff.pix[0].id, patch:{casa:""}}); ff = (r && r.ff) || ff;
t("pix_editar com casa vazia tira a casa", ff.pix[0].casa===undefined, JSON.stringify(ff.pix[0]));
r = red(ff, {op:"pix_set", id:ff.pix[1].id, patch:{personaId:"anabeatriz", casa:""}}); ff = (r && r.ff) || ff;
t("pix_set move o Pix para um sócio", ff.pix[1].personaId==="anabeatriz");

console.log("1b) marcar a casa de vários de uma vez");
{ let g = ff0(); let r1 = red(g, {op:"pix_add", personaId:"familia", data:"2026-11-10", valor:100, origem:"Rev A Silva", contaId:"cb1"}); g = r1.ff;
  r1 = red(g, {op:"pix_add", personaId:"familia", data:"2026-11-11", valor:200, origem:"Rev B Souza", contaId:"cb1", casa:"juan"}); g = r1.ff;
  r1 = red(g, {op:"pix_add", personaId:"anabeatriz", data:"2026-11-12", valor:300, origem:"Rev C Lima", contaId:"cb1"}); g = r1.ff;
  const r2 = red(g, {op:"pix_casa_lote", casa:"casaalphaville"});
  t("marca só o Pix da Casa que estava sem casa", r2.ff.pix[0].casa==="casaalphaville" && r2.ff.pix[1].casa==="juan" && r2.ff.pix[2].casa===undefined, JSON.stringify(r2.ff.pix.map(function(x){ return x.casa; })));
  const r3 = red(r2.ff, {op:"pix_casa_lote", casa:"casaalphaville"});
  t("sem nada para marcar, recusa", r3.msg && /Nenhum/.test(r3.msg), r3.msg);
  const r4 = red(g, {op:"pix_casa_lote", casa:"inventada"});
  t("casa inválida recusa", r4.msg && /Escolha/.test(r4.msg), r4.msg); }
console.log("2) lançamento da Contas a receber");
const base = {data:"2026-11-19", valor:1000, rev:"Rev Teste Silva de Souza", destino:"socio", personaId:"familia", contaId:"cb1", casa:"casajardine"};
const v = ra.validarLancamento(base, "2026-11-20", []);
t("lançamento guarda a casa", v.item && v.item.casa==="casajardine", JSON.stringify(v));
const v2 = ra.validarLancamento(Object.assign({}, base, {casa:"xx"}), "2026-11-20", []);
t("casa inválida vira vazio", v2.item && v2.item.casa==="");
const v3 = ra.validarLancamento(Object.assign({}, base, {destino:"empresa", personaId:"", contaId:"", contaTxt:"Sicredi 34"}), "2026-11-20", []);
t("Pix da empresa nunca tem casa", v3.item && v3.item.casa==="");
const e1 = ra.espelharNaFamilia(ff0(), {personaId:"familia", contaId:"cb1", data:"2026-11-19", valor:1000, origem:"Rev Teste Silva de Souza", por:"Teste", casa:"casaalphaville"});
t("cópia na Família leva a casa", e1.ff && e1.ff.pix[0].casa==="casaalphaville", JSON.stringify(e1.erro || ""));
const e2 = ra.espelharNaFamilia(ff0(), {personaId:"familia", contaId:"cb1", data:"2026-11-19", valor:1000, origem:"Rev Teste Silva de Souza", por:"Teste"});
t("sem casa, a cópia fica sem casa", e2.ff && e2.ff.pix[0].casa===undefined);
console.log("\n"+ok+" ok, "+falha+" com falha");
process.exit(falha ? 1 : 0);
