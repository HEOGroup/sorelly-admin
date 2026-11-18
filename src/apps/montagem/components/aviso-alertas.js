// Sorelly Admin — components/aviso-alertas.js
// Alertas do sistema (ex.: média de vendas acima do limite) para quem estiver na lista do Configurador de avisos.
// Aparecem no canto de cima à direita, com som, e ficam até a pessoa clicar (abre o atendimento) ou dar "Entendi".
import { useNotif } from "@/apps/montagem/lib/notificacoes";
import { use } from "@/apps/montagem/state/context";
import * as sons from "@/apps/montagem/lib/sons";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useEffect, useRef, useState } from "@/shared/react";

function tocarAlerta(){
  if(sons.config().mudo) return;   // botão "Som" do menu da conta
  try{ var C = window.AudioContext || window.webkitAudioContext; if(!C) return; var ac = new C(), t0 = ac.currentTime;
    [[988,0,0.28],[1319,0.3,0.28],[1760,0.6,0.5]].forEach(function(n){ var o = ac.createOscillator(), g = ac.createGain(); o.type = "square"; o.frequency.value = n[0]; o.connect(g); g.connect(ac.destination);
      var ini = t0+n[1]; g.gain.setValueAtTime(0.0001, ini); g.gain.exponentialRampToValueAtTime(0.35, ini+0.02); g.gain.exponentialRampToValueAtTime(0.0001, ini+n[2]); o.start(ini); o.stop(ini+n[2]+0.05); });
  }catch(x){}
}

// 18/11/2026 (Marcus: "nao para de aparecer"): quem deu "Entendi" ou abriu a tela fica lembrado NESTE navegador por chave do alerta, mesmo se o estado do servidor perder o "lido".
function lidosNoNavegador(){ try { return JSON.parse(localStorage.getItem("sorelly_alertas_lidos") || "[]"); } catch(x){ return []; } }
function lembrarLido(chave){ if(!chave) return; try { var l = lidosNoNavegador(); if(l.indexOf(chave)<0){ l.push(chave); localStorage.setItem("sorelly_alertas_lidos", JSON.stringify(l.slice(-300))); } } catch(x){} }

function AvisoAlertas(p){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var nt = useNotif();   // notificações do admin desligadas: sem aviso na tela e sem som
  var pend = (s.alertas||[]).filter(function(a){ return (a.para||[]).indexOf(s.usuario)>=0 && (a.lidoPor||[]).indexOf(s.usuario)<0 && !(a.chave && lidosNoNavegador().indexOf(a.chave)>=0); });
  var ref = useRef({usuario:null, n:null}), oc = useState({}), ocultos = oc[0], setOcultos = oc[1];
  // some sozinho depois de um tempo (continua pendente: volta a aparecer ao recarregar até a pessoa dar "Entendi")
  useEffect(function(){ var ts = pend.filter(function(a){ return !ocultos[a.id]; }).map(function(a){ return setTimeout(function(){ setOcultos(function(o){ var n = Object.assign({}, o); n[a.id] = true; return n; }); }, 25000); }); return function(){ ts.forEach(clearTimeout); }; }, [pend.map(function(a){ return a.id; }).join(",")]);
  useEffect(function(){
    var r = ref.current;
    if(r.usuario!==s.usuario){ r.usuario = s.usuario; r.n = null; }          // trocou de usuário: avisa de novo o que está pendente para ele
    var criticos = pend.filter(function(a){ return a.critico; }).length;   // alerta crítico (ex.: nova denúncia, 18/11/2026) aparece e toca mesmo com as notificações do admin desligadas
    if((nt.admin ? pend.length : criticos)>0 && (r.n===null || (nt.admin ? pend.length : criticos)>r.n)) tocarAlerta();
    r.n = nt.admin ? pend.length : criticos;
  }, [pend.length, s.usuario, nt.admin]);   // eslint-disable-line react-hooks/exhaustive-deps
  var vis = pend.filter(function(a){ return !ocultos[a.id] && (nt.admin || a.critico); });
  if(!vis.length) return null;
  return e("div",{className:"fixed bottom-32 left-5 z-50 flex w-80 flex-col gap-2"}, vis.slice(0,3).map(function(a){
    var lido = function(){ lembrarLido(a.chave); d({type:"ALERTA_LIDO", id:a.id, usuario:s.usuario}); };
    return e("div",{key:a.id, role:"alert", className:"flex items-start gap-3 rounded-xl border border-destructive/60 bg-popover p-3.5 shadow-2xl ring-1 ring-black/40", style:a.cor ? {borderColor:a.cor, boxShadow:"0 0 0 2px "+a.cor+"66"} : undefined},
      e("span",{className:"grid size-9 shrink-0 place-items-center rounded-full bg-destructive text-white", style:a.cor ? {background:a.cor} : undefined}, e(Icon,{n:"warning", s:17})),
      e("span",{className:"min-w-0 flex-1"},
        e("b",{className:"block text-[13.5px]"}, a.titulo || "Alerta"),
        e("span",{className:"block text-[12.5px] text-muted-foreground"}, a.texto),
        e("span",{className:"mt-2 flex gap-2"},
          a.aba && e("button",{type:"button", onClick:function(){ lido(); if(a.dados && a.dados.ficha) window.__fichaAbrir = a.dados.ficha; p.abrirTela(a.aba); }, className:"rounded-md bg-primary px-2.5 py-1 text-[13px] font-bold text-primary-foreground"},"Abrir tela"),
          a.ref && e("button",{type:"button", onClick:function(){ lido(); p.abrirAtendimento(a.ref); }, className:"rounded-md bg-primary px-2.5 py-1 text-[12px] font-bold text-primary-foreground"},"Abrir atendimento"),
          e("button",{type:"button", onClick:lido, className:"rounded-md bg-white/10 px-2.5 py-1 text-[12px] font-semibold hover:bg-white/15"},"Entendi"))));
  }));
}

export { AvisoAlertas };
