// Sorelly Admin · montagem — components/atalhos-admin.js
// Botões embaixo do celular de um app: levam direto às telas do ADMIN onde as informações geradas por aquele app aparecem (ex.: app da revendedora → Preferências do kit, Link de pagamento, Erros em produtos).
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e } from "@/shared/react";

// itens = [[rótulo, chave da aba, ícone]]
function AtalhosAdmin(p){
  var d = use().dispatch;
  return e("div",{className:"flex w-full max-w-[340px] flex-col items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10"},
    e("span",{className:"text-[11px] font-bold uppercase tracking-wider text-white/60"}, p.titulo || "Ver no admin"),
    e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"}, p.itens.map(function(it){
      return e("button",{key:it[1], type:"button", onClick:function(){ d({type:"ABA", aba:it[1]}); }, className:"flex h-8 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-[12.5px] font-semibold text-white hover:bg-white/20"}, e(Icon,{n:it[2]||"chevron", s:13}), it[0]); })));
}
// o que o app da revendedora gera no admin
var ATALHOS_REVENDEDORA = [["Preferências do kit", "prefkit", "gem"], ["Link de pagamento", "linkpag", "banco"], ["Erros em produtos", "marketing", "alert"]];
export { AtalhosAdmin, ATALHOS_REVENDEDORA };
