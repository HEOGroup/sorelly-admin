// Sorelly Admin · montagem — components/filtro-planilha.js
// FILTRO DE COLUNA NO ESTILO DO GOOGLE PLANILHAS (Marcus, 01/11/2026): o ícone de funil no cabeçalho abre um menu com
//   · Classificar A → Z e Z → A
//   · Filtrar por condição (contém, é igual a, maior que, antes de, está vazio…)
//   · Filtrar por valores (pesquisa, Selecionar tudo, Limpar e uma caixa para cada valor, com a quantidade de linhas)
// O filtro só esconde linhas, nunca apaga dados. Cada coluna guarda {op, v, vals}: op/v = condição; vals = lista dos valores marcados (null = todos).
// Uso: passaFiltro(f, tipo, bruto, exibido) diz se a linha passa; ordenar(lista, coluna, dir, hoje) classifica; e(MenuFiltro, {...}) é o menu.
import { Botao, CAMPO } from "@/apps/montagem/components/padrao-fin";
import { e, useState } from "@/shared/react";

var CONDICOES = {
  txt:[["", "Nenhuma"], ["contem", "Contém"], ["ncontem", "Não contém"], ["igual", "É igual a"], ["comeca", "Começa com"], ["vazio", "Está vazio"], ["cheio", "Não está vazio"]],
  num:[["", "Nenhuma"], ["maior", "Maior que"], ["menor", "Menor que"], ["igual", "É igual a"], ["vazio", "Está vazio"], ["cheio", "Não está vazio"]],
  data:[["", "Nenhuma"], ["igual", "É igual a"], ["antes", "É antes de"], ["depois", "É depois de"], ["vazio", "Está vazio"], ["cheio", "Não está vazio"]]};
var GRUPO = {txt:"txt", sel:"txt", num:"num", din:"num", falt:"num", seq:"num", data:"data"};
var norm = function(t){ return String(t==null ? "" : t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
var vazio = function(b){ return b===null || b===undefined || b==="" || b==="—"; };

// a linha passa pelo filtro desta coluna? bruto = valor para comparar; exib = texto mostrado na tabela
function passaFiltro(f, tipo, bruto, exib){
  if(!f) return true;
  if(f.vals && f.vals.indexOf(exib)<0) return false;
  if(!f.op) return true;
  if(f.op==="vazio") return vazio(bruto);
  if(f.op==="cheio") return !vazio(bruto);
  if(f.v===undefined || f.v===null || f.v==="") return true;
  var g = GRUPO[tipo] || "txt";
  if(g==="num"){ var n = Number(bruto), v = Number(f.v); if(vazio(bruto) || isNaN(n)) return false; return f.op==="maior" ? n>v : f.op==="menor" ? n<v : n===v; }
  if(g==="data"){ if(vazio(bruto)) return false; return f.op==="igual" ? bruto===f.v : f.op==="antes" ? bruto<f.v : bruto>f.v; }
  var a = norm(bruto), b = norm(f.v);
  return f.op==="contem" ? a.indexOf(b)>=0 : f.op==="ncontem" ? a.indexOf(b)<0 : f.op==="igual" ? a===b : a.indexOf(b)===0;
}
// classifica uma cópia da lista pela coluna (c.v(linha, hoje) é o valor bruto); vazios vão sempre para o fim
function ordenar(lista, c, dir, hoje){
  var mult = dir==="desc" ? -1 : 1;
  return lista.slice().sort(function(r1, r2){ var a = c.v(r1, hoje), b = c.v(r2, hoje), va = vazio(a), vb = vazio(b);
    if(va || vb) return va && vb ? 0 : va ? 1 : -1;
    if(typeof a==="number" && typeof b==="number") return (a-b)*mult;
    return String(a).localeCompare(String(b), "pt-BR", {numeric:true})*mult; });
}

// menu aberto pelo ícone do cabeçalho. Props: col {t, tipo}, f (filtro atual ou null), setF(f|null), sort ("asc"|"desc"|null), setSort(dir|null),
// valores [{v, n}] (valores únicos da coluna, na ordem certa, com a quantidade de linhas), top/left (posição na tela), onClose
function MenuFiltro(p){
  var bq = useState(""), busca = bq[0], setBusca = bq[1], c = p.col, f = p.f || {op:"", v:"", vals:null}, g = GRUPO[c.tipo] || "txt", todos = p.valores.map(function(x){ return x.v; });
  var grava = function(n){ var vals = n.vals && n.vals.length===todos.length ? null : n.vals; var novo = {op:n.op||"", v:n.v||"", vals:vals}; p.setF(!novo.op && !novo.vals ? null : novo); };
  var visiveis = p.valores.filter(function(x){ return !busca || norm(x.v).indexOf(norm(busca))>=0; }), mostra = visiveis.slice(0, 300);
  var marcado = function(v){ return f.vals===null || f.vals===undefined || f.vals.indexOf(v)>=0; };
  var alterna = function(v){ var cur = f.vals ? f.vals.slice() : todos.slice(), i = cur.indexOf(v); if(i>=0) cur.splice(i, 1); else cur.push(v); grava({op:f.op, v:f.v, vals:cur}); };
  var marcaVisiveis = function(on){ var base = f.vals ? f.vals.slice() : todos.slice(), vis = visiveis.map(function(x){ return x.v; });
    var cur = on ? base.concat(vis.filter(function(v){ return base.indexOf(v)<0; })) : base.filter(function(v){ return vis.indexOf(v)<0; }); grava({op:f.op, v:f.v, vals:cur}); };
  var BTN = "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] hover:bg-white/10 ";
  var TIT = "text-[11px] font-medium uppercase tracking-[.05em] text-foreground";
  var sortBtn = function(dir, rot){ var on = p.sort===dir; return e("button",{type:"button", onClick:function(){ p.setSort(on ? null : dir); }, className:BTN+(on ? "bg-primary/20 font-semibold text-primary" : "")}, rot); };
  return e("div",null,
    e("div",{className:"fixed inset-0 z-30", onClick:p.onClose}),
    e("div",{role:"dialog", "aria-label":"Filtro de "+c.t, className:"fixed z-40 flex max-h-[78vh] w-[300px] flex-col gap-1.5 overflow-y-auto rounded-lg border border-border bg-card p-2.5 text-[13px] text-foreground shadow-2xl", style:{top:p.top, left:p.left}},
      sortBtn("asc", "Classificar A → Z"), sortBtn("desc", "Classificar Z → A"),
      e("div",{className:"mt-1 border-t border-border pt-2"}, e("div",{className:TIT}, "Filtrar por condição")),
      e("select",{value:f.op||"", "aria-label":"Condição", className:CAMPO, onChange:function(ev){ grava({op:ev.target.value, v:f.v, vals:f.vals}); }}, CONDICOES[g].map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })),
      f.op && f.op!=="vazio" && f.op!=="cheio" && e("input",{type:g==="num" ? "number" : g==="data" ? "date" : "text", value:f.v||"", placeholder:"Valor", "aria-label":"Valor da condição", className:CAMPO, onChange:function(ev){ grava({op:f.op, v:ev.target.value, vals:f.vals}); }}),
      e("div",{className:"mt-1 border-t border-border pt-2"}, e("div",{className:TIT}, "Filtrar por valores")),
      e("input",{type:"search", value:busca, placeholder:"Pesquisar", "aria-label":"Pesquisar valores", className:CAMPO, onChange:function(ev){ setBusca(ev.target.value); }}),
      e("div",{className:"flex items-center gap-3 px-1"},
        e("button",{type:"button", onClick:function(){ marcaVisiveis(true); }, className:"text-primary underline"}, "Selecionar tudo"),
        e("button",{type:"button", onClick:function(){ marcaVisiveis(false); }, className:"text-primary underline"}, "Limpar"),
        e("span",{className:"flex-1"}), e("span",{className:"tabular-nums"}, visiveis.length.toLocaleString("pt-BR")+(visiveis.length===1 ? " valor" : " valores"))),
      e("div",{className:"max-h-56 overflow-y-auto rounded-md border border-border"},
        mostra.length===0 ? e("p",{className:"px-2 py-2"}, "Nenhum valor encontrado.") : mostra.map(function(x){
          return e("label",{key:x.v, title:x.v, className:"flex h-8 cursor-pointer items-center gap-2 px-2 hover:bg-white/10"},
            e("input",{type:"checkbox", checked:marcado(x.v), onChange:function(){ alterna(x.v); }}), e("span",{className:"min-w-0 flex-1 truncate"}, x.v), e("b",{className:"font-normal tabular-nums"}, x.n.toLocaleString("pt-BR"))); }),
        visiveis.length>mostra.length && e("p",{className:"border-t border-border px-2 py-2"}, "Mostrando 300 de "+visiveis.length.toLocaleString("pt-BR")+". Pesquise para achar os outros.")),
      e("div",{className:"flex items-center justify-between gap-2 pt-1"},
        e(Botao,{onClick:function(){ p.setF(null); p.setSort(null); }}, "Limpar coluna"), e(Botao,{principal:true, onClick:p.onClose}, "Fechar"))));
}

export { MenuFiltro, passaFiltro, ordenar };
