// Sorelly Admin · kits novos Curitiba — components/aviso.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { use } from "@/apps/kits-novos/state/context";
import { BADGE } from "@/apps/kits-novos/ui/badge";
import { e, useEffect } from "@/shared/react";

function Aviso(){ var cx = use(), s = cx.state, d = cx.dispatch;
  useEffect(function(){ if(!s.aviso) return; var t=setTimeout(function(){d({type:"LIMPAR_AVISO"});},2800); return function(){clearTimeout(t);}; },[s.aviso && s.aviso.t]);
  if(!s.aviso) return null; var tp = {ok:"success", atencao:"warning", alerta:"destructive"}[s.aviso.tom]||"success";
  return e("div",{role:"status", className:"fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg border bg-popover px-4 py-2.5 text-sm font-medium ring-1 ring-foreground/10 "+BADGE[tp]}, s.aviso.txt); }

export { Aviso };
