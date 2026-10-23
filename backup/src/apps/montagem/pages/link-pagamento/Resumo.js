// Sorelly Admin · montagem — pages/link-pagamento/Resumo.js
// Peças usadas no Relatório do Financeiro e na aba Análises do setor Link de pagamento:
//  · ResumoLinks: links gerados, pagos (e valor), expirados, com erro e abandonados, POR DIA (do mês escolhido) e POR MÊS.
//  · FormasDeVenda: como a revendedora recebe nas vendas do app (à vista, link Sorelly, Mercado Pago, personalizado). É da revendedora, não é dinheiro que entra na Sorelly: fica só nas Análises.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { LINHA, Tab, Td } from "@/apps/montagem/components/padrao";
import { formatarDia, formatarReais, resumoLinks, resumoVendasApp } from "@/apps/montagem/domain/link-pagamento";
import { e, useMemo } from "@/shared/react";

var NOME_MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
var rotuloMes = function(m){ var p = String(m).split("-"); return NOME_MES[+p[1]-1]+"/"+p[0]; };
var DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
var diaSemana = function(iso){ var p = iso.split("-"); return DIAS[new Date(+p[0], +p[1]-1, +p[2]).getDay()]; };
var num = function(n, cor){ return e(Td,{dinheiro:true, cor:n ? cor : undefined}, String(n)); };
var COLS = ["Gerados", "Pagos", "Valor pago", "Expirados", "Com erro", "Abandonados"];

function ResumoLinks(p){
  var r = useMemo(function(){ return resumoLinks(p.lp, p.mes); }, [p.lp.solicitacoes, p.mes]);
  var totMes = r.meses.find(function(m){ return m.mes===p.mes; });
  return e("div",{className:"flex flex-col gap-2.5"},
    e(BlocoBarra,{cor:"turquesa", t:"Resumo por mês", sub:"Gerados, pagos, expirados, com erro e abandonados em cada mês", dir:String(r.meses.length), compacto:true},
      e("div",{className:"p-2"}, r.meses.length ? e(Tab,{cols:["Mês"].concat(COLS, ["Conversão"])}, r.meses.map(function(m){
          return e("tr",{key:m.mes, className:LINHA+(m.mes===p.mes ? " font-bold" : "")}, e(Td,{forte:true}, rotuloMes(m.mes)), num(m.gerados), num(m.pagos, "ok"), e(Td,{dinheiro:true, cor:m.valorPago ? "ok" : undefined}, formatarReais(m.valorPago)), num(m.expirados, "alerta"), num(m.erros, "ruim"), num(m.abandonados), e(Td,{dinheiro:true}, String(m.conversao).replace(".", ",")+"%")); }))
        : e("p",{className:"py-3 text-center text-[13px] text-white/60"}, "Ainda não há links registrados."))),
    e(BlocoBarra,{cor:"turquesa", t:"Resumo por dia", sub:p.mes ? rotuloMes(p.mes) : "", dir:totMes ? totMes.pagos+" pagos · "+formatarReais(totMes.valorPago) : "", compacto:true},
      e("div",{className:"p-2"}, r.dias.length ? e(Tab,{cols:["Dia"].concat(COLS)}, r.dias.map(function(d){
          return e("tr",{key:d.dia, className:LINHA}, e(Td,{forte:true}, formatarDia(d.dia)+" · "+diaSemana(d.dia)), num(d.gerados), num(d.pagos, "ok"), e(Td,{dinheiro:true, cor:d.valorPago ? "ok" : undefined}, formatarReais(d.valorPago)), num(d.expirados, "alerta"), num(d.erros, "ruim"), num(d.abandonados)); }))
        : e("p",{className:"py-3 text-center text-[13px] text-white/60"}, "Nenhum link neste mês."))));
}

// como as revendedoras recebem nas vendas e pedidos do app (a Sorelly não recomenda uma forma: é escolha da revendedora; o admin só acompanha quantas usam cada uma)
var FORMAS = [["vista", "À vista (Pix ou dinheiro)", "#22C55E"], ["combinado", "Combinado (entrada e o resto depois)", "#A78BFA"], ["sorelly", "Link de pagamento Sorelly", "#0EA5E9"], ["mp", "Link Mercado Pago", "#F59E0B"]];
function FormasDeVenda(p){
  var r = resumoVendasApp(p.lp, p.mes), tot = Math.max(1, FORMAS.reduce(function(t, f){ return t+r.formas[f[0]].vendas; }, 0));
  return e(BlocoBarra,{cor:"turquesa", t:"Como as revendedoras recebem nas vendas do app", sub:"Vendas e pedidos feitos pelas revendedoras, por forma escolhida (inclui quantas usam o Mercado Pago)", dir:String(r.total), compacto:true},
    e("div",{className:"p-2"}, r.total===0 ? e("p",{className:"py-3 text-center text-[13px] text-white/60"}, "Nenhuma venda ou pedido feito pelo app da revendedora neste período.")
      : e(Tab,{cols:["Forma", "Vendas e pedidos", "% do total", "Valor", "Revendedoras"]}, FORMAS.map(function(f){ var g = r.formas[f[0]];
          return e("tr",{key:f[0], className:LINHA}, e(Td,{forte:true}, e("span",{className:"mr-2 inline-block size-2.5 rounded-full align-middle", style:{background:f[2]}}), f[1]), e(Td,{dinheiro:true}, String(g.vendas)), e(Td,{dinheiro:true}, Math.round(g.vendas/tot*100)+"%"), e(Td,{dinheiro:true}, formatarReais(g.valor)), e(Td,{dinheiro:true}, String(g.revendedoras))); }))));
}
export { ResumoLinks, FormasDeVenda };
