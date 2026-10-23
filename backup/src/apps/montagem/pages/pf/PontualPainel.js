// Sorelly Admin · montagem — pages/pf/PontualPainel.js
// Painel da PONTUAL na tela de Negociações: resumo do ano (com nota = boleto, sem nota = Pix) e a lista de pedidos, um por linha, que abre e mostra os boletos e os Pix.
// As contas ficam em domain/pf.js (pedidos e parcelas); aqui só o desenho.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { LINHA, Tab, Td } from "@/apps/montagem/components/padrao";
import { hojeIso, mesAtual, mesLabel } from "@/apps/montagem/domain/pf";
import { COR, Chip, Etiqueta, Tile, brl, dbr, th, TD } from "@/apps/montagem/pages/pf/ui";
import { e, useState } from "@/shared/react";

var soma = function(ls, f){ return ls.reduce(function(t, x){ return t+f(x); }, 0); };
var ehBoleto = function(q){ return q.forma==="boleto"; };
var pct = function(a, b){ return b>0 ? Math.round(a/b*100)+"%" : "—"; };
var tdn = TD+" text-right font-mono whitespace-nowrap";

// uma tabelinha de parcelas (boletos ou Pix) de um pedido
function Parcelas(p){
  var ls = p.ls, hoje = hojeIso();
  if(!ls.length) return e("p",{className:"px-3 py-2 text-[13px] text-white"}, "Nenhuma parcela.");
  return e("div",{className:"overflow-hidden rounded-xl bg-black/25"},
    e("div",{className:"flex items-center justify-between px-3 py-1.5 text-[13px] font-bold text-white", style:{background:p.cor+"33"}}, e("span",null, p.t+" · "+ls.length), e("span",{className:"font-mono"}, brl(soma(ls, function(q){ return q.valor; })))),
    e("div",{className:"max-h-72 overflow-y-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",null, th("Vence"), th("Valor","text-right"), th("Situação"))),
      e("tbody",null, ls.map(function(q, i){ var pago = q.status==="Pago", atr = !pago && q.venc<hoje;
        return e("tr",{key:i, className:"border-t border-border/40"}, e("td",{className:TD}, dbr(q.venc)), e("td",{className:tdn}, brl(q.valor)), e("td",{className:TD}, e(Chip,{s:p.boleto ? {texto:pago ? "Pago" : (atr ? "Vencido" : "A vencer"), cor:pago ? "green" : (atr ? "gray" : "blue")} : {texto:pago ? "Pago" : (atr ? "Atrasado" : "A pagar"), cor:pago ? "green" : (atr ? "red" : "gray")}}))); })))));
}

function PontualPainel(p){
  var pf = p.pf, fid = pf.mqFornId, sa = useState(String(mesAtual().slice(0, 4))), ano = sa[0], setAno = sa[1], sb = useState({}), abertos = sb[0], setAbertos = sb[1];
  var todos = pf.pedidos.filter(function(x){ return x.fornId===fid; });
  var anos = Array.from(new Set(todos.map(function(x){ return x.data.slice(0, 4); }))).sort();
  var peds = todos.filter(function(x){ return x.data.slice(0, 4)===ano; }).sort(function(a, b){ return a.data.localeCompare(b.data); });
  var bol = function(x){ return x.parcelas.filter(ehBoleto); }, pix = function(x){ return x.parcelas.filter(function(q){ return !ehBoleto(q); }); };
  var tBol = soma(peds, function(x){ return soma(bol(x), function(q){ return q.valor; }); }), tPix = soma(peds, function(x){ return soma(pix(x), function(q){ return q.valor; }); }), total = tBol+tPix;
  var pPago = soma(peds, function(x){ return soma(pix(x).filter(function(q){ return q.status==="Pago"; }), function(q){ return q.valor; }); }), pFalta = tPix-pPago;
  var hoje = hojeIso(), atrasados = soma(peds, function(x){ return soma(x.parcelas.filter(function(q){ return q.status!=="Pago" && !ehBoleto(q) && q.venc<hoje; }), function(q){ return q.valor; }); });
  var nBol = soma(peds, function(x){ return bol(x).length; }), nPix = soma(peds, function(x){ return pix(x).length; });
  var alterna = function(k){ var o = Object.assign({}, abertos); o[k] = !o[k]; setAbertos(o); };
  var anoBtn = function(a){ var on = a===ano; return e("button",{key:a, type:"button", onClick:function(){ setAno(a); }, className:"h-9 rounded-lg px-4 text-[13px] font-bold ring-1 "+(on ? "text-white" : "bg-muted/40 text-white/85 ring-white/15 hover:bg-white/10"), style:on ? {background:"linear-gradient(135deg,#3B82F666,#3B82F622)", boxShadow:"inset 0 0 0 1px #3B82F6cc"} : undefined}, a); };

  var rows = [], atual = mesAtual(), prox = (function(){ var a = atual.split("-"), t = parseInt(a[0], 10)*12+parseInt(a[1], 10); return Math.floor(t/12)+"-"+String(t%12+1).padStart(2, "0"); })();
  peds.forEach(function(x, i){
    var b = bol(x), px = pix(x), vb = soma(b, function(q){ return q.valor; }), vp = soma(px, function(q){ return q.valor; }), pg = soma(px.filter(function(q){ return q.status==="Pago"; }), function(q){ return q.valor; }), falta = vp-pg, mes = x.data.slice(0, 7), ab = !!abertos[x.id];
    var atr = px.some(function(q){ return q.status!=="Pago" && q.venc<hoje; });
    var st = falta<=0.005 ? {texto:"Pix quitado", cor:"green"} : (atr ? {texto:"Pix em atraso", cor:"red"} : {texto:"Pix a pagar", cor:"gray"});
    var fundo = mes===atual ? COR.blue+"2e" : (mes===prox ? COR.purple+"2e" : undefined);
    rows.push(e("tr",{key:x.id, onClick:function(){ alterna(x.id); }, className:LINHA+" cursor-pointer hover:bg-white/5", style:fundo ? {background:fundo} : undefined},
      e(Td,{className:"w-8 px-1 text-white/50"}, i+1), e(Td,{forte:true, className:"text-left"}, /^Renegoc/.test(x.numero) ? "Renegociação" : mesLabel(mes+"-01")),
      e(Td,{dinheiro:true, forte:true}, brl(x.total)), e(Td,{dinheiro:true}, brl(vb)), e(Td,{dinheiro:true}, brl(vp)), e(Td,null, pct(vb, vb+vp)+" / "+pct(vp, vb+vp)),
      e(Td,null, b.length+" · "+px.length), e(Td,{dinheiro:true, cor:pg>0 ? "ok" : undefined}, brl(pg)), e(Td,{dinheiro:true, cor:falta>0.005 ? "alerta" : undefined}, brl(falta)), e(Td,null, e(Chip,{s:st}))));
    if(ab) rows.push(e("tr",{key:x.id+"|d"}, e("td",{colSpan:10, className:"bg-black/30 p-2"},
      e("div",{className:"mb-2 flex flex-wrap items-center gap-x-6 gap-y-1 px-1 text-[13px] text-white"}, e("span",null, "Pedido: ", e("b",null, x.numero)), x.cnpj && e("span",null, "Pagador: ", e("b",null, x.cnpj)), x.nfNum && e("span",null, "NF: ", e("b",null, x.nfNum)),
        e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); p.abrirDetalhe(x.id); }, className:"ml-auto h-8 rounded-lg bg-muted/60 px-3 text-[12.5px] font-bold text-white hover:bg-white/15"}, "Abrir pedido")),
      e("div",{className:"grid grid-cols-1 gap-3 lg:grid-cols-2"}, e(Parcelas,{t:"Boletos (com nota)", cor:COR.blue, ls:b, boleto:true}), e(Parcelas,{t:"Pix (sem nota)", cor:COR.green, ls:px}))))); });
  rows.push(e("tr",{key:"t", className:LINHA+" bg-white/10"}, e(Td,null, ""), e(Td,{forte:true, className:"text-left"}, "Total "+ano), e(Td,{dinheiro:true, forte:true}, brl(total)), e(Td,{dinheiro:true, forte:true}, brl(tBol)), e(Td,{dinheiro:true, forte:true}, brl(tPix)), e(Td,{forte:true}, pct(tBol, total)+" / "+pct(tPix, total)), e(Td,{forte:true}, nBol+" · "+nPix), e(Td,{dinheiro:true, forte:true, cor:"ok"}, brl(pPago)), e(Td,{dinheiro:true, forte:true, cor:"alerta"}, brl(pFalta)), e(Td,null, "")));

  return e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"flex flex-wrap items-center gap-2"}, e(Etiqueta,{nome:"Pontual", g:true}), e("span",{className:"ml-3 text-[12px] font-bold uppercase tracking-wide text-white/70"}, "Ano"), anos.map(anoBtn)),
    e(BlocoBarra,{t:"Pontual · resumo de "+ano, cor:"azul", compacto:true, dir:brl(total)},
      e("div",{className:"flex flex-col gap-3 p-3"},
        e("div",{className:"grid grid-cols-2 gap-3 xl:grid-cols-5"}, e(Tile,{t:"Total em pedidos", v:brl(total), cor:COR.blue, sub:peds.length+" pedidos em "+ano}), e(Tile,{t:"Com nota (boleto)", v:brl(tBol), cor:COR.cyan, sub:pct(tBol, total)+" · "+nBol+" boletos"}), e(Tile,{t:"Sem nota (Pix)", v:brl(tPix), cor:COR.purple, sub:pct(tPix, total)+" · "+nPix+" Pix"}), e(Tile,{t:"Pix pago", v:brl(pPago), cor:COR.green, sub:pct(pPago, tPix)+" do Pix"}), e(Tile,{t:"Pix que falta", v:brl(pFalta), cor:pFalta>0.005 ? COR.orange : COR.green, sub:atrasados>0.005 ? "atrasado: "+brl(atrasados) : "nada atrasado"})),
        e("div",{className:"flex h-3 w-full overflow-hidden rounded-full bg-white/10", title:"Boleto x Pix"}, e("div",{style:{width:(total>0 ? tBol/total*100 : 0)+"%", background:COR.cyan}}), e("div",{style:{width:(total>0 ? tPix/total*100 : 0)+"%", background:COR.purple}})))),
    e(BlocoBarra,{t:"Pedidos da Pontual · "+ano, cor:"azul", compacto:true},
      e("div",{className:"p-2"}, e(Tab,{normal:true, cols:["#", "Pedido", "Total", "Com nota (boleto)", "Sem nota (Pix)", "Boleto / Pix", "Parcelas", "Pix pago", "Pix que falta", "Situação"]}, rows))));
}

export { PontualPainel };
