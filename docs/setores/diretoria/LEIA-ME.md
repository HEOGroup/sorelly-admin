# Setor Diretoria

Resumo para ler primeiro. Para o detalhe: `decisoes.md` (o que o Marcus decidiu, 14 itens), `pendencias.md` (o que está aberto, 0 itens) e `pessoas.local.md` (ficha de cada pessoa, fora do Git). "(a confirmar)" = falta confirmar com o Marcus.

## 1. O que o setor faz
Vê tudo, decide, define o preço das peças. Tem o Fluxo da empresa e (em breve) Comissões e desempenho.

```
Todos
      │
      ▼
Diretoria
      │
      ▼
Todos
```

## 2. Quem
| Quem | Papel |
|---|---|
| Marcus, Nickolas e Lucas | Líder do setor |
| Nickolas | Supervisor administrativo (1) |
| Nicole | Supervisora administrativo (1) |
| Priscila | Analista administrativo I (1) |

## 3. Regras que valem
| # | Regra |
|---|---|
| 1 | Acesso total e fixo: Marcus, Anamaria e Lucas. |
| 2 | Área pessoal do Marcus fica no admin por enquanto; depois vira sistema separado (02/11/2026). |

## 4. Onde ficam as coisas
| O quê | Onde |
|---|---|
| App Sorelly | Em breve |
| Projetos (dev) | Em breve |
| Fluxo da empresa | `/diretoria/fluxo-da-empresa` |
| Visão geral | `/visao-geral` |
| Fluxo da empresa | `docs/negocio/FLUXO-DA-EMPRESA.md` |
| Contexto geral da Sorelly | `docs/negocio/SORELLY-CONTEXTO.md` |
| Integração entre setores | `docs/negocio/INTEGRACAO-ENTRE-SETORES.md` |
| Índice dos documentos | `docs/ideias/README.md` |
| Pessoas (dados reais) | `docs/setores/diretoria/pessoas.local.md` (só neste PC) |
| Integração com os outros setores | `docs/negocio/INTEGRACAO-ENTRE-SETORES.md` |

Código das telas: `pages/FluxoEmpresa.js`, `pages/VisaoGeral.js`.

## 5. Em aberto (principais)
- Números ao vivo no fluxograma.
- Aba Comissões e desempenho.
- Lista completa: `pendencias.md` desta pasta (0 itens, a revisar com o Marcus).

## 6. Regra de trabalho
Mudou uma regra? Atualize (1) o sistema, (2) `decisoes.md` desta pasta e o diário geral, no mesmo dia, (3) o painel: `node scripts/gerar-painel-documentos.mjs`.
