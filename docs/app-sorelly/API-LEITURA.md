# Sorelly App: API de leitura do backend (`apps/backend`)

> Referência de **todos os endpoints de leitura (GET)** do backend do SorellyApp, pensada para ser lida por uma IA ou por quem vai integrar. Ela foi gerada a partir do código-fonte (rotas → services → repositories → clients externos) em 30/10/2026, na branch `feat/sorelly-chat`.
>
> **Escopo:** só leitura. Mutações (POST/PUT/PATCH/DELETE) e webhooks ficam de fora, com duas exceções: os endpoints de login (necessários para obter o token) e um POST que só calcula e devolve dados (`POST /api/admin/notifications/audience-count`).
>
> **Fonte de verdade:** o código. Se algo divergir, valem `src/routes/index.ts` e os arquivos `src/features/<domínio>/*.routes.ts`.

---

## Uso neste projeto (sorelly-prototipo)

> Seção só desta cópia. O resto do guia é igual ao original em `sorelly-app/apps/backend/docs/api/API-LEITURA.md`.

### Variáveis no `.env` do protótipo

```dotenv
MOBILE_API_URL="https://api.sorellyjoias.com.br/mobile/api"   # base JÁ COM /api
MOBILE_API_KEY=<valor do ADMIN_SECRET do backend>             # Bearer das rotas admin
```

- **`MOBILE_API_URL` já termina em `/api`.** Para chamar uma rota do guia, tire o `/api` do começo dela. Exemplo: a rota `GET /api/admin/metrics/summary` vira `${MOBILE_API_URL}/admin/metrics/summary`. (Nos `curl` do guia, `$API_URL` é a base **sem** `/api`, ou seja, `${MOBILE_API_URL%/api}`.)
- **`MOBILE_API_KEY` é o `ADMIN_SECRET` do backend.** Vai em `Authorization: Bearer ${MOBILE_API_KEY}`. Conferido em 30/10/2026: `/admin/metrics/summary`, `/revendedoras/kit-preferences/analytics` e `/representantes/home-summary?representativeCod=…` responderam 200.
- **Chamar só do servidor** (rotas `app/api/*` ou `src/server/*`), nunca do navegador. A chave dá acesso de admin a todos os dados do app.

### O que essa chave lê e o que ela NÃO lê

| Grupo de rotas | Funciona com `MOBILE_API_KEY`? | Observação |
|---|---|---|
| `/admin/*` (métricas, ranking, analytics, indicações, notificações, kits novos, pedidos de data, reportes) | **Sim** | Parte D do guia. |
| `/revendedoras/*` (lista de usuários, preferências do kit) | **Sim** | Parte C, seção Revendedoras. |
| `/representantes/*` | **Sim, no modo admin** | Exige `?representativeCod=<cod>` em toda chamada. **Exceções:** `/representantes/movimentos`, `/movimentos/:id` e `/listagens` só aceitam sessão de representante (403 com a chave). |
| Rotas públicas (`/app/version`, `/products?user_id=`, `/products/public/*`, `/image-proxy`) | Sim (não precisam de chave) | |
| Rotas "da revendedora logada" (`/auth/*`, `/sales`, `/clients`, `/products/orders*`, `/claims`, `/certificates`, `/indicacoes/*`, `/metas`, `/notifications/*`, `/avaliacoes/*`, `/kit-preferences`, `/video-progress`, `/novidades-read`, `/mercadopago/*`, `/product-reports/*`) | **Não (401)** | Precisam do **token de sessão daquela revendedora** (ver abaixo). |

### Para ler dados de UMA revendedora específica

A chave admin não substitui uma revendedora. Há dois caminhos:

1. **Preferido: usar as rotas admin por ID.** Exemplos: `GET /admin/resellers/:id`, `GET /admin/resellers/:id/monthly-history`, `GET /representantes/revendedoras/:id?representativeCod=…`, `GET /revendedoras/kit-preferences/:id`. Cobrem a maior parte do que o painel precisa.
2. **Se precisar das rotas da revendedora** (vendas detalhadas, clientes, pedidos, garantias): fazer login como ela com `POST ${MOBILE_API_URL}/auth/verify` e o corpo `{"cpfCnpj":"<CPF dela>"}`, e usar o `session.token` devolvido como Bearer.
   - **Atenção:** esse POST **cria uma sessão nova e atualiza o cadastro dela** na tabela `users` do app. Não é só leitura. Só usar com aprovação, e guardar o token no servidor para reaproveitar, porque as sessões não expiram.

### Header de versão

Mande `X-App-Version: 3.5.0` (ou qualquer versão ≥ `MIN_APP_VERSION`, hoje `3.2.2`) em todas as chamadas. Sem ele, as rotas de garantia/certificados respondem 503. Não precisa de variável nova: pode ser fixo no código.

### Exemplo (servidor Next.js)

```js
const BASE = process.env.MOBILE_API_URL;      // .../mobile/api
const KEY  = process.env.MOBILE_API_KEY;      // ADMIN_SECRET

export async function mobileGet(caminho, params = {}) {
  const url = new URL(`${BASE}${caminho}`);   // caminho sem /api, ex.: "/admin/metrics/summary"
  for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v);
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${KEY}`, 'X-App-Version': '3.5.0' },
    cache: 'no-store',
  });
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new Error(body?.error ?? body?.message ?? `HTTP ${r.status}`);
  return body;
}

// mobileGet('/admin/metrics/summary', { period: 'month' })
// mobileGet('/representantes/home-summary', { representativeCod: '12' })
```

---

## 0. Guia rápido (TL;DR para IA)

1. **Base URL de produção:** `https://api.sorellyjoias.com.br/mobile`. Todas as rotas começam com `/api/...`, então a URL completa fica `https://api.sorellyjoias.com.br/mobile/api/auth/me`.
   - Em dev local: `http://localhost:3333` (por exemplo, `http://localhost:3333/api/auth/me`).
   - Nos exemplos deste doc, `$API_URL` = a base **sem** `/api`.
2. **Existem 3 tipos de credencial** (todas vão em `Authorization: Bearer <valor>`):

   | Tipo | Valor do Bearer | Como obter | Rotas |
   |---|---|---|---|
   | **Sessão de usuário** (revendedora) | UUID de sessão | `POST /api/auth/verify` com `{"cpfCnpj": "..."}` → `session.token` | `/api/auth`, `/api/clients`, `/api/sales`, `/api/products/*`, `/api/claims`, `/api/certificates`, `/api/indicacoes`, `/api/metas`, etc. |
   | **Sessão de representante** | Mesmo UUID de sessão, de um usuário vinculado a uma representante ativa | Mesmo login; a resposta traz `role: "representante"` | `/api/representantes/*` |
   | **Admin** | O valor da env `ADMIN_SECRET` | Configurado no servidor (Secrets Manager) | `/api/admin/*`, `/api/revendedoras/*` e `/api/representantes/*` (modo admin, exige `?representativeCod=`) |

3. **Sessões não expiram.** O token criado no login vale até um `POST /api/auth/logout`.
4. **Envie sempre `X-App-Version`** (semver, ex.: `3.5.0`). Rotas de garantia/certificados respondem `503` se o header faltar ou for menor que `MIN_APP_VERSION` (prod: `3.2.2`), e outras rotas mudam o comportamento conforme a versão (ver §3).
5. **Rotas públicas (sem token):** `/health`, `/api/app/version`, `/api/flags/check`, `/api/products` (catálogo), `/api/products/public/*`, `/api/image-proxy`, `/api/representantes/status`, `/api/indicacoes/status` e `/api/mercadopago/oauth/callback`.
6. **Erros** nem sempre vêm no mesmo formato (ver §4). Leia `error` **ou** `message`.
7. **Números monetários** muitas vezes vêm como **string** (`"129.90"`), porque são colunas `numeric` do Postgres. Faça o parse.

### Fluxo mínimo

```bash
export API_URL="https://api.sorellyjoias.com.br/mobile"

# 1) Login (só CPF/CNPJ ou e-mail cadastrado no ERP Devmaster; não há senha/OTP)
TOKEN=$(curl -s -X POST "$API_URL/api/auth/verify" \
  -H "Content-Type: application/json" -H "X-App-Version: 3.5.0" \
  -d '{"cpfCnpj":"12345678900"}' | jq -r '.session.token')

# 2) Ler dados autenticados
curl -s "$API_URL/api/auth/me"  -H "Authorization: Bearer $TOKEN" -H "X-App-Version: 3.5.0"
curl -s "$API_URL/api/sales"    -H "Authorization: Bearer $TOKEN" -H "X-App-Version: 3.5.0"
curl -s "$API_URL/api/clients"  -H "Authorization: Bearer $TOKEN" -H "X-App-Version: 3.5.0"

# 3) Rotas administrativas
curl -s "$API_URL/api/admin/metrics/summary" -H "Authorization: Bearer $ADMIN_SECRET"
```

---

## 1. Arquitetura (o que está por trás dos dados)

```
App mobile (Expo)  ──HTTP──▶  API Gateway (domínio api.sorellyjoias.com.br, mapping /mobile)
                                  │  remove o prefixo /mobile (LAMBDA_STAGE_PREFIX)
                                  ▼
                        AWS Lambda "mobile-api-handler"  (Fastify 5 + TypeScript)
                                  │
       ┌──────────────────────────┼───────────────────────────┬─────────────────────────┐
       ▼                          ▼                           ▼                         ▼
 PostgreSQL (Neon)         Devmaster ERP                 sorelly-admin backend     Garantify / Mercado Pago
 via Drizzle ORM           (revendedoras, produtos,      (API_ADMIN_URL: metas,     (certificados de garantia,
 DATABASE_URL              condicionais, inadimplência)  avaliações, kit config,     reclamações / pagamentos)
                           DEVMASTER_*                   listagens, formas pgto)
```

- **Runtime:** Node.js + Fastify 5 + TypeScript (ESM). Código em `apps/backend/src`.
- **Banco:** PostgreSQL (Neon) + Drizzle ORM. Tabelas principais: `users`, `sessions`, `clients`, `sales`, `order_groups`, `order_items`, `order_payment_proposals`, `payment_requests`, `warranty_certificates`, `representantes`, `revendedora_home_snapshots`, `conferencias_pecas`, `conferencias_pecas_itens`, `consignado_acertos_pendentes`, `kits_novos_representante`, `pedidos_data_acerto`, `kit_preferences`, `kit_pickup_confirmations`, `video_progress`, `novidades_lidas`, `notification_jobs`, `product_issue_reports`, `indicacoes`, `indicacao_status_events`, `indicacao_resgates`, `sorelly_coin_entries`, `indicacao_notificacoes`, `indicacao_consentimentos`, `reseller_mp_accounts`, `mp_charges`, `mercadopago_webhook_events`, `mp_oauth_states`, `garantify_operations`, `garantify_product_cache`, `warranty_claims_idempotency`, `warranty_emission_queue` (schema em `src/db/schema.ts`).
- **Identidade da revendedora:** `users.id` é **o mesmo ID da revendedora no ERP Devmaster**. Nas chamadas ao ERP ele vai com zeros à esquerda até 6 dígitos (`1544` → `001544`).
- **Glossário do domínio:**
  - **Revendedora:** pessoa que usa o app e revende semijoias.
  - **Representante:** gerente regional que cuida de uma "rede" de revendedoras (`users.representative_cod`).
  - **Cliente:** cliente final da revendedora.
  - **Condicional:** kit de peças consignadas que a revendedora recebe.
  - **Acerto:** fechamento ou prestação de contas de um condicional.
  - **Pedido / order group:** pedido de peças feito pela revendedora para um cliente.
  - **Proposta:** condições de pagamento do pedido.
  - **Payment request:** solicitação de link de pagamento.
  - **Garantify:** provedor dos certificados de garantia e das reclamações.
  - **Indique & Ganhe:** programa de indicação com moedas ("Sorelly coins").
  - **Metas:** metas de venda por família de produto.

---

## 2. Autenticação em detalhe

### 2.1 Sessão de usuário (`requireAuth`, em `src/features/auth/auth.guard.ts`)

- Header: `Authorization: Bearer <sessionToken>` (prefixo `bearer` sem diferenciar maiúsculas de minúsculas).
- O token é procurado na tabela `sessions`, e o usuário (`users`) passa a ser a identidade da requisição. **Nenhuma rota autenticada aceita `userId` por query/body para identificar quem está lendo**: tudo vem do token.
- Erros:

  | Status | Corpo | Quando |
  |---|---|---|
  | 401 | `{"error":"Sessão inválida. Informe o token no header Authorization."}` | header ausente ou sem `Bearer ` |
  | 401 | `{"error":"Sessão inválida. Token ausente no header Authorization."}` | `Bearer` vazio |
  | 401 | `{"error":"Sessão inválida ou inexistente."}` | token desconhecido |
  | 401 | `{"error":"Sessão expirada. Faça login novamente."}` | `expires_at` no passado (na prática não acontece) |
  | 500 | `{"error":"Usuário vinculado à sessão não foi encontrado. Solicite uma nova sessão."}` | sessão órfã |

- Efeito colateral: com `X-App-Version` ≥ `MIN_APP_VERSION`, o guard dispara em background o provisionamento do operador Garantify. Isso não muda a resposta.

### 2.2 Admin (`requireAdmin` / `requireRevendedorasAuth`)

- Header: `Authorization: Bearer <ADMIN_SECRET>`, comparado por igualdade exata.
- `503 {"error":"Admin não configurado. Defina ADMIN_SECRET no servidor."}` se a env estiver vazia; `401 {"error":"Não autorizado."}` se o token estiver errado.
- Usado em `/api/admin/*` e `/api/revendedoras/*`.

### 2.3 Representante (`requireRepresentantesAuth`)

Auth dual, detalhada no início da seção **Representantes**:

- `Bearer <ADMIN_SECRET>`: modo admin, em que `?representativeCod=<cod>` é obrigatório.
- `Bearer <sessionToken>` de um usuário com `users.metadata.representanteCod` apontando para uma representante ativa: modo sessão. Um `representativeCod` diferente do da sessão gera 403.
- Sessão de usuário comum (não representante): `403 {"error":"Acesso restrito a representantes."}`.

---

## 3. Headers

| Header | Obrigatório? | Efeito |
|---|---|---|
| `Authorization: Bearer <token>` | nas rotas autenticadas | ver §2 |
| `X-App-Version` | recomendado sempre | Semver do app. **Obrigatório (≥ `MIN_APP_VERSION`)** nas rotas de certificados/garantia (`/api/products/orders/:groupId/certificates*`, `/api/certificates*`, `/api/claims*`); se faltar, a resposta é `503 {error, code:"app_version_missing"\|"app_version_below_min", min_version}`. Em `GET /api/products/orders`, decide se `client.whatsapp` vem com o DDI `55`. Em `GET /api/clients/:id` e no `requireAuth`, habilita sincronizações Garantify em background. |
| `X-App-Platform` | não | `ios` \| `android` \| `web` (enviado pelo app, só para telemetria). |
| `X-App-Build` | não | versionCode/buildNumber (telemetria). |
| `X-User-Email` | não | e-mail do usuário logado (telemetria). |
| `Content-Type: application/json` | nos POST | — |

Os headers `Authorization`, `Token` e `Cookie` são mascarados nos logs (`[REDACTED]`).

---

## 4. Formato das respostas de erro

O handler global (`src/plugins/error-handler.ts`) produz **três formatos diferentes**:

| Situação | Status | Corpo |
|---|---|---|
| Erro de negócio (`AppError`) | 4xx/5xx | `{ "error": string, "code"?: string, "field"?: string, ...extras }`. Os extras ficam **no topo** do JSON (ex.: `min_version`, `retryable`), não dentro de `details`. |
| Upstream fora do ar (`UpstreamUnavailableError`) | 503 | `{ "error": "Estamos com uma instabilidade temporária. Tente novamente em instantes.", "code": "UPSTREAM_UNAVAILABLE", "retryable": true }` |
| Validação de schema (Ajv) | 400 | `{ "message": "erro de validacao", "issues": [...] }` |
| Erro inesperado | 500 | `{ "message": "erro interno do servidor" }` |
| Erro respondido direto na rota | variável | `{ "error": string }` (o padrão mais comum nos guards e nas rotas admin/representantes) |
| `GET /api/image-proxy` | variável | **texto puro** (`text/plain`), não JSON |

**Regra prática para o consumidor:** `const msg = body.error ?? body.message`.

---

## 5. Tipos de dados e convenções

- **Datas (query builder Drizzle):** string ISO 8601 UTC (`"2026-10-30T12:34:56.000Z"`).
- **Datas em rotas com SQL cru** (ex.: `/api/admin/resellers/ranking`, `/api/admin/resellers/:id`): string no **formato texto do Postgres** (`"2026-10-30 14:05:12.345678"`), não ISO.
- **Datas vindas do Devmaster:** repassadas cruas, geralmente no formato BR `dd/mm/aaaa`.
- **`numeric` (dinheiro) e `COUNT(*)` em SQL cru:** **string** (`"1534.90"`, `"12"`).
- **Fuso:** o processo roda com `TZ=America/Sao_Paulo`. Filtros de período usam o fuso de São Paulo (offset fixo `-03:00`): `YYYY-MM-DD` vira `[00:00:00.000-03:00, 23:59:59.999-03:00]`. Mês civil (`year`/`month`) também é calculado em BRT.
- **Querystring:** o Fastify/Ajv **converte tipos** (`"2"` → `2`, `"true"` → `true`), aplica `default` e **remove em silêncio** chaves não declaradas quando o schema tem `additionalProperties: false`.
- **Paginação:** não há padrão único. Cada endpoint documenta o seu (`page`/`pageSize`, `limit`/`offset` ou nenhum).
- **Cache em memória:** é por instância Lambda, então duas chamadas seguidas podem cair em containers diferentes. Usam cache: `/api/products/status`, `/api/products/public/:userId/catalog` (`PRODUCTS_STATUS_CACHE_TTL_MS`, 60 s), a config de kit e as perguntas de avaliação do admin (60 s) e o analytics de kit-preferences (60 s).
- **Degradação silenciosa:** vários endpoints que consultam o Devmaster ou o admin devolvem **lista vazia ou `null`** quando o serviço externo falha, em vez de erro (condicionais, metas, avaliações, extras de vendas). Uma lista vazia não garante que "não há dados".
- **GETs com efeito colateral:** alguns GETs **gravam no banco**:
  - `GET /api/auth/condicionais` persiste os condicionais fechados em `users.disabled_condicionais`.
  - `GET /api/indicacoes/resumo`, `GET /api/indicacoes/extrato` e `GET /api/admin/indicacoes/revendedoras/:id/premios` registram a expiração de moedas vencidas (`sorelly_coin_entries`).
  - `GET /api/avaliacoes/pending` marca a avaliação como respondida quando o admin não tem perguntas ativas.
  - `GET /api/clients/:id` (com `X-App-Version` válido) dispara sincronização Garantify em background.

---

## 6. Variáveis de ambiente

### 6.1 Como a configuração é carregada

1. **Produção (Lambda):** `src/config/load-secrets.ts` lê o secret JSON `mobile-api-handler/secrets` do **AWS Secrets Manager** (ou o ARN em `SECRETS_ARN`) e popula `process.env`. Só roda quando existe `AWS_LAMBDA_FUNCTION_NAME`.
2. **Config não secreta versionada:** `src/config/app-config.ts` preenche, por ambiente (`development` \| `production` \| `test`), as chaves que ainda não existirem. Variáveis já definidas (secret, IaC ou `.env`) **sempre vencem**.
3. **Dev local:** arquivo `apps/backend/.env` (modelo em `.env.example`), carregado via `dotenv`.
4. **Validação:** `src/plugins/env.ts` (`@fastify/env`) valida e aplica defaults. As obrigatórias são `NODE_ENV`, `HOST`, `PORT`, `CORS_ORIGIN` e `DATABASE_URL`.
5. **Entrypoint Lambda** (`src/lambda.ts`) fixa `NODE_ENV=production`, `ENABLE_CRON=false` e `TZ=America/Sao_Paulo`, todos sobrescrevíveis.

### 6.2 Mínimo para subir e ler a API localmente

```dotenv
NODE_ENV=development
HOST=0.0.0.0
PORT=3333
CORS_ORIGIN=*
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/backend_new   # obrigatório
DEVMASTER_API_KEY=<token do ERP>     # sem ele: login dá 500 e catálogo/condicionais falham ou vêm vazios
ADMIN_SECRET=<segredo forte>         # sem ele: /api/admin/* e /api/revendedoras/* retornam 503
API_ADMIN_URL=http://localhost:5000  # backend sorelly-admin (metas, avaliações, kit config, listagens)
CONSIGNADO_INGEST_KEY=<chave>        # /api/representantes/formas-pagamento (502) e /listagens (503) sem ela
```

Para rodar: `cd apps/backend && npm ci && npm run db:migrate && npm run dev`, e a API fica em `http://localhost:3333`.

### 6.3 Referência completa

Legenda: **S** = secreta (vem do Secrets Manager em produção), **C** = config não secreta (`app-config.ts`).

#### Núcleo / infraestrutura

| Variável | Tipo | Default (schema) | Produção | Para que serve na leitura |
|---|---|---|---|---|
| `NODE_ENV` | C | `development` | `production` | Escolhe o bloco de config (`app-config.ts`). |
| `HOST` / `PORT` | — | `0.0.0.0` / `3333` | — | Bind do servidor local (`npm run dev`). |
| `LOG_LEVEL` | C | `info` | `info` | Nível de log do pino. |
| `CORS_ORIGIN` | C | `*` | `*` | Origens permitidas. |
| `DATABASE_URL` | **S** | — (obrigatória) | Neon | Postgres: fonte de quase todos os dados. |
| `DB_POOL_MAX` | — | `5` | — | Conexões por container. Afeta rotas com muitas queries paralelas (ex.: activity-dashboard). |
| `ENABLE_CRON` | — | `true` | `false` | Jobs in-process. Na Lambda os jobs rodam em funções separadas (EventBridge). |
| `TZ` | — | — | `America/Sao_Paulo` | Fuso do processo (datas "de hoje", rótulos). |
| `LAMBDA_STAGE_PREFIX` | — | `/mobile` | `/mobile` | Prefixo removido do path vindo do API Gateway. |
| `SECRETS_ARN` | — | — | opcional | Sobrescreve o nome do secret (`mobile-api-handler/secrets`). |
| `AWS_REGION` | C | `sa-east-1` | `sa-east-1` | Região AWS (S3/SQS/Secrets). |
| `MIN_APP_VERSION` | C | `1.0.0` | `3.2.2` (dev `1.0.0`) | Devolvido em `GET /api/app/version`. É a versão mínima do `X-App-Version` nas rotas de garantia e o gate das sincronizações Garantify. |

#### Autenticação / sessões

| Variável | Tipo | Default | Produção | Uso |
|---|---|---|---|---|
| `ADMIN_SECRET` | **S** | `''` | definido | Bearer de `/api/admin/*`, `/api/revendedoras/*` e do modo admin de `/api/representantes/*`. Vazio → 503. |
| `SESSION_TTL_DAYS` | C | `30` | `30` | Declarada, mas **sem efeito no login atual**: sessões são criadas com `expires_at = NULL`. |
| `REPRESENTANTE_ENABLED` | C | `false` | `true` | Kill-switch do app da representante. `≠ 'true'` → `503 {code:"representante_disabled"}` em `/api/representantes/*` (exceto `/status`), e o login nunca devolve `role:"representante"`. |

#### Devmaster (ERP)

| Variável | Tipo | Default | Uso |
|---|---|---|---|
| `DEVMASTER_API_KEY` | **S** | — | Header `Token` em todas as chamadas ao ERP. Sem ela: login 500, catálogo 500/503, condicionais vazias. |
| `DEVMASTER_API_URL` | C | `https://app.sorelly.indepcloud.com.br:28576` | Base do ERP: produtos (`/appsorelly/{id}/produtos?page=N`), revendedora/condicionais (`/appsorelly/revendedoras/{id6}`). Também está na allowlist do image-proxy. |
| `DEVMASTER_RESELLER_API_BASE` | C | `…:28576/appsorelly/revendedoras` | Busca da revendedora no login (`/cpfcnpj=<n>` ou `/email=<e>`). |
| `DEVMASTER_IMAGE_HOST` | C | `https://fotos.sorelly.indepcloud.com.br` | Segundo host permitido no `GET /api/image-proxy`. |
| `EXTERNAL_API_TIMEOUT_MS` | C | `6000` | Timeout das chamadas externas (Devmaster, admin, MP). Prod: `10000`. |
| `EXTERNAL_API_RETRIES` | C | `1` | Retentativas nas chamadas externas. |
| `PRODUCTS_STATUS_CACHE_TTL_MS` | C | `60000` | TTL do cache de `/api/products/status` e `/api/products/public/:userId/catalog` (`<= 0` desliga). |
| `IMAGE_PROXY_MAX_BYTES` | — | `10485760` | Tamanho máximo de imagem no proxy (acima disso, 413). |

#### Backend admin (sorelly-admin)

| Variável | Tipo | Default | Produção | Uso |
|---|---|---|---|---|
| `API_ADMIN_URL` | C | `http://localhost:5000` | `https://api.sorellyjoias.com.br/admin` | Metas (`/metas-revendedoras/app`), perguntas de avaliação (`/avaliacoes/perguntas`), config de kit (`/kit/preferences`), listagens (`/listagens/app`) e formas de pagamento (`/consignado/ingest/formas-pagamento`). |
| `CONSIGNADO_INGEST_KEY` | **S** | `''` | definido | Header `x-ingest-key` enviado ao admin. Precisa ser **idêntico** ao `CONSIGNADO_INGEST_KEY` do sorelly-admin. Sem ele: `/formas-pagamento` 502, `/listagens` 503. |
| `ADMIN_INGEST_KEY` | **S** | `''` | definido | Chave do relay de avaliações para o admin (escrita). |

#### Garantify (certificados / reclamações)

| Variável | Tipo | Default | Uso |
|---|---|---|---|
| `GARANTIFY_API_URL` | C | `https://api-enterprise.garantify.com.br` | API Garantify (proxy de reclamações em `/api/claims`, carteiras, operadores). |
| `GARANTIFY_API_KEY` | **S** | `''` | Credencial Garantify. |
| `GARANTIFY_MARCA_ID` | C | `''` | ID da marca Sorelly no Garantify (prod: `da635446-…`). |
| `GARANTIFY_GARANTIA_MESES_DEFAULT` | — | `12` | Meses de garantia padrão na emissão. |
| `GARANTIFY_WEBHOOK_SECRET` | **S** | `''` | Valida o webhook (escrita). |

#### Mercado Pago

| Variável | Tipo | Default | Produção | Uso |
|---|---|---|---|---|
| `MP_ENABLED` | C | `false` | `true` | `≠ 'true'` → todas as rotas `/api/mercadopago/*` retornam `503 mp_disabled`. |
| `MP_CLIENT_ID` | C | `''` | definido | OAuth (`oauth/start`; sem ele, `503 mp_not_configured`). |
| `MP_CLIENT_SECRET` | **S** | `''` | definido | Troca de token no `oauth/callback`. |
| `MP_REDIRECT_URI` | C | `''` | `https://api.sorellyjoias.com.br/mobile/api/mercadopago/oauth/callback` | Redirect do OAuth. |
| `MP_TOKEN_ENC_KEY` | **S** | `''` | definido | Chave AES-256-GCM (32 bytes em base64) que cifra os tokens MP das revendedoras. **O boot falha** se `MP_ENABLED=true` e ela for inválida. |
| `MP_OAUTH_BASE` / `MP_API_BASE` | C | `https://auth.mercadopago.com.br` / `https://api.mercadopago.com` | | Hosts MP (token, `payment_methods/installments`). |
| `MP_WEBHOOK_URL` / `MP_WEBHOOK_SECRET` | C / **S** | `''` | | Webhook (escrita). |

#### Avaliações (pesquisa pós-kit)

| Variável | Tipo | Default | Produção | Uso em `GET /api/avaliacoes/pending` |
|---|---|---|---|---|
| `AVALIACAO_ENABLED` | C | `false` | `true` | Desligado → `state` sempre `none`. |
| `AVALIACAO_OBRIGATORIA` | C | `true` | `true` | Devolvido como `flags.obrigatoria` (bloqueia o app). |
| `AVALIACAO_MIN_CONDICIONAL_DATE` | C | `''` | `2026-08-01` | Só kits a partir dessa data entram (vazio = nenhum). |
| `AVALIACAO_GOOGLE_REVIEW_URL` | C | `''` | URL Google | Devolvido como `googleReviewUrl`. |

#### Indique & Ganhe

| Variável | Tipo | Default | Produção | Uso |
|---|---|---|---|---|
| `INDICACOES_ENABLED` | C | `false` | `true` | Kill-switch: `≠ 'true'` → 503 em `/api/indicacoes/*` (exceto `/status`), **antes da auth**. |
| `INDICACOES_FORM_BASE_URL` | C | `https://forms.sorellyjoias.com.br` | | Base do link de indicação (`<base>/?id=<userId>`). |
| `INDICACOES_MOEDAS_VALIDADE_DIAS` | C | `90` | | Validade de cada lote de moedas (exibido em `regras`). |
| `INDICACOES_LIMITE_FINALIZADAS` | C | `200` | | Teto de indicações finalizadas (`0` = sem limite). |
| `INDICACOES_ALERTA_VENCIMENTO_DIAS` | C | `7` | | Janela do alerta "moedas vencendo". |
| `INDICACOES_NOTIF_ENABLED` / `_SILENCIO_INICIO` / `_SILENCIO_FIM` | C | `true` / `21` / `8` | | Envio de push (não afeta leitura). |
| `INDICACOES_WEBHOOK_SECRET` | **S** | `''` | | Webhook do funil externo (escrita). |

#### Variáveis que só afetam escrita, jobs ou webhooks (para referência)

- **Kommo:** `KOMMO_ENABLED`, `KOMMO_SUBDOMAIN`, `KOMMO_ACCESS_TOKEN` (S), `KOMMO_PIPELINE_ID`, `KOMMO_STATUS_ID`, `KOMMO_STATUS_ID_ENCERRADO`, `KOMMO_CF_*`, `KOMMO_WEBHOOK_SECRET` (S), `KOMMO_WEBHOOK_STATUS_MAP`. Usadas pelos leads e pelo webhook dos links de pagamento.
- **S3/CDN:** `S3_BUCKET`, `S3_ROOT_FOLDER`, `CDN_ROOT_URL`, `MAX_FILE_SIZE_BYTES`, `AWS_ACCESS_KEY_ID` (S), `AWS_SECRET_ACCESS_KEY` (S), `AWS_SESSION_TOKEN` (S). Usadas no upload de imagens de kit e de avatar.
- **Push:** `NOTIFICATIONS_QUEUE_URL` (fila SQS dos broadcasts).

### 6.4 Variáveis do lado do app mobile (consumidor)

| Variável (`apps/mobile`) | Produção | Uso |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `https://api.sorellyjoias.com.br/mobile/api` | Base deste backend, **já com `/api`** (o app chama `${API_URL}/auth/me`). |
| `EXPO_PUBLIC_KIT_API_URL` | `https://api.sorellyjoias.com.br/admin` | Backend admin (config pública do kit, `GET /kit/preferences`). |
| `EXPO_PUBLIC_MARKETING_API_URL` | = `KIT_API_URL` | Biblioteca de artes (`/marketing/library`). |

---

## 7. Avisos importantes (comportamentos não óbvios)

- **O login não tem segundo fator.** `POST /api/auth/verify` aceita só CPF/CNPJ ou e-mail cadastrado no ERP e devolve um token permanente.
- **`GET /api/flags/check` sempre responde `enabled: true`** (valor fixo no código).
- **A flag Garantify está forçada ON.** O único bloqueio possível é por `X-App-Version`.
- **`GET /api/claims/unread-count` está deprecated** e sempre devolve `{count: 0}`.
- **`GET /api/revendedoras` (admin) devolve todos os `users` sem paginação**, em snake_case e incluindo dados sensíveis (chave PIX, push token).
- **Rotas públicas expõem dados pessoais:**
  - `/api/products/public/:userId/client` devolve nome e endereço de um cliente para quem souber o ID da revendedora e o WhatsApp.
  - `/api/products/public/:userId/catalog` inclui nomes e WhatsApp de clientes em `produtos.emPedidos`.
- **`/api/admin/resellers/ranking`:** `order_by=comissao_revendedoras` ou `valor_pagar_sorelly` provavelmente gera 500 (a coluna não existe no SQL), e `meta.total` ignora o período.
- **`/api/admin/analytics/retention`** ignora o período e sempre usa os últimos 12 meses.
- **`/api/admin/metrics/*` e `/api/admin/resellers/*`:** período inválido cai em silêncio no mês atual (só `/analytics/*` devolve 400).
- **Ranking de representantes:** posições e destaques em `/api/representantes/desempenho/analise-geral` e `/revendedoras/:id/desempenho` cobrem só as **200 primeiras** da rede.

---

## 8. Índice de endpoints de leitura

**Parte A — Público, autenticação e recursos da revendedora**

- Health (`/` e `/v1`)
  - `GET /health`

- Versão do app (`/api/app`)
  - `GET /api/app/version`

- Feature flags (`/api/flags`)
  - `GET /api/flags/check`

- Autenticação e perfil (`/api/auth`)
  - `GET /api/auth/me`
  - `GET /api/auth/address`
  - `GET /api/auth/adress`
  - `GET /api/auth/pix`
  - `GET /api/auth/phone`
  - `GET /api/auth/condicionais`
  - `GET /api/auth/condicionais/vendas`
  - `GET /api/auth/condicionais/:codigo/vendas`

- Proxy de imagens (`/api/image-proxy`)
  - `GET /api/image-proxy`

- Novidades lidas (`/api/novidades-read`)
  - `GET /api/novidades-read`

- Progresso de vídeos (`/api/video-progress`)
  - `GET /api/video-progress`

- Notificações (`/api/notifications`)
  - `GET /api/notifications/preferencias`

- Avaliações de kit/representante (`/api/avaliacoes`)
  - `GET /api/avaliacoes/pending`

- Preferências do kit (`/api/kit-preferences`)
  - `GET /api/kit-preferences`

- Metas de vendas (`/api/metas`)
  - `GET /api/metas`

- Indique & Ganhe (`/api/indicacoes`)
  - `GET /api/indicacoes/status`
  - `GET /api/indicacoes/resumo`
  - `GET /api/indicacoes/historico`
  - `GET /api/indicacoes/extrato`
  - `GET /api/indicacoes/resgates`
  - `GET /api/indicacoes/consentimento`

- Reportes de problema em produto (`/api/product-reports`)
  - `GET /api/product-reports/pending`

**Parte B — Produtos, pedidos, garantias, clientes, vendas e Mercado Pago**

- Produtos (`/api/products`)
  - `GET /api/products`
  - `GET /api/products/status`
  - `GET /api/products/orders`
  - `GET /api/products/orders/proposal`
  - `GET /api/products/orders/payment-confirmation`
  - `GET /api/products/orders/payment-request`
  - `GET /api/products/public/:userId/client`
  - `GET /api/products/public/:userId/catalog`
  - `GET /api/products/public/:userId`

- Certificados de garantia por pedido (`/api/products/orders`)
  - `GET /api/products/orders/:groupId/certificates`
  - `GET /api/products/orders/:groupId/certificates/:code`

- Certificados — histórico (`/api/certificates`)
  - `GET /api/certificates`
  - `GET /api/certificates/by-garantify-id/:garantifyId`

- Reclamações de garantia (`/api/claims`)
  - `GET /api/claims`
  - `GET /api/claims/unread-count`
  - `GET /api/claims/:id`

- Clientes (`/api/clients`)
  - `GET /api/clients`
  - `GET /api/clients/payments/due-today`
  - `GET /api/clients/:id`

- Vendas (`/api/sales`)
  - `GET /api/sales`
  - `GET /api/sales/product/:productId`

- Mercado Pago (`/api/mercadopago`)
  - `GET /api/mercadopago/oauth/start`
  - `GET /api/mercadopago/oauth/callback`
  - `GET /api/mercadopago/connection`
  - `GET /api/mercadopago/orders/:groupId/installment-details`
  - `GET /api/mercadopago/orders/:groupId/link`

**Parte C — App da representante e revendedoras (admin)**

- Representantes (`/api/representantes`)
  - `GET /api/representantes/status`
  - `GET /api/representantes/formas-pagamento`
  - `GET /api/representantes/home-summary`
  - `GET /api/representantes/monthly-summary`
  - `GET /api/representantes/desempenho/ranking`
  - `GET /api/representantes/desempenho/rede-resumo`
  - `GET /api/representantes/desempenho/analise-geral`
  - `GET /api/representantes/home-snapshots`
  - `GET /api/representantes/revendedoras/:id`
  - `GET /api/representantes/revendedoras/:id/desempenho`
  - `GET /api/representantes/revendedoras/:id/condicionais`

- Movimentos de consignado (`/api/representantes`)
  - `GET /api/representantes/movimentos`
  - `GET /api/representantes/movimentos/:id`

- Conferências de peças (`/api/representantes`)
  - `GET /api/representantes/conferencias`
  - `GET /api/representantes/conferencias/:id`

- Kits novos (`/api/representantes`)
  - `GET /api/representantes/kits-novos`

- Listagens (`/api/representantes`)
  - `GET /api/representantes/listagens`

- Pedidos de nova data do acerto (`/api/representantes`)
  - `GET /api/representantes/revendedoras/:id/pedidos-data`

- Revendedoras (`/api/revendedoras`)
  - `GET /api/revendedoras`
  - `GET /api/revendedoras/kit-preferences/analytics`
  - `GET /api/revendedoras/kit-preferences`
  - `GET /api/revendedoras/kit-preferences/:id`

**Parte D — Admin / back-office**

- Admin — Revendedoras, representantes e métricas (`/api/admin`)
  - `GET /api/admin/representantes`
  - `GET /api/admin/metrics/summary`
  - `GET /api/admin/metrics/timeseries`
  - `GET /api/admin/resellers/ranking`
  - `GET /api/admin/resellers/:id/monthly-history`
  - `GET /api/admin/resellers/:id`

- Admin — Analytics (`/api/admin/analytics`)
  - `GET /api/admin/analytics/activity-dashboard`
  - `GET /api/admin/analytics/engagement`
  - `GET /api/admin/analytics/retention`
  - `GET /api/admin/analytics/orders-funnel`
  - `GET /api/admin/analytics/payments-funnel`
  - `GET /api/admin/analytics/acquisition`
  - `GET /api/admin/analytics/warranties`
  - `GET /api/admin/analytics/training`

- Admin — Notificações push (`/api/admin/notifications`)
  - `GET /api/admin/notifications/audience-count`
  - `POST /api/admin/notifications/audience-count`
  - `GET /api/admin/notifications/users`
  - `GET /api/admin/notifications/jobs/:jobId`

- Admin — Kits novos (`/api/admin/kits-novos`)
  - `GET /api/admin/kits-novos/respostas`

- Admin — Listagens (`/api/admin/listagens`)

- Admin — Pedidos de nova data do acerto (`/api/admin/pedidos-data`)
  - `GET /api/admin/pedidos-data`

- Admin — Indique & Ganhe (`/api/admin/indicacoes`)
  - `GET /api/admin/indicacoes`
  - `GET /api/admin/indicacoes/resgates`
  - `GET /api/admin/indicacoes/resgates/:id`
  - `GET /api/admin/indicacoes/revendedoras`
  - `GET /api/admin/indicacoes/revendedoras/:id/premios`

- Admin — Reportes de problema em produtos (`/api/admin/product-reports`)
  - `GET /api/admin/product-reports`

---

# Parte A — Público, autenticação e recursos da revendedora

## Health (`/` e `/v1`)

### GET /health

- **Descrição**: health check do processo (liveness). Também disponível como `GET /v1/health` (mesmo handler registrado com prefixo `/v1`).
- **Auth**: nenhuma.
- **Headers**: nenhum.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    status: "ok"        // sempre "ok"
    uptime: number      // segundos desde o start do processo (process.uptime(), fracionário)
    timestamp: string   // ISO-8601 do momento da resposta
  }
  ```
- **Erros**: nenhum específico (não toca no banco nem em APIs externas).
- **Fonte dos dados**: processo Node (sem DB).
- **Exemplo**:
  ```bash
  curl -s "$API_URL/health"
  curl -s "$API_URL/v1/health"
  ```

---

## Versão do app (`/api/app`)

### GET /api/app/version

- **Descrição**: versão mínima do app mobile exigida pelo backend. O app usa para forçar atualização.
- **Auth**: nenhuma.
- **Headers**: nenhum.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    minimumVersion: string  // = env MIN_APP_VERSION (semver, ex.: "3.2.2" em produção)
    latestVersion: string   // hoje é SEMPRE igual a minimumVersion
  }
  ```
- **Erros**: nenhum específico.
- **Fonte dos dados**: env `MIN_APP_VERSION` (default `1.0.0`; prod `3.2.2` na config versionada).
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/app/version"
  ```

---

## Feature flags (`/api/flags`)

### GET /api/flags/check

- **Descrição**: consulta de feature flag. **Hardcoded**: toda flag retorna `enabled: true`; o serviço externo de flags não é mais consultado. Mantido só por compatibilidade com o app.
- **Auth**: `requireAuth` (Bearer sessão).
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**:
  | nome | tipo | obrigatório | regras |
  |---|---|---|---|
  | `flag` | string | sim | 1–200 caracteres |
  | qualquer outro (ex.: `attrs.*`) | — | não | aceitos e ignorados (`additionalProperties: true`) |
- **Resposta 200**:
  ```ts
  {
    enabled: true          // sempre true
    reason: "hardcoded"    // sempre "hardcoded"
    flag_id: string        // eco do valor de ?flag (trim)
  }
  ```
- **Erros**:
  - `400 {"message":"erro de validacao","issues":[...]}` — `flag` ausente ou fora do tamanho.
  - `400 {"error":"flag é obrigatório."}` — `flag` só com espaços.
  - `401` — ver §2.
- **Fonte dos dados**: constante no código (nenhum DB/API).
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/flags/check?flag=nova_home"
  ```

---

## Autenticação e perfil (`/api/auth`)

### Como obter um token (pré-requisito para os GETs autenticados)

#### POST /api/auth/verify

- **Descrição**: login da revendedora/representante. Valida o CPF/CNPJ (ou e-mail) no cadastro de revendedoras do Devmaster, faz upsert do usuário em `users` (id = ID da revendedora no ERP) e cria uma sessão nova.
- **Auth**: nenhuma.
- **Body** (`application/json`) — informe **um** dos dois (se ambos vierem, `cpfCnpj` tem precedência):
  ```ts
  { cpfCnpj?: string /* com ou sem pontuação */, email?: string }
  ```
- **Resposta 200**:
  ```ts
  {
    message: "Login realizado com sucesso."
    user: UserRecord            // linha completa de `users` (mesmos campos de GET /me, MAS inclui pixKey e pixReceiverName e o metadata sem sanitização)
    role: "revendedora" | "representante"
    representante: { cod: string; nome: string; commissionPct: number } | null  // só quando role = "representante"
    session: {
      token: string             // UUID → use como Bearer
      expiresAt: null           // sessões não expiram
    }
  }
  ```
  - `role = "representante"` somente se `REPRESENTANTE_ENABLED='true'` e o CPF digitado constar ativo na tabela `representantes`. Login por e-mail não reavalia o CPF: usa o vínculo `users.metadata.representanteCod` persistido em logins anteriores.
- **Erros**:
  - `400 {"error":"Informe cpfCnpj ou email."}` / `400 {"error":"É necessário informar um CPF ou CNPJ válido."}` / `400 {"error":"É necessário informar um e-mail válido."}`.
  - `404 {"error":"Nenhuma revendedora encontrada para o CPF/CNPJ informado."}` (ou "...para o e-mail informado.").
  - `409 {"error":"Não foi possível sincronizar o usuário com a base de dados.","details":"..."}`.
  - `502 {"error":"Falha ao consultar a API externa de revendedoras.","details":"..."}` / `502 {"error":"Falha ao consultar a API externa (<status>)."}` / `502 {"error":"A API externa retornou um ID inválido para a revendedora."}`.
  - `500 {"error":"Variável de ambiente DEVMASTER_API_KEY não configurada."}`.
- **Fonte dos dados**: Devmaster `GET {DEVMASTER_RESELLER_API_BASE}/cpfcnpj=<digits>` ou `/email=<email>` (header `Token`), usa `nome_fantasia` → `nome` como nome e `email`; depois Postgres (`users`, `sessions`, `representantes`).
- **Exemplo**:
  ```bash
  TOKEN=$(curl -s -X POST "$API_URL/api/auth/verify" \
    -H "Content-Type: application/json" \
    -d '{"cpfCnpj":"123.456.789-00"}' | jq -r '.session.token')
  ```

#### POST /api/auth/session

- **Descrição**: valida/restaura uma sessão existente a partir do token (usado no cold start do app). Não cria sessão nova.
- **Auth**: nenhuma (o token vai no body).
- **Body**:
  ```ts
  { sessionToken?: string, email?: string }
  ```
- **Resposta 200** (somente com `sessionToken` válido):
  ```ts
  {
    message: "Sessão válida."
    user: UserRecord            // linha completa de `users` (inclui pixKey/pixReceiverName)
    role: "revendedora" | "representante"   // derivado de users.metadata.representanteCod + cadastro de representantes (se REPRESENTANTE_ENABLED='true')
    representante: { cod: string; nome: string; commissionPct: number } | null
    session: { token: string; expiresAt: string | null; createdAt: string }
  }
  ```
- **Erros**:
  - `400 {"error":"Informe um sessionToken válido ou o email para buscar a sessão."}`.
  - `401 {"error":"Sessão inválida ou inexistente."}` / `401 {"error":"Sessão expirada. Faça login novamente."}`.
  - Somente `email` (sem token): `404 {"error":"Usuário não encontrado para o email informado."}` ou `403 {"error":"Sessões são criadas automaticamente após validar o código. ..."}` — **nunca** devolve sessão por e-mail.
  - `500` — usuário da sessão não existe mais.
- **Fonte dos dados**: Postgres (`sessions`, `users`, `representantes`).
- **Exemplo**:
  ```bash
  curl -s -X POST "$API_URL/api/auth/session" -H "Content-Type: application/json" \
    -d "{\"sessionToken\":\"$TOKEN\"}"
  ```

### GET /api/auth/me

- **Descrição**: perfil da usuária autenticada (linha da tabela `users`), sem os dados Pix.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    user: {
      id: number                         // ID da revendedora (= ID no Devmaster)
      name: string
      email: string                      // pode ser "<id>@sorelly.local" quando não há e-mail real/único
      phone: string | null               // canônico, só dígitos com DDI (ex.: "5511999998888")
      expoPushToken: string | null       // "ExponentPushToken[...]"
      representativeCod: string | null   // código do representante responsável (rede)
      representativeName: string | null
      pickupCep: string | null           // endereço de retirada (ver GET /address)
      pickupAddress: string | null
      pickupAddressNumber: string | null
      pickupAddressComplement: string | null
      pickupNeighborhood: string | null
      pickupCity: string | null
      pickupState: string | null         // UF
      metadata: object | null            // jsonb livre; chaves conhecidas: `representanteCod` (vínculo de representante),
                                         // `garantify` (dados de integração Garantify; a chave interna `erroUltimaSincronizacao` é removida)
      disabledCondicionais: string[] | null  // códigos de condicionais desligadas; null = usuária legada sem a feature de condicionais
      devmasterActive: boolean | null    // ainda ativa no cadastro do Devmaster (job diário); null = nunca verificada
      devmasterActiveCheckedAt: string | null
      notifIndicacoes: boolean           // opt-in de pushes do Indique & Ganhe
      notifMarketing: boolean            // opt-in de pushes de marketing
      createdAt: string
      lastSeenAt: string | null
      messagesToSellSeenAt: string | null
      avatarUrl: string | null           // URL CDN da foto de perfil (256px webp)
      avatarAtualizadoEm: string | null
      // pixKey e pixReceiverName são REMOVIDOS desta resposta
    }
  }
  ```
- **Erros**: `401`/`500` do guard.
- **Fonte dos dados**: Postgres `users` (carregada pelo guard; sem consulta extra).
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/auth/me"
  ```

### GET /api/auth/address

- **Descrição**: endereço de retirada/coleta cadastrado pela revendedora. `GET /api/auth/adress` (grafia legada) é um alias idêntico.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200** (todos os campos `null` se nunca cadastrado):
  ```ts
  {
    cep: string | null           // como digitado (8–9 chars, ex.: "01310-100")
    street: string | null
    number: string | null
    complement: string | null
    neighborhood: string | null
    city: string | null
    state: string | null         // UF maiúscula, 2 letras
  }
  ```
- **Erros**: `401`/`500` do guard.
- **Fonte dos dados**: Postgres `users.pickup_*`.
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/auth/address"
  ```

### GET /api/auth/adress

- **Descrição**: alias legado (grafia errada) de `GET /api/auth/address`. Mesmo handler, mesma resposta e erros.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**: idêntica a `GET /api/auth/address`.
- **Erros**: `401`/`500` do guard.
- **Fonte dos dados**: Postgres `users.pickup_*`.
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/auth/adress"
  ```

### GET /api/auth/pix

- **Descrição**: dados Pix da revendedora para recebimento.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    pixKey: string | null            // chave Pix (texto livre: CPF, e-mail, telefone, aleatória)
    pixReceiverName: string | null   // nome do recebedor
  }
  ```
- **Erros**: `401`/`500` do guard.
- **Fonte dos dados**: Postgres `users.pix_key`, `users.pix_receiver_name`.
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/auth/pix"
  ```

### GET /api/auth/phone

- **Descrição**: telefone (WhatsApp) cadastrado da revendedora.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  { phone: string | null }   // dígitos; gravações novas são canônicas com DDI (ex.: "5511999998888"); registros antigos podem estar sem DDI
  ```
- **Erros**: `401`/`500` do guard.
- **Fonte dos dados**: Postgres `users.phone`.
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/auth/phone"
  ```

### GET /api/auth/condicionais

- **Descrição**: lista as condicionais (kits consignados) da revendedora no ERP e quais códigos ela desligou no app. **Efeito colateral**: se a usuária tem a feature (`disabledCondicionais` é array), códigos que o Devmaster já marca como `Fechado` são acrescentados e persistidos em `users.disabled_condicionais`.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    condicionais: DevmasterCondicional[]  // repassado SEM transformação do Devmaster; [] se o ERP falhar/estiver fora
    disabledCodigos: string[]             // códigos desligados (inclui as fechadas); [] para usuária legada (disabledCondicionais null)
  }

  // Objeto do Devmaster (passthrough; o casing das chaves pode variar: `status`/`Status`/`STATUS` etc.).
  // Campos efetivamente lidos pelo backend em outras features:
  type DevmasterCondicional = {
    codigo: string                 // código da condicional, com zeros à esquerda (ex.: "087006")
    status?: string                // "Aberto" | "Fechado" (case-insensitive)
    data?: string                  // data de abertura/saída, "dd/mm/aaaa" (alguns registros usam `data_saida`)
    data_prev_devolucao?: string   // previsão de acerto/devolução (formato BR); data fora da faixa (ex.: ano 3000) = Expositor/mostruário
    data_acerto?: string           // preenchida quando o acerto já rodou no ERP
    nome_representante?: string    // nome do representante; contém "REPOSI" quando é condicional de reposição
    [k: string]: unknown           // demais campos do ERP, repassados
  }
  ```
- **Erros**: `401`/`500` do guard. Falha do Devmaster **não** gera erro (vira `condicionais: []`).
- **Fonte dos dados**: Devmaster `GET {DEVMASTER_API_URL}/appsorelly/revendedoras/{id6}` (headers `Token`, `Versao: V2`), campo `condicionais` do 1º elemento do array; Postgres `users.disabled_condicionais`. Sem cache.
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/auth/condicionais"
  ```

### GET /api/auth/condicionais/vendas

- **Descrição**: peças vendidas pelo app somadas de TODAS as condicionais habilitadas (não desligadas pela revendedora, não `Fechado`, não Expositor). É a base dos totais da tela inicial. Deduplica por item de pedido.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    pieces: CondicionalVendaPiece[]   // ordenadas por saleDate desc
    piecesSold: number                // = pieces.length
    totalSales: number                // soma de saleValue (R$, float)
    hasFeature: boolean               // false = usuária legada (disabledCondicionais null) → pieces [], zeros
  }

  type CondicionalVendaPiece = {
    itemId: number        // id de order_items
    orderId: number       // id de order_groups (pedido)
    reference: string     // referência/SKU da peça (referencia da variação no Devmaster)
    clientName: string    // nome da cliente final (clients.name)
    saleValue: number     // preço efetivamente vendido (order_items.unit_price), com preço de catálogo como fallback
    image?: string        // URL da imagem (catálogo Devmaster ou snapshot salvo no item); omitida se inexistente
    saleDate: string      // ISO, createdAt do pedido
  }
  ```
  - Um pedido conta como venda quando `status ∈ {aguardando_pagamento, enviado, finalizado}` **ou** é a prazo (`selectedMethod = 'aprazo'`) com proposta selecionada; `cancelado` nunca conta. A peça é atribuída a uma condicional apenas se `order_groups.condicional_codigos` contém o código.
- **Erros**: `401`/`500` do guard. Devmaster indisponível degrada para lista vazia (nunca 503).
- **Fonte dos dados**: Postgres (`order_groups` ⨝ `clients`, `order_items`, `users.disabled_condicionais`) + Devmaster (condicionais em `/appsorelly/revendedoras/{id6}` e catálogo paginado `/appsorelly/{id6}/produtos?page=N` com `Versao: V2`, variante leniente). Sem cache.
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/auth/condicionais/vendas"
  ```

### GET /api/auth/condicionais/:codigo/vendas

- **Descrição**: histórico de peças vendidas pelo app atribuídas a UMA condicional específica (independe de ela estar desligada/fechada).
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**:
  | nome | tipo | regras |
  |---|---|---|
  | `codigo` | string | código da condicional exatamente como o Devmaster devolve (ex.: `087006`); comparado após trim |
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    pieces: CondicionalVendaPiece[]   // mesmo tipo de /condicionais/vendas, ordenado por saleDate desc
    totalSales: number                // soma de saleValue
  }
  ```
- **Erros**:
  - `400 {"error":"Código da condicional inválido."}` — código vazio após trim.
  - `404 {"error":"Condicional não encontrada."}` — código não está na lista atual do Devmaster da revendedora (também ocorre se o Devmaster estiver fora, pois a lista vem vazia).
  - `401`/`500` do guard.
- **Fonte dos dados**: idem `/condicionais/vendas` (Postgres + Devmaster).
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/auth/condicionais/087006/vendas"
  ```

---

## Proxy de imagens (`/api/image-proxy`)

### GET /api/image-proxy

- **Descrição**: baixa uma imagem de produto do servidor Devmaster (que exige header `Token`) e a devolve ao app, opcionalmente redimensionada. Resposta **binária**, não JSON.
- **Auth**: nenhuma (proteção por allowlist de host).
- **Headers**: opcional `If-None-Match: "<etag>"` → `304` se a imagem não mudou.
- **Path params**: nenhum.
- **Query params**:
  | nome | tipo | obrigatório | default | valores |
  |---|---|---|---|---|
  | `url` | string | sim (validado no handler) | — | URL absoluta `http(s)` da imagem, URL-encoded; o host deve ser o de `DEVMASTER_API_URL` ou de `DEVMASTER_IMAGE_HOST` (fallback `portalvps250.indepinfo.com.br` se ambos vazios) |
  | `variant` | string | não | `display` | `display` = WebP máx. 800×800 qualidade 80 (leve, para UI); `download` = bytes originais (reencoda só se houver rotação EXIF ou lado > 8192px) para salvar na galeria |
- **Resposta 200**: corpo binário da imagem.
  - `Content-Type`: `image/webp` (display) ou o tipo original/`image/jpeg`/`image/png`/`image/webp` (download).
  - `Cache-Control: public, max-age=31536000, immutable`
  - `ETag: "<16 hex do sha1 do conteúdo>"`
- **Erros** (corpo **`text/plain`**, não JSON):
  - `304` (sem corpo) — `If-None-Match` igual ao ETag.
  - `400 URL da imagem não fornecida` / `400 URL da imagem inválida`.
  - `403 Domínio não autorizado` — host fora da allowlist ou protocolo não-http(s).
  - `413 Imagem muito grande` — maior que `IMAGE_PROXY_MAX_BYTES` (default 10 MiB).
  - `<status do upstream> Erro ao buscar imagem` — o servidor de imagens respondeu não-OK (ex.: `404`).
  - `500 Erro ao processar imagem` — timeout/erro de rede ou erro inesperado.
  - Erro de schema (`variant` fora do enum) → `400` JSON `{"message":"erro de validacao",...}`.
- **Fonte dos dados**: servidor de imagens Devmaster (header `Token: DEVMASTER_API_KEY`, timeout `EXTERNAL_API_TIMEOUT_MS`, sem retry). **Cache em memória** por instância: LRU de até 500 entradas / 100 MB, TTL 30 dias, chave `variant:url`, com deduplicação de requisições concorrentes.
- **Exemplo**:
  ```bash
  IMG="https://fotos.sorelly.indepcloud.com.br/produtos/12345.jpg"
  curl -s -o foto.webp "$API_URL/api/image-proxy?url=$(jq -rn --arg u "$IMG" '$u|@uri')&variant=display"
  ```

---

## Novidades lidas (`/api/novidades-read`)

### GET /api/novidades-read

- **Descrição**: IDs das "novidades" (posts/comunicados cadastrados no SorellyAdmin) que a revendedora já marcou como lidas. O conteúdo das novidades não vem daqui.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  { read: string[] }   // ids (cuid do SorellyAdmin, até 64 chars), sem ordem garantida
  ```
- **Erros**: `401`/`500` do guard.
- **Fonte dos dados**: Postgres `novidades_lidas` (filtrado por `user_id`).
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/novidades-read"
  ```

---

## Progresso de vídeos (`/api/video-progress`)

### GET /api/video-progress

- **Descrição**: IDs dos vídeos (treinamentos/conteúdos do app) que a revendedora já marcou como assistidos.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  { watched: string[] }   // ids de vídeo (strings livres enviadas pelo app), sem ordem garantida
  ```
- **Erros**: `401`/`500` do guard.
- **Fonte dos dados**: Postgres `video_progress` (filtrado por `user_id`).
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/video-progress"
  ```

---

## Notificações (`/api/notifications`)

### GET /api/notifications/preferencias

- **Descrição**: preferências de push por categoria da revendedora (opt-out independente da permissão do SO). Pedidos, links de pagamento e demais avisos de sistema não passam por essas flags.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    indicacoes: boolean   // avisos do Indique & Ganhe (users.notif_indicacoes; default true)
    marketing: boolean    // pushes de marketing/broadcast do admin (users.notif_marketing; default true)
  }
  ```
- **Erros**: `401`/`500` do guard.
- **Fonte dos dados**: Postgres `users.notif_indicacoes`, `users.notif_marketing`.
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/notifications/preferencias"
  ```

---

## Avaliações de kit/representante (`/api/avaliacoes`)

### GET /api/avaliacoes/pending

- **Descrição**: estado do fluxo de pesquisa de satisfação sobre o kit (condicional) mais recente e o atendimento da representante. Em uma chamada devolve flags, estado, dados do kit e, quando é hora de responder, as perguntas. **Efeito colateral**: se o admin não tem nenhuma pergunta ativa, a pesquisa é marcada como respondida.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    state: "none" | "confirm_pickup" | "survey_pending"
      // none           → nada a fazer (flag off, sem kit elegível, sem representante, ou já respondida)
      // confirm_pickup → mostrar modal "Já peguei o kit?" (POST /api/avaliacoes/pickup)
      // survey_pending → retirada confirmada, pesquisa a responder (POST /api/avaliacoes)
    flags: {
      enabled: boolean       // AVALIACAO_ENABLED === 'true'
      obrigatoria: boolean   // AVALIACAO_OBRIGATORIA === 'true' → pesquisa bloqueia o app até ser respondida
    }
    kit?: {                  // presente em confirm_pickup e survey_pending
      codigo: string                   // código da condicional (Devmaster)
      data?: string                    // data da condicional "dd/mm/aaaa" (Devmaster)
      representanteCod: string | null  // users.representative_cod
      representanteNome: string | null // nome_representante da condicional, senão users.representative_name
    }
    perguntas?: Array<{      // só em survey_pending; ordenadas por categoria e `ordem`
      id: string
      categoria: "REPRESENTANTE" | "KIT"
      texto: string
      tipo: "ESTRELA_5" | "NOTA_10" | "MULTIPLA_ESCOLHA" | "TEXTO_LIVRE"
      opcoes: string[]       // alternativas (≥ 2 em MULTIPLA_ESCOLHA; [] nos demais)
      ordem: number
    }>
    configSync?: boolean     // true = perguntas obtidas do admin; false = admin indisponível sem cache (state vira "none")
    googleReviewUrl?: string // só em survey_pending e se AVALIACAO_GOOGLE_REVIEW_URL for http(s)
  }
  ```
  - Kit elegível = condicional **mais recente** do Devmaster que não é Expositor, não está `Fechado` e cuja `data` ≥ `AVALIACAO_MIN_CONDICIONAL_DATE` (sem data de corte, nada é elegível). Exige representante (nome na condicional ou vínculo em `users`).
- **Erros**: `401`/`500` do guard. Falhas do Devmaster ou do admin não geram erro (degradam para `state: "none"`).
- **Fonte dos dados**: Devmaster (`/appsorelly/revendedoras/{id6}`, `Versao: V2`); Postgres (`users`, tabela de confirmações de retirada/resposta); perguntas do admin `GET {API_ADMIN_URL}/avaliacoes/perguntas` com **cache em memória de 60 s** (em falha usa o cache antigo).
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/avaliacoes/pending"
  ```

---

## Preferências do kit (`/api/kit-preferences`)

### GET /api/kit-preferences

- **Descrição**: respostas salvas da revendedora no formulário "Preferências do Kit" (o que ela quer receber na próxima condicional: tipos de peça, cores, metais etc.).
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    exists: boolean               // false = nunca salvou (demais campos vazios)
    displayName: string | null    // nome exibido informado no formulário
    observations: string | null   // texto livre
    answers: Record<string, unknown>  // jsonb indexado pela `key` de cada bloco da config do kit (definida no admin, GET {API_ADMIN_URL}/kit/preferences);
                                      // o valor de cada bloco é o que o app enviou (estrutura livre, não validada pelo backend); {} quando não existe
    updatedAt: string | null      // ISO da última gravação; null se exists=false
  }
  ```
- **Erros**: `401`/`500` do guard.
- **Fonte dos dados**: Postgres `kit_preferences` (1 linha por `user_id`). Este GET não consulta o admin nem filtra blocos removidos.
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/kit-preferences"
  ```

---

## Metas de vendas (`/api/metas`)

### GET /api/metas

- **Descrição**: desafio/meta de vendas da revendedora para o ciclo atual da condicional (campanha cadastrada no admin), com progresso calculado. As condicionais são agrupadas em "famílias" (condicional mãe + reposições cujo acerto cai até 10 dias depois do da mãe); a meta exibida é a da família mais recente que tem desafio no admin.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200** (sempre 200; sem meta → campos `null` e `visivelNaHome: false`):
  ```ts
  {
    visivelNaHome: boolean          // false se não há meta, ou se já passou o dia de previsaoAcerto (calendário BR)
    condicionalCodigo: string | null// código da condicional mãe da família escolhida
    familia: { mae: string; reposicoes: string[] } | null
    meta: number | null             // valor alvo (R$) definido no admin
    media: number | null            // média histórica da revendedora (admin)
    faixa: string | null            // nome da faixa/nível (admin)
    faixaCor: string | null         // cor hex da faixa (default "#6f9dee")
    validade: string | null         // validade do desafio, string repassada do admin
    previsaoAcerto: string | null   // data_prev_devolucao da mãe, string crua do Devmaster (formato BR)
    status: "vigente" | "encerrado" | null
    bateu: boolean | null           // null enquanto vigente; resultado oficial quando encerrado
    vendido: number | null          // vigente: soma vendida pelo app na família; encerrado: vendidoFinal do admin
    vendidoFinal: number | null     // resultado oficial do admin (após acerto)
    faltam: number | null           // max(0, meta - vendido)
    progressoPct: number | null     // 0–100, arredondado
    premio: Premio | null
    grupos: Array<{                 // TODAS as famílias encontradas (mesmo sem desafio)
      mae: string
      reposicoes: string[]
      bateu: boolean | null         // só preenchido quando status = "encerrado"
      status: "vigente" | "encerrado" | null
      meta: number | null
      premio: Premio | null
    }>
  }

  type Premio = {
    nome: string
    tipo: "pecas" | "sorteio" | "comissao" | "credito"
    extra: string | null
    icone: string
    valor: number
    imageUrl: string | null
    corFundo: string                // hex, default "#F4E4C8"
    pecas: Array<{ nome: string; imageUrl: string | null; icone: string; corFundo: string; venda: number }>
  }
  ```
  - Quando há meta mas ela não é visível, a resposta é a "vazia" (todos os campos `null`) **com** `grupos` preenchido.
- **Erros**: `401`/`500` do guard. Falhas do Devmaster/admin degradam para resposta vazia.
- **Fonte dos dados**:
  - Devmaster: condicionais (`/appsorelly/revendedoras/{id6}`) e catálogo paginado (para preço/imagem das peças).
  - Admin: `GET {API_ADMIN_URL}/metas-revendedoras/app?condicional=<codigo>` para a mãe e reposições, testando variantes com/sem zeros à esquerda (`087006`, `87006`); 404 = sem desafio; prefere `vigente`. Sem cache.
  - Postgres: pedidos/itens do app (mesma regra de venda de `/api/auth/condicionais/vendas`) para `vendido` quando vigente.
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/metas"
  ```

---

## Indique & Ganhe (`/api/indicacoes`)

Programa de indicação: a revendedora compartilha um link de formulário; cada indicada que chega a `finalizado` (kit entregue) credita **1000 Sorelly Coins** (lote com validade própria, FIFO), trocáveis por prêmios em semijoias.

**Kill-switch**: se `INDICACOES_ENABLED !== 'true'`, todas as rotas abaixo **exceto** `/status` respondem `503 {"error":"Indique & Ganhe desabilitado","code":"indicacoes_disabled"}`. Esse bloqueio roda no `onRequest`, **antes** da autenticação (portanto 503 mesmo sem token).

### GET /api/indicacoes/status

- **Descrição**: diz se a feature está ligada (o app usa para mostrar/esconder o menu). Não é afetado pelo kill-switch.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  { enabled: boolean }   // INDICACOES_ENABLED === 'true'
  ```
- **Erros**: `401`/`500` do guard.
- **Fonte dos dados**: env `INDICACOES_ENABLED`.
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/indicacoes/status"
  ```

### GET /api/indicacoes/resumo

- **Descrição**: tela principal do Indique & Ganhe: saldo, link de indicação, contagens, catálogo de prêmios com o que o saldo alcança, próxima meta, regras e vencimentos. **Efeito colateral**: antes de ler, grava lançamentos de `expiracao` para lotes de moedas vencidos (transação com lock da revendedora).
- **Auth**: `requireAuth` + kill-switch.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    saldoMoedas: number                // saldo atual (soma dos lotes não gastos/não vencidos)
    linkIndicacao: string              // "<INDICACOES_FORM_BASE_URL>/?id=<userId>", ex.: "https://forms.sorellyjoias.com.br/?id=1544"
    moedasPorIndicacao: number         // 1000
    totais: {
      indicacoes: number               // total de indicações
      emAndamento: number              // status criado | em_andamento | cadastro_aprovado
      finalizadas: number              // status finalizado
      canceladas: number               // status cancelado
    }
    premios: Array<{                   // catálogo fixo (7 níveis), ordenado por custo
      codigo: string                   // "PREMIO_1".."PREMIO_7"
      nivel: number                    // 1..7
      titulo: string                   // ex.: "R$ 400 em semijoias"
      valorCentavos: number            // ex.: 40000
      custoMoedas: number              // 1000, 2000, ... 7000
      resgatavel: boolean              // saldoMoedas >= custoMoedas
    }>
    proximoPremio: {                   // prêmio mais barato ainda não alcançado; null se alcança todos
      codigo: string; titulo: string; custoMoedas: number; faltamMoedas: number
    } | null
    regras: {
      moedasValidadeDias: number       // INDICACOES_MOEDAS_VALIDADE_DIAS (90)
      limiteFinalizadas: number        // INDICACOES_LIMITE_FINALIZADAS (200; 0 = sem limite)
      alertaVencimentoDias: number     // INDICACOES_ALERTA_VENCIMENTO_DIAS (7)
    }
    limiteIndicacoes: {
      usadas: number                   // = totais.finalizadas
      maximo: number                   // = regras.limiteFinalizadas
      atingido: boolean                // maximo > 0 && usadas >= maximo
    }
    validade: {
      moedasExpirandoEmBreve: number   // moedas que vencem dentro de alertaVencimentoDias
      proximoVencimentoEm: string | null  // ISO do vencimento mais próximo
      lotes: Array<{                   // lotes com saldo e prazo, do que vence antes ao que vence depois
        indicacaoId: number | null
        restante: number
        expiraEm: string               // ISO
        diasRestantes: number          // 0 = vence hoje
      }>
    }
    notificacoes: { ativas: boolean }  // users.notif_indicacoes
  }
  ```
- **Erros**: `503 indicacoes_disabled`; `401`/`500` do guard.
- **Fonte dos dados**: Postgres (`sorelly_coin_entries`, `indicacoes`, `users`); catálogo de prêmios é constante no código; regras vêm de env.
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/indicacoes/resumo"
  ```

### GET /api/indicacoes/historico

- **Descrição**: indicações feitas pela revendedora (pessoas indicadas), paginadas, com status e moedas creditadas.
- **Auth**: `requireAuth` + kill-switch.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**:
  | nome | tipo | default | regras |
  |---|---|---|---|
  | `limit` | inteiro | 50 | limitado a [1, 200]; valor não-inteiro/negativo é ignorado (usa default) |
  | `offset` | inteiro | 0 | ≥ 0; valor inválido vira 0 |
- **Resposta 200**:
  ```ts
  {
    indicacoes: Array<{              // ordenado por criadoEm desc, id desc
      id: number
      nome: string | null            // nome da indicada
      whatsapp: string | null        // formatado "(11) 99999-8888"; null se não for número BR de 10/11 dígitos
      status: "criado" | "em_andamento" | "cadastro_aprovado" | "cancelado" | "finalizado"
      statusLabel: string            // "Cadastro iniciado" | "Cadastro em andamento" | "Cadastro aprovado" | "Cancelada" | "Kit entregue"
      moedasCreditadas: number       // soma dos lançamentos indicacao_finalizada desta indicação (0 ou 1000)
      criadoEm: string               // ISO
      atualizadoEm: string           // ISO
    }>
    paginacao: { total: number; limit: number; offset: number; hasMore: boolean }
    contagens: {
      emAberto: number               // criado + em_andamento + cadastro_aprovado
      finalizados: number            // finalizado + cancelado
    }
  }
  ```
- **Erros**: `503 indicacoes_disabled`; `401`/`500` do guard.
- **Fonte dos dados**: Postgres `indicacoes`, `sorelly_coin_entries`.
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/indicacoes/historico?limit=20&offset=0"
  ```

### GET /api/indicacoes/extrato

- **Descrição**: extrato de Sorelly Coins (créditos, resgates, estornos, ajustes, expirações) + resumo de validade. Últimos **100** lançamentos, sem paginação. **Efeito colateral**: grava `expiracao` dos lotes vencidos antes de listar.
- **Auth**: `requireAuth` + kill-switch.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    saldoMoedas: number
    regras: { moedasValidadeDias: number; limiteFinalizadas: number; alertaVencimentoDias: number }
    validade: {                       // mesmo formato de /resumo
      moedasExpirandoEmBreve: number
      proximoVencimentoEm: string | null
      lotes: Array<{ indicacaoId: number | null; restante: number; expiraEm: string; diasRestantes: number }>
    }
    lancamentos: Array<{              // ordenado por criadoEm desc, id desc; máx. 100
      id: number
      tipo: "indicacao_finalizada" | "resgate" | "estorno_resgate" | "ajuste_manual" | "expiracao"
      amount: number                  // positivo = crédito, negativo = débito
      saldoDepois: number             // saldo após o lançamento
      descricao: string | null
      indicacaoId: number | null
      resgateId: number | null
      expiraEm: string | null         // ISO, prazo do lote (créditos com validade)
      criadoEm: string                // ISO
    }>
  }
  ```
- **Erros**: `503 indicacoes_disabled`; `401`/`500` do guard.
- **Fonte dos dados**: Postgres `sorelly_coin_entries`.
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/indicacoes/extrato"
  ```

### GET /api/indicacoes/resgates

- **Descrição**: resgates de prêmios solicitados pela revendedora (troca de moedas por semijoias), paginados.
- **Auth**: `requireAuth` + kill-switch.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: `limit` (default 50, [1, 200]) e `offset` (default 0) — mesmas regras de `/historico`.
- **Resposta 200**:
  ```ts
  {
    resgates: Array<{                 // ordenado por criadoEm desc, id desc
      id: number
      premioCodigo: string            // snapshot do prêmio no momento do resgate
      premioNivel: number
      premioTitulo: string
      premioValorCentavos: number
      custoMoedas: number
      status: "solicitado" | "aprovado" | "entregue" | "cancelado"
      retiradaEm: string | null       // dia combinado da retirada "YYYY-MM-DD"
      criadoEm: string                // ISO
      entregueEm: string | null       // ISO
      canceladoEm: string | null      // ISO
      canceladoMotivo: string | null
    }>
    paginacao: { total: number; limit: number; offset: number; hasMore: boolean }
    contagens: {
      emAberto: number                // solicitado + aprovado
      finalizados: number             // entregue + cancelado
    }
  }
  ```
- **Erros**: `503 indicacoes_disabled`; `401`/`500` do guard.
- **Fonte dos dados**: Postgres `indicacao_resgates`.
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/indicacoes/resgates?limit=50"
  ```

### GET /api/indicacoes/consentimento

- **Descrição**: se a revendedora aceitou a versão vigente do termo/regulamento do Indique & Ganhe (versão atual: `v2`; ao subir a versão, todas precisam aceitar de novo).
- **Auth**: `requireAuth` + kill-switch.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    aceito: boolean           // existe aceite para a versão vigente
    versao: string            // "v2"
    aceitoEm: string | null   // ISO do aceite
  }
  ```
- **Erros**: `503 indicacoes_disabled`; `401`/`500` do guard.
- **Fonte dos dados**: Postgres `indicacao_consentimentos`; versão é constante no código.
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/indicacoes/consentimento"
  ```

---

## Reportes de problema em produto (`/api/product-reports`)

### GET /api/product-reports/pending

- **Descrição**: códigos de produto do catálogo para os quais a revendedora tem reporte de problema (foto/nome/preço incorreto) ainda pendente de triagem pelo admin. O app usa para mostrar o botão como "já reportado".
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  { productCodes: string[] }   // productCode enviado na criação do reporte (≤ 50 chars), um por produto pendente; sem ordem garantida
  ```
- **Erros**: `401`/`500` do guard.
- **Fonte dos dados**: Postgres `product_issue_reports` (`user_id` = usuária, `status = 'pendente'`).
- **Exemplo**:
  ```bash
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/product-reports/pending"
  ```

---

# Parte B — Produtos, pedidos, garantias, clientes, vendas e Mercado Pago

## Produtos (`/api/products`)

### GET /api/products

- **Descrição**: catálogo bruto de produtos de uma revendedora, vindo do ERP Devmaster. É um endpoint legado e **sem autenticação**. Remove produtos indisponíveis e os da categoria "MATERIAL DE USO GERAL", exceto os códigos `MP0054`, `MU0067` e `MU0087`.
- **Auth**: nenhuma.
- **Headers**: nenhum.
- **Path params**: nenhum.
- **Query params**:
  - `user_id` (string, **obrigatório** pelo schema): id da revendedora (usuário). Vai **sem** padding no path do Devmaster.
  - `page` (string numérica ≥ 1, opcional): página do Devmaster. Se omitido, a URL vai sem `?page` e o Devmaster decide o que devolve.
- **Resposta 200**: array de `Product`, **repassado do Devmaster** depois dos filtros (sem enriquecimento).
  ```ts
  type Product = {
    produto: string          // código do produto (ex.: "CL2623")
    descricao: string
    categoria: string        // ex.: "12 - BRINCOS" (texto cru do ERP)
    quantidade_vendas: number
    material: string
    estoque: number
    disponivel: boolean      // sempre true aqui (filtrado)
    condicionais?: Array<{ codigo: string; data: string; data_acerto: string; data_prev_devolucao: string; status: string }>
    variacoes: Array<{
      produto: string; descricao: string; tamanho?: string
      mais_vendido: string; quantidade_vendas: number
      referencia: string     // SKU da variação
      estoque: number; valor: number
      condicional?: string   // código da condicional (lote consignado) de origem
      disponivel: boolean
      imagem: string[]       // URLs de foto
      // o ERP pode mandar outros campos (ex.: `reposicao: "S"|"N"`), que são repassados
    }>
  }[]
  ```
- **Erros**:
  - `400 {message:"erro de validacao", issues}`: falta `user_id`.
  - `400 {error:"user_id is required"}`: `user_id` vazio ou só com espaços.
  - `400 {error:"page inválido"}`: `page` não numérico ou < 1.
  - `500 {error:"Failed to fetch products"}`: Devmaster com erro HTTP, timeout, `DEVMASTER_API_KEY` ausente ou payload inesperado.
- **Fonte dos dados**: Devmaster (`/appsorelly/{user_id}/produtos`), sem cache e sem Postgres.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/products?user_id=123&page=1"
  ```

### GET /api/products/status

- **Descrição**: catálogo da revendedora autenticada, classificado por estado de cada peça: **vendidos**, **em pedidos** (reservados para uma cliente, agrupados por cliente) e **disponíveis**. Os filtros de busca e categoria são aplicados no servidor. É a tela principal de produtos do app.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params** (todos opcionais, `additionalProperties: true`):
  - `page` (string numérica ≥ 1): busca **só** essa página do Devmaster. Sem `page`, o servidor pagina o Devmaster inteiro (até receber página vazia).
  - `busca` ou `search` (string): busca case-insensitive em `produto`, `descricao`, `variacoes[].referencia` e `variacoes[].tamanho`. `busca` tem precedência.
  - `categoria` ou `category` (string): uma ou mais categorias separadas por vírgula, comparadas case-insensitive com o nome **limpo** (sem o prefixo `"NN - "`). `categoria` tem precedência.
- **Resposta 200**:
  ```ts
  {
    total: number          // nº de produtos após filtros de busca/categoria
    vendidos: number       // = produtos.vendidos.length
    emPedidos: number      // = produtos.emPedidos.length (nº de CLIENTES com reserva)
    disponiveis: number    // = produtos.disponiveis.length
    categorias: string[]   // categorias limpas (sem "NN - "), ordenadas, de TODO o catálogo visível (antes de busca/categoria)
    produtos: {
      vendidos: ProductWithStatus[]
      emPedidos: Array<{
        id: number         // id da cliente (clients.id)
        nome: string
        whatsapp: string
        produtos: ProductWithStatus[]
      }>
      disponiveis: ProductWithStatus[]   // ordenados: com foto real > só foto de embalagem/placeholder "_04" > sem foto; depois por `produto` (pt-BR)
    }
  }
  // ProductWithStatus = Product do Devmaster (ver GET /api/products) +
  type ProductWithStatus = Product & {
    vendido: boolean            // true no bloco `vendidos`
    vendasRegistradas: number   // soma das unidades vendidas nas variações do bloco
    variacoes: Array<Variacao & {
      estoque: number           // SOBRESCRITO: nº de unidades daquele bloco (vendidas, reservadas ou disponíveis)
      vendido: boolean
      emPedido: boolean
      clientePedido: { id: number; name: string; whatsapp: string; groupId: number } | null  // preenchido em emPedido
      vendasRegistradas: number
    }>
  }
  ```
  Regras relevantes:
  - Uma variação com estoque > 1 é **dividida** em até 3 entradas (vendida, reservada, disponível), cada uma com o seu `estoque`.
  - Variações duplicadas com mesma `referencia` e `tamanho` são fundidas: o estoque é somado e fica o maior `valor`.
  - Produtos com várias variações **sem `tamanho`** viram produtos separados, com `produto = referencia`.
  - Variações de condicionais desativadas pela revendedora, fechadas ou do tipo "Expositor" ficam ocultas. Peças de reposição (`reposicao:"S"`) sempre aparecem.
  - "Vendido" conta só peças de pedidos **finalizados** das condicionais habilitadas. Para usuário legado (`disabledCondicionais = null`), conta pela tabela `sales` dentro do ciclo atual.
  - "Em pedido" conta peças de pedidos com status ≠ `finalizado` e ≠ `cancelado`, atribuídas a uma condicional habilitada (ou, em pedido legado, dentro da janela do ciclo).
- **Erros**:
  - 401 (ver §2).
  - `400 {error:"Parâmetro 'page' inválido. Informe um número maior ou igual a 1."}`
  - `503 {error:"Não foi possível carregar os produtos no momento. Tente novamente em instantes.", code:"UPSTREAM_UNAVAILABLE", retryable:true}`: Devmaster fora do ar ou com status não-OK.
- **Fonte dos dados**: Devmaster `produtos` (com `Versao: V2`) e Devmaster `revendedoras/{id6}` (condicionais, para o ciclo). Do Postgres vêm `sales`, `order_items`, `order_groups` e `clients`. **Cache in-memory** por processo/instância, com TTL `PRODUCTS_STATUS_CACHE_TTL_MS` (padrão 60000 ms; `≤0` desliga). A chave é `userId + page + busca + search + categoria + category + disabledCondicionais`. Requisições idênticas em paralelo compartilham a mesma promessa (dedupe in-flight). O cache do usuário é invalidado quando há mutação em pedidos ou vendas.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/products/status?busca=anel&categoria=ANÉIS,BRINCOS" \
    -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/products/orders

- **Descrição**: lista os pedidos (`order_groups`) da revendedora com cliente, itens, status de pagamento e endereço de entrega. Pedidos **abertos** sempre aparecem. Pedidos `finalizado` e `cancelado` só aparecem se estiverem atribuídos a uma condicional habilitada; para usuário legado, todos aparecem.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`. Recomendado: `X-App-Version`. Não bloqueia, mas muda o formato de `client.whatsapp`: com versão ≥ `MIN_APP_VERSION`, o número vem canônico **com** DDI (ex.: `5541999999999`). Sem header ou com versão abaixo da mínima, vem **sem** o `55`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    orders: Array<{
      id: number                        // order_groups.id (= groupId usado nas demais rotas)
      client: { id: number; name: string; whatsapp: string }
      status: "pendente" | "proposta" | "aguardando_pagamento" | "enviado" | "finalizado" | "cancelado"
      selectedProposalId: number | null
      selectedMethod: string | null     // "avista" | "parcelado" | "aprazo" | "mercadopago_link" | null
      paymentRequestStatus: "em_analise" | "gerado" | "aguardando_pagamento" | "pago" | "cancelado" | null  // último payment_request (link Sorelly/Kommo)
      paymentConfirmation:              // jsonb; formatos conhecidos:
        | { confirmed: boolean; confirmedAt?: string }                                  // avista/parcelado
        | { installments: Array<{ dueDate: string /*YYYY-MM-DD*/; paid: boolean; paidAt?: string }> } // aprazo
        | null
      createdAt: string                 // ISO
      deliveryMethod: "entrega" | "retirada"
      address: { cep: string|null; street: string|null; number: string|null; complement: string|null;
                 neighborhood: string|null; city: string|null; state: string|null } | null  // só se deliveryMethod="entrega"
      items: Array<{
        id: number                      // order_items.id
        referenceId: string             // SKU
        product:                        // 1º: variação ao vivo do Devmaster; 2º: snapshot salvo no item; senão null
          | DevmasterVariacao           // mesmos campos de `variacoes[]` de GET /api/products
          | { descricao: string; referencia: string; tamanho?: string; valor: number; imagem: string[] }
          | null
      }>
    }>
    meta: {
      currentCycleStartedAt: string | null  // início do ciclo de vendas atual (ISO), informativo
      cycleFilterApplied: boolean           // true se havia ciclo ativo (false quando não há pedidos)
    }
  }
  ```
  - **Ordenação**: por status (`pendente`, `enviado`, `proposta`, `aguardando_pagamento`, `finalizado`, `cancelado`) e depois `createdAt` decrescente.
  - Em `aprazo` com proposta selecionada, `paymentConfirmation.installments` é **reconstruído** a partir das datas da proposta (`methods.aprazo.parcelas[].dueDate` + `methods.aprazo.parcelaDates`), preservando o `paid`/`paidAt` gravados.
- **Erros**:
  - 401.
  - `503 {error:"Não foi possível carregar seus pedidos no momento. Tente novamente em instantes.", code:"UPSTREAM_UNAVAILABLE", retryable:true}`: falha do catálogo Devmaster (paginação estrita).
  - A segunda chamada ao Devmaster (detalhe dos itens, timeout 10 s) **não** gera erro: se falhar, `product` cai para o snapshot ou `null`.
- **Fonte dos dados**: Postgres (`order_groups`, `clients`, `order_items`, `payment_requests`, `order_payment_proposals`) e Devmaster (catálogo completo para atribuir condicionais, mais 1 chamada sem paginação para os detalhes; `revendedoras/{id6}` para as condicionais). Sem cache.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/products/orders" \
    -H "Authorization: Bearer $TOKEN" -H "X-App-Version: 3.2.2"
  ```

### GET /api/products/orders/proposal

- **Descrição**: propostas de pagamento (à vista / parcelado / a prazo / Mercado Pago) enviadas para um pedido, junto com a proposta e o método escolhidos pela cliente e a confirmação de pagamento.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**:
  - `groupId` (numérico, **obrigatório**): id do pedido.
  - `selectedOnly` (`"true"` para ativar; qualquer outro valor equivale a false): devolve só a proposta selecionada.
- **Resposta 200**:
  ```ts
  type Proposal = {
    id: number
    groupId: number
    userId: number
    methods: {                 // jsonb livre gravado pelo app; campos conhecidos:
      totalValue: number       // valor total da proposta (obrigatório na criação, > 0)
      avista?: unknown
      parcelado?: unknown
      aprazo?: {               // campos lidos pelo backend:
        entrada?: number; entradaValue?: number; numParcelas?: number
        parcelas?: Array<{ dueDate?: string; amount?: number }>
        parcelaDates?: string[]
      }
      mercadopago?: unknown
      [k: string]: unknown
    }
    sentAt: string             // ISO
  }
  // selectedOnly=true:
  { selectedProposal: Proposal | null; selectedProposalId: number | null; selectedMethod: string | null; paymentConfirmation: unknown | null }
  // padrão:
  { proposals: Proposal[]        // ordenadas por sentAt desc
    selectedProposalId: number | null
    selectedMethod: string | null
    selectedProposal: Proposal | null
    paymentConfirmation: unknown | null   // ver formatos em GET /orders
    proposal: Proposal | null }           // = proposals[0] (a mais recente)
  ```
- **Erros**:
  - 401.
  - `400 {error:"Informe o groupId do pedido."}`: ausente ou não numérico.
  - `404 {error:"Pedido não encontrado."}`: pedido inexistente ou de outra revendedora.
- **Fonte dos dados**: Postgres (`order_groups`, `order_payment_proposals`).
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/products/orders/proposal?groupId=4512&selectedOnly=true" \
    -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/products/orders/payment-confirmation

- **Descrição**: estado de confirmação de pagamento de um pedido, ou seja, se a revendedora marcou como recebido (à vista/parcelado) ou quais parcelas a prazo foram pagas.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: `groupId` (numérico, **obrigatório**).
- **Resposta 200**:
  ```ts
  {
    groupId: number
    selectedMethod: string | null
    paymentConfirmation:
      | { confirmed: boolean; confirmedAt?: string }
      | { installments: Array<{ dueDate: string; paid: boolean; paidAt?: string }> }
      | null       // valor cru do jsonb (aqui NÃO é reconstruído a partir da proposta)
  }
  ```
- **Erros**:
  - 401.
  - `400 {error:"Informe o groupId do pedido."}`
  - `404 {error:"Pedido não encontrado."}`
- **Fonte dos dados**: Postgres (`order_groups`).
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/products/orders/payment-confirmation?groupId=4512" \
    -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/products/orders/payment-request

- **Descrição**: última solicitação de **link de pagamento Sorelly** (fluxo manual via Kommo/CRM, diferente do link Mercado Pago) feita para o pedido.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: `groupId` (inteiro > 0, **obrigatório**).
- **Resposta 200**:
  ```ts
  {
    paymentRequest: {
      id: number
      userId: number
      groupId: number
      orderId: string              // id externo informado pelo app/gateway
      amount: string               // numeric, ex.: "350.00"
      cardBrand: string | null
      installments: number | null
      clientName: string | null
      requestedAt: string          // ISO
      paymentLink: string | null   // preenchido quando o link é gerado (webhook Kommo)
      kommoLeadId: number | null
      representativeName: string | null
      representativeCnpj: string | null
      status: "em_analise" | "gerado" | "aguardando_pagamento" | "pago" | "cancelado"
      observation: string | null
      createdAt: string
    } | null                       // null se nunca houve solicitação
  }
  ```
- **Erros**:
  - 401.
  - `400 {error:"groupId inválido."}`: ausente, não numérico ou ≤ 0.
  - Não valida se o pedido existe: um `groupId` de outra revendedora simplesmente retorna `null`.
- **Fonte dos dados**: Postgres (`payment_requests`, o mais recente por `createdAt`).
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/products/orders/payment-request?groupId=4512" \
    -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/products/public/:userId/client

- **Descrição**: endpoint **público**, usado pelo catálogo compartilhável, que procura uma cliente da revendedora pelo número de WhatsApp para pré-preencher nome e endereço num pedido.
- **Auth**: nenhuma. Atenção: expõe nome e endereço da cliente a quem souber `userId` + WhatsApp.
- **Headers**: nenhum.
- **Path params**: `userId` (inteiro): id da revendedora.
- **Query params**: `whatsapp` (string, obrigatório na prática): qualquer formatação. Só os dígitos são considerados, com mínimo de 10. A comparação é **exata** contra os dígitos de `clients.whatsapp`, então o formato precisa bater com o armazenado (com ou sem `55`).
- **Resposta 200**:
  ```ts
  { found: false }
  // ou
  { found: true,
    client: { id: number; name: string; whatsapp: string;
              cep: string|null; logradouro: string|null; numero: string|null; complemento: string|null;
              bairro: string|null; cidade: string|null; estado: string|null } }
  ```
- **Erros**:
  - `400 {error:"userId inválido."}`
  - `400 {error:"Informe um número de WhatsApp válido (mín. 10 dígitos)."}`
  - `404 {error:"Usuário não encontrado."}`
- **Fonte dos dados**: Postgres (`users`, `clients`).
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/products/public/123/client?whatsapp=5541999999999"
  ```

### GET /api/products/public/:userId/catalog

- **Descrição**: endpoint **público**: mesmo payload de `GET /api/products/status` para uma revendedora, mais o bloco `user`. Serve à página pública do catálogo.
- **Auth**: nenhuma.
- **Headers**: nenhum.
- **Path params**: `userId` (inteiro).
- **Query params**: os mesmos de `/api/products/status` (`page`, `busca`/`search`, `categoria`/`category`), sem schema.
- **Resposta 200**:
  ```ts
  { user: { id: number; name: string } } & ProductsStatusResult  // ver GET /api/products/status
  ```
  Atenção: o bloco `produtos.emPedidos` traz **nome e WhatsApp das clientes** com reserva, sem autenticação.
- **Erros**:
  - `400 {error:"ID do usuário é obrigatório."}`: `userId` não numérico.
  - `404 {error:"Usuário não encontrado."}`
  - `400` por `page` inválido e `503 UPSTREAM_UNAVAILABLE`, iguais a `/status`.
- **Fonte dos dados**: idem `/status` (Devmaster + Postgres) e **o mesmo cache** `PRODUCTS_STATUS_CACHE_TTL_MS`, compartilhado com `/status`.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/products/public/123/catalog?categoria=BRINCOS"
  ```

### GET /api/products/public/:userId

- **Descrição**: endpoint **público e legado**: lista simples de produtos disponíveis da revendedora. Remove as variações cujo SKU já está vendido (`sales`) ou em pedido aberto, respeitando o início do ciclo atual quando existe.
- **Auth**: nenhuma.
- **Headers**: nenhum.
- **Path params**: `userId` (inteiro).
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    user: { id: number; name: string }
    products: Product[]   // formato Devmaster (ver GET /api/products), só disponivel=true e com ≥1 variação livre
    total: number         // = products.length
  }
  ```
  Se o Devmaster falhar nas duas tentativas (URL com id padded `000123` e depois com id bruto `123`), retorna **200** com `products: []` e `total: 0`, sem erro.
- **Erros**:
  - `400 {error:"ID do usuário é obrigatório."}`
  - `404 {error:"Usuário não encontrado."}`
- **Fonte dos dados**: Devmaster `produtos` (sem paginação, sem `Versao`), Devmaster `revendedoras/{id6}` (ciclo) e Postgres (`users`, `sales`, `order_items`/`order_groups`). Sem cache.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/products/public/123"
  ```

## Certificados de garantia por pedido (`/api/products/orders`)

Sub-plugin registrado dentro de `/api/products/orders` (`warranty-certificates.routes.ts`). Os certificados são emitidos pela **Garantify** e espelhados na tabela `warranty_certificates`. A resposta tem **schema de saída estrito** (`additionalProperties:false`): só os campos listados são serializados.

### GET /api/products/orders/:groupId/certificates

- **Descrição**: certificados de garantia emitidos para as peças de um pedido (venda), com o link da carteira digital Garantify da cliente para compartilhar por WhatsApp.
- **Auth**: `requireAuth` + gate de versão Garantify.
- **Headers**: `Authorization: Bearer $TOKEN`, `X-App-Version: <semver ≥ MIN_APP_VERSION>` (**obrigatório**).
- **Path params**: `groupId` (string com inteiro > 0).
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    certificates: Array<{
      id: number                     // warranty_certificates.id
      garantifyId: string            // UUID do certificado na Garantify
      code: string                   // código legível do certificado
      productName: string | null
      productCode: string | null     // SKU
      productImageUrl: string | null // prioriza rawData.produtoFotoUrl (HTTPS Garantify); fallback = snapshot local
      consumerName: string | null    // titular (consumidor final) na Garantify
      consumerId: string | null
      clientId: number | null        // FK ou snapshot (sobrevive a delete da cliente)
      clientName: string | null
      groupId: number | null         // FK ou snapshot
      status: string                 // status cru Garantify (ex.: "Ativa", "Cancelada")
      issuedAt: string               // ISO
      expiresAt: string | null
      cancellationReason: string | null  // de rawData.motivoCancelamento
      cancelledAt: string | null         // de rawData.dataCancelamento
      walletUrl: string | null       // URL da carteira + "?pwd=<whatsapp dígitos>"; null se ainda não gerada
      recipientPhone: string | null  // telefone do destinatário se o certificado foi transferido
    }>                               // ordenado por issuedAt desc; [] se não houver
  }
  ```
  `walletUrl`: se o certificado foi transferido, aponta para a carteira do destinatário atual. Senão, é a carteira da cliente do pedido (lida do `clients.metadata.garantify.walletUrl`). Se a carteira ainda não estiver no cache, retorna `null` e dispara a criação **em background** (a próxima leitura já deve trazer a URL).
- **Erros**:
  - 401.
  - `503 {error:"Atualize o aplicativo para acessar certificados.", code:"app_version_missing", min_version}` ou `503 {error:"Versão do aplicativo desatualizada. Atualize para continuar.", code:"app_version_below_min", min_version}`.
  - `400 {error:"groupId inválido."}`
  - Pedido inexistente ou de outra revendedora → `200 {certificates: []}` (não há 404).
- **Fonte dos dados**: Postgres (`warranty_certificates`, `clients.metadata`). Pode chamar a Garantify **em background** (wallet ensure), sem afetar a resposta.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/products/orders/4512/certificates" \
    -H "Authorization: Bearer $TOKEN" -H "X-App-Version: 3.2.2"
  ```

### GET /api/products/orders/:groupId/certificates/:code

- **Descrição**: detalhe de um certificado de garantia pelo código, com payload bruto da Garantify, histórico de transferências e link da carteira.
- **Auth**: `requireAuth` + gate de versão Garantify.
- **Headers**: `Authorization: Bearer $TOKEN`, `X-App-Version` (**obrigatório**).
- **Path params**:
  - `groupId` (inteiro > 0): só é **validado**. A busca real é por `code` + revendedora, ou seja, `groupId` não precisa bater com o pedido do certificado.
  - `code` (string não vazia): `warranty_certificates.code`.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    certificate: CertificateSummary /* mesmos campos da listagem acima */ & {
      rawData: Record<string, unknown>   // payload Garantify gravado (repassado). Campos conhecidos:
                                         // id, codigoCertificado, status, dataEmissao, dataExpiracao, consumidorId,
                                         // consumidorNome, consumidorEmail, clienteId, clienteNome, clienteEmail,
                                         // clienteTelefone, produtoId, produtoNome, produtoCodigo, marcaNome,
                                         // metadata, transferencias, produtoFotoUrl, motivoCancelamento, dataCancelamento
      walletUrl: string | null
      transferencias: Array<{            // de rawData.transferencias, ordem cronológica ASC
        deConsumidorId: string | null; deConsumidorNome: string | null; deConsumidorEmail: string | null
        paraConsumidorId: string | null; paraConsumidorNome: string | null; paraConsumidorEmail: string | null
        data: string                     // ISO
      }>
    }
  }
  ```
  Aqui, se a carteira não está no cache, a rota **aguarda** a criação (`ensureGarantifyWalletIfMissing` com `force: true`, chamada HTTP à Garantify) antes de responder. Se falhar, `walletUrl: null`.
- **Erros**:
  - 401.
  - 503 do gate de versão (mesmos formatos acima).
  - `400 {error:"groupId inválido."}` ou `400 {error:"code inválido."}`
  - `404 {error:"Certificado não encontrado."}`: código inexistente ou de outra revendedora.
- **Fonte dos dados**: Postgres (`warranty_certificates`, `clients`, `users.metadata.garantify.operadorId`) e Garantify (geração de carteira, só quando necessário).
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/products/orders/4512/certificates/SRL-ABC123" \
    -H "Authorization: Bearer $TOKEN" -H "X-App-Version: 3.2.2"
  ```

## Certificados — histórico (`/api/certificates`)

### GET /api/certificates

- **Descrição**: histórico paginado de **todos** os certificados de garantia da revendedora, incluindo os órfãos (pedido ou cliente apagados), com busca, filtro por situação e contagem por aba.
- **Auth**: `requireAuth` + gate de versão Garantify.
- **Headers**: `Authorization: Bearer $TOKEN`, `X-App-Version` (**obrigatório**).
- **Path params**: nenhum.
- **Query params** (todos opcionais; chaves extras são descartadas):
  - `situacao` (`"emitido" | "cancelado" | "expirado"`): situação como o app exibe.
    - `emitido`: status ativo (`ativa`/`ativo`/`active`/`emitido`/`emitida`/`issued`) e não vencido.
    - `cancelado`: `cancelada`/`cancelado`/`canceled`/`cancelled`.
    - `expirado`: status expirado/vencido, ou ativo com `expiresAt < now()`.
    - Tem precedência sobre `status`.
  - `status` (string 1..64): status **exato** gravado (ex.: `"Ativa"`). Ignorado se `situacao` vier.
  - `search` (string 1..200): ILIKE em `code`, `productName`, `productCode`, `consumerName`, `clientName` e no id do pedido.
  - `page` (inteiro ≥ 1, padrão 1).
  - `pageSize` (inteiro 1..100, padrão 20).
- **Resposta 200** (sem schema de saída):
  ```ts
  {
    total: number          // total com filtros aplicados
    page: number
    pageSize: number
    totalPages: number     // mín. 1
    items: CertificateSummary[]  // mesmos campos de GET /api/products/orders/:groupId/certificates (inclui walletUrl e recipientPhone); ordenado por issuedAt desc
    contagem: {            // totais da revendedora IGNORANDO search/situacao/status
      todos: number        // só status reconhecidos (ativo/cancelado/expirado); pendente/falhou não contam
      emitido: number
      cancelado: number
      expirado: number
    }
  }
  ```
  `walletUrl` funciona como na listagem por pedido: valor em cache ou `null`, e cache ausente dispara a criação em background.
- **Erros**:
  - 401.
  - 503 do gate de versão.
  - `400 {message:"erro de validacao", issues}`: `situacao` fora do enum, `page`/`pageSize` inválidos ou fora da faixa, `search`/`status` vazios.
- **Fonte dos dados**: Postgres (`warranty_certificates`, `clients`). Garantify só em background.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/certificates?situacao=emitido&search=anel&page=1&pageSize=20" \
    -H "Authorization: Bearer $TOKEN" -H "X-App-Version: 3.2.2"
  ```

### GET /api/certificates/by-garantify-id/:garantifyId

- **Descrição**: busca reversa de um certificado local pelo UUID Garantify. O app usa isso para ir de uma reclamação resolvida (`certificadoSubstitutoId`) ao certificado substituto.
- **Auth**: `requireAuth` + gate de versão Garantify.
- **Headers**: `Authorization: Bearer $TOKEN`, `X-App-Version` (**obrigatório**).
- **Path params**: `garantifyId` (string 1..200).
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    certificadoId: number          // warranty_certificates.id
    garantifyId: string
    codigoCertificado: string      // = code
    sorellySaleId: number | null   // id do pedido (FK ou snapshot)
    produtoNome: string | null
    consumidorNome: string | null
    status: string
  }
  ```
- **Erros**:
  - 401.
  - 503 do gate de versão.
  - `400 {error:"ID de certificado inválido.", code:"invalid_garantify_id"}`: só espaços.
  - `404 {error:"Certificado não encontrado.", code:"certificate_not_found"}`: inexistente ou de outra revendedora.
- **Fonte dos dados**: Postgres (`warranty_certificates`).
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/certificates/by-garantify-id/3f1c2e0a-1111-2222-3333-444455556666" \
    -H "Authorization: Bearer $TOKEN" -H "X-App-Version: 3.2.2"
  ```

## Reclamações de garantia (`/api/claims`)

As reclamações (acionamentos de garantia) **ficam só na Garantify**. O backend faz proxy de `GET {GARANTIFY_API_URL}/api/v1/reclamacoes...` com os headers `X-Garantify-API-Key` e `X-Garantify-Operador-Id`. O timeout é de 5 s, com até 2 retentativas em 5xx ou erro de rede. Antes, o backend garante o **operador Garantify** da revendedora (`users.metadata.garantify.operadorId`), provisionando-o na hora se faltar.

### GET /api/claims

- **Descrição**: lista paginada das reclamações de garantia abertas pelas clientes da revendedora, enriquecida com foto e SKU do certificado local.
- **Auth**: `requireAuth` + gate de versão Garantify.
- **Headers**: `Authorization: Bearer $TOKEN`, `X-App-Version` (**obrigatório**).
- **Path params**: nenhum.
- **Query params** (opcionais; extras são descartados):
  - `status` (string 1..64): repassado à Garantify (status do pipeline, ex.: `"Pendente"`, `"Finalizada"`).
  - `search` (string 1..200): repassado à Garantify.
  - `page` (inteiro ≥ 1, padrão 1).
  - `pageSize` (inteiro 1..100, padrão 20).
  - `certificadoId` (string 1..200, UUID Garantify do certificado): filtro **local**. O backend busca até 200 itens na Garantify, filtra e pagina localmente. Nesse modo, `total` reflete só esses até 200 itens.
- **Resposta 200**:
  ```ts
  {
    total: number; page: number; pageSize: number; totalPages: number
    items: Array<{
      id: string                     // UUID da reclamação (Garantify)
      protocolo: string
      certificadoId: string          // UUID Garantify do certificado
      codigoCertificado: string | null
      consumidorNome: string | null
      produtoNome: string | null
      produtoCodigo: string | null   // do snapshot local warranty_certificates.product_code
      produtoImagemUrl: string | null// do snapshot local (null se o certificado não existir localmente)
      descricao: string              // texto do problema relatado
      status: string                 // status Garantify; "Finalizado"/variações viram "Finalizada"
      currentStage: { slug: string; nome: string; cor?: string | null } | null  // estágio do pipeline; terminal → {slug:"finalizada", nome:"Finalizado"}
      visualizada: boolean
      criadoEm: string               // ISO
      atualizadoEm: string | null
    }>
  }
  ```
  Escopo multi-tenant: a Garantify filtra por `metadata.sorellyRevendedorId = <userId>`.
- **Erros**:
  - 401.
  - 503 do gate de versão (`"Atualize o aplicativo para acessar reclamações."` / `"Versão do aplicativo desatualizada..."`).
  - `400 {message:"erro de validacao", issues}`: query inválida.
  - `400 {error:"Operador Garantify não provisionado. Tente novamente em alguns segundos.", code:"operador_not_provisioned"}`
  - `500 {message:"erro interno do servidor"}`: qualquer falha da Garantify (4xx/5xx/timeout) **não é mapeada** nesta rota.
- **Fonte dos dados**: Garantify (lista) e Postgres (`warranty_certificates`, para foto e código). Sem cache.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/claims?status=Pendente&page=1&pageSize=20" \
    -H "Authorization: Bearer $TOKEN" -H "X-App-Version: 3.2.2"
  ```

### GET /api/claims/unread-count

- **Descrição**: **descontinuado**. Era o contador de reclamações não visualizadas (badge). Mantido para apps antigos e sempre responde `0`, sem consultar a Garantify.
- **Auth**: `requireAuth` + gate de versão.
- **Headers**: `Authorization: Bearer $TOKEN`, `X-App-Version` (**obrigatório**).
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```json
  { "count": 0 }
  ```
- **Erros**:
  - 401.
  - `503 {error, code:"app_version_missing"|"app_version_below_min", min_version}`.
- **Fonte dos dados**: constante (nenhuma consulta).
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/claims/unread-count" \
    -H "Authorization: Bearer $TOKEN" -H "X-App-Version: 3.2.2"
  ```

### GET /api/claims/:id

- **Descrição**: detalhe de uma reclamação de garantia, com fotos, timeline (histórico), estágio do pipeline, prazos e certificado substituto quando a peça foi trocada.
- **Auth**: `requireAuth` + gate de versão Garantify. A ACL exige que `metadata.sorellyRevendedorId` da reclamação seja igual ao id do usuário.
- **Headers**: `Authorization: Bearer $TOKEN`, `X-App-Version` (**obrigatório**).
- **Path params**: `id` (string 1..200): UUID da reclamação.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    id: string; protocolo: string
    certificadoId: string; codigoCertificado: string | null
    consumidorId: string | null; consumidorNome: string | null; consumidorEmail: string | null
    produtoNome: string | null
    produtoCodigo: string | null; produtoImagemUrl: string | null   // snapshot local
    vendedorNome: string | null
    descricao: string
    motivo: string | null
    fotosUrls: string[]; fotosThumbnailKeys: string[]
    status: string                    // canonicalizado ("Finalizada" para terminais)
    statusPipeline: string | null
    visualizada: boolean
    produtoSubstituido: boolean | null
    certificadoSubstitutoId: string | null   // UUID Garantify → usar GET /api/certificates/by-garantify-id/:id
    currentStage: { slug: string; nome: string; cor?: string | null } | null
    pipelineVersion: number | null
    prazoAtualExpiraEm: string | null
    prazoExpirado: boolean
    camposPersonalizados: Record<string, unknown> | null   // repassado da Garantify
    historico: Array<{                // ordenado por data ASC
      data: string; tipo?: string; status: string; statusPipeline?: string | null
      mensagem?: string | null; observacao?: string | null
      stage?: { slug: string; nome: string; cor?: string | null } | null
      detalhes?: unknown              // repassado da Garantify
    }>
    metadata: Record<string, unknown> | null   // inclui sorellyRevendedorId
    criadoEm: string; atualizadoEm: string | null
  }
  ```
- **Erros**:
  - 401.
  - 503 do gate de versão.
  - `400 {error:"ID de reclamação inválido."}`: só espaços.
  - `400 {error:"Operador Garantify não provisionado...", code:"operador_not_provisioned"}`
  - `404 {error:"Reclamação não encontrada.", code:"claim_not_found"}`: Garantify respondeu 404/403, ou a reclamação é de outra revendedora.
  - `400 {error:"Requisição inválida.", code:"invalid_claim_request", upstream_status}`: outro 4xx da Garantify.
  - `502 {error:"Falha ao consultar a reclamação.", code:"garantify_error"}`: 5xx, timeout ou rede.
- **Fonte dos dados**: Garantify (`GET /api/v1/reclamacoes/{id}`) e Postgres (`warranty_certificates`, para foto e código).
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/claims/7d9e0c4b-aaaa-bbbb-cccc-1234567890ab" \
    -H "Authorization: Bearer $TOKEN" -H "X-App-Version: 3.2.2"
  ```

## Clientes (`/api/clients`)

Clientes = consumidoras finais da revendedora (tabela `clients`). O objeto `Client` retornado é a linha inteira da tabela, mais campos calculados:

```ts
type Client = {
  id: number
  userId: number               // revendedora dona
  name: string
  whatsapp: string             // dígitos, normalmente com DDI (ex.: "5541999999999")
  totalSales: string           // numeric, ex.: "1250.00"
  certificateName: string | null  // nome completo usado nos certificados Garantify
  metadata: {                  // jsonb; `garantify.erroUltimaSincronizacao` é REMOVIDO da resposta
    garantify?: { clienteId: string | null; sincronizadoEm: string | null;
                  walletUrl?: string | null; walletGeradoEm?: string | null; [k: string]: unknown }
    [k: string]: unknown
  } | null
  cep: string | null; logradouro: string | null; numero: string | null; complemento: string | null
  bairro: string | null; cidade: string | null; estado: string | null
  createdAt: string            // ISO
  walletUrl: string | null     // carteira Garantify + "?pwd=<dígitos do whatsapp>" (só se já houver em cache)
}
```

### GET /api/clients

- **Descrição**: lista as clientes da revendedora. Com `includePending=true`, inclui o resumo de cobrança das vendas **a prazo** (pendente/atrasado, valor a receber, próximo vencimento) e o total a receber.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params** (extras descartados):
  - `includePending` (`"true"` para ativar; padrão desligado).
  - `busca` (string): ILIKE em `name` ou `whatsapp`. `%` e `_` são removidos do termo.
- **Resposta 200**:
  ```ts
  // includePending ausente/≠"true":
  { clients: Client[] }                         // sem ordenação garantida
  // includePending=true:
  {
    totalToReceive: number                      // soma de pendingAmount de todas as clientes (number, não string)
    clients: Array<Client & {
      paymentStatus: "em_dia" | "pendente" | "atrasado"  // atrasado = alguma parcela a prazo vencida e não paga
      pendingAmount: number                     // valor em aberto (parcelas não pagas; fallback = soma dos itens do pedido)
      nextDueDate: string | null                // próxima parcela não paga (YYYY-MM-DD)
    }>
  }
  ```
  Só pedidos `selectedMethod="aprazo"` e não cancelados entram no cálculo. Pedido `finalizado` só conta se tiver parcela explicitamente `paid:false`.
- **Erros**:
  - 401.
- **Fonte dos dados**: Postgres (`clients`, `order_groups`, `order_payment_proposals`, `order_items`). Sem chamadas externas.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/clients?includePending=true&busca=maria" \
    -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/clients/payments/due-today

- **Descrição**: quantas parcelas **a prazo** vencem **hoje** e o valor total delas. O app usa isso para mostrar uma notificação local ao abrir.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  { count: number;        // nº de parcelas com vencimento hoje (data UTC do servidor) ainda não pagas
    totalAmount: number } // soma, 2 casas (usa parcelas[].amount da proposta ou (total - entrada)/nParcelas)
  ```
  Considera só pedidos `aprazo` com status ≠ `finalizado`/`cancelado`. "Hoje" é `new Date().toISOString().slice(0,10)`, ou seja, em UTC.
- **Erros**:
  - 401.
- **Fonte dos dados**: Postgres (`order_groups`, `clients`, `order_payment_proposals`).
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/clients/payments/due-today" -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/clients/:id

- **Descrição**: detalhe de uma cliente com histórico de vendas (peças) e pedidos com situação de pagamento (parcelas pagas e pendentes, ou confirmação à vista).
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`. `X-App-Version` é opcional, mas influencia **efeitos colaterais**: com versão ≥ `MIN_APP_VERSION`, a rota dispara em background o sync da cliente com a Garantify (se ainda não tiver `clienteId`) e a criação da carteira (se não houver `walletUrl`). A resposta atual não muda.
- **Path params**: `id` (string com inteiro > 0).
- **Query params** (extras descartados):
  - `includeOrders` (string, padrão `"open"`): `"all"` traz **todos** os pedidos da cliente. Qualquer outro valor traz só os pedidos com status `aguardando_pagamento`.
- **Resposta 200**:
  ```ts
  {
    client: Client & {
      sales: Array<{                 // tabela sales, ordenado por createdAt desc
        id: number; userId: number; clientId: number; groupId: number | null
        referenceId: string; size: string | null
        saleAmount: string           // numeric
        createdAt: string
      }>
      orders: Array<                 // ordenado por createdAt desc
        | { // selectedMethod = "aprazo"
            id: number; status: string; createdAt: string
            selectedMethod: "aprazo"; selectedProposalId: number | null
            selectedProposal: Proposal | null   // ver GET /api/products/orders/proposal
            totalValue: number                  // methods.totalValue ou soma dos itens
            installments: {
              paid: Array<{ dueDate: string; paid: true; paidAt: string | null }>
              pending: Array<{ dueDate: string; paid: false; paidAt: null }>
            }
          }
        | { // demais métodos (ou null)
            id: number; status: string; createdAt: string
            selectedMethod: string | null; selectedProposalId: number | null
            selectedProposal: Proposal | null
            totalValue: number                  // methods.totalValue ou 0 (sem fallback por itens)
            confirmation: { confirmed: boolean; confirmedAt: string | null }
          }
      >
    }
  }
  ```
  Pedido `finalizado` sem parcela explicitamente não paga é tratado como quitado.
- **Erros**:
  - 401.
  - `400 {error:"Informe um identificador válido para o cliente."}`
  - `404 {error:"Cliente não encontrado.", code:"client_not_found"}`
- **Fonte dos dados**: Postgres (`clients`, `sales`, `order_groups`, `order_payment_proposals`, `order_items`). Garantify só em background (fire-and-forget).
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/clients/987?includeOrders=all" \
    -H "Authorization: Bearer $TOKEN" -H "X-App-Version: 3.2.2"
  ```

## Vendas (`/api/sales`)

### GET /api/sales

- **Descrição**: dashboard de vendas do **ciclo atual** (condicional/consignado aberto) da revendedora. Traz total vendido, faixa (tier) e comissão, valor de acerto com a Sorelly, peças vendidas, pedidos em aberto, inadimplência, dados de PIX e retirada, condicionais do ERP e a lista de vendas do ciclo.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    summary: {
      totalSales: string            // total vendido no ciclo, "1234.50"
      commission: string            // % de comissão da faixa, ex.: "25.00"
      commissionAmount: string      // R$ da comissão
      settlementValue: string       // acerto = totalSales - commissionAmount (valor a repassar à Sorelly)
      tier: "Bronze"|"Prata"|"Ouro"|"Platina"|"Diamante"|"Diamante Pro"|"Elite"|"Elite Pro"
      nextTier: string | null       // null em "Elite Pro"
      bonusNormal: string; bonusSelect: string   // bônus da faixa
      valueToNextTier: string | null  // quanto falta para a próxima faixa
      valueForNextTier: string | null // limite da próxima faixa (300, 500, 700, 1000, 1600, 2500, 5000, 7000)
      piecesSold: number
      salesCount: number            // = piecesSold
      openOrdersCount: number       // pedidos abertos no ciclo (não finalizado/cancelado/aguardando_pagamento)
      currentCycleStartedAt: string | null
      pixKey: string | null; pixReceiverName: string | null
      pickupCep: string | null; pickupAddress: string | null; pickupAddressNumber: string | null
      pickupAddressComplement: string | null; pickupNeighborhood: string | null
      pickupCity: string | null; pickupState: string | null
      inadimplencia: number | null  // do Devmaster; null se indisponível
      overduePaymentsCount: number  // pedidos a prazo com parcela vencida e não paga
      condicionais: unknown[] | null  // repassado do Devmaster (revendedoras/{id6}); campos vistos:
                                      // codigo, data, data_acerto, data_prev_devolucao, status ("Aberto"/"Fechado"...),
                                      // cod_representante, nome_representante (casing pode variar)
    }
    sales: Array<{                  // vendas do ciclo (vazio no modo snapshot e quando não há ciclo ativo)
      id: number; userId: number; clientId: number; groupId: number | null
      clientName: string | null; referenceId: string; size: string | null
      saleAmount: string; createdAt: string; orderGroupCreatedAt: string | null
    }>
  }
  ```
  Faixas e comissão (`sales.tier.ts`): `<300` Bronze 0%; `<500` Bronze 15%; `<700` Prata 25%; `<1000` Ouro 30%; `<1600` Platina 35%; `<2500` Diamante 40%; `<5000` Diamante Pro 40%; `<7000` Elite 45%; `≥7000` Elite Pro 45%.
  Fonte dos totais:
  - Usuário com a feature de condicionais e com condicionais → soma das peças das condicionais habilitadas.
  - Feature ligada, mas Devmaster sem extras → valores do último snapshot da home (`revendedora_home_snapshots`) ou zero, com `sales: []`.
  - Usuário legado → soma das vendas e pedidos a prazo no ciclo.
  - Feature ligada, com condicionais, mas sem ciclo ativo → tudo zerado e `currentCycleStartedAt: null`.
  Efeitos colaterais (background): atualiza o código da representante e grava o snapshot da home.
- **Erros**:
  - 401.
  - `503 {error:"Não foi possível carregar seus produtos no momento. Tente novamente em instantes.", code:"UPSTREAM_UNAVAILABLE", retryable:true}`: Devmaster (catálogo) indisponível.
- **Fonte dos dados**: Devmaster (catálogo paginado estrito + `revendedoras/{id6}`) e Postgres (`sales`, `clients`, `order_groups`, `order_items`, `order_payment_proposals`, `users`, `revendedora_home_snapshots`). Sem cache.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/sales" -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/sales/product/:productId

- **Descrição**: histórico de vendas de um produto (e de suas variações) da revendedora: total vendido, clientes que compraram e vendas individuais. Por padrão, só o ciclo atual.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: `productId` (string, mín. 1): **prefixo** do SKU. Casa com `sales.referenceId LIKE '<productId>%'`.
- **Query params** (sem schema):
  - `history` (`"1"` ou `"true"`): todos os ciclos. Caso contrário, só vendas a partir do início do ciclo atual (se houver ciclo).
  - `refs` (string, SKUs separados por vírgula): SKUs extras para incluir (match exato). Cada um tem até 50 caracteres, com no máximo 500 SKUs.
- **Resposta 200**:
  ```ts
  {
    productId: string
    totalSold: string                 // soma de saleAmount, "359.70"
    salesCount: number
    clients: Array<{ id: number; name: string | null }>   // clientes distintas
    sales: Array<{
      id: number; userId: number; clientId: number; clientName: string | null
      referenceId: string; size: string | null; saleAmount: string
      createdAt: string; orderGroupCreatedAt: string | null
    }>                                // sem ordenação garantida
    scope: "cycle" | "all"
  }
  ```
- **Erros**:
  - 401.
  - `400 {message:"erro de validacao", issues}`: `productId` vazio.
  - `400 {error:"productId inválido."}`: só espaços.
- **Fonte dos dados**: Postgres (`sales`, `clients`, `order_groups`) e Devmaster `revendedoras/{id6}` (só para o início do ciclo; se falhar, considera todas as vendas).
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/sales/product/CL2623?history=1&refs=CL2623A,CL2623J" \
    -H "Authorization: Bearer $TOKEN"
  ```

## Mercado Pago (`/api/mercadopago`)

Toda a feature depende de `MP_ENABLED='true'` (prod `true`, dev `false`). Desligada, **todas** as rotas deste prefixo (inclusive o callback público) respondem `503 {"error":"Mercado Pago desabilitado","code":"mp_disabled"}` num hook `onRequest`, que roda antes da autenticação. A conexão OAuth fica em `reseller_mp_accounts`, com os tokens cifrados por AES-256-GCM (`MP_TOKEN_ENC_KEY`). As cobranças ficam em `mp_charges`.

### GET /api/mercadopago/oauth/start

- **Descrição**: inicia a conexão da conta Mercado Pago da revendedora (OAuth com PKCE). Devolve a URL de autorização para abrir no navegador.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  { authorizationUrl: string  // {MP_OAUTH_BASE}/authorization?response_type=code&client_id=…&platform_id=mp&redirect_uri=…&state=…&scope=offline_access read write&code_challenge=…&code_challenge_method=S256
    state: string             // anti-CSRF, single-use
    expiresAt: string }       // ISO, agora + 10 min
  ```
- **Erros**:
  - 503 `mp_disabled`.
  - 401.
  - `503 {error:"Mercado Pago não configurado", code:"mp_not_configured"}`: falta `MP_CLIENT_ID` ou `MP_REDIRECT_URI`.
- **Fonte dos dados**: gera o par state + PKCE e grava em `mp_oauth_states` (Postgres). Não chama o MP.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/mercadopago/oauth/start" -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/mercadopago/oauth/callback

- **Descrição**: callback **público** do OAuth, chamado pelo navegador quando o MP redireciona. Valida o `state`, troca o `code` por tokens e redireciona para o app por deep link. Não é para ser chamado por integrações.
- **Auth**: nenhuma (autenticado pelo `state` opaco single-use; o usuário vem da linha de `state`).
- **Headers**: nenhum.
- **Path params**: nenhum.
- **Query params**: `code`, `state` (strings, vindos do MP) e `error` (opcional, quando a autorização é negada).
- **Resposta**: **302** (sem JSON) para:
  - `sorellyapp://mp-connected?status=ok`: sucesso. A conta é gravada como `connected`.
  - `sorellyapp://mp-connected?status=error&reason=denied`: `error` presente ou falta `code`/`state`.
  - `sorellyapp://mp-connected?status=error&reason=invalid_state|expired|replay|exchange_failed`
- **Erros**:
  - 503 `mp_disabled`.
  - `500 {message:"erro interno do servidor"}`: falha inesperada (ex.: banco).
- **Fonte dos dados**: Postgres (`mp_oauth_states`, `reseller_mp_accounts`) e MP (`POST {MP_API_BASE}/oauth/token`).
- **Exemplo**:
  ```bash
  curl -si "$API_URL/api/mercadopago/oauth/callback?code=TG-xxx&state=abc"
  ```

### GET /api/mercadopago/connection

- **Descrição**: status da conexão da conta Mercado Pago da revendedora. Os tokens nunca são devolvidos.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  // não conectada (sem registro, ou status ≠ connected):
  { connected: false; status: "disconnected" | "needs_reconnect" }
  // conectada:
  {
    connected: true
    mpUserId: string        // collector id da conta MP
    scope: string | null    // ex.: "offline_access read write"
    liveMode: boolean       // false = credenciais de teste/sandbox
    status: "connected"
    connectedAt: string | null   // ISO
    expiresAt: string | null     // ISO, expiração do access_token
  }
  ```
- **Erros**:
  - 503 `mp_disabled`.
  - 401.
- **Fonte dos dados**: Postgres (`reseller_mp_accounts`). Não chama o MP.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/mercadopago/connection" -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/mercadopago/orders/:groupId/installment-details

- **Descrição**: simulação das condições de parcelamento no cartão (1x a 12x) e do débito para um link Mercado Pago do pedido. Mostra valor por parcela, juros e o **modo de repasse de taxas** configurado na conta MP: `repassar` (juros para a cliente), `assumir` (sem juros, a revendedora absorve) ou `misto`. É só leitura e não altera nada.
- **Auth**: `requireAuth`. Exige conta MP conectada.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: `groupId` (inteiro): pedido da revendedora.
- **Query params**: `amount` (number > 0, **obrigatório**, mínimo 100): valor à vista do pedido, em R$. O backend não guarda o total do pedido, então é o app que informa.
- **Resposta 200**:
  ```ts
  {
    groupId: number
    amount: number
    payerMode: "repassar" | "assumir" | "misto"
    currency: "BRL"
    creditOptions: Array<{          // ordenado por installments; só nº de parcelas retornados pelo MP, ≤ 12
      installments: number
      mode: "repassar" | "assumir"  // installment_rate > 0 ⇒ repassar
      interestFree: boolean
      exact: number | null          // valor/parcela quando determinístico (sem juros ou bandeiras concordam)
      rangeMin: number | null       // faixa estimada quando o valor varia por bandeira
      rangeMax: number | null
      total: number                 // total pago nessa opção (estimativa máxima se houver juros)
      interestAmount: number        // total - amount (0 se sem juros)
      belowMinimum: boolean         // true ⇒ não ofertar (amount < 100 ou parcela mínima < R$ 50)
    }>
    debit: { available: true; amount: number; processingFeeEstimate: null }
    processingFeeNote: string       // texto fixo pt-BR
    checkoutNote: string            // texto fixo pt-BR
    guidance: string                // texto fixo: como mudar o modo no painel MP
    estimatedAt: string             // ISO
  }
  ```
  Os valores vêm de `payer_costs` do MP, consultados com BINs representativos de Visa (`411111`), Master (`503175`) e Elo (`509091`) e agregados.
- **Erros**:
  - 503 `mp_disabled`.
  - 401.
  - `400 {error:"groupId inválido", code:"invalid_group_id"}`
  - `404 {error:"Pedido não encontrado", code:"order_not_found"}`
  - `400 {error:"Valor do pedido ausente ou inválido", code:"invalid_amount"}`
  - `422 {error:"Valor mínimo para link é R$ 100,00", code:"amount_below_minimum", min:100}`
  - `409 {error:"Reconecte sua conta do Mercado Pago", code:"mp_reconnect_required", reason:"not_connected"|"needs_reconnect"}`: sem conta, conta desconectada ou falha no refresh do token (nesse caso a conta passa a `needs_reconnect`).
  - `502 {error:"Não foi possível carregar as condições de parcelamento", code:"mp_installments_failed"}`: nenhum BIN retornou `payer_costs`.
  - `500`: erro de rede ou timeout no MP (não tratado).
- **Fonte dos dados**: Postgres (`order_groups`, `reseller_mp_accounts`) e MP (`GET {MP_API_BASE}/v1/payment_methods/installments?payment_method_id&bin&amount`, com o access_token da revendedora; refresh do token via `/oauth/token` quando falta < 30 dias). **Cache in-memory** de 5 min por (userId, amount, BIN), só para respostas com sucesso.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/mercadopago/orders/4512/installment-details?amount=350" \
    -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/mercadopago/orders/:groupId/link

- **Descrição**: estado da cobrança ou link Mercado Pago **ativo** de um pedido. O app faz polling disto. O formato espelha o `paymentRequest` do fluxo Sorelly/Kommo.
- **Auth**: `requireAuth`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: `groupId` (inteiro). Não há validação explícita: um valor não numérico tende a gerar `500`.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    paymentRequest: {
      status: "aguardando_pagamento" | "pago" | "cancelado"
      // mapeado de mp_charges.status (paid→pago; cancelled|expired→cancelado; resto→aguardando_pagamento).
      // Hoje só a charge com status 'pending' é buscada, então na prática sempre vem "aguardando_pagamento".
      installments: number      // parcelas escolhidas (padrão 1)
      amount: number
      paymentLink: string | null  // init_point do Checkout Pro (URL para a cliente pagar)
      clientName: null            // sempre null
      requestedAt: string | null  // ISO, criação da cobrança
    } | null                      // null quando não há cobrança pendente (nunca gerada, paga, cancelada ou expirada)
  }
  ```
- **Erros**:
  - 503 `mp_disabled`.
  - 401.
  - `404 {error:"Pedido não encontrado", code:"order_not_found"}`
- **Fonte dos dados**: Postgres (`order_groups`, `mp_charges`). Não chama o MP. Para atualizar o status a partir do MP, existe `POST /api/mercadopago/orders/:groupId/reconcile` (fora deste escopo).
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/mercadopago/orders/4512/link" -H "Authorization: Bearer $TOKEN"
  ```

---

# Parte C — App da representante e revendedoras (admin)

## Representantes (`/api/representantes`)

App da representante (gerente regional que cuida de uma carteira/"rede" de revendedoras). Todas as rotas deste prefixo, inclusive as dos domínios seguintes (movimentos, conferências, kits novos, listagens, pedidos de data), seguem as regras comuns abaixo.

**Regras comuns do prefixo `/api/representantes`**

- **Kill-switch `REPRESENTANTE_ENABLED`**: se o valor não for exatamente `'true'`, toda rota do prefixo, exceto `GET /status`, responde `503` **antes da autenticação** (hook `onRequest`, então vale até sem token):
  ```json
  { "error": "App da representante desabilitado", "code": "representante_disabled" }
  ```
  Padrão do código: `true` em development e production, `false` em test.
- **Auth dual** (`requireRepresentantesAuth`), sempre por `Authorization: Bearer <token>`:
  1. **Modo admin**: o token é igual a `ADMIN_SECRET`. Nas rotas que resolvem a representante pela query, `representativeCod` passa a ser **obrigatório** (sem ele: `400 { "error": "representativeCod é obrigatório." }`).
  2. **Modo sessão**: qualquer outro token é validado como sessão de usuário (`requireAuth`). Depois o backend lê o vínculo `users.metadata.representanteCod` e confere na tabela `representantes`, que precisa ter `ativo = true`. Nesse modo, `representativeCod` é opcional e, quando vem diferente do da sessão, a resposta é `403 { "error": "representativeCod não corresponde ao representante logado." }`.
- **Erros de auth**:
  - `401 { "error": "Sessão inválida. Informe o token no header Authorization." }`: sem header `Bearer`.
  - `401 { "error": "Sessão inválida. Token ausente no header Authorization." }`
  - `401 { "error": "Sessão inválida ou inexistente." }`
  - `401 { "error": "Sessão expirada. Faça login novamente." }`
  - `500 { "error": "Usuário vinculado à sessão não foi encontrado. Solicite uma nova sessão." }`
  - `403 { "error": "Acesso restrito a representantes." }`: sessão válida, mas o usuário não está vinculado a uma representante ativa.
- **Formato dos erros**: as rotas daqui respondem quase sempre `{ "error": string }`. Quando a validação de schema (Ajv) falha, a resposta é `400 { "message": "erro de validacao", "issues": [...] }`. Exceção não tratada vira `500 { "message": "erro interno do servidor" }`.
- **Query string**: o Fastify converte os tipos sozinho (`"true"` → boolean, `"2"` → integer) e aplica os `default` do schema.
- **Valores monetários** saem como **string decimal com 2 casas** (ex.: `"1234.50"`), salvo quando o campo diz o contrário.
- **"Rede" da representante**: são as revendedoras cujo `users.representative_cod` é igual ao cod dela. Na ficha e nas checagens de posse, se esse campo for nulo, vale o `representativeCod` do snapshot da home.
- **Mês civil**: `year`/`month` são o mês civil no fuso `America/Sao_Paulo`, convertido para o intervalo UTC `[início do mês, início do mês seguinte)`. Sem `year`/`month`, vale o mês atual em BRT.

### GET /api/representantes/status

- **Descrição**: diz se o app da representante está ligado. O app consulta antes de tudo para decidir se mostra a área da representante.
- **Auth**: nenhuma. A rota fica fora do kill-switch e do guard.
- **Headers**: nenhum.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  { enabled: boolean } // REPRESENTANTE_ENABLED === 'true'
  ```
- **Erros**: nenhum específico.
- **Fonte dos dados**: config do servidor (`REPRESENTANTE_ENABLED`).
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/representantes/status"
  ```

### GET /api/representantes/formas-pagamento

- **Descrição**: formas de pagamento e contas de destino da "Calculadora de Acerto", cadastradas no painel Gestão de Consignado (admin). Quando o admin falha, o app usa a lista local dele.
- **Auth**: dual (sessão de representante ou `ADMIN_SECRET`). Não usa `representativeCod`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    formas: Array<{
      valor: string        // identificador da forma (vem do admin)
      rotulo: string       // texto exibido
      temParcelas: boolean // true só se o admin mandar exatamente true
      contas: string[]     // contas de destino (strings não vazias)
    }>
  }
  ```
  Itens do admin sem `valor` ou `rotulo` do tipo string são descartados.
- **Erros**:
  - `502 { "error": "Formas de pagamento indisponíveis." }`: falta `CONSIGNADO_INGEST_KEY` ou `API_ADMIN_URL`, houve erro de rede ou timeout, o admin respondeu não-2xx, ou a resposta não trouxe `formas` como array.
  - Erros comuns do prefixo (401/403/503).
- **Fonte dos dados**: chamada ao admin `GET {API_ADMIN_URL}/consignado/ingest/formas-pagamento` com o header `x-ingest-key: CONSIGNADO_INGEST_KEY`. Timeout de `EXTERNAL_API_TIMEOUT_MS`, sem retry e sem cache.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/representantes/formas-pagamento" -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/representantes/home-summary

- **Descrição**: totais da tela inicial da representante. Soma os snapshots da home de cada revendedora da rede (vendido, comissão, valor de acerto, peças e condicionais ativas no ciclo atual de cada uma).
- **Auth**: dual. Em modo admin, `representativeCod` é obrigatório.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**:
  - `representativeCod` (string, 1–50): opcional em sessão, obrigatório em modo admin.
  - `incluirInativas` (boolean, padrão `false`): **só tem efeito em modo admin**; em sessão é ignorado. Com `true`, entram também as revendedoras que não estão confirmadas como ativas no ERP.
- **Resposta 200**:
  ```ts
  {
    representativeCod: string
    revendedorasCount: number         // quantidade de snapshots somados
    totalSales: string                // soma do vendido (snapshot)
    commissionAmount: string          // soma da comissão das REVENDEDORAS (faixa/tier de cada uma)
    settlementValue: string           // soma do valor de acerto
    piecesSold: number
    enabledCondicionaisCount: number  // soma das condicionais ativas
    earliestSettlementDate: string | null // ISO; menor settlementDate bruto dos snapshots (sem aplicar pedido de nova data aprovado)
  }
  ```
- **Erros**: `400` (falta `representativeCod` em modo admin), `403` (cod divergente da sessão), `400` de validação, e os erros comuns do prefixo.
- **Fonte dos dados**: Postgres. A tabela `revendedora_home_snapshots` é cruzada com `users` e filtrada por `revendedora_home_snapshots.representative_cod = cod`. Por padrão só entra quem tem `users.devmaster_active = true` (confirmada ativa pela reconciliação diária com o Devmaster); `null` e `false` ficam de fora. Os snapshots são gravados quando a revendedora sincroniza a home (`/api/sales`) e atualizados uma vez por dia por job. Não há cache.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/representantes/home-summary" -H "Authorization: Bearer $TOKEN"
  # modo admin
  curl -s "$API_URL/api/representantes/home-summary?representativeCod=NA&incluirInativas=true" -H "Authorization: Bearer $ADMIN_SECRET"
  ```

### GET /api/representantes/monthly-summary

- **Descrição**: resumo de vendas da rede num mês civil, com o acerto previsto e a comissão prevista da representante (o percentual dela incide sobre o acerto, não sobre o vendido).
- **Auth**: dual. Em modo admin, `representativeCod` é obrigatório.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**:
  - `representativeCod` (string, 1–50): regra do prefixo.
  - `year` (integer, 2000–2100, padrão: ano atual em BRT).
  - `month` (integer, 1–12, padrão: mês atual em BRT).
- **Resposta 200**:
  ```ts
  {
    year: number
    month: number
    totalSales: string       // soma de sales.sale_amount da rede no mês
    settlementValue: string  // Σ por revendedora de (vendido_no_mês − comissão da faixa sobre esse total)
    commissionAmount: string // settlementValue × commissionPct / 100
    commissionPct: number    // % da representante (tabela representantes; padrão 7)
    piecesSold: number       // quantidade de linhas em `sales` (1 venda = 1 peça)
    revendedorasCount: number // revendedoras com ≥1 venda no mês
  }
  ```
  Faixas da revendedora usadas no acerto, pelo total vendido no mês: <300 → 0%; <500 → 15% (Bronze); <700 → 25% (Prata); <1000 → 30% (Ouro); <1600 → 35% (Platina); <2500 → 40% (Diamante); <5000 → 40% (Diamante Pro); <7000 → 45% (Elite); ≥7000 → 45% (Elite Pro).
- **Erros**: `400` (validação ou `representativeCod` ausente em modo admin), `403` (cod divergente) e os erros comuns.
- **Fonte dos dados**: Postgres. A tabela `sales` (vendas registradas pelas revendedoras no app) é cruzada com `users`, filtrando `users.representative_cod = cod` e `sales.created_at` dentro do mês. **Não** filtra por `devmaster_active`. `commissionPct` vem da tabela `representantes`. Não há cache.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/representantes/monthly-summary?year=2026&month=10" -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/representantes/desempenho/ranking

- **Descrição**: ranking das revendedoras da rede por valor vendido, no mês, no histórico inteiro ou entre as "em alta". Tem filtros por faixa de valor e por situação.
- **Auth**: dual. Em modo admin, `representativeCod` é obrigatório.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**:
  - `representativeCod` (string, 1–50): regra do prefixo.
  - `period` (`month` | `all` | `rising`, padrão `month`):
    - `month`: vendas do mês `year`/`month`.
    - `all`: todo o histórico.
    - `rising`: só quem vendeu no mês e cresceu em relação ao mês anterior (`variacaoPct > 0`), ordenado pela maior variação.
  - `year` (integer 2000–2100) e `month` (integer 1–12): mês de referência (padrão: mês atual BRT). O "mês anterior" sai daqui.
  - `minVendido` / `maxVendido` (number ≥ 0): limites inclusivos sobre `totalVendido` do período.
  - `situacao` (`todas` | `com_vendas` | `sem_vendas`, padrão `todas`).
  - `page` (integer ≥ 1, padrão 1).
  - `pageSize` (integer 1–200, padrão 100).
- **Resposta 200**:
  ```ts
  {
    period: 'month' | 'all' | 'rising'
    year: number
    month: number
    total: number    // total de linhas DEPOIS dos filtros
    page: number
    pageSize: number
    data: Array<{
      posicao: number            // posição no ranking JÁ filtrado (1-based, contínua entre páginas)
      userId: number
      name: string
      phone: string | null
      avatarUrl: string | null
      totalVendido: string       // vendido no período ("all" = histórico inteiro)
      pecas: number              // vendas (linhas de `sales`) no período
      totalClientes: number      // clientes cadastrados pela revendedora (tabela clients)
      vendidoMesAnterior: string // vendido no mês anterior a year/month (com period=all também usa o mês anterior a year/month)
      variacaoPct: number | null // (atual − anterior)/anterior × 100, 1 casa; anterior 0 e atual > 0 → 100; ambos 0 → null
      pctDaLider: number | null  // totalVendido / totalVendido do 1º colocado × 100 (1 casa); null se o líder tem 0
      lastSaleAt: string | null  // ISO da última venda (em qualquer período)
    }>
  }
  ```
  Entram todas as revendedoras da rede, inclusive quem tem venda 0 no período. Ordenação: `totalVendido` decrescente e depois nome (pt-BR). No `rising`, ordena por `variacaoPct` decrescente e desempata por `totalVendido`.
- **Erros**: `400 { "error": "period inválido." }`, `400 { "error": "situacao inválida." }`, `400` de validação, `400` ou `403` da regra de `representativeCod`, e os erros comuns.
- **Fonte dos dados**: Postgres, com SQL agregando `users` (por `representative_cod`), `sales` e `clients`. Ordenação, filtros e paginação são feitos em memória. Não há cache.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/representantes/desempenho/ranking?period=month&year=2026&month=10&situacao=com_vendas&page=1&pageSize=50" \
    -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/representantes/desempenho/rede-resumo

- **Descrição**: totais da rede no período, usados como contexto da tela de ranking.
- **Auth**: dual. Em modo admin, `representativeCod` é obrigatório.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**:
  - `representativeCod` (string, 1–50): regra do prefixo.
  - `period` (`month` | `all` | `rising`, padrão `month`). `rising` dá o mesmo resultado que `month` (totais do mês selecionado). `all` soma o histórico inteiro.
  - `year` (integer 2000–2100) e `month` (integer 1–12): padrão é o mês atual BRT.
- **Resposta 200**:
  ```ts
  {
    period: 'month' | 'all' | 'rising'
    year: number
    month: number
    totalVendido: string
    pecas: number
    revendedorasComVenda: number  // revendedoras com venda > 0 no período
    revendedorasNaRede: number    // count de users com representative_cod = cod
    mediaPorRevendedora: string   // totalVendido / revendedorasComVenda (divisor mínimo 1)
  }
  ```
- **Erros**: `400 { "error": "period inválido." }`, `400` de validação, regra de `representativeCod` (400/403) e os erros comuns.
- **Fonte dos dados**: Postgres (`sales` cruzada com `users`; `users` para a contagem da rede). Não há cache.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/representantes/desempenho/rede-resumo?period=all" -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/representantes/desempenho/analise-geral

- **Descrição**: análise da carteira num mês. Traz os KPIs do mês comparados ao mês anterior, a cobertura (quantas da rede venderam), a série mensal de até 12 meses e destaques: revendedoras que pararam de vender, maiores altas e quedas e concentração nas 3 maiores.
- **Auth**: dual. Em modo admin, `representativeCod` é obrigatório.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: `representativeCod` (string, 1–50), `year` (integer 2000–2100) e `month` (integer 1–12). Padrão: mês atual BRT.
- **Resposta 200**:
  ```ts
  {
    mesAtual: {
      year: number; month: number
      totalVendido: string
      pecas: number
      ticketMedio: string            // totalVendido / pecas (0 se não houver peças)
      revendedorasComVenda: number
      revendedorasNaRede: number
      mediaPorRevendedora: string    // totalVendido / revendedorasComVenda (divisor mínimo 1)
    }
    mesAnterior: {
      year: number; month: number
      totalVendido: string
      pecas: number
      revendedorasComVenda: number
    }
    variacaoPct: number | null       // mesma regra do ranking
    coberturaPct: number             // revendedorasComVenda / revendedorasNaRede × 100 (1 casa); 0 se a rede está vazia
    serieMensal: Array<{
      mes: string                    // "YYYY-MM"
      label: string                  // "Out/26"
      totalVendido: string
      pecas: number
      revendedorasComVenda: number
    }>                               // ordem crescente, até 12 meses terminando em year/month; meses iniciais zerados são cortados (o último fica sempre)
    destaques: {
      paradas: number                // venderam no mês anterior e não venderam no mês
      paradasAmostra: Array<{ userId: number; name: string }>          // até 3
      topAltas: Array<{ userId: number; name: string; variacaoPct: number | null }>  // até 3, variação > 0
      topQuedas: Array<{ userId: number; name: string; variacaoPct: number | null }> // até 3, variação < 0
      concentracaoTop3Pct: number | null // % do vendido do mês nas 3 maiores; null se não houve venda
    }
  }
  ```
  Os destaques saem do ranking do mês limitado às **200 primeiras** revendedoras (o `pageSize` 500 pedido internamente é cortado para 200).
- **Erros**: `400` de validação, regra de `representativeCod` (400/403) e os erros comuns.
- **Fonte dos dados**: Postgres (`sales`, `users`, `clients`). A série mensal agrupa por mês em `America/Sao_Paulo`, buscando os últimos 24 meses com venda. Não há cache.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/representantes/desempenho/analise-geral?year=2026&month=10" -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/representantes/home-snapshots

- **Descrição**: lista paginada das revendedoras da rede, cada uma com o snapshot da home (vendido, comissão, acerto, data do próximo acerto, condicionais ativas), contato, endereço de retirada e a comissão prevista da representante sobre ela. É a lista principal da carteira.
- **Auth**: dual. Em modo admin, `representativeCod` é obrigatório.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**:
  - `representativeCod` (string, 1–50): regra do prefixo.
  - `page` (integer ≥ 1, padrão 1).
  - `pageSize` (integer 1–200, padrão 50).
  - `incluirInativas` (boolean, padrão `false`): só tem efeito em modo admin (diagnóstico).
- **Resposta 200**:
  ```ts
  {
    data: Array<{
      userId: number
      name: string
      phone: string | null
      avatarUrl: string | null          // foto (CDN, 256px)
      lastSaleAt: string | null         // ISO da última venda (tabela sales)
      representativeCod: string | null
      representativeName: string | null
      enabledCondicionais: string[]     // códigos das condicionais ativas
      enabledCondicionaisCount: number
      totalSales: string                // vendido no ciclo (snapshot)
      commissionAmount: string          // comissão da REVENDEDORA (snapshot)
      settlementValue: string           // valor do acerto (snapshot)
      settlementDate: string | null     // ISO; data efetiva do acerto: a do Devmaster ou, se houver, a de pedido de nova data aprovado (vale enquanto o Devmaster ainda mostrar a data antiga do pedido)
      settlementOverdue: boolean        // settlementDate < hoje (dia civil BR)
      piecesSold: number
      updatedAt: string                 // ISO, última atualização do snapshot
      cadastroAtivo: boolean | null     // users.devmaster_active (true = confirmada ativa no ERP; false = saiu da base; null = nunca verificada)
      cadastroVerificadoEm: string | null
      endereco: string | null           // "Rua X, 77, ap 3 - Batel, Curitiba - PR"; null se não houver nada
      representanteCommissionAmount: string // settlementValue × commissionPct da representante / 100
    }>
    total: number
    page: number
    pageSize: number
  }
  ```
  Ordem: `settlementDate` (bruto do snapshot) crescente, com nulos no fim; desempate por `updatedAt` decrescente.
- **Erros**: `400` de validação, regra de `representativeCod` (400/403) e os erros comuns.
- **Fonte dos dados**: Postgres (`revendedora_home_snapshots` cruzada com `users`, subquery em `sales`, tabela `pedidos_data_acerto` para pedidos aprovados e `representantes` para o %). Mesmo filtro de `devmaster_active = true` do `home-summary`. Não há cache.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/representantes/home-snapshots?page=1&pageSize=50" -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/representantes/revendedoras/:id

- **Descrição**: ficha completa de uma revendedora da rede: perfil, região, situação do cadastro no ERP, faixa (tier), snapshot da home, atividade no app e preferências do kit.
- **Auth**: dual. Em sessão, a revendedora precisa ser da rede da representante logada (senão 404). Em modo admin não há restrição de rede e `representativeCod` não é usado.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: `id` (integer): `users.id` da revendedora.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    id: number
    name: string
    email: string
    phone: string | null
    avatarUrl: string | null
    createdAt: string                       // ISO
    representativeCod: string | null        // users.representative_cod ?? snapshot.representativeCod
    representativeName: string | null
    commissionPct: number                   // % da REPRESENTANTE (padrão 7)
    commissionAmount: string                // snapshot.settlementValue × commissionPct / 100 (comissão prevista da representante)
    regiao: { cidade: string | null; estado: string | null } // pickup_city / pickup_state
    cadastro: { ativo: boolean | null; verificadoEm: string | null }
    tier: {                                 // calculado sobre snapshot.totalSales
      tier: string                          // 'Bronze' | 'Prata' | 'Ouro' | 'Platina' | 'Diamante' | 'Diamante Pro' | 'Elite' | 'Elite Pro'
      commission: number                    // % da revendedora
      nextTier: string | null
      valueToNextTier: number | null
      valueForNextTier: number | null
      bonusNormal: number
      bonusSelect: number
    }
    snapshot: null | {
      enabledCondicionais: string[]
      enabledCondicionaisCount: number
      totalSales: string
      commissionAmount: string              // comissão da revendedora
      settlementValue: string
      settlementDate: string | null         // ISO, data efetiva (com pedido aprovado aplicado)
      settlementOverdue: boolean
      piecesSold: number
      updatedAt: string
    }
    activity: {
      lastSaleAt: string | null
      lastActivityAt: string | null         // maior valor entre users.last_seen_at e a última sessão criada
      clientsCount: number
    }
    kitPreferences: {
      temPreferencias: boolean
      displayName: string | null
      observations: string | null
      answers: Record<string, unknown>      // respostas do formulário de kit, filtradas pelos blocos ativos na config do admin
      categoriasRespondidas: number
      resumoGeral: Array<{ ouro: number; prata: number }> // [] ou 1 item com % ouro/prata arredondado à dezena
      atualizadoEm: string | null
    }
  }
  ```
- **Erros**: `404 { "error": "Revendedora não encontrada." }` quando o id não existe ou, em sessão, está fora da rede. Também `400` de validação (id não inteiro) e os erros comuns.
- **Fonte dos dados**: Postgres (`users`, `revendedora_home_snapshots`, `sales`, `sessions`, `clients`, `kit_preferences`, `pedidos_data_acerto`, `representantes`) e a config do kit no admin (`GET {API_ADMIN_URL}/kit/preferences`, cache em memória de 60 s; se falhar, usa o último cache ou devolve as respostas sem filtro).
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/representantes/revendedoras/1234" -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/representantes/revendedoras/:id/desempenho

- **Descrição**: análise de vendas de uma revendedora: KPIs do mês de referência contra o mês anterior, total histórico, série mensal, posição no ranking da rede e média da rede.
- **Auth**: dual. Em sessão, a revendedora precisa ser da rede (senão 404). Em modo admin não há restrição.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: `id` (integer).
- **Query params**: `year` (integer 2000–2100) e `month` (integer 1–12). Padrão: mês atual BRT.
- **Resposta 200**:
  ```ts
  {
    userId: number
    name: string
    phone: string | null
    posicaoMes: number | null    // posição no ranking 'month' da rede no mês de referência (null fora das 200 primeiras ou sem rede)
    posicaoGeral: number | null  // posição no ranking 'all' (histórico)
    mesAtual: { year: number; month: number; totalVendido: string; pecas: number; ticketMedio: string }
    mesAnterior: { year: number; month: number; totalVendido: string; pecas: number }
    variacaoPct: number | null
    geral: { totalVendido: string; pecas: number; ticketMedio: string } // histórico inteiro
    totalClientes: number
    lastSaleAt: string | null
    diasSemVenda: number | null  // dias inteiros desde a última venda
    mediaRedeMes: string         // vendido da rede no mês / revendedoras com venda no mês
    serieMensal: Array<{ mes: string; label: string; totalVendido: string; pecas: number }> // até 12 meses COM venda, em ordem crescente
  }
  ```
- **Erros**: `404 { "error": "Revendedora não encontrada." }`, `400` de validação e os erros comuns.
- **Fonte dos dados**: Postgres (`sales`, `clients`, `users`). Não há cache.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/representantes/revendedoras/1234/desempenho?year=2026&month=9" -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/representantes/revendedoras/:id/condicionais

- **Descrição**: lista **ao vivo** as condicionais (kits consignados) da revendedora, direto do Devmaster (ERP), com o status de cada uma (fechada, atrasada, no prazo, sem prazo) e a indicação de quais estão desativadas no app. A representante usa esta tela para decidir o que desativar.
- **Auth**: dual. Em sessão, a revendedora precisa ser da rede (senão 404).
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: `id` (integer). É enviado ao Devmaster com zeros à esquerda até 6 dígitos (ex.: `1234` → `001234`).
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    condicionais: Array<{
      codigo: string
      status: 'fechada' | 'atrasada' | 'no_prazo' | 'sem_prazo'
        // fechada: status "fechado" no Devmaster
        // no_prazo: tem data_acerto, ou data_prev_devolucao >= hoje (BR)
        // atrasada: data_prev_devolucao < hoje (BR)
        // sem_prazo: expositor (data de devolução fora da faixa, ex.: ano 3000) ou sem data válida
      dataAbertura: string | null       // campo `data` cru do Devmaster (string BR, ex. "dd/mm/aaaa")
      dataPrevDevolucao: string | null  // `data_prev_devolucao` cru
      dataAcerto: string | null         // `data_acerto` cru
      disabled: boolean                 // está em users.disabled_condicionais (desativada pela revendedora ou pela representante)
      qtdItens: number | null           // `qtd_itens`
      valorMercadoria: number | null    // `valor_mercadoria` (preço de etiqueta, 2 casas)
      qtdRetornado: number | null       // `qtd_retornado` (só depois do acerto lançado no ERP)
      qtdVendido: number | null         // `qtd_vendido`
    }>
  }
  ```
  Registros sem `codigo` e códigos repetidos são descartados. Se o Devmaster falhar, demorar além do timeout ou faltar `DEVMASTER_API_KEY`, a rota **não dá erro**: responde `200 { "condicionais": [] }`.
- **Erros**: `404 { "error": "Revendedora não encontrada." }`, `400` de validação e os erros comuns.
- **Fonte dos dados**: Devmaster `GET {DEVMASTER_API_URL}/appsorelly/revendedoras/{id com 6 dígitos}` com os headers `Token: DEVMASTER_API_KEY` e `Versao: V2`. Usa o campo `condicionais` do 1º elemento do array retornado. Timeout `EXTERNAL_API_TIMEOUT_MS`, `EXTERNAL_API_RETRIES` retentativas (com fallback de https). O flag `disabled` vem de `users.disabled_condicionais` (Postgres). Não há cache.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/representantes/revendedoras/1234/condicionais" -H "Authorization: Bearer $TOKEN"
  ```

## Movimentos de consignado (`/api/representantes`)

Histórico do que a representante registrou pelo app para uma revendedora: acertos (fechamento de condicional pela Calculadora de Acerto), entregas de kit e reposições. Cada registro é guardado localmente e repassado ao painel Gestão de Consignado do admin. Vale tudo da seção "Regras comuns" do prefixo. Além disso, **as duas rotas exigem modo sessão**: com `ADMIN_SECRET` a resposta é 403.

### GET /api/representantes/movimentos

- **Descrição**: histórico (até 30 registros, do mais recente ao mais antigo) de acertos, entregas de kit e reposições registrados pelo app para uma revendedora da rede.
- **Auth**: **somente sessão de representante**. Com `ADMIN_SECRET`: `403 { "error": "Listar movimentos exige sessão de representante." }`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: `revendedoraId` (integer > 0, **obrigatório**).
- **Resposta 200**:
  ```ts
  {
    items: Array<{
      id: number
      createdAt: string                 // ISO
      data: string | null               // `data` informada pelo app no envio
      hora: string | null               // "HH:MM", hora do servidor no envio
      kind: 'acerto' | 'movimento'
      tipo: 'acerto' | 'entrega_kit' | 'reposicao'
      titulo: string                    // "Acerto" | "Entrega de kit" | "Reposição"
      subtitulo: string | null          // ex.: "3 peças vendidas", "Kit novo · Com expositor", ou obs truncada (60)
      status: 'enviado' | 'pendente' | 'erro' | 'cancelado'
        // enviado: o admin aceitou; pendente: aguardando repescagem; erro: o admin rejeitou (não reenvia); cancelado: a representante cancelou
      valores: null | {                 // só em kind = 'acerto'
        vendas: number                  // payload.vB ?? payload.vL ?? 0
        totalAPagar: number             // payload.totalAPagar ?? payload.vAcerto ?? 0
        pago: number                    // payload.totPago
        falta: number                   // max(0, payload.falta)
      }
      temAssinatura: boolean            // payload.assinaturaImagem preenchido
      cancelamento: { motivo: string; em: string } | null // só com status 'cancelado'
    }>
  }
  ```
  Lista todos os registros da revendedora (filtra só por `revendedoraId`, não por quem registrou).
- **Erros**:
  - `400 { "error": "revendedoraId inválido." }`, ou `400` de validação quando falta `revendedoraId`.
  - `403`: modo admin.
  - `404 { "error": "Revendedora não encontrada na rede do representante." }`
  - `500 { "error": "Falha ao carregar o histórico." }`
  - Erros comuns do prefixo.
- **Fonte dos dados**: Postgres, tabela `consignado_acertos_pendentes`. A posse é checada pela ficha da revendedora (a mesma de `GET /revendedoras/:id`, o que também consulta a config do kit no admin). Não há cache.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/representantes/movimentos?revendedoraId=1234" -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/representantes/movimentos/:id

- **Descrição**: detalhe de um registro do histórico com o pacote completo enviado ao admin, inclusive a imagem da assinatura.
- **Auth**: **somente sessão**. Com `ADMIN_SECRET`: `403 { "error": "Ver o registro exige sessão de representante." }`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: `id` (integer ≥ 1): id do registro.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    item: {
      // ...todos os campos do item de GET /movimentos, mais:
      payload: Record<string, unknown> // pacote enviado ao admin, sem a chave interna `_cancelamento`
      podeCancelar: boolean            // status !== 'cancelado'
    }
  }
  ```
  `payload` repassa o que o app enviou, mais `id` (UUID de origem), `hora`, `revendedora` (nome) e `rep` (nome da representante).
  - **Acerto**: campos aceitos no POST `/acertos`: `data`, `condsV`, `totC`, `pecasVendidas`, `retornaEmpresa`, `vB`, `vL`, `taxaB`, `taxaF`, `descPts`, `comissao`, `vAcerto`, `totPago`, `falta`, `excedido`, `briFator`, `bN`, `bB`, `excTotal`, `formas`, `rems`, `acordo`, `obs`, `recebidoDiretoComb`. Campos extras que o app mandar também ficam (ex.: `assinaturaImagem`, `totalAPagar`).
  - **Movimento**: `data`, `tipoMovimento` (`entrega_kit` | `reposicao`), `kitTipo` (`novo` | `retornando` | `so_expositor` | null), `comExpositor`, `condicionais`, `assinaturaLembrete`, `especial`, `comissaoRepos`, `confirmacaoRevendedora`, `obs`.
- **Erros**:
  - `404 { "error": "Registro não encontrado." }`: o registro não existe, é de outra representante, ou a revendedora saiu da rede.
  - `400` de validação.
  - `403`: modo admin.
  - `500 { "error": "Falha ao carregar o registro." }`
  - Erros comuns.
- **Fonte dos dados**: Postgres (`consignado_acertos_pendentes`), com checagem de posse pela ficha da revendedora. Não há cache.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/representantes/movimentos/987" -H "Authorization: Bearer $TOKEN"
  ```

## Conferências de peças (`/api/representantes`)

Conferência das peças que a revendedora devolve ou mostra: a representante lê as etiquetas com a câmera do app, e cada conferência guarda os itens com código, categoria e valor. Vale tudo da seção "Regras comuns" do prefixo. A leitura aceita `ADMIN_SECRET` (com `representativeCod`).

### GET /api/representantes/conferencias

- **Descrição**: histórico paginado de conferências da representante, da mais recente à mais antiga, com filtro opcional por revendedora.
- **Auth**: dual. Em modo admin, `representativeCod` é obrigatório.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**:
  - `representativeCod` (string): regra do prefixo.
  - `revendedoraId` (integer > 0, opcional).
  - `page` (integer ≥ 1, padrão 1; valor inválido vira 1).
  - `pageSize` (integer, padrão 20, máximo 50; valor inválido vira 20).
- **Resposta 200**:
  ```ts
  {
    items: Array<{
      id: number
      revendedora: { id: number; nome: string }
      status: string                    // valor gravado; padrão 'finalizada'
      tipo: 'simples' | 'devolucao'
      condicionais: string[]            // códigos de condicional vinculados
      acertoEm: string | null           // ISO; quando o acerto foi marcado como feito
      totalPecas: number
      totalValorCentavos: number        // inteiro, em centavos
      categorias: number                // número de categorias distintas nos itens
      observacao: string | null
      iniciadaEm: string                // ISO
      finalizadaEm: string              // ISO
    }>
    page: number
    pageSize: number
    hasMore: boolean                    // há próxima página
  }
  ```
- **Erros**:
  - `400 { "error": "revendedoraId inválido." }`
  - `400 { "error": "representativeCod é obrigatório." }` (modo admin)
  - `403` (cod divergente da sessão)
  - `500 { "error": "Falha ao carregar as conferências." }`
  - Erros comuns.
- **Fonte dos dados**: Postgres (`conferencias_pecas` cruzada com `users` para o nome, com subquery de categorias em `conferencias_pecas_itens`), filtrando por `representative_cod`. Não há cache.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/representantes/conferencias?page=1&pageSize=20&revendedoraId=1234" -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/representantes/conferencias/:id

- **Descrição**: detalhe de uma conferência com todos os itens lidos.
- **Auth**: dual. Em modo admin, `representativeCod` é obrigatório. A conferência precisa ser da representante resolvida.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: `id` (integer > 0).
- **Query params**: `representativeCod` (string): regra do prefixo.
- **Resposta 200**:
  ```ts
  {
    // ...todos os campos do item de GET /conferencias, mais:
    itens: Array<{
      codigo: string          // código da etiqueta, em maiúsculas (ex.: "SP0735")
      prefixo: string         // prefixo de categoria (ex.: "SP")
      categoria: string       // nome da categoria (ex.: "Sorelly Premium"; "Outros" se o prefixo não estiver cadastrado)
      valorCentavos: number   // valor unitário, em centavos
      quantidade: number
      valorOrigem: 'codigo' | 'ocr' | 'manual' // como o valor foi obtido
    }>                        // ordem: categoria, depois código
  }
  ```
- **Erros**:
  - `400 { "error": "id inválido." }`
  - `404 { "error": "Conferência não encontrada." }`: não existe ou é de outra representante.
  - `500 { "error": "Falha ao carregar a conferência." }`
  - Regra de `representativeCod` (400/403) e erros comuns.
- **Fonte dos dados**: Postgres (`conferencias_pecas`, `conferencias_pecas_itens`, `users`). Não há cache.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/representantes/conferencias/55" -H "Authorization: Bearer $TOKEN"
  ```

## Kits novos (`/api/representantes`)

Kits para revendedoras novas (candidatas), enviados pelo admin quando o pedido chega em "Solicitado". A representante agenda a entrega ou recusa pelo app. Vale tudo da seção "Regras comuns" do prefixo.

### GET /api/representantes/kits-novos

- **Descrição**: kits novos em aberto da representante (`aguardando` resposta ou já `agendado`), do mais recente ao mais antigo.
- **Auth**: dual. Em modo admin, `representativeCod` é obrigatório.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: `representativeCod` (string): regra do prefixo.
- **Resposta 200**:
  ```ts
  {
    data: Array<{
      id: string                         // externalId (id do kit no admin)
      nome: string                       // nome da futura revendedora
      bairro: string | null
      cidade: string
      tipoKit: string
      valor: number                      // valor do kit (number, 2 casas)
      telefone: string | null
      profissao: string | null
      enderecoResidencial: string | null
      enderecoTrabalho: string | null
      disponibilidade: string | null
      contatos: Array<{ nome: string; telefone: string; relacao: string }> // até 10
      status: 'aguardando' | 'agendado'  // na lista só vêm esses dois
      agendamento: { data: string /* "YYYY-MM-DD" */; periodo: 'manha' | 'tarde' | 'noite' } | null
      recebidoEm: string                 // ISO, quando o admin enviou ou reenviou
    }>
  }
  ```
- **Erros**: `500 { "error": "Falha ao carregar os kits novos." }`, regra de `representativeCod` (400/403) e erros comuns.
- **Fonte dos dados**: Postgres, tabela `kits_novos_representante` (preenchida pelo admin via `PUT /api/admin/kits-novos/:externalId`), filtrando `representante_cod = cod` e `status IN ('aguardando','agendado')`. Ordem `recebido_em DESC`, depois `external_id`. Não há cache.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/representantes/kits-novos" -H "Authorization: Bearer $TOKEN"
  ```

## Listagens (`/api/representantes`)

Listagens de montagem: a representante agenda dia e horário e inclui revendedoras cujos kits (acerto + kit, reposição, condicional) devem ser montados pela empresa. **Este backend não guarda listagens.** Ele valida a sessão e repassa ao admin (`sorelly-admin`), que é a fonte da verdade. Vale tudo da seção "Regras comuns" do prefixo.

### GET /api/representantes/listagens

- **Descrição**: listagens da representante (abertas e concluídas recentes), com os kits de cada uma e uma eventual retirada pendente.
- **Auth**: **somente sessão de representante**. Com `ADMIN_SECRET`: `403 { "error": "Listagens exigem sessão de representante." }`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum. O cod vem da sessão e é enviado ao admin como `rep`.
- **Resposta 200**: **repasse sem alteração** do corpo do admin. Pelo schema Zod do admin (`ListagensAppRespostaSchema`):
  ```ts
  {
    listagens: Array<{
      id: string
      data: string            // dia da listagem (ISO "AAAA-MM-DD")
      horario: string         // "HH:MM"
      destino: string
      viagem: boolean
      fechada: boolean
      concluidaEm: string | null
      codigoRetirada: string
      kits: Array<{
        id: string
        revendedoraId: number | null
        nome: string
        bairro: string | null
        tipoKit: string        // ex.: acerto_kit | reposicao | condicional | saiu
        status: string         // segundo a doc: semvalor | pendente | condicional | montando | supervisao | ajuste | montado | bipando | bipado | retirado
        valor: number | null
        horaAtendimento: string | null
        atrasado: boolean
      }>
    }>
    retiradaPendente: null | {
      id: string
      listagemId: string
      entreguePor: string
      kitIds: string[]
    }
  }
  ```
- **Erros**:
  - `403`: modo admin.
  - `400`, `404`, `409` ou `422`: repasse do admin com a mensagem dele (`{ "error": string }`; se não houver mensagem, `"Não foi possível concluir."`).
  - `503 { "error": "Sem conexão com a empresa agora. Tente de novo em instantes." }`: falta `API_ADMIN_URL` ou `CONSIGNADO_INGEST_KEY`, houve erro de rede ou timeout, ou o admin respondeu 401 ou 5xx.
  - Erros comuns do prefixo (o 503 do kill-switch tem outro corpo).
- **Fonte dos dados**: admin `GET {API_ADMIN_URL}/listagens/app?rep=<cod>` com o header `x-ingest-key: CONSIGNADO_INGEST_KEY`. Timeout `EXTERNAL_API_TIMEOUT_MS`, sem retry e sem cache. O app guarda a última lista no aparelho.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/representantes/listagens" -H "Authorization: Bearer $TOKEN"
  ```

## Pedidos de nova data do acerto (`/api/representantes`)

A representante pede à Diretoria uma nova data de acerto (ou um novo prazo) para uma revendedora. Depois de aprovado, o pedido muda a `settlementDate` mostrada no app enquanto o Devmaster ainda tiver a data antiga. Vale tudo da seção "Regras comuns" do prefixo.

### GET /api/representantes/revendedoras/:id/pedidos-data

- **Descrição**: pedidos de nova data do acerto de uma revendedora, do mais novo ao mais antigo (até 20).
- **Auth**: dual. Em sessão, a revendedora precisa ser da rede (senão 404). Em **modo admin, não há filtro de rede e `representativeCod` é ignorado** nesta rota de leitura.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: `id` (integer): `users.id` da revendedora.
- **Query params**: `representativeCod` (string): aceito, mas não usado no GET.
- **Resposta 200**:
  ```ts
  {
    data: Array<{
      id: number
      revendedoraId: number
      dataAtual: string | null   // "YYYY-MM-DD", data do acerto quando o pedido foi feito
      novaData: string           // "YYYY-MM-DD"
      prazo: string              // 'so_data' | '45' | '60'
      fixarPrazo: boolean        // manter esse prazo daqui em diante (só se prazo ≠ 'so_data')
      motivo: string             // 'Dia de pagamento da revendedora' | 'Vende pouco e precisa de mais tempo' | 'Viagem ou compromisso' | 'Problema de saúde ou família' | 'Outro'
      observacao: string | null
      status: string             // 'aguardando' | 'aprovado' | 'reprovado'
      motivoDecisao: string | null
      decididoEm: string | null  // ISO
      criadoEm: string           // ISO
    }>
  }
  ```
- **Erros**: `404 { "error": "Revendedora não encontrada." }`, `400` de validação (id não inteiro), `500 { "error": "Falha ao carregar os pedidos." }` e erros comuns.
- **Fonte dos dados**: Postgres, tabela `pedidos_data_acerto` (posse checada por `users` e `revendedora_home_snapshots`). Não há cache.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/representantes/revendedoras/1234/pedidos-data" -H "Authorization: Bearer $TOKEN"
  ```

## Revendedoras (`/api/revendedoras`)

Endpoints administrativos (HNO e painel) sobre as revendedoras e as preferências de kit que elas preenchem no app. **Não** passam pelo kill-switch `REPRESENTANTE_ENABLED`.

**Auth comum (`requireRevendedorasAuth`)**: `Authorization: Bearer <ADMIN_SECRET>` obrigatório. Sessão de usuário não serve.
- `503 { "error": "Endpoint não configurado. Defina ADMIN_SECRET no servidor." }`: `ADMIN_SECRET` vazio no servidor.
- `401 { "error": "Não autorizado." }`: token ausente ou diferente.

### GET /api/revendedoras

- **Descrição**: exportação completa dos usuários do app (as revendedoras), com dados de contato, PIX, endereço de retirada e metadata. Ordenada por nome.
- **Auth**: `Bearer ADMIN_SECRET`.
- **Headers**: `Authorization: Bearer $TOKEN` (aqui `$TOKEN` = `ADMIN_SECRET`).
- **Path params**: nenhum.
- **Query params**: nenhum. Não há paginação: devolve **todas** as linhas de `users`.
- **Resposta 200**:
  ```ts
  {
    total: number
    data: Array<{
      id: number
      nome: string
      email: string
      telefone: string | null
      expo_push_token: string | null
      pix_key: string | null
      pix_receiver_name: string | null
      pickup_cep: string | null
      pickup_address: string | null
      pickup_address_number: string | null
      pickup_address_complement: string | null
      pickup_neighborhood: string | null
      pickup_city: string | null
      pickup_state: string | null
      metadata: unknown                     // jsonb livre de users.metadata (ex.: representanteCod quando o usuário é representante)
      disabled_condicionais: string[] | null
      created_at: string                    // ISO
    }>
  }
  ```
  Os campos aqui usam snake_case, diferente dos outros endpoints. Há dados sensíveis (PIX, push token).
- **Erros**: `401`, `503` (ver acima).
- **Fonte dos dados**: Postgres, tabela `users` inteira. Não há cache.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/revendedoras" -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/revendedoras/kit-preferences/analytics

- **Descrição**: painel com números globais do preenchimento das preferências de kit (taxa de preenchimento, proporção ouro/prata e categorias mais respondidas com o ranking das opções).
- **Auth**: `Bearer ADMIN_SECRET`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    totalRevendedoras: number             // count(users)
    totalComPreferencias: number          // linhas em kit_preferences
    totalSemPreferencias: number
    taxaPreenchimento: number             // %, 1 casa
    totalCategoriasRespondidas: number
    mediaCategoriasPorRevendedora: number // 1 casa
    resumoGeral: Array<{ ouro: number; prata: number }> // [] ou 1 item (média de goldPercent, arredondada à dezena)
    categoriasMaisRespondidas: Array<{    // ordem: total decrescente, depois key
      key: string                         // chave do bloco do formulário
      total: number                       // revendedoras que responderam
      resumoGeral: Array<{ ouro: number; prata: number }>
      title?: string                      // só se o bloco existir na config do admin
      type?: string                       // tipo do bloco (slider, id, letras, filhos, vend, vendsimple, vendmetal...)
      campos?: Array<{
        key: string
        label: string
        kind: string
        opcoes: Array<{
          value: string
          total: number
          pct: number                     // % sobre `total` da categoria
          metais?: Array<{ value: string; total: number; pct: number }> // divisão por metal, quando houver
        }>
      }>
    }>
    ultimaAtualizacao: string | null      // ISO, último save de preferências
    configSync: boolean                   // false = config do admin indisponível (as contagens podem incluir blocos removidos)
  }
  ```
- **Erros**: `401`, `503`.
- **Fonte dos dados**: Postgres (`users`, `kit_preferences.answers` jsonb) e a config de blocos do admin (`GET {API_ADMIN_URL}/kit/preferences`, cache de 60 s com fallback para o último cache). **O resultado inteiro fica em cache em memória por 60 s** e é invalidado quando alguém salva preferências.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/revendedoras/kit-preferences/analytics" -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/revendedoras/kit-preferences

- **Descrição**: lista paginada de revendedoras com o resumo das preferências de kit, com busca e ordenação.
- **Auth**: `Bearer ADMIN_SECRET`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: nenhum.
- **Query params**:
  - `busca` (string, opcional): busca `ILIKE` em nome, telefone ou e-mail. `%` e `_` são removidos.
  - `orderBy` (`nome` | `criadoEm` | `atualizadoEm`, padrão `atualizadoEm`).
  - `order` (`asc` | `desc`). Padrão: `asc` quando `orderBy=nome`, senão `desc`. Com `atualizadoEm`, quem não preencheu fica sempre no fim.
  - `page` (integer ≥ 1, padrão 1).
  - `pageSize` (integer 1–100, padrão 20).
- **Resposta 200**:
  ```ts
  {
    data: Array<{
      id: number
      nome: string
      telefone: string | null
      regiao: { cidade: string | null; estado: string | null }
      preferencias: {
        temPreferencias: boolean
        categoriasRespondidas: number
        resumoGeral: Array<{ ouro: number; prata: number }>
        atualizadoEm: string | null
      }
    }>
    total: number
    page: number
    pageSize: number
    totalPages: number
    orderBy: 'nome' | 'criadoEm' | 'atualizadoEm'
    order: 'asc' | 'desc'
    configSync: boolean
  }
  ```
- **Erros**: `400 { "message": "erro de validacao", "issues": [...] }` (enum ou limites inválidos), `401`, `503`.
- **Fonte dos dados**: Postgres (`users` com LEFT JOIN em `kit_preferences`). A config do admin filtra as respostas de blocos removidos (cache de 60 s). Não há cache próprio.
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/revendedoras/kit-preferences?busca=maria&orderBy=nome&page=1&pageSize=20" -H "Authorization: Bearer $TOKEN"
  ```

### GET /api/revendedoras/kit-preferences/:id

- **Descrição**: detalhe de uma revendedora com as respostas completas do formulário de preferências de kit.
- **Auth**: `Bearer ADMIN_SECRET`.
- **Headers**: `Authorization: Bearer $TOKEN`.
- **Path params**: `id` (integer): `users.id`.
- **Query params**: nenhum.
- **Resposta 200**:
  ```ts
  {
    id: number
    nome: string
    telefone: string | null
    email: string
    regiao: { cidade: string | null; estado: string | null }
    preferencias: {
      temPreferencias: boolean
      displayName: string | null
      observations: string | null
      answers: Record<string, unknown> // por chave de bloco; arrays de valores numéricos (ex.: "13", "45cm") vêm ordenados pelo número
      categoriasRespondidas: number
      resumoGeral: Array<{ ouro: number; prata: number }>
      atualizadoEm: string | null
    }
    configSync: boolean
  }
  ```
- **Erros**: `404 { "error": "Revendedora não encontrada." }`, `400` de validação, `401`, `503`.
- **Fonte dos dados**: Postgres (`users` com LEFT JOIN em `kit_preferences`) e a config do admin (cache de 60 s).
- **Exemplo**:
  ```bash
  curl -s "$API_URL/api/revendedoras/kit-preferences/1234" -H "Authorization: Bearer $TOKEN"
  ```

---

# Parte D — Admin / back-office

## Admin — Revendedoras, representantes e métricas (`/api/admin`)

Arquivo: `src/features/admin/admin.routes.ts`. Serviços em `admin.metrics.service.ts`, `admin.metrics.repository.ts`, `admin.ranking.repository.ts` e `representantes/representantes.cadastro.repository.ts`.

### Contrato de período compartilhado (`parseAdminPeriod`)

Usado por `/metrics/summary`, `/metrics/timeseries`, `/resellers/ranking`, `/resellers/:id` e por todas as rotas `/analytics/*`.

| Parâmetro | Tipo | Regra |
|---|---|---|
| `period` | string | `month` (padrão quando ausente ou desconhecido) = do dia 1 do mês civil atual em SP até o fim do dia de hoje em SP. `30d` ou `30` = últimos 30 dias civis em SP, contando hoje. `all` ou `tudo` = sem filtro de data (`period = null`). Case-insensitive. |
| `from` + `to` | `YYYY-MM-DD` | Intervalo civil em SP, com os dois extremos inclusivos. Só vale se **os dois** vierem. Sobrescreve `month`/`30d`, mas **não** sobrescreve `period=all` (que é avaliado antes). |

Regras extras de `parseAdminPeriod`:
- data inválida → cai silenciosamente no padrão `month`;
- `from > to` → as datas são trocadas.
- `days` = número de dias civis inclusivos.

> Nas rotas `/metrics/*` e `/resellers/*` **não há validação**: parâmetros inválidos caem no padrão. Só as rotas `/analytics/*` validam e respondem 400 (ver a seção de Analytics).

### Regra de comissão (faixas) usada nos cálculos financeiros

Fonte: `sales/sales.tier.ts`, `calculateTierAndCommission(totalVendido)`. A faixa é calculada sobre o total vendido **por revendedora** no período, nunca peça a peça. Depois:
- `comissao_revendedoras = total × %/100`;
- `valor_pagar_sorelly = total − comissão`.

| Total vendido (R$) | tier | commission_percent |
|---|---|---|
| < 300 | Bronze | 0 |
| 300–499,99 | Bronze | 15 |
| 500–699,99 | Prata | 25 |
| 700–999,99 | Ouro | 30 |
| 1000–1599,99 | Platina | 35 |
| 1600–2499,99 | Diamante | 40 |
| 2500–4999,99 | Diamante Pro | 40 |
| 5000–6999,99 | Elite | 45 |
| ≥ 7000 | Elite Pro | 45 |

### GET /api/admin/representantes

- **Descrição:** cadastro completo das representantes regionais (código, CPF/CNPJ, % de comissão, se o acesso está ativo) e quantas revendedoras estão vinculadas a cada uma. Ordenado por `nome`.
- **Auth:** `requireAdmin` (Bearer `ADMIN_SECRET`).
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** nenhum.
- **Query params:** nenhum.
- **Resposta 200:**
```ts
{
  data: Array<{
    cod: string            // código da representante (ex.: "A8")
    nome: string
    cpfCnpj: string        // só dígitos (11 = CPF, 14 = CNPJ)
    commissionPct: number  // % sobre as vendas da rede; 7 se o valor do banco não for numérico
    ativo: boolean         // false = login bloqueado
    revendedorasCount: number // users com users.representative_cod = cod
  }>
}
```
- **Erros:** 401, 503 (guard); 500 genérico.
- **Fonte dos dados:** Postgres, tabela `representantes` com LEFT JOIN em `users` (`users.representative_cod`).
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/representantes" -H "Authorization: Bearer $ADMIN_SECRET"
```

### GET /api/admin/metrics/summary

- **Descrição:** resumo financeiro e de garantias da rede inteira no período: total vendido, valor de pedidos, peças, ticket médio, repasse para a Sorelly × comissão das revendedoras (em R$ e em %), médias diárias e contagem de certificados de garantia.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** nenhum.
- **Query params:** `period`, `from`, `to` (contrato compartilhado, sem validação).
- **Resposta 200:**
```ts
{
  data: {
    period: {
      from: string   // ISO UTC do início (ex.: "2026-10-01T03:00:00.000Z"); "" quando period=all
      to: string     // ISO UTC do fim; em period=all = agora
      days: number   // dias do período; em period=all = dias desde a 1ª venda (mín. 1)
      label: string  // ex.: "01 de out. de 2026 – 30 de out. de 2026" (pt-BR, fuso SP); "Todo o período" em all
    }
    total_vendido: number          // soma de sales.sale_amount (vendas registradas pelas revendedoras às clientes)
    total_pedidos_valor: number    // soma de order_items.unit_price dos pedidos (order_groups) não cancelados criados no período
    pecas_vendidas: number         // nº de linhas em sales (1 linha = 1 peça)
    ticket_medio: number           // total_vendido / pecas_vendidas (por peça)
    valor_pagar_sorelly: number    // Σ por revendedora de (vendido − comissão da faixa)
    comissao_revendedoras: number  // Σ por revendedora de comissão da faixa
    valor_pagar_sorelly_percent: number   // % do repasse sobre (sorelly + comissão)
    comissao_revendedoras_percent: number
    media_vendas_diaria: number           // total_vendido / days
    media_recebido_sorelly_diaria: number // valor_pagar_sorelly / days
    media_comissao_diaria: number         // comissao_revendedoras / days
    garantias_total: number        // warranty_certificates emitidos (issued_at) no período
    garantias_ativas: number       // lower(status) = 'ativa'
    garantias_expiradas: number    // lower(status) = 'expirada'
    garantias_canceladas: number   // lower(status) = 'cancelada'
  }
}
```
  Todos os valores em R$ vêm arredondados com 2 casas.
- **Erros:** 401, 503; 500 genérico.
- **Fonte dos dados:** Postgres, tabelas `sales`, `order_groups` + `order_items` e `warranty_certificates`. Os certificados chegam do Garantify por webhook e ficam espelhados no banco local, então esta rota não chama a API do Garantify.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/metrics/summary?from=2026-10-01&to=2026-10-30" -H "Authorization: Bearer $ADMIN_SECRET"
```

### GET /api/admin/metrics/timeseries

- **Descrição:** série diária de vendas da rede (vendido, peças, comissão, repasse para a Sorelly). A comissão de cada dia é calculada aplicando a faixa ao total **daquele dia** de cada revendedora.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** nenhum.
- **Query params:** `period`, `from`, `to` (contrato compartilhado).
- **Resposta 200:**
```ts
{
  data: {
    points: Array<{
      date: string                 // "YYYY-MM-DD" (bucket diário via date_trunc em America/Sao_Paulo)
      total_vendido: number
      pecas_vendidas: number
      comissao_revendedoras: number
      valor_pagar_sorelly: number
    }>                             // só dias COM venda (sem preenchimento de lacunas), em ordem crescente
  }
}
```
- **Erros:** 401, 503; 500.
- **Fonte dos dados:** Postgres, tabela `sales`.
- **Observação técnica:** `sales.created_at` é `timestamp` sem fuso, e o bucket usa `created_at AT TIME ZONE 'America/Sao_Paulo'`. O dia atribuído a vendas perto da meia-noite depende do fuso da sessão do banco.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/metrics/timeseries?period=30d" -H "Authorization: Bearer $ADMIN_SECRET"
```

### GET /api/admin/resellers/ranking

- **Descrição:** ranking/listagem paginada de **todas** as revendedoras (usuárias do app), com vendas, pedidos, clientes, propostas, último acesso, sessões no período e dados financeiros (comissão, repasse, faixa).
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** nenhum.
- **Query params:**

| Nome | Tipo | Padrão | Regra |
|---|---|---|---|
| `limit` | int | 50 | limitado a [1, 2000] |
| `offset` | int | 0 | ≥ 0 |
| `order_by` | string | `total_vendido` | `total_vendido` \| `total_pedidos` \| `total_clientes` \| `ultimo_pedido` \| `criado_em` \| `comissao_revendedoras` \| `valor_pagar_sorelly` \| `total_itens_vendidos` \| `last_seen_at` \| `sessoes_periodo`. Valor fora da lista vira `total_vendido`. |
| `order_dir` | string | `desc` | `asc` ou qualquer outro valor (= `desc`) |
| `has_orders` | `true`\|`false` | (sem filtro) | `true` = só quem tem pedido não cancelado no período; `false` = só quem não tem |
| `period` / `from` / `to` | | `month` | contrato compartilhado |

  - Desempate: `u.name ASC`. Em `ultimo_pedido` e `last_seen_at` os nulos vão por último.
  - ⚠️ `order_by=comissao_revendedoras` e `order_by=valor_pagar_sorelly` entram crus no `ORDER BY` do SQL, mas essas colunas não existem no SELECT (são calculadas depois, em JS). Com isso o Postgres deve dar erro e a rota responder **500**. Mesmo que a query funcionasse, a reordenação em JS só reordena a página atual. Evite esses dois valores.
- **Resposta 200:**
```ts
{
  meta: {
    total: number        // nº de users (com has_orders, filtra por pedidos não cancelados de QUALQUER data — ignora o período)
    limit: number
    offset: number
    order_by: string
    order_dir: "asc" | "desc"
    period: { from: string /*ISO*/, to: string /*ISO*/, days: number } | null  // null em period=all
  }
  data: Array<{
    id: number
    nome: string
    email: string
    telefone: string | null
    criado_em: string                 // timestamp texto do Postgres (users.created_at)
    notificacoes_ativas: boolean      // tem expo_push_token
    pix_configurado: boolean          // tem pix_key
    total_clientes: string            // bigint como string — clientes cadastradas (todas as datas)
    total_pedidos: string             // pedidos (order_groups) não cancelados no período
    pedidos_finalizados: string       // status = 'finalizado' no período
    pedidos_aguardando_pagamento: string
    pedidos_pendentes: string
    pedidos_cancelados: string
    ultimo_pedido: string | null      // MAX(order_groups.created_at) no período
    primeiro_pedido: string | null    // MIN(order_groups.created_at) no período
    total_itens_vendidos: string      // nº de linhas em sales no período (peças)
    total_vendido: string             // numeric(12,2) como string, ex.: "1534.90"
    total_propostas_enviadas: string  // order_payment_proposals (todas as datas)
    last_seen_at: string | null       // maior entre users.last_seen_at e última sessão
    sessoes_periodo: string           // sessions criadas no período (logins)
    // campos calculados em JS (números):
    total_pedidos_valor: number       // Σ order_items.unit_price dos pedidos não cancelados no período
    ticket_medio: number              // total_vendido / total_itens_vendidos
    comissao_revendedoras: number
    valor_pagar_sorelly: number
    tier: string                      // faixa (ver tabela de comissão)
    commission_percent: number
  }>
}
```
- **Erros:** 401, 503; 500 (inclusive com os `order_by` problemáticos acima).
- **Fonte dos dados:** Postgres, tabelas `users`, `clients`, `order_groups`, `order_items`, `sales`, `order_payment_proposals` e `sessions`.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/resellers/ranking?period=month&limit=20&order_by=total_vendido&order_dir=desc&has_orders=true" \
  -H "Authorization: Bearer $ADMIN_SECRET"
```

### GET /api/admin/resellers/:id/monthly-history

- **Descrição:** consolidado mensal das vendas de uma revendedora nos últimos 24 meses em que houve venda, do mais recente para o mais antigo, com a faixa e a comissão de cada mês.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** `id` (int, `users.id` da revendedora; o valor é lido com `parseInt`, então `"12abc"` vira 12).
- **Query params:** nenhum.
- **Resposta 200:**
```ts
{
  data: Array<{
    mes: string                   // "YYYY-MM" (mês em America/Sao_Paulo)
    total_vendido: number
    pecas_vendidas: number
    ticket_medio: number          // por peça
    comissao_revendedoras: number // faixa aplicada ao total do mês
    valor_pagar_sorelly: number
    tier: string
    commission_percent: number
  }>                              // [] se não houver vendas ou se o id não existir
}
```
- **Erros:** `400 { "error": "ID inválido." }` (id não numérico); 401, 503; 500.
- **Fonte dos dados:** Postgres, tabela `sales`.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/resellers/123/monthly-history" -H "Authorization: Bearer $ADMIN_SECRET"
```

### GET /api/admin/resellers/:id

- **Descrição:** detalhe de uma revendedora: contato, PIX, local de retirada, totais **de todas as datas** (clientes, pedidos, vendas) e as 10 últimas compras/pedidos. O período afeta **só** `sessoes_periodo`.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** `id` (int, `users.id`).
- **Query params:** `period`, `from`, `to` (contrato compartilhado; só altera `sessoes_periodo`).
- **Resposta 200:**
```ts
{
  data: {
    id: number
    name: string
    email: string
    phone: string | null
    created_at: string             // timestamp texto do Postgres
    last_seen_at: string | null    // maior entre users.last_seen_at e a última sessão
    pix_key: string | null
    pix_receiver_name: string | null
    pickup_city: string | null
    pickup_state: string | null
    notificacoes_ativas: boolean
    total_clientes: number
    total_pedidos: number          // order_groups não cancelados (todas as datas)
    pedidos_finalizados: number
    total_vendido: string          // numeric como string, ex.: "980.00" (todas as datas)
    total_itens_vendidos: number
    ultimo_pedido: string | null
    sessoes_periodo: number
    ultimos_pedidos: Array<{       // 10 mais recentes (todas as datas)
      id: number
      status: "pendente" | "proposta" | "aguardando_pagamento" | "enviado" | "finalizado" | "cancelado"
      selected_method: string | null   // forma de pagamento escolhida (ex.: "avista", "parcelado", "aprazo")
      created_at: string
      cliente: string                  // nome da cliente final
    }>
  }
}
```
- **Erros:** `400 { "error": "ID inválido." }`; `404 { "error": "Revendedora não encontrada." }`; 401, 503; 500.
- **Fonte dos dados:** Postgres, tabelas `users`, `clients`, `order_groups`, `sales` e `sessions`.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/resellers/123?period=30d" -H "Authorization: Bearer $ADMIN_SECRET"
```

---

## Admin — Analytics (`/api/admin/analytics`)

Arquivo: `src/features/admin/admin.analytics.routes.ts`. Todas as rotas são GET, registradas pelo helper local `register(...)`, que aplica o guard, valida o período e responde `{ data: <DTO> }`. Serviços em `admin.analytics.service.ts`, `admin.activity-dashboard.service.ts` e `admin.analytics.repository.ts`.

### Contrato comum das rotas `/analytics/*`

- **Auth:** `requireAdmin` (401/503 como acima).
- **Query params:** `period`, `from`, `to`, com a semântica de `parseAdminPeriod` descrita na seção anterior e **validação prévia**:
  - `period`, se presente, precisa ser `month` | `30d` | `30` | `all` | `tudo` (case-insensitive). Caso contrário: `400 { "error": "Parâmetro \`period\` inválido. Use month, 30d ou all." }`.
  - `from` e `to` precisam vir juntos. Caso contrário: `400 { "error": "Informe \`from\` e \`to\` juntos (YYYY-MM-DD)." }`.
  - Formato `^\d{4}-\d{2}-\d{2}$`. Caso contrário: `400 { "error": "Datas \`from\`/\`to\` devem estar no formato YYYY-MM-DD." }`.
  - Data não parseável: `400 { "error": "Datas \`from\`/\`to\` inválidas." }`.
- **Envelope 200:** `{ "data": DTO }`.
- **Tipos auxiliares (presentes em várias respostas):**
```ts
type PeriodMeta = { from: string | null /* ISO; null em all */, to: string /* ISO; em all = agora */, days: number /* 0 em all */ }
type DailyPoint = { date: string /* "YYYY-MM-DD" (SP) */, value: number }
type Comparison = {
  value: number              // valor do período atual
  previous: number | null    // mesmo indicador na janela anterior de MESMA duração, terminando 1 ms antes de `from`
  change_abs: number | null  // value − previous
  change_pct: number | null  // % de variação; null se previous = 0
}                            // em period=all: previous/change_* = null
type Distribution = { label: string, count: number, value?: number }
```
- **Séries diárias (`DailyPoint[]`):** com período definido, a série é contínua do primeiro ao último dia civil (SP), e os dias sem dado vêm com `0`. Em `period=all`, só aparecem os dias com dado.
- **Fonte dos dados:** sempre o Postgres. Nenhuma rota de analytics chama API externa.

### GET /api/admin/analytics/activity-dashboard

- **Descrição:** dashboard executivo consolidado: financeiro com comparativo, garantias, engajamento, série diária combinada (vendas, pedidos, acessos) e top 5 revendedoras por vendido e por acessos.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** nenhum.
- **Query params:** contrato comum.
- **Resposta 200:**
```ts
{
  data: {
    period: PeriodMeta & { label: string }  // label "dd de mmm. de aaaa – ..." formatado no fuso DO SERVIDOR (não SP); "Todo o período" em all
    financeiro: {
      total_vendido: number
      comissao_revendedoras: number
      valor_pagar_sorelly: number
      pecas_vendidas: number
      ticket_medio: number
      total_pedidos: number           // order_groups criados no período (inclui cancelados)
      pedidos_finalizados: number
      pedidos_cancelados: number
      taxa_conversao_pct: number      // finalizados / (total − cancelados) × 100
      taxa_cancelamento_pct: number   // cancelados / total × 100
      comparativo: {
        total_vendido: Comparison
        comissao_revendedoras: Comparison
        valor_pagar_sorelly: Comparison
        total_pedidos: Comparison
      }
    }
    garantias: {
      total: number; ativas: number; expiradas: number; canceladas: number
      comparativo: { total: Comparison }
      serie_emissoes: DailyPoint[]    // certificados emitidos por dia
    }
    engajamento: {
      total_revendedoras: number; ativas_hoje: number; ativas_7d: number; ativas_30d: number
      ativas_periodo: number; inativas_periodo: number; taxa_ativacao_pct: number
      comparativo_ativas: Comparison
    }                                 // mesmos significados de /analytics/engagement
    timeseries: Array<{
      date: string                    // "YYYY-MM-DD"
      total_vendido: number
      comissao_revendedoras: number
      valor_pagar_sorelly: number
      pecas_vendidas: number
      pedidos: number                 // order_groups criados no dia
      acessos: number                 // revendedoras distintas com sessão criada no dia
    }>
    top_revendedoras: {
      por_vendido: Array<{ id: number, nome: string, total_vendido: number, sessoes_periodo: number, last_seen_at: string | null /* texto Postgres */ }>  // top 5 por total vendido
      por_acessos: Array<{ /* mesmo shape */ }>  // top 5 por sessões no período
    }
  }
}
```
  - O período anterior do comparativo financeiro é recalculado a partir das datas UTC (`toISOString().slice(0,10)`) da janela anterior.
- **Erros:** 400 (validação de período), 401, 503; 500.
- **Fonte dos dados:** Postgres, tabelas `sales`, `order_groups`, `order_items`, `warranty_certificates`, `users`, `sessions`, `clients` e `order_payment_proposals`.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/analytics/activity-dashboard?period=month" -H "Authorization: Bearer $ADMIN_SECRET"
```

### GET /api/admin/analytics/engagement

- **Descrição:** acesso e engajamento das revendedoras: total da base, ativas hoje/7d/30d/no período, inativas, taxa de ativação e série diária de acessos.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** nenhum.
- **Query params:** contrato comum.
- **Resposta 200:**
```ts
{
  data: {
    period: PeriodMeta
    total_revendedoras: number   // COUNT(*) de users
    ativas_hoje: number          // desde 00:00 do dia no fuso DO SERVIDOR até agora
    ativas_7d: number            // janela de 7 dias (fuso do servidor) até agora
    ativas_30d: number           // janela de 30 dias até agora
    ativas_periodo: number       // ativas no período (em all: desde 1970)
    inativas_periodo: number     // total − ativas_periodo (mín. 0)
    taxa_ativacao_pct: number    // ativas_periodo / total × 100
    serie_acessos: DailyPoint[]  // revendedoras DISTINTAS com sessão criada no dia
    comparativo_ativas: Comparison
  }
}
```
  "Ativa" = `users.last_seen_at` dentro da janela **ou** pelo menos uma linha em `sessions` criada dentro da janela.
- **Erros:** 400, 401, 503; 500.
- **Fonte dos dados:** Postgres, tabelas `users` e `sessions`.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/analytics/engagement?period=30d" -H "Authorization: Bearer $ADMIN_SECRET"
```

### GET /api/admin/analytics/retention

- **Descrição:** retenção por coorte de mês de cadastro: quantas revendedoras se cadastraram em cada mês e quantas delas seguem ativas nos **últimos 30 dias, contados a partir de agora**.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** nenhum.
- **Query params:** contrato comum. São validados, mas **não alteram o cálculo**: as coortes são sempre os 12 meses mais recentes que têm cadastro. O período só aparece ecoado em `period`.
- **Resposta 200:**
```ts
{
  data: {
    period: PeriodMeta
    coortes: Array<{
      mes: string          // "YYYY-MM" (mês de users.created_at em America/Sao_Paulo), do mais recente ao mais antigo
      cadastradas: number
      ativas: number       // last_seen_at ou sessão nos últimos 30 dias (now())
      retencao_pct: number // ativas / cadastradas × 100
    }>
  }
}
```
- **Erros:** 400, 401, 503; 500.
- **Fonte dos dados:** Postgres, tabelas `users` e `sessions`.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/analytics/retention" -H "Authorization: Bearer $ADMIN_SECRET"
```

### GET /api/admin/analytics/orders-funnel

- **Descrição:** funil dos pedidos (`order_groups`) que as revendedoras fazem para as clientes: distribuição por status, conversão, cancelamento, método de entrega e volume diário.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** nenhum.
- **Query params:** contrato comum (filtra por `order_groups.created_at`).
- **Resposta 200:**
```ts
{
  data: {
    period: PeriodMeta
    total_pedidos: number            // todos os status, inclusive cancelado
    por_status: Array<{ label: "pendente" | "proposta" | "aguardando_pagamento" | "enviado" | "finalizado" | "cancelado", count: number }> // sempre os 6, nesta ordem
    finalizados: number
    cancelados: number
    taxa_conversao_pct: number       // finalizados / (total − cancelados) × 100
    taxa_cancelamento_pct: number    // cancelados / total × 100
    por_metodo_entrega: Array<{ label: "entrega" | "retirada", count: number }> // só não cancelados, ordenado por count desc
    serie_volume: DailyPoint[]       // pedidos criados por dia (todos os status)
    comparativo_volume: Comparison   // sobre total_pedidos
  }
}
```
- **Erros:** 400, 401, 503; 500.
- **Fonte dos dados:** Postgres, tabela `order_groups`.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/analytics/orders-funnel?from=2026-09-01&to=2026-09-30" -H "Authorization: Bearer $ADMIN_SECRET"
```

### GET /api/admin/analytics/payments-funnel

- **Descrição:** funil de pagamento das solicitações de cobrança (`payment_requests`): contagem e valor por status, total pago, ticket médio pago, bandeira, parcelas e inadimplência dos pedidos a prazo.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** nenhum.
- **Query params:** contrato comum (filtra `payment_requests.created_at`; a inadimplência usa `order_groups.created_at`).
- **Resposta 200:**
```ts
{
  data: {
    period: PeriodMeta
    por_status: Array<{
      status: "em_analise" | "gerado" | "aguardando_pagamento" | "pago" | "cancelado"  // só os status presentes
      count: number
      valor_total: number          // Σ amount
    }>
    valor_total_pago: number       // Σ amount com status = 'pago'
    ticket_medio_pago: number      // AVG(amount) com status = 'pago'
    por_bandeira: Array<{ label: string /* card_brand ou "desconhecida" */, count: number, value: number /* Σ amount */ }> // count desc
    por_parcelas: Array<{ label: string /* ex.: "1x", "3x" (null conta como 1) */, count: number }>                       // parcelas asc
    inadimplencia: {
      parcelas_vencidas: number    // nº de PEDIDOS a prazo (selected_method='aprazo', não cancelados) com status calculado 'atrasado'
      valor_vencido: number        // Σ do valor pendente desses pedidos
    }
    comparativo_valor_pago: Comparison
  }
}
```
  A inadimplência é calculada em JS por `computePaymentStatus` (`clients/clients.payment.ts`), a partir de `payment_confirmation` do pedido e de `order_payment_proposals.methods` da proposta selecionada, comparando com o instante atual.
- **Erros:** 400, 401, 503; 500.
- **Fonte dos dados:** Postgres, tabelas `payment_requests`, `order_groups` e `order_payment_proposals`.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/analytics/payments-funnel?period=month" -H "Authorization: Bearer $ADMIN_SECRET"
```

### GET /api/admin/analytics/acquisition

- **Descrição:** aquisição: novas clientes finais (cadastradas pelas revendedoras) e novas revendedoras (cadastros no app), com totais, séries diárias e comparativo.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** nenhum.
- **Query params:** contrato comum.
- **Resposta 200:**
```ts
{
  data: {
    period: PeriodMeta
    novos_clientes_total: number          // clients.created_at no período
    novos_clientes_serie: DailyPoint[]
    novas_revendedoras_total: number      // users.created_at no período
    novas_revendedoras_serie: DailyPoint[]
    comparativo_clientes: Comparison
    comparativo_revendedoras: Comparison
  }
}
```
- **Erros:** 400, 401, 503; 500.
- **Fonte dos dados:** Postgres, tabelas `clients` e `users`.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/analytics/acquisition?period=30d" -H "Authorization: Bearer $ADMIN_SECRET"
```

### GET /api/admin/analytics/warranties

- **Descrição:** certificados de garantia (Garantify) emitidos no período, por status, com série diária de emissões e quantidade de acionamentos de garantia (claims) submetidos.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** nenhum.
- **Query params:** contrato comum (filtra `warranty_certificates.issued_at`).
- **Resposta 200:**
```ts
{
  data: {
    period: PeriodMeta
    certificados_total: number
    certificados_por_status: [
      { label: "ativa", count: number },
      { label: "expirada", count: number },
      { label: "cancelada", count: number }
    ]                                   // comparação de status case-insensitive
    serie_emissoes: DailyPoint[]
    claims_submetidas: number           // PROXY: linhas em warranty_claims_idempotency criadas no período (não há tabela local de claims)
    comparativo_certificados: Comparison
  }
}
```
- **Erros:** 400, 401, 503; 500.
- **Fonte dos dados:** Postgres, tabelas `warranty_certificates` (espelho local do Garantify, alimentado por webhook) e `warranty_claims_idempotency`. Não chama a API do Garantify.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/analytics/warranties?period=all" -H "Authorization: Bearer $ADMIN_SECRET"
```

### GET /api/admin/analytics/training

- **Descrição:** engajamento com os vídeos de treinamento: revendedoras que assistiram, total de visualizações e os 10 vídeos mais vistos.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** nenhum.
- **Query params:** contrato comum (filtra `video_progress.watched_at`).
- **Resposta 200:**
```ts
{
  data: {
    period: PeriodMeta
    revendedoras_que_assistiram: number   // user_id distintos
    total_visualizacoes: number           // linhas em video_progress
    videos_mais_vistos: Array<{ video_id: string, visualizacoes: number }> // top 10 desc
    comparativo_visualizacoes: Comparison
  }
}
```
- **Erros:** 400, 401, 503; 500.
- **Fonte dos dados:** Postgres, tabela `video_progress`.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/analytics/training?period=month" -H "Authorization: Bearer $ADMIN_SECRET"
```

---

## Admin — Notificações push (`/api/admin/notifications`)

Arquivo: `src/features/notifications/notifications-admin.routes.ts`. Audiência em `broadcast-audience.ts`; jobs em `broadcast-job.repository.ts` (tabela `notification_jobs`).

### GET /api/admin/notifications/audience-count

- **Descrição:** estimativa de alcance de um broadcast de marketing para **toda a base**, usada no modal de confirmação do admin. Conta usuárias com `expo_push_token` não nulo **e** `notif_marketing = true`. Tokens com formato inválido só são descartados no envio real, então a contagem pode diferir em poucas unidades do `eligible` do job.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** nenhum.
- **Query params:** nenhum.
- **Resposta 200:**
```json
{ "count": 1234 }
```
- **Erros:** 401, 503; 500.
- **Fonte dos dados:** Postgres, tabela `users`.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/notifications/audience-count" -H "Authorization: Bearer $ADMIN_SECRET"
```

### POST /api/admin/notifications/audience-count

- **Descrição:** (leitura via POST) alcance de um envio **direcionado**: conta, entre os ids informados, quem tem token não nulo e `notif_marketing = true`. Não grava nada.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`, `Content-Type: application/json`
- **Path params:** nenhum.
- **Query params:** nenhum.
- **Body:** `{ "userIds": number[] }`, um array não vazio de inteiros (`users.id`).
- **Resposta 200:**
```json
{ "count": 12 }
```
- **Erros:** `400 { "error": "Campo \`userIds\` deve ser um array não-vazio de inteiros." }`; 401, 503; 500.
- **Fonte dos dados:** Postgres, tabela `users`.
- **Exemplo:**
```bash
curl -s -X POST "$API_URL/api/admin/notifications/audience-count" \
  -H "Authorization: Bearer $ADMIN_SECRET" -H "Content-Type: application/json" \
  -d '{"userIds":[101,102,103]}'
```

### GET /api/admin/notifications/users

- **Descrição:** busca paginada de revendedoras para escolher as destinatárias de um push direcionado. Ordena por nome e depois por id.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** nenhum.
- **Query params:**
  - `busca` (string, opcional): `ILIKE %termo%` em nome, telefone ou e-mail. `%` e `_` são removidos do termo. Vazio = todas.
  - `page` (int, padrão 1, mín. 1).
  - `pageSize` (int, padrão 20, limitado a [1, 50]).
- **Resposta 200:**
```ts
{
  items: Array<{
    id: number
    nome: string
    email: string
    temDispositivo: boolean   // expo_push_token não nulo (ignora notif_marketing)
  }>
  total: number               // total que casa com a busca
  page: number
  pageSize: number
}
```
- **Erros:** 401, 503; 500.
- **Fonte dos dados:** Postgres, tabela `users`.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/notifications/users?busca=maria&page=1&pageSize=20" -H "Authorization: Bearer $ADMIN_SECRET"
```

### GET /api/admin/notifications/jobs/:jobId

- **Descrição:** snapshot do job de envio (broadcast ou direcionado), usado no polling de progresso pelo admin. Um 404 significa que o worker ainda não criou o job; o admin trata isso como "na fila". Os campos internos (título, mensagem, ação, ticketIds, lastBatchIndex) não são expostos.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** `jobId` (string, até 32 caracteres; é o `envioId`/cuid gerado pelo admin).
- **Query params:** nenhum.
- **Resposta 200:**
```ts
{
  id: string
  status: "processing" | "awaiting_receipts" | "done" | "failed" | "cancelled"
  counts: {
    eligible: number    // tokens válidos no início do processamento
    accepted: number    // tickets "ok" da Expo
    confirmed: number   // receipts "ok"
    failed: number      // tickets "error" + receipts "error"
  }
  failureReasons: Record<string, number> // ex.: { "DeviceNotRegistered": 5, "Unknown": 1 }; {} se não houve falha
  retryableFailures: number   // falhas que valem reenvio (todas exceto DeviceNotRegistered, MessageTooBig, InvalidCredentials)
  cancelledAt: string | null  // ISO 8601 — kill switch acionado
  failureReason: string | null
  startedAt: string | null
  receiptsCheckedAt: string | null
  finishedAt: string | null
}
```
- **Erros:** `404 { "error": "Job não encontrado." }`; 401, 503; 500.
- **Fonte dos dados:** Postgres, tabela `notification_jobs`. Ela é alimentada pelo worker SQS, que envia via Expo Push API, mas esta rota só lê do banco.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/notifications/jobs/ckz9x1abc0000xyz" -H "Authorization: Bearer $ADMIN_SECRET"
```

> As demais rotas deste plugin (`POST /jobs/:jobId/retry` e `POST /jobs/:jobId/cancel`) alteram estado e ficam fora do escopo de leitura.

---

## Admin — Kits novos (`/api/admin/kits-novos`)

Arquivo: `src/features/kits-novos/kits-novos-admin.routes.ts`. Serviço e repositório: `kits-novos.service.ts` e `kits-novos.repository.ts` (tabela `kits_novos_representante`).

### GET /api/admin/kits-novos/respostas

- **Descrição:** o admin é a fonte da verdade e envia à representante os kits novos de candidatas a revendedora. Esta rota é o pull incremental das **respostas** das representantes: kits que elas agendaram (data/período da entrega) ou recusaram (com motivo) depois do instante `desde`. Para paginar, use o `respondidoEm` do último item como próximo `desde`.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** nenhum.
- **Query params:**
  - `desde` (string ISO 8601, opcional). Ausente ou vazio = desde 1970 (todas). Filtro estrito `respondido_em > desde`.
  - Limite fixo de 500 itens por chamada, ordenados por `respondidoEm` asc e depois `externalId` asc.
  - Só entram kits com status `agendado` ou `recusado`.
- **Resposta 200:**
```ts
{
  data: Array<{
    externalId: string           // id do kit no admin
    representanteCod: string
    status: "agendado" | "recusado"
    agendadoPara: string | null  // "YYYY-MM-DD" (só quando agendado)
    periodo: "manha" | "tarde" | "noite" | null  // só quando agendado
    motivo: string | null        // motivo da recusa (só quando recusado)
    respondidoEm: string         // ISO 8601 UTC, precisão de milissegundos
  }>
}
```
- **Erros:** `400 { "error": "desde inválido (use ISO 8601)." }`; `500 { "error": "Falha ao listar as respostas." }`; 401, 503.
- **Fonte dos dados:** Postgres, tabela `kits_novos_representante`.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/kits-novos/respostas?desde=2026-10-29T00:00:00.000Z" -H "Authorization: Bearer $ADMIN_SECRET"
```

---

## Admin — Listagens (`/api/admin/listagens`)

Arquivo: `src/features/listagens/listagens.routes.ts`, plugin `listagensAdminRoutes`.

**Não existe nenhum endpoint GET neste prefixo.** A única rota é `POST /api/admin/listagens/avisos`. Ela é de escrita: dispara push para a representante e responde `{ enviados }`, então fica fora do escopo de leitura. A leitura das listagens acontece só no lado da representante (`GET /api/representantes/listagens`, sessão de representante), que repassa ao admin externo usando `API_ADMIN_URL` + `CONSIGNADO_INGEST_KEY`.

---

## Admin — Pedidos de nova data do acerto (`/api/admin/pedidos-data`)

Arquivo: `src/features/pedidos-data-acerto/pedidos-data-acerto-admin.routes.ts`. Serviço e repositório: `pedidos-data-acerto.service.ts` e `pedidos-data-acerto.repository.ts` (tabela `pedidos_data_acerto`).

### GET /api/admin/pedidos-data

- **Descrição:** fila de pedidos de mudança da data do acerto (o dia em que a revendedora acerta o consignado). Os pedidos são abertos pelas representantes e decididos pela Diretoria. Traz o nome da revendedora e da representante. Do mais novo para o mais antigo, com limite de 300.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** nenhum.
- **Query params:** `status` (opcional): `aguardando` | `aprovado` | `reprovado`. Ausente = todos.
- **Resposta 200:**
```ts
{
  data: Array<{
    id: number
    revendedoraId: number          // users.id
    dataAtual: string | null       // "YYYY-MM-DD" — data do acerto vigente no momento do pedido
    novaData: string               // "YYYY-MM-DD" pedida
    prazo: "so_data" | "45" | "60" // só a data, ou mudar o prazo do consignado para 45/60 dias
    fixarPrazo: boolean
    motivo: string                 // ex.: "Dia de pagamento da revendedora", "Viagem ou compromisso", "Outro"...
    observacao: string | null
    status: "aguardando" | "aprovado" | "reprovado"
    motivoDecisao: string | null
    decididoEm: string | null      // ISO 8601
    criadoEm: string               // ISO 8601
    revendedoraNome: string
    representanteCod: string
    representanteNome: string | null
    decididoPor: string | null     // operador que decidiu
  }>
}
```
- **Erros:** `400 { "error": "status inválido." }`; `500 { "error": "Falha ao listar os pedidos." }`; 401, 503.
- **Fonte dos dados:** Postgres, tabela `pedidos_data_acerto` com INNER JOIN em `users`.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/pedidos-data?status=aguardando" -H "Authorization: Bearer $ADMIN_SECRET"
```

---

## Admin — Indique & Ganhe (`/api/admin/indicacoes`)

Arquivo: `src/features/indicacoes/indicacoes-admin.routes.ts`. Repositório em `indicacoes.repository.ts`; também `indicacoes.revendedoras-admin.ts`, `indicacoes.resgates.service.ts`, `indicacoes.premios.ts` e `indicacoes.status.ts`.

Contexto: a revendedora indica uma pessoa para virar revendedora. Quando a indicação chega em `finalizado` ("Kit entregue"), ela ganha 1000 Sorelly Coins (moedas). As moedas são trocadas por prêmios em semijoias (resgates).

Status da indicação e rótulos:
- `criado` → "Cadastro iniciado"
- `em_andamento` → "Cadastro em andamento"
- `cadastro_aprovado` → "Cadastro aprovado"
- `finalizado` → "Kit entregue"
- `cancelado` → "Cancelada"

Status de resgate: `solicitado` | `aprovado` | `entregue` | `cancelado`.

Tipo `ResgateDto`, usado nas rotas de resgate:
```ts
type ResgateDto = {
  id: number
  premioCodigo: string          // "PREMIO_1".."PREMIO_7"
  premioNivel: number           // 1..7
  premioTitulo: string          // ex.: "R$ 400 em semijoias"
  premioValorCentavos: number
  custoMoedas: number
  status: "solicitado" | "aprovado" | "entregue" | "cancelado"
  retiradaEm: string | null     // "YYYY-MM-DD" combinado na aprovação
  criadoEm: string              // ISO 8601
  entregueEm: string | null
  canceladoEm: string | null
  canceladoMotivo: string | null
}
```

### GET /api/admin/indicacoes

- **Descrição:** lista global das indicações: quem indicou (revendedora), quem foi indicada, status, moedas creditadas. Tem filtros, paginação e totais por status.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** nenhum.
- **Query params:**

| Nome | Tipo | Padrão | Regra |
|---|---|---|---|
| `status` | string | — | um dos 5 status (é aparado e convertido para minúsculas) |
| `revendedoraId` (alias `userId`) | int > 0 | — | filtra por quem indicou; valor inválido é ignorado |
| `whatsapp` | string | — | qualquer formato BR. É normalizado para o canônico `55DDDNÚMERO` (12–13 dígitos) e compara por igualdade com o WhatsApp da indicada **ou** o telefone da revendedora |
| `q` | string | — | `ILIKE %q%` em nome, telefone e e-mail da revendedora e em nome e WhatsApp da indicada |
| `limit` | int | 50 | limitado a [1, 200] |
| `offset` | int | 0 | ≥ 0 |

- **Resposta 200:**
```ts
{
  indicacoes: Array<{
    id: number
    status: "criado" | "em_andamento" | "cadastro_aprovado" | "cancelado" | "finalizado"
    statusLabel: string
    externalId: string | null       // id no sistema externo (funil/CRM)
    leadId: number | null           // id do lead no Kommo
    moedasCreditadas: number        // Σ coin entries kind='indicacao_finalizada' desta indicação
    creditadoEm: string | null      // ISO
    statusAlteradoEm: string        // ISO
    criadoEm: string                // ISO
    atualizadoEm: string            // ISO
    indicada: { nome: string | null, whatsapp: string | null }  // whatsapp canônico completo
    revendedora: { id: number, nome: string, email: string, telefone: string | null }
  }>                                // ordenado por criadoEm desc, id desc
  paginacao: { total: number, limit: number, offset: number, hasMore: boolean }
  totaisPorStatus: {                // contagem GLOBAL (ignora os filtros)
    criado: number, em_andamento: number, cadastro_aprovado: number, cancelado: number, finalizado: number
  }
}
```
- **Erros:**
  - `400 { "error": "Filtro \"status\" inválido. Use criado, em_andamento, cadastro_aprovado, cancelado ou finalizado." }`
  - `400 { "error": "Informe um WhatsApp válido em ?whatsapp=." }` (`whatsapp` vazio)
  - `400 { "error": "WhatsApp inválido. Use um número BR (ex.: 11988887777 ou (11) 98888-7777)." }`
  - 401, 503; 500.
- **Fonte dos dados:** Postgres, tabelas `indicacoes`, `users` e `sorelly_coin_entries`.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/indicacoes?status=em_andamento&limit=50&offset=0" -H "Authorization: Bearer $ADMIN_SECRET"
```

### GET /api/admin/indicacoes/resgates

- **Descrição:** fila de resgates de prêmios (troca de moedas por semijoias) para a operação, sem paginação, dos mais recentes para os mais antigos.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** nenhum.
- **Query params:** `status` (opcional): `solicitado` | `aprovado` | `entregue` | `cancelado` (case-sensitive). Ausente = todos.
- **Resposta 200:**
```ts
{ resgates: Array<ResgateDto & { userId: number /* revendedora */ }> }
```
- **Erros:** `400 { "error": "Filtro \"status\" inválido. Use solicitado, aprovado, entregue ou cancelado." }`; 401, 503; 500.
- **Fonte dos dados:** Postgres, tabela `indicacao_resgates`.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/indicacoes/resgates?status=solicitado" -H "Authorization: Bearer $ADMIN_SECRET"
```

### GET /api/admin/indicacoes/resgates/:id

- **Descrição:** detalhe de um resgate.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** `id` (inteiro > 0).
- **Query params:** nenhum.
- **Resposta 200:**
```ts
{ resgate: ResgateDto }   // sem userId
```
- **Erros:** `400 { "error": "Id inválido." }`; `404 { "error": "Resgate não encontrado." }`; 401, 503; 500.
- **Fonte dos dados:** Postgres, tabela `indicacao_resgates`.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/indicacoes/resgates/42" -H "Authorization: Bearer $ADMIN_SECRET"
```

### GET /api/admin/indicacoes/revendedoras

- **Descrição:** revendedoras ranqueadas para o painel de indicações. A ordem é:
  1. quem tem indicações, por nº de indicações desc e depois moedas desc;
  2. quem não tem indicação mas tem saldo, por moedas desc;
  3. o resto.

  Desempate final por nome asc e depois id asc.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** nenhum.
- **Query params:**
  - `busca` (opcional): `ILIKE` em nome, e-mail e telefone, e `LIKE` no id. Curingas `% _ \` são removidos; um termo só de curingas não retorna nada.
  - `page` (inteiro > 0, padrão 1).
  - `pageSize` (inteiro > 0, padrão 20, limitado a no máximo 50).
- **Resposta 200:**
```ts
{
  items: Array<{
    id: number
    nome: string
    email: string | null
    telefone: string | null
    indicacoes: number   // nº de linhas em indicacoes (todos os status)
    moedas: number       // Σ amount em sorelly_coin_entries (saldo contábil; não roda a expiração lazy)
  }>
  total: number
  page: number
  pageSize: number       // já limitado a 50
}
```
- **Erros:** `400 { "error": "Página inválida." }` (`page` ou `pageSize` não inteiro positivo); 401, 503; 500.
- **Fonte dos dados:** Postgres, tabelas `users`, `indicacoes` e `sorelly_coin_entries`.
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/indicacoes/revendedoras?busca=ana&page=1&pageSize=20" -H "Authorization: Bearer $ADMIN_SECRET"
```

### GET /api/admin/indicacoes/revendedoras/:id/premios

- **Descrição:** saldo atual de moedas da revendedora e o catálogo de prêmios, marcando o que ela já pode resgatar. É usado no resgate manual no balcão.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** `id` (inteiro > 0, `users.id`).
- **Query params:** nenhum.
- **Resposta 200:**
```ts
{
  saldoMoedas: number
  premios: Array<{               // sempre os 7, por custo crescente
    codigo: string               // "PREMIO_1".."PREMIO_7"
    titulo: string               // "R$ 400 em semijoias" ... "R$ 4.000 em semijoias"
    custoMoedas: number          // 1000, 2000, ..., 7000
    valorCentavos: number        // 40000 ... 400000
    resgatavel: boolean          // saldoMoedas >= custoMoedas
  }>
}
```
- **Efeito colateral:** a leitura do saldo (`getSaldo`) roda a **expiração lazy** das moedas dentro de uma transação, com lock na linha da revendedora. Se algum lote venceu, o backend grava lançamentos `expiracao` em `sorelly_coin_entries` antes de responder. Por isso a rota não é estritamente somente leitura.
- **Erros:** `400 { "error": "Id inválido." }`; `404 { "error": "Revendedora não encontrada no app." }`; 401, 503; 500.
- **Fonte dos dados:** Postgres, tabelas `users` e `sorelly_coin_entries`. O catálogo de prêmios é uma constante em código (`indicacoes.premios.ts`).
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/indicacoes/revendedoras/123/premios" -H "Authorization: Bearer $ADMIN_SECRET"
```

> Fora do escopo de leitura neste plugin:
> - `POST /`
> - `PATCH /:id/status`
> - `POST /revendedoras/:id/moedas` (usa `INDICACOES_MOEDAS_VALIDADE_DIAS`)
> - `POST /resgates`
> - `PATCH /resgates/:id`

---

## Admin — Reportes de problema em produtos (`/api/admin/product-reports`)

Arquivo: `src/features/product-reports/product-reports.routes.ts`, plugin `productReportsAdminRoutes`. Serviço e repositório: `product-reports.service.ts` e `product-reports.repository.ts` (tabela `product_issue_reports`).

### GET /api/admin/product-reports

- **Descrição:** fila de triagem dos produtos do catálogo que as revendedoras reportaram com problema (foto, nome ou preço incorreto). Traz **um item por produto** com reportes pendentes e junta os tipos de erro apontados por todas as autoras. O produto reportado há mais tempo vem primeiro.
- **Auth:** `requireAdmin`.
- **Headers:** `Authorization: Bearer $ADMIN_SECRET`
- **Path params:** nenhum.
- **Query params:** nenhum.
- **Resposta 200:**
```ts
{
  items: Array<{
    productCode: string      // código/SKU do produto
    productName: string      // MAX(product_name) entre os snapshots
    reportCount: number      // nº de reportes pendentes (1 por revendedora+produto)
    fotoIncorreta: boolean   // bool_or entre os reportes
    nomeIncorreto: boolean
    precoIncorreto: boolean
    firstReportedAt: string  // MIN(created_at). Vem de sql`` sem mapeamento: string no formato texto do Postgres (timestamptz, ex.: "2026-10-01 12:34:56.789+00"), não ISO
  }>
}
```
- **Erros:** 401, 503; 500.
- **Fonte dos dados:** Postgres, tabela `product_issue_reports` (`status = 'pendente'`).
- **Exemplo:**
```bash
curl -s "$API_URL/api/admin/product-reports" -H "Authorization: Bearer $ADMIN_SECRET"
```

> `POST /api/admin/product-reports/:productCode/resolve` é escrita (encerra o ciclo e dispara pushes) e fica fora do escopo de leitura.

---
