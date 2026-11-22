# 03 · Dinheiro que SAI, família e pagamento por terceiros

## Regra de saída (D-10)
Todo pagamento que sai de **qualquer conta da empresa** aparece no Contas a pagar. Isso vale para as contas dos 4 CNPJs e para contas que a empresa usa mesmo sendo pessoais. Todo pagamento feito com Pix de revendedora também aparece.

## Matriz: dono da dívida × dono da conta que pagou
| Dívida de | Paga com conta de | O que aparece |
|---|---|---|
| Empresa | Empresa | Custo normal no Contas a pagar da empresa |
| Pessoa da família | **Mesma pessoa** (conta própria) | **Só** Financeiro familiar |
| Pessoa da família | **Conta da empresa** | Família: conta paga. Empresa: saiu dinheiro, valor **a mais** daquela pessoa |
| Empresa | **Conta pessoal** (complemento) | Ver caso G |

## Caso E · Conta pessoal paga com conta pessoal
Fatura de cartão de uma pessoa, paga com a conta dela. Aparece **só** no Financeiro familiar. Nunca no Contas a pagar da empresa.

## Caso F · Conta da família paga com conta da empresa
```
Conta da família (boleto da casa, parcela de carro, fatura de cartão por boleto...)
   → paga com uma conta que a empresa usa
   → sobe no Contas a pagar da FAMÍLIA   (conta paga)
   → e é DINHEIRO QUE SAIU DA EMPRESA     (a mais para a pessoa)
```
- **Não é só uma pessoa nem um caso:** pode ser de Marco, Anamaria, Ana Beatriz ou qualquer outra pessoa; pode ser qualquer conta, por exemplo um boleto da casa de valor alto. O financeiro **direciona para a família no Admin** (D-11).
- **Uma mesma conta pode se dividir (rateio)** entre pessoas, dentro do Financeiro familiar (D-12).

## Caso G · Pessoa quita um pedaço da dívida da empresa com a conta pessoal
Exemplo: a empresa deve um valor a um fornecedor e faltaram poucos reais; uma pessoa paga a diferença da conta dela.
- **D-13:** deve só **dar como pago**, sem movimentar contas da empresa (sem saldo, sem lançamento de caixa).
- Aberto: P-02 (se isso aparece em algum relatório como "pago por fora").
