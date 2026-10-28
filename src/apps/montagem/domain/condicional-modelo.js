// Sorelly Admin · montagem — domain/condicional-modelo.js
// Modelo do papel da CONDICIONAL (Revendedoras › Condicional): cabeçalho, termo de responsabilidade, nota promissória e folha de anotação do acerto.
// Copia o papel que a DevMaster imprime (relVen006_grupo, exemplo de 21/10/2026) e troca os textos pelas regras novas, válidas para kits recebidos a partir de 27/10/2026.
// Campos entre [colchetes] são preenchidos por kit. Nenhum dado de revendedora real fica aqui (repositório público).
// Termo = minuta 2 (26/10/2026), 7 cláusulas; a cláusula de peças para troca ficou de fora até a política de trocas ser refeita (texto antigo guardado em docs/negocio/CONDICIONAL-TERMO-E-NOTA.md). Nota = texto revisado pelo advogado (27/10/2026). Fontes e itens a confirmar: docs/negocio/CONDICIONAL-TERMO-E-NOTA.md.
// O papel é impresso pela DevMaster: quem edita o modelo de lá precisa trocar o texto lá também.

var CAMPOS = ["[NÚMERO]", "[EMISSÃO]", "[DATA DO ACERTO]", "[VALOR TOTAL DO KIT]", "[VALOR POR EXTENSO]", "[NOME]", "[CPF]", "[RG]", "[ESTADO CIVIL]", "[ENDEREÇO]", "[CIDADE-UF]", "[CEP]", "[DATA DE EMISSÃO]", "[RAZÃO SOCIAL]"];

var CABECALHO_PADRAO = [
  "SORELLY",
  "RUA MARECHAL DEODORO 950 SALA 501 - CEP: 80060-010",
  "CURITIBA - PR - BRASIL",
  "CNPJ: 34.753.252/0001-03 - IE: 9088269141",
  "(41)99686-8634",
  "financeiro@sorellyjoias.com.br"
].join("\n");

var TERMO_PADRAO = [
  "Valor total das mercadorias: R$ [VALOR TOTAL DO KIT]",
  "Data do acerto e da devolução: [DATA DO ACERTO]. Esta é também a data de vencimento da nota promissória anexa.",
  "",
  "Declaro que recebi as mercadorias listadas neste termo, em consignação, e assumo as obrigações abaixo.",
  "",
  "1. Acerto e devolução na data. Devo fazer o acerto e devolver as mercadorias não vendidas na data acima. Essa data é o prazo final, e não uma previsão.",
  "2. Responsabilidade integral. As mercadorias ficam sob minha guarda e responsabilidade desde o recebimento. Respondo pelo valor integral em caso de perda, dano, extravio, venda não acertada ou não devolução. Toda peça que não estiver presente na data do acerto é considerada vendida e será cobrada.",
  "3. Pagamento integral. Devo pagar o acerto por inteiro na data combinada. Havendo valor pendente, tenho 15 dias para quitá-lo. Incide multa de 10% sobre o valor pendente e, depois do 15º dia, mais 1% ao dia de atraso, até o teto de 10%. Enquanto houver valor pendente, não recebo novo kit.",
  "4. Atraso do acerto. Se o acerto não for feito na data, minha comissão e meu brinde diminuem conforme os dias de atraso, nos termos do Regulamento da Revendedora. Com 60 dias de atraso, perco toda a comissão e todo o brinde.",
  "5. Cobrança. Com 60 dias de atraso, ou antes disso a critério da Sorelly, o valor integral das mercadorias poderá ser cobrado pela nota promissória anexa, por notificação, protesto e execução judicial, sem prejuízo da multa e dos juros nela previstos.",
  "6. Nota promissória. Emito a nota promissória anexa, no valor integral das mercadorias, com vencimento na data do acerto, como garantia deste termo. Reconheço o valor como dívida líquida, certa e exigível.",
  "7. Regulamento. Li, entendi e aceito o Regulamento da Revendedora, vigente para kits recebidos a partir de 27/10/2026, que faz parte deste termo.",
  "",
  "Assinatura: ______________________",
  "Nome: [NOME]",
  "CPF: [CPF]"
].join("\n");

var NOTA_PADRAO = [
  "NOTA PROMISSÓRIA",
  "N.º [NÚMERO]",
  "Valor: R$ [VALOR TOTAL DO KIT]",
  "Vencimento em: [DATA DO ACERTO, POR EXTENSO]",
  "",
  "No dia do vencimento acima, eu, [NOME], pagarei por esta NOTA PROMISSÓRIA a SORELLY, inscrita no CNPJ sob o n.º 34.753.252/0001-03, Inscrição Estadual n.º 9088269141, com sede na Rua Marechal Deodoro, 950, Centro, CEP 80060-010, Curitiba-PR, ou à sua ordem, a quantia de [VALOR POR EXTENSO], em moeda corrente nacional. Pagável em Curitiba-PR.",
  "",
  "Em caso de atraso, pagarei, sobre o saldo devedor, multa de 10% (dez por cento) e juros de mora de 1% (um por cento) ao mês, calculados pro rata die a partir do vencimento, com correção monetária pelo IPCA, além das despesas de cobrança, custas e dos honorários advocatícios fixados em juízo.",
  "",
  "Local e data de emissão: [CIDADE-UF], [DATA DE EMISSÃO]",
  "",
  "EMITENTE",
  "Assinatura: ______________________",
  "Nome: [NOME]   CPF: [CPF]   RG: [RG]   Estado civil: [ESTADO CIVIL]",
  "Endereço: [ENDEREÇO]   Cidade: [CIDADE-UF]   CEP: [CEP]",
  "",
  "AVALISTA",
  "Assinatura: ______________________",
  "Nome: ______________________   CPF: ______________   RG: ______________   Estado civil: ____________",
  "Endereço: ______________________________________________"
].join("\n");

var ACERTO_PADRAO = [
  "SORELLY JOIAS - ANOTAÇÃO ACERTOS                         REPRESENTANTE: ________________________",
  "",
  "Valor total das vendas: R$ ______________,00   Comissão: ________%   Valor a pagar: R$ _____________",
  "Peças retornadas: _________   Peças vendidas: __________",
  "Trocas: ______________________________________________________________________________________",
  "",
  "FORMAS DE PAGAMENTO",
  "PIX - Se o PIX estiver em nome diferente da cliente (inclusive CNPJ), informar: _______________________________",
  "1. Conta: ______________________________ Valor: R$ ______________ Data: ____/____/______",
  "2. Conta: ______________________________ Valor: R$ ______________ Data: ____/____/______",
  "DINHEIRO: Valor: R$ ______________   CRÉDITO DE GARANTIA: Valor: R$ ______________",
  "",
  "CARTÃO OU LINK NA DATA DO ACERTO",
  "1. Valor: R$ ____________ Parcelas: ______ X   Débito ( )  Crédito ( )   CNPJ: _____   Banco: ______________",
  "2. Valor: R$ ____________ Parcelas: ______ X   Débito ( )  Crédito ( )   CNPJ: _____   Banco: ______________",
  "LINKS DE PAGAMENTO (somente links solicitados pela revendedora ao setor de links para cliente final)",
  "Link 1. Data: ____/____/______ Valor: R$ ___________ Parcelas: X _____ Confirmado: _____ CNPJ: _____",
  "Link 2. Data: ____/____/______ Valor: R$ ___________ Parcelas: X _____ Confirmado: _____ CNPJ: _____",
  "Link 3. Data: ____/____/______ Valor: R$ ___________ Parcelas: X _____ Confirmado: _____ CNPJ: _____",
  "Link 4. Data: ____/____/______ Valor: R$ ___________ Parcelas: X _____ Confirmado: _____ CNPJ: _____",
  "Link 5. Data: ____/____/______ Valor: R$ ___________ Parcelas: X _____ Confirmado: _____ CNPJ: _____",
  "",
  "BRINDES NORMAIS __________                                 BRINDES BB __________",
  "1. Cód: ________________ R$ _________,00         1. Cód: ________________ R$ _________,00",
  "2. Cód: ________________ R$ _________,00         2. Cód: ________________ R$ _________,00",
  "3. Cód: ________________ R$ _________,00         3. Cód: ________________ R$ _________,00",
  "4. Cód: ________________ R$ _________,00         4. Cód: ________________ R$ _________,00",
  "5. Cód: ________________ R$ _________,00         5. Cód: ________________ R$ _________,00",
  "Soma total Normais: R$ ____________,00            Soma total BB: R$ ____________,00",
  "",
  "Peça de próximo mês: _____________________________________________________________________________",
  "_________________________________________________________________________________________________",
  "",
  "Baixa no sistema:",
  "Nome: _____________________________ Código: ___________ Data: ____/____/______"
].join("\n");

// Texto do papel ANTES das regras de 27/10/2026 (exemplo de 21/10/2026): só para comparar, não se edita.
var TERMO_ANTERIOR = [
  "Recebi as mercadorias aqui listadas e comprometo-me a devolvê-las na data de [DATA DO ACERTO], responsabilizando-me pelo pagamento das mesmas em caso de perda, dano, extravio, venda, ou da não devolução dentro do prazo previsto.",
  "",
  "Referente às peças recebidas para troca, as representantes realizarão a entrega e a eventual retirada enquanto a REVENDEDORA estiver ativa em suas atividades comerciais. Na hipótese de interrupção, suspensão ou encerramento das atividades de revenda, a responsabilidade pela devolução das peças passará a ser integral e exclusiva da REVENDEDORA, que deverá providenciar a entrega no endereço indicado pela empresa dentro do prazo de conclusão da peça de até 90 dias.",
  "",
  "A REVENDEDORA declara estar ciente de que a guarda, conservação e integridade das peças enquanto estiverem sob sua posse são de sua inteira e exclusiva responsabilidade.",
  "",
  "[NOME]",
  "[CPF]"
].join("\n");

var MODELO_PADRAO = {cab:CABECALHO_PADRAO, termo:TERMO_PADRAO, nota:NOTA_PADRAO, acerto:ACERTO_PADRAO, historico:[]};

export { CAMPOS, MODELO_PADRAO, TERMO_ANTERIOR };
