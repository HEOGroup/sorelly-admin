// Sorelly Admin · montagem — components/acertos-restantes.js
// Faturamento › Acertos (Marcus, 27/10/2026): tudo do mês num lugar só — acertos feitos, vendas no Carregar, acertos que ainda faltam (a realizar) e o total previsto.
// Os números são os mesmos da Visão geral (s.fechaMes, fatEfetivo) e o histórico por dia vem de s.restanteDia (gravado a cada "Salvar previstos"). Mudou aqui, muda a meta do Agendamento.
// Conferência: kits principais abertos na DevMaster com data prevista até o fim do mês (/api/acertos-previstos).
import { Bloco, COR, FaixaTotais, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { fatEfetivo } from "@/apps/montagem/domain/financeiro";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { e, useEffect, useState } from "@/shared/react";

var n0 = function(v){ return Math.round(v||0).toLocaleString("pt-BR"); };
var dm = function(iso){ return iso.slice(8, 10)+"/"+iso.slice(5, 7); };

function AcertosRestantes(p){
  var s = p.s, ym = p.ano+"-"+String(p.mes+1).padStart(2, "0"), atual = new Date().toISOString().slice(0, 7)===ym;
  var sp = useState(null), dev = sp[0], setDev = sp[1];
  useEffect(function(){ if(atual && apiAtiva()) chamar("GET", "/acertos-previstos").then(setDev).catch(function(){ setDev({erro:true}); }); }, [atual]);   // eslint-disable-line react-hooks/exhaustive-deps
  var fm = (s.fechaMes || {})[ym] || {}, fd = fatEfetivo(s), ks = Object.keys(fd).filter(function(k){ return k.slice(0, 7)===ym; }).sort();
  var feitos = ks.length ? (fd[ks[ks.length-1]].acertos || 0) : 0, carregar = Number(fm.carregar) || 0, aRealizar = Number(fm.aRealizar) || 0, prev = feitos+carregar+aRealizar;
  var mp = Number(s.metaPct), pct = mp>=97 && mp<=99 ? mp : 99, alvo = Math.round(prev*pct/100), falta = Math.max(0, alvo-feitos-carregar);
  var hist = Object.keys(s.restanteDia || {}).filter(function(k){ return k.slice(0, 7)===ym; }).sort().reverse();
  var ok = dev && dev.porMes ? dev.restoMes : null;
  return e("div",{className:"flex flex-col gap-3"},
    e(FaixaTotais,{itens:[{t:"Feitos", v:n0(feitos), cor:COR.entra},{t:"Carregar", v:n0(carregar), cor:"text-warning"},{t:"A realizar", v:n0(aRealizar)},{t:"Previstos", v:n0(prev)},{t:"Meta "+pct+"%", v:n0(alvo)},{t:"Falta p/ meta", v:n0(falta), cor:falta>0 ? COR.sai : COR.entra}]}),
    atual && e("p",{className:"text-[13px] text-foreground"}, ok===null ? "Conferindo a DevMaster…" : "DevMaster: "+n0(ok)+" revendedoras com kit principal aberto e data prevista até o fim do mês"+(ok===aRealizar ? " · confere com o A realizar." : " · o A realizar lançado é "+n0(aRealizar)+".")),
    e(Bloco,{t:"Dia a dia · o que ficou a realizar", dir:e("span",{className:"text-[11px] text-foreground"}, hist.length+" lançamentos")},
      hist.length===0 ? e("p",{className:"py-2 text-[13px] text-foreground"}, "Nenhum lançamento neste mês. Salve em Lançar.") :
      e(TabelaP,{cols:[{t:"Dia", w:"90px"},{t:"Feitos", n:true},{t:"Carregar", n:true},{t:"A realizar", n:true},{t:"Previstos", n:true},{t:"Meta "+pct+"%", n:true}], minW:"560px"},
        hist.map(function(k){ var r = s.restanteDia[k], pv = (r.feitos || 0)+(r.carregar || 0)+(r.aRealizar || 0);
          return e(Tr,{key:k}, e(Td,null, dm(k)), e(Td,{n:true}, n0(r.feitos)), e(Td,{n:true, cor:"text-warning"}, n0(r.carregar)), e(Td,{n:true, forte:true}, n0(r.aRealizar)), e(Td,{n:true}, n0(pv)), e(Td,{n:true}, n0(Math.round(pv*pct/100)))); }))));
}
export { AcertosRestantes };
