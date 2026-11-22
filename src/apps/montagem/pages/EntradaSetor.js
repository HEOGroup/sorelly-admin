// Entrada do setor (22/11/2026, pedido do Marcus): clicar num setor do menu lateral abre esta tela,
// só com os NOMES das telas do setor. Sem dados. Quem monta a lista (já filtrada pelo acesso da pessoa) é o App.js.
// Cada grupo do menu é um bloco com barra de título na cor do setor; botões de 32 px, todos do mesmo tamanho.
// Financeiro (23/11/2026, Marcus): versão compacta, fundo azul, grupos lado a lado em colunas, tudo numa tela só, sem rolar.
import { Pagina } from "@/apps/montagem/components/padrao";
import { e } from "@/shared/react";

// Todos os setores (23/11/2026, Marcus): tela inteira na cor do setor, em tom escuro (nada preto). Cada grupo do menu é UMA COLUNA (título em cima, botões embaixo, um por linha),
// todas lado a lado na mesma ordem do menu de cima, SEMPRE na mesma linha: as colunas encolhem para caber (nunca descem). Nome comprido quebra sozinho em 2 linhas (todos os botões têm a mesma altura); só abaixo de ~960 px a tela rola para o lado.
// Títulos grandes (tela 20 px, grupos 16 px) e texto dos botões em 13 px: exceção pedida pelo Marcus em 23/11/2026 (padrao-ok).
function EntradaCompacta(p){
  var en = p.en, cor = en.cor || "#3B82F6";
  var mix = function(pct){ return "color-mix(in srgb, "+cor+" "+pct+"%, #0b1730)"; };
  return e("div",{className:"-m-4 min-h-screen p-3 md:-m-6 md:p-4", style:{background:mix(22)}},
    e("div",{className:"mb-3 text-center text-[20px] font-semibold uppercase leading-tight text-white"}, en.nome),   // padrao-ok: título grande em caixa alta, o Marcus liberou (23/11/2026)
    e("div",{className:"flex flex-nowrap items-start gap-1.5 overflow-x-auto"},
      en.grupos.map(function(g, i){
        return e("section",{key:i, className:"flex min-w-[7.5rem] flex-1 basis-0 flex-col overflow-hidden rounded-lg", style:{background:mix(38), boxShadow:"inset 0 0 0 1px "+mix(65)}},
          e("div",{className:"flex h-8 items-center justify-center whitespace-nowrap px-1 text-[16px] font-semibold text-white", style:{background:mix(65)}}, g.titulo || en.nome),   // padrao-ok: título do grupo maior que os botões, pedido do Marcus (23/11/2026)
          e("div",{className:"grid gap-1 p-1", style:{gridTemplateColumns:"repeat(auto-fill, minmax(7rem, 1fr))"}},
            g.itens.map(function(no, k){ return e("button",{key:no.nome+k, type:"button", onClick:function(){ en.abrir(no); }, title:no.nome,
              style:{background:mix(55), boxShadow:"inset 0 0 0 1px rgba(255,255,255,.2)", height:"2.5rem"},   // padrao-ok: botão de 2 linhas, mesma altura para todos (23/11/2026)
              className:"flex items-center justify-center rounded-md px-1.5 text-center [text-wrap:balance] text-[13px] font-medium leading-tight text-white hover:brightness-125"+(no.breve ? " opacity-60" : "")}, no.nome); })));
      })));
}

export default function EntradaSetor(p){
  var en = p.entrada;
  if(!en) return e(Pagina, null, e("div",{className:"text-center text-[13px] text-foreground"}, "Escolha o setor no menu."));
  return e(Pagina, null, e(EntradaCompacta,{en:en}));
}
