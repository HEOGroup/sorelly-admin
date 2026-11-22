// Entrada do setor (22/11/2026, pedido do Marcus): clicar num setor do menu lateral abre esta tela,
// só com os NOMES das telas do setor. Sem dados. Quem monta a lista (já filtrada pelo acesso da pessoa) é o App.js.
import { Pagina } from "@/apps/montagem/components/padrao";
import { PageHead } from "@/apps/montagem/ui/page";
import { e } from "@/shared/react";

function BotaoTela(p){
  return e("button",{type:"button", onClick:function(){ p.abrir(p.no); }, title:p.no.nome,
    className:"flex min-w-0 items-center justify-center rounded-lg border border-border bg-card px-4 py-5 text-center text-[13px] font-semibold leading-tight text-foreground hover:border-primary hover:bg-primary/15"+(p.no.breve ? " opacity-55" : "")}, p.no.nome);
}

export default function EntradaSetor(p){
  var en = p.entrada;
  if(!en) return e(Pagina, null, e(PageHead,{t:"Setor", sub:"Escolha o setor no menu."}));
  return e(Pagina, null,
    e(PageHead,{t:en.nome, sub:"Escolha a tela."}),
    en.grupos.map(function(g, i){
      return e("section",{key:i, className:"flex flex-col gap-2"},
        g.titulo && e("div",{className:"text-center text-[11px] font-medium text-foreground"}, g.titulo),
        e("div",{className:"grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4"},
          g.itens.map(function(no, k){ return e(BotaoTela,{key:no.nome+k, no:no, abrir:en.abrir}); })));
    }));
}
