# 02 · Regras de orientação do cérebro

## As regras do cérebro (ditas pelo Marcus em 18/11/2026)
1. **Orientação por CNPJ.** O Direcionar indica o CNPJ; a conta dentro dele é escolha do Lucas, guiada pelas regras 5 a 8.
2. **Pagar no CNPJ.** Não importa de qual banco a conta sai. O banco previsto na DevMaster não vale. (Hoje quase toda conta do 34 está prevista pelo Sicredi, mas dá para pagar por outra conta do mesmo CNPJ.)
3. **Cheque especial conta como dinheiro:** disponível = saldo + limite.
4. **Meta:** nenhuma conta negativa. Cada conta é avaliada por si.
5. **Grupo:** o Rotativo e a conta Sicredi 34 andam juntos (o saldo positivo do Sicredi abate o Rotativo). Safra e Unicred são separados.
6. **Amortização diária:** todo saldo positivo do Sicredi 34 liquida o Rotativo no mesmo dia; o limite liberado reabre no dia seguinte e se usa de novo. Repete todo dia.
7. **Pouco negativo (até R$ 2.000 por conta):** orientar enviar dinheiro **só o suficiente para deixar a conta positiva**.
8. **Depois:** orientar Pix para o 34 **até todas as contas dele ficarem positivas** (confirmado pelo Marcus). **Ordem das negativas (confirmada):** Safra primeiro (ideal, faz a conta girar), depois Rotativo + Sicredi, depois Unicred.
9. **Saldo usado:** sempre o **último saldo lançado** (a equipe lança no fim do dia, por volta das 17h).
9b. **Ideal:** o Pix entra na conta negativa e as contas do dia são pagas por ela (ex.: Safra), para o dinheiro girar. Hoje a sócia paga tudo pelo Sicredi. *(a confirmar como o sistema diz "pague por esta conta")*
10. **Olhar o mês, não o dia seguinte:** somar as contas a pagar por CNPJ, dia a dia, até o fim do mês e o começo do próximo. Um dia com R$ 50, 70 ou 100 mil num CNPJ precisa de aviso antes.
11. **Antecedência:** orientar com 1 a 2 dias de antecedência. A partir do dia 26, olhar o começo do mês.
12. **Prioridade quando o dinheiro não cobre tudo (Marcus, 18/11/2026):** primeiro vale, INSS (e FGTS), cheques e **todos os boletos**; o resto depois.
12a. **Avisos:** ficam num **bloco de avisos no Direcionar**.
12c. **Colchão:** o ideal é todas as contas **bem positivas**, não só acima de zero (valor do colchão a definir).
13. **Autonomia:** por enquanto o cérebro só SUGERE e o Lucas confirma sempre. No futuro ele vai executar sozinho (condições a definir).
14. **Limite de faturamento por CNPJ (Fiscal):** existe, mas este ano está tranquilo; não trava o Pix por enquanto.
15. **Open Finance:** será feito em 2027 (saldo automático no lugar do lançamento às 17h).
12b. **Faturamento:** usar a média de recebimento por dia do Contas a receber (dinheiro efetivamente recebido). A avaliação é refeita todo dia.

## Formato da orientação (modelo da sócia do caixa)
O cérebro deve entregar, **por CNPJ**, o mesmo que ela escreve à mão:
```
<CNPJ> contas a pagar até <data>
  Cheques · INSS · FGTS · Vale · Rescisão · Boletos · Claro...   (por tipo de conta)
  Total
Saldo (por conta) + antecipação de maquininha, se houver
Ação: enviar Pix para este CNPJ (e quanto) · ou "não é necessário enviar Pix"
```
Tipos de conta na DevMaster (prefixo do título; interpretação a confirmar): VAL = vale · IMP = INSS/FGTS e impostos · CHE = cheque · BAN = boleto · DEM = rescisão · INT = telefone/internet · SAL = salário · TAR = tarifa · EMP = empréstimo · CMS = comissão · KM = quilometragem.
Atenção: a orientação manual inclui títulos antigos ainda abertos (ex.: cheque de 2025) e pode deixar de fora salário e tarifa. O cérebro precisa decidir isso por regra, não por escolha do dia.

## Onde está no código hoje e o que falta
- **Já existe:** Direcionar sugere o CNPJ por regra (`domain/direcionar-pix.js`, regra 7: ordena por *contas de hoje e amanhã − disponível*); `contextoCnpj` em `pages/DirecionarPix.js` monta contas e saldo por CNPJ; `posicaoEm` em `domain/saldos-contas.js` calcula saldo e disponível; Pix para fornecedor e para prestador da família viram pagamento e repasse sozinhos.
- **v1 feita (18/11/2026, v0.21.28):** `domain/cerebro-financeiro.js` (função `orientacaoDoDia`, testada com dados inventados em `scripts/testar-cerebro-financeiro.mjs`, 14 verificações) e o bloco **Avisos do dia** no Direcionar. Só sugere. Cobre: cobertura dia a dia por CNPJ (com as atrasadas, até o fim do mês que vem), urgência de 1 a 2 dias, conta com pouco negativo (até R$ 2.000,00), Rotativo + Sicredi como grupo, ordem de liquidar no 34, amortização do Rotativo e aviso de saldo desatualizado. Rodada com os saldos e contas reais de 18/11: Axis urgente, Pix para o 34, amortizar o Rotativo com o saldo do Sicredi, 46 e 59 só em observação para o começo de dezembro (igual à orientação manual).
- **Falta** (próximas versões): usar o recebimento médio do Contas a receber (a DevMaster junta o recebido em um CNPJ só, falta dividir por CNPJ); colchão mínimo (valor ainda não definido); escolher a conta de pagamento dentro do CNPJ; aviso para os outros destinatários além de quem abre o Direcionar; refazer sozinho todo dia; gerar a orientação no formato da seção anterior.

---
Índice: [README](README.md) · [01 Desenho e fontes](01-desenho-e-fontes.md) · [02 Regras de orientação](02-regras-de-orientacao.md) · [03 Contas, caixas e bancos](03-contas-caixas-e-bancos.md) · [04 Pessoas e prestadores](04-pessoas-prestadores-e-quem-faz.md) · [05 Dados e qualidade](05-dados-e-qualidade.md) · [06 Perguntas e respostas](06-perguntas-e-respostas.md)
