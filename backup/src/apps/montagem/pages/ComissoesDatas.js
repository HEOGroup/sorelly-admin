// Sorelly Admin · montagem — pages/ComissoesDatas.js
// Financeiro → Comissões → Datas de pagamento: o dia do mês em que as comissões são pagas. Um dia geral (padrão 15) e, se precisar, um dia diferente para cada setor.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e } from "@/shared/react";

var SETORES = [["agendamento","Agendamento"], ["cadastro","Cadastro de revendedoras"], ["inadimplencia","Inadimplência"], ["bipagem","Bipagem"], ["montagem","Montagem de kits"], ["interno","Atendimento interno"], ["link","Link de pagamento"]];
var DIAS = []; for(var i=1; i<=28; i++) DIAS.push(i);

function AbaComDatas(){
  var cx = use(), s = cx.state, d = cx.dispatch, dp = s.datasPag || {geral:15, setores:{}}, set = function(setor, dia){ d({type:"DATAS_PAG", setor:setor, dia:dia}); };
  var sel = function(valor, onChange, vazio){ return e("select",{value:valor||"", className:INPUT+" h-10! w-44 cursor-pointer", onChange:function(ev){ onChange(ev.target.value ? Number(ev.target.value) : null); }}, vazio && e("option",{value:""}, vazio), DIAS.map(function(x){ return e("option",{key:x, value:x}, "Dia "+x); })); };
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Datas de pagamento das comissões", sub:"O dia do mês em que cada comissão é paga. Vale o dia geral; se um setor precisar de outro dia, escolha ao lado dele."}),
    e(BlocoBarra,{cor:"ouro", t:"Dia geral", sub:"vale para todos os setores que não tiverem um dia próprio"}, e("div",{className:"flex flex-wrap items-center gap-3 p-4"}, sel(dp.geral, function(v){ if(v) set(null, v); }), e("span",{className:"text-[13px] text-muted-foreground"}, "pago no dia "+dp.geral+" de cada mês"))),
    e(BlocoBarra,{cor:"ouro", t:"Por setor", sub:"hoje o dia já vale para o bônus do Agendamento; os outros setores passam a usar quando entrarem no módulo de Comissões"}, e("div",{className:"flex flex-col divide-y divide-white/10 px-4 py-1"}, SETORES.map(function(x){ var proprio = (dp.setores||{})[x[0]];
      return e("div",{key:x[0], className:"flex flex-wrap items-center gap-3 py-2.5"}, e("b",{className:"min-w-[14rem] flex-1 text-[14px]"}, x[1]), sel(proprio, function(v){ set(x[0], v); }, "Usa o dia geral ("+dp.geral+")"),
        e("span",{className:"w-40 text-[12.5px] text-muted-foreground"}, "paga no dia "+(proprio||dp.geral))); }))));
}
export { AbaComDatas };
