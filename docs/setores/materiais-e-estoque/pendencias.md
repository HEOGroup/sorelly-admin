# Materiais e estoque: pendências

Atualizado em 02/11/2026. Item resolvido sai daqui e vai para `decisoes.md`.
Lista tirada do diário por palavras como "pendente" e "falta". **Ainda não revisada com o Marcus: parte pode já estar feita.** Texto completo: diário geral, na linha indicada. "Quem decide" é uma sugestão pelo assunto.

| # | Pendência | Quem decide | Observação |
|---|---|---|---|
| 1 | Cadastro de peças e compras (alinhamento, Marcus 20/10/2026, ainda sem tela) | Marcus | De 20/10/2026, diário linha 279. A conferir. |
| 2 | Código da peça: vem em sequência da DevMaster (a Rayssa não inventa). Formato: letras da categoria primeiro (A, B, CL, P, BB...), depois o número. Peça com tamanho: os 3 últimos dígitos = "0" (corte)… | Marcus | De 27/10/2026, diário linha 1282. A conferir. |
| 3 | Tags físicas e adesivos: escolha aleatória, sem regra. O Marcus escolhe junto com o preço, quando a Rayssa manda as peças no grupo. Regra ainda não existe; entra no sistema como campo escolhido pela… | Diretoria | De 27/10/2026, diário linha 1282. A conferir. |
| 4 | Guia visual (códigos, tags, adesivos, etiquetas): PDF "CADASTRO DE PEÇAS - CÓDIGOS, TAGS, ADESIVOS E ETIQUETAS". Falta a planilha Bruto/Ouro 2026 e outros arquivos da Rayssa. | Marcus | De 27/10/2026, diário linha 1282. A conferir. |
| 5 | Kit perfeito: layout A escolhido (Marcus, 27/10/2026). | Marcus | De 27/10/2026, diário linha 1282. A conferir. |
| 6 | 27/10/2026, tela Contas a receber (Revendedoras › Contas a receber, pages/ContasReceber.js, servidor src/server/contas-receber.js, rota /api/contas-receber, só Diretoria): blocos com listas no… | Leonardo | De 27/10/2026, diário linha 1282. A conferir. |
| 7 | 27/10/2026, Contas a receber vai para o FINANCEIRO (Receber › Contas a receber, /contas-a-receber, aba revreceber), não fica em Revendedoras. Mês filtrado vale para todos os blocos. Recebido = um… | Marcus | De 27/10/2026, diário linha 1282. A conferir. |
| 8 | 27/10/2026, atualização do admin antigo (skill atualizar): saldos (finance_balance) e contas pagas por dia (faturamento_contas_diario) conferidos até 27/10 — o arquivo saldos-atualizacao.local.js já… | Marcus | De 27/10/2026, diário linha 1282. A conferir. |

## 26/11/2026 — Compras: revisão do fluxo etapa por etapa (Nickolas) — ANOTADO, NÃO FAZER AINDA

| # | Mudança pedida | Quem pediu | Situação |
|---|---|---|---|
| C1 | Etapa 4 (Efetuada): quem compra (hoje a Helen; regra = quem tem o acesso de efetuar compra) decide o VALOR FINAL. O financeiro só aprova ou reprova, não decide valor. Valor menor que o aprovado não bloqueia: quem compra ajusta os valores do plano, fica no histórico e o financeiro recebe aviso no chat. Valor maior: a confirmar (voltar ao financeiro ou liberado). | Nickolas | Anotado. Esperando o fim da revisão do fluxo. |
| C2 | Etapa 2 (Análise financeira): fica SÓ a escolha do CNPJ pagador. Saem os valores, vencimentos e prazos das partes (as condições podem mudar; a compra não é feita nas etapas 2 e 3). | Nickolas | Anotado. |
| C3 | Etapa "2 e meio": forma de pagamento que querem (Cartão, Boleto, Pix, Pix REV, Dinheiro) + sugestão de negociação (cartão: quantidade de parcelas; boleto: quantidade de boletos). Sem valor, sem vencimento. A confirmar: coluna nova no painel entre a 2 e a 3, ou junto na 2. | Nickolas | Anotado. |
| C4 | Valor, vencimento e parcelas reais passam a ser fechados por quem compra na etapa 4. | Nickolas | Anotado (consequência de C2 e C3). |
| C5 | ADENDO: liberar TUDO na etapa 3 (Liberada para compra) para quem compra (hoje a Helen; regra pelo acesso "Efetuar compras", não pelo nome) mexer também: plano, condições e dados da compra. A confirmar: trocar CNPJ ou forma escolhidos pelo financeiro também fica livre ou volta ao financeiro. | Nickolas | Anotado. |
| C6 | Etapa 4 (Compra efetuada): opção de ANEXAR A NOTA FISCAL (arquivo), se tiver. Plano de pagamento continua obrigatório. Quem compra PODE MUDAR a forma de pagamento sugerida pelo financeiro (pode ter havido conversa interna): não volta ao financeiro, só fica no histórico e vai no aviso do chat. | Nickolas | Anotado. |
| C7 | Etapa 5 (Em transporte): ao marcar, campo de OBSERVAÇÃO opcional (ex.: "será entregue em tal data", "entrega neste endereço"); pode ficar em branco. Vai no histórico e no aviso do chat. | Nickolas | Anotado. |
| C8 | Etapa 6 (recebimento): em cada item, opção "Entra no estoque? Sim / Não". Hoje o sistema decide sozinho pela classificação e pelo material ligado; passa a ser escolha de quem recebe (com o padrão já marcado pela classificação). | Nickolas | Anotado. |
| C9 | Deixar claro onde o material está: etapa 6 = "Na logística" (chegou na empresa, está com a logística); etapa 7 = "Entregue ao solicitante" (quem pediu recebeu). Proposta: nomes das colunas, linha "Está com:" no cartão (Logística / nome de quem pediu), entrega com o nome de quem pediu já preenchido e quem entregou; tirar a etiqueta "Entregue" (repete a etapa 7). A confirmar a proposta. | Nickolas | Anotado. |
| C10 | 26/11/2026: C1 a C9 SUBSTITUÍDOS pelo fluxo revisado implementado na v0.21.262 (ver decisoes.md do setor). Não entrou: escolher "Entra no estoque?" item a item (vale a regra atual pela classificação) e liberar tudo na etapa Liberada para quem compra (C5). | Nickolas | Feito. |
