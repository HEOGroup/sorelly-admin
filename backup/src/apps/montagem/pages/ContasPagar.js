// Sorelly Admin · montagem e bipagem — pages/ContasPagar.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { ContasPagarDiario } from "@/apps/montagem/pages/ContasPagarDiario";
import { COLUNAS_CONTAS } from "@/apps/montagem/domain/cnpjs";
import { MESES_LONGO } from "@/apps/montagem/domain/financeiro";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { badge } from "@/apps/montagem/ui/badge";
import { Btn } from "@/apps/montagem/ui/button";
import { KPI, Vazio } from "@/apps/montagem/ui/card";
import { MONO, MoneyInput } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

// ── Contas a pagar: lançamento manual por mês (só Pago e A pagar; o Total é sempre calculado). Visão Total (consolidada) e Por CNPJ (pendente). ──
function LinhaMes(p){
  var cx = use(), d = cx.dispatch, i = p.i, m = p.m, atual = p.atual, ano = p.ano;
  var total = (m.pago||0) + (m.apagar||0);
  var passado = i < p.mesAtualIdx;
  var cor = atual ? "border-warning/60 bg-warning/5" : passado && m.apagar>0 ? "border-destructive/40 bg-destructive/5" : passado ? "border-success/30 bg-success/5" : "border-border bg-card";
  var money = function(campo, v){ return e(MoneyInput,{value:v, disabled:m.fixado, sm:true, className:"w-full", "aria-label":MESES_LONGO[i]+" "+campo,
    onChange:function(x){ d({type:"CP_SET", ano:ano, mes:i, campo:campo, valor:x}); }}); };
  return e("div",{className:"grid grid-cols-[9rem_1fr_1fr_1fr_5.5rem] items-center gap-2.5 rounded-xl border px-3 py-2 "+cor},
    e("span",{className:"flex items-center gap-1.5 truncate text-[13.5px] font-semibold"}, MESES_LONGO[i],
      atual && badge("atual","warning"), m.fixado && badge("fixado","muted","lock")),
    money("pago", m.pago||0), money("apagar", m.apagar||0),
    e("b",{className:MONO+" text-center text-[13.5px] "+(total>0?"text-primary":"text-muted-foreground")}, BK(total)),
    e(Btn,{v:"ghost", sm:true, ic: m.fixado?"unlock":"lock", onClick:function(){ d({type:"CP_FIXAR", ano:ano, mes:i}); }}, m.fixado?"Reabrir":"Fixar"));
}
function AbaContasPagar(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var hoje = new Date();
  var an = useState(hoje.getFullYear()), ano = an[0], setAno = an[1];
  var anoStr = String(ano);
  var dados = (s.contasPagar && s.contasPagar[anoStr]) || {};
  var mesAtualIdx = ano===hoje.getFullYear() ? hoje.getMonth() : -1;
  var linha = function(i){ return Object.assign({pago:0, apagar:0, fixado:false}, dados[i]); };
  var meses = [0,1,2,3,4,5,6,7,8,9,10,11].map(linha);
  var totPago = meses.reduce(function(t,m){return t+(m.pago||0);},0), totAPagar = meses.reduce(function(t,m){return t+(m.apagar||0);},0);
  var mesesComPago = meses.filter(function(m){return m.pago>0;}).length;
  var ab = useState({cnpj:false, geral:false}), abrir = ab[0], setAbrir = ab[1];
  return e(React.Fragment,null,
    e(PageHead,{t:"Contas a pagar", sub:"Lance todo dia o que foi pago em cada CNPJ. O previsto por CNPJ e o geral de cada mês abrem nos botões."},
      e("div",{className:"flex items-center gap-1"},
        e(Btn,{v:"ghost", sm:true, ic:"chevron", onClick:function(){setAno(ano-1);}},""),
        e("span",{className:"grid h-9 min-w-[4.5rem] place-items-center rounded-lg border border-primary/40 bg-primary/10 px-3 text-sm font-bold"}, ano),
        e(Btn,{v:"ghost", sm:true, ic:"chevrondown", onClick:function(){setAno(ano+1);}},""))),
    // um só lugar: o Diário (contas pagas por dia, com os CNPJs) fica sempre aberto; os botões abrem "Por CNPJ" e o "Geral" por mês
    e(ContasPagarDiario,null),
    e("div",{className:"flex flex-wrap gap-2"},
      e("button",{onClick:function(){ setAbrir(Object.assign({}, abrir, {cnpj:!abrir.cnpj})); }, "aria-expanded":abrir.cnpj, className:"rounded-lg px-3.5 py-2 text-[13px] font-semibold ring-1 "+(abrir.cnpj ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-border hover:bg-muted/40")}, (abrir.cnpj ? "▾ " : "▸ ")+"Por CNPJ (previsto de cada mês)"),
      e("button",{onClick:function(){ setAbrir(Object.assign({}, abrir, {geral:!abrir.geral})); }, "aria-expanded":abrir.geral, className:"rounded-lg px-3.5 py-2 text-[13px] font-semibold ring-1 "+(abrir.geral ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-border hover:bg-muted/40")}, (abrir.geral ? "▾ " : "▸ ")+"Geral de contas pagas (mês a mês)")),
    abrir.cnpj && e(BlocoBarra,{t:"A pagar por CNPJ em "+ano, sub:"digite o que falta pagar de cada mês em cada empresa; contas sem empresa vão em \"Contas sem CNPJ\". A tela Limite de faturamento usa estes valores."},
        e("div",{className:"flex flex-col gap-2 overflow-x-auto p-3"},
          e("div",{className:"grid min-w-[62rem] grid-cols-[7rem_repeat(6,minmax(0,8.5rem))_minmax(9.5rem,1fr)] gap-2 px-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"},
            e("span",{className:"text-left"},"Mês"), COLUNAS_CONTAS.map(function(c){ return e("span",{key:c[0]}, c[1]); }), e("span",null,"Total do mês")),
          MESES_LONGO.map(function(nome,i){
            var cc = (s.contasCnpj && s.contasCnpj[anoStr]) || {};
            var totalMes = COLUNAS_CONTAS.reduce(function(t,c){ return t+((cc[c[0]]||{})[i]||0); },0);
            return e("div",{key:i, className:"grid min-w-[62rem] grid-cols-[7rem_repeat(6,minmax(0,8.5rem))_minmax(9.5rem,1fr)] items-center gap-2 rounded-xl border px-2 py-1.5 "+(i===mesAtualIdx?"border-warning/60 bg-warning/5":"border-border bg-card")},
              e("span",{className:"text-[13.5px] font-semibold"}, nome),
              COLUNAS_CONTAS.map(function(c){ return e(MoneyInput,{key:c[0], value:(cc[c[0]]||{})[i]||0, sm:true, className:"w-full", label:nome+" "+c[1],
                onChange:function(x){ d({type:"CC_SET", ano:anoStr, id:c[0], mes:i, valor:x}); }}); }),
              e("b",{className:MONO+" whitespace-nowrap text-center text-[15px] "+(totalMes>0?"text-primary":"text-muted-foreground")}, BK(totalMes)));
          }),
          e("div",{className:"flex justify-center pt-1"},
            e(Btn,{v:"ghost", sm:true, ic:"chevron", onClick:function(){ d({type:"ABA", aba:"limitefat"}); }}, "Ver o limite de faturamento de cada CNPJ")))),
    abrir.geral && e(React.Fragment,null,
        e("div",{className:"grid grid-cols-2 gap-2 md:grid-cols-4"},
          e(KPI,{compacto:true, l:"Valor médio pago no ano", v:BK(mesesComPago ? totPago/mesesComPago : 0), sub:mesesComPago+" meses com pagamento"}),
          e(KPI,{compacto:true, l:"Pago no ano", v:BK(totPago), tom:"text-success"}),
          e(KPI,{compacto:true, l:"A pagar no ano", v:BK(totAPagar), tom:totAPagar?"text-destructive":""}),
          e(KPI,{compacto:true, l:"Total do ano", v:BK(totPago+totAPagar)})),
        e(BlocoBarra,{t:"Contas a pagar de "+ano, sub:"cada mês só precisa do Pago e do A pagar; o Total é calculado"},
          e("div",{className:"flex flex-col gap-1.5 p-3"},
            e("div",{className:"grid grid-cols-[9rem_1fr_1fr_1fr_5.5rem] gap-2.5 px-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"},
              e("span",{className:"text-left"},"Mês"), e("span",null,"Pago"), e("span",null,"A pagar"), e("span",null,"Total"), e("span",null,"")),
            meses.map(function(m,i){ return e(LinhaMes,{key:i, i:i, m:m, ano:anoStr, atual:i===mesAtualIdx, mesAtualIdx: mesAtualIdx<0 ? 12 : mesAtualIdx}); })))));
}

export { LinhaMes, AbaContasPagar };
