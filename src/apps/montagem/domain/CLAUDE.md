# Regras de Financeiro e Acerto (domain/)

Fonte de verdade das regras. Números ficam no Configurador, não dentro de tela. Itens "(a confirmar)" não foram decididos: pergunte ao Marcus antes de implementar.

## Faturamento (quem lança: Amanda, todo dia)
- Ela lança: faturamento do dia, acertos (total ACUMULADO do mês, não o do dia: dia 1 = 10, dia 2 = 30 → o sistema calcula 20 no dia 2) e quantidade de revendedoras até o dia anterior.
- Visão geral: só o gráfico de crescimento de revendedoras (janela até 90 dias, barras diárias, rolagem embaixo, tooltip com data, quantidade e variação).
- Projeção: média diária da janela escolhida (7, 15 ou 30 dias). Em janeiro caem cerca de 100 revendedoras; em fevereiro retoma (queda fixa: a confirmar).
- **Crescimento de revendedoras (06/10/2026):** o Marcus atualiza o total UMA vez por dia (às 10h), na Visão geral ("Atualizar hoje", só supervisão/diretoria; `REV_LANCAR` com `unico`, guarda a hora em `revAtualizadoEm`). Sábado, domingo e dia sem lançamento ficam no último valor (`completarDias` em financeiro.js). O gráfico tem botão "Tela cheia" (Esc fecha). A Visão geral tem a tabela "Revendedoras mês a mês" (1 a 12: começou com, terminou com, aumento/queda e %; o mês atual vai até hoje, em tempo real; `resumoMensalRevendedoras`). O lançamento "dia anterior" da Previsão de faturamento (Amanda) continua existindo e também grava revendedoras: confirmar se ele sai desse formulário.
- **Projeção de revendedoras = média de crescimento DIÁRIO calculada dos lançamentos reais, conforme o filtro** (7/15/30/60/90 dias, mês atual ou história completa): variação na janela ÷ dias da janela, projetada até o dia 1 de cada mês (`crescimentoPorDia`/`taxaCrescimento` em financeiro.js; antes era número fixo). Dias sem aumento (fim de semana) entram na média. A quantidade aparece em cima das barras de projeção e da última barra real.
- Tabela do ano: Mês, Contas a pagar (vermelho), Faturamento (verde), Resultado. Sem coluna Situação.
- Tabela "Revendedoras / Previstos / Realizados", nesta ordem, com linha de média embaixo (usada para prever os próximos meses).
- Fechamento do mês: base é o começo do dia 1. Setembro/2026 fechou com 2.023 revendedoras, R$ 1.446.262,20 e 1.809 acertos. Deve ser possível definir o resultado de um mês anterior depois do dia 1.
- A confirmar: o que são os 94/95/96% no topo; quem lança Contas a pagar; de onde vem o sistema de estoque.

- **Faturamento e Contas a pagar diário (09/10/2026):** a tela "Previsão de faturamento" agora se chama **Faturamento**. Registro OFICIAL = dia anterior (fixo; 08/10 = 291 acertos e R$ 207.855,36). Campo "Hoje" (`s.fatHoje`, ação `FAT_HOJE`) é só acompanhamento: entra na média e na previsão (`fatEfetivo` em financeiro.js) e deixa de valer no dia seguinte. Contas a pagar tem a aba **Diário** (`pages/ContasPagarDiario.js`, `s.contasPagasDiario`, `CPD_SET`): por dia, CNPJ 34/46/59/67, contas por fora, total, faturado, acertos e resultado; botão "Copiar resumo em texto". Mês com dias lançados (e não fixado): o PAGO do mês no resto do sistema = soma dos dias (`contasDoMes`), o A PAGAR = total previsto do mês − pago. Outubro/2026 (1 a 8) veio do Marcus (`VERSAO_CPD` em financeiro.js; o resumo dele tinha "contas por fora" total de R$ 65.651,60, mas a soma dos dias dá R$ 53.302,53 — valem os dias). **Previsão de nov/dez (09/10/2026):** média por acerto de novembro = média ATUAL do mês (com o "Hoje") + 5%, dezembro + 15% (`ALTA_MEDIA` em financeiro.js, fixo no código, mover para o Configurador quando o Marcus pedir); acertos = revendedoras (pela janela 7d/15d/30d/60d/90d/mês escolhida no botão da Visão geral) × % previstos × 95%. Outubro na tabela "Faturamento mês a mês" da Visão geral (`tabelaMeses` em resumo-financeiro.js) é PREVISÃO: meta × média atualizada. Hoje (09/10) até o momento: 329 acertos, R$ 239.256,21. Em Contas a pagar → Diário há o bloco "Pago e falta pagar por CNPJ" (previsto vem de Por CNPJ, pago = soma dos dias, falta = quanto enviar). Tabela "Crescimento por mês" (components/tabela-crescimento.js): mês, revendedoras, aumento e faturamento; na Visão geral e na Faturamento.

## Calculadora de acertos (app da representante e admin)
Ordem das etapas: Condicionais → Remarcação → Crédito de garantia → Vendas + Pagamentos → Brindes → Kit novo → Peças próximo mês → Trocas → Devolução → Observações.
- Devolução = total das condicionais − (vendidas + brindes + trocas).
- Remarcação (comissão / brinde): 1ª −5% / −15% · 2ª −8% / **−50%** · 3ª ou mais −15% / −100%. A representante marca cada uma como "isenta de multa" (motivo justificado) ou "com multa"; só as com multa contam.
- **Brinde por falta de pagamento (regra que vale):** faltou até 5% → recebe 80% do brinde · de 5% a 10% → 50% · mais de 10% → perde o brinde todo.
- Taxa de deslocamento (soma ao valor a pagar): venda abaixo de R$ 300 → **R$ 35** · de R$ 300 em diante → não paga (07/10/2026: a faixa de R$ 20 saiu, a pedido do Marcus). Devolver o kit no meio do mês com venda menor que R$ 300 também paga a taxa (regra combinada, ainda não lançada no sistema).
- Kit novo liberado se pago ≥ 80% do acerto; abaixo disso, só com autorização do financeiro.
- Pagamento: Pix, Link, Crédito, Débito, Dinheiro, Acerto com loja. Descrição da conta obrigatória (lista editável em Configurações). Parcelas 1x a 6x só no crédito; o valor entra inteiro, sem dividir.
- Falta de pagamento: as parcelas negociadas somam exatamente o valor em aberto (folga R$ 0,01) para liberar brinde. Se a revendedora não quiser negociar: sem brinde e nota promissória executada em 48 h úteis.
- Brinde só libera após pagamento confirmado. Dois cartões: Normal e Select (código "BB" + 0 a 2 letras + 4 números). Brinde BB só no BB; Normal pode usar Normal ou BB. O que passar do liberado vira excedente e soma ao valor a pagar.
- Assinatura digital obrigatória ao finalizar o acerto e na entrega de kit novo.

### Tabela do Kit Padrão (venda líquida: comissão / brinde Normal / brinde Select). O teto da faixa inclui o centavo.
- até 299,99: 0% / R$ 0 / R$ 0
- 300 a 499,99: 15% / R$ 0 / R$ 0
- 500 a 699,99: 25% / R$ 48 / R$ 68
- 700 a 999,99: 30% / R$ 88 / R$ 96
- 1.000 a 1.599,99: 35% / R$ 118 / R$ 122
- 1.600 a 2.499,99: 40% / R$ 196 / R$ 144
- 2.500 a 4.999,99: 40% / R$ 312 / R$ 188
- 5.000 a 6.999,99: 45% / R$ 368 / R$ 232
- 7.000 ou mais: 45% / R$ 442 / R$ 282

### Kit 100% Prata (modalidade à parte; NÃO altera o Kit Padrão)
- Seletor "Modalidade do Kit" na ficha da revendedora, com histórico (anterior, nova, data, usuário). Aparece "Kit 100% Prata" nas listagens e nos apps.
- Revendedora escolhe Prata no app com 10 dias de antecedência da data do acerto. Trocar de modalidade exige aviso de 10 dias.
- Tabela (comissão / brinde Normal / brinde BB): 300 a 499,99: 20% / R$ 0 / R$ 38 · 500 a 699,99: 30% / R$ 44 / R$ 56 · 700 a 999,99: 35% / R$ 74 / R$ 82 · 1.000 a 1.599,99: 40% / R$ 112 / R$ 96 · 1.600 a 2.499,99: 45% / R$ 188 / R$ 122 · 2.500 a 4.999,99: 45% / R$ 282 / R$ 168 · 5.000 a 6.999,99: 50% / R$ 344 / R$ 224 · 7.000+: 50% / R$ 422 / R$ 262.
- Mínimo R$ 300 em vendas para renovar o kit; abaixo disso cobra só as peças vendidas, sem kit novo.
- Peça fora do acerto ou sem etiqueta conta como vendida. Tag riscada ou extraviada: R$ 5 cada.
- Brinde só com pagamento integral confirmado e revendedora em dia. Crédito até 6x sem juros, parcela mínima R$ 80.
- Agendar com 5 dias de antecedência. Cancelar no dia perde 5% da comissão; atraso perde 1% por dia. Reagendar com 10 dias.

## Comissão das representantes, remessas e inadimplência (domain/comissoes.js)
- Retirada na empresa: opção "Retirou sozinha" na retirada de kits (a funcionária logada faz junto); marca todos os kits prontos e aparece no histórico do Consolidado dos kits.
- Consolidado (consrep) é onde o agendamento (Ana Maria, Mariana, Tamara) confere: o check "Conferido" (dinheiro precisa de "quem recebeu"; valor zero ou maior que o acerto não passa) e o check de promissória (só check, sem foto; "sem cond." dispensa).
- Comissão = % de cada representante (Configurador de comissões, padrão 8%) sobre o valor do acerto, calculada por valor RECEBIDO: o que está em aberto fica retido (não desconta nada).
- Uma linha de pagamento só libera comissão com: conferência do agendamento + promissória (se exigida) + OK do financeiro (Ana Maria ou Nayale) com a conta onde entrou. O financeiro dá o OK em Comissões.
- Consolidado = só CONTROLE do que entrou (acertos, kits novos, reposições, todos com coluna Status: Kit novo, Kit novo + expositor, Acerto + kit, Acerto + saiu, Reposição). Fica pendente até trazer na empresa e o agendamento dar o OK. Cabeçalho compacto: total de atendimentos + contagem por status (clicar filtra), "Para conferir" e "Notas promissórias pendentes" ao lado. Linha de total do filtro logo abaixo do cabeçalho, SÓ com quantidades: valores totais, vendas, pago, inadimplência e o gráfico "Recebido por conta" ficam em Comissões (topo), junto com o bloco pequeno de Pix representante (escolher a representante + consolidado com filtro).
- O agendamento (Mariana, Tamara) NÃO vê valores totais, contas (Point, link…) nem a tela Comissões: só quantidades (atendimentos, por representante). Quem vê tudo: financeiro (Ana Maria, Nayale), supervisão e diretoria. Função `veTotais` em domain/equipe.js.
- Comissões: Representante → Mês → 3 datas de pagamento (como as listagens). Cada valor tem check do financeiro com o NOME de quem confirmou. Em cada data: combustível (km × gasolina do dia ÷ km por litro; a Nayale preenche a gasolina no Configurador), ajuste do fechamento anterior e o pagamento (forma, conta de saída, data, valor), tudo inline.
- App da representante tem a tela "Comissões": só as dela, mesmo formato (mês → 3 datas), compacto. Ela lança o KM do combustível em cada data até o corte (12h do dia anterior). Sem km no prazo (ou enviado depois), o combustível pago é só o valor fixo de R$ 200,00 (Configurador). Depois do corte a tela trava; o financeiro ainda ajusta no admin. Regra em resumoSituacao (domain/comissoes.js).
- Pix representante (forma nova no app): o financeiro escolhe a representante e dá OK em Comissões (filtro só Todos/Pendentes); o valor entra como PAGO na comissão pendente dela (lista de pagamentos da data). Falta cobrir = confirmado + combustível + ajuste − pago.
- Datas: grupo A paga 1/11/21, grupo B 6/16/26. Corte = 12h do dia anterior (hora e dias configuráveis): o que for confirmado até o corte entra naquela data; depois, na seguinte. Pagamento só depois do corte.
- Pagamento feito depois (Inadimplência → Registrar pagamento) vira linha extra do acerto; o financeiro confirma a conta e a comissão retida entra na remessa seguinte.
- Kit novo: R$ 20 (R$ 35 com expositor; valores finais desde 02/11/2026; com expositor a representante monta e envia a foto no app, sem a foto fica pendente; ACERTO + KIT paga só a comissão do acerto, sem esse valor), só com termo assinado (assinatura do app, ou check manual do agendamento no Consolidado).
- **DECIDIDO em 10/11/2026 (Marcus):** a comissão retida (revendedora não pagou tudo) retém **somente o valor pendente**; a nota promissória **bloqueia** a comissão (manter). A confirmar: lista com os ~25 representantes e grupos; manual do folder digital (aba "Kit novo" no app da representante: ainda não feito).

## Peças liberadas para o próximo mês
Controla só a QUANTIDADE. O valor individual das peças escolhidas não interfere.
1. Base pelo valor da venda: R$ 1.000 a 1.999,99 → 10 peças · 2.000 a 2.999,99 → 15 · 3.000 a 4.999,99 → 20 · 5.000 a 10.000 → 35.
2. percentual_em_aberto = valor_em_aberto / valor_total_do_acerto × 100.
3. Quitado (diferença de até R$ 0,01) → 100% da base · em aberto até 5% → 75% · acima de 5% e até 10% → 50% · acima de 10% → 0 peças.
4. Na tela do acerto mostrar "Peças liberadas para o próximo mês: XX" e o detalhe: valor da venda, quantidade base, valor e % em aberto, % de liberação aplicado, quantidade final.
Exemplo: venda R$ 3.500 (base 20): quitado 20 · até 5% → 15 · 5 a 10% → 10 · acima de 10% → 0.
Trocas: peça defeituosa por nova; a diferença de preço ajusta a venda antes da faixa.

## Cabeçalho do acerto
Nome da revendedora fixo ao rolar. Consolidado travado no topo: Vendas / Comissão / Valor de Acerto / Pag. 1 (forma) / Valor restante. Ícone redondo no topo leva às regras. Endereço de casa e de trabalho com estrela de favorito.

## Comissões e regras das representantes (atualização 06/10/2026)
**Movido para `docs/regras-historico/domain-comissoes-representantes-06-10-2026.md` (24/11/2026, economia de contexto; texto inteiro, nada apagado). Ler ao mexer no Consolidado das representantes, em Comissões ou nas Regras das representantes** (`Grep` pelo assunto e leia só o trecho).

## Decisões de 13/10/2026 (Marcus)
- **BB não é só brinco:** toda peça cujo código começa com BB (brinco, anel, colar, pulseira…) é brinde Select. Frase única `AVISO_BB` em `consignado.js`, usada no app da representante, na Atendimento Sorelly, nas Regras dos acertos e nas regras escritas.
- **Comissões no app da representante (`mobile/comissoes-rep.js`):** cada atendimento mostra nome, comissão, "pagou R$…" da revendedora e os ✓ Agendamento / Financeiro. O "a pagar" de cada data é a comissão TOTAL em tempo real (confirmada + pendente). Combustível só no campo de km do fim do período e no **consolidado do mês** (Comissão + Combustível = A pagar · Já pago · Restante). Quando o financeiro atualiza o preço da gasolina, a representante recebe aviso (`COMIS_GAS_VISTO`).
- **Pix direto (negociação):** `domain/pix-direto.js`, `s.negPix`. Bloco "Negociação do Pix direto" em Regras dos representantes (só diretoria): por representante, % da comissão do mês OU valor em reais, só no mês ou fixo, mais valor extra com motivo. Thalita = 100% fixo. O financeiro vê em Representantes & Kits → Financeiro → **Pix representantes** (antes "Pix direto a enviar") (`pages/PixDireto.js`): meta, enviado, falta e prazo (próxima data de pagamento). Bônus de R$ 80 por R$ 1.000 enviado direto fica para depois.
- **Reposição entregue:** R$ 15,00 por entrega (decisão final do Marcus em 28/10/2026; o R$ 20,00 de 20/10 saiu; Encomendas e reposições já usava R$ 15, em campo separado) (Configurador de comissões, `c.reposicao`), linha descrita como comissão. A representante conta as peças (como no kit novo) e entrega a **condicional assinada**, que sobe nas condicionais em aberto da revendedora (`REPOSICAO_ENTREGAR` também cria a linha no Consolidado). A comissão só libera com a condicional assinada.
- **Kit novo no acerto:** o bloco tem UM botão "Confirmar kit novo" que leva a outra tela (entregar o kit e conferir as peças). Conferência SEM câmera no protótipo (a câmera é do app de verdade): toca-se na peça ou digita o código; cada peça mostra código, descrição e PREÇO. Peça que não é do kit: a representante pode deixar com a revendedora, só fica registrado (não é erro de ninguém); só peça que FALTA conta como erro.
- **Resumos ao finalizar:** acerto + kit novo = resumo dos dois (mensagem/PDF do acerto leva o kit conferido); só acerto = PDF do acerto; kit novo e reposição = "Resumo da entrega" (`mensagemEntrega`).
- **Menu:** Representantes (Operação, Financeiro, Regras, Desempenho) e Atendimento interno viraram setores próprios; Kits ficou só com a montagem. Não existe "Dinheiro": o nome é **Financeiro**.
- **Abrir direto:** em Celular da representante, botão "Abrir acerto já preenchido" (ou `?acerto=1`): Andrielle (Dayanne) com venda, condicionais, pagamento, brindes e peças. A condicional pode ser adicionada à mão no acerto.
- Quem bipa retorno e quem bipa envio: sem comissão por enquanto.

## Decisão de 19/10/2026 (Marcus)
- **Representante NÃO tem bonificação** (nem bônus por nota de R$ 200, nem R$ 80 por R$ 1.000 de Pix direto). Nota e pontos da Avaliação ficam só como acompanhamento e bloqueio de kit novo. O placar das representantes, se vier, também não paga nada. Só a comissão (8%, kit novo, reposição, combustível) paga representante.
- Lista de representantes de `pessoas.js` confirmada (23, sem Sabrina e Julia G.). Listagens continuam simuladas.
- **Combustível (02/11/2026, vale no lugar do R$ 200,00 fixo das notas de 06/10):** só quem teve acerto no período; sem km no prazo não paga naquela data; km enviado depois do corte (até o corte da data seguinte) é pago na PRÓXIMA data, junto com o km dela. Código: `resumoSituacao` em `domain/comissoes.js` (`kmAtras`, `kmTarde`, `combFixo` sempre falso). O campo `combSemEnvio` ficou sem uso.
- **Compras de joias (02/11/2026, só decisão):** desconta da comissão em parcelas (mínimo R$ 50,00); dívida em aberto máxima R$ 1.000,00 por representante; sem comissão para cobrir, alerta e a parcela passa para a data seguinte; se parar de trabalhar, a última comissão desconta o que faltar. Ver `docs/DECISOES.md` de 02/11/2026.

## Cancelamento, remarcação e prazo do acerto (10/11/2026, ainda não construído)
Regra completa, exemplo da Carolina e perguntas abertas: `docs/negocio/REGRA-CANCELAMENTO-E-REMARCACAO.md`. Resumo: cancelou, desmarcou ou não veio = multa da vez já vale (1ª −5 pontos e −15% de brinde · 2ª −8 e −50% · 3ª −15 e −100%). A revendedora tem **5 dias úteis** (segunda a sexta, sem feriado) para FAZER o acerto; do 6º ao **30º** dia útil a multa sobe **1 por dia** (pontos da taxa e % do brinde, somando à base da vez); depois do limite: sem comissão, sem brinde, **Jurídico** e sem kit. Vale igual para Kit Normal e Prata e para atendimento interno e representantes. A multa nova substitui a faixa de atraso nesse caso. Decisões: `docs/DECISOES.md` de 10/11/2026.
- **Representante que sai (10/11/2026):** recebe as comissões do período em que saiu; inadimplência paga depois da saída não gera comissão.
- **Reposição** = meio do mês; **encomenda** = próximo kit; setor único ("Reposições & Encomendas").

- **Atualização 10/11/2026 (2ª rodada), regra do prazo:** sem multa se cancelar/remarcar com 10 dias ou mais; Jurídico em 30 dias úteis para todos; relógio conta desde o 1º cancelamento; motivo obrigatório; isenção só com prova; prorrogam Marcus, Nickolas, Lucas e Anamaria (a confirmar qual). Kit só com nota promissória assinada; máximo 15 kits novos por representante; comissão do acerto adiado paga quando o acerto acontecer; reposição com um campo só de R$ 15,00.

- **11/11/2026 (regra consolidada, ainda não construída; vale no lugar das notas de 10/11 acima):** ler `docs/negocio/REGRA-CANCELAMENTO-E-REMARCACAO.md`. Atraso conta do primeiro dia marcado; uma regra só (5 dias úteis, −1% por dia, Jurídico no 30º dia útil; a escada `atrasoAcerto` e o `juridicoDias` 60 saem); pedido antecipado e remarcação até 5 dias úteis; kit novo só com 80% pago e negociação na hora; negociação em até 2 parcelas de no mínimo R$ 200,00 dentro do mês, valendo a data da parcela (`prazoQuitarDias` 15 sai); 24 h úteis sem negociar executa a nota; brinde com dívida não muda; sempre em %, nunca "pontos".

## Comissão das funcionárias (11/11/2026, Marcus)
- Funcionária ativa no RH (ligada pelo CPF ao cadastro de cliente da DevMaster, `/api/funcionarias`) que faz acerto no Atendimento Sorelly usa a tabela de funcionária da DATA do acerto: até 30/11/2026 = R$ 300 a 499,99 → 35%, R$ 500 a 999,99 → 45%, a partir de R$ 1.000 → 50%; a partir de 01/12/2026 = R$ 500 a 999,99 → 35%, R$ 1.000 a 1.999,99 → 45%, a partir de R$ 2.000 → 50%. Só a comissão muda (brinde, taxa e multas seguem a normal). Abaixo da primeira faixa vale a normal. Saiu do RH, volta para a normal. Tabelas editáveis no Configurador geral (`domain/comissao-funcionarias.js`). Comissão especial da ficha (Edna) vale mais. Não usar o grupo 0002 da DevMaster para saber quem é funcionária (tem sócios, família e ex-funcionárias).
