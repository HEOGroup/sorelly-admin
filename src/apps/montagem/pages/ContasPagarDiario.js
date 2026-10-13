// Sorelly Admin · montagem e bipagem — pages/ContasPagarDiario.js
// Contas a pagar → Diário: a funcionária lança TODO DIA o que foi pago em cada CNPJ (34, 46, 59, 67) e nas contas por fora, mais o faturado e os
// acertos do dia (das notas fiscais). O total do dia e o resultado saem sozinhos. Guarda em s.contasPagasDiario (reducer CPD_SET).
// Quando o mês tem dias lançados, o "Pago" do mês no resto do sistema passa a ser a soma destes dias (contasDoMes em financeiro.js).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { COLUNAS_CONTAS } from "@/apps/montagem/domain/cnpjs";
import { CNPJS_CONTAS_PAGAS, MESES_LONGO, faturadoPorDia, totalDiaCP } from "@/apps/montagem/domain/financeiro";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { KPI } from "@/apps/montagem/ui/card";
import { MONO, MoneyInput, NumInput } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";
import React from "react";

var iso = function(a, m, d){ return a+"-"+String(m+1).padStart(2,"0")+"-"+String(d).padStart(2,"0"); };
var dp = function(k){ return k.split("-").reverse().join("/"); };
var DIA = function(k){ var t = new Date(k+"T12:00:00").toLocaleDateString("pt-BR",{weekday:"long"}); return t.charAt(0).toUpperCase()+t.slice(1).replace("-feira",""); };
var COL = "grid min-w-[62rem] grid-cols-[6rem_5.5rem_repeat(4,minmax(0,1fr))_minmax(0,1fr)_7rem_minmax(0,1fr)_4.5rem_7rem] items-center gap-1.5";

function ContasPagarDiario(){
  var cx = use(), s = cx.state, d = cx.dispatch, hoje = new Date();
  var mm = useState(hoje.getMonth()), mes = mm[0], setMes = mm[1];
  var aa = useState(hoje.getFullYear()), ano = aa[0], setAno = aa[1];
  var dados = s.contasPagasDiario || {};
  var ehAtual = ano===hoje.getFullYear() && mes===hoje.getMonth();
  var ultimoDia = ehAtual ? hoje.getDate() : new Date(ano, mes+1, 0).getDate();
  var dias = []; for(var i=ultimoDia; i>=1; i--) dias.push(iso(ano, mes, i));   // mais novo em cima, como nos relatórios
  // faturado e acertos do dia sobem SOZINHOS do faturamento (acumulado do mês − o que já foi somado nos dias anteriores); dia sem acumulado fica digitável
  var autoDia = ehAtual ? faturadoPorDia(s, ano, mes) : {};
  var linha = function(k){ var x = dados[k] || {}, au = autoDia[k] && autoDia[k].auto ? autoDia[k] : null, tot = totalDiaCP(x), fat = au ? au.faturado : (x.faturado||0), ac = au ? au.acertos : (x.acertos||0); return {k:k, x:x, tot:tot, fat:fat, ac:ac, auto:!!au, parcial:!!(au && au.parcial), res:fat-tot}; };
  var L = dias.map(linha);
  var soma = function(f){ return L.reduce(function(t,l){ return t+f(l); },0); };
  var totCnpj = {}; CNPJS_CONTAS_PAGAS.forEach(function(c){ totCnpj[c] = soma(function(l){ return (l.x.cnpjs||{})[c]||0; }); });
  var totFora = soma(function(l){ return l.x.contasPorFora||0; }), totPago = soma(function(l){ return l.tot; }), totFat = soma(function(l){ return l.fat; }), totAc = soma(function(l){ return l.ac; });
  var lancados = L.filter(function(l){ return l.tot>0 || l.fat>0 || (l.x.acertos||0)>0; }).length;
  var vaiMes = function(dl){ var n = new Date(ano, mes+dl, 1); setMes(n.getMonth()); setAno(n.getFullYear()); };
  var setCnpj = function(k, c, v){ d({type:"CPD_SET", data:k, cnpj:c, valor:v}); }, setCampo = function(k, campo, v){ d({type:"CPD_SET", data:k, campo:campo, valor:v}); };
  // mesmo resumo que o Marcus recebe por texto (copiar e colar), do dia mais novo ao mais antigo
  var copiar = function(){
    var r = function(v){ return v>0 ? BK(v) : "—"; }, linhas = ["📊 CONTAS A PAGAR X FATURAMENTO", "PERÍODO: 01/"+String(mes+1).padStart(2,"0")+"/"+ano+" A "+dp(dias[0]), ""];
    L.forEach(function(l){ var c = l.x.cnpjs||{};
      linhas.push("📅 "+dp(l.k)+" — "+DIA(l.k).toUpperCase());
      CNPJS_CONTAS_PAGAS.forEach(function(k){ linhas.push("CNPJ "+k+": "+r(c[k]||0)); });
      linhas.push("CONTAS POR FORA: "+r(l.x.contasPorFora||0), "TOTAL: "+BK(l.tot), "FATURADO: "+BK(l.fat), ""); });
    linhas.push("📊 TOTAL DO PERÍODO"); CNPJS_CONTAS_PAGAS.forEach(function(k){ linhas.push("CNPJ "+k+": "+BK(totCnpj[k])); });
    linhas.push("CONTAS POR FORA: "+BK(totFora), "", "🔴 TOTAL A PAGAR: "+BK(totPago), "🟢 TOTAL FATURADO: "+BK(totFat), "🔴 DIFERENÇA: "+(totFat-totPago<0?"-":"")+BK(Math.abs(totFat-totPago)));
    try { navigator.clipboard.writeText(linhas.join("\n")); d({type:"AVISO", txt:"Resumo copiado"}); } catch(err){}
  };
  var cab = function(t, i){ return e("span",{key:i, className:"text-center text-[10.5px] font-semibold uppercase leading-tight tracking-wide text-white/70"}, t); };
  var verde = totFat-totPago>=0 ? "text-success" : "text-destructive";
  return e(React.Fragment,null,
    e("div",{className:"flex flex-wrap items-center justify-between gap-2"},
      e("div",{className:"flex items-center gap-1"},
        e(Btn,{v:"ghost", sm:true, ic:"chevron", onClick:function(){ vaiMes(-1); }},""),
        e("span",{className:"grid h-9 min-w-[9rem] place-items-center rounded-lg border border-primary/40 bg-primary/10 px-3 text-sm font-bold"}, MESES_LONGO[mes]+" "+ano),
        e(Btn,{v:"ghost", sm:true, ic:"chevrondown", onClick:function(){ vaiMes(1); }},"")),
      e("span",{className:"rounded-lg bg-black/20 px-3 py-1.5 text-[12px]"}, e("b",null,lancados), " dias lançados · ", e("b",null,L.length-lancados), " sem lançamento"),
      e(Btn,{v:"secondary", sm:true, ic:"check", onClick:copiar}, "Copiar resumo em texto")),
    e("div",{className:"grid grid-cols-2 gap-2 md:grid-cols-4"},
      e(KPI,{compacto:true, l:"Pago no período", v:BK(totPago), tom:"text-destructive"}),
      e(KPI,{compacto:true, l:"Faturado no período", v:BK(totFat), tom:"text-success", sub:totAc+" acertos"}),
      e(KPI,{compacto:true, l:"Diferença (fat. − pago)", v:(totFat-totPago<0?"−":"")+BK(Math.abs(totFat-totPago)), tom:verde}),
      e(KPI,{compacto:true, l:"Contas por fora", v:BK(totFora), sub:"fora dos 4 CNPJs"})),
    e(BlocoBarra,{cor:"azul", t:"Pago e falta pagar por CNPJ", sub:"quanto já saiu de cada empresa neste mês e quanto ainda falta — é o que precisa enviar de dinheiro (previsto do mês vem de Contas a pagar → Por CNPJ)"},
      e("div",{className:"grid grid-cols-2 gap-2 p-2 md:grid-cols-3 xl:grid-cols-6"}, COLUNAS_CONTAS.map(function(c){
        var id = c[0], previsto = (((s.contasCnpj||{})[String(ano)]||{})[id]||{})[mes]||0, pago = id==="sem" ? totFora : (totCnpj[id]||0), falta = Math.max(0, previsto-pago);
        return e("div",{key:id, className:"flex flex-col gap-0.5 rounded-xl border border-border bg-black/25 px-3 py-2 text-[12px]"},
          e("b",{className:"text-[11px] uppercase tracking-wide text-white/70"}, c[1]),
          e("span",{className:"flex justify-between"}, "Previsto", e("b",{className:MONO}, BK(previsto))),
          e("span",{className:"flex justify-between"}, "Pago", e("b",{className:MONO+" text-success"}, BK(pago))),
          e("span",{className:"flex justify-between border-t border-border pt-0.5"}, "Falta enviar", e("b",{className:MONO+" "+(falta>0 ? "text-destructive" : "text-success")}, BK(falta)))); }))),
    e(BlocoBarra,{t:"Contas a pagar diário", sub:"lance todo dia o pago em cada CNPJ, nas contas por fora e o faturado do dia · o total e o resultado saem sozinhos"},
      e("div",{className:"flex flex-col gap-1.5 overflow-x-auto p-3"},
        e("div",{className:COL+" px-2"}, ["Data","Dia"].concat(CNPJS_CONTAS_PAGAS.map(function(c){ return "CNPJ "+c; })).concat(["Contas por fora","Total pago","Faturado","Acertos","Resultado"]).map(cab)),
        L.map(function(l){
          var vazio = !(l.tot>0 || l.fat>0 || l.ac>0), fds = new Date(l.k+"T12:00:00").getDay()%6===0;
          return e("div",{key:l.k, className:COL+" rounded-lg border px-2 py-1 "+(l.k===iso(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()) ? "border-warning/60 bg-warning/5" : "border-border bg-card")+(vazio && fds ? " opacity-60" : "")},
            e("b",{className:MONO+" text-center text-[12.5px]"}, dp(l.k).slice(0,5)),
            e("span",{className:"text-center text-[12px] text-white/80"}, DIA(l.k)),
            CNPJS_CONTAS_PAGAS.map(function(c){ return e(MoneyInput,{key:c, value:(l.x.cnpjs||{})[c]||0, sm:true, className:"w-full", label:dp(l.k)+" CNPJ "+c, onChange:function(v){ setCnpj(l.k, c, v); }}); }),
            e(MoneyInput,{value:l.x.contasPorFora||0, sm:true, className:"w-full", label:dp(l.k)+" contas por fora", onChange:function(v){ setCampo(l.k, "contasPorFora", v); }}),
            e("b",{className:MONO+" text-center text-[12.5px] "+(l.tot>0 ? "text-destructive" : "text-muted-foreground")}, BK(l.tot)),
            l.auto ? e("b",{className:MONO+" text-center text-[12.5px] text-success", title:"Sobe sozinho do faturamento"+(l.parcial ? " (hoje, ainda provisório)" : "")}, BK(l.fat)+(l.parcial ? " …" : "")) : e(MoneyInput,{value:l.fat, sm:true, className:"w-full", label:dp(l.k)+" faturado", onChange:function(v){ setCampo(l.k, "faturado", v); }}),
            l.auto ? e("b",{className:MONO+" text-center text-[12.5px]"}, l.ac) : e(NumInput,{value:l.ac, onChange:function(v){ setCampo(l.k, "acertos", v); }, className:"w-full! text-center!"}),
            e("b",{className:MONO+" text-center text-[12.5px] "+(l.res<0 ? "text-destructive" : l.res>0 ? "text-success" : "text-muted-foreground")}, (l.res<0?"−":"")+BK(Math.abs(l.res)))); }),
        e("div",{className:COL+" rounded-lg bg-black/25 px-2 py-1.5 text-center text-[12.5px] font-bold"},
          e("span",{className:"text-left"},"Total"), e("span"),
          CNPJS_CONTAS_PAGAS.map(function(c){ return e("span",{key:c, className:MONO}, BK(totCnpj[c])); }),
          e("span",{className:MONO}, BK(totFora)), e("span",{className:MONO+" text-destructive"}, BK(totPago)), e("span",{className:MONO+" text-success"}, BK(totFat)),
          e("span",{className:MONO}, totAc), e("span",{className:MONO+" "+verde}, (totFat-totPago<0?"−":"")+BK(Math.abs(totFat-totPago)))))));
}

export { ContasPagarDiario };
