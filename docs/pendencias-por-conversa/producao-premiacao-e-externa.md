# Pendências · conversa Produção (premiação, lançamento, produção externa)
Levantamento de 19/11/2026. Só leitura: nada foi mudado, commitado ou publicado por este levantamento.

## 1. O que foi feito
- Premiação com bônus por dia (R$ 15 aos 300, R$ 20 aos 350, R$ 25 aos 400+; paga dia 11 do mês seguinte), 2 linhas por pessoa, cores por faixa.
- Janela de lançamento: funcionária lança código e quantidade (preço automático), "Lançar" trava o dia, "Pedir correção"; hoje a janela da Diretoria mostra linhas gravadas como texto com botão Editar, linha nova no fim.
- Produção externa em formato de estoque (Dávila, Leci, Didi a R$ 0,45 por peça), pagamentos por semana (quarta) e tela nova "Pagamento por produção" (um dia por linha).
- Dados reais lançados no banco: dias 18 e 19/11 da Dávila; correção IO766 para I0766 (19/11); envio da Leci de 19/11 (16 códigos, 1.007 peças).
- Rodapé da Premiação corrigido (nome da última funcionária cobria o TOTAL).

## 2. Alterações sem commit ou fora da master
Pasta: `C:\Users\marcu\Downloads\sorelly-admin\sorelly-admin`, branch `alteracoes-27-10`. Sem commit:
- `src/apps/montagem/pages/producao/ProdEditorDia.js` (janela nova: Editar, linha no fim, sem Categoria)
- `src/apps/montagem/pages/producao/ProdPremiacao.js` (altura do nome 52 px)
- `src/apps/montagem/pages/producao/ProdPagamentoProducao.js` (NOVO, não rastreado)
- `src/apps/montagem/pages/Producao.js`, `navigation/abas.js`, `navigation/setores.js`, `router/slugs.js`, `src/router/rotas.js` (aba nova "Pagamento por produção")
- `docs/DECISOES.md`, `src/apps/montagem/domain/versoes.js` (entradas locais; versoes.js da master tem conserto estrutural pendente)
- Scripts de teste não rastreados/locais: `scripts/testar-producao-trava.mjs`, `scripts/testar-producao-casa.mjs`
- Worktree `C:\Users\marcu\Downloads\sorelly-admin\sorelly-prod-pub3` (preparado, sem commit): tem `src/server/trava-producao.js`.

**ATENÇÃO, NÃO ENCONTRADOS NA PASTA PRINCIPAL (podem ter sido perdidos no merge de 19/11):**
- `src/server/trava-producao.js` (trava do servidor) existe só no worktree `sorelly-prod-pub3`.
- `app/api/estado/[modulo]/route.js`: sem a chamada `protegerProducao` (a trava do servidor NÃO está ligada).
- `src/apps/montagem/pages/producao/ProdPecasFeitas.js` (bloco "Peças que ela fez") NÃO existe em nenhuma pasta; `ProdExterna.js` não importa o bloco.
- `scripts/testar-trava-producao.mjs` não existe.
- Na master (v0.21.42 em diante) está o que foi publicado antes; a v0.21.46 foi publicada, mas confirmar o conteúdo dela.

## 3. Pendências
- Publicar (precisa do "Publica" do Marcus): janela nova, aba Pagamento por produção, rodapé da Premiação.
- Refazer: bloco "Peças que ela fez" (código, modelo, quantidade, preço, valor total) se não estiver na master.
- Refazer/religar a trava do servidor (impede página velha apagar linhas da Dávila: já aconteceu 4 vezes).
- Aviso de key do React (`visualProd.js` com `casca`): confirmar se foi publicado.
- TRIO da Dávila (dias 11 a 15/11, 1.792 peças): sem código real e sem preço.
- "BB P0033" (Fernanda, 07/11, 11 peças) tem espaço no código; provável BBP0033. Sem correção.
- Lista da Deysiane: total 545, soma 543. Linha errada não achada.
- Dia 10/11 da Dávila: diária de R$ 130 paga sem peças. Dias 11 e 13/11 gravados como unidade Sorelly (tratados como externa pelo nome).
- Marcus: cadastrar Leci e Didi como prestadoras (Pix) no Financeiro; Financeiro confirmar o Pix de R$ 520 (Nathalia); enviar o pagamento da Dávila de 25/11 (R$ 777,60); lançar a produção da Leci/Didi; pedir a Crisbele da Silva e Sandra Krefta para "atualizar a tela".
- "Marcar pago" na tela Pagamento por produção só marca o dia; não cria Pix no Financeiro.
- Não testado: janela da funcionária (só testei como Diretoria), botão Marcar pago, Leci/Didi na tela nova.
- Registrar versão em `versoes.js` e `DECISOES.md` das mudanças desta rodada (janela, aba nova, Leci).
- Limpar localStorage de teste e o worktree `sorelly-prod-pub3` (rmdir node_modules antes de remover).
- Dados gravados no banco real por mim (fora do Git): Dávila 19/11 (IO766 corrigido), Leci 19/11 (movCasa, 16 linhas).

## 4. Perguntas prontas para o Marcus
1. **Publicar agora?** Recomendo sim, depois de religar a trava do servidor. Sim = telas novas no ar; a trava ainda não protege. Não = funcionárias seguem na janela antiga.
2. **Refazer a trava do servidor e o bloco "Peças que ela fez" antes?** Recomendo sim (perda de dados já ocorreu 4 vezes). Sim = mais uma rodada; Não = risco de apagar linha da Dávila de novo.
3. **Código do TRIO, dia a dia (11 a 15/11)?** Sem ele, 1.792 peças ficam sem preço. Com ele, o preço entra sozinho.
4. **"Marcar pago" deve criar o Pix no Financeiro?** Recomendo não: o envio já existe na Produção externa. Sim = tela única, mas risco de pagar em dobro.
5. **Corrigir "BB P0033" para BBP0033?** Recomendo sim. Sim = a peça acha o preço; Não = fica sem preço.

## 5. Pode arquivar?
NÃO. Faltam: publicar, religar a trava do servidor, refazer o bloco "Peças que ela fez" e fechar as respostas 1 a 5.
