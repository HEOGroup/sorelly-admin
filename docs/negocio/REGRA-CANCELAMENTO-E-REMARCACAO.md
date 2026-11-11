# Cancelamento e remarcação: prazo para o acerto (regra de 10/11/2026)

**Situação: DEFINIDA PELO MARCUS, AINDA NÃO CONSTRUÍDA NO SISTEMA.** Este é o documento único da regra. Decisões em `docs/DECISOES.md` (10/11/2026) e pendências em `docs/negocio/PENDENCIAS-REGRAS-E-COMISSOES.md`.

Caso que originou: Carolina Vitoria Paixao. Kit principal de R$ 8.113,00 na rua, data prevista de devolução 06/11, acerto marcado para 10/11 às 08h e desmarcado no mesmo dia (motivo "Outro"). Ela ficou sem data e nada a obrigava a voltar.

## 1. Palavras (para não misturar)

| Palavra | O que acontece | Fica com data? | Multa |
|---|---|---|---|
| **Marcar** | Escolher dia e hora do acerto pela 1ª vez | Sim | Não |
| **Remarcar** | Trocar a data já marcada por outra, na hora | Sim (a nova) | Sim, pela escada da vez |
| **Desmarcar / cancelar** | Cancelar sem escolher outra data | Não | Sim, na hora |
| **Não veio** | Faltou no dia marcado | Não | Sim, na hora (igual a cancelar) |

## 2. A regra

```
Cancelou / desmarcou / não veio ──► multa da vez já vale no mesmo dia
   │
   ├─ até o 5º dia útil ......... só a multa da vez
   ├─ do 6º ao 30º dia útil ..... a multa SOBE 1 por dia (comissão em pontos, brinde em %)
   └─ depois do 30º dia útil .... sem comissão e sem brinde, vai ao Jurídico, não pode mais ter kit
```

- O prazo é para **FAZER o acerto**, não só para marcar. A revendedora responde com a nova data no mesmo dia ou no dia seguinte.
- **Dia útil = segunda a sexta, sem feriado e sem fim de semana.** Conta a partir do dia do cancelamento.
- **Multa da vez** (escada que já existia): 1ª = −5 pontos de comissão e −15% de brinde · 2ª = −8 pontos e −50% · 3ª ou mais = −15 pontos e −100% (perde o brinde).
- **Subida diária:** soma à base da vez. Ex.: 1ª vez no 7º dia = −7 pontos e −17% de brinde. 2ª vez no 7º dia = −10 pontos e −52%.
- A comissão nunca fica negativa. Quem vende pouco chega a zero mais cedo (faixa de 15% zera no 15º dia). O Marcus aceitou isso.
- Brinde: continua multiplicando por porcentagem, como hoje; peça não tem centavo (arredonda para cima, a favor da revendedora); Select cai igual ao Normal.
- A multa nova **substitui a faixa de atraso** (5/10/15/20/25) para esse caso, assim cada dia é cobrado uma vez só.

## 3. Quem é atingido

| Pergunta | Resposta do Marcus (10/11/2026) |
|---|---|
| Vale para o Kit Prata? | **Sim, tudo igual** à Normal |
| Vale para atendimento interno e para representantes? | **Sim, as regras são iguais** |
| "Não veio" é igual a cancelar? | **Sim**, multa na hora |
| Limite do Jurídico | **30 dias úteis para todos**, inclusive quem só atrasa (aceito pelo Marcus em 10/11/2026). Antes: 20 dias úteis e, na faixa antiga, 60 dias corridos. A subida de 1 por dia vai do 6º ao 30º dia útil |

## 4. Exemplo real: Carolina

Venda estimada R$ 1.056 (a última dela). Sem multa: 35% = R$ 369,60 de comissão e brinde normal R$ 118 (Select R$ 122). Cancelou em ter 10/11. 20/11 é feriado.

| Acerto feito em | Dia útil | **1 cancelamento** comissão | brinde | **2 cancelamentos** comissão | brinde |
|---|---|---|---|---|---|
| ter 17/11 | 5º | 30% = R$ 316,80 | R$ 101 | 27% = R$ 285,12 | R$ 59 |
| qui 19/11 | 7º | 28% = R$ 295,68 | R$ 98 | 25% = R$ 264,00 | R$ 57 |
| qua 25/11 | 10º | 25% = R$ 264,00 | R$ 95 | 22% = R$ 232,32 | R$ 54 |
| qua 02/12 | 15º | 20% = R$ 211,20 | R$ 89 | 17% = R$ 179,52 | R$ 48 |
| qua 09/12 | 20º | 15% = R$ 158,40 | R$ 83 | 12% = R$ 126,72 | R$ 42 |
| qua 23/12 | 30º | 5% = R$ 52,80 | R$ 71 | 2% = R$ 21,12 | R$ 30 |
| depois de 23/12 | 31º em diante | R$ 0 · Jurídico · sem kit | R$ 0 | R$ 0 · Jurídico · sem kit | R$ 0 |

## 5. O que já existe e se relaciona (conferido no código em 10/11/2026)

- **Escada da vez** (`descontoRemarcacao`): igual ao item 2. A "vez" só conta remarcação SEM isenção e reinicia a cada kit novo.
- **Faixa de atraso do acerto** (`atrasoAcerto` em `domain/consignado.js`): até 7 dias −5 pontos e −5% de brinde · até 15 dias −10 · até 30 dias −15 · até 45 dias −20 · até 59 dias −25 · 60 dias perde tudo e vai ao Jurídico. Quem **só atrasa, sem cancelar**, continua nela por enquanto. Os dias de atraso hoje são **digitados pela Tamara**.
- **Isenção:** lista de motivos que já existe (`MOTIVOS_ISENCAO`: falecimento, doença, internação, acidente, parto, chuva forte, feriado, atraso da própria Sorelly...). Quem autoriza: Marcus, Lucas, Nickolas ou Ana Maria (`AUTORIZADORES`).
- **Antecedência escrita nas regras** (igual na Normal e na Prata): agendar o acerto com no mínimo **5 dias** de antecedência; reagendar pelo menos **10 dias antes** da data original, sujeito a disponibilidade. **O sistema ainda cobra multa em TODA remarcação sem isenção**, não aplica "remarcar com 10 dias de antecedência = sem multa". Falta o Marcus confirmar se os 10 dias valem como limite sem multa.
- Nas regras da Prata havia "cancelar no dia perde 5%" e "atraso perde 1% por dia": a regra nova vale para todas e substitui isso.

## 6. Decidido em 10/11/2026 (2ª rodada)

| Pergunta | Decisão do Marcus |
|---|---|
| Cancelar ou remarcar **sem multa** | Com **10 dias ou mais** de antecedência |
| Jurídico | **30 dias úteis para todos**; a multa sobe 1 por dia do 6º ao 30º dia útil |
| Relógio no 2º cancelamento | **Não reinicia**: conta desde o primeiro cancelamento |
| Motivo ao registrar | **Obrigatório** |
| Isenção por motivo sério | Só com **prova** anexada (lista na seção 8) e vale para a multa e para o prazo |
| Quem pode **prorrogar** o prazo | Só **Marcus, Nickolas, Lucas e Anamaria** registram no sistema. A representante pode pedir/dar mais prazo **com autorização do Marcus**; por enquanto ela avisa no WhatsApp e uma das 4 pessoas lança. **A confirmar:** "Anamaria" é a mãe (29) ou a Ana Maria do Agendamento (24)? |

## 8. Motivos sérios que isentam (PROPOSTA, falta o Marcus aprovar a lista)
Só vale com **prova anexada** no registro. Quem autoriza vê a prova antes de aprovar.

| Motivo | Prova pedida |
|---|---|
| Falecimento na família | Certidão de óbito ou foto do convite/atestado |
| Doença da revendedora ou do filho | Atestado médico |
| Internação | Comprovante do hospital |
| Acidente | Boletim de ocorrência, ou relatório/foto do atendimento |
| Parto ou gestação de risco | Atestado ou certidão |
| Roubo ou furto | Boletim de ocorrência |
| Chuva forte, alagamento, greve de transporte | Alerta oficial ou notícia (link ou print) |
| Atraso ou erro da própria Sorelly | Registro nosso (print da conversa ou do sistema) |
| Feriado | Automático (já fora dos dias úteis) |

**Não isentam:** viagem, trabalho, esqueceu, sem dinheiro, mudança, clima comum, "Outro".

## 7. Para construir (depois das respostas)

1. Calcular sozinho o **"Acerto até"** (5 dias úteis, sem fim de semana e feriado; feriados da agenda: `definirFeriadosAgenda`).
2. Coluna **"Acerto até"** na lista de Revendedoras: verde, amarelo (faltam 2 dias) e vermelho (estourou).
3. Aviso para a Tamara no 3º dia útil.
4. No atendimento, a multa por dia entrar **sozinha** (a Tamara deixa de digitar os dias de atraso).
5. Depois do limite: status **Jurídico** e **kit bloqueado**.
6. Motivo obrigatório ao registrar; botão "Prorrogar prazo" (com quem autorizou e o motivo).
7. **Texto novo das regras:** versão nova das regras do consignado (as 10 regras que a atendente explica), depois o **PDF completo** e o **PDF resumido** da revendedora. Primeiro as regras fechadas, depois os PDFs (Marcus, 10/11/2026). A Tamara envia o PDF e a revendedora é carimbada com a versão.
