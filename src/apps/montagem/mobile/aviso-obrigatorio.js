// Sorelly Admin · montagem — mobile/aviso-obrigatorio.js
// AVISO OBRIGATÓRIO no meio da tela do app da representante (Marcus, 24/11/2026, desenho D): cartão creme com a faixa vermelha "OBRIGATÓRIO A LEITURA".
// Antes de 5 segundos o "Li e entendi" e o OK ficam escuros e travados. Depois, ela marca "Li e entendi" e toca em OK. Cada aviso aparece UMA vez só; vários vão um por um.
import { ESPERA_SEGUNDOS } from "@/apps/montagem/domain/avisos-rep";
import { e, useEffect, useState } from "@/shared/react";

// **negrito** vira <b>
function Texto(p){
  return e("span",null, String(p.t).split("**").map(function(parte, i){ return i%2 ? e("b",{key:i, className:"text-[#8A6A12]"}, parte) : parte; }));
}

function AvisoObrigatorioRep(p){
  var avisos = p.avisos || [], iS = useState(0), i = iS[0], setI = iS[1];
  var lS = useState(false), liberado = lS[0], setLiberado = lS[1];
  var mS = useState(false), marcado = mS[0], setMarcado = mS[1];
  var eS = useState(false), enviando = eS[0], setEnviando = eS[1];
  var aviso = avisos[i];
  useEffect(function(){ setLiberado(false); setMarcado(false); setEnviando(false);
    var t = setTimeout(function(){ setLiberado(true); }, ESPERA_SEGUNDOS*1000);
    return function(){ clearTimeout(t); }; }, [i]);
  if(!aviso) return null;
  var pode = liberado && marcado && !enviando;
  var ok = function(){ if(!pode) return; setEnviando(true);
    Promise.resolve(p.onConfirmar(aviso.id)).then(function(){ if(i+1<avisos.length) setI(i+1); else p.onFim(); }).catch(function(){ setEnviando(false); }); };
  return e("div",{role:"dialog", "aria-modal":true, "aria-label":"Aviso obrigatório", className:"fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4"},
    e("div",{className:"flex max-h-full w-full max-w-[400px] flex-col gap-3 overflow-y-auto rounded-3xl border-2 border-[#C9A13B] bg-[#FFF9EA] p-4 text-[#111827] shadow-2xl"},
      e("div",{className:"rounded-xl bg-[#DC2626] px-3 py-2 text-center text-[11px] font-extrabold leading-tight text-white"},
        "OBRIGATÓRIO A LEITURA", e("br"), "SE VOCÊ ASSINA, VOCÊ CONFIRMA QUE LEU E ENTENDEU"),
      e("p",{className:"text-[16px] font-extrabold leading-tight"}, aviso.titulo),
      e("ul",{className:"flex flex-col gap-2 text-[13px] leading-snug"}, aviso.itens.map(function(t, k){ return e("li",{key:k, className:"flex gap-2"}, e("span",{className:"mt-0.5 text-[#C9A13B]"}, "●"), e(Texto,{t:t})); })),
      e("div",{className:"flex items-center gap-2 pt-1"},
        e("label",{className:"flex h-8 min-w-0 flex-1 items-center gap-2 rounded-xl px-3 text-[13px] font-bold "+(liberado ? "cursor-pointer bg-white text-[#111827] ring-1 ring-[#C9A13B]" : "bg-[#2B2B2F] text-[#6B7280]")},
          e("input",{type:"checkbox", checked:marcado, disabled:!liberado || enviando, onChange:function(ev){ setMarcado(ev.target.checked); }, className:"size-4 shrink-0"}),
          "Li e entendi"),
        e("button",{type:"button", disabled:!pode, onClick:ok, className:"h-8 w-24 shrink-0 rounded-xl text-[13px] font-extrabold "+(pode ? "bg-[#C9A13B] text-white" : "bg-[#2B2B2F] text-[#6B7280]")}, enviando ? "Enviando" : "OK"))));
}

export { AvisoObrigatorioRep };
