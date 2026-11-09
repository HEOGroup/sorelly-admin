// Sorelly Admin · montagem — pages/cadpecas/Controle.js
// Cadastro de peças → "Controle do mês": quanto foi comprado de BRUTO em cada mês (pela data da compra), por fornecedor e por categoria, e o BANHO. Atualizada em 09/11/2026 (Marcus: "compras de bruto e ouro"):
// o BANHO do mês é o das faturas da Pontual e da Ellos (pela data da fatura) e o total do mês é bruto a pagar + banho; é a mesma conta do resumo por mês da tela Pedidos. Tabelas em layout D, sem faixa de totais no topo.
import { Bloco, CampoSel, FileiraCampos, TabelaCampos, brl } from "@/apps/montagem/components/padrao-fin";
import { Pagina } from "@/apps/montagem/components/padrao";
import { controleMes, mesesCpc } from "@/apps/montagem/domain/cadastro-pecas";
import { rotuloMes } from "@/apps/montagem/pages/cadpecas/Pedidos";
import { useCpc } from "@/apps/montagem/pages/cadpecas/visualCad";
import { Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { e, useState } from "@/shared/react";

var pc = function(f){ return (Math.round((f||0)*1000)/10)+"%"; };
function cap(t){ return t ? t.charAt(0).toUpperCase()+t.slice(1) : t; }

function AbaControle(){
  var x = useCpc(), c = x.c, meses = mesesCpc(c), sm = useState(""), mes = sm[0] || meses[0] || "";
  if(!meses.length) return e(Pagina,null, e(Vazio,{ic:"chart-bar"}, "Ainda não há pedidos lançados."));
  var m = controleMes(c, mes), ant = controleMes(c, meses[meses.indexOf(mes)+1] || ""), t = m.t;
  var totalMes = t.pagar+m.banho, totalAnt = ant.t.pagar+ant.banho;
  var variacao = totalAnt>0 ? (totalMes-totalAnt)/totalAnt : null;
  var serie = meses.slice(0, 12).map(function(k){ return {mes:k, r:controleMes(c, k)}; });
  return e(Pagina,null,
    e("div",{className:"grid grid-cols-2 gap-2 sm:grid-cols-4"}, e(CampoSel,{t:"Mês", value:mes, onChange:sm[1], opcoes:meses.map(function(k){ return [k, cap(rotuloMes(k))]; })})),
    e(Bloco,{t:"Resumo de "+rotuloMes(mes)},
      e(TabelaCampos,{cols:[{t:"Pedidos", w:"9%"}, {t:"Comprado", w:"15%"}, {t:"Desc. médio", w:"11%"}, {t:"A pagar (bruto)", w:"16%"}, {t:"Peças", w:"10%"}, {t:"Banho", w:"15%"}, {t:"Total (bruto + banho)"}], minW:"58rem"},
        e(FileiraCampos,{cells:[t.n, brl(t.valor), pc(t.desc), brl(t.pagar), t.pecas, brl(m.banho), e("b",null, brl(totalMes))]})),
      e("p",{className:"mt-1.5 text-[11px]"}, variacao==null ? "Sem mês anterior para comparar." : "Total do mês "+(variacao>=0 ? "+" : "")+pc(variacao)+" contra o mês anterior. O bruto conta no mês da compra; o banho, no mês da fatura do banho.")),
    e(Bloco,{t:"Por fornecedor em "+rotuloMes(mes), dir:m.forn.length+(m.forn.length===1 ? " fornecedor" : " fornecedores")},
      m.forn.length ? e(TabelaCampos,{cols:[{t:"Fornecedor", w:"20%"}, {t:"Pedidos", w:"9%"}, {t:"Comprado", w:"16%"}, {t:"Desc.", w:"10%"}, {t:"A pagar", w:"16%"}, {t:"Peças", w:"10%"}, {t:"% do mês"}], minW:"52rem"},
        m.forn.map(function(l){ return e(FileiraCampos,{key:l.forn, cells:[e("b",null, l.forn), l.n, brl(l.valor), pc(l.desc), e("b",null, brl(l.pagar)), l.pecas || "—", t.pagar>0 ? pc(l.pagar/t.pagar) : "—"]}); })
          .concat([e(FileiraCampos,{key:"t", total:true, cells:["Total", t.n, brl(t.valor), pc(t.desc), brl(t.pagar), t.pecas, "100%"]})]))
        : e(Vazio,{ic:"package"}, "Sem compras neste mês.")),
    m.cats.length>0 && e(Bloco,{t:"Peças por categoria", dir:t.pecas+" peças"},
      e(TabelaCampos,{cols:m.cats.map(function(k){ return {t:k.nome}; }).concat([{t:"Total"}]), minW:(m.cats.length*8+8)+"rem"},
        e(FileiraCampos,{cells:m.cats.map(function(k){ return k.q; }).concat([e("b",null, t.pecas)])}))),
    e(Bloco,{t:"Mês a mês", dir:serie.length+" meses"},
      e(TabelaCampos,{cols:[{t:"Mês", w:"15%"}, {t:"Pedidos", w:"8%"}, {t:"Comprado", w:"12%"}, {t:"Desc.", w:"8%"}, {t:"A pagar (bruto)", w:"13%"}, {t:"Peças", w:"8%"}, {t:"Banho", w:"14%"}, {t:"Total"}], minW:"58rem"},
        serie.map(function(l){ var on = l.mes===mes, tt = l.r.t.pagar+l.r.banho;
          return e(FileiraCampos,{key:l.mes, onClick:function(){ sm[1](l.mes); }, title:"Ver este mês", cells:[on ? e("b",null, cap(rotuloMes(l.mes))) : cap(rotuloMes(l.mes)), l.r.t.n, brl(l.r.t.valor), pc(l.r.t.desc), brl(l.r.t.pagar), l.r.t.pecas || "—", brl(l.r.banho), e("b",null, brl(tt))]}); })),
      e("p",{className:"mt-1.5 text-[11px]"}, "Banho = faturas da Pontual e da Ellos, pelo mês da fatura. Bruto = valor a pagar dos pedidos, pelo mês da compra.")));
}
export { AbaControle };
