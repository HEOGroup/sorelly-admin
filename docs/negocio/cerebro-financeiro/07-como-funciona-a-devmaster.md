# Como a DevMaster guarda as contas a pagar (para o cérebro do financeiro)

Escrito em 24/11/2026 a pedido do Marcus: "preciso que tenha no cérebro do financeiro como funciona a DevMaster". Fonte: consulta de leitura à tabela de contas a pagar (`dmabe`) e aos movimentos bancários (`dmabf`). Sem nomes de pessoas e sem saldos (esta pasta é pública).

## 1. Título real e título PREVISÃO
Na DevMaster, cada conta a pagar é um **título** (prefixo + número + parcela). Existem dois tipos que parecem iguais:
- **Título real:** tem o valor certo e a descrição da compra ou do serviço.
- **Título "PREVISÃO":** um palpite que o financeiro lança para o mês não ficar vazio (cartão, diarista, juros, férias, combustível, diárias de viagem).

**Regra que evita erro:** a previsão é um **tampão**. Quando os títulos reais entram, a previsão precisa **diminuir** (ou sair). Se os dois ficam, a conta soma **duas vezes** o mesmo gasto.

## 2. Cartão de crédito (exemplo: Itaú Black, nov/2026)
- O PDF da fatura traz o total real (R$ 28.887,26, vence 25/11).
- Na DevMaster as compras viram **títulos avulsos** (R$ 24.852,24 lançados até agora) e o que ainda não foi aberto fica num título **PREVISÃO**.
- Em 24/11 a previsão foi ajustada de R$ 24.000,00 para R$ 4.035,02. A conta fecha: R$ 24.852,24 + R$ 4.035,02 = R$ 28.887,26.
- O título de dezembro continua em R$ 24.000,00 (previsão). A média das últimas 4 faturas é R$ 30.004,25, então ele está baixo.
- **Como conferir:** soma dos títulos avulsos do cartão no mês + previsão restante = fatura real. Se der mais, há duplicidade. Se der menos, falta lançar.

## 3. "CCI" quer dizer duas coisas
| Onde | Significado | Direção do dinheiro |
|---|---|---|
| **Prefixo CCI** (contas a pagar) | Título do cartão de crédito Itaú | Sai |
| **Numerário CCI** (forma de pagamento) | "Crédito - Itaú - Serenity", maquininha que recebe das revendedoras | Entra |
Nunca assumir pelo nome: olhar se é prefixo (conta a pagar) ou numerário (forma de recebimento).

## 4. Prestador pago por Pix de revendedora (exemplo: Lucas Castilho)
- A DevMaster guarda um título por data de pagamento, com a descrição "Pix (revendedora)", dia 10 e dia 23 (total mensal de referência R$ 4.500,00: R$ 2.000,00 no dia 10 e R$ 2.500,00 no dia 23).
- Os valores reais variam de centavos (ex.: R$ 1.925,40 e R$ 2.574,60 em outubro). Há **um título por data**.
- No Admin o mesmo pagamento já apareceu **duas vezes** (cópias em duas datas de pagamento). Regra: antes de apagar, comparar com os títulos da DevMaster; um título na DevMaster = um pagamento.
- O nome do prestador na DevMaster pode não bater com o do Admin. Procurar pelo código do fornecedor.
- **Provisionado (24/11/2026, pedido do Marcus: "todo mês até o final de 2027"):** no Pagamentos a fornecedores há um pedido por mês, dez/2026 a dez/2027, com R$ 2.000,00 no dia 10 e R$ 2.500,00 no dia 23 (Pendente). Script: `scripts/provisionar-lucas-castilho-2027.mjs`.
- **Data na DevMaster:** o financeiro dá baixa no dia 31, então os títulos de lá aparecem com data de fim de mês (ex.: 30/11), mas o Pix real sai nos dias 10 e 23. Comparar por mês, não por dia.

## 5. Diarista (regra do Marcus, 24/11/2026)
| Onde trabalha | Quantas vezes | Valor | Como paga |
|---|---|---|---|
| **Sorelly** | 1 vez por semana (quinta) | R$ 212,00 (diária + vale-transporte) | Dinheiro |
| **Casa** | 2 vezes por semana | R$ 312,00 por dia (R$ 300,00 + vale-transporte) | Conforme combinado (a confirmar) |
- Na DevMaster existe um título **PREVISÃO** mensal fixo para a diarista (R$ 1.896,00). Ele não tem relação direta com os dias reais e **repete** o mês quando os títulos reais já foram lançados.
- Em novembro os títulos reais da casa já somam R$ 1.224,00. Nenhum título da diária de R$ 212,00 (Sorelly) apareceu em novembro.
- **Regra:** previsão do mês = (quintas do mês × R$ 212,00) + (dias na casa × R$ 312,00) menos o que já foi lançado como real.
- **Feito no Admin (24/11/2026):** a Casa tem UMA conta "Diarista" só, paga **por dia** (R$ 312,00 por dia, 2 vezes por semana, em dinheiro). Previsão do mês = quintas × R$ 624,00 (R$ 2.496,00 em meses de 4 quintas e R$ 3.120,00 em meses de 5), de nov/2026 a dez/2027. As 3 contas antigas terminaram em out/2026. Script: `scripts/trocar-diarista-casa.mjs`.
- **Sorelly (R$ 212,00 na quinta, em dinheiro):** a previsão mora na DevMaster (DP 1113, hoje R$ 1.896,00 por mês). Quem muda é o financeiro: 4 quintas = R$ 848,00 e 5 quintas = R$ 1.060,00.

## 6. Lançamento em dobro (como acontece)
1. A funcionária lança o pagamento no Admin e outra pessoa (ou ela mesma) lança de novo pela outra tela.
2. A DevMaster tem a previsão e os títulos reais abertos ao mesmo tempo.
3. O Admin mostra o mesmo Pix em duas datas de pagamento.
Defesas: aviso de repetido na janela "+ Lançar pagamento"; comparar com a DevMaster; nunca somar previsão e real.

## 7. Perguntas ainda abertas (24/11/2026)
- Valor e dia exatos do Lucas Castilho nos meses futuros.
- Se a previsão da diarista deve ser trocada pela conta por dia (item 5).
- Quem dá baixa na DevMaster dos Pix que o Admin já marcou como pagos.
