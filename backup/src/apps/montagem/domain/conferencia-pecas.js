// Sorelly Admin — domain/conferencia-pecas.js
// Conferência das peças do kit com a CÂMERA (app da representante), no kit novo e no acerto + kit: a revendedora pode ter de 1 a 4 condicionais;
// a representante bipa cada peça só para CONFERIR. O que faltar, ou uma peça que não é do kit, vira erro de quem bipou o kit na empresa
// (sobe no Consolidado, na Listagem e desconta da bipadora). Modelo da condicional = o impresso do DevMaster (grupos, código, valor, quantidade).
// DEMONSTRAÇÃO: a condicional 00558 da Maria Eduarda é a real que o Marcus mandou (89 modelos; 3 com 2 unidades = 92 peças); as outras são aleatórias.

var G = function(cod, nome, itens){ return {cod:cod, nome:nome, itens:itens.map(function(a){ return {codigo:a[0], valor:a[1], desc:a[2], qtd:a[3]||1}; })}; };

var COND_00558 = {numero:"00558", emissao:"08/10/2026", previsao:"08/11/2026", cliente:"MARIA EDUARDA DE ALMEIDA", consultora:"ANNE ASLEY DE SOUZA CURSPIM",
  bipagem:"STHEFANY MARQUES DE AQUINO CORREA", montagem:"JENIFER MARIA LINHARES MARTINS", grupos:[
  G("01","Anéis",[["A117019",122,"ANEL FOLHEADO OURO 18K ONDAS CRAVEJADAS 19"],["A149018",88,"ANEL BANHADO OURO 18K PONTO DE LUZ ESMERALDA COM DETALHES EM MICRO ZIRCÔNIAS 18"],
    ["A1547017",138,"ANEL BANHADO OURO 18K TRANÇADO CRAVEJADO COM MICRO ZIRCÔNIA 17"],["A353018",132,"ANEL BANHADO OURO 18K PÉROLA FILET QUADRADA 16"],["A172016",68,"ANEL FOLHEADO PRATA TREVO CRAVEJADO 16"],
    ["A1841015",88,"ANEL FOLHEADO OURO 18K INFINITOS ENTRELAÇADOS LISOS 15"],["A1591017",78,"ANEL FOLHEADO OURO 18K SOLITÁRIO PONTO DE LUZ VERDE ESMERALDA 17"],
    ["A2071018",68,"ANEL FOLHEADO PRATA LINHAS LISAS E CRAVEJADOS VAZADOS 18"],["A2131018",122,"ANEL FOLHEADO OURO 18K CORAÇÃO CRISTAL MINE GOTAS 18"],["A223020",68,"ANEL FOLHEADO OURO 18K JESUS E DETALHE CRUZ VAZADA 20"]]),
  G("02","Brincos",[["B3103",88,"BRINCO FOLHEADO OURO 18K GEOMÉTRICO VAZADO CRAVEJADO"],["B3439",68,"BRINCO BANHADO OURO 18K FOLHA VAZADA DETALHADA"],["B3518",88,"BRINCO BANHADO OURO 18K TREVO VERDE"],
    ["B3926",138,"BRINCO ARGOLA FOLHEADO PRATA RETANGULAR MÉDIA CRAVEJADA"],["B3974",96,"BRINCO FOLHEADO OURO 18K HASTE CURVADO CRAVEJADO"],["B4324",88,"BRINCO FOLHEADO OURO 18K NAVETES CRISTAIS PINGENTE CÍRCULO LISO"],
    ["B4335",128,"BRINCO FOLHEADO OURO 18K HASTE CURVADA CRAVEJADA"],["B4341",168,"BRINCO FOLHEADO OURO 18K RETÂNGULO ARREDONDADO VAZADO CRAVEJADO"],["B4498",96,"BRINCO FOLHEADO OURO 18K HASTE DUPLO OVAL ORGÂNICO COM LINHA CRAVEJADA"],
    ["B4578",144,"BRINCO FOLHEADO PRATA CÍRCULO GRANDE CRAVEJADO"],["B4710",68,"BRINCO FOLHEADO OURO 18K TREVO PRETO"],["B4969",88,"BRINCO FOLHEADO OURO 18K REDONDO GRANDE PEDRA LEITOSA BRANCA"],
    ["B4936",96,"BRINCO FOLHEADO OURO 18K GOTA PONTOS DE LUZ CRISTAIS"],["B4862",68,"BRINCO FOLHEADO PRATA ORGÂNICO OVAL ONDULADO VAZADO"],["B4878",68,"BRINCO FOLHEADO OURO 18K TREVO CRAVEJADO"],
    ["B5016",88,"BRINCO FOLHEADO OURO 18K FLOR CRAVEJADA MICRO ZIRCÔNIA"],["B5130",88,"BRINCO FOLHEADO OURO 18K GOTA ORGÂNICA GRANDE"],["B5131",88,"BRINCO ARGOLA FOLHEADO OURO 18K TRIPLA FILEIRA CRAVEJADA"],
    ["B5132",96,"BRINCO ARGOLA FOLHEADO OURO 18K GRANDE CRAVEJADO"],["B5133",96,"BRINCO ARGOLA FOLHEADO PRATA CRAVEJADO FILEIRAS NAS LATERAIS"]]),
  G("04","Colares",[["CL1343",112,"COLAR FOLHEADO OURO 18K PINGENTE MÃO DE FÁTIMA CRAVEJADO COM PONTO DE LUZ GRANDE"],["CL1552",144,"COLAR FOLHEADO OURO 18K CORAÇÃO CRAVEJADO VAZADO NOSSA SENHORA CRAVEJADA LUXO"],
    ["CL1589",112,"COLAR FOLHEADO OURO 18K CRUZ CRAVEJADA VAZADA COM MICRO ZIRCÔNIA"],["CL1793",88,"COLAR BANHADO OURO 18K LETRA CRAVEJADA",2],["CL1792",88,"COLAR BANHADO PRATA ÁRVORE DA VIDA CRAVEJADA COLORIDA"],
    ["CL1794",68,"COLAR BANHADO PRATA MENINA COM MICRO ZIRCÔNIA ROSA"],["CL1907",88,"COLAR BANHADO PRATA LISO DETALHADO MENINO CRAVEJADO"],["CL2260",68,"COLAR FOLHEADO PRATA GOTA ZIRCÔNIA LEITOSA ROSA CLARO"],
    ["CL2322",78,"COLAR FOLHEADO PRATA CORAÇÃO CRAVEJADO ESCRITA LOVE VAZADO"],["CL2347",56,"COLAR FOLHEADO PRATA TREVO PEQUENO DETALHADO"],["CL2372",88,"COLAR FOLHEADO PRATA LETRA \"A\" ARREDONDADA CRAVEJADA"],
    ["CL2454M",128,"COLAR FOLHEADO OURO 18K LETRA LISA TRANSVERSAL 40MM M"],["CL2657",88,"COLAR FOLHEADO PRATA LETRA ARREDONDADA CRAVEJADA \"T\""],["CL2687",78,"COLAR FOLHEADO PRATA PONTO DE LUZ GOTA CRISTAL"],
    ["CL2688",78,"COLAR FOLHEADO PRATA CORAÇÃO VAZADO E ESCRITA \"MÃE\""]]),
  G("06","Pulseiras",[["P1191",58,"PULSEIRA BANHADA PRATA LISA",2],["P1192",88,"PULSEIRA BANHADA PRATA GROSSA LISA"],["P1346",88,"PULSEIRA BANHADA PRATA"],["P1889",88,"PULSEIRA FOLHEADA PRATA RIVIERA CRISTAL"],
    ["P1682",68,"PULSEIRA FOLHEADA PRATA ELOS QUADRADOS COM ÍMÃ"],["P1903",68,"PULSEIRA FOLHEADA PRATA ELOS AMASSADOS PINGENTE RETANGULAR ZIRCÔNIA RUBI"],["P1927",78,"PULSEIRA FOLHEADA OURO 18K TRÊS PONTOS DE LUZ CRISTAIS"],
    ["P1932",68,"PULSEIRA FOLHEADA OURO 18K CORAÇÃO LISO"],["P1941",56,"PULSEIRA FOLHEADA PRATA PÉROLAS"],["P1970",112,"PULSEIRA FOLHEADA PRATA ELOS OVAIS PONTO DE LUZ CRISTAL GRANDE"],
    ["P1972",88,"PULSEIRA FOLHEADA PRATA RIVIERA CRISTAL OVAL"],["P2219",88,"PULSEIRA FOLHEADA OURO 18K CORAÇÕES ZIRCÔNIAS CRISTAIS"],["P2222",88,"PULSEIRA FOLHEADA PRATA CORAÇÃO BAIANO"],["P2223",68,"PULSEIRA FOLHEADA PRATA SETAS LISAS"]]),
  G("07","Tornozeleiras",[["T0291",52,"TORNOZELEIRA FOLHEADA PRATA CORAÇÕES ENTRELAÇADOS"],["T0293",44,"TORNOZELEIRA FOLHEADA PRATA FINA"]]),
  G("08","Suporte",[["MP062",12,"FLANELA PARA SEMIJOIAS"]]),
  G("11","Religiosos",[["ESC044",88,"ESCAPULÁRIO FOLHEADO PRATA MEDALHAS PEQUENAS JESUS E NOSSA SENHORA"]]),
  G("14","Material de uso geral",[["MU031",115,"MALETA SORELLY LUXO"]]),
  G("16","Sorelly Premium",[["SP0710",122,"BRINCO FOLHEADO OURO 18K HASTE LINHAS ONDULADAS"]]),
  G("19","Brincos Select",[["BS0134",22,"BRINCO FOLHEADO PRATA PONTO DE LUZ DIVERSOS"],["BS0143",122,"BRINCO FOLHEADO OURO 18K LOSANGO CRAVEJADO COM PONTO DE LUZ VERDE"],["BB0418",32,"BRINCO BANHADO PRATA RETANGULAR CRISTAL"],
    ["BB0469",28,"BRINCO BANHADO PRATA PÉROLA PEQUENA",2],["BB0497",28,"TRIO DE BRINCOS BANHADO PRATA PONTO DE LUZ ESMERALDA 3*4*5MM"],["BB0499",28,"TRIO DE BRINCOS BANHADO PRATA PÉROLA 4*5*6MM"],
    ["BB0602",68,"BRINCO BANHADO OURO 18K GOTA LISA"],["BB0645",44,"TRIO DE BRINCOS BANHADO OURO 18K PONTO DE LUZ GARNIJA VERDE"],["BB1132",20,"BRINCO ARGOLA BANHADO PRATA CLICK PINGENTE OLHO GREGO"],
    ["BB1218",38,"BRINCO FOLHEADO OURO 18K TRIÂNGULO LINHAS VAZADAS CENTRAL MICRO PONTOS DE LUZ"],["BB1333",56,"BRINCO FOLHEADO OURO 18K GOTA PEQUENA"],["BB1342",38,"TRIO DE BRINCOS FOLHEADO PRATA PONTO DE LUZ CORAÇÃO ROSA"],
    ["BB1344",38,"TRIO DE BRINCOS FOLHEADO PRATA PONTO DE LUZ QUADRADO RUBI"],["BB1414",38,"BRINCO FOLHEADO OURO 18K CÍRCULO DETALHADO ÁRVORE DA VIDA VAZADA"],["BB1421",38,"BRINCO ARGOLA FOLHEADO OURO 18K MEIA LUA PEQUENA FORMATO CORAÇÃO FILEIRA PONTOS DE LUZ"],
    ["BB1423",38,"BRINCO ARGOLA FOLHEADO OURO 18K MEIA LUA PEQUENA FORMATO CORAÇÃO FILEIRA PONTOS DE LUZ"]]),
  G("30","Brinco Duo",[["280060",28,"DUO DE BRINCOS BANHADO OURO 18K CARRÉ RUBI"],["280086",32,"DUO DE BRINCOS FOLHEADO PRATA PÉROLAS"],["280090",28,"DUO DE BRINCOS FOLHEADO PRATA ESTRELA ABS"]]),
  G("42","Anéis Select",[["BBA050018",78,"ANEL FOLHEADO PRATA SOLITÁRIO CRISTAL LINHAS VAZADAS 18"],["BBA061016",68,"ANEL FOLHEADO PRATA CHUVEIRINHO PEQUENO CRAVEJADO 16"],["BBA0063020",56,"ANEL FOLHEADO PRATA FLOR PONTOS DE LUZ CRISTAIS 20"]]),
  G("45","Bracelete",[["BTC0660",122,"BRACELETE FOLHEADO PRATA ONDULADO LISO"]]),
  G("BD","Collection",[["AA0021",96,"BRINCO FOLHEADO OURO 18K TREVO CRAVEJADO PRETO"]])]};

// catálogo pequeno para gerar as outras condicionais aleatórias (demonstração)
var CAT = [
  ["01","Anéis",[["A101010",68,"ANEL FOLHEADO OURO 18K LISO FINO 16"],["A102017",88,"ANEL FOLHEADO PRATA CORAÇÃO CRAVEJADO 17"],["A103018",96,"ANEL BANHADO OURO 18K FLOR PONTO DE LUZ 18"],["A104015",78,"ANEL FOLHEADO PRATA INFINITO 15"],["A105019",122,"ANEL FOLHEADO OURO 18K SOLITÁRIO CRISTAL 19"],["A106016",68,"ANEL FOLHEADO PRATA TREVO LISO 16"]]],
  ["02","Brincos",[["B6001",88,"BRINCO FOLHEADO OURO 18K ARGOLA LISA MÉDIA"],["B6002",96,"BRINCO FOLHEADO PRATA GOTA CRAVEJADA"],["B6003",68,"BRINCO BANHADO OURO 18K ESTRELA VAZADA"],["B6004",128,"BRINCO FOLHEADO OURO 18K FLOR GRANDE CRAVEJADA"],["B6005",88,"BRINCO FOLHEADO PRATA CORAÇÃO PONTO DE LUZ"],["B6006",96,"BRINCO FOLHEADO OURO 18K HASTE LONGA CRISTAL"],["B6007",68,"BRINCO FOLHEADO PRATA TREVO PEQUENO"]]],
  ["04","Colares",[["CL3001",112,"COLAR FOLHEADO OURO 18K CRUZ LISA"],["CL3002",88,"COLAR FOLHEADO PRATA LETRA CRAVEJADA \"M\""],["CL3003",78,"COLAR FOLHEADO PRATA CORAÇÃO PEQUENO"],["CL3004",128,"COLAR FOLHEADO OURO 18K NOSSA SENHORA CRAVEJADA"],["CL3005",68,"COLAR BANHADO PRATA ESTRELA"]]],
  ["06","Pulseiras",[["P3001",88,"PULSEIRA FOLHEADA PRATA ELOS GROSSOS"],["P3002",68,"PULSEIRA FOLHEADA OURO 18K CORAÇÕES"],["P3003",78,"PULSEIRA BANHADA PRATA RIVIERA"],["P3004",58,"PULSEIRA FOLHEADA PRATA LISA FINA"]]],
  ["19","Brincos Select",[["BB2001",28,"BRINCO BANHADO PRATA PÉROLA"],["BB2002",38,"TRIO DE BRINCOS FOLHEADO PRATA PONTO DE LUZ"],["BB2003",32,"BRINCO BANHADO OURO 18K GOTA PEQUENA"],["BB2004",44,"DUO DE BRINCOS FOLHEADO OURO 18K ESTRELA"]]],
  ["08","Suporte",[["MP062",12,"FLANELA PARA SEMIJOIAS"]]]];

var hashDe = function(t){ var h = 7; for(var i=0;i<t.length;i++) h = (h*31 + t.charCodeAt(i)) % 100003; return h; };
// condicionais inventadas, sempre as mesmas para a mesma revendedora (de 1 a 4)
function gerar(nome, quantas, offset){
  var h = hashDe(nome), lista = [];
  for(var c=0;c<quantas;c++){
    var seed = h + c*977, rnd = function(){ seed = (seed*1103515245 + 12345) % 2147483648; return seed/2147483648; };
    var grupos = CAT.map(function(cat){ var itens = cat[2].filter(function(){ return rnd()<0.7; });
      return itens.length ? G(cat[0], cat[1], itens.map(function(i, ix){ return [i[0]+(c ? String(c) : ""), i[1], i[2], rnd()<0.12 ? 2 : 1]; })) : null; }).filter(Boolean);
    lista.push({numero:String(60000+(h+c*131+(offset||0))%9999).padStart(5,"0"), emissao:"08/10/2026", previsao:"08/11/2026", cliente:nome.toUpperCase(), grupos:grupos});
  }
  return lista;
}
function condicionaisDoKit(k){
  if(!k) return [];
  if(k.rev==="Maria Eduarda de Almeida") return [COND_00558].concat(gerar(k.rev, 2, 3));
  var h = hashDe(k.rev||"x");
  return gerar(k.rev||"Revendedora", 1 + (h%4), 0);   // 1 a 4 condicionais, sempre as mesmas para a mesma revendedora
}

function itensDe(c){ var r = []; (c.grupos||[]).forEach(function(g){ g.itens.forEach(function(i){ r.push(Object.assign({cond:c.numero, grupo:g.nome, grupoCod:g.cod}, i)); }); }); return r; }
function totaisDe(c){ var it = itensDe(c); return {modelos:it.length, pecas:it.reduce(function(t,i){ return t+i.qtd; },0), valor:it.reduce(function(t,i){ return t+i.valor*i.qtd; },0)}; }
function totaisKit(conds){ var t = {condicionais:conds.length, modelos:0, pecas:0, valor:0}; conds.forEach(function(c){ var x = totaisDe(c); t.modelos += x.modelos; t.pecas += x.pecas; t.valor += x.valor; }); return t; }

// Uma leitura: o código tem de estar numa das condicionais do kit e ainda faltar unidade dele. Devolve o novo estado da conferência.
function bipar(conds, conf, codigo){
  var cod = String(codigo||"").trim().toUpperCase().replace(/\s+/g,""); if(!cod) return conf;
  var lidos = Object.assign({}, conf.lidos), erros = (conf.erros||[]).slice(), achou = null;
  conds.some(function(c){ return itensDe(c).some(function(i){ if(i.codigo.toUpperCase()===cod && (lidos[c.numero+"|"+i.codigo]||0) < i.qtd){ achou = i; return true; } return false; }); });
  if(achou){ lidos[achou.cond+"|"+achou.codigo] = (lidos[achou.cond+"|"+achou.codigo]||0)+1; return Object.assign({}, conf, {lidos:lidos, ultimo:{tipo:"ok", codigo:achou.codigo, desc:achou.desc, em:Date.now()}}); }
  var existe = null; conds.some(function(c){ return itensDe(c).some(function(i){ if(i.codigo.toUpperCase()===cod){ existe = i; return true; } return false; }); });
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

export { COND_00558, condicionaisDoKit, itensDe, totaisDe, totaisKit, bipar, resultado };
