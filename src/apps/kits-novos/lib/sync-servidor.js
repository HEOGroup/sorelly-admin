// Sorelly Admin · kits novos — lib/sync-servidor.js
// Os Kits novos (planilha da Michele + o que a equipe faz nas etapas) ficavam SÓ no navegador de cada pessoa: a Michele via 51 kits em Liberado e a Camilly 111, e quem abria
// com a leitura falhando via a aba zerada (Camilly, chamado de 10/11/2026). Agora cada kit é uma chave r_<id> do módulo kndados do servidor, e todo mundo enxerga os mesmos.
// Regra de quem vale, kit por kit: vale a cópia com MAIS histórico (hist); empate = a do servidor. Assim o que alguém já fez no seu navegador antes desta mudança sobe, e nada
// que o servidor tem de mais novo é apagado. Só mandamos ao servidor os kits que mudaram (um PUT com as chaves alteradas; o servidor junta chave por chave).
import { apiAtiva, chamar, token } from "@/apps/montagem/lib/api";
import { useEffect, useRef } from "@/shared/react";

var G = {versao:0, snaps:{}, pronto:false, lendo:false, empurrando:false, avisou:0};   // compartilhado entre as telas (cada aba do menu monta seu próprio estado)

// texto igual para dados iguais, mesmo com as chaves em outra ordem (o servidor devolve em ordem própria)
function canon(v){
  if(Array.isArray(v)) return "["+v.map(canon).join(",")+"]";
  if(v && typeof v==="object") return "{"+Object.keys(v).sort().map(function(k){ return JSON.stringify(k)+":"+canon(v[k]); }).join(",")+"}";
  return JSON.stringify(v===undefined ? null : v);
}
var histN = function(c){ return (c && c.hist && c.hist.length) || 0; };

function puxar(ref, d){
  if(!apiAtiva() || !token() || G.lendo) return Promise.resolve();
  G.lendo = true;
  return chamar("GET", "/estado/kndados"+(G.pronto && G.versao>0 ? "?desde="+G.versao : "")).then(function(r){
    if(r.igual) return;
    var c = r.conteudo || {}, locais = {}, trazer = [];
    ref.current.s.dados.forEach(function(x){ locais[x.id] = x; });
    Object.keys(c).forEach(function(k){
      if(k.indexOf("r_")!==0 || !c[k] || c[k].id===undefined) return;
      var sv = Object.assign({}, c[k], {hist:c[k].hist || []}), j = canon(sv), lo = locais[sv.id];
      G.snaps[sv.id] = j;
      if(lo && canon(lo)===j) return;            // já igual
      if(lo && histN(lo)>histN(sv)) return;      // a cópia daqui é mais nova: fica e sobe logo depois
      trazer.push(sv);
    });
    if(trazer.length) d({type:"SYNC_SERVIDOR", registros:trazer});
    G.versao = r.versao || G.versao; G.pronto = true;
  }).catch(function(){
    if(!G.pronto && Date.now()-G.avisou>300000){ G.avisou = Date.now(); d({type:"AVISO", txt:"Não consegui buscar os kits novos no servidor. Atualize a página; se continuar, avise o desenvolvimento."}); }
  }).then(function(){ G.lendo = false; return empurrar(ref); });
}

function empurrar(ref){
  if(!apiAtiva() || !token() || !G.pronto || G.empurrando) return Promise.resolve();
  var mud = {}, marcas = [];
  ref.current.s.dados.forEach(function(c){ var j = canon(c); if(G.snaps[c.id]!==j){ mud["r_"+c.id] = c; marcas.push([c.id, j]); } });
  if(!marcas.length) return Promise.resolve();
  G.empurrando = true;
  return chamar("PUT", "/estado/kndados", {chaves:mud}).then(function(){ marcas.forEach(function(p){ G.snaps[p[0]] = p[1]; }); G.versao = 0; }).catch(function(){ /* tenta de novo na próxima mudança ou na próxima leitura */ }).then(function(){ G.empurrando = false; });
}

// usar no alto de cada tela dos Kits novos: useSyncKitsNovos(state, dispatch)
function useSyncKitsNovos(s, d){
  var ref = useRef({s:s}); ref.current.s = s;
  useEffect(function(){
    if(!apiAtiva()) return undefined;
    var vivo = true, rodar = function(){ if(vivo) puxar(ref, d); };
    rodar();
    var id = setInterval(rodar, 20000);
    window.addEventListener("focus", rodar);
    return function(){ vivo = false; clearInterval(id); window.removeEventListener("focus", rodar); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function(){
    if(!G.pronto) return undefined;
    var t = setTimeout(function(){ empurrar(ref); }, 1200);
    return function(){ clearTimeout(t); };
  }, [s.dados]);
}

export { useSyncKitsNovos };
