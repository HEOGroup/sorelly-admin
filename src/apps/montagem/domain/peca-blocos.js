// Sorelly Admin · montagem — domain/peca-blocos.js
// Que blocos de preferência pertencem a cada peça do kit (pelo título do bloco, sem acento). Usado na janela do computador (janela-montar.js) e no celular da montadora (etiqueta.js).
// Bloco que não é de nenhuma peça (observações, identificação, material de apoio...) vai para "Antes de começar".
var semAcento = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/\s+/g," ").trim(); };
var PECA_BLOCOS = [
  {peca:"colar", blocos:["colares", "colar filhos", "colar de letras"]},
  {peca:"pulseira", blocos:["pulseira", "bracelete"]},
  {peca:"conjunto", blocos:["conjunto"]},
  {peca:"anel", blocos:["aneis"]},
  {peca:"infanti", blocos:["infantil"]},
  {peca:"masculin", blocos:["masculino"]},
  {peca:"tornozeleira", blocos:["tornozeleira"]},
  {peca:"flanela", blocos:["flanela"]}];
var blocosDaPeca = function(base){ var b = semAcento(base), m = PECA_BLOCOS.find(function(x){ return b.indexOf(x.peca)>=0; }); return m ? m.blocos : []; };
export { semAcento, blocosDaPeca };
