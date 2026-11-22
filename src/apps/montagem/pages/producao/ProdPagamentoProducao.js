// Sorelly Admin · montagem — pages/producao/ProdPagamentoProducao.js
// Produção › PAGAMENTO POR PRODUÇÃO (Marcus, 19/11/2026: "faz uma tela da produção externa de pagamento por produção"): para a pessoa da produção externa (Dávila, Leci, Didi),
// UMA linha por dia produzido: peças do dia, valor da peça (R$ 0,45 de 16/11 em diante; antes, diária), valor do dia, semana, quarta-feira do pagamento e situação.
// "Marcar pago" dá a baixa só nesse dia (mesmo controle da janela Dias, em domain/producao.js: pr.diasPagos). Só a diretoria.
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { CASA_PECA_DESDE, CASA_POR_PECA, diaDaSemana, eCasa, formatarDia, formatarInteiro, formatarReais, hojeSP, intervaloPeriodo, linhasDoPeriodo, listaExternas, nomeMes, quartaDaSemana, somaDias, valorDiaCasa } from "@/apps/montagem/domain/producao";
import { Aviso, CAMPO_FAIXA, FaixaAzul, Raiz, usePr } from "@/apps/montagem/pages/producao/visualProd";
import { e, useState } from "@/shared/react";

var LINK = "h-8 text-[13px] font-semibold underline hover:text-primary";
var cap = function(t){ return t ? t.charAt(0).toUpperCase()+t.slice(1) : t; };

function AbaProdPagamentoProducao(){
  var x = usePr(), pr = x.pr, hoje = hojeSP(), sP = useState("Davila Aline"), sM = useState(hoje.slice(0, 7));
  if(!x.admin && !x.leitura) return e(Raiz,null, e(BlocoPainel,{titulo:"Pagamento por produção", compacto:true}, e(Aviso,null, "Somente a diretoria acessa.")));
  var pessoas = listaExternas(pr), func = pessoas.indexOf(sP[0])>=0 ? sP[0] : pessoas[0], mes = sM[0], ym = mes.split("-").map(Number);
  var iv = intervaloPeriodo("mes", mes+"-01"), dp = pr.diasPagos || {}, porDia = {};
  linhasDoPeriodo(pr, iv.from, iv.to, null).filter(eCasa).forEach(function(l){ var q = Number(l.qtd) || 0; if(q>0 && String(l.func).trim().toLowerCase()===String(func).trim().toLowerCase()) porDia[l.dia] = (porDia[l.dia] || 0)+q; });
  var linhas = Object.keys(porDia).sort().map(function(d){
    var dow = new Date(d+"T12:00:00Z").getUTCDay(), seg = somaDias(d, -(dow===0 ? 6 : dow-1)), pago = !!dp[func+"|"+d], pagarEm = quartaDaSemana(d);
    return {id:d, dia:d, quando:formatarDia(d)+" · "+cap(diaDaSemana(d)), semana:formatarDia(seg).slice(0, 5)+" a "+formatarDia(somaDias(seg, 6)).slice(0, 5), pagarEm:formatarDia(pagarEm), pecas:porDia[d],
      porPeca:d<CASA_PECA_DESDE ? "Diária" : formatarReais(CASA_POR_PECA), valor:valorDiaCasa(pr, func, d), pago:pago, situ:pago ? "Pago" : pagarEm<hoje ? "Atrasado" : "A pagar"};
  });
  var cols = [{k:"quando", t:"Dia"}, {k:"semana", t:"Semana"}, {k:"pagarEm", t:"Pagar em"}, {k:"pecas", t:"Peças", fmt:formatarInteiro}, {k:"porPeca", t:"Valor da peça"},
    {k:"valor", t:"Valor do dia", fmt:formatarReais}, {k:"situ", t:"Situação", cor:function(r){ return r.pago ? "text-success" : r.situ==="Atrasado" ? "text-danger" : "text-warning"; }}];
  if(!x.leitura) cols.push({k:"ac", t:"Ação", render:function(v, r){ return e("button",{type:"button", onClick:function(){ x.exec("dia_pago", {func:func, dia:r.dia, pago:!r.pago}); }, className:LINK}, r.pago ? "Desfazer" : "Marcar pago"); }});
  var soma = function(ls, f){ return ls.reduce(function(t, r){ return t+(f(r) || 0); }, 0); };
  var totalRodape = function(ls){ return cols.map(function(c, i){
    if(i===0) return "TOTAL · "+ls.length;
    if(c.k==="pecas") return formatarInteiro(soma(ls, function(r){ return r.pecas; }));
    if(c.k==="valor") return formatarReais(soma(ls, function(r){ return r.valor; }));
    if(c.k==="situ") return "Pago "+formatarReais(soma(ls, function(r){ return r.pago ? r.valor : 0; }))+" · Falta "+formatarReais(soma(ls, function(r){ return r.pago ? 0 : r.valor; }));
    return ""; }); };
  return e(Raiz,null,
    e(BlocoPainel,{titulo:"Pagamento por produção · "+nomeMes(ym[0], ym[1]), dir:func, compacto:true},
      e(FaixaAzul,null,
        e("label",{className:"flex items-center gap-2 text-[13px] font-semibold text-white"}, "Pessoa", e("select",{value:func, "aria-label":"Pessoa", onChange:function(ev){ sP[1](ev.target.value); }, className:CAMPO_FAIXA+" w-48 cursor-pointer"}, pessoas.map(function(n){ return e("option",{key:n, value:n}, n); }))),
        e("label",{className:"flex items-center gap-2 text-[13px] font-semibold text-white"}, "Mês", e("input",{type:"month", value:mes, "aria-label":"Mês", onChange:function(ev){ if(ev.target.value) sM[1](ev.target.value); }, className:CAMPO_FAIXA}))),
      e(TabelaPlanilha,{key:"pp"+func+mes, fina:true, cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, totalRodape:totalRodape, vazio:"Nenhuma produção externa neste mês."})));
}
export { AbaProdPagamentoProducao };
