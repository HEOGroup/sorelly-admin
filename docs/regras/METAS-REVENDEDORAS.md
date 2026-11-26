# Regras: metas das revendedoras, média de vendas e brinde extra (vigentes em 25/11/2026)

Documento ÚNICO e vivo. Só a regra de HOJE. Números oficiais: no código (`domain/metas.js`) e na tela Metas › Regras. Se este texto e o código discordarem, o CÓDIGO vence: corrija este arquivo.
Marcação: **[FEITO]** já no sistema · **[A CONSTRUIR]** decidido, falta construir · **[A CONFIRMAR]** o Marcus não decidiu.
Sem nome de revendedora nem valor individual. Pendências, conflitos e duplicidades: `docs/pendencias/encomendas-e-kits-novos.local.md`.

Este documento NÃO trata de: meta das funcionárias (cadastro, inadimplência, link de pagamento, produção), meta do agendamento (acertos previstos) e meta de fotos do marketing. Ver seção 8.

## 1. O que é a meta

- Meta da revendedora = quanto ela precisa vender no PRÓXIMO acerto para ganhar um **brinde extra**. O extra SOMA ao brinde que a tabela do acerto já dá (Marcus, 02/11: "são a mais, soma junto com o brinde que ela já teria").
- Origem (02/11/2026): as metas do admin antigo foram descartadas em 16/10. O Marcus pediu metas novas com **percentual sobre a média**, "30 a 50% a mais", e brinde BB e Normal a mais para quem bate. Ele quer **percentual, não valor fixo**.
- A meta vale para o **próximo acerto da condicional aberta principal**, em qualquer data. Quem acerta em dezembro continua com a meta de novembro. **[FEITO]**
- Cada mês tem a sua campanha (`CAMPANHAS` em `domain/metas.js`). Dezembro nasce como cópia de novembro. **[FEITO]**
- Virada de campanha: quem NÃO acertou mantém a meta da campanha anterior. A campanha nova vale só para quem já acertou e para quem recebeu condicional nova. **[FEITO]**

```
Média das 3 últimas vendas (antes do mês) ─► Classe ─► Meta 1 e Meta 2
        ─► Acerto fecha ─► Bateu? ─► Brinde extra (BB e Normal) somado ao brinde do acerto
```

## 2. Quem entra

| Grupo | Regra |
|---|---|
| Entra | Revendedora com condicional de **kit** aberta (2.047 em 02/11/2026) |
| Fica de fora | Quem só tem condicional de expositor (devolução no ano 3000) |
| Fica de fora da média | Funcionárias (quebram a média; filtro "não funcionárias") |
| Revendedora nova | Linha "Kit novo" (nunca vendeu). Quem tem só venda com mais de 12 meses também conta como kit novo **[A CONFIRMAR]** |

- "Revendedora com kit" = condicional de kit aberta nos últimos 90 dias com acerto previsto até 90 dias à frente. Quem preencheu app mas não tem kit ativo não conta, mas não se exclui.

## 3. Média e resultado

- **Média** = as 3 últimas vendas ANTES do mês (regra de 27/10, `docs/negocio/MEDIA-DE-VENDAS.md`). Só venda de mercadoria, sem brinde, troca, indicação e premiação por meta. Vendas do mesmo dia somam. Dia que fecha em R$ 0 não é venda. Só vendas de até 12 meses. **[FEITO]**
- **Resultado** = valor do PRIMEIRO acerto desde o dia 1 do mês da campanha (mesmo dia junto, sem brinde). **[FEITO]**
- "Acertou no mês" conta pela data de faturamento (como hoje) ou pela data do acerto **[A CONFIRMAR]**.
- Situações: Aguardando acerto · Bateu Meta 2 · Bateu Meta 1 · Não bateu.
- A venda do mês só entra na DevMaster quando fecha no "carregar"; por isso a tela mostra "aguardando acerto" até lá.

## 4. Classes, Meta 1 e Meta 2 (campanha de novembro de 2026) **[FEITO]**

| Classe (média de 3 vendas) | Meta 1 | Meta 2 | Aprovada pelo Marcus? |
|---|---|---|---|
| Kit novo (nunca vendeu) | R$ 1.500,00 | R$ 2.000,00 | Sim |
| R$ 0,00 a 599,99 | R$ 1.500,00 | R$ 2.000,00 | Sim |
| R$ 600,00 a 999,99 | R$ 1.500,00 | R$ 2.000,00 | Sim |
| R$ 1.000,00 a 1.499,99 | R$ 1.900,00 | R$ 2.400,00 | Marcada aprovada no código; só a Meta 1 veio do Marcus |
| R$ 1.500,00 a 1.999,99 | R$ 2.500,00 | R$ 3.000,00 | Marcada aprovada no código; só a Meta 1 veio do Marcus |
| R$ 2.000,00 a 2.499,99 | R$ 3.000,00 | R$ 3.700,00 | Meta 1 pedida pelo Marcus; classe ainda provisória |
| R$ 2.500,00 a 2.999,99 | R$ 3.800,00 | R$ 4.500,00 | Provisória |
| R$ 3.000,00 a 3.999,99 | R$ 4.800,00 | R$ 5.800,00 | Provisória |
| R$ 4.000,00 a 4.999,99 | R$ 6.000,00 | R$ 7.200,00 | Provisória |
| R$ 5.000,00 a 6.999,99 | R$ 8.500,00 | R$ 10.000,00 | Provisória |
| R$ 7.000,00 ou mais | Meta individual: média + 20% | média + 40% | Provisória |

- Nenhuma meta fica abaixo de R$ 1.500,00 (Meta 1) e R$ 2.000,00 (Meta 2). Meta arredondada para cima em R$ 100,00.
- Metas de 1.000 a 3.000 subidas em 02/11 a pedido do Marcus (Meta 1: 1.900, 2.500, 3.000). Todas as Meta 2 e o +20% / +40% foram **escolha do Claude, a confirmar com o Marcus**. As classes de R$ 2.500,00 em diante também são provisórias.
- O Marcus editou o patamar baixo em 02/11: "quem vende abaixo de 1.000 vai ser todos 1.500 e 2.000". Os kits novos são "muito folgados": por isso meta mínima alta.
- Classe sem meta definida: o código calcula topo da faixa + percentual (`pct1` 20% e `pct2` 40%), arredondado para cima em R$ 100,00.

## 5. Brinde extra (BB e Normal) **[FEITO]**

- **Brinde extra = soma ao brinde da tabela do acerto.** Só vale para quem bate a meta.
- Valores do extra: **sempre R$ 4,00 a menos** que um valor de brinde da Sorelly, para a revendedora sempre pagar a diferença. A Sorelly não trabalha com valor fechado.
- Valores de brinde da Sorelly: 68, 88, 96, 112, 122, 128, 132, 144, 168, 188, 212, 232, 242, 262, 282, 312, 322, 368 e 422. Extras permitidos: 64, 84, 92, 108, 118, 124, 128, 140, 164, 184, 208, 228, 238, 258, 278, 308, 318, 364 e 418. Acima de R$ 418,00 fica R$ 418,00.
- Extra padrão (reta entre dois pontos): Meta de **R$ 1.500,00** = BB **R$ 124,00** e Normal **R$ 92,00**. Meta de **R$ 2.000,00** = BB **R$ 164,00** e Normal **R$ 118,00**. Entre os dois e acima, o extra cresce em linha reta e cai no valor permitido mais próximo.
- O Marcus edita metas e extras na tela **Regras › Editar** (grava no módulo `metas`). Não há valor de meta dentro de tela.
- A etapa do brinde extra é uma coluna na tela Revendedoras (só a diretoria grava). Quem da supervisão do acerto pode mudar a etapa **[A CONFIRMAR]**.
- Ligar o brinde extra à Calculadora de acertos e ao app da representante, e mandar o custo ao Financeiro **[A CONSTRUIR]**.

## 6. Telas **[FEITO]**
| Tela | O que faz |
|---|---|
| Revendedoras | Tabela com filtro na coluna (igual Google Planilhas). Média tem botão + para abrir as 3 vendas anteriores. Blocos no topo: quantas em cada classe, quantas acertaram, bateram, não bateram. Seletor de mês |
| Acompanhamento | Progresso do mês |
| Brindes | Kanban do brinde extra |
| Histórico | Compara com o admin antigo (ago a out/2026: 3.932 participantes, 3.588 acertaram, 545 bateram) |
| Regras | Tabela das metas e brindes por classe, com divisor Meta 1 (extra BB, extra Normal) e Meta 2. Botão Editar. Sem estado. Sem aba Campanha |
| Notificações | Celular iPhone 15 com duas visões: Notificação e Minha Meta. 18 textos. Medidor de letras |

- Quem vê: só a Diretoria por enquanto. A supervisão do acerto verá Revendedoras e Brindes; a representante só as dela **[A CONFIRMAR]**.
- Tela de Campanha (escolher a campanha a ver, mudar mês a mês sem código) **[A CONSTRUIR]**. A tela mostra só novembro.

## 7. App da revendedora **[A CONSTRUIR; depende do Leonardo]**
- Aba **Minha Meta** brilhando no app. Notificações: **3 por dia**, textos curtos com copy profissional (PNL), com mensagens para "falta pouco para bater a meta".
- O admin só lê as metas (`/api/metas`). O envio do push e a rota de admin com o vendido em tempo real são do Leonardo.
- A "meta de R$ 300,00" com barra de progresso do app foi retirada (19/10).

## 8. Outras "metas" (não são esta regra)

| Meta | Onde fica |
|---|---|
| Meta de acertos do agendamento (previsto do mês, 94/95/96% e 97%): acertos que o Marcus adia para 45/60 dias SAEM do previsto | `docs/regras/FATURAMENTO-E-PREVISAO.md` |
| Meta da funcionária (cadastro, inadimplência, link de pagamento, produção) | Financeiro › Comissões e `docs/setores/rh` |
| Meta do kit novo de **R$ 7.000,00** | É a **média de referência para a equipe montar o kit novo**. Não é bug nem valor por revendedora (Marcus, 03/11) |
| Mínimo de venda para renovar kit (R$ 500,00 representante; R$ 700,00 atendimento interno) | `docs/regras/REPRESENTANTES-E-COMISSOES.md`, seção 4.1 |
| Mínimo para acerto adiado de 45 e 60 dias (R$ 750 / R$ 1.000 representante; R$ 1.000 / R$ 1.500 Sorelly) | Idem, **[A CONSTRUIR]** |
| Premiação do mês (Top 10) | `docs/regras/KITS-NOVOS-E-INDICACOES.md`, seção 9 |

## 9. Onde está cada regra no código
`src/apps/montagem/domain/metas.js` (classes, brinde, situação) · `src/server/metas.js` e rota `/api/metas/revendedoras` (lê DevMaster e banco, só leitura) · `pages/MetasRevendedoras.js`, `MetasAcompanhamento.js`, `MetasBrindes.js`, `MetasHistorico.js`, `MetasRegras.js` · protótipos `docs/ideias/metas-tela-1.html` e `docs/ideias/metas-notificacoes-app.html`.
