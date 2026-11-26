# Regras: RH e funcionários (vigentes em 25/11/2026)

Documento ÚNICO e vivo, escrito a partir de TUDO que o Marcus disse nas conversas de 07/10 a 24/11/2026 e do código. Entre esta regra e o código: regra e código divergem? Não escolha um lado sozinho: registre em "Não alinhado" e, em dinheiro, jurídico, fiscal, trabalhista ou acesso, pergunte ao Marcus.
Só a regra de HOJE. **Sem salário, sem valor individual, sem CPF, sem chave Pix e sem senha** (repositório público). Valores de cada pessoa ficam em `docs/pessoas/<nome>.local.md` e em `docs/pendencias/rh.local.md` (fora do Git).
Marcação: **[FEITO]** já no sistema · **[A CONSTRUIR]** decidido, falta construir · **[A CONFIRMAR]** o Marcus não decidiu ou há conflito.
Fontes complementares: `docs/setores/rh/` (LEIA-ME e decisões), `docs/negocio/ACESSOS-E-CONTAS-28-10-2026.md`, `docs/negocio/FLUXO-DA-EMPRESA.md`, `docs/regras/REPRESENTANTES-E-COMISSOES.md` (seção 7), `docs/regras/FORNECEDORES-E-COMPRAS.md` (seção 8), `docs/DECISOES.md`.

## 1. Quem é quem (setor e responsável)

| Setor | Responsável hoje | Observação |
|---|---|---|
| Diretoria | Marcus (dono), Nickolas, Lucas | Anamaria (financeiro), Marco Antonio e Ana Beatriz são da família com acesso próprio (seção 2) |
| RH | Maria Claudia | Cuida também do Marketing (supervisão). Assistente do RH ajuda o Marketing nas fotos |
| Financeiro | Anamaria | Nayale e Bruna (faturamento). Dashboard só da Anamaria |
| Montagem, Bipagem, Produção, Condicionais, Retornos | Deysiane (supervisão) | Montagem e Bipagem são dois setores com a mesma responsável. Listagens: Majorry |
| Cadastro de revendedoras | Nickolas | Equipe de linha de frente (Camilly, Thali, Michele) e Helen (apoio e Link de pagamento). Kits novos fica dentro do setor (Michele) |
| Agendamento | Ana Maria | Tamara cuida dos acertos internos. Ana Maria cuida das revendedoras das representantes. Mariana ajuda as duas. Qualquer uma pode fazer qualquer coisa |
| Inadimplência e cobrança | Amanda de Miranda | Segunda Amanda divide a meta. Compras de peças dos funcionários entram aqui |
| Encomendas e reposições | Agatha | Elen e Eduarda |
| Cadastro de peças | Rayssa | Graziella |
| Marketing | Maria Claudia (supervisão) | Castilho, Beatriz, Gabrielle; Diego no tráfego pago (prestador PJ) |
| Compras, Negociações, Link de pagamento | Nickolas | |
| Representantes, Garantia, SAC, Tecnologia | Marcus | Facilities: Marco Antonio |
| Estoque de materiais | Geovana | Só as telas de estoque |
| Atendimento da revendedora na empresa | Maria Aparecida e Leci | Só elas recebem a comissão de atendimento (seção 6) |

- **Quem recebe de mais de um jeito** tem ficha em `docs/pessoas/` (ver o LEIA-ME de lá). Quem é funcionário e prestador ao mesmo tempo fica SÓ em Funcionários, nunca duplicar.
- **Nome é de quem ocupa o cargo hoje.** No código use setor e perfil, não pessoa.

## 2. Acessos e autorizações

### 2.1 Regras fixas
- **Acesso é por setor/perfil, nunca por pessoa.** Cada setor vê só o que é dele. [FEITO]
- **Cadastro de conta:** a pessoa se cadastra, a Diretoria aprova e define o setor pelo nome. Login simples sem espaço (Nickolas e Lucas só o nome; os outros, primeiro e segundo nome). [FEITO]
- **Senha:** provisória, entregue pela tela "Senhas para enviar" (só Diretoria). A pessoa troca no Perfil. Senha NUNCA vai para o Git nem para documento. [FEITO]
- **Só o Marcus** abre a conta de outra pessoa ("atuar como") e a aba Apps. [A CONFIRMAR: o código ainda libera Nickolas e Lucas]
- **Dinheiro** (valor do kit, vendas, comissões): só supervisão da montagem e Diretoria. Montadora e bipadora nunca veem valor. Quem confere acerto vê o valor da linha, não os totais. [FEITO]
- **Salário, custo de hora extra e CPF** na folha: só quem tem acesso total. [FEITO] (`veSalarios` em `domain/equipe.js`)
- **Faltas e atrasos (bolinhas dos últimos 10 dias):** só Marcus, Maria (RH), Anamaria, Nickolas e Lucas. O horário de trabalho, todos veem. [FEITO]
- **Funcionário não vê dado de outro funcionário.** Cada um acessa só a própria conta. [FEITO]

### 2.2 Grupos de acesso (menu) [FEITO]

| Grupo | Quem (código em `domain/equipe.js`) | Configuradores |
|---|---|---|
| Acesso total | Marcus, Nickolas, Priscila, Amanda de Miranda, Leonardo | Vê |
| Direção | Lucas, Anamaria, Marco Antonio, Ana Beatriz, Maria Claudia | Não vê (5 telas de configurador) |
| Supervisão da montagem | Deysiane | Como antes |
| Demais | Agendamento, Financeiro, Inadimplência, Bipagem, Montagem, Listagens, Kit novo, Cadastro de peças, Link e compras, Encomendas, Garantia, Estoque, Representante | Cada um abre só a lista do setor |
| Acesso básico | Início, Rotina, SorellyChat e Melhorias | Montadoras, Bruna, Diego e quem o Marcus colocar |

- O Marcus muda o acesso de cada pessoa em RH › Acessos e autorizações (uma tabela, uma linha por pessoa). Quem edita: Marcus, Nickolas, Lucas, Anamaria, Amanda de Miranda e Leonardo.
- **Representante** vê só o app dela. Financeiro e Listagens do Admin saíram (23/11/2026).
- **Ana Beatriz e Marco Antonio:** veem tudo, mas o servidor recusa gravar. Ana Beatriz altera só o Financeiro. Marco Antonio não altera nada.
- **Canal de denúncias:** não é liberado para o Marco Antonio nem para a Ana Beatriz.

### 2.3 Autorizações (quem pode FAZER) [FEITO, `domain/autorizacoes.js`]
Anamaria e Leonardo têm TODAS. O RH ajusta cada lista.

| Autorização | Quem pode (padrão) |
|---|---|
| Aprovar/reprovar cadastro de revendedora | Marcus, Nickolas, Lucas |
| Conferir pagamentos e definir contas do atendimento interno | Marcus, Lucas, Anamaria, Nickolas, Priscila |
| Aprovar compra / efetuar compra liberada | Financeiro aprova e libera; Nayale, Lucas (e Anamaria) compram |
| Ver as comissões da bipagem | Marcus, Nickolas, Priscila, Deysiane (o Financeiro só vê o consolidado) |
| Alterar regras das comissões | Marcus, Nickolas, Priscila |
| Autorizar pagamento em joias | Marcus, Nickolas, Lucas |
| Anexar PGR e PCMSO | Marcus, Maria (RH), Nickolas, Lucas |
| Ver bolinhas de presença no chat | Marcus, Maria (RH), Anamaria, Nickolas, Lucas |
| Lançar ocorrência na ficha de experiência / dar a nota do gestor | Marcus, Maria (RH), Nickolas, Lucas |
| Pedir mudança de setor, função, escala ou horário | Deysiane (supervisão do setor), Diretoria, RH |
| Confirmar ou recusar essa mudança | RH e Diretoria |
| Aprovar pedido acima do limite mensal de fornecedores | Ver `FORNECEDORES-E-COMPRAS.md` seção 4 |
| Remarcação de acerto | Marcus, Nickolas, Lucas ou Anamaria (não é só o Marcus) |
| Kit acima de R$ 7.000 (kit 5, 6, 8, 9 ou 10 mil) | Marcus ou Nickolas |
| Mudança de data de pagamento | Até 5 dias para frente, ok. Mais que isso, autorização (para não ter multa) |

### 2.4 Chat [FEITO]
- A conversa do Marcus fica sempre no topo de todos e toda mensagem dele dá notificação.
- Mensagem comum: aviso discreto (som baixo e contador). Cartão grande só para o Marcus e quem for marcado com @.
- Notificação com som, foto (Ctrl+V), arquivo e áudio. A faixa do chat mostra horário de trabalho e se está no almoço.
- **[A CONFIRMAR]** O Marcus quer consultar as conversas da equipe. Nenhuma tela de rastreio existe. Avisar a equipe (termo de uso ou contrato) por causa da LGPD.

## 3. Cadastro de colaboradores [FEITO]
- RH › Colaboradores é UMA tela só. Menu "Visão": Cadastro, Advertências, Experiência, Horas extras, Negociações, Escala 42h, Salário e bônus.
- Ficha completa: foto, empresa (CNPJ inteiro e cor), setor, função, escala, entrada e saída, banco, chave Pix, vínculo. A foto abre grande.
- **O sistema novo é a fonte dos horários** (29/10/2026). Não ler mais o admin antigo para isso.
- **Formulário dos funcionários:** um link por pessoa (`/meus-dados/<código>`), a pessoa preenche no celular, o RH revisa e aplica. Só gerar e enviar os links pelo site publicado. [FEITO; nunca testado ponta a ponta]
- **Mudança de setor ou função:** a supervisão pede em RH › Solicitações e o RH confirma. Só então o cadastro muda. [FEITO]
- **Funcionária ativa no RH** é a que vale para a comissão de funcionária (seção 6.4). Quem sai: o RH desliga e a comissão volta ao normal sozinha.
- **Filtro "não funcionários"** (média de vendas): funcionárias ficam fora porque quebram a média. Vale quem tem registro de funcionário no cadastro do cliente.
- **Pasta por pessoa:** `docs/pessoas/<nome>.local.md` só para quem recebe de mais de um jeito. Não existe pasta por funcionário.

## 4. Salário, adiantamento e folha

| Item | Regra | Estado |
|---|---|---|
| Adiantamento | Dia 20 do mês. É 40% do salário base | [FEITO] `SalarioVisao.js` |
| Salário (o que sobra) | 5º dia útil do mês, segunda a sábado, sem os feriados do Configurador do RH | [FEITO] |
| Sábado conta como dia útil | Marcus confirmou em 18/11/2026 | [A CONFIRMAR] a contabilidade disse que Pix só vale até a sexta (03/11) |
| Comissões e metas | Pagas dia 15 (data configurável no Configurador de datas) | [FEITO] |
| Quem paga | Cada funcionário é registrado e recebe do CNPJ dele. Pagamento "por fora" é à parte (seção 5.3) | [FEITO] |
| Folha | Salário e adiantamento ficam JUNTOS na linha do funcionário, do maior para o menor. Colunas: salário base, total recebido, adiantamento, VR, VT, hora extra, bônus, 13º | [FEITO] (só supervisão) |
| 13º | Coluna própria. Cálculo sobre o salário todo (inclui o "por fora") | [A CONFIRMAR] regra do 13º por pessoa |
| INSS, FGTS, IRRF por pessoa | Não existem no sistema; vêm do holerite | [A CONSTRUIR] |
| Puxar do Financeiro | Lê as contas pagas da DevMaster e grava por mês ("Gravar os meses") | [FEITO] só ano corrente |

- **Objetivo do Marcus:** diminuir a folha e a hora extra (o total fica em `docs/pendencias/rh.local.md`). Princípio: mais meta e taxa, menos hora extra cara.
- **Relatório de remuneração** (formato da Edna: salário base, adiantamento, salário pago, horas extras, diferença salarial, VR, VT, bônus, total) entra pessoa por pessoa.
- Funcionário é um bloco só em Contas a pagar; o RH não duplica o que o Financeiro já mostra.

## 5. Horas extras

### 5.1 Duas coisas diferentes (nunca misturar)
| Tipo | O que é |
|---|---|
| Hora extra **normal** | Da folha, pela lei e pela convenção (65% e 85%). Não muda |
| Hora extra **por fora** (negociação) | Valor fechado em reais, combinado entre supervisor e funcionária. NÃO substitui a da folha. Fica em RH › Negociações |

### 5.2 Regras da negociação por fora [FEITO nos campos; teto A CONSTRUIR]
- Tabela por **grupo** (Diretoria, Setor Marcus, Cadastro, Geral) e exceção por pessoa. Colunas: 1h, 2h, 3h, sábado, máximo por dia, vezes por semana, sábados por mês.
- É preciso **completar as horas definidas** para ter o valor.
- Limite de **2 horas por dia**.
- Sábados: no máximo **2 por mês**.
- Vezes por semana com valor: **3** (regra antiga) ou **2** (proposta de 21/10/2026) [A CONFIRMAR]. Mensagem do Marcus: no máximo 3 vezes por semana com valor; pode fazer 5 vezes por semana, mas sem o valor a mais.
- **3ª hora** só com aprovação prévia da supervisão.
- **Teto mensal por pessoa:** decidido em 21/10/2026, **sem valor definido** e sem campo no código. [A CONSTRUIR] / [A CONFIRMAR]
- Quem lança, quem aprova e quando paga: [A CONFIRMAR] (o diário de 19/10/2026 deixou essas três perguntas abertas).
- **Em joias:** o combinado pode ser em joias (valor a preço de venda, custo da empresa 20%). Hoje entra à mão em "Combinados avulsos". [A CONSTRUIR] ligar à folha e ao Pagamento em joias.
- Valores por grupo e por pessoa: `docs/pendencias/rh.local.md`.

### 5.3 Outros pagamentos por fora
- Prestador que também é funcionário (segurança, marketing, etc.) tem ficha em `docs/pessoas/`. Aparecer nos dois blocos do Resumo de pagamentos não é erro.
- Bônus por fora: lançar como "combinado", marcar pago com a data. Cuidado com a lista dupla Admin x DevMaster (mesmo pagamento com datas diferentes).

## 6. Bônus, metas e comissões por setor
A meta **muda todo mês** (cada mês tem as suas faixas). Tela: Financeiro › Comissões. Regra do código: `domain/metas-setor.js`.

| Setor | Regra (faixas de HOJE) | Estado |
|---|---|---|
| **Cadastro de revendedoras** | Meta = nº de revendedoras ATIVAS no fechamento do mês (dia 1 às 08:00). 5 faixas por pessoa da linha de frente; a Helen recebe 50% do valor da faixa. Pagamento entre 12 e 13 | [FEITO] outubro; novembro e dezembro [A CONFIRMAR] |
| **Inadimplência e cobrança** | Meta = valor RECEBIDO na conta da Sorelly no mês (inclui compras de peças dos funcionários). 5 faixas, vale a maior atingida, bônus dividido 50% para cada Amanda, fechamento no último dia | [FEITO] outubro; novembro [A CONFIRMAR] |
| **Link de pagamento** | 5 faixas de valor pago no mês (Bronze, Prata, Ouro, Platina, Diamante). Gerado no e-SiTef pela Helen | [FEITO] outubro |
| **Agendamento** | Metas de 94, 95, 96 (hoje 96, 97, 98%) do previsto VIGENTE, com bônus por faixa. Quem sai do mês conta; mudança para dentro do mês não pesa. A mudança de data feita por Deysiane conta como do Marcus | [FEITO] |
| **Montagem de kits** | Por dia e por colaboradora. Kit normal: meta de 8 kits no dia; kit especial (acima de R$ 12.000): meta de 6. Abaixo da meta = R$ 0. Extras pagos por kit. Supervisão ganha por colaboradora que bate a meta. A nota da revendedora corta o bônus | [FEITO] tela; cortes da nota [A CONFIRMAR] |
| **Bipagem de atendimento interno** | Valor fixo por atendimento, desconto por erro e bônus por nota 4 ou 5 da revendedora. É OBRIGATÓRIO marcar quem montou o kit; sem isso a bipadora não ganha | [FEITO] provisória |
| **Atendimento da revendedora na empresa** | Valor fixo por atendimento; atendimento de venda alta paga o dobro. Só Maria Aparecida e Leci recebem | [FEITO] sem Configurador |
| **Produção interna** | Meta por dia por funcionária; bônus pelo % da meta batido naquele dia. "A regra agora é só por dia e pronto." Faixas só mudam no código. Pagamento em dinheiro | [FEITO] |
| **Produção externa** (em casa) | Valor por peça. Dávila, Leci e Didi. Fica fora do bônus. Detalhes em `docs/pessoas/producao-externa.local.md` | [FEITO] dia da semana [A CONFIRMAR] |
| **Marketing** | Meta semanal de fotos de catálogo com bônus. Semana nova = meta nova | [FEITO] tela; meta 23 a 27/11 [A CONFIRMAR] |
| **Encomendas** | Quem monta kit acima de R$ 4.000 (Elen, Agatha, Eduarda) ganha como as outras, só que normalmente só os kits altos | [FEITO] |
| **Trocas** | Setor de garantias: não ganha meta | Decidido |
| **Diretoria e supervisão (bônus fixo)** | Bônus individual combinado pelo Marcus. Valores em `docs/pessoas/` | [FEITO] como "combinado avulso" |

### 6.1 Princípios
- Meta e bônus ficam no setor; o Financeiro só paga e registra a forma de pagamento. Há registro de todos os meses (sistema "para 100 anos").
- Configurador de metas do Agendamento fica em Financeiro › Comissões.
- Meta nova não pode quebrar a lista: "Criar meta do mês" copia a anterior para editar.

### 6.2 Quem vê
- Comissões em valor: Diretoria e Financeiro. Funcionária vê só a dela. Comissão da bipagem: Diretoria e Deysiane (13/11/2026).

### 6.3 Premiação em joias
Modelos, fotógrafas e funcionárias podem receber em joias (custo da empresa 20% do preço de venda). Quem autoriza: Marcus, Nickolas, Lucas (RH › Pagamento em joias).

### 6.4 Comissão da funcionária que faz o próprio acerto (Atendimento Sorelly) [FEITO]
Ver `REPRESENTANTES-E-COMISSOES.md` seção 7. Só a comissão muda; brinde, taxa e multas seguem a tabela normal. "Funcionárias" inclui as representantes que forem funcionárias.

| Venda | Até 30/11/2026 | A partir de 01/12/2026 |
|---|---|---|
| R$ 300 a 499,99 | 35% | normal |
| R$ 500 a 999,99 | 45% | 35% |
| R$ 1.000 a 1.999,99 | 50% | 45% |
| R$ 2.000 ou mais | 50% | 50% |

### 6.5 Multas ligadas a quem agenda
Aviso de cancelamento com menos de 48 horas: perde 2% da comissão e 15% do brinde. Atestado apresentado afasta a multa. Revendedora que desmarca com motivo fica registrada.

## 7. Presença, ponto, expediente e escala

| Tema | Regra | Estado |
|---|---|---|
| Presença diária | Lançada por dia (presença, atraso, atestado, falta). Alimenta a ficha de experiência | [FEITO] |
| Horário no chat | Todos veem o horário de todos. Bolinhas só para quem tem a autorização (seção 2.1) | [FEITO] |
| Timer de trabalho do Marcus | Só na conta dele (pausar e finalizar o dia). Decidido em 14/10/2026; não achei no código | [A CONFIRMAR] |
| Bate ponto dos "combinados avulsos" | É só uma marca; não muda a Presença | [A CONSTRUIR] |
| Escala 42h (fim da 6x1) | A partir de 16/12/2026 cada pessoa trabalha 42h com 2 folgas. Equipe A seg a sex; Equipe B ter a sáb. Atendimento, Bipagem e Agendamento se dividem; Financeiro e outros seguem seg a sex | [FEITO] só planejamento; é "sugestão" |
| Sábado | O setor de cadastro trabalha no sábado. Primeiro ver quem já aceita terça a sábado; quem não aceitar, contratar | [A CONFIRMAR] |
| Atualização do RH do admin antigo | Tarefa agendada fora do repositório | [A CONFIRMAR] horário |
| Fim de ano (24/12, 26/12, 31/12, 02/01) | Expediente normal, reduzido, folga ou compensação? | [A CONFIRMAR] |
| Vagas | Quando sai alguém do atendimento, trocar ou contratar para cobrir | [A CONFIRMAR] |

## 8. Experiência, efetivação, avaliação e advertência

- **Experiência (45 + 45 dias):** ficha de 100 pontos. Assiduidade 20, pontualidade 15, comportamento 20, qualidade 20, produtividade 15 e adaptação 10. As duas últimas vêm da nota do gestor (0 a 10). Faltas e atrasos vêm da Presença e o RH confirma. A pessoa avaliada NUNCA vê a ficha. [FEITO]
- **Faixas da recomendação:** 85 a 100 efetivar · 70 a 84 acompanhar · abaixo disso não recomenda.
- **Quem dá a nota:** o gestor do setor, só para a própria equipe (Montagem, Atendimento, Bipagem e Condicionais: Deysiane; Cadastro e Kits novos: Nickolas; Peças: Rayssa; Agendamento: Ana Maria; Financeiro: Anamaria; Inadimplência: Amanda; RH e Marketing: Maria Claudia). Marketing é a própria Maria do RH.
- **Decisão de efetivar:** Marcus decide; Anamaria ou Lucas também podem. Fluxo: alerta no dia da 1ª e da 2ª avaliação, a Maria clica uma vez, vai ao grupo do RH, e o card de decisão tem dois botões (sim ou pedir mais informações). A ficha tem a foto. [FEITO]
- **Advertências:** contagem e motivos aparecem no card da pessoa. [A CONSTRUIR] mostrar todos os motivos quando há mais de uma.
- **Avaliações separadas** (representantes pelas revendedoras, montagem de kits, funcionários pelos supervisores): páginas próprias, fora do Configurador. [FEITO] em parte
- **Ocorrência:** o RH lança; gestor e Diretoria veem.

## 9. Contratos (RH › Contratos) [FEITO as telas; anexos A CONSTRUIR]
Oito telas, padrão tabela com filtro: Representantes, Funcionários (CLT), Terceiros, Crédito bancário, Aluguéis, Consórcios, Particulares do Marcus e Modelos.
- **Terceiros:** tipo, registro e honorário. Contratos de Leonardo, Castilho e Igor vão para Terceiros.
- **Crédito bancário:** a Ana Beatriz levanta os contratos e guarda em pasta do Drive com o nome "Banco - Nº contrato - AAAA-MM". Para cada crédito: contrato assinado, tabela de parcelas e saldo devedor de hoje.
- **Anexos (PDF assinado)** ficam só no navegador deste computador. [A CONSTRUIR] gravar no servidor.
- **Advogados e contador:** não cadastrados. [A CONFIRMAR] nomes.
- **Representantes:** o contrato novo leva a taxa por entrega de reposição (Marcus, 21/10/2026; regra de Encomendas).

## 10. NR-1 e segurança do trabalho (RH › Segurança do trabalho) [FEITO em grande parte]
Parceiro: Flexx (técnico de segurança). A Axis (CNPJ 67) tem proposta própria. Não é aconselhamento jurídico: o técnico e o contador confirmam o que a lei exige.

| Ação | Prazo | Estado |
|---|---|---|
| PGR e PCMSO por CNPJ | 20/11/2026 | Atrasada. Tela e aba "PGR e PCMSO" prontas; cada colaborador abre só o do CNPJ dele |
| Canal de denúncias | 30/11/2026 | Formulário público `/canal-de-etica` e tela restrita feitos |
| Pesquisa de clima | 31/12/2026 | Formulário anônimo `/pesquisa-de-clima` feito; rodada oficial a abrir |
| Ordem de Serviço, EPIs, CIPA, incêndios | 18/12/2026 | A construir; modelo de OS com erros |
| Ergonomia | sem prazo | |

- **Canal de denúncias:** anônimo (sem nome, e-mail, IP nem aparelho). Lê: Marcus. A pergunta "envolve sócio ou a direção?" marcada "Sim" é lida só pela Maria (RH). Só quem lê a denúncia responde. Alerta crítico para quem lê. Não prometer anonimato absoluto.
- **Pesquisa de clima:** 10 afirmações de 1 a 5, rodada trimestral, resultado por setor só com 5 respostas ou mais.
- **Alerta de prazo:** Marcus e Maria recebem alerta quando a ação vence em até 3 dias ou passou do prazo.
- **Aba PGR e PCMSO:** aberta a todo colaborador (só o próprio CNPJ).

## 11. Quem aprova o quê (resumo)

| Decisão | Quem decide |
|---|---|
| Efetivar colaborador | Marcus (ou Anamaria, Lucas) |
| Hora extra por fora: valor e grupo | Marcus |
| Hora extra: 3ª hora | Supervisão do setor |
| Bônus, meta e faixa nova | Marcus (Financeiro paga) |
| Acesso e autorização de cada pessoa | Marcus (Nickolas, Lucas, Anamaria, Amanda e Leonardo editam) |
| Mudança de setor, função ou horário | Supervisão pede; RH confirma |
| Pagamento em joias | Marcus, Nickolas ou Lucas |
| Remarcação de acerto | Marcus, Nickolas, Lucas ou Anamaria |
| Kit fora de R$ 7.000 | Marcus ou Nickolas |
| Escala, fim de ano e contratação | Marcus (com o contador) |

## 12. Em aberto (perguntas ao Marcus)
1. Valor do **teto mensal de hora extra** por pessoa e se a regra é 2 ou 3 vezes por semana.
2. **Sábado como dia útil** no salário: vale o Pix no sábado? (a contabilidade disse que não).
3. Quem pode **abrir a conta de outra pessoa** ("atuar como"): só o Marcus ou também Nickolas e Lucas?
4. **Amanda de Miranda e Priscila**: confirmar Acesso total (sem exceção) nas duas contas.
5. Metas de **novembro e dezembro** (Cadastro, Inadimplência, Link, Marketing) e corte da **nota da revendedora** na montagem.
6. **Fim de ano e escala 42h**: expediente de 24/12, 26/12, 31/12 e 02/01; quem fica em A e B.
7. **Canal de denúncias**: liberar para mais alguém? Publicar a rodada oficial da pesquisa de clima?
8. **Aviso à equipe (LGPD)** sobre leitura das conversas do chat.
9. Pagamento da **produção externa**: sexta, quinta ou quarta?

Lista detalhada, com datas e conflitos entre mensagens, docs e código: `docs/pendencias/rh.local.md`.

## Decisões do Marcus em 25/11/2026 (questionário)
- [FEITO] A Priscila (id 37) VÊ o Financeiro. Acesso total, igual ao código (`domain/equipe.js:33` e `:101`). A frase de 19/11 ("tudo, menos o financeiro") está SUPERADA.
- [FEITO] "Atuar como" outra pessoa: SÓ o Marcus (id 16). Mudado em `components/seletor-acesso.js` (`podeTrocar`). A frase de 27/10 vale. O código antigo liberava 16, 17, 28 e 44.
- [A CONSTRUIR] O servidor não confere quem pode atuar como outra pessoa (só a tela). Conferir também no servidor.
