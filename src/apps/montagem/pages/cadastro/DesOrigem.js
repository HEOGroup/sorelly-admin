// Sorelly Admin · montagem — pages/cadastro/DesOrigem.js
// Desempenho do cadastro › Origem: de onde vêm as candidatas (tag do lead) e quanto cada origem aprova. Filtro de origem no bloco Filtros.
import { Bloco, FaixaTotais, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { BarraPct, FiltrosDesempenho, nInt, nPct, paramsDe, textoPeriodo } from "@/apps/montagem/pages/cadastro/des-comum";
import { origemPorTag, tagsDisponiveis } from "@/apps/montagem/domain/cadastro-leads";
import { CampoSel } from "@/apps/montagem/components/padrao-fin";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

function DesOrigem(p){
  var s = use().state, tg = useState(""), tag = tg[0], disp = tagsDisponiveis(s.cl);
  var o = origemPorTag(s.cl, paramsDe(p.f), tag ? [tag] : []), k = o.kpis, mx = o.origens.reduce(function(t, x){ return Math.max(t, x.volume); }, 1);
  var taxaCor = k.decididos===0 ? "" : k.taxaAprovacao>=60 ? "text-success" : k.taxaAprovacao<40 ? "text-destructive" : "";
  return e("div",{className:"flex flex-col gap-3"},
    e(FiltrosDesempenho,{f:p.f, set:p.set}, e(CampoSel,{key:"tag", t:"Origem", id:"des-tag", value:tag, onChange:tg[1], opcoes:[["", "Todas"]].concat(disp.map(function(t){ return [t.name, t.name+" ("+t.qtd+")"]; }))})),
    e(FaixaTotais,{itens:[{t:"Decididas", v:nInt(k.decididos)}, {t:"Origens", v:nInt(k.origens)}, {t:"Taxa de aprovação", v:nPct(k.taxaAprovacao), cor:taxaCor}, {t:"Origem líder", v:k.topOrigem || "—"}]}),
    e(Bloco,{t:"Aprovação por origem · "+textoPeriodo(o.periodo)},
      e(TabelaP,{minW:700, cols:[{t:"Origem", w:200, c:1}, {t:"Aprovadas", w:100, c:1}, {t:"Reprovadas", w:100, c:1}, {t:"Total", w:90, c:1}, {t:"Taxa", w:90, c:1}, {t:"Volume", c:1}]},
        o.origens.length ? o.origens.map(function(x){
          return e(Tr,{key:x.nome}, e(Td,{c:true, forte:true}, x.nome), e(Td,{c:true, cor:x.aprovados ? "text-success" : ""}, nInt(x.aprovados)), e(Td,{c:true, cor:x.reprovados ? "text-destructive" : ""}, nInt(x.reprovados)),
            e(Td,{c:true}, nInt(x.volume)), e(Td,{c:true}, nPct(x.taxaAprovacao)), e(Td,{c:true}, e(BarraPct,{pct:x.volume/mx*100})));
        }) : e(Tr,{key:"vazio"}, e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, "")))));
}

export { DesOrigem };
