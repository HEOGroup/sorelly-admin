// Sorelly Admin · montagem — components/ficha-moldura.js
// Moldura de ficha no estilo da ficha do pedido (Encomendas): cartão largo, barra azul no alto com o título e o X, fundo em degradê, coluna da esquerda fixa
// (pessoa) e coluna da direita que rola. Peças: FichaMoldura (casca), FichaCaixa (caixa com título azul escuro) e FichaPar (linha nome + valor).
import { e } from "@/shared/react";

function FichaMoldura(p){
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/60 p-3", onClick:p.fechar},
    e("div",{onClick:function(ev){ ev.stopPropagation(); }, className:"flex max-h-[94vh] w-full "+(p.largo ? "max-w-[1560px]" : "max-w-[1180px]")+" flex-col overflow-hidden rounded-xl border-2 border-[var(--bloco-titulo)] shadow-2xl", style:{background:"linear-gradient(180deg, #1d2c4d 0%, #12151c 58%)"}},
      e("div",{className:"relative flex shrink-0 items-center justify-center bg-[var(--bloco-titulo)] px-24 py-1 text-white"},
        e("h2",{className:"text-[11px] font-bold uppercase leading-tight"}, p.t),
        e("button",{type:"button", onClick:p.fechar, "aria-label":"Fechar", className:"absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-[13px] font-bold leading-none hover:bg-white/15"}, "×")),
      e("div",{className:"grid min-h-0 flex-1 gap-2.5 overflow-y-auto p-2.5 "+(p.semEsquerda ? "" : "lg:grid-cols-[300px_minmax(0,1fr)]")},
        !p.semEsquerda && e("div",{className:"flex flex-col gap-2 [&>*]:shrink-0"}, p.esquerda),
        e("div",{className:"flex min-w-0 flex-col gap-2 [&>*]:shrink-0"}, p.direita)),
      p.rodape && e("div",{className:"flex shrink-0 flex-wrap justify-end gap-2 border-t border-white/20 px-2.5 py-2"}, p.rodape)));
}
function FichaCaixa(p){
  return e("section",{className:"overflow-hidden rounded-lg border border-white/20 bg-black/20"},
    e("h3",{className:"flex items-center justify-between gap-2 bg-[var(--bloco-colunas)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.05em]"}, e("span",null, p.t), p.dir),
    e("div",{className:"px-2.5 py-2"+(p.grade ? " grid items-start gap-x-3 gap-y-2 sm:grid-cols-2" : "")}, p.children));
}
function FichaPar(p){
  return e("div",{className:"flex justify-between gap-3.5 border-b border-white/20 py-[3px] text-[13px] last:border-b-0"}, e("span",{className:"font-medium"}, p.t), e("span",{className:"text-right tabular-nums "+(p.cor||"")}, p.v));
}
export { FichaMoldura, FichaCaixa, FichaPar };
