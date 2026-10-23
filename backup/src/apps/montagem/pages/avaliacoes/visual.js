// Sorelly Admin · montagem — pages/avaliacoes/visual.js
// Peças e ajudantes só da tela Avaliações (cor do módulo: laranja do Cadastro, #F97316). Regras e contas ficam em domain/avaliacoes.js.
//   useAv            estado, quem está logado, lista de representantes e o "agir" (valida antes de gravar e mostra o motivo se recusar)
//   Barra, LinhaBarra, Serie, Estrelas, Nota, Vazio, ErroAv, Campo, Entrada, Cartao
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { ESTADO } from "@/apps/montagem/components/padrao";
import { DIRETORIA, nomeDe, veTotais } from "@/apps/montagem/domain/equipe";
import { avReduz, formatarDia, formatarNota, tomDaNota } from "@/apps/montagem/domain/avaliacoes";
import { REPS_AVAL } from "@/apps/montagem/domain/representantes";
import { use } from "@/apps/montagem/state/context";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var COR = "#F97316";
var cap = function(t){ return typeof t==="string" && t ? t.charAt(0).toUpperCase()+t.slice(1) : t; };
var nomeCurto = function(n){ var t = String(n||"").trim().split(/\s+/).filter(Boolean); return t.length>2 ? t[0]+" "+t[t.length-1] : t.join(" "); };
var CAMPO = INPUT+" h-9! w-full text-center text-[13px]!";

// estado da tela: quem está logado, se é diretoria, quem vê dinheiro e a lista das representantes
function useAv(){
  var cx = use(), s = cx.state, d = cx.dispatch, st = useState(null);
  var dir = DIRETORIA.some(function(x){ return x.id===s.usuario; }) || s.usuario===29;
  var reps = REPS_AVAL.concat((s.listagens||[]).map(function(l){ return l.rep; })).filter(function(r, i, a){ return r && a.indexOf(r)===i; });
  // agir: confere pela regra do domínio ANTES de gravar; se recusar, mostra o motivo na tela e não grava
  var agir = function(acao){
    var a = Object.assign({type:"AV", por:nomeDe(s.usuario)}, acao), r = avReduz(s, a);
    if(!r.patch.av){ st[1](r.msg || "Não foi possível salvar."); return false; }
    st[1](null); d(a); return true;
  };
  return {s:s, av:s.av, d:d, dir:dir, reps:reps, ver:veTotais(s.usuario), por:nomeDe(s.usuario), quem:{usuarioId:s.usuario, diretoria:dir}, agir:agir, erro:st[0], setErro:st[1]};
}

// cor de estado da nota (escala 0 a 5 do módulo, limites do Configurador)
function corNota(media, max, cfg){ var t = tomDaNota(media, max, cfg); return t==="bom" ? ESTADO.ok : t==="medio" ? ESTADO.alerta : t==="ruim" ? ESTADO.ruim : ESTADO.neutro; }
// avaliação de funcionários: escala própria e limites próprios
function corFunc(nota, cfg){ if(nota==null) return ESTADO.neutro; return nota>=cfg.notaBoa ? ESTADO.ok : nota<cfg.notaRuim ? ESTADO.ruim : ESTADO.alerta; }

function Barra(p){
  var pct = Math.max(0, Math.min(100, p.pct||0)), c = p.cor || COR;
  return e("div",{className:"h-2 w-full overflow-hidden rounded-full bg-white/10"}, e("div",{className:"h-full rounded-full", style:{width:pct+"%", background:"linear-gradient(90deg,"+c+"88,"+c+")"}}));
}
// linha com título, valor e barra, tudo centralizado
function LinhaBarra(p){
  return e("div",{className:"flex flex-col items-center gap-1 text-center"},
    e("div",{className:"flex flex-wrap items-center justify-center gap-x-2 text-[12.5px]"}, e("b",null, cap(p.t)), e("span",{className:MONO+" font-bold", style:{color:p.cor || COR}}, p.v), p.sub && e("span",{className:"text-white/60"}, p.sub)),
    e(Barra,{pct:p.pct, cor:p.cor}));
}
function Nota(p){ return e("span",{className:MONO+" font-bold", style:{color:p.cor || ESTADO.neutro}}, formatarNota(p.v)); }
function Estrelas(p){
  var n = Math.round(p.v||0), max = p.max || 5;
  return e("span",{className:"inline-flex items-center justify-center gap-0.5", "aria-label":n+" de "+max}, Array.from({length:max}).map(function(_, i){ return e(Ph,{key:i, n:"star", s:p.s||13, fill:i<n, style:{color:i<n ? ESTADO.alerta : "rgba(255,255,255,.3)"}}); }));
}
// gráfico simples de barras por período: pontos = [{r:rótulo, v:valor}]
function Serie(p){
  var max = p.max || 5, c = p.cor || COR;
  return e("div",{className:"flex items-end justify-center gap-1.5 pt-1", style:{height:118}}, p.pontos.map(function(x, i){
    return e("div",{key:i, className:"flex min-w-0 max-w-14 flex-1 flex-col items-center justify-end gap-0.5"},
      e("span",{className:MONO+" text-[10.5px] font-bold"}, formatarNota(x.v)),
      e("div",{className:"w-full rounded-t-md", style:{height:Math.max(3, Math.round((x.v||0)/max*72)), background:"linear-gradient(180deg,"+c+","+c+"55)"}}),
      e("span",{className:"whitespace-nowrap text-[10px] text-white/70"}, x.r)); }));
}
function Vazio(p){ return e("div",{className:"flex flex-col items-center justify-center gap-1.5 px-3 py-5 text-center text-[13px] text-white/70"}, e(Ph,{n:p.ic || "tray", s:26, style:{color:COR}}), e("span",null, p.children)); }
function ErroAv(p){
  if(!p.erro) return null;
  return e("div",{role:"alert", className:"flex items-center justify-center gap-2 rounded-xl bg-[#EF4444]/15 px-3 py-2 text-center text-[13px] font-bold text-[#FCA5A5] ring-1 ring-[#EF4444]/50"}, e(Ph,{n:"warning-circle", s:17}), p.erro,
    e("button",{type:"button", onClick:function(){ p.limpar(); }, "aria-label":"Fechar aviso", className:"grid size-6 place-items-center rounded-md bg-black/30 hover:bg-black/50"}, e(Ph,{n:"x", s:12})));
}
function Campo(p){ return e("label",{className:"flex flex-col items-stretch gap-1 text-center"}, e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/70"}, cap(p.r)), p.children); }
function Texto(p){ return e("input",{type:p.tipo||"text", value:p.v, placeholder:p.ph, maxLength:p.max, min:p.min, disabled:p.ro, "aria-label":p.ph || p.r, onChange:function(ev){ p.set(ev.target.value); }, className:CAMPO+(p.ro ? " opacity-60" : "")}); }
function Area(p){ return e("textarea",{value:p.v, rows:p.linhas||3, maxLength:p.max, placeholder:p.ph, disabled:p.ro, onChange:function(ev){ p.set(ev.target.value); }, className:INPUT+" w-full resize-none py-2 text-center text-[13px]!"+(p.ro ? " opacity-60" : "")}); }
// botão de escolha (usado no lugar de lista que desce)
function Escolha(p){ return e("button",{type:"button", disabled:p.ro, onClick:p.onClick, className:"inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2.5 text-[12.5px] font-bold transition disabled:opacity-50 "+(p.on ? "text-black" : "bg-white/10 hover:bg-white/20"), style:p.on ? {background:p.cor || COR} : undefined}, p.children); }

// resposta de UMA pergunta, conforme o tipo: estrela5, nota10, multipla ou texto. valor = {num, txt}; set(novo)
function Entrada(p){
  var q = p.q, v = p.valor || {}, ro = p.leitura;
  var corpo = q.tipo==="estrela5" ? e("div",{className:"flex justify-center gap-1"}, [1,2,3,4,5].map(function(n){
      return e("button",{key:n, type:"button", disabled:ro, onClick:function(){ p.set({num:n, txt:null}); }, "aria-label":n+" estrela"+(n>1 ? "s" : ""), className:"grid size-8 place-items-center rounded-lg transition hover:bg-white/10"}, e(Ph,{n:"star", s:22, fill:v.num>=n, style:{color:v.num>=n ? ESTADO.alerta : "rgba(255,255,255,.35)"}})); }))
    : q.tipo==="nota10" ? e("div",{className:"flex flex-wrap justify-center gap-1"}, [0,1,2,3,4,5,6,7,8,9,10].map(function(n){ return e(Escolha,{key:n, ro:ro, on:v.num===n, onClick:function(){ p.set({num:n, txt:null}); }}, n); }))
    : q.tipo==="multipla" ? e("div",{className:"flex flex-wrap justify-center gap-1"}, (q.opcoes||[]).map(function(o){ return e(Escolha,{key:o, ro:ro, on:v.txt===o, onClick:function(){ p.set({num:null, txt:o}); }}, o); }))
    : e(Area,{v:v.txt||"", ro:ro, max:2000, ph:"Resposta (opcional)", set:function(t){ p.set({num:null, txt:t}); }});
  return e("div",{className:"flex flex-col items-center gap-1 rounded-xl bg-black/20 p-2 text-center ring-1 ring-white/10"}, e("b",{className:"text-[13px]"}, cap(q.texto)||"—"), corpo);
}

// cartão de uma avaliação já lançada (resultado de avCartao)
function Cartao(p){
  var c = p.c, cfg = p.cfg, linha = function(r, i){
    return e("div",{key:i, className:"flex flex-wrap items-center justify-center gap-x-2 text-[12px]"}, e("span",{className:"text-white/75"}, cap(r.texto)),
      r.num!=null ? (r.max===5 ? e(Estrelas,{v:r.num, s:12}) : e("b",{className:MONO}, r.num+"/"+r.max)) : e("b",{className:"italic"}, r.txt ? "“"+r.txt+"”" : "—")); };
  return e("div",{className:"flex flex-col items-center gap-1 rounded-xl bg-black/20 p-2 text-center ring-1 ring-white/10"},
    e("div",{className:"flex flex-wrap items-center justify-center gap-x-2 text-[12.5px]"}, e("b",null, formatarDia(c.dia)), e("span",null, c.revNome), c.repNome && e("span",{className:"text-white/70"}, "· "+c.repNome), c.kit && e("span",{className:"text-white/70"}, "· Kit "+c.kit),
      e("b",{className:MONO, style:{color:corNota(c.nota, 5, cfg)}}, formatarNota(c.nota))),
    c.representante.map(linha), c.kitRespostas.map(linha), p.children);
}

export { COR, CAMPO, cap, nomeCurto, useAv, corNota, corFunc, Barra, LinhaBarra, Nota, Estrelas, Serie, Vazio, ErroAv, Campo, Texto, Area, Escolha, Entrada, Cartao };
