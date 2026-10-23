// Sorelly Admin · montagem e bipagem — ui/input.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { e } from "@/shared/react";

var INPUT = "h-10 rounded-lg border border-input bg-input/30 px-3 text-[15px] placeholder:text-muted-foreground outline-none focus:ring-3 focus:ring-ring/50";
var MONO = "font-mono tabular-nums";
function brl(n){ return new Intl.NumberFormat("pt-BR",{style:"currency", currency:"BRL"}).format(n||0); }
function MoneyInput(p){
  return e("input",{inputMode:"numeric", value:brl(p.value||0), autoFocus:p.autoFocus, "aria-label":p.label, disabled:p.disabled,
    className:INPUT+" text-right "+MONO+(p.sm?" h-8! text-sm! px-2!":"")+(p.disabled?" opacity-60":"")+" "+(p.className||""),
    onChange:function(ev){ var d = ev.target.value.replace(/\D/g,"").slice(0,11); p.onChange(Number(d||0)/100); }});
}
function NumInput(p){
  return e("input",{type:"number", step:p.step||"1", value:p.value, "aria-label":p.label,
    className:INPUT+" text-right w-28 "+MONO+" "+(p.className||""),
    onChange:function(ev){ p.onChange(parseFloat(ev.target.value)||0); }});
}

export { INPUT, MONO, brl, MoneyInput, NumInput };
