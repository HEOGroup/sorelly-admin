# Média de vendas das revendedoras (regra do Marcus, 27/10/2026)

Serve para a regra de venda mínima: média das 3 últimas vendas contra R$ 500 (acerto com representante) ou R$ 700 (atendimento Sorelly). Média abaixo = kit novo não liberado e cadastro bloqueado.

## Regra TRAVADA
1. **Venda = só venda de mercadoria, sem brinde.** Da venda da DevMaster (`dmach.ach_valormerc`) sai tudo que não é venda: brinde, troca, indicação, premiação por meta e outros. Itens vêm do TES (S001, S501, S002, S008 = venda; S009/S503 = brinde; S006/S504 = troca; S007/S505 = indicação; S011 = premiação). Código: `src/server/vendas-brinde.js`, tabela `sorelly.venda_composicao`.
2. **Vendas da mesma revendedora no mesmo dia se juntam** (a venda é aberta em duas às vezes). Conta como UM acerto, com a soma.
3. **Dia que fecha em R$ 0 não conta como venda.** Troca, brinde, indicação ou premiação sem venda de mercadoria NÃO são venda: ficam como REGISTRO no cadastro da revendedora (histórico), mas fora da média.
4. **Média = as 3 últimas vendas que sobraram** (dias já juntados, sem os dias zerados).
5. Gravar para sempre: o histórico completo (inclusive as trocas) fica no banco; só a MÉDIA ignora o que não é venda.

## Números do teste (27/10/2026, vendas de 2026)
- 20.008 vendas; 1.311 (6,6%) com valor sem brinde zerado: 793 só troca, 310 só brinde, 153 só indicação, 59 só premiação. 389 delas têm outra venda no mesmo dia (juntam); 922 ficam sozinhas.
- 1.428 casos de revendedora com mais de 1 venda no mesmo dia.
- 2.314 revendedoras com 3 ou mais acertos: 643 mudam de média; 163 saem de abaixo de R$ 500 para acima; 0 passam a ficar abaixo; 164 passam de R$ 700.
- Exemplos: revendedora 003771 (31/07 teve R$ 4.184 só de troca): média cai de R$ 3.720,67 para R$ 2.048 se o zero contar. Mesmo dia: 006799 = R$ 498 + R$ 310 = R$ 808.

## Situação no código
Regra ainda NÃO escrita no código (falta função de média por revendedora e ligar à calculadora do acerto, hoje a representante digita as 2 vendas anteriores).

## Pagamentos da DevMaster (para a aba de pagamentos da revendedora)
O token da API 2 libera as tabelas dmaaa a dmafq. Em `dmach` (vendas): `ach_xformaspagtxt` (ex.: "DINHEIRO: R$ 1.972,00"), `ach_tipopag` (ex.: DIN), `ach_condpag`.

## TES (tipo de operação) e composição da venda — registro do Marcus (27/10/2026)
A venda da DevMaster (`dmach.ach_valormerc`) soma vários tipos de item. Cada item (`dmaci`) tem um TES. A média usa só o que é VENDA de mercadoria.

| Tipo | TES no código hoje (`vendas-brinde.js`) | Conta na média? |
|---|---|---|
| Venda de mercadoria | S001, S501, S002, S008 | SIM (é a venda) |
| Brinde (bonificação, brindes e prêmios) | S009, S503 | Não |
| Troca (remessa para troca) | S006, S504 | Não: fica como registro no cadastro |
| Indicação | S007, S505 | Não |
| Premiação por meta | S011 | Não |
| Outros (industrialização, conserto, roubo, transferência) | qualquer outro TES (ex.: S004 de jan a abr/2026) | Não |

Venda sem brinde = valor da DevMaster − brinde − troca − indicação − premiação − outros. Conferido nos casos Esthefanny (R$ 1.042,00) e Tayane (R$ 800,00).

**TES de VENDA, decidido pelo Marcus em 27/10/2026 (vale no lugar da tabela acima):**
- Até fevereiro/2026: venda = **S001, S002, S501 e S502**.
- De março/2026 em diante: venda = **somente S001 e S002**. Mais nenhum.
- **S008 não é usado** pela Sorelly: não é venda (se aparecer, cai em "outros").
- Brinde, troca, indicação e premiação seguem como na tabela acima.
- **Código ajustado e composição recarregada em 27/10/2026** (`src/server/vendas-brinde.js`: `TES_VENDA` = S001 e S002; `TES_VENDA_ATE_FEV` = S501 e S502 só até 28/02/2026; S008 e qualquer outro TES viram "outros"; `sincronizarBrindes({ completo: true })` relê 2026 inteiro). Cópia da composição de antes guardada em `sorelly.venda_composicao_antes_tes` (pode apagar quando quiser).
- **Resultado da comparação:** 20.012 vendas iguais antes e depois, 0 diferenças. Em 2026 não existem itens S501, S502 nem S008 nas vendas faturadas de janeiro e fevereiro; a venda 062780 (itens S501, setembro) não está faturada (situação R, vendedor 04) e já ficava fora. A regra vale como proteção para quando puxarmos outros anos.

**Próximo passo combinado:** depois puxar também as vendas de outros anos (hoje só 2026, `INICIO = 2026-01-01`). Em anos antigos o TES pode ser outro: antes de puxar, conferir a lista de TES de cada ano e guardar a composição (venda, brinde, troca, indicação, premiação, outros) venda por venda, como já é feito em `sorelly.venda_composicao`.

**Regra de ouro:** nada que não seja venda de mercadoria entra na média, mas tudo fica guardado (brinde, troca, indicação, premiação) no histórico da revendedora.

## Lista oficial de TES (Natureza de operação), enviada pelo Marcus em 27/10/2026
| TES | Nome | Natureza | No sistema |
|---|---|---|---|
| S001 | Venda de mercadoria | Venda de mercadoria adquirida ou recebida de terceiros | **VENDA** |
| S002 | Venda de mercadoria (não controla estoque) | Venda de mercadoria adquirida ou recebida de terceiros | **VENDA** |
| S004 | Remessa para industrialização | Remessa para industrialização | outros |
| S005 | Remessa para conserto | Remessa de mercadoria ou bem para conserto | outros |
| S006 | Remessa para troca | Remessa para bonificação | **troca** |
| S007 | Indicação | Remessa para bonificação | **indicação** |
| S009 | Remessa para bonificação (brindes e prêmios) | Remessa para bonificação | **brinde** |
| S010 | Roubo | Venda de mercadorias de terceiros | outros |
| S011 | Premiação por meta | Remessa para bonificação | **premiação** |

- Fora desta lista: S008 (não usado). Os códigos da série 5xx (S501, S502 de venda; S503 brinde; S504 troca; S505 indicação) são os antigos, usados até fevereiro/2026 segundo o Marcus; continuam no código para quando puxarmos anos anteriores.
- Conferência com o código (`vendas-brinde.js`): todos batem. S004, S005 e S010 caem em "outros" pelo padrão do código (não precisam de linha própria).

## Esclarecimentos do Marcus (27/10/2026, 2ª rodada)
- **Série 5xx:** S501, S502, S503, S504 e S505 existiam. Antes de março, S501 e S502 também eram usados para faturar junto com S001/S002, só isso.
- **Dia que fecha em R$ 0:** não é "pulado": ele só NÃO é considerado venda na média e fica na categoria do próprio TES (indicação, troca, brinde, premiação...). O registro continua inteiro no cadastro da revendedora.
- **Diferença paga em indicação/premiação NÃO sobe na média.** Exemplo do Marcus: o prêmio vale R$ 500 e as peças escolhidas somam R$ 560; a revendedora paga os R$ 60 de diferença. A venda inteira fica no TES de indicação (bonificação); os R$ 60 não podem entrar como venda.

## O que o banco mostra sobre isso (27/10/2026)
- Hoje a diferença vaza para a média: a venda tem itens S007 (indicação) e um item S001 pequeno com a diferença. Exemplos: venda 065354 = S007 R$ 444 + S001 R$ 44; 065359 = S007 R$ 4.018 + S001 R$ 18. O sistema conta os R$ 44 e os R$ 18 como venda.
- Indicação: 278 vendas; 153 zeradas; 62 com sobra de venda MENOR OU IGUAL ao bônus (caso da diferença paga, soma R$ 2.945); 63 em que a venda é maior que a indicação (acerto normal com indicação dentro).
- Premiação: 59 vendas, todas zeradas (a diferença do exemplo de R$ 560 aparece como indicação, não como premiação).
- Troca: 2.280 vendas; 793 zeradas; 69 com sobra de venda menor ou igual à troca (diferença paga, soma R$ 9.487); 1.418 acertos normais com troca dentro.
- Regra proposta (aguarda OK do Marcus): venda de BONIFICAÇÃO = a parte de indicação + premiação + troca é maior ou igual à parte S001/S002. Nesse caso a venda INTEIRA (inclusive a diferença paga) é não-venda e guarda a categoria do TES maior. Caso contrário (acerto normal com bônus dentro) tira só os itens de bônus.

## Conferência com a média da funcionária Letícia (Pós-vendas), 27/10/2026
| Revendedora | Letícia | Sem brinde, regra aprovada (só 2026) | Valor DevMaster COM brinde | Conclusão |
|---|---|---|---|---|
| Jéssica Pinheiro dos Santos (009700) | R$ 1.536,66 | R$ 1.472,67 (804 + 2.090 + 1.524) | R$ 1.536,67 (804 + 2.193,20 + 1.612,80) | Letícia usou o valor COM brinde; a diferença é só o brinde |
| Eva Aparecida Máximo (002089) | R$ 980,00 | R$ 1.219,50 (só 2 vendas em 2026) | R$ 980,00 = (1.271,20 + 1.296,80 + 372,00) / 3 | Bate com brinde; a 3ª venda é de 26/06/2023, por isso falta carregar outros anos |
| Isabela Pereira de Jesus (004941) | R$ 1.281,00 ("com divisão de vendas") | R$ 1.482,67 (960 + 1.042 + 2.446, juntando 27 e 28/07) | R$ 1.281,40 = (1.094,20 + 112 + 2.638) / 3 | Letícia pulou a venda mais recente (29/09, R$ 1.137,20) e não juntou 27 e 28/07: perguntar a ela |

- A média da Letícia = valor da DevMaster (com brinde) das 3 últimas vendas, de qualquer ano. A regra do Marcus é SEM brinde: os números dela ficam acima do correto.
- Data da venda: a Isabela tem duas vendas de 27/07 (emissão) e 28/07 (faturamento). O banco usa a data de faturamento; a Letícia parece usar a emissão. Definir qual data vale para juntar o dia.

## Correção do Marcus (27/10/2026): sem vendas de anos antigos
- A média é só das ÚLTIMAS 3 vendas. Venda velha, como a de 2023 da Eva, NÃO entra. A Letícia errou ao usar a venda de 26/06/2023.
- Eva (002089): sem a venda de 2023 ficam 2 vendas recentes (R$ 1.204 + R$ 1.235 sem brinde = média R$ 1.219,50). Quem tem menos de 3 vendas recentes: média das que existem.
- A confirmar: até que idade uma venda ainda conta como "recente" (ex.: 12 meses)? Isso também define se vale puxar anos anteriores (decisão anterior: depois puxar outros anos) ou se só serve para histórico.
