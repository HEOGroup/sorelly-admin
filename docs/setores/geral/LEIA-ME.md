# Setor Geral (decisões sem setor claro)

Resumo para ler primeiro. Para o detalhe: `decisoes.md` (o que o Marcus decidiu, 4 itens), `pendencias.md` (o que está aberto, 0 itens). "(a confirmar)" = falta confirmar com o Marcus.

## 1. O que o setor faz
Guarda as decisões que não se encaixaram em um setor só (preferências gerais do Marcus e do sistema).

```
—
      │
      ▼
Geral
      │
      ▼
—
```

## 2. Quem
| Quem | Papel |
|---|---|
| — | Líder do setor |
| — | Não é um setor da planilha do RH |

## 3. Regras que valem
| # | Regra |
|---|---|
| 1 | Se uma decisão daqui tem setor, mova para a pasta dele. |

## 4. Onde ficam as coisas
| O quê | Onde |
|---|---|
| Início | `/inicio` |
| Apps | `/apps` |
| Aulas do setor | `/aulas` |
| Plano de organização | `docs/PLANO-DE-ORGANIZACAO.md` |
| Integração com os outros setores | `docs/negocio/INTEGRACAO-ENTRE-SETORES.md` |

Código das telas: `pages/Inicio.js`, `pages/Apps.js`, `pages/Aulas.js`.

## 5. Em aberto (principais)
- (nada registrado)
- Lista completa: `pendencias.md` desta pasta (0 itens, a revisar com o Marcus).

## 6. Regra de trabalho
Mudou uma regra? Atualize (1) o sistema, (2) `decisoes.md` desta pasta e o diário geral, no mesmo dia, (3) o painel: `node scripts/gerar-painel-documentos.mjs`.
