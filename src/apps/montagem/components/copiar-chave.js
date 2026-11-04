// Sorelly Admin · montagem — components/copiar-chave.js
// Botão "Copiar" da chave Pix (usado em Chaves Pix e regras e nas contas bancárias do Financeiro). Mostra "Copiado" por um instante.
import { mensagemPixDaChave, mensagemPixPessoa } from "@/apps/montagem/lib/mensagem-pix";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

function CopiarChave(p){
  var cx = use(), st = useState(0), ok = st[0];   // 0 = normal, 1 = copiou, 2 = o navegador não deixou copiar
  var copiar = function(){
    var txt = mensagemPixDaChave(cx.state, p.texto) || (p.dados ? mensagemPixPessoa(Object.assign({}, p.dados, {chave:String(p.texto)})) : String(p.texto));   // pessoa: nome, banco, chave e pedido de comprovante
    var fim = function(v){ st[1](v); setTimeout(function(){ st[1](0); }, 1800); };
    // alguns navegadores (inclusive o do app do Claude) negam a cópia moderna; aí vale o método antigo, e só avisa "Copiado" se copiou de verdade (Marcus, 04/11/2026)
    var antigo = function(){ var ta = document.createElement("textarea"), certo = false; ta.value = txt; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.focus(); ta.select(); try { certo = document.execCommand("copy"); } catch(x){} document.body.removeChild(ta); fim(certo ? 1 : 2); };
    try { navigator.clipboard.writeText(txt).then(function(){ fim(1); }, antigo); } catch(x){ antigo(); }
  };
  return e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); ev.preventDefault(); copiar(); }, title:"Copiar a chave Pix", "aria-label":"Copiar a chave Pix",
    className:"inline-flex h-8 shrink-0 items-center justify-center rounded-md px-2 text-[11px] font-bold "+(ok===1 ? "bg-emerald-500/30 text-emerald-100" : ok===2 ? "bg-red-500/30 text-red-100" : "bg-white/10 text-white hover:bg-white/20")}, ok===1 ? "Copiado ✓" : ok===2 ? "Não copiou" : (p.rot || "Copiar Pix"));
}
export { CopiarChave };
