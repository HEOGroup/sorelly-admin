// Sorelly Admin · montagem — pages/preferencias-kit/visual.js
// Peças visuais só de Preferências do kit (setor Kits, cor ouro #E8B84B), usadas pelas 4 abas.
// Regras de negócio NÃO ficam aqui (estão em domain/preferencias-kit.js).
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { use } from "@/apps/montagem/state/context";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e } from "@/shared/react";

var OURO = "#E8B84B", PRATA = "#CBD5E1", COR_SETOR = "#E8B84B";
var MCOR = {"Ouro":OURO, "Prata":PRATA, "Ouro + Prata":"#F3D98B"};
var SITCOR = {sem:"#94A3B8", pendente:"#FBBF24", montado:"#4ADE80"};
var cap1 = function(t){ return typeof t==="string" && t ? t.charAt(0).toUpperCase()+t.slice(1) : t; };
var pct1 = function(v){ return (Math.round((v||0)*10)/10).toFixed(1).replace(".", ",")+"%"; };

// acesso ao estado e à ação do módulo: pk("rev_add", {...}) já leva quem fez
function usePk(){
  var c = use(), s = c.state, por = nomeDe(s.usuario);
  return {s:s, pk:function(op, x){ c.dispatch(Object.assign({type:"PK", op:op, por:por}, x||{})); }};
}

// botões
var BT = {normal:"bg-muted/50 hover:bg-white/15", forte:"bg-[#E8B84B] text-black hover:bg-[#F3D98B]", perigo:"bg-[#EF4444]/20 text-[#F87171] ring-1 ring-[#EF4444]/50 hover:bg-[#EF4444]/30", ok:"bg-[#22C55E]/25 text-[#4ADE80] ring-1 ring-[#22C55E]/50 hover:bg-[#22C55E]/35"};
function Bt(p){ return e("button",{type:"button", onClick:p.onClick, disabled:p.disabled, title:p.titulo, className:"inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40 "+BT[p.tipo||"normal"]+" "+(p.className||"")}, p.ic && e(Ph,{n:p.ic, s:15}), p.children); }
// botão só de ícone (aria-label e dica obrigatórios)
function Ic(p){ return e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); p.onClick(); }, disabled:p.disabled, "aria-label":p.titulo, title:p.titulo,
  className:"grid size-8 place-items-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-30 "+(p.forte ? "bg-[#E8B84B]/30 ring-1 ring-[#E8B84B]/60 hover:bg-[#E8B84B]/45" : p.perigo ? "bg-[#EF4444]/15 text-[#F87171] hover:bg-[#EF4444]/30" : "bg-white/10 hover:bg-white/20")}, e(Ph,{n:p.ic, s:16})); }
function Selo(p){ var c = p.cor || "#94A3B8"; return e("span",{title:p.titulo, className:"inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold", style:{background:c+"26", color:c, boxShadow:"inset 0 0 0 1px "+c+"55"}}, p.ic && e(Ph,{n:p.ic, s:12}), p.children); }
// degradê claro por cor (cartões)
function grad(c){ return {background:"linear-gradient(135deg,"+c+"30,"+c+"0d 78%)", boxShadow:"inset 0 0 0 1px "+c+"44"}; }

// campos
var H9 = "h-9! text-[13px]!";
function Campo(p){ return e("label",{className:"flex min-w-0 flex-col gap-1 text-center"}, e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/75"}, p.rot), p.children, p.dica && e("span",{className:"text-[11px] text-white/55"}, cap1(p.dica))); }
function Txt(p){ return e("input",{type:p.tipo||"text", value:p.v, placeholder:p.ph, maxLength:p.max, "aria-label":p.rot, min:p.min, max:p.maxv, onChange:function(ev){ p.set(ev.target.value); }, className:INPUT+" "+H9+" w-full text-center "+(p.className||"")}); }
function Area(p){ return e("textarea",{value:p.v, placeholder:p.ph, rows:p.rows||4, "aria-label":p.rot, onChange:function(ev){ p.set(ev.target.value); }, className:INPUT+" h-auto! w-full resize-y py-2! text-center text-[13px]! "+(p.className||"")}); }
function Busca(p){
  return e("div",{className:"relative min-w-48 max-w-sm flex-1 basis-56"}, e(Ph,{n:"magnifying-glass", s:15, className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/60"}),
    e("input",{type:"search", value:p.v, placeholder:p.ph, "aria-label":p.ph, onChange:function(ev){ p.set(ev.target.value); }, className:INPUT+" "+H9+" w-full pl-9 text-center"}));
}
// opcoes = [[valor, rótulo]]; o primeiro item "" é o "todos"
function Sel(p){
  return e("select",{value:p.v, "aria-label":p.rot, title:p.rot, onChange:function(ev){ p.set(ev.target.value); }, className:INPUT+" "+H9+" cursor-pointer text-center "+(p.className||"")},
    [["", p.todos || p.rot]].concat(p.opcoes).map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }));
}
function Data(p){
  return e("label",{className:"inline-flex items-center gap-1.5 rounded-lg bg-white/5 pl-2.5 text-[12px] font-bold ring-1 ring-white/10"}, e(Ph,{n:"calendar-blank", s:14, className:"text-white/70"}), p.rot,
    e("input",{type:"date", value:p.v, "aria-label":p.rot, onChange:function(ev){ p.set(ev.target.value); }, className:INPUT+" "+H9+" w-36 border-0! bg-transparent! text-center"}));
}
// botão de opção (liga/desliga ou escolha entre poucas)
function Chip(p){ return e("button",{type:"button", "aria-pressed":!!p.on, disabled:p.disabled, onClick:p.onClick, title:p.titulo, className:"inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-bold transition disabled:opacity-40 "+(p.on ? "bg-[#E8B84B] text-black" : "bg-white/10 hover:bg-white/20")}, p.ic && e(Ph,{n:p.ic, s:13}), p.children); }
function Interruptor(p){
  return e("button",{type:"button", role:"switch", "aria-checked":!!p.on, "aria-label":p.rot, title:p.rot, onClick:p.onClick, className:"relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition "+(p.on ? "bg-[#E8B84B]" : "bg-white/20")},
    e("span",{className:"absolute size-4.5 rounded-full bg-white shadow transition-all "+(p.on ? "left-[22px]" : "left-[3px]")}));
}
function Avatar(p){
  var t = String(p.nome||"?").trim().split(/\s+/).filter(Boolean), s = p.s || 30, ini = ((t[0]||"?").charAt(0)+(t.length>1 ? t[t.length-1].charAt(0) : "")).toUpperCase();
  return e("span",{"aria-hidden":true, className:"inline-grid shrink-0 place-items-center rounded-full font-bold text-black", style:{width:s, height:s, fontSize:Math.round(s*0.4), background:"linear-gradient(135deg,"+OURO+","+OURO+"88)"}}, ini);
}

// blocos de apoio
function Vazio(p){ return e("div",{className:"flex flex-col items-center justify-center gap-2 rounded-xl bg-black/20 px-4 py-6 text-center text-[13px] text-white/70 ring-1 ring-white/10"}, e(Ph,{n:p.ic || "tray", s:26, className:"text-white/45"}), p.children); }
function Painel(p){
  return e("section",{className:"flex min-w-0 flex-col gap-2 rounded-xl p-2.5 text-center "+(p.className||""), style:{background:"rgba(0,0,0,.22)", boxShadow:"inset 0 0 0 1px rgba(255,255,255,.1)"}},
    p.t && e("div",{className:"flex items-center justify-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-[#F3D98B]"}, p.ic && e(Ph,{n:p.ic, s:15}), p.t),
    p.children);
}
// aviso formal curto e discreto
function Aviso(p){ return e("div",{className:"mx-auto flex max-w-4xl items-center justify-center gap-2 rounded-lg bg-[#FBBF24]/10 px-3 py-1.5 text-center text-[11.5px] leading-snug text-[#FDE68A] ring-1 ring-[#FBBF24]/30"}, e(Ph,{n:"warning", s:14, className:"shrink-0"}), p.children); }
// barra de porcentagem simples
function BarraPct(p){
  var c = p.cor || OURO;
  return e("div",{className:"h-2 w-full overflow-hidden rounded-full bg-white/10", role:"img", "aria-label":p.rot||""}, e("div",{className:"h-full rounded-full", style:{width:Math.max(0, Math.min(100, p.pct||0))+"%", background:"linear-gradient(90deg,"+c+"99,"+c+")"}}));
}
// proporção ouro/prata em uma barra só, com os dois valores
function BarraMetal(p){
  var o = Math.max(0, Math.min(100, p.ouro||0)), pr = Math.max(0, Math.min(100, p.prata==null ? 100-o : p.prata));
  return e("div",{className:"flex w-full flex-col gap-0.5"},
    e("div",{className:"flex h-2 w-full overflow-hidden rounded-full bg-white/10", role:"img", "aria-label":"Ouro "+pct1(o)+", prata "+pct1(pr)}, e("div",{style:{width:o+"%", background:OURO}}), e("div",{style:{width:pr+"%", background:PRATA}})),
    !p.sem && e("div",{className:"flex justify-between text-[10.5px] font-bold"}, e("span",{style:{color:OURO}}, "Ouro "+pct1(o)), e("span",{style:{color:PRATA}}, "Prata "+pct1(pr))));
}
function Bolinha(p){ return e("span",{title:p.titulo, className:"inline-block shrink-0 rounded-full", style:{width:p.s||12, height:p.s||12, background:p.cor, boxShadow:"inset 0 0 0 1px rgba(255,255,255,.5)"}}); }
// paginação centralizada
function Paginar(p){
  if(p.total<=1) return null;
  return e("div",{className:"flex items-center justify-center gap-2"},
    e(Ic,{ic:"caret-left", titulo:"Página anterior", disabled:p.pg<=1, onClick:function(){ p.set(p.pg-1); }}),
    e("span",{className:"text-[12.5px] font-bold text-white/80"}, "Página "+p.pg+" de "+p.total),
    e(Ic,{ic:"caret-right", titulo:"Próxima página", disabled:p.pg>=p.total, onClick:function(){ p.set(p.pg+1); }}));
}
export { OURO, PRATA, COR_SETOR, MCOR, SITCOR, MONO, cap1, pct1, usePk, Bt, Ic, Selo, grad, Campo, Txt, Area, Busca, Sel, Data, Chip, Interruptor, Avatar, Vazio, Painel, Aviso, BarraPct, BarraMetal, Bolinha, Paginar };
