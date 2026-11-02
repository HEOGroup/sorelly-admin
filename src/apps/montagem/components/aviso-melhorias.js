// Sorelly Admin — components/aviso-melhorias.js
// Aviso de RESPOSTA NOVA nas Melhorias (02/11/2026, pedido do Marcus): quem pediu a melhoria vê um cartão no alto da tela, com som, quando alguém responde ou muda a situação do pedido dele.
// "Ver resposta" abre a tela Melhorias já com o pedido aberto (a resposta pode trazer um vídeo-aula). "Depois" esconde e volta a avisar ao recarregar; abrir o pedido marca como visto.
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { melMarcarVisto, melNovidades } from "@/apps/montagem/domain/melhorias";
import { tocar } from "@/apps/montagem/lib/sons";
import { useNotif } from "@/apps/montagem/lib/notificacoes";
import { use } from "@/apps/montagem/state/context";
import { e, useEffect, useRef, useState } from "@/shared/react";

function AvisoMelhorias(p){
  var cx = use(), s = cx.state, nt = useNotif(), tk = useState(0), setTk = tk[1], oc = useState(false), oculto = oc[0], setOculto = oc[1], ref = useRef({usuario:null, n:0});
  useEffect(function(){ var f = function(){ setTk(function(x){ return x+1; }); }; window.addEventListener("sorelly-mel-visto", f); return function(){ window.removeEventListener("sorelly-mel-visto", f); }; }, []);
  var lista = s.usuario ? melNovidades(s, s.usuario) : [];
  var aqui = typeof window!=="undefined" && /melhorias/.test(window.location.pathname);   // já está na tela de Melhorias: o aviso não atrapalha
  useEffect(function(){
    var r = ref.current; if(r.usuario!==s.usuario){ r.usuario = s.usuario; r.n = 0; setOculto(false); }
    if(lista.length>r.n && !aqui && nt.admin){ try { tocar("receber"); } catch(x){} setOculto(false); }
    r.n = lista.length;
  }, [lista.length, s.usuario, nt.admin, aqui]);
  if(!lista.length || oculto || aqui || !nt.admin) return null;
  var primeira = lista[0];
  return e("div",{role:"alert", className:"fixed right-5 top-16 z-50 flex w-96 flex-col gap-2 rounded-xl border border-primary/60 bg-popover p-3 shadow-2xl ring-1 ring-black/40"},
    e("b",{className:"text-[13px] text-foreground"}, lista.length>1 ? "Você tem "+lista.length+" respostas nas suas Melhorias" : "Você tem uma resposta nas suas Melhorias"),
    e("span",{className:"truncate text-[13px] text-foreground", title:primeira.titulo}, primeira.titulo),
    primeira.video && e("span",{className:"text-[11px] uppercase tracking-wide text-primary"}, "A resposta tem um vídeo"),
    e("span",{className:"flex gap-2"},
      e(Botao,{principal:true, onClick:function(){ window.__melAbrir = primeira.id; p.abrirMelhorias(); }}, "Ver resposta"),
      e(Botao,{onClick:function(){ setOculto(true); }}, "Depois")));
}

export { AvisoMelhorias, melMarcarVisto };
