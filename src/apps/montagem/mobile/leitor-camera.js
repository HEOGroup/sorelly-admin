// Sorelly Admin — mobile/leitor-camera.js
// Leitor de código de barras pela câmera do celular, para a conferência das peças (Marcus, 24/11/2026: "precisa ter a câmera para bipar; se não bipar, digita o código").
// Como lê: usa o leitor nativo do navegador (BarcodeDetector, Chrome/Android) e, onde ele não existe (Safari do iPhone), carrega a biblioteca @zxing/library só nessa hora.
// O número lido é o código de barras da etiqueta (campo aaa_codbarras da DevMaster, ex.: 00032358); quem recebe (aoLer) acha a peça por ele.
// Segurança do uso: a imagem NÃO sai do aparelho e nada é gravado; só o número lido sobe para a conferência. A câmera desliga ao fechar a tela.
import { e, useEffect, useRef, useState } from "@/shared/react";

var FORMATOS = ["code_128", "code_39", "code_93", "ean_13", "ean_8", "upc_a", "upc_e", "itf", "codabar"];
var ENTRE_LEITURAS = 1800;   // ms: o mesmo número na mira não conta de novo antes disso (a peça só conta outra vez se sair da mira e voltar)

// bip curto + vibração a cada leitura
function avisar(){
  try { if(navigator.vibrate) navigator.vibrate(60); } catch(x){}
  try {
    var AC = window.AudioContext || window.webkitAudioContext; if(!AC) return;
    var a = new AC(), o = a.createOscillator(), g = a.createGain();
    o.frequency.value = 880; g.gain.value = 0.08; o.connect(g); g.connect(a.destination); o.start();
    setTimeout(function(){ try { o.stop(); a.close(); } catch(x){} }, 90);
  } catch(x){}
}

function LeitorCamera(p){
  var ref = useRef(null), st = useState({est:"abrindo", msg:""}), estado = st[0], setEstado = st[1];
  var lerRef = useRef(p.aoLer); lerRef.current = p.aoLer;
  useEffect(function(){
    var vivo = true, stream = null, timer = null, ultimo = {cod:"", ts:0};
    function parar(){ vivo = false; if(timer) clearTimeout(timer); if(stream) stream.getTracks().forEach(function(t){ t.stop(); }); }
    (async function(){
      if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ setEstado({est:"erro", msg:"Este aparelho ou navegador não abre a câmera aqui. Digite o código da peça."}); return; }
      try { stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}, width:{ideal:1280}, height:{ideal:720}}, audio:false}); }
      catch(x){ setEstado({est:"erro", msg: x && x.name==="NotAllowedError" ? "A câmera está bloqueada. Permita o uso da câmera para o app nas configurações do celular, ou digite o código." : "Não consegui abrir a câmera. Digite o código da peça."}); return; }
      if(!vivo){ parar(); return; }
      var v = ref.current; if(!v){ parar(); return; }
      v.srcObject = stream; v.setAttribute("playsinline", "true"); v.muted = true;
      try { await v.play(); } catch(x){}
      var detectar;
      try {
        if(window.BarcodeDetector){
          var sup = window.BarcodeDetector.getSupportedFormats ? await window.BarcodeDetector.getSupportedFormats() : FORMATOS;
          var det = new window.BarcodeDetector({formats: FORMATOS.filter(function(f){ return sup.indexOf(f)>=0; })});
          detectar = async function(){ var r = await det.detect(v); return r && r[0] ? String(r[0].rawValue || "") : ""; };
        }
      } catch(x){ detectar = null; }
      if(!detectar){
        var lib = await import("@zxing/library");
        var hints = new Map();
        hints.set(lib.DecodeHintType.POSSIBLE_FORMATS, [lib.BarcodeFormat.CODE_128, lib.BarcodeFormat.CODE_39, lib.BarcodeFormat.CODE_93, lib.BarcodeFormat.EAN_13, lib.BarcodeFormat.EAN_8, lib.BarcodeFormat.UPC_A, lib.BarcodeFormat.ITF, lib.BarcodeFormat.CODABAR]);
        hints.set(lib.DecodeHintType.TRY_HARDER, true);
        var leitor = new lib.MultiFormatReader(); leitor.setHints(hints);
        var cv = document.createElement("canvas"), cvG = document.createElement("canvas"), volta = 0;
        // A biblioteca só lê listras na horizontal; a tag do colar tem as listras na vertical. Por isso, a cada quadro ela tenta a imagem como está e, no quadro seguinte, girada 90 graus.
        detectar = async function(){
          if(!v.videoWidth) return "";
          volta++;
          var alvo = cv;
          cv.width = v.videoWidth; cv.height = v.videoHeight; cv.getContext("2d", {willReadFrequently:true}).drawImage(v, 0, 0);
          if(volta%2===0){
            cvG.width = v.videoHeight; cvG.height = v.videoWidth;
            var g = cvG.getContext("2d", {willReadFrequently:true}); g.translate(cvG.width, 0); g.rotate(Math.PI/2); g.drawImage(cv, 0, 0); alvo = cvG;
          }
          try { return leitor.decode(new lib.BinaryBitmap(new lib.HybridBinarizer(new lib.HTMLCanvasElementLuminanceSource(alvo)))).getText(); } catch(x){ return ""; }
        };
      }
      if(!vivo){ parar(); return; }
      setEstado({est:"lendo", msg:""});
      var laco = async function(){
        if(!vivo) return;
        try {
          var cod = await detectar(), agora = Date.now();
          if(cod && (cod!==ultimo.cod || agora-ultimo.ts>ENTRE_LEITURAS)){ ultimo = {cod:cod, ts:agora}; avisar(); lerRef.current(cod); }
          else if(cod) ultimo.ts = agora;   // continua na mira: segura a trava
        } catch(x){}
        if(vivo) timer = setTimeout(laco, 160);
      };
      laco();
    })();
    return parar;
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  return e("div",{className:"flex flex-col gap-1.5"},
    estado.est==="erro"
      ? e("p",{className:"rounded-xl bg-[#FEF3C7] px-3 py-2 text-[12.5px] font-bold text-[#92400E]"}, estado.msg)
      : e("div",{className:"relative overflow-hidden rounded-2xl bg-black", style:{aspectRatio:"4 / 3"}},
          e("video",{ref:ref, playsInline:true, muted:true, className:"absolute inset-0 size-full object-cover"}),
          e("div",{className:"pointer-events-none absolute inset-x-6 top-1/2 h-24 -translate-y-1/2 rounded-xl border-2 "+(estado.est==="lendo" ? "border-white/90" : "border-white/40")}),
          e("p",{className:"absolute inset-x-0 bottom-2 px-3 text-center text-[12px] font-bold txt-branco"}, estado.est==="abrindo" ? "Abrindo a câmera..." : "Aponte para as listras da etiqueta")),
    e("button",{type:"button", onClick:p.aoFechar, className:"h-9 rounded-xl bg-[#F3F4F6] text-[12.5px] font-semibold text-[#374151]"}, "Fechar a câmera"));
}

export { LeitorCamera };
