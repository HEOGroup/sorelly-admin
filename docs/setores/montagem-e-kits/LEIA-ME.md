# Setor Montagem e Kits (Representantes & Kits)

Resumo para ler primeiro. Para o detalhe: `decisoes.md` (o que o Marcus decidiu, 126 itens), `pendencias.md` (o que está aberto, 36 itens) e `pessoas.local.md` (ficha de cada pessoa, fora do Git). "(a confirmar)" = falta confirmar com o Marcus.

## 1. O que o setor faz
Monta e bipa os kits (envio e retorno), cuida das condicionais e da produção. Montadoras e bipadoras usam os apps de celular.

```
Produção (peças); Condicionais; listagens das representantes e do agendamento
      │
      ▼
Montagem e Kits
      │
      ▼
Bipagem → Financeiro; Garantia/Trocas (peças de garantia); Inadimplência
```

## 2. Quem
| Quem | Papel |
|---|---|
| Deysiane (montagem, bipagem e produção); Majorry (condicionais) | Líder do setor |
| Amanda S., Leticia C., Solange, Jenifer, Katia, Maria A., Milenna, Rakiely, Audrieli, Gabrielly, Geisimara, Larissa, Paula, Tainara, Isadora | Assistente administrativo (15) |
| Cristiane, Fernanda, Crisbele, Eduarda L., Ivanete, Maria S., Sandra, Jordana, Kislieydi, Viviane | Auxiliar de produção (10) |
| Geovana, Pamela | Assistente administrativo III (2) |
| Maria M., Milene | Analista administrativo II (2) |
| Majorry | Assistente administrativo II (1) |

## 3. Regras que valem
| # | Regra |
|---|---|
| 1 | Montadora e bipadora nunca veem valores; bipadora nunca vê o valor esperado. |
| 2 | Kit novo não pega condicionais; acerto + kit sempre pega antes de montar. |
| 3 | Anel tem tamanho (nunca "aro"). |
| 4 | Leilão, Encomendas (91) e Expositor (04) não são acerto. |

## 4. Onde ficam as coisas
| O quê | Onde |
|---|---|
| Produção | `/representantes-kits/producao` |
| Listagens | `/representantes-kits/listagens` |
| Condicionais | `/representantes-kits/condicionais` |
| Calculadora de kits | `/representantes-kits/calculadora` |
| Análise de vendas | `/representantes-kits/vendas-vendas` |
| Preferências do kit | `/representantes-kits/preferencias-do-kit` |
| Pedir peças | `/representantes-kits/pedir-pecas` |
| Visão geral da bipagem | `/representantes-kits/visao-bipagem` |
| Meu desempenho | `/representantes-kits/meu-desempenho` |
| Consolidado | `/representantes-kits/consolidado` |
| Equipe e comissões | `/representantes-kits/equipe` |
| Registros | `/representantes-kits/registros` |
| Relatórios | `/representantes-kits/relatorios` |
| Regras da montagem | `/representantes-kits/regras` |
| Consolidado | `/financeiro/consolidado-representantes` |
| Controle de kits | `/representantes-kits/controle-de-kits` |
| Placar | `/representantes-kits/placar-representantes` |
| Comissões | `/financeiro/comissoes` |
| Pix representantes | `/representantes-kits/pix-representantes` |
| Inadimplência | `/financeiro/inadimplencia` |
| Compras de joias | `/representantes-kits/compras-joias-representantes` |
| Regras dos representantes | `/representantes-kits/regras-representantes` |
| Regras dos acertos | `/representantes-kits/regras-acertos` |
| Folders e informativos | `/representantes-kits/informativos` |
| Configurações | `/representantes-kits/configuracoes-representantes` |
| Kit perfeito | `docs/negocio/KIT-PERFEITO.md` |
| Condicional: termo e nota | `docs/negocio/CONDICIONAL-TERMO-E-NOTA.md` |
| Kit perfeito | `docs/ideias/kit-perfeito.md` |
| Pessoas (dados reais) | `docs/setores/montagem-e-kits/pessoas.local.md` (só neste PC) |
| Integração com os outros setores | `docs/negocio/INTEGRACAO-ENTRE-SETORES.md` |

Código das telas: `pages/Producao.js`, `pages/Painel.js`, `pages/Condicionais.js`, `pages/Calculadora.js`, `pages/Vendas.js`, `pages/PreferenciasKit.js`, `pages/PedirPecas.js`, `pages/VisaoBipagem.js`, `pages/MeuDesempenho.js`, `src/apps/kits-novos/pages/Consolidado.js`, `pages/Equipe.js`, `pages/Registros.js`, `pages/Relatorios.js`, `src/apps/kits-novos/pages/Regras.js`, `pages/ConsolidadoRepresentantes.js`, `pages/ControleKits.js`, `pages/PlacarRepresentantes.js`, `pages/Comissoes.js`, `pages/PixDireto.js`, `pages/Inadimplencia.js`, `pages/ComprasJoias.js`, `pages/RegrasRepresentantes.js`, `pages/RegrasAcertos.js`, `pages/Informativos.js`, `pages/ConfigRepresentantes.js`.

## 5. Em aberto (principais)
- Kit perfeito em construção.
- Campo de erro na bipagem de retorno.
- Valor por kit retornado bipado (a confirmar).
- Lista completa: `pendencias.md` desta pasta (36 itens, a revisar com o Marcus).

## 6. Regra de trabalho
Mudou uma regra? Atualize (1) o sistema, (2) `decisoes.md` desta pasta e o diário geral, no mesmo dia, (3) o painel: `node scripts/gerar-painel-documentos.mjs`.
