// Sorelly Admin · montagem — pages/trafego/MesAMes.js
// Tráfego pago › Mês a mês (abas "Resumo mensal" do Diego): todos os indicadores de uma plataforma, mês por mês, com o total embaixo da barra dourada.
import { Segmentado } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { PLATAFORMAS, linhasMensais, rotuloMes, totalMensal } from "@/apps/montagem/domain/trafego";
import { N, PCT, R$, col } from "@/apps/montagem/pages/trafego/comum";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

// colunas de cada plataforma (as mesmas da planilha); o Meta tem impressões, CPM e CTR a mais
function colunas(plat){
  var meta = plat==="meta";
  return [col("mes", "Mês", function(v){ return rotuloMes(v); }), col("investimento", "Investimento", R$)]
    .concat(meta ? [col("impressoes", "Impressões", N), col("cpm", "CPM", R$)] : [])
    .concat([col("cliques", meta ? "Cliques no link" : "Cliques", N), col("cpc", "CPC", R$)])
    .concat(meta ? [col("ctr", "CTR", PCT)] : [])
    .concat([col("leads", "Leads", N), col("cpl", "Custo por lead", R$)])
    .concat(meta ? [] : [col("cvr", "CVR", PCT)])
    .concat([col("aprovadas", "Aprovadas", N), col("custoAprov", "Custo por aprovada", R$), col("pctAprov", "% Aprovação", PCT),
      col("cadastradas", "Cadastradas", N), col("custoCad", "Custo por cadastrada", R$), col("pctCadAprov", "% Cadastrada sobre aprovada", PCT)]);
}

function AbaTpMensal(){
  var tp = use().state.tp, sp = useState("google"), plat = sp[0];
  var linhas = linhasMensais(tp, plat), cols = colunas(plat);
  // linha de total: mesma ordem das colunas
  var total = function(ls){
    var d = totalMensal(ls);
    return cols.map(function(c, i){ if(!i) return "Total"; var f = c.fmt, v = d[c.k]; return v==null ? "—" : f(v, d); });
  };
  var aviso = linhas.some(function(l){ return l.fonte==="total"; });
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"flex flex-wrap items-center gap-3"},
      e(Segmentado,{opcoes:PLATAFORMAS.map(function(p){ return [p.valor, p.rotulo]; }), atual:plat, onMudar:sp[1]}),
      aviso && e("span",{className:"text-[13px] text-foreground"}, "Meses só com investimento e cadastradas: o Diego tem só o total deles.")),
    e(TabelaPlanilha,{key:plat, cols:cols, linhas:linhas, chave:"mes", totalLinha:total, semContagem:true, vazio:"Nenhum mês lançado nesta plataforma."}));
}
export { AbaTpMensal };
