// Sorelly Admin · montagem — pages/inad/Gestao.js
// Inadimplência › Cobrança do dia, Relatórios e Regras (11/11/2026). A Cobrança do dia junta o que precisa de ação hoje; os Relatórios saem sozinhos dos registros
// (a dívida conta no mês em que nasceu; o pagamento, no mês em que entrou). Contas em domain/inadimplencia.js (estado s.inad, ação INAD).
import { Pagina } from "@/apps/montagem/components/padrao";
import { Segmentado, brl } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { aberta, anosDe, formatarDia, hojeIso, indicePagos, proximaAcao, regrasDoSetor, relatorioMensal, relatorioPorRep, rotuloMes, saldoDe } from "@/apps/montagem/domain/inadimplencia";
import { FichaDivida } from "@/apps/montagem/pages/inad/Dividas";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useMemo, useState } from "@/shared/react";

var R$ = function(v){ return v==null ? "" : brl(v); };
var semDados = function(cab){ return e(Pagina,null, cab, e("p",{className:"py-6 text-center text-[13px] text-foreground"}, "Dados da Inadimplência indisponíveis.")); };

// ---------- Cobrança do dia ----------
var ORDEM = {"Parcela vencida":1, "Contato":2, "Prazo da representante":3, "Analisar Serasa":4, "Serasa":5};
function AbaInadCobranca(){
  var s = use().state, inad = s.inad, hoje = hojeIso(), sf = useState(null), ficha = sf[0];
  var linhas = useMemo(function(){
    if(!inad) return []; var pagos = indicePagos(inad), out = [];
    (inad.dividas||[]).forEach(function(d){ var a = proximaAcao(d, pagos, inad.cfg, hoje); if(!a.tipo) return; if(a.tipo!=="Serasa" && !aberta(d, pagos)) return;
      out.push({id:d.id, ordem:ORDEM[a.tipo]||9, tipo:a.tipo, nome:d.nome, rep:d.rep||"", cobra:d.cobra||"", falta:saldoDe(d, pagos), acao:a.txt, dias:a.dias||0, data:d.data||""}); });
    return out.sort(function(x, y){ return x.ordem-y.ordem || y.dias-x.dias; });
  }, [inad, hoje]);
  var cab = e(PageHead,{t:"Cobrança do dia", sub:"O que precisa de ação hoje: parcela vencida, contato a fazer, prazo da representante vencido e dívida com tempo para analisar Serasa."});
  if(!inad) return semDados(cab);
  var cols = [{k:"tipo", t:"O que fazer", cor:function(l){ return l.tipo==="Parcela vencida" || l.tipo==="Analisar Serasa" ? "text-red-400 font-semibold" : "text-amber-300 font-semibold"; }}, {k:"nome", t:"Devedora"}, {k:"rep", t:"Representante"}, {k:"cobra", t:"Quem cobra"},
    {k:"falta", t:"Falta", fmt:R$, cor:function(){ return "text-red-400"; }}, {k:"acao", t:"Detalhe"}, {k:"dias", t:"Dias"}, {k:"data", t:"Data da dívida", fmt:function(v){ return formatarDia(v); }}];
  var total = function(ls){ var v = 0; ls.forEach(function(l){ v += l.falta; }); return ["Total", ls.length.toLocaleString("pt-BR")+" ações", "", "", R$(v), "", "", ""]; };
  return e(Pagina,null, cab,
    e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", escura:true, grade:true, limite:100, totalLinha:total, aoClicar:function(l){ sf[1](l.id); }, vazio:"Nada pendente para hoje."}),
    ficha && e(FichaDivida,{id:ficha, fechar:function(){ sf[1](null); }}));
}

// ---------- Relatórios ----------
function AbaInadRelatorios(){
  var s = use().state, inad = s.inad, anos = useMemo(function(){ return inad ? anosDe(inad) : []; }, [inad]);
  var sa = useState(""), ano = sa[0] || anos[0] || hojeIso().slice(0, 4);
  var meses = useMemo(function(){ return inad ? relatorioMensal(inad, ano).map(function(l){ return Object.assign({}, l, {mesRot:rotuloMes(l.mes), resultado:Math.round((l.valor-l.recuperado)*100)/100}); }) : []; }, [inad, ano]);
  var reps = useMemo(function(){ return inad ? relatorioPorRep(inad, ano) : []; }, [inad, ano]);
  var cab = e(PageHead,{t:"Relatórios", sub:"Feitos sozinhos a partir dos registros. A dívida conta no mês em que nasceu; o pagamento, no mês em que entrou."},
    anos.length>1 && e(Segmentado,{opcoes:anos.slice(0, 5).map(function(a){ return [a, a]; }), atual:ano, onMudar:sa[1]}));
  if(!inad) return semDados(cab);
  var pct = function(v){ return v==null ? "" : v.toLocaleString("pt-BR", {minimumFractionDigits:1, maximumFractionDigits:1})+"%"; };
  var colsM = [{k:"mesRot", t:"Mês"}, {k:"novas", t:"Novas inadimplências"}, {k:"valor", t:"Valor das dívidas", fmt:R$}, {k:"pagamentos", t:"Pagamentos recebidos"}, {k:"recuperado", t:"Valor recuperado", fmt:R$, cor:function(){ return "text-emerald-400"; }},
    {k:"resultado", t:"Dívidas menos recebido", fmt:R$}, {k:"negociacao", t:"Em negociação", fmt:R$, cor:function(){ return "text-amber-300"; }}, {k:"semRetorno", t:"Sem retorno", fmt:R$, cor:function(){ return "text-amber-300"; }}, {k:"saldo", t:"Saldo em aberto", fmt:R$, cor:function(l){ return l.saldo>0.005 ? "text-red-400" : ""; }}, {k:"pct", t:"Recuperação das dívidas do mês", fmt:pct}];
  var totM = function(ls){ var t = {novas:0, valor:0, pagamentos:0, recuperado:0, negociacao:0, semRetorno:0, saldo:0}; ls.forEach(function(l){ Object.keys(t).forEach(function(k){ t[k] += l[k]||0; }); });
    return ["Total de "+ano, t.novas.toLocaleString("pt-BR"), R$(t.valor), t.pagamentos.toLocaleString("pt-BR"), R$(t.recuperado), R$(t.valor-t.recuperado), R$(t.negociacao), R$(t.semRetorno), R$(t.saldo), t.valor>0 ? pct(Math.round((t.valor-t.saldo)/t.valor*1000)/10) : ""]; };
  var colsR = [{k:"rep", t:"Representante"}, {k:"qtd", t:"Inadimplências"}, {k:"valor", t:"Valor das dívidas", fmt:R$}, {k:"saldo", t:"Saldo em aberto", fmt:R$, cor:function(l){ return l.saldo>0.005 ? "text-red-400" : ""; }}];
  var totR = function(ls){ var q = 0, v = 0, sd = 0; ls.forEach(function(l){ q += l.qtd; v += l.valor; sd += l.saldo; }); return ["Total de "+ano, q.toLocaleString("pt-BR"), R$(v), R$(sd)]; };
  return e(Pagina,null, cab,
    e("h2",{className:"pt-1 text-[13px] font-semibold"}, "Mês a mês"),
    e(TabelaPlanilha,{key:"m"+ano, cols:colsM, linhas:meses, chave:"mes", escura:true, grade:true, semContagem:true, totalLinha:totM}),
    e("h2",{className:"pt-2 text-[13px] font-semibold"}, "Por representante"),
    e(TabelaPlanilha,{key:"r"+ano, cols:colsR, linhas:reps, chave:"rep", escura:true, grade:true, compacta:true, semContagem:true, totalLinha:totR, vazio:"Nenhuma dívida neste ano."}));
}

// ---------- Regras ----------
function AbaInadRegras(){
  var s = use().state, inad = s.inad;
  var linhas = useMemo(function(){ return regrasDoSetor(inad && inad.cfg).map(function(r, i){ return {id:i, regra:r[0], vale:r[1]}; }); }, [inad]);
  var cab = e(PageHead,{t:"Regras", sub:"Regras de negociação e cobrança do setor. Uso interno: não entram em folder nem em material da revendedora."});
  return e(Pagina,null, cab, e(TabelaPlanilha,{cols:[{k:"regra", t:"Regra"}, {k:"vale", t:"O que vale"}], linhas:linhas, chave:"id", escura:true, grade:true, semFiltro:true, semContagem:true}));
}

export { AbaInadCobranca, AbaInadRelatorios, AbaInadRegras };
