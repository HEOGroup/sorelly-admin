# Setor Materiais e estoque (com Cadastro de peças e Compras)

Resumo para ler primeiro. Para o detalhe: `decisoes.md` (o que o Marcus decidiu, 21 itens), `pendencias.md` (o que está aberto, 8 itens) e `pessoas.local.md` (ficha de cada pessoa, fora do Git). "(a confirmar)" = falta confirmar com o Marcus.

## 1. O que o setor faz
Compra material, controla o estoque de material e cadastra as peças com preço sugerido, que a diretoria aprova.

```
Fornecedores (bruto e banho)
      │
      ▼
Materiais e estoque
      │
      ▼
Produção (peças liberadas); Financeiro (dados para pagar)
```

## 2. Quem
| Quem | Papel |
|---|---|
| Rayssa (cadastro de peças); Nickolas (compras; Hellen no link de pagamento) | Líder do setor |
| Graziella, Helen | Assistente administrativo (2) |
| Rayssa | Analista administrativo II (1) |

## 3. Regras que valem
| # | Regra |
|---|---|
| 1 | A diretoria define o preço das peças. Cadastro por modelo. |
| 2 | Aprovação de compra por pessoa (autorização compra_aprova). |
| 3 | Estoque geral de peças mês a mês fica no Financeiro, não aqui. |

## 4. Onde ficam as coisas
| O quê | Onde |
|---|---|
| Compras e estoque de material | `/materiais-estoque/compras-e-estoque` |
| Pedidos de bruto | `/cadastro-de-pecas/pedidos` |
| Controle do mês | `/cadastro-de-pecas/controle-do-mes` |
| Tabela do banho | `/cadastro-de-pecas/tabela-do-banho` |
| Faturas Pontual | `/cadastro-de-pecas/faturas-pontual` |
| Faturas Ellos | `/cadastro-de-pecas/faturas-ellos` |
| Retirar ouro | `/cadastro-de-pecas/retirar-ouro` |
| Solicitações | `/cadastro-de-pecas/solicitacoes` |
| Planilhas de cadastro | `/cadastro-de-pecas/planilhas` |
| Calculadora | `/cadastro-de-pecas/calculadora` |
| DevMaster | `/cadastro-de-pecas/devmaster` |
| Fornecedores | `/cadastro-de-pecas/fornecedores` |
| Configurações | `/cadastro-de-pecas/configuracoes` |
| Fluxo de compra de bruto | `docs/negocio/FLUXO-DE-COMPRA-DE-BRUTO.md` |
| Pessoas (dados reais) | `docs/setores/materiais-e-estoque/pessoas.local.md` (só neste PC) |
| Integração com os outros setores | `docs/negocio/INTEGRACAO-ENTRE-SETORES.md` |

Código das telas: `pages/ComprasEstoque.js`, `pages/CadastroPecas.js`.

## 5. Em aberto (principais)
- Pedidos de bruto e de banho.
- Retirar ouro.
- O que é peça "de luxo" e como se calcula o markup.
- Lista completa: `pendencias.md` desta pasta (8 itens, a revisar com o Marcus).

## 6. Regra de trabalho
Mudou uma regra? Atualize (1) o sistema, (2) `decisoes.md` desta pasta e o diário geral, no mesmo dia, (3) o painel: `node scripts/gerar-painel-documentos.mjs`.
