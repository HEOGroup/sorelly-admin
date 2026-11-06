// Sorelly Admin · kits novos Curitiba — pages/Kits.js
// Telas do Kits novos: Kits novos (Quadro e Planilha), Representantes e Entregues (cada uma com a sua entrada no menu).
import { AbasTela, Botao, Segmentado } from "@/apps/montagem/components/padrao-fin";
import { Filtros, filtrar } from "@/apps/kits-novos/components/filtros";
import { Planilha } from "@/apps/kits-novos/components/fluxo";
import { Entregues } from "@/apps/kits-novos/components/entregues";
import { KPIs, PorEtapa } from "@/apps/kits-novos/components/kpis";
import { Quadro } from "@/apps/kits-novos/components/quadro";
import { Representantes } from "@/apps/kits-novos/components/representantes";
import { ETAPAS, seguro } from "@/apps/kits-novos/domain/etapas";
import { use } from "@/apps/kits-novos/state/context";
import { PageHead } from "@/apps/kits-novos/ui/page";
import { e } from "@/shared/react";
import React from "react";

var MODOS = ["quadro","planilha"];

// Tela Kits novos: Resumo em um bloco, filtros compactos com o seletor Quadro/Planilha ao lado (Marcus, 05/11/2026).
function AbaKits(p){
  var cx = use(), s = cx.state, d = cx.dispatch, modo = MODOS.indexOf(s.modo)>=0 ? s.modo : "quadro"; // modos antigos (fluxo, representantes, entregues) valem como quadro
  var dados = filtrar(s), plan = modo==="planilha";
  // contagem de cada etapa com os filtros atuais (menos a própria etapa), para as abas da planilha
  var base = filtrar(Object.assign({}, s, {filtro:Object.assign({}, s.filtro, {st:""})}));
  var contar = function(k){ return base.filter(function(c){ return !k || (k==="aguardando" ? seguro(c) : c.st===k && !seguro(c)); }).length; };
  var abas = [["", "Todas "+contar("")]].concat(ETAPAS.slice(0, 1).concat([{k:"aguardando", nome:"Aguardando peça"}], ETAPAS.slice(1), [{k:"cancelado", nome:"Cancelado"}]).map(function(x){ return [x.k, x.nome+" "+contar(x.k)]; }));
  return e(React.Fragment,null,
    e(PageHead,{t:"Kits novos", sub:""},
      e(Segmentado,{opcoes:[["quadro","Quadro"],["planilha","Planilha"]], atual:modo, onMudar:function(m){ d({type:"MODO", modo:m}); }}),
      e(Botao,{principal:true, onClick:function(){ d({type:"DIALOGO", d:{tipo:"nova"}}); }}, "Nova revendedora")),
    e("div",{className:"grid grid-cols-1 items-start gap-2.5 md:grid-cols-2"}, e(KPIs), e(PorEtapa)),
    e(Filtros,{listas:p.listas}),
    plan && e(AbasTela,{abas:abas, atual:s.filtro.st||"", onMudar:function(k){ d({type:"FILTRO", f:{st:k}}); }}),
    plan ? e(Planilha,{dados:dados}) : e(Quadro,{dados:dados}));
}

// Telas próprias no menu Kits novos (antes eram botões dentro da tela Kits novos)
function AbaKitsRepresentantes(p){
  return e(React.Fragment,null,
    e(PageHead,{t:"Representantes", sub:"Controle de kits e recusas, fluxo, regiões, horários, viagens e indicação."}),
    e(Representantes,{listas:p.listas}));
}
function AbaKitsEntregues(p){
  var s = use().state;
  return e(React.Fragment,null,
    e(PageHead,{t:"Entregues", sub:"Kits novos já entregues, do mais recente para o mais antigo."}),
    e(Filtros,{listas:p.listas, ocultar:["so"]}),
    e(Entregues,{dados:filtrar(s)}));
}

export { AbaKits, AbaKitsRepresentantes, AbaKitsEntregues };
