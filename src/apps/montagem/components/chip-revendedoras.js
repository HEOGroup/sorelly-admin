// Sorelly Admin · montagem — components/chip-revendedoras.js
// Total de revendedoras da empresa, fixo na barra de cima dos setores que usam a base (Financeiro, Agendamento, Cadastro de revendedoras).
// Única fonte: s.revendedorasDiario (lançado por quem atualiza na Visão geral). Clicar abre a Base de revendedoras.
import { resumoMensalRevendedoras } from "@/apps/montagem/domain/financeiro";
import { e } from "@/shared/react";

function ChipRevendedoras(p){
  var s = p.s, hist = s.revendedorasDiario || {}, ks = Object.keys(hist).sort();
  if(!ks.length) return null;
  var total = hist[ks[ks.length-1]], mes = resumoMensalRevendedoras(s, new Date().getFullYear()).filter(function(l){ return l.atual; })[0], delta = mes ? mes.delta : null;
  var sinal = delta===null || delta===undefined ? "" : (delta>=0 ? "+" : "−")+Math.abs(Math.round(delta)).toLocaleString("pt-BR")+" no mês";
  return e("button",{type:"button", onClick:function(){ p.d({type:"ABA", aba:"revendedoras"}); }, title:"Abrir a Base de revendedoras", className:"ml-auto flex shrink-0 items-center gap-2 self-center rounded-lg bg-black/30 px-3 py-1 ring-1 ring-white/15 hover:bg-black/45"},
    e("span",{className:"text-[10px] font-bold uppercase tracking-[.12em] text-white/70"}, "Revendedoras"),
    e("b",{className:"font-mono text-[16px] leading-none text-[#F3D98B]"}, total.toLocaleString("pt-BR")),
    sinal && e("span",{className:"text-[11px] text-white/60"}, sinal));
}
export { ChipRevendedoras };
