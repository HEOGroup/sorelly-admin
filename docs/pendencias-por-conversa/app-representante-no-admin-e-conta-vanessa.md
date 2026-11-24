# Pendências: App da representante no Admin e conta da Vanessa (levantamento de 23/11/2026)

## 1. Resumo do que foi feito
- Fotos das preferências na janela de montagem e celular da montadora refeito (v0.20.91). Publicado.
- Condicionais com horário da listagem e coluna Atendimento (v0.20.70) e tabelas em cartões no celular (v0.20.90). Publicado.
- Conta de representante (`rep_cod`): filtro por representante no servidor (`src/server/rep-filtro.js`), script `scripts/criar-conta-representante.mjs`, conta da Vanessa (login `vanessa`, código `9S`) com 4 telas. Publicado (commit 95503fb, v0.20.105).
- Análise do app da representante (15 funções, plano em 4 partes) entregue ao Marcus.
- Rumo final decidido: a representante usa o Admin normal, com a tela do app dentro, versão celular. A página `/rep` foi apagada.

## 2. Alterações SEM commit ou fora da master
Pasta: `C:\Users\marcu\Downloads\sorelly-admin\sorelly-admin`, branch `alteracoes-27-10`.
- **Perdidas na pasta** (a pasta foi atualizada em 19/11 e as edições sumiram; conferi com grep, não estão mais lá e não estão no stash):
  - `src/apps/montagem/pages/Inicio.js`: Início da representante abrindo a tela do app (`InicioRepresentante`, pelo grupo `representante` da pessoa escolhida no seletor).
  - `src/apps/montagem/mobile/iphone.js` e `mobile/representante.js`: opção `semMoldura` (app sem o desenho do iPhone).
  - `src/apps/montagem/components/seletor-acesso.js` e `App.js`: nome só com primeiro e segundo nome, sem escrever "Representantes".
- Botão "Ver como" (troca de token): criei, testei e REMOVI a pedido do Marcus. Não existe mais nada dele.
- `docs/DECISOES.md` (local): blocos de 17/11 e 18/11 sobre a conta de representante. Só local, não verificado se subiu.
- `CLAUDE.md` local: ponteiro das rotas do app (`ROTAS-GET.md`). Só local.
- Scripts de patch estão no scratchpad da sessão (não valem nada sem as edições).

## 3. Pendências
- Refazer as 3 edições perdidas (Início da representante, `semMoldura`, nome com dois nomes). Os scripts e o desenho estão descritos acima; levam poucos minutos.
- **Pedido novo do Marcus (não feito):** focar em como a representante vê o Admin no CELULAR no dia a dia. Pegar a tela do app da representante e deixar 100% igual como Admin no celular. Ele pediu para eu confirmar o entendimento ANTES de fazer. Eu perguntei 3 coisas e ele ainda não respondeu (menu lateral some no celular? o que ela usa além de Revendedoras, Listagens, Kits novos e Comissões? posso conferir o Início em tamanho de celular?).
- Como o Marcus vê a Vanessa: pelo seletor "visualizar como outra pessoa" (`LOGIN` com `atuando`), SEM trocar de conta. Conferir que Vanessa aparece no seletor, que o grupo `representante` mostra só as 4 telas e que os dados filtram por ela (hoje, nesse modo, o Marcus tem os dados de todas; o filtro "só dela" é só no login real).
- Plano do app da representante no Admin, em 4 partes (nada feito além do Início):
  - Parte 1: Revendedoras (carteira e ficha) e Início.
  - Parte 2: Listagens completas e Agendar.
  - Parte 3: Pré-acerto, calculadora do acerto e gravação no servidor. Falta rota própria (ex.: `/api/rep-acerto`) que valide o kit dela e grave `a_<id>`; hoje a chave `a_` só o app grava, e a aba `celrep` cai na página Apps (simulação do Marcus).
  - Parte 4: Kits novos, entrega do kit novo, reposição, retirada, comissões com quilometragem e chat.
- Listagem da Ana Claudia sumiu: kits apagados às 09:11 pelo app (lápides). Ela precisa recolocar as revendedoras no app. Esperando.
- Janela de montagem do computador e tela Listagens da montadora com o visual novo: a perguntar ao Marcus.
- Preferências do app: liberação do acesso do Leonardo para puxar as preferências (chave já está no `.env.local`; a leitura `/preferencias-app` está em uso).
- A senha da Vanessa tem 6 caracteres (criada por script); o sistema pede 8 ou mais para senhas criadas pela tela.
- Testes não feitos: a tela da Vanessa SEM moldura de iPhone nunca foi vista (um clique meu saiu da sessão do navegador do Marcus); celular de verdade não testado.
- Cuidado: nunca digito senha pelo Marcus. Ele precisa entrar na conta dele quando a sessão cair.

## 4. Perguntas prontas para o Marcus
1. No celular, o menu lateral do Admin some e a representante navega só pelos atalhos e pela barra do app?
   - Recomendo: sim. Consequência de "sim": tela limpa igual ao app, menos toques. De "não": ela vê o menu inteiro e se perde.
2. Quais telas a representante usa no dia a dia além de Revendedoras, Listagens, Kits Novos e Comissões?
   - Recomendo: só essas 4 no começo. Se houver mais, cada uma entra como atalho depois.
3. Posso refazer as 3 edições perdidas e conferir o Início no tamanho de celular, mudando de pessoa pelo seletor?
   - Recomendo: sim. É a base de tudo que ele pediu.
4. Tiro "Desempenho" e "Indique & Ganhe" do app da representante (estão "Em breve")?
   - Recomendo: tirar. Consequência de manter: dois cartões sem função na tela inicial.
5. Quando a representante faz o acerto no Admin, o dado grava no servidor pela rota nova (Parte 3)?
   - Recomendo: sim, antes de liberar a calculadora a ela. Sem isso o acerto feito no Admin não fica salvo.

## 5. Esta conversa pode ser arquivada?
**Não.** Falta: (a) o Marcus responder as perguntas 1 a 3; (b) refazer as 3 edições perdidas e conferir no celular; (c) publicar (hoje o que existe na master é só o filtro por representante e a conta da Vanessa).
