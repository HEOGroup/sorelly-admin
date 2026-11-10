// Sorelly Admin · montagem — pages/estoque-sorelly/Resumo.js
// Estoque Sorelly → aba "Resumo geral" no LAYOUT D (escolhido pelo Marcus em 09/11/2026): planilha com indicadores nas linhas e meses nas colunas.
// Três visões: Mês a mês (planilha D), Dia a dia (uma linha por dia, gravada sozinha pelo servidor às 10h, nova tentativa às 14h) e Gráficos.
// Só leitura: números vêm de domain/estoque-sorelly.js. Sem faixa de totais no topo (regra de 02/11/2026) e sem chips (regra de 09/11/2026).
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { FileiraCampos, Segmentado, TabelaCampos } from "@/apps/montagem/components/padrao-fin";
import { Mosaico, Pagina, degrade } from "@/apps/montagem/components/padrao";
import { hojeSP } from "@/apps/montagem/domain/cadastro-leads";
import { METRICAS, ROTULO_METRICA, esAutoStatus, esPendencias, esPlanilhaDias, esPlanilhaMeses, esSerieEvolucao, esSerieFaturamentoEstoque, esSerieIndice, esPct } from "@/apps/montagem/domain/estoque-sorelly";
import { GraficoBarras, GraficoLinhas, GraficoPares, Legenda } from "@/apps/montagem/pages/estoque-sorelly/graficos";
import { dataBr, din, pct, pt, useEs, vezes } from "@/apps/montagem/pages/estoque-sorelly/util";
import { Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { e, useState } from "@/shared/react";

var VERDE = "#22C55E", VERMELHO = "#F87171", AMARELO = "#FBBF24";
var corSinal = function(n){ return n==null || n===0 ? undefined : n>0 ? VERDE : VERMELHO; };
var sinal = function(n, f){ return n==null ? "—" : (n>0 ? "+" : n<0 ? "−" : "")+f(Math.abs(n)); };
var tem = function(n, f){ return n==null ? "—" : f(n); };

// aviso formal das pendências (foto do mês e fechamento do mês anterior); onIr leva ao Preenchimento
function Pendencias(p){
  var lista = esPendencias(p.s);
  if(!lista.length) return null;
  return e("div",{role:"status", className:"flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-xl px-3 py-2 text-[13px] font-bold", style:degrade("alerta")},
    e(Ph,{n:"warning", s:17, style:{color:AMARELO}}),
    lista.map(function(x){ return e("button",{key:x.tipo, type:"button", onClick:function(){ p.onIr("preenchimento", x.anoMes); }, title:"Abrir o Preenchimento", className:"inline-flex h-8 items-center gap-1 rounded-lg px-2 underline-offset-2 hover:bg-white/10 hover:underline"}, x.texto, e(Ph,{n:"caret-right", s:12})); }));
}

// linha de estado da leitura automática do servidor
function StatusAuto(p){
  var u = esAutoStatus(p.s), hoje = hojeSP(), cor = AMARELO, txt;
  if(!u) txt = "Leitura automática da DevMaster: ainda não rodou. Primeira leitura hoje às 10h; se falhar, nova tentativa às 14h.";
  else if(!u.ok){ txt = "Leitura automática falhou em "+dataBr(u.dia)+" às "+u.hora+" ("+u.erro+"). Nova tentativa às 14h."; cor = VERMELHO; }
  else { cor = VERDE; txt = "Leitura automática da DevMaster: "+(u.dia===hoje ? "hoje" : dataBr(u.dia))+" às "+u.hora+", tudo certo. Próxima: amanhã às 10h; se falhar, às 14h."; }
  return e("p",{className:"flex items-center justify-center gap-2 text-center text-[13px]"}, e("span",{className:"inline-block size-2 rounded-full", style:{background:cor}}), txt);
}

// ---------- visão 1: mês a mês (layout D) ----------
function VisaoMeses(p){
  var s = p.s, pc = esPct(s), meses = esPlanilhaMeses(s, 8), dias = esPlanilhaDias(s, 1), hoje = dias[0];
  if(!meses.length && !hoje) return e(Vazio,{ic:"package"}, "Nenhuma foto de estoque lançada ainda.");
  // colunas: um objeto por mês + a coluna "Hoje" (só o que a DevMaster lê: com as revendedoras)
  var cols = meses.map(function(m, i){ var ant = meses[i-1];
    return {rot:m.rotulo, est:m.estimado, qtd:m.p.qtdRevendedoras, pInt:m.p.internoPecas, pRev:m.p.revPecas, pTot:m.t.pecas, custo:m.t.custo, venda:m.t.venda, receb:m.d.recebimento, margem:m.d.margem, markup:m.d.markup,
      kit:m.kitMedio, vendido:m.f && m.f.vendido, recebido:m.f && m.f.recebido, saida:m.saida, giro:m.giroPct, dVenda: ant && ant.t.venda!=null && m.t.venda!=null ? m.t.venda-ant.t.venda : null}; });
  if(hoje) cols.push({rot:"Hoje "+dataBr(hoje.dia).slice(0, 5), hoje:true, qtd:hoje.qtdRevendedoras, pRev:hoje.revPecas, venda:null, vendaRev:hoje.revVenda, kit: hoje.qtdRevendedoras ? hoje.revVenda/hoje.qtdRevendedoras : null});
  var linhas = [
    ["Revendedoras ativas", function(c){ return tem(c.qtd, pt); }],
    ["Peças interno", function(c){ return tem(c.pInt, pt); }],
    ["Peças com revendedoras", function(c){ return tem(c.pRev, pt); }],
    ["Peças totais", function(c){ return tem(c.pTot, pt); }, true],
    ["Custo total", function(c){ return tem(c.custo, din); }],
    ["Preço de venda interno + revendedoras", function(c){ return c.hoje ? din(c.vendaRev)+" (rev.)" : tem(c.venda, din); }],
    ["Recebimento esperado ("+Math.round(pc*100)+"%)", function(c){ return tem(c.receb, din); }],
    ["Margem Sorelly", function(c){ return {v:tem(c.margem, din), cor:corSinal(c.margem)}; }],
    ["Markup sobre o custo", function(c){ return tem(c.markup, vezes); }],
    ["Kit médio por revendedora", function(c){ return tem(c.kit, din); }],
    ["Variação do preço de venda", function(c){ return {v:c.dVenda==null ? "—" : sinal(c.dVenda, din), cor:corSinal(c.dVenda)}; }],
    ["Vendido na ponta", function(c){ return tem(c.vendido, din); }],
    ["Recebido pela Sorelly", function(c){ return tem(c.recebido, din); }],
    ["Saída (vendido + brindes)", function(c){ return tem(c.saida, din); }],
    ["Giro do estoque", function(c){ return tem(c.giro, pct); }]
  ];
  var cabec = [{t:"Indicador", w:"17rem"}].concat(cols.map(function(c, i){ return {t:c.rot+(c.est ? " (estimado)" : ""), w: i===cols.length-1 ? "1fr" : "10.5rem", cor: c.hoje ? "#3B82F6" : undefined}; }));
  return e(TabelaCampos,{cols:cabec, minW:(17+10.5*cols.length)+"rem"},
    linhas.map(function(l){ return e(FileiraCampos,{key:l[0], total:!!l[2], cells:[l[0]].concat(cols.map(function(c){ return l[1](c); }))}); }));
}

// ---------- visão 2: dia a dia ----------
function VisaoDias(p){
  var dias = esPlanilhaDias(p.s, 31);
  if(!dias.length) return e(Vazio,{ic:"calendar-blank"}, "Ainda não há dias gravados. A primeira leitura automática grava o dia de hoje.");
  var cab = [{t:"Data", w:"7.5rem"}, {t:"Revendedoras", w:"9rem"}, {t:"Variação", w:"7rem"}, {t:"Peças", w:"9rem"}, {t:"Variação", w:"8rem"}, {t:"Preço de venda", w:"12rem"}, {t:"Variação", w:"11rem"}, {t:"Condicionais", w:"9rem"}, {t:"Hora", w:"1fr"}];
  return e(TabelaCampos,{cols:cab, minW:"66rem"}, dias.map(function(d){
    return e(FileiraCampos,{key:d.id, cells:[dataBr(d.dia), pt(d.qtdRevendedoras), {v:sinal(d.dRev, pt), cor:corSinal(d.dRev)}, pt(d.revPecas), {v:sinal(d.dPecas, pt), cor:corSinal(d.dPecas)}, din(d.revVenda), {v:sinal(d.dVenda, din), cor:corSinal(d.dVenda)}, pt(d.condicionais), d.hora || "—"]}); }));
}

// ---------- visão 3: gráficos ----------
function BlocoCrescimento(p){
  var st = useState("venda"), m = st[0], serie = esSerieEvolucao(p.s, m);
  return e(BlocoBarra,{cor:"azul", t:"Crescimento mensal", compacto:true},
    e("div",{className:"flex justify-center px-2 pt-2"}, e(Segmentado,{opcoes:METRICAS.map(function(k){ return [k, ROTULO_METRICA[k]]; }), atual:m, onMudar:function(k){ st[1](k); }})),
    serie.length ? e("div",{className:"p-2"}, e(GraficoBarras,{serie:serie, rotulo:ROTULO_METRICA[m]}), serie.some(function(x){ return x.simulado; }) && e("p",{className:"text-center text-[11px] text-white/70"}, "Barras mais claras e tracejadas: meses com estimativa."))
      : e("div",{className:"p-2"}, e(Vazio,{ic:"chart-bar"}, "Sem foto completa para o gráfico.")));
}
function VisaoGraficos(p){
  var s = p.s;
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
  return e(Mosaico,{min:"24rem"}, e(BlocoCrescimento,{s:s}), graf2, graf3);
}

function AbaResumo(p){
  var ctx = useEs(), s = ctx.s, st = useState("meses"), v = st[0];
  var corpo = v==="dias" ? e(VisaoDias,{s:s}) : v==="graficos" ? e(VisaoGraficos,{s:s}) : e(VisaoMeses,{s:s});
  return e(Pagina,null, e(Pendencias,{s:s, onIr:p.onIr}),
    e("div",{className:"flex justify-center"}, e(Segmentado,{opcoes:[["meses","Mês a mês"], ["dias","Dia a dia"], ["graficos","Gráficos"]], atual:v, onMudar:function(x){ st[1](x); }})),
    e(StatusAuto,{s:s}), corpo);
}

export { AbaResumo };
