// Sorelly Admin · montagem e bipagem — pages/CelularRevendedora.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { listagemDe } from "@/apps/montagem/domain/regras";
import { STATUS_LB } from "@/apps/montagem/domain/status";
import { AppRevendedora } from "@/apps/montagem/mobile/revendedora";
import { Avatar } from "@/apps/montagem/mobile/theme";
import { use } from "@/apps/montagem/state/context";
import { Card, Vazio } from "@/apps/montagem/ui/card";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

function AbaCelularRev(){
  var s = use().state;
  // revendedoras cujo kit já foi retirado (ou está pronto) pela representante
  var ks = s.kits.filter(function(k){return k.status==="retirado" || k.status==="bipado";});
  var sl = useState(null), kid = sl[0], setKid = sl[1];
  var k = ks.find(function(x){return x.id===kid;}) || ks[0];
  return e(React.Fragment,null,
    e(PageHead,{t:"App da revendedora", sub:"Modelo do app da revendedora (sistema à parte, nas lojas de aplicativos): tela inicial e o bloco Kit novo, que ela abre junto com a representante."}),
    !k ? e(Vazio,{txt:"Nenhum kit entregue ainda. Assim que um kit for bipado ou retirado, a revendedora aparece aqui."}) :
    e("div",{className:"flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center"},
      e(AppRevendedora,{key:k.id, k:k}),
      e(Card,{className:"flex w-full max-w-sm flex-col gap-1 p-2!"},
        e("p",{className:"px-2 pb-1 pt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground"},"Conectar como"),
        ks.map(function(x){ var on = x.id===k.id; return e("button",{key:x.id, onClick:function(){setKid(x.id);},
          className:"flex items-center gap-3 rounded-lg px-2 py-2 text-left "+(on?"bg-sidebar-accent ring-1 ring-primary/40":"hover:bg-muted/50")},
          e(Avatar,{nome:x.rev, i:0, className:"size-8 text-sm"}),
          e("div",{className:"min-w-0 flex-1"}, e("b",{className:"block truncate text-sm"}, x.rev), e("span",{className:"text-[12px] text-muted-foreground"}, listagemDe(s,x).rep+" · "+STATUS_LB[x.status])),
          x.confRev && e("span",{className:"text-[12px] font-semibold text-success"},"confirmou")); }))));
}

export { AbaCelularRev };
