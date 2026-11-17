// Sorelly Admin · montagem — components/fotos-pref.js
// Fotos que a revendedora mandou nas preferências (até 3 por bloco): miniaturas; tocar abre a foto grande, tocar de novo fecha.
// Usada na janela do computador (janela-montar.js) e no cartão do celular (etiqueta.js).
import { e, useState } from "@/shared/react";

function Fotos(p){
  var st = useState(null), grande = st[0], setGrande = st[1];
  if(!p.lista || !p.lista.length) return null;
  return e("span",{className:"inline-flex flex-wrap items-center gap-1.5"},
    p.lista.map(function(u, i){ return e("button",{key:i, type:"button", title:"Abrir foto", "aria-label":"Abrir foto "+(i+1), onClick:function(){ setGrande(u); }, className:"overflow-hidden rounded border border-border", style:{width:44, height:44}}, e("img",{src:u, alt:"Foto "+(i+1)+" enviada pela revendedora", loading:"lazy", style:{width:"100%", height:"100%", objectFit:"cover"}})); }),
    grande && e("div",{className:"fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4", onClick:function(){ setGrande(null); }}, e("img",{src:grande, alt:"Foto ampliada", style:{maxWidth:"92vw", maxHeight:"88vh", objectFit:"contain"}})));
}

export { Fotos };
