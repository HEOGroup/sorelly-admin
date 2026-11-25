# Padrão visual do Sorelly Admin (vale desde 25/11/2026)

Fonte da verdade: as 4 telas do Financeiro que o Marcus aprovou em 17 a 24/11/2026.
Medido no navegador (tamanhos reais). Quando o texto e a tela discordarem, vale a TELA.
O padrão anterior (13 px, linha de 32 px) está em `docs/arquivo/design-antigo-25-11/`. Não usar.
Pendências e propostas: `docs/pendencias/design-system.local.md`.

| Tela modelo | Endereço | Arquivo |
|---|---|---|
| Contas a pagar (referência principal) | `/financeiro/contas-a-pagar` | `pages/ContasPagarLista.js` |
| Contas a receber (clone da a pagar) | `/financeiro/contas-a-receber` | `pages/ContasReceberLista.js` |
| Home da família | `/financeiro/ff-home` | `pages/FinFamiliar.js` |
| Negociações | `/financeiro/pf-negociacoes` | `pages/pf/NegAbas.js` e `Negociacoes.js` |

## 1. Medidas (planilha compacta)

| Elemento | Medida | Observação |
|---|---|---|
| Fonte | Inter | Uma só em todo o sistema |
| Título da tela | 13 px, negrito 700, branco, 20 a 24 px de altura | O único texto de 13 px da tela |
| Texto da tabela | **10 px**, normal 400 | Home da família usa 11 px |
| Cabeçalho da tabela | **10 px**, negrito 700, fundo `#1F3358` | Home e Negociações usam 11 px |
| Altura da linha | **18 px** (Contas a pagar e a receber) | Home da família 20 px, Negociações 24 px |
| Altura do cabeçalho | 18 px (Contas) · 20 a 25 px (Home, Negociações) | |
| Padding da célula | 0 por 5 px | |
| Campo, seletor e botão | **18 px de altura**, 10 px, branco, fundo branco a 10% | Peso 500 ou 600 |
| Alinhamento | **Tudo centralizado** | |
| Escrita | **Normal, sem caixa alta** | Regra do Marcus de 20/11/2026 |

## 2. Cores

| Uso | Cor |
|---|---|
| Fundo da página | cinza quase preto, `oklch(0.17 0 0)` |
| Texto | branco (`oklch(0.95 0 0)` ou `#FFFFFF`). Nunca cinza |
| Fundo da célula | `#1F3358` a 38% de opacidade |
| Linha alternada / destaque | `#19263D` |
| Cabeçalho | `#1F3358` sólido |
| Valor que entra | verde `#4ADE80` |
| Valor que sai | vermelho `#F87171` |
| Rótulo de filtro | âmbar `oklch(0.76 0.14 75)` |
| Grupos de colunas (Negociações) | verde-água `#2DD4BF` a 10, 16 e 24% |

Cor só para estado: verde entra, vermelho sai, âmbar rótulo. Sem dourado decorativo.

## 3. Estrutura da tela (sempre completa)

1. Título (13 px, negrito).
2. **Barra em forma de tabela, colada no topo da tabela**: cada controle é uma célula com o RÓTULO em cima (negrito, fundo azul) e o CONTROLE embaixo (campo ou seletor de 18 px). Ordem de Contas a pagar: Buscar, Período, Visão, Contas, Pessoa, Colunas.
3. **Tabela completa** com linha de cabeçalho e linhas de dados. Filtro e ordem de cada coluna: clique no nome da coluna.
4. Rodapé da tabela: total, contagem e paginação.

Sem faixa de blocos de totais no topo. Sem bloco "Filtros" separado.

## 4. Linhas da tabela (estilo planilha)

| Item | Valor |
|---|---|
| Borda | **Branca fina**: 0,8 px, branco a 30%, no lado direito e embaixo de TODA célula |
| Colapso | `border-collapse: collapse` |
| Cabeçalho | Mesma borda, texto negrito |
| Linha sem borda lateral esquerda ou superior | Só direita e embaixo, para não dobrar a linha |

## 5. Regras de conteúdo

- Todo valor em reais com **R$**.
- Nada abreviado, sem reticências. Se não cabe, a coluna alarga.
- Escolha em lista = menu suspenso. Sem chips nem pílulas.
- Sem texto explicativo na tela.
- **Sem letra maiúscula** em título, coluna, rótulo e total. Única exceção aprovada (23/11/2026): o título grande da Entrada do setor.
- Anel tem TAMANHO (nunca "aro").

## 6. Peças (não copiar dentro da tela)

| Peça | Arquivo | Uso |
|---|---|---|
| Página e bloco | `components/padrao.js` (`Pagina`) · `components/bloco-painel.js` (`BlocoPainel`) | Casca da tela e bloco com título azul |
| Planilha compacta | `components/planilha-cheia.js` | `PAGINA_CHEIA`, `BarraTabela`, `CelulaBarra`, `BuscaMini`, `CampoMini`, `CLS_FINA_ESPACO`, `refCheia` |
| Tabela | `components/tabela-planilha.js` (`TabelaPlanilha`) | TODA tabela, com filtro e ordenação no cabeçalho |
| Menu de várias opções | `components/padrao-fin.js` (`MenuMulti`) | Ex.: escolher as colunas |

Atenção: `padrao-fin.js` (`Botao`, `CAMPO`, `CampoSel`) e a `TabelaPlanilha` sozinha ainda nascem no visual antigo (32 px, 13 px, caixa alta). O compacto só aparece com a receita abaixo.

## 7. Receita: tela nova no padrão

Copiado de `pages/ContasPagarLista.js` (linhas 310 a 323). O `[&_*]:!normal-case` e o `semCaixaAlta` vêm de `pages/pf/Resumo.js` (linhas 618 e 642).

```js
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { PAGINA_CHEIA, CLS_FINA_ESPACO, BarraTabela, CelulaBarra, CampoMini, BuscaMini, refCheia } from "@/apps/montagem/components/planilha-cheia";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";

return e(Pagina,{className:PAGINA_CHEIA+" [&_*]:!normal-case"},
  e(BlocoPainel,{titulo:"Contas a pagar", compacto:true},
    e(BarraTabela,null,
      e(CelulaBarra,{rotulo:"Buscar"}, e(BuscaMini,{valor:busca, aoMudar:setBusca, rotulo:"Buscar nas contas"})),
      e(CelulaBarra,{rotulo:"Visão"}, e(CampoMini,{valor:vista, aoMudar:setVista, rotulo:"Visão", ops:[["lista", "Separado"], ["dia", "Total"]]}))),
    e("div",{ref:refCheia(), className:CLS_FINA_ESPACO},
      e(TabelaPlanilha,{fina:true, grade:true, semCaixaAlta:true, semContagem:true, semLimpar:true, semMao:true,
        cols:cols, linhas:linhas, chave:"id", alturaMax:"calc(100vh - 6.6rem)", limite:6000, totalRodape:rodape, vazio:"Nenhuma conta."}))));
```

| Parte | O que escrever | O que ela garante |
|---|---|---|
| Coluna | `{k:"valor", t:"Valor", fmt:BKC}` e `cor:function(l){ return "text-success"; }` | R$ no valor; verde entra (`text-success`), vermelho sai (`text-destructive`) |
| `PAGINA_CHEIA` | na `Pagina` | Tela colada nas bordas; linha branca a 30% |
| `BlocoPainel` com `compacto:true` | em volta da barra e da tabela | Título azul de 13 px; cabeçalho `#1F3358`; borda branca nas células |
| `CLS_FINA_ESPACO` + `refCheia()` | na `div` em volta da tabela | Letra 10 px, linha 18 px, padding 5 px |
| `fina:true, grade:true` | na `TabelaPlanilha` | Linha fina e borda em toda célula |
| `BuscaMini`, `CampoMini` | dentro de `CelulaBarra` | Controle de 18 px, letra 10 px |

Não escreva tamanho de letra nem altura na tela. Se a peça não dá o tamanho certo, a pendência é da peça.

## 8. Obrigatório, variante, exceção e legado

| Tipo | O que é | Exemplo |
|---|---|---|
| **Obrigatório** (tela nova ou mexida) | Texto 10 ou 11 px; título 13 px. Controle e linha de 18 a 24 px. `TabelaPlanilha`. Tudo no centro. Sem caixa alta, cinza, reticências, chips, faixa de totais, bloco "Filtros", `clamp`/`vw`, `text-sm`. R$ em todo valor | A receita da seção 7 |
| **Variante permitida** (já existe em tela modelo) | Letra 11 px e linha 20 px. Linha 24 px. Padding 1 px (`CLS_FINA`) ou 5 px (`CLS_FINA_ESPACO`). Tabela sem filtro na coluna (`semFiltro:true`): só a Home da família usa; confirmar com o Marcus antes de repetir | Home da família: `CLS_FINA_ESPACO+" [&_table_td]:!text-[11px] [&_table_th]:!text-[11px] [&_table_th]:!h-[20px]"` com `style:{"--lh":"20px"}` |
| **Exceção aprovada** | Só com o Marcus de acordo. Comentário `padrao-ok: motivo e data` na linha | Total do pedido com letra de 14 px (Negociações, 21/11/2026) |
| **Legado** | Telas e peças antigas: 13 px, 30/32 px, caixa alta. Não copiar. A trava deixa passar só em arquivo que já existia | Montagem, Representantes, `padrao-fin.js` |

## 9. Erros que se repetem

| Erro | Causa na cadeia | O que impede agora |
|---|---|---|
| Letra grande ou tamanhos misturados | A trava só via `text-[Npx]`; `text-sm` e `text-lg` passavam. A peça nasce com 13 px | Regras 2 e 2n da trava. Peça compacta conferida sempre (2g) |
| Linha, campo ou botão alto | A trava exigia 32 px e reprovava 18 a 24 px. Cada tela compacta virava exceção | Regra 3 nova. Arquivo novo não aceita 30/32 px |
| Caixa alta volta | As peças nascem em caixa alta. A decisão de 20/11 não estava na trava | Regra 2o (caixa alta nova reprova). Pendência: peças sem caixa alta |
| Texto cinza | A trava só via `text-gray-500`; o cinza do tema passava | Regra 4b |
| Dourado volta | A trava exigia degradê dourado numa peça e falava "topo dourado" | Exigência retirada. Regras 2l e 2k |
| Borda dupla, grossa ou ausente | A borda vem de 3 lugares (tabela, bloco, `grade`). Fora do `BlocoPainel` ela some | Receita (seção 7). Linha branca conferida na peça (2g). Teste de medidas |
| Blocos desalinhados ou de alturas diferentes | A trava lê texto; não mede a tela | Só 2 telas travadas (2m). Teste de medidas. Pendência |
| Texto cortado | Peças antigas cortam por dentro (`truncate` em `Botao`, `Rotulo`, `Td`) | Regra 2c. Usar as peças compactas |
| Regra antiga reaparece | Trava, guia de escrita e comentários das peças diziam coisas diferentes | Hook manda ler só este arquivo. Contradições listadas nas pendências |
| Exceção vira costume | `padrao-ok` solta a linha inteira de todas as regras | `npm run padrao` conta e lista as exceções |

## 10. O que ainda falta definir (o Marcus disse: "ainda tem coisas a melhorar")

| Ponto | Situação |
|---|---|
| Altura única da linha (18, 20 ou 24 px) | Hoje varia por tela. Falta escolher um valor |
| Telas fora do Financeiro (Montagem, Representantes) | Ainda no visual antigo. Falta decidir se passam para este padrão |
| Peças compactas por padrão | Proposta escrita nas pendências. Falta aprovar |
| Medidas da janela (modal) de pagamento | Botão principal de 28 px e letra de 13 px. Não está no padrão |

Decidido em 20/11/2026: rótulo de filtro, título e cabeçalho ficam SEM caixa alta. Os que ainda aparecem em caixa alta nas telas modelo são legado a corrigir.

Atualizar este arquivo SEMPRE que o Marcus aprovar uma mudança de tela.
