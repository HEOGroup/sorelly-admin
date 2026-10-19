// Sorelly Admin · kits novos Curitiba — pages/Kits.js
// Quatro modos: Quadro, Planilha, Representantes (controle) e Entregues (listagem).
import { Filtros, filtrar } from "@/apps/kits-novos/components/filtros";
import { Planilha } from "@/apps/kits-novos/components/fluxo";
import { Entregues } from "@/apps/kits-novos/components/entregues";
import { KPIs } from "@/apps/kits-novos/components/kpis";
import { Quadro } from "@/apps/kits-novos/components/quadro";
import { Representantes } from "@/apps/kits-novos/components/representantes";
import { use } from "@/apps/kits-novos/state/context";
import { Btn } from "@/apps/kits-novos/ui/button";
import { Icon } from "@/apps/kits-novos/ui/icon";
import { PageHead } from "@/apps/kits-novos/ui/page";
import { e } from "@/shared/react";
import React from "react";

var MODOS = ["quadro","planilha","representantes","entregues"];

function AbaKits(p){
  var cx = use(), s = cx.state, d = cx.dispatch, modo = MODOS.indexOf(s.modo)>=0 ? s.modo : "quadro"; // "fluxo" antigo vale como quadro
  var dados = filtrar(s), rep = modo==="representantes", ent = modo==="entregues";
  var seg = function(m, lb, ic){ return e("button",{type:"button", onClick:function(){d({type:"MODO", modo:m});}, className:"inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium "+(modo===m?"bg-primary text-primary-foreground":"text-muted-foreground hover:bg-muted/50")}, e(Icon,{n:ic, s:15}), lb); };
  var ocultar = rep ? ["rep","cid","ent","so"] : ent ? ["so"] : [];
  return e(React.Fragment,null,
    e(PageHead,{t:"Kits novos", sub:"Curitiba e região. Do cadastro até a entrega do kit."},
      e("div",{className:"flex flex-wrap rounded-lg border border-input bg-input/30 p-0.5"}, seg("quadro","Quadro","columns"), seg("planilha","Planilha","table"), seg("representantes","Representantes","user"), seg("entregues","Entregues","check")),
      e(Btn,{v:"primary", ic:"plus", onClick:function(){d({type:"DIALOGO", d:{tipo:"nova"}});}},"Nova revendedora")),
    e(KPIs),
    e(Filtros,{n:rep ? "" : ent ? dados.filter(function(c){return c.st==="entregue";}).length : dados.length, rotulo:rep ? "" : ent ? " entregues" : undefined, listas:p.listas, ocultar:ocultar, placeholder:rep ? "Buscar representante" : undefined}),
    rep ? e(Representantes) : ent ? e(Entregues,{dados:dados}) : modo==="quadro" ? e(Quadro,{dados:dados}) : e(Planilha,{dados:dados}));
}

export { AbaKits };
