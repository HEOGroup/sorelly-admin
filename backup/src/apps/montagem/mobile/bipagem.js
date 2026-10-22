// Sorelly Admin · montagem e bipagem — mobile/bipagem.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { modalidadeDe } from "@/apps/montagem/domain/consignado";
import { TIPO_KIT } from "@/apps/montagem/domain/status";
import { IPhone15 } from "@/apps/montagem/mobile/iphone";
import { Avatar } from "@/apps/montagem/mobile/theme";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useState } from "@/shared/react";
import React from "react";

var OURO_APP = "bg-linear-to-r from-[#B8862B] via-[#E8B84B] to-[#F1E4C6] text-[#1B1409]";
function AppBipagemRetirada(p){
  var cx = use(), s = cx.state, d = cx.dispatch, bip = p.bip;
  var abertas = s.listagens.filter(function(l){return !l.fechada;});
  var sl = useState(null), lid = sl[0], setLid = sl[1];
  var sk = useState({}), sel = sk[0], setSel = sk[1];
  var l = lid && s.listagens.find(function(x){return x.id===lid;});
  var prontos = l ? s.kits.filter(function(k){return k.lid===l.id && k.status==="bipado";}) : [];
  var pend = l && (s.retPend||[]).find(function(r){return r.lid===l.id;});
  var ids = prontos.filter(function(k){return sel[k.id];}).map(function(k){return k.id;});
  var escolher = function(id){ var o = {}; s.kits.forEach(function(k){ if(k.lid===id && k.status==="bipado") o[k.id] = true; }); setSel(o); setLid(id); };
  return e(p.semMoldura ? React.Fragment : IPhone15,null,
    e("div",{className:"mb-3 flex items-center gap-3"},
      e(Avatar,{nome:bip.nome, i:0}),
      e("div",{className:"min-w-0 flex-1"}, e("p",{className:"text-[12px] text-[#8E8E93]"},"Bipagem · retirada"), e("p",{className:"truncate text-xl font-bold"}, bip.nome))),
    !l ? e("div",{className:"flex flex-col gap-2"},
        e("p",{className:"px-1 text-[13px] font-semibold"},"Qual representante está aqui?"),
        abertas.map(function(x){ var n = s.kits.filter(function(k){return k.lid===x.id && k.status==="bipado";}).length, pd = (s.retPend||[]).some(function(r){return r.lid===x.id;});
          return e("button",{key:x.id, onClick:function(){escolher(x.id);}, className:"flex items-center gap-3 rounded-2xl bg-[#1C1C1E] px-3 py-3 text-left"},
            e(Avatar,{nome:x.rep, i:0, className:"size-9 text-sm"}),
            e("div",{className:"min-w-0 flex-1"}, e("b",{className:"block text-[15px]"}, x.rep), e("span",{className:"text-[12px] text-[#8E8E93]"},"Retirada "+x.horario)),
            pd ? e("span",{className:"rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-semibold text-amber-200"},"aguardando") :
            e("span",{className:"rounded-full px-2 py-0.5 text-[12px] font-bold "+(n?"bg-emerald-400/20 text-emerald-300":"bg-white/10 text-[#8E8E93]")}, n+" prontos")); }))
    : e("div",{className:"flex flex-col gap-2.5"},
        e("button",{onClick:function(){setLid(null);}, className:"self-start text-[13px] text-amber-200"},"‹ Trocar representante"),
        e("div",{className:"rounded-2xl p-3 "+OURO_APP}, e("p",{className:"text-[12px] font-semibold opacity-80"},"Retirada com"), e("p",{className:"text-lg font-bold"}, l.rep)),
        pend ? e("div",{className:"flex flex-col items-center gap-2 rounded-2xl bg-amber-400/15 p-4 text-center ring-1 ring-amber-400/30"},
            e(Icon,{n:"clock", s:26, className:"text-amber-300"}),
            e("b",{className:"text-[15px] text-amber-200"},"Aguardando "+l.rep+" confirmar"),
            e("p",{className:"text-[12px] text-white/70"}, pend.ids.length+(pend.ids.length>1?" kits enviados para o app dela.":" kit enviado para o app dela.")+" Assim que ela confirmar o recebimento, os kits saem como retirados."))
        : prontos.length===0 ? e("div",{className:"rounded-2xl bg-[#1C1C1E] p-4 text-center text-[13px] text-[#8E8E93]"},"Nenhum kit bipado pronto para esta representante.")
        : e(React.Fragment,null,
            e("p",{className:"px-1 text-[13px] font-semibold"},"Marque os kits que ela está levando"),
            e("div",{className:"overflow-hidden rounded-2xl bg-[#1C1C1E]"}, prontos.map(function(k){
              return e("label",{key:k.id, className:"flex cursor-pointer items-center gap-3 border-b border-white/5 px-3 py-2.5 text-[14px] last:border-0"},
                e("input",{type:"checkbox", checked:!!sel[k.id], onChange:function(){ var o = Object.assign({}, sel); o[k.id] = !o[k.id]; setSel(o); }, className:"size-5 accent-amber-400"}),
                e("span",{className:"min-w-0 flex-1 truncate"}, k.rev, modalidadeDe(s, k.rev)==="prata" && e("span",{className:"ml-1.5 rounded-full bg-slate-300 px-1.5 py-px align-middle text-[9px] font-black tracking-wider text-slate-900"},"100% PRATA")), e("span",{className:"text-[12px] text-amber-200"}, (TIPO_KIT[k.tipoKit]||TIPO_KIT.acerto_kit)[1])); })),
            e("button",{disabled:!ids.length, onClick:function(){ d({type:"SOLICITAR_RET", lid:l.id, ids:ids, por:bip.id}); },
              className:"h-12 rounded-2xl text-[15px] font-semibold disabled:opacity-40 "+OURO_APP}, "Solicitar retirada de "+ids.length+(ids.length===1?" kit":" kits")),
            e("p",{className:"px-1 text-center text-[12px] text-[#8E8E93]"},"A solicitação vai para o app da representante, que confirma o recebimento."))));
}

export { OURO_APP, AppBipagemRetirada };
