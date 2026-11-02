# Setor Financeiro

Resumo para ler primeiro. Para o detalhe: `decisoes.md` (o que o Marcus decidiu, 438 itens), `pendencias.md` (o que está aberto, 22 itens, revisado em 02/11/2026) e `pessoas.local.md` (ficha de cada pessoa, fora do Git). "(a confirmar)" = falta confirmar com o Marcus.

## 1. O que o setor faz
Fatura as condicionais, concilia pagamentos, controla contas a pagar e a receber, paga comissões e fornecedores, acompanha o resultado do mês. Desde 29/10/2026 a equipe usa só o sistema novo (o admin antigo virou consulta).

```
Bipagem e Atendimento interno (condicional para faturar); Agendamento (dinheiro com código); Compras (dados para pagar fornecedores)
      │
      ▼
Financeiro
      │
      ▼
Condicionais (devolve depois de faturar); comissões a todos os setores; Inadimplência (o que ficou em aberto)
```

## 2. Quem
| Quem | Papel |
|---|---|
| A definir (equipe: Nayale no financeiro, Bruna no faturamento, Amanda na inadimplência; Anamaria acompanha) | Líder do setor |
| Amanda G. | Assistente financeiro (1) |
| Bruna | Assistente administrativo IV (1) |
| Nayale | Supervisora financeiro (1) |
| Amanda C. | Assistente administrativo II (1) |

## 3. Regras que valem
| # | Regra |
|---|---|
| 1 | Padrão do Financeiro: filtros no topo, 32 px, R$ em todo valor, números à direita, faixa de totais, abas visíveis (`docs/design/PADRAO-VISUAL.md`). |
| 2 | Termos curtos nas telas: Dívida, Enviado, Falta, Quitada. |
| 3 | Cor do setor: azul. Verde entra, vermelho sai. |
| 4 | Acerto - loja = não pagou: vale o saldo em aberto. Funcionárias = grupo 0002 do cadastro da DevMaster. |
| 5 | Valores de comissão: só a diretoria e o financeiro veem. |

## 4. Onde ficam as coisas
| O quê | Onde |
|---|---|
| Direcionar | `/financeiro/direcionar-pix` |
| Contas das representantes | `/financeiro/pagamentos-contas-das-representantes` |
| Regras do Pix | `/financeiro/pagamentos-regras-do-pix` |
| Controle de pagamentos | `/financeiro/controle-de-pagamentos` |
| Resultado do mês | `/financeiro/resultado-do-mes` |
| Previsão de caixa | `/financeiro/previsao-de-caixa` |
| Contas bancárias | `/financeiro/caixa` |
| Chaves Pix | `/financeiro/chaves-pix-dos-bancos` |
| Regras do Pix | `/financeiro/chaves-pix-e-regras` |
| Dinheiro | `/financeiro/dinheiro` |
| Taxas e adquirentes | `/financeiro/adquirentes-e-taxas` |
| Análise de custos | `/financeiro/contas-a-pagar-empresa-e-familia` |
| Estoque Sorelly | `/financeiro/estoque-sorelly` |
| Contas a pagar | `/financeiro/contas-a-pagar` |
| Pagas por dia | `/financeiro/pagas-por-dia` |
| Geral | `/financeiro/pf-resumo` |
| Lançamento de pagamentos | `/financeiro/pf-lancamento` |
| Negociações | `/financeiro/pf-negociacoes` |
| Maquininha Banho | `/financeiro/pf-maquininha` |
| Cadastro | `/financeiro/pf-cadastro` |
| Representantes | `/financeiro/comissoes` |
| Visão geral dos funcionários | `/financeiro/comissoes-de-todos` |
| Agendamento | `/financeiro/comissoes-bonus-agendamento` |
| Bipagem | `/financeiro/comissoes-bipagem` |
| Montagem de kits | `/financeiro/comissoes-montagem` |
| Atendimento interno | `/financeiro/comissoes-atendimento-interno` |
| Link de pagamento | `/financeiro/comissoes-link-de-pagamento` |
| Datas de pagamento | `/financeiro/comissoes-datas-pagamento` |
| Contas a receber | `/financeiro/contas-a-receber` |
| Faturamento | `/financeiro/previsao-de-faturamento` |
| Consolidado interno | `/financeiro/atendimento-interno-consolidado` |
| Consolidado dos representantes | `/financeiro/consolidado-representantes` |
| Inadimplência dos representantes | `/financeiro/inadimplencia` |
| Inadimplência | `/financeiro/inadimplencia-financeira` |
| Visão geral | `/financeiro/cobranca-visao-geral` |
| Devendo | `/financeiro/cobranca-devendo` |
| Quitadas | `/financeiro/cobranca-quitadas` |
| Relatórios mensais | `/financeiro/cobranca-relatorios` |
| Funcionárias | `/financeiro/cobranca-funcionarias` |
| Regras | `/financeiro/cobranca-regras` |
| Configuração | `/financeiro/cobranca-configuracao` |
| Link de pagamento | `/financeiro/relatorio-de-links` |
| Painel e notas | `/financeiro/fiscal` |
| Limite de faturamento | `/financeiro/limite-de-faturamento` |
| CNPJs | `/financeiro/cnpjs` |
| Home da família | `/financeiro/ff-home` |
| Alertas | `/financeiro/ff-alertas` |
| Contas a pagar da família | `/financeiro/ff-contas-a-pagar` |
| Contas pagas da família | `/financeiro/ff-contas-pagas` |
| PIX revendedoras | `/financeiro/ff-pix-revendedoras` |
| Sócios | `/financeiro/ff-socios` |
| Cadastro de prestadores | `/financeiro/ff-prestadores` |
| Pró-labores | `/financeiro/ff-pro-labores` |
| Relatório | `/financeiro/ff-relatorio` |
| Histórico | `/financeiro/ff-historico` |
| Configurações | `/financeiro/ff-configuracoes` |
| Link de pagamento | `/link-de-pagamento` |
| Resultado do mês | `docs/negocio/RESULTADO-DO-MES.md` |
| Fluxo de pagamentos | `docs/negocio/FLUXO-DE-PAGAMENTOS.md` |
| Relatório de custos | `docs/negocio/RELATORIO-DE-CUSTOS.md` |
| Caixa do financeiro | `docs/negocio/CAIXA-FINANCEIRO.md` |
| Link de pagamento | `docs/negocio/LINK-DE-PAGAMENTO.md` |
| Regras do Pix | `docs/negocio/REGRAS-DE-PIX.md` |
| Faturamento diário | `docs/negocio/FATURAMENTO-DIARIO.md` |
| Jurídico e cobrança | `docs/negocio/JURIDICO-COBRANCA.md` |
| Tirar o financeiro da DevMaster | `docs/ideias/tirar-financeiro-da-devmaster.md` |
| Sistema completo: custos, markup e DRE | `docs/ideias/sistema-completo-custos-e-dre.md` |
| Pessoas (dados reais) | `docs/setores/financeiro/pessoas.local.md` (só neste PC) |
| Integração com os outros setores | `docs/negocio/INTEGRACAO-ENTRE-SETORES.md` |

Código das telas: `pages/DirecionarPix.js`, `pages/ControlePagamentos.js`, `pages/ResultadoMes.js`, `pages/PrevisaoCaixa.js`, `pages/Caixa.js`, `pages/ChavesPixBancos.js`, `pages/ChavesPix.js`, `pages/Dinheiro.js`, `pages/Adquirentes.js`, `pages/ContasPagarEmpresa.js`, `pages/EstoqueSorelly.js`, `pages/ContasPagarLista.js`, `pages/PagasPorDia.js`, `pages/pf/Resumo.js`, `pages/pf/Lancamentos.js`, `pages/pf/Negociacoes.js`, `pages/pf/Maquininha.js`, `pages/pf/Fornecedores.js`, `pages/Comissoes.js`, `pages/ComissoesTodos.js`, `pages/Agendamento.js`, `pages/ComissaoLink.js`, `pages/ComissoesDatas.js`, `pages/ContasReceber.js`, `pages/PrevisaoFaturamento.js`, `pages/ConsolidadoInterno.js`, `pages/ConsolidadoRepresentantes.js`, `pages/Inadimplencia.js`, `pages/InadimplenciaFin.js`, `pages/CobrancaFunc.js`, `pages/LinkRelatorio.js`, `pages/Fiscal.js`, `pages/LimiteFaturamento.js`, `pages/Cnpjs.js`, `pages/FinFamiliar.js`, `pages/FinFamiliarSocios.js`, `pages/LinkPagamento.js`.

## 5. Em aberto (principais)
- Tirar o financeiro 100% da DevMaster (backup, nuvem e auditoria dependem do Leonardo).
- Saldos bancários, saldo das contas (Pix), fiscal e histórico de contas: "a trazer".
- Lançamentos "por fora" ainda passam por planilha.
- Lista completa: `pendencias.md` desta pasta (22 itens: 14 precisam de resposta do Marcus, 8 são trabalho no sistema).

## 6. Regra de trabalho
Mudou uma regra? Atualize (1) o sistema, (2) `decisoes.md` desta pasta e o diário geral, no mesmo dia, (3) o painel: `node scripts/gerar-painel-documentos.mjs`.
