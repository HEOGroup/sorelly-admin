# Fluxo de pagamentos da Sorelly (contexto da integração)

> Escrito em 16/10/2026 a partir da conversa com o Marcus. **Ler antes de mexer** em Financeiro → Controle de pagamentos, no Pagamentos a Fornecedores, no Financeiro Familiar, em Comissões dos representantes ou em Pix representantes. Atualizar ao decidir algo novo. Não guardar aqui chave Pix, CPF nem valores pessoais (o repositório é público).

## A ideia central: "empresa dentro de empresa" (cascata)
A Sorelly tem 4 CNPJs (34, 46, 59, 67). Ela paga fornecedores, funcionários e prestadores de três jeitos: boleto/cheque/Pix da empresa/cartão (**com nota**) e **Pix direto da revendedora** (**sem nota**).
- Muitos fornecedores **exigem** receber parte do pagamento por Pix direto da revendedora. A revendedora paga o acerto dela na conta que o financeiro indicar; esse dinheiro nunca passa pela conta da Sorelly. Para a Sorelly é o mesmo que ela ter recebido da revendedora e pago o fornecedor.
- O mesmo vale para pessoas: o **Higor** (segurança particular do Marcus) recebe R$ 3.000 de salário por um CNPJ + R$ 2.000 por Pix de revendedora = R$ 5.000. Os R$ 2.000 contam como **despesa da Sorelly** (segurança) e, ao mesmo tempo, como **recebimento do Marcus** no Financeiro Familiar, que repassa ao Higor. É a cascata: a família funciona como uma empresa dentro da empresa.
- A conta (destino) de cada Pix vem do Financeiro: a revendedora/representante **pede** a conta (atendimento interno e app) e o Financeiro **orienta**.

## Quem faz o quê hoje (manual)
- **Nayale (financeiro)** controla o que precisa ser pago e manda a ordem do dia ao **Lucas**: "direcionar os Pix para tal conta", "faltam tantos para a representante X", "fechar as representantes". O dinheiro se divide entre as contas dos CNPJs conforme essas ordens.
- **Lucas** confere cada acerto e vai direcionando o Pix (e escolhendo o destino do Pix de cada revendedora). Quando o valor é alto, ele manda para a Anamaria ver.
- O **contas a pagar completo** (boletos, salários, cheques por CNPJ) **ainda fica na DevMaster**. Vem para cá depois. Por isso o sistema novo **orienta**, não decide sozinho, e há variáveis que ainda não conhecemos.

## Tipos de destino de um Pix
1. **Conta da empresa** (banco de um dos CNPJs).
2. **Família / sócio** (Marcus PF: consórcio, financiamento, contas pessoais).
3. **Fornecedor** (Pontual, Point, Office Graf, Ellos Galvânica, Mega Sul, Art Ello Bruto, Devmaster, Linda, Tucano, Charme...).
4. **Representante** (comissão paga por Pix direto; fechamento com total, pago e falta).
5. **Prestador / funcionário** (Higor, Camilly...).

## Como cada fornecedor é pago (varia por fornecedor)
- **Ciclo com corte:** a Pontual junta os valores e se paga a cada 10 dias (cortes 10, 20 e 31); outros a cada 15 dias ou por mês.
- **Valor combinado de boca por mês** (a Point: de R$ 30 a 50 mil em Pix, por exemplo). Cada fornecedor tem a sua situação.
- Um pedido grande se divide em parte **com nota** (boletos em 30/60/90/120 dias) e parte **sem nota** (Pix de revendedora em parcelas quinzenais). Pode ser renegociado e diluído em outros meses.
- A **Pontual tem maquininha**: passamos o cartão das revendedoras na maquininha dela e o controle sai das vendas (Cielo, Getnet e links de pagamento), com desconto em parcelas.
- O arquivo-base é o HTML "Pagamentos a Fornecedores" (fornecedores, pedidos e parcelas, janelas de acerto, lançamentos de Pix com conferência e estorno, extrato para mandar por link/WhatsApp, maquininhas, alertas de mês/janela acima da média). **Não está dentro do sistema ainda**; entra como módulo do Financeiro (próxima etapa).
- Cada fornecedor se expande: Ellos/Ello = banho, Point, Linda = peças. Peças vão para o **Cadastro de peças**, com controle de quantidade de pedidos e de peças.

## O que o sistema novo faz (decisões)
1. **Primeira aba do Financeiro: "Controle de pagamentos".** A **Visão geral não define mais contas**: a definição de conta dos pagamentos do atendimento interno saiu de lá e mora nessa aba.
2. O Financeiro cria **orientações**: "direcionar R$ X para o destino Y até tal data". O sistema acompanha quanto já foi direcionado e quanto **falta**.
3. Quando chega um Pix, o sistema **sugere** o destino (mais atrasado e com mais valor em aberto); **o Lucas confirma ou troca**. Pode dividir um Pix entre destinos.
4. A representante pode ter **conta fixa** (ou mais de uma) para pagamentos; as regras ainda serão definidas.
5. **Todos os pagamentos da empresa precisam ser integrados ao Financeiro** (fornecedor, funcionário, prestador). Pix de revendedora para uma pessoa também aparece no Financeiro Familiar como recebimento do sócio.
6. Datas de pagamento têm configurador geral (Financeiro → Comissões → Datas de pagamento).

## Pendências e perguntas em aberto
- Quanto do contas a pagar da DevMaster (boletos, salários, cheques por CNPJ) entra e quando.
- Regras da conta fixa por representante (quando usar, quantas contas).
- Integração Pix de revendedora ↔ Financeiro Familiar (o registro do Higor: onde nasce, quem lança).
- Maquininhas: ligar às vendas das revendedoras e à Pontual.
- Importar o HTML de fornecedores (pedidos, parcelas, janelas, extratos).
- Trazer as contas por CNPJ (boleto, Pix, cheque, salário).

## Onde está no código (base criada em 16/10/2026)
- `domain/controle-pagamentos.js` e `pages/ControlePagamentos.js`, estado `s.cp` (destinos, orientações, lançamentos). Aba `cpagamentos`, rota `/montagem/controle-de-pagamentos`.
- A definição de contas dos pagamentos do atendimento interno usa o componente `components/pagamentos-conferir.js` (também aparece no cartão do pedido no SorellyChat).
