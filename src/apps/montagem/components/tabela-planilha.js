// Sorelly Admin · montagem — components/tabela-planilha.js
// Tabela no estilo planilha (pedido do Marcus, 26/10/2026): o filtro fica NA coluna (clicou no título: ordenar de A a Z, de Z a A, buscar e marcar valores),
// cada coluna tem a largura do maior conteúdo e nada é abreviado. Opção de agrupar as linhas por uma coluna.
// detalhe(linha) = o que abre logo embaixo da linha ao clicar (e fecha ao clicar de novo); começa tudo fechado.
// Opções novas (26/10/2026, tela Revendedoras): centro (células centralizadas, linhas finas), totalLinha(linhas) = células da linha de TOTAL acima do cabeçalho, linhaGrupo(valor, linhas) = {span, rotulo, resto[]}, onFiltradas(linhas) avisa quem está em volta, cols[].fmt(v, linha), cols[].cor(linha) e cols[].max (largura máxima em px; o que passar corta com … e aparece inteiro ao passar o mouse).
// cabAcima: [[{t, span, sep}, ...], ...] = barras de grupo em cima do cabeçalho das colunas, uma linha por barra (ex.: título e Padrão | Prata; Metas › Regras). O degradê dourado cobre todas.
// cheia: true faz a tabela ocupar a altura toda do lugar onde está (as linhas se esticam por igual); serve para alinhar com o bloco ao lado (Metas › Regras).
// soNoTexto: true (com aoClicar) = só o CURSOR muda: em cima da letra é o de clicar e fora da letra é a mãozinha de arrastar a planilha. O clique vale na linha INTEIRA (arrastar sem soltar não abre; só o clique parado abre). Contas a pagar, 12/11/2026.
// semLimpar: true esconde o botão "Limpar filtros e ordem" (a coluna filtrada já fica de outra cor; o menu da coluna tem "Limpar o filtro desta coluna"). maozinha: true = cursor de mão de arrastar na planilha toda (Contas a pagar, 12/11/2026). No filtro da coluna, Enter na busca deixa só o que a busca achou e fecha o menu.
// semFiltro: true tira o funil (filtro e ordem) do título das colunas (Metas › Regras, 02/11/2026).
// cols[].w = largura FIXA da coluna (ex.: "9rem"): a tabela passa a usar layout fixo e várias tabelas com as mesmas larguras ficam alinhadas umas embaixo das outras (Chaves Pix, 12/11/2026).
// cols[].fixa = true (ou "8rem" = distância da esquerda, para duas colunas fixas): a coluna fica fixa à esquerda; a cor de fundo vem de --bgl da linha (linhaCls) ou do padrão quando a planilha rola para o lado (use na primeira coluna; Contas bancárias, 12/11/2026).
// alturaMax = "calc(100vh - 8rem)": a planilha rola por dentro e o cabeçalho (nomes das colunas) fica fixo no topo (Contas bancárias, 12/11/2026).
// cols[].fixaDir = "0" (ou "9rem - 2px" = distância da direita; some 2 px por coluna para uma entrar por baixo da outra): a coluna fica fixa no lado DIREITO quando a planilha rola (resultado sempre à vista; Contas bancárias, 12/11/2026).
// barraGrossa: true = barra de rolagem grossa e visível (planilhas largas). cols[].bordaGrossa: true = a borda da coluna travada fica grossa e branca, para ver que só o meio se mexe (Contas bancárias, 12/11/2026).
// cols[].bordaFora = "esq" | "dir": borda branca de fora da coluna travada da ponta (contorna o bloco travado). O cabeçalho das colunas travadas ganha também a linha branca de cima.
// cols[].sep = true: linha de divisão grossa à esquerda da coluna (separa grupos de colunas; Metas › Regras).
// cols[].render(valor, linha) = elemento no lugar do texto da célula (ex.: campo para digitar; Metas › Campanha).
// detAberto(linha) = true: o detalhe dessa linha já nasce aberto (o clique fecha). detalhe(linha) pode devolver null: a linha não abre. cols[].render recebe (valor, linha, aberta). (Comissões, 12/11/2026)
// linhaCls(linha): classe extra para a linha (Fotos de catálogo, 11/11/2026: o dia de começar pulsa).
// semContagem: true tira o "N de N" de cima da tabela (Metas, 02/11/2026).
// cols[].pulso = true: só o título dessa coluna pulsa bem de leve (Contas bancárias: título de HOJE na edição, 12/11/2026).
// cols[].acao = {rotulo, titulo, onClick}: botãozinho no canto do título da coluna (ex.: "+" para abrir mais colunas; Metas › Revendedoras, 02/11/2026).
// Grupos que abrem e fecham (03/11/2026, Atendimento interno › Listagens): grupoAberto(valor) = true/false, aoGrupo(valor) = clicou na linha do grupo, grupoEsquerda: true = texto da linha do grupo no começo (não centralizado).
// limite (10/11/2026, Marketing › Fotos de catálogo, 17 mil linhas): mostra só as N primeiras linhas (com agrupar, N por grupo aberto) e um botão "Mostrar mais N" embaixo; filtro e ordem valem para a lista inteira. faixaFina: true deixa a linha de grupo baixa (24 px, 11 px).
// cols[].corTopo = cor da faixa de 3 px no topo do título da coluna (separa grupos de colunas por cor; Fotos de catálogo, 10/11/2026).
// PADRÃO (11/11/2026): a tabela é ESCURA (layout D, sem dourado), com filtro e ordem no cabeçalho de cada coluna. É a PEÇA ÚNICA de tabela do sistema (trava dura 2k).
// escura: não precisa mais escrever (é o padrão). dourada: true = volta ao topo dourado antigo; SÓ para tela velha, a trava reprova uso novo.
// grade: true = linhas finas também entre as colunas (grade completa, como planilha; Fotos de catálogo, 10/11/2026).
// compacta: true = a tabela tem só a largura do conteúdo, encostada à esquerda, alinhada ao título (em tela larga as colunas não se esticam; Fotos de catálogo, 10/11/2026).
// cols: [{k, t}] (k = chave do valor na linha, t = título). linhas: objetos. aoClicar(linha). agrupar: chave da coluna ou "". rotuloGrupo(valor, qtd): texto da linha de grupo.
import { createPortal } from "react-dom";
import { e, useEffect, useMemo, useRef, useState } from "@/shared/react";

var CMP = new Intl.Collator("pt-BR", {numeric:true, sensitivity:"base"});
var vazio = function(v){ return v===undefined || v===null || v===""; };
var texto = function(v, c){ return vazio(v) ? "(vazio)" : (c && c.fmt ? String(c.fmt(v)) : String(v)); };
var LIMITE_LISTA = 300;   // valores mostrados na lista do filtro; a busca refina o resto

function MenuColuna(p){
  var c = p.col, sb = useState(""), busca = sb[0], setBusca = sb[1], ref = useRef(null), anc = useRef(null), sp = useState(null), pos = sp[0], setPos = sp[1];
  // o menu sai da tabela e abre no <body> (portal): nenhuma borda da planilha corta nem achata o menu (Contas a pagar, 12/11/2026). Abre embaixo do título da coluna e, se passar da borda da tela, encosta nela.
  useEffect(function(){ var th = anc.current && anc.current.closest("th"); if(th){ var r0 = th.getBoundingClientRect(); setPos({top:r0.bottom+2, left:r0.left}); } }, []);
  useEffect(function(){ var el = ref.current; if(!el || !pos) return; var r1 = el.getBoundingClientRect(), dx = r1.right-(window.innerWidth-8), dy = r1.bottom-(window.innerHeight-8); if(dx>0) el.style.left = (pos.left-dx)+"px"; if(dy>0) el.style.top = Math.max(8, pos.top-dy)+"px"; }, [pos]);
  var todos = p.valores, marc = p.filtro;   // marc = Set dos valores marcados, ou null = todos
  var vis = todos.filter(function(v){ return !busca || texto(v, c).toLowerCase().indexOf(busca.toLowerCase())>=0; });
  var tudoMarcado = !marc || vis.every(function(v){ return marc.has(v); });
  var alterna = function(v){ var s = new Set(marc || todos); if(s.has(v)) s.delete(v); else s.add(v); p.aoFiltrar(s.size===todos.length ? null : s); };
  // COM BUSCA escrita, "Selecionar o que aparece" deixa marcado SÓ o que a busca achou (igual ao Google Planilhas): escreveu "marcus" e clicou = só as linhas do Marcus. Clicar de novo, já só com elas marcadas, volta a mostrar tudo (Marcus, 12/11/2026).
  var todosVis = function(){ if(busca){ var so = marc && marc.size===vis.length && vis.every(function(v){ return marc.has(v); }); p.aoFiltrar(so || vis.length===todos.length ? null : new Set(vis)); return; } var s = new Set(marc || todos); if(tudoMarcado){ vis.forEach(function(v){ s.delete(v); }); } else vis.forEach(function(v){ s.add(v); }); p.aoFiltrar(s.size===todos.length ? null : s); };
  var item = "flex h-8 w-full items-center gap-2 px-3 text-left text-[13px] hover:bg-white/10";
  var menu = e("div",{ref:ref, role:"dialog", "aria-label":"Filtro da coluna "+c.t, onPointerDown:function(ev){ ev.stopPropagation(); }, style:pos ? {top:pos.top, left:pos.left} : {visibility:"hidden"}, className:"fixed z-50 flex w-72 max-h-[calc(100vh-1rem)] overflow-y-auto flex-col rounded-lg border border-border bg-popover py-1 text-left font-normal normal-case tracking-normal text-foreground shadow-xl"},
    e("button",{type:"button", className:item+(p.ordem && p.ordem.dir===1 ? " text-primary" : ""), onClick:function(){ p.aoOrdenar(1); }}, "Ordenar de A a Z"),
    e("button",{type:"button", className:item+(p.ordem && p.ordem.dir===-1 ? " text-primary" : ""), onClick:function(){ p.aoOrdenar(-1); }}, "Ordenar de Z a A"),
    p.ordem && e("button",{type:"button", className:item, onClick:function(){ p.aoOrdenar(0); }}, "Tirar a ordenação"),
    e("div",{className:"my-1 border-t border-border"}),
    e("div",{className:"px-3 py-1"}, e("input",{type:"search", autoFocus:true, value:busca, placeholder:"Buscar", onChange:function(ev){ setBusca(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter"){ ev.preventDefault(); if(busca) p.aoFiltrar(vis.length===todos.length ? null : new Set(vis)); if(p.aoFechar) p.aoFechar(); } }, className:"h-8 w-full rounded-md border border-border bg-card px-2.5 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"})),
    e("label",{className:item+" cursor-pointer"}, e("input",{type:"checkbox", checked:tudoMarcado && vis.length>0, onChange:todosVis, className:"size-4 accent-[#E8B84B]"}), busca ? "Selecionar o que aparece" : "Selecionar tudo"),
    e("div",{className:"max-h-64 overflow-y-auto"},
      vis.slice(0, LIMITE_LISTA).map(function(v){ return e("label",{key:String(v), className:item+" cursor-pointer"}, e("input",{type:"checkbox", checked:!marc || marc.has(v), onChange:function(){ alterna(v); }, className:"size-4 shrink-0 accent-[#E8B84B]"}), e("span",{className:"whitespace-nowrap"}, texto(v, c))); }),
      vis.length>LIMITE_LISTA && e("div",{className:"px-3 py-1 text-[12px] text-muted-foreground"}, "Mostrando "+LIMITE_LISTA+" de "+vis.length+". Use a busca para achar o resto."),
      !vis.length && e("div",{className:"px-3 py-1 text-[12px] text-muted-foreground"}, "Nada encontrado.")),
    marc && e("div",{className:"mt-1 border-t border-border pt-1"}, e("button",{type:"button", className:item, onClick:function(){ p.aoFiltrar(null); }}, "Limpar o filtro desta coluna")));
  return e("span",{ref:anc, className:"hidden"}, createPortal(menu, document.body));
}

// bordas das colunas travadas (Contas bancárias, 12/11/2026): as linhas BRANCAS de 3 px são peças dentro da célula, por CIMA das linhas da grade (nenhuma linha passa por cima delas); só a linha fininha de separação fica como sombra.
// cols[].bordaGrossa = linha branca do lado de dentro; cols[].bordaFora = "esq" | "dir" = linha branca do lado de fora; o cabeçalho das colunas travadas ganha a linha branca de cima.
function sombraFixa(c, lado){ if(c.bordaGrossa) return "none"; return lado==="esq" ? "inset -1px 0 0 rgba(255,255,255,.3)" : "inset 1px 0 0 rgba(255,255,255,.3)"; }
function bordasFixas(c, topo){ var o = [], t0 = topo ? 0 : -1, b = function(k, st){ o.push(e("span",{key:k, "aria-hidden":true, className:"pointer-events-none absolute z-20 bg-white", style:st})); };
  if(c.fixa && c.bordaGrossa) b("ie", {top:t0, bottom:-1, right:0, width:3});
  if(c.fixa && c.bordaFora==="esq") b("fe", {top:t0, bottom:-1, left:0, width:3});
  if(c.fixaDir!==undefined && c.bordaGrossa) b("id", {top:t0, bottom:-1, left:0, width:3});
  if(c.fixaDir!==undefined && c.bordaFora==="dir") b("fd", {top:t0, bottom:-1, right:0, width:3});
  if(topo && (c.fixa || c.fixaDir!==undefined)) b("tp", {top:0, left:0, right:0, height:3});
  return o; }

function TabelaPlanilha(p){
  var escura = !p.dourada;   // layout D por padrão (11/11/2026)
  var sf = useState({}), filtros = sf[0], setFiltros = sf[1];
  var so = useState(null), ordem = so[0], setOrdem = so[1];   // {k, dir}
  var spg = useState(1), pag = spg[0], setPag = spg[1];
  var sa = useState(null), aberto = sa[0], setAberto = sa[1], sdt = useState({}), detAbertos = sdt[0], setDetAbertos = sdt[1];
  var raiz = useRef(null), wrapRef = useRef(null), arr = useRef({on:false, moveu:false, x:0, l:0});
  var desce = function(ev){ if(ev.button!==0) return; if(ev.target.closest && ev.target.closest("input, select, textarea, label, [role=dialog]")) return; var w = wrapRef.current; if(!w || w.scrollWidth<=w.clientWidth+4) return; arr.current = {on:true, moveu:false, x:ev.clientX, l:w.scrollLeft}; w.setAttribute("data-arrastando", "1"); document.body.style.userSelect = "none"; ev.stopPropagation(); };
  var clicou = function(ev){ if(arr.current.moveu){ ev.preventDefault(); ev.stopPropagation(); arr.current.moveu = false; } };
  useEffect(function(){
    var mv = function(ev){ var a = arr.current; if(!a.on || !wrapRef.current) return; var dx = ev.clientX-a.x; if(!a.moveu && Math.abs(dx)<4) return; if(!a.moveu){ a.moveu = true; wrapRef.current.style.cursor = "grabbing"; document.body.style.userSelect = "none"; } wrapRef.current.scrollLeft = a.l-dx; };
    var up = function(){ var a = arr.current; if(!a.on) return; a.on = false; if(wrapRef.current){ wrapRef.current.style.cursor = ""; wrapRef.current.removeAttribute("data-arrastando"); } document.body.style.userSelect = ""; };
    window.addEventListener("mousemove", mv); window.addEventListener("mouseup", up);
    return function(){ window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
  }, []);
  useEffect(function(){ var fecha = function(ev){ if(raiz.current && !raiz.current.contains(ev.target) && !(ev.target.closest && ev.target.closest("[role=dialog]"))) setAberto(null); }; document.addEventListener("pointerdown", fecha); return function(){ document.removeEventListener("pointerdown", fecha); }; }, []);
  var valores = useMemo(function(){ var r = {}; p.cols.forEach(function(c){ var m = new Map(); p.linhas.forEach(function(l){ var v = vazio(l[c.k]) ? "" : l[c.k]; m.set(v, true); }); r[c.k] = Array.from(m.keys()).sort(function(a, b){ return CMP.compare(String(a), String(b)); }); }); return r; }, [p.linhas, p.cols]);
  var linhas = useMemo(function(){
    var l = p.linhas.filter(function(x){ return p.cols.every(function(c){ var f = filtros[c.k]; return !f || f.has(vazio(x[c.k]) ? "" : x[c.k]); }); });
    var ks = []; if(p.agrupar) ks.push({k:p.agrupar, dir:1}); if(ordem && ordem.k!==p.agrupar) ks.push(ordem); else if(ordem && p.agrupar) ks[0].dir = ordem.dir;
    if(ks.length) l = l.slice().sort(function(a, b){ for(var i=0;i<ks.length;i++){ var r = CMP.compare(String(a[ks[i].k] ?? ""), String(b[ks[i].k] ?? "")); if(r) return r*ks[i].dir; } return 0; });
    return l;
  }, [p.linhas, p.cols, filtros, ordem, p.agrupar]);
  useEffect(function(){ setPag(1); }, [filtros, ordem]);
  var lim = p.limite ? p.limite*pag : 0, agrupado = !!(lim && p.agrupar && p.grupoAberto), vis = linhas, temMais = false;
  if(agrupado){   // com grupos, o limite vale POR GRUPO aberto (senão o primeiro grupo comia todas as linhas); grupo fechado entra com UMA linha, só para desenhar o título
    var cont = {}, visto = {}; vis = [];
    linhas.forEach(function(l){ var g = l[p.agrupar]; if(!p.grupoAberto(g)){ if(!visto[g]){ visto[g] = 1; vis.push(l); } return; } cont[g] = (cont[g] || 0)+1; if(cont[g]<=lim) vis.push(l); else temMais = true; });
  } else if(lim && linhas.length>lim){ vis = linhas.slice(0, lim); temMais = true; }
  useEffect(function(){ if(p.onFiltradas) p.onFiltradas(linhas); }, [linhas]);   // eslint-disable-line react-hooks/exhaustive-deps
  // linha branca de BAIXO dos blocos travados (fecha o contorno): largura = soma das larguras (rem) das colunas travadas de cada lado
  var remDe = function(w){ var m = /^([\d.]+)rem$/.exec(String(w||"")); return m ? Number(m[1]) : 0; };
  var wEsq = p.cols.filter(function(c){ return c.fixa; }).reduce(function(s2, c){ return s2+remDe(c.w); }, 0), wDir = p.cols.filter(function(c){ return c.fixaDir!==undefined; }).reduce(function(s2, c){ return s2+remDe(c.w); }, 0);
  var barrasBase = [wEsq>0 && e("span",{key:"be", "aria-hidden":true, className:"pointer-events-none absolute bottom-0 left-0 z-30 h-[3px] bg-white", style:{width:wEsq+"rem"}}), wDir>0 && e("span",{key:"bd", "aria-hidden":true, className:"pointer-events-none absolute bottom-0 right-0 z-30 h-[3px] bg-white", style:{width:wDir+"rem"}})];
  var centro = true, cel = " text-center";   // 02/11/2026 (Marcus): toda tabela centralizada, sem linhas verticais
  var nFiltros = Object.keys(filtros).filter(function(k){ return filtros[k]; }).length;
  var ncols = p.cols.length, corpo = [], ultimo, topo = [], base = [], sep = !!(p.cabSoAberto && agrupado);   // sep: TODAS as faixas de categoria em cima; a linha de títulos e os códigos das abertas embaixo
  var linhaCab = function(chave){ return e("tr",{key:chave}, p.cols.map(function(c){
          var f = !!filtros[c.k], o = ordem && ordem.k===c.k ? ordem.dir : 0;
          return e("th",{key:c.k, style:Object.assign({}, c.corTopo ? {borderTop:"3px solid "+c.corTopo} : {}, c.w ? {width:c.w, minWidth:c.w} : {}, p.alturaMax ? {position:"sticky", top:0, zIndex:5} : {}, c.fixaDir!==undefined ? {position:"sticky", right:(c.fixaDir==="0" ? 0 : "calc("+c.fixaDir+")"), zIndex:15, boxShadow:sombraFixa(c, "dir", true), top:(p.alturaMax ? 0 : undefined)} : {}, c.fixa ? {top:(p.alturaMax ? 0 : undefined), position:"sticky", left:(typeof c.fixa==="string" && c.fixa!=="0" ? "calc("+c.fixa+" - 1px)" : 0), zIndex:15, boxShadow:sombraFixa(c, "esq", true)} : {}), className:"relative h-[30px] cursor-default border-b border-border bg-transparent p-0 text-center"+(c.pulso ? " pulso-leve" : "")+(p.grade ? (escura ? " border-x border-x-white/15" : " border-x border-x-[#1a1306]/25") : "")+(c.sep ? (escura ? " border-l-2 border-l-[#E8B84B]" : " border-l-2 border-l-[#1a1306]") : "")},
            p.semFiltro ? e("div",{className:"flex h-[30px] w-full items-center justify-center whitespace-nowrap px-2.5 text-[11px] font-semibold uppercase tracking-[.05em] "+(escura ? "text-foreground" : "text-[#1a1306]")}, c.t) : e("button",{type:"button", onClick:function(){ setAberto(aberto===c.k ? null : c.k); }, title:"Filtrar e ordenar "+c.t, className:"flex h-[30px] w-full items-center justify-center gap-1.5 whitespace-nowrap px-2.5 text-[11px] font-semibold uppercase tracking-[.05em] cursor-default "+(escura ? "hover:bg-white/10 " : "hover:bg-black/10 ")+(f ? (escura ? "bg-[#E8B84B]/25 text-[#F5E7BE]" : "bg-[#1a1306] text-[#F5E7BE]") : (escura ? "text-foreground" : "text-[#1a1306]"))},
              c.t, o!==0 && e("span",{"aria-hidden":true}, o===1 ? "▲" : "▼"), e("span",{"aria-hidden":true, className:f ? "" : "opacity-60"}, f ? "◆" : "▾")),
            c.acao && e("button",{type:"button", title:c.acao.titulo, "aria-label":c.acao.titulo, onClick:function(ev){ ev.stopPropagation(); c.acao.onClick(); }, className:"absolute right-1 top-1 grid size-6 place-items-center rounded text-[13px] font-bold "+(escura ? "text-foreground hover:bg-white/15" : "text-[#1a1306] hover:bg-black/15")}, c.acao.rotulo),
            aberto===c.k && e(MenuColuna,{col:c, valores:valores[c.k], filtro:filtros[c.k] || null, ordem:ordem && ordem.k===c.k ? ordem : null,
              aoFechar:function(){ setAberto(null); }, aoFiltrar:function(s){ var n = Object.assign({}, filtros); if(s) n[c.k] = s; else delete n[c.k]; setFiltros(n); },
              aoOrdenar:function(d){ setOrdem(d ? {k:c.k, dir:d} : null); setAberto(null); }}), bordasFixas(c, true));
        })); };
  vis.forEach(function(l, i){
    if(p.agrupar && l[p.agrupar]!==ultimo){ ultimo = l[p.agrupar]; var q = 0; for(var j=i;j<vis.length && vis[j][p.agrupar]===ultimo;j++) q++;
      var gl = p.linhaGrupo ? p.linhaGrupo(ultimo, vis.slice(i, i+q)) : null, gv = ultimo;
      (sep ? topo : corpo).push(gl ? e("tr",{key:"g"+i, onClick:p.aoGrupo ? function(){ p.aoGrupo(gv); } : undefined, className:p.aoGrupo ? "cursor-pointer hover:brightness-125" : undefined}, e("td",{colSpan:gl.span, style:(p.cols[0] && p.cols[0].fixa) ? {position:"sticky", left:0, zIndex:10, background:"#2a2c33"} : undefined, className:(p.faixaFina ? "h-6 text-[11px] uppercase tracking-[.05em]" : "h-8 text-[13px]")+" whitespace-nowrap border-b border-border "+(escura ? "bg-white/10" : "bg-[#B8862B]/25")+" px-2.5 font-semibold"+(p.grupoEsquerda ? " text-left" : cel)}, gl.rotulo), (gl.resto||[]).map(function(x, j){ return e("td",{key:j, className:"h-8 whitespace-nowrap border-b border-border "+(escura ? "bg-white/10" : "bg-[#B8862B]/25")+" px-2.5 text-[13px] font-semibold tabular-nums"+cel}, x); })) // padrao-ok: linha do grupo com o texto no começo (pedido do Marcus, 03/11/2026, Atendimento interno › Listagens)
        : e("tr",{key:"g"+i}, e("td",{colSpan:ncols, className:"h-8 whitespace-nowrap border-b border-border bg-white/10 px-2.5 text-[13px] font-semibold"+cel}, p.rotuloGrupo ? p.rotuloGrupo(ultimo, q) : texto(ultimo)+" · "+q))); }
    if(p.agrupar && p.grupoAberto && !p.grupoAberto(l[p.agrupar])) return;   // grupo fechado: só a linha do grupo aparece
    var chv = p.chave ? l[p.chave] : i, aberta = !!(p.detalhe && (detAbertos[chv]!==undefined ? detAbertos[chv] : (p.detAberto && p.detAberto(l)))), det = aberta ? p.detalhe(l) : null; if(!det) aberta = false;
    var alterna = function(){ var n = Object.assign({}, detAbertos); n[chv] = !aberta; setDetAbertos(n); };
    (sep ? base : corpo).push(e("tr",{key:chv, onClick:p.detalhe ? alterna : p.aoClicar ? function(){ p.aoClicar(l); } : undefined, "aria-expanded":p.detalhe ? aberta : undefined, className:((p.detalhe || p.aoClicar) ? ((centro || p.soNoTexto) ? "cursor-grab" : "cursor-pointer")+" hover:bg-white/10"+(aberta ? (escura ? " bg-white/10" : " bg-[#B8862B]/20") : "") : "")+(p.linhaCls ? " "+(p.linhaCls(l) || "") : "")},
      p.cols.map(function(c, ci){ var tx = vazio(l[c.k]) ? "" : (c.fmt ? c.fmt(l[c.k], l) : String(l[c.k])); if(p.detalhe && ci===0) tx = (aberta ? "▾ " : "▸ ")+tx; return e("td",{key:c.k, style:Object.assign({}, c.w ? {width:c.w, minWidth:c.w} : {}, c.fixa ? {position:"sticky", left:(typeof c.fixa==="string" && c.fixa!=="0" ? "calc("+c.fixa+" - 1px)" : 0), zIndex:10, background:"var(--bgl,#1c1d21)", boxShadow:sombraFixa(c, "esq")} : {}, c.fixaDir!==undefined ? {position:"sticky", right:(c.fixaDir==="0" ? 0 : "calc("+c.fixaDir+")"), zIndex:10, background:"var(--bgl,#1c1d21)", boxShadow:sombraFixa(c, "dir")} : {}), className:"h-8 whitespace-nowrap border-b border-border px-2.5 text-[13px]"+(p.grade ? " border-x !border-white/25" : "")+cel+(c.sep ? " border-l-2 border-l-[#E8B84B]" : "")+(c.cor ? " "+c.cor(l) : "")}, c.render ? c.render(l[c.k], l, aberta) : (p.soNoTexto && p.aoClicar && tx!=="" ? e("span",{className:"cursor-pointer"}, tx) : tx), bordasFixas(c, false)); })));
    if(aberta) corpo.push(e("tr",{key:"d"+chv}, e("td",{colSpan:ncols, className:"border-b border-border bg-black/25 p-2"}, det)));
  });
  if(sep) corpo = topo.concat(base.length ? [linhaCab("cab")] : [], base);
  return e("div",{ref:raiz, className:"flex flex-col gap-2"+(p.cheia ? " h-full" : "")},
    (!p.semContagem || ((nFiltros>0 || ordem) && !p.semLimpar)) && e("div",{className:"flex flex-wrap items-center gap-3 text-[13px]"},
      !p.semContagem && e("span",{className:"font-semibold"}, linhas.length.toLocaleString("pt-BR")+" de "+p.linhas.length.toLocaleString("pt-BR")),
      (nFiltros>0 || ordem) && !p.semLimpar && e("button",{type:"button", onClick:function(){ setFiltros({}); setOrdem(null); }, className:"h-8 rounded-md border border-border bg-card px-3 text-[13px] hover:bg-white/10"}, "Limpar filtros e ordem")),
    e("div",{className:"relative"}, e("div",{ref:wrapRef, onMouseDown:desce, onClickCapture:clicou, "data-sem-arrastar":"", style:p.cheia ? {height:"100%"} : (p.alturaMax ? {maxHeight:p.alturaMax, overflowY:"auto"} : undefined), className:"overflow-x-auto rounded-lg border border-border"+(p.barraGrossa ? " barra-grossa" : "")+(p.compacta ? " w-fit max-w-full" : "")+((centro || p.maozinha) ? " cursor-grab [&[data-arrastando]_*]:!cursor-grabbing" : "")},
      e("table",{className:(p.compacta ? "" : "w-full ")+"border-collapse text-[13px]"+(p.cols.some(function(c){ return c.w; }) ? " table-fixed" : ""), style:{height:p.cheia ? "100%" : undefined, background:escura ? "#1c1d21" : "linear-gradient(90deg,#9A6F1E,#E8B84B 48%,#F5E7BE) left "+(p.totalLinha ? 33 : 0)+"px/100% "+(30*(1+(p.cabAcima ? p.cabAcima.length : 0)))+"px no-repeat"}},   // topo dourado: UM degradê do começo ao fim da tabela (02/11/2026)
        (p.cabSoAberto && p.agrupar && p.grupoAberto) ? null   // cabSoAberto: cabeçalho fora do topo: só aparece no corpo, depois dos grupos fechados e antes dos abertos (Marcus, 10/11/2026)
        : e("thead",null, p.totalLinha && e("tr",null, p.totalLinha(linhas).map(function(x, j){ return e("th",{key:j, colSpan:x && x.span ? x.span : 1, className:"h-8 whitespace-nowrap border-b border-border bg-[#4ade80]/15 px-2.5 text-[13px] font-semibold tabular-nums cursor-grab"+cel}, x && x.span ? x.t : x); })), (p.cabAcima || []).map(function(lin, i){ return e("tr",{key:"ca"+i}, lin.map(function(g, j){ return e("th",{key:j, colSpan:g.span || 1, className:"h-[30px] whitespace-nowrap border-b px-2.5 text-center text-[11px] font-semibold uppercase tracking-[.05em] "+(escura ? "border-white/15 text-foreground" : "border-[#1a1306]/25 text-[#1a1306]")+(g.sep ? (escura ? " border-l-2 border-l-[#E8B84B]" : " border-l-2 border-l-[#1a1306]") : "")}, g.t); })); }), linhaCab("cab")),
        e("tbody",null, corpo.length ? corpo : e("tr",null, e("td",{colSpan:ncols, className:"h-8 px-2.5 text-center text-[13px] text-muted-foreground"}, p.vazio || "Nenhum registro."))))), barrasBase),
    (lim>0 && temMais) && e("div",{className:"flex flex-wrap items-center justify-center gap-3 text-[13px]"},
      e("span",null, agrupado ? "Mostrando "+lim.toLocaleString("pt-BR")+" linhas em cada grupo aberto" : "Mostrando "+vis.length.toLocaleString("pt-BR")+" de "+linhas.length.toLocaleString("pt-BR")),
      e("button",{type:"button", onClick:function(){ setPag(pag+1); }, className:"h-8 rounded-md border border-border bg-card px-3 text-[13px] hover:bg-white/10"}, "Mostrar mais "+p.limite.toLocaleString("pt-BR"))));
}
export { TabelaPlanilha };
