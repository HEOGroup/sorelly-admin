// Sorelly Admin · montagem — components/zoom-tela.js
// Tamanho do sistema (Marcus, 26/10/2026): diminui ou aumenta TUDO (menu, telas, textos). Botões − 100% + no topo e atalhos Ctrl −, Ctrl + e Ctrl 0. Lembra a escolha neste navegador.
// O zoom vale só para o conteúdo (#root); as listas que abrem por cima (menus, seletor de conta) ficam no tamanho normal.
import { e, useEffect, useState } from "@/shared/react";

var CHAVE = "sorelly_zoom", PASSOS = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];
var lerZoom = function(){ try{ var v = parseFloat(localStorage.getItem(CHAVE)); return v>=0.5 && v<=2 ? v : 1; }catch(x){ return 1; } };
var proximo = function(z, dir){ var i = PASSOS.reduce(function(m, p, k){ return Math.abs(p-z)<Math.abs(PASSOS[m]-z) ? k : m; }, 0); return PASSOS[Math.max(0, Math.min(PASSOS.length-1, i+dir))]; };

function ZoomTela(){
  var st = useState(lerZoom), z = st[0], setZ = st[1];
  useEffect(function(){
    var r = document.getElementById("root"); if(r) r.style.zoom = z===1 ? "" : String(z);
    try{ localStorage.setItem(CHAVE, String(z)); }catch(x){}
  }, [z]);
  useEffect(function(){
    var tecla = function(ev){
      if(!(ev.ctrlKey || ev.metaKey) || ev.altKey) return;
      var k = ev.key;
      if(k==="-" || k==="_"){ ev.preventDefault(); setZ(function(a){ return proximo(a, -1); }); }
      else if(k==="=" || k==="+"){ ev.preventDefault(); setZ(function(a){ return proximo(a, 1); }); }
      else if(k==="0"){ ev.preventDefault(); setZ(1); }
    };
    window.addEventListener("keydown", tecla); return function(){ window.removeEventListener("keydown", tecla); };
  }, []);
  var btn = "grid h-9 min-w-8 place-items-center px-1.5 text-[13px] hover:bg-muted/50";
  return e("div",{role:"group", "aria-label":"Tamanho do sistema", className:"hidden shrink-0 items-center overflow-hidden rounded-lg border border-border md:flex"},
    e("button",{type:"button", className:btn, title:"Diminuir o sistema (Ctrl −)", "aria-label":"Diminuir o sistema", onClick:function(){ setZ(proximo(z, -1)); }}, "−"),
    e("button",{type:"button", className:btn+" w-12 border-x border-border text-[11px] font-semibold tabular-nums", title:"Voltar para 100% (Ctrl 0)", "aria-label":"Tamanho atual do sistema", onClick:function(){ setZ(1); }}, Math.round(z*100)+"%"),
    e("button",{type:"button", className:btn, title:"Aumentar o sistema (Ctrl +)", "aria-label":"Aumentar o sistema", onClick:function(){ setZ(proximo(z, 1)); }}, "+"));
}

export { ZoomTela };
