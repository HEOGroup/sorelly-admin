// Sorelly Admin · montagem — domain/metas.js
// METAS DAS REVENDEDORAS (retomadas em 02/11/2026; as metas do admin antigo foram descartadas em 16/10/2026). Regras do Marcus, uma campanha por mês:
//  - Meta = média das 3 últimas vendas (regra de 27/10, em domain/CLAUDE.md e docs/negocio/MEDIA-DE-VENDAS.md) + um percentual, em dois níveis (Meta 1 e Meta 2).
//  - Quem nunca vendeu ("Kit novo", linha separada) ou tem média abaixo de R$ 1.000 ("Inicial") tem a mesma meta: Meta 1 = R$ 1.500 e Meta 2 = R$ 2.000.
//  - As outras classes são faixas de R$ 500 (a partir de R$ 1.000). Meta 1 = 15% e Meta 2 = 35% sobre o TOPO da faixa, arredondadas para cima em R$ 100.
//    Assim a meta nunca fica fácil para quem está no topo da faixa. Classe "R$ 7.000 ou mais" tem meta individual (média + 15% e + 35%).
//  - Bateu a meta = brinde EXTRA (BB e Normal) somado ao brinde que a tabela do acerto já dá. O extra cresce em linha reta entre dois pontos definidos pelo Marcus.
//  - Tudo muda mês a mês: cada mês tem a sua campanha (CAMPANHAS). Dezembro nasce como cópia de novembro.
//  - A meta vale para o PRÓXIMO ACERTO, em qualquer data. Quando a campanha seguinte começa, quem ainda não acertou MANTÉM a meta da campanha anterior (campo `anterior`).
// Metas subidas em 02/11/2026 (Marcus: 1.000 a 1.499 de 1.700 para 1.900; 1.500 a 1.999 de 2.300 para 2.500; 2.000 a 2.499 de 2.900 para 3.000; as outras e todas as Meta 2 subiram em valores redondos).
// Faixas já aprovadas pelo Marcus: Inicial, R$ 1.000 a 1.499 e R$ 1.500 a 1.999. As demais saem da regra acima e ficam marcadas como provisórias.
// Função pura (sem tela): o servidor (src/server/metas.js) e a tela (pages/MetasRevendedoras.js) usam as mesmas contas.

var COPIA = function(o){ return JSON.parse(JSON.stringify(o)); };

var CAMPANHA_NOVEMBRO = {
  mes: "2026-11", nome: "Novembro de 2026",
  pct1: 20, pct2: 40,                         // meta individual da categoria de R$ 7.000 ou mais: média + 20% e + 40% (eram 15% e 35%; Marcus, 02/11/2026)
  piso1: 1500, piso2: 2000,                   // nenhuma meta abaixo disto
  ponto1: {meta: 1500, bb: 124, normal: 92},  // extra de brinde na meta de R$ 1.500 (eram 128 e 96; R$ 4,00 a menos, Marcus 02/11/2026)
  ponto2: {meta: 2000, bb: 164, normal: 118}, // extra de brinde na meta de R$ 2.000 (eram 168 e 122; R$ 4,00 a menos)
  classes: [
    {id: "novo", nome: "Kit novo", desc: "Kit novo (nunca vendeu)", de: 0, ate: 0, m1: 1500, m2: 2000, aprovada: true, semVenda: true},   // linha separada (Marcus, 02/11/2026): nunca vendeu / sem venda no período; mesmas metas do Inicial
    {id: "ini", nome: "R$ 0,00 até R$ 599,99", desc: "Média de R$ 0,00 até R$ 599,99", de: 0, ate: 599.99, m1: 1500, m2: 2000, aprovada: true},   // a antiga categoria até R$ 999,99 virou duas (Marcus, 02/11/2026)
    {id: "ini2", nome: "R$ 600,00 até R$ 999,99", desc: "Média de R$ 600,00 até R$ 999,99", de: 600, ate: 999.99, m1: 1500, m2: 2000, aprovada: true},
    {id: "a", nome: "R$ 1.000,00 até R$ 1.499,99", de: 1000, ate: 1499.99, m1: 1900, m2: 2400, aprovada: true},
    {id: "b", nome: "R$ 1.500,00 até R$ 1.999,99", de: 1500, ate: 1999.99, m1: 2500, m2: 3000, aprovada: true},
    {id: "c", nome: "R$ 2.000,00 até R$ 2.499,99", de: 2000, ate: 2499.99, m1: 3000, m2: 3700},
    {id: "d", nome: "R$ 2.500,00 até R$ 2.999,99", de: 2500, ate: 2999.99, m1: 3800, m2: 4500},
    {id: "e", nome: "R$ 3.000,00 até R$ 3.999,99", de: 3000, ate: 3999.99, m1: 4800, m2: 5800},
    {id: "f", nome: "R$ 4.000,00 até R$ 4.999,99", de: 4000, ate: 4999.99, m1: 6000, m2: 7200},
    {id: "g", nome: "R$ 5.000,00 até R$ 6.999,99", de: 5000, ate: 6999.99, m1: 8500, m2: 10000},
    {id: "h", nome: "R$ 7.000,00 ou mais", de: 7000, ate: 1e9, individual: true}
  ]
};
// Dezembro: quem NÃO acertou durante a campanha anterior MANTÉM a meta de novembro (Marcus, 02/11/2026); só entram em dezembro quem já acertou e quem chegou depois (condicional nova).
var CAMPANHA_DEZEMBRO = Object.assign(COPIA(CAMPANHA_NOVEMBRO), {mes: "2026-12", nome: "Dezembro de 2026", anterior: "2026-11"});

var CAMPANHAS = {"2026-11": CAMPANHA_NOVEMBRO, "2026-12": CAMPANHA_DEZEMBRO};
var MES_PADRAO = "2026-11";

function campanhaDe(mes){ return CAMPANHAS[mes] || CAMPANHAS[MES_PADRAO]; }
// BRINDES: a Sorelly não trabalha com valor fechado; as peças de brinde têm estes valores (Marcus, 02/11/2026). O brinde EXTRA da meta é sempre R$ 4,00 a MENOS que um destes valores,
// para a revendedora sempre pagar a diferença. Por isso o extra só pode ser: 64, 84, 92, 108, 118, 124, 128, 140, 164, 184, 208, 228, 238, 258, 278, 308, 318, 364 ou 418.
var BRINDE_VALORES = [68, 88, 96, 112, 122, 128, 132, 144, 168, 188, 212, 232, 242, 262, 282, 312, 322, 368, 422];
var BRINDE_EXTRAS = BRINDE_VALORES.map(function(v){ return v - 4; });
/** O valor permitido mais perto de v (empate fica com o menor; acima de R$ 418 fica R$ 418). */
function valorBrinde(v){
  var melhor = BRINDE_EXTRAS[0];
  BRINDE_EXTRAS.forEach(function(x){ if(Math.abs(x - v) < Math.abs(melhor - v)) melhor = x; });
  return melhor;
}
/** Arredonda para cima em R$ 100. */
function teto100(v){ return Math.ceil(Math.round(v * 100) / 10000) * 100; }

/** Classes do mês com metas e brindes extras. O que o Marcus define na tela Campanha (ov = {classes:{id:{m1,m2,bb1,no1,bb2,no2}}}) vale sobre o padrão; sem isso, as metas aprovadas valem como estão,
 *  as outras saem da regra de percentual sobre o topo da faixa e o extra cresce em linha reta entre os dois pontos. Classe individual (R$ 7.000 ou mais) usa a meta de R$ 7.500 de média como referência do extra. */
function classesDe(camp, ov){
  return camp.classes.map(function(cl){
    var c = Object.assign({desc: "Média de " + cl.nome + (cl.individual ? " (meta individual)" : "")}, cl);   // desc = o que a categoria quer dizer (a tela mostra)
    if(c.individual) c = Object.assign({}, c, {m1: 0, m2: 0});
    else if(!c.m1) c = Object.assign({}, c, {m1: Math.max(camp.piso1, teto100(c.ate * (1 + camp.pct1 / 100))), m2: Math.max(camp.piso2, teto100(c.ate * (1 + camp.pct2 / 100)))});
    var r1 = c.individual ? teto100(7500 * (1 + camp.pct1 / 100)) : c.m1, r2 = c.individual ? teto100(7500 * (1 + camp.pct2 / 100)) : c.m2, e1 = extraDe(camp, r1), e2 = extraDe(camp, r2);
    c = Object.assign({}, c, {bb1: valorBrinde(e1.bb), no1: valorBrinde(e1.normal), bb2: valorBrinde(e2.bb), no2: valorBrinde(e2.normal)});   // padrão = o valor permitido mais perto da reta
    var o = ov && ov.classes && ov.classes[c.id];
    if(o){ ["bb1", "no1", "bb2", "no2"].forEach(function(k){ if(typeof o[k] === "number") c[k] = o[k]; }); if(!c.individual){ if(typeof o.m1 === "number") c.m1 = o.m1; if(typeof o.m2 === "number") c.m2 = o.m2; } c.definida = true; }
    return c;
  });
}
function classeDeMedia(camp, media, ov){
  var cls = classesDe(camp, ov), m = Number(media) || 0;
  if(!m) return cls.filter(function(c){ return c.semVenda; })[0] || cls[0];   // sem média = Kit novo
  for(var i = cls.length - 1; i >= 0; i--) if(!cls[i].semVenda && m >= cls[i].de) return cls[i];
  return cls[0];
}
/** Metas de UMA revendedora a partir da média das 3 últimas vendas (média 0 = nunca vendeu = classe Inicial). */
function metasDe(camp, media, ov){
  var c = classeDeMedia(camp, media, ov), m = Number(media) || 0;
  if(c.individual) return {classe: c, m1: Math.max(camp.piso1, teto100(m * (1 + camp.pct1 / 100))), m2: Math.max(camp.piso2, teto100(m * (1 + camp.pct2 / 100)))};
  return {classe: c, m1: c.m1, m2: c.m2};
}
/** Brinde extra (BB e Normal) de uma meta: reta entre os dois pontos do Marcus. */
function extraDe(camp, meta){
  var a = camp.ponto1, b = camp.ponto2, k = (meta - a.meta) / (b.meta - a.meta);
  return {bb: Math.round(a.bb + (b.bb - a.bb) * k), normal: Math.round(a.normal + (b.normal - a.normal) * k)};
}
/** Situação da revendedora no mês. vendeu = venda do mês sem brinde (null = ainda não acertou). */
function situacaoDe(vendeu, m1, m2){
  if(vendeu === null || vendeu === undefined) return "Aguardando acerto";
  if(vendeu >= m2) return "Bateu Meta 2";
  if(vendeu >= m1) return "Bateu Meta 1";
  return "Não bateu";
}

/** Resumo de uma lista de revendedoras (itens do servidor) agrupado por uma chave (representante, classe...). Devolve uma linha por grupo, em ordem alfabética. */
function resumoPor(itens, chaveDe){
  var m = {};
  itens.forEach(function(i){
    var k = chaveDe(i) || "Sem representante", o = m[k] || (m[k] = {k: k, n: 0, agu: 0, ac: 0, b1: 0, b2: 0, nao: 0, extra: 0});
    o.n++;
    if(i.vendeu === null) o.agu++; else o.ac++;
    if(i.situacao === "Bateu Meta 1") o.b1++;
    if(i.situacao === "Bateu Meta 2") o.b2++;
    if(i.situacao === "Não bateu") o.nao++;
    o.extra += (i.extraBb || 0) + (i.extraNormal || 0);
  });
  return Object.keys(m).sort(function(a, b){ return a.localeCompare(b, "pt-BR"); }).map(function(k){ return m[k]; });
}
/** Resultado do desafio mensal do admin antigo (consulta de 02/11/2026; tabela metas_desafio): serve de comparação no Histórico. */
var HISTORICO_ANTIGO = {nome: "Admin antigo (ago a out/2026)", participantes: 3932, acertaram: 3588, bateram: 545};

export { BRINDE_VALORES, BRINDE_EXTRAS, valorBrinde, resumoPor, HISTORICO_ANTIGO, CAMPANHAS, MES_PADRAO, campanhaDe, classesDe, classeDeMedia, metasDe, extraDe, situacaoDe, teto100 };
