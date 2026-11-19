// Sorelly Admin · montagem — components/seletor-conta.js
// Seletor de conta em LISTA que troca no mesmo lugar (Marcus, 26/10/2026, "opção 1"): abre embaixo do botão, com borda dourada. Primeiro os grupos (Conta da empresa, Família / sócio, Fornecedor...), clicou num grupo a mesma lista passa a mostrar os nomes, clicou num nome passa a mostrar as contas dele. A seta ← no canto esquerdo volta um nível.
// A lista abre POR CIMA de qualquer janela (z 90 e 95; as janelas de pagamento usam 80). Antes ela abria por baixo da janela de pagamento e nenhuma conta dava para escolher (12/11/2026).
// A lista cresce sozinha com o que for cadastrado: com mais de 10 linhas aparece uma busca e a lista rola (8 linhas por vez).
// nos = [{nome, itens:[...]}] ou folha {nome, id, conta}. onEscolher(id, conta).
import { createPortal } from "react-dom";
import { CAMPO } from "@/apps/montagem/components/padrao-fin";
import { nomePropio as bonito } from "@/apps/montagem/lib/nome-conta";   // escrita padrão dos nomes: uma fonte só (lib/nome-conta.js)
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
  var abre = function(ev){ if(aberto){ setAberto(null); return; } var rb = ev.currentTarget.getBoundingClientRect(), cel = p.centro && ev.currentTarget.closest ? ev.currentTarget.closest("td") : null, r = cel ? cel.getBoundingClientRect() : rb; setAberto({r:{l:r.left, b:rb.bottom, w:r.width}, caminho:[], q:""}); };
  var atual = aberto ? (aberto.caminho.length ? aberto.caminho[aberto.caminho.length-1] : {nome:p.titulo || "Escolha a conta", itens:p.nos || []}) : null;
  var lista = atual ? atual.itens : [], muitos = lista.length>10;
  var q = aberto ? norm(aberto.q) : "", filtrada = muitos && q ? lista.filter(function(n){ return norm(n.nome).indexOf(q)>=0; }) : lista;
  var entra = function(no){ if(no.itens){ setAberto(Object.assign({}, aberto, {caminho:aberto.caminho.concat([no]), q:""})); return; } setAberto(null); p.onEscolher(no.id, no.conta || ""); };
  var volta = function(){ setAberto(Object.assign({}, aberto, {caminho:aberto.caminho.slice(0, -1), q:""})); };
  var painel = aberto && e("div",{className:"fixed z-[95] overflow-hidden rounded-lg border-2 "+(p.centro ? "border-[var(--bloco-titulo)]" : "border-[#d9a63a]/85")+" bg-card text-white shadow-lg", style:{left:Math.max(4, Math.min(aberto.r.l, window.innerWidth-(p.centro ? aberto.r.w : (p.larg || LARG))-4)), top:aberto.r.b+2, width:p.centro ? aberto.r.w : (p.larg || LARG)}, onClick:function(ev){ ev.stopPropagation(); }},
    e("div",{className:"flex items-center gap-2 border-b border-border bg-[var(--bloco-titulo)] px-2 text-white "+(p.centro ? "min-h-8" : "min-h-9")},
      aberto.caminho.length>0 && e("button",{type:"button", "aria-label":"Voltar", title:"Voltar", onClick:volta, className:"grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-card text-[13px] hover:bg-white/10"}, "←"),
      e("div",{className:"min-w-0 flex-1"}, e("b",{className:"block break-words text-[13px] font-semibold leading-tight"}, bonito(atual.nome)), (aberto.caminho.length>1 && !p.centro) && e("span",{className:"block text-[11px] leading-tight"}, aberto.caminho.slice(0, -1).map(function(n){ return bonito(n.nome); }).join(" › "))),
      (p.centro ? null : e("span",{className:"shrink-0 text-[11px]"}, lista.length+(lista.length===1 ? " opção" : " opções")))),
    muitos && e("div",{className:"border-b border-border p-1.5"}, e("input",{type:"search", autoFocus:true, value:aberto.q, placeholder:"Buscar…", "aria-label":"Buscar conta", onChange:function(ev){ setAberto(Object.assign({}, aberto, {q:ev.target.value})); }, className:"h-8 w-full rounded-md border border-border bg-card px-2 text-[13px] text-white outline-none focus-visible:ring-2 focus-visible:ring-primary"})),
    lista.length>0 && lista[0].heads && e("div",{className:"flex gap-2 border-b border-border bg-[var(--bloco-colunas)] px-3 py-1 text-[11px] font-medium uppercase tracking-[.05em] text-white"}, lista[0].heads.map(function(h, k){ return e("span",{key:k, className:((p.centro || p.esquerda) && k===0 ? "text-left" : "text-center")+(k>0 && lista[0].w && lista[0].w.length===2 ? " pl-4" : ""), style:{width:(lista[0].w ? lista[0].w[k] : 100/lista[0].heads.length)+"%"}}, h); })),
    e("div",{className:(p.centro ? "h-44" : "max-h-56")+" overflow-y-auto overflow-x-hidden"}, filtrada.length ? filtrada.map(function(no, i){
      return e("button",{key:no.nome+i, type:"button", onClick:function(){ entra(no); }, className:"flex min-h-8 w-full items-center justify-between gap-2 border-b border-border px-3 py-0.5 text-left text-[13px] leading-snug last:border-b-0 hover:bg-[#B8862B]"},
        no.cols ? e(Fragment,null, no.cols.map(function(t, k){ return e("span",{key:k, className:"min-w-0 whitespace-nowrap "+((p.centro || p.esquerda) && k===0 ? "text-left" : "text-center")+(k===0 ? " font-semibold" : "")+(k>0 && no.w && no.w.length===2 ? " pl-4" : ""), style:Object.assign({width:(no.w ? no.w[k] : 100/no.cols.length)+"%"}, no.cores && no.cores[k] ? {color:no.cores[k]} : {}), title:bonito(t)}, bonito(t)); }))
          : e("span",{className:"min-w-0 flex-1 break-words"}, bonito(no.nome)), no.itens && e("span",{"aria-hidden":true, className:"shrink-0 text-[11px]"}, no.itens.length+" ▸")); })
      : e("p",{className:"px-3 py-2 text-[13px]"}, "Nada encontrado.")),
    muitos && e("div",{className:"border-t border-border bg-white/[0.04] px-3 py-1 text-[11px]"}, "Mostrando "+filtrada.length+" de "+lista.length));
  // tudo: true (Direcionar, 11/11/2026, pedido do Marcus e do Lucas): a lista abre COMPLETA, todos os grupos e todas as contas ao mesmo tempo, em colunas com linhas, sem entrar de nível em nível. Busca em cima.
  var casaTudo = function(no){ return !q || norm(no.nome).indexOf(q)>=0 || (no.cols || []).some(function(t){ return norm(t).indexOf(q)>=0; }); };
  var folhaTudo = function(no, k){ return e("button",{key:k, type:"button", onClick:function(){ setAberto(null); p.onEscolher(no.id, no.conta || ""); }, className:"flex min-h-8 w-full items-center justify-center gap-2 border-b border-border px-3 py-0.5 text-center text-[13px] leading-snug last:border-b-0 hover:bg-[#B8862B]"},
    no.cols ? no.cols.map(function(t, j){ return e("span",{key:j, className:"min-w-0 flex-1"+(j===0 ? " font-semibold" : ""), title:t}, t); }) : e("span",{className:"min-w-0 flex-1 font-semibold"}, no.nome)); };
  var corpoTudo = function(nos, nivel){ var out = []; (nos || []).forEach(function(n, i){
    if(n.itens){ var sub = corpoTudo(n.itens, nivel+1); if(sub.length){ out.push(e("div",{key:"t"+nivel+"-"+i, className:"flex h-8 items-center justify-center border-b border-border bg-white/5 px-3 text-[11px] font-semibold uppercase tracking-[.05em]"}, n.nome)); out = out.concat(sub); } }
    else if(casaTudo(n)) out.push(folhaTudo(n, nivel+"-"+i)); }); return out; };
  var primeiraFolha = function(no){ if(!no.itens) return no; for(var i = 0; i<no.itens.length; i++){ var f = primeiraFolha(no.itens[i]); if(f) return f; } return null; };
  var painelTudo = aberto && p.tudo && e("div",{className:"fixed z-50 flex max-h-[72vh] flex-col overflow-hidden rounded-lg border-2 border-[#d9a63a]/85 bg-card text-white shadow-lg", style:{left:Math.max(4, Math.min(aberto.r.l, window.innerWidth-Math.min(1100, window.innerWidth*0.96)-4)), top:Math.min(aberto.r.b+2, window.innerHeight*0.26), width:"min(1100px, 96vw)"}, onClick:function(ev){ ev.stopPropagation(); }},
    e("div",{className:"grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-stretch gap-px border-b border-border bg-border"},
      e("div",{className:"flex items-center justify-center bg-card p-1"}, e("input",{type:"search", autoFocus:true, value:aberto.q, placeholder:"Buscar conta, banco ou nome", "aria-label":"Buscar conta", onChange:function(ev){ setAberto(Object.assign({}, aberto, {q:ev.target.value})); }, className:"h-8 w-full rounded-md border border-border bg-card px-2 text-center text-[13px] text-white outline-none focus-visible:ring-2 focus-visible:ring-primary"})),
      e("div",{className:"flex items-center justify-center bg-card px-3 text-[11px] font-semibold uppercase tracking-[.05em]"}, "Clique na conta")),
    e("div",{className:"grid min-h-0 gap-px overflow-y-auto bg-border", style:{gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))"}}, (p.nos || []).map(function(g, gi){
      var corpo = g.itens ? corpoTudo(g.itens, 1) : (casaTudo(g) ? [folhaTudo(g, "g"+gi)] : []); if(!corpo.length) return null;
      var f1 = primeiraFolha(g);
      return e("div",{key:"g"+gi, className:"min-w-0 self-start bg-card"},
        e("div",{className:"flex h-[30px] items-center justify-center border-b border-border bg-[#1c1d21] px-3 text-[11px] font-semibold uppercase tracking-[.05em]"}, g.nome),
        f1 && f1.heads && e("div",{className:"flex h-8 items-center justify-center gap-2 border-b border-border bg-white/5 px-3 text-[11px] font-medium uppercase tracking-[.05em]"}, f1.heads.map(function(h, k){ return e("span",{key:k, className:"min-w-0 flex-1 text-center"}, h); })),
        corpo); })));
  return e(Fragment,null,
    e("button",{type:"button", "aria-label":p.rotulo, title:p.texto, onClick:abre, style:p.cor ? {background:"color-mix(in srgb, "+p.cor+" 34%, transparent)"} : undefined, className:(p.cor ? "!rounded-[14px] !border-0 font-semibold " : "")+CAMPO+" !h-auto min-h-8 w-full min-w-0 max-w-full items-center gap-2 py-0.5 flex "+(p.centro ? "relative justify-center pr-6 text-center" : "justify-between text-left")}, e("span",{className:"min-w-0 flex-1 leading-snug "+(p.semQuebra ? "whitespace-nowrap" : "break-words")+(p.vazio ? " text-foreground/70" : "")}, bonito(p.texto)), e("span",{"aria-hidden":true, className:p.centro ? "absolute right-2 top-1/2 -translate-y-1/2" : "shrink-0"}, "▾")),
    aberto && createPortal(e(Fragment,null, e("div",{className:"fixed inset-0 z-[90]", onClick:function(){ setAberto(null); }}), p.tudo ? painelTudo : painel), document.body));
}

export { SeletorConta };
