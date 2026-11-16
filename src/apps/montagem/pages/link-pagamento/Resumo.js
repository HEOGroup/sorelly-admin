// Sorelly Admin · montagem — pages/link-pagamento/Resumo.js
// Peças usadas no Relatório de links e na tela Análises do setor Link de pagamento:
//  · ResumoLinks: links gerados, pagos (e valor), expirados, com erro e abandonados, POR DIA (do mês escolhido) e POR MÊS.
//  · FormasDeVenda: como a revendedora recebe nas vendas do app (à vista, link Sorelly, Mercado Pago, personalizado). É da revendedora, não é dinheiro que entra na Sorelly: fica só nas Análises.
// REFEITAS em 16/11/2026 (Marcus: "arruma as outras telas conforme as nossas regras"): blocos azuis (BlocoPainel) e planilha com filtro em cada coluna (TabelaPlanilha). Nenhuma coluna saiu.
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { formatarReais, resumoLinks, resumoVendasApp } from "@/apps/montagem/domain/link-pagamento";
import { e, useMemo } from "@/shared/react";

var NOME_MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
var rotuloMes = function(m){ var p = String(m).split("-"); return NOME_MES[+p[1]-1]+"/"+p[0]; };
var DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
var diaSemana = function(iso){ var p = iso.split("-"); return DIAS[new Date(+p[0], +p[1]-1, +p[2]).getDay()]; };
var diaBR = function(iso){ return String(iso).split("-").reverse().join("/"); };
var din = function(x){ return formatarReais(x || 0); };
// número colorido só quando existe (verde pago, âmbar expirado, vermelho erro)
var cn = function(cor){ return function(v){ return e("span",{className:"tabular-nums "+(v ? cor : "")}, String(v)); }; };
var pcts = function(v){ return String(v).replace(".", ",")+"%"; };
var COLS_NUM = [{k:"gerados", t:"Gerados"}, {k:"pagos", t:"Pagos", render:cn("font-bold text-success")}, {k:"valorPago", t:"Valor pago", fmt:din, render:function(v){ return e("span",{className:"tabular-nums "+(v ? "font-bold text-success" : "")}, din(v)); }},
  {k:"expirados", t:"Expirados", render:cn("font-bold text-[#FBBF24]")}, {k:"erros", t:"Com erro", render:cn("font-bold text-destructive")}, {k:"abandonados", t:"Abandonados"}];

function ResumoLinks(p){
  var r = useMemo(function(){ return resumoLinks(p.lp, p.mes); }, [p.lp.solicitacoes, p.mes]);
  var totMes = r.meses.find(function(m){ return m.mes===p.mes; });
  var linhasMes = r.meses.map(function(m){ return {id:m.mes, mes:m.mes, gerados:m.gerados, pagos:m.pagos, valorPago:m.valorPago, expirados:m.expirados, erros:m.erros, abandonados:m.abandonados, conversao:m.conversao}; });
  var linhasDia = r.dias.map(function(d){ return {id:d.dia, dia:d.dia, gerados:d.gerados, pagos:d.pagos, valorPago:d.valorPago, expirados:d.expirados, erros:d.erros, abandonados:d.abandonados}; });
  var colsMes = [{k:"mes", t:"Mês", fmt:rotuloMes, render:function(v){ return e("b",null, rotuloMes(v)); }}].concat(COLS_NUM, [{k:"conversao", t:"Conversão", fmt:pcts, render:pcts}]);
  var colsDia = [{k:"dia", t:"Dia", fmt:function(v){ return diaBR(v)+" · "+diaSemana(v); }, render:function(v){ return e("b",null, diaBR(v)+" · "+diaSemana(v)); }}].concat(COLS_NUM);
  return e("div",{className:"flex flex-col gap-2"},
    e(BlocoPainel,{titulo:"Resumo por mês", compacto:true, dir:String(r.meses.length)},
      r.meses.length ? e(TabelaPlanilha,{cols:colsMes, linhas:linhasMes, chave:"id", centro:true, grade:true, semLimpar:true, semContagem:true, linhaCls:function(l){ return l.mes===p.mes ? "font-bold bg-white/10" : ""; }})
        : e("p",{className:"py-4 text-center text-[13px]"}, "Ainda não há links registrados.")),
    e(BlocoPainel,{titulo:"Resumo por dia"+(p.mes ? " · "+rotuloMes(p.mes) : ""), compacto:true, dir:totMes ? totMes.pagos+" pagos · "+formatarReais(totMes.valorPago) : ""},
      r.dias.length ? e(TabelaPlanilha,{cols:colsDia, linhas:linhasDia, chave:"id", centro:true, grade:true, semLimpar:true, semContagem:true})
        : e("p",{className:"py-4 text-center text-[13px]"}, "Nenhum link neste mês.")));
}

// como as revendedoras recebem nas vendas e pedidos do app (a Sorelly não recomenda uma forma: é escolha da revendedora; o admin só acompanha quantas usam cada uma)
var FORMAS = [["vista", "À vista (Pix ou dinheiro)", "#22C55E"], ["combinado", "Combinado (entrada e o resto depois)", "#A78BFA"], ["sorelly", "Link de pagamento Sorelly", "#0EA5E9"], ["mp", "Link Mercado Pago", "#F59E0B"]];
function FormasDeVenda(p){
  var r = resumoVendasApp(p.lp, p.mes), tot = Math.max(1, FORMAS.reduce(function(t, f){ return t+r.formas[f[0]].vendas; }, 0));
  var linhas = FORMAS.map(function(f){ var g = r.formas[f[0]]; return {id:f[0], forma:f[1], _cor:f[2], vendas:g.vendas, pct:Math.round(g.vendas/tot*100), valor:g.valor, revendedoras:g.revendedoras}; });
  var cols = [{k:"forma", t:"Forma", render:function(v, l){ return e("span",null, e("span",{className:"mr-2 inline-block size-2.5 rounded-full align-middle", style:{background:l._cor}}), v); }}, {k:"vendas", t:"Vendas e pedidos"},
    {k:"pct", t:"% do total", render:function(v){ return v+"%"; }}, {k:"valor", t:"Valor", fmt:din, render:din}, {k:"revendedoras", t:"Revendedoras"}];
  return e(BlocoPainel,{titulo:"Como as revendedoras recebem nas vendas do app", compacto:true, dir:String(r.total)},
    r.total===0 ? e("p",{className:"py-4 text-center text-[13px]"}, "Nenhuma venda ou pedido feito pelo app da revendedora neste período.")
      : e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", centro:true, grade:true, semFiltro:true, semLimpar:true, semContagem:true}));
}
export { ResumoLinks, FormasDeVenda };
