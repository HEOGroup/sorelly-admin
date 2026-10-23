// Sorelly Admin — pages/ControleKits.js
// Representantes → Controle de kits: quantos kits SAEM por dia, quantos CHEGAM (OK do agendamento no Consolidado) e quantos retornos já foram BIPADOS,
// mais a fila de quem ainda falta bipar. Bipar retorno é trabalho de setor difícil e entra no comissionamento (por isso mostra quem bipou).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { FilaRetornos } from "@/apps/montagem/components/fila-retornos";
import { filaRetornos, porDia, qtdFila } from "@/apps/montagem/domain/retornos";
import { isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e } from "@/shared/react";
import React from "react";

function AbaControleKits(){
  var s = use().state, dias = porDia(s), fila = filaRetornos(s), hoje = isoDia(new Date());
  var h = dias.find(function(x){ return x.dia===hoje; }) || {enviados:0, chegaram:0, bipados:0};
  var tot = dias.reduce(function(t,x){ return {enviados:t.enviados+x.enviados, chegaram:t.chegaram+x.chegaram, bipados:t.bipados+x.bipados}; }, {enviados:0, chegaram:0, bipados:0});
  var bloco = function(t, v, cor){ return e("div",{className:"flex flex-col items-center rounded-xl border border-border bg-black/25 px-3 py-2"}, e("span",{className:"text-[10.5px] font-semibold uppercase tracking-wide text-white/70"}, t), e("b",{className:MONO+" text-[26px] leading-tight "+(cor||"")}, v)); };
  var dp = function(k){ return k.split("-").reverse().slice(0,2).join("/"); };
  var th = function(x){ return e("th",{key:x, className:"border-b border-border px-2 py-1.5 text-center text-[10.5px] font-semibold uppercase tracking-wide text-white/70"}, x); };
  var linhas = dias.length===0
    ? [e("tr",{key:"v"}, e("td",{colSpan:5, className:"p-4 text-center text-[12.5px] text-white/70"},"Ainda não há movimento."))]
    : dias.map(function(x){
        return e("tr",{key:x.dia, className:"border-b border-border/40 "+(x.dia===hoje ? "bg-primary/10 font-bold" : "")},
          e("td",{className:MONO+" px-2 py-1 text-center text-[12.5px]"}, dp(x.dia)+(x.dia===hoje ? " · hoje" : "")),
          e("td",{className:MONO+" px-2 py-1 text-center text-[12.5px]"}, x.enviados),
          e("td",{className:MONO+" px-2 py-1 text-center text-[12.5px] text-primary"}, x.chegaram),
          e("td",{className:MONO+" px-2 py-1 text-center text-[12.5px] text-success"}, x.bipados),
          e("td",{className:"px-2 py-1 text-center text-[12px]"}, Object.keys(x.por).map(function(n){ return n+" ("+x.por[n]+")"; }).join(" · ") || "—")); });
  var linhaTotal = dias.length>0 ? e("tr",{key:"t", className:"bg-black/25 font-bold"},
    e("td",{className:"px-2 py-1 text-center text-[12.5px]"},"Total"), e("td",{className:MONO+" px-2 py-1 text-center"}, tot.enviados),
    e("td",{className:MONO+" px-2 py-1 text-center"}, tot.chegaram), e("td",{className:MONO+" px-2 py-1 text-center"}, tot.bipados), e("td")) : null;
  var tabela = e("table",{className:"w-full min-w-[34rem] border-collapse"},
    e("thead",null, e("tr",null, ["Dia","Enviados","Chegaram","Bipados","Quem bipou"].map(th))), e("tbody",null, linhas, linhaTotal));
  var listaFila = fila.map(function(r){
    return e("div",{key:r.id, className:"flex items-center justify-between gap-2 rounded-lg bg-black/25 px-3 py-1.5 text-[12.5px]"},
      e("b",{className:"min-w-0 truncate"}, r.rev), e("span",{className:"shrink-0 text-white/70"}, (r.rep||"—")+" · "+(r.recebimento.em ? new Date(r.recebimento.em).toTimeString().slice(0,5) : ""))); });
  return e(React.Fragment,null,
    e(PageHead,{t:"Controle de kits", sub:"Kits enviados por dia, kits que chegaram (OK do agendamento) e retornos já bipados. O que chegou e ainda não foi bipado fica na fila."}),
    e("div",{className:"grid grid-cols-2 gap-3 md:grid-cols-4"},
      bloco("Enviados hoje", h.enviados), bloco("Chegaram hoje", h.chegaram, "text-primary"), bloco("Bipados hoje", h.bipados, "text-success"), bloco("Faltam bipar", qtdFila(s), qtdFila(s) ? "text-warning" : "")),
    e(FilaRetornos),
    e(BlocoBarra,{cor:"azul", t:"Dia a dia", sub:"enviados · chegaram · bipados e quem bipou"}, e("div",{className:"overflow-x-auto p-2"}, tabela)),
    fila.length>0 ? e(BlocoBarra,{cor:"ouro", t:"Na fila para bipar ("+fila.length+")", sub:"chegaram e o agendamento já deu o OK"}, e("div",{className:"grid grid-cols-1 gap-1 p-2 md:grid-cols-2 xl:grid-cols-3"}, listaFila)) : null);
}

export { AbaControleKits };
