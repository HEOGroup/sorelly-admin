# Pendências gerais (19/11/2026)

Feito antes de o Marcus arquivar as conversas antigas. Cada item é algo que uma conversa esperava dele.
Fonte: leitura do fim de cada conversa (últimas 40 a 150 mensagens). A conversa "Link de pagamento: expiração e descontos" NÃO foi lida (ferramenta devolveu vazio). Abrir e ler antes de arquivar.

Atenção: quase todo trabalho sem commit está na MESMA pasta principal (`sorelly-admin`, branch `alteracoes-27-10`). Arquivar a conversa não apaga esses arquivos. Não apagar as pastas listadas na seção 9.

## 1. Financeiro

| Conversa | O que espera do Marcus |
|---|---|
| FINANCEIRO (rodando) | Nada pendente de resposta. Faltam: testar busca e botão "Ver" do comprovante em Contas a receber; 42 de 100 Pix de representantes sem comprovante; 1 comprovante em dúvida. Arquivos novos sem commit: `ContasReceberLista.js`, `comprovantes-receber.js` |
| FINANCEIRO fork | "Posso subir o bloco Quem pagou na master?" (pronto, testado, nunca visto na tela). Aluguel de Alphaville R$ 25.000,00 está "A confirmar". Comprovante na Família e aba Empréstimos: fazer agora ou outro dia? |
| Pix adiantado no acerto | Posso anexar os 3 comprovantes pela tela? (R$ 1.000,00 Rebel Mode, R$ 634,55 68 Gang, R$ 150,00 Lucas Castilho). Rodar a importação dos antigos (primeiro passo só gera relatório). Conferir no primeiro acerto da Karine. Código já na master |
| CONTAS A PAGAR | De quem é cada uma das 8 parcelas do Itaú Black (R$ 1.825,22)? A diarista Erlina é paga duas vezes por mês? Explicar os 3 pagamentos do iPhone "contrato 2" (ago a out). Unificar nomes das contas do pai (uma etapa por vez). Código na master |
| FATURAMENTO | Aprova a ordem das chaves Pix (5 passos)? A Dávila fica como prestador de serviço? Posso apagar chaves digitadas à mão em 5 lançamentos que são só nome de empresa? |

Ordem proposta para as chaves Pix: (1) Dávila para Chaves Pix; (2) lançamento escolhe a chave do cadastro; (3) tirar campo de chave de Destinos e da ficha do fornecedor; (4) Encomendas lê a chave da Ana Beatriz de Chaves Pix; (5) juntar as duas telas de Chaves Pix.

## 2. Encomendas e Listagens

| Conversa | O que espera do Marcus |
|---|---|
| ENCOMENDAS (rodando) | "Posso subir para a master? Escreva sobe." Limpar telas de "regras" (pedido dele, em andamento). Clique na revendedora (ficha das preferências) NÃO foi testado de ponta a ponta: a única revendedora da Listagens (Albany Del) não tem preferências. Fila de montagem continua fora do menu. Nada subiu |
| EXPOSITORES | Qual é a Milena (3 cadastros parecidos)? Atualizar observações de quem já teve baixa, com a data de hoje? Média mensal: 3 meses fechados ou 3 últimas vendas? Baixa em quem "possui" mas não usa. Mensagem para os 17 nomes novos. Edna Pereira Cardoso é funcionária? Qual Francielly deve R$ 150,00? Estela Taques: valor e baixa. Respostas da Thalita e da Ana Maria ainda NÃO gravadas. Colunas "Vendas 3 meses" e "Média mensal" não vistas na tela |
| TOP VENDEDORAS | "Posso fazer commit e push?" Encurtar o nome da revendedora ou manter completo? Pronto e CONFERIDO |
| APP REPRESENTANTE | No celular o menu lateral some e ela usa atalhos e barra do app: certo? O que a representante usa no dia a dia: só Revendedoras, Listagens, Kits Novos e Comissões? Posso conferir o Início em tamanho de celular? Início feito, não conferido |

## 3. RH

| Conversa | O que espera do Marcus |
|---|---|
| RH | Clicar em "Gravar os meses" no Puxar do Financeiro, no site publicado. Mandar para a Maria a mensagem do Formulário dos funcionários. Liberar o Canal de denúncias para o pai dele? (recomendação: não) |
| RH fork | Tornar a coluna Setor editável para todos (menu na linha)? Testar no site: "Acesso total" nas linhas da Priscila e da Amanda deve abrir a janela "Dar acesso total a...?" |
| NR-1 (Maria) | Quanto a Sorelly paga hoje à Flexx pelos outros 3 CNPJs? A Maria manda à Flexx a mensagem com 5 perguntas (prazo, preço da OS, excedente, renovação, multa). Ação 1 vence em 20/11 e a Axis não entrega até lá. **A proposta (R$ 1.350,00 por ano) vale só 15 dias.** Depois da minuta o Marcus assina |

## 4. Cadastro de peças e Produção

| Conversa | O que espera do Marcus |
|---|---|
| RAYSSA (Contas bancárias) | Comparar as outras telas com o backup e restaurar o que ele tinha arrumado? (~100 arquivos diferem). Rodapé "Mostrando N de M" restilizado em 18/11 não foi restaurado. Backup em `C:\Projetos\backup-sorelly-19-11-antes-de-atualizar` + stash do Git |
| PRODUÇÃO EM CASA | "Posso publicar tudo agora?" Confirmar: "lexi" é a Leci? 16 códigos, 1.007 peças já no banco real; mudanças de tela sem publicar |

## 5. Atendimento interno

| Conversa | O que espera do Marcus |
|---|---|
| ATENDIMENTO INTERNO | Testar alerta "Nova venda" com venda real (tocou? voz boa?). Tabela "Em números" da tela Regras mostra escada antiga de 60 dias: passar a tabela certa. Prazo de quitar: 15 dias no sistema x 30 na pasta de regras, qual vale? "Pode fazer" para mover configurações (acessos, comissões das representantes, formas de pagamento) do computador para o servidor |
| ATENDIMENTO INTERNO fork | Falta publicar: Direcionar sem "9 de 9", avisos de 4 linhas, fonte 11 px; Direcionar sem bloco da Família; Nova venda com faixa fina no topo. Só na pasta de trabalho, sem commit |

## 6. Marketing e Material gráfico

| Conversa | O que espera do Marcus |
|---|---|
| MARKETING fork | Conferir quanto as fotos somaram na meta da semana (350)? Script do cálculo se perdeu. Peça CL0801: equipe diz OK, mas sem foto na DevMaster. Mensagem de cobrança pronta |
| Material gráfico | A Trio preta chegou? Lista copiável para o Edson (borboleta rosa, cordinha, adesivos)? Posso criar bolsinha de Natal creme e vermelha e lançar 5.000 (2.500 cada)? Pedido diz 4.000 creme, Edson mandou 5.000: qual vale? "Bloco garantia" = "Bloco garantia do setor"? Tag Man azul é a conjunto ou a Man Mini? Pedidos de compra parados no Financeiro como "Não verificada" |

## 7. Telas e padrão visual (conversa "Skill search no GitHub")

- Amanhã: migrar telas antigas em lote ou primeiro 2 a 5 telas modelo? (Pergunta repetida.)
- Ao pedir as telas modelo, dizer o nome delas no começo do pedido.
- Refeitas e SEM commit: 3 telas, ajustes nas peças, `docs/historico/ANALISE-DE-TEMPO-DAS-TELAS-18-11-2026.md`, `scripts/analise-conversas/`.
- Ficaram no visual antigo: Preferências do kit (ficha, Formulário, Análise, Importar); Metas (Acompanhamento, Histórico, Notificações).

## 8. Cadastro Kommo / Indicações (esta conversa)

Esperar resposta do Leonardo sobre kit novo, Kommo e app. Depois ligar app e Kommo ao sistema novo (só leitura primeiro). Decidir se devolve o botão "Anexar print das peças" (não achei esse texto no código; Marcus precisa dizer em qual tela ficava).

## 9. Não apagar

- `C:\Users\marcu\Downloads\sorelly-admin\sorelly-top100-pub` (Top 100, só existe aqui, sem commit)
- `C:\Projetos\backup-sorelly-19-11-antes-de-atualizar` e o stash do Git
- Pasta principal `sorelly-admin` com alterações sem commit (muitas conversas)
- Worktree `.claude/worktrees/xenodochial-roentgen-3775dc` (limpa; pode remover depois de anexar os 3 comprovantes)

## 10. Mais urgente (ordem)

1. NR-1 Flexx: proposta vence em 15 dias; ação vence em 20/11.
2. Subir o que está pronto e parado: Top 100, Quem pagou, Direcionar/Nova venda, Encomendas, Produção em casa.
3. Os 3 comprovantes do Pix adiantado.
4. As respostas do Contas a pagar (Itaú Black, Erlina, iPhone).

## 11. Podem ser arquivadas sem perda

Todas as rodadas automáticas "Atualizar Sorelly Admin" e "Atualizar RH do Sorelly Admin" (cerca de 45).
Conversas de outros projetos (AGENDA GLAM, ECONOMIA, FOREX PROJECT) não foram lidas: decidir à parte.
