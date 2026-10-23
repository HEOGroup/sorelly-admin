// Sorelly Admin · montagem e bipagem — ui/table.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { MONO } from "@/apps/montagem/ui/input";
import { e } from "@/shared/react";

function TH(p){ return e("th",{className:"whitespace-nowrap border-b border-border px-3 py-2.5 text-sm font-semibold uppercase tracking-wide text-foreground "+(p.c?"text-center":p.r?"text-right":"text-left")+" "+(p.className||"")}, p.children); }
function TD(p){ return e("td",{className:"px-3 py-2.5 text-sm "+(p.wrap?"":"whitespace-nowrap ")+(p.c?"text-center ":p.r?"text-right "+MONO+" ":"")+" "+(p.className||""), colSpan:p.colSpan, title:p.title}, p.children); }
var TR = "border-b border-border transition-colors last:border-0 hover:bg-muted/40";
function Tabela(p){
  // semLimite: tabelas curtas (poucas linhas) não precisam de rolagem própria — a página cresce e mostra tudo
  return e("div",{className:"overflow-hidden rounded-xl border border-border bg-card"},
    e("div",{className: p.semLimite ? "overflow-x-auto" : "max-h-[32rem] overflow-auto"},
      e("table",{className:"w-full border-collapse text-sm "+(p.min||"min-w-[54rem]")},
        e("thead",{className: p.semLimite ? undefined : "sticky top-0 z-20"}, e("tr",{className:"bg-sidebar"}, p.cols.map(function(c,i){ return e(TH,{key:i, r:c.r, c:c.c}, c.t); }))),
        e("tbody",null, p.children))));
}

export { TH, TD, TR, Tabela };
