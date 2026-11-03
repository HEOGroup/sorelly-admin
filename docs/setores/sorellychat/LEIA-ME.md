# Setor SorellyChat (comunicação interna)

Resumo para ler primeiro. Para o detalhe: `decisoes.md` (o que o Marcus decidiu, 75 itens), `pendencias.md` (o que está aberto, 10 itens). "(a confirmar)" = falta confirmar com o Marcus.

## 1. O que o setor faz
Chat interno da empresa: grupos por setor, chamados, melhorias e presença das colaboradoras.

```
Todos os setores
      │
      ▼
SorellyChat
      │
      ▼
Todos os setores
```

## 2. Quem
| Quem | Papel |
|---|---|
| Marcus (só ele cria grupos) | Líder do setor |
| — | Não é um setor da planilha do RH |

## 3. Regras que valem
| # | Regra |
|---|---|
| 1 | Só o Marcus cria grupos. |
| 2 | Horário de trabalho vem do cadastro do RH. |
| 3 | Presença no chat só para quem tem a autorização rh_presenca_chat. |

## 4. Onde ficam as coisas
| O quê | Onde |
|---|---|
| SorellyChat | `/whatssorelly` |
| Chamados | `/chamados` (o antigo `/melhorias` ainda abre) |
| Integração com os outros setores | `docs/negocio/INTEGRACAO-ENTRE-SETORES.md` |

Código das telas: `pages/WhatsSorelly.js`, `pages/Melhorias.js`.

## 5. Em aberto (principais)
- (nada registrado)
- Lista completa: `pendencias.md` desta pasta (10 itens, a revisar com o Marcus).

## 6. Regra de trabalho
Mudou uma regra? Atualize (1) o sistema, (2) `decisoes.md` desta pasta e o diário geral, no mesmo dia, (3) o painel: `node scripts/gerar-painel-documentos.mjs`.
