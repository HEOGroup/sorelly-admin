// Sorelly Admin · kits novos Curitiba — ui/card.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { Icon, P } from "@/apps/kits-novos/ui/icon";
import { e } from "@/shared/react";

function Card(p){ return e("div",{className:"rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10 "+(p.className||"")}, p.children); }
function KPI(p){
  return e(Card,{className:"flex flex-col gap-1.5"},
    e("span",{className:"text-sm font-semibold uppercase tracking-wide text-muted-foreground"}, p.l),
    e("div",{className:"font-mono text-2xl font-bold leading-none tabular-nums tracking-tight "+(p.tom||"")}, p.v),
    p.sub && e("p",{className:"text-sm text-muted-foreground"}, p.sub));
}
function Vazio(p){
  return e("div",{className:"flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center"},
    e(Icon,{n:"inbox", s:24, className:"text-muted-foreground"}), e("p",{className:"text-sm text-muted-foreground"}, p.txt||"Nenhum registro no per\u00edodo."));
}
// ═══════════════════════════════════════════════════════════
// KITS NOVOS · CURITIBA · telas (layout do Admin real)
// ═══════════════════════════════════════════════════════════
P.map = ["M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z","M9 3v15","M15 6v15"];
P.table = ["M3 5h18v14H3z","M3 10h18","M3 15h18","M9 5v14"];
P.columns = ["M4 4h16v16H4z","M10 4v16","M16 4v16"];
P.flag = ["M4 22V4","M4 4h12l-2 4 2 4H4"];
P.arrowright = ["M5 12h14","m12 5 7 7-7 7"];
P.ban = ["M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z","m4.9 4.9 14.2 14.2"];
P.refresh = ["M3 12a9 9 0 0 1 15.5-6.4L21 8","M21 3v5h-5","M21 12a9 9 0 0 1-15.5 6.4L3 16","M3 21v-5h5"];
P.message = ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"];
P.dots = ["M12 12h.01","M19 12h.01","M5 12h.01"];
P.book = ["M4 19.5A2.5 2.5 0 0 1 6.5 17H20","M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"];
P.rules = ["M9 11l3 3L22 4","M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"];
P.chevdown = ["m6 9 6 6 6-6"];
P.chevright = ["m9 18 6-6-6-6"];
P.calendar = ["M8 2v4","M16 2v4","M3 10h18","M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"];

export { Card, KPI, Vazio };
