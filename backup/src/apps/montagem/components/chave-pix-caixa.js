// Sorelly Admin · montagem — components/chave-pix-caixa.js
// Chave Pix de uma conta bancária do Caixa (Saldo das contas): o mesmo campo aparece no Caixa e no Controle de pagamentos e grava no mesmo lugar (s.px).
import { contaDaCaixa } from "@/apps/montagem/domain/pix-regras";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { use } from "@/apps/montagem/state/context";
import { INPUT } from "@/apps/montagem/ui/input";
import { e } from "@/shared/react";

export function ChavePixCaixa(p){
  var cx = use(), conta = contaDaCaixa(cx.state.px, p.caixa[0]), chave = (conta && conta.chave) || "";
  return e("input",{key:p.caixa[0]+"|"+chave, defaultValue:chave, placeholder:"chave Pix", "aria-label":"Chave Pix de "+p.caixa[1], disabled:p.edita===false,
    className:INPUT+" h-8! "+(p.className||"w-52")+" text-center text-[12px]!", onClick:function(ev){ ev.stopPropagation(); },
    onBlur:function(ev){ var v = ev.target.value.trim(); if(v!==chave) cx.dispatch({type:"PX", op:"caixa_chave", caixaId:p.caixa[0], nome:p.caixa[1], cnpj:p.caixa[2], chave:v, em:Date.now(), por:nomeDe(cx.state.usuario)}); }});
}
