# Contexto da conversa · RH › Colaboradores, Formulário dos funcionários e Negociações (17 a 19/11/2026)

Arquivo de uma conversa longa com o Marcus. Serve para retomar o assunto sem reler o chat.
Dados reais (CPF, salário, telefone) NÃO estão aqui: ficam no servidor e nos arquivos `.local`.

## 1. O que foi pedido e feito

| # | Pedido do Marcus | Resultado | Onde |
|---|---|---|---|
| 1 | Organizar RH › Colaboradores em uma tela só, com menu "Visão" | Visões: Cadastro, Advertências, Experiência, Horas extras, Negociações, Escala 42h, Salário e bônus | `pages/RH.js` |
| 2 | Nova colaboradora com a ficha completa | Abre a ficha inteira e grava tudo de uma vez ao clicar em Cadastrar | `FormColab`, `colab_add` em `domain/rh.js` |
| 3 | Mais dados no cadastro | 4 blocos: Contato e endereço, Mais dados pessoais, Documentos, Contrato e banco (cada um com Editar, Salvar, Cancelar) | `BLOCOS_DADOS` |
| 4 | Empresa com o CNPJ inteiro e letra colorida | Coluna Empresa mostra o número completo, sem negrito, cor por empresa | `CNPJ_COR`, `rotuloCnpj` |
| 5 | Salário e bônus com adiantamento (dia 20) e salário (5º dia útil) separados | Sábado conta como dia útil. Datas certas por mês | `pages/rh/SalarioVisao.js` |
| 6 | "Puxar do Financeiro": trazer o que já foi pago | Lê as contas pagas da DevMaster por mês, ou de janeiro até o mês. Grava com `pag_lote` | `SalImportar`, `GET /api/contas-dm` |
| 7 | Negociações e Joias juntas | Visão Todas, com a coluna Forma. Quem só tem joias (Ana Paula) aparece | `negTodas` em `pages/rh/JoiasVisao.js` |
| 8 | Forma de pagamento de cada pessoa | Na ficha da negociação, campo "Forma de pagamento": Automática, Dinheiro, Joias ou Dinheiro + joias. O que o RH escolhe vale na lista | `NegCard`, `neg_pessoa_set` (campo `forma`) |
| 9 | Escala 42h como sugestão, com mensagem de WhatsApp para copiar | Pronta | `AbaRhEscala42` |
| 10 | Formulário online para cada funcionário preencher | Um link por pessoa, sem login. O RH confere e só então aplica no cadastro | seção 2 |
| 11 | Telefone particular e mensagem para a Maria enviar | Coluna Telefone com ⧉, coluna "Msg para funcionário" com ⧉, mensagem pronta para a Maria no alto | `pages/rh/FormularioFunc.js` |
| 12 | Links de todos já prontos | A janela cria sozinha o link de todos os ativos ao abrir | idem |
| 14 | Combinados avulsos: uma nova negociação pontual (ex.: domingo das 9h às 15h por R$ 150,00 + R$ 168,00 em joias) | Bloco na ficha da negociação de cada pessoa: dia, horário de início e fim, combinado, dinheiro, joias (preço de venda das peças), se bate ponto (Sim ou Não), situação, total. Aparece também na lista Dinheiro + joias | `negAcordos` em `pages/RH.js` (campo `acordos` da pessoa) |
| 13 | Faixa azul sem botões lado a lado | Tudo em menu suspenso. O menu Visão fica curto; ao escolher Negociações, abre ao lado o menu da FORMA, nesta ordem: Dinheiro / Joias / Dinheiro + joias (e Por pessoa / Pagamentos / Resumo em Joias). Eu tinha juntado tudo no Visão e o Marcus não quis: os menus ficam SEPARADOS, ao lado | `SegAzul` (agora um select) |

## 2. Formulário dos funcionários (como funciona)

```
RH abre a janela ──► sistema cria o link de quem não tem (código aleatório de 16 letras)
        │
        ▼
Maria copia Telefone ⧉ e Msg ⧉ ──► envia no WhatsApp particular de cada pessoa
        │
        ▼
Funcionário abre /meus-dados/<código> no celular e preenche
        │
        ▼
Resposta fica "Enviou" ──► RH clica Revisar (Campo | No cadastro | Enviado | O que muda)
        │
        ▼
Aplicar no cadastro ──► link deixa de aceitar respostas ("Aplicada")
```

Segurança:
- Quem abre a janela e lê as respostas: diretoria e setor RH (conferido no servidor).
- A página pública devolve só o primeiro nome e a situação. Limite de 10 envios por hora por endereço. Campo escondido contra robô.
- O formulário NÃO pergunta o que a pessoa não sabe (CBO, PIS/NIS, tipo de contrato, jornada, exame admissional). Esses o RH preenche.
- O texto de consentimento (LGPD) ainda precisa de revisão do contador ou advogado.

Arquivos: `src/server/ficha-func.js`, `app/api/meus-dados/**`, `app/meus-dados/[codigo]/`, `src/apps/montagem/pages/rh/FormularioFunc.js`. Tabela `sorelly.ficha_funcionario`.
Teste: `node scripts/testar-ficha-func.mjs` (18 verificações).

## 3. Regras e decisões do Marcus nesta conversa
- Sábado conta como dia útil no 5º dia útil (salário de outubro e novembro foi pago no dia 6).
- Todos os funcionários são registrados e pagos normalmente, cada um pelo seu CNPJ. Não é "pago por fora".
- Adiantamento está na natureza própria do Financeiro (3.01.01.11).
- Negociações: tirar Kesiane e Amanda de Miranda. Lucas Oliveira e Nickolas são Diretoria. Grupo novo: Camilly, Helen e Michele (Cadastro de revendedoras) e Rayssa (Cadastro de peças).
- **Negociação = o que o RH combina com cada pessoa. A forma é Dinheiro, Joias ou Dinheiro + joias.** A Ana Paula recebe em joias (não tem dinheiro fixo).
- **"Brinde" = pagar a funcionária com joias.** Exemplo: R$ 122,00 em joias para fazer 2 horas extras.
- **Nova negociação avulsa:** abra a pessoa em Negociações e clique em **Novo combinado**, dentro de Combinados avulsos. Valor em joias = preço de venda das peças.
- A Maria Claudia (código 38) é a responsável pelo RH. Ela já tem acesso igual ao do Marcus.
- Escolha de opções = menu suspenso, nunca botões lado a lado (regra de 09/11/2026, reforçada em 18/11).
- Faixa azul: menu Visão curto e, ao escolher Negociações, abre AO LADO o menu da forma (Dinheiro / Joias / Dinheiro + joias, a ordem que o Marcus escreveu) (não juntos no Visão).

## 4. Acesso
- Pai do Marcus (Marco Antonio, código 31): grupo Direção (tudo, menos Configuradores). Já abre Segurança do trabalho e PGR e PCMSO.
- Canal de denúncias: só Marcus (16) e Maria Claudia (38). Não foi liberado para o pai, porque o canal é anônimo e pode envolver sócio. Para liberar: acrescentar o código em `src/server/denuncias.js` E em `PESSOAS_DENUNCIAS` (`domain/nr1.js`).
- Senha de conta: nenhuma conversa define senha. A conversa da NR-1 deixou um script para o Marcus rodar sozinho. Senha fácil não é recomendada.

## 5. Onde clicar (o Marcus não quer endereço, quer o caminho do menu)

| Tela | Caminho |
|---|---|
| Colaboradores, Formulário dos funcionários, Negociações, Salário e bônus | Menu lateral **Recursos Humanos** > **Colaboradores** > **Colaboradores**. No alto, menu **Visão**. Em **Cadastro** aparece o botão **Formulário dos funcionários**. Em **Negociações** abre ao lado o menu **Dinheiro / Joias / Dinheiro + joias**. |
| Segurança do trabalho (plano da Maria) | **Recursos Humanos** > **Segurança do trabalho** |
| PGR e PCMSO por CNPJ | Menu lateral, botão próprio **PGR e PCMSO** (fora do Recursos Humanos) |
| Pesquisa de clima | **Recursos Humanos** > **Pesquisa de clima** (só Marcus e Maria) |
| Canal de denúncias | **Recursos Humanos** > **Canal de denúncias** (só Marcus e Maria) |
| Formulário público do canal (divulgar à equipe) | Endereço `/canal-de-etica`, sem login |

## 6. Pendências
1. Ler a DevMaster de 2022 a 2025 também? (hoje o Puxar do Financeiro usa o ano corrente.)
2. Texto de LGPD do formulário: revisar com contador ou advogado.
3. Depois de publicar: o Marcus clica em "Gravar os meses" no Puxar do Financeiro, no site publicado.
4. Gerar e enviar os links só pelo site publicado, nunca pelo localhost.
5. Canal de denúncias para o pai: decisão do Marcus (sugestão: não liberar).

## 7. Mensagem pronta para a Maria
```
Oi, Maria! Tudo bem? 😊

Precisamos fazer a *atualização cadastral* de todos os funcionários. Cada um preenche os próprios dados pelo celular, em um link só dele.

*Como fazer:*
1️⃣ No Admin, abra *RH > Colaboradores* e clique em *Formulário dos funcionários*.
2️⃣ Os links já aparecem prontos para todos.
3️⃣ Em cada linha, clique no ⧉ do *Telefone* para copiar o número.
4️⃣ Clique no ⧉ de *Msg para funcionário* para copiar a mensagem com o link dele.
5️⃣ Mande no *WhatsApp particular* de cada um. 📱

*Depois que enviarem:*
• Na coluna *Conferir*, clique em *Revisar* e veja o que a pessoa mandou.
• Se estiver certo, clique em *Aplicar no cadastro*.

⚠️ O link é só de cada pessoa. Não mande o link de um funcionário para outro.
⚠️ Quem estiver *sem telefone* no cadastro: preencha o número antes.
```

## 8. Lições técnicas
- Barra invertida em expressão regular some ao passar por `node -e` ou heredoc. Usar o Write tool para scripts ou `String.fromCharCode(92)`.
- Não copiar arquivos inteiros da pasta de trabalho para a pasta limpa: a pasta de trabalho tem código de outras conversas. Aplicar só o trecho (script de patch com texto único como marcador).
- A master anda por várias frentes. Antes de subir: `git fetch`, refazer o trabalho sobre a master nova, resolver `versoes.js` e `DECISOES.md` (pegar o da master e reinserir a minha entrada com a versão maior + 1), rodar `npm run conferir`.
- Publicar pela pasta limpa `sorelly-pub` (`git worktree add --detach`, junção do `node_modules`, `gerar-locais`). A trava de segurança do Claude Code pode barrar o `git push`: nesse caso o Marcus roda o comando ou libera a regra.

## 9. Versões registradas
0.20.99 (adiantamento, CNPJ completo, ficha completa, dados a mais, formulário), 0.20.102 (Negociações › Todas), e a entrada desta publicação (faixa azul com um menu só e forma de pagamento por pessoa). Detalhe em `domain/versoes.js`.
