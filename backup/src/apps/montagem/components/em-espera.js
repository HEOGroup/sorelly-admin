// Sorelly Admin · montagem e bipagem — components/em-espera.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { badge } from "@/apps/montagem/ui/badge";
import { Icon } from "@/apps/montagem/ui/icon";
import { PageHead } from "@/apps/montagem/ui/page";
import { e } from "@/shared/react";
import React from "react";

function EmEspera(p){
  return e(React.Fragment,null,
    e(PageHead,{t:p.t, sub:p.sub}, badge("Em espera","warning","clock")),
    e(BlocoBarra,{cor:p.cor||"ouro", t:"O que vai fazer", sub:p.resumo},
      e("div",{className:"grid grid-cols-1 gap-2 p-4 md:grid-cols-2"}, p.itens.map(function(x,i){
        return e("div",{key:i, className:"flex items-start gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-[13.5px]"},
          e("span",{className:"grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-[12px] font-bold text-primary"}, i+1), x); }))),
    e(BlocoBarra,{cor:"roxo", t:"Precisa para começar"},
      e("ul",{className:"flex flex-col gap-1.5 p-4 text-[13.5px]"}, p.falta.map(function(x,i){ return e("li",{key:i, className:"flex items-center gap-2"}, e(Icon,{n:"alert", s:14, className:"text-warning"}), x); }))));
}

export { EmEspera };
