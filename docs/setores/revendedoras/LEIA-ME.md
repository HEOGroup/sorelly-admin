# Setor Revendedoras (base de todos os setores)

Resumo para ler primeiro. Para o detalhe: `decisoes.md` (o que o Marcus decidiu, 68 itens), `pendencias.md` (o que está aberto, 13 itens). "(a confirmar)" = falta confirmar com o Marcus.

## 1. O que o setor faz
Lista das revendedoras lida da DevMaster (só leitura): só as que têm condicional aberto e previsão em 2026. É a base que todos os setores usam.

```
DevMaster API 2 (leitura)
      │
      ▼
Revendedoras
      │
      ▼
Todos os setores
```

## 2. Quem
| Quem | Papel |
|---|---|
| Diretoria (por ora só a diretoria acessa) | Líder do setor |
| — | Não é um setor da planilha do RH |

## 3. Regras que valem
| # | Regra |
|---|---|
| 1 | Representante = vendedor do kit principal. Vendedor 04 (Expositor) e 91 (Encomendas) não são representantes. |
| 2 | Só leitura da DevMaster: os POST gravam no ERP de verdade. |

## 4. Onde ficam as coisas
| O quê | Onde |
|---|---|
| Cadastro | `/revendedoras/ativas` |
| Kits e vendas | `/revendedoras/kits-e-vendas` |
| Condicional | `/revendedoras/condicional` |
| Revendedoras e previsão | `docs/negocio/REVENDEDORAS-E-PREVISAO.md` |
| Integração com os outros setores | `docs/negocio/INTEGRACAO-ENTRE-SETORES.md` |

Código das telas: `pages/RevendedorasAtivas.js`, `pages/CondicionalModelo.js`.

## 5. Em aberto (principais)
- Etapa 2: situação, kits e vendas.
- Etapa 3: correção do tipo pela funcionária.
- Lista completa: `pendencias.md` desta pasta (13 itens, a revisar com o Marcus).

## 6. Regra de trabalho
Mudou uma regra? Atualize (1) o sistema, (2) `decisoes.md` desta pasta e o diário geral, no mesmo dia, (3) o painel: `node scripts/gerar-painel-documentos.mjs`.
