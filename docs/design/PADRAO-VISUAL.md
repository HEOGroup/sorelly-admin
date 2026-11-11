# Padrão visual do Sorelly Admin

Modelo: a tela **Visão geral**. Toda tela nova (e toda tela que for mexida) segue isto. Ver ao vivo em **Tecnologia → Padrão visual**.
Código das peças: `src/apps/montagem/components/padrao.js` (Pagina, Indicador, Faixa, Tab, Td) e `components/equipe-blocos.js` (BlocoBarra).

## VALE HOJE · TABELA E FILTRO (11/11/2026) — se algum texto abaixo disser outra coisa, ele é antigo e este bloco vence
1. **UMA peça de tabela:** `TabelaPlanilha` (`components/tabela-planilha.js`). Referência pronta: `pages/inad/Dividas.js` (`escura` e `grade` já são o padrão).
2. **Visual:** cabeçalho ESCURO (layout D de 06/11/2026), **sem dourado**, tudo centralizado, nada abreviado (sem "…"), todo valor com R$, cor só para estado.
3. **Filtro e ordenação ficam no cabeçalho de cada coluna**, igual ao Google Planilhas (Ordenar de A a Z, de Z a A, Buscar, lista de valores com caixa, Limpar). **Nunca** bloco "Filtros" nem busca no topo da tela.
4. **Em tela nova ou mexida a trava dura reprova:** `TabelaCampos`/`FileiraCampos`, `TabelaP`, `Tab`/`Td`, `<table>` à mão, `dourada:true`, `BlocoFiltros`/`BarraFiltros`, bloco "Filtros", `CampoBusca` e botão "Filtrar" no topo (regras 2e, 2h, 2j, 2k, 2l em `scripts/padrao-regras.mjs`; teste: `node scripts/testar-trava-padrao.mjs`).
5. **Telas antigas** só mudam quando forem mexidas. As seções abaixo que ainda falam de "filtros no topo", "topo dourado" ou `TabelaCampos` como peça única estão marcadas como SUBSTITUÍDAS.

## Regras
0. **Sem espaço vazio e sempre responsivo.** Blocos de alturas diferentes se encaixam como tetris (`Mosaico`), com número de colunas que muda sozinho conforme a largura; nunca duas colunas fixas com buraco embaixo, nunca barra de rolagem dentro de bloco, nada fica solto ou flutuando (ex.: dois números "no ar" numa grade de 2 colunas) e nada fica atrás do menu ao redimensionar.
1. **Tudo centralizado.** Número, nome, cabeçalho e célula. Nada solto, nada alinhado só à direita.
2. **Número sempre dentro de um Indicador** (número grande colorido + nome pequeno embaixo) ou de uma célula `Td`. A casca `Pagina` faz os números correrem de zero até o valor ao abrir a tela e quando mudam.
3. **Compacto.** Espaço curto entre blocos (`gap-2.5`), linhas baixas, tela já abre mostrando o que importa. Sem faixa de indicadores no topo (proibida em 02/11/2026, regra 5 do Financeiro).
4. **Cores.** Uma cor por setor para barras, botões e cartões (Financeiro = azul, Agendamento = roxo, geral = ouro). Verde / amarelo / vermelho SÓ para estado (pago, vencendo, atrasado). As cores de estado estão em `ESTADO` (padrao.js).
5. **Blocos** (`BlocoBarra`) abrem e fecham clicando na barra; título centralizado; `compacto:true` nas telas densas.
6. Letras brancas (não cinza), tema escuro com dourado. Dinheiro como `R$ 7.000,00`. Apps do celular: cores sólidas, sem degradê.
7. Menos texto explicativo na tela, mais ícones e leitura limpa.

8. **Já vem pronto em toda tela (não refazer):** arrastar tabelas para o lado clicando no vazio e segurando (`lib/atalhos-tela.js`), busca **Ctrl+F** do sistema (`components/busca-tela.js`), botão **Voltar** no topo e **tique sonoro** nos números que sobem (`lib/contagem-tela.js`, som `contar` em `lib/sons.js`).
9. **Dinheiro:** sempre o componente `Dinheiro` (padrao.js): só números, sem vírgula (`100000` vira `R$ 1.000,00`). `out:"ptbr"` devolve "1000,50"; `out:"ponto"` devolve "1000.50".
10. **Navegação:** o que se clica leva à tela dele (`Indicador` com `ir:"aba"`, ou botão), e o botão Voltar do topo retorna.
11. **Tamanho:** bloco de valor nunca gigante: número até 20px (`Indicador` já é assim). Nada de cartão enorme só para um número.
12. **Texto formal:** títulos, subtítulos, botões e etiquetas com inicial maiúscula e linguagem de sistema ("Valores solicitados pelo Financeiro", não "o que o financeiro pediu..."). `BlocoBarra` e `Indicador` já colocam a inicial em maiúscula.
13. **Registro de versões:** ao terminar qualquer trabalho, acrescente uma entrada no topo de `domain/versoes.js` (aparece em Tecnologia → Versões).

14. **Fluxo por etapas = Kanban.** Tudo que anda por etapas (aprovação de cadastros, kits novos, indicações, resgates...) usa o `Kanban` de `src/shared/kanban.js`: colunas por etapa, cartões que se arrastam de uma coluna para outra (e "Mover para…" no celular), e botão "Concluir ›" no cartão que avança sozinho. Nada de lista longa de formulário descendo a tela: ou Kanban ou planilha. Cada coluna mostra 30 cartões e "Ver mais".
15. **Sem tela de entrada.** O sistema já abre aberto (como o Marcus); a troca de pessoa é só no seletor de acesso do topo. Os apps de celular simulados também abrem direto no app.

16. **Degradê claro** em barras, blocos de situação e cartões (`degrade(cor)` do padrao.js; `Indicador` já usa): do tom do setor para quase transparente, com fio fino; nunca cor chapada pesada. Apps de celular seguem em cor sólida.
17. ~~Filtros numa barra única (`BarraFiltros`)~~ **SUBSTITUÍDO em 11/11/2026:** filtro e ordenação ficam no cabeçalho de cada coluna da `TabelaPlanilha` (ver "VALE HOJE · TABELA E FILTRO" no começo e a seção "FILTRO SÓ NAS COLUNAS" no fim). `BarraFiltros` não se usa mais.
18. **Janela em colunas** (`Janela`): detalhe, edição e cadastro abrem largos, com colunas lado a lado (dados | etapas | ações); nunca formulário comprido descendo. O que já foi preenchido passa para o lado como concluído.
19. **Menos telas, mais abas** (`Abas`): várias visões ficam numa tela só do menu; configurador só no Configurador geral; cada número tem UMA fonte.
20. **Ícones no lugar de texto** quando o significado é claro; texto curto; um botão principal por tela; estados vazios formais e curtos.
21. **Não acrescentar o que não foi pedido.** Ao terminar: mostrar funcionando no navegador, limpar o localStorage de teste e registrar em `DECISOES.md` e `domain/versoes.js`.

## TRAVA DURA (29/10/2026): o padrão é conferido por código, não só por leitura
O Marcus mediu: 135 telas com 10 tamanhos de fonte diferentes, mesmo com este documento. Por isso as regras que dá para conferir em texto viraram código em `scripts/padrao-regras.mjs` e rodam em três lugares:
| Onde | Quando | O que acontece |
|---|---|---|
| Hook do Claude Code (`scripts/hook-padrao.mjs`) | A cada Edit/Write em tela | Devolve o erro na hora; o Claude corrige antes de seguir |
| `npm run padrao` (dentro de `conferir`, `verificar` e do CI) | Antes de subir e em todo PR/push | Reprova o que mudou em relação à master |
| Fotos de referência (`tests/fotos`, Playwright) | Em todo PR/push | Tira a foto das telas aprovadas e reprova se mudou |

**O que o código reprova:** texto fora de 11 e 13 px (14 a 20 px só em número, na linha com `tabular-nums`, `brl(`, `din(` ou `MONO`); `clamp`/`vw`; acima de 20 px; campo/botão/linha com h-6, h-7, h-9, h-10, h-11, h-12 ou altura em px diferente de 30/32; texto cinza (`text-gray-*`, `text-white/40` ou menos); tela nova em `pages/` sem importar `padrao.js` ou `padrao-fin.js`.
**O que fica por conta das fotos:** R$ em todo valor, centralizado, compacto, alinhado.
**Exceção:** comentário `padrao-ok` na linha, só com o Marcus de acordo. **Telas antigas:** só o que for mexido precisa ficar no padrão; a lista completa sai de `npm run padrao:relatorio`.
**Telas com foto:** Visão geral, Faturamento, Contas a pagar e Padrão visual (lista em `tests/fotos/telas.spec.mjs`). Aprovar uma foto nova: GitHub → Actions → "Fotos de referência" → Run workflow. No PC, `npm run fotos` precisa de `FOTOS_EMAIL`/`FOTOS_SENHA` no `.env.local`.

## Menu, barra do topo e cores (módulo novo)
- Setor = item da barra lateral; área = botão da barra de cima; tela = item do menu da área. Tudo em `navigation/setores.js` (helpers T, G, Ti), nomes em `abas.js`, endereço em `router/slugs.js` e `src/router/rotas.js`, acesso por setor em `navigation/perfis.js`. Passo a passo no README.md.
- **MENU DO SETOR, padrão de 22/10/2026 (opção 3, aprovada pelo Marcus; padronização de 26/10/2026: já vale em TODO setor com várias telas — Financeiro, Agendamento, Cadastro de revendedoras, Representantes & Kits, Encomendas e reposições, RH, Atendimento interno, Materiais & Estoque, Garantia & Pós-venda, Diretoria, Jurídico, Segurança e limpeza, Marketing e Tecnologia).** Cada setor tem o campo `menu` em `navigation/setores.js`: lista de nós `{nome, aba?, itens?, perm?}` (ajudante `M(nome, aba)`). A peça é `components/barra-menu.js`. De cima para baixo:
  1. **Faixa do sistema:** botão Voltar, ícone do setor e **nome do SETOR** (ex.: "Financeiro") — nunca o nome da tela aberta. Fixo: não muda com a tela nem com as abas.
  2. **Telas abertas:** chips das últimas telas (máximo 5, com ×); a tela atual fica dourada.
  3. **Menu em texto:** palavras com listas em cascata (linhas de 30 px, item aberto dourado) e a busca "Buscar tela…" na ponta.
  4. **Tela:** título + subtítulo à esquerda; à direita o seletor de visão (Segmentado) e UM botão principal.
- **Regras do menu:** (a) as palavras seguem a **ordem do fluxo** do setor; (b) setor com poucas telas usa palavras diretas, **sem lista e sem a faixa de telas abertas** (campo `semAbas:true` no setor; ex.: Encomendas e reposições = 6 palavras sempre visíveis, então não precisa de chips); (c) setor com muitas telas agrupa em listas, no máximo 2 níveis; (d) **nada de botões coloridos por área**: a cor do setor aparece só no ícone; (e) setor sem `menu` cai no menu automático das áreas (`menuAuto` em App.js: área com uma tela só vira palavra direta). O agrupamento antigo `GRUPO_BARRA` (opção D) não vale para setor com `menu`.
- **REGRA FIXA (26/10/2026, Marcus): a faixa de cima NUNCA se mexe.** O bloco das 4 linhas acima (Faixa do sistema → Telas abertas → Menu → Tela) tem altura fixa, não importa o setor nem a tela: (1) a Faixa do sistema mostra sempre o NOME DO SETOR, nunca o nome da tela — a tela aparece como aba, na linha 2; (2) a faixa de Telas abertas guarda o espaço dela (31 px) mesmo com ZERO abas abertas (fechou a última aba: o Menu não sobe); isso é automático porque as 4 linhas são uma peça só (`components/barra-menu.js` + o cabeçalho de `App.js`) usada por TODO setor que tem `menu` — não precisa mexer tela por tela.
- Cor: UMA por setor (campo `cor` do setor). Não inventar cor por área nem por tela.

## Como terceirizar (funcionário criando um sistema do zero)
- Quem trabalhar **dentro deste repositório com o Claude Code** não precisa colar nada: o `CLAUDE.md` já manda ler este arquivo. Basta dizer o que quer criar.
- Quem usar outra ferramenta (ou um projeto à parte) cola o **prompt** de Tecnologia → Padrão visual no começo da conversa e escreve o que quer criar.
- Entregue a quem for criar: o acesso ao repositório, o link do ambiente de teste e a tela **Padrão visual** aberta. Ao receber o trabalho, confira: centralizado, compacto, sem buracos, responsivo, uma cor, textos formais, versão registrada.

## Como montar uma tela
```
e(Pagina, null,
  e(PageHead, {t:"Título", sub:"uma linha"}),
  e(Faixa, {n:3}, e(Indicador,{t:"A pagar", v:brl(x), cor:"total"}), e(Indicador,{t:"Pago", v:brl(y), cor:"ok"}), e(Indicador,{t:"Falta", v:brl(z), cor:"ruim"})),
  e(BlocoBarra, {cor:"azul", t:"Nome", compacto:true}, e(Tab, {cols:["A","B"]}, linhas com Td)))
```
Se precisar de uma peça nova que sirva para vários módulos, crie em `padrao.js` e mostre em `pages/PadraoVisual.js`; não copie dentro da tela.

## Prompt para sistema novo (Tecnologia → Padrão visual → aba "Prompt para novos sistemas")
Fica pronto para copiar em **Tecnologia → Padrão visual** (botão "Copiar prompt", texto em `PROMPT` de `pages/PadraoVisual.js`). Cole no começo da conversa de qualquer módulo novo e escreva o que quer criar. Melhorou uma regra? Atualize este arquivo E o `PROMPT`.

## Situação (16/10/2026)
Já no padrão: Lançamento de pagamentos (fornecedores), Controle de pagamentos (indicadores), indicadores do Financeiro familiar e da Cobrança. Falta migrar: Resumo do mês, Negociações, Maquininha, Fornecedores, Comissões, Cobrança e Financeiro familiar (tabelas) e demais telas.

## Cor fixa de cada fornecedor (pedido do Nickolas, 20/10/2026)
Identificar os fornecedores com etiquetas coloridas: o nome do fornecedor em branco sobre o fundo da cor. Sempre que o fornecedor aparecer no sistema mantém a MESMA cor, com o nome visível, para facilitar a conferência:
- Pontual = azul · Mega Sul = verde · Point = laranja · Art Ello = roxo · Ellos Galv. = vermelho · Xangai = verde-água (turquesa).
- Ao selecionar um fornecedor, ele fica no ALTO da tela (etiqueta grande) e as barras principais usam a cor dele.
- No código: `corForn` e `Etiqueta` em `pages/pf/ui.js` (lista `FORN_CORES`). Fornecedor sem cor definida aparece com contorno simples; para um novo fornecedor ter cor, acrescentar uma linha em `FORN_CORES`.

## REGRA FIXA · compacto e alinhado (Marcus, 21/10/2026) — vale para TODA tela nova ou mexida
1. **Bloco compacto.** Se o conteúdo é pouco, o bloco ENCOLHE. Nunca linha alta (py-2, py-3) com um valor só, nem uma lista de 5 linhas onde cabem 2 colunas. Resumos de rótulo + valor vão em GRADE de 2 colunas (ou faixa horizontal), linhas de `py-1.5` no máximo. Menos espaço vazio, menos rolagem.
2. **O texto sempre cabe dentro do campo ou do bloco.** Proibido texto cortado ("Minha conta (não inform…"), botão com rótulo estourando, número saindo da célula. A largura do campo é a do MAIOR texto que ele pode ter; rótulo de opção é encurtado ("Não informar", não "Minha conta (não informar)"); nome comprido recebe `truncate` + `title`, nunca estoura o bloco.
3. **Tudo alinhado.** Formulários em grade: mesma altura (h-9), rótulos pequenos em cima, campos e botão na MESMA linha, nada solto nem degrau. Tabelas: nome à esquerda, números centralizados ou à direita sempre na mesma coluna.
4. **Conferir antes de entregar:** abrir a tela no navegador, olhar a largura comum (~1000 px) e a larga, e só entregar se nada cortar, nada ficar espaçado demais e nada desalinhar.

## REGRA FIXA · padrão do Financeiro: tamanhos fixos, R$ em todo valor (Marcus, 22/10/2026; o item 1, "filtros no topo", foi SUBSTITUÍDO em 11/11/2026)
0. **Fonte: Inter (escolhida pelo Marcus em 22/10/2026), corpo de 13 px nas telas do Financeiro.** Números na mesma fonte, com algarismos tabulares (`tabular-nums`). Títulos na Inter (a fonte mono saiu dos títulos). Segunda tela de referência: `pages/ContasPagarLista.js`.
Aprovado pelo Marcus. Vale para toda tela nova ou mexida (começando pelo Financeiro). Estudo completo: `DESIGN-SYSTEM-ESTUDO-COMPLETO.md` e `GUIA-DE-ESCRITA-E-TIPOGRAFIA.md`; peças em `components/padrao-fin.js`; tela de referência: `pages/Faturamento.js`.
1. ~~Filtros no topo da tela~~ **SUBSTITUÍDO em 11/11/2026: o filtro fica no cabeçalho de cada coluna, nunca no topo (seção "FILTRO SÓ NAS COLUNAS", no fim).** Texto antigo: bloco "Filtros" logo abaixo do título, em **grade de 4 colunas iguais** (2 no celular), rótulo em cima do campo. Busca ocupa 2 colunas; botões Limpar e Filtrar à direita da última linha. Nada de filtro na lateral, em gaveta ou espalhado. Sem seletor Sorelly/Família na barra (isso é do menu). Tela sem filtro não mostra o bloco.
2. **Tamanhos fixos.** Campo, seleção, busca e botão: altura **32 px** (`h-8`); botão largura mínima 96 px. Texto 13 px. Linha de tabela 32 px, cabeçalho 30 px (11 px, caixa alta). Rótulo de campo: 11 px, uma linha, até 18 letras.
3. **O espaço manda no texto. (CANCELADO em 02/11/2026: ver "REGRA FIXA · tabelas" no fim; nada é abreviado com "…".)** Texto que não cabe corta com "…" em uma linha e aparece inteiro ao passar o mouse (`title`); campo, bloco e botão não crescem nem quebram de linha. Coluna de data 90 px; coluna de valor 130 px (nunca corta: a coluna cresce); coluna de texto ocupa o que sobra.
4. **Todo valor em reais leva "R$"**, em frase, indicador, tabela e célula (R$ 99.719,05 · −R$ 83.307,03). Acertos e percentuais não levam R$. Fonte tabular. (O "números à direita, texto à esquerda" foi CANCELADO em 02/11/2026: tabela inteira centralizada.)
5. **SEM faixa de totais e SEM blocos de números no topo da tela (Marcus, 02/11/2026: "nunca mais").** A tela começa pelo título e depois a tabela ou o quadro (o filtro fica no cabeçalho das colunas). Total que importa vai no rodapé da tabela ou numa linha de resumo dentro do bloco, nunca numa faixa de cartões acima de tudo. **Exceção aprovada pelo Marcus (02/11/2026): `BlocoResumo` (`components/bloco-resumo.js`), bloco com título e LINHAS ESCRITAS (rótulo, quantidade, percentual), até 3 lado a lado em cima da tela Metas › Revendedoras. A fila de cartões com um número cada continua proibida.** `FaixaTotais` e `Faixa` não são mais usadas: a TRAVA DURA (`scripts/padrao-regras.mjs`, regra 2b) reprova qualquer linha nova com elas. Telas antigas que ainda têm a faixa perdem a faixa quando forem mexidas.
6. **Cor só no valor:** verde entra, vermelho sai, saldo e acumulado pela cor do sinal, amarelo só atraso. Letras brancas (nunca cinza); cor do setor só em aba ativa e botão principal.
7. **Telas com várias visões usam abas visíveis** (Dia a dia | Mês a mês | Previsão | Lançar) e segmented control para 2 a 5 opções; dropdown só com 6 ou mais.
8. **Realizado e previsto separados:** previsão em aba ou bloco próprio, rotulada; nunca na mesma tabela do que já aconteceu.

## Funil de etapas (Kits novos e Encomendas e reposições, 23/10/2026)
Tela de funil segue sempre esta ordem, igual aos Kits novos: **PageHead** (título, subtítulo, Segmentado Quadro | Planilha e botão principal) → (sem faixa de totais: proibida desde 02/11/2026) → **Kanban** (`src/shared/kanban.js`). (O bloco Filtros deste desenho foi SUBSTITUÍDO em 11/11/2026; como filtrar um quadro de cartões, que não tem cabeçalho de coluna, ainda será definido com o Marcus.)
- Coluna: nome, "N pedidos" e prazo ("prazo 24 h · 2 atrasados"), borda na cor da etapa. Colunas vazias continuam visíveis.
- Cartão (modelo "faixa do canal"): faixa colorida no topo com o canal à esquerda e o tempo na etapa à direita; **nome e sobrenome completos**; telefone; dois quadros (média e máximo); taxa/comprovante; responsável; botão de avançar (`h-8`, "Concluir ›"); "Mover para…". Botão travado fica cinza e diz o motivo (ex.: "Aguardando comprovante").
- Cada canal tem o seu caminho de etapas e o cartão só anda dentro dele. Trava por regra (sem conferir, sem comprovante) fica no domínio, não na tela.
- Telas de apoio do setor (agenda, lista, representantes) usam `Bloco` de `padrao-fin.js` e a `TabelaPlanilha`, na mesma ordem: título → tabela (sem faixa de totais e sem bloco de filtros: o filtro fica nas colunas).

## REGRA FIXA · tabelas (Marcus, 02/11/2026) — vale para TODA tabela de TODA tela, para sempre (o item 1, "topo dourado", foi SUBSTITUÍDO pelo layout D em 06/11/2026: a `TabelaPlanilha` é escura por padrão; os itens 2 e 3 continuam)
1. **Topo dourado em degradê.** O cabeçalho de toda tabela é uma barra dourada em degradê (`linear-gradient(90deg,#9A6F1E,#E8B84B 48%,#F5E7BE)`, letra escura `#1a1306` para ler). É UM degradê só, do começo ao fim da barra (primeira cor na ponta esquerda, última na ponta direita da tabela inteira), nunca um por célula (regra 2f da trava). Como fazer: o degradê vai no fundo da PRÓPRIA tabela, com `background-size: 100% 30px` e `no-repeat`, e as células do cabeçalho ficam transparentes. Vem da peça (`TabelaP`, `TabelaPlanilha`), nunca feito à mão na tela.
2. **Nada abreviado.** Proibido `truncate`, `text-ellipsis`, `line-clamp`, `textOverflow` e `slice(...) + "…"`. O texto aparece inteiro: a coluna cresce ou o texto quebra em 2 linhas.
3. **Tudo alinhado no meio.** Cabeçalho e célula centralizados, texto e número. Nada à esquerda nem à direita.
5. **Trava 2g (03/11/2026, Marcus: "tem que colocar na trava dura"):** a peça `TabelaP` ainda estava com topo cinza mesmo com a trava dizendo que ela "já traz o dourado". Corrigido: `TabelaP` agora tem o degradê dourado de verdade (um só na tabela inteira, cabeçalho centralizado, texto `#1a1306`). A trava `conferirPecaTabela` (`scripts/padrao-regras.mjs`) lê as peças `TabelaP`, `TabelaPlanilha` e `TabelaOuro` SEMPRE (em `npm run padrao`, `conferir`, `verificar`, no CI e no hook ao editar a peça) e reprova se o degradê `#9A6F1E` sumir ou se o topo voltar a ser cinza (`bg-white/5`, `bg-muted`, `bg-sidebar`).
4. Estas 3 regras substituem as regras 3 e 4 do padrão do Financeiro (corte com "…" e números à direita). Guardadas na TRAVA DURA (`scripts/padrao-regras.mjs`, regras 2c, 2d e 2e). As peças ainda estão sendo trocadas: o desenho do topo foi levado ao Marcus em `docs/ideias/tabelas-opcoes-de-topo.html` (4 opções).

## REGRA FIXA · TABELAS EM LAYOUT D (Marcus, 06/11/2026) — vale para TODA tabela nova ou mexida; SUBSTITUI o topo dourado de 02/11/2026
O Marcus viu 4 layouts (`docs/ideias/resumo-pagamentos-4-layouts.html`) e escolheu o **D**, depois de dizer: "não quero linhas quebradas, nada dourado, quero tudo mais ordenado". Referência pronta: **Pagamentos a fornecedores › Resumo** (`pages/pf/Resumo.js` e `pages/pf/Limite.js`).
1. **Peça única (atualizado em 11/11/2026: agora é a `TabelaPlanilha`, que já tem o visual do layout D e o filtro em cada coluna; `TabelaCampos`/`FileiraCampos` não entram mais em tela mexida).** Visual do layout D: cada item é uma FILEIRA de campos separados por fio fino vertical e horizontal; cabeçalho e linha de total em faixa escura (`#1c1d21`); fundo igual ao do bloco. **Sem dourado, sem degradê.** Cabeçalho 30 px (11 px, caixa alta), fileira 32 px, texto 13 px.
2. **Nada quebra e nada é cortado:** colunas com largura fixa (`cols:[{t, w:"16%"}]`), a última `"1fr"` (o resto), `minW` para a tabela rolar para o lado em tela estreita. Texto sempre em UMA linha (`whitespace-nowrap`). Texto longo = coluna mais larga, nunca 2 linhas e nunca "…".
3. **Tudo centralizado** (cabeçalho e célula), números com algarismos tabulares, todo valor com R$ por extenso (sem "k" nem "mil").
4. **Cor só para estado:** verde (pago, sobra), vermelho (falta, passou), amarelo (pendente, em aberto), na própria célula (`{v, cor}`) ou no ponto "●". Cor do setor só em botão principal e aba ativa.
5. **Total = fileira `total:true` no fim da tabela**, nunca bloco de números acima (regra 5 do Financeiro continua: SEM faixa de totais nem cartões de número no topo da tela; resumo vai na fileira de total ou numa linha de texto abaixo).
6. **Quando usar o quê (atualizado em 11/11/2026): TODA tabela de dados = `TabelaPlanilha`** (escura por padrão, filtro e ordenação em cada coluna). `TabelaCampos`/`FileiraCampos`, `TabelaP` (dourada), `Tab`/`Td` e tabela feita à mão (`e("table")`) **não entram em tela mexida**: a trava dura (`scripts/padrao-regras.mjs`, regras 2e, 2h e 2k) reprova. O dourado só existe com `dourada:true`, para tela velha, e a regra 2l reprova uso novo.
7. Telas antigas com topo dourado: só mudam quando forem mexidas (mesma regra de sempre).
8. **Regras longas de explicação** (semáforo, "como funciona") não ficam abertas na tela: botão "Regras" abre uma tabela de duas colunas (Regra | O que vale).

## REGRA FIXA · SEM CHIPS NEM PÍLULAS; ESCOLHA = DROPDOWN (Marcus, 09/11/2026: "eu não quero nunca mais isso") — vale para TODA tela, para sempre
1. **Proibido** botão arredondado em forma de pílula/chip para marcar opções (ex.: Peito, Costas, Ombros... como botões soltos que ficam roxos quando marcados).
2. **Uma opção** = `CampoSel` (select de 32 px). **Várias opções** = `MenuMulti` de `padrao-fin.js` (campo de 32 px que abre menu suspenso com caixa de marcar; mostra os nomes se forem até 3, depois "N marcados"). **2 a 5 opções da mesma visão** = `Segmentado`. Ação (salvar, encerrar) = `Botao`.
3. Isto **substitui** a regra 7 do padrão do Financeiro ("abas visíveis em vez de dropdown") para escolhas de formulário: o Marcus quer menus suspensos.
4. **Cor:** menos cor. Dourado é o destaque; verde/amarelo/vermelho só para estado. Nada de uma cor por categoria (ex.: uma cor por tipo de pausa) sem o Marcus pedir.
5. Trava dura **regra 2i** em `scripts/padrao-regras.mjs`: reprova função/variável `chip...` e botão com `rounded-full` + `px-`. (Selo de status não clicável, como o `Chip` de `pf/ui.js`, não é botão de escolha e passa.) Rodar `npm run padrao`.

## REGRA FIXA · FILTRO SÓ NAS COLUNAS, IGUAL AO GOOGLE PLANILHAS (Marcus, 11/11/2026: "eu já falei, não quero filtros assim, trave isso") — vale para TODA tela, para sempre; SUBSTITUI "filtros no topo" de 22/10/2026
1. **Proibido** o bloco "Filtros" acima da tabela (campos de busca e seleção em grade). Também proibida a barra de filtros (`BarraFiltros`, `BlocoFiltros`).
2. **Filtro e ordenação ficam no cabeçalho de cada coluna.** Clicar no nome da coluna abre o menu: Ordenar de A a Z, Ordenar de Z a A, Buscar nesta coluna, lista de valores com caixa de marcar, Selecionar tudo e Limpar o filtro. Coluna com filtro ou ordenação fica dourada. Peça: `TabelaPlanilha` (`components/tabela-planilha.js`).
3. Em cima da tabela ficam só o título, o botão principal e "Limpar filtros" (aparece quando há filtro).
4. O visual da tabela é o Layout D (faixa escura, fio fino, tudo centralizado, nada quebra, total na última fileira), e a `TabelaPlanilha` já entrega isso por padrão.
5. Trava dura em `scripts/padrao-regras.mjs` (teste: `node scripts/testar-trava-padrao.mjs`): **2j** reprova `BlocoFiltros`/`BarraFiltros` (uso e import), bloco com título "Filtros", `CampoBusca` e botão "Filtrar" no topo; **2k** exige a `TabelaPlanilha` (reprova `TabelaCampos`, `FileiraCampos`, `TabelaP`); **2l** reprova `dourada:true`; **2g** confere a própria peça (escura por padrão e com o menu de filtro). Telas antigas mudam quando forem mexidas.
6. Desenho de referência: `docs/ideias/inadimplencia-tela-dividas.html`.
