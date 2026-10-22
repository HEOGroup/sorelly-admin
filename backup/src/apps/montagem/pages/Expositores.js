// Sorelly Admin — pages/Expositores.js
// Encomendas e reposições → Controle de expositores: as fotos dos expositores arrumados pelas representantes (anexadas na entrega do kit novo).
// Aqui ficam as fotos de TODOS os expositores, com a revendedora, a representante e a data.
import { use } from "@/apps/montagem/state/context";
import { Vazio } from "@/apps/montagem/ui/card";
import { PageHead } from "@/apps/montagem/ui/page";
import { e } from "@/shared/react";
import React from "react";

function AbaExpositores(){
  var s = use().state;
  var lista = Object.keys(s.entregasKN||{}).map(function(id){ return s.entregasKN[id]; }).filter(function(x){ return x.fotoExpositor; })
    .sort(function(a,b){ return (b.fotoEm||0)-(a.fotoEm||0); });
  return e(React.Fragment,null,
    e(PageHead,{t:"Controle de expositores", sub:"Foto de cada expositor arrumado pela representante, anexada na entrega do kit novo."}),
    lista.length===0
      ? e(Vazio,{txt:"Nenhuma foto de expositor ainda. Quando a representante anexar a foto na entrega do kit novo, ela aparece aqui."})
      : e("div",{className:"grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"}, lista.map(function(x){
          return e("div",{key:x.kitId, className:"overflow-hidden rounded-xl bg-card ring-1 ring-border"},
            e("img",{src:x.fotoExpositor, alt:"Expositor de "+x.rev, className:"h-56 w-full object-cover"}),
            e("div",{className:"flex flex-col gap-0.5 p-3"},
              e("b",{className:"text-[15px]"}, x.rev),
              e("span",{className:"text-[13px] text-muted-foreground"}, "Representante "+(x.rep||"—")+" · "+(x.fotoEm ? new Date(x.fotoEm).toLocaleDateString("pt-BR") : ""))));
        })));
}

export { AbaExpositores };
