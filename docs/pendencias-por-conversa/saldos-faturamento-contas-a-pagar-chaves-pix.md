# Pendências da conversa "Saldos, Faturamento, Contas a pagar e Chaves Pix" (18 e 19/11/2026)

Levantamento só de leitura. Nada de código foi mudado para escrever este arquivo.

## 1. O que foi feito (resumo)

- Faturamento de 17 e 18/11 lançado no servidor (acertos, recebido, Carregar, a realizar, revendedoras). Robô das 10h rodado à mão duas vezes.
- Análise dos saldos das contas contra a DevMaster. A diferença caiu de R$ 90.567,36 para cerca de R$ 6 a 9 mil (Pix de revendedora pago a fornecedor ainda sem baixa; Caixa 46 sem saldo em 17/11).
- Telas mexidas: Caixa (moldura branca só no dia atual, linha dos Pix sem baixa), Faturamento › Resultado do mês (blocos Dia, Mês consolidado, Previsto final; contas ao vivo), Contas a pagar (ordem por vencimento, rodapé simples, bloco até o fim da tela), Chaves Pix (Editar, Nova chave, Greice, João Show, Diego), Família (campos de chave tirados).
- Mensagens prontas para Lucas (transferências CNPJ 46 e direcionamento dos Pix de clientes) e para a mãe do Marcus (bônus do Nickolas).
- Pesquisa do Pix Davila na DevMaster e mapa de onde a chave Pix mora no sistema.

## 2. Alterações sem commit ou fora da master

Pasta: `C:\Users\marcu\Downloads\sorelly-admin\sorelly-admin`, branch `alteracoes-27-10` (33 arquivos modificados no total, de várias conversas).

**Ainda nos arquivos locais, sem commit (minhas):**
- `src/apps/montagem/components/tabela-planilha.js` (opção `moldura` e `semTopo`; o rodapé simples NÃO está mais aqui, ver abaixo).
- `src/apps/montagem/pages/Caixa.js` (moldura só no dia atual; linha "Pix de revendedora pagos a fornecedores...").
- `src/apps/montagem/domain/contas-empresa.js` (função `pixSemBaixa`, inclui prestadores e sócios).

**PERDIDAS no merge `a4287a6` (17:18, "nos conflitos vale a versão da master").** O arquivo local voltou ao da master. A cópia com as minhas edições está em `C:\Projetos\backup-sorelly-19-11-antes-de-atualizar` e no stash do git:
- `pages/ChavesPixBancos.js`: botão Editar, Nova chave, Greice Marcus/Anamaria/Ana Beatriz com serviço Estética, João Show/Banquinha, Diego, banco e favorecido do 68 Gang e do Diego.
- `components/tabela-faturamento-dia.js`: tabela Dia, Mês consolidado e Previsto final; Contas ao vivo da DevMaster; zeros em 01 e 02/11.
- `pages/ContasPagarLista.js`: ordem por vencimento; altura do bloco (`calc(100vh - 10.2rem)`).
- `components/tabela-planilha.js`: rodapé simples (só ‹ página ›, 29 px).
- `src/server/contas-dm.js`: corrige vencimento com ano `0226` (caso Fabila).
- `pages/FinFamiliar.js` e `pages/FinFamiliarSocios.js`: campos de chave Pix removidos (Contas de prestadores, novo prestador, ficha, contas dos sócios; h-9 virou h-8).

**Na master (publicado):** só `ResultadoMes.js` (média prevista = média atual), commit `00a29ed`.

**Dados gravados direto no banco de produção (não são código):**
- `fd`: `fatHoje` de 18/11 (1.019 acertos, R$ 824.542,00), `fechaMes` de novembro {a realizar 933, carregar 2}; dia 17/11 regravado pelo robô (R$ 752.859,05, 930 acertos).
- `revdia`: 18/11 = 2.088.
- `cp.chaves`: duas chaves novas (Anamaria · Itaú, com favorecido Anamaria; Marina · Compras SP, e-mail).
- Robô automático do dia rodado 2 vezes (revendedoras, estoque, fotos, custo de saídas, faturamento).

## 3. Pendências (tudo que ficou aberto)

**Código**
1. Restaurar as edições perdidas do item 2 a partir do backup (ou do stash) e conferir cada tela.
2. Nada disso foi publicado. O Marcus não disse "Publica" para Caixa, Faturamento, Contas a pagar, Chaves Pix nem Família.
3. Não rodei `npm run conferir` para estas mudanças (o padrão visual pode reprovar). Não registrei em `domain/versoes.js` nem em `docs/DECISOES.md`.
4. Chaves Pix: gravar pelo botão Editar nunca foi testado de ponta a ponta. Falta botão Excluir chave.
5. Rodapé e bloco azul: a página ficou com ~12 px de rolagem; só Contas a pagar foi ajustada. O Marcus também escreveu "e deve..." (mensagem cortada) e não repetiu.
6. Plano de unificar a chave Pix, proposto e NÃO aprovado: (a) Dávila para Chaves Pix; (b) lançamento de pagamento sem campo livre de chave; (c) Destinos e ficha do fornecedor só leem; (d) Encomendas lê a chave da Ana Beatriz de Chaves Pix; (e) juntar as duas telas de Chaves Pix.
7. Chaves com texto no lugar da chave: Greicy e Higor ("CPF"), Priscila ("A preencher"); 5 lançamentos do Pagamentos a fornecedores com nome de empresa no lugar da chave.
8. Contas a pagar previsto no Faturamento mostra o mesmo valor em todas as linhas (o sistema não guarda o total de cada dia passado).

**Dinheiro e dados**
9. Divergência dos saldos ainda aberta (~R$ 6 mil a R$ 9 mil, e subiu a R$ 19.939,47 quando o dia 18/11 estava com 4 contas lançadas). O Lucas estava lançando os saldos de 18/11; nunca conferi depois.
10. Caixa 46 ficou sem saldo em 17/11 (tinha R$ 3.090,00). A mensagem enviada ao Lucas pediu R$ 3.000,00 para essa conta; não precisava.
11. Comparação por conta: Sicredi 34 +R$ 17.854, Unicred 34 −R$ 11.264, Sicredi 46 −R$ 9.087 contra a DevMaster. Pedi ao Marcus o saldo real nos bancos dessas 4 contas (Sicredi 34, Unicred 34, Sicredi 46, Caixa 46). Sem resposta.
12. Fabila: o título `CMS 00012821` ainda tem vencimento `0226-11-21` na DevMaster. A equipe precisa corrigir lá.
13. Bônus do Nickolas: no Admin, os de 23/10 e 10/11 (R$ 1.000,00 cada) estão em aberto, mas a DevMaster mostra pagos (`BON 000001387` em 30/10 e `BON 000001431` em 16/11). Aguarda a mãe do Marcus confirmar. O calendário da DevMaster (30/11, 15/12, 30/12) não bate com o do Admin (dias 10 e 23).
14. Pix Davila: nada criado na DevMaster (e não devo criar sem aprovação). Falta saber se é prestador ou fornecedor com caixa própria.
15. Número R$ 1.287.562,11 do relatório de 19/11 não foi usado (o recebido do dia foi R$ 824.542,00). Falta o Marcus dizer o que é.
16. Dia 17/11: o robô regravou R$ 752.859,05; o Marcus tinha passado R$ 752.968,45. Decidir qual vale.
17. Revendedoras: o Marcus passou 2.088 (18/11); o robô gravou 2.087 em 19/11.
18. Pergunta aberta: o total de "Contas a pagar" do mês no Faturamento inclui as contas da família? Se for só da empresa, tirar a família.
19. Marina (Compras SP) foi para Fornecedores na Chaves Pix; falta o Marcus confirmar o grupo.

## 4. Perguntas prontas para o Marcus (máx. 5, por importância)

1. **Posso restaurar do backup as edições perdidas e publicar?** Recomendo sim, num commit só, depois do `npm run conferir`. Se sim: as telas voltam como você aprovou hoje. Se não: ficam como a master (sem rodapé novo, sem Chaves Pix editável, sem ordem por vencimento).
2. **Qual o saldo real, hoje, de Sicredi 34, Unicred 34, Sicredi 46 e Caixa 46?** Recomendo mandar agora. Com isso eu acho qual saldo digitado está errado e fecho a divergência. Sem isso a diferença de R$ 6 a 9 mil continua sem causa.
3. **Aprova o plano de unificar a chave Pix (itens 6a a 6e)?** Recomendo começar por (a) e (b). Se sim: o Lucas e o Atendimento passam a puxar sempre do mesmo lugar. Se não: continuam as cópias e os erros de chave.
4. **A Dávila é prestador de serviço (igual a Castilho, Priscila, Higor) ou fornecedor com caixa própria?** Recomendo prestador. Se prestador: cria-se só o fornecedor "PIX DAVILA" na DevMaster e usa a caixa dos prestadores. Se fornecedor: precisa também de caixa e natureza `1.01.01.10.xx` novas.
5. **Fecho como pagos, no Admin, os bônus do Nickolas de 23/10 e 10/11?** Recomendo fechar (mantém o histórico) quando sua mãe confirmar. Se apagar: some o histórico. Se deixar: continuam atrasados na lista.

## 5. Esta conversa pode ser arquivada?

**Não.** Faltam: restaurar as edições perdidas do backup, publicar com o "Publica" do Marcus, e as respostas das perguntas 2, 3, 4 e 5. Depois disso pode arquivar.

## Anotado em 20/11/2026 (para lembrar depois, NÃO fazer agora)
- **Contas e lançamentos por conta, em Pagamentos a fornecedores.** Cada fornecedor é uma situação diferente: Pontual = pagamento de cartão dividido a cada 10 dias (1 a 10, 11 a 20, 21 ao fim); Point = valor definido por mês. A ideia de dividir o pedido por conta/chave (ex.: R$ 40.000,00 numa conta e R$ 20.000,00 em outra) foi só uma simulação do Marcus: lembrar dele quando for a hora de fazer "as contas e os lançamentos de contas".
- Limite de valor por chave Pix (Pontual, Point): ainda não existe; decidir junto com o item acima (por chave, por período ou por valor).
- Preencher chave Pix nos pagamentos do Pontual (821 sem chave): depende das chaves de cada conta de recebimento.
- Reorganizar a tela Negociações (menos blocos, detalhe que abre embaixo, como Lançamento de pagamentos): proposta feita, aguardando o OK.

## Negociações: alinhar antes de mexer (20/11/2026)
- Versão ANTIGA da tela guardada em `docs/historico/negociacoes-antiga-20-11-2026/` (código `.antiga` + mapa `NEGOCIACOES-ANTIGA.html`). Para voltar: copiar os dois arquivos `.antiga` sobre `Negociacoes.js` e `NegAbas.js` em `src/apps/montagem/pages/pf/`.
- Modelo do Marcus: ele fecha um valor com o prestador (ex.: R$ 10.000,00), parte pela Sorelly/CNPJ (ex.: R$ 8.000,00) e parte por Pix de revendedoras (ex.: R$ 2.000,00); pode haver vários pedidos, cada um com parcelas e prazos.
- Primeiro bloco atual ("Fornecedores") mistura histórico (Pontual R$ 3,4 mi) com fornecedor encerrado (Izadora R$ 1.221,60, já pago): precisa mostrar só o que importa (em aberto por origem, próximo prazo, ativo ou encerrado).
- Point tem R$ 221.885,66 em pedidos sem parcela lançada.
- Aguardando respostas do Marcus (3 perguntas) antes de mudar o primeiro bloco.
