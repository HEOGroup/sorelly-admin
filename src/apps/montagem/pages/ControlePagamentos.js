// Sorelly Admin · montagem — pages/ControlePagamentos.js
// Financeiro → Controle de pagamentos (primeira aba). Para onde vai o Pix das revendedoras: o Financeiro cria orientações ("direcionar R$ X para tal conta até tal data"), o sistema mostra quanto falta
// e sugere o destino de cada Pix que chega; o Lucas confirma ou troca. Também é aqui que se define a conta dos pagamentos do atendimento interno (saiu da Visão geral). Contexto: FLUXO-DE-PAGAMENTOS.md.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { PagamentosAConferir } from "@/apps/montagem/components/pagamentos-conferir";
import { TIPOS_DESTINO, direcionado, faltaDe, hojeIsoCp, sugestoes } from "@/apps/montagem/domain/controle-pagamentos";
import { nomeDe, podeConferirPag, podeFinanceiro } from "@/apps/montagem/domain/equipe";
import { BKC as BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { Dinheiro, Indicador, Mosaico, Pagina } from "@/apps/montagem/components/padrao";
import { e, useState } from "@/shared/react";
import React from "react";

var int = function(v){ return Math.round(v||0).toLocaleString("pt-BR"); };
var num = function(t){ var n = Number(String(t||"").replace(/\./g,"").replace(",",".")); return isNaN(n) ? 0 : n; };
var br = function(iso){ return iso ? iso.split("-").reverse().join("/") : "sem data"; };
var th = function(t){ return e("th",{key:t, className:"whitespace-nowrap border-b border-border px-3 py-2 text-left text-[11.5px] font-semibold uppercase tracking-wide"}, t); };
var CARD = "rounded-xl bg-linear-to-br from-[#3B82F6]/20 via-card to-card px-3 py-2 ring-1 ring-[#3B82F6]/40";

function useCP(){ var cx = use(), s = cx.state; return {s:s, d:cx.dispatch, cp:s.cp, por:nomeDe(s.usuario), edita:podeConferirPag(s.usuario) || podeFinanceiro(s.usuario)}; }
function acao(c, op, extra){ c.d(Object.assign({type:"CP", op:op, por:c.por}, extra)); }
function Campo(p){ return e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold "+(p.className||"")}, p.rot, p.children); }
function Sel(p){ return e("select",{value:p.value, "aria-label":p.label, className:INPUT+" h-10! cursor-pointer "+(p.className||"w-48"), onChange:function(ev){ p.onChange(ev.target.value); }}, p.children); }
function Txt(p){ return e("input",{value:p.value, type:p.type||"text", placeholder:p.ph||"", "aria-label":p.label, className:INPUT+" h-10! "+(p.className||"w-full"), onChange:function(ev){ p.onChange(ev.target.value); }}); }
function Tile(p){ return e(Indicador,{t:p.t, v:p.v, cor:p.cor, sub:p.sub}); }   // padrão único: components/padrao.js
var destinoDe = function(cp, id){ return cp.destinos.find(function(x){ return x.id===id; }) || {nome:"(destino removido)", tipo:"CNPJ", chavePix:""}; };
var copiar = function(c, txt){ try{ navigator.clipboard.writeText(txt); c.d({type:"AVISO", txt:"Chave Pix copiada"}); }catch(x){} };
var chipTipo = function(t){ var k = TIPOS_DESTINO[t]||["—","#94A3B8"]; return e("span",{className:"whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-bold", style:{background:k[1]+"26", color:k[1]}}, k[0]); };

// ── Chegou um Pix? Para onde vai
function ParaOndeVai(p){
  var c = p.c, cp = c.cp, st = useState({valor:"", origem:""}), f = st[0], set = function(o){ st[1](Object.assign({}, f, o)); }, restante = num(f.valor), sug = sugestoes(cp);
  var direcionar = function(s){ var aplica = Math.min(restante, s.falta); acao(c, "orient_lanc", {id:s.o.id, valor:aplica, origem:f.origem}); set({valor:restante-aplica>0.004 ? String(Math.round((restante-aplica)*100)/100).replace(".", ",") : ""}); };
  return e(BlocoBarra,{cor:"azul", t:"Chegou um Pix? Para onde vai", sub:"Informe o valor: o sistema indica o destino prioritário e você confirma ou escolhe outro"}, e("div",{className:"flex flex-col gap-2 p-3"},
    e("div",{className:"flex flex-wrap items-end gap-2"}, e(Campo,{rot:"Valor do Pix (R$)"}, e(Dinheiro,{out:"ptbr", value:f.valor, label:"Valor do Pix", className:"w-44", onChange:function(v){ set({valor:v}); }})), e(Campo,{rot:"Revendedora (opcional)", className:"min-w-[14rem] flex-1"}, e(Txt,{value:f.origem, label:"Revendedora", onChange:function(v){ set({origem:v}); }})),
      restante>0 && e("span",{className:"pb-2 text-[13px]"}, "Falta direcionar ", e("b",{className:MONO+" text-primary"}, BK(restante)))),
    sug.length===0 ? e("p",{className:"rounded-xl bg-muted/30 px-3 py-2 text-center text-[13px] text-muted-foreground"}, "Nenhuma orientação em aberto. Cadastre uma orientação para que o sistema indique o destino.") :
    e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-2"}, sug.slice(0, 6).map(function(s, i){ var d = destinoDe(cp, s.o.destinoId), cor = (TIPOS_DESTINO[d.tipo]||[0,"#94A3B8"])[1];
      return e("div",{key:s.o.id, className:"flex flex-col gap-1.5 rounded-xl p-3", style:{background:"linear-gradient(135deg,"+cor+"2e,"+cor+"0a 70%)", boxShadow:"inset 0 0 0 1px "+(i===0 ? cor : cor+"55")}},
        e("div",{className:"flex items-center justify-between gap-2"}, e("b",{className:"text-[14.5px]"}, (i===0 ? "★ " : "")+d.nome), chipTipo(d.tipo)),
        e("span",{className:"text-[12.5px] "+(s.atrasada ? "font-bold text-destructive" : "text-white/80")}, (s.atrasada ? "Atrasado · " : "")+(s.o.ate ? "até "+br(s.o.ate) : "sem data")+(s.o.obs ? " · "+s.o.obs : "")),
        e("b",{className:MONO+" text-[19px]"}, "Falta "+BK(s.falta)), d.chavePix && e("button",{onClick:function(){ copiar(c, d.chavePix); }, className:"w-fit rounded-lg bg-black/30 px-2.5 py-1 text-[11.5px] font-semibold hover:bg-black/50"}, "⧉ Copiar chave Pix"),
        e(Btn,{v:i===0 ? "primary" : "secondary", sm:true, disabled:!c.edita || !(restante>0), onClick:function(){ direcionar(s); }}, restante>0 ? "Direcionar "+BK(Math.min(restante, s.falta))+" aqui" : "Digite o valor do Pix")); }))));
}

// ── Uma orientação (card com progresso)
function CartaoOrient(p){
  var c = p.c, cp = c.cp, o = p.o, d = destinoDe(cp, o.destinoId), cor = (TIPOS_DESTINO[d.tipo]||[0,"#94A3B8"])[1], dir = direcionado(o), falta = faltaDe(o), pct = o.valor>0 ? Math.min(100, dir/o.valor*100) : 0, atrasada = o.status==="aberta" && o.ate && o.ate<hojeIsoCp();
  var ab = useState(false), aberto = ab[0], setAberto = ab[1], nl = useState({valor:"", origem:""}), l = nl[0], setL = nl[1], sobra = Math.max(0, dir-o.valor);
  return e("div",{className:"flex flex-col gap-2 rounded-xl p-3 "+(o.status!=="aberta" ? "opacity-70" : ""), style:{background:"linear-gradient(135deg,"+cor+"2a,"+cor+"08 70%)", boxShadow:"inset 0 0 0 1px "+cor+"55"}},
    e("div",{className:"flex flex-wrap items-center justify-between gap-2"}, e("span",{className:"flex items-center gap-2"}, e("b",{className:"text-[15px]"}, d.nome), chipTipo(d.tipo)),
      e("span",{className:"flex items-center gap-2 text-[12.5px]"}, atrasada && e("span",{className:"rounded-full bg-destructive/25 px-2 py-0.5 font-bold text-destructive"}, "Atrasada"), e("span",{className:"text-white/75"}, o.ate ? "até "+br(o.ate) : "sem data"), o.status!=="aberta" && e("span",{className:"rounded-full bg-white/15 px-2 py-0.5 font-bold"}, o.status==="concluida" ? "Concluída" : "Cancelada"))),
    o.obs && e("p",{className:"text-[12.5px] text-white/80"}, o.obs),
    e("div",{className:"flex flex-wrap items-end justify-between gap-2"}, e("span",{className:"text-[13px]"}, "Direcionado ", e("b",{className:MONO}, BK(dir)), " de ", e("b",{className:MONO}, BK(o.valor))), e("b",{className:MONO+" text-[17px] "+(falta>0 ? "text-[#FBBF24]" : "text-success")}, falta>0 ? "Falta "+BK(falta) : sobra>0.004 ? "Pago a mais: "+BK(sobra) : "✓ Completo")),
    e("span",{className:"h-2.5 overflow-hidden rounded-full bg-white/15"}, e("span",{className:"block h-full rounded-full", style:{width:Math.max(2, pct)+"%", background:"linear-gradient(90deg,"+cor+"99,"+cor+")"}})),
    e("div",{className:"flex flex-wrap items-center gap-2"}, c.edita && o.status==="aberta" && e("div",{className:"flex items-center gap-1.5"}, e(Dinheiro,{out:"ptbr", value:l.valor, label:"Valor do Pix", className:"w-36", onChange:function(v){ setL(Object.assign({}, l, {valor:v})); }}),
        e("input",{value:l.origem, placeholder:"Revendedora", "aria-label":"Revendedora", className:INPUT+" h-8! w-36 text-[13px]", onChange:function(ev){ setL(Object.assign({}, l, {origem:ev.target.value})); }}), e(Btn,{v:"secondary", sm:true, disabled:!(num(l.valor)>0), onClick:function(){ acao(c, "orient_lanc", {id:o.id, valor:num(l.valor), origem:l.origem}); setL({valor:"", origem:""}); }}, "Registrar Pix")),
      e("span",{className:"flex-1"}), o.lanc.length>0 && e("button",{onClick:function(){ setAberto(!aberto); }, className:"text-[12px] font-semibold underline"}, aberto ? "esconder Pix" : o.lanc.length+" Pix"),
      c.edita && (o.status==="aberta" ? e(React.Fragment,null, e(Btn,{v:"ghost", sm:true, onClick:function(){ acao(c, "orient_status", {id:o.id, status:"concluida"}); }}, "Concluir"), e(Btn,{v:"ghost", sm:true, onClick:function(){ acao(c, "orient_status", {id:o.id, status:"cancelada"}); }}, "Cancelar")) : e(Btn,{v:"ghost", sm:true, onClick:function(){ acao(c, "orient_status", {id:o.id, status:"aberta"}); }}, "Reabrir")),
      c.edita && e("button",{onClick:function(){ if(window.confirm("Excluir esta orientação e os Pix registrados nela?")) acao(c, "orient_del", {id:o.id}); }, "aria-label":"Excluir", className:"grid size-8 place-items-center rounded-lg bg-black/25 text-white/70 hover:bg-destructive/30"}, e(Ph,{n:"trash", s:14}))),
    aberto && e("div",{className:"flex flex-col divide-y divide-white/10 rounded-lg bg-black/20 px-3"}, o.lanc.slice().reverse().map(function(x){ return e("div",{key:x.id, className:"flex items-center justify-between gap-2 py-1.5 text-[12.5px]"}, e("span",null, br(x.data)+(x.origem ? " · "+x.origem : "")+" · "+x.por), e("span",{className:"flex items-center gap-2"}, e("b",{className:MONO}, BK(x.valor)), c.edita && e("button",{onClick:function(){ acao(c, "lanc_del", {id:o.id, lancId:x.id}); }, "aria-label":"Remover Pix", className:"text-white/60 hover:text-destructive"}, e(Ph,{n:"x", s:12})))); })));
}
function Orientacoes(p){
  var c = p.c, cp = c.cp, fl = useState("aberta"), filtro = fl[0], setFiltro = fl[1], st = useState({destinoId:"", valor:"", ate:"", obs:""}), f = st[0], set = function(o){ st[1](Object.assign({}, f, o)); };
  var lista = cp.orientacoes.filter(function(o){ return filtro==="todas" || o.status===filtro; }).sort(function(a, b){ return (a.status==="aberta" ? 0 : 1)-(b.status==="aberta" ? 0 : 1) || (a.ate||"9999").localeCompare(b.ate||"9999"); });
  return e(BlocoBarra,{cor:"azul", t:"Orientações de pagamento", sub:"Valores solicitados pelo Financeiro, quanto já foi direcionado e quanto falta", dir:String(cp.orientacoes.filter(function(o){ return o.status==="aberta"; }).length)}, e("div",{className:"flex flex-col gap-3 p-4"},
    c.edita && e("div",{className:"flex flex-wrap items-end gap-2 rounded-xl bg-black/25 p-2"},
      e(Campo,{rot:"Destino"}, e(Sel,{value:f.destinoId, label:"Destino", className:"w-64", onChange:function(v){ set({destinoId:v}); }}, e("option",{value:""}, "Escolha…"), Object.keys(TIPOS_DESTINO).map(function(t){ return e("optgroup",{key:t, label:TIPOS_DESTINO[t][0]}, cp.destinos.filter(function(d){ return d.ativo && d.tipo===t; }).map(function(d){ return e("option",{key:d.id, value:d.id}, d.nome); })); }))),
      e(Campo,{rot:"Valor a direcionar (R$)"}, e(Txt,{value:f.valor, label:"Valor", className:"w-36", onChange:function(v){ set({valor:v.replace(/[^\d,.]/g,"")}); }})), e(Campo,{rot:"Até quando"}, e(Txt,{value:f.ate, type:"date", label:"Prazo", className:"w-44", onChange:function(v){ set({ate:v}); }})),
      e(Campo,{rot:"Observação", className:"min-w-[12rem] flex-1"}, e(Txt,{value:f.obs, label:"Observação", ph:"Ex.: direcionar direto para o Safra", onChange:function(v){ set({obs:v}); }})),
      e(Btn,{v:"primary", disabled:!f.destinoId || !(num(f.valor)>0), onClick:function(){ acao(c, "orient_add", {destinoId:f.destinoId, valor:num(f.valor), ate:f.ate, obs:f.obs}); set({valor:"", obs:""}); }}, "Criar orientação")),
    e("div",{className:"flex gap-2"}, [["aberta","Em aberto"], ["concluida","Concluídas"], ["cancelada","Canceladas"], ["todas","Todas"]].map(function(x){ return e("button",{key:x[0], onClick:function(){ setFiltro(x[0]); }, className:"h-9 rounded-xl px-4 text-[13px] font-bold ring-1 "+(filtro===x[0] ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-border hover:bg-muted/50")}, x[1]); })),
    lista.length===0 ? e("p",{className:"py-3 text-center text-[13px] text-muted-foreground"}, "Nenhuma orientação neste filtro.") : e("div",{className:"grid grid-cols-1 gap-2"}, lista.map(function(o){ return e(CartaoOrient,{key:o.id, c:c, o:o}); }))));
}

// ── Destinos (contas e pessoas que recebem): busca, filtro por tipo e cartões que se ajustam à largura
function CartaoDestino(p){
  var c = p.c, d = p.d, cor = (TIPOS_DESTINO[d.tipo]||[0,"#94A3B8"])[1], ed = function(patch){ acao(c, "destino_set", {id:d.id, patch:patch}); };
  var IN = INPUT+" h-10! w-full text-[14px]!";
  return e("div",{className:"flex min-w-0 flex-col gap-2 rounded-xl p-3 text-center "+(d.ativo ? "" : "opacity-50"), style:{background:"linear-gradient(135deg,"+cor+"26,"+cor+"08 70%)", boxShadow:"inset 0 0 0 1px "+cor+"55"}},
    e("div",{className:"flex flex-wrap items-center justify-center gap-x-2 gap-y-1"}, e("b",{className:"min-w-0 text-[15px] leading-tight"}, d.nome), chipTipo(d.tipo)),
    e("input",{key:d.banco, defaultValue:d.banco, placeholder:"Banco", "aria-label":"Banco", disabled:!c.edita, className:IN+" text-center", onBlur:function(ev){ if(ev.target.value!==d.banco) ed({banco:ev.target.value}); }}),
    e("div",{className:"flex items-center gap-1.5"}, e("input",{key:d.chavePix, defaultValue:d.chavePix, "aria-label":"Chave Pix", placeholder:"sem chave Pix", disabled:!c.edita, className:IN+" text-center", onBlur:function(ev){ if(ev.target.value!==d.chavePix) ed({chavePix:ev.target.value}); }}),
      d.chavePix && e("button",{onClick:function(){ copiar(c, d.chavePix); }, title:"Copiar chave Pix", "aria-label":"Copiar chave Pix", className:"grid size-10 shrink-0 place-items-center rounded-lg bg-white/10 hover:bg-white/20"}, e(Ph,{n:"copy", s:16}))),
    e("div",{className:"flex items-center justify-between gap-2 text-[13px]"},
      e("label",{className:"flex cursor-pointer items-center gap-2 font-semibold"}, e("input",{type:"checkbox", checked:d.ativo, disabled:!c.edita, className:"size-4", onChange:function(ev){ ed({ativo:ev.target.checked}); }}), d.ativo ? "Ativo" : "Inativo"),
      c.edita && e("button",{onClick:function(){ if(window.confirm("Excluir "+d.nome+"?")) acao(c, "destino_del", {id:d.id}); }, "aria-label":"Excluir", title:"Excluir", className:"grid size-9 place-items-center rounded-lg bg-muted/50 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"}, e(Ph,{n:"trash", s:16}))));
}
function Destinos(p){
  var c = p.c, cp = c.cp, st = useState({nome:"", tipo:"FORNECEDOR", banco:"", chavePix:""}), f = st[0], set = function(o){ st[1](Object.assign({}, f, o)); };
  var fl = useState({q:"", tipo:""}), filtro = fl[0], setFiltro = function(o){ fl[1](Object.assign({}, filtro, o)); };
  var norm = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); };
  var lista = cp.destinos.filter(function(d){ return (!filtro.tipo || d.tipo===filtro.tipo) && (!filtro.q || norm(d.nome+" "+d.banco+" "+d.chavePix).indexOf(norm(filtro.q))>=0); });
  var conta = function(t){ return cp.destinos.filter(function(d){ return !t || d.tipo===t; }).length; };
  var chip = function(t, rot, cor){ var on = filtro.tipo===t; return e("button",{key:t||"todos", type:"button", onClick:function(){ setFiltro({tipo:t}); }, className:"rounded-full px-3 py-1.5 text-[13px] font-bold transition "+(on ? "text-black" : "bg-muted/50 text-white hover:bg-white/15"), style:on ? {background:cor} : undefined}, rot+" · "+conta(t)); };
  return e(BlocoBarra,{cor:"azul", t:"Destinos", sub:"Contas e pessoas que recebem Pix", dir:String(cp.destinos.filter(function(d){ return d.ativo; }).length), compacto:true}, e("div",{className:"flex flex-col gap-2.5 p-3"},
    e("div",{className:"flex flex-wrap items-center justify-center gap-2"},
      e("input",{type:"search", value:filtro.q, placeholder:"🔍 Buscar nome, banco ou chave Pix", "aria-label":"Buscar destino", className:INPUT+" h-10! w-full max-w-sm text-[14px]!", onChange:function(ev){ setFiltro({q:ev.target.value}); }}),
      e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"}, chip("", "Todos", "#F3D98B"), Object.keys(TIPOS_DESTINO).map(function(t){ return chip(t, TIPOS_DESTINO[t][0], TIPOS_DESTINO[t][1]); }))),
    c.edita && e("div",{className:"flex flex-wrap items-end justify-center gap-2 rounded-xl bg-black/25 p-2.5"}, e(Txt,{value:f.nome, ph:"Nome do destino", label:"Nome do destino", className:"w-52", onChange:function(v){ set({nome:v}); }}), e(Sel,{value:f.tipo, label:"Tipo", className:"w-48", onChange:function(v){ set({tipo:v}); }}, Object.keys(TIPOS_DESTINO).map(function(t){ return e("option",{key:t, value:t}, TIPOS_DESTINO[t][0]); })),
      e(Txt,{value:f.banco, ph:"Banco", label:"Banco", className:"w-36", onChange:function(v){ set({banco:v}); }}), e(Txt,{value:f.chavePix, ph:"Chave Pix", label:"Chave Pix", className:"w-56", onChange:function(v){ set({chavePix:v}); }}), e(Btn,{v:"secondary", disabled:!f.nome.trim(), onClick:function(){ acao(c, "destino_add", f); set({nome:"", chavePix:"", banco:""}); }}, "+ Destino")),
    lista.length ? e("div",{className:"grid gap-2.5", style:{gridTemplateColumns:"repeat(auto-fill, minmax(min(100%, 17rem), 1fr))"}}, lista.map(function(d){ return e(CartaoDestino,{key:d.id, c:c, d:d}); }))
      : e("p",{className:"py-4 text-center text-[14px] text-muted-foreground"}, "Nenhum destino com esse filtro."),
    e("p",{className:"text-center text-[12px] text-muted-foreground"}, "As chaves Pix ficam só neste computador (não vão para o GitHub).")));
}

function AbaControlePagamentos(){
  var c = useCP(), cp = c.cp, hoje = hojeIsoCp(), abertas = cp.orientacoes.filter(function(o){ return o.status==="aberta"; });
  var falta = abertas.reduce(function(t, o){ return t+faltaDe(o); }, 0), atras = abertas.filter(function(o){ return o.ate && o.ate<hoje && faltaDe(o)>0; });
  var hojeDir = cp.orientacoes.reduce(function(t, o){ return t+o.lanc.filter(function(x){ return x.data===hoje; }).reduce(function(u, x){ return u+x.valor; }, 0); }, 0);
  return e(Pagina,null,
    e(PageHead,{t:"Controle de pagamentos", sub:"Destino dos Pix das revendedoras e conta dos pagamentos do atendimento interno."}),
    e("div",{className:"grid grid-cols-2 gap-2 md:grid-cols-4"}, e(Tile,{t:"Falta direcionar", v:BK(falta), cor:"#FBBF24", sub:abertas.length+" orientações em aberto"}), e(Tile,{t:"Atrasadas", v:int(atras.length), cor:atras.length ? "#EF4444" : "#4ADE80", sub:atras.length ? BK(atras.reduce(function(t, o){ return t+faltaDe(o); }, 0))+" vencido" : "nada vencido"}),
      e(Tile,{t:"Direcionado hoje", v:BK(hojeDir), cor:"#4ADE80"}), e(Tile,{t:"Destinos ativos", v:int(cp.destinos.filter(function(d){ return d.ativo; }).length), cor:"#22D3EE"})),
    e(Mosaico,{min:"26rem"}, e(ParaOndeVai,{c:c}), e(Orientacoes,{c:c}), e(PagamentosAConferir,null)),
    e(Destinos,{c:c}));
}

export { AbaControlePagamentos };
