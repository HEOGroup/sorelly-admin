# Análise do fluxo da representante (01/11/2026)

Pedido do Marcus: comissões zeradas (as representantes ainda não usam o sistema), conferir se o app envia o acerto para o Consolidado e gera a comissão, achar erros e listar o que precisa ser definido. Feito por leitura do código (3 análises em paralelo) e por teste no navegador (app da Dayanne, acerto da Andrielle). Atualizar ao decidir algo.

## 1. O fluxo, ponta a ponta

```
LISTAGEM ► CALCULADORA ► MONTAGEM ► BIPAGEM ► RETIRADA ► ENTREGA DO KIT NOVO ► ACERTO ► CONSOLIDADO ► COMISSÃO
 (rep)     (supervisão)   (montadora) (bipadora) (supervisão  (rep + revendedora)  (rep)    (agendamento)  (financeiro)
                                                  ou rep no app)
Ações:  ADD_KIT   DEFINIR_VALOR  INICIAR_M/    INICIAR_B/   RETIRAR /     KN_ENT_* /        ACERTO_     CONSREP_       COMIS_FIN
        CRIAR_    CONFIRMAR_     CONCLUIR_M    CONCLUIR_B   SOLICITAR_RET KITNOVO_ENTREGAR  REGISTRAR   RECEBER
        LISTAGEM  SUGERIDOS      APROVAR                    RESP_RET
Situação do kit: Aguardando valor ► Na fila ► Montando ► Aguardando bipagem ► Bipado ► Retirado ► Acertado
```

## 2. O que testei (app da Dayanne, acerto da Andrielle)

| Etapa | Resultado |
|---|---|
| Finalizar o acerto no app (assinatura) | Funcionou. Registrou o acerto, o kit virou "Acertado". |
| Consolidado das representantes | Mostrou a linha certa: venda R$ 3.000,00, comissão da faixa 40%, valor do acerto R$ 1.800,00, pago R$ 1.800,00, "aguarda recebimento". |
| Comissões | Total vendido R$ 3.000,00, acerto R$ 1.800,00, pago R$ 1.800,00. Dayanne: comissão R$ 144,00 (8%), **pendente** (falta o check do financeiro). As outras três representantes: R$ 0,00. |
| Zerado | Sem o teste, todas as abas de comissões mostram R$ 0,00. |

## 3. O que mudou no código nesta rodada

| Mudança | Onde |
|---|---|
| 20 acertos e 8 kits novos de demonstração saíram; `VERSAO_DEMO` 15 para 16 | `domain/acertos-demo.js` |
| Cartão da tela inicial do app (Vendido, Acerto, Comissão) vem só dos acertos registrados e do motor de comissões; o valor fictício fixo da Dayanne saiu | `mobile/representante.js` |
| Tela "Regras do acerto" (Informativos) saiu do app da representante: cartão, tela e o aviso que abria sozinho. As regras ficam em "Regras e comissões" (PDF) | `mobile/representante.js` |
| Cores do bloco de pagamento e do kit novo: botões rosa, roxo, laranja e ciano viraram dourado (principal) ou cinza escuro; textos lilás e dourado viraram texto normal | `mobile/representante.js` |
| As 2 vendas anteriores do kit novo não são mais digitadas: vêm do sistema (`kit.vendasAnt`) e aparecem só para leitura | `mobile/representante.js` |
| Dois toques em "Finalizar acerto" não geram dois registros nem comissão em dobro | `state/reducer.js` (`ACERTO_REGISTRAR`) |

## 4. Erros encontrados e ainda NÃO consertados

| # | Erro | Onde | Efeito |
|---|---|---|---|
| 1 | **A fonte das 2 vendas anteriores ainda não está ligada.** O app lê `kit.vendasAnt`, mas a listagem é de demonstração e não traz isso. A rota `/api/revendedoras?rep=` e `ultimasVendasDaMedia()` (`src/server/vendas-brinde.js`) já existem. | `mobile/representante.js`, `state/reducer.js` | Sem histórico, a média usa só a venda de hoje e o kit novo sai liberado por engano |
| 2 | Condicionais do acerto não são baixadas. As mesmas voltam no acerto seguinte | `reducer.js` (`ACERTO_REGISTRAR`), `representante.js` | Condicional conferida reaparece |
| 3 | A entrega do kit novo e o acerto não exigem kit "Retirado". A representante entrega kit "Na fila" e ele pula para "Acertado" | `reducer.js` (`KITNOVO_ENTREGAR`, `KN_ENT_INICIAR`, `ACERTO_REGISTRAR`) | Quebra a cadeia montagem, bipagem, retirada |
| 4 | O estado "Acertado" não existe nas listas de situação. O rótulo fica vazio e o kit some dos filtros. A listagem com kit "Acertado" nunca fecha | `domain/status.js`, `components/fila.js`, `painel-dia.js` | Listagem fica aberta para sempre |
| 5 | Avaliação do kit só lista "Retirado". Depois da entrega o kit vira "Acertado" e a nota some | `representante.js`, `domain/regras.js` | A bipadora deixa de ser avaliada |
| 6 | Acerto perdido em silêncio: se o kit ou a regra não existem, o reducer devolve o estado sem aviso e o app vai para a tela de fechamento mesmo assim | `reducer.js` (`ACERTO_REGISTRAR`) | A representante acha que registrou e não registrou |
| 7 | Tag riscada (R$ 5,00) entra no total a pagar e no Consolidado, mas não no cálculo da dívida e da Inadimplência | `domain/acerto-derivado.js`, `domain/comissoes.js` (`devidoDe`) | Consolidado e Inadimplência divergem |
| 8 | Pagamento feito depois (Inadimplência) cai na janela já fechada, não na remessa seguinte como manda a regra | `domain/comissoes.js` (`remessaPorData`) | Comissão retida entra na data errada |
| 9 | O corte (13h) só vale para o combustível. A remessa ignora o corte | `domain/comissoes.js` | Regra de data confusa |
| 10 | "OK" do agendamento não confere se o dinheiro e a condicional foram confirmados; a trava está só na tela | `reducer.js` (`CONSREP_RECEBER`) | Dá para marcar OK sem conferir |
| 11 | Sem aviso à representante quando o kit é bipado; pedido de retirada sem resposta fica parado sem prazo | `reducer.js` (`SOLICITAR_RET`, `RESP_RET`) | Kit pronto sem ninguém saber |
| 12 | Reducer não confere perfil em RETIRAR, RESP_RET, ACERTO_REGISTRAR, KN_ENT_* e KITNOVO_ENTREGAR (a tela decide) | `state/reducer.js` | Qualquer perfil poderia disparar |
| 13 | Dados fixos de demonstração dentro do app: carteira de revendedoras fictícia, referências inventadas, acerto pronto da Andrielle e da Márcia, código de retirada fixo | `mobile/representante.js` (`CARTEIRA_DEMO`, `refsDe`) | Parece dado real |
| 14 | Escrito pela representante e perdido: "caixinhas de presente" fica só na tela; formulários do acerto ficam só em memória; `historicoDados` (mudança de nome e endereço) ninguém lê | `kn-entrega-rep.js`, `representante.js` | A empresa não vê |
| 15 | Ações sem quem dispare (código morto): `SET_HORA`, `CONF_REV`, `AVAL_REP`, `RETIRAR_KIT`; tela morta `mobile/entrega-kit-novo.js` | `reducer.js` | Revendedora nunca confirma nem avalia a representante |
| 16 | Dado antigo resurge: uma aba aberta com código velho regrava o `localStorage` com os dados de demonstração | `App.js` (salva a cada mudança) | Depois de publicar, recarregar todas as abas e celulares |
| 17 | Documentação velha: `domain/CLAUDE.md` fala em corte de 12h (código usa 13h) e `VERSAO_DEMO` 12 | `domain/CLAUDE.md` | Confunde quem lê |

## 5. O que ainda tem dado de demonstração (não zerei, decisão do Marcus)

| Dado | Onde | Observação |
|---|---|---|
| 12 listagens de hoje e os kits | `domain/seed.js` (`REPS`), `state/store.js` (`VERSAO_LISTAGENS`) | São o que a montagem e a bipagem usam. Zerar apaga o fluxo em andamento. |
| Kits novos N1 a N4 de Dayanne e Lysie | `domain/representantes.js` (`NOVAS0`) | Precisa de migração nova para não apagar os KN reais |
| Avaliações, recusas, virada do mês | `domain/representantes.js` | Alimentam o Placar |
| Histórico de listagens (18) | `domain/seed.js` (`histDemo`) | Aparece no Consolidado dos kits |
| Fila simulada de bipagem (10 retornos) | `state/store.js` (`filaSimulada`) | O Consolidado mostra "4 kits esperando bipagem" |

Não mexer: `s.comis` (percentuais, grupos A/B, gasolina, datas), `s.negPix` (Thalita 100%), kits novos reais `KN*`.

## 6. O que precisa ser definido pelo Marcus

1. De onde vêm as 2 vendas anteriores: DevMaster pela listagem real (`/api/revendedoras?rep=`)? A listagem passa a vir da DevMaster?
2. A listagem tem fechamento ("Enviar listagem do dia", com prazo de 48 h) ou continua kit por kit?
3. A entrega do kit novo e o acerto só podem começar com o kit "Retirado"? O que a representante vê se tentar antes?
4. Estado final do kit depois da entrega: "Acertado" ou "Entregue"? A listagem fecha na retirada ou na entrega?
5. Quem confirma a retirada: a representante no app ou o balcão com código e assinatura? Prazo e o que fazer se ela não responde.
6. A representante é avisada quando o kit fica bipado? Quem avisa quem em cada passo?
7. Avaliação do kit (estrelas e peças faltando) antes ou depois da entrega? A falta da representante e o erro da câmera se somam: dupla contagem?
8. Bipagem do retorno na empresa continua só um OK, ou confere peça a peça contra a condicional?
9. De onde vêm as condicionais reais de cada revendedora (DevMaster) para a conferência com câmera?
10. A revendedora confirma o recebimento e avalia a representante? Hoje não existe tela.
11. Comissão: retida só sobre o valor em aberto ou sobre o acerto inteiro? A promissória bloqueia a comissão? A comissão do atendimento pago por Pix representante some ou conta? Em Acerto + saiu exige promissória?
12. Data de pagamento: pela data do atendimento (código) ou pelo corte de confirmação? Corte 12h ou 13h?
13. Kit novo R$ 20 e R$ 35 e o novo fluxo `nf` (R$ 25 + 2% e 6%): provisórios.
14. Coluna Multa do Consolidado, pesos do Placar e o passo 5 do passo a passo do agendamento: a confirmar.
15. O reducer deve bloquear por perfil, ou só a tela?
16. A tela "Folders e informativos" do admin (`pages/Informativos*`, `domain/informativos.js`) continua? A revendedora e a representante não a usam mais.
