// Sorelly Admin · montagem — components/busca-tela.js
// Caixa de busca do Ctrl+F (padrão do sistema inteiro): aparece no topo à direita, destaca o texto achado na tela.
import { acharNaTela } from "@/apps/montagem/lib/atalhos-tela";
import { e, useEffect, useRef, useState } from "@/shared/react";

function BuscaTela(){
  var st = useState(false), aberta = st[0], ts = useState(""), txt = ts[0], ac = useState(null), achou = ac[0], ref = useRef(null);
  useEffect(function(){
    var abrir = function(){ st[1](true); setTimeout(function(){ if(ref.current){ ref.current.focus(); ref.current.select(); } }, 30); };
    window.addEventListener("sorelly:buscar", abrir);
    return function(){ window.removeEventListener("sorelly:buscar", abrir); };
  }, []);
  if(!aberta) return null;
  var buscar = function(voltar){ var r = acharNaTela(txt, voltar); ac[1](r); setTimeout(function(){ if(ref.current) ref.current.focus(); }, 0); };
  return e("div",{"data-sem-clique":true, className:"fixed right-4 top-14 z-[70] flex items-center gap-1.5 rounded-xl bg-card p-2 shadow-2xl ring-2 ring-[#E8B84B]/60"},
    e("input",{ref:ref, value:txt, placeholder:"Buscar na tela…", "aria-label":"Buscar na tela", className:"h-9 w-56 rounded-lg bg-black/30 px-3 text-[14px] text-white outline-none",
      onChange:function(ev){ ts[1](ev.target.value); ac[1](null); },
      onKeyDown:function(ev){ if(ev.key==="Enter"){ ev.preventDefault(); buscar(ev.shiftKey); } if(ev.key==="Escape"){ st[1](false); } }}),
    achou===false && e("span",{className:"text-[12px] font-semibold text-[#EF4444]"}, "Não achei"),
    e("button",{type:"button", title:"Anterior", "aria-label":"Anterior", onClick:function(){ buscar(true); }, className:"grid size-8 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20"}, "↑"),
    e("button",{type:"button", title:"Próximo", "aria-label":"Próximo", onClick:function(){ buscar(false); }, className:"grid size-8 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20"}, "↓"),
    e("button",{type:"button", title:"Fechar", "aria-label":"Fechar", onClick:function(){ st[1](false); }, className:"grid size-8 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20"}, "×"));
}
export { BuscaTela };
