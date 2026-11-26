# Regras: kits novos, indicações, moedas, prêmios e recusas (vigentes em 25/11/2026)

Documento ÚNICO e vivo. Só a regra de HOJE, escrita a partir do que o Marcus disse de 28/09 a 24/11/2026, dos documentos e do código.
Se este texto e o código discordarem, o CÓDIGO vence: corrija este arquivo. Mensagem mais nova vale sobre a antiga.
Sem nome de revendedora, sem telefone, sem endereço, sem horário pessoal de representante (isso fica nos arquivos `.local`).
Marcação: **[FEITO]** já no sistema · **[A CONSTRUIR]** decidido, falta construir · **[A CONFIRMAR]** o Marcus não decidiu.
Pendências, conflitos e duplicidades: `docs/pendencias/encomendas-e-kits-novos.local.md`.
Comissão da representante, brinde, multa e dívida: `docs/regras/REPRESENTANTES-E-COMISSOES.md`. Meta: `docs/regras/METAS-REVENDEDORAS.md`.

## 1. Quem é quem

| Papel | Quem hoje | Observação |
|---|---|---|
| Kits novos e Indicação | Michele (supervisão: Nickolas) | Elo entre o cadastro e a montagem |
| Cadastro de revendedoras | Camilly, Thalyanny; Nickolas lidera | Michele e Helen também ficam no setor; link de pagamento é setor próprio |
| Agendamento do kit novo interno | Tamara (acertos internos) | Lista de kits novos pendentes de agendar fica em cima do calendário |
| Agendamento das revendedoras de representantes | Ana Maria, com a Mariana | Quando a revendedora sai de uma representante, o pedido vai para a Ana Maria passar a outra |
| Quem avalia o kit e a representante | A própria revendedora, ao receber o kit | A nota vem da revendedora |

Acesso: o setor vê só a tela de Kit novo, com o valor do kit. Não vê comissão nem as demais telas. **[FEITO]**

## 2. Fluxo do kit novo

```
Marketing ─► Leads (Kommo) ─► Cadastro de revendedoras ─► Kits novos (Michele)
   ├─► Representante: aceita, coloca na listagem dela ─► Condicionais ─► Montagem ─► Bipagem ─► Retirada ─► Entrega em casa
   └─► Agendamento (interno): marca o dia ─► revendedora vem à empresa ─► Atendimento ─► Montagem com a atendente ─► Bipagem
```

- A Michele escolhe: encaminha para uma representante (que coloca na listagem dela pelo app) OU para o Agendamento (a Sorelly conta como uma representante, com listagem própria, código 02).
- **Kit novo NÃO pega condicionais** (regra de ouro). Só quem já tem kit pega.
- **Kit retornando** (revendedora que volta) = kit novo: vai direto para a montagem; 1 hora para escolher as peças e explicar todas as regras. Abre outra tela de atendimento.
- Kit novo é gerado em geral **só 20 dias depois** do primeiro kit; antes disso é reposição.
- Kit novo pode ser marcado 4 ou 5 dias depois, porque encaixa na listagem ou rota da representante. Isso **não** é bug.
- Pode ir com expositor (ver seção 6).
- O valor do kit vem das médias: kit inicial usa o **valor padrão R$ 7.000,00** (`CFG0.valorPadrao`); quem já vendeu usa a média (as últimas vendas). A representante **não vê** o valor do kit.
- **R$ 7.000,00 é a média de referência para a equipe**, não é bug nem valor por revendedora. A Michele edita as opções de valor do kit novo (passo a passo escrito).

### 2.1 Etapas e prazos no sistema **[FEITO]** (`kits-novos/domain/etapas.js`, `config.js`)

| Etapa | Prazo em dias |
|---|---|
| 1 Liberado | 1 |
| 2 Solicitado | 1 |
| 3 Bipado (kit pronto na empresa) | 3 |
| 4 Entregue (chegou na revendedora; falta a condicional voltar) | 3 |
| 5 Devolvido (condicional voltou) | fim |
| Cancelado | com motivo: não responde, sem interesse, desmarca com a representante, cadastro reprovado, endereço inválido |

- **Aguardando peça** = kit parado de propósito (falta de peça, de representante ou de cadastro). **Não conta como atrasado.** Os kits retidos por falta de peça vão para "Aguardando peça"; os solicitados à bipagem ficam em "Solicitado". (Marcus, 06/11.)
- Atrasado = dias na etapa maior que o prazo, fora "Aguardando peça".
- Fora do prazo de 48 horas: só com autorização do Marcus ou do Nickolas, e a representante entra como atrasada. **[FEITO]**
- Desmarcações: máximo 3 por revendedora (`maxDesmarcacoes`). Oculta kit antigo após 7 dias (`ocultarApos`).
- Kit novo só aparece na tela "Kits novos" quando a revendedora **concluiu** o cadastro (conferência de documentos ainda não conta). Etapa "Cadastradas" junto das demais, na mesma tela, a pedido da Camilly **[A CONFIRMAR]**.
- Se não há kit novo, mostra só o ícone com 0 (sem barra) (Marcus, 09/11).

## 3. Quem recebe o kit novo (indicação da representante) **[FEITO como sugestão]**
O sistema SUGERE; a Michele decide e dá o OK com o motivo escrito. Pesos em `kits-novos/domain/indicacao.js`.

| Critério | Regra |
|---|---|
| Região | Cidade e bairro da revendedora x mapa de regiões da representante. Bairro pesa mais que cidade |
| Horário | Janelas de horário da revendedora x dias e períodos que a representante atende |
| Carga | Mais de **120** revendedoras = o ideal é NÃO mandar kit novo (pode, mas pesa contra). Até **80** = "para fortalecer" (ganha pontos). O Marcus disse: fortalecer quem tem menos |
| Recusa | Com 2 recusas a representante fica bloqueada para kits novos (no código) |
| Representante que não quer uma região | Cadastro tem "não atende" por cidade ou bairro |

- A revendedora manda os horários dela por mensagem pronta da Michele; a Michele lança no app; a representante aceita ou não (tem representante que não trabalha no sábado).
- O cadastro da representante guarda **região (blocos que se adicionam e excluem, com "tem certeza?")**, dias e horários, endereço e se atende kit novo. Horários reais ficam em `docs/setores/representantes/` (arquivo local).
- Regiões do litoral, Ponta Grossa, Maringá, Joinville e Santa Catarina: "em breve".
- Quando a representante aceita, o Sorelly Chat abre a conversa com a revendedora **já com mensagem de apresentação** **[A CONSTRUIR]**.
- Representante com mais de um cadastro (ex.: duas contas da mesma pessoa) deve ser **juntada** nos relatórios e no app (24/11). Os controles continuam separados (cada uma faz diferente).
- Dados da planilha de Kits novos (2.415 registros, importada em 03/11) ficam no módulo `kndados` do servidor, nunca no Git. Falta decidir se o Admin vira a fonte única e de onde vêm telefone, CPF e endereço **[A CONFIRMAR]**.

## 4. Quando o kit novo é liberado (regras de acerto) **[FEITO]**
- Kit novo só se a revendedora pagou **80% ou mais** do acerto. Abaixo, só com autorização do financeiro.
- **Média das últimas vendas** abaixo de R$ 500,00 (representante) ou R$ 700,00 (atendimento interno): kit novo bloqueado e cadastro bloqueia. A representante pode dar nova chance no acerto; no interno, avalia a funcionária que está bipando e o financeiro (tela Direcionar).
- Pendência anterior: sem novo kit. Pagamento parcial quita primeiro a dívida antiga. Segunda dívida seguida: sem kit e kit recolhido.
- Sem nota promissória assinada, sem kit. Detalhe em `REPRESENTANTES-E-COMISSOES.md`, seções 4 e 5.
- Revendedora fica bloqueada ao ter dívida anterior ou "sumiu com o kit".

## 5. Entrega do kit novo (app e atendimento) **[FEITO em parte]**
- Passo a passo em blocos. **Cada bloco recebe um check da representante E um check da revendedora**; só assim libera o próximo.
- O app da revendedora é **obrigatório** para receber o kit novo. Quem não consegue baixar: a representante marca "sem celular no momento".
- Conteúdo explicado: regras do app, comissão e brinde (tabela com simulação de vendas), prazo e multas, expositor, indicação, regras do próprio cadastro.
- **Brinde na hora do acerto.** Peça que não está no acerto conta como vendida.
- Revendedora confirma só **nome e endereço**. Alterações de dados passam pela representante (registro antigo fica guardado).
- Primeiro acerto: "pré-agendado"; 5 dias antes a representante manda mensagem.
- Assinatura: obrigatória a nota promissória e a ciência das regras na entrega do kit novo **[ver conflito sobre "assinar no sistema" na lista de pendências]**.
- O kit novo aparece no app antes de o catálogo ser aberto; **enquanto o kit novo não destravar, a revendedora não vende**.
- Material de apoio = bolsinhas e caixinhas de presente (controle depois). Flanela e porta-joias são venda. Kit de Natal: Rayssa monta; 5 bolsinhas por R$ 10,00 no total, sem comissão; produto criado na DevMaster **[A CONFIRMAR quantidade]**.

### 5.1 Pagamento da representante pelo kit novo **[FEITO]**
- **R$ 20,00** por kit novo; **R$ 35,00** se entregar junto com expositor. Só com termo assinado. ACERTO + KIT paga só a comissão do acerto.
- Percentual: as representantes veem **sempre 8%**. Quem recebe 10% é negociação à parte e **não pode saber**; nunca escrever 10% em tela ou manual da representante.
- **Teste novo fluxo (desligado):** Representante Kit Novo entrega e ganha R$ 25,00 + gasolina e 2% do primeiro acerto; Representante Acerto leva 6% no primeiro acerto e 8% do segundo em diante; pagamento nos dias 1, 11 e 21; só Curitiba, só revendedoras marcadas. Falta data de início e suporte da revendedora nova **[A CONFIRMAR]**.
- Máximo de 15 kits novos por representante (`REPRESENTANTES-E-COMISSOES.md`, seção 6) **[A CONFIRMAR: o Marcus falou de 15 kits por listagem do dia]**.

## 6. Expositor no kit novo
- A representante monta o expositor e envia foto no app. Sem foto, fica pendente.
- Para a revendedora que recebe: coroa quebrada R$ 100,00; chave perdida R$ 100,00; expositor quebrado = preço da condicional. É explicado a todas, mesmo sem expositor.
- Resto das regras de expositor: `docs/regras/ENCOMENDAS-EXPOSITORES-TOP100.md`, seção 7.

## 7. Mensagens prontas do setor **[FEITO em parte]**
- Cada etapa do funil tem **mensagem pronta com botão copiar** no próprio card ou linha. Glossário: uma linha por mensagem; ao clicar, o sistema destaca a que foi copiada.
- Padrão: curtas, uma coisa por vez, com negrito e emoji. Formato de uma conversa fixa "MSG PRONTAS" para a equipe padronizar.
- Mensagens da revendedora **5, 4, 3, 2 e 1 dia antes do acerto** (as revendedoras não respondem): pedir valor de vendas, preferências do kit no app, horário. **[A CONSTRUIR]** (Plano 45/60 dias, fase 3: 20 mensagens e alertas).
- Mensagem de apresentação da representante ao aceitar o kit novo.
- Mensagem para a representante com a lista de revendedoras que não usam o app (nome e telefone para um clique) e link da App Store.
- Pós-vendas (tela multifunção da Letícia, para contatar quem não usa o app ou vende abaixo de R$ 500,00 no fim do mês) **[A CONSTRUIR]**.

## 8. Indicações e moedas

### 8.1 Funil e resgate **[FEITO]** (`domain/indicacoes.js`, `src/server/indicacoes.js`, ao vivo desde 19/11)
- A revendedora indica alguém no "Indique e Ganhe" do app e pede prêmio com **moedas**.
- Funil da indicação: Kommo → confere dados e localização → análise → documentos → cadastro → acompanha → após a entrega do kit, atualiza planilhas e libera as moedas da indicadora.
- Resgate: na fila → aguardando retirada (agenda de 08:00 a 18:00, de 30 em 30 minutos, até 7 dias) → retirado → ou cancelado (moedas voltam).
- Pedido de resgate em aberto há **24 horas = atrasado**, **48 horas = crítico**. Data retroativa de até 30 dias para registrar retirada que já aconteceu.
- Tela: aba "Indicações" no cadastro de revendedoras, com Funil, Resgates de prêmios, Retiradas, Revendedoras e moedas, Histórico.
- Moedas: **1.000 moedas por kit entregue**, creditadas ao finalizar (`moedasPorKit`) e **validade de 90 dias** (a validade só informa; `aplicarValidade` desligado). **[ASSUMIDO no código; A CONFIRMAR com o Marcus]**

### 8.2 Brinde de indicação no atendimento **[FEITO em parte]**
- O brinde de indicação sai com o **TES S007** (bonificação). **A diferença paga pela revendedora** (prêmio R$ 500,00, peças R$ 560,00, ela paga R$ 60,00) tem forma de pagamento própria (não cair como Pix se foi crédito). Hoje só o Brinde de indicação tem o campo; falta nos acertos comuns **[A CONFIRMAR]**.
- O valor liberado deve **vir do setor de Indicação**, com as peças e valores puxados sozinhos (Marcus, 17/11).
- Pedido do atendimento: anexar o print das peças retiradas **[A CONFIRMAR se o botão volta]**.
- Quem recebe o brinde de indicação pode não ter kit (não é necessariamente revendedora).
- A diferença paga **conta ou não na média** de vendas: duas mensagens de 27/10 dizem o contrário (ver lista de pendências).

### 8.3 Indicação de influenciadoras **[A CONFIRMAR]**
- Ideia do Marcus (12/11): R$ 250,00 em joias para cada indicação com cadastro aprovado; 10 aprovadas = mais R$ 1.000,00 em joias. Falta saber como identificar que a indicação veio da influenciadora. Cadastro das influenciadoras fica em página só do Marcus (dados pessoais em arquivo `.local`).

## 9. Prêmios

| Prêmio | Regra | Estado |
|---|---|---|
| Brinde de acerto (Normal e Select) | Tabela do acerto | [FEITO] |
| Brinde extra por meta | `docs/regras/METAS-REVENDEDORAS.md`, seção 5. TES S011 (premiação por meta) | [FEITO] |
| **Premiação do mês: Top 10 de novembro** | As 10 revendedoras com a maior soma de VALOR DE ACERTO no mês. Prêmios por colocação: porta-joias (grande, médio, pequeno), semijoias por lugar; 1º lugar R$ 1.000,00 em dinheiro; 2º jantar para 2. Divulgação em dezembro, depois do fechamento de todos os acertos | [FEITO] `domain/premiacao-mes.js`. Cada mês novo ganha uma entrada. Nomes das peças a conferir com os códigos do cadastro |
| Prêmio por moedas | Resgate (seção 8) | [FEITO] |
| Top vendedoras | Tela de ranking de vendedoras; premiação do mês e Top vendedoras viram abas dentro de um menu (Marcus, 23/11) | [A CONSTRUIR] |

- TES (tipo de operação) que não entram na venda da média: S006 troca, S007 indicação, S009 brindes e prêmios, S011 premiação por meta. Regra completa: `docs/negocio/MEDIA-DE-VENDAS.md`.

## 10. Recusas
- **Representante recusa kit novo:** deve ficar marcado em algum lugar, com quantos cada representante aceitou ou recusou (Marcus, 28/09). **[FEITO]**
- Hoje o envio é "aleatório" e se acompanha; rodízio e aceite **[A CONFIRMAR]**. O código bloqueia a representante com 2 recusas (nunca confirmado pelo Marcus).
- **Reposição recusada:** a regra formal (sem direito, acima do limite, além da quantidade, bloqueada) pode ser registrada como "Recusado" com mensagem pronta. Ver `ENCOMENDAS-EXPOSITORES-TOP100.md`.
- Cancelamento e remarcação do kit novo (multa, motivo): `docs/negocio/REGRA-CANCELAMENTO-E-REMARCACAO.md` e `REPRESENTANTES-E-COMISSOES.md`, seção 5.3. Revendedora que cancelou no dia sofre multa; as atendentes avisam. O atendimento interno mostra o tipo (kit novo, atacado, brinde, reposição, acerto) e se foi cancelado.

## 11. Onde está cada regra no código
`src/apps/kits-novos/domain/` (`etapas.js`, `config.js`, `status.js`, `indicacao.js`, `regioes-rep.js`, `ocupacao.js`, `viagens-rep.js`) · `src/apps/montagem/domain/indicacoes.js` · `domain/premiacao-mes.js` · `src/server/indicacoes.js` · `src/server/kommo.js` (leitura do funil Cadastro) · mapa das representantes: `docs/setores/representantes/` (arquivo local).
