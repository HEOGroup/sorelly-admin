// Sorelly Admin · montagem — lib/sync-modulos.js
// Mantém os módulos escolhidos iguais no servidor (tabela estado_modulo): a cada 20 s busca o que mudou e, 1 s depois de mexer, envia só as chaves que mudaram.
// Só funciona com servidor ligado e pessoa logada (lib/api.js). Módulo ainda vazio no servidor: o que está no navegador de quem abrir primeiro sobe como ponto de partida.
// Quais módulos: variável VITE_MODULOS_SERVIDOR (ex.: "rh,cf") ou, para testar, localStorage "sorelly_modulos". Por padrão todos (cada pessoa só recebe os que o servidor libera para o setor dela).
import { apiAtiva, chamar, token } from "@/apps/montagem/lib/api";
import { useEffect, useRef } from "@/shared/react";

// todos os módulos que têm estado próprio; o servidor devolve 403 para os que a pessoa não pode abrir (ignorado em silêncio)
var PADRAO = ["rh", "eq", "cf", "ff", "ce", "pf", "cp", "px", "lp", "agend", "av", "cl", "ind", "pk", "pr", "ex", "cpc", "mk", "gr"];
function modulosLigados(){
  var t = ""; try { t = localStorage.getItem("sorelly_modulos") || ""; } catch(x){}
  if(!t) t = String((process.env.NEXT_PUBLIC_MODULOS_SERVIDOR) || "");
  var l = t.split(",").map(function(x){ return x.trim(); }).filter(Boolean);
  return l.length ? l : PADRAO;
}
var json = function(v){ try { return JSON.stringify(v===undefined ? null : v); } catch(x){ return ""; } };

// s = estado; d = dispatch (a ação SYNC_MODULO troca as chaves vindas do servidor)
function useSyncModulos(s, d){
  var ativo = apiAtiva() && !!token() && s.logado!==false;
  var ref = useRef({mods:{}, s:s});   // por módulo: {versao, snaps:{chave: json}, pronto}
  ref.current.s = s;
  var lista = modulosLigados();
  var puxar = function(chave){
    var m = ref.current.mods[chave] || (ref.current.mods[chave] = {versao:0, snaps:{}, pronto:false});
    if(m.semAcesso) return Promise.resolve();   // o servidor já disse que este setor não abre este módulo
    return chamar("GET", "/estado/"+chave+(m.pronto && m.versao>0 ? "?desde="+m.versao : "")).then(function(r){
      if(r.igual) return undefined;   // nada novo no servidor
      var trouxe = false;
      if(r.versao>m.versao || !m.pronto){
        var novas = {}, local = ref.current.s[chave] || {};
        Object.keys(r.conteudo||{}).forEach(function(k){ var j = json(r.conteudo[k]); m.snaps[k] = j; if(json(local[k])!==j) novas[k] = r.conteudo[k]; });
        if(Object.keys(novas).length){ d({type:"SYNC_MODULO", chave:chave, conteudo:novas}); trouxe = true; }
        m.versao = r.versao; if(r.versao>0) m.bloqueado = false;
      }
      m.pronto = true;
      // se trouxe dados novos, o envio fica para depois que a tela atualizar (senão o valor antigo do navegador voltaria por cima); servidor vazio: sobe o que está aqui
      return trouxe ? undefined : empurrar(chave);
    }).catch(function(x){ if(/não tem acesso/.test(x.message||"")) m.semAcesso = true; });
  };
  var empurrar = function(chave){
    var m = ref.current.mods[chave]; if(!m || !m.pronto || m.bloqueado || m.semAcesso) return Promise.resolve();
    var atual = ref.current.s[chave] || {}, mudou = {}, n = 0;
    Object.keys(atual).forEach(function(k){ var j = json(atual[k]); if(j!==m.snaps[k]){ mudou[k] = atual[k]; n++; } });
    if(!n) return Promise.resolve();
    return chamar("PUT", "/estado/"+chave, {chaves:mudou}).then(function(r){ Object.keys(mudou).forEach(function(k){ m.snaps[k] = json(mudou[k]); }); m.versao = r.versao; }).catch(function(x){ if(/carga inicial/.test(x.message||"")) m.bloqueado = true; });   // módulo ainda sem carga inicial: só a Diretoria sobe; para de tentar até chegar dados do servidor
  };
  // busca ao entrar e a cada 20 s
  useEffect(function(){
    if(!ativo) return;
    var vivo = true, tick = function(){ lista.forEach(function(c){ if(vivo) puxar(c); }); }; tick();
    var iv = setInterval(tick, 20000); return function(){ vivo = false; clearInterval(iv); };
  }, [ativo, lista.join(",")]);
  // envia 1 s depois da última mudança
  var assinatura = lista.map(function(c){ return json(s[c]); }).join("|");
  useEffect(function(){
    if(!ativo) return;
    var t = setTimeout(function(){ lista.forEach(empurrar); }, 1000); return function(){ clearTimeout(t); };
  }, [ativo, assinatura]);
}
export { useSyncModulos, modulosLigados };
