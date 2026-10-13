// Sorelly Admin — domain/atendimento-interno.js
// Regras de tempo do atendimento interno (a revendedora vem até a Sorelly). Valores aqui, nunca dentro de tela.

// Chegou até 30 min depois do horário marcado = no horário. Passou disso, perde 10% do brinde.
var TOLERANCIA_CHEGADA_MIN = 30;
var DESCONTO_BRINDE_ATRASO = 0.10;

// Tempo máximo para a revendedora escolher o kit, pelo valor do kit
var TEMPO_ESCOLHA_KIT = [{ate:7000, min:30}, {ate:12000, min:45}, {ate:17000, min:60}, {ate:Infinity, min:120}];
function tempoMaxEscolhaMin(valorKit){
  if(!(valorKit>0)) return null;
  var f = TEMPO_ESCOLHA_KIT.find(function(x){ return valorKit<=x.ate; });
  return f ? f.min : null;
}

export { TOLERANCIA_CHEGADA_MIN, DESCONTO_BRINDE_ATRASO, TEMPO_ESCOLHA_KIT, tempoMaxEscolhaMin };

// Pagamentos enviados ao financeiro: cada linha (forma + valor) é dividida em "partes" (uma por conta). Estado da linha:
// aguardando (falta definir as contas) → conta (contas definidas, falta comprovante/OK) → ok (tudo conferido) · ou isento (só diferença de brinde).
// O financeiro define as contas e dá "OK, enviar ao atendimento" (l.enviada); só então o atendimento vê as contas e anexa os comprovantes.
// Mexeu nas contas depois de enviar = volta a precisar de novo OK. Linhas antigas, já com comprovante ou OK, valem como enviadas.
function contasDefinidas(l){
  var ps = l.partes || [];
  var soma = ps.reduce(function(t,p){ return t+(p.valor||0); }, 0);
  return ps.length>0 && !ps.some(function(p){ return !p.descricao; }) && Math.abs(soma-l.valor)<=0.009;
}
function contasEnviadas(l){ return l.enviada===true || (l.partes||[]).some(function(p){ return p.comprovante || p.ok; }); }
function statusLinhaFin(l){
  if(l.isento) return "isento";
  if(!contasDefinidas(l) || !contasEnviadas(l)) return "aguardando";
  return (l.partes||[]).every(function(p){ return p.ok; }) ? "ok" : "conta";
}
function lancamentoConferido(linhas){ return linhas.length>0 && linhas.every(function(l){ var s = statusLinhaFin(l); return s==="ok" || s==="isento"; }); }

export { statusLinhaFin, lancamentoConferido, contasDefinidas, contasEnviadas };
