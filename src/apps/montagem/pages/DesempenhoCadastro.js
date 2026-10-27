// Sorelly Admin · montagem — pages/DesempenhoCadastro.js
// Cadastro de revendedoras → Desempenho do cadastro, refeito no padrão do Financeiro (23/10/2026): bloco Filtros no topo (período), faixa de totais, abas visíveis e tabelas de linhas de 32 px.
// Abas: Métricas, Funil, Campanhas, Origem e Registros (corpos em pages/cadastro/Des*.js). O período vale para todas as abas.
import { AbasTela } from "@/apps/montagem/components/padrao-fin";
import { PERIODO0 } from "@/apps/montagem/pages/cadastro/des-comum";
import { DesCampanhas } from "@/apps/montagem/pages/cadastro/DesCampanhas";
import { DesFunil } from "@/apps/montagem/pages/cadastro/DesFunil";
import { DesMetricas } from "@/apps/montagem/pages/cadastro/DesMetricas";
import { DesOrigem } from "@/apps/montagem/pages/cadastro/DesOrigem";
import { DesRegistros } from "@/apps/montagem/pages/cadastro/DesRegistros";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var ABAS = [["metricas","Métricas",DesMetricas], ["funil","Funil",DesFunil], ["campanhas","Campanhas",DesCampanhas], ["origem","Origem",DesOrigem], ["registros","Registros",DesRegistros]];

function AbaDesempenhoCadastro(){
  var ab = useState("metricas"), per = useState(PERIODO0), atual = ABAS.filter(function(a){ return a[0]===ab[0]; })[0] || ABAS[0];
  return e("div",{className:"flex flex-col gap-3"},
    e(PageHead,{t:"Desempenho do cadastro", sub:"Métricas, funil, campanhas, origem e registros das candidatas a revendedora."}),
    e(AbasTela,{abas:ABAS.map(function(a){ return [a[0], a[1]]; }), atual:atual[0], onMudar:ab[1]}),
    e(atual[2], {key:atual[0], f:per[0], set:per[1]}));
}
export { AbaDesempenhoCadastro };
