# Pendências · Top 20 (fichas), Top 100 e Ranking de Encomendas (19/11/2026)

Levantamento a pedido do Marcus. Nenhum código foi mudado para este levantamento. Sem nomes de pessoas neste arquivo.

## 1. O que foi feito

1. Análise das TOP 20 revendedoras (vendas de 18/08 a 18/11) e fichas de 10x10 cm para imprimir (PDF A4, 4 por folha). Também o Top 10 de vendas e de acertos mês a mês de 2026.
2. Tabela do Top 100 (e faixa de proteção 101 a 150) e a regra de acesso a Encomendas: ranking no dia 1º, proteção até o 150º, só sai quem fica 2 meses fora, pedido aberto nunca sai, equipe não exclui.
3. Tela Encomendas › Top 100: bloco "Regras do Top 100" no topo (6 cartões coloridos) e coluna Posição. **Já na master (689e922).**
4. Tela nova Encomendas › Ranking (classificação por total de 3 meses, posição de 1 mês atrás, na lista, situação). Só leitura. Textos "Top 50" trocados por "Top 100". **Pronta e conferida, mas NÃO publicada.**
5. Documentos: `regras-top100.md` e decisão em `DECISOES.md` (a parte de 18/11 já está na master; a de 19/11 não).

## 2. Alterações SEM commit ou fora da master

Worktree `C:\Users\marcu\Downloads\sorelly-admin\sorelly-top100-pub` (sem branch, partiu de origin/master 7cfa7bf; a master já está 16 commits à frente):

| Arquivo | Estado |
|---|---|
| `src/server/encomendas-ranking.js` | novo |
| `app/api/encomendas/ranking/route.js` | novo |
| `src/apps/montagem/pages/encomendas/Ranking.js` | novo |
| `src/apps/montagem/navigation/abas.js`, `perfis.js`, `setores.js` | 1 a 2 linhas cada (aba nova Ranking) |
| `src/apps/montagem/router/slugs.js`, `src/router/rotas.js` | 1 linha cada |
| `src/apps/montagem/pages/Encomendas.js`, `encomendas/Quadro.js`, `Regras.js`, `janelas.js` | texto "Top 50" para "Top 100" e letra 12 px para 13 px |
| `src/apps/montagem/domain/versoes.js` | entrada 0.21.57 |
| `docs/DECISOES.md`, `docs/setores/encomendas-e-reposicoes/regras-top100.md` | seção de 19/11 e estado das telas |

- O `npm run conferir` deu CONFERIDO na última versão.
- O worktree tem atalho `node_modules` para o projeto: antes de remover, fazer `cmd //c "rmdir node_modules"`.
- Na pasta antiga `...\Downloads\sorelly-admin\sorelly-admin` (hoje só cópia, o projeto foi para `C:\Sorelly\sorelly-admin`) copiei os mesmos arquivos para ver na porta 3000. Isso não vale para a master e pode ser descartado.
- Arquivos locais com dados reais (fora do Git, nome `*.local.*`): `docs/dados-locais/top20/` na pasta antiga (dados, fichas v1 a v12, scripts) e cópias em `C:\Users\marcu\Downloads` (`Top20-fichas-Sorelly.pdf/.html`, `Top10-vendas-e-acertos-por-mes.html`, `Top100-encomendas.html/.csv`, `Regras-Top100-Encomendas.md`). Atenção: estão fora do projeto novo; se a pasta antiga for apagada, os scripts e dados somem.

## 3. Pendências

- **Subir o Ranking na master.** Falta o OK do Marcus (pedi 4 vezes, sem resposta). Antes: juntar com a master atual (16 commits à frente; `versoes.js` e `DECISOES.md` quase certo conflito) e rodar `npm run conferir` de novo.
- **O Ranking não muda a lista.** Falta: entrada e saída automáticas no dia 1º, os 5 estados dentro da lista (Ativa, Protegida, Em saída, Saiu, Sem acesso), "pedido aberto nunca sai", sem botão de excluir para a equipe, aviso ao sair, histórico de cada mudança e as exceções da diretoria com motivo e prazo.
- **Lista real tem só 50.** O Ranking mostrou 58 revendedoras do Top 100 que ainda não estão nela (situação "Entrar"). Falta decidir como incluí-las (botão "Aplicar ranking" ou uma por uma).
- **Rota da tela ainda `/encomendas/top-50`** (mantida para não quebrar links salvos). O código e as pastas ainda se chamam `top50`.
- **Textos "Top 50" que sobraram** em `domain/encomendas.js` (mensagens para as revendedoras) foram trocados só no meu worktree; se não subir, o sistema continua com 50 no texto.
- **Ranking usa o período corrido de 3 meses** (da data de hoje para trás). A tela Top 100 usa set, out e nov (meses do calendário). Os dois podem dar posições diferentes. Falta o Marcus escolher um.
- **Fichas TOP 20:** só a versão v12 foi entregue. Ficaram sem fazer: versão com fundo branco para gastar menos tinta (perguntei, sem resposta) e o PDF com folha de ranking no começo. O texto `Top20-resumo.md` em Downloads está desatualizado (dos botões).
- **Top 10 por mês:** só 2026 (o banco só guarda 2026). Maior preço vendido das fichas vale só para os 3 meses.
- **Fichas, dados a conferir:** "Sorelly (atendimento interno)" aparece quando o kit principal é do vendedor 02. Nome da representante "Thalita - Sc" foi cortado para "Thalita" só nas fichas.
- **Regra do Top 100: 3 pontos em aberto** (aviso de saída por WhatsApp ou app, quem confere a lista no dia 1º, desde quando conta "pedido aberto").
- **GitHub avisa que o repositório mudou** para `HEOGroup/sorelly-admin`; o remoto ainda aponta para o endereço antigo (funciona).
- **Nunca testado:** o Ranking com um usuário que não seja da diretoria (acesso pelo módulo `er`); a tela no celular só foi vista como cartões, sem usar os filtros.

## 4. Perguntas prontas para o Marcus

1. **Posso subir o Ranking e os textos na master?** Recomendo sim, depois de juntar e conferir de novo. Se sim, a tela aparece para a equipe de Encomendas hoje. Se não, ela fica só no meu worktree.
2. **A classificação usa os 3 meses corridos (como as fichas) ou os 3 meses do calendário (set, out, nov)?** Recomendo corrido: não muda no meio do mês. Se calendário, quem ainda não acertou no mês atual cai de posição.
3. **Como incluir as 58 que faltam na lista do Top 100?** Recomendo um botão "Aplicar ranking" com confirmação e registro no histórico. Se uma por uma, demora e a lista segue com 50.
4. **Quem confere a lista no dia 1º e como é o aviso de saída?** Recomendo a diretoria conferir e o aviso por WhatsApp (já usam). Sem decisão, não dá para ligar a saída automática.
5. **Quer a versão das fichas com fundo branco, para gastar menos tinta?** Recomendo sim se forem imprimir mais de 20. Se não, ficam como estão.

## 5. Esta conversa pode ser arquivada?

**Não.** Falta: (a) o OK do Marcus e o push do Ranking e dos textos (com junção e conferência de novo); (b) decidir os pontos 2 a 4 acima para ligar a entrada e a saída automáticas; (c) guardar os arquivos `.local` da pasta antiga em lugar seguro. Depois do push, remover o worktree `sorelly-top100-pub` (primeiro o atalho `node_modules`).
