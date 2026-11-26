# Regras: listagens, montagem, bipagem, retornos e condicionais (vigentes em 25/11/2026)

Documento ÚNICO e vivo. Só a regra de HOJE. Sem conversa, sem histórico (histórico em `docs/DECISOES.md`, `docs/setores/montagem-e-kits/decisoes.md` e `docs/arquivo/`).
Se este texto e o código discordarem, o CÓDIGO vence: corrija este arquivo.
Marcação: **[FEITO]** já no sistema · **[A CONSTRUIR]** decidido, falta construir · **[A CONFIRMAR]** o Marcus ainda não decidiu. Nunca implemente [A CONFIRMAR] sem perguntar.
Nomes de função, não de pessoa. Quem ocupa o cargo muda. Dado real de pessoa: `docs/setores/montagem-e-kits/pessoas.local.md`.

## 1. Fluxo do kit (do pedido à retirada)

```
Representante ou Agendamento
   │  cria a LISTAGEM (dia, horário, destino)  → inclui as revendedoras
   ▼
CONDICIONAIS (DevMaster)
   │  acerto + saída: todas · acerto + kit novo: só as com devolução em até 90 dias
   ▼
VALOR DO KIT  (supervisão, Calculadora de kits)
   ▼
MONTAGEM  → (acima do limite de atenção: conferência da supervisão)
   ▼
BIPAGEM de envio
   ▼
PRONTO PARA RETIRAR → RETIRADA (representante ou balcão)
   ▼
Acerto com a revendedora → RETORNO na empresa → bipagem do retorno
   → condicional vai ao FATURAMENTO → condicionais voltam ao setor de condicionais
```

Kit novo de representante: Kits novos → listagem da representante → condicionais (não pega no kit novo) → montagem → bipagem → retorno à representante, que entrega e devolve ao agendamento.
Kit novo interno: Kits novos → agendamento marca a data → bipagem → revendedora na empresa.
Revendedora com acerto interno: agendamento gera a listagem, pega condicionais, a revendedora é atendida pela bipagem, monta-se o novo kit, a condicional do acerto vai ao financeiro.

## 2. Status do kit [FEITO]

| Status interno | Rótulo | Quem muda |
|---|---|---|
| semvalor | Aguardando valor | (nasce assim) |
| pendente | Na fila | Supervisão define o valor |
| montando | Montando | Montadora inicia |
| supervisao | Para conferir | Montadora conclui (valor acima do limite de atenção) |
| ajuste | Voltou para ajuste | Supervisão reprova |
| montado | Aguardando bipagem | Montadora conclui ou supervisão aprova |
| bipando | Bipando | Bipadora inicia |
| bipado | Bipado (pronto para retirar) | Bipadora conclui |
| retirado | Retirado | Representante aceita (app) ou funcionária (balcão com código e assinatura) |
| condicional | Pegar condicionais | Kit só-condicional ou saída |
| precond | Conferir condicional | Só nasce na demonstração (ver seção 9) |

Situações na listagem: Na fila, Montando, Aguardando bipagem, Bipado, Retirado. Kit sem valor aparece em vermelho. Atrasado = pedido fora do prazo de 48 horas.
Tipos de kit: Kit novo, Acerto + kit, Kit novo + expositor, Acerto + expositor, Reposição, Só condicional, Saída da revendedora.

## 3. Listagens
- Máximo de **15 revendedoras** por listagem. Listagem de viagem (fora de Curitiba): sem limite. [FEITO]
- O dia não pode estar no passado. Não repete o mesmo dia, horário e destino da mesma representante. [FEITO]
- Pedido com **48 horas** de antecedência; fora do prazo = atrasado (só marca). [FEITO no código: `server/app-rep/listagens.js`]
- **[A CONFIRMAR] Prazo novo (resposta da supervisão da montagem, 09/11/2026):** o pedido vale até **2 dias úteis antes da retirada, às 07:30**, para TODAS as listagens (normais e de viagem). Exemplo da viagem: retirada na segunda 09/11 às 18h, pedido até quinta 05/11 às 07:30. As 48 horas do código contam hora corrida. A resposta sobre sábado e domingo ficou ambígua ("contam para as solicitações"); o exemplo sugere que NÃO contam como dia útil. Confirmar com o Marcus antes de mudar.
- **Uma listagem por dia, até 15 kits, com até 2 horários de retirada** (09/11/2026). A representante vê só as revendedoras dela e acompanha se foi montado e bipado. Pode retirar 1 ou 2 kits se já estiverem prontos. Não vê o valor do kit. [FEITO em parte]
- **Duas formas de montar a listagem** (09/11/2026): pela listagem (marca as revendedoras) ou pela aba Revendedoras (inclui a revendedora numa listagem). O menu é sempre suspenso, nunca botões soltos. **[A CONSTRUIR]** conferir as duas.
- **Representante exclui revendedora da listagem (09 a 11/11/2026):** pode, com motivo. Se a revendedora desmarcou, sobe multa se for o caso. Se o kit já estiver BIPADO no sistema, volta ao estoque pelo sistema e só depois as peças vão para outros kits. Se estiver MONTADO e não bipado, as peças vão direto para outros kits. Alerta à supervisão da montagem (a montadora só se estiver no meio do kit); exclusão com menos de 24 ou 48 horas gera alerta. **[A CONSTRUIR]**
- **Funcionária adiciona revendedora à listagem** (11 e 16/11/2026): quando a cliente chega sem estar na listagem (ex.: funcionária da casa que acerta num intervalo, ou cliente "aleatória"), a funcionária do atendimento inclui sozinha, sem passar pelo agendamento. O nome vem do cadastro (nome e código). **[A CONSTRUIR]**
- **Agendamento: 3 passos (05/11/2026):** (1) preencher "Data Acerto" na condicional da DevMaster (dia que a representante pediu o kit); (2) escrever na observação: data, nome da funcionária e combinado; (3) marcar na Agenda da DevMaster (atividade ACERTOS). A listagem do dia sai da Agenda. Remarcou: mudar nos 3 lugares. Só observação não conta: o sistema não lê texto. [processo]
- **Agendamento mostra o tipo** (10 e 16/11/2026): ao lado de "agendado", uma coluna com kit novo, reposição, acerto, brinde, atacado, e se foi cancelado. Cancelamento no dia: o setor avisa a revendedora na hora (multa; horários apertados).
- Kits novos pendentes de agendar aparecem numa lista no topo para o agendamento marcar a data (03/11/2026). [A CONSTRUIR]
- Listagem interna: "retorno é kit novo" (16/11/2026); precisa de coluna do tipo e da data do acerto previsto e da listagem.
- Um bloco por representante, com "abrir todas" e "fechar todas". Prioritários e prontos no topo. Retirada pode ser parcial (ex.: 3 kits), com acompanhamento ao vivo. [FEITO]
- Listagem concluída (todos os kits retirados) vai para o Consolidado. [FEITO]
- Kit atrasado: a linha fica vermelha. Toda etapa mostra o tempo ao passar o mouse. **[A CONSTRUIR]**
- Representante nova ou revendedora que a representante recusa: a recusa de kit novo precisa ficar registrada. **[A CONFIRMAR]** onde.
- A tela da listagem mostra uma coluna de Preferências; clicar na revendedora abre a ficha das preferências ligada ao kit. [FEITO]
- Preferências da revendedora (app): só o básico. Estar nas preferências NÃO garante que a peça vai no kit; a empresa tenta enviar. Sem preferência, monta kit padrão. [FEITO no texto]

## 4. Valor do kit e média
- A listagem NÃO traz valor pronto: o valor nasce depois de calculado pela supervisão (Calculadora de kits). Valor do kit = média, nunca venda isolada. [FEITO]
- **Média para o valor do kit:** venda do app entra sozinha se for de R$ 500,00 ou mais, mais as 2 últimas vendas da DevMaster. Sem venda no app, ou abaixo de R$ 500,00: as 3 últimas da DevMaster ou valor manual. [FEITO]
- Sem vendas e não vem de Kit novo: kit de R$ 7.000,00 (código: `kitInicial:7000`). Marcus, 03/11/2026: todos os kits novos são R$ 7.000,00; o setor de Kits novos pode editar para R$ 5.000, 6.000, 8.000, 9.000 ou 10.000 com autorização do Marcus ou do Nickolas. R$ 7.000,00 é a meta de média, não um valor por revendedora. **[FEITO]**
- **Valor do kit automático (16/11/2026):** o valor do kit da revendedora vem sozinho das médias, igual ao atendimento interno (venda do app + vendas da DevMaster). A supervisão não digita. **[A CONFIRMAR]** se a calculadora já puxa sozinha.
- **Kit 100% Prata na montagem (09/11/2026):** só vai prata se o kit for inteiro Prata. Se o kit não é da modalidade Prata, tem que mandar ouro também, mesmo que a revendedora venda mais prata. **[A CONFIRMAR]** como o Kit perfeito aplica isso.
- Kit novo já vem com valor do setor Kits novos.
- Média acima de **R$ 2.500,00**: análise de vendas obrigatória (a supervisão envia prints da DevMaster). Média acima de **R$ 4.000,00**: aviso ao Marcus e supervisão. [FEITO]
- Venda dos últimos meses para a média das metas e do mínimo: `docs/negocio/MEDIA-DE-VENDAS.md` (sem brinde, TES S001 e S002, dia zerado fora).
- Tabela de peças por kit (faixa mínimo e máximo, de R$ 5 mil a R$ 20 mil): `src/apps/montagem/pages/CLAUDE.md`. Anéis: máximo 35, por TAMANHO. Provisória. [FEITO]
- O valor do kit nunca aparece para montadora nem bipadora. Venda acima de R$ 4.000,00 NÃO muda a tabela de valor de kits: mantém a tabela do estoque maior. [FEITO]

## 5. Montagem
| Regra | Situação |
|---|---|
| Quem monta é obrigatório. Sem montador válido o kit não é retirado. Kit sem montador não conta na comissão da bipadora | [FEITO] |
| Montadora só monta como ela mesma. Uma montadora monta 1 kit por vez. Quem aperta primeiro fica com o kit | [FEITO] |
| Supervisão da montagem pode montar e designar | [FEITO] |
| Montar pelo computador direto da listagem, mostrando as preferências | [FEITO] |
| Kit acima de R$ 15.000,00: conferência da supervisão | [FEITO] |
| Kits altos (a partir de R$ 3.000,00 de venda): montados pelas funcionárias do antigo setor de Encomendas; a partir de R$ 4.000,00, na mesa maior; exceção só da supervisão ou do Marcus | **[A CONFIRMAR]**: o código está DESLIGADO (limite 0, 16/11/2026) |
| Divergência de bipagem acima de 20% conta contra a montadora (a cada 5 divergências perde 5% do bônus) | [FEITO] |
| Bônus da montadora por dia: 8 kits normais = R$ 15,00 + R$ 2,00 por kit a mais; 6 kits especiais (acima de R$ 12.000,00) = R$ 15,00 + R$ 3,00 por kit a mais. A nota do kit vem da revendedora e corta o bônus | [FEITO] |
| Escolher o próprio nome na coluna Montadora depois de concluir | **[A CONSTRUIR]** |
| A montadora começa a montagem no CELULAR dela (03/11/2026). A tela do celular mostra só o necessário: revendedora, horário da listagem, peças a montar e as preferências do kit. SEM valor do kit, SEM condicional, SEM histórico de vendas (16/11/2026: "a funcionária que monta precisa somente montar"). O horário mostrado é o da listagem (ex.: 17/11, 12h) | **[A CONSTRUIR]** |
| Bônus de montagem e nota: a nota do kit vem da REVENDEDORA, que avalia o atendimento da representante e o kit ao recebê-lo (12/11/2026). Supervisão = função da montagem | [FEITO o bônus; a avaliação é A CONSTRUIR] |
| Envio no atendimento: tela de bipagem de envio que avisa se a revendedora tem encomenda (18/11/2026). Motivo: a condicional de encomendas foi fechada por engano ao iniciar a bipagem de outra e as peças da cliente não foram | **[A CONSTRUIR]** |
| Montagem grava em um só lugar (hoje a janela da listagem e a fila gravam em locais diferentes) | **[A CONFIRMAR]** |

## 6. Bipagem e retorno
- **Bipagem de envio:** a bipadora bipa kits o dia todo. Uma bipadora bipa 1 kit por vez. [FEITO]
- **Retorno:** o kit chegou quando o agendamento dá o OK de recebimento no Consolidado. Só então entra na fila para bipar. Quem pode bipar está marcado no Configurador geral. [FEITO]
- **Regra do retorno [A CONSTRUIR]:** a bipadora clica em "iniciar o retorno" (senão não vê as informações), só abre outro depois de finalizar, e precisa dar "finalizado".
- **Carregar:** a venda finalizada e conferida vai ao faturamento ("Carregar"). Faturamento emite a nota na DevMaster. [A CONSTRUIR] a tela só de faturamento das vendas a carregar.
- **Alerta de retorno parado [A CONSTRUIR]:** chegou e não foi bipado em 24 horas = alerta; em 48 horas = alerta aos sócios. Não conta sábado à tarde e domingo.
- **Punição por fechar no Admin e não na DevMaster (R$ 20,00 da bipadora):** o Marcus perguntou "20 reais é bom?" e não houve resposta. **[A CONFIRMAR]**
- **Conferência da bipadora:** a bipadora vê o Consolidado (sem valor esperado) para conferir valores, brindes e peças. Ela confere peça por peça. [FEITO]
- Controle de kits (tela) foi retirado em 23/11/2026.

## 7. Condicionais
- Vêm da DevMaster. Só entram as ativas. Fora: vendedor Expositor (04), Encomenda (91) e previsão em 2100 ou depois. [FEITO]
- **Acerto + saída:** todas. **Acerto + kit novo:** só as com previsão de devolução em até 90 dias. Kit novo: não pega condicionais antes de montar. [FEITO]
- **Expositor:** condicional com devolução em anos à frente (ex.: 3000). Quem tem só expositor e nenhum kit vale registrar à parte. Expositores de dois andares, displays e cubos são classificados juntos. [A CONSTRUIR] a classificação.
- A revendedora tem UM kit principal (a condicional mais antiga ativa). Outras condicionais do mês: peças do próximo mês, reposição, kit novo. Quando o acerto acontece, o principal e as reposições fecham na DevMaster, e o kit novo vira o principal sozinho. [A CONFIRMAR] como marcar cada tipo no sistema.
- Uma mesma revendedora aparece com UMA condicional na DevMaster e DUAS no app (16/11/2026, caso real). Alinhar a contagem. **[A CONFIRMAR]**
- A condicional é gerada na EMPRESA. Na entrega, a revendedora assina digital e a representante confere as peças pela câmera. Assinada ou não, a representante marca por condicional. [FEITO no app]
- Texto do termo e da nota: `docs/regras/INADIMPLENCIA-E-JURIDICO.md`, seção 8.
- Papel impresso: a DevMaster imprime; trocar o texto lá. [A CONSTRUIR]

## 8. Quem faz o quê

| Função | Faz | Não faz / não vê |
|---|---|---|
| Representante | Cria listagem, inclui revendedoras, retira o kit, faz o acerto, entrega kit novo e reposição | Não vê dinheiro de outras |
| Agendamento | Cria listagem interna, confere recebimento (OK de chegada), marca remarcação | Não vê valores totais |
| Condicionais | Confere as condicionais antes da fila | |
| Supervisão da montagem | Define valor, monta, designa, aprova | |
| Montadora | Monta o kit que escolheu | Não vê valor do kit |
| Bipadora | Bipa envio e retorno, atende no balcão, solicita retirada | Nunca vê o valor esperado |
| Faturamento | Confirma pagamentos e emite a nota na DevMaster | |
| Encomendas e reposições | Top 100: separa peças, monta kits altos | |

Atendimento interno: quem atende é só quem está liberado (hoje duas funcionárias). Ganha R$ 5,00 fixo por atendimento; venda acima de R$ 4.000,00 paga R$ 10,00. Quem bipou e quem atendeu avaliam o atendimento (a revendedora recebe a avaliação). [FEITO a comissão; a avaliação é A CONFIRMAR]
Regras de tempo, tolerância de 30 minutos, kit retornando, relógio e crédito no acerto: `REPRESENTANTES-E-COMISSOES.md`, seção 4.3.

Acessos de bipagem (05/11/2026): as funcionárias da bipagem têm login só para a tela Atendimento Sorelly, mais a aba Comissões (PDF e resumo, que TODOS os funcionários veem). A tela de comissão da bipagem fica no setor delas; acesso só da diretoria e da supervisão da montagem (13/11/2026). O Consolidado das representantes é do setor de bipagem (conferir acertos na empresa); o Financeiro só vê o consolidado e as comissões.

## 9. Pontos fracos do código (leitura de 05/11/2026, ainda valem até alguém corrigir)
- Condicionais da DevMaster (`condsReais`) não entram na montagem e na bipagem (`cond.nums`). Conferência real não acontece.
- `ADD_KIT` nunca cria o status `precond`: a fila da conferência de condicionais fica vazia para kits reais.
- Estado do kit só no navegador (sem módulo no servidor).
- Retirada pelo app ou "sozinha" pula o código e a assinatura (confia na tela).
- Detalhe completo: `docs/negocio/FLUXO-LISTAGEM-A-RETIRADA.md`.
- Em 12/11/2026 o Marcus avisou: as listagens feitas no app da representante não subiam no Admin para a funcionária das condicionais, e as montadoras ainda usavam o Admin antigo para ver as preferências dos kits. Em 16/11 pediu teste com a funcionária das condicionais e uma ou duas representantes. **[A CONFIRMAR]** se foi resolvido.

## 10. Expositores em aberto (09 a 24/11/2026) [A CONSTRUIR em parte]
- **Onde:** no Admin, setor Encomendas e reposições. NÃO no app da representante (09/11/2026). O código de expositores existe (`domain/expositores.js`).
- **Para que:** saber quem está com expositor e sem kit, falar com a representante, mandar buscar, dar baixa se já voltou. A empresa confere com a representante antes de cobrar a revendedora ("às vezes a revendedora engana"). Quem busca: o entregador ou a própria representante.
- **Abas pedidas:** todos; expositor com kit ativo; expositor com revendedora SEM kit; expositor com revendedora COM kit há mais de 70 dias. Revendedora com kit há mais de 90 dias: executar a nota promissória. Cobrança só se estiver "mais de 60 dias em aberto". **[A CONFIRMAR]** os três números (60, 70, 90).
- Usar a data da ÚLTIMA VENDA para dizer desde quando a revendedora está sem kit, não a data da condicional do expositor.
- Campo de observação livre por caso (o Marcus avalia caso a caso). Ainda NÃO se fecha o expositor na DevMaster: anota-se na observação (11/11/2026).
- Mostrar as vendas dos últimos 3 meses e a média de quem tem expositor (18/11/2026). Contar quantos expositores existem e quantos estão com revendedoras sem kit.
- Mensagem copiável por representante, para o Marcus enviar e cobrar (09/11 e 10/11).
- **Entrega do expositor (24/11/2026):** registrar se foi feita pela representante ou pelo entregador; se foi pelo entregador, anexar o comprovante do Pix da taxa de entrega. **[A CONSTRUIR]**
- Revendedora sem representante ativa: quem verifica é o agendamento das representantes.
- Valores de perda: coroa R$ 100,00, chave R$ 100,00, expositor quebrado = preço da condicional (seção "Expositor" de `REPRESENTANTES-E-COMISSOES.md`).

## 11. Reposição, encomendas e Top 100 (09 a 24/11/2026)
- Regras de quantidade e valor: `REPRESENTANTES-E-COMISSOES.md`, seção 6.
- O setor "Encomendas e reposições" é UM só. "Separar peças" significa separar peças para reposição ou para encomenda do próximo kit; não é para ida à empresa (17/11/2026). Três funcionárias atendem cerca de 100 revendedoras; não dá para separar para todas. Top 100 entra no funil normal, com coluna "Top 100" e filtro.
- Funil de pedidos: filtros por Top 100, por representante e por entrega (representante ou empresa). Primeiro passo pedido pelo Marcus: zerar o funil de pedidos. Quem vai à empresa liga com o atendimento interno. **[A CONSTRUIR]**
- Formulário de pedido: a revendedora manda foto e descrição. A mensagem antes de enviar explica que o setor existe para ajudar, que todas as reposições são pagas (o valor é do entregador), que revendedora de outro estado faz encomenda e que pedido com 15 dias ou mais antes do acerto vai como encomenda, sem taxa. **[A CONSTRUIR]** (texto do Marcus de 17/11/2026).

## 12. Quem é quem no agendamento (02/11/2026)
- Agendamento INTERNO: cuida dos acertos internos em geral e aplica a multa ao agendar.
- Agendamento das REPRESENTANTES: cuida das revendedoras das representantes. Quando a representante sai, a revendedora vai para esse agendamento.
- Uma terceira pessoa ajuda os dois. Qualquer uma pode fazer qualquer coisa; elas se organizam. Quem marca a funcionária no RH é o RH.
