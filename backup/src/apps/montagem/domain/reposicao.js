// Sorelly Admin — domain/reposicao.js
// Regras de reposição e encomendas (checklist do kit novo, 07/10/2026). Por decisão do Marcus a reposição NÃO é oferecida às revendedoras neste momento
// (senão muitas pedem): as regras ainda serão alinhadas com o setor. Por isso o kit novo não explica reposição. Valores aqui, nunca dentro de tela.
var REGRAS_REPOSICAO = {
  disponivel:false,        // não disponibilizar agora
  aPartirDoMes:2,          // só a partir do segundo mês
  minVendido:500,          // vender no mínimo R$ 500 para solicitar
  pctVendidoParaNaoBloquear:30,   // precisa vender ao menos 30% do valor da reposição, senão fica bloqueada para novos pedidos
  taxa:20                  // taxa por reposição
};
// Pontos que ainda não estão definidos (aparecem na página de regras)
var REPOSICAO_A_ALINHAR = [
  "Prazos e forma de entrega das reposições e das encomendas",
  "Número de contato para encomendas e reposições",
  "Quem aprova o pedido e como a representante participa",
  "O que acontece com a revendedora bloqueada e como ela volta a poder pedir",
  "Limite de peças (ou de valor) por reposição",
  "Se as mesmas regras valem para o Kit 100% Prata",
  "Quando a reposição passa a ser oferecida às revendedoras"
];

export { REGRAS_REPOSICAO, REPOSICAO_A_ALINHAR };
