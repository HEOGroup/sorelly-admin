# Regras: produção e cadastro de peças (vigentes em 25/11/2026)

Documento ÚNICO e vivo. Escrito a partir das mensagens do Marcus de 28/09 a 24/11/2026 e do código.
Só a regra de HOJE. A mensagem mais nova vale sobre a antiga. Texto antigo não vale. Entre esta regra e o código: regra e código divergem? Não escolha um lado sozinho: registre em "Não alinhado" e, em dinheiro, jurídico, fiscal, trabalhista ou acesso, pergunte ao Marcus.
Sem valor individual de pagamento, sem chave Pix, sem CNPJ, sem preço de fornecedor (isso fica em arquivo `.local`, fora do Git).
Marcação: **[FEITO]** já no sistema · **[FEITO LOCAL]** pronto na pasta de trabalho, ainda sem commit ou sem publicar na master · **[A CONSTRUIR]** decidido, falta construir · **[A CONFIRMAR]** o Marcus não decidiu.
Fica FORA daqui (já em `docs/regras/FORNECEDORES-E-COMPRAS.md`): compra de bruto, banho, negociação e pagamento a fornecedor. Aqui só se cita.
Pendências, regras que não batem e regras duplicadas: `docs/pendencias/producao-e-pecas.local.md`.

## 1. Resposta direta
- **Cadastro de peças** é setor próprio (Rayssa e Graziella). Recebe a peça do banho, pesa, calcula custo, sugere preço. O Marcus aprova preço, tag e código.
- **Produção** é setor próprio desde 16/11/2026. Tem 3 grupos: interna da Sorelly, interna da Serenity e produção externa (pessoas que fazem peça em casa).
- **Material gráfico** é setor próprio (17/11/2026). O fornecedor único é a Office Graf.
- Tudo que o Marcus pede nesta área segue o padrão visual do Financeiro (azul, compacto, sem faixa de totais no topo, filtro na coluna). Ver seção 10.

## 2. Quem é quem
| Função | Quem hoje | O que faz |
|---|---|---|
| Cadastro de peças | Rayssa (supervisora), Graziella | Lança pedido de bruto e fatura de banho, pesa, cadastra, pede alteração à DevMaster, responde pedidos de peça da produção |
| Compras e negociação | Nickolas | Lança pedidos de banho e negociações. Ver `FORNECEDORES-E-COMPRAS.md` |
| Preço, tag e código | Marcus (Diretoria) | Aprova o preço e escolhe a tag e o adesivo |
| Produção interna | Deysiane (supervisão), Crisbele (supervisora da sala da Serenity) e funcionárias da produção | Fazem as peças; lançam o que fizeram no dia |
| Produção externa | Dávila (mulher do Igor), Leci (funcionária), Didi (tia do Marcus) e as pessoas listadas na tela Cadastro da Produção | Fazem peça em casa; o Igor (e a Deysiane) levam e buscam |
| Material gráfico e estoque de material | Amanda (fotos e contagem de embalagens), Nickolas (pedidos), Geovana (contagem) | Ver seção 7 e 8 |
| Pagamento (Pix revendedora) | Lucas, pelo Direcionar | Paga o que a Produção manda ao Financeiro |
- **Dávila é a mulher do Igor. Leci é funcionária.** São pessoas diferentes. Nunca trocar.
- Quem faz peça e também é funcionária (Crisbele, Leci) tem DOIS registros: o pagamento da empresa e o pagamento como prestador. Ver `docs/pessoas/producao-externa.local.md`.
- Acesso é por setor e perfil. Funcionária da produção vê só a aba Produção. Produção externa, Pagamento por produção e Cadastro exigem a autorização `producao_externa` ou `producao_ver`. Envio e devolução exigem `producao_envio`.

## 3. Caminho da peça (resumo)
```
COMPRA E BANHO (ver FORNECEDORES-E-COMPRAS.md)
   │  12 etapas em 3 fases (Compra, Banho, Empresa)
   ▼
CHEGOU NA EMPRESA ─► PESO ─► CADASTRO ─► PREÇO (Marcus) ─► TAG/ADESIVO (Marcus) ─► CÓDIGO ─► ETIQUETA
                                │
                                ├─► DevMaster (código e preço)
                                └─► FOTO de catálogo (Marketing)
   ▼
PRODUÇÃO (montar a peça: Sorelly, Serenity ou externa) ─► ESTOQUE ─► MONTAGEM DE KITS
   ▲
   └── PEDIDO DE PEÇAS da produção ao cadastro (aba Solicitações)
```
- A produção NÃO recebe só o que o cadastro lançou ao acaso. Quando precisa de peça específica (pulseira ouro, brinco infantil, masculino), pede pela aba Solicitações (seção 4.7).
- Regra para uma peça ir à produção da Sorelly ou da Serenity: **[A CONFIRMAR]**.

## 4. Cadastro de peças

### 4.1 Telas [FEITO]
Menu do setor (`navigation/setores.js`, `MENU_CADPECAS`): Pedidos (Compras de Bruto, Pedidos Banho/Bruto) · Peças · Banho (Tabela do banho, Faturas, Retirar ouro) · Cadastro (Solicitações, Planilhas de cadastro, Calculadora, DevMaster) · Fornecedores · Configurações.
- A primeira aba "Compras" foi excluída do menu em 17/11/2026 (pedido do Marcus de 13/11).
- Tela **Peças** (17/11): cartões por categoria nas etapas Falta comprar → Comprado → No banho → Na empresa → Estoque. Falta comprar e Estoque vêm da DevMaster (só leitura).
- Quem faz cada atividade vem de Configurações (`config.quem`): lançar pedidos de bruto e romaneios, lançar faturas de banho e retirar ouro, calcular custo e cadastrar, pedir alterações à DevMaster, responder pedidos de peças da produção.

### 4.2 Pedido de bruto: status e Parcial [FEITO]
- 12 etapas (ver `FORNECEDORES-E-COMPRAS.md`, seção 2). O pedido só anda com o romaneio anexado.
- **Parcial:** não é uma etapa. A Rayssa lança "Peças que chegaram" na ficha. Se chegou menos do que o pedido, o pedido mostra "Parcial: chegaram X de Y, faltam Z" e **não finaliza** até chegar tudo. Pedido sem essa marca = chegou tudo.
- Ao chegar na empresa, a Rayssa digita o valor do banho e anexa a foto da fatura (obrigatório). Fatura única para vários pedidos: dividir em PARTES IGUAIS. Fecho é banhado.

### 4.3 Peso, custo e preço [FEITO]
| Item | Regra |
|---|---|
| Peso | A Rayssa lança o peso e sobe o romaneio. O sistema calcula o resto |
| Banho unitário | peso × R$/g do tipo de banho (tabela da fatura da galvânica, já com +10%). Desconto de pedra (%) abate só o banho |
| Verniz da Pontual | valor por grama somado em todo ouro. Peça com rivieira não leva verniz |
| Custo | preço do bruto (romaneio) + banho |
| Etiqueta e embalagem | entram só na DevMaster (valores unitários pequenos, fora do custo do sistema) |
| Banho padrão por tipo | Anéis: Ouro 4 · Colares, braceletes, pulseiras e correntes: Ouro 3 · Peças de prata: só "Prata" (sem nível) |
| Ouro 556-1 (Ellos) | é só Ouro 1 (1 milésimo). Prata 50 é só Prata |
| Banho do bruto | Point e Mega Sul vão à Pontual. Art Ello, Xangai, Linda, Tucano e Charme vão à Ellos |

### 4.4 Preço e markup [FEITO a base; faixas A CONFIRMAR]
- **A Sorelly recebe 54,86% do preço de venda** (o resto fica com a revendedora, em média). O markup é calculado em cima desses 54,86%: `markup = (recebido − custo) ÷ custo`. Configuração: `config.recebido` em `domain/cadastro-pecas.js`.
- **Markup alvo hoje: 275%.** Preço sugerido = o menor preço que bate o markup alvo, arredondado para cima, terminando em 8.
- O sistema mostra o markup do lote (ponderado pela quantidade), por pedido, e compara fornecedores (qual é mais barato).
- **Quem decide o preço final é o Marcus.** O sistema só sugere. A resposta chega pelo SorellyChat.
- **Preços atuais ficam como estão por enquanto** (20/10/2026): o Marcus baixou um pouco o preço e a média de acerto subiu de cerca de R$ 600 para a faixa de R$ 780 a R$ 800.
- O Marcus usava markup perto de 400% e quer BAIXAR para vender em escala (muita revendedora, muita peça). As faixas de markup por tipo de peça: **[A CONFIRMAR]**.
- **Peça de luxo:** é separada para o Marcus ver antes de ir ao estoque. Definição e cálculo de markup: **[A CONFIRMAR]**. Revendedora com média de R$ 2.000 ou mais pode ver peças de luxo na sala do Marcus (regra de 22/10, setor de encomendas).

### 4.5 Código da peça [FEITO como regra; A CONFIRMAR em partes]
- O código **vem em sequência da DevMaster**. A Rayssa não inventa.
- Formato: **letras da categoria primeiro** (A, B, CL, P, BB, CC, CK, I, M, T, COL, SP, 2B...), **depois o número**.
- **Anel** tem um código por modelo e um por TAMANHO. Exemplo: `A2357014` é o código inteiro. `A2357` é o modelo, e vale UMA foto só para todos os tamanhos. Os 3 últimos números são o tamanho: o 0 é o corte e os 2 números finais são o tamanho (014 = tamanho 14; 026 = tamanho 26). A palavra é "tamanho", nunca "aro".
- **BB não é só brinco.** Toda peça cujo código começa com BB (BB, BBA, BBP, BBCL, BBT, BBI...) é brinde Select. Os exemplos não esgotam: podem existir outros códigos.
- Busca por código: não diferencia maiúscula de minúscula; o sistema grava em maiúscula.
- Regra de validação de código no acerto (`domain/consignado.js`): até 4 letras e até 7 números. **[A CONFIRMAR]** se a regra cobre códigos que começam com número (ex.: 2B0133). Hoje ela não cobre.
- **Padrão de cadastro** (nome, cor da pedra, desenho): nunca existiu. Marcus: alinhar "daqui pra frente". Os grupos da DevMaster dão o tipo (01 anel, 02 brinco, 03 conjunto, 04 colar, 05 infantil, 06 pulseira, 10 masculino, 19 brinco, 34 choker, 38 collection, 45 bracelete). Trio de brincos é tipo à parte. Tipos citados pelo Marcus: ponto de luz, abs (bola lisa), orgânico (liso ondulado), aparador (aliança que segura outro anel), piercing fake (tipo de brinco), diversos (código para peças aleatórias).

### 4.6 Tag, adesivo e etiqueta [A CONSTRUIR]
- **Tag da peça** (premium, collection, borboleta, masculina...) e **adesivo** (promo, super promo, mega promo): a escolha é do Marcus, junto com o preço, por MODELO. Lista fixa; pode criar tag nova. A regra de quando usar cada uma ainda não existe.
- Hoje o sistema só tem uma lista curta no chat de preço (`TAGS_PECA` em `domain/preco-pecas.js`: sem tag, collection, promo). Não cobre a lista do Marcus.
- **Etiqueta** é gerada pela Rayssa depois do preço definido. Não existe tela de etiqueta no Cadastro de peças.
- Não confundir com a **tag de papel** (material gráfico, seção 7): é outro assunto, ligado ao estoque de material.
- Peça liberada pode ir direto ao estoque, ou ser separada para o Marcus (luxo), ou ir para a foto do Marketing.

### 4.7 Solicitações: a produção pede peça ao cadastro [FEITO]
- Pedido = tipo de peça + banho + público (feminino, infantil, masculino) + quantos modelos + urgência + texto livre.
- Quem pede: Deysiane (aba Pedir peças em Kits) e as montadoras (app da montadora).
- Quem responde: Rayssa e Graziella, na aba **Solicitações**. Respostas: **OK (vai produzir)**, **Pronto**, **Não temos** (com motivo curto). Quem pediu recebe aviso com som.
- Fornecedor não entra nessa troca. A Deysiane também cuida das listagens e tem aba própria.

### 4.8 Pedido de alteração à DevMaster [FEITO]
- Estados: Pedido → Enviado à DevMaster → Feito. A Rayssa é a responsável. Grupos e classes que não se usam mais devem ser inativados na DevMaster.

## 5. Fotos de catálogo (ligação com o Marketing)
Detalhe em `docs/arquivo/pendencias-por-conversa/marketing-fotos-de-catalogo.md`. Regras de hoje:
- O cadastro separa UMA peça de cada código novo e leva ao Marketing às **11h e às 15h**, em ziplock com data e hora.
- O Marketing fotografa; o Castilho marca na DevMaster as peças com foto; outra pessoa edita e sobe a foto na DevMaster.
- Peça nova sem exceção precisa de foto. Código antigo sem estoque pode ficar para trás.
- O OK de "subiu na DevMaster" é dado no sistema (coluna Sistema), não mais na planilha. Códigos novos vêm da DevMaster sozinhos.
- Meta e bônus de fotos: definição aberta (ver pendências).

## 6. Produção

### 6.1 Telas [FEITO LOCAL em parte]
Menu: Produção · Produção externa · Pagamento por produção · Envio e devolução · Cadastro.
| Tela | O que mostra |
|---|---|
| Produção | Grade do mês: uma linha por funcionária, uma coluna por dia, o número é quantas peças fez. Total no fim. Domingo cinza, hoje dourado. Duas tabelas coladas: empresa (Sorelly e Serenity) e casa. Visão Peças ou Dinheiro |
| Produção por modelo (só Diretoria) | Cada código vem da DevMaster com custo e preço. Dia ou mês. Agrupado por tipo (anel, brinco, colar...). Busca e ranking de produtividade (peças por dia ou valor por dia). Bloco de estoque total, valor de venda e custo, com botão para ver o de cada pessoa |
| Produção externa | Só controle de peças: Estoque com ela e Movimentações por dia, em cartão |
| Pagamento por produção | Escolha da pessoa e do mês. Dinheiro, Peças e Com ela agora. Uma linha por dia. Vale para externas e internas. Opção Total (todas) |
| Envio e devolução | Nota de saída (NS) e nota de devolução (ND) numeradas, copiáveis para o WhatsApp |
| Cadastro | Funcionárias e códigos e categorias (só Diretoria) |
- A aba Premiação foi **apagada** em 23/11/2026. As faixas ficam no código. O Marcus pediu só as regras para passar às funcionárias.
- O nome na tela é **Produção externa**, nunca "casa". A chave interna `CASA` não muda.

### 6.2 Produção interna (Sorelly e Serenity) [FEITO]
- A funcionária lança código e quantidade; o **preço vem sozinho** do último lançamento do código. Ela lança todos os códigos da funcionária de uma vez e a unidade (Sorelly ou Serenity) uma vez só.
- **Dia só conta como trabalhado com pelo menos 100 peças.**
- **Bônus por dia (cada dia vale por si; não existe bônus do mês):**
  | Peças no dia | Bônus |
  |---|---|
  | 300 a 349 | R$ 15,00 |
  | 350 a 399 | R$ 20,00 |
  | 400 ou mais | R$ 25,00 |
  | menos de 300 | nada |
- **Supervisora da sala da Serenity (Crisbele):** as três faixas ficam 100 peças mais baixas (200, 250, 300). Meta por dia 200. Para outra supervisora, acrescentar o primeiro nome em `SUPERVISORAS`.
- **Pagamento do bônus:** em DINHEIRO, no **dia 12 do mês seguinte**, ou na segunda-feira se cair no fim de semana. Vai ao Contas a pagar com forma Dinheiro depois que o mês fecha. (Marcus disse "dia 11" em 18/11 e "dia 12 ou dia útil" em 23/11; vale o código: 12. **[A CONFIRMAR]**.)
- **Dia travado:** a funcionária só altera hoje e o dia útil anterior. Quem já lançou o dia não muda mais. Erro: "pedir correção" ao Marcus. Só a Diretoria altera dia mais antigo. Vale na tela. A **trava no servidor** não está ligada **[A CONSTRUIR]** (já apagou linha 4 vezes quando uma página velha gravou por cima).
- Dávila, Didi e quem é externa ficam **fora do bônus**. Dávila aparece PRIMEIRO na grade, só para a Diretoria. As meninas da produção não veem a linha dela.
- Produção da Serenity e produção em casa são coisas diferentes. Quem faz as duas (Crisbele) aparece em duas tabelas: em cima a Serenity (paga pela regra da produção: bônus do dia, dinheiro dia 12); embaixo a casa (paga R$ 0,45 por peça, Pix na quinta).

### 6.3 Produção externa [FEITO LOCAL em parte]
- Quem: Dávila, Leci, Didi, Crisbele, Amanda de Miranda, Michele e as que vierem. Cada uma é prestadora no Financeiro (banco e chave Pix ficam na ficha local). O Higor aparece em uma lista de 24/11, mas aquela produção era da Dávila: **[A CONFIRMAR]** se o Higor produz.
- **Pagamento: R$ 0,45 por peça, sem valor fixo, a partir de 16/11/2026. Vale para todas.** Antes de 16/11 a Dávila recebia uma diária fixa por dia trabalhado.
- **Ciclo:** de TERÇA a SEGUNDA (a segunda entra). Fecha na segunda e paga na **QUINTA** seguinte, por **Pix de revendedora**, pelo Direcionar. Exemplo do Marcus: trabalha domingo, entrega segunda, recebe quinta.
- **Peça por PAR:** 1 unidade para o pagamento = 1 par de brincos ou 1 trio. Quem contou brinco solto contou o dobro (caso de 24/11). Brinco duo e trio contam 1. Regra decidida; não há trava no sistema **[A CONSTRUIR]** se o Marcus quiser.
- **O que a pessoa tem em mãos é ESTOQUE, não dinheiro.** Só vale o que ela entrega. O "pago" vem do Contas a pagar; não há botão "Marcar pago" na Produção.
- **Envio e baixa são automáticos (24/11).** O sistema cria o pedido do prestador, a conta a pagar e o destino no Direcionar. Atualiza o valor enquanto nada foi pago. Quando o Direcionar paga, dá a baixa. Não duplica.
- **Excedente do Pix** vira crédito da próxima semana. O Lucas tenta não passar de um limite curto por Pix (`LIMITE_EXCEDENTE`).
- **Estoque da externa = enviado − devolvido.** Cada envio é lançado (data, código, quantidade). A devolução vem da grade ou da nota de devolução.
- **Nota de saída (NS) e nota de devolução (ND):**
  | Nota | Campos |
  |---|---|
  | Envio | data, quem leva, código, quantidade enviada, responsável pelo envio |
  | Devolução | data, quem devolve, código, quantidade produzida, devolvida sem produzir, com defeito, responsável pelo recebimento |
  Quem preenche: Diretoria e quem tem `producao_envio` (Crisbele e Deysiane). O envio entra no estoque da pessoa; a devolução baixa o estoque e a produzida vira lançamento.
- Ao selecionar a Dávila no Financeiro, a mensagem sai no formato "PIX PRODUÇÃO DE PEÇAS" + nome + chave + banco (dados na ficha local). **[Regra de 26/11/2026, ver `NUMERARIOS-ADMIN-X-DEVMASTER.md` R5: o numerário que vai na DevMaster para a produção de peças é "Pix Produção de Peças" (PPP). O código ainda usa texto fixo; passar a ler o numerário da conta.]**
- Valor "a receber no mês", "já recebido" e "a receber" deve aparecer na tela da pessoa.
- **Mensagem copiável para as produtoras** (com negrito e relatório) é gerada a pedido do Marcus.
- O Marcus quer, ao clicar na prestadora na negociação, ir direto à tela das negociações. E a negociação de cada prestador com tipo próprio: o da Dávila deve ser simples.

### 6.4 Regras que o Marcus cobrou e continuam valendo
- Não pode editar lançamento depois de enviado: pede ao Marcus.
- Nomes sempre com maiúscula e minúscula normais.
- Sem texto explicativo grande na tela ("ninguém lê"). Regras vão para um bloco curto ou para o Marcus repassar por mensagem.
- Sem dourado forte nas telas da produção. Mesmo visual das Negociações (azul, blocos colados, linha branca fina).

## 7. Material gráfico

### 7.1 O setor [FEITO]
Resumo em `docs/setores/material-grafico/LEIA-ME.md`. Menu: Painel · Compras · Tabela de preços · Estoque · Kits · Vendas.
```
Novo material → Orçamento (negociação) → Solicitado ao financeiro → Produzindo → Estoque
```
| Parte | Estado |
|---|---|
| Painel (kanban de cards) | [FEITO] |
| Compras (funil de orçamentos, mensagem copiável, rodadas) | [FEITO] |
| Tabela de preços | [FEITO] |
| Estoque | [FEITO] |
| Kits (fase 2: custo e preço de venda) | [FEITO] a aba lista os kits prontos; custo, preço e margem [A CONSTRUIR] |
| Vendas (fase 3) | [A CONSTRUIR] |
- **Fornecedor único: Office Graf** (contato Edson). Movimenta bastante dinheiro. Ello Print é de tintas, outro fornecedor.
- Compra de material gráfico segue em **Materiais e estoque**; o setor lê os pedidos e cria pedido a partir de orçamento fechado.
- O Marcus quer MENOS abas, texto curto, cada material como card (não tabela).

### 7.2 Painel: colunas [FEITO]
| Coluna | Regra |
|---|---|
| Não pedir mais (1ª, oculta) | Material parado. Volta a ser pedido reativando em Materiais e estoque |
| Novos materiais | Produto novo sem estoque e sem orçamento |
| Solicitado ao financeiro | Pedido esperando aprovação |
| Produzindo | Pedido aprovado, em transporte ou recebido |
| Sem estoque · Abaixo do mínimo · Perto do mínimo (até 130% do mínimo) · Estoque OK | Só material sem pedido aberto |
- Card: foto, nome padronizado em 2 linhas, preço unitário, quantidades e situação. Sem foto = um X pequeno. Filtros: tipo, modelo, foto, coluna, ordenar.
- Tipos: Tags, Embalagens de presente (bolsinhas, sacolas, envelopes, caixas), Maletas, Embalagens plásticas, Etiquetas, Cartões e blocos, Adesivos e cordinhas.

### 7.3 Nome padronizado [FEITO]
**Item · Modelo · Tamanho · Cor · Linha.** Na tela vira 2 linhas ("Tag Man / Mini", "Azul / Padrão"). O coração só existe em Mini. Floréa é uma tag só (Conjunto). Flower é outra, e o estoque dela deve ser separado por cor. BB Select é linha. A "tag prata (média)" é a Trio. Trocar nome sempre junto em estoque, pedidos e preços, e registrar em `docs/setores/material-grafico/renomeacao-18-11-2026.md`.

### 7.4 Regras de venda do material (visão do Marcus) [A CONSTRUIR]
Vender material gráfico, com prazos, e kits padrão. Receber de cada fornecedor um catálogo com foto reta, fundo branco, material montado. Preço e margem do kit: **[A CONFIRMAR]**.

## 8. Estoque de materiais, kits de Natal e bolsinhas

### 8.1 Estoque de material [FEITO]
- Telas: Materiais e estoque › Compras e estoque de material (estoque em cima, quadro de Compras embaixo, layout D1 de 09/11) e Material gráfico › Estoque.
- **Estoque de material e Compras** é um assunto. **Estoque Sorelly** (peças a preço de venda, mês a mês, números altos) é outro e mora no **Financeiro**.
- Perfis: grupo "Estoque de materiais" vê só as 2 telas de Estoque. Capacidades: Contagem, Compra e Aprovação. Quem aprova compra e marca material como parado: o financeiro (**[A CONFIRMAR]** para a Geovana).
- Compra: Solicitada → Análise financeira → Liberada para compra (Nickolas, 18/11). Detalhes em `docs/setores/materiais-e-estoque/decisoes.md`.
- Contagem física de maletinhas, bolsinhas e embalagens: pedida ao Nickolas.
- **Estoque de limpeza, de sorvete e a lista do Estoque Sorelly perderam os itens em 11/11/2026.** Sem cópia. **[A CONFIRMAR]** como refazer (ver pendências).

### 8.2 Kits de Natal e bolsinhas [FEITO LOCAL]
- **Embalagem de Natal** (travesseiro/almofada 135x90 mm, com cordinha) é para VENDA em kit, não é brinde. Tem a bolsinha creme e a vermelha.
- **Kit apoio bolsinhas de Natal:** 5 bolsinhas, **R$ 10,00 o kit, sem comissão**. A Rayssa cadastrou o produto na DevMaster (código MP0063). O Marcus distribui entre as vendedoras; antes é preciso saber quantos kits de apoio serão feitos **[A CONFIRMAR]**.
- **No app e no acerto:** o kit apoio é peça à parte. O valor SOMA ao que a revendedora paga e fica fora de venda líquida, faixa, comissão, brinde, taxa e meta. A representante marca no acerto (código `domain/kit-apoio.js`).
- Limite de kits apoio por acerto: o código usa 500. **[A CONFIRMAR]**.
- Kits prontos de embalagem (preto e dourado; com prata) são montados pela Amanda e seguem a lista de itens por kit (1 bolsinha dourada, 1 preta ou prata, 2 almofada, 4 envelope). Números ficam em arquivo local.
- Pedido de embalagem de Natal e envelopes segue o fluxo: orçamento → solicitado ao financeiro → produzindo → estoque. Quantidade pedida e quantidade recebida podem diferir; o estoque é o que chegou.

## 9. Pessoas e dinheiro da produção (resumo)
| Tipo | Como recebe | Quando |
|---|---|---|
| Interna (Sorelly, Serenity) | Salário + bônus por dia (dinheiro) | Bônus no dia 12 do mês seguinte |
| Externa | R$ 0,45 por peça, Pix de revendedora | Quinta (ciclo terça a segunda) |
| Quem faz as duas (Crisbele) | Os dois, em registros separados | Cada um na sua data |
- O que foi feito ontem e entregue paga na semana seguinte. Só Dávila e Leci tinham dívida da semana corrente em 24/11.
- Nada é "pago" sem confirmação do Direcionar.

## 10. Padrão de tela (resumo do que o Marcus cobrou nesta área)
- Fonte 13 px fixa, campo e botão 32 px (as telas da produção usam linha compacta de 22 px, exceção aprovada).
- Filtro só no cabeçalho da coluna (igual ao Google Planilhas). Nada de bloco "Filtros" no topo.
- Sem faixa de totais no topo; total no fim da tabela, em fonte normal.
- Nada abreviado, tudo centralizado, R$ em todo valor.
- Escolha = menu suspenso, nunca chip.

## 11. Perguntas abertas (máximo 3)
1. As **faixas de markup** por tipo de peça: quais valem, já que o alvo de 275% está no código e o Marcus quer baixar o 400% de antes?
2. O **pagamento do bônus interno** é no dia 11 ou no dia 12 do mês seguinte?
3. Quem **decide e refaz** os itens perdidos do estoque de limpeza, sorvete e Estoque Sorelly (Nickolas ou a Rayssa)?

## Decisão do Marcus em 26/11/2026 (3 produções, valor por peça e pagamento) — VALE NO LUGAR DA DE 25/11 ABAIXO
- [FEITO no código] Valor por peça da externa: R$ 0,45 para todas até a entrega de segunda 30/11/2026. Da entrega de terça 01/12/2026 em diante: Dávila, Leci e Didi R$ 0,45; as demais R$ 0,30. Não recalcula o passado. Código: `precoPecaCasa` em `domain/producao.js`.
- [A CONSTRUIR] 3 tabelas no topo da aba Produção: **Produção Sorelly** (nova; só anota peças por dia, sem pagamento, sem meta), **Produção Serenity** (era "Produção da empresa"; mantém dados, valores e bônus) e **Produção Externa** (era "Produção de casa"). A mesma pessoa pode estar nas 3 (a unidade já fica em cada linha).
- Pagamento: Sorelly não paga. Serenity: bônus em dinheiro no **dia 12** do mês seguinte (confirmado). Externa: ciclo terça a segunda, paga na quinta por Pix de revendedora; quinta feriado = **próximo dia útil**.

## Decisão do Marcus em 25/11/2026 (produção em casa, valor por peça) — SUBSTITUÍDA em 26/11/2026 (R$ 0,35 saiu; vale R$ 0,30 a partir de 01/12 e a Didi fica em R$ 0,45)
- [FEITO] Valor da peça na produção em casa: R$ 0,45 até 25/11/2026. De 26/11/2026 em diante, R$ 0,35 por peça ("o que receber amanhã já entra em 35 centavos"). Vale o dia da peça recebida.
- [FEITO] Exceção: a Dávila e a tia do Marcus (lida como a Leci) ficam em R$ 0,45. Código: `precoPecaCasa` em `domain/producao.js` (constantes `CASA_POR_PECA_NOVO`, `CASA_PECA_NOVO_DESDE`, `CASA_MANTEM_045`); a tela Pagamento da produção mostra o preço certo de cada dia. Teste: 10 de 10.
- [A CONFIRMAR] Que "minha tia" é a Leci. Se for outra pessoa, trocar o nome em `CASA_MANTEM_045`.
- Substitui o "R$ 0,30 ou R$ 0,45" da Didi (PROD 17): a Didi e as demais passam a R$ 0,35 em 26/11.
