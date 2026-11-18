// Sorelly Admin · montagem — pages/cadpecas/Controle.js
// Cadastro de peças › Pedidos › "Pedidos Banho/Bruto" (antes "Controle de compras"). REFEITA em 17/11/2026 no MODELO 3 (BARRAS), escolhido pelo Marcus (docs/ideias/compras-de-bruto-4-modelos.html): "tinha muita informação na tela".
// Um bloco só: o título já diz o mês, o total (bruto + banho) e quanto subiu ou desceu; o menu do mês fica no canto direito da barra; embaixo, duas listas em barras:
// Por fornecedor (a pagar de bruto) e Por categoria (peças). Cada barra tem o tamanho da fatia e o valor ao lado. As tabelas de antes (resumo, por fornecedor, por categoria e mês a mês) saíram;
// o mês a mês completo continua no Resumo por mês da tela Compras de Bruto. Contas: controleMes em domain/cadastro-pecas.js (a mesma do Resumo por mês).
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { Pagina } from "@/apps/montagem/components/padrao";
import { CAMPO, brl } from "@/apps/montagem/components/padrao-fin";
import { controleMes, mesesCpc } from "@/apps/montagem/domain/cadastro-pecas";
import { rotuloMes } from "@/apps/montagem/pages/cadpecas/Pedidos";
import { useCpc } from "@/apps/montagem/pages/cadpecas/visualCad";
import { Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { e, useState } from "@/shared/react";

var COR_FORN = "#5B8DEF", COR_CAT = "#A78BFA";

var pc = function(f){ return (Math.round((f||0)*1000)/10).toString().replace(".", ",")+"%"; };
var num = function(v){ return Math.round(v||0).toLocaleString("pt-BR"); };
function cap(t){ return t ? t.charAt(0).toUpperCase()+t.slice(1) : t; }

// uma linha: nome, barra do tamanho da fatia (a maior vale 100%) e o valor ao lado
function LinhaBarra(p){
  return e("div",{className:"grid grid-cols-[minmax(84px,130px)_minmax(0,1fr)_auto] items-center gap-2 border-t border-white/15 px-2 py-1 text-[11px] tabular-nums first:border-t-0"},
    e("b",{className:"text-left uppercase tracking-[.03em]"}, p.nome),
    e("div",{className:"h-2.5 overflow-hidden rounded-full bg-white/15"}, e("i",{className:"block h-full rounded-full", style:{width:Math.max(2, Math.min(100, p.w*100))+"%", background:p.cor}})),
    e("span",{className:"whitespace-nowrap text-right"}, p.valor));
}

// junta vários meses numa conta só (ano inteiro ou todo o período): mesmas somas que controleMes faz para um mês
function juntar(c, ms){
  var t = {n:0, valor:0, pagar:0, pecas:0}, banho = 0, forn = {}, cats = {};
  ms.forEach(function(k){
    var m = controleMes(c, k); t.n += m.t.n; t.valor += m.t.valor; t.pagar += m.t.pagar; t.pecas += m.t.pecas; banho += m.banho;
    m.forn.forEach(function(l){ var o = forn[l.forn] || (forn[l.forn] = {forn:l.forn, n:0, valor:0, pagar:0, pecas:0}); o.n += l.n; o.valor += l.valor; o.pagar += l.pagar; o.pecas += l.pecas; });
    m.cats.forEach(function(l){ var key = l.k || l.nome, o = cats[key] || (cats[key] = {k:l.k, nome:l.nome, q:0}); o.q += l.q; });
  });
  return {t:t, banho:banho, forn:Object.keys(forn).map(function(k){ return forn[k]; }), cats:Object.keys(cats).map(function(k){ return cats[k]; })};
}

function AbaControle(){
  var x = useCpc(), c = x.c, meses = mesesCpc(c), sm = useState(""), per = sm[0] || (meses[0] ? "mes:"+meses[0] : "");
  if(!meses.length) return e(Pagina,null, e(Vazio,{ic:"chart-bar"}, "Ainda não há pedidos lançados."));
  // período (Marcus, 17/11/2026): mês atual, um mês qualquer, o ano inteiro (todos os meses dele) ou todo o período
  var anos = meses.map(function(k){ return k.slice(0, 4); }).filter(function(a, i, l){ return l.indexOf(a)===i; });
  var tipo = per.split(":")[0], val = per.split(":")[1] || "";
  var ms = tipo==="mes" ? [val] : tipo==="ano" ? meses.filter(function(k){ return k.slice(0, 4)===val; }) : meses;
  var unico = tipo==="mes", mes = unico ? val : "";
  var m = unico ? controleMes(c, mes) : juntar(c, ms), ant = unico ? controleMes(c, meses[meses.indexOf(mes)+1] || "") : null, t = m.t;
  var totalMes = t.pagar+m.banho, totalAnt = ant ? ant.t.pagar+ant.banho : 0, variacao = totalAnt>0 ? (totalMes-totalAnt)/totalAnt : null;
  var rotuloPer = unico ? cap(rotuloMes(mes)) : tipo==="ano" ? "Ano "+val+" · "+ms.length+(ms.length===1 ? " mês" : " meses") : "Todo o período · "+ms.length+(ms.length===1 ? " mês" : " meses");
  var forn = m.forn.slice().sort(function(a, b){ return b.pagar-a.pagar; }), maxF = forn.reduce(function(s, l){ return Math.max(s, l.pagar); }, 0) || 1;
  var cats = m.cats.slice().sort(function(a, b){ return b.q-a.q; }), maxC = cats.reduce(function(s, l){ return Math.max(s, l.q); }, 0) || 1;
  var titulo = "Compras · "+rotuloPer+" · "+brl(totalMes)+(variacao==null ? "" : " · "+(variacao>0 ? "+" : "")+pc(variacao)+" sobre o mês anterior");
  // menu do período no canto direito da barra azul (que ficou mais alta para caber o campo de 32 px): mês atual, ano inteiro, todo o período e, embaixo, cada mês
  var acao = e("select",{id:"cc-per", "aria-label":"Período", value:per, onChange:function(ev){ sm[1](ev.target.value); }, className:CAMPO+" !w-60 cursor-pointer"},
    e("option",{value:"mes:"+meses[0]}, "Mês atual · "+cap(rotuloMes(meses[0]))),
    anos.map(function(a){ return e("option",{key:a, value:"ano:"+a}, "Ano "+a+" · todos os meses"); }),
    e("option",{value:"todos:"}, "Todo o período"),
    e("optgroup",{label:"Por mês"}, meses.map(function(k){ return e("option",{key:k, value:"mes:"+k}, cap(rotuloMes(k))); })));
  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e(BlocoPainel,{titulo:titulo, dir:acao, alta:true, compacto:true},
      e("div",{className:"grid items-start gap-2 p-1.5 md:grid-cols-2"},
        e("section",{className:"overflow-hidden rounded-lg ring-1 ring-white/20"},
          e("div",{className:"bg-[var(--bloco-colunas)] px-2 py-1 text-center text-[11px] font-bold uppercase tracking-[.04em]"}, "Por fornecedor · a pagar de bruto "+brl(t.pagar)),
          forn.length ? forn.map(function(l){ return e(LinhaBarra,{key:l.forn, nome:l.forn, cor:COR_FORN, w:l.pagar/maxF, valor:brl(l.pagar)+" · "+pc(t.pagar>0 ? l.pagar/t.pagar : 0)}); }) : e("p",{className:"py-2 text-center text-[13px]"}, "Sem compras neste mês.")),
        e("section",{className:"overflow-hidden rounded-lg ring-1 ring-white/20"},
          e("div",{className:"bg-[var(--bloco-colunas)] px-2 py-1 text-center text-[11px] font-bold uppercase tracking-[.04em]"}, "Por categoria · "+num(t.pecas)+" peças"),
          cats.length ? cats.map(function(l){ return e(LinhaBarra,{key:l.k || l.nome, nome:l.nome, cor:COR_CAT, w:l.q/maxC, valor:num(l.q)+" · "+pc(t.pecas>0 ? l.q/t.pecas : 0)}); }) : e("p",{className:"py-2 text-center text-[13px]"}, "Sem peças lançadas neste mês.")))));
}
export { AbaControle };
