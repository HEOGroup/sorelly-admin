// Sorelly Admin · montagem — pages/pf/Resumo.js
// GERAL (Pagamentos a Fornecedores): o "RESUMO MÊS" da planilha, ao vivo. Abre no MÊS atual; troca de mês ou ano todo; escolhe um fornecedor e vê mês a mês.
// DOIS FORMATOS (botões no alto): BLOCOS (cartões grandes) e PLANILHA (tudo em tabela).
// Blocos: sempre as 3 dezenas do mês E as 3 dezenas do mês seguinte; concluída em verde, pagando agora em azul (já aberta), atrasada em vermelho. Clicar abre o mês e a dezena direto.
// Pontual: tudo que passa no cartão em um mês desconta a partir da 1ª dezena do mês seguinte (parcelas dos cartões dos meses anteriores + a estimativa do mês que ainda não fechou:
// passou -5%, dividido em 3 parcelas, "a confirmar"; os números EST_DESC e EST_PARC abaixo são provisórios).
// As contas ficam em domain/pf.js (contaForn, janelasDoForn, pagoPix, mqAplicado, mq*); aqui só o desenho. Sócios ficam no Financeiro familiar.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { cicloDe, contaForn, ehPrestador, hojeIso, janelasDoForn, lancDaJanela, mesAtual, mesLabel, mqAplicado, mqBruto, mqDescontoNoMes, mqOrigensDoMes, mqPassadasDoMes, mqParcela, pagoPix, statusConta } from "@/apps/montagem/domain/pf";
import { LINHA, Tab, Td } from "@/apps/montagem/components/padrao";
import { COR, Chip, Etiqueta, Sel, corForn, TD, Tile, brl, dbr, th, usePf } from "@/apps/montagem/pages/pf/ui";
import { PageHead } from "@/apps/montagem/ui/page";
import { JanelaPedido, pedidoNovo } from "@/apps/montagem/pages/pf/Negociacoes";
import { ModalForn } from "@/apps/montagem/pages/pf/Fornecedores";
import { LimiteAno, LimiteMes } from "@/apps/montagem/pages/pf/Limite";
import { e, useState } from "@/shared/react";

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
  var pf = p.pf, atual = mesAtual(), prox = mesMais(atual, 1), set = {};
  Object.keys(pf.mqFech).forEach(function(m){ set[m] = 1; }); pf.mqPassadas.forEach(function(x){ set[x.data.slice(0, 7)] = 1; });
  var origens = Object.keys(set).sort().map(function(m){
    var bruto = mqBruto(pf, m), fe = pf.mqFech[m], est = !fe, liq = fe ? fe.liquido : bruto*(1-EST_DESC), par = fe ? fe.parcelas : EST_PARC;
    return {m:m, bruto:bruto, liq:liq, par:par, parc:par>0 ? liq/par : 0, est:est, meses:Array.from({length:par}, function(_, i){ return mesMais(m, i+1); })};
  }).filter(function(o){ return o.bruto>0 || !o.est; });
  var ultimo = origens.reduce(function(mx, o){ return o.meses.length && o.meses[o.meses.length-1]>mx ? o.meses[o.meses.length-1] : mx; }, prox);
  var cols = []; for(var c = atual; c<=ultimo && cols.length<24; c = mesMais(c, 1)) cols.push(c);
  var velhas = origens.filter(function(o){ return !o.meses.length || o.meses[o.meses.length-1]<atual; }), novas = origens.filter(function(o){ return velhas.indexOf(o)<0; });
  var aberto = !!p.abertos["mqvelhas"], corCol = function(m){ return m===atual ? "#94A3B8" : null; };
  var linha = function(o){ return e("tr",{key:o.m, className:"border-t border-border/40"},
    e("td",{className:TD}, e("b",null, mesLabel(o.m+"-01")), o.est && e("span",{className:"ml-2 text-[11px] font-bold text-[#F3D98B]"}, "a confirmar")),
    e("td",{className:tdn}, brl(o.bruto)), e("td",{className:tdn}, brl(Math.max(0, o.bruto-o.liq))), e("td",{className:tdn}, brl(o.liq)), e("td",{className:tdn+" text-center"}, o.par+"x"), e("td",{className:tdn}, brl(o.parc)),
    cols.map(function(m){ var i = o.meses.indexOf(m), cor = corCol(m); return e("td",{key:m, className:tdn+" text-center", style:cor ? {background:cor+"22"} : undefined}, i>=0 ? brl(o.parc) : ""); })); };
  var tot = function(m){ return novas.reduce(function(t, o){ return t+(o.meses.indexOf(m)>=0 ? o.parc : 0); }, 0); };
  var cab = function(txt, cor, k){ return e("th",{key:k, className:"px-2 py-1.5 text-center text-[12px] font-bold uppercase text-white", style:cor ? {background:cor+"55"} : undefined}, txt); };
  return e("div",{className:"overflow-x-auto p-2"}, e("table",{className:"w-full border-collapse"},
    e("thead",null, e("tr",null, cab("Compras no cartão em"), cab("Valor total"), cab("Juros"), cab("Líquido"), cab("Parcelas"), cab("Valor da parcela"), cols.map(function(m){ return cab("Desconta em "+mesLabel(m+"-01").slice(0, 3)+"/"+m.slice(2, 4), corCol(m), m); }))),
    e("tbody",null,
      velhas.length>0 && e("tr",{key:"v", onClick:function(){ p.alterna("mqvelhas", aberto); }, className:"cursor-pointer border-t border-border/40 bg-white/5 hover:bg-white/10"}, e("td",{colSpan:6+cols.length, className:TD}, e("b",null, "Meses anteriores ("+velhas.length+"): já descontados"))),
      aberto && velhas.map(linha), novas.map(linha),
      e("tr",{key:"t", className:"border-t-2 border-white/30 bg-white/10"}, e("td",{className:TD, colSpan:6}, e("b",null, "Desconto no mês")), cols.map(function(m){ return e("td",{key:m, className:tdn+" text-center font-bold"}, brl(tot(m))); })))));
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
  if(!meses.length) return e("p",{className:"px-3 py-4 text-[14px] text-white"}, "Nada lançado para este fornecedor em "+ANO+".");
  var tot = function(js, k){ return js.reduce(function(t, x){ return t+(k==="total" ? x.j.total : x[k]); }, 0); };
  var base = meses.reduce(function(t, x){ return t+tot(x.js, "total"); }, 0), maior = Math.max.apply(null, meses.map(function(x){ return tot(x.js, "total"); }))||1;
  var barra = function(v, cor){ return e("td",{className:"w-44 px-2"}, e("div",{className:"h-2 w-full overflow-hidden rounded-full bg-white/10"}, e("div",{className:"h-full rounded-full", style:{width:Math.max(2, Math.round(v/maior*100))+"%", background:cor}}))); };
  var pct = function(a, b){ return b>0 ? (a/b*100).toFixed(1).replace(".", ",")+"%" : "—"; };
  var rows = [];
  meses.forEach(function(x, i){
    var k = "am|"+x.m, ab = p.abertos[k]===undefined ? (x.m===mesAtual() || x.m===mesMais(mesAtual(), 1)) : p.abertos[k], tt = tot(x.js, "total"), pg = tot(x.js, "pago"), fl = tot(x.js, "falta");
    rows.push(e("tr",{key:k, onClick:function(){ p.alterna(k, ab); }, className:LINHA+" cursor-pointer hover:bg-white/5", style:x.m===mesAtual() ? {background:COR.blue+"2e"} : (x.m===mesMais(mesAtual(), 1) ? {background:COR.purple+"2e"} : undefined)}, e(Td,{className:"w-8 px-1 text-white/50"}, i+1), e(Td,{forte:true, className:"text-left"}, mesLabel(x.m+"-01"), e("span",{className:"ml-2 text-[11px] font-normal text-white/45"}, x.js.length+" dezenas")),
      e(Td,{dinheiro:true, cor:pg>0 ? "ok" : undefined}, brl(pg)), e(Td,{dinheiro:true, cor:fl>0.005 ? "alerta" : undefined}, brl(fl)), e(Td,{dinheiro:true, forte:true}, brl(tt)), e(Td,{forte:true, cor:"info"}, pct(pg, tt))));
    if(ab) x.js.forEach(function(d){
      var kd = "w|"+d.j.chave, abd = p.abertos[kd]===undefined ? abertoPadrao(d, x.m) : p.abertos[kd], s = SIT[d.sit];
      rows.push(e("tr",{key:kd, onClick:function(){ p.alterna(kd, abd); }, className:LINHA+" cursor-pointer bg-black/20 hover:bg-white/5"}, e(Td,{className:"w-8 border-l-4 border-l-[#3B82F6] px-1"}, ""),
        e(Td,{className:"text-left"}, e("span",{className:"text-[12.5px]", style:{marginLeft:"6px"}}, e("b",{className:"text-[#93C5FD]"}, p.f.nome), " · "+d.rot+" · até "+dbr(d.j.limite).slice(0, 5)), e("span",{className:"ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold", style:{background:s.cor+"26", color:s.cor}}, s.txt+(d.est>0 ? " (est.)" : ""))),
        e(Td,{dinheiro:true, cor:d.pago>0 ? "ok" : undefined}, brl(d.pago)), e(Td,{dinheiro:true, cor:d.falta>0.005 ? "alerta" : undefined}, brl(d.falta)), e(Td,{dinheiro:true}, brl(d.j.total)), e(Td,{cor:"info"}, pct(d.pago, d.j.total))));
      if(abd && lancDaJanela(pf, d.j.chave).length) rows.push(e("tr",{key:kd+"|d"}, e("td",{colSpan:6, className:"bg-black/30 p-2"}, e(Pagamentos,{pf:pf, x:d}))));
    });
  });
  rows.push(e("tr",{key:"t", className:LINHA+" bg-white/10"}, e(Td,null, ""), e(Td,{forte:true, className:"text-left"}, "Total"), e(Td,{dinheiro:true, cor:"ok", forte:true}, brl(meses.reduce(function(t, x){ return t+tot(x.js, "pago"); }, 0))), e(Td,{dinheiro:true, cor:"alerta", forte:true}, brl(meses.reduce(function(t, x){ return t+tot(x.js, "falta"); }, 0))), e(Td,{dinheiro:true, forte:true}, brl(base)), e(Td,{forte:true}, "100,0%")));
  return e("div",{className:"p-2"}, e(Tab,{normal:true, cols:["#", "Mês", "Pago", "Falta pagar", "A pagar", "% pago"]}, rows));
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
function PainelPontual(p){
  var pf = p.pf, f = p.f, D = dadosPontual(pf, f), atual = mesAtual(), prox = mesMais(atual, 1), hoje = hojeIso();
  var sa = useState(atual.slice(0, 4)), ano = sa[0], setAno = sa[1], sb = useState({}), abPed = sb[0], setAbPed = sb[1];
  var tot = D.bPrev+D.pPrev, pago = D.bPago+D.pPago, falta = Math.max(0, tot-pago), pixDinPago = D.pPago-D.mqPago;
  var mqOn = D.ehMq, esteMes = mqOn ? mqDescontoNoMes(pf, atual) : 0, aFrente = D.mq-D.mqPago;
  var fundo = function(m){ return m===atual ? {background:"rgba(255,255,255,.08)"} : undefined; };
  // 1) MAQUININHA, no alto
  var item = function(rot, v, cor){ return e("div",{key:rot, className:"flex flex-col items-center px-3 text-center"}, e("span",{className:"text-[11px] font-bold uppercase text-white/75"}, rot), e("b",{className:"font-mono text-[20px] leading-tight", style:{color:cor||"#fff"}}, v)); };
  var proximos = [0, 1, 2, 3].map(function(i){ var m = mesMais(atual, i); return mesLabel(m+"-01").slice(0, 3)+" "+brl(mqDescontoNoMes(pf, m)); }).join("  ·  ");
  var maq = !mqOn ? null : e(BlocoBarra,{t:"Maquininha · cartão (desconta do Pix)", cor:"azul", compacto:true, dir:brl(D.passou)},
    e("div",{className:"flex flex-col gap-2 p-3"},
      e("div",{className:"flex flex-wrap items-start justify-around gap-y-2"}, item("Passou no cartão no ano", brl(D.passou)), item("Já descontado do Pix", brl(D.mqPago)), item("Desconta neste mês", brl(esteMes)), item("Ainda vai descontar", brl(aFrente))),
      e("p",{className:"text-center text-[12.5px] text-white/80"}, "Próximos descontos: "+proximos)));
  // 2) O QUE PAGAR x O QUE FOI PAGO
  var linhaQ = function(rot, sub, a, b, cc, forte){ return e("tr",{key:rot, className:LINHA+(forte ? " bg-white/10" : "")}, e(Td,{forte:true, className:"text-left"}, rot, sub && e("span",{className:"ml-2 text-[11px] font-normal text-white/55"}, sub)), e(Td,{dinheiro:true, forte:true}, brl(a)), e(Td,{dinheiro:true, cor:"ok"}, brl(b)), e(Td,{dinheiro:true, cor:cc>0.005 ? "alerta" : "ok"}, brl(cc)), e(Td,{forte:true, cor:"info"}, pc(b, a))); };
  var linhaD = function(rot, v, cor){ return e("tr",{key:rot, className:LINHA+" bg-black/20"}, e(Td,{className:"pl-8 text-left text-white/80"}, "↳ "+rot), e(Td,null, ""), e(Td,{dinheiro:true, cor:cor}, v), e(Td,null, ""), e(Td,null, "")); };
  var quadro = e(BlocoBarra,{t:"O que pagar × o que foi pago · "+ANO, cor:"azul", compacto:true, dir:brl(falta)+" a pagar"}, e("div",{className:"p-2"}, e(Tab,{normal:true, cols:["", "Total negociado", "Já pago", "Falta pagar", "% pago"]},
    linhaQ("Total do ano", "boleto + Pix", tot, pago, falta, true),
    linhaQ("Boleto", D.nBol+" boletos (com nota)", D.bPrev, D.bPago, D.bPrev-D.bPago),
    linhaQ("Pix", "sem nota", D.pPrev, D.pPago, D.pPrev-D.pPago),
    mqOn && linhaD("pago em dinheiro (Pix de revendedora)", brl(pixDinPago), "ok"),
    mqOn && linhaD("pago pelo desconto da maquininha", brl(D.mqPago), "ok"),
    mqOn && linhaD("maquininha que ainda vai descontar (dentro do que falta)", brl(aFrente), "alerta"))),
    e("p",{className:"px-4 pb-3 text-[12px] text-white/70"}, "Boleto vencido antes de "+mesLabel(atual+"-01")+" conta como pago (regra da planilha)."+(mqOn ? " Cada parcela da maquininha é descontada do Pix." : "")));
  // 3) PEDIDOS: para onde vai cada negociação
  var anos = Array.from(new Set(pf.pedidos.filter(function(x){ return x.fornId===f.id; }).map(function(x){ return x.data.slice(0, 4); }))).sort();
  var peds = pf.pedidos.filter(function(x){ return x.fornId===f.id && x.data.slice(0, 4)===ano; }).sort(function(a, b){ return a.data.localeCompare(b.data) || a.id-b.id; });
  var rows = [];
  peds.forEach(function(x, i){
    var bs = x.parcelas.filter(function(q){ return q.forma==="boleto"; }), px = x.parcelas.filter(function(q){ return q.forma!=="boleto"; });
    var vb = bs.reduce(function(t, q){ return t+q.valor; }, 0), vp = px.reduce(function(t, q){ return t+q.valor; }, 0);
    var pb = bs.filter(function(q){ return q.status==="Pago" || q.venc.slice(0, 7)<atual; }).reduce(function(t, q){ return t+q.valor; }, 0), pp = px.filter(function(q){ return q.status==="Pago"; }).reduce(function(t, q){ return t+q.valor; }, 0);
    var fl = Math.max(0, vb+vp-pb-pp), mes = x.data.slice(0, 7), ab = !!abPed[x.id], nf = /^Pontual NF/.test(x.numero), vs = x.parcelas.map(function(q){ return q.venc; }).sort();
    var atr = px.some(function(q){ return q.status!=="Pago" && q.venc<hoje; });
    var st = fl<=0.005 ? {texto:"Quitado", cor:"green"} : (atr ? {texto:"Pix em atraso", cor:"red"} : {texto:"A pagar", cor:"gray"});
    rows.push(e("tr",{key:x.id, onClick:function(){ var o = Object.assign({}, abPed); o[x.id] = !ab; setAbPed(o); }, className:LINHA+" cursor-pointer hover:bg-white/5", style:fundo(mes)},
      e(Td,{forte:true, className:"text-left"}, nf ? e("span",null, x.numero.replace("Pontual ", ""), e("span",{className:"ml-2 rounded px-1.5 text-[10.5px]", style:{background:"rgba(255,255,255,.18)"}}, "NF")) : (/^Renegoc/.test(x.numero) ? "Renegociação" : mesLabel(mes+"-01"))),
      e(Td,{className:"text-white/85"}, nf ? String(x.cnpj||"") : "—"),
      e(Td,{dinheiro:true, forte:true}, brl(x.total)), e(Td,{dinheiro:true}, brl(vb)), e(Td,{dinheiro:true}, brl(vp)), e(Td,{dinheiro:true, cor:pb+pp>0 ? "ok" : undefined}, brl(pb+pp)), e(Td,{dinheiro:true, cor:fl>0.005 ? "alerta" : "ok"}, brl(fl)),
      e(Td,null, vs.length ? dbr(vs[0]).slice(0, 5)+" a "+dbr(vs[vs.length-1]).slice(0, 5)+"/"+vs[vs.length-1].slice(2, 4) : "—"), e(Td,null, e(Chip,{s:st}))));
    if(ab) rows.push(e("tr",{key:x.id+"|d"}, e("td",{colSpan:9, className:"bg-black/30 p-2"},
      e("div",{className:"mb-2 flex flex-wrap items-center gap-x-6 gap-y-1 px-1 text-[13px] text-white"}, e("span",null, "Pedido: ", e("b",null, x.numero)), x.cnpj && e("span",null, "Quem paga: ", e("b",null, x.cnpj)), x.nfNum && e("span",null, "NF: ", e("b",null, x.nfNum)),
        p.abrirDetalhe && e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); p.abrirDetalhe(x.id); }, className:"ml-auto h-8 rounded-lg bg-muted/60 px-3 text-[12.5px] font-bold text-white hover:bg-white/15"}, "Abrir pedido")),
      e("div",{className:"grid grid-cols-1 gap-3 lg:grid-cols-2"}, e(ParcelasPed,{t:"Boletos (com nota)", cor:"#CBD5E1", ls:bs.slice().sort(function(a, b){ return a.venc.localeCompare(b.venc); }), boleto:true}), e(ParcelasPed,{t:"Pix (sem nota)", cor:COR.green, ls:px.slice().sort(function(a, b){ return a.venc.localeCompare(b.venc); })}))))); });
  var anoBtn = function(a){ var on = a===ano; return e("button",{key:a, type:"button", onClick:function(){ setAno(a); }, className:"h-8 rounded-lg px-4 text-[13px] font-bold ring-1 "+(on ? "text-white" : "bg-muted/40 text-white/85 ring-white/15 hover:bg-white/10"), style:on ? {background:"linear-gradient(135deg,#3B82F666,#3B82F622)", boxShadow:"inset 0 0 0 1px #3B82F6cc"} : undefined}, a); };
  var pedidos = e(BlocoBarra,{t:"Pedidos e negociações · para onde vai cada pagamento", cor:"azul", compacto:true, dir:peds.length+" pedidos em "+ano},
    e("div",{className:"p-2"}, e("div",{className:"mb-2 flex flex-wrap items-center gap-2 px-1"}, e("span",{className:"text-[12px] font-bold uppercase text-white/70"}, "Ano"), anos.map(anoBtn), e("span",{className:"ml-auto text-[12px] text-white/70"}, "Clique no pedido para ver os boletos e os Pix")),
      e(Tab,{normal:true, cols:["Pedido", "Quem paga", "Total", "Boleto", "Pix", "Já pago", "Falta", "Vencimentos", "Situação"]}, rows)));
  // 4) MESES E DEZENAS (Pix) e CRONOGRAMA DA MAQUININHA
  var meses = e(BlocoBarra,{t:"Meses e dezenas · Pix", cor:"azul", compacto:true}, e(TabelaAnalise,{pf:pf, f:f, meses:MESES_ANO, hoje:p.hoje||hoje, abertos:p.abertos, alterna:p.alterna}));
  var cron = !mqOn ? null : e(BlocoBarra,{t:"Cronograma de descontos da maquininha", cor:"azul", compacto:true}, e(TabelaDescontos,{pf:pf, abertos:p.abertos, alterna:p.alterna}));
  return e("div",{className:"flex flex-col gap-3"}, maq, quadro, pedidos, meses, cron);
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
    f1 ? btnAcao("+ Lançar nova negociação", function(){ P.novaNeg(f1.id); }) : [btnAcao("+ Nova negociação", function(){ P.novaNeg(null); }), btnAcao("+ Novo fornecedor", function(){ P.novoCad("forn"); }), btnAcao("+ Novo prestador de serviço", function(){ P.novoCad("prest"); })]);

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
  var lf = linhasDe(fornecedores, mes), lp = linhasDe(prestadores, mes), todosL = lf.concat(lp);
  var total = somaC(todosL, "total"), pago = somaC(todosL, "pago"), falta = total-pago;
  var mqMes = pf.mqFornId ? {bruto:mqBruto(pf, mes), desc:mqDescontoNoMes(pf, mes)} : null;
  var bloco = function(titulo, linhas){ return e(BlocoBarra,{t:titulo, cor:"azul", compacto:true, dir:brl(somaC(linhas, "total"))}, e("div",{className:"overflow-x-auto p-3"}, e("table",{className:"w-full border-collapse"},
    e("thead",null, e("tr",null, th("Fornecedor"), th("A pagar","text-right"), th("Pago","text-right"), th("Saldo","text-right"), th("Próximo prazo"), th("Status"))),
    e("tbody",null, !linhas.length ? e("tr",null, e("td",{colSpan:6, className:"px-3 py-6 text-center text-[14px] text-white"}, "Nada neste mês.")) : linhas.map(function(x){ return Linha({abrir:abrirForn, f:x.f, c:x.c, mes:mes, pf:pf, hoje:hoje, formato:formato, abertos:abertos, alterna:alterna}); }),
      linhas.length>0 && e("tr",{className:"bg-black/25 font-bold"}, e("td",{className:TD}, "Total"), e("td",{className:tdn}, brl(somaC(linhas, "total"))), e("td",{className:tdn, style:{color:COR.green}}, brl(somaC(linhas, "pago"))), e("td",{className:tdn, style:{color:COR.red}}, brl(somaC(linhas, "aberto"))), e("td",{className:TD}), e("td",{className:TD})))))); };
  return e("div",{className:"flex flex-col gap-3"},
    e(PageHead,{t:"Geral · "+mesLabel(mes+"-01"), sub:"O resumo do mês de cada fornecedor e prestador de serviço, ao vivo. Clique numa linha para abrir as 3 dezenas do mês e as 3 do mês seguinte."}), seletor,
    e("div",{className:"grid grid-cols-2 gap-3 md:grid-cols-5"}, e(Tile,{t:"A pagar no mês", v:brl(total), cor:"#CBD5E1", sub:todosL.length+" fornecedores e prestadores"}), e(Tile,{t:"Pago", v:brl(pago), cor:COR.green}), e(Tile,{t:"Falta pagar", v:brl(Math.max(0, falta)), cor:falta>0.005 ? COR.red : COR.green}), e(Tile,{t:"Pago do total", v:(total>0 ? Math.round(pago/total*100) : 0)+"%", cor:"#CBD5E1"}), mqMes && e(Tile,{t:"Maquininha no mês", v:brl(mqMes.bruto), cor:"#CBD5E1", sub:"desconto caindo: "+brl(mqMes.desc)})),
    e(LimiteMes,{pf:pf, mes:mes}),
    bloco("Fornecedores", lf), bloco("Prestadores de serviço", lp));
}

// casca da Geral: guarda as janelas de "Lançar negociação" e de "Novo fornecedor / prestador de serviço" (as mesmas das telas de Negociações e Fornecedores)
function Geral(){
  var c = usePf(), pf = c.pf, sp = useState(null), ped = sp[0], setPed = sp[1], sn = useState(null), novo = sn[0], setNovo = sn[1];
  var novaNeg = function(fid){ var n = pedidoNovo(pf); if(fid) n = Object.assign({}, n, {fornId:fid}); setPed(n); };
  return e("div",null, e(GeralInterno,{novaNeg:novaNeg, novoCad:setNovo}),
    ped && e(JanelaPedido,{c:c, pf:pf, ped:ped, setPed:setPed}),
    novo && e(ModalForn,{key:"novo-"+novo, c:c, f:null, prest:novo==="prest", fechar:function(){ setNovo(null); }}));
}

function AbaPfResumo(){ return e(Geral, null); }
export { AbaPfResumo, PainelPontual };
