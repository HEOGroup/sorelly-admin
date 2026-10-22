// Sorelly Admin · montagem e bipagem — ui/relogio.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { tempoMont } from "@/apps/montagem/domain/regras";
import { dur } from "@/apps/montagem/lib/format";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useEffect, useState } from "@/shared/react";

function useAgora(){
  var r = useState(Date.now()), set = r[1];
  useEffect(function(){ var iv = setInterval(function(){set(Date.now());},1000); return function(){clearInterval(iv);}; },[]);
  return r[0];
}
function mmss(ms){ var s = Math.max(0, Math.floor((ms||0)/1000)); if(s>=3600) return Math.floor(s/3600)+"h"+String(Math.floor(s/60)%60).padStart(2,"0"); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); }
function Relogio(p){ var agora = useAgora(), t = tempoMont(p.k, agora); return e("span",{className:MONO+" "+(p.className||""), title:p.curto?dur(t):undefined}, p.curto ? mmss(t) : dur(t)); }
function RelogioB(p){ var agora = useAgora(), t = agora - p.desde; return e("span",{className:MONO+" "+(p.className||""), title:p.curto?dur(t):undefined}, p.curto ? mmss(t) : dur(t)); }

export { useAgora, mmss, Relogio, RelogioB };
