# Pendências · conversa "RH: colaboradores, formulário, negociações, contratos e acessos" (17 a 19/11/2026)

Levantamento feito a pedido do Marcus. Nada foi mudado, commitado ou enviado para fazer este arquivo.

## 1. Resumo do que foi feito
- RH › Colaboradores em uma tela só (menu Visão): ficha completa, mais dados, CNPJ inteiro, Salário e bônus (adiantamento dia 20, salário 5º dia útil), Puxar do Financeiro, Escala 42h.
- Formulário dos funcionários: link por pessoa, telefone, mensagem para copiar, revisão antes de aplicar. Página pública `/meus-dados/<código>`.
- Negociações: menu Dinheiro / Joias / Dinheiro + joias, campo Forma por pessoa, Combinados avulsos (dinheiro e joias).
- Contratos: as 8 telas refeitas no padrão (tabela com filtro, menus suspensos); Terceiros com Tipo, Registro e Honorário.
- Acessos e autorizações: tela refeita (uma tabela, uma linha por pessoa, Acesso = Acesso total / Direção / Por setor). Amanda com acesso total no código. Confirmação dentro da tela (a caixa do navegador bloqueava e nada gravava).
- Tudo publicado na master. Último commit meu: `e94c81b` (19/11/2026).

## 2. Alterações sem commit ou fora da master
- Pasta limpa `C:\Users\marcu\Downloads\sorelly-pub-rh`: sem nada pendente, 0 commits à frente da master.
- Pasta `C:\Users\marcu\Downloads\sorelly-pub`: dividida com outras conversas. Tem `AcessosPessoas.js` modificado (versão antiga minha, já substituída na master). Não commitar.
- Pasta de trabalho `C:\Users\marcu\Downloads\sorelly-admin\sorelly-admin` (branch `alteracoes-27-10`, atrasada): copiei para lá, para o servidor local mostrar, estes arquivos iguais aos da master: `pages/RH.js`, `pages/rh/JoiasVisao.js`, `pages/RHContratos.js`, `pages/AcessosPessoas.js`, `pages/AcessosAutorizacoes.js`, `pages/Acessos.js`, `domain/equipe.js` (Amanda sem veto). Esta pasta não é a fonte da verdade.
- Este arquivo de pendências é novo e não está commitado.

## 3. Pendências
**Pedidos do Marcus ainda abertos**
1. Priscila e Amanda: o Marcus precisa escolher **Acesso total** nas duas linhas, no site publicado. Em 19/11 as duas contas ainda estavam assim (lidas no servidor local): Priscila = perfil Setor, grupo Direção, lista de 25 telas presa (sem Financeiro); Amanda = perfil Diretoria, grupo Direção. Depois: elas saem e entram de novo. **Não testei no site publicado** se agora grava.
2. Priscila "não consegue editar nada": causa provável é perfil Setor + 12 de 14 módulos + lista de telas presa. Ainda não confirmado após a publicação.
3. Coluna **Setor** da tela de acessos: só editável quando o Acesso é Por setor. Para Acesso total e Direção vem de uma lista fixa no código (`SETOR_PESSOA` em `AcessosPessoas.js`: só Marcus, Nickolas, Lucas, Anamaria, Ana Beatriz e Amanda). O Marcus perguntou se dá para editar. Falta a resposta dele.
4. Comprovante de pagamento da fatura: só existe no Contas a pagar. Financeiro familiar e Faturas do cartão não têm campo de comprovante. A Amanda não abre o Financeiro familiar (`ACESSO_FF` não tem o código 32). Ofereci as duas coisas e não houve resposta.
5. Ana Paula (Trocas): o Marcus disse que ela recebe **em joias**, sem dinheiro fixo. Confirmar que ela aparece em Negociações › Joias nos dados reais (não vi com dado real).
6. Valor em joias (R$ 122,00) já cabe em Combinados avulsos. Não há ligação automática com a retirada de joias do RH (Pagamento em joias).

**Coisas que eu disse "depois faço" ou deixei de lado**
7. Na tela de acessos refeita, **sumiram** o campo "Pessoa do sistema" para ligar conta sem pessoa, o login e o contato do chat (`cid`). Conta nova "Aguardando" sem pessoa não tem como ligar nem liberar pela tela nova. Precisa voltar de forma simples.
8. Autorizações por pessoa (caixas na linha) foram tiradas na versão simples. Hoje só há a visão "Autorizações por tipo". A visão "Telas por grupo" continua a matriz antiga e grande.
9. Arquivos antigos agora sem uso: `pages/ContasAcesso.js`, `components/contas-login.js` (lista com senha padrão). Apagar depois de confirmar.
10. Puxar do Financeiro: o Marcus precisa clicar **Gravar os meses** no site publicado. A leitura da DevMaster de 2022 a 2025 não foi feita (só o ano corrente). Não sei se ele já gravou.
11. Formulário dos funcionários: o Marcus ou a Maria precisam gerar e enviar os links **só pelo site publicado**. A Maria precisa do setor RH na conta. Fluxo completo (preencher no celular, Revisar, Aplicar) **nunca testado ponta a ponta em produção**. Quem está sem telefone no cadastro precisa de número.
12. Texto de LGPD do formulário: revisar com contador ou advogado.
13. Contratos: anexos (PDF assinado) continuam só no navegador (IndexedDB), neste computador. Falta guardar no servidor. Os botões "Trazer Leonardo, Castilho e Igor" e "Trazer as funcionárias" não foram usados. Advogados e contador ainda não cadastrados (o Marcus não passou os nomes). A lista de Tipos de prestador é suposição minha.
14. Canal de denúncias para o pai (Marco Antonio): decisão do Marcus. Ele só vê Segurança do trabalho e PGR e PCMSO.
15. Testes visuais em dados reais: o servidor local grava no banco real. Só li. Num teste apertei Novo combinado numa pessoa real e removi na hora; pode ter ficado `acordos: []` nela (inofensivo).
16. Registro de versões: outras conversas deixaram `versoes.js` com erro de sintaxe 3 vezes (entradas sem `]},`). Consertei duas. A trava de "conferir" não pega esse erro de forma confiável.
17. Mensagens prontas já entregues ao Marcus: para a Maria (formulário), para a Amanda e a Priscila (acesso). Não mando WhatsApp.

## 4. Perguntas prontas para o Marcus (por importância)
1. **Torno o Setor editável para todos?** Recomendo sim: menu suspenso na linha, gravado no sistema. Sim = a Amanda fica Acesso total com Setor Inadimplência, e você troca quando quiser. Não = o Setor fica só para quem é Por setor e a etiqueta dos outros vem do código.
2. **Priscila e Amanda: depois de Acesso total no site publicado e de sair e entrar, elas conseguem editar?** Recomendo testar com uma ação simples (lançar um pagamento de teste que o Marcus apaga). Se não conseguirem, a causa é outra (módulo do servidor ou conta) e eu abro o caso.
3. **A Amanda abre o Financeiro familiar e anexa comprovante nas contas pagas e nas Faturas?** Recomendo só o comprovante no Contas a pagar (já existe) e deixar a família fechada. Sim = eu acrescento o código dela em `ACESSO_FF` e o campo nas Faturas, e ela passa a ver dinheiro da família.
4. **Anexos dos contratos no servidor?** Recomendo sim. Sim = qualquer computador abre o PDF assinado e some o risco de perder arquivo. Não = continuam só neste computador.
5. **Libero o Canal de denúncias para o seu pai?** Recomendo não: o canal é anônimo e pode envolver sócio. Sim = ele passa a ler todas, inclusive as que falam de sócios.

## 5. Esta conversa pode ser arquivada?
**Não ainda.** Falta:
- o Marcus escolher Acesso total para Priscila e Amanda no site publicado e confirmar que elas editam (itens 1 e 2);
- a resposta da pergunta 1 (Setor) e a volta do campo "Pessoa do sistema" na tela de acessos (item 7);
- o Marcus gravar os meses do Puxar do Financeiro (item 10).
Todo o código já está na master. O resto depende do Marcus ou de teste no site publicado.
