// Sorelly Admin · montagem — domain/producao-casa.js
// PEÇAS DA PRODUÇÃO EXTERNA POR CÓDIGO (Marcus, 18/11/2026: "tem que anotar o que é enviado para ela também, não só o que é feito, para termos controle").
//   ENVIADAS A ELA = o que a Sorelly manda para ela fazer, uma linha por envio: dia, código, quantidade e quantas ela já FEZ (informa) — pr.movCasa.
//   DEVOLVIDAS À SORELLY = o que ela devolve já pronto. Vem da GRADE da Produção (lançamentos da filial Casa com o código), para ninguém digitar duas vezes: a devolução é o que paga o dia.
//   COM ELA = enviado − devolvido (o que ainda está na casa dela). FEITAS A DEVOLVER = feitas − devolvidas (pronto, esperando voltar). FALTA FAZER = com ela − feitas a devolver.
// Função pura (sem imports): recebe os envios e as devoluções e devolve a situação de cada código.

var DESDE = "2026-11-16";   // o controle por código começa em 16/11/2026; o que veio antes (código genérico TRIO) não tem envio lançado
var limpaCodigo = function(c){ return String(c==null ? "" : c).toUpperCase().replace(/\s+/g, "").trim(); };
var inteiro = function(v){ var n = Number(typeof v==="string" ? v.replace(",", ".") : v); return isFinite(n) ? Math.round(n) : 0; };

/** Confere um envio novo. → {erro} ou {mov:{dia, codigo, qtd, feitas, obs}} */
function validarEnvio(a){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(a.dia || ""))) return {erro:"Data inválida."};
  var codigo = limpaCodigo(a.codigo), qtd = inteiro(a.qtd), feitas = a.feitas===undefined || String(a.feitas).trim()==="" ? 0 : inteiro(a.feitas);
  if(codigo.length<2) return {erro:"Informe o código da peça."};
  if(!(qtd>0)) return {erro:"Informe a quantidade enviada."};
  if(feitas<0 || feitas>qtd) return {erro:"As feitas precisam ficar entre 0 e "+qtd+"."};
  return {mov:{dia:a.dia, codigo:codigo, qtd:qtd, feitas:feitas, obs:String(a.obs || "").trim()}};
}

/**
 * situacaoPorCodigo(envios, devolvidas)
 * envios = [{dia, codigo, qtd, feitas}] · devolvidas = [{dia, codigo, qtd}] (da grade, filial Casa, a partir de DESDE)
 * → {linhas:[{codigo, enviado, feitas, devolvido, comEla, aDevolver, faltaFazer, ultimoEnvio, semEnvio, aMais}], tot:{enviado, feitas, devolvido, comEla, aDevolver, faltaFazer}}
 */
function situacaoPorCodigo(envios, devolvidas){
  var por = {};
  var linha = function(c){ return por[c] || (por[c] = {codigo:c, enviado:0, feitas:0, devolvido:0, ultimoEnvio:""}); };
  (envios||[]).forEach(function(m){ var c = limpaCodigo(m.codigo); if(!c) return; var l = linha(c); l.enviado += inteiro(m.qtd); l.feitas += Math.min(inteiro(m.feitas), inteiro(m.qtd)); if(m.dia>l.ultimoEnvio) l.ultimoEnvio = m.dia; });
  (devolvidas||[]).forEach(function(d){ var c = limpaCodigo(d.codigo); if(!c) return; linha(c).devolvido += inteiro(d.qtd); });
  var tot = {enviado:0, feitas:0, devolvido:0, comEla:0, aDevolver:0, faltaFazer:0};
  var linhas = Object.keys(por).map(function(c){
    var l = por[c]; l.comEla = l.enviado-l.devolvido; l.aDevolver = Math.max(0, l.feitas-l.devolvido); l.faltaFazer = Math.max(0, l.comEla-l.aDevolver);
    l.semEnvio = l.enviado===0 && l.devolvido>0; l.aMais = l.comEla<0;
    tot.enviado += l.enviado; tot.feitas += l.feitas; tot.devolvido += l.devolvido; tot.comEla += l.comEla; tot.aDevolver += l.aDevolver; tot.faltaFazer += l.faltaFazer;
    return l;
  }).sort(function(a, b){ return a.ultimoEnvio<b.ultimoEnvio ? 1 : a.ultimoEnvio>b.ultimoEnvio ? -1 : (a.codigo<b.codigo ? -1 : 1); });
  return {linhas:linhas, tot:tot};
}

export { DESDE, limpaCodigo, validarEnvio, situacaoPorCodigo };
