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

## Regras do Pix (20/10/2026)
As regras de para onde vai cada Pix ficam em `REGRAS-DE-PIX.md` (documento vivo, atualizar a cada regra nova) e no botão "Regras do Pix" do Controle de pagamentos.

## Geral dos fornecedores e importação da planilha (20/10/2026)
- A tela **Geral** (Financeiro → Pagamentos a fornecedores) é o "RESUMO MÊS" da planilha "Pag Fornecedores Nova 2026.xlsx", ao vivo. A pagar vem das Negociações (pedidos e parcelas), o pago vem dos Pix de revendedora e dos descontos do cartão (maquininha). Status sai sozinho.
- Sócios NÃO entram na Geral: o Pix de revendedora deles é lançado no Financeiro familiar.
- Importação por fornecedor, conferindo mês a mês com o RESUMO MÊS: **Pontual feita** (Pix de set e out, passadas de cartão de out, fechamento do cartão de set). Falta: Office Graf, Point, Devmaster, Ellos, Art Ello, MegaSul, Linda/Tucano/Charme e os prestadores (Higor, Lucas Castilho, Izadora, Priscila...) com os pagamentos de outubro. Arquivo local `domain/pf-atualizacao.local.js` (gitignored), aplicado em `pfMigrar` sem duplicar.
- Próxima etapa: encaixar as compras (ex.: R$ 100 mil = R$ 30 mil com nota + R$ 70 mil em Pix de revendedora) ligadas a cada fornecedor.

## Pontual: como funciona a negociação (texto do Marcus, 20/10/2026)
- Pontual = principal empresa de banho (ouro e prata). Maior volume de pagamentos. Fatura por 2 CNPJs: **Pontual Prestação de Serviços 32.206.541/0001-67** (principal, quase todos os boletos) e **CHP Indústria e Comércio de Semijoias 01.885.264/0001-32**. Quem paga (pagador) muda por pedido: Serenity 59.146.403/0001-96, Mayz (antiga Sorelly Comércio) 46.873.285/0001-76, Axis 67.702.461/0001-87, Sorelly Atacadista 34.753.252/0001-03.
- **Divisão do pedido:** parte COM nota = BOLETO; parte SEM nota = PIX. % varia por pedido (comuns 20/80, 25/75, 30/70). Ex.: R$ 10.000 em 30/70 = boleto R$ 3.000 + Pix R$ 7.000.
- **Boleto:** padrão 6 parcelas a 30/60/90/120/150/180 dias; 1º vence 30 dias após o pedido (às vezes 45, 60 ou 90); seguintes no mesmo dia dos meses seguintes; parcelas iguais (só a última varia centavos); vêm em PDF (Sicredi) numerados com a NF (ex.: 11660/1, 11660/2). Sempre conferir boleto real x combinado; diferença de centavos se ajusta no Pix para fechar o total da NF. **Acordo especial (set/2026, com o Valdir):** 1ª parcela em 60 dias e 5 parcelas; de outubro volta ao padrão (30 dias / 6 parcelas).
- **Pix:** faixas de 10 em 10 dias, vence DENTRO do próprio período (pedido de 01 a 10 → Pix até dia 10; 11 a 20 → dia 20; 21 a 30/31 → dia 30/31 do mesmo mês). Nos pedidos mais recentes o Pix também é parcelado nos mesmos meses do boleto (ex.: 6x de Pix junto com os 6 boletos).
- **Passo a passo de pedido novo:** 1) Pontual envia NF/fatura; 2) define % boleto e Pix; 3) confere boletos reais (valores e datas); 4) calcula o Pix (valor e meses); 5) verifica impacto no TETO MENSAL de fornecedores; 6) lança tudo no controle.

## Cor fixa de cada fornecedor (pedido do Nickolas, 20/10/2026)
Identificar os fornecedores com etiquetas coloridas: o nome do fornecedor em branco sobre o fundo da cor. Sempre que o fornecedor aparecer no sistema mantém a MESMA cor, com o nome visível, para facilitar a conferência:
- Pontual = azul · Mega Sul = verde · Point = laranja · Art Ello = roxo · Ellos Galv. = vermelho · Xangai = verde-água (turquesa).
- Ao selecionar um fornecedor, ele fica no ALTO da tela (etiqueta grande) e as barras principais usam a cor dele.
- No código: `corForn` e `Etiqueta` em `pages/pf/ui.js` (lista `FORN_CORES`). Fornecedor sem cor definida aparece com contorno simples; para um novo fornecedor ter cor, acrescentar uma linha em `FORN_CORES`.

## Limite mensal de fornecedores (regra do Marcus, 21/10/2026; IMPLEMENTADO em 21/10/2026: domain/pf-limite.js e pages/pf/Limite.js)
- Teto mensal R$ 300.000 para TODOS os fornecedores somados (PIX + Boleto + Cheque/Debito). Nao e por fornecedor.
- Mes de cada pagamento: Boleto/Cheque/Debito = mes do VENCIMENTO; PIX = mes em que foi NEGOCIADO (mes de referencia).
- Semaforo (% do teto): verde ate 80% · amarelo 80-90% (atencao) · laranja 90-100% (so com aprovacao) · vermelho acima de 100% (nao fecha nada novo no mes).
- Fora do teto (controlados a parte): Socios, Casa e Midia (Facebook e Google).
- Limite por tipo (dentro dos 300 mil): Banho (Pontual, Ellos...) R$ 150.000 · Bruto (Point, Mega Sul, Art Ello, Xangai...) R$ 100.000 · Servicos e produtos (grafica, acrilicos, tintas, sistema, prestadores, eventos...) R$ 50.000. Categoria que estoura nao pega a sobra da outra sem aprovacao.
- Evitar boleto e cheque nos dias de contas fixas: 1, 5, 10, 11, 13, 20, 21, 23, 25 e 5o dia util. Dia 20 e o pior. Espalhar vencimentos.
- Fechar negociacao nova: ver folga do mes e da categoria; se nao couber, jogar PIX/parcelas para meses com folga; so fica LANCADO depois de aprovado (ate la, PENDENTE); nada e PAGO sem confirmacao.
