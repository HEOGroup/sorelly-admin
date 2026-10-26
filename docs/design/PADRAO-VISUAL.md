# Padrão visual do Sorelly Admin

Modelo: a tela **Visão geral**. Toda tela nova (e toda tela que for mexida) segue isto. Ver ao vivo em **Tecnologia → Padrão visual**.
Código das peças: `src/apps/montagem/components/padrao.js` (Pagina, Indicador, Faixa, Tab, Td) e `components/equipe-blocos.js` (BlocoBarra).

## Regras
0. **Sem espaço vazio e sempre responsivo.** Blocos de alturas diferentes se encaixam como tetris (`Mosaico`), com número de colunas que muda sozinho conforme a largura; nunca duas colunas fixas com buraco embaixo, nunca barra de rolagem dentro de bloco, nada fica solto ou flutuando (ex.: dois números "no ar" numa grade de 2 colunas) e nada fica atrás do menu ao redimensionar.
1. **Tudo centralizado.** Número, nome, cabeçalho e célula. Nada solto, nada alinhado só à direita.
2. **Número sempre dentro de um Indicador** (número grande colorido + nome pequeno embaixo) ou de uma célula `Td`. A casca `Pagina` faz os números correrem de zero até o valor ao abrir a tela e quando mudam.
3. **Compacto.** Espaço curto entre blocos (`gap-2.5`), linhas baixas, tela já abre mostrando o que importa. Indicadores lado a lado (`Faixa`).
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
17. **Filtros numa barra única** (`BarraFiltros`): busca, seletores e período na mesma altura (h-9), centralizados, com "Limpar" quando houver filtro.
18. **Janela em colunas** (`Janela`): detalhe, edição e cadastro abrem largos, com colunas lado a lado (dados | etapas | ações); nunca formulário comprido descendo. O que já foi preenchido passa para o lado como concluído.
19. **Menos telas, mais abas** (`Abas`): várias visões ficam numa tela só do menu; configurador só no Configurador geral; cada número tem UMA fonte.
20. **Ícones no lugar de texto** quando o significado é claro; texto curto; um botão principal por tela; estados vazios formais e curtos.
21. **Não acrescentar o que não foi pedido.** Ao terminar: mostrar funcionando no navegador, limpar o localStorage de teste e registrar em `DECISOES.md` e `domain/versoes.js`.

## Menu, barra do topo e cores (módulo novo)
- Setor = item da barra lateral; área = botão da barra de cima; tela = item do menu da área. Tudo em `navigation/setores.js` (helpers T, G, Ti), nomes em `abas.js`, endereço em `router/slugs.js` e `src/router/rotas.js`, acesso por setor em `navigation/perfis.js`. Passo a passo no README.md.
- **MENU DO SETOR, padrão de 22/10/2026 (opção 3, aprovada pelo Marcus; já valem Financeiro, Cadastro de revendedoras e Encomendas e reposições).** Cada setor tem o campo `menu` em `navigation/setores.js`: lista de nós `{nome, aba?, itens?, perm?}` (ajudante `M(nome, aba)`). A peça é `components/barra-menu.js`. De cima para baixo:
  1. **Faixa do sistema:** botão Voltar, ícone do setor e nome da tela aberta.
  2. **Telas abertas:** chips das últimas telas (máximo 5, com ×); a tela atual fica dourada.
  3. **Menu em texto:** palavras com listas em cascata (linhas de 30 px, item aberto dourado) e a busca "Buscar tela…" na ponta.
  4. **Tela:** título + subtítulo à esquerda; à direita o seletor de visão (Segmentado) e UM botão principal.
- **Regras do menu:** (a) as palavras seguem a **ordem do fluxo** do setor; (b) setor com poucas telas usa palavras diretas, **sem lista e sem a faixa de telas abertas** (campo `semAbas:true` no setor; ex.: Encomendas e reposições = 6 palavras sempre visíveis, então não precisa de chips); (c) setor com muitas telas agrupa em listas, no máximo 2 níveis; (d) **nada de botões coloridos por área**: a cor do setor aparece só no ícone; (e) setor sem `menu` cai no menu automático das áreas (`menuAuto` em App.js: área com uma tela só vira palavra direta). O agrupamento antigo `GRUPO_BARRA` (opção D) não vale para setor com `menu`.
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

## REGRA FIXA · padrão do Financeiro: filtros no topo, tamanhos fixos, R$ em todo valor (Marcus, 22/10/2026)
0. **Fonte: Inter (escolhida pelo Marcus em 22/10/2026), corpo de 13 px nas telas do Financeiro.** Números na mesma fonte, com algarismos tabulares (`tabular-nums`). Títulos na Inter (a fonte mono saiu dos títulos). Segunda tela de referência: `pages/ContasPagarLista.js`.
Aprovado pelo Marcus. Vale para toda tela nova ou mexida (começando pelo Financeiro). Estudo completo: `DESIGN-SYSTEM-ESTUDO-COMPLETO.md` e `GUIA-DE-ESCRITA-E-TIPOGRAFIA.md`; peças em `components/padrao-fin.js`; tela de referência: `pages/Faturamento.js`.
1. **Filtros no topo da tela**, num bloco "Filtros" logo abaixo do título, em **grade de 4 colunas iguais** (2 no celular), rótulo em cima do campo. Busca ocupa 2 colunas; botões Limpar e Filtrar à direita da última linha. Nada de filtro na lateral, em gaveta ou espalhado. Sem seletor Sorelly/Família na barra (isso é do menu). Tela sem filtro não mostra o bloco.
2. **Tamanhos fixos.** Campo, seleção, busca e botão: altura **32 px** (`h-8`); botão largura mínima 96 px. Texto 13 px. Linha de tabela 32 px, cabeçalho 30 px (11 px, caixa alta). Rótulo de campo: 11 px, uma linha, até 18 letras.
3. **O espaço manda no texto.** Texto que não cabe corta com "…" em uma linha e aparece inteiro ao passar o mouse (`title`); campo, bloco e botão não crescem nem quebram de linha. Coluna de data 90 px; coluna de valor 130 px (nunca corta: a coluna cresce); coluna de texto ocupa o que sobra.
4. **Todo valor em reais leva "R$"**, em frase, indicador, tabela e célula (R$ 99.719,05 · −R$ 83.307,03). Acertos e percentuais não levam R$. Números **à direita** nas tabelas, texto à esquerda, fonte tabular. (Cancela "tudo centralizado" para tabelas; a faixa de totais continua centralizada.)
5. **Faixa de totais, não cartões:** indicador = rótulo + valor, células iguais numa linha só, centralizadas, sem subtexto cinza, sem espaço vazio, sem degradê.
6. **Cor só no valor:** verde entra, vermelho sai, saldo e acumulado pela cor do sinal, amarelo só atraso. Letras brancas (nunca cinza); cor do setor só em aba ativa e botão principal.
7. **Telas com várias visões usam abas visíveis** (Dia a dia | Mês a mês | Previsão | Lançar) e segmented control para 2 a 5 opções; dropdown só com 6 ou mais.
8. **Realizado e previsto separados:** previsão em aba ou bloco próprio, rotulada; nunca na mesma tabela do que já aconteceu.

## Funil de etapas (Kits novos e Encomendas e reposições, 23/10/2026)
Tela de funil segue sempre esta ordem, igual aos Kits novos: **PageHead** (título, subtítulo, Segmentado Quadro | Planilha e botão principal) → **faixa de totais** (6 células, vermelho só em atraso, verde só em concluído) → **bloco Filtros** (4 colunas iguais, botão Limpar) → **Kanban** (`src/shared/kanban.js`).
- Coluna: nome, "N pedidos" e prazo ("prazo 24 h · 2 atrasados"), borda na cor da etapa. Colunas vazias continuam visíveis.
- Cartão (modelo "faixa do canal"): faixa colorida no topo com o canal à esquerda e o tempo na etapa à direita; **nome e sobrenome completos**; telefone; dois quadros (média e máximo); taxa/comprovante; responsável; botão de avançar (`h-8`, "Concluir ›"); "Mover para…". Botão travado fica cinza e diz o motivo (ex.: "Aguardando comprovante").
- Cada canal tem o seu caminho de etapas e o cartão só anda dentro dele. Trava por regra (sem conferir, sem comprovante) fica no domínio, não na tela.
- Telas de apoio do setor (agenda, lista, representantes) usam `FaixaTotais`, `Bloco` e `TabelaP` de `padrao-fin.js`, na mesma ordem: título → totais → filtros → tabela.
