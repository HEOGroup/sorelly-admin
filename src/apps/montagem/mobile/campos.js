// Sorelly Admin — mobile/campos.js
// Campos reutilizados nos apps do celular: dinheiro estilo "caixa" e assinatura digital.
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useEffect, useRef, useState } from "@/shared/react";

function brlApp(n){ return "R$ " + Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}); }

// Dinheiro estilo caixa: só números, sem vírgula. O valor sobe da direita pra esquerda (1 → R$ 0,01 · 195000 → R$ 1.950,00)
// e já aparece com o "R$". value é um número (ou null/0 = vazio); onChange recebe número ou null.
function CampoDinheiro(p){
  return e("input",{inputMode:"numeric", autoComplete:"off", value: (p.value || (p.mostraZero && p.value===0)) ? brlApp(p.value) : "", placeholder:p.placeholder || "R$ 0,00",
    "aria-label":p.label, disabled:p.disabled, className:p.className,
    onChange:function(ev){ var bruto = ev.target.value.replace(/\D/g,""), dig = bruto.replace(/^0+/,"").slice(0,11); p.onChange(dig ? Number(dig)/100 : (p.mostraZero && bruto ? 0 : null)); }});
}


// Dinheiro automático (02/11/2026, Marcus): o que se digita são reais inteiros e o ",00" aparece sozinho (888 → R$ 888,00 · 10 → R$ 10,00).
// Para centavos, digita a vírgula (888,5 → R$ 888,50). Usado na Calculadora de acertos do app; o CampoDinheiro (centavos subindo) segue nas outras telas.
function milharAuto(i){ return String(i||"0").replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
function rawDeNumero(n, mostraZero){
  if(!n && !(mostraZero && n===0)) return {int:"", dec:null};
  var inteiro = Math.floor(n), cent = Math.round((n-inteiro)*100);
  return {int:String(inteiro), dec: cent ? (cent%10===0 ? String(cent/10) : String(cent).padStart(2,"0")) : null};
}
function numeroDeRaw(r){ if(r.int==="" && r.dec===null) return null; return parseFloat((r.int||"0")+"."+(r.dec||"0")); }
function textoDeRaw(r){ if(r.int==="" && r.dec===null) return ""; return "R$ "+milharAuto(r.int)+","+(r.dec===null ? "00" : r.dec); }
function CampoReaisAuto(p){
  var a = useState(function(){ return rawDeNumero(p.value, p.mostraZero); }), raw = a[0], setRaw = a[1];
  var ref = useRef(null);
  useEffect(function(){ var atual = numeroDeRaw(raw); if((atual||0)!==(p.value||0)) setRaw(rawDeNumero(p.value, p.mostraZero)); }, [p.value]);
  useEffect(function(){ var el = ref.current; if(el && document.activeElement===el){ try{ el.setSelectionRange(el.value.length, el.value.length); }catch(x){} } }, [raw]);
  var muda = function(ev){
    var tx = ev.target.value, digs = tx.replace(/\D/g,""), antes = textoDeRaw(raw).replace(/\D/g,""), nr;
    if(digs.length===0 && !/,/.test(tx)) nr = {int:"", dec:null};                                        // apagou tudo
    else if(raw.dec===null){
      if((tx.match(/,/g)||[]).length>1) nr = {int:raw.int, dec:""};                                   // digitou a vírgula: abre os centavos
      else if(digs.length-antes.length>1) nr = {int:digs.replace(/^0+(?=\d)/,"").slice(0,9), dec:null};   // colou um valor
      else if(digs.length>antes.length) nr = {int:(raw.int+digs.slice(-1)).replace(/^0+(?=\d)/,"").slice(0,9), dec:null};
      else if(digs.length<antes.length) nr = {int:raw.int.slice(0,-1), dec:null};
      else nr = raw;
    } else {
      var s2 = tx.replace(/[^0-9,]/g,""), i = s2.indexOf(",");
      nr = i<0 ? {int:s2.replace(/^0+(?=\d)/,"").slice(0,9), dec:null} : {int:s2.slice(0,i).replace(/^0+(?=\d)/,"").slice(0,9), dec:s2.slice(i+1).replace(/,/g,"").slice(0,2)};
    }
    setRaw(nr); p.onChange(numeroDeRaw(nr));
  };
  var sai = function(){ if(raw.dec!==null && raw.dec.length<2){ var d = raw.dec.padEnd(2,"0"), nr = {int:raw.int, dec: d==="00" ? null : d}; setRaw(nr); p.onChange(numeroDeRaw(nr)); } };
  return e("input",{ref:ref, inputMode:"decimal", autoComplete:"off", value:textoDeRaw(raw), placeholder:p.placeholder || "R$ 0,00", "aria-label":p.label, disabled:p.disabled, className:p.className, onChange:muda, onBlur:sai});
}

// Valor em reais inteiros (peça de brinde não tem centavo): digita 56 e aparece "R$ 56".
function CampoReais(p){
  return e("input",{inputMode:"numeric", autoComplete:"off", value: p.value ? "R$ "+Number(p.value).toLocaleString("pt-BR") : "", placeholder:p.placeholder || "R$ 0",
    "aria-label":p.label, id:p.id, disabled:p.disabled, className:p.className,
    onChange:function(ev){ var dig = ev.target.value.replace(/\D/g,"").replace(/^0+/,"").slice(0,6); p.onChange(dig ? Number(dig) : null); }});
}

// "PIX - POINT" → "Pix Point" · "CRÉDITO - SAFRA - 46" (3x) → "Crédito Safra 46 3x"
function rotuloPagamento(p){
  var t = String(p.descricao||"").toLowerCase().replace(/\s*-\s*/g," ").replace(/\s+/g," ").trim();
  t = t.replace(/(^|\s)([a-zà-ú0-9])/g, function(m, a, b){ return a + b.toUpperCase(); });
  return t + (p.forma==="credito" && p.parcelas>1 ? " "+p.parcelas+"x" : "");
}

// Assinatura digital: desenha com o dedo (ou mouse) num quadro. onChange recebe a imagem (PNG em texto) ou null quando limpa.
function AssinaturaDigital(p){
  var ref = useRef(null), desenhando = useRef(false), ultimo = useRef(null);
  var ts = useState(false), temTraco = ts[0], setTemTraco = ts[1];
  useEffect(function(){
    var c = ref.current; if(!c) return;
    var r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    c.width = Math.round(r.width*dpr); c.height = Math.round(r.height*dpr);
    var ctx = c.getContext("2d"); ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#111827"; ctx.fillStyle = "#111827";
  }, []);
  var pos = function(ev){ var r = ref.current.getBoundingClientRect(); return {x:ev.clientX-r.left, y:ev.clientY-r.top}; };
  var ini = function(ev){
    ev.preventDefault();
    try{ ref.current.setPointerCapture(ev.pointerId); }catch(x){}
    desenhando.current = true; var q = pos(ev); ultimo.current = q;
    var ctx = ref.current.getContext("2d"); ctx.beginPath(); ctx.arc(q.x, q.y, 1.2, 0, Math.PI*2); ctx.fill();
  };
  var mov = function(ev){
    if(!desenhando.current) return;
    var q = pos(ev), ctx = ref.current.getContext("2d");
    ctx.beginPath(); ctx.moveTo(ultimo.current.x, ultimo.current.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ultimo.current = q;
  };
  var fim = function(){
    if(!desenhando.current) return;
    desenhando.current = false; setTemTraco(true); p.onChange(ref.current.toDataURL("image/png"));
  };
  var limpar = function(){
    var c = ref.current, ctx = c.getContext("2d");
    ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,c.width,c.height); ctx.restore();
    setTemTraco(false); p.onChange(null);
  };
  return e("div",{className:"flex flex-col gap-1.5"},
    e("div",{className:"relative overflow-hidden rounded-2xl border-2 border-dashed border-[#D9C58A] bg-white"},
      e("canvas",{ref:ref, "aria-label":"Assinatura digital", onPointerDown:ini, onPointerMove:mov, onPointerUp:fim, onPointerCancel:fim,
        style:{touchAction:"none", width:"100%", height:150, display:"block", cursor:"crosshair"}}),
      !temTraco && e("span",{className:"pointer-events-none absolute inset-0 grid place-items-center text-[13px] font-semibold text-[#B8A878]"},"Assine aqui com o dedo")),
    e("div",{className:"flex items-center justify-between gap-2"},
      e("span",{className:"text-[11px] text-[#6B7280]"}, p.legenda || ""),
      e("button",{type:"button", onClick:limpar, className:"flex h-7 items-center gap-1 rounded-full bg-black/5 px-3 text-[11.5px] font-semibold text-[#4B5563]"},
        e(Icon,{n:"trash", s:12}), "Limpar")));
}

export { brlApp, CampoReais, CampoReaisAuto, CampoDinheiro, rotuloPagamento, AssinaturaDigital };
