// Sorelly Admin · montagem — pages/encomendas/Top50.js
// Encomendas e reposições › Top 100 (refeita em 17/11/2026, pedido do Marcus: igual às telas novas do Financeiro, sem letra em caixa alta, nomes padronizados).
// Três visões na MESMA tela (menu na faixa azul): Top 100 (planilha das revendedoras com a situação do kit), Pedidos ao Marcus (entrar ou sair) e Entradas e saídas (histórico).
// Filtro e ordem ficam no título de cada coluna (TabelaPlanilha). Lógica em domain/encomendas.js (estado s.er).
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { PAGINA_CHEIA, CLS_FINA_ESPACO, BarraTabela, CelulaBarra, CampoMini } from "@/apps/montagem/components/planilha-cheia";
import { degrade, ESTADO, Pagina } from "@/apps/montagem/components/padrao";
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { formatarDataHora, formatarDia } from "@/apps/montagem/domain/encomendas";
import { Janelas } from "@/apps/montagem/pages/encomendas/janelas";
import { TabelaRev } from "@/apps/montagem/pages/encomendas/PlanilhaRev";
import { useEr } from "@/apps/montagem/pages/encomendas/visual";
import { e, useState } from "@/shared/react";

var FUNDO = "!bg-[#0f1729] [&_tbody_tr:hover]:!bg-[#1e2d4c]";   // azul-marinho da Home do Financeiro familiar
var FINA = CLS_FINA_ESPACO+" [&_table_td]:!text-[11px] [&_table_th]:!text-[11px] [&_table_th]:!h-[20px]";   // padrao-ok: letra de 11 px e linhas de 20 px, igual à Home do Financeiro familiar (Marcus, 23/11/2026)
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
  return e(TabelaPlanilha,{fina:true, semMao:true, centro:true, semContagem:true, cols:cols, linhas:linhas, chave:"id", semCaixaAlta:true, grade:true, vazio:"Nenhum pedido ao Marcus."});
}

// Entradas e saídas: histórico, o mais novo em cima
function TabelaHistorico(p){
  var linhas = p.E.er.top50Hist.map(function(h, i){ return {id:i, data:dia(h.em), nome:h.nome, acao:h.acao==="entrou" ? "Entrou" : "Saiu", motivo:h.motivo || "", por:h.por || ""}; }).reverse();
  var cols = [{k:"data", t:"Data", w:"8rem", data:true, fmt:formatarDia}, {k:"nome", t:"Revendedora", w:"16rem"}, {k:"acao", t:"Movimento", w:"9rem", cor:function(l){ return l.acao==="Entrou" ? "text-success" : "text-destructive"; }}, {k:"motivo", t:"Motivo", w:"30rem"}, {k:"por", t:"Registrado por", w:"12rem"}];
  return e(TabelaPlanilha,{fina:true, semMao:true, centro:true, semContagem:true, cols:cols, linhas:linhas, chave:"id", semCaixaAlta:true, grade:true, vazio:"Nenhuma mudança registrada."});
}

// Regras do Top 100 (Marcus, 18/11/2026): seis cartões em grade 3 x 2, na ordem da lista (posição 1 a 100, 101 a 150, fora do 150) e depois as proteções. Documento completo: docs/setores/encomendas-e-reposicoes/regras-top100.md
var REGRAS_TOP100 = [
  {k:"Posição 1 a 100", t:"Ativa", d:"Acesso completo a pedidos e reposições.", cor:"ok"},
  {k:"Posição 101 a 150", t:"Protegida", d:"Mantém o acesso, só quem já tinha.", cor:"alerta"},
  {k:"Fora do 150", t:"Saída", d:"Sai depois de 2 meses seguidos fora.", cor:"ruim"},
  {k:"Dia 1º de cada mês", t:"Ranking", d:"Vendas dos últimos 3 meses decidem a lista.", cor:"info"},
  {k:"Pedido aberto", t:"Nunca sai", d:"Pedido aberto ou peça separada protege a revendedora.", cor:"info"},
  {k:"Exclusão e exceção", t:"Só a diretoria", d:"Equipe não exclui. Exceção com motivo e até 3 meses.", cor:"info"}
];
function BlocoRegras(){
  return e(BlocoPainel,{titulo:"Regras do Top 100", compacto:true, cls:FUNDO},
    e("div",{className:"grid grid-cols-2 divide-x divide-white/30 md:grid-cols-6"},
      REGRAS_TOP100.map(function(r){ var c = ESTADO[r.cor];
        return e("div",{key:r.t, className:"flex flex-col items-center justify-start gap-0.5 px-2 py-1.5 text-center"},
          e("span",{className:"text-[11px] font-semibold", style:{color:c}}, r.k),
          e("b",{className:"text-[13px] font-semibold text-foreground"}, r.t),
          e("span",{className:"text-[11px] text-foreground"}, r.d)); })));
}

function AbaEncTop50(){
  var E = useEr(), er = E.er, md = useState(null), ir = function(m){ md[1](m); };
  var sv = useState(window.location.hash==="#pedidos" ? "pedidos" : "lista"), vista = sv[0];
  var pend = er.top50Sol.filter(function(x){ return x.status==="pendente"; }).length, snap = er.top50Snap[er.top50Snap.length-1];
  var titulo = vista==="pedidos" ? "Pedidos ao Marcus" : vista==="historico" ? "Entradas e saídas" : "Top 100";
  // mesma estrutura do Contas a pagar: bloco azul compacto, controles numa faixa azul e a tabela embaixo
  var barra = e(BarraTabela,null,
    e(CelulaBarra,{rotulo:"Visão"}, e(CampoMini,{valor:vista, rotulo:"Visão", aoMudar:function(v){ sv[1](v); }, ops:[["lista", "Top 100"], ["pedidos", "Pedidos ao Marcus"+(pend ? " ("+pend+")" : "")], ["historico", "Entradas e saídas"]]})),
    e(CelulaBarra,{rotulo:"Lista"}, e("span",{className:"flex"},
      e(Botao,{desabilitado:!E.pode, title:E.pode ? "Cola a lista da planilha do Top 100" : "Só a diretoria importa a lista", onClick:function(){ ir({tipo:"importar"}); }}, "Importar lista"),
      e(Botao,{onClick:function(){ ir({tipo:"solicitar"}); }}, "Pedir entrada"))),
    e(CelulaBarra,{rotulo:"Mês"}, e(Botao,{principal:true, desabilitado:!E.pode, title:E.pode ? "Registra a lista de hoje como aprovada"+(snap ? ". Última aprovação: "+formatarDataHora(snap.em)+" por "+snap.por : "") : "Só a diretoria aprova a lista", onClick:function(){ E.exec("top50_registrar", {}); }}, "Aprovar lista do mês")));
  // mesma estrutura da Home do Financeiro familiar: página cheia, bloco azul-marinho, barra em células e tabela fina
  return e(Pagina,{className:PAGINA_CHEIA},
    e(BlocoRegras,null),
    e(BlocoPainel,{titulo:titulo, compacto:true, cls:FUNDO}, barra,
      e("div",{className:FINA, style:{"--lh":"20px"}}, vista==="pedidos" ? e(TabelaPedidos,{E:E, ir:ir}) : vista==="historico" ? e(TabelaHistorico,{E:E}) : e(TabelaRev,{E:E, grupo:"top50", ir:ir}))),
    e(Janelas,{E:E, modal:md[0], ir:ir}));
}
export { AbaEncTop50 };
