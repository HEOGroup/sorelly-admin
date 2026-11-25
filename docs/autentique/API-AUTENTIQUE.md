# API da Autentique (assinatura eletrônica)

Guia para o Claude integrar a Autentique neste projeto. Montado em 25/11/2026 a partir da documentação oficial inteira (https://docs.autentique.com.br/api, versão v2) e de um teste real feito com a chave do projeto. Se a documentação oficial mudar, ela vence: cada página tem versão em Markdown acrescentando `.md` no fim da URL, e o índice completo fica em https://docs.autentique.com.br/api/llms.txt.

## 0. Regras para o Claude (ler antes de qualquer chamada)

1. **Crédito custa dinheiro.** Todo teste usa `sandbox: true` no `createDocument`. Documento sem sandbox só quando o Marcus pedir, e com documento real.
2. **Signatário de teste sem e-mail e sem telefone**: só `name`. Assim nenhuma mensagem é enviada e a API devolve um link (`link.short_link`). A doc não diz se envio por WhatsApp ou SMS é cobrado no sandbox, então não use nos testes.
3. **Consultas também custam** (R$ 0,001 por documento retornado). Não fique listando documentos para saber o status: use webhook (seção 10). Use `limit` pequeno.
4. **Limite de pedidos**: 60 por minuto na doc geral; a tabela de preços diz 10/min no plano Free, 60 no Professional e 200 no Corporate. Passou do limite = HTTP 429 `{"message": "Too Many Attempts."}`.
5. **A chave fica só no servidor** (`AUTENTIQUE_API_KEY` no `.env`, código em `src/server/`). Nunca no front, nunca no Git, nunca em log.
6. **Ações que mexem em documento real** (`deleteDocument`, `deleteSigner`, `signDocument`, `transferDocument`, `resendSignatures`): só com o Marcus de acordo.
7. Não use documento real (contrato de revendedora de verdade) no sandbox: ele não tem validade jurídica e é apagado sozinho.

## 1. Situação neste projeto (25/11/2026)

- Chave: `AUTENTIQUE_API_KEY` em `sorelly-prototipo/.env` (64 caracteres). Funciona.
- Conta da chave: Marcus Hess (consulta `me`). Ainda sem nenhum documento real criado.
- Ainda não há código usando a Autentique.
- Teste feito: documento sandbox "Teste Sorelly - sandbox" (id `574f7e8ba20b8b54e4a0e54410eaa9da4e3fe3b4f4fd9f9cd`), 1 signatário só com nome, link `https://assina.ae/gKWTv6XII7MPqhPg5`. A resposta trouxe **duas** assinaturas: a do signatário e uma com `name: null` e `action: null`, que é o dono da conta entrando como autor. Ao contar signatários, filtre as que têm `action`.

## 2. Básico

- Só **GraphQL**, não há REST.
- Endpoint único: `POST https://api.autentique.com.br/v2/graphql`
- Cabeçalho: `Authorization: Bearer <AUTENTIQUE_API_KEY>`
- Chaves geradas no painel: https://painel.autentique.com.br/perfil/api
- Explorador do esquema completo (todos os campos e tipos, aba "Docs"): https://altair.autentique.com.br
- Consulta comum: `Content-Type: application/json` com `{"query": "...", "variables": {...}}`.
- Criação de documento: `multipart/form-data` (envio de arquivo), seção 5.
- Resposta sempre `{ "data": ..., "errors": [...] }`; `errors` só aparece quando algo deu errado (seção 11). **Erro de GraphQL pode vir com HTTP 200**: sempre conferir `errors`.

## 3. Preços (página "API pricing")

Uso pela API segue o plano da conta; o valor do plano é um mínimo mensal e o que passar é cobrado à parte. Ações feitas no painel web não entram na conta da API. Plano Free: sem mensalidade, até 10 documentos por mês.

| Ação | US$ | R$ |
|---|---|---|
| Criar documento | 0,01 | 0,06 |
| Pedido de assinatura por e-mail | 0,002 | 0,013 |
| Pedido de assinatura por WhatsApp | 0,02 | 0,12 |
| Pedido de assinatura por SMS | 0,03 | 0,16 |
| Link, assinado via e-mail | 0,002 | 0,013 |
| Link, assinado via SMS | 0,03 | 0,16 |
| Link, assinado via WhatsApp | 0,02 | 0,12 |
| Validação extra de telefone | 0,03 | 0,16 |
| Consultar dados de documento (por documento retornado) | 0,0002 | 0,001 |
| Entrega de webhook (cada envio, inclusive falhos; reenvios não) | 0,00004 | 0,0002 |

- Custos somam: documento + cada signatário conforme o meio.
- Signatário por link escolhe como assinar; login Google, Microsoft ou Facebook é **grátis**.
- Reenviar pedido de assinatura (`resendSignatures`) é grátis.
- Verificações extras (biometria, documento com foto, SERPRO) gastam "créditos de verificação" à parte (preço no painel).
- Sandbox (`sandbox: true`): documento não é cobrado, não gera trilha de auditoria, não vale para verificar assinatura e é apagado "depois de alguns dias" (prazo não documentado). Sem limite de quantidade documentado.
- Uso atual da conta: https://painel.autentique.com.br/perfil/planos#api

## 4. Consultas (queries)

### Usuário dono da chave
```graphql
query {
  me {
    id name email phone cpf cnpj birthday
    subscription { has_premium_features documents credits }
    organization { id uuid name cnpj }
  }
}
```

### Um documento
```graphql
query {
  document(id: "ID_DO_DOCUMENTO") {
    id name refusable sortable created_at
    files { original signed pades }
    signatures {
      public_id name email created_at
      action { name }
      link { short_link }              # quando o signatário foi criado só com "name"
      user { id name email phone }
      user_data { name email phone }   # dados travados (configs.lock_user_data)
      email_events { sent opened delivered refused reason }
      viewed { ...evento }             # viu o documento
      signed { ...evento }             # assinou
      rejected { ...evento }           # recusou
      signed_unapproved { ...evento }  # assinou, biometria pendente de aprovação
      biometric_approved { ...evento }
      biometric_rejected { ...evento }
    }
  }
}
fragment evento on Event {
  ip port reason created_at
  geolocation { country countryISO state stateISO city zipcode latitude longitude }
}
```
Vários de uma vez, com apelidos (o apelido não pode ser só número):
```graphql
query {
  primeiro: document(id: "ID_1") { name }
  segundo: document(id: "ID_2") { name }
}
```

### Lista de documentos (paginada)
```graphql
query {
  documents(limit: 60, page: 1) {
    total
    data {
      id name created_at
      signatures { public_id name email action { name } link { short_link }
                   viewed { created_at } signed { created_at } rejected { created_at } }
      files { original signed }
    }
  }
}
```
- Sandbox **não** aparece por padrão: `showSandbox: true` inclui, `onlySandbox: true` traz só os de teste.
- Por pasta: `documentsByFolder(folder_id: "ID", limit: 60, page: 1) { data { id name qualified sandbox created_at deleted_at } has_more_pages }`.

### Organizações, pastas e modelos de e-mail
```graphql
query { organization { id name uuid cnpj } }      # a atual
query { organizations { id name uuid cnpj } }     # todas
query { emailTemplates(limit: 60, page: 1) { has_more_pages data { id name type email { text sender colors template } } } }
query ($limit: Int!, $page: Int!, $displayChildren: Boolean!, $search: String, $orderBy: OrderBy) {
  folders(limit: $limit, page: $page, display_children: $displayChildren, search: $search, orderBy: $orderBy) {
    data { id name path context children_counter is_editor created_at updated_at subfolders { id name path } }
    total current_page last_page has_more_pages
  }
}
# orderBy: { "field": "created_at", "direction": "DESC" }; filtro opcional "type" (FolderTypeEnum)
query ($id: UUID!) {
  folder(id: $id) { id name path context has_password parentFolder { id name } subfolders { id name }
                    shares { id role is_by_link user { id name email } group { id name } } }
}
```

## 5. Criar documento (`createDocument`)

Envio em `multipart/form-data` seguindo a especificação GraphQL multipart (https://github.com/jaydenseric/graphql-multipart-request-spec), com 3 campos:
- `operations`: JSON com `query` e `variables`, e `"file": null` dentro de `variables`;
- `map`: `{"file": ["variables.file"]}`;
- `file`: o arquivo (PDF, ou HTML/Markdown etc.).

Tamanho máximo: 5 MB no Free, 20 MB nos planos pagos (soma dos arquivos).

```graphql
mutation Criar($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
  createDocument(
    sandbox: true,          # TESTE: não gasta crédito. Tirar só em produção.
    document: $document,
    signers: $signers,
    file: $file
    # organization_id: 123   (opcional: cria em outra organização do usuário)
    # folder_id: "abc"       (opcional: já cria dentro de uma pasta)
  ) {
    id name sandbox refusable sortable created_at
    signatures { public_id name email created_at action { name } link { short_link } user { id name email } }
  }
}
```

### Como o signatário recebe (SignerInput)
| Campo informado | O que acontece |
|---|---|
| `email` | Recebe o pedido por e-mail. |
| `name` (sem email/telefone) | Nada é enviado; a resposta traz `link.short_link` para você mandar. |
| `phone` + `delivery_method: "DELIVERY_METHOD_WHATSAPP"` | Recebe por WhatsApp (telefone no formato `+5554999999999`). |
| `phone` + `delivery_method: "DELIVERY_METHOD_SMS"` | Recebe por SMS. |

`delivery_method` também aceita `DELIVERY_METHOD_EMAIL` e `DELIVERY_METHOD_LINK`.

### Papel do signatário (`action`)
`SIGN` (assinar), `SIGN_AS_A_WITNESS` (testemunha), `APPROVE` (aprovar), `RECOGNIZE` (reconhecer), `ACKNOWLEDGE_RECEIPT` (acusar recebimento), `ENDORSE_IN_BLACK` e `ENDORSE_IN_WHITE` (endossos).

### Outros campos do signatário
- `configs: { cpf: "12345678900" }`: só quem tem esse CPF pode assinar.
- `security_verifications`: verificações extras (seção 6).
- `positions`: onde a assinatura e outros campos aparecem no PDF (seção 7).

### Opções do documento (DocumentInput)
Alguns exigem plano Corporate; alguns gastam créditos de verificação.
```jsonc
{
  "name": "Contrato",                    // obrigatório
  "message": "Texto no e-mail ao signatário",
  "reminder": "WEEKLY",                  // ou "DAILY" (lembretes; liga refusable sozinho)
  "whatsapp_template": "STANDARD",       // ou FORMAL, CASUAL, DIRECT
  "sortable": true,                      // assinam na ordem da lista "signers"
  "footer": "BOTTOM",                    // ou LEFT, RIGHT (rodapé)
  "footer_type": "MINI",                 // ou STANDARD
  "refusable": true,                     // permite recusar
  "stop_on_rejected": true,              // recusou, ninguém mais assina (exige refusable)
  "qualified": true,                     // assinatura qualificada com certificado
  "scrolling_required": true,            // só assina depois de rolar o documento todo
  "new_signature_style": true,           // campos de assinatura novos
  "show_audit_page": false,              // sem página final de auditoria (exige new_signature_style)
  "ignore_cpf": true,                    // não pede CPF
  "ignore_birthdate": true,              // não pede data de nascimento
  "email_template_id": 1234,             // modelo de e-mail (query emailTemplates)
  "deadline_at": "2026-12-31T23:59:59.999Z", // depois disso não dá mais para assinar
  "watchers": ["juridico@exemplo.com"],  // acompanham sem assinar (plano Professional)
  "cc": [{ "email": "copia@exemplo.com" }], // recebem cópia quando todos assinarem
  "expiration": { "days_before": 7, "notify_at": "20/01/2027" }, // aviso antes do vencimento
  "configs": {
    "notification_finished": true,       // avisa todos quando o documento terminar
    "notification_signed": true,         // avisa o signatário quando ele assinar
    "notify_watchers": true,             // observadores recebem os eventos
    "signature_appearance": "ELETRONIC", // DRAW, HANDWRITING, ELETRONIC, IMAGE (a doc escreve ELETRONIC)
    "keep_metadata": true,               // mantém metadados do PDF (assinatura qualificada)
    "lock_user_data": true,              // guarda os dados do signatário da hora da assinatura
    "pdfa": true                         // mantém PDF/A se o arquivo já for PDF/A (não converte)
  },
  "locale": {
    "country": "BR",                     // ISO 3166; fora do BR: sem SMS, sem CPF, sem SERPRO
    "language": "pt-BR",                 // pt-BR, en-US, es-MX (só a interface; não traduz o arquivo)
    "timezone": "America/Sao_Paulo",     // fuso IANA
    "date_format": "DD_MM_YYYY"          // ou MM_DD_YYYY
  }
}
```

### Lembretes (`reminder`)
- `DAILY`: até 7 lembretes; `WEEKLY`: até 4. Param quando a pessoa assina ou recusa.
- Só signatário **por e-mail** recebe lembrete (telefone e link, não).
- Ligar `reminder` liga `refusable: true` sozinho (não dá para ter lembrete sem permitir recusa).
- `stop_on_rejected: true` com `refusable: false` é inválido.

### Vários arquivos num documento só
Troque `file: Upload!` por `files: [Upload!]` (um ou outro, nunca os dois). A ordem da lista é a ordem dos arquivos; o nome de cada um vem do nome do arquivo enviado. Máximo de arquivos: 2 (Free), 5 (Professional), 20 (Corporate). Campos extras na resposta: `batch_files { original signed certified pades }` (ZIPs) e `stored_files { id url md5 sha1 sha2 type position page_count pdfa display_name artifacts { signed certified pades } }`. No `map`, cada arquivo aponta para `variables.files.0`, `variables.files.1`...

### Assinar pelo WhatsApp sem sair da conversa (WhatsApp Flow)
Mande o arquivo em **Markdown (.md)** para signatário com `DELIVERY_METHOD_WHATSAPP`: o texto aparece dentro do WhatsApp e a pessoa assina ali. Markdown aceito: `#`, `##`, parágrafo, `**negrito**`, `*itálico*`, `~~riscado~~`, lista com `+` ou `1.` (sem subníveis), imagem em base64 e tabela. Sem o `.md`, a pessoa recebe um link comum. Markdown não pode ser combinado com outros arquivos (`invalid_file_combination`).

### Modelo de contrato
A API não usa os modelos do painel. Caminho indicado: ter um HTML modelo com marcadores (ex.: `$NomeRevendedora$`), trocar pelos valores no código e enviar o HTML no `createDocument`.

## 6. Verificações extras (`security_verifications`)

Lista no signatário. Gastam créditos de verificação.
| `type` | Como funciona |
|---|---|
| `SMS` | Código por SMS (`verify_phone` opcional, ex.: `+5554999999999`). |
| `MANUAL` | Documento com foto + selfie; alguém da organização aprova ou recusa (seção 9). |
| `UPLOAD` | Frente e verso do documento com foto. |
| `LIVE` | Documento com foto, selfie e prova de vida (vídeo), comparação automática. |
| `PF_FACIAL` | Selfie comparada pela SERPRO com a foto do governo ligada ao CPF. |
| `BIOMETRIC_AND_TEXT_EXTRACTION` | Foto do documento + selfie, comparação de semelhança. |
| `LIVENESS_AND_TEXT_EXTRACTION` | Prova de vida + foto do documento, dados extraídos e comparados. |

- Só uma por signatário entre `MANUAL`, `UPLOAD`, `LIVE` e `PF_FACIAL` (o `SMS` pode somar).
- Se a pessoa errar demais, `UPLOAD`, `LIVE`, `PF_FACIAL` e `BIOMETRIC_AND_TEXT_EXTRACTION` viram `MANUAL`. Para recusar o documento em vez disso: `"fallback_behavior": "DISABLE_FALLBACK"`.
- Sem crédito de verificação: erro `unavailable_verifications_credits`.

## 7. Posição da assinatura no PDF (`positions`)

```json
"positions": [
  { "x": "5.0", "y": "90.0", "z": 1, "angle": 0, "scale": 1.0, "element": "SIGNATURE" },
  { "x": "5.0", "y": "95.0", "z": 1, "element": "DATE" }
]
```
- `x` e `y`: porcentagem da largura/altura da página (0 a 100). `z`: número da página (começa em 1).
- Em vez de `z`: `pages: [1, 3]` ou `mode: "ALL"` / `"ALL_WITHOUT_LAST"`. Use exatamente um dos três.
- `angle` 0 a 360; `scale` 0,5 a 4,0 (padrão 1,0).
- `element`: `SIGNATURE`, `SQUARE_INITIALS` (rubrica), `NAME`, `DATE`, `CPF`; interativos (só com `z`, exigem `options`): `TEXT`, `CHECKBOX`, `RADIO_GROUP`, `INTERACTIVE_DATE`, `CNPJ`, `COMPANY`, `PHONE`. `INITIALS` e `RADIO` são antigos, não usar.
- Exemplos de `options`:
  - `CHECKBOX`: `{ "checkbox": { "required": true, "default_value": false } }`
  - `INTERACTIVE_DATE`: `{ "interactive_date": { "width": 95, "height": 18, "title": "Data", "required": true, "date_restriction": "ANY|UP_TO_TODAY|FROM_TODAY|CUSTOM", "min_date": "1900-01-01", "max_date": "2026-12-31", "display_format": "WRITTEN|NUMERIC" } }`
  - `TEXT`: `{ "text": { "width": 95, "height": 26, "title": "Observações", "required": true, "max_length": 200, "help_text": "...", "show_help_text": true, "default_value": "...", "typography": { "font_family": "ARIMO|LATO|NOTO_SANS|ROBOTO|SOURCE_SERIF_4|TINOS", "font_size": 16, "alignment": "LEFT|CENTER|RIGHT|JUSTIFY", "color": "#000000", "bold": true }, "validation_type": "NONE|CPF|CNPJ|CPF_OR_CNPJ|EMAIL|PHONE|CEP|UF|CUSTOM", "validation_regex": "...", "validation_error_message": "..." } }`
  - `CNPJ` / `COMPANY` / `PHONE`: `{ "company": { "width": 95, "height": 18, "required": true, "autofill": true } }` (troque a chave pelo nome do elemento).
- Para descobrir x/y: monte um documento de exemplo no painel e consulte `document(id) { signatures { public_id positions { element x y z } } }`.
- Sem `positions`, a pessoa assina normalmente na página da Autentique e nada é carimbado no PDF.

## 8. Mexer em documento já criado (mutations)

```graphql
# Editar (campos de UpdateDocumentInput: name, message, reminder, refusable, ignore_cpf, stop_on_rejected,
# scrolling_required, sortable, new_signature_style, show_audit_page, expiration, footer, cc, watchers, configs, deadline_at)
mutation ($id: UUID!, $document: UpdateDocumentInput!) {
  updateDocument(id: $id, document: $document) { id name deadline_at }
}

# Apagar. ATENÇÃO: se alguém já assinou, só vai para a lixeira de quem pediu e NÃO trava o documento.
# Para travar, use updateDocument com deadline_at = agora.
mutation { deleteDocument(id: "ID") }

# Adicionar signatário (mesmo SignerInput da criação; com DELIVERY_METHOD_LINK a resposta traz o link)
mutation ($document_id: UUID!, $signer: SignerInput) {
  createSigner(document_id: $document_id, signer: $signer) {
    public_id name email delivery_method action { name } link { id short_link } created_at
  }
}

# Remover signatário pendente
mutation { deleteSigner(public_id: "PUBLIC_ID", document_id: "ID") }

# Reenviar pedido (grátis). Todos reenviados há pouco = erro too_many_resent_emails; os que estão no limite são pulados.
mutation { resendSignatures(public_ids: ["PUBLIC_ID_1", "PUBLIC_ID_2"]) }

# Gerar link de assinatura para um signatário (link exclusivo dele, não compartilhar)
mutation { createLinkToSignature(public_id: "PUBLIC_ID") { short_link } }

# Assinar como DONO DA CHAVE (nunca em nome de outra pessoa). Ele precisa estar entre os signatários,
# senão erro signature_not_found. Retorna true.
mutation ($documentId: UUID!, $organizationId: Int) { signDocument(id: $documentId, organization_id: $organizationId) }

# Transferir para outra organização/grupo (opcionais: current_group_id, context USER|GROUP|ORGANIZATION)
mutation { transferDocument(id: "ID", organization_id: 123, group_id: 456) }
```

### Pastas
```graphql
mutation ($parentId: UUID, $folder: FolderInput!) { createFolder(parent_id: $parentId, folder: $folder) { id name type created_at } }
mutation ($id: UUID!, $folder: FolderInput!) { updateFolder(id: $id, folder: $folder) { id name } }   # renomear
mutation { deleteFolder(id: "ID") }   # documentos dentro ficam "sem pasta"
mutation { moveDocumentToFolder(document_id: "ID", folder_id: "PASTA") }
# já está em outra pasta: current_folder_id: "PASTA_ATUAL"; pasta de grupo/organização: context: GROUP | ORGANIZATION;
# tirar da pasta: folder_id: null
mutation ($folderId: String!, $shares: [ShareFolderInput], $emailMessage: String) {
  shareFolder(folder_id: $folderId, shares: $shares, email_message: $emailMessage) { id shares { id role } }
}
# shares: [{ "email": "x@y.com", "role": "VIEWER" }, { "group_id": "abc", "role": "EDITOR" }]
# updateSharing(folder_id, sharing_id, role, share_by_link, password, remove_password): muda permissão ou liga link com senha
```
Cada pasta pode ter no máximo 5 subpastas.

## 9. Biometria pendente (verificação `MANUAL`)

```graphql
mutation { approveBiometric(verification_id: 430555, public_id: "PUBLIC_ID") { public_id verifications { id type verified_at } } }
mutation { rejectBiometric(verification_id: 430555, public_id: "PUBLIC_ID") { public_id verifications { id type verified_at } } }
```
`verification_id` vem de `signatures { verifications { id type user { images confidence } } }`.

## 10. Webhooks (como saber que assinaram)

Cadastre a URL (HTTPS, POST) no painel de desenvolvedor da Autentique e escolha só os eventos necessários. Cada entrega custa R$ 0,0002.

Corpo (JSON):
```jsonc
{
  "id": "...", "object": "webhook", "name": "nome do endpoint", "format": "json", "url": "...",
  "event": {
    "id": "uuid do evento",          // guardar para ignorar repetidos
    "object": "event",
    "organization": 1,
    "type": "signature.accepted",
    "data": { ... },                 // o documento, a assinatura ou o membro (formato abaixo)
    "previous_attributes": { ... },  // nos *.updated: o que era antes
    "created_at": "..."
  }
}
```

Eventos:
| Evento | Quando |
|---|---|
| `document.created` | Documento criado. |
| `document.updated` | Documento alterado. |
| `document.deleted` | Documento apagado de vez. |
| `document.finished` | **Todos assinaram** (o mais útil). |
| `signature.created` | Pedido de assinatura criado para alguém. |
| `signature.updated` | Pedido alterado. |
| `signature.deleted` | Signatário pendente removido. |
| `signature.viewed` | Signatário abriu o documento pela 1ª vez. |
| `signature.accepted` | Signatário assinou. |
| `signature.rejected` | Signatário recusou. |
| `signature.biometric_unapproved` | Assinou, biometria esperando aprovação. |
| `signature.biometric_approved` / `signature.biometric_rejected` | Biometria aprovada / recusada. |
| `signature.biometric_reset` | Aprovação manual recusada com "pedir nova validação". |
| `signature.delivery_failed` | Falhou o envio do e-mail. |
| `member.created` / `member.deleted` | Membro entrou / saiu da organização. |

Campos úteis de `data` quando é documento: `id`, `name`, `sandbox`, `signatures_count`, `signed_count`, `rejected_count`, `files { original signed certified pades }`, `deadline_at`, `signatures[]` (cada uma com `public_id`, `user {name email cpf phone}`, `action`, `viewed`, `signed`, `rejected`, `reason`, `events[]`, `mail {sent opened refused delivered reason}`). Quando é assinatura: `public_id`, `document` (id do documento), `user`, `signed`, `rejected`, `events[]`.

Regras:
- **Responder 2xx na hora** e processar depois (fila), senão dá tempo esgotado.
- **Ordem não garantida**: criar um documento pode gerar `document.updated` antes de `document.created`. Se faltar algo, consultar a API.
- **Pode chegar repetido**: guardar `event.id` e ignorar os já tratados.
- **Conferir a assinatura HMAC**: cabeçalho `x-autentique-signature` = HMAC-SHA256 (hex) do corpo cru, com o segredo do endpoint. Em Node:
  ```js
  import crypto from 'node:crypto';
  function webhookValido(corpoCru, assinatura, segredo) {
    if (!assinatura) return false;
    const calc = crypto.createHmac('sha256', segredo).update(corpoCru).digest('hex');
    return calc.length === assinatura.length &&
      crypto.timingSafeEqual(Buffer.from(calc, 'hex'), Buffer.from(assinatura, 'hex'));
  }
  ```
  No Next.js (App Router), leia o corpo com `await request.text()` **antes** de fazer `JSON.parse`, para o HMAC bater.
- Rota de webhook sem proteção CSRF.
- Falhou a entrega: até 3 novas tentativas (60 s, 120 s e 300 s depois); depois fica na lista de falhas do painel por até 14 dias, com botão de reenviar.
- Existe o webhook antigo ("deprecated", formato `x-www-form-urlencoded` com `partes`/`documento`/`remetente`/`arquivo`): não dá mais para cadastrar; os já cadastrados continuam. Não usar.

## 11. Erros

- Consulta GraphQL mal escrita: `errors[].message` descrevendo (ex.: variável obrigatória nula).
- Validação: `message: "validation"` e detalhes em `extensions.validation`, ex. `{ "folder.name": ["must_be_at_least_characters:3"] }`.
- Lista de códigos:

| Código | Significado |
|---|---|
| `unauthorized` | Chave inválida ou sem acesso. |
| `document_not_found` / `folder_not_found` | Não existe. |
| `document_signed` | Documento já assinado. |
| `not_your_turn` | Ordem de assinatura (`sortable`) não chegou nele. |
| `signature_not_found` | `signDocument` com dono da chave fora dos signatários. |
| `unavailable_credits` | Acabaram os documentos do plano. |
| `unavailable_verifications_credits` | Acabaram os créditos de verificação. |
| `too_many_resent_emails` | Reenvio feito há pouco. |
| `field_required`, `must_be_a_string`, `must_be_an_array`, `not_a_valid_date`, `invalid_date`, `must_be_a_valid_email_address`, `format_is_invalid`, `may_not_be_greater_than` ({{max}}), `must_be_at_least` ({{min}}) | Campo inválido. |
| `must_be_a_file`, `must_be_a_valid_file` ({{extensions}}), `failed_to_upload`, `could_not_upload_file`, `file_sizes_exceeded`, `invalid_file_combination` | Problema no arquivo. |
| `without_permission` | Precisa ser administrador da organização. |
| `not_a_member_of_organization` | Não é da organização. |
| `sms_delivery_not_allowed_on_foreign_documents` | SMS em documento com `country` diferente de BR. |
| HTTP 429 `Too Many Attempts.` | Passou do limite por minuto. |

## 12. Exemplo em Node (servidor deste projeto)

Node 18+ já tem `fetch`, `FormData` e `Blob`, sem biblioteca.

```js
// src/server/autentique.js (exemplo; ainda não existe no projeto)
const URL_API = 'https://api.autentique.com.br/v2/graphql';

function cabecalho() {
  const chave = process.env.AUTENTIQUE_API_KEY;
  if (!chave) throw new Error('AUTENTIQUE_API_KEY ausente');
  return { Authorization: `Bearer ${chave}` };
}

async function lerResposta(res) {
  if (res.status === 429) throw new Error('Autentique: limite de pedidos por minuto');
  const json = await res.json();
  if (json.errors?.length) throw new Error('Autentique: ' + JSON.stringify(json.errors));
  return json.data;
}

export async function consultar(query, variables = {}) {
  const res = await fetch(URL_API, {
    method: 'POST',
    headers: { ...cabecalho(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  return lerResposta(res);
}

const CRIAR = `mutation ($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!, $sandbox: Boolean) {
  createDocument(sandbox: $sandbox, document: $document, signers: $signers, file: $file) {
    id name sandbox
    signatures { public_id name email action { name } link { short_link } }
  }
}`;

// arquivo: Buffer do PDF; signers: [{ name, action: 'SIGN' }] ou [{ email, action: 'SIGN' }]
export async function criarDocumento({ nome, signers, arquivo, nomeArquivo = 'contrato.pdf', sandbox = true }) {
  const form = new FormData();
  form.append('operations', JSON.stringify({
    query: CRIAR,
    variables: { document: { name: nome }, signers, file: null, sandbox },
  }));
  form.append('map', JSON.stringify({ file: ['variables.file'] }));
  form.append('file', new Blob([arquivo], { type: 'application/pdf' }), nomeArquivo);
  // Não definir Content-Type: o fetch monta o boundary do multipart.
  const res = await fetch(URL_API, { method: 'POST', headers: cabecalho(), body: form });
  const data = await lerResposta(res);
  return data.createDocument;
}
```

Teste rápido por `curl` (Git Bash), sandbox e sem envio de mensagem:
```bash
KEY=$(grep -E '^AUTENTIQUE_API_KEY=' .env | cut -d= -f2- | tr -d '"'"'"' \r')
OPS='{"query":"mutation ($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) { createDocument(sandbox: true, document: $document, signers: $signers, file: $file) { id name sandbox signatures { public_id name action { name } link { short_link } } } }","variables":{"document":{"name":"Teste"},"signers":[{"name":"Teste","action":"SIGN"}],"file":null}}'
curl -s -X POST https://api.autentique.com.br/v2/graphql -H "Authorization: Bearer $KEY" \
  --form-string "operations=$OPS" --form-string 'map={"file":["variables.file"]}' \
  -F "file=@teste.pdf;type=application/pdf"
```

## 13. Outras coisas que existem (não usadas aqui)

- **OAuth 2.0**: para um app agir em nome de outros usuários da Autentique. Não precisamos (usamos chave própria). Doc: https://docs.autentique.com.br/api/integration-basics/oauth2.md
- **MCP da Autentique**: conecta Claude/ChatGPT/Cursor direto na conta. Doc: https://docs.autentique.com.br/api/autentique-mcp.md
- **SDKs da comunidade**: Node `autentique-v2-nodejs`, PHP, Delphi, .NET (links na introdução). Não são oficiais; o exemplo da seção 12 dispensa.
- **Coleção Postman e Altair** com consultas prontas: https://altair.autentique.com.br
- Suporte: contato@autentique.com.br
