# atendimento-interno: pendências

O que o diário de decisões (`docs/DECISOES.md`) diz que **ainda falta ou está em aberto** neste setor. Levantado em 02/11/2026 por palavras como pendente, a confirmar, falta. É um ponto de partida: confira, risque o que já foi feito e acrescente o que faltar.
Pendência nova entra aqui e no diário geral, no mesmo dia.

- [ ] **Pendente na calculadora:** 11 tamanhos de letra, h-9/h-10/h-11/h-12, cinza e a tabela de comissão ainda fora do padrão (a trava só cobra o que for mexido). O aviso de React "Each child in a list should have a unique key" aparece em `AtendimentoInterno`; pela pilha vem do componente pai (provavelmente anterior à troca, não conf…
  - de: 01/11/2026 (peças extraídas da calculadora do Atendimento interno)  (diário, linha 6)
- [ ] **Padrão novo de bloco:** sem caixa dentro de caixa. Linhas entre blocos grossas (2 px, dourado), linhas dentro da tabela finas. Aplicado na etapa 1, na lateral das etapas (com borda inteira), no topo e no Resumo do acerto. **Falta aplicar nas etapas 2 a 5** (Pagamentos, Brindes, Condicional nova, Regras).
  - de: 01/11/2026 (Atendimento Sorelly: topo em tabela, etapa Valor do kit, blocos sem caixa dentro de caixa)  (diário, linha 25)
- [ ] **Pendente (01/11/2026):** CNPJ, razão social e endereço da H&O Apps não estão no sistema nem na internet; o Marcus busca no banco ou no contador e passa. Não gravar CPF no Git.
  - de: 01/11/2026 (Atendimento Sorelly: topo em tabela, etapa Valor do kit, blocos sem caixa dentro de caixa)  (diário, linha 25)
- [ ] **Listagens segue o formato da lista da Tamara** (degradê dourado com linhas de corte, tudo centralizado, Qtd. 1, 2, 3…, WhatsApp com botão) e continua por dia, em dropdown. **Média de vendas na Listagem** (para a bipagem escolher quem atende): venda atual (chega da DevMaster depois do atendimento) + as 2 últimas vendas da reven…
  - de: 28/10/2026 (Atendimento interno · Listagens)  (diário, linha 158)
- [ ] **Regras da agenda:** até 3 por horário, até 15 por dia, horários de 1 hora das 08h às 18h (inclui 11h e 12h); sábado só 08h, 09h e 10h (máximo 9); domingo sem atendimento. O sistema recusa marcação fora disso (`motivoNaoMarcar` em `domain/revendedoras-internas.js`, guarda em `REVINT_AGENDAR`). Pendente: aplicar a mesma guarda n…
  - de: 28/10/2026 (Atendimento interno · Revendedoras, calendário e agenda)  (diário, linha 173)
- [ ] **Regras novas**: a Tamara envia o PDF (GUIA-DA-REVENDEDORA) e registra; a revendedora avisada é carimbada com a versão em vigor e o próximo acerto dela usa as regras novas. Pendente: confirmar se basta o envio ou se precisa da resposta dela.
  - de: 28/10/2026 (Atendimento interno · card, multa e regras novas)  (diário, linha 177)
- [ ] Pendente: calendário com horários e listagem do dia no topo da tela (4 layouts em `docs/rascunhos/revendedoras/revendedoras-internas-4-layouts.html`); guardar `revInternas` no servidor (hoje só no navegador, perto do limite de 8 MB).
  - de: 28/10/2026 (Atendimento interno · card, multa e regras novas)  (diário, linha 177)
- [ ] Acerto previsto = previsão de devolução do kit principal na DevMaster. Pendente: card com todas as vendas de 2026 (valor de venda e de acerto, sem brinde) no mesmo lugar.
  - de: 28/10/2026 (Atendimento interno · registro da Tamara)  (diário, linha 184)
- [ ] **Revendedoras do vendedor Sorelly (02) entram sozinhas no controle da agendadora** (Atendimento interno → Revendedoras → "Buscar da DevMaster"): fonte = API 2 (`/api/revendedoras?rep=02`), 196 em 27/10. Quem já existe só ganha as vendas reais. A tabela mostra Média 3 vendas (regra de `negocio/MEDIA-DE-VENDAS.md`) e Próximo kit …
  - de: 27/10/2026 (Atendimento interno · Revendedoras)  (diário, linha 192)
