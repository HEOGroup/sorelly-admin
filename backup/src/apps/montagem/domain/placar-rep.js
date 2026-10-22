// Sorelly Admin · montagem — domain/placar-rep.js
// Placar simples das representantes: 4 itens, cada um com uma cor (verde / amarelo / vermelho) e uma cor geral.
// Tudo é PORCENTAGEM, então carteira grande e pequena são medidas do mesmo jeito. Os limites ficam em LIMITES (versão simples; vamos melhorar depois).
import { statusDe, taxaDe } from "@/apps/montagem/domain/comissoes";
import { resumoRep } from "@/apps/montagem/domain/representantes";

var r2 = function(x){ return Math.round(x*100)/100; };
// até "verde" = verde, até "amarelo" = amarelo, acima = vermelho (nota da avaliação é o contrário: quanto maior, melhor)
var LIMITES = {inadimplencia:{verde:3, amarelo:8}, regras:{verde:10, amarelo:30}, saidas:{verde:10, amarelo:25}, condicionais:{verde:5, amarelo:20}, avaliacao:{verde:4, amarelo:3}};
var COR_PESO = {verde:2, amarelo:1, vermelho:0};

function cor(valor, lim){ return valor<=lim.verde ? "verde" : valor<=lim.amarelo ? "amarelo" : "vermelho"; }

// r = acertos do mês (registros de s.acertosConsignado) de UMA representante
function placarDe(rep, acertos, s){
  var ac = acertos.filter(function(r){ return r.tipo==="acerto"; });
  // 1. Recebeu o pagamento do acerto: % que ficou em aberto sobre o valor dos acertos
  var devido = 0, aberto = 0;
  ac.forEach(function(r){ var d = r2((r.valorDevido!=null ? r.valorDevido : r.valorAcerto||0) + (r.excedenteBrinde||0)), p = (r.pagamentos||[]).reduce(function(t, x){ return x.forma==="acerto_loja" ? t : t+(x.valor||0); }, 0);
    devido += d; aberto += Math.max(0, r2(d - p)); });
  var inad = devido>0 ? aberto/devido*100 : null;
  // 2. Cobrou taxa e multa: só conta o que ERA para cobrar. Nada a cobrar = verde.
  var taxas = ac.filter(function(r){ return taxaDe(r).taxa>0; }), taxasNao = taxas.filter(function(r){ return !taxaDe(r).paga; }).length;
  var rem = []; ac.forEach(function(r){ (r.remarcacoes||[]).forEach(function(x){ rem.push(x); }); });
  var remDevidas = rem.filter(function(x){ return !x.isenta || !(x.motivo||"").trim(); }), remFalhas = rem.filter(function(x){ return x.isenta && !(x.motivo||"").trim(); }).length;
  var aCobrar = taxas.length + remDevidas.length, naoCobrou = taxasNao + remFalhas;
  var regras = aCobrar>0 ? naoCobrou/aCobrar*100 : null;
  // 3. Revendedoras ficaram: Acerto + saiu sobre (Acerto + kit + Acerto + saiu)
  var kit = 0, saiu = 0; ac.forEach(function(r){ var st = statusDe(r); if(st.indexOf("Acerto + kit")===0) kit++; else if(st==="Acerto + saiu") saiu++; });
  var saidas = kit+saiu>0 ? saiu/(kit+saiu)*100 : null;
  // 4. Avaliação da representante (tela Avaliação das representantes, escala 1 a 5)
  var av = resumoRep(rep, s).pontos;
  // 5. Condicionais assinadas: só dos atendimentos já conferidos pelo agendamento (os que ainda não foram conferidos não contam)
  var nCond = 0, nSem = 0;
  ac.forEach(function(r){ var rec = r.recebimento || {}; if(!rec.ok || rec.semCond || r.tipoKit==="saiu") return;
    (rec.condNums || r.condicionaisSelecionadas || []).forEach(function(n){ nCond++; if(!(rec.condAss ? rec.condAss[n] : (rec.prom && rec.prom.ok))) nSem++; }); });
  var semAss = nCond>0 ? nSem/nCond*100 : null;
  var itens = {
    din: {cor: inad==null ? "cinza" : cor(inad, LIMITES.inadimplencia), txt: inad==null ? "sem acertos" : (Math.round(inad*10)/10).toString().replace(".",",")+"% em aberto", dica:"Quanto do valor dos acertos ainda não foi pago"},
    reg: {cor: regras==null ? "verde" : cor(regras, LIMITES.regras), txt: regras==null ? "nada a cobrar" : (naoCobrou+" de "+aCobrar+" não cobradas"), dica:"Taxas não pagas e multas isentas sem motivo, só do que era para cobrar"},
    sai: {cor: saidas==null ? "cinza" : cor(saidas, LIMITES.saidas), txt: saidas==null ? "sem acertos" : (kit+" ficaram · "+saiu+" saíram"), dica:"Acerto + kit contra Acerto + saiu"},
    con: {cor: semAss==null ? "cinza" : cor(semAss, LIMITES.condicionais), txt: semAss==null ? "sem conferidas" : (nSem+" de "+nCond+" sem assinatura"), dica:"Condicionais sem assinatura, entre as já conferidas pelo agendamento"},
    ava: {cor: av==null ? "cinza" : av>=LIMITES.avaliacao.verde ? "verde" : av>=LIMITES.avaliacao.amarelo ? "amarelo" : "vermelho", txt: av==null ? "sem avaliação" : (Math.round(av*10)/10).toString().replace(".",",")+" de 5", dica:"Nota da tela Avaliação das representantes"}};
  var valendo = Object.keys(itens).map(function(k){ return itens[k].cor; }).filter(function(c){ return c!=="cinza"; });
  var media = valendo.length ? valendo.reduce(function(t, c){ return t+COR_PESO[c]; }, 0)/valendo.length : null;
  var geral = media==null ? "cinza" : media>=1.5 ? "verde" : media>=0.75 ? "amarelo" : "vermelho";
  return {rep:rep, n:acertos.length, itens:itens, geral:geral, media:media==null ? -1 : media};
}

// um placar por representante, do pior para o melhor (quem precisa de atenção aparece primeiro)
function placarReps(s, mes){
  var por = {};
  (s.acertosConsignado||[]).filter(function(r){ return r.origem!=="interno" && r.rep && (r.data||"").slice(0,7)===mes; }).forEach(function(r){ (por[r.rep] = por[r.rep] || []).push(r); });
  return Object.keys(por).map(function(k){ return placarDe(k, por[k], s); }).sort(function(a, b){ return a.media-b.media || a.rep.localeCompare(b.rep); });
}

export { placarReps, LIMITES };
