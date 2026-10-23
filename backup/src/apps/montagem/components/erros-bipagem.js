// Sorelly Admin — components/erros-bipagem.js
// Erros de bipagem achados pela representante na CONFERÊNCIA DAS PEÇAS com a câmera (app da representante): o que faltou ou veio a mais.
// Aparece no Consolidado (histórico por revendedora, para o acerto e a conferência interna) e na Listagem (bonificamos a bipadora, então o erro pesa).
// O desconto em dinheiro só aparece para quem vê valores (bipadora nunca vê valor).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { papelDe } from "@/apps/montagem/domain/equipe";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { MONO } from "@/apps/montagem/ui/input";
import { e } from "@/shared/react";

function BlocoErrosBipagem(){
  var s = use().state, lista = s.errosBipagem || [], veValor = papelDe(s.usuario)==="supervisao", perda = s.cfg.perdaFalta || 0;
  if(!lista.length) return null;
  var total = lista.reduce(function(t,x){ return t+x.erros; },0);
  var dh = function(x){ var h = new Date(x.em); return x.data.split("-").reverse().slice(0,2).join("/")+" "+String(h.getHours()).padStart(2,"0")+":"+String(h.getMinutes()).padStart(2,"0"); };
  return e(BlocoBarra,{cor:"vermelho", t:"Erros de bipagem · conferência da representante", sub:total+(total===1 ? " peça" : " peças")+" com erro · quem bipou o kit recebe o erro"+(veValor ? " (desconto de "+BK(perda)+" por peça)" : "")},
    e("div",{className:"flex flex-col gap-1.5 p-2"}, lista.map(function(x){
      return e("div",{key:x.id, className:"flex flex-col gap-1 rounded-xl bg-black/25 px-3 py-2 text-[12.5px]"},
        e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-0.5"},
          e("b",{className:MONO+" text-[12px] text-white/70"}, dh(x)), e("b",null, x.rev), e("span",{className:"text-white/70"},"rep. "+(x.rep||"—")),
          e("span",{className:"ml-auto rounded-md bg-destructive/20 px-2 py-0.5 font-bold text-destructive"}, "Erro de "+x.bipadora+" · "+x.erros+(x.erros===1 ? " peça" : " peças")+(veValor ? " · −"+BK(x.erros*perda) : ""))),
        x.nFaltas>0 && e("span",{className:"text-white/85"}, e("b",null,"Faltou: "), x.faltas.map(function(f){ return f.codigo+(f.qtd>1 ? " ×"+f.qtd : "")+" "+f.desc.toLowerCase().slice(0,38); }).slice(0,4).join(" · ")+(x.faltas.length>4 ? " · +"+(x.faltas.length-4)+" itens" : "")),
        x.nSobras>0 && e("span",{className:"text-white/85"}, e("b",null,"Peça que não é do kit: "), x.sobras.map(function(y){ return y.codigo; }).join(", ")),
        e("span",{className:"text-[11px] text-white/55"},"Condicionais "+x.condicionais.join(", ")+" · conferidas "+x.lidas+" de "+x.esperadas+" peças · montado por "+x.montadora)); })));
}

export { BlocoErrosBipagem };
