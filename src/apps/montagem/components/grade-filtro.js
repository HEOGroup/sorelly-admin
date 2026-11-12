// Sorelly Admin · montagem — components/grade-filtro.js
// TABELA NO JEITO DE PLANILHA (Marcus, 01/11/2026), a mesma em todas as tabelas do Agendamento:
//   · barra dourada no cabeçalho; clicar no título da coluna abre o menu de components/filtro-planilha.js (classificar, condição e valores), sem ícone (Marcus, 02/11/2026: quem clica já sabe que abre o filtro);
//   · tudo centralizado;
//   · cada coluna tem a largura do MAIOR texto dela (título, linhas e total), medida na lista inteira: filtrar não encolhe a coluna e nada é cortado;
//   · coluna "fixa" fica parada à esquerda quando a tabela rola para o lado.
// Uso: e(GradeFiltro, {cols:[{k, t, tipo, v:function(linha), exib:function(linha), cel:function(linha), forte, cor:function(linha), fixa, min, semFiltro}], rows:linhas, chave:"id único", onRow:function(linha), rodape:function(linhasFiltradas){ return {k:"texto"}; }, vazio:"texto"})
//   tipo: "txt" (padrão), "num" ou "data" (decide as condições do filtro); v = valor para comparar e classificar; exib = texto mostrado (padrão: o próprio v); cel = conteúdo livre (campo, botão, barra).
import { MenuFiltro, ordenar, passaFiltro } from "@/apps/montagem/components/filtro-planilha";
import { e, useMemo, useState } from "@/shared/react";

var OURO = {background:"#1c1d21", color:"#fff"};   // topo escuro, sem dourado (Marcus, 12/11/2026)
var OURO_FIXO = {background:"#C9962F", color:"#1a1306"};
var texto = function(c, r){ if(c.exib) return c.exib(r); var v = c.v ? c.v(r) : ""; return v===undefined || v===null || v==="" ? "—" : String(v); };

// largura de cada coluna: título (+ seta e funil) ou o maior texto das linhas e do total
function medir(cols, rows, total){
  var cv = typeof document!=="undefined" ? document.createElement("canvas").getContext("2d") : null, out = {};
  var mede = function(t, peso){ if(!cv) return String(t).length*8; cv.font = peso+" 13px Inter, system-ui, sans-serif"; return cv.measureText(String(t)).width; };
  cols.forEach(function(c){
    var w = mede(c.t, 600)+(c.semFiltro ? 24 : 66);
    rows.forEach(function(r){ if(c.cel && !c.exib) return; var x = mede(texto(c, r), c.forte ? 600 : 400)+24; if(x>w) w = x; });
    if(total && total[c.k]!==undefined){ var y = mede(total[c.k], 600)+24; if(y>w) w = y; }
    out[c.k] = Math.ceil(Math.max(w, c.min || 0)); });
  return out;
}

function GradeFiltro(p){
  var cols = p.cols, rows = p.rows, fs = useState({}), fil = fs[0], setFil = fs[1], os = useState(null), ord = os[0], setOrd = os[1], pp = useState(null), pop = pp[0], setPop = pp[1];
  var larg = useMemo(function(){ return medir(cols, rows, p.rodape ? p.rodape(rows) : null); }, [rows, p.chave]);   // eslint-disable-line react-hooks/exhaustive-deps
  var soma = cols.reduce(function(s, c){ return s+larg[c.k]; }, 0), esq = {}, acc = 0; cols.forEach(function(c){ if(c.fixa){ esq[c.k] = acc; acc += larg[c.k]; } });
  var filtradas = rows.filter(function(r){ return cols.every(function(c){ var f = fil[c.k]; return !f || passaFiltro(f, c.tipo || "txt", c.v(r), texto(c, r)); }); });
  var colOrd = ord ? cols.find(function(c){ return c.k===ord.k; }) : null, linhas = colOrd ? ordenar(filtradas, colOrd, ord.dir) : filtradas;
  var ativo = function(c){ return !!fil[c.k] || (!!ord && ord.k===c.k); }, algum = cols.some(ativo);
  var abrir = function(c, ev){ if(pop && pop.col===c.k){ setPop(null); return; } var r = ev.currentTarget.getBoundingClientRect(); setPop({col:c.k, top:Math.max(8, Math.min(r.bottom+4, window.innerHeight-460)), left:Math.max(8, Math.min(r.left-120, window.innerWidth-320))}); };
  var cPop = pop ? cols.find(function(c){ return c.k===pop.col; }) : null;
  var valores = function(c){ var m = {}; rows.forEach(function(r){ var k = texto(c, r), g = m[k] || (m[k] = {v:k, n:0, b:c.v(r)}); g.n++; });
    return Object.keys(m).map(function(k){ return m[k]; }).sort(function(a, b){ var va = a.b===undefined || a.b===null || a.b==="", vb = b.b===undefined || b.b===null || b.b==="";
      if(va || vb) return va && vb ? 0 : va ? 1 : -1; if(typeof a.b==="number" && typeof b.b==="number") return a.b-b.b; return String(a.b).localeCompare(String(b.b), "pt-BR", {numeric:true}); }); };
  var tot = p.rodape ? p.rodape(linhas) : null;
  var TC = "h-8 whitespace-nowrap border-b border-border px-2.5 text-center text-[13px] tabular-nums ";
  // aviso visível quando há filtro ou classificação ativa (Marcus, 03/11/2026): quais colunas, quantas linhas aparecem e um botão para limpar tudo
  var ativas = cols.filter(ativo).map(function(c){ return c.t; });
  return e("div",{className:"flex flex-col gap-2"},
    algum && e("div",{role:"status", className:"flex flex-wrap items-center justify-center gap-2 rounded-lg border border-primary/60 bg-primary/10 px-3 py-1.5 text-[13px]"},
      e("b",null, "Filtro ativo"), e("span",null, "em "+ativas.join(", ")+" · mostrando "+linhas.length+" de "+rows.length),
      e("button",{type:"button", onClick:function(){ setFil({}); setOrd(null); setPop(null); }, className:"h-8 rounded-md border border-primary px-3 text-[13px] font-semibold text-primary hover:bg-primary/20"}, "Limpar filtros")),
    e("div",{className:"overflow-x-auto rounded-lg border border-border"},
      e("table",{className:"border-collapse text-[13px]", style:{tableLayout:"fixed", width:soma, minWidth:"100%"}},
        e("colgroup",null, cols.map(function(c){ return e("col",{key:c.k, style:{width:larg[c.k]}}); })),
        e("thead",null, e("tr",{style:OURO}, cols.map(function(c, i){
          return e("th",{key:c.k, onClick:c.semFiltro ? undefined : function(ev){ abrir(c, ev); }, title:c.semFiltro ? undefined : "Clique para classificar e filtrar", style:c.fixa ? Object.assign({position:"sticky", left:esq[c.k], zIndex:20}, OURO_FIXO) : null, className:"h-8 whitespace-nowrap border-r border-[rgba(0,0,0,.42)] px-2.5 text-center text-[13px] font-semibold last:border-r-0 "+(c.semFiltro ? "" : "cursor-pointer select-none hover:bg-black/10 ")+(ativo(c) ? "underline decoration-2 underline-offset-4" : "")},
            e("span",{className:"inline-flex items-center justify-center gap-1.5"}, c.t, ord && ord.k===c.k && e("span",{"aria-hidden":true}, ord.dir==="asc" ? "↑" : "↓"),
              i===0 && algum && e("button",{type:"button", title:"Limpar todos os filtros e a classificação", onClick:function(ev){ ev.stopPropagation(); setFil({}); setOrd(null); setPop(null); }, className:"ml-1 text-[11px] font-normal underline"}, "limpar"))); }))),
        e("tbody",null,
          linhas.length===0 ? e("tr",null, e("td",{colSpan:cols.length, className:"h-8 px-2.5 text-center text-[13px]"}, rows.length===0 ? (p.vazio || "Nada para mostrar.") : "Nada com esses filtros."))
          : linhas.map(function(r, i){
              return e("tr",{key:p.chave ? p.chave+i : i, onClick:p.onRow ? function(){ p.onRow(r); } : undefined, className:p.onRow ? "cursor-pointer hover:bg-white/10" : ""},
                cols.map(function(c){ return e("td",{key:c.k, title:c.cel ? undefined : texto(c, r), style:c.fixa ? {position:"sticky", left:esq[c.k], zIndex:10, background:"var(--card, #131315)"} : undefined, className:TC+(c.forte ? "font-semibold " : "")+(c.cor ? c.cor(r) : "")}, c.cel ? c.cel(r) : texto(c, r)); })); }),
          tot && linhas.length>0 && e("tr",{className:"border-t-2 border-border bg-white/5 font-semibold"}, cols.map(function(c){ return e("td",{key:c.k, style:c.fixa ? {position:"sticky", left:esq[c.k], zIndex:10, background:"var(--card, #131315)"} : undefined, className:TC}, tot[c.k]===undefined ? "" : tot[c.k]); }))))),
    pop && cPop && e(MenuFiltro,{key:cPop.k, col:{t:cPop.t, tipo:cPop.tipo || "txt"}, f:fil[cPop.k] || null, top:pop.top, left:pop.left, valores:valores(cPop), sort:ord && ord.k===cPop.k ? ord.dir : null, onClose:function(){ setPop(null); },
      setF:function(n){ var m = Object.assign({}, fil); if(n) m[cPop.k] = n; else delete m[cPop.k]; setFil(m); },
      setSort:function(dir){ setOrd(dir ? {k:cPop.k, dir:dir} : null); }}));
}

export { GradeFiltro };
