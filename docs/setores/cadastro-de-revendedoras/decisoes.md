# Cadastro de revendedoras: decisões

Cópia fiel das decisões do diário geral (`docs/DECISOES.md`) que falam deste setor, da mais nova para a mais antiga. Gerada em 01/11/2026 por palavras-chave: se uma decisão estiver no setor errado, avise.
O texto é o original. O número depois do título é a linha no diário. Blocos que misturavam assuntos foram divididos item por item e aparecem como (trecho). Decisão nova entra no diário geral E aqui, no mesmo dia.

## 29/10/2026 (Kits novos · kit direcionado só aparecia 1 de 9)  (diário, linha 120)
- **Relato da Michele:** pediu 9 kits novos para a Jessica Tobias e só 1 apareceu. **Causa:** a ponte do app Kits novos gravava o kit só no navegador de quem pediu (`localStorage`); outro aparelho nunca recebia. **Correção:** novo módulo do servidor `kn` (uma chave `k_KN<id>` por kit, todo mundo logado lê e grava; a Michele cria o módulo sozinha). `direcionarParaRepresentante` e `registrarRecusa` também enviam ao servidor; `s.novas` e `s.kn` se espelham (`espelharKn` em `state/store.js`; `SYNC_MODULO kn` no reducer). Pendente: testar com a Michele e a Jessica em aparelhos diferentes depois do envio ao servidor; a mudança de status feita no app da representante volta ao servidor pelo espelho.

## 27/10/2026 (trecho)  (diário, linha 195)
- **Correção do acesso da Camilly e usuário sem espaço (Marcus, 27/10/2026):** a conta dela estava ligada ao id 46 (da planilha do RH), que NÃO está na lista de pessoas do sistema (`domain/equipe.js`); o menu caía no padrão "sócios, acesso total". Agora: pessoa fora da lista só vê Início, Rotina e Chat; Camilly é id 45 (grupo da Michele); Leonardo é id 44 (acesso total). Login sem espaço: `nickolas`, `lucas`, `leonardo`, `michelebrito`, `camillysousa`. Regra: ao criar conta de alguém novo, primeiro colocar a pessoa na lista do sistema.

## 24/10/2026 (trecho)  (diário, linha 229)
- **Fase 3 do Plano 45/60 pronta, exceto o que depende de outros (24/10/2026):** tela Mensagens (20 mensagens, `domain/plano45-60-mensagens.js`, `pages/Plano4560Msgs.js`); alertas `p45_contato` e `p45_venda` (`p45Alertas`, conferidos em App.js a cada 10 min, um por tipo por dia); Painel do plano lê a fila dos Kits novos (`lib/fila-kits-novos.js`, só leitura, chave do localStorage do app Kits novos). **Falta:** Kits novos ainda não mostra o plano nem o teto por representante (bloqueio de carteira); alerta de representante sem lista no horário; servidor sincronizar (`p45` no `sync-modulos.js`, Leonardo libera no servidor); a Letícia (pós-venda) como usuária do sistema.

## 24/10/2026 (trecho)  (diário, linha 229)
- **Fase 3 do Plano 45/60, o que já foi:** parâmetros no Configurador geral e aviso de pedido novo. **Falta:** biblioteca das 20 mensagens, alertas de aprovada sem contato em 24 h e nova data sem venda, e ligação com a fila de Kits novos.

## 16/10/2026 (trecho)  (diário, linha 310)
- **Fluxo por etapas = Kanban** (aprovação de cadastros, kits novos, indicações, resgates); cartões arrastam entre colunas e têm "Concluir etapa". Nada de lista longa descendo com dropdown. Quando abrir um registro, informações em **colunas lado a lado** e o que já foi preenchido "passa para o lado".

## 16/10/2026 (trecho)  (diário, linha 310)
- Kits novos: quadro kanban + modos Planilha, **Representantes** (controle de quantos kits novos cada uma pegou) e **Entregues**; sem a fileira de chips de etapas.

## 16/10/2026 (trecho)  (diário, linha 310)
- **Recusas de kit novo** têm que ficar **registradas**: botão "Recusou" nos Kits novos (motivo e data), conta por representante e por mês; com 2 recusas a representante deixa de receber kits novos.

## 16/10/2026 (trecho)  (diário, linha 310)
- **Cadastro de revendedoras enxuto**: Base de revendedoras, Aprovação de cadastros, Desempenho do cadastro (métricas, funil, campanhas/Meta Ads, origem, registros), Indicações, Avaliações, Kits novos. Configuradores só no Configurador geral. Total de revendedoras fixo na barra do Financeiro, Agendamento e Cadastro; **o Marcus lança** o total diário na Visão geral.

## 16/10/2026 (trecho)  (diário, linha 310)
- Regras da avaliação das representantes saíram do Configurador e ficam em Avaliações. Estrutura de Avaliações sugerida: representantes (pelas revendedoras e pelo sistema), montagem de kits, funcionários (pelos supervisores).

## 16/10/2026 (trecho)  (diário, linha 310)
- Kommo (CRM), Meta Ads e app da revendedora ainda não estão ligados: leads, campanhas, indicações e resgates entram à mão até o Leonardo ligar. Dados reais só em arquivos `*.local.js` (gitignored; repositório é público).

## 26/10/2026 · Cadastradas só quando o cadastro terminou (relato da Michele)  (diário, linha 1183)
- Relato: no Admin de produção aparecem como "cadastradas" (e com kit atrasado) revendedoras cujo lead no Kommo ainda está em "conferência de documentos", e que não constam na planilha de kits novos.
- Critério certo: só conta como Cadastrada quem chegou na ÚLTIMA etapa do cadastro. Aprovada ou em conferência de documentos NÃO é cadastrada. O prazo de Kits novos conta do dia em que o lead entrou em Cadastradas, não da criação do lead nem da aprovação.
- Neste sistema novo (sem Kommo): `lib/entrada-cadastro.js` já só traz leads com `desempenho "cadastradas"` e aprovados; agora o prazo usa só `etapaCriadaEm` (sem a data de aprovação). A integração com o Kommo do Admin de produção é do Leonardo: ver o texto de pedido dado ao Marcus.

## 27/10/2026 · Teste do novo fluxo: Representante Kit Novo (proposta do Nickolas)  (diário, linha 1236)
- Valores definidos pelo Marcus: entrega do kit **R$ 25** (era R$ 20) + gasolina; no **1º acerto** da revendedora a Rep. Kit Novo leva **2%** e a Rep. Acerto **6%** (soma 8%); do 2º acerto em diante a Rep. Acerto leva 8%. Gasolina no mesmo esquema das outras representantes. Representante Kit Novo do teste: **Jessica Tobias**.
- Feito (Fase 1 a 3): valores no Configurador de comissões (`nf` em `domain/comissoes.js`, bloco "Novo fluxo"); chave liga/desliga; lista de revendedoras marcadas com a Rep. Kit Novo; R$ 25 na entrega; 2% + 6% só no 1º acerto (`nfPrimeiros`). Só vale para revendedora marcada.
- Falta: botão Desistência (hoje só o campo `desistencia` do kit zera o R$ 25), etapa Suporte e Representante Acerto, aviso à Michele no 3º dia, ciclo de pagamento próprio (dias 11, 21 e 1º) e os controles do Nickolas.
- Testado na tela (Comissões): Larissa Almeida marcada: 1º acerto de R$ 1.594,80 deu R$ 95,69 (6%) à Rep. Acerto e R$ 31,90 (2%) à Jessica Tobias; a entrega de R$ 25 apareceu na Jessica Tobias.

## 27/10/2026 · Em espera (o Marcus pediu para deixar para depois)  (diário, linha 1245)
Foco agora: novo fluxo do kit novo (Representante Kit Novo, proposta do Nickolas). Ficam PARADOS, sem decisão nova:
- **Financeiro/Pix:** aviso de Pix novo no admin (estilo Kiwify), visual novo em Pix representantes, Comissões e Controle de pagamentos, confirmar R$ 7.000 como "valor fora do normal", teste do valor alto na tela.
- **Mapa das representantes:** falta Nagela (região e horário), Rayssa (região), Leticia Moroz e Mariana (horário); "posso atender mais", datas indisponíveis (Dayanne em novembro, Jessica Tobias 12 a 15/11) e rota por dia (Thalita) só em observação; viagens ainda não afetam a indicação; quem viaja em cada data.
- **Organização:** mensagem ao Leonardo sobre hooks e regras obrigatórias, mover `MAPA-DAS-REPRESENTANTES.md` para `docs/negocio/`, apagar o `DECISOES.md` da raiz, commit do trabalho de hoje que ainda não está no git.
- **Cadastradas:** pedido ao Leonardo para corrigir o critério no Admin de produção (Kommo, conferência de documentos).
- **Mensagens prontas:** escolher o modelo padrão de apresentação ao aceitar o kit; lembrete diário no app da representante.

- 27/10/2026, painel da aba Cadastro: Marcus aprovou o layout A (faixa de números + 3 listas: cidades, faixa etária, tempo de casa). Tempo de casa vai até mais de 5 anos. Cidades de viagem (Ponta Grossa, Joinville, litoral de SC) aparecem na lista de cidades; bloco próprio de viagens ficou como opção (E) e não foi feito.

- 27/10/2026, Revendedoras: as 3 telas (Cadastro, Kits e vendas, Contas a receber) são palavras do menu do setor (MENU_REVENDEDORAS em setores.js), com endereços /revendedoras-ativas, /revendedoras-kits-e-vendas e /revendedoras-contas-a-receber. A página não tem mais título nem abas no alto.

## 28/10/2026 · Novo fluxo do kit novo: respostas do Nickolas e aba Kit novo  (diário, linha 1420)
- Nickolas confirmou: 2% e 6% só no 1º acerto (do 2º em diante só a Rep. Acerto, normal); a Rep. Kit Novo recebe nos MESMOS dias das outras (1, 11 e 21), sem ciclo próprio; o teste vale para TODAS as revendedoras novas de Curitiba; Suporte Revendedora Nova: sem nome definido (interna ou nova contratação).
- Em aberto: DATA de início (a partir de quando solicitar kits no novo formato; a Michele organiza a rota depois), quem é o Suporte.
- Feito: aba **Comissões › Kit novo** (`pages/ComissoesKitNovo.js`) e botão Desistência (`COMIS_DESIST` no reducer; campo `desistencia` do registro do kit).
- Testado só no cálculo (Node, dados de exemplo): entrega R$ 25 à Jessica Tobias; no 1º acerto de R$ 1.000: Rep. Acerto R$ 60 (6%) e Jessica Tobias R$ 20 (2%); 2º acerto R$ 80 (8%); revendedora fora do teste R$ 80; desistência zera o R$ 25. A TELA não foi aberta (servidor desligado).

- 28/10/2026, dívida antiga de acerto - loja: a Amanda de Miranda (cobrança, desde 09/2025) respondeu como o setor trabalha (régua de 2-3 dias e 5-7 dias, negativação no Serasa com nota promissória, acordo analisado caso a caso, desconto fora do padrão com Nickolas ou Marcus, sem prazo fixo para considerar perdida). Dívidas de 2022 e 2023 não têm registro organizado; 2024 e 2025 têm planilhas. Resumo completo em docs/negocio/JURIDICO-COBRANCA.md. Próximo passo possível: ficha por devedora ligada ao bloco Dívida antiga da tela Contas a receber.
- **Conversa (Marcus, 28/10/2026):** cada solicitação é um chat. Ctrl+V cola o print no formulário e na conversa. Quem pediu e a Diretoria/Desenvolvimento escrevem mensagens; cada mensagem é uma chave própria `c_<pedido>_<id>` no módulo `mel` (assim ninguém sobrescreve ninguém). Isso substituiu o campo único "Respostas".
