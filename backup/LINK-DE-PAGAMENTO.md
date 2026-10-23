# Link de pagamento e maquininhas (contexto passado pelo Marcus em 16/10/2026)

Documento de contexto: o que o Marcus explicou, as regras que já valem e o que ainda falta decidir. **No SorellyAdmin esses módulos são só "em breve" (não existe nada para puxar)**: serão criados do zero aqui. Atualizar ao decidir algo novo. Dados pessoais (nomes de representantes, valores por pessoa) NÃO entram aqui nem no código: ficam em `*.local.js` ou digitados.

## O que é
Ferramenta criada pelo Marcus no ano passado para as **revendedoras venderem às clientes finais**: a revendedora quer vender (ex.: R$ 500) mas não tem maquininha, ou não quer passar na dela por causa dos juros. Ela **solicita um link** (pelo app da revendedora ou pelo WhatsApp), uma funcionária do atendimento gera o link, a cliente paga e **o valor entra como pago do acerto da revendedora**. Em 2026 já passaram **R$ 624.973,07** em links. Mês passado: **356 solicitações pelo app e 130 pelo WhatsApp** (pelo WhatsApp costuma ser quando a cliente deu uma entrada e quer parcelar o restante). Hoje uma funcionária fica o dia todo gerando links; o processo é pouco automatizado.

## Regras (já comunicadas às revendedoras)
- **Regras por valor (19/10/2026, substituem "mínimo R$ 100 e até 6x"):** valor mínimo para gerar **R$ 80,00**. Até R$ 80,00: **1x**. De R$ 80,01 a R$ 400,00: até **4x** sem juros. De R$ 400,01 a R$ 1.500,00: até **6x**. Acima de R$ 1.500,00: até **10x**. Parcela mínima **R$ 50,00** em todas (então R$ 100 cabe 2x, R$ 150 cabe 3x, R$ 200 cabe 4x). Valores no Configurador do link (`cfg.faixas`, `maxParcelasSemJuros` = teto de 10x); lógica em `parcelasMaximas`/`parcelasPermitidas` (`domain/link-pagamento.js`); estado salvo antes disso é atualizado sozinho (`regrasV`).
- O link **expira 12 horas** depois de gerado (precisa pedir outro).
- Pagamento recusado: no máximo **3 tentativas de link por dia**.
- **Fechamento do acerto:** só são descontados os links **emitidos e pagos até o dia anterior ao acerto**.
- O valor pago pelo link **não é devolvido em dinheiro**: abate o acerto, ou fica como **crédito para o próximo acerto**; se a revendedora não retirar novo kit, pode usar em **semijoias** (retirada de peças).
- **No dia do acerto**, se precisar gerar link, **só a representante** emite (sistemas diferentes).
- Exemplo do abatimento: venda de R$ 2.000, acerto de R$ 1.200; link de R$ 200 no mês já abate do valor a pagar. Se passou R$ 1.500 no link: não devolve, vira abatimento/crédito.
- Atendimento: segunda a quinta 08h30–17h30; sábado 08h–12h; almoço 11h30–12h30 (seg a sex). Fora do horário a solicitação (inclusive pelo app) é respondida quando a equipe volta.

## Vários CNPJs
Os links são gerados em **vários CNPJs** (ex.: "Link 59", "Link 46"). Isso interfere nas regras de pagamento da empresa: se a revendedora pagou link de R$ 400 no CNPJ 59 e faltam R$ 100 a pagar no Pix, **o Pix deve ser orientado para uma conta do mesmo CNPJ (59), de preferência a mais negativa** (ligar com o Controle de pagamentos).

## Maquininhas e representantes
- Algumas representantes têm **maquininha própria da empresa** (ex.: "Serenity") e outras usam **"sem maquininha" = Link 59**. Cada **revendedora é vinculada a uma representante**, e o link/maquininha usado é o da representante dela (o link sai pelo mesmo CNPJ da maquininha que a representante usa).
- Por representante o controle de hoje (planilha) tem: maquininha, link de crédito (qual CNPJ), confirmação (data de envio das informações) e "informações" (enviado / ciente / não informado).
- No **Financeiro** deve existir uma aba de **Maquininhas** para controlar as máquinas, taxas e o que mais for preciso (hoje só existe "Maquininha Banho" dentro de Pagamentos a fornecedores, que é outra coisa).

## Comprovantes
Depois da confirmação do pagamento do link, **no dia seguinte** o comprovante é enviado no **grupo de WhatsApp da representante**, com print e este texto:
`Revendedora · Link (CNPJ) · Data do pagamento · Valor pago · Parcelas (ex.: 6x de R$ 92,00) · Data do acerto · Responsável (funcionária) · Gerado em`.
Uma planilha controla quais comprovantes já foram enviados e quais estão pendentes.

## Para o sistema (esboço, a confirmar)
Solicitações (app e WhatsApp) → geração do link (CNPJ conforme a representante) → pagamento → entra como pagamento do acerto → comprovante diário à representante → abate no acerto. Telas prováveis: fila de solicitações (kanban: solicitado → gerado → pago → comprovante enviado), controle por CNPJ, maquininhas e taxas, vínculo revendedora → representante → maquininha, relatórios.

## Perguntas em aberto
Ver a conversa de 16/10/2026 (respostas do Marcus entram aqui).

## Planilha de 2026 carregada (16/10/2026)
Dados reais de Janeiro a Outubro/2026 entram só por `domain/link-pagamento.local.js` (gitignored). Abas do módulo: Solicitações (quadro só do que está em andamento), Histórico (tabela filtrável com paginação), Análises (pago por mês, conversão, bônus do setor por faixas editáveis, rankings, parcelas, bandeira, canal, link/CNPJ, motivos), Comprovantes, Taxas, Meios e Representantes. Campos extras das solicitações importadas: `autorizacao`, `vendaComLink`, `descontado`, `importado`, `mesPlanilha`, `suspeitaDuplicada`, `suspeitaDados`. Pagos sem comprovante marcado na planilha ficam como "pago" (pendentes de comprovante).


## App da revendedora e desconto no acerto (19/10/2026)
- **Pedido:** app da revendedora → Link de pagamento (`mobile/links-pagamento-app.js`, `TelaLinksRev`): valor + 1x a 6x. Cria solicitação (`sol_criar`, canal "app", emissor "atendimento", `semMeio`: a equipe escolhe o link ao gerar se a representante ainda não tiver link vinculado). Representante e data do acerto vêm do cadastro da revendedora.
- **Andamento:** "Meus links" mostra solicitado → link pronto (endereço + copiar quando a equipe colar em `linkUrl`, na ficha da solicitação) → pago; expirado, cancelado, recusado e as situações de erro (negada, antifraude etc.) aparecem em texto simples (`situacaoParaRevendedora`).
- **Acerto da representante:** a calculadora (bloco Vendas e pagamentos, `LinksDoAcerto`) lista os links pagos ainda não usados (`linksParaAcerto`; ignora os importados da planilha). "Usar como pagamento" lança linha forma link, descrição = conta do CNPJ do meio, valor = o menor entre o link e o que falta, marcada `jaPagoLink` e `linkSolId`. Ao registrar o acerto o reducer marca a solicitação (`acertoId`, `usadoEm`, `usadoValor`, `excedente`; `usarLinksNoAcerto`) e ela não aparece de novo. Pago no próprio dia aparece mas só conta no próximo acerto.
- **Falta:** botão dentro da venda; Atendimento Sorelly (acerto interno); crédito do excedente para o próximo acerto/peças; o Consolidado do Financeiro segue como estava.

## Maquininhas por máquina (19/10/2026)
Cada maquininha física é um meio (banco, CNPJ, aluguel/mês, representante). Sicredi 59: 4 × R$ 60; Sicredi 67 (Axis): 2 × R$ 129; Itaú: 3 × R$ 49 (isenção com R$ 50.000 somados no mês); Bradesco: R$ 150 + R$ 0; Safra: R$ 98,90. Getnet e Cielo são do Valdir (vão para Pagamentos a fornecedores). Serenity antiga segue para Sabrina e Julia G. até o Financeiro dizer a máquina. Taxas de Bradesco, Itaú e Safra: não informadas.
