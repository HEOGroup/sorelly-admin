// Sorelly Admin · montagem — pages/ComissaoLink.js
// Financeiro → Comissões → Link de pagamento: bônus do setor (Hellen) pelas faixas do valor pago em links no mês. As faixas ficam em Link de pagamento → Análises.
// Os links pagos contam pelo dia do pagamento, mesmo que o kit/revendedora ainda não tenha chegado; os links já descontados em acertos aparecem à parte.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Faixa, Indicador, LINHA, Pagina, Tab, Td } from "@/apps/montagem/components/padrao";
import { bonusDoValor, formatarDia, formatarReais, indicadoresLp, mesDe } from "@/apps/montagem/domain/link-pagamento";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

function AbaComissaoLink(){
  var cx = use(), s = cx.state, hoje = new Date(), padrao = hoje.getFullYear()+"-"+String(hoje.getMonth()+1).padStart(2,"0"), st = useState(padrao), mes = st[0];
  var lp = s.lp, ind = lp ? indicadoresLp(s, mes) : null;
  if(!lp || !ind) return e(Pagina,null, e(PageHead,{t:"Comissão do Link de pagamento"}), e("p",{className:"py-6 text-center text-[13px] text-white/60"}, "Ainda não há links registrados."));
  var faixas = ((lp.config.bonus && lp.config.bonus.faixas) || []).slice().sort(function(a, b){ return a.min-b.min; }), b = bonusDoValor(lp.config, ind.valorCoorte);
  var prox = faixas.find(function(f){ return f.min>ind.valorCoorte; });
  var usados = lp.solicitacoes.filter(function(x){ return x.usadoEm && mesDe(x.pagoEm || x.criadoEm)===mes; });
  var totalUsado = usados.reduce(function(t, x){ return t+(x.usadoValor||0); }, 0);
  return e(Pagina,null,
    e(PageHead,{t:"Comissão do Link de pagamento", sub:"Bônus do setor (Hellen) pelo valor pago em links no mês. Faixas editáveis em Link de pagamento → Análises."},
      e("input",{type:"month", value:mes, "aria-label":"Mês", onChange:function(ev){ if(ev.target.value) st[1](ev.target.value); }, className:"h-9 rounded-lg bg-black/30 px-3 text-[13px] ring-1 ring-white/15"})),
    e(Faixa,{n:4}, e(Indicador,{t:"Valor pago em links", v:formatarReais(ind.valorCoorte), cor:"ok", sub:ind.pagosCoorte+" links pagos"}), e(Indicador,{t:"Bônus do mês", v:formatarReais(b.valor), cor:"total", sub:b.min!=null ? "Faixa a partir de "+formatarReais(b.min) : "Abaixo da primeira faixa"}),
      e(Indicador,{t:"Próxima faixa", v:prox ? formatarReais(prox.min) : "—", cor:"info", sub:prox ? "Faltam "+formatarReais(prox.min-ind.valorCoorte)+" para "+formatarReais(prox.valor) : "Já está na última faixa"}),
      e(Indicador,{t:"Descontado em acertos", v:formatarReais(totalUsado), cor:"neutro", sub:usados.length+" links usados"})),
    e(BlocoBarra,{cor:"turquesa", t:"Faixas do bônus", compacto:true}, e("div",{className:"p-2"}, faixas.length ? e(Tab,{cols:["Valor pago no mês a partir de", "Bônus"]}, faixas.map(function(f){ return e("tr",{key:f.min, className:LINHA+(b.min===f.min ? " font-bold" : "")}, e(Td,null, formatarReais(f.min)), e(Td,{dinheiro:true, cor:b.min===f.min ? "ok" : undefined}, formatarReais(f.valor))); }))
      : e("p",{className:"py-3 text-center text-[13px] text-white/60"}, "Nenhuma faixa cadastrada ainda."))),
    e(BlocoBarra,{cor:"turquesa", t:"Links já descontados em acertos", dir:String(usados.length), compacto:true}, e("div",{className:"p-2"}, usados.length ? e(Tab,{cols:["Pago em", "Revendedora", "Representante", "Valor do link", "Descontado no acerto"]}, usados.slice(0, 50).map(function(x){ return e("tr",{key:x.id, className:LINHA},
      e(Td,null, formatarDia(x.pagoEm) || "—"), e(Td,{forte:true}, x.revendedora), e(Td,null, x.representante || "—"), e(Td,{dinheiro:true}, formatarReais(x.valor)), e(Td,{dinheiro:true, cor:"ok"}, formatarReais(x.usadoValor||0))); }))
      : e("p",{className:"py-3 text-center text-[13px] text-white/60"}, "Nenhum link foi descontado em acerto neste mês."))));
}
export { AbaComissaoLink };
