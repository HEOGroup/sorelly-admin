// Sorelly Admin · montagem — pages/ComissaoLink.js
// Financeiro → Comissões → Link de pagamento: bônus do setor (Helen) pelas faixas do valor pago em links no mês. As faixas ficam em Link de pagamento → Análises.
// Os links pagos contam pelo dia do pagamento, mesmo que o kit/revendedora ainda não tenha chegado; os links já descontados em acertos aparecem à parte.
// VISUAL (23/11/2026): bloco azul com o mês na barra de menus e a TabelaPlanilha em tudo (resumo em linhas escritas, sem faixa de números).
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { BarraTabela, CampoMini, CelulaBarra } from "@/apps/montagem/components/planilha-cheia";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { bonusDoValor, formatarDia, formatarReais, indicadoresLp, mesDe } from "@/apps/montagem/domain/link-pagamento";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var nomeMes = function(ym){ return MESES[+ym.slice(5, 7)-1]+"/"+ym.slice(0, 4); };
var RAIZ = "-mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3 flex flex-col gap-2.5 [&_*]:!normal-case "+PADRAO_BLOCOS;
var TABELA = {chave:"id", grade:true, semContagem:true, semLimpar:true, semCaixaAlta:true};
var tabela = function(o){ return e(TabelaPlanilha, Object.assign({}, TABELA, o)); };
var VERDE = "text-[#4ADE80]";

function AbaComissaoLink(){
  var cx = use(), s = cx.state, hoje = new Date(), padrao = hoje.getFullYear()+"-"+String(hoje.getMonth()+1).padStart(2,"0"), st = useState(padrao), mes = st[0], setMes = st[1];
  var lp = s.lp, ind = lp ? indicadoresLp(s, mes) : null;
  if(!lp || !ind) return e("div",{className:RAIZ}, e(BlocoPainel,{titulo:"Comissão do Link de pagamento", compacto:true},
    e("div",{className:"flex min-h-8 items-center justify-center px-3 text-center text-[13px]"}, "Ainda não há links registrados.")));
  var faixas = ((lp.config.bonus && lp.config.bonus.faixas) || []).slice().sort(function(a, b){ return a.min-b.min; }), b = bonusDoValor(lp.config, ind.valorCoorte);
  var prox = faixas.find(function(f){ return f.min>ind.valorCoorte; });
  var usados = lp.solicitacoes.filter(function(x){ return x.usadoEm && mesDe(x.pagoEm || x.criadoEm)===mes; });
  var totalUsado = usados.reduce(function(t, x){ return t+(x.usadoValor||0); }, 0);
  // meses que têm link, mais o mês de hoje e o escolhido
  var meses = {}; meses[padrao] = 1; meses[mes] = 1; lp.solicitacoes.forEach(function(x){ var m = mesDe(x.pagoEm || x.criadoEm); if(/^\d{4}-\d{2}$/.test(m)) meses[m] = 1; });
  var opMes = Object.keys(meses).sort().reverse().map(function(m){ return [m, nomeMes(m)]; });
  var resumo = [
    {id:"pago", item:"Valor pago em links", valor:formatarReais(ind.valorCoorte), det:ind.pagosCoorte+" links pagos", cor:VERDE},
    {id:"bonus", item:"Bônus do mês", valor:formatarReais(b.valor), det:b.min!=null ? "Faixa a partir de "+formatarReais(b.min) : "Abaixo da primeira faixa", cor:"text-[#F3D98B]"},
    {id:"prox", item:"Próxima faixa", valor:prox ? formatarReais(prox.min) : "—", det:prox ? "Faltam "+formatarReais(prox.min-ind.valorCoorte)+" para "+formatarReais(prox.valor) : "Já está na última faixa", cor:""},
    {id:"usado", item:"Descontado em acertos", valor:formatarReais(totalUsado), det:usados.length+" links usados", cor:""}];
  var linhasFaixa = faixas.map(function(f){ return {id:f.min, min:f.min, valor:f.valor, atual:b.min===f.min}; });
  var linhasUsado = usados.map(function(x){ return {id:x.id, pago:formatarDia(x.pagoEm), rev:x.revendedora, rep:x.representante || "", valor:x.valor, usado:x.usadoValor||0}; });
  var traco = function(v){ return v || "—"; };
  return e("div",{className:RAIZ},
    e(BlocoPainel,{titulo:"Comissão do Link de pagamento · "+nomeMes(mes), compacto:true, dir:"Bônus "+formatarReais(b.valor)},
      e(BarraTabela,null, e(CelulaBarra,{rotulo:"Mês"}, e(CampoMini,{valor:mes, aoMudar:setMes, rotulo:"Mês", ops:opMes}))),
      tabela({semFiltro:true, cols:[{k:"item", t:"Resumo"}, {k:"valor", t:"Valor", cor:function(l){ return l.cor; }}, {k:"det", t:"Detalhe"}], linhas:resumo})),
    e(BlocoPainel,{titulo:"Faixas do bônus", compacto:true},
      tabela({semFiltro:true, cols:[{k:"min", t:"Valor pago no mês a partir de", fmt:formatarReais}, {k:"valor", t:"Bônus", fmt:formatarReais, cor:function(l){ return l.atual ? VERDE : ""; }}], linhas:linhasFaixa,
        linhaCls:function(l){ return l.atual ? "bg-[#34D399]/[.07] font-bold" : ""; }, vazio:"Nenhuma faixa cadastrada ainda."})),
    e(BlocoPainel,{titulo:"Links já descontados em acertos", compacto:true, dir:String(usados.length)},
      tabela({limite:50, cols:[{k:"pago", t:"Pago em", render:traco}, {k:"rev", t:"Revendedora"}, {k:"rep", t:"Representante", render:traco}, {k:"valor", t:"Valor do link", fmt:formatarReais},
        {k:"usado", t:"Descontado no acerto", fmt:formatarReais, cor:function(){ return VERDE; }}], linhas:linhasUsado, vazio:"Nenhum link foi descontado em acerto neste mês.",
        totalRodape:function(ls){ return ["Total · "+ls.length+(ls.length===1 ? " link" : " links"), "", "", formatarReais(ls.reduce(function(t, l){ return t+l.valor; }, 0)), formatarReais(ls.reduce(function(t, l){ return t+l.usado; }, 0))]; }})));
}
export { AbaComissaoLink };
