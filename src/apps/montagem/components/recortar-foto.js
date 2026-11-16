// Sorelly Admin — components/recortar-foto.js
// Janelinha para enquadrar a foto do perfil (Marcus, 16/11/2026: "não dá para editar a foto, quero focar em mim e perde resolução").
// Arrastar a foto muda o enquadramento; a barra dá zoom. Salva um quadrado de 360 px (JPEG 88%), bem mais nítido que os 160 px de antes.
import { e, useEffect, useRef, useState } from "@/shared/react";
import { createPortal } from "react-dom";

var CAIXA = 280;   // lado da área de enquadramento na tela (px)
var SAIDA = 360;   // lado da foto salva (px)

function RecortarFoto(p){
  var im = useState(null), img = im[0], setImg = im[1];
  var zs = useState(1), zoom = zs[0], setZoom = zs[1];
  var ps = useState({x:0, y:0}), pos = ps[0], setPos = ps[1];   // canto de cima à esquerda da foto, dentro da caixa
  var er = useState(""), erro = er[0], setErro = er[1];
  var arr = useRef(null);

  useEffect(function(){
    var url = URL.createObjectURL(p.arquivo), i = new Image();
    i.onload = function(){
      var base = CAIXA/Math.min(i.naturalWidth, i.naturalHeight), w = i.naturalWidth*base, h = i.naturalHeight*base;
      setImg(i); setZoom(1); setPos({x:(CAIXA-w)/2, y: h>w ? 0 : (CAIXA-h)/2});   // foto em pé começa pelo topo, onde costuma estar o rosto
    };
    i.onerror = function(){ setErro("Este arquivo não é uma imagem."); };
    i.src = url;
    return function(){ URL.revokeObjectURL(url); };
  }, [p.arquivo]);

  var base = img ? CAIXA/Math.min(img.naturalWidth, img.naturalHeight) : 1, esc = base*zoom;
  var prende = function(x, y, escala){ var w = img.naturalWidth*escala, h = img.naturalHeight*escala; return {x:Math.min(0, Math.max(CAIXA-w, x)), y:Math.min(0, Math.max(CAIXA-h, y))}; };

  var mudaZoom = function(z){   // o zoom gira em volta do centro da área
    var nova = base*z, cx = (CAIXA/2-pos.x)/esc, cy = (CAIXA/2-pos.y)/esc;
    setZoom(z); setPos(prende(CAIXA/2-cx*nova, CAIXA/2-cy*nova, nova));
  };
  var desce = function(ev){ arr.current = {x:ev.clientX, y:ev.clientY, px:pos.x, py:pos.y}; ev.currentTarget.setPointerCapture(ev.pointerId); };
  var move = function(ev){ var a = arr.current; if(!a || !img) return; setPos(prende(a.px+ev.clientX-a.x, a.py+ev.clientY-a.y, esc)); };
  var solta = function(){ arr.current = null; };

  var salvar = function(){
    if(!img) return;
    var c = document.createElement("canvas"); c.width = SAIDA; c.height = SAIDA;
    var g = c.getContext("2d"); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
    g.drawImage(img, -pos.x/esc, -pos.y/esc, CAIXA/esc, CAIXA/esc, 0, 0, SAIDA, SAIDA);
    p.onSalvar(c.toDataURL("image/jpeg", 0.88));
  };

  var BTN = "h-8 rounded-lg px-4 text-[13px] font-semibold outline-none ";
  return createPortal(e("div",{className:"fixed inset-0 z-[80] grid place-items-center bg-black/70", onClick:p.onCancelar},
    e("div",{role:"dialog", "aria-label":"Enquadrar foto", onClick:function(ev){ ev.stopPropagation(); }, className:"flex w-[19rem] flex-col items-center gap-2 rounded-xl bg-card p-3 shadow-2xl ring-1 ring-[#E8B84B]/40"},
      e("div",{className:"text-[11px] font-bold uppercase tracking-wide"}, "Enquadrar foto"),
      erro ? e("p",{role:"alert", className:"text-[13px] font-semibold text-destructive"}, erro) :
      e("div",{onPointerDown:desce, onPointerMove:move, onPointerUp:solta, onPointerCancel:solta, style:{width:CAIXA, height:CAIXA, touchAction:"none"}, className:"relative cursor-grab select-none overflow-hidden rounded-xl bg-black active:cursor-grabbing"},
        img && e("img",{src:img.src, alt:"", draggable:false, style:{position:"absolute", left:pos.x, top:pos.y, width:img.naturalWidth*esc, height:img.naturalHeight*esc, maxWidth:"none"}}),
        e("div",{className:"pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/40"})),
      !erro && e("div",{className:"flex w-full items-center gap-2"},
        e("span",{className:"text-[11px] font-bold uppercase tracking-wide"}, "Zoom"),
        e("input",{type:"range", min:1, max:4, step:0.01, value:zoom, "aria-label":"Zoom da foto", onChange:function(ev){ mudaZoom(Number(ev.target.value)); }, className:"h-8 flex-1 cursor-pointer"})),
      e("p",{className:"text-[11px]"}, "Arraste a foto para enquadrar o rosto."),
      e("div",{className:"flex w-full gap-2"},
        e("button",{type:"button", onClick:p.onCancelar, className:BTN+"flex-1 bg-white/10 hover:bg-white/15"}, "Cancelar"),
        e("button",{type:"button", onClick:salvar, disabled:!img, className:BTN+"flex-1 bg-primary font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"}, "Salvar")))), document.body);
}

export { RecortarFoto };
