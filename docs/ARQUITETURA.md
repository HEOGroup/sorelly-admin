# Arquitetura

Como o sistema é montado e como as peças conversam. Para rodar e para os comandos, veja o [README](../README.md).

## Visão geral

```
Navegador                                             Servidor (o mesmo Next.js)
┌────────────────────────────────────────────┐        ┌─────────────────────────────────────┐
│ app/[[...slug]]  → casca (ssr: false)      │        │ app/api/*         rotas HTTP        │
│   └─ src/cliente.js → React Router         │        │   └─ src/server/* login, permissão, │
│        ├─ /setor/tela    (app principal)   │  JSON  │                   estado, rotina,   │
│        └─ /kits-novos/* (Kits novos)       │ ─────► │                   DevMaster         │
│ Estado: reducer + localStorage             │        │ Postgres (schema "sorelly")         │
│ Sincronização opcional (NEXT_PUBLIC_API_URL)│       │                                     │
└────────────────────────────────────────────┘        └─────────────────────────────────────┘
```

- **O sistema roda no navegador.** O Next entrega uma casca (`app/[[...slug]]/casca.js`, carregada com `ssr: false`), que monta o React Router de `src/cliente.js`. Toda URL cai na mesma casca; quem decide a tela é o React Router.
- **O servidor é o próprio Next.** As rotas ficam em `app/api/*` e só chamam funções de `src/server/*`. Não existe outro processo de servidor.
- **Cada tela é carregada sob demanda.** Em `src/router/rotas.js` cada página tem um `import()` próprio: o navegador só baixa o código de uma tela quando alguém a abre.

## Pastas

| Pasta | O que tem |
|---|---|
| `app/` | Entrada do Next: `layout.js` (HTML base, fontes e tema), `[[...slug]]/` (casca do sistema) e `api/` (rotas do servidor). |
| `src/cliente.js` | Cria o React Router no navegador. |
| `src/router/` | `rotas.js` (tabela de rotas, uma linha por tela) e `use-rota-aba.js` (URL ↔ tela ativa). |
| `src/apps/montagem/` | App principal (todos os setores): `App.js` (casca com menu), `pages/` (uma tela por arquivo, telas grandes divididas em subpastas), `components/`, `ui/`, `domain/` (regras e números), `state/` (reducer e store), `navigation/` (menu), `mobile/` (apps de celular simulados), `lib/`, `router/slugs.js`, `styles/`. |
| `src/apps/kits-novos/` | App de Kits novos (Curitiba), com a mesma estrutura e `ui/` próprio. |
| `src/server/` | Código do servidor: `http.js` (resposta, erro, login obrigatório), `db.js` (Postgres), `permissoes.js` (quem abre cada módulo), `senha.js`, `rotina.js`, `devmaster.js`. |
| `src/shared/` | Peças usadas pelos dois apps (`react.js` com o atalho `e`, `kanban.js`). |
| `src/styles/` | `theme.css` (tokens do Tailwind 4) e `fontes.css` (Inter e JetBrains Mono, servidas pelo sistema). |
| `src/lib/glob-local.js` + `src/generated/` | Registro dos arquivos de dados reais `*.local.js` (ver abaixo). |
| `scripts/` | `gerar-locais.mjs` (roda antes do dev e do build), `definir-senha.mjs`, `semear-rotina.mjs`. |
| `banco/schema.sql` | Estrutura do schema `sorelly` no Postgres. |
| `public/` | Arquivos servidos como estão (logo, fotos, `dados/kits-novos-curitiba.json`). |
| `docs/` | Negócio, padrão visual, decisões e operação (índice em `docs/README.md`). |

## Rotas e tela ativa

- `src/router/rotas.js` tem uma linha por tela: `pagina("slug", () => import("..."), "NomeExportado")`.
- O reducer guarda a tela ativa em `state.aba`. `useRotaAba` mantém URL e estado alinhados: a URL manda quando a página abre; menu, Voltar e Avançar mudam a URL; ações do reducer que trocam de tela empurram a URL junto; tela sem permissão corrige a URL com `replace`.
- O nome da tela na URL vem de `src/apps/montagem/router/slugs.js` (aba ↔ slug). O menu vem de `navigation/abas.js` e `navigation/setores.js`.

## Estado e dados

- **No navegador:** cada app tem um reducer (`state/reducer.js`) e salva o estado no `localStorage` (`sorelly_montagem_v9`). Mudou o formato do estado? Suba a versão salva e migre o que já existe.
- **Dados reais fora do Git:** arquivos `*.local.js` (ex.: `domain/pf-dados.local.js`) ficam só na máquina de quem tem os dados. `scripts/gerar-locais.mjs` lista os que existem em `src/generated/locais.js` antes do dev e do build; `lib/glob-local.js` entrega cada um à tela. Sem o arquivo, a tela usa os dados de demonstração.
- **No servidor (quando ligado):** `NEXT_PUBLIC_API_URL=/api` liga o login e a sincronização. Cada módulo (`rh`, `cf`, `ce`...) é guardado como um JSON na tabela `sorelly.estado_modulo` (`app/api/estado/[modulo]`): o navegador manda só as chaves que mudaram e consulta a cada 20 s. Os módulos sincronizados vêm de `lib/sync-modulos.js` (ou `NEXT_PUBLIC_MODULOS_SERVIDOR`).

## Login e permissões

- Login por e-mail e senha (`app/api/auth/login`), conferido na tabela `sorelly.usuario_login` ligada à tabela `"user"`. Devolve um JWT (12 h, `jose`, segredo em `JWT_SECRET`).
- `rota(fn)` em `src/server/http.js` exige login em toda rota que não seja pública e devolve erros no mesmo formato.
- Quem abre cada módulo: `src/server/permissoes.js` (por setor; perfil `ADMIN` = Diretoria abre tudo). A primeira gravação de um módulo (carga inicial) só a Diretoria faz.
- Esconder um setor no menu (`NEXT_PUBLIC_SETORES_LIGADOS`) é só visual; o bloqueio de verdade é a permissão no servidor.

## Visual

- Tailwind 4 compilado no build; tokens em `src/styles/theme.css`.
- Fontes (Inter e JetBrains Mono) em `src/styles/fontes.css`, servidas pelo próprio sistema.
- Ícones Phosphor (pacote `@phosphor-icons/web`), importados só pelo app principal; o app de Kits novos desenha SVG.
- As telas usam `React.createElement` (atalho `e` de `src/shared/react.js`), não JSX, e as peças do padrão visual (`components/padrao.js`, `components/padrao-fin.js`). Regras em [`design/PADRAO-VISUAL.md`](design/PADRAO-VISUAL.md).

## Qualidade

- `npm run lint`: ESLint com `next/core-web-vitals`. Erros param o CI; avisos de dependências de `useEffect` ficam como aviso (o código escolhe as dependências de propósito).
- `npm run verificar`: lint + build. É o que o GitHub Actions (`.github/workflows/ci.yml`) roda em todo PR e push no `master`.
- Cabeçalhos de segurança e `poweredByHeader: false` em `next.config.mjs`.

## Pendências conhecidas

- Dois itens do menu apontam para o mesmo endereço `/montagem/contas-a-pagar`: `ctalista` (Contas a pagar do menu do Financeiro, `ContasPagarLista.js`) e `contaspagar` (`ContasPagar.js`, usado pela Visão geral, pela Rotina do dia e pelo Limite de faturamento). A primeira rota ganha, então `ContasPagar.js` nunca aparece pela URL. Decidir qual tela fica e dar outro endereço à outra.
- `next` 14.2.x tem alertas de segurança que só são corrigidos no Next 15+. Atualizar é um passo à parte, com teste de todas as telas.
- Ver também "Limites conhecidos" em [`operacao/SUBIR-O-SISTEMA.md`](operacao/SUBIR-O-SISTEMA.md).
