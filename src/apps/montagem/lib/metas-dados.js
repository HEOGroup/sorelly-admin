// Sorelly Admin · montagem — lib/metas-dados.js
// Dados das Metas das revendedoras para as telas do setor Metas (Revendedoras, Acompanhamento, Brindes, Histórico e Regras): UMA chamada ao servidor por mês,
// guardada por 1 minuto, para as telas não pedirem a mesma lista (2 mil revendedoras) toda hora. Só leitura (src/server/metas.js).
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { useEffect, useState } from "@/shared/react";

var CACHE = {};   // mês → {em, p}

function carregaMetas(mes, forcar){
  var c = CACHE[mes];
  if(!forcar && c && Date.now() - c.em < 60000) return c.p;
  var p = chamar("GET", "/metas/revendedoras?mes=" + mes);
  CACHE[mes] = {em: Date.now(), p: p};
  p.catch(function(){ delete CACHE[mes]; });
  return p;
}

/** Esquece a leitura guardada (a tela Campanha chama depois de salvar). */
function limpaMetas(){ CACHE = {}; }

/** {dados, erro, ligado}: dados = resposta do servidor (null enquanto lê). */
function useMetas(mes, versao){   // versao: mudar o número lê de novo (a tela Regras muda depois de salvar)
  var sd = useState(null), dados = sd[0], setDados = sd[1], se = useState(""), erro = se[0], setErro = se[1];
  useEffect(function(){
    if(!apiAtiva()) return;
    var vivo = true; setDados(null); setErro("");
    carregaMetas(mes).then(function(d){ if(vivo) setDados(d); }).catch(function(x){ if(vivo) setErro(x.message); });
    return function(){ vivo = false; };
  }, [mes, versao]);   // eslint-disable-line react-hooks/exhaustive-deps
  return {dados: dados, erro: erro, ligado: apiAtiva()};
}
export { carregaMetas, limpaMetas, useMetas };
