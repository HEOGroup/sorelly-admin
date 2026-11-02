// Sorelly Admin · montagem — components/tabela-ouro.js
// Casca de tabela com o TOPO DOURADO em degradê (regra de tabelas do Marcus, 02/11/2026): o degradê é UM só, esticado na barra inteira.
// A tela entrega só o miolo: `colunas` (largura de cada coluna, em px), `topo` (os <th>) e as linhas (<tbody>) como filho. Tudo centralizado, nada abreviado.
import { e } from "@/shared/react";

var BARRA_OURO = {background:"linear-gradient(90deg,#9A6F1E,#E8B84B 48%,#F5E7BE)", color:"#1a1306"};

function TabelaOuro(p){
  return e("table",{className:"border-collapse text-[13px]", style:{tableLayout:"fixed", width:p.largura, minWidth:"100%"}},
    e("colgroup",null, (p.colunas||[]).map(function(w, i){ return e("col",{key:i, style:{width:w}}); })),
    e("thead",null, e("tr",{style:BARRA_OURO}, p.topo)),
    p.children);
}

export { TabelaOuro, BARRA_OURO };
