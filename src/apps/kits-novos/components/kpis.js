// Sorelly Admin · kits novos Curitiba — components/kpis.js
// Faixa de totais no padrão do Financeiro (rótulo + valor, células iguais, sem degradê nem subtexto). Cor só no valor: vermelho = atraso, verde = entregue.
import { FaixaTotais } from "@/apps/montagem/components/padrao-fin";
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
  return e("div",{className:"mx-auto w-full max-w-6xl"}, e(FaixaTotais,{itens:[
    {t:"Entradas mês", v:String(noMes.length)},
    {t:"Em aberto", v:String(abertos.filter(function(c){ return c.st!=="entregue"; }).length)},
    {t:"Atrasadas", v:String(atras), cor:atras>0 ? "text-destructive" : ""},
    {t:"Entregues mês", v:String(entMes.length), cor:entMes.length>0 ? "text-success" : ""},
    {t:"Condicional", v:String(cond), cor:condAtr ? "text-destructive" : ""},
    {t:"Cancel. mês", v:String(cancMes.length)},
    {t:"Meta "+cfg.metaDias+" dias", v:N1(dentro)+"%", cor:"text-success"}]}));
}

export { KPIs };
