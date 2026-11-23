# 09 · Taxa de entrega das reposições (Encomendas)

Decisão do Marcus em 22/11/2026. Documento público: sem nomes de revendedoras, sem chaves, sem valores reais de banco.

## O caso
A revendedora paga a taxa de entrega da reposição (R$ 15,00 por padrão, em Encomendas › Regras) por Pix, **direto ao entregador**, depois que o setor separa as peças. Ela anexa o comprovante no próprio link do pedido. O pedido só é liberado para envio depois que a equipe confere.

É o mesmo desenho do caso D de `02-entradas.md` (pagamento direto a prestador): **um lançamento = recebimento da revendedora + pagamento ao entregador**.

## Regra
| Situação | O que o sistema faz |
|---|---|
| Taxa **paga** e conferida (comprovante anexado) | Cria **uma taxa já paga**: entra no **Contas a receber** (a revendedora pagou) e no **Contas a pagar** (paga ao entregador), com o mesmo comprovante |
| Taxa **não paga** | **Não lança nada.** Não vira dívida nem conta a receber |
| Pedido isento de taxa | Não lança nada |

## Fluxo
```
Setor separa as peças → libera a taxa no link
Revendedora paga o Pix e anexa o comprovante
Equipe confere e clica em Confirmar pagamento (ficha do pedido)
   → lançamento único já pago, com origem (revendedora), destino (entregador) e comprovante
   → aparece no Contas a receber e no Contas a pagar
```
A conferência humana fica antes do lançamento: comprovante errado não vira dinheiro pago.

## Dados
- Dono da conta Pix: o entregador (a chave Pix da taxa fica só no servidor, em Encomendas › Regras; nunca no Git).
- Descrição sugerida: "Taxa de entrega · reposição" + código do pedido.
- Identificador do pedido (`linkId`) guardado no lançamento para cruzar sem duplicar.

## Situação
**Construído em 23/11/2026** (`src/server/taxa-entrega.js`, botão Confirmar pagamento na ficha do pedido). Lança no Contas a receber como recebimento sem acerto e no Contas a pagar já pago, com o mesmo comprovante. Quando o lançamento universal ficar pronto, só o ponto de gravação muda; a regra continua a mesma.
