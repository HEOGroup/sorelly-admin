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

// Financeiro: tela inteira em azul escuro (nada preto). Cada grupo do menu é UMA COLUNA (título em cima, botões embaixo, um por linha),
// todas lado a lado na mesma ordem do menu de cima. Nome comprido quebra em 2 linhas (todos os botões têm a mesma altura).
// Título grande e texto de 14 px: exceção pedida pelo Marcus em 23/11/2026 (padrao-ok).
function duasLinhas(nome){
  if(nome.length <= 19 || nome.indexOf(" ") < 0) return nome;
  var meio = nome.length / 2, melhor = -1;
  for(var i = 0; i < nome.length; i++) if(nome[i] === " " && (melhor < 0 || Math.abs(i - meio) < Math.abs(melhor - meio))) melhor = i;
  return nome.slice(0, melhor) + String.fromCharCode(10) + nome.slice(melhor + 1);
}
function EntradaCompacta(p){
  var en = p.en, cor = en.cor || "#3B82F6";
  var mix = function(pct){ return "color-mix(in srgb, "+cor+" "+pct+"%, #0b1730)"; };
  return e("div",{className:"-m-4 min-h-screen p-3 md:-m-6 md:p-4", style:{background:mix(22)}},
    e("div",{className:"mb-3 text-center text-[20px] font-semibold leading-tight text-white"}, en.nome),   // padrao-ok: título grande do Financeiro, pedido do Marcus (23/11/2026)
    e("div",{className:"flex flex-wrap items-start justify-center gap-2"},
      en.grupos.map(function(g, i){
        return e("section",{key:i, className:"flex min-w-44 flex-col overflow-hidden rounded-lg", style:{background:mix(38), boxShadow:"inset 0 0 0 1px "+mix(65)}},
          e("div",{className:"flex h-8 items-center justify-center whitespace-nowrap px-3 text-[11px] font-semibold text-white", style:{background:mix(65)}}, g.titulo || en.nome),
          e("div",{className:"flex flex-col gap-1 p-1.5"},
            g.itens.map(function(no, k){ return e("button",{key:no.nome+k, type:"button", onClick:function(){ en.abrir(no); }, title:no.nome,
              style:{background:mix(55), boxShadow:"inset 0 0 0 1px rgba(255,255,255,.2)", height:"2.75rem"},   // padrao-ok: botão de 2 linhas, mesma altura para todos (23/11/2026)
              className:"flex items-center justify-center whitespace-pre rounded-md px-3 text-center text-[14px] font-medium leading-tight text-white hover:brightness-125"+(no.breve ? " opacity-60" : "")}, duasLinhas(no.nome)); })));   // padrao-ok: texto de 14 px, pedido do Marcus
      })));
}

export default function EntradaSetor(p){
  var en = p.entrada;
  if(!en) return e(Pagina, null, e(PageHead,{t:"Setor", sub:"Escolha o setor no menu."}));
  if(en.id==="financeiro" || en.nome==="Financeiro") return e(Pagina, null, e(EntradaCompacta,{en:en}));
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
