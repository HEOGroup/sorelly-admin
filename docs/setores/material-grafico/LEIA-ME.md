# Setor Material gráfico

Resumo para ler primeiro. Valores, quantidades e o contato do fornecedor ficam em `levantamento.local.md` (fora do Git, o repositório é público). Pendências em `pendencias.md`; decisões em `decisoes.md`; renomeações de dados em `renomeacao-18-11-2026.md`.
**Estado em 18/11/2026: fase 1 pronta e em uso na pasta local; ainda não está na master. Fases 2 (Kits) e 3 (Vendas) a fazer.**

## 1. A ideia
O gasto com material gráfico é grande (tags, adesivos, etiquetas, bolsinhas, envelopes, maletas, blocos de trocas). O Marcus quer um setor próprio para comprar, negociar, controlar o estoque e, depois, montar kits e vender esse material.
Fornecedor principal: **Office Graff** (contato: Edson; ver `levantamento.local.md`).

```
Novo material → Orçamento (negociação) → Solicitado ao financeiro → Produzindo → Estoque
```

## 2. Menu (palavras diretas, sem lista dentro de lista)
| Menu | Estado | O que é |
|---|---|---|
| Painel | pronto | Kanban de cards por etapa e por nível de estoque (seção 3) |
| Compras | pronto | Funil de orçamentos: modelos por tipo, mensagem para copiar no chat, rodadas de negociação, fecha e cria o pedido |
| Tabela de preços | pronto | A tela de Materiais & Estoque (preço por faixa e prazo) |
| Estoque | pronto | O Estoque de material filtrado nas categorias gráficas |
| Kits | fase 2 | Kit padrão (com custo) e kit à venda (preço e margem) |
| Vendas | fase 3 | Venda de material gráfico |
A aba Catálogo existiu em 17/11 e foi EXCLUÍDA em 18/11/2026 (as fotos e os dados ficam, usados pelo Painel).

## 3. Painel (`/grafico-painel`)
Colunas, da esquerda para a direita:
| Coluna | Regra |
|---|---|
| Não pedir mais (1ª, oculta ao abrir; botão Mostrar/Ocultar) | Material parado no estoque. Pode voltar a ser pedido: é só reativar em Materiais & Estoque |
| Novos materiais | Produto novo sem material no estoque e sem orçamento (lista em `domain/catalogo-grafico.js`, campo `novo`) |
| Solicitado ao financeiro | Pedido esperando aprovação e orçamentos abertos |
| Produzindo | Pedido aprovado, em transporte ou recebido |
| Sem estoque / Abaixo do mínimo / Perto do mínimo (até 130% do mínimo) / Estoque OK | Só materiais SEM pedido aberto. Quem tem pedido aparece nas colunas do fluxo, com o nível de estoque no card |
Todos os cards têm o mesmo desenho: foto (altura toda do card), nome padronizado em 2 linhas, 3 blocos com linhas alinhadas (nome, números, situação), efeito de botão. Clicar abre o pedido, o orçamento ou a foto grande.
Faixa de cima: Tipo, Modelo, Foto (com e sem), Coluna, Ordenar, Fechar colunas vazias, Mostrar não pedir mais, Limpar. Fonte 11 px.
Classificações (Tipo): Tags, Embalagens de presente (bolsinhas, sacolas, envelopes, caixas de presente), Maletas, Embalagens plásticas, Etiquetas, Cartões e blocos, Adesivos e cordinhas.

## 4. Onde está o código
- `pages/MaterialGrafico.js` (as telas), `domain/material-grafico.js` (modelos, mensagem, regras do funil), ações `orc_*` em `domain/compras-estoque.js` (estado `s.ce.orcamentos`, sincroniza junto com o módulo `ce`).
- `domain/catalogo-grafico.js`: modelos com foto (61 do PDF "Tags e Adesivos" mais as bolsinhas e o envelope), `REF_FOTO` (foto de referência de modelo parecido), nome padronizado (`nomePadrao`), modelo (`modeloDoNome`), tipo (`tipoDoMaterial`), novos materiais. Fotos em `public/material-grafico/`.
- O estoque, os pedidos e a Tabela de preços são os de Materiais & Estoque (`s.ce`): o setor só lê e usa.
- Teste das regras: `node scripts/testar-material-grafico.mjs`.
- Configurações do setor NÃO têm tela: vão para o Configurador geral.

## 5. Padronização dos nomes
Padrão Item · Modelo · Tamanho · Cor · Linha. Exemplo: `TAG MAN | MINI | AZUL | PADRÃO` aparece como "Tag Man / Mini" e "Azul / Padrão". BB Select é linha. O coração só existe em Mini. A Floréa é uma tag só (Conjunto). Os nomes ligam estoque, pedidos e preços: trocar sempre tudo junto e registrar em `renomeacao-18-11-2026.md`.

## 6. Atenção
- O banco é o mesmo da produção: testar na pasta local grava de verdade.
- Fotos de bolsinhas e sacolas ficam reduzidas (800 px) para a tela ficar leve.
