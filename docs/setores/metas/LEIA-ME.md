# Metas das revendedoras

Setor novo (02/11/2026). Meta por revendedora, mês a mês, com brinde extra para quem bate. Substitui as metas do admin antigo (descartadas em 16/10/2026).

## Fluxo
```
Média das 3 últimas vendas (antes do mês)  →  Classe  →  Meta 1 e Meta 2
        →  Acerto fecha  →  Bateu?  →  Brinde extra (BB e Normal) somado ao brinde do acerto
```

## Regras
| Item | Regra |
|---|---|
| Quem entra | Revendedoras com condicional de KIT aberta (2.047 em 02/11/2026). Quem só tem condicional de expositor (67) fica de fora |
| Meta vale para | O PRÓXIMO ACERTO da condicional aberta principal, em qualquer data (quem acerta em dezembro continua com a meta de novembro) |
| Resultado | Valor do PRIMEIRO acerto desde o dia 1 do mês da campanha (mesmo dia junto, sem brinde) |
| Média | 3 últimas vendas ANTES do mês, regra de 27/10 (`docs/negocio/MEDIA-DE-VENDAS.md`) |
| Kit novo e médias até R$ 999,99 | Duas linhas separadas, mesma meta: Kit novo = nunca vendeu (266); Inicial = média abaixo de R$ 1.000 (866). Meta 1 = R$ 1.500, Meta 2 = R$ 2.000 |
| Faixas | Cada categoria tem Meta 1 e Meta 2 definidas na tabela da tela Regras (valores redondos; ver `docs/DECISOES.md`, "Metas subidas") |
| R$ 7.000 ou mais | Meta individual: média +20% e +40% |
| Valores do brinde extra | Só estes (sempre R$ 4,00 a menos que um valor de brinde da Sorelly: 68, 88, 96, 112, 122, 128, 132, 144, 168, 188, 212, 232, 242, 262, 282, 312, 322, 368, 422): 64, 84, 92, 108, 118, 124, 128, 140, 164, 184, 208, 228, 238, 258, 278, 308, 318, 364, 418 |
| Brinde extra (padrão) | R$ 1.500: BB 128 e Normal 96 · R$ 2.000: BB 168 e Normal 122 · entre os dois, em linha reta |
| Virada de campanha | Quem NÃO acertou mantém a meta da campanha anterior; a campanha nova só vale para quem já acertou e para quem recebeu condicional nova |
| Mês a mês | Cada mês tem a sua campanha em `domain/metas.js` (`CAMPANHAS`); dezembro nasce como cópia de novembro |

## Onde ficam as coisas
| O quê | Onde |
|---|---|
| Regras e contas | `src/apps/montagem/domain/metas.js` |
| Servidor (lê DevMaster e banco, só leitura) | `src/server/metas.js`, rota `/api/metas/revendedoras` |
| Tela | `src/apps/montagem/pages/MetasRevendedoras.js` (`/metas/revendedoras`) |
| Editar metas e brindes | Tela Regras, botão Editar (grava no módulo `metas`, chave `campanhas`) |
| Outras telas | `MetasAcompanhamento.js`, `MetasBrindes.js` (kanban), `MetasHistorico.js`, `MetasRegras.js`; dados em `lib/metas-dados.js` |
| Bloco de resumo | `src/apps/montagem/components/bloco-resumo.js` |
| Protótipo aprovado | `docs/ideias/metas-tela-1.html` |

## Quem vê
Só a Diretoria, por enquanto. A supervisão do acerto vai ver Revendedoras e Brindes; a representante, só as dela (decidir com o Marcus).
