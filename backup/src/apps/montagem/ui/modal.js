// Sorelly Admin · montagem e bipagem — ui/modal.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { Btn } from "@/apps/montagem/ui/button";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useEffect, useRef } from "@/shared/react";

function Modal(p){
  var ref = useRef(null);
  useEffect(function(){
    var d = ref.current; if(!d) return;
    if(p.open && !d.open) d.showModal();
    if(!p.open && d.open) d.close();
  },[p.open]);
  return e("dialog",{ref:ref, onClose:p.onClose,
      className:"m-auto rounded-xl bg-popover p-0 text-popover-foreground ring-1 ring-foreground/10 backdrop:bg-black/60"},
    p.open && e("div",{className:"flex w-[min(34rem,92vw)] flex-col gap-4 p-5"},
      e("div",{className:"flex items-start justify-between gap-3"},
        e("div",null, e("h3",{className:"font-heading text-lg font-semibold tracking-wide"}, p.titulo),
          p.sub && e("p",{className:"text-sm text-muted-foreground"}, p.sub)),
        e("button",{type:"button", "aria-label":"Fechar", onClick:p.onClose, className:"grid size-9 place-items-center rounded-lg hover:bg-muted/50"}, e(Icon,{n:"x"}))),
      p.children,
      e("div",{className:"flex justify-end gap-2 border-t border-border pt-4"},
        e(Btn,{v:"ghost", onClick:p.onClose},"Cancelar"),
        e(Btn,{v:p.perigo?"destructive":"primary", ic:p.icone, disabled:p.desabilitado, onClick:p.onConfirmar}, p.confirmar))));
}

export { Modal };
