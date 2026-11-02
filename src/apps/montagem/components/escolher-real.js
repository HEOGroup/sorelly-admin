// Sorelly Admin · montagem — components/escolher-real.js
// Escolhe uma representante REAL (lista do Agendamento, com o código do vendedor da DevMaster) e abre o app dela.
// O app mostra TODAS as revendedoras dela (carteira lida da DevMaster em mobile/representante.js); nada é gravado na DevMaster (01/11/2026, Marcus).
import { CampoSel } from "@/apps/montagem/components/padrao-fin";
import { e, useEffect, useState } from "@/shared/react";

function EscolherReal(p){
  var s = p.s, d = p.d;
  var reps = ((s.agend && s.agend.config && s.agend.config.representantes) || []).filter(function(r){ return r.ativo && r.codigo!=="02"; });
  var a = useState(""), rep = a[0], setRep = a[1];          // id da representante (ar-75)
  var r0 = reps.find(function(x){ return x.id===rep; });

  // garante a listagem do dia da representante e abre o app dela
  useEffect(function(){
    if(!r0) return;
    var l = s.listagens.find(function(x){ return x.rep===r0.nome && !x.fechada; }) || s.listagens.find(function(x){ return x.rep===r0.nome; });
    if(l){ if(p.onPronto) p.onPronto(l.id); }
    else d({type:"CRIAR_LISTAGEM", rep:r0.nome, destino:"Curitiba", horario:"10:00"});
  }, [rep, s.listagens.length]);

  return e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg border border-border bg-card/60 p-3 md:grid-cols-4"},
    e(CampoSel,{id:"er-rep", t:"Representante", value:rep, onChange:setRep, opcoes:[["", "Escolha"]].concat(reps.map(function(x){ return [x.id, x.nome+" · "+x.codigo]; }))}),
    e("p",{className:"col-span-2 self-end text-[13px] md:col-span-3"}, "O app abre com todas as revendedoras dela (dados reais da DevMaster)."));
}
export { EscolherReal };
