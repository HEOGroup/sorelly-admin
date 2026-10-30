# Fluxo de compra de bruto (do pedido até a produção)

Texto do Marcus de 29/10/2026, reescrito em frases curtas. Atualizar ao decidir algo novo.
Telas: Cadastro de peças › Pedidos de bruto, Controle do mês, Faturas Pontual/Ellos, Planilhas de cadastro. Teto de gasto: Financeiro › Pagamentos a fornecedores › Resumo do mês.
Dados reais dos pedidos: só em `src/apps/montagem/domain/cadastro-pecas.local.js` (fora do Git).

## 1. Visão geral

```
ESCOLHA ─► SEPARAÇÃO ─► ROMANEIO ─► FECHA O PEDIDO ─► BANHO ─► VOLTA ─► PESO ─► CADASTRO ─► PREÇO ─► ETIQUETA ─► PRODUÇÃO
(Marcus)   (fornecedor)  (fornecedor)  (Marcus)      (Pontual   (7 a 10  (Sorelly) (Rayssa)   (Marcus)  (Rayssa)   (Sorelly ou
                                                      ou Ellos)  dias)                                              Serenity)
```

## 2. Etapa por etapa

| # | Etapa | Quem faz | Como é hoje |
|---|---|---|---|
| 1 | Escolher as peças | Marcus (e Marina, em SP) | Fotos e catálogos. Marcus tira print e manda no WhatsApp, ou responde a foto marcando e dizendo a quantidade. |
| 2 | Separar o pedido | Fornecedor | O vendedor do fornecedor separa as peças (Xangai: o vendedor Mauro). |
| 3 | Gerar o romaneio | Fornecedor | O fornecedor envia o romaneio do pedido. |
| 4 | Fechar o pedido | Marcus | Confere o romaneio e fecha. O pedido segue para o banho. |
| 5 | Banho: separar | Pontual ou Ellos | A galvânica separa e manda foto com a quantidade de peças por modelo. |
| 6 | Dizer o banho | Marcus | Salva as fotos e reenvia no WhatsApp com o banho de cada modelo: Ouro 1, Ouro 3, Prata etc. |
| 7 | Banho: fazer | Pontual ou Ellos | Leva de 7 a 10 dias. Depois envia as peças para a Sorelly. |
| 8 | Receber e pesar | Equipe da Sorelly | Tirar do plástico, pôr no ziplock e pesar. |
| 9 | Cadastrar | Rayssa | Lança na planilha e manda foto no WhatsApp para o Marcus. |
| 10 | Definir preço, tag e código | Marcus | Responde a foto com o preço, a tag e o código. |
| 11 | Gerar etiqueta | Rayssa | Depois do preço definido. |
| 12 | Produção | Sorelly ou Serenity | A peça vai para a produção. Pode ser feita na Sorelly ou na produção da Serenity. |

## 3. Fornecedor de bruto e banho de cada um

| Fornecedor de bruto | Banho | Como o Marcus pede |
|---|---|---|
| **Point** | Pontual | Prints no WhatsApp, ou resposta marcando a foto com a quantidade. Também recebe catálogo. |
| **Mega Sul** | Pontual | Igual à Point. Catálogo; na maioria, fotos no WhatsApp. Marcus salva ou responde a foto com o preço. |
| **Xangai** | Ellos (hoje) | Catálogo em PDF. Marcus manda print e o vendedor Mauro separa. |
| **Art Ello** | Ellos (100% das vezes) | Fotos ou catálogos. É do mesmo grupo da Ellos. |
| **Linda** (o Marcus chama de "Lin") | Ellos (agora) | Tem Linda do 2º andar e Linda do 7º andar. É o mesmo dono. A Marina compra lá em São Paulo para a Sorelly. |
| **Tucano** | Ellos | Hoje compra pouco. Marcus acha que o banho da Ellos é mais barato. |
| **Charme** | Ellos | Igual ao Tucano. |

Regra: cada pedido vai para UM banho só (Pontual OU Ellos). Quem decide é o fornecedor do bruto, pela tabela acima.
Ellos e Art Ello são do mesmo grupo, mas são duas empresas. Nunca juntar uma com a outra nos números (ver `RELATORIO-DE-CUSTOS.md`).

## 4. Dores de hoje

- O valor da compra é difícil de conferir: a escolha vem em print e em foto, sem preço junto.
- A compra é aleatória: não há plano de quanto comprar de cada tipo de peça.
- O Marcus quase quebrou comprando sem controle (relato de 29/10/2026).
- Tudo passa pelo WhatsApp: foto, banho, preço e tag. Nada fica registrado num lugar só.

## 5. O que o sistema já tem (conferido em 29/10/2026)

| Parte do fluxo | Onde está | Situação |
|---|---|---|
| Pedido de bruto (fornecedor, romaneio, chegadas, status, peças por categoria) | Cadastro de peças › Pedidos de bruto | Pronto. 138 pedidos de 12/01 a 19/10/2026. |
| Total comprado por mês | Cadastro de peças › Controle do mês | Pronto. |
| Fatura de banho ligada ao pedido | Cadastro de peças › Faturas Pontual e Faturas Ellos | Pronto. 88 Pontual e 15 Ellos. |
| Peso, banho, custo, preço sugerido, markup | Cadastro de peças › Calculadora e Planilhas de cadastro | Pronto. 5 planilhas lidas. |
| Teto de gasto (bruto R$ 100 mil; banho R$ 150 mil; serviços R$ 50 mil) | Financeiro › Pagamentos a fornecedores › Resumo do mês | Pronto. |
| Etapas em quadro (kanban): escolha → fechamento → banho → chegada → cadastro → produção | — | NÃO existe. Só anotado em 16/10/2026. |
| Plano de compra (quanto comprar de cada categoria) | — | NÃO existe. |
| Preço visível na escolha da peça | — | NÃO existe. |

## 6. A confirmar com o Marcus

- Banho Ellos x Pontual: conferi as tabelas das faturas. A Ellos é mais barata na maioria dos tipos de ouro e na prata; a Pontual é mais barata no Ouro 1 e cobra verniz a mais no ouro. Os valores por grama ficam em `FLUXO-DE-COMPRA-DE-BRUTO.local.md` (fora do Git). Falta o Marcus confirmar.
- A Linda fica em São Paulo? A Marina compra lá? (o Marcus ainda não respondeu)
- Qual é a regra para uma peça ir para a produção da Sorelly ou da Serenity?
- A aba "Brutos Pedidos" da planilha nova tem pedidos depois de 19/10/2026? A aba "2910 (Ellos)" é a única posterior a 19/10 pelo nome.

## 7. Próximas partes (uma de cada vez, pedido do Marcus)

1. Pedidos (esta parte): fluxo gravado; falta atualizar os dados da planilha nova.
2. Banho: tabelas Pontual e Ellos, verniz, faturas.
3. Fornecedores: contato, vendedor, forma de pedir, prazo e condição de pagamento.
4. Cadastro e preço: peso, tag, código, etiqueta.
5. Produção: Sorelly x Serenity.

## 8. Respostas do Marcus (29/10/2026, segunda rodada)

| Assunto | Resposta |
|---|---|
| Preço na foto | O fornecedor manda o preço junto da foto. Exemplo da Point: **7/90 = R$ 7,90** (a confirmar). Cada peça tem um desconto próprio: 25% em umas, 15% em outras. |
| Peso na foto | A foto traz o código (ex.: L0056, CH5480) e o peso (ex.: 5,8 g). |
| Quantidade por modelo | De 20 a 200 no máximo. Peça de luxo: 5 a 10. Peça que vende bem e dá boa margem: cerca de 400 (pares, ou unidades em colar, pulseira e anel). |
| Quem escolhe | O Marcus. Outras pessoas mandam print nos grupos, mas ele confirma tudo. |
| Controle | Hoje é "100% aleatório". Esse é o problema a resolver. |
| Quando fecha o pedido | No **romaneio**. A Point recebe vários pedidos no mês. No fim do mês fecha-se um valor total e o Nickolas negocia. |
| Prazo do fornecedor | Depende. Mauro (Xangai): até 5 dias. Point: fica ao lado da Pontual, em Guaporé. Fecha o pedido, gera o romaneio e já liberam. |
| Destino do bruto | Sempre direto do fornecedor para o banho (entendido assim; a confirmar). |
| Quem escolhe o banho | O Marcus. Regras: **brinco = ouro flash + verniz**; **pulseira, colar e tornozeleira = Ouro 3**. Na Pontual (contato: Valdir) pode ter verniz ou não, com um verniz especial. Existem mais regras (a levantar). |
| Perda no banho | Pequena. Às vezes o banho devolve menos: de 200 pares, voltam 180 e o saldo vem depois. |
| Por que Xangai e Linda foram para a Ellos | Preço: melhor negociação. |
| Pagamento | Todos os CNPJs compram. Sempre uma parte é **nota** e outra parte é **Pix**: dois formatos de pagamento por pedido. |

## 9. Proposta de estrutura (rascunho, aguardando o Marcus)

Modelo: o menu do Financeiro (palavras no topo, listas em cascata, na ordem do fluxo) e o guia `docs/prompts/PROMPT-MESTRE.md` (seções 6 a 9: autorizações, histórico, plano de pagamento, casos de borda). O visual vale o `PADRAO-VISUAL.md` (13 px, 32 px), que é mais novo que o prompt mestre.

Duas filas separadas, porque o pedido e a peça andam em ritmos diferentes:

```
PEDIDO (compra)                          LOTE DE CADASTRO (volta do banho)
Escolha ► Romaneio ► Fechado ► Banho     Chegou ► Pesagem ► Cadastro ► Preço ► Etiqueta ► Produção
                              └─ volta do banho vira um lote ─┘
```

| Palavra do menu | Telas | O que a planilha vira |
|---|---|---|
| **Compras** | Plano do mês (teto, comprado, folga por fornecedor), Escolha (foto, preço, desconto, quantidade), Controle do mês | Abas "Brutos Pedidos", "Pontual Pedidos", "Ellos Pedidos" |
| **Pedidos** | Quadro por etapa (Escolha, Romaneio, Fechado, Banho, Chegou); ficha do pedido em janela | Linhas dos pedidos |
| **Banho** | Pontual, Ellos: tabela de preço, regras de banho por tipo de peça, faturas, saldo pendente | Abas das faturas e tabelas de preço |
| **Lotes** | Quadro por etapa (Pesagem, Cadastro, Preço, Etiqueta, Produção); Calculadora dentro do lote | Abas por data ("1910 (Ellos)" etc.) e "Peças Cadastradas" |
| **Fornecedores** | Ficha: vendedor, banho de destino, prazo, desconto, forma de pedir | Fornecedores avulsos |
| **Pagamento** | Nota × Pix por CNPJ; envio ao Financeiro › Fornecedores | Parte de pagamentos |
| **Ouro** | Retirar ouro e controle mensal | Abas "Retirar Ouro" e "Controle Mensal - Retirar Ouro" |
| **Config** | Regras de banho, tetos, quem lança, quem aprova | Aba "Configuracoes" |

Fora do setor: "Estoque" (vai para Financeiro › Estoque Sorelly). A conferir se vão para arquivo: "Promo 2.000 peças", "Porta Joias Flanelas", "Linda Pontos de Luz", "Franciel", "Max Steel Aços" e as abas de datas antigas.

Autorizações novas (a definir): lançar pedido, fechar pedido, aprovar acima do teto, definir preço, liberar para a produção.
Nada disto foi construído. O sistema de hoje continua como está.

## 10. Tela Pedidos: layout escolhido (29/10/2026)

Quadro e Planilha juntos, com o seletor Quadro | Planilha (igual aos Kits novos). Rascunho: `docs/rascunhos/pedidos-bruto-quadro-planilha.html`.
Etapas do pedido: **Escolha, Separação, Fechado, Banho, Chegou** (a etapa "Romaneio" da seção 9 virou Separação, porque o pedido fecha no romaneio). Prazos de partida, a confirmar: Separação 5 dias, Fechado 2 dias, Banho 10 dias.
Faixa de totais: Abertos, Comprado, Folga do teto, No banho, Atrasados, Peças. Filtros: busca, fornecedor, banho, CNPJ pagador, situação, mês.
Próximas telas, uma por vez: Compras (escolha da peça com preço), Banho, Lotes, Fornecedores, Pagamento, Ouro, Config.

## 11. Estrutura do setor, corrigida pelo Marcus (29/10/2026)

O Marcus corrigiu a seção 9. O setor precisa de: uma **tela mãe** que mostra o fluxo dos pedidos; uma tela para **montar o pedido** (fazer a compra); uma para **escolher o banho**; e uma para **definir as regras**. A visão é um sistema **ponta a ponta** com os fornecedores: em vez de mandar foto no WhatsApp, o fornecedor sobe as fotos no sistema e elas viram um **catálogo**. O banho vai sendo dado e o sistema mostra o **valor previsto do banho**.

```
FORNECEDOR sobe fotos ► CATÁLOGO ► MONTAR PEDIDO ► PEDIDOS (tela mãe) ► BANHO ► CHEGADA ► PREÇO ► PRODUÇÃO
 (peso, preço, código)   (filtrar,    (carrinho por   (quadro/planilha,  (escolher    (pesar,     (markup)
                          escolher)    fornecedor,     etapas, atraso)    banho, valor cadastrar)
                                       teto, banho)                       previsto)
                                   └──────────────────────  REGRAS (define tudo)  ──────────────────────┘
```

| Tela | Função | Situação |
|---|---|---|
| **Pedidos** (mãe) | Acompanha todos os pedidos por etapa: Escolha, Separação, Fechado, Banho, Chegou | **Pronta no sistema** (29/10/2026) |
| **Catálogo** | Fotos dos fornecedores com código, preço, peso e categoria. Filtro por fornecedor, categoria, preço e peso. Marca a peça e a quantidade. | A desenhar |
| **Montar pedido** | Carrinho por fornecedor: peça, quantidade, preço de tabela, desconto, peso. Mostra total, a pagar, folga do teto e banho previsto. Gera o pedido já na etapa Escolha. | A desenhar |
| **Banho** | Escolher o banho (Ouro 1, Ouro 3, Prata, verniz) por categoria, com ajuste por peça. Mostra o valor previsto do banho por galvânica (peso × R$/g da tabela). Compara previsto com a fatura real. | A desenhar (tabelas e faturas já existem) |
| **Chegada** | Receber, pesar, cadastrar, definir preço e etiqueta | Existe (Lotes e Calculadora); falta ligar ao pedido |
| **Fornecedores** | Cadastro e, na fase 2, o acesso do fornecedor para subir o catálogo | Existe o cadastro simples |
| **Regras** | Banho por categoria (brinco = ouro flash + verniz; pulseira, colar e tornozeleira = Ouro 3), banho de cada fornecedor, prazos, tetos, quantidade padrão (20 a 200; luxo 5 a 10), quem lança e quem aprova | A desenhar |

Contas que o sistema passa a fazer sozinho: **bruto** (preço do catálogo × quantidade, menos o desconto da peça) + **banho previsto** (peso × R$/g do banho escolhido, mais verniz) = **custo previsto**, antes de comprar. A Calculadora de hoje já faz essa conta depois da compra.

Fases, para não entregar pela metade:
1. **Interna:** a equipe (Rayssa e Graziella) sobe as fotos do fornecedor no Catálogo. Catálogo, Montar pedido, Banho previsto e Regras.
2. **Portal do fornecedor:** o fornecedor entra e sobe as fotos. Precisa de acesso externo seguro e de guardar fotos no servidor: falar com o Leonardo antes.
3. **Plano de compra:** o sistema cruza com as vendas e diz quanto comprar de cada categoria.

Dúvidas abertas: o preço, o peso e o código vêm digitados por quem sobe a foto, ou o sistema lê o texto escrito na foto? O "7/90" é R$ 7,90? Banhado e Finalizado contam como Chegou (suposição)?

## 12. Tela Montar pedido: regras do desenho (29/10/2026, a confirmar)

Quatro layouts desenhados em `docs/rascunhos/montar-pedido-4-layouts.local.html` (arquivo local: tem foto e preço reais). Cada foto do fornecedor já traz código, preço (ex.: 7/90) e peso, e o sistema usa isso para calcular antes de comprar:

```
bruto com desconto da peça  +  peso × R$/g do banho escolhido  =  custo previsto por peça
```

Regras: desconto próprio por peça (25% ou 15%); quantidade de 20 a 200 por modelo (aviso acima de 200: só peça campeã); banho sugerido pela categoria (brinco: Ouro 1 com verniz; colar, pulseira e anel: Ouro 3), com ajuste por peça (a de prata troca para Prata); uma compra com vários fornecedores gera um pedido por fornecedor, cada um indo para a galvânica do fornecedor; a folga do teto de bruto aparece o tempo todo, e passar do teto deixa o pedido pendente de aprovação. Peça sem foto aparece como "Sem foto".
Próxima tela: **Catálogo** (o fornecedor sobe as fotos; a equipe confere código, preço e peso).
