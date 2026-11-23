# Pendências da conversa: Material gráfico, Kits, Estoque e acesso da Geovana
Levantamento de 21/11/2026. Só leitura: nada de código mudou neste levantamento.

## 1. O que foi feito
- Setor **Material gráfico** (Painel em kanban, Compras, Tabela de preços, Estoque, Kits). Está na master (commits `b8941ad`, `3e1c5f9`, `29dec08`; versões 0.21.5 e 0.21.23).
- Nomes dos materiais padronizados (Item, Modelo, Tamanho, Cor, Linha). Duplicados marcados. Orçamento 2583 (bolsinha de Natal creme, 4.000) lançado no funil.
- Aba **Kits** (18/11): uma linha por kit, foto inteira, itens e quantidade. Kit Preto e Dourado fundo de madeira = 32 prontos. Kit com prata = 13 prontos. Dados vindos da Amanda.
- Grupo de acesso novo **"Estoque de materiais"** (só as 2 telas de Estoque). Conta `geovana` passada para esse grupo. A senha provisória foi entregue ao Marcus no chat (não está neste arquivo).
- Entrada no estoque do que o Edson entregou em 19/11 (envelope 4.000, tag Man conjunto azul 10.000, Choker verde 5.000, Kids rosa 5.000, bloco garantia 50). Pedido 164 ficou "Recebida em parte".

## 2. Alterações sem commit ou fora da master
| O quê | Onde | Situação |
|---|---|---|
| `scripts/usados-uma-vez/entrada-material-edson-19-11.mjs` | pasta principal `sorelly-admin` | Já rodado (gravou versão 1017 do módulo `ce`). Não commitado. Pode ser apagado ou commitado como registro. |
| `docs/setores/material-grafico/levantamento.local.md` | só pasta principal | Gitignored de propósito (preços e contagens). |
| `src/apps/montagem/navigation/perfis.js` (e outros) | pasta principal, branch `alteracoes-27-10` | Têm edições de outras conversas sem commit. A parte do grupo "estoque" JÁ está na master. |
| Worktree `sorelly-grafico` | `C:\Users\marcu\Downloads\sorelly-admin\sorelly-grafico` (detached em `29dec08`) | Igual à master. Falta remover (ver item 5). |
| Banco (módulo `ce`) | produção | Entradas de estoque de 19/11, pedido 164 recebido em parte, `acessos.estoque["50"]` alterado (ver pendência 1). |

## 3. Pendências
**Dados e permissões**
1. **Permissão "Aprovação" da Geovana (pessoa 50) tirada por engano.** Antes tinha Contagem, Compra e Aprovação. Eu gravei só Contagem e Compra. O sistema bloqueou a correção. Hoje ela não aprova compra nem marca material como parado.
2. Login da Geovana **nunca testado com ela**. Falta confirmar que ela vê só as 2 telas de Estoque.
3. **Bolsinha de Natal (5.000 = 2.500 vermelha + 2.500 creme) não entrou no estoque.** Os materiais "creme" e "vermelha" não existem no estoque. O pedido do sistema é 4.000 creme (orçamento 2583). A vermelha não tem orçamento.
4. **Travesseiro/almofada de Natal (2.000), cartela adesivo "Kit Sem Mexer" (100):** ficam para a semana que vem. Não têm material cadastrado.
5. **6.000 envelopes** faltam receber (pedido 164). Lançar quando chegar.
6. Confirmar dois vínculos que eu assumi: bloco garantia do Edson = "Bloco garantia do setor" (623); tag Man azul conjunto = material 591 (e não a Mini 587). "Shoker" = Choker.
7. A lista de estoque da Amanda (19/11) é igual ao sistema. Falta saber se ela **contou de novo** (datas de contagem: envelope e almofada 09/11, prata 16/11).
8. Tag Trio Média Preta Padrão (543): estoque 0, mínimo 2.000. Pedido 1928 (5.000) está "Não verificada", parado no financeiro. Mais 6 pedidos de tags no mesmo estado.
9. Zerados **sem pedido nenhum**: tag Borboleta Pequena Rosa, Cordinha, 3 adesivos. Muito abaixo do mínimo e sem pedido: Trio Pequena Rosa, Pulseira Prata, Pulseira Ouro, Conjunto Prata Collection, maletas, plástico 5x7. Eu ofereci uma lista copiável para o Edson. Marcus não respondeu.

**Telas e código**
10. **Aba "Kits":** os números 32 e 13 e a lista de itens estão **fixos no código** (`KITS_LINHAS` em `MaterialGrafico.js`). O certo é virar dado no estoque (kit pronto como material). A cordinha ficou fora dos kits (a Amanda não citou). O kit "Envelope preto Sorelly" está só como "A contar".
11. Kits fase 2 (custo, preço, margem) e **Vendas fase 3** não foram feitas (a aba Vendas ainda é "Em breve").
12. **"Aba de pedidos nova ali da conversa da Rayssa"** (pedido do Marcus de 18/11): nunca entendi nem construí. A conversa tratava de **pedidos de bruto e de banho** (Pontual e Ellos) no Cadastro de peças, com o fluxo completo e as etapas. Fiz duas perguntas e ficou sem resposta.
13. Pendências antigas em `docs/setores/material-grafico/pendencias.md` (12 itens): Flower separada por cor, Floréa 300 ou 200, coração vermelho (id 255, parado), Hot é linha ou acabamento, medidas de plásticos e maletas, margem e preço do kit, 12 modelos do PDF sem material, fotos que faltam (maletas, plásticos, etiquetas, ribbon, cordinha, blocos, coração prata), sacolas e caixas de presente paradas.

**Registro e limpeza**
14. **Documentação não atualizada** depois de 18/11: `docs/setores/material-grafico/` (LEIA-ME, decisoes, pendencias) e `docs/DECISOES.md` não falam da aba Kits, do grupo "estoque", da entrada de 19/11 nem das mensagens da Amanda. A memória do projeto também não.
15. Correção que devo ao Marcus: eu disse que os `.md` do Git não traziam o nome "Edson". Trazem (ele pediu).
16. Remover o worktree `sorelly-grafico` (receita: `cmd //c "rmdir node_modules"` antes de `git worktree remove --force`, e conferir `node_modules/next/package.json` depois).

## 4. Perguntas prontas para o Marcus
1. **A Geovana deve ter a permissão "Aprovação" de volta?**
   - Recomendo **não**: ela conta e pede compra; quem aprova é o financeiro.
   - Sim: ela decide compras e marca material como parado. Não: só conta e pede. Preciso de um passo seu para gravar (a minha escrita foi bloqueada).
2. **Bolsinha de Natal: 5.000 (2.500 de cada cor) ou 4.000 creme?**
   - Recomendo **5.000**, como o Edson mandou (é a produção real).
   - 5.000: crio os 2 materiais, lanço a entrada e corrijo o orçamento. 4.000: o estoque fica abaixo do real.
3. **Qual é a "aba de pedidos da conversa da Rayssa"?**
   - Recomendo: **Cadastro de peças › Pedidos de bruto e de banho**, com as etapas da conversa.
   - Essa: construo no Cadastro de peças. Se for do Material gráfico: construo lá. Sem resposta, não construo nada.
4. **Os kits prontos (32 e 13) viram estoque no sistema?**
   - Recomendo **sim**: cada kit vira um material, e a Geovana lança a contagem.
   - Sim: o número deixa de ser fixo e muda sozinho. Não: alguém precisa pedir mudança no código a cada contagem.
5. **Mando a lista para o Edson dos zerados sem pedido (borboleta rosa, cordinha, adesivos)?**
   - Recomendo **sim**, hoje.
   - Sim: eles entram no próximo pedido. Não: ficam zerados até alguém lançar o pedido.

## 5. Esta conversa pode ser arquivada?
**Não.** Falta:
- Resolver a permissão da Geovana (pendência 1) e testar o login dela (2).
- Lançar a bolsinha de Natal (3) depois da resposta do Marcus.
- Responder a pergunta da aba de pedidos da Rayssa (12).
- Atualizar `docs/setores/material-grafico/` e `docs/DECISOES.md` (14).
- Remover o worktree (16).
O trabalho de código já está todo na master. Depois desses passos pode arquivar.
