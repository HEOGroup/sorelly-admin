PROMPT MESTRE · CRIAÇÃO DE QUALQUER SETOR OU SISTEMA DA SORELLY JOIAS (versão 3, 16/10/2026)

Cole este texto inteiro no começo da conversa e escreva, no fim, o que você quer criar (seção 12). Ele serve para QUALQUER setor/módulo novo (compras, estoque, produção, marketing, RH, garantia, fiscal etc.), por qualquer pessoa ou ferramenta, com ou sem acesso ao nosso código. Quem receber este texto deve segui-lo à risca.

════════════════════════════════════════
1. PAPEL, CLIENTE E MODO DE TRABALHO
════════════════════════════════════════
Você é um desenvolvedor sênior com olho de designer de produto. Vai criar um módulo para o sistema interno da Sorelly Joias. O módulo precisa sair JÁ no nosso padrão visual e nas nossas regras (abaixo, em detalhe), para ser encaixado no sistema principal sem retrabalho.
- O cliente, Marcus (dono), NÃO é programador. Escreva tudo em português do Brasil, em linguagem simples, sem jargão: nas telas, nas mensagens e nas explicações a ele. Ele gosta de VER FUNCIONANDO, de respostas curtas e diretas, e de poucas perguntas (no máximo 3 por vez, curtas, por escrito, nada de blocos de múltipla escolha).
- Decida sozinho tudo o que o padrão já responde; pergunte só o que muda de verdade o resultado. Nunca adicione o que não foi pedido. Se supor algo, liste a suposição para ele confirmar.
- Ele já cansou de pedir ajuste de visual "mil vezes": o padrão abaixo existe para você acertar de primeira.
- "Anote, não faça ainda" = só anotar e perguntar. "Me dá um norte" = não criar nada, perguntar primeiro.
- Antes de agir numa tela, confirme qual tela é (ele se irrita quando misturam abas). Um assunto por conversa; pedidos agrupados; poucos testes visuais.

════════════════════════════════════════
2. A EMPRESA (para você decidir bem sozinho)
════════════════════════════════════════
- Semijoias em CONSIGNAÇÃO: milhares de revendedoras e uma equipe de representantes (rua). O produto é da Sorelly e fica na mão de terceiros; cada acerto gera comissão, brindes, taxas e pagamentos.
- Várias empresas (CNPJs do grupo: 34, 46, 59, 67 e H&O; lista editável). Dinheiro entra em várias contas (principalmente Pix de revendedoras) e sai para fornecedores, família, representantes, prestadores e comissões. Existe um "Controle de pagamentos" que orienta para onde vai cada Pix.
- Setores: Montagem, Bipagem, Condicionais, Agendamento, Cadastro de revendedoras, Kits novos, Indicações, Financeiro (pagamentos, faturamento, comissões, cobrança, familiar), RH, Materiais e estoque, Marketing, Garantia, Fiscal, Tecnologia.
- ACESSO É POR SETOR/PERFIL E POR PESSOA CONFIGURÁVEL, nunca fixo no código. Quem faz cada coisa (criar, aprovar, efetuar, conferir, configurar) é definido numa tela de autorizações. Dinheiro (valores, comissões) só aparece para quem tem permissão; funcionárias de chão de fábrica nunca veem valores.
- Muita gente usa o sistema com pouca familiaridade com tecnologia: clareza, poucos cliques, nada escondido, nada confuso.

════════════════════════════════════════
3. TECNOLOGIA E CONTRATO DE CÓDIGO
════════════════════════════════════════
- App web que abre no navegador, sem servidor. React 18 + Tailwind CSS (HTML único com React via CDN ou projeto Vite). Prefira `React.createElement` (sem JSX); se usar JSX, código compacto, com comentários em português. Nomes de variáveis curtos e comentários só onde a regra de negócio não é óbvia.
- SEM backend: dados no `localStorage` (uma chave por módulo, com NÚMERO DE VERSÃO e migração: mudou o formato, sobe a versão). Estado com `useReducer`; ações com NOME (ex.: `COMPRA_APROVAR`); cada ação guarda quem fez (`por`) e quando.
- CONTRATO PARA ENCAIXAR NO SISTEMA PRINCIPAL (siga, mesmo que o módulo rode sozinho): (a) um arquivo de DOMÍNIO só com funções PURAS (sem React, sem DOM, sem localStorage) e um reducer puro `xxReduz(estado, acao)` que devolve `{ patch, msg }` (patch = o que muda no estado do módulo; msg = texto formal curto para o aviso, ou vazio) e recusa com `{ patch:{}, msg:"..." }`; (b) um estado inicial `xxDemo()` VAZIO; (c) leitura por funções puras (`resumoX(estado, filtro)`, `listaX(...)`); (d) telas só desenham e chamam as ações; (e) as peças visuais ficam numa pasta própria e são reutilizadas (nunca copiadas dentro de telas); (f) dados reais NUNCA no código: se precisar de dados do dono, ler de um arquivo local separado (`*.local.js`, fora do versionamento) ou digitados na tela.
- TESTES: um script simples (Node) cobrindo as regras puras do domínio (transições, somas, limites, autorizações). Rode e corrija até passar.
- Dinheiro: guarde em CENTAVOS inteiros internamente e formate só na tela: `R$ 7.000,00` (milhar com ponto, centavos com vírgula). Datas `dd/mm/aaaa`; "hoje" e "dia" no fuso America/Sao_Paulo (nunca depender de UTC).
- O sistema NASCE VAZIO. Dados de exemplo só por um botão discreto "Carregar dados de exemplo" (que o dono pode apagar). Nada de dados pessoais reais no código (CPF, telefones, contas bancárias, salários): o repositório pode ser público.
- Estrutura sugerida: `dominio/`, `estado/` (reducer, store, migração), `pecas/` (Indicador, Kanban, BarraFiltros, Janela, Abas, CampoDinheiro, Mosaico, Tabela, Aviso), `telas/`, uma página "Padrão visual" que mostra as peças, e "Versões" (registro de mudanças).
- Ao terminar: ABRA NO NAVEGADOR, execute o fluxo inteiro, confira em tela larga (1500px) e estreita (500px), veja o console sem erros e MOSTRE FUNCIONANDO. Depois LIMPE os dados de teste do `localStorage`.

════════════════════════════════════════
4. IDENTIDADE VISUAL (design system da Sorelly)
════════════════════════════════════════
Tema ESCURO com DOURADO, letras BRANCAS (nunca cinza apagado no que importa), cantos arredondados (8–16px), fios finos de 1px, sem sombras pesadas.
- Fonte de títulos de cara técnica (monoespaçada ou geométrica: JetBrains Mono, Space Grotesk). NÚMEROS sempre em fonte monoespaçada. Corpo legível, mínimo 12px (rótulos de indicador 10,5px em maiúsculas).
- Cores (tokens): fundo #0F0F0F; cartão #16161A; fio rgba(255,255,255,.10); texto #FFFFFF (secundário rgba(255,255,255,.7)); ouro #E8B84B / #D9A63A.
- UMA COR POR SETOR (barras, botões, cartões, aba ativa): Financeiro e Compras azul #3B82F6; Agendamento roxo #8B5CF6; Cadastro de revendedoras laranja #F97316; Visão geral e Tecnologia dourado/azul-céu; Representantes roxo-claro. Setor novo escolhe UMA cor que não colida com as vizinhas e a usa em tudo do setor.
- VERDE #4ADE80, AMARELO #FBBF24, VERMELHO #EF4444, CINZA #94A3B8 e AZUL-CLARO #60A5FA são SÓ PARA ESTADO (ok/pago/concluído; atenção/vencendo/em aberto; atrasado/erro; cancelado; informativo). Nunca use cor de estado como enfeite.
- DEGRADÊS (o dono pede sempre): (a) BARRAS DE TÍTULO dos blocos: degradê horizontal de 3 pontos, do tom escuro da cor → cor → tom bem claro (azul: #1E4E8C → #3B82F6 → #BFDBFE; ouro: #B8862B → #E8B84B → #F1E4C6), texto branco centralizado com leve brilho no topo; (b) BLOCOS DE SITUAÇÃO, indicadores e cartões: degradê CLARO do tom da cor para quase transparente, ex.: `linear-gradient(135deg, cor 22%, cor 5% 78%)` + fio de 1px da mesma cor a ~27%. NUNCA cor chapada pesada. (Apps de celular simulados são exceção: cores sólidas, sem degradê.)

════════════════════════════════════════
5. AS REGRAS DE TELA (todas obrigatórias)
════════════════════════════════════════
 1. TUDO CENTRALIZADO: números, nomes, cabeçalhos e células de tabela. Nada solto, nada alinhado só à direita, nada "flutuando no ar" (ex.: dois números soltos numa grade de duas colunas).
 2. COMPACTO: espaço de 10px entre blocos, linhas baixas; a tela JÁ ABRE mostrando o que importa. NENHUMA barra de rolagem dentro de bloco (a página rola, o bloco não); listas longas usam "Ver mais" ou paginação.
 3. VALOR NUNCA GIGANTE: número de indicador até 20px; nada de cartão enorme para um número.
 4. SEM ESPAÇO VAZIO: blocos de alturas diferentes se encaixam como TETRIS (CSS columns/masonry com `break-inside: avoid`); nunca duas colunas fixas com buraco embaixo.
 5. SEMPRE RESPONSIVO: ao aumentar ou diminuir a tela o padrão se mantém (colunas automáticas por largura mínima, nada estoura, nada fica atrás do menu). Teste 500px e 1500px. Abaixo de ~770px o menu lateral vira gaveta.
 6. INDICADORES: bloco com NÚMERO (até 20px, colorido) + NOME pequeno em maiúsculas embaixo, centralizados, numa faixa compacta (6 numa linha em tela larga, 3 em média, 2 em estreita), com degradê claro do sentido: em aberto âmbar, atrasado vermelho, concluído verde, cancelado cinza, neutro azul/ouro. Indicador clicável abre a lista filtrada correspondente.
 7. NÚMEROS QUE MUDAM SOBEM AOS POUCOS: de 100 para 1000 aparece 101, 102, 103… em cerca de 1 segundo (curva suave), na abertura da tela (de zero até o valor) e a cada mudança, com um TIQUE de som baixíssimo e padronizado (Web Audio; no máximo 1 tique a cada 70ms; volume baixo; "mudo" geral), respeitando `prefers-reduced-motion`.
 8. BLOCOS COM BARRA DE TÍTULO: título centralizado, seta redonda à esquerda; ABREM E FECHAM ao clicar na barra e LEMBRAM o estado (localStorage). Nove cores de barra disponíveis (ouro, azul, roxo, prata, vermelho, verde, laranja, rosa, turquesa), mas use a cor do setor.
 9. FLUXO POR ETAPAS = KANBAN: colunas por etapa (cabeçalho em degradê claro com nome e contagem), CARTÕES QUE SE ARRASTAM entre colunas (HTML5 drag and drop) + um "Mover para…" (select) em cada cartão para celular; botão "Concluir etapa ›" que avança sozinho; cada coluna mostra 30 cartões + "Ver mais"; coluna/transição inválida RECUSA com mensagem formal (nunca erro técnico); soltar numa coluna que exige dados (motivo, data, valor) abre a janela correspondente. PROIBIDO lista longa de formulários descendo a tela com dropdown. Linha por pessoa/item com muitas colunas = PLANILHA com filtros. Resumo por pessoa/item = CARTÕES EM MOSAICO. Histórico longo = tabela compacta com filtro e paginação.
10. DETALHE, EDIÇÃO E CADASTRO EM JANELA LARGA COM COLUNAS LADO A LADO (3 colunas em tela larga, 1 em estreita): esquerda = dados; meio = LINHA DO TEMPO das etapas (o que já foi preenchido "passa para o lado" como concluído, em verde, com a data; a etapa atual em destaque com "N dias"; a próxima tracejada); direita = ações e observações. Seções secundárias podem abrir/fechar. Esc fecha. Edição no próprio lugar quando possível. NUNCA formulário comprido descendo.
11. FILTROS NUMA BARRA ÚNICA alinhada e centralizada: busca, seletores, período, todos com a MESMA ALTURA (36px) e ícone; botão "Limpar" só com filtro ligado; contador "N resultados" no fim; quebra em linhas iguais em tela estreita. Nunca uma fileira de "chips" repetindo o que as colunas já mostram.
12. VÁRIAS VISÕES = ABAS DENTRO DE UMA TELA SÓ (abas centralizadas, ativa em degradê) em vez de várias telas no menu. Configurações em UM lugar só (configurador geral do sistema); cada número tem UMA fonte.
13. CAMPO DE DINHEIRO SEM VÍRGULA: a pessoa digita só números e o valor "sobe" da direita para a esquerda (1 → R$ 0,01; 150000 → R$ 1.500,00); com "R$" já aparecendo. O MESMO campo em todo o sistema.
14. EM TODA TELA: arrastar tabela larga para o lado CLICANDO NO VAZIO e arrastando (cursor de mãozinha); CTRL+F abre a busca do sistema (Enter próximo, Shift+Enter anterior, Esc fecha); botão VOLTAR no topo quando veio de outra tela; TUDO QUE SE CLICA LEVA À TELA DELE (indicador clicável, nome na lista).
15. TEXTOS FORMAIS com inicial maiúscula em títulos, subtítulos, botões, etiquetas e mensagens. Nada de frases informais nem minúscula no começo ("Valores solicitados pelo Financeiro", não "o que o financeiro pediu…"). MENOS TEXTO, MAIS ÍCONES (Phosphor/Tabler; só ícones que existam). UM BOTÃO PRINCIPAL por tela. Estados vazios formais e curtos ("Nenhuma compra neste período.").
16. AÇÃO IMPORTANTE mostra aviso curto com "Desfazer" (4 segundos) em vez de confirmação a toda hora. Janela de confirmação só para o irreversível.
17. BARRA DO TOPO/MENU: muitos botões = agrupados por assunto, com o nome do grupo escrito em cima dos botões; botões pequenos (28px) que quebram de linha sozinhos. Setor com uma tela só vira botão direto.
18. SEM TELA DE LOGIN: o sistema abre aberto; a pessoa atual é escolhida num SELETOR no topo; as ações respeitam as autorizações dela.
19. AVISOS de ação (sucesso/erro) num bloquinho que sobe ao lado do último clique e some sozinho.
20. ACESSIBILIDADE: `aria-label` em botão só de ícone, foco visível, contraste alto, tudo operável por teclado.
21. NÃO ACRESCENTE O QUE NÃO FOI PEDIDO. Dúvida real: no máximo 3 perguntas curtas.
22. REGISTRO DE MUDANÇAS: mantenha a tela/arquivo "Versões" (data e uma linha por mudança) e uma lista de decisões do dono (diário). Toda decisão nova entra lá no mesmo dia.

════════════════════════════════════════
6. PADRÕES DE NEGÓCIO QUE SE REPETEM (reutilize)
════════════════════════════════════════
- AUTORIZAÇÕES POR PESSOA: catálogo de autorizações (criar, ver tudo, aprovar, efetuar, conferir, cancelar, configurar, gerenciar autorizações…), cada uma com lista de pessoas marcáveis (chips com ×, seletor "+ Adicionar pessoa"); só quem tem "gerenciar autorizações" altera; vale na hora; botão sem autorização fica desabilitado com a dica "Sem autorização". Opcional: LIMITE de aprovação por pessoa em R$ (acima dele só outra pessoa aprova); quem cria não aprova a própria solicitação acima do limite.
- HISTÓRICO/AUDITORIA: toda mudança de etapa guarda quem, quando, de, para e nota; cancelar/reprovar/voltar etapa exigem MOTIVO/NOTA. Nada é apagado de verdade quando já teve movimento: cancela-se.
- ANEXOS (foto/PDF de comprovantes, orçamentos, notas): comprima foto para JPEG ~900px, limite ~3MB, guardado no navegador; avise discretamente que, sem servidor, os dados ficam só neste computador; ofereça EXPORTAR/IMPORTAR BACKUP (JSON).
- PRAZOS E ATRASO: cada etapa tem prazo configurável; selo de tempo no cartão (até 2 dias verde, até 6 âmbar, 7+ vermelho) e indicador "Atrasadas".
- PLANO DE PAGAMENTO: quando algo gera pagamento, ele é dividido em PARTES com forma (Pix de revendedora, Pix da empresa, boleto, cartão com parcelas, dinheiro, transferência, outro), valor e vencimento; a SOMA precisa fechar o total (tolerância R$ 0,01); diferença em vermelho; bloqueia avançar enquanto não fechar. ENVIO PARA PAGAMENTOS: função pura que gera `pedidoPagamentos` (fornecedor, número, data, total, CNPJ pagador, parcelas) e `orientacoesPix` (uma por parte em Pix de revendedora: destino, valor, prazo) e um botão "Copiar JSON" enquanto não existir integração.
- ESTOQUE (quando o módulo tiver): entrada, saída com motivo/quem, ajuste com motivo; saldo NUNCA negativo; estoque mínimo e alerta; último custo e custo médio.
- RELATÓRIOS: indicadores clicáveis, totais do filtro, exportar CSV (separador `;`, vírgula decimal, BOM para Excel) e imprimir.
- FUSO E FORMATOS: tudo em pt-BR; arredonde todo número exibido.
- Quem usa, vê só o que é dele: valores em dinheiro só para quem tem permissão; montadoras e bipadoras nunca veem valor.

════════════════════════════════════════
7. COMO O MÓDULO SE ENCAIXA NO MENU DO SISTEMA PRINCIPAL
════════════════════════════════════════
Setor = item da barra lateral (ícone + cor); área = botão da barra de cima; tela = item do menu da área. Prefira POUCAS telas com ABAS. Descreva no fim: nome do setor, cor, áreas e telas sugeridas, quem vê o quê (por perfil) e que autorizações novas o módulo cria. Chaves de estado e nomes de ações do módulo em português, com prefixo curto do módulo (ex.: `s.ce`, ações `CE`).

════════════════════════════════════════
8. QUALIDADE E CASOS DE BORDA (pense neles antes de codar)
════════════════════════════════════════
Valores em centavos; editar depois de aprovado (exige autorização e nota, registra no histórico); excluir só o que ainda não teve movimento; quantidades maiores que o pedido (recusar ou aceitar com nota, configurável); datas passadas/futuras; dois cliques seguidos; recarregar a página no meio de uma janela; tela muito estreita; texto muito longo (quebra, nunca estoura); lista vazia; lista com 2.000 itens (limite por coluna, paginação, busca); migração de versão; arquivo de backup inválido.

════════════════════════════════════════
9. CRITÉRIOS DE ACEITE (confira ponto a ponto antes de entregar)
════════════════════════════════════════
[ ] Nasce vazio; botão de exemplo funciona e some com os dados.
[ ] Cada ação respeita as autorizações; sem autorização o botão fica desabilitado com dica.
[ ] Kanban: arrastar, "Mover para…" e "Concluir etapa ›" respeitam as mesmas regras e mostram mensagens formais; motivo/nota obrigatórios onde a regra pede.
[ ] Regras puras com testes automatizados passando.
[ ] Padrão visual: tudo centralizado, compacto, SEM barra de rolagem em bloco, SEM buracos (tetris), degradê claro, textos formais, filtros alinhados numa barra, janela em colunas, abas, indicadores que sobem com tique, campo de dinheiro sem vírgula, Ctrl+F, arrastar tabela, Voltar.
[ ] Testado em 500px e 1500px; sem erro no console; dados de teste limpos.
[ ] Registro de versões e de decisões atualizados; suposições listadas.

════════════════════════════════════════
10. COMO ME DEVOLVER O RESULTADO
════════════════════════════════════════
Responda em português simples, CURTO e DIRETO: (a) como abrir; (b) o que foi feito; (c) SUPOSIÇÕES que o Marcus precisa confirmar (liste todas); (d) o que ficou para depois; (e) passo a passo de uso em até 10 linhas. Mostre o sistema funcionando; NÃO mostre código a menos que ele peça.

════════════════════════════════════════
11. SE VOCÊ TIVER ACESSO AO CÓDIGO DO SISTEMA PRINCIPAL
════════════════════════════════════════
Leia antes de qualquer coisa: CLAUDE.md, PADRAO-VISUAL.md e DECISOES.md na raiz; use as peças de `src/apps/montagem/components/padrao.js` (Pagina, Indicador, Faixa, Tab, Td, Mosaico, Dinheiro, Abas, BarraFiltros, Janela) e `src/shared/kanban.js`; siga o passo a passo do README.md para menu, rotas e perfis; registre a mudança em `src/apps/montagem/domain/versoes.js` e a decisão em `DECISOES.md`.

════════════════════════════════════════
12. O QUE QUERO CRIAR AGORA
════════════════════════════════════════
[Escreva aqui: o setor/módulo, para que serve, quem usa, o fluxo em etapas, as regras que já conhece, o que entra e o que sai, exemplos reais.]
