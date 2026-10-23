// Sorelly Admin · montagem — components/timer-marcus.js
// Relógio de trabalho do Marcus (só aparece para ele): iniciar, pausar e finalizar o dia. Fica embaixo da tela e sobrevive a recarregar a página
// (o que se guarda são horários, não um contador). Tabela prevista no banco: work_sessions.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { e, useEffect, useState } from "@/shared/react";

var CHAVE = "sorelly_timer_dia_v1";
var vazio = {estado:"parado", acumMs:0, inicio:null, dia:null, historico:[]};
function carregar(){ try{ var o = JSON.parse(localStorage.getItem(CHAVE)||"null"); if(o && o.estado) return o; }catch(x){} return vazio; }
var estado = carregar(), ouvintes = [];
function mudar(n){ estado = n; try{ localStorage.setItem(CHAVE, JSON.stringify(n)); }catch(x){} ouvintes.forEach(function(f){ f(); }); }
var diaISO = function(t){ var d = new Date(t); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
function decorrido(s){ return s.acumMs + (s.estado==="rodando" ? Date.now()-s.inicio : 0); }
// workSession.start/pause/stop do pedido original
var workSession = {
  start:function(){ if(estado.estado==="rodando") return; mudar(Object.assign({}, estado, {estado:"rodando", inicio:Date.now(), dia:estado.dia || diaISO(Date.now())})); },
  pause:function(){ if(estado.estado!=="rodando") return; mudar(Object.assign({}, estado, {estado:"pausado", acumMs:decorrido(estado), inicio:null})); },
  stop:function(){ if(estado.estado==="parado") return; var ms = decorrido(estado);
    mudar({estado:"parado", acumMs:0, inicio:null, dia:null, historico:[{dia:estado.dia, ms:ms, fim:Date.now()}].concat(estado.historico).slice(0,60)}); }
};
var hms = function(ms){ var s = Math.floor(ms/1000), h = Math.floor(s/3600), m = Math.floor((s%3600)/60); return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")+":"+String(s%60).padStart(2,"0"); };
var curto = function(ms){ var m = Math.round(ms/60000); return Math.floor(m/60)+"h"+String(m%60).padStart(2,"0"); };

function TimerMarcus(){
  var tk = useState(0), setTk = tk[1], hs = useState(false), hist = hs[0], setHist = hs[1], cf = useState(false), confirma = cf[0], setConfirma = cf[1];
  useEffect(function(){ var f = function(){ setTk(function(n){ return n+1; }); }; ouvintes.push(f); var t = setInterval(f, 1000);
    return function(){ ouvintes = ouvintes.filter(function(x){ return x!==f; }); clearInterval(t); }; }, []);
  var s = estado, rodando = s.estado==="rodando", pausado = s.estado==="pausado", ms = decorrido(s);
  var hoje = diaISO(Date.now()), fechadoHoje = s.historico.filter(function(h){ return h.dia===hoje; }).reduce(function(t,h){ return t+h.ms; }, 0);
  var bt = function(rot, ic, onClick, cor){ return e("button",{onClick:onClick, "aria-label":rot, title:rot, className:"grid size-9 place-items-center rounded-full text-white", style:{background:cor}}, e(Ph,{n:ic, s:18, fill:true})); };
  return e("div",{className:"fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 max-md:left-3 max-md:translate-x-0", "data-sem-clique":true},
    hist && e("div",{className:"absolute bottom-full left-0 mb-2 w-72 rounded-xl p-3 shadow-2xl", style:{background:"#202c33", border:"1px solid #222d34", color:"#e9edef"}},
      e("p",{className:"mb-2 text-[12.5px] font-semibold uppercase tracking-wide", style:{color:"#8696a0"}}, "Dias finalizados"),
      !s.historico.length ? e("p",{className:"text-[13px]", style:{color:"#8696a0"}}, "Nenhum dia finalizado ainda.") :
        s.historico.slice(0,8).map(function(h, i){ return e("div",{key:i, className:"flex justify-between py-1 text-[13.5px]"}, e("span",null, h.dia.split("-").reverse().join("/")), e("b",{className:"tabular-nums"}, curto(h.ms))); })),
    e("div",{className:"flex items-center gap-2.5 rounded-full py-1.5 pl-4 pr-2 shadow-2xl", style:{background:"#111b21", border:"1px solid "+(rodando ? "#00a884" : "#222d34"), color:"#e9edef"}},
      e("button",{onClick:function(){ setHist(!hist); }, className:"flex items-center gap-2", title:"Ver dias finalizados"},
        e(Ph,{n:"timer", s:18, fill:true, style:{color:rodando ? "#25d366" : "#8696a0"}}),
        e("span",{className:"text-[16px] font-semibold tabular-nums"}, hms(ms)),
        e("span",{className:"hidden text-[12px] sm:inline", style:{color:"#8696a0"}}, rodando ? "trabalhando" : pausado ? "pausado" : fechadoHoje ? "hoje: "+curto(fechadoHoje) : "dia não iniciado")),
      s.estado==="parado" && bt("Iniciar o dia", "play", workSession.start, "#00a884"),
      rodando && bt("Pausar", "pause", workSession.pause, "#f59e0b"),
      pausado && bt("Continuar", "play", workSession.start, "#00a884"),
      s.estado!=="parado" && (confirma ?
        e("span",{className:"flex items-center gap-1.5 pr-1"}, e("span",{className:"text-[12.5px]"}, "Finalizar o dia?"),
          e("button",{onClick:function(){ workSession.stop(); setConfirma(false); }, className:"rounded-full px-3 py-1 text-[12.5px] font-semibold text-white", style:{background:"#ef4444"}}, "Sim"),
          e("button",{onClick:function(){ setConfirma(false); }, className:"rounded-full px-3 py-1 text-[12.5px]", style:{background:"#2a3942"}}, "Não")) :
        bt("Finalizar o dia", "stop", function(){ setConfirma(true); }, "#ef4444"))));
}
export { TimerMarcus, workSession };
