# Encomendas e Reposições (contexto passado pelo Marcus em 16/10/2026)

Setor de **Encomendas & Reposições**: equipe Agatha, Elen e Eduarda (hoje o atendimento é todo pelo WhatsApp, "entupido de mensagens, tudo desorganizado"). Marcus: "um setor muito difícil, muito complicado". Ainda não existe nada no sistema além da página de Regras; o que vier agora é um **esboço com as regras que já temos**, para ir refinando. No SorellyAdmin não há módulo equivalente. Atualizar ao decidir algo novo. Dados pessoais (nomes de revendedoras, pedidos) só em `*.local.js` ou digitados.
Decisão anterior (07/10/2026): a reposição **não é oferecida às revendedoras por ora** (o sistema abre direto nas Regras do setor); o controle é interno. Ver `FLUXO-DA-EMPRESA.md` e CLAUDE.md.

## Regras de REPOSIÇÃO (texto passado às revendedoras)
A quantidade de reposições, o limite de valor e a taxa variam conforme a **média de vendas dos últimos 3 meses**:

| Média (3 meses) | Reposições por mês | Limite por reposição | Taxa |
|---|---|---|---|
| Abaixo de R$ 500 | não tem direito | — | — |
| R$ 500 a 999,99 | 1 | até R$ 2.500,00 | R$ 20,00 |
| R$ 1.000 a 1.499,99 | 2 | até R$ 3.000,00 cada | R$ 20,00 |
| R$ 1.500 a 1.999,99 | 2 | até R$ 3.000,00 cada | R$ 10,00 |
| R$ 2.000 a 2.999,99 | 2 | até R$ 3.500,00 cada | R$ 10,00 |
| R$ 3.000 a 3.999,99 | 2 | até R$ 4.000,00 cada | R$ 10,00 |
| A partir de R$ 4.000 | 3 | até R$ 5.000,00 cada | R$ 10,00 |

- **Entrega:** conforme a rota disponível, ou **retirada na empresa mediante agendamento**.
- **Bloqueio:** se as vendas forem **inferiores a 30% do valor da reposição**, a revendedora fica **bloqueada por 3 meses** para novas solicitações.

## Regras do EXPOSITOR (liberação)
O expositor permite vender as semijoias Sorelly num **ponto fixo** (salão, loja, clínica), em **consignação**.
- **Tem direito** quem tem **média de R$ 1.500,00 nos últimos 3 meses** OU realizou **ao menos uma venda de R$ 1.000,00**.
- É preciso **avaliar o local**: a revendedora envia uma **foto do espaço**; depois da aprovação o processo continua.
- **Formas de receber:** entrega pelo entregador (taxa R$ 10,00); retirada na empresa; ou retirada/entrega na data do acerto pela representante, conforme a disponibilidade do expositor.
- **Ao receber:** conferir se há dano ou defeito e avisar na hora, com fotos para registro. Depois de **assinada a condicional**, considera-se recebido em perfeito estado e deve ser devolvido nas mesmas condições. Dano na devolução não informado antes pode gerar **cobrança do reparo**.
(O controle das condicionais de expositor já existe em Expositores; aqui entra a LIBERAÇÃO e o pedido.)

## Dores e o que o sistema deve fazer
WhatsApp bagunçado → **fila organizada** de pedidos (kanban), cada pedido com revendedora, representante, média de vendas dos 3 meses (para calcular direito, limite e taxa sozinho), situação e histórico; regras configuráveis (as faixas acima ficam no Configurador/Regras do setor, nunca fixas em tela).

## Perguntas em aberto
O que são "encomendas" (pedido de peça específica? sob medida?), como o pedido chega, o fluxo dentro do setor (quem faz o quê), como se mede "vendas inferiores a 30% da reposição", como a retirada/entrega é agendada e se a reposição troca peças ou é kit extra. Respostas do Marcus entram aqui.
