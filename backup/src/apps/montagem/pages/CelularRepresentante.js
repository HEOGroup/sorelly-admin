// Sorelly Admin · montagem e bipagem — pages/CelularRepresentante.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { AppRepresentante } from "@/apps/montagem/mobile/representante";
import { Avatar } from "@/apps/montagem/mobile/theme";
import { use } from "@/apps/montagem/state/context";
import { Card } from "@/apps/montagem/ui/card";
import { MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useEffect, useState } from "@/shared/react";
import React from "react";

function AbaCelularRep(){
  var s = use().state;
  var abertas = s.listagens.filter(function(l){return !l.fechada;}), todas = s.listagens;
  var sl = useState((abertas[0]||todas[0]).id), lid = sl[0], setLid = sl[1];
  var l = todas.find(function(x){return x.id===lid;}) || todas[0];
  // abre DIRETO um acerto já preenchido (Andrielle, da Dayanne: venda, condicionais, pagamento, brindes e peças) no bloco do kit novo
  var ab = useState(null), abrir = ab[0], setAbrir = ab[1];
  var abrirAcerto = function(){ var dl = todas.find(function(x){ return x.rep==="Dayanne"; }); if(dl) setLid(dl.id); setAbrir({rev:"Andrielle Taborda", n:Date.now()}); };
  useEffect(function(){ if(/[?&]acerto=1/.test(window.location.search)) abrirAcerto(); }, []);
  return e(React.Fragment,null,
    e(PageHead,{t:"Celular da representante", sub:"Modelo do app da representante (sistema à parte): acompanha a montagem ao vivo, pede kit fora do prazo, mostra o código de retirada e avalia os kits."}),
    e("div",{className:"flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center"},
      e(AppRepresentante,{key:l.id, l:l, abrir:abrir}),
      e(Card,{className:"flex w-full max-w-sm flex-col gap-1 p-2!"},
        e("button",{onClick:abrirAcerto, className:"mb-1 rounded-lg bg-primary px-3 py-2 text-left text-sm font-bold text-primary-foreground hover:opacity-90"}, "▶ Abrir acerto já preenchido", e("span",{className:"block text-[11.5px] font-medium opacity-80"},"Andrielle (Dayanne) · com o kit novo")),
        e("p",{className:"px-2 pb-1 pt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground"},"Conectar como"),
        todas.map(function(x){ var ks = s.kits.filter(function(k){return k.lid===x.id;}), on = x.id===l.id;
          return e("button",{key:x.id, onClick:function(){setLid(x.id);},
              className:"flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors "+(on?"bg-sidebar-accent ring-1 ring-primary/40":"hover:bg-muted/50")},
            e(Avatar,{nome:x.rep, i:0, className:"size-8 text-sm"}),
            e("div",{className:"min-w-0 flex-1"}, e("b",{className:"block text-sm"}, x.rep),
              e("span",{className:"text-[12px] text-muted-foreground"}, "Retirada "+x.horario+(x.fechada?" · concluída":""))),
            e("span",{className:MONO+" text-sm text-muted-foreground"}, ks.length+" kits")); }))));
}

export { AbaCelularRep };
