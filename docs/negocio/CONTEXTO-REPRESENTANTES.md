# Contexto completo: representantes, comissões, Consolidado e placar de desempenho

Documento de passagem para iniciar uma nova conversa. Escrito em 06/10/2026, ao fim de uma sessão longa.
**Regra desta conversa nova:** o Marcus pediu para NÃO executar o placar ainda (só planejamento). O resto do sistema descrito aqui JÁ está feito e testado.

---

## 1. Como trabalhar com o Marcus (resumo do CLAUDE.md + o que ele reforçou nesta sessão)
- Responder sempre em **português do Brasil**, linguagem simples, sem jargão (ele é o dono, não programador).
- Perguntas **curtas, poucas por vez (no máximo 3)**, por escrito no chat; nada de blocos de múltipla escolha.
- Ele se irrita quando misturo telas ou faço sem entender. Quando diz "alinhe comigo antes" ou "faça perguntas", NÃO executar: perguntar e esperar.
- Não adicionar nada que ele não pediu. **Menos texto na tela, mais ícones, leitura limpa.**
- Visual: letras brancas (não cinza), tema dourado. Admin: degradê dourado/bronze (o mesmo da tela de Comissões). Apps de celular: cores sólidas, sem degradê berrante; a tela de Comissões do app segue o tom da aba **Listagens** (cartões brancos, borda dourada clara, textos escuros, valores em dourado).
- Cores que ele pediu: nas barras do alto só as LETRAS mudam de cor (fundo normal/bronze); no meio de tabelas não colorir fundo nem letras.
- Dinheiro sempre como `R$ 7.000,00`.
- Depois de testar no navegador: **limpar o localStorage** (`sorelly_montagem_v9`) e não deixar acerto de teste confirmado em revendedora de demonstração.
- Mostrar o sistema rodando em vez de mostrar código. Dev server: `preview_start` com o nome definido em `.claude/launch.json` (abre em http://localhost:5173).
- Estilo de código: telas usam `React.createElement` (`import { e } from "@/shared/react"`), não JSX. Não unificar `apps/montagem/ui` com `apps/kits-novos/ui`.
- Notas técnicas longas e atualizadas estão em `src/apps/montagem/domain/CLAUDE.md` (cada rodada de mudanças foi anotada lá). Ler esse arquivo antes de mexer em comissão/Consolidado.

## 2. Quem é quem (acesso por setor, nunca por pessoa)
- Diretoria: Marcus (id 16), Nickolas (17), Lucas (28). Supervisão da montagem: Deysiane (11, usuário padrão do preview).
- Agendamento: Ana Maria (24, também financeira), Mariana (25), Tamara (26). Financeiro: Nayale (27) e Ana Maria.
- **Botão "Configurar comissões"** (em Comissões): só Marcus, Ana Maria e Nayale (`podeConfigComissao`). Não existe mais tela/menu de Configurador de comissões.
- Agendamento confere: relógio, dinheiro, condicional, peças. Financeiro: concilia pagamentos, divergência, pagamento das comissões, preço da gasolina.
- O agendamento (Mariana, Tamara) não vê valores totais nem contas.

## 3. Telas e rotas (Kits → Representantes)
| Tela | Rota | Arquivo |
|---|---|---|
| App da Representante (celular simulado) | /montagem/app-representante | mobile/representante.js, mobile/comissoes-rep.js |
| Consolidado | /montagem/consolidado-representantes | pages/ConsolidadoRepresentantes.js |
| Comissões | /montagem/comissoes | pages/Comissoes.js |
| Compras de joias (básico) | /montagem/compras-joias-representantes | pages/ComprasJoias.js |
| Regras dos representantes | /montagem/regras-representantes | pages/RegrasRepresentantes.js |
| Regras dos acertos (da revendedora) | /montagem/regras-acertos | pages/RegrasAcertos.js |
| Inadimplência, Configurações (regras do consignado) | já existiam | |
- **Regras separadas em duas telas** (cada uma com botão para a outra): representante (comissão 8% para TODAS, datas, corte 13h, combustível/km, Pix, kit novo, compras) e acertos da revendedora (régua, taxa, remarcação, pagamento e brindes). Quem tem 10% é negociação à parte e NÃO entra nas regras.

## 4. Regras de negócio já decididas

### Comissão da representante
- 8% sobre o valor do acerto recebido (o que está em aberto fica retido). Grupos de pagamento: A (dias 1/11/21) e B (6/16/26). Corte **13h do dia anterior** ao pagamento.
- O atendimento cai no pagamento pela **DATA do atendimento**: "Pagamento 1 · atendimentos 21/09 até 30/09 · pagamento dia 01/10", "Pagamento 2 · 01/10 a 10/10 · dia 11/10", etc. (`remessaPorData`, `janelaDe`).
- Cinco números em todo nível: **Comissão · Pendente · A pagar · Pago · Restante** (Pendente = falta o check do financeiro; A pagar = com check + combustível; Pago inclui Pix direto; Restante = a pagar − pago, pode ficar negativo). Não existe mais "ajuste do fechamento anterior".
- Cada acerto é UMA linha com o valor total; abrindo, cada forma de pagamento tem a **conciliação** (check do próprio financeiro). Linha cinza = agendamento ainda não confirmou o recebimento.
- **Divergência** (botão por forma de pagamento): valor diferente (vale o valor corrigido, comissão e inadimplência recalculadas), conta errada (corrige a conta e concilia) ou não identificado (a representante é avisada no app). Os erros ficam em "Erros registrados" de cada representante.
- **Pix representante:** o Pix foi direto para a representante = PAGAMENTO feito a ela, só depende do OK do financeiro, entra em **Pago pelo valor inteiro do Pix**, nunca em Pendente/A pagar; o restante pode ficar negativo. DÚVIDA ABERTA: a comissão de 8% dessa venda hoje NÃO é contada; perguntar ao Marcus se ela ainda deve receber.
- **Acerto com loja** não é pagamento: sem comissão, fica em aberto (vai para Inadimplência).
- **Kit novo:** R$ 20 (R$ 35 com expositor), provisório, só com termo assinado E **condicional assinada** (senão fica pendente). Reposição: comissão fixa.
- Condicional **não aparece para "Acerto + saiu"** (revendedora que saiu não tem condicional).

### Combustível
- A **representante** informa, no app, só o **km TOTAL DO PERÍODO** em cada data de pagamento, até as 13h do dia anterior (não existe mais "dia a dia"). Sem km no prazo: valor fixo R$ 200,00.
- Cálculo: km ÷ **11 km/L** × preço do litro. Ex.: 110 km = 10 L × R$ 6,78 = R$ 67,80.
- Preço = média de revenda da gasolina comum no Paraná (planilha semanal da ANP, "Preços médios semanais"). Quem paga atualiza num bloco **"Gasolina PR (ANP)"** em Comissões (fechado por padrão; mostra o último valor, quem e quando; "Atualizações" abre as instruções, o campo e o histórico). Um valor único, não por data. Aviso amarelo se estiver desatualizado.
- Admin só mostra o km enviado (o financeiro não digita).

### Taxa de deslocamento, venda zero, multa
- Taxa: **R$ 35 abaixo de R$ 300; R$ 20 de R$ 300 a R$ 499,99; nada a partir de R$ 500** (corrigido de 25 para 20; `SCHEMA_REGRAS` 6 migra versões salvas).
- **Venda R$ 0,00** no app: botão "Não teve venda (R$ 0,00)" (ou digitar 0); a taxa de R$ 35 SOBE. Campo vazio = nada calculado.
- A taxa só conta como paga se o acerto foi quitado; senão fica "não paga" (métrica das representantes; relatório em Comissões).
- **Multa de remarcação/atraso: quem marca é a representante, no app, e ela mesma calcula** (com multa / isenta + motivo). O sistema guarda em `r.remarcacoes`. Os detalhes da regra ficam para depois.
- Calculadora de acertos conferida: faixas, brindes, remarcações e Kit 100% Prata batem com as regras (ver domain/CLAUDE.md).

## 5. Consolidado das representantes (estado atual)
Controle do que entrou; o agendamento confere e dá o OK. A comissão e o check financeiro NÃO aparecem aqui (são de Comissões).

**Topo:** filtros só de **Representantes** e **buscar Revendedora** (com lista de nomes). Status, situação e a faixa de botões foram removidos. Abaixo, **blocos grandes** do resultado do mês até agora: Atendimentos, Acerto + kit, Acerto + saiu, Kit novo, Para conferir, Taxas não pagas e (para quem vê valores) Vendas, Valor do acerto, Valor pago, Inadimplente. Cada bloco mostra o total e as 3 representantes que mais fizeram; clicar abre a lista de TODAS (barra para correr, ~10 visíveis) e clicar numa representante filtra a tabela. Exportar CSV.

**Tabela** (arrastar para o lado: clicar no vazio, segurar e arrastar), cabeçalho em 4 barras no bronze das Comissões:
1. **Agendamento · conferência** (primeiras colunas): relógio (iniciar/terminar conferência; mostra tempo e "+Nd" depois do acerto), Acerto (data/hora pequena), Início, Recebido, Representante, Revendedora, Status (Acerto + kit verde, Acerto + saiu vermelho, Kit novo azul, Reposição âmbar), **Dinheiro · confirmar**, **Condicional · assinatura**, **Brindes e peças**.
2. **Vendas** (6 colunas): Vendas · taxa (azul), Comissão (amarelo, com %), Valor do acerto (violeta), Valor pago (verde), Inadimplente (vermelho), Multa (app) (vermelho).
3. **Pagamentos** (barra neutra, título repetido em 3 partes, abre/fecha por seta redonda dourada; começa fechado): uma coluna POR CONTA, nome curto (só o banco; forma e CNPJ ficam nas barras de cima). Ordem: **CNPJ 34, 46, 59, 67, H&O Apps → Sem faturamento (inclui o Dinheiro) → Família**; no fim Pix representante e Acerto com loja (uma coluna cada, 2 linhas "Pix / representante", "Acerto / com loja"). Cada grupo tem barra de cor VERTICAL em cada ponta (cores: 34 dourado, 46 rosa, 59 turquesa, 67 azul, H&O violeta, Sem faturamento laranja, Família verde-limão). Classificação das contas: `domain/contas-grupos.js` (Itaú PJ Marco e Dinheiro = sem faturamento; maquininhas "P", Pix Point, Devmaster, Pix Representantes também em sem faturamento por palpite que o Marcus não corrigiu). Conta nova sem classificação cai em Sem faturamento.
4. **Peças e brindes** (abre/fecha, começa fechado; é do setor de bipagem de retorno): Desc. crédito; Peças (total, vendidas, trocas, brinde normal, brinde BB, próx. mês, retornadas); Brindes (Normal R$, BB R$, retirado normal, retirado select, excedente). O excedente já soma no que a revendedora deve pagar.

**Escolher UMA revendedora** (campo de busca): abre tudo sozinho, sem setas; Pagamentos só com as colunas preenchidas; peças abertas e o mini bloco de peças já aberto.

**Conferência (agendamento):**
- Relógio: 1º clique inicia, 2º termina (grava data de recebimento). Só termina com o **dinheiro confirmado dos DOIS lados** (empresa "Recebi o dinheiro" + representante no app).
- Dinheiro: a funcionária pode digitar o valor contado; se diferente = divergência (vale o contado, diferença fica em aberto/inadimplência, a representante é avisada).
- Condicional: um botão "Confirmar assinatura" + números das condicionais lado a lado (+ para somar); número verde = assinada, vermelho = sem assinatura; "sem cond." disponível.
- **Mini bloco de peças** (botão "n/N peças"): resumo do acerto + Brindes normal e BB (código e valor) + peças do próximo mês (códigos), com check por peça (`recebimento.pecasOk`), para confirmar uma peça que faltou mas tinha saído como brinde.
- Quem confere sai automático do login (não existe "quem recebeu" nem "entrega").

## 6. App da representante (celular simulado)
- Tela **Comissões**: mesmo visual da aba Listagens. Cartão do mês, "Pagamentos de outubro" com cada "Dia dd/mm" em dropdown (atendimentos do período, linha Comissão + Combustível = A pagar, e UM campo "Km total do período" com prazo). Aviso vermelho quando um pagamento não foi identificado (e no cartão da tela inicial).
- Aba **"Entrega na empresa"** (dentro de Comissões): a representante abre junto com a funcionária e marca "Entreguei o dinheiro" e "Entreguei as condicionais"; vê o que a empresa já marcou e o aviso de divergência.
- Seletor de modalidade compacto "Ouro | 100% Prata" em uma linha.
- Calculadora de acertos: botão "Não teve venda (R$ 0,00)".
- Armadilha: o tema claro do app troca a cor da classe `text-white`; por isso na tela de Comissões do app existe a classe `.cr-b` (em styles/montagem.css).
- Cenas de teste do app: "Conectar como" Dayanne (usuário que tem carteira). Representantes novas ainda NÃO têm listagem/login no app.

## 7. Dados de demonstração e como testar
- Estado salvo em `localStorage` chave **`sorelly_montagem_v9`**. Mudou o seed e não apareceu? Limpar a chave. `VERSAO_DEMO` (domain/acertos-demo.js) está em **7**; subir quando mudar a lista.
- 14 representantes: as 10 do teste do Marcus (Thalita, Viviane, Vanessa, Fabila, Dayanne, Anne, Veridiana, Mayara, Ana Claudia, Lysie) + Jessica, Marcus Hess, Priscila, Rosana. **Veridiana ainda não tem acertos de teste** (só aparece quando tiver). As 8 novas ganharam 4 acertos cada (`ACERTOS_DEMO_3`), com contas de pagamento espalhadas, taxas pagas e não pagas, remarcação com multa e isenta, peças/brindes/próximo mês preenchidos em todos os acertos. Hoje há ~58 atendimentos no mês.
- Dayanne: os 3 primeiros dias (01, 02, 03/10) já vêm conferidos pelo agendamento (dinheiro dos dois lados, condicional assinada, relógio concluído). Os demais ficam cinza/pendentes.
- Roteiros: dinheiro e divergência com **Luciana Prado** (04/10) → depois no App representante (Dayanne) → Comissões → Entrega na empresa; condicional com **Débora Martins** (kit novo); peças com **Letícia Barros**; uma revendedora só com **Nádia Pires** (Pix H&O).

## 8. Pendências e ideias abertas (fora o placar)
- Perguntas já feitas e sem resposta: a comissão do Pix representante (item 4); no app, onde a funcionária e a representante dão os checks (decidido: aba Entrega na empresa).
- Compras de joias: só a versão básica; o Marcus quer melhorar depois (pagamentos dentro da compra; saber se desconta da comissão).
- Integração/backend (Leonardo e devs): hoje tudo vive no navegador de cada pessoa; o app e o admin só conversam quando o sistema estiver online. Origem da gasolina automática, DevMaster (condicionais, vendas por cliente), nota promissória virtual.
- Ideias oferecidas e não pedidas: fixar relógio + revendedora ao arrastar a tabela; botão "só conferência" (esconde tudo menos o Agendamento).
- Criar listagem/login das representantes novas no app.
- Aviso de console antigo (key de lista) em RegrasAcertos.js, sem efeito no uso.

## 9. PLACAR DE DESEMPENHO DAS REPRESENTANTES (assunto atual, só planejamento)

### Objetivo
Classificar o desempenho financeiro e operacional de cada representante (nota 0 a 100). O Marcus quer ajuda para criar as regras.

### Preocupações dele (todas devem ser tratadas)
1. Carteiras de tamanhos muito diferentes (60 a 160+ revendedoras). Exemplo: Veridiana ~160 contra outras ~100. **Tamanho ajuda, mas NÃO pode ser fator decisivo**, e uma carteira de 40–60 também não pode ser melhor só por ser pequena.
2. Vende alto mas tem muita inadimplência × vende menos mas sem inadimplência: o placar precisa mostrar as duas coisas.
3. **Muitos "Acerto + saiu" é problema** (revendedoras saindo).
4. **A nota de avaliação da representante (tela Avaliação das representantes) tem que contar MUITO.**
5. **Multa e taxa são aplicadas pela representante**; quem não aplica por medo (revendedora atrasa e ela não multa; não cobra a taxa) tem que ser PUNIDA. Multa: ela mesma calcula e marca no app (detalhes depois).
6. Não existe o número de revendedoras por representante. Ele virá dos **atendimentos realizados no mês** (no fim de cada mês o sistema sabe quantos cada uma fez). Portanto "tamanho" = atendimentos no mês.

### Proposta de pesos (rascunho para o Marcus aprovar; janela de 3 meses; tudo em proporção, nunca em total)
| Critério | Pontos | Como mede |
|---|---|---|
| Recebe o dinheiro | 25 | % de inadimplência (0% = máximo; perde ~3 pontos a cada 1%; 10% ou mais = zero) |
| Aplica as regras | 20 | 10 pela taxa cobrada (% das taxas pagas) + 10 pela multa aplicada (isenta sem motivo conta como não aplicada) |
| Renovação / saídas | 15 | % de Acerto + kit contra Acerto + saiu; muita saída tira pontos com mais força |
| Avaliação da representante | 15 | nota da tela de avaliação (pontualidade, explicação, WhatsApp; já desconta recusas e dias parados) |
| Giro do kit | 10 | venda ÷ valor do kit, comparada com a média geral (melhor que venda bruta, porque kits têm valores diferentes) |
| Organização | 10 | dias para trazer o kit na empresa (o relógio do Consolidado mede) e divergências de dinheiro |
| Tamanho | 5 | atendimentos realizados (escala logarítmica com teto) — no máximo 5 pontos |
Se o Marcus quiser dar ainda mais peso à avaliação ou às saídas, mexer nesses números (a soma continua 100).

### Proteções
- **Poucos dados:** com menos de ~40 acertos no período, a nota é puxada para a média geral e aparece "poucos dados" (carteira pequena não ganha de graça; grande não ganha só por ser grande).
- Representante nova (primeiros 90 dias) pesa menos.
- Janeiro: caem ~100 revendedoras; comparar com o mesmo mês do ano anterior ou usar nota de contexto.
- Faixas: 85+ Ouro · 70–84 Prata · 50–69 Atenção · abaixo de 50 Crítica.
- Mapa de 2 eixos: venda (alta/baixa) × inadimplência (alta/baixa) → estrela / vende e não recebe (risco) / pequena e segura / crítica.
- Mostrar para a representante "como subir" (ex.: cobrar as 8 taxas abertas = +6 pontos).
- Ligar faixas a consequências (bônus, prioridade nas listagens, plano de ação) e conferir por amostragem, para ela não esconder dados.

### Exemplo ilustrativo (números inventados, 3 meses)
Anne (55 revendedoras): 88 · Thalita (100): 76 · Mayara (42, só 20 acertos, "poucos dados"): 75 · Veridiana (160): 56 · Viviane (100): 39.
Veridiana tem a maior carteira, mas não cobra taxa (55%) e quase não aplica multa (30%): cai para Atenção; se corrigir, sobe uns 13 pontos. Viviane vende bem (giro alto) e não recebe (11% de inadimplência) nem aplica regras. Mayara não passa na frente só por ser pequena.

### Dados que o sistema JÁ tem para alimentar o placar
- Consolidado: status (Acerto + kit / saiu / Kit novo / Reposição), vendas, valor do acerto, valor pago, inadimplente, taxa paga/não paga (`taxaDe`, `relatorioTaxas` em domain/comissoes.js), multa marcada no app (`r.remarcacoes`, `descontoRemarcacao`, `atrasoDias`), relógio de conferência (início/fim → dias para trazer o kit), divergência de dinheiro (`recebimento.din.contado`).
- Avaliação das representantes: `pages/AvalRep.js` e `domain/representantes.js` (`resumoRep`: pontualidade, explicação, WhatsApp, recusas, dias parados, nota final `pontos`, `bonus`, `bloqueada`; escala 1 a 5).
- Faltam: data AGENDADA × data REAL do acerto (para saber quando a multa era devida e avisar "multa devida e não aplicada"), número de revendedoras da carteira (usar atendimentos do mês), % de remarcações isentas por representante.

### Dicas já discutidas (para virar regra depois)
1. Comparar dia agendado com dia real para detectar multa devida e não aplicada.
2. "Isenta de multa" pode virar escape: mostrar a % de isentas por representante e exigir motivo.
3. Mostrar a taxa não cobrada também em reais.
4. Contar muito "Acerto + saiu" (alerta separado, por exemplo saída acima de 25%).
5. Alerta em tempo real para a supervisão: "multa devida e não aplicada".

### Perguntas em aberto para o Marcus (fazer poucas por vez)
1. Quanto pesa a **avaliação** e quanto pesam as **saídas** (os números acima são sugestão)?
2. Qual a regra do atraso (quantos dias geram multa no Kit padrão)? (adiado por ele: "depois entramos em detalhes")
3. O que o placar vai fazer: bonificação, limite de kit ou só acompanhamento?
4. Posso começar por uma versão simples dentro do Consolidado (nota, faixa e o mapa de 2 eixos) e testar com as 10 representantes?

### Próximo passo combinado
Esperar o Marcus dizer "pode executar o placar". Antes disso: só conversar, ajustar pesos e responder dúvidas.
