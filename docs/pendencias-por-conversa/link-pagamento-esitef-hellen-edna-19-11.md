# Pendências: Link de pagamento, e-SiTef, Hellen e Edna (19 a 20/11/2026)

Levantamento a pedido do Marcus (via sessão "Cadastro Kommo"). Só leitura: nada foi mudado nem commitado para fazer este arquivo.

## 0. Atualização de 22/11/2026
- Alerta A (48 h) e ponto F (parcelas até R$ 400 = 4x) **corrigidos**: ação `ajustar` publicada na master (`b65a5ff`). Grava no servidor na primeira vez que alguém abre Link de pagamento › Solicitações. Ainda falta conferir no servidor.
- Continuam abertos: C (link da Tatiane), D (representantes no e-SiTef), G (Ana Maria e Compras), J (tela Kits novos).

## 1. O que foi feito (resumo)
1. Pedido da Hellen: link expirava em 12 h; ela quer 48 h. Código ajustado e publicado (versão 2 da regra `validadeV`). **NÃO pegou no servidor** (ver item 3, alerta A).
2. Importar e-SiTef: caixa "Incluir" em cada linha, "Marcar todas/Desmarcar todas", o que fica de fora é guardado por NSU (`lp.esitefIgnorados`). Depois o importador passou a trazer TUDO (AGU e NOV viram "Link gerado").
3. Erro achado no código: `nomeProprio` tinha `/s+/g` (letra s) no lugar de `/\s+/g` (espaço). O nome importado saía "Ale Andra Cri Thinye". Corrigido; reparo automático e reimportação do mesmo arquivo corrigem os nomes já gravados.
4. Descontados no acerto: botão "Incluir link" (lança à mão, origem "Lançado à mão", dá para corrigir e tirar) e visão "A descontar" (links pagos que esperam desconto; 47 em 19/11).
5. Agendamento (Ana Maria) ganhou as telas Compras e estoque (Painel) e Pedidos de material, só para pedir.

Commits na master (todos com Vercel "success"): `56af0c4`, `69bb259`, `a5eacc7`, `da6889e`.

## 2. Alterações sem commit ou fora da master
- **Código: nada.** Tudo o que é meu está na master. Conferi: `domain/link-pagamento.js`, `pages/link-pagamento/*.js` e `navigation/perfis.js` da pasta principal estão iguais à master nas partes minhas.
- Pasta principal `C:\Users\marcu\Downloads\sorelly-admin\sorelly-admin` (branch `alteracoes-27-10`, muito atrás da master): tem versões minhas de `docs/DECISOES.md`, `domain/versoes.js` (entradas 0.20.91 e 0.20.92), `docs/setores/financeiro/decisoes.md` e `docs/negocio/LINK-DE-PAGAMENTO.md` com números de versão que NÃO existem na master (na master saíram como 0.21.36, 0.21.41, 0.21.46, 0.21.50 e 0.21.52). **Não publicar essa pasta**: desfaria trabalho de outras conversas.
- Branches locais que sobraram no repositório: `link-a-descontar`, `link-nomes-esitef`, `link-importar-tudo` (os commits já estão na master). Podem ser apagadas.
- Worktrees temporários (`sorelly-link`, `sorelly-link2`, `sorelly-link3`): já removidos.
- Arquivos soltos no scratchpad da sessão (`aplicar*.mjs`, `ver3.mjs`, `edita5.mjs`): só rascunho, fora do projeto.
- **Banco:** nada gravado por mim. Os testes no navegador abriram janelas sem salvar (conferi que o NSU de teste não entrou).

## 3. Pendências e alertas
**A. ALERTA: a validade de 48 h NÃO está valendo no servidor.** Lido agora no módulo `lp`: `config.validadeHoras` = 12 e `validadeV` = 1. A regra versão 2 não gravou. Causa provável: ao receber o estado do servidor, o sistema só junta chaves que faltam (regra do sync); uma chave que já existe (`validadeV`) mantém o valor do servidor. Por isso `corrigirValidade48` (dar 48 h aos links gerados e religar os expirados por 12 h) também não rodou no servidor. Os links novos de hoje continuam saindo com 12 h. **Hellen vai continuar vendo "Expirado".**
  - Remédio rápido, sem código: em Link de pagamento → Meios e acessos → Regras, mudar "Validade do link (horas)" para 48 e salvar (ação normal, grava no servidor).
  - Remédio de código (precisa de ok): fazer a regra rodar dentro de uma ação (`lpReduz`), não na migração. Mesmo problema vale para o reparo de nomes dentro da migração (só a reimportação por ação grava).
**B. Nomes quebrados já gravados.** Eram 8 links importados com a letra "s" trocada por espaço (4 de 16/11, 4 de 19/11). A Hellen reimportou o arquivo de hoje às 15h57 e o primeiro foi corrigido ("Nome corrigido pelo relatório do e-SiTef"). Falta conferir os outros 7. Os de 16/11 só corrigem se a Hellen reimportar o arquivo de 16/11.
**C. Link da Tatiane Cristina Pinati (R$ 184,00, Visa, 1x).** Não existe no Admin. A Edna lançou "Link" à mão no atendimento. Depois que o link entrar (importar o e-SiTef), a Edna precisa **apagar a linha lançada à mão**; o link certo entra sozinho como "Já pago no link". Não testei esse caso de ponta a ponta com revendedora real.
**D. Representantes no e-SiTef.** O arquivo de 19/11 tem uma loja só (SERENETY, código 754872577897776 em todas as linhas); nada diz quem gerou o link. A Hellen precisa desmarcar à mão. Pedi o arquivo do período máximo para ver se há outra loja ou usuário. Ainda sem resposta.
**E. Importar tudo: efeitos não testados em produção.** Links "aguardando" de representantes viram "Link gerado" (expiram em 48 h e mancham a métrica de expirados); aparecem em "Meus links" no app da revendedora e como "aguardando" no Atendimento. Não testei com arquivo grande (período máximo). O campo `esitefRevisar` (20+ registros, "de dia passado: não entra sozinho no acerto") existe, mas não verifiquei se o acerto respeita.
**F. Faixa de parcelas.** Servidor: até R$ 400 = 5x. Regra escrita (19/10/2026): 4x. Ninguém respondeu qual vale.
**G. Ana Maria e Compras.** Liberei para o grupo Agendamento todo (Ana Maria, Mariana, Tamara). A Hellen respondeu "só pedir". A Ana Maria ainda não confirmou se viu a aba. Não testei com a conta dela. Pode haver lista de acessos salva no navegador dela (RH → Acessos) por cima do padrão.
**H. Edna pediu "Link antecipado".** Não criei: decisão de 16/11 diz que tudo vem do setor Link de pagamento. Marcus disse "já está conectado". Falta o teste real (revendedora com link pago e acerto no dia).
**I. Tela A descontar não mostra se a revendedora está na agenda de hoje.** O vínculo com o Atendimento é pelo nome parecido.
**J. Pedido NÃO iniciado: tela Kits novos.** "Melhorar igual à tela de pedidos do Cadastro de peças, azul, degradê por etapa, tudo para cima, e questionar os números de atrasadas (2387), condicional e entregue atrasados." O cartão de oferta de sessão ficou sem resposta (task_74c5e56c). Nada feito.
**K. Memória do projeto.** Não salvei lição nenhuma. Vale salvar: no Bash, `\\` e `\s` dentro de script gravam errado (a barra some); para regex use a ferramenta Edit.
**L. Mensagens prontas que o Marcus precisa mandar** (já escritas na conversa): Hellen (importar de novo, período máximo, desmarcar representantes), Edna (apagar linha à mão depois), Ana Maria (atualizar a tela).

## 4. Perguntas prontas para o Marcus (ordem de importância)
1. **Posso mudar a validade para 48 h agora, por código (dentro de uma ação), ou você muda na tela Regras?** Recomendo mudar na tela agora (30 segundos) e eu corrijo o código depois. Se não mudar, a Hellen continua refazendo link e as métricas continuam erradas.
2. **As representantes geram link no mesmo e-SiTef e na mesma loja da Hellen?** Recomendo pedir o arquivo do período máximo. Se for outra loja ou usuário, eu desmarco sozinho. Se for a mesma, a Hellen desmarca à mão toda vez (ou criamos uma lista de nomes).
3. **Manter "importar tudo" (aguardando vira Link gerado) ou voltar para "só pago"?** Recomendo manter, com a caixa Incluir. Se voltar para só pago, os links gerados continuam sendo criados à mão e o link pago do e-SiTef só entra depois de importar.
4. **Faixa até R$ 400: 4x ou 5x?** Recomendo 4x (regra escrita). Se for 5x, atualizo o texto e o app; se for 4x, corrijo o servidor e o app da revendedora para de mostrar 5x.
5. **Posso testar o fluxo inteiro com a Edna, ao vivo, com a Tatiane?** Recomendo sim. Sem o teste, a ligação "link pago entra sozinho no atendimento" só foi lida no código.

## 5. Esta conversa pode ser arquivada?
**Ainda não.** Falta:
- confirmar a validade de 48 h no servidor (alerta A);
- a Hellen reimportar o relatório (período máximo) e o link da Tatiane entrar;
- respostas das perguntas 1 a 4 (ou aceitar que ficam abertas neste arquivo);
- decidir onde fica o pedido da tela Kits novos (conversa nova ou esta).
Depois disso, pode arquivar.
