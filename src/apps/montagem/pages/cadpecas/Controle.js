// Sorelly Admin · montagem — pages/cadpecas/Controle.js
// Cadastro de peças → "Controle do mês": quanto está sendo comprado de bruto em cada mês (pela data da compra), por fornecedor e por categoria, e o banho faturado no mês.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Faixa, Indicador, Pagina, Tab, Td } from "@/apps/montagem/components/padrao";
import { brl, controleMes, mesesCpc } from "@/apps/montagem/domain/cadastro-pecas";
import { rotuloMes } from "@/apps/montagem/pages/cadpecas/Pedidos";
import { NEUTRO, Sl, useCpc } from "@/apps/montagem/pages/cadpecas/visualCad";
import { Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { e, useState } from "@/shared/react";

var pc = function(f){ return (Math.round((f||0)*1000)/10)+"%"; };

function AbaControle(){
  var x = useCpc(), c = x.c, meses = mesesCpc(c), sm = useState(""), mes = sm[0] || meses[0] || "";
  if(!meses.length) return e(Pagina,null, e(Vazio,{ic:"chart-bar"}, "Ainda não há pedidos lançados."));
  var m = controleMes(c, mes), ant = controleMes(c, meses[meses.indexOf(mes)+1] || ""), t = m.t;
  var variacao = ant.t.pagar>0 ? (t.pagar-ant.t.pagar)/ant.t.pagar : null;
  var serie = meses.slice(0, 12).map(function(k){ var r = controleMes(c, k); return {mes:k, r:r}; });
  return e(Pagina,null,
    e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-black/25 px-3 py-2 ring-1 ring-white/10"},
      e(Sl,{v:mes, set:sm[1], rot:"Mês", opcoes:meses.map(function(k){ return [k, rotuloMes(k)]; }), className:"w-52"})),
    e(Faixa,{n:6},
      e(Indicador,{t:"Pedidos", v:String(t.n), cor:NEUTRO}),
      e(Indicador,{t:"Comprado (bruto)", v:brl(t.valor), cor:NEUTRO}),
      e(Indicador,{t:"Desconto médio", v:pc(t.desc), cor:NEUTRO}),
      e(Indicador,{t:"A pagar de bruto", v:brl(t.pagar), cor:NEUTRO, sub:variacao==null ? undefined : (variacao>=0 ? "+" : "")+pc(variacao)+" contra o mês anterior"}),
      e(Indicador,{t:"Peças compradas", v:String(t.pecas), cor:NEUTRO}),
      e(Indicador,{t:"Banho faturado ("+m.faturas+" fatura"+(m.faturas===1 ? "" : "s")+")", v:brl(m.banho), cor:NEUTRO})),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Por fornecedor em "+rotuloMes(mes), dir:m.forn.length},
      m.forn.length ? e(Tab,{cols:["Fornecedor", "Pedidos", "Comprado", "Desc.", "A pagar", "Peças", "% do mês"], className:"text-[12px]"},
        m.forn.map(function(l){ return e("tr",{key:l.forn, className:"border-t border-white/5"}, e(Td,{forte:true}, l.forn), e(Td,null, l.n), e(Td,{dinheiro:true}, brl(l.valor)), e(Td,null, pc(l.desc)), e(Td,{dinheiro:true, forte:true}, brl(l.pagar)), e(Td,null, l.pecas || "—"), e(Td,null, t.pagar>0 ? pc(l.pagar/t.pagar) : "—")); })
        .concat([e("tr",{key:"t", className:"border-t-2 border-white/25 bg-black/30"}, e(Td,{forte:true}, "Total"), e(Td,{forte:true}, t.n), e(Td,{dinheiro:true, forte:true}, brl(t.valor)), e(Td,{forte:true}, pc(t.desc)), e(Td,{dinheiro:true, forte:true}, brl(t.pagar)), e(Td,{forte:true}, t.pecas), e(Td,null))])) :
      e(Vazio,{ic:"package"}, "Sem compras neste mês.")),
    m.cats.length>0 && e(BlocoBarra,{cor:"azul", compacto:true, t:"Peças por categoria", dir:t.pecas},
      e(Tab,{cols:m.cats.map(function(k){ return k.nome; }).concat(["Total"]), className:"text-[12px]"}, e("tr",{className:"border-t border-white/5"}, m.cats.map(function(k){ return e(Td,{key:k.k}, k.q); }).concat([e(Td,{key:"t", forte:true}, t.pecas)])))),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Mês a mês", dir:serie.length+" meses"},
      e(Tab,{cols:["Mês", "Pedidos", "Comprado", "Desc.", "A pagar de bruto", "Peças", "Banho faturado"], className:"text-[12px]"},
        serie.map(function(l){ var on = l.mes===mes; return e("tr",{key:l.mes, onClick:function(){ sm[1](l.mes); }, className:"cursor-pointer border-t border-white/5 hover:bg-white/10 "+(on ? "bg-white/10" : ""), title:"Ver este mês"},
          e(Td,{forte:on}, rotuloMes(l.mes)), e(Td,null, l.r.t.n), e(Td,{dinheiro:true}, brl(l.r.t.valor)), e(Td,null, pc(l.r.t.desc)), e(Td,{dinheiro:true, forte:true}, brl(l.r.t.pagar)), e(Td,null, l.r.t.pecas || "—"), e(Td,{dinheiro:true}, brl(l.r.banho))); }))));
}
export { AbaControle };
