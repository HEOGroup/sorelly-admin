// Sorelly Admin · montagem — components/tabela-planilha.js
// Tabela no estilo planilha (pedido do Marcus, 26/10/2026): o filtro fica NA coluna (clicou no título: ordenar de A a Z, de Z a A, buscar e marcar valores),
// cada coluna tem a largura do maior conteúdo e nada é abreviado. Opção de agrupar as linhas por uma coluna.
// detalhe(linha) = o que abre logo embaixo da linha ao clicar (e fecha ao clicar de novo); começa tudo fechado.
// Opções novas (26/10/2026, tela Revendedoras): centro (células centralizadas, linhas finas), totalLinha(linhas) = células da linha de TOTAL acima do cabeçalho, linhaGrupo(valor, linhas) = {span, rotulo, resto[]}, onFiltradas(linhas) avisa quem está em volta, cols[].fmt(v, linha), cols[].cor(linha) e cols[].max (largura máxima em px; o que passar corta com … e aparece inteiro ao passar o mouse).
// cols: [{k, t}] (k = chave do valor na linha, t = título). linhas: objetos. aoClicar(linha). agrupar: chave da coluna ou "". rotuloGrupo(valor, qtd): texto da linha de grupo.
import { e, useEffect, useMemo, useRef, useState } from "@/shared/react";

var CMP = new Intl.Collator("pt-BR", {numeric:true, sensitivity:"base"});
var vazio = function(v){ return v===undefined || v===null || v===""; };
var texto = function(v, c){ return vazio(v) ? "(vazio)" : (c && c.fmt ? String(c.fmt(v)) : String(v)); };
var LIMITE_LISTA = 300;   // valores mostrados na lista do filtro; a busca refina o resto

function MenuColuna(p){
  var c = p.col, sb = useState(""), busca = sb[0], setBusca = sb[1];
  var todos = p.valores, marc = p.filtro;   // marc = Set dos valores marcados, ou null = todos
  var vis = todos.filter(function(v){ return !busca || texto(v, c).toLowerCase().indexOf(busca.toLowerCase())>=0; });
  var tudoMarcado = !marc || vis.every(function(v){ return marc.has(v); });
  var alterna = function(v){ var s = new Set(marc || todos); if(s.has(v)) s.delete(v); else s.add(v); p.aoFiltrar(s.size===todos.length ? null : s); };
  var todosVis = function(){ var s = new Set(marc || todos); if(tudoMarcado){ vis.forEach(function(v){ s.delete(v); }); } else vis.forEach(function(v){ s.add(v); }); p.aoFiltrar(s.size===todos.length ? null : s); };
  var item = "flex h-8 w-full items-center gap-2 px-3 text-left text-[13px] hover:bg-white/10";
  return e("div",{role:"dialog", "aria-label":"Filtro da coluna "+c.t, onPointerDown:function(ev){ ev.stopPropagation(); }, className:"absolute left-0 top-full z-30 mt-0.5 flex w-72 flex-col rounded-lg border border-border bg-popover py-1 text-left font-normal normal-case tracking-normal text-foreground shadow-xl"},
    e("button",{type:"button", className:item+(p.ordem && p.ordem.dir===1 ? " text-primary" : ""), onClick:function(){ p.aoOrdenar(1); }}, "Ordenar de A a Z"),
    e("button",{type:"button", className:item+(p.ordem && p.ordem.dir===-1 ? " text-primary" : ""), onClick:function(){ p.aoOrdenar(-1); }}, "Ordenar de Z a A"),
    p.ordem && e("button",{type:"button", className:item, onClick:function(){ p.aoOrdenar(0); }}, "Tirar a ordenação"),
    e("div",{className:"my-1 border-t border-border"}),
    e("div",{className:"px-3 py-1"}, e("input",{type:"search", autoFocus:true, value:busca, placeholder:"Buscar", onChange:function(ev){ setBusca(ev.target.value); }, className:"h-8 w-full rounded-md border border-border bg-card px-2.5 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"})),
    e("label",{className:item+" cursor-pointer"}, e("input",{type:"checkbox", checked:tudoMarcado && vis.length>0, onChange:todosVis, className:"size-4 accent-[#E8B84B]"}), busca ? "Selecionar o que aparece" : "Selecionar tudo"),
    e("div",{className:"max-h-64 overflow-y-auto"},
      vis.slice(0, LIMITE_LISTA).map(function(v){ return e("label",{key:String(v), className:item+" cursor-pointer"}, e("input",{type:"checkbox", checked:!marc || marc.has(v), onChange:function(){ alterna(v); }, className:"size-4 shrink-0 accent-[#E8B84B]"}), e("span",{className:"whitespace-nowrap"}, texto(v, c))); }),
      vis.length>LIMITE_LISTA && e("div",{className:"px-3 py-1 text-[12px] text-muted-foreground"}, "Mostrando "+LIMITE_LISTA+" de "+vis.length+". Use a busca para achar o resto."),
      !vis.length && e("div",{className:"px-3 py-1 text-[12px] text-muted-foreground"}, "Nada encontrado.")),
    marc && e("div",{className:"mt-1 border-t border-border pt-1"}, e("button",{type:"button", className:item, onClick:function(){ p.aoFiltrar(null); }}, "Limpar o filtro desta coluna")));
}

function TabelaPlanilha(p){
  var sf = useState({}), filtros = sf[0], setFiltros = sf[1];
  var so = useState(null), ordem = so[0], setOrdem = so[1];   // {k, dir}
  var sa = useState(null), aberto = sa[0], setAberto = sa[1], sdt = useState({}), detAbertos = sdt[0], setDetAbertos = sdt[1];
  var raiz = useRef(null);
  useEffect(function(){ var fecha = function(ev){ if(raiz.current && !raiz.current.contains(ev.target)) setAberto(null); }; document.addEventListener("pointerdown", fecha); return function(){ document.removeEventListener("pointerdown", fecha); }; }, []);
  var valores = useMemo(function(){ var r = {}; p.cols.forEach(function(c){ var m = new Map(); p.linhas.forEach(function(l){ var v = vazio(l[c.k]) ? "" : l[c.k]; m.set(v, true); }); r[c.k] = Array.from(m.keys()).sort(function(a, b){ return CMP.compare(String(a), String(b)); }); }); return r; }, [p.linhas, p.cols]);
  var linhas = useMemo(function(){
    var l = p.linhas.filter(function(x){ return p.cols.every(function(c){ var f = filtros[c.k]; return !f || f.has(vazio(x[c.k]) ? "" : x[c.k]); }); });
    var ks = []; if(p.agrupar) ks.push({k:p.agrupar, dir:1}); if(ordem && ordem.k!==p.agrupar) ks.push(ordem); else if(ordem && p.agrupar) ks[0].dir = ordem.dir;
    if(ks.length) l = l.slice().sort(function(a, b){ for(var i=0;i<ks.length;i++){ var r = CMP.compare(String(a[ks[i].k] ?? ""), String(b[ks[i].k] ?? "")); if(r) return r*ks[i].dir; } return 0; });
    return l;
  }, [p.linhas, p.cols, filtros, ordem, p.agrupar]);
  useEffect(function(){ if(p.onFiltradas) p.onFiltradas(linhas); }, [linhas]);   // eslint-disable-line react-hooks/exhaustive-deps
  var centro = !!p.centro, cel = centro ? " text-center border-x border-border" : "";
  var nFiltros = Object.keys(filtros).filter(function(k){ return filtros[k]; }).length;
  var ncols = p.cols.length, corpo = [], ultimo;
  linhas.forEach(function(l, i){
    if(p.agrupar && l[p.agrupar]!==ultimo){ ultimo = l[p.agrupar]; var q = 0; for(var j=i;j<linhas.length && linhas[j][p.agrupar]===ultimo;j++) q++;
      var gl = p.linhaGrupo ? p.linhaGrupo(ultimo, linhas.slice(i, i+q)) : null;
      corpo.push(gl ? e("tr",{key:"g"+i}, e("td",{colSpan:gl.span, className:"h-8 whitespace-nowrap border-b border-border bg-[#B8862B]/25 px-2.5 text-[13px] font-semibold"+cel}, gl.rotulo), (gl.resto||[]).map(function(x, j){ return e("td",{key:j, className:"h-8 whitespace-nowrap border-b border-border bg-[#B8862B]/25 px-2.5 text-[13px] font-semibold tabular-nums"+cel}, x); }))
        : e("tr",{key:"g"+i}, e("td",{colSpan:ncols, className:"h-8 whitespace-nowrap border-b border-border bg-white/10 px-2.5 text-[13px] font-semibold"+cel}, p.rotuloGrupo ? p.rotuloGrupo(ultimo, q) : texto(ultimo)+" · "+q))); }
    var chv = p.chave ? l[p.chave] : i, aberta = !!(p.detalhe && detAbertos[chv]);
    var alterna = function(){ var n = Object.assign({}, detAbertos); if(n[chv]) delete n[chv]; else n[chv] = true; setDetAbertos(n); };
    corpo.push(e("tr",{key:chv, onClick:p.detalhe ? alterna : p.aoClicar ? function(){ p.aoClicar(l); } : undefined, "aria-expanded":p.detalhe ? aberta : undefined, className:(p.detalhe || p.aoClicar) ? "cursor-pointer hover:bg-white/10"+(aberta ? " bg-[#B8862B]/20" : "") : ""},
      p.cols.map(function(c, ci){ var tx = vazio(l[c.k]) ? "" : (c.fmt ? c.fmt(l[c.k], l) : String(l[c.k])); if(p.detalhe && ci===0) tx = (aberta ? "▾ " : "▸ ")+tx; return e("td",{key:c.k, title:c.max ? tx : undefined, style:c.max ? {maxWidth:c.max} : undefined, className:"h-8 whitespace-nowrap border-b border-border px-2.5 text-[13px]"+cel+(c.max ? " overflow-hidden text-ellipsis" : "")+(c.cor ? " "+c.cor(l) : "")}, tx); })));
    if(aberta) corpo.push(e("tr",{key:"d"+chv}, e("td",{colSpan:ncols, className:"border-b border-border bg-black/25 p-2"}, p.detalhe(l))));
  });
  return e("div",{ref:raiz, className:"flex flex-col gap-2"},
    e("div",{className:"flex flex-wrap items-center gap-3 text-[13px]"},
      e("span",{className:"font-semibold"}, linhas.length.toLocaleString("pt-BR")+" de "+p.linhas.length.toLocaleString("pt-BR")),
      (nFiltros>0 || ordem) && e("button",{type:"button", onClick:function(){ setFiltros({}); setOrdem(null); }, className:"h-8 rounded-md border border-border bg-card px-3 text-[13px] hover:bg-white/10"}, "Limpar filtros e ordem")),
    e("div",{className:"overflow-x-auto rounded-lg border border-border"},
      e("table",{className:"border-collapse text-[13px]"+(centro ? " w-full" : "")},
        e("thead",null, p.totalLinha && e("tr",null, p.totalLinha(linhas).map(function(x, j){ return e("th",{key:j, colSpan:x && x.span ? x.span : 1, className:"h-8 whitespace-nowrap border-b border-border bg-[#4ade80]/15 px-2.5 text-[13px] font-semibold tabular-nums"+cel}, x && x.span ? x.t : x); })), e("tr",null, p.cols.map(function(c){
          var f = !!filtros[c.k], o = ordem && ordem.k===c.k ? ordem.dir : 0;
          return e("th",{key:c.k, className:"relative h-[30px] border-b border-border bg-white/5 p-0 "+(centro ? "text-center border-x border-border" : "text-left")},
            e("button",{type:"button", onClick:function(){ setAberto(aberto===c.k ? null : c.k); }, title:"Filtrar e ordenar "+c.t, className:"flex h-[30px] w-full items-center gap-1.5 whitespace-nowrap px-2.5 text-[11px] font-medium uppercase tracking-[.05em] hover:bg-white/10 "+(centro ? "justify-center " : "")+(f ? "text-primary" : "text-foreground")},
              c.t, o!==0 && e("span",{"aria-hidden":true}, o===1 ? "▲" : "▼"), e("span",{"aria-hidden":true, className:f ? "" : "opacity-60"}, f ? "◆" : "▾")),
            aberto===c.k && e(MenuColuna,{col:c, valores:valores[c.k], filtro:filtros[c.k] || null, ordem:ordem && ordem.k===c.k ? ordem : null,
              aoFiltrar:function(s){ var n = Object.assign({}, filtros); if(s) n[c.k] = s; else delete n[c.k]; setFiltros(n); },
              aoOrdenar:function(d){ setOrdem(d ? {k:c.k, dir:d} : null); setAberto(null); }}));
        }))),
        e("tbody",null, corpo.length ? corpo : e("tr",null, e("td",{colSpan:ncols, className:"h-8 px-2.5 text-[13px] text-muted-foreground"}, p.vazio || "Nenhum registro."))))));
}
export { TabelaPlanilha };
