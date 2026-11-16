// Sorelly Admin · montagem — pages/link-pagamento/Descontados.js
// Tela Descontados no acerto (Hellen, 03/11/2026): os links pagos que já abateram um acerto, para conferir como na planilha dela.
// REFEITA em 16/11/2026 (Marcus: "arruma as outras telas conforme as nossas regras"): bloco azul como o Contas a pagar e planilha com filtro em cada coluna (TabelaPlanilha); nenhuma coluna saiu.
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { formatarReais, meioDe, nomeMeio } from "@/apps/montagem/domain/link-pagamento";
import { useLp } from "@/apps/montagem/pages/link-pagamento/visual";
import { e, useMemo } from "@/shared/react";

var dia = function(v){ return v ? String(v).slice(0, 10).split("-").reverse().join("/") : "—"; };   // as colunas de data guardam AAAA-MM-DD (ordenam certo) e mostram DD/MM/AAAA

function AbaLpDescontados(){
  var L = useLp(), s = L.s, lp = L.lp;
  var linhas = useMemo(function(){
    // Marcus, 16/11/2026: mostra também os links da planilha antiga que já abateram acerto (x.descontado, com a data do acerto), além dos descontados pelo Atendimento interno (x.acertoId).
    var dia0 = function(x){ return String(x.usadoEm || x.dataAcerto || "").slice(0, 10); };
    return lp.solicitacoes.filter(function(x){ return x.acertoId || x.descontado; }).sort(function(a, b){ return dia0(b) < dia0(a) ? -1 : dia0(b) > dia0(a) ? 1 : 0; }).map(function(x){
      return {id:x.id, usado:dia0(x), origem:x.acertoId ? "Atendimento interno" : "Planilha antiga", autorizacao:x.autorizacao || "—", vendaComLink:Number(x.vendaComLink) || 0, revendedora:x.revendedora, representante:x.representante || "Sem representante", link:nomeMeio(meioDe(s, x.meioId)), valor:Number(x.valor) || 0,
        parcelas:(x.parcelas || 1)+"x", pagoEm:String(x.pagoEm || "").slice(0, 10), sobrou:Number(x.excedente) || 0, acerto:String(x.dataAcerto || "").slice(0, 10)}; });
  }, [lp.solicitacoes]);   // eslint-disable-line react-hooks/exhaustive-deps
  var din = function(v){ return formatarReais(v || 0); };
  var cols = [{k:"usado", t:"Descontado em", data:true, fmt:dia, render:dia}, {k:"origem", t:"Origem"}, {k:"revendedora", t:"Revendedora"}, {k:"representante", t:"Representante"}, {k:"link", t:"Link"},
    {k:"valor", t:"Valor do link", fmt:din, render:function(v){ return e("b",{className:"tabular-nums"}, din(v)); }}, {k:"parcelas", t:"Parcelas"},
    {k:"pagoEm", t:"Pago em", fmt:dia, render:dia}, {k:"sobrou", t:"Sobrou", fmt:din, render:function(v){ return v>0 ? e("b",{className:"tabular-nums text-[#FBBF24]"}, din(v)) : din(v); }}, {k:"acerto", t:"Data do acerto", fmt:dia, render:dia}, {k:"autorizacao", t:"Autorização"}, {k:"vendaComLink", t:"Venda com link", fmt:din, render:din}];
  return e(BlocoPainel,{titulo:"Links descontados no acerto", compacto:true, dir:linhas.length.toLocaleString("pt-BR")},
    linhas.length ? e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", centro:true, grade:true, semLimpar:true, semContagem:true, limite:50, paginas:true})
      : e("p",{className:"py-6 text-center text-[13px]"}, "Nenhum link foi descontado em acerto ainda."));
}
export { AbaLpDescontados };
