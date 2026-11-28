// Sorelly Admin — mobile/leitor-camera.js
// Leitor de código de barras pela câmera do celular, para a conferência das peças (Marcus, 24/11/2026: "precisa ter a câmera para bipar; se não bipar, digita o código").
// Como lê: leitor nativo do navegador (BarcodeDetector, Chrome/Android) e, onde ele não existe (Safari do iPhone), o zxing-wasm (zxing-cpp compilado, bem mais rápido e firme que o zxing em JavaScript; gira a imagem sozinho, lê listras na vertical, e o arquivo .wasm baixa uma vez do jsdelivr).
// O número lido é o código de barras da etiqueta (campo aaa_codbarras da DevMaster, ex.: 00032358); quem recebe (aoLer) acha a peça por ele.
// 24/11/2026 (2): zoom 2x já ligado (da câmera, onde o aparelho deixa; senão digital), bip que toca de verdade, borda verde ao ler, e leitura só vale se vier igual em 2 quadros seguidos e com formato de código de peça.
// Segurança do uso: a imagem NÃO sai do aparelho e nada é gravado; só o número lido sobe para a conferência. A câmera desliga ao fechar a tela.
import { e, useEffect, useRef, useState } from "@/shared/react";

var FORMATOS = ["code_128", "code_39", "code_93", "ean_13", "ean_8", "upc_a", "upc_e", "itf", "codabar"];
var ENTRE_LEITURAS = 1000;   // ms: o mesmo número na mira não conta de novo antes disso (a peça só conta outra vez se sair da mira e voltar). 25/11/2026: era 1800; trocar rápido por outra peça igual não era lido

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
  var ref = useRef(null), st = useState({est:"abrindo", msg:"", zoom:1, flash:0, diag:""}), estado = st[0], setEstado = st[1];
  var tn = useState(false), tentou = tn[0], setTentou = tn[1], tt = useState(0), tentativa = tt[0], setTentativa = tt[1], trRef = useRef(null), lz = useState(true), luzOn = lz[0], setLuzOn = lz[1], fotoRef = useRef(null), fs = useState(""), fotoMsg = fs[0], setFotoMsg = fs[1];
  var lerRef = useRef(p.aoLer); lerRef.current = p.aoLer;
  useEffect(function(){
    var vivo = true, stream = null, timer = null, ultimo = {cod:"", ts:0}, previo = "", digital = 1, lanterna = false, zoomCam = false, dg = {n:0, ms:0, bruto:"", fmt:"", motor:"", t:0};
    function parar(){ vivo = false; if(timer) clearTimeout(timer); if(stream) stream.getTracks().forEach(function(t){ t.stop(); }); window.removeEventListener("pointerdown", audio); }
    window.addEventListener("pointerdown", audio); audio();
    (async function(){
      if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ setEstado({est:"erro", msg:"Este aparelho ou navegador não abre a câmera aqui. Digite o código da peça."}); return; }
      try { stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}, width:{ideal:2560}, height:{ideal:1440}}, audio:false}); }
      catch(x){ setEstado({est:"erro", msg: x && x.name==="NotAllowedError" ? "A câmera está bloqueada. Permita o uso da câmera para o app nas configurações do celular, ou digite o código." : "Não consegui abrir a câmera. Digite o código da peça."}); return; }
      if(!vivo){ parar(); return; }
      var v = ref.current; if(!v){ parar(); return; }
      // 24/11 (3): zoom 2x só onde a câmera faz zoom de verdade (Android). Onde não faz (iPhone) lê a imagem INTEIRA em resolução alta: o corte digital jogava pixels fora e obrigava a chegar bem perto.
      try {
        var tr = stream.getVideoTracks()[0], cap = tr.getCapabilities ? tr.getCapabilities() : {}, adv = [];
        if(cap.zoom && cap.zoom.max >= 2){ adv.push({zoom: Math.max(cap.zoom.min || 1, Math.min(2, cap.zoom.max))}); zoomCam = true; }
        if(cap.torch){ adv.push({torch:true}); lanterna = true; trRef.current = tr; }
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
          dg.motor = "nativo";
          detectarImg = async function(img){ var r = await det.detect(img); if(r && r[0]){ dg.fmt = r[0].format; return String(r[0].rawValue || ""); } return ""; };
        }
      } catch(x){ detectarImg = null; }
      if(!detectarImg){
        var zx; try { zx = await import("zxing-wasm/reader"); await zx.readBarcodes(new ImageData(8, 8), {formats:["Code128"]}); } catch(x){ setEstado({est:"erro", msg:"O leitor não carregou (" + String((x && x.message) || x).slice(0, 80) + "). Use Ler por foto ou digite o código."}); return; }
        var opc = {formats:["Code128","Code39","Code93","Codabar","ITF","EAN13","EAN8","UPCA","UPCE"], tryHarder:true, tryRotate:true, tryDownscale:true, tryInvert:true, maxNumberOfSymbols:1};
        dg.motor = "wasm";
        detectarImg = async function(img){ var d = img.getContext("2d", {willReadFrequently:true}).getImageData(0, 0, img.width, img.height); var r = await zx.readBarcodes(d, opc); if(r && r[0]){ dg.fmt = r[0].format; return String(r[0].text || ""); } return ""; };
        girar = false;   // o zxing-wasm já tenta a imagem girada
      }
      // Cada quadro: recorta o centro (zoom digital) e lê como está; em quadros alternados lê girado 90 graus (a tag do colar tem as listras na vertical).
      var detectar = async function(){
        if(!v.videoWidth) return "";
        volta++;
        var f = digital, w = Math.round(v.videoWidth / f), h = Math.round(v.videoHeight / f), k = Math.min(1, 1920 / w);   // k: reduz imagem grande para ler mais rápido
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
          var t0 = Date.now(), cod = await detectar(), agora = Date.now();
          dg.n++; dg.ms = agora - t0; if(cod) dg.bruto = cod + " (" + dg.fmt + ")";
          if(agora - dg.t > 500){ dg.t = agora; var tx = dg.motor + (lanterna ? " · luz ligada" : " · sem luz (o celular não deixa o site ligar)") + (zoomCam ? " · zoom 2x da câmera" : " · imagem inteira") + " · " + dg.n + " leituras · " + dg.ms + " ms" + (dg.bruto ? " · último: " + dg.bruto : " · nada na mira"); setEstado(function(x){ return Object.assign({}, x, {diag:tx}); }); }
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
  }, [tentativa]);   // eslint-disable-line react-hooks/exhaustive-deps
  // Ler por foto: abre a câmera do próprio celular (foco automático e foto inteira, bem mais nítida que o vídeo) e lê o código da foto.
  async function lerFoto(ev){
    var f = ev.target.files && ev.target.files[0]; ev.target.value = ""; if(!f) return;
    setFotoMsg("Lendo a foto...");
    try {
      var bm = await createImageBitmap(f), k = Math.min(1, 2200 / Math.max(bm.width, bm.height)), c = document.createElement("canvas");
      c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k);
      var cx = c.getContext("2d", {willReadFrequently:true}); cx.drawImage(bm, 0, 0, c.width, c.height);
      var zx = await import("zxing-wasm/reader");
      var r = await zx.readBarcodes(cx.getImageData(0, 0, c.width, c.height), {formats:["Code128","Code39","Code93","Codabar","ITF","EAN13","EAN8","UPCA","UPCE"], tryHarder:true, tryRotate:true, tryDownscale:true, tryInvert:true, maxNumberOfSymbols:1});
      var cod = r && r[0] ? String(r[0].text || "").trim().toUpperCase().replace(/s+/g, "") : "";
      if(cod){ avisar(); setFotoMsg("Li " + cod + " (" + r[0].format + ")"); lerRef.current(cod); }
      else setFotoMsg("Não achei código nessa foto. Chegue mais perto, com a etiqueta reta e bem iluminada, ou digite o código.");
    } catch(x){ setFotoMsg("Não consegui ler a foto. Digite o código da peça."); }
  }
  var canto = function(pos){ return e("i",{key:pos, className:"pointer-events-none absolute size-6 border-[#C9A13B] "+pos}); };
  var alternarLuz = function(){ var t = trRef.current; if(!t) return; var novo = !luzOn; setLuzOn(novo); try { t.applyConstraints({advanced:[{torch:novo}]}); } catch(x){} };
  // Com aoDesligar (conferência de devolução): câmera bloqueada ou indisponível recolhe a área sozinha e a bipagem manual segue liberada; o botão do grid vira "Ativar câmera".
  useEffect(function(){ if(estado.est==="erro" && p.aoDesligar) p.aoDesligar(); }, [estado.est]);   // eslint-disable-line react-hooks/exhaustive-deps
  if(estado.est==="erro" && p.aoDesligar) return null;
  return e("div",{className:"flex flex-col"},
    estado.est==="erro"
      ? e("div",{className:"flex flex-col gap-1"}, e("button",{type:"button", onClick:function(){ setTentou(true); setEstado({est:"abrindo", msg:"", zoom:1, flash:0, diag:""}); setTentativa(tentativa+1); }, className:"flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#C9A13B] text-[13px] font-semibold text-white"}, "Ativar câmera"), tentou && estado.msg && e("p",{className:"px-1 text-[11px] text-[#8A6A12]"}, estado.msg))
      : e("div",{className:"relative w-full overflow-hidden bg-[#222]", style:{height:"clamp(80px, 12vh, 100px)"}},
          e("video",{ref:ref, playsInline:true, muted:true, className:"absolute inset-0 size-full object-cover", style:{transform:"scale(" + (estado.zoom || 1) + ")"}}),
          e("div",{className:"pointer-events-none absolute inset-x-0 top-1/2 h-px "+(estado.flash ? "bg-[#22C55E]" : "bg-[#C9A13B]")}),
          (p.aoFechar || p.aoDesligar) && e("button",{type:"button", onClick:p.aoFechar || p.aoDesligar, "aria-label":"Fechar câmera", className:"absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-[13px] leading-none txt-branco"}, "×"),
          estado.luz && e("button",{type:"button", onClick:alternarLuz, "aria-label":"Lanterna", "aria-pressed":luzOn, className:"absolute bottom-1 left-1 grid size-6 place-items-center rounded-full bg-black/60 text-[13px] leading-none "+(luzOn ? "text-[#E8C766]" : "txt-branco")}, "☀"),
          e("button",{type:"button", onClick:function(){ if(fotoRef.current) fotoRef.current.click(); }, className:"absolute bottom-1 right-1 h-6 rounded-full bg-black/60 px-2 text-[11px] txt-branco"}, "Ler por foto"),
          fotoMsg && e("p",{className:"absolute inset-x-6 bottom-1 truncate rounded bg-black/70 px-2 text-center text-[11px] font-semibold txt-branco"}, fotoMsg)),
    e("input",{ref:fotoRef, type:"file", accept:"image/*", capture:"environment", className:"hidden", onChange:lerFoto}));
}

export { LeitorCamera };
