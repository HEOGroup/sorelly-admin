// Sorelly Admin · kits novos Curitiba — components/rep-viagens.js
// Representantes › Viagens: as viagens a Ponta Grossa e a Joinville com os dias, a retirada dos kits na empresa e quem atende o destino (do mapa de regiões). A próxima viagem fica destacada.
import { FaixaTotais, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { todasReps } from "@/apps/kits-novos/domain/indicacao";
import { VIAGENS, diaSem, dd, diasTexto, faltam, mesDe, passou } from "@/apps/kits-novos/domain/viagens-rep";
import { hojeISO } from "@/apps/kits-novos/lib/datas";
import { use } from "@/apps/kits-novos/state/context";
import { e } from "@/shared/react";

// quem atende o destino no mapa de regiões
function quemAtende(s, destino){
  return todasReps(s).filter(function(it){ var p = it.p; if(!p) return false; if(destino==="Ponta Grossa") return !!p.pg || (p.outras||[]).some(function(x){ return x.c==="Ponta Grossa"; }); return (p.outras||[]).some(function(x){ return x.c===destino; }); }).map(function(it){ return it.nome; });
}
var COR = {"Ponta Grossa":"#c084fc", "Joinville":"#38bdf8"};
var Selo = function(d){ return e("span",{className:"inline-flex h-5 items-center rounded px-1.5 text-[11px] font-bold uppercase tracking-[.04em]", style:{background:COR[d]+"26", color:COR[d], border:"1px solid "+COR[d]+"66"}}, d); };

function RepViagens(){
  var s = use().state, hoje = hojeISO();
  var lista = VIAGENS.slice().sort(function(a, b){ return a.dias[0] < b.dias[0] ? -1 : 1; });
  var prox = lista.filter(function(v){ return !passou(v, hoje); })[0] || null;
  var nov = lista.filter(function(v){ return mesDe(v)==="Novembro"; }).length, dez = lista.filter(function(v){ return mesDe(v)==="Dezembro"; }).length;
  var quando = function(v){ var f = faltam(v, hoje); return passou(v, hoje) ? "já passou" : f<=0 ? "em andamento" : f===1 ? "amanhã" : "em "+f+" dias"; };
  return e("div",{className:"flex flex-col gap-3"},
    e(FaixaTotais,{itens:[{t:"Próxima viagem", v:prox ? prox.destino+" · "+diasTexto(prox) : "—", cor:"text-primary"}, {t:"Retirada dos kits", v:prox ? dd(prox.retira)+" às "+prox.hora : "—", cor:"text-warning"}, {t:"Faltam", v:prox ? (faltam(prox, hoje)<=0 ? "agora" : faltam(prox, hoje)+" dias") : "—"}, {t:"Novembro", v:nov+(nov===1 ? " viagem" : " viagens")}, {t:"Dezembro", v:dez+(dez===1 ? " viagem" : " viagens")}]}),
    e(TabelaP,{minW:900, cols:[{t:"Mês", w:100}, {t:"Destino", w:150}, {t:"Viagem", w:110}, {t:"Dias", w:150}, {t:"Retirada dos kits na empresa", w:230}, {t:"Quando", w:120}, {t:"Quem atende o destino"}]},
      lista.map(function(v){ var ehProx = prox && prox.id===v.id, gone = passou(v, hoje), quem = quemAtende(s, v.destino);
        return e(Tr,{key:v.id, apagado:gone},
          e(Td,null, mesDe(v)), e(Td,null, Selo(v.destino)), e(Td,{forte:ehProx}, v.n), e(Td,{forte:true}, diasTexto(v)),
          e(Td,{title:diaSem(v.retira)}, diaSem(v.retira)+" "+dd(v.retira)+" às "+v.hora), e(Td,{cor:ehProx ? "text-warning" : ""}, quando(v)),
          e(Td,{title:quem.join(", ")}, quem.length ? quem.join(", ") : "ninguém no mapa")); })),
    e("p",{className:"text-[13px] text-foreground"}, "Quem atende o destino vem do mapa de regiões (Regiões). Os dias ainda precisam da confirmação de cada representante."));
}

export { RepViagens };
