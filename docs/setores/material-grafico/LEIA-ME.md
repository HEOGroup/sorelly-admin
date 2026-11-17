# Setor Material gráfico

Resumo para ler primeiro. Detalhes de fornecedor, quantidades e fotos ficam em `levantamento.local.md` (fora do Git, o repositório é público). Pendências em `pendencias.md`; decisões em `decisoes.md`.
**Estado em 17/11/2026: fase 1 pronta (base). Fases 2 e 3 a fazer.**

## 1. A ideia
O gasto com material gráfico é grande (tags, adesivos, etiquetas, bolsinhas, envelopes, maletas, blocos de trocas). O Marcus quer um setor próprio para comprar, negociar, controlar estoque, montar kits padrão e VENDER o material.

```
Orçamento (mensagem no chat) → Negociando (rodadas) → Fechado → Pedido (Materiais & Estoque) → Estoque
```

## 2. Menu (6 palavras, sem lista dentro de lista)
| Menu | Estado | O que é |
|---|---|---|
| Painel | pronto | Uma tabela só com o que está andando: orçamentos abertos, pedidos gráficos em andamento e materiais gráficos críticos. |
| Compras | pronto | Funil de orçamentos. "Novo orçamento" usa um modelo por tipo de material e copia a mensagem para o chat. A ficha guarda as rodadas de negociação, fecha e cria o pedido. |
| Tabela de preços | pronto | A mesma tela de Materiais & Estoque (preço, faixa e prazo de entrega por produto). |
| Estoque | pronto | O Estoque de material filtrado nas categorias gráficas. |
| Kits | fase 2 | Kit padrão (dentro do kit da revendedora, com custo) e kit à venda (preço e margem). |
| Vendas | fase 3 | Venda de material gráfico. |

## 3. Onde está o código
- `pages/MaterialGrafico.js` (as 6 telas), `domain/material-grafico.js` (modelos, mensagem, regras do funil), ações `orc_*` em `domain/compras-estoque.js` (estado `s.ce.orcamentos`, sincroniza junto com o módulo `ce`).
- Teste das regras: `node scripts/testar-material-grafico.mjs`.
- Compras e estoque continuam em Materiais & Estoque; este setor só lê e usa os pedidos.
- Configurações do setor NÃO têm tela: vão para o Configurador geral.
