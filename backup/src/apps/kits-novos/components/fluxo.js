// Sorelly Admin · kits novos Curitiba — components/fluxo.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { COLS, Linha } from "@/apps/kits-novos/components/linha";
import { tsDe } from "@/apps/kits-novos/lib/datas";
import { Tabela } from "@/apps/kits-novos/ui/table";
import { e } from "@/shared/react";
import React from "react";

function Planilha(p){
  var cs = p.dados.slice().sort(function(a,b){ return (tsDe(b.cad)||0)-(tsDe(a.cad)||0); }).slice(0, 400);
  return e(React.Fragment,null,
    p.dados.length>400 && e("p",{className:"text-sm text-muted-foreground"},"Mostrando as 400 mais recentes de "+p.dados.length+". Use os filtros."),
    e(Tabela,{cols:COLS, min:"min-w-[110rem]", alto:true}, cs.map(function(c){ return e(Linha,{key:c.id, c:c}); })));
}

export { Planilha };
