// Sorelly Admin — components/aviso-alertas.js
// Alertas do sistema (ex.: média de vendas acima do limite) para quem estiver na lista do Configurador de avisos.
// Aparecem no canto de cima à direita, com som, e ficam até a pessoa clicar (abre o atendimento) ou dar "Entendi".
import { useNotif } from "@/apps/montagem/lib/notificacoes";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useEffect, useRef, useState } from "@/shared/react";

function tocarAlerta(){
  try{ var C = window.AudioContext || window.webkitAudioContext; if(!C) return; var ac = new C(), t0 = ac.currentTime;
    [[988,0,0.28],[1319,0.3,0.28],[1760,0.6,0.5]].forEach(function(n){ var o = ac.createOscillator(), g = ac.createGain(); o.type = "square"; o.frequency.value = n[0]; o.connect(g); g.connect(ac.destination);
      var ini = t0+n[1]; g.gain.setValueAtTime(0.0001, ini); g.gain.exponentialRampToValueAtTime(0.35, ini+0.02); g.gain.exponentialRampToValueAtTime(0.0001, ini+n[2]); o.start(ini); o.stop(ini+n[2]+0.05); });
  }catch(x){}
}

function AvisoAlertas(p){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var nt = useNotif();   // notificações do admin desligadas: sem aviso na tela e sem som
  var pend = (s.alertas||[]).filter(function(a){ return (a.para||[]).indexOf(s.usuario)>=0 && (a.lidoPor||[]).indexOf(s.usuario)<0; });
  var ref = useRef({usuario:null, n:null}), oc = useState({}), ocultos = oc[0], setOcultos = oc[1];
  // some sozinho depois de um tempo (continua pendente: volta a aparecer ao recarregar até a pessoa dar "Entendi")
  useEffect(function(){ var ts = pend.filter(function(a){ return !ocultos[a.id]; }).map(function(a){ return setTimeout(function(){ setOcultos(function(o){ var n = Object.assign({}, o); n[a.id] = true; return n; }); }, 25000); }); return function(){ ts.forEach(clearTimeout); }; }, [pend.map(function(a){ return a.id; }).join(",")]);
  useEffect(function(){
    var r = ref.current;
    if(r.usuario!==s.usuario){ r.usuario = s.usuario; r.n = null; }          // trocou de usuário: avisa de novo o que está pendente para ele
    if(nt.admin && pend.length>0 && (r.n===null || pend.length>r.n)) tocarAlerta();
    r.n = pend.length;
  }, [pend.length, s.usuario, nt.admin]);
  var vis = pend.filter(function(a){ return !ocultos[a.id]; });
  if(!vis.length || !nt.admin) return null;
  return e("div",{className:"fixed bottom-32 left-5 z-50 flex w-80 flex-col gap-2"}, vis.slice(0,3).map(function(a){
    var lido = function(){ d({type:"ALERTA_LIDO", id:a.id, usuario:s.usuario}); };
    return e("div",{key:a.id, role:"alert", className:"flex items-start gap-3 rounded-xl border border-destructive/60 bg-popover p-3.5 shadow-2xl ring-1 ring-black/40", style:a.cor ? {borderColor:a.cor, boxShadow:"0 0 0 2px "+a.cor+"66"} : undefined},
      e("span",{className:"grid size-9 shrink-0 place-items-center rounded-full bg-destructive text-white", style:a.cor ? {background:a.cor} : undefined}, e(Icon,{n:"warning", s:17})),
      e("span",{className:"min-w-0 flex-1"},
        e("b",{className:"block text-[13.5px]"}, a.titulo || "Alerta"),
        e("span",{className:"block text-[12.5px] text-muted-foreground"}, a.texto),
        e("span",{className:"mt-2 flex gap-2"},
          a.aba && e("button",{type:"button", onClick:function(){ lido(); p.abrirTela(a.aba); }, className:"rounded-md bg-primary px-2.5 py-1 text-[12px] font-bold text-primary-foreground"},"Abrir tela"),
          a.ref && e("button",{type:"button", onClick:function(){ lido(); p.abrirAtendimento(a.ref); }, className:"rounded-md bg-primary px-2.5 py-1 text-[12px] font-bold text-primary-foreground"},"Abrir atendimento"),
          e("button",{type:"button", onClick:lido, className:"rounded-md bg-white/10 px-2.5 py-1 text-[12px] font-semibold hover:bg-white/15"},"Entendi"))));
  }));
}

export { AvisoAlertas };
