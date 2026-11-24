// Sorelly Admin — domain/conferencia-pecas.js
// Conferência das peças do kit com a representante, no kit novo e no acerto + kit: a revendedora pode ter de 1 a 4 condicionais.
// 05/11/2026 (Marcus): SEM DADO FALSO. As condicionais vêm da DevMaster (rota /api/representante/condicionais, tabelas dmafi e dmafj) e ficam no kit em `condsReais`
// (ação KIT_CONDS_REAIS). Sem elas, a lista fica vazia e a tela avisa. O que faltar, ou uma peça que não é do kit, vira erro de quem bipou o kit na empresa.
// Formato de cada condicional: {numero, emissao, previsao, vendedor, pecas, valor, grupos:[{cod, nome, itens:[{codigo, desc, valor, qtd}]}]}

function condicionaisDoKit(k){ return (k && k.condsReais) || []; }

function itensDe(c){ var r = []; (c.grupos||[]).forEach(function(g){ g.itens.forEach(function(i){ r.push(Object.assign({cond:c.numero, grupo:g.nome, grupoCod:g.cod}, i)); }); }); return r; }
function totaisDe(c){ var it = itensDe(c); return {modelos:it.length, pecas:it.reduce(function(t,i){ return t+i.qtd; },0), valor:it.reduce(function(t,i){ return t+i.valor*i.qtd; },0)}; }
function totaisKit(conds){ var t = {condicionais:conds.length, modelos:0, pecas:0, valor:0}; conds.forEach(function(c){ var x = totaisDe(c); t.modelos += x.modelos; t.pecas += x.pecas; t.valor += x.valor; }); return t; }

// Uma leitura: o código tem de estar numa das condicionais do kit e ainda faltar unidade dele. Devolve o novo estado da conferência.
// A leitura pode ser o CÓDIGO escrito na etiqueta (CL2542, digitado) ou o NÚMERO DE BARRAS que a câmera lê (00032358, campo aaa_codbarras da DevMaster, vem em item.barras).
// O número de barras vale com ou sem zeros na frente. Só vale se for número com 4 dígitos ou mais, para um código curto nunca bater por engano com um número de barras.
function semZeros(x){ return String(x||"").replace(/^0+/, ""); }
function bate(i, cod){
  if(String(i.codigo||"").toUpperCase()===cod) return true;
  return !!i.barras && /^\d{4,}$/.test(cod) && semZeros(i.barras)!=="" && semZeros(i.barras)===semZeros(cod);
}
function bipar(conds, conf, codigo){
  var cod = String(codigo||"").trim().toUpperCase().replace(/\s+/g,""); if(!cod) return conf;
  var lidos = Object.assign({}, conf.lidos), erros = (conf.erros||[]).slice(), achou = null;
  conds.some(function(c){ return itensDe(c).some(function(i){ if(bate(i, cod) && (lidos[c.numero+"|"+i.codigo]||0) < i.qtd){ achou = i; return true; } return false; }); });
  if(achou){ lidos[achou.cond+"|"+achou.codigo] = (lidos[achou.cond+"|"+achou.codigo]||0)+1; return Object.assign({}, conf, {lidos:lidos, ultimo:{tipo:"ok", codigo:achou.codigo, desc:achou.desc, em:Date.now()}}); }
  var existe = null; conds.some(function(c){ return itensDe(c).some(function(i){ if(bate(i, cod)){ existe = i; return true; } return false; }); });
  if(existe) return Object.assign({}, conf, {ultimo:{tipo:"repetida", codigo:existe.codigo, desc:existe.desc, em:Date.now()}});   // já conferida: não conta de novo
  erros.push({codigo:cod, em:Date.now()});
  return Object.assign({}, conf, {erros:erros, ultimo:{tipo:"fora", codigo:cod, em:Date.now()}});
}
// Resultado ao finalizar: o que faltou e o que veio a mais (peça que não é do kit)
function resultado(conds, conf){
  var faltas = [], esperadas = 0, lidas = 0;
  conds.forEach(function(c){ itensDe(c).forEach(function(i){ var l = Math.min(i.qtd, (conf.lidos||{})[c.numero+"|"+i.codigo]||0); esperadas += i.qtd; lidas += l;
    if(l<i.qtd) faltas.push({cond:c.numero, codigo:i.codigo, desc:i.desc, qtd:i.qtd-l}); }); });
  var sobras = {}; (conf.erros||[]).forEach(function(x){ sobras[x.codigo] = (sobras[x.codigo]||0)+1; });
  var sobrasL = Object.keys(sobras).map(function(c){ return {codigo:c, qtd:sobras[c]}; });
  var nFaltas = faltas.reduce(function(t,f){ return t+f.qtd; },0), nSobras = sobrasL.reduce(function(t,x){ return t+x.qtd; },0);
  return {esperadas:esperadas, lidas:lidas, faltas:faltas, nFaltas:nFaltas, sobras:sobrasL, nSobras:nSobras, erros:nFaltas, conds:conds.map(function(c){ return c.numero; })};
}

// Descrição da peça para MOSTRAR (Marcus, 24/11/2026): "Colar folheado ouro 18k", nunca "COLAR FOLHEADO OURO 18K". A DevMaster guarda em caixa alta; a primeira letra fica maiúscula e o resto minúsculo.
function descBonita(t){ var s = String(t||"").toLowerCase().replace(/\s+/g, " ").trim(); return s ? s.charAt(0).toUpperCase()+s.slice(1) : s; }

export { condicionaisDoKit, itensDe, totaisDe, totaisKit, bipar, resultado, descBonita };
