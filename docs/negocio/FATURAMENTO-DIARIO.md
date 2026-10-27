— | — undefined| — undefined| — undefined| — undefined| — undefined| — undefined| — undefined| — undefined| Data | Acertos (acum.) | Faturamento (acum.) | Média por acerto | Observação |
|---|---|---|---|---|
| 08/10/2026 | 291 | R$ 207.855,36 | R$ 714,28 | registro oficial (dia anterior) |
| 13/10/2026 | 526 | R$ 426.110,24 | R$ 810,10 | ajuste do Marcus |
| 14/10/2026 | 668 | R$ 530.576,39 | R$ 794,28 | |
| 15/10/2026 | 791 | R$ 630.605,94 | R$ 797,23 | dia: 123 acertos, R$ 100.029,55 |
| 16/10/2026 | 868 | R$ 689.631,19 | R$ 794,52 | dia: 77 acertos, R$ 59.025,25 |
| 17 e 18/10 | 868 | R$ 689.631,19 | R$ 794,52 | fim de semana, sem faturamento |
| **19/10/2026** | **1.008** | **R$ 789.350,24** | **R$ 783,09** | dia: 140 acertos, R$ 99.719,05 (fixado em 20/10/2026) |
| 20/10/2026 | 1.120 | R$ 885.617,53 | R$ 790,73 | dia: 112 acertos, R$ 96.267,29 (CORRIGIDO pelo Marcus em 26/10/2026; antes 1.124 e R$ 888.787,53) |
| **21/10/2026** | **1.175** | **R$ 928.551,38** | **R$ 790,26** | dia: 55 acertos, R$ 42.933,85 (CORRIGIDO em 26/10/2026; antes 1.176 e R$ 928.995,38) |
| **22/10/2026** | **1.240** | **R$ 982.180,43** | **R$ 792,08** | dia: 65 acertos, R$ 53.629,05 (fechado pelo Marcus em 24/10/2026 e reconfirmado em 26/10; substitui o provisório de 1.241 e R$ 982.434,43) |
| **23/10/2026** | **1.330** | **R$ 1.049.731,83** | **R$ 789,27** | dia: 90 acertos, R$ 67.551,40 (fechado pelo Marcus em 24/10/2026; em 26/10 ele escreveu 1.130 acertos, mas o acumulado não cai: vale 1.330) |
| 24/10/2026 (sáb) | 1.330 | R$ 1.049.731,83 | R$ 789,27 | sem faturamento e sem contas pagas (Marcus, 26/10/2026; a funcionária ainda vai atualizar) |
| 25/10/2026 (dom) | 1.330 | R$ 1.049.731,83 | R$ 789,27 | sem faturamento e sem contas pagas |

**Previsão de outubro (Marcus, 20/10/2026):** 1.120 feitos + 7 vendas no Carregar sem valor (contam como feitas, fora da média) + 783 a realizar = **1.910 acertos no mês**; previsão a 97% = 1.853 acertos. Em 21/10 o dia 20 foi fixado em 1.124 acertos (o Carregar e o a realizar seguem os mesmos até o Marcus mandar outros). Em 19/10 eram 997 + 16 + 908 = 1.921 (a diferença é o que já foi feito e passado para frente).

## Previsão de outubro e Carregar — TRAVADO (26/10/2026)
O **Carregar** (vendas já feitas, sem valor lançado) é gravado sempre aqui, junto com o "a realizar". Total do mês = acertos feitos + Carregar + a realizar. Média por acerto usa só os feitos com valor.

| Data | Acertos feitos | Recebido no mês | Carregar (vendas) | A realizar | Total do mês | A 97% |
|---|---|---|---|---|---|---|
| 20/10/2026 | 1.120 | R$ 887.486,78 | 7 | 783 | 1.910 | 1.853 |
| **26/10/2026** | **1.347** | **R$ 1.062.977,38** | **34** | **513 (até 31/10)** | **1.894** | **1.837** |

Resultado no sistema em 26/10: média R$ 789,14; faturamento previsto do mês R$ 1.449.658,09 (a receber R$ 386.680,71); contas do mês R$ 1.485.588,64; resultado previsto −R$ 35.930,55. Código: `aplicaHoje26` em `state/store.js` (flag `hoje26V`). O dia 26 ainda é acompanhamento ("Hoje"); vira oficial quando o Marcus fechar o dia.

**Regra do Carregar (Marcus, 26/10/2026):** as vendas do Carregar NÃO estão dentro dos acertos realizados. Somam por fora (total do mês = feitos + Carregar + a realizar). O sistema tem uma coluna **Carregar** no Dia a dia (Faturamento) e o bloco "Carregar · início do mês × agora" na Previsão, para comparar com o início do mês quantas já saíram para o mês seguinte. Código: `s.carregarDia` (por dia), `s.carregarInicio` (por mês), ação `CARREGAR_INICIO`. Início de outubro: 12 vendas (informado em 26/10/2026). **Toda atualização do Marcus precisa trazer o Carregar** (regra dele): o Claude pergunta se não vier.

**Visão geral → Faturamento → "Como o mês começou × agora" (26/10/2026):** revendedoras no início do mês (2.023), acertos previstos no início (1.976), previsão nova (1.894), acertos a menos (−82), Carregar no início (12) e agora (34), vendas adiadas para o próximo mês (+22). Previsão a 96/97/98%, valendo 97%: 96% = 1.818 acertos, R$ 1.434.664,35 · **97% = 1.837, R$ 1.449.658,09** · 98% = 1.856, R$ 1.464.651,83.

| Data | Carregar |
|---|---|
| 01/10/2026 (início do mês) | 12 |
| 20/10/2026 | 7 |
| 26/10/2026 | 34 |

## Revendedoras (total) — lidas do admin antigo em 26/10/2026
01/10 2.023 · 02 2.033 · 03 2.033 · 04 2.033 · 05 2.032 · 06 2.022 · 07 2.032 · 08 2.044 · 09 2.060 · 10 2.064 · 11 2.066 · 12 2.072 · 14 2.074 · 15 2.077 · 16 2.075 · 19 2.069 · 20 2.058 · 21 2.081 · 22 2.087 · 23 2.106 · 24 2.113 · 25 2.113 · 26 **2.105** (valor do Marcus; o admin mostrava 2.110).

## Outubro/2026 · dia a dia (gravado em 26/10/2026)
Acumulado do mês até cada data, conferido com o Marcus. Dia = diferença entre os acumulados. Contas pagas: tela contas-diario do admin antigo.

| Data | Acertos no dia | Faturado no dia | Acertos acum. | Faturamento acum. | Contas pagas |
|---|---|---|---|---|---|
| 01/10 | 12 | R$ 9.148,95 | — | — | R$ 117.602,76 |
| 02/10 | 24 | R$ 15.395,15 | — | — | R$ 15.796,55 |
| 03/10 | 0 | R$ 0,00 | — | — | R$ 83,20 |
| 05/10 | 47 | R$ 33.268,30 | — | — | R$ 66.384,13 |
| 06/10 | 49 | R$ 35.238,93 | — | — | R$ 151.454,74 |
| 07/10 | 105 | R$ 75.664,91 | — | — | R$ 10.354,46 |
| 08/10 | 58 | R$ 49.631,99 | 291 | R$ 207.855,36 | R$ 31.407,88 |
| 09/10 | 98 | R$ 71.973,97 | — | — | R$ 24.420,41 |
| 10/10 | 68 | R$ 51.516,95 | — | — | R$ 36.010,82 |
| 13/10 | 65 | R$ 84.271,09 | 526 | R$ 426.110,24 | R$ 155.576,99 |
| 14/10 | 142 | R$ 104.466,15 | 668 | R$ 530.576,39 | R$ 69.765,84 |
| 15/10 | 123 | R$ 100.029,55 | 791 | R$ 630.605,94 | R$ 64.339,42 |
| 16/10 | 77 | R$ 59.025,25 | 868 | R$ 689.631,19 | R$ 34.836,87 |
| 19/10 | 140 | R$ 99.719,05 | 1.008 | R$ 789.350,24 | R$ 32.425,52 |
| 20/10 | 112 | R$ 96.267,29 | 1.120 | R$ 885.617,53 | R$ 182.744,32 |
| 21/10 | 55 | R$ 42.933,85 | 1.175 | R$ 928.551,38 | R$ 73.914,28 |
| 22/10 | 65 | R$ 53.629,05 | 1.240 | R$ 982.180,43 | R$ 45.938,34 |
| 23/10 | 90 | R$ 67.551,40 | 1.330 | R$ 1.049.731,83 | — |
| 24/10 (sáb) | 0 | R$ 0,00 | 1.330 | R$ 1.049.731,83 | R$ 0,00 |
| 25/10 (dom) | 0 | R$ 0,00 | 1.330 | R$ 1.049.731,83 | R$ 0,00 |

Sem lançamento (sem faturamento): 04, 11, 12, 17 e 18/10. Contas pagas de 23/10: ainda não lançadas no admin. Dias 1 a 12: os valores por dia vêm do sistema e não fecham com o acumulado oficial (08/10 = 291 acertos, R$ 207.855,36; 13/10 = 526, R$ 426.110,24): pendência já conhecida, por isso o acumulado desses dias fica em branco.

Fechamento de setembro/2026: 2.023 revendedoras, R$ 1.446.262,20 e 1.809 acertos.

## Posição das contas bancárias em 21/10/2026 (admin antigo, lido em 22/10)
Total das contas: **−R$ 187.055,12** (sem as contas bloqueadas: −R$ 194.826,69). Em relação a 20/10 só o Itaú Black mudou (de −R$ 19.886,97 para −R$ 18.207,90). O admin ainda não tem saldo de 22/10.

## Posição das contas bancárias em 20/10/2026 (lida do admin antigo em 21/10; o admin ainda não tem saldo de 21/10)
Total das contas: **−R$ 188.734,19** (sem as contas bloqueadas: −R$ 196.505,76). Por empresa, com o limite de cada uma:
- CNPJ 34: −R$ 147.131,41 (limite R$ 185.000, folga R$ 37.868,59) · CNPJ 46: −R$ 50.444,58 (limite R$ 75.200, folga R$ 24.755,42) · CNPJ 59: −R$ 29.878,41 (limite R$ 134.000, folga R$ 104.121,59) · CNPJ 67: −R$ 54,41.
- Itaú Black (particular): −R$ 19.886,97 (limite R$ 68.604) · H&O App: +R$ 1.052,37 · Dinheiro: R$ 49.837,65 (Sorelly R$ 26.538,40 + Caixa Seguro R$ 23.299,25) · Retidos (bloqueados): R$ 7.771,57.
- Em 19/10 o total era −R$ 51.501,62: a queda de R$ 137 mil em um dia veio de Sicredi 59 (de +R$ 32.966 para −R$ 32.617) e Sicredi 46 (de +R$ 31.570 para −R$ 11.837), entre outras.

## Posição das contas bancárias (lida do admin antigo, 19/10/2026)
- CNPJ 34: −R$ 138.121 (Rotativo Sicredi com R$ 71 de folga) · CNPJ 46: −R$ 7.038 · CNPJ 59: +R$ 34.800 · CNPJ 67: +R$ 16.680.
- Dias 14, 15, 16 e 19/10 carregados no Caixa (arquivo local `saldos-atualizacao.local.js`, fora do GitHub).

## Contas pagas por dia (tela contas-diario do admin antigo, R$)
Total de outubro até 21/10: **R$ 1.067.118,19** (soma dos dias do admin antigo; 20/10 = R$ 182.744,32 e 21/10 = R$ 73.914,28, lidos em 22/10. Atenção: na leitura de 21/10 o R$ 181.832,42 estava lançado em 21/10, e o admin depois corrigiu a data para 20/10). Até 19/10 eram R$ 810.459,59 em 14 dias. Dia a dia:

| Data | Total pago | Data | Total pago |
|---|---|---|---|
| 01/10 | 117.602,76 | 10/10 | 36.010,82 |
| 02/10 | 15.796,55 | 13/10 | 155.576,99 |
| 03/10 | 83,20 | 14/10 | 69.765,84 |
| 05/10 | 66.384,13 | 15/10 | 64.339,42 |
| 06/10 | 151.454,74 | 16/10 | 34.836,87 |
| 07/10 | 10.354,46 | 19/10 | 32.425,52 |
| 08/10 | 31.407,88 | 20/10 | 182.744,32 |
| 09/10 | 24.420,41 | 21/10 | 73.914,28 |

A divisão por CNPJ e "por fora" de cada dia está no arquivo local `saldos-atualizacao.local.js` (fora do GitHub).

Totais do mês no admin antigo (`faturamento_contas_mes`, atualizado em 21/10 à noite): outubro pago R$ 1.093.623,64 e a pagar R$ 420.533,10 (total R$ 1.514.156,74, contra R$ 1.515.154,53 do relatório da DevMaster de 19/10: diferença de R$ 997,79); novembro a pagar R$ 1.437.523,70; dezembro a pagar R$ 1.490.624,35; setembro pago R$ 1.422.665,77. Atenção: a soma dos dias de outubro (R$ 1.067.118,19) é R$ 26.505,45 menor que o "pago" do mês no admin (R$ 1.093.623,64): falta lançamento diário ou o mês tem pagamento sem dia.

## Regra fixa: tudo que o Marcus passa no chat vira código e documento (20/10/2026)
O que o Marcus manda no chat (faturamento acumulado, acertos, "carregar", "a realizar", percentuais) **nunca fica só na conversa nem só no navegador dele**. Em toda atualização, o Claude grava, no mesmo dia:
1. no código, em `src/apps/montagem/state/store.js`, numa função própria que roda no estado novo e no salvo (padrão `aplicaFat20` para dias fixados e `aplicaHoje20` para o "Hoje"; ao mudar o dia, copiar o padrão com o novo nome e a nova chave de versão);
2. neste arquivo (tabela acima);
3. em `domain/versoes.js` (Tecnologia → Versões) e em `DECISOES.md`.
A leitura do admin antigo (saldos, contas pagas, totais do mês) segue o procedimento de `.claude/commands/atualizar.md` (comando `/atualizar`). Sem o admin antigo disponível, faz-se só a parte do chat e avisa-se o que faltou.

## Como atualizar todo dia
1. O Marcus passa: acertos e faturamento acumulados até o dia, e (se quiser) o saldo das contas.
2. Atualizar esta tabela, a migração em `src/apps/montagem/state/store.js` (padrão `fat19FixV`) e `domain/versoes.js`.

## Atualização automática (desde 20/10/2026)
Tarefa agendada "Atualizar Sorelly Admin" roda todo dia por volta das 3h (03:13): copia saldos das contas e contas pagas do admin antigo (procedimento em `.claude/commands/atualizar.md`) e atualiza esta tabela. **Precisa do computador ligado e do app do Claude aberto**; se estiver fechado, roda quando o app abrir. O faturamento e os previstos continuam entrando só quando o Marcus manda no chat. Para rodar na hora: `/atualizar`.

## Conferência dos saldos (20/10/2026)
Saldos de 30/09, 01/10, 13/10 e 19/10 conferidos conta a conta com o admin antigo: 0 diferenças nas 29 contas. Totais: 30/09 −R$ 88.321,47 (sem bloqueado −R$ 96.093,04); 01/10 −R$ 164.083,87; 13/10 −R$ 169.529,90; 19/10 −R$ 51.501,62 (sem bloqueado −R$ 59.273,19). Início do mês = 30/09 (decisão do Marcus: o dia 1 só atualiza no fim da tarde).

## Atualização automática de 21/10/2026
Saldos das 29 contas de 20/10 gravados (Caixa 46 R$ 417,31 ... Sicredi Shopping 46 −R$ 11.836,97; Dinheiro Caixa Seguro R$ 23.299,25). Contas pagas: o admin antigo ainda não tem o dia 20/10; seguem os 14 dias lançados (01 a 19/10), total pago no mês R$ 810.459,59 nas contas diárias (o total do mês no admin mostra pagas R$ 946.917,85 e a pagar R$ 571.780,33; a diferença vem de lançamentos que não estão no diário por dia).

## Atualização de 22/10/2026 (noite)
- Hoje (acompanhamento): 1.241 acertos, R$ 982.434,43, média R$ 791,65. Código: `aplicaHoje22` em `state/store.js` (flag `hoje22V`).
- Contas a pagar lidas do admin antigo (`faturamento_contas_mes`, 22/10 20:21): outubro pagas R$ 1.141.034,30 e a pagar R$ 379.495,29 (total R$ 1.520.529,59); novembro a pagar R$ 1.451.402,56; dezembro a pagar R$ 1.500.553,11. Código: `aplicaContas22` (flag `cp22V`). Antes (13/10): outubro total R$ 1.485.588,64, nov R$ 1.457.779,93, dez R$ 1.479.278,78.
- Contas pagas por dia (`faturamento_contas_diario`) e saldos das 29 contas até 22/10: já estavam iguais ao admin, nada a gravar. Dia 22 pago: R$ 45.938,34 (34: 21,50 · 46: 31.258,26 · 59: 201,19 · 67: 801,35 · por fora: 13.656,04).
- Diferença: soma dos dias lançados em outubro = R$ 1.113.056,53; o admin mostra pagas R$ 1.141.034,30 (R$ 27.977,77 de lançamentos fora do diário). A tela usa a soma dos dias.
- A lista de títulos do Contas a pagar (DevMaster) não está no banco do admin: só muda quando o Marcus passar novos relatórios.
