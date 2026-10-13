// Sorelly Admin · montagem e bipagem — state/store.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { aplicaFila } from "@/apps/montagem/domain/retornos";
import { VERSAO_DEMO, acertosDemo } from "@/apps/montagem/domain/acertos-demo";
import { VERSAO_INTERNOS, internosDemo, termosDemo } from "@/apps/montagem/domain/internos-demo";
import { COMIS0 } from "@/apps/montagem/domain/comissoes";
import { CFG0 } from "@/apps/montagem/domain/config";
import { formasPagamentoPadrao, normalizarVersao, novaVersaoRegras, versaoVigente } from "@/apps/montagem/domain/consignado";
import { MONTADORAS, SUPERVISORA, nomeDe } from "@/apps/montagem/domain/equipe";
import { NOVAS0, RECUSAS0, VIRADA0, avalRepDemo } from "@/apps/montagem/domain/representantes";
import { HISTORICO0, REGISTROS0, histDemo, novoDia } from "@/apps/montagem/domain/seed";
import { CONTAS_CNPJ0, FISCAL0 } from "@/apps/montagem/domain/cnpjs";
import { INAD_FIN0, COMPRAS_INT0 } from "@/apps/montagem/domain/inadimplencia-fin";
import { VERSAO_CPD, CONTAS_PAGAR_DEMO, CONTAS_PAGAS_DIARIO_DEMO, FATURAMENTO_DIARIO_DEMO, META_MENSAL_DEMO, VENDIDO_PONTA_DEMO } from "@/apps/montagem/domain/financeiro";
import { agendaHojeDemo, revInternasDemo } from "@/apps/montagem/domain/revendedoras-internas";
import { REVENDEDORAS_DIARIO_DEMO } from "@/apps/montagem/domain/revendedoras-diario";
import { media3 } from "@/apps/montagem/domain/vendas";
import { hoje, hora, isoDia } from "@/apps/montagem/lib/format";

// revendedoras internas de demonstração; quem é Kit 100% Prata já entra com a modalidade no cadastro (perfisRev)
var VERSAO_REVINT = 2; // 2 = 4 atendimentos internos já marcados para hoje
function semearRevInternas(st){
  st.revInternas = revInternasDemo(); st.perfisRev = Object.assign({}, st.perfisRev); st.revIntV = VERSAO_REVINT;
  var vig = versaoVigente(st), agora = Date.now();
  var hojeDemo = agendaHojeDemo(st.revInternas, isoDia(new Date()), vig ? vig.id : null, agora);
  st.internos = hojeDemo.concat((st.internos||[]).filter(function(x){ return !x.demoHoje; }));
  if(hojeDemo.length){ st.intAbas = hojeDemo.slice(0,2).map(function(x){ return x.id; }); st.intSel = hojeDemo[0].id; }   // abre os dois primeiros de hoje, sem preenchimento
  st.revInternas.forEach(function(r){ if(r.prata && !(st.perfisRev[r.nome]||{}).modalidade) st.perfisRev[r.nome] = Object.assign({}, st.perfisRev[r.nome], {modalidade:"prata"}); });
}
var VERSAO_LISTAGENS = 11; // 9 = 4 representantes (Dayanne, Lysie, Jessica e Thalita), 3 acertos a realizar cada, nada bipado
var VERSAO_REPS = 2; // 2 = só 4 representantes (Dayanne, Lysie, Jessica e Thalita) nas avaliações, recusas e virada do mês
var CHAVE = "sorelly_montagem_v9"; // v4: tipos de item, condicionais, kit novo e retirada pelo app
function novo(){
  var d = novoDia();
  var rv0 = novaVersaoRegras();
  var st = {v:4, cfg:JSON.parse(JSON.stringify(CFG0)), montadoras:JSON.parse(JSON.stringify(MONTADORAS)),
    regrasConsignado:{versoes:[rv0], atualId:rv0.id}, acertosConsignado:[], entregasKN:{}, comis:JSON.parse(JSON.stringify(COMIS0)), internos:[], formasPagamento:formasPagamentoPadrao(),
    listagens:d.listagens, kits:d.kits, registros:REGISTROS0.slice(), historico:HISTORICO0.slice(), histListagens:histDemo(), histV:3, repsV:VERSAO_REPS, novas:JSON.parse(JSON.stringify(NOVAS0)), retPend:[],
    avalRep:avalRepDemo(), recusas:RECUSAS0.slice(), virada:JSON.parse(JSON.stringify(VIRADA0)), bloqueioNovas:{Jessica:true},
    perfisRev:{
      "Andrielle Taborda":{profissao:"Nail Designer", enderecoTrabalho:"Studio Bella Nails · Rua Francisco Derosso, 2145 - Xaxim, Curitiba - PR",
        condicionaisAbertas:[{numero:"091719", pecas:131},{numero:"092240", pecas:6},{numero:"099999", pecas:100}],
        expositores:[{id:"exp-acrilico", nome:"Expositor acrílico grande", qtd:1},{id:"exp-pulseira", nome:"Expositor de pulseira", qtd:1}]},
      "Beatriz Nogueira":{profissao:"Nail Designer", enderecoCasa:"Rua Fictícia S, 210 - Centro, Curitiba - PR", enderecoTrabalho:"Studio Bella Nails · Rua Francisco Derosso, 2145 - Xaxim, Curitiba - PR", fone1:"(41) 00000-0088", fone2:"(41) 99900-0088", refs:[{nome:"Maria Aparecida", rel:"Mãe", fone:"(41) 99812-3344"}, {nome:"João Carlos", rel:"Esposo", fone:"(41) 98745-6120"}, {nome:"Rosângela Silva", rel:"Irmã", fone:"(41) 99133-8870"}]},
      "Silvana Ramos":{profissao:"Cabeleireira", enderecoTrabalho:"Studio Concept Hair · Rua Chile, 1670 - Rebouças, Curitiba - PR"},
      "Amanda Ribeiro":{profissao:"Gerente de Loja", enderecoTrabalho:"Boutique Maison · Avenida República Argentina, 2870 - Portão, Curitiba - PR"},
      "Daniela Moreira":{profissao:"Desempregada", enderecoTrabalho:"Não se aplica"}
    },
    contasPagar:JSON.parse(JSON.stringify(CONTAS_PAGAR_DEMO)), verFinanceiro:"total",
    faturamentoDiario:JSON.parse(JSON.stringify(FATURAMENTO_DIARIO_DEMO)), metaMensal:JSON.parse(JSON.stringify(META_MENSAL_DEMO)),
    revendedorasDiario:JSON.parse(JSON.stringify(REVENDEDORAS_DIARIO_DEMO)), vendidoPonta:JSON.parse(JSON.stringify(VENDIDO_PONTA_DEMO)),
    contasPagasDiario:JSON.parse(JSON.stringify(CONTAS_PAGAS_DIARIO_DEMO)), inadFin:JSON.parse(JSON.stringify(INAD_FIN0)), comprasInt:JSON.parse(JSON.stringify(COMPRAS_INT0)), cpdV:VERSAO_CPD, negPix:{Thalita:{modo:"pct", valor:100, vigencia:"fixo", mes:"", extra:0, extraTxt:""}}, fatHojeV:4, fatHoje:{data:"2026-10-13", recebido:355743.30, acertos:473, em:Date.now()},
    fiscal:JSON.parse(JSON.stringify(FISCAL0)), contasCnpj:JSON.parse(JSON.stringify(CONTAS_CNPJ0)),
    avisosCfg:{media_alta:[11,16,17]}, alertas:[],
    mesFechado:null, visao:"supervisao", bipadora:9, usuario:11, aba:"painel", celular:1, telaCel:"proximo",
    abertas:{L1:true, L2:true}, kitAberto:null, extrato:null, filtroReg:"todas", aviso:null, demoAcertos:VERSAO_DEMO, demoListagens:VERSAO_LISTAGENS};
  st.acertosConsignado = acertosDemo(st);   // 10 acertos do mês (pedido do Marcus)
  var di = internosDemo(st); st.internos = di.internos; st.acertosConsignado = st.acertosConsignado.concat(di.acertos); st.lancFin = di.lancFin; st.intAbas = ["ID6","ID7"]; st.intSel = "ID6"; st.demoInternos = VERSAO_INTERNOS; var tdn = termosDemo(st); Object.keys(tdn).forEach(function(n){ st.perfisRev[n] = Object.assign({}, st.perfisRev[n], tdn[n]); });   // listagem do atendimento interno (02/10 feita, 05/10 agenda)
  semearRevInternas(st);   // depois dos internos de demonstração: coloca 4 atendimentos marcados para hoje
  st.filaSimV = 2; st.filaSimulada = 42; st.filaNivel = -1; st = aplicaFila(st);   // simulação: 45 kits aguardando bipagem e o alerta já sobe
  return st;
}
function inicial(){
  try { var j = localStorage.getItem(CHAVE); if(j){ var s = JSON.parse(j); if(s && s.v===4){ s.aviso=null;
    // listagens de demonstração antigas são trocadas pelas novas (dias 6, 7 e 8, nada bipado)
    if(s.demoListagens!==VERSAO_LISTAGENS){ var dn = novoDia(); s.listagens = dn.listagens; s.kits = dn.kits; s.retPend = []; s.entregasKN = {}; s.abertas = {L1:true, L2:true}; s.kitAberto = null; s.demoListagens = VERSAO_LISTAGENS; s.perfisRev = Object.assign({}, s.perfisRev, {"Beatriz Nogueira":{profissao:"Nail Designer", enderecoCasa:"Rua Fictícia S, 210 - Centro, Curitiba - PR", enderecoTrabalho:"Studio Bella Nails · Rua Francisco Derosso, 2145 - Xaxim, Curitiba - PR", fone1:"(41) 00000-0088", fone2:"(41) 99900-0088", refs:[{nome:"Maria Aparecida", rel:"Mãe", fone:"(41) 99812-3344"}, {nome:"João Carlos", rel:"Esposo", fone:"(41) 98745-6120"}, {nome:"Rosângela Silva", rel:"Irmã", fone:"(41) 99133-8870"}]}}); }
    // campos novos da configuração entram com o padrão em dados já salvos
    ["tabelaAtiva","tabelaKitBaixo","minVendaApp","limiteMelhores","categorias","pecasKit","pecasSugCat","reposicaoMax","limiteMarcus","limiteAnaliseVendas","comissoesRev"].forEach(function(f){ if(s.cfg[f]===undefined) s.cfg[f] = JSON.parse(JSON.stringify(CFG0[f])); });
    ["valorBipNormal","valorBipEspecial","limiteBipEspecial","perdaFalta"].forEach(function(f){ if(s.cfg[f]===undefined) s.cfg[f] = CFG0[f]; });
    // histórico antigo (sem data completa e sem kits) é trocado pela demonstração nova; o que foi concluído de verdade fica
    // histórico de demonstração v2 (4 a 5 listagens por representante); o que foi concluído de verdade hoje fica
    if(s.histV!==3){ s.histListagens = (s.histListagens||[]).filter(function(h){return h.hoje && h.lid;}).concat(histDemo()); s.histV = 3; }
    if(!s.revInternas || s.revIntV!==VERSAO_REVINT) semearRevInternas(s);
    if(!s.avisosCfg) s.avisosCfg = {media_alta:[11,16,17]};
    if(!s.alertas) s.alertas = [];
    if(s.cfg.prazoPedidoHoras===undefined) s.cfg.prazoPedidoHoras = 48;
    ["bonusNotaMin","bonusValor","perdaRecusa","recusasBloqueio","perdaDiaParado","diasParadosTolerancia"].forEach(function(f){ if(s.cfg[f]===undefined) s.cfg[f] = CFG0[f]; });
    if(s.repsV!==VERSAO_REPS){ s.repsV = VERSAO_REPS; s.avalRep = avalRepDemo(); s.recusas = RECUSAS0.slice(); s.virada = JSON.parse(JSON.stringify(VIRADA0)); s.bloqueioNovas = {Jessica:true}; }
    if(!s.avalRep){ s.avalRep = avalRepDemo(); s.recusas = RECUSAS0.slice(); s.virada = JSON.parse(JSON.stringify(VIRADA0)); s.bloqueioNovas = {Jessica:true}; }
    if(!s.contasPagar){ s.contasPagar = JSON.parse(JSON.stringify(CONTAS_PAGAR_DEMO)); s.verFinanceiro = "total"; }
    if(!s.faturamentoDiario) s.faturamentoDiario = JSON.parse(JSON.stringify(FATURAMENTO_DIARIO_DEMO));
    if(!s.revendedorasDiario) s.revendedorasDiario = JSON.parse(JSON.stringify(REVENDEDORAS_DIARIO_DEMO));
    if(!s.vendidoPonta) s.vendidoPonta = JSON.parse(JSON.stringify(VENDIDO_PONTA_DEMO));
    if(!s.metaMensal) s.metaMensal = JSON.parse(JSON.stringify(META_MENSAL_DEMO));
    if(!s.contasPagasDiario) s.contasPagasDiario = JSON.parse(JSON.stringify(CONTAS_PAGAS_DIARIO_DEMO));
    if(!s.inadFin) s.inadFin = JSON.parse(JSON.stringify(INAD_FIN0));
    if(!s.comprasInt) s.comprasInt = JSON.parse(JSON.stringify(COMPRAS_INT0));
    // dias de outubro passados pelo Marcus (contas pagas por CNPJ, faturado e acertos) e o registro oficial de 08/10 entram nos dados já salvos
    if(s.cpdV!==VERSAO_CPD){ s.cpdV = VERSAO_CPD; Object.keys(CONTAS_PAGAS_DIARIO_DEMO).filter(function(k){ return k>="2026-10-01"; }).forEach(function(k){ s.contasPagasDiario[k] = JSON.parse(JSON.stringify(CONTAS_PAGAS_DIARIO_DEMO[k])); }); s.faturamentoDiario["2026-10-08"] = Object.assign({}, FATURAMENTO_DIARIO_DEMO["2026-10-08"]); }   // o faturamento de hoje NÃO é mexido aqui: vem da migração fatHojeV (13/10: R$ 355.743,30 e 473 acertos)
    // faturamento de hoje (13/10/2026, passado pelo Marcus): R$ 355.743,30 e 473 acertos (média R$ 752,10); provisório até fixar o dia
    if(s.fatHojeV!==4){ s.fatHojeV = 4; s.fatHoje = {data:"2026-10-13", recebido:355743.30, acertos:473, em:Date.now()}; }
    if(!s.negPix) s.negPix = {Thalita:{modo:"pct", valor:100, vigencia:"fixo", mes:"", extra:0, extraTxt:""}};   // negociação do Pix direto: Thalita recebe 100% da comissão por Pix direto
    if(!s.regrasConsignado){ var rv0b = novaVersaoRegras(); s.regrasConsignado = {versoes:[rv0b], atualId:rv0b.id}; }
    else s.regrasConsignado = Object.assign({}, s.regrasConsignado, {versoes:(s.regrasConsignado.versoes||[]).map(normalizarVersao)});
    // exemplo de condicionais em aberto (demonstração) para a Andrielle, caso o estado salvo seja anterior a ele
    if(s.perfisRev && s.perfisRev["Andrielle Taborda"] && !s.perfisRev["Andrielle Taborda"].condicionaisAbertas)
      s.perfisRev["Andrielle Taborda"].condicionaisAbertas = [{numero:"091719", pecas:131},{numero:"092240", pecas:6},{numero:"099999", pecas:100}];
    if(s.perfisRev && s.perfisRev["Andrielle Taborda"] && !s.perfisRev["Andrielle Taborda"].expositores)
      s.perfisRev["Andrielle Taborda"].expositores = [{id:"exp-acrilico", nome:"Expositor acrílico grande", qtd:1},{id:"exp-pulseira", nome:"Expositor de pulseira", qtd:1}];
    if(!s.fiscal || !s.fiscal.hist) s.fiscal = JSON.parse(JSON.stringify(FISCAL0));
    if(!s.contasCnpj) s.contasCnpj = JSON.parse(JSON.stringify(CONTAS_CNPJ0));
    if(!s.acertosConsignado) s.acertosConsignado = [];
    if(!s.internos) s.internos = [];
    if(!s.entregasKN) s.entregasKN = {};
    if(!s.lancFin) s.lancFin = [];
    if(s.demoInternos!==VERSAO_INTERNOS){ s.demoInternos = VERSAO_INTERNOS; var di2 = internosDemo(s); s.intAbas = ["ID6","ID7"]; s.intSel = "ID6"; s.lancFin = di2.lancFin.concat((s.lancFin||[]).filter(function(x){ return !x.demo; }));
      s.internos = di2.internos.concat(s.internos.filter(function(x){ return !x.demo; }));
      s.acertosConsignado = s.acertosConsignado.filter(function(r){ return !(r.demo && r.origem==="interno"); }).concat(di2.acertos);
      if(!s.perfisRev) s.perfisRev = {}; var td2 = termosDemo(s); Object.keys(td2).forEach(function(n){ s.perfisRev[n] = Object.assign({}, s.perfisRev[n], td2[n]); }); }
    if(!s.formasPagamento) s.formasPagamento = formasPagamentoPadrao();
    if(!s.formasPagamento.some(function(f){ return f.k==="pix_representante"; })){   // forma nova: Pix direto para a representante
      var nova = formasPagamentoPadrao().find(function(f){ return f.k==="pix_representante"; }), ip = s.formasPagamento.findIndex(function(f){ return f.k==="pix"; });
      s.formasPagamento.splice(ip>=0 ? ip+1 : s.formasPagamento.length, 0, nova); }
    if(!s.perfisRev) s.perfisRev = {};
    if(!s.usuario) s.usuario = SUPERVISORA.id;
    if(!s.comis) s.comis = JSON.parse(JSON.stringify(COMIS0));
    if(s.comis.fixoV!==2){ s.comis.fixoV = 2; s.comis.combSemEnvio = COMIS0.combSemEnvio; }   // valor fixo do combustível sem km no prazo baixou para R$ 200,00
    if(s.demoAcertos!==VERSAO_DEMO){ s.demoAcertos = VERSAO_DEMO; s.acertosConsignado = acertosDemo(s).concat((s.acertosConsignado||[]).filter(function(r){ return !r.demo; })); }
    if(s.filaSimV!==2){ s.filaSimV = 2; s.filaSimulada = 42; s.filaNivel = -1; s = aplicaFila(s); }   // simulação: 45 kits aguardando bipagem (3 reais + 34) e o alerta já sobe
    s.visao = "supervisao";
    return s; } } } catch(x){}
  return novo();
}
function mapKit(s, id, fn){ return s.kits.map(function(k){ return k.id===id ? Object.assign({},k,fn(k)) : k; }); }
function com(s, patch, txt, tom){ var n = Object.assign({}, s, patch); if(txt) n.aviso = {txt:txt, tom:tom||"ok", t:Date.now()}; return n; }
function kitDe(s,id){ return s.kits.find(function(k){return k.id===id;}); }
function ajustaDiv(s, montId, delta){
  return s.montadoras.map(function(m){ return m.id!==montId ? m :
    Object.assign({}, m, {mes:Object.assign({}, m.mes, {div:Math.max(0, m.mes.div+delta)})}); });
}
function registroListagem(l, kits, agora){
  var ks = kits.filter(function(k){return k.lid===l.id;});
  return {id:l.id+"-"+agora, lid:l.id, hoje:true, ts:agora, data:new Date(agora).toLocaleDateString("pt-BR"), rep:l.rep, destino:l.destino, viagem:l.viagem,
    horario:l.horario, concluida:hora(agora), qtd:ks.length, total:ks.reduce(function(t,k){return t+(k.valor||0);},0),
    divs:ks.filter(function(k){return k.divReg;}).length, retiradas:l.retiradas.length+1,
    atrasados:ks.filter(function(k){return k.atrasado;}).length,
    kits:ks.map(function(k){ return {rev:k.rev, prio:k.prio, valor:k.valor, real:k.valorReal, div:k.divReg, atrasado:k.atrasado,
      media: k.vendas && k.vendas.length ? media3(k.vendas) : null, tipoKit:k.tipoKit, cond:k.cond, aval:k.aval, confRev:k.confRev||null,
      mont:nomeDe(k.montId), tempoM:k.tempoM, fimM:hora(k.fimM), bip:nomeDe(k.bipId), tempoB:k.fimB&&k.iniB?k.fimB-k.iniB:null, fimB:hora(k.fimB), ret:hora(k.retEm)}; })};
}

export { CHAVE, novo, inicial, mapKit, com, kitDe, ajustaDiv, registroListagem };
