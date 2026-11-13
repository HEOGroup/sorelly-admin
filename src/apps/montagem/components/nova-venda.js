// Sorelly Admin — components/nova-venda.js
// ALERTA ALTO DE "NOVA VENDA" (Marcus, 12/11/2026): quando entra um pedido novo na fila do Direcionar (atendimento interno ou representante), quem confere pagamentos (o Lucas e quem a autorização
// financeiro_confere marcar) ouve um som forte e uma voz dizendo "Nova venda", e vê um aviso grande no lado direito da tela, em QUALQUER tela em que estiver. O aviso fica até clicar; enquanto ficar sem clicar,
// repete som e voz a cada 20 segundos. Clicar leva ao Direcionar. Lê a fila que já vem do servidor (módulo pag), então chega em todos os computadores. Toca sempre, mesmo com as notificações do admin desligadas (é alerta de trabalho: o Lucas precisa ouvir).
// Só avisa pedido que chegou depois de a pessoa abrir o sistema (ou até 2 minutos antes), para não gritar com a fila antiga a cada recarga.
// Teste: o botão "Testar alerta" do Direcionar dispara o mesmo aviso com um pedido de mentira (nada é gravado).
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { podeConferirPag } from "@/apps/montagem/domain/equipe";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useEffect, useRef, useState } from "@/shared/react";

var EVENTO_TESTE = "sorelly:teste-nova-venda";
var REPETE_MS = 4000, TOLERANCIA_MS = 120000;   // toca sem parar (sirene + voz a cada 4 s) até alguém clicar
var CANAL = "sorelly:nova-venda";
// avisa as outras abas abertas do sistema neste computador que o alerta foi atendido (todas calam ao mesmo tempo)
function avisarAbas(){ try{ if(window.BroadcastChannel){ var c = new BroadcastChannel(CANAL); c.postMessage("atendido"); c.close(); } }catch(x){} }

// sirene curta e forte, feita pelo próprio navegador
function sirene(){
  try{ var C = window.AudioContext || window.webkitAudioContext; if(!C) return; var ac = new C(), t0 = ac.currentTime;
    [[880,0,0.22],[1175,0.24,0.22],[880,0.48,0.22],[1175,0.72,0.22],[1568,0.96,0.5]].forEach(function(n){ var o = ac.createOscillator(), g = ac.createGain(); o.type = "square"; o.frequency.value = n[0]; o.connect(g); g.connect(ac.destination);
      var ini = t0+n[1]; g.gain.setValueAtTime(0.0001, ini); g.gain.exponentialRampToValueAtTime(0.6, ini+0.02); g.gain.exponentialRampToValueAtTime(0.0001, ini+n[2]); o.start(ini); o.stop(ini+n[2]+0.05); });
  }catch(x){}
}
// voz do navegador dizendo "Nova venda!" (depois da sirene). Escolhe a MELHOR voz em português que o computador tem: as "Natural"/"Online" (Edge) e as do Google (Chrome) soam bem mais humanas que as antigas do Windows.
function melhorVoz(){
  try{ var lista = window.speechSynthesis.getVoices().filter(function(v){ return /^pt/i.test(v.lang); });
    var nota = function(v){ var n = v.name, p = 0; if(/natural|neural|online/i.test(n)) p += 100; if(/google/i.test(n)) p += 50; if(/pt-?BR/i.test(v.lang)) p += 20; if(/francisca|maria|vit[oó]ria|thalita|camila|luciana|fernanda|female|feminin/i.test(n)) p += 10; return p; };
    return lista.sort(function(a, b){ return nota(b)-nota(a); })[0] || null;
  }catch(x){ return null; }
}
// Voz gravada: se existir o arquivo public/audio/nova-venda.mp3 (voz de uma pessoa ou voz neural gerada uma vez), toca ele em qualquer computador; sem o arquivo, cai na voz do navegador.
function falarNavegador(){
  try{ if(!window.speechSynthesis) return; window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance("Nova venda!"), v = melhorVoz(); if(v) u.voice = v; u.lang = "pt-BR"; u.volume = 1; u.rate = 1.05; u.pitch = 1.1; window.speechSynthesis.speak(u);
  }catch(x){}
}
function falar(){
  setTimeout(function(){
    var caiu = false, voltar = function(){ if(caiu) return; caiu = true; falarNavegador(); };
    try{ var a = new Audio("/audio/nova-venda.mp3"); a.volume = 1; a.addEventListener("error", voltar, {once:true}); var pr = a.play(); if(pr && pr.catch) pr.catch(voltar); }catch(x){ voltar(); }
  }, 1300);
}
var chamar = function(){ sirene(); falar(); };

function NovaVendaAlerta(p){
  var cx = use(), s = cx.state;
  var recebe = podeConferirPag(s.usuario);
  var fila = ((s.dp && s.dp.pix) || []).filter(function(x){ return x && x.status==="fila"; });
  var idsFila = fila.map(function(x){ return x.id; }).join("|");
  var aberturaRef = useRef(Date.now()), vistosRef = useRef({}), usuarioRef = useRef(null);
  var pend = useState([]), pendentes = pend[0], setPendentes = pend[1];   // pedidos novos ainda sem clique: {id, nome, valor, origem, teste}
  // chegou pedido novo na fila
  useEffect(function(){
    if(usuarioRef.current!==s.usuario){ usuarioRef.current = s.usuario; vistosRef.current = {}; setPendentes([]); }
    if(!recebe){ return; }
    var novos = [];
    fila.forEach(function(x){ if(vistosRef.current[x.id]) return; vistosRef.current[x.id] = true;
      if((x.recebidoEm||0) >= aberturaRef.current-TOLERANCIA_MS) novos.push({id:x.id, nome:x.origem==="rep" ? (x.revendedora || x.quem) : x.quem, valor:x.valor||0, origem:x.origem}); });
    if(novos.length){ setPendentes(function(l){ return novos.concat(l); }); chamar(); }
  }, [idsFila, recebe, s.usuario]);   // eslint-disable-line react-hooks/exhaustive-deps
  // pedido que saiu da fila (alguém já direcionou) sai do aviso
  useEffect(function(){ setPendentes(function(l){ var vivos = l.filter(function(x){ return x.teste || fila.some(function(f){ return f.id===x.id; }); }); return vivos.length===l.length ? l : vivos; }); }, [idsFila]);   // eslint-disable-line react-hooks/exhaustive-deps
  // teste (botão do Direcionar)
  useEffect(function(){ var f = function(){ setPendentes(function(l){ return [{id:"teste"+Date.now(), nome:"Pedido de teste", valor:1234.5, origem:"interno", teste:true}].concat(l); }); chamar(); };
    window.addEventListener(EVENTO_TESTE, f); return function(){ window.removeEventListener(EVENTO_TESTE, f); }; }, []);
  // outra aba do mesmo computador atendeu o alerta: esta cala também
  useEffect(function(){ if(!window.BroadcastChannel) return undefined; var c = new BroadcastChannel(CANAL);
    c.onmessage = function(){ try{ window.speechSynthesis && window.speechSynthesis.cancel(); }catch(x){} setPendentes([]); };
    return function(){ c.close(); }; }, []);
  // repete som e voz enquanto ninguém clicar
  useEffect(function(){ if(!pendentes.length) return undefined; var t = setInterval(chamar, REPETE_MS); return function(){ clearInterval(t); }; }, [pendentes.length]);
  if(!recebe || !pendentes.length) return null;
  var ultimo = pendentes[0], mais = pendentes.length-1;
  var fechar = function(){ try{ window.speechSynthesis && window.speechSynthesis.cancel(); }catch(x){} setPendentes([]); avisarAbas(); };
  return e("div",{role:"alert", "aria-live":"assertive", className:"fixed bottom-4 right-4 z-[60] w-[min(22rem,calc(100vw-2rem))] rounded-lg shadow-2xl ring-2 ring-[var(--bloco-titulo)]"},
    e(BlocoPainel,{titulo:ultimo.teste ? "Nova venda · teste" : "Nova venda", compacto:true},
      e("div",{className:"flex flex-col items-center gap-2 p-3 text-center"},
        e("span",{className:"text-[13px] font-semibold text-foreground"}, ultimo.nome+(mais>0 ? " e mais "+mais : "")),
        e("b",{className:MONO+" text-[20px] text-foreground"}, BK(ultimo.valor)),
        e("div",{className:"flex w-full flex-wrap justify-center gap-2"},
          e(Botao,{principal:true, onClick:function(){ fechar(); if(!ultimo.teste && p.abrir) p.abrir(); }}, ultimo.teste ? "Entendi" : "Ir para o Direcionar"),
          !ultimo.teste && e(Botao,{onClick:fechar}, "Entendi")))));
}

var testarNovaVenda = function(){ try{ window.dispatchEvent(new Event(EVENTO_TESTE)); }catch(x){} };

export { NovaVendaAlerta, testarNovaVenda };
