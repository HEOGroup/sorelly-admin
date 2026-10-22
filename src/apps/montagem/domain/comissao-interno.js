// Sorelly Admin · montagem — domain/comissao-interno.js
// Comissão de quem bipa o atendimento INTERNO (revendedora que vem à Sorelly; no app a representante dela é a "Sorelly"). Regra de 15/10/2026 (Marcus), provisória:
//  · R$ 10,00 por atendimento (um pouco acima do envio de kits, porque a bipadora atende a revendedora);
//  · cada vez que a revendedora marcar no app que contou errado, a bipadora perde R$ 5,00 (2 erros perdem os dois);
//  · a nota que a revendedora dá ao atendimento (1 a 5) rende um bônus: nota 5 = R$ 2,00 · nota 4 = R$ 1,00.
// Os números ficam em cfg.bipInterno quando o Configurador passar a editar; até lá valem os padrões abaixo.
var PADRAO = {base:10, desconto:5, bonus5:2, bonus4:1};
function regra(cfg){ return Object.assign({}, PADRAO, (cfg && cfg.bipInterno) || {}); }
function r2(n){ return Math.round(n*100)/100; }
// um atendimento: base − erros × desconto (nunca abaixo de zero) + bônus da nota
function comissaoAtendimento(it, cfg){
  var c = regra(cfg), av = it.avaliacao || {}, erros = av.erros || 0, nota = av.nota || 0;
  var base = Math.max(0, c.base - erros*c.desconto), bonus = nota>=5 ? c.bonus5 : nota>=4 ? c.bonus4 : 0;
  return {base:r2(base), bonus:bonus, perda:r2(Math.min(c.base, erros*c.desconto)), total:r2(base+bonus), erros:erros, nota:nota};
}
// quem bipou cada atendimento interno já acertado no mês: {nome: {n, base, bonus, perda, total, erros, soma, notas, itens}}
function resumoInterno(s, mes){
  var out = {};
  (s.internos || []).forEach(function(it){
    if(it.status!=="acertado" || !it.bipou || (mes && String(it.data||"").slice(0, 7)!==mes)) return;
    var c = comissaoAtendimento(it, s.cfg), o = out[it.bipou] || (out[it.bipou] = {nome:it.bipou, n:0, base:0, bonus:0, perda:0, total:0, erros:0, notas:0, nNotas:0, itens:[]});
    o.n++; o.base = r2(o.base+c.base); o.bonus = r2(o.bonus+c.bonus); o.perda = r2(o.perda+c.perda); o.total = r2(o.total+c.total); o.erros += c.erros;
    if(c.nota){ o.notas += c.nota; o.nNotas++; } o.itens.push({it:it, c:c});
  });
  return Object.keys(out).map(function(k){ var o = out[k]; o.media = o.nNotas ? o.notas/o.nNotas : null; return o; }).sort(function(a, b){ return b.total-a.total; });
}
// ---------- atendimento (quem acompanha a revendedora na montagem do kit), regra de 20/10/2026 (Marcus) ----------
//  · R$ 5,00 FIXO por atendimento; venda acima de R$ 4.000,00 paga R$ 10,00;
//  · qualquer funcionária que atender recebe; por enquanto quem atende de fato são Maria Aparecida e Leci (lista informativa em "quem").
// Valores em cfg.atendInterno quando o Configurador passar a editar; até lá valem os padrões abaixo.
var PADRAO_ATEND = {valor:5, valorAlto:10, limiteAlto:4000, quem:["Leci Nunes da Rosa", "Maria Aparecida Barreto dos Santos"]};
function regraAtend(cfg){ return Object.assign({}, PADRAO_ATEND, (cfg && cfg.atendInterno) || {}); }
function vendaDoAtendimento(it){ if(it.vendaApp!=null) return it.vendaApp; var a = it.acerto || {}; return a.vendaLiquida || a.vendaBruta || 0; }
function valorAtendimento(it, cfg){ var c = regraAtend(cfg), v = vendaDoAtendimento(it); return {venda:v, alta:v>c.limiteAlto, valor:v>c.limiteAlto ? c.valorAlto : c.valor}; }
// quem atendeu cada atendimento interno acertado no mês: {nome: {n, nAlta, total, itens}}
function resumoAtendimento(s, mes){
  var out = {};
  (s.internos || []).forEach(function(it){
    if(it.status!=="acertado" || !it.atendeu || (mes && String(it.data||"").slice(0, 7)!==mes)) return;
    var v = valorAtendimento(it, s.cfg), o = out[it.atendeu] || (out[it.atendeu] = {nome:it.atendeu, n:0, nAlta:0, total:0, itens:[]});
    o.n++; if(v.alta) o.nAlta++; o.total = r2(o.total+v.valor); o.itens.push({it:it, v:v});
  });
  return Object.keys(out).map(function(k){ return out[k]; }).sort(function(a, b){ return b.total-a.total; });
}
export { PADRAO, regra, comissaoAtendimento, resumoInterno, PADRAO_ATEND, regraAtend, valorAtendimento, resumoAtendimento };
