// Sorelly Admin · kits novos Curitiba — domain/viagens-rep.js
// Viagens das representantes a Ponta Grossa e a Joinville (novembro e dezembro de 2026, passadas pelo Marcus em 24/10/2026). "retira" = quando os kits são retirados na empresa antes de viajar.
// Quem viaja não vem do cadastro da viagem: sai do mapa de regiões (quem atende Ponta Grossa ou Joinville). Dias a confirmar com as representantes.
var iso = function(d, m){ return "2026-"+String(m).padStart(2, "0")+"-"+String(d).padStart(2, "0"); };

var VIAGENS = [
  {id:"pg-nov-1", destino:"Ponta Grossa", n:"1ª viagem", dias:[iso(10, 11), iso(11, 11), iso(12, 11)], retira:iso(9, 11), hora:"18:00"},
  {id:"jv-nov-1", destino:"Joinville", n:"Viagem", dias:[iso(14, 11), iso(15, 11)], retira:iso(13, 11), hora:"18:00"},
  {id:"pg-nov-2", destino:"Ponta Grossa", n:"2ª viagem", dias:[iso(24, 11), iso(25, 11)], retira:iso(23, 11), hora:"18:00"},
  {id:"pg-dez-1", destino:"Ponta Grossa", n:"1ª viagem", dias:[iso(12, 12), iso(13, 12), iso(14, 12)], retira:iso(11, 12), hora:"18:00"},
  {id:"jv-dez-1", destino:"Joinville", n:"Viagem", dias:[iso(15, 12), iso(16, 12)], retira:iso(14, 12), hora:"18:00"},
  {id:"pg-dez-2", destino:"Ponta Grossa", n:"2ª viagem", dias:[iso(27, 12), iso(28, 12)], retira:iso(26, 12), hora:"12:00"}];

var MESES_NOME = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
var SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
var partes = function(k){ var p = k.split("-"); return {a:+p[0], m:+p[1], d:+p[2]}; };
var diaSem = function(k){ return SEMANA[new Date(k+"T12:00:00").getDay()]; };
var dd = function(k){ var p = partes(k); return String(p.d).padStart(2, "0")+"/"+String(p.m).padStart(2, "0"); };
// "10, 11 e 12/11"
var diasTexto = function(v){ var ds = v.dias.map(function(k){ return String(partes(k).d).padStart(2, "0"); }), m = String(partes(v.dias[0]).m).padStart(2, "0"); return (ds.length>1 ? ds.slice(0, -1).join(", ")+" e "+ds[ds.length-1] : ds[0])+"/"+m; };
var mesDe = function(v){ var m = MESES_NOME[partes(v.dias[0]).m-1]; return m.charAt(0).toUpperCase()+m.slice(1); };
// dias até a primeira data da viagem (negativo = já passou); a viagem só "passou" depois do último dia
var faltam = function(v, hoje){ var a = new Date(v.dias[0]+"T12:00:00").getTime(), h = new Date(hoje+"T12:00:00").getTime(); return Math.round((a-h)/86400000); };
var passou = function(v, hoje){ return v.dias[v.dias.length-1] < hoje; };

export { VIAGENS, diaSem, dd, diasTexto, mesDe, faltam, passou };
