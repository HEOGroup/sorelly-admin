# Regras: Fiscal, ILF, sublimite e CNPJs do grupo (vigentes em 25/11/2026)

Escrito a partir do que o Marcus disse de 05/10 a 10/11/2026 (1º tempo), de 10/11 a 25/11/2026 (2º tempo, já lido) e do código (`domain/cnpjs.js`, `domain/fiscal.js`). **O 2º tempo quase não fala de Fiscal**: as mensagens novas são sobre Financeiro e nomes de CNPJ. Só entra aqui o que mudou de verdade (marcado **(2º tempo)**).
Só regra, percentual, prazo e nome de função. Sem valor de faturamento, sem CNPJ completo, sem CPF, sem endereço (isso fica nos arquivos `*.local.*` e no estado salvo do sistema).
Marcação: **[FEITO]** · **[A CONSTRUIR]** · **[A CONFIRMAR]**.
Relacionado: `docs/regras/FINANCEIRO-CONTAS-E-DIRECIONAR.md`. Pendências e conflitos: `docs/pendencias/financeiro.local.md`.

## 1. Os CNPJs do grupo

| CNPJ | Nome curto | Observação |
|---|---|---|
| 34 | **Sorelly** (Atacadista) | Principal. A filial 34 paga contas de todos |
| 46 | **Mayz** | Ex-"Sorelly Comércio" em alguns lugares; o nome certo é Mayz |
| 59 | **Serenity** | Porta-joias e acessórios |
| 67 | **Axis** | É do Lucas (primo do Marcus, sócio) |
| H&O Apps | **H&O** | Empresa de aplicativos. Tem contas a pagar. Fiscal: sem dados por enquanto |
| (sem CNPJ) | Hess & Oliveira | "Contas por fora": existe um local marcado com esse nome |

- **Em toda tela:** o primeiro nome da empresa junto do número (Sorelly 34), nunca só o número. Cada CNPJ tem uma cor fixa, igual em todas as telas.
- **(2º tempo) A forma de escrever o CNPJ mudou três vezes e cada tela pede uma:**

| Data | Tela | O que o Marcus pediu |
|---|---|---|
| 12/11 | Chaves Pix | só o número do CNPJ, sem a palavra "CNPJ" ao lado; fechado: número inteiro, nome inteiro e quantidade de contas |
| 16/11 | Contas bancárias | número (ex.: 34) em cima e o nome (Sorelly Atacadista) embaixo |
| 20/11 | Contas a receber | só o primeiro nome: Sorelly, Serenity, Mayz, Axis (o número some) |
| 22/11 | Telas da família | "Empresa" = nome completo do CNPJ da maneira correta, "tipo o Mayz em todos" |

  [A CONFIRMAR] uma regra única. Até lá, em cada tela vale o que o Marcus pediu para ela. A contabilidade (DP) confirmou em 23/11 que a razão social cadastrada está correta.
- **(2º tempo, 21/11) "CNPJ 465 é Mayz":** o 46 é Mayz (o "5" sobrou de digitação). Mayz continua sendo o nome correto do 46.
- **(2º tempo, 20/11) Contas que não são CNPJ:** "Marco Itaú PJ" é conta da empresa e conta como um CNPJ na tela; "Marco PF" é conta pessoal. Maquininhas Cielo e Getnet são da Pontual, não de um CNPJ nosso. Ver `FINANCEIRO-CONTAS-E-DIRECIONAR.md`, §5.
- Ordem das telas de CNPJ: 4 CNPJs em 2 em 2 + H&O. **Clicar em um CNPJ abre a tela cheia** com todas as informações.
- Tudo que o grupo faz é como grupo econômico: o que é de um CNPJ fica nele, mas não se separa por "dono" para decidir pagamento (ver o documento do Financeiro).

## 2. Cadastro do CNPJ [FEITO, `pages/Cnpjs.js`]

| Bloco | O que tem |
|---|---|
| Dados | Razão social, CNPJ, inscrição estadual, endereço, e-mail, sócio e CPF do sócio (dados reais em arquivo local), inscrição municipal, abertura, regime, CNAE, telefone, contador |
| Documentos anexados | Alvará de funcionamento, contrato social, cartão CNPJ, inscrição estadual, inscrição municipal, certidões negativas, certificado digital, procuração, outros |
| Funcionários do CNPJ | Lista ao lado dos documentos anexados |
| Nunca guardar | Senha, código de acesso (ex.: código do e-CAC) |

- **Certificado digital e contas a pagar da DevMaster em PDF não se apagam** na limpeza de arquivos. Alteração contratual e software fiscal antigo podem sair.
- **Emissor de nota é de cada CNPJ**, não do grupo todo. Mensagem única, com tópicos e contexto, e o resumo dos CNPJs vai no grupo da DevMaster. [A CONFIRMAR] pendência da contabilidade.
- **Sócios (dados completos)** ficam em `cnpjs-socios.local.js`. A tela mostra os quatro sócios e o que cada CNPJ tem.

## 3. Fiscal: o que controla [FEITO, `domain/fiscal.js`, `pages/fiscal/*`]

```
Faturamento fiscal do ano (por CNPJ)
        │
        ├─ Sublimite do Simples ──► quanto falta para o limite
        ├─ Notas de entrada com lastro ─► ILF
        └─ Contas a pagar dos meses que faltam ─► projeção: dá para fechar o ano abaixo do limite?
```

| Regra | Valor |
|---|---|
| **Sublimite anual do Simples** | **R$ 3,6 milhões por CNPJ**. "Nenhum CNPJ pode passar de 3,6 milhões" |
| **ILF** | Notas de entrada com lastro (acumulado do ano) ÷ faturamento fiscal anual, em % |
| **Meta de ILF** | 25% (era 30%); **crítico** abaixo de 15%. [A CONFIRMAR] a origem desses dois números |
| **Por que olhar as contas a pagar** | "O faturamento de cada CNPJ sobe conforme o contas a pagar dele". Projetado = faturado até a última data + contas a pagar dos meses seguintes |
| **Cores da projeção** | Verde até 90% do sublimite · amarelo de 90% a 100% · vermelho acima. Nos dois arquivos de código o 90% está escrito duas vezes (`cnpjs.js` e `fiscal.js`) |
| **No limite** | Contas futuras a partir de 85% do que ainda cabe no CNPJ |
| **Sem movimento** | Venda no ano abaixo de R$ 1.000 não dispara aviso |
| **Verde até 90%** | Frase do Marcus em 05/10: acima disso "não podemos mais ter contas a pagar" naquele CNPJ. O alerta é só um aviso, não trava nada |
| **Pix** | O limite de faturamento por CNPJ **não trava o Pix por enquanto** (cérebro, regra 14) |

### Os números do resumo (o que o Marcus quer ver)
Para cada CNPJ, com a data da última atualização:
1. Faturamento fiscal anual.
2. Quanto falta para o sublimite.
3. Faturamento de brindes do mês (brinde é saída sem pagamento, entra no fiscal).
4. Notas de entrada com lastro do mês e do ano.
5. ILF do CNPJ e o ILF médio do grupo.
6. Contas a pagar até o fim do ano e o resultado (alerta se passar do limite).
Total do grupo também aparece.

### Telas e ordem [FEITO]
- **Painel e notas:** um bloco por CNPJ, **2 em 2**, na ordem de **quem mais precisa de nota de entrada** (menor ILF, maior falta de lastro primeiro). Só números, alertas e escrita; sem dropdown. Botão **Ano | Mês** muda tudo.
- Clicar no CNPJ abre aos poucos: **relatório em cima, lista de notas embaixo**, com filtro. É aqui que se **lança nota fiscal de entrada e saída**.
- **Limite de faturamento:** bloco que separa o que é sobre ILF e o que é quanto o CNPJ ainda pode assumir de contas, mostra o faturamento total e o CNPJ inteiro.
- **Contas do Fiscal** vêm de Contas a pagar da empresa (sem família): pago + falta pagar por mês e CNPJ. O valor digitado no Fiscal só vale em mês sem dado do Financeiro. Local próprio para "contas sem CNPJ", marcado com esse nome.
- **Quem lança:** o Lucas atualiza os números fiscais (ele "tem foco no fiscal" e no direcionamento de Pix). Cada lançamento é uma foto do resumo numa data (acumulado do ano), e o atual é o de data mais recente.

## 4. Onde o Fiscal fica no menu [A CONFIRMAR]
Marcus pediu em 14/10 "fiscal em baixo do Financeiro", em 15/10 "sobe ele pra cima do Financeiro", em 23/10 "a aba fiscal de baixo sai e entra no financeiro" e em 28/10 "o fiscal deve ser uma aba dentro do Financeiro" (o setor CNPJs é o Fiscal). O código de hoje tem o Fiscal como **setor próprio, logo abaixo do Financeiro**, com comentário atribuído ao Marcus em 12/11/2026 (`navigation/setores.js`, linha 35: "saiu do Financeiro e virou setor próprio"). **(2º tempo)** As mensagens lidas de 10/11 a 25/11 **não trazem o texto dessa decisão**, e nenhuma mensagem pede o contrário. Fica como **vigente [FEITO]**: Fiscal = setor próprio, abaixo do Financeiro, com Painel e notas, Limite de faturamento e CNPJs. O 1º tempo (28/10) fica **superado** por essa decisão mais nova (só [A CONFIRMAR] por falta da frase original; a regra "Fiscal puxa o Contas a pagar da empresa" continua valendo).

## 5. O que falta [A CONSTRUIR]
- Puxar as notas de entrada e saída e as contas por mês do admin antigo (último dado fiscal gravado: 24/10).
- Anexar alvarás e documentos por CNPJ e dizer "quais mais informações precisamos dos outros CNPJs".
- Controles fiscais a alinhar com o contador: pró-labore pago por Pix das revendedoras, contas pessoais no fluxo, "por fora".
- Impostos: hoje só DAS, ICMS e taxas; o Marcus disse que "falta imposto" (quais?).
- CCB (empréstimo com garantia de recebíveis) ligada ao CNPJ 46 que atinge recebíveis do 34: confirmar com o financeiro se existe e quanto desconta das vendas.
- Perguntas para a contabilidade sobre emissor e sublimite (aguardando resposta).
- **(2º tempo) Notas fiscais e o relatório de faturamento:** em 12/11 o Marcus pediu "puxa o faturamento com notas fiscais para atualizarmos os dias que faltam" e em 19/11 que a coluna Recebido do Resultado do mês, hoje vinda do relatório de notas fiscais, possa trocar para Contas a receber, com coluna de Inadimplência. Em 23/11 pediu bater **relatório de notas fiscais x contas a pagar x contas a receber x saldo das contas**. É assunto de faturamento fiscal: a medida de faturamento "fiscal" do Fiscal (R$ 3,6 milhões por CNPJ) segue o faturamento por CNPJ, não o recebido real. [A CONFIRMAR] se o faturamento fiscal do Fiscal deve usar o relatório de notas ou o contas a receber.
- **(2º tempo, 24/11) Fatura de cartão e previsões na DevMaster** distorcem o Contas a pagar por CNPJ, que alimenta o Fiscal. Se o Contas a pagar tem título de previsão duplicado, o limite de sublimite projetado sobe sem motivo. Regra de limpeza em `FINANCEIRO-CONTAS-E-DIRECIONAR.md`, §2.

## Correção de 25/11/2026
- "Marco Itaú PJ" = a conta BLACK do pai do Marcus, usada como conta PJ (é a mesma conta do "Itaú Black"). A frase acima, "conta da empresa", fica complementada: é conta de pessoa física usada pela empresa. [A CONFIRMAR com o contador] como registrar (P0-10).

## Decisões do Marcus em 25/11/2026 (questionário)
- [FEITO] Meta de ILF: 30% (código mudado em `domain/fiscal.js`: `metaIlf:0.30`; estado salvo com 25% passa a 30%; versão do estado 3). O "25% (era 30%)" acima está SUPERADO. [A CONFIRMAR] o crítico de 15% continua?
- [DECIDIDO] Fiscal fica como setor próprio, abaixo do Financeiro. O Lucas lança os números fiscais até 2027, quando entra um sistema automático.
- [A CONFIRMAR] Faturamento fiscal: o Marcus disse "eu que lanço". Entender se é o faturamento diário (hoje a Amanda) ou o fiscal por CNPJ (hoje o Lucas).
- [DECIDIDO] "Pagamento da fatura" = pagamento da fatura dos cartões de crédito (era a dúvida "pagamento que fatura x que não fatura", FIN B-4).
- [DECIDIDO] Impostos que "faltam": deixar isso por enquanto.
- [A CONSTRUIR] Escrita única de CNPJ e conta em TODO o sistema (inclusive contas bancárias): número - nome - banco, ex.: "34 - Sorelly - Itaú". Hoje `lib/nome-conta.js` escreve "CNPJ 34 · Sorelly · Sicredi" (com a palavra CNPJ e separador "·") e cada tela pede uma forma (ver §1). Trocar o formato em `rotuloCnpj`/`junta` e conferir as 15 telas que usam a lib.
