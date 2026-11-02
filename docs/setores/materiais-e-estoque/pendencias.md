# materiais-e-estoque: pendências

O que o diário de decisões (`docs/DECISOES.md`) diz que **ainda falta ou está em aberto** neste setor. Levantado em 02/11/2026 por palavras como pendente, a confirmar, falta. É um ponto de partida: confira, risque o que já foi feito e acrescente o que faltar.
Pendência nova entra aqui e no diário geral, no mesmo dia.

- [ ] **Cadastro de peças e compras (alinhamento, Marcus 20/10/2026, ainda sem tela):** planilha Bruto/Ouro 2026 (só abas atuais: 19/10 Ellos, 16/10, 09/10, 05/10 e 14/09 Pontual + Brutos Pedidos, Pontual Pedidos, Ellos Pedidos e Retirar Ouro; estoque ignorado). Custo = bruto + banho (peso × R$/g da fatura +10%, verniz +R$ 0,37/g, des…
  - de: 20/10/2026 (trecho)  (diário, linha 279)
- [ ] **Código da peça:** vem em sequência da DevMaster (a Rayssa não inventa). Formato: letras da categoria primeiro (A, B, CL, P, BB...), depois o número. Peça com tamanho: os 3 últimos dígitos = "0" (corte) + tamanho de 2 dígitos. Exemplo A2121026 = A2121 + tamanho 26; etiqueta A2128016 = tamanho 16. A confirmar com o Marcus: o "3 …
  - de: 27/10/2026 · Cadastro de peças: código e tags (Marcus)  (diário, linha 1282)
- [ ] **Tags físicas e adesivos:** escolha aleatória, sem regra. O Marcus escolhe junto com o preço, quando a Rayssa manda as peças no grupo. Regra ainda não existe; entra no sistema como campo escolhido pela diretoria.
  - de: 27/10/2026 · Cadastro de peças: código e tags (Marcus)  (diário, linha 1282)
- [ ] Guia visual (códigos, tags, adesivos, etiquetas): PDF "CADASTRO DE PEÇAS - CÓDIGOS, TAGS, ADESIVOS E ETIQUETAS". Falta a planilha Bruto/Ouro 2026 e outros arquivos da Rayssa.
  - de: 27/10/2026 · Cadastro de peças: código e tags (Marcus)  (diário, linha 1282)
- [ ] **Kit perfeito: layout A escolhido (Marcus, 27/10/2026).** Versão 2 com sequência numerada, instruções simples e fluxo de falta de peça em `docs/design/testes-de-layout/kit-perfeito-layout-A-v2.html`. Regras de troca propostas, a confirmar. Detalhes em `docs/negocio/KIT-PERFEITO.md`.
  - de: 27/10/2026 · Cadastro de peças: código e tags (Marcus)  (diário, linha 1282)
- [ ] 27/10/2026, tela Contas a receber (Revendedoras › Contas a receber, `pages/ContasReceber.js`, servidor `src/server/contas-receber.js`, rota `/api/contas-receber`, só Diretoria): blocos com listas no desenho do Cadastro de revendedoras + Mapa do dinheiro. Recebido = Pix, link, cartão, dinheiro; acerto - loja (ACE/ACI) = não pagou…
  - de: 27/10/2026 · Cadastro de peças: código e tags (Marcus)  (diário, linha 1282)
- [ ] 27/10/2026, Contas a receber vai para o FINANCEIRO (Receber › Contas a receber, `/contas-a-receber`, aba `revreceber`), não fica em Revendedoras. Mês filtrado vale para todos os blocos. Recebido = um bloco com visões Por CNPJ / Por conta / Por forma de pagamento. Diferença com o relatório de notas: nota fiscal = tudo o que foi v…
  - de: 27/10/2026 · Cadastro de peças: código e tags (Marcus)  (diário, linha 1282)
- [ ] 27/10/2026, atualização do admin antigo (skill atualizar): saldos (finance_balance) e contas pagas por dia (faturamento_contas_diario) conferidos até 27/10 — o arquivo saldos-atualizacao.local.js já estava igual ao admin (20 dias de outubro, total pago R$ 1.261.865,29; saldos de 23, 26 e 27/10 iguais). Totais do mês (faturamento…
  - de: 27/10/2026 · Cadastro de peças: código e tags (Marcus)  (diário, linha 1282)
