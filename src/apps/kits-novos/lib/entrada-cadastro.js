// Sorelly Admin · kits novos Curitiba — lib/entrada-cadastro.js
// ENTRADA DOS KITS NOVOS (25/11/2026, pedido do Leonardo): a revendedora aprovada vem da KOMMO, pelo servidor (src/server/kits-novos-kommo.js),
// com id LK<número do lead>, e chega a todo mundo pelo módulo kndados. Antes (23/10/2026) este arquivo criava o kit lendo o quadro de
// Aprovação de cadastros do navegador (montagem › s.cl), que só existia naquele computador e não era ligado à Kommo: isso saiu.
// Aqui ficou só a limpeza dos cartões de demonstração.
// SEM DEMONSTRAÇÃO (chamados da Michele e da Camilly, 29/10/2026): as candidatas inventadas do Cadastro (telefone "(41) 98888-…") e as
// 3 revendedoras de exemplo (D1 a D3) não entram nem ficam nos Kits novos.
var TEL_DEMO = /^\(41\) 98888-/, IDS_DEMO = {D1:1, D2:1, D3:1};
function cartaoDemo(c){ return IDS_DEMO[c.id] || (/^L\d+$/.test(c.id) && TEL_DEMO.test(c.tel||"")); }

function absorver(s){
  var dados = s.dados.filter(function(c){ return !cartaoDemo(c); });
  return dados.length===s.dados.length ? s : Object.assign({}, s, {dados:dados});
}

// (a fila antiga deixou de existir; mantido só para não quebrar quem ainda chama)
function limpar(){}

export { absorver, limpar };
