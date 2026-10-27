// Sorelly Admin · montagem — pages/cadastro/DesMetricas.js
// Desempenho do cadastro › Métricas: decisões (aprovadas × reprovadas) no período, em faixa de totais, gráfico por dia e tabela por dia.
import { Bloco, FaixaTotais, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { FiltrosDesempenho, nPct, paramsDe, textoPeriodo, dbr } from "@/apps/montagem/pages/cadastro/des-comum";
import { metricas } from "@/apps/montagem/domain/cadastro-leads";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var VERDE = "#4ADE80", VERMELHO = "#F87171";
var pct = function(a, b){ return b<=0 ? 0 : Math.round(a/b*1000)/10; };

function GraficoDiario(p){
  var serie = p.serie, n = serie.length, mx = 1, hv = useState(null), sel = hv[0], setSel = hv[1], H = 140;
  serie.forEach(function(x){ mx = Math.max(mx, x.aprovados, x.reprovados); });
  var passo = n<=16 ? 1 : n<=40 ? 2 : Math.ceil(n/20), pt = sel!=null ? serie[sel] : null;
  return e(Bloco,{t:"Decisões por dia", dir:e("span",{className:"text-[12px] tabular-nums"}, pt ? dbr(pt.data)+" · "+pt.aprovados+" aprovadas · "+pt.reprovados+" reprovadas" : textoPeriodo(p.periodo))},
    e("div",{className:"flex items-end gap-px border-b border-border", style:{height:H}, onMouseLeave:function(){ setSel(null); }},
      serie.map(function(x, i){
        var ha = Math.round(x.aprovados/mx*(H-6)), hr = Math.round(x.reprovados/mx*(H-6));
        return e("div",{key:x.data, title:dbr(x.data)+": "+x.aprovados+" aprovadas, "+x.reprovados+" reprovadas", onMouseEnter:function(){ setSel(i); }, onClick:function(){ setSel(i); },
          className:"flex h-full min-w-0 flex-1 cursor-pointer items-end justify-center gap-px rounded-t "+(sel===i ? "bg-white/10" : "hover:bg-white/5")},
          e("i",{className:"block w-1/2 max-w-3 rounded-t-sm", style:{height:x.aprovados>0 ? Math.max(3, ha) : 0, background:VERDE}}),
          e("i",{className:"block w-1/2 max-w-3 rounded-t-sm", style:{height:x.reprovados>0 ? Math.max(3, hr) : 0, background:VERMELHO}}));
      })),
    e("div",{className:"mt-1 flex gap-px"}, serie.map(function(x, i){ return e("span",{key:x.data, className:"min-w-0 flex-1 whitespace-nowrap text-center text-[10px]"}, i%passo===0 ? x.data.slice(8, 10) : ""); })));
}

function DesMetricas(p){
  var s = use().state, m = metricas(s.cl, paramsDe(p.f)), k = m.kpis, dias = m.serie.filter(function(x){ return x.aprovados || x.reprovados; }).reverse();
  var taxaCor = k.decididos===0 ? "" : k.taxaAprovacao>=60 ? "text-success" : k.taxaAprovacao<40 ? "text-destructive" : "";
  return e("div",{className:"flex flex-col gap-3"},
    e(FiltrosDesempenho,{f:p.f, set:p.set}),
    e(FaixaTotais,{itens:[{t:"Aprovadas", v:String(k.aprovados), cor:"text-success"}, {t:"Reprovadas", v:String(k.reprovados), cor:k.reprovados ? "text-destructive" : ""},
      {t:"Taxa de aprovação", v:nPct(k.taxaAprovacao), cor:taxaCor}, {t:"Pendentes agora", v:String(k.pendentes), cor:k.pendentes ? "text-warning" : ""}, {t:"Decisões de hoje", v:String(k.decisoesHoje)}]}),
    e(GraficoDiario,{serie:m.serie, periodo:m.periodo}),
    e(Bloco,{t:"Decisões por dia (tabela)"},
      e(TabelaP,{minW:560, cols:[{t:"Data", w:120, c:1}, {t:"Aprovadas", c:1}, {t:"Reprovadas", c:1}, {t:"Total", c:1}, {t:"Taxa", c:1}]},
        dias.length ? dias.map(function(x){ var t = x.aprovados+x.reprovados;
          return e(Tr,{key:x.data}, e(Td,{c:true}, dbr(x.data)), e(Td,{c:true, cor:x.aprovados ? "text-success" : ""}, String(x.aprovados)), e(Td,{c:true, cor:x.reprovados ? "text-destructive" : ""}, String(x.reprovados)),
            e(Td,{c:true}, String(t)), e(Td,{c:true}, nPct(pct(x.aprovados, t))));
        }) : e(Tr,{key:"vazio"}, e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, "—")))));
}

export { DesMetricas };
