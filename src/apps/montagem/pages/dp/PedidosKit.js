// Sorelly Admin · montagem — pages/dp/PedidosKit.js
// Direcionar › Pedidos de kit novo (11/11/2026, Marcus): revendedora do atendimento interno com média de vendas abaixo do mínimo. A atendente pede no Atendimento Sorelly;
// aqui o Financeiro vê as 3 últimas vendas, a média, se ela deve acerto anterior e se tem dívida no setor de Inadimplência, e aceita ou não. Só aparece quando há pedido esperando.
// Regras em domain/direcionar-pix.js (ações DP kit_pedir e kit_decidir; lista s.dp.kits, chave kp_ no módulo pag).
import { Botao, brl } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { nomeDe, podeConferirPag, podeFinanceiro } from "@/apps/montagem/domain/equipe";
import { use } from "@/apps/montagem/state/context";
import { e, useMemo } from "@/shared/react";

var hora = function(ts){ var d = new Date(ts); return ("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2); };
var sem = function(t){ return String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim(); };

function PedidosKit(){
  var cx = use(), s = cx.state, d = cx.dispatch, por = nomeDe(s.usuario), pode = podeConferirPag(s.usuario) || podeFinanceiro(s.usuario);
  var kits = (s.dp && s.dp.kits) || [], dividas = (s.inad && s.inad.dividas) || [];
  var linhas = useMemo(function(){ return kits.filter(function(k){ return k.status==="pedido"; }).map(function(k){ var v = k.vendas||[], n = sem(k.nome), noSetor = dividas.filter(function(x){ return sem(x.nome)===n; }).length;
    return {id:k.id, nome:k.nome, v1:v[0] ? v[0].venda : null, v2:v[1] ? v[1].venda : null, v3:v[2] ? v[2].venda : null, media:k.media, minimo:k.minimo, divida:k.divida>0 ? brl(k.divida) : "Não deve",
      setor:noSetor ? noSetor+(noSetor===1 ? " dívida" : " dívidas")+" no histórico" : "Nenhuma", pedido:(k.pedidoPor||"")+" · "+hora(k.pedidoEm), decisao:""}; }); }, [kits, dividas]);
  if(!linhas.length) return null;
  var R$ = function(v){ return v==null ? "" : brl(v); };
  var decide = function(l, aceito){ var motivo = ""; if(!aceito){ motivo = window.prompt("Motivo para não autorizar o kit novo de "+l.nome+":") || ""; if(!motivo.trim()) return; } d({type:"DP", op:"kit_decidir", id:l.id, aceito:aceito, motivo:motivo, por:por}); };
  var cols = [{k:"nome", t:"Revendedora"}, {k:"v1", t:"Venda de hoje", fmt:R$}, {k:"v2", t:"Venda anterior", fmt:R$}, {k:"v3", t:"Venda antes dela", fmt:R$}, {k:"media", t:"Média", fmt:R$, cor:function(){ return "text-red-400 font-semibold"; }}, {k:"minimo", t:"Mínimo", fmt:R$},
    {k:"divida", t:"Acerto anterior", cor:function(l){ return l.divida==="Não deve" ? "text-emerald-400" : "text-red-400 font-semibold"; }}, {k:"setor", t:"Inadimplência", cor:function(l){ return l.setor==="Nenhuma" ? "text-emerald-400" : "text-amber-300"; }}, {k:"pedido", t:"Pedido por"},
    {k:"decisao", t:"Kit novo", render:function(v, l){ return pode ? e("span",{className:"inline-flex gap-2"}, e(Botao,{principal:true, onClick:function(){ decide(l, true); }}, "Aceitar"), e(Botao,{onClick:function(){ decide(l, false); }}, "Não aceitar")) : "Só o Financeiro decide"; }}];
  return e("section",{className:"flex flex-col gap-1.5 rounded-lg border border-primary bg-card/60 p-2"},
    e("h2",{className:"text-center text-[13px] font-semibold"}, "Pedidos de kit novo · média abaixo do mínimo"),
    e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", escura:true, grade:true, semFiltro:true, semContagem:true}));
}

export { PedidosKit };
