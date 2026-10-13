# Sorelly · Fluxo da empresa, pessoas e acessos

Documento vivo, escrito a partir do que o Marcus explicou em 07 e 08/10/2026. É a fonte para o RH, os Acessos e o Fluxo da empresa (Diretoria).
Itens marcados **(a confirmar)** ainda não foram decididos: perguntar ao Marcus antes de implementar.

## 1. Pessoas (fonte: `src/apps/montagem/domain/pessoas.js`)
- **Total da operação: 78 pessoas** = 70 funcionários (CLT) + 5 sócios e família + 3 PJ. As **24 representantes** ficam à parte (4 delas também são funcionárias: Ana Maria, Nayale, Rayssa e Thalita, contadas só como funcionárias, então 20 no total de representantes).
- CNPJs (todos do mesmo grupo; o CNPJ não entra na regra de acesso): 34 Sorelly Atacadista, 46 Mayz, 59 Serenity, 67 Axis, mais H&O Apps (PJs de desenvolvimento). Contagem: 14 / 30 / 17 / 13 / 2 H&O / 2 a informar.
- **Sócios e família:** Anamaria Hess de Oliveira (mãe, CNPJ 34), Marcus Vinicius Hess de Oliveira (dono, 46), Marco Antonio de Oliveira (pai, 59), Lucas Oliveira da Rocha (primo e sócio, 67), Ana Beatriz Hess de Oliveira (irmã).
- **PJ:** Leonardo e Juan (desenvolvedores, H&O Apps) e Diego Franco (gestor de tráfego).
- Setores e quantas pessoas: Agendamento 3 · Atendimento de kits 9 · Bipagem 2 · Cadastro de peças 2 · Cadastro de revendedoras 2 · Compras 1 · Condicionais 1 · Encomendas 3 · Equipe direção 3 · Facilities 3 · Financeiro 2 · Inadimplência 2 · Kits novos e indicação 1 · Marketing 3 · Montagem de kits 10 · Produção 17 · Representante 1 · RH 2 · SAC 1 · Trocas 2 · Sócios e família 5 · PJ 3.
- CPF só a diretoria e a Anamaria veem. Faltam: CPF e CNPJ das representantes, CNPJ da Ana Beatriz e do Diego, sobrenome do Leonardo e do Juan.
- Quem é quem: **Atendimento de kits** (9) atende as clientes que vão à empresa e também bipa os kits enviados, por isso também está na bipagem. **Leci** só atende as clientes na empresa e, depois que bipam, ajuda a escolher as peças do kit novo. **Jordana** é Produção, não montadora. **Gabrielly** é bipagem. **Michele** é Kits novos e Indicação. **Hellen** (Compras) cuida do link de pagamento. **Rayssa e Graziella** são Cadastro de peças. **Condicionais:** Majorry (antes Gabi). **Tio João** (João Guilherme, Facilities) leva as reposições das revendedoras durante o mês.

## 2. Acessos (RH → Acessos por setor; `navigation/perfis.js`, `domain/equipe.js`)
- Acesso é por **setor**, nunca por pessoa. Quem mexe na tela de Acessos: Marcus, Nickolas, Lucas e Anamaria.
- **Sócios (acesso total e fixo):** Marcus, Anamaria, Lucas.
- **Direção e família (tudo, menos os Configuradores):** Nickolas, Marco Antonio (pai), Ana Beatriz (irmã). Editável.
- **Supervisão da montagem:** Deysiane, como era (tudo, mas sem o Fluxo da empresa). Editável.
- **Agendamento** (Ana Maria, Mariana, Tamara): Consolidado das representantes e Inadimplência. NÃO acessam Comissões. Só quantidades, sem valores totais.
- **Financeiro** (só a Nayale): Consolidado, Placar, Comissões, Inadimplência. **Valores das Comissões: só a diretoria e o financeiro.**
- **Inadimplência** (Amanda de Miranda): só Inadimplência e Compras de joias das representantes, por enquanto.
- **Bipagem e atendimento** (inclui a Leci): Listagens, Atendimento Sorelly, App da bipagem, Consolidado. **Montadoras:** App da montagem e Listagens, e o resultado mensal delas.
- **Representantes (24):** App delas; no admin só o Consolidado, as Comissões e as Listagens **delas mesmas**. Falta login (CPF e CNPJ virão depois). Hoje só o acesso à tela existe, o filtro "só os dados dela" ainda não.
- Dentro de uma mesma tela cada setor pode ver partes diferentes. Já existe no Consolidado e nas Comissões: ver totais em dinheiro/placar/exportar, conferir recebimento, conciliar pagamentos e configurar comissões. Outras telas (Listagens, Inadimplência…) ainda a definir.

## 3. Comissionamento (planejado, nada integrado)
- **Todo mundo pode ser comissionado** pelas atividades (bipar retorno, atender, montar etc.). Quem tem comissão em dois lugares **soma**. Valores no Configurador, nunca dentro de tela.
- **Atendimento interno:** quem atende (Leci e as meninas da produção que ajudam) e quem bipa recebe bonificação por atendimento, igual à lógica da montagem de kits. Quem atende muda sempre: quem quiser atender entra no comissionamento (sistema flexível). Valores: **(a confirmar)**.
- **Bipagem de retorno** é um setor difícil (chegam 20, 30, 50 kits quase juntos e acumulam). Todas as meninas que bipam retorno entram no comissionamento. Valor por kit retornado bipado: **(a confirmar)**.
- **Aba Diretoria → Comissões e desempenho:** escolhe o setor e vê cada pessoa (o que fez, tempo, nota, valor a receber). A Deysiane vê só as funcionárias dela. Sócios e financeiro veem todos. As comissões que já existem (representantes, montagem) entram aqui sem sair de onde estão. Hoje é só "em breve".

## 4. Atendimento interno: métricas e avaliação (planejado)
- O relógio mede cada etapa: a funcionária bipa o acerto (~20 min) e clica "terminei de bipar", o que **começa o atendimento de montagem do kit**; a revendedora é acompanhada pela Leci ou por quem ajuda; na volta, a funcionária clica para **bipar o kit novo**. Fica registrado quem bipou, quem atendeu, o tempo de cada etapa e a venda.
- A revendedora recebe uma **notificação de avaliação** com duas notas de 1 a 5: de quem bipou o acerto e de quem atendeu. As notas aparecem no Consolidado do atendimento interno.
- Motivo: ninguém quer atender (cansativo, muitas revendedoras), então precisa medir, avaliar e pagar.

## 5. Fluxo geral da empresa
Marketing (artes, conteúdo e **tráfego pago com o Diego**) gera **leads** (vêm do tráfego pago) → **Cadastro de revendedoras** → **Michele (Kits novos)**. A Michele encaminha o kit novo de **dois jeitos**:
- para uma **representante**, que coloca na listagem dela, ou
- para o **Agendamento**, que marca a data para a revendedora vir à empresa.

Daí seguem os caminhos abaixo. O fluxo é infinito: o **Cadastro de peças** libera peças para a **Produção**, que abastece a **Montagem**, e tudo recomeça.

### Fluxo A · Kit novo
Michele gera o kit novo → montagem e bipagem (**kit novo NÃO pega condicionais**) → entrega (na empresa ou em casa) → quando retorna à empresa ou finaliza, **devolve a condicional para a menina das condicionais guardar**.

### Fluxo B · Acerto + kit com representante
1. A representante gera a **listagem**.
2. Pega as **condicionais** (app das condicionais).
3. **App da montagem:** montam o kit.
4. **App da bipagem:** bipam o kit.
5. **Retirada** do kit pela representante.
6. **Atendimento / acerto** (na rua, pelo app dela).
7. **Retorno para a empresa**; entrega ao **Agendamento** (Consolidado das representantes).
8. O kit vai para as **bipadoras confirmarem** (quem bipa retorno confere o que a representante bipou: nome, pagamentos, brindes, peças do próximo mês).
9. Ao terminar de bipar, a **condicional é enviada ao Financeiro para faturar**; o Financeiro fatura e **devolve as condicionais ao setor de Condicionais**.
- Desvios: peças de **garantia** dos acertos, depois da bipagem, vão para o setor de **Garantia/Trocas**. Quem **não paga ou falta dinheiro** vai para a **Inadimplência** resolver (o financeiro entra na conciliação).

### Fluxo C · Acerto + kit novo na empresa (atendimento interno)
1. O **Agendamento gera a listagem**.
2. Pega as **condicionais** (antes do acerto interno é preciso pedi-las à menina das condicionais).
3. A revendedora **vai à empresa**; é atendida pela **bipagem** (bipa o acerto).
4. Faz o **novo kit com a Leci** (ou alguém do retorno/produção): escolhe as peças e monta.
5. A condicional do acerto vai para o **Financeiro faturar** (e volta às Condicionais).
- Mesmos desvios do fluxo B: garantia/trocas e inadimplência.

### Condicionais (regra de ouro)
- Kit novo: não precisa pegar condicionais.
- Kit para revendedora que já tem kit (acerto + kit): a menina das condicionais **sempre** entrega as condicionais antes de montar.
- Depois do acerto, as condicionais voltam: Financeiro fatura → devolve às Condicionais, que guarda.

### Encomendas
O setor de Encomendas **separa as peças pelo WhatsApp**, para revendedoras de representantes e para revendedoras internas. As reposições são enviadas **durante o mês (com o tio João)** ou separadas para o acerto delas. Reposição NÃO é oferecida às revendedoras por ora (regra já existente).

## 6. Fluxograma (Diretoria → Fluxo da empresa, `pages/FluxoEmpresa.js`)
- **Já existe a v3 (08/10/2026):** estilo TradingView (grade de fundo, zoom pela roda do mouse no ponto do cursor, arrastar, −, +, Ajustar, tela cheia com Esc). 5 modos no topo: **Fluxo geral** (mapa de todos os setores) e 4 fluxos passo a passo em fila numerada de INÍCIO a FIM, com a **Revendedora** dentro: **Kit novo · representante**, **Kit novo · na empresa**, **Acerto + kit · representante**, **Acerto + kit · na empresa**. O número da etapa fica no canto do bloco; cada bloco diz o que acontece na etapa; desvios (G garantia, $ inadimplência, E encomendas, P produção, C cadastro de peças) aparecem numa faixa embaixo, ligados à etapa pela letra. Uma bolinha só por seta. Falta: setas dos setores de apoio no geral, números ao vivo.
- **Kit novo · representante (como o Marcus descreveu em 08/10):** Michele → representante (listagem) → PARA NAS CONDICIONAIS → montagem e bipagem → volta para a representante, que entrega à revendedora → devolve ao Agendamento → a condicional volta para a menina guardar. **Kit novo · na empresa:** Michele → Agendamento (marca o dia) → revendedora vai à empresa → bipagem/Leci fazem o kit → montagem → revendedora leva. (a confirmar: antes ele tinha dito que kit novo não pega condicionais; o fluxo atual segue a última explicação.)
- **Pedidos do Marcus (08/10/2026) a fazer:** (1) botões no topo para escolher o que mostrar: **Fluxo geral**, **Kit novo**, **Acerto + kit com representante** e **Acerto + kit na empresa**, cada um com as etapas numeradas e os setores do caminho; (2) incluir os setores que faltam no fluxo (Condicionais, Encomendas, Garantia/Trocas, Inadimplência, RH e os demais); (3) bloco **Leads** dizer que vem do tráfego pago com o Diego; (4) corrigir textos que saem dos blocos; (5) corrigir o botão **Tela cheia** (não funciona); (6) mais avançado visualmente. Objetivo: mapear a empresa.
- **Futuro:** bonequinhos andando (estilo simulador, visão isométrica), planta real da Sorelly (o Marcus manda o layout), números ao vivo por setor (filas, gargalos, alertas), pacote de arte isométrica. Ideia anterior de visão isométrica foi descartada por ora, em favor de blocos.

## 7. Dados de demonstração
Só 4 representantes (Dayanne, Lysie, Jessica, Thalita), cada uma com 10 revendedoras: 5 acertos feitos, 3 a realizar e 2 kits novos (20 / 12 / 8). Marcus Hess, Priscila, Rosana e as demais saíram. Versões salvas: `VERSAO_DEMO` 12, `VERSAO_LISTAGENS` 9, `VERSAO_REPS` 2 (`state/store.js`). Depois de testar, limpar `sorelly_montagem_v9` do localStorage.

## 8. Pendências abertas
1. Representantes só com os dados delas (precisa de login: CPF e CNPJ virão do Marcus).
2. Valores das bonificações (atendimento, bipagem de retorno) e se haverá adicional por nota alta.
3. Quem atende no atendimento interno (lista flexível); tela própria da Leci, se necessária.
4. Nome do setor das peças com defeito: Garantia ou Trocas **(a confirmar)**; Garantia & Pós-venda e Trocas existem no menu.
5. Outras telas com "ver partes diferentes por setor" (Listagens, Inadimplência…).
6. Números ao vivo no fluxograma e a aba Comissões e desempenho.

## 9. Líderes de cada setor (08/10/2026) e bloco do fluxograma
- **Líderes:** Marketing = Julia · Leads/tráfego pago = Diego · Cadastro de revendedoras = Nickolas · Kits novos = Nickolas · Representantes = Marcus · Agendamento = Ana Maria · Encomendas = Agatha · Condicionais = Majorry (Maju) · **Montagem de kits** e **Bipagem de kits** (dois setores separados) = Deysiane · Produção = Deysiane · Bipagem de retorno = Deysiane · Cadastro de peças = Rayssa · Garantia = Marcus · Inadimplência = Amanda · RH = Maria Claudia · Compras = Nickolas · SAC = Marcus · Facilities = Marco Antonio · Tecnologia = Marcus.
- **Líder ainda a definir:** Atendimento Sorelly e Financeiro (a tela mostra "a definir").
- **Bloco robusto do fluxograma (aprovado):** cartão 3D na cor do setor; ícone em relevo; "ETAPA n" (ou "SETOR" no mapa geral); nome; resumo do setor; bonequinhos = quantidade REAL de pessoas (até 8 numa fileira; acima disso 2 fileiras iguais e, se sobra um, ele fica à direita, entre as duas fileiras) com a quantidade grande ao lado; faixa do líder; barra "No sistema" (% pronto) por último. Zoom afastado = versão compacta (nome, quantidade, líder, progresso); clicar abre embaixo, na mesma cor, as telas do setor com status (pronto, quase pronto, a trazer, em breve) e os nomes. Fundo com grade mais clara; setas longas entre os blocos.
- Progresso e telas de cada setor ficam em `TELAS` dentro de `pages/FluxoEmpresa.js` (manter em dia com `navigation/setores.js`; o Consolidado das representantes está "quase pronto", 90%).
- Quem bipa o retorno (bloco Bipagem de retorno): bipagem de kits (Bipagem + Atendimento de kits), cadastro de revendedoras, Michele, Helen e Rayssa.

## 10. Fluxos do fluxograma e regras da tela (08/10/2026)
- Seletor "Fluxo:" dentro do mapa, com 6 opções: **Fluxo geral** · **Kit novo · interno + representante** (um bloco só, com bifurcação depois da Michele: A pela representante, B na empresa) · **Representante · kit novo** · **Representante · acerto + kit** · **Interno · kit novo** · **Interno · acerto + kit**.
- Nome do fluxo e resumo ficam **fixos no alto** da tela (não mudam com o zoom); os blocos abrem centralizados.
- **Uma bolinha por fluxo** (a bolinha anda por todas as setas do caminho, em ordem). No kit novo com bifurcação são duas (uma por ramo).
- Mapa geral: 5 faixas numeradas, espaço de altura maior entre elas para as setas não ficarem coladas; selo "COMEÇA AQUI" no Marketing.
- Fluxos passo a passo leem da esquerda para a direita, com números nos cantos (1, 2, 3… e A1, B1… no kit novo com bifurcação), selos COMEÇA AQUI / FIM e letras dos desvios (E, P, C, G, $).
- A lista de etapas à direita fecha com o × (botão "Etapas" reabre). Resumido/Ver completo é um botão da barra do mapa; o padrão é sempre o bloco completo.
