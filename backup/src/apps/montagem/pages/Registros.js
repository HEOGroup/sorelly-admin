// Sorelly Admin · montagem e bipagem — pages/Registros.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { BlocoBarra, TabelaEquipe } from "@/apps/montagem/components/equipe-blocos";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { resumoMontadora } from "@/apps/montagem/domain/regras";
import { BK, N1 } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { badge } from "@/apps/montagem/ui/badge";
import { KPI, Vazio } from "@/apps/montagem/ui/card";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { AlertaBadge, PageHead } from "@/apps/montagem/ui/page";
import { TD, TR } from "@/apps/montagem/ui/table";
import { e } from "@/shared/react";
import React from "react";

function AbaRegistros(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var regs = s.registros.filter(function(r){return s.filtroReg==="todas" || r.montId===+s.filtroReg;});
  var alertas = s.montadoras.map(function(m){return resumoMontadora(m,s);}).filter(function(r){return r.alerta==="amarelo"||r.alerta==="vermelho";});
  return e(React.Fragment,null,
    e(PageHead,{t:"Registros por funcion\u00e1ria", sub:"Diverg\u00eancias de valor e avalia\u00e7\u00f5es baixas das revendedoras, com a observa\u00e7\u00e3o literal."}),
    e("div",{className:"grid grid-cols-3 gap-2"},
      e(KPI,{compacto:true, l:"Em alerta", v:alertas.length, tom:alertas.length?"text-destructive":"", sub:"funcion\u00e1rias com nota abaixo de "+N1(s.cfg.alertaAmarelo)}),
      e(KPI,{compacto:true, l:"Diverg\u00eancias", v:s.registros.filter(function(r){return r.tipo==="div";}).length, sub:"registradas no m\u00eas"}),
      e(KPI,{compacto:true, l:"Notas baixas", v:s.registros.filter(function(r){return r.tipo==="aval";}).length, sub:"avalia\u00e7\u00f5es at\u00e9 3 estrelas"})),
    alertas.length>0 && e(BlocoBarra,{cor:"roxo", t:"Funcionárias em alerta", sub:"nota abaixo de "+N1(s.cfg.alertaAmarelo)+" ou divergências demais"},
      e(TabelaEquipe,{solta:true, min:"min-w-[40rem]", larg:[160,150,110,120,120], cols:["Funcionária","Alerta","Nota do mês","Avaliações","Divergências"]},
        alertas.map(function(r){ return e("tr",{key:r.m.id, className:TR},
          e(TD,{className:"py-2! text-center! font-semibold"}, r.m.nome), e(TD,{className:"py-2! text-center!"}, e(AlertaBadge,{a:r.alerta, curto:true})),
          e(TD,{className:"py-2! text-center! "+MONO+" font-semibold"}, N1(r.media)), e(TD,{className:"py-2! text-center! "+MONO}, r.m.mes.aval),
          e(TD,{className:"py-2! text-center! "+MONO+(r.div>=10?" font-bold text-destructive":"")}, r.div)); }))),
    e("div",{className:"flex flex-nowrap items-center gap-2"},
      e("div",{className:"relative"},
        e(Icon,{n:"user", s:16, className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary"}),
        e("select",{value:s.filtroReg, "aria-label":"Funcionária", onChange:function(ev){d({type:"FILTRO_REG", v:ev.target.value});},
            className:"h-10 cursor-pointer rounded-lg border border-primary/50 bg-primary/10 pl-9 pr-3 text-sm font-semibold outline-none hover:bg-primary/15 focus:ring-3 focus:ring-ring/50"},
          e("option",{value:"todas"},"Todas as funcionárias"), s.montadoras.map(function(m){return e("option",{key:m.id, value:m.id}, m.nome);}))),
      e("span",{className:"inline-flex h-10 items-center rounded-lg border border-border bg-card px-3 text-sm"}, e("b",{className:"mr-1"}, regs.length), regs.length===1?" registro":" registros")),
    regs.length===0 ? e(Vazio,{txt:"Nenhum registro para esta funcionária no mês."}) :
    e(BlocoBarra,{t:"Registros do mês", sub:"divergências de valor na bipagem e notas baixas das revendedoras"},
      e(TabelaEquipe,{solta:true, min:"min-w-[60rem]", larg:[110,130,150,190,null], cols:["Dia","Funcionária","Tipo","Revendedora","Detalhe"]},
        regs.map(function(r,i){ return e("tr",{key:i, className:TR},
          e(TD,{className:"py-2! text-center! "+MONO}, r.dia), e(TD,{className:"py-2! text-center! font-semibold"}, nomeDe(r.montId)),
          e(TD,{className:"py-2! text-center!"}, r.tipo==="div" ? badge("Valor divergente","warning") : badge("Nota "+r.nota,"destructive")),
          e(TD,{className:"py-2! text-center! truncate"}, r.rev),
          e(TD,{className:"py-2! text-center! truncate", title: r.tipo==="div" ? "" : r.obs}, r.tipo==="div" ? "Esperado "+BK(r.esperado)+", bipado "+BK(r.real)+" ("+(r.pct>0?"+":"")+N1(r.pct)+"%)" : "“"+r.obs+"”")); }))));
}

export { AbaRegistros };
