# Regras: encomendas, reposições, expositores, Top 100 e Top 20 (vigentes em 25/11/2026)

Documento ÚNICO e vivo. Só a regra de HOJE, escrita a partir do que o Marcus disse nas conversas de 28/09 a 24/11/2026, dos documentos do projeto e do código.
Se este texto e o código discordarem, o CÓDIGO vence: corrija este arquivo. Mensagem mais nova vale sobre a antiga.
Sem nome de revendedora, sem valor individual, sem chave Pix, sem CNPJ completo (isso fica em arquivos `.local`, fora do Git).
Marcação: **[FEITO]** já no sistema · **[A CONSTRUIR]** decidido, falta construir · **[A CONFIRMAR]** o Marcus não decidiu. Nunca implemente [A CONFIRMAR] sem perguntar.
Pendências, conflitos e duplicidades: `docs/pendencias/encomendas-e-kits-novos.local.md`.
Regras de acerto, comissão da representante e brinde: `docs/regras/REPRESENTANTES-E-COMISSOES.md`. Listagens e montagem: `docs/regras/LISTAGENS-E-MONTAGEM.md`.

## 1. Quem é quem

| Papel | Quem hoje | Observação |
|---|---|---|
| Setor Encomendas e reposições | Agatha (líder), Elen, Eduarda | Desde 20/10/2026 elas também ajudam na montagem de kits altos (ver 8) |
| Entregador das reposições do Top 100 | João (tio do Marcus) | Recebe a taxa de entrega por Pix. Dados do Pix só em arquivo `.local` |
| Quem atende a reposição na empresa | Atendentes do atendimento interno | Mostram as peças na frente; chamam Encomendas se precisar |
| Quem bipa a reposição | Bipagem, por pedido da representante à Deysiane | |
| Quem cadastra peça nova pedida | Rayssa e Graziella (cadastro de peças) | Não é a Michele (Marcus, 23/10) |
| Quem dá baixa em expositor devolvido | Agendamento | Aba de Expositores liberada para o setor (09/11) |
| Quem autoriza entrada e saída do Top 100 | Só a diretoria (Marcus, Nickolas, Lucas) | |

- Nome do setor no menu: **Encomendas e reposições** (o Marcus permitiu "Reposições & Encomendas"; renomear o menu fica para decidir **[A CONFIRMAR]**).

## 2. Palavras que valem

| Palavra | Quer dizer |
|---|---|
| **Reposição** | Peças levadas no MEIO do mês para a revendedora. Sempre paga |
| **Encomenda** | Peças separadas para levar no PRÓXIMO kit. Peça específica (colar de letra, colar de filhos, peça de outro estado) |
| **Top 100** | Revendedoras com acesso direto ao setor (antes Top 50) |
| **Top 20** | As 20 maiores revendedoras: ganham uma ficha de 10 x 10 cm na caixinha. Não é lista de acesso |
| **Expositor** | Peça de exposição (ponto fixo, consignação). Não é kit |

## 3. Top 100 (lista de acesso) e Top 20 (fichas)

### 3.1 O que o Marcus decidiu
- A lista de acesso passou de Top 50 para **Top 100** (Marcus, 13/11: "umas 100 mulheres nesse fluxo"; 18/11: acesso só ao Top 100). **[FEITO]** nos textos das telas; o código ainda tem variáveis e rota com o nome antigo (`top50`, `/encomendas/top-50`).
- O Top 100 vem da DevMaster. Vendas, última venda e média **não se digitam**. Coluna Kit, Responsável e Observação são do setor.
- **Ninguém do setor tira revendedora do Top 100 sozinha** (23/10). Tirar abre o quadro do motivo e cria um pedido ao Marcus com mensagem pronta. Só a diretoria tira direto. **[FEITO]**
- Motivos de saída: média baixa, não faz solicitações, só manda áudio, má educação. **[FEITO]**
- Quem entra: a equipe preenche nome, telefone, representante e motivo e copia a mensagem para a autorização. **[FEITO]**
- Revendedora "selecionada pelo Marcus": só a diretoria marca; ela não gera alerta de média baixa. **[FEITO]**
- Áudio: no atendimento do Top 100 só mensagem escrita e poucas fotos. Quem insiste em áudio fica bloqueada. **[FEITO no texto da regra]**

### 3.2 Ranking automático (proposta de 18/11/2026) **[A CONFIRMAR]**
Escrita em `docs/setores/encomendas-e-reposicoes/regras-top100.md`. O Marcus pediu a tela; ainda NÃO aprovou os estados abaixo.

| # | Regra proposta |
|---|---|
| 1 | Roda 1 vez por mês, no dia 1º |
| 2 | Total de vendas dos últimos 3 meses fechados, sem brinde, troca, indicação e prêmio (mesma regra da média) |
| 3 | Empate: maior valor do último acerto; depois o acerto mais recente |
| 4 | Menos de 3 meses de vendas: entra com o que tiver; a diretoria decide |

| Estado | Quando | Efeito |
|---|---|---|
| Ativa | Posição 1 a 100 | Abre pedidos |
| Protegida | Tinha acesso e está na 101 a 150 | Igual à ativa |
| Em saída | Tinha acesso e ficou fora do 150 no 1º mês | Mantém acesso e recebe aviso |
| Saiu | Fora do 150 por 2 meses seguidos e sem pedido aberto | Não abre pedido novo; ficha fica |
| Sem acesso | Nunca teve e está na 101 a 150 | Só entra no Top 100 |

- Pedido aberto ou peça separada = nunca sai. Funcionária não exclui. Exceção da diretoria: motivo escrito e data de fim (máximo 3 meses). Cada mudança grava quem, quando, estado antes e depois, posição e motivo.
- Tela **Encomendas › Ranking** (`pages/encomendas/Ranking.js`, `src/server/encomendas-ranking.js`) mostra a classificação, só leitura. **[FEITO]** Falta ligar ao Top 100 (entrada e saída automáticas e os 5 estados) **[A CONSTRUIR]**.
- Em aberto: aviso de saída (WhatsApp ou app), quem confere a lista no dia 1º, desde quando conta "pedido aberto", janela de 3 meses corrida ou do calendário, como incluir os que faltam na lista **[A CONFIRMAR]**.

### 3.3 Planilha mensal do Top 100 (tela Top 100) **[FEITO]**
- A equipe lança a venda de cada mês (colunas de jul/2026 em diante; no dia 1 a coluna nova abre).
- **Média = dos últimos 3 meses COM venda lançada** (pode ser 1 ou 2 meses).
- **Alerta:** média abaixo de **R$ 3.000,00** (`config.top50.mediaMinima`), exceto "selecionada pelo Marcus".
- Colunas: posição, revendedora (no máximo 4 nomes, 1 linha), telefone, representante, vendas por mês, média 3 meses, última venda, data do acerto, Kit (Pendente, Urgente, Montagem na empresa, Finalizado), responsável, observação.
- Ao clicar na revendedora (Listagens), abre a ficha das preferências do kit. **[FEITO]**

### 3.4 Top 20 (fichas) **[FEITO, fora do sistema]**
- Análise de 18/08 a 18/11: média e maior preço por acerto, ouro x prata (por valor: 60% ou mais = mais dourado; 40% a 60% = 50/50), 3 categorias, os 5 tamanhos de anel mais vendidos, sim/não de conjunto, masculino, tornozeleira e anel luxo, e a representante.
- Preço da peça = preço de tabela (o acerto cobra 50% dele). Fichas e nomes só em arquivos locais.
- Top 10 de vendas e de acertos mês a mês (só 2026). Premiação do mês: ver `docs/regras/KITS-NOVOS-E-INDICACOES.md`, seção 9.

## 4. Reposição

### 4.1 Quem pode e por qual caminho **[FEITO]** (`acessoReposicao` em `domain/encomendas.js`)

| Quem | Caminhos liberados | Taxa da revendedora |
|---|---|---|
| Top 100 | Entrega pelo João, ida na empresa (agendada) ou pela representante | Entrega pelo João: R$ 15,00 obrigatória, paga ANTES por Pix, comprovante anexado no sistema. Sem comprovante não separa, sem exceção. Ida na empresa e representante: sem taxa |
| Média de R$ 2.000,00 ou mais (fora do Top 100) | Ida na empresa ou pela representante | Sem taxa |
| Média de R$ 500,00 a 1.999,99 | Só pela representante | Sem taxa |
| Média abaixo de R$ 500,00 | Sem direito (nem pela representante) | |

- Reposição **não é divulgada** às revendedoras fora desses caminhos: a revendedora fala com a representante dela. Para encomenda de kit novo, preenche o app/link.
- Quantidade por mês: média abaixo de R$ 2.000,00 = **1**; de R$ 2.000,00 em diante = **2**; Top 100 = **2**. (Marcus, 21/10.)
- Valor máximo de cada reposição pela média de 3 meses (`config.valores`):

| Média 3 meses | Máximo por reposição |
|---|---|
| R$ 500,00 a 999,99 | R$ 2.500,00 |
| R$ 1.000,00 a 1.999,99 | R$ 3.000,00 |
| R$ 2.000,00 a 2.999,99 | R$ 3.500,00 |
| R$ 3.000,00 a 3.999,99 | R$ 4.000,00 |
| R$ 4.000,00 ou mais | R$ 5.000,00 |

- Top 100 sem média usa o maior teto; Top 100 abaixo da 1ª faixa usa o menor teto.
- O valor liberado vem **automático** da tabela pela média (Marcus, 18/11). Ele aparece no card.
- A tabela de valores e as quantidades **não são divulgadas** à revendedora (Marcus, 21/10): ficam internas e com as representantes.

### 4.2 Pela representante **[FEITO]**
- A representante leva reposição para **qualquer** revendedora dela, sem exigir Top 100 nem média (acima de R$ 500).
- Máximo **10 reposições por semana** por representante. Ela recebe **R$ 15,00 por reposição entregue** (só com a condicional assinada).
- Ela recebe da empresa três dados: média de vendas, tabela de valores e valor máximo. Escolhe as peças dentro do valor, separa na empresa, entrega e pede à Deysiane que a bipagem bipe.
- Encomendas **não separa** essas reposições.

### 4.3 Ida na empresa **[FEITO]**
- Com agendamento, em até **30 minutos** (não 1 hora).
- Fluxo: bipagem recebe a revendedora → sala de Encomendas confere média e valor máximo → chama a atendente → atendente mostra as peças na frente e pede ajuda se precisar → gavetas e mesa da produção → ao concluir, chama a Deysiane para ver quem bipa.
- Média de R$ 2.000,00 ou mais pode ver peças de luxo na sala do Marcus.

### 4.4 Entrega pelo João (Top 100) — etapas do pedido **[FEITO]**
`novo → aceite da taxa → separando → aguardando taxa (comprovante) → bipagem → liberado → rota → condicional assinada → concluído`
- Etapa 2 só pergunta se a revendedora **aceita a taxa**. Fica travada até aceitar. A taxa é paga DEPOIS de separar.
- Taxa isenta (decisão do Marcus, caso a caso): pedido não passa por "aguardando taxa".
- Ao concluir sai a mensagem para a revendedora **avaliar a reposição**.
- A rota do João e a comissão dele ainda não existem como tela **[A CONSTRUIR]**.

### 4.5 Bloqueios
- Vendas abaixo de **30%** do valor da reposição: bloqueada **3 meses** (`config.bloqueio`). **[FEITO no código; texto veio de mensagem colada, o Marcus não confirmou: A CONFIRMAR]**
- Insistir em áudio: bloqueada. Só a diretoria libera antes do prazo.

## 5. Encomenda

- Só o Top 100 pede encomenda direto ao setor. As demais revendedoras pedem **pelo aplicativo, só para o próximo kit**. (Marcus, 22/10.)
- Fora do Top 100, quem é de outro estado: encomenda (Marcus, 17/11).
- Pedido feito 15 dias ou mais antes do acerto fica como encomenda para o próximo kit, **sem taxa**. A revendedora também pode escolher "encomenda" no lugar de "reposição".
- A encomenda não tem taxa (regra de taxa de encomenda **[A CONFIRMAR]**).
- Marcus (10/11): quer um lugar para revendedoras fora do Top 100 que "precisam de atenção" (ex.: colar de letra), com filtro "revendedoras do Marcus" no funil. **[A CONSTRUIR]**

### 5.1 Link do pedido da revendedora **[FEITO]** (`/pedido/<código>`)
- A revendedora **não pede mais peça pelo WhatsApp**. Recebe um link só dela, no nome dela.
- Validade: **48 horas**; 120 horas depois de o setor publicar as peças.
- Ela pede até **10 peças** (foto ou descrição; dourado, prata ou os dois). O setor importa no Funil, acha as peças e publica no MESMO link.
- Ela marca **Quero** ou **Não quero** em cada peça, com observação e recado final. Duas abas: "Peças que encontramos" e "O que eu pedi".
- Pode pedir mais peças **no máximo 2 vezes** por link, até 10 por vez.
- Limite de valor: o do cadastro dela (tabela da seção 4.1). A barra bloqueia o envio acima do limite.
- Depois de confirmado o pedido, ela recebe o link para pagar a taxa de R$ 15,00 (entrega pelo João), anexar o comprovante e avançar.
- Mensagem antes de começar (texto do Marcus): setor exclusivo, 3 funcionárias e um motorista; todas as reposições são pagas; outro estado vira encomenda; pedido 15 dias antes do acerto = encomenda sem taxa; R$ 15,00 pagos no dia que fecha o pedido para a saída no dia seguinte ou no outro; pode retirar na empresa com agendamento.
- Endereço sempre `https://sorelly-admin.vercel.app`, nunca localhost.

### 5.2 Separar peças com IA **[FEITO]** (`pages/SepararPecas.js`)
- A funcionária tira cerca de 20 peças e cola os códigos. O sistema busca nome e foto na DevMaster (só leitura). A IA compara com as fotos dos pedidos e SUGERE. A pessoa confere lado a lado e confirma.
- Foto que a revendedora manda não é de catálogo: por isso a IA só sugere.
- Falta a chave `ANTHROPIC_API_KEY` no servidor (o Marcus ou o Leonardo cria, nunca no chat) **[A CONFIRMAR]**.
- Ao bipar o envio de um kit, o sistema deve avisar se há encomenda da revendedora (Elen, 18/11: uma condicional de encomenda foi fechada pela bipagem do kit e as peças não saíram) **[A CONSTRUIR]**.

## 6. Telas e colunas do setor

| Tela | Para que serve | Estado |
|---|---|---|
| Funil de pedidos | Pedidos da revendedora, com card compacto (nome até 4 palavras numa linha, taxa sim/não, andamento) | [FEITO]; zerado em 17/11 |
| Separar peças | IA sugere peça para pedido | [FEITO] |
| Revendedoras atendidas (~100) | Top 100 como coluna, média, kit pendente ou finalizado, observações | [FEITO] como tela Top 100 |
| Ranking | Classificação por 3 meses | [FEITO] só leitura |
| Expositores | Ver seção 7 | [FEITO] em parte |
| Regras e mensagens | Regras do setor e mensagens para copiar | [FEITO] |
| Ida na empresa, Representantes | Saem do menu (proposta de 17/11) | [A CONFIRMAR] |

- Card da revendedora: código, cidade, telefone, média 3 meses, valor de reposição liberado (automático), botão copiar telefone, botão copiar mensagem. Dados da revendedora na coluna esquerda; andamento e ações na mesma coluna, embaixo; 4 fotos lado a lado.
- **Cálculo do direito de reposição** = faixa da média (seção 4.1) menos as reposições já usadas no mês.
- **Cálculo do bloqueio** = vendas ÷ valor da reposição; abaixo de 30% bloqueia por 3 meses.
- **Cálculo da taxa do pedido:** reposição pelo João = taxa fixa; reposição pela representante = zero para a revendedora e R$ 15,00 para a representante; expositor por entrega = taxa de entrega do expositor; encomenda = zero.

## 7. Expositores

### 7.1 Liberação **[FEITO]**
- Tem direito quem tem **média de R$ 1.500,00 em 3 meses** OU ao menos uma venda de **R$ 1.000,00**.
- A revendedora envia foto do local; a diretoria aprova.
- Formas de receber: entrega pelo João (taxa de entrega **R$ 10,00 no código** `config.expositor.taxaEntrega`), retirada na empresa, ou retirada/entrega no acerto pela representante.
- Ao receber: conferir dano e avisar na hora, com foto. Depois de assinada a condicional, vale como recebido em perfeito estado.
- **Kit novo com expositor:** a representante monta o expositor e envia foto no app; sem foto, fica pendente. Comissão R$ 35,00 (R$ 20,00 sem expositor).

### 7.2 Cobranças
| Caso | Valor |
|---|---|
| Quebrar a coroa | R$ 100,00 |
| Perder a chave | R$ 100,00 |
| Quebrar o expositor | Preço que está na condicional |

- Regra de **venda mínima** para quem tem expositor: o Marcus quer cobrar; o valor **[A CONFIRMAR]**.

### 7.3 Como o sistema reconhece expositor **[FEITO]**
- Condicional com devolução prevista no **ano 3000** = expositor. Kit de verdade = condicional aberta nos últimos 90 dias e acerto previsto até 90 dias à frente.
- Código fora de MP, EX, MU e PJ = peça de joia (grupo "Peças de joia").
- Modelos de dois andares são agrupados juntos. Mini displays e cubo não importam; leitor, notebook e telefone devem aparecer separados do expositor **[A CONSTRUIR]**.
- Esquecida (expositor sem kit): mais de 6 meses = amarelo; mais de 1 ano = vermelho.
- A data que vale é a da **última venda** (quando ficou sem kit), não a do expositor na DevMaster.
- Mostrar vendas dos últimos 3 meses e a média de quem tem expositor, para cobrar mínimo.

### 7.4 Listas e cobrança
- Fica no **Admin**, no setor Encomendas, nunca no app da representante (Marcus, 09/11).
- Abas: todos · expositor com kit ativo · expositor sem kit · expositor com kit há mais de 70 dias. Coluna de observação (o Marcus vê caso a caso).
- Antes de cobrar, confirmar com a representante (a revendedora às vezes engana). Sem representante ativa: Ana Maria (agendamento) confere.
- Mensagem de cobrança "URGENTE · EXPOSITOR EM ABERTO": nome, dias sem kit, quantidade e modelo, pede onde está e quando busca.
- **Não fechar expositor na DevMaster por enquanto.** Anotar na observação (Marcus, 11/11).
- Registro da entrega: pela representante OU pelo João; se pelo João, anexar o comprovante do Pix da taxa. **[FEITO no código em 23/11 (`entrega_set`); o Marcus pediu de novo em 24/11: confirmar na tela]**
- Mais de 90 dias sem kit: executar a nota promissória **[A CONFIRMAR]** (a mensagem de 09/11 é ambígua).

## 8. Kits altos montados pelo setor (em revisão)
- 19/10: kits de revendedora acima de R$ 4.000,00 em vendas só as meninas de Encomendas montam, e é obrigatório marcar quem montou (senão a bipadora não ganha comissão).
- 20/10: as 3 passaram a montar também; "3.000 para cima elas montam"; acima de R$ 4.000,00 na mesa maior; kits de 17 e 20 mil na mesa da Agatha.
- 16/11: o Marcus disse que "só encomendas, mesa maior" não faz sentido na tela da listagem. Regra final **[A CONFIRMAR]** (ver `docs/regras/LISTAGENS-E-MONTAGEM.md`).

## 9. Onde está cada regra no código
`domain/encomendas.js` (faixas, taxas, canais, bloqueio, mensagens) · `domain/reposicao.js` (texto antigo: taxa R$ 20,00 e "não disponível", SUBSTITUÍDO) · `domain/expositores.js` · `src/server/pedido-link.js` · `src/server/encomendas-ranking.js` · `src/server/separar-pecas.js` · telas em `pages/Encomendas.js`, `pages/encomendas/`, `pages/ExpositoresModulo.js`.

## Decisões do Marcus em 25/11/2026 (questionário)
- [DECIDIDO] As regras do ranking Top 100 estão APROVADAS (5 estados, proteção até o 150º, pedido aberto nunca sai). [A CONSTRUIR] Publicar o Ranking: `src/server/encomendas-ranking.js` difere da master e há um stash "top100-ranking". Só com "Publicar".
