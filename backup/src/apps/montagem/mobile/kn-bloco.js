// Sorelly Admin — mobile/kn-bloco.js
// Bloco (acordeão) de cada etapa da entrega do kit novo, igual nos dois apps (representante e revendedora): mostra de quem já é o check.
import { TOTAL_PASSOS } from "@/apps/montagem/domain/kit-novo-entrega";
import { Icon } from "@/apps/montagem/ui/icon";
import { e } from "@/shared/react";

function Selo(p){
  return e("span",{className:"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold", style:{background:p.ok ? "#DCFCE7" : "#F3F4F6", color:p.ok ? "#15803D" : "#6B7280"}},
    e(Icon,{n:p.ok ? "check" : "clock", s:10}), p.rotulo);
}
// p: {meta:{n,t,ic,cor}, repOk, revOk, semCelular, atual (n da etapa liberada), aberto, onToggle, children, rodape}
function BlocoKN(p){
  var n = p.meta.n, travado = n > p.atual, feito = n < p.atual || (p.repOk && (p.revOk || p.semCelular) && n!==TOTAL_PASSOS);
  var cor = p.meta.cor;
  return e("div",{className:"overflow-hidden rounded-2xl bg-white shadow-sm ring-1 "+(n===p.atual ? "ring-2 ring-[#C9A13B]" : "ring-[#E5E7EB]")+(travado ? " opacity-55" : "")},
    e("button",{onClick:function(){ if(!travado) p.onToggle(); }, "aria-expanded":p.aberto, disabled:travado, className:"flex w-full items-center gap-2.5 px-3 py-2.5 text-left"},
      e("span",{className:"grid size-9 shrink-0 place-items-center rounded-xl", style:{background:feito ? "#DCFCE7" : cor+"1F", color:feito ? "#15803D" : cor}}, e(Icon,{n:feito ? "check" : (travado ? "lock" : p.meta.ic), s:18})),
      e("div",{className:"min-w-0 flex-1"},
        e("b",{className:"block text-[13.5px] leading-tight text-[#111827]"}, n+". "+p.meta.t),
        n!==TOTAL_PASSOS && e("span",{className:"mt-1 flex flex-wrap gap-1"}, e(Selo,{ok:p.repOk, rotulo:"Representante"}), e(Selo,{ok:p.revOk || (p.semCelular && p.repOk), rotulo:"Revendedora"}))),
      !travado && e(Icon,{n:p.aberto ? "chevrondown" : "chevron", s:15, className:"text-[#9CA3AF]"})),
    p.aberto && !travado && e("div",{className:"flex flex-col gap-3 border-t border-[#F3F4F6] bg-[#F9FAFB] p-3"}, p.children, p.rodape));
}

export { BlocoKN, Selo };
