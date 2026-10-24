// Sorelly Admin · kits novos Curitiba — components/fluxo.js
import { TabelaP } from "@/apps/montagem/components/padrao-fin";
import { COLS, LARGURA, Linha } from "@/apps/kits-novos/components/linha";
import { tsDe } from "@/apps/kits-novos/lib/datas";
import { e } from "@/shared/react";
import React from "react";

function Planilha(p){
  var cs = p.dados.slice().sort(function(a,b){ return (tsDe(b.cad)||0)-(tsDe(a.cad)||0); }).slice(0, 400);
  return e(React.Fragment,null,
    p.dados.length>400 && e("p",{className:"text-[13px]"},"Mostrando as 400 mais recentes de "+p.dados.length+". Use os filtros."),
    e(TabelaP,{cols:COLS, minW:LARGURA}, cs.map(function(c){ return e(Linha,{key:c.id, c:c}); })));
}

export { Planilha };
