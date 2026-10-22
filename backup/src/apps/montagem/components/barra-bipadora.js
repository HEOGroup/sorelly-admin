// Sorelly Admin · montagem e bipagem — components/barra-bipadora.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { CondCampo, NovasCond, novasOk } from "@/apps/montagem/components/condicionais";
import { condNums, condOk } from "@/apps/montagem/domain/condicionais";
import { BIPADORAS } from "@/apps/montagem/domain/equipe";
import { filaBipagem, listagemDe, resumoBipadora } from "@/apps/montagem/domain/regras";
import { TIPO_KIT } from "@/apps/montagem/domain/status";
import { dur, durCurta } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO, MoneyInput } from "@/apps/montagem/ui/input";
import { RelogioB } from "@/apps/montagem/ui/relogio";
import { e, useEffect, useState } from "@/shared/react";
import React from "react";

function tempoMedioB(ks){ var t = ks.filter(function(k){return k.fimB && k.iniB;}); return t.length ? t.reduce(function(a,k){return a+(k.fimB-k.iniB);},0)/t.length : 0; }
function BarraBipadora(){
  var cx = use(), s = cx.state, d = cx.dispatch, id = s.usuario;
  var b = BIPADORAS.find(function(x){return x.id===id;}); if(!b) return null;
  var r = resumoBipadora(b, s), minha = r.atual, prox = filaBipagem(s)[0];
  // A bipadora não vê o valor esperado: digita o total que a bipagem deu (campo começa vazio)
  var vr = useState(0), valor = vr[0], setValor = vr[1];
  // número da nova condicional (o kit sai em consignação com uma condicional nova)
  var nc = useState([""]), novas = nc[0], setNovas = nc[1];
  useEffect(function(){ setValor(0); setNovas([""]); }, [minha && minha.id]);
  var dif = minha && valor>0 ? (valor - minha.valor)/minha.valor*100 : null, fora = dif!==null && Math.abs(dif) > s.cfg.divPct;
  var novaOk = novasOk(novas), condsOk = !minha || condOk(minha, "b");
  var ult = r.hojeK.slice().sort(function(a,c){return c.fimB-a.fimB;})[0];
  var l = minha ? listagemDe(s, minha) : prox ? listagemDe(s, prox) : null, alvo = minha || prox;
  var num = function(v, lb, cls){ return e("div",{className:"flex flex-col items-center px-3"}, e("b",{className:MONO+" text-lg leading-none "+(cls||"")}, v), e("span",{className:"mt-1 text-[11px] text-foreground/70"}, lb)); };
  return e("div",{className:"flex flex-nowrap items-center gap-3 whitespace-nowrap rounded-xl border-2 px-3 py-2.5 "+(minha ? "border-info/50 bg-info/10" : "border-success/40 bg-success/5")},
    e("div",{className:"flex shrink-0 items-center gap-2"},
      e("span",{className:"grid size-9 place-items-center rounded-full bg-info/20 text-info"}, e(Icon,{n:"scan", s:17})),
      e("div",null, e("p",{className:"font-heading text-[15px] font-semibold leading-tight"}, b.nome),
        e("p",{className:"text-[11.5px]"}, e("b",{className:MONO+" text-success"}, r.hoje), " hoje · ", e("b",{className:MONO}, durCurta(r.tempo)), " médio"+(r.divs ? " · " : ""), r.divs ? e("b",{className:"text-warning"}, r.divs+" diverg.") : null))),
    e("div",{className:"min-w-0 flex-1 truncate text-center"},
      alvo ? e(React.Fragment,null,
          e("p",{className:"truncate text-[14px] font-semibold"}, e("span",{className:"mr-1.5 text-[11px] font-bold uppercase tracking-wide "+(minha?"text-info":"text-success")}, minha ? "Bipando" : "Próximo"),
            alvo.prio && e("span",{className:"text-primary"},"★ "), alvo.rev,
            e("span",{className:"font-normal"}, " · "+l.rep+(alvo.tipoKit ? " · "+(TIPO_KIT[alvo.tipoKit]||TIPO_KIT.acerto_kit)[1] : "")),
            minha && minha.pref.enc>0 && e("span",{className:"ml-1.5 text-[12px] font-semibold text-warning", title:"Encomendas não entram no valor"}, "· "+minha.pref.enc+" encomenda"+(minha.pref.enc>1?"s":""))))
        : e("p",{className:"text-sm text-foreground/70"}, ult ? "Nenhum kit aguardando. Último: "+ult.rev+" em "+dur(ult.fimB-ult.iniB) : "Nenhum kit aguardando bipagem.")),
    minha
      ? e("div",{className:"flex shrink-0 flex-nowrap items-center gap-2"},
          e(RelogioB,{desde:minha.iniB, curto:true, className:"w-16 text-center text-xl font-bold text-info"}),
          e(MoneyInput,{value:valor, onChange:setValor, label:"Valor bipado", className:"h-10! w-32 text-center"}),
          condNums(minha).length>0 && e("div",{title: condsOk ? "Condicionais conferidas" : "Confira as condicionais", className:"flex h-10 items-center gap-1.5 rounded-lg border px-2 "+(condsOk ? "border-success/50" : "border-warning/60 bg-warning/10")},
            e("span",{className:"text-[11px] font-bold uppercase "+(condsOk?"text-success":"text-warning")}, "Cond."),
            e(CondCampo,{k:minha, papel:"b"})),
          e(NovasCond,{v:novas, onChange:setNovas}),
          e("button",{disabled:!(valor>0) || !novaOk || !condsOk, title: !condsOk ? "Dê o check em todas as condicionais (se faltar, peça para a Deysiane imprimir)" : novaOk ? "" : "Digite o número da nova condicional", onClick:function(){d({type:"CONCLUIR_B", id:minha.id, real:valor, novas:novas});},
            className:"inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-destructive px-4 text-sm font-semibold text-white hover:bg-destructive/85 disabled:opacity-50"}, e(Icon,{n:"check", s:16}), "Finalizar"))
      : e("div",{className:"flex items-center gap-3"},
          ult && e("span",{className:"text-[12px] text-foreground/70", title:"Tempo do último kit bipado"}, "último: ", e("b",{className:MONO}, dur(ult.fimB-ult.iniB))),
          e("button",{disabled:!prox, onClick:function(){ if(prox) d({type:"INICIAR_B", id:prox.id, bipId:id}); },
            className:"inline-flex h-10 items-center gap-2 rounded-lg bg-success px-5 text-sm font-semibold text-[#06210F] hover:bg-success/85 disabled:bg-muted disabled:text-muted-foreground"},
            e(Icon,{n:"play", s:16}), "Iniciar bipagem")));
}

export { tempoMedioB, BarraBipadora };
