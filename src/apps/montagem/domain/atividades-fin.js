// Sorelly Admin · montagem — domain/atividades-fin.js
// Financeiro › Atividades (18/11/2026): contas da tela, sem React (testáveis). Quem abre a tela, dias úteis desde a última vez, situação de cada atividade e o que foi feito no próprio Sorelly Admin (lido do estado).
import { nomeDe } from "@/apps/montagem/domain/equipe";

var PESSOAS_ATIVIDADES_FIN = [16];   // Marcus (a mesma lista vale no servidor: src/server/atividades-fin.js)
var r2 = function(n){ return Math.round((Number(n) || 0)*100)/100; };
var z2 = function(n){ return (n<10 ? "0" : "")+n; };
var isoDe = function(d){ return d.getFullYear()+"-"+z2(d.getMonth()+1)+"-"+z2(d.getDate()); };
var hojeIso = function(){ return isoDe(new Date()); };
var diaBr = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7)+"/"+iso.slice(2, 4) : "—"; };
var horaDe = function(ts){ var d = new Date(ts); return isNaN(d) ? "" : z2(d.getHours())+":"+z2(d.getMinutes()); };
// dias úteis (segunda a sexta) entre a última vez e hoje: 0 = hoje, 1 = último dia útil
function diasUteisDesde(iso, hoje){
  if(!iso) return null; var n = 0, d = new Date(iso+"T12:00:00"), fim = new Date(hoje+"T12:00:00");
  while(d<fim){ d.setDate(d.getDate()+1); var w = d.getDay(); if(w!==0 && w!==6) n++; }
  return n;
}
function situacaoDe(ultimo, hoje, informativo){
  if(informativo) return "—";
  var n = diasUteisDesde(ultimo, hoje);
  if(n===null) return "Sem registro no período";
  return n<=1 ? "Em dia" : "Parada há "+n+" dias úteis";
}
var corSituacao = function(l){ return /^Parada|^Sem registro/.test(l.sit) ? "text-warning" : l.sit==="Em dia" ? "text-success" : ""; };

// o que foi feito no próprio Sorelly Admin (lido do estado), no mesmo formato das linhas do servidor: {dia, pessoa, tipo, n, valor, de, ate, sistema}
function linhasDoAdmin(s, de){
  var grupos = {}, poe = function(dia, pessoa, tipo, valor, hora){
    if(!dia || dia<de) return; var k = dia+"|"+pessoa+"|"+tipo, g = grupos[k] || (grupos[k] = {dia:dia, pessoa:pessoa || "—", tipo:tipo, n:0, valor:0, de:hora, ate:hora, sistema:"Sorelly Admin"});
    g.n++; g.valor = r2(g.valor+(Number(valor) || 0)); if(hora && (!g.de || hora<g.de)) g.de = hora; if(hora && hora>g.ate) g.ate = hora; };
  ((s.dp && s.dp.pix) || []).forEach(function(x){ if(x.status!=="direcionado" || !x.confirmadoEm || x.demo) return; poe(isoDe(new Date(x.confirmadoEm)), String(x.confirmadoPor || "—"), "Pix direcionado", x.valor, horaDe(x.confirmadoEm)); });
  ((s.cpe && s.cpe.hist) || []).forEach(function(h){ if(!h.ts) return; poe(isoDe(new Date(h.ts)), nomeDe(h.por) || "—", "Contas a pagar: "+String(h.acao || "ação").toLowerCase(), h.valor, horaDe(h.ts)); });
  ((s.ff && s.ff.hist) || []).forEach(function(h){ if(!h.em) return; poe(isoDe(new Date(h.em)), (typeof h.por==="string" && h.por && isNaN(Number(h.por)) ? h.por : nomeDe(h.por)) || "—", "Financeiro familiar: "+String(h.area || "ação").toLowerCase(), 0, horaDe(h.em)); });
  return Object.keys(grupos).map(function(k){ return grupos[k]; });
}
// dias em que os saldos das contas foram lançados (Contas bancárias): dia com pelo menos um saldo preenchido
function diasComSaldo(s){
  var sd = (s.saldosContas && s.saldosContas.saldos) || {};
  return Object.keys(sd).filter(function(d){ var v = sd[d] || {}; return Object.keys(v).some(function(c){ return v[c]!==null && v[c]!==undefined && v[c]!==""; }); }).sort();
}

export { PESSOAS_ATIVIDADES_FIN, r2, isoDe, hojeIso, diaBr, horaDe, diasUteisDesde, situacaoDe, corSituacao, linhasDoAdmin, diasComSaldo };
