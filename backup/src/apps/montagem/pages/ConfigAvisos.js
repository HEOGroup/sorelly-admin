// Sorelly Admin — pages/ConfigAvisos.js
// Tecnologia → Avisos. Define PARA QUEM vai cada aviso do sistema (marca as pessoas de cada tipo de alerta).
// Vale na hora: não tem botão de salvar. Quem está na lista recebe o alerta no canto da tela, com som.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { GRUPOS_PESSOAS, TIPOS, destinosDe } from "@/apps/montagem/domain/avisos";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e } from "@/shared/react";
import React from "react";

function AbaConfigAvisos(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  return e(React.Fragment,null,
    e(PageHead,{t:"Avisos", sub:"Escolha quem recebe cada alerta do sistema. Vale na hora e aparece no canto da tela da pessoa, com som."}),
    TIPOS.map(function(t){
      var ids = destinosDe(s, t.k);
      var alterna = function(id){ d({type:"AVISO_CFG", tipo:t.k, ids: ids.indexOf(id)>=0 ? ids.filter(function(x){ return x!==id; }) : ids.concat([id])}); };
      return e(BlocoBarra,{key:t.k, t:t.t, sub: t.k==="media_alta" && s.cfg && s.cfg.limiteMarcus ? "limite hoje: "+BK(s.cfg.limiteMarcus) : ""},
        e("div",{className:"flex flex-col gap-3 p-4"},
          e("p",{className:"text-[13.5px] text-muted-foreground"}, t.desc),
          e("div",{className:"grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"}, GRUPOS_PESSOAS.map(function(g){
            return e("div",{key:g.t, className:"flex flex-col gap-1.5 rounded-xl bg-muted/20 p-3 ring-1 ring-border"},
              e("b",{className:"text-[12.5px] uppercase tracking-wide text-primary"}, g.t),
              g.ps.map(function(p){ var on = ids.indexOf(p.id)>=0;
                return e("label",{key:p.id, className:"flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-[14px] hover:bg-white/5"},
                  e("input",{type:"checkbox", checked:on, onChange:function(){ alterna(p.id); }, className:"size-4"}), e("span",{className:on ? "font-bold" : ""}, p.nome)); })); })),
          e("p",{className:"text-[12.5px] font-semibold"}, ids.length===0 ? "Ninguém recebe este aviso." : ids.length+(ids.length===1 ? " pessoa recebe" : " pessoas recebem")+" este aviso.")));
    }));
}

export { AbaConfigAvisos };
