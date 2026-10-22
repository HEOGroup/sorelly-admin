// Sorelly Admin · montagem e bipagem — pages/CelularCondicionais.js
// App de quem confere as condicionais, com a tela de entrada dentro do celular e a lista de quem pode usar ao lado (diretoria, pelo computador).
import { LISTAGENS_RESP, SUPERVISORA, papelDe } from "@/apps/montagem/domain/equipe";
import { TelaLogin } from "@/apps/montagem/components/tela-login";
import { CelCondicionais } from "@/apps/montagem/mobile/condicionais";
import { IPhone15 } from "@/apps/montagem/mobile/iphone";
import { Avatar } from "@/apps/montagem/mobile/theme";
import { use } from "@/apps/montagem/state/context";
import { Card } from "@/apps/montagem/ui/card";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

function AbaCelularCond(){
  var s = use().state, sup = papelDe(s.usuario)==="supervisao";
  var lg = useState(true), logado = lg[0], setLogado = lg[1], qp = useState(sup ? LISTAGENS_RESP.id : s.usuario), quem = qp[0], setQuem = qp[1];
  var pessoas = [LISTAGENS_RESP, SUPERVISORA];   // quem tem o app das condicionais liberado (setor de condicionais e supervisão)
  var nome = (pessoas.find(function(x){ return x.id===quem; })||{}).nome;
  return e(React.Fragment,null,
    e(PageHead,{t:"Celular das condicionais", sub:"Modelo do app de quem confere as condicionais antes de liberar cada revendedora para a fila de montagem."}),
    e("div",{className:"flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center"},
      e(IPhone15,null, logado ? e(CelCondicionais) : e(TelaLogin,{compacto:true, titulo:"App das condicionais", teste:false, onEntrar:function(pes){ setQuem(pes.id); setLogado(true); }})),
      sup && e(Card,{className:"flex w-full max-w-sm flex-col gap-1 p-2!"},
        e("p",{className:"px-2 pb-1 pt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground"},"Conectar como"),
        pessoas.map(function(x){ var on = logado && x.id===quem; return e("button",{key:x.id, onClick:function(){ setQuem(x.id); setLogado(true); },
          className:"flex items-center gap-3 rounded-lg px-2 py-2 text-left "+(on?"bg-sidebar-accent ring-1 ring-primary/40":"hover:bg-muted/50")},
          e(Avatar,{nome:x.nome, i:0, className:"size-8 text-sm"}), e("b",{className:"text-sm"}, x.nome)); }),
        logado && e("button",{onClick:function(){ setLogado(false); }, className:"mt-1 h-9 rounded-lg bg-white/10 text-[13px] font-semibold hover:bg-white/15"},"Sair do celular"))));
}

export { AbaCelularCond };
