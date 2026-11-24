// Teste de ponta a ponta com 5 revendedoras DE MENTIRA (24/11/2026, pedido do Marcus): listagem -> valor -> montagem -> bipagem -> retirada -> acerto e kit novo ->
// Consolidado (conferência e OK do financeiro) -> Inadimplência (negociação e pagamento) -> Comissões. Roda o reducer e as regras de verdade NA MEMÓRIA:
// sem navegador, sem servidor, sem banco. Uso: node scripts/testar-fluxo-5-revendedoras.mjs   (saída 1 = alguma verificação falhou)
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.sessionStorage = globalThis.localStorage;
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, sessionStorage: globalThis.localStorage, addEventListener(){}, removeEventListener(){}, location:{ search:"", pathname:"/" }, matchMedia(){ return { matches:false, addEventListener(){}, removeEventListener(){} }; }, innerHeight:900, innerWidth:1400 };
// relógio que anda 1 segundo a cada leitura: dois registros nunca nascem com o mesmo código
const errOrig = console.error; console.error = (...a) => { if(/useLayoutEffect does nothing on the server/.test(String(a[0]))) return; errOrig(...a); };   // aviso do React que só existe fora do navegador
const real = Date.now.bind(Date); let passo = 0; Date.now = () => real() + (passo++)*1000;
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const { reducer } = await jiti.import("@/apps/montagem/state/reducer");
const { novo } = await jiti.import("@/apps/montagem/state/store");
const { BIPADORAS } = await jiti.import("@/apps/montagem/domain/equipe");
const { codigoRetirada } = await jiti.import("@/apps/montagem/domain/retornos");
const C = await jiti.import("@/apps/montagem/domain/comissoes");
const React = (await jiti.import("react")).default || (await jiti.import("react"));
const { renderToString } = await jiti.import("react-dom/server");
const { Ctx } = await jiti.import("@/apps/montagem/state/context");

let ok = 0, falha = 0; const falhas = [];
const t = (nome, cond, extra) => { if(cond){ ok++; console.log("  OK    "+nome); } else { falha++; falhas.push(nome+(extra!==undefined ? " -> "+extra : "")); console.log("  FALHA "+nome+(extra!==undefined ? " -> "+extra : "")); } };
const R = (n) => "R$ "+Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2});
const aviso = (s) => s.aviso ? s.aviso.txt : "";

let s = novo();
s = Object.assign({}, s, { usuario:16, acertosConsignado:[], kits:[], listagens:[] });   // começa limpo: só as 5 de mentira
const REP = "Representante Teste";
const REVS = ["Teste Um Ana", "Teste Dois Bia", "Teste Tres Cida", "Teste Quatro Duda", "Teste Cinco Eva"];
const TIPOS = ["acerto_kit", "acerto_kit", "acerto_kit", "acerto_kit", "kit_novo"];
const mont = s.montadoras.map((m) => m.id), bip = BIPADORAS[0].id;

console.log("\n1. LISTAGEM");
s = reducer(s, {type:"CRIAR_LISTAGEM", rep:REP, destino:"Curitiba", horario:"10:00"});
const L = s.listagens[s.listagens.length-1];
t("cria a listagem do dia para a representante", !!L && L.rep===REP, aviso(s));
let s2 = reducer(s, {type:"CRIAR_LISTAGEM", rep:REP, destino:"Pinhais", horario:"15:00"});
t("segunda listagem no mesmo dia é recusada (uma por dia)", s2.listagens.length===s.listagens.length, aviso(s2));
REVS.forEach((rev, i) => { s = reducer(s, {type:"ADD_KIT", lid:L.id, rev, bairro:"Centro", vendas:[1800, 1500], tipoKit:TIPOS[i], conds:[], fone:"41999990000"}); });
const kitsL = () => s.kits.filter((k) => k.lid===L.id);
t("as 5 revendedoras entram na listagem", kitsL().length===5, kitsL().length+" · "+aviso(s));
s2 = reducer(s, {type:"ADD_KIT", lid:L.id, rev:REVS[0], bairro:"Centro", tipoKit:"acerto_kit", conds:[]});
t("a mesma revendedora não entra duas vezes no dia", s2.kits.length===s.kits.length, aviso(s2));
t("kit nasce sem valor (precisa calcular)", kitsL().every((k) => k.status==="semvalor"), kitsL().map((k) => k.status).join(","));

console.log("\n2. VALOR, MONTAGEM E BIPAGEM");
const VAL = [3000, 2500, 2000, 1500, 7000];
kitsL().forEach((k, i) => { s = reducer(s, {type:"DEFINIR_VALOR", id:k.id, valor:VAL[i], media:VAL[i]/2}); });
t("valor definido: os 5 vão para a fila", kitsL().every((k) => k.status==="pendente" && k.valor>0), kitsL().map((k) => k.status).join(","));
s2 = reducer(s, {type:"INICIAR_M", id:kitsL()[0].id, montId:null});
t("montagem sem dizer quem monta é recusada", s2.kits.find((k) => k.id===kitsL()[0].id).status==="pendente", aviso(s2));
s2 = reducer(s, {type:"INICIAR_B", id:kitsL()[0].id, bipId:bip});
t("bipar kit que não foi montado é recusado", s2.kits.find((k) => k.id===kitsL()[0].id).status==="pendente", aviso(s2));
kitsL().forEach((k, i) => {
  const m = mont[i % mont.length];
  s = reducer(s, {type:"INICIAR_M", id:k.id, montId:m, excecao:true});
  let st = s.kits.find((x) => x.id===k.id).status; if(st!=="montando") console.log("     (aviso ao iniciar "+k.rev+": "+aviso(s)+")");
  s = reducer(s, {type:"CONCLUIR_M", id:k.id, condPegas:true});
  if(s.kits.find((x) => x.id===k.id).status==="supervisao") s = reducer(s, {type:"APROVAR", id:k.id});
  s = reducer(s, {type:"INICIAR_B", id:k.id, bipId:bip});
  s = reducer(s, {type:"CONCLUIR_B", id:k.id, real:VAL[i]});
});
t("os 5 kits montados e bipados", kitsL().every((k) => k.status==="bipado"), kitsL().map((k) => k.rev.split(" ")[1]+"="+k.status).join(", ")+" · "+aviso(s));

console.log("\n3. RETIRADA");
const ids = kitsL().map((k) => k.id);
s2 = reducer(s, {type:"RETIRAR", lid:L.id, ids, por:16});
t("retirada sem código e sem assinatura é recusada", s2.kits.filter((k) => k.lid===L.id).every((k) => k.status==="bipado"), aviso(s2));
s = reducer(s, {type:"RETIRAR", lid:L.id, ids, por:16, cod:codigoRetirada(s.listagens.find((x) => x.id===L.id)), assinatura:"assinatura-teste"});
t("retirada com código e assinatura: os 5 saem", kitsL().every((k) => k.status==="retirado"), kitsL().map((k) => k.status).join(",")+" · "+aviso(s));

console.log("\n4. ACERTOS (4 revendedoras) E KIT NOVO (1)");
const K = kitsL();
const acerto = (k, venda, pagamentos, extra) => { const pago = pagamentos.filter((p) => p.forma!=="acerto_loja").reduce((a, p) => a+p.valor, 0);
  s = reducer(s, Object.assign({type:"ACERTO_REGISTRAR", id:k.id, vendaBruta:venda, valorPago:pago, pagamentos, assinatura:"ass", regrasLidas:true, condicionaisSelecionadas:[]}, extra||{}));
  return s.acertosConsignado.find((r) => r.kitId===k.id && r.tipo==="acerto"); };
// Ana: vende R$ 2.000,00 e paga tudo no Pix
let rA = acerto(K[0], 2000, []); const devA = rA ? rA.valorAcerto : 0;
s = Object.assign({}, s, {acertosConsignado:s.acertosConsignado.filter((r) => r!==rA), kits:s.kits.map((k) => k.id===K[0].id ? Object.assign({}, k, {status:"retirado", acerto:null}) : k)});   // só mediu o valor do acerto; agora registra de verdade
rA = acerto(K[0], 2000, [{forma:"pix", valor:devA, descricao:"PIX - TESTE - 34"}]);
t("Ana: acerto registrado e venda de R$ 2.000,00 dá 40% de comissão", !!rA && rA.valorAcerto===1200, rA && R(rA.valorAcerto));
// Bia: vende R$ 1.000,00 e paga só R$ 300,00 -> inadimplência
const rB = acerto(K[1], 1000, [{forma:"pix", valor:300, descricao:"PIX - TESTE - 34"}]);
t("Bia: venda de R$ 1.000,00 dá acerto de R$ 650,00 (35%)", !!rB && rB.valorAcerto===650, rB && R(rB.valorAcerto));
// Cida: vende R$ 800,00, paga R$ 300,00 no Pix e o resto por Pix direto para a representante
const rC0 = acerto(K[2], 800, [{forma:"pix", valor:300, descricao:"PIX - TESTE - 34"}, {forma:"pix_representante", valor:260, descricao:""}]);
t("Cida: venda de R$ 800,00 dá acerto de R$ 560,00 (30%)", !!rC0 && rC0.valorAcerto===560, rC0 && R(rC0.valorAcerto));
// Duda: vende R$ 200,00 (abaixo de R$ 300,00): sem comissão e com taxa de deslocamento
const rD = acerto(K[3], 200, [{forma:"dinheiro", valor:235, descricao:"DINHEIRO"}]);
t("Duda: venda de R$ 200,00 não dá comissão (acerto = R$ 200,00)", !!rD && rD.valorAcerto===200 && rD.comissao===0, rD && R(rD.valorAcerto)+" com "+R(rD.comissao));
t("Duda: taxa de deslocamento de R$ 35,00 cobrada", !!rD && C.taxaDe(rD).taxa===35, rD && C.taxaDe(rD).taxa);
// acerto em dobro
const nAc = s.acertosConsignado.length; s2 = reducer(s, {type:"ACERTO_REGISTRAR", id:K[0].id, vendaBruta:2000, valorPago:1200, pagamentos:[]});
t("dois toques em Finalizar acerto não criam dois acertos", s2.acertosConsignado.length===nAc);
// Eva: kit novo
s = reducer(s, {type:"KITNOVO_ENTREGAR", id:K[4].id, condicionais:["00999"], pecasTotal:90, pecasFaltaram:0, regrasLidas:[1], assinatura:"ass"});
const rE = s.acertosConsignado.find((r) => r.kitId===K[4].id);
t("Eva: kit novo entregue e assinado aparece no Consolidado", !!rE && rE.tipo==="kit_novo_entrega", aviso(s));
t("Consolidado tem os 5 atendimentos", s.acertosConsignado.length===5, s.acertosConsignado.length);

console.log("\n5. CONSOLIDADO: CONFERÊNCIA DO AGENDAMENTO E OK DO FINANCEIRO");
const c0 = C.comisEfetiva(s);
const an = (r) => C.analisar(C.comisEfetiva(s), s.acertosConsignado.find((x) => x.id===r.id));
t("antes da conferência, nenhuma comissão está liberada", [rA, rB, rC0, rD].every((r) => an(r).liberada===0));
[rA, rB, rC0, rD].forEach((r) => { s = reducer(s, {type:"CONSREP_RECEBER", id:r.id, patch:{ok:true, prom:{ok:true, em:new Date().toISOString()}}}); });
t("agendamento confere o recebimento dos 4 acertos", [rA, rB, rC0, rD].every((r) => an(r).conferido));
t("só a conferência não libera comissão (falta o financeiro)", [rA, rB, rC0, rD].every((r) => an(r).liberada===0));
s = reducer(s, {type:"COMIS_FIN", id:rA.id, idx:0, por:"Financeiro Teste", conta:"PIX - TESTE - 34"});
s = reducer(s, {type:"COMIS_FIN", id:rB.id, idx:0, por:"Financeiro Teste", conta:"PIX - TESTE - 34"});
s = reducer(s, {type:"COMIS_FIN", id:rC0.id, idxs:[0, 1], por:"Financeiro Teste", conta:"PIX - TESTE - 34", rep:REP});
s = reducer(s, {type:"COMIS_FIN", id:rD.id, idx:0, por:"Financeiro Teste", conta:"DINHEIRO"});
const pct = C.pctDaRep(c0, REP);
t("Ana: comissão da representante liberada inteira ("+pct+"% de R$ 1.200,00)", an(rA).liberada===Math.round(1200*pct)/100 && an(rA).retida===0, R(an(rA).liberada)+" liberada, "+R(an(rA).retida)+" retida");
t("Bia: libera só sobre os R$ 300,00 pagos e retém o resto", an(rB).liberada===Math.round(300*pct)/100 && an(rB).retida===Math.round(350*pct)/100, R(an(rB).liberada)+" liberada, "+R(an(rB).retida)+" retida");

console.log("\n6. INADIMPLÊNCIA");
t("Ana: falta R$ 0,00", an(rA).falta===0, R(an(rA).falta));
t("Bia: falta o que não pagou (R$ 350,00 + multa de 10% do pendente, se a regra nova valer)", an(rB).falta>=350, R(an(rB).falta));
t("Cida: Pix direto para a representante conta como pago (falta R$ 0,00)", an(rC0).falta===0, R(an(rC0).falta));
t("Duda: pagou acerto + taxa, falta R$ 0,00", an(rD).falta===0, R(an(rD).falta));
const Inad = await jiti.import("@/apps/montagem/pages/Inadimplencia");
const desenha = (Comp, st) => renderToString(React.createElement(Ctx.Provider, { value:{ state:st || s, dispatch(){} } }, React.createElement(Comp)));
const texto = (h) => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
let hI = ""; try { hI = texto(desenha(Inad.AbaInadimplencia)); t("tela Inadimplência desenha sem erro", hI.length>300); } catch(x){ t("tela Inadimplência desenha sem erro", false, String(x && x.stack || x).slice(0, 300)); }
t("tela Inadimplência mostra a Bia", /Teste Dois Bia/.test(hI));
t("tela Inadimplência NÃO mostra quem pagou tudo (Ana, Cida, Duda, Eva)", !/Teste Um Ana|Teste Tres Cida|Teste Quatro Duda|Teste Cinco Eva/.test(hI));
t("tela mostra o saldo devedor da Bia", hI.includes(R(an(rB).falta)), "esperado "+R(an(rB).falta));
const faltaB = an(rB).falta;
s = reducer(s, {type:"INAD_NEGOCIAR", id:rB.id, por:16, txt:"Combinou pagar em duas vezes", promessa:"2099-12-31", valor:faltaB});
const rB1 = s.acertosConsignado.find((x) => x.id===rB.id);
t("negociação fica gravada no acerto", (rB1.negoc||[]).length===1 && rB1.negoc[0].promessa==="2099-12-31");
hI = texto(desenha(Inad.AbaInadimplencia)); t("tela mostra Prometido para 31/12/2099", /Prometido para 31\/12\/2099/.test(hI));
s = reducer(s, {type:"INAD_PAGAR", id:rB.id, forma:"pix", descricao:"PIX - TESTE - 34", valor:100, quem:""});
t("pagamento parcial de R$ 100,00 baixa o saldo", Math.abs(an(rB).falta-(faltaB-100))<0.01, R(an(rB).falta));
const retAntes = an(rB).retida;
s = reducer(s, {type:"INAD_PAGAR", id:rB.id, forma:"pix", descricao:"PIX - TESTE - 34", valor:an(rB).falta, quem:""});
t("pagamento do resto quita a dívida", an(rB).falta===0, R(an(rB).falta));
t("comissão do que foi pago depois continua retida até o OK do financeiro", an(rB).retida>0, R(an(rB).retida));
const nPag = s.acertosConsignado.find((x) => x.id===rB.id).pagamentos.length;
s = reducer(s, {type:"COMIS_FIN", id:rB.id, idxs:Array.from({length:nPag}, (_, i) => i), por:"Financeiro Teste", conta:"PIX - TESTE - 34"});
t("depois do OK do financeiro a comissão retida é liberada", an(rB).retida===0 && an(rB).liberada===Math.round(650*pct)/100, R(an(rB).liberada)+" liberada, "+R(an(rB).retida)+" retida (antes retida "+R(retAntes)+")");
hI = texto(desenha(Inad.AbaInadimplencia)); t("Bia some das Abertas depois de quitar", !/Teste Dois Bia/.test(hI));

console.log("\n7. COMISSÕES DA REPRESENTANTE");
const c = C.comisEfetiva(s), itens = C.itensComissao(c, s, Date.now()), meus = itens.filter((i) => i.rep===REP || i.dest===REP);
const dataPg = C.remessaPorData(c, C.grupoDaRep(c, REP), rA.data), rs = C.resumoSituacao(c, itens, REP, dataPg, Date.now());
const baseCom = 1200+650+560+200, espCom = Math.round(baseCom*pct)/100;
console.log("     itens: "+meus.length+" · comissão total "+R(rs.comissaoTotal)+" · confirmado "+R(rs.confirmado)+" · Pix direto "+R(rs.direto)+" · a pagar "+R(rs.aPagar)+" · pago "+R(rs.pagos)+" · falta "+R(rs.falta)+" · data "+dataPg);
const kn = itens.filter((i) => i.rep===REP && /^KN/.test(String(i.id))).reduce((a, i) => a+(i.comissao||0), 0);
t("comissão dos 4 acertos = "+pct+"% de "+R(baseCom)+" = "+R(espCom), Math.abs((rs.comissaoTotal||0)-kn-espCom)<0.01, R(rs.comissaoTotal)+" no total, "+R(kn)+" do kit novo");
t("kit novo paga R$ 20,00 fixos à representante", kn===20, R(kn));
t("o Pix direto de R$ 260,00 conta como já pago à representante", rs.direto===260, R(rs.direto));

console.log("\n8. TELAS DESENHAM COM ESSES DADOS (sem navegador)");
const telas = [["Consolidado dos representantes", "ConsolidadoRepresentantes", "AbaConsolidadoRep"], ["Comissões", "Comissoes", "AbaComissoes"], ["Condicionais", "Condicionais", "AbaCondicionais"], ["Painel de kits", "Painel", "AbaPainel"]];
for(const [nome, arq, comp] of telas){
  try { const M = await jiti.import("@/apps/montagem/pages/"+arq); const h = texto(desenha(M[comp] || Object.values(M).find((v) => typeof v==="function")));
    t(nome+" desenha sem erro", h.length>50, h.length+" letras");
    if(arq==="ConsolidadoRepresentantes") t(nome+" mostra as 5 revendedoras", REVS.every((r) => h.toLowerCase().includes(r.toLowerCase())), REVS.filter((r) => !h.toLowerCase().includes(r.toLowerCase())).join(", "));
  } catch(x){ t(nome+" desenha sem erro", false, String(x && x.message || x).slice(0, 220)); }
}
console.log("\nRESULTADO: "+ok+" OK, "+falha+" falha(s)"); if(falhas.length) console.log("FALHAS:\n - "+falhas.join("\n - "));
process.exit(falha ? 1 : 0);
