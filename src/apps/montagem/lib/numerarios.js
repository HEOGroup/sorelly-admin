// Sorelly Admin · montagem — lib/numerarios.js
// Lista dos numerários da DevMaster para qualquer tela do Admin escolher (nunca digitar). Regra: docs/regras/NUMERARIOS-ADMIN-X-DEVMASTER.md (R1).
// Vem de /api/numerarios (cópia diária, src/server/numerarios.js). Só quem é do Financeiro ou Admin lê: quem não pode ler vê o nome já gravado no cadastro.
import { chamar } from "@/apps/montagem/lib/api";
import { useEffect, useState } from "@/shared/react";

var CACHE = {dados:null, lendo:null};
var carrega = function(){
  if(CACHE.dados) return Promise.resolve(CACHE.dados);
  if(!CACHE.lendo) CACHE.lendo = chamar("GET", "/numerarios").then(function(j){ CACHE.dados = j; return j; }).catch(function(){ CACHE.lendo = null; return null; });
  return CACHE.lendo;
};

// numerário usado para a produção de peças (Marcus, 26/11/2026): Dávila, Leci e quem produzir
var NUMERARIO_PRODUCAO = {cod:"PPP", nome:"Pix Produção de Peças"};

/** {lista:[{cod, nome, tipo, banco}], carregou} só com numerários ativos. Lista vazia = ainda lendo ou sem permissão. */
function useNumerarios(){
  var sd = useState(CACHE.dados), dados = sd[0];
  useEffect(function(){ var vivo = true; if(!CACHE.dados) carrega().then(function(j){ if(vivo && j) sd[1](j); }); return function(){ vivo = false; }; }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  var lista = dados ? dados.linhas.filter(function(n){ return n.situacao==="Ativo"; }).map(function(n){ return {cod:n.cod, nome:n.nome, tipo:n.tipo, banco:n.banco, dono:n.dono}; }) : [];
  return {lista:lista, carregou:!!dados};
}

/** opções [código, nome] para um menu suspenso, com o numerário já gravado sempre presente (mesmo inativo ou sem leitura) */
function opcoesNumerario(lista, atual){
  var ops = lista.map(function(n){ return [n.cod, n.nome+" ("+n.cod+")"]; });
  if(atual && atual.cod && !ops.some(function(o){ return o[0]===atual.cod; })) ops.unshift([atual.cod, atual.nome+" ("+atual.cod+")"]);
  return [["", "Sem numerário"]].concat(ops);
}

export { useNumerarios, opcoesNumerario, NUMERARIO_PRODUCAO };
