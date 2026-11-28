# Calculadora de Acertos: regras oficiais

**Fonte única das regras de negócio do acerto.** Atualizado em 28/11/2026 (direção, 3ª rodada do dia).
Vale para o admin das representantes, o Atendimento Sorelly (atendimento interno), o servidor, os registros e os setores que usam esses números (Consolidado, Financeiro, Inadimplência, Comissões, Direcionar, Faturamento, aba de regras e Sorelly Intel).

> **Leia primeiro a seção 2.** Existem duas versões: as **regras em vigor** (27/10/2026) e as **condições novas** (28/11/2026), já construídas e **desligadas**. Nunca misture as duas. Nunca ligue as condições novas sem ordem do Marcus.

## 1. Onde cada coisa mora

| O quê | Onde | Regra |
|---|---|---|
| Folder oficial (texto para a revendedora) | `materiais-do-app/folder-revendedoras.html` → `public/regras/GUIA-DA-REVENDEDORA.pdf` | Referência das regras em vigor. Será refeito para as condições novas. |
| Números das regras | `src/apps/montagem/domain/consignado.js` | Único lugar com número. Nenhuma tela repete tabela. |
| Conta do acerto | `calcularAcerto` (`consignado.js`) | Comissão, brinde, taxa, multas. |
| Conta da tela | `derivarAcerto` (`domain/acerto-derivado.js`) | As duas calculadoras só desenham o resultado. |
| Conta do registro | `contaDoRegistro` (`acerto-derivado.js`) | O que é gravado é o que a tela mostrou. Guarda a memória de cálculo. |
| Conferência do registro | `conferirRegistro` (`acerto-derivado.js`) e `src/server/acerto-conferir.js` | O servidor refaz a conta antes de gravar e carimba o resultado. |
| Conta da dívida | `devidoDe`, `pagoDe`, `faltaDe` (`domain/comissoes.js`) | Inadimplência, Comissões, Direcionar e Consolidado. |
| Ocorrências (remarcação, atraso, quem causou) | `domain/ocorrencias-acerto.js` | A representante informa fatos. O sistema define a penalidade. |
| Feriados (dias úteis) | `domain/feriados.js` | Nacionais, Paraná e Curitiba. Mais os lançados no RH. |
| Regras para leitura (Sorelly Intel, aba de regras) | `regrasAcertoOficiais` (`domain/regras-acerto.js`) e `GET /api/consignado/ingest/regras` | Só leitura. Sai das mesmas constantes da conta. |
| Auditoria dos acertos gravados | `GET /api/consignado/ingest/conferencia?desde=AAAA-MM-DD` | Só leitura. Refaz a conta e lista o que diverge. |
| Teste financeiro | `node scripts/testar-acertos.mjs` | 387 conferências. Rodar antes de publicar qualquer mudança de regra. |

Regra de manutenção: regra nova muda primeiro `consignado.js`, depois este arquivo, depois o folder. Nunca criar número dentro de tela, valor de reserva antigo ou segunda função de cálculo. As regras **não** mudam mais pelo navegador (a ação `REGRAS_CONSIGNADO_ATUALIZAR` foi desligada em 28/11/2026).

## 2. Vigência e versões

```
Regras em vigor  (id rv20261027)               → valem hoje. Kits recebidos a partir de 27/10/2026.
Condições novas  (id rv2-condicoes-2026-11-28) → CONSTRUÍDAS E DESLIGADAS. Valem para os PRÓXIMOS ACERTOS
                                                  a partir da data efetiva, com kit novo ou em circulação.
```

- A data efetiva fica em **um lugar só**: `VIGENCIA_CONDICOES_2` em `consignado.js`. Hoje é `null` (desligado).
- Ligar = escrever a data ali (`"AAAA-MM-DD"`). Depende de **homologação jurídica** e de **autorização do Marcus**.
- Na data, tudo troca sozinho: as duas calculadoras, o registro, a dívida, a aba de regras, as prévias da revendedora e a leitura do Sorelly Intel.
- A versão do acerto é a da **data do acerto**, não a do kit (`versaoDoAcerto`).
- Acerto já finalizado **não é recalculado**. Cada acerto guarda a versão aplicada (`regrasVersaoId`, `regrasCondicoes`) e a memória de cálculo (`memoria`).

O que muda nas condições novas:

| Assunto | Regras em vigor | Condições novas |
|---|---|---|
| Brinde abaixo de R$ 500,00 | Prata tem R$ 38,00 de Select | sem brinde (Ouro e Prata) |
| Brinde de R$ 500,00 a R$ 699,99 | Normal R$ 44,00 · Select R$ 32,00 | só Select R$ 44,00 |
| Brinde de R$ 700,00 a R$ 999,99 | Ouro 88/96 · Prata 74/82 | Normal R$ 68,00 · Select R$ 82,00 (Ouro e Prata) |
| Arredondamento do brinde | para cima | matemático (R$ 162,68 = R$ 163,00) |
| Multa do valor pendente | 10%, sobre joias e taxa | 5%, sobre tudo que ficou pendente |
| Base da pendência (brinde, kit novo, peças) | joias e taxa | acerto completo: joias, taxa, materiais e tags |
| Diferença de brinde com valor pendente | soma no valor a pagar | proibida: os brindes têm de caber no direito |
| Peças do próximo mês, venda de R$ 7.000,00 ou mais | 35 | 50 |
| "Comissão antiga" do Atendimento Sorelly (16/11) | disponível | não existe |

Comissão, remarcação, atraso em dias úteis, negociação e venda mínima são iguais nas duas versões.

## 3. Comissão e brinde

Regras em vigor, Kit Normal (Ouro):

| Venda no acerto | Comissão | Brinde Normal | Brinde Select |
|---|---|---|---|
| R$ 300,00 a R$ 499,99 | 15% | sem brinde | sem brinde |
| R$ 500,00 a R$ 699,99 | 25% | R$ 44,00 | R$ 32,00 |
| R$ 700,00 a R$ 999,99 | 30% | R$ 88,00 | R$ 96,00 |
| R$ 1.000,00 a R$ 1.599,99 | 35% | R$ 118,00 | R$ 122,00 |
| R$ 1.600,00 a R$ 2.499,99 | 40% | R$ 196,00 | R$ 144,00 |
| R$ 2.500,00 a R$ 4.999,99 | 40% | R$ 312,00 | R$ 188,00 |
| R$ 5.000,00 a R$ 6.999,99 | 45% | R$ 368,00 | R$ 232,00 |
| R$ 7.000,00 ou mais | 45% | R$ 442,00 | R$ 282,00 |

Regras em vigor, Kit 100% Prata:

| Venda no acerto | Comissão | Brinde Normal | Brinde Select |
|---|---|---|---|
| R$ 300,00 a R$ 499,99 | 20% | sem brinde | R$ 38,00 |
| R$ 500,00 a R$ 699,99 | 30% | R$ 44,00 | R$ 32,00 |
| R$ 700,00 a R$ 999,99 | 35% | R$ 74,00 | R$ 82,00 |
| R$ 1.000,00 a R$ 1.599,99 | 40% | R$ 112,00 | R$ 96,00 |
| R$ 1.600,00 a R$ 2.499,99 | 45% | R$ 188,00 | R$ 122,00 |
| R$ 2.500,00 a R$ 4.999,99 | 45% | R$ 282,00 | R$ 168,00 |
| R$ 5.000,00 a R$ 6.999,99 | 50% | R$ 344,00 | R$ 224,00 |
| R$ 7.000,00 ou mais | 50% | R$ 422,00 | R$ 262,00 |

Condições novas: as mesmas tabelas, com três linhas trocadas (Ouro e Prata):

| Venda no acerto | Brinde Normal | Brinde Select |
|---|---|---|
| Abaixo de R$ 500,00 | sem brinde | sem brinde |
| R$ 500,00 a R$ 699,99 | sem brinde | R$ 44,00 |
| R$ 700,00 a R$ 999,99 | R$ 68,00 | R$ 82,00 |

- Venda abaixo de R$ 300,00: sem comissão e sem brinde.
- Brinde Select: só peça com código que começa com BB. Brinde Normal: qualquer peça do kit.
- Normal e Select têm saldos separados. Não há transferência nem acúmulo. Saldo não usado é perdido.
- Brinde é em reais inteiros, por categoria, depois de todas as penalidades.
- Só a tabela muda entre Ouro e Prata. Todas as outras regras são iguais.

## 4. Venda, materiais, trocas e garantia

- Joia não devolvida é vendida, respeitadas as etapas de trocas e garantias.
- Material sujeito a cobrança (MP, MU, maleta, bolsa, expositor, kit de apoio) é conferido pela **bipagem**. Não bipado = não devolvido = cobrado inteiro, **sem comissão e sem desconto**. Não existe segunda confirmação.
- Tag riscada ou extraviada: R$ 5,00 cada.
- Materiais e tags entram no valor a pagar. **Não** entram na venda, na faixa, no brinde nem na média de vendas.
- Troca: a diferença, para mais ou para menos, altera a venda comissionável.
- Crédito de garantia: reduz a venda antes da faixa, da comissão e do brinde. Crédito maior que a venda **não é consumido**: a sobra fica gravada no acerto (`creditoGarantiaSobra`) para uso futuro.

## 5. Taxa de deslocamento

| Situação | Valor |
|---|---|
| Venda abaixo de R$ 300,00 | R$ 35,00, somados ao acerto |
| Atendimento interno | sem taxa |

## 6. Pagamento, multa e dívida

- Ordem do pagamento: dívida mais antiga → acerto → diferença de brinde.
- O valor usado na dívida anterior **não** conta como pagamento do acerto atual.
- Multa do valor pendente: só nasce com o acerto finalizado, com acordo ou com recusa de negociar. A multa não incide sobre ela mesma.
- Kit novo: 80% ou mais pago e o resto negociado na hora.
- Negociação: até 2 parcelas de R$ 200,00 ou mais, em até 30 dias corridos. Dívida abaixo de R$ 400,00: parcela única.
- Parcela atrasada: +1% ao dia, teto de 10%.
- Não negociou: sem brinde, sem kit novo, caso segue para a cobrança.
- **Dívida:** tudo que foi cobrado no acerto e não foi pago: joias, taxa, multas, tags e materiais. Quem paga só as joias e deixa o material aparece como inadimplente.
- Negativação, Jurídico e encargos sujeitos a análise **não** são automáticos.

## 7. Brinde e pagamento

| Valor pendente (% da base) | Brinde liberado |
|---|---|
| Pago integral | 100% |
| Acima de zero e até 5% | 80% |
| Acima de 5% e até 10% | 50% |
| Acima de 10% | sem brinde |

```
sem pagamento lançado  → escolha PROVISÓRIA: direito cheio, diferença já aparece no total
pagamento lançado      → direito pela tabela acima, recalculado a cada pagamento
direito diminuiu       → aviso: retirar ou trocar os brindes (ou completar o pagamento)
sem direito            → brinde não é entregue, não gera dívida, o acerto não fecha com ele escolhido
```

- "Sem pagamento lançado" (fase provisória) é diferente de "acerto finalizado sem pagamento". No segundo caso não há brinde.
- Condições novas: com valor pendente não existe diferença de brinde. O acerto parcial fecha depois que a escolha cabe no direito.
- Exemplo oficial (condições novas): venda R$ 2.000,00, comissão 40%, acerto R$ 1.200,00, diferença provisória R$ 26,00, total previsto R$ 1.226,00. Pagou R$ 1.000,00: perde os brindes, a diferença sai da conta, fica pendente R$ 200,00 mais a multa de 5% (R$ 10,00) = R$ 210,00.

## 8. Remarcação, atraso e pré-acerto

**A representante informa os fatos. O sistema define a penalidade. Nenhum percentual é digitado.**

| Remarcação, cancelamento ou falta causada pela revendedora | Comissão | Brinde |
|---|---|---|
| 1ª vez | −5% | −15% |
| 2ª vez | −8% | −50% |
| 3ª ou mais | −15% | sem brinde |

Vale a linha da vez; as anteriores não se somam. A contagem reinicia a cada kit novo.

| Dias úteis depois da primeira data marcada | Comissão | Brinde |
|---|---|---|
| Até o 5º | sem desconto | sem desconto |
| Do 6º ao 30º | −1% por dia | −1% por dia |
| Depois do 30º | perde tudo | perde tudo |

- A perda do atraso **soma** com a da remarcação. A comissão nunca fica negativa.
- Dia útil: segunda a sexta, sem feriado de Curitiba. Conta da **primeira** data marcada. Não recomeça na remarcação nem em mudança de data na DevMaster (`preAcerto.primeiraData`).
- Quem causou a ocorrência: **Revendedora** (pesa), **Representante**, **Sorelly**, **Motivo sério com prova** (não pesam).
- Aviso com 10 dias ou mais: sem multa, uma vez por kit.

Conferência obrigatória antes de finalizar (admin das representantes):

```
sistema achou o histórico   → bloco "Multas · calculado pelo sistema"            → representante confirma
sistema não achou           → bloco "Multas · informado pela representante"      → ela preenche o pré-acerto
sem conferência             → o acerto não finaliza
```

- Pré-acerto: data original, remarcações (quem causou, motivo, prova) e dias úteis. A contagem do sistema aparece ao lado. Dias diferentes da contagem pedem justificativa.
- Toda correção fica no histórico do kit (`preAcerto.edicoes`): valor anterior, valor corrigido, justificativa, quem, data e hora, origem (automática ou manual).
- O bloco mostrado à revendedora não tem botão de edição. A correção abre com dois toques.
- O Atendimento Sorelly já tinha o controle de datas próprio (agenda e registro de contatos). O cálculo automático usa essa base.

## 9. Venda mínima e renovação

- Média das 4 últimas vendas (3 anteriores + a do acerto). Com menos de 4, usa as que existem. Venda zero entra na média.
- Atendimento só de kit novo, reposição, garantia ou brinde não é acerto comercial e não entra na média.
- Referência: R$ 500,00 com representante, R$ 700,00 no atendimento interno.
- Média abaixo: kit novo bloqueado.
- **Nova chance:** uma única vez por revendedora. Fica gravada no acerto (`novaChance`).

Peças para o próximo mês (quantidade pela venda, reduzida pela pendência, sempre para baixo):

| Venda | Em vigor | Condições novas |
|---|---|---|
| R$ 1.000,00 | 10 | 10 |
| R$ 2.000,00 | 15 | 15 |
| R$ 3.000,00 | 20 | 20 |
| R$ 5.000,00 | 35 | 35 |
| R$ 7.000,00 ou mais | 35 | 50 |

Quitado = 100% · até 5% pendente = 75% · até 10% = 50% · acima = 0.

## 10. Definições superadas (não voltar a implementar)

| Regra antiga | Situação |
|---|---|
| Material de uso geral só cobrado com marcação "Cobrar este material" | Criada e **superada no mesmo dia** (28/11/2026). Não bipado é cobrado. |
| Escada de atraso em dias corridos (5% a 25%) e Jurídico em 60 dias | Saiu em 28/11/2026. |
| Valor de reserva de R$ 500,00 na taxa de deslocamento e de R$ 5,00 fixo na tag | Saíram em 28/11/2026. A reserva é sempre a constante oficial. |
| Tabela de comissão repetida na tela Peças que voltaram | Saiu em 28/11/2026. |
| Brinde cheio na tela para quem devia mais de 10% | Corrigido em 28/11/2026. |
| Regras editadas no navegador (tela "Regras dos acertos") | Desligado. Regra só muda no código. |
| Representante digitando ou negociando multa | Ela informa fatos. O sistema calcula. |
| Média de vendas sem bloquear o kit novo | Era erro de código. Corrigido em 28/11/2026. |
| Registro gravado por conta diferente da tela (acordo como "pago por inteiro") | Corrigido em 28/11/2026 (`contaDoRegistro`). |

Só para registro histórico: `PRATA_FAIXAS_LEGADO`, `PRATA_LEGADO`, versão sem o campo `novas` (kits de antes de 27/10/2026) e a "comissão antiga" de 16/11 (some sozinha quando as condições novas entrarem).

## 11. Sorelly Intel

- Leitura das regras: `GET /api/consignado/ingest/regras` (chave de serviço `x-ingest-key`).
- Devolve: `versaoVigente` (id, data), todas as tabelas e percentuais da versão vigente, `condicoesNovas` (ativas ou não, data de vigência e todas as tabelas), `penalidades` (quem causou, isenções, feriados do ano), `definicoes`, `formulas` e `contaOficial`.
- Auditoria: `GET /api/consignado/ingest/conferencia?desde=AAAA-MM-DD`.
- O que o Leonardo precisa ligar: a ferramenta `regras_acerto` do Sorelly Intel chama a primeira rota e devolve o JSON como está. Uma segunda ferramenta (`auditoria_acertos`) chama a segunda. **Não copiar as regras para dentro do MCP.**

## 12. Em aberto (aguardando o Marcus)

Ver a seção de 28/11/2026 (3ª rodada) em `docs/DECISOES.md`.
