// Teste: o Direcionar lança o Pix do sócio na Família, com a casa (Marcus, 23/11/2026). Dados INVENTADOS.
// Confere: pix_dir (grava com casa, não repete, não duplica Pix já lançado à mão, casa inválida), pix_dir_desfaz e o caminho completo pelo reducer (confirma e reabre).
// Uso: node scripts/testar-direcionar-lanca-pix-familia.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const ffm = await jiti.import("@/apps/montagem/domain/financeiro-familiar");
let ok = 0, falha = 0;
const t = (n, c, x) => { if(c){ ok++; console.log("  OK   "+n); } else { falha++; console.log("  FALHA "+n+(x ? " -> "+x : "")); } };
const ff0 = () => ({personas:[{id:"anamaria", nome:"Anamaria", tipo:"SOCIO", ativo:true}, {id:"marcus", nome:"Marcus", tipo:"SOCIO", ativo:true}], categorias:[], contasBanc:[], contas:[], parcelas:{}, pix:[], repasses:[], prest:[], dividas:[], hist:[], liberados:[], pixMeta:{}});
const red = (ff, a) => { const r = ffm.ffReduz({ff:ff}, Object.assign({type:"FF", por:"teste"}, a)); return (r.patch && r.patch.ff) || ff; };

console.log("1) pix_dir");
let ff = ff0();
ff = red(ff, {op:"pix_dir", origemDirecionar:"dpx1#0", personaId:"anamaria", valor:1000, data:"2026-11-23", origem:"Rev Teste Silva", casa:"casaalphaville"});
t("lança o Pix com a casa", ff.pix.length===1 && ff.pix[0].casa==="casaalphaville" && ff.pix[0].valor===1000 && ff.pix[0].personaId==="anamaria", JSON.stringify(ff.pix));
t("guarda de onde veio", ff.pix[0] && ff.pix[0].origemDirecionar==="dpx1#0");
ff = red(ff, {op:"pix_dir", origemDirecionar:"dpx1#0", personaId:"anamaria", valor:1000, data:"2026-11-23", origem:"Rev Teste Silva", casa:"juan"});
t("o mesmo Pix confirmado de novo não repete", ff.pix.length===1 && ff.pix[0].casa==="casaalphaville");
ff = red(ff, {op:"pix_dir", origemDirecionar:"dpx2#0", personaId:"marcus", valor:300, data:"2026-11-23", origem:"Rev Dois", casa:"casa-inventada"});
t("casa inválida lança sem casa", ff.pix.length===2 && ff.pix[1].casa===undefined, JSON.stringify(ff.pix[1]));
ff = red(ff, {op:"pix_dir", origemDirecionar:"dpx3#0", personaId:"naoexiste", valor:50, data:"2026-11-23", origem:"Rev Tres", casa:"juan"});
t("pessoa que não existe não lança", ff.pix.length===2);

console.log("2) Pix já lançado à mão não duplica");
let g = ff0();
g = red(g, {op:"pix_add", personaId:"anamaria", data:"2026-11-20", valor:700, origem:"Rev Mao Silva"});
g = red(g, {op:"pix_dir", origemDirecionar:"dpx4#0", personaId:"anamaria", valor:700, data:"2026-11-20", origem:"rev mao silva", casa:"casajardine"});
t("não cria segundo Pix", g.pix.length===1, JSON.stringify(g.pix));
t("só marca a casa no que já existia", g.pix[0].casa==="casajardine");

console.log("3) pix_dir_desfaz");
let h = red(ff0(), {op:"pix_dir", origemDirecionar:"dpx5#0", personaId:"anamaria", valor:100, data:"2026-11-23", origem:"A", casa:"juan"});
h = red(h, {op:"pix_dir", origemDirecionar:"dpx5#1", personaId:"marcus", valor:200, data:"2026-11-23", origem:"A", casa:"juan"});
h = red(h, {op:"pix_dir", origemDirecionar:"dpx6#0", personaId:"marcus", valor:300, data:"2026-11-23", origem:"B", casa:"juan"});
h = red(h, {op:"pix_dir_desfaz", id:"dpx5"});
t("retira só os Pix do pedido reaberto", h.pix.length===1 && h.pix[0].origemDirecionar==="dpx6#0", JSON.stringify(h.pix));

console.log("4) divisão guarda a casa");
const dpm = await jiti.import("@/apps/montagem/domain/direcionar-pix");
const dpr = dpm.dpReduz || (dpm.default && dpm.default.dpReduz);
if(dpr){
  const s0 = {dp:{pix:[{id:"p1", status:"fila", valor:500, divisoes:[]}]}, cp:{destinos:[]}};
  const r = dpr(s0, {op:"divisao", id:"p1", divisoes:[{destinoId:"d1", valor:500, via:"pix", casa:"juan"}]});
  const p = r && r.patch && r.patch.dp && r.patch.dp.pix.find(x => x.id==="p1");
  t("a divisão mantém a casa", p && p.divisoes[0].casa==="juan", JSON.stringify(p));
} else { console.log("  (dpReduz não exportado: passo 4 pulado)"); }

console.log("5) caminho completo pelo reducer (confirma e reabre)");
const { reducer } = await jiti.import("@/apps/montagem/state/reducer");
const base = { usuario:"Marcus", dp:{pix:[{id:"dpxA", status:"fila", valor:800, origem:"rep", quem:"Rep Teste", revendedora:"Rev Teste Silva", repOrigem:"Rep Teste", recebidoEm:Date.now(), divisoes:[], pagos:[]}], regras:[], contasRep:{}, contasRepExtra:{}}, cp:{destinos:[{id:"dsA", nome:"Anamaria", tipo:"FAMILIA", ativo:true, personaId:"anamaria"}, {id:"dsB", nome:"Pontual", tipo:"FORNECEDOR", ativo:true}], orientacoes:[], lanc:[]}, ff:ff0() };
try {
  let st = reducer(base, {type:"DP", op:"divisao", id:"dpxA", divisoes:[{destinoId:"dsA", valor:500, via:"pix", casa:"casaalphaville"}, {destinoId:"dsB", valor:300, via:"pix"}]});
  st = reducer(st, {type:"DP", op:"confirma", id:"dpxA", por:"Lucas"});
  const px = (st.ff && st.ff.pix) || [];
  t("confirmar lança só o Pix do sócio", px.length===1 && px[0].personaId==="anamaria" && px[0].valor===500, JSON.stringify(px));
  t("a casa vai junto", px[0] && px[0].casa==="casaalphaville");
  t("a origem é a revendedora", px[0] && /Rev Teste Silva/.test(px[0].origem), px[0] && px[0].origem);
  st = reducer(st, {type:"DP", op:"reabre", id:"dpxA", por:"Lucas"});
  t("reabrir retira o Pix da Família", ((st.ff && st.ff.pix) || []).length===0, JSON.stringify(st.ff && st.ff.pix));
} catch(err) { t("reducer rodou", false, String(err && err.stack || err).slice(0, 400)); }

console.log("6) conta de PRESTADOR do sócio não lança Pix do sócio");
try {
  const ffP = Object.assign(ff0(), {prest:[{id:"pr1", nome:"Prestador Teste", ativo:true, responsavelId:"anamaria"}]});
  const b2 = Object.assign({}, base, {ff:ffP, dp:{pix:[{id:"dpxB", status:"fila", valor:400, origem:"rep", quem:"Rep Teste", revendedora:"Rev B", repOrigem:"Rep Teste", recebidoEm:Date.now(), divisoes:[], pagos:[]}], regras:[], contasRep:{}, contasRepExtra:{}}});
  let st2 = reducer(b2, {type:"DP", op:"divisao", id:"dpxB", divisoes:[{destinoId:"dsA", valor:400, via:"pix", conta:"Prestador Teste"}]});
  st2 = reducer(st2, {type:"DP", op:"confirma", id:"dpxB", por:"Lucas"});
  t("Pix para o prestador não entra como Pix do sócio", ((st2.ff && st2.ff.pix) || []).length===0, JSON.stringify(st2.ff && st2.ff.pix));
  t("o ajudante reconhece a conta do prestador", ffm.contaDePrestador(ffP, "anamaria", "Prestador Teste")===true && ffm.contaDePrestador(ffP, "anamaria", "Itaú")===false);
} catch(err) { t("teste 6 rodou", false, String(err && err.stack || err).slice(0, 400)); }

console.log("\n"+ok+" ok, "+falha+" com falha");
process.exit(falha ? 1 : 0);
