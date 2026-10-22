// Sorelly Admin · kits novos Curitiba — ui/page.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { e } from "@/shared/react";

function PageHead(p){ return e("div",{className:"flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between"},
  e("div",{className:"flex min-w-0 flex-col gap-1"}, e("h1",{className:"font-heading text-2xl font-semibold tracking-wide"}, p.t), e("p",{className:"text-[15px] text-muted-foreground"}, p.sub)),
  p.children && e("div",{className:"flex flex-wrap gap-2"}, p.children)); }
function Secao(p){ return e("section",{className:"flex flex-col gap-3"},
  e("div",{className:"flex flex-wrap items-baseline justify-between gap-2"}, e("h2",{className:"font-heading text-lg font-semibold"}, p.t), p.sub && e("span",{className:"text-sm text-muted-foreground"}, p.sub)), p.children); }

export { PageHead, Secao };
