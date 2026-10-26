# Caixa e Financeiro — o que foi alinhado com o Marcus (out/2026)

Documento de memória da tela **Financeiro → Saldos Bancários → Caixa**. Leia antes de mexer nela. Atualize ao decidir algo novo.
**Este arquivo vai para o GitHub (repositório público): não há valores da empresa aqui.** Os dados reais estão em `src/apps/montagem/domain/saldos-iniciais.local.js` (fora do Git, `.gitignore`) e os números e exemplos em `CAIXA-FINANCEIRO.local.md` (também fora do Git). Quem for trabalhar na tela precisa pedir esses dois arquivos ao Marcus.

## 1. Para que serve
Fazer a **prova real do caixa**: o que o faturamento e as contas a pagar dizem que sobrou tem que bater com o que as contas bancárias mostram. Marcus nunca conseguiu acertar isso na Sorelly. A tela mostra **onde estão as divergências** (por período, por CNPJ e por natureza de recebimento), para saber para onde enviar dinheiro e não assumir mais dívida (meta: contas positivas).

## 2. As 4 fontes de dados (cada uma responde uma coisa)
1. **Saldos das contas bancárias** (dia a dia, por CNPJ): quanto dinheiro existe de verdade. Saldo do FIM do dia.
2. **Contas pagas** (dia a dia, por CNPJ 34/46/59/67 e "contas por fora"): quanto saiu.
3. **Notas fiscais** (a "lista de acertos com valores"): quanto foi vendido e faturado.
4. **Contas a receber** (relatório de baixas, relFin008, por Dt. Baixa e por natureza): quanto foi liquidado. Traz coisas que as notas não trazem: **inadimplência paga de outros meses** e **pagamento de funcionários**. Por isso nunca será igual ao faturado. "Acerto com loja" aparece nas baixas, mas **não entra na conta**.

Ainda **não** existe relatório de transferência entre contas, nem o recebido separado por CNPJ nas notas fiscais.

## 3. A conta que tem que fechar
`Saldo no início + Recebido nas contas + Aportes − Contas pagas (que passam pelas contas) = Saldo esperado` → comparar com o **Saldo real**. A diferença é a **divergência**: **SOBRANDO** (mais dinheiro nas contas que o esperado) ou **FALTANDO**. Marcus disse que nos meses a divergência normal é pequena (dezenas de milhares); só precisamos alinhar o resto.

**Funil mostrado em "Como ler"**: Notas fiscais → Contas a receber (baixas) → Recebido nas contas → Entrou de verdade (variação do saldo + pago nas contas). Cada degrau tem um motivo diferente de diferença.

## 4. Regras decididas
- Saldo do dia = **fim do dia**. Conta sem lançamento no dia vale o último saldo (carry-forward). **O ideal é ver o saldo no último dia de cada mês** (no dia 1º já se pagam contas).
- Saldo = soma das contas **sem as bloqueadas** (Retido/A receber). **Disponível** = saldo + **cheque especial total** (limite liberado pelos bancos). Disponível inclui dinheiro do banco, não é só recurso próprio.
- **Período livre**: todo o resumo (cartões, planilha, fluxo, variação) acompanha o "de … até …"; qualquer data a partir do primeiro relatório diário. A **variação** é sempre do primeiro ao último dia em aberto (dias podem ser fechados no filtro "Dias"; esconder dia do meio não muda nada).
- Fins de semana e **feriados nacionais** (lista `FERIADOS` em `domain/saldos-contas.js`) aparecem em violeta, com a palavra "Feriado". Sábado/domingo/feriado sem movimento repetem o dia anterior.
- **Acerto com loja** (nas baixas, não entra na conta): tirado do recebido. Campo de **inadimplência recuperada** existe no Lançar, mas **não deve ser somado às baixas** (as baixas já trazem a inadimplência paga); fica só para separar, a definir.
- **Repasses diretos** (revendedora paga direto ao fornecedor ou representante: Point, Pontual, Office Graf, Linda Acessórios, Prestadores, PIX Representantes): entram no recebido e **já contam como pago** (estão dentro de "contas por fora"). Por isso o grupo **"Fornecedores e repasses diretos"** sai do recebido e do pago "nas contas" (a divergência não muda, só o que passou pelos bancos). Marcus: dos ~1,4 milhão pagos num mês, cerca de 500 mil vão direto a fornecedores/terceiros. Pode haver outras contas de fornecedores a incluir.
- **Contas por fora** podem ir para sócios ou terceiros. Assunto a aprofundar.
- **Aporte de sócio**: dinheiro que o sócio manda para um CNPJ. Não é faturamento. Lançamento com data, CNPJ e valor; entra no esperado. **Não há transferência entre CNPJs.**
- **Itaú Marco PJ** é conta PF usada pela empresa (vão parar de usar); conta da empresa, **bloco separado** no Caixa, com saldo diário (ainda sem saldos informados).
- O contas a receber é a fonte do recebido de outubro (por enquanto). Meses anteriores ficam pelas notas fiscais e só têm saldo do 1º e do último dia.
- Natureza do relatório → grupo/CNPJ é **aproximação pelo nome** (ex.: PIX SICREDI ATACADISTA = CNPJ 34); PIX de pessoa física → Particular; Dinheiro → Dinheiro; sem dono → "A definir". O mapa fica no arquivo local (`RECEBER_MAPA`). Marcus corrige o que estiver errado.

## 5. O que se lança todo dia, quem e quando
Combinado (provisório): **10h do dia seguinte, sobre o dia anterior**.
| Item | Quem (por enquanto) | Onde |
|---|---|---|
| Pagamentos do dia (CNPJ 34/46/59/67 e por fora) | Nayale | Caixa › Lançar saldos (ou Contas a pagar › Diário) |
| Saldos das contas (fecha CNPJ por CNPJ) | Marcus | Caixa › Lançar saldos |
| Notas fiscais, acertos, baixas, acerto com loja | Marcus | Caixa › Lançar saldos › Faturado e recebido |
| Aporte de sócio | Marcus | Caixa › Lançar saldos |
A tela "Como ler" (botão ❔, recolhida) mostra a conta, o funil, esta tabela com **o último dia lançado e "em dia/atrasado"**, e as regras. Falta ainda a aba **Atividades por funcionário** (check diário com link direto para a tela).

## 6. Onde está no código
- Tela: `src/apps/montagem/pages/Caixa.js` (visões "Visão geral" e "Lançar saldos"), `pages/ConfigContas.js` (⚙ Contas). Rota `/montagem/caixa`.
- Regras/dados: `domain/saldos-contas.js` (blocos, contas, feriados, helpers). Estado `s.saldosContas` = `{blocos, contas, saldos{data:{conta:valor}}, fechamentos{data:{bloco:true}}, aportes{data:[…]}, ajustes}`; `s.fatDia{data:{acertos,nf,recebido,loja,recup}}`; `s.faturamentoDiario` guarda o ACUMULADO do mês (`acumularFaturamento`); `s.contasPagasDiario` (Contas a pagar › Diário).
- Reducer: `SALDO_DIA`, `SALDO_CEL`, `SALDO_FECHAR`, `SALDO_APORTE`, `FAT_DIA`, `CPD_SET`. Migrações em `state/store.js` (`saldosV`, `fatDiaV`, `cpMesV`, `cpdLocalV`).
- Contas a pagar 2026 (pago por mês, outubro pago + a pagar, nov/dez a pagar): `domain/financeiro.js` (`CONTAS_PAGAR_DEMO`). Outubro: o pago vem da **soma dos dias lançados**.
- Menu: setor **CNPJs** (cadastro) logo abaixo de Visão geral; "Limite de faturamento" ficou no Fiscal; Financeiro › Saldos Bancários › Caixa.
- Menu lateral do Admin tem largura ajustável (arrastar a borda; `sorelly_menu_largura`).

## 7. Pendências e dúvidas em aberto
1. **Inadimplência recuperada**: como identificar no relatório o que é de outros meses (data de vencimento/débito?). Verificar.
2. **Contas por fora**: composição (diretos a fornecedores × sócios × terceiros × saída de conta própria) e de qual conta sai cada um.
3. **Transferências entre contas** não aparecem em nenhum relatório. Marcus: não há transferência entre CNPJs, só sócio→CNPJ (aporte). Pode haver outros movimentos (Particular/Dinheiro enviando para as empresas) que distorcem a divergência por CNPJ: investigar.
4. **Contas de fornecedores** (dinheiro que vai direto a eles): cadastrar todas como contas/grupos.
5. **Integrações futuras**: formas de pagamento da **Calculadora de acertos** e **PIX para representantes** do **Consolidado das representantes** (valores enviados exatos para cada conta; evitar contar duas vezes com o relatório).
6. **Saldo diário do Itaú Marco PJ**.
7. **Contas a pagar a vencer por CNPJ** (o "a pagar" do mês separado) e **contas a receber a vencer**, para o plano de envio de dinheiro.
8. **Meses anteriores**: saldo do último dia de cada mês e faturamento de cada mês (só começo e fim).
9. **Quem lança** cada item de verdade e o horário (definir; Nayale só no contas a pagar por enquanto).
10. **Aba Atividades por funcionário** (check diário, visão do dono e do funcionário).
11. Recebido **por CNPJ** pelas notas fiscais (hoje só pela natureza do contas a receber).
12. Importar o relatório de baixas dentro do sistema (hoje carregado de um arquivo).
13. Dados de produção: ligação com o admin real (aguardando chave de API, Juan/Leonardo). A conta de produção da tela Saldos bancários só vai até agosto e é manual; aqui ela é calculada.

## 8. Como o Marcus quer trabalhar (resumo, ver CLAUDE.md)
Perguntas curtas, poucas por vez; visual compacto, grade alinhada, números que "correm" ao mudar, cartões em degradê suave, disponível em verde, textos sem jargão; nada de blocos confusos no topo; tudo que mudar de período atualiza junto. Sem gastar tokens à toa.
