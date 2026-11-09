// Sorelly Admin · montagem — domain/listagem-regras.js
// Regras da listagem da representante (Marcus e Deysiane, 09/11/2026; texto em docs/negocio/FLUXO-LISTAGEM-A-RETIRADA.md, seções E e F):
//  · uma listagem por representante por dia, com até 2 horários de retirada; 15 kits no dia inteiro (viagem sem limite);
//  · uma revendedora só entra em UMA listagem por dia;
//  · prazo: 2 dias úteis antes do dia da retirada, até 07:30; passou do prazo, a representante não inclui (só a supervisão libera);
//  · a representante pode excluir a revendedora (diz quem desmarcou e o motivo); a Deysiane é avisada, e a montadora só se o kit já está sendo montado.
// Os números (2 dias úteis e 07:30) ficam no Configurador (cfg.listagemPrazoDiasUteis e cfg.listagemPrazoHora); sem valor salvo valem os padrões abaixo.
var DIAS_UTEIS_PADRAO = 2, HORA_PADRAO = "07:30";
var NOMES_DIA = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
var NOMES_MES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var MOTIVOS_EXCLUSAO = ["Desistiu","Mudou o dia","Sem dinheiro para o acerto","Viagem ou compromisso","Outro"];
var QUEM_DESMARCOU = [["revendedora","A revendedora"],["representante","Eu (representante)"]];

function dataDe(iso){ var p = String(iso||"").split("-"); return new Date(+p[0], +p[1]-1, +p[2], 12, 0, 0); }
function isoDeData(dt){ return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0"); }
function nomeDoDia(iso){ return NOMES_DIA[dataDe(iso).getDay()]; }
function ddmm(iso){ var p = String(iso||"").split("-"); return p.length===3 ? p[2]+"/"+p[1] : ""; }
function tituloDoDia(iso){ return nomeDoDia(iso)+", "+ddmm(iso); }

// dia útil = segunda a sexta (feriado não entra na conta)
function diaUtilAntes(iso, n){ var dt = dataDe(iso); while(n>0){ dt.setDate(dt.getDate()-1); var w = dt.getDay(); if(w!==0 && w!==6) n--; } return dt; }

// prazo da listagem: {limite (Date), texto ("Terça-feira, 10/11, 07:30")}
function prazoDaListagem(l, cfg){
  var n = (cfg && cfg.listagemPrazoDiasUteis) || DIAS_UTEIS_PADRAO, h = (cfg && cfg.listagemPrazoHora) || HORA_PADRAO;
  var dt = diaUtilAntes(l.data, n), p = h.split(":"); dt.setHours(+p[0], +p[1], 0, 0);
  return {limite:dt, texto:NOMES_DIA[dt.getDay()]+", "+ddmm(isoDeData(dt))+", "+h};
}
function passouPrazo(l, agoraMs, cfg){ return !!l && !!l.data && (agoraMs===undefined ? Date.now() : agoraMs) > prazoDaListagem(l, cfg).limite.getTime(); }

// kits que contam na listagem do dia (os de listagens abertas da representante naquele dia)
function listagensDoDia(s, rep, iso){ return s.listagens.filter(function(x){ return x.rep===rep && x.data===iso && !x.fechada; }); }
function kitsDoDia(s, rep, iso){ var ids = listagensDoDia(s, rep, iso).map(function(x){ return x.id; }); return s.kits.filter(function(k){ return ids.indexOf(k.lid)>=0; }); }
// a revendedora já está em outra listagem neste dia? devolve o kit (ou null)
function kitDaRevNoDia(s, rev, iso, ignorarId){
  var lids = s.listagens.filter(function(x){ return x.data===iso; }).map(function(x){ return x.id; });
  return s.kits.find(function(k){ return k.rev===rev && k.id!==ignorarId && lids.indexOf(k.lid)>=0 && k.status!=="retirado"; }) || null;
}

// o que a montagem precisa fazer quando o kit sai da listagem (o texto do aviso e o destino das peças, segundo a Deysiane)
function acaoDoKitExcluido(status){
  if(status==="bipado") return {k:"estoque", texto:"O kit já está bipado: volta para o estoque pelo sistema e só depois as peças vão para outros kits."};
  if(status==="montado" || status==="supervisao" || status==="ajuste") return {k:"distribuir", texto:"O kit está montado e não foi bipado: as peças vão direto para a montagem de outros kits."};
  if(status==="montando" || status==="bipando") return {k:"montadora", texto:"O kit está sendo montado: a montadora precisa parar, e as peças vão para outros kits."};
  return {k:"cancelar", texto:"O kit ainda não foi montado: só sai da fila."};
}

export { NOMES_DIA, NOMES_MES, MOTIVOS_EXCLUSAO, QUEM_DESMARCOU, dataDe, isoDeData, nomeDoDia, ddmm, tituloDoDia, diaUtilAntes, prazoDaListagem, passouPrazo, listagensDoDia, kitsDoDia, kitDaRevNoDia, acaoDoKitExcluido };
