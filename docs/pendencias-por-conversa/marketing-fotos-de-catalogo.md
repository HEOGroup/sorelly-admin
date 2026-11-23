# Pendências · conversa "Marketing · Fotos de catálogo" (18 e 19/11/2026)

Levantamento só de leitura. Nada de código mudou para fazer este arquivo.

## 1. O que foi feito (resumo)
- Nova aba **Marketing › Relatório diário** (artes, stories, reels, fotos editadas por dia). Está na master.
- Achei por que o **Fotos de catálogo "não atualizava"**: janela de 120 dias, rótulo "Última atualização" por navegador, pacote da meta sem publicar. Corrigi e publiquei. Marquei 2.035 peças antigas (com OK do Marcus).
- Achei por que a bipagem dava **"Código não encontrado"** (CL2450J): a leitura da DevMaster cortava em 30.500 produtos e a DevMaster tem 37.518. Tirei o limite no caminho das fotos e entrei **16.952 códigos** no sistema (com OK do Marcus).
- Meta da semana (16 a 20/11) com degraus 250/300/350 (R$ 150,00 / R$ 200,00 / R$ 250,00); relatórios de progresso por dia, por categoria e por modelo; mensagens copiáveis para Castilho, Beatriz, Ana Paula e Rayssa.
- Tabela **Fila por dia** ficou só com a coluna Sistema (pedido da equipe). Registrei a regra do pagamento dos funcionários (5º dia útil e dia 20) nos documentos.

## 2. Alterações sem commit ou fora da master
| O que | Onde | Situação |
|---|---|---|
| Regra de pagamento dos funcionários (sábado não conta; feriado em aberto) | `docs/DECISOES.md`, `docs/setores/rh/{decisoes,LEIA-ME,pendencias}.md`, `docs/negocio/FLUXO-DE-PAGAMENTOS.md` na pasta principal; `docs/Painel de documentos.html` na pasta `sorelly-rh` | **Editado, NÃO publicado.** Mistura com trabalho de outras conversas. |
| Scripts de leitura `scripts/usados-uma-vez/*` (meta, peças novas, modelos, conferir 17 e 121 peças, status 8h) | Pasta principal, sem commit | Parte sumiu na troca de pastas de 19/11. Só os `status-modelos-19-11`, `status-8h-19-11`, `conferir-121-19-11` e afins existem hoje. Nada disso é do sistema. |
| `docs/dados-locais/marketing/pecas-cadastradas-semana-16-19-11.csv` | Pasta principal | Arquivo novo, sem commit. Só códigos e descrições. |
| Memória: `pagamento-funcionarios-5-dia-util-dia-20.md` | Pasta de memória | Gravada. |
| Dados no banco de produção | Módulo `fc` | Gravado: 2.035 peças marcadas + 16.952 códigos novos. Não tem como desfazer por script pronto. |

Tudo do código das fotos e do Relatório diário **já está na master** (commits da fila: 225ef43, 6ece841, b6b90e6, o da leitura completa e 3f3f297).

## 3. Pendências
**Dados e sistema**
- **Rotina do Vercel não dispara.** `m.dmTentativa` nunca apareceu. Suspeita: falta `CRON_SECRET` em Production. Hoje a leitura só roda com a tela aberta (a cada 2 min) ou na minha mão.
- **O limite de 60 páginas** (`todasAsPaginas`, 30.500 linhas) continua valendo para as outras tabelas da DevMaster (vendas, clientes, contas). Eu só mudei o caminho das fotos. **Não conferi** se outras telas ficam com número cortado.
- A lista da tela de fotos dobrou de tamanho (37.885 códigos). **Não medi** lentidão na tela nem testei no navegador. Também não abri a Fila por dia no navegador depois da mudança (só passou no padrão e no build).
- O cálculo da **meta da semana** dependia de script perdido. Último valor medido: 227 de 350 (15h35). **Resultado final da semana e prêmio por pessoa não foram calculados.**
- Peça marcada como "Sistema" sem foto na DevMaster (aconteceu com 9 peças CC e COL). Não existe aviso no sistema para isso. CL0801 também está na lista deles como OK sem foto.
- A2407 é pulseira com código de anel: o sistema conta como Anel.

**Pedidos e decisões do Marcus sem fechar**
- Degraus 250/300/350 ou 200/240/280? Prêmio por pessoa ou dividido entre Castilho e Beatriz?
- Sexta 20/11 (feriado) vale como dia de trabalho? A meta fecha na quinta?
- A meta deve contar **qualquer foto** ou só **modelos novos**? (Hoje conta qualquer uma; 173 das 182 fotos da meta eram de modelos antigos.)
- Tirar Foto e Editada também das outras tabelas (lista do Hoje, Produção diária)? Perguntei, sem resposta.
- Pagamento dos funcionários: feriado e fim de semana pagam antes ou depois? (O adiantamento de 20/11 cai em feriado.)
- Relatório diário: confirmar a lista de atividades e quem preenche.
- Prêmio da meta é em dinheiro até quinta 26/11 (dito pelo Marcus).

**Ideias combinadas e não feitas**
- **Entrega física da peça** é o gargalo (Beatriz: peças cadastradas em 16/11 chegaram em 19/11). Propus a lista "Cadastradas e não entregues" (opção C) e depois a etapa "Entregue" (opção A). **Nada feito.** Falta saber quem cadastra e entrega.
- Tela com a fila **por modelo** e com a **idade em dias** de cada modelo sem foto.
- Aviso quando alguém marcar "Sistema" sem foto na DevMaster.
- Aviso ao Castilho: leitura corrigida e pedir print do cabeçalho "Última atualização". **Não enviado.**
- Conferência das 17h do dia 19/11: refeita às 18h14 (83 de 96). Fechamento final do dia/semana não feito.

## 4. Perguntas prontas para o Marcus (em ordem de importância)
1. **Quero conferir as outras telas da DevMaster que têm o limite de 30.500 linhas?**
   Recomendo: sim. Consequência de "sim": acho números cortados antes que alguém decida em cima deles. De "não": o risco continua escondido.
2. **Quem confere o `CRON_SECRET` e os Cron Jobs no Vercel?**
   Recomendo: o Leonardo, hoje. "Sim": a leitura passa a rodar sozinha a cada 10 e 30 minutos, sem tela aberta. "Não": as fotos só atualizam com alguém na tela.
3. **A meta conta qualquer foto ou só modelos novos?**
   Recomendo: só modelos novos, mais um bônus menor para antigos. "Só novos": a equipe passa a priorizar a fila nova. "Qualquer": a equipe segue limpando o estoque antigo.
4. **Faço a lista "Cadastradas e não entregues" (opção C) e depois a etapa "Entregue"?**
   Recomendo: sim, só a lista agora. "Sim": a Beatriz vê na hora o que não chegou (como o M0934). "Não": o atraso continua invisível.
5. **Degraus e prêmio: 250/300/350 por pessoa, ou dividido? Sexta vale?**
   Recomendo: dividir entre Castilho e Beatriz e fechar a meta na quinta. "Por pessoa": o gasto dobra. "Dividido": fica dentro do valor combinado.

## 5. Esta conversa pode ser arquivada?
**Não.** Falta: (a) calcular o resultado final da meta e o prêmio de cada pessoa; (b) o Marcus responder as perguntas acima; (c) alguém checar o Vercel; (d) publicar os documentos da regra de pagamento (hoje misturados com outras conversas).
