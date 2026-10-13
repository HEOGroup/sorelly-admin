// Sorelly Admin — components/aviso-alertas.js
// Alertas do sistema (ex.: média de vendas acima do limite) para quem estiver na lista do Configurador de avisos.
// Aparecem no canto de cima à direita, com som, e ficam até a pessoa clicar (abre o atendimento) ou dar "Entendi".
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useEffect, useRef } from "@/shared/react";

function tocarAlerta(){
  try{ var C = window.AudioContext || window.webkitAudioContext; if(!C) return; var ac = new C(), t0 = ac.currentTime;
    [[988,0,0.28],[1319,0.3,0.28],[1760,0.6,0.5]].forEach(function(n){ var o = ac.createOscillator(), g = ac.createGain(); o.type = "square"; o.frequency.value = n[0]; o.connect(g); g.connect(ac.destination);
      var ini = t0+n[1]; g.gain.setValueAtTime(0.0001, ini); g.gain.exponentialRampToValueAtTime(0.35, ini+0.02); g.gain.exponentialRampToValueAtTime(0.0001, ini+n[2]); o.start(ini); o.stop(ini+n[2]+0.05); });
  }catch(x){}
}

function AvisoAlertas(p){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var pend = (s.alertas||[]).filter(function(a){ return (a.para||[]).indexOf(s.usuario)>=0 && (a.lidoPor||[]).indexOf(s.usuario)<0; });
  var ref = useRef({usuario:null, n:null});
  useEffect(function(){
    var r = ref.current;
    if(r.usuario!==s.usuario){ r.usuario = s.usuario; r.n = null; }          // trocou de usuário: avisa de novo o que está pendente para ele
    if(pend.length>0 && (r.n===null || pend.length>r.n)) tocarAlerta();
    r.n = pend.length;
  }, [pend.length, s.usuario]);
  if(!pend.length) return null;
  return e("div",{className:"fixed bottom-36 right-5 z-50 flex w-80 flex-col gap-2"}, pend.slice(0,3).map(function(a){
    var lido = function(){ d({type:"ALERTA_LIDO", id:a.id, usuario:s.usuario}); };
    return e("div",{key:a.id, role:"alert", className:"flex items-start gap-3 rounded-xl border border-destructive/60 bg-popover p-3.5 shadow-2xl ring-1 ring-black/40", style:a.cor ? {borderColor:a.cor, boxShadow:"0 0 0 2px "+a.cor+"66"} : undefined},
      e("span",{className:"grid size-9 shrink-0 place-items-center rounded-full bg-destructive text-white", style:a.cor ? {background:a.cor} : undefined}, e(Icon,{n:"warning", s:17})),
      e("span",{className:"min-w-0 flex-1"},
        e("b",{className:"block text-[13.5px]"}, a.titulo || "Alerta"),
        e("span",{className:"block text-[12.5px] text-muted-foreground"}, a.texto),
        e("span",{className:"mt-2 flex gap-2"},
          a.ref && e("button",{type:"button", onClick:function(){ lido(); p.abrirAtendimento(a.ref); }, className:"rounded-md bg-primary px-2.5 py-1 text-[12px] font-bold text-primary-foreground"},"Abrir atendimento"),
          e("button",{type:"button", onClick:lido, className:"rounded-md bg-white/10 px-2.5 py-1 text-[12px] font-semibold hover:bg-white/15"},"Entendi"))));
  }));
}

export { AvisoAlertas };
