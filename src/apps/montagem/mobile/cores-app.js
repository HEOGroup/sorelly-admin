// Sorelly Admin · montagem — mobile/cores-app.js
// PADRÃO DE COR DOS APPS (Marcus, 29/10/2026): cada função do sistema tem UMA cor só, igual em todos os apps (revendedora, representante,
// funcionárias, motoboy, cliente final), mesmo que o texto do cartão mude. Fonte e tamanho seguem o app da revendedora:
// título do cartão 13 px, legenda 11 px, selo 10 px, nomes do cabeçalho 15 px; números grandes até 20 px.
// Cor nova de função nova entra AQUI (e não dentro de cada app).
var COR_FUNCAO = {
  chat:"#C9A13B",          // SorellyChat (cartão creme, logo escura)
  kitnovo:"#DB2777",       // Kit novo / Kits novos
  revendedoras:"#EA580C",  // Revendedoras (rede da representante)
  listagens:"#7C3AED",     // Listagens
  condicionais:"#0D9488",  // Condicionais
  montagem:"#0369A1",      // Montagem de kits
  retirada:"#65A30D",      // Retirada de kits
  dinheiro:"#16A34A",      // Dinheiro / Vendas e pedidos
  comissoes:"#CA8A04",     // Comissões
  regras:"#B8862B",        // Regras e comissões
  informativos:"#9A7424",  // Informativos
  cobrancas:"#DC2626",     // Cobranças
  link:"#0891B2",          // Link de pagamento
  pagamentos:"#9333EA",    // Pagamentos
  clientes:"#4F46E5",      // Clientes
  garantias:"#D97706",     // Garantias
  mensagens:"#2563EB",     // Mensagens para vender
  indique:"#EAB308",       // Indique & Ganhe
  entrega:"#0891B2"        // Entrega (motoboy e cliente final)
};
// base de todos os apps (a mesma do app da revendedora)
var BASE_APP = {topo:"#0B0B0D", ouro:"#E8B84B", texto:"#111827", legenda:"#6B7280", linha:"#E5E7EB", fundo:"#F2F3F5", ok:"#16A34A", erro:"#DC2626"};
// BARRAS (Marcus, 29/10/2026): todas as barras/cartões dos apps têm o fundo creme da barra do SorellyChat. Os ícones mantêm a cor de cada função.
var FUNDO_BARRA = "#F6EBCB";
export { COR_FUNCAO, BASE_APP, FUNDO_BARRA };
