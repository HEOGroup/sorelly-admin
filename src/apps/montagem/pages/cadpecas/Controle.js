// Sorelly Admin · montagem — pages/cadpecas/Controle.js
// Cadastro de peças → "Controle de compras" (antes "Controle do mês"; o nome saiu do mês porque a tela mostra vários: Marcus, 16/11/2026).
// Quanto foi comprado de BRUTO (pela data da compra), por fornecedor e por categoria, e o BANHO (faturas da Pontual e da Ellos, pela data da fatura); total = bruto a pagar + banho.
// É a mesma conta do Resumo por mês da tela Pedidos. REFEITA no padrão (16/11/2026): blocos com barra azul (BlocoPainel), faixa azul com o menu do mês, tabelas na peça única (TabelaPlanilha, filtro em cada coluna),
// total no FIM de cada tabela, letra pequena e sem texto explicativo. Clicar numa linha de "Mês a mês" troca o mês da tela.
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { Pagina } from "@/apps/montagem/components/padrao";
import { brl } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { controleMes, mesesCpc } from "@/apps/montagem/domain/cadastro-pecas";
import { rotuloMes } from "@/apps/montagem/pages/cadpecas/Pedidos";
import { useCpc } from "@/apps/montagem/pages/cadpecas/visualCad";
import { Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { e, useState } from "@/shared/react";

var pc = function(f){ return (Math.round((f||0)*1000)/10)+"%"; };
function cap(t){ return t ? t.charAt(0).toUpperCase()+t.slice(1) : t; }
var traco = function(v){ return v ? v : "—"; };
var sinal = function(v){ return v==null ? "—" : e("span",{style:{color:v>0 ? "#4ADE80" : v<0 ? "#F87171" : undefined}}, (v>0 ? "+" : "")+pc(v)); };

function AbaControle(){
  var x = useCpc(), c = x.c, meses = mesesCpc(c), sm = useState(""), mes = sm[0] || meses[0] || "";
  if(!meses.length) return e(Pagina,null, e(Vazio,{ic:"chart-bar"}, "Ainda não há pedidos lançados."));
  var m = controleMes(c, mes), ant = controleMes(c, meses[meses.indexOf(mes)+1] || ""), t = m.t;
  var totalMes = t.pagar+m.banho, totalAnt = ant.t.pagar+ant.banho;
  var variacao = totalAnt>0 ? (totalMes-totalAnt)/totalAnt : null;
  var serie = meses.slice(0, 12).map(function(k){ var r = controleMes(c, k); return {mes:k, nome:cap(rotuloMes(k)), n:r.t.n, valor:r.t.valor, desc:r.t.desc, pagar:r.t.pagar, pecas:r.t.pecas, banho:r.banho, total:r.t.pagar+r.banho}; });
  var somar = function(ls, k){ return ls.reduce(function(s, l){ return s+(l[k] || 0); }, 0); };

  // faixa azul com o menu do mês (menu suspenso, 28 px, letra 11 px), igual ao Pedidos
  var faixa = e("div",{className:"flex flex-nowrap items-center gap-x-1.5 overflow-x-auto border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 [&>*]:shrink-0 [&_select]:!h-7 [&_select]:!text-[11px]"},   // padrao-ok: controle de 28 px, igual ao Pedidos e ao Contas a pagar (pedido do Marcus, 16/11/2026)
    e("select",{id:"cc-mes", "aria-label":"Mês", value:mes, onChange:function(ev){ sm[1](ev.target.value); }, className:"h-7 w-44 cursor-pointer rounded-md border border-border bg-card px-2.5 text-center text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-primary"},   // padrao-ok: menu de 28 px na faixa azul, igual ao Pedidos (pedido do Marcus, 16/11/2026)
      meses.map(function(k){ return e("option",{key:k, value:k}, cap(rotuloMes(k))); })));

  var colsResumo = [{k:"n", t:"Pedidos"}, {k:"valor", t:"Comprado", fmt:brl}, {k:"desc", t:"Desc. médio", fmt:pc}, {k:"pagar", t:"A pagar (bruto)", fmt:brl}, {k:"pecas", t:"Peças", fmt:traco}, {k:"banho", t:"Banho", fmt:brl}, {k:"total", t:"Total (bruto + banho)", fmt:brl},
    {k:"variacao", t:"Contra o mês anterior", render:sinal, fmt:function(v){ return v==null ? "—" : (v>0 ? "+" : "")+pc(v); }}];
  var linhaResumo = [{id:"r", n:t.n, valor:t.valor, desc:t.desc, pagar:t.pagar, pecas:t.pecas, banho:m.banho, total:totalMes, variacao:variacao}];

  var colsForn = [{k:"forn", t:"Fornecedor"}, {k:"n", t:"Pedidos"}, {k:"valor", t:"Comprado", fmt:brl}, {k:"desc", t:"Desc.", fmt:pc}, {k:"pagar", t:"A pagar", fmt:brl}, {k:"pecas", t:"Peças", fmt:traco}, {k:"pct", t:"% do mês", fmt:pc}];
  var linhasForn = m.forn.map(function(l){ return {id:l.forn, forn:l.forn, n:l.n, valor:l.valor, desc:l.desc, pagar:l.pagar, pecas:l.pecas, pct:t.pagar>0 ? l.pagar/t.pagar : 0}; });
  var rodapeForn = function(ls){ var vlr = somar(ls, "valor"), pg = somar(ls, "pagar"); return ["Total", somar(ls, "n"), brl(vlr), vlr>0 ? pc(1-pg/vlr) : "—", brl(pg), somar(ls, "pecas") || "—", t.pagar>0 ? pc(pg/t.pagar) : "—"]; };

  var colsCat = [{k:"nome", t:"Categoria"}, {k:"q", t:"Peças"}, {k:"pct", t:"% das peças", fmt:pc}];
  var linhasCat = m.cats.map(function(k){ return {id:k.k || k.nome, nome:k.nome, q:k.q, pct:t.pecas>0 ? k.q/t.pecas : 0}; });
  var rodapeCat = function(ls){ return ["Total", somar(ls, "q"), t.pecas>0 ? pc(somar(ls, "q")/t.pecas) : "—"]; };

  var colsSerie = [{k:"nome", t:"Mês"}, {k:"n", t:"Pedidos"}, {k:"valor", t:"Comprado", fmt:brl}, {k:"desc", t:"Desc.", fmt:pc}, {k:"pagar", t:"A pagar (bruto)", fmt:brl}, {k:"pecas", t:"Peças", fmt:traco}, {k:"banho", t:"Banho", fmt:brl}, {k:"total", t:"Total", fmt:brl}];
  var rodapeSerie = function(ls){ var vlr = somar(ls, "valor"), pg = somar(ls, "pagar"); return ["Total", somar(ls, "n"), brl(vlr), vlr>0 ? pc(1-pg/vlr) : "—", brl(pg), somar(ls, "pecas") || "—", brl(somar(ls, "banho")), brl(somar(ls, "total"))]; };

  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e(BlocoPainel,{titulo:"Controle de compras · "+cap(rotuloMes(mes)), compacto:true},
      faixa,
      e(TabelaPlanilha,{cols:colsResumo, linhas:linhaResumo, chave:"id", grade:true, semContagem:true, semLimpar:true})),
    e(BlocoPainel,{titulo:"Por fornecedor · "+m.forn.length+(m.forn.length===1 ? " fornecedor" : " fornecedores"), compacto:true},
      linhasForn.length ? e(TabelaPlanilha,{key:"f"+mes, cols:colsForn, linhas:linhasForn, chave:"id", grade:true, semContagem:true, semLimpar:true, totalRodape:rodapeForn}) : e(Vazio,{ic:"package"}, "Sem compras neste mês.")),
    linhasCat.length>0 && e(BlocoPainel,{titulo:"Peças por categoria · "+t.pecas+" peças", compacto:true},
      e(TabelaPlanilha,{key:"c"+mes, cols:colsCat, linhas:linhasCat, chave:"id", grade:true, semContagem:true, semLimpar:true, totalRodape:rodapeCat})),
    e(BlocoPainel,{titulo:"Mês a mês · "+serie.length+" meses", compacto:true},
      e(TabelaPlanilha,{cols:colsSerie, linhas:serie, chave:"mes", grade:true, semContagem:true, semLimpar:true, totalRodape:rodapeSerie, aoClicar:function(l){ sm[1](l.mes); }})));
}
export { AbaControle };
