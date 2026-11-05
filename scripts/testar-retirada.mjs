// Teste do fluxo do app da representante: Retirada -> Conferência das peças -> Erro de quem bipou -> Avaliação (05/11/2026).
// Roda o reducer de verdade, sem navegador e sem servidor. Uso: node scripts/testar-retirada.mjs   (saída 1 = alguma verificação falhou)
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.argv[2] || process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const { reducer } = await jiti.import("@/apps/montagem/state/reducer");
const { novo: inicial } = await jiti.import("@/apps/montagem/state/store");
const { BIPADORAS } = await jiti.import("@/apps/montagem/domain/equipe");
const { codigoRetirada } = await jiti.import("@/apps/montagem/domain/retornos");
const { condicionaisDoKit, totaisKit } = await jiti.import("@/apps/montagem/domain/conferencia-pecas");
const { resumoBipadora } = await jiti.import("@/apps/montagem/domain/regras");

let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if(cond){ ok++; console.log("  OK   "+nome); } else { falha++; console.log("  FALHA "+nome+(extra ? " -> "+extra : "")); } };

let s = inicial();
// prepara uma listagem com 3 kits bipados (montadora e bipadora informadas)
const bip = BIPADORAS[0];
const idBip = bip.id, idMont = s.montadoras[0].id;
const l = {id:"LT", rep:"Dayanne", horario:"14:00", destino:"Teste", retiradas:[], fechada:false, data:"2026-11-05"};
const revs = ["Maria Eduarda de Almeida","Beatriz Teste","Carla Teste"];
// condicional de exemplo (as peças vêm da condicional real da DevMaster, k.condsReais): 2 modelos, 12 peças
const COND_TESTE = [{numero:"00001", grupos:[{cod:"01", nome:"Anéis", itens:[{codigo:"A100", valor:88, desc:"ANEL TESTE", qtd:10}, {codigo:"B200", valor:68, desc:"BRINCO TESTE", qtd:2}]}]}];
const novosK = revs.map((rev,i) => ({id:"KT"+i, lid:"LT", rev, bairro:"—", valor:5000, status:"bipado", montId:idMont, bipId:idBip, fimB:Date.now(), ordem:i+1, tipoKit:"acerto_kit", condsReais:COND_TESTE}));
s = Object.assign({}, s, { listagens:[l].concat(s.listagens), kits:novosK.concat(s.kits) });
const kitsL = novosK.map(k=>k.id);
const totalL = s.kits.filter(k => k.lid===l.id).length;
console.log("Listagem "+l.id+" ("+l.rep+"), "+totalL+" kits");

console.log("\n1. Código de retirada");
const c1 = codigoRetirada(l);
t("código tem 4 dígitos", /^\d{4}$/.test(c1), c1);
t("código muda depois de uma retirada", codigoRetirada(Object.assign({}, l, {retiradas:[{}]}))!==c1);
t("código muda no dia seguinte", codigoRetirada(l, Date.now()+86400000)!==c1);

console.log("\n2. Retirada (reducer confere, não só a tela)");
let r = reducer(s, {type:"RETIRAR", lid:l.id, ids:[kitsL[0]], por:16});
t("sem código e sem assinatura: recusa", r.kits.find(k=>k.id===kitsL[0]).status==="bipado" && r.aviso && /código/.test(r.aviso.txt), r.aviso && r.aviso.txt);
r = reducer(s, {type:"RETIRAR", lid:l.id, ids:[kitsL[0]], por:16, cod:"0000", assinatura:"x"});
t("código errado: recusa", r.kits.find(k=>k.id===kitsL[0]).status==="bipado" && /não confere/.test(r.aviso.txt), r.aviso && r.aviso.txt);
r = reducer(s, {type:"RETIRAR", lid:l.id, ids:[kitsL[0]], por:16, cod:codigoRetirada(l), codigo:true});
t("código certo sem assinatura: recusa", r.kits.find(k=>k.id===kitsL[0]).status==="bipado");
r = reducer(s, {type:"RETIRAR", lid:l.id, ids:[kitsL[0]], por:16, codigo:true, assinatura:"x"});
t("o antigo 'codigo:true' sem o código não passa mais", r.kits.find(k=>k.id===kitsL[0]).status==="bipado");
s = reducer(s, {type:"RETIRAR", lid:l.id, ids:[kitsL[0]], por:16, cod:codigoRetirada(l), assinatura:"x"});
const k0 = s.kits.find(k=>k.id===kitsL[0]), lA = s.listagens.find(x=>x.id===l.id);
t("código certo + assinatura: retira o kit", k0.status==="retirado" && k0.retConf==="código e assinatura", k0.retConf);
t("retirada PARCIAL: listagem continua aberta", totalL>1 ? lA.fechada===false : true);
t("retirada guarda quem, quando e quais kits", lA.retiradas.length===1 && lA.retiradas[0].kits[0]===kitsL[0] && lA.retiradas[0].codigo===true);
t("o código mudou para a próxima retirada", codigoRetirada(lA)!==c1);
// pedido da bipadora + confirmação no app
s = reducer(s, {type:"SOLICITAR_RET", lid:l.id, ids:[kitsL[1]], por:idBip});
const pend = s.retPend.find(p=>p.lid===l.id);
s = reducer(s, {type:"RESP_RET", id:pend.id, aceita:true});
t("pedido da bipadora + 'Recebi os kits' no app: retira", s.kits.find(k=>k.id===kitsL[1]).status==="retirado" && s.kits.find(k=>k.id===kitsL[1]).retConf==="confirmação no app da representante");
r = reducer(s, {type:"RETIRAR", lid:l.id, ids:[kitsL[2]], por:16, sozinha:true});
t("retirou sozinha na empresa: retira sem código", r.kits.find(k=>k.id===kitsL[2]).status==="retirado");

console.log("\n3. Conferência por quantidade -> erro de quem BIPOU");
const kc = s.kits.find(k=>k.id===kitsL[0]), esper = totaisKit(condicionaisDoKit(kc)).pecas;
t("kit de teste tem 12 peças na condicional", esper===12, esper);
const semCond = Object.assign({}, s, {kits:s.kits.map(k => k.id===kc.id ? Object.assign({}, k, {condsReais:null}) : k)});
const rSem = reducer(semCond, {type:"CONF_QTD", kitId:kc.id, total:5});
t("kit SEM condicional da DevMaster: não confere e avisa", !(rSem.confBip||{})[kc.id] && /condicional/i.test((rSem.aviso||{}).txt||""));
s = reducer(s, {type:"CONF_LIBERAR", kitId:kc.id});
s = reducer(s, {type:"CONF_QTD", kitId:kc.id, total:esper-3});
let kk = s.kits.find(k=>k.id===kc.id), eb = (s.errosBipagem||[]).filter(x=>x.kitId===kc.id);
t("faltaram 3 peças: resultado 3 faltas", s.confBip[kc.id].resultado.nFaltas===3);
t("erro sobe no bloco Erros de bipagem", eb.length===1 && eb[0].erros===3, JSON.stringify(eb.map(x=>x.erros)));
t("erro vai para quem BIPOU (bipId), não para quem montou", eb[0] && eb[0].bipId===idBip);
t("kit.errosBip = 3 (desconto da bipadora)", kk.errosBip===3, kk.errosBip);
t("histórico da revendedora guarda a conferência", (s.perfisRev[kc.rev].conferenciasKit||[]).length===1);
const antes = s; s = reducer(s, {type:"CONF_QTD", kitId:kc.id, total:esper});
t("contar de novo sem 'Contar de novo' é ignorado", s===antes);
s = reducer(s, {type:"CONF_REINICIAR", kitId:kc.id});
t("'Contar de novo' NÃO apaga o erro já registrado", s.kits.find(k=>k.id===kc.id).errosBip===3 && s.errosBipagem.some(x=>x.kitId===kc.id));
s = reducer(s, {type:"CONF_QTD", kitId:kc.id, total:esper-1});
kk = s.kits.find(k=>k.id===kc.id); eb = s.errosBipagem.filter(x=>x.kitId===kc.id);
t("nova contagem SUBSTITUI (1 falta), não soma (4)", kk.errosBip===1 && eb.length===1 && eb[0].erros===1, kk.errosBip+" / "+eb.length);
t("histórico guarda as duas contagens", s.perfisRev[kc.rev].conferenciasKit.length===2);
s = reducer(s, {type:"CONF_REINICIAR", kitId:kc.id}); s = reducer(s, {type:"CONF_QTD", kitId:kc.id, total:esper});
t("contagem certa depois: erro some", s.kits.find(k=>k.id===kc.id).errosBip===0 && !s.errosBipagem.some(x=>x.kitId===kc.id));
s = reducer(s, {type:"CONF_REINICIAR", kitId:kc.id}); s = reducer(s, {type:"CONF_QTD", kitId:kc.id, total:esper-2});

console.log("\n4. Avaliação do kit retirado");
s = reducer(s, {type:"AVALIAR", id:kc.id, nota:4, faltas:5});
kk = s.kits.find(k=>k.id===kc.id);
t("kit já conferido: falta da avaliação não conta de novo", kk.aval.nota===4 && kk.aval.faltas===0, JSON.stringify(kk.aval));
const s2 = reducer(s, {type:"AVALIAR", id:kc.id, nota:1, faltas:9});
t("avaliar duas vezes: a segunda é ignorada", s2.kits.find(k=>k.id===kc.id).aval.nota===4);
s = reducer(s, {type:"AVALIAR", id:kitsL[1], nota:9, faltas:2});
kk = s.kits.find(k=>k.id===kitsL[1]);
t("kit sem conferência: falta da avaliação conta; nota limitada a 5", kk.aval.faltas===2 && kk.aval.nota===5, JSON.stringify(kk.aval));
const s3 = reducer(s, {type:"AVALIAR", id:kitsL[2], nota:3, faltas:0});
t("kit ainda não retirado não é avaliado", !s3.kits.find(k=>k.id===kitsL[2]).aval);

console.log("\n5. Desconto da bipadora (resumoBipadora)");
const b = BIPADORAS.find(x=>x.id===idBip);
if(b){ const rb = resumoBipadora(b, s); t("faltas da bipadora = 2 (conferência) + 2 (avaliação)", rb.faltas - b.mes.faltas===4, rb.faltas+" - "+b.mes.faltas); }
else t("bipadora "+idBip+" existe no estado", false);

console.log("\n5b. Nova listagem (aba Listagens e tela da revendedora)");
const hojeIso = new Date().toISOString().slice(0,10).replace(/-.*/, m=>m);
const dia = (n) => { const x = new Date(); x.setDate(x.getDate()+n); return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0"); };
const nL0 = s.listagens.length;
let sL = reducer(s, {type:"CRIAR_LISTAGEM", rep:"Dayanne", destino:"Pinhais", viagem:true, horario:"14:30", data:dia(2)});
const criada = sL.listagens[sL.listagens.length-1];
t("cria a listagem com dia, horário e destino", sL.listagens.length===nL0+1 && criada.data===dia(2) && criada.horario==="14:30" && criada.destino==="Pinhais" && criada.viagem===true);
t("a mensagem diz o horário certo", /14:30/.test(sL.aviso.txt), sL.aviso && sL.aviso.txt);
const sL2 = reducer(sL, {type:"CRIAR_LISTAGEM", rep:"Dayanne", destino:"Pinhais", viagem:true, horario:"14:30", data:dia(2)});
t("repetida (mesmo dia, horário e destino): não cria de novo", sL2.listagens.length===sL.listagens.length && /Já existe/.test(sL2.aviso.txt));
const sL3 = reducer(sL, {type:"CRIAR_LISTAGEM", rep:"Dayanne", destino:"Curitiba", horario:"10:00", data:dia(-1)});
t("dia no passado: não cria", sL3.listagens.length===sL.listagens.length && /passado/.test(sL3.aviso.txt));
const sL4 = reducer(sL, {type:"CRIAR_LISTAGEM", rep:"Dayanne", destino:"Curitiba", horario:"14:30", data:dia(2)});
t("mesmo dia e horário em outro destino: cria", sL4.listagens.length===sL.listagens.length+1);
const sL5 = reducer(sL, {type:"CRIAR_LISTAGEM", rep:"Lysie", destino:"Pinhais", viagem:true, horario:"14:30", data:dia(2)});
t("outra representante pode ter a mesma listagem", sL5.listagens.length===sL.listagens.length+1);

console.log("\n5c. Colocar revendedora real (prevista para hoje) na listagem de hoje");
const nK0 = s.kits.length;
let sC = reducer(s, {type:"ADD_KIT", lid:"LT", rev:"Ana Julia Rocha Silva", bairro:"Curitiba", vendas:[1800, 1500], prio:false, atrasado:false, tipoKit:"acerto_kit", conds:[], fone:"4197010207", hora:null, porApp:true});
const kReal = sC.kits.find(k => k.rev==="Ana Julia Rocha Silva");
t("o kit entra na listagem de hoje com nome, cidade e telefone", sC.kits.length===nK0+1 && kReal && kReal.lid==="LT" && kReal.fone==="4197010207" && kReal.bairro==="Curitiba" && kReal.porApp===true);
t("o kit nasce como acerto + kit e entra na fila de montagem", kReal.tipoKit==="acerto_kit" && ["semvalor","pendente"].includes(kReal.status), kReal.status);
const sCheia = Object.assign({}, s, {listagens:s.listagens.map(x => x.id==="LT" ? Object.assign({}, x, {fechada:true}) : x)});
t("listagem fechada: não coloca", reducer(sCheia, {type:"ADD_KIT", lid:"LT", rev:"Outra Real", bairro:"", vendas:[], tipoKit:"acerto_kit", conds:[], porApp:true}).kits.length===nK0);

console.log("\n6. Fila de retornos");
const { filaRetornos } = await jiti.import("@/apps/montagem/domain/retornos");
t("fila só tem acertos recebidos e não bipados", filaRetornos(s).every(x => x.recebimento && x.recebimento.ok && !x.recebimento.bip && x.origem!=="interno"));

console.log("\nResultado: "+ok+" OK, "+falha+" falha(s)");
process.exit(falha ? 1 : 0);
