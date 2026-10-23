// Sorelly Admin · kits novos Curitiba — components/kpis.js
// Faixa compacta de indicadores, cada um com degradê suave pelo sentido (âmbar, vermelho, verde, cinza, azul, roxo).
import { aberto, atrasado, mesDe } from "@/apps/kits-novos/domain/etapas";
import { MESES, diasEntre } from "@/apps/kits-novos/lib/datas";
import { N1 } from "@/apps/kits-novos/lib/format";
import { use } from "@/apps/kits-novos/state/context";
import { e } from "@/shared/react";

function Ind(p){
  return e("div",{className:"flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-linear-to-br px-2 py-2 text-center text-white ring-1 ring-white/10 "+p.g},
    e("span",{className:"text-[11px] font-semibold uppercase leading-tight tracking-wide text-white/85"}, p.l),
    e("span",{className:"font-mono text-[20px] font-bold leading-none tabular-nums"}, p.v),
    e("span",{className:"min-h-3.5 text-[11px] leading-tight text-white/70"}, p.sub||""));
}

function KPIs(){
  var s = use().state, ds = s.dados, cfg = s.cfg, mesAtual = MESES[new Date().getMonth()];
  var abertos = ds.filter(aberto), noMes = ds.filter(function(c){return mesDe(c)===mesAtual;});
  var entMes = noMes.filter(function(c){return c.st==="entregue";}), cancMes = noMes.filter(function(c){return c.st==="cancelado";});
  var atras = abertos.filter(function(c){return atrasado(c,cfg);}).length;
  var tempos = ds.filter(function(c){return c.st==="entregue" && c.cad && c.ret;}).map(function(c){return diasEntre(c.cad, c.ret);}).filter(function(x){return x>=0;});
  var med = tempos.length ? tempos.slice().sort(function(a,b){return a-b;})[Math.floor(tempos.length/2)] : 0;
  var dentro = tempos.length ? tempos.filter(function(x){return x<=cfg.metaDias;}).length/tempos.length*100 : 0;
  return e("div",{className:"mx-auto grid w-full max-w-6xl grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6"},
    e(Ind,{l:"Entradas em "+mesAtual.toLowerCase(), v:noMes.length, sub:ds.length+" no ano", g:"from-sky-500/60 to-yellow-700/50"}),
    e(Ind,{l:"Em aberto", v:abertos.length, sub:"sem kit entregue", g:"from-amber-500/65 to-amber-800/55"}),
    e(Ind,{l:"Atrasadas", v:atras, sub:"passaram do prazo", g:"from-red-500/65 to-red-800/55"}),
    e(Ind,{l:"Entregues no m\u00eas", v:entMes.length, sub:N1(noMes.length?entMes.length/noMes.length*100:0)+"% das entradas", g:"from-emerald-500/60 to-emerald-800/55"}),
    e(Ind,{l:"Canceladas no m\u00eas", v:cancMes.length, sub:" ", g:"from-zinc-500/55 to-zinc-800/55"}),
    e(Ind,{l:"Meta "+cfg.metaDias+" dias", v:N1(dentro)+"%", sub:"no prazo, mediana "+med+" d", g:"from-violet-500/60 to-teal-700/55"}));
}

export { KPIs };
