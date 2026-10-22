// Sorelly Admin — domain/retornos.js
// RETORNOS: os kits que as representantes trazem de volta. O sistema sabe que o kit chegou quando o AGENDAMENTO dá o OK de recebimento no Consolidado
// (dinheiro e condicionais). Daí o kit entra na FILA PARA BIPAR; quem bipa dá o OK ali mesmo. Fila grande = alerta (20, 30, 40 e 50) e pede ajuda de outros setores.
import { destinosDe } from "@/apps/montagem/domain/avisos";
import { isoDia } from "@/apps/montagem/lib/format";

var NIVEIS = [20,30,40,50];                                    // a cada degrau passado, um novo alerta mais vermelho; no 50 é o vermelho máximo
var COR_NIVEL = ["#FACC15","#F97316","#EF4444","#FF0033"];   // amarelo, laranja, vermelho, vermelho máximo
function nivelDe(qtd){ var n = -1; NIVEIS.forEach(function(x, i){ if(qtd>=x) n = i; }); return n; }
function corDaFila(qtd){ var n = nivelDe(qtd); return n<0 ? (qtd>0 ? "#4ADE80" : "#94A3B8") : COR_NIVEL[n]; }

// acertos que chegaram (OK do agendamento) e ainda não tiveram o retorno bipado; atendimento interno não entra (a revendedora veio até a empresa)
function filaRetornos(s){
  return (s.acertosConsignado||[]).filter(function(r){ var rc = r.recebimento; return r.origem!=="interno" && rc && rc.ok && !rc.bip; });
}
// quem bipa os retornos (marcado no Configurador geral)
function quemBipa(s, ids){ var l = s.bipaRetorno; return (l ? l : ids).slice(); }
function podeBiparRetorno(s, id, padrao, ehDiretoria){ return ehDiretoria || quemBipa(s, padrao).indexOf(id)>=0; }

// resumo por dia: kits enviados (saíram com a representante) e retornos bipados
function porDia(s){
  var dias = {}, get = function(k){ return dias[k] || (dias[k] = {dia:k, enviados:0, chegaram:0, bipados:0, por:{}}); };
  (s.kits||[]).forEach(function(k){ if(k.retEm){ get(isoDia(new Date(k.retEm))).enviados++; } });
  (s.acertosConsignado||[]).forEach(function(r){ var rc = r.recebimento; if(r.origem==="interno" || !rc) return;
    if(rc.ok && rc.em) get(String(rc.em).slice(0,10)).chegaram++;
    if(rc.bip){ var d = get(isoDia(new Date(rc.bip.ts))); d.bipados++; d.por[rc.bip.por] = (d.por[rc.bip.por]||0)+1; } });
  return Object.keys(dias).sort().reverse().map(function(k){ return dias[k]; });
}

// quantos kits esperam bipagem: os reais + os da SIMULAÇÃO (s.filaSimulada, só para testar o alerta; tirar quando a fila vier de verdade)
function qtdFila(s){ return filaRetornos(s).length + (s.filaSimulada||0); }

// chamado depois de qualquer mudança que mexe na fila: sobe o alerta do degrau novo (uma vez por degrau no dia) e zera o degrau quando a fila baixa de 20
function aplicaFila(ns){
  var qtd = qtdFila(ns), nv = nivelDe(qtd), antes = ns.filaNivel===undefined ? -1 : ns.filaNivel;
  if(nv<0) return antes===-1 ? ns : Object.assign({}, ns, {filaNivel:-1});
  if(nv<=antes) return nv<antes ? Object.assign({}, ns, {filaNivel:nv}) : ns;
  var agora = Date.now(), chave = "fila_retorno_"+NIVEIS[nv]+"_"+isoDia(new Date(agora));
  var alerta = {id:"AL"+agora, tipo:"fila_retorno", chave:chave, ref:null, titulo:"Fila de retornos: "+qtd+" kits para bipar", ts:agora, lidoPor:[], para:destinosDe(ns, "fila_retorno"), nivel:nv, cor:COR_NIVEL[nv],
    texto:"Passou de "+NIVEIS[nv]+" kits esperando bipagem. Acione cadastro, Deysiane e encomendas para ajudar a bipar."};
  if((ns.alertas||[]).some(function(x){ return x.chave===chave; })) return Object.assign({}, ns, {filaNivel:nv});
  return Object.assign({}, ns, {filaNivel:nv, alertas:[alerta].concat(ns.alertas||[])});   // "para" é preenchido pelo reducer (destinosDe)
}

export { NIVEIS, COR_NIVEL, nivelDe, corDaFila, filaRetornos, qtdFila, quemBipa, podeBiparRetorno, porDia, aplicaFila };
