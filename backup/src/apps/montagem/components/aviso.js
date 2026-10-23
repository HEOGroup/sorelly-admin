// Sorelly Admin · montagem e bipagem — components/aviso.js
// Registro de ação: um blocozinho que sobe ao lado de onde a pessoa clicou (sem clique recente, aparece no canto de baixo à direita).
import { use } from "@/apps/montagem/state/context";
import { e, useEffect } from "@/shared/react";

var ultimo = {x:0, y:0, t:0};
if(typeof window!=="undefined") window.addEventListener("pointerdown", function(ev){ ultimo = {x:ev.clientX, y:ev.clientY, t:Date.now()}; }, true);

var TONS = {ok:["#16A34A","✓"], atencao:["#D97706","!"], alerta:["#DC2626","!"]};

function Aviso(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  useEffect(function(){ if(!s.aviso) return; var t=setTimeout(function(){d({type:"LIMPAR_AVISO"});},3200); return function(){clearTimeout(t);}; },[s.aviso && s.aviso.t]);
  if(!s.aviso) return null;
  var tom = TONS[s.aviso.tom] || TONS.ok, perto = Date.now()-ultimo.t < 4000 && ultimo.t>0, W = 260;
  var pos = perto ? {left:Math.max(8, Math.min(ultimo.x+14, window.innerWidth-W-8)), top:Math.max(8, Math.min(ultimo.y-64, window.innerHeight-90))} : {right:20, bottom:20};
  return e("div",{key:s.aviso.t, role:"status", className:"toast-sobe fixed z-50 flex max-w-[260px] items-start gap-2 rounded-lg bg-popover px-3 py-2 text-[13px] font-medium leading-snug shadow-lg ring-1 ring-foreground/10", style:Object.assign({borderLeft:"4px solid "+tom[0]}, pos)},
    e("span",{className:"mt-px grid size-4 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white", style:{background:tom[0]}}, tom[1]), e("span",null, s.aviso.txt));
}

export { Aviso };
