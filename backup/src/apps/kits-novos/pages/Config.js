// Sorelly Admin · kits novos Curitiba — pages/Config.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { listaDe } from "@/apps/kits-novos/domain/config";
import { ETAPAS } from "@/apps/kits-novos/domain/etapas";
import { use } from "@/apps/kits-novos/state/context";
import { Btn } from "@/apps/kits-novos/ui/button";
import { Card } from "@/apps/kits-novos/ui/card";
import { Icon } from "@/apps/kits-novos/ui/icon";
import { INPUT, MONO, MoneyInput, NumInput } from "@/apps/kits-novos/ui/input";
import { Modal } from "@/apps/kits-novos/ui/modal";
import { PageHead } from "@/apps/kits-novos/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

function AbaConfig(){
  var cx = use(), s = cx.state, d = cx.dispatch, cfg = s.cfg;
  var cf = useState(false), conf = cf[0], setConf = cf[1], nm = useState(""), nov = nm[0], setNov = nm[1];
  var Bloco = function(p){ return e(Card,{className:"flex flex-col gap-3 p-5"}, e("h2",{className:"font-heading text-base font-semibold"}, p.t), p.children); };
  var linha = function(l, ctrl){ return e("label",{className:"flex items-center justify-between gap-3"}, e("span",{className:"text-sm font-medium"}, l), ctrl); };
  var campanhas = listaDe(s.dados.filter(function(c){return c.entId;}), "entId");
  return e(React.Fragment,null,
    e(PageHead,{t:"Configurador", sub:"Prazos, meta, motivos, nomes das campanhas."}),
    e("div",{className:"grid grid-cols-1 gap-4 lg:grid-cols-2"},
      e(Bloco,{t:"Prazos e meta (dias)"}, ETAPAS.slice(0,4).map(function(et){ return linha(et.nome+" at\u00e9 "+ETAPAS[et.n].nome.toLowerCase(), e(NumInput,{value:cfg.prazos[et.k], label:et.nome, onChange:function(v){d({type:"CFG", prazo:et.k, valor:v});}})); }),
        linha("Meta do cadastro \u00e0 entrega", e(NumInput,{value:cfg.metaDias, label:"Meta", onChange:function(v){d({type:"CFG", campo:"metaDias", valor:v});}})),
        linha("Desmarca\u00e7\u00f5es antes de cancelar", e(NumInput,{value:cfg.maxDesmarcacoes, label:"Desmarca\u00e7\u00f5es", onChange:function(v){d({type:"CFG", campo:"maxDesmarcacoes", valor:v});}})),
        linha("Ocultar entregues e canceladas ap\u00f3s", e(NumInput,{value:cfg.ocultarApos, label:"Dias", onChange:function(v){d({type:"CFG", campo:"ocultarApos", valor:v});}}))),
      e(Bloco,{t:"Motivos de cancelamento"},
        e("ul",{className:"flex flex-col gap-1"}, cfg.motivosCancel.map(function(m,i){ return e("li",{key:i, className:"flex items-center justify-between gap-2 text-sm"}, m,
          e("button",{"aria-label":"Remover "+m, onClick:function(){d({type:"CFG", lista:"motivosCancel", valor:cfg.motivosCancel.filter(function(x,j){return j!==i;})});}, className:"grid size-8 place-items-center rounded-lg hover:bg-muted/50"}, e(Icon,{n:"x", s:14}))); })),
        e("div",{className:"flex gap-2"}, e("input",{className:INPUT+" flex-1", placeholder:"Novo motivo", value:nov, onChange:function(ev){setNov(ev.target.value);}}),
          e(Btn,{ic:"plus", disabled:!nov.trim(), onClick:function(){d({type:"CFG", lista:"motivosCancel", valor:cfg.motivosCancel.concat([nov.trim()])}); setNov("");}},"Adicionar"))),
      e(Bloco,{t:"Nome das campanhas (an\u00fancios do Meta)"},
        e("p",{className:"text-[13px] text-muted-foreground"},"Os IDs vieram da planilha. D\u00ea um nome a cada campanha para aparecer no lugar do n\u00famero."),
        e("div",{className:"flex max-h-72 flex-col gap-2 overflow-auto pr-1"}, campanhas.map(function(id){ var n = s.dados.filter(function(c){return c.entId===id;}).length;
          return e("div",{key:id, className:"flex items-center gap-2"}, e("span",{className:MONO+" w-44 shrink-0 text-xs text-muted-foreground"}, id), e("span",{className:MONO+" w-8 text-right text-xs"}, n),
            e("input",{className:INPUT+" h-8! flex-1 text-sm!", placeholder:"Nome da campanha", value:cfg.campanhas[id]||"", onChange:function(ev){d({type:"CFG", campanha:id, valor:ev.target.value});}})); }))),
      e(Bloco,{t:"Valores e dados"},
        linha("Valor padr\u00e3o do kit novo", e(MoneyInput,{value:cfg.valorPadrao, label:"Valor padr\u00e3o", className:"w-36", onChange:function(v){d({type:"CFG", campo:"valorPadrao", valor:v});}})),
        e("p",{className:"text-[13px] text-muted-foreground"},"Dados da aba CURITIBA de Kits_Novos_2026.xlsx. As outras regi\u00f5es entram na pr\u00f3xima vers\u00e3o."),
        e("div",{className:"flex justify-end"}, e(Btn,{v:"destructive", ic:"trash", onClick:function(){setConf(true);}},"Recarregar planilha original")))),
    e(Modal,{open:conf, titulo:"Recarregar planilha original", sub:"Tudo o que foi alterado no sistema ser\u00e1 perdido.", confirmar:"Recarregar", icone:"trash", perigo:true, onClose:function(){setConf(false);}, onConfirmar:function(){d({type:"RESET"}); setConf(false);}},
      e("p",{className:"text-sm"},"Os 2.005 registros voltam exatamente como est\u00e3o na planilha.")));
}

export { AbaConfig };
