// Sorelly Admin · montagem — pages/LinkRelatorio.js
// Link de pagamento → Relatório de links: o dinheiro dos links entra direto para a Sorelly. Números do mês (gerados, pagos, conversão, valor pago, bônus do setor e taxas) e o resumo
// por DIA e por MÊS (gerados, pagos, expirados, com erro). Quem opera os links é o setor Link de pagamento (a Hellen): a operação fica em pages/LinkPagamento.js.
// REFEITA em 16/11/2026 (Marcus: "arruma as outras telas conforme as nossas regras"): bloco azul como o Contas a pagar, mês e números numa faixa só; o resumo por mês e por dia já é planilha.
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { Pagina } from "@/apps/montagem/components/padrao";
import { bonusDoValor, formatarReais, indicadoresLp } from "@/apps/montagem/domain/link-pagamento";
import { ResumoLinks } from "@/apps/montagem/pages/link-pagamento/Resumo";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

function AbaLinkRelatorio(){
  var cx = use(), s = cx.state, hoje = new Date(), padrao = hoje.getFullYear()+"-"+String(hoje.getMonth()+1).padStart(2,"0");
  var st = useState(padrao), mes = st[0];
  var ind = s.lp ? indicadoresLp(s, mes) : null;
  var num = function(rot, v, cor){ return e("span",{key:rot, className:"whitespace-nowrap px-1 text-[13px]"}, rot+" ", e("b",{className:"tabular-nums "+(cor || "")}, v)); };
  var faixa = e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    e("label",{className:"flex items-center gap-1.5 text-[13px] font-semibold"}, "Mês", e("input",{type:"month", value:mes, "aria-label":"Mês", onChange:function(ev){ if(ev.target.value) st[1](ev.target.value); }, className:"h-8 rounded-md border border-white/50 bg-[#14233f] px-2 text-[13px] font-semibold text-white [color-scheme:dark]"})),
    ind && e("div",{className:"flex flex-wrap items-center gap-x-1"},
      num("Solicitações no mês", ind.total+" (App "+ind.porCanal.app+" · WhatsApp "+ind.porCanal.whatsapp+")"), num("Links gerados", ind.geradosMes), num("Links pagos", ind.pagosCoorte),
      num("Conversão", String(ind.conversao).replace(".", ",")+"%", ind.conversao>=65 ? "text-success" : ind.conversao>=55 ? "text-[#FBBF24]" : "text-[#fca5a5]"),
      num("Valor pago", formatarReais(ind.valorCoorte)+" (recebido no mês: "+formatarReais(ind.pagoMes)+")"), num("Bônus do setor", formatarReais(bonusDoValor(s.lp.config, ind.valorCoorte).valor)),
      num("Taxas", formatarReais(ind.taxaTotal+ind.antecipacaoTotal)+" (líquido: "+formatarReais(ind.liquido)+")", "text-[#FBBF24]")));
  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e("div",{className:"flex flex-col gap-2"},
      e(BlocoPainel,{titulo:"Relatório de links de pagamento", compacto:true}, faixa,
        !ind && e("p",{className:"py-6 text-center text-[13px]"}, "Ainda não há solicitações de link registradas.")),
      ind && e(ResumoLinks,{lp:s.lp, mes:mes})));
}
export { AbaLinkRelatorio };
