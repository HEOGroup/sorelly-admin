// Sorelly Admin · montagem — components/ir-para.js
// Campo na barra de cima: cola o endereço (completo ou só o final, ex.: /montagem/pf-negociacoes) e Enter leva direto para a tela.
import { e, useState } from "@/shared/react";

function IrPara(p){
  var st = useState(""), v = st[0], setV = st[1];
  var ir = function(){
    var t = String(v||"").trim(); if(!t) return;
    var caminho = t;
    try{ var u = new URL(t, window.location.origin); if(u.origin!==window.location.origin){ caminho = u.pathname+u.search; } else caminho = u.pathname+u.search+u.hash; }catch(x){}
    if(caminho.charAt(0)!=="/") caminho = "/"+caminho;
    p.navigate(caminho); setV("");
  };
  return e("input",{value:v, placeholder:"Colar endereço e Enter", title:"Cole o endereço que o Claude mandou e aperte Enter para ir direto à tela", "aria-label":"Ir para o endereço",
    className:"hidden h-9 w-44 shrink-0 rounded-lg bg-white/10 px-3 text-[12.5px] text-white placeholder:text-white/60 outline-none focus:bg-white/15 focus:ring-1 focus:ring-primary md:block lg:w-56",
    onChange:function(ev){ setV(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") ir(); }});
}

export { IrPara };
