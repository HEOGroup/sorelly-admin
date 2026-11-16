// Sorelly Admin — components/menu-dias.js
// Menu de DIAS com caixa de marcar, na barra azul do bloco (BlocoPainel `acao`): dá para abrir mais de um dia ou todos (Marcus, 16/11/2026). Mesmo componente da tela Condicionais,
// agora também da Listagens. A opção "Mostrar também as liberadas antigas" só aparece se a tela passar onAntigas. Dias em AAAA-MM-DD; "sem-data" para listagem sem data.
import { createPortal } from "react-dom";
import { e, useEffect, useRef, useState } from "@/shared/react";

var dia = function(iso){ return iso ? String(iso).slice(8, 10)+"/"+String(iso).slice(5, 7)+"/"+String(iso).slice(0, 4) : "—"; };
var diaCurto = function(iso){ return iso ? String(iso).slice(8, 10)+"/"+String(iso).slice(5, 7) : ""; };
var SEMANA = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
var tituloAba = function(iso){   // dia padronizado, sem Hoje/Amanhã: "16/11/2026 · Segunda-feira" (Marcus, 16/11/2026)
  if(!iso || iso==="sem-data") return "Sem data";
  return dia(iso)+" · "+SEMANA[new Date(iso+"T12:00:00Z").getUTCDay()];
};

// MENU DE DIAS (Marcus, 16/11/2026: "ela tem que poder abrir mais de um dia se quiser"): campo na barra azul que abre uma lista com caixa de marcar, Todos os dias e um dia por linha.
// A lista sai da barra (portal no body): a barra do bloco corta o que passa dela. Sempre fica pelo menos um dia marcado.
function MenuDias(p){
  var st = useState(null), pos = st[0], setPos = st[1], bt = useRef(null), lista = useRef(null), sel = p.sel, todos = p.dias.length>1 && sel.length===p.dias.length;
  useEffect(function(){
    if(!pos) return undefined;
    var fora = function(ev){ if(lista.current && !lista.current.contains(ev.target) && bt.current && !bt.current.contains(ev.target)) setPos(null); };
    document.addEventListener("mousedown", fora); return function(){ document.removeEventListener("mousedown", fora); };
  }, [pos, setPos]);
  var rot = todos ? "Todos os dias" : sel.length===1 ? tituloAba(sel[0]) : sel.length+" dias";   // o campo fechado escreve igual à lista aberta (Marcus, 16/11/2026)
  var alterna = function(d0){ var n = sel.indexOf(d0)>=0 ? sel.filter(function(x){ return x!==d0; }) : sel.concat([d0]); if(n.length) p.onChange(p.dias.filter(function(x){ return n.indexOf(x)>=0; })); };
  var abre = function(){ if(pos){ setPos(null); return; } var r = bt.current.getBoundingClientRect(); setPos({top:r.bottom+4, left:r.left}); };
  var linha = "flex h-8 cursor-pointer items-center gap-2 rounded px-2 text-[13px] font-normal normal-case text-white hover:bg-white/15";   // dentro da lista: letra normal, minúscula e sem negrito (Marcus: "escrever normal ali dentro"); só o campo fechado fica grande e em maiúsculas
  return e("div",{className:"flex items-center gap-2"},
    e("span",{className:"text-[13px] font-bold uppercase"}, "Dia"),
    e("button",{ref:bt, id:"cd-dia", type:"button", "aria-expanded":!!pos, onClick:abre, className:"flex h-8 items-center gap-2 whitespace-nowrap rounded-md border border-white/50 bg-[#14233f] px-2.5 text-[13px] font-normal normal-case text-white outline-none"}, e("span",null, rot), e("span",{"aria-hidden":"true"}, pos ? "▴" : "▾")),
    pos && createPortal(e("div",{ref:lista, role:"listbox", "aria-multiselectable":true, style:{top:pos.top, left:pos.left}, className:"fixed z-[90] max-h-[60vh] min-w-72 overflow-y-auto rounded-md border border-white/50 bg-[#14233f] p-1 shadow-lg"},
      p.dias.length>1 && e("label",{className:linha+" border-b border-white/30"}, e("input",{type:"checkbox", checked:todos, onChange:function(){ p.onChange(todos ? [sel[0]] : p.dias.slice()); }}), "Todos os dias"),
      p.dias.map(function(d0){ return e("label",{key:d0, className:linha}, e("input",{type:"checkbox", checked:sel.indexOf(d0)>=0, onChange:function(){ alterna(d0); }}), tituloAba(d0)); }),
      p.onAntigas && e("label",{className:linha+" border-t border-white/30"}, e("input",{type:"checkbox", checked:!!p.antigas, onChange:function(){ p.onAntigas(!p.antigas); }}), "Mostrar também as liberadas antigas")), document.body));
}


export { MenuDias, tituloAba, dia, diaCurto, SEMANA };
