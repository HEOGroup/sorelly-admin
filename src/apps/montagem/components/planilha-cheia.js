// Sorelly Admin · montagem — components/planilha-cheia.js
// PLANILHA CHEIA (Marcus, 20/11/2026): o estilo acertado na tela Contas a receber, numa peça só para as telas novas do Financeiro (Cadastro › Bancos e Formas de pagamento).
//  · a tela cola na barra lateral, nas abas e no fim da janela; borda de 4 px só na esquerda, direita e embaixo (PAGINA_CHEIA);
//  · barra de filtros azul, centralizada, campos de 18 px e letra de 10 px (BarraMini, CampoMini, BuscaMini);
//  · tabela com letra de 10 px, cabeçalho de 16 px, sem a setinha (o filtro continua ao clicar no nome da coluna) e linhas de cerca de 18 px (CLS_FINA);
//  · a altura das linhas se ajusta para caber um número EXATO de linhas na janela, e a rolagem para sempre numa linha inteira (refCheia).
// Exceção ao padrão de 30/32 px e 11/13 px aprovada pelo Marcus em 20/11/2026 ("padrao-ok" nas linhas abaixo).
import { PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { e } from "@/shared/react";

var PAGINA_CHEIA = PADRAO_BLOCOS+" -mx-4 -mb-4 -mt-4 md:-mx-6 md:-mb-6 md:-mt-6 [&>section]:!rounded-none [&>section]:!border-t-0 [&>section]:!border-l-[4px] [&>section]:!border-r-[4px] [&>section]:!border-b-[4px]";
var CLS_FINA_BASE = "flex min-h-0 flex-1 flex-col [&_table_td]:!text-[10px] [&_table_th]:!text-[10px] [&_table_td]:!h-[var(--lh,18px)] [&_table_tbody_tr]:[scroll-snap-align:start] [&_table_th_button]:!px-0 [&_table_th_button]:!gap-0.5 [&_table_th_button]:!tracking-normal [&_table_th_span]:!tracking-normal [&_table_th_button>span]:!hidden [&_table_td]:!py-0 [&_table_td]:!leading-none [&_table_th]:!h-[16px] [&_table_th_button]:!h-[14px] [&_table_th_button]:!py-0 [&_table_th_button]:!leading-none [&_table_th_button]:!text-[10px] [&_table_th_span]:!text-[10px] [&_table_th_span]:!leading-none [&_table_th]:!py-0 [&_table_tr]:!h-[var(--lh,18px)] [&_table_td_button]:!text-[10px] [&_table_td_a]:!text-[10px] [&_.overflow-x-auto]:!cursor-default [&_table_tr]:!cursor-default [&_table_td]:!cursor-default [&_tbody_td]:!bg-[color-mix(in_srgb,var(--bloco-colunas)_38%,transparent)] [&_.overflow-x-auto]:!bg-[color-mix(in_srgb,var(--bloco-colunas)_38%,transparent)] [&_table_tfoot_td]:!bg-[var(--bloco-titulo)]";   // padrao-ok: tabela fina com o fundo azul-marinho do sistema, igual à Pagamentos a fornecedores (Marcus, 20/11/2026)
// espaço lateral das células: 1 px (colado, Contas a receber) ou 5 px (Contas a pagar, que tem muitas colunas; Marcus, 20/11/2026: "tá muito grudado, dá um mini espacinho"). As duas versões ficam escritas por inteiro para o Tailwind gerar as classes.
var CLS_FINA = CLS_FINA_BASE+" [&_table_td]:!px-[1px] [&_table_th]:!px-[1px]";
var CLS_FINA_ESPACO = CLS_FINA_BASE+" [&_table_td]:!px-[5px] [&_table_th]:!px-[5px]";
var CLS_BARRA = "flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-1.5 py-1 [&_button]:!h-[18px] [&_button]:!py-0 [&_button]:!leading-none [&_button]:!px-1 [&_button]:!text-[10px] [&_button]:!justify-center [&_button]:!border-white/25 [&_button]:!bg-white/10";   // padrao-ok: barra de filtros compacta (20/11/2026)
var CLS_BARRA_TAB = "flex flex-wrap items-stretch justify-start border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] [&_button]:!h-[18px] [&_button]:!py-0 [&_button]:!leading-none [&_button]:!px-1 [&_button]:!text-[10px] [&_button]:!justify-center [&_button]:!border-white/25 [&_button]:!bg-white/10";   // padrao-ok: barra em forma de tabela, controles de 18 px (Marcus, 20/11/2026)
var CLS_CAMPO = "min-w-0 rounded border border-white/25 bg-white/10 text-center text-[10px] font-medium text-white outline-none placeholder:text-white/70 focus-visible:ring-2 focus-visible:ring-primary";   // padrao-ok: campo de 18 px e letra de 10 px (20/11/2026)

/** Barra em forma de TABELA: cada controle numa célula com o título em cima e linha separando; começa na esquerda (Buscar primeiro). */
function BarraTabela(p){ return e("div",{className:CLS_BARRA_TAB+" [&>div:first-child]:border-l [&>div:first-child]:border-l-white/25"}, p.children); }
function CelulaBarra(p){ return e("div",{className:"flex flex-col items-stretch border-r border-white/25"}, e("span",{className:"border-b border-white/25 px-2 py-0.5 text-center text-[9px] font-semibold uppercase leading-none tracking-wide text-white"}, p.rotulo), e("div",{className:"flex flex-1 items-center justify-center px-1.5 py-0.5"}, p.children)); }   // padrao-ok: título da célula de 9 px, como cabeçalho de coluna, com linha separando o título do controle (Marcus, 20/11/2026)

/** Barra azul de filtros, centralizada. */
function BarraMini(p){ return e("div",{className:CLS_BARRA}, p.children); }
/** Escolha de uma opção (select de 18 px). ops = [[valor, texto]]. */
function CampoMini(p){
  return e("select",{value:p.valor, "aria-label":p.rotulo, title:p.rotulo, onChange:function(ev){ p.aoMudar(ev.target.value); }, style:{height:"18px", padding:"0 3px", lineHeight:"16px", textAlignLast:"center"}, className:"w-auto "+CLS_CAMPO},
    p.ops.map(function(o){ return e("option",{key:o[0], value:o[0], className:"bg-card text-foreground"}, o[1]); }));
}
/** Busca da barra (224 px de largura, igual à Contas a receber). */
function BuscaMini(p){
  return e("input",{type:"search", value:p.valor, onChange:function(ev){ p.aoMudar(ev.target.value); }, placeholder:p.ph || "Buscar", "aria-label":p.rotulo || "Buscar", style:{height:"18px", padding:"0 4px"}, className:(p.larg || "w-56")+" "+CLS_CAMPO});
}
/** Texto de situação da barra (lido às, lendo, erro). */
function AvisoMini(p){ return e("span",{role:p.erro ? "alert" : "status", className:"whitespace-nowrap text-[10px] font-semibold "+(p.erro ? "text-warning" : "text-white")}, p.children); }   // padrao-ok: aviso de 10 px na barra compacta (20/11/2026)

/**
 * ref da caixa da tabela: ajusta a altura das linhas para caber um número exato delas até o fim da janela (sem fatia de linha) e trava a rolagem em linha inteira.
 * dicas = {"Comp.":"Comprovante"}: texto que aparece ao passar o mouse no nome encurtado da coluna.
 */
function refCheia(dicas){
  return function(el){
    if(!el) return;
    var ajusta = function(){
      var sc = el.querySelector(".overflow-x-auto"); if(!sc) return;
      var t = sc.getBoundingClientRect().top, th0 = sc.querySelector("thead th"), hh = th0 ? th0.getBoundingClientRect().height : 18;
      var av = Math.max(120, window.innerHeight-t-4), n = Math.max(3, Math.floor((av-hh)/18)), lh = (av-hh)/n;
      el.style.setProperty("--lh", lh.toFixed(3)+"px"); sc.style.height = (av-1)+"px"; sc.style.maxHeight = (av-1)+"px"; sc.style.scrollSnapType = "y mandatory"; sc.style.scrollPaddingTop = hh+"px";
    };
    ajusta(); setTimeout(ajusta, 150);
    if(!el.__aj){ el.__aj = ajusta; window.addEventListener("resize", function(){ if(el.__aj) el.__aj(); }); } else el.__aj = ajusta;
    if(dicas) [].slice.call(el.querySelectorAll("th button")).forEach(function(b){ var tx = b.textContent.trim(); Object.keys(dicas).forEach(function(k){ if(tx.indexOf(k)===0) b.title = dicas[k]; }); });
  };
}

export { PAGINA_CHEIA, CLS_FINA, CLS_FINA_ESPACO, BarraTabela, CelulaBarra, BarraMini, CampoMini, BuscaMini, AvisoMini, refCheia };
