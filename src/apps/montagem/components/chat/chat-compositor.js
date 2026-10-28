// Sorelly Admin · montagem — components/chat/chat-compositor.js
// Barra de escrever do SorellyChat: texto (Enter envia, Shift+Enter quebra linha), emojis, @menção, anexos com pré-visualização, câmera e gravação de áudio.
import { corrigirTexto, corrigirUltima } from "@/apps/montagem/lib/corretor";
import { api, euAgora, guardarMidia } from "@/apps/montagem/domain/chat-store";
import { contato, sem } from "@/apps/montagem/domain/chat-contatos";
import { tocar } from "@/apps/montagem/lib/sons";
import { Avatar, Ph, W, Janela, Popover, ItemMenu, duracao, tamanho } from "@/apps/montagem/components/chat/chat-ui";
import { e, useEffect, useRef, useState } from "@/shared/react";

var EMOJIS = "😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 😉 😍 🥰 😘 😋 😎 🤩 🥳 😏 😌 😴 🤔 🙄 😬 😢 😭 😤 😡 🥺 😱 🤗 🙏 👍 👎 👏 🙌 💪 🤝 ✌️ 👌 🤞 ❤️ 🧡 💛 💚 💙 💜 🖤 💔 ✨ ⭐ 🔥 💯 ✅ ❌ ⚠️ 📌 📎 📷 🎉 🎁 💍 💎 👑 🛍️ 📦 🚚 💰 📈 ☀️ 🌹 🌸".split(" ");

function lerArquivo(f){ return new Promise(function(ok, falha){ var r = new FileReader(); r.onload = function(){ ok(r.result); }; r.onerror = falha; r.readAsDataURL(f); }); }
// foto reduzida (1280 px) para não pesar
function reduzirImagem(url){
  return new Promise(function(ok){ var im = new Image(); im.onload = function(){
    var m = 1280, k = Math.min(1, m/Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width*k); c.height = Math.round(im.height*k);
    c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL("image/jpeg", 0.82)); };
    im.onerror = function(){ ok(url); }; im.src = url; });
}
function tipoDe(f){ return /^image\//.test(f.type) ? "imagem" : "arquivo"; }

function Camera(p){
  var v = useRef(null), st = useRef(null), er = useState(null), erro = er[0], setErro = er[1];
  useEffect(function(){
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ setErro("Este navegador não permite usar a câmera."); return; }
    navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}, audio:false}).then(function(s){ st.current = s; if(v.current){ v.current.srcObject = s; v.current.play().catch(function(){}); } })
      .catch(function(){ tocar("erro"); setErro("Não consegui abrir a câmera. Libere o acesso no navegador e tente de novo."); });
    return function(){ if(st.current) st.current.getTracks().forEach(function(t){ t.stop(); }); };
  }, []);
  var tirar = function(){ var el = v.current; if(!el || !el.videoWidth) return; var c = document.createElement("canvas"); c.width = el.videoWidth; c.height = el.videoHeight; c.getContext("2d").drawImage(el, 0, 0);
    p.foto(c.toDataURL("image/jpeg", 0.85)); p.fechar(); };
  return e(Janela,{titulo:"Câmera", fechar:p.fechar, largura:520},
    erro ? e("p",{className:"p-6 text-center text-[13px]", style:{color:W.vermelho}}, erro) :
      e("div",{className:"flex flex-col items-center gap-3 p-3"}, e("video",{ref:v, playsInline:true, muted:true, className:"w-full rounded-lg bg-black"}),
        e("button",{onClick:tirar, className:"grid size-14 place-items-center rounded-full text-white", style:{background:W.verde}, "aria-label":"Tirar foto"}, e(Ph,{n:"camera", s:26, fill:true}))));
}

function Compositor(p){
  var eu = p.eu, conv = p.conv;
  var tx = useState(""), texto = tx[0], setTexto = tx[1];
  var mc = useState([]), mencoes = mc[0], setMencoes = mc[1];
  var sg = useState(null), sug = sg[0], setSug = sg[1];            // {lista, i}
  var an = useState([]), anexos = an[0], setAnexos = an[1];
  var ge = useState(false), emoji = ge[0], setEmoji = ge[1];
  var gm = useState(false), menuAnexo = gm[0], setMenuAnexo = gm[1];
  var cm = useState(false), camera = cm[0], setCamera = cm[1];
  var gr = useState(null), grav = gr[0], setGrav = gr[1];          // {ms, pausado}
  var er = useState(null), erro = er[0], setErro = er[1];
  var ta = useRef(null), fotoIn = useRef(null), docIn = useRef(null), rec = useRef(null);

  // abrir uma conversa nova limpa o rascunho; editar uma mensagem põe o texto dela na caixa
  useEffect(function(){ setTexto(p.editando ? p.editando.texto : ""); setMencoes([]); setSug(null); if(ta.current) ta.current.focus(); }, [p.editando && p.editando.id]);
  useEffect(function(){ setTexto(""); setMencoes([]); setAnexos([]); setSug(null); setEmoji(false); cancelarGravacao(); setErro(null); }, [conv.id]);
  useEffect(function(){ return function(){ cancelarGravacao(); }; }, []);
  useEffect(function(){ var el = ta.current; if(el){ el.style.height = "auto"; el.style.height = Math.min(140, el.scrollHeight)+"px"; } }, [texto]);

  var membros = conv.membros.filter(function(id){ return id!==eu; }).map(contato);
  var mudou = function(ev){
    var v = ev.target.value, pos = ev.target.selectionStart;
    // corretor automático: ao digitar espaço ou pontuação no fim do texto, corrige a palavra anterior ("vc" vira "você")
    if(pos===v.length && v.length>texto.length){ var cv = corrigirUltima(v); if(cv!==v){ v = cv; pos = v.length; } }
    setTexto(v);
    var m = /(^|\s)@([^\s@]*)$/.exec(v.slice(0,pos));
    if(m){ var q = sem(m[2]); var l = membros.filter(function(c){ return !q || sem(c.completo).indexOf(q)>=0 || sem(c.nome).indexOf(q)>=0; }).slice(0,6); setSug(l.length ? {lista:l, i:0} : null); } else setSug(null);
  };
  var escolherMencao = function(c){
    var el = ta.current, pos = el.selectionStart, antes = texto.slice(0,pos).replace(/@([^\s@]*)$/, "@"+c.nome+" "), novo = antes + texto.slice(pos);
    setTexto(novo); setMencoes(mencoes.indexOf(c.id)>=0 ? mencoes : mencoes.concat([c.id])); setSug(null);
    setTimeout(function(){ el.focus(); el.setSelectionRange(antes.length, antes.length); }, 0);
  };
  var teclas = function(ev){
    if(sug){
      if(ev.key==="ArrowDown"){ ev.preventDefault(); setSug({lista:sug.lista, i:(sug.i+1)%sug.lista.length}); return; }
      if(ev.key==="ArrowUp"){ ev.preventDefault(); setSug({lista:sug.lista, i:(sug.i+sug.lista.length-1)%sug.lista.length}); return; }
      if(ev.key==="Enter" || ev.key==="Tab"){ ev.preventDefault(); escolherMencao(sug.lista[sug.i]); return; }
      if(ev.key==="Escape"){ ev.preventDefault(); setSug(null); return; }
    }
    if(ev.key==="Escape"){ if(emoji){ setEmoji(false); } else if(p.editando){ p.cancelarEdicao(); } else if(p.resp){ p.cancelarResp(); } return; }
    if(ev.key==="Enter" && !ev.shiftKey){ ev.preventDefault(); enviar(); }
  };
  var enviarMsg = function(o){ if(p.dirResp) o.porDir = euAgora(); return api.sendMessage(o); };
  var enviar = function(){
    var t = corrigirTexto(texto.trim());
    if(p.editando){ if(t && t!==p.editando.texto){ api.editMessage(conv.id, p.editando.id, t); tocar("enviar"); } p.cancelarEdicao(); return; }
    if(!t && !anexos.length) return;
    var ms = mencoes.filter(function(id){ return t.indexOf("@"+contato(id).nome)>=0; });
    if(anexos.length){
      anexos.forEach(function(a, i){ enviarMsg({conv:conv.id, eu:eu, aba:p.aba, tipo:a.tipo, texto:i===0 ? t : "", mencoes:i===0 ? ms : [], resp:i===0 && p.resp ? p.resp.id : null, midia:{key:guardarMidia(a.url), nome:a.nome, tam:a.tam, mime:a.mime}}); });
      setAnexos([]);
    } else enviarMsg({conv:conv.id, eu:eu, aba:p.aba, texto:t, mencoes:ms, resp:p.resp ? p.resp.id : null});
    setTexto(""); setMencoes([]); setSug(null); setEmoji(false); if(p.resp) p.cancelarResp();
  };
  var addArquivos = function(lista){
    Array.prototype.slice.call(lista).forEach(function(f){
      if(f.size > 25*1048576){ tocar("erro"); setErro("\""+f.name+"\" é maior que 25 MB."); return; }
      lerArquivo(f).then(function(url){ return tipoDe(f)==="imagem" ? reduzirImagem(url) : url; }).then(function(url){
        setAnexos(function(a){ return a.concat([{url:url, tipo:tipoDe(f), nome:f.name, tam:f.size, mime:f.type||"application/octet-stream"}]); }); setErro(null);
      }).catch(function(){ tocar("erro"); setErro("Não consegui ler \""+f.name+"\"."); });
    });
  };
  var addFotoCamera = function(url){ setAnexos(function(a){ return a.concat([{url:url, tipo:"imagem", nome:"foto-"+Date.now()+".jpg", tam:Math.round(url.length*0.75), mime:"image/jpeg"}]); }); };

  // ---- gravação de áudio ----
  function cancelarGravacao(){
    var r = rec.current; if(!r) return; clearInterval(r.timer);
    try{ r.mr.onstop = null; if(r.mr.state!=="inactive") r.mr.stop(); }catch(x){} r.stream.getTracks().forEach(function(t){ t.stop(); }); rec.current = null; setGrav(null);
  }
  var gravar = function(){
    if(!navigator.mediaDevices || !window.MediaRecorder){ tocar("erro"); setErro("Este navegador não permite gravar áudio."); return; }
    navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
      var mr = new MediaRecorder(stream), r = {mr:mr, stream:stream, chunks:[], acum:0, ini:Date.now(), pausado:false, timer:null};
      mr.ondataavailable = function(ev){ if(ev.data && ev.data.size) r.chunks.push(ev.data); };
      r.timer = setInterval(function(){ setGrav({ms:r.acum + (r.pausado ? 0 : Date.now()-r.ini), pausado:r.pausado}); }, 200);
      rec.current = r; mr.start(); setGrav({ms:0, pausado:false}); setErro(null);
    }).catch(function(){ tocar("erro"); setErro("Não consegui usar o microfone. Libere o acesso no navegador e tente de novo."); });
  };
  var pausarGravacao = function(){
    var r = rec.current; if(!r) return;
    if(r.pausado){ r.mr.resume(); r.ini = Date.now(); r.pausado = false; } else { r.mr.pause(); r.acum += Date.now()-r.ini; r.pausado = true; }
    setGrav({ms:r.acum + (r.pausado ? 0 : Date.now()-r.ini), pausado:r.pausado});
  };
  var enviarAudio = function(){
    var r = rec.current; if(!r) return; var dur = r.acum + (r.pausado ? 0 : Date.now()-r.ini); clearInterval(r.timer);
    r.mr.onstop = function(){
      var blob = new Blob(r.chunks, {type:r.mr.mimeType || "audio/webm"}); r.stream.getTracks().forEach(function(t){ t.stop(); });
      lerArquivo(blob).then(function(url){ enviarMsg({conv:conv.id, eu:eu, aba:p.aba, tipo:"audio", resp:p.resp ? p.resp.id : null, midia:{key:guardarMidia(url), dur:dur, mime:blob.type}}); if(p.resp) p.cancelarResp(); });
    };
    rec.current = null; setGrav(null); try{ r.mr.stop(); }catch(x){}
  };

  if(p.somenteLeitura) return e("div",{className:"px-4 py-3 text-center text-[12px]", style:{background:W.cab, color:W.sec}}, e(Ph,{n:"eye", s:15, className:"mr-1.5 align-middle"}), "Visão da Direção: você está lendo uma conversa de outras pessoas (somente leitura).");
  if(!conv.membros.includes(eu)) return null;

  var temTexto = texto.trim().length>0 || anexos.length>0;
  return e("div",{className:"relative", style:{background:W.fundo}},
    // aviso de erro
    erro && e("div",{className:"flex items-center gap-2 px-4 py-2 text-[12px]", style:{background:"#3b1f24", color:"#ffb4bd"}}, e(Ph,{n:"warning", s:16}), e("span",{className:"flex-1"}, erro), e("button",{onClick:function(){ setErro(null); }, "aria-label":"Fechar aviso"}, e(Ph,{n:"x", s:14}))),
    // respondendo / editando
    (p.resp || p.editando) && e("div",{className:"flex items-center gap-3 px-3 pt-2"},
      e("div",{className:"min-w-0 flex-1 rounded-lg border-l-4 px-3 py-1.5 text-[12px]", style:{background:"#1a252c", borderColor:p.editando ? W.ouro : W.verde}},
        e("p",{className:"font-semibold", style:{color:p.editando ? W.ouro : W.verde}}, p.editando ? "Editando mensagem" : contato(p.resp.de).nome),
        e("p",{className:"truncate", style:{color:W.sec}}, p.editando ? p.editando.texto : p.resp.previa)),
      e("button",{onClick:p.editando ? p.cancelarEdicao : p.cancelarResp, "aria-label":"Cancelar"}, e(Ph,{n:"x", s:18, style:{color:W.sec}}))),
    // anexos prontos para enviar
    anexos.length>0 && e("div",{className:"flex flex-wrap gap-2 px-3 pt-2"}, anexos.map(function(a, i){
      return e("div",{key:i, className:"relative overflow-hidden rounded-lg", style:{background:"#1a252c", border:"1px solid "+W.borda}},
        a.tipo==="imagem" ? e("img",{src:a.url, alt:"", className:"h-24 w-24 object-cover"}) :
          e("div",{className:"flex h-24 w-36 flex-col items-center justify-center gap-1 px-2 text-center", style:{color:W.texto}}, e(Ph,{n:/pdf/.test(a.mime) ? "file-pdf" : /sheet|excel|csv/.test(a.mime+a.nome) ? "file-xls" : "file-text", s:30, fill:true, style:{color:W.verde}}),
            e("span",{className:"w-full truncate text-[10.5px]"}, a.nome), e("span",{className:"text-[9.5px]", style:{color:W.sec}}, tamanho(a.tam))),
        e("button",{onClick:function(){ setAnexos(anexos.filter(function(_, j){ return j!==i; })); }, "aria-label":"Remover anexo", className:"absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/70"}, e(Ph,{n:"x", s:13}))); })),
    // sugestões de @
    sug && e("div",{className:"absolute bottom-full left-3 z-50 mb-1 w-72 overflow-hidden rounded-lg shadow-2xl", style:{background:W.cab, border:"1px solid "+W.borda}},
      sug.lista.map(function(c, i){ return e("button",{key:c.id, onMouseDown:function(ev){ ev.preventDefault(); escolherMencao(c); },
        className:"flex w-full items-center gap-2.5 px-3 py-2 text-left", style:{background:i===sug.i ? W.sel : "transparent"}},
        e(Avatar,{id:c.id, s:30}), e("span",{className:"min-w-0 flex-1"}, e("span",{className:"block truncate text-[13px]"}, c.nome), e("span",{className:"block truncate text-[10.5px]", style:{color:W.sec}}, c.setor))); })),
    // emojis
    emoji && e("div",{className:"absolute bottom-full left-2 z-50 mb-1 grid w-72 grid-cols-8 gap-0.5 rounded-lg p-2 shadow-2xl", style:{background:W.cab, border:"1px solid "+W.borda}},
      EMOJIS.map(function(m){ return e("button",{key:m, onClick:function(){ setTexto(texto+m); if(ta.current) ta.current.focus(); }, className:"grid size-8 place-items-center rounded text-[18px] hover:bg-white/10"}, m); })),
    grav ? e("div",{className:"flex items-center gap-3 px-3 py-2.5"},
      e("button",{onClick:cancelarGravacao, "aria-label":"Descartar gravação", className:"grid size-10 place-items-center rounded-full hover:bg-white/10"}, e(Ph,{n:"trash", s:22, style:{color:W.sec}})),
      e("div",{className:"flex flex-1 items-center gap-3 rounded-full px-4 py-2", style:{background:W.campo}},
        e("span",{className:"size-3 rounded-full "+(grav.pausado ? "" : "animate-pulse"), style:{background:W.vermelho}}),
        e("span",{className:"text-[14px] tabular-nums"}, duracao(grav.ms)), e("span",{className:"flex-1 text-[11.5px]", style:{color:W.sec}}, grav.pausado ? "Gravação pausada" : "Gravando…")),
      e("button",{onClick:pausarGravacao, "aria-label":grav.pausado ? "Continuar gravando" : "Pausar gravação", className:"grid size-10 place-items-center rounded-full hover:bg-white/10"}, e(Ph,{n:grav.pausado ? "microphone" : "pause", s:22, fill:true, style:{color:W.vermelho}})),
      e("button",{onClick:enviarAudio, "aria-label":"Enviar áudio", className:"grid size-11 place-items-center rounded-full text-white", style:{background:W.verde}}, e(Ph,{n:"paper-plane-tilt", s:22, fill:true}))) :
    e("div",{className:"flex items-end gap-0.5 rounded-[26px] py-1 pl-1.5 pr-1.5", style:{background:W.painel, margin:"8px 12px 10px", boxShadow:"0 1px 2px rgba(11,20,26,.13)"}},
      e("div",{className:"relative"},
        e("button",{onClick:function(){ setMenuAnexo(!menuAnexo); setEmoji(false); }, "aria-label":"Anexar", className:"grid size-10 shrink-0 place-items-center rounded-full hover:bg-black/5"}, e(Ph,{n:"plus", s:24, style:{color:W.sec}})),
        menuAnexo && e(Popover,{className:"bottom-12 left-0", fechar:function(){ setMenuAnexo(false); }},
          e(ItemMenu,{n:"image", onClick:function(){ setMenuAnexo(false); fotoIn.current.click(); }}, "Foto"),
          e(ItemMenu,{n:"file-text", onClick:function(){ setMenuAnexo(false); docIn.current.click(); }}, "Documento, PDF ou planilha"),
          e(ItemMenu,{n:"camera", onClick:function(){ setMenuAnexo(false); setCamera(true); }}, "Câmera"))),
      e("input",{ref:fotoIn, type:"file", accept:"image/*", multiple:true, className:"hidden", onChange:function(ev){ addArquivos(ev.target.files); ev.target.value = ""; }}),
      e("input",{ref:docIn, type:"file", accept:".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx,.odt,.ods,.zip", multiple:true, className:"hidden", onChange:function(ev){ addArquivos(ev.target.files); ev.target.value = ""; }}),
      e("button",{onClick:function(){ setEmoji(!emoji); setMenuAnexo(false); }, "aria-label":"Emojis", className:"grid size-10 shrink-0 place-items-center rounded-full hover:bg-black/5"}, e(Ph,{n:"smiley-sticker", s:24, style:{color:W.sec}})),
      e("textarea",{ref:ta, rows:1, spellCheck:true, lang:"pt-BR", value:texto, onChange:mudou, onKeyDown:teclas, placeholder:anexos.length ? "Adicione uma legenda…" : "Digite uma mensagem", "aria-label":"Mensagem",
        className:"max-h-[140px] min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] leading-snug outline-none", style:{color:W.texto}}),
      temTexto || p.editando ?
        e("button",{onClick:enviar, "aria-label":"Enviar", className:"grid size-10 shrink-0 place-items-center rounded-full", style:{background:W.texto, color:W.painel}}, e(Ph,{n:p.editando ? "check" : "paper-plane-right", s:20, fill:true})) :
        e("button",{onClick:gravar, "aria-label":"Gravar áudio", className:"grid size-10 shrink-0 place-items-center rounded-full", style:{background:W.texto, color:W.painel}}, e(Ph,{n:"microphone", s:20, fill:true}))),
    camera && e(Camera,{fechar:function(){ setCamera(false); }, foto:addFotoCamera}));
}
export { Compositor };
