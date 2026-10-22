// Sorelly Admin · montagem e bipagem — ui/badge.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { Icon } from "@/apps/montagem/ui/icon";
import { e } from "@/shared/react";

var BADGE = {
  primary:"border-primary/30 bg-primary/15 text-primary",
  success:"border-success/30 bg-success/15 text-success",
  info:"border-info/30 bg-info/15 text-info",
  warning:"border-warning/30 bg-warning/15 text-warning",
  destructive:"border-destructive/30 bg-destructive/15 text-destructive",
  purple:"border-purple/30 bg-purple/15 text-purple",
  muted:"border-border bg-muted text-muted-foreground"
};
function badge(txt, tipo, ic){
  return e("span",{className:"inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-sm font-semibold whitespace-nowrap "+(BADGE[tipo]||BADGE.muted)},
    ic && e(Icon,{n:ic, s:13}), txt);
}

export { BADGE, badge };
