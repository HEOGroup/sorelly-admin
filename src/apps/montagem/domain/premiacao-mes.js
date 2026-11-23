// Sorelly Admin · montagem — domain/premiacao-mes.js
// Premiação do mês das revendedoras (Marcus, 23/11/2026; campanha "Top 10 de novembro/2026", resumo em Downloads/top10_novembro_sorelly.html).
// Critério: as 10 revendedoras com a maior soma de VALOR DE ACERTO no mês. Prêmios por colocação (nomes tirados das artes do Instagram @sorellyoficial: conferir com os códigos do cadastro).
// Cada mês novo ganha uma entrada aqui (chave AAAA-MM) e as fotos em public/premiacao/AAAA-MM/lugar-NN.jpg. Mês sem entrada: a tela mostra o Top 10 sem prêmio.
// Sem dados de pessoas: só a campanha.
var PREMIACOES = {
  "2026-11": {
    titulo:"Top 10 de novembro",
    divulgacao:"Dezembro de 2026, depois do fechamento de todos os acertos de novembro",
    premios:[
      {lugar:1, portaJoias:"Grande com gavetas, rosa", semijoias:["Bracelete triplo cravejado", "Pulseira de pedras"], extra:"R$ 1.000 em dinheiro"},
      {lugar:2, portaJoias:"Grande com gavetas, verde", semijoias:["Pulseira cordão baiano", "Brincos gota", "Bracelete cravejado"], extra:"Jantar para 2 no Batel Grill"},
      {lugar:3, portaJoias:"Médio com gaveta, rosa", semijoias:["Bracelete prego", "Pulseira cordão baiano"], extra:""},
      {lugar:4, portaJoias:"Médio com gaveta, bege", semijoias:["Pulseira cordão baiano"], extra:""},
      {lugar:5, portaJoias:"Médio, bege", semijoias:["Colar hexágono", "Brincos hexágono", "Pulseira cordão baiano"], extra:""},
      {lugar:6, portaJoias:"Pequeno, rosa", semijoias:["Bracelete prego"], extra:""},
      {lugar:7, portaJoias:"Pequeno, rosa", semijoias:["Corrente cordão baiano"], extra:""},
      {lugar:8, portaJoias:"Pequeno, bege", semijoias:["Colar coração cravejado"], extra:""},
      {lugar:9, portaJoias:"Pequeno, bege", semijoias:["Bracelete aberto com pedras"], extra:""},
      {lugar:10, portaJoias:"Pequeno, bege", semijoias:["Colar com pingente de coração"], extra:""}]}
};
function premiacaoDoMes(ym){
  var p = PREMIACOES[ym]; if(!p) return null;
  return {titulo:p.titulo, divulgacao:p.divulgacao, premios:p.premios.map(function(x){ return Object.assign({}, x, {foto:"/premiacao/"+ym+"/lugar-"+(x.lugar<10 ? "0" : "")+x.lugar+".jpg"}); })};
}
export { PREMIACOES, premiacaoDoMes };
