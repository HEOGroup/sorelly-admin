// Sorelly Admin · montagem — pages/fiscal/visual.js
// Peças e ajudas só do Fiscal (setor Fiscal, cor ciano #06B6D4; BlocoBarra usa "turquesa"). Regras e contas ficam em domain/fiscal.js.
//   useFx           estado do módulo (s.fx), quem está logado, se é diretoria e o envio de ações "FX"
//   Bt, Chip, Selo  botão (principal ciano), botão de escolha e selo de estado
//   Mini, Aviso     célula de número compacta e bloco de aviso formal com cor de estado
//   Campo, Jan      rótulo de campo e janela larga em colunas (fecha com Esc)
//   fmt, copiar     formatos (dinheiro, %, data) e cópia para a área de transferência
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { ESTADO, Janela, degrade } from "@/apps/montagem/components/padrao";
import { DIRETORIA, nomeDe } from "@/apps/montagem/domain/equipe";
import { fxDemo } from "@/apps/montagem/domain/fiscal";
import { use } from "@/apps/montagem/state/context";
import { INPUT, MONO, brl } from "@/apps/montagem/ui/input";
import { e, useEffect } from "@/shared/react";

var COR = "#06B6D4";
// classe de cor do domínio (ok/amber/red/grey) → cor de estado do padrão
var CLS = {ok:"ok", amber:"alerta", red:"ruim", grey:"neutro"};
var corCls = function(c){ return CLS[c] || "neutro"; };
var CLASSE_COR = {LASTRO:"ok", NAO_LASTRO:"neutro", OPERACIONAL:"info"};
var EXPLICA = {LASTRO:"Mercadoria comprada para revenda. Conta no cálculo do ILF.", NAO_LASTRO:"Entrada que não é para revenda. Não conta no ILF.", OPERACIONAL:"Despesa de uso e consumo da empresa. Não conta no ILF."};

var fmt = {
  brl: function(v){ return brl(v); },
  pct: function(r, casas){ return (Number(r||0)*100).toLocaleString("pt-BR", {minimumFractionDigits:casas==null ? 1 : casas, maximumFractionDigits:casas==null ? 1 : casas})+"%"; },
  data: function(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso||"")); return m ? m[3]+"/"+m[2]+"/"+m[1] : "—"; },
  // valor curto para o gráfico: R$ 1,2 mi · R$ 345 mil
  curto: function(v){ v = Number(v||0); return v>=1000000 ? "R$ "+(v/1000000).toLocaleString("pt-BR", {maximumFractionDigits:2})+" mi" : v>=1000 ? "R$ "+Math.round(v/1000).toLocaleString("pt-BR")+" mil" : "R$ "+Math.round(v).toLocaleString("pt-BR"); },
  cap: function(t){ return t ? t.charAt(0).toUpperCase()+t.slice(1) : t; }
};
// data de hoje (aaaa-mm-dd) no fuso de São Paulo
function hoje(){ try { var o = {}; new Intl.DateTimeFormat("en-CA", {timeZone:"America/Sao_Paulo", year:"numeric", month:"2-digit", day:"2-digit"}).formatToParts(new Date()).forEach(function(p){ o[p.type] = p.value; }); return o.year+"-"+o.month+"-"+o.day; } catch(x){ return new Date().toISOString().slice(0,10); } }

// estado do módulo. sx = estado com s.fx garantido (se ainda não existir no salvo, usa o vazio)
function useFx(){
  var c = use(), s = c.state, sx = s.fx ? s : Object.assign({}, s, {fx:fxDemo()}), por = nomeDe(s.usuario);
  return {s:sx, d:c.dispatch, fx:sx.fx, por:por, dir:DIRETORIA.some(function(x){ return x.id===s.usuario; }) || s.usuario===29,
    envia:function(a){ c.dispatch(Object.assign({type:"FX", por:por}, a)); }, aviso:function(txt, tom){ c.dispatch({type:"AVISO", txt:txt, tom:tom}); }};
}

// copia o texto (com plano B para navegadores sem a área de transferência moderna)
function copiar(txt, depois){
  var plano = function(){ try { var t = document.createElement("textarea"); t.value = txt; t.style.position = "fixed"; t.style.opacity = "0"; document.body.appendChild(t); t.select(); document.execCommand("copy"); document.body.removeChild(t); depois(true); } catch(x){ depois(false); } };
  try { if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function(){ depois(true); }, plano); else plano(); } catch(x){ plano(); }
}
// baixa um CSV (separador ;, vírgula decimal, BOM para o Excel)
function baixarCsv(nome, linhas){
  var csv = "﻿"+linhas.map(function(l){ return l.map(function(c){ var t = String(c==null ? "" : c); return /[;"\n]/.test(t) ? '"'+t.replace(/"/g, '""')+'"' : t; }).join(";"); }).join("\r\n");
  try { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8"})); a.download = nome; document.body.appendChild(a); a.click(); document.body.removeChild(a); } catch(x){}
}

// botão. tipo: "forte" (principal, ciano) · "normal" · "perigo"
var BT = {forte:"text-black hover:brightness-110", normal:"bg-white/10 hover:bg-white/20", perigo:"bg-[#EF4444]/20 text-[#FCA5A5] ring-1 ring-[#EF4444]/50 hover:bg-[#EF4444]/35"};
function Bt(p){
  return e("button",{type:"button", onClick:p.onClick, disabled:p.disabled, title:p.titulo, "aria-label":p.rotulo, className:"inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[13px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40 "+BT[p.tipo||"normal"]+" "+(p.className||""),
    style:p.tipo==="forte" ? {background:"linear-gradient(135deg,"+COR+",#67E8F9)"} : undefined}, p.ic && e(Ph,{n:p.ic, s:15}), p.children);
}
// botão de escolha (empresa, mês, ano, classificação)
function Chip(p){
  return e("button",{type:"button", onClick:p.onClick, title:p.titulo, "aria-pressed":!!p.on, className:"inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[12.5px] font-bold ring-1 transition "+(p.on ? "text-white" : "bg-white/10 ring-white/15 hover:bg-white/20")+" "+(p.className||""),
    style:p.on ? {background:"linear-gradient(135deg,"+COR+"88,"+COR+"2e)", boxShadow:"inset 0 0 0 1px "+COR+"cc"} : undefined}, p.ic && e(Ph,{n:p.ic, s:14}), p.children);
}
// selo de estado (cor do padrão ESTADO ou hexadecimal)
function Selo(p){
  var c = ESTADO[p.cor] || p.cor || ESTADO.neutro;
  return e("span",{title:p.titulo, className:"inline-flex w-fit items-center justify-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold", style:{background:c+"26", color:c, boxShadow:"inset 0 0 0 1px "+c+"55"}}, p.ic && e(Ph,{n:p.ic, s:12}), p.children);
}
// célula de número compacta (até 16px), centralizada, com degradê do sentido
function Mini(p){
  var c = ESTADO[p.cor] || p.cor || ESTADO.total;
  return e("div",{className:"flex min-w-0 flex-col items-center justify-center rounded-lg px-1.5 py-1 text-center", title:p.titulo, style:degrade(p.cor)},
    e("b",{className:MONO+" text-[15px] leading-tight", style:{color:c}}, p.v),
    e("span",{className:"mt-0.5 text-[10px] font-bold uppercase leading-tight tracking-wide text-white/75"}, p.t),
    p.sub && e("span",{className:"text-[10px] leading-tight text-white/55"}, fmt.cap(p.sub)));
}
// bloco de aviso formal com cor de estado
function Aviso(p){
  var c = ESTADO[p.cor] || p.cor || ESTADO.info;
  return e("div",{className:"flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-center text-[13px] font-medium text-white", style:degrade(p.cor)},
    e(Ph,{n:p.ic || "warning-circle", s:17, style:{color:c}}), e("span",null, p.children));
}
// rótulo de campo, centralizado
function Campo(p){ return e("label",{className:"flex min-w-0 flex-col gap-1 text-center "+(p.className||"")}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-wide text-white/75"}, p.t), p.children); }
var ENTRADA = INPUT+" h-10! w-full text-center";
// janela larga em colunas (a do padrão), que também fecha com Esc
function Jan(p){
  useEffect(function(){ var f = function(ev){ if(ev.key==="Escape") p.fechar(); }; window.addEventListener("keydown", f); return function(){ window.removeEventListener("keydown", f); }; }, []);
  return e(Janela, p);
}
// estado vazio formal e curto
function Vazio(p){ return e("div",{className:"flex flex-col items-center gap-2 rounded-xl bg-black/20 px-4 py-6 text-center ring-1 ring-white/10"}, e(Ph,{n:p.ic || "tray", s:26, className:"text-white/60"}), e("p",{className:"text-[13.5px] text-white/85"}, p.children), p.acao); }
// grade de indicadores que quebra sozinha (cada célula comporta dinheiro com centavos)
function Grade(p){ return e("div",{className:"grid gap-2", style:{gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, "+(p.min||"12rem")+"), 1fr))"}}, p.children); }

export { COR, corCls, CLASSE_COR, EXPLICA, fmt, hoje, useFx, copiar, baixarCsv, Bt, Chip, Selo, Mini, Aviso, Campo, ENTRADA, Jan, Vazio, Grade };
