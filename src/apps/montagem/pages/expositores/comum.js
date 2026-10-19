// Sorelly Admin · montagem — pages/expositores/comum.js
// Peças e ajudantes das telas do módulo EXPOSITORES (cor laranja #F97316, igual ao Cadastro de revendedoras). Regras de negócio NÃO ficam aqui (domain/expositores.js).
//   useEx()          estado do módulo, quem está logado e "exec" (confere a regra antes; se o domínio recusar mostra o aviso formal e devolve false)
//   Campo, Entrada, Area, Chips   campos centralizados do padrão
//   FotoSlot         foto por link ou arquivo pequeno (convertido em texto e reduzido), com limite de tamanho
//   CamposVinculo    vínculo (revendedora, representante, kit novo) usado na fila e na montagem
//   Confirmar        janela pequena de confirmação (excluir)
//   corTom, SeloTom  cores dos vocabulários do domínio (success, warning, destructive...)
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { ROTULO_VINCULO, TIPOS_VINCULO, exReduz, validaFoto } from "@/apps/montagem/domain/expositores";
import { hojeSP } from "@/apps/montagem/domain/cadastro-leads";
import { Bt, Janela, Selo } from "@/apps/montagem/pages/indicacoes/visual";
import { use } from "@/apps/montagem/state/context";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var LARANJA = "#F97316";
var CAMPO = INPUT+" h-9! w-full text-center text-[13px]!";
var TONS = {success:"#4ADE80", warning:"#FBBF24", destructive:"#EF4444", info:"#60A5FA", gold:LARANJA, muted:"#94A3B8"};
var corTom = function(t){ return TONS[t] || TONS.muted; };
function SeloTom(p){ return e(Selo,{cor:corTom(p.tom), ic:p.ic, titulo:p.titulo}, p.children); }
// data/hora de uma foto de kit novo: número (carimbo) ou texto ISO
var dataBr = function(v){ if(!v) return ""; try{ var d = typeof v==="number" ? new Date(v) : new Date(String(v).length<=10 ? v+"T12:00:00" : v); return isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR"); }catch(x){ return ""; } };

function useEx(){
  var cx = use(), s = cx.state, d = cx.dispatch, por = nomeDe(s.usuario), c = {s:s, ex:s.ex, d:d, por:por, hoje:hojeSP()};
  c.aviso = function(txt, tom){ d({type:"AVISO", txt:txt, tom:tom || "alerta"}); return false; };
  // confere a regra ANTES; recusa = aviso formal e false; aceita = grava e devolve o resultado do domínio ({patch, msg})
  c.exec = function(ac){
    var full = Object.assign({type:"EX", por:por}, ac), r = exReduz(s, full);
    if(!r.patch || !r.patch.ex) return c.aviso(r.msg || "Não foi possível concluir a ação.");
    d(full); return r;
  };
  // grava sem conferir de novo (para a segunda ação de uma sequência: o estado ainda não mudou aqui)
  c.direto = function(ac){ d(Object.assign({type:"EX", por:por}, ac)); };
  return c;
}

function Campo(p){ return e("label",{className:"flex min-w-0 flex-col gap-1 text-center text-[12px] font-bold "+(p.className || "")}, p.rot, p.children); }
function Entrada(p){
  return e(Campo,{rot:p.rot, className:p.className}, e("input",{type:p.tipo || "text", value:p.v==null ? "" : p.v, placeholder:p.ph, min:p.min, inputMode:p.modo, disabled:p.desligado, onChange:function(ev){ p.set(ev.target.value); }, className:CAMPO+(p.mono ? " "+MONO : "")}));
}
function Area(p){
  return e(Campo,{rot:p.rot, className:p.className}, e("textarea",{value:p.v==null ? "" : p.v, rows:p.linhas || 2, placeholder:p.ph, onChange:function(ev){ p.set(ev.target.value); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center text-[13px]!"}));
}
// Chips: escolha de uma opção sem lista descendo. opcoes = [[valor, rótulo, cor?]]; vazio = rótulo da opção "nenhuma" (opcional)
function Chips(p){
  var itens = (p.vazio ? [["", p.vazio]] : []).concat(p.opcoes);
  return e(Campo,{rot:p.rot, className:p.className}, e("div",{className:"flex flex-wrap justify-center gap-1.5"}, itens.map(function(o){ var on = String(p.v==null ? "" : p.v)===String(o[0]), cor = o[2] || LARANJA;
    return e("button",{key:o[0], type:"button", onClick:function(){ p.set(o[0]); }, "aria-pressed":on, className:"inline-flex h-8 items-center rounded-lg px-2.5 text-[12px] font-bold transition "+(on ? "text-white" : "bg-white/10 text-white/85 hover:bg-white/15"), style:on ? {background:cor+"55", boxShadow:"inset 0 0 0 1px "+cor+"cc"} : undefined}, o[1]); })));
}

// ───────────── fotos ─────────────
// lê o arquivo, reduz para no máximo 900 px e guarda como texto JPEG abaixo do limite do domínio
function lerFoto(arq, max){
  return new Promise(function(ok, no){
    var r = new FileReader();
    r.onerror = function(){ no("Não foi possível ler o arquivo."); };
    r.onload = function(){
      var img = new Image();
      img.onerror = function(){ no("O arquivo escolhido não é uma imagem."); };
      img.onload = function(){
        var esc = Math.min(1, 900/Math.max(img.width, img.height, 1)), cv = document.createElement("canvas");
        cv.width = Math.max(1, Math.round(img.width*esc)); cv.height = Math.max(1, Math.round(img.height*esc));
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        var q = 0.8, u = cv.toDataURL("image/jpeg", q);
        while(u.length>max && q>0.3){ q -= 0.15; u = cv.toDataURL("image/jpeg", q); }
        if(u.length>max) no("A imagem é grande demais para guardar no navegador. Use uma foto menor ou um link."); else ok(u);
      };
      img.src = r.result;
    };
    r.readAsDataURL(arq);
  });
}
// FotoSlot: quadrado com a foto (ou câmera), botões de arquivo, link e remover. onChange(foto) recebe texto ou null (remover)
function FotoSlot(p){
  var cx = use(), ex = cx.state.ex, st = useState(null), modo = st[0], tx = useState(""), txt = tx[0], ocupado = useState(false);
  var max = ex.config.fotoMaxChars, tam = p.tam || 96;
  var aplicar = function(f){ var v = validaFoto(ex, f); if(v.erro){ cx.dispatch({type:"AVISO", txt:v.erro, tom:"alerta"}); return; } p.onChange(v.foto); st[1](null); tx[1](""); };
  var escolher = function(ev){ var arq = ev.target.files && ev.target.files[0]; ev.target.value = ""; if(!arq) return; ocupado[1](true);
    lerFoto(arq, max).then(function(u){ ocupado[1](false); aplicar(u); }, function(m){ ocupado[1](false); cx.dispatch({type:"AVISO", txt:m, tom:"alerta"}); }); };
  var mini = "grid size-7 place-items-center rounded-md bg-white/10 hover:bg-white/20 cursor-pointer";
  return e("div",{className:"flex flex-col items-center gap-1 "+(p.className || "")},
    p.rot && e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/70"}, p.rot),
    e("div",{className:"grid place-items-center overflow-hidden rounded-lg bg-black/30 ring-1 ring-white/15", style:{width:tam, height:tam}},
      p.valor ? e("img",{src:p.valor, alt:p.rot || "Foto", className:"size-full object-cover"}) : e(Ph,{n:ocupado[0] ? "circle-notch" : "camera", s:26, className:"text-white/45 "+(ocupado[0] ? "animate-spin" : "")})),
    e("div",{className:"flex items-center justify-center gap-1"},
      e("label",{title:"Escolher arquivo", className:mini}, e(Ph,{n:"upload-simple", s:15}), e("input",{type:"file", accept:"image/*", className:"hidden", onChange:escolher})),
      e("button",{type:"button", title:"Usar um link", "aria-label":"Usar um link", onClick:function(){ st[1](modo ? null : "link"); }, className:mini}, e(Ph,{n:"link-simple", s:15})),
      p.valor && e("button",{type:"button", title:"Remover a foto", "aria-label":"Remover a foto", onClick:function(){ p.onChange(null); }, className:mini}, e(Ph,{n:"trash", s:15}))),
    modo && e("div",{className:"flex items-center gap-1"},
      e("input",{type:"url", value:txt, placeholder:"https://…", "aria-label":"Link da foto", onChange:function(ev){ tx[1](ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") aplicar(txt); }, className:INPUT+" h-7! w-36 text-center text-[11.5px]!"}),
      e("button",{type:"button", title:"Aplicar o link", "aria-label":"Aplicar o link", onClick:function(){ aplicar(txt); }, className:mini}, e(Ph,{n:"check", s:15}))));
}

// ───────────── vínculo ─────────────
// v = {tipo, revendedoraNome, representante, kitNovoId} ou null; devolve sempre um objeto (tipo "" = nenhum)
var vincVazio = function(){ return {tipo:"", revendedoraNome:"", representante:"", kitNovoId:null}; };
var vincDe = function(v){ return v ? {tipo:v.tipo || "", revendedoraNome:v.revendedoraNome || "", representante:v.representante || "", kitNovoId:v.kitNovoId!=null ? v.kitNovoId : null, revendedoraId:v.revendedoraId!=null ? v.revendedoraId : null} : vincVazio(); };
// só manda para o domínio o que tem conteúdo
var vincSaida = function(v){ return v && (v.tipo || v.revendedoraNome || v.representante || v.kitNovoId!=null) ? {tipo:v.tipo || null, revendedoraId:v.revendedoraId!=null ? v.revendedoraId : null, revendedoraNome:v.revendedoraNome || null, representante:v.representante || null, kitNovoId:v.kitNovoId!=null ? v.kitNovoId : null} : null; };
var textoVinculo = function(v){ if(!v) return ""; var t = []; if(v.revendedoraNome) t.push(v.revendedoraNome); if(v.representante) t.push("Rep. "+v.representante); return (v.tipo ? ROTULO_VINCULO[v.tipo] : "Vínculo")+(t.length ? " · "+t.join(" · ") : ""); };
function CamposVinculo(p){
  var v = p.v, set = function(k, x){ var n = Object.assign({}, v); n[k] = x; p.set(n); };
  return e("div",{className:"flex flex-col gap-2"},
    e(Chips,{rot:"Vínculo", v:v.tipo, set:function(x){ set("tipo", x); }, vazio:"Nenhum", opcoes:TIPOS_VINCULO.map(function(t){ return [t, ROTULO_VINCULO[t]]; })}),
    v.tipo && v.tipo!=="representante" && e(Entrada,{rot:"Nome da revendedora", v:v.revendedoraNome, set:function(x){ set("revendedoraNome", x); }}),
    v.tipo && e(Entrada,{rot:"Representante", v:v.representante, set:function(x){ set("representante", x); }}));
}

// ───────────── confirmação ─────────────
function Confirmar(p){
  return e(Janela,{t:p.t, sub:p.sub, tam:"sm", fechar:p.fechar},
    e("div",{className:"flex flex-wrap justify-center gap-2"}, e(Bt,{onClick:p.fechar}, "Voltar"), e(Bt,{tipo:"perigo", ic:"trash", onClick:p.ok}, p.rotulo || "Excluir")));
}

var Vazio = function(txt, ic){ return e("div",{className:"flex flex-col items-center gap-1.5 rounded-xl bg-black/20 px-3 py-6 text-center text-[13px] text-white/70 ring-1 ring-white/10"}, e(Ph,{n:ic || "tray", s:26, className:"text-white/45"}), txt); };
var cap1 = function(t){ return t ? t.charAt(0).toUpperCase()+t.slice(1) : t; };
var textoPecas = function(c){ var n = c.quantidadeTotalPecas || 0; return n+(n===1 ? " peça" : " peças"); };

export { LARANJA, CAMPO, corTom, SeloTom, dataBr, useEx, Campo, Entrada, Area, Chips, FotoSlot, lerFoto, vincVazio, vincDe, vincSaida, textoVinculo, CamposVinculo, Confirmar, Vazio, cap1, textoPecas };
