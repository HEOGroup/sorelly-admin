// Sorelly Admin · kits novos Curitiba — components/linha.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { Contatos, EntBadge, Etiquetas, StBadge } from "@/apps/kits-novos/components/badges";
import { ETAPAS, aberto, atrasado, diasNaEtapa, etapaDe } from "@/apps/kits-novos/domain/etapas";
import { dataBR } from "@/apps/kits-novos/lib/datas";
import { BK } from "@/apps/kits-novos/lib/format";
import { use } from "@/apps/kits-novos/state/context";
import { Btn } from "@/apps/kits-novos/ui/button";
import { Icon } from "@/apps/kits-novos/ui/icon";
import { MONO } from "@/apps/kits-novos/ui/input";
import { TD, TR } from "@/apps/kits-novos/ui/table";
import { e } from "@/shared/react";

function Linha(p){
  var cx = use(), s = cx.state, d = cx.dispatch, c = p.c, atr = atrasado(c,s.cfg), et = etapaDe(c), prox = aberto(c) && ETAPAS[et.n];
  var abrir = function(){ d({type:"DIALOGO", d:{tipo:"detalhe", id:c.id}}); };
  var dt = function(v){ return e(TD,{r:true, className:v?"":"text-muted-foreground"}, v ? dataBR(v).slice(0,5) : "\u2014"); };
  return e("tr",{className:TR+(atr?" bg-destructive/5":"")},
    e(TD,{className:MONO+(atr?" text-destructive font-semibold":" text-muted-foreground")}, aberto(c) ? diasNaEtapa(c)+"d" : "\u2014"),
    e(TD,{r:true, className:MONO}, dataBR(c.cad).slice(0,5)),
    e(TD,null, e("button",{onClick:abrir, className:"font-medium hover:underline"}, c.tipo==="Retornando" && e("span",{className:"text-purple"},"\u21bb "), c.nome),
      e("p",{className:"text-muted-foreground"}, (c.bai?c.bai+", ":"")+c.cid)),
    e(TD,null, e(EntBadge,{c:c})),
    e(TD,null, c.rep ? c.rep : e("span",{className:"text-warning"},"sem representante")),
    e(TD,{r:true}, e("span",{className:"text-muted-foreground"}, c.mod+" "), e("b",{className:MONO+" text-primary"}, BK(c.val))),
    e(TD,null, e(Contatos,{c:c})),
    e(TD,null, e("span",{className:"flex gap-1"}, e(StBadge,{c:c}), e(Etiquetas,{c:c}))),
    dt(c.lib), dt(c.sol), dt(c.bip), dt(c.ret),
    e(TD,{className:MONO}, c.retirada || "\u2014"),
    e(TD,null, e("span",{className:"flex justify-end gap-1"},
      prox && e(Btn,{v:"primary", sm:true, ic:"arrowright", onClick:function(){d({type:"DIALOGO", d:{tipo:"avancar", id:c.id}});}}, prox.nome),
      e("button",{"aria-label":"Mais a\u00e7\u00f5es", onClick:abrir, className:"grid size-8 place-items-center rounded-lg hover:bg-muted/50"}, e(Icon,{n:"dots", s:16})))));
}
var COLS = [{t:"Etapa",r:0},{t:"Cadastro",r:1},{t:"Nome"},{t:"Entrada"},{t:"Representante"},{t:"Kit",r:1},{t:"Contatos"},{t:"Situa\u00e7\u00e3o"},
  {t:"Liberado",r:1,cor:"text-purple"},{t:"Solicitado",r:1,cor:"text-primary"},{t:"Bipado",r:1,cor:"text-info"},{t:"Retorno",r:1,cor:"text-success"},{t:"Retirada"},{t:""}];

export { Linha, COLS };
