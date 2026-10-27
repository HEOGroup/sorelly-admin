// Sorelly Admin · montagem — pages/WhatsSorelly.js
// SorellyChat em tela cheia: ocupa todo o bloco ao lado do menu. As conversas ficam na tela principal; "Tempo de resposta" (Direção) e
// "Configurações" abrem pelo menu (três pontinhos) da faixa dourada. O mesmo chat também fica no balãozinho do canto das outras telas.
import { ChatApp, useEu } from "@/apps/montagem/components/chat/chat-app";
import { ConfigChat } from "@/apps/montagem/components/chat/chat-config";
import { OURO, OURO_TXT } from "@/apps/montagem/components/chat/chat-lista";
import { PainelSetores, PainelTempo } from "@/apps/montagem/components/chat/chat-painel";
import { LogoChat, Ph, W } from "@/apps/montagem/components/chat/chat-ui";
import { FotosEquipe } from "@/apps/montagem/components/chat/chat-fotos";
import { ehDirecao, ehDono, podeEditarFotos } from "@/apps/montagem/domain/chat-contatos";
import { use } from "@/apps/montagem/state/context";
import { e, useEffect, useRef, useState } from "@/shared/react";

function AbaWhats(){
  var cx = use(), s = cx.state, eu = useEu(s.usuario), direcao = ehDirecao(s.usuario), fotos = podeEditarFotos(s.usuario), dono = ehDono(s.usuario);
  var ab = useState("conversas"), aba = ab[0], setAba = ab[1];
  var abas = [["conversas","Conversas","chat-circle-text"]].concat(direcao ? [["setores","Atendimento dos setores","chart-bar"], ["tempo","Tempo de resposta","timer"]] : [], fotos ? [["fotos","Fotos da equipe","image"]] : [], [["config","Configurações","gear-six"]], dono ? [["configurador","Configurador","sliders-horizontal"]] : []);
  var titulo = aba==="setores" ? "Atendimento dos setores" : aba==="tempo" ? "Tempo de resposta" : aba==="fotos" ? "Fotos da equipe" : aba==="configurador" ? "Configurador" : "Minhas configurações";
  // altura = o que sobra da tela a partir daqui (não um número fixo): sobra certo tendo ou não a faixa de abas abertas/menu em cima (Marcus, 27/10/2026 — só a lista e a conversa rolam, o resto fica parado)
  var raiz = useRef(null);
  useEffect(function(){
    var ajusta = function(){ var el = raiz.current; if(!el) return; var topo = el.getBoundingClientRect().top; el.style.height = Math.max(480, window.innerHeight-Math.max(topo, 0))+"px"; };
    ajusta(); window.addEventListener("resize", ajusta); return function(){ window.removeEventListener("resize", ajusta); };
  }, []);
  // ocupa o bloco inteiro (anula o respiro da página) até a borda de baixo
  return e("div",{ref:raiz, className:"-m-4 overflow-hidden md:-m-6", style:{background:W.fundo}},
    aba==="conversas" ? e(ChatApp,{eu:eu, direcao:direcao, paginas:{abas:abas, aba:aba, mudar:setAba}}) :
    e("div",{className:"flex h-full flex-col overflow-hidden"},
      e("div",{className:"flex shrink-0 items-center gap-3 px-4 py-2.5", style:{background:OURO, color:OURO_TXT}},
        e("button",{onClick:function(){ setAba("conversas"); }, "aria-label":"Voltar às conversas", className:"grid size-9 place-items-center rounded-full hover:bg-black/10"}, e(Ph,{n:"arrow-left", s:21})),
        e("span",{className:"grid size-9 place-items-center rounded-xl", style:{background:"rgba(36,24,10,.94)"}}, e(LogoChat,{s:26})), e("h2",{className:"text-[18px] font-extrabold tracking-tight"}, "SorellyChat"), e("span",{className:"font-semibold opacity-80"}, "· "+titulo),
        e("div",{className:"ml-auto flex gap-1"}, abas.filter(function(a){ return a[0]!==aba; }).map(function(a){ return e("button",{key:a[0], onClick:function(){ setAba(a[0]); }, className:"flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold hover:bg-black/10"}, e(Ph,{n:a[2], s:16}), a[1]); }))),
      e("div",{className:"min-h-0 flex-1 overflow-y-auto p-4 md:p-6"}, aba==="setores" ? e(PainelSetores) : aba==="tempo" ? e(PainelTempo) : aba==="fotos" ? e(FotosEquipe) : e(ConfigChat,{direcao:direcao, eu:eu, modo:aba==="configurador" ? "admin" : "pessoal", irPara:setAba}))));
}
export { AbaWhats };
