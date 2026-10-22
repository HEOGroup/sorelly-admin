// Sorelly Admin · kits novos Curitiba — lib/datas.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.

var DIA = 86400000;
function hojeISO(){ var d = new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function tsDe(iso){ return iso ? new Date(iso+"T12:00:00").getTime() : null; }
function dataBR(iso){ if(!iso) return "\u2014"; var p = iso.split("-"); return p[2]+"/"+p[1]+"/"+p[0]; }
function diasEntre(a, b){ return (a && b) ? Math.round((tsDe(b)-tsDe(a))/DIA) : null; }
function diasDesde(iso){ return iso ? Math.max(0, Math.round((tsDe(hojeISO())-tsDe(iso))/DIA)) : 0; }
var MESES = ["Janeiro","Fevereiro","Mar\u00e7o","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export { DIA, hojeISO, tsDe, dataBR, diasEntre, diasDesde, MESES };
