// Sorelly Admin · montagem — domain/comprovantes-importar.js
// IMPORTAÇÃO DOS COMPROVANTES JÁ ANEXADOS NO ATENDIMENTO (Marcus, 19/11/2026): as funcionárias anexam o comprovante de cada pagamento do acerto (lancFin, módulo pag, itens lf_...).
// Quando o Pix do acerto é o mesmo Pix que está em ff.pix (Financeiro familiar), o comprovante pode ser reaproveitado: mesmo valor, mesma revendedora, data próxima.
// Regra de segurança: só casa quando o par é ÚNICO dos dois lados (um comprovante serve a UM Pix e um Pix recebe UM comprovante). Qualquer dúvida vai para "ambíguos" e NÃO é gravada.
// Função pura: não lê banco, não grava nada e nunca devolve a imagem (só nome, valor, data e ids). Usada por scripts/importar-comprovantes-atendimento.mjs.
import { nomeParecido } from "./pix-adiantados.js";

var r2 = function(v){ return Math.round((Number(v)||0)*100)/100; };
var diaDe = function(ts){ return new Date(Number(ts) - 3*3600*1000).toISOString().slice(0, 10); };   // dia em São Paulo (UTC−3)
var dias = function(a, b){ return Math.round((new Date(a+"T12:00:00Z") - new Date(b+"T12:00:00Z"))/86400000); };
var ehImagem = function(c){ return !!c && typeof c.url==="string" && /^data:image\/(jpeg|png|webp);base64,/.test(c.url); };

// pag = conteúdo do módulo pag ({chave: valor}); ff = conteúdo do módulo ff. opc.tolerancia = dias de diferença aceitos entre o envio do acerto e a data do Pix (padrão 3).
function casarComprovantes(pag, ff, opc){
  var tol = (opc && opc.tolerancia!=null) ? opc.tolerancia : 3, partes = [], semImagem = 0;
  Object.keys(pag || {}).forEach(function(k){
    if(k.indexOf("lf_")!==0) return; var lf = pag[k]; if(!lf || !Array.isArray(lf.linhas) || !lf.enviadoTs) return;
    lf.linhas.forEach(function(l, i){ if(l.tipo!=="pagamento" || l.forma!=="pix") return;
      (l.partes || []).forEach(function(p, j){
        if(!p || !(p.valor>0)) return;
        if(!ehImagem(p.comprovante)){ if(p.comprovante) semImagem++; return; }   // sem foto (ou PDF): não importa
        partes.push({ref:k+"#"+i+"."+j, lfId:lf.id || k, rev:lf.nome || "", valor:r2(p.valor), data:diaDe(lf.enviadoTs), conta:p.descricao || "", arquivo:p.comprovante.nome || ""}); }); });
  });
  var pix = ((ff && ff.pix) || []).filter(function(x){ return x && x.valor>0 && x.origem && x.data && !x.compKey && x.auditoria!=="REJEITADO" && x.auditoria!=="NAOIDENT"; });
  partes.forEach(function(p){ p.pix = pix.filter(function(x){ return r2(x.valor)===p.valor && nomeParecido(x.origem, p.rev) && Math.abs(dias(x.data, p.data))<=tol; }).map(function(x){ return x.id; }); });
  var reivindicado = {}; partes.forEach(function(p){ p.pix.forEach(function(id){ reivindicado[id] = (reivindicado[id] || 0)+1; }); });
  var casados = [], ambiguos = [], semPix = [];
  partes.forEach(function(p){
    var base = {ref:p.ref, lfId:p.lfId, rev:p.rev, valor:p.valor, data:p.data, conta:p.conta, arquivo:p.arquivo};
    if(!p.pix.length) semPix.push(base);
    else if(p.pix.length===1 && reivindicado[p.pix[0]]===1) casados.push(Object.assign(base, {pixId:p.pix[0]}));
    else ambiguos.push(Object.assign(base, {pixIds:p.pix, motivo:p.pix.length>1 ? "mais de um Pix igual" : "o mesmo Pix serve a mais de um comprovante"}));
  });
  return {total:partes.length, semImagem:semImagem, casados:casados, ambiguos:ambiguos, semPix:semPix};
}
export { casarComprovantes };
