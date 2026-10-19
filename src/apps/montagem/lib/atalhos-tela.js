// Sorelly Admin — lib/atalhos-tela.js
// Comportamentos PADRÃO de toda tela (ligados uma vez, em App.js), para ninguém precisar refazer em cada módulo:
//  1. Arrastar para o lado: clique no vazio de qualquer tabela/bloco largo, segure e arraste (como no Consolidado).
//  2. Ctrl+F: abre a busca do sistema (caixa no topo) e destaca o texto na tela; Enter = próximo, Shift+Enter = anterior, Esc fecha.
var ligado = false;

function rolavel(el){
  while(el && el!==document.body){
    if(el.scrollWidth>el.clientWidth+4){ var ox = getComputedStyle(el).overflowX; if(ox==="auto" || ox==="scroll") return el; }
    el = el.parentElement;
  }
  return null;
}
function ligarArrastar(){
  var alvo = null, x0 = 0, rol0 = 0, moveu = false;
  document.addEventListener("mousedown", function(ev){
    if(ev.button!==0) return;
    var t = ev.target; if(t.closest && t.closest("input, textarea, select, button, a, label, summary, [contenteditable=true], [data-sem-arrastar]")) return;
    var el = rolavel(t); if(!el) return;
    alvo = el; x0 = ev.clientX; rol0 = el.scrollLeft; moveu = false;
  }, true);
  document.addEventListener("mousemove", function(ev){
    if(!alvo) return;
    var dx = ev.clientX - x0;
    if(!moveu && Math.abs(dx)<4) return;
    if(!moveu){ moveu = true; alvo.style.cursor = "grabbing"; document.body.style.userSelect = "none"; }
    alvo.scrollLeft = rol0 - dx;
  }, true);
  var fim = function(){ if(!alvo) return; alvo.style.cursor = ""; document.body.style.userSelect = ""; alvo = null; };
  document.addEventListener("mouseup", fim, true);
  window.addEventListener("blur", fim);
  // sinaliza que dá para arrastar (mãozinha) nas áreas largas
  document.addEventListener("mouseover", function(ev){ var el = rolavel(ev.target); if(el && !alvo && !(ev.target.closest && ev.target.closest("input, textarea, select, button, a, label"))) el.style.cursor = "grab"; }, true);
  document.addEventListener("mouseout", function(ev){ var el = rolavel(ev.target); if(el && !alvo) el.style.cursor = ""; }, true);
}

function iniciarAtalhos(){
  if(ligado || typeof document==="undefined") return; ligado = true;
  ligarArrastar();
  document.addEventListener("keydown", function(ev){
    if((ev.ctrlKey || ev.metaKey) && (ev.key==="f" || ev.key==="F")){ ev.preventDefault(); window.dispatchEvent(new CustomEvent("sorelly:buscar")); }
  }, true);
}
// procura o texto na tela (Chromium); devolve se achou
function acharNaTela(txt, voltar){
  if(!txt) return false;
  try{ return window.find(txt, false, !!voltar, true, false, false, false); }catch(x){ return false; }
}
export { iniciarAtalhos, acharNaTela };
