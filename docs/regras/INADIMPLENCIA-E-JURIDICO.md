# Regras: inadimplência, nota promissória e Jurídico (vigentes em 25/11/2026)

Documento ÚNICO e vivo. Só a regra de HOJE. Sem conversa, sem histórico (histórico em `docs/DECISOES.md` e `docs/arquivo/`).
Se este texto e o código discordarem, o CÓDIGO vence: corrija este arquivo.
Marcação: **[FEITO]** já no sistema · **[A CONSTRUIR]** decidido, falta construir · **[A CONFIRMAR]** o Marcus ainda não decidiu. Nunca implemente [A CONFIRMAR] sem perguntar.
Uso interno. NÃO vai para folder nem para PDF da revendedora (o folder só diz que a dívida não negociada vai para a cobrança).
Nomes de devedoras, valores e CNPJ completo: nunca aqui. Só em arquivos `*.local.*`.
Regras do acerto que geram a dívida: `docs/regras/REPRESENTANTES-E-COMISSOES.md`, seção 5.

## 1. O que é inadimplência
- É a **pendência de pagamento de um acerto**: a revendedora pagou menos do que devia. O que falta fica aberto no setor de Inadimplência.
- No sistema, "Acerto com loja" é o que a revendedora **não pagou** no ato, mesmo que pague depois. Para saber o que de fato NÃO entrou, olhar o que foi recebido depois. **[A CONFIRMAR]** como a tela separa os dois valores.
- **Roubo:** condicional fechada pelo valor total da dívida, com código de funcionário no cadastro. Não é inadimplência de revendedora. Os relatórios de inadimplência filtram "não funcionárias". Falta relatório de quantas fecham assim por mês e onde aparece o código **[A CONSTRUIR]**.
- Compras de peças das funcionárias (a prazo) são acompanhadas pelo mesmo setor e contam na meta do setor.
- **Setor próprio (13/11/2026):** Inadimplência é o setor de COBRANÇA e fica FORA do Financeiro (é financeiro, mas tem muita coisa). A cobrança de funcionárias (compra de peças) e de representantes entra nele, numa aba no topo. A tela antiga de "inadimplência" do Financeiro foi mandada excluir. **[FEITO]** segundo o diário de 11/11 e 13/11; conferir o menu.
- **Valor pendente não entra no acerto (02/11/2026):** ele vive 100% no setor de Inadimplência. A representante, no pré-acerto, só registra remarcações, multas e dias de atraso. A dívida nasce sozinha do acerto (pedido de 11/11/2026: "liga com o acerto pra dívida nascer sozinha") **[FEITO]**; conferir a ligação ponta a ponta.
- **Planilha do setor (11/11/2026):** a planilha "Negociações Jurídico" foi carregada inteira no setor. A analista do setor vai configurar depois pelo Claude.

## 2. Fluxo completo (da dívida ao Jurídico)

```
ACERTO, faltou pagar
   │  multa de 10% do valor pendente, na hora (sai da comissão)
   ▼
Negociação NA HORA (caminho 1)
   ├─ pagou 80% ou mais E negociou ......... leva o kit novo
   └─ não negociou / pagou menos de 80% .... sem kit novo
          │
          ▼
Setor de INADIMPLÊNCIA (caminho 2) .. negocia caso a caso
   ├─ acordo cumprido ................. QUITADA
   └─ sem acordo, ou acordo descumprido
          ▼
      JURÍDICO ... retirar o kit e executar a nota promissória
```

| Etapa | Regra | Situação |
|---|---|---|
| Multa do acerto | 10% do valor pendente, na hora | [FEITO] |
| Negociação na hora | Até 2 parcelas, mínimo R$ 200,00 cada, tudo em até 30 dias corridos e antes do próximo acerto. Dívida abaixo de R$ 400,00 = parcela única | [FEITO] |
| Atraso da parcela | +1% ao dia sobre o pendente, teto de 10% | [FEITO] |
| Prazo do acerto | Contado em dias úteis desde o primeiro dia marcado: até o 5º dia útil sem acréscimo; do 6º ao 30º, −1% de comissão e −1% de brinde por dia; depois do 30º, perde tudo, Jurídico, sem kit | [FEITO] a conta; a mudança automática de status é [A CONSTRUIR] |
| Sem negociar na hora | Sem kit novo; 48 horas úteis para negociar; depois executa a nota | [A CONSTRUIR] |
| Pagamento no acerto seguinte | Quita primeiro a dívida mais antiga | [FEITO] |
| Duas pendências | Ficam juntas, total somado. Vai à última negociação. Se não cumprir, executa a nota | [FEITO] a soma; a regra de execução é [A CONSTRUIR] |
| Kit | Com pendência anterior NÃO sai kit novo. Não pode dever duas vezes seguidas. Chegou o próximo acerto e não pagou: retirar o kit | [A CONSTRUIR] |
| Kit 100% Prata | Mesma regra. Assina a nota promissória também | [FEITO] |
| Atendimento interno | Sem representante: a dívida vai direto ao setor. Sem taxa de deslocamento | [A CONFIRMAR] o "direto ao setor" |

- A Inadimplência só negocia. O acordo tem **uma chance só** (04/11/2026). Faltou o pagamento combinado: Jurídico. Em 04/11 o Marcus disse: "se não tiver acordo e cumprimento do acordo, falta de pagamento na primeira negociação, já vai para o Jurídico"; as regras do setor seriam alinhadas depois (e foram em 11/11).
- **Dívida de acerto com kit na mão (11/11/2026):** a regra de prazo é a mesma para quem tem kit; "quem leva kit tem a regra mais dura". Sem nota promissória assinada continua sem kit (há revendedoras que sumiram com o kit e não assinaram).
- Quem deve e saiu: regra **[A CONFIRMAR]**. Resposta parcial de 11/11/2026: representante que sai recebe as comissões do período; pagamento de inadimplência depois da saída não gera comissão.

## 3. Negociação no setor (texto do Marcus, 11/11/2026) [A CONSTRUIR]
A tela atual de Inadimplência segue o fluxo antigo de 26/10/2026. As regras abaixo ainda não estão no sistema.

- **Formas:** Pix à vista; Pix parcelado; cartão de crédito em até 6 vezes sem juros, por link. Boleto não.
- **Pix parcelado:**

| Valor da dívida | Máximo de parcelas |
|---|---|
| Até R$ 300,00 | 2 |
| R$ 300,01 a R$ 600,00 | 3 |
| R$ 600,01 a R$ 1.200,00 | 4 |
| Acima de R$ 1.200,00 | Analisar, ou cartão em até 6 |

- **Parcela mínima: R$ 150,00.** Valem os dois limites juntos. (No caminho 1, feito na hora do acerto, a parcela mínima é R$ 200,00.)
- **Primeira parcela:** paga no mês da negociação, de preferência na hora. "Pago quando conseguir" não é negociação: toda negociação tem valor, forma e data.
- **Acordo por Pix descumprido:** não há novo parcelamento por Pix (só com exceção autorizada). Oferece cartão ou quitação do saldo.
- **Prorrogação:** só 1 por parcela, pedida antes do vencimento, com justificativa, aprovada pelo setor.
- **Descumprimento:** parcela não paga na data = status VERIFICAR sozinho; o setor contata; sem justificativa ou retorno = acordo DESCUMPRIDO. Novo acordo não é automático.
- **Última oportunidade** (acordo descumprido, falta de retorno, promessa não cumprida): informar valor pendente, forma aceita, data final, que não há nova prorrogação e as consequências.
- **Exceções** (só com autorização, registrando quem autorizou): parcela abaixo de R$ 150,00, prazo acima do padrão, segunda renegociação, novo Pix parcelado após descumprimento, desconto, condições especiais.
- **Desconto ou acordo fora do padrão:** a analista do setor decide caso a caso; desconto alto ou condição fora do padrão pede autorização do Nickolas ou do Marcus antes de fechar.

## 4. Status e rotina de cobrança [A CONSTRUIR]

| Status | Quando |
|---|---|
| OK | Seguindo o combinado |
| Verificar | Parcela ou previsão vencida sem pagamento confirmado (automático). Não aplica multa nem manda ao Serasa sozinho |
| Não responde | Sem retorno |
| Próximo mês | Adiado |
| Quitada | Pagamento integral confirmado e saldo R$ 0,00 (automático, com data) |
| Exceção | Fora das regras, autorizada |

Rotina: 1) primeiro contato quando o setor assume; 2) segunda tentativa depois de 2 dias; 3) terceira tentativa depois de 7 dias, com comunicação final e 48 horas para ela se manifestar; 4) acompanhar pagamentos e acordos; 5) analisar medidas.
Regra principal: nenhuma dívida fica "em negociação" sem valor, forma e data.

## 5. Representante na cobrança
- A representante avisa a direção ou o setor e tem **7 dias** para negociar e informar: valor negociado, entrada, parcelas, datas, forma e último posicionamento. "Está cobrando" não basta.
- Sem cobrança, acompanhamento ou atualização: o Jurídico assume e a representante **perde a comissão** (texto de 11/11/2026). **[A CONFIRMAR]** se é automático ou depende de análise do setor (o texto de 11/11 tem as duas versões).
- Cobrou certo e a devedora não colabora: o Jurídico ajuda e o setor analisa a comissão.
- Comissão retida: retém SOMENTE o valor pendente. Pagamento feito depois vira linha extra do acerto e a comissão entra na remessa seguinte (ver `REPRESENTANTES-E-COMISSOES.md`, seção 6).
- Sistema: mostrar a representante, quem cobra, o prazo de 7 dias, a decisão sobre a comissão com justificativa, e quem recuperou cada pagamento.

## 6. Pagamentos e quitação
- Registrar: data, devedora, valor, conta de recebimento, quem recuperou, confirmação e baixa na DevMaster. Integral ou parcial, com comprovante.
- O saldo só muda depois da CONFIRMAÇÃO. Confirmação do recebimento e baixa na DevMaster são controles separados (lista dos não baixados).
- Comprovante sem confirmação não quita. Dívida quitada continua nos relatórios históricos.
- Negativada no Serasa: a quitação gera a pendência de regularizar a restrição.

## 7. Serasa, encargos e Jurídico
- **Negativação:** análise com 30 dias de atraso sem acordo vigente. Prioridade: sem resposta, acordo descumprido, promessa não cumprida, recusa, kit não devolvido, contato interrompido. Nunca automática: depende de análise e requisitos legais.
- **Encargos:** o sistema sinaliza vencidos. Multa e juros do setor NÃO entram sozinhos: só com autorização e documentação. Guardar o valor original e os acréscimos autorizados.
- **Camada 2, Jurídico:** executa a nota promissória (kit inteiro se sumiu; saldo devedor se não pagou). Multa de 10%, juros de 1% ao mês pro rata die, correção pelo IPCA, custas e honorários.
- O "1% ao dia" é do acerto (camada 1). O "1% ao mês" é da nota (camada 2).
- **Processo jurídico:** 1) notificação extrajudicial (10 dias, contados da ENTREGA); 2) protesto, só se não regularizar; 3) execução judicial. Envio por WhatsApp ou e-mail; carta com AR só se a entrega não for confirmada. Pagamento só na conta do CNPJ da Sorelly. Assina a notificação a sócia, pelo gov.br.
- **Avalista:** critério para exigir **[A CONFIRMAR]**. O modelo da nota de 11/11/2026 tem campo de avalista (assina quando exigido).
- **Expositor perdido ou sem kit (09/11/2026):** a lista fica em Encomendas e reposições (Admin). Há três números em mensagens diferentes: "só se tiver mais de 60 dias em aberto" (cobrança), "mais de 70 dias com kit" (aba de revisão) e "mais de 90 dias com kit: executar a nota promissória". **[A CONFIRMAR]** qual vale para cada ação. Detalhe em `LISTAGENS-E-MONTAGEM.md`, seção 10.
- Retirar o kit e executar a nota deixam a tela de Inadimplência e passam para o Jurídico **[A CONSTRUIR]**.
- Não existe prazo fixo para considerar a dívida perdida. Sem nota promissória ainda pode negativar, conforme a documentação.
- Setor Jurídico no menu (abas "em breve"): Notas promissórias, Salas comerciais, Marcas e patentes.

## 8. Nota promissória e termo da condicional [FEITO no modelo, falta o papel da DevMaster]
- A data do acerto e da devolução é o **vencimento** da nota.
- Termo com 7 cláusulas: acerto na data; responsabilidade integral; pagamento integral (multa de 10% do pendente); atraso do acerto reduz comissão e brinde; cobrança; nota; regulamento. Peça ausente no acerto é vendida.
- Nota revisada pelo advogado: multa de 10% e juros de 1% ao mês pro rata die, IPCA, custas e honorários, cobrados sobre o SALDO DEVEDOR (não sobre o valor da nota). Sem frase do Art. 75 e sem autorização de protesto escrita.
- Sem nota promissória assinada, sem kit.
- Falta: nota final do Marcus; trocar o texto no modelo impresso da DevMaster (quem edita o modelo é a DevMaster, não o desenvolvedor). A cláusula de peças para troca ficou fora (a política de trocas será refeita).
- Texto completo do termo: `docs/negocio/CONDICIONAL-TERMO-E-NOTA.md`.

## 9. Relatórios [A CONSTRUIR]
Mensal: novas inadimplências, valor originado, pagamentos, recuperado, em negociação, sem retorno, saldo aberto, % de recuperação. Geral: total histórico, recuperado, saldo, quitadas, negativadas, evolução mensal. Separar a data de origem da dívida da data do pagamento.

## 10. Automático x análise
- **Automático:** saldo após pagamento confirmado, status Verificar, quitação com saldo zero, relatórios, tempo em aberto, avisos de prazo, conta do atraso do acerto.
- **Só com análise ou autorização:** comissão da representante, troca de quem cobra, multas e juros do setor, cancelar ou renegociar acordo, Serasa, Jurídico, baixas excepcionais.

## 11. Em aberto (perguntas ao Marcus)
RESOLVIDAS (mensagens de 11 e 16/11/2026):
- Prazo para quitar: **30 dias corridos e antes do próximo acerto** (código e Marcus). A tela do setor, o LEIA-ME e o termo da condicional que dizem 15 dias estão errados e precisam ser trocados **[A CONSTRUIR]** (em 16/11 o Marcus mandou arrumar "logo").
- Acerto passa a Jurídico no **30º dia útil** (11/11). Os textos de 60 dias (termo, tela, LEIA-ME) estão superados e também precisam ser trocados.

EM ABERTO:
3. A representante perde a comissão sozinha após 7 dias sem cobrança ou só depois de análise?
4. Multa automática no caminho 1; ao entrar no setor, congela? (sugestão aceita só em conversa)
5. Atendimento interno vai direto ao setor?
6. Avalista: quando exigir?
7. Meta do setor: ver `REPRESENTANTES-E-COMISSOES.md` seção 7.1 (código segue a proposta de 20/10/2026).

## 12. De onde vem cada regra
Código: `domain/consignado.js` (multa, negociação, atraso em dias úteis, `linhasAtraso`, `textoNegociacao`), `domain/comissoes.js` (`prazoPendente`), `domain/condicional-modelo.js` (termo e nota), `domain/metas-setor.js`.
Textos de origem: `docs/negocio/INADIMPLENCIA-REGRAS-DO-SETOR.md`, `docs/negocio/JURIDICO-COBRANCA.md`, `docs/negocio/CONDICIONAL-TERMO-E-NOTA.md`, `docs/setores/inadimplencia/LEIA-ME.md`.
