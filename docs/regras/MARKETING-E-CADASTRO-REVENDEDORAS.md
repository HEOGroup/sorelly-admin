# Regras: marketing, tráfego pago, cadastro de revendedoras, chamados, garantia e SorellyChat (vigentes em 25/11/2026)

Documento ÚNICO e vivo, escrito a partir de tudo que o Marcus disse nas conversas de 28/09 a 25/11/2026 (cerca de 460 mensagens da área) e do código.
Só a regra de HOJE. Sem nome completo de pessoa, sem valor individual, sem senha, sem chave Pix, sem token. O que for dado real fica em `docs/pendencias/marketing-e-cadastro.local.md` e nas fichas `.local` (fora do Git).
Marcação: **[FEITO]** já no sistema · **[A CONSTRUIR]** decidido, falta construir · **[A CONFIRMAR]** o Marcus não decidiu.
Se este texto e o código divergirem: o código mostra o que o sistema faz e pode estar errado; regra e código divergem? Não escolha um lado sozinho: registre em "Não alinhado" e, em dinheiro, jurídico, fiscal, trabalhista ou acesso, pergunte ao Marcus.
Fontes complementares: `docs/setores/marketing/`, `docs/setores/cadastro-de-revendedoras/`, `docs/setores/garantia/`, `docs/setores/sorellychat/`, `docs/negocio/LINK-DE-PAGAMENTO.md` (link de pagamento é do Financeiro, só referenciado aqui), `docs/DECISOES.md`.

## 1. O fluxo da área

```
Marketing (conteúdo, fotos, tráfego pago)
      │  leads
      ▼
Cadastro de revendedoras (Aprovação de cadastros, planilha Kits novos)
      │  aprovada + kit liberado
      ▼
Kits novos ──► Montagem e bipagem ──► entrega (representante ou na empresa)
      │
      ▼
Pós-venda: garantia, indicação, avaliação, chat
```

| Setor | O que faz | Quem lidera hoje |
|---|---|---|
| Marketing | Fotos de catálogo, artes, feed, criativos, modelos | **[A CONFIRMAR]** (o RH ajuda; ver 2.6) |
| Tráfego pago | Anúncios Google e Meta; gerar leads | Gestor de tráfego (PJ) |
| Cadastro de revendedoras | Aprovar cadastro, Kits novos, Indicações, Avaliações, Desempenho | Nickolas |
| Garantia (e pós-venda) | Créditos de garantia, atalho para o Garantify | Marcus |
| SorellyChat e Chamados | Chat interno e pedidos de mudança do sistema | Marcus (cria grupos) |

Link de pagamento está no Financeiro. Não se repete aqui. Ver `docs/negocio/LINK-DE-PAGAMENTO.md`.

## 2. Marketing

### 2.1 Foco do setor [FEITO como orientação]
- O Marcus não quer gastar para captar revendedora agora (já existe fila de espera). Quer CONTEÚDO que faça a revendedora vender mais: foto de catálogo e 1 a 2 posts por dia no feed.
- Fotos do app da revendedora: fazer com IA, sem custo extra (decisão de 05/11). **[A CONSTRUIR]**

### 2.2 Telas do setor (menu Marketing) [FEITO]
| Tela | Para quê |
|---|---|
| Marketing | Visão geral, Mural de criativos, Divulgação, Erros em produtos |
| Fotos de catálogo | Controle da foto de cada peça nova (ver 2.3 e 2.4) |
| Relatório diário | Quantas artes e outras atividades foram feitas em cada dia (ver 2.7) |
| Campanhas | "Em breve" |
| Tráfego pago | Planilha do gestor de tráfego dentro do sistema (ver 3) |
| Criativos | Os anúncios e seus arquivos (vídeo, imagem, carrossel) |
| Modelos | Página só do Marcus: modelos e influencers que recebem joias (ver 2.8) |

### 2.3 Fotos de catálogo: regra [FEITO]
- **Peça NOVA tem foto sem falta.** Código antigo sem foto fica para trás (a maioria nem tem estoque).
- Entram 50 a 70 modelos novos por dia. A base tem mais de 15 mil códigos.
- **Códigos novos vêm da DevMaster sozinhos** (tabela de produtos, só leitura). A tela lê a cada 2 min com a tela aberta; o servidor lê a cada 10 min (peças novas) e a cada 30 min (peças antigas já controladas). **[A CONFIRMAR]** se a rotina do servidor dispara (falta conferir `CRON_SECRET`).
- **Etapas, nesta ordem:** Foto, Editada, Na DevMaster. Cada etapa grava quem e quando. Status e tempos médios saem das datas, nunca são digitados.
- Dar OK numa etapa adiante marca as de antes que faltarem.
- **Anel:** o código completo tem grade (ex.: modelo + numeração). O modelo, sem a numeração, é UMA foto só para todos os tamanhos. Anel sobe na DevMaster pela grade de produtos, não pela aba normal.
- Telas dentro de Fotos de catálogo: Hoje, Feitas, Progresso por categoria, Meses anteriores, Produção diária, Processos, Meta.
- Filtro e ordem só no título de cada coluna (padrão de tabela do sistema). Sem bloco de filtros.
- Atraso: peça nova sem foto há 2 ou 3 dias fica em vermelho.

### 2.4 Processo diário das fotos [FEITO como tela Processos]
| Passo | Quem | Quando |
|---|---|---|
| 1 Cadastro | Meninas do cadastro de peças | Todo dia; separam 1 peça de cada código |
| 2 Entrega | Meninas do cadastro | 11h e 15h, em ziplock com data e horário |
| 3 Foto | Fotógrafo do Marketing | Ao receber as peças |
| 4 Edição e envio | Quem edita (hoje a ajuda vinda do RH) | Depois das fotos; coloca na DevMaster |

- Quem fotografa marca o campo Foto na tela. Quem edita sobe na DevMaster.
- O Marcus quer controle do que foi TIRADO e do que foi COLOCADO (às vezes se tiram 200 e se colocam 50). **[A CONFIRMAR]** qual evento conta para a meta (ver 2.5 e a pendência de "não alinhado").

### 2.5 Meta semanal de fotos e prêmio [FEITO em parte]
Regras de HOJE (Marcus, 17/11 e 18/11; resultado em 23/11):

| Faixa da semana | Prêmio |
|---|---|
| 250 fotos | R$ 150,00 |
| 300 fotos | R$ 200,00 |
| 350 fotos | R$ 250,00 |

- Vale o valor do MAIOR degrau batido. Não soma os degraus.
- Prêmio **por pessoa**, em **dinheiro**, pago até a quinta da semana seguinte. Só para quem trabalhou.
- A conta é a da tela (`metaProgresso`): conta a foto marcada na tela OU a foto que apareceu na DevMaster depois da hora de corte da meta. Hoje conta foto de QUALQUER peça, nova ou antiga.
- A primeira meta (10/11 a 13/11) era 500 fotos para R$ 250,00 do setor. Foi substituída pelos degraus.
- Feriado no meio da semana: **[A CONFIRMAR]** se vale como dia de trabalho (20/11 foi feriado).
- **Sem meta nova para 23 a 27/11.** O Marcus quer trocar a meta por semana por um modelo igual ao da Produção (cada pessoa, cada dia, por foto). **[A CONFIRMAR]** o desenho. Enquanto isso o código só tem as 2 metas antigas.
- Fotos de modelo (pessoa que posa) são pagas em joias (ver 2.8).

### 2.6 Equipe do Marketing [A CONFIRMAR o líder]
- Hoje: fotógrafo e editor de vídeo (prestador dentro da empresa), uma pessoa de social media, uma funcionária nova (conta criada em 23/11) e uma colaboradora do RH que ajuda nas fotos.
- Três pessoas saíram do setor em outubro. O supervisor oficial muda nas mensagens (ver "não alinhado").
- O fotógrafo precisa ter acesso à tela de Marketing e às Modelos (liberado em 12/11).

### 2.7 Relatório diário [FEITO]
- Aba para o setor lançar, dia a dia, quantas artes, stories, reels e fotos editadas foram feitas.
- As atividades de partida são sugestão e se mudam no botão Atividades. **[A CONFIRMAR]** quais atividades contar e quem lança o seu dia.
- O Marcus também quer um **resumo do plano do marketing** (quantos fizeram hoje, nova meta da semana) e um **cronograma diário/semanal** de postagens. **[A CONSTRUIR]**

### 2.8 Modelos, influencers e pagamento em joias
**Tela Modelos** (só quem tem a autorização `modelos_ver`; padrão: Marcus) [FEITO]:
| Grupo | O que é |
|---|---|
| Sorelly | Modelos que fazem conteúdo para a Sorelly; têm negociação e data para ir à empresa |
| Marcus | Amigas do Marcus que recebem joias |
| Influencers | Só enviamos kits |

- Cada uma tem foto, Instagram, telefone, endereço, valor liberado por mês, último envio e situação. Dados reais só em arquivo `.local`.
- **Regra das influencers:** R$ 250,00 em joias, a PREÇO DE VENDA, por indicação com cadastro aprovado; mais R$ 1.000,00 a cada 10 aprovadas. Aprovada = cadastro aprovado + kit entregue (lido do app pelo ID da influencer). **[A CONFIRMAR]** se é isso mesmo e se as moedas do Indique e Ganhe do app se somam.

**Pagamento em joias (funcionário, prestador ou modelo)** [FEITO, RH › Pagamento em joias]:
- Vale para qualquer setor. Cada pagamento tem pessoa, setor, motivo, valor a preço de venda, custo e peças.
- **Custo padrão das joias: 20% do valor a preço de venda.**
- Caminho: Pedido → Autorizado → Separado → Retirado (recibo para copiar). Cancelado sai da conta.
- Autoriza quem tem `joias_autoriza` (Diretoria). Separa o cadastro de peças.
- Acompanha um resumo por mês e por setor.
- Cuidado jurídico: pagar CLT em joias pode contar como salário. **[A CONFIRMAR]** com o contador.

## 3. Tráfego pago [FEITO]
- Mora dentro do Marketing (`/marketing/trafego-pago`). Quem usa: o gestor de tráfego. O pessoal do Marketing consulta.
- Segue a planilha dele, 4 abas: **Investimento**, **Mês a mês**, **Dia a dia** (um dia por data e plataforma), **Criativos** (ranking por cadastradas).
- **O que se digita é SEM imposto.**
- **Imposto da Meta: 12,15%.** Meta com imposto = investimento × 1,1215. A taxa fica no Configurador geral › Tráfego pago. O Google não leva acréscimo.
- Total das plataformas = Google + Meta com imposto.
- Custo por cadastrada = investimento ÷ cadastradas.
- Mês com dias lançados usa a soma dos dias; mês sem dias usa o total do mês.
- Aprovadas zero com cadastradas = aprovadas NÃO lançadas. A tela mostra "—", nunca 0%.
- Leads, aprovadas e cadastradas entram à mão (como na planilha).
- Filtro por data para consultar um dia específico (pedido do gestor em 06/11). **[A CONFIRMAR]** se já está igual ao pedido.
- Arquivos do criativo (vídeo, imagem, carrossel): até 12 arquivos de 600 MB, vão direto do navegador para o armazenamento em nuvem. Apagar o criativo não apaga o arquivo.

**[A CONSTRUIR]** (pedido do gestor em 09/11):
- Três funis de desempenho dentro do tráfego: **geral, só Meta Ads e só Google Ads**, todos com filtro por período e dados corrigidos.
- Ligar leads, aprovadas e cadastradas ao Cadastro de revendedoras por origem (Google ou Meta), sem digitar.
- Puxar criativos e resultados do Gerenciador de Anúncios (desenvolvedor).
- **Problema conhecido:** os números de aprovadas e cadastradas por plataforma e por dia não batem. Causa informada pelo desenvolvedor: o Kommo não aceita mais mensagem inicial com imagem; o bloqueio impede o registro das tags (divergência entre aprovadas e reprovadas). Solução proposta: a mensagem inicial do anúncio vir só em texto. **[A CONFIRMAR]** se foi feita.

## 4. Leads [FEITO em parte]
- Lead = candidata a revendedora que chega por anúncio, indicação ou outra origem.
- Hoje o lead entra à mão na Aprovação de cadastros (lançamento manual). O funil do Kommo é lido só para consulta (ver 6).
- Origem do lead (Instagram, LinkTree, Pós-venda, anúncio...) é guardada no cadastro da planilha Kits novos e em Desempenho › Origem.
- Quem está no Kommo em "conferência de documentos" NÃO é cadastrada (ver 5.3).
- Marketing não capta revendedora em massa agora; o foco é conteúdo.

## 5. Cadastro de revendedoras

### 5.1 Telas (menu do setor) [FEITO]
| Grupo | Telas |
|---|---|
| Cadastro | Aprovação de cadastros, Base de revendedoras |
| Kits novos | Kits novos, Pendências, Consolidado, Regras, Representantes, Entregues |
| Indicações | Funil, Resgates de prêmios, Retiradas, Revendedoras e moedas, Histórico |
| Desempenho | Desempenho do cadastro (métricas, funil, campanhas, origem, registros), Avaliações |
| Outras | Representantes, Mensagens prontas |

- Configuradores ficam só no Configurador geral (decisão de 16/10: o setor é enxuto).
- O total de revendedoras ativas é lançado por quem o Marcus indicar e fica fixo na barra do Financeiro, do Agendamento e do Cadastro e na Visão geral. **[A CONFIRMAR]** quem lança todo dia hoje.

### 5.2 Aprovação de cadastros [FEITO]
- Quadro **kanban**: cada coluna é uma etapa do funil e cada cartão é uma candidata. Arrasta ou usa "Concluir etapa".
- Etapas: Contato inicial, Responderam, Começaram o cadastro, Enviaram os dados, Em análise, Aprovadas, Cadastradas. Saídas: Não respondem e Reprovadas.
- Aprovar ou reprovar abre janela de decisão. Só quem tem permissão de decidir cadastro aprova, reprova e desfaz (hoje a diretoria).
- Ao aprovar, escolhe-se como a revendedora recebe o kit (na empresa ou pela representante) e o valor do kit.
- **[A CONSTRUIR]** ligação automática Aprovação → Kits novos pelo servidor. Hoje o lead passa só no navegador de quem aprovou.

### 5.3 Planilha Kits novos e ciclo do kit [FEITO em parte]
- A planilha "Kits Novos 2026" é a base do setor: uma linha por revendedora, em 6 abas por região. Colunas de ciclo (datas): **Cadastro, Liberado, Solicitado, Bipado, Retorno**; mais Status, nome, cidade, bairro, representante, valor do kit, retirada na empresa, situação de trabalho, observação, contatos, tipo (Vendedora ou Retornando), operador e origem.
- Status da planilha: **Cadastrada, Liberado, Solicitado, Bipado, Entregue, Cancelado.**
- No sistema (app Kits novos) o funil é: **Liberado → Solicitado → Bipado → Entregue → Devolvido** (a etapa Cadastrada saiu do funil do app).
- **Cadastrada só conta quando o cadastro TERMINOU** (última etapa). Aprovada ou em conferência de documentos NÃO é cadastrada. O prazo do kit conta do dia em que entrou em Cadastradas, não da aprovação.
- Prazos de etapa (Configurador): Liberado 1 dia, Solicitado 1, Bipado 3, Entregue 3 (condicional volta). Kit parado de propósito ("Aguardando peça") não conta como atrasado.
- **Kit novo = só revendedora nova.** Acerto com kit é outro fluxo (Representantes e Comissões).
- A meta de R$ 7.000 é a média de regra para a equipe, não um valor por revendedora.
- **Recusa de kit novo** fica registrada (botão Recusou, com motivo e data). Com 2 recusas a representante deixa de receber kits novos.
- Os kits ficam no servidor (módulo `kn`), para todas as pessoas do setor verem os mesmos kits.
- A DevMaster complementa endereço, bairro, CEP e telefone em 2.707 dos 2.735 kits (24/11). CPF e e-mail NÃO foram copiados.
- **[A CONFIRMAR]** de onde vêm telefone, CPF e endereço completo no futuro; se a planilha continua como fonte durante a mudança; o que é "subir no app delas" (criar acesso ou só enviar dados); importar o histórico de 2026 (cerca de 6.000 linhas) ou só os abertos.
- **[A CONSTRUIR]** tela de Entradas no Cadastro (as analistas lançam; o lead vai para Kits novos pelo servidor), depois ligação ao app da representante e carga da planilha de 24/11 no servidor.

### 5.4 Comissão de entrega do kit novo (referência)
| Item | Regra |
|---|---|
| Kit novo entregue pela representante | R$ 20,00 |
| Kit novo + expositor entregue juntos | R$ 35,00 (a representante precisa enviar a foto do expositor montado) |
| Teste "Representante Kit Novo" (Curitiba, desligado) | R$ 25,00 na entrega; 2% do 1º acerto para quem entrega e 6% para quem acompanha o acerto; a partir do 2º acerto, 8% só para quem acompanha |
O dono dessas regras é o setor Representantes (`docs/regras/REPRESENTANTES-E-COMISSOES.md`).

### 5.5 Expositores [FEITO em parte]
- Expositor de dois andares conta junto, para saber quantos há. Mostrar na aba de revendedoras quem está com cada modelo.
- Quem tem expositor e está sem kit deve ter venda mínima; o valor **[A CONFIRMAR]**.
- A data que vale é a da ÚLTIMA venda da revendedora, não a da condicional aberta. Campo de observação por revendedora para o Marcus acompanhar caso a caso.
- Cobrança: o representante ativo cobra. Revendedora sem representante ativo: quem verifica é o Agendamento.

### 5.6 Indicações [FEITO]
- Dados do app (importação única de 17/11) e da planilha antiga. NÃO é ao vivo: pedido novo só entra quando se roda o script de soma.
- Histórico com Top 12 revendedoras, Top 12 representantes e Situação das indicadas. Nomes sem caixa alta.
- **[A CONSTRUIR]** ligação app → sistema e sistema → app (moedas e status); regra de status entre Kommo e app; pedido de prêmio com status igual nos dois lados.
- Brinde de indicação: as peças entram por código; o valor liberado é o do pedido APROVADO; o que passar é pago pela "diferença do brinde".

### 5.7 Meta do Cadastro (setor) [FEITO como configuração; resultado a confirmar]
- A meta MUDA todo mês. A de outubro: total de revendedoras ativas no fechamento (01/11 às 08:00, pelo número exato).
- Faixas de outubro (total de ativas → valor por pessoa): 2.085 → R$ 300 · 2.100 → R$ 400 · 2.120 → R$ 500 · 2.135 → R$ 650 · 2.150 → R$ 800. Quem apoia o cadastro e o link recebe 50% do valor.
- Pagamento entre 12 e 13/11. **[A CONFIRMAR]** o resultado e se foi pago.
- A meta de novembro não está definida. **[A CONFIRMAR]**

### 5.8 Folders e regras
- Folders em papel acabaram. O folder vira virtual e aparece no app da revendedora cerca de 2 vezes por semana. **[A CONSTRUIR]** a aba de informativos com a contagem de quantas vezes aparece por dia e por mês (primeiro: link de pagamento).
- Os guias em PDF (resumo para candidata e regulamento para revendedora) ficam no setor **Regras**, não no Cadastro.

## 6. Kommo (só leitura) [FEITO]
- O sistema lê o funil **Cadastro** do Kommo (nomes das etapas e QUANTIDADE de leads por etapa, sem dados de pessoa). Rota só da Diretoria.
- **Nunca grava no Kommo.**
- As chaves ficam só no servidor, nunca na tela nem no Git.
- Kommo e Admin divergem hoje porque o Admin NÃO puxa do Kommo: os dados vêm do app e da planilha. Divergência esperada até a ligação existir. **[A CONSTRUIR]**
- O token do Kommo foi colado em chat em 17/11. **[A CONFIRMAR]** troca por um novo.

## 7. Chamados (pedidos de mudança do sistema) [FEITO]
- O nome da tela é **Chamados** (antes Melhorias; o endereço antigo ainda abre). Todo funcionário abre e vê os seus. Marcus, Nickolas, Lucas e o desenvolvedor veem todos.
- Responder e mudar a situação: só o Marcus e o desenvolvedor.
- Cada pedido é um **chat** (texto, print, até 4 fotos). Ctrl+V cola o print.
- Situações: **Em análise, Mudança feita (testar), Precisa de melhoria, Concluída, Recusada.** Quem pediu testa: "Testei e aprovei" ou "Testei, precisa melhorar".
- Excluir é um botão (só Marcus e desenvolvedor). Coluna da conversa com o assistente guarda data e link.
- Tela compacta, texto sem corte, situação em etiqueta de uma linha.
- Regra de operação: chamado respondido pede teste da pessoa em até 2 dias; quem não testou é cobrado. Aviso aos funcionários por mensagem copiável ou lista de transmissão (eles não respondem).

## 8. Garantia e pós-venda [FEITO em parte]
- Nome do setor no menu: **Garantia**. O Marcus quer que seja só **Pós-vendas**. **[A CONFIRMAR]** o nome final.
- **Trocas** é do setor de Garantia e **não ganha comissão**.
- **Garantia** (tela): atalho para o site externo Garantify (acesso só da diretoria). O sistema não guarda garantias.
- **Créditos** (tela): a funcionária de garantia lança o crédito liberado para a revendedora (lista de revendedoras com kit ativo, valor, observação). O valor sobe sozinho para o acerto no app da representante, que não digita nada.
- Enquanto a tela nova não estiver em uso, as atendentes lançam o crédito à mão no acerto.
- Sem preencher as vendas no app, a revendedora recebe o próximo kit no valor mínimo e as peças NÃO têm garantia (a garantia é gerada no app). Dar ênfase a isso na mensagem à revendedora.
- **[A CONSTRUIR]** aba de Pós-vendas (hoje "Em breve").
- **[A CONFIRMAR]** respostas do Garantify pedidas em 23/10 (garantias emitidas no mês, ativadas por mês, peças mais acionadas, tempo médio entre emissão e acionamento, % sobre as peças vendidas). O conector do Garantify falhou ao conectar nesta leitura.

## 9. SorellyChat [FEITO]
- Chat interno parecido com WhatsApp. Nome: **SorellyChat** (rota `/whatssorelly`).
- **Só o Marcus cria grupos**, por setor. Existe um grupo geral interno, e grupos como Marketing e Cadastro de revendedoras (um só grupo de Cadastro).
- A conversa de cada pessoa com o Marcus fica SEMPRE no alto da lista de todos, não sai nem arquivando.
- Toda mensagem do Marcus aparece como aviso grande, marcando ou não. Quem for marcado com @ também.
- Ninguém fica "em reunião" ou ausente, exceto Marcus, Nickolas e Lucas.
- Faixa de horário e resumo de faltas só para a Direção. Funcionário vê foto, nome, função e horário.
- Horário de saída vem do cadastro do RH: seg a sex = entrada + 10h; seg a sáb = entrada + 8h20. **[A CONFIRMAR]** o horário de quem trabalha 6 dias e de quem entra antes das 07:00.
- Marcus trabalha 24 horas, todos os dias, sem almoço.
- Som de mensagem: estilo Cristal. Aviso empilhado dentro da conversa, no alto à direita. Ctrl+V cola imagem; áudio e arquivo valem.
- Foto de perfil: só o Marcus e o Marketing editam. Aparece a foto de todos para todos.
- Notificação do admin e do chat: botões de sino no topo; ficam desligadas por padrão.
- Arquivar vale para qualquer conversa.
- A revendedora e a representante usam o mesmo chat nos apps (formato copiado do chat das funcionárias). A revendedora fala com: Minha representante, Indique uma revendedora, Link de pagamento, Garantias, SAC e currículo (RH). Não fala com o Financeiro.
- Acesso básico (Início, SorellyChat, Chamados) para quem ainda não tem outras telas liberadas.
- **[A CONFIRMAR]** (aviso jurídico): o Marcus vê as conversas dos funcionários sem eles saberem. Confirmar com o jurídico a política de privacidade do chat.
- **[A CONSTRUIR]** mensagem vira tarefa; atividades diárias por funcionário; cartão de decisão (dois botões) para pedidos do RH e cadastro de peças.

## 10. Acessos da área (por setor, não por pessoa)
| Setor | Vê |
|---|---|
| Marketing | Telas do Marketing, Modelos, Metas e Apps (fotógrafo liberado em 12/11) |
| Cadastro de revendedoras | Telas do Cadastro; Kits novos vê só a tela de Kit novo com o valor do kit |
| Tráfego pago (gestor PJ) | Marketing |
| Garantia | Garantia e Créditos |
| Todos | Início, SorellyChat, Chamados |
| Dinheiro (comissões, valores) | Só diretoria e supervisão do setor |
Conta nova: primeiro colocar a pessoa na lista do sistema, depois criar o login (usuário sem espaço).

## 11. Em aberto (perguntas ao Marcus)
1. Quem é o líder do Marketing hoje e quem edita as fotos?
2. A meta de fotos conta qualquer foto ou só modelos novos? E o modelo novo por pessoa, por dia, por foto: como será?
3. Qual evento conta a foto: o fotógrafo marcar, ou a foto chegar na DevMaster?
4. O setor Garantia vira só Pós-vendas?
5. Qual a meta de novembro do Cadastro e quem recebe?
