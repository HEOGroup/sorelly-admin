// Sorelly Admin · montagem — pages/encomendas/visual.js
// Apoio das telas de Encomendas e Reposições (cor do setor: turquesa #14B8A6). Seletores, indicador e selo vêm de pages/compras/visualCompras.js (neutros); botões e colunas de janela são turquesa.
//   useEr()   estado s.er, quem está logado, se pode configurar (diretoria) e exec(op, dados) → true se o domínio aceitou (a recusa aparece no aviso do sistema)
//   Bt, BtMini, Painel, copiar(t)
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { erReduz, podeConfigurar } from "@/apps/montagem/domain/encomendas";
import { use } from "@/apps/montagem/state/context";
import { e } from "@/shared/react";

var TURQ = "#14B8A6";

function useEr(){
  var cx = use(), s = cx.state, d = cx.dispatch, por = nomeDe(s.usuario);
  var exec = function(op, dados){ var a = Object.assign({type:"ER", op:op, por:por}, dados||{}); var r = erReduz(s, a); d(a); return !!(r.patch && r.patch.er); };
  return {s:s, er:s.er, cfg:s.er.config, por:por, pode:podeConfigurar(s.usuario), exec:exec};
}
function copiar(t){
  try{ if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(t); return true; } }catch(x){}
  try{ var a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select(); document.execCommand("copy"); a.remove(); return true; }catch(x){ return false; }
}

var BT = {normal:"bg-muted/50 hover:bg-white/15", forte:"bg-[#14B8A6] text-[#06312C] hover:bg-[#2DD4BF]", perigo:"bg-[#EF4444]/20 text-[#F87171] ring-1 ring-[#EF4444]/50 hover:bg-[#EF4444]/30"};
function Bt(p){ return e("button",{type:"button", onClick:p.onClick, disabled:p.disabled, title:p.titulo, className:"inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40 "+BT[p.tipo||"normal"]+" "+(p.className||"")}, p.ic && e(Ph,{n:p.ic, s:15}), p.children); }
function BtMini(p){ return e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); p.onClick(); }, disabled:p.disabled, title:p.titulo, className:"inline-flex items-center justify-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-bold transition disabled:opacity-40 "+(p.forte ? "bg-[#14B8A6]/25 text-[#99F6E4] ring-1 ring-[#14B8A6]/50 hover:bg-[#14B8A6]/35" : "bg-white/10 hover:bg-white/15")}, p.ic && e(Ph,{n:p.ic, s:13}), p.children); }
// coluna de janela: "feito" = já preenchido (verde, passa para o lado); "atual" = em destaque (turquesa)
function Painel(p){
  var feito = p.estado==="feito", atual = p.estado==="atual";
  return e("section",{className:"flex min-w-0 flex-col gap-2 rounded-xl p-2.5 text-center "+(p.className||""),
      style:atual ? {background:"linear-gradient(160deg, #14B8A633, rgba(0,0,0,.25))", boxShadow:"inset 0 0 0 2px #14B8A6AA"} : feito ? {background:"linear-gradient(160deg, #22C55E1F, rgba(0,0,0,.22))", boxShadow:"inset 0 0 0 1px #22C55E55"} : {background:"rgba(0,0,0,.22)", boxShadow:"inset 0 0 0 1px rgba(255,255,255,.1)"}},
    p.t && e("div",{className:"flex items-center justify-center gap-1.5 text-[12px] font-bold uppercase tracking-wide "+(feito ? "text-[#4ADE80]" : atual ? "text-[#99F6E4]" : "text-white/75")}, e(Ph,{n:feito ? "check-circle" : (p.ic || "circle"), s:15, fill:feito}), p.t),
    p.children);
}
// botões de escolha (tipo, forma): ops = [[valor, rótulo]]
function Escolha(p){
  return e("div",{className:"flex flex-wrap justify-center gap-1.5"}, p.ops.map(function(o){ var on = p.v===o[0];
    return e("button",{key:o[0], type:"button", onClick:function(){ p.set(o[0]); }, className:"rounded-lg px-3 py-1.5 text-[12.5px] font-bold ring-1 transition "+(on ? "text-white" : "bg-muted/40 text-white/85 ring-white/15 hover:bg-white/10"),
      style:on ? {background:"linear-gradient(135deg,"+TURQ+"66,"+TURQ+"22)", boxShadow:"inset 0 0 0 1px "+TURQ+"cc"} : undefined}, o[1]); }));
}
export { TURQ, useEr, copiar, Bt, BtMini, Painel, Escolha };
