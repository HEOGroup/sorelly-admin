// Sorelly Admin · montagem — components/barra-menu.js
// Menu do setor no estilo DevMaster, aprovado pelo Marcus em 22/10/2026 (opção 3): faixa do sistema (header do App) + MENU em texto com listas que abrem alinhadas + ABAS das telas abertas (máx. 5).
//  · MenuSetor = a faixa de menu (com busca para escrever e achar a tela) e a faixa de abas abertas, juntas, fixas logo abaixo do header.
//  · Cada lista abre embaixo da palavra, na mesma borda esquerda; a sublista abre colada no lado direito, com o primeiro item na MESMA linha do item que a abriu.
//  · Todas as linhas têm 30 px, com uma linha fina entre os itens. Item aberto/passando o mouse fica dourado.
// Cada nó: {nome, aba?, modo?, perm?, itens?}. Sem itens = abre a tela. Itens sem permissão somem (e a palavra some se ficar vazia).
import { createPortal } from "react-dom";
import { useLayoutEffect } from "react";
import { gravarFavoritas, lerFavoritas } from "@/apps/montagem/lib/favoritas";
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

// ── Abas das telas abertas (máx. 8): UMA lista só para todos os setores (Marcus, 26/10/2026). Cada aba mostra em cima o SETOR e embaixo a TELA; clicar abre (e o ícone grande do topo e o menu passam para o setor da aba), ✕ fecha. Guardadas na sessão do navegador.
var CHAVE = "sorelly_abas_globais_", MAX = 8, LINA = 40;   // uma lista por modo (Admin ou Marcus): o sistema particular não aparece no Admin
var chaveDeNo = function(n, setor){ return setor+"|"+(n.aba||"")+"|"+(n.modo||"")+"|"+n.nome; };
var lerAbas = function(visao){ try{ return JSON.parse(sessionStorage.getItem(CHAVE+(visao||"admin")) || "[]"); }catch(x){ return []; } };
// Estrela (27/10/2026): clicar na ☆ fixa a aba como FAVORITA. Favoritas ficam logo depois do Início, na ordem que a pessoa escolher (segurar a aba e arrastar), e já aparecem quando o sistema abre.
// O Início fica sempre na frente e não fecha. Favorita não tem ✕: para soltar, clique na ★.
var INICIO_ABA = {k:chaveDeNo({aba:"inicio", nome:"Início"}, "Início"), nome:"Início", aba:"inicio", setor:"Início", cor:"#E8B84B"};
function AbasAbertas(p){
  var nos = filtrar(p.menu, p.pode), todas = folhas(nos, [], []).map(function(x){ return x.no; });
  var atual = todas.filter(function(n){ return p.ativo(n); })[0];
  var visao = p.visao || "admin";
  var st = useState(function(){ return lerAbas(p.visao); }), abas = st[0], setAbas = st[1];
  var sf = useState(function(){ return lerFavoritas(visao); }), favs = sf[0], setFavs = sf[1], sd = useState(null), arrastando = sd[0], setArrastando = sd[1];
  // trocou de modo (Admin <-> Marcus): carrega a lista do outro modo
  useEffect(function(){ setAbas(lerAbas(p.visao)); setFavs(lerFavoritas(visao)); }, [p.visao]);
  useEffect(function(){ var f = function(){ setFavs(lerFavoritas(visao)); }; window.addEventListener("sorelly-favoritas", f); return function(){ window.removeEventListener("sorelly-favoritas", f); }; }, [visao]);
  var kAtual = atual ? chaveDeNo(atual, p.setor) : "";
  var eFav = function(k){ return favs.some(function(f){ return f.k===k; }); };
  var grava = function(l){ setAbas(l); try{ sessionStorage.setItem(CHAVE+(p.visao||"admin"), JSON.stringify(l)); }catch(x){} };
  useEffect(function(){
    if(!atual || atual.aba==="inicio" || eFav(kAtual)) return;
    setAbas(function(ant){
      if(ant.some(function(a){ return a.k===kAtual; })) return ant;
      var nova = ant.concat([{k:kAtual, nome:atual.nome, aba:atual.aba, modo:atual.modo, breve:atual.breve, setor:p.setor, cor:p.cor}]);
      while(nova.length>MAX){ var j = nova.findIndex(function(a){ return a.k!==kAtual; }); nova.splice(j, 1); }
      try{ sessionStorage.setItem(CHAVE+(p.visao||"admin"), JSON.stringify(nova)); }catch(x){}
      return nova;
    });
  }, [kAtual]);
  // ordem na faixa: Início, favoritas (na ordem escolhida), depois as abertas que não são favoritas
  var lista = [INICIO_ABA].concat(favs.filter(function(f){ return f.aba!=="inicio"; }), abas.filter(function(a){ return a.aba!=="inicio" && !eFav(a.k); }));
  var fecha = function(a, ev){ ev.stopPropagation(); var i = lista.indexOf(a), resto = abas.filter(function(z){ return z!==a; }); grava(resto);
    if(a.k!==kAtual) return;
    p.abrir(lista[Math.max(0, i-1)]);   // volta para a aba da esquerda (no pior caso, o Início)
  };
  var alternaFav = function(a, ev){
    ev.stopPropagation();
    if(eFav(a.k)){ var tira = favs.filter(function(f){ return f.k!==a.k; }); setFavs(tira); gravarFavoritas(visao, tira); grava(abas.concat([a])); }
    else { var poe = favs.concat([{k:a.k, nome:a.nome, aba:a.aba, modo:a.modo, breve:a.breve, setor:a.setor, cor:a.cor}]); setFavs(poe); gravarFavoritas(visao, poe); grava(abas.filter(function(z){ return z.k!==a.k; })); }
  };
  // segurar a aba e arrastar para trocar de lugar (favoritas entre favoritas, abertas entre abertas)
  var soltar = function(alvo, ev){
    ev.preventDefault(); var de = arrastando; setArrastando(null);
    if(!de || de===alvo.k || alvo.aba==="inicio") return;
    var ordena = function(l){ var i = l.findIndex(function(x){ return x.k===de; }), j = l.findIndex(function(x){ return x.k===alvo.k; }); if(i<0 || j<0) return l; var c = l.slice(), it = c.splice(i, 1)[0]; c.splice(j, 0, it); return c; };
    if(eFav(de) && eFav(alvo.k)){ var nf = ordena(favs); setFavs(nf); gravarFavoritas(visao, nf); }
    else if(!eFav(de) && !eFav(alvo.k)) grava(ordena(abas));
  };
  return e("div",{role:"tablist", "aria-label":"Telas abertas", className:"flex items-stretch overflow-x-auto border-y border-l border-border"},
    lista.map(function(a){ var on = a.k===kAtual, fixo = a.aba==="inicio", fav = eFav(a.k);
      return e("div",{key:a.k, role:"tab", "data-aba":a.nome, "aria-selected":on, draggable:!fixo, title:fixo ? undefined : "Segure e arraste para mudar de lugar",
          onDragStart:function(ev){ setArrastando(a.k); try{ ev.dataTransfer.setData("text/plain", a.k); ev.dataTransfer.effectAllowed = "move"; }catch(x){} },
          onDragOver:function(ev){ if(arrastando) ev.preventDefault(); }, onDrop:function(ev){ soltar(a, ev); }, onDragEnd:function(){ setArrastando(null); },
          className:"flex shrink-0 items-center border-r border-border text-white "+(on ? "bg-[#B8862B]" : "hover:bg-[#B8862B]/50")+(arrastando===a.k ? " opacity-40" : ""), style:{height:LINA, borderLeft:"3px solid "+(a.cor || OURO), boxShadow:on ? "inset 0 -3px 0 #F5D68A" : undefined}},
        e("button",{type:"button", onClick:function(ev){ p.abrir(a, ev); }, className:"flex h-full flex-col items-start justify-center whitespace-nowrap pl-2.5 pr-2 text-left leading-tight"},
          (a.setor && a.setor!==a.nome) ? e("span",{className:"text-[11px] "+(on ? "font-semibold" : "opacity-80")}, a.setor) : null, e("span",{className:"text-[12.5px] "+(on ? "font-bold" : "")}, a.nome)),
        !fixo && e("button",{type:"button", "aria-label":fav ? "Tirar "+a.nome+" dos favoritos" : "Fixar "+a.nome+" nos favoritos", title:fav ? "Tirar dos favoritos" : "Fixar nos favoritos", onClick:function(ev){ alternaFav(a, ev); },
          className:"h-full px-1.5 text-[15px] leading-none "+(fav ? "text-[#F5D68A]" : "opacity-60 hover:opacity-100")}, fav ? "★" : "☆"),
        (!fixo && !fav) && e("button",{type:"button", "aria-label":"Fechar "+a.nome, title:"Fechar", onClick:function(ev){ fecha(a, ev); }, className:"h-full pr-3 text-[12px] hover:text-destructive"}, "✕"),
        (fixo || fav) && e("span",{className:"pr-2"})); }));
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
    var abertas = lerAbas(p.visao), ja = abertas.some(function(a){ return a.k===chaveDeNo(n, p.setor); });
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
  return e("div",{className:"sticky top-12 z-20 sombra-baixo bg-background/95 backdrop-blur", style:p.semAbas ? undefined : {minHeight:73}},
    !p.semAbas && e(AbasAbertas,{menu:p.menu, pode:p.pode, ativo:p.ativo, abrir:p.abrir, setor:p.setor, cor:p.cor, visao:p.visao}),
    e("div",{className:"flex items-stretch border-b border-l border-border", style:{height:LIN}},
      e(BarraMenu,{menu:p.menu, pode:p.pode, ativo:p.ativo, abrir:abrirComVoo}),
      e(BuscaMenu,{menu:p.menu, pode:p.pode, abrir:abrirComVoo, setor:p.setor})),
    aviso && createPortal(e("div",{role:"alert", className:"fixed left-1/2 top-24 z-[60] max-w-[90vw] -translate-x-1/2 rounded-md border border-destructive bg-card px-4 py-2 text-[13px] text-white shadow-lg"}, aviso), document.body));
}

export { MenuSetor };
