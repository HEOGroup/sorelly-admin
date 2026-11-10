// Sorelly Admin · montagem — domain/progresso.js
// Progresso do Marcus (09/11/2026): cronômetro de trabalho, pausas por motivo e treino do dia. Só no sistema Marcus.
// Guardado no navegador em "sorelly_progresso_v1". A conta é feita por HORA DE INÍCIO e FIM de cada trecho (não por contador),
// então fechar a aba ou o computador dormir não perde tempo.
import { useSyncExternalStore, useEffect } from "react";
import { apiAtiva, chamar, token } from "@/apps/montagem/lib/api";

var CHAVE = "sorelly_progresso_v1";
var MOTIVOS = [["fumar","Fumar"],["almocar","Almoçar"],["treinar","Treinar"],["parado","Parado"],["outro","Outro"]];
var MEMBROS = ["Peito","Costas","Ombros","Bíceps","Tríceps","Antebraço","Abdômen","Pernas","Glúteos","Panturrilha"];

function inicial(){ try { var t = localStorage.getItem(CHAVE); if(t){ var o = JSON.parse(t); if(o && o.dias) return o; } } catch(x){} return {dias:{}}; }
var estado = inicial(), ouvintes = [];
function salvar(){ try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch(x){} }
// cada dia que mudou ganha "em" (hora da última mudança): na sincronização com o servidor, o dia mais novo vence
function mudar(fn){ var antes = estado.dias, novo = {dias:Object.assign({}, antes)}; fn(novo); var agora = Date.now(); Object.keys(novo.dias).forEach(function(k){ if(novo.dias[k]!==antes[k]) novo.dias[k] = Object.assign({}, novo.dias[k], {em:agora}); }); estado = novo; salvar(); ouvintes.forEach(function(f){ f(); }); }
function useProgresso(){ return useSyncExternalStore(function(f){ ouvintes.push(f); return function(){ ouvintes = ouvintes.filter(function(x){ return x!==f; }); }; }, function(){ return estado; }, function(){ return {dias:{}}; }); }

function chaveDia(t){ var d = new Date(t==null ? Date.now() : t); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function diaVazio(){ return {inicio:null, fim:null, trechos:[], academia:null}; }
function dia(s, k){ return s.dias[k] || diaVazio(); }
function copia(d){ return Object.assign({}, d, {trechos:d.trechos.map(function(t){ return Object.assign({}, t); })}); }
function aberto(d){ for(var i=d.trechos.length-1; i>=0; i--) if(d.trechos[i].fim==null) return d.trechos[i]; return null; }

// fecha o trecho aberto (se houver) e abre outro
function trocar(k, tipo, agora, obs){
  mudar(function(n){ var d = copia(dia(n, k)); var a = aberto(d); if(a) a.fim = agora;
    if(tipo){ d.trechos.push({tipo:tipo, ini:agora, fim:null, obs:obs||""}); if(!d.inicio) d.inicio = agora; d.fim = null; }
    n.dias[k] = d; });
}
// se o dia anterior ficou aberto (esqueceu de encerrar), fecha no último momento conhecido: aqui, meia-noite do dia dele
function fecharAbertosAntigos(){
  var hoje = chaveDia(); var pend = Object.keys(estado.dias).filter(function(k){ return k<hoje && aberto(estado.dias[k]); });
  if(!pend.length) return;
  mudar(function(n){ pend.forEach(function(k){ var d = copia(n.dias[k]); var p = k.split("-"); var fimDia = new Date(+p[0], +p[1]-1, +p[2], 23, 59, 59).getTime(); var a = aberto(d); if(a) a.fim = Math.max(a.ini, fimDia); d.fim = a ? a.fim : d.fim; d.esqueceu = true; n.dias[k] = d; }); });
}
function comecarDia(agora){ trocar(chaveDia(agora), "trabalho", agora); }
function pausar(motivo, agora, obs){ trocar(chaveDia(agora), motivo, agora, obs); }
function voltar(agora){ trocar(chaveDia(agora), "trabalho", agora); }
function encerrarDia(agora){ var k = chaveDia(agora); mudar(function(n){ var d = copia(dia(n, k)); var a = aberto(d); if(a) a.fim = agora; d.fim = agora; n.dias[k] = d; }); }
function reabrirDia(agora){ trocar(chaveDia(agora), "trabalho", agora); }
// ajuste à mão: muda hora de início/fim de um trecho (esqueci de voltar do almoço)
function ajustarTrecho(k, i, ini, fim){ mudar(function(n){ var d = copia(dia(n, k)); var t = d.trechos[i]; if(!t) return; t.ini = ini; t.fim = fim; if(i===0 || !d.inicio) d.inicio = d.trechos[0].ini; n.dias[k] = d; }); }
function removerTrecho(k, i){ mudar(function(n){ var d = copia(dia(n, k)); d.trechos.splice(i, 1); d.inicio = d.trechos.length ? d.trechos[0].ini : null; n.dias[k] = d; }); }
// p = campos a mudar, ou função (academia atual) → campos; assim dois toques seguidos nunca perdem um ao outro
function setAcademia(k, p){ mudar(function(n){ var d = copia(dia(n, k)); var ac = Object.assign({fez:false, membros:[], correu:false, bola:false}, d.academia); d.academia = Object.assign({}, ac, typeof p==="function" ? p(ac) : p); n.dias[k] = d; }); }

// soma por tipo, em milissegundos; trecho aberto conta até "agora"
function somas(d, agora){ var r = {trabalho:0, fumar:0, almocar:0, treinar:0, parado:0, outro:0, vezes:{}}; d.trechos.forEach(function(t){ var fim = t.fim==null ? agora : t.fim; var ms = Math.max(0, fim - t.ini); r[t.tipo] = (r[t.tipo]||0) + ms; r.vezes[t.tipo] = (r.vezes[t.tipo]||0) + 1; }); r.pausas = r.fumar + r.almocar + r.treinar + r.parado + r.outro; return r; }
function hms(ms){ var s = Math.floor(Math.max(0, ms)/1000), h = Math.floor(s/3600), m = Math.floor(s%3600/60); return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")+":"+String(s%60).padStart(2,"0"); }
function hm(t){ if(t==null) return "—"; var d = new Date(t); return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"); }
function rotuloMotivo(k){ var m = MOTIVOS.filter(function(x){ return x[0]===k; })[0]; return k==="trabalho" ? "Trabalhando" : m ? m[1] : k; }
function dataBr(k){ var p = k.split("-"); return p[2]+"/"+p[1]+"/"+p[0]; }
// dias de um período: "hoje" | "semana" (segunda a domingo) | "mes"
function diasDoPeriodo(s, per, agora){ var d = new Date(agora), ini, fim; if(per==="semana"){ var dow = (d.getDay()+6)%7; ini = new Date(d.getFullYear(), d.getMonth(), d.getDate()-dow); fim = new Date(d.getFullYear(), d.getMonth(), d.getDate()-dow+6); } else if(per==="mes"){ ini = new Date(d.getFullYear(), d.getMonth(), 1); fim = new Date(d.getFullYear(), d.getMonth()+1, 0); } else { ini = fim = new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  var a = chaveDia(ini.getTime()), b = chaveDia(fim.getTime()); return Object.keys(s.dias).filter(function(k){ var x = s.dias[k]; return k>=a && k<=b && (x.trechos.length>0 || (x.academia && x.academia.fez)); }).sort().reverse(); }
// apagar histórico: os dias ficam vazios (e não somem), assim o servidor também esvazia e nada volta de lá
function zerarProgresso(){ mudar(function(n){ Object.keys(n.dias).forEach(function(k){ n.dias[k] = diaVazio(); }); }); }

// ---- servidor (09/11/2026): módulo "marcusprog" em sorelly.estado_modulo (app/api/estado/[modulo]); só o perfil ADMIN abre. Uma chave por dia ("d2026-11-09").
// Sem servidor ou sem login, tudo continua funcionando só no navegador. Dois computadores: vale o dia com "em" mais novo.
var MOD = "marcusprog", srv = {versao:0, snaps:{}, ocupado:false, de_novo:false, pronto:false, bloqueado:false};
var json = function(v){ try { return JSON.stringify(v===undefined ? null : v); } catch(x){ return ""; } };
function aplicarRemoto(novos){ var d = Object.assign({}, estado.dias); Object.keys(novos).forEach(function(k){ d[k] = novos[k]; }); estado = {dias:d}; salvar(); ouvintes.forEach(function(f){ f(); }); }
async function sincronizar(){
  if(!apiAtiva() || !token() || srv.bloqueado) return;
  if(srv.ocupado){ srv.de_novo = true; return; }
  srv.ocupado = true;
  try {
    var r = await chamar("GET", "/estado/"+MOD+(srv.pronto && srv.versao>0 ? "?desde="+srv.versao : ""));
    if(!r.igual){
      var novos = {}, remoto = r.conteudo || {};
      Object.keys(remoto).forEach(function(c){ if(c.charAt(0)!=="d") return; var k = c.slice(1), rd = remoto[c], ld = estado.dias[k]; srv.snaps[c] = json(rd); if(!ld || (rd.em||0) > (ld.em||0)) novos[k] = rd; });
      if(Object.keys(novos).length) aplicarRemoto(novos);
      srv.versao = r.versao;
    }
    srv.pronto = true;
    var mudou = {}, n = 0;
    Object.keys(estado.dias).forEach(function(k){ var c = "d"+k, j = json(estado.dias[k]); if(j!==srv.snaps[c]){ mudou[c] = estado.dias[k]; n++; } });
    if(n){ var p = await chamar("PUT", "/estado/"+MOD, {chaves:mudou}); Object.keys(mudou).forEach(function(c){ srv.snaps[c] = json(mudou[c]); }); srv.versao = p.versao; }
  } catch(x){ if(/não tem acesso|carga inicial/.test(x.message||"")) srv.bloqueado = true; }   // sem acesso: segue só neste navegador
  srv.ocupado = false;
  if(srv.de_novo){ srv.de_novo = false; setTimeout(sincronizar, 300); }
}
// use uma vez (no relógio do topo): busca ao entrar e a cada 20 s, e envia 1 s depois de cada mudança
function useSincronizarProgresso(){
  var s = useProgresso();
  useEffect(function(){ sincronizar(); var iv = setInterval(sincronizar, 20000); return function(){ clearInterval(iv); }; }, []);
  useEffect(function(){ var t = setTimeout(sincronizar, 1000); return function(){ clearTimeout(t); }; }, [s]);
}

export { MOTIVOS, MEMBROS, useProgresso, useSincronizarProgresso, chaveDia, dia, aberto, comecarDia, pausar, voltar, encerrarDia, reabrirDia, ajustarTrecho, removerTrecho, setAcademia, fecharAbertosAntigos, somas, hms, hm, rotuloMotivo, dataBr, diasDoPeriodo, zerarProgresso };
