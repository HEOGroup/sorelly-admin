# Vistoria do app da representante (calculadora de acertos) — 03/11/2026

Objetivo: dizer o que está pronto, o que está incompleto e o que precisa de decisão, para o Leonardo levar a calculadora ao app de iOS e Android.
Origem: o protótipo em `/apps?acerto=1` (arquivos `src/apps/montagem/mobile/representante.js`, `assinatura.js`, `pre-acerto-rep.js`, `regras-comissoes-app.js`) e as regras em `domain/consignado.js`, `domain/acerto-derivado.js`, `domain/pagamento-rep.js`, `domain/garantias-rev.js`.
Regra do projeto: o app de celular aqui é protótipo. O app de verdade é do Leonardo; aqui se definem regras e telas.

## 1. Telas da calculadora: situação

Ordem na tela: Pré-acerto → Condicionais → Multa por remarcação → Crédito de garantia → Trocas → Vendas e pagamentos → Brindes → Kit novo → Peças próximo mês → Devolução de peças → Confirmar acerto → Assinatura → Fechamento.

| Tela | Situação | Testado no navegador |
|---|---|---|
| Pré-acerto (valor pendente, atraso) | Pronta | Sim (02/11) |
| Condicionais | Pronta | Sim (antes) |
| Multa por remarcação (com motivo de isenção) | Pronta | Sim (02/11) |
| Crédito de garantia | Pronta: vem do setor Garantia (aba Créditos), sem digitar | Sim (lançar e ver no app) |
| Trocas (passos 1, 2, 3 centralizados, texto claro) | Pronta | Só o passo 1 |
| Vendas e pagamentos (4 formas, comprovante obrigatório) | Pronta | Sim |
| Pix, link e cartão pedem a conta ao financeiro | Pronta ("Enviado ao financeiro") | Só o aviso de espera |
| Inadimplência (negociar parcelas, botão Regras, jurídico 24 h) | Pronta, sem cálculo de juros | Parcial |
| Brindes (2 blocos: Normal e BB, botão OK, trava do excedente) | Pronta | Sim (com excedente) |
| Kit novo (4 vendas, média, sem nova chance) | Pronta | Sim |
| Peças próximo mês (layout A) | Pronta | Sim |
| Devolução de peças (alerta para contar) | Pronta | Sim |
| Assinatura (botão das regras, sem texto repetido) | Pronta | Sim |

## 2. O que ainda NÃO foi testado de ponta a ponta

1. Lançar uma troca inteira (passos 2 e 3 e a conta na venda).
2. Brindes SEM excedente: OK e seguir para o Kit novo.
3. Crédito de garantia virar "Usado no acerto" quando o acerto é finalizado.
4. Tela do Pix com a conta já respondida ("Faça o pagamento na conta: ...").
5. Linha "Excedente" dos brindes em outro acerto.
6. Kit 100% Prata em todas as telas novas.
7. Acesso de uma conta real do setor Garantia (grupo Garantia criado em 03/11).

## 3. Para onde cada dado vai (Consolidado, Comissões e outros)

O acerto grava UM registro (`acertosConsignado`, ação `ACERTO_REGISTRAR`). O que cada tela do admin lê hoje:

| Dado do app | Consolidado | Comissões | Outro setor |
|---|---|---|---|
| Valor do acerto, vendas, pagamentos por conta | Lê | Lê (comissão sobre o RECEBIDO) | Inadimplência: valor pendente |
| Brindes lançados e excedente | Lê | Lê o excedente | |
| Trocas (quantidade) | Lê | Não precisa | |
| Peças próximo mês, peças a devolver | Lê | Não precisa | Bipagem de retorno |
| Crédito de garantia (valor) | Lê | Já vem líquido na venda | Garantia: situação Usado |
| Kit novo confirmado | Não | Lê (paga o valor do kit novo) | |
| Assinatura da revendedora | Só o campo, sem mostrar a imagem | Lê (condição do kit novo) | |
| **Regras lidas e versão das regras** | **Não lê** | Não | **Nenhuma tela mostra** |
| **Negociação (parcelas) e "não quis negociar"** | **Não lê** | Não | **Inadimplência e Jurídico não recebem** |
| **Motivo da venda baixa (abaixo de R$ 500)** | **Não lê** | Não | Nenhuma |
| **Pré-acerto (atraso, valor pendente)** | Não lê | Não | Nenhuma |
| Pix, link e cartão (pedido de conta) | Parcial | Não | Financeiro > Controle de pagamentos (Direcionar): já recebe |

## 4. Lacunas que bloqueiam o fim do app

| Nº | Lacuna | Por que importa | Quem decide ou faz |
|---|---|---|---|
| 1 | O registro do acerto fica SÓ no navegador (`acertosConsignado` não é módulo do servidor) | Consolidado e Comissões de outro computador não veem o acerto. No app de verdade, o backend precisa gravar o acerto | Leonardo (backend) |
| 2 | A assinatura não aparece no admin | A revendedora diz que não sabia das regras: não há prova para abrir | Marcus aprova; eu faço |
| 3 | Negociação e "não quis negociar" não chegam na Inadimplência nem no Jurídico | A regra do jurídico (24 h depois do contato) não tem fila nem cronômetro | Marcus define o fluxo; eu faço |
| 4 | Juros da inadimplência não têm taxa definida | O painel mostra a multa (10%, 15 dias, 1% ao dia até 10%), mas não calcula juros em reais | Marcus |
| 5 | Pix: faltam chave Pix e botão Copiar ao lado da conta | A representante vê só o nome da conta | Marcus diz de onde vem a chave |
| 6 | A média de 4 vendas só vale no app. O Atendimento interno tem só 2 vendas anteriores | Regra diferente em dois lugares | Marcus |
| 7 | Sem tela de "o que o Leonardo precisa gravar": campos, nomes e regras de cada tela | O Leonardo precisa de uma lista de campos por tela | Eu escrevo (próximo passo) |
| 8 | Registro de versões e decisões do dia (`versoes.js`, `DECISOES.md`) ainda não atualizado | Perde-se o histórico | Eu faço |
| 9 | `representante.js` tem 170 KB num arquivo só | Difícil para o Leonardo ler | Opcional: eu divido em partes |
| 10 | Publicação na master das mudanças de 03/11 do app | O servidor ainda tem a versão anterior do app | Marcus manda; eu publico |

## 5. Regras decididas em 03/11/2026 (já no código)

- Média da venda mínima = últimas 4 vendas (3 anteriores + a de hoje); abaixo de R$ 500 o kit novo fica bloqueado e NÃO existe nova chance.
- Não quis negociar o valor em aberto: sem brinde; o jurídico entra em contato; sem negociação em 24 h depois do contato, a nota promissória vai para execução no valor pendente.
- Brinde acima do liberado (excedente): a representante dá OK nos brindes, volta para Vendas e pagamentos e NÃO segue (Kit novo, Peças, Devolução, Confirmar acerto) até pagar a diferença.
- Crédito de garantia: lançado pelo setor Garantia (Garantia > Créditos); sobe sozinho para o acerto; a representante não digita.
- Assinatura: botão "Abrir as regras para a revendedora ler"; as regras não ficam escritas na tela; o aviso diz que as regras também ficam no app da revendedora (Regras e comissões).
- Devolução de peças: alerta para a representante contar as peças que voltam à empresa.
- Folders: regulamento completo (8 páginas) e folder resumido (2 páginas, para candidatas) em Cadastro de revendedoras > Folders.

## 6. Ordem sugerida para fechar

1. Marcus responde as decisões 4, 5 e 6.
2. Eu faço as lacunas 2, 3 e 8 (assinatura no Consolidado, fila de negociação e jurídico, registros).
3. Eu escrevo a lista de campos por tela para o Leonardo (lacuna 7).
4. Teste de ponta a ponta com os 7 itens da seção 2.
5. Publicar na master.
