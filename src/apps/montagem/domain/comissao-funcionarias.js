// Sorelly Admin · montagem — domain/comissao-funcionarias.js
// COMISSÃO DAS FUNCIONÁRIAS (Marcus, 11/11/2026): funcionária que faz o acerto dela na Sorelly (só dentro da empresa, Atendimento Sorelly) ganha uma tabela de comissão própria enquanto trabalha aqui.
// Quem é funcionária vem do RH (ativa) cruzado com o cadastro de cliente da DevMaster pelo CPF (src/server/funcionarias.js); saiu da Sorelly (RH desligou), volta para a comissão normal sozinha.
// Vale a tabela cuja data de início ("desde") é a mais recente que já começou, pela DATA DO ACERTO. Faixa = "a partir de R$ X, Y% de comissão"; abaixo da primeira faixa vale a tabela normal.
// Só a COMISSÃO muda: brinde, taxa, multas e Kit Prata seguem a tabela normal (mesma regra da comissão especial da Edna). Números aqui são o padrão; a Diretoria edita em Tecnologia → Configurador geral → Comissão das funcionárias (s.comissaoFunc, sincronizado).
var TABELAS_PADRAO = [
  {id:"atual", nome:"Cartaz atual (acertos até 30/11/2026)", desde:"2000-01-01", faixas:[{de:300, pct:35}, {de:500, pct:45}, {de:1000, pct:50}]},
  {id:"nova", nome:"Nova tabela (acertos a partir de 01/12/2026)", desde:"2026-12-01", faixas:[{de:500, pct:35}, {de:1000, pct:45}, {de:2000, pct:50}]}
];
var hojeLocal = function(){ return new Date(Date.now()-3*3600e3).toISOString().slice(0, 10); };   // fuso de Brasília

function tabelasFunc(s){
  var t = s && s.comissaoFunc && Array.isArray(s.comissaoFunc.tabelas) ? s.comissaoFunc.tabelas.filter(function(x){ return x && /^\d{4}-\d{2}-\d{2}$/.test(String(x.desde||"")) && Array.isArray(x.faixas) && x.faixas.length; }) : [];
  return t.length ? t : TABELAS_PADRAO;
}
// a tabela que vale para um dia: a de "desde" mais recente que já começou (se nenhuma começou, a mais antiga)
function tabelaFuncDoDia(s, iso){
  var dia = iso || hojeLocal(), ts = tabelasFunc(s).slice().sort(function(a, b){ return a.desde < b.desde ? -1 : a.desde > b.desde ? 1 : 0; }), vale = ts[0];
  ts.forEach(function(t){ if(t.desde<=dia) vale = t; });
  return {nome:vale.nome || "", desde:vale.desde, faixas:vale.faixas.map(function(f){ return {de:Number(f.de), pct:Number(f.pct)}; }).filter(function(f){ return isFinite(f.de) && f.de>0 && isFinite(f.pct) && f.pct>=0 && f.pct<=100; }).sort(function(a, b){ return a.de-b.de; })};
}
// valida as tabelas que a Diretoria digitou; devolve texto de erro ou ""
function validarTabelasFunc(tabelas){
  if(!Array.isArray(tabelas) || !tabelas.length) return "Deixe pelo menos uma tabela.";
  for(var i = 0; i<tabelas.length; i++){
    var t = tabelas[i], n = (t.nome || "Tabela "+(i+1));
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(t.desde||""))) return n+": informe a data em que a tabela começa a valer.";
    if(!Array.isArray(t.faixas) || !t.faixas.length) return n+": coloque pelo menos uma faixa.";
    for(var j = 0; j<t.faixas.length; j++){ var f = t.faixas[j];
      if(!(Number(f.de)>0)) return n+": a faixa "+(j+1)+" precisa de um valor inicial maior que zero.";
      if(!(Number(f.pct)>=0 && Number(f.pct)<=100)) return n+": a comissão da faixa "+(j+1)+" precisa estar entre 0 e 100."; }
    var ds = t.faixas.map(function(f){ return Number(f.de); }); if(new Set(ds).size!==ds.length) return n+": há duas faixas com o mesmo valor inicial.";
  }
  var datas = tabelas.map(function(t){ return t.desde; }); if(new Set(datas).size!==datas.length) return "Duas tabelas começam no mesmo dia.";
  return "";
}
export { TABELAS_PADRAO, tabelasFunc, tabelaFuncDoDia, validarTabelasFunc };
