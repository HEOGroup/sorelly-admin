// Sorelly Admin — pages/InadimplenciaFin.js
// Financeiro → Inadimplência: dívida e valor recuperado mês a mês, % recuperado, e as compras internas dos funcionários (vendido e pago).
// Valores simulados com o que o Marcus passou (jan–set e 01–09/10); editáveis. Depois a tela liga nos lançamentos reais.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { MESES_LONGO } from "@/apps/montagem/domain/financeiro";
import { comprasDoMes, inadDoMes } from "@/apps/montagem/domain/inadimplencia-fin";
import { BK, N1 } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { MONO, MoneyInput } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e } from "@/shared/react";
import React from "react";

function AbaInadimplenciaFin(){
  var cx = use(), s = cx.state, d = cx.dispatch, ano = new Date().getFullYear(), mesAtual = new Date().getMonth();
  var meses = []; for(var i=0;i<=mesAtual;i++) meses.push(i);
  var inad = meses.map(function(m){ return Object.assign({mes:m}, inadDoMes(s, ano, m)); });
  var comp = meses.map(function(m){ return Object.assign({mes:m}, comprasDoMes(s, ano, m)); });
  var soma = function(l, c){ return l.reduce(function(t,x){ return t+(x[c]||0); },0); };
  var totD = soma(inad,"divida"), totP = soma(inad,"pago"), totV = soma(comp,"vendido"), totCP = soma(comp,"pago");
  var pct = function(p, dv){ return dv>0 ? p/dv*100 : 0; };
  var cab = function(t){ return e("th",{key:t, className:"border-b border-border px-2 py-1.5 text-center text-[10.5px] font-semibold uppercase tracking-wide text-white/70"}, t); };
  var td = function(v, c){ return e("td",{className:"px-2 py-1 text-center text-[12.5px] "+(c||"")}, v); };
  var money = function(tipo, m, campo, v){ return e(MoneyInput,{value:v||0, sm:true, className:"w-full", label:MESES_LONGO[m]+" "+campo, onChange:function(x){ d({type:tipo, ano:String(ano), mes:m, campo:campo, valor:x}); }}); };
  var kpi = function(t, v, cor, nota){ return e("div",{className:"flex flex-col items-center rounded-xl border border-border bg-black/25 px-3 py-2"}, e("span",{className:"text-[10.5px] font-semibold uppercase tracking-wide text-white/70"}, t), e("b",{className:MONO+" text-[20px] leading-tight "+(cor||"")}, v), nota && e("span",{className:"text-[10.5px] text-white/60"}, nota)); };
  var im = inad[mesAtual], cm = comp[mesAtual];
  return e(React.Fragment,null,
    e(PageHead,{t:"Inadimplência", sub:"Quanto virou inadimplência em cada mês, quanto já foi recuperado e as compras internas dos funcionários. Valores de teste; edite direto na tabela."}),
    e("div",{className:"grid grid-cols-2 gap-3 md:grid-cols-4"},
      kpi("Dívida de "+MESES_LONGO[mesAtual].toLowerCase(), BK(im.divida), "text-destructive"), kpi("Recuperado no mês", BK(im.pago), "text-success", N1(pct(im.pago, im.divida))+"% do mês"),
      kpi("Compras internas (vendido)", BK(cm.vendido)), kpi("Compras internas (pago)", BK(cm.pago), "text-success", "falta "+BK(Math.max(0, cm.vendido-cm.pago)))),
    e(BlocoBarra,{cor:"vermelho", t:"Inadimplência mês a mês", sub:"dívida, recuperado e saldo de cada mês de "+ano},
      e("div",{className:"overflow-x-auto p-2"}, e("table",{className:"w-full min-w-[38rem] border-collapse"},
        e("thead",null, e("tr",null, ["Mês","Dívida","Recuperado","Saldo","% recuperado"].map(cab))),
        e("tbody",null, inad.map(function(x){ var saldo = x.divida-x.pago;
          return e("tr",{key:x.mes, className:"border-b border-border/40 "+(x.mes===mesAtual ? "bg-primary/10" : "")},
            td(MESES_LONGO[x.mes]+(x.mes===mesAtual ? " · até hoje" : ""), "text-left! font-semibold"), td(money("INAD_SET", x.mes, "divida", x.divida)), td(money("INAD_SET", x.mes, "pago", x.pago)),
            td(BK(saldo), MONO+" "+(saldo>0 ? "text-warning" : "text-success")), td(N1(pct(x.pago, x.divida))+"%", MONO+" text-primary")); }),
          e("tr",{key:"t", className:"bg-black/25 font-bold"}, td("Total do ano","text-left!"), td(BK(totD), MONO), td(BK(totP), MONO+" text-success"), td(BK(totD-totP), MONO+" text-warning"), td(N1(pct(totP, totD))+"%", MONO+" text-primary")))))),
    e(BlocoBarra,{cor:"azul", t:"Compras internas dos funcionários", sub:"peças vendidas aos funcionários e o que já foi pago (elas nunca pagam à vista)"},
      e("div",{className:"overflow-x-auto p-2"}, e("table",{className:"w-full min-w-[34rem] border-collapse"},
        e("thead",null, e("tr",null, ["Mês","Vendido","Pago","Falta pagar"].map(cab))),
        e("tbody",null, comp.map(function(x){ var falta = x.vendido-x.pago;
          return e("tr",{key:x.mes, className:"border-b border-border/40 "+(x.mes===mesAtual ? "bg-primary/10" : "")},
            td(MESES_LONGO[x.mes]+(x.mes===mesAtual ? " · até hoje" : ""), "text-left! font-semibold"), td(money("COMPRAS_SET", x.mes, "vendido", x.vendido)), td(money("COMPRAS_SET", x.mes, "pago", x.pago)),
            td(BK(Math.max(0,falta)), MONO+" "+(falta>0 ? "text-warning" : "text-success"))); }),
          e("tr",{key:"t", className:"bg-black/25 font-bold"}, td("Total do ano","text-left!"), td(BK(totV), MONO), td(BK(totCP), MONO+" text-success"), td(BK(Math.max(0,totV-totCP)), MONO+" text-warning")))))));
}

export { AbaInadimplenciaFin };
