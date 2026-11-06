// Sorelly Admin · montagem — pages/trafego/ConfigTrafego.js
// Configurador geral › Tráfego pago: o imposto que o Meta acrescenta ao investimento (12,15% na planilha do Diego). Vale na hora na aba Investimento.
import { Bloco, Botao } from "@/apps/montagem/components/padrao-fin";
import { CampoTexto } from "@/apps/montagem/pages/trafego/comum";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

function AbaConfigTrafego(){
  var cx = use(), tp = cx.state.tp, d = cx.dispatch;
  var sv = useState(String(tp.config.taxaMeta).replace(".", ",")), v = sv[0];
  var salvar = function(){ d({type:"TP", op:"config_set", taxaMeta:v.replace(",", ".")}); };
  return e(Bloco,{t:"Tráfego pago · imposto do Meta"},
    e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4"},
      e(CampoTexto,{t:"Imposto do Meta (%)", id:"cfg-tp-taxa", value:v, onChange:sv[1]}),
      e("div",{className:"col-span-2 flex items-end gap-2"}, e(Botao,{principal:true, onClick:salvar}, "Salvar"))),
    e("p",{className:"mt-2 text-[13px] text-foreground"}, "Soma-se ao investimento do Meta (digitado sem imposto) na aba Investimento. O Google não leva acréscimo."));
}
export { AbaConfigTrafego };
