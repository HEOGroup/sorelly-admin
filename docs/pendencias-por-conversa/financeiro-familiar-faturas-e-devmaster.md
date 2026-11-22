# Pendências · conversa "Financeiro familiar, faturas do cartão e Arrumar na DevMaster" (19/11/2026)

Levantamento feito a pedido do Marcus (via conversa Cadastro Kommo). Só leitura: nada de código novo, nada de commit.

## 1. Resumo do que foi feito
1. Li as faturas do Itaú Black (jul a out/2026) e cruzei com o extrato do Itaú, o Nubank e o Financeiro familiar. As 4 faturas fecham no centavo (linhas + IOF).
2. Achei o financiamento do BMW M2: boleto Banco Volkswagen de R$ 12.602,80 todo dia 28 (ago, set e out pagos pela conta Itaú do pai).
3. Limpei duplicidades provadas pela fatura (só parcelas futuras) e lancei: Crédito Nubank (4 parcelas, dia 14), adiantamento de R$ 5.220,00 e fatura Nubank que fecha 24/11 (vence 03/12).
4. Publiquei na master (d22d2c8, v0.21.44): palavra "Faturas" no menu do Financeiro e aba "Arrumar na DevMaster" (14 títulos errados na DevMaster, R$ 2.477,85, só leitura).
5. Registrei as regras do Marcus: familiar separado da empresa; 68 Gang e M2 são 100% dele; "Itaú Black" = conta do pai usada pela empresa.

## 2. Alterações sem commit ou fora da master
| O que | Onde |
|---|---|
| Entrada de versão `0.20.92` e bloco "Financeiro familiar" no diário de decisões (duplicam o que já está na master na v0.21.44) | Pasta `C:\Users\marcu\Downloads\sorelly-admin\sorelly-admin`, branch `alteracoes-27-10`, sem commit (`versoes.js`, `DECISOES.md`). Pode descartar. |
| Banco de produção (fora do Git): módulo `ff` com `ff.faturas`, contas novas (`o_cnub4`), baixas, remoções | Tabela `sorelly.estado_modulo`. Cópias de segurança: `ff_bkp_20261119_baixas`, `ff_bkp_20261119_duplicidades`, `ff_bkp_20261119_faturas` |
| Memória do Claude (2 arquivos novos) | `C:\Users\marcu\.claude\projects\...\memory\` |
| Scripts de leitura das faturas e extratos | Pasta temporária da conversa (scratchpad); perdem-se ao limpar |
| Nada mais fora da master: as telas, a API e o registro estão no commit d22d2c8 | `origin/master` |

## 3. Pendências
**Pedidos do Marcus não terminados**
- 8 parcelas do Itaú Black que não existem no sistema (R$ 1.825,22): Unidas 509,89 · Auto Mecânica 509,97 · Mercado Livre 208,89 · Mar Hotel 155,10 · Rezende Suítes 118,08 · Hoteis.com 113,81 · MasterSeguranç 107,50 · Leroy Merlin 101,98. Falta saber de quem é cada uma.
- Unificar nomes das contas do pai, em 3 etapas (ele pediu "não mude tudo de uma vez"):
  1. `cb7` e `cmtcyoby…` (duplicada) viram "Marco Itaú PJ"; o tipo "PJ" está errado (é PF usada pela empresa).
  2. Trocar o nome em cerca de 17 baixas marcadas "Conta Marco Antonio — Itaú PF" que na verdade saíram da PJ (condomínios, Copel, Ultragaz, financiamento do M2, etc.) e ligar `o_9b2e` à conta certa.
  3. `cb3` vira "Marco Itaú PF" e o banco "Sicredi" vira Itaú.
- Cadastro único de contas (titular, banco, uso: empresa, família ou ambos). Hoje as contas estão em 4 lugares. Proposta feita, não aprovada.
- Financiamento do M2 (`o_9b2e`): forma deve ser Boleto, banco Itaú, e falta o número de parcelas (hoje repete até 2028).
- Marcus disse que o Marechal "não tem nada": então o iPhone "contrato 2" (`c16`, R$ 413,30, dia 6) provavelmente é erro; as baixas de ago/set/out saíram do "Caixa financeiro Sorelly" sem explicação.
- Diarista Erlina (`c127` e `c134`, R$ 315,00, dia 9): o extrato mostra 1 Pix por mês; o sistema tem 2.
- Fatura Nubank que venceu em 03/11: tirei a parcela de novembro (R$ 5.437,56) por ser a mesma fatura de 24/11. Se existiu outra, falta o extrato do Nubank de novembro.
- Baixas lançadas só pela palavra do Marcus (marcadas "informado pelo Marcus"): crédito Nubank R$ 3.125,05, adiantamento R$ 5.220,00, fatura Nubank R$ 250,00 e R$ 1.747,56. Conferir no extrato do Nubank.
- Claude/Anthropic: cerca de R$ 4 mil a R$ 7 mil por mês no cartão do pai (190 cobranças pequenas) e nenhuma conta no sistema. Não sei se é da empresa ou dele.
- Contas no lugar errado: Advogada de Marcas e Patentes R$ 100 (Anamaria, é da empresa); 4 parcelas de viagem R$ 7.148,49 em "Casa/Alphaville"; "Pix Itaú Marcus Vinicius" R$ 5.599,99 na categoria pró-labore; adiantamento do Marco (R$ 5.220) em "Casa/Família" e o salário dele na pessoa Marco.
- Allianz BMW M2 R$ 1.602,75 (`c59`): setembro e outubro sem prova no extrato (talvez saiu da conta da Anamaria).
- 11 contas abertas que o extrato pode mostrar pagas (retiradas em dinheiro e "Pix Itaú Marcus Vinicius"): prova fraca (só valor igual).
- Tela Faturas: só o Itaú Black. Faltam Nubank, Itaú Marechal da Anamaria e outros cartões; importar o PDF pela tela (hoje é por script); cartão adicional final 3202 (jul a set) sem pessoa; fatura de novembro (fecha 18/11, vence 25/11) ainda é só prévia de parcelas. Ideia combinada e não feita: linha "Fatura Itaú Black" no familiar.
- Datas de vencimento das comissões: os 13 títulos de comissão e km na DevMaster continuam sem data ou com ano 0226 (R$ 2.449,25). Só o pessoal da DevMaster corrige (volta na segunda-feira). Não escrevi a mensagem para eles. Não achei registro dessa pendência em outra conversa.
- Mensagens para a mãe (entregue) e para o pai sobre a fatura Itaú Black de novembro (oferecida, não escrita). Respostas da mãe ainda não vieram: Caixa Habitação R$ 3.749,00, Polyana R$ 2.570,00, Condomínio R$ 623,03, Claro R$ 359,91, Multas R$ 1.181,02.
- Contas atrasadas do Marcus em 17/11 (15 contas, R$ 18.498,53): não conferi quais já estão pagas.
- Itens que esperam um "sim" do Marcus desde antes: metas dos sócios no `ff` (Ana Beatriz R$ 3.000, Lucas R$ 4.000, Casa R$ 30.000); corrigir lançamentos "Nisis" para "Nisis Joias Ltda"; trocar o campo Conta do "Lançar pagamento" por lista de contas por fornecedor com chave Pix; aviso diário de contas a pagar; baixas da Anamaria e do Marco cruzando extratos.
- Pontual: NF e fatura por parcela ("Pontual NF 11689 · Fatura 13456-13455"). A frase do Marcus "precisa alinhar isso no admin como…" chegou cortada. Falta a lista de NF e fatura (Nickolas ou Amanda).
- Mensagens para a Amanda: Ecco Salva (Pix R$ 551,60 em 07/10), cartão Caixa Visa PF e confirmação do boleto GSC Negócios R$ 26.072,59 (05/11).

**Testes não feitos**
- Abrir "Faturas" e "Arrumar na DevMaster" na versão online (depois do deploy) e com uma pessoa do Financeiro que não seja sócio.
- `npm run fotos` e `npm run verificar` completos.
- A rota `/api/arrumar-devmaster` só foi testada no servidor local.

## 4. Perguntas prontas para o Marcus
1. **Posso unificar os nomes das contas do pai (Marco Itaú PJ / Marco Itaú PF) e corrigir as cerca de 17 baixas?** Recomendo sim, em 3 etapas. Se sim: os relatórios por conta ficam certos e o cadastro único fica possível. Se não: as baixas seguem na conta errada e as faturas e extratos nunca batem.
2. **Lanço as 8 parcelas do Itaú Black (R$ 1.825,22) no nome do Marcus?** Recomendo sim, e corrigir depois só as que forem de outra pessoa. Se sim: a tela Faturas fecha e o total de novembro sobe R$ 1.825,22. Se não: a diferença continua aparecendo.
3. **O Claude/Anthropic (R$ 4 a 7 mil por mês no cartão do pai) é despesa da empresa ou dele?** Recomendo conferir antes. Se for da empresa: sai do cartão do pai no familiar e entra no Contas a pagar da Sorelly. Se for dele: entra como conta nova no familiar.
4. **O iPhone "contrato 2" (R$ 413,30, dia 6) existe? A Erlina é paga duas vezes por mês?** Recomendo apagar só as parcelas futuras do que não existir. Se sim ao iPhone: preciso da fatura do cartão onde ele está. Se não: apago nov e dez e deixo o histórico.
5. **Me manda o extrato do Nubank de novembro?** Ele prova o crédito, o adiantamento, a fatura e diz se houve fatura em 03/11. Sem ele, essas baixas ficam "informadas pelo Marcus".

## 5. Esta conversa pode ser arquivada?
**Não ainda.** Falta: (a) as respostas 1 a 5; (b) o extrato do Nubank; (c) a etapa 1 de nomes das contas; (d) conferir as duas telas na versão online. Depois disso, o que sobrar é só a lista acima, já escrita aqui.
