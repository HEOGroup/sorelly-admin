// Sorelly Admin · montagem — mobile/preferencias-rev.js
// Tela "Editar preferências" do app da revendedora: os MESMOS blocos do admin (Kits → Preferências do kit), lidos de s.pk (domain/preferencias-rev.js).
// Cada tipo de bloco tem o seu jeito: ouro/prata (barra), vendo/não vendo, composições, letras, observações e fotos de referência. NÃO garante a peça no kit.
// Grava pela ação PK "app_salvar". Props: k (a revendedora), onVoltar.
import { AVISO_PREFS, METAIS_APP, blocosDoApp, pkLerDoApp } from "@/apps/montagem/domain/preferencias-rev";
import { ALFABETO, IMAGENS_MAX, pkRespondido } from "@/apps/montagem/domain/preferencias-kit";
import { CabecaTela, FolhaTela } from "@/apps/montagem/mobile/rev-comum";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useState } from "@/shared/react";

var OURO = "#DCA32A", PRATA = "#9CA3AF", DOURO = "#E8B84B";
var BTN_OFF = "border border-[#D9DEE7] bg-[#F8FAFC] text-[#374151]", BTN_ON = "border border-[#E8B84B] bg-[#FFF6E0] text-[#B8860B]";
var rot = function(t){ return e("p",{className:"mb-1.5 mt-3 text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]"}, t); };
var bolinha = function(m){ return e("span",{className:"inline-block size-[22px] shrink-0 rounded-full", style:{background:m==="Ouro" ? OURO : m==="Prata" ? PRATA : "linear-gradient(90deg,"+OURO+" 50%,"+PRATA+" 50%)"}}); };
var tira = function(o, k){ var n = Object.assign({}, o); delete n[k]; return n; };

// foto da galeria reduzida (cabe no armazenamento do navegador até existir servidor)
function reduzir(arq, ok){
  var rd = new FileReader();
  rd.onload = function(){ var im = new Image(); im.onload = function(){ var m = 480, f = Math.min(1, m/Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width*f); c.height = Math.round(im.height*f); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL("image/jpeg", 0.7)); }; im.src = rd.result; };
  rd.readAsDataURL(arq);
}

function Cartao(p){
  var vazio = p.pendente;
  return e("div",{className:"rounded-2xl border p-4 "+(vazio ? "border-[#FCA5A5] bg-[#FEF2F2]" : "border-[#D9DEE7] bg-white")},
    e("div",{className:"flex items-center gap-3 border-b pb-3 "+(vazio ? "border-[#FCA5A5]" : "border-[#EEF0F4]")},
      e("span",{className:"grid size-10 shrink-0 place-items-center rounded-xl text-[18px] font-bold text-[#111827]", style:{background:p.accent}}, p.n),
      e("b",{className:"text-[19px] leading-tight text-[#111827]"}, p.t)),
    p.children);
}
function Barra(p){   // ouro × prata
  var g = p.v==null ? 50 : p.v;
  return e("div",{className:"flex flex-col gap-2 pt-3"},
    e("div",{className:"flex items-center justify-between text-[15px] font-bold"},
      e("span",{className:"flex items-center gap-2", style:{color:"#B8860B"}}, bolinha("Ouro"), "Ouro "+g+"%"), e("span",{className:"flex items-center gap-2 text-[#6B7280]"}, "Prata "+(100-g)+"%", bolinha("Prata"))),
    e("input",{type:"range", min:0, max:100, step:5, value:g, "aria-label":"Proporção de ouro e prata", onChange:function(x){ p.onChange(Number(x.target.value)); }, className:"w-full", style:{accentColor:"#CA8A04"}}));
}
function Escolhas(p){   // grade de opções marcáveis (várias)
  var sel = p.sel || [];
  return e("div",{className:"grid grid-cols-2 gap-2"}, p.opcoes.map(function(o){ var on = sel.indexOf(o)>=0, cheio = !on && p.max && sel.length>=p.max;
    return e("button",{key:o, type:"button", "aria-pressed":on, disabled:cheio, onClick:function(){ p.onChange(on ? sel.filter(function(x){ return x!==o; }) : sel.concat([o])); },
      className:"flex h-11 items-center justify-between rounded-xl px-3 text-[14px] font-semibold active:scale-[.98] disabled:opacity-40 "+(on ? BTN_ON : BTN_OFF)},
      o, on ? e("span",{className:"grid size-5 place-items-center rounded-full bg-[#CA8A04] text-white"}, e(Icon,{n:"check", s:12})) : e("span",{className:"size-5 rounded-full border-2 border-[#CBD5E1]"})); }));
}
function Metais(p){   // Ouro / Prata / Ouro + Prata (uma)
  return e("div",{className:"flex flex-col gap-2"}, METAIS_APP.map(function(m){ var on = p.v===m;
    return e("button",{key:m, type:"button", "aria-pressed":on, onClick:function(){ p.onChange(on ? null : m); }, className:"flex h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold active:scale-[.98] "+(on ? BTN_ON : BTN_OFF)}, bolinha(m), m); }));
}
function Fotos(p){
  var lista = p.v || [];
  var pega = function(ev){ var arqs = Array.prototype.slice.call(ev.target.files||[]).slice(0, IMAGENS_MAX-lista.length), novas = lista.slice(), pend = arqs.length; ev.target.value = ""; if(!pend) return;
    arqs.forEach(function(a){ reduzir(a, function(u){ novas.push(u); pend--; if(!pend) p.onChange(novas.slice(0, IMAGENS_MAX)); }); }); };
  return e("div",{className:"mt-3 border-t border-[#EEF0F4] pt-3"}, e("p",{className:"mb-2 text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]"}, "Imagens de referência ("+lista.length+"/"+IMAGENS_MAX+")"),
    lista.length>0 && e("div",{className:"mb-2 flex gap-2"}, lista.map(function(u, i){ return e("div",{key:i, className:"relative"}, e("img",{src:u, alt:"Referência "+(i+1), className:"size-20 rounded-lg object-cover"}),
      e("button",{type:"button", "aria-label":"Tirar imagem", onClick:function(){ p.onChange(lista.filter(function(x, j){ return j!==i; })); }, className:"absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-[#111827] text-white"}, e(Icon,{n:"x", s:12}))); })),
    lista.length<IMAGENS_MAX && e("label",{className:"flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-[15px] font-semibold text-[#4B5563]"},
      e(Icon,{n:"imagem", s:20}), "Galeria", e("input",{type:"file", accept:"image/*", multiple:true, className:"hidden", onChange:pega})));
}
var maxDe = function(rotulo){ var m = /selecione\s+(\d+)/i.exec(rotulo||""); return m ? Number(m[1]) : 0; };

function CorpoBloco(p){
  var b = p.b, r = p.r || {}, set = p.set;
  var corpo = [];
  if(b.type==="slider"){
    corpo.push(e(Barra,{key:"g", v:r.goldPercent, onChange:function(g){ set(Object.assign({}, r, {goldPercent:g})); }}));
    (b.fields||[]).forEach(function(f){ corpo.push(e("div",{key:f.key}, rot(f.label), e(Escolhas,{opcoes:f.options, sel:r[f.key], max:maxDe(f.label), onChange:function(l){ set(l.length ? Object.assign({}, r, (function(){ var o = {}; o[f.key] = l; return o; })()) : tira(r, f.key)); }}))); });
  }
  if(b.type==="vend"){
    var vende = r.selling;
    corpo.push(e("div",{key:"s", className:"mt-3 grid grid-cols-2 gap-1 rounded-xl bg-[#F3F4F6] p-1"},
      [[true,"Vendo","#10B981"],[false,"Não vendo","#EF4444"]].map(function(x){ var on = vende===x[0];
        return e("button",{key:x[2], type:"button", "aria-pressed":on, onClick:function(){ set(x[0] ? Object.assign({}, r, {selling:true}) : {selling:false}); }, className:"h-12 rounded-lg text-[15px] font-semibold "+(on ? "text-white" : "text-[#6B7280]"), style:on ? {background:x[2]} : undefined}, x[1]); })));
    if(vende===true){
      if(b.hasSlider) corpo.push(e(Barra,{key:"g", v:r.goldPercent, onChange:function(g){ set(Object.assign({}, r, {goldPercent:g})); }}));
      if(b.metalField) corpo.push(e("div",{key:"m"}, rot(b.metalField.label), e(Metais,{v:r.metal, onChange:function(m){ set(m ? Object.assign({}, r, {metal:m}) : tira(r, "metal")); }})));
      (b.fields||[]).forEach(function(f){ corpo.push(e("div",{key:f.key}, rot(f.label), e(Escolhas,{opcoes:f.options, sel:r[f.key], max:maxDe(f.label), onChange:function(l){ set(l.length ? Object.assign({}, r, (function(){ var o = {}; o[f.key] = l; return o; })()) : tira(r, f.key)); }}))); });
    }
  }
  if(b.type==="filhos"){
    corpo.push(e("p",{key:"d", className:"mt-3 text-[14.5px] leading-snug text-[#4B5563]"}, "Selecione as composições e escolha o metal de cada uma."));
    corpo.push(e("div",{key:"l", className:"mt-2 flex flex-col gap-2"}, b.options.map(function(o){ var m = r[o], on = !!m;
      return e("div",{key:o, className:"rounded-xl "+(on ? BTN_ON : BTN_OFF)},
        e("button",{type:"button", "aria-pressed":on, onClick:function(){ set(on ? tira(r, o) : Object.assign({}, r, (function(){ var x = {}; x[o] = "Ouro"; return x; })())); }, className:"flex h-12 w-full items-center justify-between px-3 text-left text-[15px] font-semibold"},
          o, on ? e("span",{className:"grid size-5 place-items-center rounded-full bg-[#CA8A04] text-white"}, e(Icon,{n:"check", s:12})) : e("span",{className:"size-5 rounded-full border-2 border-[#CBD5E1]"})),
        on && e("div",{className:"flex gap-1.5 px-2 pb-2"}, METAIS_APP.map(function(mm){ return e("button",{key:mm, type:"button", "aria-pressed":m===mm, onClick:function(){ set(Object.assign({}, r, (function(){ var x = {}; x[o] = mm; return x; })())); }, className:"flex h-9 flex-1 items-center justify-center gap-1 rounded-lg text-[12.5px] font-bold "+(m===mm ? "bg-[#CA8A04] text-white" : "bg-white text-[#374151]")}, mm); }))); })));
  }
  if(b.type==="letras"){
    var max = b.maxLetters || 10, letras = Object.keys(r).filter(function(k){ return k!=="images"; }).sort(), prox = {"Ouro":"Prata", "Prata":"Ouro + Prata"};
    corpo.push(e("p",{key:"d", className:"mt-3 text-[14.5px] leading-snug text-[#4B5563]"}, "Toque em uma letra para escolher o metal — ", e("b",{className:"text-[#CA8A04]"}, letras.length), " de "+max+" escolhidas."));
    corpo.push(e("div",{key:"g", className:"mt-2 grid grid-cols-6 gap-2"}, ALFABETO.slice(0, 26).map(function(L){ var m = r[L];
      return e("button",{key:L, type:"button", "aria-label":"Letra "+L, onClick:function(){ var n = Object.assign({}, r); if(!m){ if(letras.length>=max) return; n[L] = "Ouro"; } else if(prox[m]) n[L] = prox[m]; else delete n[L]; set(n); },
        className:"grid h-12 place-items-center rounded-xl text-[15px] font-bold "+(m ? "text-[#111827]" : BTN_OFF), style:m ? {background:m==="Ouro" ? OURO : m==="Prata" ? "#AEB5BD" : "linear-gradient(90deg,"+OURO+" 50%,#AEB5BD 50%)"} : undefined}, L); })));
    letras.forEach(function(L){ corpo.push(e("div",{key:"r"+L, className:"flex items-center justify-between border-b border-[#EEF0F4] py-2.5 text-[15px]"}, e("span",{className:"font-semibold text-[#111827]"}, "Colar "+L), e("span",{className:"flex items-center gap-2 rounded-full border border-[#D9DEE7] px-3 py-1 text-[14px] font-semibold text-[#374151]"}, e("span",{className:"inline-block size-[18px] rounded-full", style:{background:r[L]==="Ouro" ? OURO : r[L]==="Prata" ? PRATA : "linear-gradient(90deg,"+OURO+" 50%,"+PRATA+" 50%)"}}), r[L]))); });
  }
  if(b.type==="id"){   // cores (paleta)
    var cf = b.colorField, selc = r[cf.key] || [];
    corpo.push(e("div",{key:"cores"}, rot(cf.label), e("div",{className:"grid grid-cols-2 gap-2"}, cf.options.map(function(c){ var on = selc.indexOf(c.value)>=0;
      return e("button",{key:c.value, type:"button", "aria-pressed":on, onClick:function(){ var l = on ? selc.filter(function(x){ return x!==c.value; }) : selc.concat([c.value]); set(l.length ? (function(){ var x = {}; x[cf.key] = l; return x; })() : null); }, className:"flex h-11 items-center gap-2 rounded-xl px-3 text-[14px] font-semibold "+(on ? BTN_ON : BTN_OFF)},
        e("span",{className:"size-4 shrink-0 rounded-full border border-black/20", style:{background:c.hex}}), c.value); }))));
  }
  if(b.type==="vendmetal"){   // cada variação: vendo / não vendo e o metal
    b.items.forEach(function(it){ var x = r[it] || {};
      corpo.push(e("div",{key:it, className:"mt-3 rounded-xl border border-[#EEF0F4] p-2.5"}, e("b",{className:"mb-2 block text-[14.5px] text-[#111827]"}, it),
        e("div",{className:"grid grid-cols-2 gap-1 rounded-xl bg-[#F3F4F6] p-1"}, [[true,"Vendo","#10B981"],[false,"Não vendo","#EF4444"]].map(function(y){ var on = x.selling===y[0];
          return e("button",{key:y[2], type:"button", "aria-pressed":on, onClick:function(){ var n = Object.assign({}, r); n[it] = y[0] ? Object.assign({}, x, {selling:true}) : {selling:false}; set(n); }, className:"h-11 rounded-lg text-[14px] font-semibold "+(on ? "text-white" : "text-[#6B7280]"), style:on ? {background:y[2]} : undefined}, y[1]); })),
        x.selling===true && e("div",{className:"mt-2"}, e(Metais,{v:x.metal, onChange:function(m){ var n = Object.assign({}, r); n[it] = m ? Object.assign({}, x, {metal:m}) : {selling:true}; set(n); }})))); });
  }
  if(b.allowImages) corpo.push(e(Fotos,{key:"f", v:r.images, onChange:function(l){ set(l.length ? Object.assign({}, r, {images:l}) : tira(r, "images")); }}));
  return e("div",null, corpo);
}

function TelaPreferenciasRev(p){
  var cx = use(), s = cx.state, nome = p.k.rev, ini = pkLerDoApp(s, nome), blocos = blocosDoApp(s);
  var st = useState({respostas:ini.respostas, observacoes:ini.observacoes}), v = st[0], setV = st[1], ok = useState(false), salvou = ok[0], setSalvou = ok[1];
  var setResp = function(key, resp){ setSalvou(false); setV(function(pr){ var rs = Object.assign({}, pr.respostas); if(resp===null) delete rs[key]; else rs[key] = resp; return Object.assign({}, pr, {respostas:rs}); }); };
  var salvar = function(){ cx.dispatch({type:"PK", op:"app_salvar", nome:nome, por:nome+" (app)", respostas:v.respostas, observacoes:v.observacoes}); setSalvou(true); };
  return [e(CabecaTela,{key:"h", t:"Editar preferências", onVoltar:p.onVoltar}),
    e(FolhaTela,{key:"c"},
      e("div",{className:"flex gap-3 rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] p-4"}, e("span",{className:"mt-0.5 shrink-0 text-[#B91C1C]"}, e(Icon,{n:"alert", s:20})), e("p",{className:"text-[14px] font-medium leading-relaxed text-[#991B1B]"}, AVISO_PREFS)),
      blocos.map(function(b){
        if(b.type==="observacoes") return e(Cartao,{key:b.key, n:b.numero, t:b.title, accent:b.accent}, e("textarea",{value:v.observacoes, rows:4, placeholder:"Escreva aqui qualquer observação especial...", onChange:function(x){ var t = x.target.value; setSalvou(false); setV(function(pr){ return Object.assign({}, pr, {observacoes:t}); }); }, className:"mt-3 w-full rounded-xl border border-[#D9DEE7] bg-[#F8FAFC] p-3 text-[15px] text-[#111827] outline-none"}));
        var r = v.respostas[b.key];
        return e(Cartao,{key:b.key, n:b.numero, t:b.title, accent:b.accent, pendente:b.type!=="vend" && !pkRespondido(b, r)}, e(CorpoBloco,{b:b, r:r, set:function(n){ setResp(b.key, n); }}));
      }),
      e("button",{onClick:salvar, className:"h-12 rounded-xl text-[14px] font-extrabold uppercase tracking-wide text-white active:scale-[.98]", style:{background:"#0B0D12"}}, "Salvar preferências"),
      salvou && e("p",{className:"flex items-center justify-center gap-1.5 text-center text-[12.5px] font-semibold text-[#15803D]"}, e(Icon,{n:"check", s:14}), "Preferências salvas. Vamos tentar o possível para enviar."))];
}
export { TelaPreferenciasRev };
