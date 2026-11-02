# Setor Tecnologia e padrão visual

Resumo para ler primeiro. Para o detalhe: `decisoes.md` (o que o Marcus decidiu, 153 itens), `pendencias.md` (o que está aberto, 22 itens). "(a confirmar)" = falta confirmar com o Marcus.

## 1. O que o setor faz
Telas, regras, servidor, padrão visual e configurador geral do sistema.

```
Pedidos de todos os setores
      │
      ▼
Tecnologia e padrão visual
      │
      ▼
Todos
```

## 2. Quem
| Quem | Papel |
|---|---|
| Marcus (Leonardo e devs levam para produção) | Líder do setor |
| — | Não é um setor da planilha do RH |

## 3. Regras que valem
| # | Regra |
|---|---|
| 1 | Um servidor só, na porta 3000; só o Marcus liga. |
| 2 | Antes de subir: npm run conferir. |
| 3 | Padrão visual travado por código (hook, CI e fotos de referência). |
| 4 | Mudança de visual só pelas peças (padrao.js, padrao-fin.js). |

## 4. Onde ficam as coisas
| O quê | Onde |
|---|---|
| Avisos | `/diretoria/avisos` |
| Padrão visual | `/diretoria/padrao-visual` |
| Versões | `/diretoria/versoes` |
| Mapa do sistema | `/diretoria/mapa-do-sistema` |
| Padrão visual | `docs/design/PADRAO-VISUAL.md` |
| Guia de escrita e fontes | `docs/design/GUIA-DE-ESCRITA-E-TIPOGRAFIA.md` |
| Como o sistema é montado | `docs/ARQUITETURA.md` |
| Como ler os nomes dos arquivos | `docs/COMO-LER-OS-NOMES.md` |
| Visual e design system | `docs/ideias/visual-e-design-system.md` |
| Substituir o admin antigo | `docs/ideias/substituir-o-admin-antigo.md` |
| Integração com os outros setores | `docs/negocio/INTEGRACAO-ENTRE-SETORES.md` |

Código das telas: `pages/ConfigAvisos.js`, `pages/PadraoVisual.js`, `pages/Versoes.js`, `pages/MapaSistema.js`.

## 5. Em aberto (principais)
- Visual novo (Raycast + dourado): alinhar as peças antes de trocar.
- Servidor, login, backup e nuvem com o Leonardo.
- Lista completa: `pendencias.md` desta pasta (22 itens, a revisar com o Marcus).

## 6. Regra de trabalho
Mudou uma regra? Atualize (1) o sistema, (2) `decisoes.md` desta pasta e o diário geral, no mesmo dia, (3) o painel: `node scripts/gerar-painel-documentos.mjs`.
