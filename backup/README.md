# Sorelly Admin

Os dois HTMLs de página única viraram um projeto Vite + React + React Router,
com rotas de verdade, uma página por arquivo e carregamento sob demanda.

**Nada mudou na tela.** O DOM renderizado das 20 telas foi comparado caractere a
caractere com o dos HTMLs originais: idêntico (só variam relógios e cronômetros).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
npm run preview  # serve o dist/
```

---

## O que mudou, e por quê

| Antes | Agora |
|---|---|
| React 18 minificado colado dentro do HTML (~300 KB por arquivo, duas cópias) | `react` do npm, num chunk separado que o navegador cacheia uma vez |
| Tailwind compilado **no navegador** a cada carregamento (`@tailwindcss/browser`) | Tailwind compilado no build: um `.css` de 76 KB (12 KB gzip) |
| 2.005 registros da planilha numa linha de 1 MB dentro do HTML | `public/dados/kits-novos-curitiba.json`, buscado só quando alguém abre o app de kits |
| Todas as telas no mesmo arquivo, carregadas juntas | Uma página por arquivo, cada uma num chunk próprio |
| Tela ativa = `state.aba` (string no localStorage), sem URL | Rota real: `/montagem/consolidado`, `/kits-novos/pendencias` — dá para linkar, favoritar e voltar |
| 1 arquivo de 3.619 linhas + 1 de 1.030 | 101 arquivos, o maior com ~250 linhas |

O corpo das funções não foi reescrito: elas continuam em `React.createElement`,
recortadas dos originais e movidas para módulos ES. O que se acrescentou foram
os `import`/`export` e a camada de rotas. Isso é o que garante que o resultado
seja idêntico — e não impede escrever as telas novas em JSX, os dois convivem.

---

## Mapa do projeto

```
src/
├─ main.js                    entrada: monta o router
├─ router/
│  ├─ rotas.js                TABELA DE ROTAS — uma linha por página
│  └─ use-rota-aba.js         sincroniza URL <-> state.aba dos dois apps
├─ styles/theme.css           @theme, :root e .dark (copiados do HTML original)
├─ shared/react.js            `e = React.createElement` e os hooks
└─ apps/
   ├─ montagem/               montagem e bipagem — 15 telas
   │  ├─ App.js               casca: menu por setores, cabeçalho, <Outlet/>
   │  ├─ pages/               UMA TELA POR ARQUIVO
   │  ├─ components/          pedaços reusados entre telas (Fila, diálogos, …)
   │  ├─ mobile/              os apps de celular simulados
   │  ├─ ui/                  Icon, Btn, Modal, Card, KPI, tabela…
   │  ├─ domain/              equipe, regras, configuração, dados de exemplo
   │  ├─ state/               Ctx, store, reducer
   │  ├─ navigation/          abas, setores, marcas, perfis
   │  ├─ router/slugs.js      aba <-> pedaço da URL
   │  └─ styles/montagem.css  CSS dos apps de celular (`.app-claro`)
   └─ kits-novos/             kits novos Curitiba — 5 telas (mesma estrutura)
      └─ data/dados.js        busca o .json da planilha
referencia/                   os dois HTMLs originais, intactos
```

**Por que cada app tem seu próprio `ui/`:** os dois kits são quase iguais, mas
não são iguais. O `Icon` do montagem usa Phosphor; o do kits desenha SVG inline.
`KPI` e `TH` também divergem. Unificar hoje mudaria o visual de um dos dois —
então ficaram separados, e a unificação é um passo à parte, quando fizer sentido.

---

## Criar uma página nova

1. `src/apps/montagem/pages/MinhaTela.js`:

   ```js
   import { e } from "@/shared/react";
   import { PageHead } from "@/apps/montagem/ui/page";

   export function MinhaTela() {
     return e(PageHead, { t: "Minha tela", s: "Descrição" });
   }
   ```

   (ou em JSX, se preferir — renomeie para `.jsx`.)

2. Uma linha em `src/router/rotas.js`:

   ```js
   pagina("minha-tela", () => import("@/apps/montagem/pages/MinhaTela"), "MinhaTela"),
   ```

3. Para ela aparecer no menu: acrescente a aba em
   `src/apps/montagem/navigation/abas.js`, o slug em
   `src/apps/montagem/router/slugs.js` e a tela no setor certo em
   `navigation/setores.js`.

O passo 2 sozinho já deixa `/montagem/minha-tela` funcionando — útil para
páginas dedicadas que não entram no menu.

---

## Como as rotas conversam com o estado

O reducer dos dois apps continua guardando `state.aba`, porque várias ações
trocam a tela por conta própria (`LOGIN` manda a montadora para Listagens,
`ABRIR_CALC` abre a calculadora). `useRotaAba` mantém os dois lados alinhados:

- **URL manda na montagem.** Um link aberto do zero ganha da última aba salva
  no localStorage.
- **Menu, Voltar e Avançar** mudam a URL, e o estado segue.
- **Ações do reducer** que trocam a aba empurram a URL junto.
- **Aba sem permissão** para o perfil logado: a URL é corrigida com `replace`,
  sem sujar o histórico.

## Conferir contra o original

`referencia/` tem os dois HTMLs como estavam. Abra um no navegador, abra a
versão nova ao lado e compare. Em desenvolvimento, `window.__router` deixa
navegar pelo console sem recarregar:

```js
await window.__router.navigate("/montagem/equipe");
```

---

## Notas da migração

**Duas funções chamadas `B`.** No HTML do montagem havia `function B(n)` (formata
moeda, linha 177) e, 2.700 linhas depois, `function B(nome)` (monta um item "em
breve" do menu). No mesmo escopo, a segunda apagava a primeira — ou seja, a de
moeda nunca era chamada. Em módulos separados o conflito deixa de existir: a de
moeda está em `apps/montagem/lib/format.js` e a do menu em `navigation/setores.js`.
Nenhum comportamento mudou; só vale saber que `B` de moeda continua sem uso.

**Um token de tema divergia.** No escuro, `--muted-foreground` era
`oklch(0.86 0 0)` no montagem ("textos secundários quase brancos, a pedido") e
`oklch(0.68 0 0)` no kits. O tema base ficou com o valor do kits e o montagem
sobrescreve o token via `html.dark.app-montagem`, classe que o `App.js` daquele
app põe e tira do `<html>`.

**Phosphor só no montagem.** Os ícones Phosphor (~320 KB de fonte) são carregados
pelo CSS do app de montagem, não pelo `index.html`. O app de kits desenha SVG
inline e não baixa nada disso — como no HTML original dele.

## Medições

Mesmo servidor, com gzip, cache limpo, 1440x900:

| | HTML original | Projeto novo |
|---|---|---|
| **montagem**, `domInteractive` | 279 ms | 77 ms |
| **montagem**, carregamento completo | 311 ms | 240 ms |
| **kits novos**, `domInteractive` | 346 ms | 89 ms |
| **kits novos**, carregamento completo | 454 ms | 160 ms |
| **kits novos**, total transferido | 311 KB | 278 KB (118 KB são o .json) |

O salto no `domInteractive` vem de não compilar mais o Tailwind no navegador.
O total transferido cai pouco na primeira visita porque fontes e ícones
dominam; na segunda visita a diferença é maior, já que agora os pedaços são
arquivos com hash e o navegador só rebaixa o que mudou — antes, qualquer
alteração invalidava o HTML inteiro.
