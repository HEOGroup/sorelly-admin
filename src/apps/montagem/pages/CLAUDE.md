# Regras das telas de Kits (pages/)

Acesso é por setor (ver CLAUDE.md da raiz). Nomes de pessoas aqui são só quem ocupa o cargo hoje.

## Estrutura do menu Kits
- "Listagens & Kits" abre no próprio menu e fecha os outros grupos. Dentro: Listagens, Calculadora de kits, Análise de vendas (logo abaixo da Calculadora), Condicionais, Consolidado, Regras, Equipe, Registros, Relatórios. Metas ficam junto.
- Telas das montadoras, bipagem, representante e revendedora são APPS (ícones coloridos no topo), não itens do menu.
- Kits novos fica dentro de Cadastro de revendedoras. Não criar tela "Atendimento de novas revendedoras".
- Menu Representantes: App da Representante, Consolidado, Comissões, Configurador de comissões, Inadimplência, Regras (somente leitura, bem descrita), Configurações (edita tudo; o que muda no admin muda no app). Regras de comissão/remessa/inadimplência: ver domain/CLAUDE.md. Perfis Ana Maria, Mariana, Tamara (agendamento) e Nayale (financeiro) só veem Consolidado, Comissões e Inadimplência.
- "Jurídico" virou "Cobrança". Financeiro familiar é separado do Financeiro Sorelly.
- Nomes oficiais: "Calculadora de Acertos", "Análise de vendas", "Revendedoras / Previstos / Realizados".

## Listagens (setor de montagem e bipagem; responsável Deysiane)
- Colunas: Ordem, Horário, Nome, Tipo (mais à direita), Montadora, tempo, bipadora, horário finalizado. Sem bairro.
- Um bloco por representante, com "abrir todas" e "fechar todas". Prioritários e prontos no topo com ★. A cor da barra da linha segue a situação.
- Situações: Na fila, Montando, Aguardando bipagem, Bipado, Retirado. Retirada pode ser feita pelo desktop; a representante pode retirar parcialmente (ex.: 3 kits), com acompanhamento ao vivo.
- Kit sem valor definido aparece em vermelho. Valor se edita clicando nele; ações no menu "⋯".
- Concluída a listagem, vai para o Consolidado (histórico por representante, filtros por período; registro de quantos kits de cada valor foram bipados).
- A supervisão do setor monta (inclusive kits maiores), manda funcionária iniciar e bipa ela mesma. "Mais kits montados" e "Mais bem avaliadas" ficam na aba Equipe, com comissão e valor a receber em tempo real.
- Kit acima de R$ 12 mil: só as 2 melhores montadoras (após 100 kits no mês). Acima de R$ 15 mil: conferência da supervisão.
- **Montar na listagem (19/10/2026):** botão Montar na linha do kit (`components/fila.js`, `janela-montar.js`) para a supervisão e as montadoras; a janela mostra preferências da revendedora (Preferências do Kit, por nome; nada inventado), condicionais e inicia/conclui a montagem. Montadora enxerga a listagem sem valores em dinheiro.
- **20/10/2026:** o setor Encomendas acabou (Agatha, Elen e Eduarda montam kits; cada uma um kit por vez). Limite passou a R$ 3.000 (`cfg.limiteEncomendas`). Venda/média acima de R$ 4.000 (`cfg.limiteMesaMaior`): selo "Mesa maior", montar só na mesa da Agatha (aviso, não trava). Encomendas e reposições voltará só para as top 50 revendedoras (por ora fica como está).
- **Kit acima do limite (era R$ 4.000, `cfg.limiteEncomendas`, venda atual OU média):** só o setor Encomendas monta (Elen, Agatha, Eduarda Gabriela); selo "Só Encomendas"; Marcus e Deysiane liberam exceção. Vem antes da regra de R$ 12 mil.
- **Quem montou é obrigatório:** o reducer recusa avançar kit sem montador válido ("Informe quem montou este kit"); kit sem montador tem selo vermelho e não conta na comissão da bipadora.
- Divergência de bipagem acima de 20% registra divergência. Pedido com 48 h de antecedência; fora do prazo = atrasado.

## Calculadora de kits
- As listagens NÃO trazem valor pronto: só aparece depois de calculado (nada de valor fixo).
- Lista "Pendentes de cálculo" agrupada por representante; a supervisão começa o dia por ela.
- Média: a venda do app entra automática se for ≥ R$ 500, mais as 2 últimas vendas da DevMaster. Sem venda no app, ou abaixo de R$ 500: as 3 últimas da DevMaster ou valor manual. Escrever essa regra num bloco legível na tela.
- Valor do kit = média de 3 meses, nunca venda isolada. Sem vendas e não vindo de Kit novo: R$ 7.000 a confirmar. Kit novo já vem com valor do setor Kits novos.
- Para testes: metade dos kits sem valor, metade com valor.

## Análise de vendas
- OBRIGATÓRIA quando a média da Calculadora passa de R$ 2.500. A supervisão sobe 3 prints da DevMaster ("Itens das Vendas") lidos por IA; quando a API da DevMaster sair, vira automático.
- Relatório: kit/período, nº de pedidos e peças, % ouro e prata, quantidades por tipo. Como misturar vendas reais com preferências da revendedora: em aberto (preferências vieram aleatórias, não confiar nelas).

## Peças por kit (faixa MÍNIMO e MÁXIMO, não valor fechado)
A tabela dá só o intervalo por categoria; as montadoras decidem quanto enviar dentro dele. Provisória, será revisada uma a uma pelo Marcus. Faixa de R$ 5 mil (mínimo) a R$ 20 mil (máximo); acima de R$ 20 mil: a definir. Kits do meio são proporcionais.
- Colares (ouro e prata, cada) 5→20 · Pulseiras 3→15 · Conjuntos 1→4 · Trio de argolas 1→3 · Brincos grandes 3→9 · Brincos B 15→40 · Brincos Select (BB) 15→30 · Anéis 10→35 · Infantil e masculino 3→8 · Tornozeleira 1→3 · Flanela sempre 1.

## Condicionais (setor de condicionais; responsável hoje Marjory, antes Gabi)
- Aba própria dentro de Listagens, mesmo formato (dropdown por representante). Vermelha com pendência, dourada quando tudo conferido. Mostra revendedora e números das condicionais; dá para adicionar número manualmente.
- Vêm da DevMaster. Acerto + saída: puxa todas. Acerto + novo kit: só as com devolução em até 90 dias. Condicionais de expositores têm data de anos à frente para não confundir.
- A condicional é gerada na EMPRESA. Na entrega a revendedora assina digitalmente e a representante confere as peças pela câmera.
- Pendente: reunião com a DevMaster (data de devolução e vendas por cliente); nota promissória virtual (com o Leonardo).

## Atendimento interno (setor Atendimento Sorelly)
**Movido para `docs/regras-historico/pages-atendimento-retornos-e-kit-novo-out-2026.md` (24/11/2026, economia de contexto; texto inteiro, nada apagado). Ler ao mexer no Atendimento Sorelly (Atendimento interno), na fila de retornos, na conferência de peças ou na entrega do kit novo** (`Grep` pelo assunto e leia só o trecho).

## Estilo
Letras brancas (não cinza), conteúdo centralizado, tema dourado, tabelas no estilo de Comissões. Apps: cores sólidas, sem degradê. Admin: degradê dourado leve. App da representante: topo preto com título e setas douradas; comissão da revendedora de 8% do acerto.

## Atendimento Sorelly: ajustes de outubro/2026
**Movido para `docs/regras-historico/pages-atendimento-retornos-e-kit-novo-out-2026.md` (24/11/2026, economia de contexto; texto inteiro, nada apagado). Ler ao mexer no Atendimento Sorelly (Atendimento interno), na fila de retornos, na conferência de peças ou na entrega do kit novo** (`Grep` pelo assunto e leia só o trecho).

## Retornos, fila de bipagem e Controle de kits (09/10/2026)
**Movido para `docs/regras-historico/pages-atendimento-retornos-e-kit-novo-out-2026.md` (24/11/2026, economia de contexto; texto inteiro, nada apagado). Ler ao mexer no Atendimento Sorelly (Atendimento interno), na fila de retornos, na conferência de peças ou na entrega do kit novo** (`Grep` pelo assunto e leia só o trecho).

## Conferência das peças com a câmera (09/10/2026, primeira versão)
**Movido para `docs/regras-historico/pages-atendimento-retornos-e-kit-novo-out-2026.md` (24/11/2026, economia de contexto; texto inteiro, nada apagado). Ler ao mexer no Atendimento Sorelly (Atendimento interno), na fila de retornos, na conferência de peças ou na entrega do kit novo** (`Grep` pelo assunto e leia só o trecho).

## Entrega do kit novo (08/10/2026) — app da representante + app da revendedora, juntas
**Movido para `docs/regras-historico/pages-atendimento-retornos-e-kit-novo-out-2026.md` (24/11/2026, economia de contexto; texto inteiro, nada apagado). Ler ao mexer no Atendimento Sorelly (Atendimento interno), na fila de retornos, na conferência de peças ou na entrega do kit novo** (`Grep` pelo assunto e leia só o trecho).
