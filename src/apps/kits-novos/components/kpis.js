// Sorelly Admin · kits novos Curitiba — components/kpis.js
// RESUMO EM UM BLOCO (Marcus, 05/11/2026): saiu a faixa de números do topo; os mesmos números viraram um bloco de lista (BlocoResumo). Vermelho = atraso, verde = entregue.
import { BlocoResumo } from "@/apps/montagem/components/bloco-resumo";
import { aberto, atrasado, entregou, mesDe, seguro } from "@/apps/kits-novos/domain/etapas";
import { MESES, diasEntre } from "@/apps/kits-novos/lib/datas";
import { N1 } from "@/apps/kits-novos/lib/format";
import { use } from "@/apps/kits-novos/state/context";
import { e } from "@/shared/react";

// RESUMO DO MÊS (reorganizado em 24/11/2026, pedido do Marcus: "214 atrasadas está errado"): antes o número de atrasadas somava duas coisas diferentes (kits ANTES da entrega e condicionais que ainda não voltaram).
// Agora cada uma tem a sua linha: Atrasadas antes da entrega e Condicional atrasada. Todos os números do bloco "Por etapa" fecham com estes.
function KPIs(){
  var s = use().state, ds = s.dados, cfg = s.cfg, mesAtual = MESES[new Date().getMonth()];
  var abertos = ds.filter(aberto), noMes = ds.filter(function(c){return mesDe(c)===mesAtual;});
  var entMes = noMes.filter(entregou), cancMes = noMes.filter(function(c){return c.st==="cancelado";});
  var antes = abertos.filter(function(c){ return c.st!=="entregue"; }), antesAtr = antes.filter(function(c){ return atrasado(c, cfg); }).length;
  var pendCond = abertos.filter(function(c){ return c.st==="entregue"; }), condAtr = pendCond.filter(function(c){ return atrasado(c, cfg); }).length;
  var tempos = ds.filter(function(c){return entregou(c) && c.cad && c.ret;}).map(function(c){return diasEntre(c.cad, c.ret);}).filter(function(x){return x>=0;});
  var dentro = tempos.length ? tempos.filter(function(x){return x<=cfg.metaDias;}).length/tempos.length*100 : 0;
  return e(BlocoResumo,{t:"Resumo do mês", azul:true, preenche:true, minLinhas:10, compacto:true, cab:["Item", "Quantidade", ""], linhas:[
    {r:"Entradas no mês", v:String(noMes.length)},
    {r:"Entregues no mês", v:String(entMes.length)},
    {r:"Cancelados no mês", v:String(cancMes.length)},
    {r:"Em andamento", v:String(antes.length), total:true},
    {r:"Aguardando bipagem", v:String(antes.filter(function(c){ return (c.st==="liberado" || c.st==="solicitado") && !c.ap; }).length)},
    {r:"Aguardando peça", v:String(antes.filter(seguro).length)},
    {r:"Atrasadas antes da entrega", v:String(antesAtr), cor:antesAtr>0 ? "ruim" : undefined},
    {r:"Condicional atrasada", v:String(condAtr), cor:condAtr>0 ? "ruim" : undefined},
    // como no admin antigo: % das entregas do cadastro à entrega dentro da meta (verde a partir de 70%) e a mediana dos dias
    {r:"Meta de "+cfg.metaDias+" dias", v:N1(dentro)+"%", cor:dentro>=70 ? "ok" : "ruim"},
    {r:"Mediana do cadastro à entrega", v:tempos.length ? String(tempos.slice().sort(function(a, b){ return a-b; })[Math.floor((tempos.length-1)/2)])+" dias" : "—"}]});
}

// POR ETAPA, em fluxo: 1 Liberado → 2 Solicitado → 3 Bipado → 4 Entregue (a condicional ainda não voltou) → 5 Devolvido; Cancelado e Aguardando peça ficam de lado.
function PorEtapa(){
  var s = use().state, ds = s.dados, cfg = s.cfg, mesAtual = MESES[new Date().getMonth()];
  var linhaDe = function(rot, cs){ var at = cs.filter(function(c){ return atrasado(c, cfg); }).length; return {r:rot, v:String(cs.length), p:String(at), pcor:at>0 ? "ruim" : undefined, n:cs.length, at:at}; };
  var daEtapa = function(k){ return ds.filter(function(c){ return c.st===k && !seguro(c); }); };
  var prazo = function(k){ return cfg.prazos[k] ? " · prazo "+cfg.prazos[k]+(cfg.prazos[k]>1 ? " dias" : " dia") : ""; };
  var l1 = linhaDe("1 · Liberado"+prazo("liberado"), daEtapa("liberado")), l2 = linhaDe("2 · Solicitado"+prazo("solicitado"), daEtapa("solicitado")), l3 = linhaDe("3 · Bipado"+prazo("bipado"), daEtapa("bipado"));
  var sub = {r:"Antes da entrega", v:String(l1.n+l2.n+l3.n), p:String(l1.at+l2.at+l3.at), pcor:l1.at+l2.at+l3.at>0 ? "ruim" : undefined, total:true};
  var l4 = linhaDe("4 · Entregue"+prazo("entregue"), daEtapa("entregue"));
  var dev = ds.filter(function(c){ return c.st==="devolvido" && mesDe(c)===mesAtual; }), canc = ds.filter(function(c){ return c.st==="cancelado" && mesDe(c)===mesAtual; }), esp = ds.filter(seguro);
  var abertos = ds.filter(aberto), atTot = abertos.filter(function(c){ return atrasado(c, cfg); }).length;
  var linhas = [l1, l2, l3, sub, l4,
    {r:"5 · Devolvido no mês", v:String(dev.length), p:"—"}, {r:"Cancelado no mês", v:String(canc.length), p:"—"}, {r:"Aguardando peça", v:String(esp.length), p:"—"},
    {r:"Total em aberto", v:String(abertos.length), p:String(atTot), pcor:atTot>0 ? "ruim" : undefined, total:true}];
  return e(BlocoResumo,{t:"Por etapa", azul:true, preenche:true, minLinhas:10, compacto:true, cab:["Etapa", "Cartões", "Atrasados"], linhas:linhas});
}

// RESUMO DO ANO (24/11/2026, pedido do Marcus): mês a mês, quantos kits novos entraram (data do cadastro) e quantos foram entregues (data da entrega) no ano escolhido na barra da tabela (Ano).
var MES_LONGO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
function ResumoAno(p){
  var s = use().state, ano = String(p.ano), hoje = new Date(), ate = String(hoje.getFullYear())===ano ? hoje.getMonth() : 11;
  var ent = [], saiu = [], canc = 0, i;
  for(i = 0; i<12; i++){ ent.push(0); saiu.push(0); }
  s.dados.forEach(function(c){
    if(c.cad && c.cad.slice(0, 4)===ano) ent[+c.cad.split("-")[1]-1]++;
    if(entregou(c) && c.ret && c.ret.slice(0, 4)===ano) saiu[+c.ret.split("-")[1]-1]++;
    if(c.st==="cancelado" && c.cad && c.cad.slice(0, 4)===ano) canc++;
  });
  var te = 0, ts = 0, linhas = [], dia = function(m){ return m<=ate ? [MES_LONGO[m], String(ent[m]), String(saiu[m])] : [MES_LONGO[m], "—", "—"]; };
  for(i = 0; i<=ate; i++){ te += ent[i]; ts += saiu[i]; }
  for(i = 0; i<6; i++) linhas.push({r:MES_LONGO[i], c:dia(i).concat(dia(i+6))});   // duas metades lado a lado: o bloco fica baixo, do tamanho dos outros dois
  linhas.push({r:"Total", c:["Total de "+ano, String(te), String(ts), "Cancelados no ano", String(canc), "—"], total:true});
  return e(BlocoResumo,{t:"Resumo de "+ano, azul:true, preenche:true, minLinhas:10, compacto:true, grade:"grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr_1fr]", negrito:[1, 4], cab:["Mês", "Entradas", "Entregues", "Mês", "Entradas", "Entregues"], linhas:linhas});
}

export { KPIs, PorEtapa, ResumoAno };
