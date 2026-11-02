# Diretoria: decisões

Cópia fiel das decisões do diário geral (`docs/DECISOES.md`) que falam deste setor, da mais nova para a mais antiga.
O texto é o original. Para a decisão completa, abra o diário na linha indicada. Decisão nova entra no diário geral E aqui, no mesmo dia.
Lista separada por palavras-chave em 01/11/2026: pode ter decisão de outro setor misturada (revisar com o Marcus).

- **29/10/2026** (diário, linha 72; Melhorias · setor da Diretoria): **Marcus (29/10/2026):** o setor de Marcus, Nickolas e Lucas nos pedidos de melhoria é **Diretoria**, não "Acesso total" (`DIRETORIA` em `domain/equipe.js`); vale para pedido novo e para o pedido do Nickolas.

- **20/10/2026** (diário, linha 279): **Sistema Marcus (particular):** Marcus quer SENHAS dentro do sistema (decisão dele, mesmo avisado do risco). Elas e todo dado pessoal/patrimônio ficam só em `domain/marcus.local.js` (gitignored; repositório público) e no navegador (`sorelly_marcus_v1`); a tela mostra senha escondida com "revelar/copiar". A "retirada" do Marcus não é salário fixo: é recebido × faturado × % por mês (2025 e 2026 lançados). Patrimônio informado: M2 R$ 500 mil, 320i R$ 300 mil, apartamento Guaratuba R$ 500 mil, 2 apartamentos Curitiba R$ 350 mil cada (valores dele). Saldos devedores ainda faltam. Contas de outubro viraram modelo (fixas repetem). Tela: `pages/MarcusPessoal.js`, lógica `domain/marcus.js`.
- **20/10/2026** (diário, linha 279): Indicações: moedas por kit entregue (1.000?) e validade das moedas (90 dias só informativa).
- **20/10/2026** (diário, linha 279): Estrutura de **Avaliações** (abas por tipo) ainda não construída.
- **20/10/2026** (diário, linha 279): Leonardo/Juan: acesso de leitura ao banco de produção para puxar dados reais.
- **20/10/2026** (diário, linha 646; · Sistema particular do Marcus): Botao Admin / Marcus no alto do menu (so o Marcus, usuario 16, ve) no lugar de Completo / HTML. Modo Marcus mostra so a aba "Marcus" (pages/MarcusPessoal.js, /montagem/marcus). Informacoes pessoais em MARCUS.local.md (gitignored: *.local.md). Nada de senha dentro de arquivo que vai ao GitHub.
- **20/10/2026** (diário, linha 694; · Sistema do Marcus: tema e listas): Preto e dourado mais estilizado, fontes maiores, hover e clique nos botoes/linhas (CSS ESTILO em pages/MarcusPessoal.js, escopo .mx).
- **20/10/2026** (diário, linha 694; · Sistema do Marcus: tema e listas): Resumo em listas (patrimonio, recebido e faturado por ano, contas do mes, atividades); Faturamento com 2025 e 2026 em sequencia, listagem com recebido, faturado e
- **20/10/2026** (diário, linha 697; · Sistema do Marcus: tema e listas): Preto e dourado mais estilizado, fontes maiores, hover e clique nos botoes e linhas (CSS ESTILO em pages/MarcusPessoal.js, escopo .mx).
- **20/10/2026** (diário, linha 697; · Sistema do Marcus: tema e listas): Resumo em listas (patrimonio, recebido e faturado por ano, contas do mes, atividades); Faturamento com 2025 e 2026 em sequencia, em listagem com recebido, faturado e %.
- **20/10/2026** (diário, linha 697; · Sistema do Marcus: tema e listas): Empresas no nome do Marcus: SO H&O e Mayz (as outras ficam fora da tela). Carros: "Meus carros" (proprietario Marcus) separados dos "Carros da familia".
- **20/10/2026** (diário, linha 697; · Sistema do Marcus: tema e listas): Botao "Copiar para WhatsApp" em cada bloco (texto com *negrito* nas palavras importantes) e "Copiar o resumo todo". Acessos e senhas NAO tem botao de copiar o bloco.

- **26/10/2026** (diário, linha 1065; · Busca do topo e endereço curto (Marcus): O campo do topo (`components/ir-para.js`) virou busca de telas: a partir de 4 letras mostra sugestões de todos os setores (com caminho setor › grupo), respeita o acesso (`podeMenu`) e abre pelo mesmo caminho do menu (`abrirMenu`). Endereço colado (começa com / ou http) continua indo direto.
- **26/10/2026** (diário, linha 1065; · Busca do topo e endereço curto (Marcus): `/montagem` é o nome interno do app principal (o outro app é `/kits-novos`). NÃO foi removido das rotas (BASE em `router/slugs.js`); em vez disso o endereço curto vale: `/app-revendedora` redireciona para `/montagem/app-revendedora` (`SemPrefixo` em `router/rotas.js`). Daqui em diante os caminhos que o Claude manda ao Marcus não levam `/montagem`.
