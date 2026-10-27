// Sorelly Admin · montagem — pages/cadastro/DesFunil.js
// Desempenho do cadastro › Funil: do contato inicial até o cadastro (acumulado), com as saídas (não respondem, reprovadas). FunilTabela também serve ao funil de Facebook Ads (com custo).
import { Bloco, FaixaTotais, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { BarraPct, FiltrosDesempenho, nInt, nPct, paramsDe, textoPeriodo } from "@/apps/montagem/pages/cadastro/des-comum";
import { funilDesempenho } from "@/apps/montagem/domain/cadastro-leads";
import { BKC } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { e } from "@/shared/react";

// etapas acumuladas + saídas. comCusto = colunas de custo por etapa (funil de Facebook Ads)
function FunilTabela(p){
  var custo = function(v){ return v==null ? "—" : BKC(v); };
  var cols = [{t:"Etapa", w:210, c:1}, {t:"Pessoas", w:100, c:1}, {t:"% do início", w:100, c:1}, {t:"% da anterior", w:130, c:1}, {t:"Proporção", c:1}].concat(p.comCusto ? [{t:"Custo por etapa", w:130, c:1}, {t:"Custo acumulado", w:140, c:1}] : []);
  return e(TabelaP,{cols:cols, minW:p.comCusto ? 860 : 620},
    p.stages.map(function(x){
      return e(Tr,{key:x.slug}, e(Td,{c:true, forte:true}, x.nome), e(Td,{c:true, forte:true}, nInt(x.cumulative)), e(Td,{c:true}, nPct(x.ofStartPct)), e(Td,{c:true}, nPct(x.fromPrevPct)), e(Td,{c:true}, e(BarraPct,{pct:x.ofStartPct})),
        p.comCusto && e(Td,{c:true}, custo(x.cost)), p.comCusto && e(Td,{c:true}, custo(x.costCumulative)));
    }).concat((p.exits||[]).map(function(x){
      return e(Tr,{key:"s"+x.slug, apagado:!x.count}, e(Td,{c:true}, x.nome+" (saída)"), e(Td,{c:true, cor:x.count ? "text-warning" : ""}, nInt(x.count)), e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, ""),
        p.comCusto && e(Td,{c:true}, custo(x.cost)), p.comCusto && e(Td,{c:true}, ""));
    })));
}

function DesFunil(p){
  var s = use().state, fu = funilDesempenho(s.cl, paramsDe(p.f)), k = fu.kpis;
  return e("div",{className:"flex flex-col gap-3"},
    e(FiltrosDesempenho,{f:p.f, set:p.set}),
    e(FaixaTotais,{itens:[{t:"Total no período", v:nInt(k.totalPeriodo)}, {t:"Cadastradas", v:nInt(k.cadastradas), cor:k.cadastradas ? "text-success" : ""}, {t:"Conversão", v:nPct(k.conversao)},
      {t:"Reprovadas", v:nInt(k.reprovadas), cor:k.reprovadas ? "text-destructive" : ""}, {t:"Não respondem", v:nInt(k.naoRespondem), cor:k.naoRespondem ? "text-warning" : ""}]}),
    e(Bloco,{t:"Funil de desempenho · "+textoPeriodo(fu.periodo), dir:fu.insight ? e("span",{className:"text-[12px]"}, fu.insight) : null},
      k.totalPeriodo===0 ? e(FunilTabela,{stages:[], exits:[]}) : e(FunilTabela,{stages:fu.stages, exits:fu.exits})));
}

export { DesFunil, FunilTabela };
