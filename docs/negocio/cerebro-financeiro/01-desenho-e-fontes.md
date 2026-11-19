# 01 · Desenho do setor e fontes de dados

## Desenho do setor

```
ENTRADA                          CAMINHO                         SAÍDA
Revendedora paga  ──► Direcionar (Lucas) ──► CNPJ 34 / 46 / 59 / 67 / H&O ──► Contas a pagar
 (Pix, link, cartão,        │                        │                        (DevMaster, por CNPJ)
  dinheiro, acerto-loja)    │                        └─► contas bancárias do CNPJ
                            │
                            └─► PIX DIRETO (não passa pela conta da empresa):
                                fornecedor · prestador · representante · sócio
                                (viram pagamento do fornecedor ou repasse que abate a dívida)
```

| Bloco | Contas (nomes no sistema, sem valores) |
|---|---|
| 34 · Sorelly Atacadista | Sicredi 34 (conta) + **Rotativo Sicredi 34** (juntos), Safra 34, Unicred 34, Itaú Empresas 34, Caixa 34, aplicações |
| 46 · Mayz (Sorelly Comércio) | Sicredi 46, Stone 46, Safra 46, Bradesco 46, Caixa 46, Unicred 46 |
| 59 · Serenity | Sicredi, Safra (e conta garantida), Itaú 59 (e conta garantida), Bradesco, Caixa 59, aplicação |
| 67 · Axis | Sicredi Axis, Itaú Axis |
| H&O | Sicredi H&O App |
| Itaú Marco PJ | Conta PF usada pela empresa; bloco separado; vai deixar de ser usada |
| Dinheiro | Dinheiro Sorelly e Caixa Seguro |
| Bloqueado | Retido Safra 34 e 46 (a receber; não conta como saldo) |
| Sócios e família | Contas pessoais dos sócios (Financeiro familiar): contas da casa, pró-labore, prestadores particulares |

Quem fala com quem: Lucas direciona o Pix; a sócia do caixa dá a orientação do dia por CNPJ; a Nayale lança saldos e pagamentos; a DevMaster guarda contas a pagar e baixas.

## As fontes de dados (cada uma responde uma coisa)
| Pergunta | Fonte | Observação |
|---|---|---|
| Quanto tenho em cada conta? | Saldos das contas (lançados pela equipe do financeiro **no fim de cada dia, por volta das 17h**) | Só vale o saldo do dia que foi lançado. A DevMaster tem saldo zero em todas as contas |
| O que vence, por CNPJ e por dia? | DevMaster, contas a pagar (`dmabe`) | Filial 01 = 34 · 02 = 46 · 03 = 59 · 05 = 67 · 04 = "por fora" |
| Quanto entrou de verdade? | DevMaster, baixas de contas a receber (`dmabf`, tipo REC) | É o dinheiro **efetivamente recebido**. É o que vale como faturamento do dia. A DevMaster junta tudo em um CNPJ só |
| Quanto vai entrar? | Tela Faturamento (ligada ao Contas a receber) | Previsão; a decisão usa o recebido real |

Média de entrada (out e nov/2026, todos os CNPJs juntos): cerca de R$ 62 a 68 mil por dia útil; nos 5 primeiros dias úteis do mês só R$ 34 a 48 mil por dia.

---
Índice: [README](README.md) · [01 Desenho e fontes](01-desenho-e-fontes.md) · [02 Regras de orientação](02-regras-de-orientacao.md) · [03 Contas, caixas e bancos](03-contas-caixas-e-bancos.md) · [04 Pessoas e prestadores](04-pessoas-prestadores-e-quem-faz.md) · [05 Dados e qualidade](05-dados-e-qualidade.md) · [06 Perguntas e respostas](06-perguntas-e-respostas.md)
