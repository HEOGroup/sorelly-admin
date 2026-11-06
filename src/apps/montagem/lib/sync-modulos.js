// Sorelly Admin · montagem — lib/sync-modulos.js
// Mantém os módulos escolhidos iguais no servidor (tabela estado_modulo): a cada 20 s busca o que mudou e, 1 s depois de mexer, envia só as chaves que mudaram.
// Só funciona com servidor ligado e pessoa logada (lib/api.js). Módulo ainda vazio no servidor: o que está no navegador de quem abrir primeiro sobe como ponto de partida.
// Quais módulos: variável VITE_MODULOS_SERVIDOR (ex.: "rh,cf") ou, para testar, localStorage "sorelly_modulos". Por padrão todos (cada pessoa só recebe os que o servidor libera para o setor dela).
import { apiAtiva, chamar, token } from "@/apps/montagem/lib/api";
import { useEffect, useRef, useState } from "@/shared/react";

// todos os módulos que têm estado próprio; o servidor devolve 403 para os que a pessoa não pode abrir (ignorado em silêncio)
var PADRAO = ["rh", "eq", "cf", "ff", "ce", "pf", "cp", "px", "lp", "agend", "av", "cl", "ind", "pk", "pr", "ex", "er", "cpc", "mk", "gr", "revdia", "fatdia", "fd", "inicio", "chathor", "ri", "pfmes", "sc", "mel", "kn", "rhsol", "rpo", "rpf"];
// módulos que não têm objeto próprio no estado: a fatia é montada com chaves de primeiro nível (ri = revendedoras do atendimento interno, s.revInternas)
var ESPELHO = {ri:["revInternas"], sc:["saldosContas"], fd:["faturamentoDiario", "contasPagasDiario", "fatHoje", "fechaMes", "metaMensal", "contasPagar", "contasPagarEm"]};   // fd = faturamento e contas pagas por dia (lançados pela equipe do Financeiro; corte do admin antigo, 29/10/2026)
var fatia = function(s, c){ if(!ESPELHO[c]) return s[c]; var o = {}; ESPELHO[c].forEach(function(k){ if(s[k]!==undefined) o[k] = s[k]; }); return o; };
function modulosLigados(){
  var t = ""; try { t = localStorage.getItem("sorelly_modulos") || ""; } catch(x){}
  if(!t) t = String((process.env.NEXT_PUBLIC_MODULOS_SERVIDOR) || "");
  var l = t.split(",").map(function(x){ return x.trim(); }).filter(Boolean);
  return l.length ? l : PADRAO;
}
// O SERVIDOR SEMPRE MANDA (Leonardo, 06/11/2026): todo perfil, inclusive a Diretoria, sincroniza assim que entra.
// Acabou a escolha "Este navegador manda / Do servidor" da Diretoria, que pausava tudo até alguém escolher (e escondia os registros do app da representante).
// A marca antiga dessa escolha sai do navegador ao carregar.
try { localStorage.removeItem("sorelly_sync_modo"); } catch(x){}
var json =function(v){ try { return JSON.stringify(v===undefined ? null : v); } catch(x){ return ""; } };

// O QUE JÁ ESTÁ NO SERVIDOR NÃO É GUARDADO NO NAVEGADOR (Marcus, 02/11/2026): o sistema salva para todo mundo no servidor. O navegador guardava o estado inteiro (4 MB) e acabava o espaço ("Sem espaço para salvar neste navegador").
// Um módulo só sai do navegador depois que o servidor confirmou que tem uma versão dele (versao>0); módulo sem acesso, vazio ou ainda sem carga inicial continua guardado aqui. A lista dura enquanto a mesma pessoa está logada.
// o app de Kits novos (kits-novos/lib/bridge-montagem.js e entrada-cadastro.js) lê estes módulos direto do estado no navegador: continuam guardados aqui (kn, agend, cl e ri)
var FICAM_NO_NAVEGADOR = ["kn", "agend", "cl", "ri"];
var CHAVE_NO_SERVIDOR = "sorelly_modulos_no_servidor", noServidor = {};
var chaveSessao = function(){ return String(token() || "").slice(-16); };
function lembraModulo(c){ if(noServidor[c]) return; noServidor[c] = 1; try { localStorage.setItem(CHAVE_NO_SERVIDOR, chaveSessao()+"|"+Object.keys(noServidor).join(",")); } catch(x){} }
function esqueceModulos(){ noServidor = {}; try { localStorage.removeItem(CHAVE_NO_SERVIDOR); } catch(x){} }
// chaves do estado que o servidor já guarda (módulos confirmados, com o espelho de ri, sc e fd)
function chavesNoServidor(){
  if(!apiAtiva() || !token()) return [];
  var lista = Object.assign({}, noServidor);
  try { var p = (localStorage.getItem(CHAVE_NO_SERVIDOR) || "").split("|"); if(p[0]===chaveSessao() && p[1]) p[1].split(",").forEach(function(k){ lista[k] = 1; }); } catch(x){}
  var out = []; Object.keys(lista).forEach(function(c){ if(FICAM_NO_NAVEGADOR.indexOf(c)>=0) return; (ESPELHO[c] || [c]).forEach(function(k){ out.push(k); }); }); return out;
}
function semDoServidor(st){ var ks = chavesNoServidor(); if(!ks.length || !st) return st; var o = Object.assign({}, st); ks.forEach(function(k){ delete o[k]; }); return o; }
// todas as chaves que podem faltar no estado salvo (a tela completa com o padrão ao abrir)
var CHAVES_SINCRONIZADAS = (function(){ var o = []; PADRAO.forEach(function(c){ (ESPELHO[c] || [c]).forEach(function(k){ o.push(k); }); }); return o; })();

// s = estado; d = dispatch (a ação SYNC_MODULO troca as chaves vindas do servidor)
function useSyncModulos(s, d){
  var tk = token();   // muda no login e na saída
  useEffect(function(){ if(!apiAtiva() || !tk) esqueceModulos(); }, [tk]);
  var modo = apiAtiva() && tk ? "servidor" : null;   // com servidor e login, sincroniza sempre
  var ativo = !!modo && s.logado!==false;
  var ref = useRef({mods:{}, s:s});   // por módulo: {versao, snaps:{chave: json}, pronto}
  ref.current.s = s;
  var lista = modulosLigados();
  var puxar = function(chave){
    var m = ref.current.mods[chave] || (ref.current.mods[chave] = {versao:0, snaps:{}, pronto:false});
    if(m.semAcesso) return Promise.resolve();   // o servidor já disse que este setor não abre este módulo
    return chamar("GET", "/estado/"+chave+(m.pronto && m.versao>0 ? "?desde="+m.versao : "")).then(function(r){
      if(r.igual) return undefined;   // nada novo no servidor
      var trouxe = false;
      // r.parcial = módulo por item (rpo/rpf): veio só o que mudou, inclusive gravação atrasada com versão menor; sempre processa (compara pelo conteúdo)
      if(r.versao>m.versao || !m.pronto || r.parcial){
        var novas = {}, local = fatia(ref.current.s, chave) || {};
        Object.keys(r.conteudo||{}).forEach(function(k){ var j = json(r.conteudo[k]); m.snaps[k] = j; if(json(local[k])!==j) novas[k] = r.conteudo[k]; });
        if(Object.keys(novas).length){ d({type:"SYNC_MODULO", chave:chave, conteudo:novas}); trouxe = true; }
        m.versao = r.versao; if(r.versao>0) m.bloqueado = false;
      }
      m.pronto = true; if(m.versao>0 && !m.semAcesso) lembraModulo(chave);
      // se trouxe dados novos, o envio fica para depois que a tela atualizar (senão o valor antigo do navegador voltaria por cima); servidor vazio: sobe o que está aqui
      return trouxe ? undefined : empurrar(chave);
    }).catch(function(x){ if(/não tem acesso/.test(x.message||"")) m.semAcesso = true; });
  };
  var empurrar = function(chave){
    var m = ref.current.mods[chave]; if(!m || !m.pronto || m.bloqueado || m.semAcesso) return Promise.resolve();
    var atual = fatia(ref.current.s, chave) || {}, mudou = {}, n = 0;
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
  var assinatura = lista.map(function(c){ return json(fatia(s, c)); }).join("|");
  useEffect(function(){
    if(!ativo) return;
    var t = setTimeout(function(){ lista.forEach(empurrar); }, 1000); return function(){ clearTimeout(t); };
  }, [ativo, assinatura]);
  return modo;
}
export { semDoServidor, CHAVES_SINCRONIZADAS, useSyncModulos, modulosLigados };
