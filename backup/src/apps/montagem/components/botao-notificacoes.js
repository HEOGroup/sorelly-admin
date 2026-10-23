// Sorelly Admin — components/botao-notificacoes.js
// Sininho no topo, ao lado do usuário: liga/desliga as notificações do admin (alertas de bipagem etc.) e as do SorellyChat.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { mudar, useNotif } from "@/apps/montagem/lib/notificacoes";
import { e, useState } from "@/shared/react";

function Chave(p){
  return e("button",{type:"button", role:"switch", "aria-checked":p.on, onClick:function(){ p.onChange(!p.on); }, className:"flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-white/5"},
    e("span",{className:"min-w-0 flex-1"}, e("b",{className:"block text-[13.5px]"}, p.t), e("span",{className:"block text-[12px] text-muted-foreground"}, p.sub)),
    e("span",{className:"relative h-6 w-11 shrink-0 rounded-full transition-colors "+(p.on ? "bg-success" : "bg-white/20")}, e("span",{className:"absolute top-0.5 size-5 rounded-full bg-white transition-all "+(p.on ? "left-[22px]" : "left-0.5")})));
}

function BotaoNotificacoes(){
  var nt = useNotif(), ab = useState(false), aberto = ab[0], setAberto = ab[1], algum = nt.admin || nt.chat;
  return e("div",{className:"relative"},
    e("button",{className:"relative grid size-9 place-items-center rounded-lg hover:bg-muted/50", "aria-label":"Notificações", title:"Notificações: "+(algum ? "algumas ligadas" : "desligadas"), onClick:function(){ setAberto(!aberto); }},
      e(Ph,{n:algum ? "bell-ringing" : "bell-slash", s:19, fill:algum, className:algum ? "text-primary" : "text-muted-foreground"})),
    aberto && e("div",{className:"fixed inset-0 z-40", onClick:function(){ setAberto(false); }}),
    aberto && e("div",{className:"absolute right-0 top-11 z-50 w-80 rounded-2xl border border-border bg-card p-2 shadow-2xl"},
      e("p",{className:"px-2.5 pb-1 pt-1 text-[11px] font-extrabold uppercase tracking-[.14em] text-primary"}, "Notificações"),
      e(Chave,{t:"Notificações do admin", sub:"alertas na tela e som (fila de bipagem, médias, etc.)", on:nt.admin, onChange:function(v){ mudar({admin:v}); }}),
      e(Chave,{t:"Notificações do chat", sub:"mensagens novas, marcações e respostas atrasadas", on:nt.chat, onChange:function(v){ mudar({chat:v}); }}),
      e("p",{className:"px-2.5 pb-1 pt-1.5 text-[11.5px] text-muted-foreground"}, "A escolha fica guardada neste computador.")));
}

export { BotaoNotificacoes };
