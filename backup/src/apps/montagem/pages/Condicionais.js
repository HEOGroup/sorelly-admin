// Sorelly Admin · montagem e bipagem — pages/Condicionais.js
//
// Antes de uma revendedora entrar na fila de montagem, a funcionária de
// condicionais confere se a condicional de cada peça está no armário; o que
// não tiver, ela marca "Falta" e sai o pedido de impressão para a Deysiane.
// Só depois de tudo conferido é que dá pra liberar — aí sim o item aparece
// em Listagens do dia pra montagem começar.
//
// Os números vêm da DevMaster (por enquanto simulados no cadastro do kit):
// saída de revendedora traz a condicional de tudo, inclusive expositor;
// acerto (com ou sem kit novo) só traz o que tem previsão de devolução nos
// próximos 90 dias — a do expositor é sempre marcada bem lá na frente, de
// propósito, pra não aparecer misturada com o acerto do dia a dia.
//
// Reaproveita os mesmos números de condicional (`k.cond`) que a montadora e
// a bipadora já usam mais na frente, só com um check próprio (chkP) pra não
// mexer no fluxo delas.
import { condEstado, condVisiveisPre, condOkPre } from "@/apps/montagem/domain/condicionais";
import { TIPO_KIT } from "@/apps/montagem/domain/status";
import { use } from "@/apps/montagem/state/context";
import { badge } from "@/apps/montagem/ui/badge";
import { Btn } from "@/apps/montagem/ui/button";
import { KPI, Vazio } from "@/apps/montagem/ui/card";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { TD, TH, TR } from "@/apps/montagem/ui/table";
import { e, useState } from "@/shared/react";
import React from "react";

var COR = {ok:"#16A34A", falta:"#DC2626", imp:"#7C3AED", pend:"#D97706"};
function Chip(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = p.k, n = p.n, st = condEstado(k, n);
  var cor = st.p ? COR.ok : st.falta ? COR.falta : st.imp ? COR.imp : COR.pend;
  // Clique no número = confirma (achei no armário) ou desfaz; o "!" separado é quem marca falta, pra não confundir uma coisa com a outra.
  var confirmar = function(){ d({type:"COND_CHK_PRE", id:k.id, num:n, v:!st.p}); };
  var faltar = function(){ d({type:"COND_FALTA", id:k.id, num:n, por:s.usuario}); };
  return e("span",{key:n, className:"inline-flex items-center overflow-hidden rounded-md text-[12px] font-bold text-white txt-branco"},
    e("button",{onClick:confirmar,
        title: st.p ? n+" · conferida (clique para desfazer)" : st.falta ? n+" · falta, aguardando impressão (clique quando a Deysiane imprimir)" : n+" · clique quando achar no armário",
        className:"inline-flex h-7 items-center gap-1.5 px-2 hover:brightness-110"},
      e("span",{className:"grid size-4 place-items-center rounded-full", style:{background:cor}}, st.p ? e(Icon,{n:"check", s:10}) : st.falta ? "!" : ""),
      e("span",{className:MONO}, n)),
    !st.p && e("button",{onClick:faltar, disabled:st.falta, title:st.falta?"Já marcada como falta":"Não achei essa condicional",
      className:"grid h-7 w-6 place-items-center bg-black/25 hover:bg-destructive disabled:opacity-40"},"!"));
}
function AddNum(p){
  var d = use().dispatch, k = p.k, vs = useState(""), v = vs[0], setV = vs[1];
  var enviar = function(){ if(!v.trim()) return; d({type:"COND_ADD_NUM", id:k.id, num:v.trim()}); setV(""); };
  return e("div",{className:"flex items-center gap-1"},
    e("input",{value:v, onChange:function(ev){setV(ev.target.value);}, onKeyDown:function(ev){ if(ev.key==="Enter") enviar(); },
      placeholder:"nº manual", className:"h-7 w-20 rounded-md border border-border bg-input/30 px-1.5 text-[11.5px] "+MONO+" outline-none focus:border-primary"}),
    e("button",{onClick:enviar, disabled:!v.trim(), title:"Adicionar condicional digitada na mão",
      className:"grid size-7 shrink-0 place-items-center rounded-md border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-40"}, e(Icon,{n:"plus", s:13})));
}
function LinhaRev(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = p.k;
  var nums = condVisiveisPre(k), tipo = TIPO_KIT[k.tipoKit] || TIPO_KIT.acerto_kit, ok = condOkPre(k);
  var liberada = k.status!=="precond";
  return e("tr",{className:TR+(liberada?" opacity-70":"")},
    e(TD,{c:true, className:MONO+" text-muted-foreground"}, p.pos+"º"),
    e(TD,{c:true, className:MONO+" text-[12.5px]!"}, k.horaAtend || "—"),
    e(TD,{className:"font-medium"}, k.prio && e("span",{className:"text-primary"},"★ "), k.rev, e("p",{className:"text-[12px] font-normal text-muted-foreground"}, k.bairro)),
    e(TD,null, e("span",{title:tipo[0], className:"inline-block max-w-full truncate rounded-md border px-1.5 py-0.5 text-[11.5px] font-semibold"}, tipo[1])),
    e(TD,{className:"whitespace-normal"}, e("div",{className:"flex flex-wrap items-center gap-1.5"}, nums.map(function(n){ return e(Chip,{key:n, k:k, n:n}); }), !liberada && e(AddNum,{key:"add", k:k}))),
    e(TD,{c:true}, liberada
      ? e("span",{className:"inline-flex items-center gap-1 text-[12.5px] font-semibold text-success"}, e(Icon,{n:"check", s:13}), "Liberada")
      : e(Btn,{v:"primary", sm:true, ic:"check", disabled:!ok, title: ok ? "" : "Confira todas as condicionais antes de liberar",
          onClick:function(){ d({type:"LIBERAR_COND", ids:[k.id], por:s.usuario}); }}, "Liberar")));
}
function GrupoListagem(p){
  var x = p.x, ab = useState(true), aberto = ab[0], setAberto = ab[1];
  var pendentes = x.ks.filter(function(k){return k.status==="precond";});
  var ok = pendentes.every(function(k){ return condOkPre(k); });
  var cor = ok ? "bg-linear-to-r from-[#B8862B] via-[#E8B84B] to-[#F1E4C6] text-[#1B1409]" : "bg-linear-to-r from-[#7A1F1F] via-[#B23A3A] to-[#D98080] text-white";
  return e("div",{className:"overflow-hidden rounded-xl"},
    e("button",{onClick:function(){ setAberto(!aberto); }, "aria-expanded":aberto,
        className:"flex w-full items-center gap-2 px-3.5 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,.35)] "+cor+" "+(aberto?"rounded-t-xl":"rounded-xl")},
      e(Icon,{n: aberto?"chevrondown":"chevron", s:16}),
      e("b",{className:"font-heading text-[15px] font-bold"}, x.l.rep), badge(x.l.horario, "muted"),
      pendentes.length===0 ? badge("tudo liberado","success") : ok ? badge("tudo conferido","success") : badge(pendentes.length+" aguardando","warning"),
      x.ks.length>pendentes.length && badge((x.ks.length-pendentes.length)+" já liberada"+(x.ks.length-pendentes.length>1?"s":""), "muted")),
    aberto && e("div",{className:"overflow-x-auto rounded-b-xl border border-t-0 border-border bg-card"},
      e("table",{className:"w-full min-w-[54rem] border-collapse text-sm"},
        e("thead",null, e("tr",{className:"bg-sidebar"},
          e(TH,{c:true},"Ordem"), e(TH,{c:true},"Horário"), e(TH,null,"Nome"), e(TH,null,"Tipo"), e(TH,null,"Condicionais"), e(TH,{c:true},"Situação"))),
        e("tbody",null, x.ks.map(function(k,i){ return e(LinhaRev,{key:k.id, k:k, pos:i+1}); })))));
}
function AbaCondicionais(){
  var cx = use(), s = cx.state;
  // Consolidado do dia: continua na tela até a listagem inteira fechar — a que ainda tá conferindo e a que já foi liberada hoje
  var doDia = s.kits.filter(function(k){ return k.status==="precond" || (k.cond && k.cond.liberadoEm); });
  var pend = doDia.filter(function(k){ return k.status==="precond"; });
  var faltando = pend.reduce(function(t,k){ return t + condVisiveisPre(k).filter(function(n){ return condEstado(k,n).falta; }).length; }, 0);
  var porListagem = s.listagens.filter(function(l){ return !l.fechada; }).map(function(l){
    return {l:l, ks: doDia.filter(function(k){return k.lid===l.id;}).sort(function(a,b){return a.ordem-b.ordem;})}; }).filter(function(x){return x.ks.length>0;});
  return e(React.Fragment,null,
    e(PageHead,{t:"Condicionais", sub:"Confira as condicionais de cada revendedora antes de liberar para a fila de montagem. Saída leva a condicional de tudo, inclusive expositor; acerto (com ou sem kit novo) só traz o que vence nos próximos 90 dias. Fica tudo aqui até a listagem inteira concluir."}),
    e("div",{className:"grid grid-cols-2 gap-3 md:grid-cols-3"},
      e(KPI,{l:"Revendedoras aguardando", v:pend.length, tom: pend.length?"text-warning":""}),
      e(KPI,{l:"Condicionais faltando", v:faltando, tom: faltando?"text-destructive":"", sub:"aguardando impressão"}),
      e(KPI,{l:"Listagens com pendência", v:porListagem.filter(function(x){return x.ks.some(function(k){return k.status==="precond";});}).length})),
    porListagem.length===0 ? e(Vazio,{txt:"Nenhuma revendedora esperando conferência. Tudo liberado para a fila."}) :
    e("div",{className:"flex flex-col gap-4"}, porListagem.map(function(x){ return e(GrupoListagem,{key:x.l.id, x:x}); })));
}

export { AbaCondicionais };
