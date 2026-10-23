# Relatório de custos da empresa (Contas a pagar → Análise de custos)

**Documento TRAVADO.** Regras do Marcus de 20/10/2026. Toda regra nova entra aqui E em `DECISOES.md` no mesmo dia. Quem for mexer nessa tela (pessoa ou Claude) lê este arquivo antes. Código: `domain/contas-empresa.js` (grupos, fornecedores, setor, nota, Pix) e `pages/ContasPagarEmpresa.js` (tela). Versão registrada em `domain/versoes.js` (0.12.7).

## Regra de ouro do Marcus
**Mudar só o que ele pediu. Não reescrever textos que já existiam.** Em tela, menos texto e mais leitura limpa.

## Objetivo
Ver o custo da empresa agrupado e ir abrindo: grupo → fornecedor/natureza → como foi pago → contas. Escrever na busca um setor (ex.: Encomendas) ou uma funcionária e ver tudo dela. Botão "Ver por setores" troca o relatório para custo de pessoal por setor.

## Tabela
- Colunas: **Total, Pago, Falta pagar, % do total**. **Falta pagar em VERMELHO**, Pago em verde.
- Indicadores do topo: Total do mês, Pago, **Falta pagar (vermelho)**, **Atrasado (LARANJA, #F97316)**, Pago de outro mês. Nos cartões dos CNPJs "Falta" também em vermelho.
- **Sem coluna "Sala".** A sala aparece só na primeira linha da descrição da conta (ex.: "Patriarca ... CNPJ 46 · Sala 703"), **só o número da sala, sem endereço**.
- Filtro "Nota": todas / com nota / sem nota.

## Grupos (do topo para dentro)
- **Folha e pessoal** (abre em): Salários e benefícios, **Representantes** (comissão do consignado + combustível, juntos) e **Encargos da folha** (FGTS, INSS, medicina do trabalho; continuam "a pagar").
  - Em Salários e benefícios, "Salário e adiantamento (por funcionário)" junta o de todos e abre por funcionário. Bônus mensal do Nickolas (R$ 1.000 até dia 15 + R$ 1.000 até dia 30, meses 10, 11 e 12/2026, sem nota) entra na linha do Nickolas.
- **Matéria-prima** (abre em): **Bruto** e **Banho**. Dentro de cada um, **um fornecedor = uma linha** (mesmo pago de CNPJs e formas diferentes), e dentro do fornecedor: Com nota (pago pelo CNPJ) e Sem nota (Pix revendedora).
  - Bruto: MegaSul, Art Ello, **Point**, Linda, Tucano, Charme, Xangai, Ramos Laser, Bruto Joias e Cia.
  - Banho: Pontual e **Ellos** (Ellos Galvanoplastia/Ellos Banho é OUTRA empresa, só do mesmo grupo da Art Ello; nunca junta com a Art Ello).
- Soltos: Financeiro (empréstimos, juros), Administrativo, Impostos, Material gráfico e embalagem (Office Graf, plásticos, flanela, expositores), Sistemas e tecnologia, Axis e H&O, Segurança (Higor), Marketing e tráfego pago (Facebook, Diego Franco), **Comissões de funcionários** (Comissão Atacado).
- Família fica fora da visão Sorelly; "Sorelly + família" soma os dois. Casa e escritório da família ficam na Família.

## Com nota × sem nota
- **Com nota = pago pelo CNPJ: boleto, transferência e CHEQUE** (os cheques são do CNPJ 34; alguns saíam do Itaú, isso acabou, e contam como com nota).
- **Sem nota = Pix revendedora** e o que é pago por fora.

## Pix revendedora lançado pela equipe (Pagamentos a fornecedores)
Tudo que lançam lá para Point, Pontual e outros **fornecedores** entra dentro do fornecedor e já conta como pago. Prestadores de serviço NÃO entram ainda.
**Sem duplicar:** o DevMaster vai ser eliminado depois; **vale o mais recente**. Regra aplicada: o Pix da equipe só conta DEPOIS da última baixa de Pix daquele fornecedor no DevMaster (o DevMaster junta vários Pix num valor só, então não se compara pagamento a pagamento).

## Aluguéis (dentro de Administrativo, "Aluguéis (total, todas as salas)")
Uma linha por CNPJ (34, 46, 59, 67) somando; abrindo, aparecem as contas. Nomes nas linhas: **CNPJ 34 · Sorelly**, **CNPJ 46 · Mayz**.
- **CNPJ 34 (Patriarca):** aluguel R$ 19.160,71 e os R$ 13.141,08 (que o DevMaster lança como "Condomínio") **entram juntos nos aluguéis**; cada um é **dividido ao meio** entre as duas duplas de salas: **Salas 501 e 502** e **Salas 503 e 504** (o sistema divide sozinho).
- CNPJ 46 (Patriarca): **Sala 703**.
- CNPJ 67 (Axis, Galvão Locações): **Sala 203**. (Endereços que o Marcus passou, sem uso na tela: R. Vinte e Quatro de Maio, 412 e R. Marechal Deodoro, 857.)
- CNPJ 59 (Serenity, Comercial The World): **Sala 1401**, aluguel e condomínio (condomínio R$ 460,66 continua na linha Condomínio).

## Setores e pessoas
- Setor de cada funcionária vem de `domain/pessoas.js` (Encomendas: Elen, Agatha, Eduarda Gabriela e **João Guilherme**, tio do Marcus). A busca acha o setor; "Ver por setores" mostra o custo de pessoal por setor. FGTS, INSS e medicina aparecem à parte (sem divisão por setor).
- **Higor** é o segurança do Marcus: salário R$ 5.000 (R$ 3.000 em carteira + R$ 2.000 por fora), 13º, extras (Neg VIP, baladas R$ 1.000 cada; falta definir valor e teto mensal antes dos eventos). Grupo Segurança, tudo junto. **Camilly** é funcionária (Cadastro de revendedoras), não prestadora.
- **Setores decididos pelo Marcus (20/10/2026), fixos em `SETOR_FIXO` (domain/contas-empresa.js):** Thalyanny = Cadastro de revendedoras; Camilly, Thalyanny, Michele e Hellen formam o setor **Cadastro de revendedoras**, e **Link de pagamento (Hellen) e Kits novos (Michele) ficam DENTRO dele** (`SETOR_PAI`; em Ver por setores, Cadastro de revendedoras abre com Link de pagamento e Kits novos dentro). Julia da Silva Zambonin = Marketing (se demitiu; atualizar depois). Rebeca = Marketing (demitida). Thaina = RH. Sthefany (grafia do DevMaster) = Atendimento de kits (a confirmar).
- Prestadores de serviço: lista antiga descartada; falta definir os reais (Helcio está certo).

## Aba "Funcionários e representantes" (20/10/2026, no menu Contas a pagar)
O Marcus mandou fazer "do jeito que está": menu do topo **Contas a pagar → Funcionários e representantes** (`pages/FolhaFuncionarias.js`, só supervisão). Duas partes: **Funcionários** (salário base do RH, salário + adiantamento, VR, VT, 13º, bônus e outros, hora extra do RH, total, pago, falta pagar, diferença para o base; clicando abrem as linhas com o nome em cima e o que é embaixo) e **Representantes** (comissão do consignado + combustível). **Negociação de cada funcionário** aparece dentro da pessoa (`NEGOCIACOES` em domain/contas-empresa.js).
**Negociação do Nickolas (Marcus, 20/10/2026):** bônus de out a dez/2026 por bom trabalho durante o ano, R$ 2.000 por mês (R$ 1.000 no dia 10 + R$ 1.000 no dia 23). Outubro dia 10: pago em dinheiro; dia 23 e todo novembro e dezembro: pendentes. Combinado R$ 6.000, já pago R$ 1.000, restante R$ 5.000. Em janeiro verificam novas condições. (Substitui a regra antiga de dia 15 e dia 30.)

### Histórico: a visão "Folha por funcionária" dentro da Análise de custos foi rejeitada (20/10/2026)
O Marcus NÃO quer a visão "Folha por funcionária" dentro da Análise de custos: o botão saiu e a tela ficou como antes. O arquivo `pages/FolhaFuncionarias.js` fica guardado, sem uso, como base para a ABA NOVA de Funcionários e Representantes (a definir com ele; ele achou confuso salário base, salário + adiantamento e falta o 13º). A descrição abaixo é só da versão rejeitada (só a supervisão via; tinha salário). `pages/FolhaFuncionarias.js`. Cada funcionária em uma linha: salário base (cadastro do RH), salário + adiantamento, VR, VT, bônus e outros, hora extra (lançada no RH), total, pago, falta pagar e a diferença entre salário + adiantamento e o salário base (laranja quando passa do base). Clicando na funcionária abrem as linhas: nome em cima e embaixo o que é (Salário, Adiantamento, VR, VT) com a data. Meta do Marcus: **diminuir a folha (cerca de R$ 500 mil de folha geral) e a hora extra**.
**O que o sistema NÃO tem ainda:** INSS e IRRF por funcionária (o DevMaster só tem a guia total do INSS e do FGTS), hora extra paga (o DevMaster não tem natureza de hora extra; o RH do sistema só tem horas lançadas à mão, hoje zero), espelho de ponto e holerite. Sem isso não dá para saber o custo exato de cada pessoa.
**Pedir ao RH (começando pela Edna Pereira Cardoso):** holerite dos últimos 3 meses (bruto, hora extra 50% e 100%, DSR, INSS, IRRF, desconto de VT, adiantamento, líquido, FGTS); espelho de ponto dos mesmos meses (horas extras por dia, banco de horas); contrato (salário base, jornada, acordo de compensação); regra do VR, do VT e do adiantamento; provisão de férias e 13º. Depois, para todas: uma planilha única com nome, setor, base, horas extras do mês (50% e 100%), valor da hora extra, bônus, valor por fora (se houver), VR, VT, adiantamento, INSS, FGTS, IRRF e líquido; e quem autoriza hora extra e qual o limite.
**Edna (Outubro/2026):** base R$ 3.639,00; salário R$ 3.112,99 (pago 06/10) + adiantamento R$ 1.270,62 (a pagar 20/10) = R$ 4.383,61, R$ 744,61 acima do base antes de qualquer desconto; VR R$ 525,00; VT R$ 276,00; total R$ 5.184,61. Tudo pelo CNPJ 46 (nada por fora). Atenção: o salário pago em 06/10 pode ser de setembro; confirmar no holerite.

## Barra de filtros (alinhada em 20/10/2026)
Duas fileiras alinhadas: Mês, Situação, Nota e Buscar; embaixo Ver por setores, Ver por dia, + Lançar conta e Limpar filtros (só aparece com filtro).

## Ajustes de 20/10/2026 (noite)
- **Coluna "Peso" (barras) SAIU** da Análise de custos: já tem o % do total. A última coluna passou a se chamar "De quem é".
- **Descrição de cada conta por extenso**, sem a sigla do DevMaster (SAL, VAL, PIX...): a segunda linha mostra o que é a conta (Salário, Adiantamento, Vale Alimentação, Pix Banho Pontual...) e quando foi pago ou vence.
- **Negociação por MÊS:** abrir a pessoa mostra só as parcelas daquele mês (ex.: Nickolas = R$ 2.000 no mês, dias 10 e 23), nunca o total de R$ 6.000. Todo mês soma R$ 2.000 a mais.
- **Edna é o primeiro exemplo bem elaborado** (domain/remuneracao.js + remuneracao.local.js, gitignored): dentro dela, quadro mês a mês de julho a setembro/2026 com salário-base, adiantamento, pagamento de salário, horas extras (horas e R$, já inclusas no salário), diferença salarial, VR, VT, 13º, total recebido, total sem o 13º e % da hora extra sobre o salário-base. Hora extra: R$ 445,24 (17h01) em julho, R$ 481,36 (15h08) em agosto, R$ 1.263,85 (36h35) em setembro = 2,8 vezes a de julho e 34,7% do salário-base. Total dos 3 meses R$ 16.459,02 (R$ 14.146,70 sem o 13º). O salário de R$ 3.112,99 pago em 06/10 no DevMaster é o de SETEMBRO (salário é pago no mês seguinte; adiantamento no dia 20 do mês). Outras funcionárias entram na mesma estrutura quando o RH mandar o relatório.
- **Comissão Consignado Previsão (R$ 48.000):** lançamento "Comissão Consignado Previsão" do CNPJ 59, emitido em 25/05/2026 e vencendo 21/10/2026, a pagar. É uma previsão que o financeiro deixou no DevMaster para reservar o dinheiro da comissão do dia 21; quando as comissões reais forem lançadas, a previsão deve sair para não contar em dobro. Mesma coisa: Férias Previsão R$ 5.000 e duas Demissão Previsão de R$ 3.000. Decisão do Marcus pendente.

## Tabela de Funcionários: layout definido pelo Marcus (20/10/2026)
Colunas, nesta ordem: **Funcionária | Salário base (do contrato) | Total recebido (tudo que recebeu) | Adiantamento (40%, dia 20) | Salário (o resto, pago no mês seguinte) | VR | VT | Horas extras | Bônus | 13º | Outros | Pago | Falta pagar**. Em cima, uma linha de grupos: **Contrato**, **Recebido**, **SALÁRIO: os dois juntos são o salário** (Adiantamento e Salário, com a escrita na cor azul), **ALÉM DO SALÁRIO** (VR, VT, horas extras, bônus, 13º, outros) e **SITUAÇÃO**. O TOTAL fica no topo, logo abaixo do cabeçalho. Saiu a coluna "Salário+adiant. − base" (confundia).
**Regras que o Marcus confirmou:** o adiantamento é **40% do salário base** (pago no dia 20); o salário é o resto, pago no mês seguinte, já com descontos e com as horas extras e a diferença salarial dentro. **As funcionárias entram UMA A UMA**: o RH manda o relatório de remuneração de cada uma (formato da Edna). Quando existe o relatório da pessoa para o mês, a linha usa os valores dele (Edna em julho, agosto e setembro); nos outros meses vêm do DevMaster.
**Pedir ao RH, por funcionária:** relatório de remuneração dos últimos meses no formato da Edna (salário-base, adiantamento, pagamento de salário, horas extras em horas e R$, diferença salarial, VR, VT, 13º, total recebido) e, se possível, INSS, IRRF e FGTS de cada mês.

## Deysiane (holerite de setembro/2026) e o que são os "bônus" (20/10/2026)
Holerite da Deysiane (Mayz, CNPJ 46, supervisora administrativa) lido do PDF e guardado em `remuneracao.local.js`. **Setembro/2026:** salário base R$ 5.560,00; horas extras 20:00 a 65% (R$ 834,00) e 12:10 a 85% (R$ 569,00); reflexo da hora extra no DSR R$ 280,60 (total de hora extra R$ 1.683,60 = 30,3% do salário base); vencimentos R$ 7.243,60; INSS R$ 815,60 (11,26%); taxa negocial R$ 130,00; desconto do adiantamento R$ 2.224,00 (40% do base); **líquido R$ 4.074,00**; FGTS do mês R$ 579,48 (a empresa paga). Recebido no mês (adiantamento + líquido) R$ 6.298,00, sem VR e VT (não vêm no holerite). A hora extra é paga a 65% e 85% (norma sindical), acima dos 50% e 100% da lei. O salário de R$ 4.620,20 pago em 06/10 no DevMaster está R$ 546,20 acima do líquido do holerite (R$ 4.074,00): conferir.
**Duas coisas diferentes (o Marcus pediu para desvendar):** (1) **hora extra oficial**, que está dentro do salário e do holerite; o DevMaster não tem natureza de hora extra. (2) **O que ele paga a mais por fora** (R$ 50, R$ 100 a mais para a funcionária ficar), lançado no DevMaster como **Bônus adicional** (filial "por fora", Pix, quase sempre nos dias 02 e 09). Já o **Bônus** do DevMaster parece ser meta/prêmio (R$ 600 para Agendamento e Cadastro, R$ 350 no dia 15, Bonus Funcionários, Nickolas R$ 2.000). Em Outubro: **Bônus adicional R$ 6.664 em 22 lançamentos** (8 de até R$ 100 = R$ 670; 5 de R$ 101 a R$ 200 = R$ 770; 9 acima de R$ 200 = R$ 5.224, dos quais Priscila R$ 3.235); **Bônus R$ 9.467 em 19 lançamentos**. Na tabela de Funcionários, Bônus e Bônus adicional agora são duas colunas separadas. A confirmar com o Marcus o que cada um é.

**Deysiane, relatório de julho a setembro/2026 (Marcus, 20/10/2026):** julho salário-base R$ 5.285,00, adiantamento R$ 965,95, salário R$ 2.997,26, hora extra 18h32 (R$ 838,48), VR R$ 450,00, bônus R$ 180,00, total R$ 4.593,21 (voltou de férias); agosto base R$ 5.390,70, adiantamento R$ 1.884,38, salário R$ 3.926,05, hora extra 27h48 (R$ 1.394,64), diferença salarial R$ 354,42, VR R$ 525,00, bônus R$ 200,00, total R$ 6.535,43; setembro base R$ 5.560,00, adiantamento R$ 1.383,10, salário R$ 4.074,00, hora extra 32h10 (R$ 1.683,60), diferença salarial R$ 1.683,60, VR R$ 475,00, bônus R$ 770,00, total R$ 6.702,10. **Total dos 3 meses R$ 17.830,74.** A hora extra dela dobrou de julho (R$ 838,48) a setembro (R$ 1.683,60). **Conferir com o RH:** a "diferença salarial" de setembro é igual à hora extra (parece repetida); o holerite desconta R$ 2.224,00 de adiantamento mas o relatório mostra R$ 1.383,10 recebidos (diferença R$ 840,90); salário de outubro no DevMaster R$ 546,20 acima do líquido do holerite.

**Nayale e Camilly, relatórios de julho a setembro/2026 (Marcus, 20/10/2026)** em `remuneracao.local.js`. Nayale: total R$ 17.898,76 (jul R$ 5.550,96; ago R$ 6.063,44; set R$ 6.284,36), hora extra R$ 698,44, R$ 561,59 e R$ 815,65, bônus R$ 100, R$ 600 e R$ 650, provisão de férias de R$ 6.000,00 em outubro. **Conferir:** em agosto e setembro a soma das linhas passa do total do relatório exatamente pela "diferença salarial" (R$ 313,68 e R$ 663,19). Camilly: total R$ 14.933,40 (jul R$ 4.499,39; ago R$ 4.590,77; set R$ 5.843,24 com férias de R$ 2.100,07), hora extra pequena (R$ 161,92 e R$ 303,69) mas bônus alto (R$ 880, R$ 670 e R$ 1.460); o relatório não traz o salário-base de setembro. Relatório basta para ver custo e hora extra; holerite é preciso para INSS, FGTS, IRRF e para conferir divergências.

## Em aberto (perguntar ao Marcus)
- **ABA NOVA em Contas a pagar só de funcionários e representantes** (pedido de 20/10/2026): perguntas feitas ao Marcus; não construída ainda.
- **Impostos:** hoje só DAS (R$ 85 mil a pagar, 5 CNPJs), ICMS e taxas. O Marcus diz que falta imposto: INSS e FGTS são impostos? IRPJ, ISS, PIS/Cofins, parcelamentos, IPTU? Em qual natureza do DevMaster ficam? IOF fica em Impostos e juros no Financeiro?
- Material gráfico e embalagem entra em Matéria-prima? Segurança e Comissões de funcionários entram em Folha e pessoal?
- Previsões de férias (R$ 5.000) e demissões (R$ 6.000) em "a pagar": reais ou estimativa?
- Onde o combustível do João Guilherme é lançado; Google Ads (hoje só Google Workspace); setor de Rebeca, Julia da Silva Zambonin, Thaina e Angélica; nomes diferentes no cadastro (Sthefany/Sthafany, Thalyanny/Thaylianny).
- Regras de negociação do bônus do Nickolas (o Marcus diz ter passado): conferir se o de 15/10 já foi pago (não aparece pago no DevMaster).
