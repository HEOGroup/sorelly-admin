// Sorelly Admin · kits novos Curitiba — pages/Kits.js
// Quatro modos: Quadro, Planilha, Representantes (controle) e Entregues (listagem). Padrão do Financeiro: faixa de totais, bloco Filtros no topo, abas visíveis.
import { AbasTela, Botao, Segmentado } from "@/apps/montagem/components/padrao-fin";
import { Filtros, filtrar } from "@/apps/kits-novos/components/filtros";
import { Planilha } from "@/apps/kits-novos/components/fluxo";
import { Entregues } from "@/apps/kits-novos/components/entregues";
import { KPIs } from "@/apps/kits-novos/components/kpis";
import { Quadro } from "@/apps/kits-novos/components/quadro";
import { Representantes } from "@/apps/kits-novos/components/representantes";
import { ETAPAS } from "@/apps/kits-novos/domain/etapas";
import { use } from "@/apps/kits-novos/state/context";
import { PageHead } from "@/apps/kits-novos/ui/page";
import { e } from "@/shared/react";
import React from "react";

var MODOS = ["quadro","planilha","representantes","entregues"];

function AbaKits(p){
  var cx = use(), s = cx.state, d = cx.dispatch, modo = MODOS.indexOf(s.modo)>=0 ? s.modo : "quadro"; // "fluxo" antigo vale como quadro
  var dados = filtrar(s), rep = modo==="representantes", ent = modo==="entregues", plan = modo==="planilha";
  var ocultar = ent ? ["so"] : [];   // em Representantes os filtros ficam dentro da própria tela (abas Controle e Fluxo)
  // contagem de cada etapa com os filtros atuais (menos a própria etapa), para as abas da planilha
  var base = filtrar(Object.assign({}, s, {filtro:Object.assign({}, s.filtro, {st:""})}));
  var contar = function(k){ return base.filter(function(c){ return !k || c.st===k; }).length; };
  var abas = [["", "Todas "+contar("")]].concat(ETAPAS.concat([{k:"cancelado", nome:"Cancelado"}]).map(function(x){ return [x.k, x.nome+" "+contar(x.k)]; }));
  return e(React.Fragment,null,
    e(PageHead,{t:"Kits novos", sub:"Curitiba e região. Do cadastro até a entrega do kit."},
      e(Segmentado,{opcoes:[["quadro","Quadro"],["planilha","Planilha"],["representantes","Representantes"],["entregues","Entregues"]], atual:modo, onMudar:function(m){ d({type:"MODO", modo:m}); }}),
      e(Botao,{principal:true, onClick:function(){ d({type:"DIALOGO", d:{tipo:"nova"}}); }}, "Nova revendedora")),
    !rep && e(KPIs),
    !rep && e(Filtros,{listas:p.listas, ocultar:ocultar, }),
    plan && e(AbasTela,{abas:abas, atual:s.filtro.st||"", onMudar:function(k){ d({type:"FILTRO", f:{st:k}}); }}),
    rep ? e(Representantes,{listas:p.listas}) : ent ? e(Entregues,{dados:dados}) : modo==="quadro" ? e(Quadro,{dados:dados}) : e(Planilha,{dados:dados}));
}

export { AbaKits };
