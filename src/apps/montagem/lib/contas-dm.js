// Sorelly Admin · montagem — lib/contas-dm.js
// Traz do servidor (que lê a DevMaster) as contas a pagar e as contas pagas: ao abrir o sistema e a cada 10 minutos. Quem não é do Financeiro recebe 403 e fica sem isso (em silêncio).
import { apiAtiva, chamar, token } from "@/apps/montagem/lib/api";
import { definirContasServidor } from "@/apps/montagem/domain/contas-empresa";
import { useEffect, useState } from "@/shared/react";

function useContasDm(logado, dispatch){
  var st = useState(0), setTick = st[1], tk = token();
  useEffect(function(){
    if(!apiAtiva() || !tk || logado===false) return undefined;
    var vivo = true, parado = false;
    var buscar = function(){
      if(parado) return;
      chamar("GET", "/contas-dm").then(function(r){
        if(!vivo || !r || !r.apagar) return;
        definirContasServidor(r);
        dispatch({type:"CONTAS_DM", diario:r.diario || {}});
        setTick(function(n){ return n+1; });   // refaz a tela com a lista nova
      }).catch(function(x){ if(/Só o Financeiro/.test(x.message||"")) parado = true; });
    };
    buscar(); var iv = setInterval(buscar, 600000);
    return function(){ vivo = false; clearInterval(iv); };
  }, [tk, logado]);
}
export { useContasDm };
