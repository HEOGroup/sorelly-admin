// Sorelly Admin · montagem — pages/pf/NegAbas.js
// PAGAMENTOS › NEGOCIAÇÕES com abas (Marcus, 16/11/2026): Negociações · Meses e dezenas (o resumo antigo por fornecedor) · LIMITE E CALENDÁRIO (aba final; é coisa do Nickolas e saiu do Resumo geral).
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { mesAtual, mesLabel } from "@/apps/montagem/domain/pf";
import { AbaPfNeg } from "@/apps/montagem/pages/pf/Negociacoes";
import { Geral } from "@/apps/montagem/pages/pf/Resumo";
import { LimiteMes } from "@/apps/montagem/pages/pf/Limite";
import { usePf } from "@/apps/montagem/pages/pf/ui";
import { e, useState } from "@/shared/react";

function LimiteECalendario(){
  var c = usePf(), pf = c.pf, sm = useState(mesAtual()), mes = sm[0], setMes = sm[1], meses = [];
  if(!pf || !pf.fornecedores) return e("p",{className:"p-6"}, "Carregando…");
  for(var mm = 1; mm<=12; mm++) meses.push("2026-"+String(mm).padStart(2, "0"));
  return e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"flex flex-wrap items-center gap-2"}, e("select",{value:mes, "aria-label":"Mês", onChange:function(ev){ setMes(ev.target.value); }, className:"h-8 w-48 rounded-md border border-border bg-card px-2 text-[13px] font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"}, meses.map(function(m){ return e("option",{key:m, value:m}, mesLabel(m+"-01")); }))),
    e(LimiteMes,{key:mes, pf:pf, mes:mes}));
}

var ABAS_NEG = [["neg", "Negociações"], ["mes", "Visão por mês"], ["meses", "Meses e dezenas"], ["limite", "Limite e calendário"]];
// 1ª linha = nome da tela com as abas na ponta direita (Marcus, 20/11/2026)
function AbaPfNegAbas(){
  var sa = useState("neg"), aba = sa[0], setAba = sa[1];
  var abasEl = e("span",{className:"ml-auto flex items-center gap-1"}, ABAS_NEG.map(function(x){ var on = x[0]===aba;
    return e("button",{key:x[0], type:"button", "aria-pressed":on, onClick:function(){ setAba(x[0]); },
      className:"inline-flex h-[18px] items-center whitespace-nowrap rounded border px-3 text-[10px] font-semibold leading-none "+(on ? "border-white/60 bg-white/30 text-white" : "border-white/25 bg-white/10 text-white hover:bg-white/20")}, x[1]); }));   // padrao-ok: abas de 10 px na barra de filtros
  return e("div",{className:"flex flex-col gap-0"},
    e("div",{className:PADRAO_BLOCOS+" -mx-4 -mt-4 md:-mx-6 md:-mt-6 [&_section]:!rounded-none [&_section]:!border-x-[4px] [&_section]:!border-y-0"},
      e(BlocoPainel,{titulo:"Negociações", compacto:true, cls:"[&_h2]:!py-1.5"}, e("div",{className:"h-[3px] bg-white"}))),
    aba==="neg" ? e(AbaPfNeg, {abasEl:abasEl}) : aba==="mes" ? e(AbaPfNeg, {visao:"mes", abasEl:abasEl}) : e("div",null,
      e("div",{className:"-mx-4 flex flex-wrap items-center border-b-2 border-white/30 bg-[#2d5190] px-2 py-1 md:-mx-6"}, abasEl),
      e("div",{className:"pt-2"}, aba==="meses" ? e(Geral, null) : e(LimiteECalendario, null))));
}
export { AbaPfNegAbas };
