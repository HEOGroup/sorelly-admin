// Sorelly Admin — mobile/conds-reais.js
// Carrega do servidor (DevMaster, só leitura) as condicionais REAIS de um kit e grava no kit (ação KIT_CONDS_REAIS). 05/11/2026 (Marcus): sem dado falso.
// A revendedora é achada pelo código da DevMaster (kit.codRev, vem da lista real da representante) ou pelo CPF (revendedora nova, digitado na etapa 1 da entrega).
// Devolve {est, aviso}: est = "ok" | "carregando" | "semcpf" | "vazio" | "erro".
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { useEffect, useState } from "@/shared/react";

function useCondsReais(s, d, k){
  var perfil = (s.perfisRev||{})[k.rev] || {};
  var cpf = String(perfil.cpf||"").replace(/\D/g,""), cod = String(k.codRev||"").replace(/\D/g,"");
  var chave = cod ? "cod="+cod : cpf.length===11 ? "cpf="+cpf : "";
  var bs = useState({est:"", aviso:""}), busca = bs[0], setBusca = bs[1];
  useEffect(function(){
    if(!chave){ setBusca({est:"semcpf", aviso:""}); return; }
    if(!apiAtiva()){ setBusca({est:"erro", aviso:"Sem conexão com o servidor."}); return; }
    var vivo = true; setBusca({est:"carregando", aviso:""});
    chamar("GET", "/representante/condicionais?recente=1&"+chave).then(function(r){
      if(!vivo) return;
      if(r.condicionais && r.condicionais.length){ d({type:"KIT_CONDS_REAIS", kitId:k.id, conds:r.condicionais}); setBusca({est:"ok", aviso:""}); }
      else setBusca({est:"vazio", aviso:r.aviso || "Essa revendedora não tem condicional aberta na DevMaster."});
    }).catch(function(x){ if(vivo) setBusca({est:"erro", aviso:x.message}); });
    return function(){ vivo = false; };
  }, [chave, k.id]);   // eslint-disable-line react-hooks/exhaustive-deps
  var tem = (k.condsReais||[]).length>0;
  return {tem:tem, est:busca.est, aviso: tem ? "" : busca.est==="semcpf" ? "Informe o CPF da revendedora na etapa 1 para buscar as peças na DevMaster."
    : busca.est==="carregando" ? "Buscando as condicionais na DevMaster..." : (busca.aviso || "Sem condicional da DevMaster para este kit.")};
}

export { useCondsReais };
