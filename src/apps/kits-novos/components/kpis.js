// Sorelly Admin · kits novos Curitiba — components/kpis.js
// RESUMO EM UM BLOCO (Marcus, 05/11/2026): saiu a faixa de números do topo; os mesmos números viraram um bloco de lista (BlocoResumo). Vermelho = atraso, verde = entregue.
import { BlocoResumo } from "@/apps/montagem/components/bloco-resumo";
import { ETAPAS, aberto, atrasado, entregou, etapaDe, mesDe, seguro } from "@/apps/kits-novos/domain/etapas";
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
    {r:"Aguardando bipagem", v:String(abertos.filter(function(c){ return (c.st==="liberado" || c.st==="solicitado") && !c.ap; }).length)},
    {r:"Aguardando peça", v:String(abertos.filter(seguro).length), cor:"alerta"},
    {r:"Atrasadas", v:String(atras), cor:atras>0 ? "ruim" : undefined},
    {r:"Entregues no mês", v:String(entMes.length), cor:entMes.length>0 ? "ok" : undefined},
    {r:"Condicional", v:String(cond), cor:condAtr ? "ruim" : undefined},
    {r:"Cancelados no mês", v:String(cancMes.length)},
    {r:"Meta de "+cfg.metaDias+" dias", v:N1(dentro)+"%", cor:"ok"}]});
}

// POR ETAPA (Marcus, 05/11/2026): segundo bloco, ao lado do Resumo do mês: quantos kits em cada etapa e quantos atrasados.
function PorEtapa(){
  var s = use().state, ds = s.dados, cfg = s.cfg, mesAtual = MESES[new Date().getMonth()];
  // etapas abertas: tudo que está nelas agora; Devolvido e Cancelado: só os do mês (igual ao Resumo do mês)
  var defs = ETAPAS.slice(0, 1).concat([{k:"aguardando", nome:"Aguardando peça"}], ETAPAS.slice(1), [{k:"cancelado", nome:"Cancelado"}]);
  var linhas = defs.map(function(x){ var fechada = x.k==="devolvido" || x.k==="cancelado", esp = x.k==="aguardando";
    var cs = ds.filter(function(c){ if(esp) return seguro(c); var k = c.st==="cancelado" ? "cancelado" : (etapaDe(c)||{}).k; return k===x.k && (fechada ? mesDe(c)===mesAtual : !seguro(c)); }), at = fechada || esp ? 0 : cs.filter(function(c){ return atrasado(c, cfg); }).length;
    return {r:fechada ? x.nome+" (no mês)" : x.nome, v:String(cs.length), p:fechada || esp ? "—" : String(at), pcor:at>0 ? "ruim" : undefined, cor:esp ? "alerta" : undefined}; });
  var abertos = ds.filter(aberto), atTot = abertos.filter(function(c){ return atrasado(c, cfg); }).length;
  linhas.push({r:"Total em aberto", v:String(abertos.length), p:String(atTot), pcor:atTot>0 ? "ruim" : undefined, total:true});
  return e(BlocoResumo,{t:"Por etapa", compacto:true, cab:["Etapa", "Cartões", "Atrasados"], linhas:linhas});
}

export { KPIs, PorEtapa };
