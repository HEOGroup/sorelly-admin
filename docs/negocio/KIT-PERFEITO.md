# Kit perfeito (início em 27/10/2026)

## RESUMO DO QUE JÁ ESTÁ ALINHADO (leia primeiro; os detalhes e os números vêm nas seções abaixo, na ordem em que foram decididos)
1. **Objetivo:** a montadora recebe, no app, a lista exata do que mandar para CADA revendedora (quantidade por tipo, ouro e prata, tamanho do anel, conjuntos, desenho e cor da pedra). Hoje a tabela "Peças por kit" (`pecasKit` em `domain/config.js`) é igual para todo kit do mesmo valor e só olha o valor do kit.
2. **Base:** as 5 últimas vendas de acerto da revendedora (menos de 5 = usa as que tem), atualizada 1 vez por dia. Leilão (vendedor EK), Encomendas (91) e Expositor (04) não são acerto. Teste com a Cíntia das Graças (DevMaster 001655).
3. **Média de vendas** (regra completa e TES em `docs/negocio/MEDIA-DE-VENDAS.md`): Leilão fora, sem brinde, mesmo dia junta, dia de R$ 0 não conta, até 12 meses, 3 últimas. A diferença paga em bonificação conta como venda. Já está no código (`ultimasVendasDaMedia`, `src/server/vendas-brinde.js`).
4. **Dados na DevMaster (só leitura):** `dmaci` = itens vendidos (aponta a condicional de origem); `dmafj` = peças ENVIADAS em cada condicional; `dmaaa` = produto (`aaa_classe`: 01 prata, 02 ouro; `aaa_grupo` = tipo); tamanho do anel = 3 últimos dígitos do código ou número no fim do nome. A DevMaster NÃO guarda a cor da pedra: só o nome da peça.
5. **Vocabulário (Marcus):** cravejado = zircônia = micro zircônia (tudo igual) · folheado = banhado · liso = sem pedra · vazado = buraco no meio · ABS = bola lisa · orgânico = ondulado (modelo bem vendido) · ponto de luz = uma pedra só (com ou sem cravejado em volta) · cristal = COR da pedra, transparente, a mais comum · aparador = aliança cravejada ou lisa (é anel) · diversos = código de peças aleatórias · piercing fake = tipo de brinco · detalhado = termo antigo.
6. **O que importa na análise:** ouro x prata, quantidade por tipo, tamanhos dos anéis, conjuntos, DESENHO da peça (coração, gota, trevo...), COR da pedra e preço de venda. Preço de etiqueta e faixas de preço saíram. A montadora nunca vê dinheiro: falta decidir se o "preço máximo da peça" pode aparecer.
7. **Quem usa é a montadora, no app** (não o Marcus). Layout escolhido: **A, lista de conferência**, versão 2 em `docs/design/testes-de-layout/kit-perfeito-layout-A-v2.html`: ordem numerada em 3 idas ao estoque, regras "antes de começar", aviso de estoque, "Separei tudo" ou "Faltou peça", alerta se faltar mais de 20% do tipo, fechamento que avisa a supervisão. Os 3 layouts antigos: `docs/design/testes-de-layout/kit-perfeito-layouts.html`.
8. **Regra de quantidade PROPOSTA (sem OK):** quantidade do tipo = média vendida por kit × folga (exemplo 3×, arredondada para cima); a tabela mínimo e máximo de hoje vira só trava. Regras de troca propostas: mesmo tipo e metal, outro desenho; depois outro metal (no máximo 1 em 4); anel: tamanho vizinho; conjunto nunca vira peças soltas; nunca trocar de tipo.
9. **Fica para 2027:** padrão de cadastro de peças (campos de cor da pedra, tipo, formato). Agora só se analisa o que já existe.
10. **Perguntas abertas:** de onde vem o estoque; prioridade entre revendedoras quando falta peça; folga (2×, 3×...); Choker, bracelete e pingente em qual linha da tabela; o que são "Brincos grandes" e "Brincos (B)"; cores exatas (rubi = vermelho?); regras de troca; terminar os termos de corrente (elos, Cartier, baiano, riviera, malha), tamanho (mini, pequeno, fino, grande) e linhas (Luxo, Premium, VIP, Select).
11. **Código:** nada de tela do Kit perfeito foi criado ainda. Só existem os desenhos em HTML.

Objetivo do Marcus: quando a montadora monta o kit de uma revendedora, o kit leva exatamente o que ela vende. Peças mais vendidas, ouro ou prata conforme o gosto dela, só os tamanhos de anel que ela vende e o preço máximo das peças que ela vende. Faltam as regras: elas saem depois dos números.

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
| Tamanho do anel | 3 últimos dígitos do código do produto (A2152014 = tamanho 14); também aparece no fim da descrição | só vale no grupo 01 |
| Preço | `aci_valorbase` = preço de etiqueta (é o valor que conta como venda, igual ao `dmach.ach_valormerc`); `aci_valorun` = preço pago, cerca de 54% da etiqueta | usar etiqueta |

## Quem NÃO é acerto (tirar das 5 últimas)
- Vendedor **EK = LEILÃO**, **91 = ENCOMENDAS**, **04 = EXPOSITOR**. Na Cíntia, 7 vendas pequenas de Leilão (R$ 248 a R$ 688) entrariam por engano.
- Vendedor do kit muda com o tempo (hoje CZ = Mayara; antes 58, 55, C6...). A regra é: todo vendedor que não seja 04, 91 e EK.

## Resultado do teste: Cíntia das Graças (5 vendas, 241 peças, R$ 21.085 de etiqueta)
Vendas: 15/10 (2 vendas juntas), 16/09, 12/08, 14/07 (2 juntas), 17/06.
- **Ouro 49% das peças (55% do valor) e prata 48% (44% do valor).** Quase meio a meio: não é cliente só de ouro nem só de prata.
- **Categorias:** Brinco BB 18%, Anel 15%, Brinco 15%, Colar 12%, Pulseira 12%, Masculino 5%.
- **Anéis (tamanho: peças):** 19:6, 21:6, 16:5, 18:5, 20:3, 22:3, 14:2, e 1 de cada nos tamanhos 10, 12, 13, 15, 17, 23, 24. Concentra do 16 ao 22.
- **Preço de etiqueta:** máximo R$ 622 (1 colar), mas só 3 peças passam de R$ 256. Maior preço vendido 2 vezes ou mais: R$ 212. Percentil 90: R$ 144. Mediana: R$ 88.

## Pendências
- Marcus ainda não definiu se o kit é "só o que vende" ou "o que mais vende com uma amostra do resto".
- Definir o critério do preço máximo (maior preço vendido 2+ vezes, ou percentil 90).
- Dar nome aos grupos 13, 14, 16, 27, 30, 41, 42, 66 (conferir no cadastro da DevMaster).
- Só depois: escrever as regras, a rotina diária e a tela. Nada disso existe no código ainda.

## Teste 2 (27/10/2026): enviado x vendido, Cíntia das Graças
Ideia do Marcus: a quantidade de CADA categoria no kit deve vir do que a revendedora vende nela, e não só do valor do kit. Duas revendedoras que vendem R$ 3 mil em 3 meses podem vender 10 anéis por mês ou 2: o kit não deve levar a mesma quantidade de anéis para as duas.

**Dados novos na DevMaster:** `dmafj` = peças ENVIADAS em cada condicional (`afj_condicional`, `afj_produto`, `afj_quantidade`). Cada peça vendida (`dmaci`) aponta para o kit de onde saiu (`aci_condicional`, `aci_itemcond`). Assim se mede o GIRO = vendidas ÷ enviadas, por categoria, material, tamanho e preço.

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
- **Anéis (tamanho: enviados -> vendidos):** 16: 13->5, 19: 7->5, 21: 14->5, 18: 9->2, 20: 4->2, 22: 12->2; tamanhos 23, 24 e 25: 16 enviados, 2 vendidos; tamanho 15: 7->0; tamanhos 11 e 13: 4->0.
- **Preço de etiqueta (giro):** até R$ 50: 46% · R$ 50 a 80: 28% · R$ 80 a 100: 25% · R$ 100 a 150: **17%** · R$ 150 a 212: 25% · acima de R$ 212: 8 enviadas, 4 vendidas. O problema não é o teto: é o miolo de R$ 100 a 150.
- **Brincos por tipo:** trio BB 42%, trio de argola 54%, argola BB 46%, brinco avulso 21%, argola avulsa 22%.
- **Acabamento:** cravejado 31% de giro, liso 23%.

**Regra proposta (aguarda OK do Marcus):**
1. Quantidade da categoria = média vendida por kit (últimas 5 vendas) × folga, arredondada para cima.
2. A tabela "Peças por kit" (mínimo e máximo) vira só LIMITE: nunca abaixo do mínimo, nunca acima do máximo.
3. Folga (exemplo 3×; é o Marcus quem define, e pode ser por categoria) fica no Configurador.
4. Com folga 3×, a Cíntia levaria: Brinco BB 25, Brinco 21, Anel 17, Pulseira 17, Colar 16, Choker 6, Infantil 5, Masculino 3, Conjunto 2, Bracelete 2 (114 peças; hoje ela recebe cerca de 133 nessas mesmas categorias, e cerca de 153 no kit inteiro).
5. Dentro de cada categoria: tamanhos só onde ela vende, prata e ouro na proporção do que ela VENDE, e menos peças de R$ 100 a 150.
- Anéis variam muito de um kit para outro (2 a 14): a média de 5 acertos suaviza, mas é a parte mais instável.
- Grupos sem nome (07, 13, 14, 16, 27, 30, 41, 42, 66): somam cerca de 90 peças enviadas; o 14 é rifa/brinde. Falta nomear.

## Resumo da Cíntia por tipo de peça (27/10/2026, base: 5 últimas vendas = 15/10, 16/09, 12/08, 14/07, 17/06)
Base: 241 peças vendidas; 236 são joias (R$ 20.985 de etiqueta) e 5 não são (4 rifas e 1 flanela, mais 1 porta-joias: ficam fora). Classificação pela DESCRIÇÃO da peça (o grupo da DevMaster não separa trio, duo e argola; grupos 13, 14, 16, 27, 30, 41, 42, 66 e 07 são pingente, rifa/flanela, linha premium, porta-joias, duo, choker, anel, brinco e tornozeleira).
- Ouro 119 · Prata 115 (50% x 49%); no valor: ouro 56%, prata 44%.
- Categorias: Brinco 87 (37%) · Anel 40 (17%) · Colar 32 (14%) · Pulseira 31 (13%) · Choker 14 (6%) · Masculino 13 (6%) · Infantil 7 · Conjunto 6 · Bracelete 2 · Pingente 2 · Tornozeleira 2.
- Brincos: avulso 35 · trio normal 23 · argola avulsa 17 · trio de argola 7 · duo 5. Metade (43 de 87) tem código BB; dos trios normais, 22 de 23 são BB.
- Anéis por tamanho: 21 e 19 = 6 cada · 18 e 16 = 5 · 20 = 4 · 14 e 22 = 3 · 24 = 2 · 1 cada nos tamanhos 10, 12, 13, 15, 17, 23.
- Preço de etiqueta: até R$ 50 = 25% · 50 a 80 = 22% · 80 a 100 = 25% · 100 a 150 = 19% · 150 a 212 = 7% · acima de 212 = 2%.
- Acabamento: cravejado 40%, ponto de luz 22%, cristal 16%, coração 15%, liso 10%, religioso 7%.

## Nomes oficiais da DevMaster (lidos em 27/10/2026)
Grupo da peça (`dmaad`): 01 Anéis · 02 Brincos · 03 Conjuntos · 04 Colares · 05 Infantil · 06 Pulseiras · 07 Tornozeleiras · 10 Masculino · 11 Religiosos · 13 Pingentes · 14 Material de uso geral (rifa, flanela) · 16 Sorelly Premium · 19 Brincos Select · 27 Porta-joias · 28 Duo de brincos · 30 Brinco duo · 34 Choker · 38 Collection · 45 Bracelete · 66 Brincos borboleta · linha Select (BB) de outras peças: 41 Colares, 42 Anéis, 43 Pulseiras, 60 Infantil, 61 Conjuntos, 62 Tornozeleiras, 63 Bracelete, 64 Choker.
Material (`dmaai`, campo `aaa_classe`): 01 Prata 925 · 02 Ouro 18K · 03 Ródio · 04 Ródio negro · 05 Aço inox · 06 Produto de apoio · 08 Ouro rosé · 10 Collection · 11 Ouro 18K + Prata 925. O "?" das análises é produto de apoio (flanela, rifa, porta-joias).

## Tela de exemplo (27/10/2026, só desenho, nada no código)
Tela "Kit perfeito" por revendedora: faixa de totais, bloco Filtros (revendedora, base, folga, kit de referência), "O que ela mais vende", "Anéis por tamanho", preço de etiqueta e a tabela "Quantidade por tipo" com Vende por acerto, Tabela hoje, Mín–Máx, Kit perfeito e Diferença. Com folga 3×: Cíntia 146 peças contra 181 da tabela do kit de R$ 16.000.
Achados: a tabela "Peças por kit" (`pecasKit` em `domain/config.js`) usa só o valor do kit. Pulseiras na linha de R$ 16.000 = 16 de cada metal, mas a faixa máxima das regras é 15. Choker, bracelete e pingente não têm linha na tabela. "Brincos grandes" não tem dado nas vendas.

## Rodada 3 (27/10/2026): a tela é da MONTADORA, não do Marcus
- Marcus rejeitou a tela de análise: quem vai olhar é a montadora, no app, na hora de montar o kit da revendedora. Faixas de "preço de etiqueta" saem; só importa o preço de venda (maior preço que a peça vendida teve). Análises pedidas: anéis por tamanho, conjuntos, cor das pedras, ouro x prata.
- Desenhos: `docs/design/testes-de-layout/kit-perfeito-layouts.html` (3 layouts: A lista de conferência, B passo a passo, C folha única). Hoje a janela de montar (`components/janela-montar.js`, bloco "O que enviar") mostra só chips da tabela `pecasKit`, igual para todo kit do mesmo valor.
- **Cor da pedra NÃO existe no cadastro da DevMaster** (`aaa_pedra` = N, `aaa_tipopedra` = Z, `aaa_estilos`, `aaa_corprincipal` = D em todos; campos de site e marketplace vazios). Só o nome da peça cita cor, e raramente: nas 236 joias da Cíntia, 102 têm pedra e não dizem a cor, 73 são lisas. Com cor no nome: cristal 29, vermelho/rubi/fúcsia 13, rosa 5, verde 5, preto 5, azul 4, roxo 3.
- Conjuntos da Cíntia (5 vendas): 6 + 1 infantil. Prata: ponto de luz pequeno (2), flor cravejado, oval cravejado. Ouro: coração liso, gota orgânico, morango rubi (infantil). Preço de venda R$ 78 a R$ 168.
- Anéis (tamanho: ouro/prata): 21: 4/2 · 19: 4/2 · 18: 1/4 · 16: 3/2 · 20: 2/2 · 22: 2/1 · 14: 1/2 · 24: 1/1; 1 só em 10, 12, 13, 15, 17, 23. Estilo: cravejado 27, pedra zircônia 12, ponto de luz 7, solitário 5, regulável 2, liso 1.
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

## Layout A, versão 2 (27/10/2026) — `docs/design/testes-de-layout/kit-perfeito-layout-A-v2.html`
Marcus escolheu o layout A (lista de conferência). Pedido: criar uma SEQUÊNCIA, instruir bem as montadoras (linguagem simples, um passo por vez) e tratar o caso de faltar peça no estoque (as meninas pegam de uma vez, no estoque, as peças de maior quantidade, e às vezes não sobra para a revendedora).
Desenho: regras "antes de começar", 9 etapas numeradas em 3 idas ao estoque (1: brincos e anéis · 2: colares, pulseiras e chokers · 3: conjuntos, masculino, infantil e outros), aviso de estoque por etapa, "Separei tudo" ou "Faltou peça" (conta quantas), alerta se faltar mais de 20% do tipo, e fechamento que lista o que faltou e avisa a supervisão antes de lacrar.
Regras de troca PROPOSTAS (a confirmar): 1º mesmo tipo e metal, outro desenho; 2º mesmo tipo, outro metal (no máximo 1 em 4); anel: tamanho vizinho; conjunto nunca vira peças soltas; nunca trocar por outro tipo.
Pendências: de onde vem o estoque (hoje o desenho usa "estoque ok, baixo, sem" de exemplo); quem decide quando o estoque não dá para todas as revendedoras (ordem de prioridade dos kits).

## Avaliação de kits que as revendedoras elogiaram (começou em 28/10/2026)
Método do Marcus: revendedoras que disseram "gostei do kit deste mês"; comparar o que venderam nas 3 últimas vendas com o kit novo, para descobrir o que o kit bom tem em comum. Script reutilizável: `avalia-kit.mjs` (na pasta temporária da conversa; recriar se precisar: lê dmach, dmaci, dmafi, dmafj e dmaaa da DevMaster).

### 1. Franciane Poli de Oliveira Anastácio (DevMaster 008873) — "Eu amei o meu kit"
- 3 últimas vendas: 24/09 R$ 300 · 13/08 R$ 1.226 · 14/07 R$ 656 (média R$ 727). Só 23 peças vendidas: amostra pequena.
- Kit de agora: 091623 de 18/09, R$ 9.016, 105 peças (aberto, ainda sem acerto). Kit de antes: 087439 de 06/08, R$ 13.833, 151 peças. **O kit novo é 30% menor** e bate com a média dela pela tabela da Calculadora.
- O que BATEU: tamanhos de anel (ela vendeu 21, 22 e 28; o kit tem 22 ×4, 24 ×3, 28 ×2, 21 ×1 e quase nada fora dessa faixa); cravejado (vendido 65%, kit 63%); preço máximo igual (R$ 188); categoria líder brinco (30% vendido, 36% no kit).
- O que NÃO bateu: ouro e prata (ela vende 43% ouro e 57% prata; o kit tem 58% ouro e 41% prata); cor (ela vende cristal 22%, preto 13%, rosa 9%; o kit tem cristal 12%, verde 6%, rosa 4% e nenhuma peça preta); desenho (ela vende trevo 17% e coração 13%; o kit tem gota 12%, coração 11% e trevo só 3%); colar e choker (26% e 17% do que vende; 14% e 7% do kit).
- Leitura provisória: ela gostou mesmo sem o kit seguir a cor, o desenho e o metal dela. O que mudou foi o TAMANHO (kit menor) e os tamanhos certos. Hipótese a testar nas próximas: o kit bom é o proporcional ao que a revendedora vende, e cor e desenho pesam menos do que se pensava.
- Cuidado: o kit novo é de 18/09, antes da última venda dela (24/09); "gostar do kit" ainda não é resultado de venda.

### 2. Savana Ferreira da Silva (DevMaster 010979) — "gostei, mas veio muito anel de numeração pequena"
- Cadastrada em 05/10/2026, SEM nenhuma venda (kit novo). Kit 094270 de 15/10: R$ 7.009, 88 peças, 12 anéis.
- Tamanhos do kit: 10, 11, 12, 14, 16, 17, 19, 20, 21, 22 (1 de cada) e 18 ×2. Até tamanho 15: 4 de 12 (33%); 16 a 19: 5; 20 ou mais: 3.
- Curva de tamanhos de TODAS as revendedoras (4.260 anéis vendidos, set e out/2026): até 15 = 24% · 16 a 19 = 47% (o 18 sozinho vende 18%, o 16 vende 12%) · 20 a 22 = 22% · 23 ou mais = 7%. O kit da Savana tem mais anel pequeno que a média (33% contra 24%) e é "um de cada tamanho", sem peso nos tamanhos que mais saem.
- Hoje NÃO existe como a revendedora pedir numeração: a Preferências do kit não tem pergunta de tamanho. Lacuna a resolver.
- Regra proposta para kit novo (sem histórico): usar a curva geral de tamanhos, com mais peças no 16, 18, 19, 20 e 22 e quase nada abaixo do 12.

### 3. Elisiane Aparecida de Lara Vaz Miranda (DevMaster 000696) — "gostei, vieram minhas encomendas e a maioria das preferências"
- 3 últimas vendas: 09/10 R$ 1.499 · 11/09 R$ 2.072 · 10/08 R$ 1.406 (56 peças). Kit de agora: 093484 de 08/10, R$ 10.022, 133 peças, do mesmo tamanho dos anteriores (R$ 10.362 e R$ 10.045).
- Kit NÃO acompanha o que ela vende: cravejado 51% no kit contra 70% vendido; cristal 6% contra 21%; vermelho 1% contra 7%; pulseira 16% no kit contra 7% vendido; ouro 51% no kit contra 38% vendido; tamanho 21 (vendeu 3) só 1 no kit.
- O que bateu: tamanho do kit igual ao dos anteriores, brinco 36% (vendeu 32%), infantil 8% (vendeu 9%), desenho coração.
- Leitura: ela gostou porque as ENCOMENDAS e as PREFERÊNCIAS dela foram atendidas, não porque o mix bateu com as vendas.

### Padrão que aparece nos 3 casos (hipóteses, 28/10/2026)
- Kit elogiado NÃO é o que reproduz o mix vendido (cor, metal, desenho falharam nos 3).
- O que apareceu: (1) tamanho do kit proporcional ao que a revendedora vende (Franciane); (2) pedido atendido: encomenda e preferência (Elisiane); (3) tamanho: quando erra, a reclamação é de tamanho (Savana).
- Falta ver kit que NÃO foi elogiado, para comparar. Pedir ao Marcus casos de reclamação.

## Preferências do kit trazidas do admin antigo (28/10/2026)
- Fonte: tabela `kit_block` do banco do admin antigo (consulta só leitura). 20 blocos: 19 + Observações; 14 ligados no app, 6 desligados (Identificação, Brincos, Conjuntos, Choker, Pulseiras, Braceletes). Salvo em `src/apps/montagem/domain/preferencias-kit.local.js` (gitignored, lido pela tela Preferências do kit na aba Formulário do app; conferido no navegador: "19 blocos no formulário · 14 ligados").
- **O admin antigo TEM pergunta de tamanho** (atualizada em 30/09/2026): bloco Anéis, "Tamanhos que você mais vende (selecione 3 opções)", tamanhos 10 a 25. Corrige o que foi dito antes: a falta era só no sistema novo, que agora a tem.
- Pergunta por bloco: Anéis (tamanhos), Colar Filhos (9 composições), Colar de Letras (até 5 letras), Infantil e Masculino (modelos), Conjunto, Bracelete, Tornozeleira (vende ou não, qual metal), Colares e Pulseira (barra ouro e prata), Flanela, Material de apoio e Pingentes avulsos. Desligados mas existentes: Brincos (15 estilos), Conjuntos (luxo, delicado, pontos de luz), Choker (10 modelos) e cores (11 cores, de cristal a lilás).
- As RESPOSTAS das revendedoras não estão no banco do admin antigo (ficam no app da revendedora). As 31 respostas que aparecem na tela hoje são de demonstração.
- Preferência só chega "a partir do 2º kit" (regra do app); kit novo, como o da Savana, não passou pela pergunta de tamanho.
- Marcus pode ligar de novo Brincos, Conjuntos e Choker: são justamente os tipos que mais importam na análise (brinco é 37% das vendas).

## Respostas das revendedoras às Preferências: onde estão (28/10/2026)
- NÃO estão no banco do admin antigo. Vivem na **API mobile** do app da revendedora (doc do admin antigo: `docs/modulos/preferencias-kit.md`): o admin antigo lê `GET /revendedoras/kit-preferences` (lista, 100 por página), `/:id` (respostas e observações) e `/analytics`, com `MOBILE_API_URL` e `MOBILE_API_KEY` (Bearer).
- Essas duas variáveis NÃO existem no `.env.local` do sistema novo nem num `.env` do projeto antigo no computador: só o `.env.example`. Sem elas não dá para ler os dados.
- Caminhos para ter os dados de teste sem ligar o app: (1) Leonardo manda as duas variáveis (ou roda uma exportação única da lista) e eu leio uma vez, só leitura; (2) Leonardo exporta tudo em JSON ou tabela; a tela Preferências do kit tem a aba **Importar** (tabela ou JSON colado, colunas nome, telefone, cidade, estado, e-mail, id, atualizado em e uma por bloco). Os dados reais entram só no navegador e em `preferencias-kit.local.js`, nunca no Git.

## Desenho da nova aba Análise (Preferências do kit), 28/10/2026 — `docs/design/testes-de-layout/preferencias-analise-desenho.html`
Motivo: a aba atual é uma pilha de 20 cartões (2.500 px), filtro solto de 8 campos e frases longas, contra o padrão do sistema (planilha, faixa de totais, filtros no topo). Proposta: faixa de 6 totais; bloco Filtros em 4 colunas; selo "Dados de demonstração" no lugar do aviso amarelo; 3 abas visíveis (Resumo, Por bloco, Por revendedora); "Por bloco" vira UMA tabela com detalhe ao lado; Anéis com barras por tamanho em ordem e a coluna "Vendem" (curva real) ao lado de "Pedem". Aguarda OK do Marcus para aplicar no sistema. Defeito visto na tela atual: a coluna "Categorias" da lista de revendedoras mostra 0 em todas as linhas (conferir).

## API do app: teste de leitura das Preferências do kit (02/11/2026)
- Marcus trocou o `.env.local` por um arquivo com `MOBILE_API_URL` e `MOBILE_API_KEY` (cópia do anterior guardada fora do projeto). Teste só com GET em `/revendedoras/kit-preferences/analytics`, `/revendedoras/kit-preferences` (lista) e `/revendedoras/kit-preferences/:id`: os três responderam 200. Guia: `docs/app-sorelly/API-LEITURA.md`.
- **Números reais (02/11/2026):** 3.025 revendedoras; 2.044 com preferências (67,6%); 981 sem; média de 13,5 categorias respondidas; ouro e prata 50% e 50%; última atualização 02/11/2026 22:12. Todos os blocos do formulário aparecem com resposta.
- **Tamanho de anel que as revendedoras PEDEM (cada uma marca até 3, mas o app aceita mais; votos por tamanho):** 18 = 58,6% · 16 = 53,0% · 17 = 50,8% · 20 = 46,4% · 19 = 45,8% · 15 = 34,6% · 21 = 32,9% · 14 = 30,7% · 22 = 26,4% · 23 = 16,5% · 13 = 14,2% · 12 = 13,8% · 24 = 11,9% · 25 = 8,8% · 10 = 5,7% · 11 = 4,7%. Em faixas: até 15 = 23% · 16 a 19 = 46% · 20 a 22 = 23% · 23 ou mais = 8%.
- **Compara com o que VENDEM** (4.260 anéis, set e out/2026: 24% · 47% · 22% · 7%): com dados reais, **o que pedem bate com o que vendem**. O tamanho 18 lidera nos dois. A demonstração antiga mostrava o contrário e estava errada.
- **Savana (id 10979):** respondeu em 28/10/2026, DEPOIS do kit de 15/10; marcou tamanhos 14 a 21 (8 tamanhos). O kit dela tinha os tamanhos 10, 11 e 12 (3 anéis) fora dessa lista. Na hora de montar, ela ainda não tinha respondido.
- Rotas que NÃO funcionam com a chave admin: as da revendedora logada (precisam do token dela) e `/representantes/movimentos` e `/listagens`.

## Preferências do kit direto do app, todas as revendedoras (02/11/2026)
- Marcus pediu "de todas, não amostra": a tela Preferências do kit (abas Revendedoras e Análise) lê as 3.025 revendedoras do app (2.045 com respostas), só leitura. Código: `src/server/preferencias-app.js` (leitura do app em segundo plano, tabela `sorelly.preferencia_app`, relê só quem mudou, no máximo 1 vez por dia; primeira carga completa levou 17 s, a segunda 3 s), rota `app/api/preferencias-app/route.js` (só Diretoria), tela `pages/PreferenciasKit.js` (dados só em memória; botão "Atualizar do app").
- Por que não gravar no estado da tela: o navegador já guarda cerca de 3,9 MB do sistema e o módulo `pk` também vai ao servidor; 3.025 revendedoras (cerca de 2,4 MB) estourariam o limite. Sem telefone e sem e-mail no banco.
- Conferido: a Análise mostra 3.025 revendedoras, 2.045 com preferências (67,6%), 980 sem, ouro 50,5% e prata 49,5%; tamanho de anel mais pedido = 18 (58,7%), igual ao painel do próprio app.
- Limites desta versão: somente leitura (editar resposta na tela não grava no app); revendedora do app aparece como "Sem representante" (o app não manda a representante nesta rota; dá para cruzar depois com a DevMaster); quem pode abrir é só a Diretoria.
- Defeito dos contadores do topo (Não preencheram 0, Blocos ativos 0) CORRIGIDO em 02/11/2026: não era a conta, era a animação dos números parada quando o navegador não desenha quadros; a contagem (`lib/contagem-tela.js`) ganhou um relógio de segurança. Conferido: 3.015 revendedoras, 2.042 preencheram, 973 não preencheram, 13 blocos ativos. O total é 3.015 e não 3.025 porque a aba junta nomes repetidos.

## Só quem tem kit ativo + resultado para compras (02/11/2026)
- Marcus: revendedora do app sem kit ativo NÃO aparece e NÃO conta (fica guardada). Regra (corrigida): tem condicional aberto na DevMaster que NÃO seja só expositor ou encomenda (kit principal, kit novo ou reposição) = 2.047 códigos, igual à conta do Marcus. Cruzamento por NOME (o app não manda o código): das 2.042 com kit ativo na DevMaster, 2.003 têm par no app (1.623 com respostas, 81%); 39 não casaram; 1.022 do app sem kit ativo ficaram de fora (422 com respostas). A coluna Representante passou a vir da DevMaster; a tela não mostra mais as listagens de demonstração.
- Resultado para a análise de compras: `docs/negocio/PREFERENCIAS-ANALISE-COMPRAS.md` (quem vende cada tipo, metal, tamanhos de anel, modelos infantil e masculino, composições do colar filhos, letras do colar de letras, palavras das observações).
- Cuidado: nas barras de ouro e prata, 73% a 79% das revendedoras deixaram exatamente 50%. Só cerca de um quarto expressou preferência, e entre essas ficou 53% mais ouro e 47% mais prata. A média 50% e 50% não é confiável.

## Teste com 3 revendedoras: preferências x vendas dos últimos 3 meses (03/11/2026)
Revendedoras: Elisiane (cód. 000696), Franciane Poli (008873) e Cíntia das Graças (001655). Vendas de acerto dos últimos ~3 meses (Leilão, Encomendas e Expositor fora), peças ENVIADAS nos kits de onde elas saíram e o kit de agora (DevMaster, só leitura). Valores a preço de etiqueta.

**Achado 1: as preferências não dizem QUANTO.** Nas 4 que olhamos (as 3 + Savana), quase tudo veio "Ouro + Prata", barra 50/50 (valor padrão) e "vendo: sim". Preferência serve para filtrar (não vende X, só prata, tamanhos, letras), nunca para contar peças. A quantidade vem das vendas.

**Achado 2: o código da revendedora na DevMaster é o id dela no app** (696 = 000696, 1655 = 001655, 8873 = 008873, 10979 = 010979). Os 4 bateram. Se confirmar com mais casos, o cruzamento deixa de ser por nome e as 39 sem par se resolvem. A confirmar.

**Achado 3: o exemplo do Marcus aparece nos números.** Kit parecido em valor, mistura diferente: Elisiane e Franciane receberam kit de R$ 10 mil e R$ 9 mil; a Cíntia, R$ 17,6 mil. Pulseiras no kit de agora: Elisiane 21 (vende 1,3 por venda, giro 7%), Franciane 8 (vende 1, giro 4%), Cíntia 22 (vende 5,7, giro 26%). Giro geral dos kits anteriores: Franciane 6%, Elisiane 14%, Cíntia 33%.

| Revendedora | Vendas nos 3 meses | Vendido (etiqueta) | Kit de agora |
|---|---|---|---|
| Elisiane | R$ 1.499 · R$ 2.072 · R$ 1.406 | R$ 4.744 (56 peças) | R$ 10.010 (132 peças) |
| Franciane | R$ 300 · R$ 1.226 (só 2 vendas) | R$ 1.450 | R$ 8.991 (104 peças) |
| Cíntia | R$ 5.687 · R$ 7.275 · R$ 4.070 | R$ 15.217 | R$ 17.576 (167 peças) |

### Regra PROPOSTA "partes do valor" (sem OK do Marcus)
1. O valor do kit continua pela regra de hoje (média das vendas). Esta regra só decide a MISTURA.
2. Parte do tipo = valor vendido do tipo ÷ valor vendido total, nos últimos 3 meses.
3. Peças do tipo = valor do kit × parte ÷ preço médio da peça do tipo (preço médio enviado nos kits anteriores).
4. Amostra: tipo que ela diz vender e não vendeu nos 3 meses leva 2 peças (parâmetro).
5. Preferências só filtram: "não vendo" = 0 peça; metal só quando ela escolheu um só; anéis só nos tamanhos que vendeu + os que marcou; letras do colar.
6. Trava: mínimo e máximo da tabela "Peças por kit" de hoje.
7. Base fraca (menos de 3 vendas ou venda abaixo de 10% do kit): mistura = metade a dela, metade a tabela padrão.

Resultado (peças por tipo: kit de agora -> proposta):
| Tipo | Elisiane | Franciane | Cíntia |
|---|---|---|---|
| Brinco | 47 -> 39 | 37 -> 23 | 39 -> 60 |
| Colar | 15 -> 22 | 15 -> 21 | 28 -> 31 |
| Anel | 18 -> 13 | 12 -> 8 | 33 -> 31 |
| Choker | 7 -> 11 | 7 -> 14 | 10 -> 13 |
| Pulseira | 21 -> 7 | 8 -> 10 | 22 -> 22 |
| Masculino | 5 -> 6 | 8 -> 3 | 10 -> 9 |
| Infantil | 11 -> 8 | 3 -> 2 | 6 -> 6 |
| Conjunto | 3 -> 3 | 4 -> 2 | 6 -> 3 |
| Total | 130 -> 113 | 99 -> 87 | 161 -> 181 |
O valor em R$ do kit fica igual (diferença de menos de R$ 150).

Anéis (tamanho): Elisiane vendeu 18, 21 e 23 e marcou 18 a 25; o kit de agora levou 14 e 16 (3 peças que ela não vende). Cíntia vendeu do 16 ao 21; o kit de agora levou 8 do tamanho 22 e 6 do 25 (vendeu 2 e 0). Franciane vendeu 21 e 22 e marcou 12, 13 e 22; o kit de agora levou 28 (2 peças).

Pendências: Franciane tem base fraca (2 vendas); Savana é nova e ainda não vendeu, então vai de tabela padrão.

### CORREÇÃO (03/11/2026): o valor do kit vem das TABELAS que já existem (a regra "partes do valor" acima fica substituída)
O Marcus lembrou: valor do kit e peças por kit já têm tabela em `domain/config.js`. A regra nova SÓ remaneja as peças da tabela conforme o que a revendedora vende; o total e o valor ficam os da tabela.
1. **Média** das 3 últimas vendas (regra de `MEDIA-DE-VENDAS.md`). Média oficial dos 3 testes (sem brinde): Elisiane R$ 1.581 · Franciane R$ 668 · Cíntia R$ 5.096.
2. **Valor do kit** = `tabelaKit` pela média (tabela "alto"; a "baixo" é a outra): a partir de R$ 5.000 → R$ 20.000 · 4.000 → 17.000 · 2.500 → 15.000 · 1.600 → 12.000 · 1.000 → 10.000 · 700 → 8.000 · 400 → 6.000 · abaixo → 5.000. Resultado: Elisiane R$ 10.000 · Franciane R$ 6.000 · Cíntia R$ 20.000.
3. **Peças por tipo** = linha do valor em `pecasKit` (a tabela "Peças por kit"). Ela é igual para todas do mesmo valor: esse é o problema.
4. **Regra proposta:** fator do tipo = (parte dela nas vendas) ÷ (parte do tipo na tabela), com limite de 0,4 a 2,5; peças = tabela × fator, ajustado para manter o total de peças da tabela; mínimo de 2 peças por tipo que ela vende.
5. A trava de mínimo e máximo da tabela e os filtros das preferências continuam como estavam.

Resultado em peças (tabela -> proposta). Tipos agrupados: Colar = colares ouro e prata + choker; Pulseira = pulseiras + bracelete; Brinco = grandes, B, Select (BB) e trios.
| Tipo | Elisiane (kit R$ 10 mil) | Franciane (R$ 6 mil) | Cíntia (R$ 20 mil) |
|---|---|---|---|
| Colar | 20 -> 36 | 12 -> 29 | 40 -> 50 |
| Pulseira | 20 -> 11 | 12 -> 9 | 40 -> 27 |
| Brinco | 51 -> 40 | 35 -> 26 | 85 -> 81 |
| Anel | 17 -> 13 | 11 -> 9 | 33 -> 41 |
| Conjunto | 4 -> 5 | 2 -> 2 | 8 -> 4 |
| Infantil | 4 -> 10 | 3 -> 2 | 8 -> 10 |
| Masculino | 4 -> 7 | 3 -> 4 | 8 -> 13 |
| Tornozeleira | 3 -> 2 | 2 -> 2 | 6 -> 2 |
| Total | 123 -> 124 | 80 -> 83 | 228 -> 228 |
Cuidados: o choker precisa de linha própria na tabela (hoje não existe: por isso o Colar da Franciane sobe tanto); Franciane tem base fraca (2 vendas na janela).
**Achado:** o kit de agora da Franciane na DevMaster é R$ 9.016, mas a tabela dá R$ 6.000 pela média dela (R$ 668). Cíntia: kit R$ 17.600, tabela R$ 20.000. Elisiane: R$ 10.022, tabela R$ 10.000. Conferir por que o kit da Franciane saiu maior que a tabela.

## Caso Elisiane (cód. 000696): próximo kit se ela vender R$ 2.400 (03/11/2026)
**Hoje:** vendas (sem brinde) 09/10 R$ 1.428 · 11/09 R$ 1.972 · 10/08 R$ 1.344 = média R$ 1.581 -> `tabelaKit` dá kit de **R$ 10.000** (alto).
**Se vender R$ 2.400 no próximo acerto:** entram 2.400, 1.428 e 1.972 (sai 1.344) = média R$ 1.933 -> faixa de R$ 1.600 -> kit de **R$ 12.000** (alto; na tabela baixo seria R$ 10.000). Linha de R$ 12.000 em `pecasKit`: 139 peças (colares 12+12, pulseiras 12+12, conjuntos 2+2, trios 2+2, brincos grandes 6, B 24, BB 20, anéis 20, infantil 4, masculino 5, tornozeleiras 2+1, flanela 1).
**Vendido nas 3 últimas vendas (56 peças):** colar+choker 16 (6 ouro/10 prata) · BB 10 · pulseira+bracelete 5 (todas prata) · brinco comum 5 · anel 6 (tamanhos 21:3, 23:2, 18:1) · infantil 6 · trio de argolas 3 · masculino 3 · conjunto 1 · tornozeleira 0 · pingente 1 · flanela 0.
**Pediu no app (06/10):** anéis 18 a 25 (e na observação "23/25/25"); duo de argolas e argolas bem pequenas; letras F (prata), J, L, M (prata), S (ouro); infantil: brincos e conjuntos; masculino: pulseiras e correntes; vende flanela, material de apoio, tornozeleira, bracelete, pingente avulso; colar filhos todos; metal: "Ouro + Prata" em tudo e barra 50/50 (padrão).
**Proposta (12k, regra do fator com limite 0,5 a 1,5, total fechado em 138 peças + 1 flanela):**
| Tipo | Tabela | Proposta |
|---|---|---|
| Colar (com choker) | 24 | 39 |
| Pulseira (com bracelete) | 24 | 14 |
| Conjunto | 4 | 3 |
| Trio de argolas | 4 | 7 |
| Brinco (grandes + B) | 30 | 16 |
| Brinco Select (BB) | 20 | 27 |
| Anel | 20 | 16 |
| Infantil | 4 | 6 |
| Masculino | 5 | 8 |
| Tornozeleira | 3 | 2 |
Metal: pulseira quase toda prata (4 ouro e 10 prata); colar 17 ouro e 22 prata; anel 7 ouro e 9 prata; os outros tipos 50/50. Anéis (16 peças da proposta, sobre 20 da tabela se a regra do anel da tabela valer): tamanhos 18:2 19:1 20:1 21:6 22:1 23:6 24:1 25:2 (vendeu 18, 21 e 23; marcou 18 a 25; observação pede 23 e 25). Letras do colar: F, J, L, M, S. Duo de argolas pequenas, infantil em brincos e conjuntos, masculino em pulseira e corrente.
**Cuidados:** (a) as linhas "Brincos grandes" e "Brincos (B)" da tabela não têm definição: juntei as duas e comparei com os brincos comuns (grupo 02); (b) choker entra com colar até o Marcus decidir; (c) a venda de R$ 2.400 foi suposta com a mesma mistura das 3 anteriores; (d) sem limite (0,4 a 2,5) o colar iria a 41 e o brinco a 13: o limite 0,5 a 1,5 é mais seguro para começar.

## O que dá para puxar de VENDAS no app da revendedora (03/11/2026, só leitura, chave de administrador)
- **Dá:** totais da conta (clientes, pedidos, valor vendido, peças vendidas, último pedido), vendas por mês com valor, peças e ticket por peça (`GET /admin/resellers/:id/monthly-history`), e os 10 últimos pedidos com data, status, forma de pagamento e nome da cliente (`GET /admin/resellers/:id`).
- **Não dá:** a lista das PEÇAS de cada pedido (tipo, metal, tamanho, preço). Essas rotas só abrem com o login da própria revendedora (401 com a chave de administrador; `/admin/resellers/:id/sales` e `/items` não existem). Para o Kit perfeito ler peça por peça do app, o Leonardo precisa criar uma rota de leitura de administrador.
- **Conferência (Elisiane 000696):** app = 56 peças e R$ 4.560 no total; DevMaster = 56 peças e R$ 4.744 nas 3 últimas vendas. Bate. Por mês não bate (o app conta a data do pedido da cliente; a DevMaster conta a data do acerto): out. R$ 1.604 x R$ 1.499 · set. R$ 920 x R$ 1.972 · ago. R$ 394 x R$ 1.344. Cíntia (001655): app 204 peças e R$ 17.107; DevMaster 3 últimas vendas R$ 15.217.

## Mais 3 revendedoras que gostaram do kit (09/11/2026): Paula, Giovana e Juliana
Marcus mandou os nomes (Paula Daniele de Faria 008861, Giovana da Silva Pressel 009825, Juliana Dias Lopes 009028). Mesma conta do caso Elisiane: média oficial -> `tabelaKit` (alto) -> `pecasKit` -> fator 0,5 a 1,5. A linha de R$ 17.000 não existe em `pecasKit`: usei a média das linhas de R$ 16 mil e R$ 18 mil.
| | Paula | Giovana | Juliana |
|---|---|---|---|
| Vendas (3 meses) | R$ 5.972 · 4.234 · 4.816 | R$ 1.437 · 1.383 · 2.437 | R$ 2.946 · 1.256 · 1.292 |
| Média (sem brinde) | R$ 4.903 | R$ 1.652 | R$ 1.736 |
| Kit pela tabela | R$ 17.000 | R$ 12.000 | R$ 12.000 |
| Kit enviado agora | R$ 15.516 | R$ 11.961 | R$ 12.046 |
| Giro dos kits anteriores (tipos mais altos) | conjunto 57%, infantil 55%, brinco 29% | conjunto 33%, infantil 30%, brinco 18% | masculino 45%, choker 33%, infantil 33% |
Proposta (peças por tipo, tabela -> proposta): Paula: colar 34->41, pulseira 34->17, conjunto 6->9, brinco 75->87, anel 28->18, infantil 7->11, masculino 7->10, tornozeleira 4->2. Giovana: colar 24->25, pulseira 24->17, conjunto 4->4, brinco 54->68, anel 20->12, infantil 4->6, masculino 5->2, tornozeleira 3->4. Juliana: colar 24->39, pulseira 24->23, conjunto 4->2, brinco 54->45, anel 20->12, infantil 4->7, masculino 5->8, tornozeleira 3->2.
**Padrões das 6 (Elisiane, Franciane, Cíntia, Paula, Giovana, Juliana):** em todas a tabela manda pulseira e anel a mais do que elas vendem (pulseira cai de 24 para 11-23; anel de 20 para 12-18) e brinco e colar a menos. Gostar do kit NÃO quer dizer giro alto: a Giovana gostou e vende só 8% a 18% do que recebe nos tipos principais. Preferências da Giovana: não vende bracelete nem pingente; pediu piercing, colar verde, anel ponta de dedo e anel tamanho 25 na observação; conjunto só prata. Juliana: letras B, D, J em ouro e L nos dois; masculino só prata. Paula: letras A, T (os dois), F (prata), H (prata), R (ouro).
