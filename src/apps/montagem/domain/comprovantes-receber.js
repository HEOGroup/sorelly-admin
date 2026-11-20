// Sorelly Admin · montagem — domain/comprovantes-receber.js
// CONTAS A RECEBER × COMPROVANTES DO ATENDIMENTO (Marcus, 19/11/2026): a funcionária anexa o comprovante de cada Pix do acerto no Atendimento interno (s.lancFin);
// o mesmo pagamento aparece na Contas a receber (DevMaster, uma linha por título). Esta função liga um ao outro: mesma revendedora (nome parecido), mesmo valor, data até 3 dias de diferença.
// Regra de segurança (a mesma da importação para o Financeiro familiar): só liga quando o par é ÚNICO dos dois lados; qualquer dúvida fica sem comprovante. Função pura: não lê banco e não grava nada.
import { nomeParecido } from "./pix-adiantados.js";

var r2 = function(v){ return Math.round((Number(v)||0)*100)/100; };
var diaDe = function(ts){ return new Date(Number(ts) - 3*3600*1000).toISOString().slice(0, 10); };   // dia em São Paulo (UTC−3)
var dias = function(a, b){ return Math.round((new Date(a+"T12:00:00Z") - new Date(b+"T12:00:00Z"))/86400000); };
var temArquivo = function(c){ return !!c && typeof c.url==="string" && /^data:(image\/(jpeg|png|webp)|application\/pdf);base64,/.test(c.url); };

// titulos = linhas da DevMaster ({id, rev, valor, d, forma, nao}); lancFin = s.lancFin (lista de acertos enviados). opc.tolerancia = dias (padrão 3).
// Devolve {mapa: {idDoTitulo: {nome, url}}, ambiguos: N}
function comprovantesDosRecebidos(titulos, lancFin, opc){
  var tol = (opc && opc.tolerancia!=null) ? opc.tolerancia : 3, partes = [];
  (lancFin || []).forEach(function(lf, k){
    if(!lf || !Array.isArray(lf.linhas) || !lf.enviadoTs) return;
    lf.linhas.forEach(function(l, i){ if(!l || !((l.tipo==="pagamento" && l.forma==="pix") || l.tipo==="brinde")) return;   // pagamento em Pix, ou a diferença do brinde (também paga por Pix e com comprovante próprio)
      (l.partes || []).forEach(function(p, j){
        if(!p || !(p.valor>0) || !temArquivo(p.comprovante)) return;
        partes.push({ref:k+"."+i+"."+j, nome:lf.nome || "", valor:r2(p.valor), dia:diaDe(lf.enviadoTs), comp:{nome:p.comprovante.nome || "Comprovante", url:p.comprovante.url}}); }); });
  });
  var tits = (titulos || []).filter(function(t){ return t && !t.nao && t.valor>0 && /pix/i.test(t.forma || "") && t.d; });
  var porValor = {}; partes.forEach(function(p){ (porValor[p.valor.toFixed(2)] = porValor[p.valor.toFixed(2)] || []).push(p); });
  var pares = [], tReiv = {}, pReiv = {};
  tits.forEach(function(t){
    var cand = (porValor[r2(t.valor).toFixed(2)] || []).filter(function(p){ return nomeParecido(t.rev, p.nome) && Math.abs(dias(t.d, p.dia))<=tol; });
    if(!cand.length) return;
    pares.push({t:t, c:cand}); cand.forEach(function(p){ pReiv[p.ref] = (pReiv[p.ref] || 0)+1; });
  });
  var mapa = {}, ambiguos = 0;
  pares.forEach(function(x){ if(x.c.length===1 && pReiv[x.c[0].ref]===1) mapa[x.t.id] = x.c[0].comp; else ambiguos++; });
  return {mapa:mapa, ambiguos:ambiguos};
}
export { comprovantesDosRecebidos };
