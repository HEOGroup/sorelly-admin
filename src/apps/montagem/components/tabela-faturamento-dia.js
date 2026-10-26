// Sorelly Admin · montagem — components/tabela-faturamento-dia.js
// Aba "Dia a dia" da tela Faturamento: faturamento e contas pagas de CADA DIA do mês, SÓ RESULTADO (sem previsão), do dia 1 até o último dia lançado.
// Três visões no segmentado: Faturamento · Contas a pagar · Faturamento vs Contas a pagar (saldo do dia e acumulado, com os dias de déficit marcados).
// Valor do dia = acumulado do dia − acumulado do dia anterior. Fim de semana e feriado sem registro ficam em zero. Mês só com o fechamento mostra um aviso.
// Peças do padrão do Financeiro (components/padrao-fin.js): R$ em todo valor, números à direita, linhas de 32 px, texto que corta com "…".
import { Segmentado, TabelaP, Td, Tr, COR, corSinal, brl } from "@/apps/montagem/components/padrao-fin";
import { fatEfetivo } from "@/apps/montagem/domain/financeiro";
import { BKC } from "@/apps/montagem/lib/format";
import { e, useState } from "@/shared/react";

var SEMANA = ["dom","seg","ter","qua","qui","sex","sáb"];
var p2 = function(n){ return String(n).padStart(2,"0"); };
var n0 = function(v){ return Math.round(v).toLocaleString("pt-BR"); };
var med = function(r, a){ return a>0 ? BKC(r/a) : "—"; };
var r2 = function(v){ return Math.round(v*100)/100; };
var ymd = function(a, m, d){ return a+"-"+p2(m+1)+"-"+p2(d); };

// monta as linhas do mês (ano, mes 0-11) a partir do acumulado; null se o mês não tem dia a dia (só o fechamento)
function montar(s, ano, mes){
  var fd = fatEfetivo(s), dias = new Date(ano, mes+1, 0).getDate(), regs = [];
  for(var d=1; d<=dias; d++){ if(fd[ymd(ano, mes, d)]) regs.push(d); }
  if(regs.length<3) return null;
  var ult = regs[regs.length-1], cpd = s.contasPagasDiario || {};
  var pagoReal = function(iso){ var x = cpd[iso]; if(!x) return 0; return r2(Object.keys(x.cnpjs||{}).reduce(function(t, k){ return t+(x.cnpjs[k]||0); }, 0)+(x.contasPorFora||0)); };
  var linhas = [], cumR = 0, cumA = 0;
  for(var dia=1; dia<=ult; dia++){
    var iso = ymd(ano, mes, dia), x = fd[iso], tem = x && x.recebido!==undefined;
    var rr = tem ? (x.recebido||0) : cumR, aa = tem ? (x.acertos||0) : cumA, parcial = !!(x && x.parcial);
    var dr = r2(Math.max(0, rr-cumR)), da = Math.max(0, aa-cumA); cumR = Math.max(cumR, rr); cumA = Math.max(cumA, aa);
    var pago = pagoReal(iso);
    linhas.push({car:(s.carregarDia||{})[iso], dia:dia, sem:SEMANA[new Date(ano, mes, dia).getDay()], parcial:parcial, da:da, dr:dr, a:cumA, r:cumR, contas:pago});
  }
  return {linhas:linhas, ult:ult};
}

var VISOES = [["fat","Faturamento"],["contas","Contas a pagar"],["vs","Faturamento vs Contas a pagar"]];

function DiaADia(p){
  var sv = useState("vs"), visao = sv[0], setVisao = sv[1];
  var dados = montar(p.s, p.ano, p.mes);
  var dd = function(l){ return p2(l.dia)+"/"+p2(p.mes+1)+" · "+l.sem+(l.parcial ? " · hoje" : ""); };
  var corpo, resumo = null;
  if(!dados) corpo = e("p",{className:"rounded-lg border border-border px-4 py-6 text-center text-[13px] text-foreground"}, "Este mês só tem o fechamento (total do mês), sem o dia a dia.");
  else {
    var L = dados.linhas, fim = L[L.length-1], tot = {dr:0, contas:0}; L.forEach(function(l){ tot.dr = r2(tot.dr+l.dr); tot.contas = r2(tot.contas+l.contas); });
    var ultCar = null; L.forEach(function(l){ if(l.car!=null) ultCar = l.car; });
    var tabela;
    if(visao==="fat"){
      tabela = e(TabelaP,{minW:720, cols:[{t:"Dia", w:130},{t:"Acertos no dia", n:true, w:110},{t:"Faturamento", n:true, w:140},{t:"Média do dia", n:true, w:130},{t:"Acertos acumulados", n:true, w:130},{t:"Faturamento acumulado", n:true, w:150},{t:"Média geral", n:true, w:130},{t:"Carregar", n:true, w:100}]},
        L.map(function(l){ return e(Tr,{key:l.dia, apagado:l.da===0 && l.dr===0}, e(Td,null, dd(l)), e(Td,{n:true}, n0(l.da)), e(Td,{n:true, cor:l.dr>0 ? COR.entra : ""}, BKC(l.dr)), e(Td,{n:true}, med(l.dr, l.da)), e(Td,{n:true}, n0(l.a)), e(Td,{n:true, cor:COR.entra}, BKC(l.r)), e(Td,{n:true, forte:true}, med(l.r, l.a)), e(Td,{n:true, cor:l.car ? COR.entra : ""}, l.car!=null ? n0(l.car) : "—")); }),
        e(Tr,{key:"t", total:true}, e(Td,null, "Total do mês"), e(Td,{n:true}, n0(fim.a)), e(Td,{n:true, cor:COR.entra}, BKC(fim.r)), e(Td,{n:true}, med(fim.r, fim.a)), e(Td,{n:true}, n0(fim.a)), e(Td,{n:true, cor:COR.entra}, BKC(fim.r)), e(Td,{n:true}, med(fim.r, fim.a)), e(Td,{n:true}, ultCar!=null ? n0(ultCar) : "—")));
    } else if(visao==="contas"){
      var ac = 0;
      tabela = e(TabelaP,{minW:480, cols:[{t:"Dia", w:130},{t:"Contas pagas", n:true, w:150},{t:"Acumulado", n:true, w:150}]},
        L.map(function(l){ ac = r2(ac+l.contas); return e(Tr,{key:l.dia, apagado:l.contas===0}, e(Td,null, dd(l)), e(Td,{n:true, cor:l.contas>0 ? COR.sai : ""}, BKC(l.contas)), e(Td,{n:true, cor:ac>0 ? COR.sai : ""}, BKC(ac))); }),
        e(Tr,{key:"t", total:true}, e(Td,null, "Total do mês"), e(Td,{n:true, cor:COR.sai}, BKC(tot.contas)), e(Td,{n:true, cor:COR.sai}, BKC(tot.contas))));
    } else {
      var sa = 0, pior = null;
      var linhasVs = L.map(function(l){ var sd = r2(l.dr-l.contas); sa = r2(sa+sd); if(l.contas>0 && (!pior || sd<pior.sd)) pior = {l:l, sd:sd};
        return e(Tr,{key:l.dia, alerta:sd<0, apagado:l.dr===0 && l.contas===0}, e(Td,null, dd(l)), e(Td,{n:true}, n0(l.da)), e(Td,{n:true}, med(l.dr, l.da)), e(Td,{n:true, cor:l.dr>0 ? COR.entra : ""}, BKC(l.dr)), e(Td,{n:true, cor:l.contas>0 ? COR.sai : ""}, BKC(l.contas)), e(Td,{n:true, cor:corSinal(sd)}, brl(sd)), e(Td,{n:true, forte:true, cor:corSinal(sa)}, brl(sa)), e(Td,{n:true}, l.car!=null ? n0(l.car) : "—")); });
      tabela = e(TabelaP,{minW:800, cols:[{t:"Dia", w:130},{t:"Acertos", n:true, w:90},{t:"Média", n:true, w:110},{t:"Faturamento", n:true, w:150},{t:"Contas pagas", n:true, w:150},{t:"Saldo do dia", n:true, w:150},{t:"Saldo acumulado", n:true, w:160},{t:"Carregar", n:true, w:100}]},
        linhasVs, e(Tr,{key:"t", total:true}, e(Td,null, "Total do mês"), e(Td,{n:true}, n0(fim.a)), e(Td,{n:true}, med(fim.r, fim.a)), e(Td,{n:true, cor:COR.entra}, BKC(tot.dr)), e(Td,{n:true, cor:COR.sai}, BKC(tot.contas)), e(Td,{n:true, cor:corSinal(r2(tot.dr-tot.contas))}, brl(r2(tot.dr-tot.contas))), e(Td,{n:true, cor:corSinal(sa)}, brl(sa)), e(Td,{n:true}, ultCar!=null ? n0(ultCar) : "—")));
      resumo = pior ? e("p",{className:"text-[13px] text-foreground"}, "Maior déficit: "+p2(pior.l.dia)+"/"+p2(p.mes+1)+" · ", e("b",{className:""+COR.sai}, brl(pior.sd))) : null;
    }
    corpo = e("div",{className:"flex flex-col gap-2"}, tabela);
  }
  return e("div",{className:"flex flex-col gap-2"},
    e("div",{className:"flex flex-wrap items-center justify-between gap-2"}, e(Segmentado,{opcoes:VISOES, atual:visao, onMudar:setVisao}), resumo),
    corpo);
}

export { DiaADia, montar };
