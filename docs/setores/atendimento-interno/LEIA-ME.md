# Setor Atendimento interno (Atendimento Sorelly)

Resumo para ler primeiro. Para o detalhe: `decisoes.md` (o que o Marcus decidiu, 27 itens), `pendencias.md` (o que está aberto, 9 itens) e `pessoas.local.md` (ficha de cada pessoa, fora do Git). "(a confirmar)" = falta confirmar com o Marcus.

## 1. O que o setor faz
Atende a revendedora que vem à empresa: bipa o acerto (cerca de 20 minutos), monta o kit novo com ela e mede o tempo de cada etapa. A revendedora avalia quem bipou e quem atendeu.

```
Agendamento (listagem); Bipagem
      │
      ▼
Atendimento interno
      │
      ▼
Financeiro (condicional para faturar)
```

## 2. Quem
| Quem | Papel |
|---|---|
| A definir (Leci atende as clientes na empresa) | Líder do setor |
| Renata, Sthefany, Nataly | Assistente administrativo (3) |
| Edna, Natasha | Analista administrativo II (2) |
| Kawany, Natalia | Assistente administrativo II (2) |
| Deysiane | Supervisora administrativo (1) |
| Leci | Analista administrativo I (1) |

## 3. Regras que valem
| # | Regra |
|---|---|
| 1 | Bipagem interna: R$ 10 por atendimento, menos R$ 5 por contagem errada, bônus pela nota (provisório). |
| 2 | Quem atende muda sempre: quem quiser atender entra no comissionamento. |

## 4. Onde ficam as coisas
| O quê | Onde |
|---|---|
| Revendedoras | `/atendimento-interno/revendedoras` |
| Listagens | `/atendimento-interno/listagens` |
| Atendimento Sorelly | `/atendimento-interno/calculadora` |
| Consolidado Sorelly | `/financeiro/atendimento-interno-consolidado` |
| Fluxo da empresa | `docs/negocio/FLUXO-DA-EMPRESA.md` |
| Pessoas (dados reais) | `docs/setores/atendimento-interno/pessoas.local.md` (só neste PC) |
| Integração com os outros setores | `docs/negocio/INTEGRACAO-ENTRE-SETORES.md` |

Código das telas: `pages/RevendedorasInternas.js`, `pages/AtendimentoInternoListagens.js`, `pages/AtendimentoInternoCalculadora.js`, `pages/ConsolidadoInterno.js`.

## 5. Em aberto (principais)
- Valores de bonificação de quem atende (a confirmar).
- Etapas 2 a 5 da tela Atendimento Sorelly.
- CNPJ da H&O pendente nessa tela.
- Lista completa: `pendencias.md` desta pasta (9 itens, a revisar com o Marcus).

## 6. Regra de trabalho
Mudou uma regra? Atualize (1) o sistema, (2) `decisoes.md` desta pasta e o diário geral, no mesmo dia, (3) o painel: `node scripts/gerar-painel-documentos.mjs`.
