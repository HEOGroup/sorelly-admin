// Sorelly Admin · montagem — pages/CelularFuncionarios.js
// Celular das funcionárias (27/10/2026, pedido do Marcus): UM app só para montagem, bipagem e condicionais — a entrada é sempre
// a mesma; depois de entrar, cada pessoa vê só as tarefas do seu acesso (mobile/app-funcionarias.js). Substitui as 3 telas
// separadas que existiam antes (Celular da montadora, Celular da bipagem, Celular das condicionais).
import { ACESSOS, AppInterno, Entrada, acessoDoUsuario } from "@/apps/montagem/mobile/app-funcionarias";
import { IPhone15 } from "@/apps/montagem/mobile/iphone";
import { Avatar } from "@/apps/montagem/mobile/theme";
import { use } from "@/apps/montagem/state/context";
import { Card } from "@/apps/montagem/ui/card";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

function AbaCelularFunc(){
  var s = use().state;
  var doUsuario = acessoDoUsuario(s.usuario);   // quem já está logado no sistema cai direto no app dela, sem escolher nada
  var it = useState(doUsuario), inte = it[0], setInte = it[1];
  var entrada = e(Entrada,{titulo:"App das funcionárias", onEntrar:function(){ setInte(doUsuario || {pessoa:ACESSOS[0].pessoas[0], acesso:ACESSOS[0]}); }, onTeste:function(){ setInte(doUsuario || {pessoa:ACESSOS[0].pessoas[0], acesso:ACESSOS[0]}); }});
  return e(React.Fragment,null,
    e(PageHead,{t:"Celular das funcionárias", sub:"O mesmo app para montagem, bipagem e condicionais. A entrada é igual para todas; depois de entrar, cada uma vê só as tarefas do seu acesso."}),
    e("div",{className:"flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center"},
      e(IPhone15,null, inte && inte.pessoa ? e(AppInterno,{key:inte.acesso.k+"|"+inte.pessoa.id, pessoa:inte.pessoa, acesso:inte.acesso}) : entrada),
      e(Card,{className:"flex w-full max-w-sm flex-col gap-1 p-2!"},
        e("p",{className:"px-2 pb-1 pt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground"},"Conectar como"),
        ACESSOS.map(function(ac){ return e("div",{key:ac.k, className:"flex flex-col"},
          e("p",{className:"px-2 pb-0.5 pt-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-primary"}, ac.titulo, e("span",{className:"ml-1.5 font-semibold normal-case tracking-normal text-muted-foreground"}, "· "+ac.nota)),
          ac.pessoas.map(function(x, i){ var on = inte && inte.pessoa && inte.pessoa.id===x.id;
            return e("button",{key:x.id, onClick:function(){ setInte({pessoa:x, acesso:ac}); },
                className:"flex items-center gap-3 rounded-lg px-2 py-2 text-left "+(on?"bg-sidebar-accent ring-1 ring-primary/40":"hover:bg-muted/50")},
              e(Avatar,{nome:x.nome, i:i, className:"size-8 text-sm"}), e("b",{className:"text-sm"}, x.nome)); })); }),
        inte && e("button",{onClick:function(){ setInte(null); }, className:"mt-1 h-9 rounded-lg bg-white/10 text-[13px] font-semibold hover:bg-white/15"},"Sair do celular"))));
}

export { AbaCelularFunc };
