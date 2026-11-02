# Setor Garantia e pós-venda (Trocas e SAC)

Resumo para ler primeiro. Para o detalhe: `decisoes.md` (o que o Marcus decidiu, 0 itens), `pendencias.md` (o que está aberto, 0 itens) e `pessoas.local.md` (ficha de cada pessoa, fora do Git). "(a confirmar)" = falta confirmar com o Marcus.

## 1. O que o setor faz
Recebe as peças com defeito dos acertos e atende clientes (SAC). Trocas não ganha comissão.

```
Bipagem (peças de garantia)
      │
      ▼
Garantia e pós-venda
      │
      ▼
(a confirmar)
```

## 2. Quem
| Quem | Papel |
|---|---|
| Marcus | Líder do setor |
| Giovanna, Ana S. | Assistente administrativo (2) |
| Leticia V. | Assistente administrativo IV (1) |

## 3. Regras que valem
| # | Regra |
|---|---|
| 1 | Trocas é do setor de Garantias e não ganha comissão. |

## 4. Onde ficam as coisas
| O quê | Onde |
|---|---|
| Garantia | `/garantia-pos-venda/garantia` |
| Pós-vendas | Em breve |
| Pessoas (dados reais) | `docs/setores/garantia/pessoas.local.md` (só neste PC) |
| Integração com os outros setores | `docs/negocio/INTEGRACAO-ENTRE-SETORES.md` |

Código das telas: `pages/Garantia.js`.

## 5. Em aberto (principais)
- Nome do setor: Garantia ou Trocas (a confirmar).
- Para onde vão as peças depois (a confirmar).
- Lista completa: `pendencias.md` desta pasta (0 itens, a revisar com o Marcus).

## 6. Regra de trabalho
Mudou uma regra? Atualize (1) o sistema, (2) `decisoes.md` desta pasta e o diário geral, no mesmo dia, (3) o painel: `node scripts/gerar-painel-documentos.mjs`.
