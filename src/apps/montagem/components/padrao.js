// Sorelly Admin · montagem — components/padrao.js
// PADRÃO VISUAL ÚNICO (modelo: Visão geral). Toda tela nova usa estas peças; regras escritas em docs/design/PADRAO-VISUAL.md e vista ao vivo em Tecnologia → Padrão visual.
// Mudou aqui, muda no sistema inteiro. Nada avulso: número sempre dentro de um Indicador ou de uma célula centralizada.
import { useContagemNaTela } from "@/apps/montagem/lib/contagem-tela";
import { CampoDinheiro } from "@/apps/montagem/mobile/campos";
import { use } from "@/apps/montagem/state/context";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e, useRef } from "@/shared/react";

// cores de ESTADO (as únicas que mudam de cor dentro de um setor) e cor de cada setor
var ESTADO = {ok:"#4ADE80", alerta:"#FBBF24", ruim:"#EF4444", info:"#60A5FA", neutro:"#94A3B8", total:"#F3D98B", cian:"#22D3EE"};
var SETOR = {financeiro:"azul", agendamento:"roxo", geral:"ouro"};

// Degradê CLARO por sentido (padrão do sistema): do tom da cor para quase transparente, com fio fino. Use em blocos de situação, barras e cartões.
function degrade(cor){ var c = ESTADO[cor] || cor || ESTADO.total; return {background:"linear-gradient(135deg,"+c+"38,"+c+"0d 78%)", boxShadow:"inset 0 0 0 1px "+c+"44"}; }

// Pagina: casca de toda tela. Espaço curto entre blocos (gap 2.5) e números que CORREM de zero até o valor ao abrir e quando mudam.
function Pagina(p){
  var ref = useRef(null);
  useContagemNaTela(ref);
  return e("div",{ref:ref, className:"flex flex-col gap-2.5 "+(p.className||"")}, p.children);
}

// Indicador: número grande colorido + nome pequeno embaixo (sub opcional). Tudo centralizado.
var cap = function(t){ return typeof t==="string" && t ? t.charAt(0).toUpperCase()+t.slice(1) : t; };
function Indicador(p){
  var cor = ESTADO[p.cor] || p.cor || ESTADO.total, d = use().dispatch;
  return e(p.ir ? "button" : "div",{type:p.ir ? "button" : undefined, onClick:p.ir ? function(){ d({type:"ABA", aba:p.ir}); } : undefined, className:"flex min-w-0 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-center "+(p.ir ? "cursor-pointer transition hover:bg-black/45 hover:ring-white/30 " : "")+(p.className||""), title:p.titulo || (p.ir ? "Abrir a tela" : undefined), style:degrade(p.cor)},
    e("b",{className:MONO+" whitespace-nowrap text-[19px] leading-none", style:{color:cor}}, p.v),
    e("span",{className:"mt-1 text-[10.5px] font-bold leading-tight text-white/75 "+(p.normal ? "" : "uppercase tracking-wide")}, p.t),
    p.sub && e("span",{className:"text-[10.5px] leading-tight text-white/50"}, cap(p.sub)));
}
// Faixa: indicadores lado a lado (2 em tela estreita, n em tela larga)
function Faixa(p){
  var n = p.n || (p.children && p.children.length) || 4;
  var g = {2:"grid-cols-2", 3:"grid-cols-3", 4:"grid-cols-2 md:grid-cols-4", 5:"grid-cols-2 md:grid-cols-5", 6:"grid-cols-3 md:grid-cols-6", 8:"grid-cols-2 sm:grid-cols-4 xl:grid-cols-8"}[n] || "grid-cols-2 md:grid-cols-4";
  return e("div",{className:"grid gap-2 "+g+" "+(p.className||"")}, p.children);
}

// Tabela padrão: cabeçalho e células CENTRALIZADOS, linhas baixas. cols = ["Nome", ...]; linhas vão nos filhos (use Td).
var TH_P = "whitespace-nowrap px-2 py-1 text-center text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground";
function Tab(p){
  return e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse "+(p.className||"")},
    e("thead",null, e("tr",null, p.cols.map(function(c, i){ return e("th",{key:i, className:p.normal ? TH_P.replace("uppercase ", "").replace("tracking-wide ", "") : TH_P}, c); }))),
    e("tbody",null, p.children)));
}
// Td: p.dinheiro = fonte de número; p.cor = cor de estado; p.forte = negrito
function Td(p){
  var cor = p.cor ? (ESTADO[p.cor] || p.cor) : undefined;
  return e("td",{colSpan:p.colSpan, className:"whitespace-nowrap px-2 py-1.5 text-center align-middle text-[13px] "+(p.dinheiro ? MONO+" " : "")+(p.forte ? "font-bold " : "")+(p.className||""), style:cor ? {color:cor} : undefined}, p.children);
}
var LINHA = "border-t border-white/10";

// Abas: várias visões dentro de UMA tela do menu (em vez de várias telas). abas = [[chave, título]], atual = chave, onMudar(chave), cor = cor do setor.
function Abas(p){
  var cor = p.cor || "#3B82F6";
  return e("div",{className:"flex flex-wrap justify-center gap-1.5"}, p.abas.map(function(a){ var on = a[0]===p.atual;
    return e("button",{key:a[0], type:"button", onClick:function(){ p.onMudar(a[0]); }, className:"rounded-lg px-4 py-1.5 text-[13px] font-bold ring-1 transition "+(on ? "text-white" : "bg-muted/40 text-white/85 ring-white/15 hover:bg-white/10"),
      style:on ? {background:"linear-gradient(135deg,"+cor+"66,"+cor+"22)", boxShadow:"inset 0 0 0 1px "+cor+"cc"} : undefined}, cap(a[1])); }));
}
// Barra de filtros: UMA linha alinhada, centralizada, mesma altura em tudo (use h-9 nos campos). ativo = há filtro ligado; onLimpar mostra o botão Limpar.
function BarraFiltros(p){
  return e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-black/25 px-3 py-2 ring-1 ring-white/10 "+(p.className||"")}, p.children,
    p.ativo && p.onLimpar && e("button",{type:"button", onClick:p.onLimpar, className:"h-9 rounded-lg bg-white/10 px-3 text-[12.5px] font-bold hover:bg-white/20"}, "Limpar"));
}
// Janela larga em COLUNAS lado a lado (detalhe, edição, novo): colunas = [elemento, ...]; 1 coluna em tela estreita, 2–3 em larga. O que já foi preenchido passa para outra coluna como concluído.
function Janela(p){
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/60 p-3", onClick:p.fechar},
    e("div",{onClick:function(ev){ ev.stopPropagation(); }, className:"flex max-h-[92vh] w-full max-w-6xl flex-col gap-3 overflow-y-auto rounded-2xl bg-card p-4 ring-1 ring-white/20"},
      e("div",{className:"flex items-start justify-between gap-3"}, e("div",{className:"text-center flex-1"}, e("h2",{className:"font-heading text-xl font-bold"}, p.t), p.sub && e("p",{className:"text-[12.5px] text-muted-foreground"}, p.sub)),
        e("button",{type:"button", onClick:p.fechar, "aria-label":"Fechar", className:"grid size-9 place-items-center rounded-lg bg-muted/50 hover:bg-white/15"}, "×")),
      e("div",{className:"grid items-start gap-3", style:{gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 17rem), 1fr))"}}, p.colunas),
      p.rodape && e("div",{className:"flex flex-wrap justify-center gap-2 border-t border-white/10 pt-3"}, p.rodape)));
}

// Dinheiro: campo padrão de valor. value pode ser número ou texto; onChange recebe no mesmo formato de out. Sem vírgula: digita 100000 e aparece R$ 1.000,00.
function Dinheiro(p){
  var n = typeof p.value==="number" ? p.value : p.out==="ponto" ? (parseFloat(p.value) || 0) : (parseFloat(String(p.value||"").replace(/\./g,"").replace(",",".")) || 0);
  var saida = function(v){ if(p.out==="ptbr") return v==null ? "" : v.toFixed(2).replace(".", ","); if(p.out==="ponto") return v==null ? "" : v.toFixed(2); return v; };
  return e(CampoDinheiro,{value:n||null, label:p.label||"Valor", disabled:p.disabled, className:INPUT+" h-10! text-center "+MONO+" "+(p.className||"w-full"), onChange:function(v){ p.onChange(saida(v)); }});
}

// Mosaico ("tetris"): blocos de alturas diferentes se encaixam em colunas sem buracos; a quantidade de colunas segue a largura da tela (min = largura mínima de cada coluna).
function Mosaico(p){
  var filhos = [].concat(p.children).filter(Boolean);
  return e("div",{className:"gap-2.5 "+(p.className||""), style:{columns:(p.min||"22rem"), columnGap:"0.625rem"}},
    filhos.map(function(x, i){ return e("div",{key:i, className:"mb-2.5 min-w-0 break-inside-avoid"}, x); }));
}

export { degrade, Abas, BarraFiltros, Janela, ESTADO, SETOR, Pagina, Indicador, Faixa, Tab, Td, TH_P, LINHA, Mosaico, Dinheiro, cap };
