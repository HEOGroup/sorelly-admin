// Sorelly Admin — lib/contagem-tela.js
// Números que CORREM em vez de pular, como nos saldos do Caixa:
//   • ao abrir a tela, todos os números começam em zero e correm até o valor;
//   • depois, sempre que um valor mudar (escolheu 94/95/96%, atualizou o faturamento, trocou o dia…), ele corre do valor antigo até o novo.
// Funciona por cima do que já está desenhado: procura os textos que são só um valor ("R$ 475.034,23", "2.077", "600") e os anima.
// Se o sistema trocar o texto no meio de uma animação, ela recomeça do ponto onde estava até o valor novo.
import { React } from "@/shared/react";
import { tocar } from "@/apps/montagem/lib/sons";

var ultTique = 0;   // um tique por ~70 ms no máximo, mesmo com vários números subindo juntos

function ler(t){
  t = String(t||"").trim(); var m;
  if((m = /^([−-]?)R\$ ([\d.]+,\d{2})$/.exec(t))) return {tipo:"moeda", sinal:m[1], valor:(m[1] ? -1 : 1)*parseFloat(m[2].replace(/\./g,"").replace(",","."))};
  if((m = /^([−-]?)(\d{1,3}(?:\.\d{3})+|\d+)$/.exec(t)) && !/^\d{4}$/.test(m[2])) return {tipo:"int", sinal:m[1], valor:(m[1] ? -1 : 1)*parseFloat(m[2].replace(/\./g,""))};
  return null;
}
function fmt(tipo, sinal, x){
  var neg = x<0 && Math.abs(x)>=0.005, a = Math.abs(x), pre = neg ? (sinal || "−") : "";
  return tipo==="moeda" ? pre+"R$ "+a.toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}) : pre+Math.round(a).toLocaleString("pt-BR");
}
function folhas(raiz){
  var r = []; Array.prototype.forEach.call(raiz.querySelectorAll("b, span, p, td, div"), function(el){ if(!el.childElementCount){ var info = ler(el.textContent); if(info) r.push({el:el, info:info}); } }); return r;
}

var ativas = new Set(), raf = 0;
function loop(agora){
  raf = 0;
  ativas.forEach(function(a){
    var cn = a.el._cn;
    if(!cn || a.el.textContent!==cn.txt){ ativas.delete(a); return; }   // o sistema trocou o texto: o observador recomeça dali
    var k = Math.min(1, (agora-a.ini)/a.dur), x = a.de+(a.para-a.de)*(1-Math.pow(1-k, 3));
    var texto = k>=1 ? a.final : fmt(a.info.tipo, a.info.sinal, x);
    a.el.textContent = texto; cn.txt = texto; cn.mostrado = k>=1 ? a.para : x;
    if(k<1 && agora-ultTique>70){ ultTique = agora; tocar("contar"); }
    if(k>=1) ativas.delete(a);
  });
  if(ativas.size) raf = requestAnimationFrame(loop);
}
function correr(el, info, de, para, final, dur){
  var cn = el._cn; ativas.forEach(function(a){ if(a.el===el) ativas.delete(a); });
  var texto = fmt(info.tipo, info.sinal, de); el.textContent = texto; cn.txt = texto; cn.mostrado = de;   // volta ao valor antigo antes de aparecer o novo
  ativas.add({el:el, info:info, de:de, para:para, final:final, ini:performance.now(), dur:dur});
  if(!raf) raf = requestAnimationFrame(loop);
}
// primeira passada (ao abrir a tela): registra cada número e o faz correr desde zero
function iniciar(raiz, dur, animar){
  folhas(raiz).forEach(function(f){
    f.el._cn = {tipo:f.info.tipo, mostrado:f.info.valor, txt:f.el.textContent};
    if(animar && f.info.valor!==0) correr(f.el, f.info, 0, f.info.valor, f.el.textContent, dur);
  });
}
// passadas seguintes: o que mudou de valor corre do antigo para o novo
function varrer(raiz, dur){
  folhas(raiz).forEach(function(f){
    var cn = f.el._cn, txt = f.el.textContent;
    if(!cn){ f.el._cn = {tipo:f.info.tipo, mostrado:f.info.valor, txt:txt}; return; }
    if(txt===cn.txt) return;                                   // nada mudou (ou é a nossa própria animação)
    if(cn.tipo!==f.info.tipo || cn.mostrado===f.info.valor){ cn.tipo = f.info.tipo; cn.mostrado = f.info.valor; cn.txt = txt; return; }
    correr(f.el, f.info, cn.mostrado, f.info.valor, txt, 900);
  });
}
/** ref do elemento que contém a tela (respeita "reduzir movimento") */
function useContagemNaTela(ref, dur){
  React.useLayoutEffect(function(){
    var raiz = ref.current; if(!raiz) return;
    var reduz = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    iniciar(raiz, dur || 1200, !reduz);
    if(reduz) return;
    var agendado = false;
    var obs = new MutationObserver(function(){ if(agendado) return; agendado = true; requestAnimationFrame(function(){ agendado = false; varrer(raiz, dur || 1200); }); });
    obs.observe(raiz, {childList:true, subtree:true, characterData:true});
    return function(){ obs.disconnect(); ativas.clear(); };
  }, []);
}
export { useContagemNaTela };
