// Sorelly Admin · montagem — mobile/cel-chat.js
// SorellyChat dentro dos celulares simulados dos funcionários internos (montadora, bipadora, condicionais — 27/10/2026, pedido do Marcus).
// Desde 29/10/2026 usa o MESMO formato WhatsApp dos outros apps (mobile/chat-whats.js); o botão Início da barra de baixo volta para a tela anterior.
// A altura se ajusta sozinha ao que sobra do iPhone simulado (mobile/iphone.js, id="app-screen"): um número fixo erra sempre que o celular muda.
import { ChatWhats } from "@/apps/montagem/mobile/chat-whats";
import { e, useEffect, useRef, useState } from "@/shared/react";

function CelChat(p){
  var raiz = useRef(null), al = useState(640), altura = al[0], setAltura = al[1];
  useEffect(function(){
    var ajusta = function(){
      var el = raiz.current, tela = document.getElementById("app-screen"); if(!el || !tela) return;
      setAltura(Math.max(300, Math.round(tela.getBoundingClientRect().bottom-el.getBoundingClientRect().top+8)));
    };
    ajusta(); window.addEventListener("resize", ajusta); return function(){ window.removeEventListener("resize", ajusta); };
  }, []);
  return e("div",{ref:raiz}, e(ChatWhats,{eu:p.eu, canais:[], novaConversa:true, onInicio:p.voltar, altura:altura, semStatus:true}));
}
export { CelChat };
