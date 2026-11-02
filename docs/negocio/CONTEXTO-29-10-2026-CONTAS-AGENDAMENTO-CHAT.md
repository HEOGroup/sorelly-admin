# Contexto de 29/10/2026: contas, Agendamento real, chat por setor, ícone

Resumo do que foi feito e do que ficou aberto. Sem senhas (o repositório é público): as senhas provisórias ficam na tabela `sorelly.conta`, coluna `senha_provisoria`.

## 1. Feito e publicado na master

| Item | Onde |
|---|---|
| Ícone redondo da Sorelly na aba do navegador | `app/icon.png` |
| Sistema instalável no PC e no Android | `app/manifest.js` |
| Botão **Setores** no chat, ao lado do Almoço (todos veem os grupos de setor de que fazem parte; a Direção vê todos) | `components/chat/chat-lista.js` |
| Grupo **Montagem de Kits** (Deysiane supervisora, 10 montadoras, Direção; um ícone por montadora abre a conversa particular) | `domain/chat-store.js` (`grupoMont`, `c_mont`) |
| Controle por representante: botão **Separado \| Junto** | `pages/Agendamento.js`, `domain/agendamento.js` (`agrupar` soma também cada dia) |
| Versões 0.17.23 e 0.17.24 | `domain/versoes.js` |

## 2. Gravado direto no banco (não está no Git)

Módulo `agend` (`sorelly.estado_modulo`), versão 3:
- 29 representantes reais de outubro, com cota e saldo de cada dia (1 a 28), lidos do admin antigo (`acertos_representante`, `acertos_representante_month`, `acertos_representante_daily_balance`), só leitura. Antes o servidor tinha 23 de demonstração.
- Grupos: **Thalita** = Thalita Torazzi (BI) + Thalita Litoral PR (CV). **Anne** = Anne Asley (E2) + Anne PG (EE) + Anne Joinville (EX).
- Regra do Marcus: mesma pessoa, cidades diferentes. Controle separado e junto; relatórios por representante sempre juntos.

Senha da conta `anamariahess` (mãe do Marcus) trocada a pedido dele. A conta `anamaria` é a Ana Maria do Agendamento (nunca misturar).

## 3. Aberto

| Item | Detalhe |
|---|---|
| Acertos do dia 28 | Admin antigo (Ana Maria, 29/10 09:59) = 1.685. Sistema novo (fechamento do Marcus) = 1.652. Marcus perguntou à Ana Maria. Ajustar conforme a resposta. |
| Acertos do mês automáticos | O Painel já lê do faturamento diário (Amanda). A Ana Maria não digita mais. Ela lança só o saldo por representante (dia 29 em diante). |
| Ninguém abriu a tela com o login da Ana Maria | Conferido só no banco. |
| CI do último envio (Separado \| Junto) | Não conferido. Os dois anteriores ficaram verdes. |
| Telas do chat e do botão Setores | Não vistas na tela (o navegador de teste pede login e não se digita senha). Só o build passou. |

## 4. Logins que faltam (23 funcionários, conferido em 01/11/2026)

| Setor | Pessoas |
|---|---|
| Produção (16) | Amanda de Oliveira Silva, Audrieli Maria de Abreu, Crisbele da Silva, Cristiane Silva Soares, Fernanda Natalia Cordeiro dos Santos, Geisimara Melo Batista, Isadora Julia Cordeiro de Franca, Jordana dos Santos Amorim, Katia Danielle Biscoto, Kislieydi Delurdes Moletta, Maria Aparecida Barreto dos Santos, Milene Slivinski de Godoi, Milenna Rafaela de França Chaves, Sandra da Conceição Oliveira Maia, Solange Batista Pires, Viviane Cristina Gomes |
| Facilities (2) | Higor Fernando Goulart de Oliveira, Ines Scupura de Gouvea |
| Encomendas (1) | João Guilherme de Oliveira |
| Equipe direção (1) | Nicole de Oliveira Ferreira |
| Inadimplência (1) | Amanda Thimoteo Coelho |
| Marketing (1) | Beatriz Mascencio Gomes |

Fora da conta: Diego (gestor de tráfego, PJ) e Thalita (representante, usa o app dela). Juan saiu.
Setores completos: Agendamento, Atendimento de kits, Bipagem, Cadastro de peças, Cadastro de revendedoras, Compras, Condicionais, Financeiro, Kits novos, Montagem de kits, RH, SAC, Trocas, Sócios e família.

Perguntas em aberto do Marcus: o que a Produção (16) vê (sugestão: só o SorellyChat, como as outras); criar primeiro os 6 logins pequenos.

## 5. Próximos passos sugeridos

1. Resposta da Ana Maria sobre o dia 28 e ajuste do número.
2. Criar os 7 logins pequenos e a mensagem de boas-vindas de cada um (script no modelo de `scripts/usados-uma-vez/criar-contas-29-10-lote2.mjs`).
3. Grupos de setor no chat para os outros setores (Produção, Trocas, Facilities, Cadastro...), no mesmo modelo do `c_mont`.
4. Opcional: apagar a lógica do Plano 45/60 (exige refazer o pedido de data do app da representante); Ana Maria marcar dia e hora na aba nova de Revendedoras; planilha de links da Hellen.
