// Sorelly Admin · montagem e bipagem — pages/CelularBipagem.js
// Extraído de sorelly_admin_montagem_bipagem.html; depois com a tela de entrada (usuário e senha) dentro do celular, igual ao app da montadora:
// a diretoria abre pelo computador e escolhe, na lista ao lado, quem está usando; a bipadora que entrou pelo site já cai direto no app dela.
import { BIPADORAS, papelDe } from "@/apps/montagem/domain/equipe";
import { TelaLogin } from "@/apps/montagem/components/tela-login";
import { IPhone15 } from "@/apps/montagem/mobile/iphone";
import { AppBipagemRetirada } from "@/apps/montagem/mobile/bipagem";
import { Avatar } from "@/apps/montagem/mobile/theme";
import { use } from "@/apps/montagem/state/context";
import { Card } from "@/apps/montagem/ui/card";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

function AbaCelularBip(){
  var s = use().state, sup = papelDe(s.usuario)==="supervisao";
  var sl = useState(BIPADORAS.some(function(b){ return b.id===s.usuario; }) ? s.usuario : BIPADORAS[0].id), bid = sl[0], setBid = sl[1];
  var lg = useState(true), logado = lg[0], setLogado = lg[1];
  var bip = BIPADORAS.find(function(b){return b.id===bid;});
  return e(React.Fragment,null,
    e(PageHead,{t:"Celular da bipagem", sub:"Modelo do app da bipadora que faz a retirada com as representantes, em paralelo com o balcão. A retirada só vale depois que a representante confirma no app dela."}),
    e("div",{className:"flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center"},
      logado ? e(AppBipagemRetirada,{key:bid, bip:bip})
        : e(IPhone15,null, e(TelaLogin,{compacto:true, titulo:"App da bipagem", teste:false, usuarioInicial:"Natasha", senhaInicial:"123", onEntrar:function(pes){ if(BIPADORAS.some(function(b){ return b.id===pes.id; })) setBid(pes.id); setLogado(true); }})),
      sup && e(Card,{className:"flex w-full max-w-sm flex-col gap-1 p-2!"},
        e("p",{className:"px-2 pb-1 pt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground"},"Conectar como"),
        BIPADORAS.map(function(b){ var on = logado && b.id===bid; return e("button",{key:b.id, onClick:function(){ setBid(b.id); setLogado(true); },
          className:"flex items-center gap-3 rounded-lg px-2 py-2 text-left "+(on?"bg-sidebar-accent ring-1 ring-primary/40":"hover:bg-muted/50")},
          e(Avatar,{nome:b.nome, i:0, className:"size-8 text-sm"}), e("b",{className:"text-sm"}, b.nome)); }),
        logado && e("button",{onClick:function(){ setLogado(false); }, className:"mt-1 h-9 rounded-lg bg-white/10 text-[13px] font-semibold hover:bg-white/15"},"Sair do celular"))));
}

export { AbaCelularBip };
