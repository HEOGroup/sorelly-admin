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
