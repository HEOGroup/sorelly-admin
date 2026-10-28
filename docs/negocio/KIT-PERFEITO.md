# Kit perfeito (início em 27/10/2026)

## RESUMO DO QUE JÁ ESTÁ ALINHADO (leia primeiro; os detalhes e os números vêm nas seções abaixo, na ordem em que foram decididos)
1. **Objetivo:** a montadora recebe, no app, a lista exata do que mandar para CADA revendedora (quantidade por tipo, ouro e prata, aro do anel, conjuntos, desenho e cor da pedra). Hoje a tabela "Peças por kit" (`pecasKit` em `domain/config.js`) é igual para todo kit do mesmo valor e só olha o valor do kit.
2. **Base:** as 5 últimas vendas de acerto da revendedora (menos de 5 = usa as que tem), atualizada 1 vez por dia. Leilão (vendedor EK), Encomendas (91) e Expositor (04) não são acerto. Teste com a Cíntia das Graças (DevMaster 001655).
3. **Média de vendas** (regra completa e TES em `docs/negocio/MEDIA-DE-VENDAS.md`): Leilão fora, sem brinde, mesmo dia junta, dia de R$ 0 não conta, até 12 meses, 3 últimas. A diferença paga em bonificação conta como venda. Já está no código (`ultimasVendasDaMedia`, `src/server/vendas-brinde.js`).
4. **Dados na DevMaster (só leitura):** `dmaci` = itens vendidos (aponta a condicional de origem); `dmafj` = peças ENVIADAS em cada condicional; `dmaaa` = produto (`aaa_classe`: 01 prata, 02 ouro; `aaa_grupo` = tipo); aro do anel = 3 últimos dígitos do código ou número no fim do nome. A DevMaster NÃO guarda a cor da pedra: só o nome da peça.
5. **Vocabulário (Marcus):** cravejado = zircônia = micro zircônia (tudo igual) · folheado = banhado · liso = sem pedra · vazado = buraco no meio · ABS = bola lisa · orgânico = ondulado (modelo bem vendido) · ponto de luz = uma pedra só (com ou sem cravejado em volta) · cristal = COR da pedra, transparente, a mais comum · aparador = aliança cravejada ou lisa (é anel) · diversos = código de peças aleatórias · piercing fake = tipo de brinco · detalhado = termo antigo.
6. **O que importa na análise:** ouro x prata, quantidade por tipo, aros dos anéis, conjuntos, DESENHO da peça (coração, gota, trevo...), COR da pedra e preço de venda. Preço de etiqueta e faixas de preço saíram. A montadora nunca vê dinheiro: falta decidir se o "preço máximo da peça" pode aparecer.
7. **Quem usa é a montadora, no app** (não o Marcus). Layout escolhido: **A, lista de conferência**, versão 2 em `docs/design/kit-perfeito-layout-A-v2.html`: ordem numerada em 3 idas ao estoque, regras "antes de começar", aviso de estoque, "Separei tudo" ou "Faltou peça", alerta se faltar mais de 20% do tipo, fechamento que avisa a supervisão. Os 3 layouts antigos: `docs/design/kit-perfeito-layouts.html`.
8. **Regra de quantidade PROPOSTA (sem OK):** quantidade do tipo = média vendida por kit × folga (exemplo 3×, arredondada para cima); a tabela mínimo e máximo de hoje vira só trava. Regras de troca propostas: mesmo tipo e metal, outro desenho; depois outro metal (no máximo 1 em 4); anel: aro vizinho; conjunto nunca vira peças soltas; nunca trocar de tipo.
9. **Fica para 2027:** padrão de cadastro de peças (campos de cor da pedra, tipo, formato). Agora só se analisa o que já existe.
10. **Perguntas abertas:** de onde vem o estoque; prioridade entre revendedoras quando falta peça; folga (2×, 3×...); Choker, bracelete e pingente em qual linha da tabela; o que são "Brincos grandes" e "Brincos (B)"; cores exatas (rubi = vermelho?); regras de troca; terminar os termos de corrente (elos, Cartier, baiano, riviera, malha), tamanho (mini, pequeno, fino, grande) e linhas (Luxo, Premium, VIP, Select).
11. **Código:** nada de tela do Kit perfeito foi criado ainda. Só existem os desenhos em HTML.

Objetivo do Marcus: quando a montadora monta o kit de uma revendedora, o kit leva exatamente o que ela vende. Peças mais vendidas, ouro ou prata conforme o gosto dela, só os aros de anel que ela vende e o preço máximo das peças que ela vende. Faltam as regras: elas saem depois dos números.

## Decisões do Marcus (27/10/2026)
1. **Base = as 5 últimas vendas de acerto** da revendedora. Quem tem 1 ou 2 vendas usa as que tem. Quem tem 30 usa só as 5 últimas.
2. **Atualiza 1 vez por dia**, com as vendas novas.
3. **Teste com uma revendedora: Cíntia das Graças** (DevMaster `001655`, CINTIA DAS GRACAS OZORIO NUNES). Só depois as outras.
4. Medidas pedidas: ouro x prata, tamanho dos anéis que ela vende, preço máximo das peças.

## Onde estão os dados (DevMaster API 2, só leitura)
| Preciso | Tabela e campo | Observação |
|---|---|---|
| Itens da venda | `dmaci` por `aci_venda`; só TES S001/S002 | mesma regra de venda da média |
| Ouro ou prata | `dmaaa.aaa_classe`: `02` = ouro, `01` = prata | outras classes (05, 06, 08) existem: peça sem material claro |
| Categoria | `dmaaa.aaa_grupo`: 01 anel, 02 brinco, 03 conjunto, 04 colar, 05 infantil, 06 pulseira, 10 masculino, 19 brinco BB, 34 choker, 38 collection, 45 bracelete | grupos 13, 14, 16, 27, 30, 41, 42, 66 ainda sem nome |
| Aro do anel | 3 últimos dígitos do código do produto (A2152014 = aro 14); também aparece no fim da descrição | só vale no grupo 01 |
| Preço | `aci_valorbase` = preço de etiqueta (é o valor que conta como venda, igual ao `dmach.ach_valormerc`); `aci_valorun` = preço pago, cerca de 54% da etiqueta | usar etiqueta |

## Quem NÃO é acerto (tirar das 5 últimas)
- Vendedor **EK = LEILÃO**, **91 = ENCOMENDAS**, **04 = EXPOSITOR**. Na Cíntia, 7 vendas pequenas de Leilão (R$ 248 a R$ 688) entrariam por engano.
- Vendedor do kit muda com o tempo (hoje CZ = Mayara; antes 58, 55, C6...). A regra é: todo vendedor que não seja 04, 91 e EK.

## Resultado do teste: Cíntia das Graças (5 vendas, 241 peças, R$ 21.085 de etiqueta)
Vendas: 15/10 (2 vendas juntas), 16/09, 12/08, 14/07 (2 juntas), 17/06.
- **Ouro 49% das peças (55% do valor) e prata 48% (44% do valor).** Quase meio a meio: não é cliente só de ouro nem só de prata.
- **Categorias:** Brinco BB 18%, Anel 15%, Brinco 15%, Colar 12%, Pulseira 12%, Masculino 5%.
- **Anéis (aro: peças):** 19:6, 21:6, 16:5, 18:5, 20:3, 22:3, 14:2, e 1 de cada nos aros 10, 12, 13, 15, 17, 23, 24. Concentra do 16 ao 22.
- **Preço de etiqueta:** máximo R$ 622 (1 colar), mas só 3 peças passam de R$ 256. Maior preço vendido 2 vezes ou mais: R$ 212. Percentil 90: R$ 144. Mediana: R$ 88.

## Pendências
- Marcus ainda não definiu se o kit é "só o que vende" ou "o que mais vende com uma amostra do resto".
- Definir o critério do preço máximo (maior preço vendido 2+ vezes, ou percentil 90).
- Dar nome aos grupos 13, 14, 16, 27, 30, 41, 42, 66 (conferir no cadastro da DevMaster).
- Só depois: escrever as regras, a rotina diária e a tela. Nada disso existe no código ainda.

## Teste 2 (27/10/2026): enviado x vendido, Cíntia das Graças
Ideia do Marcus: a quantidade de CADA categoria no kit deve vir do que a revendedora vende nela, e não só do valor do kit. Duas revendedoras que vendem R$ 3 mil em 3 meses podem vender 10 anéis por mês ou 2: o kit não deve levar a mesma quantidade de anéis para as duas.

**Dados novos na DevMaster:** `dmafj` = peças ENVIADAS em cada condicional (`afj_condicional`, `afj_produto`, `afj_quantidade`). Cada peça vendida (`dmaci`) aponta para o kit de onde saiu (`aci_condicional`, `aci_itemcond`). Assim se mede o GIRO = vendidas ÷ enviadas, por categoria, material, aro e preço.

**Base:** os 5 últimos kits grandes fechados da Cíntia (079751 de 12/05, 082360 de 11/06, 085109 de 11/07, 087870 de 11/08, 090669 de 11/09): 763 peças enviadas, 211 vendidas, giro 28% (R$ 70.676 enviados, R$ 17.903 vendidos, etiqueta).

| Categoria | Vendidas por kit (média) | Variação por kit | Enviadas por kit (média) | Giro |
|---|---|---|---|---|
| Brinco BB | 8,2 | 5 a 10 | 21,6 | 38% |
| Brinco | 7,0 | 3 a 15 | 28,2 | 25% |
| Anel | 5,6 | 2 a 14 | 19,8 | 28% |
| Pulseira | 5,4 | 1 a 9 | 22,0 | 25% |
| Colar | 5,2 | 1 a 13 | 23,8 | 22% |
| Choker | 1,8 | 0 a 5 | 7,0 | 26% |
| Infantil | 1,4 | 0 a 5 | 4,6 | 30% |
| Masculino | 1,0 | 1 a 2 | 3,2 | 31% |
| Conjunto | 0,6 | 0 a 1 | 2,0 | 30% |
| Bracelete | 0,4 | 0 a 1 | 1,2 | 33% |

- **Ouro x prata:** enviado 57% ouro e 40% prata; vendido 48% ouro e 49% prata. Giro da prata 34%, do ouro 23%. Sobra ouro no kit.
- **Anéis (aro: enviados -> vendidos):** 16: 13->5, 19: 7->5, 21: 14->5, 18: 9->2, 20: 4->2, 22: 12->2; aros 23, 24 e 25: 16 enviados, 2 vendidos; aro 15: 7->0; aros 11 e 13: 4->0.
- **Preço de etiqueta (giro):** até R$ 50: 46% · R$ 50 a 80: 28% · R$ 80 a 100: 25% · R$ 100 a 150: **17%** · R$ 150 a 212: 25% · acima de R$ 212: 8 enviadas, 4 vendidas. O problema não é o teto: é o miolo de R$ 100 a 150.
- **Brincos por tipo:** trio BB 42%, trio de argola 54%, argola BB 46%, brinco avulso 21%, argola avulsa 22%.
- **Acabamento:** cravejado 31% de giro, liso 23%.

**Regra proposta (aguarda OK do Marcus):**
1. Quantidade da categoria = média vendida por kit (últimas 5 vendas) × folga, arredondada para cima.
2. A tabela "Peças por kit" (mínimo e máximo) vira só LIMITE: nunca abaixo do mínimo, nunca acima do máximo.
3. Folga (exemplo 3×; é o Marcus quem define, e pode ser por categoria) fica no Configurador.
4. Com folga 3×, a Cíntia levaria: Brinco BB 25, Brinco 21, Anel 17, Pulseira 17, Colar 16, Choker 6, Infantil 5, Masculino 3, Conjunto 2, Bracelete 2 (114 peças; hoje ela recebe cerca de 133 nessas mesmas categorias, e cerca de 153 no kit inteiro).
5. Dentro de cada categoria: aros só onde ela vende, prata e ouro na proporção do que ela VENDE, e menos peças de R$ 100 a 150.
- Anéis variam muito de um kit para outro (2 a 14): a média de 5 acertos suaviza, mas é a parte mais instável.
- Grupos sem nome (07, 13, 14, 16, 27, 30, 41, 42, 66): somam cerca de 90 peças enviadas; o 14 é rifa/brinde. Falta nomear.

## Resumo da Cíntia por tipo de peça (27/10/2026, base: 5 últimas vendas = 15/10, 16/09, 12/08, 14/07, 17/06)
Base: 241 peças vendidas; 236 são joias (R$ 20.985 de etiqueta) e 5 não são (4 rifas e 1 flanela, mais 1 porta-joias: ficam fora). Classificação pela DESCRIÇÃO da peça (o grupo da DevMaster não separa trio, duo e argola; grupos 13, 14, 16, 27, 30, 41, 42, 66 e 07 são pingente, rifa/flanela, linha premium, porta-joias, duo, choker, anel, brinco e tornozeleira).
- Ouro 119 · Prata 115 (50% x 49%); no valor: ouro 56%, prata 44%.
- Categorias: Brinco 87 (37%) · Anel 40 (17%) · Colar 32 (14%) · Pulseira 31 (13%) · Choker 14 (6%) · Masculino 13 (6%) · Infantil 7 · Conjunto 6 · Bracelete 2 · Pingente 2 · Tornozeleira 2.
- Brincos: avulso 35 · trio normal 23 · argola avulsa 17 · trio de argola 7 · duo 5. Metade (43 de 87) tem código BB; dos trios normais, 22 de 23 são BB.
- Anéis por aro: 21 e 19 = 6 cada · 18 e 16 = 5 · 20 = 4 · 14 e 22 = 3 · 24 = 2 · 1 cada nos aros 10, 12, 13, 15, 17, 23.
- Preço de etiqueta: até R$ 50 = 25% · 50 a 80 = 22% · 80 a 100 = 25% · 100 a 150 = 19% · 150 a 212 = 7% · acima de 212 = 2%.
- Acabamento: cravejado 40%, ponto de luz 22%, cristal 16%, coração 15%, liso 10%, religioso 7%.

## Nomes oficiais da DevMaster (lidos em 27/10/2026)
Grupo da peça (`dmaad`): 01 Anéis · 02 Brincos · 03 Conjuntos · 04 Colares · 05 Infantil · 06 Pulseiras · 07 Tornozeleiras · 10 Masculino · 11 Religiosos · 13 Pingentes · 14 Material de uso geral (rifa, flanela) · 16 Sorelly Premium · 19 Brincos Select · 27 Porta-joias · 28 Duo de brincos · 30 Brinco duo · 34 Choker · 38 Collection · 45 Bracelete · 66 Brincos borboleta · linha Select (BB) de outras peças: 41 Colares, 42 Anéis, 43 Pulseiras, 60 Infantil, 61 Conjuntos, 62 Tornozeleiras, 63 Bracelete, 64 Choker.
Material (`dmaai`, campo `aaa_classe`): 01 Prata 925 · 02 Ouro 18K · 03 Ródio · 04 Ródio negro · 05 Aço inox · 06 Produto de apoio · 08 Ouro rosé · 10 Collection · 11 Ouro 18K + Prata 925. O "?" das análises é produto de apoio (flanela, rifa, porta-joias).

## Tela de exemplo (27/10/2026, só desenho, nada no código)
Tela "Kit perfeito" por revendedora: faixa de totais, bloco Filtros (revendedora, base, folga, kit de referência), "O que ela mais vende", "Anéis por aro", preço de etiqueta e a tabela "Quantidade por tipo" com Vende por acerto, Tabela hoje, Mín–Máx, Kit perfeito e Diferença. Com folga 3×: Cíntia 146 peças contra 181 da tabela do kit de R$ 16.000.
Achados: a tabela "Peças por kit" (`pecasKit` em `domain/config.js`) usa só o valor do kit. Pulseiras na linha de R$ 16.000 = 16 de cada metal, mas a faixa máxima das regras é 15. Choker, bracelete e pingente não têm linha na tabela. "Brincos grandes" não tem dado nas vendas.

## Rodada 3 (27/10/2026): a tela é da MONTADORA, não do Marcus
- Marcus rejeitou a tela de análise: quem vai olhar é a montadora, no app, na hora de montar o kit da revendedora. Faixas de "preço de etiqueta" saem; só importa o preço de venda (maior preço que a peça vendida teve). Análises pedidas: anéis por tamanho, conjuntos, cor das pedras, ouro x prata.
- Desenhos: `docs/design/kit-perfeito-layouts.html` (3 layouts: A lista de conferência, B passo a passo, C folha única). Hoje a janela de montar (`components/janela-montar.js`, bloco "O que enviar") mostra só chips da tabela `pecasKit`, igual para todo kit do mesmo valor.
- **Cor da pedra NÃO existe no cadastro da DevMaster** (`aaa_pedra` = N, `aaa_tipopedra` = Z, `aaa_estilos`, `aaa_corprincipal` = D em todos; campos de site e marketplace vazios). Só o nome da peça cita cor, e raramente: nas 236 joias da Cíntia, 102 têm pedra e não dizem a cor, 73 são lisas. Com cor no nome: cristal 29, vermelho/rubi/fúcsia 13, rosa 5, verde 5, preto 5, azul 4, roxo 3.
- Conjuntos da Cíntia (5 vendas): 6 + 1 infantil. Prata: ponto de luz pequeno (2), flor cravejado, oval cravejado. Ouro: coração liso, gota orgânico, morango rubi (infantil). Preço de venda R$ 78 a R$ 168.
- Anéis (aro: ouro/prata): 21: 4/2 · 19: 4/2 · 18: 1/4 · 16: 3/2 · 20: 2/2 · 22: 2/1 · 14: 1/2 · 24: 1/1; 1 só em 10, 12, 13, 15, 17, 23. Estilo: cravejado 27, pedra zircônia 12, ponto de luz 7, solitário 5, regulável 2, liso 1.
- Maior preço de venda (e maior que repetiu 2 vezes): brinco R$ 212 (188) · anel R$ 188 (128) · colar R$ 622 (168) · pulseira R$ 362 (138) · choker R$ 232 (144) · conjunto R$ 168.
- Regra de dinheiro: montadora e bipadora nunca veem valor. Pendente decidir se o "preço máximo da peça" pode aparecer para a montadora.

## Vocabulário das peças (o que o Marcus explicou)
- **Cravejado é o termo geral** (27/10/2026). Peça cravejada = peça com pedras. A pedra usada é a **zircônia** (no nome aparece "zircônia", "zicônia", "cristal"...): **zircônia e cravejado são a mesma coisa**. Nas análises, "cravejado" e "pedra zircônia" devem ser contados juntos, como UM acabamento. (Na Cíntia: 27 cravejados + 12 zircônia nos anéis eram o mesmo grupo.)

## Termos mais comuns nos nomes das peças (leitura de 30.163 peças, 2.160 vendas, set e out/2026) — significado A CONFIRMAR com o Marcus
Porcentagem = peças cujo nome cita o termo. Ponto de luz 23% · cravejado/cravejada 34% (somados) · cristal 15% · argola 12% · coração 11% · gota 8% · liso/lisa 10% · vazado 5% · micro 4% · diversos 4% · trevo 4% · elos 4% · detalhado 4% · rosa 3% · grande 3% · quadrado 3% · solitário 3% · ABS 3% · cruz 3% · flor 3% · rubi 2% · oval 2% · cordão baiano 2% · letra 2% · aparador 2% · mini/pequeno/pequena/fino 2% · Nossa Senhora 2% · estrela 2% · zircônia 2% · círculo 2%.
Começos de nome (peças): brinco folheado 4.145 · anel folheado 3.523 · colar folheado 3.352 · trio de 2.892 · brinco argola 2.718 · pulseira folheada 2.315 · colar banhado 1.367 · brinco banhado 969 · brinco infantil 963 · duo de 900 · conjunto folheado 704 · choker folheada 659.

## Significados confirmados pelo Marcus (27/10/2026)
- **Folheado = banhado**: é a mesma coisa. Mudaram só as regras, e o nome de hoje é **banhado**. Nas análises, contar juntos.
- **Vazado**: peça com um buraco no meio (parte aberta).
- **Liso**: peça SEM pedra, com uma área lisa.
- **Detalhado**: termo que se usava antes. De agora em diante vale padronização nova (ver abaixo).
- **Cristal**: COR da pedra, transparente. É a mais vendida e a mais comum.
- **Micro zircônias = cravejado**: tudo a mesma coisa (junto com zircônia e cravejado).
- **Novo trabalho:** criar **regras de padronização para novos cadastros** de peça (nome e atributos), para a cor da pedra, o tipo e o formato entrarem como campo e não só no nome. Entra no Cadastro de peças (Rayssa e Graziella).

## Significados confirmados, 2ª parte (Marcus, 27/10/2026)
- **Ponto de luz**: peça com UMA pedra só (ex.: colar ponto de luz). Pode ser ponto de luz sozinho ou ponto de luz com cravejado em volta.
- **Diversos**: código em que se colocam peças aleatórias (vários modelos misturados). Não é um modelo único.
- **ABS**: uma bola lisa.
- **Orgânico**: peça meio lisa e ondulada. É um modelo bem vendido.
- **Aparador**: parecido com uma aliança, cravejada ou lisa. Serve para segurar outros anéis, mas também se usa sozinho. É anel.
- **Piercing fake**: é um tipo de brinco.
- **Cor da pedra é importante** e deve entrar na análise.
- **Padrão de cadastro**: nunca existiu; foi se formando. Vai ser alinhado daqui para a frente.

## Decisões do Marcus (27/10/2026, rodada 4)
- **O desenho da peça IMPORTA** (coração, gota, trevo, cruz...): entra na análise do kit.
- **Padrão de cadastro fica para o ano que vem** (fim de ano, sem tempo). Agora só se ANALISA o que já existe para montar melhor o kit das revendedoras. Não criar campos novos agora.

## Cor da pedra e desenho: todas as vendas de set e out/2026 (30.163 peças, só pelo nome da peça)
Cor (% das peças): cristal 19% (ouro 2.470, prata 3.199) · vermelho/rubi/fúcsia 3,4% · rosa/rosa bebê 3,3% · azul 2,3% · verde/esmeralda 2,0% · pérola 1,9% · preto 1,6% · roxo/lilás 1,3% · turmalina 1,2%. Só 39% das peças trazem alguma cor no nome. O grupo "colorido/diversos" (5,9%) mistura códigos de "diversos" (peças aleatórias) e não é cor.
Desenho (% das peças): coração 14,4 · gota 8,1 · trevo 5,0 · círculo 4,8 · quadrado 3,5 · flor 3,0 · cruz 3,0 · letra 2,5 · oval 2,2 · estrela 2,1 · Nossa Senhora 2,0 · borboleta 1,8 · navete 1,3 · infinito 1,0.
6 revendedoras diferentes (1 venda de 50 a 100 peças cada): cristal fica entre 15% e 29% em todas; as outras cores variam por revendedora (Cíntia: vermelho 10%, verde 4%; Ana Paula: azul 8%; Deysiane: rosa, turmalina e pérola 4% cada; Luciana: pérola 4%). Peças sem pedra no nome: 33% a 43%.

## Layout A, versão 2 (27/10/2026) — `docs/design/kit-perfeito-layout-A-v2.html`
Marcus escolheu o layout A (lista de conferência). Pedido: criar uma SEQUÊNCIA, instruir bem as montadoras (linguagem simples, um passo por vez) e tratar o caso de faltar peça no estoque (as meninas pegam de uma vez, no estoque, as peças de maior quantidade, e às vezes não sobra para a revendedora).
Desenho: regras "antes de começar", 9 etapas numeradas em 3 idas ao estoque (1: brincos e anéis · 2: colares, pulseiras e chokers · 3: conjuntos, masculino, infantil e outros), aviso de estoque por etapa, "Separei tudo" ou "Faltou peça" (conta quantas), alerta se faltar mais de 20% do tipo, e fechamento que lista o que faltou e avisa a supervisão antes de lacrar.
Regras de troca PROPOSTAS (a confirmar): 1º mesmo tipo e metal, outro desenho; 2º mesmo tipo, outro metal (no máximo 1 em 4); anel: aro vizinho; conjunto nunca vira peças soltas; nunca trocar por outro tipo.
Pendências: de onde vem o estoque (hoje o desenho usa "estoque ok, baixo, sem" de exemplo); quem decide quando o estoque não dá para todas as revendedoras (ordem de prioridade dos kits).
