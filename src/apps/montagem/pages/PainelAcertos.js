// Sorelly Admin · montagem e bipagem — pages/PainelAcertos.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { BK, N1 } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { MONO, NumInput } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e } from "@/shared/react";
import React from "react";

// ── Painel dos acertos (Agendamento): único lugar onde se edita a base do mês e os acertos previstos ──
function AbaPainelAcertos(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var hoje = new Date(), ano = hoje.getFullYear(), mes = hoje.getMonth(), anoStr = String(ano);
  var meta = Object.assign({base:0, previstos:0}, ((s.metaMensal||{})[anoStr]||{})[mes]);
  var setMeta = function(campo, v){ d({type:"META_SET", ano:anoStr, mes:mes, campo:campo, valor:v}); };
  var entradas = Object.keys(s.faturamentoDiario||{}).sort();
  var doMes = entradas.filter(function(k){ return k.slice(0,7)===anoStr+"-"+String(mes+1).padStart(2,"0"); });
  var ultimaMes = doMes.length ? s.faturamentoDiario[doMes[doMes.length-1]] : null;
  var realizados = ultimaMes ? ultimaMes.acertos : 0;
  var TIERS = [{pct:94, bonus:200},{pct:95, bonus:300},{pct:96, bonus:600}];
  var editavel = function(lb, v, onChange){ return e("div",{className:"flex flex-col items-center gap-1 rounded-xl bg-card px-3 py-3 text-center ring-1 ring-border"},
    e("span",{className:"text-[11px] font-semibold uppercase tracking-wide"}, lb), e(NumInput,{value:v, onChange:onChange, className:"w-28! text-center! text-lg!"})); };
  var soLeitura = function(lb, v){ return e("div",{className:"flex flex-col items-center gap-1 rounded-xl bg-card px-3 py-3 text-center ring-1 ring-border"},
    e("span",{className:"text-[11px] font-semibold uppercase tracking-wide"}, lb), e("b",{className:MONO+" text-lg text-success"}, v)); };
  return e(React.Fragment,null,
    e(PageHead,{t:"Painel dos acertos", sub:"Único lugar onde a base do mês e os acertos previstos são editados. Os realizados vêm do lançamento diário da tela Faturamento."}),
    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-3"},
      editavel("Revendedoras c/ kit (início do mês)", meta.base, function(v){setMeta("base",v);}),
      editavel("Acertos previstos (mês)", meta.previstos, function(v){setMeta("previstos",v);}),
      soLeitura("Realizados até hoje", realizados)),
    e(BlocoBarra,{t:"Metas do mês", sub:"cada nível paga um bônus por funcionária, sobre os acertos previstos"},
      e("div",{className:"grid grid-cols-1 gap-3 p-4 sm:grid-cols-3"},
        TIERS.map(function(t){ var alvo = Math.round(meta.previstos*t.pct/100), faltam = Math.max(0, alvo-realizados), pctFeito = alvo>0 ? Math.min(100, realizados/alvo*100) : 0;
          return e("div",{key:t.pct, className:"flex flex-col items-center gap-1.5 rounded-xl border border-warning/30 bg-warning/5 p-3 text-center"},
            e("span",{className:"rounded-full bg-warning/20 px-2 py-0.5 text-[11px] font-bold text-warning"}, "META — "+t.pct+"%"),
            e("b",{className:MONO+" text-2xl"}, N1(pctFeito)+"%"),
            e("span",{className:"text-[12.5px]"}, "Faltam "+faltam),
            e("span",{className:"text-[11.5px]"}, "alvo: "+alvo+" acertos"),
            e("span",{className:"text-[11.5px] font-semibold text-success"}, "bônus: "+BK(t.bonus)+" / funcionária"),
            e("span",{className:"rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold text-warning"},"provisório")); }))));
}

export { AbaPainelAcertos };
