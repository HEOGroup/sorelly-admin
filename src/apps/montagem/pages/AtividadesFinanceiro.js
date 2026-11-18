// Sorelly Admin · montagem — pages/AtividadesFinanceiro.js
// Financeiro › Atividades (18/11/2026, pedido do Marcus: "uma aba de atividades do financeiro que fica somente para mim, com todas as atividades").
// Três tabelas: ROTINA (cada atividade do financeiro: última vez, quem fez, quantas no período e se está em dia), POR PESSOA E DIA (tudo o que cada pessoa fez) e PARA CORRIGIR (erros de data nos títulos da DevMaster).
// Duas origens: a DevMaster (baixas, estornos, transferências, títulos lançados e extratos; lida pelo servidor em /api/atividades-fin, só leitura) e o próprio Sorelly Admin (Pix direcionados, baixas dadas no sistema, saldos das contas e Financeiro familiar; lidos do estado).
// ACESSO RESTRITO: só as pessoas de PESSOAS_ATIVIDADES_FIN (domain/atividades-fin.js; o menu esconde para as demais e o servidor confere pelo pessoaId da conta). Os dados da DevMaster NÃO ficam no estado: são lidos a cada abertura.
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { Segmentado } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { corSituacao, diaBr, diasComSaldo, hojeIso, horaDe, linhasDoAdmin, r2, situacaoDe } from "@/apps/montagem/domain/atividades-fin";
import { chamar } from "@/apps/montagem/lib/api";
import { BKC } from "@/apps/montagem/lib/format";
import { Bt } from "@/apps/montagem/pages/compras/pecas";
import { use } from "@/apps/montagem/state/context";
import { e, useCallback, useEffect, useState } from "@/shared/react";

function AbaAtividadesFinanceiro(){
  var cx = use(), s = cx.state, pd = useState(7), dias = pd[0], dd = useState(null), dados = dd[0], er = useState(""), erroTxt = er[0], oc = useState(false), ocupado = oc[0];
  var carregar = useCallback(function(n, agora){
    oc[1](true);
    return chamar("GET", "/atividades-fin?dias="+n+(agora ? "&agora=1" : "")).then(function(j){ dd[1](j); er[1](""); }).catch(function(x){ er[1](x && x.message || "Não consegui ler as atividades na DevMaster."); }).then(function(){ oc[1](false); });
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function(){ carregar(dias); }, [carregar, dias]);

  var hoje = hojeIso(), de = dados ? dados.de : hoje;
  var doServidor = dados ? dados.linhas.map(function(l){ return Object.assign({}, l, {sistema:"DevMaster"}); }) : [];
  var doAdmin = linhasDoAdmin(s, de);
  var todas = doServidor.concat(doAdmin).sort(function(a, b){ return a.dia<b.dia ? 1 : a.dia>b.dia ? -1 : a.pessoa.localeCompare(b.pessoa, "pt-BR") || a.tipo.localeCompare(b.tipo, "pt-BR"); });

  // ── ROTINA: uma linha por atividade
  var resumo = function(nome, sistema, filtro, informativo){
    var ls = todas.filter(filtro), ult = ls[0] || null, n = ls.reduce(function(t, l){ return t+l.n; }, 0), v = r2(ls.reduce(function(t, l){ return t+l.valor; }, 0));
    var quem = ult ? ls.filter(function(l){ return l.dia===ult.dia; }).map(function(l){ return l.pessoa; }).filter(function(p, i, a){ return a.indexOf(p)===i; }).join(", ") : "—";
    return {id:nome, ativ:nome, sistema:sistema, ult:ult ? diaBr(ult.dia) : "—", quem:quem, qtd:String(n), valor:v, sit:situacaoDe(ult ? ult.dia : "", hoje, informativo)};
  };
  var tipoE = function(t){ return function(l){ return l.tipo===t; }; }, comeca = function(t){ return function(l){ return l.tipo.indexOf(t)===0; }; };
  var rotina = [];
  if(dados){
    rotina.push(resumo("Baixa de recebimento", "DevMaster", tipoE("Baixa de recebimento")));
    rotina.push(resumo("Baixa de pagamento", "DevMaster", tipoE("Baixa de pagamento")));
    rotina.push(resumo("Transferência entre contas", "DevMaster", tipoE("Transferência (saída)")));
    rotina.push(resumo("Estorno de pagamento", "DevMaster", tipoE("Estorno de pagamento"), true));
    rotina.push(resumo("Estorno de recebimento", "DevMaster", tipoE("Estorno de recebimento"), true));
    var tt = dados.titulos || [], ultT = tt[0];
    rotina.push({id:"titulos", ativ:"Título a pagar lançado", sistema:"DevMaster", ult:ultT ? diaBr(ultT.dia) : "—", quem:"—", qtd:String(tt.reduce(function(t, x){ return t+x.n; }, 0)), valor:r2(tt.reduce(function(t, x){ return t+x.valor; }, 0)), sit:situacaoDe(ultT ? ultT.dia : "", hoje)});
    (dados.extratos || []).forEach(function(x){ rotina.push({id:"ex|"+x.conta, ativ:"Extrato importado · "+x.conta, sistema:"DevMaster", ult:diaBr(x.ultimo), quem:"—", qtd:x.pendentes+" sem conciliar", valor:"", sit:situacaoDe(x.ultimo, hoje)}); });
    rotina.push(resumo("Pix direcionado", "Sorelly Admin", tipoE("Pix direcionado")));
    rotina.push(resumo("Baixa no Contas a pagar", "Sorelly Admin", tipoE("Contas a pagar: deu baixa")));
    var ds = diasComSaldo(s), ultS = ds[ds.length-1] || "";
    rotina.push({id:"saldos", ativ:"Saldo das contas lançado", sistema:"Sorelly Admin", ult:diaBr(ultS), quem:"—", qtd:String(ds.filter(function(d){ return d>=de; }).length)+" dias", valor:"", sit:situacaoDe(ultS, hoje)});
    rotina.push(resumo("Financeiro familiar", "Sorelly Admin", comeca("Financeiro familiar"), true));
  }
  var colsRotina = [{k:"ativ", t:"Atividade"}, {k:"sistema", t:"Sistema"}, {k:"ult", t:"Última vez"}, {k:"quem", t:"Quem fez por último"}, {k:"qtd", t:"No período"}, {k:"valor", t:"Valor no período", fmt:function(v){ return v==="" ? "—" : BKC(v); }}, {k:"sit", t:"Situação", cor:corSituacao}];

  // ── POR PESSOA E DIA
  var colsDia = [{k:"data", t:"Data"}, {k:"pessoa", t:"Pessoa"}, {k:"sistema", t:"Sistema"}, {k:"tipo", t:"Atividade"}, {k:"n", t:"Quantidade"}, {k:"valor", t:"Valor", fmt:BKC}, {k:"de", t:"Primeira"}, {k:"ate", t:"Última"}];
  var linhasDia = todas.map(function(l, i){ return {id:String(i), data:diaBr(l.dia), pessoa:l.pessoa, sistema:l.sistema, tipo:l.tipo, n:String(l.n), valor:l.valor, de:l.de || "—", ate:l.ate || "—"}; });

  // ── PARA CORRIGIR
  var er3 = dados ? dados.erros : null;
  var linhasErro = er3 ? [
    {id:"sv", prob:"Título a pagar sem vencimento", qtd:String(er3.semVencimento), onde:"DevMaster › Contas a Pagar"},
    {id:"ae", prob:"Título a pagar com ano de vencimento errado", qtd:String(er3.anoErrado), onde:"DevMaster › Contas a Pagar"},
    {id:"ps", prob:"Título baixado que ainda tem saldo", qtd:String(er3.pagoComSaldo), onde:"DevMaster › Contas a Pagar"}] : [];
  var colsErro = [{k:"prob", t:"Problema"}, {k:"qtd", t:"Quantidade", cor:function(l){ return l.qtd!=="0" ? "text-warning" : "text-success"; }}, {k:"onde", t:"Onde corrigir"}];

  var topo = e("div",{className:"flex flex-wrap items-center gap-2 rounded-lg border-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    e("h2",{className:"shrink-0 whitespace-nowrap text-[13px] font-bold uppercase"}, "Atividades do Financeiro"),
    e(Segmentado,{opcoes:[[1, "Hoje"], [7, "7 dias"], [30, "30 dias"]], atual:dias, onMudar:function(n){ pd[1](n); }}),
    dados && e("span",{className:"whitespace-nowrap text-[13px] tabular-nums"}, diaBr(dados.de)+" a "+diaBr(dados.ate)+" · lido às "+horaDe(dados.geradoEm)),
    e("span",{className:"ml-auto flex flex-wrap items-center gap-2"}, e(Bt,{tipo:"normal", disabled:ocupado, onClick:function(){ carregar(dias, true); }}, ocupado ? "Lendo a DevMaster" : "Atualizar agora")));
  var aviso = function(t){ return e("p",{className:"rounded-lg border-2 border-[var(--bloco-titulo)] bg-card/60 px-3 py-4 text-center text-[13px]"}, t); };

  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    topo,
    erroTxt ? aviso(erroTxt) : !dados ? aviso("Lendo as atividades na DevMaster.") :
      e("div",{className:"flex min-w-0 flex-col gap-2"},
        e(BlocoPainel,{titulo:"Rotina", compacto:true},
          e("div",{className:"min-h-0 flex-1"}, e(TabelaPlanilha,{cols:colsRotina, linhas:rotina, chave:"id", grade:true, centro:true, semContagem:true, semLimpar:true, vazio:"Sem atividades no período."}))),
        e(BlocoPainel,{titulo:"Por pessoa e dia", compacto:true, dir:linhasDia.length+""},
          e("div",{className:"min-h-0 flex-1"}, e(TabelaPlanilha,{cols:colsDia, linhas:linhasDia, chave:"id", grade:true, centro:true, semContagem:true, limite:100, vazio:"Sem atividades no período."}))),
        e(BlocoPainel,{titulo:"Para corrigir", compacto:true},
          e("div",{className:"min-h-0 flex-1"}, e(TabelaPlanilha,{cols:colsErro, linhas:linhasErro, chave:"id", grade:true, centro:true, semFiltro:true, semContagem:true, semLimpar:true, vazio:"Nada para corrigir."})))));
}

export { AbaAtividadesFinanceiro };
