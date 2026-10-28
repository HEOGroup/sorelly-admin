// Sorelly Admin · montagem — lib/favoritas.js
// Telas favoritas (estrela nas abas do topo), por pessoa e por modo (Admin ou Marcus), neste navegador. Ordem = a que a pessoa escolheu arrastando as abas.
// Ao abrir o sistema, as favoritas já aparecem na faixa de abas, com o Início sempre na frente (Marcus, 27/10/2026).
// Cada favorita: {k, nome, aba, modo, breve, setor, cor} (o mesmo formato das abas abertas).
import { pessoaDaConta } from "@/apps/montagem/lib/api";

var chave = function(visao){ return "sorelly_favoritas_"+(pessoaDaConta() || "local")+"_"+(visao || "admin"); };

function lerFavoritas(visao){
  try { var l = JSON.parse(localStorage.getItem(chave(visao)) || "[]"); return Array.isArray(l) ? l : []; } catch(x){ return []; }
}
function gravarFavoritas(visao, lista){
  try { localStorage.setItem(chave(visao), JSON.stringify(lista)); } catch(x){}
  window.dispatchEvent(new Event("sorelly-favoritas"));   // barra de abas e página inicial se atualizam
}
// chave de uma tela (setor + aba + modo + nome): a mesma em toda parte que mexe com favoritas (components/barra-menu.js e ui/page.js)
function chaveDeNo(n, setor){ return setor+"|"+(n.aba||"")+"|"+(n.modo||"")+"|"+n.nome; }

export { lerFavoritas, gravarFavoritas, chaveDeNo };
