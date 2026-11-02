// Sorelly Admin · montagem — state/fd-patches.js
// NÚMEROS FIXOS DO FATURAMENTO (Marcus, 01/11/2026). O módulo "fd" (faturamento e contas pagas por dia) é sincronizado com o servidor, e uma cópia ANTIGA do servidor desfazia o que foi fixado no código
// (setembro e o fechamento de outubro nunca chegavam lá). Por isso estes valores são aplicados POR VALOR, sem flag: se o dado do servidor está diferente, volta para o valor fixo; se já está igual, nada muda.
// Só meses FECHADOS e a abertura de novembro entram aqui. Valores do Marcus: setembro 1.809 acertos e R$ 1.446.262,20; outubro, relatório sem funcionários (29/10 1.731 · 30/10 1.835 · 31/10 1.843).
var FAT = {
  "2026-09-30":{recebido:1446262.20, acertos:1809, revendedoras:2023},
  "2026-10-29":{recebido:1363799.00, acertos:1731, revendedoras:2047},
  "2026-10-30":{recebido:1430877.71, acertos:1835, revendedoras:2047},
  "2026-10-31":{recebido:1438133.61, acertos:1843, revendedoras:2047}};
// dia = diferença para o dia anterior (faturado e acertos que aparecem na tabela Dia a dia)
var DIA = {"2026-10-29":{faturado:67597.40, acertos:79}, "2026-10-30":{faturado:67078.71, acertos:104}, "2026-10-31":{faturado:7255.90, acertos:8}};
var igual = function(a, b){ return a && Math.abs((a.recebido||0)-b.recebido)<0.005 && (a.acertos||0)===b.acertos; };
function aplicaFdFixos(s){
  var fdAtual = s.faturamentoDiario || {}, cpd = s.contasPagasDiario || {}, fm = s.fechaMes || {}, mm = s.metaMensal || {}, mudou = false;
  var fd = Object.assign({}, fdAtual), cp = Object.assign({}, cpd), fmn = Object.assign({}, fm), mmn = JSON.parse(JSON.stringify(mm));
  Object.keys(FAT).forEach(function(k){ if(!igual(fd[k], FAT[k])){ fd[k] = Object.assign({}, fd[k], FAT[k], {fixadoEm:Date.now(), parcial:false}); mudou = true; } });
  Object.keys(DIA).forEach(function(k){ var c = cp[k]; if(!c || Math.abs((c.faturado||0)-DIA[k].faturado)>0.005 || (c.acertos||0)!==DIA[k].acertos){ cp[k] = Object.assign({cnpjs:{}, contasPorFora:0}, c, DIA[k]); mudou = true; } });
  var o = fmn["2026-10"]; if(!o || o.fechado!==true || o.aRealizar!==0 || o.carregar!==0){ fmn["2026-10"] = {aRealizar:0, carregar:0, fechado:true}; mudou = true; }
  mmn["2026"] = mmn["2026"] || {};
  var n = mmn["2026"][10] || {}; if(n.base!==2047 || n.previstos!==1975){ mmn["2026"][10] = Object.assign({}, n, {base:2047, previstos:1975, inicio:1975}); mudou = true; }
  var ot = mmn["2026"][9] || {}; if(ot.previstos!==1886){ mmn["2026"][9] = Object.assign({}, ot, {base:ot.base || 2023, previstos:1886, inicio:ot.inicio || 1976}); mudou = true; }
  if(!mudou) return s;
  return Object.assign(s, {faturamentoDiario:fd, contasPagasDiario:cp, fechaMes:fmn, metaMensal:mmn});
}
export { aplicaFdFixos };
