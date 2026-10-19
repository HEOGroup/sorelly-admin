// Sorelly Admin · montagem — pages/estoque-sorelly/graficos.js
// Gráficos simples do Estoque Sorelly, em SVG (sem biblioteca): barras, barras em pares e linhas (índice base 100).
// Texto branco, cor do setor (azul). Mês estimado aparece mais claro e tracejado. Largura 100%: o gráfico se ajusta à tela, sem barra de rolagem.
import { ESTADO } from "@/apps/montagem/components/padrao";
import { abrev, curto, pt } from "@/apps/montagem/pages/estoque-sorelly/util";
import { e } from "@/shared/react";

var W = 360, H = 190, PT = 20, PB = 26, PL = 8, PR = 8;
var TXT = {fill:"rgba(255,255,255,.85)", fontFamily:"ui-monospace, monospace"};

// barras de uma série [{rotulo, valor, simulado}]; aceita negativo (margem)
function GraficoBarras(p){
  var s = p.serie.slice(-12), n = s.length;
  if(!n) return null;
  var max = Math.max.apply(null, s.map(function(x){ return x.valor; }).concat([0])), min = Math.min.apply(null, s.map(function(x){ return x.valor; }).concat([0]));
  var faixa = (max-min) || 1, area = H-PT-PB, y = function(v){ return PT+(max-v)/faixa*area; }, slot = (W-PL-PR)/n, bw = slot*0.62, y0 = y(0);
  return e("svg",{viewBox:"0 0 "+W+" "+H, className:"w-full", role:"img", "aria-label":p.rotulo || "Gráfico de barras"},
    e("line",{x1:PL, x2:W-PR, y1:y0, y2:y0, stroke:"rgba(255,255,255,.25)"}),
    s.map(function(d, i){
      var x = PL+i*slot+(slot-bw)/2, alt = Math.max(Math.abs(y(d.valor)-y0), 1), top = d.valor>=0 ? y0-alt : y0;
      return e("g",{key:d.rotulo},
        e("rect",{x:x, y:top, width:bw, height:alt, rx:2, fill:d.valor<0 ? ESTADO.ruim : (p.cor || "#3B82F6"), opacity:d.simulado ? .5 : 1, stroke:d.simulado ? "#fff" : "none", strokeDasharray:"2 2"}),
        e("text",{x:x+bw/2, y:(d.valor>=0 ? top-4 : top+alt+9), textAnchor:"middle", fontSize:8.5, style:TXT}, abrev(d.valor)),
        e("text",{x:x+bw/2, y:H-9, textAnchor:"middle", fontSize:8, style:TXT}, curto(d.rotulo)));
    }));
}

// barras em pares: série [{rotulo, a, b}]; a = vendido, b = estoque a preço de venda
function GraficoPares(p){
  var s = p.serie.slice(-12), n = s.length;
  if(!n) return null;
  var max = Math.max.apply(null, s.map(function(x){ return Math.max(x.a||0, x.b||0); }).concat([1])), area = H-PT-PB, y = function(v){ return PT+(max-v)/max*area; }, slot = (W-PL-PR)/n, bw = slot*0.34;
  return e("svg",{viewBox:"0 0 "+W+" "+H, className:"w-full", role:"img", "aria-label":"Faturamento contra estoque"},
    e("line",{x1:PL, x2:W-PR, y1:y(0), y2:y(0), stroke:"rgba(255,255,255,.25)"}),
    s.map(function(d, i){
      var x = PL+i*slot+(slot-2*bw-1)/2, ha = Math.max(y(0)-y(d.a||0), d.a ? 1 : 0), hb = Math.max(y(0)-y(d.b||0), d.b ? 1 : 0);
      return e("g",{key:d.rotulo},
        e("rect",{x:x, y:y(0)-ha, width:bw, height:ha, rx:2, fill:"#BFDBFE"}),
        e("rect",{x:x+bw+1, y:y(0)-hb, width:bw, height:hb, rx:2, fill:"#3B82F6"}),
        e("text",{x:x+bw, y:H-9, textAnchor:"middle", fontSize:8, style:TXT}, curto(d.rotulo)));
    }),
    e("text",{x:W-PR, y:10, textAnchor:"end", fontSize:8.5, style:TXT}, "Máx. "+abrev(max)));
}

// linhas base 100: series = [{nome, cor, pontos:[valor]}], rotulos = [texto]
function GraficoLinhas(p){
  var n = p.rotulos.length;
  if(!n) return null;
  var todos = [100]; p.series.forEach(function(s){ s.pontos.forEach(function(v){ todos.push(v); }); });
  var max = Math.max.apply(null, todos), min = Math.min.apply(null, todos), faixa = (max-min) || 1, area = H-PT-PB;
  var x = function(i){ return n===1 ? W/2 : PL+14+i*(W-PL-PR-28)/(n-1); }, y = function(v){ return PT+(max-v)/faixa*area; };
  var marcados = n<=6 ? p.rotulos.map(function(_, i){ return i; }) : [0, Math.round((n-1)/3), Math.round(2*(n-1)/3), n-1];
  return e("svg",{viewBox:"0 0 "+W+" "+H, className:"w-full", role:"img", "aria-label":"Índice base 100"},
    e("line",{x1:PL, x2:W-PR, y1:y(100), y2:y(100), stroke:"rgba(255,255,255,.35)", strokeDasharray:"3 3"}),
    e("text",{x:PL, y:y(100)-3, fontSize:8, style:TXT}, "100"),
    e("text",{x:W-PR, y:PT-6, textAnchor:"end", fontSize:8, style:TXT}, pt(max, 0)),
    e("text",{x:W-PR, y:H-PB+10, textAnchor:"end", fontSize:8, style:TXT}, pt(min, 0)),
    p.series.map(function(s){ return e("g",{key:s.nome},
      e("polyline",{fill:"none", stroke:s.cor, strokeWidth:2, strokeLinejoin:"round", points:s.pontos.map(function(v, i){ return x(i).toFixed(1)+","+y(v).toFixed(1); }).join(" ")}),
      s.pontos.map(function(v, i){ return e("circle",{key:i, cx:x(i), cy:y(v), r:2.4, fill:s.cor}); })); }),
    marcados.map(function(i){ return e("text",{key:i, x:x(i), y:H-9, textAnchor:i===0 ? "start" : i===n-1 ? "end" : "middle", fontSize:8, style:TXT}, curto(p.rotulos[i])); }));
}

// legenda: itens = [{cor, nome}]
function Legenda(p){
  return e("div",{className:"flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-2 pb-2 text-[11px] text-white/80"}, p.itens.map(function(i){
    return e("span",{key:i.nome, className:"inline-flex items-center gap-1"}, e("span",{className:"inline-block size-2.5 rounded-sm", style:{background:i.cor}}), i.nome); }));
}

export { GraficoBarras, GraficoPares, GraficoLinhas, Legenda };
