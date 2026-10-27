// Sorelly Admin · montagem e bipagem — mobile/condicionais.js
//
// Versão celular da conferência de condicionais (mesmas cores e peças do Admin; aparece ao lado da tela em "Ver no celular").
// O app conduz um passo de cada vez: revendedora da VEZ (listagem por horário, depois ordem da fila), a condicional que ela
// pega AGORA, e ao liberar pula sozinho para a próxima. A fila embaixo deixa trocar de revendedora.
import { condEstado, condVisiveisPre, condOkPre } from "@/apps/montagem/domain/condicionais";
import { TIPO_KIT } from "@/apps/montagem/domain/status";
import { use } from "@/apps/montagem/state/context";
import { Vazio } from "@/apps/montagem/ui/card";
import { e, useState } from "@/shared/react";

var PRIM = "border border-primary bg-primary/20 text-primary hover:bg-primary/30";   // mesmo botão principal do Admin
var NEUT = "border border-border bg-card text-foreground hover:bg-white/10";
var CARD = "rounded-lg border border-border bg-card/60";

// Uma condicional por linha, botões grandes (44 px) para o dedo
function LinhaCond(p){
  var d = use().dispatch, k = p.k, n = p.n, st = condEstado(k, n), vez = p.vez;
  var cor = st.p ? "text-success" : st.falta ? "text-destructive" : st.imp ? "text-primary" : vez ? "text-primary" : "text-warning";
  var situ = st.p ? "✓ Conferida" : st.imp ? "Impressa · conferir" : st.falta ? "Falta · imprimir" : vez ? "Pegue agora" : "A conferir";
  return e("div",{className:"flex min-h-14 items-center gap-2 rounded-lg border px-3 py-2 "+(vez ? "border-primary bg-primary/10" : "border-border")},
    e("div",{className:"min-w-0 flex-1"},
      e("p",{className:"font-mono text-[16px] font-bold tabular-nums leading-tight"}, n),
      e("p",{className:"truncate text-[12px] font-semibold "+cor}, situ)),
    e("button",{onClick:function(){ d({type:"COND_CHK_PRE", id:k.id, num:n, v:!st.p}); },
      className:"h-11 min-w-20 rounded-md px-3 text-[13px] "+(vez ? PRIM+" font-semibold" : NEUT)}, st.p ? "Desfazer" : "Achei"),
    !st.p && e("button",{onClick:function(){ d({type:"COND_FALTA", id:k.id, num:n, por:"celcond"}); }, disabled:st.falta,
      className:"h-11 min-w-16 rounded-md border border-border bg-card px-3 text-[13px] text-destructive hover:bg-white/10 disabled:opacity-40"}, st.falta ? "Pedida" : "Falta"));
}
// Cartão grande da revendedora aberta
function CartaoAtual(p){
  var cx = use(), d = cx.dispatch, k = p.k, l = p.l, nums = condVisiveisPre(k), ok = condOkPre(k);
  var tipo = TIPO_KIT[k.tipoKit] || TIPO_KIT.acerto_kit, lib = k.status!=="precond";
  var vs = useState(""), v = vs[0], setV = vs[1];
  var feitas = nums.filter(function(n){ return condEstado(k,n).p; }).length;
  var vezN = !lib && nums.filter(function(n){ var st = condEstado(k,n); return !st.p && !st.falta; })[0];
  var add = function(){ if(!v.trim()) return; d({type:"COND_ADD_NUM", id:k.id, num:v.trim()}); setV(""); };
  return e("div",{onClickCapture:p.fixar, className:"flex flex-col gap-3 p-3 "+CARD+(p.proxima ? " border-primary" : "")},
    e("div",{className:"flex items-center justify-between"},
      e("span",{className:"text-[11px] font-bold uppercase tracking-[.05em] "+(p.proxima ? "text-primary" : "text-muted-foreground")}, p.proxima ? "▶ Próxima" : "Aberta"),
      e("span",{className:"text-[12px] text-muted-foreground"}, tipo[1])),
    e("div",{className:"text-center"},
      e("p",{className:"text-[18px] font-bold leading-tight"}, k.prio && e("span",{className:"text-primary"},"★ "), k.rev),
      e("p",{className:"text-[12.5px] text-muted-foreground"}, [k.bairro, l ? l.rep+" · "+l.horario : "", k.horaAtend ? "atende "+k.horaAtend : ""].filter(Boolean).join(" · "))),
    e("div",{className:"flex items-center gap-2"},
      e("div",{className:"h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"}, e("div",{className:"h-full bg-primary", style:{width:(nums.length ? feitas/nums.length*100 : 100)+"%"}})),
      e("span",{className:"text-[12px] font-semibold tabular-nums text-muted-foreground"}, feitas+"/"+nums.length)),
    e("div",{className:"flex flex-col gap-2"}, nums.map(function(n){ return e(LinhaCond,{key:n, k:k, n:n, vez:n===vezN}); })),
    !lib && e("div",{className:"flex gap-2"},
      e("input",{value:v, onChange:function(ev){ setV(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") add(); }, placeholder:"Número à mão", inputMode:"numeric",
        className:"h-11 min-w-0 flex-1 rounded-md border border-border bg-input/30 px-3 text-[13px] outline-none focus:border-primary"}),
      e("button",{onClick:add, disabled:!v.trim(), className:"h-11 rounded-md px-4 text-[13px] disabled:opacity-40 "+NEUT}, "Adicionar")),
    !lib && !vezN && !ok && e("p",{className:"text-center text-[12.5px] font-semibold text-destructive"}, "Falta imprimir. Vá para a próxima e volte quando a Deysiane imprimir."),
    lib ? e("p",{className:"py-1 text-center text-[13px] font-semibold text-success"}, "✓ Liberada para a fila")
      : e("div",{className:"flex flex-col gap-2"},
          !ok && e("button",{onClick:function(){ nums.forEach(function(n){ var st = condEstado(k,n); if(!st.p && !st.falta) d({type:"COND_CHK_PRE", id:k.id, num:n, v:true}); }); },
            className:"h-11 rounded-md text-[13px] "+NEUT}, "Achei todas"),
          e("button",{disabled:!ok, onClick:function(){ d({type:"LIBERAR_COND", ids:[k.id], por:"celcond"}); p.aoLiberar(); },
            className:"h-12 rounded-md text-[14px] font-semibold disabled:opacity-40 "+(ok ? PRIM : NEUT)}, ok ? "Liberar e ir para a próxima" : "Confira todas para liberar")));
}
function CelCondicionais(){
  var s = use().state, sl = useState(null), sel = sl[0], setSel = sl[1];
  var doDia = s.kits.filter(function(k){ return k.status==="precond" || (k.cond && k.cond.liberadoEm); });
  if(!doDia.length) return e(Vazio,{txt:"Nenhuma revendedora esperando conferência."});
  // fila na ordem de trabalho: listagem por horário, depois a ordem da fila
  var ordem = s.listagens.filter(function(l){ return !l.fechada; }).sort(function(a,b){ return String(a.horario).localeCompare(String(b.horario)); });
  var fila = [];
  ordem.forEach(function(l){ doDia.filter(function(k){ return k.lid===l.id; }).sort(function(a,b){ return a.ordem-b.ordem; }).forEach(function(k){ fila.push({k:k, l:l}); }); });
  var pend = fila.filter(function(x){ return x.k.status==="precond"; });
  var temVez = function(k){ return condVisiveisPre(k).some(function(n){ var st = condEstado(k,n); return !st.p && !st.falta; }); };
  var prox = pend.filter(function(x){ return temVez(x.k); })[0] || pend[0], atual = (sel && fila.find(function(x){ return x.k.id===sel; })) || prox || fila[0];
  var libs = fila.length-pend.length, faltas = pend.reduce(function(t,x){ return t + condVisiveisPre(x.k).filter(function(n){ return condEstado(x.k,n).falta; }).length; }, 0);
  return e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"grid grid-cols-3 overflow-hidden text-center "+CARD},
      [["Na fila", pend.length, ""],["Liberadas", libs, libs ? "text-success" : ""],["Faltas", faltas, faltas ? "text-destructive" : ""]].map(function(c, i){ return e("div",{key:c[0], className:"px-2 py-1.5 "+(i ? "border-l border-border" : "")},
        e("p",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, c[0]), e("p",{className:"text-[18px] font-medium tabular-nums "+c[2]}, c[1])); })),
    atual && e(CartaoAtual,{key:atual.k.id, k:atual.k, l:atual.l, proxima:prox && prox.k.id===atual.k.id, fixar:function(){ if(!sel) setSel(atual.k.id); }, aoLiberar:function(){ setSel(null); }}),
    e("p",{className:"px-1 text-[11px] font-medium uppercase tracking-[.05em]"}, "Fila · toque para abrir"),
    e("div",{className:"flex flex-col overflow-hidden "+CARD}, fila.map(function(x, i){
      var k = x.k, nums = condVisiveisPre(k), lib = k.status!=="precond", ehProx = prox && prox.k.id===k.id, on = atual && atual.k.id===k.id;
      var feitas = nums.filter(function(n){ return condEstado(k,n).p; }).length, f = nums.filter(function(n){ return condEstado(k,n).falta; }).length;
      return e("button",{key:k.id, onClick:function(){ setSel(k.id); },
        className:"flex min-h-12 items-center gap-2 px-3 py-2 text-left hover:bg-white/5 "+(i ? "border-t border-border " : "")+(on ? "bg-white/10 " : "")+(lib ? "opacity-50" : "")},
        e("span",{className:"w-11 shrink-0 text-[12px] tabular-nums text-muted-foreground"}, x.l.horario),
        e("span",{className:"min-w-0 flex-1"},
          e("span",{className:"block truncate text-[13px] font-medium"}, ehProx && e("span",{className:"text-primary"},"▶ "), k.rev),
          e("span",{className:"block truncate text-[11.5px] text-muted-foreground"}, x.l.rep)),
        e("span",{className:"shrink-0 text-[12px] font-semibold tabular-nums "+(lib ? "text-success" : f ? "text-destructive" : feitas===nums.length ? "text-success" : "text-warning")}, lib ? "✓" : f ? f+" falta" : feitas+"/"+nums.length));
    })));
}

export { CelCondicionais };
