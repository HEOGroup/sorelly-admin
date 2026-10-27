// Sorelly Admin — mobile/celular-admin.js
// O celular do Admin (24/10/2026, pedido do Marcus): moldura de iPhone 13 (tela 390 x 844, entalhe no topo) com o sistema dentro,
// com as mesmas cores do Admin. Fluxo real: Entrada → Início (ícones das telas do celular + dock) → tela escolhida, com o Chat à mão.
// Cada tela de celular entra na lista TELAS (id, nome, ícone, componente). O botão "Ver no celular" de cada tela usa este celular.
import { ChatApp, useEu } from "@/apps/montagem/components/chat/chat-app";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { TelaLogin } from "@/apps/montagem/components/tela-login";
import { CelCondicionais } from "@/apps/montagem/mobile/condicionais";
import { use } from "@/apps/montagem/state/context";
import { e, useEffect, useState } from "@/shared/react";

// telas disponíveis no celular. Para a Montagem, Bipagem etc.: criar a versão celular e acrescentar uma linha aqui.
var TELAS = [
  {id:"condicionais", nome:"Condicionais", icone:"archive-box", comp:CelCondicionais}
];
var ESCALA = 0.82;

function hora(){ var d = new Date(); return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"); }
function Relogio(){ var s = useState(hora), h = s[0], set = s[1]; useEffect(function(){ var t = setInterval(function(){ set(hora()); }, 20000); return function(){ clearInterval(t); }; }, []); return e("span",null,h); }

// moldura do iPhone 13: corpo preto, botões laterais, entalhe largo, barra de status e barra inferior
function Moldura(p){
  var lado = function(l, top, h){ return e("span",{className:"absolute w-[3px] rounded-sm bg-[#2B2B2F] "+(l==="e" ? "-left-[3px]" : "-right-[3px]"), style:{top:top, height:h}}); };
  return e("div",{style:{width:414*ESCALA, height:868*ESCALA}},
    e("div",{style:{width:414, height:868, transform:"scale("+ESCALA+")", transformOrigin:"top left"}, className:"relative rounded-[58px] bg-[#0A0A0B] p-[12px] shadow-[0_0_0_2px_#2B2B2F,0_0_0_4px_#0A0A0B,0_30px_60px_-24px_rgba(0,0,0,.85)]"},
      lado("e",110,30), lado("e",170,56), lado("e",236,56), lado("d",190,86),
      e("div",{className:"relative flex h-[844px] w-[390px] flex-col overflow-hidden rounded-[46px] bg-background text-foreground"},
        e("div",{className:"absolute left-1/2 top-0 z-30 h-[30px] w-[160px] -translate-x-1/2 rounded-b-[20px] bg-[#0A0A0B]"}),
        e("div",{className:"relative z-20 flex h-[47px] shrink-0 items-center justify-between px-8 pt-1.5 text-[14px] font-semibold"},
          e(Relogio), e("span",{className:"flex items-center gap-1.5"}, e(Ph,{n:"cell-signal-full", s:15, fill:true}), e(Ph,{n:"wifi-high", s:15, fill:true}), e(Ph,{n:"battery-full", s:18, fill:true}))),
        p.children,
        e("button",{onClick:p.inicio, "aria-label":"Voltar ao início", className:"absolute bottom-1.5 left-1/2 z-30 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-white/70"}))));
}

function Entrada(p){
  return e("div",{className:"min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&>div]:h-full [&>div]:min-h-0!"},
    e(TelaLogin,{titulo:"Painel administrativo", onEntrar:p.aoEntrar}));
}
function Icone(p){
  return e("button",{onClick:p.onClick, className:"flex w-[76px] flex-col items-center gap-1.5"},
    e("span",{className:"relative grid size-[62px] place-items-center rounded-[16px] border border-primary bg-primary/20 text-primary"}, e(Ph,{n:p.icone, s:30, fill:true}),
      p.n>0 && e("span",{className:"absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[11px] font-bold text-white"}, p.n>99 ? "99+" : p.n)),
    e("span",{className:"w-full truncate text-center text-[11.5px] font-medium"}, p.nome));
}
function Inicio(p){
  return e("div",{className:"flex min-h-0 flex-1 flex-col px-5 pb-8 pt-3", style:{background:"radial-gradient(ellipse at 50% 0%, rgba(232,184,75,.16), transparent 60%)"}},
    e("p",{className:"text-[13px] text-muted-foreground"}, "Olá,"), e("p",{className:"text-[24px] font-bold leading-tight"}, (p.nome||"").split(" ")[0]),
    e("div",{className:"mt-6 flex flex-wrap gap-x-3 gap-y-5"}, TELAS.map(function(t){ return e(Icone,{key:t.id, nome:t.nome, icone:t.icone, onClick:function(){ p.abrir(t.id); }}); })),
    e("div",{className:"mt-auto flex items-center justify-center gap-6 rounded-[28px] border border-border bg-card/60 px-5 py-3"},
      e(Icone,{nome:"SorellyChat", icone:"chat-circle-text", onClick:function(){ p.abrir("chat"); }}),
      e("button",{onClick:p.sair, className:"flex w-[76px] flex-col items-center gap-1.5"},
        e("span",{className:"grid size-[62px] place-items-center rounded-[16px] border border-border bg-card"}, e(Ph,{n:"sign-out", s:28})), e("span",{className:"text-[11.5px] font-medium"}, "Sair"))));
}
function Barra(p){
  return e("div",{className:"flex h-11 shrink-0 items-center gap-2 border-b border-border px-3"},
    e("button",{onClick:p.voltar, className:"flex h-9 items-center gap-1 rounded-md px-2 text-[14px] text-primary"}, e(Ph,{n:"caret-left", s:18}), "Início"),
    e("b",{className:"flex-1 pr-14 text-center text-[15px] font-semibold"}, p.titulo));
}

function CelularAdmin(p){
  var cx = use(), ps = useState(p.logado === true ? {id:cx.state.usuario, nome:""} : null), pessoa = ps[0], setPessoa = ps[1];
  var ts = useState("inicio"), tela = ts[0], setTela = ts[1];
  var eu = useEu(pessoa ? pessoa.id : null);
  var entrou = !!pessoa;
  var inicio = function(){ if(entrou) setTela("inicio"); };
  var t = TELAS.find(function(x){ return x.id===tela; });
  var nome = (pessoa && pessoa.nome) || "";
  var corpo;
  if(!entrou) corpo = e(Entrada,{aoEntrar:function(pes){ setPessoa(pes); setTela(p.abrir || "inicio"); }});
  else if(tela==="chat") corpo = e("div",{className:"flex min-h-0 flex-1 flex-col"}, e(Barra,{titulo:"SorellyChat", voltar:inicio}), e("div",{className:"min-h-0 flex-1 overflow-hidden"}, e(ChatApp,{eu:eu, compacto:true})));
  else if(t) corpo = e("div",{className:"flex min-h-0 flex-1 flex-col"}, e(Barra,{titulo:t.nome, voltar:inicio}), e("div",{className:"min-h-0 flex-1 overflow-y-auto px-3 pb-8 pt-3 [scrollbar-width:none]"}, e(t.comp)));
  else corpo = e(Inicio,{nome:nome || "Marcus", abrir:setTela, sair:function(){ setPessoa(null); setTela("inicio"); }});
  return e(Moldura,{inicio:inicio}, corpo);
}

export { CelularAdmin, TELAS };
