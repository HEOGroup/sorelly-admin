// Sorelly Admin · montagem — mobile/rev-comum.js
// Peças comuns das telas do app da REVENDEDORA (cabeçalho preto com a seta de voltar). Estilo do app: cartões brancos, destaque dourado, cores sólidas.
// REGRA DOS APPS (Marcus, 19/10/2026): descrição de cartão ou botão em UMA linha só (texto curto, truncate whitespace-nowrap).
import { Icon } from "@/apps/montagem/ui/icon";
import { e } from "@/shared/react";

var BR = "txt-branco";
// título e (opcional) subtítulo pequeno; extra = elemento à direita
function CabecaTela(p){
  return e("div",{key:"h", className:"flex items-center justify-between gap-2 "+BR},
    e("div",{className:"flex min-w-0 items-center gap-2"},
      e("button",{onClick:p.onVoltar, "aria-label":"Voltar", className:"grid size-8 shrink-0 place-items-center rounded-full bg-[#2A2A2E]"}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
      e("div",{className:"flex min-w-0 flex-col"}, e("b",{className:"truncate whitespace-nowrap text-[16px] leading-tight"}, p.t), p.sub && e("span",{className:"truncate whitespace-nowrap text-[11px] opacity-70"}, p.sub))),
    p.extra);
}
// folha branca que ocupa o resto da tela, como nas outras telas do app
function FolhaTela(p){ return e("div",{key:"c", className:"-mx-4 -mb-10 flex min-h-[calc(100%-3.5rem)] flex-col gap-2 bg-white px-4 pb-10 pt-3"}, p.children); }
export { CabecaTela, FolhaTela };
