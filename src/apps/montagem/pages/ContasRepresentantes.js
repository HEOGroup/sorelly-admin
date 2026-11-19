// Sorelly Admin · montagem — pages/ContasRepresentantes.js
// Financeiro → Pagamentos → "Contas das representantes" (Marcus, 12/11/2026): a tabela das contas fixas usa a largura toda, tudo em uma linha e centralizado.
// As Regras do Pix e o Valor fora do normal NÃO ficam mais na tela: o botão "Regras do Pix" mora DENTRO da barra azul do bloco, no canto esquerdo, e abre um bloco no meio com os dois (fecha no Fechar, no Esc ou clicando fora).
// Mesmo desenho do Direcionar: blocos de borda azul, linhas brancas, células de menu coloridas.
import { PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { AbaContasRep, BlocoQuantidades, BlocoValorFora } from "@/apps/montagem/pages/DirecionarPix";
import { BlocoRegraObrigatoria, RegrasPix } from "@/apps/montagem/pages/RegrasPix";
import { e, useEffect, useState } from "@/shared/react";

function AbaContasRepresentantes(){
  var st = useState(false), aberto = st[0], setAberto = st[1];
  useEffect(function(){ if(!aberto) return; var esc = function(ev){ if(ev.key==="Escape") setAberto(false); }; window.addEventListener("keydown", esc); return function(){ window.removeEventListener("keydown", esc); }; }, [aberto]);
  return e("div",{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 flex flex-col gap-1.5 pl-3 md:-mx-3 md:-mb-3 md:pl-4"},
    e(AbaContasRep,{acao:e("button",{type:"button", onClick:function(){ setAberto(true); }, title:"Abre as Regras & Condições", className:"h-[22px] whitespace-nowrap rounded-md border border-white/40 bg-white/10 px-2.5 text-[11px] font-semibold text-white hover:bg-white/20"}, "Regras & Condições")}),
    aberto && e("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", onClick:function(){ setAberto(false); }},
      e("div",{className:PADRAO_BLOCOS+" flex max-h-[90vh] w-full max-w-[1320px] flex-col gap-3 overflow-y-auto rounded-xl border-2 border-[var(--bloco-titulo)] bg-background p-3", role:"dialog", "aria-label":"Regras & Condições", onClick:function(ev){ ev.stopPropagation(); }},
        e("div",{className:"flex min-h-8 items-center justify-between rounded-lg bg-[var(--bloco-titulo)] px-3 text-white"}, e("h2",{className:"text-[13px] font-bold"}, "Regras & Condições"),
          e("button",{type:"button", onClick:function(){ setAberto(false); }, className:"h-[22px] whitespace-nowrap rounded-md border border-white/40 bg-white/10 px-2.5 text-[11px] font-semibold text-white hover:bg-white/20"}, "Fechar")),
        e("div",{className:"grid grid-cols-1 items-start gap-3 min-[1100px]:grid-cols-[380px_minmax(0,1fr)]"},
          e("div",{className:"flex min-w-0 flex-col gap-3"}, e(BlocoQuantidades,null), e(BlocoRegraObrigatoria,null), e(BlocoValorFora,null)),
          e("div",{className:"min-w-0"}, e(RegrasPix,null))))));
}
export { AbaContasRepresentantes };
