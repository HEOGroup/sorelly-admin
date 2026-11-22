# 02 · Dinheiro que ENTRA

## Caso A · Atendimento interno (fica como está)
```
Revendedora na empresa
   → Lucas direciona a CONTA (tela Direcionar)
   → funcionária cobra, lança o pagamento e anexa o comprovante
   → DevMaster fatura
   → cruza
```
**D-01:** esse fluxo já está bom; não muda.

## Caso B · Representante, acerto em casa
```
Revendedora paga a representante em casa (Pix no CNPJ 34)
   → ninguém lança no Admin
   → representante traz o kit → bipado na DevMaster
   → o Admin lê em Contas a receber
```
- O app da representante, que deixaria ela lançar direto, está pendente.
- **D-02:** o "intervalo cego" (entre o Pix e a bipagem) é aceito. Só exige cruzar sem duplicar.
- Se a revendedora paga direto a um fornecedor ou prestador (vai no grupo): ela manda o comprovante ao Lucas, que lança. Pode acontecer a qualquer momento.

## Caso C · Pix antecipado de um acerto
```
Revendedora paga antes do acerto
   → Lucas (ou outra pessoa do financeiro) lança em Contas a receber → PENDENTE
   → o acerto entra na DevMaster
   → cruza
```
Se o Pix passar do valor devido: o excedente vira **crédito em aberto** (D-09).

## Caso D · Pix antecipado direto ao fornecedor (revendedora A paga o fornecedor X)
```
Revendedora A paga o fornecedor X
   → UM lançamento, feito em Contas a receber:
        ├─ RECEBIMENTO da revendedora A  (pendente, ainda sem acerto)
        └─ PAGAMENTO ao fornecedor X     (quita a dívida aberta dele)
   → 10 a 15 dias depois o acerto da revendedora A entra na DevMaster
   → cruza o recebimento
```
- Quem lança: qualquer pessoa do financeiro (Marcus, Anamaria, Lucas) — D-06.
- Escolhe o fornecedor e o Admin quita a dívida aberta dele. Passou do valor: o excedente fica como **crédito** (D-09).
- Vale também para **prestador**. Em resumo: o lançamento é universal (D-08).
- **D-07:** o Lucas **para de lançar** em Pagamentos a fornecedores e lança só em Contas a receber.
