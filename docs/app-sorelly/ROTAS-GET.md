# Rotas GET do backend do app

Todas as rotas GET do backend (`apps/backend`) que devolvem dados, agrupadas
pelo tipo de acesso. Use para saber de onde tirar um dado para mostrar em
outro lugar (painel, admin, relatório).

Levantado do código em 16/11/2026 (`src/routes/index.ts` e `src/features/*/*.routes.ts`).
Rota nova ou alterada depois disso pode não estar aqui.

- **Produção:** `https://api.sorellyjoias.com.br`
- **Local:** `http://localhost:3000`
- Datas na query: `YYYY-MM-DD`. Mês e ano: `year=2026&month=11`.

## Qual acesso usar

| Acesso | Como mandar | Serve para |
|---|---|---|
| Pública | nada | catálogo e páginas abertas da revendedora |
| Chave de admin | `Authorization: Bearer <ADMIN_SECRET>` | painéis internos, relatórios, outro sistema da empresa |
| Representante | sessão de representante **ou** a chave de admin | dados da carteira de uma representante |
| Revendedora logada | `Authorization: Bearer <token da sessão>` | só os dados de quem está logada (uso do próprio app) |

> ⚠️ A `ADMIN_SECRET` dá acesso a tudo. Use só em servidor (backend de um
> painel, script, função). Nunca coloque no navegador nem no app.

Para montar um painel ou relatório, as rotas úteis são as das seções **2**
(chave de admin) e **3** (representante, chamada com a chave de admin). As da
seção **4** só funcionam com o login de uma revendedora e devolvem apenas os
dados dela.

---

## 1. Públicas (sem login)

| Rota | O que devolve | Parâmetros |
|---|---|---|
| `GET /health` · `GET /v1/health` | Se o servidor está no ar | — |
| `GET /api/app/version` | Versão mínima do app exigida | — |
| `GET /api/representantes/status` | `{ enabled }`: se o app da representante está ligado | — |
| `GET /api/products` | Catálogo de produtos de uma revendedora | `user_id` (obrigatório), `page` |
| `GET /api/products/public/:userId` | Produtos da vitrine pública da revendedora | — |
| `GET /api/products/public/:userId/catalog` | Situação do catálogo público dela (ativo ou não) | — |
| `GET /api/products/public/:userId/client` | Cliente da revendedora pelo WhatsApp (usado no checkout público) | `whatsapp` |
| `GET /api/image-proxy` | A **imagem** (não JSON) de um produto, redimensionada | `url`, `variant` |

---

## 2. Chave de admin (`ADMIN_SECRET`)

### Métricas e analytics gerais

Todas as rotas `/api/admin/analytics/*` respondem `{ data }` e aceitam o mesmo
filtro de período: `period=month|30d|all` **ou** `from=YYYY-MM-DD&to=YYYY-MM-DD`
(os dois juntos).

| Rota | O que devolve | Parâmetros |
|---|---|---|
| `GET /api/admin/metrics/summary` | Resumo geral: total vendido, peças, ticket médio, valor a pagar à Sorelly, comissão das revendedoras, médias diárias e garantias | `period` ou `from`/`to` |
| `GET /api/admin/metrics/timeseries` | Série temporal das métricas gerais | `period` |
| `GET /api/admin/analytics/activity-dashboard` | Painel executivo: financeiro, engajamento, séries e top revendedoras | período |
| `GET /api/admin/analytics/engagement` | Acesso e engajamento (DAU/WAU/MAU, ativas × inativas, série de acessos) | período |
| `GET /api/admin/analytics/retention` | Retenção por coorte de mês de cadastro | período |
| `GET /api/admin/analytics/orders-funnel` | Funil de pedidos (status, conversão, cancelamento, entrega, volume) | período |
| `GET /api/admin/analytics/payments-funnel` | Funil de pagamento (status, ticket, bandeira, parcelas, inadimplência) | período |
| `GET /api/admin/analytics/acquisition` | Aquisição de clientes e revendedoras ao longo do tempo | período |
| `GET /api/admin/analytics/warranties` | Garantias emitidas por status e reclamações enviadas | período |
| `GET /api/admin/analytics/training` | Engajamento com treinamento (vídeos assistidos) | período |

### Revendedoras

| Rota | O que devolve | Parâmetros |
|---|---|---|
| `GET /api/admin/resellers/ranking` | Ranking de revendedoras por vendas, com paginação em `meta` | `limit` (50), `offset`, `order_by` (`total_vendido`, `total_pedidos`, `total_clientes`, `ultimo_pedido`), `order_dir` (`asc`/`desc`), `has_orders`, `period` ou `from`/`to` |
| `GET /api/admin/resellers/:id` | Detalhe completo de uma revendedora | — |
| `GET /api/admin/resellers/:id/monthly-history` | Vendas mês a mês da revendedora (últimos 24 meses) | — |
| `GET /api/revendedoras` | Lista de todas as revendedoras | — |
| `GET /api/revendedoras/kit-preferences` | Revendedoras com o resumo das preferências de kit | `busca`, `orderBy`, `order`, `page`, `pageSize` |
| `GET /api/revendedoras/kit-preferences/:id` | Preferências de kit completas de uma revendedora | — |
| `GET /api/revendedoras/kit-preferences/analytics` | Números gerais do preenchimento das preferências de kit | — |

### Representantes e operação

| Rota | O que devolve | Parâmetros |
|---|---|---|
| `GET /api/admin/representantes` | Cadastro das representantes (código, CPF, %, acesso) e o tamanho da rede de cada uma | — |
| `GET /api/admin/kits-novos/respostas` | Respostas da entrega de kit novo | `desde` (data ISO 8601) |
| `GET /api/admin/pedidos-data` | Pedidos de mudança da data do acerto | `status` |
| `GET /api/admin/product-reports` | Peças reportadas pelas revendedoras (pendentes, agrupadas) | — |

### Indique & Ganhe

| Rota | O que devolve | Parâmetros |
|---|---|---|
| `GET /api/admin/indicacoes` | Todas as indicações: quem indicou, quem foi indicada, status | `status` (`criado`, `em_andamento`, `cadastro_aprovado`, `cancelado`, `finalizado`), `revendedoraId`, `whatsapp`, `q`, `limit` (50, máx. 200), `offset` |
| `GET /api/admin/indicacoes/revendedoras` | Revendedoras ranqueadas por indicações | `busca`, `page`, `pageSize` |
| `GET /api/admin/indicacoes/revendedoras/:id/premios` | Saldo de moedas e prêmios que ela já alcança | — |
| `GET /api/admin/indicacoes/resgates` | Pedidos de resgate de prêmio | `status` (`solicitado`, `aprovado`, `entregue`, `cancelado`) |
| `GET /api/admin/indicacoes/resgates/:id` | Detalhe de um resgate | — |

### Notificações push

| Rota | O que devolve | Parâmetros |
|---|---|---|
| `GET /api/admin/notifications/audience-count` | Quantas pessoas podem receber push | — |
| `GET /api/admin/notifications/users` | Busca de revendedoras para escolher destinatárias | `busca`, `page`, `pageSize` |
| `GET /api/admin/notifications/jobs/:jobId` | Andamento de um envio (status e contagens) | — |

---

## 3. Representante

Funcionam com o login de uma representante **ou** com a chave de admin. Com a
chave de admin, as rotas da carteira pedem `representativeCod` (código da
representante) na query. Com o login, o código vem da sessão.

`:id` é o id da revendedora no app. Com login de representante, revendedora
fora da rede dela dá 404.

### Carteira e desempenho

| Rota | O que devolve | Parâmetros |
|---|---|---|
| `GET /api/representantes/home-summary` | Totais da home: vendas, comissão, acerto e peças | `representativeCod`, `incluirInativas` |
| `GET /api/representantes/home-snapshots` | Números de cada revendedora da carteira, paginado | `representativeCod`, `page`, `pageSize`, `incluirInativas` |
| `GET /api/representantes/monthly-summary` | Vendido, acerto e comissão prevista no mês (sem `year`/`month` = mês atual) | `representativeCod`, `year`, `month` |
| `GET /api/representantes/desempenho/ranking` | Ranking da carteira por vendas | `representativeCod`, `period`, `year`, `month`, `situacao`, `minVendido`, `maxVendido`, `page`, `pageSize` |
| `GET /api/representantes/desempenho/rede-resumo` | Totais da carteira no período | `representativeCod`, `period`, `year`, `month` |
| `GET /api/representantes/desempenho/analise-geral` | Indicadores, série de 12 meses e destaques da carteira | `representativeCod`, `year`, `month` |
| `GET /api/representantes/listagens` | Listagens de kits para montar e retirar na empresa (data, horário, kits por revendedora e status da montagem). Vem do admin novo | — |
| `GET /api/representantes/kits-novos` | Kits novos da representante | — |
| `GET /api/representantes/comissoes` | Comissões do mês: datas de pagamento, km, gasolina e o que falta entregar. Vem do admin novo | `mes` |
| `GET /api/representantes/formas-pagamento` | Formas e contas de pagamento da calculadora. Vem do admin novo; 502 se ele não responder | — |

### Uma revendedora da carteira

| Rota | O que devolve | Parâmetros |
|---|---|---|
| `GET /api/representantes/revendedoras/:id` | Ficha: perfil, faixa, números da home, atividade e preferências de kit | — |
| `GET /api/representantes/revendedoras/:id/desempenho` | Indicadores do mês, série mensal e posição na carteira | `year`, `month` |
| `GET /api/representantes/revendedoras/:id/condicionais` | Condicionais ao vivo da DevMaster, com status (fechada, atrasada, no prazo, sem prazo) e se está desativada | — |
| `GET /api/representantes/revendedoras/:id/condicionais/pecas` | Peças de cada condicional (referência, valor, quantidade) e as vendas lançadas no app. 503 se a DevMaster estiver fora | — |
| `GET /api/representantes/revendedoras/:id/contexto-acerto` | Dados do acerto: vendas anteriores, dívida, créditos, pré-acerto. Vem do admin novo | — |
| `GET /api/representantes/revendedoras/:id/perfil` | O que a representante preencheu: 2º telefone, endereços, profissão, referências. Vem do admin novo | — |
| `GET /api/representantes/revendedoras/:id/pedidos-data` | Pedidos de mudança da data do acerto dessa revendedora | — |

### Histórico de acertos e conferências

| Rota | O que devolve | Parâmetros |
|---|---|---|
| `GET /api/representantes/movimentos` | Histórico de acertos, kits e reposições registrados no app para a revendedora. **Só com login de representante** | `revendedoraId` |
| `GET /api/representantes/movimentos/:id` | Um registro do histórico com o pacote completo e a assinatura. **Só com login de representante** | — |
| `GET /api/representantes/conferencias` | Conferências de peças (devoluções bipadas), mais recentes primeiro | `page`, `pageSize`, `revendedoraId`, `representativeCod` |
| `GET /api/representantes/conferencias/:id` | Uma conferência com as peças lidas | `representativeCod` |

Mais detalhes (formatos de resposta) em [representantes.md](representantes.md),
[admin-sorelly.md](admin-sorelly.md), [kits-novos.md](kits-novos.md) e
[listagens.md](listagens.md).

---

## 4. Revendedora logada

Devolvem só os dados da revendedora dona do token. Não servem para painel
geral. Para dados de várias revendedoras, use as seções 2 e 3.

### Conta

| Rota | O que devolve | Parâmetros |
|---|---|---|
| `GET /api/auth/me` | Usuária logada (sem dados sensíveis) | — |
| `GET /api/auth/address` | Endereço dela (`/adress` é o nome antigo, mantido para apps antigos) | — |
| `GET /api/auth/pix` | Chave Pix e nome de quem recebe | — |
| `GET /api/auth/phone` | Telefone | — |
| `GET /api/flags/check` | Se uma funcionalidade está ligada para ela | `flag` |
| `GET /api/notifications/preferencias` | Preferências de notificação | — |
| `GET /api/kit-preferences` | Preferências de kit que ela preencheu | — |

### Vendas e condicionais

| Rota | O que devolve | Parâmetros |
|---|---|---|
| `GET /api/sales` | Painel de vendas: total, comissão, faixa, brindes, próxima faixa | — |
| `GET /api/sales/product/:productId` | Vendas de um produto | `history`, `refs` |
| `GET /api/auth/condicionais` | Condicionais dela e quais estão desativadas | — |
| `GET /api/auth/condicionais/vendas` | Vendas de todas as condicionais ativas | — |
| `GET /api/auth/condicionais/:codigo/vendas` | Vendas de uma condicional | — |
| `GET /api/products/status` | Situação das peças (vendida, disponível) com busca | `page`, `busca`, `categoria` |
| `GET /api/product-reports/pending` | Peças que ela reportou e estão pendentes | — |

### Clientes e pedidos

| Rota | O que devolve | Parâmetros |
|---|---|---|
| `GET /api/clients` | Clientes dela | `busca`, `includePending` |
| `GET /api/clients/:id` | Um cliente, com pedidos se pedir | `includeOrders` |
| `GET /api/clients/payments/due-today` | Parcelas de clientes que vencem hoje | — |
| `GET /api/products/orders` | Pedidos dela | — |
| `GET /api/products/orders/proposal` | Propostas de pagamento de um pedido | `groupId`, `selectedOnly` |
| `GET /api/products/orders/payment-confirmation` | Confirmação de pagamento de um pedido | `groupId` |
| `GET /api/products/orders/payment-request` | Último pedido de pagamento de um pedido | `groupId` |
| `GET /api/mercadopago/connection` | Se a conta do Mercado Pago está conectada | — |
| `GET /api/mercadopago/orders/:groupId/installment-details` | Parcelas e taxas do link de pagamento | `amount` |
| `GET /api/mercadopago/orders/:groupId/link` | Situação do link de pagamento do pedido | — |

### Garantias

| Rota | O que devolve | Parâmetros |
|---|---|---|
| `GET /api/certificates` | Certificados de garantia dela | `page`, `pageSize`, `search`, `status`, `situacao` |
| `GET /api/certificates/by-garantify-id/:garantifyId` | Um certificado pelo id da Garantify | — |
| `GET /api/products/orders/:groupId/certificates` | Certificados de um pedido | — |
| `GET /api/products/orders/:groupId/certificates/:code` | Um certificado pelo código | — |
| `GET /api/claims` | Reclamações de garantia | `page`, `pageSize`, `search`, `status`, `certificadoId` |
| `GET /api/claims/:id` | Uma reclamação | — |

### Engajamento

| Rota | O que devolve | Parâmetros |
|---|---|---|
| `GET /api/metas` | Meta / desafio atual dela | — |
| `GET /api/avaliacoes/pending` | Se tem avaliação pendente para responder | — |
| `GET /api/video-progress` | Vídeos de treinamento já assistidos | — |
| `GET /api/novidades-read` | Novidades já lidas | — |
| `GET /api/indicacoes/status` | Se o Indique & Ganhe está ligado | — |
| `GET /api/indicacoes/resumo` | Resumo: moedas, indicações, nível | — |
| `GET /api/indicacoes/historico` | Indicações que ela fez | — |
| `GET /api/indicacoes/extrato` | Extrato de moedas | — |
| `GET /api/indicacoes/resgates` | Resgates de prêmio dela | — |
| `GET /api/indicacoes/consentimento` | Se aceitou os termos | — |

---

## GET que não devolvem dados para exibir

| Rota | Por quê |
|---|---|
| `GET /api/mercadopago/oauth/start` | Começa a conexão com o Mercado Pago (devolve a URL de autorização) |
| `GET /api/mercadopago/oauth/callback` | Retorno do Mercado Pago no navegador; redireciona para o app |
| `GET /api/claims/unread-count` | Descontinuada: sempre devolve `{ count: 0 }` |
