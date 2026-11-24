# Pendências da conversa "NR-1 / RH / Canal de denúncias" (levantamento de 23/11/2026)

Levantamento só de leitura. Nada foi commitado nem publicado por causa deste pedido.

## 1. Resumo do que foi feito
- Plano da NR-1 da Maria virou tela: RH › Segurança do trabalho (8 ações, atividades, responsável por CNPJ, Ficha por pessoa, alerta de prazo).
- Aba PGR e PCMSO por CNPJ (cada pessoa vê o do seu CNPJ); 6 PDFs carregados (CNPJs 34, 46 e 59).
- Canal de Ética e Denúncias: formulário público `/canal-de-etica`, tela restrita (Marcus e Maria), alerta, consulta por protocolo, anti-robô corrigido.
- Pesquisa de clima anônima `/pesquisa-de-clima` com rodadas e resultado por setor (mínimo 5 respostas).
- Ordem de Serviço (modelo do CNPJ 34) e descrições de cargo anexadas na ação 5; análise da proposta da Flexx para a Axis (CNPJ 67).

## 2. Alterações SEM commit ou fora da master
| O quê | Onde |
|---|---|
| Conserto do alerta de denúncia ("Entendi" vale no servidor, "visto" por pessoa) + Maria lê todas as denúncias | **Worktree `C:\Users\marcu\Downloads\sorelly-admin\sorelly-nr1i`** (sem commit; base `origin/master` 3abe7833). Arquivos: `src/server/denuncias.js`, `app/api/denuncias/visto/route.js` (novo), `src/apps/montagem/components/aviso-alertas.js`, `src/apps/montagem/domain/versoes.js` (v0.21.131), `docs/DECISOES.md`, `docs/setores/rh/decisoes.md`. `npm run conferir` = CONFERIDO. **Push barrado** (o Marcus não disse "publica"). |
| Pasta principal (`alteracoes-27-10`) | Nada meu pendente. O ajuste "Maria lê todas" que estava aqui se perdeu na pasta; foi refeito no worktree acima. |
| Dados gravados no banco (não são código) | PDFs PGR/PCMSO no módulo `sg`; anexo + notas na ação 5 (módulo `rh`); denúncias de teste encerradas como "Concluída" (6); 2 rodadas e 1 resposta de teste da pesquisa de clima; senha da conta `marcoantonio` trocada a pedido do Marcus. |
| Scripts de uso único | Pasta de rascunho da sessão (fora do repo). Nenhum precisa ser guardado. |

## 3. Pendências (tudo o que ficou)
Publicação
- Publicar o conserto do alerta + Maria lê todas (aguarda "publica").
- Conferência do GitHub (`verificar`, fotos de referência) está vermelha há dias; só aprovando fotos novas.

Axis (CNPJ 67)
- Proposta Flexx 0280/2026 (R$ 1.350 PIX / 12x R$ 135; excedente R$ 10,90; OS, treinamentos e função nova cobrados à parte). O Marcus acha que foi fechada: **confirmar**.
- Falta o PGR e o PCMSO da Axis anexados na aba PGR e PCMSO (13 funcionários).
- Perguntas à Flexx sem resposta registrada: prazo de entrega, excedente por mês ou ano, preço da Ordem de Serviço, função (R$ 140), manual psicossocial (R$ 350), renovação e multa.
- Ação 1 (PGR e PCMSO) venceu em 20/11 e está **atrasada**: mudar o prazo ou concluir.

Ordem de Serviço e EPI
- Modelo do CNPJ 34 tem erros (instrução 21 fala de desossa de carne; "Riscos ambientais" sem riscos). O técnico precisa corrigir.
- Falta OS do Auxiliar de Produção e dos CNPJs 46, 59 e 67.
- Tela para gerar a OS de cada pessoa **não foi criada**.
- Ação 2 (EPIs): decidir se vira "não se aplica" (a empresa não usa EPI; O Marcus validou que a página de EPI fica sem marcação).
- Ficha de EPI ligada ao Compras: não feita.

Canal e pesquisa
- Maria nunca testou com o login dela marcando "Sim" (só o teste de 19/11 que chegou).
- Divulgar o link do canal e da pesquisa de clima; abrir a rodada oficial.
- Apagar de vez as denúncias e rodadas de teste.
- Itens da análise que **não foram feitos**: registro de quem abriu a denúncia, prazo de guarda dos dados (LGPD), limite de envio guardado no banco, link curto e QR para cartaz, uma resposta por pessoa na pesquisa.
- Formulários testados só no computador; falta teste no celular.
- O técnico e o contador precisam confirmar se o canal e as perguntas da pesquisa atendem a NR-1.

Equipe e dados
- Confirmar o CNPJ de Taynara, Letícia (duas) e Ana Beatriz (veem "Fale com o RH").
- Lucas lançar no Fiscal a receita acumulada do CNPJ 34 (R$ 3.010.903,71 em 19/11; limite estadual R$ 3,6 mi). Perguntar à contabilidade se a soma das empresas do grupo entra.
- Aviso para a equipe sobre a aba PGR e PCMSO: Marcus e Maria enviam.

## 4. Perguntas prontas para o Marcus
1. **Posso publicar o conserto do alerta + Maria lê todas?** Recomendo sim. Se não: o alerta pode voltar em outros aparelhos e a Maria continua sem ler as marcadas "Não" (hoje só lê as "Sim").
2. **Qual a data de entrega do PGR/PCMSO da Axis?** Recomendo mudar o prazo da ação 1 para essa data. Se concluir a ação 1 sem a Axis, o sistema deixa de cobrar a Axis.
3. **Ação 2 (EPIs): marco "não se aplica"?** Recomendo perguntar ao técnico por escrito antes. Se sim: some o alerta e as 6 atividades de EPI perdem o sentido.
4. **Apago as denúncias e rodadas de teste?** Recomendo sim, depois do teste da Maria. Apagar some o histórico de teste (não há denúncia real ainda).
5. **Crio a tela de Ordem de Serviço por pessoa agora?** Recomendo esperar o técnico corrigir o modelo. Fazer antes gera OS com erro para 13+ pessoas.

## 5. Pode arquivar?
**Não ainda.** Falta: publicar o worktree `sorelly-nr1i` (ou o Marcus decidir descartar), a confirmação da Flexx/Axis e as respostas acima.
