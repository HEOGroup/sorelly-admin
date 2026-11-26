# Regras: fornecedores, compras, banho, negociações e pagamentos (vigentes em 25/11/2026)

Documento ÚNICO e vivo, escrito a partir de TUDO que o Marcus disse nas conversas de 28/09 a 25/11/2026 e do código.
Só a regra de HOJE. Sem valores reais de pedido, sem chave Pix, sem CNPJ completo (isso fica nas fichas `docs/fornecedores/<nome>.local.md`, fora do Git).
Marcação: **[FEITO]** já no sistema · **[A CONSTRUIR]** decidido, falta construir · **[A CONFIRMAR]** o Marcus não decidiu.
Fontes complementares: `docs/negocio/FLUXO-DE-COMPRA-DE-BRUTO.md`, `docs/negocio/REGRAS-DE-PIX.md`, `docs/negocio/FLUXO-DE-PAGAMENTOS.md`, `docs/negocio/lancamento-universal/`, `docs/DECISOES.md`.

## 1. Quem é quem

| Tipo | Fornecedores | Observação |
|---|---|---|
| **Banho** (galvanoplastia) | **Pontual**, **Ellos Galvânica** | Só existem esses dois. Antes só havia a Pontual (por isso o "Pix banho"). A Ellos é do mesmo grupo da Art Ello, mas é OUTRA empresa |
| **Bruto** (semijoia sem banho) | **Point**, **Mega Sul**, **Xangai**, **Art Ello**, **Linda** (Lin), **Tucano**, **Charme**, Joias & Cia, Ramos Laser | Tucano e Charme: pouca compra hoje. Sem pagamento em 90 dias = desativar (botão ativar/desativar no cadastro) |
| **Material gráfico** | **Office Graf** (único), Ello Print (tintas) | Office Graf movimenta bastante dinheiro |
| **Sistema** | DevMaster | Prestador/sistema, não é bruto |
| **Prestador de serviço** | Higor, Lucas Castilho, Madeira Cor, Priscila, Dávila, Leci, Confraternização (Madalosso), Helcio... | Quem também é funcionário fica SÓ em Funcionários (não duplicar, ex.: Higor). Quem é da família fica na Família |

- **Nomes padronizados em todo o sistema:** Linda, Tucano, Charme, Mega Sul, Art Ello, Ellos Galvânica, Pontual, Point. Em caso de saldo: "Mega Sul (Saldo) - Adereço".
- **Adereço** é fornecedor de bruto e parceiro da Pontual. Nota de fornecedor às vezes sai em nome de outra empresa (operação triangular: ver 6).
- **Ordem de exibição:** Banho primeiro (Pontual, depois Ellos), depois Bruto (Point primeiro, depois Point com NF, Mega Sul...), depois os outros. Menu do topo: CNPJs · Fornecedores · Sócios · Prestadores de serviço · Representantes · Funcionários.
- **Coluna "tipo"** na esquerda das tabelas: Bruto, Banho, Prestador de serviço.
- **CNPJs do grupo** (nome curto): **Sorelly (34), Mayz (46), Serenity (59), Axis (67, do Lucas)**. Em toda tela, mostrar o primeiro nome, não só o número. H&O (empresa de aplicativos) aparece junto.

## 2. Fluxo da compra até a peça pronta [FEITO na maior parte]

```
Marketing ─► Leads ─► Cadastro de revendedoras ─► ... (fluxo da empresa em docs/SETORES-DO-MENU.md)

COMPRA
1 Escolha das peças        Marcus escolhe por foto/catálogo (WhatsApp). 20 a 200 peças por modelo; 400 nas que vendem bem; 5 a 10 nas de luxo
2 Em separação             Fornecedor separa o pedido
3 Fechado, aguardando envio Romaneio gerado (pedido NÃO anda sem o romaneio anexado)
4 Em trânsito              (antes "Enviado"). Campo de código de rastreio
5 Chegou no banho          Banho = Pontual ou Ellos. Quem manda o bruto ao banho: Point e Mega Sul vão à Pontual; Art Ello, Xangai e Linda vão à Ellos
6 Enviaram fotos           A galvânica separa e manda foto com a quantidade por modelo
7 Marcus confirmou preços  Marcus escolhe o banho (ouro 1/3/flash, prata, verniz...)
8 Banho                    Em produção na galvânica
9 Enviado para Sorelly
10 Chegou na empresa       Rayssa anexa a fatura do banho e o valor
11 Cadastrando             Peso, ziplock, cadastro, preço, tag, código, etiqueta (Rayssa)
12 Finalizado              Vai para produção (Sorelly ou Serenity)
```

- **Parcial:** o pedido pode chegar parcial. Status "Parcial": a Rayssa marca a QUANTIDADE que chegou; o saldo vem depois.
- **Quem lança:** Rayssa lança pedidos de bruto e valores do banho (com as fotos das faturas). Nickolas lança os pedidos de banho e as negociações. Marcus acompanha.
- **Romaneio x fatura:** são diferentes. O romaneio vem logo depois do pedido; a fatura pode vir dias depois. O pedido de bruto muda sozinho quando a fatura é lançada.
- **Valor do pedido** = bruto + banho. Banho de fatura única para vários pedidos: dividir em PARTES IGUAIS entre os pedidos (decidido 16/11).
- **Mês de referência:** bruto conta no mês da COMPRA; banho conta no mês da FATURA.
- **Brincos:** ouro flash + verniz. Pulseira, colar e tornozeleira: ouro 3. Anel: ouro 4. Correntes: ouro 3. Prata é só "prata" (sem nível). Ouro "556-1" = ouro de 1 milésimo. Peça com rivieira não leva verniz. Fecho é banhado. Sem milésimo igual não compara.
- **Cotação do banho de ouro:** a Ellos é mais barata do milésimo 2 em diante; a Pontual só no milésimo 1. Tabelas de preço reais ficam em arquivo `.local`.
- **Quantidade de revendedoras** guia o estoque: usar o nº de revendedoras e a proporção de estoque necessário nas análises de compra (hoje ~2.080 revendedoras, ~2.120 no mês seguinte).

## 3. Prazos dos fornecedores [FEITO: `domain/prazos-forn.js`]
- Tela: Cadastro de peças › Pedidos, bloco "Prazos dos fornecedores": uma aba por fornecedor, uma linha por etapa, prazo em dias editável, pedidos e atrasados, mensagem de cobrança para copiar.
- Atrasado = dias na etapa maior que o prazo da linha.
- **Pontual (respostas da Letícia, 03/11 e 19/11):** os 12 dias contam da CHEGADA na Pontual, em DIAS ÚTEIS. Fotos: 2 a 3 dias úteis. Depois de escolhido o banho: 1 dia para começar. Produção: 7 dias. Total 10 a 12 dias úteis. Verniz novo: +2 dias. Conserto: em média 20 dias úteis (o último levou 50).
- **Marcus:** 1 dia para ele enviar as fotos após o aviso. Conta o prazo depois que ele seleciona as fotos.
- **[A CONFIRMAR]** prazos da Ellos (o Franciel não respondeu direito; perguntar UMA coisa por vez) e dos fornecedores de bruto.
- Mensagem de cobrança: formato curto, listando romaneio, fornecedor, dias no banho x prazo; pedir a data de entrega.

## 4. Limite mensal de fornecedores [FEITO: `domain/pf-limite.js`]
- **Teto geral: R$ 300.000/mês** para todos os fornecedores somados (PIX + boleto + cheque/débito).
- **Por categoria (dentro do teto):** Banho até R$ 150.000 · Bruto até R$ 100.000 · Serviços e produtos até R$ 50.000. Uma categoria não usa a sobra de outra sem aprovação.
- **Em que mês entra:** boleto/cheque/débito = mês do VENCIMENTO. Pix = mês da NEGOCIAÇÃO (referência).
- **Semáforo:** até 80% tranquilo · 80 a 90% atenção · 90 a 100% só com aprovação · acima de 100% não fecha nada novo.
- **Fora do teto:** Sócios, Casa e Mídia (Facebook e Google).
- **Dias a evitar para boleto e cheque:** 1, 5, 10, 11, 13, 20, 21, 23, 25 e o 5º dia útil (o dia 20 é o pior). Espalhar os vencimentos.
- **Regra para fechar negociação nova:** ver a folga do mês e da categoria; se não couber, jogar Pix ou parcelas para meses com folga; só fica LANÇADO depois de aprovado (até lá é pendente); nada é "pago" sem confirmação.
- **Prestador de serviço NÃO passa por aprovação de limite.**
- Quem aprova pedido acima do limite: autorização `pf_limite_aprova`.
- **[A CONSTRUIR]** calendário e tela "limite e calendário" no padrão azul compacto (o Nickolas pode arrumar).

## 5. Negociações com fornecedores [FEITO em parte]
- **Pedido** = um só. Ele se divide entre **boleto (com nota)** e **Pix (sem nota)**, ou boleto e cheque. Cada negociação mostra: CNPJ nosso pagador, valor total, % com nota, % sem nota, parcelas, datas, valores, forma.
- **Padrão da Pontual:** 6 parcelas mensais (boleto + Pix), mesmo dia do mês. A parcela cai em sábado/domingo: compensa no próximo dia útil (marcar). Percentual de nota varia por pedido (25%, 30%, 35%, 45%).
- **Propostas ao lançar pedido** (Pontual): uma linha para boleto e outra para Pix, e 5 propostas (não é regra, é sugestão): 6x padrão; 4x mais curta; 8x; e variações com primeiro pagamento em 45 ou 60 dias (ex.: 4/6/8x com 1º pagamento em 45 ou 60 dias; 5x em 45 dias; 4x em 60 dias).
- **Enviar proposta:** o Nickolas manda a proposta ao fornecedor (mensagem gerada: CNPJ, valor, % nota, parcelas) e o pedido já é lançado. O número do pedido liga ao pedido da Rayssa. A nota fiscal é anexada DEPOIS de lançar (o lançamento inicial é uma proposta).
- **Operação triangular (Pontual):** colunas separadas para NF, Fatura, Fornecedor e Nota do fornecedor. Nota do fornecedor vem de lista suspensa do cadastro, não digitada.
- **Janela "Lançar pedido":** só dentro do fornecedor (nunca no topo). Tudo em `TabelaPlanilha`. Campos de 20 px, valor sobe ao digitar, data com calendário. **[A CONSTRUIR]** versão UNIVERSAL para todos os fornecedores (regra padrão por fornecedor em `REGRA_FORN`; sem histórico = 100% sem nota, 1 Pix em 30 dias).
- **Telas de negociação:** Resumo por fornecedor (uma linha cada) → clicar abre Pedidos do fornecedor → clicar no pedido abre Parcelas (filtro de mês, vencimento, forma, valor, Dar baixa). O fornecedor clicado fica aberto e os outros fecham; só a linha dele (3x maior, sem total). Mostrar o CNPJ nosso nas colunas. Negociação encerrada há mais de 30 dias sem nova negociação sai da lista.
- **Point:** valor combinado por MÊS (30 a 50 mil), descontado dos Pix. Fornecedor com nota emitida por outro nome: ligar boleto da Point pelo número da nota (C Group, Adereço).
- **Mega Sul:** um fornecedor só, pago de vários CNPJs. Compra com nota pelo CNPJ e o resto por Pix de revendedora. Cheques antigos ainda rodam (CNPJ 34); o que vale é o mais recente, sem duplicar na conciliação.
- **Art Ello:** empresa do Franciel. Boletos dos CNPJs e o resto Pix de revendedora. 100% do bruto vai para a Ellos. Mais pulseiras e colares.
- **Xangai:** vendedor Mauro (~5 dias para separar). Catálogo em PDF; Marcus manda print das peças. Vai para a Ellos.
- **Linda/Lin:** dois andares (2º e 7º), mesmo dono. Brincos e pingentes. Vai para a Ellos.
- **Pontual (Valdir):** paga por DEZENAS: dia 1 a 10, 11 a 20, 21 ao fim do mês, uma abaixo da outra. Pontual é **banho e maquininha** (Getnet e Cielo são maquininhas da Pontual, não CNPJ nosso).
- **Maquininha da Pontual:** o que passa nela sobe sozinho em Pagamentos a fornecedores. O Valdir desconta no fim do mês. O valor já passado fica "semipago"; vira definitivo quando o Valdir confirma o desconto. Tabela de descontos com os valores do mês e dos meses à frente. Linhas da maquininha com data de cada pagamento e botão de exportar para o fornecedor.

## 6. Pagamento a fornecedor: regra de ouro (Pix, DevMaster e Admin) [FEITO em parte]
**O Admin sabe do dinheiro ANTES. A DevMaster registra DEPOIS.** Quando a DevMaster registrar, o Admin CRUZA e NÃO DUPLICA. Mesmo sem baixa na DevMaster, o que foi pago entra como PAGO no Admin (com coluna "Pendente na DevMaster", feita pelo `casar-pagos`).

- O Lucas confirma o Pix no **Direcionar** com um fornecedor como destino → o Pix vira pagamento do fornecedor sozinho, na parcela mais antiga em aberto, e aparece em Contas a pagar. Só vale como pago com comprovante. **Sem comprovante: lança como PENDENTE** (a representante manda o comprovante depois); ele anexa no dia seguinte. Coluna "Falta comprovante" em Contas a receber.
- Regra nova vale só para lançamentos novos (há ~1.500 antigos sem comprovante).
- Lançamento é UNIVERSAL: origem, destino e comprovante. Excedente do Pix vira crédito. Pagamento complementar de conta pessoal (faltaram poucos reais) só dá como pago, sem movimentar contas.
- **Pix antecipado direto ao fornecedor** (ex.: representante manda Pix à Point antes do acerto): UM lançamento = recebimento da revendedora + pagamento da conta do fornecedor.
- Pagamentos a fornecedores mostra SÓ o que é da Sorelly e é SEM nota. O resto vem do Contas a pagar.
- **Conta da família paga pela empresa:** sobe no a pagar da família E conta como saída da empresa a mais para o Marcus; de qualquer sócio, qualquer conta, pode ratear.
- **Cruzamento por FORNECEDOR e MÊS** (nunca por lançamento nem por valor da parcela). Nomes reais dos fornecedores estão em `dmaat`. Pix da Pontual na DevMaster ficam no fornecedor 000512, natureza "PIX BANHO PONTUAL".
- Mesmo fornecedor, tipo, valor e vencimento entre -3 e +12 dias da parcela (janela de `casar-pagos.js`).
- Fechar pagamento de fornecedor: botão de baixar o arquivo (PDF com comprovantes) para mandar ao fornecedor.
- **Vendas com 2 ou 3 CNPJs** (ex.: Pix Itaú Black + link 59): evitar. Se acontecer, fatura por empresa em vendas separadas (a contabilidade aceita; é grupo). Ideal: um CNPJ só.
- **Nunca pagar em partes sem necessidade:** a intenção é UM pagamento só ao fornecedor.

## 7. Direcionar Pix [FEITO em parte; regras do Lucas]
- Horário de expediente: conferir o grupo de Pix; se o financeiro já direcionou conta, seguir. Dia com muitas contas em um CNPJ: focar nela (até 100%). Dia com poucas contas: valores menores nas contas que precisam; valores principais para fornecedores.
- Pix acima de R$ 3.000: preferir Pontual e Point (prestadores de valor alto). Pix até R$ 750 com cartão Getnet na empresa: ir para a Pontual (mesmo fornecedor); abaixo de R$ 750: prestadores menores da Sorelly.
- Pagamento por link: o Pix vai ao mesmo CNPJ. Rotativo só quita enviando para o Sicredi 34.
- Noite: contas definidas pelo financeiro; as revendedoras com mais acertos no mês vão para as contas que mais precisam. Pagamento alto: pedir que liguem antes de enviar acima de R$ 1.500.
- Link de pagamento: quem pede informa valor, parcelas e bandeira. Link do Getnet é da Pontual.
- O Direcionar diz ao Atendimento interno PARA QUAL CONTA vai o pagamento. NÃO é "o lugar que lança Pix de fornecedor".
- Limite por chave: as chaves Pix da Pontual e da Point têm teto de valor por envio (ex.: no dia 1 a 10, divisão de valor entre duas contas). **[A CONSTRUIR]** onde editar esse limite.

## 8. Prestadores de serviço e funcionários
- Prestador de serviço tem negociação própria: valor, data limite (sempre), valor mínimo de Pix (ex.: R$ 200), conta, serviço. Sempre que aparecer prestador novo: criar prestador + negociação (com botão que abre a negociação).
- **Joias como pagamento:** funcionários e modelos recebem peças como pagamento (ex.: modelo de fotos: R$ 500 em peças, custo 20%). Já existem telas no RH (Negociações › Joias e Pagamento em joias). **[A CONFIRMAR]** se cobrem registro e retirada das peças (verificado pelo agente de Marketing em 25/11/2026; ver `docs/pendencias/marketing-e-cadastro.local.md`).
- Bônus e horas extras de funcionário ficam no RH. Bônus por fora: lançar como combinado, marcar como pago quando recebido (dinheiro tem data). Cuidado com lista dupla Admin x DevMaster (mesmo pagamento com datas diferentes).
- Salário e adiantamento juntos no bloco Funcionários, ordenados do maior para o menor.

## 9. Compras: análise mensal
- Pergunta recorrente do Marcus: "quanto comprei no mês de bruto, quanto de banho, quantos pedidos". Resposta pelo banco (somente leitura): contar por data do pedido; banho por evento "chegou no banho" e "voltou do banho". Ver `docs/negocio/COMPRAS-BRUTO-E-BANHO-23-11-2026.local.md`.
- Tela de resumo: por mês e por categoria (banho, bruto) com "custo vendido + brinde" e diferença (verde: estoque aumentou; vermelho: diminuiu). Abrir com os 3 últimos meses; ano em menu suspenso.
- **[A CONSTRUIR]** Catálogo: o fornecedor sobe as fotos num local do sistema e vira catálogo; o banho escolhido já calcula o valor previsto. Meta de longo prazo: sistema ponta a ponta com os fornecedores.
- **[A CONSTRUIR]** Valdir (Pontual): painel de clientes (maior, médio, pequeno, inadimplência, 2 meses sem banhar), com API da Pontual (sistema "abas"). Ideia, não decidido.

## 10. Estilo das telas de fornecedor (as do Financeiro, ver `docs/design/PADRAO-VISUAL.md`)
Tabela compacta de planilha, azul, sem preto, sem colorido de blocos, tudo centralizado (nome do fornecedor à esquerda e primeiro), linhas brancas finas. Dourado para banho, azul para bruto (cor de apoio por tipo). "Falta pagar" sempre vermelho. Em lista suspensa: período, fornecedor, tipo. Quando fechado, mostrar CNPJ por nome curto, nome inteiro e quantidade de contas.

## 11. Em aberto (perguntas ao Marcus)
1. Prazos da Ellos e dos fornecedores de bruto.
2. Onde editar o limite de Pix por chave (Pontual e Point).
3. Registro de joias como pagamento (funcionários e modelos): qual tela.
4. Pedido da Pontual de 15/10 (pedidos 021 a 025): conferir os R$ 70,90 a mais por quinzena com o Lucas.
5. Versão universal do "Lançar pedido" para todos os fornecedores: publicar?
6. Quem é Lucas Castilho (prestador da empresa) x família: manter conforme `docs/pessoas/`.
