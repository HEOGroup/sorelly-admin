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

// Financeiro: tela inteira em azul escuro (nada preto). 3 colunas de mesma largura; os grupos seguem a ordem do menu, em pedaços seguidos
// com quase o mesmo número de botões em cada coluna. Blocos com a mesma barra de título; um botão por linha, todos iguais.
function repartir(grupos, n){
  var peso = function(g){ return g.itens.length + 2; }, total = grupos.reduce(function(t, g){ return t + peso(g); }, 0), alvo = total / n, cols = [[]], soma = 0;
  grupos.forEach(function(g){ if(soma >= alvo * cols.length && cols.length < n) cols.push([]); cols[cols.length-1].push(g); soma += peso(g); });
  return cols;
}
function EntradaCompacta(p){
  var en = p.en, cor = en.cor || "#3B82F6";
  var mix = function(pct){ return "color-mix(in srgb, "+cor+" "+pct+"%, #0b1730)"; };
  return e("div",{className:"-m-4 min-h-screen p-3 md:-m-6 md:p-4", style:{background:mix(30)}},
    e("div",{className:"mb-3 text-center text-[13px] font-semibold text-white"}, en.nome),
    e("div",{className:"grid grid-cols-1 items-start gap-3 md:grid-cols-3"},
      repartir(en.grupos, 3).map(function(col, c){
        return e("div",{key:c, className:"flex min-w-0 flex-col gap-3"},
          col.map(function(g, i){
            return e("section",{key:i, className:"flex flex-col overflow-hidden rounded-lg", style:{background:mix(45), boxShadow:"inset 0 0 0 1px "+mix(75)}},
              e("div",{className:"flex h-8 items-center justify-center text-[11px] font-semibold text-white", style:{background:mix(75)}}, g.titulo || en.nome),
              e("div",{className:"flex flex-col gap-1.5 p-2"},
                g.itens.map(function(no, k){ return e("button",{key:no.nome+k, type:"button", onClick:function(){ en.abrir(no); }, title:no.nome,
                  style:{background:mix(65), boxShadow:"inset 0 0 0 1px rgba(255,255,255,.2)"},
                  className:"flex h-8 min-w-0 items-center justify-center whitespace-nowrap rounded-md px-2 text-center text-[13px] font-medium text-white hover:brightness-125"+(no.breve ? " opacity-60" : "")}, no.nome); })));
          }));
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
