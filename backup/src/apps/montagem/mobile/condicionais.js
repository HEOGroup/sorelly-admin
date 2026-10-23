// Sorelly Admin · montagem e bipagem — mobile/condicionais.js
//
// Versão celular da conferência de condicionais: a funcionária anda até o
// armário com o telefone, confere revendedora por revendedora e libera cada
// uma assim que fechar — sem esperar o dia inteiro pra liberar tudo junto.
// Fica tudo na tela (conferindo e já liberada) até a listagem inteira concluir,
// pra ela não se perder.
import { condEstado, condVisiveisPre, condOkPre } from "@/apps/montagem/domain/condicionais";
import { modalidadeDe } from "@/apps/montagem/domain/consignado";
import { TIPO_KIT } from "@/apps/montagem/domain/status";
import { use } from "@/apps/montagem/state/context";
import { Vazio } from "@/apps/montagem/ui/card";
import { e, useState } from "@/shared/react";

var COR = {ok:"#34D399", falta:"#F87171", imp:"#A78BFA", pend:"#D9A63A"};
function ChipCond(p){
  var k = p.k, n = p.n, d = use().dispatch, st = condEstado(k, n);
  var cor = st.p ? COR.ok : st.falta ? COR.falta : st.imp ? COR.imp : COR.pend;
  var confirmar = function(){ d({type:"COND_CHK_PRE", id:k.id, num:n, v:!st.p}); };
  var faltar = function(){ d({type:"COND_FALTA", id:k.id, num:n, por:"celcond"}); };
  return e("span",{className:"inline-flex h-9 items-center overflow-hidden rounded-xl text-[12.5px] font-bold text-[#1B1409]"},
    e("button",{onClick:confirmar, className:"flex h-9 items-center gap-1 px-2.5", style:{background:cor}}, st.p ? "✓ " : st.falta ? "! " : st.imp ? "↻ " : "○ ", n),
    !st.p && e("button",{onClick:faltar, disabled:st.falta, title:"Não achei", className:"flex h-9 w-7 items-center justify-center bg-black/20 disabled:opacity-40", style:{background: st.falta ? cor : undefined}},"!"));
}
function AddNum(p){
  var d = use().dispatch, k = p.k, vs = useState(""), v = vs[0], setV = vs[1];
  var enviar = function(){ if(!v.trim()) return; d({type:"COND_ADD_NUM", id:k.id, num:v.trim()}); setV(""); };
  return e("div",{className:"flex h-9 items-center gap-1"},
    e("input",{value:v, onChange:function(ev){setV(ev.target.value);}, placeholder:"nº manual",
      className:"h-9 w-20 rounded-lg bg-white/10 px-2 text-[12px] text-white outline-none"}),
    e("button",{onClick:enviar, disabled:!v.trim(), className:"grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white disabled:opacity-40"},"+"));
}
function CardRevendedora(p){
  var cx = use(), s = cx.state, k = p.k, d = cx.dispatch, nums = condVisiveisPre(k), tipo = TIPO_KIT[k.tipoKit] || TIPO_KIT.acerto_kit, ok = condOkPre(k);
  var liberada = k.status!=="precond";
  return e("div",{className:"flex flex-col gap-2.5 rounded-2xl bg-[#1C1C1E] p-3.5"+(liberada?" opacity-60":"")},
    e("div",{className:"flex items-baseline justify-between gap-2"},
      e("b",{className:"truncate text-[14.5px]"}, k.prio && e("span",{className:"text-amber-300"},"★ "), k.rev, modalidadeDe(s, k.rev)==="prata" && e("span",{className:"ml-1.5 rounded-full bg-slate-300 px-1.5 py-px align-middle text-[9px] font-black tracking-wider text-slate-900"},"100% PRATA")),
      e("span",{className:"shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-[#8E8E93]"}, tipo[1])),
    e("p",{className:"text-[12px] text-[#8E8E93]"}, k.bairro),
    e("div",{className:"flex flex-wrap gap-1.5"}, nums.map(function(n){ return e(ChipCond,{key:n, k:k, n:n}); }), !liberada && e(AddNum,{key:"add", k:k})),
    liberada
      ? e("p",{className:"text-center text-[13px] font-semibold text-emerald-400"},"✓ Liberada")
      : e("button",{disabled:!ok, onClick:function(){ d({type:"LIBERAR_COND", ids:[k.id], por:"celcond"}); },
          className:"h-10 rounded-xl text-[13.5px] font-semibold disabled:opacity-40 "+(ok?"bg-linear-to-r from-[#B8862B] via-[#E8B84B] to-[#F1E4C6] text-[#1B1409]":"bg-white/10 text-[#8E8E93]")},
          ok ? "Liberar para a fila" : "Confira todas antes de liberar"));
}
function CelCondicionais(){
  var s = use().state;
  var doDia = s.kits.filter(function(k){ return k.status==="precond" || (k.cond && k.cond.liberadoEm); });
  if(!doDia.length) return e(Vazio,{txt:"Nenhuma revendedora esperando conferência."});
  return e("div",{className:"flex flex-col gap-2.5"}, doDia.map(function(k){ return e(CardRevendedora,{key:k.id, k:k}); }));
}

export { CelCondicionais };
