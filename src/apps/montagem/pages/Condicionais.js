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
import { Vazio } from "@/apps/montagem/ui/card";
import { Bloco, Botao, CAMPO, CampoSel, FaixaTotais, Rotulo } from "@/apps/montagem/components/padrao-fin";
import { ComCelular } from "@/apps/montagem/components/visao-celular";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

var CEL = "border-b border-border px-2.5 align-middle ";
// Mesma cor (dourado) para todas as representantes: faixa na esquerda e tom leve na linha da listagem
var CORES = ["#E8B84B"];
function Linha(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = p.k, ab = useState(null), aberto = ab[0]===null ? !!p.proxima : ab[0], setAberto = ab[1], vs = useState(""), v = vs[0], setV = vs[1];
  var nums = condVisiveisPre(k), tipo = TIPO_KIT[k.tipoKit] || TIPO_KIT.acerto_kit, ok = condOkPre(k), lib = k.status!=="precond";
  var feitas = nums.filter(function(n){ return condEstado(k,n).p; }).length, faltas = nums.filter(function(n){ return condEstado(k,n).falta; }).length;
  var faixa = {borderLeft:"4px solid "+p.cor};
  var achar = function(){ nums.forEach(function(n){ var st = condEstado(k,n); if(!st.p && !st.falta) d({type:"COND_CHK_PRE", id:k.id, num:n, v:true}); }); };
  var add = function(){ if(!v.trim()) return; d({type:"COND_ADD_NUM", id:k.id, num:v.trim()}); setV(""); };
  var liberar = function(){ d({type:"LIBERAR_COND", ids:[k.id], por:s.usuario}); };
  var situ = lib ? "Liberada" : faltas ? faltas+" falta"+(faltas>1?"m":"") : ok ? "Conferida" : "A conferir";
  var corSitu = lib ? "text-success" : faltas ? "text-destructive" : ok ? "text-success" : "text-warning";
  var fechar = function(){ setAberto(false); };
  var proxN = !lib && nums.filter(function(n){ var st = condEstado(k,n); return !st.p && !st.falta; })[0];   // a condicional que a funcionária pega agora
  if(!aberto){
    return e("tr",{onClick:function(){ setAberto(true); }, className:"h-9 cursor-pointer hover:bg-white/5 "+(lib?"opacity-60":"")+(p.proxima?" bg-primary/10":"")},
      e("td",{style:faixa, className:CEL+"text-center text-muted-foreground"}, e(Icon,{n:"chevron", s:14})),
      e("td",{className:CEL+"text-center tabular-nums"}, k.horaAtend || "—"),
      e("td",{className:CEL+"truncate", title:k.rev+" · "+(k.bairro||"")}, p.proxima && e("span",{className:"mr-1.5 rounded bg-primary/25 px-1.5 text-[11px] font-bold text-primary"}, "▶ PRÓXIMA"), k.prio && e("span",{className:"text-primary"},"★ "), e("b",{className:"font-medium"}, k.rev), e("span",{className:"text-muted-foreground"}, k.bairro ? " · "+k.bairro : "")),
      e("td",{className:CEL+"truncate", title:tipo[0]}, tipo[1]),
      e("td",{className:CEL+"py-1"}, e("div",{className:"flex flex-wrap gap-x-2.5 gap-y-0.5"}, nums.map(function(n){ var st = condEstado(k,n);
        return e("span",{key:n, title:st.p?"Conferida":st.falta?"Falta":"A conferir", className:MONO+" text-[12.5px] font-bold tabular-nums "+(st.p?"text-success":st.falta?"text-destructive":"text-foreground")}, (st.p?"✓ ":st.falta?"! ":"")+n); }))),
      e("td",{className:CEL+"truncate text-center font-semibold "+corSitu, title:feitas+" de "+nums.length+" conferidas"}, situ),
      e("td",{className:CEL+"text-center", onClick:function(ev){ ev.stopPropagation(); }}, !lib && e(Botao,{principal:true, desabilitado:!ok, title: ok ? "" : "Confira todas antes de liberar", onClick:liberar}, "Liberar")));
  }
  // Aberto = formato planilha: nome, horário e tipo ocupam o bloco inteiro (rowSpan) e as condicionais ficam ao lado, uma por linha
  var span = nums.length + (lib ? 0 : 1), bg = p.proxima ? "bg-primary/10 " : "bg-white/5 ";
  var linhas = nums.map(function(n, i){
    var st = condEstado(k, n), prev = (k.cond.prev||{})[n], exp = prev && (new Date(prev).getTime()-Date.now())/86400000 > 365;
    return e("tr",{key:n, className:"h-9 "+bg},
      i===0 && e("td",{rowSpan:span, style:faixa, onClick:fechar, title:"Clique para fechar", className:"cursor-pointer border-b border-border text-center align-middle text-muted-foreground"}, e(Icon,{n:"chevrondown", s:14})),
      i===0 && e("td",{rowSpan:span, className:CEL+"border-r text-center align-middle tabular-nums"}, k.horaAtend || "—"),
      i===0 && e("td",{rowSpan:span, className:"border-b border-r border-border px-2.5 text-center align-middle"},
        p.proxima && e("div",{className:"mb-0.5 text-[11px] font-bold uppercase tracking-wide text-primary"}, "▶ Próxima"), e("div",{className:"font-semibold"}, k.prio && e("span",{className:"text-primary"},"★ "), k.rev), e("div",{className:"text-muted-foreground"}, k.bairro||""), e("div",{className:"mt-1 text-[12px] "+corSitu+" font-semibold"}, situ+" · "+feitas+"/"+nums.length)),
      i===0 && e("td",{rowSpan:span, className:"border-b border-r border-border px-2.5 text-center align-middle"}, tipo[1]),
      e("td",{className:CEL+"tabular-nums "+MONO+" font-bold "+(n===proxN?"text-primary":"")}, (n===proxN?"▶ ":"")+n, n===proxN && e("span",{className:"ml-1.5 text-[11px] font-semibold"}, "pegue agora"), exp && e("span",{className:"ml-1.5 text-[11px] font-normal text-muted-foreground"}, "expositor")),
      e("td",{className:CEL+"truncate text-center font-semibold "+(st.p?"text-success":st.imp?"text-primary":st.falta?"text-destructive":"text-warning")},
        st.p ? "✓ Conferida" : st.imp ? "Impressa" : st.falta ? "Falta" : "A conferir"),
      e("td",{className:CEL+"text-center"}, !lib && e("div",{className:"flex items-center justify-center gap-1"},
        e(Botao,{principal:n===proxN, onClick:function(){ d({type:"COND_CHK_PRE", id:k.id, num:n, v:!st.p}); }}, st.p ? "Desfazer" : "Achei"),
        !st.p && e(Botao,{desabilitado:st.falta, onClick:function(){ d({type:"COND_FALTA", id:k.id, num:n, por:s.usuario}); }}, st.falta ? "Pedida" : "Falta"))));
  });
  if(!lib) linhas.push(e("tr",{key:"acoes", className:"h-10 "+bg},
    e("td",{colSpan:2, className:CEL},
      e("div",{className:"flex items-center gap-1.5"},
        e("input",{value:v, onChange:function(ev){ setV(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") add(); }, placeholder:"Nº à mão", className:CAMPO+" w-28"}),
        e(Botao,{desabilitado:!v.trim(), onClick:add}, "Adicionar"))),
    e("td",{className:CEL+"text-center"}, e("div",{className:"flex items-center justify-center gap-1"}, !ok && e(Botao,{onClick:achar}, "Achei todas"), e(Botao,{principal:true, desabilitado:!ok, onClick:liberar}, "Liberar")))));
  return e(React.Fragment,null, linhas);
}
function Grupo(p){
  var x = p.x, ab = useState(true), aberto = ab[0], setAberto = ab[1], d = p.d;
  var pend = x.ks.filter(function(k){ return k.status==="precond"; }), prontas = pend.filter(condOkPre);
  return e(React.Fragment,null,
    e("tr",{onClick:function(){ setAberto(!aberto); }, className:"h-8 cursor-pointer", style:{background:p.cor+"26"}},
      e("td",{colSpan:7, style:{borderLeft:"4px solid "+p.cor}, className:"border-b border-border px-2.5 text-[13px]"}, e("div",{className:"flex items-center gap-2"},
        e(Icon,{n: aberto?"chevrondown":"chevron", s:14}), e("b",{className:"font-semibold", style:{color:p.cor}}, x.l.rep), e("span",{className:"text-muted-foreground"}, x.l.horario+" · "+x.ks.length+" revendedora"+(x.ks.length>1?"s":"")+" · "+pend.length+" aguardando"),
        prontas.length>0 && e("span",{className:"ml-auto", onClick:function(ev){ ev.stopPropagation(); }}, e(Botao,{onClick:function(){ d({type:"LIBERAR_COND", ids:prontas.map(function(k){return k.id;}), por:p.por}); }}, "Liberar prontas ("+prontas.length+")"))))),
    aberto && x.ks.map(function(k){ return e(Linha,{key:k.id, k:k, cor:p.cor, proxima:k.id===p.proximaId}); }));
}
function AbaCondicionais(){
  var cx = use(), s = cx.state;
  var doDia = s.kits.filter(function(k){ return k.status==="precond" || (k.cond && k.cond.liberadoEm); });
  var pend = doDia.filter(function(k){ return k.status==="precond"; });
  var faltando = pend.reduce(function(t,k){ return t + condVisiveisPre(k).filter(function(n){ return condEstado(k,n).falta; }).length; }, 0);
  var fs = useState(""), busca = fs[0], setBusca = fs[1], ts = useState("todos"), tipo = ts[0], setTipo = ts[1], ss = useState("todas"), sit = ss[0], setSit = ss[1], ls = useState("todas"), lis = ls[0], setLis = ls[1];
  var passa = function(k){
    if(busca && (k.rev||"").toLowerCase().indexOf(busca.toLowerCase())<0) return false;
    if(tipo!=="todos" && k.tipoKit!==tipo) return false;
    if(lis!=="todas" && k.lid!==lis) return false;
    var tf = condVisiveisPre(k).some(function(n){ return condEstado(k,n).falta; });
    if(sit==="falta") return k.status==="precond" && tf;
    if(sit==="aguardando") return k.status==="precond";
    if(sit==="liberadas") return k.status!=="precond";
    return true; };
  var abertas = s.listagens.filter(function(l){ return !l.fechada; });
  var grupos = abertas.slice().sort(function(a,b){ return String(a.horario).localeCompare(String(b.horario)); }).map(function(l){ return {l:l, ks: doDia.filter(function(k){ return k.lid===l.id && passa(k); }).sort(function(a,b){return a.ordem-b.ordem;})}; }).filter(function(x){ return x.ks.length>0; });
  var proximaId = null; grupos.forEach(function(x){ x.ks.forEach(function(k){ if(!proximaId && k.status==="precond" && condVisiveisPre(k).some(function(n){ var st = condEstado(k,n); return !st.p && !st.falta; })) proximaId = k.id; }); });
  if(!proximaId) grupos.forEach(function(x){ x.ks.forEach(function(k){ if(!proximaId && k.status==="precond") proximaId = k.id; }); });
  var prox = proximaId && s.kits.find(function(k){ return k.id===proximaId; });
  var proxL = prox && abertas.find(function(l){ return l.id===prox.lid; });
  var proxNums = prox ? condVisiveisPre(prox).filter(function(n){ return !condEstado(prox,n).p; }) : [];
  var prontas = []; grupos.forEach(function(x){ x.ks.forEach(function(k){ if(k.status==="precond" && condOkPre(k)) prontas.push(k); }); });
  var fila = [];
  pend.forEach(function(k){ condVisiveisPre(k).forEach(function(n){ if(condEstado(k,n).falta) fila.push({k:k, n:n, f:((k.cond||{}).faltas||{})[n]||{}}); }); });
  var opT = [["todos","Todos"]].concat(Object.keys(TIPO_KIT).map(function(c){ return [c, TIPO_KIT[c][1]]; }));
  var opL = [["todas","Todas"]].concat(abertas.map(function(l){ return [l.id, l.rep+" "+l.horario]; }));
  return e(ComCelular,{app:"condicionais"},
    e(PageHead,{t:"Condicionais", sub:"Abra a revendedora, confira cada condicional e libere para a montagem."}),
    e(FaixaTotais,{itens:[
      {t:"Aguardando", v:String(pend.length), cor: pend.length?"text-warning":""},
      {t:"Faltando", v:String(faltando), cor: faltando?"text-destructive":""},
      {t:"Prontas p/ liberar", v:String(prontas.length), cor: prontas.length?"text-success":""}]}),
    e("div",{className:"grid grid-cols-2 items-end gap-x-3 gap-y-2 md:grid-cols-5"},
      e("div",{className:"min-w-0"}, e(Rotulo,{t:"Revendedora", id:"cd-busca"}), e("input",{id:"cd-busca", type:"search", value:busca, placeholder:"Nome", onChange:function(ev){ setBusca(ev.target.value); }, className:CAMPO})),
      e(CampoSel,{id:"cd-lis", t:"Listagem", value:lis, onChange:setLis, opcoes:opL}),
      e(CampoSel,{id:"cd-tipo", t:"Tipo", value:tipo, onChange:setTipo, opcoes:opT}),
      e(CampoSel,{id:"cd-sit", t:"Situação", value:sit, onChange:setSit, opcoes:[["todas","Todas"],["aguardando","Aguardando"],["falta","Com falta"],["liberadas","Liberadas"]]}),
      e(Botao,{principal:true, desabilitado:prontas.length===0, title:"Libera todas as já conferidas", onClick:function(){ cx.dispatch({type:"LIBERAR_COND", ids:prontas.map(function(k){return k.id;}), por:s.usuario}); }}, "Liberar prontas ("+prontas.length+")")),
    prox && e("div",{className:"destaque-novo flex h-10 items-center gap-3 rounded-lg border border-primary bg-primary/10 px-3 text-[13px]"},
      e("b",{className:"text-primary"}, "▶ Próxima"), e("span",{className:"font-semibold"}, prox.rev), e("span",{className:"text-muted-foreground"}, (proxL?proxL.rep+" · ":"")+(prox.horaAtend||"")),
      e("span",{className:MONO+" ml-auto truncate font-bold"}, proxNums.length ? "Pegar: "+proxNums.join("  ") : "Tudo conferido: liberar")),
    fila.length>0 && e(Bloco,{t:"Aguardando impressão", dir:e("span",{className:"text-muted-foreground"}, fila.length+" pedida"+(fila.length>1?"s":""))},
      e("div",{className:"flex flex-col divide-y divide-border"}, fila.map(function(x){
        var min = x.f.em ? Math.max(0, Math.round((Date.now()-new Date(x.f.em).getTime())/60000)) : null;
        return e("div",{key:x.k.id+x.n, className:"flex h-9 items-center gap-3 text-[13px]"},
          e("span",{className:MONO+" w-24 truncate font-bold text-destructive"}, x.n),
          e("span",{className:"w-28 truncate font-semibold text-primary"}, (abertas.find(function(l){ return l.id===x.k.lid; })||{}).rep||""),
          e("span",{className:"min-w-0 flex-1 truncate"}, x.k.rev),
          e("span",{className:"w-20 truncate text-right text-muted-foreground"}, min===null?"":min<60?min+" min":Math.floor(min/60)+" h"),
          e(Botao,{onClick:function(){ cx.dispatch({type:"COND_IMPRESSA", id:x.k.id, num:x.n, por:s.usuario}); }}, "Impressa")); }))),
    grupos.length===0 ? e(Vazio,{txt:"Nenhuma revendedora com esse filtro."}) :
    e("div",{className:"destaque-novo overflow-x-auto rounded-lg border border-border"},
      e("table",{className:"w-full table-fixed border-collapse text-[13px]", style:{minWidth:"48rem"}},
        e("colgroup",null, ["2.5rem","4rem","14rem","10rem",null,"6.5rem","15rem"].map(function(w,i){ return e("col",{key:i, style:w?{width:w}:undefined}); })),
        e("thead",null, e("tr",null, ["","Horário","Revendedora","Tipo","Condicionais","Situação",""].map(function(c,i){ return e("th",{key:i, className:"h-[30px] truncate border-b border-border bg-white/5 px-2.5 text-[11px] font-medium uppercase tracking-[.05em] text-foreground "+(i===2||i===3?"text-left":"text-center")}, c); }))),
        e("tbody",null, grupos.map(function(x, gi){ return e(Grupo,{key:x.l.id, proximaId:proximaId, cor:CORES[gi%CORES.length], x:x, d:cx.dispatch, por:s.usuario}); })))));
}

export { AbaCondicionais };
