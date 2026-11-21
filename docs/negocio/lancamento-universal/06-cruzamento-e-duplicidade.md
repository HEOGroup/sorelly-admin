# 06 · Cruzamento e duplicidade

## O que quer dizer "não duplicar"
O Lucas lança hoje um Pix de R$ 1.000 (pendente). Dez dias depois a DevMaster traz o título de R$ 1.000. O Admin deve reconhecer que é **o mesmo dinheiro** e juntar os dois. Sem isso, o total mostraria R$ 2.000.

## Regra do cruzamento
Um lançamento do Admin casa com um título da DevMaster quando tem:
1. a mesma **parte** (revendedora, fornecedor ou prestador);
2. o mesmo **tipo** (Pix, boleto, cheque, cartão);
3. o mesmo **valor** (até 1 centavo);
4. data **perto**: o título entre 3 dias antes e 12 dias depois da data do pagamento (valor testado com a Pontual).

Cada lançamento casa com **um** título só. Se não houver casamento, **nada muda** e a conta continua visível (errar para o lado seguro).

## Duas candidatas iguais
Se dois títulos servem para o mesmo lançamento, o Admin **não adivinha**: pergunta a quem lançou. O caso comum é fatura em parcelas iguais (6 x o mesmo valor).

## Já construído (publicado em 20/11/2026, v0.21.73)
- `domain/casar-pagos.js`: cruza parcelas pagas de Pagamentos a fornecedores com títulos abertos da DevMaster.
- Primeiro caso real: 15 Pix da Pontual (R$ 60.802,49) viram pagos, com o aviso "Falta baixa na DevMaster".
- Na DevMaster, os Pix da Pontual ficam no fornecedor 000512 ("Jucimara Purkote"), natureza 5.04.01.02.
- Parcela marcada "Pago" com data futura é ignorada (erro de planilha).

## Crédito
Se o Pix passar do valor da dívida aberta, o que sobra fica como **crédito em aberto** (D-09). O crédito pode abater a próxima dívida (P-03).

## Aberto
- P-06: se o lançamento já cruzado estiver errado, quem corrige e como desfaz?
