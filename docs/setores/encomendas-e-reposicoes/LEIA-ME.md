# Setor Encomendas e reposições

Resumo para ler primeiro. Para o detalhe: `decisoes.md` (o que o Marcus decidiu, 8 itens), `pendencias.md` (o que está aberto, 1 itens) e `pessoas.local.md` (ficha de cada pessoa, fora do Git). "(a confirmar)" = falta confirmar com o Marcus.

## 1. O que o setor faz
Separa peças pedidas pelo WhatsApp para revendedoras de representantes e internas. As reposições saem durante o mês (com o tio João) ou ficam separadas para o acerto.

```
Representantes e revendedoras internas (pedidos)
      │
      ▼
Encomendas e reposições
      │
      ▼
Revendedoras (pela Facilities)
```

## 2. Quem
| Quem | Papel |
|---|---|
| Agatha | Líder do setor |
| Agatha, Eduarda L., Elen | Assistente administrativo (3) |

## 3. Regras que valem
| # | Regra |
|---|---|
| 1 | Reposição não é oferecida às revendedoras por ora. |
| 2 | Dados reais só em encomendas.local.js. |

## 4. Onde ficam as coisas
| O quê | Onde |
|---|---|
| Funil de pedidos | `/encomendas-reposicoes/encomendas-e-reposicoes` |
| Ida na empresa | `/encomendas-reposicoes/ida-na-empresa` |
| Top 50 | `/encomendas-reposicoes/top-50` |
| Representantes | `/encomendas-reposicoes/reposicao-representantes` |
| Expositores | `/encomendas-reposicoes/expositores` |
| Regras e mensagens | `/encomendas-reposicoes/regras-e-mensagens-reposicao` |
| Encomendas e reposições | `docs/negocio/ENCOMENDAS-REPOSICOES.md` |
| Pessoas (dados reais) | `docs/setores/encomendas-e-reposicoes/pessoas.local.md` (só neste PC) |
| Integração com os outros setores | `docs/negocio/INTEGRACAO-ENTRE-SETORES.md` |

Código das telas: `pages/Encomendas.js`, `pages/EncomendasTelas.js`, `pages/ExpositoresModulo.js`.

## 5. Em aberto (principais)
- Listagens diárias, rotas de entrega e comissão do João.
- Lista completa: `pendencias.md` desta pasta (1 itens, a revisar com o Marcus).

## 6. Regra de trabalho
Mudou uma regra? Atualize (1) o sistema, (2) `decisoes.md` desta pasta e o diário geral, no mesmo dia, (3) o painel: `node scripts/gerar-painel-documentos.mjs`.
