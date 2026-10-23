// Sorelly Admin · montagem — pages/marketing/Visao.js
// Marketing → Visão geral: números do Mural, da Divulgação do mês e dos Erros em produtos.
import { Faixa, Indicador } from "@/apps/montagem/components/padrao";
import { TIPOS, STATUS, resumoMarketing } from "@/apps/montagem/domain/marketing";
import { COR } from "@/apps/montagem/pages/marketing/comum";
import { use } from "@/apps/montagem/state/context";
import { e } from "@/shared/react";

var COR_STATUS = {EM_PRODUCAO:"neutro", AGENDADO:"alerta", POSTADO:"ok"};

function AbaMkVisao(p){
  var s = use().state, r = resumoMarketing(s), m = r.artesNoMes;
  // cada número leva à tela dele (abas do próprio Marketing)
  var ir = function(aba, el){ return e("button",{type:"button", onClick:function(){ p.ir(aba); }, title:"Abrir a tela", className:"block w-full min-w-0 rounded-xl text-left transition hover:ring-1 hover:ring-white/30"}, el); };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:4},
      ir("mural", e(Indicador,{t:"Grupos de criativos", v:String(r.grupos), cor:COR, className:"h-full"})),
      ir("mural", e(Indicador,{t:"Imagens no mural", v:String(r.imagens), cor:COR, className:"h-full"})),
      ir("divulgacao", e(Indicador,{t:"Artes no mês", v:String(m.total), cor:COR, className:"h-full"})),
      ir("erros", e(Indicador,{t:"Produtos com erro", v:String(r.errosPendentes), cor:r.errosPendentes ? "ruim" : "ok", sub:r.errosPendentes ? "Pendentes" : "Nenhum pendente", className:"h-full"}))),
    e(Faixa,{n:6},
      STATUS.map(function(x){ return e("div",{key:x.valor, className:"min-w-0"}, ir("divulgacao", e(Indicador,{t:x.rotulo, v:String(m.porStatus[x.valor]||0), cor:COR_STATUS[x.valor], sub:"Artes do mês", className:"h-full"}))); }),
      TIPOS.map(function(x){ return e("div",{key:x.valor, className:"min-w-0"}, ir("divulgacao", e(Indicador,{t:x.rotulo, v:String(m.porTipo[x.valor]||0), cor:COR, sub:"Artes do mês", className:"h-full"}))); })));
}
export { AbaMkVisao };
