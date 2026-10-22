// Sorelly Admin · kits novos Curitiba — ui/table.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { MONO } from "@/apps/kits-novos/ui/input";
import { e } from "@/shared/react";

function TH(p){ return e("th",{className:"whitespace-nowrap border-b border-border px-3 py-2.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground "+(p.r?"text-right":"text-left")+" "+(p.className||"")}, p.children); }
function TD(p){ return e("td",{className:"px-3 py-2.5 text-sm "+(p.wrap?"":"whitespace-nowrap ")+(p.r?"text-right "+MONO:"")+" "+(p.className||""), colSpan:p.colSpan}, p.children); }
var TR = "border-b border-border transition-colors last:border-0 hover:bg-muted/40";
function Tabela(p){ return e("div",{className:"overflow-hidden rounded-xl border border-border bg-card"}, e("div",{className:(p.alto?"max-h-[46rem]":"max-h-[32rem]")+" overflow-auto"},
  e("table",{className:"w-full border-collapse text-sm "+(p.min||"min-w-[54rem]")},
    e("thead",{className:"sticky top-0 z-20"}, e("tr",{className:"bg-sidebar"}, p.cols.map(function(c,i){ return e(TH,{key:i, r:c.r, className:c.cor||""}, c.t); }))),
    e("tbody",null, p.children)))); }

export { TH, TD, TR, Tabela };
