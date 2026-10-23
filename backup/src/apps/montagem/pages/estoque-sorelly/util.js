// Sorelly Admin · montagem — pages/estoque-sorelly/util.js
// Ajudantes das telas do Estoque Sorelly (Financeiro, azul #3B82F6): estado e permissões, formatos e campos com ajuda.
//   useEs()      estado s.es, quem está logado, admin (diretoria + Anamaria) e exec(op, dados) → true se o domínio aceitou (a recusa aparece no aviso do sistema)
//   CampoEs      rótulo + "?" que abre o texto de ajuda + número ou dinheiro
// Regras de negócio NÃO ficam aqui (estão em domain/estoque-sorelly.js).
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { Dinheiro } from "@/apps/montagem/components/padrao";
import { esReduz } from "@/apps/montagem/domain/estoque-sorelly";
import { DIRETORIA, nomeDe } from "@/apps/montagem/domain/equipe";
import { use } from "@/apps/montagem/state/context";
import { INPUT, MONO, brl } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var AZUL = "#3B82F6";
var ID_ANAMARIA = 29;
// campos que são contagem (inteiro); os demais são dinheiro
var CONTAGEM = {qtdRevendedoras:1, internoPecas:1, revPecas:1, revInicio:1, revEntraram:1, revSairam:1};

function useEs(){
  var cx = use(), s = cx.state, d = cx.dispatch, por = nomeDe(s.usuario);
  var admin = DIRETORIA.some(function(x){ return x.id===s.usuario; }) || s.usuario===ID_ANAMARIA;
  var exec = function(op, dados){ var a = Object.assign({type:"ES", op:op, por:por, admin:admin}, dados||{}); var r = esReduz(s, a); d(a); return !!(r.patch && r.patch.es); };
  return {s:s, es:s.es, cfg:s.es.config, por:por, admin:admin, exec:exec};
}

// formatos
var pt = function(n, c){ return n==null ? "—" : Number(n).toLocaleString("pt-BR", {minimumFractionDigits:c||0, maximumFractionDigits:c||0}); };
var din = function(n){ return n==null ? "—" : brl(n); };
var pct = function(n){ return n==null ? "—" : pt(n, 1)+"%"; };
var vezes = function(n){ return n==null ? "—" : pt(n, 2)+"×"; };
var abrev = function(n){ var a = Math.abs(n), sg = n<0 ? "−" : ""; return a>=1e6 ? sg+pt(a/1e6, 1)+" mi" : a>=1e3 ? sg+Math.round(a/1e3)+" mil" : sg+Math.round(a); };
var curto = function(r){ return String(r).replace(/\/20(\d\d)$/, "/$1"); };   // "set/2026" → "set/26"
var dataBr = function(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso||"")); return m ? m[3]+"/"+m[2]+"/"+m[1] : "—"; };
var cap1 = function(t){ return t ? String(t).charAt(0).toUpperCase()+String(t).slice(1) : t; };

// Campo com rótulo, "?" (abre o texto de ajuda do Configurador) e entrada. dinheiro → Dinheiro; senão número inteiro. valor = número ou null.
function CampoEs(p){
  var st = useState(false), aberto = st[0];
  var ctl = p.dinheiro ? e(Dinheiro,{value:p.valor==null ? 0 : p.valor, label:p.rot, disabled:p.disabled, onChange:p.onChange})
    : e("input",{type:"number", inputMode:"numeric", min:0, step:1, disabled:p.disabled, "aria-label":p.rot, placeholder:"0", value:p.valor==null ? "" : p.valor, className:INPUT+" h-10! w-full text-center "+MONO,
      onChange:function(ev){ var t = ev.target.value; p.onChange(t==="" ? null : Number(t)); }});
  return e("div",{className:"flex min-w-0 flex-col gap-1 text-center"},
    e("div",{className:"flex items-center justify-center gap-1.5"},
      e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/80"}, p.rot),
      p.ajuda && e("button",{type:"button", onClick:function(){ st[1](!aberto); }, "aria-label":"Como preencher: "+p.rot, title:"Como preencher", className:"grid size-5 place-items-center rounded-full ring-1 transition "+(aberto ? "bg-[#3B82F6]/40 ring-[#3B82F6]" : "bg-white/10 ring-white/20 hover:bg-white/20")}, e(Ph,{n:"question", s:12}))),
    ctl,
    aberto && p.ajuda && e("p",{className:"whitespace-pre-line rounded-lg bg-black/30 px-2 py-1.5 text-[11.5px] leading-snug text-white/80 ring-1 ring-white/10"}, p.ajuda));
}

export { AZUL, CONTAGEM, useEs, pt, din, pct, vezes, abrev, curto, dataBr, cap1, CampoEs };
