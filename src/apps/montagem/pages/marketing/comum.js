// Sorelly Admin · montagem — pages/marketing/comum.js
// Peças pequenas do setor Marketing (cor rosa do setor, chips, botões, campo com rótulo, cópia). Lógica em domain/marketing.js (estado s.mk, ação MK).
import { degrade } from "@/apps/montagem/components/padrao";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { e, useState } from "@/shared/react";

var COR = "#EC4899";
var CAMPO = "h-9 rounded-lg bg-black/30 px-3 text-[13px] text-white ring-1 ring-white/15 outline-none focus:ring-2 placeholder:text-white/40";

// Botão do setor: principal (degradê rosa) ou comum
function Botao(p){
  return e("button",{type:"button", disabled:p.desativado, title:p.titulo, onClick:p.onClick, className:"h-9 rounded-lg px-3 text-[12.5px] font-bold transition disabled:opacity-40 "+(p.principal ? "text-white hover:brightness-125" : "bg-white/10 text-white hover:bg-white/20")+" "+(p.className||""),
    style:p.principal ? degrade(COR) : undefined}, p.children);
}
// Chip de escolha curta (marca, canal, tipo, status): liga/desliga
function Chip(p){
  return e("button",{type:"button", onClick:p.onClick, "aria-pressed":!!p.on, className:"rounded-lg px-2.5 py-1 text-[12px] font-bold ring-1 transition "+(p.on ? "text-white" : "bg-muted/40 text-white/80 ring-white/15 hover:bg-white/10"),
    style:p.on ? {background:"linear-gradient(135deg,"+COR+"66,"+COR+"22)", boxShadow:"inset 0 0 0 1px "+COR+"cc"} : undefined}, p.children);
}
function Campo(p){
  return e("label",{className:"flex flex-col gap-1 text-center"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-wide text-white/75"}, p.t), p.children);
}
function Vazio(p){ return e("p",{className:"px-2 py-6 text-center text-[13px] text-white/60"}, p.children); }

// quem está logado (para gravar "por")
function porDe(s){ try { return nomeDe(s.usuario); } catch(x){ return "—"; } }

// copiar para a área de transferência; devolve [chaveCopiada, copiar(chave, texto)]
function useCopiar(){
  var st = useState(null);
  var copiar = function(chave, texto){
    var fim = function(){ st[1](chave); setTimeout(function(){ st[1](null); }, 1500); };
    try { navigator.clipboard.writeText(String(texto)).then(fim, fim); } catch(x){ fim(); }
  };
  return [st[0], copiar];
}
// lista de valores com um item ligado/desligado
function alternar(lista, v){ return lista.indexOf(v)===-1 ? lista.concat([v]) : lista.filter(function(x){ return x!==v; }); }
// último pedaço de um link (nome do arquivo)
function nomeDoLink(url){ var t = String(url||"").split("?")[0].split("#")[0].replace(/\/+$/, ""), i = t.lastIndexOf("/"); return decodeURIComponent(i===-1 ? t : t.slice(i+1)) || "imagem"; }

export { COR, CAMPO, Botao, Chip, Campo, Vazio, porDe, useCopiar, alternar, nomeDoLink };
