# Processo: retorno do kit na empresa (do acerto até a venda fechada)

Contado pelo Marcus em 26/11/2026, na conversa sobre a tela **Representantes & Kits › Consolidado**.
Serve para redesenhar essa tela e o card (ficha do atendimento). **Nada aqui foi mudado no sistema ainda.**
Ler antes de mexer no Consolidado dos representantes (`src/apps/montagem/pages/ConsolidadoRepresentantes.js`).

## 1. O fluxo

```
Representante faz o acerto no app e entrega o kit na empresa
        ↓
1. AGENDAMENTO (Tamara, Ana Maria, Mariana ou quem atender)
   pega o dinheiro, marca "recebi o kit",
   marca as condicionais que voltaram e se têm assinatura,
   deixa o kit separado
        ↓
2. BIPADORA (pega qualquer kit separado, sem ordem)
   abre o card, entra no PDV da DevMaster e faz o retorno:
   confere valores, brindes e códigos; marca toda diferença;
   gera a condicional do próximo mês, se tiver.
   NÃO finaliza a venda.
        ↓
3. FATURAMENTO
   abre a venda pendente pelo CARREGAR, confere os valores nos bancos,
   troca a TES do que é brinde e fecha a venda no ponto de venda
        ↓
4. FINANCEIRO
   trata todos os pagamentos na tela Comissões dos representantes
```

## 2. Quem faz o quê

| Etapa | Quem | Faz | Não faz |
|---|---|---|---|
| 1 | Agendamento | Pega o dinheiro. Marca "recebi o kit" (mesmo quando não há dinheiro). Marca cada condicional que voltou e se está assinada. Marca a condicional que faltou. Deixa o kit separado. | Não confere peças nem brindes. Não confere pagamentos. |
| 2 | Bipadora | Faz o retorno no PDV. Confere valores, brindes e códigos com o card. Marca as diferenças (erros). Gera a condicional do próximo mês. | Não fecha a venda. |
| 3 | Faturamento | Abre a venda pendente (Carregar). Confere os valores nos bancos. Altera a TES dos brindes. Fecha a venda. | |
| 4 | Financeiro | Todos os pagamentos, na tela Comissões dos representantes. | |

## 3. Regras ditas pelo Marcus

1. **A tela é prática e o principal é o card.** A funcionária não lê a linha: ela clica na revendedora e vê tudo no card. As linhas da tabela devem ser um pouco mais altas.
2. **Colunas que saem da tabela:** o que é conferido no card não precisa de coluna (exemplo dado: "Condicional · assinatura").
3. **A bipadora vê TUDO do acerto no card, com os valores.** Ela precisa disso para lançar na DevMaster e conferir com a baixa do kit no sistema.
4. **Kit sem dinheiro** (tudo no Pix): o agendamento marca "recebi o kit" do mesmo jeito.
5. **Dinheiro que não bate:** precisa virar um alerta. O que acontece depois do alerta ainda não foi definido.
6. **Condicional sem assinatura** (kit novo ou acerto + kit novo): a comissão não é paga. O kit fica separado para a representante pegar a assinatura. Vai entrar a assinatura virtual.
7. **Condicional que faltou:** o agendamento marca que faltou.
8. **Prateleira:** não tem posição nem número. O agendamento só deixa o kit separado.
9. **Ordem da bipagem:** as bipadoras pegam os kits sem ordem. Fica assim por enquanto.
10. **Diferenças na bipagem:** tudo que estiver diferente a bipadora marca. Hoje a empresa não faz nada com esses erros; o sistema precisa registrar.
11. **O que acontece no PDV (etapa 2):** as peças que voltaram retornam ao estoque. O que foi vendido e os brindes ficam na venda. A bipadora fecha no botão e a venda fica pendente no Carregar. Ainda não existe registro de venda nesse momento.
12. **O que o faturamento faz (etapa 3):** abre a venda pendente, confere os valores e altera a TES do que é brinde para faturar.
13. **Tipos de atendimento:** tudo que é **acerto** tem venda e vai para o faturamento. **Reposição** e **kit novo** não têm venda: só se guardam as condicionais.

## 4. O que o Marcus vai enviar

| Material | Para quê |
|---|---|
| Listagem de erros de bipagem | Decidir onde os erros entram no card e na tela |
| Relatório que as bipadoras passam sobre os atendimentos | Dar a elas um lugar para registrar os erros |

## 4a. Relatório de erros de bipagem (recebido em 26/11/2026)

Arquivo do Marcus: `Relatorio_erros_bipagem_Sorelly.md` (fora do projeto, na pasta Downloads dele). São 151 relatos do grupo de WhatsApp "Erro na bipagem", de 27/08 a 12/11/2026. Quem escreve é a bipadora que faz o retorno. Cada relato tem: data, revendedora, representante, quem montou o kit, quem bipou o kit (na saída) e o que aconteceu.

**Marcus (26/11/2026):** o registro precisa ter quem MONTOU o kit, além de quem bipou. Existem erros da montagem, da bipagem de saída (envio do kit) e da representante.

Contagem por palavra-chave (aproximada; um relato pode ter mais de um erro):

| Onde o erro nasce | Relatos | Exemplos |
|---|---|---|
| Representante, no acerto | cerca de 88 | Cobrou a mais ou a menos, não cobrou uma peça, cobrou o brinde, não cobrou a rifa, não anotou a peça de próximo mês |
| Saída do kit (montagem ou bipagem de saída) | cerca de 62 | Peça bipada 2 vezes e só uma na maleta, peça na maleta sem bipar, peça bipada que não foi, código trocado, maleta errada |
| Retorno físico (revendedora) | cerca de 12 | Peça não voltou, peça quebrada ou usada, maleta sem divisória, brinde que voltou na maleta |
| Outros | 3 | Taxa de deslocamento recusada, troca de maleta, condicional de próximo mês não gerada |

- Cerca de 16 relatos não têm o nome de quem montou (campo vazio, "sem informação na condicional" ou relato antigo sem o campo).
- O relatório não diz se o erro de saída é da montadora ou da bipadora: a mesma falha ("bipado 2 vezes", "foi sem bipar") pode ser das duas. Por isso o registro precisa guardar as duas pessoas e a origem pode ficar "a definir".
- Não existe o total de kits processados, então não dá para calcular taxa de erro nem comparar pessoas.

**O que o sistema já tem (conferido no código em 26/11/2026):**
- O kit guarda quem montou e quem bipou na saída (`montId`, `bipId`), quando passa pelas Listagens.
- Existe `errosBipagem`: erros que a REPRESENTANTE acha ao conferir as peças no app, na entrega. Guarda só a quantidade de peças com erro e a bipadora. Aparece no Consolidado, no bloco "Erros de bipagem · conferência da representante".
- Não existe lugar para a bipadora do RETORNO registrar o que achou. Hoje isso vai para o WhatsApp.

**Proposta (não aprovada): bloco "Diferenças" no card**, preenchido pela bipadora do retorno. Uma linha por diferença:

| Campo | Como preenche |
|---|---|
| Tipo | Lista fixa (abaixo) |
| Código da peça | Digitado ou bipado; pode ficar vazio |
| Valor | R$, com direção: a mais ou a menos |
| Origem | Montagem, Bipagem de saída, Representante, Revendedora, Sistema ou A definir |
| Quem montou, quem bipou a saída | Automático, do kit |
| Quem registrou, data e hora | Automático |
| Observação | Texto curto |

Lista de tipos, tirada dos 151 relatos:

| Origem | Tipos |
|---|---|
| Saída do kit | Peça bipada e não enviada · Peça enviada sem bipar · Peça bipada 2 vezes · Código trocado · Maleta errada |
| Representante | Cobrou a mais · Cobrou a menos · Não cobrou peça · Cobrou brinde · Não anotou o brinde · Não cobrou a rifa · Não anotou peça de próximo mês · Valor no campo errado |
| Revendedora | Peça não retornou · Peça quebrada ou usada · Maleta incompleta · Brinde retornou na maleta |
| Sistema | Condicional de próximo mês não gerada · Kit sem maleta no sistema |

### Decisões do Marcus sobre os erros (26/11/2026)

1. **A bipadora do retorno registra as diferenças no card.** Quem decide o que fazer com elas vem depois.
2. **A supervisora da montagem (Deysiane) não tem nada a ver com isso.** O tratamento dos erros é do **financeiro**.
3. **Sem regra por enquanto.** Nada de aviso, desconto ou punição. O Marcus quer deixar registrar por alguns dias e só depois alinhar as regras sobre os erros.
4. **Sem auditoria do código agora.** O relatório pedia uma auditoria completa; o Marcus disse que não precisa nesse momento.
5. **O bloco "Diferenças" pode ser desenhado** (proposta da seção 4a aprovada). A origem do erro (Montagem, Bipagem de saída, Representante...) fica a definir: a bipadora escolhe ou deixa "A definir".
6. **A tabela de recebimentos dos kits fica mais compacta**, com poucas colunas, porque o detalhe está dentro dos cards.

### Feito em 26/11/2026 (só no disco, não publicado)

- **Tabela do Consolidado em "Colunas: resumo"** (padrão): Conferência, Acerto, Recebido, Representante, Revendedora, Status, Retorno · bipar e Diferenças. Linha de 26 px e letra de 11 px. "Colunas: completo" traz de volta todas as colunas de antes (vendas, pagamentos, peças) para o financeiro.
- **Bloco "Diferenças" no card** (coluna do meio, abaixo de "Retorno · bipar"): mostra "Montou o kit" e "Bipou na saída" (do kit, ou "Sem registro"), a lista do que foi registrado e o formulário (tipo, código, valor a mais ou a menos, origem, observação). Quem registra: quem bipa o retorno, o agendamento e a diretoria. Só acerto tem o bloco.
- **Onde fica gravado:** `recebimento.dif` do acerto, pela ação `RETORNO_DIF` do reducer.
- **Ainda não testado com gravação:** a tela grava no banco real, então só conferi o desenho e o formulário. Falta um teste de gravar e tirar uma diferença com o Marcus de acordo.
- **"Montou o kit" mostra "Sem registro" nos kits testados:** o acerto não aponta para o kit; a busca é pelo nome da revendedora entre os kits de Listagens. Se não achar, fica "Sem registro".

## 5. Em aberto (ainda sem resposta)

1. Dinheiro que não bate: quem recebe o alerta e quem resolve.
2. Quais campos a bipadora digita no PDV, e em que ordem (para o card seguir a mesma ordem).
3. Condicional do próximo mês: onde ela é gerada primeiro e quem coloca o número no sistema.
4. O Carregar traz acerto que ainda não foi bipado? O card precisa mostrar "bipado por, às"?
5. Quais valores o faturamento confere nos bancos. As colunas de contas de pagamento da tabela são dele?
6. Como o sistema fica sabendo que a venda foi fechada.
7. Volume por dia e se duas bipadoras podem abrir o mesmo kit ao mesmo tempo.
8. Depois de quanto tempo um kit separado e não bipado vira alerta.
9. Assinatura virtual: como entra neste fluxo.

## 6. Ideia de tela (proposta, não aprovada)

- Tabela curta, como fila de trabalho: Acerto, Representante, Revendedora, Tipo e **Etapa** (Aguarda recebimento → Separado para bipar → Bipado, aguarda faturamento → Venda fechada).
- Reposição e kit novo param depois do recebimento das condicionais.
- Os valores em dinheiro e as contas de pagamento saem da tabela do agendamento e ficam no card ou em uma visão própria.
- O card muda a ação conforme a etapa: agendamento (dinheiro, recebi o kit, condicionais), bipadora (conferência, diferenças, condicional do próximo mês), faturamento (venda fechada).

### Ficha em 8 blocos (Marcus, 26/11/2026)
A ficha tem 8 blocos fixos e numerados, 4 em cima e 4 embaixo. Bloco vazio continua na tela. 1) **Atendimento**: representante, revendedora, quem montou o kit e o Acerto. 2) **Pagamento**: situação, total a pagar, pagou, falta, formas de pagamento, dinheiro e multas. Cada valor aparece uma vez só (1 e 2 juntos mostram o acerto e todo o pagamento). 3) **Conferência** (botão "Iniciar conferência" à parte) e **Condicionais**. 4) **Informado pela representante** (tudo que o app grava). 5) **Retorno · bipar** e **Diferenças** (só quem bipa). 6) **Peças do acerto**. 7) **Peças do próximo mês**. 8) **Trocas**. Na tabela, o link virou **"Abrir"**: abrir a ficha não começa mais a conferência.
