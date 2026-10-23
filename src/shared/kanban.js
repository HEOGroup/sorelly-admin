// Sorelly Admin — shared/kanban.js
// KANBAN PADRÃO: colunas por etapa, cartões que se arrastam de uma coluna para outra (ou "Mover para…" no celular).
// Peça única do padrão visual (docs/design/PADRAO-VISUAL.md): todo fluxo por etapas (aprovação de cadastros, kits novos...) usa esta peça.
//
//   e(Kanban, {
//     colunas: [{k, titulo, cor, itens:[{id, arrastavel?: false, ...}], limite?, dica?, aceita?: bool ou function(item, de) (false = não aceita soltar)}],
//     card: function(item, coluna){ return elemento },        // conteúdo do cartão (o Kanban cuida do arrastar)
//     onMover: function(item, de, para){ ... },               // chamado ao soltar em outra coluna (ou escolher no "Mover para")
//     vazio: "Nenhum cadastro nesta etapa.",                  // texto da coluna sem cartões
//     unidade: ["revendedora","revendedoras"],                // (opcional) como contar no cabeçalho da coluna
//     semMover: true,                                         // (opcional) esconde o "Mover para…" (o detalhe abre ao clicar e tem o botão de avançar)
//     onAbrir: function(item){ ... }                          // (opcional) clique no cartão (fora do "Mover para…")
//   })
// Cada coluna mostra no máximo `limite` cartões (padrão 30) e um botão "Ver mais" (nada de rolagem dentro da coluna).
// Colunas ficam lado a lado e ajustam-se à largura: a lista rola para o lado arrastando o vazio (comportamento global do sistema).
import { e, useState } from "@/shared/react";

var LIMITE = 30;

// aceita: true/false para a coluna toda, ou função(item, de) que decide por cartão
function aceitaItem(c, item, de){ return typeof c.aceita==="function" ? !!c.aceita(item, de) : c.aceita!==false; }
function Cartao(p){
  var it = p.item, c = p.coluna, cols = p.colunas, st = useState(false), arr = st[0];
  return e("div",{draggable:it.arrastavel!==false, "data-sem-arrastar":true,
    onDragStart:function(ev){ try{ ev.dataTransfer.setData("text/plain", String(it.id)); ev.dataTransfer.effectAllowed = "move"; }catch(x){} p.setArrastando({item:it, de:c.k}); st[1](true); },
    onDragEnd:function(){ p.setArrastando(null); st[1](false); },
    className:"flex flex-col gap-1.5 rounded-lg bg-card p-2.5 text-center ring-1 ring-white/10 transition "+(arr ? "opacity-40" : it.arrastavel===false ? "" : "cursor-grab hover:ring-white/30"), style:{boxShadow:"inset 3px 0 0 "+c.cor}},
    e("div",{onClick:p.onAbrir ? function(){ p.onAbrir(it, c); } : undefined, className:p.onAbrir ? "cursor-pointer" : ""}, p.card(it, c)),
    !p.semMover && e("select",{value:"", "aria-label":"Mover para", onChange:function(ev){ var para = ev.target.value; if(para) p.onMover(it, c.k, para); }, className:"h-7 w-full cursor-pointer rounded-md bg-black/30 px-1 text-center text-[11.5px] text-white/70 ring-1 ring-white/10"},
      e("option",{value:""}, "Mover para…"), cols.filter(function(x){ return x.k!==c.k && aceitaItem(x, it, c.k); }).map(function(x){ return e("option",{key:x.k, value:x.k}, x.titulo); })));
}

function Coluna(p){
  var c = p.coluna, st = useState(false), sobre = st[0], vm = useState(false), todos = vm[0];
  var lim = c.limite || LIMITE, itens = todos ? c.itens : c.itens.slice(0, lim);
  var aceita = p.arrastando ? aceitaItem(c, p.arrastando.item, p.arrastando.de) : c.aceita!==false;
  return e("section",{
      onDragOver:function(ev){ if(aceita && p.arrastando && p.arrastando.de!==c.k){ ev.preventDefault(); if(!sobre) st[1](true); } },
      onDragLeave:function(){ st[1](false); },
      onDrop:function(ev){ ev.preventDefault(); st[1](false); if(aceita && p.arrastando && p.arrastando.de!==c.k) p.onMover(p.arrastando.item, p.arrastando.de, c.k); p.setArrastando(null); },
      className:"flex min-w-0 flex-col gap-2 rounded-xl bg-black/20 p-2 transition "+(sobre ? "ring-2" : "ring-1 ring-white/10"), style:sobre ? {boxShadow:"0 0 0 2px "+c.cor} : undefined},
    e("div",{className:"flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-center", style:{background:c.cor+"33", boxShadow:"inset 0 0 0 1px "+c.cor+"88"}},
      e("b",{className:"text-[13px] leading-tight"}, c.titulo),
      e("span",{className:"font-mono text-[12px] text-white/80"}, c.itens.length+" "+((p.unidade||["cartão","cartões"])[c.itens.length===1 ? 0 : 1])),
      c.dica && e("span",{className:"text-[10.5px] leading-tight text-white/60"}, c.dica)),
    itens.length ? itens.map(function(it){ return e(Cartao,{key:it.id, item:it, coluna:c, colunas:p.colunas, card:p.card, onMover:p.onMover, onAbrir:p.onAbrir, semMover:p.semMover, setArrastando:p.setArrastando}); })
      : e("p",{className:"px-2 py-4 text-center text-[12.5px] text-white/50"}, p.vazio || "Nenhum cartão nesta etapa."),
    !todos && c.itens.length>lim && e("button",{type:"button", onClick:function(){ vm[1](true); }, className:"rounded-lg bg-white/10 py-1.5 text-[12px] font-bold hover:bg-white/15"}, "Ver mais "+(c.itens.length-lim)));
}

function Kanban(p){
  var st = useState(null), arrastando = st[0], n = p.colunas.length;
  return e("div",{className:"overflow-x-auto pb-1"}, e("div",{className:"grid items-start gap-2", style:{gridTemplateColumns:"repeat("+n+", minmax(14.5rem, 1fr))"}},
    p.colunas.map(function(c){ return e(Coluna,{key:c.k, coluna:c, colunas:p.colunas, card:p.card, onMover:p.onMover, onAbrir:p.onAbrir, unidade:p.unidade, vazio:p.vazio, semMover:p.semMover, arrastando:arrastando, setArrastando:st[1]}); })));
}
export { Kanban };
