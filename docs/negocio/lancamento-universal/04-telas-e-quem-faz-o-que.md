# 04 · Telas e quem faz o que

## Papel de cada tela (alvo)
| Tela | Papel | Muda? |
|---|---|---|
| **Direcionar** | O Lucas diz ao Atendimento interno para qual conta o pagamento vai. Não é lançamento de fornecedor | Não |
| **Contas a receber** | Recebimentos lidos da DevMaster **e** lançamento do financeiro (Pix antecipado, recebimento + pagamento). Ganha a coluna **Falta comprovante** | **Sim** |
| **Contas a pagar** | Títulos da DevMaster, com o cruzamento dos pagamentos já feitos. Mostra toda saída de conta da empresa | Já alterado em 20/11 |
| **Pagamentos a fornecedores** | PDF e comprovantes do fornecedor. Quando fecha o pagamento de um fornecedor, tem o botão **Baixar arquivo** (D-14). O Lucas **deixa de lançar** aqui | **Sim** |
| **Resumo geral (pagamentos)** | Só olhar. Fica como tela separada | Não |
| **Financeiro familiar** | Contas, faturas e rateios da família. Recebe o que a empresa pagou pela família | **Sim** (receber o direcionamento) |
| **Contas bancárias** | Saldos. Revisar depois se o "pagamentos do dia" digitado continua | A definir |

## Quem lança
- O financeiro: Marcus, Anamaria (mãe), Lucas, e quem tiver a autorização. O Atendimento interno segue o fluxo próprio (D-01).
- Quem esquece de lançar: se outra pessoa lançar, fica **pendente** até anexar o comprovante.

## O que já existe hoje (20/11/2026)
- Contas a pagar no visual novo, com cruzamento exato da Pontual (`domain/casar-pagos.js`).
- Lançamento de pagamentos (fornecedores) ainda tem o botão "Lançar pagamento".
- Contas a receber lê a DevMaster e tem comprovantes do Atendimento.
