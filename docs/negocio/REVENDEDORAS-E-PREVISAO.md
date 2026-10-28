# Revendedoras, acertos previstos e previsão de caixa

Documento de memória (27/10/2026). Reúne a lógica do Marcus sobre quantas revendedoras existem, quantas fazem acerto em cada mês e como isso vira previsão de entrada. Leia antes de mexer na previsão de acertos, na Visão geral (previstos) ou no bloco Previsão de Resultado do mês. Atualize ao receber informação nova: some ou altere o que já está aqui, não crie outro arquivo para o mesmo assunto.
**Este arquivo vai para o GitHub (repositório público): sem valores da empresa e sem nomes.** Números reais e frases do Marcus: `RESULTADO-DO-MES.local.md`.

## 1. A lógica (palavras do Marcus)
```
Revendedoras na base no início do mês  (crescimento dos últimos 30/60 dias)
        │
        ▼  quantas têm acerto PREVISTO no mês?
Previstos  = as que têm data prevista de acerto dentro do mês
        │   (as outras já têm data em 45 ou 60 dias: fora do mês)
        ▼  durante o mês ainda se mudam datas
Realizados = previstos × meta (98%)     ← o Marcus escolhe 97, 98 ou 99 (era 94/95/96)
        │
        ▼
Entrada = realizados × média por acerto × % pago na hora + inadimplência antiga + funcionárias
```
- Antes de outubro/2026 o previsto era quase igual à base e isso "sempre foi bem alinhado". Em outubro o Marcus passou muitas revendedoras para ciclo de 45 e 60 dias (a base cresceu muito), então o histórico perdeu valor: **usar a data de devolução prevista** (DevMaster) em vez de só uma razão histórica.
- **Janeiro:** param de entrar revendedoras no dia 15 de dezembro; em janeiro há menos revendedoras que em dezembro (queda fixa de 100 no código, `QUEDA_JANEIRO`). Na média por acerto, janeiro do ano passado foi cerca de R$ 900, sem app; este ano deve ficar por aí.
- **Alta da média por acerto:** novembro +5%, dezembro +10% sobre a média atual (pedido de 27/10/2026; o código antigo tinha 15% em dezembro).
- **Funcionárias** continuam comprando na mesma medida (média dos meses fechados). **Inadimplência antiga recebida** também entra pela média.
- **Média por acerto** = faturado só dos acertos das revendedoras (sem funcionárias) ÷ revendedoras que acertaram, no contas a receber. Nunca "o que entrou ÷ acertos".

## 2. De onde vem cada número
| Número | Fonte | Observação |
|---|---|---|
| Revendedoras com acerto previsto em cada mês | DevMaster `dmafi` (`afi_status = A`, `afi_prevdevol` no mês), clientes distintos, sem reposição (`afi_xreposicao = S`) e sem expositor (data no ano 3000) | `src/server/acertos-previstos.js`, rota `/api/acertos-previstos`, cache de 30 min |
| Ciclo dos kits (30, 45 ou 60 dias) | `dmafi` kits entregues nos últimos 45 dias: `afi_prevdevol` − `afi_data` (até 35 dias = 30; até 50 = 45; até 70 = 60) | Em outubro/2026 cerca de 96% dos kits ficaram em 30 dias |
| Revendedoras novas por mês | Crescimento diário real (Visão geral, janela de 30 dias) | `projetarVariosAnos` em `domain/financeiro.js` |
| Média por acerto, % pago na hora, inadimplência antiga, funcionárias | Contas a receber (`src/server/contas-receber.js`) | Média dos últimos 3 meses fechados |
| A pagar de cada mês | Admin antigo (`s.contasPagar`, `faturamento_contas_mes`) | Janeiro sem lançamento repete o mês anterior (marcado ≈) |

## 3. Meses sem data prevista ainda
Kits que ainda serão entregues não existem na DevMaster. A previsão usa o ciclo:
```
Kits entregues em M = acertos de M + revendedoras novas de M (em dezembro, só até o dia 15)
Acertos de M+1 = (previstos conhecidos de M+1 + kits de M × (ciclo 30 + 45)) × meta
Acertos de M+2 = (conhecidos + kits de M+1 × (30 + 45) + kits de M × ciclo 60) × meta
```
Suposição a confirmar com o Marcus: o ciclo de 45 dias cai no mês seguinte ao do kit.

## 4. Acertos que faltam no mês (corrigido em 27/10/2026)
```
Previstos do mês = feitos + Carregar + A realizar        (Marcus lança "Carregar" e "A realizar" todo dia)
A realizar       = revendedoras com kit PRINCIPAL ABERTO e data prevista até o último dia do mês,
                   inclusive as que já passaram da data e continuam pendentes
```
- Conferência na DevMaster (`dmafi`, status A, sem reposição, clientes distintos, data prevista de 01/01 até o fim do mês): em 27/10/2026 dá **303** (297 com data em outubro + 6 de meses anteriores), igual ao que o Marcus lançou. Contar só de hoje em diante (162) estava ERRADO: esquece as atrasadas.
- O "A realizar" digitado não acompanha remarcações; por isso o previsto chegou a 2.130 (1.583 + 34 + 513, com o 513 velho). Em 27/10 o Marcus lançou **Carregar 0** e **A realizar 303**: previstos = 1.583 + 0 + 303 = **1.886** (antes 1.976 no Agendamento).
- **Travado no código:** `aplicaFat27` em `state/store.js` (versão `fat27V` 3) grava Carregar, A realizar, o histórico `s.restanteDia` e os previstos do mês. Ao salvar "Previstos" em Faturamento (`FECHA_MES_SET` no reducer) o total (feitos + Carregar + A realizar) passa a valer também na meta do Agendamento (`s.agend.mes[ym].previstos`, via `sincPrevistosAcertos` em `domain/agendamento.js`) e em `metaMensal` (Financeiro). A faixa de bônus do Agendamento (94/95/96%) usa esse previsto.
- Onde ver: Faturamento › aba **Acertos** (feitos, Carregar, a realizar, previstos, meta 98%, falta p/ meta, histórico por dia, conferência com a DevMaster) e Visão geral › bloco "Acertos de outubro".
- O percentual da meta é 97/98/99 (padrão 98) desde 27/10/2026; o valor salvo no navegador de quem usava a escala antiga (96/97/98, padrão 97) continua valendo 97.

## 4b. Bloco "Acertos de outubro" no Dashboard (28/10/2026, pedido do Marcus)
Bloco do **Agendamento**: clicar nele (barra ou qualquer linha) abre o **Painel do Agendamento** (`agpainel`). Sem as faixas 94/95/96 (não existem mais). Código: `BlocoAcertosMes` em `pages/VisaoGeral.js`, números de `resumoFinanceiro` (`domain/resumo-financeiro.js`).
```
PREVISÃO                                        ANDAMENTO
Revendedoras no início do mês   2.023           Realizados      1.583
Previstos primeiros             1.976           Carregar            0
Novo previstos                  1.886           Faltam (total)    303
Acertos adiados até o momento      90           Do mês          83,9%      (e, à parte: Falta para os 98% = 265)
98% dos novos previstos         1.848
```
- **Previstos primeiros = o que o Agendamento previu na abertura do mês (outubro: 1.976). NUNCA muda** quando o Marcus lança os previstos novos (feitos + Carregar + A realizar). Em 27/10 o lançamento tinha sobrescrito para 1.886; corrigido.
- **Acertos adiados até o momento = Previstos primeiros − Novo previstos** (1.976 − 1.886 = 90).
- **Faltam (total) = Novo previstos − realizados − Carregar** (1.886 − 1.583 − 0 = **303**, igual ao "A realizar" que o Marcus lança). É o que realmente falta; não é a falta para a meta.
- **97/98/99% são sobre o total do mês** (realizados + Carregar + o que falta = novo previstos): 98% de 1.886 = 1.848. "Falta para os 98%" = 1.848 − 1.583 − 0 = 265 (linha à parte). "Do mês" = (realizados + Carregar) ÷ novo previstos = 83,9%.
- Onde está travado: `metaDoMes` (`domain/financeiro.js`) devolve `previstosInicio` (tabela de abertura `META_MENSAL_DEMO`, ou o campo `inicio` guardado em `metaMensal` quando um mês novo recebe previstos novos; `sincPrevistosAcertos` em `domain/agendamento.js` grava esse `inicio` na primeira vez).
- A caixa **Faturamento** não repete mais "Como o mês começou × agora": esses números vivem só neste bloco.

## 5. Onde fica cada tipo de informação (para o Marcus saber onde buscar)
| Assunto | Arquivo |
|---|---|
| Revendedoras, acertos previstos e previsão de caixa (este) | `docs/negocio/REVENDEDORAS-E-PREVISAO.md` |
| Resultado do mês, contas a receber, acerto - loja | `docs/negocio/RESULTADO-DO-MES.md` (+ `.local.md`) |
| Média de vendas por revendedora e valor do kit | `docs/negocio/MEDIA-DE-VENDAS.md` |
| Faturamento diário | `docs/negocio/FATURAMENTO-DIARIO.md` |
| Caixa e saldo das contas | `docs/negocio/CAIXA-FINANCEIRO.md` |
| Decisões em ordem de data | `docs/DECISOES.md` |
