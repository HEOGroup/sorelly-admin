// Sorelly Admin — components/aviso-pagamentos.js
// Aviso no canto de baixo à direita, com som, sobre os pagamentos do atendimento interno:
//  • para quem CONFERE (Marcus, Nickolas, Lucas, Ana Maria): chegou pagamento para definir as contas ("plim"), clica e vai para a Visão geral;
//  • para quem BIPA (bipadoras e Deysiane): o financeiro definiu as contas, voltou com o valor em aberto para anexar o comprovante (som mais forte), clica e vai para a Atendimento Sorelly.
import { podeConferirPag } from "@/apps/montagem/domain/equipe";
import { statusLinhaFin } from "@/apps/montagem/domain/atendimento-interno";
import { BIPADORAS, SUPERVISORA } from "@/apps/montagem/domain/equipe";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useEffect, useRef, useState } from "@/shared/react";

// sons feitos pelo próprio navegador (não precisa de arquivo)
function tocar(notas, tipo, volume){
  try{ var C = window.AudioContext || window.webkitAudioContext; if(!C) return; var ac = new C(), t0 = ac.currentTime;
    notas.forEach(function(n, i){ var o = ac.createOscillator(), g = ac.createGain(); o.type = tipo; o.frequency.value = n[0]; o.connect(g); g.connect(ac.destination);
      var ini = t0+n[1]; g.gain.setValueAtTime(0.0001, ini); g.gain.exponentialRampToValueAtTime(volume, ini+0.02); g.gain.exponentialRampToValueAtTime(0.0001, ini+n[2]);
      o.start(ini); o.stop(ini+n[2]+0.05); });
  }catch(x){}
}
var plim = function(){ tocar([[880,0,0.5],[1318,0.16,0.5]], "sine", 0.25); };
// mais forte e mais longo: três toques seguidos
var plimForte = function(){ tocar([[988,0,0.28],[1319,0.3,0.28],[1760,0.6,0.28],[988,1.0,0.28],[1319,1.3,0.28],[1760,1.6,0.5]], "square", 0.5); };

function AvisoPagamentos(p){
  var cx = use(), s = cx.state;
  var confere = podeConferirPag(s.usuario);
  var bipa = !confere && (s.usuario===SUPERVISORA.id || BIPADORAS.some(function(b){ return b.id===s.usuario; }));
  var modo = confere ? "fin" : bipa ? "bip" : null;
  var lancs = s.lancFin || [];
  var itens, total;
  if(modo==="fin"){
    itens = lancs.filter(function(x){ return !x.conferido; });
    total = itens.reduce(function(t,x){ return t+x.linhas.reduce(function(a,l){ return l.isento ? a : a+l.valor; }, 0); }, 0);
  } else if(modo==="bip"){
    // contas já definidas pelo financeiro, falta o comprovante: valor em aberto
    itens = lancs.filter(function(x){ return x.origem!=="rep" && x.linhas.some(function(l){ return statusLinhaFin(l)==="conta" && (l.partes||[]).some(function(q){ return q.descricao && !q.comprovante; }); }); });
    total = itens.reduce(function(t,x){ return t+x.linhas.reduce(function(a,l){ return a+(l.isento ? 0 : (l.partes||[]).reduce(function(b,q){ return b+(q.descricao && !q.comprovante ? (q.valor||0) : 0); }, 0)); }, 0); }, 0);
  } else { itens = []; total = 0; }
  var usuarioRef = useRef(null);
  var vistos = useRef(null);                        // quantos já foram avisados para este usuário
  var tm = useState(false), aberto = tm[0], setAberto = tm[1];
  useEffect(function(){
    if(usuarioRef.current!==s.usuario){ usuarioRef.current = s.usuario; vistos.current = null; }   // trocou de usuário: avisa de novo o que está pendente para ele
    if(!modo){ vistos.current = null; setAberto(false); return; }
    if(itens.length>0 && (vistos.current===null || itens.length>vistos.current)){ setAberto(true); (modo==="bip" ? plimForte : plim)(); }
    if(itens.length===0) setAberto(false);
    vistos.current = itens.length;
  }, [itens.length, modo, s.usuario]);
  useEffect(function(){ if(!aberto) return; var t = setTimeout(function(){ setAberto(false); }, 20000); return function(){ clearTimeout(t); }; }, [aberto, itens.length]);
  if(!modo || !aberto || !itens.length) return null;
  var ultimo = itens[0], bip = modo==="bip";
  return e("button",{type:"button", role:"alert", onClick:function(){ setAberto(false); (bip ? p.abrirAtendimento : p.abrir)(); },
    className:"fixed bottom-5 left-5 z-50 flex w-80 items-start gap-3 rounded-xl border border-[#E8B84B]/60 bg-popover p-3.5 text-left shadow-2xl ring-1 ring-black/40 hover:-translate-y-0.5"},
    e("span",{className:"grid size-9 shrink-0 place-items-center rounded-full bg-[#E8B84B] text-[#1B1409]"}, e(Icon,{n:"wallet", s:17})),
    e("span",{className:"min-w-0 flex-1"},
      e("b",{className:"block text-[13.5px]"}, bip ? (itens.length===1 ? "Contas definidas: anexe o comprovante" : itens.length+" acertos esperando comprovante") : (itens.length===1 ? "1 pagamento para conferir" : itens.length+" pagamentos para conferir")),
      e("span",{className:"block truncate text-[12.5px] text-muted-foreground"}, ultimo.nome+(itens.length>1 ? " e mais "+(itens.length-1) : "")),
      e("b",{className:MONO+" mt-0.5 block text-[16px] text-primary"}, (bip ? "Em aberto " : "")+BK(total)),
      e("span",{className:"text-[11.5px] font-semibold text-primary"}, bip ? "Clique para abrir o atendimento" : "Clique para abrir na Visão geral")));
}

export { AvisoPagamentos, plim };
