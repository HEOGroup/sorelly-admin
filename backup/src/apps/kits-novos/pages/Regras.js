// Sorelly Admin · kits novos Curitiba — pages/Regras.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { ETAPAS } from "@/apps/kits-novos/domain/etapas";
import { use } from "@/apps/kits-novos/state/context";
import { Card } from "@/apps/kits-novos/ui/card";
import { PageHead } from "@/apps/kits-novos/ui/page";
import { e } from "@/shared/react";
import React from "react";

function AbaRegras(){
  var s = use().state, cfg = s.cfg;
  var R = function(p){ return e(Card,{className:"flex flex-col gap-2 p-5"}, e("h2",{className:"font-heading text-base font-semibold"}, p.t), e("ul",{className:"flex list-disc flex-col gap-1 pl-5 text-sm"}, p.itens.map(function(x,i){ return e("li",{key:i}, x); }))); };
  return e(React.Fragment,null,
    e(PageHead,{t:"Regras", sub:"Como o funil funciona, do jeito que o setor confirmou."}),
    e("div",{className:"grid grid-cols-1 gap-4 lg:grid-cols-2"},
      e(R,{t:"Etapas", itens:["Cadastrada: chegou do setor de Cadastro (Camilly, Alessandra...).","Liberado: cadastro ok, pode solicitar o kit.","Solicitado: kit pedido na Devmaster. Exige representante definida.","Bipado: kit montado e bipado.","Entregue: kit na m\u00e3o da revendedora (data de retorno)."]}),
      e(R,{t:"Prazos", itens:ETAPAS.slice(0,4).map(function(et){ return et.nome+" at\u00e9 "+ETAPAS[et.n].nome.toLowerCase()+": "+cfg.prazos[et.k]+(cfg.prazos[et.k]>1?" dias":" dia"); }).concat(["Meta do cadastro \u00e0 entrega: "+cfg.metaDias+" dias.","Passou do prazo da etapa: fica vermelha e entra em Pend\u00eancias, vis\u00edvel para Michele e Nickolas."])}),
      e(R,{t:"Cancelamento", itens:["Motivos: "+cfg.motivosCancel.join(", ")+".","Desmarcou com a representante: registrar cada vez. Na "+cfg.maxDesmarcacoes+"\u00aa o sistema libera o cancelamento.","Cancelada pode ser reativada; volta para a etapa em que estava."]}),
      e(R,{t:"Outros", itens:["Contatos 1, 2 e 3 s\u00e3o refer\u00eancias; verde = confirmado.","Representante \"Sorelly\" + \"VEM NA EMPRESA\": a revendedora busca o kit na loja.","Retornando: revendedora antiga voltando, mesmo fluxo.","An\u00fancios do Meta aparecem pelo nome da campanha (Configurador).","S\u00f3 o Nickolas exclui um registro."]})));
}

export { AbaRegras };
