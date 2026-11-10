// Sorelly Admin · montagem — lib/sync-modulos.js
// Mantém os módulos escolhidos iguais no servidor (tabela estado_modulo): a cada 20 s busca o que mudou e, 1 s depois de mexer, envia só as chaves que mudaram.
// Só funciona com servidor ligado e pessoa logada (lib/api.js). Módulo ainda vazio no servidor: o que está no navegador de quem abrir primeiro sobe como ponto de partida.
// Quais módulos: variável VITE_MODULOS_SERVIDOR (ex.: "rh,cf") ou, para testar, localStorage "sorelly_modulos". Por padrão todos (cada pessoa só recebe os que o servidor libera para o setor dela).
import { apiAtiva, chamar, token } from "@/apps/montagem/lib/api";
import { useEffect, useRef, useState } from "@/shared/react";

// todos os módulos que têm estado próprio; o servidor devolve 403 para os que a pessoa não pode abrir (ignorado em silêncio)
var PADRAO = ["rh", "eq", "cf", "ff", "ce", "pf", "cp", "px", "lp", "agend", "av", "cl", "ind", "pk", "pr", "ex", "er", "cpc", "mk", "tp", "fc", "gr", "revdia", "fatdia", "fd", "inicio", "chathor", "ri", "pfmes", "sc", "mel", "kn", "rhsol", "lst", "es", "pag", "int", "rpo", "rpf", "fx"];   // es = Estoque Sorelly (Financeiro; 09/11/2026: passou a ficar no servidor, antes só no navegador)  // fx = Fiscal (notas de entrada, saídas, contas por CNPJ): passou a ficar no servidor em 09/11/2026
// módulos que não têm objeto próprio no estado: a fatia é montada com chaves de primeiro nível (ri = revendedoras do atendimento interno, s.revInternas)
var ESPELHO = {lst:["listagens", "kits"], ri:["revInternas"], sc:["saldosContas"], fd:["faturamentoDiario", "contasPagasDiario", "fatHoje", "fechaMes", "metaMensal", "contasPagar", "contasPagarEm", "metaPct"]};   // fd = faturamento e contas pagas por dia (lançados pela equipe do Financeiro; corte do admin antigo, 29/10/2026)
// pag = pedidos de conta (09/11/2026, Marcus: "não é só o Lucas, é todo o Financeiro"): uma chave por pedido, assim duas pessoas mexendo ao mesmo tempo não apagam uma a outra.
// lf_<id> = lançamento do Controle de pagamentos (s.lancFin: atendimento interno, representante, cobrança); dp_<id> = pedido da fila do Direcionar (s.dp.pix). Pedidos de teste (demo) nunca sobem.
// Pedido apagado vai como null (empurrar), e quem recebe null tira o pedido (reducer SYNC_MODULO "pag").
function fatiaPag(s){ var o = {}; (s.lancFin||[]).forEach(function(x){ if(x && x.id && !x.demo) o["lf_"+x.id] = x; }); ((s.dp && s.dp.pix)||[]).forEach(function(x){ if(x && x.id && !x.demo && (x.internoId || x.pid)) o["dp_"+x.id] = x; }); return o; }   // pedido de verdade tem internoId (atendimento interno) ou pid (pagamento da representante); os de teste não têm
// int = atendimentos do Atendimento interno (10/11/2026, Marcus: "a menina está atendendo e no meu não aparece"): uma chave por atendimento (i_<id>), só dos últimos 3 dias e sem os de demonstração.
// Quem tira o atendimento da lista (INT_REMOVER) apaga para todos; atendimento que só ficou velho demais NÃO é apagado do servidor (confere pelo id em s.internos).
function fatiaInt(s){ var o = {}, corte = new Date(Date.now()-2*86400000).toISOString().slice(0, 10); (s.internos||[]).forEach(function(x){ if(x && x.id && !x.demo && !x.demoHoje && x.data && x.data>=corte) o["i_"+x.id] = x; }); return o; }
// fc = Fotos de catálogo (10/11/2026, 17 mil códigos): uma chave por código (c_<código>) e m = histórico/categorias/semeado. Assim duas pessoas marcando códigos diferentes não se apagam, e cada clique envia só o código mexido.
// A lista de 17 mil é montada uma vez por versão do s.fc (cache pela identidade do objeto), senão cada tecla digitada em qualquer tela refaria tudo.
var CACHE_FC = new WeakMap(), SIG_FC = new WeakMap(), N_FC = 0;
function fatiaFc(s){
  if(!s.fc) return {}; var c = CACHE_FC.get(s.fc); if(c) return c;
  var o = {m:{historico:s.fc.historico||[], categorias:s.fc.categorias||[], semeado:!!s.fc.semeado}}; (s.fc.codigos||[]).forEach(function(x){ if(x && x.cod) o["c_"+x.cod] = x; });
  CACHE_FC.set(s.fc, o); return o;
}
function sigFc(s){ if(!s.fc) return ""; var i = SIG_FC.get(s.fc); if(i===undefined){ i = ++N_FC; SIG_FC.set(s.fc, i); } return "fc#"+i; }
var fatia = function(s, c){ if(c==="fc") return fatiaFc(s); if(c==="int") return fatiaInt(s); if(c==="pag") return fatiaPag(s); if(!ESPELHO[c]) return s[c]; var o = {}; ESPELHO[c].forEach(function(k){ if(s[k]!==undefined) o[k] = s[k]; }); return o; };
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

// Versão nova no ar (10/11/2026, Marcus: "é pra sair em tempo real"): a tela aberta desde antes de uma publicação roda o código antigo e NÃO manda os dados novos (ex.: atendimentos).
// A versão do sistema que está no ar vem de /api/saude; se for diferente da versão desta tela, aparece o aviso "Atualizar agora". NEXT_PUBLIC_BUILD é gravado na hora do build (vazio no computador de teste: sem aviso).
function mostraAvisoVersao(){
  if(document.getElementById("aviso-versao")) return;
  var d = document.createElement("div"); d.id = "aviso-versao"; d.setAttribute("role", "alert");
  d.style.cssText = "position:fixed;left:50%;bottom:56px;transform:translateX(-50%);z-index:70;display:flex;align-items:center;gap:12px;padding:8px 12px;border:1px solid #D6B25C;border-radius:8px;background:rgba(15,16,19,.97);color:#fff;font:13px Inter,system-ui,sans-serif";
  var t = document.createElement("span"); t.textContent = "Há uma versão nova do sistema. Atualize para ver tudo em tempo real."; d.appendChild(t);
  var b = document.createElement("button"); b.textContent = "Atualizar agora"; b.style.cssText = "height:32px;padding:0 12px;border-radius:8px;border:0;background:#D6B25C;color:#1F1B12;font:600 13px Inter,system-ui,sans-serif;cursor:pointer"; b.onclick = function(){ location.reload(); };
  d.appendChild(b); document.body.appendChild(d);
}
function vigiaVersao(){
  var minha = String(process.env.NEXT_PUBLIC_BUILD || ""); if(!minha) return undefined;
  var vivo = true, checa = function(){ fetch("/api/saude", {cache:"no-store"}).then(function(r){ return r.json(); }).then(function(j){ if(vivo && j && j.versao && j.versao!==minha) mostraAvisoVersao(); }).catch(function(){}); };
  checa(); var iv = setInterval(checa, 60000); return function(){ vivo = false; clearInterval(iv); };
}
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
    if(chave==="fc" && m.ultFc===ref.current.s.fc) return Promise.resolve();   // nada mudou no s.fc desde a última conferência (evita refazer 17 mil comparações)
    var fcAgora = ref.current.s.fc;
    var atual = fatia(ref.current.s, chave) || {}, mudou = {}, n = 0;
    Object.keys(atual).forEach(function(k){ var j = json(atual[k]); if(j!==m.snaps[k]){ mudou[k] = atual[k]; n++; } });
    if(chave==="fc") Object.keys(m.snaps).forEach(function(k){ if(k.indexOf("c_")===0 && !(k in atual) && m.snaps[k]!=="null"){ mudou[k] = null; n++; } });   // código excluído aqui: apaga para todos
    if(chave==="pag") Object.keys(m.snaps).forEach(function(k){ if(!(k in atual) && m.snaps[k]!=="null"){ mudou[k] = null; n++; } });
    if(chave==="int"){ var idsI = {}; (ref.current.s.internos||[]).forEach(function(x){ idsI[x.id] = 1; }); Object.keys(m.snaps).forEach(function(k){ if(!(k in atual) && m.snaps[k]!=="null" && !idsI[k.slice(2)]){ mudou[k] = null; n++; } }); }   // pedido apagado aqui: apaga para todos
    if(!n){ if(chave==="fc") m.ultFc = fcAgora; return Promise.resolve(); }
    return chamar("PUT", "/estado/"+chave, {chaves:mudou}).then(function(r){ Object.keys(mudou).forEach(function(k){ m.snaps[k] = json(mudou[k]); }); m.versao = r.versao; if(chave==="fc") m.ultFc = fcAgora; }).catch(function(x){ if(/carga inicial/.test(x.message||"")) m.bloqueado = true; });   // módulo ainda sem carga inicial: só a Diretoria sobe; para de tentar até chegar dados do servidor
  };
  // busca ao entrar e a cada 20 s
  useEffect(function(){
    if(!ativo) return;
    var vivo = true, tick = function(){ lista.forEach(function(c){ if(vivo) puxar(c); }); }; tick();
    var iv = setInterval(tick, 20000); return function(){ vivo = false; clearInterval(iv); };
  }, [ativo, lista.join(",")]);
  // tempo real (10/11/2026): atendimentos e pedidos de conta chegam em até 5 s; os outros módulos seguem a cada 20 s
  useEffect(function(){
    if(!ativo) return undefined;
    var vivo = true, rapidos = ["int", "pag"].filter(function(c){ return lista.indexOf(c)>=0; });
    var iv = setInterval(function(){ rapidos.forEach(function(c){ if(vivo) puxar(c); }); }, 5000); return function(){ vivo = false; clearInterval(iv); };
  }, [ativo, lista.join(",")]);
  useEffect(function(){ if(!ativo) return undefined; return vigiaVersao(); }, [ativo]);
  // envia 1 s depois da última mudança
  var assinatura = lista.map(function(c){ return c==="fc" ? sigFc(s) : json(fatia(s, c)); }).join("|");
  useEffect(function(){
    if(!ativo) return;
    var t = setTimeout(function(){ lista.forEach(empurrar); }, 1000); return function(){ clearTimeout(t); };
  }, [ativo, assinatura]);
  return modo;
}
export { semDoServidor, CHAVES_SINCRONIZADAS, useSyncModulos, modulosLigados };
