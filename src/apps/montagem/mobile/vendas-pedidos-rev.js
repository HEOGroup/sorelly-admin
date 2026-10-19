// Sorelly Admin · montagem — mobile/vendas-pedidos-rev.js
// Tela "Vendas e Pedidos" do app da REVENDEDORA (19/10/2026, desenhada a partir dos prints do app de hoje): busca e 3 abas.
//  · Abertos: pedidos novos que chegam das clientes (ainda não existe catálogo para a cliente: fica vazio por enquanto)
//  · Pagamentos: propostas enviadas, esperando a cliente decidir/pagar
//  · Fechados: vendas registradas (Finalizado + forma de pagamento), com as garantias
// No topo, as COBRANÇAS: pagamentos combinados (Pix/dinheiro) que venceram ou vencem hoje, com o botão "Recebi". Dados de s.lp.vendasApp (domain/link-pagamento.js).
import { cobrancasDaRevendedora, formatarDia, hojeSP, vendasDaRevendedora } from "@/apps/montagem/domain/link-pagamento";
import { BKC } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useState } from "@/shared/react";

var BR = "txt-branco";
var nEmitidas = function(v){ return (v.itens||[]).length; };   // 1 garantia por peça, emitida junto com a venda (domain/garantias-rev.js)
var ABAS = [["abertos", "Abertos", "#2563EB"], ["pagamentos", "Pagamentos", "#7C3AED"], ["fechados", "Fechados", "#0F766E"]];
var FORMA = {vista:["À VISTA", "#15803D", "#DCFCE7"], combinado:["COMBINADO", "#7E22CE", "#F3E8FF"], sorelly:["LINK SORELLY", "#0369A1", "#E0F2FE"], mp:["MERCADO PAGO", "#B45309", "#FEF3C7"]};
var inicial = function(n){ return String(n||"?").trim().charAt(0).toUpperCase() || "?"; };
var quando = function(em, hoje){ var d = String(em||"").slice(0, 10), h = String(em||"").slice(11, 16); return (d===hoje ? "hoje" : formatarDia(d).slice(0, 5))+", "+h; };

function Etiqueta(p){ return e("span",{className:"rounded-full px-2.5 py-1 text-[11px] font-black tracking-wide", style:{background:p.fundo, color:p.cor}}, p.t); }

function TelaVendasPedidos(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = p.k, hoje = hojeSP();
  var ab = useState("fechados"), aba = ab[0], setAba = ab[1];
  var bq = useState(""), busca = bq[0], setBusca = bq[1];
  var todas = vendasDaRevendedora(s.lp, k.rev), cobr = cobrancasDaRevendedora(s.lp, k.rev, hoje);
  var q = busca.trim().toLowerCase();
  var grupos = {abertos:[], pagamentos:todas.filter(function(v){ return v.tipo==="proposta"; }), fechados:todas.filter(function(v){ return v.tipo==="venda"; })};
  var lista = grupos[aba].filter(function(v){ return !q || String(v.cliente).toLowerCase().indexOf(q)>=0 || String("pedido "+v.numero).indexOf(q)>=0; });
  var cabeca = e("div",{key:"h", className:"flex items-center justify-between gap-2 "+BR},
    e("div",{className:"flex min-w-0 items-center gap-2"},
      e("button",{onClick:p.onVoltar, "aria-label":"Voltar", className:"grid size-8 shrink-0 place-items-center rounded-full bg-[#2A2A2E]"}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
      e("b",{className:"truncate whitespace-nowrap text-[16px]"}, "Vendas e Pedidos ("+todas.length+")")));
  var cartao = function(v){
    var fm = FORMA[(v.formas||[])[0]] || ["", "#374151", "#F3F4F6"], aReceber = (v.plano||[]).filter(function(x){ return !x.pago && (x.forma==="pix" || x.forma==="dinheiro"); });
    return e("div",{key:v.id, className:"flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-[#D1D5DB]"},
      e("div",{className:"flex items-center gap-1.5 px-2.5 pt-2.5"},
        v.tipo==="venda" ? e(Etiqueta,{t:"FINALIZADO", fundo:"#DCFCE7", cor:"#15803D"}) : e(Etiqueta,{t:"PROPOSTA ENVIADA", fundo:"#CFFAFE", cor:"#0E7490"}),
        v.tipo==="venda" && fm[0] && e(Etiqueta,{t:fm[0], fundo:fm[2], cor:fm[1]}),
        e("span",{className:"ml-auto rounded-lg bg-[#F3F4F6] px-2.5 py-1 text-[12px] font-semibold text-[#374151]"}, "Pedido "+v.numero)),
      e("div",{className:"flex items-center gap-3 px-2.5 py-2.5"},
        e("span",{className:"grid size-11 shrink-0 place-items-center rounded-full bg-[#E5E7EB] text-[15px] font-semibold text-[#6B7280]"}, inicial(v.cliente)),
        e("div",{className:"flex min-w-0 flex-1 flex-col"}, e("b",{className:"truncate text-[16px] text-[#111827]"}, v.cliente || "Cliente"), e("span",{className:"text-[13px] text-[#6B7280]"}, (v.itens||[]).length+((v.itens||[]).length===1 ? " peça" : " peças"))),
        e("div",{className:"flex shrink-0 flex-col items-end"}, e("b",{className:"text-[17px] text-[#B8862B]"}, BKC(v.valor)), e("span",{className:"text-[12px] text-[#9CA3AF]"}, quando(v.em, hoje)))),
      aReceber.length>0 && v.tipo==="venda" && e("div",{className:"flex items-center justify-between gap-2 border-t border-[#F3F4F6] bg-[#FFFBEB] px-2.5 py-1.5"},
        e("span",{className:"truncate whitespace-nowrap text-[12px] font-semibold text-[#B45309]"}, "A receber "+BKC(aReceber.reduce(function(t, x){ return t+x.valor; }, 0))), e("span",{className:"whitespace-nowrap text-[12px] text-[#92400E]"}, "até "+formatarDia(aReceber[aReceber.length-1].data).slice(0, 5))),
      v.tipo==="venda" && e("div",{className:"flex items-center justify-between border-t border-[#E5E7EB] px-2.5 py-2"},
        e("span",{className:"flex items-center gap-1.5 text-[13px] font-medium text-[#374151]"}, e(Icon,{n:"escudo", s:15, className:"text-[#15803D]"}), "Garantias"),
        e("span",{className:"rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-black text-[#6B7280]"}, nEmitidas(v)+(nEmitidas(v)===1 ? " EMITIDA" : " EMITIDAS"))));
  };
  var blocoCobranca = cobr.length>0 && e("div",{key:"cob", className:"flex flex-col gap-1.5 rounded-xl bg-[#FEF2F2] p-2.5 ring-1 ring-[#FECACA]"},
    e("b",{className:"text-[13px] text-[#B91C1C]"}, "Cobranças: "+cobr.length+(cobr.length===1 ? " pagamento" : " pagamentos")+" para cobrar"),
    cobr.map(function(c){ return e("div",{key:c.vendaId+"-"+c.i, className:"flex items-center gap-2 rounded-lg bg-white p-2 ring-1 ring-[#FECACA]"},
      e("div",{className:"flex min-w-0 flex-1 flex-col"}, e("b",{className:"truncate text-[13.5px] text-[#111827]"}, c.cliente+" · Pedido "+c.numero), e("span",{className:"text-[12px] "+(c.atrasada ? "font-semibold text-[#B91C1C]" : "text-[#6B7280]")}, (c.atrasada ? "venceu em " : "vence hoje, ")+formatarDia(c.data).slice(0, 5)+" · "+(c.forma==="pix" ? "Pix" : "dinheiro"))),
      e("b",{className:"text-[14px] text-[#B8862B]"}, BKC(c.valor)),
      e("button",{onClick:function(){ d({type:"LP", op:"venda_receber", por:k.rev+" (app)", id:c.vendaId, i:c.i}); }, className:"h-8 rounded-lg bg-[#15803D] px-3 text-[12px] font-bold "+BR}, "Recebi")); }));
  var corpo = e("div",{key:"c", className:"-mx-4 -mb-10 flex min-h-[calc(100%-3.5rem)] flex-col gap-2.5 bg-[#F9FAFB] px-4 pb-10 pt-3"},
    e("div",{className:"flex items-center gap-2"},
      e("label",{className:"flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-[#D1D5DB]"}, e(Icon,{n:"search", s:15, className:"shrink-0 text-[#9CA3AF]"}),
        e("input",{value:busca, onChange:function(ev){ setBusca(ev.target.value); }, placeholder:"Buscar pedido...", "aria-label":"Buscar pedido", className:"min-w-0 flex-1 bg-transparent text-[14px] text-[#111827] outline-none placeholder:text-[#9CA3AF]"}))),
    e("div",{className:"-mx-4 flex border-b border-[#E5E7EB] bg-white px-2"}, ABAS.map(function(a){ var on = aba===a[0];
      return e("button",{key:a[0], onClick:function(){ setAba(a[0]); }, className:"flex flex-1 items-center justify-center gap-1.5 border-b-[3px] py-2.5 text-[14px] font-bold", style:{borderColor:on ? a[2] : "transparent", color:on ? a[2] : "#6B7280"}},
        a[1], e("span",{className:"grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-black "+(on ? BR : "bg-[#D1D5DB] "+BR), style:on ? {background:a[2]} : undefined}, grupos[a[0]].length)); })),
    blocoCobranca,
    lista.length===0
      ? e("p",{className:"rounded-xl bg-white p-5 text-center text-[13px] text-[#6B7280] ring-1 ring-[#E5E7EB]"}, aba==="abertos" ? "Nenhum pedido novo. Os pedidos das clientes chegam aqui." : aba==="pagamentos" ? "Nenhuma proposta enviada." : "Nenhuma venda registrada ainda.")
      : lista.map(cartao));
  return [cabeca, corpo];
}
export { TelaVendasPedidos };
