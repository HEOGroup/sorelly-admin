# Mapa de controle do Financeiro: o que o sistema já controla e o que não controla (25/11/2026)

Documento ÚNICO e vivo. Escrito em 25/11/2026 a partir do código, dos documentos do Financeiro e das mensagens do dono nas conversas de 28/09 a 25/11/2026.
Origem do pedido: prioridade "Recuperação financeira urgente" (mensagem do dono de 25/11/2026).
**Sem valores reais e sem nomes de pessoas** (só a função). Valores e frases com data ficam em `docs/pendencias/recuperacao-financeira.local.md` (fora do Git).
Este mapa NÃO cria regra nova e NÃO cria outro sistema. Ele só diz onde cada coisa está hoje.

Marcação:
- **[FEITO]** a tela e a rota existem no código e fazem o trabalho principal.
- **[PARCIAL]** existe um pedaço. Falta parte do dado, da conta ou da rotina.
- **[NÃO EXISTE]** não há tela nem conta no sistema.
- **NÃO VERIFICADO** não foi possível confirmar (este levantamento leu só código e documentos; não abriu a tela e não consultou dados).

Regras detalhadas de cada assunto (não repetidas aqui):
`FINANCEIRO-CONTAS-E-DIRECIONAR.md` · `FINANCEIRO-FAMILIAR.md` · `FATURAMENTO-E-PREVISAO.md` · `FISCAL-E-CNPJS.md` · `FORNECEDORES-E-COMPRAS.md` · `INADIMPLENCIA-E-JURIDICO.md` · `docs/negocio/cerebro-financeiro/`.

## 1. Objetivo

Entender por que a empresa opera no vermelho. Depois, controlar o caixa pelo sistema.

```
Hoje:    vende muito  ─►  dinheiro entra  ─►  dinheiro sai  ─►  contas negativas e crédito do banco
Meta:    saber, por mês e por CNPJ, quanto entra, quanto sai, para onde vai e quanto sobra
```

### 1.1 Cinco números diferentes (nunca misturar)

| # | Número | O que é | O que NÃO é | Onde aparece no sistema |
|---|---|---|---|---|
| 1 | **Venda bruta da revendedora** | Tudo que a revendedora vendeu às clientes, a preço de venda | Não é dinheiro da empresa. Uma parte é a comissão dela | Atendimento interno › Calculadora ("valor de vendas") · Financeiro › Receber › Faturamento › Consolidado interno (coluna "Venda") · Financeiro › Receber › Representantes › Consolidado dos representantes (coluna "Vendas") · Financeiro › Relatórios › Estoque Sorelly (campo "Vendido na ponta", manual) |
| 2 | **Valor que fica com a Sorelly (acerto)** | Venda bruta menos a comissão da revendedora. É o que ela DEVE pagar no acerto | Não é dinheiro recebido. Parte fica como "acerto - loja" (não pagou na hora) | Os dois Consolidados (coluna "Valor do acerto") · Financeiro › Receber › Faturamento › Faturamento (faturamento lançado do dia e do mês; vem dos títulos a receber da DevMaster) · Financeiro › Relatórios › Resultado do mês (quadro Faturamento) |
| 3 | **Faturamento fiscal** | Notas fiscais de saída, por CNPJ, no ano. Serve para o imposto e para o limite anual de cada CNPJ. Brinde entra aqui | Não é dinheiro. Não é lucro | Fiscal › Painel e notas · Fiscal › Limite de faturamento |
| 4 | **Caixa recebido** | Dinheiro que entrou de verdade: Pix, link, cartão, dinheiro. Inclui dívida antiga paga no mês e compra de funcionária. Não inclui o "acerto - loja" | Não é o faturamento. Parte nunca passa pelo banco (Pix da revendedora direto a fornecedor, prestador ou sócio) | Financeiro › Receber › Contas a receber · Financeiro › Relatórios › Resultado do mês (Receber e "Entrou nas contas") · Financeiro › Contas bancárias (variação do saldo) |
| 5 | **Resultado (lucro)** | O que sobra depois do custo das peças e de todas as despesas do mês | Não é a variação do saldo. Empréstimo novo aumenta o saldo e não é lucro. Compra de estoque diminui o saldo e não é prejuízo | **[NÃO EXISTE]** como lucro. O Resultado do mês mostra só o resultado de CAIXA (entrou menos saiu) |

Fluxo dos cinco números:

```
(1) Venda bruta
      │ − comissão da revendedora
      ▼
(2) Valor de acerto ───────────────► (3) Faturamento fiscal (nota por CNPJ, com brindes)
      │ − acerto - loja (não pagou)
      │ + dívida antiga paga no mês
      │ + compras de funcionárias
      ▼
(4) Caixa recebido ──► banco do CNPJ          (aparece no saldo)
      │            └─► Pix direto a terceiro   (NÃO aparece no saldo; já conta como conta paga)
      │ − contas pagas (folha, bruto, banho, impostos, bancos, sócios...)
      ▼
    Resultado de CAIXA do mês  (existe)          (5) Lucro do mês  (não existe)
```

Pontos ainda NÃO VERIFICADO sobre os cinco números:
- Se o "faturamento lançado" (número 2) inclui brindes e trocas. O dono apontou soma de brindes num relatório em 27/10/2026.
- Quanto dura o ciclo real de cada kit (30, 45 ou 60 dias). O percentual de venda do estoque só faz sentido com o ciclo certo.

## 2. Tabela de cobertura

Resumo: **9 [FEITO] · 16 [PARCIAL] · 1 [NÃO EXISTE]** (26 itens).
Atenção: [FEITO] quer dizer "a tela existe". A coluna "Confiável?" diz se o número dela pode ser usado para decidir.

| # | Item | Estado | Tela que existe (caminho do menu) | De onde vem o dado | Quem alimenta | Confiável? | O que falta |
|---|---|---|---|---|---|---|---|
| 1 | Saldos reais das contas | [PARCIAL] | Financeiro › Contas bancárias | Lançamento manual, conta por conta. A DevMaster tem saldo zero em todas as contas | Sócia do caixa e supervisora do financeiro | **Parcial.** Só vale no dia em que foi lançado. Há dias sem lançamento e já houve saldo que sumiu. Não há horário fixo | Rotina diária com dono e hora. Marca "repetiu o dia anterior". Leitura automática (Open Finance) não decidida. Se o saldo grava no servidor: NÃO VERIFICADO |
| 2 | Saldos negativos | [FEITO] | Financeiro › Pagamentos › Direcionar (bloco "Contas negativas") · Financeiro › Contas bancárias | Calculado do item 1 | Automático | **Parcial.** Herda o problema do item 1 | Histórico: quantos dias cada conta ficou negativa no mês |
| 3 | Cheque especial | [PARCIAL] | Financeiro › Contas bancárias (limite por conta; linha "disponível = saldo + limite") | Limite digitado no cadastro da conta | Sócia do caixa informa. Lançamento manual | **Parcial.** Os limites foram passados por mensagem; se todos estão cadastrados: NÃO VERIFICADO. Uma conta tem duas informações diferentes | Quanto do limite está em uso por dia. Juros pagos por conta no mês |
| 4 | Rotativos | [PARCIAL] | Financeiro › Contas bancárias (o rotativo fica junto da conta do mesmo banco e CNPJ) | Lançamento manual do saldo | Sócia do caixa | **Parcial.** O saldo aparece. O custo não | Juros e tarifa do rotativo por mês. Registro da amortização diária (regra 6 do Cérebro) |
| 5 | Empréstimos e financiamentos | [PARCIAL] | Tela Empréstimos (rota existe; **não está no menu do topo** do Financeiro; abre a partir de um empréstimo clicado na Análise de custos) · RH › Contratos › Empresa › Crédito bancário · Financeiro › Contas bancárias (lançar "crédito bancário" que entrou) | Parcelas: títulos da DevMaster. Dados do contrato: digitados, guardados só no navegador | Financeiro lança os títulos. Contratos: ninguém ainda | **Não.** Não há lista fechada de contratos, saldo devedor, taxa nem data final. Um contrato longo está num título só | Inventário de todos os créditos por CNPJ (contrato, saldo devedor, parcela, taxa, fim, garantia). Pôr a tela no menu. Guardar no servidor |
| 6 | Juros e tarifas | [PARCIAL] | Financeiro › Relatórios › Análise de custos (grupo "Financeiro (empréstimos, juros)") | DevMaster (títulos por natureza e prefixo). Juros e multa de uma baixa: campo na baixa feita no sistema | Financeiro | **Parcial.** Principal e juros do empréstimo vêm juntos na parcela. Juros de cartão já apareceram no lado da família. Título de previsão pode duplicar | Uma linha só "custo financeiro do mês": juros de empréstimo, rotativo, cheque especial, tarifas, IOF, antecipação |
| 7 | Antecipação de recebíveis e taxas de maquininha | [PARCIAL] | Financeiro › Relatórios › Taxas e adquirentes (tabela de taxas) · Link de pagamento › Relatórios › Taxas e recebimentos (taxa e antecipação de cada link pago) | Arquivo local com as taxas. Cálculo por link | Dono passou as tabelas | **Parcial.** A tabela existe. O total pago de taxa por mês, em todas as maquininhas, não existe. Se todas as tabelas dos bancos entraram: NÃO VERIFICADO | Custo mensal de taxas e de antecipação por CNPJ. Quanto do recebível está antecipado ou dado em garantia |
| 8 | Contas a pagar | [FEITO] | Financeiro › Contas › A pagar · Financeiro › Contas › Pagas | DevMaster (títulos em aberto e baixas, leitura automática) mais o que foi pago no sistema | Financeiro lança na DevMaster | **Parcial.** Título "previsão" soma em dobro com o título real. Há títulos com data errada. Pix direto demora a ter baixa | Limpeza das previsões. Baixa automática do que a DevMaster já baixou. Conferência no dia 1 |
| 9 | Contas a receber | [FEITO] | Financeiro › Receber › Contas a receber | DevMaster (títulos e baixas) mais recebimentos lançados no sistema | DevMaster: assistente de faturamento. Sistema: sócio que direciona os Pix | **Parcial.** Depende da baixa na DevMaster. "Acerto - loja" precisa sair da conta do recebido | Recebido separado por CNPJ. Coluna de inadimplência no Resultado do mês |
| 10 | Compras contratadas (bruto e banho) e parcelas futuras | [PARCIAL] | Cadastro de peças › Pedidos › Compras de Bruto (resumo por mês: bruto, banho, comprado) · Financeiro › Contas › Fornecedores › Negociações · Financeiro › Contas › A pagar (meses futuros) | Pedidos lançados no sistema, faturas do banho e títulos futuros da DevMaster | Supervisora do cadastro de peças (pedidos e faturas) e diretor que negocia (negociações) | **Parcial.** A dívida já lançada aparece. O pedido que ainda não tem romaneio ou fatura não tem valor. Se os pedidos estão em dia: NÃO VERIFICADO | Plano de compra do mês. Valor estimado do pedido desde a escolha. Um quadro "já comprometido por mês" |
| 11 | Pagamentos parcelados a fornecedores | [FEITO] | Financeiro › Contas › Fornecedores › Negociações (fornecedor › pedidos › parcelas) · Financeiro › Pagamentos › Resumo geral | Lançamento manual das negociações e Pix confirmados | Diretor que negocia e sócio que direciona os Pix | **Parcial.** O lançamento completo do pedido existe só para um fornecedor de banho. O teto mensal existe no código | Versão do "Lançar pedido" para todos os fornecedores. Calendário de vencimentos |
| 12 | Pix de revendedora | [FEITO] | Financeiro › Pagamentos › Direcionar · Financeiro › Receber › Contas a receber (botão Lançar recebimento) · Financeiro › Pagamentos › Resumo geral · Financeiro › Família › PIX revendedoras | Pedido da atendente ou da representante e lançamento do financeiro | Atendimento interno, representantes e sócio que direciona | **Parcial.** Pix direto a terceiro não passa pelo banco. Há lançamentos antigos sem comprovante | Coluna "confirmado na DevMaster". Mais de um comprovante por pagamento |
| 13 | Direcionar | [FEITO] | Financeiro › Pagamentos › Direcionar · Financeiro › Pagamentos › Contas das representantes | Fila de pedidos do sistema, regras e saldos | Sócio que direciona (e quem tem acesso ao financeiro) | **Sim** para o fluxo. A sugestão por saldo herda o item 1 | Limite por conta e por período de fornecedor. Teste de ponta a ponta com o aplicativo da representante |
| 14 | Conciliação com a DevMaster | [PARCIAL] | Financeiro › Controle › Arrumar na DevMaster · Financeiro › Contas › A pagar (coluna "Na DevMaster") · cruzamento do Pix dos sócios em Contas a receber | Cruzamento automático por fornecedor, tipo, valor e data | Automático. A correção é feita na DevMaster pela equipe | **Parcial.** Cruza fornecedor e Pix de sócio. Não existe conciliação com extrato do banco | Baixa automática de tudo que a DevMaster baixou. Conferência no dia 1. Conciliação com extrato |
| 15 | Recebimentos antecipados | [FEITO] | Financeiro › Receber › Contas a receber (Lançar recebimento, fica pendente até o acerto) | Lançamento no sistema; depois cruza com a DevMaster | Sócio que direciona os Pix | **Parcial.** O Resultado do mês e a Inadimplência não leem esse Pix antes da baixa | Crédito da revendedora (sobra de pagamento). Leitura nos relatórios |
| 16 | Financeiro familiar | [FEITO] | Financeiro › Família › Home da família, Contas (Pagar e Pagas), PIX revendedoras, Sócios, Cadastro de prestadores, Pró-labores · Financeiro › Faturas | Lançamento no sistema (a família nunca fica na DevMaster) | Financeiro, com supervisão da sócia do caixa | **Parcial.** Há itens em dobro entre empresa e família. Fatura de cartão só de um cartão | Regra contra duplicidade conferida no código. Faturas dos outros cartões |
| 17 | Retiradas e pró-labore dos sócios | [PARCIAL] | Financeiro › Família › Pró-labores · Financeiro › Família › PIX revendedoras · Financeiro › Família › Sócios · Financeiro › Relatórios › Resumo do grupo | Cadastro de pró-labore e Pix lançados | Financeiro | **Parcial.** O que é "pró-labore" tem duas definições. Conta da família paga pela empresa é marcada só em alguns casos | Um número só por mês: tudo que saiu da empresa para os sócios e a família (pró-labore, Pix, contas pagas pela empresa) |
| 18 | Fluxo de caixa por CNPJ | [PARCIAL] | Cérebro do Financeiro (conta pronta no código; **sem tela desde 24/11/2026**, ver seção 3) · Financeiro › Relatórios › Previsão de caixa (o dono disse em 13/11/2026 que não usa; ainda está no menu) | Saldos lançados mais contas a pagar por CNPJ e por dia | Automático | **Não.** Falta a entrada prevista por CNPJ (a DevMaster junta o recebido num CNPJ só). A Previsão de caixa divide a entrada em partes iguais e lê arquivo antigo | Entrada prevista por CNPJ. Lugar na tela para a orientação do dia |
| 19 | Fiscal | [PARCIAL] | Fiscal › Painel e notas · Fiscal › Limite de faturamento · Fiscal › CNPJs | Lançamento manual das notas e do acumulado. Contas a pagar vêm do Financeiro | Sócio que cuida do fiscal | **Parcial.** Último dado fiscal citado nos documentos é de outubro. Se foi atualizado depois: NÃO VERIFICADO | Puxar notas de entrada e saída. Lista completa de impostos. Perguntas abertas com a contabilidade |
| 20 | Inadimplência | [PARCIAL] | Inadimplência › Revendedoras › Dívidas, Cobrança do dia, Pagamentos, Serasa, Kits em atraso, Relatórios, Regras · Inadimplência › Funcionários | Planilha do setor carregada no sistema e dívida que nasce do acerto | Analista de inadimplência | **Parcial.** A tela segue o fluxo antigo. As regras de negociação de novembro ainda não estão nela | Saldo em aberto por mês e por ano. Quanto se recupera por mês. Separar dívida de furto de kit |
| 21 | Previsão de faturamento | [FEITO] | Financeiro › Receber › Faturamento · Financeiro › Relatórios › Resultado do mês (aba Previsão) | DevMaster (acertos previstos pela data de devolução do kit; faturamento do relatório de notas, robô diário) mais lançamento do dia | Automático e assistente que lança o faturamento | **Parcial.** A alta de dezembro e janeiro no código é diferente da regra dita. A projeção usa média, não a agenda real | Corrigir a alta. Simulação do mês pela agenda de acertos, dia a dia |
| 22 | Custo das peças (CMV) e margem | [PARCIAL] | Cadastro de peças › Pedidos › Compras de Bruto (coluna "custo das saídas", robô diário da DevMaster) · Financeiro › Relatórios › Estoque Sorelly (custo do vendido, margem, giro do estoque, meses de estoque) | DevMaster (custo da peça em cada acerto) e preenchimento manual do mês | Automático e quem preenche o Estoque Sorelly | **Parcial.** Dois lugares com o mesmo conceito. Se o custo cadastrado na DevMaster está certo (bruto + banho): NÃO VERIFICADO. O custo do estoque com as revendedoras é manual | Um número só de custo do vendido. Margem por mês dentro do Resultado. Margem por fornecedor e por tipo de peça |
| 23 | Folha e encargos | [PARCIAL] | Financeiro › Relatórios › Análise de custos (grupos "Folha e pessoal" e "Encargos da folha"; botão de funcionários e representantes) · RH (horas extras, negociações) | DevMaster (títulos de salário, vale, encargos) e RH | Contabilidade calcula. Financeiro lança. RH informa hora extra | **Parcial.** Hora extra não tem natureza própria na DevMaster. Holerite só de poucas pessoas. Bônus "por fora" misturado com bônus de meta | Hora extra e bônus por pessoa e por mês. Custo total por pessoa (com encargos) |
| 24 | Marketing e mídia | [PARCIAL] | Marketing › Tráfego pago · Financeiro › Relatórios › Análise de custos (grupo "Marketing e tráfego pago") | Lançamento do gestor de tráfego e títulos da DevMaster | Gestor de tráfego e financeiro | **Parcial.** O gasto aparece. A ligação gasto × revendedora nova × faturamento: NÃO VERIFICADO | Custo por revendedora nova. Retorno por mês |
| 25 | Capital de giro | [NÃO EXISTE] | Nenhuma tela junta os números | Seria calculado: saldo + a receber + estoque − a pagar − dívida bancária de curto prazo | — | **Não** | Definir a conta com a contabilidade. Depende dos itens 1, 5, 8, 9 e 22 |
| 26 | Resultado do mês (DRE) | [PARCIAL] | Financeiro › Relatórios › Resultado do mês (abas Faturamento e receber, Pagar, Entrou nas contas, Previsão) | DevMaster (receber e pagar), saldos lançados | Automático mais saldo manual | **Parcial.** É resultado de CAIXA. A prova real (diferença entre o esperado e o saldo) ainda não fecha. Crédito bancário novo precisa sair da conta | DRE de verdade: receita, custo das peças, despesas por grupo, custo financeiro, retiradas. Hoje não existe |

### 2.1 O que a tabela mostra em uma frase

```
ENTRADA  ─ bem coberta (Direcionar, Contas a receber, Faturamento)
SAÍDA    ─ coberta, mas com ruído (previsões em dobro, baixa atrasada)
SALDO    ─ depende de lançamento manual sem rotina fixa        ◄── ponto mais fraco
DÍVIDA   ─ sem inventário (empréstimos, rotativo, cheque especial, juros)
LUCRO    ─ não existe (só resultado de caixa)
```

## 3. O Cérebro do Financeiro

### 3.1 O que é
Hoje a sócia que cuida do caixa escreve à mão, todo dia e por CNPJ: o que vence, o saldo, e se precisa mandar Pix para aquele CNPJ. O Cérebro é a parte do sistema que deve fazer essa conta sozinha. Princípio: o dinheiro vem de um lugar só (os acertos das revendedoras), então o Cérebro olha tudo junto.

```
Saldos lançados (por conta) ─┐
Contas a pagar por CNPJ e dia ├─► Cérebro ─► avisos por CNPJ: urgente, enviar Pix, amortizar, observar
Limites de cheque especial  ─┘
```

### 3.2 O que ele já decide sozinho (versão 1, de 18/11/2026)

| Decisão | Estado |
|---|---|
| Cobertura dia a dia por CNPJ, com as contas atrasadas, até o fim do mês seguinte | [FEITO] na conta |
| Urgência com 1 a 2 dias de antecedência | [FEITO] na conta |
| Conta "pouco negativa": mandar só o suficiente para ficar positiva | [FEITO] na conta |
| Rotativo e conta do mesmo banco tratados como grupo | [FEITO] na conta |
| Ordem de quais contas negativas liquidar primeiro no CNPJ principal | [FEITO] na conta |
| Amortizar o rotativo com o saldo positivo da conta do grupo | [FEITO] na conta |
| Aviso de saldo desatualizado | [FEITO] na conta |
| Sugerir o CNPJ de cada Pix no Direcionar (regras de Pix, saldo e contas de hoje e amanhã) | [FEITO] e em uso |

Ele só SUGERE. Quem confirma é sempre o financeiro.

### 3.3 Onde está no código

| Peça | Arquivo |
|---|---|
| Conta dos avisos do dia (`orientacaoDoDia`) | `src/apps/montagem/domain/cerebro-financeiro.js` |
| Teste com dados inventados (14 verificações) | `scripts/testar-cerebro-financeiro.mjs` |
| Saldo, disponível e limite por conta (`posicaoEm`) | `src/apps/montagem/domain/saldos-contas.js` |
| Sugestão do CNPJ de cada Pix | `src/apps/montagem/domain/direcionar-pix.js` |
| Cruzamento com a DevMaster | `src/apps/montagem/domain/casar-pagos.js` |
| Regras escritas | `docs/negocio/cerebro-financeiro/` (README e 01 a 07) |

**Achado deste levantamento:** em 24/11/2026 o bloco "Avisos do dia" saiu da tela Direcionar, a pedido do dono. A função que monta os avisos (`avisosCerebro`, em `pages/DirecionarPix.js`) continua no arquivo, mas nenhuma tela a chama. **Hoje a orientação do Cérebro não aparece em lugar nenhum.** O documento `FINANCEIRO-CONTAS-E-DIRECIONAR.md` ainda marca o Cérebro como "[FEITO v1]": vale ler junto com esta nota.

### 3.4 O que falta

| # | Falta | Depende de |
|---|---|---|
| 1 | Um lugar na tela para a orientação do dia (o Direcionar não é mais) | Decisão do dono |
| 2 | Saldo lançado todo dia. Sem isso a conta usa saldo velho | Rotina do financeiro (item 1 da tabela) |
| 3 | Entrada prevista por CNPJ (média do recebido real) | Separar o recebido por CNPJ; a DevMaster junta tudo num só |
| 4 | Colchão mínimo por conta | Valor por conta; o padrão geral não foi decidido |
| 5 | Contas a pagar limpas (sem previsão em dobro, sem data errada) | Arrumar na DevMaster |
| 6 | Contar o Pix direto a fornecedor como conta já paga | Baixa automática e cruzamento |
| 7 | Entregar a orientação no formato que a sócia do caixa escreve (por tipo de conta) | Confirmar o significado dos prefixos da DevMaster |
| 8 | Mensagem copiável de transferência entre contas do mesmo CNPJ | Chaves Pix cadastradas |
| 9 | Refazer sozinho todo dia e avisar mais pessoas | Itens 1 e 2 |
| 10 | Lista dos empréstimos e o custo deles na conta | Inventário de dívidas (item 5 da tabela) |
| 11 | Executar sozinho | Condições ainda não definidas pelo dono |

## 4. Hipóteses de por que a empresa está no vermelho

**Tudo nesta seção é HIPÓTESE.** Nenhuma foi provada. Cada uma nasce de uma frase do dono (a data está na coluna). A última coluna diz se o dado para confirmar já existe.

| # | Hipótese | Origem (frase do dono) | Dado que confirma ou nega | O dado já existe? |
|---|---|---|---|---|
| H1 | **Compra de bruto e banho sem plano.** Compra-se mais do que se vende e o dinheiro vira estoque | 30/10/2026: disse que compra de forma aleatória e que isso quase quebrou a empresa | Por mês: comprado (bruto + banho) contra custo das peças que saíram. Se o comprado fica acima do custo das saídas por vários meses, o caixa vira estoque | **Parcial.** Cadastro de peças › Pedidos (resumo por mês) e levantamento de 23/11/2026. Falta confirmar se o custo da DevMaster é confiável e se os pedidos estão em dia |
| H2 | **Custo do crédito bancário.** Rotativo, cheque especial, empréstimos e antecipação consomem o resultado | 16/10/2026: disse que usa muito cheque especial, tem rotativos, capital de giro e antecipação, em vários CNPJs. 24/10/2026: disse que a empresa nasceu e cresceu com crédito bancário e que não conseguiu crédito novo | Total de juros, tarifas, IOF e taxas de antecipação por mês, contra o resultado de caixa. Saldo devedor total | **Não.** Só o grupo "Financeiro" da Análise de custos, com principal e juros juntos. Sem inventário de contratos |
| H3 | **Prazo de 45 e 60 dias das revendedoras.** O dinheiro demora a voltar e as contas vencem todo mês | 24/10/2026: disse que passou muitas revendedoras para 45 e 60 dias e que os acertos delas só começam depois do dia 10 do mês seguinte | Ciclo real por kit (dias entre entrega e acerto), quantas revendedoras em cada prazo, valor adiado de um mês para o outro | **Parcial.** O servidor mede o ciclo dos kits (30, 45, 60) e os acertos previstos por mês. Não há valor adiado por mês |
| H4 | **Descompasso entre pagar e receber no mês.** Muita conta no começo do mês e pouco recebimento nesses dias | 24/10/2026: disse que há muitas contas no começo do mês e um "descompasso de fluxo de caixa". 18/11/2026: pediu para olhar as contas dia a dia | Curva diária: recebido real contra contas pagas, por CNPJ. Dias em que o saldo fica negativo | **Parcial.** Contas a pagar por dia existe. Recebido por dia existe. Recebido por CNPJ não. Saldo diário tem falhas |
| H5 | **Folha, horas extras e bônus altos** | 20/10/2026: disse que a folha geral e a hora extra estão altas demais e que precisa cortar | Folha total por mês, hora extra e bônus por pessoa, e o peso da folha sobre o valor de acerto | **Parcial.** Análise de custos traz a folha. Hora extra e bônus por pessoa só de poucas pessoas |
| H6 | **Retiradas da família pagas pela empresa** | 21/10/2026: disse que o Pix para ele e a família é retirada dos sócios | Soma mensal de tudo que sai para sócios e família (pró-labore, Pix de revendedora, contas da família pagas por conta usada pela empresa) contra o resultado de caixa | **Parcial.** Os dados estão no Financeiro familiar. Não há um total único e a definição de pró-labore está aberta |
| H7 | **Baixo aproveitamento do estoque consignado (11 a 12%).** Muito estoque parado para pouco giro | 20/10/2026, 10/11/2026 e 25/11/2026: disse que as revendedoras vendem 11 a 12% do kit | Giro mensal: saída a preço de venda dividida pelo estoque com as revendedoras. Meses de estoque. Giro por faixa de revendedora | **Parcial.** Financeiro › Relatórios › Estoque Sorelly calcula giro e meses de estoque. O estoque com as revendedoras é lido da DevMaster todo dia; o fechamento do mês é manual. Se está preenchido: NÃO VERIFICADO |
| H8 | **Inadimplência.** Parte do acerto não entra | 28/10/2026: pediu o resultado efetivo com a inadimplência recebida por mês | Por mês: "acerto - loja" novo, quanto foi recuperado, saldo em aberto por ano, perdas por furto de kit | **Parcial.** Contas a receber mostra o em aberto. O setor de Inadimplência tem as dívidas. Não há série mensal automática de novo × recuperado |
| H9 | **Preço e margem sem medida.** O preço é decidido sem relatório de margem | 28/09/2026 e 20/10/2026: disse que não há relatório e que não sabe quanto pôr de preço | Margem real por mês: valor de acerto menos custo das peças vendidas e dos brindes | **Parcial.** Custo das saídas e Estoque Sorelly. Não está no Resultado do mês |
| H10 | **O "vermelho" pode ser de caixa e não de lucro** (ou os dois). Estoque crescendo e parcela de dívida derrubam o saldo mesmo com margem positiva | Leitura deste levantamento, não frase do dono | DRE do mês ao lado do resultado de caixa do mesmo mês | **Não.** DRE não existe |

Como ler: as hipóteses não se excluem. H1, H3 e H7 falam do mesmo dinheiro preso em estoque. H2 é consequência de H1 a H8. Primeiro medir, depois decidir.

## 5. Plano de recuperação (passos pequenos, na ordem)

Regra do plano: usar o que já existe. Não mudar regra de negócio. Não inventar valor.

### 5.1 Medir primeiro (com as telas de hoje)

| Passo | O que fazer | Onde | Resultado esperado |
|---|---|---|---|
| 1 | **Saldo de todas as contas lançado todo dia**, com uma pessoa e uma hora fixas. Conferir se todos os limites estão no cadastro | Financeiro › Contas bancárias | Saldo real e disponível de cada CNPJ, todo dia. É a base de todo o resto |
| 2 | **Limpar o Contas a pagar**: tirar previsão em dobro, corrigir datas erradas, baixar o que já foi pago | Financeiro › Controle › Arrumar na DevMaster (a correção é feita na DevMaster) | "Falta pagar" do mês em que se pode confiar |
| 3 | **Fechar o caixa de um mês inteiro** (o último mês fechado): recebido − pago = variação do saldo, tirando o crédito bancário novo. Anotar a diferença | Financeiro › Relatórios › Resultado do mês | Tamanho real do resultado de caixa do mês e da divergência |
| 4 | **Inventário das dívidas bancárias**, uma linha por contrato: CNPJ, banco, tipo, saldo devedor, parcela, taxa, data final, garantia | Tela Empréstimos e RH › Contratos › Crédito bancário (os contratos precisam ser pedidos aos gerentes) | Dívida total e parcela mensal total. Confirma ou nega H2 |
| 5 | **Custo financeiro do mês**: somar juros, tarifas, IOF e antecipação dos últimos 3 meses | Financeiro › Relatórios › Análise de custos (grupo Financeiro) mais as tarifas de maquininha | Quanto o crédito custa por mês |
| 6 | **Comprado × custo das saídas**, mês a mês, e o já comprometido para os próximos meses | Cadastro de peças › Pedidos · Financeiro › Contas › A pagar (meses futuros) · levantamento de 23/11/2026 | Confirma ou nega H1 |
| 7 | **Folha**: total por mês, hora extra e bônus dos últimos 3 meses | Financeiro › Relatórios › Análise de custos · RH | Confirma ou nega H5 |
| 8 | **Saídas para sócios e família**: total por mês, uma vez só (sem dobrar) | Financeiro › Família › Home da família · Financeiro › Relatórios › Resumo do grupo | Confirma ou nega H6 |
| 9 | **Giro do estoque consignado e ciclo dos kits**, mês a mês | Financeiro › Relatórios › Estoque Sorelly · acertos previstos | Confirma ou nega H3 e H7 |
| 10 | **Inadimplência**: novo no mês, recuperado no mês, saldo em aberto | Financeiro › Receber › Contas a receber · setor Inadimplência | Confirma ou nega H8 |

Ordem dos três primeiros: sem o passo 1 o Cérebro e a prova real não funcionam. Sem o passo 2 o "a pagar" engana. O passo 3 dá o primeiro número de verdade.

### 5.2 Construir depois (dentro do que já existe)

| Ordem | O que construir | Onde encaixa | Por quê |
|---|---|---|---|
| A | Lugar para a orientação do dia do Cérebro | Decisão do dono (o Direcionar não é mais) | A conta existe e ninguém a vê |
| B | Baixa automática do que a DevMaster baixou e conferência no dia 1 | Contas a pagar (`casar-pagos.js` já faz parte) | Tira o ruído da saída |
| C | Aba Empréstimos no menu, com os contratos guardados no servidor | Financeiro › Contas | Hoje o dado do contrato fica só no navegador |
| D | Linha "custo financeiro do mês" | Resultado do mês e Análise de custos | Mede H2 todo mês |
| E | Recebido por CNPJ e entrada prevista por CNPJ | Cérebro, versão 2 | Fluxo de caixa por CNPJ de verdade |
| F | Colchão por conta e orientação no formato da sócia do caixa | Cérebro, versão 2 | Substitui a orientação escrita à mão |
| G | "Já comprometido por mês" em compras (parcelas futuras contra o teto) | Fornecedores › Negociações | Freia H1 antes de comprar |
| H | Um total de saídas para sócios e família | Família › Home ou Resumo do grupo | Mede H6 sem dobrar |
| I | Resultado do mês com custo das peças e margem (DRE simples por grupo de despesa) | Financeiro › Relatórios › Resultado do mês | Separa lucro de caixa (H10) |
| J | Capital de giro como indicador | Resultado do mês | Só depois de A a I |

### 5.3 O que este plano NÃO faz
- Não muda prazo de revendedora, preço, comissão, teto de fornecedor nem folha. Isso é decisão do dono, depois de medir.
- Não altera valor nem lançamento.
- Não cria outro sistema financeiro. Tudo entra nas telas que já existem.

## 6. De onde vem cada afirmação

| Assunto | Fonte |
|---|---|
| Menu do Financeiro | `src/apps/montagem/navigation/setores.js` (`MENU_FINANCEIRO`, `MENU_FISCAL`, `MENU_INAD`, `MENU_CADPECAS`, `MENU_RH`) |
| Rotas das telas | `src/router/rotas.js` |
| Cérebro | `domain/cerebro-financeiro.js`, `pages/DirecionarPix.js` (linhas do bloco retirado em 24/11/2026), `docs/negocio/cerebro-financeiro/` |
| Saldos e limite | `domain/saldos-contas.js`, `pages/Caixa.js`, `docs/negocio/CAIXA-FINANCEIRO.md` |
| Contas a pagar e a receber | `src/server/contas-dm.js`, `src/server/contas-receber.js`, `domain/casar-pagos.js` |
| Resultado do mês | `pages/ResultadoMes.js`, `docs/negocio/RESULTADO-DO-MES.md` |
| Custo das saídas e estoque | `src/server/custo-saida.js`, `src/server/estoque-dia.js`, `domain/estoque-sorelly.js` |
| Compras | `docs/negocio/COMPRAS-BRUTO-E-BANHO-23-11-2026.local.md`, `domain/pf.js`, `domain/pf-limite.js` |
| Folha e custos | `docs/negocio/RELATORIO-DE-CUSTOS.md`, `domain/contas-empresa.js`, `pages/FolhaFuncionarias.js` |
| Empréstimos | `pages/Emprestimos.js`, `pages/RHContratos.js` |
| Pendências, conflitos e perguntas | `docs/pendencias/recuperacao-financeira.local.md` |
