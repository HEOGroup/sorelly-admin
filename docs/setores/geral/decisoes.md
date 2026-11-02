# Geral: decisões

Cópia fiel das decisões do diário geral (`docs/DECISOES.md`) que falam deste setor, da mais nova para a mais antiga.
O texto é o original. Para a decisão completa, abra o diário na linha indicada. Decisão nova entra no diário geral E aqui, no mesmo dia.
Lista separada por palavras-chave em 01/11/2026: pode ter decisão de outro setor misturada (revisar com o Marcus).

- **02/11/2026** (diário): **Trava dura: toda tabela com topo dourado em degradê, nada abreviado, tudo no meio (pedido do Marcus).** Regras 2c a 2e de `scripts/padrao-regras.mjs`.
- **02/11/2026** (diário): **Trava dura: sem faixa de totais/blocos de números no topo da tela, nunca (pedido do Marcus).** Regra 2b em `scripts/padrao-regras.mjs`; `FaixaTotais` e `Faixa` reprovadas.
- **19/10/2026** (diário, linha 291): **Menu (Marcus, 19/10/2026):** o menu LATERAL fica como está. A barra que aparece embaixo ao clicar num setor tem que ser alinhada no padrão da DevMaster em TODOS os setores: uma linha, cada palavra abre uma lista embaixo dela e os submenus abrem ao lado (`components/barra-cascata.js`; `menuAuto` em `App.js` monta o menu das áreas de quem não tem `menu:` próprio).

- **16/10/2026** (diário, linha 310): Gosta de ver **opções desenhadas** antes de mudar layout (ex.: barra do topo, opção D escolhida). Depois de escolher, "faz já".
- **16/10/2026** (diário, linha 310): Campo de dinheiro **sem vírgula** (digita só números); números que mudam **sobem** (101, 102…) com som baixinho padronizado.

- **28/10/2026** (diário, linha 1397; · Previsões de 2027 ficam na filial da DevMaster): **As previsões de 2027 (salário, adiantamento, cartão, vale alimentação, INSS...) são lançadas por filial de propósito (Nayale, 28/10/2026)**: vale a filial da DevMaster. Em `src/server/contas-dm.js`, só para vencimento até 31/12/2026 o CNPJ já conferido pelo Marcus vale antes da filial. A lista de "filial errada" (234 títulos, 184 de 2027) estava errada nesses 184: não pedir correção à Nayale.
