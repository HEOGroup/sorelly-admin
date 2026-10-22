// Sorelly Admin · montagem — pages/VisaoBipagem.js
// Tela inicial das meninas da bipagem: o dia em tempo real, os kits para bipar NA ORDEM (para não bipar aleatoriamente, já que a montagem sai em ordem),
// os retornos das representantes na sequência de chegada e a listagem do dia. Nenhum valor em dinheiro aparece aqui.
import { PainelDia } from "@/apps/montagem/components/painel-dia";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { MONTADORAS } from "@/apps/montagem/domain/equipe";
import { filaRetornos } from "@/apps/montagem/domain/retornos";
import { TIPO_KIT } from "@/apps/montagem/domain/status";
import { minutos } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { PageHead } from "@/apps/montagem/ui/page";
import { e } from "@/shared/react";
import React from "react";

var th = function(t){ return e("th",{key:t, className:"whitespace-nowrap border-b border-border px-3 py-2 text-left text-[11.5px] font-semibold uppercase tracking-wide"}, t); };
var td = function(v, c){ return e("td",{className:"px-3 py-2 text-[13.5px] "+(c||"")}, v); };
var tempoAtras = function(iso){ var t = Date.parse(iso); if(!t) return "—"; var m = Math.max(0, Math.round((Date.now()-t)/60000)); return m<60 ? m+" min" : m<1440 ? Math.floor(m/60)+" h "+(m%60)+" min" : Math.floor(m/1440)+" d"; };

function AbaVisaoBipagem(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var ls = (s.listagens||[]).filter(function(l){ return !l.fechada; });
  var lis = function(id){ return ls.find(function(l){ return l.id===id; }); };
  // sequência para bipar: o que já saiu da montagem (montado/bipando), na ordem da listagem (horário), prioritários primeiro e a ordem dentro da listagem
  var seq = (s.kits||[]).filter(function(k){ return (k.status==="montado" || k.status==="bipando") && lis(k.lid); }).map(function(k){ var l = lis(k.lid);
    return {k:k, l:l, c:[k.status==="bipando" ? 0 : 1, minutos(l.horario), k.prio ? 0 : 1, k.ordem||0]}; })
    .sort(function(a, b){ for(var i=0;i<4;i++){ if(a.c[i]<b.c[i]) return -1; if(a.c[i]>b.c[i]) return 1; } return 0; });
  var montNome = function(id){ var m = MONTADORAS.find(function(x){ return x.id===id; }); return m ? m.nome : "—"; };
  var ret = filaRetornos(s).slice().sort(function(a, b){ return String(a.recebimento.em||"").localeCompare(String(b.recebimento.em||"")); });
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Visão geral da bipagem", sub:"O dia em tempo real e a ordem certa para bipar: primeiro os kits que saíram da montagem, depois os retornos das representantes, sempre do mais antigo para o mais novo."}),
    e(PainelDia,{s:s}),
    e(BlocoBarra,{cor:"ouro", t:"Kits para bipar agora · na ordem", sub:seq.length+(seq.length===1 ? " kit" : " kits")+" · bipe de cima para baixo, sem pular"},
      seq.length===0 ? e("p",{className:"px-4 py-5 text-center text-[13.5px] text-muted-foreground"}, "Nenhum kit montado esperando bipagem agora. Quando a montagem terminar um kit, ele entra aqui na ordem.")
      : e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full min-w-[40rem] border-collapse"},
          e("thead",null, e("tr",{className:"bg-sidebar"}, ["Ordem","Listagem","Representante","Revendedora","Tipo","Montou","Situação",""].map(th))),
          e("tbody",null, seq.map(function(x, i){ var k = x.k, tp = (TIPO_KIT[k.tipoKit]||TIPO_KIT.acerto_kit);
            return e("tr",{key:k.id, className:"border-b border-border/60 "+(k.status==="bipando" ? "bg-primary/10" : i===0 ? "bg-[#E8B84B]/10" : "")},
              td(e("span",{className:"grid size-7 place-items-center rounded-full text-[13px] font-extrabold "+(i===0 ? "bg-[#E8B84B] text-[#1B1409]" : "bg-muted text-foreground")}, i+1)),
              td(x.l.horario||"—", "font-mono"), td(x.l.rep, "font-semibold"), td(k.rev, "font-semibold"), td(tp[1]), td(montNome(k.montId)),
              td(k.status==="bipando" ? e("b",{className:"text-primary"}, "Bipando agora") : "Aguardando bipagem"),
              td(i===0 && k.status!=="bipando" ? e(Btn,{v:"primary", sm:true, ic:"scan", onClick:function(){ d({type:"ABA", aba:"painel"}); }}, "Bipar este primeiro") : e(Btn,{v:"ghost", sm:true, onClick:function(){ d({type:"ABA", aba:"painel"}); }}, "Abrir")));
          }))))),
    e(BlocoBarra,{cor:"ouro", t:"Retornos das representantes · ordem de chegada", sub:ret.length+(ret.length===1 ? " kit" : " kits")+" esperando bipagem · o que chegou primeiro, bipa primeiro"},
      ret.length===0 ? e("p",{className:"px-4 py-5 text-center text-[13.5px] text-muted-foreground"}, "Nenhum retorno esperando bipagem. Quando o agendamento der o OK de recebimento, o kit entra aqui.")
      : e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full min-w-[34rem] border-collapse"},
          e("thead",null, e("tr",{className:"bg-sidebar"}, ["Ordem","Representante","Revendedora","Chegou há",""].map(th))),
          e("tbody",null, ret.slice(0, 40).map(function(r, i){
            return e("tr",{key:r.id, className:"border-b border-border/60 "+(i===0 ? "bg-[#E8B84B]/10" : "")},
              td(e("span",{className:"grid size-7 place-items-center rounded-full text-[13px] font-extrabold "+(i===0 ? "bg-[#E8B84B] text-[#1B1409]" : "bg-muted text-foreground")}, i+1)),
              td(r.rep, "font-semibold"), td(r.rev, "font-semibold"), td(tempoAtras(r.recebimento.em)),
              td(i===0 ? e(Btn,{v:"primary", sm:true, ic:"scan", onClick:function(){ d({type:"ABA", aba:"consrep"}); }}, "Bipar este primeiro") : e(Btn,{v:"ghost", sm:true, onClick:function(){ d({type:"ABA", aba:"consrep"}); }}, "Abrir")));
          }))))),
    e(BlocoBarra,{cor:"ouro", t:"Listagem do dia", sub:ls.length+(ls.length===1 ? " listagem aberta" : " listagens abertas")},
      e("div",{className:"grid grid-cols-1 gap-2 p-3 md:grid-cols-2 xl:grid-cols-4"}, ls.map(function(l){
        var ks = (s.kits||[]).filter(function(k){ return k.lid===l.id; }), prontos = ks.filter(function(k){ return k.status==="bipado" || k.status==="retirado"; }).length, mont = ks.filter(function(k){ return k.status==="montado" || k.status==="bipando"; }).length;
        var pct = ks.length ? Math.round(prontos/ks.length*100) : 0;
        return e("button",{key:l.id, type:"button", onClick:function(){ d({type:"ABA", aba:"painel"}); }, className:"flex flex-col gap-1.5 rounded-xl bg-black/25 p-3 text-left ring-1 ring-white/10 hover:bg-black/35"},
          e("span",{className:"flex items-baseline justify-between"}, e("b",{className:"text-[15px]"}, l.rep), e("span",{className:"font-mono text-[12.5px] text-muted-foreground"}, l.horario||"")),
          e("span",{className:"text-[12.5px] text-muted-foreground"}, ks.length+" kits · "+mont+" para bipar · "+prontos+" bipados/retirados"),
          e("span",{className:"h-2 overflow-hidden rounded-full bg-muted/50"}, e("span",{className:"block h-full rounded-full bg-linear-to-r from-[#B8862B] to-[#E8B84B]", style:{width:pct+"%"}})));
      }))));
}
export { AbaVisaoBipagem };
