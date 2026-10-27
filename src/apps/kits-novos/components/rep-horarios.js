// Sorelly Admin · kits novos Curitiba — components/rep-horarios.js
// Representantes › Horários: dias e períodos em que cada representante atende. Hoje é SIMULAÇÃO (selo "Simulação"); quando elas passarem os horários reais, entram pelo botão Editar.
import { Bloco, FaixaTotais, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { calor, slotsDe, todasReps } from "@/apps/kits-novos/domain/indicacao";
import { DIAS, PERIODOS, horasCompacto } from "@/apps/kits-novos/domain/regioes-rep";
import { use } from "@/apps/kits-novos/state/context";
import { badge } from "@/apps/kits-novos/ui/badge";
import { e } from "@/shared/react";

var LETRA = {m:"M", t:"T", n:"N"};

function MapaCalor(p){
  var c = calor(p.s), pico = Math.max(1, c.max);
  return e("div",{className:"grid gap-1", style:{gridTemplateColumns:"4.5rem repeat(7, minmax(0, 1fr))"}},
    e("span"),
    DIAS.map(function(d){ return e("span",{key:d[0], className:"text-center text-[11px] font-medium uppercase tracking-[.05em]"}, d[1]); }),
    PERIODOS.map(function(per){ return [e("span",{key:"r"+per[0], className:"flex h-8 items-center text-[12px]"}, per[1])].concat(DIAS.map(function(d){
      var n = c.n[d[0]+"-"+per[0]] || 0;
      return e("div",{key:d[0]+per[0], title:n+(n===1 ? " representante atende" : " representantes atendem")+" · "+d[1]+" "+per[1].toLowerCase(),
        className:"grid h-8 place-items-center rounded-md border border-border text-[13px] tabular-nums "+(n===0 ? "text-destructive" : "font-semibold"),
        style:{background:n ? "rgba(232,184,75,"+(0.08+0.5*n/pico).toFixed(2)+")" : "transparent"}}, String(n)); })); }));
}

function RepHorarios(){
  var cx = use(), s = cx.state, d = cx.dispatch, reps = todasReps(s);
  var comHorario = reps.filter(function(x){ return x.p && slotsDe(x.p.jan).length; }), sim = comHorario.filter(function(x){ return x.p.sim; }).length;
  var semSab = comHorario.filter(function(x){ return !String(x.p.jan.sab||"").length; }).length, noite = comHorario.filter(function(x){ return slotsDe(x.p.jan).some(function(sl){ return sl.slice(-1)==="n"; }); }).length;
  var editar = function(nome){ d({type:"DIALOGO", d:{tipo:"perfilrep", nome:nome}}); };
  return e("div",{className:"flex flex-col gap-3"},
    e(FaixaTotais,{itens:[{t:"Com horário", v:comHorario.length+" de "+reps.length}, {t:"Simulação", v:String(sim), cor:sim ? "text-warning" : ""}, {t:"Informado", v:String(comHorario.length-sim), cor:"text-success"},
      {t:"Não atendem sábado", v:String(semSab)}, {t:"Atendem à noite", v:String(noite)}]}),
    e(Bloco,{t:"Representantes por dia e período"}, e(MapaCalor,{s:s})),
    e(Bloco,{t:"Dias e períodos de cada representante"},
      e(TabelaP,{minW:1620, cols:[{t:"Representante", w:170}, {t:"Origem", w:132}].concat(DIAS.map(function(x){ return {t:x[1], w:118}; })).concat([{t:"Limite/dia", w:90, n:1}, {t:"Observação", w:260}, {t:"", w:84}])},
        reps.map(function(it){ var p = it.p, tem = p && slotsDe(p.jan).length;
          return e(Tr,{key:it.nome, onClick:function(){ editar(it.nome); }},
            e(Td,{forte:true}, it.nome+(it.func ? " ◆" : "")),
            e(Td,null, tem ? (p.sim ? badge("Simulação","warning","clock") : badge("Informado","success","check")) : badge("Pendente","muted")),
            DIAS.map(function(x){ var v = tem ? String(p.jan[x[0]]||"") : ""; var exato = tem && p.hor ? (p.hor[x[0]]||"") : ""; return e(Td,{key:x[0], title:exato || (v ? v.split("").map(function(l){ return PERIODOS.find(function(q){ return q[0]===l; })[1]; }).join(", ") : "Não atende"), cor:v ? "" : "text-foreground/40"}, exato ? horasCompacto(exato) : v ? v.split("").map(function(l){ return LETRA[l]; }).join(" ") : "—"); }),
            e(Td,{n:true}, tem && p.lim ? String(p.lim) : "—"),
            e(Td,{title:p && p.obs ? p.obs : ""}, p && p.obs ? p.obs : "—"),
            e(Td,null, e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); editar(it.nome); }, className:"inline-flex h-6 items-center rounded-md border border-border px-2 text-[12px] hover:bg-white/10"}, "Editar")));
        }))));
}

export { RepHorarios };
