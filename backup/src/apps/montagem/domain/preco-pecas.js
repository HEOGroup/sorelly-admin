// Sorelly Admin · montagem — domain/preco-pecas.js
// Preço das peças (cadastro de peças pelo chat). A revendedora fica com cerca de 45% do preço de venda; o markup é calculado sobre o que sobra
// para a Sorelly (55%). Conferido com o exemplo do Marcus: custo R$ 24,55 · preço R$ 168,00 → 276% (ele usa 275%).
// Valores provisórios: mover para o Configurador geral quando o Marcus pedir.
var COMISSAO_REVENDEDORA = 0.45;     // parte do preço de venda que fica com a revendedora
var MARKUP_ALVO = 2.75;              // 275%
var TAGS_PECA = ["Sem tag", "Collection", "Promo (adesivo)"];

/** Markup em fração (2.76 = 276%) sobre a parte da Sorelly. */
function markup(preco, custo){ return custo>0 ? (preco*(1-COMISSAO_REVENDEDORA))/custo - 1 : 0; }
/** Preço sugerido para bater o markup alvo, arredondado para cima em reais inteiros. */
function precoSugerido(custo, alvo){ return Math.ceil((custo*(1+(alvo==null ? MARKUP_ALVO : alvo)))/(1-COMISSAO_REVENDEDORA)); }
function BRL(n){ return "R$ "+Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}); }
function pct(f){ return Math.round(f*100)+"%"; }
/** "168,50" ou "1.168" -> número */
function lerReais(t){ var s = String(t||"").replace(/[^\d,.]/g,""); if(s.indexOf(",")>=0) s = s.replace(/\./g,"").replace(",","."); else if(/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g,""); var n = parseFloat(s); return isNaN(n) ? 0 : n; }
export { COMISSAO_REVENDEDORA, MARKUP_ALVO, TAGS_PECA, markup, precoSugerido, BRL, pct, lerReais };
