// Sorelly Admin · kits novos Curitiba — components/kpis.js
// RESUMO EM UM BLOCO (Marcus, 05/11/2026): saiu a faixa de números do topo; os mesmos números viraram um bloco de lista (BlocoResumo). Vermelho = atraso, verde = entregue.
import { BlocoResumo } from "@/apps/montagem/components/bloco-resumo";
import { aberto, atrasado, entregou, mesDe } from "@/apps/kits-novos/domain/etapas";
import { MESES, diasEntre } from "@/apps/kits-novos/lib/datas";
import { N1 } from "@/apps/kits-novos/lib/format";
import { use } from "@/apps/kits-novos/state/context";
import { e } from "@/shared/react";

function KPIs(){
  var s = use().state, ds = s.dados, cfg = s.cfg, mesAtual = MESES[new Date().getMonth()];
  var abertos = ds.filter(aberto), noMes = ds.filter(function(c){return mesDe(c)===mesAtual;});
  var entMes = noMes.filter(entregou), cancMes = noMes.filter(function(c){return c.st==="cancelado";});
  var pendCond = abertos.filter(function(c){ return c.st==="entregue"; }), cond = pendCond.length, condAtr = pendCond.filter(function(c){ return atrasado(c,cfg); }).length;
  var atras = abertos.filter(function(c){return atrasado(c,cfg);}).length;
  var tempos = ds.filter(function(c){return entregou(c) && c.cad && c.ret;}).map(function(c){return diasEntre(c.cad, c.ret);}).filter(function(x){return x>=0;});
  var dentro = tempos.length ? tempos.filter(function(x){return x<=cfg.metaDias;}).length/tempos.length*100 : 0;
  return e(BlocoResumo,{t:"Resumo do mês", compacto:true, cab:["Item", "Quantidade", ""], linhas:[
    {r:"Entradas no mês", v:String(noMes.length)},
    {r:"Em aberto", v:String(abertos.filter(function(c){ return c.st!=="entregue"; }).length)},
    {r:"Atrasadas", v:String(atras), cor:atras>0 ? "ruim" : undefined},
    {r:"Entregues no mês", v:String(entMes.length), cor:entMes.length>0 ? "ok" : undefined},
    {r:"Condicional", v:String(cond), cor:condAtr ? "ruim" : undefined},
    {r:"Cancelados no mês", v:String(cancMes.length)},
    {r:"Meta de "+cfg.metaDias+" dias", v:N1(dentro)+"%", cor:"ok"}]});
}

export { KPIs };
