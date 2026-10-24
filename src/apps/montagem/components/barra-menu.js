// Sorelly Admin · montagem — components/barra-menu.js
// Menu do setor no estilo DevMaster, aprovado pelo Marcus em 22/10/2026 (opção 3): faixa do sistema (header do App) + MENU em texto com listas que abrem alinhadas + ABAS das telas abertas (máx. 5).
//  · MenuSetor = a faixa de menu (com busca para escrever e achar a tela) e a faixa de abas abertas, juntas, fixas logo abaixo do header.
//  · Cada lista abre embaixo da palavra, na mesma borda esquerda; a sublista abre colada no lado direito, com o primeiro item na MESMA linha do item que a abriu.
//  · Todas as linhas têm 30 px, com uma linha fina entre os itens. Item aberto/passando o mouse fica dourado.
// Cada nó: {nome, aba?, modo?, perm?, itens?}. Sem itens = abre a tela. Itens sem permissão somem (e a palavra some se ficar vazia).
import { createPortal } from "react-dom";
import { useLayoutEffect } from "react";
import { e, Fragment, useEffect, useRef, useState } from "@/shared/react";

var OURO = "#B8862B", LARG = 244, LIN = 30;
var norm = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };

function filtrar(nos, pode){
  return nos.map(function(n){
    if(n.itens){ var it = filtrar(n.itens, pode); return it.length ? Object.assign({}, n, {itens:it}) : null; }
    return pode(n) ? n : null;
  }).filter(Boolean);
}
var contem = function(n, ativo){ return n.itens ? n.itens.some(function(x){ return contem(x, ativo); }) : ativo(n); };
function folhas(nos, trilha, saida){
  nos.forEach(function(n){ if(n.itens) folhas(n.itens, trilha.concat([n.nome]), saida); else saida.push({no:n, trilha:trilha}); });
  return saida;
}

// ── Faixa de menu: palavras + listas em cascata + busca de tela
function BarraMenu(p){
  var todos = filtrar(p.menu, p.pode), chave = todos.map(function(n){ return n.nome; }).join("|");
  var refBarra = useRef(null), refMed = useRef(null), sn = useState(todos.length), qtd = sn[0], setQtd = sn[1];
  // cabe tudo? as palavras que não cabem vão para "Mais ▾" (nada fica cortado); mede uma cópia invisível das palavras
  useLayoutEffect(function(){
    var recalcula = function(){
      if(!refBarra.current || !refMed.current) return;
      var disp = refBarra.current.clientWidth, ws = [].map.call(refMed.current.children, function(c){ return c.offsetWidth; }), tot = ws.reduce(function(a, b){ return a+b; }, 0);
      if(tot<=disp){ setQtd(ws.length); return; }
      var acc = 0, k = 0; while(k<ws.length && acc+ws[k]<=disp-84){ acc += ws[k]; k++; }
      setQtd(Math.max(1, k));
    };
    recalcula(); var ro = typeof ResizeObserver!=="undefined" ? new ResizeObserver(recalcula) : null; if(ro && refBarra.current) ro.observe(refBarra.current);
    return function(){ if(ro) ro.disconnect(); };
  }, [chave]);
  var nos = qtd>=todos.length ? todos : todos.slice(0, qtd).concat([{nome:"Mais", itens:todos.slice(qtd)}]);
  var st = useState(null), aberto = st[0], setAberto = st[1];   // um item aberto por nível: {i, r:{l,t,b,rt}} (posição da palavra/linha que abriu)
  useEffect(function(){
    if(!aberto) return;
    var esc = function(ev){ if(ev.key==="Escape") setAberto(null); };
    window.addEventListener("keydown", esc); return function(){ window.removeEventListener("keydown", esc); };
  }, [aberto]);
  var fechar = function(){ setAberto(null); };
  var escolher = function(n, ev){ setAberto(null); p.abrir(n, ev); };
  var abrirNivel = function(nivel, i, ev){ var r = ev.currentTarget.getBoundingClientRect(); setAberto((aberto||[]).slice(0, nivel).concat([{i:i, r:{l:r.left, t:r.top, b:r.bottom, rt:r.right}}])); };
  var painel = function(lista, nivel, pos){
    return e("div",{key:"p"+nivel, className:"fixed z-50 max-h-[75vh] overflow-y-auto border border-border bg-card", style:{left:pos.x, top:pos.y, width:LARG}, onClick:function(ev){ ev.stopPropagation(); }},
      lista.map(function(n, i){
        var sel = aberto && aberto[nivel] && aberto[nivel].i===i, on = contem(n, p.ativo);
        return e("button",{key:n.nome+i, type:"button",
          onMouseEnter:function(ev){ if(n.itens) abrirNivel(nivel, i, ev); else setAberto((aberto||[]).slice(0, nivel)); },
          onClick:function(ev){ if(n.itens){ abrirNivel(nivel, i, ev); return; } escolher(n, ev); },
          className:"flex w-full items-center justify-between gap-2 border-b border-border px-3 text-left text-[12.5px] last:border-b-0 "+"text-white hover:bg-[#B8862B] "+(sel ? "font-medium" : on ? "font-semibold" : ""),
          style:Object.assign({height:LIN}, sel ? {background:OURO} : on ? {boxShadow:"inset 3px 0 0 "+OURO} : {})},
          e("span",{className:"min-w-0 flex-1 truncate"}, n.nome), n.itens && e("span",{"aria-hidden":true}, "▸")); }));
  };
  var listas = [], atual = nos;
  if(aberto) for(var nv = 0; nv<aberto.length; nv++){
    var no = atual[aberto[nv].i]; if(!no || !no.itens) break;
    var rr = aberto[nv].r, x, y;
    if(nv===0){ x = Math.min(rr.l, window.innerWidth-LARG-4); y = rr.b; }
    else { x = rr.rt+1; if(x+LARG>window.innerWidth-4) x = rr.l-LARG-1; y = rr.t-1; }   // colada ao lado, 1ª linha na altura do item que abriu
    listas.push(painel(no.itens, nv+1, {x:x, y:y}));
    atual = no.itens;
  }
  return e("div",{ref:refBarra, className:"relative flex min-w-0 flex-1 items-stretch overflow-hidden"},
    e("div",{ref:refMed, "aria-hidden":true, className:"pointer-events-none invisible absolute left-0 top-0 flex whitespace-nowrap"}, todos.map(function(n){ return e("span",{key:n.nome, className:"shrink-0 px-3 text-[12.5px] font-semibold"}, n.nome+(n.itens ? " ▾" : "")); })),
    nos.map(function(n, i){
      var on = contem(n, p.ativo), sel = aberto && aberto[0] && aberto[0].i===i;
      return e("button",{key:n.nome, type:"button",
        onMouseEnter:function(ev){ if(aberto && aberto.length){ if(n.itens) abrirNivel(0, i, ev); else setAberto(null); } },
        onClick:function(ev){ if(n.itens){ if(sel) fechar(); else abrirNivel(0, i, ev); return; } escolher(n, ev); },
        className:"shrink-0 whitespace-nowrap px-3 text-[12.5px] "+"text-white hover:bg-[#B8862B] "+(sel ? "font-medium" : on ? "font-semibold" : ""),
        style:Object.assign({height:LIN}, sel ? {background:OURO} : on ? {boxShadow:"inset 0 -2px 0 "+OURO} : {})},
        n.nome+(n.itens ? " ▾" : "")); }),
    aberto && aberto[0] && createPortal(e(Fragment,null, e("div",{className:"fixed inset-x-0 bottom-0 z-40", style:{top:aberto[0].r.b}, onClick:fechar}), listas), document.body));
}

// ── Busca de tela: escreve e acha qualquer tela do setor (Enter abre a primeira)
function BuscaMenu(p){
  var todas = folhas(filtrar(p.menu, p.pode), [], []);
  var sq = useState(""), q = sq[0], setQ = sq[1], si = useState(0), idx = si[0], setIdx = si[1], sf = useState(false), foco = sf[0], setFoco = sf[1];
  var ref = useRef(null);
  var termos = norm(q).split(/\s+/).filter(Boolean);
  var achadas = termos.length ? todas.filter(function(x){ var t = norm(x.trilha.join(" ")+" "+x.no.nome); return termos.every(function(w){ return t.indexOf(w)>=0; }); }).slice(0, 12) : [];
  var abre = function(x){ setQ(""); setFoco(false); if(ref.current) ref.current.blur(); p.abrir(x.no); };
  return e("div",{className:"relative flex shrink-0 items-center px-2"},
    e("input",{ref:ref, type:"search", value:q, placeholder:"Buscar tela…", "aria-label":"Buscar tela do "+p.setor, onFocus:function(){ setFoco(true); }, onBlur:function(){ setTimeout(function(){ setFoco(false); }, 150); },
      onChange:function(ev){ setQ(ev.target.value); setIdx(0); },
      onKeyDown:function(ev){ if(ev.key==="ArrowDown"){ ev.preventDefault(); setIdx(Math.min(idx+1, achadas.length-1)); } else if(ev.key==="ArrowUp"){ ev.preventDefault(); setIdx(Math.max(idx-1, 0)); } else if(ev.key==="Enter" && achadas[idx]){ abre(achadas[idx]); } else if(ev.key==="Escape"){ setQ(""); ev.target.blur(); } },
      className:"h-6 w-48 rounded-md border border-border bg-card px-2 text-[12.5px] text-white outline-none focus-visible:ring-2 focus-visible:ring-primary"}),
    foco && termos.length>0 && e("div",{className:"absolute right-2 top-full z-50 mt-0.5 max-h-80 w-80 overflow-y-auto border border-border bg-card"},
      achadas.length ? achadas.map(function(x, i){
        return e("button",{key:i, type:"button", onMouseDown:function(ev){ ev.preventDefault(); abre(x); }, onMouseEnter:function(){ setIdx(i); },
          className:"flex w-full flex-col justify-center border-b border-border px-3 text-left last:border-b-0 "+(i===idx ? "font-medium text-white" : "text-white"), style:Object.assign({minHeight:LIN}, i===idx ? {background:OURO} : {})},
          e("span",{className:"truncate text-[12.5px]"}, x.no.nome), e("span",{className:"truncate text-[11px]"}, x.trilha.join(" › "))); })
        : e("p",{className:"px-3 text-[12.5px] text-white", style:{height:LIN, lineHeight:LIN+"px"}}, "Nenhuma tela com esse nome")));
}

// ── Abas das telas abertas (máx. 5): clicar abre, ✕ fecha; guardadas na sessão do navegador
var CHAVE = "sorelly_abas_abertas_", MAX = 8;
var chaveDeNo = function(n){ return (n.aba||"")+"|"+(n.modo||"")+"|"+n.nome; };
var lerAbas = function(k){ try{ return JSON.parse(sessionStorage.getItem(CHAVE+k) || "[]"); }catch(x){ return []; } };
function AbasAbertas(p){
  var nos = filtrar(p.menu, p.pode), todas = folhas(nos, [], []).map(function(x){ return x.no; });
  var atual = todas.filter(function(n){ return p.ativo(n); })[0], chaveDe = function(n){ return (n.aba||"")+"|"+(n.modo||"")+"|"+n.nome; };
  var st = useState(function(){ return lerAbas(p.setor); }), abas = st[0], setAbas = st[1];
  var kAtual = atual ? chaveDe(atual) : "";
  useEffect(function(){
    if(!atual) return;
    setAbas(function(ant){
      if(ant.some(function(a){ return a.k===kAtual; })) return ant;
      var nova = ant.concat([{k:kAtual, nome:atual.nome, aba:atual.aba, modo:atual.modo}]);
      while(nova.length>MAX){ var j = nova.findIndex(function(a){ return a.k!==kAtual; }); nova.splice(j, 1); }
      try{ sessionStorage.setItem(CHAVE+p.setor, JSON.stringify(nova)); }catch(x){}
      return nova;
    });
  }, [kAtual]);
  var grava = function(l){ setAbas(l); try{ sessionStorage.setItem(CHAVE+p.setor, JSON.stringify(l)); }catch(x){} };
  var fecha = function(a, ev){ ev.stopPropagation(); var i = abas.indexOf(a), resto = abas.filter(function(z){ return z!==a; }); grava(resto);
    if(a.k===kAtual && resto.length) p.abrir(resto[Math.max(0, i-1)]); };
  var visiveis = abas.filter(function(a){ return todas.some(function(n){ return chaveDe(n)===a.k; }); });
  if(!visiveis.length) return null;
  return e("div",{role:"tablist", "aria-label":"Telas abertas", className:"flex items-stretch overflow-x-auto border-b border-border"},
    visiveis.map(function(a){ var on = a.k===kAtual;
      return e("div",{key:a.k, role:"tab", "data-aba":a.nome, "aria-selected":on, className:"flex shrink-0 items-center border-r border-border "+"text-white hover:bg-[#B8862B] "+(on ? "bg-[#B8862B]/45" : ""), style:{height:LIN}},
        e("button",{type:"button", onClick:function(ev){ p.abrir(a, ev); }, className:"h-full whitespace-nowrap pl-3 pr-2 text-[12.5px] "+(on ? "font-medium" : "")}, a.nome),
        e("button",{type:"button", "aria-label":"Fechar "+a.nome, title:"Fechar", onClick:function(ev){ fecha(a, ev); }, className:"h-full pr-3 text-[12px] hover:text-destructive"}, "✕")); }));
}

// Voo (23/10/2026): ao escolher uma tela no menu ou na busca, um clone do item sai de onde foi clicado e voa até a aba dela, que pisca ao chegar. Sem movimento se a pessoa pede menos animação.
function voar(nome, de){
  if(typeof document==="undefined" || !de || !document.body.animate) return;
  try{ if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; }catch(x){}
  var tentativas = 0;
  var tenta = function(){
    var alvo = [].slice.call(document.querySelectorAll('[role="tablist"] [role="tab"]')).filter(function(a){ return a.getAttribute("data-aba")===nome; })[0];
    if(!alvo){ if(++tentativas<40) setTimeout(tenta, 60); return; }
    // O clone NÃO é esticado (sem scale): ele muda de posição, largura e altura, com o texto no mesmo tamanho, e vai sumindo ao pousar na aba. Assim não distorce.
    var para = alvo.getBoundingClientRect(), el = document.createElement("div"), larg = Math.max(60, de.width), alt = Math.max(20, de.height);
    el.textContent = nome;
    el.style.cssText = "position:fixed;left:"+de.left+"px;top:"+de.top+"px;width:"+larg+"px;height:"+alt+"px;z-index:9999;pointer-events:none;display:flex;align-items:center;padding:0 12px;box-sizing:border-box;"
      + "background:"+OURO+";color:#fff;font-size:12.5px;font-weight:600;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-radius:4px;box-shadow:0 6px 18px rgba(0,0,0,.45)";
    document.body.appendChild(el);
    var mx = (de.left+para.left)/2, my = Math.min(de.top, para.top)-34, mw = (larg+para.width)/2, mh = (alt+para.height)/2;
    var px = function(n){ return Math.round(n*10)/10+"px"; };
    var voo = el.animate([
      {left:px(de.left), top:px(de.top), width:px(larg), height:px(alt), opacity:1, offset:0},
      {left:px(mx), top:px(my), width:px(mw), height:px(mh), opacity:1, offset:.5},
      {left:px(para.left), top:px(para.top), width:px(para.width), height:px(para.height), opacity:1, offset:.82},
      {left:px(para.left), top:px(para.top), width:px(para.width), height:px(para.height), opacity:0, boxShadow:"0 0 0 rgba(0,0,0,0)", offset:1}], {duration:680, easing:"cubic-bezier(.3,.7,.3,1)"});
    var fim = function(){ if(el.parentNode) el.parentNode.removeChild(el); };
    setTimeout(function(){ try{ alvo.animate([{background:"rgba(184,134,43,.95)"}, {background:"rgba(184,134,43,0)"}], {duration:650}); }catch(x){} }, 460);
    voo.onfinish = fim; voo.oncancel = fim;
  };
  setTimeout(tenta, 40);
}
// Brilho: a aba ganha um clarão dourado (usado ao abrir uma tela que já estava aberta)
function brilhar(nome){
  if(typeof document==="undefined") return;
  var tentativas = 0;
  var tenta = function(){
    var alvo = [].slice.call(document.querySelectorAll('[role="tablist"] [role="tab"]')).filter(function(a){ return a.getAttribute("data-aba")===nome; })[0];
    if(!alvo){ if(++tentativas<20) setTimeout(tenta, 60); return; }
    try{ alvo.animate([{boxShadow:"inset 0 0 0 2px rgba(232,184,75,1), 0 0 16px 3px rgba(232,184,75,.9)", background:"rgba(184,134,43,.95)"}, {boxShadow:"inset 0 0 0 0 rgba(232,184,75,0), 0 0 0 0 rgba(232,184,75,0)", background:"rgba(184,134,43,0)"}], {duration:900, easing:"ease-out"}); }catch(x){}
  };
  setTimeout(tenta, 30);
}
var retangulo = function(el){ if(!el || !el.getBoundingClientRect) return null; var r = el.getBoundingClientRect(); return {left:r.left, top:r.top, width:r.width, height:r.height}; };

// Barra do setor (2ª barra): só menus + busca de tela, sem o nome do setor (o símbolo do setor fica na barra de cima); abaixo, as abas das telas abertas
function MenuSetor(p){
  var sa = useState(""), aviso = sa[0];
  useEffect(function(){ if(!aviso) return; var id = setTimeout(function(){ sa[1](""); }, 6000); return function(){ clearTimeout(id); }; }, [aviso]);
  // abrir pelo menu ou pela busca:
  //  · tela que JÁ está aberta: só abre e a aba brilha (não voa);
  //  · tela nova: um clone voa até a aba dela;
  //  · já com ${MAX} telas abertas: o sistema avisa e não abre; a pessoa fecha uma (✕) e tenta de novo.
  var abrirComVoo = function(n, ev){
    if(p.semAbas) return p.abrir(n, ev);   // setor sem faixa de telas abertas: as palavras do menu já mostram tudo
    var abertas = lerAbas(p.setor), ja = abertas.some(function(a){ return a.k===chaveDeNo(n); });
    if(ja){ p.abrir(n, ev); brilhar(n.nome); return; }
    if(abertas.length>=MAX){
      sa[1]("Você já tem "+MAX+" telas abertas. Feche uma delas (o ✕ da aba) para abrir "+n.nome+".");
      var linha = document.querySelector('[role="tablist"]');
      try{ if(linha) linha.animate([{transform:"translateX(0)"}, {transform:"translateX(-7px)"}, {transform:"translateX(7px)"}, {transform:"translateX(-4px)"}, {transform:"translateX(0)"}], {duration:380}); }catch(x){}
      return;
    }
    var de = retangulo(ev && ev.currentTarget);
    if(!de) de = retangulo(document.querySelector('input[type="search"][aria-label^="Buscar tela"]'));
    var r = p.abrir(n, ev); voar(n.nome, de); return r;
  };
  return e("div",{className:"sticky top-12 z-20 border-b border-border bg-background/95 backdrop-blur"},
    !p.semAbas && e(AbasAbertas,{menu:p.menu, pode:p.pode, ativo:p.ativo, abrir:p.abrir, setor:p.setor}),
    e("div",{className:"flex items-stretch", style:{height:LIN}},
      e(BarraMenu,{menu:p.menu, pode:p.pode, ativo:p.ativo, abrir:abrirComVoo}),
      e(BuscaMenu,{menu:p.menu, pode:p.pode, abrir:abrirComVoo, setor:p.setor})),
    aviso && createPortal(e("div",{role:"alert", className:"fixed left-1/2 top-24 z-[60] max-w-[90vw] -translate-x-1/2 rounded-md border border-destructive bg-card px-4 py-2 text-[13px] text-white shadow-lg"}, aviso), document.body));
}

export { MenuSetor };
