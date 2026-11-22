// Entrada do setor (22/11/2026, pedido do Marcus): clicar num setor do menu lateral abre esta tela,
// só com os NOMES das telas do setor. Sem dados. Quem monta a lista (já filtrada pelo acesso da pessoa) é o App.js.
// Cada grupo do menu é um bloco com barra de título na cor do setor; botões de 32 px, todos do mesmo tamanho.
// Financeiro (23/11/2026, Marcus): versão compacta, fundo azul, grupos lado a lado em colunas, tudo numa tela só, sem rolar.
import { Pagina } from "@/apps/montagem/components/padrao";
import { PageHead } from "@/apps/montagem/ui/page";
import { e } from "@/shared/react";

function BotaoTela(p){
  var cor = p.cor;
  return e("button",{type:"button", onClick:function(){ p.abrir(p.no); }, title:p.no.nome,
    style:{background:cor+"1f", boxShadow:"inset 0 0 0 1px "+cor+"55"},
    className:"flex h-8 min-w-0 items-center justify-center whitespace-nowrap rounded-md px-2 text-center text-[13px] font-medium text-foreground hover:brightness-150"+(p.no.breve ? " opacity-55" : "")}, p.no.nome);
}

// Financeiro: fundo azul, grupos em colunas (cada grupo inteiro numa coluna), um botão por linha
function EntradaCompacta(p){
  var en = p.en, cor = en.cor || "#3B82F6";
  return e("div",{className:"rounded-xl p-2.5", style:{background:cor+"26", boxShadow:"inset 0 0 0 1px "+cor+"44"}},
    e("div",{className:"mb-2 text-center text-[13px] font-semibold text-foreground"}, en.nome),
    e("div",{className:"columns-1 gap-2.5 sm:columns-2 xl:columns-4"},
      en.grupos.map(function(g, i){
        return e("section",{key:i, className:"mb-2.5 flex break-inside-avoid flex-col overflow-hidden rounded-lg", style:{background:cor+"1a", boxShadow:"inset 0 0 0 1px "+cor+"44"}},
          e("div",{className:"flex h-8 items-center justify-center text-[11px] font-medium text-foreground", style:{background:cor+"4d"}}, g.titulo || en.nome),
          e("div",{className:"flex flex-col gap-1 p-1.5"},
            g.itens.map(function(no, k){ return e(BotaoTela,{key:no.nome+k, no:no, cor:cor, abrir:en.abrir}); })));
      })));
}

export default function EntradaSetor(p){
  var en = p.entrada;
  if(!en) return e(Pagina, null, e(PageHead,{t:"Setor", sub:"Escolha o setor no menu."}));
  if(en.id==="financeiro") return e(Pagina, null, e(EntradaCompacta,{en:en}));
  var cor = en.cor || "#3B82F6";
  return e(Pagina, null,
    e(PageHead,{t:en.nome, sub:"Escolha a tela."}),
    e("div",{className:"flex flex-col gap-2.5"},
      en.grupos.map(function(g, i){
        return e("section",{key:i, className:"flex flex-col overflow-hidden rounded-lg border border-border bg-card/60"},
          e("div",{className:"flex h-8 items-center justify-center text-[11px] font-medium text-foreground", style:{background:cor+"33"}}, g.titulo || en.nome),
          e("div",{className:"grid gap-2 p-2", style:{gridTemplateColumns:"repeat(auto-fill, minmax(230px, 1fr))"}},
            g.itens.map(function(no, k){ return e(BotaoTela,{key:no.nome+k, no:no, cor:cor, abrir:en.abrir}); })));
      })));
}
