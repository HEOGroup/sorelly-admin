// Sorelly Admin · montagem — pages/Indicacoes.js
// Cadastro de revendedoras → Indicações: uma tela só, com abas (Funil, Resgates, Retiradas, Revendedoras e moedas, Histórico). Os corpos ficam em pages/indicacoes/.
import { AbaIndFunil, AbaIndHistorico } from "@/apps/montagem/pages/indicacoes/FunilHistorico";
import { AbaIndResgates, AbaIndRetiradas, AbaIndRevendedoras } from "@/apps/montagem/pages/indicacoes/ResgatesMoedas";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var ABAS_IND = [["funil","Funil de indicações",AbaIndFunil,"funnel"], ["resgates","Resgates de prêmios",AbaIndResgates,"gift"], ["retiradas","Retiradas",AbaIndRetiradas,"package"], ["revs","Revendedoras e moedas",AbaIndRevendedoras,"coins"], ["historico","Histórico",AbaIndHistorico,"clock-counter-clockwise"]];
var COR = "#F97316";   // cor do setor Cadastro de revendedoras

function AbaIndicacoes(){
  var st = useState("funil"), aba = st[0], atual = ABAS_IND.filter(function(a){ return a[0]===aba; })[0] || ABAS_IND[0];
  return e("div",{className:"flex flex-col gap-2.5"},
    e(PageHead,{t:"Indicações", sub:"Indicações de novas revendedoras, resgates de prêmios, retiradas e moedas."}),
    e("div",{className:"flex flex-wrap justify-center gap-1.5"}, ABAS_IND.map(function(a){ var on = a[0]===atual[0];
      return e("button",{key:a[0], type:"button", onClick:function(){ st[1](a[0]); }, className:"inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[13px] font-bold ring-1 transition "+(on ? "text-white" : "bg-muted/40 text-white/85 ring-white/15 hover:bg-white/10"),
        style:on ? {background:"linear-gradient(135deg, "+COR+"88, "+COR+"33)", boxShadow:"inset 0 0 0 1px "+COR+"cc"} : undefined}, e(Ph,{n:a[3], s:15}), a[1]); })),
    e(atual[2], {key:atual[0]}));
}
export { AbaIndicacoes };
