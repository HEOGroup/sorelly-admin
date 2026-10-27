// Sorelly Admin · kits novos Curitiba — components/grade-janelas.js
// Grade de dias e períodos (7 dias x manhã, tarde e noite). Serve para a revendedora (janelas livres) e para a representante (quando atende).
// valor = {seg:"mt", ...}; cada letra é um período (m manhã, t tarde, n noite).
import { DIAS, PERIODOS } from "@/apps/kits-novos/domain/regioes-rep";
import { e } from "@/shared/react";

function GradeJanelas(p){
  var v = p.valor || {};
  var alterna = function(d, l){
    if(p.somenteLeitura) return;
    var atual = String(v[d]||""), nova = atual.indexOf(l)>=0 ? atual.replace(l, "") : atual+l;
    var o = Object.assign({}, v); o[d] = nova.split("").sort().join(""); p.onChange(o);
  };
  return e("div",{className:"grid gap-1", style:{gridTemplateColumns:"4.5rem repeat(7, minmax(0, 1fr))"}},
    e("span"),
    DIAS.map(function(d){ return e("span",{key:d[0], className:"text-center text-[11px] font-medium uppercase tracking-[.05em]"}, d[1]); }),
    PERIODOS.map(function(per){ return [e("span",{key:"r"+per[0], className:"flex h-7 items-center text-[12px]"}, per[1])].concat(DIAS.map(function(d){
      var on = String(v[d[0]]||"").indexOf(per[0])>=0;
      return e("button",{key:d[0]+per[0], type:"button", disabled:p.somenteLeitura, "aria-pressed":on, title:d[1]+" · "+per[1],
        onClick:function(){ alterna(d[0], per[0]); },
        className:"h-7 rounded-md border text-[12px] "+(on ? "border-primary bg-primary/25 font-semibold text-primary" : "border-border bg-card hover:bg-white/10")}, on ? "✓" : ""); })); }));
}

export { GradeJanelas };
