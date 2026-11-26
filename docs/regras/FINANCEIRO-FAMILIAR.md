# Regras: Financeiro familiar e sócios (vigentes em 25/11/2026)

Documento ÚNICO e vivo. Escrito a partir de TUDO que o Marcus disse nas conversas de 02/10 a 25/11/2026 e do código.
Só a regra de HOJE. **Sem valores, sem banco, sem chave Pix, sem CPF.** Isso fica em `docs/pessoas/`, `docs/negocio/ALUGUEL-ALPHAVILLE.local.md` e `docs/pendencias/familia.local.md` (fora do Git).
Marcação: **[FEITO]** já no sistema · **[A CONSTRUIR]** decidido, falta construir · **[A CONFIRMAR]** o Marcus não decidiu ou o texto e o código divergem.
Itens abertos e conflitos: `docs/pendencias/familia.local.md`.
Fontes complementares: `docs/negocio/lancamento-universal/` (regra de ouro, matriz de saída), `docs/negocio/cerebro-financeiro/`, `docs/negocio/FLUXO-DE-PAGAMENTOS.md`, `docs/regras/FORNECEDORES-E-COMPRAS.md`.
Código: `src/apps/montagem/domain/financeiro-familiar.js`, `pages/FinFamiliar*.js`, `pages/ContasPagarLista.js`.

## 1. Quem é quem

| Papel | Quem | Regra |
|---|---|---|
| **Sócio / família** | Marcus, Anamaria (mãe), Marco Antonio (pai), Ana Beatriz (irmã) | Os 4 dividem a família. Cada um tem coluna, conta e Pix próprios |
| **Sócio fora da família** | Lucas (primo, dono de um dos CNPJs) | Tem pró-labore e Pix. **Fica FORA da divisão da casa e da família** |
| **Empresa** | Os CNPJs do grupo (Sorelly 34, Mayz 46, Serenity 59, Axis 67) e a H&O apps | Contas da empresa ficam no Contas a pagar da empresa |
| **Prestador da empresa** | Quem presta serviço à Sorelly | Aparece no bloco da empresa. Não entra na família |
| **Prestador particular do sócio** | Quem presta serviço a UM sócio (carro, estética, segurança particular etc.) | Aparece na aba Sócios, dentro do sócio dono. **Nunca** vai para outro sócio |

- Acesso é por setor e perfil, não por pessoa. A autorização `financeiro_familia` abre a Família e a vista "Família / Junto" no Contas a pagar. **[FEITO]**
- A autorização `ff_pix` abre SÓ a tela Pix revendedoras dos sócios (para conferir). `ff_pix_ver` é só consulta. **[FEITO]**
- Quem não tem `financeiro_familia` vê só a Sorelly. As linhas da família nem aparecem. **[FEITO]**
- Quem opera o dia a dia da família: Financeiro (a mãe supervisiona) e o Lucas (lança Pix). O Marcus decide. **[FEITO]**
- **Ana Beatriz:** no sistema ela é sócia (coluna própria). Quem ela é para o acesso (sócia ou funcionária) está em **[A CONFIRMAR]**.

## 2. As duas fontes e o lado de cada coisa

```
DevMaster (ERP)  ─ ainda guarda: contas a pagar dos CNPJs e as baixas
Admin (nosso)    ─ guarda: Financeiro familiar (módulo ff) + o que ainda não foi baixado na DevMaster
                   regra de ouro: o Admin sabe do dinheiro ANTES, a DevMaster registra DEPOIS.
                   Quando a DevMaster registrar, o Admin CRUZA e NÃO DUPLICA.
```

- A família é controlada SÓ no Admin. Nunca na DevMaster. **[FEITO]**
- Conta paga no Admin e ainda sem baixa na DevMaster: o Admin mostra como PAGA com a marca "falta baixa na DevMaster". **[FEITO em parte: `domain/casar-pagos.js`]**
- Meta do Marcus: tirar o financeiro 100% da DevMaster. Enquanto isso, tudo que se faz lá se repete aqui. **[A CONSTRUIR]**
- Duas telas de contas da família, duas telas de contas da empresa. As quatro seguem o MESMO desenho (azul padrão, uma linha por conta, tudo centralizado). **[FEITO]**
- No Contas a pagar existe a vista **Empresa / Família / Junto**. Padrão = Empresa. **[FEITO]**
- Hoje o sistema novo e o antigo convivem: o que é da família fica duplicado de propósito até a mãe aprovar a junção. **[A CONFIRMAR]** (ver pendências, grupo B)

## 3. Contas por sócio e telas da Família

| Tela (Financeiro › Família) | Para que serve | Estado |
|---|---|---|
| Home da família | Extrato: linhas = o que é, colunas = quem. Filtros só **mês e pessoa**. Mostra pró-labore, contas, Pix revendedora e casas | [FEITO] |
| Contas › Pagar / Pagas | Contas da família. **Sem** seletor de Situação: Pagar mostra só a pagar, Pagas só as pagas | [FEITO] |
| PIX revendedoras | Meta e Pix recebidos por sócio. Conferência (aguardando, confirmado, divergência) | [FEITO] |
| Sócios | Por sócio: Pix recebido, salário e o que foi enviado a cada prestador particular | [FEITO] |
| Cadastro de prestadores | Prestador particular, dívida, prazo, repasses | [FEITO] |
| Pró-labores | SÓ o cadastro (empresa, vigência, valores). Sem seletor de mês | [FEITO] |
| Faturas (nível Financeiro) | Faturas de cartão, linha por linha | [FEITO só para um cartão] |
| Resumo do grupo (Relatórios) | Resumo antigo | [A CONFIRMAR]: a Home absorveu; falta o Marcus conferir para tirar |
| Histórico, Configurações, Relatório, Gasto por casa | Saíram do menu (código e rota ficam) | [FEITO] |

- O Marcus aprovou o modelo **extrato** para a Home. Resumo, Sócios consolidado e Relatório são absorvidos por ela. **[FEITO em parte]**
- Sócios e Home: "Todos" mostra só a linha de cada pessoa (Marco, Ana Beatriz, Marcus, Lucas, Anamaria). O detalhe de um sócio abre só quando o usuário clica nele. **[FEITO]**
- Home: as casas aparecem "separadas" (uma coluna por casa) ou "juntas" (a parte da casa dentro de cada pessoa). **[FEITO]**
- Home: o Marcus quer ver as pessoas separadas ou juntas, para passar o gasto de cada um aos pais e à irmã. **[A CONFIRMAR se já cobre]**
- Tela de pessoa = resumo. Ao abrir um item (ex.: um financiamento), a estrutura não muda: mostra o item, o pago e o que falta. **[FEITO]**
- Tudo no padrão do Financeiro: azul, 13 px, uma linha por item, **sem letra maiúscula**, sem abreviar. Na Home as letras ficam brancas (decisão de 23/11). **[FEITO]**

## 4. Divisão (rateio) das contas

| Onde a conta foi lançada | Quem divide | Parte |
|---|---|---|
| Uma pessoa (Marcus, Anamaria, Marco Antonio, Ana Beatriz) | Só ela | 100% |
| **Família** (geral) | Marcus, Anamaria, Marco Antonio, Ana Beatriz | 25% cada |
| **Casa Alphaville** | Os mesmos 4 | 25% cada |
| **Casa Praia** | Anamaria e Marco Antonio | 50% cada |
| **Casa Jardine** | Anamaria e Marco Antonio | 50% cada |
| Marco / Anamaria (casal) | Os dois | 50% cada. Só para gasto do casal que NÃO é de casa |
| **Viagem (ex.: EUA)** | Família ÷4 | 25% cada |

- **O Lucas NUNCA entra** em casa, viagem ou família. **[FEITO: `CASAS_DONOS`, `membrosFamilia`]**
- A conta lançada numa casa usa a casa como centro de gasto. A divisão aparece já no lançamento, com o valor editável, antes de escolher a conta. **[FEITO em parte; a janela Pagar ainda será refeita no desenho azul]**
- Conta antiga que já está numa casa e não tem divisão guardada divide pelos donos da casa, sem mexer no dado. **[FEITO]**
- Juros e IOF do cartão da conta usada pela empresa saem da Família e vão para o Contas a pagar da empresa. **[A CONSTRUIR]**
- Mover as contas que ainda estão em "Casa/Família" para as casas certas (conta por conta, com o Marcus). **[A CONSTRUIR]**

## 5. Quem paga × de quem é a dívida

Duas perguntas valem para todo dinheiro: (1) de qual conta saiu? (2) qual dívida quitou?

| Dívida de | Paga com a conta de | O que aparece |
|---|---|---|
| Empresa | Empresa | Custo normal no Contas a pagar da empresa |
| Pessoa da família | **A própria pessoa** | **Só** no Financeiro familiar. Nunca no Contas a pagar da empresa |
| Pessoa da família | **Outra pessoa da família** | Família: conta paga. A pessoa dona da dívida ganha **mais valor recebido** |
| Pessoa da família | **Conta que a empresa usa** | Família: conta paga. Empresa: saiu dinheiro, valor a mais daquela pessoa |
| Empresa | Conta pessoal (pagou só um pedaço) | Só dá como pago. Sem mexer em saldo nem em caixa |

- **Regra anti-duplicidade (Marcus, 19/10, 16/11, 22/11, 23/11):** o que o sócio paga da PRÓPRIA conta, com dinheiro que já contou como "recebido", **não soma de novo** no gasto dele. Exemplo: recebeu o pró-labore e pagou um consórcio da mesma conta. O consórcio conta como pago, não como valor novo. **[A CONFIRMAR no código]**
- Gasto de um sócio pago pela conta de outro membro da família (ou pela conta que a empresa usa): **aumenta** o recebido do sócio dono, porque o dinheiro dele saiu de outra conta. **[FEITO só para casos marcados; A CONFIRMAR no geral]**
- A conta da casa pode ser paga por QUALQUER conta. No resultado do mês ela se divide pela regra do item 4. **[FEITO]**
- Conta que a empresa paga para a família: o financeiro direciona para a família no Admin (D-11). Pode ser de qualquer pessoa e de qualquer conta. **[FEITO]**
- Uma mesma conta pode se dividir entre pessoas (D-12). **[FEITO]**
- Conta de CNPJ paga pelo CNPJ. A empresa para de usar contas pessoais, **salvo** a conta PF do pai usada pela empresa (decisão de 18/11, ver [A CONFIRMAR] nas pendências). **[A CONFIRMAR]**
- Não existe dinheiro entre CNPJs. Só aporte de sócio. **[FEITO]**

## 6. Pix revendedora dos sócios

- Todo mês cada sócio tem uma **meta de Pix revendedora**. A meta é decisão do Marcus. **[FEITO]**
- O Pix revendedora entra no Admin como **recebimento do sócio** (Contas a receber) e vai para a Família como entrada dele. Na empresa, esse Pix é saída (pró-labore ou retirada). **[FEITO]**
- Na Home da Família o Pix revendedora é **meta, não conta a pagar**. No Contas a pagar da empresa ele continua valendo. **[FEITO]**
- Pix que cai na **Casa** (pessoa "Casa/Família") é da Casa e **não** entra nos números dos sócios. O Pix da Casa recebe a marca da casa: Alphaville, Praia, Jardine ou geral. **[FEITO]**
- O Pix revendedora do sócio tem duas partes, e a tela mostra as duas: **(a) o que caiu em conta do próprio sócio** e **(b) o que foi direto a um terceiro** (prestador particular). **[FEITO]**
- Pix direto ao prestador particular **abate a dívida** dele sozinho (vira repasse) e aparece no Contas a pagar por sócio, com prazo (sem prazo = último dia do mês). **[FEITO]**
- O Direcionar lança sozinho o Pix na Família quando o destino é conta de sócio. Reabrir o Pix desfaz. **[FEITO]**
- O Pix lançado antes do acerto vale para o acerto da revendedora (marca "usado no acerto"). O valor não muda depois. **[FEITO]**
- Quem lança Pix hoje: Lucas e o financeiro. Qualquer pessoa do financeiro pode. **[FEITO]**
- Comprovante: pode lançar sem. Fica pendente, com alerta no topo. **[FEITO no Contas a receber; na Família ainda falta o campo]**
- **Fiscal:** como o Pix revendedora pago a sócio entra no pró-labore ou na retirada é assunto do contador. **[A CONFIRMAR]**

## 7. Pró-labore

- **Pró-labore = o que está na tela Pró-labores**: empresa que paga, vigência (desde qual mês), bruto, INSS, IRRF e líquido. **[FEITO]**
- Forma de pagar: adiantamento no **dia 20** e saldo no **5º dia útil**. O cadastro guarda o saldo no dia 5 (o sistema ainda não conta o 5º dia útil). **[FEITO em parte]**
- Pix revendedora, parcela de carro, casa etc. **não são pró-labore**. São outros recebimentos, cada um com sua linha na Home. **[A CONFIRMAR: o diário de 22/11 tem duas definições]**
- O pró-labore não conta duas vezes: nas contas do sócio ele fica FORA de "contas" (categoria própria). **[FEITO]**
- Quem tem tela de pró-labore: Marcus, Anamaria, Marco Antonio, Lucas. **Ana Beatriz não** (os dados dela ficam guardados). **[FEITO]**
- Cada sócio é pago pelo CNPJ do pró-labore dele. A empresa do Marcus ainda aparece com nome antigo em alguns blocos. **[A CONFIRMAR]**
- Pró-labore NÃO é salário de funcionário. Salário e adiantamento de funcionário ficam junto dos Funcionários, do maior para o menor. **[FEITO]**

## 8. Prestadores particulares dos sócios

- Ficam na aba **Sócios**, dentro do sócio dono (Marcus, Anamaria, Ana Beatriz, Marco Antonio). **[FEITO]**
- O nome na tela é: **tipo** (sócio) → **pessoa** → prestador. Texto "prestador família" no lugar de "prestador Marcus". **[FEITO em parte]**
- A dívida é uma **conta corrente**: Pix direto entra e abate. A dívida em aberto aparece em Contas a pagar por sócio, com prazo. **[FEITO]**
- Só entra na lista o prestador que **tinha dívida no início do mês** ou que foi pedido. Quem zerou sai. **[FEITO em parte]**
- Valor pago a mais fica **em verde**, não some. **[A CONFIRMAR no código]**
- Prestador de um sócio **nunca** recebe pagamento de outro sócio. Ao escolher conta, o sistema abre Sócios ou Empresa, depois a pessoa, depois o prestador. **[A CONSTRUIR]**
- A mesma pessoa pode ter dois registros (empresa e particular). **Não é erro.** Nunca somar nem apagar um por "duplicado". Ver `docs/pessoas/`. **[FEITO]**
- Prestador de serviço da empresa, quando também é funcionário, fica só em Funcionários **exceto** os casos com ficha em `docs/pessoas/` (dois blocos). **[A CONFIRMAR]**
- Produção em casa (Dávila e outras) é **produção externa**, não é casa nem família.

## 9. Cartões e faturas

- A **fatura do cartão** é paga de uma vez. As compras dentro dela são linhas separadas na tela Faturas. **Não duplicar:** a conta da compra e a fatura não somam as duas. **[FEITO só para um cartão]**
- Uma fatura mostra: linhas reais da fatura, IOF, vencimento, quem usou (pessoa), e o que ainda não está lançado. **Nunca** usar "previsão" no lugar da fatura real. Previsão sai quando a fatura real chega. **[A CONSTRUIR]**
- Cartão pago pela conta do próprio sócio: só Família (caso E). Cartão pago por outra conta: ver item 5. **[FEITO]**
- Fatura de cartão de outro membro da família pago pela empresa: família paga, empresa saiu dinheiro a mais. **[FEITO]**
- Parcela de crédito bancário, financiamento e consórcio da família ficam na Família. **[FEITO]**
- Onde a Amanda anexa o comprovante da fatura (Família ou Contas a pagar) **[A CONFIRMAR]**.
- Cartão adicional sem pessoa definida **[A CONFIRMAR]**.
- Faltam as faturas de outros cartões e a importação do PDF pela tela (hoje é por script). **[A CONSTRUIR]**

## 10. Financiamentos, empréstimos e créditos

- Financiamento de carro, consórcio e crédito pessoal ficam em Contas da família, com a **categoria** certa (ex.: carros, financiamento), não com o nome do item. **[A CONSTRUIR]** (o Marcus pediu agrupar tudo de carro em "Carros", com o financiamento, o seguro e as parcelas de acidente dentro)
- **Empréstimos da empresa:** ficam em Contas a pagar e têm aba própria (Contas a pagar › Empréstimos). **[FEITO em parte]**
- Contratos de crédito bancário: Ana Beatriz levanta e anexa; os contatos dos gerentes dos bancos ficam em RH › Contratos › Gerentes dos bancos. **[FEITO a tela; A CONFIRMAR o preenchimento]**
- Crédito que entra na conta: mostrar só o valor que aumentou, sem IOF e taxas. As parcelas entram depois. **[A CONSTRUIR]**
- Valor pago com juros a mais que o previsto: o valor real vale; o juro vai para onde o Marcus decidir (ver pendências). **[A CONFIRMAR]**

## 11. Casas

| Casa | Dono da conta | Observação |
|---|---|---|
| Alphaville | Os 4 da família | Aluguel pago na conta de um membro, com Pix de revendedora recebidos ANTES (mês anterior). Ver arquivo `.local` |
| Praia | Anamaria e Marco Antonio | Mesmo tratamento da casa, separada |
| Jardine | Anamaria e Marco Antonio | |
| Escritório / salas | **Empresa** | As salas comerciais são do CNPJ, não da família. Divisão do aluguel: ver ficha `.local` |

- A Home deve mostrar o **total por casa**, sem aba própria. **[FEITO em parte]**
- A janela Pagar tem a conta pagadora e a observação em linha inteira. **[FEITO]**

## 12. Sistema pessoal do Marcus

- Marcus quer um **sistema pessoal separado**, com patrimônio, extratos, senhas e contas dele. **[A CONSTRUIR]**
- No Admin da empresa ficam SÓ: Acessos e senhas e Progresso (setor Marcus). Resumo, Faturamento, Patrimônio e dívidas e Extratos foram **excluídos** em 23/11. **[FEITO]**
- **Extrato pessoal do Marcus NUNCA entra no Admin da empresa.** Mesma regra para dados pessoais de outro sócio. **[FEITO]**
- O sistema pessoal deve ler o Financeiro familiar e o Contas a pagar, e a mudança num lado aparece no outro. **[A CONSTRUIR]**

## 13. O que NUNCA misturar

| Nunca | Por quê |
|---|---|
| Lucas dentro de casa, viagem ou família ÷4 | Ele é primo e sócio de CNPJ, não faz parte da divisão |
| Conta pessoal do pai e conta da empresa com o mesmo nome | Já causou erro nas baixas. Cada conta tem nome próprio |
| Prestador particular de um sócio recebendo de outro sócio | A dívida é do sócio dono |
| Previsão no lugar da fatura real do cartão | Soma duas vezes |
| Extrato pessoal do Marcus no Admin da empresa | Dado pessoal; o sistema pessoal é separado |
| Pagamento que fatura com pagamento que não fatura na mesma venda | Dá trabalho e abre erro. Uma venda, um CNPJ |
| Mover o Financeiro familiar para dentro do da empresa sem aprovação da mãe | A mãe usa o familiar todo dia. Mudar só com cópia e aprovação |
| Pró-labore com Pix revendedora na mesma linha | São coisas diferentes |
| Gasto da casa na conta do Marcus | A casa se divide; só vai para o Marcus a parte dele |
| Segunda contagem de um gasto pago pela conta que já entrou como "recebido" | Soma duas vezes |
| Escrever em caixa alta, abreviar ou usar chips | Regra fixa do Marcus |

## 14. Regras de trabalho

1. Mudou uma regra? Mude (1) o sistema, (2) este arquivo, (3) o diário `docs/DECISOES.md`, no mesmo dia.
2. Antes de mexer em tela, conta ou pagamento de pessoa da família, leia `docs/pessoas/LEIA-ME.md` e a ficha dela.
3. Dado pessoal só em `.local.md`. O repositório é público.
4. Nunca juntar o Financeiro familiar ao da empresa sem cópia de segurança e sem o Marcus dizer "sim". A mãe usa o familiar todo dia.
5. O Claude **não lança** gastos pessoais do Marcus no Admin da empresa.

## Decisões do Marcus em 25/11/2026 (questionário)
- [DECIDIDO] "Itaú Black" e "Marco Itaú PJ" são a MESMA conta (100%). [A CONSTRUIR] Unificar o nome (FAM A7).
- [DECIDIDO] Pró-labore é o que a pessoa recebe de fato de pró-labore, o que está na tela Pró-labores (valores gravados). O restante é recebido da empresa e, somado no fim, forma o "salário" de cada sócio.
- [DECIDIDO] (25/11/2026, 4ª rodada) "Itaú Black" e "Marco Itaú PJ" são a MESMA conta: a conta BLACK do PAI do Marcus, que a empresa usa como conta PJ. O Marcus mandou GRAVAR isso. [A CONSTRUIR] No cadastro único de contas: titular = o pai, uso = pessoal e PJ, um só nome. [A CONFIRMAR com o contador] como registrar o uso PJ de uma conta de pessoa física (ver P0-10).
