# Pendências da conversa: Preferências do kit, Metas e padrão de tela (18 a 19/11/2026)

Levantamento pedido pelo Marcus (via conversa "Cadastro Kommo"). Só levantamento: nenhum código foi mudado, nada foi commitado.
Conferido em 19/11/2026 na pasta `C:\Users\marcu\Downloads\sorelly-admin\sorelly-admin` (branch `alteracoes-27-10`, HEAD `a4287a6`).

## 1. Resumo do que foi feito
1. Instalei 4 skills globais (find-skills, verification-before-completion, systematic-debugging, webapp-testing).
2. Medi o padrão das telas boas e as conversas (5.525 mensagens, 1.563 edições de tela, 228 telas). Gravei a análise e 2 scripts.
3. Refiz 3 telas no padrão do Financeiro (bloco com barra azul, faixa azul com menu suspenso, tabela de 11 px, sem dourado, sem caixa alta, nomes em "Bruna Masba"): Preferências do kit › Revendedoras, Metas › Revendedoras, Metas › Regras.
4. Ajustei a peça `TabelaPlanilha` (rodapé "Mostrar mais", barra de grupo e linha de separação) e o `BlocoPainel` (opção `semCaixaAlta`).
5. Escrevi a folha curta de regras `docs/design/PADRAO-CURTO.md` e registrei 3 decisões em `docs/DECISOES.md`.

## 2. Alterações sem commit ou fora da master
**ATENÇÃO (achado de hoje): a pasta de trabalho PERDEU quase tudo.** O merge `a4287a6` ("nos conflitos vale a versão...") apagou os arquivos novos e voltou os editados ao estado antigo.
O trabalho está INTEIRO em dois lugares seguros:
- `git stash@{0}` chamado `pasta-antes-de-atualizar-19-11` (inclui os arquivos novos).
- Pasta `C:\Projetos\backup-sorelly-19-11-antes-de-atualizar` (conferi: os 11 arquivos abaixo existem lá com o conteúdo certo).

| Arquivo | Na pasta de trabalho hoje | No backup e no stash |
|---|---|---|
| `src/apps/montagem/pages/preferencias-kit/Lista.js` (novo) | NÃO EXISTE | sim |
| `src/apps/montagem/pages/PreferenciasKit.js` | versão antiga | sim (nova) |
| `src/apps/montagem/pages/MetasRevendedoras.js` | versão antiga | sim (nova) |
| `src/apps/montagem/pages/MetasRegras.js` | versão antiga | sim (nova) |
| `src/apps/montagem/components/bloco-painel.js` (opção `semCaixaAlta`) | versão antiga | sim |
| `src/apps/montagem/components/tabela-planilha.js` | SÓ a barra de grupo sem caixa alta sobrou. Faltam o rodapé e a linha branca | sim, completo |
| `docs/DECISOES.md` (3 entradas minhas de 18/11) | minhas entradas NÃO estão | sim |
| `docs/design/PADRAO-CURTO.md` (novo) | NÃO EXISTE | sim |
| `docs/design/PADRAO-EXTRAIDO-DAS-TELAS.md` (novo) | NÃO EXISTE | sim (conferido no backup) |
| `docs/historico/ANALISE-DE-TEMPO-DAS-TELAS-18-11-2026.md` (novo) | NÃO EXISTE | sim |
| `scripts/analise-conversas/extrair.mjs` e `analisar.mjs` (novos) | NÃO EXISTEM | sim |

Fora do repositório (seguro, não foi afetado): `C:\Users\marcu\.claude\skills\` com `find-skills`, `verification-before-completion`, `systematic-debugging` e `webapp-testing`.
Esta pasta de trabalho tem 33 arquivos alterados no total (a maioria de outras conversas). Nada meu foi commitado nem foi para a master.

## 3. Pendências
**Pedidos do Marcus não terminados**
1. "Excluir tudo das regras de travas" (ele não consegue ler): NÃO feito. Só escrevi a folha curta. Esperando o ok dele.
2. Refazer a ficha da revendedora (janela que abre ao clicar) no padrão. Ainda no visual antigo (dourado, degradê, 12.5 px, nomes em caixa alta).
3. Refazer as abas Formulário, Análise e Importar (Preferências do kit). A Análise ainda tem dourado.
4. Metas: Acompanhamento, Histórico e Notificações ainda no visual antigo.
5. Fontes: só 13 px (título do bloco) e 11 px (resto). Foi proposta e NÃO foi respondida.
6. O Marcus disse que ia fazer 2 a 5 telas modelo em 19/11 e travar o padrão. Depois: rodar os scripts de análise de novo e comparar com a linha de base (rodadas por tela 2,8; telas com 4 rodadas ou mais 22%; pedidos de correção 20%).

**Ideias combinadas ou oferecidas e esquecidas**
7. Hook que barra "pronto" sem prova (oferecido 2 vezes, nunca respondido nem feito).
8. Migrar as 135 telas com fonte fora do padrão e as 107 com altura fora do padrão por script (maior ganho estimado, mais de 10 vezes). Não começado.
9. Tela nova como "lista de colunas + dados" em vez de 300 linhas. Só ideia.
10. A cor dourada do destaque de coluna filtrada na `TabelaPlanilha` ainda existe (Marcus não decidiu).
11. O `BlocoResumo` (topo dourado e caixa alta) saiu de Metas, mas ainda é usado em 9 arquivos: kits-novos (entregues, kpis), Comissões, FinFamiliar, FinFamiliarFaturas, PosVendas, preferencias-kit/Analise.

**Coisas que eu disse "depois faço" ou deixei para trás**
12. Limpar código morto: `AbaPkRevendedoras` antiga em `preferencias-kit/Revendedoras.js` (só `JanelaDetalhe` e `JanelaRev` ainda são usadas).
13. `nomeBonito` está copiada em 2 arquivos (Lista.js e MetasRevendedoras.js). Deveria ser uma função única em `lib/`.
14. Registrar em `domain/versoes.js` (regra do projeto). Não fiz.
15. Registrar nas pastas do setor: `docs/setores/metas/decisoes.md`, `LEIA-ME.md` (ainda cita `BlocoResumo`) e `pendencias.md`. Não fiz.
16. O Total da lista de Preferências está em fonte maior que as linhas (peça `totalLinha`). Detalhe visual não corrigido.
17. Regra nova do CLAUDE.md de 19/11: botão de ação do bloco vai no CANTO ESQUERDO da barra azul (`acao` do `BlocoPainel`), nunca numa faixa extra. As minhas 3 telas põem botões na faixa azul. Não conferi nem ajustei.
18. O CLAUDE.md e o `PADRAO-VISUAL.md` ainda dizem "dourado fica", "abas visíveis em vez de dropdown" e "Segmentado". Isso contradiz o que o Marcus pediu em 18/11. Não conferi se a seção "VALE HOJE" já foi atualizada.

**Testes não feitos**
19. `npm run conferir` e `npm run verificar`: não rodei.
20. Fotos de referência (Playwright): não rodei. Risco real: `ContasPagarLista.js` usa `limite` ou `sep`, e a peça mudou (rodapé e linha de separação). A foto de Contas a pagar pode reprovar no CI.
21. Rodapé "Mostrar mais" nas outras telas que usam (Dívidas, Fotos de catálogo): não conferi.
22. Salvar de verdade em Metas › Regras e mudar a etapa do brinde em Metas › Revendedoras: NÃO testei (grava no servidor real). Só abri o modo Editar e cancelei. A pendência antiga do setor (primeiro Salvar real) continua.
23. Só testei numa largura de janela. Celular e telas estreitas: não testei.

**Dados não gravados**
24. Nada foi gravado no servidor nem no banco por mim.

## 4. Perguntas prontas para o Marcus (por ordem de importância)
1. **Restaurar agora o trabalho perdido?**
   - Recomendação: sim. Restaurar do `stash@{0}` numa branch própria e commitar logo, com o ok dele.
   - Sim: as 3 telas voltam ao padrão novo. Atenção: `tabela-planilha.js` tem edições de outras conversas; é preciso juntar com cuidado.
   - Não: as 3 telas ficam no visual antigo e perdemos cerca de 1 dia de trabalho. O backup continua existindo.
2. **Trocar o `PADRAO-VISUAL.md` grande e a trava pela folha curta?**
   - Recomendação: sim, em 2 passos: primeiro atualizar a trava (sem dourado, sem caixa alta, menu suspenso, só 11 e 13 px), depois mover o documento grande para `docs/historico/`.
   - Sim: o hook e o CI passam a cobrar as regras do Marcus. Telas antigas só mudam quando forem mexidas.
   - Não: o hook continua cobrando as regras antigas e briga com os pedidos dele.
3. **Fontes: só 13 px (título do bloco) e 11 px (todo o resto)?**
   - Recomendação: sim.
   - Sim: a trava reprova 12, 12.5 e 13 px em tela mexida. Entram na fila 135 telas.
   - Não: continua 11 e 13 misturados.
4. **A regra de 19/11 (botão de ação no canto esquerdo da barra azul) vale também para Preferências do kit e Metas › Regras?**
   - Recomendação: sim.
   - Sim: ajusto as 2 telas (botões saem da faixa e vão para a barra).
   - Não: ficam como estão.
5. **O que fazer primeiro: as 2 a 5 telas modelo dele, ou a migração em lote por script?**
   - Recomendação: modelos primeiro (1 dia), script depois.
   - Modelos primeiro: o script copia um padrão já aprovado.
   - Script primeiro: ganha tempo, mas migra para um padrão que ainda pode mudar.

## 5. Esta conversa pode ser arquivada?
**Não.** Falta:
1. Decidir se restaura o trabalho (pergunta 1). Hoje ele só existe no stash e no backup, fora da pasta de trabalho e fora do Git.
2. Commitar o que for restaurado, com o ok do Marcus.
3. Respostas das perguntas 2 a 5.
4. Registrar em `domain/versoes.js` e nas pastas do setor Metas.

Se arquivar antes: não apagar o `stash@{0}` (`git stash drop`/`clear`) nem a pasta `C:\Projetos\backup-sorelly-19-11-antes-de-atualizar`.
