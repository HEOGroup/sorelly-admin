# Regras de direcionamento dos Pix (para onde vai cada Pix que chega)

Documento vivo do Marcus. **Toda regra nova entra aqui no mesmo dia.** Na tela: Financeiro → Controle de pagamentos → botão "Regras do Pix" (editor em `pages/ChavesPix`, estado `s.px.regras`). Contexto geral: `FLUXO-DE-PAGAMENTOS.md`.

Objetivo: o sistema identifica sozinho para onde enviar o Pix do dia, sem depender do Lucas, comparando por CNPJ (a) quanto há de contas a pagar hoje, amanhã e até o fim do mês, (b) quanto há na conta (saldo e limite) e (c) os prazos dos prestadores de serviço.

## Regras decididas (20/10/2026)
1. **Link de pagamento:** se a venda foi paga no link de pagamento, o Pix vai para o **mesmo CNPJ** do link. Quem escolhe a conta vê só as contas desse CNPJ. (Já aplicado em "Pagamentos para conferir".)
2. **Pix acima de R$ 3.000:** preferência para **Pontual** e **Point** (são os prestadores/fornecedores de valor mais alto).
3. **Dias 21 a 30:** depois que a Pontual encerra (corte do dia 20), verificar se o pagamento dos primeiros 10 dias está quase quitado via cartão; só então decidir quanto de Pix ainda vai para ela. (Prévia a confirmar onde fica: ver "Perguntas".)
4. **Venda no cartão (Getnet) na empresa + Pix:** se o Pix for **acima de R$ 750**, vai para a **Pontual** (mesmo fornecedor da maquininha).
5. **Pix abaixo de R$ 750:** procurar **prestadores de serviço menores**, com **preferência para os prestadores da Sorelly**.
6. **A representante e o CNPJ dela não importam.** O que vale é **qual maquininha, de qual CNPJ, está com a representante**. O setor Link de pagamento também direciona sempre pela maquininha que cada representante tem.
7. **Urgência (mês 10, 11, 12 e janeiro):** tirar as contas do negativo. O 34 estava em −R$ 138 mil em 19/10 (Rotativo Sicredi com R$ 71 de folga), 46 em −R$ 7 mil (Safra e Unicred quase no limite). Pix vai primeiro para quem está mais perto do limite do cheque especial.

## Como o sistema decide (desenho, a confirmar)
Para cada CNPJ: contas a pagar de **hoje**, **amanhã** e **até o fim do mês** (vindas de Contas a pagar) contra o **saldo disponível** (saldo + limite não usado) das contas bancárias. Quem tem maior falta e menor folga recebe primeiro; prazos de prestadores de serviço entram na mesma comparação. As regras 1 a 6 filtram ou priorizam antes disso.

## Perguntas em aberto
- Regra 3: onde está a "prévia" dos primeiros 10 dias pagos no cartão? (O módulo Pagamentos a fornecedores tem janelas da Pontual com cortes 10/20/31 e a Maquininha Banho.)
- Regra 5: quais são os "prestadores menores"? Hoje temos como prestadores de serviço: Higor (segurança, dias 5 e 20), Camilly (mensal), Helcio (serviço pontual), mais quem recebe por fora (Amanda de Miranda, Priscila, Nickolas, Lucas, Lucas Castilho).
  - **Resposta do Marcus (20/10/2026):** Office Graf, MegaSul e Art Ello são **fornecedores da Sorelly**, não "prestadores menores". Office Graf = único fornecedor de material gráfico, movimenta bastante dinheiro. MegaSul = fornecedor de bruto (compramos semijoia no bruto): parte paga pelo CNPJ com nota, o restante era cheque (ainda há alguns rodando) e agora é Pix revendedora. Art Ello = fornecedor de bruto, empresa do Franciel: boletos dos CNPJs e o restante Pix revendedora. **Falta responder:** Linda, Tucano, Charme (bruto?) e Higor, Camilly, Helcio (são os "prestadores menores"?).
- "Quase quitado": a partir de quantos por cento?
- Itaú Black (pessoal), Dinheiro e Retidos entram no "quanto temos"?

## 23/10/2026 (Marcus)
8. **A representante NÃO envia Pix para ela mesma:** o Pix vai sempre de uma representante para outra.
9. **Pix de dentro da Sorelly (atendimento interno) nunca tem conta fixa:** sempre se define na hora. Tela: Financeiro → Contas → Pagamentos → Direcionar.
10. O Lucas confirma SEMPRE cada direcionamento; o sistema só sugere, com o motivo.

## 24/10/2026 (Marcus) · Conta fixa por representante, valor fora do normal e aviso (a confirmar os números)
11. **Conta fixa por representante = a maquininha ou o link que ela tem.** Quando aparece um pagamento dela (ex.: Pix de R$ 3.000), o sistema já sugere essa conta. O Lucas só confirma ou troca, caso a caso.
12. **Pagamento que entrou numa maquininha ou link fica nessa maquininha/CNPJ.** Ex.: pagou R$ 1.000 no link do 59 e faltam R$ 200: os R$ 200 seguem na maquininha do 59.
13. **Valor fora do normal sobe para o Lucas definir a conta, venha o que vier no cadastro.** Ex.: qualquer representante com Pix de R$ 7.000. Não dá para prever.
14. **Valor alto passa na frente da fila,** mas a fila continua: todos os pedidos precisam ser direcionados.
15. **O Lucas muda de dia para dia.** Até ele pegar o jeito, a tela fica simples e sempre mostra a sugestão.
16. **Nada de mensagem no app da representante.** A ordem do Lucas fica só no sistema.
17. **Aviso no admin, como uma nova venda (estilo Kiwify):** quando um Pix entra na fila, aparece uma notificação ao lado, para o Lucas.
- **A definir:** a partir de quanto um Pix é "fora do normal" (hoje a regra 2 usa R$ 3.000; o Marcus citou R$ 7.000) e quem recebe o aviso.
- **Feito em 24/10/2026:** aba "Contas das representantes" em Direcionar Pix (`pages/DirecionarPix.js`, estado `s.dp.contasRep` e `s.dp.limiteAlto`, ações `DP fixa` e `DP limite`). Conta fixa marcada vira a 1ª sugestão (regra 11); sem marca, vale o CNPJ da maquininha ou do link vindo de Link de pagamento (regra 12); valor a partir de `limiteAlto` (padrão R$ 7.000, a confirmar) ignora a conta fixa e passa na frente da fila (regras 13 e 14). Aviso de Pix novo ainda NÃO foi feito.

## 24/10/2026 (Marcus) · Pontual e a faixa de fornecedores
11. **Faixa "Fornecedores em aberto" do Direcionar Pix:** mostra só o que FALTA para fechar o mês atual (A PAGAR menos PAGO, como no RESUMO MÊS da planilha) e a data limite de cada fornecedor.
12. **Pontual, Pix:** o Pix do dia liquida a parcela em aberto mais antiga do mês. Se o dia 1 a 10 está aberto, é nele que o Pix entra; depois 11 a 20; depois 21 a 30.
13. **Pontual, cartão:** o que passa no cartão sempre mata o dia 1 a 10 do MÊS SEGUINTE, com cerca de 10% de desconto (o Valdir dá o desconto no começo do mês). O sistema deve estimar o desconto pelos meses anteriores.
14. Planilha com erros de soma: ver `AUDITORIA-PLANILHA-FORNECEDORES.local.md`. O Marcus vai mandar a planilha atualizada; o sistema lê dela o saldo de cada fornecedor.

## 02/11/2026 (Marcus) · Regras de exemplo, "perguntar à empresa" e orientação do caixa
18. **Regra que PERGUNTA à empresa** (`acao:"perguntar"` em `px.regras`): vale ANTES do link, da conta fixa e das regras de conta. Exemplo do Marcus: **se teve link, mas o Pix passa de R$ 1.500, sempre pergunta à empresa, não importa o resto.** Condição nova `comLink` (a venda teve link ou cartão).
19. **Regras de exemplo** (entram uma vez; botão "Trazer as regras de exemplo" em Chaves Pix e regras): (a) link + Pix acima de R$ 1.500 = perguntar; (b) Pix acima de R$ 3.000 = perguntar; (c) dinheiro ≥ 70% do pago e total ≥ R$ 3.000 = perguntar (ex.: R$ 3.000 em dinheiro e R$ 1.000 em Pix); (d) dinheiro ≥ 70% e Pix abaixo de R$ 300 = Itaú PJ (ex.: R$ 500 em dinheiro e R$ 100 em Pix; conta "PIX - ITAÚ PJ - MARCO", a confirmar se é o "Itaú Black PJ"). Os valores de corte são suposição para testar.
20. **Testar uma situação** e **Orientação do caixa** (`pages/SimuladorPix.js`, `domain/orientacao-pix.js`): o Financeiro escolhe um caso e vê para onde o sistema mandaria o Pix e por quê (e as regras olhadas, na ordem). Quando nenhuma regra decide, o caixa sugere o CNPJ do link ou o CNPJ que mais precisa de Pix. A orientação junta saldo, limite, contas negativas e a folha dos próximos 10 dias; ordena pela **folga depois da folha** (saldo + limite − folha): quem não cobre a folha vem primeiro.
- **Ainda não feito:** escolher a conta mais negativa DENTRO do fluxo real (hoje só o simulador sugere); o aviso "Aguardando o setor" no app da representante (muda a regra 16).

## 02/11/2026 (Marcus) · Tela "Regras e contas" em Pagamentos (aplicada)
21. **Onde fica:** Financeiro → Pagamentos → **Regras e contas** (substitui "Contas das representantes" e "Regras do Pix"; o endereço antigo continua abrindo). A fila **Direcionar** continua separada: lá chegam os pedidos das representantes e o que as regras mandam perguntar à empresa. A tela é para o Lucas deixar tudo definido ANTES (à noite, no fim de semana).
22. **Aba Regras:** editar as regras do Pix (`s.px.regras`: ordem, liga/desliga, criar, excluir; ação "perguntar à empresa" ou "mandar para uma conta") e **Testar uma situação**. Código: `pages/RegrasContasRep.js`.
23. **Aba Contas das representantes:** planilha com a conta fixa de cada representante, **vale até** e **limite de valor** (`s.dp.contasRepExtra`), "Sugerir pelo caixa", "Limpar" e o valor fora do normal. Em cima, o caixa de hoje (quem precisa de Pix primeiro). Conta fixa vencida ou acima do limite deixa de valer e a sugestão cai no automático.
24. **As regras do Pix agora valem na fila do Direcionar** (`sugerir`, `ctx.regrasPx`): regra "perguntar" para a sugestão e mostra o motivo; regra com conta vira a 1ª opção quando existe destino com o mesmo nome.
- **Ainda não feito:** aviso "Aguardando o setor / brindes liberados" no app da representante (muda a regra 16); escolher a conta mais negativa dentro do fluxo real.

## 03/11/2026 (Marcus) · A conta da representante é fixa ou pergunta à empresa
25. **A representante NÃO escolhe entre várias contas.** A conta do Pix dela é sempre a **fixa** (aba Contas das representantes) ou a **empresa define** (pergunta). No app ela só informa a forma e o valor; o pedido de conta segue em segundo plano e os brindes já liberam. (Isto desfaz o menu de contas que entrou no app em 02/11/2026.)
26. **Regra aplicada com as maquininhas e links que já existem** (`dpAplicarMaquininhas`, botão "Aplicar as maquininhas e links" e aplicação automática uma vez): quem já tem maquininha ou link vira conta fixa do CNPJ dela; quem não tem fica "Perguntar à empresa". Marca "Fixa · falta conferir" até o Lucas conferir (botão Conferir). Em 03/11/2026: 22 de 25 representantes com conta fixa, 3 sem maquininha.
27. O "Testar uma situação" saiu da tela Regras e contas (pedido do Marcus).

## 09/11/2026 — Pix da representante: o app PEDE a conta (alinhamento para o Leonardo)
- Erro no app real (Leonardo): a representante escolhe a conta numa lista. **Errado.** O app só informa forma, valor, parcelas e comprovante, e PEDE a conta. O pedido vai ao Direcionar (Financeiro). As regras do Lucas respondem sozinhas; o que elas não resolvem fica na fila. O app não espera: mostra "Aguardando conta" e avisa quando a conta chega.
- O Lucas define as contas **por REPRESENTANTE**, antes (Regras e contas). À noite ele divide as contas à mão entre as representantes.
- **Uma venda, um CNPJ (regra principal).** Dividir a venda (2 CNPJs, ou CNPJ + conta de fora, ex.: Link 59 + Pix Point, Pix Itaú Black + Link 59) é permitido (grupo econômico, aprovado pela contabilidade), mas dá trabalho e abre espaço para erro: a **Bruna (faturamento)** separa e faz 2 vendas na DevMaster. Evitar.
- O Pix segue o CNPJ da maquininha/link da representante. **Pix acima de R$ 1.500 = vale verificar** se compensa mandar para outro CNPJ ou conta de fora; quem responde: **Lucas, Marcus ou Anamaria**, pelo app (sem ligação).
- **Dinheiro fatura junto** no CNPJ da venda.
- **Mais de 80% da venda em dinheiro:** o Pix vai para uma conta que NÃO é da empresa.
- Venda só com Pix (sem link nem cartão): nada a dividir; vai para a conta que mais precisa.
- O sistema tem que pesar: saldo de cada conta, contas a pagar de cada CNPJ, quanto falta em cada conta, contas negativas (mais antigas e maiores) e fornecedores, contra o trabalho de dividir a venda.
- Teste do Marcus (5 vendas inventadas): Link 59 + Pix 800 → Pix 59; Link 34 + Pix 5.000 → Pix 34 (34 era a que mais precisava); só Pix 1.200 (maquininha 46) → 34; Débito 67 + Pix 2.400 → 67 ou fornecedor (67 não precisava). Crédito sempre mostra a conta (maquininha).
- No código hoje: o limite de "valor alto" do Direcionar está em R$ 7.000 (`limiteAlto` em `domain/direcionar-pix.js`); passa a ser R$ 1.500 quando formos fazer. Falta: idade/valor da conta negativa, turno dia × noite, peso da divisão da venda.
- **Prioridade do Pix (Marcus, 09/11/2026, 20h):** conta negativa: pesa mais o VALOR negativo (não o tempo). Contas a pagar: hoje é o mais urgente, depois amanhã e assim por diante, mas olhando os dias com mais contas. O sistema precisa de um **fluxo de caixa por CNPJ**: saldo de hoje + o que deve entrar (comparando com o mês passado) − contas a pagar de cada dia = quanto mandar para cada conta.
- Análise de 09/11/2026: nenhum saldo de conta lançado em novembro (o último é 28/10, do admin antigo). Sem o saldo do dia, o fluxo por conta não fecha.
