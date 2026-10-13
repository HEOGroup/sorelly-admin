// Sorelly Admin · montagem e bipagem — pages/CelularMontadora.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { papelDe } from "@/apps/montagem/domain/equipe";
import { resumoMontadora } from "@/apps/montagem/domain/regras";
import { Celular } from "@/apps/montagem/mobile/montadora";
import { Avatar } from "@/apps/montagem/mobile/theme";
import { use } from "@/apps/montagem/state/context";
import { Card } from "@/apps/montagem/ui/card";
import { MONO } from "@/apps/montagem/ui/input";
import { AlertaBadge, PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

function AbaCelular(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  // Montadora logada vê só o próprio celular; a supervisão pode ver o de qualquer uma
  var sup = papelDe(s.usuario)==="supervisao";
  var lg = useState(!sup), logado = lg[0], setLogado = lg[1];   // a montadora que entrou pelo site já cai no app dela; a supervisão começa na tela de entrada do celular
  return e(React.Fragment,null,
    e(PageHead,{t:"Celular da montadora", sub: sup ? "Simulação do app que cada montadora usa. Escolha quem está conectada." : "Seu app de montagem: próximo kit, cronômetro e resultado do dia."}),
    e("div",{className:"flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center"},
      e(Celular,{logado:logado, setLogado:setLogado}),
      sup && e(Card,{className:"flex w-full max-w-md flex-col gap-1 p-2!"},
        e("p",{className:"px-2 pb-1 pt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground"},"Conectar como"),
        s.montadoras.map(function(m, i){
          var r = resumoMontadora(m, s), on = s.celular===m.id;
          return e("button",{key:m.id, onClick:function(){ d({type:"CEL", id:m.id}); setLogado(true); },
              className:"flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors "+(on?"bg-sidebar-accent ring-1 ring-primary/40":"hover:bg-muted/50")},
            e(Avatar,{nome:m.nome, i:i, className:"size-8 text-sm"}),
            e("div",{className:"min-w-0 flex-1"},
              e("b",{className:"block text-sm"}, m.nome),
              e("span",{className:"text-[12px] text-muted-foreground"}, r.atual ? (r.atual.pausadoEm?"Pausada em ":"Montando ")+r.atual.rev : "Livre")),
            e("span",{className:MONO+" text-sm text-muted-foreground"}, r.hoje+" hoje"),
            e(AlertaBadge,{a:r.alerta, curto:true}));
        }))));
}

export { AbaCelular };
