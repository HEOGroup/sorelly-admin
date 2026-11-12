// Sorelly Admin · montagem — components/padrao-fin.js
// PEÇAS DO PADRÃO DO FINANCEIRO (regra fixa do Marcus, 22/10/2026; texto no fim de docs/design/PADRAO-VISUAL.md). Toda tela do Financeiro nova ou mexida usa só estas peças:
//  · BlocoFiltros / Campo / CampoSel: filtros NO TOPO, grade de 4 colunas iguais (2 no celular), rótulo em cima, controle de 32 px (h-8), texto 13 px que corta com "…".
//  · FaixaTotais: indicadores numa linha só, células iguais, centralizadas, rótulo + valor (sem nota cinza).
//  · AbasTela / Segmentado: visões sempre visíveis (abas para destinos, segmentado para 2 a 5 opções da mesma tabela).
//  · TabelaP: tabela de layout fixo, cabeçalho de 30 px (11 px, caixa alta), linhas de 32 px, texto corta com "…", números à direita.
// Cor só no valor: classes COR.entra (verde) e COR.sai (vermelho); saldo pela cor do sinal (corSinal). Todo valor em reais leva "R$" (use BKC / brl).
import { BKC } from "@/apps/montagem/lib/format";
import { e } from "@/shared/react";
import React from "react";

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
    e("div",{className:"flex h-8 items-center justify-between gap-2 px-3 text-[13px] font-medium "+(p.ouro ? "rounded-t-md font-semibold text-[#1a1306]" : "text-foreground"), style:p.ouro ? {background:"linear-gradient(90deg,#9A6F1E,#E8B84B 48%,#F5E7BE)"} : undefined}, e("span",{title:p.t}, p.t), p.dir),   // ouro: barra de título dourada em degradê (ficha de experiência, 03/11/2026)
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

// MENU SUSPENSO COM MARCAÇÃO (Marcus, 09/11/2026: chips/pílulas nunca mais): várias opções num campo de 32 px que abre uma lista com caixa de marcar.
// Uso: e(MenuMulti, {t:"Membros", opcoes:[["peito","Peito"], ...], valor:["peito"], onChange:function(lista){...}, plural:"membros", vazio:"Nenhum"})
function MenuMulti(p){
  var st = React.useState(false), aberto = st[0], setAberto = st[1], ref = React.useRef(null);
  React.useEffect(function(){
    if(!aberto) return undefined;
    var fora = function(ev){ if(ref.current && !ref.current.contains(ev.target)) setAberto(false); };
    document.addEventListener("mousedown", fora); return function(){ document.removeEventListener("mousedown", fora); };
  }, [aberto]);
  var marcados = p.opcoes.filter(function(o){ return p.valor.indexOf(o[0])>=0; });
  var rot = !marcados.length ? (p.vazio || "Nenhum") : marcados.length<=3 ? marcados.map(function(o){ return o[1]; }).join(", ") : marcados.length+" "+(p.plural || "marcados");
  var alterna = function(k){ p.onChange(p.valor.indexOf(k)>=0 ? p.valor.filter(function(x){ return x!==k; }) : p.valor.concat([k])); };
  return e("div",{ref:ref, className:"relative min-w-0 "+(p.cls||"")},
    p.t && e(Rotulo,{t:p.t, id:p.id}),
    e("button",{id:p.id, type:"button", "aria-expanded":aberto, onClick:function(){ setAberto(!aberto); }, className:CAMPO+" flex items-center justify-center gap-2 whitespace-nowrap"}, e("span",null, rot), e("span",{"aria-hidden":"true"}, aberto ? "▴" : "▾")),
    aberto && e("div",{className:"absolute left-0 top-full z-40 mt-1 w-full min-w-44 rounded-md border border-border bg-card p-1 shadow-lg"},
      p.opcoes.map(function(o){ return e("label",{key:o[0], className:"flex h-8 cursor-pointer items-center gap-2 rounded px-2 text-[13px] hover:bg-white/10"}, e("input",{type:"checkbox", checked:p.valor.indexOf(o[0])>=0, onChange:function(){ alterna(o[0]); }}), o[1]); })));
}

// tabela de layout fixo. cols = [{t, w, n}] (w = largura em px; sem w = o espaço que sobrar; n = coluna de número, alinhada à direita)
function TabelaP(p){
  return e("div",{className:"overflow-x-auto rounded-lg border border-border"},
    e("table",{className:"w-full table-fixed border-collapse text-[13px]", style:{minWidth:p.minW||undefined, background:"linear-gradient(var(--topo-tabela,#1c1d21),var(--topo-tabela,#1c1d21)) left top/100% 30px no-repeat"}},   // topo dourado: UM degradê na tabela inteira, nunca por célula (regra de tabelas, 02/11/2026)
      e("colgroup",null, p.cols.map(function(c, i){ return e("col",{key:i, style:c.w ? {width:c.w} : undefined}); })),
      e("thead",null, e("tr",null, p.cols.map(function(c, i){ return e("th",{key:i, title:c.d || c.t, className:"h-[30px] border-b border-border px-2.5 text-center text-[11px] font-semibold uppercase tracking-[.05em] text-foreground"}, c.t); }))),
      e("tbody",null, p.children)));
}
// TABELA DE CAMPOS (layout D, escolhido pelo Marcus em 06/11/2026): cada item é uma fileira de campos separados por fio fino, sem dourado.
// Nada quebra de linha e nada é cortado: as colunas têm largura fixa (cols[].w) e a última pode ser "1fr". Cabeçalho e total em faixa escura.
// Uso: e(TabelaCampos,{cols:[{t:"Fornecedor", w:"20%"}, ...], minW:"60rem"}, e(FileiraCampos,{cells:["Pontual", {v:brl(10), cor:"#22C55E"}]}), ...)
var FIO = "border-[#2a2c31]";
function TabelaCampos(p){
  var grade = p.cols.map(function(c){ return c.w || "1fr"; }).join(" ");
  return e("div",{className:"overflow-x-auto rounded-lg border "+FIO},
    e("div",{style:{minWidth:p.minW||undefined, "--grade":grade}},
      e("div",{className:"grid bg-[#1c1d21]", style:{gridTemplateColumns:"var(--grade)"}}, p.cols.map(function(c, i){ return e("div",{key:i, title:c.d || c.t, className:"flex h-[30px] items-center justify-center whitespace-nowrap border-l px-3 text-[11px] font-semibold uppercase tracking-[.05em] text-white first:border-l-0 "+FIO, style:c.cor ? {background:c.cor+"40", boxShadow:"inset 0 3px 0 "+c.cor} : undefined}, c.t); })),   // c.cor (opcional): cabeçalho da coluna tingido, para agrupar colunas por cor
      p.children));
}
// cells: texto, elemento ou {v, cor}. total:true = faixa escura em negrito. onClick: fileira clicável. alto: altura em px da fileira (só para linha com foto; padrão 32 px).
function FileiraCampos(p){
  // tom (opcional, hex): faixa de cor do grupo (Marcus, 10/11/2026: "me surpreenda nas cores"): fundo suave, barra grossa na esquerda e mais forte na linha de total
  return e("div",{onClick:p.onClick, title:p.title, className:"grid border-t "+FIO+(p.total ? " bg-[#1c1d21] font-bold" : "")+(p.onClick ? " cursor-pointer hover:bg-white/5" : ""), style:p.tom ? {gridTemplateColumns:"var(--grade)", background:p.tom+(p.total ? "30" : "14"), boxShadow:"inset 4px 0 0 "+p.tom} : {gridTemplateColumns:"var(--grade)"}},
    p.cells.map(function(c, i){ var obj = c!==null && typeof c==="object" && !React.isValidElement(c) && c.v!==undefined;
      return e("div",{key:i, className:"flex items-center justify-center whitespace-nowrap border-l px-3 text-[13px] tabular-nums first:border-l-0 "+(p.alto ? "" : "h-8 ")+FIO, style:obj && c.cor ? (p.alto ? {color:c.cor, height:p.alto} : {color:c.cor}) : (p.alto ? {height:p.alto} : undefined)}, obj ? c.v : c); }));
}
// célula e linha da TabelaP. valor (n:true) à direita, fonte tabular; texto à esquerda com corte "…" e title
var TD = "h-8 border-b border-border px-2.5 ";
function Td(p){
  var txt = typeof p.children==="string" ? p.children : undefined;
  return e("td",{title:p.title || txt, className:TD+(p.c ? "overflow-hidden text-ellipsis whitespace-nowrap text-center tabular-nums " : p.n ? "whitespace-nowrap text-right tabular-nums " : "truncate text-left ")+(p.cor||"")+(p.forte ? " font-semibold" : "")}, p.children);
}
function Tr(p){ return e("tr",{onClick:p.onClick, title:p.title, className:(p.total ? "border-t-2 border-border bg-white/5 font-semibold" : (p.alerta ? "bg-destructive/10" : (p.apagado ? "opacity-60" : "")))+(p.onClick ? " cursor-pointer hover:bg-white/10" : "")}, p.children); }

// ── Peças vindas da calculadora do Atendimento interno (extraídas em 01/11/2026, visual IDÊNTICO ao que a calculadora já tinha) ──
// Tile: caixa de uma linha, rótulo à esquerda e o conteúdo (valor, campo) à direita. Uso: e(Tile, {tit:"Valor a pagar"}, conteudo)
function Tile(p){
  return e("div",{className:"flex min-h-10 min-w-0 items-center justify-between gap-3 rounded-lg bg-black/20 px-3 py-1.5"},
    e("span",{className:"shrink-0 text-[13px] font-semibold"}, p.tit),
    e("span",{className:"flex min-w-0 flex-1 items-center justify-end gap-3 whitespace-nowrap text-right"}, p.children));
}
// Aviso: faixa de uma frase. tom: "vermelho" | "verde" | (sem tom = amarelo)
function Aviso(p){
  return e("p",{className:"rounded-lg px-3 py-2 text-[13px] font-semibold "+(p.tom==="vermelho" ? "bg-destructive/15 text-destructive" : p.tom==="verde" ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}, p.children);
}
// LinhaCampo: rótulo de 9 rem + campo na mesma linha (formulários em grade alinhada). Uso: e(LinhaCampo, {nome:"Venda atual"}, campo)
function LinhaCampo(p){
  return e("div",{className:"grid grid-cols-[9rem_minmax(0,1fr)] items-center gap-2"}, e("span",{className:"text-[13px] font-semibold text-foreground"}, p.nome), p.children);
}
// Secao: título pequeno em caixa alta e, embaixo, os filhos em coluna. Uso: e(Secao, {t:"Condicionais"}, filhos)
function Secao(p){
  return e("div",{className:"flex flex-col gap-2"}, p.t && e("h3",{className:"text-[13px] font-bold uppercase tracking-wide text-muted-foreground"}, p.t), React.Children.toArray(p.children));
}
// BotaoRemover: × redondo que apaga uma linha. Uso: e(BotaoRemover, {onClick:fn, label:"Remover condicional"})
function BotaoRemover(p){
  return e("button",{type:"button", onClick:p.onClick, "aria-label":p.label, className:"grid size-8 place-items-center rounded-full bg-muted text-base font-bold text-muted-foreground hover:bg-destructive/20 hover:text-destructive"},"×");
}
// TabelaSimples + CabSimples + TdSimples: a tabela da calculadora (cabeçalho em caixa alta, linhas soltas). Uso: e(TabelaSimples, {cols:[{t:"Nº", w:"20%"}, {t:"Valor", r:true}]}, linhas com TdSimples)
// OBS.: ainda NÃO é a TabelaP (cabeçalho 30 px / linhas 32 px). Unir as duas muda o visual e fica para depois, com o Marcus.
function CabSimples(p){ return e("th",{className:"px-2 py-2 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground "+"text-center", style:p.w ? {width:p.w} : undefined}, p.children); }
function TdSimples(p){ return e("td",{className:"px-2 py-1.5 align-middle text-center "+(p.className||"")}, p.children); }
function TabelaSimples(p){
  return e("div",{className:"overflow-x-auto rounded-lg border border-border"},
    e("table",{className:"w-full table-fixed border-collapse text-sm"},
      e("thead",null, e("tr",{className:"border-b border-border bg-muted/40"}, p.cols.map(function(c,i){ return e(CabSimples,{key:i, r:c.r, w:c.w}, c.t); }))),
      e("tbody",null, p.children)));
}

export { COR, corSinal, brl, inteiro, H, CAMPO, Rotulo, CampoSel, CampoBusca, Botao, BlocoFiltros, Bloco, FaixaTotais, AbasTela, Segmentado, MenuMulti, TabelaP, TabelaCampos, FileiraCampos, Td, Tr, Tile, Aviso, LinhaCampo, Secao, BotaoRemover, TabelaSimples, CabSimples, TdSimples };
