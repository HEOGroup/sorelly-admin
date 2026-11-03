# Metas: pendências

- Revisar no Editar da Regras as metas que escolhi em valores redondos: só Meta 1 de 1.000 a 3.000 vieram do Marcus (1.900, 2.500, 3.000); as outras Meta 1, todas as Meta 2 e o +20% e +40% da categoria individual foram escolha minha.

- Brindes: a etapa do brinde extra é uma coluna na tela Revendedoras (só a Diretoria grava). Falta testar o primeiro Salvar real e decidir quem da supervisão do acerto pode mudar a etapa.
- Brindes extras das categorias acima de R$ 2.000: o teto de R$ 418 foi aprovado pelo Marcus (02/11/2026); ele ajusta o resto no Editar da tela Regras.
- As duas categorias novas (R$ 0,00 até R$ 599,99 e R$ 600,00 até R$ 999,99) têm as mesmas metas e brindes por enquanto: o Marcus ajusta no Editar.
- O botão Editar da tela Regras ainda NÃO foi testado gravando de verdade (o teste de gravação foi bloqueado pelo sistema de permissão); só o envio foi conferido com gravação simulada. Conferir o primeiro Salvar real.

- Confirmar se as 24 que só têm venda antiga (mais de 12 meses) contam como Kit novo (hoje contam).
- Aprovar o protótipo `docs/ideias/metas-campanha-simulador.html` (Campanha + Simulador) antes de construir no sistema.

- Prontas: Revendedoras, Acompanhamento, Histórico e Regras (a Regras tem o botão Editar das metas e brindes; a tela Campanha acabou). O Simulador de custo não existe (o Marcus não gostou do protótipo).
- Confirmar as metas das classes provisórias (R$ 2.000 em diante).
- Definir quem vê cada tela (supervisão do acerto, representante).
- Ligar o brinde extra à Calculadora de acertos e ao app da representante; mandar o custo para o Financeiro.
- Os valores do extra e os percentuais ficam em `domain/metas.js`: falta a tela Campanha para o Marcus mudar mês a mês sem código.
- Definir se "acertou no mês" conta pela data de faturamento (como hoje) ou pela data do acerto.
- A tela só mostra a campanha de novembro. Falta a tela Campanha para escolher qual campanha ver (a regra da virada já está no servidor).
- Conferir a regra da virada com dados reais assim que houver acertos em novembro (hoje as vendas guardadas vão até 31/10).
- App da revendedora (Marcus, 02/11/2026): aba Minha Meta brilhando, notificações (3 por dia) com copy profissional e tela de notificações no admin. Protótipo em `docs/ideias/metas-notificacoes-app.html`. Falta definir com o Leonardo como o backend do app lê as metas novas (`/api/metas`) e envia o push; o admin novo só lê.
- Tempo real por revendedora: pedir ao Leonardo uma rota de admin com o vendido atual no app (hoje `/api/metas` exige o login dela e `/api/admin/resellers/:id/monthly-history` só traz o histórico mensal).

- Notificações: falta rota de admin no backend do app para o tempo real (último acesso, vendas do dia) e o envio do push (Leonardo). Revisar os 18 textos com o Marcus.
