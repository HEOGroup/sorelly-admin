// Sorelly Admin · montagem e bipagem — ui/button.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { Icon } from "@/apps/montagem/ui/icon";
import { e } from "@/shared/react";

var BTN = "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-[15px] font-medium transition-all active:translate-y-px disabled:pointer-events-none disabled:opacity-50";
var BTNV = {
  primary:"bg-primary text-primary-foreground hover:bg-primary/80",
  secondary:"border border-input bg-input/30 hover:bg-input/50",
  ghost:"hover:bg-muted/50",
  destructive:"bg-destructive/15 text-destructive hover:bg-destructive/25",
  success:"bg-success/15 text-success hover:bg-success/25"
};
function Btn(p){
  return e("button",{type:p.type||"button", onClick:p.onClick, disabled:p.disabled, title:p.title,
    className:BTN+" "+(BTNV[p.v||"secondary"])+(p.sm?" h-8! px-2.5! text-sm!":"")+" "+(p.className||"")},
    p.ic && e(Icon,{n:p.ic, s:p.sm?14:16}), p.children);
}

export { BTN, BTNV, Btn };
