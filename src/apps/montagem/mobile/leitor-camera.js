// Sorelly Admin — mobile/leitor-camera.js
// Leitor de código de barras pela câmera do celular (Marcus, 24/11/2026: "precisa ter a câmera para bipar; se não bipar, digita o código").
// É a ÚNICA tecnologia de leitura do admin das representantes: peças que voltaram, brindes, peças do próximo mês e conferência do novo kit usam este arquivo.
// Como lê: leitor nativo do navegador (BarcodeDetector, Chrome/Android) e, onde ele não existe (Safari do iPhone), o zxing-wasm (zxing-cpp compilado; o .wasm baixa uma vez do jsdelivr).
// O número lido é o código de barras da etiqueta (campo aaa_codbarras da DevMaster, ex.: 00032358); quem recebe (aoLer) acha a peça por ele.
//
// 28/11/2026 (Marcus: "a leitura continua muito difícil no iPhone; identificar o gargalo técnico"). O gargalo NÃO era o intervalo entre leituras:
//   1) PIXELS POR LISTRA. A etiqueta é pequena. Com imagem de 1440 px de largura, a listra só fica legível a menos de 15 cm, mais perto do que a lente principal dos iPhones novos consegue focar.
//      Agora pede a maior imagem que o aparelho entrega (até 3840x2160) e confere o que veio de verdade (getSettings). Se vier imagem pequena, compensa com o zoom DA CÂMERA (pixels reais), nunca com corte digital.
//   2) ÁREA LIDA. O leitor processava a imagem INTEIRA (3,7 milhões de pontos), mas a tela só mostra uma faixa. Agora lê só a faixa que aparece, na resolução original: menos trabalho por quadro, mais quadros por segundo.
//   3) QUADROS. Um quadro novo só chega a cada 33 ms; esperar 8 ms relia o mesmo quadro. Agora cada quadro novo é lido uma vez (requestVideoFrameCallback) e nunca há duas leituras ao mesmo tempo.
//   4) LENTE. No iPhone com mais de uma câmera traseira, escolhe a câmera dupla grande-angular (o próprio aparelho troca para a lente que foca de perto). Nunca fica na ultra-angular nem na teleobjetiva.
//   5) LUZ. A lanterna não liga mais sozinha (o reflexo no metal e na etiqueta brilhante apaga as listras). O botão continua e a escolha vale enquanto o admin está aberto.
// Nada é presumido: o que o aparelho aplicou de verdade aparece no diagnóstico (segure o dedo 1 segundo sobre a imagem da câmera).
// Segurança do uso: a imagem NÃO sai do aparelho e nada é gravado; só o número lido sobe. A câmera e o som desligam ao sair da tela.
import { e, useEffect, useRef, useState } from "@/shared/react";

var ALTURA_CAMERA = 190;   // px no celular (28/11/2026, Marcus: era 144)
var FORMATOS = ["code_128", "code_39", "code_93", "ean_13", "ean_8", "upc_a", "upc_e", "itf", "codabar"];
var FORMATOS_ZX = ["Code128", "Code39", "Code93", "Codabar", "ITF", "EAN13", "EAN8", "UPCA", "UPCE"];
var OPC_ZX = {formats:FORMATOS_ZX, tryHarder:true, tryRotate:true, tryDownscale:false, tryInvert:false, maxNumberOfSymbols:1};   // sem inverter e sem reduzir: etiqueta é preta no branco e pequena; cada opção a menos é tempo a menos por quadro
var ENTRE_LEITURAS = 1000;   // ms: o mesmo número na mira não conta de novo antes disso (a peça só conta outra vez se sair da mira e voltar)
var MAX_PONTOS = 2600000;    // teto de pontos lidos por quadro, para não sobrecarregar o celular
var PEDIDO = {width:{ideal:3840}, height:{ideal:2160}, frameRate:{ideal:30}};

// Escolhas do aparelho (lente, zoom, luz): ficam só na memória, enquanto o admin está aberto. Nada é gravado no navegador nem no banco: são do aparelho, não do atendimento.
var PREF = {};
function lerPref(k, pad){ return k in PREF ? PREF[k] : pad; }
function gravarPref(k, v){ PREF[k] = String(v); }

// ── SOM ── O celular só toca depois de um toque na tela. O contexto de som é criado e destravado no PRIMEIRO toque em qualquer tela do admin (login, menu), não só na tela da câmera.
var AUDIO = null, DESTRAVADO = false;
function audio(){
  try {
    var AC = window.AudioContext || window.webkitAudioContext; if(!AC) return null;
    if(!AUDIO) AUDIO = new AC();
    if(AUDIO.state !== "running") AUDIO.resume();   // "suspended" ou "interrupted" (iPhone, depois de sair do Safari)
    return AUDIO;
  } catch(x){ return null; }
}
function destravar(){
  var a = audio(); if(!a || DESTRAVADO) return;
  try { var s = a.createBufferSource(); s.buffer = a.createBuffer(1, 1, 22050); s.connect(a.destination); s.start(0); DESTRAVADO = true; } catch(x){}
}
if(typeof window !== "undefined") ["pointerdown", "touchend", "keydown"].forEach(function(ev){ window.addEventListener(ev, destravar, {capture:true, passive:true}); });
// No iPhone o som do site fica mudo com a chave de silêncio. Enquanto a câmera está aberta o bip toca mesmo assim; ao sair volta ao normal.
function sessaoSom(on){ try { if(navigator.audioSession) navigator.audioSession.type = on ? "playback" : "auto"; } catch(x){} }
function tom(freq, ini, dur, vol){
  try {
    var a = audio(); if(!a) return;
    var o = a.createOscillator(), g = a.createGain(), t = a.currentTime + ini;
    o.type = "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
    g.gain.setValueAtTime(vol, t + dur - 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.01);
  } catch(x){}
}
function vibrar(v){ try { if(navigator.vibrate) navigator.vibrate(v); } catch(x){} }
// 28/11/2026 (Marcus): bip curto e fino, de leitor comercial. Sucesso = 1 bip de 70 ms em 2.350 Hz. Erro = 2 bips de 50 ms, mais baixos. Quem chama é a tela, só quando a peça foi (ou não foi) registrada.
function bipeOk(){ vibrar(40); tom(2350, 0, 0.07, 0.3); }
function bipeErro(){ vibrar([35, 45, 35]); tom(1250, 0, 0.05, 0.28); tom(1250, 0.11, 0.05, 0.28); }
// Vale número de barras com 7 a 13 dígitos (a DevMaster guarda 8) ou código de peça (CL2542, BB0531). Leitura torta (ex.: 6 dígitos) é descartada.
function valido(c){ return /^\d{7,13}$/.test(c) || /^[A-Z]{1,4}\d{3,6}$/.test(c); }

// ── LENTE ── O nome da câmera vem do aparelho (inglês ou português). Sem nome reconhecido, fica a câmera que o aparelho escolheu.
function tipoLente(l){
  l = String(l || "").toLowerCase();
  if(/tripl/.test(l)) return "tripla";
  if(/tele/.test(l)) return "tele";
  if(/(dual|dupl).*(wide|grande|ampla)|(wide|grande|ampla).*(dual|dupl)/.test(l)) return "duplaGA";
  if(/ultra|0[.,]5/.test(l)) return "ultra";
  if(/dual|dupl/.test(l)) return "dupla";
  return "normal";
}
function melhorLente(devs, atual){
  var tras = devs.filter(function(d){ return d.kind === "videoinput" && d.label && /back|rear|tras|environment/i.test(d.label); });
  if(tras.length < 2) return null;
  var por = function(t){ return tras.filter(function(d){ return tipoLente(d.label) === t; })[0] || null; };
  if(/camera\d* \d+/i.test(atual)){   // Android ("camera2 0, facing back"): a de número 0 é a principal
    var c0 = tras.filter(function(d){ return /camera\d* 0\b/i.test(d.label); })[0];
    return c0 && c0.label !== atual ? c0 : null;
  }
  var alvo = por("duplaGA") || por("tripla");
  if(alvo) return alvo.label === atual ? null : alvo;
  var ta = tipoLente(atual);
  return ta === "ultra" || ta === "tele" ? (por("normal") || por("dupla")) : null;
}
function pedir(extra){ return navigator.mediaDevices.getUserMedia({video:Object.assign({}, PEDIDO, extra), audio:false}); }
function fechar(st){ try { if(st) st.getTracks().forEach(function(t){ t.stop(); }); } catch(x){} }
// Abre a câmera traseira. A lente escolhida fica lembrada enquanto o admin está aberto ("padrao" = a do aparelho serve), para não abrir a câmera duas vezes a cada tela.
async function abrirCamera(){
  var salvo = lerPref("sorelly_cam_lente", ""), st = null;
  if(salvo && salvo !== "padrao"){ try { st = await pedir({deviceId:{exact:salvo}}); } catch(x){ st = null; salvo = ""; gravarPref("sorelly_cam_lente", ""); } }
  if(!st) st = await pedir({facingMode:{ideal:"environment"}});
  if(salvo) return st;
  var alvo = null;
  try { alvo = melhorLente(await navigator.mediaDevices.enumerateDevices(), (st.getVideoTracks()[0] || {}).label || ""); } catch(x){ alvo = null; }
  if(!alvo){ gravarPref("sorelly_cam_lente", "padrao"); return st; }
  fechar(st);   // o iPhone só deixa uma câmera aberta por vez
  var st2 = null;
  try {
    st2 = await pedir({deviceId:{exact:alvo.deviceId}});
    var t2 = st2.getVideoTracks()[0], c2 = t2.getCapabilities ? t2.getCapabilities() : {}, tp = tipoLente(alvo.label);
    if((tp === "duplaGA" || tp === "tripla") && !c2.zoom){ fechar(st2); st2 = null; }   // sem controle de zoom não dá para garantir que a câmera conjunta abre na lente principal
  } catch(x){ fechar(st2); st2 = null; }
  if(st2){ gravarPref("sorelly_cam_lente", alvo.deviceId); return st2; }
  gravarPref("sorelly_cam_lente", "padrao");
  return pedir({facingMode:{ideal:"environment"}});
}

function LeitorCamera(p){
  var ref = useRef(null), st = useState({est:"abrindo", msg:"", flash:0, luz:false, zoom:0}), estado = st[0], setEstado = st[1];
  var tn = useState(false), tentou = tn[0], setTentou = tn[1], tt = useState(0), tentativa = tt[0], setTentativa = tt[1], lz = useState(false), luzOn = lz[0], setLuzOn = lz[1], fotoRef = useRef(null), fs = useState(""), fotoMsg = fs[0], setFotoMsg = fs[1];
  var ctl = useRef({}), dgS = useState(""), diag = dgS[0], setDiag = dgS[1], verDiag = useRef(false), toque = useRef(null);
  var lerRef = useRef(p.aoLer); lerRef.current = p.aoLer;
  useEffect(function(){
    var vivo = true, stream = null, timer = null, quadro = 0, v = null, ultimo = {cod:"", ts:0}, previo = "", dg = {n:0, ms:0, bruto:"", fmt:"", motor:"", t:0, n0:0, fixo:"", area:""};
    function parar(){
      vivo = false; if(timer) clearTimeout(timer);
      try { if(v && quadro && v.cancelVideoFrameCallback) v.cancelVideoFrameCallback(quadro); } catch(x){}
      fechar(stream); try { if(v) v.srcObject = null; } catch(x){}
      document.removeEventListener("visibilitychange", aoVoltar); sessaoSom(false); ctl.current = {};
    }
    // Ao voltar para o Safari o iPhone pode ter encerrado a câmera: abre de novo sozinha.
    function aoVoltar(){
      if(document.hidden || !vivo) return;
      var t = stream && stream.getVideoTracks()[0];
      if(stream && (!t || t.readyState === "ended")){ setTentativa(function(n){ return n + 1; }); return; }
      try { if(v && v.paused) v.play(); } catch(x){}
    }
    document.addEventListener("visibilitychange", aoVoltar); sessaoSom(true); audio();
    (async function(){
      if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ setEstado({est:"erro", msg:"Este aparelho ou navegador não abre a câmera aqui. Digite o código da peça."}); return; }
      try { stream = await abrirCamera(); }
      catch(x){ setEstado({est:"erro", msg: x && x.name==="NotAllowedError" ? "A câmera está bloqueada. Permita o uso da câmera nas configurações do celular, ou digite o código." : "Não consegui abrir a câmera. Digite o código da peça."}); return; }
      if(!vivo){ parar(); return; }
      v = ref.current; if(!v){ parar(); return; }
      // ── Ajustes da câmera: só o que o aparelho diz que aceita (getCapabilities); depois confere o que ficou (getSettings) ──
      var tr = stream.getVideoTracks()[0], cap = {}, ajuste = {}, tp = tipoLente(tr.label), z = 1;
      try { cap = tr.getCapabilities ? (tr.getCapabilities() || {}) : {}; } catch(x){ cap = {}; }
      var cfgDe = function(){ try { return tr.getSettings ? (tr.getSettings() || {}) : {}; } catch(x){ return {}; } }, cfg0 = cfgDe();
      var aplicar = async function(c){   // os ajustes vão sempre juntos: mudar a luz não pode desfazer o zoom
        Object.assign(ajuste, c);
        try { await tr.applyConstraints({advanced:[Object.assign({}, ajuste)]}); } catch(x){ try { await tr.applyConstraints({advanced:[c]}); } catch(y){} }
        var s2 = cfgDe();
        if(c.zoom && s2.zoom && Math.abs(s2.zoom - c.zoom) > 0.05){ try { await tr.applyConstraints({zoom:{ideal:c.zoom}}); } catch(x){} s2 = cfgDe(); }
        if(cfg0.width && s2.width && s2.width < cfg0.width){ try { await tr.applyConstraints(Object.assign({}, PEDIDO, {advanced:[Object.assign({}, ajuste)]})); } catch(x){} }   // o ajuste não pode derrubar a resolução
      };
      if(cap.focusMode && cap.focusMode.indexOf("continuous") >= 0) await aplicar({focusMode:"continuous"});   // foco contínuo, onde o aparelho deixa escolher (no iPhone ele já é contínuo)
      // Câmera conjunta do iPhone: se o zoom mínimo for 1, o 1 é a ultra-angular e a lente principal é o 2.
      var fator = (tp === "duplaGA" || tp === "tripla") && cap.zoom && cap.zoom.min >= 1 ? 2 : 1;
      var passos = cap.zoom ? [1, 1.5, 2].filter(function(o){ return o * fator <= cap.zoom.max + 0.01; }) : [];
      if(cap.zoom){
        // Enquadramento natural (1x) quando a imagem é grande. Imagem pequena: zoom da câmera até dar pixels suficientes por listra. A representante pode trocar no botão; a escolha vale enquanto o admin está aberto.
        var lado = Math.min(cfg0.width || 0, cfg0.height || 0), zs = parseFloat(lerPref("sorelly_cam_zoom", ""));
        z = passos.indexOf(zs) >= 0 ? zs : (!lado || lado >= 1800 ? 1 : lado >= 1300 ? 1.5 : 2);
        while(z > 1 && passos.indexOf(z) < 0) z -= 0.5;
        await aplicar({zoom:Math.max(cap.zoom.min, z * fator)});
      }
      var lanterna = !!cap.torch, luz = lanterna && lerPref("sorelly_cam_luz", "0") === "1";
      if(luz) await aplicar({torch:true});
      if(!vivo){ parar(); return; }
      ctl.current = {
        zoom: async function(){ z = passos[(passos.indexOf(z) + 1) % passos.length] || 1; gravarPref("sorelly_cam_zoom", z); await aplicar({zoom:Math.max(cap.zoom.min, z * fator)}); fixar(); if(vivo) setEstado(function(x){ return Object.assign({}, x, {zoom:z}); }); },
        luz: async function(on){ gravarPref("sorelly_cam_luz", on ? "1" : "0"); await aplicar({torch:on}); fixar(); }
      };
      v.srcObject = stream; v.setAttribute("playsinline", "true"); v.muted = true;
      try { await v.play(); } catch(x){}
      var cv = document.createElement("canvas"), cx = cv.getContext("2d", {willReadFrequently:true}), cvG = document.createElement("canvas"), volta = 0, escala = 1, lento = 0, detectarImg, girar = true;
      try {
        if(window.BarcodeDetector){
          var sup = window.BarcodeDetector.getSupportedFormats ? await window.BarcodeDetector.getSupportedFormats() : FORMATOS;
          var det = new window.BarcodeDetector({formats: FORMATOS.filter(function(f){ return sup.indexOf(f) >= 0; })});
          dg.motor = "nativo";
          detectarImg = async function(img){ var r = await det.detect(img); if(r && r[0]){ dg.fmt = r[0].format; return String(r[0].rawValue || ""); } return ""; };
        }
      } catch(x){ detectarImg = null; }
      if(!detectarImg){
        var zx; try { zx = await import("zxing-wasm/reader"); await zx.readBarcodes(new ImageData(8, 8), {formats:["Code128"]}); } catch(x){ fechar(stream); stream = null; setEstado({est:"erro", msg:"O leitor não carregou (" + String((x && x.message) || x).slice(0, 80) + "). Use Ler por foto ou digite o código."}); return; }
        dg.motor = "zxing-cpp (wasm)";
        detectarImg = async function(img){ var r = await zx.readBarcodes(cx.getImageData(0, 0, img.width, img.height), OPC_ZX); if(r && r[0]){ dg.fmt = r[0].format; return String(r[0].text || ""); } return ""; };
        girar = false;   // o zxing-cpp já tenta a imagem girada (etiqueta com as listras na vertical)
      }
      // Diagnóstico: o que o aparelho entregou de verdade. Aparece ao segurar o dedo 1 segundo na imagem.
      var fixar = function(){
        var s2 = cfgDe();
        dg.fixo = dg.motor + " · " + (tr.label || "câmera sem nome") + " (" + tp + ")\n"
          + "imagem " + (s2.width || v.videoWidth) + "x" + (s2.height || v.videoHeight) + (s2.frameRate ? " a " + Math.round(s2.frameRate) + " qps" : "")
          + " · zoom " + (cap.zoom ? (s2.zoom != null ? s2.zoom : "?") + " (aceita " + cap.zoom.min + " a " + cap.zoom.max + ")" : "sem controle")
          + " · foco " + (s2.focusMode || "automático do aparelho") + (cap.focusDistance ? " (mín. " + cap.focusDistance.min + " m)" : "")
          + " · luz " + (lanterna ? (s2.torch ? "ligada" : "desligada") : "o aparelho não deixa o site ligar");
      };
      fixar();
      // Cada quadro novo: copia só a FAIXA QUE APARECE na tela, nos pixels originais da câmera, e lê uma vez.
      // A cada 3 quadros lê a mesma faixa na metade do tamanho: é barato e resolve o código que ficou grande ou sem foco por estar perto demais.
      var detectar = async function(){
        var vw = v.videoWidth, vh = v.videoHeight; if(!vw || !vh) return "";
        volta++;
        var cw = v.clientWidth || vw, ch = v.clientHeight || vh, esc = Math.max(cw / vw, ch / vh), w = Math.min(vw, Math.round(cw / esc)), h = Math.min(vh, Math.round(ch / esc));
        var k = Math.min(1, Math.sqrt(MAX_PONTOS / (w * h))) * escala * (volta % 3 === 0 ? 0.5 : 1), lw = Math.max(8, Math.round(w * k)), lh = Math.max(8, Math.round(h * k));
        if(cv.width !== lw) cv.width = lw; if(cv.height !== lh) cv.height = lh;
        cx.drawImage(v, Math.round((vw - w) / 2), Math.round((vh - h) / 2), w, h, 0, 0, lw, lh);
        dg.area = lw + "x" + lh;
        var alvo = cv;
        if(girar && volta % 2 === 0){
          cvG.width = lh; cvG.height = lw;
          var g = cvG.getContext("2d", {willReadFrequently:true}); g.translate(lh, 0); g.rotate(Math.PI / 2); g.drawImage(cv, 0, 0); alvo = cvG;
        }
        var r = await detectarImg(alvo);
        return String(r || "").trim().toUpperCase().replace(/\s+/g, "");
      };
      if(!vivo){ parar(); return; }
      setLuzOn(luz); setEstado({est:"lendo", msg:"", flash:0, luz:lanterna, zoom:passos.length > 1 ? z : 0});
      var agendar = function(){
        if(!vivo) return;
        if(v.requestVideoFrameCallback && !document.hidden) quadro = v.requestVideoFrameCallback(passo);   // chama só quando existe quadro NOVO
        else timer = setTimeout(passo, document.hidden ? 400 : 40);
      };
      var passo = async function(){
        quadro = 0; if(!vivo) return;
        if(!document.hidden && v.readyState >= 2){
          try {
            var t0 = performance.now(), cod = await detectar(), agora = Date.now(); if(!vivo) return;
            dg.n++; dg.ms = Math.round(performance.now() - t0); if(cod) dg.bruto = cod + " (" + dg.fmt + ")";
            // aparelho lento: diminui um pouco a imagem lida, até 60%
            if(dg.ms > 160) lento++; else if(lento) lento--;
            if(lento > 8 && escala > 0.6){ escala = Math.round((escala - 0.1) * 10) / 10; lento = 0; }
            if(agora - dg.t > 1000){
              var lps = Math.round((dg.n - dg.n0) * 1000 / (agora - dg.t)); dg.t = agora; dg.n0 = dg.n;
              if(verDiag.current) setDiag(dg.fixo + "\nárea lida " + dg.area + (escala < 1 ? " (" + Math.round(escala * 100) + "%)" : "") + " · " + dg.ms + " ms · " + lps + " leituras/s · " + (dg.bruto ? "último " + dg.bruto : "nada lido ainda"));
            }
            if(cod && valido(cod)){
              // Code 128 e EAN têm dígito de controle: uma leitura basta. Formato sem controle (ITF, Code 39, Codabar) só vale se vier igual em 2 quadros seguidos.
              var fraco = /itf|39|codabar/i.test(dg.fmt), firme = !fraco || previo === cod; previo = cod;
              if(firme){
                if(cod !== ultimo.cod || agora - ultimo.ts > ENTRE_LEITURAS){
                  ultimo = {cod:cod, ts:agora}; if(!p.semBip) bipeOk();
                  setEstado(function(x){ return Object.assign({}, x, {flash:agora}); });
                  setTimeout(function(){ if(vivo) setEstado(function(x){ return Object.assign({}, x, {flash:0}); }); }, 600);
                  lerRef.current(cod);
                } else ultimo.ts = agora;   // a mesma etiqueta parada na mira: não conta nem toca de novo
              }
            } else if(!cod) previo = "";
          } catch(x){}
        }
        agendar();
      };
      agendar();
    })();
    return parar;
  }, [tentativa]);   // eslint-disable-line react-hooks/exhaustive-deps
  // Ler por foto: abre a câmera do próprio celular (foco automático e foto inteira, bem mais nítida que o vídeo) e lê o código da foto.
  async function lerFoto(ev){
    var f = ev.target.files && ev.target.files[0]; ev.target.value = ""; if(!f) return;
    setFotoMsg("Lendo a foto...");
    try {
      var bm = await createImageBitmap(f), k = Math.min(1, 2600 / Math.max(bm.width, bm.height)), c = document.createElement("canvas");
      c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k);
      var cx = c.getContext("2d", {willReadFrequently:true}); cx.drawImage(bm, 0, 0, c.width, c.height);
      var zx = await import("zxing-wasm/reader");
      var r = await zx.readBarcodes(cx.getImageData(0, 0, c.width, c.height), Object.assign({}, OPC_ZX, {tryDownscale:true, tryInvert:true}));
      var cod = r && r[0] ? String(r[0].text || "").trim().toUpperCase().replace(/\s+/g, "") : "";
      if(cod){ if(!p.semBip) bipeOk(); setFotoMsg("Li " + cod); lerRef.current(cod); setTimeout(function(){ setFotoMsg(""); }, 2500); }
      else setFotoMsg("Não achei código nessa foto.");
    } catch(x){ setFotoMsg("Não consegui ler a foto. Digite o código."); }
  }
  var alternarLuz = function(){ if(!ctl.current.luz) return; var novo = !luzOn; setLuzOn(novo); ctl.current.luz(novo); };
  var soltar = function(){ if(toque.current){ clearTimeout(toque.current); toque.current = null; } };
  var segurar = function(ev){ if(ev.target && ev.target.closest && ev.target.closest("button")) return; soltar(); toque.current = setTimeout(function(){ verDiag.current = !verDiag.current; setDiag(verDiag.current ? "Lendo o aparelho..." : ""); }, 1000); };
  useEffect(function(){ return soltar; }, []);
  // Com aoDesligar (telas de bipagem): câmera bloqueada ou indisponível recolhe a área sozinha e a bipagem manual segue liberada.
  useEffect(function(){ if(estado.est==="erro" && p.aoDesligar) p.aoDesligar(); }, [estado.est]);   // eslint-disable-line react-hooks/exhaustive-deps
  if(estado.est==="erro" && p.aoDesligar) return null;
  var BOLA = "absolute grid h-6 min-w-6 place-items-center rounded-full bg-black/60 px-1 text-[13px] leading-none ";
  return e("div",{className:"flex shrink-0 flex-col"},
    estado.est==="erro"
      ? e("div",{className:"flex flex-col gap-1"}, e("button",{type:"button", onClick:function(){ setTentou(true); setEstado({est:"abrindo", msg:"", flash:0, luz:false, zoom:0}); setTentativa(tentativa+1); }, className:"flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#C9A13B] text-[13px] font-semibold text-white"}, "Ativar câmera"), tentou && estado.msg && e("p",{className:"px-1 text-[11px] text-[#8A6A12]"}, estado.msg))
      : e("div",{className:"relative w-full select-none overflow-hidden bg-[#222]", style:{height:(p.altura ? p.altura+"px" : "clamp(80px, 12vh, 100px)"), WebkitTouchCallout:"none"}, onPointerDown:segurar, onPointerUp:soltar, onPointerLeave:soltar, onPointerCancel:soltar, onContextMenu:function(ev){ ev.preventDefault(); }},
          e("video",{ref:ref, playsInline:true, muted:true, className:"absolute inset-0 size-full object-cover"}),
          e("div",{className:"pointer-events-none absolute inset-x-0 top-1/2 h-px "+(estado.flash ? "bg-[#22C55E]" : "bg-[#C9A13B]")}),
          (p.aoFechar || p.aoDesligar) && e("button",{type:"button", onClick:p.aoFechar || p.aoDesligar, "aria-label":"Fechar câmera", className:BOLA+"right-1 top-1 txt-branco"}, "×"),
          estado.luz && e("button",{type:"button", onClick:alternarLuz, "aria-label":"Lanterna", "aria-pressed":luzOn, className:BOLA+"bottom-1 left-1 "+(luzOn ? "text-[#E8C766]" : "txt-branco")}, "☀"),
          estado.zoom>0 && e("button",{type:"button", onClick:function(){ if(ctl.current.zoom) ctl.current.zoom(); }, "aria-label":"Zoom da câmera", className:BOLA+"bottom-1 txt-branco "+(estado.luz ? "left-8" : "left-1")}, String(estado.zoom).replace(".", ",")+"x"),
          e("button",{type:"button", onClick:function(){ if(fotoRef.current) fotoRef.current.click(); }, className:"absolute bottom-1 right-1 h-6 rounded-full bg-black/60 px-2 text-[11px] txt-branco"}, "Ler por foto"),
          fotoMsg && e("p",{className:"pointer-events-none absolute inset-x-16 bottom-1 rounded bg-black/70 px-2 text-center text-[11px] font-semibold txt-branco"}, fotoMsg),
          diag && e("p",{className:"pointer-events-none absolute inset-x-1 top-1 whitespace-pre-line rounded bg-black/75 px-2 py-1 text-left text-[11px] leading-tight txt-branco"}, diag)),
    e("input",{ref:fotoRef, type:"file", accept:"image/*", capture:"environment", className:"hidden", onChange:lerFoto}));
}

export { LeitorCamera, ALTURA_CAMERA, bipeOk, bipeErro };
