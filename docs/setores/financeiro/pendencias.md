# Financeiro: pendências

Revisado em 02/11/2026 (conferido no código e no diário). Item resolvido sai daqui e vai para `decisoes.md`. Texto completo de cada item: diário geral (`docs/DECISOES.md`), na linha indicada.

## 1. Precisa de resposta do Marcus (14)

| # | Pendência | Quem decide | Observação |
|---|---|---|---|
| 1 | 08/10 e 13/10: o admin antigo difere dos números que o Marcus passou (291 acertos / R$ 207.855,36 e 526 / R$ 426.110,24). Qual vale? | Marcus | Diário linha 276 (21/10). |
| 2 | Fiscal: "Filial Hess & Oliveira" tem R$ 3,7 mi em vendas sem notas e parece duplicada. É duplicada? Contas de nov/dez repetem outubro. | Marcus | Diário linha 369 (16/10). |
| 3 | Combustível do tio João (Encomendas): onde ele é lançado nas contas? | Marcus | Diário linha 600 (20/10). |
| 4 | Análise de custos: falta a sala da Serenity (CNPJ 59). A da Axis (67) já foi passada. | Marcus | Diário linha 604 (20/10). |
| 5 | Comissões por funcionário: quais setores têm meta, o que é "bônus de horas extras" e o que mostrar no detalhe. | Marcus | Diário linha 612 (20/10). |
| 6 | Impostos: hoje só DAS, ICMS e taxas. O Marcus disse que falta imposto. Quais? | Marcus | Diário linha 612 (20/10). INSS e FGTS estão em Encargos da folha. |
| 7 | Mapa de metas e bônus de todos os setores (quem ganha, por quê, quanto). | Marcus | Diário linha 681 (20/10). Cadastro, Inadimplência, Link e Agendamento já têm meta. |
| 8 | Pix para o Marcus e a família (Higor, Greyce, 68 Gang, a mãe) = retirada dos sócios. Onde lançar? | Marcus | Diário linha 706 (21/10). |
| 9 | Dívida de prestador: mandar um PDF de orçamento de exemplo para o sistema aprender a ler. | Marcus | Diário linha 738 (21/10). |
| 10 | Valor pago diferente do valor da conta: quita quando juros ou desconto explicam a diferença; senão fica parcial. Está certo? | Marcus | Diário linha 799 (22/10). |
| 11 | Direcionar Pix abre o Financeiro. O sistema inteiro deve abrir nela para o Lucas e a Nayale? | Marcus | Diário linha 919 (23/10). |
| 12 | Acertos do dia (quantidade): só o valor do faturamento ficou automático. De onde vem a quantidade? | Marcus | Diário linha 1205 (27/10). |
| 13 | Inadimplência × roubo (kit fechado pelo valor total, com código do funcionário): onde aparece o código? | Marcus | Diário linha 1331 (28/10). Sem tela ainda. |
| 14 | Faturamento: qual é a regra do relatório de notas fiscais e qual contagem de revendedoras vale. O robô das 10h está desligado até isso. | Marcus | Diário linha 1411 (29/10). |

## 2. Falta fazer no sistema (8)

| # | Pendência | Quem decide | Observação |
|---|---|---|---|
| 15 | Login real, backup diário e registro de quem fez o quê. | Leonardo | Diário linha 41 (29/10). |
| 16 | Fiscal: puxar as notas de entrada e saída e as contas por mês do admin antigo. Último dado fiscal: 24/10. | Marcus | Diário linha 41 (29/10). |
| 17 | Fechamento do mês (saldo de fim de mês, reabrir mês): conferir se o que existe cobre o admin antigo. | Marcus | Diário linha 41 (29/10). |
| 18 | Importar os pagamentos das abas de negociação: Office Graf, Point, Ellos, Art Ello, Mega Sul e Pontual (depois de 20/10). | Marcus | Diário linha 1400 (28/10). Ver `docs/negocio/FLUXO-DE-PAGAMENTOS.md`. |
| 19 | Pontual: falta a aba Conferência ERP (relatório relFin009, boletos sem baixa ou com valor diferente). | Marcus | Diário linha 656 (20/10). |
| 20 | Pedido em partes: ligar a forma e o valor que a atendente lança no Atendimento interno. | Marcus | Diário linha 1072 (26/10). |
| 21 | Controle de pagamentos: prestador da família sem destino não abre (só leitura). | Marcus | Diário linha 1047 (26/10). |
| 22 | Cores e leitura rápida (como em Direcionar Pix e Caixa) em Pix representantes, Comissões e Controle de pagamentos. | Marcus | Diário linha 933 (24/10). |

Também em aberto, com outro setor: R$ 150,00 do dia 01/10 contra a tela da DevMaster (diário linha 1408) e a diferença salarial da Nayale em agosto e setembro (diário linha 649, conferir com o RH).

## 3. O que saiu da lista na revisão de 02/11/2026 (76)

| Motivo | Quantos | Itens da lista antiga |
|---|---|---|
| Já feito (a tela ou o código existe) | 19 | Previsão de caixa, Previsão dos próximos meses, Fiscal (painel), Créditos bancários (RH → Contratos), Regras do Pix, Negociações da Pontual, Meta do Link de pagamento, Sócios no Financeiro familiar, Limite e calendário de fornecedores, Metas mensais, Cobrança em Receber e Estoque em Saldos, Revendedoras de 20 a 27/10, Carregar de 27/10, Resultado do mês, leitura da DevMaster, Meta padrão 99%, contas pagas e faturamento no servidor |
| Era decisão, não pendência | 39 | Regras de Contas a pagar, Análise de custos, layout do Direcionar, Faturamento como referência, fonte Inter 13 px e outros registros do que foi feito |
| Desatualizado | 5 | Saldos da Amanda e da 68 Gang em 21/10 (depois corrigidos), R$ 7.800 do Pix Itaú Black (Financeiro familiar puxado de novo e igual em 29/10), reiniciar o servidor (27/10) |
| Era de outro setor e já decidido | 13 | Kits novos (3), Encomendas e reposições (3), Representantes (3), Escala 42h (RH), Contratos de terceiros (RH), Plano 45/60 (Agendamento), Meta do Cadastro |
