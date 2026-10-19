// Sorelly Admin — domain/kit-novo-regras.js
// Regras que aparecem na entrega do kit novo e ainda não moram no Configurador de regras do consignado (07/10/2026, Marcus).
// Quando virarem campo do Configurador, sai daqui. Nunca escrever esses números dentro de tela.
var KIT_NOVO_REGRAS = {
  minRenovarKit:500,      // venda mínima para renovar o kit (diferente do mínimo de R$ 300 para ter comissão)
  mediaMeses:3,           // do mês seguinte em diante vale a média dos últimos 3 meses (ou 2, se ela tiver menos)
  kitBasico:7000,         // sem vendas no app, o próximo kit é o kit básico
  prazoAcertoDias:30,
  agendarDias:5
};
// Link de pagamento: ferramenta de VENDA (a cliente final paga pelo link); o valor pago abate o acerto
var LINK_PAGAMENTO = {
  valorMinimo:80, parcelaMinima:50, parcelasMax:10, validadeHoras:12, tentativasPorDia:3
};

export { KIT_NOVO_REGRAS, LINK_PAGAMENTO };
