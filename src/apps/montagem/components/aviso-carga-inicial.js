// Sorelly Admin · montagem — components/aviso-carga-inicial.js
// Cartãozinho flutuante no alto da tela (por cima do sistema, sem ocupar espaço), só para a Diretoria, na primeira vez que ela entra com o servidor ligado:
// escolher qual cópia dos dados vale (a deste navegador, com o que foi digitado aqui, ou a do servidor). Enquanto não escolhe, nada é trocado nem enviado (lib/sync-modulos.js).
import { enviarTudoDoNavegador, usarServidor } from "@/apps/montagem/lib/sync-modulos";
import { e, useState } from "@/shared/react";

function AvisoCargaInicial(p){
  var sb = useState(false), ocupado = sb[0], setOcupado = sb[1], sm = useState(""), msg = sm[0], setMsg = sm[1], sc = useState(false), confirma = sc[0], setConfirma = sc[1];
  if(p.modo!=="pendente") return null;
  var subir = function(){
    if(ocupado) return;
    if(!confirma){ setConfirma(true); return; }   // segundo toque confirma (sem janela do navegador, que pode estar bloqueada)
    setOcupado(true); setMsg("");
    enviarTudoDoNavegador(p.s).then(function(r){ setOcupado(false); setConfirma(false); if(r.falhas.length) setMsg("Alguns módulos não subiram: "+r.falhas.join(" · ")); }).catch(function(x){ setOcupado(false); setMsg(x.message); });
  };
  var btn = "h-7 rounded-md border px-2.5 text-[13px] font-semibold ";
  return e("div",{role:"status", className:"pointer-events-none fixed inset-x-0 top-1 z-[80] flex justify-center px-2"},
    e("div",{className:"pointer-events-auto flex max-w-full items-center gap-1.5 rounded-lg border border-primary/50 bg-[#1b1710] px-2 py-1 text-[13px] shadow-xl"},
      e("span",{className:"font-semibold"}, "Dados:"),
      e("button",{type:"button", disabled:ocupado, onClick:subir, title:"Envia o que foi digitado neste navegador para o servidor (uma cópia da versão anterior fica guardada)", className:btn+(confirma ? "border-warning bg-warning/20 text-warning" : "border-primary bg-primary/20 text-primary hover:bg-primary/30")}, ocupado ? "Enviando…" : confirma ? "Confirmar" : "Deste navegador"),
      confirma && !ocupado && e("button",{type:"button", onClick:function(){ setConfirma(false); }, className:btn+"border-border bg-card text-foreground hover:bg-white/10"}, "Cancelar"),
      !confirma && e("button",{type:"button", disabled:ocupado, onClick:usarServidor, title:"Usa os dados do servidor e some daqui", className:btn+"border-border bg-card text-foreground hover:bg-white/10"}, "Do servidor"),
      msg && e("span",{className:"font-semibold text-destructive"}, msg)));
}
export { AvisoCargaInicial };
