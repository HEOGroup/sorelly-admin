# Pendências · conversa "Prestadores, comprovantes da Karine e Contas a receber" (19/11/2026)

Levantamento pedido pelo Marcus (via sessão Cadastro Kommo). Só leitura: nenhum código mudou por causa deste pedido.

## 1. O que foi feito
- Regra "Pix para fornecedor: do Direcionar ao Contas a pagar" e a junção do pacote Pix adiantado (v0.21.61 a 0.21.67): publicados na master (commits 58ab62f e f729a13).
- Financeiro familiar › Cadastro de prestadores refeito (3 colunas, Editar em cartão, "Quem pagou" em 1 a 2 nomes, bloco "Contas de prestadores" removido, finalizados fechados). Greicy padronizada, 68 Gang conferido (pago R$ 33.669,86; falta R$ 3.000,00), acertos de Tenda, Diego, Julia, Lucas Castilho, Ulisses, Rebel Mode e Truck Plaza (excluído, com cópia).
- 3 comprovantes da Karine anexados nos Pix (R$ 1.000,00, R$ 634,55, R$ 150,00) e 2 do Atendimento (Ana Barbara R$ 720,20; Thaina R$ 499,80). Gravados no banco REAL (tabela de anexos + chave `compKey` no Pix).
- Contas a receber refeita como clone da Contas a pagar (`/contas-a-receber`), com coluna Comprovante ligada ao Atendimento interno (36 ligados em novembro). Testada no painel local.

## 2. Alterações SEM commit (pasta `C:\Users\marcu\Downloads\sorelly-admin\sorelly-admin`, branch `alteracoes-27-10`)
Minhas (Contas a receber):
- Novos: `src/apps/montagem/pages/ContasReceberLista.js`, `src/apps/montagem/domain/comprovantes-receber.js`.
- Alterados: `src/router/rotas.js`, `src/server/contas-receber.js`, `app/api/contas-receber/titulos/route.js`, `src/apps/montagem/domain/versoes.js` (v0.21.68), `docs/DECISOES.md`, `docs/setores/financeiro/decisoes.md`.
- `src/apps/montagem/pages/ContasPagarLista.js`: só a linha de `export` (outras sessões também mexem nele; conferir o diff antes de subir).
Fora do Git (só neste PC): `docs/dados-locais/financeiro/BACKUP-TRUCK-PLAZA-19-11-2026.local.json`. Scripts de teste ficam na pasta temporária da sessão (não no repositório).
Não são meus (outras conversas): `BonusMontagem`, `FilaMontagem`, `AcessosPessoas`, `ProdEditorDia`, `tabela-planilha.js`, `setores.js`, `slugs.js`, `Caixa.js`, `DirecionarPix.js`, `Painel.js`, `pf/Resumo.js`, `contas-empresa.js` e outros.
Dados no banco real: 5 anexos de comprovante e o `compKey` nos 5 Pix. Já aplicados, sem desfazer automático.

## 3. Pendências
1. Subir a Contas a receber na master: espera o "Sim, sobe" do Marcus.
2. `npm run conferir` NÃO foi rodado. A trava de padrão reprova `BonusMontagem.js` (de outra conversa), então o conferir vai falhar até essa conversa arrumar.
3. Clique em "Ver" (abre a imagem) não foi testado num navegador real: o painel bloqueia janelas. O arquivo é lido certo (foto e PDF).
4. Marcus precisa validar na produção: valor sublinhado nos prestadores e na Contas a pagar (comprovante da Karine); acerto que já vem com o Pix adiantado.
5. Bônus Diego: quitado, mas ainda "em aberto". Falta finalizar e ocultar (aguarda o ok).
6. Pergunta aberta: os 2 Pix da Mayara (R$ 1.827,60, Pontual, 16/11): 2 pagamentos ou 1 repetido? (O caso é o que ficou "em dúvida" na ligação.)
7. 7 comprovantes do Atendimento são PDF e não entraram na importação para o familiar. Na Contas a receber, PDF já aparece.
8. Contas a receber sem botão "Anexar": Pix do Atendimento sem comprovante só mostra "Falta anexar".
9. Tela antiga `/contas-a-receber-resumo` ficou sem entrada no menu. Decidir: manter, pôr no menu ou apagar. O "Resultado do mês" ainda importa `Lw` dela.
10. Pasta principal `sorelly-admin` está atrasada em relação à master (perguntei se o Marcus quer que eu atualize; sem resposta).
11. Financeiro familiar: 8 parcelas do Itaú Black e outras pendências em `docs/setores/financeiro/pendencias.md`.
12. Memória do projeto: ainda NÃO anotei o clone da Contas a receber nem a regra "comprovante do Atendimento pertence à Contas a receber".
13. Limites da Contas a receber: o primeiro mês lido demora (DevMaster); "Todos os períodos" lê só o ano de hoje; a tela mostra 100 linhas por página.
14. Não testado: celular/janela estreita da tela nova, e muitos titulares na visão Total.

## 4. Perguntas para o Marcus (ordem de importância)
1. Posso subir a Contas a receber na master?
   - Recomendo: sim, depois que o conferir passar (precisa da outra conversa arrumar o `BonusMontagem`).
   - Se não: fica só neste PC e some do alcance das outras pessoas.
2. A tela deve abrir em "Todas" ou "A receber"?
   - Recomendo: "Todas" no mês atual (é onde estão os comprovantes).
   - "A receber" abre com 802 acertos-loja antigos primeiro (desde 2022).
3. O que fazer com a tela antiga (mapa do dinheiro)?
   - Recomendo: manter oculta por enquanto.
   - Apagar quebra o "Resultado do mês". Pôr no menu cria um item a mais.
4. Quer botão "Anexar" na Contas a receber para o Pix sem comprovante?
   - Recomendo: sim, mas só depois da pergunta 1.
   - Sem o botão, quem anexa continua sendo a funcionária no Atendimento.
5. Posso finalizar e ocultar o Bônus Diego (quitado)?
   - Recomendo: sim.
   - Se não: ele continua aparecendo como dívida em aberto.

## 5. Pode arquivar?
Não. Falta: (a) o "Sim, sobe" e o conferir passar; (b) o Marcus abrir a produção e confirmar o valor sublinhado; (c) respostas das perguntas 2 a 5.
