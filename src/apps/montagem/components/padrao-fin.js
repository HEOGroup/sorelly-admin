// Sorelly Admin · montagem — components/padrao-fin.js
// PEÇAS DO PADRÃO DO FINANCEIRO (regra fixa do Marcus, 22/10/2026; texto no fim de PADRAO-VISUAL.md). Toda tela do Financeiro nova ou mexida usa só estas peças:
//  · BlocoFiltros / Campo / CampoSel: filtros NO TOPO, grade de 4 colunas iguais (2 no celular), rótulo em cima, controle de 32 px (h-8), texto 13 px que corta com "…".
//  · FaixaTotais: indicadores numa linha só, células iguais, centralizadas, rótulo + valor (sem nota cinza).
//  · AbasTela / Segmentado: visões sempre visíveis (abas para destinos, segmentado para 2 a 5 opções da mesma tabela).
//  · TabelaP: tabela de layout fixo, cabeçalho de 30 px (11 px, caixa alta), linhas de 32 px, texto corta com "…", números à direita.
// Cor só no valor: classes COR.entra (verde) e COR.sai (vermelho); saldo pela cor do sinal (corSinal). Todo valor em reais leva "R$" (use BKC / brl).
import { BKC } from "@/apps/montagem/lib/format";
import { e } from "@/shared/react";

var COR = {entra:"text-success", sai:"text-destructive"};
var corSinal = function(v){ return v<0 ? COR.sai : v>0 ? COR.entra : ""; };
var brl = function(v){ return v<0 ? "−"+BKC(-v) : BKC(v); };   // negativo com sinal de menos na frente: −R$ 1.000,00
var inteiro = function(v){ return Math.round(v||0).toLocaleString("pt-BR"); };

var H = "h-8";   // 32 px: altura única de campo, seleção, busca e botão
var CAMPO = H+" w-full min-w-0 rounded-md border border-border bg-card px-2.5 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary";

// rótulo de 11 px em caixa alta, uma linha, corta com "…"
function Rotulo(p){ return e("label",{htmlFor:p.id, title:p.t, className:"mb-0.5 block h-4 truncate text-[11px] font-medium uppercase tracking-[.05em] text-foreground"}, p.t); }

// seleção com altura única; texto longo corta com "…" (o campo nunca cresce)
function CampoSel(p){
  return e("div",{className:"min-w-0 "+(p.cls||"")},
    e(Rotulo,{t:p.t, id:p.id}),
    e("select",{id:p.id, value:p.value, onChange:function(ev){ p.onChange(ev.target.value); }, title:p.title, className:CAMPO+" truncate"},
      p.opcoes.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })));
}
function CampoBusca(p){
  return e("div",{className:"col-span-2 min-w-0"},
    e(Rotulo,{t:p.t||"Buscar", id:p.id}),
    e("input",{id:p.id, type:"search", value:p.value, placeholder:p.placeholder||"", onChange:function(ev){ p.onChange(ev.target.value); }, className:CAMPO}));
}
// botão de 32 px, largura mínima de 96 px, texto em uma linha (corta com "…")
function Botao(p){
  return e("button",{type:"button", onClick:p.onClick, disabled:p.desabilitado, title:p.title || (typeof p.children==="string" ? p.children : undefined),
    className:H+" min-w-24 max-w-full truncate rounded-md border px-3.5 text-[13px] "+(p.principal ? "border-primary bg-primary/20 font-semibold text-primary hover:bg-primary/30" : "border-border bg-card text-foreground hover:bg-white/10")+(p.desabilitado ? " opacity-50" : "")}, p.children);
}

// bloco "Filtros": grade de 4 colunas iguais; p.children = campos; p.onLimpar e p.onFiltrar são opcionais (botões à direita da última linha)
function BlocoFiltros(p){
  return e("section",{className:"rounded-lg border border-border bg-card/60"},
    e("div",{className:"flex h-8 items-center px-3 text-[13px] font-medium text-foreground"}, p.titulo || "Filtros"),
    e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 px-3 pb-3 md:grid-cols-4"}, p.children,
      (p.onLimpar || p.onFiltrar) && e("div",{className:"col-span-2 flex items-end justify-end gap-2 md:col-start-3"},
        p.onLimpar && e(Botao,{onClick:p.onLimpar}, "Limpar"), p.onFiltrar && e(Botao,{principal:true, onClick:p.onFiltrar}, "Filtrar"))));
}

// faixa de totais: itens = [{t, v, cor}] — células iguais numa linha, centralizadas, valor em uma linha (corta com "…" só em tela muito estreita)
function FaixaTotais(p){
  var n = p.itens.length;
  return e("div",{className:"grid overflow-hidden rounded-lg border border-border bg-card/60", style:{gridTemplateColumns:"repeat("+n+", minmax(0, 1fr))"}},
    p.itens.map(function(x, i){ return e("div",{key:x.t, className:"min-w-0 px-2 py-1.5 text-center "+(i ? "border-l border-border" : "")},
      e("div",{className:"truncate text-[11px] font-medium uppercase tracking-[.05em] text-foreground", title:x.t}, x.t),
      e("div",{className:"truncate text-[15px] font-medium tabular-nums "+(x.cor||"text-foreground"), title:x.v}, x.v)); }));
}

// bloco com título (barra de 32 px) e conteúdo; dir = elemento à direita do título (ex.: seletor ou contagem)
function Bloco(p){
  return e("section",{className:"rounded-lg border border-border bg-card/60 "+(p.cls||"")},
    e("div",{className:"flex h-8 items-center justify-between gap-2 px-3 text-[13px] font-medium text-foreground"}, e("span",{className:"truncate", title:p.t}, p.t), p.dir),
    e("div",{className:"px-3 pb-3"}, p.children));
}

// abas visíveis (destinos de uma mesma tela): abas = [[chave, título]]
function AbasTela(p){
  return e("div",{role:"tablist", className:"flex flex-wrap gap-1 border-b border-border"}, p.abas.map(function(a){ var on = a[0]===p.atual;
    return e("button",{key:a[0], type:"button", role:"tab", "aria-selected":on, onClick:function(){ p.onMudar(a[0]); },
      className:"-mb-px h-9 border-b-2 px-3 text-[13px] "+(on ? "border-primary font-semibold text-foreground" : "border-transparent text-foreground/80 hover:text-foreground")}, a[1]); }));
}
// segmentado (2 a 5 opções sempre visíveis, trocam a visão da MESMA tabela): opcoes = [[chave, título]]
function Segmentado(p){
  return e("div",{role:"group", className:"inline-flex overflow-hidden rounded-md border border-border"}, p.opcoes.map(function(o, i){ var on = o[0]===p.atual;
    return e("button",{key:o[0], type:"button", "aria-pressed":on, onClick:function(){ p.onMudar(o[0]); },
      className:H+" whitespace-nowrap px-3 text-[13px] "+(i ? "border-l border-border " : "")+(on ? "bg-primary/20 font-semibold text-primary" : "text-foreground hover:bg-white/10")}, o[1]); }));
}

// tabela de layout fixo. cols = [{t, w, n}] (w = largura em px; sem w = o espaço que sobrar; n = coluna de número, alinhada à direita)
function TabelaP(p){
  return e("div",{className:"overflow-x-auto rounded-lg border border-border"},
    e("table",{className:"w-full table-fixed border-collapse text-[13px]", style:{minWidth:p.minW||undefined}},
      e("colgroup",null, p.cols.map(function(c, i){ return e("col",{key:i, style:c.w ? {width:c.w} : undefined}); })),
      e("thead",null, e("tr",null, p.cols.map(function(c, i){ return e("th",{key:i, title:c.d || c.t, className:"h-[30px] truncate border-b border-border bg-white/5 px-2.5 text-[11px] font-medium uppercase tracking-[.05em] text-foreground "+(c.c ? "text-center" : c.n ? "text-right" : "text-left")}, c.t); }))),
      e("tbody",null, p.children)));
}
// célula e linha da TabelaP. valor (n:true) à direita, fonte tabular; texto à esquerda com corte "…" e title
var TD = "h-8 border-b border-border px-2.5 ";
function Td(p){
  var txt = typeof p.children==="string" ? p.children : undefined;
  return e("td",{title:p.title || txt, className:TD+(p.c ? "overflow-hidden text-ellipsis whitespace-nowrap text-center tabular-nums " : p.n ? "whitespace-nowrap text-right tabular-nums " : "truncate text-left ")+(p.cor||"")+(p.forte ? " font-semibold" : "")}, p.children);
}
function Tr(p){ return e("tr",{onClick:p.onClick, title:p.title, className:(p.total ? "border-t-2 border-border bg-white/5 font-semibold" : (p.alerta ? "bg-destructive/10" : (p.apagado ? "opacity-60" : "")))+(p.onClick ? " cursor-pointer hover:bg-white/10" : "")}, p.children); }

export { COR, corSinal, brl, inteiro, H, CAMPO, Rotulo, CampoSel, CampoBusca, Botao, BlocoFiltros, Bloco, FaixaTotais, AbasTela, Segmentado, TabelaP, Td, Tr };
