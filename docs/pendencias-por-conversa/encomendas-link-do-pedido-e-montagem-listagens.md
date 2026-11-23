# Pendências da conversa: Encomendas (link do pedido) e Montagem (Listagens)
Levantamento de 20/11/2026. Só leitura: nada foi mudado por este pedido.

## 1. Resumo do que foi feito
- **Link do pedido da revendedora** (`/pedido/<código>`) pronto e no ar: pede peças, vê as peças encontradas, marca Quero/Não quero, aba "O que eu pedi", pede mais peças (máx. 2), aba Pagamento (peças separadas, taxa de R$ 15,00, Pix, comprovante), tela cheia de "Resposta enviada".
- **Ficha do pedido** (Encomendas): mensagens uma de cada vez com o link, botão "Peças separadas: liberar a taxa", bloco "Pediu mais peças", bloco "Taxa de entrega", botão "Mudar para encomenda".
- **Dados corrigidos no banco:** Francelle e Jaqueline viraram encomenda; testes apagados; Pix da taxa gravado; link da Taciana ligado ao pedido.
- **Montagem (Representantes & Kits):** Fila de montagem e Listagens refeitas (barra azul, linhas finas, sem caixa alta, sem mãozinha); coluna Preferências na Listagens; clique na revendedora abre a ficha das preferências (Montar kit) ligada ao kit; Fila e três telas de Regras saíram do menu.
- **Pasta de trabalho** atualizada com a master (189 versões), com cópia de segurança.

## 2. Alterações SEM commit ou fora da master
| Onde | O que |
|---|---|
| Pasta de trabalho `C:\Users\marcu\Downloads\sorelly-admin\sorelly-admin` (branch `alteracoes-27-10`), sem commit | `src/apps/montagem/components/fila-planilha.js` (linhas finas, coluna Preferências, clique na ficha), `pages/FilaMontagem.js` (igual à Listagens), `pages/Painel.js` (abre a ficha), `pages/fila-montagem/Montar.js` (iniciar e concluir ligam ao kit), `navigation/setores.js` (menu sem Fila e sem Regras), `domain/versoes.js` |
| Worktree `C:\Projetos\pub-1118h` (detached, base `e94c81b`), sem commit | Os mesmos 6 arquivos, já com `conferir` = CONFERIDO. Pronto para subir. A versão em `versoes.js` precisa ser renumerada (master andou) |
| Banco de produção, sem código | `er` (pedidos P8690356 e P8690361 → encomenda); `er.config.pix` (chave e titular da taxa); `linkId` do pedido P8690330 ligado ao link da Taciana; links e pedidos de teste apagados |
| Cópia de segurança | `C:\Projetos\backup-sorelly-19-11-antes-de-atualizar` e stash `pasta-antes-de-atualizar-19-11` |

Os outros arquivos alterados na pasta de trabalho (Caixa, ContasPagarLista, DirecionarPix, Producao etc.) são de outras conversas.

## 3. Pendências
**Subir e publicar**
- Subir para a master as telas da montagem (Listagens fina com preferências, clique na ficha, Fila fora do menu, Regras fora do menu). Falta o "sobe" do Marcus.
- Registrar em `docs/DECISOES.md` e no `decisoes.md` do setor as decisões de 19 e 20/11: aba Pagamento, Mudar para encomenda, Fila fora do menu, regras fora do menu, clique na ficha. Só as de 18/11 estão escritas.

**Montagem**
- **Duas montagens, duas gravações.** A janela de montar da Listagens grava no estado local. A Fila grava em `montagem_kit_registro`. Produtividade e bônus só leem o servidor. Falta decidir e ligar (passo 2).
- Pedido das meninas: escolher o **próprio nome** na coluna Montadora depois de concluir. Não feito.
- Teste de ponta a ponta do clique na Listagens com revendedora que tem preferências. Hoje só havia a Albany Del, sem preferências. Não testado.
- A Fila continua abrindo pelo endereço (`/representantes-kits/fila-de-montagem`) e a "Análise geral" só existe nela.
- Limpar mais telas do setor? O Marcus disse "vamos limpar". Só tirei as regras. Resta: Consolidado, Equipe e comissões, Registros, Relatórios, Painel, Placar etc.
- O merge de 19/11 (`a4287a6`) deixou a versão da master nos conflitos. Cerca de 101 arquivos diferem do backup. Outra conversa restaurou Contas bancárias. O rodapé "Mostrando N de M" da tabela não voltou.

**Encomendas / link**
- **Conta a pagar automática da taxa:** quando a revendedora anexa o comprovante, lançar em Contas a pagar como paga, para o João Guilherme, com o comprovante. Nada construído. Três perguntas sem resposta.
- **Titular do Pix:** o sistema mostra "Ana Beatriz Hess de Oliveira"; o Marcus disse que o Pix é do João Guilherme. Não confirmado.
- **Aviso no Funil** quando a revendedora responde, pede mais peças ou manda comprovante. Hoje só aparece abrindo a ficha.
- **Limite de valor no pedido extra:** conta de novo ou usa o que sobrou? Sem decisão.
- Não testados com login (o painel não entra): botão "Peças separadas", botão "Mudar para encomenda", bloco "Pediu mais peças" na ficha, comprovante real de uma revendedora, aba Pagamento com dados reais.
- Online não confirmei se o botão "Mudar para encomenda" já aparece (a checagem automática foi inconclusiva).
- **Expositores** (pedido das meninas): campo "como foi entregue" (pela representante ou pelo João) e, se pelo João, anexar comprovante do Pix da taxa. Não feito. Falta confirmar a tela.
- Planilha de montagem dos kits (pedido das meninas, ponto 1): lista de nomes de quem concluiu só traz os nomes da importação. Não feito.
- **Limpeza de dados de teste:** o link da Taciana ainda guarda respostas de teste (limpar quando o Marcus mandar). Pedido da Thailen em "Separando" desde 18/11 (não sei se é teste). Links duplicados da Karine (um com nome errado "karine-thaune") e da Francelle.
- Mensagem de WhatsApp para as meninas testarem: entregue, mas as meninas ainda não fizeram teste real com uma revendedora.
- Piloto real: escolher 1 ou 2 revendedoras do Top 100 e acompanhar o fluxo inteiro.
- "Chave Pix da taxa vazia no servidor" já foi resolvido (gravada).

## 4. Perguntas prontas para o Marcus (por ordem de importância)
1. **Conta a pagar da taxa: quando e onde lançar?**
   Recomendo: ao clicar "Confirmar pagamento" na ficha, como prestador João Guilherme, descrição "Taxa de entrega · nome da revendedora", R$ 15,00, paga, com o comprovante.
   Se for na hora do anexo: entra dinheiro falso se o comprovante estiver errado. Se for ao confirmar: depende de alguém clicar.
2. **O Pix da taxa é de qual nome?** Hoje: Ana Beatriz (titular), recebedor João Guilherme.
   Recomendo mostrar o nome que o banco exibe. Errar o nome faz a revendedora desconfiar e não pagar.
3. **Montagem única:** a janela de montar da Listagens deve gravar no servidor ao concluir?
   Recomendo sim. Daí Produtividade e bônus contam tudo. Se não: bônus continua só com a Fila, que saiu do menu.
4. **Posso subir as telas da montagem (Listagens, Fila fora do menu, regras fora)?** Estão prontas e conferidas.
   Se sim: as meninas veem as mudanças online. Se não: continua só na pasta do Marcus.
5. **Limite de valor no pedido extra:** conta de novo ou usa o que sobrou do primeiro?
   Recomendo usar o que sobrou, para o limite do mês valer uma vez só. Se contar de novo, a revendedora pode pedir o dobro.

## 5. Esta conversa pode ser arquivada?
**Não.**
Falta: (1) o "sobe" das telas da montagem; (2) as respostas 1, 2 e 5 para construir a conta a pagar e fechar o limite; (3) decidir a montagem única (pergunta 3); (4) teste real com uma revendedora; (5) escrever as decisões de 19 e 20/11 no diário.
