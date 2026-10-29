// Sorelly Admin · montagem — components/chat/chat-ui.js
// Peças pequenas do SorellyChat: cores do WhatsApp, avatar, ícones, ticks, janelas e formatação de hora.
import { contato, iniciais } from "@/apps/montagem/domain/chat-contatos";
import { fotoDe, lerMidia, online, textoPrevia } from "@/apps/montagem/domain/chat-store";
import { e, useEffect } from "@/shared/react";

// paleta do WhatsApp (tema escuro)
var W = {fundo:"#0b141a", painel:"#111b21", cab:"#202c33", entrada:"#202c33", saida:"#005c4b", texto:"#e9edef", sec:"#8696a0", verde:"#00a884", azul:"#53bdeb", borda:"#222d34", campo:"#2a3942", hover:"#202c33", sel:"#2a3942", vermelho:"#f15c6d", ouro:"#E8B84B"};

// tema claro (usado só dentro dos apps de celular); volta ao escuro quando o último chat claro sai da tela
var W_ESCURO = Object.assign({}, W), W_CLARO = {fundo:"#EFEAE2", painel:"#FFFFFF", cab:"#F0F2F5", entrada:"#FFFFFF", saida:"#D9FDD3", texto:"#111B21", sec:"#667781", verde:"#00A884", azul:"#34B7F1", borda:"#E9EDEF", campo:"#F0F2F5", hover:"#F5F6F6", sel:"#F0F2F5", vermelho:"#EA0038", ouro:"#B8862B"}, nClaros = 0;
function TemaChatClaro(p){
  Object.assign(W, W_CLARO);
  useEffect(function(){ nClaros++; return function(){ nClaros--; if(nClaros<=0) Object.assign(W, W_ESCURO); }; }, []);
  return p.children;
}
function Ph(p){ return e("i",{className:(p.fill ? "ph-fill" : "ph-duotone")+" ph-"+p.n+" inline-block shrink-0 leading-none "+(p.className||""), style:Object.assign({fontSize:p.s||18}, p.style), "aria-hidden":true}); }

function Avatar(p){
  var c = p.grupo ? null : contato(p.id), s = p.s || 40;
  var foto = p.foto ? (lerMidia(p.foto) || (String(p.foto).indexOf("data:")===0 ? p.foto : null)) : (!p.grupo && p.id ? fotoDe(p.id) : null);
  var nome = p.nome || (c && c.nome) || "?";
  var cor = p.grupo ? "#6B7C85" : (c ? c.cor : "#6B7C85");
  var ponto = Math.max(10, Math.round(s*0.3));
  return e("span",{className:"relative inline-block shrink-0", style:{width:s, height:s}, title:nome},
    e("span",{className:"grid size-full place-items-center overflow-hidden rounded-full font-semibold text-white", style:{background:foto ? "#000" : cor, fontSize:s*0.38}},
      foto ? e("img",{src:foto, alt:"", draggable:false, className:"size-full object-cover"}) : (p.grupo ? e(Ph,{n:"users-three", s:s*0.5, fill:true}) : iniciais(nome))),
    !p.grupo && p.id && p.presenca && online(p.id) && e("span",{className:"absolute rounded-full", style:{width:ponto, height:ponto, right:-1, bottom:-1, background:"#25d366", boxShadow:"0 0 0 2.5px "+W.painel}}));
}

function Tique(p){
  // tiques como os do WhatsApp (traço fino, sem caixa em volta); sem azul de "lido" (Marcus, 28/10/2026): enviado = um tique, entregue = dois, cinza
  var dois = p.status!=="enviado";
  return e("svg",{width:dois ? 17 : 12, height:11, viewBox:dois ? "0 0 17 11" : "0 0 12 11", fill:"none", stroke:W.sec, strokeWidth:1.5, strokeLinecap:"round", strokeLinejoin:"round", "aria-label":dois ? "Entregue" : "Enviado", style:{display:"block", flex:"none"}},
    e("path",{d:"M1.2 6 L4.2 9 L10.2 1.6"}), dois && e("path",{d:"M6.2 6 L9.2 9 L15.2 1.6"}));
}

// formatação
var p2 = function(n){ return n<10 ? "0"+n : ""+n; };
function hora(t){ var d = new Date(t); return p2(d.getHours())+":"+p2(d.getMinutes()); }
function mesmoDia(a,b){ var x = new Date(a), y = new Date(b); return x.getFullYear()===y.getFullYear() && x.getMonth()===y.getMonth() && x.getDate()===y.getDate(); }
var SEMANA = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];
function diaRotulo(t){
  var agora = Date.now(); if(mesmoDia(t, agora)) return "Hoje"; if(mesmoDia(t, agora-86400000)) return "Ontem";
  var d = new Date(t); if(agora-t < 6*86400000) return SEMANA[d.getDay()];
  return p2(d.getDate())+"/"+p2(d.getMonth()+1)+"/"+d.getFullYear();
}
function horaLista(t){ var agora = Date.now(); if(mesmoDia(t, agora)) return hora(t); if(mesmoDia(t, agora-86400000)) return "Ontem"; var d = new Date(t); return p2(d.getDate())+"/"+p2(d.getMonth()+1)+"/"+String(d.getFullYear()).slice(2); }
function duracao(ms){ var s = Math.max(0, Math.round(ms/1000)), h = Math.floor(s/3600), m = Math.floor((s%3600)/60), r = s%60; return (h ? h+":"+p2(m) : m)+":"+p2(r); }
function tempoCurto(ms){ if(ms==null) return "—"; var m = Math.round(ms/60000); if(m<1) return "< 1 min"; if(m<60) return m+" min"; var h = Math.floor(m/60); return h+"h"+(m%60 ? p2(m%60) : ""); }
function tamanho(b){ return b>1048576 ? (b/1048576).toFixed(1).replace(".",",")+" MB" : Math.max(1,Math.round(b/1024))+" KB"; }

// janela por cima de tudo (esc fecha)
function Janela(p){
  useEffect(function(){ var f = function(ev){ if(ev.key==="Escape"){ ev.stopPropagation(); p.fechar(); } }; window.addEventListener("keydown", f, true); return function(){ window.removeEventListener("keydown", f, true); }; }, []);
  return e("div",{className:"fixed inset-0 z-[80] grid place-items-center bg-black/70 p-3", onClick:function(ev){ if(ev.target===ev.currentTarget) p.fechar(); }},
    e("div",{className:"flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl shadow-2xl", style:{maxWidth:p.largura||440, background:W.painel, color:W.texto, border:"1px solid "+W.borda}},
      e("div",{className:"flex items-center gap-2 px-4 py-3", style:{background:W.cab}},
        e("button",{onClick:p.fechar, "aria-label":"Fechar", className:"grid size-8 place-items-center rounded-full hover:bg-white/10"}, e(Ph,{n:"x", s:18})),
        e("h3",{className:"flex-1 text-[15px] font-semibold"}, p.titulo)),
      e("div",{className:"min-h-0 flex-1 overflow-y-auto"}, p.children)));
}
function Popover(p){
  return e("div",{className:"absolute z-[60] "+(p.className||"")},
    e("div",{className:"fixed inset-0 z-[59]", onClick:p.fechar, onContextMenu:function(ev){ ev.preventDefault(); p.fechar(); }}),
    e("div",{className:"relative z-[61] overflow-hidden rounded-lg py-1.5 shadow-2xl", style:{background:W.cab, border:"1px solid "+W.borda, minWidth:p.largura||180}}, p.children));
}
function ItemMenu(p){
  return e("button",{onClick:p.onClick, disabled:p.desligado, className:"flex w-full items-center gap-3 whitespace-nowrap px-4 py-2 text-left text-[13.5px] hover:bg-white/10 disabled:opacity-40", style:{color:p.perigo ? W.vermelho : W.texto}},
    p.n && e(Ph,{n:p.n, s:17}), p.children);
}
function Vazio(p){ return e("div",{className:"flex flex-col items-center justify-center gap-2 px-6 py-10 text-center", style:{color:W.sec}}, p.n && e(Ph,{n:p.n, s:40}), e("p",{className:"text-[13px]"}, p.children)); }
function Carregando(){ return e("div",{className:"flex items-center justify-center gap-2 p-8 text-[13px]", style:{color:W.sec}}, e(Ph,{n:"circle-notch", s:20, className:"animate-spin"}), "Carregando…"); }

var textoPreviaMsg = textoPrevia;
// quanto tempo a conversa está sem resposta: cinza até 2h, amarelo 2h, laranja 4h, vermelho 8h, vermelho forte (pisca) 24h
var CORES_ESPERA = ["#8696a0","#f5c542","#fb923c","#ef4444","#b91c1c"];
function EtiquetaEspera(p){
  var t = p.t, c = CORES_ESPERA[t.nivel];
  return e("span",{className:"flex shrink-0 items-center gap-1 rounded-full px-1.5 text-[10px] font-extrabold "+(t.nivel>=4 ? "animate-pulse" : ""), style:{background:t.nivel ? c+"33" : "transparent", color:c, border:"1px solid "+c+"88", height:20},
    title:t.pend+(t.pend===1 ? " mensagem" : " mensagens")+" sem resposta há "+tempoCurto(t.espera)+" (só expediente)"}, e(Ph,{n:"clock-countdown", s:12, fill:true}), t.pend+" · "+tempoCurto(t.espera));
}
// Símbolo do SorellyChat: balão dourado com um "S" em fita e uma faísca de joia
function LogoChat(p){ var t = p.s || 30;
  return e("svg",{width:t, height:t, viewBox:"0 0 48 48", "aria-hidden":true, className:"shrink-0"},
    e("defs",null, e("linearGradient",{id:"lcg", x1:0, y1:0, x2:1, y2:1}, e("stop",{offset:"0", stopColor:"#9a7220"}), e("stop",{offset:".45", stopColor:"#f9e39a"}), e("stop",{offset:"1", stopColor:"#c9962f"}))),
    e("path",{d:"M24 3C12.4 3 3 11.2 3 21.4c0 5.4 2.7 10.2 7 13.5L8.6 44l8.4-4.6c2.2.7 4.5 1 7 1 11.6 0 21-8.2 21-18.4S35.6 3 24 3z", fill:"url(#lcg)"}),
    e("path",{d:"M30.5 15.5c-1.6-1.8-4-2.7-6.6-2.7-3.6 0-6 1.8-6 4.5 0 6.2 12.4 3.2 12.4 9.4 0 2.8-2.6 4.6-6.2 4.6-2.8 0-5.4-1-7-3", fill:"none", stroke:"#24180a", strokeWidth:3.2, strokeLinecap:"round"}),
    e("path",{d:"M36 7l1.4 3.4 3.4 1.4-3.4 1.4L36 16.6l-1.4-3.4-3.4-1.4 3.4-1.4z", fill:"#fffbe8"}));
}
export { LogoChat, TemaChatClaro, CORES_ESPERA, EtiquetaEspera, textoPreviaMsg, W, Ph, Avatar, Tique, hora, diaRotulo, horaLista, duracao, tempoCurto, tamanho, mesmoDia, Janela, Popover, ItemMenu, Vazio, Carregando, p2 };
