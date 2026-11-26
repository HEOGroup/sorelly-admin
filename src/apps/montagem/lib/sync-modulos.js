// Sorelly Admin · montagem — lib/sync-modulos.js
// Mantém os módulos escolhidos iguais no servidor (tabela estado_modulo): a cada 20 s busca o que mudou e, 1 s depois de mexer, envia só as chaves que mudaram.
// Só funciona com servidor ligado e pessoa logada (lib/api.js). Módulo ainda vazio no servidor: o que está no navegador de quem abrir primeiro sobe como ponto de partida.
// Quais módulos: variável VITE_MODULOS_SERVIDOR (ex.: "rh,cf") ou, para testar, localStorage "sorelly_modulos". Por padrão todos (cada pessoa só recebe os que o servidor libera para o setor dela).
import { apiAtiva, chamar, pessoaDaConta, token } from "@/apps/montagem/lib/api";
import { inadFatia } from "@/apps/montagem/domain/inadimplencia";
import { useEffect, useRef, useState } from "@/shared/react";
import { diff, aplicar } from "@/apps/montagem/lib/estado-patch";
import { abaVisivel } from "@/apps/montagem/lib/aba-visivel";

// todos os módulos que têm estado próprio; o servidor devolve 403 para os que a pessoa não pode abrir (ignorado em silêncio)
var PADRAO = ["nav", "rh", "eq", "cf", "ff", "ce", "pf", "cp", "px", "lp", "agend", "av", "cl", "ind", "pk", "pr", "ex", "er", "cpc", "mk", "tp", "fc", "gr", "revdia", "fatdia", "fd", "inicio", "chathor", "ri", "pfmes", "sc", "mel", "kn", "rhsol", "lst", "es", "pag", "int", "aci", "rpo", "rpf", "fx", "inad", "mod", "rc", "jp", "mr", "sg", "cpe", "dpc", "comis"];   // comis = comissões das representantes (23/11/2026): percentuais, datas, gasolina, km e os pagamentos lançados pelo Financeiro; antes ficava só no navegador de quem lançou   // cpe = Contas a pagar (baixas, CNPJ trocado, marca Empresa/Família, contas à mão) e dpc = configuração do Direcionar (contas fixas das representantes, regras, valor fora do normal): passaram a ficar no servidor em 18/11/2026; antes cada pessoa só via o que ela mesma lançava   // jp = Pagamento em joias (17/11/2026)   // es = Estoque Sorelly (Financeiro; 09/11/2026: passou a ficar no servidor, antes só no navegador)  // fx = Fiscal (notas de entrada, saídas, contas por CNPJ): passou a ficar no servidor em 09/11/2026   // cpe = Contas a pagar (baixas, CNPJ trocado, marca Empresa/Família, contas à mão) e dpc = configuração do Direcionar (contas fixas das representantes, regras, valor fora do normal): passaram a ficar no servidor em 18/11/2026; antes cada pessoa só via o que ela mesma lançava   // jp = Pagamento em joias (17/11/2026)   // es = Estoque Sorelly (Financeiro; 09/11/2026: passou a ficar no servidor, antes só no navegador)  // fx = Fiscal (notas de entrada, saídas, contas por CNPJ): passou a ficar no servidor em 09/11/2026
// módulos que não têm objeto próprio no estado: a fatia é montada com chaves de primeiro nível (ri = revendedoras do atendimento interno, s.revInternas)
var ESPELHO = {lst:["listagens", "kits"], ri:["revInternas", "comissaoFunc"], sc:["saldosContas"], rc:["prataRev"], fd:["faturamentoDiario", "contasPagasDiario", "fatHoje", "fechaMes", "metaMensal", "contasPagar", "contasPagarEm", "metaPct", "contasPrevDia"]};   // contasPrevDia = total de contas do mês como estava em cada dia (Marcus, 23/11/2026). fd = faturamento e contas pagas por dia (lançados pela equipe do Financeiro; corte do admin antigo, 29/10/2026)
// pag = pedidos de conta (09/11/2026, Marcus: "não é só o Lucas, é todo o Financeiro"): uma chave por pedido, assim duas pessoas mexendo ao mesmo tempo não apagam uma a outra.
// lf_<id> = lançamento do Controle de pagamentos (s.lancFin: atendimento interno, representante, cobrança); dp_<id> = pedido da fila do Direcionar (s.dp.pix). Pedidos de teste (demo) nunca sobem.
// Pedido apagado vai como null (empurrar), e quem recebe null tira o pedido (reducer SYNC_MODULO "pag").
function fatiaPag(s){ var o = {}; (s.lancFin||[]).forEach(function(x){ if(x && x.id && !x.demo) o["lf_"+x.id] = x; }); ((s.dp && s.dp.pix)||[]).forEach(function(x){ if(x && x.id && !x.demo && (x.internoId || x.pid)) o["dp_"+x.id] = x; }); ((s.dp && s.dp.kits)||[]).forEach(function(x){ if(x && x.id && x.internoId) o["kp_"+x.id] = x; }); return o; }   // pedido de verdade tem internoId (atendimento interno) ou pid (pagamento da representante); os de teste não têm
// int = atendimentos do Atendimento interno (10/11/2026, Marcus: "a menina está atendendo e no meu não aparece"): uma chave por atendimento (i_<id>), só dos últimos 3 dias e sem os de demonstração.
// Quem tira o atendimento da lista (INT_REMOVER) apaga para todos; atendimento que só ficou velho demais NÃO é apagado do servidor (confere pelo id em s.internos).
// aci = registros de acerto do atendimento interno (10/11/2026, Marcus: "porque não gerou o consolidado também?"): o Consolidado Sorelly lê internos (int), pagamentos (pag) e o registro do acerto (vendas, comissão, brinde, peças, assinatura). Uma chave por acerto (a_<id>), só os reais de 09/11 em diante.
// cpe: o histórico não tinha id em cada linha; aqui cada linha ganha um id fixo (pela hora, ação e conta) para o servidor gravar linha por linha e duas pessoas não se apagarem
var idHist = function(x){ return "h"+(x.ts||0)+"-"+String(x.acao||"").length+"-"+String(x.chave||"").slice(-12); };
function fatiaCpe(s){ if(!s.cpe) return undefined; var h = s.cpe.hist; if(!Array.isArray(h) || h.every(function(x){ return x && x.id; })) return s.cpe; return Object.assign({}, s.cpe, {hist:h.map(function(x){ return x && !x.id ? Object.assign({id:idHist(x)}, x) : x; })}); }
// dpc: só a CONFIGURAÇÃO do Direcionar (a fila de pedidos segue no módulo pag)
var CHAVES_DPC = ["contasRep", "contasRepExtra", "regras", "limiteAlto", "limite3000", "maqV"];
function fatiaDpc(s){ if(!s.dp) return undefined; var o = {}; CHAVES_DPC.forEach(function(k){ if(s.dp[k]!==undefined) o[k] = s.dp[k]; }); return o; }
// 25/11/2026 (Nickolas, "Sem espaço para salvar neste navegador"): sobem TODOS os acertos de verdade (antes só os do atendimento interno de 09/11 em diante).
// Os antigos e os de representante estavam só nos navegadores; agora ficam no banco, juntos no Consolidado. Demonstração nunca sobe.
function fatiaAci(s){ var o = {}; (s.acertosConsignado||[]).forEach(function(x){ if(x && x.id && !x.demo) o["a_"+x.id] = x; }); return o; }
function fatiaInt(s){ var o = {}, corte = new Date(Date.now()-2*86400000).toISOString().slice(0, 10); (s.internos||[]).forEach(function(x){ if(x && x.id && !x.demo && !x.demoHoje && x.data && x.data>=corte) o["i_"+x.id] = x; }); return o; }
// fc = Fotos de catálogo (10/11/2026, 17 mil códigos): uma chave por código (c_<código>) e m = histórico/categorias/semeado. Assim duas pessoas marcando códigos diferentes não se apagam, e cada clique envia só o código mexido.
// A lista de 17 mil é montada uma vez por versão do s.fc (cache pela identidade do objeto), senão cada tecla digitada em qualquer tela refaria tudo.
var CACHE_FC = new WeakMap(), SIG_FC = new WeakMap(), N_FC = 0;
function fatiaFc(s){
  if(!s.fc) return {}; var c = CACHE_FC.get(s.fc); if(c) return c;
  var o = {m:{historico:s.fc.historico||[], categorias:s.fc.categorias||[], semeado:!!s.fc.semeado}}; (s.fc.codigos||[]).forEach(function(x){ if(x && x.cod) o["c_"+x.cod] = x; });
  CACHE_FC.set(s.fc, o); return o;
}
// inad = setor de Inadimplência (11/11/2026, cerca de 3 mil registros): d_ dívida, p_ pagamento, n_ Serasa, k_ kit em atraso, m = configuração. A fatia vem pronta (com cache) de domain/inadimplencia.js.
var SIG_IN = new WeakMap(), N_IN = 0;
function sigInad(s){ if(!s.inad) return ""; var i = SIG_IN.get(s.inad); if(i===undefined){ i = ++N_IN; SIG_IN.set(s.inad, i); } return "inad#"+i; }
function sigFc(s){ if(!s.fc) return ""; var i = SIG_FC.get(s.fc); if(i===undefined){ i = ++N_FC; SIG_FC.set(s.fc, i); } return "fc#"+i; }
// MÓDULO "nav" (25/11/2026, Nickolas: "sempre banco de dados, nunca no navegador"): TUDO o que ainda não tinha módulo e ficava só no navegador
// (atendimentos antigos, perfis, alertas, regras do consignado, formas de pagamento, autorizações, rotina, folders, cfg...). Uma chave do banco por chave do estado.
// Ficam de fora: o que já tem módulo próprio, o estado da TELA (aba aberta, usuário...) e o que é do aparelho/da pessoa (FORA_DO_NAV, vai para as preferências na fase 4).
var TELA = ["aba", "celular", "telaCel", "abertas", "kitAberto", "filtroReg", "aviso", "intAbas", "intSel", "visao", "logado", "usuario"];
var FORA_DO_NAV = ["dp", "visaoMenu", "bipadora", "filaNivel", "filaSimulada", "breveNome", "confBip", "errosBipagem"];   // dp: a fila vai por "pag" e a configuração por "dpc"
var OUTRAS = null, NAV_KEYS = [];
function chavesDeOutros(){ if(!OUTRAS){ OUTRAS = {}; PADRAO.forEach(function(c){ if(c==="nav") return; (ESPELHO[c] || [c]).forEach(function(k){ OUTRAS[k] = 1; }); }); ["lancFin", "acertosConsignado", "internosSrv"].forEach(function(k){ OUTRAS[k] = 1; }); } return OUTRAS; }
function fatiaNav(s){ var o = {}, fora = chavesDeOutros(); Object.keys(s || {}).forEach(function(k){ var v = s[k]; if(fora[k] || TELA.indexOf(k)>=0 || FORA_DO_NAV.indexOf(k)>=0 || v===undefined || typeof v==="function") return; o[k] = v; }); NAV_KEYS = Object.keys(o); return o; }
// primeira leitura do "nav" neste navegador: o que o banco tem vale, MAS item de lista (com id) que só existe aqui é mantido e sobe (nada criado aqui depois da cópia de segurança se perde)
function juntaPrimeira(srv, local){
  if(!Array.isArray(srv) || !Array.isArray(local) || !local.some(function(x){ return x && x.id!==undefined; })) return srv;
  var ids = {}; srv.forEach(function(x){ if(x && x.id!==undefined) ids[String(x.id)] = 1; });
  var so = local.filter(function(x){ return x && x.id!==undefined && !ids[String(x.id)]; });
  return so.length ? srv.concat(so) : srv;
}
var fatia = function(s, c){ if(c==="nav") return fatiaNav(s); if(c==="cpe") return fatiaCpe(s); if(c==="dpc") return fatiaDpc(s); if(c==="fc") return fatiaFc(s); if(c==="inad") return inadFatia(s.inad); if(c==="aci") return fatiaAci(s); if(c==="int") return fatiaInt(s); if(c==="pag") return fatiaPag(s); if(!ESPELHO[c]) return s[c]; var o = {}; ESPELHO[c].forEach(function(k){ if(s[k]!==undefined) o[k] = s[k]; }); return o; };
function modulosLigados(){
  var t = ""; try { t = localStorage.getItem("sorelly_modulos") || ""; } catch(x){}
  if(!t) t = String((process.env.NEXT_PUBLIC_MODULOS_SERVIDOR) || "");
  var l = t.split(",").map(function(x){ return x.trim(); }).filter(Boolean);
  // Indicações ao vivo (19/11/2026): com servidor e login, s.ind vem de /api/indicacoes/estado (app + banco, lib/indicacoes-servidor.js); a cópia de 17/11 no módulo "ind" não sincroniza mais
  return (l.length ? l : PADRAO).filter(function(c){ return c!=="ind"; });
}
// O SERVIDOR SEMPRE MANDA (Leonardo, 06/11/2026): todo perfil, inclusive a Diretoria, sincroniza assim que entra.
// Acabou a escolha "Este navegador manda / Do servidor" da Diretoria, que pausava tudo até alguém escolher (e escondia os registros do app da representante).
// A marca antiga dessa escolha sai do navegador ao carregar.
try { localStorage.removeItem("sorelly_sync_modo"); } catch(x){}
// GRAVAÇÃO POR DIFERENÇA (11/11/2026, lib/estado-patch.js): a tela manda só o que mudou e o servidor aplica no que está guardado.
// Fica de fora quem já grava um registro por chave (fc, inad, pag, int, aci) e os módulos por item do app (rpo, rpf): esses seguem mandando as chaves.
var POR_CHAVE = ["fc", "inad", "pag", "int", "aci", "rpo", "rpf"];
var ehPorDiferenca = function(c){ return POR_CHAVE.indexOf(c)<0; };
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
  var out = []; Object.keys(lista).forEach(function(c){ if(FICAM_NO_NAVEGADOR.indexOf(c)>=0) return; if(c==="nav"){ NAV_KEYS.forEach(function(k){ out.push(k); }); return; } (ESPELHO[c] || [c]).forEach(function(k){ out.push(k); }); }); return out;
}
// NAVEGADOR LEVE (25/11/2026, Nickolas): pagamentos (s.lancFin) e acertos (s.acertosConsignado) têm as FOTOS dos comprovantes e as ASSINATURAS e enchiam o navegador (~6 MB).
// Cada item que o banco já confirmou (igual ao que está lá, SNAPS = a última versão vista/enviada de cada chave) NÃO é mais guardado no navegador: ao abrir, vem do banco.
// Só fica guardado o que ainda não chegou ao banco (lançado sem internet, ou mudado e ainda não enviado). Assim nada se perde e o espaço não acaba.
var SNAPS = {};
// CONTA SÓ NO BANCO (25/11/2026, Nickolas: "só da minha conta, não salvar mais no navegador, salvar no banco"): nestas contas (pessoaId) o estado NÃO é guardado no navegador.
// Ao abrir, tudo vem do banco. A cópia antiga é apagada só quando o banco confirmou tudo (tudoNoBanco). Fechar a aba com algo ainda não enviado mostra o aviso do navegador.
var CONTAS_SO_BANCO = ["17"];   // 17 = Nickolas
function soBanco(){ return apiAtiva() && !!token() && CONTAS_SO_BANCO.indexOf(String(pessoaDaConta()))>=0; }
// havia cópia do estado neste navegador ao abrir? (sem cópia, o estado começa do padrão do código e NADA dele pode subir como item "só daqui")
var TEM_COPIA = (function(){ try { return !!localStorage.getItem("sorelly_montagem_v9"); } catch(x){ return false; } })();
var VIVO = null;   // o hook de sincronização aberto (mods + estado atual)
// o banco (jsonb) devolve os campos em outra ordem: igual = mesmo conteúdo, qualquer ordem dos campos
function canonico(v){ if(Array.isArray(v)) return v.map(canonico); if(v && typeof v==="object"){ var o = {}; Object.keys(v).sort().forEach(function(k){ o[k] = canonico(v[k]); }); return o; } return v; }
function mesmaOrdemLivre(a, b){ if(a===undefined || b===undefined) return false; try { return JSON.stringify(canonico(JSON.parse(a)))===JSON.stringify(canonico(JSON.parse(b))); } catch(x){ return false; } }
// true = todos os módulos leram o banco e nada da tela ficou sem enviar; window.__sorellyPendentes lista o que falta (para conferir)
function tudoNoBanco(){
  var r = VIVO, falta = []; if(!r || !r.s) return false;
  modulosLigados().forEach(function(c){ var m = r.mods[c]; if(!m){ falta.push(c+":sem leitura"); return; } if(m.semAcesso) return; if(!m.pronto || m.enviando || m.bloqueado){ falta.push(c+":"+(m.pronto ? "enviando" : "lendo")); return; }
    var at = fatia(r.s, c) || {}; Object.keys(at).forEach(function(k){ var j = json(at[k]); if(j!==m.snaps[k] && !mesmaOrdemLivre(j, m.snaps[k])) falta.push(c+"."+k); }); });
  try { window.__sorellyPendentes = falta; } catch(x){}
  return !falta.length;
}
var LEVES = [["pag", "lancFin", "lf_"], ["aci", "acertosConsignado", "a_"]];
function soNaoConfirmados(st, snaps){
  var o = st;
  LEVES.forEach(function(x){ var sn = snaps[x[0]], lista = st[x[1]]; if(!sn || !Array.isArray(lista)) return;
    var fica = lista.filter(function(it){ return !(it && it.id && sn[x[2]+it.id]!==undefined && sn[x[2]+it.id]===json(it)); });
    if(fica.length!==lista.length){ if(o===st) o = Object.assign({}, st); o[x[1]] = fica; } });
  return o;
}
function semDoServidor(st){ if(!st) return st; var ks = chavesNoServidor(), o = st; if(ks.length){ o = Object.assign({}, st); ks.forEach(function(k){ delete o[k]; }); } return soNaoConfirmados(o, SNAPS); }
// todas as chaves que podem faltar no estado salvo (a tela completa com o padrão ao abrir)
var CHAVES_SINCRONIZADAS = (function(){ var o = []; PADRAO.forEach(function(c){ (ESPELHO[c] || [c]).forEach(function(k){ o.push(k); }); }); return o; })();

// Versão nova no ar (10/11/2026, Marcus: "é pra sair em tempo real"): a tela aberta desde antes de uma publicação roda o código antigo e NÃO manda os dados novos (ex.: atendimentos).
// A versão do sistema que está no ar vem de /api/saude; se for diferente da versão desta tela, aparece o aviso "Atualizar agora". NEXT_PUBLIC_BUILD é gravado na hora do build (vazio no computador de teste: sem aviso).
function mostraAvisoVersao(){
  if(document.getElementById("aviso-versao")) return;
  // 16/11/2026 (Edna, Emilli: o navegador ficou com a versão antiga e ela não viu o botão novo): o aviso fica no TOPO, impossível de perder.
  // 25/11/2026 (Marcus): um botão só, de ponta a ponta no topo: "Nova atualização" e, menor, "Nada será perdido, pode atualizar a qualquer momento." (o rascunho do acerto volta sozinho depois de atualizar)
  var b = document.createElement("button"); b.id = "aviso-versao"; b.type = "button"; b.setAttribute("role", "alert");
  var t1 = document.createElement("span"); t1.textContent = "Nova atualização"; t1.style.cssText = "display:block;font:800 16px/1.3 Inter,system-ui,sans-serif";
  var t2 = document.createElement("span"); t2.textContent = "Nada será perdido, pode atualizar a qualquer momento."; t2.style.cssText = "display:block;margin-top:2px;font:500 13px/1.3 Inter,system-ui,sans-serif";
  b.appendChild(t1); b.appendChild(t2);
  b.style.cssText = "position:fixed;left:0;right:0;top:0;z-index:2147483000;padding:12px 16px;border:0;border-bottom:2px solid #1F1B12;border-radius:0;background:#D6B25C;color:#1F1B12;text-align:center;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.3)";
  // atualiza de verdade: limpa o cache guardado pelo navegador e abre de novo com um carimbo novo no endereço
  b.onclick = function(){ var fim = function(){ try{ var u = new URL(location.href); u.searchParams.set("v", String(Date.now())); location.replace(u.toString()); }catch(x){ location.reload(); } }; try{ var ps = []; if(window.caches && caches.keys) ps.push(caches.keys().then(function(ks){ return Promise.all(ks.map(function(k){ return caches.delete(k); })); })); if(navigator.serviceWorker && navigator.serviceWorker.getRegistrations) ps.push(navigator.serviceWorker.getRegistrations().then(function(rs){ return Promise.all(rs.map(function(r){ return r.unregister(); })); })); Promise.all(ps).then(fim, fim); }catch(x){ fim(); } };
  document.body.appendChild(b);
}
function vigiaVersao(){
  var minha = String(process.env.NEXT_PUBLIC_BUILD || ""); if(!minha) return undefined;
  var vivo = true, checa = function(){ if(!abaVisivel()) return; fetch("/api/saude", {cache:"no-store"}).then(function(r){ return r.json(); }).then(function(j){ if(vivo && j && j.versao && j.versao!==minha) mostraAvisoVersao(); }).catch(function(){}); };
  checa(); var iv = setInterval(checa, 30000); var vis = function(){ if(abaVisivel()) checa(); }; document.addEventListener("visibilitychange", vis); return function(){ vivo = false; clearInterval(iv); document.removeEventListener("visibilitychange", vis); };
}
// s = estado; d = dispatch (a ação SYNC_MODULO troca as chaves vindas do servidor)
function useSyncModulos(s, d){
  var tk = token();   // muda no login e na saída
  useEffect(function(){ if(!apiAtiva() || !tk) esqueceModulos(); }, [tk]);
  var modo = apiAtiva() && tk ? "servidor" : null;   // com servidor e login, sincroniza sempre
  var ativo = !!modo && s.logado!==false;
  var ref = useRef({mods:{}, s:s});   // por módulo: {versao, snaps:{chave: json}, pronto}
  ref.current.s = s; VIVO = ref.current;
  var lista = modulosLigados();
  var mod = function(c){ if(!ref.current.mods[c]){ ref.current.mods[c] = {versao:0, snaps:{}, pronto:false}; SNAPS[c] = ref.current.mods[c].snaps; } return ref.current.mods[c]; };   // SNAPS: o que o banco confirmou (navegador leve)
  // trata a resposta de UM módulo (vinda da leitura em lote)
  var receber = function(chave, r){
    var m = mod(chave);
    if(r.igual){ m.pronto = true; return; }   // nada novo no servidor
    var trouxe = false;
    // r.parcial = módulo por item (rpo/rpf): veio só o que mudou, inclusive gravação atrasada com versão menor; sempre processa (compara pelo conteúdo)
    if(r.versao>m.versao || !m.pronto || r.parcial){
      var novas = {}, local = fatia(ref.current.s, chave) || {}, porDif = ehPorDiferenca(chave);
      Object.keys(r.conteudo||{}).forEach(function(k){
        var v = r.conteudo[k], j = json(v), base = m.snaps[k], lj = json(local[k]);
        m.snaps[k] = j;
        if(chave==="nav" && !m.pronto && TEM_COPIA) v = juntaPrimeira(v, local[k]);   // módulo nav: na 1ª leitura, item que só existe aqui fica e sobe
        if(lj===j || (lj!==undefined && lj.length===j.length && mesmaOrdemLivre(lj, j))){ if(lj!==undefined && lj!==j) m.snaps[k] = lj; return; }   // mesmo conteúdo, outra ordem dos campos: nada muda
        // MUDANÇA AINDA NÃO ENVIADA (11/11/2026): a tela mexeu nesta chave e ainda não mandou. Antes o que vinha do servidor trocava tudo e o lançamento sumia.
        // Agora a mudança local é reaplicada em cima do que veio (a diferença entre a base e o que a tela tem) e segue para o servidor no próximo envio.
        if(porDif && m.pronto && base!==undefined && lj!==base){
          try { v = aplicar(v, diff(JSON.parse(base), JSON.parse(lj))); } catch(x){}
          if(json(v)===lj) return;
        }
        novas[k] = v;
      });
      if(Object.keys(novas).length){ d({type:"SYNC_MODULO", chave:chave, conteudo:novas}); m.aguarda = ref.current.s; trouxe = true; }
      m.versao = r.versao; if(r.versao>0) m.bloqueado = false;
    }
    m.pronto = true; if(m.versao>0 && !m.semAcesso) lembraModulo(chave);
    // se trouxe dados novos, o envio fica para depois que a tela atualizar (senão o valor antigo do navegador voltaria por cima); servidor vazio: sobe o que está aqui
    if(!trouxe) empurrar(chave);
  };
  // LEITURA EM LOTE (11/11/2026): uma chamada para todos os módulos (antes, uma por módulo: ~40 chamadas a cada 20 s por aba aberta, cobradas pela Vercel)
  var puxar = function(chaves){
    var pedir = chaves.filter(function(c){ var m = mod(c); return !m.semAcesso && !m.lendo; });
    if(!pedir.length) return Promise.resolve();
    pedir.forEach(function(c){ mod(c).lendo = true; });
    var q = pedir.map(function(c){ var m = mod(c); return c+"."+(m.pronto && m.versao>0 ? m.versao : 0); }).join(",");
    return chamar("GET", "/estado?m="+q).then(function(r){
      (r.semAcesso||[]).forEach(function(c){ mod(c).semAcesso = true; });
      pedir.forEach(function(c){ mod(c).lendo = false; var x = (r.modulos||{})[c]; if(x) receber(c, x); });
    }).catch(function(){ pedir.forEach(function(c){ mod(c).lendo = false; }); });
  };
  var empurrar = function(chave){
    var m = ref.current.mods[chave]; if(!m || !m.pronto || m.bloqueado || m.semAcesso) return Promise.resolve();
    if(m.aguarda){ if(m.aguarda===ref.current.s) return Promise.resolve(); m.aguarda = null; }   // o que veio do servidor ainda não entrou na tela: espera (senão o valor antigo voltaria)
    if(m.enviando){ m.deNovo = true; return Promise.resolve(); }   // um envio por vez por módulo
    if(chave==="fc" && m.ultFc===ref.current.s.fc) return Promise.resolve();   // nada mudou no s.fc desde a última conferência (evita refazer 17 mil comparações)
    if(chave==="inad" && m.ultInad===ref.current.s.inad) return Promise.resolve();   // nada mudou no s.inad desde a última conferência
    var fcAgora = ref.current.s.fc, inAgora = ref.current.s.inad, porDif = ehPorDiferenca(chave);
    var atual = fatia(ref.current.s, chave) || {}, mudou = {}, patches = {}, n = 0;
    Object.keys(atual).forEach(function(k){
      var j = json(atual[k]); if(j===m.snaps[k]) return;
      if(m.snaps[k]!==undefined && j.length===m.snaps[k].length && mesmaOrdemLivre(j, m.snaps[k])){ m.snaps[k] = j; return; }   // só a ordem dos campos mudou (o banco reordena): nada a gravar (Lucas, 26/11/2026)
      mudou[k] = atual[k]; n++;
      if(porDif){ var op = null; try { op = m.snaps[k]===undefined ? {$set:JSON.parse(j)} : diff(JSON.parse(m.snaps[k]), JSON.parse(j)); } catch(x){ op = {$set:atual[k]}; } if(op) patches[k] = op; }
    });
    if(chave==="fc") Object.keys(m.snaps).forEach(function(k){ if(k.indexOf("c_")===0 && !(k in atual) && m.snaps[k]!=="null"){ mudou[k] = null; n++; } });   // código excluído aqui: apaga para todos
    if(chave==="pag") Object.keys(m.snaps).forEach(function(k){ if(!(k in atual) && m.snaps[k]!=="null"){ mudou[k] = null; n++; } });
    if(chave==="int"){ var idsI = {}; (ref.current.s.internos||[]).forEach(function(x){ idsI[x.id] = 1; }); Object.keys(m.snaps).forEach(function(k){ if(!(k in atual) && m.snaps[k]!=="null" && !idsI[k.slice(2)]){ mudou[k] = null; n++; } }); }   // pedido apagado aqui: apaga para todos
    if(porDif && n && !Object.keys(patches).length){ Object.keys(mudou).forEach(function(k){ m.snaps[k] = json(mudou[k]); }); n = 0; }   // só mudou a ordem de uma lista: nada a gravar
    if(!n){ if(chave==="fc") m.ultFc = fcAgora; if(chave==="inad") m.ultInad = inAgora; return Promise.resolve(); }
    m.enviando = true;
    var vAntes = m.versao;
    return chamar("PUT", "/estado/"+chave, porDif ? {patches:patches} : {chaves:mudou}).then(function(r){
      Object.keys(mudou).forEach(function(k){ m.snaps[k] = json(mudou[k]); });
      // conta de representante (rpo/rpf): o servidor devolve o que recusou ou carimbou; a tela fica igual ao que vale lá (23/11/2026)
      if(r.devolver && Object.keys(r.devolver).length){ Object.keys(r.devolver).forEach(function(k){ m.snaps[k] = json(r.devolver[k]); }); d({type:"SYNC_MODULO", chave:chave, conteudo:r.devolver}); m.aguarda = ref.current.s; }
      if(r.avisos && r.avisos.length) d({type:"AVISO", txt:r.avisos.join(" "), tom:"alerta"});
      // só avança a versão se ninguém mais gravou no meio; senão a próxima leitura traz o módulo de novo (com o que a outra pessoa gravou)
      if(r.versao===vAntes+1 || !porDif) m.versao = r.versao;
      if(chave==="fc") m.ultFc = fcAgora; if(chave==="inad") m.ultInad = inAgora;
    }).catch(function(x){ if(/carga inicial/.test(x.message||"")) m.bloqueado = true; })   // módulo ainda sem carga inicial: só a Diretoria sobe; para de tentar até chegar dados do servidor
      .then(function(){ m.enviando = false; if(m.deNovo){ m.deNovo = false; empurrar(chave); } });
  };
  // busca ao entrar e a cada 20 s; aba escondida (outra aba, janela minimizada) NÃO busca e, ao voltar, busca na hora (11/11/2026: custo da Vercel)
  useEffect(function(){
    if(!ativo) return undefined;
    var vivo = true, tick = function(){ if(vivo && abaVisivel()) puxar(lista); }; tick();
    var iv = setInterval(tick, 20000), volta = function(){ if(abaVisivel()) tick(); };
    document.addEventListener("visibilitychange", volta);
    return function(){ vivo = false; clearInterval(iv); document.removeEventListener("visibilitychange", volta); };
  }, [ativo, lista.join(",")]);
  // tempo real (10/11/2026): atendimentos e pedidos de conta chegam em até 5 s; os outros módulos seguem a cada 20 s
  useEffect(function(){
    if(!ativo) return undefined;
    var vivo = true, rapidos = ["int", "pag"].filter(function(c){ return lista.indexOf(c)>=0; });
    var iv = setInterval(function(){ if(vivo && abaVisivel()) puxar(rapidos); }, 5000); return function(){ vivo = false; clearInterval(iv); };
  }, [ativo, lista.join(",")]);
  useEffect(function(){ if(!ativo) return undefined; return vigiaVersao(); }, [ativo]);
  // envia 1 s depois da última mudança
  var assinatura = lista.map(function(c){ return c==="fc" ? sigFc(s) : c==="inad" ? sigInad(s) : json(fatia(s, c)); }).join("|");
  useEffect(function(){
    if(!ativo) return undefined;
    var t = setTimeout(function(){ lista.forEach(empurrar); }, 1000); return function(){ clearTimeout(t); };
  }, [ativo, assinatura]);
  return modo;
}
export { semDoServidor, CHAVES_SINCRONIZADAS, useSyncModulos, modulosLigados, fatia as fatiaDoModulo, CHAVES_DPC, soNaoConfirmados, FORA_DO_NAV, TELA as TELA_DO_ESTADO, soBanco, tudoNoBanco };
