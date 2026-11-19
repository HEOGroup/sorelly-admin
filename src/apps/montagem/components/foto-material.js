// Sorelly Admin · montagem — components/foto-material.js
// Foto do material do Estoque de material (Nickolas, 16/11/2026). O arquivo vai para o servidor pela estrutura que já existe (/api/anexos, módulo "ce", lib/anexo.js);
// o material guarda só {key, nome}. Peças:
//   FotoMaterial({foto, tam, rot})        → miniatura que carrega a foto; clicar amplia numa janela (Esc ou clique fecha)
//   BotaoFoto({foto, rot})               → só um ícone de imagem (para o cartão, sem aumentar o cartão); clicar amplia
//   EscolherFoto({foto, onFoto, disabled}) → botões Anexar/Trocar e Remover; onFoto({key, nome}) ou onFoto(null)
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { enviarAnexo, lerAnexo, lerArquivo } from "@/apps/montagem/lib/anexo";
import { e, useEffect, useState } from "@/shared/react";

function useFoto(foto){
  var st = useState({url:"", erro:""}), v = st[0], set = st[1], key = foto && foto.key;
  useEffect(function(){
    if(!key){ set({url:"", erro:""}); return undefined; }
    var vivo = true; set({url:"", erro:""});
    lerAnexo(key).then(function(r){ if(vivo) set({url:r.url, erro:""}); }, function(){ if(vivo) set({url:"", erro:"Foto indisponível"}); });
    return function(){ vivo = false; };
  }, [key]);
  return v;
}

function Ampliada(p){
  useEffect(function(){ var f = function(ev){ if(ev.key==="Escape") p.fechar(); }; window.addEventListener("keydown", f); return function(){ window.removeEventListener("keydown", f); }; }, []);
  return e("div",{className:"fixed inset-0 z-[80] flex cursor-zoom-out flex-col items-center justify-center gap-2 bg-black/85 p-4", role:"dialog", "aria-modal":"true", "aria-label":"Foto ampliada", onClick:p.fechar},
    p.url ? e("img",{src:p.url, alt:p.rot || "Foto do material", className:"max-h-[85vh] max-w-full rounded-lg object-contain ring-1 ring-white/20"}) : e("span",{className:"text-[13px] text-white"}, p.erro || "Carregando a foto"),
    p.rot && e("span",{className:"text-[13px] font-bold text-white"}, p.rot),
    e("span",{className:"text-[11px] text-white/70"}, "Clique ou Esc para fechar"));
}

function FotoMaterial(p){
  var f = useFoto(p.foto), ab = useState(false), lado = p.tam==="g" ? "size-28" : "size-16";
  if(!p.foto) return null;
  return e("div",{className:"flex flex-col items-center gap-1"},
    e("button",{type:"button", title:"Ampliar a foto", "aria-label":"Ampliar a foto", onClick:function(ev){ ev.stopPropagation(); ab[1](true); }, className:lado+" grid cursor-zoom-in place-items-center overflow-hidden rounded-lg bg-black/30 ring-1 ring-white/15 hover:ring-white/40"},
      f.url ? e("img",{src:f.url, alt:p.rot || "Foto do material", className:"size-full object-cover"}) : e(Ph,{n:f.erro ? "image-broken" : "image", s:22})),
    ab[0] && e(Ampliada,{url:f.url, erro:f.erro, rot:p.rot, fechar:function(){ ab[1](false); }}));
}

function BotaoFoto(p){
  var ab = useState(false), f = useFoto(ab[0] ? p.foto : null);
  if(!p.foto) return null;
  return e("span",{className:"contents"},
    e("button",{type:"button", title:"Ver a foto", "aria-label":"Ver a foto", onClick:function(ev){ ev.stopPropagation(); ab[1](true); }, className:"grid size-8 place-items-center rounded-lg bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/20"}, e(Ph,{n:"image", s:16})),
    ab[0] && e(Ampliada,{url:f.url, erro:f.erro, rot:p.rot, fechar:function(){ ab[1](false); }}));
}

function EscolherFoto(p){
  var st = useState({envia:false, erro:""}), v = st[0], set = st[1];
  var escolher = function(ev){
    var arq = ev.target.files && ev.target.files[0]; ev.target.value = ""; if(!arq) return;
    if(!/^image\//.test(arq.type || "")){ set({envia:false, erro:"Escolha uma foto (JPG, PNG ou WEBP)."}); return; }
    set({envia:true, erro:""});
    lerArquivo(arq).then(function(a){ return enviarAnexo("ce", a); }).then(function(r){ set({envia:false, erro:""}); p.onFoto({key:r.key, nome:r.nome}); },
      function(x){ set({envia:false, erro:(x && x.message) || "Não foi possível enviar a foto. Confira se o servidor está ligado."}); });
  };
  var cls = "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-bold ring-1 ";
  return e("div",{className:"flex flex-col items-center gap-1.5"},
    e("div",{className:"flex flex-wrap justify-center gap-1.5"},
      e("label",{className:cls+(p.disabled || v.envia ? "cursor-not-allowed bg-white/5 text-white/50 ring-white/10" : "cursor-pointer bg-[#2563EB]/30 text-white ring-[#3B82F6]/50 hover:bg-[#2563EB]/45")},
        e(Ph,{n:"image", s:15}), v.envia ? "Enviando a foto" : p.foto ? "Trocar foto" : "Anexar foto",
        e("input",{type:"file", accept:"image/*", className:"hidden", disabled:p.disabled || v.envia, onChange:escolher})),
      p.foto && e("button",{type:"button", disabled:p.disabled || v.envia, onClick:function(){ p.onFoto(null); }, className:cls+"bg-white/5 text-white ring-white/15 hover:bg-[#EF4444]/25 disabled:cursor-not-allowed disabled:text-white/50"}, e(Ph,{n:"trash", s:15}), "Remover foto")),
    v.erro && e("span",{className:"text-[11px] text-[#FCA5A5]"}, v.erro));
}

export { FotoMaterial, BotaoFoto, EscolherFoto };
