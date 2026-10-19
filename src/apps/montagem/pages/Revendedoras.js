// Sorelly Admin · montagem — pages/Revendedoras.js
// Cadastro de revendedoras → Revendedoras. O histórico da vida da empresa, dia a dia desde 04/07/2023: quanto tínhamos, quanto subiu ou caiu em cada dia,
// por período, mês a mês, com gráfico, mensagem para copiar e planilha. Aqui NÃO se preenche nada (o lançamento do dia fica na Visão geral).
// Limite do dado: o sistema guarda só o TOTAL de cada dia; "entraram" e "saíram" são o aumento e a queda líquidos do dia (entrou 10 e saíram 4 no mesmo dia aparece +6).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { GraficoColunasRevendedoras } from "@/apps/montagem/components/grafico-revendedoras";
import { MESES_LONGO, completarDias, isoLocal, pontosRevendedoras } from "@/apps/montagem/domain/financeiro";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { TabelaRevendedorasMeses } from "@/apps/montagem/pages/VisaoGeral";
import { e, useState } from "@/shared/react";
import React from "react";

var PERIODOS = [{k:"7", lb:"7 dias", dias:7}, {k:"15", lb:"15 dias", dias:15}, {k:"30", lb:"30 dias", dias:30}, {k:"60", lb:"60 dias", dias:60}, {k:"90", lb:"90 dias", dias:90},
  {k:"mes", lb:"Mês atual"}, {k:"ano", lb:"Ano atual"}, {k:"tudo", lb:"Tudo desde 2023"}, {k:"livre", lb:"Escolher datas"}];
var SEMANA = ["dom","seg","ter","qua","qui","sex","sáb"];
var num = function(v){ return v===null || v===undefined ? "—" : Math.round(v).toLocaleString("pt-BR"); };
var sinal = function(v){ return v===null || v===undefined ? "—" : (v>0 ? "+" : v<0 ? "−" : "")+Math.abs(Math.round(v)).toLocaleString("pt-BR"); };
var pct1 = function(v){ return v===null || v===undefined || !isFinite(v) ? "—" : (v>0 ? "+" : v<0 ? "−" : "")+Math.abs(v).toFixed(1).replace(".",",")+"%"; };
var br = function(iso){ return iso ? iso.split("-").reverse().join("/") : "—"; };
var cor = function(v){ return v>0 ? "text-success" : v<0 ? "text-destructive" : "text-muted-foreground"; };
function copiar(txt){ try { navigator.clipboard.writeText(txt); } catch(err){ /* sem permissão: o texto continua na caixa para copiar à mão */ } }
function baixar(nome, texto){ var blob = new Blob(["﻿"+texto], {type:"text/csv;charset=utf-8"}), a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1500); }
var csvLinha = function(cols){ return cols.map(function(c){ return String(c===null || c===undefined ? "" : c).replace(/;/g, ","); }).join(";"); };

// linhas do período, uma por dia (dias sem lançamento repetem o último valor, com variação zero)
function linhasDe(s, de, ate){
  var cheio = completarDias(s.revendedorasDiario || {}), lancados = s.revendedorasDiario || {}, ks = Object.keys(cheio).sort(), out = [];
  ks.forEach(function(k, i){ if(k<de || k>ate) return; var ant = i>0 ? cheio[ks[i-1]] : null, delta = ant===null ? null : cheio[k]-ant, dt = new Date(k+"T12:00:00");
    out.push({data:k, sem:SEMANA[dt.getDay()], total:cheio[k], delta:delta, entrou:delta>0 ? delta : 0, saiu:delta<0 ? -delta : 0, lancado:lancados[k]!==undefined}); });
  return out;
}

function AbaRevendedoras(){
  var cx = use(), s = cx.state, hojeIso = isoLocal(new Date()), ano = new Date().getFullYear();
  var pr = useState("30"), per = pr[0], setPer = pr[1], dd = useState(""), deLivre = dd[0], setDeLivre = dd[1], aa = useState(""), ateLivre = aa[0], setAteLivre = aa[1];
  var an = useState(ano), anoMes = an[0], setAnoMes = an[1], ms = useState(false), msgAberta = ms[0], setMsgAberta = ms[1], cp = useState(false), copiado = cp[0], setCopiado = cp[1];
  var cheio = completarDias(s.revendedorasDiario || {}), ks = Object.keys(cheio).sort(), primeira = ks[0] || hojeIso, ultima = ks[ks.length-1] || hojeIso;
  var p = PERIODOS.find(function(x){ return x.k===per; });
  var de, ate = ultima;
  if(p.dias) de = ks[Math.max(0, ks.length-p.dias)];
  else if(per==="mes") de = hojeIso.slice(0,7)+"-01";
  else if(per==="ano") de = ano+"-01-01";
  else if(per==="tudo") de = primeira;
  else { de = deLivre || primeira; ate = ateLivre || ultima; }
  if(de>ate){ var t = de; de = ate; ate = t; }
  var linhas = linhasDe(s, de, ate), n = linhas.length;
  var ini = n ? (linhas[0].total - (linhas[0].delta||0)) : null, fim = n ? linhas[n-1].total : null;   // "começou com" = total no fim do dia anterior ao período
  var entraram = linhas.reduce(function(t,l){ return t+l.entrou; }, 0), sairam = linhas.reduce(function(t,l){ return t+l.saiu; }, 0), saldo = n ? fim-ini : null;
  var melhor = linhas.reduce(function(m,l){ return !m || l.entrou>m.entrou ? l : m; }, null), pior = linhas.reduce(function(m,l){ return !m || l.saiu>m.saiu ? l : m; }, null);
  var media = n>0 ? saldo/n : null;
  var rotulo = br(de)+" a "+br(ate)+" ("+n+(n===1 ? " dia" : " dias")+")";
  var mensagem = "Revendedoras · "+br(hojeIso)+"\nTotal hoje: "+num(cheio[ultima])+"\nPeríodo: "+rotulo+"\nComeçou com "+num(ini)+" e terminou com "+num(fim)+" ("+sinal(saldo)+(ini ? ", "+pct1(saldo/ini*100) : "")+")\nEntraram: "+sinal(entraram).replace("−","")+" · Saíram: "+(sairam ? "−"+num(sairam) : "0")+" (por dia, líquido)\nMédia: "+(media===null ? "—" : (media>0 ? "+" : "")+media.toFixed(1).replace(".",","))+" por dia";
  var baixarPeriodo = function(){ baixar("revendedoras-"+de+"-a-"+ate+".csv", [csvLinha(["Data","Dia","Total de revendedoras","Entraram (aumento do dia)","Saíram (queda do dia)","Variação do dia","Lançado no sistema"])].concat(linhas.map(function(l){ return csvLinha([br(l.data), l.sem, l.total, l.entrou, l.saiu, l.delta===null ? "" : l.delta, l.lancado ? "sim" : "repetiu o último"]); })).join("\r\n")); };
  var baixarTudo = function(){ var todas = linhasDe(s, primeira, ultima); baixar("revendedoras-historico-completo.csv", [csvLinha(["Data","Dia","Total de revendedoras","Entraram (aumento do dia)","Saíram (queda do dia)","Variação do dia","Lançado no sistema"])].concat(todas.map(function(l){ return csvLinha([br(l.data), l.sem, l.total, l.entrou, l.saiu, l.delta===null ? "" : l.delta, l.lancado ? "sim" : "repetiu o último"]); })).join("\r\n")); };
  var tile = function(rot, v, c, nota){ return e("div",{key:rot, className:"flex flex-col items-center rounded-xl bg-card px-3 py-2 text-center ring-1 ring-[#E8B84B]/30"},
    e("span",{className:"text-[10.5px] font-bold uppercase tracking-[.12em] text-muted-foreground"}, rot), e("b",{className:MONO+" text-[22px] leading-tight "+(c||"")}, v), nota && e("span",{className:"text-[11px] text-muted-foreground"}, nota)); };
  var th = function(t){ return e("th",{key:t, className:"sticky top-0 border-b border-r border-border bg-sidebar px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide last:border-r-0"}, t); };
  var td = function(v, c){ return e("td",{className:"border-r border-border/60 px-2 py-1.5 text-center text-[13px] last:border-r-0 "+(c||"")}, v); };
  var anos = []; for(var y=+primeira.slice(0,4); y<=ano; y++) anos.push(y);
  var serie = linhas.map(function(l){ return {data:l.data, v:l.total, tipo:"real"}; });
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Base de revendedoras", sub:"O histórico dia a dia desde "+br(primeira)+": quanto tínhamos, quanto entrou e saiu, por período. Aqui não se preenche nada."}),
    // período + ações
    e("section",{className:"flex flex-col gap-2 rounded-xl border border-[#E8B84B]/40 bg-card p-3"},
      e("div",{className:"flex flex-wrap items-center gap-1.5"},
        PERIODOS.map(function(x){ return e("button",{key:x.k, type:"button", onClick:function(){ setPer(x.k); }, className:"rounded-lg px-2.5 py-1 text-[12px] font-semibold ring-1 "+(per===x.k ? "bg-primary/15 ring-2 ring-primary" : "bg-card ring-border hover:bg-muted/40")}, x.lb); }),
        per==="livre" && e(React.Fragment,null,
          e("input",{type:"date", value:deLivre||de, min:primeira, max:ultima, "aria-label":"De", className:INPUT+" h-8! w-36 text-[13px]!", onChange:function(ev){ setDeLivre(ev.target.value); }}), e("span",{className:"text-[12px] text-muted-foreground"},"até"),
          e("input",{type:"date", value:ateLivre||ate, min:primeira, max:ultima, "aria-label":"Até", className:INPUT+" h-8! w-36 text-[13px]!", onChange:function(ev){ setAteLivre(ev.target.value); }}))),
      e("div",{className:"flex flex-wrap items-center gap-1.5"},
        e("span",{className:"mr-1 text-[12px] text-muted-foreground"}, rotulo),
        e("span",{className:"ml-auto flex flex-wrap gap-1.5"},
          e(Btn,{v:"secondary", sm:true, ic:"copiar", onClick:function(){ setMsgAberta(!msgAberta); setCopiado(false); }}, "Mensagem para copiar"),
          e(Btn,{v:"secondary", sm:true, ic:"save", onClick:baixarPeriodo}, "Planilha do período"),
          e(Btn,{v:"ghost", sm:true, ic:"save", onClick:baixarTudo}, "Backup de tudo"))),
      msgAberta && e("div",{className:"flex flex-col gap-2"},
        e("textarea",{readOnly:true, value:mensagem, rows:7, className:INPUT+" h-auto! py-2 text-[13px]!"}),
        e("div",{className:"flex gap-2"}, e(Btn,{v:"primary", sm:true, onClick:function(){ copiar(mensagem); setCopiado(true); }}, copiado ? "✓ Copiado" : "Copiar mensagem")))),
    // números do período
    e("div",{className:"grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8"},
      tile("Total hoje", num(cheio[ultima]), "text-primary", "em "+br(ultima)),
      tile("Começou com", num(ini)), tile("Terminou com", num(fim)),
      tile("Saldo", sinal(saldo), cor(saldo), ini ? pct1(saldo/ini*100) : null),
      tile("Entraram", entraram ? "+"+num(entraram) : "0", "text-success", "soma dos aumentos"),
      tile("Saíram", sairam ? "−"+num(sairam) : "0", "text-destructive", "soma das quedas"),
      tile("Média por dia", media===null ? "—" : (media>0 ? "+" : "")+media.toFixed(1).replace(".",","), cor(media)),
      tile("Melhor dia", melhor && melhor.entrou ? "+"+num(melhor.entrou) : "—", "text-success", melhor && melhor.entrou ? br(melhor.data) : null)),
    pior && pior.saiu>0 && e("p",{className:"-mt-2 text-[12px] text-muted-foreground"}, "Pior dia do período: "+br(pior.data)+" (−"+num(pior.saiu)+")."),
    // gráfico
    e(BlocoBarra,{cor:"ouro", t:"Crescimento de revendedoras", sub:rotulo+" · clique em Expandir para tela cheia, com zoom"},
      e("div",{className:"p-2"}, serie.length ? e(GraficoColunasRevendedoras,{pontos:serie, opcoes:undefined}) : e("p",{className:"p-4 text-center text-[13px] text-muted-foreground"}, "Sem dados neste período."))),
    // mês a mês
    e("div",{className:"flex items-center gap-2"}, e("label",{className:"text-[12.5px] font-semibold"}, "Mês a mês de"),
      e("select",{value:anoMes, "aria-label":"Ano", className:INPUT+" h-8! w-24 text-[13px]!", onChange:function(ev){ setAnoMes(+ev.target.value); }}, anos.map(function(y){ return e("option",{key:y, value:y}, y); }))),
    e(TabelaRevendedorasMeses,{s:s, ano:anoMes}),
    // dia a dia
    e(BlocoBarra,{cor:"ouro", t:"Dia a dia", sub:"do mais novo para o mais antigo · "+n+" dias no período · dias sem lançamento repetem o último valor"},
      e("div",{className:"max-h-[32rem] overflow-auto p-2"},
        e("table",{className:"w-full border-collapse"},
          e("thead",null, e("tr",null, ["Data","Dia","Total","Entraram","Saíram","Variação","%"].map(th))),
          e("tbody",null, linhas.slice().reverse().map(function(l){ var ant = l.total-(l.delta||0);
            return e("tr",{key:l.data, className:"border-b border-border/50 "+(l.lancado ? "" : "opacity-60")},
              td(br(l.data), MONO), td(l.sem, "text-muted-foreground"), td(num(l.total), MONO+" font-semibold"),
              td(l.entrou ? "+"+num(l.entrou) : "—", MONO+" text-success"), td(l.saiu ? "−"+num(l.saiu) : "—", MONO+" text-destructive"),
              td(sinal(l.delta), MONO+" font-bold "+cor(l.delta)), td(l.delta ? pct1(l.delta/ant*100) : "—", MONO+" "+cor(l.delta))); }))))),
    e("p",{className:"text-[12px] text-muted-foreground"}, "Entraram e Saíram vêm do total de cada dia: é o aumento ou a queda líquida. Para saber quantas entraram e quantas saíram de verdade, é preciso ligar o cadastro (aprovações e cancelamentos)."));
}
export { AbaRevendedoras };
