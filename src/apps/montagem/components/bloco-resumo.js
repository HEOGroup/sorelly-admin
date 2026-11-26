// Sorelly Admin · montagem — components/bloco-resumo.js
// BLOCO DE RESUMO (Marcus, 02/11/2026): bloco com título e linhas escritas (rótulo, quantidade, percentual). É a ÚNICA exceção à regra "sem blocos de números no topo da tela":
// a fila de cartões com um número cada (Faixa, FaixaTotais) continua PROIBIDA. Aqui cada bloco é uma lista, com o total em destaque.
// Uso: e(BlocoResumo, {t:"Acertos de novembro", cab:["Situação","Revendedoras","Do total"], linhas:[{r:"Acertaram", v:"892", p:"42,2%", cor:"ok"}, {r:"Taxa", v:"42,2%", total:true}]})
//  - barra:true → cada linha mostra [rótulo, barra, valor]; use l.f (0 a 1) para o tamanho da barra. Sem barra → [rótulo, valor, percentual].
//  - cor da linha: "ok" (verde), "alerta" (amarelo), "ruim" (vermelho), "ouro". Tudo centralizado, nada abreviado (o rótulo quebra em duas linhas se não couber).
//  - azul:true (Kits novos, 24/11/2026) = visual de tabela no azul padrão: título e cabeçalho azuis, corpo no azul da planilha, linhas de tabela (brancas) entre as linhas E entre as colunas, nada quebra, linhas de 18 px, cantos retos.
//  - grade: outra grade de colunas (ex.: "grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr_1fr]") com linhas l.c = lista de células; negrito = índices das células em negrito; preenche:true = as linhas dividem a altura do bloco.
import { ESTADO } from "@/apps/montagem/components/padrao";
import { e } from "@/shared/react";

var COR = {ok:ESTADO.ok, alerta:ESTADO.alerta, ruim:ESTADO.ruim, ouro:ESTADO.total};
var AZ = {fundo:"color-mix(in srgb, var(--bloco-colunas) 38%, transparent)", forte:"color-mix(in srgb, var(--bloco-colunas) 75%, transparent)"};   // o corpo do bloco no mesmo azul da tabela de baixo, nunca preto
// célula com linha de tabela à direita (a última fica sem), texto centralizado na altura toda da linha
var CEL = " flex items-center justify-center self-stretch border-r border-border px-2 last:border-r-0 whitespace-nowrap";

function BlocoResumo(p){
  var az = !!p.azul, grade = p.grade || (p.barra ? "grid-cols-[1.3fr_1.5fr_56px]" : "grid-cols-[1.5fr_1fr_1fr]"), cel = az ? CEL : "";
  return e("section",{className:"flex flex-col "+(az ? "" : "rounded-lg border border-border bg-card/60"), style:Object.assign({}, p.altura ? {height:p.altura} : {}, az ? {background:AZ.fundo} : {})},
    // azul:true = barra de título no azul padrão do Financeiro, letra branca, sem caixa alta e sem cantos redondos; sem a opção continua dourada como antes
    e("h2",{className:(az ? "" : "rounded-t-lg ")+"border-b border-border px-3 text-center text-[11px] font-semibold "+(az ? "bg-[var(--bloco-titulo)] py-0.5 text-white" : "py-2 uppercase tracking-[.05em] text-[#1a1306]"), style:az ? undefined : {background:"linear-gradient(90deg,#9A6F1E,#E8B84B 48%,#F5E7BE)"}}, p.t),   // padrao-ok: visual dourado antigo, só nas telas que não usam azul
    p.cab && e("div",{style:az ? {background:"var(--bloco-colunas)"} : undefined, className:"grid items-center border-b border-border text-center text-[11px] font-semibold "+(az ? "h-[22px] " : "h-[30px] bg-white/5 px-3 uppercase tracking-[.05em] ")+grade},   // padrao-ok: visual antigo sem azul
      p.cab.map(function(c, i){ return e("span",{key:i, className:az ? CEL : undefined}, c); })),   // padrao-ok: o visual antigo (sem azul) mantém a caixa alta, só nas telas que não usam azul
    // alturaMax (px): a lista rola dentro do bloco e o título e o cabeçalho das colunas ficam travados em cima (pedido do Marcus, 04/11/2026); compacto: linhas em 11 px
    e("div",{className:p.altura ? "min-h-0 flex-1 overflow-y-auto" : p.preenche ? "flex min-h-0 flex-1 flex-col" : p.alturaMax ? "overflow-y-auto" : "", style:p.alturaMax && !p.altura ? {maxHeight:p.alturaMax} : undefined}, (p.minLinhas && p.cab ? p.linhas.concat(Array.apply(null, Array(Math.max(0, p.minLinhas-p.linhas.length))).map(function(){ return {r:"", c:p.cab.map(function(){ return ""; })}; })) : p.linhas).map(function(l, li){
      var cor = l.cor ? {color:COR[l.cor]} : undefined, neg = p.negrito || [];
      return e("div",{key:li, style:l.total && az ? {background:AZ.forte} : undefined, className:"grid items-center border-b border-border text-center "+(az ? "min-h-[18px] " : "gap-2 px-3 ")+(p.compacto ? "py-0 text-[11px]" : "min-h-8 py-0.5 text-[13px]")+" last:border-b-0 "+(p.preenche ? "flex-1 " : "")+grade+(l.total ? (az ? " font-semibold" : " bg-white/5 font-semibold") : "")},
        l.c ? l.c.map(function(x, i){ return e(neg.indexOf(i)>=0 ? "b" : "span",{key:i, className:"tabular-nums"+cel+(neg.indexOf(i)>=0 ? " font-semibold" : "")}, x); }) : [
          e("span",{key:"r", className:cel}, l.r),
          p.barra
            ? [e("span",{key:"b", className:"block h-2 overflow-hidden rounded bg-white/10"}, e("i",{className:"block h-full bg-[#E8B84B]", style:{width:Math.max(2, Math.round((l.f || 0) * 100))+"%"}})),
               e("b",{key:"v", className:"font-semibold tabular-nums"+cel, style:cor}, l.v)]
            : [e("b",{key:"v", className:"font-semibold tabular-nums"+cel, style:cor}, l.v), e("span",{key:"p", className:"tabular-nums"+cel, style:l.pcor ? {color:COR[l.pcor]} : undefined}, l.p || "")]]);
    })),
    p.rodape && e("div",{className:"grid items-center gap-2 rounded-b-lg border-t border-border bg-white/5 px-3 text-center font-semibold "+(p.compacto ? "min-h-[26px] text-[11px]" : "min-h-8 text-[13px]")+" "+grade},
      e("span",null, p.rodape.r), e("b",{className:"font-semibold tabular-nums"}, p.rodape.v), e("span",{className:"tabular-nums"}, p.rodape.p || "")));
}
export { BlocoResumo };
