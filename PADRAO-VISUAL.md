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
- Barra do topo com muitos botões: agrupe por assunto (opção D). Em `navigation/setores.js`, `GRUPO_BARRA` diz o grupo de cada área; o nome do grupo aparece em cima dos botões, que são pequenos e quebram de linha sozinhos. Setor sem grupo mantém a barra simples.
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
