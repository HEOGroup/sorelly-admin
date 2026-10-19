// Sorelly Admin · montagem — pages/estoque-sorelly/Resumo.js
// Estoque Sorelly → aba "Resumo geral": indicadores da última foto, quadro Interno / Com revendedoras / Total, giro, receita, saída e 3 gráficos (sem biblioteca).
// Só leitura: números vêm de domain/estoque-sorelly.js (esResumoGeral e séries).
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Faixa, Indicador, LINHA, Mosaico, Pagina, Tab, Td, degrade } from "@/apps/montagem/components/padrao";
import { METRICAS, ROTULO_METRICA, esPendencias, esResumoGeral, esSerieEvolucao, esSerieFaturamentoEstoque, esSerieIndice } from "@/apps/montagem/domain/estoque-sorelly";
import { GraficoBarras, GraficoLinhas, GraficoPares, Legenda } from "@/apps/montagem/pages/estoque-sorelly/graficos";
import { AZUL, dataBr, din, pct, pt, useEs, vezes } from "@/apps/montagem/pages/estoque-sorelly/util";
import { Selo, Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { e, useState } from "@/shared/react";

// aviso formal das pendências (foto do mês e fechamento do mês anterior); onIr leva ao Preenchimento
function Pendencias(p){
  var lista = esPendencias(p.s);
  if(!lista.length) return null;
  return e("div",{role:"status", className:"flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-xl px-3 py-2 text-[13px] font-bold", style:degrade("alerta")},
    e(Ph,{n:"warning", s:17, style:{color:"#FBBF24"}}),
    lista.map(function(x){ return e("button",{key:x.tipo, type:"button", onClick:function(){ p.onIr("preenchimento", x.anoMes); }, title:"Abrir o Preenchimento", className:"inline-flex items-center gap-1 rounded-lg px-2 py-0.5 underline-offset-2 hover:bg-white/10 hover:underline"}, x.texto, e(Ph,{n:"caret-right", s:12})); }));
}

// gráfico de crescimento mensal com seletor de métrica
function BlocoCrescimento(p){
  var st = useState("venda"), m = st[0], serie = esSerieEvolucao(p.s, m);
  return e(BlocoBarra,{cor:"azul", t:"Crescimento mensal", compacto:true},
    e("div",{className:"flex flex-wrap justify-center gap-1 px-2 pt-2"}, METRICAS.map(function(k){ var on = k===m;
      return e("button",{key:k, type:"button", onClick:function(){ st[1](k); }, className:"rounded-lg px-2.5 py-1 text-[12px] font-bold ring-1 transition "+(on ? "text-white" : "bg-muted/40 text-white/85 ring-white/15 hover:bg-white/10"),
        style:on ? {background:"linear-gradient(135deg,"+AZUL+"66,"+AZUL+"22)", boxShadow:"inset 0 0 0 1px "+AZUL+"cc"} : undefined}, ROTULO_METRICA[k]); })),
    serie.length ? e("div",{className:"p-2"}, e(GraficoBarras,{serie:serie, rotulo:ROTULO_METRICA[m]}), serie.some(function(x){ return x.simulado; }) && e("p",{className:"text-center text-[11px] text-white/70"}, "Barras mais claras e tracejadas: meses com estimativa."))
      : e("div",{className:"p-2"}, e(Vazio,{ic:"chart-bar"}, "Sem foto completa para o gráfico.")));
}

function AbaResumo(p){
  var ctx = useEs(), s = ctx.s, r = esResumoGeral(s), g = r.giro;
  var pendencias = e(Pendencias,{s:s, onIr:p.onIr});
  if(r.vazio) return e(Pagina,null, pendencias, e(Vazio,{ic:"package"}, "Nenhuma foto de estoque lançada ainda."));

  var topo = e("div",{className:"flex flex-col gap-2"},
    e(Faixa,{n:3},
      e(Indicador,{t:"Custo total", v:din(r.custo), cor:"info", sub:"Foto de "+dataBr(r.dataFoto)}),
      e(Indicador,{t:"Preço de venda final", v:din(r.venda), cor:"total", sub:r.rotulo}),
      e(Indicador,{t:"Peças totais", v:pt(r.pecas), cor:"cian", sub:"Interno e revendedoras"})),
    r.mesesEstimados.length>0 && e("div",{className:"flex flex-wrap items-center justify-center gap-2 text-[12px] text-white/80"},
      e(Selo,{cor:"alerta", ic:"warning", titulo:"Algum número destes meses é estimado"}, "Contém estimativa"),
      e("span",null, "Meses estimados: "+r.mesesEstimados.join(", "))));

  var quadro = e(BlocoBarra,{cor:"azul", t:"Estoque por grupo · "+r.rotulo, compacto:true},
    e("div",{className:"p-2"}, e(Tab,{cols:["Grupo","Peças","Custo","Venda","Markup"]}, r.grupos.map(function(x, i){ var tot = i===r.grupos.length-1;
      return e("tr",{key:x.nome, className:LINHA+(tot ? " bg-white/5" : "")},
        e(Td,{forte:true}, x.nome), e(Td,{dinheiro:true, forte:tot}, pt(x.pecas)), e(Td,{dinheiro:true, forte:tot}, din(x.custo)), e(Td,{dinheiro:true, forte:tot}, din(x.venda)), e(Td,{dinheiro:true, forte:tot}, vezes(x.markup))); }))));

  var giro = g ? e(BlocoBarra,{cor:"azul", t:"Giro do estoque · "+g.rotulo, compacto:true},
      e("div",{className:"flex flex-col gap-2 p-2"},
        e(Faixa,{n:3},
          e(Indicador,{t:"Giro", v:pct(g.giroPct), cor:"info", sub:"Saída ÷ estoque"}),
          e(Indicador,{t:"Meses de estoque", v:pt(g.mesesDeEstoque, 1), cor:g.mesesAlto ? "ruim" : "ok", sub:g.mesesAlto ? "Acima de 6 meses" : "Dentro do limite"}),
          e(Indicador,{t:"Brindes", v:din(g.brindes), cor:"alerta", sub:g.brindePctDoVendido!=null ? pct(g.brindePctDoVendido)+" do vendido" : "Valor a preço de tabela"}))))
    : e(BlocoBarra,{cor:"azul", t:"Giro do estoque", compacto:true}, e("div",{className:"p-2"}, e(Vazio,{ic:"arrow-counter-clockwise"}, "Sem fechamento com foto do mesmo mês para calcular o giro.")));

  var receita = g && e(BlocoBarra,{cor:"azul", t:"Receita de "+g.rotulo, compacto:true},
    e("div",{className:"p-2"}, e(Faixa,{n:2}, e(Indicador,{t:"Vendido na ponta", v:din(g.vendido), cor:"total"}), e(Indicador,{t:"Recebido pela Sorelly", v:din(g.recebido), cor:"ok"}))));
  var saida = g && e(BlocoBarra,{cor:"azul", t:"Saída de "+g.rotulo, compacto:true},
    e("div",{className:"p-2"}, e(Faixa,{n:2}, e(Indicador,{t:"Saída (vendido + brindes)", v:din(g.saida), cor:"info"}), e(Indicador,{t:"Estoque a preço de venda", v:din(g.estoqueVenda), cor:"cian"}))));

  var fe = esSerieFaturamentoEstoque(s).map(function(x){ return {rotulo:x.rotulo, a:x.vendido, b:x.estoqueVenda}; });
  var graf2 = e(BlocoBarra,{cor:"azul", t:"Faturamento × estoque", compacto:true},
    fe.length ? e("div",{className:"p-2"}, e(GraficoPares,{serie:fe}), e(Legenda,{itens:[{cor:"#BFDBFE", nome:"Vendido na ponta"}, {cor:"#3B82F6", nome:"Estoque a preço de venda"}]}))
      : e("div",{className:"p-2"}, e(Vazio,{ic:"chart-bar"}, "Nenhum fechamento lançado ainda.")));

  var ind = esSerieIndice(s);
  var graf3 = e(BlocoBarra,{cor:"azul", t:"Índice base 100", sub:"Primeira foto completa = 100", compacto:true},
    ind.length ? e("div",{className:"p-2"},
        e(GraficoLinhas,{rotulos:ind.map(function(x){ return x.rotulo; }), series:[
          {nome:"Custo", cor:"#3B82F6", pontos:ind.map(function(x){ return x.custo; })},
          {nome:"Preço de venda", cor:"#E8B84B", pontos:ind.map(function(x){ return x.venda; })},
          {nome:"Margem Sorelly", cor:"#BFDBFE", pontos:ind.map(function(x){ return x.margem; })}]}),
        e(Legenda,{itens:[{cor:"#3B82F6", nome:"Custo"}, {cor:"#E8B84B", nome:"Preço de venda"}, {cor:"#BFDBFE", nome:"Margem Sorelly"}]}))
      : e("div",{className:"p-2"}, e(Vazio,{ic:"chart-line-up"}, "Sem foto completa para o índice.")));

  return e(Pagina,null, pendencias, topo,
    e(Mosaico,{min:"24rem"}, quadro, giro, receita, saida, e(BlocoCrescimento,{s:s}), graf2, graf3));
}

export { AbaResumo };
