// Sorelly Admin · montagem — components/bloco-resumo.js
// BLOCO DE RESUMO (Marcus, 02/11/2026): bloco com título e linhas escritas (rótulo, quantidade, percentual). É a ÚNICA exceção à regra "sem blocos de números no topo da tela":
// a fila de cartões com um número cada (Faixa, FaixaTotais) continua PROIBIDA. Aqui cada bloco é uma lista, com o total em destaque.
// Uso: e(BlocoResumo, {t:"Acertos de novembro", cab:["Situação","Revendedoras","Do total"], linhas:[{r:"Acertaram", v:"892", p:"42,2%", cor:"ok"}, {r:"Taxa", v:"42,2%", total:true}]})
//  - barra:true → cada linha mostra [rótulo, barra, valor]; use l.f (0 a 1) para o tamanho da barra. Sem barra → [rótulo, valor, percentual].
//  - cor da linha: "ok" (verde), "alerta" (amarelo), "ruim" (vermelho), "ouro". Tudo centralizado, nada abreviado (o rótulo quebra em duas linhas se não couber).
import { ESTADO } from "@/apps/montagem/components/padrao";
import { e } from "@/shared/react";

var COR = {ok:ESTADO.ok, alerta:ESTADO.alerta, ruim:ESTADO.ruim, ouro:ESTADO.total};

function BlocoResumo(p){
  var grade = p.barra ? "grid-cols-[1.3fr_1.5fr_56px]" : "grid-cols-[1.5fr_1fr_1fr]";
  return e("section",{className:"flex flex-col rounded-lg border border-border bg-card/60"},
    e("h2",{className:"rounded-t-lg border-b border-border px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[.05em] text-[#1a1306]", style:{background:"linear-gradient(90deg,#9A6F1E,#E8B84B 48%,#F5E7BE)"}}, p.t),
    p.cab && e("div",{className:"grid h-[30px] items-center border-b border-border bg-white/5 px-3 text-center text-[11px] font-semibold uppercase tracking-[.05em] "+grade},
      p.cab.map(function(c, i){ return e("span",{key:i}, c); })),
    // alturaMax (px): a lista rola dentro do bloco e o título e o cabeçalho das colunas ficam travados em cima (pedido do Marcus, 04/11/2026); compacto: linhas em 11 px
    e("div",{className:p.alturaMax ? "overflow-y-auto" : "", style:p.alturaMax ? {maxHeight:p.alturaMax} : undefined}, p.linhas.map(function(l){
      var cor = l.cor ? {color:COR[l.cor]} : undefined;
      return e("div",{key:l.r, className:"grid min-h-8 items-center gap-2 border-b border-border px-3 py-0.5 text-center "+(p.compacto ? "text-[11px]" : "text-[13px]")+" last:border-b-0 "+grade+(l.total ? " bg-white/5 font-semibold" : "")},
        e("span",null, l.r),
        p.barra
          ? [e("span",{key:"b", className:"block h-2 overflow-hidden rounded bg-white/10"}, e("i",{className:"block h-full bg-[#E8B84B]", style:{width:Math.max(2, Math.round((l.f || 0) * 100))+"%"}})),
             e("b",{key:"v", className:"font-semibold tabular-nums", style:cor}, l.v)]
          : [e("b",{key:"v", className:"font-semibold tabular-nums", style:cor}, l.v), e("span",{key:"p", className:"tabular-nums"}, l.p || "")]);
    })));
}
export { BlocoResumo };
