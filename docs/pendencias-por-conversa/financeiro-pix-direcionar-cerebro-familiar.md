# Pendências da conversa: Pix do Direcionar, Contas a pagar, Cérebro do Financeiro e Financeiro familiar

Levantamento de 19/11/2026, pedido do Marcus antes de arquivar. Só leitura: nada foi alterado, commitado ou enviado para fazer este arquivo.

## 1. O que foi feito

1. Pix para fornecedor: do Direcionar vira pagamento do fornecedor no Contas a pagar. Vale como pago só com comprovante. Quem anexa é a representante (calculadora) ou a funcionária (Atendimento interno). Na master.
2. Pix para prestador da família (Greicy, Rebel Mode, 68 Gang) vira repasse no Financeiro familiar e abate a dívida. Aparece no Contas a pagar de cada sócio com prazo. Na master.
3. Contas a pagar: ordem por vencimento, "Data errada" para título com ano errado, quem lançou (atividades). Vistoria e PDF do Financeiro entregues.
4. Cérebro do Financeiro: documentos em `docs/negocio/cerebro-financeiro/` (6 arquivos) e bloco "Avisos do dia" no Direcionar (só sugere). Na master.
5. Hoje (19/11): botão "Encerrar conta" no Financeiro familiar (v0.21.61, na master, usado na Polyana). Bloco "Quem pagou" em Contas pagas (pronto e testado, NÃO subiu).

## 2. Alterações sem commit ou fora da master

| O quê | Onde | Estado |
|---|---|---|
| Bloco "Quem pagou" (commit 24c415e) | Pasta `C:\Projetos\pub-quem` (worktree, HEAD solto, sem branch) | Commit local. NÃO foi para a master. A master já andou (a4f4e46): precisa de rebase e nova numeração em `versoes.js` antes de subir. |
| Arquivos desse commit | `src/apps/montagem/domain/financeiro-familiar.js`, `pages/FinFamiliar.js`, `domain/versoes.js` (entrada 0.21.63), `scripts/testar-quem-pagou.mjs` | Só na worktree acima. |
| Este arquivo | `docs/pendencias-por-conversa/` na pasta principal (branch `alteracoes-27-10`) | Novo, sem commit. |
| Scripts de leitura (fora do Git) | Pasta temporária da sessão: `ler-ff.mjs`, `contas-marcus2.mjs`, `ler-polyana-e-pagos.mjs`, `ler-contas-forma.mjs`, `testar-quem-pagou-real.mjs`, `cerebro-real.mjs`, `pasta-cerebro.js` | Só leitura do banco. Pode apagar. |
| Memória | `memory/` (`pix-fornecedor-...`, `cerebro-financeiro-...`, `feedback-gasto-pago-sorelly-x-pago-por-mim.md`) | Fora do repositório, já salvas. |

As worktrees `pub-polyana` e as outras desta conversa já foram removidas. A pasta principal tem muitos arquivos modificados que NÃO são desta conversa.

## 3. Pendências

Pedidos do Marcus não terminados:
- Subir o bloco "Quem pagou". Ele respondeu "não sei mano não dá pra mexer nisso" (parece falar do aluguel, não do bloco). Não houve "sobe".
- Aluguel de Alphaville, R$ 25.000,00: parcela de novembro marcada "A confirmar" (pago em 15/10). Ele não sabe confirmar.
- Perguntei o que fazer "sem atrapalhar o Financeiro" (comprovante na Família, aba Empréstimos, atualizar `pendencias.md` do Financeiro). Sem resposta.
- "Testa na tela real com a representante" (comprovante pela calculadora de acerto). Foi interrompido e não foi refeito.
- Tela ou lista com as correções que o time tem de fazer na DevMaster (ele pediu uma "tela de chamados para corrigir"). Não construída.
- Aba Empréstimos no Contas a pagar (ele pediu, são vários). Não construída.

Coisas que eu disse "depois":
- Comprovante nos pagamentos do Financeiro familiar. Não feito.
- Lista de baixas das 10 contas atrasadas (R$ 5.147,65 depois da Polyana): perguntar se os 4 Pix Itaú e as retiradas já foram pagos. O Contas a pagar mostra 0 baixas registradas.
- Cadastro único de fornecedores, prestadores, chaves e destinos.
- Lançador de contas a pagar.
- Cérebro: rodar com os saldos de hoje, definir o colchão mínimo, versão que executa sozinha (Open Finance em 2027).
- Itens "Decidir depois" do Cérebro.

Dados e erros em aberto:
- DevMaster: título da Fabila com ano errado (0226) ainda errado; 12 títulos sem vencimento (R$ 2.211,24), criados pelo usuário 0097.
- O resumo "o que paguei no mês" foi feito por data de pagamento. A tela "Contas pagas" filtra pelo mês da PARCELA (Cartão Nubank de dezembro pago em novembro aparece em dezembro). Pode confundir.
- Repasses de Pix a prestadores em novembro: R$ 9.787,10. Falta separar o que é gasto pessoal do Marcus e o que é da empresa (Bonus Diego, Higor, Lucas Castilho).
- Pix para representante continua lançado à mão pelo Lucas.
- CI da master: não vi o resultado do meu commit 282b061. Os dois commits de RH logo antes falharam no CI (não são meus).
- Pendências antigas do Financeiro (14 decisões do Marcus) em `docs/setores/financeiro/pendencias.md`, sem resposta.

Testes não feitos:
- Bloco "Quem pagou" visto na tela de produção (só depois de subir).
- Teste com a representante e a funcionária reais, de ponta a ponta.

## 4. Perguntas prontas para o Marcus

1. **Posso subir o bloco "Quem pagou" agora?** Recomendo: sim, só aparece na Família (só sócios). Se sim: aparece hoje, com rebase. Se não: fica só na worktree e envelhece enquanto a master anda.
2. **O aluguel de Alphaville (R$ 25.000,00) já foi pago?** Recomendo: conferir o extrato e dar a forma. Se pago: tiro o "A confirmar" e o mês fecha. Se não: entra nos atrasos.
3. **Crio o campo de comprovante nos pagamentos do Financeiro familiar?** Recomendo: sim. Se sim: cada pagamento guarda o arquivo. Se não: segue sem comprovante.
4. **Os 4 Pix do Itaú e as retiradas dos 10 atrasados (R$ 5.147,65) já foram pagos?** Recomendo: conferir o extrato. Se foram: registro a baixa e o atraso cai. Se não: ficam como atrasados.
5. **Bonus Diego, Higor e Lucas Castilho: o Pix de revendedora foi gasto seu ou da empresa?** Recomendo: separar por pessoa. Se for seu: entra em "Pago pela Sorelly" no seu resumo. Se for da empresa: sai do seu resumo.

## 5. Pode arquivar?

**Sim.** Atualização de 21/11/2026: o Marcus decidiu que o bloco "Quem pagou" não é necessário agora ("depois mexemos na família"). Não subiu. O commit 24c415e ficou guardado na branch local `guardado-quem-pagou-19-11` (repositório da pasta principal) e a pasta `C:\Projetos\pub-quem` foi removida. Todo o resto está na master, nos documentos ou na memória.
