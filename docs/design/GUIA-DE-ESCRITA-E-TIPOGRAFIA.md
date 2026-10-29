# Guia de escrita e tipografia do Sorelly Admin (22/10/2026)

Complemento do `DESIGN-SYSTEM-ESTUDO-COMPLETO.md` (seções 16, 19 e 22). **Tudo aqui é PROPOSTA até o Marcus aprovar.** Serve para todo o sistema, não só o Financeiro. Ler antes de escrever qualquer texto de tela, botão, aviso ou título.

## Fontes consultadas
- Mailchimp Content Style Guide: voz amigável e direta, clareza acima de entretenimento, voz ativa e frases curtas ([styleguide.mailchimp.com](https://styleguide.mailchimp.com/tldr/)). É público, com licença que só pede crédito.
- Atlassian Design System, content standards: voz e tom, desenho da mensagem, maiúsculas, texto de link que faça sentido fora de contexto ([atlassian.design](https://atlassian.design/llms-content.txt)).
- Padrão de maiúsculas em interface: vários sistemas usam "sentence case" (só a primeira letra maiúscula) em botões, links, dicas e estados vazios ([Basis](https://design.basis.com/content-design/mechanics), [Apache Superset](https://superset.apache.org/docs/contributing/style-guide)).
- Escrita em português: consistência de termos (a mesma palavra para a mesma ação), mensagens de erro com tom diferente das de sucesso, guia de estilo com **vocabulário controlado** (termos permitidos e proibidos) e corte de texto desnecessário ([Alura](https://www.alura.com.br/artigos/ux-writing), [UXW101](https://uxw101.substack.com/p/por-dentro-do-guia-de-estilo-o-maior)).
- Fontes para painel: Inter, IBM Plex Sans e Roboto são as mais recomendadas; Source Sans 3 tem o conjunto mais completo de números ([Made Good Designs](https://madegooddesigns.com/best-fonts-for-dashboards/), [Fontalternatives](https://fontalternatives.com/blog/best-fonts-legible-numerals-ui/)). Lacuna: não achei os guias de escrita do Nubank e do Itaú; não achei regra do Polaris sobre texto na busca.

## Parte 1 · Voz e tom do Sorelly Admin
**Quem fala:** o sistema como um colega de trabalho competente e calmo. Não é robô ("Operação efetuada com sucesso"), não é amigo exagerado ("Uhuu, salvou! 🎉").

| Princípio | Quer dizer | Exemplo |
|---|---|---|
| **Direto** | Primeiro o que importa, em frase curta | "Faltam R$ 420.533,10 em outubro." |
| **Claro** | Palavra que a equipe usa; sem jargão de programador | "Salvar", não "Persistir" |
| **Calmo** | Sem exclamação, sem CAIXA ALTA gritando, sem culpar a pessoa | "O valor de 21/10 é menor que o de 20/10." |
| **Útil** | Todo aviso diz o que fazer a seguir | "Confira se digitou o total do mês, não só o do dia." |
| **Consistente** | A mesma palavra para a mesma coisa em todo lugar | Ver vocabulário controlado (Parte 3) |

**Tom por situação:** sucesso curto e neutro ("Lançamento salvo"); erro explica e orienta; atraso/risco é firme sem alarme ("159 contas atrasadas · R$ 336.237,66"); decisão destrutiva é séria e específica ("Reabrir setembro? Os valores voltam a aceitar edição").

## Parte 2 · Regras de escrita
00. **Todo valor em reais leva "R$"** (decisão do Marcus, 22/10/2026), em frase, indicador, tabela e célula: R$ 99.719,05 · −R$ 83.307,03. Isso cancela a regra 6 da Parte 2 e a linha "Dinheiro em tabela" da seção 16 do estudo. Quantidade (acertos) e percentual não levam R$.
0. **Letras brancas, nunca cinza, e nada de nota avulsa (regra do Marcus, 22/10/2026).** Não escrever frases pequenas em cinza debaixo de número ou de título ("pior dia 06/10", "1.176 acertos · média 789,96", "Atualizado em…"). Indicador é rótulo + valor, compacto, sem espaço vazio. Informação que importa vira outro indicador ou uma coluna; a que não importa some. Isso vale também para a Parte 4 (a linha "Subtexto de indicador" fica cancelada).
1. **Maiúsculas:** só a primeira letra da frase e nomes próprios. Vale para título, botão, aba, coluna e menu. Nada de "Contas A Pagar".
   - Exceção: rótulo de coluna e nome de indicador aparecem em caixa alta por **estilo** (CSS), mas escritos normalmente no texto.
2. **Botão é verbo + objeto, no infinitivo:** "Lançar dia", "Exportar planilha", "Marcar como pago", "Copiar mensagem". Proibido: "OK", "Enviar", "Clique aqui", "Confirmar" sozinho.
3. **Título diz o assunto; subtítulo diz o que há ou o que fazer.** Título: "Contas a pagar". Subtítulo: "Outubro/2026 · 987 títulos". O subtítulo nunca repete o título.
4. **Uma ideia por frase,** até 20 palavras. Voz ativa: "O sistema fecha o mês" e não "O mês é fechado pelo sistema".
5. **Rótulo de coluna e de indicador: uma ou duas palavras.** "Recebido", "Pago", "Saldo do dia", "Falta". Nunca frase ("O que ainda falta ser pago").
6. **Números, datas e dinheiro:** seguem a seção 16 do estudo (R$ 7.000,00 em frase; 7.000,00 em tabela com "R$" no cabeçalho; dd/mm; sinal de menos −).
7. **Sem pontuação final** em título, rótulo, botão, aba e item de menu. Com ponto final em frase completa (subtítulo, erro, aviso).
8. **Sem exclamação** e sem emoji em tela de trabalho (emoji só no SorellyChat).
9. **Sem "você" repetido e sem "nós".** Escreva a ação: "Lance o primeiro dia" ou "Lançar primeiro dia".
10. **Siglas:** só as que a equipe já fala (CNPJ, Pix, DRE, NF). Na primeira vez da tela, escreva por extenso se não for do dia a dia.
11. **Link com sentido:** "Abrir contas atrasadas", não "Clique aqui" nem "Saiba mais".
12. **Tooltip complementa, nunca é a única explicação.** No celular não existe hover.
13. **Texto cabe.** Se o texto não cabe no campo, o texto encurta; o campo não estoura nem corta (regra fixa de 21/10).
14. **Sem repetição de palavra na mesma linha.** Se o bloco chama "Contas a pagar", as colunas não repetem "contas".

## Parte 3 · Vocabulário controlado (termos oficiais)
Lista completa na seção 19 do estudo; aqui o essencial, em duas colunas: usar × proibido.

| Use | Não use | Quando |
|---|---|---|
| Recebido | Faturado, Entrada, Vendido | Dinheiro que entrou. "Faturado" só em contexto de nota fiscal |
| Pago | Saída, Baixado, Liquidado | Dinheiro que saiu |
| A pagar / Falta | Pendente, Em aberto (quando for dívida da Sorelly) | O que ainda vai sair |
| Atrasada | Vencida, Em atraso | Conta que passou do vencimento e não foi paga; uma palavra só no sistema todo |
| Saldo das contas | Caixa, Posição bancária | Dinheiro nos bancos |
| Disponível | Saldo com limite | Saldo das contas + cheque especial |
| Cheque especial | Limite, Crédito | Limite liberado pelos bancos |
| **Tamanho** (do anel) | **Aro**, numeração | REGRA FIXA do Marcus (28/10/2026): no sistema inteiro, em toda tela, mensagem, relatório e documento, o anel tem "tamanho" (ex.: tamanho 16), nunca "aro". Vale para texto novo e antigo |
| Banhado | Folheado | Nome atual da peça (Marcus, 27/10/2026): folheado e banhado são a mesma coisa; escrever "banhado" |
| Cravejado | Zircônia, micro zircônia (como categoria) | Cravejado é o termo geral; a pedra é a zircônia (Marcus, 27/10/2026) |
| Acertos feitos / Previstos | Realizados, Fechados | "Realizados" só como "realizados esperados" na previsão |
| Previsão | Projeção, Estimativa | Qualquer valor que ainda não aconteceu |
| Fechado 🔒 | Travado, Consolidado | Mês que não edita |
| Lançar | Digitar, Inserir, Cadastrar (valor) | Registrar um valor do dia |
| Dívida / Enviado / Falta | Frases ("O que é devido…") | Tabelas de prestador (regra fixa de 21/10) |
| Representante / Revendedora | Vendedora, Parceira | Cada uma no seu papel |
| Setor (lateral), Área (topo), Aba | Módulo, Seção | Hierarquia do menu |

**Regra de manutenção:** palavra nova entra nesta lista antes de entrar na tela. Duas palavras para a mesma coisa = a segunda é proibida.

## Parte 4 · Como escrever cada peça (modelos)
| Peça | Modelo | Exemplo bom | Exemplo ruim |
|---|---|---|---|
| Título de tela | Substantivo | Contas a pagar | Aqui você vê as contas a pagar |
| Subtítulo | Período · quantidade | Outubro/2026 · 987 títulos | Lista de títulos do mês |
| Indicador (rótulo) | 1 ou 2 palavras | Falta pagar | O que ainda falta ser pago |
| Subtexto de indicador | A conta já feita | 27,8% do mês | (vazio) |
| Cabeçalho de coluna | 1 ou 2 palavras | Saldo do dia | Valor do saldo diário |
| Botão principal | Verbo + objeto | Lançar dia | Enviar |
| Botão secundário | Verbo | Cancelar | Voltar sem salvar |
| Aba | Substantivo | Dia a dia | Visualização diária |
| Toast de sucesso | Objeto + particípio | Lançamento salvo | Operação realizada com sucesso! |
| Erro | O que houve. Como resolver. | O valor de 21/10 é menor que o de 20/10. Confira se digitou o total do mês. | Erro: valor inválido |
| Estado vazio | O que vai aparecer + como começar | Nenhuma conta lançada em outubro. Lance o primeiro dia em Por dia. | Nada aqui |
| Confirmação destrutiva | Pergunta com a ação; botão repete a ação | "Reabrir setembro?" · botão "Reabrir setembro" | "Tem certeza?" · "Sim" |
| Estado (badge) | Uma palavra | Pago · Atrasada · Fechado | Situação: concluído com êxito |
| Tooltip | 1 frase que complementa | Recebido dividido pelos acertos feitos | (repete o rótulo) |
| Mensagem copiada (WhatsApp) | Curta, formato do grupo, *negrito* nos valores | (formato 68 Gang) | Texto longo sem destaque |

## Parte 5 · Antes e depois com textos reais do sistema
| Hoje | Padrão proposto | Por quê |
|---|---|---|
| "Previsão do mês · escolha quantos % dos acertos previstos" | "Previsão" com seletor 96 / 97 / 98% | Rótulo curto; o seletor explica a si mesmo |
| "Esses 2 números só editam em Agendamento → Painel dos acertos." | "Editar no Agendamento" (link) | Link com ação, não frase explicativa |
| "Escolha ver só o faturamento, só as contas, ou os dois juntos para achar os dias de déficit" | "Dia a dia" + segmented "Faturamento · Contas · Vs" | O controle diz o que faz |
| "Vencidas e ainda não pagas: R$ 336.237,66 (ficam fora do saldo dos dias abaixo)" | "Atrasadas R$ 336.237,66" no indicador; a nota some | Uma palavra por conceito; nota desnecessária |
| "R$ 1.067.118,19" repetido em 20 células | Coluna "Pago" com valores sem R$ | Unidade uma vez |
| "Faturamento & contas a pagar" / "Análise de custos" / "Contas a pagar" | Um nome: "Contas a pagar"; "Por natureza" é aba | Um nome, um lugar |
| "O que é devido / O que foi enviado / Combinado (tudo que é devido)" | Dívida · Enviado · Falta | Regra fixa de 21/10 |
| "Operação realizada com sucesso" | "Lançamento salvo" | Direto |

## Parte 6 · Tipografia
### O que o sistema usa hoje
- Texto: **Geist** (`--font-sans`).
- Títulos e números: **JetBrains Mono** (`--font-heading` e `--font-mono`).
- Problema: título em fonte monoespaçada parece "código", cansa em frase longa e deixa os títulos largos. Mono é ótimo para número, ruim para título.

### Recomendação
1. **Títulos e texto: uma sans-serif só** (a mesma do corpo), em peso 600 nos títulos. Mono sai dos títulos.
2. **Números de tabela e indicador: algarismos tabulares** (`font-variant-numeric: tabular-nums`), na própria sans se ela tiver, ou na mono. O que importa é as colunas alinharem.
3. **Escolha da família (a decidir com teste visual):**
   - **Inter:** a mais recomendada para painel, desenhada para tela; números tabulares ativáveis.
   - **IBM Plex Sans:** visual mais corporativo e distingue bem 0/O e 1/l/I em tamanho pequeno; par natural da Plex Mono.
   - **Roboto:** neutra e familiar, com Roboto Mono.
   - **Geist (atual):** limpa e moderna; não apareceu nas fontes de comparação, então precisa ser testada (tabulares e legibilidade a 12 px) antes de manter.
   - Plano: montar uma página com a mesma tabela real nas quatro fontes (claro e escuro, 13 e 14 px) e o Marcus escolhe olhando.
4. **Escala fixa (já no estudo):** 26 título de tela, 18 título de bloco, 14 corpo e tabela, 16 texto corrido, 11 rótulo em caixa alta.
5. **Pesos:** 400 corpo, 500 ênfase, 600 título e total. Nada de 700/800 no tema escuro.
6. **Altura de linha:** 1,5 texto corrido; 1,3 tabela e botão; 1,2 título.
7. **Caixa alta só em rótulo curto** (cabeçalho de coluna e nome de indicador), com espaçamento entre letras de 0,06 em.
8. **Nunca** itálico em dado, nunca sublinhado fora de link, nunca texto justificado.
9. **Tamanho mínimo 12 px** (rótulo auxiliar); 14 px no corpo; no celular o corpo não passa abaixo de 14 px.

## Parte 7 · Checklist de texto (antes de entregar)
- [ ] Título é substantivo e subtítulo não o repete?
- [ ] Todo botão é verbo + objeto?
- [ ] Rótulos de coluna e indicador têm no máximo duas palavras?
- [ ] Nenhuma palavra fora do vocabulário controlado? Nenhuma palavra repetida com outro sentido?
- [ ] "R$" só uma vez por coluna? Negativo com −?
- [ ] Erro diz o que houve **e** como resolver?
- [ ] Estado vazio explica e convida?
- [ ] Sem exclamação, emoji e "sucesso"?
- [ ] O texto cabe em todos os tamanhos de tela (400 px)?
- [ ] Tooltip só complementa?

## Decisões que dependem do Marcus
1. Aprova a voz (direta, calma, útil) e as 14 regras de escrita?
2. Aprova o vocabulário controlado da Parte 3 (inclusive "Atrasada" como única palavra para conta vencida e não paga)?
3. Mono sai dos títulos? Quer ver o teste das 4 fontes (Geist, Inter, IBM Plex Sans, Roboto) antes de decidir?
