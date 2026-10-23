// Sorelly Admin · kits novos Curitiba — pages/Pendencias.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { COLS, Linha } from "@/apps/kits-novos/components/linha";
import { aberto, atrasado, diasNaEtapa } from "@/apps/kits-novos/domain/etapas";
import { use } from "@/apps/kits-novos/state/context";
import { KPI, Vazio } from "@/apps/kits-novos/ui/card";
import { PageHead } from "@/apps/kits-novos/ui/page";
import { Tabela } from "@/apps/kits-novos/ui/table";
import { e } from "@/shared/react";
import React from "react";

function AbaPendencias(p){
  var cx = use(), s = cx.state, d = cx.dispatch, cfg = s.cfg;
  var cs = s.dados.filter(function(c){ return aberto(c) && (atrasado(c,cfg) || !c.rep || (c.desm||0)>0 || /FALTA LIGAR/i.test(c.obs||"")); })
    .sort(function(a,b){ return (atrasado(b,cfg)?diasNaEtapa(b):0)-(atrasado(a,cfg)?diasNaEtapa(a):0) || (b.desm||0)-(a.desm||0); });
  return e(React.Fragment,null,
    e(PageHead,{t:"Pend\u00eancias", sub:"Atrasadas, sem representante, desmarcando ou \"falta ligar\". As mais antigas primeiro."}),
    e("div",{className:"grid grid-cols-2 gap-3 lg:grid-cols-4"},
      e(KPI,{l:"Atrasadas", v:cs.filter(function(c){return atrasado(c,cfg);}).length, tom:"text-destructive"}),
      e(KPI,{l:"Sem representante", v:cs.filter(function(c){return !c.rep;}).length, tom:"text-warning"}),
      e(KPI,{l:"Desmarcando", v:cs.filter(function(c){return (c.desm||0)>0;}).length, tom:"text-warning", sub:"cancela na "+cfg.maxDesmarcacoes+"\u00aa"}),
      e(KPI,{l:"Falta ligar", v:cs.filter(function(c){return /FALTA LIGAR/i.test(c.obs||"");}).length, tom:"text-warning"})),
    cs.length===0 ? e(Vazio,{txt:"Nenhuma pend\u00eancia. Funil em dia."}) :
    e(Tabela,{cols:COLS, min:"min-w-[110rem]"}, cs.map(function(c){ return e(Linha,{key:c.id, c:c}); })));
}

export { AbaPendencias };
