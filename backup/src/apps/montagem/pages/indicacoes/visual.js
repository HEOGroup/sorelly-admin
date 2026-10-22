// Sorelly Admin · montagem — pages/indicacoes/visual.js
// Peças visuais só das Indicações (setor Cadastro de revendedoras, cor laranja #F97316), usadas pelas 5 abas:
//   Bt, BtMini, Selo, Avatar    botões, selo de estado e bolinha com iniciais
//   Resumo                      faixa de indicadores compacta, com degradê por sentido (aberto, atrasado, feito, cancelado...)
//   BarraFiltros, Busca, FiltroData, Chip, Alternar   barra única de filtros (altura única, ícones, "Limpar")
//   Secao                       bloco do conteúdo principal (sempre aberto, cabeçalho em degradê)
//   Janela, Colunas, Painel, Passos   janela larga em colunas (dados | etapas | ações); o que já foi feito passa para o lado como concluído
// Regras de negócio NÃO ficam aqui (estão em domain/indicacoes.js).
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e, useEffect } from "@/shared/react";

var LARANJA = "#F97316";
// cor por SENTIDO (verde/amarelo/vermelho só para estado)
var SENTIDO = {aberto:"#F59E0B", alerta:"#F59E0B", atrasado:"#EF4444", ruim:"#EF4444", ok:"#22C55E", feito:"#22C55E", cancelado:"#64748B", neutro:"#64748B", info:"#3B82F6", ouro:"#CA8A04", total:"#CA8A04", laranja:LARANJA};
var corDe = function(c){ return SENTIDO[c] || c || SENTIDO.info; };
var degrade = function(c, forte){ c = corDe(c); return {background:"linear-gradient(135deg, "+c+(forte ? "D9" : "A6")+" 0%, "+c+(forte ? "73" : "3D")+" 100%)", boxShadow:"inset 0 0 0 1px "+c+"88"}; };
var cap1 = function(t){ return t ? t.charAt(0).toUpperCase()+t.slice(1) : t; };

// ───────────── botões, selos e avatar ─────────────
var BT = {normal:"bg-muted/50 hover:bg-white/15", forte:"bg-[#F97316] text-black hover:bg-[#FDBA74]", perigo:"bg-[#EF4444]/20 text-[#F87171] ring-1 ring-[#EF4444]/50 hover:bg-[#EF4444]/30", ok:"bg-[#22C55E]/25 text-[#4ADE80] ring-1 ring-[#22C55E]/50 hover:bg-[#22C55E]/35", marca:"bg-[#F97316]/25 text-[#FDBA74] ring-1 ring-[#F97316]/60"};
function Bt(p){ return e("button",{type:"button", onClick:p.onClick, disabled:p.disabled, title:p.titulo, className:"inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-bold transition disabled:opacity-40 "+BT[p.tipo||"normal"]+" "+(p.className||"")}, p.ic && e(Ph,{n:p.ic, s:15}), p.children); }
function BtMini(p){ return e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); p.onClick(); }, title:p.titulo, className:"inline-flex items-center justify-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-bold transition "+(p.forte ? "bg-[#F97316]/25 text-[#FDBA74] ring-1 ring-[#F97316]/50 hover:bg-[#F97316]/35" : "bg-white/10 hover:bg-white/15")}, p.children); }
function Selo(p){ var c = p.cor || "#94A3B8"; return e("span",{title:p.titulo, className:"inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold", style:{background:c+"26", color:c, boxShadow:"inset 0 0 0 1px "+c+"55"}}, p.ic && e(Ph,{n:p.ic, s:12}), p.children); }
function Avatar(p){
  var c = p.cor || LARANJA, t = String(p.nome||"?").trim().split(/\s+/).filter(Boolean), s = p.s || 28, ini = ((t[0]||"?").charAt(0)+(t.length>1 ? t[t.length-1].charAt(0) : "")).toUpperCase();
  return e("span",{"aria-hidden":true, className:"inline-grid shrink-0 place-items-center rounded-full font-bold text-white", style:{width:s, height:s, fontSize:Math.round(s*0.4), background:"linear-gradient(135deg, "+c+", "+c+"77)", boxShadow:"inset 0 0 0 1px "+c+"AA"}}, ini);
}

// ───────────── faixa de indicadores compacta ─────────────
// itens: [{t, v, cor, sub?, titulo?}] — número até 20px, texto branco, centralizado, degradê por sentido
function Resumo(p){
  return e("div",{className:"flex flex-wrap justify-center gap-2"}, p.itens.filter(Boolean).map(function(it, i){
    return e("div",{key:i, title:it.titulo, className:"flex min-w-28 max-w-52 flex-1 basis-28 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-center text-white", style:degrade(it.cor)},
      e("b",{className:MONO+" text-[20px] leading-none"}, it.v),
      e("span",{className:"mt-1 text-[10.5px] font-bold uppercase leading-tight tracking-wide text-white/90"}, it.t),
      it.sub && e("span",{className:"text-[10px] leading-tight text-white/75"}, cap1(it.sub)));
  }));
}

// ───────────── barra única de filtros ─────────────
var ALTURA = "h-9! text-[13px]!";
function BarraFiltros(p){
  return e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-black/25 p-2 ring-1 ring-white/10"}, p.children,
    p.limpar && e(Bt,{ic:"x-circle", onClick:p.limpar, className:"h-9 py-0!"}, "Limpar"));
}
function Busca(p){
  return e("div",{className:"relative min-w-48 max-w-sm flex-1 basis-56"}, e(Ph,{n:"magnifying-glass", s:15, className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/60"}),
    e("input",{type:"search", value:p.v, placeholder:p.ph, "aria-label":p.ph, onChange:function(ev){ p.set(ev.target.value); }, className:INPUT+" "+ALTURA+" w-full pl-9 text-center"}));
}
function FiltroData(p){
  return e("label",{className:"inline-flex items-center gap-1.5 rounded-lg bg-white/5 pl-2.5 text-[12px] font-bold ring-1 ring-white/10"}, e(Ph,{n:"calendar-blank", s:14, className:"text-white/70"}), p.rot,
    e("input",{type:"date", value:p.v, min:p.min, "aria-label":p.rot, onChange:function(ev){ p.set(ev.target.value); }, className:INPUT+" "+ALTURA+" w-36 border-0! bg-transparent! text-center"}));
}
function Chip(p){ return e("button",{type:"button", onClick:p.onClick, className:"inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-bold transition "+(p.on ? "bg-[#F97316] text-black" : "bg-white/10 hover:bg-white/15")}, p.ic && e(Ph,{n:p.ic, s:14}), p.children); }
function Alternar(p){ return e("label",{className:"inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-bold transition "+(p.on ? "bg-[#F97316]/25 ring-1 ring-[#F97316]/60" : "bg-white/10 hover:bg-white/15")}, e("input",{type:"checkbox", checked:p.on, onChange:function(ev){ p.set(ev.target.checked); }}), p.ic && e(Ph,{n:p.ic, s:14}), p.children); }

// ───────────── bloco do conteúdo principal (sempre aberto) ─────────────
function Secao(p){
  return e("section",{className:"flex flex-col overflow-hidden rounded-xl ring-1 ring-[#F97316]/40", style:{background:"rgba(0,0,0,.18)"}},
    e("div",{className:"relative flex items-center justify-center gap-2 px-3 py-1.5 text-center text-white", style:{background:"linear-gradient(90deg, #F9731666, #F9731633 50%, #F9731666)"}},
      p.ic && e(Ph,{n:p.ic, s:16}), e("h3",{className:"font-heading text-[14px] font-bold"}, p.t), p.sub && e("span",{className:"hidden text-[11.5px] text-white/75 md:inline"}, "· "+p.sub),
      p.dir && e("span",{className:MONO+" absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/35 px-2 py-0.5 text-[11.5px] font-bold"}, p.dir)),
    e("div",{className:"flex flex-col gap-2 p-2"}, p.children));
}

// ───────────── janela larga em colunas ─────────────
var LARGURA = {sm:"max-w-lg", md:"max-w-2xl", lg:"max-w-5xl", xl:"max-w-6xl"};
function Janela(p){
  useEffect(function(){ var f = function(ev){ if(ev.key==="Escape") p.fechar(); }; window.addEventListener("keydown", f); return function(){ window.removeEventListener("keydown", f); }; }, []);
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/65 p-3", onClick:p.fechar},
    e("div",{className:"flex max-h-[94vh] w-full "+(LARGURA[p.tam] || (p.largo ? LARGURA.lg : LARGURA.sm))+" flex-col gap-2.5 overflow-y-auto rounded-2xl bg-card p-3 text-center ring-2 ring-[#F97316]/50", onClick:function(ev){ ev.stopPropagation(); }},
      e("div",{className:"relative px-9"}, e("h2",{className:"font-heading text-lg font-bold"}, p.t), p.sub && e("p",{className:"text-[12.5px] text-white/70"}, p.sub),
        e("button",{type:"button", onClick:p.fechar, "aria-label":"Fechar", className:"absolute right-0 top-0 grid size-8 place-items-center rounded-lg bg-muted/50 hover:bg-white/15"}, e(Ph,{n:"x", s:15}))),
      p.passos && e(Passos,{passos:p.passos, linha:true}),
      p.children));
}
// n colunas lado a lado em tela larga (lg); uma só em tela estreita
function Colunas(p){ var g = p.n===2 ? "md:grid-cols-2" : p.n===3 ? "lg:grid-cols-3" : ""; return e("div",{className:"grid grid-cols-1 items-start gap-2.5 "+g+" "+(p.className||"")}, p.children); }
// Painel: uma coluna. estado "feito" = concluído (passou para o lado, verde); "atual" = próxima etapa em destaque (laranja)
function Painel(p){
  var feito = p.estado==="feito", atual = p.estado==="atual";
  return e("section",{className:"flex min-w-0 flex-col gap-2 rounded-xl p-2.5 text-center transition "+(p.className||""),
      style:atual ? {background:"linear-gradient(160deg, #F9731633, rgba(0,0,0,.25))", boxShadow:"inset 0 0 0 2px #F97316AA"} : feito ? {background:"linear-gradient(160deg, #22C55E1F, rgba(0,0,0,.22))", boxShadow:"inset 0 0 0 1px #22C55E55"} : {background:"rgba(0,0,0,.22)", boxShadow:"inset 0 0 0 1px rgba(255,255,255,.1)"}},
    p.t && e("div",{className:"flex items-center justify-center gap-1.5 text-[12px] font-bold uppercase tracking-wide "+(feito ? "text-[#4ADE80]" : atual ? "text-[#FDBA74]" : "text-white/75")},
      e(Ph,{n:feito ? "check-circle" : (p.ic || "circle"), s:15, fill:feito}), p.t),
    p.children);
}
// Passos: linha do tempo das etapas. passos = [{t, sub?, estado:"feito"|"atual"|"futuro"|"cancelado"}]; linha:true = em fila horizontal (cabeçalho da janela)
function Passos(p){
  var cores = {feito:"#4ADE80", atual:LARANJA, futuro:"#94A3B8", cancelado:"#EF4444"}, ics = {feito:"check-circle", atual:"circle-notch", futuro:"circle", cancelado:"x-circle"};
  return e("div",{className:p.linha ? "flex flex-wrap items-center justify-center gap-1.5" : "flex flex-col gap-1.5"}, p.passos.map(function(x, i){
    var c = cores[x.estado]; var on = x.estado==="atual";
    return e("div",{key:i, className:"flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1 text-left "+(p.linha ? "" : "w-full justify-start"), style:{background:on ? "#F9731626" : "rgba(255,255,255,.05)", boxShadow:"inset 0 0 0 1px "+(on ? "#F97316AA" : c+"33"), opacity:x.estado==="futuro" ? 0.7 : 1}},
      e(Ph,{n:ics[x.estado], s:15, fill:x.estado==="feito", style:{color:c}}),
      e("span",{className:"flex flex-col leading-tight"}, e("b",{className:"text-[12.5px]", style:{color:x.estado==="futuro" ? undefined : c}}, x.t), x.sub && e("span",{className:"text-[11px] text-white/65"}, x.sub)));
  }));
}

export { Bt, BtMini, Selo, Avatar, Resumo, BarraFiltros, Busca, FiltroData, Chip, Alternar, Secao, Janela, Colunas, Painel, Passos, degrade, corDe, cap1 };
