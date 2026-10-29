# Alinhamentos do Financeiro (27 e 28/10/2026)

Resumo do que o Marcus e o Claude combinaram nesta rodada. **Este arquivo vai para o GitHub (repositório público): não há valores da empresa aqui.** Os números reais e a visão de negócio estão em `ALINHAMENTOS-FINANCEIRO-28-10-2026.local.md` (fora do Git, só neste computador).

## 1. Objetivo
Tirar o financeiro 100% da DevMaster e deixar só no Sorelly Admin, em poucos dias. A Nayale (financeiro) passa a operar direto. Exige: backup diário, nuvem, registro de quem fez o quê, ver o sistema em dias anteriores, login real. Esses cinco itens são do Leonardo (responsável técnico). Ver `docs/DECISOES.md`.

## 2. Fontes de dados (somente leitura)
| Dado | Fonte | Observação |
|---|---|---|
| Contas a pagar (títulos em aberto) | DevMaster `dmabe` (situação A e P com saldo) | Traz natureza e filial; nome do fornecedor em `dmaat`, nome da natureza em `dmaan` |
| Baixas (contas pagas) | DevMaster `dmabf` (`abf_tipo` S, `abf_tpcontaorigem` P) | Banco, conta, filial e data de cada pagamento |
| Empresas | DevMaster `dmzzz` | Filial 01 = CNPJ 34, 02 = 46, 03 = Serenety 59, 04 = Hess & Oliveira (por fora), 05 = Axis 67 |
| Contas bancárias | DevMaster `dmaap` | 70 contas; o CNPJ sai do nome da conta |
| Saldos das contas, contas pagas por dia, pago e a pagar por mês | Admin antigo (`finance_balance`, `faturamento_contas_diario`, `faturamento_contas_mes`) | Arquivo local `saldos-atualizacao.local.js` |
| Revendedoras por dia | Admin antigo `cadastro_daily_reseller` | Série até 27/10/2026 |
| Agendamento (cotas e saldos das representantes) | Admin antigo `acertos_representante*` | Arquivo local `agendamento-real.local.js` |
| Carregar | Só o Marcus informa (PDV → Venda → Carregar na DevMaster) | Não achei status equivalente na `dmach`; ver pendências |

## 3. Regras decididas
1. **Meta do mês = 98%** (o Marcus mandou manter).
2. **Carregar NÃO está dentro dos acertos realizados.** Total do mês = acertos realizados + Carregar + a realizar. Toda atualização do Marcus precisa trazer o Carregar.
3. **Contas pagas por CNPJ: regra pela conta bancária usada**, não pela filial do cadastro (a filial está cadastrada errada em parte dos títulos). Contas de Caixa e contas pessoais viram "por fora". Teste: CNPJ 59 e 67 batem com o admin antigo; 34, 46 e "por fora" diferem em alguns dias (a equipe classificou à mão). **Ainda não aplicada** às baixas. Proposta: usar só de 28/10 em diante e manter os dias passados do admin antigo.
4. **"Contas por fora":** hoje o Lucas lança na planilha de pagamentos a fornecedores e a Nayale repete no sistema. Proposta: o Lucas lança direto no módulo Pagamentos a fornecedores e o "por fora" do dia vira a soma desses lançamentos.
5. **A filial da DevMaster vira CNPJ assim:** 01 = 34, 02 = 46, 03 = 59, 04 = por fora, 05 = 67 (acerta cerca de 90% dos títulos já conferidos). Título já conhecido mantém o CNPJ conferido.
6. **Passar revendedoras para o mês seguinte NÃO se faz no Dashboard.** O Marcus altera direto na DevMaster (data prevista). O campo "Passadas para o próximo mês" saiu do bloco Acertos do mês.
7. **Resultado do mês real = variação do saldo das contas** (com o dinheiro em caixa). Ele é negativo em outubro. A linha "diferença entrou × esperado" NÃO é o resultado.
8. **Média real recebida por acerto** = o que foi pago na hora ÷ revendedoras que acertaram (contas a receber). Ao lado da média das notas fiscais (faturado ÷ acertos).

## 4. O que foi construído nesta rodada
| Item | Onde |
|---|---|
| Direcionar pagamento: forma Pix, maquininha ou link; sugestão que não mistura o que fatura com o que não fatura; fila e fontes revistas | `pages/DirecionarPix.js`, `domain/direcionar-pix.js` |
| Faturamento corrigido e fixado até 27/10; coluna Carregar no Dia a dia; bloco Carregar na Previsão | `state/store.js` (`aplicaFat26`, `aplicaFat27`, `aplicaHoje26`), `components/tabela-faturamento-dia.js`, `components/previsao-meses.js` |
| Visão geral: Carregar na faixa do topo; blocos sem abre/fecha | `pages/VisaoGeral.js` |
| Contas a pagar direto da DevMaster (outubro a 2027) | `scripts/atualizar-contas-pagar.mjs` (rodar: `node scripts/atualizar-contas-pagar.mjs`) |
| Contas pagas e saldos de 23 a 27/10; revendedoras até 27/10 | `domain/saldos-atualizacao.local.js`, `state/store.js` |
| Agendamento de outubro com as 28 representantes reais (cota e saldo) | `domain/agendamento-real.local.js`, `aplicaAgendReal` em `state/store.js` |
| Resultado do mês: abas (Faturamento e receber, Pagar, Entrou nas contas, Previsão), "falta pagar" da DevMaster, Previsão só do mês atual com fechamento, média real recebida | `pages/ResultadoMes.js`, `docs/negocio/RESULTADO-DO-MES.md` |

## 5. Pendências
| Item | Quem |
|---|---|
| Aplicar a regra do CNPJ pela conta bancária nas baixas (contas pagas por dia) | Claude, depois do OK do Marcus |
| Créditos bancários (arquivos no Google Drive do Marcus; o conector do Drive caiu na sessão) | Marcus informa o caminho dos arquivos |
| Saldo de fim de mês, divergência de saldo e reabrir mês fechado (existem no admin antigo, não no nosso) | Claude |
| Carregar automático (achar o status certo no PDV da DevMaster) | Marcus informa quantas vendas aparecem em PDV → Venda → Carregar |
| Previsto do Agendamento mostra o valor do admin antigo; o total do mês usa realizados + Carregar + a realizar | Marcus decide |
| Erros de cadastro na DevMaster: título com vencimento no ano 0026; título de 15/11/2025 ainda em aberto; Marciane com cota 14 e saldo inicial 69 no admin antigo | Marcus confere |
| 37 títulos que saíram da lista de contas a pagar entre 22 e 27/10 (pagos ou renegociados) | Marcus confirma |
| Segurança: backup diário, nuvem, registro de quem fez o quê, ver dias anteriores, login real | Leonardo |
| Controles fiscais: pró-labore pago por Pix das revendedoras, contas pessoais no fluxo, "por fora" | Marcus com o contador |

## 6. Cuidados com este repositório
- Repositório **público**: nunca subir `*.local.*`, chaves ou valores da empresa em arquivo versionado.
- Antes de subir: `npm run conferir` (regra do Leonardo, 26/10/2026). O GitHub publica sozinho no servidor.
- Uma conversa por assunto: duas conversas mexendo no mesmo arquivo se sobrescrevem.

## 7. Contas a pagar lidas pelo servidor (29/10/2026)
- O servidor lê a DevMaster (`src/server/contas-dm.js`, rota `/api/contas-dm`, só Financeiro e Diretoria, cache de 10 minutos) e o navegador recebe ao abrir e a cada 10 minutos (`lib/contas-dm.js`). Os arquivos `*.local.js` NÃO existem no servidor publicado: por isso o site publicado mostrava a lista quase vazia.
- Tela Contas a pagar: o alto (Já pago e Falta pagar) agora vem da DevMaster quando o servidor responde; antes vinha do admin antigo (número parado).
- **Data do pagamento = data de débito** (`abf_datadebito`). Com ela o dia 01/10 dá o mesmo valor que estava no sistema; com a data de pagamento dava menos. Falta explicar R$ 150,00 contra a tela da DevMaster do Marcus (4 baixas de R$ 150,00 nesse dia: FRE 62, ADM 1435, ADM 1434, VR 951).
- Requisito de produção: as variáveis `DEVMASTER_API_URL_V2` e `DEVMASTER_API_KEY_V2` precisam estar configuradas no servidor publicado.
