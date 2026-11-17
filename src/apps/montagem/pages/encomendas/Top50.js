// Sorelly Admin · montagem — pages/encomendas/Top50.js
// Encomendas e reposições › Top 50 (refeita em 17/11/2026, pedido do Marcus: igual às telas novas do Financeiro, sem letra em caixa alta, nomes padronizados).
// Três visões na MESMA tela (menu na faixa azul): Top 50 (planilha das revendedoras com a situação do kit), Pedidos ao Marcus (entrar ou sair) e Entradas e saídas (histórico).
// Filtro e ordem ficam no título de cada coluna (TabelaPlanilha). Lógica em domain/encomendas.js (estado s.er).
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { Pagina } from "@/apps/montagem/components/padrao";
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { formatarDataHora, formatarDia } from "@/apps/montagem/domain/encomendas";
import { Janelas } from "@/apps/montagem/pages/encomendas/janelas";
import { TabelaRev } from "@/apps/montagem/pages/encomendas/PlanilhaRev";
import { useEr } from "@/apps/montagem/pages/encomendas/visual";
import { e, useState } from "@/shared/react";

var dia = function(v){ return String(v || "").slice(0, 10); };

// Pedidos ao Marcus: uma linha por pedido de entrada ou saída
function TabelaPedidos(p){
  var E = p.E, er = E.er;
  var linhas = er.top50Sol.slice().sort(function(x, y){ return (x.status==="pendente" ? 0 : 1)-(y.status==="pendente" ? 0 : 1) || (String(x.em)<String(y.em) ? 1 : -1); }).map(function(x){
    return {id:x.id, data:dia(x.em), pedido:x.tipo==="entrar" ? "Entrada" : "Saída", nome:x.nome, rep:x.representante || "", motivo:x.motivo || "", sit:x.status==="pendente" ? "Aguardando" : x.status==="autorizado" ? "Autorizado" : "Recusado", acao:"", _x:x}; });
  var cols = [{k:"data", t:"Data", w:"8rem", data:true, fmt:formatarDia}, {k:"pedido", t:"Pedido", w:"8rem"}, {k:"nome", t:"Revendedora", w:"16rem"}, {k:"rep", t:"Representante", w:"10rem"}, {k:"motivo", t:"Motivo", w:"26rem"},
    {k:"sit", t:"Situação", w:"9rem", cor:function(l){ return l.sit==="Aguardando" ? "text-warning font-semibold" : l.sit==="Autorizado" ? "text-success" : "text-destructive"; }},
    {k:"acao", t:"Ações", w:"23rem", render:function(v, l){ var pend = l._x.status==="pendente";
      return e("span",{className:"inline-flex items-center justify-center gap-1.5"}, e(Botao,{onClick:function(){ p.ir({tipo:"msgsol", id:l.id}); }}, "Mensagem"),
        pend && e(Botao,{principal:true, desabilitado:!E.pode, title:E.pode ? "Autoriza e aplica" : "Só a diretoria decide", onClick:function(){ E.exec("top50_decidir", {id:l.id, ok:true}); }}, "Autorizar"),
        pend && e(Botao,{desabilitado:!E.pode, title:E.pode ? "Recusa o pedido" : "Só a diretoria decide", onClick:function(){ E.exec("top50_decidir", {id:l.id, ok:false}); }}, "Recusar")); }}];
  return e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", semCaixaAlta:true, grade:true, vazio:"Nenhum pedido ao Marcus."});
}

// Entradas e saídas: histórico, o mais novo em cima
function TabelaHistorico(p){
  var linhas = p.E.er.top50Hist.map(function(h, i){ return {id:i, data:dia(h.em), nome:h.nome, acao:h.acao==="entrou" ? "Entrou" : "Saiu", motivo:h.motivo || "", por:h.por || ""}; }).reverse();
  var cols = [{k:"data", t:"Data", w:"8rem", data:true, fmt:formatarDia}, {k:"nome", t:"Revendedora", w:"16rem"}, {k:"acao", t:"Movimento", w:"9rem", cor:function(l){ return l.acao==="Entrou" ? "text-success" : "text-destructive"; }}, {k:"motivo", t:"Motivo", w:"30rem"}, {k:"por", t:"Registrado por", w:"12rem"}];
  return e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", semCaixaAlta:true, grade:true, vazio:"Nenhuma mudança registrada."});
}

function AbaEncTop50(){
  var E = useEr(), er = E.er, md = useState(null), ir = function(m){ md[1](m); };
  var sv = useState(window.location.hash==="#pedidos" ? "pedidos" : "lista"), vista = sv[0];
  var pend = er.top50Sol.filter(function(x){ return x.status==="pendente"; }).length, snap = er.top50Snap[er.top50Snap.length-1];
  var titulo = vista==="pedidos" ? "Pedidos ao Marcus" : vista==="historico" ? "Entradas e saídas" : "Top 50";
  // mesma estrutura do Contas a pagar: bloco azul compacto, controles numa faixa azul e a tabela embaixo
  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e(BlocoPainel,{titulo:titulo, compacto:true},
      e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1"},
        e("select",{value:vista, "aria-label":"Visão", onChange:function(ev){ sv[1](ev.target.value); }, className:"h-8 w-56 min-w-0 rounded-md border border-border bg-card px-2 text-[13px] font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"},
          [["lista", "Top 50"], ["pedidos", "Pedidos ao Marcus"+(pend ? " ("+pend+")" : "")], ["historico", "Entradas e saídas"]].map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })),
        e(Botao,{desabilitado:!E.pode, title:E.pode ? "Cola a lista da planilha do Top 50" : "Só a diretoria importa a lista", onClick:function(){ ir({tipo:"importar"}); }}, "Importar lista"),
        e(Botao,{onClick:function(){ ir({tipo:"solicitar"}); }}, "Pedir entrada"),
        e(Botao,{principal:true, desabilitado:!E.pode, title:E.pode ? "Registra a lista de hoje como aprovada"+(snap ? ". Última aprovação: "+formatarDataHora(snap.em)+" por "+snap.por : "") : "Só a diretoria aprova a lista", onClick:function(){ E.exec("top50_registrar", {}); }}, "Aprovar lista do mês")),
      vista==="pedidos" ? e(TabelaPedidos,{E:E, ir:ir}) : vista==="historico" ? e(TabelaHistorico,{E:E}) : e(TabelaRev,{E:E, grupo:"top50", ir:ir})),
    e(Janelas,{E:E, modal:md[0], ir:ir}));
}
export { AbaEncTop50 };
