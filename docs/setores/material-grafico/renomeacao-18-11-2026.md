# Renomeação dos nomes do material gráfico (18/11/2026)

Feita pela API do módulo `ce`, só nos itens que mudaram (versões 902 a 903, e 932 a 933). Para desfazer: trocar o nome novo pelo antigo nas listas materiais, precos, pedidos e logMateriais. Nada foi apagado. Quantidades e contagens ficam em `levantamento.local.md`.

## Parte 1: erros de escrita e caixa
| Antes | Depois | Onde |
|---|---|---|
| TAG PRATA (MEDIA) | TAG PRATA (MÉDIA) | material |
| Tag coração vermelho | TAG CORAÇÃO VERMELHO | material |
| Sacola mini | SACOLA MINI | material |
| Cartão garantia | CARTÃO GARANTIA | material |
| Caixa presente (pequena e grande) | CAIXA PRESENTE (PEQUENA) e (GRANDE) | material |
| BB SELLECT | BB SELECT | material, preço, pedidos |
| TAG MAN MINI / MINI / AZUL / PADRÃO | TAG MAN / MINI / AZUL / PADRÃO | material, preço, pedidos |
| TAG PULSEIRA OURO / MEDIA / OURO (PINK) (Hot e Padrão) | MÉDIA | preço |

## Parte 2: o coração só existe em Mini
| Material (id) | Antes | Depois |
|---|---|---|
| 509, 511, 513, 515 | Média vinho, rosa, prata e vermelha (Padrão) | Mini vinho, rosa, prata e vermelha (Padrão) |
| 505 e 507 | Mini vinho e Mini rosa antigos (sem estoque, pedidos cancelados) | Marcados como (DUPLICADO) e parados |
| 517, 519, 521 | Média Premium vinho, rosa e prata | Marcados como (DUPLICADO) e parados |
Também trocados: pedidos 1933, 1936 e 1939 (o 1939 estava ligado ao material Premium 517 e passou para o 509) e 4 linhas da Tabela de preços (ids 1259, 1267, 1275 e 1283). Ficou de fora: "TAG CORAÇÃO VERMELHO" (id 255, parado) e as linhas de preço Pequena e Premium.

## Parte 3: Floréa e Flower
Floréa e Flower foram marcadas como paradas (coluna Não pedir mais). O estoque da Flower ainda é um material só e precisa ser separado por cor.
