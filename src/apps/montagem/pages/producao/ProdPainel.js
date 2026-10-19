// Sorelly Admin · montagem — pages/producao/ProdPainel.js
// Produção → aba "Painel": produção por período (semana, mês ou tudo) e por filial, com variação contra o período anterior e dois gráficos simples (valor por categoria, top códigos).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Faixa, Mosaico, Pagina, BarraFiltros } from "@/apps/montagem/components/padrao";
import { PERIODOS, ROTULO_PERIODO, ROTULO_UNIDADE, UNIDADES, formatarInteiro, formatarReais, painelPeriodo } from "@/apps/montagem/domain/producao";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { Barra, COR, IndT, pc, usePr } from "@/apps/montagem/pages/producao/visualProd";
import { Sel, Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { e, useState } from "@/shared/react";

function AbaProdPainel(){
  var x = usePr(), sUn = useState(""), sPer = useState("mes");
  var pn = painelPeriodo(x.pr, {periodo:sPer[0], unidade:sUn[0] || null, topCodigos:8}), a = pn.agg, vazio = a.pecas===0 && a.valor===0;
  var maxCat = pn.categorias.reduce(function(m, c){ return Math.max(m, c.valor); }, 0) || 1, maxCod = pn.topCodigos.reduce(function(m, c){ return Math.max(m, c.valor); }, 0) || 1;
  var rotAnt = sPer[0]==="semana" ? "vs. semana anterior" : sPer[0]==="mes" ? "vs. mês anterior" : "";
  var tend = function(t){ return sPer[0]==="tudo" ? undefined : t; };
  return e(Pagina,null,
    e(BarraFiltros,null,
      e(Sel,{v:sUn[0], set:sUn[1], rot:"Filial", todos:"Todas as filiais", opcoes:UNIDADES.map(function(u){ return [u, ROTULO_UNIDADE[u]]; }), className:"w-44"}),
      e("div",{className:"inline-flex overflow-hidden rounded-lg ring-1 ring-white/15"}, PERIODOS.map(function(p){ var on = p===sPer[0];
        return e("button",{key:p, type:"button", onClick:function(){ sPer[1](p); }, className:"h-9 px-4 text-[13px] font-bold transition "+(on ? "text-white" : "bg-white/5 text-white/80 hover:bg-white/10"), style:on ? {background:"linear-gradient(135deg,"+COR+"88,"+COR+"33)"} : undefined}, ROTULO_PERIODO[p]); })),
      e("span",{className:"inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/5 px-3 text-[12.5px] font-bold ring-1 ring-white/10"}, e(Ph,{n:"calendar-blank", s:14, className:"text-white/70"}), pn.rotulo)),
    e(Faixa,{n:4},
      e(IndT,{t:"Peças produzidas", v:formatarInteiro(a.pecas), cor:COR, tend:tend(pn.tendPecas), rotTend:rotAnt}),
      e(IndT,{t:"Valor produzido", v:formatarReais(a.valor), cor:COR, tend:tend(pn.tendValor), rotTend:rotAnt}),
      e(IndT,{t:"Modelos", v:formatarInteiro(a.modelos), cor:"info"}),
      e(IndT,{t:"Funcionárias ativas", v:formatarInteiro(a.ativas), cor:"ok"})),
    vazio ? e(Vazio,{ic:"factory"}, "Nenhuma produção lançada neste período.") :
    e(Mosaico,{min:"26rem"},
      e(BlocoBarra,{cor:"turquesa", compacto:true, t:"Valor por categoria", dir:pn.categorias.length},
        e("div",{className:"flex flex-col gap-2 p-3"}, pn.categorias.map(function(c){ return e(Barra,{key:c.nome, rot:c.nome, pct:c.valor/maxCat, txt:formatarReais(c.valor)+" · "+pc(c.pecas)}); }))),
      e(BlocoBarra,{cor:"turquesa", compacto:true, t:"Top peças (código)", dir:pn.topCodigos.length},
        e("div",{className:"flex flex-col gap-2 p-3"}, pn.topCodigos.map(function(c){ return e(Barra,{key:c.nome, rot:c.nome, pct:c.valor/maxCod, txt:formatarReais(c.valor)+" · "+pc(c.pecas)}); })))));
}
export { AbaProdPainel };
