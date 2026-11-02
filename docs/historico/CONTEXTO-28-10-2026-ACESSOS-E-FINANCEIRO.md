# Contexto de 27 e 28/10/2026: acessos, contas e Financeiro automático

Documento de passagem para as próximas conversas. **Repositório público: aqui não há senhas nem valores da empresa.** Logins e senhas provisórias: `CONTAS-E-SENHAS-28-10-2026.local.md` (só neste computador).
Complementa `ACESSOS-E-CONTAS-28-10-2026.md` (acessos), `ALINHAMENTOS-FINANCEIRO-28-10-2026.md` (Financeiro) e `docs/DECISOES.md`.

## 1. O objetivo do dia
Abrir o sistema novo (Vercel, `sorelly-admin.vercel.app`) aos funcionários, setor por setor. Regra do Marcus: **só liberar para os outros quando os primeiros estiverem bem.** Hoje liberados: Diretoria, Priscila, Nayale, Anamaria (mãe) e a Tamara. Bipagem, montagem, encomendas, Ana Maria e Mariana têm conta, mas **não foram avisadas**.

## 2. Pessoas: cuidado com os nomes
| Nome | Quem é |
|---|---|
| **Anamaria** (pessoa 29) | Mãe do Marcus, sócia. Login `anamariahess` |
| **Ana Maria** (pessoa 24) | Funcionária do **Agendamento**. Login `anamaria`. **Não** é a mãe |
| Priscila (37) | Secretária do Marcus |
| Leonardo (44) | Desenvolvedor, acesso total |
| Nayale (27) | Financeiro |

## 3. Grupos de acesso (menu)
| Grupo | Quem | Configuradores |
|---|---|---|
| **Acesso total** | Marcus, Nickolas, Priscila, Leonardo | Vê |
| **Direção** | Anamaria, Lucas, Maria Claudia, Amanda de Miranda, Marco Antonio, Ana Beatriz | Não vê |
| Demais | Supervisão, Agendamento, Financeiro, Bipagem, Montagem, Listagens, Kit novo, Cadastro de peças | Só o que é do setor |

- Só o menu mudou; as ações (papel) seguem como antes. Código: `grupoDe` em `domain/equipe.js`; rótulos em `navigation/perfis.js` e `domain/equipes.js`; lista "Atuar como" em `components/seletor-acesso.js`.
- **O menu da conta (coluna `abas`) só RESTRINGE o menu do grupo. Não acrescenta telas.** Para dar uma tela nova a uma pessoa de um grupo restrito, ela tem de estar também em `ABAS_PERFIL[grupo]` (`navigation/perfis.js`).
- Cada conta pode ter `grupo`, `cid` (contato do chat) e `nome` próprios. Conta de pessoa fora da lista de `EQUIPE` recebe só o básico.
- Autorizações de ação (`domain/autorizacoes.js`): Nickolas e Priscila têm as mesmas 7 do Marcus. **Financeiro da família**: Marcus, Lucas, Anamaria e Priscila (`ACESSO_FF` e `financeiro_familia`); o Nickolas **não**.
- "Atuar como outra pessoa" e página Apps: só Marcus, Nickolas e Lucas.
- Montadora e bipadora abrem direto no SorellyChat. "Admin antigo" só aparece para perfil ADMIN.

## 4. Financeiro: o que é automático
| Dado | Como | Onde no código |
|---|---|---|
| Contas a pagar (títulos em aberto) | Lido da DevMaster a cada 10 min | `src/server/contas-dm.js`, rota `/api/contas-dm`, `lib/contas-dm.js` |
| Contas pagas por CNPJ | DevMaster, **CNPJ pela conta bancária** | `cnpjDaConta` em `contas-dm.js`; ação `CONTAS_DM` no reducer |
| Revendedoras e faturamento do dia | DevMaster | módulos `revdia` e `fatdia` |
| **"Por fora"** | **O Nickolas lança no sistema** (era uma planilha). A DevMaster NÃO preenche | reducer `CONTAS_DM` só mexe nos CNPJs 34/46/59/67 |
| Saldos das contas bancárias | **A Nayale lança** (a DevMaster tem saldo zero em todas as contas) | módulo `sc` (`s.saldosContas`) |
| Pagamentos a fornecedores | Planilha importada; Lucas e Nickolas testam lançando no sistema e na planilha | módulo `pf` |

Regras decididas:
- **CNPJ das contas pagas = pela conta bancária** (nome da conta termina em 34/46/59/67, ou Axis = 67, Serenity = 59, Comércio = 46, Atacadista = 34). Caixa e contas pessoais = "por fora". Exceções: "Hess e Oliveira" = por fora; "Limite Rotativo" = 34. De 28/10 em diante vale a DevMaster; antes, o dia que já tem valor fica como está.
- **Previsões de 2027 ficam na filial da DevMaster** (a Nayale confirmou que são lançadas por filial de propósito). Só para vencimento até 31/12/2026 vale o CNPJ que o Marcus conferiu (módulo `cpfil` no banco).
- Em 1 a 27/10, comparado ao admin antigo: 55 de 80 células por CNPJ iguais. O resto vem de pagamentos feitos pela conta de um CNPJ para título de outro.

## 5. Módulos novos no servidor (tabela `sorelly.estado_modulo`)
| Módulo | Conteúdo | Quem abre |
|---|---|---|
| `ri` | Revendedoras do atendimento interno (`s.revInternas`): 203, 60 já com agenda | Agendamento |
| `pfmes` | Resumo do mês dos fornecedores (planilha, aba RESUMO MÊS) | Financeiro |
| `sc` | Saldos das contas bancárias (`s.saldosContas`): 31 contas, 90 datas de 31/12/2024 a 28/10/2026 | Financeiro |
| `cpfil` | CNPJ conferido de cada título a pagar | só Diretoria |
| `pf` | Pagamentos a fornecedores (versão 6; Pix e passadas de cartão importados) | Financeiro |

Como o espelhamento funciona: `lib/sync-modulos.js` (`ESPELHO`) monta a "fatia" do módulo com chaves de primeiro nível do estado; o reducer `SYNC_MODULO` devolve a chave ao estado. Limitação: grava a chave inteira; duas pessoas editando ao mesmo tempo, vale a última gravação.
**Tabelas de backup criadas:** `estado_modulo_bkp_pf_28_10` e `estado_modulo_bkp_sc_28_10`.
Script para atualizar o resumo dos fornecedores: `node --env-file-if-exists=.env.local scripts/planilha-fornecedores.mjs "caminho.xlsx"` (grava o arquivo local e o módulo `pfmes`).

## 6. Pendências abertas
| # | Item | Quem decide |
|---|---|---|
| 1 | **Financeiro novo ainda NÃO está igual ao antigo.** Nayale e Anamaria devem só COMPARAR por 1 a 2 dias. Faltam: saldo de fim de mês, divergência de saldo, reabrir mês fechado, "Recebido do dia" automático, Carregar automático | Claude e Marcus |
| 2 | Dados reais ainda só no computador do Marcus (`*.local.js`): faturamento por dia, recebido, link de pagamento, financeiro familiar e outros. **Na Vercel esses blocos aparecem vazios** | Claude (levar para módulos do servidor) |
| 3 | Lucas: senha desconhecida (conta já existia). Gerar nova ou ele avisar | Marcus |
| 4 | Pagamentos a fornecedores: Mega Sul, Fernanda Yamin, data `28/09/0202` ilegível (fica de fora até saber o dia) | Marcus |
| 5 | Tatiane Sora (Pontual, 15/09) e Larissa Najila (Point, 11/09): só existem no sistema, não na planilha. Saem ou ficam? | Marcus |
| 6 | Bônus do Nickolas de setembro: criar pedido? | Marcus |
| 7 | Fornecedores sem cadastro: compra de cadeiras, Eloana (tintas), Madalosso, Madeira Cor (e vários de meses antigos) | Marcus |
| 8 | Planilha: 5 datas com erro de digitação e 2 linhas repetidas da Pamella (pedido ao Lucas) | Lucas |
| 9 | **50 títulos de 2026** em que a filial da DevMaster difere do CNPJ conferido: usar a da DevMaster? | Marcus |
| 10 | Empréstimo Itaú Imobiliário com vencimento em 2042: está certo? | Marcus |
| 11 | "Caixa 59": criada no sistema com limite zero; não existe no antigo nem na DevMaster. Qual banco e limite? | Nayale |
| 12 | "Pagamentos para conferir" (bloco do Dashboard) ficou fora do menu da Nayale | Marcus |
| 13 | Bloco **Atendimento interno › Revendedoras**: 143 sem data de agenda ("Aguardando") | Marcus |
| 14 | Chat: limitar quem as funcionárias veem (hoje veem a Diretoria); aviso de LGPD sobre conversas guardadas no banco | Marcus |
| 15 | Regras de permissão no servidor (aprovar, retornar kit, definir valor, retirar): "Fase C" | Claude |
| 16 | Topo do celular cortando o nome; "condicionais" ainda na lista da bipadora; celular simulado sem Gabrielly e Maria Eduarda | Claude |
| 17 | Registrar este trabalho em `domain/versoes.js` (só há a versão 0.17.0 de acessos) | Claude |
| 18 | Segurança: backup diário, nuvem, registro de quem fez o quê, login real | Leonardo |

## 7. Mensagens e materiais já entregues ao Marcus
- Tutorial animado "Como atualizar os saldos": `docs/tutoriais/atualizar-saldos.html` e cópia em `Downloads\Como atualizar os saldos - Sorelly.html`. Valores de exemplo; **desenhado, não gravado do sistema rodando.**
- Planilha de pendências na DevMaster: `docs/negocio/PENDENCIAS-DEVMASTER-NAYALE-28-10-2026.local.xlsx` (**aba 1 ficou desatualizada**: as 184 "filial errada" de 2027 estavam certas).
- Mensagens copiáveis (em WhatsApp, com `*negrito*` e emojis) para: Nayale (acesso, rotinas, saldos, pedido de correção), Anamaria, Nickolas, Priscila, Tamara, Lucas e Nayale sobre pendências. Foram dadas na conversa; o Marcus envia.
- Estado das correções na DevMaster pela Nayale: **GRA 34 (ano 0026) corrigido**. Os pedidos de filial (SAL, VAL, CCS, VR) foram **retirados**: estavam certos.

## 8. Como trabalhar aqui (aprendizados)
- **Publicar:** pasta limpa com `git worktree add --detach ../../sorelly-X origin/master`, aplicar a mudança com script que falha se o trecho não existe, `mklink /J node_modules` para o do projeto, copiar `.env.local`, `npm run lint`, `npm run conferir` (precisa dizer CONFERIDO), commit com a linha Co-Authored-By, `git push origin HEAD:master`, depois `cmd //c "rmdir node_modules"` **antes** de `git worktree remove --force` (senão apaga o node_modules do projeto). Conferir `node_modules/next/package.json` no fim.
- A árvore principal tem trabalho em andamento de outras conversas: por isso o deploy sai da pasta limpa.
- O classificador de permissões **bloqueou um `git push` uma vez**; o Marcus autorizou depois ("faça commit e push na main de tudo").
- **Não digitar senha no site de produção.** Testar logins na porta 3000 (só o Marcus liga o servidor; ele cai com frequência). Sem o servidor ligado, conferir pelo banco.
- Importações grandes: **delegar a um agente**, com backup antes, simulação, conferência contra o resumo e depois gravação idempotente.
- O banco do admin antigo se lê pelo MCP `consultar` (somente SELECT, 500 linhas). O banco do sistema novo e a DevMaster se leem por scripts Node com `.env.local`.
- Arquivos podem ter `\r\n`: nos scripts de edição, ache o trecho por `indexOf` curto.

## 9. Como o Marcus quer as mensagens
- **Curtas.** Ele disse da Nayale: "ela é tonga, fala mais resumido". **Uma coisa de cada vez**, específica (título, fornecedor, valor, o que está errado e o que é o certo).
- Em formato WhatsApp: `*negrito*` e emojis. Sempre num bloco de código para copiar.
- **Erro de dado se corrige na origem (DevMaster)**: o sistema lê sozinho e se acerta. Não pedir correção sem ter certeza (um pedido meu estava errado).
- Ele quer **tudo automático**. Quando algo ainda é manual, dizer qual e por quê.
