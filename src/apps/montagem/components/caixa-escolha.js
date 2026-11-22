// Sorelly Admin · montagem — components/caixa-escolha.js
// LISTA DE ESCOLHA AZUL das janelas (Marcus, 20/11/2026: "sem preto, só azul escuro e um pouco azul mais claro"). Cópia da CaixaEscolha da janela Lançar recebimento (Contas a receber), para as outras janelas usarem no lugar do menu nativo do navegador (que abre preto).
// Abre sempre PARA BAIXO, linha fina entre as opções, azul do sistema; com mais de 10 opções ganha uma busca.
// ops = [[valor, texto, grupo?, quemEstaDentro?]]: com o 4º item a lista vira DUAS COLUNAS (nome | quem está dentro) e o grupo só vira uma linha mais forte. A opção com o MESMO grupo da anterior fica debaixo do mesmo título de grupo (barra azul). Props: rot, valor, ops, vazio, aoMudar, cls, estilo, fundo, campoCls.
import { e, useEffect, useRef, useState } from "@/shared/react";

var semAc = function(t){ return String(t == null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };

function CaixaEscolha(p){
  var so = useState(false), aberto = so[0], setAberto = so[1], sb = useState(""), busca = sb[0], setBusca = sb[1], ref = useRef(null);
  useEffect(function(){
    if(!aberto) return undefined;
    var fora = function(ev){ if(ref.current && !ref.current.contains(ev.target)) setAberto(false); };
    var esc = function(ev){ if(ev.key==="Escape"){ ev.stopPropagation(); setAberto(false); } };
    document.addEventListener("mousedown", fora); document.addEventListener("keydown", esc, true);
    return function(){ document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc, true); };
  }, [aberto]);   // eslint-disable-line react-hooks/exhaustive-deps -- setAberto não muda
  var atual = p.ops.filter(function(o){ return o[0]===p.valor; })[0];
  var termos = semAc(busca).split(/\s+/).filter(Boolean);
  var vis = p.ops.filter(function(o){ var n = semAc(o[1]+" "+(o[2] || "")); return termos.every(function(x){ return n.indexOf(x)>=0; }); });
  var escolhe = function(v){ p.aoMudar(v); setAberto(false); setBusca(""); };
  var duas = p.ops.some(function(o){ return o[3]!=null; });
  return e("div",{ref:ref, className:"relative w-full"},
    e("button",{type:"button", "aria-label":p.rot, "aria-haspopup":"listbox", "aria-expanded":aberto, onClick:function(){ setAberto(!aberto); setBusca(""); }, className:p.cls+" relative flex items-center justify-center whitespace-nowrap", style:p.estilo}, atual ? atual[1] : p.vazio, e("span",{"aria-hidden":true, className:"absolute right-1.5"}, aberto ? "▴" : "▾")),
    aberto && e("div",{role:"listbox", className:"absolute left-0 z-20 overflow-hidden rounded border border-white/40 text-white shadow-lg", style:{top:"24px", background:p.fundo, width:"max-content", minWidth:duas ? "min(420px, 92vw)" : "100%", maxWidth:"92vw"}},
      p.ops.length>10 && e("input",{value:busca, autoFocus:true, "aria-label":"Buscar na lista", placeholder:"Buscar", className:p.campoCls, style:{height:"20px", lineHeight:"18px", borderRadius:0, textAlign:"left"}, onChange:function(ev){ setBusca(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter" && vis.length) escolhe(vis[0][0]); }}),
      e("div",{className:"overflow-y-auto", style:{maxHeight:"190px"}},
        // DUAS COLUNAS (Marcus, 22/11/2026): se a opção traz o 4º item (quem está dentro), mostra nome | quem está dentro e, entre um grupo e outro, só uma linha mais forte (sem título de grupo)
        duas ? vis.map(function(o, i){ var nova = i>0 && vis[i-1][2]!==o[2]; return e("button",{type:"button", key:String(o[0]), role:"option", "aria-selected":o[0]===p.valor, onClick:function(){ escolhe(o[0]); }, className:"grid w-full items-center border-b border-white/15 px-1.5 text-[11px] hover:bg-[var(--bloco-titulo)] active:brightness-125 "+(nova ? "border-t-2 border-t-white/70 " : "")+(o[0]===p.valor ? "bg-[#3f6bb8]" : ""), style:{height:"20px", gridTemplateColumns:"34% 66%"}}, e("span",{className:"flex h-full items-center justify-center border-r border-white/25 text-center font-semibold"}, o[1]), e("span",{className:"text-center"}, o[3])); }) :   // padrao-ok: linha de 20 px com letra de 11 px, janela compacta
        vis.map(function(o, i){ var cab = o[2] && (i===0 || vis[i-1][2]!==o[2]) ? e("div",{key:"g"+o[2], className:"flex items-center px-1.5 text-[11px] font-semibold text-white", style:{height:"17px", background:"var(--bloco-titulo)"}}, o[2]) : null; return [cab, e("button",{type:"button", key:String(o[0]), role:"option", "aria-selected":o[0]===p.valor, onClick:function(){ escolhe(o[0]); }, className:"flex w-full items-center justify-start whitespace-nowrap border-b border-white/15 px-1.5 text-left text-[11px] hover:bg-[var(--bloco-titulo)] active:brightness-125 "+(o[0]===p.valor ? "bg-[#3f6bb8]" : ""), style:{height:"17px"}}, o[1])]; }),   // padrao-ok: linha de 17 px com letra de 11 px, janela compacta
        !vis.length && e("div",{className:"flex items-center justify-start px-1.5 text-[11px]", style:{height:"17px"}}, "Nada encontrado"))));   // padrao-ok: aviso de 11 px
}

export { CaixaEscolha };
