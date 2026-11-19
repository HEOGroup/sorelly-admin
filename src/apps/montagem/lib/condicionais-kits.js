// Sorelly Admin — lib/condicionais-kits.js
// Liga a DevMaster ao kit (16/11/2026, Marcus: "liga as condicionais"). Para cada kit que ainda não começou a ser montado e que tem o código da
// revendedora na DevMaster (kit.codRev), busca as condicionais ABERTAS (rota /api/condicionais-kits, só leitura) e grava os números no kit
// (ação KIT_COND_NUMS), junto com as 3 últimas vendas da média, de onde sai o valor automático do kit. Daí a funcionária de condicionais, a montadora e a bipadora conferem os números reais. Cada kit é buscado uma vez.
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { useEffect, useRef } from "@/shared/react";

var TIPOS = {acerto_kit:1, acerto_kit_exp:1, reposicao:1};   // kit novo não tem condicional antes da entrega; condicional/saiu vêm por outro caminho
var ANTES_DA_MONTAGEM = {semvalor:1, pendente:1, precond:1};

function useCondicionaisKits(s, d){
  var feito = useRef({});
  useEffect(function(){
    if(!s.logado || !apiAtiva() || !(s.kits||[]).length) return;
    var hoje = new Date(Date.now() - 3*3600000).toISOString().slice(0, 10);   // dia de Brasília
    var porId = {}; (s.listagens||[]).forEach(function(l){ porId[l.id] = l; });
    var alvo = s.kits.filter(function(k){
      var l = porId[k.lid];
      return k.codRev && TIPOS[k.tipoKit] && ANTES_DA_MONTAGEM[k.status] && (!(k.cond && k.cond.condBuscaEm) || !(k.cond && k.cond.valorBuscaEm) || k.cond.condRegra!==2) && !feito.current[k.id] && l && !l.fechada && String(l.data) >= hoje;
    });
    if(!alvo.length) return;
    alvo.forEach(function(k){ feito.current[k.id] = 1; });
    var cods = [], vistos = {}; alvo.forEach(function(k){ var c = String(k.codRev).replace(/\D/g, ""); if(c && !vistos[c]){ vistos[c] = 1; cods.push(c); } });
    for(var i = 0; i < cods.length; i += 100){
      (function(lote){
        chamar("GET", "/condicionais-kits?cods="+lote.join(",")).then(function(r){
          alvo.forEach(function(k){
            var c = String(k.codRev).replace(/\D/g, ""); if(lote.indexOf(c) < 0 || !r || !r.cods) return;
            d({type:"KIT_COND_NUMS", kitId:k.id, conds:r.cods[c] || [], vendas:r.vendas ? (r.vendas[c] || []) : undefined});
          });
        }).catch(function(){ alvo.forEach(function(k){ delete feito.current[k.id]; }); });   // sem servidor ou sem permissão: tenta de novo na próxima mudança
      })(cods.slice(i, i + 100));
    }
  }, [s.kits, s.listagens, s.logado]);   // eslint-disable-line react-hooks/exhaustive-deps
}

export { useCondicionaisKits };
