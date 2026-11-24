// Sorelly Admin · montagem — pages/pf/Resumo.js
// GERAL (Pagamentos a Fornecedores): o "RESUMO MÊS" da planilha, ao vivo. Abre no MÊS atual; troca de mês ou ano todo; escolhe um fornecedor e vê mês a mês.
// DOIS FORMATOS (botões no alto): BLOCOS (cartões grandes) e PLANILHA (tudo em tabela).
// Blocos: sempre as 3 dezenas do mês E as 3 dezenas do mês seguinte; concluída em verde, pagando agora em azul (já aberta), atrasada em vermelho. Clicar abre o mês e a dezena direto.
// Pontual: tudo que passa no cartão em um mês desconta a partir da 1ª dezena do mês seguinte (parcelas dos cartões dos meses anteriores + a estimativa do mês que ainda não fechou:
// passou -5%, dividido em 3 parcelas, "a confirmar"; os números EST_DESC e EST_PARC abaixo são provisórios).
// As contas ficam em domain/pf.js (contaForn, janelasDoForn, pagoPix, mqAplicado, mq*); aqui só o desenho. Sócios ficam no Financeiro familiar.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { FORMAS, janelaPorChave, pagoJanela } from "@/apps/montagem/domain/pf";
import { nomeJanela } from "@/apps/montagem/domain/pf-mes";
import { baixaDividas, prazoDaDivida } from "@/apps/montagem/domain/financeiro-familiar";
import { obterArquivo } from "@/apps/montagem/lib/arquivos";
import { buscarAnexo, enviarAnexo, lerArquivo as lerAnexo } from "@/apps/montagem/lib/anexo";
import { cicloDe, contaForn, ehPrestador, hojeIso, janelasDoForn, lancDaJanela, mesAtual, mesLabel, mqAplicado, mqBruto, mqDescontoNoMes, mqOrigensDoMes, mqPassadasDoMes, mqParcela, pagoPix, statusConta } from "@/apps/montagem/domain/pf";
import { limiteDe, usoMes } from "@/apps/montagem/domain/pf-limite";
import { LINHA, Tab, Td } from "@/apps/montagem/components/padrao";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { BarraTabela, BuscaMini, CampoMini, CelulaBarra, CLS_FINA_ESPACO, PAGINA_CHEIA } from "@/apps/montagem/components/planilha-cheia";
import { COR, Chip, Etiqueta, Sel, aviso, corForn, TD, Tile, brl, dbr, op, th, usePf } from "@/apps/montagem/pages/pf/ui";
import { PageHead } from "@/apps/montagem/ui/page";
import { JanelaPedido, pedidoNovo } from "@/apps/montagem/pages/pf/Negociacoes";
import { ModalForn } from "@/apps/montagem/pages/pf/Fornecedores";
import { LimiteAno } from "@/apps/montagem/pages/pf/Limite";
import { e, useEffect, useRef, useState } from "@/shared/react";
import { AcoesLanc, BotaoMini, COMPACTA } from "./Lancamentos";
import { JanelaLancarPag } from "./JanelaLancarPag";

var COMP_SOBE = {};   // comprovantes já tentados nesta sessão (não repete)
var tdn = TD+" text-right font-mono whitespace-nowrap";
var ANO = 2026;
var EST_DESC = 0.05, EST_PARC = 3;   // estimativa do cartão do mês que ainda não fechou: passou -5%, em 3 parcelas (a confirmar com o Marcus)
var MESES_ANO = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map(function(m){ return ANO+"-"+m; });
var somaC = function(l, k){ return l.reduce(function(t, x){ return t+x.c[k]; }, 0); };
var mesMais = function(m, n){ var a = m.split("-"), t = parseInt(a[0], 10)*12+parseInt(a[1], 10)-1+n; return Math.floor(t/12)+"-"+String(t%12+1).padStart(2, "0"); };
// cores por situação da divisão
var SIT = {ok:{cor:COR.green, txt:"Concluído"}, atrasado:{cor:COR.red, txt:"Atrasado"}, agora:{cor:"#CBD5E1", txt:"Pagando agora"}, aberto:{cor:COR.gray, txt:"Em aberto"}};

// janelas (dezenas) de um fornecedor num mês, com pix, cartão, estimativa do cartão (só Pontual, 1ª dezena) e situação; "agora" = a primeira com saldo
function janelasMes(pf, f, mes, hoje){
  var js = janelasDoForn(pf, f.id).filter(function(j){ return j.mes===mes; }).sort(function(a, b){ return a.limite.localeCompare(b.limite); }), achou = false;
  var ehMq = f.id===pf.mqFornId, prev = mesMais(mes, -1), estParc = (ehMq && !pf.mqFech[prev] && mqBruto(pf, prev)>0) ? mqBruto(pf, prev)*(1-EST_DESC)/EST_PARC : 0, per = cicloDe(f).periodicidade;
  return js.map(function(j, i){
    var pix = pagoPix(pf, j.chave), cart = mqAplicado(pf, j.chave), pago0 = Math.min(pix+cart, j.total), falta0 = Math.max(0, j.total-pago0);
    var est = (i===0 && estParc>0) ? Math.min(estParc, falta0) : 0, falta = falta0-est, ehAtual = !achou && falta>0.005 && mes===mesAtual(); if(ehAtual) achou = true;   // "pagando agora" só vale no mês em andamento
    var sit = falta<=0.005 ? "ok" : (j.limite<hoje ? "atrasado" : (ehAtual ? "agora" : "aberto"));
    return {j:j, i:i, rot:per==="d10" ? (i+1)+"ª dezena" : (js.length>1 ? (i+1)+"º acerto" : "Acerto do mês"), pix:pix, cart:cart, est:est, pago:pago0+est, falta:falta, sit:sit};
  });
}
var abertoPadrao = function(x, mes){ return mes===mesAtual() && (x.sit==="agora" || x.sit==="atrasado"); };

// pagamentos de uma dezena (tabela)
function Pagamentos(p){
  var x = p.x, lanc = lancDaJanela(p.pf, x.j.chave);
  if(!lanc.length) return null;
  return e("div",{className:"overflow-hidden rounded-xl bg-black/25"},
    lanc.length ? e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",null, th("Data"), th("Revendedora / origem"), th("Valor","text-right"), th("Conta"))),
      e("tbody",null, lanc.map(function(l){ return e("tr",{key:l.id, className:"border-t border-border/40"}, e("td",{className:TD}, dbr(l.data)), e("td",{className:TD}, l.revendedora), e("td",{className:tdn}, brl(l.valor)), e("td",{className:TD}, l.conta)); }))))
      : null);
}

// BLOCOS: as dezenas de UM mês como cartões grandes (só a que está em andamento ou atrasada abre sozinha); clicar abre o mês e a dezena
function MesBlocos(p){
  var pf = p.pf, lista = janelasMes(pf, p.f, p.mes, p.hoje);
  var estaAberta = function(x){ var k = "w|"+x.j.chave; return p.abertos[k]===undefined ? abertoPadrao(x, p.mes) : p.abertos[k]; };
  return e("div",{className:"flex flex-col gap-2 px-3 py-2"},
    p.titulo && e("div",{className:"text-[14px] font-bold uppercase tracking-wide text-[#F3D98B]"}, p.titulo),
    !lista.length ? e("p",{className:"py-2 text-[14px] text-white"}, "Sem dezenas neste mês.") : e("div",{className:"grid grid-cols-1 gap-3 "+(lista.length>=3 ? "md:grid-cols-3" : lista.length===2 ? "md:grid-cols-2" : "")}, lista.map(function(x){
      var k = "w|"+x.j.chave, ab = estaAberta(x), s = SIT[x.sit];
      return e("button",{key:k, type:"button", onClick:function(){ p.alterna(k, ab); }, className:"flex flex-col items-center gap-1 rounded-2xl px-3 py-3 text-center transition hover:brightness-125", style:{background:"linear-gradient(160deg,"+s.cor+(x.sit==="ok" ? "44" : "33")+","+s.cor+"0d 75%)", boxShadow:"inset 0 0 0 "+(x.sit==="agora" || x.sit==="atrasado" ? "2px " : "1px ")+s.cor}},
        e("span",{className:"text-[13px] font-bold uppercase tracking-wide text-white"}, x.rot+" · até "+dbr(x.j.limite).slice(0, 5)),
        e("span",{className:"text-[11.5px] font-bold uppercase", style:{color:s.cor}}, x.sit==="ok" ? "✓ "+s.txt+(x.est>0 ? " (com estimativa)" : "") : s.txt),
        e("b",{className:"font-mono text-[30px] leading-none", style:{color:x.sit==="ok" ? COR.green : "#fff"}}, x.sit==="ok" ? brl(x.j.total) : brl(x.falta)),
        e("span",{className:"text-[12.5px] font-semibold text-white"}, x.sit==="ok" ? "pago por inteiro" : "falta pagar de "+brl(x.j.total)),
        e("span",{className:"text-[12px] text-white"}, "Pix "+brl(x.pix)+(x.cart>0.005 ? " · 💳 cartão "+brl(x.cart) : "")),
        x.est>0 && e("span",{className:"rounded-md px-2 py-0.5 text-[11.5px] font-bold text-white", style:{background:COR.purple+"55", boxShadow:"inset 0 0 0 1px "+COR.purple}}, "💳 estimado "+brl(x.est)+" · a confirmar"));
    })),
    lista.filter(estaAberta).map(function(x){ return e(Pagamentos,{key:"t|"+x.j.chave, pf:pf, x:x}); }));
}

// PLANILHA: as dezenas de vários meses numa tabela (mês em faixa, uma linha por dezena); clicar numa dezena abre os pagamentos
function TabelaDezenas(p){
  var pf = p.pf;
  var linhas = [];
  p.meses.forEach(function(m){
    var lista = janelasMes(pf, p.f, m, p.hoje); if(!lista.length) return;
    var ta = lista.reduce(function(t, x){ return t+x.j.total; }, 0), tf = lista.reduce(function(t, x){ return t+x.falta; }, 0);
    linhas.push(e("tr",{key:"m|"+m, style:{background:"#3B82F633"}}, e("td",{colSpan:2, className:TD+" border-l-4 border-l-[#3B82F6] font-bold uppercase text-white"}, p.f.nome+" · "+mesLabel(m+"-01")), e("td",{className:tdn+" font-bold"}, brl(ta)), e("td",{className:tdn}), e("td",{className:tdn}), e("td",{className:tdn+" font-bold", style:{color:tf>0.005 ? COR.red : COR.green}}, brl(tf)), e("td",{className:TD})));
    lista.forEach(function(x){
      var k = "w|"+x.j.chave, ab = p.abertos[k]===undefined ? abertoPadrao(x, m) : p.abertos[k];
      linhas.push(e("tr",{key:k, onClick:function(){ p.alterna(k, ab); }, className:"cursor-pointer border-b border-border/50 hover:bg-white/5"},
        e("td",{className:TD+" border-l-4 border-l-[#3B82F6] pl-4"}, x.rot), e("td",{className:TD}, "até "+dbr(x.j.limite).slice(0, 5)), e("td",{className:tdn}, brl(x.j.total)),
        e("td",{className:tdn}, brl(x.pix)), e("td",{className:tdn}, x.cart+x.est>0.005 ? brl(x.cart)+(x.est>0 ? " + "+brl(x.est)+" est." : "") : "—"),
        e("td",{className:tdn+" font-bold", style:{color:x.falta>0.005 ? COR.red : COR.green}}, brl(x.falta)), e("td",{className:TD}, e(Chip,{s:{texto:SIT[x.sit].txt+(x.est>0 && x.sit==="ok" ? " (est.)" : ""), cor:SIT[x.sit].cor===COR.green ? "green" : x.sit==="atrasado" ? "red" : x.sit==="agora" ? "blue" : "gray"}}))));
      if(ab && lancDaJanela(pf, x.j.chave).length) linhas.push(e("tr",{key:k+"|d"}, e("td",{colSpan:7, className:"bg-black/30 p-2"}, e(Pagamentos,{pf:pf, x:x}))));
    });
  });
  if(!linhas.length) return e("p",{className:"px-3 py-3 text-[14px] text-white"}, "Sem dezenas nesses meses.");
  return e("div",{className:"overflow-x-auto p-2"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",null, th("Dezena"), th("Até"), th("A pagar","text-right"), th("Pix pago","text-right"), th("Cartão (desconto)","text-right"), th("Falta","text-right"), th("Status"))), e("tbody",null, linhas)));
}

// TABELA DE DESCONTOS, igual à planilha "Relação de descontos - cartão Pontual": uma linha por mês de compra no cartão (valor total, juros, líquido, parcelas, valor da parcela)
// e uma coluna por mês em que o desconto cai. Mostra o mês atual para a frente, até onde ainda há desconto; os meses que já acabaram ficam em cima, para abrir.
function TabelaDescontos(p){
  var pf = p.pf, atual = mesAtual(), prox = mesMais(atual, 1), set = {}, todos = !!p.todos;
  Object.keys(pf.mqFech).forEach(function(m){ set[m] = 1; }); pf.mqPassadas.forEach(function(x){ set[x.data.slice(0, 7)] = 1; });
  var origens = Object.keys(set).sort().map(function(m){
    var bruto = mqBruto(pf, m), fe = pf.mqFech[m], est = !fe, liq = fe ? fe.liquido : bruto*(1-EST_DESC), par = fe ? fe.parcelas : EST_PARC;
    return {m:m, bruto:bruto, liq:liq, par:par, parc:par>0 ? liq/par : 0, est:est, meses:Array.from({length:par}, function(_, i){ return mesMais(m, i+1); })};
  }).filter(function(o){ return o.bruto>0 || !o.est; });
  var ultimo = origens.reduce(function(mx, o){ return o.meses.length && o.meses[o.meses.length-1]>mx ? o.meses[o.meses.length-1] : mx; }, prox);
  var tot = function(m){ return origens.reduce(function(t, o){ return t+(o.meses.indexOf(m)>=0 ? o.parc : 0); }, 0); };
  // colunas: todos os meses com desconto; os de mais de 5 meses atrás ficam fechados até clicar em "Abrir todos"
  var cols = [], fim = ultimo>ANO+"-12" ? ultimo : ANO+"-12"; for(var c = ANO+"-01"; c<=fim && cols.length<24; c = mesMais(c, 1)) cols.push(c);
  cols = cols.filter(function(m){ return tot(m)>0.005; });
  var corte = mesMais(atual, -5), fechadas = cols.filter(function(m){ return m<corte; }).length, colsVis = todos ? cols : cols.filter(function(m){ return m>=corte; });
  var comprasDe = function(o){
    var ls = mqPassadasDoMes(pf, o.m).map(function(x){ return {id:x.id, data:x.data, rev:x.rev, valor:x.valor, band:x.band, parc:x.parc, maq:x.maq}; });
    return e(TabelaPlanilha,{escura:true, grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, semFiltro:true, chave:"id", linhas:ls, vazio:"Nenhuma compra lançada neste mês.",
      cols:[{k:"data", t:"Data", fmt:dbr}, {k:"rev", t:"Revendedora"}, {k:"valor", t:"Valor", fmt:brl}, {k:"band", t:"Bandeira"}, {k:"parc", t:"Parcelas"}, {k:"maq", t:"Maquininha"}],
      totalRodape:function(){ return ["Total · "+ls.length+" compras", "", brl(ls.reduce(function(t, x){ return t+x.valor; }, 0)), "", "", ""]; }});
  };
  var linha = function(o){ var r = {id:o.m, ano:o.m.slice(0, 4), mes:mesLabel(o.m+"-01").split("/")[0], est:o.est, bruto:o.bruto, liq:o.liq};
    colsVis.forEach(function(m){ r["c_"+m] = o.meses.indexOf(m)>=0 ? o.parc : null; }); return r; };
  var porId = {}; origens.forEach(function(o){ porId[o.m] = o; });
  var somaK = function(k){ return origens.reduce(function(t, o){ return t+(k==="bruto" ? o.bruto : o.liq); }, 0); };
  // o total fica na primeira linha: abrir um mês não o empurra para baixo
  var totLinha = {id:"__tot", ano:"", mes:"Total", bruto:somaK("bruto"), liq:somaK("liq")}; colsVis.forEach(function(m){ totLinha["c_"+m] = tot(m); });
  var linhas = [totLinha].concat(origens.map(linha));
  var vz = function(v){ return v==null ? "" : brl(v); };
  var tabela = e(TabelaPlanilha,{escura:true, grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, semFiltro:true, chave:"id", linhas:linhas,
    detalhe:function(l){ if(l.id==="__tot") return null; var o = porId[l.id]; return e("div",{className:"m-1 border-2 border-white/60"}, e(TabelaPlanilha,{escura:true, grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, semFiltro:true, chave:"id", linhas:[{id:"c", juros:Math.max(0, o.bruto-o.liq), par:o.par+"x", parc:o.parc}], cols:[{k:"juros", t:"Juros", fmt:brl}, {k:"par", t:"Parcelas"}, {k:"parc", t:"Valor da parcela", fmt:brl}]}), comprasDe(o)); },
    linhaCls:function(l){ return l.id==="__tot" ? "bg-white/10 font-bold" : l.id===atual ? "bg-white/10" : ""; },
    cols:[{k:"ano", t:"Ano", w:"3.5rem"}, {k:"mes", t:"Mês", cor:function(l){ return l.est ? "text-warning" : ""; }}, {k:"bruto", t:"Valor total", fmt:vz}, {k:"liq", t:"Líquido", fmt:vz}]
      .concat(colsVis.map(function(m){ return {k:"c_"+m, t:mesLabel(m+"-01").slice(0, 3)+"/"+m.slice(2, 4), fmt:vz}; }))});
  return tabela;
}

// maquininha em BLOCOS, no estilo da planilha "Relação de descontos - cartão Pontual": valor total, juros, líquido, parcelas e o desconto que cai no mês
function Maquininha(p){
  var pf = p.pf, corMes = p.cor || COR.blue, m = p.mes, bruto = mqBruto(pf, m), fech = pf.mqFech[m], pas = mqPassadasDoMes(pf, m), desc = mqDescontoNoMes(pf, m), orig = mqOrigensDoMes(pf, m);
  var liq = fech ? fech.liquido : bruto*(1-EST_DESC), par = fech ? fech.parcelas : EST_PARC, parc = fech ? mqParcela(pf, m) : liq/par, est = !fech;
  var caixa = function(rot, v, sub, cor, tag){ return e("div",{className:"flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-center", style:{background:cor+"22", boxShadow:"inset 0 0 0 1px "+cor+"88"}}, e("span",{className:"text-[12px] font-bold uppercase text-white"}, rot), e("b",{className:"font-mono text-[22px] leading-tight text-white"}, v), e("span",{className:"text-[12px] text-white"}, sub), tag && e("span",{className:"rounded-md px-2 py-0.5 text-[11px] font-bold text-white", style:{background:COR.purple+"55"}}, tag)); };
  return e("div",{className:"flex flex-col gap-2 px-3 py-2"},
    e("div",{className:"rounded-lg px-3 py-1 text-[14px] font-bold uppercase tracking-wide text-white", style:{background:corMes+"44", boxShadow:"inset 0 0 0 1px "+corMes+"99"}}, "Maquininha · cartão de "+mesLabel(m+"-01")+" (desconta a partir da 1ª dezena de "+mesLabel(mesMais(m, 1)+"-01")+")"),
    e("div",{className:"grid grid-cols-2 gap-3 md:grid-cols-5"},
      caixa("Valor total", brl(bruto), pas.length+" passadas", COR.blue),
      caixa("Juros", brl(Math.max(0, bruto-liq)), est ? "estimativa -"+Math.round(EST_DESC*100)+"%" : "do fechamento", COR.orange, est ? "a confirmar" : null),
      caixa("Líquido", brl(liq), est ? "estimado" : "fechado", COR.purple, est ? "a confirmar" : null),
      caixa("Parcelas", par+"x", "de "+brl(parc)+" a partir de "+mesLabel(mesMais(m, 1)+"-01"), COR.cyan, est ? "a confirmar" : null),
      caixa("Desconto que cai em "+mesLabel(m+"-01").slice(0, 3), brl(desc), orig.length ? orig.map(function(o){ return mesLabel(o.comp+"-01").slice(0, 3)+" "+brl(o.valor)+" ("+o.i+"/"+o.n+")"; }).join(" · ") : "nenhum", COR.green)),
    p.lista && pas.length>0 && e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",null, th("Data"), th("Revendedora"), th("Valor","text-right"), th("Bandeira"), th("Parcelas"), th("Maquininha"))),
      e("tbody",null, pas.map(function(x){ return e("tr",{key:x.id, className:"border-t border-border/40"}, e("td",{className:TD}, dbr(x.data)), e("td",{className:TD}, x.rev), e("td",{className:tdn}, brl(x.valor)), e("td",{className:TD}, x.band), e("td",{className:TD}, x.parc), e("td",{className:TD}, x.maq)); })))));
}

// PLANILHA no estilo da Análise de custos (Contas a pagar): um mês por linha (pago, falta, total, % e barra); abre as dezenas; cada dezena abre os pagamentos
function TabelaAnalise(p){
  var pf = p.pf, meses = p.meses.map(function(m){ return {m:m, js:janelasMes(pf, p.f, m, p.hoje)}; }).filter(function(x){ return x.js.length; });
  if(!meses.length) return e("p",{className:"px-3 py-4 text-center text-[11px]"}, "Nada lançado para este fornecedor em "+ANO+".");
  var TJA = {escura:true, grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, semFiltro:true};
  var tot = function(js, k){ return js.reduce(function(t, x){ return t+(k==="total" ? x.j.total : x[k]); }, 0); };
  var pct = function(a2, b2){ return b2>0 ? (a2/b2*100).toFixed(1).replace(".", ",")+"%" : "—"; };
  var corSitA = function(t){ return t==="Concluído" ? "text-success" : t==="Atrasado" ? "text-destructive" : t==="Pagando agora" ? "text-white font-bold" : ""; };
  var comBorda = function(el){ return el ? e("div",{className:"m-1 border-2 border-white/60"}, el) : null; };
  var pagamentos = function(d){
    var lanc = lancDaJanela(pf, d.j.chave); if(!lanc.length) return null;
    return e(TabelaPlanilha, Object.assign({}, TJA, {chave:"id", linhas:lanc.map(function(l){ return {id:l.id, data:l.data, rev:l.revendedora, valor:l.valor, conta:l.conta}; }),
      cols:[{k:"data", t:"Data", fmt:dbr}, {k:"rev", t:"Revendedora ou origem"}, {k:"valor", t:"Valor", fmt:brl}, {k:"conta", t:"Conta"}]}));
  };
  var dezenas = function(l){
    var ls = l.x.js.map(function(d){ return {id:d.j.chave, rot:d.rot+" · até "+dbr(d.j.limite).slice(0, 5), sit:SIT[d.sit].txt+(d.est>0 ? " (est.)" : ""), pago:d.pago, falta:d.falta, total:d.j.total, pct:pct(d.pago, d.j.total), d:d}; });
    return e(TabelaPlanilha, Object.assign({}, TJA, {chave:"id", linhas:ls, detalhe:function(r){ return comBorda(pagamentos(r.d)); }, detAberto:function(){ return false; },
      cols:[{k:"rot", t:"Dezena"}, {k:"sit", t:"Situação", cor:function(r){ return corSitA(r.sit.replace(" (est.)", "")); }}, {k:"pago", t:"Pago", fmt:brl, cor:function(r){ return r.pago>0 ? "text-success" : ""; }}, {k:"falta", t:"Falta pagar", fmt:brl, cor:function(r){ return r.falta>0.005 ? "text-warning" : ""; }}, {k:"total", t:"A pagar", fmt:brl}, {k:"pct", t:"% pago"}]}));
  };
  var base = meses.reduce(function(t, x){ return t+tot(x.js, "total"); }, 0);
  var linhas = meses.map(function(x, i){ var tt = tot(x.js, "total"), pg = tot(x.js, "pago"); return {id:x.m, n:i+1, mes:mesLabel(x.m+"-01")+" · "+x.js.length+" dezenas", pago:pg, falta:tot(x.js, "falta"), total:tt, pct:pct(pg, tt), x:x}; });
  return e(TabelaPlanilha, Object.assign({}, TJA, {chave:"id", linhas:linhas, detalhe:function(l){ return comBorda(dezenas(l)); }, detAberto:function(){ return false; }, linhaCls:function(l){ return l.id===mesAtual() ? "bg-white/10" : ""; },
    cols:[{k:"n", t:"#", w:"3rem"}, {k:"mes", t:"Mês", cor:function(){ return ""; }}, {k:"pago", t:"Pago", fmt:brl, cor:function(r){ return r.pago>0 ? "text-success" : ""; }}, {k:"falta", t:"Falta pagar", fmt:brl, cor:function(r){ return r.falta>0.005 ? "text-warning" : ""; }}, {k:"total", t:"A pagar", fmt:brl}, {k:"pct", t:"% pago"}],
    totalRodape:function(){ return ["", "Total", brl(meses.reduce(function(t, x){ return t+tot(x.js, "pago"); }, 0)), brl(meses.reduce(function(t, x){ return t+tot(x.js, "falta"); }, 0)), brl(base), "100,0%"]; }}));
}

// RESUMO DO ANO de um fornecedor: total, pago até agora, falta pagar e, na Pontual, quanto passou na maquininha e quanto já foi descontado
function ResumoAno(p){
  var pf = p.pf, f = p.f, cs = MESES_ANO.map(function(m){ return contaForn(pf, f.id, m); });
  var total = cs.reduce(function(t, c){ return t+c.total; }, 0), pago = cs.reduce(function(t, c){ return t+c.pago; }, 0), falta = Math.max(0, total-pago), pct = total>0 ? Math.round(pago/total*100) : 0, mq = f.id===pf.mqFornId, atual = mesAtual();
  var passou = mq ? MESES_ANO.reduce(function(t, m){ return t+mqBruto(pf, m); }, 0) : 0;
  var desc = mq ? MESES_ANO.filter(function(m){ return m<=atual; }).reduce(function(t, m){ return t+mqDescontoNoMes(pf, m); }, 0) : 0;
  var descFut = mq ? MESES_ANO.filter(function(m){ return m>atual; }).reduce(function(t, m){ return t+mqDescontoNoMes(pf, m); }, 0) : 0;
  return e(BlocoBarra,{t:f.nome+" · resumo de "+ANO, cor:(corForn(f.nome) || {}).barra || "azul", compacto:true, dir:brl(total)},
    e("div",{className:"flex flex-col gap-3 p-3"},
      e("div",{className:"grid grid-cols-2 gap-3 md:grid-cols-4"}, e(Tile,{t:"Total do ano", v:brl(total), cor:"#CBD5E1", sub:"tudo que é para pagar em "+ANO}), e(Tile,{t:"Pago até agora", v:brl(pago), cor:COR.green, sub:pct+"% do ano"}), e(Tile,{t:"Falta pagar", v:brl(falta), cor:falta>0.005 ? COR.red : COR.green, sub:"do total do ano"}), e(Tile,{t:"Pago do ano", v:pct+"%", cor:"#CBD5E1"})),
      e("div",{className:"h-2 w-full overflow-hidden rounded-full bg-white/10"}, e("div",{className:"h-full rounded-full", style:{width:Math.min(100, pct)+"%", background:COR.green}})),
      mq && e("div",{className:"grid grid-cols-2 gap-3 md:grid-cols-3"}, e(Tile,{t:"Passou na maquininha no ano", v:brl(passou), cor:"#CBD5E1", sub:"compras no cartão"}), e(Tile,{t:"Já descontado", v:brl(desc), cor:COR.green, sub:"até "+mesLabel(atual+"-01")}), e(Tile,{t:"Ainda vai descontar", v:brl(descFut), cor:COR.orange, sub:"nos meses seguintes de "+ANO}))));
}

// o que abre ao clicar num fornecedor na lista de TODOS: sempre em planilha (cada fornecedor é uma situação, então nada de blocos aqui)
function ConteudoMes(p){ return e("div",null, e(ResumoAno,{pf:p.pf, f:p.f}), e(TabelaDezenas,{pf:p.pf, f:p.f, meses:[p.mes], hoje:p.hoje, abertos:p.abertos, alterna:p.alterna})); }
// só na Pontual (botão "Dezenas em blocos"): as 3 dezenas do mês e as 3 do mês seguinte lado a lado
function ConteudoBlocos(p){
  var prox = mesMais(p.mes, 1);
  return e("div",null, e(MesBlocos,{pf:p.pf, f:p.f, mes:p.mes, titulo:mesLabel(p.mes+"-01"), hoje:p.hoje, abertos:p.abertos, alterna:p.alterna}), e(MesBlocos,{pf:p.pf, f:p.f, mes:prox, titulo:mesLabel(prox+"-01")+" · mês seguinte", hoje:p.hoje, abertos:p.abertos, alterna:p.alterna}));
}

// uma linha de fornecedor (ou mês): clicar abre o conteúdo
function Linha(p){
  var f = p.f, c = p.c, k = f.id+"|"+p.mes, ab = p.abertos[k]===undefined ? false : p.abertos[k], st = statusConta(c);
  return [e("tr",{key:k, onClick:function(){ if(p.abrir && !p.rot) p.abrir(f.id); else p.alterna(k, ab); }, className:"cursor-pointer border-b border-border/50 hover:bg-white/5"},
    e("td",{className:TD}, e("b",null, p.rot || f.nome)),
    e("td",{className:tdn}, brl(c.total)), e("td",{className:tdn, style:{color:COR.green}}, brl(c.pago)),
    e("td",{className:tdn, style:{color:c.aberto>0.005 ? COR.red : undefined}}, brl(c.aberto)),
    e("td",{className:TD}, c.dMin ? dbr(c.dMin) : "—"), e("td",{className:TD}, e(Chip,{s:st})))]
    .concat(ab ? [e("tr",{key:k+"|d"}, e("td",{colSpan:6, className:"bg-black/30"}, e(ConteudoMes,{pf:p.pf, f:f, mes:p.mes, hoje:p.hoje, abertos:p.abertos, alterna:p.alterna})))] : []);
}

// PONTUAL (20/10/2026): quadro de totais do ano separando boleto (com nota), Pix em dinheiro (sem nota) e maquininha, e abas por tipo.
// Regra da planilha: boleto que venceu antes do mês atual conta como pago; do mês atual em diante é a pagar (o sistema não marca baixa de boleto).
// "Pix" do sistema já conta o desconto da maquininha como pago (como o ERP); aqui o desconto é separado para ver o Pix em dinheiro.
function dadosPontual(pf, f){
  var ehMq = f.id===pf.mqFornId, atual = mesAtual(), ped = pf.pedidos.filter(function(x){ return x.fornId===f.id; }), bol = [];
  ped.forEach(function(x){ x.parcelas.forEach(function(q){ if(q.forma==="boleto" && q.venc.slice(0, 4)===String(ANO)) bol.push(q); }); });
  var meses = MESES_ANO.map(function(m){
    var bs = bol.filter(function(q){ return q.venc.slice(0, 7)===m; }), bPrev = bs.reduce(function(t, q){ return t+q.valor; }, 0), bPago = bs.filter(function(q){ return q.status==="Pago" || m<atual; }).reduce(function(t, q){ return t+q.valor; }, 0);
    var c = contaForn(pf, f.id, m), mq = ehMq ? mqDescontoNoMes(pf, m) : 0;
    return {m:m, bs:bs, bPrev:bPrev, bPago:bPago, pPrev:c.total, pPago:c.pago, mq:mq, mqPago:m<=atual ? mq : 0};
  });
  var S = function(k){ return meses.reduce(function(t, x){ return t+x[k]; }, 0); };
  return {meses:meses, bPrev:S("bPrev"), bPago:S("bPago"), pPrev:S("pPrev"), pPago:S("pPago"), mq:S("mq"), mqPago:S("mqPago"), nBol:bol.length, passou:ehMq ? MESES_ANO.reduce(function(t, m){ return t+mqBruto(pf, m); }, 0) : 0, ehMq:ehMq};
}
var pc = function(a, b){ return b>0.005 ? Math.round(a/b*100)+"%" : "—"; };
// TELA PRINCIPAL DA PONTUAL (20/10/2026): usada na Geral e nas Negociações. De cima para baixo: maquininha, o que pagar x o que foi pago, os pedidos (para onde vai cada negociação), os meses e o cronograma da maquininha.
function ParcelasPed(p){
  var ls = p.ls, hoje = hojeIso(), atual = mesAtual();
  if(!ls.length) return e("p",{className:"px-3 py-2 text-[13px] text-white"}, "Nenhuma parcela.");
  return e("div",{className:"overflow-hidden rounded-xl bg-black/25"},
    e("div",{className:"flex items-center justify-between px-3 py-1.5 text-[13px] font-bold text-white", style:{background:"rgba(255,255,255,.10)"}}, e("span",null, p.t+" · "+ls.length), e("span",{className:"font-mono"}, brl(ls.reduce(function(t, q){ return t+q.valor; }, 0)))),
    e("div",{className:"max-h-64 overflow-y-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",null, th("Vence"), th("Valor","text-right"), th("Situação"))),
      e("tbody",null, ls.map(function(q, i){ var pago = q.status==="Pago" || (p.boleto && q.venc.slice(0, 7)<atual), atr = !pago && q.venc<hoje;
        var chip = p.boleto ? {texto:pago ? "Pago" : "A pagar", cor:pago ? "green" : "gray"} : {texto:pago ? "Pago" : (atr ? "Atrasado" : "A pagar"), cor:pago ? "green" : (atr ? "red" : "gray")};
        return e("tr",{key:i, className:"border-t border-border/40"}, e("td",{className:TD}, dbr(q.venc)), e("td",{className:tdn}, brl(q.valor)), e("td",{className:TD}, e(Chip,{s:chip}))); })))));
}
// exporta as compras no cartão (data, revendedora, valor, bandeira, parcelas, maquininha) e o desconto de cada mês em um arquivo para abrir no Excel e mandar ao fornecedor
function exportarMaquininha(pf){
  var aspas = function(v){ return '"'+String(v==null ? "" : v).replace(/"/g, '""')+'"'; }, linhas = [["Mês da compra", "Data", "Revendedora", "Valor", "Bandeira", "Parcelas", "Maquininha"].map(aspas).join(";")];
  pf.mqPassadas.slice().sort(function(a, b){ return a.data.localeCompare(b.data); }).forEach(function(x){ linhas.push([x.data.slice(0, 7), dbr(x.data), x.rev, String(Number(x.valor || 0).toFixed(2)).replace(".", ","), x.band, x.parc, x.maq].map(aspas).join(";")); });
  linhas.push(""); linhas.push(["Mês da compra", "Valor total", "Líquido", "Parcelas", "Valor da parcela"].map(aspas).join(";"));
  Object.keys(pf.mqFech).sort().forEach(function(m){ var fe = pf.mqFech[m]; linhas.push([m, String(Number(mqBruto(pf, m)).toFixed(2)).replace(".", ","), String(Number(fe.liquido || 0).toFixed(2)).replace(".", ","), fe.parcelas, String(Number(mqParcela(pf, m)).toFixed(2)).replace(".", ",")].map(aspas).join(";")); });
  try{ var blob = new Blob(["\ufeff"+linhas.join("\r\n")], {type:"text/csv;charset=utf-8"}), a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "maquininha-pontual-"+hojeIso()+".csv"; document.body.appendChild(a); a.click(); document.body.removeChild(a); }catch(x){}
}
function PainelPontual(p){
  var pf = p.pf, f = p.f, D = dadosPontual(pf, f), atual = mesAtual(), prox = mesMais(atual, 1), hoje = hojeIso();
  var smq = useState(false), mqTodos = smq[0], setMqTodos = smq[1], sa = useState(atual.slice(0, 4)), ano = sa[0], setAno = sa[1], sb = useState({}), abPed = sb[0], setAbPed = sb[1];
  var tot = D.bPrev+D.pPrev, pago = D.bPago+D.pPago, falta = Math.max(0, tot-pago), pixDinPago = D.pPago-D.mqPago;
  var mqOn = D.ehMq, esteMes = mqOn ? mqDescontoNoMes(pf, atual) : 0, aFrente = D.mq-D.mqPago;
  var fundo = function(m){ return m===atual ? {background:"rgba(255,255,255,.08)"} : undefined; };
  // 1) MAQUININHA, no alto
  var item = function(rot, v, cor){ return e("div",{key:rot, className:"flex flex-col items-center px-3 text-center"}, e("span",{className:"text-[11px] font-bold uppercase text-white/75"}, rot), e("b",{className:"font-mono text-[20px] leading-tight", style:{color:cor||"#fff"}}, v)); };
  var proximos = [0, 1, 2, 3].map(function(i){ var m = mesMais(atual, i); return mesLabel(m+"-01").slice(0, 3)+" "+brl(mqDescontoNoMes(pf, m)); }).join("  ·  ");
  var AZ = "!bg-[#17284e] [&_[class*=bg-black]]:!bg-transparent "+COMPACTA, TJR = {escura:true, grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, semFiltro:true};
  var maq = !mqOn ? null : e(BlocoPainel,{titulo:"Maquininha · cartão (desconta do Pix)", dir:brl(D.passou), compacto:true, cls:AZ+" [&_table]:!table-fixed [&_table]:!w-full"},
    e(TabelaPlanilha, Object.assign({}, TJR, {chave:"id", linhas:[{id:"m", passou:D.passou, desc:D.mqPago, mes:esteMes, ainda:aFrente}], cols:[{k:"passou", t:"Passou no cartão no ano", fmt:brl}, {k:"desc", t:"Já descontado do Pix", fmt:brl}, {k:"mes", t:"Desconta neste mês", fmt:brl}, {k:"ainda", t:"Ainda vai descontar", fmt:brl}]})));
  // 2) O QUE PAGAR x O QUE FOI PAGO
  var vq = function(v){ return v==null ? "" : brl(v); };
  var linhaQ = function(rot, sub, a, b, cc){ return {id:rot, item:rot+(sub ? " · "+sub : ""), total:a, pago:b, falta:cc, pct:pc(b, a)}; };
  var linhaD = function(rot, v){ return {id:rot, item:"↳ "+rot, total:null, pago:v, falta:null, pct:""}; };
  var quadro = e(BlocoPainel,{titulo:"O que pagar × o que foi pago · "+ANO, dir:brl(falta)+" a pagar", compacto:true, cls:AZ},
    e(TabelaPlanilha, Object.assign({}, TJR, {chave:"id", linhas:[linhaQ("Total do ano", "boleto + Pix", tot, pago, falta), linhaQ("Boleto", D.nBol+" boletos (com nota)", D.bPrev, D.bPago, D.bPrev-D.bPago), linhaQ("Pix", "sem nota", D.pPrev, D.pPago, D.pPrev-D.pPago)]
      .concat(mqOn ? [linhaD("pago em dinheiro (Pix de revendedora)", pixDinPago), linhaD("pago pelo desconto da maquininha", D.mqPago), linhaD("maquininha que ainda vai descontar (dentro do que falta)", null)] : []),
      cols:[{k:"item", t:"Item", cor:function(r){ return r.id==="Total do ano" ? "font-bold" : ""; }}, {k:"total", t:"Total negociado", fmt:vq}, {k:"pago", t:"Já pago", fmt:vq, cor:function(){ return "text-success"; }}, {k:"falta", t:"Falta pagar", fmt:vq, cor:function(r){ return r.falta>0.005 ? "text-warning" : "text-success"; }}, {k:"pct", t:"% pago"}]})),
    e("p",{className:"border-t border-white/30 px-3 py-1 text-center text-[11px]"}, "Boleto vencido antes de "+mesLabel(atual+"-01")+" conta como pago (regra da planilha)."+(mqOn ? " Cada parcela da maquininha é descontada do Pix. Ainda vai descontar: "+brl(aFrente)+"." : "")));
  // 3) PEDIDOS: para onde vai cada negociação
  var anos = Array.from(new Set(pf.pedidos.filter(function(x){ return x.fornId===f.id; }).map(function(x){ return x.data.slice(0, 4); }))).sort();
  var peds = pf.pedidos.filter(function(x){ return x.fornId===f.id && x.data.slice(0, 4)===ano; }).sort(function(a, b){ return a.data.localeCompare(b.data) || a.id-b.id; });
  // UMA linha por MÊS do pedido (17/11/2026, pedido do Lucas): os pedidos, NFs e renegociações do mesmo mês somam juntos; clicar abre TODAS as parcelas (boleto e Pix) do mês em ordem de vencimento
  var nomePed = function(x){ return /^Pontual NF/.test(x.numero) ? x.numero.replace("Pontual ", "") : (/^Renegoc/.test(x.numero) ? "Renegociação" : x.numero); };
  var pagoQ = function(q){ return q.status==="Pago" || (q.forma==="boleto" && q.venc.slice(0, 7)<atual); };   // boleto vencido antes do mês atual conta como pago (regra da planilha)
  var porMes = {};
  peds.forEach(function(x){ var m = x.data.slice(0, 7); (porMes[m] = porMes[m] || []).push(x); });
  var linhasMes = Object.keys(porMes).sort().map(function(m){
    var ps = porMes[m], qs = [];
    ps.forEach(function(x){ x.parcelas.forEach(function(q){ qs.push({venc:q.venc, valor:q.valor, boleto:q.forma==="boleto", pago:pagoQ(q), ped:x}); }); });
    qs.sort(function(a, b){ return a.venc.localeCompare(b.venc) || (a.boleto ? 0 : 1)-(b.boleto ? 0 : 1); });
    var soma = function(fn){ return qs.filter(fn).reduce(function(t, q){ return t+q.valor; }, 0); };
    var vb = soma(function(q){ return q.boleto; }), vp = soma(function(q){ return !q.boleto; }), pg = soma(function(q){ return q.pago; }), tot = ps.reduce(function(t, x){ return t+x.total; }, 0);
    var fl = Math.max(0, vb+vp-pg), atr = qs.some(function(q){ return !q.boleto && !q.pago && q.venc<hoje; });
    return {id:m, mes:m, n:ps.length, total:tot, boleto:vb, pix:vp, pago:pg, falta:fl, vencs:qs.length ? dbr(qs[0].venc)+" a "+dbr(qs[qs.length-1].venc) : "—",
      sit:fl<=0.005 ? "Quitado" : (atr ? "Pix em atraso" : "A pagar"), qs:qs, ps:ps};
  });
  var corSit = function(t){ return t==="Quitado" || t==="Pago" ? "text-success" : (/atraso|Atrasado/.test(t) ? "text-destructive" : "text-warning"); };
  // 3º nível: as parcelas de um tipo (Com NF = boleto, Sem NF = Pix), uma por linha, em ordem de vencimento
  var parcelasTipo = function(t){
    var ls = t.qs.map(function(q, i){ return {id:i, venc:q.venc, valor:q.valor, pedido:nomePed(q.ped), pedId:q.ped.id, paga:q.ped.cnpj || "—", sit:q.pago ? "Pago" : (!q.boleto && q.venc<hoje ? "Atrasado" : "A pagar")}; });
    // clicar na parcela abre o resumo do pedido dela (no lugar dos botões "Abrir pedido", 17/11/2026)
    return e(TabelaPlanilha,{key:t.id, chave:"id", centro:true, semContagem:true, grade:true, semMao:true, semLimpar:true, linhas:ls, linhaCls:function(r){ return r.venc===hoje ? "bg-white/10" : ""; }, aoClicar:p.abrirDetalhe ? function(r){ p.abrirDetalhe(r.pedId); } : undefined,
      cols:[{k:"venc", t:"Vencimento", fmt:function(v){ return dbr(v); }}, {k:"valor", t:"Valor", fmt:brl, cor:function(){ return ""; }}, {k:"pedido", t:"Pedido"}, {k:"paga", t:"Quem paga"}, {k:"sit", t:"Situação", cor:function(r){ return corSit(r.sit); }}],
      totalRodape:function(rs){ var s = rs.reduce(function(a, r){ return a+r.valor; }, 0), pg = rs.filter(function(r){ return r.sit==="Pago"; }).reduce(function(a, r){ return a+r.valor; }, 0);
        return ["Total · "+rs.length+" parcelas", brl(s), "", "Pago "+brl(pg), "Falta "+brl(Math.max(0, s-pg))]; }});
  };
  // 2º nível: o mês dividido em Com NF (boleto) e Sem NF (Pix); clicar abre as parcelas daquele tipo
  var detalheMes = function(l){
    var tipos = [{id:l.id+"|nf", rot:"Com NF · boleto", boleto:true}, {id:l.id+"|sem", rot:"Sem NF · Pix", boleto:false}].map(function(t){
      var qs = l.qs.filter(function(q){ return q.boleto===t.boleto; }), soma = function(fn){ return qs.filter(fn).reduce(function(a, q){ return a+q.valor; }, 0); };
      var tot = soma(function(){ return true; }), pg = soma(function(q){ return q.pago; }), fl = Math.max(0, tot-pg), atr = qs.some(function(q){ return !q.boleto && !q.pago && q.venc<hoje; });
      return {id:t.id, rot:t.rot, n:qs.length, total:tot, pago:pg, falta:fl, vencs:qs.length ? dbr(qs[0].venc)+" a "+dbr(qs[qs.length-1].venc) : "—", sit:!qs.length ? "—" : (fl<=0.005 ? "Quitado" : (atr ? "Pix em atraso" : "A pagar")), qs:qs};
    }).filter(function(t){ return t.n>0; });
    return e("div",{className:"flex flex-col gap-2"},
      e(TabelaPlanilha,{key:l.id, chave:"id", centro:true, semContagem:true, semFiltro:true, grade:true, semMao:true, semLimpar:true, linhas:tipos, detalhe:parcelasTipo,
        cols:[{k:"rot", t:"Tipo", cor:function(t){ return ""; }}, {k:"n", t:"Parcelas"}, {k:"total", t:"Total", fmt:brl, cor:function(){ return ""; }},
          {k:"pago", t:"Já pago", fmt:brl, cor:function(){ return "text-success"; }}, {k:"falta", t:"Falta", fmt:brl, cor:function(t){ return (t.falta>0.005 ? "text-warning" : "text-success"); }},
          {k:"vencs", t:"Vencimentos"}, {k:"sit", t:"Situação", cor:function(t){ return corSit(t.sit); }}]}));
  };
  var anoBtn = function(a){ var on = a===ano; return e("button",{key:a, type:"button", onClick:function(){ setAno(a); }, className:"h-8 rounded-lg px-4 text-[13px] font-bold ring-1 "+(on ? "text-white" : "bg-muted/40 text-white/85 ring-white/15 hover:bg-white/10"), style:on ? {background:"linear-gradient(135deg,#3B82F666,#3B82F622)", boxShadow:"inset 0 0 0 1px #3B82F6cc"} : undefined}, a); };
  var pedidos = e(BlocoPainel,{titulo:"Pedidos e negociações · para onde vai cada pagamento", dir:linhasMes.length+" meses · "+peds.length+" pedidos em "+ano, compacto:true, cls:AZ},
    e("div",{className:"p-1"}, e("div",{className:"mb-1 flex flex-wrap items-center justify-center gap-2 px-1 text-[11px]"}, e("span",{className:"font-bold uppercase"}, "Ano"), e("select",{value:ano, "aria-label":"Ano", onChange:function(ev){ setAno(ev.target.value); }, className:"rounded border border-white/25 bg-white/10 px-1 text-center text-white"}, anos.map(function(a){ return e("option",{key:a, value:a}, a); })), e("span",null, "Clique no mês para ver Com NF e Sem NF; clique no tipo para ver cada parcela")),
      e(TabelaPlanilha,{key:ano, chave:"id", centro:true, semContagem:true, grade:true, semMao:true, semLimpar:true, linhas:linhasMes, detalhe:detalheMes, linhaCls:function(l){ return l.mes===atual ? "bg-white/5" : ""; }, vazio:"Nenhum pedido neste ano.",
        cols:[{k:"mes", t:"Mês", fmt:function(v){ return mesLabel(v+"-01"); }, cor:function(){ return ""; }}, {k:"n", t:"Pedidos"}, {k:"total", t:"Total", fmt:brl, cor:function(){ return ""; }},
          {k:"boleto", t:"Boleto", fmt:brl, cor:function(){ return ""; }}, {k:"pix", t:"Pix", fmt:brl, cor:function(){ return ""; }}, {k:"pago", t:"Já pago", fmt:brl, cor:function(){ return "text-success"; }},
          {k:"falta", t:"Falta", fmt:brl, cor:function(l){ return (l.falta>0.005 ? "text-warning" : "text-success"); }}, {k:"vencs", t:"Vencimentos"}, {k:"sit", t:"Situação", cor:function(l){ return corSit(l.sit); }}],
        totalRodape:function(ls){ var s = function(k){ return brl(ls.reduce(function(t, l){ return t+l[k]; }, 0)); }; return ["Total do ano", String(ls.reduce(function(t, l){ return t+l.n; }, 0)), s("total"), s("boleto"), s("pix"), s("pago"), s("falta"), "", ""]; }})));
  // 4) MESES E DEZENAS (Pix) e CRONOGRAMA DA MAQUININHA
  var meses = e(BlocoPainel,{titulo:"Meses e dezenas · Pix", compacto:true, cls:AZ}, e(TabelaAnalise,{pf:pf, f:f, meses:MESES_ANO, hoje:p.hoje||hoje, abertos:p.abertos, alterna:p.alterna}));
  var cron = !mqOn ? null : e(BlocoPainel,{titulo:"Cronograma de descontos da maquininha", compacto:true, cls:AZ+" [&_td]:!px-1 [&_th]:!px-1 [&_td]:!whitespace-nowrap [&_th]:!whitespace-nowrap [&_table]:!table-auto", acao:e("span",{className:"flex items-center gap-1"}, e(BotaoMini,{onClick:function(){ exportarMaquininha(pf); }}, "Exportar"), e(BotaoMini,{onClick:function(){ setMqTodos(!mqTodos); }}, mqTodos ? "Fechar" : "Abrir todos"))}, e(TabelaDescontos,{pf:pf, todos:mqTodos, abertos:p.abertos, alterna:p.alterna}),
    e(TabelaPlanilha, Object.assign({}, TJR, {chave:"id", linhas:[{id:"m", passou:D.passou, desc:D.mqPago, mes:esteMes, ainda:aFrente}], cols:[{k:"passou", t:"Passou no cartão no ano", fmt:brl}, {k:"desc", t:"Já descontado do Pix", fmt:brl}, {k:"mes", t:"Desconta neste mês", fmt:brl}, {k:"ainda", t:"Ainda vai descontar", fmt:brl}]})));
  // os blocos se encostam, separados pela mesma linha branca de 3 px do alto da tela (Marcus, 22/11/2026)
  // a Maquininha e o Cronograma dela ficam juntos, no meio, com a linha branca em cima e embaixo do grupo (Marcus, 22/11/2026)
  var gMaq = [cron].filter(Boolean), blocosP = [gMaq.length ? e("div",{className:"flex flex-col gap-0"}, gMaq.map(function(b, i){ return e("div",{key:"mq"+i}, b); })) : null, meses].filter(Boolean), saida = [];
  blocosP.forEach(function(b, i){ if(i>0) saida.push(e("div",{key:"sep"+i, className:"h-[3px] bg-white"})); saida.push(e("div",{key:"b"+i}, b)); });
  return e("div",{className:"flex flex-col gap-0"}, saida);
}

function GeralInterno(P){
  var c = usePf(), pf = c.pf, hoje = hojeIso();
  var sp = useState("m:"+mesAtual()), per = sp[0], setPer = sp[1], sf = useState(""), fornSel = sf[0], setForn = sf[1], sa = useState({}), abertos = sa[0], setAbertos = sa[1], sm = useState(false), soMaq = sm[0], setSoMaq = sm[1], sfo = useState("planilha"), formato = sfo[0], setFormato = sfo[1];
  var alterna = function(k, atual){ var o = Object.assign({}, abertos); o[k] = !atual; setAbertos(o); };
  var abrirForn = function(id){ setForn(String(id)); setSoMaq(false); try{ window.scrollTo(0, 0); }catch(x){} };
  var anual = per==="a", mes = anual ? null : per.slice(2), mesRef = mes || mesAtual();
  var fornecedores = pf.fornecedores.filter(function(f){ return !ehPrestador(f); }), prestadores = pf.fornecedores.filter(ehPrestador);
  var linhasDe = function(lista, m){ return lista.map(function(f){ return {f:f, c:contaForn(pf, f.id, m)}; }).filter(function(x){ return x.c.qtdDatas>0; }); };
  var f1 = fornSel ? pf.fornecedores.find(function(f){ return String(f.id)===fornSel; }) : null, f1Mq = !!(f1 && f1.id===pf.mqFornId), bF = (f1 && corForn(f1.nome) || {}).barra || "azul";
  var fbtn = function(k, t){ var on = formato===k; return e("button",{key:k, type:"button", onClick:function(){ setFormato(k); }, className:"h-10 rounded-lg px-4 text-[13px] font-bold text-white ring-1 "+(on ? "ring-white/60" : "ring-white/15"), style:{background:on ? "#2563EB" : "#ffffff14"}}, t); };
  var btnAcao = function(rot, fn){ return e("button",{key:rot, type:"button", disabled:!c.edita, onClick:fn, className:"h-10 rounded-lg px-4 text-[13px] font-bold text-white ring-1 ring-white/25 hover:brightness-125 disabled:opacity-40", style:{background:"#3B82F6"}}, rot); };
  var seletor = e("div",{className:"flex flex-wrap items-center gap-2"},
    e(Sel,{value:per, label:"Período", className:"w-72", onChange:function(v){ setPer(v); }}, MESES_ANO.map(function(m){ return e("option",{key:m, value:"m:"+m}, mesLabel(m+"-01")+(m===mesAtual() ? " · mês atual" : "")); }), e("option",{value:"a"}, "Ano "+ANO+" (anual)")),
    e(Sel,{value:fornSel, label:"Fornecedor", className:"w-96 max-w-full", onChange:function(v){ setForn(v); setSoMaq(false); }}, e("option",{value:""}, "Todos (fornecedores e prestadores)"), e("option",{value:"", disabled:true, style:{background:"#1a1a1a", color:"#F3D98B", fontWeight:"bold"}}, "— Fornecedores —"), fornecedores.map(function(f){ return e("option",{key:f.id, value:String(f.id), style:{background:"#1a1a1a", color:"#fff"}}, f.nome); }), e("option",{value:"", disabled:true, style:{background:"#1a1a1a", color:"#F3D98B", fontWeight:"bold"}}, "— Prestadores de serviço —"), prestadores.map(function(f){ return e("option",{key:f.id, value:String(f.id), style:{background:"#1a1a1a", color:"#fff"}}, f.nome); })),
    false && e("button",{type:"button", onClick:function(){ setSoMaq(!soMaq); }, className:"h-10 rounded-lg px-4 text-[13px] font-bold text-white ring-1 ring-white/25 hover:brightness-125", style:{background:soMaq ? "#2563EB" : "#ffffff14"}}, soMaq ? "✓ Só maquininha" : "Só maquininha"),
    f1 && e("button",{type:"button", onClick:function(){ setForn(""); setSoMaq(false); }, className:"h-10 rounded-lg px-4 text-[13px] font-bold text-white ring-1 ring-white/25 hover:brightness-125", style:{background:"#ffffff14"}}, "← Voltar ao geral"),
    f1 ? btnAcao("+ Lançar nova negociação", function(){ P.novaNeg(f1.id); }) : [btnAcao("+ Novo fornecedor", function(){ P.novoCad("forn"); }), btnAcao("+ Novo prestador de serviço", function(){ P.novoCad("prest"); })]);

  // ── um fornecedor: resumo do mês no alto (com a maquininha na Pontual), atrasos, o mês e o mês seguinte, e os outros meses do ano
  if(f1) return e("div",{className:"flex flex-col gap-3"}, e(PageHead,{t:f1.nome, sub:f1Mq ? "Maquininha, o que pagar, o que foi pago e as negociações" : "O que pagar, o que foi pago e as negociações"}), seletor, e(PainelPontual,{pf:pf, f:f1, hoje:hoje, abertos:abertos, alterna:alterna}));
  if(f1){
    var ehMq = f1.id===pf.mqFornId, cm = contaForn(pf, f1.id, mesRef), todasJ = [];
    MESES_ANO.forEach(function(m){ janelasMes(pf, f1, m, hoje).forEach(function(x){ todasJ.push(Object.assign({m:m}, x)); }); });
    var atrasadas = todasJ.filter(function(x){ return x.sit==="atrasado"; }), prox = mesMais(mesRef, 1);
    var outros = MESES_ANO.filter(function(m){ return m!==mesRef && m!==prox && contaForn(pf, f1.id, m).qtdDatas>0; });
    if(soMaq){   // só maquininha: quanto passou em cada mês, o fechamento e o desconto
      var mm = MESES_ANO.filter(function(m){ return mqBruto(pf, m)>0 || mqDescontoNoMes(pf, m)>0; });
      return e("div",{className:"flex flex-col gap-3"}, e("div",null, e(Etiqueta,{nome:f1.nome, g:true})), e(PageHead,{t:"Geral · "+f1.nome+" · maquininha", sub:"Só o cartão: quanto passou em cada mês, o fechamento e o desconto que cai nos primeiros dias do mês seguinte"}), seletor,
        e("div",{className:"grid grid-cols-1 gap-3 md:grid-cols-3"}, e(Tile,{t:"Passou no cartão em "+ANO, v:brl(mm.reduce(function(t, m){ return t+mqBruto(pf, m); }, 0)), cor:"#CBD5E1"}), e(Tile,{t:"Desconto aplicado em "+ANO, v:brl(mm.reduce(function(t, m){ return t+mqDescontoNoMes(pf, m); }, 0)), cor:COR.green}), e(Tile,{t:"Meses com cartão", v:String(mm.length), cor:"#CBD5E1"})),
        mm.map(function(m){ var k = "mq|"+m, ab = abertos[k]===undefined ? m===mesAtual() : abertos[k];
          return e(BlocoBarra,{key:k, t:mesLabel(m+"-01"), cor:bF, compacto:true, dir:brl(mqBruto(pf, m))}, e("div",{onClick:function(){ alterna(k, ab); }, className:"cursor-pointer"}, ab ? e(Maquininha,{pf:pf, mes:m, lista:true}) : e("p",{className:"px-3 py-2 text-[13px] text-white"}, "Clique para ver as passadas e o desconto do mês."))); }));
    }
    var blocosLaterais = ehMq && formato==="blocos";
    var corpo = blocosLaterais
      ? [e(BlocoBarra,{key:"a", t:f1.nome+" · "+mesLabel(mesRef+"-01")+" e "+mesLabel(prox+"-01"), cor:bF, compacto:true, dir:brl(cm.total)}, e(ConteudoBlocos,{pf:pf, f:f1, mes:mesRef, hoje:hoje, abertos:abertos, alterna:alterna})),
         outros.length>0 && e(BlocoBarra,{key:"b", t:"Outros meses de "+ANO, cor:bF, compacto:true}, outros.map(function(m){ var k = "o|"+m, ab = abertos[k]===undefined ? false : abertos[k];
           return e("div",{key:k, className:"border-b border-white/10"}, e("button",{type:"button", onClick:function(){ alterna(k, ab); }, className:"flex w-full items-center gap-3 px-4 py-2 text-left text-[14px] font-bold text-white hover:bg-white/5"}, mesLabel(m+"-01")), ab && e(MesBlocos,{pf:pf, f:f1, mes:m, hoje:hoje, abertos:abertos, alterna:alterna})); }))]
      : e(BlocoBarra,{t:f1.nome+" · "+ANO, cor:bF, compacto:true, dir:brl(MESES_ANO.reduce(function(t, m){ return t+contaForn(pf, f1.id, m).total; }, 0))}, e(TabelaAnalise,{pf:pf, f:f1, meses:MESES_ANO, hoje:hoje, abertos:abertos, alterna:alterna}));
    return e("div",{className:"flex flex-col gap-3"}, e("div",null, e(Etiqueta,{nome:f1.nome, g:true})), e(PageHead,{t:"Geral · "+f1.nome, sub:"Resumo de "+mesLabel(mesRef+"-01")+" e o ano em planilha"+(ehMq ? "; use o botão para ver as dezenas em blocos" : "")}), seletor,
      atrasadas.length>0 && e("div",{className:"rounded-xl px-4 py-3", style:{background:COR.red+"26", boxShadow:"inset 0 0 0 2px "+COR.red}}, e("b",{className:"text-[15px] text-white"}, "⚠ Em atraso: "+brl(atrasadas.reduce(function(t, x){ return t+x.falta; }, 0))), e("div",{className:"mt-1 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-white"}, atrasadas.map(function(x){ return e("span",{key:x.j.chave}, mesLabel(x.m+"-01").slice(0, 3)+" · "+x.rot+" (até "+dbr(x.j.limite).slice(0, 5)+"): ", e("b",null, brl(x.falta))); }))),
      e("div",{className:"grid grid-cols-2 gap-3 "+(ehMq ? "md:grid-cols-5" : "md:grid-cols-4")},
        e(Tile,{t:"A pagar em "+mesLabel(mesRef+"-01"), v:brl(cm.total), cor:"#CBD5E1"}), e(Tile,{t:"Pago", v:brl(cm.pago), cor:COR.green}), e(Tile,{t:"Falta pagar", v:brl(Math.max(0, cm.total-cm.pago)), cor:cm.total-cm.pago>0.005 ? COR.red : COR.green}), e(Tile,{t:"Pago do mês", v:(cm.total>0 ? Math.round(cm.pago/cm.total*100) : 0)+"%", cor:"#CBD5E1"}),
        ehMq && e(Tile,{t:"Maquininha no mês", v:brl(mqBruto(pf, mesRef)), cor:"#CBD5E1", sub:"desconto caindo: "+brl(mqDescontoNoMes(pf, mesRef))})),
      e(ResumoAno,{pf:pf, f:f1}),
      corpo,
      ehMq && e(BlocoBarra,{t:"Maquininha · "+mesLabel(mesRef+"-01")+" e "+mesLabel(prox+"-01"), cor:bF, compacto:true}, e(TabelaDescontos,{pf:pf, abertos:abertos, alterna:alterna}), e(Maquininha,{pf:pf, mes:mesRef, cor:"#CBD5E1"}), e(Maquininha,{pf:pf, mes:prox, cor:"#CBD5E1"})));
  }

  // ── anual: fornecedor × mês
  if(anual){
    var todos = fornecedores.concat(prestadores).map(function(f){ return {f:f, meses:MESES_ANO.map(function(m){ return contaForn(pf, f.id, m); })}; }).filter(function(x){ return x.meses.some(function(cm){ return cm.qtdDatas>0; }); });
    var tA = todos.reduce(function(t, x){ return t+x.meses.reduce(function(u, cm){ return u+cm.total; }, 0); }, 0), tP = todos.reduce(function(t, x){ return t+x.meses.reduce(function(u, cm){ return u+cm.pago; }, 0); }, 0);
    return e("div",{className:"flex flex-col gap-3"}, e(PageHead,{t:"Geral · Ano "+ANO, sub:"A pagar e pago de cada fornecedor e prestador, mês a mês. Clique no nome para abrir só ele."}), seletor,
      e("div",{className:"grid grid-cols-1 gap-3 md:grid-cols-3"}, e(Tile,{t:"A pagar no ano", v:brl(tA), cor:"#CBD5E1"}), e(Tile,{t:"Pago", v:brl(tP), cor:COR.green}), e(Tile,{t:"Falta", v:brl(Math.max(0, tA-tP)), cor:tA-tP>0.005 ? COR.red : COR.green})),
      e(LimiteAno,{pf:pf, meses:MESES_ANO}),
      e(BlocoBarra,{t:"Fornecedores e prestadores · "+ANO, cor:"azul", compacto:true}, e("div",{className:"overflow-x-auto p-3"}, e("table",{className:"w-full min-w-[60rem] border-collapse"},
        e("thead",null, e("tr",null, th("Fornecedor"), MESES_ANO.map(function(m){ return th(mesLabel(m+"-01").slice(0, 3), "text-right"); }), th("Total pago","text-right"))),
        e("tbody",null, todos.map(function(x){ return e("tr",{key:x.f.id, onClick:function(){ setForn(String(x.f.id)); }, className:"cursor-pointer border-b border-border/50 hover:bg-white/5"},
          e("td",{className:TD}, e("b",null, x.f.nome)),
          x.meses.map(function(cm, i){ return e("td",{key:i, className:tdn+" text-[12.5px]", title:"a pagar "+brl(cm.total)+" · pago "+brl(cm.pago)}, cm.qtdDatas ? e("span",{style:{color:cm.aberto>0.005 ? COR.orange : COR.green}}, brl(cm.pago)) : "—"); }),
          e("td",{className:tdn+" font-bold"}, brl(x.meses.reduce(function(t, cm){ return t+cm.pago; }, 0)))); }))))));
  }

  // ── mensal (padrão): todos os fornecedores e prestadores do mês; cada linha abre o mês e o mês seguinte no formato escolhido
  // Fornecedor e prestador de serviço (Marcus e Lucas, 09/11/2026): a negociação não some quando o mês passa. O que ficou em aberto dos meses anteriores entra neste mês, com o vencimento original, e a linha fica em atraso.
  var linhasPrest = function(lista, m){ return lista.map(function(f){
    var c = contaForn(pf, f.id, m), meses = {}, ab = 0, n = 0, venc = null;
    janelasDoForn(pf, f.id).forEach(function(j){ if(j.mes<m) meses[j.mes] = 1; });
    Object.keys(meses).forEach(function(mm){ contaForn(pf, f.id, mm).datas.forEach(function(d){ if(d.aberto>0.005){ ab += d.aberto; n++; if(!venc || d.venc<venc) venc = d.venc; } }); });
    if(ab>0.005) c = Object.assign({}, c, {total:c.total+ab, aberto:c.aberto+ab, qtdDatas:c.qtdDatas+n, dMin:(!c.dMin || venc<c.dMin) ? venc : c.dMin, dMax:venc});
    return {f:f, c:c}; }).filter(function(x){ return x.c.qtdDatas>0; }); };
  var lf = linhasPrest(fornecedores, mes), lp = linhasPrest(prestadores, mes), todosL = lf.concat(lp);
  var total = somaC(todosL, "total"), pago = somaC(todosL, "pago"), falta = total-pago;
  var mqMes = pf.mqFornId ? {bruto:mqBruto(pf, mes), desc:mqDescontoNoMes(pf, mes)} : null;
  // Teto mensal (chamado do Lucas, 09/11/2026): não retém mais nenhuma negociação. Passou do teto = só um AVISO acima das tabelas; tudo entra nos totais.
  var usoTeto = usoMes(pf, mes), tetoMes = limiteDe(pf).teto, passouTeto = usoTeto.total>tetoMes+0.005;
  // TABELA DO MÊS (Marcus, 16/11/2026): igual à planilha do RESUMO MÊS: Fornecedor, A pagar, Pago, Saldo, Próximo prazo, Status e OBSERVAÇÃO (escrita à mão, guardada por mês em pf.obsResumo). Filtro e ordem no título de cada coluna.
  var vermVerde = function(l){ return l.aberto>0.005 ? "text-red-400" : "text-emerald-400"; };
  var salvaObs = function(chave, txt){ c.d({type:"PF", op:"mut", fn:function(p0){ p0.obsResumo = p0.obsResumo || {}; var t = String(txt || "").trim(); if(t) p0.obsResumo[chave] = t; else delete p0.obsResumo[chave]; return "Observação salva"; }}); };
  var campoObs = function(v, l){ return c.edita ? e("input",{key:l.chaveObs+"|"+(v || ""), type:"text", defaultValue:v || "", "aria-label":"Observação de "+l.nome, placeholder:"—", onClick:function(ev){ ev.stopPropagation(); }, onBlur:function(ev){ if(ev.target.value!==(v || "")) salvaObs(l.chaveObs, ev.target.value); }, className:"h-8 w-full min-w-[16rem] rounded border border-border bg-card px-2 text-center text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"}) : (v || "—"); };
  var COLS_F = [{k:"nome", t:"Fornecedor"}, {k:"total", t:"A pagar", fmt:brl}, {k:"pago", t:"Pago", fmt:brl, cor:function(l){ return l.pago>0.005 ? "text-emerald-400" : ""; }}, {k:"aberto", t:"Saldo", fmt:brl, cor:vermVerde}, {k:"prazo", t:"Próximo prazo"}, {k:"status", t:"Status", cor:function(l){ return l.corSt; }}, {k:"obs", t:"Observação", render:campoObs}];
  var ultDia = new Date(parseInt(mes.slice(0, 4), 10), parseInt(mes.slice(5, 7), 10), 0).getDate();
  var rodape = function(rows){ var tt = rows.reduce(function(t, x){ return t+x.total; }, 0), tp = rows.reduce(function(t, x){ return t+x.pago; }, 0), ta = rows.reduce(function(t, x){ return t+x.aberto; }, 0); return ["Total", brl(tt), brl(tp), brl(ta), "", (tt>0 ? Math.round(tp/tt*100) : 0)+"% pago", ""]; };
  var tabelaMes = function(titulo, rows, colsX){ var tt = rows.reduce(function(t, x){ return t+x.total; }, 0); return e(BlocoBarra,{t:titulo, cor:"azul", compacto:true, dir:brl(tt)}, e("div",{className:"p-3"}, e(TabelaPlanilha,{key:titulo+mes, cols:colsX || COLS_F, linhas:rows, chave:"id", grade:true, semContagem:true, semLimpar:true, aoClicar:function(l){ if(l.f) abrirForn(l.f.id); }, totalRodape:rows.length ? rodape : undefined, vazio:"Nada neste mês."}))); };
  var linhasForn = function(linhas){ return linhas.map(function(x){ var cc = x.c, st = statusConta(cc), ch = x.f.id+"|"+mes; return {id:x.f.id, f:x.f, nome:x.f.nome, total:cc.total, pago:cc.pago, aberto:cc.aberto, prazo:cc.dMin ? dbr(cc.dMin) : "—", status:"● "+st.texto, corSt:st.cor==="green" ? "text-emerald-400" : st.cor==="red" ? "text-red-400" : st.cor==="orange" || st.cor==="yellow" ? "text-amber-400" : "", obs:(pf.obsResumo || {})[ch] || "", chaveObs:ch}; }); };
  var bloco = function(titulo, linhas){ return tabelaMes(titulo, linhasForn(linhas)); };
  // SÓCIOS E CASA (Marcus, 16/11/2026): vem do Financeiro familiar, SÓ LEITURA: A pagar = meta de Pix revendedoras do mês (ff.pixMeta); Pago = Pix já recebido no mês (ff.pix). A observação é daqui.
  var ffS = c.s.ff || {}, metaPix = ffS.pixMeta || {}, pixFam = ffS.pix || [];
  var SOC = [["marcus", "Marcus"], ["anamaria", "Anamaria"], ["marco", "Marco Antonio"], ["anabeatriz", "Ana Beatriz"], ["lucas", "Lucas"], ["familia", "Casa"]];
  var linhasSoc = SOC.map(function(s0){ var meta = Number(metaPix[s0[0]+"|"+mes] || 0), pg = Math.round(pixFam.filter(function(x){ return x.personaId===s0[0] && String(x.data || "").slice(0, 7)===mes; }).reduce(function(t, x){ return t+(Number(x.valor) || 0); }, 0)*100)/100, ab = Math.max(0, Math.round((meta-pg)*100)/100), ch = "socio:"+s0[0]+"|"+mes;
    return {id:"s|"+s0[0], nome:s0[1], total:meta, pago:pg, aberto:ab, prazo:dbr(mes+"-"+String(ultDia).padStart(2, "0")), status:meta>0 ? (ab<0.005 ? "● Quitado" : "● Em aberto") : "● Sem meta", corSt:meta>0 && ab<0.005 ? "text-emerald-400" : "", obs:(pf.obsResumo || {})[ch] || "", chaveObs:ch}; });
  return e("div",{className:"flex flex-col gap-3"},
    e(PageHead,{t:"Meses e dezenas · "+mesLabel(mes+"-01"), sub:"O mês de cada fornecedor e prestador de serviço, por dezena. Clique numa linha para abrir as 3 dezenas do mês e as 3 do mês seguinte."}), seletor,
    passouTeto && e("div",{className:"flex h-8 items-center justify-center rounded-lg px-3 text-[13px] font-bold text-white", style:{background:COR.yellow+"26", boxShadow:"inset 0 0 0 1px "+COR.yellow}}, "Aviso: "+mesLabel(mes+"-01")+" passou do teto de "+brl(tetoMes)+" (lançado: "+brl(usoTeto.total)+"). Tudo continua nos totais."),
    bloco("Fornecedores", lf), bloco("Prestadores de serviço", lp),
    mqMes && e("div",{className:"text-[13px] text-white"}, "Maquininha no mês: "+brl(mqMes.bruto)+" · desconto caindo: "+brl(mqMes.desc)));
}

// casca da Geral: guarda as janelas de "Lançar negociação" e de "Novo fornecedor / prestador de serviço" (as mesmas das telas de Negociações e Fornecedores)
function Geral(){
  var c = usePf(), pf = c.pf, sp = useState(null), ped = sp[0], setPed = sp[1], sn = useState(null), novo = sn[0], setNovo = sn[1];
  var novaNeg = function(fid){ var n = pedidoNovo(pf, fid); setPed(n); };
  return e("div",null, e(GeralInterno,{novaNeg:novaNeg, novoCad:setNovo}),
    ped && e(JanelaPedido,{c:c, pf:pf, ped:ped, setPed:setPed}),
    novo && e(ModalForn,{key:"novo-"+novo, c:c, f:null, prest:novo==="prest", fechar:function(){ setNovo(null); }}));
}

// RESUMO GERAL (Marcus e Anamaria, 16/11/2026): igual à PLANILHA do Marcus (RESUMO MÊS) e no modelo de Contas a pagar (bloco azul com menus, tabela compacta, cabeçalho parado). Tudo de um fornecedor fica JUNTO, uma janela embaixo da outra (Pontual 01/11 à 10/11, 11/11 à 20/11, 21/11 à 30/11) e, se tem mais de uma, uma linha de TOTAL do fornecedor; os sócios vêm no fim com o TOTAL SÓCIOS.
// O saldo em atraso de meses anteriores NÃO é mais uma linha: entra na primeira janela do mês (A pagar e Saldo) e a linha ganha um botão "i" que mostra de que mês veio. Sem coluna Observação e sem menu de colunas (Marcus, 16/11/2026).
// Colunas fixas: Fornecedor, A pagar, Pago, Saldo, Data. Limite e calendário ficam em Negociações › aba final; o resumo antigo é a aba "Meses e dezenas".
var ULTDIA = function(m){ return m+"-"+String(new Date(parseInt(m.slice(0, 4), 10), parseInt(m.slice(5, 7), 10), 0).getDate()).padStart(2, "0"); };
var SEL_RG = "h-7 min-w-0 rounded-md border border-border bg-card px-1.5 text-[11px] font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary";   // padrao-ok: faixa compacta, a pedido do Marcus (16/11/2026)
// NÚMERO DO PEDIDO padronizado (Marcus, 20/11/2026: Xangai vinha "ROMANEIO N.º 005457*" e "XANGAI — FATURA Nº 5499"): sem caixa alta, sem zeros à esquerda, sem asterisco e sem o nome do fornecedor antes. Linhas com NF (ex.: Pontual NF 11660 · Fatura 13401) ficam como estão.
var fmtPed = function(n){ var t = String(n==null ? "" : n).trim(); if(!t || /^[-—– ]+$/.test(t)) return "Sem número"; if(/\bNF\b/i.test(t)) return t; var m = t.match(/romaneio[^0-9]*0*(\d+)/i); if(m) return "Romaneio nº "+m[1]; m = t.match(/fatura[^0-9]*0*(\d+)\s*\*?$/i); if(m) return "Fatura nº "+m[1]; return bonito(t.replace(/\*+$/, "")); };
var norm = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); };
var bonito = function(n){ var t = String(n || "").trim(); if(t!==t.toUpperCase() || !/[A-ZÀ-Ú]/.test(t)) return t; return t.toLowerCase().replace(/(^|[\s(\-\/])([a-zà-ú])/g, function(m, a, b){ return a+b.toUpperCase(); }).replace(/ (De|Da|Do|Das|Dos|E) /g, function(m){ return m.toLowerCase(); }); };
var contaPadrao = function(c){ var t = String(c || "").replace(/\s+/g, " ").trim(); if(!t || t==="—") return "—"; t = t.replace(/^pix\s*-\s*/i, "Pix "); if(t===t.toUpperCase() && /[A-ZÀ-Ú]/.test(t)) t = bonito(t); return t.replace(/\bLTDA\b/gi, "Ltda").replace(/\bS\/A\b/gi, "S.A."); };
var TIPO_CHAVE = {TELEFONE:"Celular", CELULAR:"Celular", CPF:"CPF", CNPJ:"CNPJ", EMAIL:"E-mail", RANDOM:"Aleatória", ALEATORIA:"Aleatória"};
var tipoChave = function(ch, cad){ var t = String(ch || "").trim(); if(!t) return "—"; if(cad && cad.chave===t && cad.chaveTipo) return TIPO_CHAVE[String(cad.chaveTipo).toUpperCase()] || String(cad.chaveTipo); var d = t.replace(/\D/g, ""); if(t.indexOf("@")>=0) return "E-mail"; if(/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(t)) return "Aleatória"; if(d.length===14) return "CNPJ"; if(d.length===11) return d.charAt(2)==="9" ? "Celular" : "CPF"; if(d.length===10 || d.length===12 || d.length===13) return "Celular"; return "—"; };
var ddmm = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7) : ""; };
// ordem da planilha: quem vem primeiro (o resto entra por valor, do maior ao menor)
var ORD_FORN = [/pontual/i, /office|edson/i, /^point/i, /dev ?master/i, /mega ?sul/i, /ellos?/i, /art ello/i], ORD_PREST = [/lucas castilho/i, /priscil/i, /madeira/i, /higor/i];
function ResumoGeral(){
  var c = usePf(), pf = c.pf, hoje = hojeIso(), sm = useState(mesAtual()), mes = sm[0], setMes = sm[1], sdt = useState(null), detId = sdt[0], setDetId = sdt[1], refRaiz = useRef(null), sv = useState("sep"), vista = sv[0], setVista = sv[1], sbu = useState(""), buscaTxt = sbu[0], setBuscaTxt = sbu[1], sti = useState(""), tipoSel = sti[0], setTipoSel = sti[1], ssi = useState(""), sitSel = ssi[0], setSitSel = ssi[1], sed = useState(""), editando = sed[0], setEditando = sed[1], svc = useState(null), verComp = svc[0], setVerComp = svc[1], szm = useState(0), zoomComp = szm[0], setZoomComp = szm[1], sla = useState(null), lancando = sla[0], setLancando = sla[1];   // lancando = chave da data ("novo" = escolher fornecedor e data) da janela Lançar pagamento
  // CARD DO DETALHE (Marcus, 20/11/2026): clicar numa linha abre um card grande no meio da tela, com botão Fechar (Esc também fecha); só um por vez.
  useEffect(function(){ if(!detId && !verComp) return undefined; var f = function(ev){ if(ev.key!=="Escape") return; if(verComp){ if(verComp.url && !verComp.servidor) URL.revokeObjectURL(verComp.url); setVerComp(null); setZoomComp(0); } else setDetId(null); }; window.addEventListener("keydown", f); return function(){ window.removeEventListener("keydown", f); }; }, [detId, verComp]);   // eslint-disable-line react-hooks/exhaustive-deps
  // COMPROVANTE EM QUALQUER COMPUTADOR (Marcus, 24/11/2026: "não pode ter anexado em outro computador"): o que ficou guardado só neste navegador sobe para o servidor, um por vez, uma vez por sessão
  useEffect(function(){
    if(!c.edita || !pf || !pf.lancamentos) return;
    var fila = pf.lancamentos.filter(function(l){ return l.arqId && !l.arqKey && !COMP_SOBE[l.id]; }); if(!fila.length) return;
    var feitos = [], pr = Promise.resolve();
    fila.forEach(function(l){ COMP_SOBE[l.id] = true; pr = pr.then(function(){
      return obterArquivo(l.arqId).then(function(blob){ if(!blob) return null; var arq = new File([blob], l.arqNome || "comprovante", {type:blob.type || l.arqTipo || ""}); return lerAnexo(arq).then(function(a){ return enviarAnexo("pf", a); }).then(function(sv){ feitos.push({id:l.id, arqKey:sv.key}); }); }).catch(function(){ return null; });
    }); });
    pr.then(function(){ if(feitos.length) op(c, "lanc_comp_srv", {itens:feitos}); });
  }, [pf && pf.lancamentos ? pf.lancamentos.length : 0]);   // eslint-disable-line react-hooks/exhaustive-deps
  if(!pf || !pf.fornecedores) return e("p",{className:"p-6"}, "Carregando…");
  // 1) janelas de cada fornecedor: as do mês viram linhas; o que ficou em aberto de meses antigos entra na primeira janela do mês (ou, se o mês não tem janela, vira uma linha só)
  var grupos = [];
  // DATA DA LINHA (Marcus, 24/11/2026: "a Dávila é paga toda quinta, o prazo está errado"): prestador que se paga por vencimento (Dávila e Leci, da Produção externa) mostra o PRÓXIMO vencimento em aberto; sem nada em aberto, o último vencimento. Os demais seguem a data da janela.
  var dataVenc = function(f0, j0){ if(cicloDe(f0).periodicidade!=="venc") return j0.limite; var its = (j0.itens || []).filter(function(it){ return it.p && it.p.venc; }); if(!its.length) return j0.limite; var ab = its.filter(function(it){ return it.p.status!=="Pago"; }).map(function(it){ return it.p.venc; }).sort(); return ab.length ? ab[0] : its.map(function(it){ return it.p.venc; }).sort().pop(); };
  pf.fornecedores.forEach(function(f){
    var tipo = f.cat==="Produção externa" ? "Produção externa" : ehPrestador(f) ? "Prestador" : "Fornecedor", atuais = [], antigas = [];
    janelasDoForn(pf, f.id).forEach(function(j){
      if(j.mes>mes) return;
      var pg = Math.min(pagoJanela(pf, j.chave), j.total), ab = Math.max(0, j.total-pg);
      if(j.total<=0.005) return;
      if(j.mes<mes){ if(ab>0.005) antigas.push({j:j, pg:pg, ab:ab}); } else atuais.push({j:j, pg:pg, ab:ab});
    });
    if(!atuais.length && !antigas.length) return;
    var linhas = [], porMes = {};
    atuais.forEach(function(x){ (porMes[x.j.mes] = porMes[x.j.mes] || []).push(x); });
    atuais.sort(function(a, b){ return a.j.fim.localeCompare(b.j.fim); });
    var oldAb = antigas.reduce(function(t, x){ return t+x.ab; }, 0), meses = []; antigas.forEach(function(x){ if(meses.indexOf(x.j.mes)<0) meses.push(x.j.mes); });
    var infoAntigo = oldAb>0.005 ? "Inclui "+brl(oldAb)+" em atraso de "+meses.sort().map(function(m){ return mesLabel(m+"-01"); }).join(" e ")+"." : "";
    if(atuais.length){
      atuais.forEach(function(x, i){
        var extra = i===0 ? oldAb : 0, ch = "j|"+x.j.chave;
        linhas.push({id:ch, chv:x.j.chave, fid:x.j.fornId, data:dataVenc(f, x.j), nome:nomeJanela(bonito(f.nome), atuais.map(function(z){ return z.j; }), x.j), tipo:tipo, total:x.j.total+extra, pago:x.pg, aberto:x.ab+extra, info:i===0 ? infoAntigo : ""});
      });
    } else {
      antigas.forEach(function(x){ linhas.push({id:"j|"+x.j.chave, chv:x.j.chave, fid:x.j.fornId, data:x.j.limite, nome:bonito(f.nome)+" · em atraso de "+mesLabel(x.j.mes+"-01"), tipo:tipo, total:x.ab, pago:0, aberto:x.ab, info:""}); });
    }
    grupos.push({nome:bonito(f.nome), tipo:tipo, linhas:linhas, total:linhas.reduce(function(t, l){ return t+l.total; }, 0)});
  });
  var pos = function(g){ var lista = g.tipo==="Fornecedor" ? ORD_FORN : ORD_PREST, i = lista.findIndex(function(r){ return r.test(g.nome); }); return i<0 ? 100 : i; };
  // PRESTADORES DA FAMÍLIA (Marcus, 24/11/2026: "os prestadores da família são separados"; 68 Gang, Greicy, Rebel Mode, Show, Truck Plaza...): vêm do Financeiro familiar (dívidas e repasses), uma linha por prestador. Prestador da Sorelly (Madeira Cor, Priscila, Dávila, Leci, Confraternização...) fica no bloco da Sorelly.
  var ffP = c.s.ff || {}, ffRep = ffP.repasses || [], ffDiv = ffP.dividas || [];
  // O mês começa com o que cada prestador DEVIA em 31/10 (Marcus, 24/11/2026: "só entra quem tinha dívida no início do mês"; "68 Gang: devia R$ 7.063,10 no início de novembro, pagou R$ 4.766,20, deve R$ 2.296,90"):
  // A pagar = saldo do começo do mês + dívida nova do mês; Pago = Pix repassados e descontos do mês; só prestador ativo (quem já saiu só aparece se for pedido).
  var iniMes = (function(){ var d0 = new Date(parseInt(mes.slice(0, 4), 10), parseInt(mes.slice(5, 7), 10)-1, 0); return d0.getFullYear()+"-"+String(d0.getMonth()+1).padStart(2, "0")+"-"+String(d0.getDate()).padStart(2, "0"); })(), fimMesF = ULTDIA(mes);
  var persNome = {}; (ffP.personas || []).forEach(function(x){ persNome[x.id] = x.nome; });
  (ffP.prest || []).forEach(function(pr){
    if(pr.ativo===false) return;
    var bxI = baixaDividas({dividas:ffDiv.filter(function(d){ return String(d.data || "")<=iniMes; }), repasses:ffRep.filter(function(r){ return String(r.data || "")<=iniMes; })}, pr.id), inicio = Math.round((bxI.falta || 0)*100)/100;
    if(!(inicio>0.005)) return;
    var novas = ffDiv.filter(function(d){ return d.prestId===pr.id && d.valor>0 && String(d.data || "")>iniMes && String(d.data || "")<=fimMesF; }).reduce(function(t, d){ return t+d.valor; }, 0);
    var noMes = function(dt){ return String(dt || "")>iniMes && String(dt || "")<=fimMesF; };
    var pgRep = ffRep.filter(function(r){ return r.prestId===pr.id && noMes(r.data); }).reduce(function(t, r){ return t+(Number(r.valor) || 0); }, 0), pgDesc = ffDiv.filter(function(d){ return d.prestId===pr.id && d.valor<0 && noMes(d.data); }).reduce(function(t, d){ return t-d.valor; }, 0);
    var tot = Math.round((inicio+novas)*100)/100, pg = Math.round((pgRep+pgDesc)*100)/100;
    var linhaF = {id:"fp|"+pr.id, prestId:pr.id, dono:pr.responsavelId, donoNome:persNome[pr.responsavelId] || "", data:fimMesF, nome:pr.nome, tipo:"Prestador "+(persNome[pr.responsavelId] || ""), total:tot, pago:pg, aberto:Math.max(0, Math.round((tot-pg)*100)/100), sobra:Math.max(0, Math.round((pg-tot)*100)/100), info:""};
    grupos.push({nome:pr.nome, tipo:linhaF.tipo, linhas:[linhaF], total:tot});
  });
  var rankT = function(t){ return t==="Fornecedor" ? 0 : t==="Prestador" ? 1 : t==="Produção externa" ? 1.5 : 2; };
  grupos.sort(function(a, b){ return (rankT(a.tipo)-rankT(b.tipo)) || (a.tipo<b.tipo ? -1 : a.tipo>b.tipo ? 1 : 0) || pos(a)-pos(b) || b.total-a.total; });
  // 2) sócios (meta de Pix do Financeiro familiar, só leitura)
  var ffS = c.s.ff || {}, metaPix = ffS.pixMeta || {}, pixFam = ffS.pix || [], soc = [];
  [["marcus", "Marcus"], ["anamaria", "Anamaria"], ["marco", "Marco Antonio"], ["anabeatriz", "Ana Beatriz"], ["lucas", "Lucas"], ["familia", "Casa"]].forEach(function(s0){
    var meta = Number(metaPix[s0[0]+"|"+mes] || 0), pg = Math.round(pixFam.filter(function(x){ return x.personaId===s0[0] && String(x.data || "").slice(0, 7)===mes; }).reduce(function(t, x){ return t+(Number(x.valor) || 0); }, 0)*100)/100;
    if(meta<=0.005) return;   // sem previsão no mês não entra (só quem tinha a pagar no início do mês)
    soc.push({id:"socio:"+s0[0]+"|"+mes, pessoa:s0[0], dono:s0[0], donoNome:s0[1], data:ULTDIA(mes), nome:s0[1], tipo:"Sócio", total:meta, pago:pg, aberto:Math.max(0, Math.round((meta-pg)*100)/100), sobra:Math.max(0, Math.round((pg-meta)*100)/100), info:""});
  });
  if(soc.length) grupos.push({nome:"Sócios", tipo:"Sócio", linhas:soc, total:0, socios:true});
  // 3) lista final: um fornecedor embaixo do outro; linha de TOTAL quando há mais de uma linha
  var soma = function(rows, k){ return rows.reduce(function(t, x){ return t+x[k]; }, 0); };
  var todas = [];
  // VISTA (Marcus, 20/11/2026: "tira o total da Office Graff e da Pontual, põe só um filtro lá em cima para puxar separado, com total ou só total"): "sep" = cada janela numa linha, sem linha de total (padrão); "com" = janelas e a linha de TOTAL de quem tem mais de uma; "tot" = uma linha só por fornecedor, com a soma das janelas. Sócios continuam um por linha (cada um é uma pessoa); na vista com total entra o TOTAL SÓCIOS.
  // FILTROS DA BARRA (Marcus, 20/11/2026: "o filtro igual daquela tela em tabela"): busca, tipo e situação valem antes de montar as vistas; o total das linhas de total e do rodapé já sai só do que passou.
  var termos = norm(buscaTxt).split(/s+/).filter(Boolean);
  var passa = function(l){
    if(tipoSel && l.tipo!==tipoSel) return false;
    if(sitSel==="aberto" && l.aberto<=0.005) return false;
    if(sitSel==="quitado" && l.aberto>0.005) return false;
    if(sitSel==="atraso" && !(l.data && l.data<hoje && l.aberto>0.005)) return false;
    if(!termos.length) return true;
    var tx = norm([l.nome, l.tipo, ddmm(l.data), brl(l.total), brl(l.pago), brl(l.aberto)].join(" "));
    return termos.every(function(t0){ return tx.indexOf(t0)>=0; });
  };
  grupos.forEach(function(g0){
    var ls = g0.linhas.filter(passa); if(!ls.length) return;
    var g = Object.assign({}, g0, {linhas:ls});
    if(vista==="tot" && !g.socios && g0.linhas.length>1){
      var comAb = g.linhas.filter(function(l){ return l.aberto>0.005; }), datas = g.linhas.map(function(l){ return l.data; }).sort(), inf = g.linhas.filter(function(l){ return l.info; }).map(function(l){ return l.info; });
      todas.push({id:"tot|"+g.nome, chvs:g.linhas.map(function(l){ return l.chv; }), fid:g.linhas[0].fid, data:datas[datas.length-1], nome:g.nome, tipo:g.tipo, total:soma(g.linhas, "total"), pago:soma(g.linhas, "pago"), aberto:soma(g.linhas, "aberto"), info:inf.join(" ")});
      return;
    }
    g.linhas.forEach(function(l){ todas.push(l); });
    if(vista==="com" && g.linhas.length>1) todas.push({id:"sub|"+g.nome, sub:true, nome:g.socios ? "Total sócios" : g.nome+" total", tipo:g.tipo, data:g.linhas.map(function(l){ return l.data; }).sort().pop(), total:soma(g.linhas, "total"), pago:soma(g.linhas, "pago"), aberto:soma(g.linhas, "aberto"), info:""});
  });
  // DOIS BLOCOS (Marcus, 20/11/2026): em cima os fornecedores da Sorelly; embaixo os prestadores da família (prestadores de serviço e sócios). O filtro fica no cabeçalho das colunas.
  var ehFamTipo = function(t){ return t!=="Fornecedor" && t!=="Prestador" && t!=="Produção externa" && t!=="Sócio"; };
  var visF = todas.filter(function(l){ return l.tipo==="Fornecedor" || l.tipo==="Prestador" || l.tipo==="Produção externa"; }), visP = todas.filter(function(l){ return l.tipo!=="Fornecedor" && l.tipo!=="Prestador" && l.tipo!=="Produção externa"; });
  var ORD_DONO = ["marcus", "anamaria", "anabeatriz", "marco"], idxDono = function(l){ var i = ORD_DONO.indexOf(l.dono); return i<0 ? 99 : i; };   // Marcus, 24/11/2026: um bloco só; a família vem na ordem Marcus, Anamaria, Ana Beatriz, Marco Antonio (o Tipo diz de quem é: "Prestador Marcus", "Sócio")
  visP = visP.map(function(l, i){ return {l:l, i:i}; }).sort(function(a, b){ return idxDono(a.l)-idxDono(b.l) || (a.l.pessoa ? 1 : 0)-(b.l.pessoa ? 1 : 0) || a.i-b.i; }).map(function(x){ return x.l; });
  visP.forEach(function(l, i){ l.novoDono = i>0 && visP[i-1].dono!==l.dono; });   // linha branca entre um sócio e outro (Marcus, 24/11/2026)
  var salvaAna = function(chave, txt){ c.d({type:"PF", op:"mut", fn:function(p0){ p0.obsResumo = p0.obsResumo || {}; var t = String(txt || "").trim(); if(t) p0.obsResumo[chave] = t; else delete p0.obsResumo[chave]; return "Observação salva"; }}); };
  // OBSERVAÇÕES (Marcus, 16/11/2026): sem traço. Linha vazia mostra só UM botãozinho apagado no meio (lápis); clicar abre o campo; com texto, mostra o texto (clicar edita). Sai do campo = salva.
  var campoAna = function(v, l){
    if(l.sub) return "";
    var ch = "ana|"+mes+"|"+l.id, atual = (pf.obsResumo || {})[ch] || "";
    if(!c.edita) return atual;
    if(editando===ch) return e("input",{key:ch, type:"text", autoFocus:true, defaultValue:atual, "aria-label":"Observação: "+l.nome, onClick:function(ev){ ev.stopPropagation(); }, onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); if(ev.key==="Escape"){ ev.target.value = atual; ev.target.blur(); } }, onBlur:function(ev){ if(ev.target.value!==atual) salvaAna(ch, ev.target.value); setEditando(""); }, className:"h-4 w-full min-w-[20rem] rounded border border-border bg-card px-2 text-left text-[10px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"});   // padrao-ok: campo menor para caber na linha compacta
    if(atual) return e("span",{role:"button", tabIndex:0, title:"Editar", onClick:function(ev){ ev.stopPropagation(); setEditando(ch); }, onKeyDown:function(ev){ if(ev.key==="Enter") setEditando(ch); }, className:"block w-full cursor-text px-2 text-left text-[10px]"}, atual);   // padrao-ok: letra de 10 px, igual à Contas a receber (Marcus, 20/11/2026)
    return e("button",{type:"button", title:"Escrever observação", "aria-label":"Escrever observação: "+l.nome, onClick:function(ev){ ev.stopPropagation(); setEditando(ch); }, className:"mx-auto grid size-4 place-items-center rounded text-foreground opacity-30 hover:bg-white/10 hover:opacity-100 focus-visible:opacity-100"},
      e("svg",{viewBox:"0 0 24 24", width:11, height:11, fill:"none", stroke:"currentColor", strokeWidth:2, strokeLinecap:"round", strokeLinejoin:"round", "aria-hidden":"true"}, e("path",{d:"M12 20h9"}), e("path",{d:"M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z"})));
  };
  // nome com o botão "i" (só nas linhas que juntaram saldo de mês antigo); clicar mostra/esconde o texto
  // ÍCONE DE INFORMAÇÃO (Marcus, 16/11/2026): só aparece o aviso ao PASSAR O MOUSE (ou ao focar com o teclado); não prende, não clica, não cresce a linha.
  var celulaNome = function(v, l){ if(!l.info) return v; return e("span",{className:"inline-flex items-center justify-center gap-1.5 whitespace-nowrap"}, v,
    e("span",{tabIndex:0, role:"img", "aria-label":l.info, className:"group relative inline-flex size-4 shrink-0 cursor-help items-center justify-center text-warning outline-none focus-visible:ring-2 focus-visible:ring-primary"},
      e("svg",{viewBox:"0 0 24 24", width:16, height:16, fill:"none", stroke:"currentColor", strokeWidth:2, strokeLinecap:"round", strokeLinejoin:"round", "aria-hidden":"true"}, e("circle",{cx:12, cy:12, r:9.5}), e("path",{d:"M12 11v5.5"}), e("circle",{cx:12, cy:7.6, r:0.9, fill:"currentColor", stroke:"none"})),
      e("span",{role:"tooltip", className:"pointer-events-none absolute left-full top-1/2 z-30 ml-2 hidden w-max max-w-[20rem] -translate-y-1/2 whitespace-normal rounded-md border border-border bg-card px-3 py-2 text-left text-[13px] font-normal text-foreground shadow-lg group-hover:block group-focus-visible:block"}, l.info))); };
  var mkCols = function(comTipo, fam){ return (comTipo ? [fam ? {k:"donoNome", t:"Sócio", w:"7.5rem"} : {k:"tipo", t:"Tipo", w:"6.5rem"}] : []).concat([{k:"nome", t:"Nome", w:"15rem", render:celulaNome}, {k:"total", t:"A pagar", w:"8rem", fmt:brl}, {k:"pago", t:"Pago", w:"8rem", fmt:brl, cor:function(l){ return l.pago>0.005 ? "text-emerald-400" : ""; }}, {k:"aberto", t:"Saldo", w:"8rem", fmt:brl, render:function(v, l){ return l && l.sobra>0.005 ? brl(l.sobra) : brl(v); }, cor:function(l){ return l.sobra>0.005 ? "text-emerald-400" : l.aberto>0.005 ? "text-red-400" : "text-emerald-400"; }}, {k:"data", t:"Data", w:"4.5rem", fmt:ddmm, cor:function(l){ return l.data && l.data<hoje && l.aberto>0.005 ? "text-warning" : ""; }}]); };   // sem a coluna Observações (Marcus, 20/11/2026); o que já foi escrito continua guardado em pf.obsResumo
  // contas do mesmo fornecedor: o nome cortado ("Maiara Paola Confferi") vira o completo ("Maiara Paola Confferi Dal Sant")
  var contaFinal = function(c0){ var base = contaPadrao(c0), nb = norm(base), melhor = base; if(base==="—") return base; (pf.lancamentos || []).forEach(function(x){ var o = contaPadrao(x.conta), no = norm(o); if(o.length>melhor.length && no.indexOf(nb+" ")===0) melhor = o; }); return melhor; };
  var detalhe = function(l){
    if(l.sub) return null;
    var lista = [];
    var fo0 = l.fid ? pf.fornecedores.find(function(f){ return f.id===l.fid; }) : null, chvs0 = (c.s.cp || {}).chaves || {}, cad = fo0 ? (chvs0["forn|"+fo0.nome] || chvs0["prest|"+fo0.nome] || null) : null;
    var chvs = l.chvs || (l.chv ? [l.chv] : []);
    if(chvs.length){
      chvs.forEach(function(chv0){ lancDaJanela(pf, chv0).forEach(function(x){ lista.push({id:"l"+x.id, lanc:x, data:x.data, quem:x.revendedora || "—", valor:x.valor, conta:contaFinal(x.conta), sit:x.conferido ? "Conferido" : (x.arqKey || x.arqId) ? "Com comprovante" : x.arqNome ? "Sem arquivo" : "Sem comprovante", chavePix:c.edita ? (x.chavePix || (cad && cad.chave) || "—") : "—", tipoChave:c.edita ? tipoChave(x.chavePix || (cad && cad.chave), cad) : "—", arqKey:x.arqKey, arqId:x.arqId, arqNome:x.arqNome, comp:(x.arqKey || x.arqId) ? "Ver" : "Anexar"}); }); });   // com comprovante anexado o pagamento já vale (Marcus, 16/11/2026); sem comprovante, falta anexar
      var mq = chvs.reduce(function(t, chv0){ return t+mqAplicado(pf, chv0); }, 0); if(mq>0.005) lista.push({id:"mq", data:"", quem:"Desconto da maquininha", valor:mq, conta:"—", sit:"Aplicado"});
    } else if(l.prestId){
      ffRep.filter(function(r){ return r.prestId===l.prestId && String(r.data || "")>iniMes && String(r.data || "")<=fimMesF; }).forEach(function(r){ var px = r.origemPixLancId ? pixFam.find(function(q){ return q.id===r.origemPixLancId; }) : null, ck = r.compKey || (px && px.compKey) || "", cn = r.compNome || (px && px.compNome) || ""; lista.push({id:"r"+r.id, data:r.data, quem:(px && px.origem) || r.origem || "—", valor:Number(r.valor) || 0, conta:r.conta || "—", sit:ck ? "Com comprovante" : "Sem comprovante", arqKey:ck, arqNome:cn, comp:ck ? "Ver" : "—"}); });
    } else if(l.pessoa){
      pixFam.filter(function(x){ return x.personaId===l.pessoa && String(x.data || "").slice(0, 7)===mes; }).forEach(function(x, i){ lista.push({id:"p"+(x.id || i), data:x.data, quem:x.origem || "—", valor:Number(x.valor) || 0, conta:"—", sit:x.auditoria || "—"}); });
    }
    lista.sort(function(a, b){ return String(b.data).localeCompare(String(a.data)); });
    var parcelas = [];
    chvs.forEach(function(chv0, k){ var jn = janelaPorChave(pf, chv0); ((jn && jn.itens) || []).forEach(function(it, i){ var pd = it.pd || {}; parcelas.push({id:"pc"+k+"_"+i, ped:fmtPed(pd.numero), parc:(it.idx+1)+" de "+((pd.parcelas || []).length || 1), venc:it.p.venc, forma:(FORMAS[it.p.forma] || {}).label || it.p.forma || "—", valor:it.p.valor, sit:it.p.status || "—"}); }); });
    if(l.prestId){ var bxD = baixaDividas({dividas:ffP.dividas || [], repasses:ffRep}, l.prestId); (bxD.lista || []).forEach(function(d, i){ var b = bxD.porId[d.id] || {falta:d.valor}, fl = Math.max(0, Math.round((b.falta || 0)*100)/100); parcelas.push({id:"dv"+i, ped:d.titulo || d.descricao || d.codigo || "Dívida", parc:fl>0.005 ? "Falta "+brl(fl) : "Quitada", venc:prazoDaDivida(d, hoje), forma:"—", valor:d.valor, sit:fl>0.005 ? "Aberta" : "Quitada"}); }); }
    parcelas.sort(function(a, b){ return String(a.venc).localeCompare(String(b.venc)) || String(a.ped).localeCompare(String(b.ped)); });
    var totP = parcelas.reduce(function(t, x){ return t+x.valor; }, 0);
    var tot = lista.reduce(function(t, x){ return t+x.valor; }, 0);
    var abre = function(x){
      if(verComp && verComp.url && !verComp.servidor) URL.revokeObjectURL(verComp.url);
      var nome = x.arqNome || "comprovante", falha = function(){ setVerComp({dono:l.id, nome:nome, erro:"Não achei o arquivo neste computador. Ele fica no computador de quem anexou."}); };
      setVerComp({dono:l.id, nome:nome, carregando:true});
      if(x.arqKey) buscarAnexo(x.arqKey).then(function(r){ setVerComp({dono:l.id, nome:r.nome || nome, url:r.url, tipo:r.mime || "", servidor:true}); }, function(){ setVerComp({dono:l.id, nome:nome, erro:"Não consegui abrir o comprovante."}); });
      else obterArquivo(x.arqId).then(function(b){ if(!b){ falha(); return; } setVerComp({dono:l.id, nome:nome, url:URL.createObjectURL(b), tipo:b.type || ""}); }).catch(falha);
    };
    var cols2 = [{k:"data", t:"Data", fmt:dbr}, {k:"quem", t:l.pessoa ? "Origem do Pix" : "Nome da revendedora"}, {k:"valor", t:"Valor", fmt:brl}, {k:"comp", t:"Comprovante", render:function(v, r){ if(r.arqKey || r.arqId) return e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); abre(r); }, className:"text-[13px] font-semibold underline hover:text-primary"}, "Ver"); if(!r.lanc || !c.edita) return v==="Anexar" ? "—" : v; return e("label",{title:"Escolha a foto ou o PDF do comprovante: ele sobe para o servidor e abre em qualquer computador", className:"cursor-pointer text-[13px] font-semibold text-warning underline hover:brightness-125", onClick:function(ev){ ev.stopPropagation(); }}, "Anexar", e("input",{type:"file", accept:"image/*,application/pdf", className:"hidden", onChange:function(ev){ var arq = ev.target.files && ev.target.files[0]; ev.target.value = ""; if(!arq) return; lerAnexo(arq).then(function(a){ return enviarAnexo("pf", a); }).then(function(sv){ op(c, "lanc_comp", {id:r.lanc.id, arqNome:arq.name, arqTipo:arq.type, arqKey:sv.key}); }, function(err){ aviso(c, ((err && err.message) ? err.message+" " : "")+"Não consegui anexar o comprovante.", "alerta"); }); }})); }}, {k:"sit", t:"Situação"}, {k:"acoes", t:"Ações", render:function(v, r){ return r.lanc ? e(AcoesLanc,{c:c, l:r.lanc}) : null; }}];   // Editar e Pedido saem da própria tela Lançamento (Marcus, 24/11/2026: lançar e editar integrado no Geral)
    return e("div",{className:"flex min-h-0 flex-1 items-stretch gap-2 px-2 py-1"},
      e("div",{className:"flex min-h-0 min-w-0 flex-1 flex-col [&_td]:!h-[18px] [&_td]:!py-0 [&_td]:!text-[10px] [&_th]:!h-4 [&_th]:!text-[10px]"},   // padrao-ok: letra de 10 px, igual à Contas a receber (Marcus, 20/11/2026)
        // DETALHE (Marcus, 20/11/2026): dois blocos. 1) os Pix que compõem o total (data, nome da revendedora, valor, comprovante, situação); 2) embaixo, só as parcelas dos pedidos (número do pedido, parcela, valor). Um Pix não paga uma parcela: ele paga o total, por isso as duas listas ficam separadas.
        parcelas.length>0 && e("p",{className:"mb-1 shrink-0 text-[10px] font-semibold uppercase"}, l.prestId ? "Dívidas" : "Parcelas dos pedidos"),   // padrao-ok: letra de 10 px, igual à Contas a receber (Marcus, 20/11/2026)
        parcelas.length>0 && e("div",{className:"mb-1.5 shrink-0 bg-card"}, e(TabelaPlanilha,{key:"p"+l.id, cols:[{k:"ped", t:l.prestId ? "Dívida" : "Número do pedido"}, {k:"parc", t:l.prestId ? "Situação" : "Parcela"}, {k:"venc", t:"Vencimento", fmt:dbr}, {k:"valor", t:"Valor", fmt:brl}], linhas:parcelas, chave:"id", grade:true, semCaixaAlta:true, semContagem:true, semLimpar:true, semFiltro:true, semMao:true, totalRodape:function(){ return ["Total", "", "", brl(totP)]; }})),
        e("p",{className:"mb-1 shrink-0 text-[10px] font-semibold uppercase"}, l.pessoa ? "Pix recebidos no mês" : "Pagamentos"),   // padrao-ok: letra de 10 px, igual à Contas a receber (Marcus, 20/11/2026)
        e("div",{className:"min-h-0 flex-1 overflow-y-auto bg-card [&_table]:!border-separate [&_table]:![border-spacing:0] [&_table_td]:!border-l-0 [&_table_th]:!border-l-0 [&_table]:!border-y-0 [&_thead_th]:!border-t [&_thead_th]:!border-t-white [&_tfoot_td]:!border-b [&_tfoot_td]:!border-b-white [&_.overflow-x-auto]:!overflow-visible [&_thead_th]:!sticky [&_thead_th]:!top-0 [&_thead_th]:!z-[5] [&_tfoot_td]:!sticky [&_tfoot_td]:!bottom-0 [&_tfoot_td]:!z-[5]"}, e(TabelaPlanilha,{key:"d"+l.id, cols:cols2, linhas:lista, chave:"id", grade:true, semCaixaAlta:true, semContagem:true, semLimpar:true, semFiltro:true, semMao:true, vazio:"Nenhum Pix lançado.", totalRodape:lista.length ? function(){ return ["Total", "", brl(tot), "", "", ""]; } : undefined}))));
  };
  var meses = []; for(var mm = 1; mm<=12; mm++) meses.push(ANO+"-"+String(mm).padStart(2, "0"));
  var tabela = function(chaveBloco, lista, comTipo, rotuloTotal, fam){
    var dados = lista.filter(function(l){ return !l.sub; });
    var rodape = function(){ return (comTipo ? [""] : []).concat([rotuloTotal, brl(soma(dados, "total")), brl(soma(dados, "pago")), brl(soma(dados, "aberto")), ""]); };
    return e(TabelaPlanilha,{key:chaveBloco+mes, cols:mkCols(comTipo, fam), linhas:lista, chave:"id", grade:true, semCaixaAlta:true, semContagem:true, semLimpar:true, semMao:true, aoClicar:function(l){ if(!l.sub) setDetId(l.id); }, linhaCls:function(l){ return (l.sub ? "rg-sub font-bold" : l.id===detId ? "rg-sel font-semibold !cursor-pointer" : "!cursor-pointer")+(l.novoDono ? " rg-dono" : ""); }, totalRodape:rodape, vazio:"Nada a pagar neste mês."});
  };
  // BLOCO DE SOMA (Marcus, 20/11/2026): embaixo das duas tabelas, a soma de cada bloco e o total geral (já com os filtros da barra)
  var somaLinha = function(id, tipo, nome, lista){ var d = lista.filter(function(l){ return !l.sub; }); return {id:id, tipo:tipo, nome:nome, total:soma(d, "total"), pago:soma(d, "pago"), aberto:soma(d, "aberto"), data:""}; };
  var linhasSoma = [somaLinha("soma|sorelly", "Sorelly", "Fornecedores e prestadores de serviços", visF), somaLinha("soma|familia", "Família", "Prestadores de serviços e sócios", visP)];
  var tabelaSoma = e(TabelaPlanilha,{key:"soma"+mes, cols:mkCols(true), linhas:linhasSoma, chave:"id", grade:true, semCaixaAlta:true, semContagem:true, semLimpar:true, semFiltro:true, semMao:true, totalRodape:function(){ return ["", "Total geral", brl(soma(linhasSoma, "total")), brl(soma(linhasSoma, "pago")), brl(soma(linhasSoma, "aberto")), ""]; }});
  var linhaAberta = detId ? todas.find(function(l){ return l.id===detId && !l.sub; }) : null;
  var fechaDet = function(){ if(verComp && verComp.url && !verComp.servidor) URL.revokeObjectURL(verComp.url); setVerComp(null); setZoomComp(0); setDetId(null); };
  var modalDet = linhaAberta ? e("div",{role:"dialog", "aria-modal":"true", "aria-label":"Detalhe de "+linhaAberta.nome, onMouseDown:function(ev){ if(ev.target===ev.currentTarget) fechaDet(); }, style:{left:(refRaiz.current ? Math.max(0, Math.round(refRaiz.current.getBoundingClientRect().left)) : 0)+"px", top:"54px"}, className:"fixed bottom-0 right-0 z-50 flex items-center justify-center bg-black/60 p-2"},   // o card fica centrado na área da aba (depois do menu lateral e das abas), não na janela inteira
    e(BlocoPainel,{titulo:linhaAberta.nome, compacto:true, cls:"max-h-full w-[min(96%,84rem)] !bg-[var(--bloco-colunas)] shadow-xl [&_table_th]:!h-[22px] [&_table_th_button]:!h-[22px] [&_table_th_button]:!py-0 [&_table_th_div]:!h-[22px]", dir:e("button",{type:"button", onClick:fechaDet, className:"h-5 cursor-pointer rounded border border-white/40 bg-white/10 px-2 text-[11px] font-semibold leading-none hover:bg-white/20"}, "Fechar")},
      e("div",{className:"flex min-h-0 flex-1 flex-col overflow-auto"}, detalhe(linhaAberta)))) : null;
  // COMPROVANTE (Marcus, 20/11/2026): bloco só com o comprovante, uma borda azul só, X no canto direito de cima, sem preto em volta (o bloco tem o tamanho da imagem e cabe na área da aba); clicar na imagem dá zoom (clicar de novo volta). Esc fecha.
  var fechaComp = function(){ if(verComp && verComp.url && !verComp.servidor) URL.revokeObjectURL(verComp.url); setVerComp(null); setZoomComp(0); };
  var areaL = refRaiz.current ? Math.max(0, Math.round(refRaiz.current.getBoundingClientRect().left)) : 0, maxLarg = Math.max(240, (typeof window!=="undefined" ? window.innerWidth : 1200)-areaL-40), maxAlt = Math.max(240, (typeof window!=="undefined" ? window.innerHeight : 800)-54-40);
  var modalComp = verComp ? e("div",{role:"dialog", "aria-modal":"true", "aria-label":"Comprovante", onMouseDown:function(ev){ if(ev.target===ev.currentTarget) fechaComp(); }, style:{left:areaL+"px", top:"54px"}, className:"fixed bottom-0 right-0 z-[60] flex items-center justify-center bg-black/30 p-4"},
    e("div",{className:"relative flex max-h-full max-w-full overflow-hidden rounded-lg border-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] shadow-xl"},
      e("button",{type:"button", "aria-label":"Fechar o comprovante", title:"Fechar", onClick:fechaComp, className:"absolute right-1 top-1 z-10 grid size-6 cursor-pointer place-items-center rounded bg-[var(--bloco-titulo)] text-white hover:brightness-125"}, e("svg",{viewBox:"0 0 24 24", width:16, height:16, fill:"none", stroke:"currentColor", strokeWidth:2.5, strokeLinecap:"round", "aria-hidden":"true"}, e("path",{d:"M6 6l12 12M18 6L6 18"}))),
      e("div",{className:"overflow-auto", style:{maxWidth:maxLarg+"px", maxHeight:maxAlt+"px"}},
        verComp.carregando ? e("p",{className:"p-4 text-center text-[13px]"}, "Abrindo…")
        : verComp.erro ? e("p",{className:"p-4 text-center text-[13px] text-warning"}, verComp.erro)
        : /^image\//.test(verComp.tipo || "") ? e("img",{src:verComp.url, alt:verComp.nome, title:zoomComp ? "Clique para diminuir" : "Clique para ampliar", onClick:function(ev){ if(zoomComp) setZoomComp(0); else setZoomComp(Math.round(ev.currentTarget.getBoundingClientRect().width*2.2)); }, style:zoomComp ? {width:zoomComp+"px", maxWidth:"none", maxHeight:"none"} : {maxWidth:maxLarg+"px", maxHeight:maxAlt+"px"}, className:"block h-auto w-auto "+(zoomComp ? "cursor-zoom-out" : "cursor-zoom-in")})
        : e("iframe",{src:verComp.url, title:verComp.nome, style:{width:Math.min(maxLarg, 900)+"px", height:maxAlt+"px"}, className:"block bg-white"})))) : null;
  var subTitulo = function(t){ return e("div",{className:"flex min-h-6 items-center justify-center border-y border-white/25 bg-[var(--bloco-titulo)] px-4 py-0.5 text-center text-[13px] font-bold uppercase leading-tight text-white"}, t); };   // faixa de título do bloco no mesmo tamanho da barra azul padrão do Financeiro (13 px)
  // TELA (Marcus, 20/11/2026): linha 1 = título RESUMO PAGAMENTOS; linha 2 = barra em tabela igual à Contas a pagar (busca, mês, vista, tipo, situação); embaixo os dois blocos.
  return e("div",{ref:refRaiz, className:PAGINA_CHEIA+" [&_*]:!normal-case [&_table_tbody_tr:last-child_td]:!border-b [&_table]:!border [&_table]:!border-solid [&_table]:!border-white [&_tbody_td]:!bg-[color-mix(in_srgb,var(--bloco-colunas)_38%,transparent)] [&_tr.rg-sub_td]:!bg-[var(--bloco-colunas)] [&_tr.rg-sel_td]:!bg-[var(--bloco-titulo)] [&_tr.rg-dono_td]:!border-t-2 [&_tr.rg-dono_td]:!border-t-white [&_table_tfoot_td]:!bg-[var(--bloco-titulo)] "+CLS_FINA_ESPACO},   // padrao-ok: letra de 10 px da tela Contas a receber (Marcus, 20/11/2026)
    e(BlocoPainel,{titulo:"Resumo - Pagamentos", compacto:true},
      e(BarraTabela,null,
        c.edita && e(CelulaBarra,{rotulo:"Pagamento"}, e("button",{type:"button", title:"Lançar um pagamento (escolhe o fornecedor e a data)", onClick:function(){ setLancando("novo"); }, style:{height:"18px"}, className:"cursor-pointer whitespace-nowrap rounded bg-[#E8B84B] px-3 text-[10px] font-semibold leading-none text-[#1a1306] outline-none hover:brightness-110 active:brightness-90 focus-visible:ring-2 focus-visible:ring-white"}, "+ Lançar pagamento")),   // padrao-ok: botão da barra compacta (18 px / 10 px), do tamanho da célula Situação
        e(CelulaBarra,{rotulo:"Buscar"}, e(BuscaMini,{valor:buscaTxt, aoMudar:setBuscaTxt, ph:"Nome, data, valor...", rotulo:"Buscar no resumo"})),
        e(CelulaBarra,{rotulo:"Mês"}, e(CampoMini,{valor:mes, aoMudar:setMes, rotulo:"Mês", ops:meses.map(function(m){ return [m, mesLabel(m+"-01")]; })})),
        e(CelulaBarra,{rotulo:"Vista"}, e(CampoMini,{valor:vista, aoMudar:setVista, rotulo:"Fornecedor com mais de uma janela no mês", ops:[["sep", "Separado"], ["com", "Com total"], ["tot", "Só total"]]})),
        e(CelulaBarra,{rotulo:"Tipo"}, e(CampoMini,{valor:tipoSel, aoMudar:setTipoSel, rotulo:"Tipo", ops:[["", "Todos"], ["Fornecedor", "Fornecedores"], ["Prestador", "Prestadores"], ["Produção externa", "Produção externa"], ["Sócio", "Sócios"]].concat(Object.keys(persNome).filter(function(id){ return (ffP.prest || []).some(function(x){ return x.ativo!==false && x.responsavelId===id; }); }).map(function(id){ return ["Prestador "+persNome[id], "Prestador "+persNome[id]]; }))})),
        e(CelulaBarra,{rotulo:"Situação"}, e(CampoMini,{valor:sitSel, aoMudar:setSitSel, rotulo:"Situação", ops:[["", "Todas"], ["aberto", "Em aberto"], ["atraso", "Em atraso"], ["quitado", "Quitadas"]]}))),
      (!tipoSel || tipoSel==="Fornecedor" || tipoSel==="Prestador" || tipoSel==="Produção externa") && subTitulo("Fornecedores e prestadores de serviços - Sorelly"),
      (!tipoSel || tipoSel==="Fornecedor" || tipoSel==="Prestador" || tipoSel==="Produção externa") && tabela("f", visF, true, "Total fornecedores e prestadores"),
      (!tipoSel || ehFamTipo(tipoSel) || tipoSel==="Sócio") && subTitulo("Prestadores de serviços família"),
      (!tipoSel || ehFamTipo(tipoSel) || tipoSel==="Sócio") && tabela("p", visP, true, "Total prestadores e sócios", true),
      subTitulo("Sorelly + Família"),
      tabelaSoma),
    modalDet,
    modalComp,
    lancando && e(JanelaLancarPag,{key:"lanc-"+lancando, c:c, chave:lancando==="novo" ? "" : lancando, fechar:function(){ setLancando(null); }}));
}
function AbaPfResumo(){ return e(ResumoGeral, null); }
export { AbaPfResumo, Geral, PainelPontual };
