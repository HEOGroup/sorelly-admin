// Sorelly Admin · montagem — pages/pf/NegAbas.js
// PAGAMENTOS › NEGOCIAÇÕES com abas (Marcus, 16/11/2026): Negociações · Meses e dezenas (o resumo antigo por fornecedor) · LIMITE E CALENDÁRIO (aba final; é coisa do Nickolas e saiu do Resumo geral).
import { AbasTela } from "@/apps/montagem/components/padrao-fin";
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

function AbaPfNegAbas(){
  var sa = useState("neg"), aba = sa[0], setAba = sa[1];
  return e("div",{className:"flex flex-col gap-2"},
    e(AbasTela,{abas:[["neg", "Negociações"], ["meses", "Meses e dezenas"], ["limite", "Limite e calendário"]], atual:aba, onMudar:setAba}),
    aba==="neg" ? e(AbaPfNeg, null) : aba==="meses" ? e(Geral, null) : e(LimiteECalendario, null));
}
export { AbaPfNegAbas };
