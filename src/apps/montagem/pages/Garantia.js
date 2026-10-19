// Sorelly Admin · montagem — pages/Garantia.js
// Garantia: por enquanto só o acesso ao Garantify (site externo, abre em nova aba). Decisão de 16/10/2026.
import { Pagina } from "@/apps/montagem/components/padrao";
import { gaLink, gaLinkValido } from "@/apps/montagem/domain/garantia";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

function AbaGarantia(){
  var cx = use(), s = cx.state, link = gaLink(s);
  var ed = useState(false), novo = useState(link);
  function salvar(){
    if(!gaLinkValido(novo[0])) return;
    cx.dispatch({type:"GA", op:"link_set", link:novo[0].trim(), por:nomeDe(s.usuario)});
    ed[1](false);
  }
  return e(Pagina,null,
    e(PageHead,{t:"Garantia", sub:"Acesso ao Garantify, o sistema de garantias."}),
    e("div",{className:"mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl p-8 text-center ring-1 ring-white/15", style:{background:"linear-gradient(135deg, rgba(168,85,247,.22), rgba(168,85,247,.05))"}},
      e("div",{className:"text-[18px] font-semibold text-white"}, "Garantify"),
      e("a",{href:link, target:"_blank", rel:"noopener noreferrer", className:"rounded-xl px-6 py-3 text-[14px] font-semibold text-white", style:{background:"#A855F7"}}, "Abrir Garantify"),
      e("div",{className:"break-all text-[12px] text-white/70"}, link),
      ed[0]
        ? e("div",{className:"flex w-full gap-2"},
            e("input",{value:novo[0], onChange:function(ev){ novo[1](ev.target.value); }, "aria-label":"Endereço do Garantify", className:"h-9 min-w-0 flex-1 rounded-lg bg-black/30 px-3 text-[13px] ring-1 ring-white/15"}),
            e("button",{onClick:salvar, disabled:!gaLinkValido(novo[0]), className:"h-9 rounded-lg bg-white/15 px-3 text-[13px] text-white disabled:opacity-40"}, "Salvar"))
        : e("button",{onClick:function(){ novo[1](link); ed[1](true); }, className:"text-[12px] text-white/70 underline"}, "Trocar endereço")));
}
export { AbaGarantia };
