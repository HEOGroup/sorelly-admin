// Sorelly Admin · montagem — lib/sync-modulos.js
// Mantém os módulos escolhidos iguais no servidor (tabela estado_modulo): a cada 20 s busca o que mudou e, 1 s depois de mexer, envia só as chaves que mudaram.
// Só funciona com servidor ligado e pessoa logada (lib/api.js). Módulo ainda vazio no servidor: o que está no navegador de quem abrir primeiro sobe como ponto de partida.
// Quais módulos: variável VITE_MODULOS_SERVIDOR (ex.: "rh,cf") ou, para testar, localStorage "sorelly_modulos". Por padrão todos (cada pessoa só recebe os que o servidor libera para o setor dela).
import { apiAtiva, chamar, token } from "@/apps/montagem/lib/api";
import { useEffect, useRef, useState } from "@/shared/react";

// todos os módulos que têm estado próprio; o servidor devolve 403 para os que a pessoa não pode abrir (ignorado em silêncio)
var PADRAO = ["rh", "eq", "cf", "ff", "ce", "pf", "cp", "px", "lp", "agend", "av", "cl", "ind", "pk", "pr", "ex", "er", "cpc", "mk", "gr", "revdia", "fatdia", "inicio", "chathor", "ri", "pfmes", "sc", "mel", "kn"];
// módulos que não têm objeto próprio no estado: a fatia é montada com chaves de primeiro nível (ri = revendedoras do atendimento interno, s.revInternas)
var ESPELHO = {ri:["revInternas"], sc:["saldosContas"]};
var fatia = function(s, c){ if(!ESPELHO[c]) return s[c]; var o = {}; ESPELHO[c].forEach(function(k){ if(s[k]!==undefined) o[k] = s[k]; }); return o; };
function modulosLigados(){
  var t = ""; try { t = localStorage.getItem("sorelly_modulos") || ""; } catch(x){}
  if(!t) t = String((process.env.NEXT_PUBLIC_MODULOS_SERVIDOR) || "");
  var l = t.split(",").map(function(x){ return x.trim(); }).filter(Boolean);
  return l.length ? l : PADRAO;
}
// Primeira vez de uma pessoa da Diretoria neste navegador: NADA é trocado até ela escolher quem manda (o que está neste navegador ou o que está no servidor).
// Isso protege o que foi digitado aqui antes do login. Os demais perfis já começam recebendo o servidor.
var CHAVE_MODO = "sorelly_sync_modo";
function modoGuardado(){ try { return localStorage.getItem(CHAVE_MODO) || ""; } catch(x){ return ""; } }
function guardaModo(m){ try { localStorage.setItem(CHAVE_MODO, m); } catch(x){} window.dispatchEvent(new Event("sorelly-sync-modo")); }
// Escolher "O servidor manda": ANTES de trocar, guarda uma cópia do que está neste navegador (a tela salva tudo que aparece, então sem cópia o que foi digitado aqui seria sobrescrito).
var CHAVE_ESTADO = "sorelly_montagem_v9", CHAVE_COPIA = "sorelly_copia_antes_servidor";
function usarServidor(){
  try { if(!localStorage.getItem(CHAVE_COPIA)){ var atual = localStorage.getItem(CHAVE_ESTADO); if(atual){ localStorage.setItem(CHAVE_COPIA, atual); localStorage.setItem(CHAVE_COPIA+"_em", new Date().toISOString()); } } } catch(x){}
  guardaModo("servidor");
}
// volta a mostrar a pergunta "qual cópia dos dados vale?" (a sincronização pausa até a escolha)
function reabrirEscolha(){ try { localStorage.removeItem(CHAVE_MODO); } catch(x){} window.dispatchEvent(new Event("sorelly-sync-modo")); }
function temCopiaAntesServidor(){ try { return !!localStorage.getItem(CHAVE_COPIA); } catch(x){ return false; } }
// devolve para a tela o que estava neste navegador antes de usar o servidor (recarrega a página); depois a Diretoria escolhe de novo qual cópia vale
function restaurarCopiaAntesServidor(){
  try { var c = localStorage.getItem(CHAVE_COPIA); if(!c) return false; localStorage.setItem(CHAVE_ESTADO, c); localStorage.removeItem(CHAVE_MODO); location.reload(); return true; } catch(x){ return false; }
}
// "Este navegador manda": envia TODAS as chaves de cada módulo e substitui as do servidor (a cópia sorelly.estado_modulo_copia_20261026 guarda a versão anterior).
async function enviarTudoDoNavegador(s){
  var feitos = 0, falhas = [];
  for(var i=0;i<PADRAO.length;i++){ var c = PADRAO[i], v = fatia(s, c);
    if(!v || typeof v!=="object" || !Object.keys(v).length) continue;
    try { await chamar("PUT", "/estado/"+c, {chaves:v}); feitos++; } catch(x){ falhas.push(c+": "+x.message); } }
  if(!falhas.length) guardaModo("servidor");
  return {feitos:feitos, falhas:falhas};
}
var json = function(v){ try { return JSON.stringify(v===undefined ? null : v); } catch(x){ return ""; } };

// s = estado; d = dispatch (a ação SYNC_MODULO troca as chaves vindas do servidor)
function useSyncModulos(s, d){
  var sm = useState(null), modo = sm[0], setModo = sm[1];   // null = descobrindo, "servidor" = sincroniza, "pendente" = Diretoria ainda vai escolher
  var tk = token();   // muda no login e na saída: refaz a descoberta
  useEffect(function(){
    if(!apiAtiva() || !tk) { setModo(null); return undefined; }
    var ler = function(){ if(modoGuardado()){ setModo("servidor"); return; }
      chamar("GET", "/auth/eu").then(function(j){ setModo(j.usuario && j.usuario.perfil==="ADMIN" ? "pendente" : "servidor"); }).catch(function(){ setModo("pendente"); }); };
    ler(); window.addEventListener("sorelly-sync-modo", ler); return function(){ window.removeEventListener("sorelly-sync-modo", ler); };
  }, [tk]);
  var ativo = apiAtiva() && !!token() && s.logado!==false && modo==="servidor";
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
        var novas = {}, local = fatia(ref.current.s, chave) || {};
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
export { useSyncModulos, modulosLigados, enviarTudoDoNavegador, guardaModo, usarServidor, reabrirEscolha, temCopiaAntesServidor, restaurarCopiaAntesServidor };
