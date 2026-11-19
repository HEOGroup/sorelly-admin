// Sorelly Admin · montagem — lib/copia-navegador.js
// FASE 1 de "nada no navegador, tudo no banco" (Nickolas, 17/11/2026: "NUNCA SALVE NO NAVEGADOR E SEMPRE NO BANCO DE DADOS").
// Uma vez por dia, depois do login, o navegador manda para o banco (/api/copia-navegador) uma CÓPIA das partes do estado que ainda não têm módulo no servidor.
// Nada muda na tela nem na gravação atual: é só a cópia de segurança, para nada se perder quando o navegador deixar de guardar dados (Fase 3)
// e para ver o que é dado de verdade (Fase 2). Ficam de fora: o que já vai para o servidor (CHAVES_SINCRONIZADAS) e o estado da tela (TELA).
import { apiAtiva, chamar, token } from "@/apps/montagem/lib/api";
import { CHAVES_SINCRONIZADAS } from "@/apps/montagem/lib/sync-modulos";
import { useEffect, useRef } from "@/shared/react";

var TELA = ["aba", "celular", "telaCel", "abertas", "kitAberto", "filtroReg", "aviso", "intAbas", "intSel", "visao", "logado", "usuario"];   // estado de tela: não é dado
var CHAVE_NAV = "sorelly_nav_id", CHAVE_DIA = "sorelly_copia_nav_dia";   // só marcas pequenas (permitidas: não são dado do sistema)
var LOTE = 2.5 * 1024 * 1024, MAXIMO = 4 * 1024 * 1024;   // caracteres por chamada (a Vercel aceita até ~4,5 MB)

function navId(){
  try { var v = localStorage.getItem(CHAVE_NAV); if(v && /^nv_[a-z0-9]{8,40}$/.test(v)) return v;
    v = "nv_"+Math.random().toString(36).slice(2, 12)+Date.now().toString(36); localStorage.setItem(CHAVE_NAV, v); return v; } catch(x){ return ""; }
}
var hoje = function(){ return new Date().toLocaleDateString("sv-SE", {timeZone:"America/Sao_Paulo"}); };

// partes do estado que só existem no navegador: {chave: valor}
function partesSoNoNavegador(s){
  var o = {}; Object.keys(s || {}).forEach(function(k){ if(CHAVES_SINCRONIZADAS.indexOf(k)>=0 || TELA.indexOf(k)>=0 || s[k]===undefined || typeof s[k]==="function") return; o[k] = s[k]; });
  return o;
}

// manda em lotes; parte maior que o limite vai só com o tamanho (para sabermos que existe)
function enviar(nav, partes){
  var lotes = [], atual = {}, tam = 0;
  Object.keys(partes).forEach(function(k){
    var t = 0; try { t = JSON.stringify(partes[k]).length; } catch(x){ return; }
    var v = t>MAXIMO ? {_grandeDemais:true, tamanho:t} : partes[k], tv = t>MAXIMO ? 60 : t;
    if(tam+tv>LOTE && Object.keys(atual).length){ lotes.push(atual); atual = {}; tam = 0; }
    atual[k] = v; tam += tv;
  });
  if(Object.keys(atual).length) lotes.push(atual);
  var p = Promise.resolve();
  lotes.forEach(function(l){ p = p.then(function(){ return chamar("POST", "/copia-navegador", {nav:nav, partes:l}); }); });
  return p;
}

// s = estado completo. Roda 20 s depois do login (a tela já carregou), uma vez por dia e por navegador; erro não atrapalha nada (tenta no dia seguinte ou ao recarregar)
function useCopiaNavegador(s){
  var tk = token();
  var sRef = useRef(s); sRef.current = s;   // sempre o estado mais novo quando a cópia sair
  useEffect(function(){
    if(!apiAtiva() || !tk) return undefined;
    var feito = false; try { feito = localStorage.getItem(CHAVE_DIA)===hoje(); } catch(x){}
    if(feito) return undefined;
    var t = setTimeout(function(){
      var nav = navId(); if(!nav) return;
      enviar(nav, partesSoNoNavegador(sRef.current)).then(function(){ try { localStorage.setItem(CHAVE_DIA, hoje()); } catch(x){} }, function(){});
    }, 20000);
    return function(){ clearTimeout(t); };
  }, [tk]);
}

export { useCopiaNavegador, partesSoNoNavegador };
