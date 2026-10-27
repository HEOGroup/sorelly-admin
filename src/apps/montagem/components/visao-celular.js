// Sorelly Admin — components/visao-celular.js
// Visão dividida (24/10/2026, pedido do Marcus): na própria tela do Admin, um botão "Ver no celular" abre ao lado a MESMA tela
// na versão de celular, com as mesmas cores e os mesmos dados. O celular é o Admin em tela estreita, não um app à parte.
// Uso: e(ComCelular, {app:"condicionais"}, ...tela do computador). O celular (iPhone 13) abre pela Entrada, passa pelo Início e vai direto para a tela indicada.
import { CelularAdmin } from "@/apps/montagem/mobile/celular-admin";
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { e, useState } from "@/shared/react";

var CHAVE = "sorelly_visao_celular";
function lerAberto(){ try { return localStorage.getItem(CHAVE)==="1"; } catch(x){ return false; } }

function ComCelular(p){
  var st = useState(lerAberto), on = st[0], setOn = st[1];
  var trocar = function(){ var v = !on; setOn(v); try { localStorage.setItem(CHAVE, v ? "1" : "0"); } catch(x){} };
  return e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"flex justify-end"}, e(Botao,{onClick:trocar, title:"Mostra ao lado a mesma tela como fica no celular"}, on ? "Fechar celular" : "Ver no celular")),
    e("div",{className:"flex items-start gap-4"},
      e("div",{className:"flex min-w-0 flex-1 flex-col gap-3"}, p.children),
      on && e("div",{className:"sticky top-2 shrink-0"},
        e("p",{className:"mb-1 text-center text-[11px] font-medium uppercase tracking-[.05em] text-muted-foreground"}, "Celular"),
        e(CelularAdmin,{abrir:p.app}))));
}

export { ComCelular };
