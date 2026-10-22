// Sorelly Admin · montagem e bipagem — components/grafico-revendedoras.js
// Extraído de sorelly_admin_montagem_bipagem.html; depois ajustado para caber sempre na largura, mostrar o valor ao passar
// o mouse e marcar os meses (faixas alternadas + linha) quando a janela é grande demais pra ver a data de cada barra.
import { MESES_LONGO } from "@/apps/montagem/domain/financeiro";
import { e, useEffect, useRef, useState } from "@/shared/react";

var mesAbr = function(dt){ return MESES_LONGO[Number(dt.slice(5,7))-1].slice(0,3).toUpperCase(); };
var dataBR = function(dt){ return dt.split("-").reverse().join("/"); };
var num = function(v){ return Math.round(v).toLocaleString("pt-BR"); };
var SLOT_MIN = 2.2;   // abaixo disso a barra vira um fio ilegível; a partir daqui entra a rolagem (curta, não a história inteira esticada)

// gráfico de colunas, dia a dia; barra cheia = real, barra mais clara/tracejada = projeção (dia 1 de cada mês futuro).
// Em janelas normais as colunas se espremem para caber inteiras na largura da tela (como o gráfico da planilha). Só quando a
// janela é grande demais (história completa) a barra não fica um fio: aparece uma rolagem lateral curta (a barra dourada
// embaixo), e o gráfico abre já no fim, nos dias mais recentes. Faixas claras/escuras alternadas marcam cada mês (com uma
// linha na virada), pra dar pra identificar os meses mesmo quando a legenda de baixo não cabe todas as datas.
// Passando o mouse aparece o dia, a quantidade e a variação. As barras "flutuam" a partir do menor valor da janela, senão
// a variação de revendedoras (ex.: 1900 a 2100) fica quase invisível numa barra que começa do zero.
function GraficoBase(p){
  var pts = p.pontos, n = pts.length, vals = pts.map(function(x){return x.v;});
  var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), pad = Math.max(1, Math.round((mx-mn)*0.06));
  var base0 = Math.max(0, mn-pad), topV = mx+pad, range = Math.max(1, topV-base0);
  var caixa = useRef(null), rol = useRef(null);
  var lg = useState(900), larg = lg[0], setLarg = lg[1];
  var hv = useState(null), sel = hv[0], setSel = hv[1];
  var arr = useRef({ativo:false, x0:0, s0:0, moveu:false}), anc = useRef(null);   // arrastar (pan) e ponto sob o mouse durante o zoom da roda
  var ag = useState(false), arrastando = ag[0], setArrastando = ag[1];
  useEffect(function(){ if(!caixa.current) return; var ro = new ResizeObserver(function(x){ setLarg(x[0].contentRect.width); }); ro.observe(caixa.current);
    return function(){ ro.disconnect(); }; }, []);
  var H = p.altura || 320, top = 14, base = H-30, esq = 44;   // esq: faixa dos valores do eixo
  var zoom = p.zoom || 1;   // zoom da tela cheia: 1 = cabe tudo na largura; acima disso as barras alargam e o gráfico rola
  var boxW = Math.max(larg, 300), rawSlot = (boxW-esq)/Math.max(n,1)*zoom;
  var rolar = rawSlot < SLOT_MIN || zoom>1;   // rola quando nem o fio mínimo cabe, ou quando deu zoom
  var slot = rawSlot < SLOT_MIN ? SLOT_MIN : rawSlot;
  var W = rolar ? esq + n*slot + 8 : boxW;
  var barW = slot>=3 ? Math.min(28, slot*0.72) : slot;   // bem espremido, as barras encostam (vira uma área, igual à planilha)
  var xDe = function(i){ return esq + i*slot + (slot-barW)/2; };
  var y = function(v){ return base - (base-top)*(v-base0)/range; };
  useEffect(function(){ if(!rolar || !rol.current) return; var sc = rol.current;
    if(anc.current){ sc.scrollLeft = anc.current.ratio*sc.scrollWidth - anc.current.cx; anc.current = null; } else sc.scrollLeft = sc.scrollWidth; }, [rolar, n, larg, zoom]);
  // roda do mouse = zoom (só na tela cheia); o ponto sob o mouse fica parado
  useEffect(function(){ if(!p.interativo || !caixa.current) return; var el = caixa.current;
    var roda = function(ev){ ev.preventDefault(); var r = el.getBoundingClientRect(), cx = ev.clientX-r.left, sc = rol.current;
      anc.current = {ratio: sc ? (sc.scrollLeft+cx)/sc.scrollWidth : cx/Math.max(1, el.clientWidth), cx:cx};
      if(p.onZoom(ev.deltaY<0 ? 1 : -1)===false) anc.current = null; };
    el.addEventListener("wheel", roda, {passive:false}); return function(){ el.removeEventListener("wheel", roda); }; });
  // clicar e arrastar = move o gráfico para os lados (só na tela cheia, quando está com zoom ou rolando)
  var comecaArrasto = function(ev){ if(!p.interativo || !rol.current || ev.button!==0) return;
    var sc = rol.current; arr.current = {ativo:true, x0:ev.clientX, s0:sc.scrollLeft, moveu:false};
    var mv = function(e2){ var dx = e2.clientX-arr.current.x0; if(Math.abs(dx)>3){ arr.current.moveu = true; setArrastando(true); setSel(null); } sc.scrollLeft = arr.current.s0-dx; };
    var up = function(){ arr.current.ativo = false; setArrastando(false); window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", mv); window.addEventListener("mouseup", up); };
  // meses (faixa de índices) e legendas embaixo: por dia em janelas curtas, por mês nas grandes; pula as que encostariam na anterior
  // história grande (mais de 200 dias): uma marca por ANO em vez de por mês
  var modoAno = n>200, chave = function(dt){ return modoAno ? dt.slice(0,4) : dt.slice(0,7); };
  var porDia = n<=45, ultimaX = -99, rotulos = [], meses = [], inicioMes = 0;
  pts.forEach(function(pt, i){
    var novoMes = i===0 || chave(pt.data)!==chave(pts[i-1].data);
    if(novoMes){ if(i>0) meses.push({de:inicioMes, ate:i-1}); inicioMes = i; }
    if(!(porDia || novoMes || pt.tipo==="projetado")) return;
    var cx = esq + (i+0.5)*slot; if(cx-ultimaX < 40) return; ultimaX = cx;
    rotulos.push(e("text",{key:"r"+i, x:cx, y:base+16, textAnchor:"middle", fontSize:10, fontWeight:600, fill:"currentColor", fillOpacity:.75},
      pt.tipo==="projetado" ? mesAbr(pt.data) : porDia ? pt.data.slice(8,10)+"/"+pt.data.slice(5,7) : modoAno ? pt.data.slice(0,4) : mesAbr(pt.data)+"/"+pt.data.slice(2,4)));
  });
  meses.push({de:inicioMes, ate:n-1});
  var mover = function(ev){ if(arr.current.ativo && arr.current.moveu) return; var r = ev.currentTarget.getBoundingClientRect(), i = Math.floor((ev.clientX-r.left-esq)/slot);
    setSel(i>=0 && i<n ? i : null); };
  var clicar = function(ev){ if(arr.current.moveu){ arr.current.moveu = false; return; } mover(ev); };   // depois de arrastar, o clique solto não seleciona barra
  var pt = sel!==null ? pts[sel] : null, ant = sel!==null && sel>0 ? pts[sel-1] : null;
  var delta = pt && ant ? pt.v-ant.v : null;
  var ultimaReal = pts.map(function(x){return x.tipo;}).lastIndexOf("real");
  // números em cima das barras: de trás para frente, só os que não encostam no seguinte (barras finas não empilham números)
  var numerosVisiveis = {}, ultimoNumX = Infinity;
  for(var q=n-1;q>=0;q--){ if(!(pts[q].tipo==="projetado" || q===ultimaReal || slot>=30)) continue; var xq = xDe(q)+barW/2; if(ultimoNumX-xq>=34){ numerosVisiveis[q] = true; ultimoNumX = xq; } }
  var grafico = e("div",{className:"relative"},
    e("svg",{viewBox:"0 0 "+W+" "+H, style:{width:W, height:H, minWidth: rolar ? W : "100%"}, className:"block "+(p.interativo && rolar ? (arrastando ? "cursor-grabbing" : "cursor-grab") : "cursor-crosshair"), role:"img", "aria-label":"Crescimento de revendedoras (colunas)",
        onMouseMove:mover, onClick:clicar, onMouseLeave:function(){ setSel(null); }},
      // faixas alternadas de mês (só a cada 2, pra marcar a virada sem pesar o desenho) + linha na virada
      meses.map(function(f,i){ return (i%2) && e("rect",{key:"faixa"+i, x:esq+f.de*slot, y:top, width:(f.ate-f.de+1)*slot, height:base-top, fill:"currentColor", fillOpacity:.035}); }),
      meses.slice(1).map(function(f,i){ return e("line",{key:"div"+i, x1:esq+f.de*slot, x2:esq+f.de*slot, y1:top, y2:base, stroke:"currentColor", strokeOpacity:modoAno ? .35 : .14}); }),
      [0,0.25,0.5,0.75,1].map(function(f,i){ var yy = base-(base-top)*f;
        return e("g",{key:"g"+i},
          e("line",{x1:esq, x2:W, y1:yy, y2:yy, stroke:"currentColor", strokeOpacity: i ? .08 : .2}),
          e("text",{x:esq-6, y:yy+3.5, textAnchor:"end", fontSize:10, fill:"currentColor", fillOpacity:.6}, num(base0+range*f))); }),
      pts.map(function(pt,i){
        var yy = y(pt.v), proj = pt.tipo==="projetado", on = sel===i;
        return e("rect",{key:pt.data, x:xDe(i), y:yy, width:barW, height:Math.max(base-yy,2), rx:Math.min(3, barW/3),
          fill: on ? "var(--color-primary)" : "var(--color-success)", fillOpacity: proj ? 0.35 : sel!==null && !on && slot>=3 ? 0.6 : 0.9,
          stroke: proj ? "var(--color-success)" : "none", strokeDasharray: proj ? "3 2" : "none", strokeWidth:1});
      }),
      // quantidade em cima da barra: sempre nas projeções (início de cada mês) e na última real; nas demais só quando cabe
      pts.map(function(p2,i){ if(!(p2.tipo==="projetado" || i===ultimaReal || slot>=30)) return null;
        if(numerosVisiveis && !numerosVisiveis[i]) return null;
        var cxB = xDe(i)+barW/2, naBorda = cxB+16>W;   // a última barra encosta na borda: o número alinha à direita
        return e("text",{key:"v"+i, x:naBorda ? W-2 : cxB, y:y(p2.v)-5, textAnchor:naBorda ? "end" : "middle", fontSize:p2.tipo==="projetado" ? 11 : 10, fontWeight:700, fill:"currentColor", fillOpacity:p2.tipo==="projetado" ? .9 : .8, pointerEvents:"none"}, num(p2.v)); }),
      pt && e("line",{x1:esq+(sel+0.5)*slot, x2:esq+(sel+0.5)*slot, y1:top, y2:base, stroke:"var(--color-primary)", strokeOpacity:.6, strokeDasharray:"3 3", pointerEvents:"none"}),
      rotulos),
    pt && e("div",{className:"pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2.5 py-1.5 text-center shadow-lg",
        style:{left:Math.min(W-70, Math.max(70, esq+(sel+0.5)*slot)), top:Math.max(0, y(pt.v)-62)}},
      e("p",{className:"text-[11px] text-muted-foreground"}, dataBR(pt.data)),
      e("p",{className:"font-mono text-[14px] font-bold tabular-nums"}, num(pt.v))));
  return e("div",{ref:caixa, onMouseDown:comecaArrasto, className:p.interativo ? "select-none" : undefined},
    rolar ? e("div",{ref:rol, className:"rolagem-grafico overflow-x-auto pb-2"}, grafico) : grafico);
}

// com botão para abrir o gráfico em tela cheia (melhor para ler os dias); Esc ou "Fechar" volta
var ZOOMS = [1, 1.5, 2, 3, 4, 6, 8, 12, 16];
function GraficoColunasRevendedoras(p){
  var ab = useState(false), aberto = ab[0], setAberto = ab[1];
  var ix = useState(p.opcoes ? p.opcoes.indice : 0), idx = ix[0], setIdx = ix[1];   // período escolhido dentro da tela cheia
  var zm = useState(0), zi = zm[0], setZi = zm[1];                                  // posição na lista de zooms
  var abrir = function(){ if(p.opcoes) setIdx(p.opcoes.indice); setZi(0); setAberto(true); };
  var pontosTela = p.opcoes ? p.opcoes.calcular(idx) : p.pontos;
  var zr = useRef(0); zr.current = zi;
  var zoomRoda = function(dir){ var ni = Math.max(0, Math.min(ZOOMS.length-1, zr.current+dir)); if(ni===zr.current) return false; zr.current = ni; setZi(ni); return true; };
  var btnZ = "grid h-9 min-w-9 place-items-center rounded-lg bg-white/10 px-2 text-[15px] font-bold hover:bg-white/15 disabled:opacity-40";
  useEffect(function(){ if(!aberto) return; var fecha = function(ev){ if(ev.key==="Escape") setAberto(false); }; window.addEventListener("keydown", fecha); return function(){ window.removeEventListener("keydown", fecha); }; }, [aberto]);
  return e("div",null,
    e("div",{className:"mb-1 flex justify-end"},
      e("button",{type:"button", onClick:abrir, "aria-label":"Expandir o gráfico para a tela inteira", className:"flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[12px] font-semibold hover:bg-white/15"}, "⛶ Tela cheia")),
    e(GraficoBase, p),
    aberto && e("div",{role:"dialog", "aria-label":"Crescimento de revendedoras em tela cheia", className:"fixed inset-0 z-[60] flex flex-col gap-3 overflow-auto bg-background p-5"},
      e("div",{className:"flex items-center justify-between gap-3"},
        e("h2",{className:"font-heading text-[20px] font-bold"}, "Crescimento de revendedoras"),
        e("button",{type:"button", onClick:function(){ setAberto(false); }, className:"rounded-lg bg-white/10 px-3 py-1.5 text-[13px] font-bold hover:bg-white/15"}, "✕ Fechar (Esc)")),
      e("div",{className:"flex flex-wrap items-center gap-2"},
        p.opcoes && p.opcoes.janelas.map(function(x,i){ return e("button",{key:i, type:"button", onClick:function(){ setIdx(i); setZi(0); },
          className:"rounded-lg px-3 py-1.5 text-[12.5px] font-semibold ring-1 "+(idx===i ? "bg-primary/15 ring-2 ring-primary" : "bg-card ring-border hover:bg-muted/40")}, x.lb); }),
        e("span",{className:"ml-auto flex items-center gap-1.5"},
          e("span",{className:"text-[12px] font-semibold text-muted-foreground", title:"Também dá para usar a roda do mouse no gráfico; clique e arraste para mover"},"Zoom · roda do mouse · arraste para mover"),
          e("button",{type:"button", "aria-label":"Diminuir o zoom", disabled:zi===0, onClick:function(){ setZi(Math.max(0, zi-1)); }, className:btnZ}, "−"),
          e("span",{className:"w-12 text-center font-mono text-[13px] font-bold"}, ZOOMS[zi]+"×"),
          e("button",{type:"button", "aria-label":"Aumentar o zoom", disabled:zi===ZOOMS.length-1, onClick:function(){ setZi(Math.min(ZOOMS.length-1, zi+1)); }, className:btnZ}, "+"),
          e("button",{type:"button", disabled:zi===0, onClick:function(){ setZi(0); }, className:btnZ+" text-[12px]!"}, "Ajustar"))),
      e(GraficoBase, Object.assign({}, p, {pontos:pontosTela, zoom:ZOOMS[zi], interativo:true, onZoom:zoomRoda, altura:Math.max(380, window.innerHeight-230)}))));
}

export { GraficoColunasRevendedoras };
