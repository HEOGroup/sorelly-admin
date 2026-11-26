# Regras: acerto, comissão, brinde e representantes (vigentes em 25/11/2026)

Documento ÚNICO e vivo. Só a regra de HOJE. Sem conversa, sem histórico (o histórico está em `docs/DECISOES.md` e `docs/arquivo/`).
Números oficiais: no código (`domain/consignado.js`) e no Configurador. Os números das tabelas foram conferidos no código. Se este texto e o código discordarem: regra e código divergem? Não escolha um lado sozinho: registre em "Não alinhado" e, em dinheiro, jurídico, fiscal, trabalhista ou acesso, pergunte ao Marcus.
Marcação: **[FEITO]** já no sistema · **[A CONSTRUIR]** decidido, falta construir · **[A CONFIRMAR]** o Marcus ainda não decidiu. Nunca implemente [A CONFIRMAR] sem perguntar.
Atualização: ao mudar uma regra, mude AQUI no mesmo dia e acrescente a data em `docs/DECISOES.md`.

## 1. Tabela do Kit Padrão (venda líquida) [FEITO]
O teto de cada faixa inclui o centavo. Abaixo de R$ 300,00: sem comissão e sem brinde.

| Venda líquida | Comissão | Brinde Normal | Brinde Select |
|---|---|---|---|
| R$ 300,00 a 499,99 | 15% | R$ 0 | R$ 0 |
| R$ 500,00 a 699,99 | 25% | R$ 44 | R$ 32 |
| R$ 700,00 a 999,99 | 30% | R$ 88 | R$ 96 |
| R$ 1.000,00 a 1.599,99 | 35% | R$ 118 | R$ 122 |
| R$ 1.600,00 a 2.499,99 | 40% | R$ 196 | R$ 144 |
| R$ 2.500,00 a 4.999,99 | 40% | R$ 312 | R$ 188 |
| R$ 5.000,00 a 6.999,99 | 45% | R$ 368 | R$ 232 |
| R$ 7.000,00 ou mais | 45% | R$ 442 | R$ 282 |

Conferido no código em 25/11/2026. A versão antiga (R$ 48 e R$ 68 na faixa de R$ 500) NÃO é mais a regra. Ela só existe como opção "comissão antiga" no acerto (ver seção 4.2).

Brinde pela venda: o Marcus pediu em 03/11/2026 que o brinde de meta (seção 7.1) use valores "pares com R$ 4,00 a menos" dos valores fechados da empresa, para a revendedora sempre pagar uma diferença. Isso já está em `domain/metas.js`.

## 2. Kit 100% Prata (modalidade à parte) [FEITO]

| Venda líquida | Comissão | Brinde Normal | Brinde Select |
|---|---|---|---|
| R$ 300,00 a 499,99 | 20% | R$ 0 | R$ 38 |
| R$ 500,00 a 699,99 | 30% | R$ 44 | R$ 32 |
| R$ 700,00 a 999,99 | 35% | R$ 74 | R$ 82 |
| R$ 1.000,00 a 1.599,99 | 40% | R$ 112 | R$ 96 |
| R$ 1.600,00 a 2.499,99 | 45% | R$ 188 | R$ 122 |
| R$ 2.500,00 a 4.999,99 | 45% | R$ 282 | R$ 168 |
| R$ 5.000,00 a 6.999,99 | 50% | R$ 344 | R$ 224 |
| R$ 7.000,00 ou mais | 50% | R$ 422 | R$ 262 |

- **[A CONFIRMAR]** O Select da faixa de R$ 500 (R$ 32) é menor que o da faixa de baixo (R$ 38). Está assim no código.
- Escolha da modalidade: ficha da revendedora, com histórico (anterior, nova, data, usuário). Na ficha e nas listagens aparece "Kit 100% Prata".
- A revendedora escolhe Prata no app com 10 dias de antecedência do acerto. Trocar de modalidade exige aviso de 10 dias.
- Mínimo de R$ 300,00 em vendas para renovar o kit. Abaixo disso: cobra só as peças vendidas, sem kit novo.
- Peça fora do acerto ou sem etiqueta conta como vendida. Tag riscada ou extraviada: R$ 5,00 cada (03/11/2026: a representante quase nunca preenche; o Marcus mandou tirar o campo da tela do acerto ou deixar só um botão "+").
- Brinde só com pagamento integral confirmado e revendedora em dia. Crédito até 6x sem juros, parcela mínima R$ 80,00.
- Prazo e multas: as mesmas do Kit Padrão (seção 5). O texto antigo da Prata ("cancelar no dia −5%") saiu.

## 3. Brinde [FEITO]
- Dois cartões: **Normal** e **Select**. Código "BB" + 0 a 2 letras + 1 a 7 números (conferido no código; Marcus, 07/10/2026: máximo de 7 números; 30/10/2026: tirar a dica "BB + 4 números" da tela).
- **Toda peça com código que começa com BB é brinde Select** (brinco, anel, colar, pulseira...). Brinde BB só no BB. O Normal pode usar Normal ou BB.
- O que passar do valor liberado vira excedente e soma ao valor a pagar.
- Brinde só libera depois do pagamento. **[A CONFIRMAR]** se "pagamento" é o pagamento LANÇADO ou o CONFIRMADO pelo Financeiro. Em 03/11/2026 o Marcus disse que a revendedora pode pegar o brinde assim que o pagamento é lançado e o brinde fica "aguardando a confirmação" do setor. Em 12/11 e 16/11 o atendimento interno ainda não conseguia lançar brinde sem a confirmação do Financeiro, e o Marcus perguntou se isso já estava arrumado. Sem resposta.
- Diferença de brinde (valor que passou do liberado): a funcionária escolhe a forma de pagamento da diferença (Pix, Link, Crédito) e ela sobe ao Financeiro (Direcionar). O valor que falta aparece em vermelho. Fechado em 16/11/2026. **[FEITO]** segundo `versoes.js`; conferir ponta a ponta.
- Brinde Normal e BB aparecem lado a lado, com o código e o valor de cada peça (pedido de 16/11/2026).
- **Brinde de indicação:** a pessoa pode NÃO ser revendedora. O nome vem do cadastro (nome e código). Só o brinde avulso aceita pessoa fora do cadastro. Pedido de anexar o print das peças do grupo de indicação: decidir se volta (18/11/2026) **[A CONFIRMAR]**.
- **Atraso do cliente no atendimento interno:** ver seção 4.3.
- **Brinde pelo pagamento** (valor da tabela × fator, sobre o valor em aberto como % do acerto):

| Situação | Fator |
|---|---|
| Tudo pago (diferença até R$ 0,01) | 100% |
| Em aberto até 5% | 80% |
| Em aberto de 5% a 10% | 50% |
| Em aberto acima de 10% | sem brinde |

- Acordo de parcelas NÃO libera o brinde. Só a tabela vale. Dívida não muda o brinde.
- Kit Prata: brinde só com pagamento integral.

## 4. Acerto: etapas, pagamento e taxas [FEITO]
Ordem na calculadora: Condicionais → Remarcação → Crédito de garantia → Vendas + Pagamentos → Brindes → Kit novo → Peças do próximo mês → Trocas → Devolução → Observações.

- **Devolução** = total das condicionais − (vendidas + brindes + trocas).
- **Pagamento:** Pix, Link, Crédito, Débito, Dinheiro, Acerto com loja. Descrição da conta obrigatória. Parcelas 1x a 6x só no crédito; o valor entra inteiro, sem dividir.
- **Taxa de deslocamento** (soma ao valor a pagar): venda abaixo de R$ 300,00 = **R$ 35,00**. De R$ 300,00 em diante: não paga. O atendimento interno não tem taxa. Devolver o kit no meio do mês com venda menor que R$ 300,00 também paga a taxa **[A CONSTRUIR]**.
- **Kit novo liberado** se pago ≥ 80% do acerto. Abaixo disso, só com autorização do financeiro.
- **Média das últimas vendas** (referência para o kit novo): R$ 500,00 (representante) e R$ 700,00 (atendimento interno). Abaixo, kit novo bloqueado. A representante pode dar nova chance. No interno, quem pede é a funcionária que está bipando; o pedido vai ao Financeiro (tela Direcionar), com as 3 últimas vendas, inadimplência, média e botões aceitar / não aceitar.
- **Assinatura digital** obrigatória ao finalizar o acerto e na entrega de kit novo. Sem nota promissória assinada, sem kit.
- **Remarcação com multa** (isenta ou com multa; só a "com multa" conta): ver seção 5.

### 4.1 Venda mínima e média (regra de 26/10/2026 e 03/11/2026)
- **Referência de venda mínima:** R$ 500,00 (acerto com representante) e R$ 700,00 (atendimento interno). Não é corte de comissão: a faixa de 15% continua valendo. Serve para liberar kit novo. **[FEITO]**
- **Como se calcula a média [FEITO no código]:** média das últimas **4** vendas = as 3 anteriores + a venda do dia do acerto (decisão de 03/11/2026). Só venda de mercadoria, sem brinde, troca, indicação e premiação. Vendas da mesma revendedora no mesmo dia viram uma. Dia que fecha em R$ 0 não é venda. Só vendas de até 12 meses. Regra completa e códigos TES: `docs/negocio/MEDIA-DE-VENDAS.md`.
- **Tela da média (03/11/2026):** mostra antepenúltima venda, penúltima venda, última venda e venda de hoje, e a média das 4. A venda do app só entra se for de R$ 500,00 ou mais (04/11/2026; abaixo disso a revendedora "não conecta" e a venda do app não conta). Na tela de acompanhamento das revendedoras (24/11/2026) a venda do app abaixo de R$ 500,00 aparece em vermelho. **[FEITO]** a média; a cor vermelha **[A CONFIRMAR]**.
- **Média abaixo da referência:** kit novo bloqueado e cadastro bloqueia. O código ainda aceita "nova chance" dada pela representante no dia do acerto. **[A CONFIRMAR]** A mensagem de 03/11/2026 diz o contrário para a média abaixo de R$ 500,00: "não tem nova chance simplesmente". Sem resposta se vale só para a tela do kit novo ou também para o acerto. No atendimento interno, a bipadora pede a decisão ao Financeiro (Direcionar), que vê as 3 últimas vendas, se teve inadimplência, a média e aceita ou não. **[FEITO]**
- **Revendedora que não preenche as vendas no app (03/11/2026):** o próximo kit vem no valor mínimo e as peças não têm garantia (a garantia nasce no app). A revendedora também precisa preencher as preferências. **[A CONFIRMAR]** se está no código.
- **Venda do acerto abaixo de R$ 500,00 (representante):** a representante escolhe o MOTIVO antes de finalizar (lista fechada + "Outro" com texto livre). **[FEITO]**
- **Mínimo para quem está com acerto adiado de propósito:** 45 dias = R$ 750,00 (representante) e R$ 1.000,00 (Sorelly). 60 dias = R$ 1.000,00 (representante) e R$ 1.500,00 (Sorelly). **[A CONSTRUIR]** (mensagem de 24/10/2026; não existe no código).
- **Expositor:** quem tem expositor deve ter venda mínima; o valor **[A CONFIRMAR]**. Se o expositor quebrar: coroa R$ 100,00, chave perdida R$ 100,00, expositor quebrado = preço da condicional (texto já está no conteúdo do kit novo).
- **Brinde e kit:** o brinde é retirado NO ATO do acerto. Peça que não está presente no acerto conta como vendida. Quem fica com kit novo pega o brinde do kit antigo ou do novo; quem sai pega da maleta que está com ela. Marcar de qual maleta saiu cada peça **[A CONFIRMAR]** (só o texto está no app).
- **Taxa:** menor que R$ 300,00 = R$ 35,00. A faixa de R$ 20,00 (R$ 300,00 a 499,99) saiu em 07/10/2026. Querer cancelar o kit com venda menor que o valor mínimo também paga a taxa.
- **Pedido de mudança de data pelo app:** a representante pede no app. Mudança de até 5 dias para a frente: aceita. Acima disso, só com autorização (para não ter multa). **[A CONSTRUIR]**

### 4.2 Pré-acerto, vigência das regras novas e comissão antiga
- **Pré-acerto [FEITO]** (02/11/2026): antes de iniciar o acerto, a representante preenche num botão "pré-acerto" os dias de atraso, as remarcações e as multas da revendedora. Depois a tela fica travada: se a revendedora questionar, a representante diz que "é o sistema". Ao iniciar o acerto, o app pergunta se ela quer atualizar remarcações e multas. A tela tem que explicar o que é cada percentual. Existe em `mobile/pre-acerto-rep.js`.
- **Valor pendente não entra no acerto** (02/11/2026): é 100% com o setor de Inadimplência. No acerto só entram multa de remarcação e atraso.
- **Quem aplica a multa:** no atendimento interno, só o setor de agendamento interno aplica a multa ao agendar; o acerto não muda nada (06/11/2026). Se houver multa do agendamento, o acerto usa. O "10%" é sobre o PENDENTE, não sobre o acerto.
- **Regras novas x antigas (16/11/2026):** a tabela e as multas novas valem desde 27/10 para kit recebido depois; o Marcus quis que a cobrança comece já pela regra nova. Se a revendedora questionar, a funcionária usa a "comissão antiga" por um botão no acerto: muda SÓ o brinde da faixa de R$ 500,00 a 699,99 (antigo Normal R$ 48 e Select R$ 68; novo R$ 44 e R$ 32). Comissão em % e multas ficam iguais. Vale só naquele acerto, fica registrado, o próximo volta à regra nova. **[FEITO]** (`versaoComissaoAntiga`).
- A revendedora assina um "entendi as novas regras" (check). Se não quiser ouvir as regras, há um botão que pula para a tela de assinatura (16/11/2026). **[FEITO]**
- Textos ainda com regra velha em 16/11/2026 (o Marcus mandou arrumar "logo"): tela Atendimento Sorelly > Regras, tabela "Em números" (escada antiga de 60 dias); regra "Pagamento" (15 dias); app da representante e pré-acerto (escada antiga). **[A CONSTRUIR]** conferir se foi corrigido.

### 4.3 Atendimento interno: tempo, atraso e kit retornando
- **Tolerância de chegada [FEITO]:** chegou até 30 minutos depois do horário marcado = no horário. Passou disso: perde 10% do brinde (`domain/atendimento-interno.js`). A funcionária pode alterar esse desconto no lançamento (19/11/2026, "elas podem alterar isso"). A equipe avisa a revendedora na hora de marcar.
- **Tempo para escolher o kit [FEITO]:** pelo valor do kit: até R$ 7.000,00 = 30 min; até R$ 12.000,00 = 45 min; até R$ 17.000,00 = 60 min; acima = 120 min. Dois textos na tela, lidos em voz alta: um antes e um quando o tempo acaba (09/11/2026).
- **Relógio do atendimento [A CONSTRUIR/A CONFIRMAR]** (11/11/2026): hora que chegou, início do atendimento, início e fim da escolha do kit, fim. Campo "cliente aguardando atendimento" para ela não ganhar multa por atraso quando a empresa atrasa (17/11/2026).
- **Kit retornando (10/11/2026):** a revendedora que volta a vender é tratada como kit novo: não tem as etapas do acerto, vai direto para montagem e bipagem, tem 1 hora para escolher e a funcionária explica todas as regras. Precisa puxar a média das 3 últimas vendas dela. Ela já assina a condicional. Abrir o atendimento de kit novo em outra tela. **[A CONSTRUIR]**
- **Renovar o kit outro dia** (16/11/2026): opção quando a cliente não quer renovar hoje. Mais de uma condicional nova na mesma visita. **[A CONSTRUIR]**
- **Crédito de garantia / crédito da revendedora** (16/11 e 23/11/2026): a revendedora pode ter crédito para descontar no acerto (setor de garantias lança). Falta a opção "desconto" no valor a pagar. Hoje a funcionária lança à mão. **[A CONSTRUIR]**
- **Pagamentos antecipados** (23/11/2026): Pix pago antes do acerto aparece como pagamento já vinculado, com comprovante, quando o acerto abre.
- **Resumo do acerto** (16/11/2026): item "8" fixo ao fim dos passos, que a funcionária abre a qualquer hora.
- **Comprovante:** quem anexa é a representante (na calculadora) ou a funcionária (no atendimento interno). O comprovante vai ao consolidado do atendimento interno, não ao Direcionar (17/11/2026).
- **Link de pagamento:** quem gera é a funcionária do setor de Link de pagamento. Ver "não alinhado" B27 em `docs/pendencias/representantes.local.md`.

### Peças liberadas para o próximo mês [FEITO]
Controla só a QUANTIDADE (o valor das peças não interfere).

| Venda | Quantidade base |
|---|---|
| R$ 1.000,00 a 1.999,99 | 10 |
| R$ 2.000,00 a 2.999,99 | 15 |
| R$ 3.000,00 a 4.999,99 | 20 |
| R$ 5.000,00 a 10.000,00 | 35 |

Fator pela dívida: quitado (até R$ 0,01) = 100% · em aberto até 5% = 75% · de 5% a 10% = 50% · acima de 10% = 0 peças.
Exemplo: venda R$ 3.500 (base 20): quitado 20 · até 5% → 15 · 5 a 10% → 10 · acima de 10% → 0.
Trocas: peça defeituosa por nova; a diferença de preço ajusta a venda antes da faixa.

## 5. Prazo do acerto, atraso, remarcação e dívida
Situação: a conta do atraso em dias úteis e o brinde somando estão **[FEITO]** (etapa 1, 11/11/2026). A contagem automática dos dias, a remarcação sem multa, a negociação na hora e o status Jurídico estão **[A CONSTRUIR]**.
Linguagem: sempre em **%**, nunca "pontos". O desconto sai da taxa de comissão, sobre o total da venda.

### 5.1 Duas camadas (nunca misturar)
- **Camada 1, acerto:** a revendedora perde parte da comissão e do brinde. Regra da Sorelly.
- **Camada 2, Jurídico:** executa a nota promissória (kit inteiro se sumiu, saldo devedor se não pagou). Regra do texto da nota: multa de 10%, juros de 1% ao mês pro rata, IPCA, custas e honorários.
O "1% ao dia" é da camada 1. O "1% ao mês" é da camada 2.

### 5.2 Prazo e atraso (uma regra só, para todos)

```
Primeiro dia marcado (ou a data do kit, se nunca marcou)
   ├─ até o 5º dia útil ........ sem acréscimo por dia
   ├─ do 6º ao 30º dia útil .... −1% de comissão e −1% de brinde POR DIA
   └─ depois do 30º dia útil ... sem comissão, sem brinde, Jurídico, sem kit
```

- Dia útil = segunda a sexta, sem feriado.
- O relógio conta do PRIMEIRO dia marcado. Remarcar ou cancelar de novo não reinicia.
- Vale igual para Kit Normal e Prata, atendimento interno e representantes.
- Agenda sem vaga dentro do prazo: vale a primeira vaga livre, sem acréscimo.
- **Confirmado pelas mensagens de 10 e 11/11/2026:** cancelou hoje = multa de remarcação (5%) na hora e novo acerto em até 5 dias úteis (sem sábado, domingo e feriado); passou de 5 dias úteis, +1% por dia (exemplo do Marcus: 7 dias = 7%). Depois de 30 dias úteis: sem comissão, Jurídico, sem kit. O Marcus trocou 60 dias e 20 dias úteis por **30 dias úteis** (11/11/2026). O texto de 03/11 ("mais de 60 dias é Inadimplência") está superado.
- Vale igual para Kit Prata e para atendimento interno e representante (resposta de 11/11/2026).

### 5.3 Pedido antecipado, remarcação e cancelamento

| Caso | Multa | Nova data até |
|---|---|---|
| Pedido antecipado (sem dia marcado, 10 dias ou mais antes da data do kit) | Sem multa | 5 dias úteis depois da data do kit |
| Remarcar com 10 dias ou mais de antecedência | Sem multa | 5 dias úteis depois do primeiro dia marcado |
| Remarcar em cima da hora, cancelar, desmarcar, não veio | 1ª vez −5% comissão e −15% brinde · 2ª −8% e −50% · 3ª em diante −15% e sem brinde | 5 dias úteis; passou, −1% por dia |

- Um benefício sem multa por kit. A escada da vez reinicia a cada kit novo.
- **Motivo obrigatório** em todo registro. Isenção só por motivo sério COM prova anexada.
- Prorrogam o prazo: **Marcus, Nickolas, Lucas e Anamaria**. A representante só com autorização do Marcus.
- As multas SOMAM entre si (cancelamento + atraso + dívida). A comissão nunca fica abaixo de zero.
- **Quem aplica a multa:** no atendimento interno, o agendamento interno ao marcar (06/11/2026). A representante registra no app (pré-acerto, seção 4.2). Se a revendedora desmarcou, a representante marca "desmarcou" com o motivo e a multa sobe se for o caso (09/11/2026).
- Quem pode TIRAR o atraso já aplicado: no atendimento interno, a funcionária altera o desconto de chegada (19/11/2026, seção 4.3). Para a multa de remarcação e o atraso do acerto em geral, quem pode tirar continua **[A CONFIRMAR]** (a lista de quem prorroga está acima).
- Mensagem do sistema "menos de 48 h antes: −2% na comissão e −15% no brinde" apareceu numa tela em 12/11/2026. A regra é 5% (tabela acima). Origem do texto de 2%: **[A CONFIRMAR]**; não achei no código.
- Atrasou mais de uma vez no mesmo kit: as multas somam (resposta de 11/11/2026: "sim, as multas se somam").

| Motivo sério | Prova |
|---|---|
| Falecimento na família | Certidão de óbito ou foto do convite |
| Doença da revendedora ou do filho | Atestado médico |
| Internação | Comprovante do hospital |
| Acidente | Boletim de ocorrência ou relatório do atendimento |
| Parto ou gestação de risco | Atestado ou certidão |
| Roubo ou furto | Boletim de ocorrência |
| Chuva forte, alagamento, greve de transporte | Notícia ou alerta oficial |
| Erro ou atraso da própria Sorelly | Registro nosso |
| Feriado | Automático |

Não isentam: viagem, trabalho, esqueceu, sem dinheiro, mudança, clima comum, "Outro".

### 5.4 Dívida do acerto (faltou pagar)

```
ACERTO, faltou pagar
   ├─ Multa de 10% do valor pendente, na hora (sai da comissão)
   ├─ Pagou 80% ou mais E negocia NA HORA ... leva o kit novo
   ├─ Não negociou na hora ................... sem kit novo; 48 h úteis para negociar; depois executa a nota
   └─ Pagou menos de 80% ..................... sem kit novo (só com o financeiro)
```

- **Negociação (caminho do kit novo):** no máximo 2 parcelas, mínimo R$ 200,00 cada, tudo em até 30 dias corridos e antes do próximo acerto. Dívida abaixo de R$ 400,00 = parcela única. Vale a data de cada parcela. Parcela atrasada: +1% ao dia, teto de 10%.
- **Caminho 2** (dívida alta, ou ela saiu): vai ao setor de **Inadimplência**, que negocia caso a caso. Parcela mínima R$ 150,00.
- A soma das parcelas negociadas é exatamente o valor em aberto (folga R$ 0,01). Sem negociar: nota promissória executada em 48 horas úteis.
- Ao pagar no próximo acerto, quita primeiro a dívida antiga. Segunda dívida seguida: sem kit novo, kit recolhido.
- **Dívida antiga x acerto novo (09/11/2026):** a trava de "pendência bloqueia o kit novo" vale só para dívida de OUTRO acerto. Qualquer pagamento que a revendedora mande liquida primeiro o acerto anterior, e a dívida aparece junto na tela do atendimento interno. A trava de "80% pago + média acima do mínimo" (acima) é a que vale para o acerto atual. O Marcus escreveu "a regra A que vale"; qual era a regra A não está no texto **[A CONFIRMAR]**. No código, `kitNovoLiberado` ainda não testa a dívida de outro acerto.
- **Sem nota promissória assinada, sem kit** (11/11/2026: "manter bloqueando"; há revendedoras que sumiram com o kit sem nota assinada).
- **Prazo de 48 horas úteis para negociar** (11/11/2026: "48h ok"). Uma mensagem do mesmo dia fala em 24 h úteis; a seguinte confirma 48 h.
- **Quem leva kit tem a regra mais dura** (11/11/2026).
- Quem deve e saiu: regra **[A CONFIRMAR]**.

## 6. Comissão da representante [FEITO]
- **Representante NÃO tem bonificação** (nem bônus por nota, nem por Pix direto). Nota e pontos da Avaliação só acompanham e bloqueiam kit novo. Só a comissão paga.
- **Comissão é sempre sobre o acerto** (02/11/2026: "a regra mantém a mesma coisa"); descontos (compra de joias) saem do que ela recebe.
- **Percentual:** 8% padrão. Três representantes têm 10% (negociação à parte; lista em `docs/pendencias/representantes.local.md`). Em 23/11/2026 o Marcus disse: "só essas, coloque por enquanto". Elas não podem saber.
- **Fluxo da comissão (23/11/2026):** o Pix cai no Consolidado, que alimenta as Comissões; o Financeiro dá o "check" e isso gera a conta no Contas a pagar. **[A CONSTRUIR/A CONFIRMAR]** a geração automática da conta.
- **A representante vê só as revendedoras dela e só o que puxa dela** (comissões, consolidado, listagens). Ver seção 6.1.
- Comissão = % de cada representante (Configurador de comissões, padrão 8%) sobre o valor do acerto, por valor RECEBIDO. O que está em aberto fica retido, e retém SOMENTE o valor pendente.
- **Nota promissória bloqueia a comissão** (decisão de 10/11/2026).
- **Mínimo de comissão por acerto: NÃO existe** **[A CONFIRMAR]** (a Cássia aparece com R$ 1,00 porque 8% de R$ 8,00 arredonda). Perguntas abertas: valor, se vale só no cartão ou também no pagamento, e se vale com venda zero.
- Uma linha de pagamento só libera comissão com: conferência do agendamento + promissória (se exigida) + OK do financeiro (Ana Maria ou Nayale) com a conta onde entrou.
- **Kit novo:** R$ 20,00 (R$ 35,00 com expositor). Só com termo assinado. Com expositor, a representante monta e envia a foto no app (sem foto, fica pendente). ACERTO + KIT paga só a comissão do acerto.
- **Reposição entregue:** R$ 15,00 por entrega (decisão final de 21/10/2026; o R$ 20,00 de 20/10 NÃO vale). A comissão só libera com a condicional assinada. Máximo de 15 kits novos por representante.
- **Regra da reposição [FEITO no código de Encomendas]:** valor máximo da reposição pela média de vendas (média de R$ 500,00 = R$ 2.500,00; R$ 1.000,00 = R$ 3.000,00; R$ 2.000,00 = R$ 3.500,00; R$ 3.000,00 = R$ 4.000,00; R$ 4.000,00 = R$ 5.000,00); abaixo de R$ 500,00 não tem direito (Top 100 sempre pode). Quantas por mês: média abaixo de R$ 2.000,00 = 1; de R$ 2.000,00 em diante = 2 (Top 100 = 2). A representante escolhe a revendedora e leva no máximo **10 reposições por semana**. A empresa informa média, tabela de valores e valor máximo; a representante escolhe as peças dentro desse valor e pede à supervisão da montagem para a bipagem bipar. Na empresa, a reposição leva 30 minutos. Top 100: a empresa separa; entrega pelo entregador (taxa obrigatória R$ 15,00, paga antes por Pix com comprovante) ou pela representante (sem taxa). A comissão de 10% de algumas representantes é negociação à parte: **não divulgar**.
- **Reposição x encomenda (11/11/2026):** reposição = peças levadas no MEIO do mês para a revendedora. Encomenda = peças separadas para levar no PRÓXIMO kit. É um setor só: "Encomendas e reposições". Pedido feito 15 dias ou mais antes do acerto fica como encomenda para o próximo kit, sem taxa, e a revendedora pode escolher encomenda em vez de reposição (17/11/2026) **[A CONSTRUIR]**. Revendedora de outro estado: sempre encomenda. Em 17/11 o Marcus disse que "todas as reposições são pagas" (o valor vai para quem entrega). Isso difere do texto acima (taxa só com entregador): ver B36. **[A CONFIRMAR]**
- **Reposição, passo a passo (17/11/2026, teste real):** pedido (WhatsApp) → card com "cobrar taxa de reposição: sim ou não" → separar peças → bipar → rota do entregador → condicional assinada confirma o recebimento → mensagem para a revendedora avaliar a reposição. **[A CONSTRUIR]** as etapas do funil.
- **Novo fluxo do kit novo (teste, desligado) [FEITO, ativo = falso]:** só Curitiba, só revendedoras marcadas. A Representante Kit Novo entrega e ganha **R$ 25,00 + gasolina** e **2%** do primeiro acerto. A Representante Acerto leva **6%** no primeiro acerto e 8% do segundo em diante. Paga nos dias 1, 11 e 21. Falta a data de início e o nome de quem faz o suporte da revendedora nova **[A CONFIRMAR]**.
- **Desconto pela representante:** o desconto dado à revendedora sai da comissão da revendedora (a escolha é da representante). Ordem de pagamento na tela: à vista, combinado, link Sorelly, Mercado Pago. **[A CONFIRMAR se está no app]**
- **Combustível:** só quem teve acerto no período, e o km tem que ser enviado até a data agendada (as funcionárias que também são representantes recebem; 02/11/2026). Km × gasolina do dia ÷ km por litro (11 km por litro). A funcionária do financeiro lança a gasolina no Configurador. Sem km no prazo: não paga naquela data. Km enviado depois do corte é pago na PRÓXIMA data. O valor fixo de R$ 200,00 sem km saiu (02/11/2026). Comissão por consignado e combustível ficam juntos, dentro de Representantes.
- **Datas de pagamento:** grupo A paga dias 1, 11 e 21. Grupo B paga 6, 16 e 26. Corte = 12h do dia anterior **[A CONFIRMAR: o código usa 13h como padrão, editável em Configurar comissões]**. O que for confirmado até o corte entra naquela data; depois, na seguinte. Pagamento só depois do corte.
- **Pagamento feito depois** (Inadimplência → Registrar pagamento) vira linha extra do acerto. A comissão retida entra na remessa seguinte.
- **Representante que sai:** recebe as comissões do período em que saiu. Inadimplência paga depois da saída não gera comissão.
- **Compra de joias pela representante:** desconta da comissão em parcelas (mínimo R$ 50,00). Dívida máxima R$ 1.000,00. Sem comissão para cobrir: alerta e a parcela passa para a data seguinte. Ao sair, a última comissão desconta o que faltar.
- **Pix direto (negociação):** por representante, % da comissão do mês OU valor em reais, só no mês ou fixo. Thalita = 100% fixo. O Pix direto é só uma FORMA de pagar a representante: não muda o percentual da comissão (02/11/2026). Para a revendedora, o valor é pago como qualquer acerto; a única diferença é que já entra um pagamento direto para a representante (11/11/2026).
- **Quem tem expositor sem kit:** a cobrança é no Admin, em Encomendas e reposições, não no app da representante (09/11/2026). Ver `LISTAGENS-E-MONTAGEM.md`, seção 10.
- **Material de apoio (bolsinhas de Natal, 22 e 24/11/2026):** kit de 5 bolsinhas por R$ 10,00 no total, produto próprio criado na DevMaster. NÃO tem comissão: a representante cobra o valor integral junto do acerto. O app mostra um aviso e um registro "vendeu kit de bolsinhas" que soma ao valor a pagar. **[A CONSTRUIR]**
- Quem bipa retorno e quem bipa envio: sem comissão.

### 6.1 Onde a representante trabalha (decisões de 17 a 24/11/2026)
- O app da representante NÃO vai mais para a loja (Apple e Android). Ela usa o próprio Admin, em celular, como uma funcionária comum, só com as telas dela (calculadora de acerto, listagens, revendedoras, consolidado, comissões). O Marcus testa com o perfil de representante dele e depois bloqueia as outras telas. **[FEITO em parte]**
- A visão da representante é só a do app: sem Financeiro. Tudo que ela lança grava no banco do servidor (senão não vale) e liga com Consolidado, Kits novos, Direcionar e Comissões. **[A CONSTRUIR/A CONFIRMAR]** ponta a ponta.
- Cadastros duplicados da mesma representante (ex.: duas fichas) devem ser juntados; as revendedoras dela vêm todas. **[A CONFIRMAR]** se terminou.
- Alerta obrigatório no app: avisos importantes aparecem na tela, travados alguns segundos para forçar a leitura (24/11/2026). **[A CONSTRUIR]**
- Quando a representante faz um acerto, o pedido de conta Pix vai ao Direcionar, igual ao atendimento interno (24/11/2026). A conta de cada representante é fixa ou pergunta à empresa: ela não escolhe entre várias (03/11/2026).

## 7. Comissão da funcionária (atendimento interno) [FEITO]
Funcionária ativa no RH (ligada pelo CPF ao cadastro da DevMaster) usa a tabela abaixo, pela DATA do acerto. Só a comissão muda. Brinde, taxa e multas seguem a normal. Abaixo da primeira faixa vale a normal. Saiu do RH, volta para a normal. Tabelas no Configurador geral.

| Venda | Até 30/11/2026 | A partir de 01/12/2026 |
|---|---|---|
| R$ 300,00 a 499,99 | 35% | normal |
| R$ 500,00 a 999,99 | 45% | 35% |
| R$ 1.000,00 a 1.999,99 | 50% | 45% |
| R$ 2.000,00 ou mais | 50% | 50% |

Comissão especial da ficha (Edna) vale mais. Não usar o grupo 0002 da DevMaster para saber quem é funcionária.
- **Comissão especial por revendedora (09/11/2026):** a ficha da revendedora guarda uma tabela própria (por faixa de venda), que vale no lugar da normal; o brinde segue a tabela normal. Revendedora que fica sem nenhum kit volta à comissão normal. O Marcus pediu que isso fique no cadastro do atendimento interno.
- Essa configuração fica no SERVIDOR, igual para todos os computadores (12/11/2026: "não pode ser cada computador"). **[A CONFIRMAR]** se está assim.
- Quem aplicou a tabela errada em 06/11 e 11/11 (50% para funcionária): a funcionária do RH usa a tabela da seção acima pela DATA do acerto; acertos de dezembro em diante usam a nova.

## 7.2 Contas Pix das representantes (03 a 12/11/2026)
- Cada representante tem conta FIXA ou "pergunta à empresa". Ela não escolhe entre várias contas.
- Regras de direção (Direcionar): quem só tem maquininha de um CNPJ manda o Pix para esse CNPJ; se tem link no CNPJ, o Pix vai nele também; Pix pequeno junto com dinheiro vai para a conta Itaú Black PJ; Pix grande com dinheiro grande: perguntar à empresa. O limite exato entre pequeno e grande **[A CONFIRMAR]** (exemplos do Marcus: R$ 100,00 de Pix com R$ 500,00 de dinheiro vai ao Itaú; R$ 1.000,00 de Pix com R$ 3.000,00 de dinheiro, perguntar).
- Enquanto o Financeiro não confirma, a revendedora pode retirar o brinde se o pagamento foi lançado (03/11/2026; ver seção 3).
- A aba "Contas para pagamentos de acertos - Representantes" fica dentro do Direcionar (12/11/2026). Colunas: representante, maquininha OU link (nunca os dois) e a conta da maquininha. As regras ficam num botão que abre um bloco. O Lucas define a conta por representante, antes.
- A representante pede a conta Pix pelo app e o pedido chega ao Direcionar (09/11 e 24/11/2026).

## 7.1 Metas da revendedora e bônus dos setores (02/11/2026) [FEITO]
- **Meta da revendedora:** vale para o PRÓXIMO acerto, em qualquer data (não só no mês). Base: média de vendas + percentual, em dois níveis (Meta 1 e Meta 2). Kit novo e média abaixo de R$ 1.000,00: Meta 1 = R$ 1.500,00 e Meta 2 = R$ 2.000,00. Bateu a meta: brinde EXTRA (Select e Normal) somado ao brinde que a tabela já dá. Quem não acertou na campanha anterior mantém a meta antiga. Código: `domain/metas.js` (os valores do extra de brinde estão lá, não neste texto).
- **Classes de média (03/11/2026):** a classe antiga "até R$ 999,99" virou duas: R$ 0,00 a 599,99 e R$ 600,00 a 999,99. Os extras de brinde são os valores fechados da empresa menos R$ 4,00 (a revendedora sempre paga uma diferença). Conferido em `domain/metas.js`. **[FEITO]** A tela inicial de Metas é uma tabela com as revendedoras e o objetivo de cada uma; a definição das metas fica em outra tela.
- **Bônus dos setores:** Cadastro de revendedoras (meta = total de revendedoras ativas no fechamento) e Inadimplência (meta = valor recuperado no mês, inclui compras internas das funcionárias). Código: `domain/metas-setor.js`. O bônus do Link de pagamento fica em Link de pagamento → Análises.
- **Atendimento interno:** R$ 5,00 fixo por atendimento; venda acima de R$ 4.000,00 paga R$ 10,00. Quem atende recebe (hoje só duas funcionárias atendem). `domain/comissao-interno.js`.

## 8. Consolidado e controle [FEITO]
- **Consolidado** = só CONTROLE do que entrou (acertos, kits novos, reposições). Status: Kit novo, Kit novo + expositor, Acerto + kit, Acerto + saiu, Reposição. Fica pendente até trazer na empresa e o agendamento dar o OK.
- Quem confere: agendamento (Ana Maria, Mariana, Tamara). Check "Conferido" (dinheiro precisa de "quem recebeu"; valor zero ou maior que o acerto não passa). Check de promissória (só check, sem foto; "sem cond." dispensa).
- O agendamento NÃO vê valores totais, contas nem a tela Comissões. Só quantidades. Quem vê tudo: financeiro, supervisão e diretoria.
- Valores totais, vendas, pago, inadimplência e "Recebido por conta" ficam em **Comissões**.

## 9. Em aberto (perguntas ao Marcus)
RESOLVIDAS pelas mensagens de 02 a 25/11/2026 (detalhe na seção D de `docs/pendencias/representantes.local.md`):
- Prazo de quitar: 30 dias corridos e antes do próximo acerto (o Marcus mandou corrigir os textos de 15 dias em 16/11).
- Jurídico: 30º dia útil (11/11). O texto de 60 dias está superado.
- Média de vendas: 4 vendas (03/11).
- Quem tira o atraso: no atendimento interno, a funcionária (19/11). Falta decidir para o resto.

AINDA EM ABERTO:
1. Valor mínimo de comissão por acerto (seção 6).
2. Select do Prata em R$ 500 menor que na faixa de baixo (seção 2).
3. Quem pode tirar a multa de remarcação e o atraso do acerto, fora do atendimento interno (seção 5.3).
4. Quem deve e saiu (seção 5.4).
5. Tabela "Em números" e textos de 15 dias: conferir se foram corrigidos (seção 4.2).
6. Mínimo de venda para acerto adiado de 45 e 60 dias (seção 4.1): confirmar e construir.
7. Hora do corte do pagamento: 12h (este texto) ou 13h (código) (seção 6).
8. A diferença paga em bonificação entra ou não na média? (duas mensagens de 27/10/2026 dizem o contrário).
9. Média abaixo de R$ 500,00: existe "nova chance" ou não? (seção 4.1, mensagem de 03/11).
10. Brinde: libera ao lançar o pagamento ou só ao confirmar o Financeiro? (seção 3).
11. Qual era a "regra A" de 09/11 sobre dívida de outro acerto e kit novo? (seção 5.4).
12. Pix de representante: onde acaba "pequeno" e começa "grande" (seção 7.2).
13. Reposição: toda reposição paga taxa ou só a feita por entregador? (seção 6 e B36 em `docs/pendencias/representantes.local.md`).

Pendências, conflitos e duplicidades detalhados: `docs/pendencias/representantes.local.md`. Inadimplência e Jurídico: `docs/regras/INADIMPLENCIA-E-JURIDICO.md`. Listagens, montagem e condicionais: `docs/regras/LISTAGENS-E-MONTAGEM.md`.

## 10. De onde vem cada regra
Código: `domain/consignado.js` (faixas, brinde, Prata, média, atraso, negociação), `domain/comissoes.js` (comissão, datas, combustível, novo fluxo do kit novo `nf`), `domain/comissao-funcionarias.js`, `domain/comissao-interno.js` (atendimento interno: R$ 5,00 por atendimento; venda acima de R$ 4.000,00 paga R$ 10,00; só quem atende), `domain/pix-direto.js`, `domain/encomendas.js` (reposição).
Histórico completo: `docs/DECISOES.md`, `docs/negocio/REGRA-CANCELAMENTO-E-REMARCACAO.md`, `docs/arquivo/regras-historico/domain-comissoes-representantes-06-10-2026.md`, `docs/negocio/CONDICIONAL-TERMO-E-NOTA.md`.

## Decisões do Marcus em 25/11/2026 (questionário, 2ª rodada)
- [FEITO] Atraso no acerto: vale −1% por dia útil, do 6º ao 30º (regra de 11/11). Código `atrasoPctDiaUtil:1` já está certo. A escada antiga (5, 10, 15, 20 e 25 dias, de 26/10) está SUPERADA; `atrasoAcerto` (lista por faixas) fica sem uso.
- [A CONSTRUIR] Comissão e brinde ANTIGOS: o botão "usar a comissão antiga" fica até 31/12/2026, só para quando a revendedora questionar. No APP da representante TEM que incluir. No ATENDIMENTO INTERNO vale só a tabela NOVA (tirar a opção antiga de lá). Código a conferir: `domain/consignado.js` (`versaoComissaoAntiga`, `BRINDE_FAIXA_500_ANTIGA`), `pages/AtendimentoInternoCalculadora.js`, `domain/acerto-derivado.js`.
- [FEITO] Corte do pagamento da comissão: 13h. Código `corteHora:13` (`domain/comissoes.js:20`) já está certo. O doc que dizia 12h está errado.
- [FEITO] Taxa de deslocamento: R$ 35 só abaixo de R$ 300 (`TAXA_BAIXA_VENDA`, `consignado.js:38`; a faixa de R$ 20 saiu em 07/10 e segue fora, decidido em 25/11).
- [FEITO] Meta de inadimplência: valem as faixas do código, de R$ 18.000 a R$ 26.000 (`metas-setor.js`). A mensagem de 19/10 (R$ 15, 20 e 25 mil) fica SUPERADA.

## Decisões do Marcus em 25/11/2026 (questionário, 3ª rodada)
- [A CONSTRUIR] Revendedora com dívida de OUTRO acerto NÃO leva kit novo (bloqueia). Hoje o sistema só avisa: `domain/consignado.js:168-173` (`kitNovoLiberado`) e a calculadora do atendimento interno.
- [DECIDIDO] A diferença paga em bonificação ENTRA na média de vendas.
- [FEITO] Taxa de deslocamento (Marcus, 25/11/2026, "vamos deixar conforme o que estava antes"): só R$ 35 abaixo de R$ 300. NÃO existe faixa de R$ 20 de R$ 300 a R$ 499,99 (a faixa saiu em 07/10). Código: `TAXA_BAIXA_VENDA` (`consignado.js:38`) e `taxaAbaixoDe:300` (`:93` e `:260`), texto em `informativos.js:34`.
- [A CONSTRUIR] Kits altos: o Encomendas tem PREFERÊNCIA, mas NÃO é o único que monta (as vendas cresceram e elas não dão conta). Tirar a trava "só Encomendas" (`soEncomendas`). Falta o corte (R$ 3.000 ou R$ 4.000).
- [DECIDIDO] Extra do brinde da meta: R$ 4 a MENOS que a peça (Marcus, 02/11/2026). O código está certo (R$ 124 e R$ 92; R$ 164 e R$ 118).
- [A CONSTRUIR] Venda abaixo de R$ 500 pede motivo no atendimento interno E no app da representante. Código `minimoRepresentante:500`; conferir o app.
- [A CONSTRUIR] Média de vendas: padronizar o cálculo num só lugar (hoje a representante digita). Média abaixo de R$ 500 não tem nova chance, SÓ com autorização da Diretoria.
- [A CONSTRUIR] Brinde: a revendedora pode ESCOLHER o brinde antes, mas ele só LIBERA depois da confirmação do pagamento.
- [DECIDIDO] Expositor: executar a nota promissória com mais de 90 dias. Os números 60 e 70 ficam superados.
- [A CONFIRMAR] Termo da condicional: o Marcus disse "deixa o da condicional". Termo e telas ficam como estão por enquanto. Falta confirmar o que "deixar" quer dizer (ver pendência REP B1/B2).

## Decisões do Marcus em 25/11/2026 (questionário, 4ª rodada)
- [DECIDIDO] Termo da condicional: "deixa como está por enquanto". Termo (15 e 60 dias) e sistema (30 e 30) ficam como estão até nova ordem.
- [A CONFIRMAR] Prazo do pedido da listagem: o Marcus disse "isso ok" duas vezes. Lido como a regra de 09/11 (2 dias úteis antes, até 07:30). O código usa 48 horas (`src/server/app-rep/listagens.js:4` e `:82`). Confirmar antes de mudar.
- [DECIDIDO] Multa de cancelamento em cima da hora: a regra de "−2%" NÃO existe mais. Fica a tabela do sistema (1ª vez −5% na comissão e −15% no brinde).
- [DECIDIDO] O setor se chama COBRANÇA (não Jurídico). [A CONSTRUIR] Conferir menus, telas e textos que ainda dizem "Jurídico".
- [DECIDIDO] Kits altos: o corte é R$ 3.000, e o Encomendas tem PREFERÊNCIA para montar, NÃO é obrigatório (as outras montadoras também montam).
- [A CONFIRMAR] Extra do brinde da meta: o Marcus disse "ela tem as regras dos brindes, o que falta é pagar integral sem desconto, só isso". Fica o código atual (R$ 4 a menos que a peça, 02/11) até ele explicar o "integral sem desconto".
