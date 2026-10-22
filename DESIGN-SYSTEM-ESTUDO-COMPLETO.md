# Estudo de Design System do Sorelly Admin (completo)

> Versão em texto do estudo de 22/10/2026 (a versão visual com exemplos está em `docs/design-system-estudo-completo.html` e no PDF `docs/Estudo-Design-System-Sorelly.pdf`). **As 20 regras da seção 15 são PROPOSTA até o Marcus aprovar**; enquanto isso vale o `PADRAO-VISUAL.md`. O resumo curto está em `DESIGN-SYSTEM-ESTUDO.md`. Os exemplos visuais ("Exemplo · …") aparecem aqui só como descrição; para vê-los, abra o HTML.

Sorelly Admin · estudo para leitura · 22/10/2026


# Estudo de Design System: como os grandes sistemas são desenhados e o que a Sorelly deve copiar


Um guia para ler antes de reorganizar o sistema inteiro. Cada regra vem de um sistema de design publicado (IBM Carbon, Shopify Polaris, Atlassian, Material, GOV.UK, Stripe) ou de um estudo de usabilidade, com exemplo ao vivo e a ligação com o que está errado hoje nas nossas telas.


> **Resumo em 10 linhas.** 1) O sistema está inconsistente porque cada tela foi decidida sozinha. 2) A saída é um padrão pequeno e fixo (tokens) mais uma tela de referência por módulo. 3) Em sistema financeiro a tabela é a peça principal: número à direita, unidade no cabeçalho, linha de total. 4) Cor tem significado fixo: verde entra, vermelho sai, amarelo só atraso; nunca só cor. 5) Degradê, anel colorido e sombra em bloco parado são "tinta sem dado". 6) Dropdown esconde: 2 a 5 opções ficam visíveis (segmented control ou abas). 7) Navegação em três níveis: setor (lateral), pergunta (topo), abas (dentro). 8) Toda tela precisa de carregando, vazio, erro e salvo. 9) Formato de dados único (R$, data, sinal de menos). 10) Migração por módulo, Financeiro primeiro, sempre com o sistema funcionando.


### Parte I · Como os grandes sistemas pensam


- 01O que é um design system
- 02Vocabulário: o nome de cada peça
- 03Fundações: tokens, cor, tipo, espaço
- 04Tema escuro bem feito
- 05Tabelas: a peça principal
- 06Cartão, lista, tabela ou grade
- 07Navegação e arquitetura
- 08Filtros e período
- 09Painéis e indicadores
- 10Estados, avisos e erros
- 11Formulários
- 12Ideologias: escolas de pensamento
- 13Acessibilidade
- 14Diagnóstico da Sorelly hoje
- 15As 20 regras propostas


### Parte II · Aprofundamento e aplicação


- 16Dados e formatos
- 17Ícones
- 18Movimento e feedback
- 19Escrita e vocabulário oficial
- 20Densidade e celular
- 21Contraste medido
- 22Tipografia aprofundada
- 23Seis moldes de tela
- 24Permissões e acesso
- 25Tokens prontos (código)
- 26Checklist de revisão
- 27Plano de migração
- 28Governança
- 29Glossário A–Z
- 30O que você decide agora
- 31Onde estudar mais


## 01 · O que é um design system


Um design system é um conjunto de decisões tomadas **uma vez** e repetidas em todas as telas: quais cores existem e o que cada uma significa, quais tamanhos de letra, quanto espaço entre as coisas, como é uma tabela, um botão, um aviso. A Atlassian define a unidade básica, o _token_, como "um par nome e valor que representa uma decisão de design pequena e repetível" ([Atlassian](https://atlassian.design/foundations/design-tokens)).


O problema que você sente hoje ("cada tela de um jeito, só dropdown e degradê") é exatamente o que acontece quando as decisões são tomadas tela por tela. A solução não é desenhar melhor cada tela: é parar de decidir tela por tela.


> **Camadas de um design system.** 1) Fundações: tokens de cor, tipografia, espaço, raio, elevação. 2) Componentes: botão, tabela, aba, filtro, aviso, cada um com regra de quando usar. 3) Padrões: como montar uma tela inteira (lista, detalhe, painel, formulário). 4) Conteúdo: como escrever rótulos, erros e títulos. 5) Documentação viva: a tela de referência que todo mundo copia.


Dois jeitos de encarar: a IBM, a Shopify e a Atlassian publicam sistemas enormes e documentados, com equipe dedicada. O Linear, por outro lado, diz que "não tem equipe de design system" e mantém um sistema simples, "principalmente cores, tipo e componentes básicos", porque "o app em si é o design de verdade" ([Karri Saarinen, Linear](https://x.com/karrisaarinen/status/1715085201653805116)). Para a Sorelly, o caminho do Linear é o certo: poucas regras, bem fixas, e uma tela de referência que é o próprio sistema.


## 02 · Vocabulário: o nome de cada peça


Você disse que só conhece dropdown e degradê. Aqui estão as peças que todo sistema usa, com exemplo real e a regra de quando usar. Saber o nome certo é metade do caminho, porque aí você consegue pedir "quero segmented control, não dropdown".


### Peças para escolher entre opções


**Exemplo · Segmented control · 2 a 5 opções, sempre visíveis, trocam a visão do mesmo conteúdo**

 Faturamento Contas a pagar Faturamento vs Contas


Mostrando: Faturamento.


**Exemplo · Tabs (abas) · seções independentes de uma mesma tela, cada uma é um destino**

 Quando vence Por natureza Pagas Lista de títulos


**Exemplo · Dropdown (lista suspensa) · 6 ou mais opções, ou rótulos longos. Esconde as opções: use só quando não cabem Exemplo · Chips (fichas) · várias opções ao mesmo tempo, filtros ligados e desligados**

CNPJ 34 ✕ CNPJ 59 ✕ CNPJ 46 CNPJ 67 Por fora


**Exemplo · Toggle (chave) · uma configuração ligada ou desligada, vale na hora**

__ Mostrar contas bloqueadas


Regras de escolha entre segmented control, tabs, dropdown, toggle e chips: [Toyota CDS](https://dx-playbook-prev.toyota-europe.com/cds/components/forms/segmented-control/), [Genesys Spark](https://spark.genesys.com/latest/components/forms-and-inputs/segmented-control/usage-PLofObXx), [Trimble Modus](https://modus.trimble.com/components/in-field/segmented-controls/).


### Peças de status e identificação


**Exemplo · Badge (etiqueta de estado) · cor + forma + palavra, nunca só a cor**

__Pago __Vence hoje __Atrasado 12 dias Fechado 🔒

A IBM usa "ícone, forma, cor e rótulo descritivo juntos", e as formas servem para "varrer grandes quantidades de dados" em tabelas. E adverte: sem ação a tomar, use texto simples em vez de indicador ([Carbon, status indicator](https://www.carbondesignsystem.com/patterns/status-indicator-pattern)).


**Exemplo · Breadcrumb (trilha) · onde a pessoa está na hierarquia; a página atual não é link**


Financeiro/Saídas/Contas a pagar/Outubro 2026


Atlassian: breadcrumbs servem a "experiências hierárquicas de página inteira", e a página atual fica sem link ([Atlassian Forge](https://developer.atlassian.com/platform/forge/ui-kit/components/breadcrumbs/)).


### Peças que abrem por cima da tela


**Exemplo · Modal (diálogo) · interrompe para uma decisão curta; centralizado, com uma ação principal Destravar setembro?**

Os valores do mês voltam a aceitar edição. Você pode travar de novo depois.

 Cancelar Destravar


**Exemplo · Drawer / side sheet (gaveta lateral) · detalhe de um item sem sair da lista; usar com moderação**


lista de títulos…

**Boleto Pontual**
Vence 24/10

R$ 7.158,53

__A vencer


Primer (GitHub): side sheets ocupam a altura toda e "devem ser usados com parcimônia"; diálogos centrais viram bottom sheet no celular ([Primer](https://primer.style/product/components/dialog/guidelines)).


**Exemplo · Toast / snackbar · confirmação curta, some sozinha, embaixo da tela**

✓ Lançamento salvo Desfazer

Material: snackbars são "mensagens breves sobre processos do app, na parte de baixo da tela" ([Material](https://m2.material.io/components)).


### Peças de espera e de vazio


**Exemplo · Skeleton (esqueleto) · mostra a forma do que vai carregar, em vez de uma rodinha Exemplo · Empty state (estado vazio) · diz o que vai aparecer e como começar; nunca "nada aqui" Nenhuma conta lançada em outubro**Lance o primeiro dia em Contas a pagar → Por dia, ou importe do admin antigo.
 Lançar dia


### Outros termos que você vai ver


**Data table × data grid**
Tabela é para ler e comparar; grade é para editar muito, com seleção em lote. Quando a edição é pequena e isolada, tabela; quando o objetivo é manipular dados, grade ([guia de tabelas](https://www.setproduct.com/blog/data-table-ui-design)).

**Master-detail (lista e detalhe)**
Lista à esquerda, detalhe do item selecionado à direita. O que o Consolidado das representantes tenta fazer com linhas que abrem.

**KPI tile / stat (indicador)**
Um número com rótulo. Útil no topo de um painel; não serve para substituir a tabela.

**Toolbar da tabela**
Faixa acima da tabela com busca, filtros, botão principal e densidade (Carbon).

**Densidade**
Quanto cabe por tela. A Carbon oferece cinco alturas de linha; sistemas financeiros preferem denso ([Carbon, data table](https://carbondesignsystem.com/components/data-table/usage/)).

**Progressive disclosure (divulgação progressiva)**
Mostrar primeiro o essencial e deixar o avançado para um segundo nível. Dropdown e acordeão são formas disso, e por isso escondem.

**Elevação**
A sensação de "em cima" (sombra ou superfície mais clara). Só para o que realmente está por cima: menu aberto, modal.

**Tabular figures (algarismos tabulares)**
Dígitos com a mesma largura, para as colunas de números ficarem alinhadas. Em código: `font-variant-numeric: tabular-nums`.

**Command palette**
Caixa de busca de comandos (Ctrl+K) para ir a qualquer tela. O nosso "Colar endereço" é uma versão simples disso.


## 03 · Fundações: tokens, cor, tipo, espaço


### Tokens: as decisões com nome


Na Atlassian o nome do token conta a história: `color.background.danger.bold.hovered` = cor, de fundo, de perigo, forte, ao passar o mouse. Com nomes assim, uma tela nunca inventa "um vermelhinho": ela usa o token de perigo. A Shopify faz igual (`--p-bg-surface-error`) ([UXPin, exemplos](https://www.uxpin.com/studio/blog/best-design-system-examples/)).


**Exemplo · Os tokens de cor que a Sorelly precisa (e nenhum a mais)**


Superfície**surface**

Superfície 2 (cabeçalho, zebra)**surface-2**

Setor (uma cor por setor)**setor.bg / setor.fg**

Entrada de dinheiro**entrada**

Saída de dinheiro**saida**

Atenção / atraso**atencao**

Texto**texto**

Texto secundário**texto-2**

Linha**linha**


Regra de semântica fixa: **verde = entra**, **vermelho = sai**, resultado e saldo pela cor do sinal, **amarelo só atraso**, branco para totais e quantidades. A cor do setor é só de identificação (barra, aba ativa), nunca de valor.


### Tipografia


**Exemplo · Escala de tipo: poucos tamanhos, usados sempre nos mesmos lugares**


Título de tela · 26 px


Título de bloco · 18 px


Texto de tabela e corpo · 14 px (16 px em texto corrido)


Rótulo e cabeçalho de coluna · 11 px, caixa alta, espaçada


R$ 1.067.118,19 · 1.176 acertos · números em fonte tabular


Os sistemas usam 16 px para leitura com altura de linha 24 px (múltiplo de 8) e 14 px em tabelas densas; a American Express parte de 16 px "por legibilidade" ([Amex](https://designinternet-qaeusw1green.americanexpress.com/guidelines/spacing/overview), [ls.graphics](https://www.ls.graphics/ideas/why-8pt-grid-the-math-behind-clean-ui)). A Stripe "ensinou uma geração" a mostrar dinheiro com "numerais alinhados à direita, algarismos tabulares, linhas de grade discretas" ([análise de painéis fintech](https://adminlte.io/blog/fintech-dashboard-design-examples/)).


### Espaço: a grade de 8 pontos


**Exemplo · Todo espaço é múltiplo de 8 (ou 4 para detalhes). Botões, alturas de linha e margens saem da mesma lista**


4

8

16

24

32

48


A Atlassian expõe isso como `space.100` (8 px), `space.200` (16 px) etc. ([análise do sistema Atlassian](https://superdesign.dev/blog/atlassian-design-system)). O ganho é que nada fica "quase alinhado".


### Raio, borda e elevação


A Stripe usa raios contidos de 4 a 8 px e bordas suaves, e prefere "tipografia e espaço em branco, não cor, para criar hierarquia" ([análise do painel da Stripe](https://www.925studios.co/blog/stripe-dashboard-design-breakdown)). Regra prática: um raio só (6 px) para controles, um para cartões (8 px), sombra só no que flutua.


**[Como está hoje]**


RECEBIDO**R$ 928.995,38**até agora

A RECEBER**R$ 577.462,26**previsto


**[No padrão]**


Recebido

R$ 928.995,38

até 21/10


Contas pagas

R$ 1.067.118,19

15 dias


Resultado

−R$ 138.122,81

até o dia 21


O degradê e o anel colorido em cada cartão são "tinta sem dado": Tufte chama de _chartjunk_ tudo que é "só decoração: fundos, sombras, molduras" ([Few sobre Tufte](https://analyticsdemystified.com/excel-tips/stephen-fews-derivation-of-tufte-the-data-pixel-ratio/)). Repare que no padrão a cor está só no número, e o número diz tudo.


## 04 · Tema escuro bem feito


O Sorelly Admin é escuro, e tema escuro tem regras próprias. O erro mais comum é "inverter": pegar as cores do claro e virar. Um estudo de caso descreve "indicadores verde e vermelho vibrando agressivamente contra a superfície escura" depois de uma inversão direta ([guia de dark mode](https://uxmagic.ai/blog/dark-mode-ui-design-guide)). É exatamente o que acontece nos nossos cartões coloridos.


**Exemplo · As três regras do Material para tema escuro**


Fundo · nível 0#121212 (cinza escuro, não preto)

Cartão · nível 1+5% branco

Menu aberto · nível 2+11% branco

Texto principal#e1e1e1, não branco puro

Entrada R$ 99.719,05Saída R$ 32.425,52


1. **Profundidade por clareza, não por sombra.** Quanto mais "em cima", mais clara a superfície: o Material usa um véu branco de 0% no fundo até 16% no nível mais alto ([Material, dark theme](https://m2.material.io/design/color/dark-theme)). Sombras somem no escuro.
2. **Cor de destaque limitada e dessaturada.** O Material pede "cor de destaque limitada, para a maior parte da tela ficar escura". Verde e vermelho puros ofuscam; a versão clara e menos saturada (como acima) lê bem. Um caso fintech mapeou o azul da marca para um azul mais claro só no escuro, e atingiu 5,2:1 de contraste.
3. **Contraste.** Texto branco sobre as superfícies escuras do Material dá "pelo menos 15,8:1". Texto cinza secundário precisa de 4,5:1 (WCAG). Cinza claro demais em cima de dourado quase nunca passa.


O degradê dourado em barras e o degradê por cartão quebram a regra 1 (a clareza deixa de significar "em cima") e a regra 2 (cor em toda parte).


## 05 · Tabelas: a peça principal de um sistema financeiro


"Usuários financeiros precisam de tabelas para filtrar, ordenar e comparar números lado a lado; painéis de cartões com número grande funcionam para demonstração" ([VALK](https://blog.deeflect.com/valk-06-data-tables-hardest-problem/)). Na Stripe "o gráfico é o resumo e a tabela é a verdade". Então a tabela precisa ser perfeita.


**[Como está hoje]**


| Dia | Recebido | Pago | Saldo |
|---|---|---|---|
| 19/10 | R$ 99.719,05 | R$ 32.425,52 | R$ 67.293,53 |
| 20/10 | R$ 99.437,29 | R$ 182.744,32 | −R$ 83.307,03 |
| 21/10 | R$ 40.207,85 | R$ 73.914,28 | −R$ 33.706,43 |


**[No padrão Polaris / Carbon]**


| Dia | Recebido | Pago | Saldo do dia | Acumulado |
|---|---|---|---|---|
| 19/10 · seg | 99.719,05 | 32.425,52 | 67.293,53 | −21.109,35 |
| 20/10 · ter | 99.437,29 | 182.744,32 | −83.307,03 | −104.416,38 |
| 21/10 · qua | 40.207,85 | 73.914,28 | −33.706,43 | −138.122,81 |
| Total do mês | 928.995,38 | 1.067.118,19 | −138.122,81 | −138.122,81 |


- **Número à direita, texto à esquerda, cabeçalho acompanha o dado, nunca centralizar.** Polaris: "Numérico = alinhado à direita; texto = à esquerda; não centralize" ([Shopify Polaris](https://polaris.shopify.com/components/tables/data-table)). Centralizar "causa movimentos de olho desnecessários" ([padrões de tabela](https://medium.com/design-bootcamp/data-table-design-patterns-4e38188a0981)).
- **Unidade no cabeçalho, não em cada célula.** "R$" repetido 300 vezes é tinta sem dado. Diga "R$" uma vez no título da coluna.
- **Linha de total.** Polaris recomenda "uma linha de resumo para mostrar os totais das colunas".
- **Cabeçalho cinza discreto, linhas de grade finas, zebra opcional.** Nada de barra em degradê.
- **Toolbar em cima:** busca, filtros, botão principal e densidade (Carbon). Ordenação por clique no cabeçalho; paginação em vez de rolagem infinita, porque a rolagem infinita "tira os pontos de referência" (pesquisa NN/g citada em [setproduct](https://www.setproduct.com/blog/data-table-ui-design)).
- **Linhas expansíveis e ações em lote** quando a tabela é de trabalho (Carbon). Tabela sempre na área principal, "nunca em modal ou container pequeno".


## 06 · Cartão, lista, tabela ou grade: como escolher


| Peça | Serve para | Ponto fraco | Na Sorelly |
|---|---|---|---|
| **Tabela** | Comparar muitos registros nos mesmos atributos; responde "qual linha tem o maior valor" mais rápido | Celular | Tudo que é dinheiro por período, por CNPJ, por natureza |
| **Lista** | Varredura vertical rápida de itens de uma linha, só leitura | Não compara | Avisos, histórico, atividade recente |
| **Cartão** | Itens diferentes entre si, cada um "um objeto" | Esconde ordem e importância; "difícil discernir o ranking" | Kanban (kits novos, aprovação), apps de celular. Nunca para números comparáveis |
| **Grade (data grid)** | Editar muito, selecionar em lote | Pesada | Lançamento diário de contas, lançar saldos |


Fontes: [setproduct](https://www.setproduct.com/blog/data-table-ui-design), [cards vs lists](https://www.webdesignerdepot.com/2017/01/cards-vs-lists-how-they-impact-ux/). "O princípio é escolher pela tarefa e pela densidade, não pela aparência."


> **Tradução para a nossa dor:** os seis cartões coloridos de "Resultado do mês e do ano" são números comparáveis (recebido, a receber, total, contas, resultado). Comparável = tabela ou uma linha de indicadores iguais, nunca cartões cada um de uma cor.


## 07 · Navegação e arquitetura da informação


A Atlassian moveu a navegação de produto da barra de cima para uma **barra lateral**, "alinhando ao que os usuários já esperam de ferramentas como Slack e Google Workspace", com o objetivo de "repetir os mesmos padrões em todos os produtos" ([Atlassian, nova navegação](https://www.atlassian.com/blog/design/designing-atlassians-new-navigation)). O modelo que você escolheu (lateral = setores, topo = áreas do setor, abas = telas abertas) está certo. O que falta é regra para o que entra em cada nível.


**Exemplo · A casca do sistema: 3 níveis, cada um com um papel só**


Visão geral

Financeiro

Agendamento

Cadastro

Representantes

RH


HojeEntradasSaídasResultadoContasFamília


Financeiro/Hoje

Disponível

R$ 266.298,24


Vence hoje

R$ 12.779,28


Atrasadas

R$ 336.237,66


MarcusFinanceiro22/10/2026 · 09:40v0.12.23


- **Lateral: setores.** Nunca mais de 12. Um ícone, uma cor, um nome curto.
- **Topo: perguntas do setor.** 4 a 7 palavras, uma linha, sem dropdown na barra. Dropdown só quando o item tem subtelas.
- **Dentro da tela: abas.** Visões da mesma coisa viram abas ou segmented control, não telas separadas no menu.
- **Breadcrumb** em cima do conteúdo, para saber onde está e voltar.
- **Linha de status** embaixo: quem, onde, quando, versão.


"Uma única navegação raramente serve finanças, operações, vendas e suprimentos da mesma forma": o objetivo é ir "de um indicador alto para a visão por trás dele com pouco atrito" ([FanRuan](https://fanruan.com/en/blog/dashboard-navigation-best-practices)). Por isso no Financeiro a barra de cima deve ser por pergunta (Hoje, Entradas, Saídas, Resultado) e não por nome de módulo.


### Divulgação progressiva: o motivo de o dropdown parecer errado


A ideia de esconder o avançado veio de Jakob Nielsen em 1995, para "reduzir erros em aplicações complexas". Mas "conteúdo escondido recebe menos atenção que conteúdo visível", e a regra é "manter fora de painéis fechados a informação que a pessoa precisa o tempo todo" ([The Decision Lab](https://thedecisionlab.com/reference-guide/design/progressive-disclosure)). Dropdown é para lista de opções temporária; acordeão é para FAQ. Nenhum dos dois é para navegação principal nem para número que você olha todo dia.


## 08 · Filtros e seletor de período


**Exemplo · Barra de filtros única, no topo da tela, na mesma altura, com estado visível e "Limpar"**

 Sorelly Família Sorelly + Família
2 filtros ativos Limpar


- **Filtro global** (período, Sorelly/Família) vale para todos os blocos da tela e fica no topo; filtro local fica no bloco ([guia de filtros](https://www.aufaitux.com/blog/dashboard-filter-design-guide/)).
- **Período com presets** ("este mês", "mês passado", "este ano") e seletor livre com limite; no máximo cinco presets ([Tago](https://help.tago.io/portal/en/kb/articles/dashboard-period-preset)).
- **Estado visível:** um indicador de quantos filtros estão ativos, lista ao passar o mouse e "Limpar tudo" ([Neobrain](https://help-center-sm.neobrain.io/en/articles/11626044-how-to-use-filters-effectively-in-a-dashboard)). Hoje o mês do Consolidado, do dia a dia e do Caixa são escolhidos em três lugares diferentes.
- Evite "muitos filtros globais" e campos com milhares de valores como dropdown ([InetSoft](https://www.inetsoft.com/company/advanced_dashboard_filtering)): busca por texto resolve.


## 09 · Painéis e indicadores


- **Resumo antes do detalhe, indicadores principais no alto à esquerda, uma página só.** "Elementos demais poluem o painel" ([Planful](https://help.planful.com/v1/docs/dashboards-end-user-guide-best-practices)).
- **A pergunta primeiro.** A Stripe constrói a home em volta de "receita, saldo e status do repasse", e cada número abre as transações por trás, "em vez de mostrar um número e esperar que você investigue depois" ([análise fintech](https://adminlte.io/blog/fintech-dashboard-design-examples/)).
- **Faça a conta pela pessoa.** Mostre a diferença para a meta e o percentual ao lado do valor, "para o usuário não ter que fazer a aritmética" ([Packt](https://hub.packtpub.com/dashboard-design-best-practices)).
- **Maximize a tinta de dado.** Tufte: "cada pedaço de tinta exige um motivo, e o motivo quase sempre deve ser apresentar informação nova". Few traduz para tela: tinta vira pixel; fundos cinza, molduras e degradês são os primeiros a sair ([Few](https://analyticsdemystified.com/excel-tips/stephen-fews-derivation-of-tufte-the-data-pixel-ratio/)).
- **Gráfico resume, tabela prova.** Um gráfico de barras do mês ao lado da tabela, nunca no lugar dela.


**Exemplo · Indicadores no padrão: iguais entre si, cor só no valor, subtítulo com a conta já feita**


Faturamento

R$ 928.995,38

1.176 acertos · média 789,96


Contas pagas

R$ 1.067.118,19

15 dias com pagamento


Resultado até 21/10

−R$ 138.122,81

pior dia 06/10 · −116.215,81


Falta pagar em outubro

R$ 420.533,10

27,8% do mês


Atrasadas

R$ 336.237,66

159 títulos


## 10 · Estados, avisos e erros


Das dez heurísticas de Nielsen, três resolvem a maior parte das reclamações de sistema interno ([resumo das heurísticas](https://www.simonwhatley.co.uk/writing/jakob-nielsen-ten-usability-heuristics/)):


1. **Visibilidade do estado do sistema.** Salvou? Diga (toast). Está carregando? Mostre (skeleton). Está fechado? Marque (cadeado).
2. **Consistência e padrões.** "A mesma palavra ou ação não deve significar coisas diferentes em lugares diferentes." Hoje "Contas a pagar" aparece em cinco lugares com conteúdos diferentes.
3. **Reconhecer em vez de lembrar.** "Deixe objetos, ações e opções visíveis." Dropdown fechado obriga a lembrar.


**Exemplo · Erro no padrão: o que aconteceu e como resolver, sem "Erro:" e sem pedido de desculpa O valor de 21/10 é menor que o de 20/10.**
O acumulado do mês não pode diminuir. Confira se digitou o total do mês e não só o do dia.


## 11 · Formulários


- **Comece com uma coisa por página.** O GOV.UK, depois de anos de teste, recomenda "começar dividindo as perguntas em páginas separadas": usuários inseguros acham mais fácil, funciona no celular e trata erros melhor ([GOV.UK, one thing per page](https://designnotes.blog.gov.uk/2015/07/03/one-thing-per-page/)). Não é "sempre uma": é "comece com uma" e junte quando a pesquisa mostrar que pode.
- **Sem acordeão em formulário.** O GOV.UK tirou o acordeão da lista de opções ([No more accordions](https://userresearch.blog.gov.uk/2015/08/13/no-more-accordions-how-to-choose-a-form-structure/)).
- **Saiba por que pede cada campo.** O processo deles: saber por que pergunta, desenhar para o caso comum, uma coisa por página.
- Validação na hora, erro ao lado do campo, botão principal único por tela. Dinheiro "subindo os dígitos" (que já temos) é um bom padrão de campo.


> **Para a Sorelly:** o lançamento diário (faturamento, saldos, contas pagas) é um formulário repetido todo dia. Ele merece uma tela própria, curta, uma pergunta por linha, com o valor de ontem ao lado para comparar. Não um cartão no meio de um painel.


## 12 · Ideologias: as escolas de pensamento


**Tufte e Few: tinta de dado**
Tudo na tela que não é dado deve justificar sua existência. Decoração é inimiga de leitura. Tela financeira boa parece "vazia" de enfeite e cheia de número.

**Nielsen: heurísticas e divulgação progressiva**
Mostre estado, seja consistente, deixe visível o que importa; esconda só o avançado.

**GOV.UK: pesquisa com usuário acima de opinião**
Cada padrão deles vem de teste com gente. "Começar com uma coisa por página" e "sem acordeão" são conclusões de pesquisa, não gosto.

**Atlassian, IBM, Shopify: tokens e semântica**
Cor e espaço com nome e significado. Ninguém inventa um valor; todo mundo usa o token.

**Material: tema escuro e elevação tonal**
No escuro, "em cima" é mais claro; cor de destaque limitada; contraste medido.

**Stripe: a tabela é a verdade**
Hierarquia por tipografia e espaço, não por cor; densidade controlada; cada número abre o que está por trás.

**Linear: o app é o design**
Sistema mínimo (cor, tipo, componentes básicos), sem equipe de sistema, consistência por disciplina. É o modelo que cabe na Sorelly.

**Carbon: status com múltiplos sinais**
Cor, forma, ícone e palavra juntos; indicador só quando há ação.


## 13 · Acessibilidade (e por que ela melhora para todo mundo)


- **Contraste 4,5:1** para texto normal (WCAG). Cinza em cima de dourado e amarelo em cima de branco costumam reprovar. Teste antes de aprovar uma cor.
- **Cor nunca sozinha.** Quem não distingue verde de vermelho (8% dos homens) precisa do sinal de menos, do ícone ou da palavra. Por isso "−R$ 138.122,81" tem o sinal além do vermelho.
- **Foco visível** ao navegar por teclado; cabeçalhos de tabela alcançáveis por Tab e ordenáveis por Enter (Carbon, acessibilidade).
- **Alvo de toque de 44 px** no celular; os apps simulados precisam disso.
- **Movimento reduzido** respeitado: números "correndo" e setas animadas desligam quando o sistema pede.


## 14 · Diagnóstico da Sorelly hoje


| O que vemos | Qual regra quebra | Troca por |
|---|---|---|
| Dropdown em quase toda escolha (mês, visão, CNPJ, modo) | Divulgação progressiva mal aplicada; reconhecer em vez de lembrar | Segmented control para 2 a 5 opções visíveis; dropdown só para 6+ (lista de meses) |
| Degradê dourado em barras e degradê por cartão | Tinta sem dado (Tufte); elevação tonal (Material): clareza deixa de significar "em cima" | Barra chapada discreta na cor do setor; cartões em `surface-2` sem anel colorido |
| Cada cartão de uma cor (ouro, verde, vermelho, azul, ciano) | Semântica de cor; "painel não é arco-íris" | Cor só no valor, pela regra entra/sai/atenção |
| Números centralizados e "R$" em todas as células | Polaris: números à direita; unidade no cabeçalho | Alinhar à direita com fonte tabular; "R$" uma vez |
| Mês escolhido em três lugares diferentes na mesma tela | Filtro global × local; consistência | Uma barra de filtros no topo que vale para a tela toda |
| "Contas a pagar" em cinco lugares do menu com conteúdos diferentes | Consistência e padrões (Nielsen) | Um nome, um lugar; as visões viram abas dentro dele |
| 11 itens na barra e 60+ telas no Financeiro, organizados por módulo | Navegação por pergunta, não por módulo | 6 grupos: Hoje, Entradas, Saídas, Resultado, Contas, Família |
| Blocos que abrem e fecham, lembrando estado no navegador | Conteúdo escondido recebe menos atenção | Tudo aberto; o que é secundário vai para outra aba, não para um bloco fechado |
| Mês fechado em verde | Verde é estado (entrada/ok), não "travado" | Cadeado e texto "fechado", cor neutra |
| Previsão misturada com realizado no mesmo bloco | Stripe/Few: realizado e previsto lado a lado, diferenciados | Colunas separadas e previsto visualmente apagado (ou bloco próprio) |


## 15 · As 20 regras propostas para o Sorelly Admin


É isto que vira o `PADRAO-VISUAL.md` novo depois da sua aprovação. Poucas regras, sem exceção, e uma tela de referência que todas copiam.


1. **Tokens, não valores.** Nove tokens de cor (superfície, superfície 2, setor, entrada, saída, atenção, texto, texto 2, linha). Nenhuma tela usa cor fora deles.
2. **Semântica fixa de cor.** Verde entra, vermelho sai, resultado e saldo pela cor do sinal, amarelo só atraso, cor do setor só em identificação (barra, aba, ícone), branco no resto.
3. **Sem degradê, sem anel colorido, sem sombra em bloco parado.** Elevação só no que flutua (menu aberto, modal), e no escuro é por clareza.
4. **Números à direita, texto à esquerda, cabeçalho acompanha.** Fonte tabular. Nada centralizado em tabela.
5. **Unidade uma vez.** "R$" no cabeçalho da coluna ou no rótulo do indicador, não em cada célula.
6. **Toda tabela tem linha de total** quando as colunas somam, e cabeçalho discreto (cinza, caixa alta 11 px).
7. **Tabela é a verdade; indicador é resumo; gráfico é apoio.** Nunca cartões para números comparáveis.
8. **Escala de tipo fixa:** 26 título de tela, 18 título de bloco, 14 corpo e tabela, 16 texto corrido, 11 rótulo em caixa alta. Nada fora disso.
9. **Espaço em múltiplos de 8** (4 para detalhes). Alturas de controle: 32 px (denso) e 40 px (normal).
10. **Raio único:** 6 px em controles, 8 px em blocos. Borda de 1 px na cor "linha".
11. **2 a 5 opções = segmented control ou abas, sempre visíveis.** Dropdown só com 6 ou mais, ou rótulos longos.
12. **Nada fechado por padrão.** O que é secundário vai para outra aba. Bloco que abre e fecha só em listas longas, e começa aberto.
13. **Uma barra de filtros por tela,** no topo, mesma altura em tudo, com contagem de filtros ativos e "Limpar". Período e Sorelly/Família são globais.
14. **Navegação em três níveis:** lateral = setor, topo = pergunta (4 a 7 palavras, sem dropdown na barra), dentro = abas. Breadcrumb em cima e linha de status embaixo.
15. **Um nome, um lugar.** A mesma palavra significa a mesma coisa no sistema todo. Visões de uma coisa viram abas, não telas de menu.
16. **Status com cor + forma + palavra.** Indicador só quando há ação a tomar; senão, texto simples.
17. **Realizado e previsto nunca na mesma célula.** Previsto em bloco próprio ou coluna própria, visualmente apagado e rotulado.
18. **Estados obrigatórios em toda tela:** carregando (skeleton), vazio (o que vai aparecer e como começar), erro (o que houve e como resolver), salvo (toast).
19. **Formulário de rotina é tela própria,** curta, uma pergunta por linha, com o valor anterior ao lado. Começa com uma coisa por página.
20. **Tela de referência manda.** Existe uma tela aprovada por módulo (a primeira é o Fluxo mensal). Tela nova copia a referência; nunca é desenhada do zero. Quem quebra a regra refaz.


## PARTE II · Aprofundamento e aplicação ao Sorelly Admin


A Parte I explicou como os grandes sistemas pensam. Esta parte desce ao detalhe: formatos, ícones, movimento, escrita, celular, contraste medido, padrões de tela completos, permissões, código dos tokens, checklist, plano de migração e glossário A–Z.


## 16 · Dados e formatos: dinheiro, data, sinal, vazio


Em sistema financeiro, o formato do número é parte do padrão. Se cada tela escreve de um jeito, a pessoa precisa "traduzir" toda hora.


| Dado | Padrão | Errado | Por quê |
|---|---|---|---|
| Dinheiro em tabela | 1.067.118,19 | R$ 1.067.118,19 | "R$" uma vez no cabeçalho da coluna. Em cartão e frase, com "R$ " e espaço fino |
| Dinheiro em frase | R$ 7.000,00 | 7000 / R$7.000 | Regra do Marcus: sempre com centavos e separador de milhar |
| Negativo | −138.122,81 | R$ -138.122,81 · (138.122,81) | Sinal de menos verdadeiro (−), colado no número, mais a cor. Cor nunca sozinha |
| Zero | 0,00 | — · - · vazio | "—" só para "sem dado". Zero é um valor |
| Sem dado | — | 0,00 · null · vazio | Traço longo centralizado na coluna dos números: não existe ainda |
| Quantidade | 1.176 | 1176 | Milhar sempre com ponto |
| Percentual | 96,4% | 96.4 % · 0,964 | Vírgula decimal, sem espaço antes do % |
| Variação | ▲ +12,5% | 12,5 | Sinal explícito e forma (▲▼), nunca só cor |
| Data em tabela | 21/10 | 21-10-2026 · 2026-10-21 | dd/mm; ano só quando muda. Dia da semana abreviado em minúsculo ("qua") |
| Data completa | 21/10/2026 | 21/Out/26 | dd/mm/aaaa em documento e exportação |
| Mês | Outubro/2026 | 10/2026 · out/26 | Por extenso na tela; abreviado (Out) só em cabeçalho de coluna de meses |
| Valores grandes em cartão | R$ 1,5 mi | R$ 1.500.000,00 | Cartão pequeno pode abreviar (mil, mi); a tabela nunca abrevia |
| Hora | 09:40 | 9h40 · 9:40 AM | 24 horas com dois dígitos |
| CNPJ | CNPJ 34 | 34 · Atacadista 34 | Nome curto fixo em todo lugar (ver Escrita, seção 19) |


- **Ordem das colunas:** identificação à esquerda (dia, nome), valores na ordem em que a conta é lida (recebido, pago, saldo, acumulado), totais e ações por último. A coluna mais importante fica mais perto da esquerda.
- **Ordenação padrão:** data decrescente para o que aconteceu (mais novo em cima); data crescente para o que vai vencer (o mais urgente em cima).
- **Arredondamento:** o sistema guarda centavos e mostra centavos. Média e percentual arredondam; truncar só se o Marcus pedir (a média de R$ 790,7362 aparece como 790,74).
- **Totais sempre batem:** se a coluna soma, a linha de total é a soma do que está visível, não um número guardado à parte.


## 17 · Ícones


- **Uma família só** (traço fino, "outline"). Nunca misturar traço fino com preenchido na mesma tela. O Phosphor que já usamos serve, desde que o peso seja um só por tela.
- **Três tamanhos:** 16 px (dentro de texto, botão pequeno), 20 px (botão normal, item de menu), 24 px (cabeçalho de tela). Nada de tamanho solto.
- **Ícone sozinho só quando todo mundo entende:** fechar (✕), buscar (lupa), editar (lápis), excluir (lixeira), mais (⋯). Para o resto, ícone **com** rótulo escrito. Ícone sem rótulo obriga a lembrar (Nielsen: reconhecer em vez de lembrar).
- **Ação principal da tela leva rótulo.** "Lançar dia", não só um "+".
- **Ícone não carrega estado sozinho:** o ✓ verde de "pago" precisa da palavra "Pago" na tabela; sozinho serve só como confirmação ao lado de texto.
- **Cor do ícone** segue o texto ao lado; só ganha cor de estado quando é o estado (▲ verde, ▼ vermelho).
- **Ícone de setor** (lateral): um por setor, na cor do setor, sempre o mesmo em todo lugar que cita aquele setor.


## 18 · Movimento e feedback


Movimento serve para **explicar mudança** (isto abriu, isto foi salvo), nunca para enfeitar. O Material e o Carbon definem tempos curtos; a regra prática:


| Situação | Duração | Exemplo |
|---|---|---|
| Resposta a clique (hover, pressionado) | 80 a 120 ms | Botão escurece, linha da tabela destaca |
| Abrir e fechar pequeno | 150 a 200 ms | Lista suspensa, toggle, gaveta de filtro |
| Trocar de visão | 200 a 300 ms | Segmented control trocando tabela; modal entrando |
| Números correndo até o valor | 600 a 900 ms | Só ao abrir a tela e quando o valor muda; sem som de tique em tela de rotina |
| Carregando | a partir de 300 ms | Skeleton; abaixo de 300 ms não mostrar nada |
| Confirmação (toast) | 3 a 5 s | "Lançamento salvo" com "Desfazer" |


- **Respeitar "reduzir movimento":** se o computador ou celular pede, os números aparecem prontos e as setas animadas ficam paradas. Já está previsto no estudo e vai para a regra.
- **Um movimento por vez.** Dois efeitos ao mesmo tempo disputam a atenção.
- **Toda ação tem retorno:** clicou em Salvar, algo muda em até 100 ms (botão desabilita com "Salvando…"), e termina com toast ou erro no lugar.
- O "tique" sonoro dos números que sobem é decisão de produto do Marcus; no padrão novo ele vira opção (Configurações) e fica desligado por padrão nas telas de rotina do financeiro.


## 19 · Escrita da interface (microcopy) e vocabulário oficial


As melhores equipes tratam as palavras da tela como parte do design. Princípios (Polaris, Atlassian e GOV.UK convergem):


- **Frase no jeito de falar, mas profissional.** "Lançamento salvo", não "Operação realizada com sucesso!".
- **Botão é verbo + objeto:** "Lançar dia", "Exportar planilha", "Marcar como pago". Nunca "OK", "Enviar", "Clique aqui".
- **Primeira letra maiúscula só no início** (frase), nunca Todas As Palavras Com Maiúscula. Exceção: nomes próprios.
- **Título diz o assunto, subtítulo diz o que fazer ou o que mudou.** O que o título repete, o subtítulo não repete.
- **Erro diz o que houve e como resolver,** em uma frase, sem "Erro:" e sem pedir desculpa.
- **Estado vazio convida:** "Nenhuma conta lançada em outubro. Lance o primeiro dia em Por dia."
- **Sem jargão de programador na tela:** "salvar", não "persistir"; "sincronizar com o admin antigo", não "importar via API".
- **Um nome para cada coisa, em todo o sistema.** A lista abaixo é a proposta de vocabulário oficial.


| Use sempre | Em vez de | Observação |
|---|---|---|
| **Contas a pagar** | Análise de custos, Contas, Lista de títulos como nome de tela | Os títulos são a lista; "Por natureza" é uma aba; "análise de custos" vira aba ou relatório |
| **Faturamento** | Previsão de faturamento, Consolidado do faturamento | O nome da tela é Faturamento; "Previsão" é um bloco |
| **Recebido** | Faturado, Entrada, Vendido | Recebido = dinheiro que entrou. "Faturado" só em contexto fiscal (nota) |
| **Pago / A pagar** | Saída, Baixado, Liquidado | Pago = saiu; A pagar = falta sair |
| **Acertos feitos** e **Previstos** | Realizados, Fechados | Realizados só no bloco de previsão, como "realizados esperados" |
| **Saldo das contas** | Caixa, Posição bancária | Tela principal do dinheiro disponível |
| **Disponível** | Saldo com limite, Saldo cheque especial | = saldo das contas + cheque especial |
| **Cheque especial** | Limite, Crédito | O limite que o banco libera nas contas |
| **Representante** / **Revendedora** | Vendedora, Parceira | Representante = quem atende na rua; revendedora = quem vende |
| **Acerto**, **Kit novo**, **Reposição** | Atendimento (genérico) | "Atendimento" só para o atendimento interno |
| **Setor** (lateral) e **Área** (topo) | Módulo, Menu, Seção | Hierarquia: setor › área › tela › aba |
| **Fechado** 🔒 | Travado, Consolidado | Mês fechado = não edita; reabrir só quem tem autorização |
| **Previsão** | Projeção, Estimativa, Meta | "Meta" só quando houver compromisso (meta do Agendamento) |


## 20 · Densidade e responsividade (celular)


### Densidade: confortável e compacta


A Carbon oferece cinco alturas de linha; para a Sorelly bastam duas, escolhidas por tela:


**[Compacta · 32 px por linha]**


| | |
|---|---|
| 19/10 · seg | 99.719,05 |
| 20/10 · ter | 99.437,29 |
| 21/10 · qua | 40.207,85 |


Para tabelas de análise que a pessoa varre: dia a dia, títulos, extratos.


**[Confortável · 48 px por linha]**


| | |
|---|---|
| 19/10 · seg | 99.719,05 |
| 20/10 · ter | 99.437,29 |
| 21/10 · qua | 40.207,85 |


Para tabelas que a pessoa opera (marcar, aprovar) e para telas no celular.


### Celular


- **Pontos de quebra:** até 600 px (celular), 601 a 1024 px (tablet), acima (computador). Três e pronto.
- **Alvo de toque mínimo de 44 px** de altura e largura (Apple e WCAG). Hoje vários botões do celular simulado têm menos.
- **Tabela no celular:** rola de lado dentro dela mesma, com a **primeira coluna fixa** (o dia ou o nome). A tela nunca rola de lado inteira. Para tabelas com mais de 5 colunas, oferecer a visão "cartão por linha" só no celular.
- **Indicadores:** 2 por linha no celular, 4 a 6 no computador. Número em uma linha só (sem quebrar "R$ 32.09 / ,00").
- **Barra de topo no celular:** vira botão "Menu" que abre a lista; lateral vira gaveta. A linha de status some (usuário fica no menu).
- **Ação principal fixa embaixo** em telas de formulário, ao alcance do polegar.
- **Fonte mínima 14 px** no corpo; 12 px só em rótulos auxiliares. Zoom do navegador nunca desligado.
- **Impressão:** toda tela de relatório tem versão para imprimir: fundo claro, sem barra lateral, tabela inteira, totais, data e quem gerou no rodapé.


## 21 · Contraste medido (WCAG)


A regra do WCAG: texto normal precisa de **4,5:1** contra o fundo; texto grande (a partir de 18 px em negrito ou 24 px) precisa de **3:1**. Eu calculei a razão das cores propostas e das cores que o sistema usa hoje.


**Exemplo · Paleta proposta · tema escuro (cartão #1C1E23, fundo #141518)**


| Cor | Uso | no cartão | no fundo | Passa? |
|---|---|---|---|---|
| Texto #ECECEA | Corpo | 14,1 | 15,4 | Sim |
| Texto 2 #B4B3AE | Apoio | 7,9 | 8,7 | Sim |
| Texto 3 #8F8E89 | Rótulo, legenda | 5,1 | 5,6 | Sim (ajustado: era #84837E com 4,4) |
| Entrada #5FCF8A | Valor que entra | 8,6 | 9,4 | Sim |
| Saída #F28B84 | Valor que sai | 7,0 | 7,7 | Sim |
| Atenção #F0C15A | Atraso | 9,9 | 10,9 | Sim |
| Setor #7EA6EA (azul do Financeiro) | Aba ativa, link | — | 7,4 | Sim |


**Exemplo · Paleta proposta · tema claro (fundo branco)**


| Cor | Uso | no branco | Passa? |
|---|---|---|---|
| Texto #1D1C1A | Corpo | 17,0 | Sim |
| Texto 2 #5B5852 | Apoio | 7,1 | Sim |
| Texto 3 #6B675F | Rótulo | 5,6 | Sim (ajustado: era #8A867D com 3,6, reprovava) |
| Entrada #1B7A45 | Valor que entra | 5,4 | Sim |
| Saída #B3261E | Valor que sai | 6,5 | Sim |
| Atenção #8A5A00 | Atraso | 5,9 | Sim |


**Exemplo · Cores do sistema de hoje, no cartão escuro #1C1E23**


| Cor atual | Razão | Situação |
|---|---|---|
| Verde #4ADE80 | 9,6 | Passa, mas vibra no escuro (muito saturado) |
| Vermelho #EF4444 | 4,4 | Reprova por 0,1 em texto pequeno |
| Azul #3B82F6 | 4,5 | No limite |
| Dourado #E8B84B | 9,0 | Passa |
| Cinza #94A3B8 | 6,5 | Passa |


O vermelho que usamos para "saída" em todo o Financeiro reprova por pouco em texto pequeno. A versão proposta (#F28B84) é mais clara e menos saturada, passa com folga (7,0) e não vibra. Razões calculadas pela fórmula de luminância relativa do WCAG 2.


## 22 · Tipografia aprofundada


- **Uma família de texto + uma de números.** Texto: sans-serif neutra e legível em tamanho pequeno (IBM Plex Sans, Inter ou Roboto). Números de tabela: fonte com **algarismos tabulares** (a Plex Mono ou a mesma sans com `tabular-nums`). A Stripe usa algarismos tabulares justamente para as colunas alinharem.
- **Serifa só em título de documento** (como neste estudo), nunca em tela de operação.
- **Pesos:** 400 (corpo), 500 (ênfase em tabela), 600 (título e total). Nada de 700/800: pesado demais em tema escuro.
- **Altura de linha:** 1,5 em texto corrido; 1,3 em tabela e botão; 1,2 em título.
- **Largura de leitura:** texto corrido até ~70 caracteres. Tela de explicação larga demais cansa.
- **Caixa alta só em rótulo curto** (cabeçalho de coluna, nome de indicador), com espaçamento entre letras de 0,06 em. Nunca em frase.
- **Sem sublinhado** fora de links. Sem itálico em dado.


**Exemplo · Hierarquia por tipografia e espaço, sem cor (modelo Stripe)**


Contas a pagar


Outubro/2026 · Sorelly · 987 títulos


Falta pagar


420.533,10


27,8% do mês · vencidas R$ 336.237,66


## 23 · Padrões de tela completos


Quase toda tela do sistema cabe em um destes seis moldes. Escolher o molde antes de desenhar elimina a pergunta "como eu organizo isto?".


### Molde 1 · Painel (ex.: Hoje, Visão geral)


**Exemplo · Resumo antes do detalhe: pergunta do dia, indicadores, uma tabela de apoio Hoje · 22/10/2026**SorellyFamília

Disponível

266.298,24

saldo + cheque especial


Vence hoje

12.779,28

17 títulos


Atrasadas

336.237,66

159 títulos


Recebido hoje

40.207,85

52 acertos


#### O que pagar primeiro


| Vence | Título | Natureza | Valor | Estado |
|---|---|---|---|---|
| 07/10 | Cheque Megasul 1356 | Megasul brutos | 1.356,54 | __15 dias |
| 22/10 | Boleto Pontual | Banho | 7.158,53 | Hoje |


### Molde 2 · Lista com filtro (ex.: Contas a pagar, Comissões)


**Exemplo · Barra de filtros · abas de visão · tabela com total · paginação**

 Sorelly Família
 Limpar
 Quando vence Por natureza Pagas

Tabela com linha de total e paginação (25 por página).


### Molde 3 · Detalhe (ex.: um pedido, uma revendedora)


**Exemplo · Breadcrumb · título e estado · dados em duas colunas · linha do tempo · ações**


Financeiro/Fornecedores/Pontual/Pedido 39

**Pedido 39 · Pontual**__Pago


Dados

Valor R$ 7.158,53
Vence 24/10
CNPJ 46


Histórico

22/10 · pago por Lucas
20/10 · aprovado
18/10 · lançado


### Molde 4 · Lançamento de rotina (ex.: faturamento do dia, saldos)


**Exemplo · Curto, uma pergunta por linha, valor de ontem ao lado, um botão principal**


Recebido no mês até hojeontem 888.787,53Acertos no mês até hojeontem 1.124


Hoje o dia é 52 acertos e R$ 40.207,85 (calculado: não digita).
 Lançar dia


### Molde 5 · Relatório mensal (ex.: Fluxo mensal)


**Exemplo · Meses nas colunas, linhas do que importa, meses fechados × previstos diferentes, clique abre o detalhe**


| | Ago | Set 🔒 | Out até 21 | Nov prev. |
|---|---|---|---|---|
| Faturamento | 1.361.845 | 1.427.725 | 928.995 | 1.645.402 |
| Contas pagas | 1.551.292 | 1.422.666 | 1.067.118 | — |
| Resultado do mês | −189.447 | +5.059 | −138.123 | — |
| Saldo acumulado | −189.447 | −184.388 | −322.511 | — |


### Molde 6 · Configuração (ex.: regras, comissões, acessos)


**Exemplo · Seções à esquerda, campos à direita, toggles que valem na hora, histórico de mudanças, quem pode editar**


Geral

Comissões

Datas

Acessos


**Comissões**
__ Reter comissão com promissória pendente


Última mudança: Marcus, 20/10 às 17:40.


## 24 · Permissões e estados de acesso


- **Esconder ou desabilitar?** Se a pessoa **nunca** poderá ver (a família para o funcionário), esconda: nem aparece no menu. Se a pessoa poderia ter e hoje não tem (editar um mês fechado), mostre **desabilitado com o motivo** ("Mês fechado: só o Marcus reabre"). Botão desabilitado sem explicação é a maior fonte de chamado ao suporte.
- **Modo leitura é o padrão; editar é um botão.** Já adotado no Consolidado do faturamento: telas de valores abrem só mostrando, o botão "Editar" aparece só para quem tem a autorização.
- **Autorização com nome de ação, não de pessoa:** "Editar o Consolidado do faturamento", "Ver o Financeiro da família". Quem ocupa o cargo muda, a ação não. (Já é o padrão em RH → Acessos e autorizações.)
- **Mostrar quem fez e quando** em toda edição de dado financeiro (rodapé do bloco ou histórico). Auditoria é parte da interface.
- **Confirmação só em ação destrutiva ou irreversível** (excluir, reabrir mês fechado), escrita em palavras claras, com botão principal que diz a ação ("Reabrir setembro"). Ação reversível não pergunta: faz e oferece "Desfazer".
- **Valores sensíveis** (CPF, salário, valor de kit) aparecem mascarados para quem não tem acesso, com cadeado, e não simplesmente somem, para ninguém achar que o dado não existe.


## 25 · Tokens prontos (para o desenvolvedor)


Este é o bloco que o Leonardo (ou qualquer desenvolvedor) copia para criar uma tela já no padrão. Cada valor é uma decisão; nenhuma tela escreve cor ou tamanho fora dele.


```css
:root{
 /* superfícies (tema escuro é o principal do Sorelly) */
 --fundo:#141518; --superficie:#1c1e23; --superficie-2:#24272d; --linha:#2e3138; --linha-forte:#3c4048;
 /* texto */
 --texto:#ececea; --texto-2:#b4b3ae; --texto-3:#8f8e89;
 /* semântica de dinheiro e estado (fixa) */
 --entrada:#5fcf8a; --entrada-fundo:#17301f;
 --saida:#f28b84; --saida-fundo:#3a1d1b;
 --atencao:#f0c15a; --atencao-fundo:#3a2e12;
 /* cor do setor (uma por setor; só identificação) */
 --setor:#7ea6ea; --setor-fundo:#1f2b43; /* Financeiro */
 /* tipografia */
 --fonte-texto:"IBM Plex Sans",system-ui,sans-serif;
 --fonte-numero:"IBM Plex Mono",ui-monospace,monospace;
 --t-titulo-tela:26px; --t-titulo-bloco:18px; --t-corpo:14px; --t-texto-corrido:16px; --t-rotulo:11px;
 /* espaço (múltiplos de 8) */
 --e-1:4px; --e-2:8px; --e-3:16px; --e-4:24px; --e-5:32px; --e-6:48px;
 /* forma */
 --raio-controle:6px; --raio-bloco:8px; --altura-controle:32px; --altura-controle-normal:40px;
 /* movimento */
 --mov-rapido:120ms; --mov-normal:200ms; --mov-lento:300ms;
}
/* tabela */
.tabela th{font-size:var(--t-rotulo);text-transform:uppercase;letter-spacing:.06em;color:var(--texto-3);text-align:left;background:var(--superficie-2)}
.tabela td.n,.tabela th.n{text-align:right;font-family:var(--fonte-numero);font-variant-numeric:tabular-nums}
.tabela tr.total td{font-weight:600;border-top:2px solid var(--linha-forte);background:var(--superficie-2)}
.entra{color:var(--entrada)} .sai{color:var(--saida)} .atrasa{color:var(--atencao)}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
```


No código atual do Sorelly Admin, isso entra em `components/padrao.js` (constante ESTADO e as peças Indicador, Tab, Td), e as classes do Tailwind passam a apontar para estes tokens em vez de cores soltas.


## 26 · Checklist de revisão de tela


Toda tela, antes de ser entregue (por mim ou por qualquer funcionário que crie um módulo), passa por esta lista. Se um item reprovar, a tela volta.


1. **Molde.** A tela usa um dos seis moldes? Se não, qual é a razão?
2. **Pergunta.** Dá para dizer em uma frase qual pergunta a tela responde? (Hoje, Entradas, Saídas, Resultado…)
3. **Cor.** Só os 9 tokens? Verde entra, vermelho sai, amarelo atraso, setor só identifica?
4. **Sem enfeite.** Zero degradê, anel colorido, sombra em bloco parado?
5. **Números.** À direita, fonte tabular, "R$" uma vez, negativo com sinal de menos, zero ≠ traço?
6. **Totais.** Toda coluna que soma tem total, e o total bate com as linhas?
7. **Escolhas.** 2 a 5 opções visíveis (segmented/abas); dropdown só com 6+?
8. **Nada escondido.** Nenhum bloco fechado por padrão com informação principal?
9. **Filtros.** Uma barra, no topo, com contagem e "Limpar"; período e empresa globais?
10. **Nomes.** Todos os termos estão no vocabulário oficial? Alguma palavra repetida com outro sentido?
11. **Estados.** Carregando, vazio, erro e salvo existem e estão escritos?
12. **Acesso.** Quem não pode ver não vê; quem poderia e não pode vê o motivo?
13. **Celular.** Funciona a 400 px? Alvos de 44 px? Tabela rola dentro dela?
14. **Contraste.** Todo texto passa de 4,5:1? Cor nunca sozinha?
15. **Teclado.** Dá para usar só com Tab/Enter, com foco visível?
16. **Impressão.** Se é relatório, imprime limpo, com data e quem gerou?
17. **Registro.** Versão registrada em Tecnologia → Versões e decisão no diário?


## 27 · Plano de migração por módulo


Reorganizar o sistema inteiro é grande. O jeito de fazer sem parar o sistema é por camadas e por módulo, sempre deixando funcionando.


| Fase | O que entrega | Esforço | Você vê |
|---|---|---|---|
| **0 · Aprovação** | Você aprova as 20 regras, vocabulário e tokens | sua leitura | Nada muda na tela |
| **1 · Fundação** | Tokens em `padrao.js`; componentes novos (Tabela, Indicador, BarraFiltros, Abas, Segmented, Badge, EstadoVazio, Toast); `PADRAO-VISUAL.md` reescrito; tela "Padrão visual" ao vivo no sistema | 1 a 2 dias | Tela de referência de componentes |
| **2 · Tela de referência** | Fluxo mensal do Financeiro, no padrão, para você aprovar | 1 dia | Primeira tela nova |
| **3 · Financeiro** | Menu em 6 grupos; Hoje; Saldo das contas; Contas a pagar; Faturamento; Fornecedores; Comissões; Cobrança, uma por vez | ~10 a 15 telas, 1 a 2 por dia | Financeiro inteiro no padrão |
| **4 · Agendamento e Cadastro** | Mesmo processo; aproveita dados reais das tabelas `acertos_*` e `cadastro_*` | ~8 telas | Dois setores |
| **5 · Representantes, Kits e Atendimento interno** | As telas mais densas (Consolidado dos representantes, listagens): Molde 2 e grade de edição | ~15 telas | Operação |
| **6 · RH, Materiais, Cadastro de peças, Marketing, Diretoria** | Restante | ~20 telas | Sistema inteiro |
| **7 · Apps de celular** | Revisão dos apps simulados com alvo de 44 px, uma linha por descrição, cor sólida | ~5 apps | Celular no padrão |
| **8 · Estados e acessibilidade** | Skeleton, vazio, erro em todas; contraste e teclado verificados | contínuo | Sensação de "pronto" |


- **Regra de ouro:** cada fase termina com o sistema funcionando e uma entrada em Tecnologia → Versões. Nenhuma tela fica "pela metade".
- **Ordem pela dor:** Financeiro primeiro (é o que você olha todo dia); o resto na ordem em que você usa.
- **Auditoria antes de cada módulo:** eu listo tudo que está fora do padrão naquela área, você aprova a lista, e eu migro.
- **Estimativa honesta:** as colunas de esforço são do trabalho de desenhar e ajustar as telas; testar com dados reais de cada módulo pode alongar. Os números do Financeiro já são reais; o dos outros setores dependem das tabelas do admin antigo.


## 28 · Governança: como manter o padrão vivo


Um design system morre quando cada pessoa começa a abrir exceção. O que mantém o padrão:


1. **Uma fonte da verdade.** `PADRAO-VISUAL.md` + `components/padrao.js` + a tela _Tecnologia → Padrão visual_ mostrando cada peça ao vivo. Se não está lá, não existe.
2. **Tela de referência por módulo** aprovada por você; tela nova copia a referência.
3. **Checklist de 17 itens** em toda entrega (seção 26), inclusive de funcionário que terceirizar módulo.
4. **Exceção só por escrito**, no diário de decisões, com data e motivo. Exceção sem registro é erro.
5. **Peça nova só se serve a vários módulos.** Se serve só a uma tela, usa o que já existe. Se precisa mesmo, vai para `padrao.js` e para a tela de padrão, nunca copiada dentro da tela.
6. **Versionamento.** Mudança no padrão é registrada em Tecnologia → Versões como "Padrão visual", com o que muda e qual migração isso exige.
7. **Revisão trimestral** (a cada 3 meses, 1 hora): você, eu e quem criar telas olhamos as 10 telas mais usadas e vemos o que fugiu.
8. **Prompt para quem criar sistema novo:** o texto pronto em Tecnologia → Padrão visual passa a apontar para as 20 regras.


## 29 · Glossário A–Z ampliado


**Acordeão (accordion)**
Lista de seções que abrem e fecham. Bom para perguntas frequentes; ruim para dado principal.

**Acessibilidade (a11y)**
Fazer o sistema funcionar para quem tem baixa visão, daltonismo, usa só teclado ou leitor de tela.

**Alinhamento**
Número à direita, texto à esquerda. Alinhar errado é a causa mais comum de "tabela difícil de ler".

**Alvo de toque**
Área clicável; mínimo 44 px no celular.

**Aria**
Atributos que descrevem a tela para leitores de tela (ex.: aria-label, aria-selected).

**Avatar**
Foto ou iniciais de uma pessoa.

**Badge / etiqueta**
Marca pequena de estado (Pago, Atrasado). Cor + forma + palavra.

**Banner**
Aviso largo no topo de uma tela ou bloco; usar para algo que vale a tela inteira.

**Breadcrumb / trilha**
"Financeiro / Saídas / Contas a pagar": onde estou e como volto.

**Breakpoint / ponto de quebra**
Largura em que o layout muda (600 e 1024 px).

**Card / cartão**
Caixa que agrupa algo como um objeto. Para itens diferentes entre si, não para números comparáveis.

**Chartjunk**
Enfeite de gráfico ou painel sem dado (Tufte): degradê, moldura, sombra, fundo.

**Checkbox / caixa de seleção**
Marcar uma ou várias opções num formulário.

**Chip / ficha**
Etiqueta clicável de filtro ou escolha múltipla.

**Command palette**
Busca de comandos e telas pelo teclado (Ctrl+K).

**Contraste**
Diferença de luz entre texto e fundo. Mínimo 4,5:1 para texto normal.

**Densidade**
Quanto cabe na tela: compacta (32 px por linha) ou confortável (48 px).

**Design token**
Decisão de design com nome (--saida, --e-3). Muda em um lugar, vale no sistema todo.

**Divulgação progressiva**
Mostrar o essencial e esconder o avançado atrás de um clique.

**Drawer / gaveta**
Painel que desliza da lateral para mostrar detalhe sem sair da lista.

**Dropdown / lista suspensa**
Abre uma lista de opções. Para 6+ opções ou texto longo.

**Elevação**
A sensação de estar "por cima". Sombra no claro; superfície mais clara no escuro.

**Empty state / estado vazio**
O que aparece quando não há dado: explica e convida a começar.

**Foco**
O destaque do item que o teclado está selecionando. Precisa ser visível.

**Gestalt**
Leis de percepção (proximidade, similaridade) que explicam por que itens próximos parecem um grupo.

**Grid / grade**
Divisão da tela em colunas; ou tabela editável (data grid).

**Heurística**
Regra prática de usabilidade (as 10 de Nielsen).

**Hierarquia visual**
Ordem em que o olho lê: tamanho, peso e espaço dizem o que é mais importante.

**Hover**
O que muda quando o mouse passa por cima. Não existe no celular: nunca esconder informação só no hover.

**Indicador / KPI**
Número com rótulo, para resumo no topo de uma tela.

**Input / campo**
Caixa onde se digita.

**Lei de Fitts**
Quanto maior e mais perto o alvo, mais rápido o clique.

**Lei de Hick**
Quanto mais opções, mais demora para escolher. Por isso menu enxuto.

**Master-detail**
Lista de um lado, detalhe do selecionado do outro.

**Microcopy**
Os textos pequenos da interface: botões, erros, avisos, estados vazios.

**Modal / diálogo**
Janela que interrompe para uma decisão. Poucas por tela; nunca uma sobre a outra.

**Paginação**
Dividir uma lista em páginas. Preferível à rolagem infinita em tabela de trabalho.

**Placeholder**
Texto de exemplo dentro de um campo vazio. Não substitui o rótulo.

**Radio / opção única**
Escolher exatamente uma opção entre poucas, todas visíveis.

**Rótulo (label)**
Nome do campo ou da coluna.

**Segmented control**
Botões lado a lado, um ativo, que trocam a visão do mesmo conteúdo.

**Skeleton / esqueleto**
Formato cinza do que vai carregar.

**Snackbar / toast**
Aviso curto que some sozinho.

**Spacing scale / escala de espaço**
Lista fixa de espaços (4, 8, 16, 24, 32, 48).

**Sticky**
Elemento que gruda no topo ao rolar (cabeçalho de tabela, primeira coluna).

**Tabs / abas**
Seções de uma mesma tela, uma visível por vez.

**Tabular figures**
Números com largura igual, para alinhar colunas.

**Toggle / chave**
Liga ou desliga uma configuração na hora.

**Tooltip**
Explicação que aparece ao passar o mouse. Complemento, nunca única fonte.

**Tipografia**
Escolha e uso das letras: família, tamanho, peso, altura de linha.

**Wireframe**
Desenho simples da estrutura de uma tela, sem cor nem detalhe.

**WCAG**
Diretrizes internacionais de acessibilidade na web. Nível AA é o alvo.

**Zebra**
Linhas alternadas de tabela com fundo levemente diferente.


## 30 · Plano para você decidir


Para sair do estudo e entrar na obra, faltam cinco respostas suas. Marque o que aprova e corrija o que não:


1. **Alinhamento de números.** À direita (padrão dos estudos) ou manter centralizado como hoje?
2. **Paleta.** Aprova as 9 cores propostas (verde e vermelho mais suaves no escuro, com contraste medido) ou prefere os tons atuais?
3. **Dropdown e segmented control.** Aprova a regra "2 a 5 opções sempre visíveis, dropdown só com 6 ou mais"?
4. **Menu do Financeiro por pergunta** (Hoje, Entradas, Saídas, Resultado, Contas e cadastros, Família) e o vocabulário oficial da seção 19.
5. **Ordem de migração** da seção 27 (Financeiro primeiro) e o Fluxo mensal como tela de referência.


## 31 · Onde estudar mais (todos abertos e gratuitos)


- [IBM Carbon](https://carbondesignsystem.com/components/data-table/usage/): o mais completo para sistema interno; estude Data table, Status indicator, Data visualization.
- [Shopify Polaris](https://polaris.shopify.com/components/tables/data-table): regras de tabela e de escrita; é um sistema de loja, parecido com o seu negócio.
- [Atlassian Design](https://atlassian.design/foundations/design-tokens): tokens explicados do zero; navegação lateral.
- [Material Design, dark theme](https://m2.material.io/design/color/dark-theme): as regras de tema escuro.
- [GOV.UK Design System](https://designnotes.blog.gov.uk/2015/07/03/one-thing-per-page/): formulários e padrões testados com pessoas.
- [GitHub Primer](https://primer.style/product/components/dialog/guidelines): diálogos, gavetas e quando usar cada um.
- [Análises do painel da Stripe](https://www.925studios.co/blog/stripe-dashboard-design-breakdown) e [de nove painéis fintech](https://adminlte.io/blog/fintech-dashboard-design-examples/): para ver o que "denso e limpo" significa em dinheiro.
- Livros: Edward Tufte, _The Visual Display of Quantitative Information_ (1983); Stephen Few, _Information Dashboard Design_.
- Ferramenta de apoio que eu tenho aqui: as 28 Leis de UX (Fitts, Hick, Miller, Gestalt…), que servem de checklist para revisar cada tela.

Estudo completo preparado para Marcus (Sorelly Joias) em 22/10/2026, com 31 seções e 6 moldes de tela. Fontes citadas no corpo. As regras marcadas como "propostas" só valem depois da sua aprovação.
