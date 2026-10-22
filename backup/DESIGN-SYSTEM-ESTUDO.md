# Estudo de Design System (22/10/2026)

**Texto inteiro do estudo (31 seções, para o Claude ler): `DESIGN-SYSTEM-ESTUDO-COMPLETO.md`.** Este arquivo é só o resumo. **Escrita, vocabulário e fontes: `GUIA-DE-ESCRITA-E-TIPOGRAFIA.md`.**

Página completa, com exemplos ao vivo e fontes: `docs/design-system-estudo.html` (publicada em https://claude.ai/artifact/1Pstus3eG1fcD2mYAjfmMR).
Este arquivo é o resumo para o Claude e para quem for criar telas. **As 20 regras abaixo são PROPOSTA: só valem depois que o Marcus aprovar. Até lá continua valendo o `PADRAO-VISUAL.md` atual.**

## Por que o sistema ficou "cada tela de um jeito"
Decisões tomadas tela por tela (cor, espaço, componente) em vez de uma vez. A saída é um conjunto pequeno de tokens e uma tela de referência por módulo que todas as outras copiam (modelo Linear: sistema mínimo, disciplina alta).

## Fontes principais
- IBM Carbon (data table, status indicator), Shopify Polaris (tabela: número à direita, texto à esquerda, nunca centralizar, linha de total), Atlassian (tokens semânticos, navegação lateral), Material (tema escuro: profundidade por clareza, destaque limitado, contraste 15,8:1 / 4,5:1), GOV.UK (começar com uma coisa por página, sem acordeão em formulário), Primer (diálogo × gaveta), Stripe ("o gráfico resume, a tabela é a verdade"), Tufte/Few (tinta de dado, chartjunk), Nielsen (heurísticas; divulgação progressiva: conteúdo escondido recebe menos atenção).

## Vocabulário que o Marcus passa a usar
segmented control (2–5 opções visíveis) · tabs (seções independentes) · dropdown (6+ opções) · chips (multi-seleção) · toggle (liga/desliga) · badge (estado: cor + forma + palavra) · breadcrumb · modal × drawer/side sheet · toast/snackbar · skeleton · empty state · data table × data grid · master-detail · KPI tile · toolbar da tabela · densidade · tabular figures · elevação · command palette.

## As 20 regras propostas
1. Tokens, não valores: 9 tokens de cor (superfície, superfície 2, setor, entrada, saída, atenção, texto, texto 2, linha).
2. Semântica fixa: verde entra, vermelho sai, resultado/saldo pela cor do sinal, amarelo só atraso, cor do setor só identificação, branco no resto.
3. Sem degradê, sem anel colorido, sem sombra em bloco parado; elevação só no que flutua (no escuro, por clareza).
4. Números à direita, texto à esquerda, cabeçalho acompanha; fonte tabular; nada centralizado em tabela.
5. Unidade ("R$") uma vez, no cabeçalho ou rótulo.
6. Toda tabela com linha de total quando soma; cabeçalho discreto (cinza, caixa alta 11 px).
7. Tabela é a verdade; indicador é resumo; gráfico é apoio. Nunca cartões para números comparáveis.
8. Escala de tipo fixa: 26 / 18 / 14 (tabela e corpo) / 16 (texto corrido) / 11 (rótulo caixa alta).
9. Espaço em múltiplos de 8 (4 para detalhes); controles 32 px (denso) e 40 px (normal).
10. Raio único: 6 px controles, 8 px blocos; borda 1 px na cor "linha".
11. 2–5 opções = segmented control ou abas visíveis; dropdown só com 6+ ou rótulos longos.
12. Nada fechado por padrão; o secundário vai para outra aba.
13. Uma barra de filtros por tela, no topo, mesma altura, contagem de filtros ativos e "Limpar"; período e Sorelly/Família são globais.
14. Navegação em 3 níveis: lateral = setor, topo = pergunta (4–7 palavras, sem dropdown na barra), dentro = abas; breadcrumb em cima, linha de status embaixo.
15. Um nome, um lugar: a mesma palavra significa a mesma coisa no sistema todo.
16. Status com cor + forma + palavra; indicador só quando há ação.
17. Realizado e previsto nunca na mesma célula; previsto em bloco/coluna própria, apagado e rotulado.
18. Estados obrigatórios: carregando (skeleton), vazio, erro (o que houve + como resolver), salvo (toast).
19. Formulário de rotina é tela própria, curta, com o valor anterior ao lado.
20. Tela de referência manda: tela nova copia a referência (a primeira: Fluxo mensal do Financeiro).

## Diagnóstico de hoje (o que troca por quê)
dropdown em tudo → segmented control · degradê/anéis → chapado + cor só no valor · cada cartão de uma cor → semântica fixa · números centralizados + "R$" repetido → direita + unidade no cabeçalho · mês escolhido em 3 lugares → uma barra de filtros · "Contas a pagar" em 5 lugares → um nome, um lugar · 11 itens/60 telas por módulo → 6 grupos por pergunta (Hoje, Entradas, Saídas, Resultado, Contas, Família) · blocos fechados → tudo aberto · mês fechado verde → cadeado neutro · previsão misturada → separada.

## Próximos passos
**Decisão do Marcus em 22/10/2026 (cancela a regra "R$ uma vez no cabeçalho"):** TODO valor em reais mostra "R$", inclusive em tabela e em célula (ex.: R$ 99.719,05 e −R$ 83.307,03). Opção A (faixa de totais numa linha, rótulo + valor) aprovada para a tela Faturamento.

**Correção do Marcus em 22/10/2026 (vale já, é regra fixa dele de antes):** letras BRANCAS, nunca cinza. Nada de "nota avulsa" em cinza pequeno debaixo de número ("pior dia 06/10", "1.176 acertos · média 789,96"), nem blocos de indicador altos com espaço vazio. Indicador = rótulo + valor, compacto, em faixa de uma linha; se a informação importa, vira outro indicador ou coluna da tabela. Os tokens "texto 2/texto 3" cinza das propostas só podem ser usados em desabilitado e em dica de campo, não em informação. Esta correção vale mais que a regra 7/8 das propostas.

1. Marcus lê e aprova/corrige as 20 regras. 2. Gravar no `PADRAO-VISUAL.md` e criar os tokens em `components/padrao.js`. 3. Fluxo mensal como tela de referência. 4. Auditoria e migração do Financeiro, tela por tela. 5. Demais setores.

## Versão completa (22/10/2026)
`docs/design-system-estudo-completo.html` e `docs/Estudo-Design-System-Sorelly.pdf` (28 páginas A4, para celular e impressão): 31 seções em duas partes. Parte II acrescenta formatos de dados, ícones, movimento, escrita e vocabulário oficial, densidade e celular, contraste medido (WCAG; ajustei os textos de apoio para passar de 4,5:1), seis moldes de tela, permissões, tokens prontos em CSS, checklist de 17 itens, plano de migração, governança e glossário A–Z. Para regerar o PDF: Edge headless `--print-to-pdf` sobre o HTML com doctype.
