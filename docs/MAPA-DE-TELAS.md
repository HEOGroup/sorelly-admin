# Mapa de telas

> GERADO por scripts/mapa-telas.mjs; não editar à mão. Para atualizar: `node scripts/mapa-telas.mjs`.

Use este arquivo para saber se uma tela JÁ EXISTE antes de criar outra. Procure (Grep) pelo nome que a pessoa falou: o nome do menu, o título da aba e os outros nomes estão todos aqui.

Como ler cada linha:

| Coluna | O que é | De onde vem |
|---|---|---|
| Nome no menu | O caminho que a pessoa clica dentro do setor (`Lista › Tela`) | `src/apps/montagem/navigation/setores.js` |
| Endereço | O que aparece na barra do navegador (`/setor/tela`) | `src/apps/montagem/router/slugs.js` (`ENDERECO_DA_ABA`) |
| Arquivo da tela | Onde está o código da tela | `src/router/rotas.js` |
| Componente | O nome exportado que a rota abre (um arquivo pode ter várias telas) | `src/router/rotas.js` |
| Aba | A chave curta da tela no código (`state.aba`) | `src/apps/montagem/navigation/abas.js` |
| Outros nomes e observações | Título da aba, nome antigo, autorização exigida, tela emprestada de outro setor | os três arquivos acima |

O que este mapa NÃO mostra: abas que trocam DENTRO de uma tela (sem endereço próprio), as telas dos apps de celular (`src/apps/montagem/mobile/`) e quem pode ver cada setor (isso fica em `navigation/perfis.js` e nas autorizações).

## Resumo

| O que | Quantos |
|---|---|
| Setores no menu lateral | 32 |
| Linhas de menu (uma por tela em cada setor; a mesma tela pode estar em dois setores) | 224 |
| Telas diferentes no menu (abas com rota) | 211 |
| Componentes diferentes abertos pelo menu (arquivo + nome exportado) | 211 |
| Itens "em breve" (no menu, sem tela) | 8 |
| Itens do menu sem rota | 0 |
| Rotas de tela do admin em rotas.js | 247 |
| Rotas fora do menu (órfãs) | 34 |
| Rotas do app Kits novos (/kits-novos) | 5 |
| Arquivos em pages/ sem rota própria | 165 |
| … desses, que NENHUM arquivo importa | 14 |
| Páginas do Next fora do roteador (app/**/page.js) | 6 |
| Rotas do servidor (app/**/route.js) | 144 |
| Avisos do script | 0 |

## Índice dos setores

| Setor | Tela que abre ao clicar no setor | Linhas |
|---|---|---|
| Início | `/inicio` | 1 |
| Chamados | `/chamados` | 1 |
| SorellyChat | `/whatssorelly` | 1 |
| Dashboard | `/visao-geral` | 1 |
| Apps | `/apps` | 1 |
| Financeiro | `/financeiro/pf-resumo` | 53 |
| Fiscal | `/fiscal/painel` | 3 |
| Agendamento | `/agendamento/painel` | 7 |
| Cadastro de revendedoras | `/cadastro-de-revendedoras/aprovacao-de-cadastros` | 17 |
| Revendedoras | `/revendedoras/ativas` | 3 |
| Metas | `/metas/revendedoras` | 5 |
| Pontual | `/pontual/clientes` | 5 |
| Representantes & Kits | `/representantes-kits/listagens` | 16 |
| Produção | `/producao/resumo` | 5 |
| Link de pagamento | `/link-de-pagamento/painel` | 7 |
| Atendimento interno | `/atendimento-interno/revendedoras` | 5 |
| Materiais & Estoque | `/materiais-estoque/compras-e-estoque` | 10 |
| Material gráfico | `/material-grafico/grafico-painel` | 6 |
| Cadastro de peças | `/cadastro-de-pecas/pedidos` | 12 |
| Encomendas | `/encomendas/ranking-encomendas` | 8 |
| Garantia | `/garantia/painel` | 2 |
| Pós-vendas | `/pos-vendas/painel` | 1 |
| Recursos Humanos | `/recursos-humanos/rh` | 19 |
| Diretoria | `/diretoria/mapa-do-sistema` | 1 |
| Marcus | `/marcus/acessos` | 2 |
| Inadimplência | `/inadimplencia/dividas` | 16 |
| Jurídico | em breve | 4 |
| Segurança e limpeza | em breve | 2 |
| Marketing | `/marketing/painel` | 7 |
| Regras | `/regras-guias` | 1 |
| PGR e PCMSO | `/pgr-pcmso` | 1 |
| Aulas do setor | `/aulas` | 1 |

## Início

Setor `inicio` (abre direto numa tela só).

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Início | `/inicio` | `src/apps/montagem/pages/Inicio.js` | `AbaInicio` | `inicio` | — |

## Chamados

Setor `melhorias` (abre direto numa tela só).

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Chamados | `/chamados` | `src/apps/montagem/pages/Melhorias.js` | `AbaMelhorias` | `melhorias` | — |

## SorellyChat

Setor `whats` (abre direto numa tela só).

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| SorellyChat | `/whatssorelly` | `src/apps/montagem/pages/WhatsSorelly.js` | `AbaWhats` | `whats` | — |

## Dashboard

Setor `visao` (abre direto numa tela só).

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Visão geral | `/visao-geral` | `src/apps/montagem/pages/VisaoGeral.js` | `AbaVisaoGeral` | `visaogeral` | Dashboard |

## Apps

Setor `apps` (abre direto numa tela só).

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Apps | `/apps` | `src/apps/montagem/pages/Apps.js` | `AbaApps` | `apps` | — |

## Financeiro

Setor `financeiro`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Pagamentos › Resumo geral | `/financeiro/pf-resumo` | `src/apps/montagem/pages/pf/Resumo.js` | `AbaPfResumo` | `pfresumo` | Geral |
| Pagamentos › Direcionar | `/financeiro/direcionar-pix` | `src/apps/montagem/pages/DirecionarPix.js` | `AbaDirecionar` | `direcionar` | — |
| Pagamentos › Contas das representantes | `/financeiro/pagamentos-contas-das-representantes` | `src/apps/montagem/pages/ContasRepresentantes.js` | `AbaContasRepresentantes` | `dirregras` | Regras e contas |
| Pagamentos › Chaves Pix | `/financeiro/chaves-pix-dos-bancos` | `src/apps/montagem/pages/ChavesPixBancos.js` | `AbaChavesPixBancos` | `chavespixbanco` | — |
| Contas bancárias | `/financeiro/caixa` | `src/apps/montagem/pages/Caixa.js` | `AbaCaixa` | `caixa` | Caixa |
| Faturas | `/financeiro/ff-faturas-do-cartao` | `src/apps/montagem/pages/FinFamiliarFaturas.js` | `AbaFfFaturas` | `fffaturas` | Faturas do cartão |
| Contas › A pagar | `/financeiro/contas-a-pagar` | `src/apps/montagem/pages/ContasPagarLista.js` | `AbaCtaLista` | `ctalista` | A pagar / Pagas |
| Contas › Pagas | `/financeiro/contas-pagas` | `src/apps/montagem/pages/ContasPagarLista.js` | `AbaCtaPagas` | `pagaspordia` | Contas pagas |
| Contas › Comissões › Representantes | `/financeiro/comissoes` | `src/apps/montagem/pages/Comissoes.js` | `AbaComissoes` | `comissoes` | Comissões; Comissões dos representantes |
| Contas › Comissões › Comissão interna | `/financeiro/comissoes-de-todos` | `src/apps/montagem/pages/ComissoesTodos.js` | `AbaComissoesTodos` | `comisstodos` | — |
| Contas › Comissões › Agendamento | `/financeiro/comissoes-bonus-agendamento` | `src/apps/montagem/pages/Agendamento.js` | `AbaAgComissoes` | `agbonus` | Comissões do Agendamento |
| Contas › Comissões › Montagem de kits | `/financeiro/comissoes-montagem` | `src/apps/montagem/pages/ComissoesTodos.js` | `AbaComisMontagem` | `comismont` | Comissões da montagem |
| Contas › Comissões › Atendimento interno | `/financeiro/comissoes-atendimento-interno` | `src/apps/montagem/pages/ComissoesTodos.js` | `AbaComisInterno` | `comisint` | Comissões do atendimento interno |
| Contas › Comissões › Link de pagamento | `/financeiro/comissoes-link-de-pagamento` | `src/apps/montagem/pages/ComissaoLink.js` | `AbaComissaoLink` | `comlink` | Comissão do Link de pagamento |
| Contas › Comissões › Datas de pagamento | `/financeiro/comissoes-datas-pagamento` | `src/apps/montagem/pages/ComissoesDatas.js` | `AbaComDatas` | `comdatas` | — |
| Contas › Fornecedores › Conferência de pagamentos | `/financeiro/pf-lancamento` | `src/apps/montagem/pages/pf/Lancamentos.js` | `AbaPfLanc` | `pflanc` | — |
| Contas › Fornecedores › Negociações | `/financeiro/pf-negociacoes` | `src/apps/montagem/pages/pf/NegAbas.js` | `AbaPfNegAbas` | `pfneg` | Negociações de fornecedores |
| Contas › Fornecedores › Maquininha Banho | `/financeiro/pf-maquininha` | `src/apps/montagem/pages/pf/Maquininha.js` | `AbaPfMaq` | `pfmaq` | — |
| Contas › Fornecedores › Cadastro | `/financeiro/pf-cadastro` | `src/apps/montagem/pages/pf/Fornecedores.js` | `AbaPfCadastro` | `pfcadastro` | — |
| Receber › Contas a receber | `/financeiro/contas-a-receber` | `src/apps/montagem/pages/ContasReceberLista.js` | `AbaCtaReceber` | `revreceber` | — |
| Receber › Faturamento › Faturamento | `/financeiro/previsao-de-faturamento` | `src/apps/montagem/pages/PrevisaoFaturamento.js` | `AbaPrevisaoFaturamento` | `previsaofat` | Consolidado do faturamento |
| Receber › Faturamento › Consolidado interno | `/financeiro/atendimento-interno-consolidado` | `src/apps/montagem/pages/ConsolidadoInterno.js` | `AbaConsolidadoInterno` | `intcons` | Consolidado Sorelly |
| Receber › Representantes › Consolidado dos representantes | `/financeiro/consolidado-representantes` | `src/apps/montagem/pages/ConsolidadoRepresentantes.js` | `AbaConsolidadoRep` | `consrep` | Consolidado Representante |
| Receber › Representantes › Comissões dos representantes | `/financeiro/comissoes` | `src/apps/montagem/pages/Comissoes.js` | `AbaComissoes` | `comissoes` | Comissões |
| Família › Home da família | `/financeiro/ff-home` | `src/apps/montagem/pages/FinFamiliar.js` | `AbaFfHome` | `ffhome` | Financeiro familiar · Home |
| Família › Contas › Pagas | `/financeiro/ff-contas-pagas` | `src/apps/montagem/pages/FinFamiliar.js` | `AbaFfPagas` | `ffpagas` | Contas pagas da família |
| Família › Contas › Pagar | `/financeiro/ff-contas-a-pagar` | `src/apps/montagem/pages/FinFamiliar.js` | `AbaFfContas` | `ffcontas` | Contas a pagar da família |
| Família › PIX revendedoras | `/financeiro/ff-pix-revendedoras` | `src/apps/montagem/pages/FinFamiliar.js` | `AbaFfPix` | `ffpix` | PIX revendedoras (família) |
| Família › Sócios | `/financeiro/ff-socios` | `src/apps/montagem/pages/FinFamiliarSocios.js` | `AbaFfSocios` | `ffsocios` | — |
| Família › Cadastro de prestadores | `/financeiro/ff-prestadores` | `src/apps/montagem/pages/FinFamiliar.js` | `AbaFfPrest` | `ffprest` | — |
| Família › Pró-labores | `/financeiro/ff-pro-labores` | `src/apps/montagem/pages/FinFamiliar.js` | `AbaFfProlab` | `ffprolab` | — |
| PIX dos sócios | `/financeiro/ff-pix-revendedoras` | `src/apps/montagem/pages/FinFamiliar.js` | `AbaFfPix` | `ffpix` | PIX revendedoras (família); PIX revendedoras · exige autorização `ff_pix,ff_pix_ver` |
| Relatórios › Resultado do mês | `/financeiro/resultado-do-mes` | `src/apps/montagem/pages/ResultadoMes.js` | `AbaResultadoMes` | `resultado` | — |
| Relatórios › Dinheiro | `/financeiro/dinheiro` | `src/apps/montagem/pages/Dinheiro.js` | `AbaDinheiro` | `dinheiro` | — |
| Relatórios › Resumo do grupo | `/financeiro/ff-resumo-do-grupo` | `src/apps/montagem/pages/ResumoGrupo.js` | `AbaResumoGrupo` | `ffgrupo` | exige autorização `financeiro_familia` |
| Relatórios › Previsão de caixa | `/financeiro/previsao-de-caixa` | `src/apps/montagem/pages/PrevisaoCaixa.js` | `AbaPrevisaoCaixa` | `previsaocaixa` | — |
| Relatórios › Estoque Sorelly | `/financeiro/estoque-sorelly` | `src/apps/montagem/pages/EstoqueSorelly.js` | `AbaEstoqueSorelly` | `estoquesorelly` | — |
| Relatórios › Análise de custos | `/financeiro/contas-a-pagar-empresa-e-familia` | `src/apps/montagem/pages/ContasPagarEmpresa.js` | `AbaCtaPagar` | `ctapagar` | — |
| Relatórios › Taxas e adquirentes | `/financeiro/adquirentes-e-taxas` | `src/apps/montagem/pages/Adquirentes.js` | `AbaAdquirentes` | `adquirentes` | Adquirentes e taxas |
| Cadastro › Bancos | `/financeiro/bancos` | `src/apps/montagem/pages/CadastroFin.js` | `AbaFinBancos` | `finbancos` | — |
| Cadastro › Formas de pagamento | `/financeiro/formas-de-pagamento` | `src/apps/montagem/pages/CadastroFin.js` | `AbaFinFormas` | `finformas` | — |
| Cadastro › Numerários | `/financeiro/numerarios` | `src/apps/montagem/pages/CadastroFin.js` | `AbaFinNumerarios` | `finnumerarios` | — |
| Pagamentos › Destinos | `/financeiro/destinos-de-pagamento` | `src/apps/montagem/pages/cp/Destinos.js` | `AbaDestinos` | `findestinos` | — |
| Controle › Arrumar na DevMaster | `/financeiro/arrumar-na-devmaster` | `src/apps/montagem/pages/ArrumarDevmaster.js` | `AbaArrumarDevmaster` | `findm` | — |
| Controle › Atividades | `/financeiro/atividades-do-financeiro` | `src/apps/montagem/pages/AtividadesFinanceiro.js` | `AbaAtividadesFinanceiro` | `finativ` | — |
| Saldo das contas › Contas Pix | `/financeiro/chaves-pix-e-regras` | `src/apps/montagem/pages/ChavesPix.js` | `AbaChavesPix` | `chavespix` | fora do menu: abre só pelo endereço |
| Contas a pagar › Empréstimos | `/financeiro/emprestimos` | `src/apps/montagem/pages/Emprestimos.js` | `AbaEmprestimos` | `emprestimos` | fora do menu: abre só pelo endereço |
| Contas a pagar › Contas a pagar da família | `/financeiro/contas-da-familia` | `src/apps/montagem/pages/ContasPagarLista.js` | `AbaCtaFamilia` | `ctafam` | A pagar · fora do menu: abre só pelo endereço |
| Contas a pagar › Contas pagas da família | `/financeiro/contas-pagas-da-familia` | `src/apps/montagem/pages/ContasPagarLista.js` | `AbaCtaFamiliaPagas` | `ctafamp` | Pagas · fora do menu: abre só pelo endereço |
| Pagamentos a fornecedores › Fornecedores | `/financeiro/pf-fornecedores` | `src/apps/montagem/pages/pf/Fornecedores.js` | `AbaPfForn` | `pfforn` | fora do menu: abre só pelo endereço |
| Pagamentos a fornecedores › Prestadores de serviço | `/financeiro/pf-prestadores` | `src/apps/montagem/pages/pf/Fornecedores.js` | `AbaPfPrest` | `pfprest` | fora do menu: abre só pelo endereço |
| Faturamento & contas a pagar › Contas a pagar | `/financeiro/contas-a-pagar-mensal` | `src/apps/montagem/pages/ContasPagar.js` | `AbaContasPagar` | `contaspagar` | fora do menu: abre só pelo endereço |
| Faturamento & contas a pagar › Histórico de contas | em breve (tela ainda não feita) | — | — | — | fora do menu |
| Comissões › Cadastro de revendedoras | `/financeiro/comissoes-cadastro-revendedoras` | `src/apps/montagem/pages/MetasSetor.js` | `AbaComCadastro` | `comcad` | Comissão do Cadastro de revendedoras · fora do menu: abre só pelo endereço |
| Comissões › Inadimplência | `/financeiro/comissoes-inadimplencia` | `src/apps/montagem/pages/MetasSetor.js` | `AbaComInad` | `cominad` | Comissão da Inadimplência · fora do menu: abre só pelo endereço |

## Fiscal

Setor `fiscal`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Painel e notas | `/fiscal/painel` | `src/apps/montagem/pages/Fiscal.js` | `AbaFiscal` | `fiscal` | — |
| Limite de faturamento | `/fiscal/limite-de-faturamento` | `src/apps/montagem/pages/LimiteFaturamento.js` | `AbaLimiteFaturamento` | `limitefat` | — |
| CNPJs | `/fiscal/cnpjs` | `src/apps/montagem/pages/Cnpjs.js` | `AbaCnpjs` | `cnpjs` | — |

## Agendamento

Setor `agendamento`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Painel | `/agendamento/painel` | `src/apps/montagem/pages/AgendamentoPainel.js` | `AbaAgPainel` | `agpainel` | Painel do Agendamento |
| Revendedoras | `/agendamento/revendedoras` | `src/apps/montagem/pages/AgendamentoRevendedoras.js` | `AbaAgRevendedoras` | `agrevs` | Revendedoras com kit ativo |
| Representantes | `/agendamento/representantes` | `src/apps/montagem/pages/Agendamento.js` | `AbaAgReps` | `agreps` | Representantes (cotas) |
| Atividades | `/agendamento/atividades` | `src/apps/montagem/pages/AgendamentoAtividades.js` | `AbaAgAtividades` | `agatividades` | Atividades do Agendamento |
| Pedidos do app | `/agendamento/pedidos-do-app` | `src/apps/montagem/pages/PedidosDataApp.js` | `AbaPedidosDataApp` | `agpedidosapp` | — |
| Análises | `/agendamento/analises` | `src/apps/montagem/pages/AgendamentoAnalises.js` | `AbaAgAnalises` | `aganalises` | Análises do Agendamento |
| Expositores | `/encomendas/expositores` | `src/apps/montagem/pages/ExpositoresModulo.js` | `AbaExpositoresModulo` | `expositores` | tela do setor Encomendas |

## Cadastro de revendedoras

Setor `cadastro`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Cadastro › Aprovação de cadastros | `/cadastro-de-revendedoras/aprovacao-de-cadastros` | `src/apps/montagem/pages/AprovacaoCadastros.js` | `AbaAprovacaoCadastros` | `aprovacaocad` | — |
| Cadastro › Base de revendedoras | `/cadastro-de-revendedoras/revendedoras` | `src/apps/montagem/pages/BaseRevendedoras.js` | `AbaBaseRevendedoras` | `revendedoras` | — |
| Kits novos › Kits novos | `/cadastro-de-revendedoras/revendedoras-novas` | `src/apps/montagem/pages/KitsNovosEmbutido.js` | `AbaKitsNovosEmbutido` | `kitnovo` | Revendedoras novas |
| Kits novos › Pendências | `/cadastro-de-revendedoras/kits-novos-pendencias` | `src/apps/montagem/pages/KitsNovosEmbutido.js` | `AbaPendenciasEmbutido` | `knpendencias` | Pendências (kits novos) |
| Kits novos › Consolidado | `/cadastro-de-revendedoras/kits-novos-consolidado` | `src/apps/montagem/pages/KitsNovosEmbutido.js` | `AbaConsolidadoKNEmbutido` | `knconsolidado` | Consolidado (kits novos) |
| Kits novos › Regras | `/cadastro-de-revendedoras/kits-novos-regras` | `src/apps/montagem/pages/KitsNovosEmbutido.js` | `AbaRegrasKNEmbutido` | `knregras` | Regras (kits novos) |
| Kits novos › Representantes | `/cadastro-de-revendedoras/kits-novos-representantes` | `src/apps/montagem/pages/KitsNovosEmbutido.js` | `AbaKitsRepresentantesEmbutido` | `knrepresentantes` | Representantes (kits novos) |
| Kits novos › Entregues | `/cadastro-de-revendedoras/kits-novos-entregues` | `src/apps/montagem/pages/KitsNovosEmbutido.js` | `AbaKitsEntreguesEmbutido` | `knentregues` | Entregues (kits novos) |
| Indicações › Funil | `/cadastro-de-revendedoras/indicacoes` | `src/apps/montagem/pages/Indicacoes.js` | `AbaIndicacoes` | `indicacoes` | Funil de indicações |
| Indicações › Resgates de prêmios | `/cadastro-de-revendedoras/indicacoes-resgates` | `src/apps/montagem/pages/Indicacoes.js` | `AbaIndResgatesPag` | `indresgates` | — |
| Indicações › Retiradas | `/cadastro-de-revendedoras/indicacoes-retiradas` | `src/apps/montagem/pages/Indicacoes.js` | `AbaIndRetiradasPag` | `indretiradas` | — |
| Indicações › Revendedoras e moedas | `/cadastro-de-revendedoras/indicacoes-revendedoras` | `src/apps/montagem/pages/Indicacoes.js` | `AbaIndRevendedorasPag` | `indrevs` | — |
| Indicações › Histórico | `/cadastro-de-revendedoras/indicacoes-historico` | `src/apps/montagem/pages/Indicacoes.js` | `AbaIndHistoricoPag` | `indhistorico` | Histórico de indicações |
| Desempenho › Desempenho do cadastro | `/cadastro-de-revendedoras/desempenho-do-cadastro` | `src/apps/montagem/pages/DesempenhoCadastro.js` | `AbaDesempenhoCadastro` | `desempenhocad` | — |
| Desempenho › Avaliações | `/cadastro-de-revendedoras/avaliacoes` | `src/apps/montagem/pages/Avaliacoes.js` | `AbaAvaliacoes` | `avaliacoes` | — |
| Representantes | `/cadastro-de-revendedoras/representantes-do-setor` | `src/apps/montagem/pages/KitsNovosEmbutido.js` | `AbaRepCadastroEmbutido` | `repcad` | Representantes (cadastro) |
| Mensagens prontas | `/cadastro-de-revendedoras/mensagens-prontas` | `src/apps/montagem/pages/MensagensProntas.js` | `AbaMensagensProntas` | `msgcad` | — |

## Revendedoras

Setor `revbase`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Cadastro | `/revendedoras/ativas` | `src/apps/montagem/pages/RevendedorasAtivas.js` | `AbaRevendedorasAtivas` | `revbase` | — |
| Kits e vendas | `/revendedoras/kits-e-vendas` | `src/apps/montagem/pages/RevendedorasAtivas.js` | `AbaRevendedorasKits` | `revkits` | — |
| Condicional | `/revendedoras/condicional` | `src/apps/montagem/pages/CondicionalModelo.js` | `AbaCondicionalModelo` | `revcond` | — |

## Metas

Setor `metas`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Revendedoras | `/metas/revendedoras` | `src/apps/montagem/pages/MetasRevendedoras.js` | `AbaMetasRevendedoras` | `metrev` | Metas das revendedoras |
| Acompanhamento | `/metas/acompanhamento` | `src/apps/montagem/pages/MetasAcompanhamento.js` | `AbaMetasAcompanhamento` | `metacomp` | Acompanhamento das metas |
| Histórico | `/metas/historico` | `src/apps/montagem/pages/MetasHistorico.js` | `AbaMetasHistorico` | `methist` | Histórico das metas |
| Notificações | `/metas/notificacoes` | `src/apps/montagem/pages/MetasNotificacoes.js` | `AbaMetasNotificacoes` | `metnotif` | Notificações das metas |
| Regras | `/metas/regras` | `src/apps/montagem/pages/MetasRegras.js` | `AbaMetasRegras` | `metregras` | Regras das metas |

## Pontual

Setor `pontual`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Clientes | `/pontual/clientes` | `src/apps/montagem/pages/Pontual.js` | `AbaPontualClientes` | `pontclientes` | Pontual · Clientes |
| Tabelas de preço | `/pontual/tabelas-de-preco` | `src/apps/montagem/pages/Pontual.js` | `AbaPontualPrecos` | `pontprecos` | Pontual · Tabelas de preço |
| Inadimplência | `/pontual/inadimplencia` | `src/apps/montagem/pages/Pontual.js` | `AbaPontualInadimplencia` | `pontinad` | Pontual · Inadimplência |
| Pós-venda | `/pontual/pos-venda` | `src/apps/montagem/pages/Pontual.js` | `AbaPontualPosVenda` | `pontposvenda` | Pontual · Pós-venda |
| Regras | `/pontual/regras` | `src/apps/montagem/pages/Pontual.js` | `AbaPontualRegras` | `pontregras` | Pontual · Regras |

## Representantes & Kits

Setor `representantes`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Montagem › Listagens | `/representantes-kits/listagens` | `src/apps/montagem/pages/Painel.js` | `AbaPainel` | `painel` | — |
| Montagem › Condicionais | `/representantes-kits/condicionais` | `src/apps/montagem/pages/Condicionais.js` | `AbaCondicionais` | `condicionais` | — |
| Montagem › Preferências do kit | `/representantes-kits/preferencias-do-kit` | `src/apps/montagem/pages/PreferenciasKit.js` | `AbaPreferenciasKit` | `prefkit` | — |
| Bipagem › Visão geral da bipagem | `/representantes-kits/visao-bipagem` | `src/apps/montagem/pages/VisaoBipagem.js` | `AbaVisaoBipagem` | `visaobip` | — |
| Bipagem › Meu desempenho | `/representantes-kits/meu-desempenho` | `src/apps/montagem/pages/MeuDesempenho.js` | `AbaMeuDesempenho` | `meudesemp` | — |
| Bipagem › Comissões da bipagem | `/representantes-kits/comissoes-bipagem` | `src/apps/montagem/pages/ComissoesTodos.js` | `AbaComisBipagem` | `comisbip` | exige autorização `comissao_bipagem` |
| Acompanhamento › Consolidado | `/representantes-kits/consolidado` | `src/apps/montagem/pages/Consolidado.js` | `AbaConsolidado` | `consolidado` | — |
| Acompanhamento › Equipe e comissões | `/representantes-kits/equipe` | `src/apps/montagem/pages/Equipe.js` | `AbaEquipe` | `equipe` | — |
| Acompanhamento › Produtividade da montagem | `/representantes-kits/produtividade-da-montagem` | `src/apps/montagem/pages/ProdutividadeMontagem.js` | `AbaProdutividadeMontagem` | `prodmont` | — |
| Acompanhamento › Registros | `/representantes-kits/registros` | `src/apps/montagem/pages/Registros.js` | `AbaRegistros` | `registros` | — |
| Acompanhamento › Relatórios | `/representantes-kits/relatorios` | `src/apps/montagem/pages/Relatorios.js` | `AbaRelatorios` | `relatorios` | — |
| Representantes › Painel | `/representantes-kits/painel-representantes` | `src/apps/montagem/pages/RepresentantesApp.js` | `AbaRepresentantesApp` | `reppainel` | Painel das representantes |
| Representantes › Consolidado dos representantes | `/financeiro/consolidado-representantes` | `src/apps/montagem/pages/ConsolidadoRepresentantes.js` | `AbaConsolidadoRep` | `consrep` | Consolidado Representante · tela do setor Financeiro |
| Regras › Regras dos representantes | `/representantes-kits/regras-representantes` | `src/apps/montagem/pages/RegrasRepresentantes.js` | `AbaRegrasRepresentantes` | `regrasrep` | fora do menu: abre só pelo endereço |
| Regras › Regras dos acertos | `/representantes-kits/regras-acertos` | `src/apps/montagem/pages/RegrasAcertos.js` | `AbaRegrasAcertos` | `regrasacerto` | fora do menu: abre só pelo endereço |
| Kits (interno) › Regras | `/representantes-kits/regras` | `src/apps/montagem/pages/Regras.js` | `AbaRegras` | `regras` | fora do menu: abre só pelo endereço |

## Produção

Setor `producao`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Produção | `/producao/resumo` | `src/apps/montagem/pages/Producao.js` | `AbaProducao` | `producao` | — |
| Produção externa | `/producao/casa` | `src/apps/montagem/pages/Producao.js` | `AbaProdExterna` | `prodcasa` | exige autorização `producao_externa,producao_ver` |
| Pagamento por produção | `/producao/pagamento-por-producao` | `src/apps/montagem/pages/Producao.js` | `AbaPagamentoProducao` | `prodpagproducao` | exige autorização `producao_externa,producao_ver` |
| Envio e devolução | `/producao/envio-e-devolucao` | `src/apps/montagem/pages/Producao.js` | `AbaNotasProducao` | `prodnotas` | exige autorização `producao_externa,producao_ver,producao_envio` |
| Cadastro | `/producao/funcionarias` | `src/apps/montagem/pages/Producao.js` | `AbaProdCadastro` | `prodfunc` | exige autorização `producao_externa,producao_ver` |

## Link de pagamento

Setor `linkpag`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Solicitações | `/link-de-pagamento/painel` | `src/apps/montagem/pages/LinkPagamento.js` | `AbaLinkPagamento` | `linkpag` | Link de pagamento e maquininhas |
| Descontados no acerto | `/link-de-pagamento/link-descontados-no-acerto` | `src/apps/montagem/pages/LinkPagamento.js` | `AbaLinkDescontados` | `linkdesc` | Links descontados no acerto |
| Relatórios › Relatório de links | `/link-de-pagamento/relatorio-de-links` | `src/apps/montagem/pages/LinkRelatorio.js` | `AbaLinkRelatorio` | `linkrel` | Relatório de links de pagamento |
| Relatórios › Análises | `/link-de-pagamento/link-analises` | `src/apps/montagem/pages/LinkPagamento.js` | `AbaLinkAnalises` | `linkanal` | Análises dos links |
| Relatórios › Taxas e recebimentos | `/link-de-pagamento/link-taxas-e-recebimentos` | `src/apps/montagem/pages/LinkPagamento.js` | `AbaLinkTaxas` | `linktaxas` | Taxas e recebimentos dos links |
| Cadastro › Meios e acessos | `/link-de-pagamento/link-meios-e-acessos` | `src/apps/montagem/pages/LinkPagamento.js` | `AbaLinkMeios` | `linkmeios` | Meios e acessos dos links |
| Cadastro › Representantes | `/link-de-pagamento/link-representantes` | `src/apps/montagem/pages/LinkPagamento.js` | `AbaLinkRepresentantes` | `linkreps` | Representantes dos links |

## Atendimento interno

Setor `atendimento`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Revendedoras | `/atendimento-interno/revendedoras` | `src/apps/montagem/pages/RevendedorasInternas.js` | `AbaRevendedorasInternas` | `intrevs` | Revendedoras internas |
| Listagens | `/atendimento-interno/listagens` | `src/apps/montagem/pages/AtendimentoInternoListagens.js` | `AbaIntListagens` | `intlist` | Atendimento interno · Listagens |
| Bipagem de envio | `/atendimento-interno/bipagem-envio` | `src/apps/montagem/pages/BipagemEnvio.js` | `AbaBipagemEnvio` | `intbipenv` | Atendimento interno · Bipagem de envio |
| Atendimento Sorelly | `/atendimento-interno/calculadora` | `src/apps/montagem/pages/AtendimentoInternoCalculadora.js` | `AbaIntCalculadora` | `intcalc` | — |
| Consolidado Sorelly | `/financeiro/atendimento-interno-consolidado` | `src/apps/montagem/pages/ConsolidadoInterno.js` | `AbaConsolidadoInterno` | `intcons` | tela do setor Financeiro |

## Materiais & Estoque

Setor `estoque`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Painel | `/materiais-estoque/compras-e-estoque` | `src/apps/montagem/pages/ComprasEstoque.js` | `AbaComprasEstoque` | `compras` | Compras e estoque |
| Visão geral | `/materiais-estoque/compras-visao-geral` | `src/apps/montagem/pages/ComprasEstoque.js` | `AbaComprasVisao` | `cevisao` | Visão geral das compras |
| Estoque › Estoque de material | `/materiais-estoque/compras-estoque-de-material` | `src/apps/montagem/pages/ComprasEstoque.js` | `AbaEstoqueMateriais` | `ceestoque` | — |
| Estoque › Movimentos | `/materiais-estoque/compras-movimentos` | `src/apps/montagem/pages/ComprasEstoque.js` | `AbaEstoqueMovs` | `cemov` | Movimentos do estoque |
| Estoque › Pedidos de material | `/materiais-estoque/compras-pedidos-de-material` | `src/apps/montagem/pages/ComprasEstoque.js` | `AbaEstoquePedidos` | `cesol` | — |
| Tabela de preços | `/materiais-estoque/compras-tabela-de-precos` | `src/apps/montagem/pages/ComprasEstoque.js` | `AbaComprasPrecos` | `ceprecos` | Tabela de preços das compras |
| Cadastros | `/materiais-estoque/compras-cadastros` | `src/apps/montagem/pages/ComprasEstoque.js` | `AbaComprasCadastros` | `cecad` | Cadastros das compras |
| Configurações | `/materiais-estoque/compras-configuracoes` | `src/apps/montagem/pages/ComprasEstoque.js` | `AbaComprasConfig` | `cecfg` | Configurações das compras |
| Compras › Quadro de compras | `/materiais-estoque/compras-quadro` | `src/apps/montagem/pages/ComprasEstoque.js` | `AbaComprasQuadro` | `cequadro` | fora do menu: abre só pelo endereço |
| Compras › Planilha de compras | `/materiais-estoque/compras-planilha` | `src/apps/montagem/pages/ComprasEstoque.js` | `AbaComprasPlanilha` | `ceplanilha` | fora do menu: abre só pelo endereço |

## Material gráfico

Setor `grafico`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Painel | `/material-grafico/grafico-painel` | `src/apps/montagem/pages/MaterialGrafico.js` | `AbaGfPainel` | `gfpainel` | Painel do material gráfico |
| Compras | `/material-grafico/grafico-compras` | `src/apps/montagem/pages/MaterialGrafico.js` | `AbaGfCompras` | `gfcompras` | Compras do material gráfico |
| Tabela de preços | `/material-grafico/grafico-tabela-de-precos` | `src/apps/montagem/pages/MaterialGrafico.js` | `AbaGfPrecos` | `gfprecos` | Tabela de preços do material gráfico |
| Estoque | `/material-grafico/grafico-estoque` | `src/apps/montagem/pages/MaterialGrafico.js` | `AbaGfEstoque` | `gfestoque` | Estoque do material gráfico |
| Kits | `/material-grafico/grafico-kits` | `src/apps/montagem/pages/MaterialGrafico.js` | `AbaGfKits` | `gfkits` | Kits do material gráfico |
| Vendas | `/material-grafico/grafico-vendas` | `src/apps/montagem/pages/MaterialGrafico.js` | `AbaGfVendas` | `gfvendas` | Vendas do material gráfico |

## Cadastro de peças

Setor `cadpecas`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Pedidos › Compras de Bruto | `/cadastro-de-pecas/pedidos` | `src/apps/montagem/pages/CadastroPecas.js` | `AbaCadastroPecas` | `cadpecas` | — |
| Pedidos › Pedidos Banho/Bruto | `/cadastro-de-pecas/controle-de-compras` | `src/apps/montagem/pages/CadastroPecas.js` | `AbaPecasControle` | `cpctrl` | — |
| Peças | `/cadastro-de-pecas/pecas` | `src/apps/montagem/pages/CadastroPecas.js` | `AbaPecasFalta` | `cppecas` | — |
| Banho › Tabela do banho | `/cadastro-de-pecas/tabela-do-banho` | `src/apps/montagem/pages/CadastroPecas.js` | `AbaPecasBanho` | `cpbanho` | — |
| Banho › Faturas | `/cadastro-de-pecas/faturas-pontual` | `src/apps/montagem/pages/CadastroPecas.js` | `AbaPecasFaturasPontual` | `cpfp` | — |
| Banho › Retirar ouro | `/cadastro-de-pecas/retirar-ouro` | `src/apps/montagem/pages/CadastroPecas.js` | `AbaPecasOuro` | `cpouro` | — |
| Cadastro › Solicitações | `/cadastro-de-pecas/solicitacoes` | `src/apps/montagem/pages/CadastroPecas.js` | `AbaPecasSolicitacoes` | `cpsol` | — |
| Cadastro › Planilhas de cadastro | `/cadastro-de-pecas/planilhas` | `src/apps/montagem/pages/CadastroPecas.js` | `AbaPecasLotes` | `cplotes` | — |
| Cadastro › Calculadora | `/cadastro-de-pecas/calculadora` | `src/apps/montagem/pages/CadastroPecas.js` | `AbaPecasCalculadora` | `cpcalc` | — |
| Cadastro › DevMaster | `/cadastro-de-pecas/devmaster` | `src/apps/montagem/pages/CadastroPecas.js` | `AbaPecasDevMaster` | `cpdev` | — |
| Fornecedores | `/cadastro-de-pecas/fornecedores` | `src/apps/montagem/pages/CadastroPecas.js` | `AbaPecasFornecedores` | `cpforn` | — |
| Configurações | `/cadastro-de-pecas/configuracoes` | `src/apps/montagem/pages/CadastroPecas.js` | `AbaPecasConfig` | `cpcfg` | — |

## Encomendas

Setor `encomendas`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Ranking › Top vendedoras | `/encomendas/ranking-encomendas` | `src/apps/montagem/pages/encomendas/Ranking.js` | `AbaEncRanking` | `encranking` | — |
| Ranking › Premiação do mês | `/encomendas/premiacao-do-mes` | `src/apps/montagem/pages/encomendas/Premiacao.js` | `AbaEncPremiacao` | `encpremio` | — |
| Ranking › Cronograma de postagens | `/encomendas/cronograma-de-postagens` | `src/apps/montagem/pages/encomendas/Cronograma.js` | `AbaEncCronograma` | `enccrono` | — |
| Funil de pedidos | `/encomendas/e-reposicoes` | `src/apps/montagem/pages/Encomendas.js` | `AbaEncomendas` | `encomendas` | — |
| Top 100 | `/encomendas/top-50` | `src/apps/montagem/pages/EncomendasTelas.js` | `AbaEncTop50` | `enctop50` | — |
| Representantes | `/encomendas/reposicao-representantes` | `src/apps/montagem/pages/EncomendasTelas.js` | `AbaEncRep` | `encrep` | — |
| Expositores | `/encomendas/expositores` | `src/apps/montagem/pages/ExpositoresModulo.js` | `AbaExpositoresModulo` | `expositores` | — |
| Regras e mensagens | `/encomendas/regras-e-mensagens-reposicao` | `src/apps/montagem/pages/EncomendasTelas.js` | `AbaEncRegras` | `encregras` | — |

## Garantia

Setor `garantia`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Garantia | `/garantia/painel` | `src/apps/montagem/pages/Garantia.js` | `AbaGarantia` | `garantia` | — |
| Créditos | `/garantia/creditos` | `src/apps/montagem/pages/GarantiaCreditos.js` | `AbaGarantiaCreditos` | `garantiacred` | Créditos de garantia |

## Pós-vendas

Setor `posvendas`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Contatos | `/pos-vendas/painel` | `src/apps/montagem/pages/PosVendas.js` | `AbaPosVendas` | `posvendas` | Pós-vendas |

## Recursos Humanos

Setor `rh`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Visão geral | `/recursos-humanos/rh` | `src/apps/montagem/pages/RH.js` | `AbaRhVisao` | `rhvisao` | Visão geral do RH |
| Presença › Presença diária | `/recursos-humanos/rh-presenca` | `src/apps/montagem/pages/RH.js` | `AbaRhPresenca` | `rhpresenca` | — |
| Presença › Relatório diário | `/recursos-humanos/rh-relatorio` | `src/apps/montagem/pages/RH.js` | `AbaRhRelatorio` | `rhrelatorio` | Relatório diário do RH |
| Colaboradores › Colaboradores | `/recursos-humanos/rh-colaboradores` | `src/apps/montagem/pages/RH.js` | `AbaRhColab` | `rhcolab` | — |
| Segurança do trabalho | `/recursos-humanos/rh-seguranca-trabalho` | `src/apps/montagem/pages/RHSeguranca.js` | `AbaRhSeguranca` | `rhseg` | — |
| Pesquisa de clima | `/recursos-humanos/rh-pesquisa-clima` | `src/apps/montagem/pages/PesquisaClima.js` | `AbaPesquisaClima` | `clima` | — |
| Canal de denúncias | `/recursos-humanos/rh-canal-denuncias` | `src/apps/montagem/pages/Denuncias.js` | `AbaDenuncias` | `denuncias` | — |
| Contratos › Pessoas › Representantes | `/recursos-humanos/rh-contratos-representantes` | `src/apps/montagem/pages/RHContratos.js` | `AbaRhContrRep` | `rhcrep` | Contratos de representantes |
| Contratos › Pessoas › Funcionários (CLT) | `/recursos-humanos/rh-contratos-funcionarios` | `src/apps/montagem/pages/RHContratos.js` | `AbaRhContrFunc` | `rhcfunc` | Contratos de funcionários (CLT) |
| Contratos › Pessoas › Terceiros | `/recursos-humanos/rh-contratos-terceiros` | `src/apps/montagem/pages/RHContratos.js` | `AbaRhContrTerc` | `rhcterc` | Contratos de terceiros |
| Contratos › Empresa › Crédito bancário | `/recursos-humanos/rh-contratos-credito` | `src/apps/montagem/pages/RHContratos.js` | `AbaRhContrCredito` | `rhccred` | — |
| Contratos › Empresa › Aluguéis | `/recursos-humanos/rh-contratos-alugueis` | `src/apps/montagem/pages/RHContratos.js` | `AbaRhContrAluguel` | `rhcalug` | — |
| Contratos › Empresa › Consórcios | `/recursos-humanos/rh-contratos-consorcios` | `src/apps/montagem/pages/RHContratos.js` | `AbaRhContrConsorcio` | `rhcconsor` | — |
| Contratos › Particulares do Marcus | `/recursos-humanos/rh-contratos-marcus` | `src/apps/montagem/pages/RHContratos.js` | `AbaRhContrMarcus` | `rhcmarcus` | Contratos particulares do Marcus |
| Contratos › Modelos de contrato | `/recursos-humanos/rh-contratos-modelos` | `src/apps/montagem/pages/RHContratos.js` | `AbaRhContrModelos` | `rhcmodelos` | — |
| Pessoas › Funcionários e representantes | `/recursos-humanos/funcionarios-e-representantes` | `src/apps/montagem/pages/Pessoas.js` | `AbaPessoas` | `pessoas` | — |
| Pessoas › Equipes | `/recursos-humanos/equipes` | `src/apps/montagem/pages/Equipes.js` | `AbaEquipes` | `equipes` | — |
| Pessoas › Acessos e autorizações | `/recursos-humanos/acessos-por-setor` | `src/apps/montagem/pages/AcessosAutorizacoes.js` | `AbaAcessosAutorizacoes` | `acessos` | — |
| Configurador | `/recursos-humanos/rh-configurador` | `src/apps/montagem/pages/RH.js` | `AbaRhConfig` | `rhconfig` | Configurador do RH |

## Diretoria

Setor `diretoria`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Mapa do sistema | `/diretoria/mapa-do-sistema` | `src/apps/montagem/pages/MapaSistema.js` | `AbaMapa` | `mapa` | — |

## Marcus

Setor `marcus`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Acessos e senhas | `/marcus/acessos` | `src/apps/montagem/pages/MarcusAcessos.js` | `AbaMarcusAcessos` | `marcusacessos` | — |
| Progresso | `/marcus/progresso` | `src/apps/montagem/pages/MarcusProgresso.js` | `AbaMarcusProg` | `marcusprog` | — |

## Inadimplência

Setor `inadimplencia`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Revendedoras › Dívidas | `/inadimplencia/dividas` | `src/apps/montagem/pages/inad/Dividas.js` | `AbaInadDividas` | `inaddiv` | Dívidas (Inadimplência) |
| Revendedoras › Cobrança do dia | `/inadimplencia/cobranca-do-dia` | `src/apps/montagem/pages/inad/Gestao.js` | `AbaInadCobranca` | `inadcob` | Cobrança do dia (Inadimplência) |
| Revendedoras › Pagamentos | `/inadimplencia/pagamentos` | `src/apps/montagem/pages/inad/Controles.js` | `AbaInadPagamentos` | `inadpag` | Pagamentos (Inadimplência) |
| Revendedoras › Serasa | `/inadimplencia/serasa` | `src/apps/montagem/pages/inad/Controles.js` | `AbaInadSerasa` | `inadser` | Serasa (Inadimplência) |
| Revendedoras › Kits em atraso | `/inadimplencia/kits-em-atraso` | `src/apps/montagem/pages/inad/Controles.js` | `AbaInadKits` | `inadkit` | Kits em atraso (Inadimplência) |
| Revendedoras › Relatórios | `/inadimplencia/relatorios` | `src/apps/montagem/pages/inad/Gestao.js` | `AbaInadRelatorios` | `inadrel` | Relatórios (Inadimplência) |
| Revendedoras › Regras | `/inadimplencia/regras` | `src/apps/montagem/pages/inad/Gestao.js` | `AbaInadRegras` | `inadreg` | Regras (Inadimplência) |
| Funcionários › Visão geral | `/inadimplencia/cobranca-visao-geral` | `src/apps/montagem/pages/CobrancaFunc.js` | `AbaCfVisao` | `cfvisao` | Visão geral da cobrança |
| Funcionários › Devendo | `/inadimplencia/cobranca-devendo` | `src/apps/montagem/pages/CobrancaFunc.js` | `AbaCfDevendo` | `cfdevendo` | — |
| Funcionários › Quitadas | `/inadimplencia/cobranca-quitadas` | `src/apps/montagem/pages/CobrancaFunc.js` | `AbaCfQuitados` | `cfquitados` | — |
| Funcionários › Relatórios mensais | `/inadimplencia/cobranca-relatorios` | `src/apps/montagem/pages/CobrancaFunc.js` | `AbaCfRelatorio` | `cfrelatorio` | Relatórios mensais da cobrança |
| Funcionários › Funcionárias | `/inadimplencia/cobranca-funcionarias` | `src/apps/montagem/pages/CobrancaFunc.js` | `AbaCfFuncionarias` | `cffunc` | Funcionárias da cobrança |
| Funcionários › Regras | `/inadimplencia/cobranca-regras` | `src/apps/montagem/pages/CobrancaFunc.js` | `AbaCfRegras` | `cfregras` | Regras de compra de peças; Regras da cobrança |
| Funcionários › Configuração | `/inadimplencia/cobranca-configuracao` | `src/apps/montagem/pages/CobrancaFunc.js` | `AbaCfConfig` | `cfconfig` | Configuração da cobrança |
| Representantes › Inadimplência | `/inadimplencia/painel` | `src/apps/montagem/pages/Inadimplencia.js` | `AbaInadimplencia` | `inadimp` | — |
| Representantes › Compras de joias | `/inadimplencia/compras-joias-representantes` | `src/apps/montagem/pages/ComprasJoias.js` | `AbaComprasJoias` | `comprasrep` | — |

## Jurídico

Setor `juridico`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Notas promissórias › Execução de notas promissórias | em breve (tela ainda não feita) | — | — | — | — |
| Notas promissórias › Inadimplência jurídica | em breve (tela ainda não feita) | — | — | — | — |
| Contratos de salas comerciais | em breve (tela ainda não feita) | — | — | — | — |
| Marcas e patentes | em breve (tela ainda não feita) | — | — | — | — |

## Segurança e limpeza

Setor `servicos`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Segurança | em breve (tela ainda não feita) | — | — | — | — |
| Limpeza e zeladoria | em breve (tela ainda não feita) | — | — | — | — |

## Marketing

Setor `marketing`.

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Marketing | `/marketing/painel` | `src/apps/montagem/pages/Marketing.js` | `AbaMarketing` | `marketing` | — |
| Fotos de catálogo | `/marketing/fotos-de-catalogo` | `src/apps/montagem/pages/FotosCatalogo.js` | `AbaFotosCatalogo` | `fotoscat` | — |
| Relatório diário | `/marketing/relatorio-diario` | `src/apps/montagem/pages/RelatorioMarketing.js` | `AbaRelatorioMarketing` | `relmkt` | — |
| Campanhas | em breve (tela ainda não feita) | — | — | — | — |
| Tráfego pago | `/marketing/trafego-pago` | `src/apps/montagem/pages/Trafego.js` | `AbaTrafego` | `trafego` | — |
| Criativos | `/marketing/criativos` | `src/apps/montagem/pages/Criativos.js` | `AbaCriativos` | `criativos` | — |
| Modelos | `/marketing/modelos` | `src/apps/montagem/pages/Modelas.js` | `AbaModelas` | `modelos` | exige autorização `modelos_ver` |

## Regras

Setor `regrasguias` (abre direto numa tela só).

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Regras | `/regras-guias` | `src/apps/montagem/pages/RegrasGuias.js` | `AbaRegrasGuias` | `regrasguias` | — |

## PGR e PCMSO

Setor `segdocs` (abre direto numa tela só).

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| PGR e PCMSO | `/pgr-pcmso` | `src/apps/montagem/pages/SegurancaDocumentos.js` | `AbaSegurancaDocs` | `segdocs` | — |

## Aulas do setor

Setor `aulas` (abre direto numa tela só).

| Nome no menu | Endereço | Arquivo da tela | Componente | Aba | Outros nomes e observações |
|---|---|---|---|---|---|
| Aulas do setor | `/aulas` | `src/apps/montagem/pages/Aulas.js` | `AbaAulas` | `aulas` | — |

## App Kits novos (endereço à parte)

App separado, com casca própria (`src/apps/kits-novos/App.js`). As mesmas telas aparecem embutidas no admin, no setor Cadastro de revendedoras, pelo arquivo `src/apps/montagem/pages/KitsNovosEmbutido.js`.

| Endereço | Arquivo da tela | Componente |
|---|---|---|
| `/kits-novos/kits` | `src/apps/kits-novos/pages/Kits.js` | `AbaKits` |
| `/kits-novos/pendencias` | `src/apps/kits-novos/pages/Pendencias.js` | `AbaPendencias` |
| `/kits-novos/consolidado` | `src/apps/kits-novos/pages/Consolidado.js` | `AbaConsolidado` |
| `/kits-novos/regras` | `src/apps/kits-novos/pages/Regras.js` | `AbaRegras` |
| `/kits-novos/configurador` | `src/apps/kits-novos/pages/Config.js` | `AbaConfig` |

## Telas sem menu (rotas órfãs)

Rotas que existem em `rotas.js` mas não estão em nenhum setor do menu. Abrem só pelo endereço. Antes de criar tela nova parecida, confira se uma destas já faz o serviço.

| Endereço | Nome na rota | Arquivo da tela | Componente | Título da aba | Motivo |
|---|---|---|---|---|---|
| `/agendamento-abertura` | `agendamento-abertura` | `src/apps/montagem/pages/AgendamentoPainel.js` | `AbaAgPainel` | Abertura do mês | aba `agabertura` fora do menu de todos os setores |
| `/agendamento-configurador` | `agendamento-configurador` | `src/apps/montagem/pages/AgendamentoPainel.js` | `AbaAgPainel` | Configurador do Agendamento | aba `agconfig` fora do menu de todos os setores |
| `/agendamento-historico` | `agendamento-historico` | `src/apps/montagem/pages/AgendamentoAnalises.js` | `AbaAgAnalises` | Histórico do Agendamento | aba `aghistorico` fora do menu de todos os setores |
| `/ff-gasto-por-casa` | `ff-gasto-por-casa` | `src/apps/montagem/pages/FfGastoPorCasa.js` | `AbaFfCasas` | Gasto por casa | aba `ffcasas` fora do menu de todos os setores |
| `/ff-relatorio` | `ff-relatorio` | `src/apps/montagem/pages/FinFamiliar.js` | `AbaFfRelatorio` | Relatório da família | aba `ffrelatorio` fora do menu de todos os setores |
| `/ff-historico` | `ff-historico` | `src/apps/montagem/pages/FinFamiliar.js` | `AbaFfHist` | Histórico da família | aba `ffhist` fora do menu de todos os setores |
| `/ff-configuracoes` | `ff-configuracoes` | `src/apps/montagem/pages/FinFamiliar.js` | `AbaFfConfig` | Configurações da família | aba `ffconfig` fora do menu de todos os setores |
| `/comissoes-metas-agendamento` | `comissoes-metas-agendamento` | `src/apps/montagem/pages/Agendamento.js` | `AbaAgMetas` | Metas e bônus do Agendamento | aba `agmetas` fora do menu de todos os setores |
| `/representantes` | `representantes` | `src/apps/montagem/pages/AvalRep.js` | `AbaAvalRep` | Representantes | aba `avalrep` fora do menu de todos os setores |
| `/regras-reposicao` | `regras-reposicao` | `src/apps/montagem/pages/RegrasReposicao.js` | `AbaRegrasReposicao` | Regras de reposição e encomendas | aba `regreposicao` fora do menu de todos os setores |
| `/configurador-comissoes` | `configurador-comissoes` | `src/apps/montagem/pages/ConfigComissoes.js` | `AbaConfigComissoes` | Configurador de comissões | aba `comconfig` fora do menu de todos os setores |
| `/configuracoes-representantes` | `configuracoes-representantes` | `src/apps/montagem/pages/ConfigRepresentantes.js` | `AbaConfigRepresentantes` | Configurações | aba `configrep` fora do menu de todos os setores |
| `/kits-novos-configurador` | `kits-novos-configurador` | `src/apps/montagem/pages/KitsNovosEmbutido.js` | `AbaConfigKNEmbutido` | Configurador (kits novos) | aba `knconfigurador` fora do menu de todos os setores |
| `/configurador` | `configurador` | `src/apps/montagem/pages/ConfiguradorGeral.js` | `AbaConfiguradorGeral` | Configurador | aba `config` fora do menu de todos os setores |
| `/producao-codigos` | `producao-codigos` | `src/apps/montagem/pages/Producao.js` | `AbaProdCadastro` | Códigos e categorias | aba `prodcod` fora do menu de todos os setores |
| `/producao-pagamentos` | `producao-pagamentos` | `src/apps/montagem/pages/Producao.js` | `AbaProdExterna` | Pagamentos | aba `prodpag` fora do menu de todos os setores |
| `/cadastro-de-pecas-compras` | `cadastro-de-pecas-compras` | `src/apps/montagem/pages/CadastroPecas.js` | `AbaPecasCompras` | Compras | aba `cpcompras` fora do menu de todos os setores |
| `/cadastro-de-pecas-faturas-ellos` | `cadastro-de-pecas-faturas-ellos` | `src/apps/montagem/pages/CadastroPecas.js` | `AbaPecasFaturasEllos` | Faturas Ellos | aba `cpfe` fora do menu de todos os setores |
| `/ida-na-empresa` | `ida-na-empresa` | `src/apps/montagem/pages/EncomendasTelas.js` | `AbaEncIda` | Ida na empresa | aba `encida` fora do menu de todos os setores |
| `/link-comprovantes` | `link-comprovantes` | `src/apps/montagem/pages/LinkPagamento.js` | `AbaLinkComprovantes` | Comprovantes dos links | aba `linkcomp` fora do menu de todos os setores |
| `/link-historico` | `link-historico` | `src/apps/montagem/pages/LinkPagamento.js` | `AbaLinkHistorico` | Histórico dos links | aba `linkhist` fora do menu de todos os setores |
| `/app-funcionarias` | `app-funcionarias` | `src/apps/montagem/pages/CelularFuncionarios.js` | `AbaCelularFunc` | App das funcionárias | aba `celfunc` fora do menu de todos os setores |
| `/rotina-do-dia` | `rotina-do-dia` | `src/apps/montagem/pages/Rotina.js` | `AbaRotina` | Rotina do dia | aba `rotina` fora do menu de todos os setores |
| `/pagas-por-dia` | `pagas-por-dia` | `src/apps/montagem/pages/ContasPagarLista.js` | `AbaCtaPagas` | — | nome sem aba em slugs.js (abre só digitando o endereço) |
| `/contas-a-receber-resumo` | `contas-a-receber-resumo` | `src/apps/montagem/pages/ContasReceber.js` | `AbaContasReceber` | — | nome sem aba em slugs.js (abre só digitando o endereço) |
| `/painel-dos-acertos` | `painel-dos-acertos` | `src/apps/montagem/pages/PainelAcertos.js` | `AbaPainelAcertos` | Painel dos acertos | aba `painelacertos` fora do menu de todos os setores |
| `/entrada-do-setor` | `entrada-do-setor` | `src/apps/montagem/pages/EntradaSetor.js` | `default` | Entrada do setor | aba `entradasetor` fora do menu de todos os setores |
| `/rh-advertencias` | `rh-advertencias` | `src/apps/montagem/pages/RH.js` | `AbaRhColab` | Advertências | aba `rhadv` fora do menu de todos os setores |
| `/rh-experiencia` | `rh-experiencia` | `src/apps/montagem/pages/RH.js` | `AbaRhExp` | Controle de experiência | aba `rhexp` fora do menu de todos os setores |
| `/rh-solicitacoes` | `rh-solicitacoes` | `src/apps/montagem/pages/RHSolicitacoes.js` | `AbaRhSolic` | Solicitações | aba `rhsolic` fora do menu de todos os setores |
| `/rh-horas-extras` | `rh-horas-extras` | `src/apps/montagem/pages/RH.js` | `AbaRhHoras` | Horas extras | aba `rhhoras` fora do menu de todos os setores |
| `/rh-negociacoes` | `rh-negociacoes` | `src/apps/montagem/pages/RH.js` | `AbaRhNegoc` | Negociações | aba `rhnegoc` fora do menu de todos os setores |
| `/rh-escala-42h` | `rh-escala-42h` | `src/apps/montagem/pages/RH.js` | `AbaRhEscala42` | Escala 42h (fim da 6x1) | aba `rhescala42` fora do menu de todos os setores |
| `/rh-pagamento-em-joias` | `rh-pagamento-em-joias` | `src/apps/montagem/pages/RH.js` | `AbaRhJoias` | Pagamento em joias | aba `joiaspag` fora do menu de todos os setores |

## Endereços que só desviam para outra tela

| Endereço digitado | Vai para (nas linhas de rotas.js, como está escrito no código) | Onde está escrito |
|---|---|---|
| `/app-representante` | `"/apps"` | `src/router/rotas.js` linha 227 |
| `/financeiro/pix-representantes` | `"/" + ENDERECO_DA_ABA.direcionar` | `src/router/rotas.js` linha 228 |
| `/melhorias` | `/chamados` (aba `melhorias`) | `src/apps/montagem/router/slugs.js` (`ABA_DO_SLUG`) |
| `/pagamentos-regras-do-pix` | `/financeiro/pagamentos-contas-das-representantes` (aba `dirregras`) | `src/apps/montagem/router/slugs.js` (`ABA_DO_SLUG`) |
| `/pix-representantes` | `/financeiro/direcionar-pix` (aba `direcionar`) | `src/apps/montagem/router/slugs.js` (`ABA_DO_SLUG`) |
| `/producao` | `/producao/resumo` (aba `producao`) | `src/apps/montagem/router/slugs.js` (`ABA_DO_SLUG`) |
| `/producao-configuracoes` | `/producao/resumo` (aba `producao`) | `src/apps/montagem/router/slugs.js` (`ABA_DO_SLUG`) |
| `/producao-faixas` | `/producao/resumo` (aba `producao`) | `src/apps/montagem/router/slugs.js` (`ABA_DO_SLUG`) |
| `/producao-lancamento` | `/producao/resumo` (aba `producao`) | `src/apps/montagem/router/slugs.js` (`ABA_DO_SLUG`) |
| `/producao-painel` | `/producao/resumo` (aba `producao`) | `src/apps/montagem/router/slugs.js` (`ABA_DO_SLUG`) |
| `/producao-premiacao` | `/producao/resumo` (aba `producao`) | `src/apps/montagem/router/slugs.js` (`ABA_DO_SLUG`) |
| `/montagem/<nome antigo>` | o endereço novo da mesma tela | `src/router/rotas.js` (função `Antigo`) |

## Abas sem rota

Abas que existem em `abas.js` ou em `slugs.js` mas não têm linha em `rotas.js` (não abrem tela).

| Aba | Título | Nome em slugs.js | Achada em | No menu? | Observação |
|---|---|---|---|---|---|
| `celrep` | App da representante | `app-representante` | `slugs.js` | não | o endereço desvia para `"/apps"` (rotas.js linha 227) |
| `dircontas` | Contas das representantes | (sem nome) | `abas.js` | não | — |

## Arquivos de pages/ sem rota

Arquivos dentro de `pages/` que nenhuma rota abre direto. A maioria é PARTE de outra tela (bloco, janela, aba interna): a coluna "Quem importa" diz qual. Os marcados **NINGUÉM IMPORTA** podem ser tela antiga ou duplicada: confirme antes de usar ou de apagar.

### Ninguém importa (14)

| Arquivo |
|---|
| `src/apps/montagem/pages/CelularRepresentante.js` |
| `src/apps/montagem/pages/ConsolidadoFaturamento.js` |
| `src/apps/montagem/pages/ContasAcesso.js` |
| `src/apps/montagem/pages/Expositores.js` |
| `src/apps/montagem/pages/KitNovo.js` |
| `src/apps/montagem/pages/MarcusExtratos.js` |
| `src/apps/montagem/pages/PagasPorDia.js` |
| `src/apps/montagem/pages/SepararPecas.js` |
| `src/apps/montagem/pages/SimuladorPix.js` |
| `src/apps/montagem/pages/avaliacoes/Visao.js` |
| `src/apps/montagem/pages/cp/Destinos.js` |
| `src/apps/montagem/pages/link-pagamento/Historico.js` |
| `src/apps/montagem/pages/pf/PontualPainel.js` |
| `src/apps/montagem/pages/trafego/Criativos.js` |

### Parte de outra tela (151)

| Arquivo | Quem importa (até 3) | Total |
|---|---|---|
| `src/apps/montagem/pages/Acessos.js` | `src/apps/montagem/pages/AcessosAutorizacoes.js` | 1 |
| `src/apps/montagem/pages/AcessosPessoas.js` | `src/apps/montagem/pages/AcessosAutorizacoes.js` | 1 |
| `src/apps/montagem/pages/ComissoesKitNovo.js` | `src/apps/montagem/pages/Comissoes.js` | 1 |
| `src/apps/montagem/pages/Config.js` | `src/apps/montagem/pages/ComissoesTodos.js`, `src/apps/montagem/pages/ConfiguradorGeral.js` | 2 |
| `src/apps/montagem/pages/ConfigAvisos.js` | `src/apps/montagem/pages/AcessosAutorizacoes.js`, `src/apps/montagem/pages/ConfiguradorGeral.js` | 2 |
| `src/apps/montagem/pages/ConfigContas.js` | `src/apps/montagem/pages/Caixa.js` | 1 |
| `src/apps/montagem/pages/ContasPagarDiario.js` | `src/apps/montagem/pages/ContasPagar.js` | 1 |
| `src/apps/montagem/pages/Faturamento.js` | `src/apps/montagem/pages/PrevisaoFaturamento.js` | 1 |
| `src/apps/montagem/pages/FinFamiliarResumo.js` | `src/apps/montagem/pages/FinFamiliarSocios.js` | 1 |
| `src/apps/montagem/pages/FolhaFuncionarias.js` | `src/apps/montagem/pages/ContasPagarEmpresa.js` | 1 |
| `src/apps/montagem/pages/MarcusPessoal.js` | `src/apps/montagem/pages/MarcusExtratos.js` | 1 |
| `src/apps/montagem/pages/PagamentoJoias.js` | `src/apps/montagem/pages/rh/JoiasVisao.js` | 1 |
| `src/apps/montagem/pages/RegrasConsignado.js` | `src/apps/montagem/pages/ConfigRepresentantes.js` | 1 |
| `src/apps/montagem/pages/RegrasPix.js` | `src/apps/montagem/pages/ContasRepresentantes.js` | 1 |
| `src/apps/montagem/pages/Revendedoras.js` | `src/apps/montagem/pages/BaseRevendedoras.js` | 1 |
| `src/apps/montagem/pages/avaliacoes/Configurador.js` | `src/apps/montagem/pages/Avaliacoes.js` | 1 |
| `src/apps/montagem/pages/avaliacoes/Funcionarios.js` | `src/apps/montagem/pages/avaliacoes/Tabelas.js` | 1 |
| `src/apps/montagem/pages/avaliacoes/KitsMontadoras.js` | `src/apps/montagem/pages/Avaliacoes.js` | 1 |
| `src/apps/montagem/pages/avaliacoes/KitsMontagem.js` | `src/apps/montagem/pages/avaliacoes/KitsMontadoras.js` | 1 |
| `src/apps/montagem/pages/avaliacoes/Representantes.js` | `src/apps/montagem/pages/avaliacoes/Tabelas.js` | 1 |
| `src/apps/montagem/pages/avaliacoes/Tabelas.js` | `src/apps/montagem/pages/Avaliacoes.js` | 1 |
| `src/apps/montagem/pages/avaliacoes/visual.js` | `src/apps/montagem/pages/avaliacoes/Configurador.js`, `src/apps/montagem/pages/avaliacoes/Funcionarios.js`, `src/apps/montagem/pages/avaliacoes/KitsMontagem.js` | 6 |
| `src/apps/montagem/pages/cadastro/DesCampanhas.js` | `src/apps/montagem/pages/DesempenhoCadastro.js` | 1 |
| `src/apps/montagem/pages/cadastro/DesFunil.js` | `src/apps/montagem/pages/DesempenhoCadastro.js`, `src/apps/montagem/pages/cadastro/DesCampanhas.js` | 2 |
| `src/apps/montagem/pages/cadastro/DesMetricas.js` | `src/apps/montagem/pages/DesempenhoCadastro.js` | 1 |
| `src/apps/montagem/pages/cadastro/DesOrigem.js` | `src/apps/montagem/pages/DesempenhoCadastro.js` | 1 |
| `src/apps/montagem/pages/cadastro/DesRegistros.js` | `src/apps/montagem/pages/DesempenhoCadastro.js` | 1 |
| `src/apps/montagem/pages/cadastro/des-comum.js` | `src/apps/montagem/pages/DesempenhoCadastro.js`, `src/apps/montagem/pages/cadastro/DesCampanhas.js`, `src/apps/montagem/pages/cadastro/DesFunil.js` | 6 |
| `src/apps/montagem/pages/cadpecas/Banho.js` | `src/apps/montagem/pages/CadastroPecas.js` | 1 |
| `src/apps/montagem/pages/cadpecas/Calculadora.js` | `src/apps/montagem/pages/CadastroPecas.js` | 1 |
| `src/apps/montagem/pages/cadpecas/Compras.js` | `src/apps/montagem/pages/CadastroPecas.js` | 1 |
| `src/apps/montagem/pages/cadpecas/Controle.js` | `src/apps/montagem/pages/CadastroPecas.js` | 1 |
| `src/apps/montagem/pages/cadpecas/Faturas.js` | `src/apps/montagem/pages/CadastroPecas.js` | 1 |
| `src/apps/montagem/pages/cadpecas/Lotes.js` | `src/apps/montagem/pages/CadastroPecas.js` | 1 |
| `src/apps/montagem/pages/cadpecas/Outras.js` | `src/apps/montagem/pages/CadastroPecas.js` | 1 |
| `src/apps/montagem/pages/cadpecas/Pecas.js` | `src/apps/montagem/pages/CadastroPecas.js` | 1 |
| `src/apps/montagem/pages/cadpecas/Pedidos.js` | `src/apps/montagem/pages/CadastroPecas.js`, `src/apps/montagem/pages/cadpecas/Controle.js`, `src/apps/montagem/pages/cadpecas/Faturas.js` | 3 |
| `src/apps/montagem/pages/cadpecas/PrazosForn.js` | `src/apps/montagem/pages/cadpecas/Pedidos.js` | 1 |
| `src/apps/montagem/pages/cadpecas/Solicitacoes.js` | `src/apps/montagem/pages/CadastroPecas.js` | 1 |
| `src/apps/montagem/pages/cadpecas/visualCad.js` | `src/apps/montagem/pages/cadpecas/Banho.js`, `src/apps/montagem/pages/cadpecas/Calculadora.js`, `src/apps/montagem/pages/cadpecas/Compras.js` | 10 |
| `src/apps/montagem/pages/compras/CompraCadastros.js` | `src/apps/montagem/pages/compras/EstoqueCadastros.js` | 1 |
| `src/apps/montagem/pages/compras/CompraConfig.js` | `src/apps/montagem/pages/compras/EstoqueCadastros.js` | 1 |
| `src/apps/montagem/pages/compras/Compras.js` | `src/apps/montagem/pages/compras/PainelComprasEstoque.js` | 1 |
| `src/apps/montagem/pages/compras/EstoqueCadastros.js` | `src/apps/montagem/pages/ComprasEstoque.js`, `src/apps/montagem/pages/MaterialGrafico.js` | 2 |
| `src/apps/montagem/pages/compras/EstoqueMaterial.js` | `src/apps/montagem/pages/compras/EstoqueCadastros.js`, `src/apps/montagem/pages/compras/PainelComprasEstoque.js` | 2 |
| `src/apps/montagem/pages/compras/EstoqueMovimentos.js` | `src/apps/montagem/pages/compras/EstoqueCadastros.js` | 1 |
| `src/apps/montagem/pages/compras/EstoqueSolicitacoes.js` | `src/apps/montagem/pages/compras/EstoqueCadastros.js` | 1 |
| `src/apps/montagem/pages/compras/PainelComprasEstoque.js` | `src/apps/montagem/pages/ComprasEstoque.js` | 1 |
| `src/apps/montagem/pages/compras/TabelaPrecos.js` | `src/apps/montagem/pages/ComprasEstoque.js`, `src/apps/montagem/pages/MaterialGrafico.js` | 2 |
| `src/apps/montagem/pages/compras/VisaoCompras.js` | `src/apps/montagem/pages/ComprasEstoque.js` | 1 |
| `src/apps/montagem/pages/compras/janelas.js` | `src/apps/montagem/pages/MaterialGrafico.js`, `src/apps/montagem/pages/compras/Compras.js`, `src/apps/montagem/pages/compras/EstoqueMaterial.js` | 5 |
| `src/apps/montagem/pages/compras/pecas.js` | `src/apps/montagem/pages/ArrumarDevmaster.js`, `src/apps/montagem/pages/AtividadesFinanceiro.js`, `src/apps/montagem/pages/Denuncias.js` | 18 |
| `src/apps/montagem/pages/compras/visualCompras.js` | `src/apps/montagem/pages/Encomendas.js`, `src/apps/montagem/pages/EncomendasTelas.js`, `src/apps/montagem/pages/cadpecas/Calculadora.js` | 35 |
| `src/apps/montagem/pages/dp/PedidosKit.js` | `src/apps/montagem/pages/DirecionarPix.js` | 1 |
| `src/apps/montagem/pages/encomendas/Atencao.js` | `src/apps/montagem/pages/Encomendas.js`, `src/apps/montagem/pages/SepararPecas.js`, `src/apps/montagem/pages/encomendas/FichaPedido.js` | 3 |
| `src/apps/montagem/pages/encomendas/FichaPedido.js` | `src/apps/montagem/pages/Encomendas.js` | 1 |
| `src/apps/montagem/pages/encomendas/Joao.js` | `src/apps/montagem/pages/encomendas/Quadro.js` | 1 |
| `src/apps/montagem/pages/encomendas/LinkPedido.js` | `src/apps/montagem/pages/Encomendas.js` | 1 |
| `src/apps/montagem/pages/encomendas/ListagemDia.js` | `src/apps/montagem/pages/Agendamento.js`, `src/apps/montagem/pages/AgendamentoPainel.js`, `src/apps/montagem/pages/EncomendasTelas.js` | 3 |
| `src/apps/montagem/pages/encomendas/NovaSolicitacao.js` | `src/apps/montagem/pages/Encomendas.js` | 1 |
| `src/apps/montagem/pages/encomendas/PlanilhaRev.js` | `src/apps/montagem/pages/Encomendas.js`, `src/apps/montagem/pages/encomendas/Top50.js` | 2 |
| `src/apps/montagem/pages/encomendas/Quadro.js` | `src/apps/montagem/pages/Encomendas.js`, `src/apps/montagem/pages/EncomendasTelas.js`, `src/apps/montagem/pages/encomendas/FichaPedido.js` | 4 |
| `src/apps/montagem/pages/encomendas/Regras.js` | `src/apps/montagem/pages/EncomendasTelas.js` | 1 |
| `src/apps/montagem/pages/encomendas/Top50.js` | `src/apps/montagem/pages/EncomendasTelas.js` | 1 |
| `src/apps/montagem/pages/encomendas/janelas.js` | `src/apps/montagem/pages/Encomendas.js`, `src/apps/montagem/pages/EncomendasTelas.js`, `src/apps/montagem/pages/encomendas/Top50.js` | 3 |
| `src/apps/montagem/pages/encomendas/visual.js` | `src/apps/montagem/pages/BipagemEnvio.js`, `src/apps/montagem/pages/Encomendas.js`, `src/apps/montagem/pages/EncomendasTelas.js` | 13 |
| `src/apps/montagem/pages/equipes/Departamentos.js` | `src/apps/montagem/pages/Equipes.js` | 1 |
| `src/apps/montagem/pages/equipes/Historico.js` | `src/apps/montagem/pages/Equipes.js` | 1 |
| `src/apps/montagem/pages/equipes/JanelaDepto.js` | `src/apps/montagem/pages/Equipes.js` | 1 |
| `src/apps/montagem/pages/equipes/Organograma.js` | `src/apps/montagem/pages/Equipes.js` | 1 |
| `src/apps/montagem/pages/equipes/Pessoas.js` | `src/apps/montagem/pages/Equipes.js` | 1 |
| `src/apps/montagem/pages/equipes/pecas.js` | `src/apps/montagem/pages/Equipes.js`, `src/apps/montagem/pages/equipes/Departamentos.js`, `src/apps/montagem/pages/equipes/Historico.js` | 6 |
| `src/apps/montagem/pages/estoque-sorelly/Configurador.js` | `src/apps/montagem/pages/EstoqueSorelly.js` | 1 |
| `src/apps/montagem/pages/estoque-sorelly/Preenchimento.js` | `src/apps/montagem/pages/EstoqueSorelly.js` | 1 |
| `src/apps/montagem/pages/estoque-sorelly/Resumo.js` | `src/apps/montagem/pages/EstoqueSorelly.js` | 1 |
| `src/apps/montagem/pages/estoque-sorelly/graficos.js` | `src/apps/montagem/pages/estoque-sorelly/Resumo.js` | 1 |
| `src/apps/montagem/pages/estoque-sorelly/util.js` | `src/apps/montagem/pages/estoque-sorelly/Configurador.js`, `src/apps/montagem/pages/estoque-sorelly/Preenchimento.js`, `src/apps/montagem/pages/estoque-sorelly/Resumo.js` | 4 |
| `src/apps/montagem/pages/expositores/Clientes.js` | `src/apps/montagem/pages/ExpositoresModulo.js` | 1 |
| `src/apps/montagem/pages/expositores/Danificados.js` | `src/apps/montagem/pages/ExpositoresModulo.js` | 1 |
| `src/apps/montagem/pages/expositores/Entregas.js` | `src/apps/montagem/pages/ExpositoresModulo.js` | 1 |
| `src/apps/montagem/pages/expositores/EstoqueEx.js` | `src/apps/montagem/pages/ExpositoresModulo.js` | 1 |
| `src/apps/montagem/pages/expositores/Fila.js` | `src/apps/montagem/pages/ExpositoresModulo.js` | 1 |
| `src/apps/montagem/pages/expositores/FotosKitNovo.js` | `src/apps/montagem/pages/ExpositoresModulo.js` | 1 |
| `src/apps/montagem/pages/expositores/Quadro.js` | `src/apps/montagem/pages/ExpositoresModulo.js` | 1 |
| `src/apps/montagem/pages/expositores/SemKit.js` | `src/apps/montagem/pages/ExpositoresModulo.js` | 1 |
| `src/apps/montagem/pages/expositores/comum.js` | `src/apps/montagem/pages/expositores/Clientes.js`, `src/apps/montagem/pages/expositores/Danificados.js`, `src/apps/montagem/pages/expositores/Entregas.js` | 9 |
| `src/apps/montagem/pages/expositores/janelas.js` | `src/apps/montagem/pages/expositores/Fila.js`, `src/apps/montagem/pages/expositores/Quadro.js` | 2 |
| `src/apps/montagem/pages/fila-montagem/Montar.js` | `src/apps/montagem/pages/Painel.js` | 1 |
| `src/apps/montagem/pages/fila-montagem/comum.js` | `src/apps/montagem/pages/ProdutividadeMontagem.js`, `src/apps/montagem/pages/fila-montagem/Montar.js` | 2 |
| `src/apps/montagem/pages/fiscal/Configuracao.js` | `src/apps/montagem/pages/Fiscal.js` | 1 |
| `src/apps/montagem/pages/fiscal/ContasAnual.js` | `src/apps/montagem/pages/Fiscal.js` | 1 |
| `src/apps/montagem/pages/fiscal/EntradasSaidas.js` | `src/apps/montagem/pages/Fiscal.js`, `src/apps/montagem/pages/fiscal/Painel.js` | 2 |
| `src/apps/montagem/pages/fiscal/Painel.js` | `src/apps/montagem/pages/Fiscal.js` | 1 |
| `src/apps/montagem/pages/fiscal/VisaoGeral.js` | `src/apps/montagem/pages/fiscal/Painel.js` | 1 |
| `src/apps/montagem/pages/fiscal/visual.js` | `src/apps/montagem/pages/Fiscal.js`, `src/apps/montagem/pages/fiscal/Configuracao.js`, `src/apps/montagem/pages/fiscal/ContasAnual.js` | 6 |
| `src/apps/montagem/pages/indicacoes/FunilHistorico.js` | `src/apps/montagem/pages/Indicacoes.js` | 1 |
| `src/apps/montagem/pages/indicacoes/ResgatesMoedas.js` | `src/apps/montagem/pages/Indicacoes.js` | 1 |
| `src/apps/montagem/pages/indicacoes/visual.js` | `src/apps/montagem/pages/avaliacoes/Configurador.js`, `src/apps/montagem/pages/avaliacoes/Funcionarios.js`, `src/apps/montagem/pages/avaliacoes/KitsMontagem.js` | 15 |
| `src/apps/montagem/pages/link-pagamento/Analises.js` | `src/apps/montagem/pages/LinkPagamento.js` | 1 |
| `src/apps/montagem/pages/link-pagamento/Comprovantes.js` | `src/apps/montagem/pages/LinkPagamento.js` | 1 |
| `src/apps/montagem/pages/link-pagamento/Descontados.js` | `src/apps/montagem/pages/LinkPagamento.js` | 1 |
| `src/apps/montagem/pages/link-pagamento/ImportarEsitef.js` | `src/apps/montagem/pages/link-pagamento/Solicitacoes.js` | 1 |
| `src/apps/montagem/pages/link-pagamento/Meios.js` | `src/apps/montagem/pages/LinkPagamento.js` | 1 |
| `src/apps/montagem/pages/link-pagamento/Representantes.js` | `src/apps/montagem/pages/LinkPagamento.js` | 1 |
| `src/apps/montagem/pages/link-pagamento/Resumo.js` | `src/apps/montagem/pages/LinkRelatorio.js`, `src/apps/montagem/pages/link-pagamento/Analises.js` | 2 |
| `src/apps/montagem/pages/link-pagamento/Solicitacoes.js` | `src/apps/montagem/pages/LinkPagamento.js` | 1 |
| `src/apps/montagem/pages/link-pagamento/Taxas.js` | `src/apps/montagem/pages/LinkPagamento.js` | 1 |
| `src/apps/montagem/pages/link-pagamento/visual.js` | `src/apps/montagem/pages/link-pagamento/Analises.js`, `src/apps/montagem/pages/link-pagamento/Comprovantes.js`, `src/apps/montagem/pages/link-pagamento/Descontados.js` | 8 |
| `src/apps/montagem/pages/marketing/Divulgacao.js` | `src/apps/montagem/pages/Marketing.js` | 1 |
| `src/apps/montagem/pages/marketing/Erros.js` | `src/apps/montagem/pages/Marketing.js` | 1 |
| `src/apps/montagem/pages/marketing/Mural.js` | `src/apps/montagem/pages/Marketing.js` | 1 |
| `src/apps/montagem/pages/marketing/Visao.js` | `src/apps/montagem/pages/Marketing.js` | 1 |
| `src/apps/montagem/pages/marketing/comum.js` | `src/apps/montagem/pages/Marketing.js`, `src/apps/montagem/pages/marketing/Divulgacao.js`, `src/apps/montagem/pages/marketing/Erros.js` | 5 |
| `src/apps/montagem/pages/pedidos/pecas-ui.js` | `src/apps/montagem/pages/cadpecas/Solicitacoes.js` | 1 |
| `src/apps/montagem/pages/pf/JanelaEditarPag.js` | `src/apps/montagem/pages/pf/Lancamentos.js` | 1 |
| `src/apps/montagem/pages/pf/JanelaLancarPag.js` | `src/apps/montagem/pages/pf/Resumo.js` | 1 |
| `src/apps/montagem/pages/pf/Limite.js` | `src/apps/montagem/pages/pf/NegAbas.js`, `src/apps/montagem/pages/pf/Resumo.js` | 2 |
| `src/apps/montagem/pages/pf/Negociacoes.js` | `src/apps/montagem/pages/pf/NegAbas.js`, `src/apps/montagem/pages/pf/Resumo.js` | 2 |
| `src/apps/montagem/pages/pf/PixConferenciaBloco.js` | `src/apps/montagem/pages/pf/Resumo.js` | 1 |
| `src/apps/montagem/pages/pf/Point.js` | `src/apps/montagem/pages/pf/Negociacoes.js` | 1 |
| `src/apps/montagem/pages/pf/PorPedido.js` | `src/apps/montagem/pages/pf/JanelaLancarPag.js`, `src/apps/montagem/pages/pf/Lancamentos.js` | 2 |
| `src/apps/montagem/pages/pf/extrato.js` | `src/apps/montagem/pages/pf/Lancamentos.js`, `src/apps/montagem/pages/pf/Maquininha.js` | 2 |
| `src/apps/montagem/pages/pf/mq-extrato.js` | `src/apps/montagem/pages/pf/Maquininha.js`, `src/server/acerto-link.js` | 2 |
| `src/apps/montagem/pages/pf/ui.js` | `src/apps/montagem/pages/pf/Fornecedores.js`, `src/apps/montagem/pages/pf/JanelaEditarPag.js`, `src/apps/montagem/pages/pf/JanelaLancarPag.js` | 14 |
| `src/apps/montagem/pages/preferencias-kit/Analise.js` | `src/apps/montagem/pages/PreferenciasKit.js` | 1 |
| `src/apps/montagem/pages/preferencias-kit/Formulario.js` | `src/apps/montagem/pages/PreferenciasKit.js` | 1 |
| `src/apps/montagem/pages/preferencias-kit/Importar.js` | `src/apps/montagem/pages/PreferenciasKit.js` | 1 |
| `src/apps/montagem/pages/preferencias-kit/Revendedoras.js` | `src/apps/montagem/pages/PreferenciasKit.js` | 1 |
| `src/apps/montagem/pages/preferencias-kit/resposta.js` | `src/apps/montagem/pages/preferencias-kit/Formulario.js`, `src/apps/montagem/pages/preferencias-kit/Revendedoras.js` | 2 |
| `src/apps/montagem/pages/preferencias-kit/visual.js` | `src/apps/montagem/pages/PreferenciasKit.js`, `src/apps/montagem/pages/fila-montagem/Montar.js`, `src/apps/montagem/pages/preferencias-kit/Analise.js` | 7 |
| `src/apps/montagem/pages/producao/ProdConfig.js` | `src/apps/montagem/pages/Producao.js` | 1 |
| `src/apps/montagem/pages/producao/ProdControleCasa.js` | `src/apps/montagem/pages/Producao.js` | 1 |
| `src/apps/montagem/pages/producao/ProdEditorDia.js` | `src/apps/montagem/pages/producao/ProdGrade.js` | 1 |
| `src/apps/montagem/pages/producao/ProdExterna.js` | `src/apps/montagem/pages/Producao.js` | 1 |
| `src/apps/montagem/pages/producao/ProdGrade.js` | `src/apps/montagem/pages/Producao.js` | 1 |
| `src/apps/montagem/pages/producao/ProdModelos.js` | `src/apps/montagem/pages/producao/ProdGrade.js` | 1 |
| `src/apps/montagem/pages/producao/ProdNotas.js` | `src/apps/montagem/pages/Producao.js` | 1 |
| `src/apps/montagem/pages/producao/ProdPagamentoProducao.js` | `src/apps/montagem/pages/Producao.js` | 1 |
| `src/apps/montagem/pages/producao/ProdPagamentos.js` | `src/apps/montagem/App.js`, `src/apps/montagem/pages/Producao.js`, `src/apps/montagem/pages/producao/ProdPagamentoProducao.js` | 3 |
| `src/apps/montagem/pages/producao/ProdPecasCasa.js` | `src/apps/montagem/pages/producao/ProdExterna.js` | 1 |
| `src/apps/montagem/pages/producao/visualProd.js` | `src/apps/montagem/pages/Producao.js`, `src/apps/montagem/pages/producao/ProdConfig.js`, `src/apps/montagem/pages/producao/ProdControleCasa.js` | 11 |
| `src/apps/montagem/pages/rh/FichaExperiencia.js` | `src/apps/montagem/pages/RH.js` | 1 |
| `src/apps/montagem/pages/rh/FormularioFunc.js` | `src/apps/montagem/pages/RH.js` | 1 |
| `src/apps/montagem/pages/rh/JoiasVisao.js` | `src/apps/montagem/pages/RH.js` | 1 |
| `src/apps/montagem/pages/rh/SalarioVisao.js` | `src/apps/montagem/pages/RH.js` | 1 |
| `src/apps/montagem/pages/trafego/ConfigTrafego.js` | `src/apps/montagem/pages/ConfiguradorGeral.js` | 1 |
| `src/apps/montagem/pages/trafego/DiaADia.js` | `src/apps/montagem/pages/Trafego.js` | 1 |
| `src/apps/montagem/pages/trafego/Investimento.js` | `src/apps/montagem/pages/Trafego.js` | 1 |
| `src/apps/montagem/pages/trafego/MesAMes.js` | `src/apps/montagem/pages/Trafego.js` | 1 |
| `src/apps/montagem/pages/trafego/comum.js` | `src/apps/montagem/pages/Criativos.js`, `src/apps/montagem/pages/FotosCatalogo.js`, `src/apps/montagem/pages/Inadimplencia.js` | 19 |
| `src/apps/kits-novos/pages/RepCadastro.js` | `src/apps/montagem/pages/KitsNovosEmbutido.js` | 1 |

## Páginas do Next fora do roteador

Endereços atendidos direto pelo Next (`app/**/page.js`). A linha "(qualquer endereço)" é a casca que monta todas as telas acima.

| Endereço | Arquivo |
|---|---|
| `/(qualquer endereço)` | `app/[[...slug]]/page.js` |
| `/canal-de-etica` | `app/canal-de-etica/page.js` |
| `/meus-dados/[codigo]` | `app/meus-dados/[codigo]/page.js` |
| `/pedido/[codigo]` | `app/pedido/[codigo]/page.js` |
| `/pedido/[codigo]/tabela` | `app/pedido/[codigo]/tabela/page.js` |
| `/pesquisa-de-clima` | `app/pesquisa-de-clima/page.js` |

## Rotas do servidor

Uma linha por `route.js` de `app/`. O código de cada uma costuma chamar `src/server/*`.

| Endereço | Métodos | Arquivo |
|---|---|---|
| `/acerto/[token]/comprovante/[id]` | GET | `app/acerto/[token]/comprovante/[id]/route.js` |
| `/acerto/[token]` | GET | `app/acerto/[token]/route.js` |
| `/api/acertos-previstos` | GET | `app/api/acertos-previstos/route.js` |
| `/api/agenda-revendedoras` | GET | `app/api/agenda-revendedoras/route.js` |
| `/api/anexos/[key]` | GET | `app/api/anexos/[key]/route.js` |
| `/api/anexos` | POST | `app/api/anexos/route.js` |
| `/api/app-rep/pedidos-data/[id]` | PATCH | `app/api/app-rep/pedidos-data/[id]/route.js` |
| `/api/app-rep/pedidos-data` | GET | `app/api/app-rep/pedidos-data/route.js` |
| `/api/app-rep/sincronizar` | GET, POST | `app/api/app-rep/sincronizar/route.js` |
| `/api/arrumar-devmaster` | GET | `app/api/arrumar-devmaster/route.js` |
| `/api/atividades-fin` | GET | `app/api/atividades-fin/route.js` |
| `/api/auth/cadastro` | POST | `app/api/auth/cadastro/route.js` |
| `/api/auth/eu` | GET | `app/api/auth/eu/route.js` |
| `/api/auth/login` | POST | `app/api/auth/login/route.js` |
| `/api/automatico/aquecer-revendedoras` | GET, POST | `app/api/automatico/aquecer-revendedoras/route.js` |
| `/api/automatico/custo` | GET, POST | `app/api/automatico/custo/route.js` |
| `/api/automatico/dia` | GET, POST | `app/api/automatico/dia/route.js` |
| `/api/automatico/fotos-dm` | GET, POST | `app/api/automatico/fotos-dm/route.js` |
| `/api/automatico/reposicao` | GET, POST | `app/api/automatico/reposicao/route.js` |
| `/api/cadastro-fin` | GET | `app/api/cadastro-fin/route.js` |
| `/api/chat/conv` | POST | `app/api/chat/conv/route.js` |
| `/api/chat/mesclar` | POST | `app/api/chat/mesclar/route.js` |
| `/api/chat/midia/[key]` | GET | `app/api/chat/midia/[key]/route.js` |
| `/api/chat/midia` | POST | `app/api/chat/midia/route.js` |
| `/api/chat/msg/[id]` | PATCH | `app/api/chat/msg/[id]/route.js` |
| `/api/chat/msg` | POST | `app/api/chat/msg/route.js` |
| `/api/chat/sync` | GET | `app/api/chat/sync/route.js` |
| `/api/clientes-busca` | GET | `app/api/clientes-busca/route.js` |
| `/api/clima/publico` | GET, POST | `app/api/clima/publico/route.js` |
| `/api/clima` | GET, POST | `app/api/clima/route.js` |
| `/api/compras/avisos` | POST | `app/api/compras/avisos/route.js` |
| `/api/compras/conversa` | GET, POST | `app/api/compras/conversa/route.js` |
| `/api/condicionais-kits` | GET | `app/api/condicionais-kits/route.js` |
| `/api/consignado/ingest/acerto` | POST | `app/api/consignado/ingest/acerto/route.js` |
| `/api/consignado/ingest/cancelar` | POST | `app/api/consignado/ingest/cancelar/route.js` |
| `/api/consignado/ingest/comissoes/entrega` | POST | `app/api/consignado/ingest/comissoes/entrega/route.js` |
| `/api/consignado/ingest/comissoes/gasolina-visto` | POST | `app/api/consignado/ingest/comissoes/gasolina-visto/route.js` |
| `/api/consignado/ingest/comissoes/km` | POST | `app/api/consignado/ingest/comissoes/km/route.js` |
| `/api/consignado/ingest/comissoes` | GET | `app/api/consignado/ingest/comissoes/route.js` |
| `/api/consignado/ingest/contexto` | GET | `app/api/consignado/ingest/contexto/route.js` |
| `/api/consignado/ingest/formas-pagamento` | GET | `app/api/consignado/ingest/formas-pagamento/route.js` |
| `/api/consignado/ingest/movimento` | POST | `app/api/consignado/ingest/movimento/route.js` |
| `/api/consignado/ingest/perfil` | GET, PUT | `app/api/consignado/ingest/perfil/route.js` |
| `/api/consignado/ingest/pre-acerto` | PUT | `app/api/consignado/ingest/pre-acerto/route.js` |
| `/api/contas-dm` | GET | `app/api/contas-dm/route.js` |
| `/api/contas-receber/antecipados` | GET, POST | `app/api/contas-receber/antecipados/route.js` |
| `/api/contas-receber/comprovantes` | GET, POST | `app/api/contas-receber/comprovantes/route.js` |
| `/api/contas-receber/cruzamento` | GET, POST | `app/api/contas-receber/cruzamento/route.js` |
| `/api/contas-receber/revendedoras` | GET | `app/api/contas-receber/revendedoras/route.js` |
| `/api/contas-receber` | GET | `app/api/contas-receber/route.js` |
| `/api/contas-receber/titulos` | GET | `app/api/contas-receber/titulos/route.js` |
| `/api/contas-receber/venda-revendedora` | GET | `app/api/contas-receber/venda-revendedora/route.js` |
| `/api/contas-receber/venda` | GET | `app/api/contas-receber/venda/route.js` |
| `/api/contas/[id]` | PATCH | `app/api/contas/[id]/route.js` |
| `/api/contas` | GET | `app/api/contas/route.js` |
| `/api/copia-navegador` | POST | `app/api/copia-navegador/route.js` |
| `/api/criativos/upload` | POST | `app/api/criativos/upload/route.js` |
| `/api/denuncias/[id]` | PATCH | `app/api/denuncias/[id]/route.js` |
| `/api/denuncias/consulta` | POST | `app/api/denuncias/consulta/route.js` |
| `/api/denuncias` | GET, POST | `app/api/denuncias/route.js` |
| `/api/devmaster2/[codigo]` | GET | `app/api/devmaster2/[codigo]/route.js` |
| `/api/devmaster2/revendedoras-com-kit-ativo` | GET | `app/api/devmaster2/revendedoras-com-kit-ativo/route.js` |
| `/api/devmaster2` | GET | `app/api/devmaster2/route.js` |
| `/api/devmaster/revendedoras` | GET | `app/api/devmaster/revendedoras/route.js` |
| `/api/devmaster/sincronizar-internas` | POST | `app/api/devmaster/sincronizar-internas/route.js` |
| `/api/devmaster/vendedores` | GET | `app/api/devmaster/vendedores/route.js` |
| `/api/encomendas/casar` | POST | `app/api/encomendas/casar/route.js` |
| `/api/encomendas/link/confirmar` | POST | `app/api/encomendas/link/confirmar/route.js` |
| `/api/encomendas/link/publicar` | POST | `app/api/encomendas/link/publicar/route.js` |
| `/api/encomendas/link/recebidos` | GET | `app/api/encomendas/link/recebidos/route.js` |
| `/api/encomendas/link/reivindicar` | POST | `app/api/encomendas/link/reivindicar/route.js` |
| `/api/encomendas/link/retorno` | GET | `app/api/encomendas/link/retorno/route.js` |
| `/api/encomendas/link` | GET, POST | `app/api/encomendas/link/route.js` |
| `/api/encomendas/link/separado` | POST | `app/api/encomendas/link/separado/route.js` |
| `/api/encomendas/pecas/foto` | GET | `app/api/encomendas/pecas/foto/route.js` |
| `/api/encomendas/pecas` | GET | `app/api/encomendas/pecas/route.js` |
| `/api/encomendas/ranking` | GET | `app/api/encomendas/ranking/route.js` |
| `/api/encomendas/venda-app` | GET | `app/api/encomendas/venda-app/route.js` |
| `/api/encomendas/vendas` | GET | `app/api/encomendas/vendas/route.js` |
| `/api/estado/[modulo]` | GET, PUT | `app/api/estado/[modulo]/route.js` |
| `/api/estado` | GET | `app/api/estado/route.js` |
| `/api/expositores/revendedoras` | GET | `app/api/expositores/revendedoras/route.js` |
| `/api/faturamento/dia` | POST | `app/api/faturamento/dia/route.js` |
| `/api/fotos/dm` | GET | `app/api/fotos/dm/route.js` |
| `/api/funcionarias` | GET | `app/api/funcionarias/route.js` |
| `/api/indicacoes/acao` | POST | `app/api/indicacoes/acao/route.js` |
| `/api/indicacoes/estado` | GET | `app/api/indicacoes/estado/route.js` |
| `/api/indicacoes/revendedoras` | GET | `app/api/indicacoes/revendedoras/route.js` |
| `/api/kit/preferences` | GET | `app/api/kit/preferences/route.js` |
| `/api/kits-atrasados` | GET | `app/api/kits-atrasados/route.js` |
| `/api/kommo/cadastro` | GET | `app/api/kommo/cadastro/route.js` |
| `/api/listagens/app/[id]/itens/[itemId]` | DELETE | `app/api/listagens/app/[id]/itens/[itemId]/route.js` |
| `/api/listagens/app/[id]/itens` | POST | `app/api/listagens/app/[id]/itens/route.js` |
| `/api/listagens/app` | GET, POST | `app/api/listagens/app/route.js` |
| `/api/metas/revendedoras` | GET | `app/api/metas/revendedoras/route.js` |
| `/api/meus-dados/[codigo]` | GET, POST | `app/api/meus-dados/[codigo]/route.js` |
| `/api/meus-dados` | GET, POST | `app/api/meus-dados/route.js` |
| `/api/modelos/indicacoes` | GET | `app/api/modelos/indicacoes/route.js` |
| `/api/montagem/analise` | GET | `app/api/montagem/analise/route.js` |
| `/api/montagem/bonus/regras` | GET, PUT | `app/api/montagem/bonus/regras/route.js` |
| `/api/montagem/bonus` | GET | `app/api/montagem/bonus/route.js` |
| `/api/montagem/equipe/[id]` | PATCH, DELETE | `app/api/montagem/equipe/[id]/route.js` |
| `/api/montagem/equipe` | GET, POST | `app/api/montagem/equipe/route.js` |
| `/api/montagem/fila` | GET | `app/api/montagem/fila/route.js` |
| `/api/montagem/registros/[id]` | PATCH | `app/api/montagem/registros/[id]/route.js` |
| `/api/montagem/registros` | GET, POST | `app/api/montagem/registros/route.js` |
| `/api/montagem/revendedoras/[id]/aneis` | GET | `app/api/montagem/revendedoras/[id]/aneis/route.js` |
| `/api/montagem/revendedoras/[id]` | GET | `app/api/montagem/revendedoras/[id]/route.js` |
| `/api/montagem/revendedoras/[id]/vendas` | GET | `app/api/montagem/revendedoras/[id]/vendas/route.js` |
| `/api/pedido-link/[codigo]/comprovante` | POST | `app/api/pedido-link/[codigo]/comprovante/route.js` |
| `/api/pedido-link/[codigo]/enviar` | POST | `app/api/pedido-link/[codigo]/enviar/route.js` |
| `/api/pedido-link/[codigo]/foto-pedido` | GET | `app/api/pedido-link/[codigo]/foto-pedido/route.js` |
| `/api/pedido-link/[codigo]/foto` | POST | `app/api/pedido-link/[codigo]/foto/route.js` |
| `/api/pedido-link/[codigo]/mais` | POST | `app/api/pedido-link/[codigo]/mais/route.js` |
| `/api/pedido-link/[codigo]/ok` | POST | `app/api/pedido-link/[codigo]/ok/route.js` |
| `/api/pedido-link/[codigo]/peca` | GET | `app/api/pedido-link/[codigo]/peca/route.js` |
| `/api/pedido-link/[codigo]` | GET | `app/api/pedido-link/[codigo]/route.js` |
| `/api/perfil/equipe` | GET | `app/api/perfil/equipe/route.js` |
| `/api/perfil/eu` | PATCH | `app/api/perfil/eu/route.js` |
| `/api/perfil/pessoa/[id]` | PATCH | `app/api/perfil/pessoa/[id]/route.js` |
| `/api/perfil/senha` | PATCH | `app/api/perfil/senha/route.js` |
| `/api/pf/link` | POST | `app/api/pf/link/route.js` |
| `/api/pix-adiantados` | GET, POST | `app/api/pix-adiantados/route.js` |
| `/api/pos-vendas/contatos` | GET | `app/api/pos-vendas/contatos/route.js` |
| `/api/precos-pecas` | GET | `app/api/precos-pecas/route.js` |
| `/api/preferencias-app` | GET | `app/api/preferencias-app/route.js` |
| `/api/produtos-dm` | GET | `app/api/produtos-dm/route.js` |
| `/api/representante/avisos` | GET, POST | `app/api/representante/avisos/route.js` |
| `/api/representante/condicionais` | GET | `app/api/representante/condicionais/route.js` |
| `/api/representante/eu` | GET | `app/api/representante/eu/route.js` |
| `/api/representante/peca` | GET | `app/api/representante/peca/route.js` |
| `/api/representante/revendedoras` | GET | `app/api/representante/revendedoras/route.js` |
| `/api/representantes/painel` | GET | `app/api/representantes/painel/route.js` |
| `/api/revendedoras/[cod]` | GET | `app/api/revendedoras/[cod]/route.js` |
| `/api/revendedoras/[cod]/vendas` | GET | `app/api/revendedoras/[cod]/vendas/route.js` |
| `/api/revendedoras/dia` | POST | `app/api/revendedoras/dia/route.js` |
| `/api/revendedoras` | GET | `app/api/revendedoras/route.js` |
| `/api/rotina/itens/[id]` | PATCH, DELETE | `app/api/rotina/itens/[id]/route.js` |
| `/api/rotina/itens` | GET, POST | `app/api/rotina/itens/route.js` |
| `/api/rotina/registros` | GET, PUT | `app/api/rotina/registros/route.js` |
| `/api/saude` | GET | `app/api/saude/route.js` |
| `/f/[codigo]/c/[id]` | GET | `app/f/[codigo]/c/[id]/route.js` |
| `/f/[codigo]` | GET | `app/f/[codigo]/route.js` |
| `/f/cartao/[codigo]` | GET | `app/f/cartao/[codigo]/route.js` |

## Avisos do script

O que o script não conseguiu interpretar ou achou estranho. Lista vazia = tudo foi lido.

Nenhum aviso.
