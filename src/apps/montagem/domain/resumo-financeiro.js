// Sorelly Admin · montagem e bipagem — domain/resumo-financeiro.js
// Resumo do mês e do ano para a Visão geral. MESMAS contas da Previsão de faturamento (meta 95%, janela de 30 dias),
// pra os números baterem nas duas telas. Nada de valor fixo: tudo vem de faturamento lançado, meta mensal e Contas a pagar.
import { MESES_LONGO, contasDoMes, fatEfetivo, projetarAno, resumoMensalRevendedoras } from "@/apps/montagem/domain/financeiro";

var META_PCT = 95, JANELA_PADRAO = 2;   // janela = índice de CRESCIMENTO_REVENDEDORAS (2 = 30 dias)

function resumoFinanceiro(s, janela){
  var JANELA = janela===undefined ? JANELA_PADRAO : janela;
  var hoje = new Date(), ano = hoje.getFullYear(), mes = hoje.getMonth(), anoStr = String(ano);
  var cp = function(i){ return contasDoMes(s, anoStr, i); };
  var fd = fatEfetivo(s), se = Object.assign({}, s, {faturamentoDiario:fd});   // com o lançamento de hoje, se houver
  var proj = projetarAno(se, anoStr, JANELA, META_PCT);
  // mês atual
  var entradas = Object.keys(fd).sort().filter(function(k){ return k.slice(0,7)===anoStr+"-"+String(mes+1).padStart(2,"0"); });
  var ult = entradas.length ? fd[entradas[entradas.length-1]] : null;
  var recebido = ult ? ult.recebido : 0, acertos = ult ? ult.acertos : 0;
  var meta = Object.assign({base:0, previstos:0}, ((s.metaMensal||{})[anoStr]||{})[mes]);
  var metaAlvo = Math.round(meta.previstos*META_PCT/100);
  var mediaAcerto = acertos>0 ? recebido/acertos : 0;
  var fatPrevisto = metaAlvo*mediaAcerto, aReceber = Math.max(0, fatPrevisto-recebido);
  var c = cp(mes);
  var mesRes = {nome:MESES_LONGO[mes], base:meta.base, previstos:meta.previstos, metaAlvo:metaAlvo, acertos:acertos, mediaAcerto:mediaAcerto, recebido:recebido, pago:c.pago, aReceber:aReceber, aPagar:c.apagar, previsto:fatPrevisto,
    contasTotal:c.pago+c.apagar, resultadoAgora:recebido-c.pago, resultadoEsperado:fatPrevisto-(c.pago+c.apagar)};
  // ano
  var meses = [], totContas = 0, totPago = 0;
  for(var i=0;i<12;i++){
    var ci = cp(i), pm = proj.porMes[i];
    var fat = i===mes ? fatPrevisto : pm.valor;
    totContas += ci.pago+ci.apagar; totPago += ci.pago;
    meses.push({mes:i, nome:MESES_LONGO[i], fat:fat, contas:ci.pago+ci.apagar, tipo:pm.tipo});
  }
  var recebidoAno = proj.porMes.reduce(function(t,x){ return x.mes<=mes ? t+x.valor : t; }, 0);
  var futuro = proj.porMes.reduce(function(t,x){ return x.tipo==="projetado" ? t+x.valor : t; }, 0);
  var aReceberAno = aReceber+futuro, fatAno = recebidoAno+aReceberAno;
  var anoRes = {ano:ano, recebido:recebidoAno, pago:totPago, aReceber:aReceberAno, aPagar:totContas-totPago, previsto:fatAno,
    contasTotal:totContas, resultadoAgora:recebidoAno-totPago, resultadoEsperado:fatAno-totContas, meses:meses, mesAtual:mes};
  return {mes:mesRes, ano:anoRes};
}

export { resumoFinanceiro };

// Tabela "Faturamento mês a mês" da Visão geral: 12 meses com revendedoras, acertos, média por acerto, faturamento, contas a pagar e resultado.
// Meses fechados = real. Mês atual = PREVISÃO (meta × média atualizada, já com o lançamento de hoje). Novembro e dezembro = revendedoras pela
// janela escolhida × conversão em acertos × (média atual + 5% / + 15%).
function tabelaMeses(s, janela){
  var hoje = new Date(), ano = hoje.getFullYear(), mes = hoje.getMonth(), anoStr = String(ano);
  var fd = fatEfetivo(s), se = Object.assign({}, s, {faturamentoDiario:fd});
  var proj = projetarAno(se, anoStr, janela===undefined ? JANELA_PADRAO : janela, META_PCT);
  var rv = resumoMensalRevendedoras(s, ano), res = resumoFinanceiro(s, janela);
  var rows = proj.porMes.map(function(pm){
    var ci = contasDoMes(s, anoStr, pm.mes), contas = ci.pago+ci.apagar, atual = pm.tipo==="atual", fut = pm.tipo==="projetado";
    var fat = atual ? res.mes.previsto : pm.valor;
    var acertos = atual ? Math.round(Object.assign({previstos:0}, ((s.metaMensal||{})[anoStr]||{})[mes]).previstos*META_PCT/100) : (pm.realizados||0);
    var media = atual ? res.mes.mediaAcerto : (pm.mediaAcerto || (acertos>0 ? fat/acertos : 0));
    var r = rv[pm.mes];
    return {mes:pm.mes, nome:MESES_LONGO[pm.mes], tipo:pm.tipo, atual:atual, previsao:atual||fut, alta:pm.alta||null, fat:fat, acertos:acertos, media:media,
      revendedoras: fut ? pm.revendedoras : (r && r.fim!==null && r.fim!==undefined ? r.fim : null), contas:contas, res:fat-contas,
      hojeAcertos: atual ? res.mes.acertos : null, hojeRecebido: atual ? res.mes.recebido : null};
  });
  var tot = {fat:0, contas:0, acertos:0};
  rows.forEach(function(r){ tot.fat += r.fat; tot.contas += r.contas; tot.acertos += r.acertos; });
  return {rows:rows, tot:Object.assign(tot, {res:tot.fat-tot.contas})};
}

export { tabelaMeses };
