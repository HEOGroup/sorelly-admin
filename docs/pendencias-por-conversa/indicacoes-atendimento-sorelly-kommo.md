# Pendências da conversa: Indicações, Atendimento Sorelly e Kommo (17 a 23/11/2026)

Levantamento feito em 23/11/2026, a pedido do Marcus, sem mudar código e sem commit.

## 1. Resumo do que foi feito

1. **Indicações:** menu novo com 5 telas, Histórico com Top 12 e Situação, nomes "Carlos Luan", filtro estável. Importação do app e do admin antigo.
2. **Atendimento Sorelly:** vários comprovantes por conta, condicionais da DevMaster com caixa "Cobrar", chegada da cliente, selo "At. - Nome", tela responsiva, isenção do desconto do brinde por atraso, forma de pagamento da diferença do brinde, chave Pix junto da conta (opção C), alerta de Nova venda só 3 vezes e em faixa fina.
3. **Direcionar:** sem "9 de 9", Avisos do dia com 4 linhas, fonte 11 px, sem o bloco "Pagamentos da Família".
4. **Kommo:** leitura do funil Cadastro (só leitura). Variáveis na Vercel feitas pelo Leonardo.
5. **Outros:** acesso da Priscila (tudo, menos Financeiro e Fiscal), simulação criada e apagada, documento de avaliação externa, análise do sistema.

## 2. Alterações sem commit ou fora da master

| O que | Onde | Estado |
|---|---|---|
| Faixa de Nova venda, Direcionar (4 avisos, 11 px, sem Família), leitura do Kommo (`src/server/kommo.js`, `app/api/kommo/cadastro/route.js`) | Pasta `C:\Users\marcu\Downloads\sorelly-admin\sorelly-admin`, branch `alteracoes-27-10` | **Já estão na master.** Entraram no commit `84228953` de 22/11 ("Guarda o trabalho solto das conversas"). Conferi com `git cat-file` e `git diff` |
| `docs/historico/CONTEXTO-17-18-11-2026-INDICACOES-ATENDIMENTO-KOMMO.md` e `CONTEXTO-PARA-AVALIACAO-EXTERNA-17-11-2026.md` | Só em `C:\Projetos\backup-sorelly-19-11-antes-de-atualizar\docs\historico\` | **Fora da master e fora da pasta de trabalho.** Sumiram na junção de 19/11 |
| Cópias para o Marcus | `C:\Users\marcu\Downloads\`: `CONTEXTO-SORELLY-PARA-AVALIACAO.md`, `PROMPT-LEONARDO-KOMMO.md`, `OPCOES-FINANCEIRO-ATENDIMENTO.html` | Fora do Git (de propósito) |
| Scripts de uso único (importar indicações, testar Kommo, simulação, Priscila) | `scripts/usados-uma-vez/` | Parte foi apagada na junção. Não são commitados |
| Memórias da conversa | `C:\Users\marcu\.claude\projects\C--Users-marcu-Downloads-sorelly-admin-sorelly-admin\memory\` (ex.: `atendimento-condicionais-cobrar-18-11.md`, `kommo-acesso-17-11.md`) | Fora do Git |
| Mudanças no banco real | Tabelas `sorelly.bkp_testes_17_11` (cópia da simulação) e `sorelly.bkp_conta_priscila_19_11` (cópia da conta antiga da Priscila) | Cópias de segurança guardadas |

## 3. Tudo o que ficou pendente

**Pedidos do Marcus não terminados**
1. Itens 2 a 11 da análise da tela do Atendimento Sorelly (só o item 1, os avisos, foi feito): valor do acerto repetido 3 vezes, botão "Comissão antiga", campo "Dias úteis de atraso", lista Hoje agrupada por situação, bloco de Comissões que fecha sozinho, espaço vazio nas etapas, etiquetas redondas, nome cortado no topo, etapas bloqueadas sem cadeado, lista "Falta para finalizar".
2. Forma de pagamento da **diferença do brinde nos acertos comuns** (hoje só o Brinde de indicação tem o campo). Eu avisei e ele não respondeu.
3. Telas Retiradas, Revendedoras e outras de Cadastro de revendedoras no mesmo padrão das Indicações (as perguntas A/B/C ficaram sem resposta).

**Combinados e "depois eu faço"**
4. Ligar o **Kommo** às telas de Indicações e ao funil "Aprovadas" (tabela de tradução das etapas). Provavelmente a conversa "Indicações ao vivo" (commit `93031752`, 19/11) já fez. **Preciso confirmar.**
5. Os 7 itens que recomendei na análise do sistema: ambiente de teste separado, testes automáticos do dinheiro, backup com restauração testada, registro de erros, uma pessoa dona por setor, segredos só no cofre. **Nenhum foi feito.**
6. Restaurar os 2 documentos de contexto do backup.

**Testes não feitos**
7. Chave Pix na tabela do Financeiro: testei só com contas inventadas. Não conferi com as contas reais se a chave está cadastrada.
8. Botão "Marcar agora" (chegada na ficha) e a isenção do atraso com uma cliente real. A isenção foi testada só na simulação.
9. Login da Priscila: não testei (não digito senha). Pode quebrar alguma tela de Diretoria que ela usava.
10. Brinde de indicação com um pedido real aprovado (ex.: Lays Moura Viana Barros) e conferência de nomes com a DevMaster.
11. Caso da Gabrielle que "não apareceu" no Atendimento: a causa provável (falta de busca na DevMaster) foi corrigida, mas **não confirmei** com a Edna.

**Dados e envios**
12. O **token do Kommo foi colado no chat** em 17/11. Recomendo trocar por outro.
13. Mensagens que o Marcus precisava mandar (Natasha, Edna, Kawany, Leonardo): eu entreguei os textos. Não sei se foram enviadas.
14. Resposta da avaliação externa do sistema: o Marcus mandou para outra IA. Não voltou nada para esta conversa.

## 4. Perguntas prontas para o Marcus (máximo 5)

1. **O kit principal já vem marcado em "Cobrar"?**
   - Recomendo **sim** (o principal quase sempre é cobrado).
   - Se sim: a funcionária só marca os extras, e esquece menos. Risco: cobrar um que não devia.
   - Se não: ela marca tudo, mais seguro, mais um clique.
2. **Posso trocar o token do Kommo (foi colado no chat)?**
   - Recomendo **sim**: o Leonardo gera outro e troca na Vercel.
   - Se sim: 5 minutos do Leonardo. Se não: o token antigo continua circulando.
3. **Aplico a forma de pagamento da diferença nos acertos comuns?**
   - Recomendo **sim**: o mesmo erro (cair como Pix) acontece lá.
   - Se sim: mexe numa regra já em uso, testo na simulação. Se não: o erro continua.
4. **Faço os itens 2 a 5 da análise da tela do Atendimento (valor repetido, Comissão antiga, atraso, lista Hoje)?**
   - Recomendo **sim, nessa ordem**: são os que mais atrapalham.
   - Se sim: uma rodada, com conferência na tela. Se não: a tela continua carregada.
5. **A Priscila fica sem Fiscal e com Link de pagamento liberado?**
   - Recomendo **manter assim** (Fiscal tem dados de notas e CNPJs).
   - Se mudar: libero o Fiscal em 1 minuto.

## 5. Esta conversa pode ser arquivada?

**Sim**, com duas ressalvas:
1. Restaurar os 2 documentos de contexto do backup (eles só existem lá). Ou aceitar a perda, porque o resumo está neste arquivo.
2. Confirmar com a Edna se a Gabrielle apareceu depois da correção da agenda.

O que o Marcus mandou publicar **já está na master**. Não há nada solto para subir.
