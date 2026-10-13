// Sorelly Admin — pages/ConfiguradorGeral.js
// UM configurador só para todos os setores (Tecnologia → Configurador geral): montagem e bipagem, representantes, kit novo, avisos e quem bipa os retornos.
// Os configuradores antigos saíram do menu e viraram seções aqui dentro.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { SETORES_LOGIN } from "@/apps/montagem/components/seletor-acesso";
import { BIPA_RETORNO_PADRAO } from "@/apps/montagem/domain/equipe";
import { quemBipa } from "@/apps/montagem/domain/retornos";
import { PAPEL_LB } from "@/apps/montagem/navigation/perfis";
import { AbaConfig } from "@/apps/montagem/pages/Config";
import { AbaConfigAvisos } from "@/apps/montagem/pages/ConfigAvisos";
import { AbaConfigRepresentantes } from "@/apps/montagem/pages/ConfigRepresentantes";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useEffect, useState } from "@/shared/react";
import React from "react";

// Quem bipa os retornos dos kits: pessoas marcadas aqui abrem o Consolidado e o Controle de kits (sem ver os totais em dinheiro) e dão o OK na fila de bipagem.
function ConfigQuemBipa(){
  var cx = use(), s = cx.state, d = cx.dispatch, ids = quemBipa(s, BIPA_RETORNO_PADRAO());
  var alterna = function(id){ d({type:"BIPA_RETORNO_SET", ids: ids.indexOf(id)>=0 ? ids.filter(function(x){ return x!==id; }) : ids.concat([id])}); };
  return e(BlocoBarra,{t:"Quem bipa os retornos", sub:ids.length+" pessoas · marque quem pode bipar os kits que voltam das representantes"},
    e("div",{className:"flex flex-col gap-3 p-3"},
      e("p",{className:"text-[13px] text-white/80"},"Quem estiver marcado abre o Consolidado e o Controle de kits e dá o OK de cada retorno bipado. O resultado por representante e os totais em dinheiro continuam só da diretoria. Cadastro, encomendas e outros setores que ajudam entram aqui quando tiverem usuário."),
      e("div",{className:"grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3"}, SETORES_LOGIN().filter(function(g){ return g[1].length; }).map(function(g){
        return e("div",{key:g[0], className:"flex flex-col gap-1.5 rounded-xl bg-black/25 p-2.5"},
          e("b",{className:"text-[11px] uppercase tracking-wide text-primary"}, PAPEL_LB[g[0]]),
          g[1].map(function(p){ var on = ids.indexOf(p.id)>=0;
            return e("label",{key:p.id, className:"flex cursor-pointer items-center gap-2 text-[13px]"}, e("input",{type:"checkbox", checked:on, onChange:function(){ alterna(p.id); }, className:"size-4"}), p.nome); })); }))));
}

// Configurador do kit novo (é de outro módulo, precisa carregar os dados dele antes)
function ConfigKitNovo(){
  var st = useState(null), Comp = st[0], setComp = st[1];
  useEffect(function(){ var vivo = true;
    import("@/apps/kits-novos/data/dados").then(function(m){ return m.carregarDados(); })
      .then(function(){ return import("@/apps/montagem/pages/KitsNovosEmbutido"); }).then(function(m){ if(vivo) setComp(function(){ return m.AbaConfigKNEmbutido; }); });
    return function(){ vivo = false; }; }, []);
  return Comp ? e(Comp) : e("p",{className:"p-4 text-center text-[13px] text-white/70"},"Carregando o configurador do kit novo…");
}

var SECOES = [["montagem","Montagem e bipagem", AbaConfig], ["rep","Representantes", AbaConfigRepresentantes], ["kn","Kit novo", ConfigKitNovo], ["avisos","Avisos e alertas", AbaConfigAvisos], ["bipa","Quem bipa os retornos", ConfigQuemBipa]];

function AbaConfiguradorGeral(){
  var sc = useState("montagem"), sec = sc[0], setSec = sc[1], atual = SECOES.find(function(x){ return x[0]===sec; }) || SECOES[0];
  return e(React.Fragment,null,
    e(PageHead,{t:"Configurador geral", sub:"Um só para todos os setores: escolha o setor abaixo."}),
    e("div",{className:"flex flex-wrap gap-1.5"}, SECOES.map(function(x){ return e("button",{key:x[0], onClick:function(){ setSec(x[0]); },
      className:"rounded-lg px-3 py-1.5 text-[13px] font-semibold ring-1 "+(sec===x[0] ? "bg-primary/15 ring-2 ring-primary" : "bg-card ring-border hover:bg-muted/40")}, x[1]); })),
    e(atual[2], {key:sec}));
}

export { AbaConfiguradorGeral };
