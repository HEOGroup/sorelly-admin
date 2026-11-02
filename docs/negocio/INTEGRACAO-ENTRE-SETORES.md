# Integração entre setores (quem recebe o quê de quem)

Criado em 02/11/2026. Montado a partir de `FLUXO-DA-EMPRESA.md` e do `CLAUDE.md`. Onde esses documentos não decidiram, está marcado **(a confirmar)**. Não é palpite: se algo estiver errado, avise o Marcus e corrija aqui E em `FLUXO-DA-EMPRESA.md`.

Regra de uso: ao mexer num setor, leia aqui as linhas de **recebe** e **entrega** dele. Se a mudança alterar o que passa para outro setor, avise o outro setor (e atualize as duas linhas).

## 1. O caminho principal (resumo em uma linha)
Marketing → Cadastro de revendedoras → Kits novos (Michele) → Representante **ou** Agendamento → Condicionais → Montagem → Bipagem → Atendimento ou acerto → Agendamento (confere dinheiro) → Financeiro (fatura e concilia) → Condicionais (guarda de volta).
O ciclo não para: Cadastro de peças → Produção → Montagem → recomeça.

## 2. Tabela por setor

| Setor (líder) | Recebe de | Entrega para | O que passa |
|---|---|---|---|
| **Marketing** (Julia) e **tráfego pago** (Diego) | Nada (é a origem) | Cadastro de revendedoras | Leads (vêm do tráfego pago) |
| **Cadastro de revendedoras** (Nickolas) | Marketing | Kits novos | Revendedora cadastrada e aprovada |
| **Kits novos e Indicação** (Nickolas; Michele) | Cadastro de revendedoras | Representante **ou** Agendamento | Kit novo: a representante coloca na listagem dela, ou o Agendamento marca o dia para ela vir à empresa |
| **Representantes** (Marcus) | Kits novos (kit novo); Encomendas (reposição) | Condicionais, Montagem, Bipagem, Agendamento | Listagem da representante; acerto feito na rua pelo app; retorno dos kits à empresa |
| **Agendamento** (Ana Maria) | Representantes (kits e dinheiro); Kits novos (marcar o dia); revendedora que vem à empresa | Atendimento interno, Financeiro, Condicionais | Gera a listagem do atendimento interno; confirma o dinheiro e se as condicionais voltaram assinadas; entrega o dinheiro ao Financeiro com **confirmação dupla** (código) |
| **Condicionais** (Majorry) | Financeiro (devolve depois de faturar) | Montagem (antes de montar kit de revendedora que já tem kit) | Peças em condicional. Kit novo **não** pega condicionais (regra de ouro, ver `FLUXO-DA-EMPRESA.md`) |
| **Cadastro de peças** (Rayssa) | Compras e fornecedores (bruto e banho: ver `FLUXO-DE-COMPRA-DE-BRUTO.md`) | Produção | Peças liberadas, com preço sugerido (aprovação no SorellyChat) |
| **Produção** (Deysiane) | Cadastro de peças | Montagem | Peças prontas |
| **Montagem de kits** (Deysiane) | Produção; Condicionais; listagem | Bipagem | Kit montado |
| **Bipagem de kits** (Deysiane; Bipagem e Atendimento de kits) | Montagem (envio); representante e revendedora (retorno) | Financeiro, Garantia/Trocas, Inadimplência | Kit bipado; no retorno, confere o que a representante bipou (nome, pagamentos, brindes, peças do próximo mês) |
| **Atendimento interno** (líder a definir; Leci) | Agendamento (listagem); Bipagem | Financeiro | Acerto bipado (~20 min), novo kit montado com a revendedora, notas de avaliação da revendedora |
| **Financeiro** (líder a definir; Nayale, Bruna, Anamaria) | Bipagem e Atendimento (condicional para faturar); Agendamento (dinheiro) | Condicionais (devolve), Comissões dos setores, Inadimplência | Faturamento; conciliação de pagamentos; pagamento das comissões |
| **Inadimplência** (Amanda) | Bipagem e Financeiro (quem não paga ou falta dinheiro) | Financeiro (conciliação) | Cobrança e resolução do que ficou em aberto |
| **Garantia / Trocas** (Marcus; nome do setor: a confirmar) | Bipagem (peças de garantia dos acertos) | Cadastro de peças ou Produção (a confirmar) | Peças com defeito |
| **Encomendas e reposições** (Agatha) | Representantes e revendedoras internas (pedidos pelo WhatsApp) | Representantes e revendedoras | Peças separadas; reposição levada durante o mês pelo tio João (Facilities) ou separada para o acerto |
| **Facilities** (Marco Antonio) | Encomendas | Revendedoras | Entrega das reposições (tio João) |
| **Compras** (Nickolas; Hellen no link de pagamento) | Cadastro de peças, fornecedores | Financeiro | Pedidos de compra; "Enviar para pagamentos" gera os dados para Pagamentos a fornecedores |
| **RH** (Maria Claudia) | Todos os setores (pessoas, presença) | Todos (acessos por setor), Financeiro (comissões e folha) | Quadro de pessoas, presença, horário, acessos e autorizações |
| **SAC** (Marcus) | Revendedoras e clientes | Garantia/Trocas e demais (a confirmar) | Atendimento ao cliente |
| **Tecnologia** (Marcus; Leonardo e devs) | Pedidos de todos os setores | Todos | Telas, regras e servidor |
| **Diretoria** (Marcus, Nickolas, Lucas) | Todos (vê tudo) | Todos | Decisões, preços de peças, Fluxo da empresa, Comissões e desempenho |

## 3. Dinheiro: confirmação dupla (decisão de 15/10/2026)
Toda vez que o dinheiro troca de mãos, os dois lados confirmam no app, com um código de 4 números:
1. Representante ou bipagem entrega ao **Agendamento**.
2. Agendamento entrega ao **Financeiro**.
O Financeiro tem a aba **Dinheiro** com o que está em cada mão, em tempo real.

## 4. Comissões (planejado)
Todo mundo pode ser comissionado pelas atividades (bipar retorno, atender, montar). Quem tem comissão em dois lugares soma. As comissões de todos aparecem no Financeiro → Comissões. Valores de bonificação do atendimento interno e da bipagem de retorno: **(a confirmar)**.

## 5. De onde vêm os números no sistema
- **DevMaster (ERP)**: revendedoras, faturamento e contas a receber (só leitura; os POST gravam no ERP de verdade e exigem aprovação da diretoria).
- **App Sorelly** (da revendedora e da representante): vendas, clientes, pedidos, garantias, indicações (só leitura).
- **Planilhas e lançamentos à mão**: Amanda lança o faturamento diário; Nickolas lança o "por fora".

## 6. Onde estão os detalhes de cada setor
`docs/setores/<setor>/` (resumo, decisões, pendências, pessoas) e o **Painel de documentos** (`docs/Painel de documentos.html`).
