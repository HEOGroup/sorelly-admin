// Sorelly Admin · montagem e bipagem — pages/Config.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { ehSugPeca } from "@/apps/montagem/components/tabela-pecas-ver";
import { nomesEncomendas } from "@/apps/montagem/domain/regras";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { badge } from "@/apps/montagem/ui/badge";
import { Btn } from "@/apps/montagem/ui/button";
import { Icon } from "@/apps/montagem/ui/icon";
import { INPUT, MONO, MoneyInput, NumInput } from "@/apps/montagem/ui/input";
import { Modal } from "@/apps/montagem/ui/modal";
import { PageHead } from "@/apps/montagem/ui/page";
import { TD, TH, TR } from "@/apps/montagem/ui/table";
import { e, useState } from "@/shared/react";
import React from "react";

function Campo(p){
  var d = use().dispatch;
  var onCh = function(v){ d({type:"CFG", campo:p.campo, lista:p.lista, i:p.i, valor:v}); };
  var input = p.money ? e(MoneyInput,{value:p.v, onChange:onCh, label:p.l, sm:true, className:p.largo?"w-full":"w-32"})
    : e(NumInput,{value:p.v, step:p.step, onChange:onCh, label:p.l, className:"h-8! text-sm! px-2! "+(p.largo?"w-full!":"w-20!")});
  if(p.so) return input;
  return e("label",{className:"flex items-center justify-between gap-3 border-b border-border py-1.5 last:border-0"},
    e("span",{className:"min-w-0 flex-1 text-[13px] font-medium leading-tight"}, p.l),
    e("span",{className:"flex shrink-0 items-center gap-1.5"}, input,
      p.u && e("span",{className:"w-10 text-[12px] text-muted-foreground"}, p.u)));
}
function Faixas(p){
  return e("div",{className:"flex flex-col"},
    e("div",{className:"grid grid-cols-2 gap-3 border-b border-border pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"},
      e("span",null, p.c1), e("span",null, p.c2)),
    p.itens.map(function(f,i){ return e("div",{key:i, className:"grid grid-cols-2 items-center gap-3 border-b border-border py-1.5 last:border-0"},
      e(Campo,Object.assign({so:true, largo:true, l:p.c1+" "+(i+1), lista:p.lista, i:i}, p.a(f))),
      e("span",{className:"flex items-center gap-1.5"}, e(Campo,Object.assign({so:true, largo:true, l:p.c2+" "+(i+1), lista:p.lista, i:i}, p.b(f))), p.u && e("span",{className:"text-[12px] text-muted-foreground"}, p.u))); }));
}
function Bloco(p){ return e("div",{className:"flex flex-col rounded-xl bg-linear-to-br from-[#E8B84B]/10 via-card to-card p-4 ring-1 ring-[#E8B84B]/20"},
  e("h2",{className:"mb-1.5 flex items-center gap-2 font-heading text-[15px] font-semibold"}, p.ic && e(Icon,{n:p.ic, s:15, className:"text-primary"}), p.t), p.children); }
function TabelaPecas(){
  var cx = use(), c = cx.state.cfg, d = cx.dispatch;
  var cel = function(i, j, v){ return e("input",{type:"number", min:0, value:(v===null||v===undefined)?"":v, placeholder:"—", "aria-label":c.categorias[j]+", kit "+BK(c.pecasKit[i].kit),
    className:INPUT+" h-8! w-full px-2! text-center text-sm! "+MONO,
    onChange:function(ev){ var t = ev.target.value; d({type:"PECAS", i:i, j:j, valor: t==="" ? null : Math.max(0, parseInt(t,10)||0)}); }}); };
  var faltam = c.pecasKit.reduce(function(t,l){ return t + l.q.filter(function(x){return x===null||x===undefined;}).length; },0);
  return e(Bloco,{t:"Peças por kit", ic:"box"},
    e("div",{className:"mb-2 flex flex-wrap items-center justify-between gap-2"},
      e("p",{className:"text-[13px]"},"Quantas peças de cada tipo vão em cada kit. A montadora vê em “O que enviar”. Em laranja: sugestão a confirmar."),
      faltam>0 && badge(faltam+" campos a levantar","warning","alert")),
    e("div",{className:"overflow-x-auto"},
      e("table",{className:"w-full min-w-[62rem] table-fixed border-collapse text-sm"},
        e("colgroup",null, e("col",{style:{width:180}}), c.pecasKit.map(function(l){ return e("col",{key:l.kit}); })),
        e("thead",null, e("tr",null, e(TH,{className:"py-2! text-left! text-[12px]! tracking-normal!"},"Peça"), c.pecasKit.map(function(l){ return e(TH,{key:l.kit, className:"py-2! text-center! text-[12px]! tracking-normal!"+(l.sug?" text-warning!":"")}, (l.kit/1000)+" mil"+(l.sug?" *":"")); }))),
        e("tbody",null, c.categorias.map(function(nome, j){ return e("tr",{key:nome, className:TR},
          e(TD,{className:"py-1.5! text-left! font-medium"+((c.pecasSugCat||[]).indexOf(j)>=0?" text-warning":"")}, nome),
          c.pecasKit.map(function(l,i){ return e(TD,{key:l.kit, className:"px-1! py-1!"+(ehSugPeca(c,l,j)?" [&_input]:text-warning":"")}, cel(i,j,l.q[j])); })); })))));
}
function TabelasKit(){
  var cx = use(), c = cx.state.cfg, d = cx.dispatch;
  var vs = useState(c.tabelaAtiva||"alto"), ver = vs[0], setVer = vs[1];
  var lista = ver==="baixo" ? "tabelaKitBaixo" : "tabelaKit";
  var aba = function(v, lb){ return e("button",{onClick:function(){setVer(v);},
    className:"flex-1 rounded-md px-2 py-1 text-[13px] font-medium "+(ver===v?"bg-card text-foreground ring-1 ring-foreground/10":"text-muted-foreground hover:text-foreground")},
    lb, c.tabelaAtiva===v && e("span",{className:"ml-1.5 rounded bg-success/15 px-1.5 py-px text-[10px] font-semibold text-success"},"em uso")); };
  return e("div",{className:"flex flex-col gap-2 pb-1"},
    e("div",{className:"flex gap-1 rounded-lg bg-muted p-1"}, aba("alto","Estoque alto"), aba("baixo","Estoque baixo")),
    e(Faixas,{key:lista, c1:"Média a partir de", c2:"Kit sugerido", lista:lista, itens:c[lista],
      a:function(f){return {campo:"min", v:f.min, money:true};}, b:function(f){return {campo:"kit", v:f.kit, money:true};}}),
    c.tabelaAtiva===ver
      ? e("p",{className:"text-[12px] text-muted-foreground"},"Esta tabela está valendo para as sugestões.")
      : e(Btn,{sm:true, ic:"check", className:"self-start", onClick:function(){d({type:"CFG", campo:"tabelaAtiva", valor:ver});}},
          "Usar a tabela de estoque "+(ver==="baixo"?"baixo":"alto")));
}
function AbaConfig(){
  var cx = use(), s = cx.state, c = s.cfg, d = cx.dispatch;
  var cf = useState(false), conf = cf[0], setConf = cf[1];
  var coluna = function(){ return e.apply(null, ["div",{className:"flex flex-col gap-4"}].concat([].slice.call(arguments))); };
  return e(React.Fragment,null,
    e(PageHead,{t:"Configurador", sub:"Todos os valores e regras do sistema. As mudanças valem na hora."}),
    // três colunas lado a lado; cada coluna empilha os seus blocos sem deixar buracos
    e("div",{className:"grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3"},
      coluna(
        e(Bloco,{t:"Valor por kit montado", ic:"wallet"},
          e(Campo,{l:"Kit normal", campo:"valorNormal", v:c.valorNormal, money:true}),
          e(Campo,{l:"Kit especial", campo:"valorEspecial", v:c.valorEspecial, money:true}),
          e(Campo,{l:"Especial acima de", campo:"limiteEspecial", v:c.limiteEspecial, money:true})),
        e(Bloco,{t:"Sugestão de kit pela média", ic:"chart"},
          e(TabelasKit),
          e(Campo,{l:"Sem vendas: kit padrão (a confirmar)", campo:"kitInicial", v:c.kitInicial, money:true}),
          e(Campo,{l:"Reposição: valor máximo liberado (regras a definir)", campo:"reposicaoMax", v:c.reposicaoMax, money:true}),
          e(Campo,{l:"Venda do mês no app abaixo de (manual)", campo:"minVendaApp", v:c.minVendaApp, money:true}))),
      coluna(
        e(Bloco,{t:"Valor por kit bipado", ic:"scan"},
          e(Campo,{l:"Kit bipado", campo:"valorBipNormal", v:c.valorBipNormal, money:true}),
          e(Campo,{l:"Kit maior", campo:"valorBipEspecial", v:c.valorBipEspecial, money:true}),
          e(Campo,{l:"Kit maior acima de", campo:"limiteBipEspecial", v:c.limiteBipEspecial, money:true}),
          e(Campo,{l:"Desconto por peça faltando", campo:"perdaFalta", v:c.perdaFalta, money:true})),
        e(Bloco,{t:"Nota das revendedoras", ic:"star"},
          e(Faixas,{c1:"Nota a partir de", c2:"Recebe", u:"%", lista:"faixas", itens:c.faixas,
            a:function(f){return {campo:"min", v:f.min, step:"0.1"};}, b:function(f){return {campo:"pct", v:f.pct};}}),
          e(Campo,{l:"Alerta de atenção abaixo de", campo:"alertaAmarelo", v:c.alertaAmarelo, step:"0.1"}),
          e(Campo,{l:"Alerta de saída abaixo de", campo:"alertaVermelho", v:c.alertaVermelho, step:"0.1"}))),
      coluna(
        e(Bloco,{t:"Kits de alto valor", ic:"alert"},
          e(Campo,{l:"Só Encomendas monta acima de (venda atual ou média)", campo:"limiteEncomendas", v:c.limiteEncomendas, money:true}),
          e("p",{className:"text-center text-[12px] text-muted-foreground"}, "Setor Encomendas: "+(nomesEncomendas(s)||"ninguém marcado")+". Marcus e Deysiane liberam exceção."),
          e(Campo,{l:"Só as melhores montam acima de", campo:"limiteMelhores", v:c.limiteMelhores, money:true}),
          e(Campo,{l:"Conferência obrigatória acima de", campo:"limiteAtencao", v:c.limiteAtencao, money:true}),
          e(Campo,{l:"Restrição ativa após", campo:"minKitsRestricao", v:c.minKitsRestricao, u:"kits"}),
          e(Campo,{l:"Liberado para as melhores", campo:"topN", v:c.topN, u:"pessoas"}),
          e(Campo,{l:"Avaliações mínimas no ranking", campo:"minAvalRanking", v:c.minAvalRanking})),
        e(Bloco,{t:"Divergência de valor", ic:"coins"},
          e(Campo,{l:"Diferença tolerada", campo:"divPct", v:c.divPct, u:"%"}),
          e(Campo,{l:"Kits divergentes por bloco", campo:"divBloco", v:c.divBloco, u:"kits"}),
          e(Campo,{l:"Perda a cada bloco", campo:"divPerda", v:c.divPerda, u:"%"})),
        e(Bloco,{t:"Pedidos e pagamento", ic:"history"},
          e(Campo,{l:"Prazo do pedido da representante", campo:"prazoPedidoHoras", v:c.prazoPedidoHoras, u:"horas"}),
          e(Campo,{l:"Dia do pagamento no mês seguinte", campo:"diaPagamento", v:c.diaPagamento}),
          e("div",{className:"pt-2"}, e(Btn,{v:"destructive", sm:true, ic:"trash", className:"w-full", onClick:function(){setConf(true);}},"Restaurar dados de demonstração"))))),
    e(TabelaPecas),
    e(Modal,{open:conf, titulo:"Restaurar dados de demonstração", sub:"Tudo o que foi feito hoje será apagado.", confirmar:"Restaurar", icone:"trash", perigo:true,
      onClose:function(){setConf(false);}, onConfirmar:function(){ d({type:"RESET"}); setConf(false); }},
      e("p",{className:"text-sm"},"Os 40 kits, as listagens e a configuração voltam ao estado inicial.")));
}

export { Campo, Faixas, Bloco, TabelaPecas, TabelasKit, AbaConfig };
