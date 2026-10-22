// Sorelly Admin · montagem — components/barra-cascata.js
// Barra de menus do topo, no modelo da DevMaster: UMA linha só, cada palavra abre uma lista e cada item da lista pode abrir outra ao lado (até 3 níveis).
// Cada nó: {nome, aba?, modo?, itens?}. Só aba = vai direto para a tela; itens = abre a lista. Itens sem permissão somem (e a palavra some se ficar vazia).
// Clique abre; com uma lista aberta, passar o mouse em outra palavra já troca. Clicar fora ou Esc fecha. Ctrl+clique abre a tela em outra aba (quando houver abas).
import { Icon } from "@/apps/montagem/ui/icon";
import { createPortal } from "react-dom";
import { e, Fragment, useEffect, useState } from "@/shared/react";

// deixa só o que a pessoa pode abrir
function filtrar(nos, pode){
  return nos.map(function(n){
    if(n.itens){ var it = filtrar(n.itens, pode); return it.length ? Object.assign({}, n, {itens:it}) : null; }
    return pode(n) ? n : null;
  }).filter(Boolean);
}
// o nó (ou algum filho) é a tela aberta agora
function contem(n, ativo){ return n.itens ? n.itens.some(function(x){ return contem(x, ativo); }) : ativo(n); }

function BarraCascata(p){
  var cor = p.cor || "#3B82F6", nos = filtrar(p.menu, p.pode);
  var st = useState(null), aberto = st[0], setAberto = st[1];   // {n: [{i, r}, ...]}: um item aberto por nível, com a posição de cada um na tela
  useEffect(function(){
    if(!aberto) return;
    var esc = function(ev){ if(ev.key==="Escape") setAberto(null); };
    window.addEventListener("keydown", esc); return function(){ window.removeEventListener("keydown", esc); };
  }, [aberto]);
  var fechar = function(){ setAberto(null); };
  var escolher = function(n, ev){ setAberto(null); p.abrir(n, ev); };
  // abre o nível `nivel` apontando para o item `i`, guardando onde ele está para posicionar a lista ao lado
  var abrirNivel = function(nivel, i, ev){ var r = ev.currentTarget.getBoundingClientRect(); setAberto((aberto||[]).slice(0, nivel).concat([{i:i, r:{l:r.left, t:r.top, b:r.bottom, rt:r.right}}])); };
  var painel = function(lista, nivel, pos){
    var largura = 224, esq = Math.min(pos.x, window.innerWidth-largura-8);
    return e("div",{key:"p"+nivel, className:"fixed z-50 max-h-[75vh] overflow-y-auto rounded-xl border bg-card p-1.5 shadow-2xl", style:{left:esq, top:pos.y, width:largura, borderColor:cor+"66", boxShadow:"0 18px 40px -12px rgba(0,0,0,.6), 0 0 0 1px "+cor+"22"}, onClick:function(ev){ ev.stopPropagation(); }},
      lista.map(function(n, i){
        var sel = aberto && aberto[nivel] && aberto[nivel].i===i, on = contem(n, p.ativo);
        return e("button",{key:n.nome+i, type:"button",
          onMouseEnter:function(ev){ if(n.itens) abrirNivel(nivel, i, ev); else setAberto((aberto||[]).slice(0, nivel)); },
          onClick:function(ev){ if(n.itens){ abrirNivel(nivel, i, ev); return; } escolher(n, ev); },
          className:"flex min-h-9 w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1 text-left text-[13px] leading-tight "+(on ? "font-semibold text-white " : "")+(sel ? "bg-white/10" : on ? "bg-white/5" : "hover:bg-white/5"),
          style:on ? {color:cor} : undefined},
          e("span",{className:"min-w-0 flex-1"}, n.nome), n.itens && e(Icon,{n:"chevron", s:12, className:"opacity-60"})); }));
  };
  // listas abertas, uma por nível
  var listas = [], atual = nos;
  if(aberto) for(var nv=0; nv<aberto.length; nv++){
    var no = atual[aberto[nv].i]; if(!no || !no.itens) break;
    var rr = aberto[nv].r;
    var xLado = rr.rt+4; if(xLado+224>window.innerWidth-8) xLado = Math.max(8, rr.l-224-4);   // sem espaço à direita, a lista abre do lado esquerdo
    listas.push(painel(no.itens, nv+1, nv===0 ? {x:rr.l, y:rr.b+4} : {x:xLado, y:rr.t-6}));
    atual = no.itens;
  }
  return e("div",{className:"flex w-full min-w-0 flex-nowrap items-stretch justify-between gap-0.5"},
    nos.map(function(n, i){
      var on = contem(n, p.ativo), sel = aberto && aberto[0] && aberto[0].i===i;
      return e("button",{key:n.nome, type:"button",
        onMouseEnter:function(ev){ if(aberto && aberto.length){ if(n.itens) abrirNivel(0, i, ev); else setAberto(null); } },
        onClick:function(ev){ if(n.itens){ if(sel) fechar(); else abrirNivel(0, i, ev); return; } escolher(n, ev); },
        style:{background:"linear-gradient(135deg,"+cor+(on||sel ? "66" : "33")+","+cor+(on||sel ? "26" : "0d")+")", boxShadow:"inset 0 0 0 1px "+cor+(on||sel ? "bb" : "55")},
        className:"flex h-9 min-w-0 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-md px-2 text-center text-[12.5px] leading-tight transition hover:brightness-125 "+(on ? "font-bold text-white" : "text-foreground/90")},
        e("span",{className:"truncate"}, n.nome), n.itens && e(Icon,{n:"chevrondown", s:11, className:"shrink-0 opacity-60"})); }),
    // as listas saem da barra (portal no <body>): a barra tem desfoque de fundo e isso faz o "fixed" medir a partir dela, deslocando a lista para a direita
    aberto && aberto[0] && createPortal(e(Fragment,null, e("div",{className:"fixed inset-x-0 bottom-0 z-40", style:{top:aberto[0].r.b}, onClick:fechar}), listas), document.body));
}

export { BarraCascata };
