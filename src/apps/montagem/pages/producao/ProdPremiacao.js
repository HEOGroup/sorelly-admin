// Sorelly Admin · montagem — pages/producao/ProdPremiacao.js
// Produção › PREMIAÇÃO (só diretoria; refeita em 18/11/2026). Marcus: "o bônus é pelo dia mesmo: 300 peças R$ 15, 350 R$ 20, 400 R$ 25"; "duas linhas por dia, com o total de peças e o valor do bônus e o total"; pagamento no dia 11 do mês seguinte.
// Bloco 1 — GRADE DO MÊS: cada funcionária tem DUAS linhas (Peças e Bônus); colunas = dias do mês e o Total. Bônus do dia vem de BONUS_DIAS (domain/producao.js, fixo no código); o do mês é a soma dos dias.
// Bloco 2 — PAGAMENTO: por funcionária, quantos dias de R$ 15, R$ 20 e R$ 25, o bônus do mês, a data (dia 11 do mês seguinte) e a situação (Em andamento, A pagar, Pago).
// Bloco 3 — REGRAS: tabela curta. Produção externa (Dávila) fica fora. Dia com menos de 100 peças não conta como dia trabalhado.
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { BONUS_DIAS, BONUS_PAGA_DIA, DIA_MINIMO, diaDaSemana, formatarInteiro, formatarReais, hojeSP, premiacaoDoMes } from "@/apps/montagem/domain/producao";
import { Aviso, CAMPO_FAIXA, FaixaAzul, GRADE_LIMPA, Raiz, usePr } from "@/apps/montagem/pages/producao/visualProd";
import { e, useState } from "@/shared/react";

var n0 = function(v){ return formatarInteiro(v); };
var p2 = function(n){ return (n<10 ? "0" : "")+n; };
var reaisCurto = function(v){ return "R$ "+n0(v); };

function AbaProdPremiacao(){
  var x = usePr(), sMes = useState(hojeSP().slice(0, 7));
  if(!x.admin && !x.leitura) return e(Raiz,null, e(BlocoPainel,{titulo:"Premiação da produção", compacto:true}, e(Aviso,null, "Somente a diretoria acessa.")));
  var ym = sMes[0].split("-").map(Number), pm = premiacaoDoMes(x.pr, ym[0], ym[1]), hoje = hojeSP();
  var ultimo = new Date(Date.UTC(ym[0], ym[1], 0)).getUTCDate(), mesTxt = ym[0]+"-"+p2(ym[1]), dias = [];
  for(var d = 1; d<=ultimo; d++) dias.push(mesTxt+"-"+p2(d));
  var seg = ym[1]===12 ? (ym[0]+1)+"-01" : ym[0]+"-"+p2(ym[1]+1), dataPag = seg+"-"+p2(BONUS_PAGA_DIA);
  var dataBr = dataPag.slice(8)+"/"+dataPag.slice(5, 7)+"/"+dataPag.slice(0, 4);
  var mesFechado = mesTxt<hoje.slice(0, 7);

  // só aparece quem produziu no mês (ou tem ajuste de bônus)
  var pessoas = pm.linhas.filter(function(l){ return l.pecas>0 || l.ajuste; });

  // GRADE: duas linhas por funcionária (Peças e Bônus)
  var linhas = [];
  pessoas.forEach(function(l, i){
    var p = {id:l.nome+"|p", tipo:"Peças", nome:l.nome, total:l.pecas, l:l, par:i%2}, b = {id:l.nome+"|b", tipo:"Bônus", nome:l.nome, total:l.valor, l:l, par:i%2};
    dias.forEach(function(dd){ p["d"+dd] = l.porDia[dd] || 0; b["d"+dd] = l.bonusDia[dd] || 0; });
    linhas.push(p, b);
  });
  // uma cor por faixa (Marcus, 18/11/2026): 300 a 349 amarelo (R$ 15) · 350 a 399 azul (R$ 20) · 400 ou mais verde (R$ 25); vale para as peças E para o bônus do dia
  var corFaixa = function(bonus){ return bonus>=25 ? " font-semibold text-success" : bonus>=20 ? " font-semibold text-[#5BB8FF]" : bonus>=15 ? " font-semibold text-[#E8B84B]" : ""; };
  var cel = function(dd){ return function(v, r){
    var bd = r.l.bonusDia[dd] || 0;
    if(r.tipo==="Peças") return e("span",{className:"tabular-nums"+corFaixa(bd)}, v ? n0(v) : (dd<hoje && diaDaSemana(dd)!=="domingo" ? "—" : ""));
    return e("span",{className:"tabular-nums"+corFaixa(v)}, v>0 ? reaisCurto(v) : (r.l.porDia[dd] ? "R$ 0" : "")); }; };
  var cols = [{k:"nome", t:"Funcionária", w:"9.5rem", fixa:true, render:function(v, r){ return r.tipo==="Peças" ? e("span",{className:"absolute left-0 top-0 z-10 flex h-16 w-full items-center justify-center px-2 font-semibold "+(r.par ? "bg-[#2b3550]" : "bg-[#17181c]")}, v) : ""; }}, {k:"tipo", t:"Linha", w:"4rem"},
    {k:"total", t:"Total", w:"6rem", render:function(v, r){ return e("span",{className:"font-semibold tabular-nums"+(r.tipo==="Bônus" && v>0 ? " text-success" : "")}, r.tipo==="Bônus" ? formatarReais(v) : n0(v)); }}]
    .concat(dias.map(function(dd){ return {k:"d"+dd, t:dd.slice(8), w:"3.4rem", render:cel(dd), corTopo:dd===hoje ? "#5BB8FF" : undefined}; }));
  var totalRodape = function(ls){ return cols.map(function(c, i){
    if(i===0) return "TOTAL · "+pessoas.length;
    if(c.k==="tipo") return "Peças";
    if(c.k==="total") return n0(ls.filter(function(r){ return r.tipo==="Peças"; }).reduce(function(t, r){ return t+r.total; }, 0));
    var s = ls.filter(function(r){ return r.tipo==="Peças"; }).reduce(function(t, r){ return t+(r[c.k] || 0); }, 0);
    return s ? n0(s) : ""; }); };

  // PAGAMENTO por funcionária
  var pagar = pessoas.map(function(l){
    var id = "bonus|"+l.nome+"|"+mesTxt, pago = (x.pr.pagos || {})[id];
    return {id:l.nome, nome:l.nome, f15:l.f15, f20:l.f20, f25:l.f25, bonus:l.valor, data:dataBr, sit:!mesFechado ? "Em andamento" : pago ? "Pago" : "A pagar"};
  }).sort(function(a, b){ return b.bonus-a.bonus || (a.nome<b.nome ? -1 : 1); });
  var colsP = [{k:"nome", t:"Funcionária"}, {k:"f15", t:"Dias de R$ 15,00", fmt:n0}, {k:"f20", t:"Dias de R$ 20,00", fmt:n0}, {k:"f25", t:"Dias de R$ 25,00", fmt:n0},
    {k:"bonus", t:"Bônus do mês", fmt:formatarReais, cor:function(r){ return r.bonus>0 ? "text-success" : ""; }}, {k:"data", t:"Pagamento"},
    {k:"sit", t:"Situação", cor:function(r){ return r.sit==="Pago" ? "text-success" : r.sit==="A pagar" ? "text-warning" : ""; }}];
  var totalP = function(ls){ var s = function(k){ return ls.reduce(function(t, r){ return t+r[k]; }, 0); }; return ["TOTAL · "+ls.length, n0(s("f15")), n0(s("f20")), n0(s("f25")), formatarReais(s("bonus")), "", ""]; };

  // REGRAS
  var maior = BONUS_DIAS[0], meio = BONUS_DIAS[1], menor = BONUS_DIAS[2];
  var regras = [[menor.min+" a "+(meio.min-1)+" peças no dia (amarelo)", formatarReais(menor.valor)], [meio.min+" a "+(maior.min-1)+" peças no dia (azul)", formatarReais(meio.valor)], [maior.min+" peças ou mais no dia (verde)", formatarReais(maior.valor)],
    ["Menos de "+menor.min+" peças no dia", formatarReais(0)], ["Dia com menos de "+DIA_MINIMO+" peças", "Não conta como dia trabalhado"], ["Bônus do mês", "Soma dos dias"], ["Pagamento", "Dia "+BONUS_PAGA_DIA+" do mês seguinte"], ["Produção externa", "Fora do bônus"]];

  return e(Raiz,null,
    e("div",{className:GRADE_LIMPA+" flex flex-col gap-2"},
      e(BlocoPainel,{titulo:"Premiação da produção", dir:pm.rotulo, compacto:true},
        e(FaixaAzul,null,
          e("label",{className:"flex items-center gap-2 text-[13px] font-semibold text-white"}, "Mês", e("input",{type:"month", value:sMes[0], "aria-label":"Mês", onChange:function(ev){ if(ev.target.value) sMes[1](ev.target.value); }, className:CAMPO_FAIXA})),
          e("span",{className:"flex-1"}),
          e("span",{className:"text-[13px] font-semibold text-white"}, "Pagamento em "+dataBr), x.leitura && e("span",{className:"text-[13px] font-semibold text-white"}, "Somente consulta")),
        e(TabelaPlanilha,{key:"grade"+mesTxt, cols:cols, linhas:linhas, chave:"id", grade:true, compacta:true, barraFina:true, semFiltro:true, semContagem:true, semLimpar:true, totalRodape:totalRodape, linhaCls:function(r){ return (r.par ? "[&&>td]:!bg-[#2b3550] " : "")+(r.tipo==="Peças" ? "[&&>td:first-child]:!z-20" : ""); }, vazio:"Nenhuma produção lançada neste mês."})),
      e("div",{className:"grid grid-cols-1 items-start gap-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"},
        e(BlocoPainel,{titulo:"Pagamento do bônus", dir:formatarReais(pagar.reduce(function(t, r){ return t+r.bonus; }, 0)), compacto:true},
          e(TabelaPlanilha,{key:"pag"+mesTxt, cols:colsP, linhas:pagar, chave:"id", grade:true, semContagem:true, semLimpar:true, totalRodape:totalP, vazio:"Nenhuma produção lançada neste mês."})),
        e(BlocoPainel,{titulo:"Regras do bônus", compacto:true},
          e(TabelaPlanilha,{cols:[{k:"r", t:"Regra"}, {k:"v", t:"Valor"}], linhas:regras.map(function(l, i){ return {id:"r"+i, r:l[0], v:l[1]}; }), chave:"id", grade:true, semContagem:true, semLimpar:true, semFiltro:true})))));
}
export { AbaProdPremiacao };
