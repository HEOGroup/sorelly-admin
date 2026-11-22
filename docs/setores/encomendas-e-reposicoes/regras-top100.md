# Top 100 · regra de acesso ao setor Encomendas (proposta de 18/11/2026)

Dados de pessoas NÃO ficam aqui. A tabela real do Top 100 e as fichas das 20 maiores ficam só em arquivos locais (`*.local.*`, fora do Git).

## 1. Por que existe

A lista de acesso (Top 50 hoje, Top 100 daqui para frente) é importada à mão da planilha. Quem não está na planilha **sai na hora**, mesmo com peça já separada (caso real: uma revendedora na posição 101 foi excluída com pedido separado). A regra abaixo troca isso por um ranking automático com proteção.

## 2. Ranking

| # | Regra |
|---|---|
| 1 | Roda **1 vez por mês, no dia 1º**, de forma automática. |
| 2 | Conta o **total de vendas dos últimos 3 meses fechados**, sem brinde, troca, indicação e prêmio. Mesma regra da média de vendas (acertos do mesmo dia somam, dia zerado não conta, Leilão/EK fora). |
| 3 | Empate: vale o maior valor do último acerto; depois, o acerto mais recente. |
| 4 | Revendedora com menos de 3 meses de vendas entra com o que tiver; a diretoria decide se ela entra à mão. |

## 3. Estados

| Estado | Quando | Efeito |
|---|---|---|
| **Ativa** | Posição 1 a 100 | Abre pedidos e acessa tudo |
| **Protegida** | Já tinha acesso e está na posição 101 a 150 | Igual à ativa |
| **Em saída** | Tinha acesso e ficou fora do 150 no 1º mês | Continua com acesso e recebe aviso |
| **Saiu** | Fora do 150 por **2 meses seguidos** e sem pedido aberto | Não abre pedido novo; ficha e histórico ficam |
| **Sem acesso** | Nunca teve acesso e está na 101 a 150 | Só entra ao chegar ao Top 100 |

Quem volta ao Top 100 vira Ativa no mesmo dia, sem refazer cadastro.

## 4. Proteções

| # | Regra |
|---|---|
| 5 | **Pedido aberto ou peça separada = nunca sai.** Estado "Mantida por pedido" até concluir. |
| 6 | **Funcionária não exclui revendedora da lista.** Só o ranking automático muda a lista. |
| 7 | Quem sai não perde ficha, histórico nem pedidos; ganha a marca "Saiu em mês/ano". |
| 8 | O aviso de saída vai para a revendedora e para a representante dela. |

## 5. Exceções (só a diretoria: Marcus, Nickolas e Lucas)

| # | Regra |
|---|---|
| 9 | Liberar uma revendedora fora da lista: com **motivo escrito** e **data de fim** (máximo 3 meses). |
| 10 | Tirar alguém da lista antes da hora: também com motivo escrito. |

## 6. Histórico

Cada mudança grava quem (ou "ranking automático"), quando, estado anterior, estado novo, posição e motivo. Cada ranking mensal fica salvo inteiro.

## 7. Números da análise de 18/11/2026 (sem nomes)

| Item | Valor |
|---|---|
| Janela | 18/08/2026 a 18/11/2026 |
| Corte do 100º lugar | R$ 8.158,00 (total de 3 meses) |
| Troca em 1 mês (janela deslocada 1 mês) | 31 saíram do Top 100 e 31 entraram |
| Dos 31 que saíram, ainda perderiam o acesso com proteção até o... | 120º: 20 · 130º: 19 · **150º: 16** · 170º: 10 · 200º: 8 |

## 8. Ainda em aberto

1. Aviso de saída por WhatsApp, app ou os dois?
2. Quem confere a lista no dia 1º?
3. "Pedido aberto" conta desde o 1º item separado ou só após confirmado?

## 9. Estado da tela

Existem duas telas em Encomendas: **Top 100** (`pages/encomendas/Top50.js`: regras no topo, coluna Posição, lista, Pedidos ao Marcus, Entradas e saídas, Importar lista, Aprovar lista do mês) e **Ranking** (`pages/encomendas/Ranking.js`, dados de `src/server/encomendas-ranking.js`: classificação por total de 3 meses, posição de 1 mês atrás, se está na lista e a situação Ativa, Entrar, Protegida, Sem acesso ou Em saída; só leitura). Falta ligar o ranking à lista (entrada e saída automáticas no dia 1º) e os estados dentro da lista.

## 10. Fonte dos números

Vendas: tabela `sorelly.venda_composicao` (carga da DevMaster, só leitura). Preço de peça nas fichas: preço de tabela (`aci_valorbase` da `dmaci`), pois o acerto é cobrado a 50% dele.
