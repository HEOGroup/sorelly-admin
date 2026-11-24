// Sorelly Admin — mobile/leitor-camera.js
// Leitor de código de barras pela câmera do celular, para a conferência das peças (Marcus, 24/11/2026: "precisa ter a câmera para bipar; se não bipar, digita o código").
// Como lê: leitor nativo do navegador (BarcodeDetector, Chrome/Android) e, onde ele não existe (Safari do iPhone), o zxing-wasm (zxing-cpp compilado, bem mais rápido e firme que o zxing em JavaScript; gira a imagem sozinho, lê listras na vertical, e o arquivo .wasm baixa uma vez do jsdelivr).
// O número lido é o código de barras da etiqueta (campo aaa_codbarras da DevMaster, ex.: 00032358); quem recebe (aoLer) acha a peça por ele.
// 24/11/2026 (2): zoom 2x já ligado (da câmera, onde o aparelho deixa; senão digital), bip que toca de verdade, borda verde ao ler, e leitura só vale se vier igual em 2 quadros seguidos e com formato de código de peça.
// Segurança do uso: a imagem NÃO sai do aparelho e nada é gravado; só o número lido sobe para a conferência. A câmera desliga ao fechar a tela.
import { e, useEffect, useRef, useState } from "@/shared/react";

var FORMATOS = ["code_128", "code_39", "code_93", "ean_13", "ean_8", "upc_a", "upc_e", "itf", "codabar"];
var ENTRE_LEITURAS = 1800;   // ms: o mesmo número na mira não conta de novo antes disso (a peça só conta outra vez se sair da mira e voltar)

// O som do celular só toca depois de um toque na tela: o contexto de som é criado uma vez e "destravado" no primeiro toque.
var AUDIO = null;
function audio(){
  try {
    var AC = window.AudioContext || window.webkitAudioContext; if(!AC) return null;
    if(!AUDIO) AUDIO = new AC();
    if(AUDIO.state === "suspended") AUDIO.resume();
    return AUDIO;
  } catch(x){ return null; }
}
// bip curto + vibração a cada leitura
function avisar(){
  try { if(navigator.vibrate) navigator.vibrate(80); } catch(x){}
  try {
    var a = audio(); if(!a) return;
    var o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = "square"; o.frequency.value = 1500;
    g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 0.17);
  } catch(x){}
}
// Vale número de barras com 7 a 13 dígitos (a DevMaster guarda 8) ou código de peça (CL2542, BB0531). Leitura torta (ex.: 6 dígitos) é descartada.
function valido(c){ return /^\d{7,13}$/.test(c) || /^[A-Z]{1,4}\d{3,6}$/.test(c); }

function LeitorCamera(p){
  var ref = useRef(null), st = useState({est:"abrindo", msg:"", zoom:2, flash:0}), estado = st[0], setEstado = st[1];
  var lerRef = useRef(p.aoLer); lerRef.current = p.aoLer;
  useEffect(function(){
    var vivo = true, stream = null, timer = null, ultimo = {cod:"", ts:0}, previo = "", digital = 2, lanterna = false;
    function parar(){ vivo = false; if(timer) clearTimeout(timer); if(stream) stream.getTracks().forEach(function(t){ t.stop(); }); window.removeEventListener("pointerdown", audio); }
    window.addEventListener("pointerdown", audio); audio();
    (async function(){
      if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ setEstado({est:"erro", msg:"Este aparelho ou navegador não abre a câmera aqui. Digite o código da peça."}); return; }
      try { stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}, width:{ideal:1920}, height:{ideal:1080}}, audio:false}); }
      catch(x){ setEstado({est:"erro", msg: x && x.name==="NotAllowedError" ? "A câmera está bloqueada. Permita o uso da câmera para o app nas configurações do celular, ou digite o código." : "Não consegui abrir a câmera. Digite o código da peça."}); return; }
      if(!vivo){ parar(); return; }
      var v = ref.current; if(!v){ parar(); return; }
      // zoom 2x: onde o aparelho deixa (Android) é o zoom da câmera; onde não deixa (iPhone) é zoom digital (corta o centro e amplia, na tela e na leitura)
      try {
        var tr = stream.getVideoTracks()[0], cap = tr.getCapabilities ? tr.getCapabilities() : {}, adv = [];
        if(cap.zoom && cap.zoom.max >= 2){ adv.push({zoom: Math.max(cap.zoom.min || 1, Math.min(2, cap.zoom.max))}); digital = 1; }
        if(cap.torch){ adv.push({torch:true}); lanterna = true; }
        if(cap.focusMode && cap.focusMode.indexOf("continuous") >= 0) adv.push({focusMode:"continuous"});
        if(adv.length) await tr.applyConstraints({advanced:adv});
      } catch(x){}
      v.srcObject = stream; v.setAttribute("playsinline", "true"); v.muted = true;
      try { await v.play(); } catch(x){}
      var cv = document.createElement("canvas"), cvG = document.createElement("canvas"), volta = 0, detectarImg, girar = true;
      try {
        if(window.BarcodeDetector){
          var sup = window.BarcodeDetector.getSupportedFormats ? await window.BarcodeDetector.getSupportedFormats() : FORMATOS;
          var det = new window.BarcodeDetector({formats: FORMATOS.filter(function(f){ return sup.indexOf(f) >= 0; })});
          detectarImg = async function(img){ var r = await det.detect(img); return r && r[0] ? String(r[0].rawValue || "") : ""; };
        }
      } catch(x){ detectarImg = null; }
      if(!detectarImg){
        var zx = await import("zxing-wasm/reader");
        var opc = {formats:["Code128","EAN13","EAN8","UPCA"], tryHarder:true, tryRotate:true, tryDownscale:true, maxNumberOfSymbols:1};
        detectarImg = async function(img){ var d = img.getContext("2d", {willReadFrequently:true}).getImageData(0, 0, img.width, img.height); var r = await zx.readBarcodes(d, opc); return r && r[0] ? String(r[0].text || "") : ""; };
        girar = false;   // o zxing-wasm já tenta a imagem girada
      }
      // Cada quadro: recorta o centro (zoom digital) e lê como está; em quadros alternados lê girado 90 graus (a tag do colar tem as listras na vertical).
      var detectar = async function(){
        if(!v.videoWidth) return "";
        volta++;
        var f = digital, w = Math.round(v.videoWidth / f), h = Math.round(v.videoHeight / f), k = Math.min(1, 1100 / w);   // k: reduz imagem grande para ler mais rápido
        cv.width = Math.round(w * k); cv.height = Math.round(h * k);
        cv.getContext("2d", {willReadFrequently:true}).drawImage(v, Math.round((v.videoWidth - w) / 2), Math.round((v.videoHeight - h) / 2), w, h, 0, 0, cv.width, cv.height);
        var alvo = cv;
        if(girar && volta % 2 === 0){
          cvG.width = cv.height; cvG.height = cv.width;
          var g = cvG.getContext("2d", {willReadFrequently:true}); g.translate(cv.height, 0); g.rotate(Math.PI / 2); g.drawImage(cv, 0, 0); alvo = cvG;
        }
        var r = await detectarImg(alvo);
        return String(r || "").trim().toUpperCase().replace(/\s+/g, "");
      };
      if(!vivo){ parar(); return; }
      setEstado({est:"lendo", msg:"", zoom:digital, flash:0, luz:lanterna});
      var laco = async function(){
        if(!vivo) return;
        try {
          var cod = await detectar(), agora = Date.now();
          if(cod && valido(cod)){
            // uma leitura basta (Code128 tem dígito de controle); o mesmo número só conta outra vez se sair da mira e voltar
            {
              if(cod !== ultimo.cod || agora - ultimo.ts > ENTRE_LEITURAS){
                ultimo = {cod:cod, ts:agora}; avisar();
                setEstado(function(x){ return Object.assign({}, x, {flash:agora}); });
                setTimeout(function(){ if(vivo) setEstado(function(x){ return Object.assign({}, x, {flash:0}); }); }, 700);
                lerRef.current(cod);
              } else ultimo.ts = agora;
            }
          } else previo = "";
        } catch(x){}
        if(vivo) timer = setTimeout(laco, 40);
      };
      laco();
    })();
    return parar;
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  return e("div",{className:"flex flex-col gap-1.5"},
    estado.est==="erro"
      ? e("p",{className:"rounded-xl bg-[#FEF3C7] px-3 py-2 text-[12.5px] font-bold text-[#92400E]"}, estado.msg)
      : e("div",{className:"relative overflow-hidden rounded-2xl bg-black", style:{aspectRatio:"4 / 3"}},
          e("video",{ref:ref, playsInline:true, muted:true, className:"absolute inset-0 size-full object-cover", style:{transform:"scale(" + (estado.zoom || 1) + ")"}}),
          e("div",{className:"pointer-events-none absolute inset-x-6 top-1/2 h-24 -translate-y-1/2 rounded-xl border-2 " + (estado.flash ? "border-[#22C55E]" : estado.est==="lendo" ? "border-white/90" : "border-white/40")}),
          e("p",{className:"absolute inset-x-0 bottom-2 px-3 text-center text-[12px] font-bold txt-branco"}, estado.est==="abrindo" ? "Abrindo a câmera..." : "Aponte para as listras da etiqueta · zoom 2x"+(estado.luz ? " · luz ligada" : "")+"")),
    e("button",{type:"button", onClick:p.aoFechar, className:"h-9 rounded-xl bg-[#F3F4F6] text-[12.5px] font-semibold text-[#374151]"}, "Fechar a câmera"));
}

export { LeitorCamera };
