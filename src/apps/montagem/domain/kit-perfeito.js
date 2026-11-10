// Sorelly Admin · montagem — domain/kit-perfeito.js
// KIT PERFEITO (regra EM TESTE, 09/11/2026, ainda não aprovada pelo Marcus; resumo em docs/negocio/KIT-PERFEITO.md):
// o valor do kit e a quantidade total de cada linha vêm da tabela do Configurador (pecasPara). O que muda é a MISTURA:
// cada categoria sobe ou desce conforme a fatia que a revendedora vende dela (últimos 90 dias) contra a fatia da tabela.
// Fator = fatia vendida ÷ fatia da tabela, preso entre 0,5 e 1,5; depois o total volta ao da tabela. Mínimo 2 peças de cada categoria que ela vende.
var FATOR_MIN = 0.5, FATOR_MAX = 1.5, MINIMO = 2;

// pecas = retorno de pecasPara ({itens:[{nome,q}]}); mix = {"Colares ouro":12, ...} (peças vendidas em 90 dias por categoria)
// Devolve [{nome, q (tabela), sug (sugerido), vend (vendidas em 90 dias)}] ou null quando não há venda registrada.
function kitSugerido(pecas, mix){
  if(!pecas || !pecas.itens || !mix) return null;
  var fixo = function(x){ return x.nome==="Flanela"; };
  var itens = pecas.itens.filter(function(x){ return !fixo(x); });
  var totTab = itens.reduce(function(t, x){ return t + x.q; }, 0);
  var totVend = itens.reduce(function(t, x){ return t + (mix[x.nome] || 0); }, 0);
  if(!totTab || !totVend) return null;
  var cru = itens.map(function(x){
    var f = ((mix[x.nome] || 0) / totVend) / (x.q / totTab);
    f = Math.max(FATOR_MIN, Math.min(FATOR_MAX, f));
    return x.q * f;
  });
  var soma = cru.reduce(function(t, v){ return t + v; }, 0), esc = totTab / soma;
  var sug = cru.map(function(v, i){
    var n = Math.round(v * esc), vende = (mix[itens[i].nome] || 0) > 0;
    return vende ? Math.max(n, Math.min(MINIMO, Math.ceil(itens[i].q * 1.5))) : n;
  });
  var dif = totTab - sug.reduce(function(t, v){ return t + v; }, 0), guarda = 0;   // acerta o total mexendo na maior linha (ou na menor, se sobrou)
  while(dif !== 0 && guarda++ < 200){
    var passo = dif > 0 ? 1 : -1, alvo = -1;
    sug.forEach(function(v, i){ if(passo < 0 && v <= 1) return; if(alvo < 0 || (passo > 0 ? v > sug[alvo] : v > sug[alvo])) alvo = i; });
    if(alvo < 0) break; sug[alvo] += passo; dif -= passo;
  }
  var linhas = itens.map(function(x, i){ return {nome:x.nome, q:x.q, sug:sug[i], vend:mix[x.nome] || 0}; });
  pecas.itens.filter(fixo).forEach(function(x){ linhas.push({nome:x.nome, q:x.q, sug:x.q, vend:0}); });
  return linhas;
}

export { kitSugerido };
