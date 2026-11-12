// Sorelly Admin · montagem — domain/avaliacoes-kits.js
// NOTA DO KIT POR MONTADORA (12/11/2026, Marcus escolheu a opção A de docs/design/testes-de-layout/avaliacoes-kits-4-opcoes.local.html).
// UMA fonte só para a nota que a REVENDEDORA dá ao kit no aplicativo: a aba Cadastro de revendedoras › Avaliações › Kits mostra, e o Bônus da montagem
// (domain/bonus-montagem.js) lê daqui para cortar o bônus. Estado s.avk, módulo "avk" no servidor (Cadastro, RH, Financeiro e Diretoria).
// De onde vem: o app manda as avaliações para o ADMIN ANTIGO (tabelas avaliacao*). O sistema novo ainda não recebe. Por isso o que está aqui é uma LEITURA
// do admin antigo, já resumida por mês do kit e por montadora, guardada em domain/avaliacoes-kits.local.js (fora do Git: tem nome de revendedora).
// Regra da leitura: cada avaliação liga ao último kit montado para aquela revendedora antes da avaliação (até 75 dias); vale UMA avaliação por kit, a primeira.
// Formato: {v, lidoEm, fonte, geral:{desde, total, semMontadora, repetidas}, meses:{"2026-10":{porMontadora:[{nome, aval, certo, capricho, combinou, nota, n5, b35, b25}],
//           baixas:[{dia, montado, rev, rep, mont, certo, capricho, combinou, nota}]}}}. Arquivo PURO (sem import): o teste scripts/testar-bonus-montagem.mjs usa.

function avkVazio(){ return {v:1, lidoEm:"", fonte:"", geral:null, meses:{}}; }
// Entra a leitura deste computador quando ela é MAIS NOVA que a que está no estado (lidoEm). Não reorganiza o que veio do servidor (senão regrava sem parar).
function avkSemear(avk, local){
  var o = avk && typeof avk==="object" && avk.meses ? avk : Object.assign(avkVazio(), avk && typeof avk==="object" ? avk : {});
  if(!local || !local.lidoEm || !(String(local.lidoEm) > String(o.lidoEm || ""))) return o;
  return Object.assign({}, o, {v:1, lidoEm:local.lidoEm, fonte:local.fonte || "", geral:local.geral || null, meses:Object.assign({}, o.meses, local.meses || {})});
}
function avkMes(avk, mes){ return (avk && avk.meses && avk.meses[mes]) || null; }
function avkMeses(avk){ return Object.keys((avk && avk.meses) || {}).sort().reverse(); }
// para o bônus: {montadora: {q: avaliações, nota: média de 1 a 5}} só de quem tem avaliação no mês
function notasDoMes(avk, mes){
  var m = avkMes(avk, mes), o = {};
  if(m) (m.porMontadora || []).forEach(function(x){ if(x && x.aval>0 && isFinite(Number(x.nota))) o[x.nome] = {q:x.aval, nota:Number(x.nota)}; });
  return o;
}
// total do mês: soma das contagens e média de cada pergunta pesada pela quantidade de avaliações
function totalDoMes(lista){
  var t = {aval:0, n5:0, b35:0, b25:0, certo:null, capricho:null, combinou:null, nota:null}, s = {certo:0, capricho:0, combinou:0, nota:0};
  (lista || []).forEach(function(x){ if(!x || !x.aval) return; t.aval += x.aval; t.n5 += x.n5||0; t.b35 += x.b35||0; t.b25 += x.b25||0; Object.keys(s).forEach(function(k){ s[k] += Number(x[k]||0)*x.aval; }); });
  if(t.aval) Object.keys(s).forEach(function(k){ t[k] = Math.round(s[k]/t.aval*100)/100; });
  return t;
}

export { avkVazio, avkSemear, avkMes, avkMeses, notasDoMes, totalDoMes };
