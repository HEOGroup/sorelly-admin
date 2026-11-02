# Setor Agendamento

Resumo para ler primeiro. Para o detalhe: `decisoes.md` (o que o Marcus decidiu, 7 itens), `pendencias.md` (o que está aberto, 4 itens) e `pessoas.local.md` (ficha de cada pessoa, fora do Git). "(a confirmar)" = falta confirmar com o Marcus.

## 1. O que o setor faz
Recebe os kits e o dinheiro das representantes, confirma se as condicionais voltaram assinadas, marca o dia das revendedoras que vêm à empresa e gera a listagem do atendimento interno. Acompanha previstos x realizados e as metas com bônus.

```
Representantes (kits e dinheiro); Kits novos (marcar o dia); revendedora que vem à empresa
      │
      ▼
Agendamento
      │
      ▼
Atendimento interno (listagem); Financeiro (dinheiro com confirmação dupla); Condicionais
```

## 2. Quem
| Quem | Papel |
|---|---|
| Ana Maria (gerencia: diretoria e quem estiver marcado) | Líder do setor |
| Ana S., Mariana | Assistente administrativo III (2) |
| Tamara | Assistente administrativo II (1) |

## 3. Regras que valem
| # | Regra |
|---|---|
| 1 | Semanas do painel são do calendário (segunda a domingo). |
| 2 | Virada do mês automática. |
| 3 | Remarcação sempre com quem autorizou (Marcus, Nickolas, Lucas ou Ana Maria). |
| 4 | Bônus das metas vence dia 15 do mês seguinte (Financeiro → Comissões). |
| 5 | Pessoas com nome parecido são pessoas diferentes; somar só por "grupo". |
| 6 | Ana Maria (Agendamento) não é Anamaria (mãe do Marcus). |
| 7 | Cor do setor: roxo. |

## 4. Onde ficam as coisas
| O quê | Onde |
|---|---|
| Painel | `/agendamento/painel` |
| Revendedoras | `/agendamento/revendedoras` |
| Representantes | `/agendamento/representantes` |
| Atividades | `/agendamento/atividades` |
| Análises | `/agendamento/analises` |
| Abertura do mês | `/agendamento/abertura` |
| Configurador | `/agendamento/configurador` |
| Revendedoras e previsão | `docs/negocio/REVENDEDORAS-E-PREVISAO.md` |
| Média de vendas | `docs/negocio/MEDIA-DE-VENDAS.md` |
| Pessoas (dados reais) | `docs/setores/agendamento/pessoas.local.md` (só neste PC) |
| Integração com os outros setores | `docs/negocio/INTEGRACAO-ENTRE-SETORES.md` |

Código das telas: `pages/AgendamentoPainel.js`, `pages/AgendamentoRevendedoras.js`, `pages/Agendamento.js`, `pages/AgendamentoAtividades.js`, `pages/AgendamentoAnalises.js`.

## 5. Em aberto (principais)
- Cotas por representante e saldos ainda são de demonstração.
- Dúvida do dia 28/10 (1.685 x 1.652) em aberto.
- Lista completa: `pendencias.md` desta pasta (4 itens, a revisar com o Marcus).

## 6. Regra de trabalho
Mudou uma regra? Atualize (1) o sistema, (2) `decisoes.md` desta pasta e o diário geral, no mesmo dia, (3) o painel: `node scripts/gerar-painel-documentos.mjs`.

## Como o setor se organiza (Marcus, 02/11/2026)
- **Tamara:** acertos internos em geral.
- **Ana Maria:** revendedoras das representantes. Recebe a ordem de redistribuição quando uma representante sai (o RH marca a saída).
- **Mariana:** ajuda a Ana Maria e também pode ajudar a Tamara.
- Qualquer uma pode fazer qualquer coisa: é só como elas se organizaram. A permissão fica aberta ao setor todo.
