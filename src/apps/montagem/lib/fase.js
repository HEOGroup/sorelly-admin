// Sorelly Admin · montagem — lib/fase.js
// "Fase de subida": quais setores do menu a equipe vê agora e o atalho para o admin antigo (para o que ainda não foi trocado).
// Setores: variável VITE_SETORES_LIGADOS (ex.: "whats,rotina,rh,estoque") ou, para testar, localStorage "sorelly_setores". Vazio = todos aparecem.
// Admin antigo: VITE_ADMIN_ANTIGO_URL ou localStorage "sorelly_admin_antigo". É só o que aparece no MENU: esconder um setor não é bloqueio de acesso (o bloqueio de verdade é no servidor).
var lista = function(t){ return String(t || "").split(",").map(function(x){ return x.trim(); }).filter(Boolean); };
function guardado(chave){ try { return localStorage.getItem(chave) || ""; } catch(x){ return ""; } }

function setoresLigados(){
  var l = lista(guardado("sorelly_setores") || (process.env.NEXT_PUBLIC_SETORES_LIGADOS));
  return l.length ? l : null;
}
// endereço do admin antigo (passado pelo Marcus em 22/10/2026); pode ser trocado pela variável ou pelo localStorage
var ADMIN_ANTIGO = "https://admin.sorellyjoias.com.br/";
function urlAdminAntigo(){
  return String(guardado("sorelly_admin_antigo") || (process.env.NEXT_PUBLIC_ADMIN_ANTIGO_URL) || ADMIN_ANTIGO).trim();
}
export { setoresLigados, urlAdminAntigo };
