// Sorelly Admin · montagem e bipagem — ui/card.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { Icon } from "@/apps/montagem/ui/icon";
import { e } from "@/shared/react";

function Card(p){ return e("div",{className:"rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10 "+(p.className||"")}, p.children); }
var KPI_FUNDO = "rounded-xl bg-linear-to-br from-[#E8B84B]/20 via-[#E8B84B]/6 to-card text-foreground ring-1 ring-[#E8B84B]/25 shadow-[inset_0_1px_0_rgba(255,255,255,.07)]";
function KPI(p){
  var compacto = p.compacto;
  return e("div",{className:KPI_FUNDO+" flex min-w-0 flex-col items-center justify-center text-center "+(compacto?"gap-1.5 px-4 py-3":"gap-2 p-4")},
    e("span",{className:"max-w-full truncate font-semibold uppercase tracking-wide text-foreground "+(compacto?"text-[12px]":"text-sm"), title:p.l}, p.l),
    e("span",{className:"whitespace-nowrap font-mono text-2xl font-bold leading-none tabular-nums tracking-tight "+(p.tom||"text-foreground")}, p.v),
    p.sub && e("p",{className:"max-w-full truncate text-foreground/80 "+(compacto?"text-[12px]":"text-sm"), title:p.sub}, p.sub));
}
function Vazio(p){
  return e("div",{className:"flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center"},
    e(Icon,{n:"inbox", s:24, className:"text-muted-foreground"}), e("p",{className:"text-sm text-muted-foreground"}, p.txt||"Nenhum registro no per\u00edodo."));
}

export { Card, KPI_FUNDO, KPI, Vazio };
