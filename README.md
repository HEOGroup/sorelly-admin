# Sorelly Admin

Painel interno da Sorelly Joias (semijoias em consignação): financeiro, kits, representantes, cadastro de revendedoras, RH, agendamento e os apps de celular simulados. Next.js 14 (App Router) + React 18 + React Router 6 + Tailwind 4, com o servidor dentro do próprio Next.

## Rodar

Requisitos: Node 22.9+ (`.nvmrc`) e npm.

```bash
npm install
npm run dev          # http://localhost:3000
```

Sem `.env`, o sistema abre em modo local: sem login, dados de demonstração guardados no navegador.

Para ligar o servidor, copie `.env.exemplo` para `.env.local` e preencha:

| Variável | Para quê |
|---|---|
| `DATABASE_URL` | Postgres (schema `sorelly`, estrutura em `banco/schema.sql`). |
| `JWT_SECRET` | Texto longo e aleatório para assinar o login. |
| `DEVMASTER_API_URL` / `DEVMASTER_API_KEY` | Leitura de revendedoras do DevMaster (opcional). |
| `NEXT_PUBLIC_API_URL` | `/api` liga o login e a sincronização com o servidor. Vazio = modo local. |
| `NEXT_PUBLIC_MODULOS_SERVIDOR`, `NEXT_PUBLIC_SETORES_LIGADOS`, `NEXT_PUBLIC_ADMIN_ANTIGO_URL` | Quais módulos sincronizam, quais setores aparecem no menu e o atalho para o admin antigo. |

`NEXT_PUBLIC_*` são lidas na hora do build: mudou, gere de novo.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Sistema em modo de desenvolvimento. |
| `npm run build` / `npm run start` | Build de produção e servidor de produção. |
| `npm run lint` | ESLint (padrão `next/core-web-vitals`). |
| `npm run verificar` | Lint + build: o mesmo que o CI roda em cada PR. |
| `npm run definir-senha -- email "senha" <idDaPessoa> <setor1,setor2>` | Cria ou troca a senha de uma pessoa. |
| `npm run semear-rotina` | Carrega os itens da Rotina do dia no banco. |

Não rode `dev` e `build` ao mesmo tempo: os dois escrevem em `.next/`.

## Mapa

```
app/                  entrada do Next: layout, casca do sistema e rotas da API (app/api)
src/
├─ cliente.js         React Router no navegador
├─ router/rotas.js    tabela de rotas: uma linha por tela
├─ apps/montagem/     app principal (todos os setores)
├─ apps/kits-novos/   app de Kits novos (Curitiba)
├─ server/            login, permissões, estado dos módulos, Rotina do dia, DevMaster
├─ shared/            peças dos dois apps
└─ styles/            tema (Tailwind) e fontes
scripts/              gerar-locais (antes do dev/build), definir-senha, semear-rotina
banco/schema.sql      estrutura do banco
docs/                 negócio, padrão visual, decisões e operação
```

Detalhes em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

## Criar uma tela

1. Crie `src/apps/montagem/pages/MinhaTela.js` usando as peças de `components/padrao.js` (leia antes [`docs/design/PADRAO-VISUAL.md`](docs/design/PADRAO-VISUAL.md)):

   ```js
   import { e } from "@/shared/react";
   import { Pagina } from "@/apps/montagem/components/padrao";
   import { PageHead } from "@/apps/montagem/ui/page";

   export function AbaMinhaTela() {
     return e(Pagina, null, e(PageHead, { t: "Minha tela", sub: "Uma linha que diz para que serve." }));
   }
   ```

2. Uma linha em `src/router/rotas.js`:

   ```js
   pagina("minha-tela", () => import("@/apps/montagem/pages/MinhaTela"), "AbaMinhaTela"),
   ```

   Isso já deixa `/montagem/minha-tela` funcionando.

3. Para aparecer no menu: a aba em `navigation/abas.js`, o slug em `router/slugs.js` e a tela no setor certo em `navigation/setores.js`.

4. Registre o que mudou em `domain/versoes.js` (Tecnologia → Versões) e a decisão em [`docs/DECISOES.md`](docs/DECISOES.md).

## Qualidade e entrega

- Todo PR e push no `master` passa pelo GitHub Actions (`.github/workflows/ci.yml`): `npm ci`, lint e build. Com X vermelho, não faça merge.
- Rode `npm run verificar` antes de abrir o PR.
- O repositório é público: dados reais ficam só em arquivos `*.local.js` (fora do Git) e segredos só no `.env.local`.

## Documentação

Índice em [`docs/README.md`](docs/README.md): decisões, regras do negócio, padrão visual, prompts e como subir o sistema. A história da migração dos HTMLs para Vite está em [`docs/operacao/historico-migracao.md`](docs/operacao/historico-migracao.md); a versão Vite inteira está na tag `vite-final` do Git.
