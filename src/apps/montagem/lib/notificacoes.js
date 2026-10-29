// Sorelly Admin — lib/notificacoes.js
// Liga e desliga as notificações (aviso na tela e som) do admin e do SorellyChat. As do SorellyChat começam LIGADAS (Marcus, 29/10/2026: todos precisam ouvir quando chega mensagem); as do admin começam desligadas. A escolha fica guardada neste navegador.
import { useEffect, useState } from "@/shared/react";

var CHAVE = "sorelly_notificacoes_v1", ouvintes = [];
var est = (function(){ try{ var j = JSON.parse(localStorage.getItem(CHAVE)); if(j) return {admin:!!j.admin, chat:j.chat===undefined ? true : !!j.chat}; }catch(x){} return {admin:false, chat:true}; })();

function ler(){ return est; }
function mudar(o){ est = Object.assign({}, est, o); try{ localStorage.setItem(CHAVE, JSON.stringify(est)); }catch(x){} ouvintes.forEach(function(f){ f(); }); }
function assinar(f){ ouvintes.push(f); return function(){ ouvintes = ouvintes.filter(function(x){ return x!==f; }); }; }
function useNotif(){ var st = useState(est), set = st[1]; useEffect(function(){ return assinar(function(){ set(est); }); }, []); return st[0]; }

export { ler, mudar, assinar, useNotif };
