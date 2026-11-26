# Regras: DevMaster (ERP) e integrações com sistemas externos (vigentes em 25/11/2026)

Documento ÚNICO e vivo sobre como o Sorelly Admin conversa com a DevMaster, com o app Sorelly, com o Kommo e com os outros sistemas de fora.
Fontes: o código lido em 25/11/2026 (`src/server/`, `app/api/`, `src/apps/montagem/domain/`), os documentos de `docs/negocio/` e `docs/regras/`, as notas de memória e os históricos das conversas de 19/10 a 25/11/2026.
Este arquivo vai para o Git. Por isso não tem valores reais, nomes de pessoas nem chaves. Dados reais ficam em `docs/pendencias/devmaster-e-integracoes.local.md`.

Marcação:
- **[FEITO]** existe no código lido em 25/11/2026. Esta revisão leu o código. Ela não rodou o sistema e não chamou nenhuma API.
- **[A CONSTRUIR]** decidido, falta construir.
- **[A CONFIRMAR]** o dono não decidiu, ou a fonte não prova.

Regra de manutenção: mudou uma regra de integração? Mude este arquivo no mesmo dia. Onde documento e código divergem, este arquivo mostra os dois lados. A lista das divergências está na seção B do arquivo `.local`.

Aviso sobre a pasta lida: a leitura foi feita em `Downloads\sorelly-admin\sorelly-admin`, branch `alteracoes-27-10`. O arquivo `src/server/point-nf.js` e a rota `/api/point-nf` existem em `origin/master` e não existem nessa pasta. Ver 4.3. A pasta oficial é `C:\Sorelly\sorelly-admin` (cópia desta, de 25/11/2026). As duas estão 124 commits atrás da master: ver `docs/operacao/PASTA-LOCAL-X-MASTER-25-11.md`.

---

## 1. Princípios

| # | Regra | Estado |
|---|---|---|
| 1.1 | **A DevMaster é só leitura.** O Admin lê. O Admin nunca grava na DevMaster. Não existe nenhum POST para a DevMaster no código. | [FEITO] |
| 1.2 | **Os POST da API 2 gravam no ERP de verdade.** Chamar um POST é proibido sem a diretoria aprovar. A API 2 tem POST para: clientes (`dmaam`), endereços (`dmaku`), produtos (`dmaaa`), fotos (`dmaaa/fotos`), tabelas de preço (`dmaas`, `dmabj`), almoxarifados (`dmaae`), grupos e classes (`dmaad`, `dmaai`) e atividades (`dmaik`). | [FEITO] (nenhum é usado) |
| 1.3 | **O Admin sabe antes. A DevMaster registra depois.** Quando a DevMaster registra, o Admin cruza e não duplica. Os dois viram um só. | [FEITO em parte] ver seção 5 |
| 1.4 | **Pago no Admin conta como pago**, mesmo sem baixa na DevMaster. A tela mostra o estado na DevMaster (pendente ou confirmado). | [FEITO em Contas a pagar e no Resumo] |
| 1.5 | **Erro da DevMaster se corrige na DevMaster.** O sistema só avisa. A equipe do financeiro corrige lá. | [FEITO] tela Arrumar na DevMaster |
| 1.6 | **Chaves só no `.env.local` do servidor** (e nas variáveis da hospedagem). Nunca na tela, nunca no Git. A tela chama o servidor do Admin. O servidor chama o sistema de fora. | [FEITO] |
| 1.7 | **Verificação de certificado sempre ligada.** Nunca usar `rejectUnauthorized:false`. Ver armadilha 6.6. | [FEITO] |
| 1.8 | **App Sorelly e Kommo: leitura por padrão.** Gravar só com uma chave de ligar e desligar no servidor (ver 2.3 e 2.4). | [FEITO] com divergência, ver 2.3 |
| 1.9 | **Na dúvida, o cruzamento não casa.** Sem par certo, nada muda e a conta continua visível. | [FEITO] |

Fluxo geral:

```
TELA (navegador)
   │  chama só o servidor do Admin (app/api/*)
   ▼
SERVIDOR DO ADMIN (src/server/*)  ── guarda cópias e caches no banco do Admin (sorelly.*)
   │
   ├─► DevMaster API 1   lista de revendedoras           (só GET)
   ├─► DevMaster API 2   qualquer tabela, fotos          (só GET)
   ├─► App Sorelly       admin, revendedoras, representantes (GET; gravação com chave)
   ├─► Kommo             funil de cadastro               (GET; gravação com chave)
   └─► Outros            IA, arquivos, banco do admin antigo

APP DA REPRESENTANTE (backend do app) ──► chama o Admin em /api/consignado/ingest/* e /api/listagens/app/*
```

---

## 2. Os sistemas de fora

### 2.1 DevMaster API 1 (rotas próprias da Sorelly) [FEITO]

| Item | Regra |
|---|---|
| Variáveis | `DEVMASTER_API_URL` e `DEVMASTER_API_KEY` |
| Autenticação | Cabeçalho `token` com a chave. O ERP ignora `Bearer` e `x-api-key`. |
| O que lê | Só `GET /appsorelly/revendedoras`: código, nome, CPF ou CNPJ, e-mail, celular, município, UF, vendedor e nome fantasia. A lista inteira vem de uma vez. |
| Arquivo | `src/server/devmaster.js` |
| Rotas do Admin | `/api/devmaster/revendedoras`, `/api/devmaster/vendedores`, `/api/devmaster/sincronizar-internas` (esta grava no banco do Admin, tabela `atendimento_revendedora`; não grava na DevMaster) |
| Cache | 10 minutos, na memória do servidor |
| Tempo limite | 30 segundos |
| Armadilha | Este arquivo usa `fetch` comum. Ele não usa o agente de certificados do sistema. No computador com antivírus que troca o certificado, a chamada pode falhar. [A CONFIRMAR] |
| Spec | Não existe documento desta API. |

### 2.2 DevMaster API 2 (API genérica) [FEITO]

| Item | Regra |
|---|---|
| Variáveis | `DEVMASTER_API_URL_V2` e `DEVMASTER_API_KEY_V2` |
| Autenticação | Token JWT no cabeçalho `Token`. O token traz a lista das tabelas liberadas (campo `tabelas`). Tabela fora da lista dá `403`. Relatório precisa de `rel:` + nome na mesma lista. |
| Spec | `docs/devmaster/openapi.yaml` (v2.12.0). Não ler inteiro: Grep pela rota. |
| O que lê | `GET /{codigo}` lê qualquer tabela. `GET /{codigo}/fotos` traz fotos em base64. `GET /relatorios/{nome}` gera relatório (nenhum relatório é usado no código hoje). |
| Como pede | O GET leva um **corpo JSON**: `pagina`, `registros`, `campos`, `ordem`, `filtro`, `empresa`, `filial`. O `fetch` do Node não deixa mandar corpo em GET. Por isso o código usa `node:https`. |
| Filtros | Igualdade ou operadores: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `between`, `in`, `notin`, `like`, `notlike`, `nulo`. Vários campos = "e". Data no formato `AAAA-MM-DD`. |
| Arquivo | `src/server/devmaster2.js`: `consultarTabela`, `todasAsPaginas`, `fotoDoProduto`, `liberadoNoToken`, `revendedorasComKitAtivo` |
| Rotas do Admin | `/api/devmaster2` (mostra as tabelas liberadas e a validade do token; só diretoria) e `/api/devmaster2/[codigo]` (lê uma tabela; só diretoria) |
| Dicionário | `dmzag` lista as tabelas. `dmzae` lista os campos. |

Limites e armadilhas da API 2:

| Limite | Regra |
|---|---|
| Página | O código pede no máximo 500 registros por página. O padrão da API é 50. |
| Campos | No máximo 80 campos por pedido (trava do código). |
| Páginas | `todasAsPaginas` para na página 60. São 30.500 linhas. Tabela maior é cortada **sem aviso**. Quem precisa de tudo passa um limite maior (produtos usam 400 páginas). Ver armadilha 6.5. |
| Tempo limite | 30 segundos por chamada |
| Filial | A API filtra pela filial ativa da integração. As chaves `empresa` e `filial` escolhem outra. Os históricos dizem que a filial ativa é a 01 e que existe a filial 02 com vendas. O código de vendas não manda `filial`. [A CONFIRMAR se alguma leitura fica incompleta por isso] |
| `like` | Diferencia maiúscula de minúscula. A DevMaster guarda nomes em MAIÚSCULAS e sem acento na busca. |
| Certificado | O servidor da DevMaster manda o certificado sem o intermediário. O Node recusa. O código soma as autoridades do sistema operacional. Em servidor Linux isso não resolve: a DevMaster precisa mandar a cadeia completa, ou o intermediário vai em `NODE_EXTRA_CA_CERTS`. [A CONFIRMAR como está na hospedagem] |
| Código de tabela | O código só aceita o formato `letras + até 3 números` (ex.: `dmaam`, `dmaam01`). |
| Senhas | Campo de senha sempre volta `null`. |

### 2.3 API do app Sorelly (backend do app da revendedora e da representante)

| Item | Regra |
|---|---|
| Variáveis | `MOBILE_API_URL` (já termina em `/api`) e `MOBILE_API_KEY` (é o `ADMIN_SECRET` do backend do app) |
| Autenticação | `Authorization: Bearer <chave>` |
| Cabeçalho fixo | `X-App-Version: 3.5.0` em toda chamada |
| Guia | `docs/app-sorelly/API-LEITURA.md` (ler as seções 0 a 8; depois Grep pela rota). Integração da representante: `docs/app-sorelly/INTEGRACAO-APP-REPRESENTANTE.md` |
| O que a chave lê | `/admin/*`, `/revendedoras/*` e `/representantes/*` com `?representativeCod=` |
| O que a chave não lê | Rotas da revendedora logada (`/sales`, `/clients`, `/auth/*`...): dão `401`. `/representantes/movimentos` e `/listagens` só aceitam sessão de representante (`403`). |

O que o Admin lê do app hoje [FEITO]:

| Dado | Rota do app | Arquivo do Admin |
|---|---|---|
| Painel das representantes (cadastro e resumo da carteira) | `/admin/representantes`, `/representantes/home-summary` | `src/server/representantes-app.js` |
| Venda do app por revendedora da carteira | `/representantes/home-snapshots` | `app/api/representante/revendedoras/route.js` |
| "Vendido no ciclo" de uma revendedora | `/representantes/revendedoras/:id` (campo `snapshot.totalSales`) | `src/server/encomendas-ranking.js` |
| Lista de usuários do app | `/admin/resellers/ranking` | `src/server/encomendas-ranking.js` |
| Histórico mensal de uma revendedora | `/admin/resellers/:id/monthly-history` | `src/server/encomendas-vendas.js` |
| Uso do app (pedidos lançados) | `/admin/resellers/:id?period=all` | `src/server/pos-vendas.js` |
| Preferências do kit | `/revendedoras/kit-preferences` e `/:id` | `src/server/preferencias-app.js` |
| Indicações, resgates, moedas, prêmios | `/admin/indicacoes/*` | `src/server/indicacoes.js`, `src/server/modelos-indicacoes.js` |
| Kits novos: respostas | `/admin/kits-novos/respostas` | `src/server/app-rep/sincronizar.js` |

O que o Admin **grava** no app (existe no código, com chave de ligar):

| Gravação | Rota do app | Chave que liga | Arquivo |
|---|---|---|---|
| Mandar ou tirar kit novo do app da representante | `PUT` e `DELETE /admin/kits-novos/:id` | `APP_REP_SINCRONIZAR=1` | `src/server/app-rep/sincronizar.js` |
| Aviso "kit pronto" no celular | `POST /admin/listagens/avisos` | `APP_REP_SINCRONIZAR=1` | idem |
| Avançar indicação, criar indicação, resgate, moedas | `PATCH` e `POST /admin/indicacoes/*` | `INDICACOES_GRAVAR=1` | `src/server/indicacoes.js` |

**Divergência registrada (não escolher lado):**
- O `CLAUDE.md` do projeto diz: "Só chamar GET; POST/PUT/PATCH/DELETE gravam no app de verdade".
- O código grava no app quando a chave está ligada (tabela acima), desde 05/11 e 19/11/2026.
- [A CONFIRMAR] com a diretoria se a regra escrita muda para "gravar só com a chave ligada".

O caminho contrário também existe: o backend do app chama o Admin. Rotas `/api/consignado/ingest/*` e `/api/listagens/app/*`. A autenticação é o cabeçalho `x-ingest-key`, igual a `CONSIGNADO_INGEST_KEY`. Arquivo: `src/server/servico.js`. [FEITO]

Armadilhas do app:
- Lista vazia não prova que não há dados. Várias rotas devolvem vazio quando a DevMaster ou outro serviço falha.
- Dinheiro vem como texto (`"129.90"`). Converter.
- Alguns GET gravam no app: `GET /admin/indicacoes/revendedoras/:id/premios` registra moedas vencidas (o Admin chama esta rota). `POST /auth/verify` cria sessão e mexe no cadastro: não usar sem aprovação.
- O campo "última vez vista" não mede uso. Ver armadilha 6.17.
- O app não guarda o código da DevMaster em todo lugar. A ligação é por telefone (8 últimos números) ou nome inteiro. Sem par único, o valor fica vazio. Nunca chutar.
- O `.env` de desenvolvimento aponta para o app de **produção**. Ver armadilha 6.20.

### 2.4 Kommo (CRM)

| Item | Regra |
|---|---|
| Variáveis | `KOMMO_API_URL`, `KOMMO_ACCESS_TOKEN`. Existe `KOMMO_WEBHOOK_SECRET` no modelo de variáveis, mas nenhum código usa. [A CONSTRUIR o webhook] |
| Autenticação | `Authorization: Bearer <token>` |
| O que lê | Funil "Cadastro": nome de cada etapa e quantidade de leads por etapa. Sem dados de pessoa. Até 10.000 leads (40 páginas de 250). |
| Arquivo e rota | `src/server/kommo.js`, `/api/kommo/cadastro` (só diretoria) |
| Cache | 5 minutos |
| Gravação | A indicação manual cria um lead no Kommo. Só com `INDICACOES_KOMMO_GRAVAR=1`. Arquivo `src/server/indicacoes.js`. |
| Armadilhas | O token tem permissão de escrita; o combinado é só leitura. O endereço que funciona é o da conta (variável `KOMMO_API_URL`); o endereço que vem dentro do token dá `401`. O id do funil está fixo no código. |

**Divergência registrada:** a decisão de 17/11/2026 foi "nunca gravar no Kommo" para a leitura do funil. O código de indicações (19/11/2026) grava um lead quando a chave está ligada. [A CONFIRMAR]

### 2.5 Outros sistemas de fora

| Sistema | Variável | Uso | Arquivo |
|---|---|---|---|
| IA (leitura de fotos de peças) | `ANTHROPIC_API_KEY` | Encomendas, Separar peças | `src/server/separar-pecas.js` |
| Armazenamento de arquivos da hospedagem | `BLOB_READ_WRITE_TOKEN` | Envio de criativos do Marketing | `app/api/criativos/upload/route.js` |
| Banco do admin antigo | `ADMIN_ANTIGO_DATABASE_URL` | Cópia do balcão de indicações, do antigo para o novo, a cada 2 minutos | `src/server/indicacoes.js` |
| Agendador da hospedagem | `CRON_SECRET` | Autoriza as rotas `/api/automatico/*` | ver seção 7 |
| Links de pagamento (e-SiTef) | não há | Nenhuma chamada automática no código lido | [A CONFIRMAR] |

---

## 3. Dicionário das tabelas da DevMaster

Como ler: "Lida em" = arquivo do Admin que consulta a tabela. Só entram campos que aparecem no código. O resto está marcado.

### 3.1 Tabelas lidas pelo código (20)

**Cadastros**

| Código | O que é | Campos que o código usa | Lida em |
|---|---|---|---|
| `dmaam` | Clientes (cada revendedora é um cliente) | `aam_codigo`, `aam_nome`, `aam_fantasia`, `aam_cpfcnpj`, `aam_grupo`, `aam_situacao`, `aam_municipio` (é código), `aam_estado`, `aam_bairro`, `aam_cep`, `aam_endereco`, `aam_numero`, `aam_complemento`, `aam_celular`, `aam_whatsapp`, `aam_telefone1`, `aam_email`, `aam_instagram`, `aam_nascimento`, `aam_datacadastro`, `aam_xenviaapp`, `aam_pessoa` | `revendedoras.js`, `devmaster2.js`, `contas-receber.js`, `faturamento.js`, `faturamento-nf.js`, `funcionarias.js`, `arrumar-devmaster.js`, `encomendas-ranking.js`, rotas `clientes-busca`, `kits-atrasados`, `representante/condicionais` |
| `dmaao` | Vendedores (representantes e marcas internas) | `aao_codigo`, `aao_nome` | `revendedoras.js`, `contas-receber.js` |
| `dmaal` | Municípios | `aal_codigo`, `aal_descricao`, `aal_estado` | `revendedoras.js` |
| `dmaat` | Fornecedores | `aat_codigo`, `aat_nome` | `contas-dm.js` |
| `dmaan` | Naturezas financeiras (plano de contas) | `aan_codigo`, `aan_descricao` | `contas-dm.js` |
| `dmaap` | Bancos, contas e caixas | `aap_codigo`, `aap_agencia`, `aap_conta`, `aap_nome`, `aap_situacao`, `aap_tipo`, `aap_cpfcnpjtitular` | `contas-dm.js`, `cadastro-fin.js`, `atividades-fin.js` |
| `dmacd` | Formas de pagamento do PDV (tipos de numerário) | `acd_codigo`, `acd_descricao`, `acd_operacao`, `acd_formapgto`, `acd_status`, `acd_pdvvisivel`, `acd_pdvordem`, `acd_banco`, `acd_agencia`, `acd_conta` | `contas-receber.js`, `faturamento-nf.js`, `cadastro-fin.js` |
| `dmzzx` | Usuários da DevMaster | `zzx_codigo`, `zzx_nome` | `atividades-fin.js` |

**Produtos e estoque**

| Código | O que é | Campos que o código usa | Lida em |
|---|---|---|---|
| `dmaaa` | Produtos (peças) | `dm_id`, `aaa_codigo`, `aaa_descricao`, `aaa_grupo`, `aaa_codbarras`, `aaa_datacadastro`, `aaa_foto`, `aaa_precobase`, `aaa_precovenda`, `aaa_custocompra`, `aaa_custobrt`, `aaa_custobanho`, `aaa_custoembalagem`, `aaa_custoetiquetas`, `aaa_custotag` | `fotos-dm.js`, `produtos-dm.js`, `reposicao.js`, `separar-pecas.js`, `devmaster2.js` (fotos), rotas `representante/condicionais` e `representante/peca` |
| `dmabq` | Saldo em estoque por almoxarifado | `abq_produto`, `abq_almox` (`01` = principal), `abq_saldoatual` | `reposicao.js` |

**Kits (condicionais) e agenda**

| Código | O que é | Campos que o código usa | Lida em |
|---|---|---|---|
| `dmafi` | Condicionais. O kit consignado é a condicional. | `afi_codigo`, `afi_cliente`, `afi_vendedor`, `afi_data` (emissão), `afi_prevdevol` (devolução prevista), `afi_status`, `afi_xreposicao`, `afi_qtditens`, `afi_valormerc`, `afi_valorsaldo`, `afi_valorvendido`, `afi_valorretornado`, `afi_dtfechamento`, `afi_dataacerto`, `afi_codagendamento`, `afi_obs` | `revendedoras.js`, `devmaster2.js`, `acertos-previstos.js`, `estoque-dia.js`, rotas `condicionais-kits`, `kits-atrasados`, `expositores/revendedoras`, `representante/condicionais`, `representante/peca` |
| `dmafj` | Itens da condicional (peças de cada kit) | `afj_condicional`, `afj_produto`, `afj_descricao`, `afj_quantidade`, `afj_valorun`, `afj_qtdvendido`, `afj_qtdretorno` | `revendedoras.js`, rotas `representante/condicionais` e `representante/peca` |
| `dmaik` | Atividades da agenda | `aik_cliente`, `aik_dataagendada`, `aik_situacao`, `aik_assunto` | `revendedoras.js` (agenda) |

**Vendas e notas**

| Código | O que é | Campos que o código usa | Lida em |
|---|---|---|---|
| `dmach` | Vendas do PDV (cada acerto fechado) | `ach_codigo`, `ach_cliente`, `ach_emissao`, `ach_datafat` (faturamento), `ach_situacao`, `ach_datacanc`, `ach_vendedor`, `ach_valormerc` (valor de venda), `ach_valordesc` (comissão), `ach_valoracres`, `ach_valortotal` (valor do acerto), `ach_tipopag` | `revendedoras.js`, `vendas-brinde.js`, `custo-saida.js`, `reposicao.js`, `encomendas-vendas.js`, `venda-revendedora.js`, `contas-receber.js`, rota `expositores/revendedoras` |
| `dmaci` | Itens da venda | `aci_venda` (liga ao acerto), `aci_produto`, `aci_descricao`, `aci_tes`, `aci_quantidade`, `aci_custoprod`, `aci_valortotal`, `aci_cancelado` | `vendas-brinde.js`, `custo-saida.js`, `reposicao.js`, `encomendas-vendas.js` |
| `dmabl` | Notas fiscais de saída | `abl_emissao`, `abl_nfeautorizada`, `abl_tespadrao`, `abl_cliente`, `abl_valortotal` | `faturamento.js` (regra abandonada, ver 6.12) |

**Financeiro**

| Código | O que é | Campos que o código usa | Lida em |
|---|---|---|---|
| `dmabe` | Contas a pagar (títulos) | `abe_prefixo`, `abe_numero`, `abe_parcela`, `abe_fornecedor`, `abe_emissao`, `abe_vencimento`, `abe_valor`, `abe_valorreais`, `abe_saldo`, `abe_natureza`, `abe_filialorigem`, `abe_situacao`, `abe_historico` | `contas-dm.js`, `arrumar-devmaster.js`, `atividades-fin.js`; em `origin/master` também `point-nf.js` |
| `dmabf` | Movimentos bancários (baixas de pagar e de receber, estornos, transferências) | `abf_tipo`, `abf_tpcontaorigem`, `abf_tipodoc`, `abf_banco`, `abf_agencia`, `abf_conta`, `abf_datapgto`, `abf_datadebito`, `abf_data` (quando foi gerado), `abf_valor`, `abf_valorreais`, `abf_estornado`, `abf_natureza`, `abf_tpclifor`, `abf_clifor`, `abf_prefixo`, `abf_numero`, `abf_parcela`, `abf_usumov` | `contas-dm.js`, `contas-receber.js`, `atividades-fin.js` |
| `dmabg` | Contas a receber (títulos; cada pagamento de um acerto é um título) | `abg_cliente`, `abg_tipodoc` (forma, liga ao `dmacd`), `abg_valor`, `abg_saldo`, `abg_emissao`, `abg_vencimento`, `abg_vendedor`, `abg_codorigem2` (número do orçamento da venda), `abg_prefixo`, `abg_numero`, `abg_parcela`, `abg_banco`, `abg_agencia`, `abg_conta` | `contas-receber.js`, `faturamento-nf.js`, `cadastro-fin.js`, `cruzamento-pix.js` (por meio de `contas-receber.js`) |
| `dmajt` | Extrato bancário importado (conciliação) | `ajt_banco`, `ajt_conta`, `ajt_data`, `ajt_conciliado` | `atividades-fin.js` |

### 3.2 Situações e códigos

| Tabela e campo | Valor | Significa | Fonte |
|---|---|---|---|
| `dmafi.afi_status` | `A` | Condicional aberta (kit com a revendedora) | código |
| | `F` | Fechada | código |
| | `R`, `J` | Resíduo e jurídico (só na rota `representante/peca`) | código; [A CONFIRMAR] |
| `dmafi.afi_xreposicao` | `S` | Condicional de reposição | código |
| `dmafi.afi_prevdevol` | ano 2100 ou mais (na prática ano 3000) | Expositor: sem data de devolução | código |
| `dmafi.afi_vendedor` | `04` | Expositor (não é representante) | código |
| | `91` | Encomendas (não é representante) | código |
| | `02`, `FE`, `BY` | Vendedores da própria Sorelly (atendimento interno) | código |
| | `DE` | Inadimplência | rotas `kits-atrasados` e `expositores` |
| `dmach.ach_vendedor` | `EK` | Leilão: fica fora da média de vendas | `vendas-brinde.js` |
| `dmach.ach_situacao` | `F` | Venda fechada | código |
| `dmach.ach_datacanc` | preenchido | Venda cancelada. Vazio pode vir como data `0001`, `1899` ou `1900`. | `custo-saida.js` |
| `dmaci.aci_cancelado` | `S` | Item cancelado | código |
| `dmaam.aam_situacao` | `A`, `B`, `I` | Ativa, bloqueada, inativa | código |
| `dmaam.aam_grupo` | `0002` | Grupo "Funcionários" do cadastro (dicionário `dmalv`) | código |
| `dmaam.aam_pessoa` | `J` | Pessoa jurídica (sem data de nascimento) | código |
| `dmaam.aam_xenviaapp` | `S` | Usa o app | código |
| `dmabe.abe_situacao` | `A` | Título aberto | código |
| | `P` | Parcialmente pago (saldo menor que o valor) | código |
| | `B` | Baixado | `arrumar-devmaster.js` |
| | `R` | Resíduo. O código de Contas a pagar não lê. | auditoria de 21/11; [A CONFIRMAR] |
| `dmabf.abf_tipo` | `S`, `E` | Saída, entrada | código |
| `dmabf.abf_tpcontaorigem` | `P`, `R` | Origem em contas a pagar, origem em contas a receber | código (`P`); históricos (`R`) |
| `dmabf.abf_estornado` | `S` | Movimento estornado: não conta | código |
| `dmabf.abf_tpclifor` | `F` | O código em `abf_clifor` é de fornecedor | código |
| `dmabf.abf_tipodoc` | `REC`, `PAG` | Baixa de recebimento, baixa de pagamento | `atividades-fin.js` |
| | `ESS`, `ESE` | Estorno de pagamento, estorno de recebimento | idem |
| | `SAN`, `SUP` | Transferência: saída e entrada (maquininha para a conta do mesmo CNPJ) | idem |
| | `DEP`, `SAQ`, `CHD`, `CRN` | Depósito, saque, cheque devolvido, cheque renegociado | idem |
| `dmabg.abg_tipodoc` | `ACE`, `ACI` | "Acerto - loja" e "Acerto - loja interno": **a revendedora não pagou**. O código reconhece pelo nome da forma começar com "ACERTO". | código |
| `dmabg.abg_cliente` | `000000` | Cliente genérico: ignorado | código |
| `dmabg.abg_situacao` | `A`, `B`, `P`, `N` | Citado nos históricos. O código não usa: usa o saldo. | [A CONFIRMAR] |
| `dmacd.acd_status` | `I` | Forma inativa | `cadastro-fin.js` |
| `dmacd.acd_pdvvisivel` | `S` | Forma aparece no PDV | idem |
| `dmaap.aap_situacao` | `I` | Banco inativo | idem |
| `dmaik.aik_situacao` | `P` | Atividade pendente | `revendedoras.js` |
| `dmaik.aik_assunto` | `ACERTOS` | Atividade de acerto | idem |
| `dmajt.ajt_conciliado` | `S` | Linha do extrato já conciliada | `atividades-fin.js` |

Tipos de saída (TES) nos itens da venda (`aci_tes`) e nas notas (`abl_tespadrao`):

| TES | Categoria | Regra |
|---|---|---|
| `S001`, `S002` | Venda | Venda em qualquer época |
| `S501`, `S502` | Venda | Só até 28/02/2026. Depois disso viram "outros". |
| `S009`, `S503` | Brinde e prêmio | Sai da venda sem brinde |
| `S006`, `S504` | Troca (remessa para troca) | Sai |
| `S007`, `S505` | Indicação | Sai |
| `S011` | Premiação por meta | Sai |
| qualquer outro | Outros (industrialização, conserto, roubo, transferência) | Sai |

Venda sem brinde = valor de venda da DevMaster − brinde − troca − indicação − premiação − outros. Arquivo: `src/server/vendas-brinde.js`. Nomes dos TES: dicionário `dmabc` (citado, não lido). [FEITO]

Filial e CNPJ (`abe_filialorigem`):

| Filial | CNPJ no Admin |
|---|---|
| `01` | 34 (Sorelly) |
| `02` | 46 (Mayz) |
| `03` | 59 (Serenity) |
| `04` | "por fora" (empresa fora dos 4 CNPJs) |
| `05` | 67 (Axis) |

Prefixos de título e naturezas:
- Prefixos vistos: `BAN`, `CCI`, `EMP`, `SAL`, `VAL`, `IMP`, `CHE`, `DEM`, `INT`, `TAR`, `CMS`, `KM`, `ADM`. A interpretação de cada um está [A CONFIRMAR]. Exemplo de dúvida: um documento diz "BAN = boleto"; os títulos de Pix do banho também usam `BAN`.
- `CCI` quer dizer duas coisas. Como **prefixo** de contas a pagar é o título do cartão de crédito (dinheiro sai). Como **numerário** é uma forma de recebimento em maquininha (dinheiro entra). Nunca decidir pelo nome.
- Natureza `5.04.01.02` = Pix do banho da Pontual. Naturezas `11.xx` = empresa de aplicativos (bloco H&O). Naturezas `3.06` = sistemas. Naturezas `3.23` = tráfego pago. Fonte: `domain/contas-empresa.js`. O resto do plano de contas está [A CONFIRMAR].

### 3.3 Tabelas citadas e não lidas pelo código

| Código | O que é (segundo a fonte) | Fonte | Estado |
|---|---|---|---|
| `dmzag`, `dmzae` | Dicionário: tabelas e campos | spec | disponível |
| `dmzzz` | Empresas e filiais | spec, alinhamentos de 28/10 | não lida |
| `dmalv` | Grupos de cliente (onde está o grupo `0002`) | comentário do código | não lida |
| `dmaad` | Grupos de produto | `domain/falta-comprar.js` | não lida (o grupo vem de `aaa_grupo`) |
| `dmabc` | Tipos de saída (TES) | comentário do código | não lida |
| `dmabh` | Pedidos de venda | spec | não lida |
| `dmzbl` | Registro de ações dos usuários | histórico de 21/11 | não lida no código (é lenta) |
| `dmaay`, `dmaba` | Nota fiscal de entrada | histórico (Cadastro de peças) | [A CONFIRMAR] |
| `dmahp` | Naturezas financeiras, segundo uma lista de 28/10 | histórico | **diverge**: o código lê os nomes das naturezas em `dmaan`. [A CONFIRMAR] |
| `dmalr`, `dmalq` | Rateio por natureza (pagar e receber) | histórico de 28/10 | não lida |
| `dmabu`, `dmahm` | Motivos de baixa e históricos | histórico de 28/10 | não lida |
| `dmaqb`, `dmapj` | Movimentos de DRE e taxas financeiras | histórico de 28/10 | não lida |
| `dmaku`, `dmaas`, `dmabj`, `dmaae`, `dmaai` | Endereços, tabelas de preço, almoxarifados, classes | spec (só POST) | proibido gravar |

---

## 4. Mapa: dado → de onde vem → servidor → rota → tela

### 4.1 Revendedoras, kits e acertos

| Dado | Tabelas | Arquivo do servidor | Rota `app/api` | Tela (pelo menu) | Estado |
|---|---|---|---|---|---|
| Lista de revendedoras (base de todos os setores) | `dmafi`, `dmaam`, `dmaal`, `dmaao`, `dmafj`, `dmach` | `revendedoras.js` (`listaRevendedoras`) | `/api/revendedoras` | Revendedoras; app da representante; Metas; Garantia | [FEITO] |
| Ficha de uma revendedora (cadastro, condicionais, histórico, vendas) | `dmaam`, `dmafi`, `dmach` | `revendedoras.js` (`fichaRevendedora`) | `/api/revendedoras/[cod]` | Revendedoras › ficha; Atendimento interno | [FEITO] |
| Total de revendedoras do dia | `dmafi` | `revendedoras-dia.js` (módulo `revdia`) | `/api/revendedoras/dia`, `/api/automatico/dia` | Visão geral; Faturamento | [FEITO] |
| Revendedoras com kit ativo (contagem simples) | `dmafi`, `dmaam` | `devmaster2.js` | `/api/devmaster2/revendedoras-com-kit-ativo` | uso interno | [FEITO] |
| Acertos previstos por mês e ciclo 30/45/60 | `dmafi` (`afi_prevdevol`) | `acertos-previstos.js` | `/api/acertos-previstos` | Resultado do mês; bloco de acertos restantes | [FEITO] |
| Agenda do Agendamento | `dmafi`, `dmaik`, `dmaam` | `revendedoras.js` (`listaAgenda`) | `/api/agenda-revendedoras` | Agendamento › Revendedoras | [FEITO] |
| Acertos realizados (vendas fechadas) e venda sem brinde | `dmach`, `dmaci` | `vendas-brinde.js` (tabela `sorelly.venda_composicao`) | dentro de `/api/revendedoras` | Revendedoras; Metas; Ranking; Top 100 | [FEITO] só 2026 |
| Condicionais abertas de várias revendedoras | `dmafi` | rota direta | `/api/condicionais-kits` | Montagem e Bipagem (valor do kit) | [FEITO] |
| Peças de cada condicional (conferência) | `dmafi`, `dmafj`, `dmaaa`, `dmaam` | rota direta | `/api/representante/condicionais`, `/api/representante/peca` | App da representante (conferência e devolução) | [FEITO] |
| Kits abertos há mais de N dias | `dmafi`, `dmaam` | rota direta | `/api/kits-atrasados` | nenhuma tela chama | [A CONFIRMAR] |
| Expositores em campo | `dmafi`, `dmafj`, `dmach` | rota direta | `/api/expositores/revendedoras` | Expositores › Entregas e Sem kit | [FEITO] |
| Busca de cliente por nome ou código | `dmaam` | rota direta | `/api/clientes-busca` | Atendimento interno › Incluir cliente | [FEITO] |
| Revendedoras internas (lista da API 1) | API 1 | `devmaster.js` | `/api/devmaster/revendedoras` | Atendimento interno | [FEITO] |

### 4.2 Financeiro

| Dado | Tabelas | Arquivo do servidor | Rota `app/api` | Tela (pelo menu) | Estado |
|---|---|---|---|---|---|
| Contas a pagar (títulos abertos) | `dmabe` (`A` e `P` com saldo), `dmaat`, `dmaan` | `contas-dm.js` | `/api/contas-dm` | Financeiro › Contas › A pagar; Salário (RH); Resultado do mês | [FEITO] |
| Contas pagas do ano (baixas) | `dmabf` (`abf_tipo` `S`, origem `P`, sem estorno), `dmaap` | `contas-dm.js` | `/api/contas-dm` | Financeiro › Contas › Pagas; Faturamento (contas pagas por dia) | [FEITO] |
| Contas pagas de anos anteriores (2022 em diante) | `dmabf` | `contas-dm.js` (`pagasDoAno`) | `/api/contas-dm?ano=` | Contas › Pagas (histórico) | [FEITO] |
| Contas a receber: resumo do ano | `dmabg`, `dmacd`, `dmaao`, `dmaam`, `dmabf` | `contas-receber.js` (`contasReceber`) | `/api/contas-receber` | Contas a receber (resumo antigo); Caixa; Resultado do mês | [FEITO] |
| Contas a receber: título por título | `dmabg`, `dmacd`, `dmaam` | `contas-receber.js` (`titulosDoMes`) | `/api/contas-receber/titulos` | Financeiro › Receber | [FEITO] |
| Venda de um pagamento | `dmabg`, `dmach` | `contas-receber.js` (`vendaDoPagamento`), `venda-revendedora.js` | `/api/contas-receber/venda`, `/api/contas-receber/venda-revendedora` | Janela Editar pagamento (Resumo) | [FEITO] |
| Recebimento lançado antes do acerto | não lê a DevMaster para gravar; confere a revendedora ativa | `recebimentos-antecipados.js` (módulo `contasreceber`) | `/api/contas-receber/antecipados`, `/api/contas-receber/revendedoras` | Financeiro › Receber › Lançar recebimento | [FEITO] |
| Pix adiantado no acerto | módulos `ff` e `contasreceber` | `pix-adiantados.js` | `/api/pix-adiantados` | Atendimento interno (acerto) | [FEITO] |
| Cruzamento do Pix da DevMaster com o Pix da família | `dmabg` (títulos gravados por mês) + módulo `ff` | `cruzamento-pix.js`, `domain/cruzamento-pix.js` | `/api/contas-receber/cruzamento` | Financeiro › Receber (conta real e certeza) | [FEITO] |
| Comprovante ligado ao título | `dmabg` + lançamentos do Atendimento | `comprovantes-receber.js` | `/api/contas-receber/comprovantes` | Financeiro › Receber | [FEITO] |
| Bancos e formas de pagamento | `dmacd`, `dmaap`, `dmabg` (uso em 180 dias) | `cadastro-fin.js` | `/api/cadastro-fin` | Financeiro › Cadastro | [FEITO] só leitura |
| Numerários (cópia diária, banco ligado, uso em pagamentos) | `dmacd`, `dmaoq`, `dmaap`, `dmabf` (pagar, 90 dias), `dmabe` (`abe_tipodoc`) | `numerarios.js` (módulo `numerarios_dm`) | `/api/numerarios` | Financeiro › Cadastro › Numerários | [FEITO] só leitura, refeita 1 vez por dia |
| Erros para corrigir na DevMaster | `dmabe`, `dmaam` | `arrumar-devmaster.js` | `/api/arrumar-devmaster` | Financeiro › Controle › Arrumar na DevMaster | [FEITO] |
| Atividades do financeiro (quem baixou, estornos, extratos) | `dmabf`, `dmzzx`, `dmaap`, `dmabe`, `dmajt` | `atividades-fin.js` | `/api/atividades-fin` | Financeiro › Controle › Atividades (acesso restrito) | [FEITO] |
| Faturamento do mês, dia a dia | `dmabg` por emissão, sem o grupo `0002` | `faturamento-nf.js` + `automatico-dia.js` (módulo `fd`) | `/api/automatico/dia` | Faturamento; Visão geral | [FEITO] ver divergência em 6.12 |
| Faturamento por nota de saída (regra antiga) | `dmabl`, `dmaam` | `faturamento.js`, `faturamento-dia.js` | `/api/faturamento/dia` (devolve erro 503 de propósito) | nenhuma | desligado em 29/10/2026 |
| Saldos das contas | não vem da DevMaster | digitado no Admin (módulo `sc`) | `/api/estado/*` | Contas bancárias | [FEITO]; a DevMaster tem saldo zero em todas as contas |

### 4.3 Peças, estoque e custo

| Dado | Tabelas | Arquivo do servidor | Rota `app/api` | Tela (pelo menu) | Estado |
|---|---|---|---|---|---|
| Produtos novos e foto já na DevMaster | `dmaaa` (`aaa_foto` preenchido = tem foto) | `fotos-dm.js` (módulo `fc`) | `/api/fotos/dm`, `/api/automatico/fotos-dm` | Marketing › Fotos de catálogo | [FEITO] |
| Foto de uma peça | `GET /dmaaa/fotos` | `devmaster2.js`, `separar-pecas.js` | `/api/encomendas/pecas/foto` | Encomendas › Separar peças; pedido por link | [FEITO] |
| Preço e custo da peça | `dmaaa` (preço = `aaa_precobase`, ou `aaa_precovenda`; custo = compra ou bruto + banho + embalagem + etiquetas + tag) | `produtos-dm.js` | `/api/produtos-dm`, `/api/precos-pecas`, `/api/encomendas/pecas` | Produção › Produção por modelo; Calculadora do Atendimento interno | [FEITO] |
| Custo de tudo que saiu do estoque, por mês e por TES | `dmach` (emissão, sem cancelada) + `dmaci` (`aci_custoprod` × quantidade) | `custo-saida.js` (módulo `cpc`, chave `custoMes`) | `/api/automatico/custo`, `/api/automatico/dia` | Cadastro de peças › Pedidos (resumo por mês) | [FEITO] |
| Estoque com as revendedoras (peças, valor, quantidade) | `dmafi` aberta, previsão até o fim do ano, sem vendedor `04` e `91` | `estoque-dia.js` (módulo `es`) | `/api/automatico/dia` | Relatórios › Estoque Sorelly | [FEITO] |
| Estoque interno e custo com as revendedoras | não achado na DevMaster | digitado | — | Estoque Sorelly | [A CONSTRUIR] (falta achar o relatório de estoque) |
| O que falta comprar por categoria | `dmaaa`, `dmabq`, `dmach`, `dmaci` | `reposicao.js` (módulo `cpc`, chave `reposicao`) | `/api/automatico/reposicao` | Cadastro de peças › Pedidos › Peças | [FEITO] |
| Anéis vendidos por tamanho | `dmach`, `dmaci` | `encomendas-vendas.js` | `/api/montagem/revendedoras/[id]/aneis` | Fila de montagem › Montar kit | [FEITO] |
| Boletos da Point pela nota fiscal | `dmabe` (número da nota no `abe_historico`) | `point-nf.js` | `/api/point-nf` | Negociações | existe em `origin/master`; **não existe na pasta lida** [A CONFIRMAR] |
| Títulos da Pontual casados com as parcelas | `dmabe` | `domain/pontual-dm.js`, rota `/api/pontual-dm` | — | Negociações › Pontual › DevMaster | citado no diário de decisões de 17/11; **não achado no código** [A CONFIRMAR] |

### 4.4 Pessoas

| Dado | Fonte | Arquivo do servidor | Rota | Tela | Estado |
|---|---|---|---|---|---|
| Funcionárias que também são clientes | RH do Admin + `dmaam` pelo CPF; representantes pelo nome completo | `funcionarias.js` | `/api/funcionarias` | Calculadora do acerto; comissão de funcionária; Configurador | [FEITO] |
| Funcionárias nas telas financeiras | `dmaam.aam_grupo = 0002` | `contas-receber.js`, `faturamento-nf.js` | — | Contas a receber; Faturamento | [FEITO] **regra diferente da linha de cima**, ver 6.16 |
| Representante de cada revendedora | vendedor do kit principal (`afi_vendedor`), sem `04` e `91` | `revendedoras.js` (`representanteDe`) | — | todas | [FEITO] |
| Representante com mais de um código | banco do Admin (`conta.rep_cod` e `conta.rep_extra`) | `rep-codigos.js` | `/api/representante/*` | App da representante | [FEITO] |

### 4.5 App e Kommo

| Dado | Fonte | Arquivo | Rota | Tela | Estado |
|---|---|---|---|---|---|
| Painel das representantes | app | `representantes-app.js` | `/api/representantes/painel` | Representantes › App | [FEITO] |
| Venda no app (ciclo) | app + `dmaam` (telefone) | `encomendas-ranking.js`, `encomendas-vendas.js` | `/api/encomendas/ranking`, `/api/encomendas/venda-app` | Encomendas › Ranking, Premiação, Top 100 | [FEITO] |
| Preferências do kit | app (tabela `sorelly.preferencia_app`) | `preferencias-app.js` | `/api/preferencias-app` | Preferências do kit | [FEITO] |
| Uso do app | app | `pos-vendas.js` | `/api/pos-vendas/contatos` | Pós-vendas | [FEITO] |
| Indicações | app + Kommo + banco do Admin | `indicacoes.js` | `/api/indicacoes/*` | Indicações | [FEITO] |
| Indicações por influencer | app | `modelos-indicacoes.js` | `/api/modelos/indicacoes` | Marketing › Modelos | [FEITO] |
| Funil de cadastro | Kommo | `kommo.js` | `/api/kommo/cadastro` | nenhuma tela chama | [A CONSTRUIR] a tela |

---

## 5. Regras de cruzamento e conciliação

### 5.1 Quem sabe primeiro

| Caso | Quem sabe primeiro | Como se confere |
|---|---|---|
| Acerto faturado; venda de representante | DevMaster | Conciliação bancária, depois |
| Pix adiantado de acerto; revendedora que paga direto a fornecedor ou prestador; pagamento que sai antes da baixa | Admin | Quando a DevMaster registra, o Admin cruza |

Estados de um lançamento: `Lançado sem comprovante → Pendente → com comprovante → a DevMaster fatura → Cruzado`.

### 5.2 Contas a pagar: a ordem das regras [FEITO]

A lista de Contas a pagar é montada nesta ordem (`domain/contas-empresa.js`, função `itensEmpresa`):

```
títulos e baixas da DevMaster (/api/contas-dm)  +  contas lançadas só no Admin
        │
        ├─ 1. tira os títulos CCI abertos quando a fatura real do cartão está lançada no Admin
        ├─ 2. comBaixas     aplica as baixas dadas no Admin (com juros, multa, desconto; aceita parcial)
        ├─ 3. casarPagos    casa título aberto da DevMaster com parcela já paga no Admin
        ├─ 4. aplicarPf     abate o Pix de revendedora lançado um a um
        └─ 5. comFilial     aplica o CNPJ trocado à mão
```

### 5.3 `casar-pagos.js`: critérios exatos lidos no código [FEITO]

Entrada: títulos **abertos** da DevMaster e parcelas **já pagas** do Admin (Pagamentos a fornecedores).

| Critério | Regra no código |
|---|---|
| Quais títulos entram | Situação "a pagar", que não nasceram no Admin, com fornecedor reconhecido |
| Fornecedor | O mesmo nome padronizado. Se o fornecedor não está na lista fixa, casa quando um nome começa pelo outro (mínimo 4 letras) e só existe **um** candidato. |
| Tipo | Pix, boleto, cheque ou cartão. O tipo do título sai do nome da natureza e do nome do título. O tipo da parcela sai do campo `forma`. Título sem tipo no nome ("outro") casa só por valor e data (desde 24/11). |
| Valor | Igual, com diferença de até 1 centavo |
| Data | Vencimento do título entre **3 dias antes** e **12 dias depois** da data da parcela |
| Um para um | Cada parcela casa com **um** título. Entre candidatos, vale o de vencimento mais próximo. |
| Ordem | Títulos do vencimento mais antigo para o mais novo |
| Resultado | O título vira "pago", com a marca `faltaBaixaDm`. Sai do A pagar. Entra no pago do mês em que o dinheiro saiu. |
| Sem par | Nada muda. A conta continua visível. |
| Quando a DevMaster baixa | O título deixa de estar aberto lá. A regra para de agir sozinha. Vale a baixa da DevMaster. |

Por que 12 dias: fatura em parcelas iguais tem o mesmo valor todo mês. Com janela de 30 dias, o Pix de um mês baixava a parcela do mês seguinte.

Segunda rodada, para prestador de serviço (desde 24/11): título aberto de Pix cujo nome contém o **primeiro nome** do prestador, mesmo valor (1 centavo), mesma janela de datas. Motivo: o nome do prestador na DevMaster não bate com o do Admin.

Parcela paga com vencimento no futuro (desde 24/11): parcela marcada "Pago" com vencimento até **35 dias à frente** casa com o título e conta como paga na data de hoje (Pix adiantado). Mais longe que isso é tratado como erro de planilha e fica de fora.

**Divergências registradas:**
- Os documentos dizem "duas candidatas iguais: o sistema pergunta, não adivinha". O código escolhe a de vencimento mais próximo e não pergunta. [A CONFIRMAR]
- Um documento e uma nota de memória dizem "parcela Pago com data futura é ignorada". O código de 24/11 aceita até 35 dias. Vale registrar os dois.
- Uma auditoria de 21/11 achou parcelas que diferem 2 centavos e não casam. A tolerância continua em 1 centavo. [A CONFIRMAR]

### 5.4 Pix de revendedora lançado um a um (`aplicarPf`) [FEITO]

- O Pix lançado em Pagamentos a fornecedores, com comprovante, vale como pago na hora.
- Ele abate os títulos abertos do mesmo fornecedor na DevMaster, do mais antigo para o mais novo.
- O abatimento não passa do total em aberto. O que passa já foi baixado lá e conta lá.
- **Não abate de novo** o Pix até a data já casada pelo `casarPagos`.
- **Não abate** o Pix com data até a **última baixa de Pix** daquele fornecedor na DevMaster. A DevMaster junta os Pix e baixa depois. Vale a DevMaster. (Correção de 21/11, ver armadilha 6.1.)
- Pix de prestador não abate.

### 5.5 Boleto e cheque que a DevMaster já baixou (`parcelasBaixadasDm`) [FEITO]

- Parcela de boleto ou cheque ainda pendente no Admin conta como paga quando a DevMaster já baixou o título.
- Critérios no código: mesmo fornecedor, mesmo tipo, valor com diferença de até R$ 1,01 ou 0,5% (o maior dos dois), vencimento até 10 dias de distância, um para um.
- Pix fica de fora: para Pix vale o Admin.
- Cheque vencido que a DevMaster ainda tem aberto continua aberto. É decisão do financeiro.
- **Divergência registrada:** o diário de decisões de 23/11 diz "valor até 1 centavo, vencimento até 5 dias". O comentário do código diz "até 3 centavos". O código usa R$ 1,01 ou 0,5% e 10 dias. [A CONFIRMAR qual vale]

### 5.6 O que a DevMaster tem e o Admin não (`extrasDevmaster`) [FEITO]

- Boleto e cheque da DevMaster que não casam com nenhuma parcela do Admin entram no saldo do fornecedor como "com nota".
- Mesma tolerância de 5.5. Pix fica de fora. A Point tem regra própria, pela nota fiscal.
- Só na tela. Nada é gravado.

### 5.7 Coluna "Na DevMaster": pendente ou confirmado [FEITO]

| Onde | Valores | Regra |
|---|---|---|
| Contas a pagar | "Pendente na DevMaster" | Título casado pelo `casarPagos` (pago no Admin, aberto lá) |
| Contas a pagar | "Falta ajustar" | Linha da fatura real do cartão que substitui a previsão |
| Resumo de pagamentos (`statusDevmasterLanc`) | `confirmado` | A data do Pix é até a última baixa de Pix do fornecedor na DevMaster. Prestador: existe título pago com o primeiro nome, o valor (1 centavo) e a data (até 30 dias). |
| | `falta` | Pago no Admin e o título ainda está aberto lá (ou já casado, esperando a baixa) |
| | `sem` | A DevMaster não tem título que case |

**Divergência registrada:** `docs/regras/FINANCEIRO-CONTAS-E-DIRECIONAR.md` marca essa coluna como [A CONSTRUIR]. O código já tem a coluna nas duas telas.

### 5.8 Regra de ouro do cruzamento: por fornecedor e por mês

- Para responder "o que só existe no Admin" ou "o que falta na DevMaster", somar **por fornecedor e por mês**. Nunca comparar lançamento com lançamento, nem valor de parcela com saldo.
- Motivo: a DevMaster junta os Pix de um fornecedor num valor por dia. Título parcialmente pago fica com situação `P` e saldo menor que o valor.
- Ler sempre as situações `A` e `P`. Usar baixas sem estorno. Nomes reais dos fornecedores estão em `dmaat`.
- **Como conviver com 5.3:** o casamento título a título (`casarPagos`) continua existindo para dar baixa na tela. A soma por fornecedor e mês é a regra para conferência e para afirmar número. Os dois documentos existem; os dois valem para usos diferentes. [A CONFIRMAR se a diretoria quer uma regra só]

### 5.9 Pix da Pontual no fornecedor 000512

- Na DevMaster, os Pix do banho da Pontual **não** ficam no cadastro com o nome da Pontual. Ficam no fornecedor `000512`, natureza `5.04.01.02` (Pix banho Pontual), prefixo `BAN`. O histórico do título cita nota, fatura e "Pix".
- O vencimento do título é o da fatura. O Pix do Admin tem a data em que foi pago.
- No Admin, o nome padronizado sai de uma lista de regras por palavra (`FORNS`, em `domain/contas-empresa.js`). "Pontual" vem **antes** de "Ellos/Galvanoplast" de propósito (ver armadilha 6.22).
- A forma de recebimento "PIX - BANHO" pertence à Pontual (ela baixa no caixa de Pix da Pontual). A Ellos tem forma própria.
- Os boletos da Pontual ficam em outro cadastro de fornecedor. [A CONFIRMAR o código]

### 5.10 Filial x CNPJ

| Dado | Regra no código | Estado |
|---|---|---|
| Conta **a pagar** | CNPJ = filial da DevMaster (tabela de 3.2). Para vencimento até 31/12/2026 vale antes o CNPJ já conferido pela diretoria (módulo `cpfil`). De 2027 em diante vale a filial, de propósito. | [FEITO] |
| Conta **paga** | CNPJ = pela **conta bancária usada**. Nome da conta termina em 34, 46, 59 ou 67, ou traz Axis (67), Serenity (59), Comércio (46), Atacadista (34). Caixa e conta de pessoa = "por fora". Limite rotativo = 34. | [FEITO] |
| CNPJ trocado à mão | Guardado no Admin por conta. Vale também depois de paga. | [FEITO] |
| Conta que paga | A conta de um CNPJ só paga conta do mesmo CNPJ. Não existe dinheiro entre CNPJs. | regra de 13/11 |
| Erro de filial | Corrige-se na DevMaster. O sistema só avisa. | [FEITO] |

**Divergência registrada:** o arquivo de pendências do financeiro diz que a regra "pela conta bancária" ainda não foi aplicada e que o código usa a filial. O código aplica a conta bancária nas contas pagas e a filial nas contas a pagar.

### 5.11 Título parcialmente pago e baixa parcial

- Na DevMaster: situação `P`, com `abe_saldo` menor que `abe_valor`. O Admin mostra o saldo como "falta pagar" e guarda o valor do título.
- No Admin: a baixa dada no sistema quita uma parte. A parte quitada vira "pago" (valor = o que saiu do caixa, com juros e multa, menos desconto). O resto continua "a pagar".
- Título baixado (`B`) que ainda tem saldo é erro: aparece em Arrumar na DevMaster.

### 5.12 Recebimento antes do acerto (antecipados) [FEITO]

- O financeiro lança o recebimento em Contas a receber antes de o acerto existir na DevMaster.
- A revendedora vem sempre da lista de **ativas** lida da DevMaster. O nome gravado é o do cadastro, nunca o digitado.
- Formas: Pix (padrão), dinheiro, crédito, débito ou link.
- Destino "empresa": fica só no módulo `contasreceber`. Destino "sócio": grava também no Financeiro familiar (módulo `ff`), com cópia do comprovante.
- "Pedido de Pix": lançado antes de o Pix existir, com valor zero. Não entra em acerto, não vai para a família e não cruza até ser completado.
- Sem comprovante, o lançamento fica pendente. A tela mostra o alerta e a coluna "Falta comprovante".
- No acerto do Atendimento interno, o Pix livre da revendedora aparece para ser usado. Cada Pix é marcado uma vez só (trava no servidor). Pix já usado não pode ser apagado.
- Sobra do Pix sobre a dívida vira crédito. [A CONSTRUIR] o campo de crédito no acerto.

### 5.13 Pix da DevMaster x Pix da família [FEITO]

A DevMaster só diz o sócio que recebeu. A conta de verdade só existe no Financeiro familiar. O servidor lê os títulos desde 2025-01, grava um resumo por mês e grava o resultado. Regra em `domain/cruzamento-pix.js`. Cada Pix casa com um título só. Passadas, da mais segura para a mais solta:

| Passada | Regra | Certeza |
|---|---|---|
| 1 | Nome igual, mesmo valor, sócio igual ao dono do Pix, Pix de 10 dias depois até 45 dias antes do título | "certo" se o par é único dos dois lados; senão "provável" |
| 2 | Nome igual ou parecido, mesmo valor, Pix de 120 dias depois até 90 dias antes (pagamento atrasado ou outro sócio) | "provável" |
| 3 | Sem olhar o nome: mesmo valor, sócio igual, até 10 dias, e só com par único dos dois lados | "provável" |
| 4 | Mesmo Pix com valor diferente: nome igual ou parecido, sócio igual, até 10 dias, diferença de até R$ 50 e até 20% | "diferença" |
| 5 | O Pix existe na família, mas a DevMaster lançou outra forma (acerto - loja, compra de funcionário): nome igual ou parecido e valor igual | "outra forma" |

Título de forma de empresa (PJ) só casa pelo nome e nunca aparece como "sem par". A lista dos Pix da família sem título só aparece para quem tem acesso à Família.

### 5.14 O que conta como pago no Admin

| Situação | Conta como pago? |
|---|---|
| Baixa na DevMaster, sem estorno | Sim. Data = data de débito (`abf_datadebito`; sem ela, data de pagamento). |
| Baixa dada no Admin | Sim, na data da baixa |
| Parcela paga em Pagamentos a fornecedores que casa com título aberto | Sim, com "Pendente na DevMaster" |
| Pix de revendedora com comprovante, com título aberto para abater | Sim, até o limite do aberto |
| Boleto ou cheque pendente no Admin que a DevMaster já baixou | Sim |
| Movimento estornado | Não |
| Pix sem comprovante | Pendente |

### 5.15 O que conta como recebido

- Título com forma "Acerto - loja" (`ACE`, `ACI`) = a revendedora **não pagou** na hora, mesmo que pague depois. O que importa é o saldo que continua aberto.
- Recebido nas contas = todas as outras formas (Pix, link, cartão, dinheiro).
- O dinheiro de acerto - loja antigo que entra no mês vem das baixas (`dmabf`, `abf_tipo` `E`), ligadas ao título por prefixo + número + parcela.
- Cliente do grupo `0002` é separado como funcionária.
- A venda e o título não têm código em comum. O título guarda o número do orçamento (`abg_codorigem2`). O valor de venda é achado pela venda do mesmo cliente faturada no mesmo dia; com mais de uma, vale a mais próxima da soma dos pagamentos.

### 5.16 Título de PREVISÃO x título real

- A DevMaster tem títulos de previsão (cartão, diarista, juros, férias, combustível). A previsão é um tampão.
- Quando o título real entra, a previsão precisa diminuir ou sair. Se os dois ficam, o gasto soma duas vezes.
- Conferência do cartão: títulos avulsos do mês + previsão que resta = fatura real.
- No Admin: com a fatura real lançada, os títulos `CCI` abertos do mesmo vencimento saem da lista. [FEITO] para o cartão. [A CONSTRUIR] para as outras previsões.

### 5.17 Conferências pedidas e não feitas

| Regra | Estado |
|---|---|
| Todo dia 1 o sistema compara Contas a pagar do Admin com o da DevMaster e avisa | [A CONSTRUIR] |
| Alerta de pagamento sem comprovante depois de 10 dias, lendo a DevMaster | [A CONSTRUIR]; outra decisão diz "sem aviso por prazo". [A CONFIRMAR] |
| Divergência entre notas, contas a pagar, contas a receber e saldo das contas, na tela | [A CONSTRUIR] |
| Desfazer um cruzamento errado | [A CONFIRMAR] quem corrige e como |

---

## 6. Armadilhas conhecidas e erros já cometidos

| # | O que aconteceu | Causa | Como evitar |
|---|---|---|---|
| 6.1 | Pix de fornecedor contado duas vezes: já tinha baixa na DevMaster e entrava de novo como pago, abatendo títulos abertos (auditoria de 21/11). | O abatimento só olhava a data coberta por título ainda aberto. | Não abater Pix com data até a última baixa de Pix do fornecedor na DevMaster. Já corrigido em `aplicarPf`. Falta teste automático. [A CONSTRUIR] |
| 6.2 | Foi dito que pagamentos "só existiam no Admin". Eles estavam na DevMaster (22/11). A saída do mês ficou inflada. | Comparação lançamento a lançamento, e valor de parcela contra saldo. | Somar por fornecedor e mês. Incluir situação `P`. Ver 5.8. |
| 6.3 | Contas a pagar inflado: Pix da Pontual já pagos apareciam como dívida (20/11). | Os títulos estavam no fornecedor `000512`, não no cadastro com o nome da Pontual. Faltava a baixa. | Procurar pelo código e pela natureza, não pelo nome. Ver 5.9. |
| 6.4 | Casamento errado entre parcelas iguais de meses diferentes. | Janela de 30 dias. | Janela de 3 dias antes a 12 depois. Não alargar. |
| 6.5 | A leitura de produtos parava em 30.500 linhas. A DevMaster tinha mais de 37 mil. Peças antigas davam "código não encontrado" (19/11). | `todasAsPaginas` para na página 60, sem aviso. | Passar limite maior em tabela grande. Só o caminho das fotos foi corrigido; `reposicao.js` tem uma cópia própria sem teto. Outras tabelas grandes não foram conferidas. [A CONFIRMAR] |
| 6.6 | Chamada à DevMaster ou ao app falha com erro de certificado. | A DevMaster manda o certificado sem o intermediário. No computador de desenvolvimento, o antivírus troca o certificado. | Usar o agente com as autoridades padrão + as do sistema (como `devmaster2.js`). Nunca desligar a verificação. Cinco arquivos que chamam sistemas de fora ainda não têm o agente (`devmaster.js`, `app-rep/cliente-app.js`, `indicacoes.js`, `pos-vendas.js`, `preferencias-app.js`). [A CONFIRMAR] |
| 6.7 | GET com filtro não funcionava com `fetch`. | A API 2 quer corpo JSON no GET. | Usar `node:https` (já feito em `devmaster2.js`). |
| 6.8 | Busca por nome não achava a cliente. | `like` diferencia maiúsculas. Nomes em MAIÚSCULAS e sem acento. | Tirar acento e pôr em maiúsculas antes de buscar. |
| 6.9 | Títulos com ano errado no vencimento (ex.: 0226) e títulos sem vencimento bagunçavam a ordem e o mês. | Erro de digitação na DevMaster e na rotina de comissões. | `contas-dm.js` troca ano começado em zero por 20xx só para exibir. A correção de verdade é na DevMaster (tela Arrumar). |
| 6.10 | Todas as contas atrasadas caíram no mês seguinte (10/11). | Uma baixa com data de débito no futuro puxou o "mês de referência". | O mês de referência nunca passa do mês de hoje (já feito). |
| 6.11 | À noite, a tela "Hoje" vinha vazia. | A hospedagem roda em UTC. Às 21h de Brasília o servidor já está no dia seguinte. | Calcular o dia em `America/Sao_Paulo`. Feito em `atividades-fin.js` e nas rotinas diárias. Outros arquivos ainda usam a data do servidor (`contas-dm.js`, `acertos-previstos.js`, `revendedoras.js`). [A CONFIRMAR] |
| 6.12 | O robô do faturamento gravaria um valor muito menor que o relatório de notas da diretoria. | A regra usava notas de saída (`dmabl`). Essa tabela mistura orçamento (série ORC) com nota emitida, e o relatório usa outra base. | Regra vigente desde 09/11: títulos a receber (`dmabg`) com emissão no mês, sem o grupo `0002`; acertos = clientes distintos. **Divergência:** documentos e o comentário de `instrumentation.js` ainda dizem "robô das 10h desligado". Ver seção 7. |
| 6.13 | Total de vendas do dia não batia com o relatório. | O relatório usa a data de **faturamento** (`ach_datafat`), não a de emissão. | `vendas-brinde.js` usa `ach_datafat`. `custo-saida.js`, `reposicao.js` e as últimas vendas usam `ach_emissao`. Saber qual data cada tela usa antes de comparar. [A CONFIRMAR se é de propósito] |
| 6.14 | Gasto somado duas vezes: previsão + título real; ou o mesmo pagamento lançado no Admin em duas datas. | Previsão que não sai; lançamento repetido por duas telas ou duas pessoas. | Ver 5.16. Antes de apagar um "duplicado", comparar com a DevMaster: um título lá = um pagamento. |
| 6.15 | Conta atribuída ao CNPJ errado. | A filial está cadastrada errada em parte dos títulos. A filial 34 recebe contas de todos os CNPJs. | Ver 5.10. |
| 6.16 | Número de funcionárias diferente entre telas. | Duas regras no código. Uma usa o grupo `0002` da DevMaster (tem sócios, família e ex-funcionárias). A outra usa o RH do Admin e liga pelo CPF. | Decidir uma regra só. [A CONFIRMAR] |
| 6.17 | Foi dito que a maioria das revendedoras não usava o app. Era falso. | O campo "última vez vista" do app só grava na criação da conta. | Medir uso por pedidos lançados e último pedido. Validar o campo com um caso conhecido antes de afirmar. |
| 6.18 | "Venda no app" comparada com o mês civil. | O app mostra o vendido no ciclo (desde o último acerto). | Dizer sempre se o número é do ciclo ou do mês. |
| 6.19 | Teste em `localhost` gravou no sistema de verdade (16/11 e 23/11). Um teste apagou pedidos reais do Direcionar. | O `localhost` usa o banco de produção. O `.env` de desenvolvimento aponta para o app de produção. | Nunca testar fluxo que grava com dado real. Manter `APP_REP_SINCRONIZAR`, `INDICACOES_GRAVAR` e `INDICACOES_KOMMO_GRAVAR` desligadas no desenvolvimento. Recuperação: `sorelly.estado_modulo_log` (45 dias) e `sorelly.estado_modulo_copia` (30 dias). |
| 6.20 | Nome de fornecedor errado em tela. | `dmaam` (clientes) traz nomes trocados para códigos de fornecedor. O nome real está em `dmaat`. | Usar `dmaat`. `arrumar-devmaster.js` ainda busca o nome em `dmaam`. [A CONFIRMAR e corrigir] |
| 6.21 | Foi escrito numa conversa que "o robô baixa o Pix na DevMaster sozinho". | Frase errada. | O Admin nunca grava na DevMaster. Quem baixa é a equipe (ou a própria DevMaster). O Admin só marca "pendente". |
| 6.22 | Títulos da Pontual caíam no fornecedor Ellos. | A regra de nome testava "Galvanoplast" antes de "Pontual". | A ordem das regras em `FORNS` importa. Pontual vem primeiro (corrigido em 23/11). |
| 6.23 | Título de boleto tratado como Pix. | O tipo do título é lido do nome; "PIX" é testado primeiro; há fornecedor cadastrado com "PIX" no nome. | Conferir o tipo quando o nome do fornecedor tem "PIX". O código ainda testa "PIX" primeiro. [A CONFIRMAR] |
| 6.24 | Datas não batem entre o Admin e a DevMaster para prestador. | O financeiro dá baixa no fim do mês; o Pix sai em outros dias. | Comparar por mês, não por dia. |
| 6.25 | Tela lenta ou rota estourando o tempo. | Montar a lista de revendedoras lê mais de 2.000 clientes (cerca de 21 segundos a frio). | Cópia da lista no banco + agendador de aquecimento (seção 7). Rotas pesadas têm `maxDuration` maior. |
| 6.26 | Rota do app devolve 503 ou lista vazia e a tela mostra zero. | O backend do app desliga rotas e degrada em silêncio. | Tratar vazio como "sem resposta". Não derrubar a tela. Dizer que o dado não veio. |
| 6.27 | `403` em tabela nova. | O token da API 2 libera tabela por tabela. | Conferir em `/api/devmaster2` antes de construir. Pedir a tabela ao suporte da DevMaster. |
| 6.28 | **Ano fixo no código.** A lista de revendedoras lê condicionais com devolução prevista **em 2026** (datas escritas no código). Contas pagas começam em `2026-01-01`. Vendas sem brinde são "só 2026". | Datas escritas à mão em `revendedoras.js`, `contas-dm.js`, `vendas-brinde.js`, rota `expositores` e `point-nf.js`. | Trocar por ano corrente antes da virada. Kit entregue no fim de 2026 com devolução em 2027 pode ficar fora da lista já agora. [A CONFIRMAR e A CONSTRUIR] |
| 6.29 | Mesma pergunta, respostas diferentes: "quantas revendedoras ativas?" | Existem pelo menos 6 contagens no código, cada uma com um filtro (ver seção C do arquivo `.local`). | Dizer qual contagem a tela usa. [A CONFIRMAR qual é a oficial] |
| 6.30 | "De quem é a conta" muda de tela para tela. | Existem 5 regras por palavra no nome da conta (ver seção C do arquivo `.local`). O cruzamento do Pix depende do texto exato de uma delas ("Família e sócios"). | Juntar numa regra só. Até lá, não renomear o grupo sem mexer no cruzamento. [A CONSTRUIR] |

---

## 7. Caches, agendadores e desempenho

### 7.1 Agendador da hospedagem (`vercel.json`) [FEITO]

Horário de Brasília = UTC − 3.

| Rota | Quando (UTC) | Em Brasília | O que faz |
|---|---|---|---|
| `/api/automatico/dia` | 13:00 e 17:00 | 10h e 14h | Cópia diária dos módulos; total de revendedoras; estoque com as revendedoras; fotos; custo das saídas; faturamento e acertos até ontem |
| `/api/automatico/custo` | 14:00 e 15:00 | 11h e 12h | Custo das saídas do mês atual e do anterior |
| `/api/automatico/reposicao` | 14:30 | 11h30 | O que falta comprar por categoria |
| `/api/automatico/fotos-dm` | a cada 10 minutos | — | Produtos novos e fotos (últimos 120 dias) |
| `/api/automatico/fotos-dm?antigas=1` | a cada 30 minutos | — | Todos os produtos, com e sem foto (leitura pesada) |
| `/api/app-rep/sincronizar` | a cada minuto | — | Kits novos e avisos para o app da representante (só com a chave ligada) |
| `/api/automatico/aquecer-revendedoras` | a cada 10 minutos | — | Refaz a lista de revendedoras e a cópia no banco |

As rotas aceitam o agendador (cabeçalho com `CRON_SECRET`) ou uma pessoa logada. A rotina do dia é idempotente: marca "dia feito" (módulo `autodia`) e não repete.

### 7.2 Relógios do servidor local (`instrumentation.js`) [FEITO]

| Relógio | Frequência | Observação |
|---|---|---|
| Rotina do dia | a cada 15 minutos, a partir das 10h | idempotente |
| Revendedoras do dia | a cada 15 minutos, a partir das 10h | o comentário do arquivo ainda diz 18h |
| Fotos | a cada 5 minutos | — |
| Custo das saídas | a cada 10 minutos; só roda às 11h e às 12h | uma vez por hora (módulo `autocusto`) |
| Sincronização com o app | a cada 60 segundos | só com `APP_REP_SINCRONIZAR=1` |

**Divergência registrada:** o comentário no topo de `instrumentation.js`, `docs/negocio/ALINHAMENTOS-FINANCEIRO-28-10-2026.md` (seção 8) e `docs/regras/FINANCEIRO-CONTAS-E-DIRECIONAR.md` dizem "robô do faturamento das 10h desligado" e "robô de revendedoras às 18h". O código de 09/11 roda os dois às 10h, com a regra nova do faturamento. O que está desligado é só a regra antiga (`faturamento-dia.js`).

### 7.3 Caches na memória do servidor

A memória some quando o servidor reinicia ou quando a hospedagem abre uma instância nova.

| Dado | Tempo | Arquivo |
|---|---|---|
| Lista da API 1 | 10 min | `devmaster.js` |
| Lista de revendedoras | 10 min na memória + cópia no banco de até 1 hora | `revendedoras.js` |
| Agenda | 10 min | `revendedoras.js` |
| Vendedores | 60 min | `revendedoras.js` |
| Municípios | sem prazo | `revendedoras.js` |
| Últimas vendas por revendedora | 30 min | `revendedoras.js` |
| Kit ativo | 10 min | `devmaster2.js` |
| Contas a pagar e pagas | 10 min | `contas-dm.js` |
| Pagas de anos anteriores | 30 min por ano | `contas-dm.js` |
| Cadastros (fornecedor, natureza, conta) do histórico | 60 min | `contas-dm.js` |
| Contas a receber (resumo) | 30 min + cópia no banco | `contas-receber.js` |
| Títulos do mês | 10 min | `contas-receber.js` |
| Formas, vendedores e funcionárias (grupo `0002`) | 60 min | `contas-receber.js`, `faturamento-nf.js` |
| Cadastro de bancos e formas | 30 min | `cadastro-fin.js` |
| Arrumar na DevMaster | 5 min | `arrumar-devmaster.js` |
| Atividades do financeiro | 10 min por período | `atividades-fin.js` |
| Acertos previstos | 30 min | `acertos-previstos.js` |
| Funcionárias (RH + CPF) | 30 min | `funcionarias.js` |
| Preço e custo por código | 6 horas | `produtos-dm.js` |
| Produtos recentes (fotos) | 2 min; todos os produtos 10 min | `fotos-dm.js` |
| Kommo | 5 min | `kommo.js` |
| Painel das representantes (app) | 5 min | `representantes-app.js` |
| Venda do app | 60 segundos | `encomendas-ranking.js`, `encomendas-vendas.js` |

A tela pede a versão sem cache com `?agora=1` (ou `?atualizar=1` no Kommo e no app).

### 7.4 Cópias no banco do Admin (schema `sorelly`)

| Tabela | Guarda | Quem grava |
|---|---|---|
| `cache_servidor` (chave `revs_base_v11`) | Lista de revendedoras pronta | `revendedoras.js` |
| `cache_json` (chave `contas_receber`) | Resumo de contas a receber | `contas-receber.js` |
| `cruzamento_pix_titulos` | Títulos de cada mês (desde 2025-01). Meses antigos são lidos uma vez; os 2 últimos, a cada 30 minutos. | `cruzamento-pix.js` |
| `cruzamento_pix_resultado` | Resultado do cruzamento (linha "ultimo") | `cruzamento-pix.js` |
| `venda_composicao` | Cada venda de 2026 com brinde, troca, indicação, premiação | `vendas-brinde.js` |
| `preferencia_app` | Preferências do kit lidas do app | `preferencias-app.js` |
| `estado_modulo` | Módulos gravados pelas rotinas: `revdia`, `fd`, `fatdia`, `es`, `cpc`, `fc`, `autodia`, `autocusto` | rotinas diárias |
| `estado_modulo_log` | Toda gravação, por 45 dias | `estado-modulo.js` |
| `estado_modulo_copia` | Cópia diária de todos os módulos, por 30 dias | `estado-modulo.js` |

As tabelas de cruzamento e de cache são cópia derivada. Dá para apagar e refazer sem perder nada.

### 7.5 Regras de desempenho

- Leitura pesada roda em segundo plano. A tela mostra o que já tem e pergunta de novo.
- Duas chamadas ao mesmo tempo esperam a mesma leitura (não leem duas vezes).
- Rotina que grava num módulo usa trava de versão e tenta até 4 vezes. Ela nunca apaga o que a pessoa digitou.
- Filtro `in` vai em lotes (40 a 250 códigos por pedido).
- Cada tela aberta chamava a rotina do dia a cada 30 minutos. Desde 11/11 a rotina responde "já feito" sem ler nada.

---

## 8. O que falta para tirar o financeiro da DevMaster

Objetivo da diretoria (27/10/2026): o financeiro sai da DevMaster e fica só no Admin. Até lá, tudo que o Admin faz precisa existir na DevMaster no fim.

### 8.1 O que o Admin já faz sozinho

| Assunto | Estado |
|---|---|
| Saldos das contas, digitados no fim do dia | [FEITO] |
| Direcionar o Pix e orientar por CNPJ (só sugere) | [FEITO] |
| Pagamentos a fornecedores e prestadores, com comprovante | [FEITO] |
| Financeiro familiar | [FEITO] |
| Lançar recebimento antes do acerto, com comprovante | [FEITO] |
| Lançar conta só no Admin e dar baixa no Admin (com juros, multa, desconto) | [FEITO] |
| Trocar o CNPJ de uma conta à mão | [FEITO] |
| Cruzar pago do Admin com título da DevMaster | [FEITO] |
| Espelho dos bancos e das formas de pagamento | [FEITO] só leitura |
| Lista de erros para corrigir na DevMaster | [FEITO] |
| Registro de toda gravação (45 dias) e cópia diária (30 dias) | [FEITO] |

### 8.2 O que ainda depende da DevMaster

| Dado | Tabela | Por que depende |
|---|---|---|
| Títulos a pagar (quem lança boleto, folha, imposto, empréstimo) | `dmabe` | O lançamento nasce lá |
| Baixas e data do pagamento | `dmabf` | A baixa oficial é dada lá |
| Títulos a receber = faturamento | `dmabg` | Nascem do PDV quando a venda é fechada |
| Vendas, itens, TES, comissão | `dmach`, `dmaci` | O acerto é fechado no PDV |
| Kits com as revendedoras e data prevista | `dmafi`, `dmafj` | A condicional é emitida e fechada lá |
| Agenda de acertos | `dmaik`, `afi_dataacerto` | O Agendamento marca lá |
| Cadastro de clientes, fornecedores, naturezas, bancos, formas | `dmaam`, `dmaat`, `dmaan`, `dmaap`, `dmacd` | Fonte dos nomes e dos códigos |
| Produtos, preço, custo e estoque | `dmaaa`, `dmabq` | Cadastro de peças |
| Extrato e conciliação bancária | `dmajt` | Só existe lá, e só em parte das contas |
| Nota fiscal | `dmabl` | Emissão fiscal |

### 8.3 O que falta construir

| # | Item | Estado |
|---|---|---|
| 1 | Lançador de contas a pagar completo (boleto, nota, parcelas, recorrência), como fonte e não como cópia | [A CONSTRUIR] |
| 2 | Baixa em lote e baixa automática de tudo que a DevMaster já baixou, para todos os fornecedores | [A CONSTRUIR] (o casamento por título existe) |
| 3 | Conferência automática no dia 1 (Admin x DevMaster) | [A CONSTRUIR] |
| 4 | Conciliação com o banco (extrato importado ou Open Finance) | [A CONSTRUIR] |
| 5 | Cadastro único de fornecedor e prestador, com o código da DevMaster ao lado do nome do Admin | [A CONSTRUIR] |
| 6 | Uma regra só para "de quem é a conta" | [A CONSTRUIR], depende das perguntas sobre as formas do PDV |
| 7 | Lançamento universal (recebimento + pagamento num registro) | [A CONSTRUIR], em alinhamento |
| 8 | Tratar todos os títulos de previsão, não só o cartão | [A CONSTRUIR] |
| 9 | Aba de empréstimos (títulos `EMP`) | [A CONSTRUIR] |
| 10 | Datas sem ano fixo no código (virada para 2027) | [A CONSTRUIR] |
| 11 | Testes automáticos das regras de cruzamento de Contas a pagar | [A CONSTRUIR] (existem testes do cruzamento do Pix, do Pix adiantado e do cérebro) |
| 12 | Receber sem a DevMaster (faturar o acerto no Admin) | [A CONFIRMAR] se entra no objetivo; hoje o faturamento nasce no PDV |
| 13 | Segurança pedida: backup, nuvem, auditoria, ver dias anteriores, login | parte [FEITO] (login, registro de 45 dias, cópia de 30 dias); o resto [A CONFIRMAR] com o responsável técnico |
| 14 | Carregar automático (vendas fechadas no Admin sem fechar na DevMaster) | [A CONFIRMAR]: falta achar o campo no PDV |

### 8.4 Perguntas abertas que travam a saída

1. Quem dá baixa na DevMaster dos Pix que o Admin já marcou como pagos, e quando? Uma resposta diz "a DevMaster baixa sozinha dias depois". Outra diz "ninguém sabe". [A CONFIRMAR]
2. Quem importa o extrato e por que só de algumas contas? [A CONFIRMAR]
3. O que significa cada prefixo de título e cada natureza? [A CONFIRMAR]
