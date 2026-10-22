// Sorelly Admin · montagem — components/copiar-chave.js
// Botão "Copiar" da chave Pix (usado em Chaves Pix e regras e nas contas bancárias do Financeiro). Mostra "Copiado" por um instante.
import { e, useState } from "@/shared/react";

function CopiarChave(p){
  var st = useState(false), ok = st[0];
  var copiar = function(){
    var fim = function(){ st[1](true); setTimeout(function(){ st[1](false); }, 1600); };
    try { navigator.clipboard.writeText(String(p.texto)).then(fim, fim); } catch(x){ fim(); }
  };
  return e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); ev.preventDefault(); copiar(); }, title:"Copiar a chave Pix", "aria-label":"Copiar a chave Pix",
    className:"inline-flex h-7 shrink-0 items-center justify-center rounded-md px-2 text-[11.5px] font-bold "+(ok ? "bg-emerald-500/30 text-emerald-100" : "bg-white/10 text-white hover:bg-white/20")}, ok ? "Copiado ✓" : (p.rot || "Copiar Pix"));
}
export { CopiarChave };
