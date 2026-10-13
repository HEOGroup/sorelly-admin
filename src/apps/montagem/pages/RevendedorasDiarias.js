// Sorelly Admin · montagem e bipagem — pages/RevendedorasDiarias.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { GraficoColunasRevendedoras } from "@/apps/montagem/components/grafico-revendedoras";
import { pontosRevendedoras } from "@/apps/montagem/domain/financeiro";
import { isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO, NumInput } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

// ── Revendedoras (lançamento diário): 1 número por dia, total geral, sempre referente ao dia anterior — vem do DevMaster/admin ──
function AbaRevendedorasDiarias(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var datas = Object.keys(s.revendedorasDiario||{}).sort();
  var ultima = datas.length ? datas[datas.length-1] : null, ultimoValor = ultima ? s.revendedorasDiario[ultima] : 0;
  var hojeIso = isoDia(new Date());
  var fqtd = useState(ultimoValor), qtdForm = fqtd[0], setQtdForm = fqtd[1];
  // uma atualização por dia (às 10h da manhã); sábado e domingo ficam no último valor
  var feitoHoje = (s.revAtualizadoEm||{})[hojeIso], feitoHora = feitoHoje ? new Date(feitoHoje).toLocaleTimeString("pt-BR",{hour:"2-digit", minute:"2-digit"}) : "";
  var salvar = function(){ if(!feitoHoje && qtdForm>0) d({type:"REV_LANCAR", data:hojeIso, quantidade:qtdForm, unico:true}); };
  var rotulo = "flex flex-col items-center gap-1 text-center text-[12.5px] font-semibold";
  var ultimos7 = datas.slice(-7).reverse();
  return e(React.Fragment,null,
    e(PageHead,{t:"Revendedoras", sub:"Atualização diária do total geral de revendedoras: uma por dia, às 10h da manhã. Sábado e domingo ficam no último valor, não precisa lançar."}),
    e("div",{className:"grid grid-cols-1 gap-4 lg:grid-cols-2"},
      e(BlocoBarra,{t:"Atualização de hoje · "+hojeIso.split("-").reverse().join("/")},
        e("div",{className:"flex flex-col items-center gap-3 p-4"},
          e("label",{className:rotulo+" w-full"},"Quantidade de revendedoras (total geral)",
            e(NumInput,{value:feitoHoje ? s.revendedorasDiario[hojeIso] : qtdForm, onChange:setQtdForm, className:"w-full! text-center!"+(feitoHoje ? " opacity-60" : "")})),
          e(Btn,{v:"primary", ic:"save", className:"w-full", disabled:!!feitoHoje || !(qtdForm>0), onClick:salvar}, feitoHoje ? "✓ Atualizado hoje às "+feitoHora : "Atualizar hoje"),
          feitoHoje && e("p",{className:"text-[12px] text-success"},"Só uma atualização por dia. A próxima é amanhã."),
          ultima && e("p",{className:"text-[12px]"},"Último lançamento: "+ultima.split("-").reverse().join("/")+" — "+ultimoValor+" revendedoras"))),
      e(BlocoBarra,{cor:"azul", t:"Últimos 7 lançamentos"},
        e("div",{className:"flex flex-col gap-1.5 p-3"},
          ultimos7.length===0 && e("p",{className:"text-center text-[12.5px]"},"Nenhum lançamento ainda."),
          ultimos7.map(function(dt,i){ var anterior = ultimos7[i+1] ? s.revendedorasDiario[ultimos7[i+1]] : null; var v = s.revendedorasDiario[dt];
            var delta = anterior!==null ? v-anterior : null;
            return e("div",{key:dt, className:"flex items-center justify-between gap-2 rounded-lg bg-black/10 px-2.5 py-1.5 text-[12.5px]"},
              e("span",null, dt.split("-").reverse().join("/")),
              e("span",{className:"flex items-center gap-2"},
                e("b",{className:MONO}, v),
                delta!==null && e("span",{className:MONO+" text-[11px] "+(delta>0?"text-success":delta<0?"text-destructive":"text-muted-foreground")}, (delta>=0?"+":"")+delta))); })))),
    e(BlocoBarra,{t:"Crescimento de revendedoras — história completa", sub:"o mesmo gráfico que aparece na tela Faturamento"},
      e("div",{className:"p-3"}, e(GraficoColunasRevendedoras,{pontos:pontosRevendedoras(s, {tudo:true})}))));
}

export { AbaRevendedorasDiarias };
