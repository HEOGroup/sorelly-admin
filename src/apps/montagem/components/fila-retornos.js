// Sorelly Admin — components/fila-retornos.js
// Fila dos kits que voltaram das representantes e ainda faltam bipar. Degraus 30, 40... 100: a cor vai do amarelo ao vermelho forte.
// Usado no topo do Consolidado, na Visão geral e no Controle de kits.
import { COR_NIVEL, NIVEIS, corDaFila, nivelDe, qtdFila } from "@/apps/montagem/domain/retornos";
import { use } from "@/apps/montagem/state/context";
import { MONO } from "@/apps/montagem/ui/input";
import { e } from "@/shared/react";

function FilaRetornos(p){
  var s = use().state, qtd = qtdFila(s), nv = nivelDe(qtd), cor = corDaFila(qtd);
  return e("div",{className:"flex min-w-0 flex-col gap-2 rounded-xl border bg-black/25 p-3", style:{borderColor:cor+"99", boxShadow:nv>=0 ? "0 0 0 1px "+cor+"55" : undefined}},
    e("div",{className:"flex items-center gap-3"},
      e("b",{className:MONO+" text-[34px] leading-none", style:{color:cor}}, qtd),
      e("div",{className:"min-w-0 flex-1 leading-tight"},
        e("b",{className:"block text-[13px]"}, qtd===1 ? "kit esperando bipagem" : "kits esperando bipagem"),
        e("span",{className:"block text-[11.5px] text-white/70"}, nv<0 ? "Fila tranquila (alerta a partir de "+NIVEIS[0]+")" : "Passou de "+NIVEIS[nv]+": chame cadastro, Deysiane e encomendas para ajudar"))),
    e("div",{className:"flex gap-1", title:"Degraus de alerta"}, NIVEIS.map(function(n, i){
      return e("span",{key:n, className:"flex h-5 flex-1 items-center justify-center rounded text-[9.5px] font-bold "+(i<=nv ? "text-black" : "bg-white/10 text-white/50"), style:i<=nv ? {background:COR_NIVEL[i]} : undefined}, n); })),
    p.children);
}

export { FilaRetornos };
