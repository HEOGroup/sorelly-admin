// Sorelly Admin · kits novos Curitiba — pages/Pendencias.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { FaixaTotais, TabelaP } from "@/apps/montagem/components/padrao-fin";
import { COLS, LARGURA, Linha } from "@/apps/kits-novos/components/linha";
import { aberto, atrasado, diasNaEtapa } from "@/apps/kits-novos/domain/etapas";
import { use } from "@/apps/kits-novos/state/context";
import { Vazio } from "@/apps/kits-novos/ui/card";
import { PageHead } from "@/apps/kits-novos/ui/page";
import { e } from "@/shared/react";
import React from "react";

function AbaPendencias(p){
  var cx = use(), s = cx.state, d = cx.dispatch, cfg = s.cfg;
  var cs = s.dados.filter(function(c){ return aberto(c) && (atrasado(c,cfg) || !c.rep || (c.desm||0)>0 || /FALTA LIGAR/i.test(c.obs||"")); })
    .sort(function(a,b){ return (atrasado(b,cfg)?diasNaEtapa(b):0)-(atrasado(a,cfg)?diasNaEtapa(a):0) || (b.desm||0)-(a.desm||0); });
  return e(React.Fragment,null,
    e(PageHead,{t:"Pend\u00eancias", sub:"Atrasadas, sem representante, desmarcando ou \"falta ligar\". As mais antigas primeiro."}),
    e(FaixaTotais,{itens:[
      {t:"Atrasadas", v:String(cs.filter(function(c){return atrasado(c,cfg);}).length), cor:"text-destructive"},
      {t:"Sem representante", v:String(cs.filter(function(c){return !c.rep;}).length), cor:"text-warning"},
      {t:"Desmarcando", v:String(cs.filter(function(c){return (c.desm||0)>0;}).length), cor:"text-warning"},
      {t:"Falta ligar", v:String(cs.filter(function(c){return /FALTA LIGAR/i.test(c.obs||"");}).length), cor:"text-warning"}]}),
    cs.length===0 ? e(Vazio,{txt:"Nenhuma pend\u00eancia. Funil em dia."}) :
    e(TabelaP,{cols:COLS, minW:LARGURA}, cs.map(function(c){ return e(Linha,{key:c.id, c:c}); })));
}

export { AbaPendencias };
