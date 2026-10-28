// Sorelly Admin · montagem — mobile/cel-chat.js
// SorellyChat dentro dos celulares simulados dos funcionários internos (montadora, bipadora, condicionais — 27/10/2026, pedido do Marcus):
// "Voltar" + o chat, ocupando o resto da tela do iPhone simulado (mobile/iphone.js, id="app-screen"). A altura se ajusta sozinha ao que sobra
// (o app-screen tem padding e rola sozinho; um número fixo erra sempre que o texto do "Voltar" muda de tamanho).
import { ChatApp } from "@/apps/montagem/components/chat/chat-app";
import { e, useEffect, useRef } from "@/shared/react";

function CelChat(p){
  // mede a PRÓPRIA faixa (não a do chat, que ainda não tem altura pra medir — galinha e ovo) e deixa o flex-1 dividir o resto com o chat
  var raiz = useRef(null);
  useEffect(function(){
    var ajusta = function(){
      var el = raiz.current, tela = document.getElementById("app-screen"); if(!el || !tela) return;
      el.style.height = Math.max(240, tela.getBoundingClientRect().bottom-el.getBoundingClientRect().top)+"px";
    };
    ajusta(); window.addEventListener("resize", ajusta); return function(){ window.removeEventListener("resize", ajusta); };
  }, []);
  return e("div",{ref:raiz, className:"-mx-4 -mb-10 -mt-2 flex flex-col"},
    e("button",{onClick:p.voltar, className:"mb-2 ml-4 flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-[#8A6A12]"}, "‹ Voltar"),
    e("div",{className:"min-h-0 flex-1 overflow-hidden rounded-2xl border border-[#E9DDBB]"}, e(ChatApp,{eu:p.eu, compacto:true})));
}
export { CelChat };
