// Sorelly Admin · montagem — pages/DesempenhoCadastro.js
// Cadastro de revendedoras → Desempenho do cadastro: uma tela só, com abas (Métricas, Funil, Campanhas, Origem, Registros). Os corpos das abas ficam em pages/cadastro/.
import { AbaCadFunil, AbaCadCampanhas } from "@/apps/montagem/pages/cadastro/DesempenhoCampanhas";
import { AbaCadMetricas, AbaCadOrigem, AbaCadRegistros } from "@/apps/montagem/pages/cadastro/MetricasOrigemRegistros";
import { Abas } from "@/apps/montagem/components/padrao";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var ABAS_DESEMPENHO = [["metricas","Métricas",AbaCadMetricas], ["funil","Funil de desempenho",AbaCadFunil], ["campanhas","Campanhas",AbaCadCampanhas], ["origem","Origem",AbaCadOrigem], ["registros","Registros",AbaCadRegistros]];
var COR = "#F97316";   // cor do setor Cadastro de revendedoras

function AbaDesempenhoCadastro(){
  var st = useState("metricas"), aba = st[0], atual = ABAS_DESEMPENHO.filter(function(a){ return a[0]===aba; })[0] || ABAS_DESEMPENHO[0];
  return e("div",{className:"flex flex-col gap-2.5"},
    e(PageHead,{t:"Desempenho do cadastro", sub:"Métricas, funil, campanhas, origem e registros das candidatas a revendedora."}),
    e(Abas,{abas:ABAS_DESEMPENHO.map(function(a){ return [a[0], a[1]]; }), atual:atual[0], onMudar:st[1], cor:COR}),
    e(atual[2], {key:atual[0]}));
}
export { AbaDesempenhoCadastro };
