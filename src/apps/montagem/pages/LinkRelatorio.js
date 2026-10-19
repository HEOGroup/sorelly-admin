// Sorelly Admin · montagem — pages/LinkRelatorio.js
// Financeiro → Link de pagamento (relatório): o dinheiro dos links entra direto para a Sorelly. Números do mês (gerados, pagos, conversão, valor pago, bônus do setor e taxas) e o resumo
// por DIA e por MÊS (gerados, pagos, expirados, com erro). Quem opera os links é o setor Link de pagamento (a Helen): a operação fica em pages/LinkPagamento.js.
import { Faixa, Indicador, Pagina } from "@/apps/montagem/components/padrao";
import { bonusDoValor, formatarReais, indicadoresLp } from "@/apps/montagem/domain/link-pagamento";
import { ResumoLinks } from "@/apps/montagem/pages/link-pagamento/Resumo";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

function AbaLinkRelatorio(){
  var cx = use(), s = cx.state, hoje = new Date(), padrao = hoje.getFullYear()+"-"+String(hoje.getMonth()+1).padStart(2,"0");
  var st = useState(padrao), mes = st[0];
  var ind = s.lp ? indicadoresLp(s, mes) : null;
  return e(Pagina,null,
    e(PageHead,{t:"Relatório de links de pagamento", sub:"O que entra direto para a Sorelly: links gerados, pagos, expirados e com erro, por dia e por mês. A operação dos links fica no setor Link de pagamento."},
      e("input",{type:"month", value:mes, "aria-label":"Mês", onChange:function(ev){ if(ev.target.value) st[1](ev.target.value); }, className:"h-9 rounded-lg bg-black/30 px-3 text-[13px] ring-1 ring-white/15"})),
    !ind ? e("p",{className:"py-6 text-center text-[13px] text-white/60"}, "Ainda não há solicitações de link registradas.") :
    [e(Faixa,{key:"f", n:8},
      e(Indicador,{t:"Solicitações no mês", v:String(ind.total), cor:"info", ir:"linkpag", sub:"App: "+ind.porCanal.app+" · WhatsApp: "+ind.porCanal.whatsapp}),
      e(Indicador,{t:"Links gerados", v:String(ind.geradosMes), cor:"info"}),
      e(Indicador,{t:"Links pagos", v:String(ind.pagosCoorte), cor:"ok"}),
      e(Indicador,{t:"Conversão", v:(String(ind.conversao).replace(".", ","))+"%", cor:ind.conversao>=65 ? "ok" : ind.conversao>=55 ? "alerta" : "ruim", sub:"Pagos ÷ gerados"}),
      e(Indicador,{t:"Valor pago", v:formatarReais(ind.valorCoorte), cor:"ok", sub:"Recebido no mês: "+formatarReais(ind.pagoMes)}),
      e(Indicador,{t:"Bônus do setor", v:formatarReais(bonusDoValor(s.lp.config, ind.valorCoorte).valor), cor:"total", ir:"linkpag"}),
      e(Indicador,{t:"Taxas", v:formatarReais(ind.taxaTotal+ind.antecipacaoTotal), cor:"alerta", sub:"Líquido: "+formatarReais(ind.liquido)}),
      e(Indicador,{t:"Comprovantes pendentes", v:String(ind.comprovantesPendentes), cor:ind.comprovantesPendentes ? "alerta" : "ok", ir:"linkpag"})),
      e(ResumoLinks,{key:"r", lp:s.lp, mes:mes})]);
}
export { AbaLinkRelatorio };
