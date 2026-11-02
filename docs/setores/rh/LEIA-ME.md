# Setor RH (Recursos Humanos)

Resumo para ler primeiro. Para o detalhe: `decisoes.md` (o que o Marcus decidiu, 33 itens), `pendencias.md` (o que está aberto, 2 itens) e `pessoas.local.md` (ficha de cada pessoa, fora do Git). "(a confirmar)" = falta confirmar com o Marcus.

## 1. O que o setor faz
Cuida do quadro de pessoas, presença diária, horas extras, advertências, experiência, contratos e dos acessos e autorizações de cada setor.

```
Todos os setores (pessoas, presença)
      │
      ▼
RH
      │
      ▼
Todos (acessos por setor); Financeiro (comissões e folha)
```

## 2. Quem
| Quem | Papel |
|---|---|
| Maria Claudia | Líder do setor |
| Maria F. | Supervisora de rh (1) |
| Ana F. | Assistente administrativo (1) |

## 3. Regras que valem
| # | Regra |
|---|---|
| 1 | Acesso é por setor, nunca por pessoa. |
| 2 | CPF e salário: só a diretoria (e quem tem acesso total). |
| 3 | Dados reais só em arquivos .local (repositório público). |
| 4 | O sistema novo é a fonte dos horários (29/10/2026). |

## 4. Onde ficam as coisas
| O quê | Onde |
|---|---|
| Visão geral | `/recursos-humanos/rh` |
| Presença diária | `/recursos-humanos/rh-presenca` |
| Relatório diário | `/recursos-humanos/rh-relatorio` |
| Colaboradores | `/recursos-humanos/rh-colaboradores` |
| Controle de experiência | `/recursos-humanos/rh-experiencia` |
| Advertências | `/recursos-humanos/rh-advertencias` |
| Horas extras | `/recursos-humanos/rh-horas-extras` |
| Solicitações | `/recursos-humanos/rh-solicitacoes` |
| Negociações | `/recursos-humanos/rh-negociacoes` |
| Escala 42h | `/recursos-humanos/rh-escala-42h` |
| Representantes | `/recursos-humanos/rh-contratos-representantes` |
| Funcionários (CLT) | `/recursos-humanos/rh-contratos-funcionarios` |
| Terceiros | `/recursos-humanos/rh-contratos-terceiros` |
| Crédito bancário | `/recursos-humanos/rh-contratos-credito` |
| Aluguéis | `/recursos-humanos/rh-contratos-alugueis` |
| Consórcios | `/recursos-humanos/rh-contratos-consorcios` |
| Particulares do Marcus | `/recursos-humanos/rh-contratos-marcus` |
| Modelos de contrato | `/recursos-humanos/rh-contratos-modelos` |
| Funcionários e representantes | `/recursos-humanos/funcionarios-e-representantes` |
| Equipes | `/recursos-humanos/equipes` |
| Acessos e autorizações | `/recursos-humanos/acessos-por-setor` |
| Configurador | `/recursos-humanos/rh-configurador` |
| pessoas | `docs/setores/rh/pessoas.local.md` |
| Acessos e contas (28/10) | `docs/negocio/ACESSOS-E-CONTAS-28-10-2026.md` |
| Fluxo da empresa | `docs/negocio/FLUXO-DA-EMPRESA.md` |
| Pessoas (dados reais) | `docs/setores/rh/pessoas.local.md` (só neste PC) |
| Integração com os outros setores | `docs/negocio/INTEGRACAO-ENTRE-SETORES.md` |

Código das telas: `pages/RH.js`, `pages/RHSolicitacoes.js`, `pages/RHEscala42.js`, `pages/RHContratos.js`, `pages/Pessoas.js`, `pages/Equipes.js`, `pages/AcessosAutorizacoes.js`.

## 5. Em aberto (principais)
- Faltam 23 logins (Produção 16 + 7).
- Trazer os dados reais do admin antigo (presença, advertências, contratos).
- Banco de cada funcionário não existe nos dados.
- Lista completa: `pendencias.md` desta pasta (2 itens, a revisar com o Marcus).

## 6. Regra de trabalho
Mudou uma regra? Atualize (1) o sistema, (2) `decisoes.md` desta pasta e o diário geral, no mesmo dia, (3) o painel: `node scripts/gerar-painel-documentos.mjs`.
