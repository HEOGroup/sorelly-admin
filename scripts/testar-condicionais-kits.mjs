// Teste da ligação DevMaster -> kit (16/11/2026): roda o reducer de verdade, sem navegador e sem servidor. Uso: node scripts/testar-condicionais-kits.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const { reducer } = await jiti.import("@/apps/montagem/state/reducer");
const { novo } = await jiti.import("@/apps/montagem/state/store");
let ok = 0, falha = 0;
const t = (n, c, x) => { if(c){ ok++; console.log("  OK   "+n); } else { falha++; console.log("  FALHA "+n+(x ? " -> "+x : "")); } };
const kitBase = (id, tipo, status) => ({ id, lid:"LT", rev:"Revendedora Teste", codRev:"005273", tipoKit:tipo, status, valor:null, cond:{nums:[], chkM:{}, chkB:{}, chkP:{}, prev:{}, faltas:{}, impressas:{}, novas:[], pegas:false}, ordem:1 });
const comKits = (kits) => { const s = novo(); s.listagens = [{id:"LT", rep:"Teste", horario:"10:00", destino:"Curitiba", retiradas:[], fechada:false, data:"2026-11-20"}]; s.kits = kits; return s; };
const conds = [{numero:"093001", previsao:"2026-11-14", pecas:50, valor:5000}, {numero:"093002", previsao:"2026-11-19", pecas:10, valor:900}];
const nova = {numero:"097106", previsao:"2026-12-15", pecas:91, valor:7079};   // condicional NOVA (emitida depois, previsão ~30 dias à frente)

console.log("Acerto + kit sem valor, com condicional da DevMaster");
let s = comKits([kitBase("K1", "acerto_kit", "semvalor")]);
let r = reducer(s, {type:"KIT_COND_NUMS", kitId:"K1", conds});
let k = r.kits[0];
t("grava os 2 números no kit", JSON.stringify(k.cond.nums) === '["093001","093002"]', JSON.stringify(k.cond.nums));
t("guarda a previsão de cada número", k.cond.prev["093001"] === "2026-11-14");
t("marca que já buscou (não busca de novo)", !!k.cond.condBuscaEm);
t("vai para conferir condicional (precond)", k.status === "precond", k.status);
r = reducer(r, {type:"COND_CHK_PRE", id:"K1", num:"093001", v:true});
r = reducer(r, {type:"LIBERAR_COND", ids:["K1"], por:1});
t("depois de liberar volta para sem valor", r.kits[0].status === "semvalor", r.kits[0].status);
t("segunda busca não muda nada", reducer(r, {type:"KIT_COND_NUMS", kitId:"K1", conds}) === r);

console.log("Interruptor desligado (cfg.condConferenciaPrevia = false): só mostra, não trava");
s = comKits([kitBase("K2", "acerto_kit", "semvalor")]); s.cfg = Object.assign({}, s.cfg, {condConferenciaPrevia:false});
k = reducer(s, {type:"KIT_COND_NUMS", kitId:"K2", conds}).kits[0];
t("números entram", k.cond.nums.length === 2);
t("status continua sem valor", k.status === "semvalor", k.status);

console.log("Kit que já começou a montar");
s = comKits([kitBase("K3", "acerto_kit", "montando")]);
t("não mexe", reducer(s, {type:"KIT_COND_NUMS", kitId:"K3", conds}) === s);

console.log("Kit novo (sem trava) e número já digitado à mão");
s = comKits([Object.assign(kitBase("K4", "kit_novo", "semvalor"), {})]);
k = reducer(s, {type:"KIT_COND_NUMS", kitId:"K4", conds}).kits[0];
t("kit novo recebe os números mas não trava", k.cond.nums.length === 2 && k.status === "semvalor", k.status);
s = comKits([Object.assign(kitBase("K5", "acerto_kit", "semvalor"), {})]); s.kits[0].cond.nums = ["093001"];
k = reducer(s, {type:"KIT_COND_NUMS", kitId:"K5", conds}).kits[0];
t("não repete o número digitado à mão", JSON.stringify(k.cond.nums) === '["093001","093002"]', JSON.stringify(k.cond.nums));

console.log("Sem condicional aberta na DevMaster");
s = comKits([kitBase("K6", "acerto_kit", "semvalor")]);
k = reducer(s, {type:"KIT_COND_NUMS", kitId:"K6", conds:[]}).kits[0];
t("não trava o kit e marca que buscou", k.status === "semvalor" && !!k.cond.condBuscaEm, k.status);

console.log("Valor automático do kit (média das 3 últimas vendas pela tabela de kit)");
const { sugerido, media3 } = await jiti.import("@/apps/montagem/domain/vendas");
s = comKits([kitBase("V1", "acerto_kit", "semvalor")]);
const vs = [1200, 980, 1500]; const esperado = sugerido(vs, s.cfg);
r = reducer(s, {type:"KIT_COND_NUMS", kitId:"V1", conds:[], vendas:vs}); k = r.kits[0];
t("valor = tabela de kit sobre a média (" + Math.round(media3(vs)) + " -> R$ " + esperado + ")", k.valor === esperado, String(k.valor));
t("não marca como manual e guarda a média", k.manual === false && k.defAuto === true && k.cond.mediaAuto > 0);
t("kit vai para pendente (pronto para montar)", k.status === "pendente", k.status);
t("guarda as vendas no kit (a Calculadora mostra a média)", JSON.stringify(k.vendas) === JSON.stringify(vs));

s = comKits([kitBase("V2", "acerto_kit", "semvalor")]);
r = reducer(s, {type:"KIT_COND_NUMS", kitId:"V2", conds, vendas:vs}); k = r.kits[0];
t("com condicional a conferir: valor entra e o kit espera a Marjory", k.valor === esperado && k.status === "precond", k.status + " / " + k.valor);
r = reducer(r, {type:"COND_CHK_PRE", id:"V2", num:"093001", v:true});
r = reducer(r, {type:"LIBERAR_COND", ids:["V2"], por:1});
t("ao liberar, vai direto para pendente (valor já definido)", r.kits[0].status === "pendente", r.kits[0].status);

s = comKits([kitBase("V3", "acerto_kit", "semvalor")]);
k = reducer(s, {type:"KIT_COND_NUMS", kitId:"V3", conds:[], vendas:[4000, 3500, 3800]}).kits[0];
t("média acima de R$ 2.500 NÃO define sozinho (análise de vendas obrigatória)", k.valor === null && k.status === "semvalor" && k.cond.mediaAuto > 2500, String(k.valor));

s = comKits([kitBase("V4", "acerto_kit", "semvalor")]);
k = reducer(s, {type:"KIT_COND_NUMS", kitId:"V4", conds:[], vendas:[]}).kits[0];
t("sem vendas na DevMaster: fica para a supervisão", k.valor === null && k.status === "semvalor");

s = comKits([kitBase("V5", "kit_novo", "semvalor")]);
k = reducer(s, {type:"KIT_COND_NUMS", kitId:"V5", conds:[], vendas:vs}).kits[0];
t("kit novo não recebe valor automático", k.valor === null);

s = comKits([Object.assign(kitBase("V6", "acerto_kit", "semvalor"), {valor:5000, manual:true})]);
k = reducer(s, {type:"KIT_COND_NUMS", kitId:"V6", conds:[], vendas:vs}).kits[0];
t("não troca valor que a supervisão já definiu", k.valor === 5000 && k.manual === true, String(k.valor));

s = comKits([kitBase("V7", "acerto_kit", "semvalor")]); s.cfg = Object.assign({}, s.cfg, {valorAutomatico:false});
k = reducer(s, {type:"KIT_COND_NUMS", kitId:"V7", conds:[], vendas:vs}).kits[0];
t("interruptor valorAutomatico = false: não define", k.valor === null);

s = comKits([kitBase("V8", "acerto_kit", "semvalor")]);
r = reducer(s, {type:"KIT_COND_NUMS", kitId:"V8", conds:[], vendas:vs});
t("segunda chamada não muda nada", reducer(r, {type:"KIT_COND_NUMS", kitId:"V8", conds:[], vendas:[100]}) === r);

console.log("Regra 2: condicional NOVA não entra (caso da Lara, papel da DevMaster de 12/11)");
s = comKits([kitBase("N1", "acerto_kit", "semvalor")]);
r = reducer(s, {type:"KIT_COND_NUMS", kitId:"N1", conds:[{numero:"094059", previsao:"2026-11-14", pecas:101, valor:8097}, nova]}); k = r.kits[0];
t("só a antiga entra (094059)", JSON.stringify(k.cond.nums) === '["094059"]', JSON.stringify(k.cond.nums));
t("a nova fica separada em novaDm", JSON.stringify(k.cond.novaDm) === '["097106"]', JSON.stringify(k.cond.novaDm));
t("kit espera a Marjory com 1 número", k.status === "precond");
s = comKits([kitBase("N2", "acerto_kit", "semvalor")]);
k = reducer(s, {type:"KIT_COND_NUMS", kitId:"N2", conds:[{numero:"094215", previsao:"2026-11-15"}, {numero:"094614", previsao:"2026-11-19"}, {numero:"097121", previsao:"2026-12-17"}]}).kits[0];
t("Flavia: 2 antigas entram, a nova não", JSON.stringify(k.cond.nums) === '["094215","094614"]', JSON.stringify(k.cond.nums));
s = comKits([kitBase("N3", "acerto_kit", "semvalor")]);
k = reducer(s, {type:"KIT_COND_NUMS", kitId:"N3", conds:[nova]}).kits[0];
t("só tinha a nova: nada a conferir, kit não trava", k.cond.nums.length === 0 && k.status === "semvalor", k.status);

console.log("Corrigir kit já buscado pela regra 1 (nums com a nova dentro)");
s = comKits([kitBase("N4", "acerto_kit", "precond")]); s.kits[0].valor = 10000;
s.kits[0].cond = Object.assign({}, s.kits[0].cond, {nums:["097106", "094059", "999001"], prev:{"097106":"2026-12-15", "094059":"2026-11-14", "999001":"2026-11-01"}, chkP:{"999001":true, "097106":true}, condBuscaEm:1, valorBuscaEm:1});
r = reducer(s, {type:"KIT_COND_NUMS", kitId:"N4", conds:[{numero:"094059", previsao:"2026-11-14"}, nova]}); k = r.kits[0];
t("tira só a nova e mantém a digitada à mão", JSON.stringify(k.cond.nums) === '["094059","999001"]', JSON.stringify(k.cond.nums));
t("limpa a marca e a previsão da nova", !k.cond.chkP["097106"] && !k.cond.prev["097106"] && k.cond.chkP["999001"] === true);
t("marca a regra 2 e guarda a nova", k.cond.condRegra === 2 && k.cond.novaDm[0] === "097106");
t("segunda chamada não muda nada", reducer(r, {type:"KIT_COND_NUMS", kitId:"N4", conds:[{numero:"094059", previsao:"2026-11-14"}, nova]}) === r);
s = comKits([kitBase("N5", "acerto_kit", "precond")]); s.kits[0].valor = 10000;
s.kits[0].cond = Object.assign({}, s.kits[0].cond, {nums:["097106"], prev:{"097106":"2026-12-15"}, condBuscaEm:1, valorBuscaEm:1});
k = reducer(s, {type:"KIT_COND_NUMS", kitId:"N5", conds:[nova]}).kits[0];
t("kit que só tinha a nova sai da fila da Marjory (pendente, com valor)", k.status === "pendente" && k.cond.nums.length === 0, k.status);

console.log(`\n${ok} certas, ${falha} falhas`);
process.exit(falha ? 1 : 0);
