// Sorelly Admin · montagem — pages/cadpecas/Lotes.js
// Cadastro de peças → aba "Lotes": uma linha por planilha de cadastro (aba da planilha Bruto/Ouro; pode ter vários pedidos) com o que foi comprado, o que falta pagar, a venda e o markup. Clicar abre a Calculadora.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Faixa, Indicador, Pagina, Tab, Td } from "@/apps/montagem/components/padrao";
import { GALVANICAS, brl, pct0, resumoLote } from "@/apps/montagem/domain/cadastro-pecas";
import { NEUTRO, useCpc } from "@/apps/montagem/pages/cadpecas/visualCad";
import { Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { e } from "@/shared/react";

function AbaLotes(p){
  var x = useCpc(), c = x.c;
  var linhas = c.lotes.map(function(l){ return {lote:l, r:resumoLote(l, c.config)}; });
  var t = linhas.reduce(function(a, l){ a.pecas += l.r.pecas; a.bruto += l.r.brutoTotal; a.banho += l.r.banhoTotal; a.pagar += l.r.pagar; a.venda += l.r.vendaTotal; a.rec += l.r.recebidoTotal; a.custo += l.r.custoTotal; a.env += l.r.enviadas; a.n += l.r.linhas; return a; }, {pecas:0, bruto:0, banho:0, pagar:0, venda:0, rec:0, custo:0, env:0, n:0});
  var mk = t.custo>0 ? (t.rec-t.custo)/t.custo : 0;
  return e(Pagina,null,
    e(Faixa,{n:5},
      e(Indicador,{t:"Planilhas", v:String(c.lotes.length), cor:NEUTRO}),
      e(Indicador,{t:"Peças", v:String(t.pecas), cor:NEUTRO}),
      e(Indicador,{t:"A pagar (bruto + banho)", v:brl(t.pagar), cor:NEUTRO}),
      e(Indicador,{t:"Venda total", v:brl(t.venda), cor:NEUTRO}),
      e(Indicador,{t:"Markup geral (alvo "+pct0(c.config.markupAlvo)+")", v:pct0(mk), cor:mk>=c.config.markupAlvo ? "ok" : "alerta"})),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Planilhas de cadastro", dir:c.lotes.length},
      linhas.length ? e(Tab,{cols:["Planilha", "Galvânica", "Peças", "Bruto", "Banho", "A pagar", "Venda total", "Markup", "No chat", "Sem banho"]},
        linhas.map(function(l){ var r = l.r, alvo = l.lote.markup!=null ? l.lote.markup : c.config.markupAlvo;
          return e("tr",{key:l.lote.id, onClick:function(){ p.onAbrir(l.lote.id); }, className:"cursor-pointer border-t border-white/5 hover:bg-white/10", title:"Abrir na Calculadora"},
            e(Td,{forte:true}, l.lote.nome), e(Td,null, GALVANICAS[l.lote.galvanica]), e(Td,null, r.pecas), e(Td,{dinheiro:true}, brl(r.brutoTotal)), e(Td,{dinheiro:true}, brl(r.banhoTotal)),
            e(Td,{dinheiro:true, forte:true}, brl(r.pagar)), e(Td,{dinheiro:true}, brl(r.vendaTotal)), e(Td,{forte:true, cor:r.markup>=alvo ? "ok" : "alerta"}, pct0(r.markup)),
            e(Td,null, r.enviadas+" / "+r.linhas), e(Td,{cor:r.semBanho ? "ruim" : undefined}, r.semBanho || "—")); })
        .concat([e("tr",{key:"total", className:"border-t-2 border-white/25 bg-black/30"}, e(Td,{forte:true}, "Total"), e(Td,null), e(Td,{forte:true}, t.pecas), e(Td,{dinheiro:true, forte:true}, brl(t.bruto)), e(Td,{dinheiro:true, forte:true}, brl(t.banho)),
          e(Td,{dinheiro:true, forte:true}, brl(t.pagar)), e(Td,{dinheiro:true, forte:true}, brl(t.venda)), e(Td,{forte:true, cor:mk>=c.config.markupAlvo ? "ok" : "alerta"}, pct0(mk)), e(Td,null, t.env+" / "+t.n), e(Td,null))])) :
      e(Vazio,{ic:"stack"}, "Nenhuma planilha ainda. Crie a primeira na Calculadora.")));
}
export { AbaLotes };
