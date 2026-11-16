// Sorelly Admin · montagem — pages/link-pagamento/Historico.js
// Tela Histórico: tudo o que já terminou (pago, negado, abandonado, expirado, cancelado...), em planilha.
// O quadro de Solicitações mostra só o que está em andamento; os milhares de registros antigos (inclusive os da planilha de 2026) ficam aqui.
// REFEITA em 16/11/2026 (Marcus: "arruma a tela de histórico"): UM bloco azul como o Contas a pagar, números na faixa azul (batem com o que está filtrado) e filtro em cada coluna, como no Google Planilhas.
// Os filtros de antes (busca, mês, situação, representante, link, canal) viraram colunas (Mês, Situação, Representante, Link, Canal; a busca é o filtro de Revendedora e de Autorização); a paginação virou "Mostrar mais 50".
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { COR_STATUS, EM_ANDAMENTO, ROTULO_STATUS, formatarReais, listaSolicitacoes, meioDe, mesDe } from "@/apps/montagem/domain/link-pagamento";
import { useLp } from "@/apps/montagem/pages/link-pagamento/visual";
import { e, useMemo, useState } from "@/shared/react";

var POR_VEZ = 50;
var NOME_MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
var rotuloMes = function(m){ var p = String(m).split("-"); return p.length>1 ? NOME_MES[+p[1]-1]+"/"+p[0] : "—"; };
var dia = function(v){ return v ? String(v).slice(0, 10).split("-").reverse().join("/") : "—"; };   // a coluna guarda a data como AAAA-MM-DD (ordena certo) e mostra DD/MM/AAAA

function AbaLpHistorico(){
  var L = useLp(), s = L.s, lp = L.lp, fl = useState(null), visiveis = fl[0];
  var n = lp.solicitacoes.length;
  var aviso = function(x){ return [x.suspeitaDuplicada ? "Possível duplicada (mesma data, revendedora, valor e parcelas)" : "", x.suspeitaDados || ""].filter(Boolean).join(" · "); };
  var linhas = useMemo(function(){
    return listaSolicitacoes(s, {}).filter(function(x){ return !EM_ANDAMENTO[x.status]; }).map(function(x){
      var m = meioDe(s, x.meioId), pago = x.status==="pago" || x.status==="comprovante";
      return {id:x.id, mes:rotuloMes(mesDe(x.criadoEm)), data:String(x.criadoEm || "").slice(0, 10), revendedora:x.revendedora, representante:x.representante || "—", link:m ? m.nome : "—", valor:x.valor, parcelas:(x.parcelas || 1)+"x",
        bandeira:x.bandeira || "—", canal:x.canal==="whatsapp" ? "WhatsApp" : "App", situacao:ROTULO_STATUS[x.status], _cor:COR_STATUS[x.status], _pago:pago, pagoEm:String(x.pagoEm || "").slice(0, 10), acerto:String(x.dataAcerto || "").slice(0, 10),
        autorizacao:x.autorizacao || "—", aviso:aviso(x) ? "Conferir" : "", _aviso:aviso(x)}; });
  }, [n, lp.solicitacoes]);   // eslint-disable-line react-hooks/exhaustive-deps
  var tot = useMemo(function(){ var o = {pagos:0, valor:0, semSucesso:0}, ls = visiveis || linhas; ls.forEach(function(x){ if(x._pago){ o.pagos++; o.valor += x.valor; } else o.semSucesso++; }); return o; }, [visiveis, linhas]);
  var cols = [{k:"mes", t:"Mês"}, {k:"data", t:"Data", fmt:dia, render:dia}, {k:"revendedora", t:"Revendedora"}, {k:"representante", t:"Representante"}, {k:"link", t:"Link"},
    {k:"valor", t:"Valor", fmt:function(v){ return formatarReais(v); }, render:function(v, l){ return e("b",{className:"tabular-nums "+(l._pago ? "text-success" : "")}, formatarReais(v)); }},
    {k:"parcelas", t:"Parcelas"}, {k:"bandeira", t:"Bandeira"}, {k:"canal", t:"Canal"},
    {k:"situacao", t:"Situação", render:function(v, l){ return e("span",{className:"font-bold", style:{color:l._cor}}, v); }},
    {k:"pagoEm", t:"Pago em", fmt:dia, render:dia}, {k:"acerto", t:"Acerto", fmt:dia, render:dia}, {k:"autorizacao", t:"Autorização"},
    {k:"aviso", t:"Aviso", render:function(v, l){ return v ? e("span",{className:"font-bold text-[#FBBF24]", title:l._aviso}, "⚠ "+v) : ""; }}];
  return e(BlocoPainel,{titulo:"Histórico dos links", compacto:true},
    linhas.length ? e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", centro:true, grade:true, maozinha:true, semLimpar:false, semContagem:true, limite:POR_VEZ, onFiltradas:fl[1]})
      : e("p",{className:"py-6 text-center text-[13px]"}, "Nenhum registro."));
}
export { AbaLpHistorico };
