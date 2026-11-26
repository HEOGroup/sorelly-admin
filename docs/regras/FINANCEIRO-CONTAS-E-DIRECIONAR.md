# Regras: financeiro geral, Direcionar, contas, caixa, faturamento, maquininhas e links (vigentes em 25/11/2026)

Documento ÚNICO e vivo. Escrito a partir de TUDO que o Marcus disse nas conversas de 28/09 a 10/11/2026 (1º tempo) e de 10/11 a 25/11/2026 (2º tempo, já lido e aplicado aqui) e do código. Onde o 2º tempo contradiz o 1º, vale o 2º (a mensagem mais nova vence); a mudança aparece marcada **(2º tempo)** e está listada em `docs/pendencias/financeiro.local.md`, seção B.
Só a regra de HOJE. Sem valor real de conta, sem chave Pix, sem CNPJ completo, sem salário (isso fica em arquivos `.local.md`, fora do Git).
Marcação: **[FEITO]** já no sistema · **[A CONSTRUIR]** decidido, falta construir · **[A CONFIRMAR]** o Marcus não decidiu.
Não repete: fornecedores, negociações, banho, limite mensal de fornecedores (ver `docs/regras/FORNECEDORES-E-COMPRAS.md`); Financeiro familiar (outro documento); representantes e comissões (`docs/regras/REPRESENTANTES-E-COMISSOES.md`); Fiscal (`docs/regras/FISCAL-E-CNPJS.md`).
Pendências, conflitos e duplicados: `docs/pendencias/financeiro.local.md`.

## 1. Quem é quem

| Peça | Regra |
|---|---|
| CNPJs do grupo | **Sorelly 34, Mayz 46, Serenity 59, Axis 67 (do Lucas)**. H&O Apps (empresa de aplicativos) aparece junto e tem contas a pagar. Hess & Oliveira = "sem CNPJ" (contas por fora). Em toda tela: o primeiro nome da empresa, não só o número |
| Grupo econômico | Para a contabilidade e para dividir uma venda, "é tudo do mesmo grupo". A filial 34 é a principal; na DevMaster muita conta de outros CNPJs foi lançada nela. **(2º tempo, 13/11) Mas a conta bancária de um CNPJ só paga conta desse mesmo CNPJ: "não existe o CNPJ da conta ser 34 e pagar com 59, nem pode aparecer a opção".** Exceção: conta de pessoa (família) pode pagar conta da família; conta da empresa não paga dívida de outro CNPJ |
| Quem lança | **Financeiro**: Nayale (contas e saldos; o Marcus a chama de "Dona Yali"), Anamaria (mãe do Marcus, caixa e pagamentos), Lucas (direciona os Pix e **lança os recebimentos em Contas a receber**), Bruna (faturamento na DevMaster), Amanda (faturamento diário e inadimplência). Qualquer pessoa do financeiro lança (Marcus, Anamaria, Lucas). **Atendimento interno** (Natasha, Edna e outras) cobra a revendedora e anexa o comprovante. **Hellen** gera os links de pagamento. A contabilidade (DP) confirma razão social e datas de folha |
| Quem vê comissão | Só diretoria e financeiro |
| Acesso | Por setor e perfil, não por pessoa. A Nayale e a Anamaria só veem o financeiro; o Dashboard fica só para a Anamaria |
| Fonte do dado | **DevMaster** (ERP) e **Admin** (este sistema). Meta: tirar o financeiro 100% da DevMaster. Até lá, tudo que o Admin faz precisa existir na DevMaster no fim. **(2º tempo, 12/11) O financeiro novo NÃO puxa nada do admin antigo: tudo vem da DevMaster ou é lançado aqui.** Dezembro e os meses seguintes também vêm do admin novo, que lê a DevMaster. Em 18/11 o Marcus disse que vai levar o financeiro inteiro para cá "em poucos dias" |
| Segurança | **[A CONSTRUIR]** (Leonardo): login real, backup diário, nuvem, registro de quem fez o quê, ver o sistema em dias anteriores. Nada de `localStorage` para dado de verdade: tudo vai para o banco |

### Menu do Financeiro hoje (ler pelo menu, nunca por endereço)

```
Pagamentos ─► Resumo geral · Direcionar · Contas das representantes · Chaves Pix
Contas bancárias · Faturas
Contas ─► A pagar · Pagas · Comissões · Fornecedores
Receber ─► Contas a receber · Faturamento · Representantes
Família (só quem tem a autorização)
Relatórios ─► Resultado do mês · Dinheiro · Estoque · Análise de custos · Taxas e adquirentes
Cadastro ─► Bancos · Formas de pagamento
Controle ─► Arrumar na DevMaster (última aba, depois de Relatórios) · Atividades (só o Marcus)
```

**Mudanças do 2º tempo no menu:**

| Item | O que o Marcus disse | Estado |
|---|---|---|
| Tela que abre primeiro | 12/11: "sempre abrir no DIRECIONAR". 16/11 e 24/11: Pagamentos > **Resumo geral** é a tela inicial e a principal (lançar pagamentos e conferir). **Vale o mais novo: Resumo geral** | [FEITO] no menu (Resumo geral é o primeiro item) |
| Controle de pagamentos | 12/11: "pode excluir essa aba inteira, é igual ao direcionar" | [FEITO] |
| Regras e contas | 12/11: não existe mais; viram as telas **Direcionar** e **Contas das representantes**, e o bloco **Regras & Condições** (botão no canto esquerdo da barra azul) | [FEITO] |
| Chaves Pix | 12/11: terceira tela de Pagamentos | [FEITO] |
| Caixa (tela) | 12/11: "tira caixa": saldos e resumo do mês numa tela só | [FEITO] segundo a conversa; conferir |
| Previsão de caixa | 13/11: "já excluí previsão de caixa, não usamos" | **[A CONSTRUIR] tirar:** o menu do código ainda lista "Previsão de caixa" em Relatórios (ver pendências, B-28) |
| Conferência de pagamentos (Fornecedores) e "Pix conferência" | 24/11: "pode excluir; fica só na página de resumo, na parte de baixo, depois do total" | **[A CONSTRUIR] tirar:** o menu ainda lista "Conferência de pagamentos" |
| Atividades | 12/11: "não interessa, pode excluir essa aba inteira". O código a mantém só para o Marcus (18/11) | [A CONFIRMAR] |
| Resultado do mês | 12/11: "não interessa nada para minha mãe". 16/11: é a tela que junta Contas a pagar e Resultado do mês no topo | Fica; a mãe usa pouco |
| Arrumar na DevMaster | 19/11: "tem que ser depois dos relatórios, a última aba, não dentro; mesmo estilo do Resumo geral" | [FEITO] |
| Cadastro | 20/11: copiar da DevMaster uma aba "Cadastro" (Bancos e Tipos de numerário/formas de pagamento), para "criar nosso próprio sistema até sair deles" | [FEITO] em parte |

## 2. A regra de ouro: origem x destino do dinheiro [FEITO em parte]

Toda entrada e toda saída responde duas perguntas:

```
1. Em qual CONTA o dinheiro entrou, ou de qual saiu?   (de quem é a conta)
2. Qual DÍVIDA ou RECEBÍVEL ele quitou?                (de quem é a dívida)
```

| Quem sabe primeiro | O que é | Como se confere |
|---|---|---|
| **DevMaster** (a maior parte dos recebimentos) | Acerto faturado, venda de representante | Depois, pela conciliação bancária |
| **Admin** | Pix adiantado de acerto, revendedora que paga direto a fornecedor ou prestador, pagamento que sai de conta da empresa antes da baixa na DevMaster | Quando a DevMaster registrar, o Admin **cruza e NÃO duplica** |

- **Cruzamento** [FEITO, `domain/casar-pagos.js`]: casa o lançamento do Admin com o título da DevMaster quando tem a mesma parte (revendedora, fornecedor ou prestador), o mesmo tipo (Pix, boleto, cheque, cartão), o mesmo valor (até 1 centavo) e data perto (título entre 3 dias antes e 12 dias depois). Cada lançamento casa com UM título. Sem casamento, nada muda e a conta continua visível (errar para o lado seguro). Duas candidatas iguais: o sistema pergunta, não adivinha.
- **Quando os dois diferem, vale o mais recente.** Na conciliação nunca se duplica: fica um só.
- **(2º tempo, 20/11 e 24/11) Pago no Admin conta como PAGO mesmo sem baixa na DevMaster.** Pix de revendedora para fornecedor e prestador, e Pix da família, só recebem baixa na DevMaster dias depois (às vezes no fim do mês). O Admin mostra esses valores já pagos e uma coluna **"Confirmado na DevMaster: sim ou não"** (ou "pendente na DevMaster"). A DevMaster faz a baixa sozinha depois; o Admin lê de lá. Quando a baixa chega, o item fica um só. [A CONSTRUIR] a coluna e a leitura automática.
- **(2º tempo, 20/11) O Admin olha a DevMaster e dá baixa sozinho em tudo que foi baixado lá.** O Marcus mandou construir "esse cruzamento automático, POR FAVOR" e disse que o Contas a pagar estava inflado porque a planilha de pagamentos a fornecedores (do Lucas) nunca marcava boleto como pago: boleto e cheque pagos vêm da DevMaster. Vale para todos os fornecedores, não só para a Pontual. [A CONSTRUIR] (o casamento por título existe em `casar-pagos.js`; falta a baixa automática de tudo que a DevMaster já baixou).
- **(2º tempo, 22/11) Conferência no dia 1.** O Marcus quer que o sistema compare sozinho, todo dia 1, o Contas a pagar do Admin com o da DevMaster e avise. No fim do mês os dois têm de bater. Se a DevMaster tem um valor errado, o Admin segue a DevMaster até a equipe corrigir lá. [A CONSTRUIR]
- **(2º tempo, 24/11) Títulos de PREVISÃO da DevMaster duplicam a conta real.** Exemplo: previsão de fatura de cartão que continua somada depois que a fatura real entra. A equipe lança duplicado e a previsão continua somando. Regra: quando a fatura real (ou a parcela real) entra, o título de previsão sai da conta. O Marcus quer isso ensinado ao Cérebro do Financeiro (como a DevMaster funciona). [A CONSTRUIR] (ver o prefixo CCI, que aparece como prefixo e como tipo de numerário na DevMaster).
- **(2º tempo, 16/11) Item duplicado vindo dos dois lugares (Admin e DevMaster) fica UM só.** Depois o financeiro dá baixa na DevMaster e o item fica só no Admin.
- **Lançamento universal** [A CONSTRUIR, em alinhamento; nada construído a partir do desenho]: um lançamento pode ter um recebimento (revendedora) e um pagamento (fornecedor, prestador, família) ao mesmo tempo. Detalhe em `docs/negocio/lancamento-universal/`.
- **Toda saída de qualquer conta da empresa e todo pagamento feito com Pix de revendedora aparece em Contas a pagar.**
- **Pix de revendedora (sem nota)** é recebimento da Sorelly e já conta como pago ao fornecedor: o dinheiro nunca passa pela conta da empresa. Para fornecedor ver `FORNECEDORES-E-COMPRAS.md`.
- **Pix da revendedora para o Marcus/família/prestador dele:** entra como retirada dos sócios; o controle fica no Financeiro familiar. Nunca somar nem apagar um por "duplicado".

### Os quatro casos de entrada [FEITO o A; B, C, D em alinhamento]

| Caso | Fluxo |
|---|---|
| A. Atendimento interno | Lucas direciona a conta → funcionária cobra, lança e anexa o comprovante → DevMaster fatura → cruza. Não muda |
| B. Representante, acerto em casa | Revendedora paga a representante → ninguém lança → kit bipado na DevMaster → Admin lê em Contas a receber. O "intervalo cego" é aceito; só exige cruzar sem duplicar |
| C. Pix antecipado de acerto | Financeiro lança em Contas a receber como pendente → acerto entra na DevMaster → cruza. Sobra vira **crédito da revendedora** |
| D. Revendedora paga direto o fornecedor/prestador | UM lançamento: recebimento (pendente) + pagamento que quita a dívida. Sobra vira crédito aberto que abate sozinho a próxima dívida do mesmo fornecedor |

### Comprovante pendente [FEITO em Contas a receber; A CONSTRUIR no resto]
- O financeiro pode lançar **sem comprovante**: fica **Pendente**. Motivo real: às 17h55 a conta é pedida, o comprovante chega 2 horas depois.
- Sem aviso por prazo. A tela mostra um **alerta no topo** e a coluna **Falta comprovante**. Vale em Contas a receber e em Contas a pagar. (Confirmado de novo em 21/11: "o sistema não precisa avisar; fica um alerta lá em cima sem comprovante".) **(2º tempo, 17/11) Alerta depois de 10 dias sem comprovante, lendo a DevMaster sozinho.**
- Pix para **fornecedor** só conta como pago com o comprovante anexado: "só o fornecedor pode questionar; depois de anexado o comprovante, consideramos pago". Quem anexa: a **representante** (calculadora de acerto) ou a **funcionária do atendimento interno**. Nunca o Direcionar nem o Financeiro. (Repetido em 17/11: "quem anexa é a representante na calculadora ou a funcionária na aba de atendimento interno".)
- Pix para **prestador da família** não trava no comprovante: vira repasse na hora. (21/11: "não tenho o comprovante, anexo depois e não vai ter, mas está confirmado".)
- **(2º tempo) Onde o comprovante fica e como aparece:**
  - O comprovante **fica no sistema**, nunca só no computador de quem anexou (16/11).
  - **Mais de um comprovante** por pagamento: a revendedora pode pagar em duas vezes ou em duas contas (17/11, pedido do atendimento). [A CONSTRUIR]
  - Uma coluna só: **Comp.** (com "Comprovante" ao passar o mouse). Com comprovante: fonte menor e cor própria. Sem comprovante: apenas "—". O botão para anexar diz só **Anexar**, em amarelo igual a "Falta comprovante" (20/11 e 21/11).
  - **Quem direciona confere o comprovante ali mesmo**, na coluna do comprovante (12/11). Não existe botão "estornar": "se tem comprovante, está conferido" (20/11).
  - Direcionar não é só direcionar: é **direcionar, confirmar e receber o comprovante**. Se a funcionária não clicou em "comprovantes anexados", o pedido fica **pendente** no Direcionar (12/11).
  - O comprovante do atendimento interno também aparece no pagamento do fornecedor correspondente (20/11, "liga o Atendimento aos fornecedores"). [A CONSTRUIR]
  - Bug citado pelas atendentes (17/11 e 19/11): pagamento no **crédito em 4x** e brinde de indicação com diferença foram "direto como Pix", sem opção de escolher a forma e sem anexar. [A CONSTRUIR] corrigir: a forma de pagamento tem que ser a real, com a **conta exata onde foi pago** (16/11: "a forma de pagamento não é Pix, tem que ter exatamente a conta que foi pago").

```
Lançado sem comprovante ─► PENDENTE ─► com comprovante (ainda pendente) ─► DevMaster fatura ─► CRUZADO
```

## 3. Direcionar (menu Pagamentos) [FEITO]

Direcionar = dizer para qual CONTA vai cada Pix, dinheiro ou cartão que a revendedora paga. É a primeira tela do Financeiro.

```
Atendimento interno / app da representante
   pede a conta (forma, valor, parcelas, comprovante)
              │
              ▼
Fila do Direcionar ──► regras respondem sozinhas ──► o que sobra espera o Lucas
              │
              ▼
Financeiro confirma (ou troca) a conta ──► a chave Pix chega ao atendimento / à representante
```

- **O app PEDE a conta.** A representante não escolhe entre várias contas. A conta dela é a **fixa** ou a **empresa define** (pergunta). O app mostra "Aguardando conta" e avisa quando chega. Os brindes já liberam enquanto espera.
- **O sistema só SUGERE, com o motivo. O financeiro confirma SEMPRE**, até a tela ficar bem feita. Confirmam: Lucas, Marcus, Anamaria (e quem tiver acesso ao financeiro, não só o Lucas).
- Dá para mandar o valor inteiro ou **dividir em mais de um pagamento**. Cada link e cada maquininha aparece em linha própria ("cada link", nunca "link x3").
- Pix de dentro da Sorelly (atendimento interno) nunca tem conta fixa: define-se na hora.
- A representante **nunca envia Pix para ela mesma**: vai de uma para outra [FEITO, regra r3 em `domain/direcionar-pix.js`].
- **Menu Pagamentos > Contas das representantes:** o Lucas deixa a conta fixa de cada representante ANTES (à noite, fim de semana), **por representante**. A conta fixa é a maquininha ou o link que ela tem. Conta vencida ou acima do limite de valor deixa de valer.
  - **(2º tempo, 12/11) Colunas da tela:** Representante · **Maquininha ou Link** (aparece uma das duas, nunca as duas; cor diferente para cada) · **Conta maquininha** (CNPJ, nome e banco, como na regra de contas) · **Conta fixa** · **Vale até** (data no formato dd/mm/aaaa; fica azul quando preenchida; cinza quando vazia). Sem coluna "Situação". Só o que se edita tem cor de menu suspenso; o resto só a cor da letra. Não existe "link 59 Safra". Título: "Contas para pagamentos de acerto - representantes".
  - O botão **Regras & Condições** fica no canto esquerdo da barra azul e abre um bloco no meio com as regras, a quantidade de maquininhas e a quantidade de links de representantes. Em cima das regras: **"Pix acima de R$ 3.000: obrigatório ligar para o Financeiro"** [FEITO, `LIMITE_LIGAR_FINANCEIRO = 3000` em `domain/pix-regras.js`]. O bloco "Valor fora do normal" fica logo abaixo.
  - **Direcionar (tela):** blocos **Aguardando na fila** (antes "Vendas"), **Contas negativas**, **Pagamentos para fornecedores** (antes "Contas a pagar"). Sem barra dourada, sem barra cinza de baixo, linhas finas, uma cor para o sistema todo. A coluna "Ação" vira **Confirmar**, e depois de confirmar dá para abrir e **editar de novo**. Clicar na conta abre o bloco com empresa, CNPJ e contas (como a versão antiga) e mostra o saldo. Botão no canto esquerdo de cima para ir à tela de Atendimentos. Todos os valores de acerto aparecem; o Lucas perguntou em 24/11 por que não via todos os lançamentos [A CONFIRMAR].
  - **(2º tempo, 12/11) Chaves Pix na tela de Pagamentos:** fechado, cada bloco mostra CNPJ (número inteiro), nome inteiro e quantidade de contas; Prestadores de serviços ficam embaixo de Fornecedores; Funcionários ficam só por CNPJ (os 5 CNPJs); a chave tem botão **Copiar** do lado direito (sem ícone de chave); as duas últimas colunas são **Tipo de chave** e **Chave Pix**. "Todas as chaves ficam em um lugar só" (19/11: Pagamentos > Chaves Pix; editar na própria tela, não só no código).
  - **(2º tempo, 16/11) Origem do dado ao direcionar:** quando o Lucas direciona, a conta **já vai com a chave Pix** para a funcionária passar à revendedora (17/11 e 18/11). A funcionária queria ver a chave dentro do sistema, e não no grupo de comprovantes (19/11) [A CONFIRMAR] se já aparece.
- **Maquininha que aparece = só a da representante** (acerto interno: só as maquininhas do interno). O cartão mostra a opção maquininha **e** link de pagamento. Getnet é maquininha do fornecedor de banho: o que passa nela já sobe no pagamento desse fornecedor.
- Rotativo está dentro do Sicredi 34: não existe Pix para o Rotativo. Para liquidar o Rotativo, o Pix vai para o Sicredi 34.
- O app e o Direcionar **escrevem por extenso, sem abreviar**, e mostram setor e aba atuais na barra de cima (que nunca muda de lugar).

### Regras do Pix (menu Pagamentos > Contas das representantes, bloco de regras)
Ordem de decisão: 1º regra que PERGUNTA à empresa, 2º link, 3º conta fixa, 4º regras de conta, 5º cérebro (saldo e contas a pagar).

| # | Regra | Estado |
|---|---|---|
| 1 | **Pagou no link ou na maquininha de um CNPJ: o Pix vai para o MESMO CNPJ.** Quem escolhe a conta vê só as contas desse CNPJ. O resto que falta segue na mesma maquininha | [FEITO] |
| 2 | **Uma venda, um CNPJ** (regra principal). Dividir em 2 CNPJs, ou CNPJ + conta de fora (ex.: link 59 + Pix Point), é permitido porque somos grupo econômico (a contabilidade aprovou), mas dá trabalho: a **Bruna separa e faz 2 vendas na DevMaster**. Evitar. Pagamento que fatura não se mistura com o que não fatura (ex.: Office Graf com 34): "o que é 34 é 34" | [FEITO como sugestão] · [A CONFIRMAR] se o código ainda bloqueia a mistura |
| 3 | **Dinheiro fatura junto**, no CNPJ da venda | [FEITO] |
| 4 | **Pix acima de R$ 1.500 vale verificar** se compensa mandar para outro CNPJ ou conta de fora. Quem responde: Lucas, Marcus ou Anamaria, pelo app. **(2º tempo, 12/11) Acima de R$ 3.000 é OBRIGATÓRIO ligar para o Financeiro** antes de enviar | R$ 3.000 [FEITO]. Os R$ 1.500 de 09/11 eram "vale verificar", não "obrigatório"; ficam como orientação [A CONFIRMAR] |
| 5 | **Valor fora do normal** ignora a conta fixa, sobe para o Lucas e passa na frente da fila (a fila continua: todos precisam ser direcionados). O corte é um campo **editável na tela** (bloco "Valor fora do normal", abaixo das regras) | [FEITO] o código parte de R$ 3.000, igual ao "obrigatório ligar". Os R$ 7.000 (24/10) e R$ 1.500 (09/11) ficam superados: nenhuma mensagem de 12/11 em diante pede outro valor |
| 6 | **Mais de 80% da venda em dinheiro:** o Pix vai para conta que NÃO é da empresa | [A CONFIRMAR] o código usa 70% |
| 7 | Link + Pix acima de R$ 1.500: sempre pergunta à empresa, não importa o resto. Venda só com Pix: vai para a conta que mais precisa | [FEITO] |
| 8 | Pix acima de R$ 3.000: preferência para fornecedor de valor alto (Pontual, Point). Cartão na maquininha do banho + Pix acima de R$ 750: vai para a Pontual. Pix abaixo de R$ 750: prestadores menores, com preferência para os da Sorelly | [A CONFIRMAR] (regra de 20/10, nunca confirmada contra as de novembro; o código a aplica em `direcionar-pix.js`, regra n=4). **(2º tempo, 20/11)** O Marcus pediu onde **editar o limite por conta** de Pontual e Point: cada uma recebe até um valor por período (ex.: do dia 1 ao 10, um total dividido entre duas contas). Isso é regra de fornecedor (ver `FORNECEDORES-E-COMPRAS.md`); no Direcionar é [A CONSTRUIR] o limite por conta e período |
| 9 | Dia com muitas contas num CNPJ: focar nele (100% ou grande parte do volume). Dia com poucas contas: valores menores para as contas que precisam e os valores principais para fornecedores | [A CONFIRMAR] (texto de rotina passado por mensagem) |
| 10 | Pix da representante que vem de fora da empresa (venda de representante) segue o CNPJ da maquininha/link dela. A representante e o CNPJ dela não importam; importa a maquininha e de qual CNPJ | [FEITO] |

- **Prioridade do Pix (09/11):** conta negativa: pesa o VALOR negativo, não o tempo. Contas a pagar: hoje é o mais urgente, depois amanhã, olhando os dias com mais contas. O sistema precisa de um **fluxo de caixa por CNPJ**: saldo de hoje + o que deve entrar (comparando com o mês passado) − contas a pagar de cada dia = quanto mandar para cada conta. [A CONSTRUIR]
- **Direcionar à noite x de dia:** de dia, conferir o grupo e o que o financeiro já direcionou; à noite o Lucas divide as contas à mão. [A CONFIRMAR] como o sistema trata o turno.
- **Aviso no admin quando entra Pix novo na fila** (estilo notificação de venda): [A CONSTRUIR]. **(2º tempo)** Em 13/11 o Marcus pediu que o alerta de venda nova do atendimento interno **tocasse sem parar até alguém clicar**; clicar leva à aba Direcionar (abre se estiver fechada). **Em 24/11 ele mudou: o aviso toca UMA vez só, com som de caixa registradora e uma voz dizendo "nova venda"; o bloco "aviso do dia" sai do Direcionar e fica só "Aguarde novo pedido".** Vale o de 24/11. Quem recebe: todos do financeiro com acesso [A CONFIRMAR].
- Nenhuma mensagem no app da representante: a ordem fica só no sistema.
- **(2º tempo) Divisão do pagamento em duas partes** (21/11): quando um pagamento se divide, cada parte mostra o valor cheio junto do nome e a ordem da parte no fim ("Pix 1.000 ... 1/2" e "Pix 1.000 ... 2/2"), e a coluna de pagamentos traz o valor que fecha cada parte. [A CONSTRUIR]
- **(2º tempo) Pagamento parcelado no cartão ou por link é UM pagamento só** (valor total, não por parcela). Se a revendedora pagou parte em Pix, parte em dinheiro e parte em acerto-loja, são pagamentos separados. Clicar em qualquer pagamento abre a venda da revendedora (valor da venda, valor do acerto e aquele pagamento) (21/11). [A CONSTRUIR]
- **(2º tempo, 11/11) Pagou no link antecipado e o resto em Pix na loja:** o sistema deve entender que o link já existe e ligar o Direcionar ao setor de Link de pagamento sozinho; hoje mostra "Aguardando o financeiro definir e enviar as contas" igual ao Pix. [A CONSTRUIR]
- **(2º tempo, 24/11) O app da representante também envia para o Direcionar** quando ela fecha um acerto por lá, igual ao atendimento interno. O Marcus perguntou se já está ligado e o atendimento respondeu que a ligação existe [A CONFIRMAR em teste de ponta a ponta].
- **(2º tempo, 12/11) Escrita:** nomes de pessoa em letra normal ("Carlos Luan", nunca "CARLOS LUAN"; 17/11 e 18/11). Em 12/11 o Marcus pediu CAIXA ALTA nos títulos do Direcionar e de Contas das representantes; em 17/11, 18/11 e 19/11 proibiu ("letra caixa alta não autorizo mais"). **Vale a regra sem caixa alta.**

### Cérebro do Financeiro [PARCIAL: a conta existe no código, mas está SEM TELA desde 24/11/2026, quando o bloco "Avisos do dia" saiu do Direcionar a pedido do Marcus; ver `FINANCEIRO-MAPA-DE-CONTROLE.md`]
Regras ditas em 18/11/2026 (texto completo em `docs/negocio/cerebro-financeiro/02-regras-de-orientacao.md`):
- Orientação **por CNPJ**; a conta dentro do CNPJ é escolha do Lucas. Pagar no CNPJ certo importa; o banco "previsto" da DevMaster não.
- **Cheque especial conta como dinheiro** (disponível = saldo + limite). Meta: nenhuma conta negativa.
- Grupo: Rotativo + Sicredi 34 andam juntos (saldo positivo abate o Rotativo no mesmo dia). Ordem das negativas no 34: Safra, depois Rotativo + Sicredi, depois Unicred. Pouco negativo (até R$ 2.000) = mandar só o suficiente.
- Olhar o mês dia a dia, avisar com 1 a 2 dias de antecedência; do dia 26 olhar o começo do mês. Prioridade quando não cobre tudo: vale, INSS/FGTS, cheques e todos os boletos.
- Usa o **último saldo lançado**. Faltam: colchão mínimo, recebimento previsto por CNPJ, executar sozinho.
- **(2º tempo, 16/11 e 18/11) Colchão por conta:** o Marcus não deu um número único. Ele manda **por conta** quanto deixar positivo (na ordem de alguns milhares de reais, e diferente para cada conta; os valores e as contas citadas em 16/11 e 18/11 estão em `docs/pendencias/financeiro.local.md`). A ideia: "deixar tudo com 1.000 a 2.000 positivo". Regra: **cada conta tem seu colchão configurável**; padrão geral [A CONFIRMAR]. Quando o saldo "não bate" porque o dinheiro já foi transferido para outra conta do mesmo CNPJ, o Cérebro manda reforçar a conta que ficou baixa.
- **(2º tempo, 18/11) Prova real do caixa com folga de ~20 mil:** o Marcus achou sem nexo a diferença de ~R$ 20 mil entre contas a pagar, faturamento e saldo das contas e pediu para analisar **sem o empréstimo**. A diferença nasce de Pix de revendedora já pago a fornecedor e prestador que ainda não tem baixa na DevMaster. Ver "Pago no Admin conta como pago" em §2.
- **(2º tempo, 18/11) Mensagem copiável para o Lucas fazer transferências entre contas do mesmo CNPJ** (ex.: do Sicredi para o Safra) faz parte da rotina; o Cérebro deve gerar o texto com a chave Pix do destino e o valor. [A CONSTRUIR]

### Chaves Pix [FEITO] (menu Pagamentos > Chaves Pix)
- **Chave Pix mora só no Financeiro.** Nenhuma outra tela guarda cópia. O cadastro tem: CNPJ (nome e número), banco, tipo de chave, chave, data de alteração, quem alterou.
- Ordem das abas: **CNPJs · Fornecedores · Sócios + Prestadores de serviço · Representantes · Funcionários**. Quem é funcionário fica só em Funcionários.
- Aplicação (Sicredi, Caixa) não tem chave Pix. Itaú Black e Itaú Marco PJ são a mesma conta. Só existe um Itaú Black.
- **Mensagem copiável** (botão Pix da linha, a mesma em todo lugar): `CHAVE PIX` + Banco + Empresa (ou Nome) + CNPJ + a chave **sempre na linha de baixo**, com negrito do WhatsApp, e a frase "Envie o comprovante após o pagamento." Não existe mais "Escrever na folha". Código: `lib/mensagem-pix.js`.
- Chave que falta (representante, funcionário): mensagem curta pedindo a chave, "oi, preciso da sua chave Pix", sem texto longo.

## 4. Contas a pagar e a receber

### Contas a pagar (menu Contas > A pagar e Pagas) [FEITO]
- **Contas a pagar sai da DevMaster** (títulos em aberto e baixas, só leitura, servidor `src/server/contas-dm.js`), até o Admin substituir a DevMaster. "Tudo que se faz na DevMaster se faz duplicado aqui" até lá. O valor vivo da DevMaster vale; o retrato antigo do admin velho não.
- **Separação:** Sorelly por CNPJ (34, 46, 59, 67), H&O Apps, sem CNPJ ("por fora"). Família vem na mesma tela por opção ("Sorelly", "Família", "junto"): só quem tem a autorização da família vê.
- **CNPJ do título = filial da DevMaster** (01 = 34, 02 = 46, 03 = 59, 04 = por fora, 05 = 67). Até 31/12/2026 vale o CNPJ que o Marcus já conferiu; 2027 vale a filial de propósito (salário, adiantamento, cartão). Erro de filial na DevMaster é corrigido lá pela equipe (Arrumar na DevMaster), nunca pelo sistema.
- **Naturezas** e prefixos da DevMaster (VAL vale, IMP INSS/FGTS, CHE cheque, BAN boleto, DEM rescisão, INT telefone, SAL salário, TAR tarifa, EMP empréstimo, CMS comissão, KM quilometragem): interpretação ainda a confirmar.
- **Tela:** ordem por vencimento; botão para dias abertos ou fechados; alto com Já pago, Falta pagar e Total do mês; tabela com cor só no estado (nada de tudo vermelho). Data do pagamento = data de **débito**.
  - **(2º tempo) Estrutura decidida em 12/11 a 24/11:** **A pagar** e **Pagas** são duas telas separadas (12/11), dentro do menu Contas. A pagar é uma "tabela gigante" estilo planilha, sem resumo no meio. Botão **Por dia**: vira um acumulado dia após dia (pago e a pagar) e o total do mês fecha pagas + a pagar. Comissões das representantes aparecem **somadas**; clicar abre cada comissão; parcela aparece como "02/06". Cabeçalho (situação, vence, fornecedor) fica **travado** ao rolar (16/11). Colunas podem ser **escondidas e arrastadas** e há botão "voltar ao padrão" (16/11, a tela de 17 colunas). Busca livre em qualquer texto, vindo da DevMaster ou do Admin (16/11). O mês abre sempre em **Base + último dia atualizado** (16/11: "o hoje fica 00,00"), valor positivo em verde. Ordem sempre por vencimento (19/11). Sem seta no cabeçalho, só o filtro (20/11). Mês: só o mês, sem "mês atual" nem setas (20/11).
  - **(2º tempo) Lançar conta no Admin** (12/11): o lançamento nasce na DevMaster, mas pode ser feito também aqui, com a marca "lançado só no Admin" até alguém lançar na DevMaster. Anexar comprovante de pagamento está na tela (12/11).
  - **(2º tempo, 13/11) Conta de saída x CNPJ da conta:** a conta que paga é a do **mesmo CNPJ** da dívida; a opção de outro CNPJ nem aparece. Conta da família (ex.: consórcio) pode sair de conta de pessoa ou do Itaú. Cada linha diz o CNPJ por escrito (nome e número), mesmo que haja coluna de CNPJ.
  - **(2º tempo, 24/11) Só entram no mês as contas que tinham dívida no início do mês** (vale também para a família); conta de outro mês só aparece se alguém pedir. No resumo familiar, valor pago acima do combinado fica em **verde** (positivo), nunca zerado.
  - **Total do mês** = pagas + a pagar. O Marcus não aceita valor que "tira do nada": o a pagar do mês parte do valor do início do mês e é atualizado pela DevMaster, descontando o que já foi pago no Admin (Pix de revendedora para fornecedor, Pix de sócio). Em 21/11 ele rejeitou um total do mês fora da realidade ("não tem como ser isso"); em 24/11 pediu para subir as contas até o teto que ele informou (valores em `.local`).
- **Fornecedores, prestadores e maquininha do banho moram dentro de Contas** (são "contas que pagamos por fora"). Comissões e folha também: tudo que envolve pagamento fica em Contas.
- **Empréstimos:** ficam em Contas a pagar E ganham uma aba própria. [PARCIAL: a tela `pages/Emprestimos.js` existe (`/financeiro/emprestimos`), mas está FORA do menu, usa peças antigas e guarda o contrato só no navegador; ver `FINANCEIRO-MAPA-DE-CONTROLE.md`]. **Créditos bancários:** contratos e tabelas ficam numa pasta própria; pedir ao gerente de cada banco o contrato, a tabela de parcelas e o saldo devedor. [A CONSTRUIR]
- **Salário e adiantamento** ficam juntos dos funcionários, por ordem de quem ganha mais. Folha e impostos vêm da contabilidade. Salário no 5º dia útil e adiantamento no dia 20. **(2º tempo, 18/11) O Marcus confirmou: "sábado conta como dia útil".** Os funcionários são registrados e pagos normalmente por cada CNPJ, "não é pago por fora". Isso substitui a leitura antiga ("Pix legalmente não no sábado"); a contabilidade ainda não respondeu de novo [A CONFIRMAR com a contabilidade]. O recibo mostra "adiantamento + saldo"; o pró-labore começou a ser retirado em 07/2026 (contabilidade, 23/11).
- **Contas por fora:** o Lucas sobe a planilha de pagamentos a fornecedores e a Nayale lança. **(2º tempo, 21/11) Decidido: o Lucas para de lançar em "Pagamentos a fornecedores" e lança só em Contas a receber (botão Lançar recebimento);** o pagamento ao fornecedor nasce desse lançamento. Em "Pagamentos a fornecedores" fica **somente o que é sem nota** [A CONFIRMAR o texto exato do Marcus em 21/11: "o que é da Sorelly não"].
- **Fornecedores como "Pix de revendedora":** vale pagamento parcial (valor até uma data), "então não será um Pix do valor cheio, serão Pix quebrados" (17/11). Prestador de produção externa recebe toda quarta-feira com fechamento de segunda a domingo (17/11) e, desde 23/11, "até quinta-feira"; o valor pendente se junta ao produzido até o dia 22 e gera um Contas a pagar automático. Detalhe em `FORNECEDORES-E-COMPRAS.md` e na ficha da pessoa.
- **Prestador com dois registros** (Higor, Castilho, as meninas da produção externa): recebe da Sorelly (folha, Pix por fora, Pix de revendedora) e do Marcus como prestador da família. Os dois registros ficam separados; no Resumo de pagamentos só aparece o que é regra do setor (Pix de revendedora). Nunca somar nem apagar um por "duplicado" (21/11 e 24/11). Ver `docs/pessoas/LEIA-ME.md`.
- **Pix de revendedora para o Marcus, família e prestadores dele** (21/11): no Admin da Sorelly entra como **recebimento "Pix Marcus Hess"**; no Admin familiar vira saída para o prestador. "Não vai nascer Contas a pagar": só um recebimento na Sorelly e uma saída no familiar; os gastos dele somam uma vez só. Ver `FINANCEIRO-FAMILIAR.md`.
- Nada abreviado, letra normal (sem caixa alta), R$ em todo valor, tudo centralizado.

### Resumo geral (menu Pagamentos) [FEITO em parte] (2º tempo)
- É a **tela inicial** (24/11). Serve para **visualização do dia a dia**: só o mês, "resumo das coisas a pagar", **separado por data** (a data é uma coluna), fonte pequena, compacta, com bloco no alto e padrão do Contas a pagar (16/11 e 17/11). Não leva "folga" nem "calendário": isso é do Nickolas, na tela de Negociações (aba final).
- Mostra, por período, o que foi pago com **Pix de revendedora** a cada fornecedor e prestador, e **as parcelas do pedido** que compõem cada valor (ex.: Pontual, 16/11). Fornecedor clicável leva à tela de negociação.
- Recebe o botão **Lançamento** (amarelo) que abre o mesmo card de Contas a receber (24/11) para lançar e editar tudo integrado. A tela "Conferência de pagamentos" some e fica embaixo desta, depois do total (24/11).
- **Comissão de representante:** o Pix cai no **Consolidado** → vira comissão → o financeiro dá o check e confirma → gera uma conta em **Contas a pagar** (23/11). Só as representantes com 10% entram por enquanto (lista com a Nayale) e a regra completa está em `REPRESENTANTES-E-COMISSOES.md`.
- **Atendimento interno:** o Marcus quer um bloco **8 "Resumo do acerto todo"**, sempre clicável pela funcionária, porque o financeiro às vezes demora e as coisas chegam fora de ordem (16/11).

### Contas a receber (menu Receber) [FEITO]
- Lê a DevMaster: títulos (`dmabg`), formas e contas (`dmacd`), baixas (`dmabf`, data real do pagamento), vendedores, clientes e grupo de funcionárias.
- **Acerto - loja (ACE/ACI) = a revendedora NÃO pagou na hora**, mesmo que pague depois. Todo mês entra pagamento de acerto - loja antigo: o que importa é o **saldo que continua em aberto**.
- **Funcionárias = grupo 0002 do cadastro da DevMaster.** Revendedora negativada ou que sumiu com o kit não é funcionária.
- **Inadimplência** = acerto fechado por menos do que devia. Se a condicional foi fechada pelo valor total da dívida, é remessa (roubo): precisa de relatório mensal com o código do funcionário. [A CONSTRUIR]
- **Nome na coluna CNPJ:** primeiro nome da empresa (Sorelly 34, Mayz 46, Serenity 59, Axis 67); pessoa com nome exato; fornecedor com o nome dele. Nunca "Família e sócios" nem "Caixas internos". Maquininhas "P" = Pontual. **(2º tempo, 20/11)** A coluna de entrada vira três: **Forma** (Pix) · **Conta** · **CNPJ**, todas em letra normal; "o CNPJ muda de número para primeiro nome: Sorelly, Serenity, Mayz, Axis". Pessoa aparece com o nome exato ("Marco Itaú PJ" é conta da empresa, o equivalente a um CNPJ; "Marco PF" é o pai). Cielo e Getnet não são CNPJ: são da Pontual; separar Pontual, Point, MegaSul por fornecedor. Em 21/11: "CNPJ 465 é Mayz".
- **(2º tempo, 20/11 a 21/11) Layout de Contas a receber é a referência de todo o Financeiro:** tabela grudada, fontes pequenas, tudo centralizado, sem preto em volta, topo em formato de tabela (sem botões), sem coluna "Vence", com o botão **Anexar**. O Marcus elogiou: "essa tela está muito bem feita". Contas bancárias, Contas a pagar, Faturamento e Resumo familiar devem seguir a mesma aparência.
- **(2º tempo, 21/11) Nome da tela:** o Marcus disse "eu nunca tenho valores a receber, tudo é recebido, é o nome da tela". [A CONFIRMAR] se a tela deve se chamar Recebidos (ou similar). Até lá o menu segue "Contas a receber".
- **(2º tempo, 23/11 e 24/11) Lançar recebimento** (botão na tela de Contas a receber e no Resumo geral, com o mesmo card): não é "pedido de Pix", é **lançamento de recebimento**; pode ser Pix, dinheiro ou cartão de débito. Representante e "Pix em nome de quem" ficam lado a lado; só se for em nome de outra pessoa abre uma linha para digitar. Quando o Lucas escolhe o fornecedor ou o prestador de destino, abre embaixo a **mensagem copiável com a chave Pix** e o texto "Escrever na folha" (ex.: "PIX PRODUÇÃO DE PEÇAS" + nome + chave + banco), igual às contas a pagar. O Lucas pode lançar sem comprovante (pendente), ou lançar um pagamento que faltou ("20 reais da minha conta PF") e escolher a dívida que ele quita (ex.: "pagamento do Castilho que vai para o próximo pagamento"). Layout lateral, no estilo de Contas a pagar. [FEITO em 23/11 e 24/11, conferir]
- **(2º tempo, 11/11) Comissão de funcionária que também é revendedora:** é diferente da comissão da revendedora (ex.: 50% quando a funcionária faz o acerto de si mesma). Faixas novas decididas em 11/11 e válidas para acertos de **dezembro**: 50% acima de R$ 2.000, 45% de R$ 1.000 a R$ 1.999,99, 35% de R$ 500 a R$ 999,99. Ver `REPRESENTANTES-E-COMISSOES.md`. A funcionária precisa estar no RH e como pessoa normal na DevMaster (o relatório de notas fiscais usa isso) [A CONFIRMAR como ligar].
- **(2º tempo, 16/11) Crédito da revendedora no acerto** (ex.: crédito pequeno ainda não lançado pelo setor de Garantias): o atendimento precisa de uma opção de **desconto/crédito no acerto**; Garantias ainda não lança, então por enquanto é manual. Sobra de pagamento vira crédito que abate sozinho a próxima dívida (21/11). Com Pix adiantado de acerto grande, o atendimento interno já abre o acerto com todos os pagamentos e comprovantes visíveis. [A CONSTRUIR] campo de crédito.
- Abas da revendedora: Cadastro · Kits e vendas · Contas a receber.
- **Numerário (elo Admin x DevMaster), 25/11/2026:** toda conta, chave Pix e destino liga a um numerário da DevMaster; o Admin mostra a conta real por dentro e o numerário na folha e no Consolidado. Regras R1 a R8 em `docs/regras/NUMERARIOS-ADMIN-X-DEVMASTER.md` (LER antes de mexer em conta ou pagamento).
- **Formas de pagamento do PDV da DevMaster:** a DevMaster e o Admin falam a mesma língua. A venda só aceita UMA forma da lista ("PIX REPRESENTANTES" genérico, depois alguém troca pelo nome). Padrão de nome pedido: `FORMA - BANCO - EMPRESA` com o primeiro nome da empresa. Perguntas abertas em `docs/negocio/FORMAS-DE-PAGAMENTO-PDV-DEVMASTER.md` [A CONFIRMAR].
- **Lançar recebimento:** botão que abre um card; busca a revendedora na lista de ativas da DevMaster. [FEITO]

## 5. Caixa e saldos (menu Contas bancárias e Relatórios)

- **Para que serve:** a prova real do caixa. O que o faturamento e as contas pagas dizem que sobrou tem que bater com o que as contas bancárias mostram. Meta do Marcus: "controle total", contas positivas, nunca operar no negativo.
- **A conta que fecha:** `Saldo do início + Recebido nas contas + Aportes − Contas pagas que passam pelas contas = Saldo esperado`. A diferença é a **divergência** (sobrando ou faltando).
- **Saldo do dia = fim do dia.** Conta sem lançamento no dia vale o último saldo. **Saldo = soma das contas sem as bloqueadas** (retido, a receber). **Disponível = saldo + cheque especial.** Duas linhas no fim: saldo real das contas e saldo com cheque especial somado.
- **Entrou de verdade** = variação do saldo + contas pagas no período. Pode haver dinheiro na conta ainda sem baixa na DevMaster (atraso, não perda).
- **Não existe dinheiro entre CNPJs. Não pode.** Só aporte de sócio. As "transferências" da DevMaster são da maquininha para a conta do mesmo CNPJ.
- **Contas pessoais:** a empresa para de usar contas pessoais para pagar e receber (decisão de 18/11); a exceção é a conta do pai que recebe o salário dele.
- **Caixas em dinheiro:** Caixa Seguro (na casa do Marcus) e Caixa Financeiro (o dinheiro das meninas antes de passar à sócia do caixa).
- **Cada CNPJ aparece com seus bancos.** A coluna Banco mostra só o banco (o CNPJ já está na outra coluna). O 34 Sicredi e o Rotativo ficam juntos. Cada bloco por CNPJ abre e fecha; fechado mostra o número do CNPJ, o nome e o total.
- **Quando se lança o saldo:** [A CONFIRMAR]. Há três versões: fim do dia (~17h), 10h do dia seguinte e primeiro dia útil de manhã (sábado e feriado alguns bancos não atualizam). O ideal é o saldo do **último dia do mês** e no **primeiro dia útil de manhã**. **(2º tempo)** Nenhuma mensagem nova decidiu o horário. Em 23/11 a mãe perguntou por que o saldo do dia 23 não aparecia: segue sem rotina fixa.
- **(2º tempo) Tela Contas bancárias** (12/11 a 20/11): planilha grande, uma linha por conta. Primeira coluna **número do CNPJ**, segunda **nome da conta** (sem coluna de chave Pix). Cada dia é uma coluna e cada bloco de CNPJ abre e fecha. Tem uma barra com as contas bancárias e uma barra com o **saldo final de cada dia**. O saldo **repete o do dia anterior quando não foi atualizado, mas com uma marca de "não atualizado, só repetiu"** (12/11). **Feriado e fim de semana: vale o último dia útil** (20/11: "exclui a sexta, fica como quinta"). Um botão **Editar** ao lado do período libera a edição de qualquer célula; sem ele, clicar não edita e rolar não "agarra". Linhas finas, cor de fundo clara para separar cada CNPJ, topo fino, números pequenos, barra de rolagem fina só no espaço da tabela. No alto: **saldo real e disponível do dia 31 (mês anterior) e o atual**, e ao lado o saldo por CNPJ (o total por CNPJ fica no alto, não embaixo). Aparência igual à de Contas a receber (20/11). [FEITO em parte; conferir]
- **(2º tempo, 12/11) Resumo do mês dentro da mesma tela:** a lógica é bater **Contas a pagar, Contas a receber e saldo das contas**. Do mais para o menos: recebido (Contas a receber até o momento) e contas pagas; resultado pela DevMaster; saldo das contas no dia 31 e hoje; resultado financeiro (variação do saldo); **divergência** embaixo. A pergunta aberta do Marcus: o Contas a receber está tirando o acerto-loja? (ver §4). A tela "Conferência" e "Faturamento" dentro de Caixa saíram.
- **(2º tempo, 16/11) Limite (cheque especial) por conta:** o Marcus passou o limite de cada conta (algumas "sem limite"; uma com limite alto; uma com limite pequeno). Valores em `docs/pendencias/financeiro.local.md`. Conta H&O fica "sem limite".
- **(2º tempo, 12/11 e 16/11) Quem não consegue lançar saldo:** a mãe do Marcus não conseguiu lançar saldos (editar saldos sumiu, 11/11 e 12/11); a causa é a pendência A-1. Saldo é lançado **manualmente** até o Open Finance. A tela de saldos deve ficar compacta (11/11: "fonte menor, alinhando melhor, sem mudar o que está no lugar").
- **(2º tempo, 22/11) Caixas em dinheiro:** o Marcus perguntou o saldo do **Caixa de dinheiro da empresa** e do **Caixa Seguro** (24/11). Sem regra nova; é consulta de rotina.
- **Open Finance:** [A CONFIRMAR]. O Marcus quis (só leitura de saldo e extrato, sem movimentar); a mãe não quis (um banco veria o saldo de outro). O cérebro registra "2027".
- ~~**Previsão de caixa** (Relatórios)~~ **(2º tempo, 13/11) SUPERADO: "já excluí previsão de caixa, não usamos".** O Cérebro e o Resultado do mês fazem o papel dela. O código ainda mostra a tela no menu (ver pendências B-28).
- **Dados de saldo e contas pagas por dia** (arquivos `.local`) vinham do admin antigo. **(2º tempo, 12/11) O financeiro novo não puxa do admin antigo.** [FEITO] leitura direta da DevMaster para contas; saldo digitado à mão até o Open Finance.
- **(2º tempo, 19/11) Itaú Black PJ é conta de pessoa física usada para pagar coisas da empresa e da família.** Por isso aparece nos dois lados: o que é da empresa entra no Admin da Sorelly; o que é da casa ou da família entra no Admin familiar (ver `FINANCEIRO-FAMILIAR.md`). Em 20/11: "Marco Itaú PJ" é a conta da empresa; "Marco PF" é a conta pessoal do pai. [A CONFIRMAR] se Itaú Black e Marco Itaú PJ são a mesma conta (a regra do 1º tempo diz que sim).
- **Contas pessoais:** a regra de 18/11 (empresa para de usar contas pessoais) segue, mas a realidade de 19/11 a 24/11 mostra que o Itaú Black PJ continua pagando as duas coisas (empresa e família) e a conta do Marcus no Nubank recebe Pix de revendedora. O que entra nessas contas conta como "Pix Marcus Hess" na Sorelly e como gasto na família, uma vez só.

## 6. Faturamento, resultado do mês e previsão

- **Faturamento diário** (menu Receber > Faturamento) [FEITO]: a Amanda lança o **ACUMULADO do mês** (acertos e faturamento); o dia é a diferença. Colunas: dia, acertos, média, faturamento, contas pagas. Não arredondar.
- **Carregar** (vendas fechadas no admin sem fechar na DevMaster) **não está dentro dos acertos realizados.** Total do mês = acertos realizados + Carregar + a realizar. Toda atualização do Marcus traz o Carregar. Carregar pendente aparece também no Faturamento.
- **Meta do mês = 98%** (97, 98 ou 99 na tela). Sobre o total de acertos previstos, não sobre o que entrou. Passar revendedoras para o mês seguinte se faz **na DevMaster** (data prevista), nunca no Dashboard.
- **Média por acerto** do mês seguinte = média do mês atual + alta (nov, dez e jan). **(2º tempo, 18/11) O Marcus repetiu: "faturamento de 10%, 15% a mais em dezembro e janeiro"** (10% dezembro, 15% janeiro, igual à mensagem de 28/10). O código tem 12% e 17% (`ALTA_MEDIA` em `domain/financeiro.js`): **o código está diferente da regra**; vale 10 e 15 [A CONSTRUIR corrigir]. Janeiro histórico ~R$ 900 por acerto. Não calcular a média dividindo o que entrou: usar o contas a receber só dos acertos. **(2º tempo, 17/11) Para dezembro e janeiro o Marcus pediu também um cálculo da média por revendedora de out/nov/dez de 2025 e janeiro de 2026** [A CONSTRUIR] e a projeção do número de revendedoras para o mês seguinte (o estoque necessário cresce junto; valores em `.local`).
- **(2º tempo, 12/11) Previsto = média × 98%:** "tira o realizar, coloca previsto, e outra coluna 98% do previsto; o faturamento previsto é a média vezes 98%".
- **(2º tempo, 11/11 e 16/11) Colunas e topo do Faturamento:** a tela mostra no começo do mês a **quantidade de revendedoras no início** e **quantas já foram adiadas** ("de onde vem" melhor, sem linhas quebradas, bloco do lado direito embaixo). Colunas novas: **média atualizada do mês** (acumulada) e **média de cada dia**. Tirar do topo a frase "DevMaster: N revendedoras com kit principal aberto..." (16/11). Dias que o Marcus passa pelo chat (acertos, valor, recebido, média, quantidade no Carregar, total de revendedoras) entram como lançamento do dia; **"trava o faturamento"** (24/11) fecha o dia anterior. A aba "mês a mês" não faz sentido (16/11): fica só faturamento por dia e quantidade de acertos. O botão **Lançar** fica no topo da primeira tela, numa linha, junto com Contas a pagar e Resultado do mês.
- **(2º tempo, 16/11) Passar revendedora de mês** (mudar data prevista) dentro do mês não precisa de confirmação: fica um registro só e a DevMaster mostra quem mudou (quase sempre foi a Anamaria).
- **Faturamento e Contas a pagar** juntos: ver Faturamento, ver Contas a pagar, ver os dois juntos, para achar o dia de maior déficit. Faturamento verde, contas a pagar vermelho, saldo do dia na cor do sinal. **(2º tempo, 19/11) Substitui a regra antiga "a tela Faturamento mostra só resultado, sem previsto":** a tela de Faturamento volta a ter, **na última coluna, o bloco "Previsto" e o "Resultado final do mês"**. Ordem do topo: **Dia** (recebido e pago) · **Mês consolidado** (recebido, contas e resultado: 3 colunas cada) · **Previsto** no final. A previsão também mora em Resultado do mês.
- **Relatório de notas fiscais x faturamento real:** o relatório de notas (DevMaster: Faturamento > Relatórios > Relação de Notas Fiscais, clientes sem funcionários, TES S001/S002) é a base do Marcus, mas não mostra o recebido real por revendedora, nem a inadimplência, nem compras de funcionárias. **A medida passa a ser o que o sistema calcula.**
- **Resultado do mês** (menu Relatórios) [FEITO]: Receber (DevMaster) · Pagar (DevMaster) · Entrou de verdade · Previsão. Meta: resultado real = variação do saldo das contas. Renomear "Notas fiscais" para "Contas a receber" e mostrar média e quantidade de acertos e a média prevista pelo dinheiro [A CONSTRUIR].
  - **(2º tempo, 19/11) Coluna "Recebido":** hoje puxa do relatório de notas fiscais. Deve ter uma opção para trocar os mesmos números para **Contas a receber** e uma coluna de **Inadimplência**: "esse é o valor real para bater com o saldo das contas". (O Marcus lembrou que feriado e sábado não pagam conta: as contas se organizam nos outros dias.) [A CONSTRUIR]
  - **(2º tempo, 19/11 e 23/11) Simulação do mês:** não projetar o mês com média e acertos "de maneira aleatória" a partir do mês anterior. Fazer assim: pegar o mês passado, **dividir os acertos corretamente por dia** conferindo a **agenda do atendimento interno e das representantes** (quantidade de acertos por dia) e repetir o desenho para o contas a pagar. 24/11: ele pediu cenários do mês (faturamento contra contas a pagar), com base no mês passado e na quantidade de revendedoras. [A CONSTRUIR]
  - **(2º tempo, 23/11) Divergência gigante:** bater o **relatório de notas fiscais, o Contas a pagar, o Contas a receber e o saldo das contas sem crédito**, e mostrar o tamanho da divergência na tela. A medida mais real, segundo o Marcus, é **DevMaster contra saldo das contas, com as baixas pagas e "pix sem baixa"** somados. O sistema ainda não mostra isso [A CONSTRUIR]. Fundo azul suave, fontes pequenas, só até o dia 23 (23/11).
- **Atualização diária:** o robô lê a DevMaster. O robô do faturamento das 10h está **desligado** até achar as regras do relatório do Marcus; o robô de revendedoras (18h) conta "condicional aberta em 90 dias" e difere da série do Marcus [A CONFIRMAR].
- **Visão geral:** só quantidade de revendedoras, faturamento e previsão do mês no topo; preencher o que muda no dia fica fora do bloco principal.

## 7. Maquininhas, taxas e links de pagamento

- **Maquininha = meio de pagamento por CNPJ, banco e máquina.** Cada máquina tem aluguel, representante e taxas (débito, crédito à vista, parcelado, antecipação). Valores reais ficam só em `maquininhas.local.js`. Telas: Relatórios > Taxas e adquirentes e Link de pagamento > Meios.
- **Antecipação automática da Sicredi:** 34 = 2,19% · 46 = 2,69% · 59 = 2,19% · 67 = 0% sem antecipar, 2,19% automática, 2,39% eventual. Getnet e Cielo (do fornecedor de banho): sem antecipação.
- **Itaú:** aluguel por máquina, isento ao atingir R$ 50 mil em vendas somadas de todas as máquinas.
- **Getnet e Cielo são do fornecedor de banho.** Tudo que passa nelas vai direto para o pagamento dele (com desconto no começo do mês seguinte; ver FORNECEDORES). Maquininha das representantes: cada uma tem a dela; o link sai pelo CNPJ da maquininha.
- **Link de pagamento** [FEITO]: a revendedora solicita (app ou WhatsApp) → o atendimento gera no e-SiTef (Software Express/Fiserv; Sicredi só se o site cair) → cliente paga → vira pagamento do acerto da revendedora → comprovante no dia seguinte no grupo da representante.
  - Valor mínimo R$ 80. Até R$ 80 = 1x · até R$ 400 = 4x · até R$ 1.500 = 6x · acima = até 10x · parcela mínima R$ 50. Expira em 48 horas no Admin. Até 3 tentativas por dia. Atendimento até as 18h (fora disso fica para o dia seguinte; é forma de pagamento, não recomendada).
  - Só os links pagos até o dia anterior ao acerto são descontados. O valor não volta em dinheiro: abate o acerto ou vira crédito. No dia do acerto, só a representante emite.
  - Quem pede o link informa **valor, parcelas e bandeira do cartão**. Cada link aparece individualmente na venda do Direcionar.
  - **(2º tempo, 11/11 e 16/11) Quem gera o link:** a **Hellen** (setor Link de pagamento) gera os links pedidos pelas meninas do atendimento e, quando a representante gera e dá erro, a Hellen confere e gera de novo. As atendentes usam o e-SiTef só para **consultar**. Fluxo: a revendedora decide pagar no cartão no acerto → o atendimento passa os dados → a Hellen gera → a revendedora paga → a Hellen confirma no e-SiTef e manda o **comprovante e o CNPJ** em que o link foi gerado. O e-SiTef permite ver comprovante e número de autorização e **baixar a planilha do dia**; **não avisa** quando o link é pago. Link feito em plataforma de terceiro: exige o print de confirmação do sistema. A Hellen registra no sistema (quando ficou sem acesso, usou planilha).
  - **(2º tempo, 16/11) CNPJ do link:** são três (34, 46 e 59), mas a Hellen usa hoje **só o 59** "como fui orientada". [A CONFIRMAR] qual CNPJ vale para cada situação.
  - **(2º tempo, 16/11) Link sem comprovante:** "se não tem comprovante, o negócio tem que ser cancelado, porque o link expira". O Marcus mandou perguntar à Hellen sobre os atrasados. [A CONSTRUIR] regra de cancelamento do link sem comprovante.
  - **(2º tempo, 19/11) Validade:** a Hellen avisou que os links no Admin ainda expiravam em 12 horas (ela precisava fazer o trabalho duas vezes e as métricas bagunçavam). O código já grava **48 horas** de validade e aviso de 12 h (`link-pagamento.js`, versão 2 da validade, 19/11), e recoloca como "gerado" os que foram expirados por engano. A regra de 48 h vale. [A CONFIRMAR] com a Hellen depois de uns dias.
  - **(2º tempo, 19/11) Importar o relatório do e-SiTef** deve deixar **escolher quais links entram**: os links que as representantes geram não pertencem ao setor Link de pagamento. [A CONSTRUIR]
  - **(2º tempo, 16/11) Tela do link:** compactar (mesma ideia do Contas a pagar, azul padronizado) sem perder nada; melhorar a aba **Comprovantes** com as regras novas.
  - Relatório de links: gerados por dia, expirados, com erro, pagos por dia e por mês [FEITO].
  - **Ligação com o e-SiTef:** importar a planilha do dia e marcar "Pago" sozinho. Consulta direta pela API só com credenciais pedidas pela diretoria ou pelo Leonardo. [A CONSTRUIR]
- **Formas de pagamento do app da revendedora são as que a REVENDEDORA recebe da cliente**, não "dinheiro e bancos" da empresa. O desconto vem antes da forma de pagamento.
- **(2º tempo, 20/11 e 22/11) Maquininha de banho:** o que passa na Getnet e na Cielo é Pontual, não CNPJ nosso. O cronograma de descontos das maquininhas e os pagamentos de cada mês ficam na tela da Pontual (menu Contas > Fornecedores > Maquininha Banho), com colunas ano e mês, meses futuros fechados e botão para exportar ao fornecedor. É assunto de `FORNECEDORES-E-COMPRAS.md`.
- **(2º tempo, 20/11) Tela de Bancos e Formas de pagamento:** o Marcus mandou as planilhas "Bancos DevMaster" e "Tipo de numerários" para copiar a lógica da DevMaster: o banco está ligado à forma de pagamento, e um mesmo banco pode ter débito e Pix do mesmo CNPJ. Na DevMaster o painel de pagamento da venda mistura Pix de representante genérico com Pix de prestador; o Marcus quer que o Admin leia esse painel e descubra "para onde vai" cada pagamento. [A CONSTRUIR] análise e regra única (ver `FORMAS-DE-PAGAMENTO-PDV-DEVMASTER.md`).

## 8. Quem faz o quê (rotina do financeiro)

| Rotina | Quem | Como |
|---|---|---|
| Ver o e-mail do financeiro, separar boletos e notas, pagar, dar baixa, anexar comprovante | Nayale e Anamaria | DevMaster hoje; sistema novo depois |
| Direcionar Pix | Lucas (e Marcus, Anamaria) | Direcionar |
| Faturar acertos e separar vendas em 2 CNPJs | Bruna | DevMaster |
| Lançar recebimentos (Pix de revendedora para fornecedor, prestador ou família) | Lucas | Contas a receber > Lançar recebimento (o Lucas para de lançar em Pagamentos a fornecedores) |
| Gerar link de pagamento, confirmar no e-SiTef | Hellen | e-SiTef + setor Link de pagamento |
| Cobrar a revendedora, anexar comprovante | Atendimento interno (Natasha, Edna) e representantes | Aba Atendimento interno; calculadora de acerto |
| Lançar faturamento diário | Amanda | Faturamento |
| Fechar o mês e o saldo do mês | Financeiro com o Marcus | [A CONFIRMAR] |
| Correção de erro na DevMaster (filial, ano errado, vencimento) | A equipe da Nayale | Mensagem copiável com os dados do título; nunca o sistema |

## 9. Regras de tela do Financeiro (resumo; vale o PADRAO-VISUAL.md)
Termos curtos, nada abreviado, R$ em todo valor, tudo centralizado, sem letra maiúscula corrida, filtro só nas colunas, sem faixa de totais no topo, uma linha por item, bloco que encolhe, linhas alinhadas, cor só para estado (verde entra, vermelho sai). Barra de cima nunca muda de lugar; o setor e a aba aparecem nela; abas abertas ficam lá em cima e o Marcus pode fixar com uma estrela.

**(2º tempo) Como o Marcus quer as telas novas do Financeiro (12/11 a 25/11):** a referência é **Contas a receber** e **Contas a pagar** (25/11: "contas a pagar, contas a receber, home da família e negociações já estão muito alinhadas; observe cores e fontes"). Em resumo: azul padrão para blocos e título (linhas internas um tom 20% mais fraco; ao abrir, mais 20% mais fraco), sem borda de outra cor, sem dourado ("dourado não uso mais", 19/11), blocos retangulares e linhas brancas finas para separar, tudo centralizado, fonte menor, linha só embaixo no que se clica, cabeçalho fino, **sem texto em CAIXA ALTA** (17/11 a 19/11), nome do cargo sem frase ("conta do CNPJ 59" nunca vira frase). Cor uma só para cada coisa em todo o sistema (12/11). A mãe não quer excesso: "muita informação, tem que ser geral, separado por data" (16/11). Quando houver conflito entre essa lista e `PADRAO-VISUAL.md`, vale o PADRAO-VISUAL.md; o conflito sobre o dourado e o menu suspenso está em pendências (B-30).

## Decisões do Marcus em 25/11/2026 (questionário)
- [A CONSTRUIR] Pix acima de R$ 3.000, interno ou de representante: SEMPRE cai como PERGUNTA no Direcionar. Substitui "Pix acima de R$ 3.000 vai para Pontual ou Point". Já existe `ex_pix_3000` em `domain/pix-regras.js:140`. Retirar a regra 4 de `domain/direcionar-pix.js:122` (manda para Pontual/Point).
- [A CONFIRMAR] Venda com 70% ou mais em dinheiro: o Pix vai para o Itaú, até março de 2027; depois o Marcus revê. O corte é 70% (o 80% fica descartado). Código: `pix-regras.js:141-142` (`ex_pouco_pix` só até R$ 300). Falta saber se vale para todo Pix até R$ 3.000. Falta pôr a data de validade (03/2027).
- [DECIDIDO] Open Finance: NÃO agora. Só em 2027.
- [DECIDIDO] (25/11/2026, 2ª rodada) Venda com 70% ou mais em dinheiro: MANTER como está no código. `ex_pouco_pix` (Pix até R$ 300 vai para o Itaú PJ) e `ex_dinheiro_grande` (dinheiro 70% ou mais e total de R$ 3.000 ou mais: pergunta). Vale até março de 2027; depois o Marcus revê.
- [DECIDIDO] (25/11/2026, 3ª rodada) Saldo das contas: quem lança é o financeiro (Nayale ou Anamaria), em qualquer horário.
- [FEITO] Alta da média: dezembro 10% (código mudado em `domain/financeiro.js:210`, era 12%). [A CONSTRUIR] Janeiro 15% (era 17%): achar onde janeiro entra na tela Resultado do mês.
