# Numerários: o elo entre o Admin e a DevMaster (decidido em 25/11/2026)

LER ESTE ARQUIVO ANTES de mexer em: conta ou chave Pix, destino de pagamento, Direcionar, "Escrever na folha", Consolidado das representantes, mensagem para a atendente, contas a pagar ou baixa.
Marcação: [DECIDIDO] Marcus decidiu · [A CONSTRUIR] decidido, falta fazer · [A CONFIRMAR] sem decisão (não implementar sem perguntar).
Nenhum dado real aqui (chave Pix, CNPJ, valor). Dado real fica no banco ou em `*.local.*`.

## 1. A ideia em uma frase
A DevMaster só conhece o NUMERÁRIO (forma de pagamento, ex.: "Pix Representantes"). O Admin conhece a conta REAL (ex.: a chave Pix da Dávila). Todo pagamento do Admin precisa dizer qual numerário a funcionária escolhe na DevMaster.

```
Conta real no Admin                  Numerário na DevMaster              Banco da DevMaster
(chave Pix, pessoa, destino)  ───►   (acd_codigo, ex.: PS, RP, PXM) ───► (acd_banco/agência/conta)
        │                                     │
        │ vê: conta real (só interno)         │ vê: numerário (folha, consolidado, atendente)
        ▼                                     ▼
 Admin interno                        Folha · Consolidado · Mensagem da atendente · Baixa na DevMaster
```

## 2. As regras
| # | Regra | Marca |
|---|---|---|
| R1 | Toda conta, chave Pix ou destino do Admin liga a UM numerário da DevMaster. Conta nova só fica pronta quando o numerário é escolhido (lista = tela Numerários). | [DECIDIDO] ligação · [A CONSTRUIR] o campo e a trava |
| R2 | O Admin NÃO cria numerário novo na DevMaster. Primeiro alinhamos o Admin ao que já existe. | [DECIDIDO] |
| R3 | Dentro do Admin (uso interno) aparece a conta REAL (ex.: Dávila, Thalita, Greice). Na folha, no Consolidado e na DevMaster aparece o NUMERÁRIO (ex.: Pix Representantes, Pix Prestadores de Serviços). Nunca o nome da pessoa na folha. | [DECIDIDO] · [A CONSTRUIR] |
| R4 | Pagamento de representante (acerto, comissão): numerário "Pix Representantes" (RP). | [DECIDIDO] |
| R5 | Pagamento de produção de peças (ex.: Dávila, Leci): numerário "Pix Produção de Peças" (PPP). Marcus decidiu em 26/11/2026 usar o PPP, que já existe na DevMaster. Prestador de serviço comum: "Pix Prestadores de Serviços" (PS). | [DECIDIDO] |
| R6 | Pix para as contas do Marcus (Nubank), da Greice e do Higor: na DevMaster todos entram como "Pix Marcus Hess PF" (PXM). No Admin continua a conta real. | Dito pelo Marcus · [A CONFIRMAR] contra os pagamentos da DevMaster |
| R7 | A tela Financeiro › Cadastro › Numerários copia a DevMaster pelo menos uma vez por dia. Ela é a lista oficial de numerários do Admin. | [FEITO] (tela refeita em 26/11/2026 depois que a pasta trocou de branch e levou as alterações; testar de novo ao abrir) |
| R8 | Quem mexer em conta, pagamento, Direcionar, folha ou Consolidado confere este arquivo e a tela Numerários antes de entregar. | [DECIDIDO] |
| R9 | O BANCO vem do numerário. Na DevMaster cada numerário aponta para UM banco (`dmacd.acd_banco/agencia/conta` → `dmaap`). O Admin nunca pede "banco" à parte no destino: mostra o banco do numerário escolhido (tela Destinos, coluna "Banco na DevMaster") e só isso. O banco real de onde o dinheiro sai (ex.: Itaú Marechal, em Saldos das contas) e o banco do numerário (ex.: CAIXA PIX PRODUÇÃO DE PEÇAS) podem ser diferentes: é normal, não é erro e não se tenta igualar. Das 72 contas de banco da DevMaster, cerca de 40 são "caixas Pix" (CXA, CXP, PPP...) que só separam o tipo de pagamento; todas têm saldo R$ 0,00 (análise de 26/11/2026). A tela Financeiro › Cadastro › Bancos continua só como cópia de leitura. | [DECIDIDO 26/11/2026] · [FEITO] coluna na tela Destinos |

## 3. O que cada pessoa vê (modelos de texto)
| Quem | Texto | Marca |
|---|---|---|
| Admin, pagamento (interno) | Chave Pix + nome da conta real (ex.: Dávila). Linha: "Anotar na folha: Pix Produção de Peças" (o nome do numerário ligado à conta). | [A CONSTRUIR] |
| Atendente interna, depois do comprovante | "Pix Dávila ok, comprovante anexado. Informar à funcionária: Pix Dávila → coloque Pix Produção de Peças na DevMaster." (o numerário vem da conta; prestador comum sai "Pix Prestadores de Serviços") | [A CONSTRUIR] |
| Folha e Consolidado | Só o numerário (ex.: "Pix representante"). Nunca o nome da conta real. | [A CONSTRUIR] |

Regra do texto: a primeira parte diz a conta real; a segunda diz o numerário que vai na DevMaster. O nome do numerário sai da tela Numerários, nunca digitado à mão.

## 4. Fatos medidos na DevMaster (25/11/2026, 148 numerários, cópia na tela Numerários)
| Código | Numerário | Observação |
|---|---|---|
| RP | Pix Representantes | Banco "Caixa Pix Representantes". Muito usado. |
| PS | Pix Prestadores de Serviços | Banco "Caixa Pix Prestadores de Serviço". Muito usado (33 pagamentos em 90 dias). |
| PPP | Pix Produção de Peças | EXISTE, ativo, no PDV. Teve 1 pagamento em 18/11. Veja "Não alinhado". |
| PXM | Pix Marcus Hess PF | Sicredi Marcus PF. Duplicado: PXH (Caixa Habitação). |
| PXR | Pix revendedora | Sem banco ligado. |
Não existe numerário para Marcus Nubank, Greice nem Higor. Por isso R6.

## 5. Não alinhado (levar ao Marcus, não escolher sozinho)
1. [RESOLVIDO 26/11] O PPP existe. Marcus decidiu usar o PPP para produção de peças (R5).
2. `PRODUCAO-E-CADASTRO-DE-PECAS.md` (linha da Dávila) diz "PIX PRODUÇÃO DE PEÇAS": confere com a R5. O código da mensagem só precisa passar a ler o numerário da conta, em vez de texto fixo.
3. Conta que o Marcus citou e não existe na lista: Marcus Nubank, Greice, Higor (R6).
4. PXR (sem banco) e PXH (duplicado): arrumar na DevMaster? Decisão dele.
5. 1.810 contas a pagar dos últimos 90 dias sem numerário (R$ 439.741,23 em 25/11): não dá para ligar conta ↔ numerário nelas.

## 6. Onde isso vive no código
- Lista oficial de numerários: `src/server/numerarios.js`, rota `app/api/numerarios`, tela `AbaFinNumerarios` (Financeiro › Cadastro › Numerários).
- Conta real e "Escrever na folha": `lib/chave-do-destino.js` (hoje só o Itaú PJ do Marco tem texto de folha fixo) e tela Financeiro › Pagamentos › Controle de pagamentos › Destinos.
- Chaves Pix: Financeiro › Bancos › Chaves Pix (`ChavesPixBancos.js`).
- [FEITO 26/11/2026, 1ª etapa] Campo `numerario`/`numerarioNome` no destino (`domain/controle-pagamentos.js`, `destino_add` e `destino_set`); tela Financeiro › Pagamentos › Destinos (`pages/cp/Destinos.js`) para escolher o numerário; lista em `lib/numerarios.js`; "Escrever na folha" lê o numerário (`lib/chave-do-destino.js`); a dica "DevMaster: ..." do Direcionar lê o numerário; o destino da produção externa nasce com PPP.
- A construir: o mesmo campo nos cadastros dos pontos 3 a 8 da seção 7, a recusa quando vier vazio, o fim da criação silenciosa no Direcionar, a mensagem da atendente e o Consolidado.
- Ver também: `docs/negocio/FORMAS-DE-PAGAMENTO-PDV-DEVMASTER.md` (lista do PDV de 20/11) e `docs/regras/DEVMASTER-E-INTEGRACOES.md` (tabelas `dmacd`, `dmabe`, `dmabf`).

## 7. Análise de 26/11/2026: onde se cria conta no Admin (nenhum liga a numerário hoje)
Medido por leitura do código. Os pontos 1 e 2 foram conferidos à mão.

| # | Lugar (menu) | Arquivo / ação | Liga a numerário? |
|---|---|---|---|
| 1 | Destino de pagamento (`cp.destinos`) | `domain/controle-pagamentos.js`, ação `destino_add` (linha 58): pede só nome e tipo | Não |
| 2 | Destino criado SOZINHO (ninguém escolhe nada) | `pages/DirecionarPix.js` linhas 148 e 182; `pages/producao/ProdPagamentos.js` linha 30 | Não. É o ponto mais perigoso |
| 3 | Pagamentos › Chaves Pix | `pages/ChavesPixBancos.js`: `chave_set`, `func_set`, `prest_set`. A lista de fornecedores é fixa no código; não há botão de favorecido novo | Não |
| 4 | Contas Pix da empresa (`px.contas`) | `domain/pix-regras.js`, `conta_add` / `conta_set`: o campo "label" é um rótulo digitado, igual ao nome da DevMaster, mas não confere com a lista real | Parcial |
| 5 | Contas bancárias (`saldosContas`) | `state/reducer.js` `SALDO_CONTA`; `pages/ConfigContas.js` | Não |
| 6 | Financeiro familiar: prestador e conta bancária | `domain/financeiro-familiar.js`: `prest_add`, `cb_add`, `conta_add` (forma "PIX" em texto) | Não |
| 7 | Fornecedor e prestador da empresa | `domain/pf.js`: `forn_add` / `forn_set`; `pages/pf/Fornecedores.js`; `pages/pf/JanelaLancarPag.js` | Não |
| 8 | RH, produção e representante | `domain/rh.js` `colab_add`; `domain/producao.js` `func_add`; `pix-regras.js` `rep_set` (campo `contaPix` guarda um rótulo) | Não (representante: parcial) |
| 9 | "Escrever na folha" | `lib/chave-do-destino.js` (texto fixo só do Itaú PJ do Marco; pessoas voltam vazio); `lib/nome-conta.js` linha 69 (Charme e Linda fixos); `pages/DirecionarPix.js` linha 160 (Pontual = "PIX - BANHO" fixo); `pages/ContasReceberLista.js` linhas 482 a 500 | Texto fixo |
| 10 | Comissão e Consolidado | `pages/Comissoes.js` linha 293 e `domain/comissoes.js` linha 192 ("PIX REPRESENTANTE" fixo); `domain/consignado.js` e `domain/contas-grupos.js` (nomes fixos) | Texto fixo |

A tela `pages/cp/Destinos.js` não está em nenhum menu (órfã).

### O que mudar (ordem sugerida)
1. **Fonte única:** expor a lista de `numerarios_dm` ao estado do Admin, para qualquer tela escolher o numerário numa lista (nunca digitar).
2. **Campo `numerario` (código DevMaster) em TODO cadastro** dos pontos 1, 3, 4, 5, 6, 7 e 8, com recusa quando vier vazio.
3. **Fim da criação silenciosa** (ponto 2): o destino criado sozinho nasce "pendente de numerário" ou herda o numerário do fornecedor ou prestador. Sem numerário, a mensagem de pagamento fica bloqueada e avisa.
4. **"Escrever na folha" e mensagem da atendente** leem sempre o numerário da conta (pontos 9 e 10). Acabam os textos fixos.
5. **Dados antigos:** tela de pendências para preencher numerário em tudo que já existe, usando o aviso de "sem numerário" da tela Numerários.
6. **Trava de proteção:** teste automático que reprova conta criada sem numerário (como o `npm run padrao`).

## 8. Mensagem padrão de envio do Pix (Marcus, 26/11/2026)
UMA mensagem só, a mesma em todo lugar que manda Pix. Código: `mensagemPixPadrao` em `lib/mensagem-pix.js`. Cada tela só escolhe como mostrar (texto para copiar, cartão no app da representante, janela do Lucas). Ninguém escreve essa mensagem à mão.
```
Comprovante: enviar assim que fizer o Pix.

Escrever na folha/Sistema:
<nome do numerário>

Valor a pagar: R$ 0,00

Chave Pix:
<favorecido>
<tipo da chave>
<chave, sozinha na última linha>
```
Usada em: Contas a receber (janela do Lucas, `ContasReceberLista.js`) e app da representante (`mobile/cartao-pix-conta.js`). [A CONSTRUIR] Atendimento interno (chat "Definir a conta") e Direcionar (copiar). Linha "Pago por" (Marcus ou Sorelly): decisão pendente.
