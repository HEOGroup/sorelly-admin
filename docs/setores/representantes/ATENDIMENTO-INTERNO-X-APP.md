# Atendimento interno x App da representante (auditoria de 24/11/2026)

Só leitura do código e dos diários. Nada foi alterado no sistema. Base: `docs/DECISOES.md`, `docs/arquivo/regras-historico/pages-atendimento-retornos-e-kit-novo-out-2026.md`, `docs/setores/representantes/ANALISE-APP-NO-ADMIN-23-11-2026.local.md` (análise de 23/11, usada como pista e conferida de novo quando possível).

## 1. Como ler

| Status | Significado |
|---|---|
| Já tem | O app faz igual ao interno. |
| Parcial | O app tem uma parte, ou faz diferente. |
| Falta | O app não tem. |
| Não se aplica | A regra é só de quem atende na empresa. |
| Não confirmado | Não consegui provar no código. |

Ponto importante: o interno e o app usam a MESMA conta (`derivarAcerto` em `domain/acerto-derivado.js`). Por isso a maioria das regras de dinheiro já chega ao app. O que falta está na TELA do app e no fluxo ao redor.

Arquivos do app: `src/apps/montagem/mobile/representante.js` (R), `pre-acerto-rep.js`, `pedido-data-rep.js`, `assinatura.js`, `links-pagamento-app.js`, `cartao-pix-conta.js`. Interno: `pages/AtendimentoInternoCalculadora.js` (AI).

## 2. Tabela principal

### 2.1 Chegada e tempo

| Nº | Data | O que o Atendimento interno ganhou | No app da representante | Prova | Esforço |
|---|---|---|---|---|---|
| 1 | 28/10 | Agenda com limites: 3 por horário, 15 por dia, 08h às 18h, sábado só até 10h, domingo fechado | Não se aplica (a agenda é da Tamara) | `domain/revendedoras-internas.js` `motivoNaoMarcar` | - |
| 2 | 05/10 | Chegou mais de 30 min depois do horário: perde 10% do brinde | Não se aplica (a representante vai até a revendedora) | `domain/atendimento-interno.js:5-6` | - |
| 3 | 19/11 | A funcionária pode isentar o desconto por atraso de chegada | Não se aplica | AI:258 | - |
| 4 | 05/10, 09/11 | Relógio da escolha do kit e textos lidos em voz alta | Não se aplica | `atendimento-interno.js:9-24` | - |
| 5 | 05/10 | Até 2 atendimentos abertos e rascunho por atendimento | Não se aplica | `intAbas`, `rascunho` | - |
| 6 | 11/11, 16/11 | "Incluir cliente" e "Chegou sem agendar" sem falar com a agendadora | Parcial: a representante tem Nova listagem, mas não conferi se aceita revendedora fora da lista | `mobile/nova-listagem-rep.js` (não lido por inteiro) | Pequeno |
| 7 | 28/10 | Registro de contatos por revendedora, com opções | Não se aplica (é da agendadora) | `revendedoras-internas.js` `parseObs` | - |

### 2.2 Tipos de atendimento

| Nº | Data | O que o Atendimento interno ganhou | No app da representante | Prova | Esforço |
|---|---|---|---|---|---|
| 8 | 11/11 | Tipos em menu: Acerto, Kit retornando, Kit novo, Brinde de indicação, Reposição, Troca de peça. Os simples têm uma etapa só | Parcial: tem acerto, kit novo e reposição. Não achei kit retornando simples nem troca de peça avulsa | R:955 (`REPOSICAO_ENTREGAR`) | Médio |
| 9 | 11/11 | Venda R$ 0,00 ("Não teve venda") vai direto a Finalizar, sem regras e sem assinatura. Não renova kit | Falta: o app segue o fluxo todo, com assinatura | AI:270, AI:797. Busca por "Não teve venda" no R: nada | Pequeno |
| 10 | 16/11 | "Renova outro dia": cliente que não quis renovar fica com data obrigatória | Falta | AI:766 (`renovaDia`). Busca em `mobile/`: nada | Pequeno |
| 11 | 28/10 | Segunda condicional bipada depois do kit principal vira "Kit extra" | Não se aplica (o app tem "peças do próximo mês") | `pages/CLAUDE.md` antigo | - |
| 12 | 16/11 | Condicionais da DevMaster entram sozinhas | Já tem | `mobile/conds-reais.js`; análise 23/11 item 11 | - |

### 2.3 Prazo e atraso

| Nº | Data | O que o Atendimento interno ganhou | No app da representante | Prova | Esforço |
|---|---|---|---|---|---|
| 13 | 11/11 | Dias úteis de atraso contados pelo sistema (a Tamara não digita) | Parcial: a conta é igual, mas a representante DIGITA os dias no Pré-acerto | `pre-acerto-rep.js:16`; reducer `KIT_PRE_ACERTO` :920; interno `atrasoUteisDe` AI:286 | Médio (falta a data do primeiro dia marcado no kit) |
| 14 | 11/11 | Escada única: 5 dias úteis sem nada, -1% por dia, Jurídico no 30º. Coluna "Acerto até" com cor | Parcial: o texto e a conta existem; não achei a coluna "Acerto até" no app | `pre-acerto-rep.js:83`; `revendedoras-internas.js:251` `prazoAcerto` | Médio |

### 2.4 Remarcação e multa

| Nº | Data | O que o Atendimento interno ganhou | No app da representante | Prova | Esforço |
|---|---|---|---|---|---|
| 15 | 28/10 | Multa de remarcação 5, 8 e 15 (comissão) e 15%, 50%, 100% (brinde) | Já tem | R:324 (`vez`), reducer:904 | - |
| 16 | 11/11 | Motivo obrigatório (o sistema recusa sem motivo) | Falta: o app grava remarcação com motivo vazio | reducer:907 (`motivo:a.motivo||""`); R:378 e R:1164 chamam com `motivo:""` | Pequeno |
| 17 | 11/11 | Isenção só com quem autorizou e a prova | Falta: só existe "isenta" sim/não e um motivo livre | reducer:907; R:581 | Médio |
| 18 | 11/11 | Remarcar com 10 dias ou mais de antecedência: sem multa, uma vez por ciclo | Falta: busca por "livre" no app não acha nada | `revendedoras-internas.js:259` `remarcacaoLivre`; reducer:907 | Médio |
| 19 | 11/11 | "Não veio" = cancelar, com multa na hora, nunca "livre" | Não confirmado | só documentado em DECISOES 11/11 | - |
| 20 | 11/11 | Nova data em até 5 dias úteis | Não confirmado: existe `pedido-data-rep.js`, não li a regra | `mobile/pedido-data-rep.js` | - |

### 2.5 Pagamentos e Direcionar

| Nº | Data | O que o Atendimento interno ganhou | No app da representante | Prova | Esforço |
|---|---|---|---|---|---|
| 21 | 05/10, 16/11 | Pix, link e cartão pedem a conta ao Direcionar e o comprovante antes de fechar | Já tem (ligado em 23/11) | R:788 (`REP_PAG` pedir); R:937 ("Aguardando a conta do financeiro") | - |
| 22 | 12/11 | Conferência do comprovante no Direcionar | Já tem (o pedido do app segue por ele) | DECISOES 12/11 | - |
| 23 | 17/11 | Chave Pix junto da conta, com Copiar | Já tem | `mobile/cartao-pix-conta.js:33` | - |
| 24 | 12/11 | Vários comprovantes por conta | Falta: 1 por pagamento | R:713-720 | Médio |
| 25 | 20/11 | Comprovante pequeno guardado como imagem | Parcial: o código ainda barra arquivo acima de 400 KB; DECISOES 23/11 diz que a foto é reduzida. Os dois não batem | R:718, R:783 | Pequeno |
| 26 | 16/11 | Link já pago (confirmado pelo e-SiTef) entra SOZINHO como pagamento | Parcial: no app é botão manual | `links-pagamento-app.js:94`; AI:1000 | Pequeno |
| 27 | 11/11 | Pedir link novo à Hellen | Já tem | `links-pagamento-app.js:49-80` | - |
| 28 | 18/11, 19/11 | Pix adiantado da revendedora entra como JÁ PAGO e não gera segundo repasse | Falta | análise 23/11 item 16; busca em `mobile/`: nada | Grande |
| 29 | 24/11 | Pedido de Pix ("Aguardando Pix"): o Lucas completa depois | Falta: DECISOES diz "comprovante pela representante só quando existir o app dela", e o app agora existe | DECISOES 24/11 | Médio |
| 30 | 23/11 | Bandeira e parcelas ao anexar comprovante da Maquininha Banho | Falta (o decisões diz que o pedido do app ainda não pede) | DECISOES 23/11 (`sincMqBanho`) | Pequeno |
| 31 | 20/11 | Todo pagamento do acerto cai em Contas a receber | Já tem | DECISOES 20/11 | - |
| 32 | 23/11 | Forma "Crédito da cliente" (saldo a favor, não vai ao financeiro) | Falta | AI:246, AI:568, AI:1080; busca em `mobile/`: nada | Médio |

### 2.6 Brindes

| Nº | Data | O que o Atendimento interno ganhou | No app da representante | Prova | Esforço |
|---|---|---|---|---|---|
| 33 | 11/11 | Brinde só pela tabela do valor em aberto (80%, 50%, 0). Acordo não libera brinde | Já tem (a conta é a mesma; os textos foram corrigidos em 23/11) | `acerto-derivado.js:47-52, 83-86` | - |
| 34 | 12/11 | Campos de brinde abertos desde o começo (a entrega vem depois do pagamento) | Falta, segundo a análise de 23/11. Não reconferi a tela | análise 23/11 item 22 | Pequeno |
| 35 | 19/11 | Diferença do brinde sobe ao Direcionar, com escolha de Pix, Cartão ou Link | Falta: o app soma a diferença no valor a pagar | R:937 (`travaExcedente`); `acerto-derivado.js:102` | Médio |
| 36 | 05/10 | Redução do brinde por remarcação | Já tem | `acerto-derivado.js:87`; R:1326 | - |
| 37 | 17/11 | Brinde de indicação (peças por código, valor do pedido aprovado) | Não se aplica | DECISOES 17/11 | - |

### 2.7 Kit novo e negociação

| Nº | Data | O que o Atendimento interno ganhou | No app da representante | Prova | Esforço |
|---|---|---|---|---|---|
| 38 | 11/11 | Regras novas: multa 10% do pendente, kit novo com 80% pago | Já tem | `acerto-derivado.js:64-73, 99-102`; R:873 | - |
| 39 | 11/11 | Negociação na hora: no máximo 2 parcelas, mínimo R$ 200,00, abaixo de R$ 400,00 parcela única, até 30 dias | Parcial: a conta e o aviso existem; a análise de 23/11 diz que a tela deixa adicionar parcelas sem limite (não reconferi) | `acerto-derivado.js:16-25, 47` | Pequeno |
| 40 | 11/11 | Faltou pagar e não negociou: kit novo não sai | Já tem | `acerto-derivado.js:107` | - |
| 41 | 11/11 | Dívida anterior abate primeiro e bloqueia kit novo | Parcial: a conta entra (R:324), mas o aviso só aparece no bloco Kit novo; o interno mostra ao abrir | `acerto-derivado.js:105`; AI:263 | Pequeno |
| 42 | 27/10, 16/11 | Média de 3 vendas e mínimo R$ 700,00 (interno) | Parcial: o app usa média de 4 vendas e mínimo R$ 500,00 (o manual de 11/11 diz 4). Os documentos se contradizem | `acerto-derivado.js:68` (`avaliarMinimo`, `semTaxa` troca R$ 500/R$ 700); R `MEDIA_N` | Pequeno (é decisão) |
| 43 | 11/11 | Média abaixo do mínimo: pedir autorização do kit novo ao Financeiro, no Direcionar, com 3 últimas vendas, inadimplência, Aceitar ou Não aceitar | Falta: o botão existe só no interno. No app existe o campo `novaChance` sem botão | AI:297-299; `acerto-derivado.js:9` | Médio |
| 44 | 16/11 | Valor do kit automático (média das 3 últimas vendas pela tabela) | Já tem (vale para as Listagens da montagem, comum aos dois) | DECISOES 16/11 | - |
| 45 | 16/11 | Média só com as vendas que existem, nada inventado | Não confirmado | DECISOES 16/11 | - |

### 2.8 Regras e assinatura

| Nº | Data | O que o Atendimento interno ganhou | No app da representante | Prova | Esforço |
|---|---|---|---|---|---|
| 46 | 11/11 | NINGUÉM assina no sistema: a funcionária passa as regras e finaliza | Falta: o app exige assinatura no acerto, na reposição e no kit novo | R:940, R:951, R:1370; `mobile/assinatura.js` | Médio (depende de decisão) |
| 47 | 16/11 | Revendedora que sai sem assinar a ciência: só avisa, não trava | Parcial: o app tem a exceção de 24/11 "sem assinatura", mas só com autorização (Marcus, Nickolas, Lucas), motivo e mínimo de acertos. Outra regra | `assinatura.js:26, 71-80`; R:941 | - |
| 48 | 12/11, 16/11 | Botão Gerar PDF das regras e do resumo do acerto | Parcial: o app tem PDF e mensagem do resumo; a tela "Regras e comissões" é feita de imagens e não muda sozinha | R "Resumos ao finalizar"; `mobile/regras-comissoes-app.js` | Médio |
| 49 | 11/11, 28/10 | "Enviar regras novas" com carimbo da versão em vigor | Parcial: existem os informativos (`informativos-app.js`), mas só no navegador | DECISOES 11/11 (14ª parte) | Médio |
| 50 | 16/11 | Botão "Usar comissão antiga (ela questionou)", com registro | Falta: `derivarAcerto` aceita `regraAntiga`, mas o app não passa | `acerto-derivado.js:29`; AI:260, AI:975; busca em `mobile/`: nada | Pequeno |
| 51 | 16/11 | Regra nova vale para todas as revendedoras já | Já tem (versão carimbada no kit) | `acerto-derivado.js:29` | - |
| 52 | 09/11 | Comissão especial por revendedora | Já tem | R:299 | - |
| 53 | 11/11 | Textos "48 horas" e "acordo libera o kit, não o brinde" | Já tem (corrigidos em 23/11) | DECISOES 23/11 | - |

### 2.9 Crédito, garantia, comissão

| Nº | Data | O que o Atendimento interno ganhou | No app da representante | Prova | Esforço |
|---|---|---|---|---|---|
| 54 | 05/10 | Crédito de garantia sai da venda antes da comissão | Já tem | R:948 (`credito_usar`) | - |
| 55 | 11/11 | Comissão especial de funcionária (35%, 45%, 50%) | Não se aplica | `comissao-funcionarias.js` | - |
| 56 | 05/10 | Sem taxa de deslocamento | Não se aplica (o app tem a taxa de R$ 35,00) | AI:260 `semTaxa:true` | - |
| 57 | 10/11, 23/11 | Pix representante conta como comissão | Já tem (corrigido em 23/11) | `domain/comissoes.js:179-199` | - |

### 2.10 Consolidado e conferência

| Nº | Data | O que o Atendimento interno ganhou | No app da representante | Prova | Esforço |
|---|---|---|---|---|---|
| 58 | 05/10 | Consolidado Sorelly próprio | Não se aplica | `pages/CLAUDE.md` antigo | - |
| 59 | 11/11 | Dívida nasce sozinha do acerto, no setor Inadimplência | Já tem | `App.js:147`; DECISOES 11/11 | - |
| 60 | 16/11 | Links usados aparecem em "Descontados no acerto" | Já tem | DECISOES 16/11 | - |
| 61 | 18/11 | Bipagem de envio: confere encomendas abertas | Não se aplica | `pages/BipagemEnvio.js` | - |

### 2.11 Outros

| Nº | Data | O que o Atendimento interno ganhou | No app da representante | Prova | Esforço |
|---|---|---|---|---|---|
| 62 | 05/10 | Valor da venda vem do app da revendedora (`vendaApp`) | Parcial: o cartão mostra "Vendido no app", mas a calculadora não preenche sozinha (o interno também não grava) | análise 23/11 item 4 | Pequeno |
| 63 | 05/10, 02/11 | Peça sem etiqueta = vendida; tag riscada; trocas | Já tem (o app é mais completo que o interno) | `acerto-derivado.js:35-39, 95` | - |
| 64 | 16/11 | Conferência prévia das condicionais pela Marjory | Não se aplica | DECISOES 16/11 | - |

## 3. Totais

| Status | Itens |
|---|---|
| Já tem | 20 |
| Parcial | 13 |
| Falta | 15 |
| Não confirmado | 3 (19, 20, 45) |
| Não se aplica | 13 |
| Total | 64 |

## 4. (a) As 10 melhorias que mais valem trazer ao app

| Ordem | Melhoria (itens) | Motivo |
|---|---|---|
| 1 | Pix adiantado entra como já pago (28) | Evita cobrar duas vezes e criar repasse duplicado. |
| 2 | Remarcação com motivo obrigatório, quem autorizou, prova e regra dos 10 dias (16, 17, 18) | Hoje a multa depende do que a representante marca. Dá erro de dinheiro e briga. |
| 3 | Diferença do brinde vai ao Direcionar com Pix, Cartão ou Link (35) | O Financeiro não vê esse dinheiro hoje. |
| 4 | Dias de atraso automáticos pela data marcada (13, 14) | A representante digita e pode errar. O interno já conta sozinho. |
| 5 | Travar a negociação na tela: 2 parcelas, R$ 200,00, 30 dias (39) | A regra existe na conta, mas a tela deixa passar. Conserto pequeno. |
| 6 | Link confirmado entra sozinho como pagamento (26) | Tira um passo manual e erro de digitação. |
| 7 | Pedido de autorização do kit novo ao Financeiro (43) e alinhar a média (42) | Evita kit novo para quem não vende. Precisa decidir 3 ou 4 vendas, R$ 500 ou R$ 700. |
| 8 | Venda R$ 0,00 direto a Finalizar, e "Renova outro dia" (9, 10) | Poupa tempo. Só vale depois da decisão sobre assinatura. |
| 9 | Vários comprovantes, comprovante grande, bandeira e parcelas da Maquininha Banho, Crédito da cliente (24, 25, 30, 32) | O Financeiro hoje recusa ou ajeita à mão. |
| 10 | "Usar comissão antiga (ela questionou)" e aviso de dívida anterior ao abrir (50, 41) | A conta já aceita os dois. Falta só o botão e o aviso. |

## 5. (b) O que NÃO se aplica à representante e por quê

| Tema | Por quê |
|---|---|
| Chegada, tolerância de 30 min, relógio da escolha do kit (1 a 4) | A revendedora não vem até a representante. A representante vai até ela. |
| Atendimentos abertos em abas e rascunho (5) | O app é de uma pessoa, um acerto por vez. |
| Registro de contatos e agenda com vagas (1, 7) | Quem agenda é a Tamara. |
| Kit extra, brinde de indicação, bipagem de envio, conferência prévia (11, 37, 61, 64) | São etapas da empresa. |
| Comissão de funcionária, sem taxa de deslocamento, Consolidado Sorelly (55, 56, 58) | A representante é paga pela tabela dela (8%) e tem deslocamento. |

## 6. (c) Contradições e o que o Marcus precisa decidir

| Nº | Contradição | Onde está | O que decidir |
|---|---|---|---|
| C1 | 11/11 "ninguém assina nada no sistema" (interno). O app exige assinatura no acerto, na reposição e no kit novo. Em 16/11 o interno aceita a ciência assinada (quem não quer esperar a explicação) e o botão "saiu sem assinar" só avisa. Em 24/11 o app ganhou "acerto sem assinatura" só com autorização de Marcus, Nickolas ou Lucas. A própria decisão de 11/11 deixou isto como pendente. `domain/CLAUDE.md` ainda diz "assinatura obrigatória" | DECISOES 11/11, 12/11, 16/11; `mobile/assinatura.js:26` | A representante assina ou não? E o kit novo? Uma regra só para os dois canais. |
| C2 | Média de vendas: interno usa 3 vendas e R$ 700,00. App usa 4 vendas e R$ 500,00. O manual da representante (11/11) diz 4 vendas | análise 23/11 item 8; DECISOES 11/11 (12ª parte) | Qual vale para a representante? |
| C3 | "Nova chance": o manual da representante diz que ela pode dar. O guia da revendedora diz "sem nova chance". No app existe o campo, sem botão. No interno é o Financeiro que decide | DECISOES 11/11 (15ª parte) | Quem dá a nova chance no app? |
| C4 | Prazo da quitação: a regra diz "vale a data de cada parcela". O código conta 30 dias do acerto sobre o pendente inteiro | análise 23/11 seção 6 | Confirmar qual vale. |
| C5 | Jurídico: a regra de 11/11 diz 30 dias úteis. A tela de Inadimplência ainda usa 60 dias | análise 23/11 seção 7 | Ajustar a tela. |
| C6 | Pedido de Pix: DECISOES 24/11 diz "o comprovante pela representante só quando existir o app dela". O app existe desde 23/11 | DECISOES 24/11 | Liberar o comprovante pela representante? |
| C7 | Comprovante: decisão de 23/11 diz que a foto é reduzida. O código ainda barra arquivo acima de 400 KB | R:718, R:783 | É bug ou resta o limite só para PDF? Conferir. |
| C8 | Cartão da revendedora usa 8% fixo, mas algumas representantes têm 9% ou 10% | análise 23/11 seção 6 | Ligar ao cadastro. |
| C9 | `domain/CLAUDE.md` está velho: fala em brinde R$ 48/R$ 68, assinatura obrigatória e remarcação com texto antigo | `domain/CLAUDE.md` | Atualizar depois da C1. |

## 7. Limites desta auditoria

| Limite | Efeito |
|---|---|
| Li os trechos por busca, não `representante.js` inteiro (1.511 linhas) | Itens 6, 19, 20 e 45 ficam "não confirmado" ou "parcial". |
| Não abri o navegador nem testei o fluxo | Os itens 34 e 39 usam a análise de 23/11 como fonte. |
| Não li `kn-entrega-rep.js` nem `conf-pecas.js` por completo | Kit novo na entrega pode ter mais regras do interno. |
