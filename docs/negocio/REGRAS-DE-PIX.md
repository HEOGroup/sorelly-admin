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
