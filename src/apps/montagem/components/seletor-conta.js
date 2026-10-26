// Sorelly Admin · montagem — components/seletor-conta.js
// Seletor de conta em LISTA que troca no mesmo lugar (Marcus, 26/10/2026, "opção 1"): abre embaixo do botão, com borda dourada. Primeiro os grupos (Conta da empresa, Família / sócio, Fornecedor...), clicou num grupo a mesma lista passa a mostrar os nomes, clicou num nome passa a mostrar as contas dele. A seta ← no canto esquerdo volta um nível.
// A lista cresce sozinha com o que for cadastrado: com mais de 10 linhas aparece uma busca e a lista rola (8 linhas por vez).
// nos = [{nome, itens:[...]}] ou folha {nome, id, conta}. onEscolher(id, conta).
import { createPortal } from "react-dom";
import { CAMPO } from "@/apps/montagem/components/padrao-fin";
import { e, Fragment, useEffect, useState } from "@/shared/react";

var LARG = 300;
var norm = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };

function SeletorConta(p){
  var st = useState(null), aberto = st[0], setAberto = st[1];   // {r:{l,b}, caminho:[nó...], q}
  useEffect(function(){
    if(!aberto) return;
    var esc = function(ev){ if(ev.key==="Escape") setAberto(null); };
    window.addEventListener("keydown", esc); return function(){ window.removeEventListener("keydown", esc); };
  }, [aberto]);
  var abre = function(ev){ if(aberto){ setAberto(null); return; } var r = ev.currentTarget.getBoundingClientRect(); setAberto({r:{l:r.left, b:r.bottom}, caminho:[], q:""}); };
  var atual = aberto ? (aberto.caminho.length ? aberto.caminho[aberto.caminho.length-1] : {nome:"Escolha a conta", itens:p.nos || []}) : null;
  var lista = atual ? atual.itens : [], muitos = lista.length>10;
  var q = aberto ? norm(aberto.q) : "", filtrada = muitos && q ? lista.filter(function(n){ return norm(n.nome).indexOf(q)>=0; }) : lista;
  var entra = function(no){ if(no.itens){ setAberto(Object.assign({}, aberto, {caminho:aberto.caminho.concat([no]), q:""})); return; } setAberto(null); p.onEscolher(no.id, no.conta || ""); };
  var volta = function(){ setAberto(Object.assign({}, aberto, {caminho:aberto.caminho.slice(0, -1), q:""})); };
  var painel = aberto && e("div",{className:"fixed z-50 overflow-hidden rounded-lg border-2 border-[#d9a63a]/85 bg-card text-white shadow-lg", style:{left:Math.max(4, Math.min(aberto.r.l, window.innerWidth-LARG-4)), top:aberto.r.b+2, width:LARG}, onClick:function(ev){ ev.stopPropagation(); }},
    e("div",{className:"flex min-h-9 items-center gap-2 border-b border-border bg-white/5 px-2"},
      aberto.caminho.length>0 && e("button",{type:"button", "aria-label":"Voltar", title:"Voltar", onClick:volta, className:"grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border bg-card text-[13px] hover:bg-white/10"}, "←"),
      e("div",{className:"min-w-0 flex-1"}, e("b",{className:"block break-words text-[13px] font-semibold leading-tight"}, atual.nome), aberto.caminho.length>1 && e("span",{className:"block text-[11px] leading-tight"}, aberto.caminho.slice(0, -1).map(function(n){ return n.nome; }).join(" › "))),
      e("span",{className:"shrink-0 text-[11px]"}, lista.length+(lista.length===1 ? " opção" : " opções"))),
    muitos && e("div",{className:"border-b border-border p-1.5"}, e("input",{type:"search", autoFocus:true, value:aberto.q, placeholder:"Buscar…", "aria-label":"Buscar conta", onChange:function(ev){ setAberto(Object.assign({}, aberto, {q:ev.target.value})); }, className:"h-7 w-full rounded-md border border-border bg-card px-2 text-[13px] text-white outline-none focus-visible:ring-2 focus-visible:ring-primary"})),
    e("div",{className:"max-h-56 overflow-y-auto"}, filtrada.length ? filtrada.map(function(no, i){
      return e("button",{key:no.nome+i, type:"button", onClick:function(){ entra(no); }, className:"flex min-h-7 w-full items-center justify-between gap-2 border-b border-border px-3 py-0.5 text-left text-[13px] leading-snug last:border-b-0 hover:bg-[#B8862B]"},
        e("span",{className:"min-w-0 flex-1 break-words"}, no.nome), no.itens && e("span",{"aria-hidden":true, className:"shrink-0 text-[11px]"}, no.itens.length+" ▸")); })
      : e("p",{className:"px-3 py-2 text-[13px]"}, "Nada encontrado.")),
    muitos && e("div",{className:"border-t border-border bg-white/[0.04] px-3 py-1 text-[11px]"}, "Mostrando "+filtrada.length+" de "+lista.length));
  return e(Fragment,null,
    e("button",{type:"button", "aria-label":p.rotulo, title:p.texto, onClick:abre, className:CAMPO+" !h-auto min-h-8 w-full min-w-0 max-w-full items-center justify-between gap-2 py-0.5 text-left flex"}, e("span",{className:"min-w-0 flex-1 break-words leading-snug"+(p.vazio ? " text-foreground/70" : "")}, p.texto), e("span",{"aria-hidden":true, className:"shrink-0"}, "▾")),
    aberto && createPortal(e(Fragment,null, e("div",{className:"fixed inset-0 z-40", onClick:function(){ setAberto(null); }}), painel), document.body));
}

export { SeletorConta };
