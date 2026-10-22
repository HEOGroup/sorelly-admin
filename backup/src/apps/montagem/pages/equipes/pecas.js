// Sorelly Admin · montagem — pages/equipes/pecas.js
// Peças e ligação com o estado da tela Equipes (RH). Reaproveita campos de pages/compras/visualCompras.js; só os botões e a confirmação usam o roxo do RH.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { eqPodeEditar, eqReduz } from "@/apps/montagem/domain/equipes";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { use } from "@/apps/montagem/state/context";
import { e } from "@/shared/react";

var ROXO = "#8B5CF6";
var SEM_AUT = "Sem autorização";
var cap = function(t){ return typeof t==="string" && t ? t.charAt(0).toUpperCase()+t.slice(1) : t; };

// ligação com o domínio: s.eq, quem está logado (por), se pode editar e exec(op, dados) que manda a ação EQ
function useEquipes(){
  var cx = use(), s = cx.state, d = cx.dispatch, por = nomeDe(s.usuario);
  var exec = function(op, dados){ var a = Object.assign({type:"EQ", op:op, por:por}, dados||{}); var r = eqReduz(s, a); d(a); return !!(r.patch && r.patch.eq); };
  return {s:s, eq:s.eq, por:por, pode:eqPodeEditar(s, por), exec:exec};
}

var BT = {normal:"bg-muted/50 hover:bg-white/15", forte:"bg-[#8B5CF6] text-white hover:bg-[#A78BFA]", perigo:"bg-[#EF4444]/20 text-[#F87171] ring-1 ring-[#EF4444]/50 hover:bg-[#EF4444]/30", marca:"bg-[#8B5CF6]/25 text-[#DDD6FE] ring-1 ring-[#8B5CF6]/60"};
// Botão com texto (e ícone). semAut = mostra a dica "Sem autorização" quando desabilitado por falta de permissão
function Bt(p){ return e("button",{type:"button", onClick:p.onClick, disabled:p.disabled, title:p.disabled && p.semAut ? SEM_AUT : p.titulo, className:"inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40 "+BT[p.tipo||"normal"]+" "+(p.className||"")}, p.ic && e(Ph,{n:p.ic, s:15}), p.children); }
// Botão só de ícone (dica obrigatória)
function Ic(p){ return e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); p.onClick(); }, disabled:p.disabled, "aria-label":p.titulo, title:p.disabled && p.semAut ? p.titulo+" · "+SEM_AUT : p.titulo,
  className:"grid size-7 place-items-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-35 "+(p.forte ? "bg-[#8B5CF6]/30 ring-1 ring-[#8B5CF6]/60 hover:bg-[#8B5CF6]/45" : p.perigo ? "bg-[#EF4444]/15 text-[#F87171] hover:bg-[#EF4444]/30" : "bg-white/10 hover:bg-white/20")}, e(Ph,{n:p.ic, s:15})); }
// Chip de pessoa (supervisão em destaque dourado)
function ChipPessoa(p){
  var sup = p.papel==="SUPERVISOR";
  return e("span",{title:(sup ? "Supervisão" : "Funcionário(a)")+(p.vinculada ? " · vinculada ao quadro" : ""), className:"inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-bold "+(sup ? "bg-[#E8B84B]/25 text-[#F3D98B] ring-1 ring-[#E8B84B]/60" : "bg-white/10 text-white/90 ring-1 ring-white/15")},
    sup && e(Ph,{n:"crown", s:12, fill:true}), e("span",{className:"truncate"}, p.nome));
}
// Confirmação pequena (aviso formal antes de uma ação de efeito grande)
function Confirma(p){
  return e("div",{className:"fixed inset-0 z-[60] grid place-items-center bg-black/60 p-3", onClick:p.fechar},
    e("div",{onClick:function(ev){ ev.stopPropagation(); }, className:"flex w-full max-w-md flex-col items-center gap-3 rounded-2xl bg-card p-4 text-center ring-1 ring-white/20"},
      e(Ph,{n:p.ic||"warning", s:28, className:"text-[#FBBF24]"}),
      e("h2",{className:"font-heading text-lg font-bold"}, cap(p.t)),
      e("p",{className:"text-[13px] text-white/80"}, cap(p.texto)),
      e("div",{className:"flex flex-wrap justify-center gap-2"}, e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{tipo:p.perigo ? "perigo" : "forte", ic:"check", onClick:p.confirmar}, p.rotulo||"Confirmar"))));
}

export { ROXO, SEM_AUT, cap, useEquipes, Bt, Ic, ChipPessoa, Confirma };
