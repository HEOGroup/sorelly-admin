// Sorelly Admin · montagem e bipagem — pages/PlacarRepresentantes.js
// Placar simples do desempenho das representantes (regras em domain/placar-rep.js). Só para quem vê valores.
import { placarReps } from "@/apps/montagem/domain/placar-rep";
import { veTotais } from "@/apps/montagem/domain/equipe";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";
import React from "react";

var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var TITULO = "font-heading text-[28px] font-bold uppercase leading-tight tracking-[0.12em] bg-linear-to-r from-[#F8EBC8] via-[#E8B84B] to-[#B8893A] bg-clip-text text-transparent";
var COR_PLACAR = {verde:"#4ADE80", amarelo:"#FBBF24", vermelho:"#F87171", cinza:"#6B7280"};
var NOME_PLACAR = {verde:"Bem", amarelo:"Atenção", vermelho:"Problema", cinza:"Sem dados"};
var CAB = [["din","Recebeu o pagamento"],["reg","Cobrou taxa e multa"],["sai","Revendedoras ficaram"],["con","Condicionais assinadas"],["ava","Avaliação"]];

function AbaPlacarRep(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var hoje = new Date(), mm = useState(hoje.getFullYear()+"-"+String(hoje.getMonth()+1).padStart(2,"0")), mes = mm[0], setMes = mm[1];
  if(!veTotais(s.usuario)) return e("p",{className:"rounded-xl border border-dashed border-border p-10 text-center text-[14px] text-muted-foreground"}, "O placar é só da supervisão, do financeiro e da diretoria.");
  var meses = (s.acertosConsignado||[]).map(function(r){ return (r.data||"").slice(0,7); }).concat([mes]).filter(function(m, i, a){ return m && a.indexOf(m)===i; }).sort().reverse();
  var lista = placarReps(s, mes);
  var bolinha = function(c, t){ return e("span",{className:"size-3.5 shrink-0 rounded-full", style:{background:COR_PLACAR[c]}, title:t||NOME_PLACAR[c]}); };
  var nomeMes = function(m){ var p = m.split("-"); return MESES[+p[1]-1]+"/"+p[0]; };
  return e(React.Fragment,null,
    e("div",{className:"flex flex-wrap items-end justify-between gap-3"},
      e("div",{className:"flex min-w-0 flex-col gap-1"},
        e("h1",{className:TITULO}, "Placar das representantes"),
        e("p",{className:"text-[15px] text-muted-foreground"}, "Como cada representante foi no mês. Tudo em porcentagem: carteira grande e pequena são medidas do mesmo jeito.")),
      e("div",{className:"flex items-center gap-2"},
        e(Btn,{v:"secondary", ic:"arquivo", onClick:function(){ d({type:"ABA", aba:"consrep"}); }}, "Consolidado dos atendimentos"),
        e("select",{value:mes, "aria-label":"Mês", className:INPUT+" h-10! cursor-pointer text-sm!", onChange:function(ev){ setMes(ev.target.value); }}, meses.map(function(m){ return e("option",{key:m, value:m}, nomeMes(m)); })))),
    lista.length===0
      ? e("p",{className:"rounded-xl border border-dashed border-border p-10 text-center text-[14px] text-muted-foreground"}, "Nenhum atendimento em "+nomeMes(mes)+".")
      : e("section",{className:"overflow-hidden rounded-2xl bg-black ring-1 ring-[#E8B84B]/40"},
          e("div",{className:"flex items-center justify-between gap-2 px-4 py-2.5", style:{background:"linear-gradient(90deg,#3A2912,#5C4322 55%,#86653A)"}},
            e("b",{className:"font-heading text-[15px] uppercase tracking-widest text-[#F1E4C6]"}, lista.length+" representantes"), e("span",{className:"text-[12.5px] text-[#F1E4C6]"}, "quem precisa de atenção aparece primeiro")),
          e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"},
            e("thead",null, e("tr",{className:"border-b border-white/10 text-left text-[12.5px] font-semibold uppercase tracking-wide"},
              e("th",{className:"px-4 py-2.5"}, "Representante"), CAB.map(function(c){ return e("th",{key:c[0], className:"px-3 py-2.5"}, c[1]); }), e("th",{className:"px-3 py-2.5"}, "Geral"))),
            e("tbody",null, lista.map(function(x){
              return e("tr",{key:x.rep, className:"border-b border-white/5 last:border-0 hover:bg-white/5"},
                e("td",{className:"px-4 py-2.5 text-[14px] font-semibold"}, x.rep),
                CAB.map(function(c){ var it = x.itens[c[0]]; return e("td",{key:c[0], className:"px-3 py-2.5", title:it.dica}, e("span",{className:"inline-flex items-center gap-2 text-[13px]"}, bolinha(it.cor, it.txt), it.txt)); }),
                e("td",{className:"px-3 py-2.5"}, e("span",{className:"inline-flex items-center gap-2 text-[14px] font-bold", style:{color:COR_PLACAR[x.geral]}}, bolinha(x.geral), NOME_PLACAR[x.geral]))); })))),
          e("p",{className:"border-t border-white/10 px-4 py-2 text-[12px]"}, "Sem taxa ou multa para cobrar = verde. Sem avaliação ou sem condicional conferida = cinza (fica fora da conta). Passe o mouse num item para ver o que ele mede.")));
}

export { AbaPlacarRep };
