// Sorelly Admin · montagem — pages/compras/pecas.js
// Peças visuais e ajudantes só das telas de COMPRAS (setor Materiais e estoque, cor azul #3B82F6). Regras de negócio NÃO ficam aqui (domain/compras-estoque.js).
//   Bt, Selo, Avatar, Ind (indicador clicável), Painel (coluna da janela), Campo, Dialogo (janela pequena)
//   useCompras()  quem está logado, papel, "pode?" e "exec" (confere a regra antes e mostra o aviso formal quando recusa)
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { degrade, ESTADO } from "@/apps/montagem/components/padrao";
import { DIRETORIA, nomeDe } from "@/apps/montagem/domain/equipe";
import { ceReduz, diasEntre, hojeSP, papelCompras, podeAprovarCompra, podeCompras, podeEfetuarCompra, veFunilCompleto } from "@/apps/montagem/domain/compras-estoque";
import { use } from "@/apps/montagem/state/context";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useEffect } from "@/shared/react";

var AZUL = "#3B82F6";
var norm = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
var DECIDE_MSG = "Só quem tem a autorização \"Aprovar, reprovar e liberar para compra\" pode fazer isso.";
var EFETUA_MSG = "Só quem tem a autorização \"Efetuar compras liberadas\" pode efetuar a compra.";

// ───────────── botões, selos e avatar ─────────────
var BT = {normal:"bg-muted/50 hover:bg-white/15", forte:"bg-[#3B82F6] text-white hover:bg-[#60A5FA]", perigo:"bg-[#EF4444]/20 text-[#F87171] ring-1 ring-[#EF4444]/50 hover:bg-[#EF4444]/30", ok:"bg-[#22C55E]/25 text-[#4ADE80] ring-1 ring-[#22C55E]/50 hover:bg-[#22C55E]/35", marca:"bg-[#3B82F6]/25 text-[#BFDBFE] ring-1 ring-[#3B82F6]/60 hover:bg-[#3B82F6]/35"};
function Bt(p){
  return e("button",{type:p.type || "button", onClick:p.onClick, disabled:p.disabled, title:p.disabled && p.semAut ? "Sem autorização" : p.titulo, "aria-label":p.aria,
    className:"inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-bold transition disabled:opacity-40 "+BT[p.tipo || "normal"]+" "+(p.className || "")}, p.ic && e(Ph,{n:p.ic, s:15}), p.children);
}
function Selo(p){
  var c = ESTADO[p.cor] || p.cor || "#94A3B8";
  return e("span",{title:p.titulo, className:"inline-flex w-fit max-w-full items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold", style:{background:c+"26", color:c, boxShadow:"inset 0 0 0 1px "+c+"55"}}, p.ic && e(Ph,{n:p.ic, s:12}), p.children);
}
var iniciais = function(nome){ var t = String(nome || "?").trim().split(/\s+/).filter(Boolean); return ((t[0] || "?").charAt(0)+(t.length>1 ? t[t.length-1].charAt(0) : "")).toUpperCase(); };
function Avatar(p){
  var s = p.s || 24;
  return e("span",{title:p.nome, "aria-label":p.nome, className:"inline-grid shrink-0 place-items-center rounded-full font-bold text-white", style:{width:s, height:s, fontSize:Math.round(s*0.4), background:"linear-gradient(135deg, "+AZUL+", "+AZUL+"77)", boxShadow:"inset 0 0 0 1px "+AZUL+"AA"}}, iniciais(p.nome));
}

// ───────────── indicador clicável (mesmo desenho do Indicador do padrão: número até 20px + nome embaixo) ─────────────
function Ind(p){
  var cor = ESTADO[p.cor] || p.cor || ESTADO.total, st = degrade(p.cor);
  if(p.on) st = Object.assign({}, st, {boxShadow:"inset 0 0 0 2px "+cor});
  return e(p.onClick ? "button" : "div",{type:p.onClick ? "button" : undefined, onClick:p.onClick, title:p.titulo, "aria-pressed":p.onClick ? !!p.on : undefined,
    className:"flex min-w-0 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-center "+(p.onClick ? "cursor-pointer transition hover:bg-black/45" : ""), style:st},
    e("b",{className:MONO+" text-[19px] leading-none", style:{color:cor}}, p.v),
    e("span",{className:"mt-1 text-[10.5px] font-bold uppercase leading-tight tracking-wide text-white/75"}, p.t),
    p.sub && e("span",{className:"text-[10.5px] leading-tight text-white/50"}, p.sub));
}

// ───────────── colunas da janela larga ─────────────
// estado "feito" = já concluído (verde), "atual" = em destaque (azul), sem estado = neutro
function Painel(p){
  var feito = p.estado==="feito", atual = p.estado==="atual";
  return e("section",{className:"flex min-w-0 flex-col gap-2 rounded-xl p-2.5 text-center transition "+(p.className || ""),
      style:atual ? {background:"linear-gradient(160deg, "+AZUL+"33, rgba(0,0,0,.25))", boxShadow:"inset 0 0 0 2px "+AZUL+"AA"} : feito ? {background:"linear-gradient(160deg, #22C55E1F, rgba(0,0,0,.22))", boxShadow:"inset 0 0 0 1px #22C55E55"} : {background:"rgba(0,0,0,.22)", boxShadow:"inset 0 0 0 1px rgba(255,255,255,.1)"}},
    p.t && e("div",{className:"flex items-center justify-center gap-1.5 text-[12px] font-bold uppercase tracking-wide "+(feito ? "text-[#4ADE80]" : atual ? "text-[#BFDBFE]" : "text-white/75")}, e(Ph,{n:feito ? "check-circle" : (p.ic || "circle"), s:15, fill:feito}), p.t),
    p.children);
}
// dado: rótulo pequeno + valor (centralizado)
function Dado(p){
  if(p.v==null || p.v==="") return null;
  return e("div",{className:"flex min-w-0 flex-col items-center rounded-lg bg-black/25 px-2 py-1 text-center"},
    e("span",{className:"flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide text-white/60"}, p.ic && e(Ph,{n:p.ic, s:12}), p.t),
    e("span",{className:"break-words text-[13px] font-semibold "+(p.mono ? MONO : "")}, p.v));
}
function Campo(p){ return e("label",{className:"flex min-w-0 flex-col gap-1 text-center text-[12px] font-bold "+(p.className || "")}, p.rot, p.children); }

// ───────────── janela pequena (confirmações e dados de uma etapa) ─────────────
function Dialogo(p){
  useEffect(function(){ var f = function(ev){ if(ev.key==="Escape") p.fechar(); }; window.addEventListener("keydown", f); return function(){ window.removeEventListener("keydown", f); }; }, []);
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/65 p-3", onClick:p.fechar},
    e("div",{role:"dialog", "aria-label":p.t, onClick:function(ev){ ev.stopPropagation(); }, className:"flex max-h-[92vh] w-full "+(p.tam || "max-w-md")+" flex-col gap-3 overflow-y-auto rounded-2xl bg-card p-4 text-center ring-2 ring-[#3B82F6]/50"},
      e("div",{className:"relative px-9"}, e("h2",{className:"font-heading text-lg font-bold"}, p.t), p.sub && e("p",{className:"break-words text-[12.5px] text-white/70"}, p.sub),
        e("button",{type:"button", onClick:p.fechar, "aria-label":"Fechar", className:"absolute right-0 top-0 grid size-8 place-items-center rounded-lg bg-muted/50 hover:bg-white/15"}, e(Ph,{n:"x", s:15}))),
      p.children,
      p.rodape && e("div",{className:"flex flex-wrap justify-center gap-2 border-t border-white/10 pt-3"}, p.rodape)));
}

// ───────────── quem está logado e o que pode fazer ─────────────
// c.pode(acao, pedido): acao = {cap, decide} de TRANSICOES (cap "membro", "operar", ..., "operar_ou_solicitante"; decide exige "Aprovar, reprovar e liberar para compra"; decide "efetua" exige "Efetuar compras liberadas" ou a de aprovar)
// c.exec({op, id, ...}): confere com o reducer ANTES; se recusar mostra o aviso formal (vermelho) e devolve false; se passar, grava (tipo CE) e devolve true
function useCompras(){
  var cx = use(), s = cx.state, d = cx.dispatch, uid = s.usuario, por = nomeDe(uid), dir = DIRETORIA.some(function(x){ return x.id===uid; }), papel = papelCompras(s, uid, dir);
  var c = {s:s, d:d, ce:s.ce, uid:uid, por:por, dir:dir, papel:papel, veTodas:veFunilCompleto(papel) || podeEfetuarCompra(s, uid), opera:podeCompras(papel, "operar")};
  c.aviso = function(txt, tom){ d({type:"AVISO", txt:txt, tom:tom || "alerta"}); return false; };
  c.pode = function(a, p){
    var cap = a.cap, ok = cap==="membro" ? true : cap==="operar_ou_solicitante" ? (c.opera || norm(p.solicitante)===norm(por)) : podeCompras(papel, cap);
    if(!ok) return false;
    if(a.decide===true || (a.decide==="depois_de_solicitada" && p.status!=="NAO_VERIFICADA")) return podeAprovarCompra(s, uid);
    if(a.decide==="efetua") return podeEfetuarCompra(s, uid);
    return true;
  };
  c.exec = function(ac){
    var full = Object.assign({type:"CE", por:por, porId:uid, podeAutorizar:podeCompras(papel, "autorizar")}, ac), r = ceReduz(s, full);
    if(!r.patch || !Object.keys(r.patch).length) return c.aviso(r.msg || "Não foi possível concluir a ação.");
    d(full); return true;
  };
  return c;
}
// dias desde o último movimento da compra (a "etapa atual")
function diasNaEtapa(p, hoje){
  var ev = p.eventos && p.eventos.length ? p.eventos[p.eventos.length-1].em : p.solicitadoEm, dia = String(ev || p.solicitadoEm || "").slice(0, 10);
  return dia ? Math.max(0, diasEntre(dia, hoje || hojeSP())) : 0;
}
// verde até 2 dias, âmbar até 6, vermelho 7 ou mais
var corTempo = function(n){ return n<=2 ? "ok" : n<=6 ? "alerta" : "ruim"; };
var textoDias = function(n){ return n===0 ? "hoje" : n===1 ? "1 dia" : n+" dias"; };
var cnpjCurto = function(p){ var i = p.cnpjId; return !i ? "" : i==="outro" ? "Outro CNPJ" : i==="sem_nota" ? "Sem nota" : i==="ho" ? "H&O" : "CNPJ "+i; };

export { AZUL, norm, DECIDE_MSG, EFETUA_MSG, Bt, Selo, Avatar, Ind, Painel, Dado, Campo, Dialogo, useCompras, diasNaEtapa, corTempo, textoDias, cnpjCurto, iniciais };
