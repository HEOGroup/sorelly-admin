# revendedoras: pendências

O que o diário de decisões (`docs/DECISOES.md`) diz que **ainda falta ou está em aberto** neste setor. Levantado em 02/11/2026 por palavras como pendente, a confirmar, falta. É um ponto de partida: confira, risque o que já foi feito e acrescente o que faltar.
Pendência nova entra aqui e no diário geral, no mesmo dia.

- [ ] Ainda não existe: marcar dia e hora (como no Atendimento interno), registro de contato e situação. Esta aba só mostra, conta e registra as trocas.
  - de: 29/10/2026 (Agendamento › Revendedoras: todas com kit ativo)  (diário, linha 129)
- [ ] **Regras da agenda:** até 3 por horário, até 15 por dia, horários de 1 hora das 08h às 18h (inclui 11h e 12h); sábado só 08h, 09h e 10h (máximo 9); domingo sem atendimento. O sistema recusa marcação fora disso (`motivoNaoMarcar` em `domain/revendedoras-internas.js`, guarda em `REVINT_AGENDAR`). Pendente: aplicar a mesma guarda n…
  - de: 28/10/2026 (Atendimento interno · Revendedoras, calendário e agenda)  (diário, linha 173)
- [ ] **Revendedoras do vendedor Sorelly (02) entram sozinhas no controle da agendadora** (Atendimento interno → Revendedoras → "Buscar da DevMaster"): fonte = API 2 (`/api/revendedoras?rep=02`), 196 em 27/10. Quem já existe só ganha as vendas reais. A tabela mostra Média 3 vendas (regra de `negocio/MEDIA-DE-VENDAS.md`) e Próximo kit …
  - de: 27/10/2026 (Atendimento interno · Revendedoras)  (diário, linha 192)
- [ ] Marcus: 2.105 revendedoras em 26/10. Carregar aparece na faixa de totais do Faturamento e na Visão geral. Revendedoras por dia (20 a 25/10) pendente de puxar do admin antigo: conector fora do ar nesta sessão.
  - de: 26/10/2026 · Revendedoras e Carregar  (diário, linha 1003)
- [ ] Marcus: ficha com blocos (Em condicional, Acerto, Devolução, Cadastro) e tabela com todas as condicionais, TOTAL acima do cabeçalho. Previsão de acerto = próxima previsão de devolução (a DevMaster não traz outra data). Falta ligar: horário agendado, último acerto e ciclo (dependem do Agendamento e dos acertos antigos). Pendente …
  - de: 26/10/2026 · Ficha da revendedora  (diário, linha 1164)
- [ ] **Pendente: precisa reiniciar o servidor uma vez** para o `instrumentation.js` rodar (ele só liga no boot do processo). Até lá, a caixa mostra "Atualiza sozinho às 18h" mas nada roda sozinho ainda.
  - de: 27/10/2026 (3) · Revendedoras do dia: atualização automática pela DevMaster  (diário, linha 1176)
- [ ] Marcus: puxar as condicionais abertas até o ano 3000 (expositor). "Todas" continua só kits (2.106 revendedoras, R$ 20.665.969); aba Expositor e aba "Só expositor · sem kit" (59 esquecidas). Modelos agrupados: todos os dois andares juntos; abrir o grupo mostra os modelos e quem está com cada um (filtro por grupo/modelo). Média da…
  - de: 26/10/2026 · Revendedoras: expositores  (diário, linha 1188)
- [ ] Marcus escolheu a opção 2: card somente leitura em 3 colunas (Quem é, Contato, Kit). Nada editável; edição só para acesso restrito (selo "Edição restrita", edição ainda não existe). Embaixo, botão para alternar Condicionais (histórico completo, abertas e fechadas) e Vendas (todos os acertos). Campos da DevMaster usados: dmafi (a…
  - de: 27/10/2026 · Ficha da revendedora em card (opção 2)  (diário, linha 1212)
- [ ] 27/10/2026, acertos: tela Revendedoras mostra nº de acertos e valor dos acertos (acerto da DevMaster − brinde, troca, indicação, premiação). Conferência com o relatório de 26/10 (relFat005): o relatório agrupa por DATA DA NOTA, não pela data da venda (vendas de 23 e 24/10 aparecem no dia 26). Por isso o dia não bate; o mês fecha…
  - de: 27/10/2026 · Revendedoras: venda sem brinde (TES), brindes e % de brinde  (diário, linha 1221)
- [ ] 27/10/2026, data da venda: o relatório do Marcus usa a DATA DE FATURAMENTO (dmach.ach_datafat, quando fecha no Carregar), não a emissão. A carga das vendas passou a usar ach_datafat. Pagamentos: dmach.ach_tipopag (forma), dmabg (títulos a receber) e dmabf (baixas) são as fontes prováveis da aba Contas a receber; falta confirmar …
  - de: 27/10/2026 · Revendedoras: venda sem brinde (TES), brindes e % de brinde  (diário, linha 1221)
- [ ] 27/10/2026, Cadastro das revendedoras: colunas novas (idade, nascimento, e-mail, bairro, CEP, cadastro). Instagram vem vazio na DevMaster e o campo App é sim para todas, por isso ficaram de fora. Pendente: dashboard no alto (média de idade, cidades) e a opção Kits ativos / Total.
  - de: 27/10/2026 · Revendedoras: venda sem brinde (TES), brindes e % de brinde  (diário, linha 1221)
- [ ] Pendente: nota promissória final fica para outra hora (Marcus, 29/10/2026); quando vier, trocar `NOTA_PADRAO`; depois alguém troca o texto no modelo da DevMaster.
  - de: 28/10/2026 · Aba Condicional em Revendedoras  (diário, linha 1325)
- [ ] **App do motoboy, H&O Delivery (Marcus, 29/10/2026):** projeto da H&O Apps para entregas por motoboy, começando pela rede da Sorelly em Curitiba. O Marcus escolheu o layout E (mapa total + botão grande flutuante embaixo; protótipos em `docs/rascunhos/motoboy/motoboy-4-layouts*.html`). O app já está na tela Apps, aba Motoboy (`mobile/mot…
  - de: 29/10/2026 · App da revendedora e venda mínima  (diário, linha 1433)
