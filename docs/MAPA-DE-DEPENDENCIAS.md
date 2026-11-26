# Mapa de dependências (25/11/2026)

Para que serve: antes de mexer num assunto, saber o que MAIS é afetado. Leia só a linha do seu assunto.
Para achar uma tela: `MAPA-DE-TELAS.md` (gerado por `node scripts/mapa-telas.mjs`).
Tudo aqui veio de leitura do código e dos documentos em 25/11/2026. O que não foi conferido está marcado **NÃO VERIFICADO**. Este mapa descreve o código: se o código mudar, atualize o mapa. Para REGRA de negócio vale o `CLAUDE.md` (seção 4): regra e código divergem? Não escolha um lado sozinho: registre em "Não alinhado" e, em dinheiro, jurídico, fiscal, trabalhista ou acesso, pergunte ao Marcus.

Atalhos de caminho usados neste arquivo:

| Escrito aqui | Caminho real |
|---|---|
| `domain/`, `pages/`, `components/`, `mobile/`, `lib/`, `state/`, `navigation/` | `src/apps/montagem/<pasta>/` |
| `server/` | `src/server/` |
| `api/` | `app/api/` |
| `KN/` | `src/apps/kits-novos/` |
| `regras/` | `docs/regras/` |

## 1. Fluxo da empresa

Fontes: `docs/negocio/FLUXO-DA-EMPRESA.md` (seção 5), `docs/negocio/INTEGRACAO-ENTRE-SETORES.md`, `docs/negocio/FLUXO-DE-COMPRA-DE-BRUTO.md` (seção 1).

```
VENDA (o kit)
Marketing e tráfego pago ─► leads ─► Cadastro de revendedoras ─► Kits novos
                                                                    │
                                   ┌────────────────────────────────┴───────────────┐
                                   ▼                                                ▼
                          Representante (listagem)                    Agendamento (marca o dia na empresa)
                                   │                                                │
                                   ▼                                                ▼
        Condicionais ─► Montagem ─► Bipagem ─► Retirada/entrega ─► ACERTO (na rua, pelo app; ou no Atendimento interno)
        (kit novo NÃO pega condicionais)                                │
                                                                        ▼
        Retorno à empresa ─► Bipagem confere ─► Agendamento confere o dinheiro ─► FINANCEIRO (fatura, concilia, recebe)
                                   │                                                │
                                   ├─► Garantia / Trocas (peça com defeito)         ├─► Comissões (representante, setores)
                                   └─► Inadimplência (não pagou ou faltou)          └─► Condicionais (guarda de volta)

PEÇA (o que entra no kit)
Compra de bruto ─► Banho (galvânica) ─► Cadastro de peças (peso, preço, etiqueta) ─► Produção ─► Montagem ─► (volta ao ciclo da venda)
        │                 │
        └─────────────────┴─► Financeiro › Fornecedores (pedido, negociação, pagamento, limite mensal)

APOIO
Encomendas e reposições ─► representantes e revendedoras      RH ─► pessoas, acessos, folha ─► todos os setores
```

## 2. Se mexer em X, leia e teste também Y

Uma linha por assunto. "Risco" diz o que quebra se errar: **dinheiro**, **jurídico**, **acesso** (alguém vê ou perde o que não devia) ou **só visual**.

| Assunto | Regra (ler antes) | Código principal | Setores e telas afetados | Módulos de estado | Risco |
|---|---|---|---|---|---|
| Comissão e brinde | `regras/REPRESENTANTES-E-COMISSOES.md` (3, 6, 7) | `domain/consignado.js`, `comissoes.js`, `comissao-funcionarias.js`, `comissao-interno.js`, `pix-direto.js`; `server/app-rep/comissoes.js` | Financeiro › Comissões (`pages/Comissoes.js`, `ComissoesTodos.js`, `ConfigComissoes.js`), Consolidado dos representantes, Atendimento Sorelly, app da representante (`mobile/comissoes-rep.js`) | `comis`, `rpf`, `aci`, `ri` | dinheiro |
| Tabela de faixas (Kit Padrão e Prata) | mesma regra (1, 2) | `domain/consignado.js` (`FAIXAS_OFICIAIS`, `faixaPor`, versões de regra), `domain/config.js` (`CFG0`, `aplicaFaixas`); `pages/Config.js`, `ConfiguradorGeral.js`, `RegrasAcertos.js` | Todo acerto: Atendimento Sorelly, apps da representante e da revendedora (`mobile/representante.js`, `revendedora.js`, `venda-rev.js`), `state/reducer.js` | `rc` (quem é Prata); onde as versões ficam guardadas: NÃO VERIFICADO | dinheiro |
| Acerto | mesma regra (4, 5); `docs/negocio/REGRA-CANCELAMENTO-E-REMARCACAO.md` | `domain/consignado.js`, `acerto-derivado.js`, `atendimento-interno.js`; `pages/AtendimentoInternoCalculadora.js`; `server/app-rep/consignado.js`, `server/acerto-link.js`; `app/acerto/[token]` | Atendimento interno, Consolidado Sorelly, Consolidado dos representantes, Contas a receber, Direcionar (pedido de conta), Inadimplência, Link de pagamento | `aci`, `int`, `pag`, `rpf`, `lp` | dinheiro |
| Média de vendas | `regras/METAS-REVENDEDORAS.md` (3), `regras/LISTAGENS-E-MONTAGEM.md` (4) | A conta existe em CINCO arquivos: `domain/consignado.js` (`mediaVendas`), `encomendas.js` (`mediaVendas`, `faixaDaMedia`), `vendas.js` (`media3`), `revendedoras-internas.js` (`mediaTres`, `kitDaMedia`), `metas.js` (`classeDeMedia`). Se as cinco seguem a mesma regra: NÃO VERIFICADO | Valor do kit (`components/kit-valor.js`), montagem, reposição, metas, atendimento interno | `lst`, `er`, `ri`, `metas` | dinheiro |
| Kit novo | `regras/KITS-NOVOS-E-INDICACOES.md` | `KN/domain/` (`etapas.js`, `config.js`, `status.js`, `indicacao.js`, `regioes-rep.js`), `KN/lib/bridge-montagem.js`, `pages/KitsNovosEmbutido.js`, `domain/kit-novo-entrega.js`, `server/app-rep/sincronizar.js` | Cadastro de revendedoras › Kits novos, app `/kits-novos`, app da representante (`mobile/kn-*.js`), Atendimento Sorelly, comissão do kit novo (`pages/ComissoesKitNovo.js`) | `kn`, `kndados`, `rpo`, `cl` | dinheiro |
| Listagens e status do kit | `regras/LISTAGENS-E-MONTAGEM.md` (1 a 6) | `domain/status.js`, `regras.js`, `listagem-regras.js`, `retornos.js`; `components/fila.js`, `fila-planilha.js`, `janela-montar.js`, `menu-acoes.js`; `pages/Painel.js`; `server/montagem-kit.js`, `server/app-rep/listagens.js` | Representantes & Kits (Listagens, Bipagem, Consolidado), Atendimento interno › Listagens, apps da montadora, da bipadora e da representante | `lst`, `rpo` | acesso (bipadora e montadora não veem valor); kit parado |
| Condicionais | `regras/LISTAGENS-E-MONTAGEM.md` (7); `docs/negocio/CONDICIONAL-TERMO-E-NOTA.md` | `domain/condicionais.js`, `components/condicionais.js`, `lib/condicionais-kits.js`, `pages/Condicionais.js`, `CondicionalModelo.js`; `api/condicionais-kits`, `api/representante/condicionais` | Montagem › Condicionais, Revendedoras › Condicional, fila da montagem, apps | `lst` | jurídico (termo e nota promissória) |
| Pagamento, Pix e Direcionar | `regras/FINANCEIRO-CONTAS-E-DIRECIONAR.md` (2, 3); `docs/negocio/cerebro-financeiro/README.md` | `domain/direcionar-pix.js`, `pix-regras.js`, `controle-pagamentos.js`, `cerebro-financeiro.js`, `casar-pagos.js`; `pages/DirecionarPix.js`, `pages/dp/`; `lib/mensagem-pix.js`, `lib/chave-do-destino.js`; `server/rep-pag.js` | Financeiro › Pagamentos (Direcionar, Contas das representantes, Chaves Pix), Contas bancárias, Fornecedores, Família; quem ENVIA pedido: Atendimento Sorelly e app da representante | `pag`, `dpc`, `px`, `cp`, `sc`, `pf`, `ff`, `cpe`, `pfmes` | dinheiro |
| Contas a pagar | mesma regra (4); `lib/nome-conta.js` (escrita das contas) | `domain/contas-empresa.js`; `pages/ContasPagarLista.js`, `ContasPagarEmpresa.js`; `components/pagamento-conta.js`, `registrar-pagamento.js`; `server/contas-dm.js`, `server/contas.js`; `lib/contas-dm.js` | Contas › A pagar e Pagas; telas `ctafam` e `ctafamp` da Família (o MESMO arquivo `ContasPagarLista.js`, fora do menu; o menu da Família abre `FinFamiliar.js`); Análise de custos, Produção (pagamentos), Direcionar, Contas bancárias, Resultado do mês | `cpe`, `fd`, `ff`, `sc` | dinheiro |
| Contas a receber | mesma regra (4) | `server/contas-receber.js`, `recebimentos-antecipados.js`, `pix-adiantados.js`, `cruzamento-pix.js`, `comprovantes-receber.js`; `domain/recebimentos-antecipados.js`, `pix-adiantados.js`; `pages/ContasReceberLista.js` | Receber › Contas a receber, Família › PIX revendedoras, Atendimento interno (Pix adiantado), Link de pagamento | `contasreceber`, `ff`, `lp` | dinheiro |
| Fornecedor e negociação | `regras/FORNECEDORES-E-COMPRAS.md` (3, 5, 6) | `domain/pf.js`, `prazos-forn.js`, `pf-mes.js`; `pages/pf/` (`Negociacoes.js`, `Lancamentos.js`, `Fornecedores.js`); `scripts/planilha-fornecedores.mjs` | Financeiro › Fornecedores, Cadastro de peças (`pages/pf/Negociacoes.js` lê `cpc`; `pages/cadpecas/PrazosForn.js`), Materiais & Estoque (`pages/pf/PorPedido.js` lê `ce`), Direcionar, Contas bancárias | `pf`, `pfmes`, `cpc`, `ce` | dinheiro |
| Limite mensal de fornecedores | mesma regra (4) | `domain/pf-limite.js`; `pages/pf/Limite.js`, `pages/pf/Resumo.js` | Financeiro › Pagamentos › Resumo geral | `pf` | dinheiro |
| Cadastro de peças e preço | `regras/PRODUCAO-E-CADASTRO-DE-PECAS.md` (4); `docs/negocio/FLUXO-DE-COMPRA-DE-BRUTO.md` | `domain/cadastro-pecas.js`, `pedidos-pecas.js`, `compra-bruto.js`; `pages/CadastroPecas.js`, `pages/cadpecas/`; `server/custo-saida.js`, `reposicao.js`, `produtos-dm.js`; `api/precos-pecas` | Cadastro de peças (12 telas), Fornecedores › Negociações, Encomendas (reposição), Marketing › Fotos de catálogo, RH › Pagamento em joias | `cpc`, `fc`, `jp` | dinheiro (preço é só da Diretoria) |
| Produção e premiação | mesma regra (6) | `domain/producao.js`, `producao-nomes.js`; `pages/Producao.js`, `pages/producao/` | Produção (5 telas), Contas a pagar (`pages/producao/ProdPagamentos.js` usa `cpe` e `cp`), RH (nomes) | `pr`, `cpe`, `cp` | dinheiro; acesso (`producao_externa`, `producao_ver`) |
| Estoque e material gráfico | mesma regra (7, 8) | `domain/compras-estoque.js`, `estoque-sorelly.js`, `material-grafico.js`, `catalogo-grafico.js`; `pages/ComprasEstoque.js`, `pages/compras/`, `MaterialGrafico.js`, `EstoqueSorelly.js`; `server/estoque-dia.js`, `server/compras-chat.js` | Materiais & Estoque, Material gráfico, Financeiro › Estoque Sorelly, SorellyChat (aviso de pedido), Fornecedores | `ce`, `es` | dinheiro (baixo); operação |
| Metas das revendedoras | `regras/METAS-REVENDEDORAS.md` | `domain/metas.js`; `server/metas.js`; `api/metas/revendedoras`; `pages/MetasRevendedoras.js`, `MetasAcompanhamento.js`, `MetasHistorico.js`, `MetasNotificacoes.js`, `MetasRegras.js`. Outra coisa com o mesmo nome: `domain/metas-setor.js` e `pages/MetasSetor.js` (bônus dos setores) | Metas (5 telas); app da revendedora: A CONSTRUIR (diz a regra) | `metas` | dinheiro (brinde) |
| Encomendas e reposição | `regras/ENCOMENDAS-EXPOSITORES-TOP100.md` (3 a 6) | `domain/encomendas.js`, `reposicao.js`, `premiacao-mes.js`; `server/pedido-link.js`, `encomendas-ranking.js`, `encomendas-vendas.js`, `reposicao.js`, `separar-pecas.js`; `pages/Encomendas.js`, `EncomendasTelas.js`, `pages/encomendas/` | Encomendas (8 telas), página pública `/pedido/[codigo]`, app da representante, Agendamento, Bipagem de envio | `er`, `ercrono`, `cpc` | dinheiro (taxas); página aberta ao público |
| Expositores | mesma regra (7) | `domain/expositores.js`; `pages/ExpositoresModulo.js`, `pages/expositores/`; `api/expositores/revendedoras` | A MESMA tela está no menu de Encomendas e no de Agendamento; fotos do kit novo | `ex` | operação |
| Inadimplência | `regras/INADIMPLENCIA-E-JURIDICO.md` | `domain/inadimplencia.js`, `inadimplencia-fin.js`, `cobranca-func.js`; `pages/inad/`, `CobrancaFunc.js`, `Inadimplencia.js`; `api/kits-atrasados` | Inadimplência (16 telas, 3 públicos), Direcionar (`pages/dp/PedidosKit.js` lê `inad`), comissão da Inadimplência (`pages/MetasSetor.js`) | `inad`, `cf` | jurídico e dinheiro |
| RH, acessos e autorizações | `regras/RH-E-FUNCIONARIOS.md` (2) | `domain/autorizacoes.js` (28 arquivos importam), `domain/equipe.js` (112 arquivos importam), `pessoas.js`, `rh.js`; `navigation/perfis.js`; `server/permissoes.js`; `pages/AcessosAutorizacoes.js`, `Pessoas.js` | TODOS os setores (menu e botões) e o servidor (cada módulo abre por setor) | `rh`, `eq`, `rhsol`, `chathor` | acesso |
| Folha e horas extras | mesma regra (4, 5) | `domain/rh.js`, `remuneracao.js`, `rh-ficha.js`; `pages/RH.js` (`AbaRhHoras`), `pages/FolhaFuncionarias.js` (aberta dentro de `ContasPagarEmpresa.js`); `server/ficha-func.js` | RH, Financeiro › Análise de custos, Contas a pagar | `rh`, `jp` | dinheiro e jurídico (trabalhista) |
| Financeiro familiar | `regras/FINANCEIRO-FAMILIAR.md` | `domain/financeiro-familiar.js`; `pages/FinFamiliar.js`, `FinFamiliarSocios.js`, `FinFamiliarFaturas.js`, `ResumoGrupo.js`, `FfGastoPorCasa.js`; `ContasPagarLista.js` (`AbaCtaFamilia`) | Financeiro › Família, Faturas, Direcionar, Chaves Pix, Contas a receber (Pix), Análise de custos | `ff` | dinheiro; acesso (só sócios: `financeiro_familia`, `ff_pix`) |
| Fiscal e CNPJ | `regras/FISCAL-E-CNPJS.md` | `domain/fiscal.js`, `cnpjs.js`; `pages/Fiscal.js`, `pages/fiscal/`, `Cnpjs.js`, `LimiteFaturamento.js`; `server/faturamento-nf.js` | Fiscal (3 telas) e toda tela que separa por CNPJ: Contas a pagar, Chaves Pix, Cobrança, RH › Contratos, Pessoas (`cnpjs.js`: 16 arquivos importam) | `fx` | jurídico (fiscal) |
| App da representante | `regras/REPRESENTANTES-E-COMISSOES.md`; `docs/app-sorelly/INTEGRACAO-APP-REPRESENTANTE.md` | `domain/app-rep.js`, `listagem-regras.js`; `mobile/representante.js`; `server/app-rep/`, `rep-filtro.js`, `rep-gravar.js`, `rep-pag.js`, `estado-itens.js`; `api/consignado/ingest/`, `api/app-rep/`, `api/representante/` | Listagens, Consolidado, Comissões, Agendamento › Pedidos do app, Direcionar, Apps | `rpo`, `rpf`, `comis`, `pag`, `kn`, `lst`, `rc`, `inicio` | dinheiro; acesso (ela vê só o que é dela) |
| App da revendedora | `docs/app-sorelly/API-LEITURA.md`; `regras/METAS-REVENDEDORAS.md` (7) | `mobile/revendedora.js`, `mobile/*-rev.js`; `domain/*-rev.js`, `preferencias-kit.js`; `server/preferencias-app.js`; `api/kit/preferences` | Preferências do kit (o formulário do app só a Diretoria muda), Garantia, Link de pagamento, Marketing (artes), Indicações | `pk`, `gr`, `lp`, `mk`, `ind` | acesso |
| DevMaster (ERP) | `docs/devmaster/openapi.yaml` (Grep pela rota); `regras/FINANCEIRO-CONTAS-E-DIRECIONAR.md` (2) | `server/devmaster.js`, `devmaster2.js`, `contas-dm.js`, `fotos-dm.js`, `produtos-dm.js`, `faturamento-dia.js`, `revendedoras-dia.js`, `automatico-dia.js`, `metas.js`; `api/devmaster/`, `api/devmaster2/`, `api/contas-dm` | Revendedoras, Agendamento, Contas a pagar e a receber, Faturamento, Metas, Fotos de catálogo, Arrumar na DevMaster | `fatdia`, `revdia`, `es`, `contasreceber` | dinheiro (POST grava no ERP de verdade: só com a Diretoria) |
| Menu e rotas | `docs/design/PADRAO-VISUAL.md`; menu do setor = padrão `menu` (`components/barra-menu.js`); `docs/SETORES-DO-MENU.md` | `navigation/setores.js`, `abas.js`, `perfis.js`; `src/apps/montagem/router/slugs.js`; `src/router/rotas.js`, `use-rota-aba.js`; `components/barra-menu.js`; `App.js` | Todos. O endereço sai do NOME do setor: trocar o nome troca o endereço. Depois rode `node scripts/mapa-telas.mjs` | nenhum | acesso (tela some do menu); link antigo quebra |
| Padrão visual e peças | `docs/design/PADRAO-VISUAL.md` | `components/padrao.js` (175 arquivos importam), `padrao-fin.js` (153), `tabela-planilha.js` (116), `bloco-painel.js` (90); `scripts/padrao-regras.mjs`, `hook-padrao.mjs`; `src/styles/theme.css`; `tests/fotos` | Todas as telas, e também o app Kits novos (importa `padrao-fin.js` e `tabela-planilha.js`) | nenhum | só visual (mas muda o sistema inteiro) |

## 3. Módulos de estado

Como funciona (fontes: `lib/sync-modulos.js`, `api/estado/route.js`, `api/estado/[modulo]/route.js`, `server/estado-modulo.js`, `server/estado-itens.js`, `server/permissoes.js`):

```
Tela (reducer, state/reducer.js) ─► lib/sync-modulos.js ─► PUT /api/estado/<módulo> ─► server/permissoes.js (pode?) ─► tabela sorelly.estado_modulo
        ▲                                 │ a cada 20 s                                                              (um JSON por módulo)
        └──── ação SYNC_MODULO ◄── GET /api/estado?m=...                         rpo e rpf: tabela sorelly.estado_item (uma linha por chave)
```

- A permissão é pelo módulo INTEIRO: quem abre o módulo lê e grava. "Ver só o seu" dentro do módulo é regra da tela. A Diretoria abre tudo.
- Toda gravação fica em `sorelly.estado_modulo_log` (45 dias) e há cópia diária (30 dias).
- São 57 módulos com nome no código: 50 sincronizados sozinhos (lista `PADRAO` em `lib/sync-modulos.js`) e 7 que a tela ou o servidor chama direto.
- Coluna "Quem grava" = setores que abrem o módulo em `server/permissoes.js` (`*` = todo mundo logado). Coluna "Quem mais lê" = arquivos que usam a chave, achados por busca no código.

| Chave | O que guarda | Quem grava | Quem mais lê | Arquivo da regra |
|---|---|---|---|---|
| `rh` | Colaboradores, presença, configuração do RH | rh (`pages/RH.js`) | `pages/FolhaFuncionarias.js`, `RHSeguranca.js`, `App.js` | `domain/rh.js` |
| `eq` | Equipes | rh (`pages/equipes/`) | — | `domain/equipes.js` |
| `rhsol` | Solicitações de mudança de cadastro | `*` (`pages/RHSolicitacoes.js`) | RH confirma | `state/reducer.js` |
| `chathor` | Horário de trabalho para o SorellyChat | `*` | `App.js` | NÃO VERIFICADO |
| `sg` | PGR e PCMSO por CNPJ | `*` lê; RH anexa (`sg_gerir`) | `pages/SegurancaDocumentos.js`, `server/anexos.js` | `domain/seguranca-docs.js` |
| `jp` | Pagamento em joias | rh, pecas | `pages/PagamentoJoias.js`, `pages/rh/JoiasVisao.js` | `domain/joias-pagamento.js` |
| `av` | Avaliações | rh, cadastro (`pages/avaliacoes/`) | — | `domain/avaliacoes.js` |
| `cf` | Cobrança de funcionárias (compra de peças) | cobranca (`pages/CobrancaFunc.js`) | — | `domain/cobranca-func.js` |
| `inad` | Inadimplência: dívida, pagamento, Serasa, kit em atraso (uma chave por registro) | cobranca (`pages/inad/`) | `App.js`, `pages/dp/PedidosKit.js` | `domain/inadimplencia.js` |
| `ff` | Financeiro familiar: contas, Pix, sócios | socios (`pages/FinFamiliar.js`); o servidor também grava Pix e comprovante (`server/recebimentos-antecipados.js`, `pix-adiantados.js`) | `pages/DirecionarPix.js`, `ChavesPixBancos.js`, `ContasPagarEmpresa.js`; `server/cruzamento-pix.js` | `domain/financeiro-familiar.js` |
| `pf` | Pagamentos a fornecedores: fornecedores, pedidos, negociações | financeiro (`pages/pf/`); o servidor grava o link de conferência do acerto (`server/acerto-link.js`) | `pages/DirecionarPix.js`, `Caixa.js`, `ResumoGrupo.js`; `server/acerto-pedidos.js` | `domain/pf.js` |
| `pfmes` | Resumo do mês dos fornecedores | `scripts/planilha-fornecedores.mjs` | `App.js` (`domain/pf-mes.js`), Direcionar | `domain/pf-mes.js` |
| `cp` | Controle de pagamentos (destinos) | financeiro (`pages/ChavesPixBancos.js`) | `pages/producao/ProdPagamentos.js`, `Pessoas.js`, `lib/chave-do-destino.js` | `domain/controle-pagamentos.js` |
| `px` | Chaves Pix e regras do Pix | financeiro (`pages/ChavesPixBancos.js`, `ChavesPix.js`) | `components/chave-pix-caixa.js`, `pagamentos-conferir.js`, `lib/mensagem-pix.js` | `domain/pix-regras.js` |
| `pag` | Pedidos de conta: `lf_` lançamento, `dp_` fila do Direcionar, `kp_` pedido de kit | `*` envia (Atendimento Sorelly, app da representante); Financeiro trata (`pages/DirecionarPix.js`) | `pages/pf/Lancamentos.js`; `server/rep-pag.js` | `domain/direcionar-pix.js` |
| `dpc` | Configuração do Direcionar: contas das representantes, regras, limites | financeiro | `pages/dp/PedidosKit.js`, `components/nova-venda.js` | `domain/direcionar-pix.js` |
| `cpe` | Contas a pagar: baixas, contas à mão, marca Empresa/Família, histórico | financeiro (`pages/ContasPagarEmpresa.js`) | `pages/producao/ProdPagamentos.js`, `DirecionarPix.js`, `Caixa.js` | `domain/contas-empresa.js` |
| `sc` | Saldos das contas bancárias (`saldosContas`); o servidor não deixa um dia sumir (`server/trava-saldos.js`) | financeiro (`pages/Caixa.js`) | `pages/DirecionarPix.js`, `ResultadoMes.js`, `components/registrar-pagamento.js` | `domain/saldos-contas.js` |
| `fd` | Faturamento e contas pagas por dia, meta do mês (9 chaves soltas: `faturamentoDiario`, `contasPagasDiario`, `fatHoje`, `fechaMes`, `metaMensal`, `contasPagar`, `contasPagarEm`, `metaPct`, `contasPrevDia`) | financeiro | `pages/ResultadoMes.js`, `ContasPagarDiario.js`, `components/tabela-faturamento-dia.js`, `domain/agendamento.js` | `domain/financeiro.js`, `state/fd-patches.js` |
| `fatdia` | Faturamento do dia anterior (automático) | servidor (`server/faturamento-dia.js`) | financeiro | `server/faturamento-dia.js` |
| `es` | Estoque Sorelly: posição mensal | financeiro; servidor (`server/estoque-dia.js`) | `pages/estoque-sorelly/` | `domain/estoque-sorelly.js` |
| `fx` | Fiscal: notas, saídas, contas por CNPJ | financeiro (`pages/fiscal/`) | — | `domain/fiscal.js` |
| `lp` | Link de pagamento: solicitações, taxas, meios | financeiro, linkpag, agendamento (`pages/link-pagamento/`) | `pages/DirecionarPix.js`, `AtendimentoInternoCalculadora.js`, `mobile/revendedora.js` | `domain/link-pagamento.js` |
| `comis` | Comissões das representantes: percentuais, gasolina, km, pagamentos | financeiro | `mobile/representante.js`; `server/app-rep/comissoes.js`; a representante lê só a parte dela (`server/rep-filtro.js`) | `domain/comissoes.js` |
| `agend` | Agendamento: cotas, previstos, metas | agendamento, financeiro (`pages/Agendamento.js`) | `pages/Apps.js`, `RepresentantesApp.js`, `domain/comissoes.js`; `server/app-rep/base.js`, `sincronizar.js`, `server/rep-filtro.js` | `domain/agendamento.js`, `state/agend-patches.js` |
| `ri` | Revendedoras do atendimento interno e comissão da funcionária (`revInternas`, `comissaoFunc`) | agendamento | `pages/AtendimentoInternoCalculadora.js`, `AtendimentoInternoListagens.js`, `KN/lib/bridge-montagem.js` | `domain/revendedoras-internas.js`, `comissao-funcionarias.js` |
| `int` | Atendimentos em andamento do atendimento interno (`i_`, últimos dias) | `*` (`pages/AtendimentoInternoCalculadora.js`) | `components/interno-resumo.js`, `domain/comissao-interno.js` | `lib/sync-modulos.js` (`fatiaInt`) |
| `aci` | Registros de acerto do atendimento interno (`a_`) | `*` (`pages/AtendimentoInternoCalculadora.js`) | Consolidado Sorelly, `pages/Comissoes.js`, `domain/comissoes.js` | `lib/sync-modulos.js` (`fatiaAci`) |
| `lst` | Listagens de retirada e os kits delas (`listagens`, `kits`) | `*` (montagem, bipagem, condicionais, representantes) | 40 arquivos; os maiores: `state/reducer.js`, `mobile/representante.js`, `mobile/montadora.js`, `lib/condicionais-kits.js` | `domain/regras.js`, `status.js` |
| `rc` | Quem é Kit 100% Prata (`prataRev`) | `*` | `domain/consignado.js`; `server/rep-filtro.js` | `domain/consignado.js` |
| `rpo` | App da representante, operação: listagens e kits. POR ITEM: o app grava `l_`, `k_`, `ke_`...; o admin grava `lx_`, `kx_` | servidor (`server/app-rep/listagens.js`, `sincronizar.js`) e montagem, kitsnovos, cadastro, agendamento, encomendas, financeiro, producao | `state/reducer.js` | `domain/app-rep.js` |
| `rpf` | App da representante, financeiro: acertos, entregas, reposições. POR ITEM: app `a_`, `ar_`, `km_`, `gv_`; admin `ax_`, `cf_` | servidor (`server/app-rep/consignado.js`) e financeiro, agendamento | Consolidado, Comissões, Inadimplência | `domain/app-rep.js` |
| `kn` | Kits novos direcionados às representantes | `*` (`KN/lib/bridge-montagem.js`); o servidor grava a resposta do app (`server/app-rep/sincronizar.js`) | `pages/AtendimentoInternoCalculadora.js` | `KN/lib/bridge-montagem.js` |
| `cl` | Leads e cadastros para aprovar | cadastro (`pages/AprovacaoCadastros.js`) | `KN/lib/entrada-cadastro.js`, `pages/cadastro/` | `domain/cadastro-leads.js` |
| `ind` | Indicações. NÃO sincroniza mais: com servidor, vem ao vivo de `/api/indicacoes/estado` | cadastro, kitsnovos | `pages/indicacoes/`, `mobile/indique-rev.js` | `domain/indicacoes.js`, `server/indicacoes.js` |
| `pk` | Preferências do kit e formulário do app da revendedora (blocos: só a Diretoria muda) | montagem, cadastro (`pages/PreferenciasKit.js`) | `components/janela-montar.js`, `mobile/preferencias-ver-rev.js`, `api/kit/preferences`; `server/montagem-kit.js` | `domain/preferencias-kit.js` |
| `gr` | Garantias da revendedora e créditos | garantia (`pages/GarantiaCreditos.js`); o servidor grava os créditos usados no acerto (`server/app-rep/consignado.js`, `server/rep-gravar.js`) | `pages/AtendimentoInternoCalculadora.js`, `mobile/garantias-rev.js` | `domain/garantias-rev.js` |
| `pr` | Produção: grade do mês, bônus, produção externa | producao, montagem (`pages/producao/`) | — | `domain/producao.js` |
| `cpc` | Cadastro de peças: pedidos de bruto e banho, peças, preços | pecas (`pages/cadpecas/`); o servidor grava custo e reposição sozinho (`server/custo-saida.js`, `server/reposicao.js`) | `pages/pf/Negociacoes.js` | `domain/cadastro-pecas.js` |
| `ce` | Compras e estoque de material; gravar pedido dispara aviso no SorellyChat (`server/compras-chat.js`) | `*` (`pages/compras/`) | `pages/pf/PorPedido.js`, `domain/material-grafico.js` | `domain/compras-estoque.js` |
| `er` | Encomendas e reposições: pedidos, Top 100, horários | encomendas (`pages/encomendas/`) | `mobile/representante.js`, `pages/Agendamento.js`; `server/pedido-link.js`, `encomendas-vendas.js` | `domain/encomendas.js` |
| `ex` | Expositores | encomendas, montagem, agendamento (`pages/expositores/`) | — | `domain/expositores.js` |
| `mk` | Marketing: artes e divulgação | marketing (`pages/marketing/`) | `mobile/artes-rev.js` | `domain/marketing.js` |
| `tp` | Tráfego pago | marketing (`pages/trafego/`) | `pages/Criativos.js` | `domain/trafego.js` |
| `fc` | Fotos de catálogo (uma chave por código) | marketing (`pages/FotosCatalogo.js`); o servidor grava as fotos achadas na DevMaster (`server/fotos-dm.js`) | — | `domain/fotos-catalogo.js` |
| `mr` | Relatório diário do Marketing | marketing (`pages/RelatorioMarketing.js`) | — | `domain/relatorio-marketing.js` |
| `mod` | Modelos (Marketing) | Diretoria e pessoas liberadas (`modelos_ver`) | `pages/Modelas.js` | `domain/modelas.js` |
| `mel` | Chamados (pedidos de mudança no sistema) | `*` (`pages/Melhorias.js`) | — | `domain/melhorias.js` |
| `inicio` | Comunicados da página inicial | `*` lê; a Diretoria publica (regra da tela) | `pages/Inicio.js`; conta de representante | `pages/Inicio.js` |
| `revdia` | Total de revendedoras por dia (automático) | servidor (`server/revendedoras-dia.js`) | `*` | `server/revendedoras-dia.js` |
| `agrev` | Alterações da Agenda de revendedoras. FORA da sincronização: a tela chama `/estado/agrev` | agendamento (`pages/AgendamentoRevendedoras.js`, `Agendamento.js`, `AgendamentoAtividades.js`) | `pages/AgendamentoPainel.js` | `domain/atividades.js` |
| `metas` | Campanhas de metas. FORA da sincronização | Diretoria e pessoa liberada (`pages/MetasRegras.js`, `MetasRevendedoras.js`) | `server/metas.js` | `domain/metas.js` |
| `contasreceber` | Lançamentos do Contas a receber (Pix adiantado, comprovantes). FORA da sincronização | financeiro (`pages/ContasReceberLista.js`) | `server/pix-adiantados.js`, `cruzamento-pix.js`, `comprovantes-receber.js` | `domain/recebimentos-antecipados.js` |
| `kndados` | Planilha de kits novos (dado real só no servidor). FORA da sincronização | kitsnovos, cadastro (`KN/lib/sync-servidor.js`) | `KN/data/dados.js`; `server/app-rep/sincronizar.js` | `KN/data/dados.js` |
| `ercrono` | Cronograma de postagens do ranking | encomendas, marketing (`pages/encomendas/Cronograma.js`) | — | `domain/cronograma-ranking.js` |
| `finativ` | Só aparece na lista de exceções de `api/estado/[modulo]/route.js`. A tela Atividades usa `server/atividades-fin.js`, que não grava em módulo | NÃO VERIFICADO | NÃO VERIFICADO | NÃO VERIFICADO |
| `contasEmpresa` | Só aparece em `server/permissoes.js` (financeiro) | NÃO VERIFICADO | NÃO VERIFICADO | NÃO VERIFICADO |

Cuidados de gravação (todos escritos nos arquivos acima):
1. Módulo novo recebendo do servidor: só JUNTAR as chaves que chegaram (`case "SYNC_MODULO"` em `state/reducer.js`). Passar por "migrar" já apagou o resto e regravou sem parar (comentário do módulo `mod`).
2. Tela nova manda só a diferença (`lib/estado-patch.js`). Dado que duas pessoas mexem ao mesmo tempo vira "uma chave por registro" (`pag`, `int`, `aci`, `fc`, `inad`) ou módulo por item (`rpo`, `rpf`).
3. Em `pag`, `int` e `aci`, registro de demonstração (`demo`) não sobe (`lib/sync-modulos.js`). Nos outros módulos: NÃO VERIFICADO. Com servidor ligado e login, o que a tela grava vai para o banco.
4. A primeira gravação de um módulo só a Diretoria faz (exceções na rota: `mel`, `kn`, `pag`, `int`, `aci`, `agrev`, `rhsol`, `finativ`).
5. Vários módulos também são gravados pelo SERVIDOR (coluna "Quem grava"). Mudou o formato da chave na tela, mude no arquivo do servidor junto.

## 4. Peças oficiais (reutilizar, nunca copiar dentro da tela)

Lidas dos `export` de `src/apps/montagem/components/`. Antes de usar, leia `docs/design/PADRAO-VISUAL.md` (seções 6 a 8: peças, receita da tela nova e o que é legado): a trava `scripts/padrao-regras.mjs` reprova algumas peças antigas em tela mexida.

| Arquivo | Nomes exportados | Para que serve | Tela de exemplo |
|---|---|---|---|
| `components/tabela-planilha.js` | `TabelaPlanilha` | A tabela única: filtro e ordenação no título de cada coluna, nada abreviado | `pages/ContasPagarLista.js` (modelo do padrão; use com a receita da seção 7 do PADRAO-VISUAL) |
| `components/bloco-painel.js` | `BlocoPainel`, `GrupoBtn`, `PADRAO_BLOCOS`, `COMPACTO`, `BTN_GRUPO` | Bloco com barra de título azul; a tabela encosta nas bordas | `pages/DirecionarPix.js` |
| `components/planilha-cheia.js` | `PAGINA_CHEIA`, `BarraTabela`, `CelulaBarra`, `BarraMini`, `CampoMini`, `BuscaMini`, `AvisoMini`, `CLS_FINA`, `CLS_FINA_ESPACO`, `refCheia` | Tela que ocupa a janela inteira, com barra de filtros fina | `pages/CadastroFin.js` |
| `components/bloco-resumo.js` | `BlocoResumo` | Bloco de resumo em lista escrita (única exceção à regra "sem números no topo") | `pages/MetasRevendedoras.js` |
| `components/padrao-fin.js` | `CampoSel`, `CampoBusca`, `Botao`, `Segmentado`, `MenuMulti`, `AbasTela`, `Bloco`, `Aviso`, `Tile`, `Secao`, `LinhaCampo`, `Rotulo`, `BotaoRemover`, `TabelaSimples`, `CabSimples`, `TdSimples`, `brl`, `inteiro`, `COR`, `corSinal`, `H`, `CAMPO` | LEGADO no tamanho (nascem com 32 px e 13 px; em tela nova use `planilha-cheia.js`). Campos, botões e escolhas: uma opção = `CampoSel`; várias = `MenuMulti`; 2 a 5 visões = `Segmentado`; dinheiro = `brl` | `pages/inad/Dividas.js` |
| `components/padrao-fin.js` (antigas) | `FaixaTotais`, `BlocoFiltros`, `TabelaP`, `TabelaCampos`, `FileiraCampos`, `Td`, `Tr` | Ainda exportadas, mas REPROVADAS pela trava em tela mexida (faixa de totais, bloco de filtros no topo, tabela antiga) | não usar em tela nova |
| `components/padrao.js` | `Pagina`, `Indicador`, `Abas`, `BarraFiltros`, `Janela`, `Mosaico`, `Dinheiro`, `ESTADO`, `SETOR`, `degrade`, `TH_P`, `LINHA`, `cap` | Moldura da página, janela, cores de estado e de setor | `pages/ContasPagarLista.js` |
| `components/padrao.js` (antigas) | `Faixa`, `Tab`, `Td` | Ainda exportadas, mas REPROVADAS pela trava em tela mexida | não usar em tela nova |
| `components/barra-menu.js` | `MenuSetor` | Menu do setor em palavras, com busca de tela e abas abertas | `App.js` (lê `menu` de `navigation/setores.js`) |
| `components/filtro-planilha.js` | `MenuFiltro`, `passaFiltro`, `ordenar` | Menu de filtro por coluna (usado por `components/grade-filtro.js`) | `pages/AgendamentoRevendedoras.js` |
| `components/faixa-azul.js` | `SEL`, `BTN` | Classes dos controles menores dentro da faixa azul | `pages/MaterialGrafico.js` |
| `components/pagamento-conta.js`, `registrar-pagamento.js` | `PagamentoConta`; `RegistrarPagamento`, `contasDe`, `nomeFilial` | Janela de baixa: uma ou várias contas do mesmo CNPJ | `pages/ContasPagarLista.js` |
| `components/copiar-chave.js` | `CopiarChave` | Botão de copiar a chave Pix | `pages/ChavesPixBancos.js` |

## 5. Regras de ouro de dependência

1. **Número de regra só em `domain/` e no Configurador.** Nunca valor fixo dentro de tela (`src/apps/montagem/domain/CLAUDE.md`).
2. **O que muda no admin muda no app.** `domain/consignado.js`, `comissoes.js` e `app-rep.js` são importados pelo servidor do app (`server/app-rep/`): mexeu neles, teste o app da representante.
3. **O Admin sabe do dinheiro ANTES, a DevMaster registra DEPOIS.** Quando a DevMaster registrar, o Admin cruza e NÃO duplica (`regras/FINANCEIRO-CONTAS-E-DIRECIONAR.md`, seção 2; `domain/casar-pagos.js`).
4. **Toda entrada e toda saída responde duas perguntas:** de quem é a CONTA e de quem é a DÍVIDA (`regras/FINANCEIRO-CONTAS-E-DIRECIONAR.md`, seção 2). O que nunca misturar entre Empresa e Família: `regras/FINANCEIRO-FAMILIAR.md`, seção 13.
5. **Kit novo NÃO pega condicionais.** Quem já tem kit sempre pega antes de montar (`regras/KITS-NOVOS-E-INDICACOES.md`; `docs/negocio/FLUXO-DA-EMPRESA.md`).
6. **Acesso é por setor, e o bloqueio de verdade é no servidor.** Esconder no menu é só visual; quem decide é `server/permissoes.js` (`docs/ARQUITETURA.md`). Montadora e bipadora nunca veem valor.
7. **Uma tela, um lugar.** Antes de criar tela, procure o nome em `MAPA-DE-TELAS.md`. A mesma tela pode estar em dois menus (Expositores: Encomendas e Agendamento; Consolidado interno: Financeiro e Atendimento interno): mexeu nela, mudou nos dois.
8. **Visual se muda nas peças, não tela por tela.** Mudou `padrao.js`, `padrao-fin.js` ou `tabela-planilha.js`, mudou o sistema inteiro (e o app Kits novos).
