# Resultado do mês, Contas a receber e a função de cada aba do Financeiro

Documento de memória (27/10/2026). Reúne tudo o que o Marcus decidiu e descobriu na conversa sobre Contas a receber, Contas a pagar, saldo das contas e o "resultado efetivo do mês". Leia antes de mexer em qualquer tela do Financeiro. Atualize ao decidir algo novo.
**Este arquivo vai para o GitHub (repositório público): não há valores da empresa nem nomes de revendedoras aqui.** Os números reais de 27/10/2026 e as frases do Marcus estão em `RESULTADO-DO-MES.local.md` (fora do Git, só neste computador).

## 1. O objetivo do Marcus (a razão de tudo)
"Cansei de operar no negativo, eu quero ter controle total."
- Saber o **resultado efetivo do mês**: o que entrou de verdade por revendedora + a inadimplência que se recebe todo mês + as compras de funcionárias.
- Depois, com a **previsão de acertos dos próximos meses**, chegar a um cálculo real de **quanto vamos receber e quanto vamos pagar em cada mês**.
- O relatório de notas fiscais sempre foi a base do Marcus, mas ele **não mostra o recebido real por revendedora**, **não traz a inadimplência** e **não inclui compras de funcionárias e outras coisas**. A partir de agora a medida é o que o sistema calcula, e não só a nota.

## 2. Regras de negócio decididas
1. **Acerto - loja (formas ACE e ACI na DevMaster) = a revendedora NÃO pagou na hora**, mesmo que pague depois.
2. Mas **todo mês se recebe pagamento de acerto - loja** (de meses e anos anteriores). Por isso o que importa é o que **efetivamente não foi recebido** = o **saldo que continua em aberto** (de 2026 e de anos anteriores), e não o valor lançado.
3. **Recebido nas contas** = Pix, link, cartão e dinheiro (tudo que não é acerto - loja), mais o acerto - loja de meses antigos que foi pago naquele mês.
4. **Funcionárias = o grupo FUNCIONÁRIOS do CADASTRO do cliente na DevMaster** (`dmaam.aam_grupo = "0002"`, nome do grupo na tabela `dmalv`). **Não** vale a lista de CPFs do RH. Revendedora negativada ou que sumiu com o kit **não** é funcionária: entra na conta normal.
5. Vendas de funcionárias são separadas em um indicador próprio (elas pagam pouco por Pix; quase tudo vira acerto - loja).
6. **Pode ter dinheiro que entrou na conta e ainda não foi baixado no DevMaster** (certeza do Marcus). Não há dinheiro na conta que não passe pelo DevMaster, só atraso de baixa.
7. **Entrou de verdade** = variação do saldo das contas + total de contas pagas no mesmo período. Saldo de fim do dia; saldo do dia 27/10 não muda mais.
8. **Nada abreviado nas telas.** Texto que não cabe quebra em duas linhas. Nada em cima de nada (mapa do dinheiro).
9. Ano inteiro na lista de pagamentos pesa (cerca de 30 mil linhas): com o ano inteiro a lista mostra o mês atual; só o filtro "Só acerto - loja" traz todos os meses.

## 3. De onde vêm os dados (somente leitura)
| Dado | Fonte | Observação |
|---|---|---|
| Títulos a receber (cada venda, forma, valor, saldo, vencimento, vendedor) | DevMaster `dmabg` | Situação B baixado, A aberto, P parcial |
| Nome de cada forma de pagamento / conta | DevMaster `dmacd` | Ex.: "PIX - SICREDI - SORELLY - 34" = forma Pix, conta Sicredi, CNPJ 34 |
| Baixas (data real do pagamento e conta que recebeu) | DevMaster `dmabf` (`abf_datapgto`, tipo E) | Liga ao título por prefixo + número + parcela |
| Vendedores / representantes | DevMaster `dmaao` | O nome vem com código no fim (removido) |
| Clientes, grupo (funcionária) | DevMaster `dmaam`, `dmalv` | Grupos: 0001 Revendedoras, 0002 Funcionários, 0003 Top 100, 0005 Top 30 |
| Data de faturamento da venda | DevMaster `dmach.ach_datafat` | O relatório do Marcus usa esta data, não a emissão |
| Saldos das contas bancárias por dia | Admin antigo `finance_balance` + `finance_account` | Arquivo local `saldos-atualizacao.local.js` |
| Contas pagas por dia (CNPJ 34, 46, 59, 67 e "por fora") | Admin antigo `faturamento_contas_diario` | Mesmo arquivo local |
| Pago e a pagar por mês | Admin antigo `faturamento_contas_mes` | Gravado em `state/store.js` (`aplicaContas27`, versão `cp27V` 2); mais completo que a soma dos dias |

Atualização diária do que vem do admin antigo: skill `atualizar` (sem servidor ainda). O que vem do DevMaster é lido pelo servidor, em segundo plano, com cache de 30 minutos.

## 4. O que foi construído
- **Financeiro › Receber › Contas a receber** (`/contas-a-receber`, `pages/ContasReceber.js`, servidor `src/server/contas-receber.js`, rotas `app/api/contas-receber` e `/titulos`; só Diretoria por enquanto): mapa do dinheiro de ponta a ponta; blocos CNPJs e contas | Forma de pagamento (cada linha abre e fecha); quanto efetivamente não recebemos; mês a mês; quem ainda não pagou; em aberto por representante; lista de TODOS os pagamentos do mês, linha por linha, com botão Agrupar por revendedora e filtros (mês, só não funcionárias, titular, situação: só acerto - loja / só em aberto / só recebido).
- **Financeiro › Contas › Contas a pagar** (`pages/ContasPagarLista.js`): alto com Já pago, Falta pagar e Total do mês do admin antigo; filtros e cartões por CNPJ escondidos atrás de botões. A lista embaixo ainda vem do relatório do DevMaster de 22/10 e não tem as baixas posteriores.
- **Financeiro › Resultado do mês** (`/resultado-do-mes`, `pages/ResultadoMes.js`, primeira palavra do menu do Financeiro): três quadros — Receber (DevMaster), Pagar (admin antigo) e Entrou de verdade nas contas (variação do saldo + contas pagas × esperado; a diferença é dinheiro que entrou e ainda não foi baixado) — e o saldo se pagar tudo o que falta no mês. Falta: previsão dos próximos meses e a linha de notas fiscais automática.
- Menus: a tela saiu de Revendedoras e foi para Financeiro (`navigation/setores.js`, aba `revreceber`).
- Versões 0.14.20 a 0.14.31 em `domain/versoes.js`; decisões em `docs/DECISOES.md` de 27/10/2026.

## 5. Proposta: para que serve cada aba do Financeiro (a confirmar com o Marcus)
O Caixa atual está confuso: mistura saldo do dia, lançamento manual, prova do caixa e funil. Proposta:
| Aba | Para que serve (uma frase) |
|---|---|
| **Resultado do mês** (NOVA) | A visão-mãe: Receber × Pagar do mês, entrou de verdade, diferença, e a previsão dos próximos meses. |
| Receber › Contas a receber | Quem pagou e quem não pagou, por conta, forma e revendedora. |
| Receber › Faturamento | O que foi vendido e faturado (notas fiscais). |
| Receber › Inadimplência e Cobrança | Quem deve (revendedoras e funcionárias). |
| Pagar › Contas a pagar | O que já foi pago e o que falta pagar no mês, por vencimento e CNPJ. |
| Pagar › Fornecedores e Comissões | Para quem se paga. |
| Saldo das contas (hoje "Caixa") | Só os saldos bancários do dia, por CNPJ. A prova real do caixa vai para Resultado do mês. |
| Previsão de caixa | Acertos previstos × contas a pagar nos próximos meses. |

## 6. Resultado do mês: o que a tela mostra
```
RECEBER (DevMaster)                         PAGAR (admin antigo)
  Notas fiscais (relatório do Marcus)         Pago no mês
  − Inadimplência do mês (acerto - loja)      Falta pagar
  = Recebido na venda
  + Inadimplência antiga recebida no mês   ENTROU DE VERDADE
  + Recebido de funcionárias               (variação do saldo + pago)
  = Esperado entrar                        DIFERENÇA = entrou e ainda não foi baixado
```
Depois: previsão de acertos dos próximos meses − contas a pagar de cada mês = saldo previsto mês a mês.

**Previsão (pronta em 27/10/2026, bloco embaixo da tela):** colunas = o que falta do mês atual + 3 meses seguintes.
```
Acertos previstos (Visão geral) → calibrados para revendedoras que compram
× média por acerto (contas a receber, só revendedoras, + alta: nov 5%, dez 10%, jan R$ 900)
× % pago na hora
+ inadimplência antiga recebida (média)  + funcionárias (média)
= Entrada prevista   − A pagar (admin antigo)   = Resultado   → saldo das contas mês a mês
```
Ainda em aberto: separar inadimplência "não paga" × "fechada por remessa" (revendedoras que furtaram); janeiro sem contas lançadas repete dezembro.

## 7. Pendências e perguntas em aberto
1. **Qual é o relatório de notas fiscais do Marcus** (nome no DevMaster e filtros)? Os testes por data de nota e por data de emissão não bateram com o número dele; sem isso a linha "Notas fiscais" não se atualiza sozinha.
2. O **total de contas pagas do mês do admin antigo** (`faturamento_contas_mes`) é o oficial? Ele é maior que a soma dos dias (o dia mais recente costuma estar incompleto).
3. A lista de Contas a pagar precisa de um **relatório novo de contas a pagar do DevMaster** para ficar em dia com o admin antigo.
4. Liberar Contas a receber para o **Financeiro** (hoje só Diretoria).
5. Contas com nome de pessoa (Itaú PJ Marco, PF) ficam em "Família e sócios"? "Maquininhas P" e "Caixas internos" são grupos de CNPJ?
6. Separar por ano o acerto - loja de anos anteriores ainda em aberto (vem de 2022)?
7. **Previsão de acertos** dos próximos meses: de onde vem (Agendamento / Previsão de caixa)? Entra na próxima etapa.
8. Acesso à tela: a API é só Diretoria; o Financeiro precisa de permissão própria.

## 8. Rotina diária (enquanto o servidor não existe)
1. Rodar a skill `atualizar`: saldos, contas pagas por dia e totais do mês do admin antigo. **Sempre subir `saldosV` em `state/store.js` (hoje 13) e `cpdAdminV` quando regenerar os arquivos**, senão o estado já salvo no navegador/servidor não recebe os dias novos (foi o que escondeu o saldo de 27/10).
2. Abrir Contas a receber e apertar ↻ (ou esperar os 30 minutos): lê o DevMaster.
3. Conferir Resultado do mês: a diferença é só atraso de baixa; se crescer muito, investigar.

## 7. Atualização de 28/10/2026: de onde a tela tira o "falta pagar"
- A tela Resultado do mês NÃO usa o faturamento lançado (acertos e recebido) nem o Carregar nem o "a realizar". Ela usa: Receber = DevMaster (cache de 30 minutos; botão ↻), Pagar = lista de títulos em aberto da DevMaster (`scripts/atualizar-contas-pagar.mjs`) e, se a lista estiver vazia no mês, o número do admin antigo (`s.contasPagar`), Entrou de verdade = variação do saldo + contas pagas.
- Antes o "falta pagar" do mês corrente vinha só do admin antigo (número parado desde 27/10 21:03, valor no arquivo local). Agora vem da lista da DevMaster. O "pago" continua do admin antigo. Valores: ver `RESULTADO-DO-MES.local.md`.

## 8. Resultado do mês, mudanças de 28/10/2026 (pedido do Marcus)
- Novo quadro **Faturamento** na tela (primeiro quadro): acertos feitos, Carregar (fora dos acertos), a realizar, total de acertos, esperados a 98%, faturamento lançado, média, faturamento previsto e **resultado previsto do mês** (faturamento previsto menos já pago e falta pagar).
- A linha solta "Saldo se pagar tudo o que falta no mês" saiu do quadro Entrou de verdade (parecia um número aleatório). A variação do saldo virou **"Resultado do mês até agora"**, com sinal e cor: vermelho se negativo. Em 27/10 o resultado real de outubro é negativo (valor no arquivo local).
- A linha de diferença (entrou x esperado) ganhou nome que diz o lado: "a favor" (verde) ou "contra" (vermelho). Ela NÃO é o resultado do mês.

## 9. Resultado do mês fica visual (28/10/2026, pedido do Marcus: "está gigante, nem sei onde olhar")
- Topo da tela: faixa com 6 indicadores (resultado até agora, resultado previsto, faturamento lançado, já pago, falta pagar, entrou nas contas); verde e vermelho só no sinal.
- Abaixo, abas visíveis: Faturamento · Receber · Pagar · Entrou nas contas · Previsão. Só UMA tabela aparece por vez (antes eram cinco empilhadas).
- Saiu a linha "Para conferir: soma dos dias lançados" do quadro Pagar.

## 10. Resultado do mês sem a barra de números (28/10/2026, pedido do Marcus: "nunca olho essa barra")
- Saiu a faixa de 6 indicadores. Faturamento e Receber ficam JUNTOS numa aba só ("Faturamento e receber", dois quadros lado a lado). Abas: Faturamento e receber · Pagar · Entrou nas contas · Previsão.
- O resultado previsto fica no fim do quadro Faturamento; o resultado até agora (variação do saldo) fica no quadro Entrou nas contas.

## 11. Aba Previsão só do mês atual (28/10/2026, pedido do Marcus)
- A aba Previsão mostra primeiro SÓ o que falta no mês atual: quanto falta entrar (acertos que faltam, inadimplência antiga e funcionárias) e quanto falta pagar. No fim, o FECHAMENTO DO MÊS: entrou, falta entrar, entrada total; pago, falta pagar, saída total; resultado final.
- Os próximos meses (tabela de várias colunas) ficam atrás do botão "Ver os próximos meses".

- (28/10/2026, mesmo dia) A Previsão do mês atual também mostra os ACERTOS: realizados, vendas no Carregar (fora dos acertos), a realizar, total, esperados a 98% e o faturamento lançado; o Fechamento do mês começa com a linha "Acertos do mês" (realizados + Carregar + a realizar).

- (28/10/2026) **Média real recebida por acerto** = o que as revendedoras pagaram na hora (Pix, link, cartão, dinheiro; `d.K.n[mês].rec`) ÷ revendedoras que acertaram (`d.K.n[mês].n`), lido do contas a receber da DevMaster. Fica ao lado da "Média por acerto (notas fiscais)" (faturamento lançado ÷ acertos). Aparece no quadro Faturamento e na Previsão do mês. Pedido do Marcus: a média das notas fiscais não é o que entra de verdade.
