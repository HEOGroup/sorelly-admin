# Integração: app real da representante ↔ este Admin

05/11/2026. Base: `MANUAL-APP-REPRESENTANTE.pdf` (Marcus) e o contrato único
`sorelly-app/docs/app-representante/CONTRATOS.md`.

## 1. O caminho de um dado

```
App da representante (Expo)
   │ sessão da representante
   ▼
Backend do app (sorelly-app/apps/backend, Fastify)
   │ x-ingest-key = CONSIGNADO_INGEST_KEY        base API_ADMIN_URL = https://<este admin>/api
   ▼
Rotas de serviço deste Admin (app/api/consignado/ingest/*, app/api/listagens/app*)
   │ gravam uma linha por item em sorelly.estado_item (módulos rpo e rpf)
   ▼
Navegador da equipe (lib/sync-modulos.js, a cada 20 s, só o que mudou)
   │ SYNC_MODULO rpo/rpf → domain/app-rep.js monta listagens, kits e acertos
   ▼
Telas de sempre: Montagem › Listagens, Consolidado, Comissões, Inadimplência,
Garantia › Créditos, Expositores › Fotos dos kits novos, Erros de bipagem
```

No sentido contrário, este Admin chama o backend do app (`MOBILE_API_URL`,
`Authorization: Bearer MOBILE_API_KEY`):

| Quando | Chamada | Onde está |
|---|---|---|
| A cada 60 s (com `APP_REP_SINCRONIZAR=1`) | `PUT/DELETE /admin/kits-novos/:id` (kit novo direcionado pela Michele) | `src/server/app-rep/sincronizar.js` |
| A cada 60 s | `GET /admin/kits-novos/respostas` (agendou ou recusou) | idem |
| A cada 60 s | `POST /admin/listagens/avisos` (kit bipado = "pronto para retirar") | idem |
| Tela Agendamento › Pedidos do app | `GET /admin/pedidos-data`, `PATCH /admin/pedidos-data/:id` | `app/api/app-rep/pedidos-data/*` |

## 2. Quem é dono de cada chave

Uma linha por chave em `sorelly.estado_item` (criada sozinha na primeira chamada,
ou com `npm run migrar-app-representante`). O prefixo diz o dono
(`src/apps/montagem/domain/app-rep.js`):

| Módulo | Prefixo | Dono | Conteúdo |
|---|---|---|---|
| rpo | `l_` | app | listagem criada no app |
| rpo | `lx_` | equipe | o que a equipe mudou na listagem (retiradas, fechada) |
| rpo | `k_` | app | kit incluído pela representante |
| rpo | `kx_` | equipe | andamento (valor, montagem, bipagem, status). Kit criado pela equipe numa listagem do app vai inteiro, com `_full:true` |
| rpo | `ke_` | app | eventos do app no kit: acertado, kit novo entregue, reposição entregue, pré-acerto |
| rpo | `en_` | app | entrega guiada do kit novo (foto do expositor, etapas, assinatura) |
| rpo | `eb_` | app | erro de bipagem achado na contagem do kit |
| rpo | `pr_` | app | ficha da revendedora preenchida no app: 2º telefone, endereços, profissão, referências (`src/server/app-rep/perfil.js`) |
| rpo | `pa_` | app | pré-acerto por revendedora (remarcações e dias de atraso) |
| rpo | `ks_` | servidor | estado da sincronização (kits enviados, cursor, avisos) |
| rpf | `a_` | app | registro do atendimento: `acerto`, `kit_novo_entrega`, `reposicao` |
| rpf | `ax_` | equipe | conferência do agendamento, financeiro, divergências, negociação |
| rpf | `ar_` | app | "Entreguei o dinheiro / as condicionais" (vira `recebimento.rep`) |
| rpf | `km_` | app | km total do período (vira `comis.fech[data|rep].km`) |
| rpf | `gv_` | app | aviso de gasolina visto |
| rpf | `cf_comis` | equipe | configuração de comissões espelhada do navegador do Financeiro |

Regras do mecanismo:
- O `PUT /api/estado/rpo|rpf` do navegador só grava chaves de dono **equipe**. As do app são gravadas só pelas rotas de serviço.
- A leitura é incremental (`?desde=`): devolve o que mudou depois da versão, mais o que mudou no último minuto (gravações quase juntas).
- Apagar = lápide `{_apagado:true}`. "Este navegador manda" nunca envia `rpo`/`rpf`.
- O espelho da equipe (`state/store.js`, `espelharApp`) só roda depois que o servidor mandou os dados nesta sessão (`_rpoPronto` / `_rpfPronto`).

## 3. Rotas de serviço (chave `x-ingest-key`)

Todas respondem erro como `{ "error": "frase" }`. 4xx só para recusa definitiva;
falha passageira = 503 (o backend do app repesca).

| Rota | Código |
|---|---|
| `POST /api/consignado/ingest/acerto` | `src/server/app-rep/consignado.js` `registrarAcerto` |
| `POST /api/consignado/ingest/movimento` | `registrarMovimento` (kit novo e reposição) |
| `GET/PUT /api/consignado/ingest/perfil` | `src/server/app-rep/perfil.js` `lerPerfil`, `salvarPerfil` |
| `POST /api/consignado/ingest/cancelar` | `cancelarRegistro` (409 se o agendamento/financeiro já conferiu) |
| `GET /api/consignado/ingest/formas-pagamento` | `formasDoApp` (sem "Acerto com loja") |
| `GET /api/consignado/ingest/contexto` | `contextoAcerto` (3 últimas vendas da DevMaster, dívida, créditos de garantia, pré-acerto) |
| `PUT /api/consignado/ingest/pre-acerto` | `salvarPreAcerto` |
| `GET /api/consignado/ingest/comissoes` | `src/server/app-rep/comissoes.js` `comissoesDaRep` |
| `POST /api/consignado/ingest/comissoes/km`, `/entrega`, `/gasolina-visto` | `enviarKm`, `marcarEntrega`, `gasolinaVista` |
| `GET/POST /api/listagens/app`, `POST .../itens`, `DELETE .../itens/:itemId` | `src/server/app-rep/listagens.js` |

A representante vem pelo código do vendedor (`rep`). O nome usado nas telas é o
do Agendamento (`agend.config.representantes[].codigo` → `nome`). Representante
sem código no Agendamento: o registro entra com o primeiro nome que veio do app.

## 4. Variáveis (`.env.local`)

| Variável | Para quê |
|---|---|
| `CONSIGNADO_INGEST_KEY` | igual à do backend do app; sem ela as rotas de serviço respondem 503 |
| `MOBILE_API_URL`, `MOBILE_API_KEY` | backend do app (já existiam, para leitura) |
| `APP_REP_SINCRONIZAR=1` | liga a gravação no app (kits novos, respostas, aviso, decisão de pedido de data). Deixe vazio em teste |

No backend do app: `API_ADMIN_URL=https://<este admin>/api` e a mesma `CONSIGNADO_INGEST_KEY`.

## 5. Teste

`sorelly-app/docs/app-representante/teste-prototipo/` tem um teste de fumaça com
Postgres em memória (PGlite): 32 casos (listagens, limites, espelho da equipe,
acerto idempotente, crédito de garantia, contexto, pré-acerto, cancelamento,
reposição, kit novo com expositor, comissões, km, entrega na empresa,
sincronização dos kits novos e aviso de kit pronto). Rodar:
`node docs/app-representante/teste-prototipo/rodar.mjs` (ajuste os caminhos do topo).

## 6. O que ainda não está ligado

- Quadro (kanban) dos kits novos da Michele: desde 05/11/2026 o cartão mostra a resposta do app ("Agendado no app · dd/mm · período", "Na listagem do app", "Recusou no app · rep"), lida do módulo `kn` (`kits-novos/lib/bridge-montagem.js` → `respostasDoApp`, atualiza a cada 20 s). Entregue, cancelar, voltar para Liberado ou excluir no quadro tira o kit do app (`situacaoNoApp`). As etapas do quadro continuam só no navegador (`kits-novos/App.js`): só aparece no cartão o kit que passou pelo servidor (modo servidor ligado).
- Créditos de garantia: a baixa ("Usado no acerto") grava o módulo `gr` inteiro; se alguém da Garantia estiver lançando no mesmo segundo, uma das gravações pode se perder (risco pequeno, mesmo do sistema todo).
- Imagens (assinatura e foto do expositor) ainda vão em texto dentro do registro. Fase 2: arquivo à parte (como `chat_midia`).
