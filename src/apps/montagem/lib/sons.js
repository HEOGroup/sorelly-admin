// Sorelly Admin — lib/sons.js
// Sons do sistema feitos na hora (Web Audio, sem arquivos). Volume e mudo ficam salvos neste navegador.
// O navegador só deixa tocar som depois de um clique: o áudio é ligado no primeiro clique/tecla da pessoa.
var CHAVE = "sorelly_sons_v1";
var cfg = (function(){ try{ var o = JSON.parse(localStorage.getItem(CHAVE)||"null"); if(o) return {volume:o.volume==null?0.6:o.volume, mudo:!!o.mudo, clique:o.clique!==false}; }catch(x){} return {volume:0.6, mudo:false, clique:true}; })();
var ouvintes = [];
var ctx = null;

function salvar(){ try{ localStorage.setItem(CHAVE, JSON.stringify(cfg)); }catch(x){} ouvintes.forEach(function(f){ f(); }); }
function ligar(){
  try{
    if(!ctx){ var AC = window.AudioContext || window.webkitAudioContext; if(!AC) return null; ctx = new AC(); }
    if(ctx.state==="suspended") ctx.resume();
  }catch(x){ return null; }
  return ctx;
}
// nota: freq (Hz), começo (s), duração (s), tipo de onda, ganho relativo
function nota(c, freq, ini, dur, tipo, g){
  var o = c.createOscillator(), a = c.createGain(), t0 = c.currentTime + ini;
  o.type = tipo || "sine"; o.frequency.setValueAtTime(freq, t0);
  var pico = Math.max(0.0001, (g==null ? 0.5 : g) * cfg.volume);
  a.gain.setValueAtTime(0.0001, t0); a.gain.exponentialRampToValueAtTime(pico, t0 + 0.012); a.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(a); a.connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.03);
}
var SONS = {
  clique:   function(c){ nota(c, 1500, 0, 0.07, "triangle", 0.4); nota(c, 900, 0.015, 0.05, "sine", 0.25); },
  enviar:   function(c){ nota(c, 520, 0, 0.09, "sine", 0.4); nota(c, 780, 0.07, 0.12, "sine", 0.4); },
  receber:  function(c){ nota(c, 880, 0, 0.12, "sine", 0.45); nota(c, 660, 0.11, 0.18, "sine", 0.4); },
  mencao:   function(c){ nota(c, 784, 0, 0.1, "triangle", 0.5); nota(c, 988, 0.1, 0.1, "triangle", 0.5); nota(c, 1319, 0.2, 0.24, "triangle", 0.5); },   // três notas subindo
  atraso:   function(c){ for(var i=0;i<3;i++){ nota(c, 440, i*0.32, 0.16, "square", 0.22); nota(c, 330, i*0.32+0.16, 0.16, "square", 0.22); } },       // sirene grave repetida
  concluir: function(c){ nota(c, 523, 0, 0.1, "sine", 0.4); nota(c, 659, 0.09, 0.1, "sine", 0.4); nota(c, 784, 0.18, 0.2, "sine", 0.4); },
  contar:   function(c){ nota(c, 1250 + Math.random()*180, 0, 0.022, "sine", 0.07); },   // tique baixinho dos números que sobem (padrão do sistema inteiro)
  tecla:    function(c){ toc(c, 1800 + Math.random()*700, 0.035, 0.9, 150 + Math.random()*30); },   // letra e número: toc macio
  tecla2:   function(c){ toc(c, 1200, 0.05, 1.0, 105); },                                          // espaço: mais grave e mais cheio
  tecla3:   function(c){ toc(c, 2600, 0.03, 0.7, 190); },                                          // apagar: mais seco e agudo
  erro:     function(c){ nota(c, 200, 0, 0.22, "sawtooth", 0.28); nota(c, 150, 0.14, 0.26, "sawtooth", 0.28); }
};
// ruído curto filtrado: dá o "toc" de uma tecla macia (mais agradável que o bipe agudo antigo)
function toc(c, freq, dur, g, grave){
  var n = Math.floor(c.sampleRate*dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0), i;
  for(i=0;i<n;i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/n, 2.2);
  var s = c.createBufferSource(), fl = c.createBiquadFilter(), a = c.createGain(), t0 = c.currentTime;
  s.buffer = b; fl.type = "bandpass"; fl.frequency.value = freq; fl.Q.value = 0.9;
  a.gain.setValueAtTime(Math.max(0.0001, g*cfg.volume), t0);
  s.connect(fl); fl.connect(a); a.connect(c.destination); s.start(t0);
  nota(c, grave, 0, 0.045, "sine", g*0.9);
}
function tocar(nome){
  if(cfg.mudo || cfg.volume<=0) return;
  if(nome==="clique" && !cfg.clique) return;
  var c = ligar(); if(!c || !SONS[nome]) return;
  try{ SONS[nome](c); }catch(x){}
}
function config(){ return cfg; }
function mudar(p){ cfg = Object.assign({}, cfg, p); salvar(); }
function assinar(f){ ouvintes.push(f); return function(){ ouvintes = ouvintes.filter(function(x){ return x!==f; }); }; }
// liga o áudio no primeiro toque e dá o "clique" em todo botão do sistema
var iniciado = false;
function iniciar(){
  if(iniciado || typeof document==="undefined") return; iniciado = true;
  var destravar = function(){ ligar(); };
  document.addEventListener("pointerdown", destravar, {capture:true});
  document.addEventListener("keydown", destravar, {capture:true});
  // barulhinho de teclado em qualquer campo de escrita
  var ultTecla = 0;
  document.addEventListener("keydown", function(ev){
    var el = ev.target; if(!el || ev.ctrlKey || ev.metaKey || ev.altKey || ev.repeat) return;
    var campo = el.tagName==="TEXTAREA" || el.isContentEditable || (el.tagName==="INPUT" && ["text","search","email","tel","url","number","password",""].indexOf((el.type||"").toLowerCase())>=0);
    if(!campo || !(ev.key.length===1 || ev.key==="Backspace" || ev.key==="Delete")) return;
    var t = Date.now(); if(t-ultTecla<35) return; ultTecla = t; tocar(ev.key===" " ? "tecla2" : (ev.key==="Backspace" || ev.key==="Delete") ? "tecla3" : "tecla");
  }, true);
  document.addEventListener("click", function(ev){
    var el = ev.target, b = el && el.closest && el.closest("button, [role=button], [role=tab], a, summary, label, select");
    if(!b){ var x = el, n = 0; while(x && x!==document.body && n<6){ try{ if(getComputedStyle(x).cursor==="pointer"){ b = x; break; } }catch(err){} x = x.parentElement; n++; } }   // também cartões e linhas clicáveis
    if(b && !b.disabled && !b.closest("[data-sem-clique]")) tocar("clique");
  }, true);
}
export { tocar, config, mudar, assinar, iniciar };
