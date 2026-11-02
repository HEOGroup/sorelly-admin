# Setor Cadastro de revendedoras (com Kits novos e Indicação)

Resumo para ler primeiro. Para o detalhe: `decisoes.md` (o que o Marcus decidiu, 31 itens), `pendencias.md` (o que está aberto, 5 itens) e `pessoas.local.md` (ficha de cada pessoa, fora do Git). "(a confirmar)" = falta confirmar com o Marcus.

## 1. O que o setor faz
Recebe os leads, aprova cadastros, entrega o kit novo (pela representante ou pelo agendamento), cuida das indicações e das avaliações das representantes.

```
Marketing (leads)
      │
      ▼
Cadastro de revendedoras
      │
      ▼
Representantes ou Agendamento (kit novo)
```

## 2. Quem
| Quem | Papel |
|---|---|
| Nickolas (Michele em Kits novos e Indicação) | Líder do setor |
| Camilly | Analista administrativo I (1) |
| Thalyanny | Assistente administrativo (1) |
| Michele | Assistente administrativo III (1) |

## 3. Regras que valem
| # | Regra |
|---|---|
| 1 | Lead e campanha entram à mão (sem ligação com Kommo nem Meta ainda). |
| 2 | Só a diretoria decide a aprovação. |
| 3 | Kits novos vê só a tela de Kit novo, com o valor do kit. |

## 4. Onde ficam as coisas
| O quê | Onde |
|---|---|
| Aprovação de cadastros | `/cadastro-de-revendedoras/aprovacao-de-cadastros` |
| Base de revendedoras | `/cadastro-de-revendedoras/revendedoras` |
| Kits novos | `/cadastro-de-revendedoras/revendedoras-novas` |
| Pendências | `/cadastro-de-revendedoras/kits-novos-pendencias` |
| Consolidado | `/cadastro-de-revendedoras/kits-novos-consolidado` |
| Regras | `/cadastro-de-revendedoras/kits-novos-regras` |
| Desempenho do cadastro | `/cadastro-de-revendedoras/desempenho-do-cadastro` |
| Indicações | `/cadastro-de-revendedoras/indicacoes` |
| Avaliações | `/cadastro-de-revendedoras/avaliacoes` |
| Representantes | `/cadastro-de-revendedoras/representantes-do-setor` |
| Mensagens prontas | `/cadastro-de-revendedoras/mensagens-prontas` |
| Análise do registro de contatos | `docs/negocio/REGISTRO-DE-CONTATOS-ANALISE.md` |
| Pessoas (dados reais) | `docs/setores/cadastro-de-revendedoras/pessoas.local.md` (só neste PC) |
| Integração com os outros setores | `docs/negocio/INTEGRACAO-ENTRE-SETORES.md` |

Código das telas: `pages/AprovacaoCadastros.js`, `pages/BaseRevendedoras.js`, `pages/DesempenhoCadastro.js`, `pages/Indicacoes.js`, `pages/Avaliacoes.js`, `pages/MensagensProntas.js`.

## 5. Em aberto (principais)
- Suposições a confirmar: 1.000 moedas por kit entregue; validade de 90 dias.
- Ligação com o Kommo e com a Meta.
- Lista completa: `pendencias.md` desta pasta (5 itens, a revisar com o Marcus).

## 6. Regra de trabalho
Mudou uma regra? Atualize (1) o sistema, (2) `decisoes.md` desta pasta e o diário geral, no mesmo dia, (3) o painel: `node scripts/gerar-painel-documentos.mjs`.
