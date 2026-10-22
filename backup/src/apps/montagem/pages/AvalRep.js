// Sorelly Admin · montagem e bipagem — pages/AvalRep.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { BlocoBarra, TabelaEquipe } from "@/apps/montagem/components/equipe-blocos";
import { EditorRegrasAvaliacao } from "@/apps/montagem/pages/ConfigRepresentantes";
import { REPS_AVAL, resumoRep } from "@/apps/montagem/domain/representantes";
import { N1 } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { com } from "@/apps/montagem/state/store";
import { KPI } from "@/apps/montagem/ui/card";
import { MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { TD, TR } from "@/apps/montagem/ui/table";
import { e } from "@/shared/react";
import React from "react";

function AbaAvalRep(){
  var cx = use(), s = cx.state, d = cx.dispatch, c = s.cfg;
  var reps = REPS_AVAL.concat(s.listagens.map(function(l){return l.rep;})).filter(function(r,i,a){return a.indexOf(r)===i;});
  var rs = reps.map(function(r){ return resumoRep(r, s); }).sort(function(a,b){ return (b.pontos||0)-(a.pontos||0); });
  var com = rs.filter(function(r){return r.media!==null;}), geral = com.length ? com.reduce(function(t,r){return t+r.media;},0)/com.length : 0;
  var C = "py-2! px-2! text-center! ";
  var nota = function(v){ return v===null ? e("span",{className:"text-muted-foreground"},"—") : e("span",{className:MONO+" font-semibold "+(v>=4.5?"text-success":v>=4?"":v>=3.5?"text-warning":"text-destructive")}, N1(v)); };
  var dm = function(dia, mes){ return String(dia).padStart(2,"0")+"/"+mes; };
  return e(React.Fragment,null,
    e(PageHead,{t:"Avaliação das representantes", sub:"No fim do acerto a revendedora avalia o kit e o atendimento da representante. Com as recusas de kit novo e a parada na virada do mês, sai a pontuação."}),
    e("div",{className:"grid grid-cols-2 gap-2 md:grid-cols-4"},
      e(KPI,{compacto:true, l:"Nota média geral", v:N1(geral), sub:(s.avalRep||[]).length+" avaliações no mês"}),
      e(KPI,{compacto:true, l:"Recusas de kit novo", v:(s.recusas||[]).length, tom:(s.recusas||[]).length?"text-destructive":"", sub:"no mês"}),
      e(KPI,{compacto:true, l:"Não recebem kit novo", v:rs.filter(function(r){return r.bloqueada;}).length, sub:"bloqueadas por recusa"}),
      e(KPI,{compacto:true, l:"Parada na virada", v:rs.filter(function(r){return r.parados>c.diasParadosTolerancia;}).length, tom:"text-warning", sub:"mais de "+c.diasParadosTolerancia+" dia sem kit"})),
    e("div",{className:"flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-2.5 text-[13px]"},
      e("b",{className:"text-primary"},"Pontos ="), e("span",null,"média das 3 notas"),
      e("span",{className:"text-destructive font-semibold"},"− "+N1(c.perdaRecusa)+" por recusa"),
      e("span",{className:"text-warning font-semibold"},"− "+N1(c.perdaDiaParado)+" por dia parado (acima de "+c.diasParadosTolerancia+")"),
      e("span",{className:"rounded bg-warning/15 px-1.5 py-0.5 text-[11px] font-semibold text-warning"},"provisório")),
    e(BlocoBarra,{t:"Ranking das representantes", sub:"do melhor para o pior · clique em Bloquear para não enviar mais kits novos"},
      e(TabelaEquipe,{solta:true, min:"min-w-[68rem]", larg:[120,96,86,96,70,82,76,180,70,96],
          cols:["Representante","Pontualidade","Explicou","WhatsApp","Média","Avaliações","Recusas","Virada do mês","Pontos","Kit novo"]},
        rs.map(function(r){ return e("tr",{key:r.rep, className:TR},
          e(TD,{className:C+"font-semibold"}, r.rep),
          e(TD,{className:C}, nota(r.pont)), e(TD,{className:C}, nota(r.expl)), e(TD,{className:C}, nota(r.whats)),
          e(TD,{className:C}, nota(r.media)),
          e(TD,{className:C+MONO}, r.n),
          e(TD,{className:C+MONO+(r.rec?" font-bold text-destructive":"")}, r.rec),
          e(TD,{className:C+"whitespace-nowrap"}, r.vir ? e("span",{title:"Último acerto em agosto e volta em setembro", className:r.parados>c.diasParadosTolerancia?"font-semibold text-warning":""},
            dm(r.vir.ultimo,"08")+" → "+dm(r.vir.volta,"09")+" · "+r.parados+(r.parados===1?" dia":" dias")) : e("span",{className:"text-muted-foreground"},"—")),
          e(TD,{className:C+MONO+" text-[15px] font-bold text-primary", title: r.desc ? "Desconto de "+N1(r.desc)+" ponto(s)" : ""}, r.pontos===null ? "—" : N1(r.pontos)),
          e(TD,{className:C}, e("button",{onClick:function(){ d({type:"BLOQ_NOVAS", rep:r.rep, v:!r.bloqueada}); }, title: r.bloqueada ? "Voltar a enviar kits novos" : "Não enviar mais kits novos",
            className:"h-7 whitespace-nowrap rounded-md px-2.5 text-[12px] font-bold "+(r.bloqueada ? "bg-destructive text-white" : "border border-border hover:bg-muted")}, r.bloqueada ? "Bloqueada" : "Bloquear"))); }))),
    e("div",{className:"grid grid-cols-1 gap-4 xl:grid-cols-2"},
      e(BlocoBarra,{cor:"roxo", t:"Recusas de kit novo", sub:(s.recusas||[]).length+" no mês · com "+c.recusasBloqueio+" recusas a representante é bloqueada"},
        (s.recusas||[]).length===0 ? e("p",{className:"p-4 text-center text-sm"},"Nenhuma recusa.") :
        e(TabelaEquipe,{solta:true, min:"min-w-[30rem]", larg:[70,110,170,null], cols:["Data","Representante","Revendedora nova","Motivo"]},
          s.recusas.map(function(x,i){ return e("tr",{key:i, className:TR}, e(TD,{className:C+MONO}, x.data), e(TD,{className:C+"font-medium"}, x.rep),
            e(TD,{className:C+"truncate"}, x.rev), e(TD,{className:C+"truncate"}, x.motivo)); }))),
      e(BlocoBarra,{cor:"azul", t:"Últimas avaliações das revendedoras", sub:"pontualidade · explicou direito · responde o WhatsApp"},
        e("div",{className:"max-h-[22rem] overflow-auto"},
          e(TabelaEquipe,{solta:true, min:"min-w-[34rem]", larg:[64,100,110,60,60,60,null], cols:["Data","Representante","Revendedora","Pont.","Expl.","Whats","Comentário"]},
            (s.avalRep||[]).slice(0,40).map(function(a,i){ return e("tr",{key:i, className:TR}, e(TD,{className:C+MONO}, a.data), e(TD,{className:C+"font-medium"}, a.rep),
              e(TD,{className:C+"truncate"}, a.rev), e(TD,{className:C}, nota(a.pont)), e(TD,{className:C}, nota(a.expl)), e(TD,{className:C}, nota(a.whats)),
              e(TD,{className:C+"truncate italic", title:a.obs}, a.obs ? "“"+a.obs+"”" : "")); })))),
      e(BlocoBarra,{cor:"azul", t:"Regras da avaliação", sub:"Nota e bloqueio das representantes (antes ficavam no Configurador)"}, e("div",{className:"p-2"}, e(EditorRegrasAvaliacao,null)))));
}

export { AbaAvalRep };
