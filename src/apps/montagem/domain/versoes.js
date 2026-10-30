// Sorelly Admin · montagem — domain/versoes.js
// REGISTRO DE VERSÕES do sistema: o que mudou, quando e em qual tela. Mais novo primeiro.
// Regra: quem mexer no sistema (pessoa ou Claude) acrescenta uma entrada NO TOPO ao terminar. Aparece em Tecnologia → Versões.
// area = módulo/tela principal; tipo = "novo" | "melhoria" | "correção".
var VERSOES = [
  {v:"0.18.9", data:"2026-10-30", titulo:"SorellyChat: Setores só na barra Todos/Setores, Transmissão com filtro Sem foto", itens:[
    {tipo:"melhoria", area:"SorellyChat", txt:"O botão Setores do alto da lista saiu: Setores fica só ao lado de Todos. Lá abre como a lista normal de conversas."},
    {tipo:"melhoria", area:"SorellyChat", txt:"Conversa arquivada que recebe mensagem nova volta sozinha para a tela principal (vale para qualquer mensagem, de quem for). Saíram o texto amarelo e a faixa \"Filtro: Arquivadas\"."},
    {tipo:"novo", area:"SorellyChat", txt:"Grupo Encomendas e Reposições (igual ao Agendamento: aba Geral e uma aba para Agatha, Elen e Eduarda). Todos os grupos prontos (inclusive MLN) agora aparecem no botão +, para quem ainda não foi criado."},
    {tipo:"melhoria", area:"SorellyChat", txt:"Transmissão: botão Sem foto marca só quem ainda não colocou foto no perfil."}]},
  {v:"0.18.8", data:"2026-10-30", titulo:"Customizações (antes Melhorias), grupos de setor e grupo MLN", itens:[
    {tipo:"melhoria", area:"Customizações", txt:"O nome Melhorias virou Customizações (menu, tela e botões). Todo chamado novo pede o tipo antes de enviar: Não sei como fazer, Melhoria do layout ou Algo que falta. O tipo aparece na lista e na conversa do chamado."},
    {tipo:"novo", area:"SorellyChat", txt:"Botão de chave inglesa no alto de qualquer conversa: abre uma customização sem sair do chat."},
    {tipo:"novo", area:"SorellyChat", txt:"Setores vazio agora mostra botões para criar o grupo do Agendamento, Atendimento Interno, Montagem, Marketing, Encomendas e Financeiro Representantes (só o Marcus). Cada grupo ganha a aba Geral e uma aba para cada funcionária, no topo."},
    {tipo:"novo", area:"SorellyChat", txt:"Novo grupo ganhou a opção Grupo de setor (abas por funcionária). No botão + há o atalho Grupo MLN (Marcus, Nickolas e Lucas)."}]},
  {v:"0.18.7", data:"2026-10-30", titulo:"SorellyChat: lista de transmissão", itens:[
    {tipo:"novo", area:"SorellyChat", txt:"Botão Transmissão na lista (só Direção): escolhe todos os funcionários ou só alguns (por setor ou por pessoa), escreve uma vez e cada um recebe na conversa direta, como no WhatsApp. Representantes entram só se marcar a opção."}]},
  {v:"0.18.6", data:"2026-10-30", titulo:"SorellyChat: tela inteira, links e negrito", itens:[
    {tipo:"novo", area:"SorellyChat", txt:"Botão Tela inteira na faixa do chat: cobre o menu e o topo do admin, para deixar o chat numa aba só dele. A escolha fica no endereço (?cheia=1)."},
    {tipo:"melhoria", area:"SorellyChat", txt:"Links (http, https e www) abrem ao clicar, sem a pontuação do fim. Texto entre asteriscos (*assim*) fica em negrito, como no WhatsApp."},
    {tipo:"melhoria", area:"SorellyChat", txt:"Faixas do topo da lista alinhadas na mesma altura e no mesmo tamanho de letra."}]},
  {v:"0.18.5", data:"2026-10-30", titulo:"SorellyChat: responder direto, arquivar em massa", itens:[
    {tipo:"melhoria", area:"SorellyChat", txt:"Ao tocar em Responder, o cursor já vai para o campo de texto. A mensagem respondida aparece em tom claro dentro da caixa, como no WhatsApp."},
    {tipo:"melhoria", area:"SorellyChat", txt:"Mensagem nova numa conversa arquivada tira a conversa das arquivadas de quem recebeu."},
    {tipo:"novo", area:"SorellyChat", txt:"Botão Selecionar na lista: marca várias conversas e arquiva (ou tira das arquivadas) de uma vez."}]},
  {v:"0.18.3", data:"2026-10-30", titulo:"Atendimento Sorelly: desenho novo (lateral, tabelas e resumo em 4 blocos)", itens:[
    {tipo:"melhoria", area:"Atendimento interno", txt:"Cabeçalho em faixa (revendedora, horário, situação com remarcação, chegada, montagem de kit, escolha do kit com relógio, iniciar). Cinco estações na lateral com a mesma altura: Condicionais e vendas, Pagamentos, Brindes, Condicional nova e Regras."},
    {tipo:"melhoria", area:"Atendimento interno", txt:"Pagamentos: lista de formas, bandeira (cartões e link), parcelas e envio ao financeiro. Brindes normal e select com código e valor. Regras lidas uma a uma, com o texto e os números da regra em vigor."},
    {tipo:"novo", area:"Atendimento interno", txt:"Resumo do acerto em 4 blocos (condicionais, brinde normal, brinde select e conta) com botão Gerar PDF."}]},
  {v:"0.18.4", data:"2026-10-29", titulo:"Trava dura do padrão visual: hook, conferidor e fotos de referência", itens:[
    {tipo:"novo", area:"Tecnologia", txt:"As regras do padrão visual viraram código (scripts/padrao-regras.mjs): tamanho do texto (13 e 11 px), número até 20 px, campo e botão de 32 px, letras brancas e peças do padrão. O Claude recebe o erro na hora em que edita uma tela e corrige antes de entregar."},
    {tipo:"novo", area:"Tecnologia", txt:"npm run padrao confere o que mudou antes de subir (dentro de npm run conferir e do CI do GitHub). npm run padrao:relatorio lista as telas antigas fora do padrão."},
    {tipo:"novo", area:"Tecnologia", txt:"Fotos de referência (Playwright): Visão geral, Faturamento, Contas a pagar e Padrão visual têm foto aprovada. O GitHub tira a foto de novo a cada mudança e reprova se a tela mudou sem aprovação. Aprovar foto nova: Actions → Fotos de referência."}]},
  {v:"0.18.3", data:"2026-10-29", titulo:"Cadastro de peças: menu no topo e Pedidos em Quadro e Planilha", itens:[
    {tipo:"melhoria", area:"Cadastro de peças", txt:"As abas de dentro da tela saíram. Cada tela virou item do menu do topo, igual ao Financeiro: Pedidos de bruto, Controle do mês, Banho (Tabela do banho, Faturas Pontual, Faturas Ellos, Retirar ouro), Peças (Solicitações, Planilhas de cadastro, Calculadora, DevMaster), Fornecedores e Configurações. O endereço de cada tela agora é /cadastro-de-pecas/nome-da-tela."},
    {tipo:"novo", area:"Cadastro de peças", txt:"Pedidos de bruto agora tem Quadro (cartões que andam por etapa) e Planilha, com faixa de totais (abertos, comprado, folga do teto, no banho, atrasados, peças) e filtros no topo."},
    {tipo:"novo", area:"Cadastro de peças", txt:"Etapas do pedido: Escolha, Separação, Fechado, Banho e Chegou. O pedido só fecha com o número do romaneio. Cada pedido mostra os dias na etapa e fica vermelho quando passa do prazo (5, 2 e 10 dias, valores de partida)."},
    {tipo:"melhoria", area:"Cadastro de peças", txt:"Ficha do pedido em janela (dados, etapas e ações): chegadas, valor, desconto, peças por categoria e observação. A folga do teto vem do Financeiro (bruto do mês). Banho sugerido por fornecedor: Point e Mega Sul na Pontual; Art Ello, Xangai, Linda, Tucano e Charme na Ellos."}]},
  {v:"0.18.2", data:"2026-10-29", titulo:"Atendimento Sorelly: só o layout 2, sem topo", itens:[
    {tipo:"melhoria", area:"Atendimento interno", txt:"Ficou só o layout 2 (fila e abas à esquerda, passo a passo no centro, resumo à direita). Os outros 3 layouts e o seletor saíram."},
    {tipo:"melhoria", area:"Atendimento interno", txt:"Tirado o topo da página (título, subtítulo e seletor de layout). O seletor Kit Normal / Kit 100% Prata foi para a coluna da esquerda, embaixo da fila."},
    {tipo:"melhoria", area:"Atendimento interno", txt:"Fila do dia mais larga e com linhas maiores; a cliente aparece só com o primeiro e o segundo nome (o nome completo fica ao passar o mouse)."}]},
  {v:"0.18.1", data:"2026-10-29", titulo:"Pagas por dia e excluir lançamento em Contas a pagar", itens:[
    {tipo:"novo", area:"Financeiro", txt:"Tela Pagas por dia (Contas): escolhe o dia e vê o total pago, por CNPJ e conta por conta, com dia anterior, hoje e dia seguinte."},
    {tipo:"novo", area:"Financeiro", txt:"Contas a pagar: conta lançada à mão ganha o botão Excluir lançamento (só quem pode registrar pagamento). Os pagamentos dela saem junto e fica no histórico."}]},
  {v:"0.17.24", data:"2026-10-29", titulo:"Agendamento: cidades da mesma representante, separadas e juntas", itens:[
    {tipo:"novo", area:"Agendamento", txt:"Controle por representante tem o botão Separado | Junto. Separado: cada cidade com a sua cota e o seu saldo. Junto: soma as cidades da mesma pessoa (cota, saldo e cada dia). Pódio, zona de atenção, análises e histórico já somavam."},
    {tipo:"melhoria", area:"Agendamento", txt:"Grupos gravados: Thalita (Thalita Torazzi + Litoral PR) e Anne (Asley, PG e Joinville). Quem gerencia muda os grupos no Configurador do Agendamento."},
  ]},
  {v:"0.18.0", data:"2026-10-29", titulo:"Corte do Financeiro: última puxada do admin antigo", itens:[
    {tipo:"melhoria", area:"Financeiro familiar", txt:"Dados do Financeiro familiar refeitos a partir do admin antigo e gravados no servidor (Pix, contas, pagamentos, repasses). Totais conferidos contra o antigo."},
    {tipo:"melhoria", area:"Cobrança de funcionárias", txt:"Compras e pagamentos atualizados com o admin antigo (873 e 396), somas conferidas."},
    {tipo:"melhoria", area:"Financeiro", txt:"Saldos das contas e contas pagas por dia atualizados até 28/10."}]},
  {v:"0.13.1", data:"2026-10-29", titulo:"Recarrega sozinho depois de uma atualização", itens:[
    {tipo:"correcao", area:"Sistema", txt:"Aba aberta antes de uma publicação dava erro de carregamento (Loading chunk failed). Agora a tela recarrega sozinha uma vez; se o erro repetir, aparece um aviso com o botão Recarregar."}]},
  {v:"0.13.0", data:"2026-10-29", titulo:"Top 50 oficial: lista da planilha, importação e Encomendas no servidor", itens:[
    {tipo:"novo", area:"Encomendas e reposições", txt:"Top 50 da planilha do Marcus carregado (50 revendedoras, com última venda, representante, data do acerto, situação e responsável pela montagem). A tela Top 50 diz que são as revendedoras com direito a reposições e encomendas diretamente pelo setor."},
    {tipo:"novo", area:"Encomendas e reposições", txt:"Botão Importar lista (só diretoria): cola as linhas da planilha e o sistema cadastra, atualiza e, se marcado, tira quem ficou fora da lista. Serve para colocar o Top 50 no servidor sem passar os dados pelo GitHub."},
    {tipo:"melhoria", area:"Servidor", txt:"O módulo de Encomendas e reposições entra na lista dos módulos guardados no servidor, liberado ao setor Encomendas (a Diretoria abre tudo)."}]},
  {v:"0.17.23", data:"2026-10-29", titulo:"SorellyChat: botão Setores e grupo da Montagem", itens:[
    {tipo:"novo", area:"SorellyChat", txt:"Botão \"Setores\" ao lado do Almoço, para todos: lista os grupos de setor de que a pessoa faz parte (a Direção vê todos) e um toque abre o grupo. Mostra as mensagens não lidas."},
    {tipo:"novo", area:"SorellyChat", txt:"Grupo \"Montagem de Kits\": Deysiane (supervisora) e as montadoras. No topo, um ícone por montadora abre a conversa particular dela (mesmo modelo do Atendimento Interno). Nasce sozinho para quem já tem o chat aberto."},
  ]},
  {v:"0.17.22", data:"2026-10-29", titulo:"SorellyChat: fotos, áudios e arquivos funcionam; Leonardo igual ao Marcus", itens:[
    {tipo:"correção", area:"SorellyChat", txt:"Fotos, áudios e arquivos agora funcionam no chat (antes aparecia \"Fotos e áudios ainda não funcionam no chat\"). A mídia sobe para o servidor (tabela sorelly.chat_midia, criada sozinha) antes da mensagem e quem recebe busca pela chave; só quem é membro da conversa abre. Limite de uns 2,5 MB por arquivo (a foto já é reduzida a 1280 px). Rotas: /api/chat/midia (enviar) e /api/chat/midia/[key] (buscar)."},
    {tipo:"melhoria", area:"Acessos", txt:"O Leonardo (pessoa 44) ficou 100% igual ao Marcus: aba Apps e apps de celular, \"Atuar como\", situação (reunião/ausente), edição dos Acessos e das Autorizações, TODAS as autorizações, Configurador do SorellyChat, Cobrança de funcionárias, Financeiro familiar e liberar exceção de kit."},
  ]},
  {v:"0.17.21", data:"2026-10-29", titulo:"Botão Sair sempre à vista e Apps só da Diretoria", itens:[
    {tipo:"melhoria", area:"Acessos", txt:"Botão \"Sair\" fixo na barra de cima, ao lado da conta (antes só existia no fim do menu da conta, escondido embaixo da lista \"Atuar como\"). No menu da conta, o Sair e entrar com outra conta também subiu para o topo."},
    {tipo:"correção", area:"Acessos", txt:"A aba Apps e os apps de celular (representante, funcionárias e revendedora) abrem só para a Diretoria (Marcus, Nickolas e Lucas). O app da revendedora ainda ficava na lista dos demais; agora também sai."},
  ]},
  {v:"0.17.20", data:"2026-10-29", titulo:"Agendamento: o sistema aponta o que está diferente da DevMaster; Plano 45/60 e Remarcações apagados", itens:[
    {tipo:"novo", area:"Agendamento · Revendedoras", txt:"A Ana Maria pode alterar no card: nome, WhatsApp, cidade, UF, representante e data do acerto (mais observação). Cada campo alterado guarda o nosso valor, o valor que a DevMaster tinha na hora e o histórico. A leitura da DevMaster NUNCA muda o que foi alterado aqui; ela só é comparada."},
    {tipo:"novo", area:"Agendamento · Revendedoras", txt:"Três situações por campo: \"≠ DevMaster\" (só nós mudamos: alterar lá também ou \"Usar o da DevMaster\"), \"DM mudou\" (a DevMaster mudou depois da nossa alteração: \"Usar o da DevMaster\" ou \"Manter o nosso\") e \"já está igual\" (a DevMaster alcançou: o selo some). A tabela mostra os selos, a faixa de totais conta as diferentes e há o filtro \"Só diferentes da DevMaster\". A caixa que travava o Salvar saiu."},
    {tipo:"correção", area:"Agendamento", txt:"Apagados os arquivos das telas do Plano 45/60 (Plano4560, Plano4560Msgs, Plano4560Config), as mensagens do plano e a tela Remarcações (com o botão que levava a ela no Painel e a seção do Configurador geral). Ficam só a lógica do plano (domain/plano45-60.js e o .local), porque o estado, o app da representante (pedido de data) e os alertas ainda a usam."},
  ]},
  {v:"0.17.19", data:"2026-10-29", titulo:"Agendamento: menu reorganizado, card da revendedora e topo novo", itens:[
    {tipo:"melhoria", area:"Agendamento", txt:"Menu reorganizado: Revendedoras (primeiro), Representantes, Análises (agora com Painel, Análises e Histórico) e Gestão do mês. Plano 45/60 e Remarcações saíram do menu, das áreas, das rotas e do perfil do Agendamento (os arquivos ficam no projeto, sem acesso)."},
    {tipo:"novo", area:"Agendamento · Revendedoras", txt:"Clicar numa revendedora abre o CARD (mesmo desenho do card da Tamara): resumo, condicionais ativas, histórico de alterações e, para a Ana Maria, troca de representante, data do acerto e observação. Aviso fixo no topo: ANTES de alterar aqui, altere na DevMaster; o botão Salvar só libera depois de marcar \"já fiz essa alteração na DevMaster\". Quem mudou, quando, de onde para onde e o motivo ficam no registro (módulo agrev, uma chave por revendedora)."},
    {tipo:"novo", area:"Agendamento · Revendedoras", txt:"Quando a representante ou a data daqui ficam diferentes da DevMaster, a tabela mostra o selo \"≠ DevMaster\" e o topo conta quantas estão assim (\"Alteradas aqui\")."},
    {tipo:"melhoria", area:"Agendamento · Revendedoras", txt:"O bloco ao lado do calendário virou um RESUMO: acertos do dia, da semana e do mês, atrasadas e as representantes do dia com barras (clicar filtra). Clicar num dia do calendário filtra a tabela só para aquele dia (botão \"Dia dd/mm ✕\" limpa). Topo novo: faixa de totais (revendedoras, acertos hoje, próximos 7 dias, atrasadas, representantes, alteradas aqui) e filtros logo abaixo."},
  ]},
  {v:"0.17.18", data:"2026-10-29", titulo:"Agendamento › Revendedoras: todas com kit ativo e calendário de acertos", itens:[
    {tipo:"novo", area:"Agendamento", txt:"Nova aba Revendedoras (/agendamento/revendedoras): as 2.074 revendedoras com kit ativo (condicional aberto na DevMaster com devolução prevista até 120 dias à frente; emissão sem limite). Desenho copiado da aba Revendedoras do Atendimento interno: calendário, painel do dia, tabela com filtro no título da coluna e visão Calendário grande."},
    {tipo:"novo", area:"Agendamento", txt:"O calendário CONTA ACERTOS por dia, somando todas as representantes (cor mais forte = mais acertos). O painel do dia mostra o total e o número de acertos de cada representante; clicar numa representante filtra. Filtrou uma ou várias representantes, uma revendedora ou uma coluna? O calendário e o painel passam a mostrar só quem sobrou."},
    {tipo:"novo", area:"Servidor", txt:"Rota /api/agenda-revendedoras (server/revendedoras.js › listaAgenda), só leitura, cache de 10 minutos; abre para Agendamento e Diretoria."},
    {tipo:"correção", area:"Agendamento · Painel", txt:"Corrigido o aviso de chave repetida nos sinais − + = do bloco \"Como a meta se forma\" (o Painel segue igual)."},
  ]},
  {v:"0.17.17", data:"2026-10-29", titulo:"SorellyChat: fotos de todos para todos", itens:[
    {tipo:"correção", area:"SorellyChat", txt:"As fotos do chat vêm do perfil guardado no servidor (a mesma da página Início). Antes ficavam só no navegador de quem colocou, por isso sumiam ao ver pela Nayale ou por outra pessoa."},
    {tipo:"melhoria", area:"SorellyChat", txt:"Quando a Diretoria ou o Marketing coloca a foto de alguém no chat, ela também vai para o servidor e todos passam a ver. Funciona para quem já tem conta no sistema."},
  ]},
  {v:"0.17.16", data:"2026-10-29", titulo:"SorellyChat: aviso com foto em 2 linhas, som Cristal forte, Ctrl+V e avisos ligados", itens:[
    {tipo:"melhoria", area:"SorellyChat", txt:"Mensagem nova mostra o aviso modelo 1: foto, nome da conversa e a mensagem em até 2 linhas, com o som Cristal mais forte. As notificações do chat começam ligadas para todos e, com a aba escondida, o navegador também avisa (pede permissão uma vez)."},
    {tipo:"novo", area:"SorellyChat", txt:"Ctrl+V com imagem copiada (print ou foto) vira anexo com pré-visualização na barra de escrever. O áudio já existia."},
    {tipo:"melhoria", area:"Acessos", txt:"As 13 contas da montagem de kits (10 montadoras e 3 da Encomendas) ficaram no Acesso básico: Início, SorellyChat e Melhorias."},
  ]},
  {v:"0.17.6", data:"2026-10-29", titulo:"SorellyChat: sem selo de pendência na lista", itens:[
    {tipo:"melhoria", area:"SorellyChat", txt:"A lista de conversas não mostra mais o selo amarelo de pendência nem o realce da linha. O horário de trabalho e de almoço aparece para quem vê a conversa com uma colaboradora, inclusive vendo como a Bruna."},
  ]},
  {v:"0.17.5", data:"2026-10-29", titulo:"SorellyChat: topo travado", itens:[
    {tipo:"correção", area:"SorellyChat", txt:"A página inteira não rola mais junto com o chat. Só a lista de conversas e a conversa rolam; o topo fica parado. A altura do chat é refeita sempre que o topo da tela muda."},
  ]},
  {v:"0.17.4", data:"2026-10-29", titulo:"SorellyChat mais limpo e contagem de revendedoras", itens:[
    {tipo:"melhoria", area:"SorellyChat", txt:"Na conversa com um colaborador, o topo mostra só o horário de trabalho. Saíram as bolinhas dos últimos 10 dias e o resumo do mês."},
    {tipo:"melhoria", area:"SorellyChat", txt:"Saiu a barra \"Marcar pendente / Marcar resolvida\" de dentro da conversa."},
    {tipo:"correção", area:"Servidor", txt:"O robô das revendedoras (18h) conta condicional aberto emitido nos últimos 180 dias, com devolução prevista até 90 dias à frente. Antes eram 90 dias de emissão e dava 5 a menos que a DevMaster."},
  ]},
  {v:"0.17.3", data:"2026-10-29", titulo:"Faturamento de 28/10 fixado e robô do faturamento desligado", itens:[
    {tipo:"correção", area:"Financeiro · Faturamento", txt:"28/10 fixado: 1.652 acertos e R$ 1.296.201,60 acumulados; Carregar 0 e 234 acertos a realizar (total 1.886)."},
    {tipo:"correção", area:"Servidor", txt:"O robô que lia o faturamento às 10h foi desligado: a regra dele dava só cerca de R$ 262 mil no mês e gravaria o valor errado."}
  ]},
  {v:"0.17.2", data:"2026-10-29", titulo:"Contas a pagar: já pago e falta pagar vêm direto da DevMaster", itens:[
    {tipo:"correção", area:"Financeiro · Contas a pagar", txt:"O alto da tela (Já pago e Falta pagar) deixou de copiar o admin antigo e passou a ler a DevMaster pelo servidor, a cada 10 minutos."},
  ]},
  {v:"0.17.15", data:"2026-10-29", titulo:"Início: Setores e Acesso básico sem apps", itens:[
    {tipo:"melhoria", area:"Início", txt:"Na tela inicial, \"Seus setores\" virou \"Setores\" e saiu \"Para você decidir hoje\". \"Seu dia\", \"Visitados recentemente\" e as bolinhas da mensagem saíram para todos. Setores com letra maior, foto maior. No chat, horário e bolinha só para a Direção."},
    {tipo:"correção", area:"Acessos", txt:"O grupo Acesso básico não abre mais nenhum app de celular. A Bruna (Financeiro) fica no Acesso básico em qualquer visão, inclusive em \"atuar como\": Início, SorellyChat e Melhorias."},
  ]},
  {v:"0.17.14", data:"2026-10-29", titulo:"Apps: barras na cor do SorellyChat, cabeçalho fixo e tamanho P ao abrir", itens:[
    {tipo:"melhoria", area:"Apps", txt:"Todas as barras (cartões) da tela inicial da revendedora, da representante e das funcionárias têm o fundo creme da barra do SorellyChat (FUNDO_BARRA em mobile/cores-app.js). Os ícones mantêm a cor de cada função."},
    {tipo:"melhoria", area:"Apps", txt:"A parte principal (cabeçalho escuro) de cada app de celular fica FIXA no topo; só o resto da tela rola (regra em styles/montagem.css)."},
    {tipo:"correção", area:"Apps", txt:"Sumiu a faixa clara que ficava em cima do cabeçalho dos apps (o topo fixo agora cola exatamente na barra de status). Na revendedora a ordem é Visualizar catálogo (em cima de tudo), SorellyChat e Kit novo logo abaixo; na representante SorellyChat é o primeiro e Kits Novos vem logo abaixo."},
    {tipo:"melhoria", area:"Apps", txt:"Organização da tela: UM bloco em cima, com seta que abre e fecha (\"Apps e fluxos · fluxo · N apps\"); dentro ficam os fluxos e os 11 apps, para ligar e desligar um a um (botões Principais e Todos). Escolher um fluxo liga os apps dele. O tamanho e o play ficam sempre à vista; os celulares usam a largura toda embaixo. Abre fechado."},
    {tipo:"melhoria", area:"Apps", txt:"Os botões P, M e G foram trocados por um controle de tamanho em porcentagem: botões − e + e uma barra, de 50% a 100%, de 5 em 5. A tela abre sempre em 100% (celular de ~363 px); o 50% é o menor tamanho (celular de ~212 px, o antigo 70%). Quando passa da largura da tela, a linha de celulares ganha rolagem lateral."},
    {tipo:"melhoria", area:"Apps", txt:"(substituído pelo item acima) O tamanho P ficou menor: 78% do que cabe na largura (em 1800 px, celular de 127 px de largura). Nos cartões muito estreitos a barra mostra só a inicial da pessoa; o nome inteiro aparece ao passar o mouse e nos tamanhos M e G."},
    {tipo:"melhoria", area:"Apps", txt:"A tela Apps abre sempre no tamanho P (cabem todos os celulares na largura). Os botões de tamanho agora são P, M e G."},
  ]},
  {v:"0.17.13", data:"2026-10-29", titulo:"Apps: selo do app em cima da barra e barra mais baixa e estreita", itens:[
    {tipo:"melhoria", area:"Apps", txt:"O selo \"App para iOS ou Android\" (\"App interno\" nos apps das funcionárias) passou para CIMA da barra do cargo, menor (18 px). A barra do cargo ficou pequena: 22 px de altura e só a largura do texto (cargo + nome), centralizada. Todos os cartões têm a mesma largura e os celulares seguem alinhados."},
  ]},
  {v:"0.17.12", data:"2026-10-29", titulo:"Apps: barra de uma linha, tipo do app em cima e app da revendedora reordenado", itens:[
    {tipo:"melhoria", area:"Apps", txt:"Barra de cima do celular com 34 px, numa linha só: cargo e, ao lado, o nome da pessoa. O selo \"App para iOS ou Android\" (\"App interno\" nos apps das funcionárias) fica logo embaixo da barra; nada fica embaixo do celular. Saiu o bloco \"O que este app gera no admin\" e o selo \"Age agora\" (a barra e o celular já acendem)."},
    {tipo:"melhoria", area:"App da revendedora", txt:"Nova ordem da tela inicial: Visualizar catálogo, Kit novo, SorellyChat, Vendas e Pedidos, Link de pagamento, Pagamentos, Clientes, Condicionais, Garantias, Mensagens para vender, Artes, Preferências, Indique, Regras e comissões, Aulas e Ajuda. O cartão Cobranças saiu: as cobranças aparecem em Pagamentos (que passou a abrir a tela de vendas e pagamentos)."},
  ]},
  {v:"0.17.11", data:"2026-10-29", titulo:"Apps: padrão único de letra e de cor (referência: app da revendedora)", itens:[
    {tipo:"novo", area:"Apps", txt:"Paleta única por função em mobile/cores-app.js: cada função tem UMA cor, igual em todos os apps (SorellyChat dourado, Kit novo rosa, Listagens roxo, Condicionais verde-água, Montagem azul, Retirada verde-limão, Dinheiro verde, Comissões âmbar...). Cor nova de função nova entra nesse arquivo."},
    {tipo:"melhoria", area:"Apps", txt:"Escala de letra única (título 13 px, legenda 11 px, selo 10 px, nome do cabeçalho 15 px): regra em styles/montagem.css para todos os apps com moldura de celular; o app do motoboy foi trocado direto."},
    {tipo:"melhoria", area:"Apps", txt:"Representante e Funcionárias passaram a usar na tela inicial os mesmos cartões compactos da revendedora (ícone 32 px, fundo pastel). O motoboy usa a paleta da revendedora (cabeçalho preto, ouro, verde e vermelho dela). Saiu o contorno de cada cartão na tela Apps: ficam só a barra de cima e o celular."},
  ]},
  {v:"0.17.10", data:"2026-10-29", titulo:"Apps: celulares alinhados, topo fino, sem a fila de celulares; revendedora sem bordas grossas", itens:[
    {tipo:"melhoria", area:"Apps", txt:"Os celulares ficam exatamente alinhados (mesmo topo e mesma base; o da representante foi ajustado para a mesma altura). Cabeçalho do cartão mais fino (cargo + bolinha da pessoa; em cartão estreito a bolinha vai embaixo). O bloco de cima ficou mais fino."},
    {tipo:"melhoria", area:"Apps", txt:"Saiu o contorno grande em volta da fila de celulares. O cabeçalho de cada cartão é centralizado (cargo em letra maior e a bolinha com o nome embaixo), sem seta: clicar na barra já abre a lista."},
    {tipo:"melhoria", area:"Apps", txt:"Saiu a fila de botões \"Celulares\" e o título \"Celulares em sequência\". Sem fluxo mostra os 8 principais (representante, revendedora, supervisão, condicionais, montagem, bipagem, motoboy, cliente); o botão Todos liga os 11; com fluxo, só os celulares dele."},
    {tipo:"melhoria", area:"App da revendedora", txt:"Visualizar catálogo passou para o TOPO da lista. Kit novo, Cobranças e SorellyChat perderam a borda grossa dourada."},
    {tipo:"melhoria", area:"Apps", txt:"O app da cliente final usa a paleta e os tamanhos de letra do app da revendedora (cabeçalho preto, ouro, 13 px e 11 px)."},
  ]},
  {v:"0.17.9", data:"2026-10-29", titulo:"Apps: cada celular num cartão, cargo em cima e escolha da pessoa no cabeçalho", itens:[
    {tipo:"melhoria", area:"Apps", txt:"Cada celular fica num cartão do mesmo tamanho, alinhado pelo topo e pela base, com a borda na cor do celular (acende quando ele age). Em cima: o cargo (Representante, Supervisão da montagem, Montagem de kits...) e, ao lado, a bolinha com o nome da pessoa. Clicar no cabeçalho abre a lista para escolher outra pessoa."},
    {tipo:"melhoria", area:"Apps", txt:"A escolha da pessoa agora funciona também com os celulares pequenos (antes sumia no zoom automático). O Seletor do App das funcionárias aceita um botão próprio (gatilho)."},
  ]},
  {v:"0.17.8", data:"2026-10-29", titulo:"Apps: todos os celulares em uma linha, app da cliente final e fluxo Kit novo + venda + entrega", itens:[
    {tipo:"novo", area:"Apps", txt:"App da cliente final (mobile/cliente.js): rastreio da entrega com etapas, código de entrega (o mesmo PIN do motoboy), itens e avaliação. Fica no fim da linha, depois do motoboy."},
    {tipo:"novo", area:"Apps", txt:"Fluxo \"Kit novo + venda + entrega\" (13 passos): representante agenda → listagem → condicionais → montagem → bipagem → retirada → volta → entrega do kit → venda → motoboy → coleta → entrega → concluída. O fluxo \"Entrega\" ganhou a cliente final."},
    {tipo:"melhoria", area:"Apps", txt:"Os dois blocos têm borda dourada, sobem e ocupam a largura toda. Os celulares ficam numa linha só, com zoom automático (botão Auto) para caber todos. O celular que age brilha na cor dele; quando dois agem juntos, os dois brilham. A linha do tempo passou para baixo dos celulares."},
  ]},
  {v:"0.17.21", data:"2026-10-29", titulo:"Tela Apps: linha do tempo dos fluxos", itens:[
    {tipo:"melhoria", area:"Apps", txt:"O topo da tela Apps agora é uma linha do tempo (escolha do Marcus). Escolhe-se um fluxo (Listagem de kits, Pagamento do acerto, Entrega, Retirada de kits, Kit novo, Atendimento interno): ele liga os celulares do fluxo e mostra uma grade com uma pista por celular e uma coluna por passo. Os botões Anterior, Próximo, Reproduzir e Reiniciar (ou um clique no quadro) andam pelos passos, e o celular de quem age fica com o contorno dourado e a etiqueta Age agora. Cada pista liga ou oculta o celular; os celulares avulsos e o tamanho P, M ou G continuam. Os fluxos são exemplos montados com as regras do sistema. Os apps ainda não trocam dados entre si: a linha do tempo mostra o caminho e quem age, sem mudar o conteúdo dos celulares."},
    {tipo:"melhoria", area:"Apps", txt:"Topo mais compacto: saiu o título grande Apps (a palavra Apps ficou dentro do bloco, na primeira linha, e a frase de apoio saiu). Grade com linhas finas de 1 px, uma cor para cada celular (barra na lateral e fundo do quadro de quem age), passo atual em dourado e passos já feitos com ✓. Nomes das pistas por extenso, sem cortar."}
  ]},
  {v:"0.17.20", data:"2026-10-29", titulo:"SorellyChat no formato WhatsApp em todos os apps de celular", itens:[
    {tipo:"melhoria", area:"Apps de celular", txt:"O SorellyChat da revendedora (lista Conversas, conversa com balões azuis e brancos, teclado do iPhone na tela, tela travada, barra só com Início e Conversas) agora é um componente único (mobile/chat-whats.js) usado também no app da representante, no app das funcionárias (Diretoria, supervisão, Montagem, Bipagem, Condicionais e demais setores), nos celulares simulados dos setores e no Ver no celular. Cada app só diz quem é e quais contatos fixos tem; mudar o jeito do chat passa a ser em um arquivo só."},
    {tipo:"novo", area:"App das funcionárias", txt:"Botão + da lista abre Nova conversa: busca por pessoa ou setor com foto e começa a conversa direta. Na representante, os setores (Diretoria, Financeiro, Agendamento...) viram conversas da lista, e o botão Ajuda antigo saiu."},
  ]},
  {v:"0.17.7", data:"2026-10-29", titulo:"Conta do Castilho (Marketing) e chat da Hellen", itens:[
    {tipo:"novo", area:"Acessos", txt:"Conta do Castilho (Marketing) com acesso básico: Início, Rotina, SorellyChat e Melhorias. Script: scripts/criar-conta-castilho.mjs."},
    {tipo:"correção", area:"SorellyChat", txt:"A conta da Hellen não estava ligada ao contato dela no chat (a conversa não abria para ela). Ligada ao contato Helen Garmier da Silva."},
  ]},
  {v:"0.17.20", data:"2026-10-29", titulo:"Tela Apps: galeria de fluxos com busca", itens:[
    {tipo:"melhoria", area:"Apps", txt:"O topo da tela Apps agora é uma galeria de fluxos (escolha do Marcus). Cada cartão liga os celulares do fluxo (Listagem de kits, Acerto da representante, Kit novo, Entrega, Retirada de kits, Pagamento do acerto, Atendimento interno); dá para ligar vários cartões juntos. Há busca por fluxo ou celular, botão Novo fluxo (nome + celulares, salvo neste navegador, com × para apagar), Limpar, celulares avulsos (Revendedora, Representante, os 7 acessos das funcionárias e Motoboy) e tamanho P, M ou G. Os fluxos prontos são exemplos: o Marcus ajusta nomes e participantes."}
  ]},
  {v:"0.17.19", data:"2026-10-29", titulo:"Teclado do SorellyChat sem a barra cinza e com letras em negrito", itens:[
    {tipo:"melhoria", area:"App da revendedora", txt:"Saiu a barra cinza de sugestões que aparecia em cima do teclado ao digitar, e a faixa bege atrás do campo de mensagem. O teclado ficou mais baixo. O texto que a revendedora digita no campo de mensagem passou para negrito (as teclas seguem normais)."},
    {tipo:"correção", area:"App da revendedora", txt:"Saiu a barra cinza que aparecia DENTRO do campo de mensagem ao digitar: o estilo geral dos campos do app pintava o campo de cinza por cima do branco. Agora o campo é branco limpo, só com o cursor azul."},
    {tipo:"correção", area:"App da revendedora", txt:"O tamanho e o peso das fontes dos botões do SorellyChat não valiam (a regra geral de botões passava por cima). Agora cada botão usa a própria fonte."},
  ]},
  {v:"0.17.17", data:"2026-10-29", titulo:"Tela Apps: escolher quais celulares aparecem", itens:[
    {tipo:"melhoria", area:"Apps", txt:"A tela Apps ganhou botões para ligar e desligar cada celular, em qualquer combinação: Revendedora, Representante, os 7 acessos das funcionárias (Diretoria, Supervisão, Montagem, Bipagem, Condicionais, Agendamento, Financeiro, cada um num celular com a sua pessoa) e Motoboy. Há atalhos de fluxo (Listagem de kits, Acerto, Entrega, Todos, Limpar) e tamanho P, M ou G. Os celulares ficam em dois blocos, Venda e acerto e Entrega. A escolha fica salva neste navegador."}
  ]},
  {v:"0.17.6", data:"2026-10-29", titulo:"Contas da Rayssa e da Graziella (Cadastro de peças)", itens:[
    {tipo:"novo", area:"Acessos", txt:"Contas com login pelo nome e senha provisória. Abrem Cadastro de peças, Início, SorellyChat e Melhorias. Script: scripts/criar-contas-cadastro-pecas.mjs."},
  ]},
  {v:"0.17.5", data:"2026-10-29", titulo:"Família com acesso a todos os setores", itens:[
    {tipo:"novo", area:"Acessos", txt:"Anamaria (mãe), Marco Antonio (pai) e Ana Beatriz (irmã): todos os 14 setores e todo o menu, menos os Configuradores. Contas de Marco Antonio e Ana Beatriz criadas com login pelo nome. Script: scripts/liberar-familia.mjs."},
  ]},
  {v:"0.17.18", data:"2026-10-29", titulo:"SorellyChat da revendedora: teclado do iPhone na tela", itens:[
    {tipo:"novo", area:"App da revendedora", txt:"Ao tocar no campo de mensagem aparece o teclado do iPhone dentro do celular: barra de sugestões, letras com Shift (maiúscula no começo da frase), apagar, teclado de números (123 e ABC), espaço e retorno que envia. As mensagens sobem para ficar acima do teclado. Tocar nas mensagens ou apertar Esc fecha o teclado. Também dá para digitar no teclado do computador. Campo com cursor azul, como no WhatsApp."},
  ]},
  {v:"0.17.4", data:"2026-10-29", titulo:"Contas da Maria Claudia (RH) e da Deysiane", itens:[
    {tipo:"novo", area:"Acessos", txt:"Contas com login pelo nome e senha provisória (tela Contas → Senhas para enviar). Maria Claudia: acesso igual ao da Priscila. Deysiane: supervisão da montagem (Montagem, Produção e Encomendas). Script: scripts/criar-contas-maria-deysiane.mjs."},
  ]},
  {v:"0.17.17", data:"2026-10-29", titulo:"SorellyChat da revendedora: fontes menores e topo da conversa refeito", itens:[
    {tipo:"melhoria", area:"App da revendedora", txt:"Fontes do SorellyChat reduzidas para ficar mais real no celular: título Conversas 26, nome do contato 14,5, mensagem 14 (antes 34, 17 e 17), foto e linhas mais baixas, barra de baixo mais fina e campo de mensagem menor. Cabem mais conversas na tela."},
    {tipo:"melhoria", area:"App da revendedora", txt:"Topo da conversa refeito: barra reta e fina com voltar, foto, nome inteiro e quem atende (antes o nome era cortado por causa das bolinhas de vídeo e telefone, que não faziam nada e saíram)."},
  ]},
  {v:"0.17.16", data:"2026-10-29", titulo:"SorellyChat do app da revendedora: cópia fiel do WhatsApp", itens:[
    {tipo:"melhoria", area:"App da revendedora", txt:"SorellyChat refeito como cópia do WhatsApp do iPhone, aprovada pelo Marcus no HTML docs/design/sorellychat-whatsapp.html: título Conversas grande, uma linha por contato (representante, Indique uma revendedora, Link de pagamento, Garantias, Currículo, SAC) com foto redonda, hora e contador verde, barra flutuante só com Início e Conversas, e conversa com fundo bege, balões azuis (dela) e brancos, respostas com citação, tique duplo, campo de mensagem com câmera e microfone. A tela fica travada: só a lista e as mensagens rolam. Usa as conversas reais do chat do sistema (enviar, receber e marcar como lida)."},
    {tipo:"melhoria", area:"Padrão visual", txt:"Exceção pedida pelo Marcus: o SorellyChat da revendedora usa as fontes e tamanhos do WhatsApp (17 px e título de 34 px) em CSS próprio, fora do limite de 20 px das telas do admin."},
  ]},
  {v:"0.17.16", data:"2026-10-29", titulo:"App do motoboy (H&O Delivery) na tela Apps", itens:[
    {tipo:"novo", area:"Apps", txt:"Nova aba Motoboy na tela Apps, com o app da H&O Delivery funcionando no celular simulado (mobile/motoboy.js). Início com mapa total e botão grande Ficar online (layout E aprovado pelo Marcus), oferta com contagem de 18 s (aceitar, recusar ou expirar), corrida em 4 etapas (a caminho da coleta, coleta com foto, em transporte, entrega com PIN de 4 números), problemas (destinatário ausente, avaria, cancelar), Ganhos (dia, semana, mês e extrato), Histórico e Perfil com documentos. Sem documento aprovado o motoboy não fica online. Endereço completo só depois de aceitar."},
    {tipo:"melhoria", area:"Apps", txt:"Tudo é de exemplo e fica só na memória do navegador: ainda não há servidor, despacho por proximidade, mapa/GPS reais, pagamento Pix, Admin Cloud nem integração com o app da revendedora. Esses itens são as próximas fases do projeto."}
  ]},
  {v:"0.17.15", data:"2026-10-29", titulo:"Venda abaixo de R$ 500 pede o motivo no acerto", itens:[
    {tipo:"novo", area:"App da representante", txt:"Na calculadora de acertos, se a venda for menor que R$ 500 (mínimo geral, em Regras do consignado), aparece o pedido de motivo: não tem muitos clientes, pouca habilidade com vendas, não teve tempo, problema de saúde ou pessoal, não gostou das peças ou Outro (com campo para escrever). O botão Confirmar acerto fica travado até escolher. O motivo é gravado no acerto. A regra Venda mínima passou a citar a justificativa."},
  ]},
  {v:"0.17.14", data:"2026-10-29", titulo:"App da revendedora só existe dentro da tela Apps", itens:[
    {tipo:"melhoria", area:"Apps", txt:"A tela e o botão separados App da revendedora saíram do menu e da barra do topo, e o endereço /app-revendedora deixou de existir. O app da revendedora fica só na tela Apps, ao lado do app da representante. O botão Ver no app das Preferências do kit agora abre a tela Apps já na tela de preferências."},
  ]},
  {v:"0.17.13", data:"2026-10-29", titulo:"App da revendedora: kit novo em primeiro lugar e vendas bloqueadas até receber", itens:[
    {tipo:"melhoria", area:"App da revendedora", txt:"O cartão Kit novo agora fica em cima de Visualizar catálogo e só aparece enquanto ela tem um kit novo para receber. Depois de receber e assinar, ele some e só volta quando ela ficar sem kit de novo."},
    {tipo:"novo", area:"App da revendedora", txt:"Enquanto o kit novo não for recebido, as vendas ficam bloqueadas: Vendas e Pedidos e Link de pagamento mostram a marca bloqueado e avisam para receber o kit novo, e no catálogo não dá para adicionar peça ao carrinho. Ver o catálogo continua liberado."},
  ]},
  {v:"0.17.12", data:"2026-10-29", titulo:"App da revendedora: SorellyChat refeito, tela cheia e só o nome no topo", itens:[
    {tipo:"melhoria", area:"App da revendedora", txt:"SorellyChat refeito: o topo tem só o símbolo e o nome SorellyChat (sem botões do chat das funcionárias), depois a busca e a lista de conversas em fonte pequena, ocupando a tela toda do celular, sem faixas pretas. Cada contato é uma conversa. Embaixo ficam só Início e Conversas, apenas na lista; aberta a conversa, a barra some e o voltar leva à lista. Substitui a 0.17.11."},
  ]},
  {v:"0.17.11", data:"2026-10-29", titulo:"App da revendedora: SorellyChat com o chat real do sistema", itens:[
    {tipo:"melhoria", area:"App da revendedora", txt:"SorellyChat agora abre o mesmo chat do app da representante e das funcionárias (fontes e espaços iguais, bem menor que a tela anterior). Cada contato (Minha representante, Indique uma revendedora, Link de pagamento, Garantias, Currículo e SAC) já aparece como uma conversa na lista, com um oi do próprio contato. O botão Ajuda do topo abre a lista de contatos. Substitui a tela Conversas da 0.17.10."},
  ]},
  {v:"0.17.10", data:"2026-10-29", titulo:"App da revendedora: Conversas no layout B (busca e 2 botões)", itens:[
    {tipo:"melhoria", area:"App da revendedora", txt:"A tela Conversas do SorellyChat seguiu o layout B escolhido pelo Marcus: título, campo Buscar (filtra os contatos pelo nome) e a lista de conversas. Sem os filtros Todas, Não lidas e Setores. Embaixo, só 2 botões: Início e Conversas. A barra some ao abrir uma conversa, como no WhatsApp. Os botões redondos do topo (⋯ e +) não foram incluídos por não terem função."},
  ]},
  {v:"0.17.9", data:"2026-10-29", titulo:"App da revendedora: SorellyChat no estilo do WhatsApp", itens:[
    {tipo:"melhoria", area:"App da revendedora", txt:"SorellyChat agora abre a tela Conversas no estilo do WhatsApp: título grande e uma linha por contato (foto redonda, nome, última mensagem, hora e contador verde), sem cartões. A conversa com a representante vem primeiro; quem tem mensagem recente sobe. Tocou na linha, abre a conversa; o voltar da conversa leva de volta à lista e o voltar da lista leva à página inicial. Substitui a abertura direta da 0.17.8."},
  ]},
  {v:"0.17.8", data:"2026-10-29", titulo:"App da revendedora: SorellyChat abre direto na conversa", itens:[
    {tipo:"melhoria", area:"App da revendedora", txt:"Ao tocar em SorellyChat, o app abre direto a conversa com a representante dela (sem representante, abre o SAC). A lista de contatos que aparecia antes saiu. O botão voltar da conversa leva à página inicial."},
  ]},
  {v:"0.17.7", data:"2026-10-29", titulo:"App da revendedora: botão Visualizar catálogo em primeiro lugar", itens:[
    {tipo:"melhoria", area:"App da revendedora", txt:"O botão Compartilhar catálogo saiu da página inicial e o cartão Catálogos também. No lugar ficou um só botão dourado, Visualizar catálogo, em primeiro lugar da lista, que abre o catálogo."},
  ]},
  {v:"0.17.6", data:"2026-10-29", titulo:"App da revendedora: página inicial mais compacta e sem informativos", itens:[
    {tipo:"melhoria", area:"App da revendedora", txt:"Página inicial compacta: cartões (Cobranças, Kit novo, Catálogos e os outros), SorellyChat e Compartilhar catálogo com fonte e altura menores. O topo preto subiu: nível menor e Vendido, Acerto e Comissão lado a lado em uma linha só (antes eram três linhas, ocupando metade da tela). O rótulo do Acerto não mostra mais o traço quando falta a data."},
    {tipo:"melhoria", area:"App da revendedora", txt:"Informativos saíram do app da revendedora: o cartão e o aviso que abria sozinho (Regras do acerto) foram retirados. As regras continuam no cartão Regras e comissões."},
  ]},
  {v:"0.17.5", data:"2026-10-29", titulo:"Solicitações de melhorias: lista com conversa ao lado e só Marcus e Leonardo respondem", itens:[
    {tipo:"melhoria", area:"Melhorias", txt:"Tela refeita (layout 1): lista de pedidos à esquerda e, ao lado, a conversa ou a nova solicitação, sem barra dourada. Quem responde abre em Todas; a resposta aparece marcada."},
    {tipo:"novo", area:"Melhorias", txt:"Primeiro pedido real: o da Michele (kits novos, só 1 de 9 aparecia). Ao abrir um pedido que tem foto, a foto abre grande na hora; clique ou Esc para fechar."},
    {tipo:"melhoria", area:"Melhorias", txt:"Tela em listagem completa: Data, Setor, Funcionária, Título, Tela, Situação, Conversa do Claude e Respostas. Ordenar por data, funcionária, setor ou situação e agrupar por setor ou funcionária. O pedido abre em janela."},
    {tipo:"novo", area:"Melhorias", txt:"Topo com 4 blocos (só Marcus e Leonardo): setores, funcionárias e telas que mais pedem (clicar filtra) e a fila Esperando resposta, com os dias de espera."},
    {tipo:"novo", area:"Melhorias", txt:"Coluna Conversa do Claude: o Marcus ou o Leonardo anexam o link ou o nome da conversa de cada pedido; os outros não veem a coluna."},
    {tipo:"melhoria", area:"Melhorias", txt:"Situações agora: Em análise, Mudança feita, testar e Recusada (pedido novo já nasce Em análise; o resto se conversa no chat). Saiu Nova e Cancelada; entrou o botão Excluir, com a pergunta Tem certeza que quer excluir?"},
    {tipo:"melhoria", area:"Melhorias", txt:"Chat do pedido no estilo do WhatsApp (fundo escuro, balões com hora, foto da pessoa puxada do SorellyChat, campo redondo e botão verde) e janela com borda dourada. Pedido com mais de uma foto ganha os botões anterior e próxima foto; a nova solicitação aceita até 4 fotos."},
    {tipo:"melhoria", area:"Melhorias", txt:"Janela do pedido (layout 1): menor, com quem pediu, a tela com link e o print grande à esquerda (amplia com um clique) e o chat à direita, que já começa com o que a pessoa escreveu no pedido."},
    {tipo:"correcao", area:"Financeiro · Negociações", txt:"Vencimento das parcelas mês a mês: agora cai no mesmo dia do mês seguinte ou, se o mês é mais curto, no último dia (31/12, 31/01, 28/02, 31/03, 30/04...). Antes 31/01 + 1 mês virava 03/03 e o Nickolas digitava à mão. Data que não existe (31/04) não salva mais."},
    {tipo:"melhoria", area:"Financeiro · Negociações", txt:"Parcelas do pedido: fonte um pouco menor e coluna do valor maior, para o valor aparecer inteiro (R$ 1.733,25)."},
    {tipo:"novo", area:"RH", txt:"Colaboradores: campo Horário de saída ao lado da entrada (a lista mostra 08:00–18:00). O horário do SorellyChat vem daí: o RH do sistema novo passa a ser a fonte, sem olhar o admin antigo."},
    {tipo:"melhoria", area:"SorellyChat", txt:"Horário das funcionárias copiado do admin de produção: entrada e saída reais de cada pessoa (por exemplo 08:00 às 17:00 para quem trabalha de segunda a sábado e 08:00 às 18:00 de segunda a sexta), em vez de calcular. 68 pessoas conferidas; quem não tem saída no admin segue a conta."},
    {tipo:"novo", area:"SorellyChat", txt:"Grupos: só o Marcus cria grupo (botão Novo grupo some para os outros e o servidor recusa). Os grupos por setor e os que ligam setores são montados por ele."},
    {tipo:"correcao", area:"Contas", txt:"Thalyanny (antes escrita Thaylianny): nome, login (thalyanny), e-mail interno e senha provisória corrigidos na conta; nome corrigido na lista de pessoas, RH e chat."},
    {tipo:"correcao", area:"SorellyChat", txt:"Horário das funcionárias: quem trabalha de segunda a sexta agora sai 10 horas depois da entrada (08:00 sai às 18:00, 07:30 às 17:30...). Antes dava 17:48, 17:18 e outras saídas quebradas. Quem trabalha de segunda a sábado continua com 8h20 depois da entrada."},
    {tipo:"melhoria", area:"Melhorias", txt:"Nova solicitação agora é o mesmo chat de quem responde: fixo no alto só o link da tela; o print colado com Ctrl+V já aparece na conversa como mensagem sua (até 4); escreve e envia, e o pedido nasce com esse chat. O Ctrl+V entrava duas vezes e foi corrigido."},
    {tipo:"melhoria", area:"Melhorias", txt:"Ao clicar no pedido abre só um chat: sem coluna do lado. Fixo no alto ficam o ícone que abre a tela e o lugar da conversa do Claude (só Marcus e Leonardo); embaixo, o chat começa com o que a pessoa escreveu e o print."},
    {tipo:"melhoria", area:"Melhorias", txt:"Janela do pedido: a foto aparece só no chat, um pouco maior, com Ampliar, Copiar e Salvar embaixo dela. A coluna da esquerda ficou só com quem pediu, a tela e a conversa do Claude, e o chat ficou mais largo."},
    {tipo:"correcao", area:"Melhorias", txt:"O print que a pessoa colou no pedido tinha sumido de dentro do chat; voltou na primeira mensagem (um ou mais prints). A foto da pessoa, a mesma do SorellyChat, aparece em toda mensagem (também nas minhas), na janela (Pedido de) e na coluna Funcionária da lista."},
    {tipo:"melhoria", area:"Melhorias", txt:"Tela do pedido virou um ícone que abre a tela direto (na lista e na janela). Segundo pedido real: o do Nickolas (vencimento das parcelas), com a resposta do Marcus."},
    {tipo:"melhoria", area:"Melhorias", txt:"Lista: cada linha numa linha só e a situação virou uma etiqueta com borda (Em análise, Mudança feita, testar...), sem quebrar em duas linhas."},
    {tipo:"melhoria", area:"Melhorias", txt:"Nova solicitação agora é um chat, igual à janela do pedido: sem campo de título, a pessoa escreve do jeito dela, cola prints (até 4) e envia. O título sai do começo da mensagem e o pedido abre em seguida com o chat. A coluna Descrição da lista mostra o começo do que a pessoa escreveu (até 74 letras e ... no final); o texto inteiro fica no chat do pedido."},
    {tipo:"melhoria", area:"Melhorias", txt:"Lista: coluna Título virou Descrição, tudo centralizado e sem texto cortado (quebra a linha), Situação e Tela mais para a frente (Data, Setor, Funcionária, Situação, Tela, Descrição, Conversa do Claude) e a coluna Resp. saiu."},
    {tipo:"melhoria", area:"Melhorias", txt:"Cores: a situação só tem cor na coluna Situação da lista; no menu, no topo da janela e na barra de teste fica tudo normal. A barra do cabeçalho da lista (Data, Setor, Funcionária...) ganhou cor azul."},
    {tipo:"melhoria", area:"Melhorias", txt:"Fluxo simples dos pedidos: Marcus e Leonardo marcam Em análise, Mudança feita, testar (já executei, pode testar) ou Recusada. Do lado de quem pediu aparece Testei e aprovei (Concluída) ou Testei, precisa melhorar (Precisa de melhoria, com o que falta no chat); aí Marcus e Leonardo continuam. Saíram as situações extras."},
    {tipo:"melhoria", area:"Melhorias", txt:"(substituída pelo fluxo acima) Oito situações em dois grupos (Andamento: Em análise, Precisa de mais informação, Aprovada, Em andamento, Mudança feita, testar; Encerrado: Concluída, Para depois, Recusada), cada uma com uma dica curta no menu."},
    {tipo:"melhoria", area:"Melhorias", txt:"Tela mais compacta: topo com 4 cartões de 3 linhas e filtros numa linha só (busca, situação, setor, funcionária, ordenar, agrupar)."},
    {tipo:"melhoria", area:"Melhorias", txt:"Janela do pedido maior. No alto fica só a situação atual: clicar abre para baixo, escolhe a situação e escreve o que foi feito (vai para o chat); Excluir pedido fica dentro desse menu. Todas as fotos do pedido aparecem já, grandes, uma embaixo da outra."},
    {tipo:"novo", area:"Melhorias", txt:"Foto do pedido com três botões: Ampliar, Copiar (para colar no Claude) e Salvar. Salvar abre a janela de salvar já com o nome da tela (melhoria-projetos-kits-novos-foto-1.jpg) e mostra Salvo. Situação e conversa do Claude mostram aviso de salvo."},
    {tipo:"melhoria", area:"Melhorias", txt:"Só o Marcus e o Leonardo respondem e mudam a situação. Nickolas e Lucas passam a só pedir e acompanhar os próprios pedidos."}
  ]},
  {v:"0.17.4", data:"2026-10-29", titulo:"Kits novos: o kit direcionado chega no app da representante em qualquer aparelho", itens:[
    {tipo:"correcao", area:"Kits novos", txt:"Pedido da Michele: ao solicitar 9 kits para a Jessica Tobias só 1 aparecia. O kit direcionado ficava só no navegador de quem pediu. Agora vai para o servidor (módulo kn, uma chave por kit) e chega no app da representante em qualquer aparelho."}
  ]},
  {v:"0.17.2", data:"2026-10-29", titulo:"Contas a pagar: já pago e falta pagar vêm direto da DevMaster", itens:[
    {tipo:"correção", area:"Financeiro · Contas a pagar", txt:"O alto da tela (Já pago e Falta pagar) deixou de copiar o admin antigo e passou a ler a DevMaster pelo servidor. A data do pagamento é a data de débito."}
  ]},
  {v:"0.17.3", data:"2026-10-28", titulo:"Conta da Hellen (Link de pagamento, Compras e Cadastro)", itens:[
    {tipo:"novo", area:"Acessos", txt:"Grupo \"Link, compras e cadastro\" (uma pessoa: Hellen). Abre Link de pagamento e maquininhas, Relatório de links, Comissão do Link, Compras e estoque, Base de revendedoras, Cadastro, Aprovação de cadastros, Desempenho do cadastro e Indicações. Não abre Kit novo."},
    {tipo:"novo", area:"Acessos", txt:"Conta criada com login pelo nome (sem e-mail) e senha provisória, visível na tela Contas em \"Senhas para enviar\". Script: scripts/criar-conta-hellen.mjs."},
  ]},
  {v:"0.14.22", data:"2026-10-28", titulo:"Manual da representante: Seu pagamento e reposição R$ 15", itens:[
    {tipo:"melhoria", area:"Representantes", txt:"A comissão por reposição entregue é R$ 15,00 (o R$ 20,00 de 20/10 saiu). Igual ao valor já usado em Encomendas e reposições."},
    {tipo:"novo", area:"Manual da representante", txt:"Nova seção \"10. Seu pagamento\": comissão de 8%, quando libera, datas dos grupos A e B, corte às 13h, kit novo, reposição e combustível. O manual passou a ter 12 páginas, no PDF e nas imagens do botão \"Regras e comissões\" do app da representante."},
    {tipo:"correção", area:"Manual da representante", txt:"Página 3 (última linha da taxa cortada pelo rodapé) e linha \"Venda mínima\" do resumo (passava da margem) corrigidas."},
  ]},
  {v:"0.14.21", data:"2026-10-28", titulo:"Comissões: aba Kit novo e desistência (teste do novo fluxo)", itens:[
    {tipo:"novo", area:"Comissões", txt:"Aba \"Kit novo\" (ao lado de Representantes): uma linha por revendedora entregue, com entrega (R$ 25), 1º acerto, valor do acerto, 2% e total, mais a situação (esperando entrega, esperando o 1º acerto, falta confirmar, confirmado, desistência)."},
    {tipo:"novo", area:"Comissões", txt:"Botão Desistência (financeiro): o R$ 25 zera e a Rep. Kit Novo recebe só a gasolina; dá para desfazer."},
  ]},
  {v:"0.17.2", data:"2026-10-28", titulo:"Solicitações de melhorias", itens:[
    {tipo:"novo", area:"Melhorias", txt:"Nova tela para todo funcionário pedir uma mudança no sistema: título, o que mudar, a tela (já vem preenchida com a última tela aberta) e print opcional (vira JPEG pequeno). Quem pede, setor e data ficam salvos."},
    {tipo:"novo", area:"Melhorias", txt:"Cada solicitação é uma conversa: quem pediu e a Diretoria trocam mensagens, com Ctrl+V para colar print da tela (ou botão Anexar), em balões."},
    {tipo:"novo", area:"Melhorias", txt:"Marcus, Nickolas, Lucas e Leonardo veem todas as solicitações, filtram, mudam a situação (Nova, Em análise, Feita, Recusada) e respondem. Cada funcionário vê só as suas. Os pedidos ficam no servidor (módulo mel), um por registro."}
  ]},
  {v:"0.17.1", data:"2026-10-28", titulo:"Atendimento interno · Listagens com a agenda da Tamara, média de vendas e WhatsApp", itens:[
    {tipo:"novo", area:"Atendimento interno", txt:"Listagens: cada dia mostra as revendedoras agendadas pela Tamara (lidas da DevMaster, atualizadas ao abrir e a cada 10 minutos). Atender cria o atendimento com as condicionais reais e abre a calculadora."},
    {tipo:"novo", area:"Atendimento interno", txt:"Coluna Média de vendas na Listagem: venda atual (quando chega da DevMaster) mais as 2 últimas vendas; sem a atual, as últimas. Coluna WhatsApp com o número e botão que abre a conversa."},
    {tipo:"melhoria", area:"Atendimento interno", txt:"Revendedoras: a lista se atualiza sozinha (quem virar vendedor Sorelly 02 entra como A contatar), coluna WhatsApp, card maior, nome em fonte padrão, botão Enviar regras no WhatsApp, calendário e horários do dia (3 por horário, 15 por dia, sábado até 11h)."},
    {tipo:"novo", area:"Kits novos", txt:"Ao solicitar o kit, a Michele pode escolher Sorelly (atendimento interno): a revendedora entra na lista da Tamara com a marca Kit novo."}
  ]},
  {v:"0.17.0", data:"2026-10-28", titulo:"Acessos por grupo, contas das equipes e chat", itens:[
    {tipo:"novo", area:"RH · Acessos", txt:"Grupos de acesso: Acesso total (Marcus e Leonardo) e Direção (sem Configuradores). Cada conta tem grupo, contato do chat e nome próprios."},
    {tipo:"novo", area:"RH · Contas", txt:"23 contas de Bipagem, Montagem e Encomendas e a tela Senhas para enviar (copiar mensagem e nova senha)."},
    {tipo:"melhoria", area:"Consolidado", txt:"Bipadora e Agendamento veem os valores da linha para conferir o acerto; a bipadora só vê a própria comissão no último dia do mês."},
    {tipo:"melhoria", area:"Sistema", txt:"Montadora e bipadora abrem direto no SorellyChat; Admin antigo só para a Diretoria; abas abertas não passam de uma conta para outra."}
  ]},
  {v:"0.16.11", data:"2026-10-28", titulo:"App da revendedora: venda em 3 passos", itens:[
    {tipo:"melhoria", area:"App da revendedora · Venda", txt:"A venda passou de 4 para 3 passos, com barra de progresso (Passo 1 de 3): 1 Peças e cliente, 2 Valor e pagamento (desconto e forma de pagar na mesma tela, com a comissão em uma linha só), 3 Confirmar venda. A tela de desconto separada saiu."},
    {tipo:"melhoria", area:"App da revendedora · Venda", txt:"Botões com nome claro (Fechar venda, Escolher pagamento, Revisar venda, Registrar venda) e avisos do que falta quando o botão está cinza. \"Registrar venda\" é o botão principal; \"Ainda vai decidir? Enviar proposta\" virou link discreto."},
  ]},
  {v:"0.16.10", data:"2026-10-27", titulo:"Aviso discreto para mensagem comum", itens:[
    {tipo:"melhoria", area:"Chat", txt:"Mensagem comum de outras pessoas não abre mais cartão na tela: toca um som Cristal baixinho, o botão S do topo pulsa uma vez e ganha o número vermelho de não lidas. Cartão grande só para o Marcus e para quem te marcar com @."},
  ]},
  {v:"0.16.9", data:"2026-10-27", titulo:"Conversa do Marcus no alto, aviso grande e situação só para a Diretoria", itens:[
    {tipo:"novo", area:"Chat", txt:"A conversa com o Marcus fica sempre no alto da lista de todo mundo (não sai, nem arquivando) e é criada sozinha para cada pessoa. Toda mensagem do Marcus aparece como aviso grande, com a mensagem inteira e resposta rápida, marcando ou não. Quem te marcou com @ também."},
    {tipo:"melhoria", area:"Chat", txt:"Situação (disponível, em reunião, ausente) só para Marcus, Nickolas e Lucas. Os demais ficam sempre disponíveis e sempre recebem os avisos. Em reunião ou ausente: silêncio total."},
  ]},
  {v:"0.16.8", data:"2026-10-27", titulo:"Sons de mensagem: Cristal", itens:[
    {tipo:"melhoria", area:"Chat", txt:"Novos sons do chat no estilo \"Cristal\": chegou mensagem (dois brilhos), alguém marcou você com @ (três brilhos subindo) e mensagem enviada (brilho curto). Escolhido pelo Marcus entre 5 opções."},
  ]},
  {v:"0.16.7", data:"2026-10-27", titulo:"Som de digitar novo: tique de vidro", itens:[
    {tipo:"melhoria", area:"Tecnologia", txt:"Novo som ao escrever, em todo campo do sistema (chat, formulários e senha): um tique fino de vidro, discreto. Espaço, apagar e Enter têm um tique próprio. Escolhido pelo Marcus entre 11 opções."},
  ]},
  {v:"0.16.6", data:"2026-10-27", titulo:"Horário dos colegas no alto da conversa do chat", itens:[
    {tipo:"correcao", area:"Chat", txt:"A faixa com dias e horário de trabalho no alto da conversa não mostrava os horários reais no site, porque eles vêm do cadastro do RH, que fica só no computador da Diretoria. Agora a Diretoria envia sozinha ao servidor só o horário de cada pessoa (nome, entrada, saída e dias) e todos veem."},
  ]},
  {v:"0.16.5", data:"2026-10-27", titulo:"Apps e \"atuar como\" também para Nickolas e Lucas", itens:[
    {tipo:"melhoria", area:"Tecnologia", txt:"A página Apps e a lista \"Atuar como outra pessoa\" valem para Marcus, Nickolas e Lucas. Os demais usam somente a própria conta."},
  ]},
  {v:"0.16.4", data:"2026-10-27", titulo:"\"Atuar como outra pessoa\" só para o Marcus", itens:[
    {tipo:"correcao", area:"Tecnologia", txt:"A lista \"Atuar como outra pessoa\" do menu da conta aparecia para toda conta de Diretoria. Agora aparece só para o Marcus. Lucas, Leonardo e os demais usam somente a própria conta."},
  ]},
  {v:"0.16.3", data:"2026-10-27", titulo:"Correção: acesso da Camilly e usuário sem espaço", itens:[
    {tipo:"correcao", area:"Tecnologia", txt:"Quem não está na lista de pessoas do sistema recebia acesso total por engano (aconteceu com a Camilly). Agora só vê o básico (Início, Rotina e Chat) até a Diretoria ligar a conta a uma pessoa da lista. Camilly e Leonardo entram na lista. A Camilly usa o grupo de acesso da Michele."},
    {tipo:"correcao", area:"Tecnologia", txt:"O usuário de entrada não tem espaço (ex.: michelebrito). Quem digitar com espaço também entra."},
  ]},
  {v:"0.16.0", data:"2026-10-27", titulo:"SorellyChat de verdade e estrelas nas abas", itens:[
    {tipo:"novo", area:"Chat", txt:"O SorellyChat passa a guardar conversas e mensagens no servidor: as pessoas conversam de verdade entre computadores (mensagem, reação, edição, grupo e conversa direta). Com o servidor ligado ele começa vazio, sem as conversas de demonstração. Atualiza a cada 4 segundos. Fotos e áudios ainda não. Exige rodar scripts/migrar-chat.mjs uma vez."},
    {tipo:"novo", area:"Tecnologia", txt:"Estrelas nas abas do topo: a ☆ fixa a tela como favorita; as favoritas ficam logo depois do Início, na ordem que a pessoa escolher (segurar e arrastar), e já aparecem quando o sistema abre. O Início fica sempre na frente e não fecha. A página Início mostra as favoritas."},
  ]},
  {v:"0.15.3", data:"2026-10-27", titulo:"Trocar a própria senha", itens:[
    {tipo:"novo", area:"Tecnologia", txt:"Menu da conta → Trocar minha senha (informa a atual e escolhe a nova, mínimo 8 letras). Cada pessoa troca a sua."},
  ]},
  {v:"0.15.2", data:"2026-10-27", titulo:"Entrar pelo nome e menu por pessoa", itens:[
    {tipo:"novo", area:"Tecnologia", txt:"A tela de entrada aceita o usuário (nome, ex.: nickolas, michele brito) no lugar do e-mail. A Diretoria define o login de cada conta em RH → Acessos e autorizações → Contas. O e-mail continua valendo."},
    {tipo:"novo", area:"Tecnologia", txt:"Menu por pessoa: cada conta pode ter só algumas telas liberadas (ou setores escondidos). Vale para o menu lateral e para os cartões do Início. Exige rodar scripts/migrar-perfil.mjs."},
  ]},
  {v:"0.15.1", data:"2026-10-27", titulo:"Apps só para o Marcus e barra de cima como a versão 3", itens:[
    {tipo:"melhoria", area:"Tecnologia", txt:"A página Apps e os apps de celular simulados (ícones do topo) aparecem só para o Marcus. Os demais, inclusive Lucas e Nickolas, não veem."},
    {tipo:"melhoria", area:"Tecnologia", txt:"Barra de cima na ordem da versão 3: busca, situação, avisos, SorellyChat e conta. Zoom, claro e escuro e Sair foram para o menu da conta."},
  ]},
  {v:"0.15.0", data:"2026-10-27", titulo:"Página inicial de todos, com mensagem de fé, e barra de cima com foto e situação", itens:[
    {tipo:"novo", area:"Tecnologia", txt:"Nova página Início (primeira tela de todo mundo, também da Diretoria): foto grande, \"Olá, nome. Seja bem-vindo!\", uma mensagem de fé que muda a cada 2 horas (50 versículos), os setores liberados, a rotina de hoje, comunicados da Diretoria, equipe agora e telas visitadas. A Diretoria vê também \"Para você decidir hoje\"."},
    {tipo:"novo", area:"Tecnologia", txt:"Barra de cima: situação clicável (Disponível, Em reunião, Ausente) e foto da pessoa, guardadas no servidor para todos verem. Menu da conta com trocar e remover a foto. O nome de exibição não muda por aqui. Exige rodar scripts/migrar-perfil.mjs uma vez."},
  ]},
  {v:"0.14.9", data:"2026-10-27", titulo:"Entrada mais rápida e olho na senha", itens:[
    {tipo:"melhoria", area:"Tecnologia", txt:"A tela de entrada já abre direto no bloco de login, sem a tela de clique e sem o mosaico (demorava e travava). As estrelas continuam fugindo do mouse, desenhadas de forma bem mais leve."},
    {tipo:"novo", area:"Tecnologia", txt:"Campo de senha com o olho para ver e esconder o que foi digitado (no Criar conta, nos dois campos)."},
  ]},
  {v:"0.14.8", data:"2026-10-27", titulo:"Botão Sair no topo e troca de pessoa só para a Diretoria", itens:[
    {tipo:"melhoria", area:"Tecnologia", txt:"Com o login ligado, o botão Sair fica sempre no topo e volta para a tela de entrada. Quem não é da Diretoria vê só o próprio nome, sem a lista para trocar de pessoa. A Diretoria continua podendo trocar para testar."},
    {tipo:"correcao", area:"Tecnologia", txt:"O Sair do seletor de acesso não saía da conta do servidor. Agora sai de verdade."},
  ]},
  {v:"0.14.7", data:"2026-10-27", titulo:"Tela de entrada nova: mosaico, estrelas e bloco com gravura", itens:[
    {tipo:"melhoria", area:"Tecnologia", txt:"A tela de e-mail e senha ganhou logo grande, linhas douradas e poeira de luz. O clique abre um mosaico de diamantes a partir do ponto clicado e mostra o bloco de login sobre estrelas cintilantes que fogem do mouse e deixam rastro. O bloco tem uma gravura fina nas bordas. Tudo desenhado por código, sem biblioteca. Respeita \"reduzir movimento\" do aparelho."},
  ]},
  {v:"0.12.69", data:"2026-10-28", titulo:"Dashboard: bloco Acertos em duas colunas, sem 94/95/96", itens:[
    "Previsão (revendedoras no início do mês, previstos primeiros, novo previstos e % dos novos previstos) e Andamento (realizados, carregar, faltam total, % do mês). Barra dourada, mesmos números da caixa Faturamento.",
    "Meta padrão passa a 99% (os acertos estão sendo adiados, quase todos os que faltam vão acontecer); valor salvo migra para 99 uma vez. Caixa Faturamento sem as partes Ano e Novembro/Dezembro: viraram o botão Previsão do ano no alto do Dashboard.",
    "O bloco é do Agendamento: clicar nele abre o Painel do Agendamento. Faltam (total) = novo previstos − realizados − carregar (303); a meta de 97/98/99% fica em linha à parte (Falta para os 98%).",
    "Previstos primeiros volta a 1.976 (o lançamento de 27/10 tinha sobrescrito para 1.886); novo item Acertos adiados até o momento (1.976 − 1.886 = 90). A parte Como o mês começou × agora saiu da caixa Faturamento, pois repetia estes números."]},
  {v:"0.12.72", data:"2026-10-28", titulo:"Média real recebida por acerto", itens:[
    {tipo:"melhoria", area:"Financeiro · Resultado do mês", txt:"Nova linha Média real recebida por acerto (pago na hora ÷ revendedoras que acertaram), ao lado da média das notas fiscais, no quadro Faturamento e na Previsão. Também mostra o % pago na hora."}
  ]},
  {v:"0.12.71", data:"2026-10-28", titulo:"Previsão com acertos realizados, Carregar e a realizar", itens:[
    {tipo:"melhoria", area:"Financeiro · Resultado do mês", txt:"A Previsão do mês mostra acertos realizados, Carregar, a realizar, total e esperados, e o Fechamento do mês traz os acertos junto com entrou, falta e resultado."}
  ]},
  {v:"0.12.70", data:"2026-10-28", titulo:"Previsão: só o que falta no mês e o fechamento", itens:[
    {tipo:"melhoria", area:"Financeiro · Resultado do mês", txt:"A aba Previsão mostra o que falta entrar e pagar no mês atual e, no fim, entrou, falta, pago, a pagar e o resultado final. Próximos meses atrás de um botão."}
  ]},
  {v:"0.12.69", data:"2026-10-28", titulo:"Resultado do mês: Faturamento e receber juntos, sem a barra", itens:[
    {tipo:"melhoria", area:"Financeiro · Resultado do mês", txt:"Saiu a barra de 6 números. Faturamento e Receber ficam lado a lado na primeira aba."}
  ]},
  {v:"0.12.68", data:"2026-10-28", titulo:"Resultado do mês mais visual", itens:[
    {tipo:"melhoria", area:"Financeiro · Resultado do mês", txt:"Faixa de 6 indicadores no topo e abas (Faturamento, Receber, Pagar, Entrou nas contas, Previsão) com uma tabela por vez. Saiu a linha dos dias lançados."}
  ]},
  {v:"0.14.37", data:"2026-10-28", titulo:"Atendimento interno · Revendedoras com calendário e horários do dia", itens:[
    {tipo:"novo", area:"Atendimento interno", txt:"Tela abre em Lista: calendário do mês (segunda a domingo) e, ao lado, os horários do dia escolhido, com a mesma altura. Botão Calendário mostra o mês inteiro com a listagem dentro de cada dia e navega entre meses."},
    {tipo:"novo", area:"Atendimento interno", txt:"Regras da agenda: até 3 por horário, 15 por dia, horários de 1 hora das 08h às 18h; sábado só até 11h (máximo 9); domingo sem atendimento. Horário livre (+ livre) abre a escolha da revendedora sem data marcada."},
    {tipo:"melhoria", area:"Atendimento interno", txt:"Tabela centralizada, barra de degradê dourado com linhas de corte, coluna Qtd. (condicionais ativas), Data do kit e Acerto previsto. Sem barra de filtros: clique no título da coluna para filtrar; a coluna filtrada fica sublinhada."}
  ]},
  {v:"0.14.36", data:"2026-10-28", titulo:"Atendimento interno · card da revendedora com registro por opções, multa 5/8/15 e regras novas", itens:[
    {tipo:"novo", area:"Atendimento interno", txt:"Card da revendedora (nome, bolinha e número · resumo · registros · condicionais ativas) abre por cima da lista, compacto, e fecha com Esc. O registro da Tamara é um bloco só que vai trocando de opções passo a passo (O que aconteceu › Por quê? › Novo dia e hora › Quem autorizou), sem campo grande; o texto é opcional, de uma linha, com corretor."},
    {tipo:"novo", area:"Atendimento interno", txt:"Registro estruturado: 1ª, 2ª e 3ª tentativa, acerto marcado, remarcado, não veio, desmarcado, quer vir, representante pediu o kit, mudou o ciclo, troca pendente, passou para outra pessoa. Motivo obrigatório em remarcado, não veio e desmarcado. Cada registro guarda quem falou com ela e quem registrou."},
    {tipo:"novo", area:"Atendimento interno", txt:"Multa pela regra do sistema: 1ª remarcação −5 pontos de comissão e −15% do brinde, 2ª −8 e −50%, 3ª ou mais −15 e −100%; isenta (autorizada por Marcus, Lucas, Nickolas ou Ana Maria) não conta. As remarcações vão para a listagem do dia e a calculadora do acerto já aplica. Botão copia o aviso de remarcação para a revendedora."},
    {tipo:"novo", area:"Atendimento interno", txt:"Enviar regras novas: copia a mensagem, abre o PDF GUIA-DA-REVENDEDORA, registra o envio e carimba a revendedora com a versão em vigor: o próximo acerto dela vale com as regras novas."},
    {tipo:"novo", area:"Atendimento interno", txt:"O histórico de anotações da DevMaster (todas as condicionais, também as fechadas) entra já classificado nessas opções ao abrir o card; condicionais ativas e expositores vêm da DevMaster. Segunda condicional bipada depois do kit aparece como Kit extra."},
    {tipo:"melhoria", area:"Sistema", txt:"O navegador guarda só a anotação mais nova da DevMaster de cada revendedora (o resto se busca de novo), para não estourar o espaço de 8 MB."},
  ]},
  {v:"0.12.68", data:"2026-10-28", titulo:"SorellyChat no visual do WhatsApp claro", itens:[
    "Conversas com fundo bege, balão branco (recebida) e verde claro (enviada), igual ao WhatsApp. Vale na tela cheia e no balão do canto.",
    "O fundo escuro antigo (Joias douradas) saiu; quem usava passa para o WhatsApp claro.",
    "Faixa da lista em cinza, pílulas Tudo/Não lidas/Grupos, busca arredondada, caixa de digitar em pílula com + e botão preto, hora na linha do texto e fundo com desenhos suaves.",
    "Tique azul de lido saiu (só um ou dois tiques cinza). Som da tecla bem mais suave."]},
  {v:"0.12.67", data:"2026-10-28", titulo:"Resultado do mês com faturamento e Carregar", itens:[
    {tipo:"melhoria", area:"Financeiro · Resultado do mês", txt:"Quadro Faturamento (acertos, Carregar, a realizar, previsão e resultado previsto). Saiu a linha solta de saldo; a variação do saldo agora é o Resultado do mês até agora, em vermelho quando negativo."}
  ]},
  {v:"0.12.66", data:"2026-10-28", titulo:"Resultado do mês: falta pagar vem da DevMaster", itens:[
    {tipo:"correção", area:"Financeiro · Resultado do mês", txt:"O falta pagar do mês agora usa a lista de títulos em aberto lida da DevMaster (outubro R$ 160.253,95), e não o número parado do admin antigo (R$ 175.516,21)."}
  ]},
  {v:"0.12.65", data:"2026-10-28", titulo:"Contas a pagar lidas direto da DevMaster", itens:[
    {tipo:"melhoria", area:"Financeiro · Contas a pagar", txt:"Script que atualiza todos os títulos em aberto (outubro a 2027) direto da DevMaster, sem planilha. 3.792 títulos; novembro R$ 1.471.268,66 e dezembro R$ 1.500.485,63."}
  ]},
  {v:"0.14.35", data:"2026-10-28", titulo:"Atendimento interno · Revendedoras: acerto previsto, data agendada e registro de contatos", itens:[
    {tipo:"novo", area:"Atendimento interno", txt:"A tabela passou a mostrar, logo depois do nome: Acerto previsto (previsão de devolução do kit principal na DevMaster), Faltam (dias), Data agendada (\"Aguardando\" até a Tamara marcar), Hora, Situação e Último contato."},
    {tipo:"novo", area:"Atendimento interno", txt:"Card Vendas de 2026 no cadastro da revendedora (abre no mesmo lugar, sem outra tela): todas as vendas fechadas do ano, com valor de venda e valor de acerto sem brinde, troca, indicação e premiação, e o total. Lê da DevMaster; só leitura. Dias só de troca ou brinde aparecem marcados \"sem venda\"."},
    {tipo:"novo", area:"Atendimento interno", txt:"Contatos e situação por revendedora (um registro só para todas as condicionais dela). O que a Tamara escreve em Obs. Gerais das condicionais na DevMaster entra como histórico; ela registra contatos novos aqui. A data escrita (AGENDADO PARA DIA 28/11 ÀS 08H) vira a Data agendada: 59 das 203 já vieram marcadas."},
  ]},
  {v:"0.14.36", data:"2026-10-28", titulo:"Previsão: razão de acertos do mês", itens:[
    {area:"Financeiro › Resultado do mês", tipo:"melhoria", txt:"Acertos dos próximos meses = revendedoras no dia 1 × razão do mês atual (previstos × 98% ÷ revendedoras do dia 1). Média: novembro +5%, dezembro +12%, janeiro +17%. Dezembro cresce só 50% do normal (campo editável) e janeiro perde 100 revendedoras. Visão geral: dezembro +12%."},
    {area:"Financeiro › Resultado do mês", tipo:"melhoria", txt:"Previsão agora vai até março (5 meses). Contas a pagar de cada mês = o maior entre o admin antigo e as contas já lançadas das planilhas do DevMaster (nov R$ 1,38 mi, dez R$ 1,43 mi, jan R$ 1,01 mi, fev R$ 0,90 mi, mar R$ 0,82 mi lançados em 22/10). Mês só com o lançado aparece com ≥: ainda entram contas novas."}]},
  {v:"0.14.35", data:"2026-10-28", titulo:"Revendedoras: aba Condicional (papel assinado)", itens:[
    {tipo:"novo", area:"Revendedoras", txt:"Nova aba Condicional: o papel da condicional copiado do exemplo da DevMaster (cabeçalho, termo, folha de anotação do acerto) com o texto novo. Termo em 7 cláusulas (minuta de 26/10; peças para troca ficou de fora até a política de trocas) e nota promissória revisada pelo advogado (27/10). Editor à esquerda, papel à direita, botões Salvar, Desfazer, Texto original, Copiar e Imprimir, e histórico das versões salvas. Os textos ficam em domain/condicional-modelo.js e no estado condicionalModelo."},
    {tipo:"melhoria", area:"Revendedoras", txt:"O papel real continua impresso pela DevMaster: o texto daqui é o modelo para trocar lá. A nota final do Marcus ainda será enviada."},
  ]},
  {v:"0.14.34", data:"2026-10-28", titulo:"Endereços por setor e tela, sem o /montagem", itens:[
    {tipo:"melhoria", area:"Endereços", txt:"Todas as telas passaram a ter o endereço /setor/tela (ex.: /atendimento-interno/revendedoras, /financeiro/controle-de-pagamentos). O endereço sai sozinho do menu (router/slugs.js, ENDERECO_DA_ABA). O prefixo /montagem era o nome do primeiro app e saiu."},
    {tipo:"melhoria", area:"Endereços", txt:"Os endereços antigos (/montagem/nome-da-tela e o curto /nome-da-tela) continuam abrindo e levam ao endereço novo, com o # e a busca preservados. O app de Kits novos continua em /kits-novos."},
    {tipo:"melhoria", area:"Navegador", txt:"O título da aba do navegador agora é Tela · Setor (ex.: Revendedoras · Atendimento interno)."},
  ]},
  {v:"0.14.27", data:"2026-10-28", titulo:"Menu lateral reorganizado em 3 grupos", itens:[
    {tipo:"melhoria", area:"Menu", txt:"O menu lateral virou 3 grupos, cada um fecha e abre clicando no nome (lembra a escolha): GERAL (Início, SorellyChat, Dashboard), SETORES (o resto, com botão \"Abrir tudo\") e SISTEMA (Apps, Tecnologia). \"Rotina do dia\" saiu do menu (a DevMaster vai trazer tudo automático; quando sobrar algo manual, vira uma aba só). \"CNPJs\" saiu do topo e virou uma tela dentro de Financeiro → Fiscal."},
  ]},
  {v:"0.12.64", data:"2026-10-28", titulo:"Agendamento com as representantes reais e Dashboard sem passar para novembro", itens:[
    {tipo:"melhoria", area:"Agendamento", txt:"28 representantes reais de outubro (cota e saldo dia a dia até 26/10) vindas do admin antigo, no lugar da demonstração."},
    {tipo:"melhoria", area:"Dashboard", txt:"Saiu o campo Passadas para novembro do bloco Acertos de outubro. A remarcação é feita direto na DevMaster."}
  ]},
  {v:"0.14.33", data:"2026-10-28", titulo:"Atendimento interno · Revendedoras nasce vazio", itens:[
    {tipo:"melhoria", area:"Atendimento interno", txt:"A lista de revendedoras internas foi limpa (as 32 da planilha antiga saíram). Agora só entram as revendedoras do vendedor Sorelly (02, FE e BY) pelo botão Buscar da DevMaster; a lista geral continua na aba Revendedoras."},
  ]},
  {v:"0.14.35", data:"2026-10-27", titulo:"Acertos que faltam: aba nova e Agendamento acompanhando", itens:[
    {area:"Financeiro › Faturamento › Acertos", tipo:"novo", txt:"Aba nova com feitos, Carregar, a realizar, previstos, meta 98% e histórico por dia; confere os 303 acertos com a DevMaster (kits principais abertos com data até o fim do mês, incluindo atrasados)."},
    {area:"Agendamento / Resultado do mês", tipo:"correção", txt:"Previstos de outubro 1.886 (antes 1.976) também no Agendamento e no Financeiro; salvar previstos no Faturamento agora muda a meta do Agendamento. Resultado do mês usa os 303 em vez de 162."}]},
  {v:"0.12.63", data:"2026-10-27", titulo:"Carregar zerado e 303 a realizar em outubro", itens:[
    {tipo:"correção", area:"Financeiro · Previsão", txt:"27/10: Carregar = 0 e a realizar = 303. Total do mês 1.886 acertos. Gravado no código e no FATURAMENTO-DIARIO.md."}
  ]},
  {v:"0.12.62", data:"2026-10-27", titulo:"Faturamento fixado até 27/10", itens:[
    {tipo:"correção", area:"Financeiro · Faturamento", txt:"27/10 fixado: 1.583 acertos e R$ 1.252.742,52 acumulados. Dia 27 = 119 acertos e R$ 92.183,97. Carregar de 27/10 ainda não informado."}
  ]},
  {v:"0.14.34", data:"2026-10-27", titulo:"Resultado do mês: previsão dos próximos meses", itens:[
    {area:"Financeiro › Resultado do mês", tipo:"novo", txt:"Bloco Previsão embaixo: o que ainda entra e sai no mês e em novembro, dezembro e janeiro. Média por acerto só das revendedoras (contas a receber, 3 meses fechados), % pago na hora, inadimplência antiga e funcionárias em média, a pagar do admin antigo e saldo das contas mês a mês. Alta de novembro (5%) e dezembro (10%) e média de janeiro (R$ 900) editáveis na tela. Os acertos vêm da data prevista de acerto na DevMaster (nova rota /api/acertos-previstos), meta 98%, ciclo dos kits 30/45/60 e queda de janeiro."}]},
  {v:"0.14.33", data:"2026-10-27", titulo:"Resultado do mês (Financeiro): receber × pagar e o que entrou de verdade", itens:[
    {tipo:"novo", area:"Financeiro", txt:"Nova tela Financeiro › Resultado do mês, com três quadros: Receber (DevMaster: recebido na venda e inadimplência antiga recebida, revendedoras e funcionárias separadas, mais o faturado e a inadimplência do mês), Pagar (admin antigo: já pago, falta pagar, total do mês) e Entrou de verdade nas contas (variação do saldo + contas pagas, comparada com o esperado pelo DevMaster; a diferença é dinheiro que entrou e ainda não foi baixado) e o saldo se pagar tudo o que falta no mês."},
    {tipo:"correcao", area:"Financeiro", txt:"Os saldos do admin antigo de 27/10 agora entram no estado já salvo (versão dos saldos 13)."},
  ]},
  {v:"0.14.32", data:"2026-10-27", titulo:"Atendimento interno: revendedoras do vendedor Sorelly vêm da DevMaster, com média e valor do próximo kit", itens:[
    {tipo:"novo", area:"Atendimento interno", txt:"O botão Buscar da DevMaster (Revendedoras) traz todas as revendedoras cujo vendedor é a Sorelly (código 02), lidas da API 2: 196 hoje. Entram como A contatar, ciclo de 30 dias e próximo acerto = previsão de devolução do kit principal. Quem já estava na lista só recebe as vendas reais; data, hora e situação da agendadora não mudam."},
    {tipo:"novo", area:"Atendimento interno", txt:"Colunas novas Média 3 vendas e Próximo kit: média das 3 últimas vendas sem brinde e a faixa da tabela do Configurador. Média abaixo de R$ 700 mostra Não libera."},
    {tipo:"melhoria", area:"Atendimento interno", txt:"O ciclo (30, 45 ou 60) sai do plano real de cada revendedora, e o próximo acerto é a previsão de devolução da DevMaster (já com fim de semana), não mais emissão + 30 dias exatos."},
    {tipo:"melhoria", area:"Atendimento interno", txt:"A calculadora do Atendimento Sorelly passou a usar a média das 3 últimas vendas (a de agora + as 2 anteriores), mínimo R$ 700, no lugar da média de 5 meses."},
    {tipo:"correcao", area:"Atendimento interno", txt:"A busca do vendedor Sorelly (02) passou a seguir a tela de retorno de condicionais da DevMaster: revendedora com condicional aberto do vendedor 02 e previsão até 31/12/2026, mesmo que a representante do kit principal seja outra. O vendedor Sorelly são três códigos: 02 SORELLY, FE SORELLY FUNCIONARIOS e BY SORELLY REPRESENTANTE. Hoje: 203 revendedoras, 232 condicionais, 23.401 peças e R$ 2.114.086,00, igual à tela da DevMaster."},
    {tipo:"melhoria", area:"Revendedoras", txt:"A rota /api/revendedoras aceita ?rep=02 e devolve só as revendedoras com condicional aberto daquele vendedor."},
  ]},
  {v:"0.14.31", data:"2026-10-27", titulo:"Contas a pagar: já pago e falta pagar no alto, tela mais enxuta", itens:[
    {tipo:"melhoria", area:"Financeiro", txt:"No alto de Contas a pagar ficaram três números grandes: Já pago, Falta pagar e Total do mês (com barra), lidos do admin antigo (faturamento_contas_mes, 27/10 21:03). Outubro: R$ 1.330.288,27 pagos e R$ 175.516,21 a pagar. Antes a tela somava só as contas do relatório de 22/10 (R$ 1.142.034,30 pagos)."},
    {tipo:"melhoria", area:"Financeiro", txt:"O mês virou um seletor pequeno no cabeçalho; os filtros e os cartões por CNPJ só abrem pelos botões Filtros e Por CNPJ."},
  ]},
  {v:"0.14.31", data:"2026-10-27", titulo:"Contas a receber liberada para o Financeiro", itens:[
    {tipo:"melhoria", area:"Financeiro", txt:"A tela Contas a receber agora abre para o Financeiro e para a Diretoria (antes só a Diretoria). O acerto - loja de anos anteriores aparece como Dívida antiga, em linha separada."},
  ]},
  {v:"0.14.30", data:"2026-10-27", titulo:"Contas a receber: quanto efetivamente não recebemos do acerto - loja", itens:[
    {tipo:"correcao", area:"Financeiro", txt:"O acerto - loja é pago aos poucos, todo mês. A tela agora separa o lançado em Recebido depois e Não recebido (o saldo que continua em aberto). O mapa do dinheiro tem uma faixa verde (recebido depois) e uma vermelha (não recebido)."},
    {tipo:"novo", area:"Financeiro", txt:"Bloco Quanto efetivamente não recebemos: lançado em 2026, recebido depois, não recebido de 2026 e não recebido de anos anteriores (acerto - loja de 2022 a 2025 ainda em aberto), com o total e o que entrou de acertos antigos no período."},
    {tipo:"melhoria", area:"Financeiro", txt:"Mês a mês com Recebido na venda, Recebido depois, Não recebido, % não recebido e Entrou de acerto - loja no mês (baixas da DevMaster por data de pagamento). A lista Quem ainda não pagou e a lista de pagamentos (filtro Só acerto - loja) incluem os abertos de anos anteriores."},
  ]},
  {v:"0.14.29", data:"2026-10-27", titulo:"Contas a receber: blocos CNPJs e contas e Forma de pagamento, lado a lado", itens:[
    {tipo:"melhoria", area:"Financeiro", txt:"Dois blocos lado a lado, cada linha abre e fecha ao clicar (com Abrir todos e Fechar todos): CNPJs e contas (CNPJ → conta e forma) e Forma de pagamento (forma → conta e CNPJ). A conta é só o banco (Sicredi, Safra...); Pix, Link, Crédito e Débito ficam na coluna Forma; o CNPJ tem coluna própria. Saíram banco, agência e número da conta."},
  ]},
  {v:"0.14.28", data:"2026-10-27", titulo:"Contas a receber: filtro Só acerto - loja em todos os meses", itens:[
    {tipo:"novo", area:"Financeiro", txt:"Novo filtro de situação na barra do alto: Só acerto - loja (não pagou), Só acerto - loja em aberto e Só recebido. Com o ano inteiro escolhido, a lista de pagamentos traz todos os meses de uma vez e dá para agrupar por revendedora."},
  ]},
  {v:"0.14.27", data:"2026-10-27", titulo:"Contas a receber: funcionárias pelo cadastro do cliente", itens:[
    {tipo:"correcao", area:"Financeiro", txt:"O filtro Só não funcionárias agora usa o grupo FUNCIONÁRIOS do cadastro do cliente na DevMaster (208 clientes), e não mais a lista de CPFs do RH. Revendedora negativada ou que sumiu com o kit continua revendedora. Em outubro o acerto - loja sem funcionárias caiu de R$ 66.747 para R$ 31.920."},
  ]},
  {v:"0.14.26", data:"2026-10-27", titulo:"Apps reorganizados: Representante/Revendedora e Funcionárias", itens:[
    {tipo:"melhoria", area:"Apps", txt:"A tela Apps agora tem 2 abas: \"Representante & revendedora\" (como já era) e \"Funcionárias\". Saíram os 3 apps separados de montagem, bipagem e condicionais (apareciam soltos, cada um no meio das telas do setor); no lugar entrou UM App das funcionárias só (pages/CelularFuncionarios.js, rota /app-funcionarias): a entrada é igual para todo mundo e, depois de entrar, cada pessoa vê só as tarefas do seu acesso (montagem, bipagem, condicionais, listagens, dinheiro, chat). Quem já está logado no sistema cai direto no app dela, sem escolher nada."},
  ]},
  {v:"0.14.26", data:"2026-10-27", titulo:"Contas a receber: mapa de ponta a ponta e tabela de CNPJs e contas bancárias", itens:[
    {tipo:"melhoria", area:"Financeiro", txt:"Mapa do dinheiro volta a ocupar a tela de ponta a ponta, com barras mais largas e nomes que nunca ficam um em cima do outro. Os indicadores do topo saíram e a atualização da DevMaster ficou pequena, ao lado do mês."},
    {tipo:"novo", area:"Financeiro", txt:"Tabela CNPJs e contas bancárias: cada CNPJ com todas as suas contas, o número do banco, agência e conta, a forma de pagamento, o valor recebido e a porcentagem."},
  ]},
  {v:"0.14.25", data:"2026-10-27", titulo:"SorellyChat no celular dos funcionários internos", itens:[
    {tipo:"novo", area:"SorellyChat", txt:"Montadora, bipagem e condicionais ganharam o SorellyChat dentro do próprio celular simulado: um botão redondo dourado abre o chat (mesma tela, menor) sem sair do app; \"‹ Voltar\" retorna para onde estava. Pedido do Marcus: dá para cancelar linhas de WhatsApp/telefone usadas só pra contato interno."},
  ]},
  {v:"0.14.21", data:"2026-10-27", titulo:"SorellyChat: horário + presença de volta na conversa (V1-B)", itens:[
    {tipo:"novo", area:"SorellyChat", txt:"Na conversa com um colaborador, duas linhas no topo: 1ª (todo mundo vê) — bolinha online/almoço/ausente, dias e horário de trabalho. 2ª (só Diretoria e RH) — bolinhas dos últimos 10 dias e o resumo do mês, já separando falta COM justificativa de falta SEM justificativa (além de atraso e atestado). Formato escolhido pelo Marcus entre 3 versões."},
  ]},
  {v:"0.14.25", data:"2026-10-27", titulo:"Contas a receber: mapa e recebido lado a lado, blocos completos e lista de pagamentos", itens:[
    {tipo:"melhoria", area:"Financeiro", txt:"Mapa do dinheiro na metade esquerda e o bloco Recebido nas contas (por CNPJ, por conta, por forma) na metade direita. Faixa com 8 indicadores, incluindo Em aberto no ano."},
    {tipo:"melhoria", area:"Financeiro", txt:"Blocos com mais colunas e sem nada abreviado: o texto quebra em duas linhas; nomes inteiros de representantes e contas."},
    {tipo:"novo", area:"Financeiro", txt:"No fim da tela, lista de TODOS os pagamentos do mês, linha por linha (emissão, revendedora, representante, venda, forma, titular, valor, saldo, vencimento, situação), com botão Agrupar por revendedora e filtro em cada coluna."},
  ]},
  {v:"0.14.24", data:"2026-10-27", titulo:"Média de vendas: regra completa no sistema", itens:[
    {tipo:"melhoria", area:"Revendedoras", txt:"A média das 3 últimas vendas agora segue a regra inteira do Marcus: Leilão fora, vendas do mesmo dia juntas, dia que fecha em R$ 0 não conta, só vendas de até 12 meses e quem tem menos de 3 usa as que tem. A diferença paga em bonificação conta como venda. Vale na lista de revendedoras e na ficha de cada uma. Só 2026 está carregado, como combinado."},
  ]},
  {v:"0.14.24", data:"2026-10-27", titulo:"Contas a receber no Financeiro, com mês valendo para tudo", itens:[
    {tipo:"melhoria", area:"Financeiro", txt:"A tela Contas a receber saiu de Revendedoras e foi para Financeiro › Receber (endereço /contas-a-receber)."},
    {tipo:"melhoria", area:"Financeiro", txt:"Ao escolher um mês, todos os blocos de baixo mostram só aquele mês (o bloco Por mês mostra só a linha do mês)."},
    {tipo:"novo", area:"Financeiro", txt:"Bloco único Recebido nas contas, com três visões: por CNPJ, por conta e por forma de pagamento."},
  ]},
  {v:"0.14.23", data:"2026-10-27", titulo:"Média de vendas: Leilão fora das contas", itens:[
    {tipo:"melhoria", area:"Revendedoras", txt:"Venda do vendedor EK (Leilão) não é acerto e não entra mais nas 3 últimas vendas usadas na média. O sistema passou a guardar o vendedor de cada venda; na próxima carga das vendas de 2026 (automática) o Leilão sai de todas as médias. Regra escrita em docs/negocio/MEDIA-DE-VENDAS.md. Encomendas (91) e Expositor (04) seguem como estavam: falta o Marcus decidir."},
  ]},
  {v:"0.14.20", data:"2026-10-27", titulo:"SorellyChat: resolver pendência sem precisar escrever nota", itens:[
    {tipo:"correcao", area:"SorellyChat", txt:"Marcar uma conversa como resolvida virou só um clique: tirei o \"Diga em poucas palavras como foi resolvido\" (campo obrigatório de 5 letras) de todo lugar — menu de contexto da lista, barra de status da representante e barra de situação da conversa. Agora é só Pendente ou Resolvida, sem escrever nada."},
  ]},
  {v:"0.14.19", data:"2026-10-27", titulo:"SorellyChat: corrigido o \"+\" (nova conversa) bugado", itens:[
    {tipo:"correcao", area:"SorellyChat", txt:"O painel que abre ao clicar no \"+\" (escolher setor e pessoa pra começar uma conversa) estava renderizado longe do botão, solto no fim da lista — por isso aparecia torto/bugado. Agora ele abre colado no próprio botão, igual o \"⋯\". Testado até o fim: \"+\" → escolher setor → escolher pessoa → conversa abre certinho."},
  ]},
  {v:"0.14.18", data:"2026-10-27", titulo:"SorellyChat: corrigido rolar a tela toda junto", itens:[
    {tipo:"correcao", area:"SorellyChat", txt:"Achei a causa: a altura da tela do SorellyChat era um número fixo que não contava a faixa de abas abertas/menu (quando aparece em cima). Faltando esse tanto, a PÁGINA toda ficava um pouco mais alta que a tela e rolava junto — por isso a barra de cima e o nome da pessoa na conversa pareciam subir. Agora a altura se ajusta sozinha ao que sobra da tela; só a lista de conversas (abaixo da busca) e as mensagens (abaixo do nome da pessoa) rolam — o resto fica parado."},
  ]},
  {v:"0.14.17", data:"2026-10-27", titulo:"SorellyChat: barra compacta (V1) + Almoço automático", itens:[
    {tipo:"melhoria", area:"SorellyChat", txt:"Barra de cima bem mais compacta: faixa dourada só com a logo e \"SorellyChat\"; saiu o ícone de perfil (MH), o título grande \"Conversas\" e a fileira de filtros (foram para um botão \"⋯\"). No lugar: uma bolinha + o nome da pessoa, e um botão \"Almoço\" — clica e marca; passou 1h, volta pra \"Disponível\" sozinho. A busca virou uma barra comum (cinza) abaixo da faixa dourada."},
  ]},
  {v:"0.14.16", data:"2026-10-27", titulo:"SorellyChat: saiu o quadro de horário/presença da conversa", itens:[
    {tipo:"correcao", area:"SorellyChat", txt:"O quadro de horário e presença que aparecia no topo da conversa com um colaborador saiu (pedido do Marcus, \"não precisa, quero mais limpo\"). Arquivo components/chat/chat-horario.js removido."},
  ]},
  {v:"0.14.15", data:"2026-10-27", titulo:"SorellyChat: fonte 1 px menor em tudo", itens:[
    {tipo:"correcao", area:"SorellyChat", txt:"Todos os textos do SorellyChat (lista de conversas, conversa, perfil, configurações) ficaram 1 px menores. Conferido: as faltas/atrasos de um colaborador só aparecem na conversa para quem tem a autorização \"Ver a presença dos colaboradores no chat\" (hoje Marcus, Nickolas, Lucas e Maria Claudia/RH) — já estava assim no código; o horário de trabalho continua visível para todos."},
  ]},
  {v:"0.14.14", data:"2026-10-27", titulo:"Início: topo e blocos de setor menores", itens:[
    {tipo:"correcao", area:"Início", txt:"O topo (\"Boa tarde, Marcus\", foto e versículo) estava grande demais; ficou na metade do tamanho. Os blocos de setor também encolheram (ícone, texto e espaçamento menores)."},
  ]},
  {v:"0.14.13", data:"2026-10-27", titulo:"Fechou a última aba? Abre a Início sozinha", itens:[
    {tipo:"melhoria", area:"Menu", txt:"Fechando a última tela aberta (o ✕ da aba), o sistema abre a Início automaticamente, mesmo que ela já tivesse sido fechada antes. Antes só acontecia se a Início por acaso fosse a última aba sobrando."},
  ]},
  {v:"0.14.12", data:"2026-10-27", titulo:"Previsão de faturamento: meta virou 97/98/99%, travada em 98%", itens:[
    {tipo:"correcao", area:"Faturamento", txt:"As opções de meta da previsão do mês (\"escolha quantos % dos acertos previstos\") eram 96/97/98%; viraram 97/98/99%, com 98% como valor travado. Vale no Dashboard, na Previsão de faturamento, no Mês a mês e no Crescimento de revendedoras (todos usam o mesmo cálculo)."},
  ]},
  {v:"0.14.11", data:"2026-10-27", titulo:"Dashboard: faixa de cima com divisórias e ✎ no Faturamento (V1-C)", itens:[
    {tipo:"melhoria", area:"Dashboard", txt:"A faixa de cima (Revendedoras, Faturamento, Previsão) ganhou linhas finas separando os 3 números, numa peça só. O botão de atualizar o faturamento de hoje virou um ✎ discreto no canto do número \"Faturamento até o momento\" — clicar abre o painel (Recebido, Acertos, Carregar, Atualizar hoje, Fixar) embaixo da faixa; clicar de novo ou em \"Fechar\" fecha. Escolhido entre 4 versões apresentadas ao Marcus (V1-C)."},
  ]},
  {v:"0.14.23", data:"2026-10-27", titulo:"Revendedoras: tela Contas a receber", itens:[
    {tipo:"novo", area:"Revendedoras", txt:"Contas a receber: faixa de indicadores, Mapa do dinheiro (do faturado até a conta) e blocos com listas por titular, forma de pagamento, conta, mês, quem não pagou (acerto - loja) e saldo por representante. Filtros de mês, quem (só não funcionárias ou todos) e titular. Lido da DevMaster (dmabg, dmacd, dmaao, dmaam), só leitura; a leitura roda em segundo plano e fica guardada no banco."},
  ]},
  {v:"0.14.22", data:"2026-10-27", titulo:"Revendedoras: Cadastro, Kits e vendas e Contas a receber no menu do setor", itens:[
    {tipo:"melhoria", area:"Revendedoras", txt:"As três abas saíram do alto da página e viraram palavras do menu do setor (Cadastro, Kits e vendas, Contas a receber), cada uma com o seu endereço. O título Revendedoras saiu da página e tudo subiu."},
  ]},
  {v:"0.14.21", data:"2026-10-27", titulo:"Revendedoras: título menor e filtros acima da tabela", itens:[
    {tipo:"melhoria", area:"Revendedoras", txt:"O título Revendedoras ficou menor, na mesma linha das abas, e tudo subiu. Na aba Cadastro a barra de filtros saiu do alto e fica logo acima da tabela, depois do painel."},
  ]},
  {v:"0.14.20", data:"2026-10-27", titulo:"Teste do novo fluxo do kit novo: Representante Kit Novo", itens:[
    {tipo:"novo", area:"Comissões", txt:"Teste de 60 dias (Curitiba): Configurador de comissões ganhou o bloco \"Novo fluxo\" (chave liga/desliga, entrega R$ 25, 2% para a Rep. Kit Novo e 6% para a Rep. Acerto no 1º acerto) e a lista das revendedoras marcadas com a Rep. Kit Novo de cada uma."},
    {tipo:"novo", area:"Comissões", txt:"Revendedora marcada: a entrega do kit (condicional assinada) paga R$ 25 à Rep. Kit Novo; no 1º acerto a Rep. Acerto leva 6% e a Rep. Kit Novo 2%; do 2º acerto em diante a Rep. Acerto leva a % normal. A gasolina segue o esquema das outras representantes."},
    {tipo:"melhoria", area:"Kits novos", txt:"O prazo da Michele conta do dia em que o cadastro chegou em Cadastradas, nunca da aprovação nem da criação do lead."},
  ]},
  {v:"0.14.10", data:"2026-10-27", titulo:"Dashboard: \"Hoje na empresa\" saiu; faturamento de 26/10 travado", itens:[
    {tipo:"correcao", area:"Dashboard", txt:"O bloco \"Hoje na empresa\" saiu da tela (pedido do Marcus). Continua existindo nas telas de Listagens e Painel da bipagem, só não aparece mais aqui."},
    {tipo:"correcao", area:"Faturamento", txt:"Travei o dia 26/10 com os números que o Marcus passou: R$ 1.160.952,55 recebido, 1.464 acertos, 2.105 revendedoras."},
  ]},
  {v:"0.14.20", data:"2026-10-27", titulo:"Revendedoras: painel no alto da aba Cadastro (layout A)", itens:[
    {tipo:"novo", area:"Revendedoras", txt:"Faixa com 6 números (revendedoras, idade média, cidades, tempo de casa, novas no ano, com 2 anos ou mais) e três listas com %: cidades (8 maiores e botão para ver todas, com SC, Joinville e Ponta Grossa), faixa etária e tempo de casa até mais de 5 anos. O painel acompanha os filtros da tabela."},
  ]},
  {v:"0.14.19", data:"2026-10-27", titulo:"Revendedoras: tempo de casa e faixa etária", itens:[
    {tipo:"novo", area:"Revendedoras", txt:"Aba Cadastro: colunas Faixa etária (até 25, 26 a 35, 36 a 45, 46 ou mais) e Tempo de casa (a partir da data de cadastro), filtro por faixa etária e média de tempo de casa no total do filtro."},
  ]},
  {v:"0.14.18", data:"2026-10-27", titulo:"Revendedoras: mais dados no cadastro e filtro por data", itens:[
    {tipo:"novo", area:"Revendedoras", txt:"Aba Cadastro com Idade, Nascimento, E-mail, Bairro, CEP e data de Cadastro (vindos da DevMaster; CPF e CNPJ ficam fora da tela). O total do filtro mostra a idade média."},
    {tipo:"novo", area:"Revendedoras", txt:"Filtro por data: Cadastro (aba Cadastro) e Data do kit (aba Kits e vendas)."},
  ]},
  {v:"0.14.17", data:"2026-10-27", titulo:"Revendedoras em 3 abas e vendas pela data de faturamento", itens:[
    {tipo:"novo", area:"Revendedoras", txt:"A tela agora tem três abas: Cadastro (só dados da cliente), Kits e vendas (condicionais, datas, vendas, acertos e brindes) e Contas a receber (aguardando a ligação com os pagamentos)."},
    {tipo:"correcao", area:"Revendedoras", txt:"As vendas agora são contadas pela data de faturamento (ach_datafat), a mesma do relatório do Marcus. Dia 26/10: R$ 169.911,99 de venda e R$ 111.392,72 de acerto (relatório: R$ 169.919,30 e R$ 111.220,72)."},
  ]},
  {v:"0.14.16", data:"2026-10-27", titulo:"Revendedoras: acertos e valor dos acertos", itens:[
    {tipo:"novo", area:"Revendedoras", txt:"Colunas Acertos 2026 e Valor dos acertos 2026 (acerto sem brinde) por revendedora, e tabela Mês (todas as vendas) com acertos, clientes, vendas sem brinde, valor dos acertos, brindes e % de brinde. Outubro: R$ 1.798.475,79 de venda e R$ 1.167.374,78 de acertos (relatório do Marcus: R$ 1.791.275,15 e R$ 1.160.952,55)."},
  ]},
  {v:"0.14.15", data:"2026-10-27", titulo:"Revendedoras: venda SEM brinde, brindes e % de brinde (2026)", itens:[
    {tipo:"correcao", area:"Revendedoras", txt:"O valor de venda da DevMaster somava brindes, trocas, indicações e premiações. Agora a venda é calculada pelos itens (TES): venda = S001, S501, S002 e S008; brinde = S009 e S503; troca = S006 e S504; indicação = S007 e S505; premiação por meta = S011; outros = o resto (ex.: S004). Conferido nos casos Esthefanny (R$ 1.042,00) e Tayane (R$ 800,00)."},
    {tipo:"novo", area:"Revendedoras", txt:"Colunas Total vendido 2026 (sem brinde), Brindes 2026 e % de brinde; seleção para abrir uma coluna de Brinde ao lado de cada mês. A média das 3 últimas vendas passou a usar a venda sem brinde. Aviso de progresso enquanto a carga roda."},
    {tipo:"novo", area:"Revendedoras", txt:"Ficha: nova coluna Vendas de 2026 no card (vendas fechadas, venda sem brinde, brindes, % de brinde, trocas, indicação, premiação, média e última venda) e tabela de vendas com venda bruta, brindes, trocas, indicação, premiação, venda sem brinde e % de brinde."},
    {tipo:"novo", area:"Servidor", txt:"A composição de cada venda é guardada no banco (sorelly.venda_composicao). Venda fechada não muda: cada atualização lê só as vendas novas e os últimos 60 dias (cancelamentos). Primeira carga de 2026 (19.883 vendas) levou cerca de 6 segundos."},
  ]},
  {v:"0.14.14", data:"2026-10-27", titulo:"Revendedoras: linha TOTAL com tudo em todas as tabelas", itens:[
    {tipo:"melhoria", area:"Revendedoras", txt:"A primeira linha de cada tabela é o TOTAL do que está filtrado (abas, filtros e filtros de coluna): revendedoras, condicionais, peças, valor total, expositores, média das 3 últimas vendas, total vendido no ano e cada mês. A tabela por representante ganhou as colunas Condicionais, Peças, Expositores, Média das 3 últimas vendas e as vendas por mês, e a tabela que abre dentro de cada representante também tem a linha TOTAL."},
  ]},
  {v:"0.14.13", data:"2026-10-27", titulo:"Revendedoras: mãozinha em toda a tabela e vendas de todo o ano em colunas", itens:[
    {tipo:"melhoria", area:"Revendedoras", txt:"A mãozinha aparece em toda a tabela, também sobre as linhas. Ao apertar o mouse ela fecha, o texto não seleciona e a tabela anda para o lado junto com o mouse. Clique sem arrastar continua abrindo a ficha."},
    {tipo:"novo", area:"Revendedoras", txt:"Por padrão a lista já mostra as vendas de TODO o ano (Total vendido e uma coluna por mês, de janeiro até o mês atual), indo para o lado. A seleção Vendas troca para os últimos 3 meses, todos os meses (24) ou sem colunas de vendas."},
  ]},
  {v:"0.14.12", data:"2026-10-27", titulo:"Revendedoras: corrigido erro ao abrir o filtro da coluna Média das 3 últimas vendas", itens:[
    {tipo:"correcao", area:"Revendedoras", txt:"Clicar no título da coluna Média das 3 últimas vendas derrubava a tela (erro ao montar a lista de valores do filtro). Corrigido; testados os filtros das colunas de data prevista, devolução, expositores, tempo com expositor e média das vendas."},
  ]},
  {v:"0.14.11", data:"2026-10-27", titulo:"Revendedoras: ficha em card (opção 2) com histórico de condicionais e vendas", itens:[
    {tipo:"melhoria", area:"Revendedoras", txt:"A ficha virou um card somente leitura, em três colunas (Quem é, Contato, Kit), sem campos de formulário. Selo Edição restrita: só quem tem acesso restrito poderá alterar (ainda não existe edição)."},
    {tipo:"novo", area:"Revendedoras", txt:"Embaixo do card, botão para alternar entre Condicionais (todas que a revendedora já teve, abertas e fechadas, com valor, vendido, retornado, saldo, previsão, fechamento, data do acerto e agenda), Vendas (todas as vendas/acertos com valor de venda, comissão, acréscimo, valor do acerto e pagamento) e Expositores. Linha TOTAL acima do cabeçalho."},
  ]},
  {v:"0.14.9", data:"2026-10-27", titulo:"Faturamento do dia anterior: atualização automática pela DevMaster (10h)", itens:[
    {tipo:"novo", area:"Faturamento", txt:"Todo dia às 10h (horário de Brasília) o servidor pergunta à DevMaster o faturamento do mês até ontem — notas fiscais EMITIDAS (não orçamento), TES S001 e S002, sem clientes do grupo Funcionários — e grava sozinho em faturamentoDiario[dia].recebido. Testado ao vivo em 27/10/2026: outubro até 26/10 deu R$ 243.746,10 (342 notas)."},
    {tipo:"novo", area:"Servidor", txt:"Mesmo mecanismo do total de revendedoras (instrumentation.js liga os dois relógios no boot): src/server/faturamento.js (consulta a DevMaster) e src/server/faturamento-dia.js (agenda e grava em sorelly.estado_modulo, módulo \"fatdia\"). Rota manual de emergência (só Diretoria): POST /api/faturamento/dia. PRECISA REINICIAR O SERVIDOR UMA VEZ (mesma pendência do relógio das revendedoras)."},
    {tipo:"correcao", area:"Faturamento", txt:"Só preenche o VALOR (recebido); acertos e revendedoras de cada dia continuam como já estavam — o acerto (quantidade de atendimentos) ainda não tem fonte automática definida (a confirmar com o Marcus)."},
  ]},
  {v:"0.14.10", data:"2026-10-27", titulo:"Revendedoras: ficha em formato de cadastro, mãozinha na tabela e vendas por mês em colunas", itens:[
    {tipo:"melhoria", area:"Revendedoras", txt:"A ficha da revendedora agora é um CADASTRO: seções Dados cadastrais e Situação do kit com campos rotulados, depois a tabela de condicionais, vendas por mês, modelos de expositor e observações. Saíram os blocos dourados."},
    {tipo:"novo", area:"Revendedoras", txt:"Seleção Vendas na linha de filtros: últimos 3 meses ou todos os meses (até 24) em colunas novas, com o total de cada mês na linha TOTAL DO FILTRO."},
    {tipo:"melhoria", area:"Revendedoras", txt:"Tabela com a mãozinha: segurar e arrastar para o lado vale em qualquer ponto, inclusive no cabeçalho e na linha de total. Clique sem arrastar continua abrindo o filtro da coluna ou a ficha."},
  ]},
  {v:"0.14.9", data:"2026-10-27", titulo:"Revendedoras: filtros em uma linha e média das 3 últimas vendas para todas", itens:[
    {tipo:"melhoria", area:"Revendedoras", txt:"Filtros em UMA linha só, junto da tabela: busca, Representante, Situação, Devolução, Por representante e atualizar (↻). Grupo e Modelo de expositor só aparecem nas abas de expositor. UF e quantidade de condicionais ficam no filtro de cada coluna."},
    {tipo:"novo", area:"Revendedoras", txt:"A média das 3 últimas vendas (acertos fechados) agora aparece para TODAS as revendedoras, não só as de expositor. Quem tem menos de 3 vendas mostra quantas (ex.: 1 venda); sem venda nos últimos 300 dias mostra R$ 0,00. O bloco Média por revendedora ganhou a média geral das 3 últimas vendas."},
  ]},
  {v:"0.14.8", data:"2026-10-27", titulo:"Revendedoras: parte de cima reorganizada", itens:[
    {tipo:"melhoria", area:"Revendedoras", txt:"Quatro blocos do mesmo tamanho e alinhados (Revendedoras, Condicionais por tipo, Média por revendedora, Devolução). Os blocos de expositor (grupos de modelos e só expositor) só aparecem nas abas Expositor e Só expositor. O texto de apoio saiu do título. Agrupar por representante e Atualizar foram para o bloco Filtros, junto da tabela."},
    {tipo:"correcao", area:"Revendedoras", txt:"Cada revendedora tem UM kit só (principal, kit novo e reposição são o mesmo kit). Saíram Kits por revendedora, Valor por kit, Peças por kit e a coluna Média por kit. A média passou a ser por revendedora (valor ÷ revendedoras) e há contagem de quem tem 1 condicional e 2 ou mais."},
    {tipo:"melhoria", area:"Revendedoras", txt:"Mini displays e cubos e peças de joia que vêm dentro de condicionais de expositor saíram da tela principal (ficam registrados em DECISOES.md)."},
  ]},
  {v:"0.14.7", data:"2026-10-27", titulo:"Revendedoras: data do kit e data prevista de acerto", itens:[
    {tipo:"novo", area:"Revendedoras", txt:"Colunas Data do kit (emissão da primeira condicional dos últimos 90 dias, nunca expositor) e Data prevista de acerto (a previsão de devolução dessa mesma condicional, que já vem da DevMaster). Vermelho se já passou e amarelo se vence em até 7 dias. Os mesmos dois dados aparecem no bloco Acerto da ficha."},
  ]},
  {v:"0.14.6", data:"2026-10-27", titulo:"Revendedoras: expositores, modelos agrupados, quem só tem expositor e média das 3 últimas vendas", itens:[
    {tipo:"novo", area:"Revendedoras", txt:"A lista agora puxa também as condicionais de expositor (previsão no ano 3000). Aba Expositor (901 condicionais) e aba Só expositor · sem kit (59 revendedoras esquecidas com expositor, com tempo que estão com ele). A aba Todas continua só com kits."},
    {tipo:"novo", area:"Revendedoras", txt:"Bloco Expositores · grupos de modelos: todos os dois andares juntos (460 unidades, 7 modelos), mais Display e cubo, Pulseira, Colar, Bandeja, Anel, Busto, Brinco, Peças de joia e Outros. Clicar no grupo abre os modelos; clicar no modelo filtra quem está com ele. Filtros por grupo e por modelo."},
    {tipo:"novo", area:"Revendedoras", txt:"Colunas novas: Expositores, Modelos de expositor, Tempo com expositor e Média das 3 últimas vendas (acertos fechados da DevMaster). A ficha ganhou o bloco Últimas vendas e a tabela de Modelos de expositor."},
  ]},
  {v:"0.14.8", data:"2026-10-27", titulo:"Revendedoras do dia: atualização automática pela DevMaster (18h)", itens:[
    {tipo:"novo", area:"Dashboard", txt:"O total de \"Revendedoras\" não precisa mais de ninguém preencher: todo dia às 18h (horário de Brasília) o servidor pergunta à DevMaster quantos clientes têm condicional aberto nos últimos 90 dias com devolução prevista para até 90 dias à frente, e trava o número do dia sozinho. A caixa \"Revendedoras\" virou só um status (✓ atualizado às... · automático) com um botão \"Corrigir\", fechado, para a Diretoria usar se a DevMaster cair."},
    {tipo:"novo", area:"Servidor", txt:"Novo relógio interno (instrumentation.js + src/server/revendedoras-dia.js): liga sozinho quando o servidor sobe, confere a cada 15 min e roda só 1x por dia. Grava em sorelly.estado_modulo (módulo \"revdia\"), que todo navegador já recebe pela sincronização de sempre. PRECISA REINICIAR O SERVIDOR UMA VEZ para o relógio começar a valer (só o Marcus faz isso)."},
  ]},
  {v:"0.14.7", data:"2026-10-27", titulo:"Dashboard: volta à grade e \"Hoje\" (faturamento) vira resumo + botão Atualizar", itens:[
    {tipo:"correcao", area:"Dashboard", txt:"O Marcus não gostou do formato de listagem: \"Acertos de Outubro\" e \"Bipagem de retorno\" voltaram para cartões em grade e \"Hoje na empresa\" voltou para os quadradinhos (só mais enxutos). \"Solicitações para decidir\" e \"Atendimento interno\" voltaram para a tela."},
    {tipo:"melhoria", area:"Dashboard", txt:"A caixa \"Hoje\" (recebido, acertos e carregar, na faixa de cima) fica FECHADA por padrão: mostra um resumo com os 3 números e um botão \"Atualizar\" que abre o formulário para editar. A faixa de cima (Revendedoras, Faturamento, Previsão) continua sempre visível, sem fechar."},
  ]},
  {v:"0.14.6", data:"2026-10-27", titulo:"Dashboard: Acertos, Hoje na empresa e Bipagem de retorno em formato de listagem", itens:[
    {tipo:"melhoria", area:"Dashboard", txt:"\"Acertos de Outubro\", \"Hoje na empresa\" e \"Bipagem de retorno\" trocaram os cartões em grade por LISTA: uma linha por número, rótulo à esquerda e valor à direita (mesmo formato de \"Solicitações para decidir\"). Mais fácil de ler de cima para baixo, sem blocos espalhados."},
    {tipo:"correcao", area:"Dashboard", txt:"Saíram do Dashboard os blocos \"Solicitações para decidir\" e \"Atendimento interno\" (pedido do Marcus). Solicitações continua no SorellyChat; Atendimento interno continua no setor próprio."},
  ]},
  {v:"0.14.5", data:"2026-10-27", titulo:"Revendedoras: Agrupar por representante vira uma linha por representante", itens:[
    {tipo:"melhoria", area:"Revendedoras", txt:"Agrupar por representante agora mostra UMA linha por representante (Cód., Representante com nome inteiro, Revendedoras ativas, Atrasadas, Kits novos, Reposições e Valor em aberto). Clicar abre as revendedoras dela logo embaixo e clicar de novo fecha; começa tudo fechado. Filtros e ordem das colunas funcionam nas duas tabelas. Títulos por extenso (Representante, Situação, Condicionais, Média por kit, Previsão de devolução)."},
  ]},
  {v:"0.14.4", data:"2026-10-27", titulo:"Revendedoras: ficha com blocos e tabela de todas as condicionais", itens:[
    {tipo:"melhoria", area:"Revendedoras", txt:"A ficha da revendedora agora tem 4 blocos com listas (Em condicional: valor, peças, média e saldo; Acerto: previsão, agenda, vendedores e tipos; Devolução: próxima, vencida há quantos dias e sem previsão; Cadastro: contatos, endereço e data) e uma tabela com TODAS as condicionais (código, emissão, vendedor, tipo, peças, valor, saldo, previsão de devolução, dias e agenda), com TOTAL acima do cabeçalho, centralizada e com linhas finas. Botão Copiar resumo. Celular com máscara na lista e na ficha."},
  ]},
  {v:"0.14.3", data:"2026-10-27", titulo:"Revendedoras: blocos com listas, totais em cima e tabela única com condicionais somadas", itens:[
    {tipo:"melhoria", area:"Revendedoras", txt:"Quatro blocos no topo com lista dentro: Revendedoras por representante, Condicionais por tipo (condicionais, peças e valor), Médias (valor e peças por kit, kits por revendedora) e Devolução (vencidas, 7 dias, 30 dias, depois, sem previsão). Abas por tipo e bloco Filtros. Os números mudam com a aba e com os filtros."},
    {tipo:"melhoria", area:"Revendedoras", txt:"Tabela única, sem páginas, centralizada e com linhas finas: celular, situação, quantidade de condicionais, peças, valor total, média por kit, devolução e tipo. A linha TOTAL DO FILTRO fica acima do cabeçalho e cada representante tem uma linha com a soma do grupo. O servidor passou a devolver as condicionais de cada revendedora na lista."},
  ]},
  {v:"0.14.2", data:"2026-10-26", titulo:"Faixa de telas abertas em todas as telas, inclusive fora de setor", itens:[
    {tipo:"melhoria", area:"Menu do setor", txt:"Conferidos todos os 22 setores do menu do Admin e os 8 do sistema Marcus: todos mostram a faixa de telas abertas. Telas que não estão em nenhum setor (Configurador, Configurador de comissões, Painel dos acertos, Metas do Agendamento, Regras de reposição e outras) entram na faixa com o setor Sistema."},
    {tipo:"correcao", area:"Menu do setor", txt:"A lista de abas é separada por modo: telas do sistema Marcus não aparecem no Admin e as do Admin não aparecem no Marcus."},
  ]},
  {v:"0.14.1", data:"2026-10-26", titulo:"Telas abertas de todos os setores na mesma faixa, com o setor em cima", itens:[
    {tipo:"melhoria", area:"Menu do setor", txt:"A faixa de telas abertas agora é UMA só para todos os setores (até 8). Cada aba mostra o setor em cima e a tela embaixo, com uma barrinha na cor do setor. Dá para abrir telas de Financeiro, RH, Atendimento interno etc. e alternar entre elas. Clicar numa aba leva ao setor dela: o ícone grande do topo e o menu passam para esse setor. A aba atual fica dourada cheia, com linha clara embaixo. Vale para todo setor (inclusive Agendamento, Atendimento interno e os de uma tela só, como Dashboard), pois é uma peça só (barra-menu.js + App.js)."},
  ]},
  {v:"0.14.0", data:"2026-10-26", titulo:"Revendedoras: base lida da DevMaster", itens:[
    {tipo:"novo", area:"Revendedoras", txt:"Nova entrada Revendedoras no menu: lista das revendedoras com condicional aberto e previsão de devolução em 2026 (2.106 hoje), lida da DevMaster só para leitura. Colunas Cód. da representante, Representante, Revendedora e Cidade / UF; cada coluna tem filtro e ordem como planilha e a largura do maior texto; botão Agrupar por representante."},
    {tipo:"novo", area:"Revendedoras", txt:"Ficha da revendedora em bloco inteiro: cadastro e condicionais em aberto da última para a primeira, com o tipo de cada uma (kit principal, kit novo, reposição, expositor, encomenda). Vendedor 04 (Expositor) e 91 (Encomendas) não contam como representante. Por ora só a Diretoria abre."},
  ]},
  {v:"0.13.29", data:"2026-10-26", titulo:"Direcionar pagamento: cartão só com a maquininha e o link de quem vendeu", itens:[
    {tipo:"correcao", area:"Financeiro · Pagamentos · Direcionar", txt:"Acerto de representante mostra só a maquininha e o link dela (vínculo em Link de pagamento). Acerto interno mostra só as maquininhas de uso interno (Getnet) e os links, com o link da Getnet. Antes aparecia a lista de todas."},
  ]},
  {v:"0.13.28", data:"2026-10-26", titulo:"Direcionar pagamento: cartão com maquininha e link, sem Rotativo no Pix, contas negativas com CNPJ, Vendas com origem", itens:[
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Cartão agora escolhe entre Maquininha (inclui Getnet e Cielo da Pontual) e Link de pagamento (inclui o link da Getnet, que pede valor, parcelas e bandeira). A lista vem dos meios cadastrados em Link de pagamento."},
    {tipo:"correcao", area:"Financeiro · Pagamentos · Direcionar", txt:"O Sicredi Rotativo não recebe mais Pix: ele está dentro do Sicredi do mesmo CNPJ. Clicar no Rotativo em Contas negativas, ou a sugestão do sistema, manda o Pix para o Sicredi do CNPJ. H&O entra na lista de contas da empresa (CNPJ 67 Axis também)."},
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Contas negativas ganhou a coluna CNPJ e o botão Ver todas as contas: abre os CNPJs fechados e cada um abre ao clicar. Vendas ganhou a coluna Origem (Interno ou o nome da representante). O texto Como o Pix quita saiu."},
  ]},
  {v:"0.13.27", data:"2026-10-26", titulo:"Direcionar pagamento: dividir já abre a segunda linha e lista só de quem tem valor pendente", itens:[
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Ao escolher Dividir, a segunda linha já aparece com o valor editável, antes de escolher a conta. O botão + fica só na última linha; o ✕ tira a linha."},
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Lista de contas: Fornecedor, Representante e Prestador só aparecem com valor pendente, mostrando o devido e o prazo. Cada sócio abre divisores: Contas do sócio e Prestadores de serviço (com o devido e o prazo vindos do Financeiro familiar). Contas de prestadores (Amanda Bônus, +55, Breno...) saíram da lista de contas do sócio."},
  ]},
  {v:"0.13.26", data:"2026-10-26", titulo:"Direcionar pagamento: Inteiro/Dividir em lista e contas por CNPJ e banco", itens:[
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"A forma de pagamento (Pix, cartão) ganhou coluna própria à esquerda, e Inteiro/Dividir virou uma lista que abre e troca no mesmo lugar, igual à barra de conta."},
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Em Conta da empresa, a lista mostra duas colunas: CNPJ e Banco (antes misturava 'Unicred 34', 'Sicredi Srenity')."},
  ]},
  {v:"0.13.25", data:"2026-10-26", titulo:"Tamanho do sistema: diminuir e aumentar tudo", itens:[
    {tipo:"novo", area:"Sistema inteiro", txt:"Controle − 100% + no topo e atalhos Ctrl −, Ctrl + e Ctrl 0 diminuem ou aumentam tudo (menu, telas e textos), de 50% a 200%. O sistema lembra a escolha neste navegador. As listas que abrem por cima (menus, seletor de conta) continuam coladas no botão."},
  ]},
  {v:"0.13.24", data:"2026-10-26", titulo:"Direcionar pagamento: sugestão sempre numa conta só e texto da sugestão em duas linhas", itens:[
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"A sugestão agora é sempre UMA conta só, com o valor inteiro (a conta que mais receberia): a intenção é um pagamento só, e dividir é escolha do Lucas. A regra 8 da tela Regras do Pix foi trocada para isso (antes era só abaixo de R$ 500)."},
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"O texto da coluna Sugestão ficou no formato Conta — motivo · e o que vem depois da bolinha desce para a linha de baixo. O nome do pagamento com Inteiro e Dividir fica alinhado com a linha da conta."},
  ]},
  {v:"0.13.23", data:"2026-10-26", titulo:"Direcionar pagamento: nome do pagamento ocupa as linhas dele e regra de menos de R$ 500", itens:[
    {tipo:"correcao", area:"Financeiro · Pagamentos · Direcionar", txt:"Pedidos com várias contas ficavam bagunçados: o nome do pagamento ficava solto no meio. Agora o nome (com Inteiro, Dividir) ocupa todas as linhas do pagamento, à esquerda, e as contas ficam alinhadas à direita. Enquanto é só sugestão, não aparecem as linhas extras de Adicionar conta e Soma."},
    {tipo:"novo", area:"Financeiro · Pagamentos · Regras do Pix", txt:"Regra nova (8): valor da parte abaixo de R$ 500 = a sugestão é uma conta só, com o valor inteiro (a conta que mais receberia na sugestão)."},
  ]},
  {v:"0.13.22", data:"2026-10-26", titulo:"Direcionar pagamento: pedidos com várias contas sugeridas agora têm a barra de conta", itens:[
    {tipo:"correcao", area:"Financeiro · Pagamentos · Direcionar", txt:"Quando o sistema sugeria mais de uma conta (ex.: Maria Eduarda, Ingrid, Bianka, Cristiane, Jean, Josiele, Thalita) a linha não mostrava a barra para escolher a conta. Agora cada conta sugerida aparece numa linha com a sua barra (editável), o valor e a sugestão própria daquela conta. O ✓ aceita todas, e Inteiro e Dividir funcionam nesses pedidos."},
  ]},
  {v:"0.13.21", data:"2026-10-26", titulo:"Direcionar pagamento: sem o texto definido e coluna de ações estreita", itens:[
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Saiu o texto verde definido ao lado do pagamento (só aparece o que falta, se faltar). A coluna do ✓ ficou estreita (64 px) e o botão Editar virou um ícone ✎, para sobrar mais espaço para a Sugestão."},
  ]},
  {v:"0.13.21", data:"2026-10-26", titulo:"Dashboard e topo padronizado em todos os setores", itens:[
    {tipo:"melhoria", area:"Dashboard (Visão geral)", txt:"\"Visão geral\" virou \"Dashboard\" (nome e ícone, na lateral e no título da tela). Saiu o bloco \"Ver os apps\" daqui — ele já existia como setor próprio \"Apps\" na barra lateral, que já abre os 3 apps (Revendedora, Representante, App interno) juntos. O bloco \"Hoje na empresa\" foi para dentro da 1ª coluna, logo abaixo de \"Acertos de Outubro\", e ficou menor (números de 20 px em vez de 24 px, sem a coluna de 8)."},
    {tipo:"novo", area:"Menu do setor", txt:"Os 8 setores que ainda usavam o formato antigo de topo (Atendimento interno, Materiais & Estoque, Garantia & Pós-venda, Diretoria, Jurídico, Segurança e limpeza, Marketing, Tecnologia) ganharam o `menu` padronizado (mesma peça do Financeiro/RH/Encomendas): ícone + nome do SETOR no topo, palavras do menu na ordem do fluxo, sem faixa de abas (poucas telas). Nenhuma tela mudou de lugar nem de nome."},
  ]},
  {v:"0.13.20", data:"2026-10-26", titulo:"Direcionar pagamento: tudo centralizado e linha única ocupa o bloco", itens:[
    {tipo:"correcao", area:"Financeiro · Pagamentos · Direcionar", txt:"Pagamento, Conta, Valor, Sugestão e ações ficaram centralizados (nome do pagamento, chave Inteiro/Dividir e estado no centro da coluna; ✓, Editar e ✕ também). Com um pagamento só, a linha cresce e ocupa o bloco inteiro; com mais, o espaço é dividido."},
  ]},
  {v:"0.13.19", data:"2026-10-26", titulo:"Direcionar pagamento: conta em lista que troca no mesmo lugar, sugestão fixa e pagamentos responsivos", itens:[
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Escolher a conta abre uma lista com borda dourada que troca no mesmo lugar: grupos (Conta da empresa, Família / sócio, Fornecedor, Representante, Prestador), depois os nomes e depois as contas (CNPJ > contas do CNPJ; Marcus > Conta Marcus — Nubank, Caixa, Rebel Mode...). A seta ← no canto esquerdo volta um nível. Acima de 10 opções aparece uma busca e a lista rola, e ela cresce sozinha com o que for cadastrado. Saiu a opção Qualquer conta."},
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"O texto da coluna Sugestão agora é sempre o que o sistema sugere para aquele pagamento: não muda mais quando alguém escolhe outra conta."},
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Os pagamentos são responsivos: com um só, ele ocupa o espaço todo do bloco; com mais, o espaço é dividido e o bloco cresce quando precisa."},
  ]},
  {v:"0.13.18", data:"2026-10-26", titulo:"Direcionar pagamento: uma barra só embaixo", itens:[
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"A linha Falta enviar e a barra de baixo viraram uma barra só: Falta enviar, o resumo dos pagamentos, Usar todas as sugestões e OK · enviar ficam juntos. O bloco perde cerca de 70 px de altura."},
  ]},
  {v:"0.13.17", data:"2026-10-26", titulo:"Direcionar pagamento: conta em cascata e colunas sem aperto", itens:[
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Escolher a conta agora abre em cascata, não tudo de uma vez: primeiro o grupo (Conta da empresa, Família / sócio, Fornecedor, Representante, Prestador), depois o nome (Marcus, Anamaria, Ana Beatriz...) e, quando o nome tem contas, a conta (ex.: Marcus > Conta Marcus — Nubank ou Conta Rebel Mode). As contas dos sócios vêm do Financeiro familiar e só aparecem para quem abre o Financeiro familiar. Cartão e link mostram só os CNPJs."},
    {tipo:"correcao", area:"Financeiro · Pagamentos · Direcionar", txt:"A coluna do resumo (Vendas, A pagar, Já pago) voltou a ter largura de 310 px, sem texto apertado, e a coluna Conta ficou maior (250 px)."},
  ]},
  {v:"0.13.16", data:"2026-10-26", titulo:"Direcionar pagamento: coluna Sugestão e sem textos amarelos soltos", itens:[
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"A coluna Motivo agora se chama Sugestão (no título da tabela) e saíram a etiqueta amarela Sugestão de cada linha e o texto amarelo sugerido do meio. Ficam só o estado definido (verde) e o que falta. A coluna Sugestão ficou mais larga, para o texto caber em 2 linhas."},
  ]},
  {v:"0.13.15", data:"2026-10-26", titulo:"Direcionar pagamento: colunas centralizadas, valor em peça e ✓ no lugar de Usar", itens:[
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Conta, Valor e Motivo alinhados e centralizados (com o título de cada coluna); a conta ficou mais à esquerda e o valor mais perto dela, numa peça parecida com a etiqueta Sugestão. Linhas mais baixas: o nome do pagamento, a chave Inteiro ou Dividir e o estado ficam em duas linhas."},
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"O botão Usar virou um ✓ para aceitar a sugestão. Usar todas as sugestões foi para baixo de Falta enviar. No alto, o texto agora diz: chegou às 14h08 · pagamento aguardando há 59 min."},
  ]},
  {v:"0.13.14", data:"2026-10-26", titulo:"Direcionar pagamento: resumo numa coluna e tabela de pagamentos com Inteiro ou Dividir", itens:[
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"O resumo (Vendas, A pagar, Já pago com cada link em uma linha, Falta pagar, Falta enviar) ficou numa coluna só, mais larga e compacta. Os pagamentos viraram uma tabela alinhada (Pagamento, Conta, Valor, Motivo) e cada um tem a chave Inteiro ou Dividir. A sugestão é uma etiqueta dentro do motivo. Os botões ficaram numa barra no fim. O texto Obs. do exemplo saiu."},
  ]},
  {v:"0.12.44", data:"2026-10-26", titulo:"Dívida anterior no acerto", itens:[
    {tipo:"novo", area:"Calculadora de acertos · App da representante e Atendimento Sorelly", txt:"Quando a revendedora tem dívida de um acerto anterior, a calculadora mostra a Dívida anterior e o pagamento quita primeiro a dívida mais antiga; o resto vale para o acerto novo. Com dívida anterior só sai kit novo se tudo for quitado: ela não pode ficar devendo duas vezes seguidas. Ao registrar o acerto, a dívida antiga recebe a linha de pagamento e o acerto novo guarda o valor abatido."}]},
  {v:"0.12.43", data:"2026-10-26", titulo:"Regras de 27/10/2026: Consolidado e Inadimplência", itens:[
    {tipo:"melhoria", area:"Representantes · Consolidado", txt:"A coluna Multa mostra a multa do valor pendente, a contagem dos 15 dias (ou os dias de atraso), o aviso de kit bloqueado e o jurídico. O Total a pagar já soma a multa e o inadimplente é o que falta depois dela."},
    {tipo:"melhoria", area:"Financeiro · Inadimplência", txt:"Nova coluna Prazo (dias desde o acerto, de 15) com kit bloqueado. O saldo devedor soma a multa de 10% do pendente e a multa de atraso (1% ao dia, teto 10%), calculada pelo dia de hoje. Acertos de regras antigas continuam como antes."},
    {tipo:"novo", area:"Financeiro · Inadimplência", txt:"Etapas da pendência na coluna Prazo: No prazo, Atrasado, Jurídico (60 dias), Retirar kit (veio o próximo acerto sem pagar) e Executar nota (última negociação não cumprida). Revendedora com duas pendências abertas mostra as duas juntas, com o total."},
    {tipo:"melhoria", area:"Acerto registrado", txt:"O registro do acerto guarda os dias de quitação e as regras de prazo, para a Inadimplência não depender da versão atual."}]},
  {v:"0.12.42", data:"2026-10-26", titulo:"Regras de 27/10/2026: Configurador, textos e multa no total", itens:[
    {tipo:"novo", area:"Representantes · Configurações", txt:"Novo bloco \"Regras de 27/10/2026\" no editor das regras: média mínima (R$ 500 e R$ 700), quantas vendas entram na média, multa do valor pendente, prazo para quitar, atraso por dia e teto, dias para ir ao jurídico e a escada do acerto atrasado (comissão e brinde). Salvar cria nova versão que vale só a partir de 27/10/2026."},
    {tipo:"melhoria", area:"Regras escritas", txt:"As frases lidas na assinatura do acerto, na entrega do kit novo e no atendimento Sorelly seguem a versão: venda mínima, acerto na data, multa e prazo, brinde por pendência. Mesmo texto para Kit Normal e Prata. A tela Regras do app da representante ganhou os cartões Acerto atrasado e Venda mínima."},
    {tipo:"correcao", area:"Representantes · Configurações", txt:"A tela de Configurações passou a ficar dentro do menu Representantes → Regras, com a barra de cima do setor (faixa, telas abertas e menu). Todos os blocos do editor das regras ficaram na mesma cor (antes eram dourado, azul e roxo)."},
    {tipo:"melhoria", area:"Calculadora de acertos", txt:"A multa do valor pendente agora soma no Total a pagar e no valor restante (decisão do Marcus)."}]},
  {v:"0.12.41", data:"2026-10-26", titulo:"Calculadora do acerto com as regras de 27/10/2026", itens:[
    {tipo:"melhoria", area:"Calculadora de acertos · App da representante e Atendimento Sorelly", txt:"Para revendedora com as regras novas: dias de atraso do acerto (Normal e Prata) com a perda de comissão e brinde, dias com valor pendente com a multa de 10% e a de atraso, média das 3 últimas vendas contra R$ 500 (representante) ou R$ 700 (interno), kit novo bloqueado com média abaixo, e botão Dar nova chance no app da representante. Revendedora com regras antigas vê a tela de sempre. A conta fica em domain/acerto-derivado.js, a mesma para as duas telas."}]},
  {v:"0.12.40", data:"2026-10-26", titulo:"Regras novas do acerto: cálculo e versão de 27/10/2026", itens:[
    {tipo:"novo", area:"Regras do consignado", txt:"Nova versão das regras (vigente desde 27/10/2026): brinde da faixa de R$ 500 a 699 em R$ 44 e R$ 32 (Normal e Prata), multa de 10% sobre o valor pendente, prazo de 15 dias para quitar e atraso de 1% ao dia (teto 10%), atraso do acerto de 5% a 25% da comissão e do brinde com perda total aos 60 dias (jurídico), média das 3 últimas vendas contra R$ 500 e R$ 700. Prata e Normal passam a ter as mesmas regras; só a tabela é própria."},
    {tipo:"melhoria", area:"Cálculo do acerto", txt:"calcularAcerto devolve também pendente, multas, comissão final e valor final. Versões antigas calculam como sempre (1.368 cálculos conferidos iguais). Cada revendedora usa as regras da ENTREGA do último kit dela: sem entrega depois de 27/10, regras antigas; a entrega do kit novo carimba a versão nova."}]},
  {v:"0.13.13", data:"2026-10-26", titulo:"Direcionar pagamento: bordas de volta, cada link em uma linha e barras de conta menores", itens:[
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Voltaram as bordas douradas em cada bloco da tela, com menos espaço em volta (blocos mais largos e 6 px entre eles)."},
    {tipo:"correcao", area:"Financeiro · Pagamentos · Direcionar", txt:"Já pago mostra cada pagamento em uma linha (ex.: cada link do CNPJ 59 com o seu valor), sem juntar em × 3."},
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Cada pagamento ficou em uma linha só: nome e valor, barra da conta (270 px, mostra só o nome da conta; o tipo vira título do grupo dentro da lista), motivo, estado e botões."},
  ]},
  {v:"0.13.12", data:"2026-10-26", titulo:"Direcionar pagamento: versão 2 compacta e blocos conectados", itens:[
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Direcionar pagamento na versão 2: o resumo dos valores fica à esquerda (Vendas, A pagar, Já pago com os 3 links do CNPJ 59 agrupados, Falta pagar, Falta enviar) e, à direita, cada pagamento é uma linha baixa: nome e valor, conta numa seleção, motivo embaixo e estado (sugerido, definido). Há o botão Usar todas as sugestões. Dividir, Editar e ✕ só aparecem quando precisam."},
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Os blocos da tela ficaram conectados e ocupam quase toda a largura: sem linhas laterais nem em cima, só uma linha embaixo de cada um, com 2 px entre eles."},
  ]},
  {v:"0.13.11", data:"2026-10-26", titulo:"Direcionar: blocos do mesmo tamanho, sem rolagem e pagamentos em cartões", itens:[
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Os blocos de baixo (Contas a pagar, Contas negativas e Vendas) têm título centralizado com o resumo embaixo (cor só no valor), a mesma largura e a mesma altura, e mostram todas as linhas, sem barra de rolagem. Sem cor por bloco: o Marcus mandou manter a versão sem cores."},
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Direcionar pagamento ganhou nome centralizado em ouro e saiu o Falta direcionar do cabeçalho (ele já aparece em Confirmar). Cada forma de pagamento virou um cartão neutro, com a barra de conta ao lado do título e o estado à direita."},
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"O exemplo de 1 Pix, 2 cartões e já pago em 3 links do CNPJ 59 (Ana Paula) é o pedido mais antigo da fila e abre sozinho."},
  ]},
  {v:"0.13.10", data:"2026-10-26", titulo:"Direcionar: barra de conta ao lado de cada pagamento, partes separadas e topo fechado", itens:[
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"A barra de escolher outra conta ficou na mesma linha do título de cada pagamento (ex.: Cartão 1 · R$ 700,00), com o estado (falta definir, definido) à direita. Duas partes da mesma forma, como dois cartões, agora são separadas e cada uma tem o seu destino. Escolher outra conta numa parte já fechada divide o valor da última conta ao meio."},
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Exemplo novo (Ana Paula): já pagou R$ 1.720,00 em 3 links do CNPJ 59 e falta 1 Pix de R$ 800,00 e 2 cartões (R$ 700,00 e R$ 500,00). O já pago mostra CNPJ 59 por extenso."},
    {tipo:"melhoria", area:"Menu do setor", txt:"O topo é igual em todos os setores: o nome do setor aparece na cor do ícone dele (Financeiro azul, Agendamento roxo) e o bloco das abas abertas e a barra do menu são fechados, com linha em cima, embaixo e dos lados. O menu continua na mesma posição com ou sem abas."},
  ]},
  {v:"0.13.9", data:"2026-10-26", titulo:"Direcionar: pedido por forma de pagamento (cartão, Pix, link) e nomes completos", itens:[
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"O pedido agora vem em partes por forma de pagamento, escolhidas pela revendedora (ex.: R$ 720 em dinheiro já pago, R$ 1.500 no cartão e R$ 1.500 no Pix). Cada parte tem a sua sugestão, o seu destino e o seu estado (falta definir, definido). Saiu a barra Enviar por: quem escolhe a forma é a revendedora, não o financeiro."},
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Cartão e link só aceitam CNPJ como destino; Pix aceita fornecedor, família, representante e contas. O OK só libera quando todas as partes fecham. Fornecedor e dívida da família só entram na parte em Pix."},
    {tipo:"correcao", area:"Financeiro · Pagamentos · Direcionar", txt:"Nenhum nome de conta, fornecedor ou destino aparece abreviado: o nome completo quebra de linha em vez de cortar com reticências."},
  ]},
  {v:"0.13.8", data:"2026-10-26", titulo:"Direcionar: Valores com Já pago, Falta pagar e Quer pagar por; barra Enviar por padrão", itens:[
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"A coluna Valores mostra Vendas, A pagar, Já pago (com o como pagou logo embaixo, ex.: Dinheiro R$ 190,00), Falta pagar e Quer pagar por (Pix, Cartão ou Link). Saiu a faixa Já pagou de cima."},
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"A barra Enviar por (Pix, Maquininha, Link) virou uma barra única de três botões iguais, logo abaixo do título da coluna, igual ao padrão das outras telas. Em Confirmar, o campo virou Falta enviar. O motivo da sugestão agora quebra em duas linhas em vez de cortar."},
  ]},
  {v:"0.12.39", data:"2026-10-26", titulo:"Busca do topo com sugestões e endereço curto", itens:[
    {tipo:"novo", area:"Barra do topo", txt:"O campo do topo agora é uma busca: a partir de 4 letras (ex.: maqui) lista embaixo as telas de TODOS os setores com aquele texto, mostrando o caminho (setor › grupo). Clicar ou Enter abre a tela. Respeita o acesso da pessoa. Colar endereço continua funcionando."},
    {tipo:"melhoria", area:"Endereços", txt:"O endereço funciona sem o /montagem (ex.: /app-revendedora abre /montagem/app-revendedora). O prefixo é só o nome interno do app principal."}]},
  {v:"0.12.38", data:"2026-10-26", titulo:"Regras e comissões nos apps da representante e da revendedora", itens:[
    {tipo:"novo", area:"App da representante", txt:"Novo cartão Regras e comissões, com seletor no topo (Representante | Revendedora). A versão da representante (manual de 11 páginas) é só para ler e NÃO tem botão de salvar. A versão da revendedora tem o botão Salvar PDF para ela enviar quando a revendedora pedir as regras."},
    {tipo:"novo", area:"App da revendedora", txt:"Novo cartão Regras e comissões com o regulamento da revendedora (8 páginas) e o botão Salvar PDF."},
    {tipo:"novo", area:"Regras do acerto", txt:"Regulamento da revendedora e manual da representante com tabelas de comissão e brindes (Normal e Prata, brinde de R$ 44 e R$ 32 na faixa de R$ 500 a 699), taxa de R$ 35, multa de 10% do pendente, prazo de 15 dias, atraso do acerto até 60 dias com jurídico, remarcação, emergência, venda mínima e resumo rápido. Arquivos em folders/ e páginas em public/regras/."}]},
  {v:"0.13.9", data:"2026-10-26", titulo:"Visão geral e Previsão de caixa: ajustes pedidos pelo Marcus", itens:[
    {tipo:"melhoria", area:"Visão geral · Acertos do mês", txt:"Bloco voltou para a cor dourada do padrão (estava roxo). Entrou o cartão Carregar ao lado de Realizados e Faltam. Saiu a barra de progresso. Saiu o formulário \"Passar para Novembro\" (ficou só a linha informativa Passadas para o próximo mês, porque aqui ela não tinha efeito nenhum)."},
    {tipo:"novo", area:"Financeiro · Previsão de caixa", txt:"Faixa nova no topo com o saldo real de HOJE de cada CNPJ (Consolidado e os 5), ao lado da faixa do pior dia — para saber de qual CNPJ a previsão está falando."},
  ]},
  {v:"0.13.10", data:"2026-10-26", titulo:"Faixa de cima (menu do setor) padronizada: sempre o nome do setor, nunca sobe", itens:[
    {tipo:"correcao", area:"Menu do setor", txt:"A faixa de cima (ícone + nome, ao lado das abas abertas) mostrava o nome da TELA aberta (ex.: \"Direcionar\"). Agora mostra sempre o nome do SETOR (ex.: \"Financeiro\"); a tela aberta continua aparecendo como aba, dourada, na linha de baixo. Vale para todo setor com menu (Financeiro, Cadastro de revendedoras, Encomendas e reposições) porque é uma peça só (App.js + components/barra-menu.js) — não precisa mexer tela por tela."},
    {tipo:"correcao", area:"Menu do setor", txt:"Conferida a regra de 22/10 \"a faixa de abas não sobe quando fecha a última\": o código já reserva o espaço (31 px) com zero abas abertas. Registrado como REGRA FIXA em PADRAO-VISUAL.md para não quebrar de novo."},
  ]},
  {v:"0.13.7", data:"2026-10-26", titulo:"Direcionar: pedido em 3 passos (modelo 3B) e dívidas da família", itens:[
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Pedido aberto no modelo 3B: Valores em 4 linhas, Para onde enviar no meio e Confirmar à direita. A sugestão do sistema aparece com moldura amarela, o motivo de cada destino e o botão Usar sugestão (ou Tudo numa conta só). Saiu a tabela Regras usadas."},
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Depois de usar a sugestão, cada destino fica fechado, com R$ e os botões Editar e ✕. Editar abre o valor e vira OK. Há Voltar à sugestão, Dividir e Adicionar outra conta."},
    {tipo:"novo", area:"Financeiro · Pagamentos · Direcionar", txt:"Contas a pagar ganhou a opção Família (só para Marcus, Lucas e Anamaria): lista as dívidas dos prestadores do Financeiro familiar que têm prazo e saldo em aberto, com Vencido ou Em N d. Clicar adiciona o prestador como destino quando ele existe em Controle de pagamentos."},
  ]},
  {v:"0.13.8", data:"2026-10-26", titulo:"Nova tela: Previsão de caixa (Consolidado + por CNPJ)", itens:[
    {tipo:"novo", area:"Financeiro · Previsão de caixa", txt:"Tela nova (pedido do Marcus), palavra direta no topo do menu do Financeiro (não escondida em submenu). Parte do saldo real de hoje e desconta, dia a dia, as contas a pagar já lançadas no admin antigo (01/09 a 30/11). O previsto a receber (acertos reais de outubro por dia da semana × preço médio outubro +5%) entra em TODA visão: no Consolidado inteiro, em cada CNPJ dividido igual entre os 5 (ainda não se sabe em qual CNPJ o Pix vai cair — ajustar quando o Direcionar pagamento tiver histórico real). Linha vermelha e Situação \"Estourou\" quando passa do limite do cheque especial. Dados em domain/contas-pagar-previsto.local.js (gitignored, vem das planilhas do admin antigo — atualizar quando o Marcus mandar uma nova)."},
  ]},
  {v:"0.13.3", data:"2026-10-26", titulo:"Carga inicial protegida (quem manda nos dados)", itens:[
    {tipo:"novo", area:"Servidor", txt:"Na primeira entrada da Diretoria com o servidor ligado, o sistema não troca nenhum dado até a pessoa escolher: Este navegador manda (envia o que foi digitado) ou O servidor manda. Protege o que foi lançado antes do login."},
    {tipo:"novo", area:"Servidor", txt:"Comando npm run ver-modulos mostra quais módulos já estão no banco, a versão e o tamanho."},
  ]},
  {v:"0.13.6", data:"2026-10-26", titulo:"Pagamentos › Direcionar: pedido aberto em cima e 3 blocos embaixo", itens:[
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Layout D1: o pedido aberto sobe para o topo, com Sugestão, Para onde vai e Confirmar em 3 colunas. Embaixo ficam, lado a lado, Contas a pagar, Contas negativas e Vendas. Cada bloco só ocupa a altura do que tem; sem pedido, os 3 blocos sobem."},
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Vendas deixou de ser gigante: título e números no padrão (13 px, linha de 32 px, valores de 16 px no pedido). A fila mostra Revendedora, Forma, Direcionar e Espera, e cada venda nova entra como uma linha."},
    {tipo:"melhoria", area:"Financeiro · Pagamentos · Direcionar", txt:"Contas a pagar mostra só Falta, Limite e Situação (A pagar e Pago aparecem em Todos do mês). A nota sobre como o Pix quita ficou recolhida em Como o Pix quita."},
  ]},
  {v:"0.13.5", data:"2026-10-26", titulo:"Financeiro: menu Pagamentos com 4 telas, fontes no padrão e barra fixa", itens:[
    {tipo:"melhoria", area:"Financeiro · Pagamentos", txt:"O primeiro item do menu virou Pagamentos, com uma lista de 4 telas: Direcionar, Contas das representantes, Regras do Pix e Controle de pagamentos (que saiu de Contas). O seletor que ficava no alto da tela Direcionar saiu."},
    {tipo:"melhoria", area:"Financeiro · Direcionar", txt:"Fontes no padrão do Financeiro: texto de 13 px fixo (antes crescia até 18 px em tela grande), linhas de 32 px e números de até 20 px."},
    {tipo:"correcao", area:"Menu do setor", txt:"A barra do menu não muda mais de lugar quando a primeira aba abre ou a última fecha: a faixa das abas guarda o espaço mesmo vazia."},
  ]},
  {v:"0.13.4", data:"2026-10-26", titulo:"Financeiro familiar: 33 pagamentos aplicados; contas a pagar de novembro; rota duplicada corrigida", itens:[
    {tipo:"melhoria", area:"Financeiro familiar · Contas", txt:"O Marcus confirmou os 36 pagamentos de 20 a 26/10 levantados do admin antigo: 3 já estavam gravados (de uma atualização anterior), 15 entraram em contas que já existiam e 18 entraram em contas novas (c149 a c166, criadas agora com os dados do admin antigo). Total aplicado: R$ 8.255,18 em contas novas + o resto nas já existentes."},
    {tipo:"novo", area:"Financeiro · Contas a pagar por CNPJ", txt:"Contas a pagar de novembro lançadas por CNPJ (planilha do admin antigo, relFin004_Filial): 34 R$ 281.581,17 · 46 R$ 272.164,55 · 59 R$ 342.524,75 · 67 R$ 68.587,82 · \"Sorelly/Hess & Oliveira\" R$ 505.714,22 (lançado em \"Contas sem CNPJ\", provisório — ver DECISOES.md). Total do mês R$ 1.470.572,51."},
    {tipo:"correção", area:"Financeiro · Contas a pagar", txt:"A tela \"Contas a pagar\" (lançamento por mês e por CNPJ, antiga aba `contaspagar`) estava com o MESMO endereço de outra tela (\"Contas a pagar\" por natureza/fornecedor, aba `ctalista`) — as duas eram \"/montagem/contas-a-pagar\", então só a segunda abria. Endereço da primeira corrigido para `/montagem/contas-a-pagar-mensal`."},
  ]},
  {v:"0.13.3", data:"2026-10-26", titulo:"Financeiro familiar: Pix e repasses até 26/10", itens:[
    {tipo:"melhoria", area:"Financeiro familiar · Pix revendedoras", txt:"16 Pix novos (22 a 26/10) e 2 repasses de prestador (21 e 22/10) lidos direto do banco do admin antigo. Faltam trazer 36 pagamentos de contas e 10 contas novas que já estão no admin antigo: a descrição se repete para pessoas diferentes sem um código que identifique cada uma, então não dá para saber com segurança qual conta cada pagamento fecha (ver DECISOES.md)."},
  ]},
  {v:"0.13.2", data:"2026-10-26", titulo:"Login com criação de conta e liberação pela Diretoria", itens:[
    {tipo:"novo", area:"Login", txt:"Na tela de entrada há o botão Criar conta (nome, e-mail e senha de 8 letras ou mais). A conta nasce Aguardando e só entra depois que a Diretoria libera."},
    {tipo:"novo", area:"RH · Acessos e autorizações", txt:"Nova aba Contas: a Diretoria vê quem criou conta, liga a conta a uma pessoa do sistema, escolhe os setores e libera, bloqueia ou reativa. Liberar, bloquear ou trocar setor vale na hora."},
    {tipo:"novo", area:"Servidor", txt:"Tabela sorelly.conta, rotas de cadastro e de contas, e scripts migrar-contas e criar-admin (primeira conta da Diretoria). A tabela user do admin antigo não é tocada."},
    {tipo:"correção", area:"RH · Acessos e autorizações", txt:"A aba Quem vê o quê abria com erro por falta do grupo Cadastro de peças na lista de quem é cada perfil."},
  ]},
  {v:"0.12.61", data:"2026-10-27", titulo:"Contas a pagar até 31/10 atualizadas", itens:[
    {tipo:"melhoria", area:"Financeiro · Contas a pagar", txt:"Lista trocada pelo relatório por Natureza de 27/10: 98 títulos, R$ 157.922,46 em aberto, com o CNPJ de cada um."}
  ]},
  {v:"0.12.60", data:"2026-10-27", titulo:"Saldos das contas e revendedoras até 27/10", itens:[
    {tipo:"melhoria", area:"Financeiro · Saldos", txt:"Saldos das 29 contas de 26 e 27/10 lidos do admin antigo. Revendedoras de 27/10 = 2.106."}
  ]},
  {v:"0.12.59", data:"2026-10-26", titulo:"Caixa: histórico completo de saldos e contas pagas (01/09 a 23/10)", itens:[
    {tipo:"correção", area:"Financeiro · Caixa", txt:"Saldo das contas bancárias e contas pagas por dia lidos DIRETO do banco do admin antigo (tabelas finance_balance e faturamento_contas_diario), dia a dia, de 01/09 a 23/10 (saldo) e 01/09 a 22/10 (contas pagas) — antes só havia alguns dias soltos, estimados à mão. Esses números substituem as estimativas antigas. ACHADO: o pago de 01 a 13/10 pela leitura direta do banco é R$ 609.091,94; o relatório que o Marcus conferiu em 13/10 somava R$ 530.060,74 (diferença de R$ 79.031,20 — ver DECISOES.md). Corrigido também um bug: a tela guardava os saldos no navegador e só buscava dias novos quando a versão interna mudava, por isso o saldo de um dia antigo continuava aparecendo como 'agora' mesmo com o dado novo já salvo."},
  ]},
  {v:"0.12.41", data:"2026-10-24", titulo:"Plano 45/60: aba Alinhamento", itens:[
    {tipo:"novo", area:"Agendamento · Plano 45/60", txt:"Nova aba Alinhamento com números grandes: previsto na abertura − saídas confirmadas = previsto do mês, o previsto que o Agendamento tem agora (com aviso se não bate), saídas pelo plano e saídas lançadas à mão. Cenários (confirmadas, com análise e saídas da empresa, com listas novas, com a linha que faltava) com o alvo de 94, 95 e 96%. Números informados da conversa (92, 7, 2, 1) ficam salvos."},
  ]},
  {v:"0.12.59", data:"2026-10-27", titulo:"Contas a pagar atualizadas até 27/10", itens:[
    {tipo:"melhoria", area:"Financeiro · Contas a pagar", txt:"Lido do admin antigo: outubro pago R$ 1.330.288,27 e a pagar R$ 175.516,21; novembro R$ 1.466.105,48; dezembro R$ 1.500.381,39. Contas pagas dos dias 23, 26 e 27/10 gravadas."}
  ]},
  {v:"0.12.58", data:"2026-10-26", titulo:"Visão geral: Carregar no topo e blocos sem abre/fecha", itens:[
    {tipo:"melhoria", area:"Visão geral", txt:"Faixa de cima mostra acertos e Carregar separados. Campo Carregar ao lado do Hoje. Blocos fixos, sem seta de abrir/fechar. Corrigido: o campo Hoje partia de acertos + Carregar."},
    {tipo:"melhoria", area:"Financeiro", txt:"Revendedoras por dia de 01 a 26/10 lidas do admin antigo."}
  ]},
  {v:"0.12.57", data:"2026-10-26", titulo:"Revendedoras 26/10 e Carregar no Faturamento", itens:[
    {tipo:"correção", area:"Financeiro · Faturamento", txt:"Revendedoras em 26/10 = 2.105. A faixa de totais do Faturamento mostra o Carregar (vendas pendentes). Dias 20 a 25/10 de revendedoras ainda faltam puxar do admin antigo."}
  ]},
  {v:"0.12.56", data:"2026-10-26", titulo:"Visão geral: como o mês começou × agora, com Carregar", itens:[
    {tipo:"melhoria", area:"Visão geral · Faturamento", txt:"Bloco novo com revendedoras e acertos previstos no início do mês, previsão nova, acertos a menos, Carregar no início e agora, e vendas adiadas. Acertos realizados e Carregar aparecem separados. Carregar de 01/10 = 12."}
  ]},
  {v:"0.12.55", data:"2026-10-26", titulo:"Coluna Carregar e comparativo do início do mês", itens:[
    {tipo:"melhoria", area:"Financeiro · Faturamento", txt:"Coluna Carregar no Dia a dia e bloco Carregar na Previsão (início do mês, agora, diferença e quantas já saíram). O Carregar não entra nos acertos feitos: soma por fora."}
  ]},
  {v:"0.12.54", data:"2026-10-26", titulo:"Previsão de outubro atualizada e Carregar travado", itens:[
    {tipo:"correção", area:"Financeiro · Previsão", txt:"Hoje (26/10): 1.347 acertos e R$ 1.062.977,38. A realizar 513 até 31/10 e 34 vendas no Carregar. Total do mês 1.894 (97% = 1.837). Carregar gravado no FATURAMENTO-DIARIO.md."}
  ]},
  {v:"0.12.53", data:"2026-10-26", titulo:"Faturamento de outubro corrigido até 25/10", itens:[
    {tipo:"correção", area:"Financeiro · Faturamento", txt:"Acumulado do mês corrigido: 20/10 = 1.120 acertos e R$ 885.617,53; 21/10 = 1.175 e R$ 928.551,38; 22/10 = 1.240 e R$ 982.180,43; 23/10 = R$ 1.049.731,83. 24 e 25/10 sem faturamento. O dia a dia e a previsão recalculam sozinhos."}
  ]},
  {v:"0.12.52", data:"2026-10-24", titulo:"Direcionar pagamento: o que fatura não mistura com o que não fatura", itens:[
    {tipo:"melhoria", area:"Financeiro · Direcionar pagamento", txt:"A sugestão do sistema não mistura conta de CNPJ (fatura) com fornecedor ou representante (não fatura). Venda paga no link de um CNPJ volta para o mesmo CNPJ. Divisão manual mista mostra aviso. Opções de conta única e regras usadas viram tabela, uma linha cada. Fila sem abreviação (Interno, Representante, Maquininha)."}
  ]},
  {v:"0.12.51", data:"2026-10-24", titulo:"Direcionar: Pix, maquininha ou link, com sugestão de divisão", itens:[
    {tipo:"melhoria", area:"Financeiro · Direcionar Pix", txt:"Cada pedido tem uma forma (Pix, Maquininha ou Link), mostrada na fila. O bloco Direcionar ficou simples: o sistema sugere a divisão, o botão Usar esta divisão aplica, e OK enviar confirma. Dividir abre uma segunda conta. Maquininha e link vão para um CNPJ."}
  ]},
  {v:"0.12.50", data:"2026-10-24", titulo:"Direcionar Pix: fila enxuta, cores dos fornecedores, contas do mesmo banco juntas", itens:[
    {tipo:"melhoria", area:"Financeiro · Direcionar Pix", txt:"Fila com menos colunas (Hora, Quem, Tipo, Vendas, Pix a direcionar, Espera) e Vendas e Pix em letra grande (Pix em dourado). Fornecedores: A pagar em branco, Pago em verde, Falta em destaque (amarelo se vencido) e Situação em selo (Vencido, Em aberto, Pago). Contas negativas: as do mesmo banco e CNPJ ficam juntas (Sicredi Rotativo 34 e Sicredi Sorelly 34), marcadas com barra dourada."},
  ]},
  {v:"0.12.49", data:"2026-10-24", titulo:"Direcionar Pix: fornecedores e saldo das contas lado a lado", itens:[
    {tipo:"melhoria", area:"Financeiro · Direcionar Pix", txt:"Embaixo da fila e do pedido ficam dois blocos lado a lado: Fornecedores (botão Vencido e o que falta | Todos do mês; colunas A pagar, Pago, Falta, Limite e Situação) e Saldo das contas negativas (uma linha por conta, com saldo, limite e disponível). Clicar numa conta negativa adiciona o CNPJ dela como destino, com o nome da conta. Saiu o bloco Por CNPJ."},
  ]},
  {v:"0.12.48", data:"2026-10-24", titulo:"Direcionar Pix: fila com mais colunas, nomes curtos e bordas douradas", itens:[
    {tipo:"melhoria", area:"Financeiro · Direcionar Pix", txt:"Na fila o nome aparece só com o primeiro e o segundo nome (inteiro no pedido aberto). A fila ganhou as colunas Vendas, A pagar e Obs. (ponto amarelo quando a atendente deixou observação) e ficou mais larga. As bordas dos blocos da tela viraram douradas e mais grossas (3 px). BlocoBarra aceita borda:ouro."},
  ]},
  {v:"0.12.47", data:"2026-10-24", titulo:"Direcionar Pix: fila em tabela mais larga e alinhada", itens:[
    {tipo:"melhoria", area:"Financeiro · Direcionar Pix", txt:"A fila de pedidos ficou mais larga e virou tabela alinhada (hora, quem, tipo, atendente, já pago, Pix e espera), sem textos soltos. Os números do pedido aberto foram reduzidos para caberem sem cortar."},
  ]},
  {v:"0.12.46", data:"2026-10-24", titulo:"Direcionar Pix em 3 blocos alinhados", itens:[
    {tipo:"melhoria", area:"Financeiro · Direcionar Pix", txt:"Tela em 3 blocos: Fila de pedidos e Direcionar este Pix lado a lado, com a mesma altura e a fila com rolagem; embaixo, Falta para fechar o mês · fornecedores, em tabela alinhada (clicar adiciona como destino). Saíram os blocos Devedores e Destinos que ainda faltam."},
  ]},
  {v:"0.12.40", data:"2026-10-24", titulo:"Agendamento: Plano 45/60 em uma tela com abas e mensagens em listagem", itens:[
    {tipo:"melhoria", area:"Agendamento · Menu", txt:"O menu do Agendamento ficou sem a faixa de telas abertas (padrão dos setores com poucas telas) e com Plano 45/60 como uma palavra só. Painel, Indicações, Aprovação, Acompanhamento e Mensagens são abas visíveis dentro da tela do plano; a Aprovação usa botões de seleção para Em análise, Aprovadas, Pedidos do app e Reprovadas."},
    {tipo:"melhoria", area:"Agendamento · Plano 45/60", txt:"Mensagens prontas agora em listagem (uma linha por mensagem, como em Cadastro → Mensagens prontas): filtro por destino e busca, clicar na linha mostra o texto, Copiar na linha."},
  ]},
  {v:"0.12.43", data:"2026-10-24", titulo:"Faturamento: 23/10 fechado", itens:[
    {tipo:"melhoria", area:"Financeiro · Faturamento", txt:"23/10 fechado: 1.330 acertos, R$ 1.049.731,83 no mês, média R$ 789,27 (dia 23 = 90 acertos e R$ 67.551,40)."}
  ]},
  {v:"0.12.42", data:"2026-10-24", titulo:"Faturamento: 22/10 fechado e colunas Acertos e Média", itens:[
    {tipo:"melhoria", area:"Financeiro · Faturamento", txt:"22/10 fechado: 1.240 acertos, R$ 982.180,43 no mês, média R$ 792,08 (dia 22 = 64 acertos e R$ 53.185,05). Na visão Faturamento vs Contas a pagar entraram as colunas Acertos e Média ao lado do Dia, antes do Faturamento."}
  ]},
  {v:"0.12.45", data:"2026-10-24", titulo:"Direcionar Pix: lista Falta para fechar o mês no topo e bloco Devedores", itens:[
    {tipo:"melhoria", area:"Financeiro · Direcionar Pix", txt:"O bloco Falta para fechar o mês saiu de dentro do pedido e subiu para o topo da tela, em lista (fornecedor, falta, data limite, situação). Embaixo dele há o bloco novo Devedores, também em lista: prestadores e sócios com saldo no mês. Clicar numa linha adiciona como destino do Pix aberto."},
  ]},
  {v:"0.12.44", data:"2026-10-24", titulo:"Direcionar Pix volta ao layout anterior", itens:[
    {tipo:"melhoria", area:"Financeiro · Direcionar Pix", txt:"O Marcus preferiu o layout de antes (fila ao lado, pedido aberto à direita, fornecedores em cartões no topo do pedido e Destinos que ainda faltam embaixo). A opção A (tudo empilhado em tabelas) foi desfeita. A faixa de fornecedores continua lendo o que falta para fechar o mês."},
  ]},
  {v:"0.12.43", data:"2026-10-24", titulo:"Direcionar Pix em blocos empilhados; Faturamento abre da Visão geral", itens:[
    {tipo:"melhoria", area:"Financeiro · Direcionar Pix", txt:"Opção A do Marcus: blocos um embaixo do outro. Totais, Fornecedores em tabela de planilha (falta, data limite e situação; clicar adiciona como destino), Fila de pedidos em tabela (clicar abre o pedido) e o pedido aberto embaixo. Saiu o bloco repetido Destinos que ainda faltam."},
    {tipo:"melhoria", area:"Visão geral", txt:"Clicar em Faturamento até o momento (e em Previsão de faturamento) abre a tela Faturamento."},
  ]},
  {v:"0.12.42", data:"2026-10-24", titulo:"Direcionar Pix: fornecedores com o que falta para fechar o mês", itens:[
    {tipo:"melhoria", area:"Financeiro · Direcionar Pix", txt:"A faixa de fornecedores agora mostra o que FALTA para fechar o mês atual (A PAGAR menos PAGO) e a data limite de cada um, lido da planilha Pag Fornecedores (aba RESUMO MÊS). Antes mostrava o saldo devedor acumulado (Point R$ 395 mil). Pontual: a sugestão de Pix quita a parcela aberta mais antiga e o que passa vai para a próxima; nota do cartão (quita o 1 a 10 do mês seguinte, desconto estimado pela média dos 3 últimos meses: 7,75%). Novo script scripts/planilha-fornecedores.mjs: lê a planilha e grava os saldos (arquivo local)."},
  ]},
  {v:"0.12.39", data:"2026-10-24", titulo:"Plano 45/60 (Fase 3): mensagens, alertas e fila dos Kits novos", itens:[
    {tipo:"novo", area:"Agendamento · Plano 45/60", txt:"Nova tela Mensagens: as 20 mensagens prontas do plano (representantes, revendedoras, pós-venda, Agendamento e família) com botão Copiar. Campos de nome, N, valor e teto preenchem os [colchetes]. A mensagem 19 usa os mínimos do Configurador. A 9 fica marcada como versão antiga (R$ 700)."},
    {tipo:"novo", area:"Agendamento · Alertas", txt:"Dois alertas diários: aprovada sem contato há mais de 24 horas e nova data que chegou sem venda lançada (com a contagem). Padrão: Marcus, Nickolas, Lucas, Ana Maria, Mariana e Tamara; ajustável em Tecnologia → Avisos."},
    {tipo:"novo", area:"Agendamento · Painel do plano", txt:"Bloco Kits novos em fila, lido do app Kits novos: na fila, sem representante, com a representante, na empresa e entregues, comparado com as rotas abertas pelas saídas do mês. Só leitura."},
  ]},
  {v:"0.12.38", data:"2026-10-24", titulo:"Plano 45/60 (Fase 3 parcial): pedido de data no app da representante", itens:[
    {tipo:"novo", area:"App da representante", txt:"Botão Alterar data do acerto na tela da revendedora: nova data, prazo (só mudar a data, 45 ou 60 dias), prazo fixo, motivo e observação. Até 5 dias depois da data atual a data muda na hora; além disso o pedido vai para a Diretoria e, sem aprovação, vale a multa de remarcação. A representante vê a resposta de cada pedido."},
    {tipo:"novo", area:"Agendamento · Plano 45/60", txt:"Aprovação ganhou a aba Pedidos do app (aprovar ou reprovar). Pedido de 45/60 aprovado vira linha do plano com mínimo sugerido, sai da meta e pode ficar com prazo fixo (nunca volta a 30 dias sozinho). Mudança de data aprovada que troca de mês também ajusta a meta, sem multa."},
    {tipo:"melhoria", area:"Agendamento · Plano 45/60", txt:"Mínimo de vendas sugerido agora é por canal e prazo: representante 45 dias R$ 750 e 60 dias R$ 1.000; Sorelly 45 dias R$ 1.000 e 60 dias R$ 1.500 (substitui a grade por média). Cada indicação tem canal e prazo fixo."},
    {tipo:"novo", area:"Tecnologia · Configurador geral", txt:"Nova seção Plano 45/60: mínimos por canal e prazo, dias livres do pedido (5), média por acerto, mínimo de indicadas, teto, janela da data e crescimento mínimo."},
    {tipo:"novo", area:"Tecnologia · Avisos", txt:"Novo aviso Pedido de mudança de data (padrão Marcus, Nickolas e Lucas), ajustável em Avisos."},
  ]},
  {v:"0.12.41", data:"2026-10-24", titulo:"Direcionar Pix: fornecedores em aberto e nova ordem", itens:[
    {tipo:"melhoria", area:"Financeiro · Direcionar Pix", txt:"Campo Adicionar destino virou Enviar chave Pix. No topo do pedido aparece o resumo dos fornecedores com valor devido e data limite (vencido em amarelo); clicar no fornecedor adiciona como destino. Já pago ficou maior. Ordem do pedido: valores, Para onde vai este Pix, e embaixo a Sugestão do sistema."},
  ]},
  {v:"0.12.43", data:"2026-10-24", titulo:"Fiscal: dados até 23/10 e brilho nas mudanças", itens:[
    {tipo:"melhoria", area:"Fiscal", txt:"Faturado e ILF de cada CNPJ atualizados até 23/10/2026 (Atacadista, Serenity, Mayz e Axis). A venda que faltava entrou em Outubro, dia 21–31, e cada CNPJ ganhou uma nota de lastro \"Ajuste até 23/10\" (o ILF veio com 1 casa decimal, então o lastro é aproximado). Troque pelas notas reais quando tiver."},
    {tipo:"melhoria", area:"Fiscal", txt:"O Painel usa o brilho dourado de \"acabou de mudar\" (classe destaque-novo): a barra de totais e o bloco do CNPJ piscam quando os números mudam (Ano/Mês, nota lançada)."}]},
  {v:"0.12.40", data:"2026-10-24", titulo:"Condicionais: filtros, fila de impressão e liberar todas", itens:[
    {tipo:"melhoria", area:"Kits · Condicionais", txt:"Tabela única com listagens que abrem e fecham; cada revendedora abre em formato de planilha (nome ocupa o bloco, uma condicional por linha com Achei, Falta, Desfazer). Faixa \"Próxima\" orienta a ordem (listagem por horário, depois ordem da fila): abre sozinha a próxima revendedora e marca \"pegue agora\" na condicional da vez. Todas as representantes na mesma cor; os números das condicionais aparecem na linha fechada. Filtros em uma linha, Liberar prontas e fila Aguardando impressão. Mais revendedoras de demonstração em Condicionais. Novo brilho dourado (classe destaque-novo) marca o que acabou de mudar."},
    {tipo:"melhoria", area:"Kits · App das condicionais", txt:"Celular refeito para conduzir passo a passo: contadores no topo, cartão da revendedora da vez com a condicional \"Pegue agora\", botões grandes (Achei, Falta), Liberar e ir para a próxima, e fila embaixo para trocar de revendedora. A próxima pula quem só espera impressão."},
    {tipo:"novo", area:"Kits · Condicionais", txt:"Botão Ver no celular na própria tela: abre ao lado a mesma tela na versão de celular, com as cores do Admin e os mesmos dados (peça components/visao-celular.js, ComCelular). Serve de modelo para as outras telas."},
    {tipo:"novo", area:"Celular", txt:"O Ver no celular agora mostra um iPhone 13 (entalhe, barra de status, botão de início) com Entrada, Início (ícones das telas e dock com SorellyChat e Sair), a tela escolhida e o Chat de verdade. Arquivo mobile/celular-admin.js; para pôr outra tela no celular, criar a versão celular e acrescentar uma linha em TELAS."}
  ]},
  {v:"0.12.39", data:"2026-10-23", titulo:"RH: menu novo e contratos de crédito, aluguel e consórcio", itens:[
    {tipo:"melhoria", area:"RH", txt:"O topo do RH passou para o padrão dos outros setores (Financeiro, Cadastro, Agendamento): palavras com listas em cascata, telas abertas e busca. Nenhuma tela saiu; só mudou de lugar."},
    {tipo:"novo", area:"RH · Contratos", txt:"Três telas novas em Contratos → Empresa: Crédito bancário (banco, nº do contrato, valor, parcela, saldo devedor, fim, Pronampe, link do Drive), Aluguéis e Consórcios (com status Contemplado). Só sócios e supervisão abrem. O PDF fica no Drive e o sistema guarda o link."},
    {tipo:"novo", area:"RH · Contratos", txt:"Terceiros ganhou o botão Trazer Leonardo, Castilho e Igor: cria os três na lista (sem repetir se clicar de novo). O contrato assinado entra pelo Anexar ou pelo link do Drive."},
    {tipo:"novo", area:"RH · Contratos", txt:"Bloco Gerentes dos bancos na tela Crédito bancário (Santander, Bradesco, Safra, Sicredi, Stone, Caixa, Itaú). Telefones só no arquivo local rh-bancos.local.js, fora do GitHub."}]},
  {v:"0.12.35", data:"2026-10-23", titulo:"Direcionar Pix vira a primeira tela do Financeiro", itens:[
    {tipo:"melhoria", area:"Financeiro · Navegação", txt:"Direcionar Pix é a primeira palavra do menu do Financeiro (antes de Saldos e análises) e é a tela que abre quando se entra no Financeiro. Tem as visões Direcionar e Regras do Pix. A aba Pagamentos ficou só com Orientações, Atendimento e Destinos."},
  ]},
  {v:"0.12.28", data:"2026-10-23", titulo:"Fiscal mudou para dentro do Financeiro", itens:[
    {tipo:"melhoria", area:"Fiscal", txt:"O setor Fiscal saiu da barra lateral. Agora é a palavra Fiscal no menu do Financeiro (Painel e notas, Limite de faturamento), entre Receber e Família."}]},
  {v:"0.12.37", data:"2026-10-23", titulo:"Plano 45/60: planilha atualizada", itens:[
    {tipo:"melhoria", area:"Agendamento · Plano 45/60", txt:"Arquivo local da planilha refeito com a versão das 04:04 (195 linhas; 43 mudaram: nomes e médias) e a coluna Ana do RH chamou? passou a vir. O botão Importar planilha agora também atualiza média, mínimo e RH das linhas que vieram de planilha, sem mexer no que foi decidido no sistema."}]},
  {v:"0.12.37", data:"2026-10-23", titulo:"Plano 45/60 dias (Fase 2): acompanhamento do ciclo", itens:[
    {tipo:"novo", area:"Agendamento · Plano 45/60", txt:"Nova tela Acompanhamento: para cada aprovada, contato (mensagem, ligação, sem retorno) com data, RH chamou, entrega do kit e venda no ciclo. Mostra crescimento sobre a média, tempo total e o resultado: MANTÉM se a venda atinge o mínimo fixado na aprovação (sem mínimo, vale o crescimento mínimo de 30%), senão VOLTA A 30 DIAS. A Diretoria pode mudar a decisão à mão e voltar ao cálculo automático."},
    {tipo:"novo", area:"Agendamento · Plano 45/60", txt:"Painel do plano ganhou o bloco Ciclo estendido: aguardando a nova data, nova data chegou sem venda lançada, avaliadas, mantêm, voltam a 30 dias, taxa de manutenção e crescimento médio. Filtros por ciclo e por falta de contato."},
  ]},
  {v:"0.12.36", data:"2026-10-23", titulo:"Representantes & Kits: menu no padrão do Financeiro", itens:[
    {tipo:"melhoria", area:"Representantes & Kits", txt:"O topo do setor agora usa o mesmo menu do Financeiro, do Cadastro e das Encomendas: Kits (Montagem, Bipagem, Acompanhamento), Representantes, Financeiro e Regras, com chips das telas abertas e busca. Nenhuma tela saiu; só mudou de lugar."}]},
  {v:"0.12.36", data:"2026-10-23", titulo:"Agendamento: Plano 45/60 dias (Fase 1)", itens:[
    {tipo:"novo", area:"Agendamento · Plano 45/60", txt:"Três telas novas: Indicações (lançar com nome completo, datas, média e motivo; bloqueia nome incompleto e revendedora repetida), Aprovação (fila em análise, a Diretoria fixa o mínimo de vendas e aprova, reprova ou marca sem interesse/saiu) e Painel do plano (efeito na meta do mês, previsão a 94, 95 e 96%, para onde vão as aprovadas, pendências e indicações por representante com mínimo de 3)."},
    {tipo:"novo", area:"Agendamento · Metas", txt:"Aprovada e mudando de mês, a revendedora sai da meta do mês de origem e entra no de destino: é uma remarcação do Agendamento (tipo 45 ou 60 dias, sem multa nem corte de brinde), então a meta, a cota e a previsão do Financeiro acompanham. Desfazer a aprovação desfaz o ajuste. Acertos de mês que já passou não mexem na meta (aviso para confirmar)."},
    {tipo:"novo", area:"Agendamento · Plano 45/60", txt:"Importar planilha: traz as linhas da aba 45 E 60 DIAS (só neste computador, arquivo local fora do GitHub), junta repetidas e marca prazo inválido, sem média e sem data. As aprovadas importadas só entram na meta quando a Diretoria clica em Ajustar a meta, com aviso do risco de contar duas vezes."},
    {tipo:"melhoria", area:"Agendamento · Menu", txt:"O menu do Agendamento passou para o padrão do Financeiro (palavras em cascata, na ordem do fluxo)."},
    {tipo:"novo", area:"RH · Acessos e autorizações", txt:"Duas autorizações novas: Aprovar, reprovar e importar o plano 45/60 (Marcus, Nickolas, Lucas) e Lançar e corrigir indicações (Ana Maria, Mariana, Tamara; o RH acrescenta a pós-venda)."},
  ]},
  {v:"0.12.35", data:"2026-10-23", titulo:"Folders e informativos nos apps da revendedora e da representante", itens:[
    {tipo:"novo", area:"Representantes & Kits · Regras", txt:"Nova tela Folders e informativos: lista com situação, período, limite de vezes por dia, semana e mês e quantas pessoas viram. Editor com abas e blocos, pré-visualização no celular e botão Publicado."},
    {tipo:"novo", area:"App da revendedora e da representante", txt:"Cartão Informativos na tela inicial (com o número de novos) e folder que sobe ao abrir o app, respeitando o limite. Duas abas (Comissões e Regras), blocos fechados que abrem ao toque e botão Entendi. A tabela de comissão e brindes lê as regras do Configurador."},
    {tipo:"novo", area:"Regras", txt:"Folder Regras do acerto criado com mínimo de R$ 500 (representante) e R$ 700 (Sorelly), taxa de R$ 35 também ao cancelar o kit, remarcação e falta de pagamento. A caixa Quem vende R$ 3.000 saiu."}]},
  {v:"0.12.34", data:"2026-10-23", titulo:"Pagamentos: aba Direcionar Pix e Regras", itens:[
    {tipo:"novo", area:"Financeiro · Contas · Pagamentos", txt:"Nova aba Direcionar (layout 3 do Marcus, ampliado): fila de pedidos de conta do Pix (de dentro da Sorelly, sem conta fixa, e das representantes), pedido aberto com vendas, a pagar e o que já pagou, sugestões com o motivo escrito, divisão em vários destinos, destinos que ainda faltam (clicar aloca), contas a pagar por CNPJ e lista dos já direcionados. O Lucas confirma sempre. Aba Regras com as 7 regras em ordem, com liga/desliga. 12 pedidos de teste (9 internos das mensagens das atendentes e 3 de representantes)."},
  ]},
  {v:"0.13.1", data:"2026-10-23", titulo:"Organização do projeto: mais rápido e mais seguro, mesmas telas", itens:[
    {tipo:"melhoria", area:"Tecnologia", txt:"Fontes e ícones agora vêm do próprio sistema (antes vinham do Google e do jsDelivr). A tela abre sem esperar outros sites. Visual igual: 152 telas comparadas, nenhuma diferença."},
    {tipo:"correção", area:"Atendimento interno", txt:"Fechar a aba do atendimento com a calculadora aberta derrubava a tela inteira (erro do React). Corrigido; o mesmo tipo de erro foi corrigido no Configurador do Agendamento e na barra da bipadora."},
    {tipo:"melhoria", area:"Tecnologia", txt:"Cada mudança enviada ao GitHub passa por uma conferência automática (lint e build). Um erro como o do menu Fiscal (sistema sem abrir) é barrado antes de entrar."},
    {tipo:"melhoria", area:"Tecnologia", txt:"Documentos organizados na pasta docs/ por assunto; README e arquitetura reescritos para quem for mexer no código."}]},
  {v:"0.12.27", data:"2026-10-23", titulo:"Pedir peças: da produção ao cadastro, com aviso de volta", itens:[
    {tipo:"novo", area:"Kits", txt:"Kits (interno) → Pedir peças (Deysiane e Milene): pedido com peça, banho, público, quantos modelos (1, 2, 3, 5 ou 10), urgência e texto livre. Mostra a resposta do cadastro e os avisos."},
    {tipo:"novo", area:"Cadastro de peças", txt:"Nova aba Solicitações, a primeira do setor (Rayssa e Graziella): fila por urgência, botões OK (vai produzir), Pronto e Não temos (com motivo curto). A aba mostra quantos pedidos novos há. Quem responde se ajusta em Configurações."},
    {tipo:"novo", area:"Cadastro de peças", txt:"Rayssa e Graziella entraram no sistema como pessoas (grupo de acesso \"Cadastro de peças\", que abre só o setor delas). Pedido novo gera alerta com som para as duas (ligue as notificações do admin no sininho)."},
    {tipo:"novo", area:"App da montadora", txt:"Nova aba Pedir peça: a montadora pede e vê a resposta. Alerta com som e número na aba quando o cadastro responde. Rótulos das abas foram encurtados para caberem quatro."}]},
  {v:"0.12.27", data:"2026-10-23", titulo:"Fiscal: contas de cada CNPJ vêm do Financeiro", itens:[
    {tipo:"melhoria", area:"Fiscal", txt:"O total mensal de contas a pagar de cada CNPJ (34, 46, 59, 67) vem sozinho do Financeiro (Contas a pagar da empresa: pago mais falta pagar, sem o que é da família). Alimenta o Painel (contas, folga e sobra) e a aba Contas a pagar do Fiscal, onde esses meses ficam marcados com o ícone de vínculo e não se editam. Só os meses sem dado do Financeiro aceitam lançamento à mão."}]},
  {v:"0.12.26", data:"2026-10-23", titulo:"Fiscal: painel novo com 4 blocos, Ano | Mês e notas dentro do CNPJ", itens:[
    {tipo:"novo", area:"Fiscal", txt:"Fiscal entrou no menu (Fiscal → Painel e notas). Barra de totais do grupo com o botão Ano | Mês, que muda tudo de uma vez. Um bloco por CNPJ, 2 em 2, na ordem de quem mais precisa de nota de entrada (maior falta de lastro). Cada bloco mostra o CNPJ inteiro, o faturamento, a parte ILF (lastro × meta) e a parte Contas (quanto ainda cabe)."},
    {tipo:"novo", area:"Fiscal", txt:"Clicar no bloco abre só aquele CNPJ: os outros somem, o relatório aparece e as notas de entrada (lançar, buscar, filtrar) surgem aos poucos embaixo. Botão Voltar mostra os 4 blocos de novo."},
    {tipo:"melhoria", area:"Fiscal", txt:"Meta de ILF passou de 30% para 25% (padrão e dados salvos)."}]},
  {v:"0.12.25", data:"2026-10-23", titulo:"Top 50: toda saída pede autorização do Marcus, com link", itens:[
    {tipo:"melhoria", area:"Encomendas e reposições", txt:"Retirar do Top 50 deixou de ser direto para o setor: abre o quadro do motivo, gera o pedido e a mensagem copiável para o Marcus, com link que leva direto ao bloco Pedidos ao Marcus (entra com o login dele para autorizar ou recusar). Só a diretoria tira direto. Vale também para pedir entrada."}]},
  {v:"0.12.24", data:"2026-10-23", titulo:"Top 50: planilha de vendas, pedidos ao Marcus e listagem de horários", itens:[
    {tipo:"novo", area:"Encomendas e reposições", txt:"Planilha das revendedoras (no Funil, aba Revendedoras, e na tela Top 50): venda de cada mês de jul/2026 até o mês atual, média dos últimos 3 meses com venda (pode ser 1 ou 2), alerta abaixo de R$ 3.000, marca \"selecionada pelo Marcus\" e botão Retirar com motivo."},
    {tipo:"novo", area:"Encomendas e reposições", txt:"Pedir entrada ou saída do Top 50 gera mensagem pronta para o Marcus autorizar; a diretoria autoriza ou recusa dentro do sistema (tabela Pedidos ao Marcus)."},
    {tipo:"novo", area:"Encomendas e reposições", txt:"Listagem de horários da ida na empresa: a equipe preenche, envia ao Agendamento (aparece no topo do Painel do Agendamento) e a Rotina do dia lembra a Agatha às 08:30."}]},
  {v:"0.12.23", data:"2026-10-23", titulo:"Encomendas e reposições no menu novo e padrão visual atualizado", itens:[
    {tipo:"melhoria", area:"Encomendas e reposições", txt:"Topo no mesmo estilo do Financeiro e dos Kits novos: faixa com Voltar, ícone e nome da tela, chips das telas abertas e menu em texto com busca. Seis palavras diretas na ordem do fluxo, sem segunda linha."},
    {tipo:"melhoria", area:"Padrão visual", txt:"PADRAO-VISUAL.md e CLAUDE.md ganharam o padrão do menu do setor (campo menu, barra-menu.js) e o padrão de tela de funil (título com seletor e botão, faixa de totais, filtros, quadro e cartão em faixa do canal)."}]},
  {v:"0.12.22", data:"2026-10-22", titulo:"Setor Encomendas e reposições criado no admin", itens:[
    {tipo:"novo", area:"Encomendas e reposições", txt:"Setor refeito em 6 telas numa linha só: Funil de pedidos (quadro igual aos Kits novos, com cartão em faixa do canal, nome completo, telefone, média, valor máximo e taxa), Ida na empresa (agenda, 7 passos e cronômetro de 30 min), Top 50 (lista, bloqueio, entradas e saídas, aprovação mensal), Representantes (limite de 10 por semana e valor a receber), Expositores e Regras e mensagens."},
    {tipo:"novo", area:"Encomendas e reposições", txt:"Caminho próprio por canal (entrega, representante, ida na empresa, encomenda). Não sai de Conferindo sem conferir média e valor, nem de Aguardando comprovante sem o comprovante da taxa de R$ 15,00. Quantidade por mês (1 ou 2) e valor máximo por média na aba Valores; 7 mensagens prontas com botão Copiar na aba Mensagens prontas."}]},
  {v:"0.12.36", data:"2026-10-23", titulo:"Sistema Marcus no padrão novo", itens:[
    {tipo:"melhoria", area:"Marcus (sistema pessoal)", txt:"Todas as telas (Resumo, Faturamento, Patrimônio e dívidas, Contas do mês, Extratos, Atividades, Acessos e senhas, Dados) refeitas no padrão do Financeiro: título com ação, bloco Filtros no topo, faixa de totais, abas visíveis, tabelas com R$ em todo valor, números à direita e linha de total. Sem degradê, sem cartões e sem animação nos botões. Os dados e as contas não mudaram."},
    {tipo:"melhoria", area:"Marcus · Extratos", txt:"Extratos em abas Resumo, Entrou e Saiu, com os grupos por pessoa em tabela e botão Subir CSV no topo."},
  ]},
  {v:"0.12.35", data:"2026-10-23", titulo:"Cadastro → Kits novos automático, etapas da representante e mapa de regiões", itens:[
    {tipo:"novo", area:"Cadastro de revendedoras", txt:"Menu de cima igual ao do Financeiro (Cadastro, Kits novos, Desempenho), na ordem do fluxo. 20 candidatas de demonstração na fila de Aprovação de cadastros."},
    {tipo:"novo", area:"Cadastro → Kits novos", txt:"Aprovou o cadastro, a revendedora entra sozinha em Kits novos como Cadastrada, com o jeito de receber o kit e o valor (vir na empresa = representante Sorelly; expositor marcado). Cada aprovada entra uma vez só."},
    {tipo:"novo", area:"Kits novos", txt:"Etapas novas do caminho da representante: Aceito, Em contato, Agendado (com dia e período) e Retirado, com prazo de cada uma no Configurador. Coluna Contatos foi para o fim da planilha."},
    {tipo:"melhoria", area:"Cadastro › Aprovação de cadastros", txt:"Cartões do quadro refeitos: nome, cidade e profissão, origem, telefone, tempo na etapa (vermelho a partir de 3 dias), kit e valor, e um botão principal por vez. O Desfazer virou o link discreto Voltar à análise (volta o cadastro aprovado ou reprovado para Em análise, para corrigir engano)."},
    {tipo:"melhoria", area:"Cadastro → Kits novos", txt:"Fluxo contínuo: a coluna Cadastradas do quadro de Aprovação de cadastros é a mesma coluna Cadastrada da Michele. Chegou em Cadastradas, aparece em Kits novos sozinha; se o Cadastro desfaz antes de a Michele mexer, sai de lá. Aprovar sozinho não manda mais (só quando chega em Cadastradas)."},
    {tipo:"melhoria", area:"Kits novos · Representantes", txt:"Regiões em BLOCOS só na janela que abre ao clicar na representante (cada bairro ou cidade com ✕ que pergunta Tem certeza, e + adicionar; ★ marca prioridade). A aba Regiões voltou a ser a tabela de antes."},
    {tipo:"novo", area:"Kits novos · Etapas e Fluxo", txt:"Funil na ordem da listagem: ... Agendado, Montando, Bipado, Retirado, Entregue e Devolvido (a condicional voltou para a empresa, prazo de 3 dias depois da entrega; passou do prazo = atrasado). Fluxo das representantes com todas as etapas e os tempos médios (aceitar, contatar, agendar, iniciar, montar, pegar kit, entregar e devolver). Atrasado deixou de ser coluna: a LINHA da representante fica vermelha. Passar o mouse em qualquer etapa (planilha e fluxo) mostra o tempo dela e o prazo. Kits entregues há mais de 15 dias, de antes da etapa nova, viram Devolvido uma vez só."},
    {tipo:"melhoria", area:"Cadastro · Representantes (horários)", txt:"Horário exato por dia (ex.: das 8h às 12h e das 14h às 18h), do jeito que as representantes respondem, com observação. Os períodos manhã, tarde e noite saem sozinhos do horário e alimentam a Indicação. 7 respostas simuladas (Anne, Bruna, Dayanne, Ana Claudia, Edlaine, Vanessa, Veridiana) já entram como Informado; representante só com horário continua pendente de mapa de região. A janela Editar agora tem um campo de horário por dia."},
    {tipo:"novo", area:"Cadastro · Representantes", txt:"Nova tela com o cadastro das representantes do setor, em planilha ou cartões: regiões (Curitiba, região metropolitana, outras), dias e períodos, kits novos em aberto e quantas revendedoras cada uma tem, lidas do Agendamento (cota do mês). Acima de 120 revendedoras o ideal é não mandar kit novo; até 80 é para fortalecer. A Indicação passou a considerar isso (63 revendedoras sobe, 107 desce) e mostra a coluna Revendedoras."},
    {tipo:"novo", area:"Cadastro · Mensagens prontas", txt:"Nova tela com os textos do setor para copiar no WhatsApp, começando por Kits novos: boas-vindas, prazo e contatos, aviso da representante (do Nickolas) e, sugeridas, o pedido da ficha de entrega e a cobrança da condicional. Preenche o nome da revendedora e da representante e os telefones vêm do cadastro de contatos. Dá para editar e restaurar."},
    {tipo:"melhoria", area:"Menu do setor (Financeiro e Cadastro)", txt:"Até 8 telas abertas ao mesmo tempo. Com 8, abrir uma nova mostra um aviso (feche uma pelo ✕) e não fecha nenhuma sozinho. Tela que já está aberta só abre e a aba brilha, sem voar. O voo não distorce mais o texto."},
    {tipo:"novo", area:"Cadastro · Base de revendedoras", txt:"Planilha mãe: uma linha por revendedora, juntando Kits novos, aprovadas do Cadastro, Atendimento interno e listagens das representantes, com busca, filtros por canal e cidade e download. O histórico do total ficou na aba Crescimento. A base completa (cerca de 2 mil) vem quando ligar com a DevMaster."},
    {tipo:"melhoria", area:"Menu do setor (Financeiro e Cadastro)", txt:"Topo invertido: as telas abertas ficam EM CIMA e o menu com a busca de tela fica embaixo. Ao escolher uma tela no menu ou na busca, um clone do item voa até a aba dela e a aba pisca (sem movimento para quem pede menos animação)."},
    {tipo:"melhoria", area:"Cadastro · Desempenho do cadastro", txt:"Tela refeita no padrão do Financeiro: bloco Filtros no topo (período vale para todas as abas), faixa de totais sem cartões coloridos, abas visíveis (Métricas, Funil, Campanhas, Origem, Registros) e tabelas de linhas de 32 px, centralizadas como Kits novos. 30 candidatas e 3 campanhas de demonstração para análise."},
    {tipo:"melhoria", area:"Kits novos · Planilha", txt:"Planilha toda alinhada no padrão do Financeiro: Entrada e Situação viraram texto (sem selos soltos no meio); alertas (desmarcações, expositor, vem na empresa, falta ligar) em coluna própria; contatos como 2/3 no fim."},
    {tipo:"novo", area:"Kits novos · Representantes", txt:"Abas Controle, Fluxo (tempo em cada etapa por representante), Regiões (mapa enviado por 10 representantes; cobertura única e rodízio), Horários (dias e períodos, SIMULAÇÃO até elas passarem os reais) e Indicação (sugere a representante por região e horário)."},
  ]},
  {v:"0.12.34", data:"2026-10-23", titulo:"Kits novos: bairro, cidade e profissão na tela inicial, no padrão do Financeiro", itens:[
    {tipo:"melhoria", area:"Cadastro de revendedoras · Kits novos", txt:"Pedido da Michele (teste com o Leonardo): bairro, cidade e profissão aparecem direto na Planilha (colunas próprias, logo depois do nome) e nos cartões do Quadro, sem abrir o cadastro. Busca também acha pela profissão. Novo campo Profissão ao cadastrar e no detalhe da revendedora."},
    {tipo:"melhoria", area:"Cadastro de revendedoras · Kits novos", txt:"Layout no padrão do Financeiro: faixa de totais sem degradê, bloco Filtros no topo (4 colunas, 32 px), abas visíveis por etapa com contagem (Todas, Cadastrada, Liberado...), tabela de linhas de 32 px com texto que corta com … e mostra inteiro ao passar o mouse. Pendências usa a mesma tabela."},
  ]},
  {v:"0.12.33", data:"2026-10-22", titulo:"Faturamento do dia 22 e contas a pagar atualizados", itens:[
    {tipo:"melhoria", area:"Financeiro · Faturamento", txt:"Hoje (22/10, acompanhamento): 1.241 acertos, R$ 982.434,43, média R$ 791,65. Fecha como oficial quando o Marcus mandar o fechamento do dia."},
    {tipo:"melhoria", area:"Financeiro · Contas a pagar", txt:"Previsto lido do admin antigo: outubro R$ 1.520.529,59 (pagas R$ 1.141.034,30 + a pagar R$ 379.495,29), novembro a pagar R$ 1.451.402,56, dezembro a pagar R$ 1.500.553,11. Saldos e contas pagas por dia até 22/10 já estavam iguais."},
  ]},
  {v:"0.12.32", data:"2026-10-22", titulo:"Financeiro: menu em 4 blocos (Saldos e análises, Contas, Receber, Família)", itens:[
    {tipo:"melhoria", area:"Financeiro · Navegação", txt:"Menu reorganizado como o Marcus pediu: Saldos e análises, Contas (tudo que sai: Contas a pagar, Pagamentos, Fornecedores e Comissões), Receber (tudo que entra) e Família. Fornecedores e Prestadores de serviço viraram uma tela só, Cadastro, com o tipo escolhido dentro. O caminho no topo agora mostra o caminho real do menu."},
  ]},
  {v:"0.12.31", data:"2026-10-22", titulo:"Contas a pagar: bloco de pagamento e Financeiro plano", itens:[
    {tipo:"novo", area:"Financeiro · Contas a pagar", txt:"Clicar numa conta abre o bloco grande de pagamento (dados da conta, pagamentos já feitos, formulário com juros, multa, desconto, comprovante, e Conta anterior / Próxima conta). Conta paga abre só para ler, com Desfazer."},
    {tipo:"melhoria", area:"Financeiro · Visual", txt:"Todas as telas do Financeiro ganharam o visual plano nas peças compartilhadas: blocos sem degradê, cartões de número lisos, abas com sublinhado, textos brancos e cor só no estado. As telas com visual próprio (Contas bancárias etc.) serão refeitas uma a uma."},
  ]},
  {v:"0.12.21", data:"2026-10-22", titulo:"Reposição na empresa: 30 minutos", itens:[
    {tipo:"melhoria", area:"Encomendas e reposições", txt:"O tempo máximo da reposição feita na empresa passou de 60 para 30 minutos (Regras e configuração). Vale também nos dados já salvos."}]},
  {v:"0.13.0", data:"2026-10-22", titulo:"Migração para Next.js (servidor dentro do sistema)", itens:[
    {tipo:"melhoria", area:"Tecnologia", txt:"O sistema saiu do Vite e passou para Next.js 14, com o servidor (login, estado dos módulos, Rotina do dia, DevMaster) dentro do mesmo projeto, em app/api. Telas, regras e dados ficaram iguais: as 148 telas foram abertas uma a uma, sem erro. O projeto antigo ficou inteiro na pasta backup."},
    {tipo:"melhoria", area:"Tecnologia", txt:"Variáveis da tela passaram de VITE_* para NEXT_PUBLIC_*. Para ligar o login e a gravação no servidor: NEXT_PUBLIC_API_URL=/api."},
  ]},
  {v:"0.12.30", data:"2026-10-22", titulo:"Financeiro: menu estilo DevMaster", itens:[
    {tipo:"melhoria", area:"Financeiro · Navegação", txt:"Menu do Financeiro refeito no estilo DevMaster (opção 3 que o Marcus aprovou): palavras em texto, listas que abrem alinhadas (1ª embaixo da palavra, sublista colada ao lado na mesma linha, linhas de 30 px com divisória), abas das telas abertas (máx. 5) e busca de tela para escrever e achar. Voltaram as 11 palavras originais; Análise de custos abre direto, com Sorelly/Família escolhidos dentro da tela. Palavras que não cabem vão para Mais."},
  ]},
  {v:"0.12.29", data:"2026-10-22", titulo:"Pagamentos (Controle) no padrão do Financeiro", itens:[
    {tipo:"melhoria", area:"Financeiro · Pagamentos", txt:"Tela refeita sem cores soltas nem cartões em degradê: faixa de totais, abas visíveis (Orientações, Atendimento, Destinos) e tabelas no padrão. Orientações: 'Chegou um Pix?' mostra o destino sugerido em tabela com botão Direcionar; nova orientação em bloco de campos alinhados; cada orientação tem janela de Pix (registrar e remover), situação e excluir. Atendimento: mesma conferência de pagamentos, com cores calmas (amarelo só em 'falta definir', verde em conferido) e textos em branco. Destinos: busca, tipo, novo destino e lista com Ativo."},
  ]},
  {v:"0.12.28", data:"2026-10-22", titulo:"Financeiro: topo em 5 perguntas", itens:[
    {tipo:"melhoria", area:"Financeiro · Navegação", txt:"O topo do Financeiro virou uma faixa só com 5 perguntas em texto (Hoje, Entradas, Saídas, Resultado, Família), sem caixinhas, sem setas e sem nomes cortados. As telas de cada pergunta ficam em abas visíveis logo abaixo (e uma segunda linha menor quando a tela tem partes). Saiu a faixa de caminho e a segunda barra de botões. Corrigido o destaque da tela aberta em Contas a pagar."},
  ]},
  {v:"0.12.9", data:"2026-10-22", titulo:"Subida por fases: menu só com o que está pronto", itens:[
    {tipo:"novo", area:"Menu", txt:"Dá para ligar só alguns setores no menu da equipe (VITE_SETORES_LIGADOS) e mostrar no fim um atalho para o admin antigo (VITE_ADMIN_ANTIGO_URL), para a equipe começar a usar o layout novo sem perder o que ainda não foi trocado."},
  ]},
  {v:"0.12.8", data:"2026-10-22", titulo:"Servidor pronto para a equipe: permissão por setor", itens:[
    {tipo:"novo", area:"Servidor", txt:"Cada pessoa abre só os módulos do setor dela; a Diretoria abre todos. A carga inicial de um módulo só a Diretoria faz. Todos os módulos passam a ficar no servidor (quando ele está ligado). Plano de subida em SUBIR-O-SISTEMA.md."},
  ]},
  {v:"0.12.7", data:"2026-10-22", titulo:"Revendedoras da DevMaster (Sorelly 02)", itens:[
    {tipo:"novo", area:"Atendimento interno", txt:"Botão Buscar da DevMaster em Revendedoras: traz da API da DevMaster as revendedoras da representante Sorelly (código 02) e cadastra as que faltam como A contatar, ciclo de 30 dias. Precisa do servidor ligado e da chave da DevMaster."},
    {tipo:"novo", area:"Servidor", txt:"Cliente da DevMaster (somente leitura, cache de 10 minutos) e rota para gravar as revendedoras internas no banco. Testado com uma DevMaster falsa."},
  ]},
  {v:"0.12.27", data:"2026-10-22", titulo:"Contas a pagar: registrar pagamento", itens:[
    {tipo:"novo", area:"Financeiro · Contas a pagar", txt:"Botão Registrar pagamento: marque uma ou várias contas do MESMO CNPJ, informe data, forma, conta de saída (só as contas daquele CNPJ), juros e multa, desconto e valor pago; confere o resumo antes de salvar. Pagou menos = parcial, o que falta continua a pagar. Aba Pagas tem Desfazer, com quem fez e quando. Nova autorização 'Registrar pagamento' (padrão Marcus, Nayale e Anamaria). O saldo das contas bancárias não muda sozinho (Open Finance depois)."},
    {tipo:"melhoria", area:"Financeiro · Contas a pagar", txt:"Valores da lista em branco; cor só na situação (Atrasada em amarelo, Pago em verde)."},
  ]},
  {v:"0.12.26", data:"2026-10-22", titulo:"Compras: pedidos atualizados do admin antigo", itens:[
    {tipo:"melhoria", area:"Materiais e estoque · Compras", txt:"Lista de compras trazida de novo do admin antigo: 6 pedidos novos (árvore de Natal do RH, sacola de feira, memória RAM, fitinhas, chocolates e bombom) e 11 que mudaram de etapa (café, leite, açúcar, chá, ziplocks, lixeira, árvore do Marketing etc.). Pedido que alguém já mexeu aqui não é sobrescrito."},
  ]},
  {v:"0.12.25", data:"2026-10-22", titulo:"Fonte Inter e Contas a pagar no padrão", itens:[
    {tipo:"melhoria", area:"Sistema", txt:"Fonte do sistema trocada para Inter (escolha do Marcus); títulos na mesma fonte; números do Financeiro em Inter com algarismos tabulares."},
    {tipo:"melhoria", area:"Financeiro · Contas a pagar", txt:"Tela refeita no padrão: bloco Filtros no topo (Mês, Período, CNPJ, Nota, Natureza, Ordenar, Buscar), faixa de totais, abas Quando vence, A pagar, Pagas e Todas, tabela de layout fixo com R$ em todo valor e texto que corta com … (nome inteiro ao passar o mouse)."},
  ]},
  {v:"0.12.24", data:"2026-10-22", titulo:"Faturamento: tela de referência do padrão do Financeiro", itens:[
    {tipo:"novo", area:"Financeiro · Faturamento", txt:"Tela refeita no padrão aprovado: bloco Filtros no topo (grade de 4 colunas, 32 px), faixa de totais centralizada, abas Dia a dia, Mês a mês, Previsão e Lançar, R$ em todo valor, números à direita, texto que corta com \"…\". Peças novas em components/padrao-fin.js (BlocoFiltros, CampoSel, FaixaTotais, AbasTela, Segmentado, TabelaP)."},
    {tipo:"novo", area:"Financeiro · Faturamento", txt:"Mês a mês com os 12 meses lado a lado (faturamento, contas pagas, contas a pagar, resultado e saldo acumulado), com novembro e dezembro como previsão."},
    {tipo:"melhoria", area:"Regra fixa", txt:"Padrão do Financeiro gravado no fim de PADRAO-VISUAL.md e no CLAUDE.md."},
  ]},
  {v:"0.12.23", data:"2026-10-22", titulo:"Faturamento e contas a pagar dia a dia sem previsão", itens:[
    {tipo:"melhoria", area:"Financeiro · Faturamento", txt:"O bloco dia a dia mostra só o que aconteceu (faturamento, contas pagas e saldo do dia 1 até o último dia lançado), sem dias previstos, sem contas a vencer e sem vencidas."},
  ]},
  {v:"0.12.22", data:"2026-10-22", titulo:"Faturamento fechado em 21/10 e contas pagas corrigidas", itens:[
    {tipo:"melhoria", area:"Financeiro · Faturamento", txt:"21/10 fixado: 1.176 acertos, R$ 928.995,38 e média R$ 789,96 (dia 21: 52 acertos e R$ 40.207,85). Gravado no código (aplicaFat21), em FATURAMENTO-DIARIO.md e aqui."},
    {tipo:"correção", area:"Financeiro · Contas pagas", txt:"As contas pagas de R$ 181.832,42 tinham entrado no dia 21/10, mas o admin antigo corrigiu para 20/10 (R$ 182.744,32 com o ajuste). 21/10 agora tem R$ 73.914,28. Total de outubro pago: R$ 1.067.118,19. Saldos das contas até 21/10 (total −R$ 187.055,12)."},
  ]},
  {v:"0.12.6", data:"2026-10-21", titulo:"RH e demais módulos no servidor (estado dos módulos)", itens:[
    {tipo:"novo", area:"Servidor", txt:"Os módulos passam a poder ficar no banco: o conteúdo de cada um vai e volta do servidor, todos veem o mesmo. Já ligado para o RH; os outros entram pela variável VITE_MODULOS_SERVIDOR. Provisório, depois cada módulo vai para as tabelas finais."},
  ]},
  {v:"0.11.6", data:"2026-10-20", titulo:"Metas mensais do Cadastro e da Inadimplência; faixas novas do Link de pagamento", itens:[
    {tipo:"novo", area:"Financeiro → Comissões", txt:"Duas telas novas: Cadastro de revendedoras (meta pelo total de revendedoras ativas, 5 faixas por pessoa, Helen com 50%) e Inadimplência (meta pelo valor recebido no mês, 5 faixas divididas entre as duas Amandas, com lançamento do recebido). A meta muda todo mês: seletor de mês, copiar do mês anterior e editar faixas, equipe, fechamento e pagamento."},
    {tipo:"melhoria", area:"Financeiro → Comissões", txt:"Visão geral: os cartões de Cadastro, Inadimplência e Link de pagamento mostram bônus de hoje, máximo, barra e o que falta para a próxima faixa. Link de pagamento ganhou as faixas de outubro (R$ 70 mil = R$ 300 até R$ 88 mil = R$ 1.000)."},
  ]},
  {v:"0.12.21", data:"2026-10-21", titulo:"Cadastro de peças: tabela do banho (Ellos x Pontual)", itens:[
    {tipo:"novo", area:"Cadastro de peças → Tabela do banho", txt:"Preço do banho de ouro por milésimo (R$/g) na Ellos e na Pontual, com a cotação do ouro da Ellos (R$ 640/g), diferença e quem é mais barata em cada milésimo. Botão para recalcular a Ellos pela cotação (cada milésimo a mais custa a cotação ÷ 1.000). Pendência registrada: prata e verniz da Pontual sem nível/tipo."},
  ]},
  {v:"0.12.5", data:"2026-10-21", titulo:"Sistema ligado ao servidor: entrada e Rotina do dia", itens:[
    {tipo:"novo", area:"Entrada", txt:"Quando o servidor está configurado, o sistema pede e-mail e senha. Sem servidor, abre direto como antes."},
    {tipo:"melhoria", area:"Rotina do dia", txt:"Combinados e checks passam a ficar no banco: todos veem o mesmo, de qualquer computador. Testado ponta a ponta."},
  ]},
  {v:"0.12.4", data:"2026-10-21", titulo:"Servidor: login e Rotina do dia", itens:[
    {tipo:"novo", area:"Servidor", txt:"Pasta servidor/ (Node + Fastify): login com e-mail e senha, perfil da Diretoria e as rotas da Rotina do dia, testadas contra o banco de teste. Ainda não ligado às telas."},
  ]},
  {v:"0.12.4", data:"2026-10-21", titulo:"Escala 42h (fim da 6x1)", itens:[
    {tipo:"novo", area:"RH · Escala 42h", txt:"Tela nova em RH → Colaboradores: planejamento da escala de 42h que vale a partir de 16/12/2026. Cada pessoa fica na Equipe A (seg a sex), Equipe B (ter a sáb) ou Padrão (seg a sex); atendimento de kits, bipagem e agendamento já vêm divididos entre A e B. Mostra quantas pessoas trabalham em cada dia por setor, avisa quem hoje trabalha sábado, calcula a saída pela entrada de cada pessoa e copia a mensagem para o WhatsApp. Não muda a escala atual do RH."},
  ]},
  {v:"0.12.3", data:"2026-10-21", titulo:"Rotina do dia", itens:[
    {tipo:"novo", area:"Rotina do dia", txt:"Tela nova, logo abaixo da Visão geral: a Diretoria vê o que cada pessoa tem que fazer no dia, com horário e check de feito (quem marcou e a hora); cada pessoa vê só a sua rotina."},
    {tipo:"novo", area:"Rotina do dia", txt:"Passou do horário sem o check: a pessoa recebe o alerta com som no canto da tela e um botão que abre a tela certa (precisa estar com as notificações do admin ligadas). Os combinados (o que, quem, horário, dias e tela) a Diretoria edita em Editar combinados."},
    {tipo:"novo", area:"Banco de teste", txt:"Estrutura vazia do sistema novo no banco de teste (schema sorelly, 168 tabelas, incluindo rotina_item e rotina_registro). Script em banco/schema.sql."},
  ]},
  {v:"0.12.2", data:"2026-10-21", titulo:"Compras trazidas do admin antigo", itens:[
    {tipo:"novo", area:"Materiais e estoque · Compras", txt:"Importados do banco do admin antigo: 137 pedidos de compra (13/08 a 21/10), 15 setores, 15 categorias, 14 contas pagadoras e os motivos de negativa. Os dados ficam só em arquivo local (fora do GitHub) e entram uma vez no estado salvo, sem apagar o que já foi lançado aqui."},
  ]},
  {v:"0.12.21", data:"2026-10-21", titulo:"Saldo das contas em primeiro, Faturamento com contas dia a dia e previsão", itens:[
    {tipo:"melhoria", area:"Financeiro", txt:"Saldo das contas é o primeiro item da barra e a primeira tela do Financeiro (Contas bancárias, Chaves Pix, Regras do Pix, Dinheiro, Taxas e adquirentes). A tela Caixa ficou neutra (sem degradê colorido) e com os blocos de bancos abertos."},
    {tipo:"novo", area:"Financeiro · Faturamento", txt:"Bloco dia a dia com três visões: Faturamento, Contas a pagar e Faturamento vs Contas a pagar (saldo do dia, acumulado e maior déficit). Dias de frente usam a previsão de faturamento e as contas que vencem em cada dia; vencidas e não pagas aparecem como aviso."},
    {tipo:"novo", area:"Financeiro · Faturamento", txt:"Resultado do mês e do ano (recebido, a receber, total, contas, resultado) e Previsão até dezembro (revendedoras, previstos, realizados, média subindo, faturamento, contas e resultado)."},
    {tipo:"correção", area:"Financeiro · Faturamento", txt:"Mês fechado (setembro) não fica mais verde: só o cadeado."},
  ]},
  {v:"0.12.11", data:"2026-10-21", titulo:"Atualização do admin antigo: saldos e contas pagas até 21/10", itens:[
    {tipo:"melhoria", area:"Financeiro · Caixa e Contas a pagar", txt:"Saldos das contas conferidos até 20/10 (29 contas, iguais ao admin antigo) e contas pagas de 21/10 (R$ 181.832,42) lidas do admin. Total de outubro pago: R$ 992.292,01."},
  ]},
  {v:"0.12.20", data:"2026-10-21", titulo:"Reposição: Top 50, taxa de R$ 15 com comprovante e tabela de pedidos", itens:[
    {tipo:"novo", area:"Encomendas e reposições", txt:"Regras novas: Top 50 recebe reposição por entrega (João) pagando R$ 15,00 antes por Pix e anexando o comprovante (sem comprovante o pedido não passa para Separando, sem exceção); média de R$ 2.000 ou mais vai à empresa (agendada) ou pela representante (R$ 15,00 é da representante, a revendedora não paga; até 10 por semana). Top 50 cadastrado (33 nomes), Pix da taxa e regras no Configurador. O quadro colorido virou uma tabela única com filtros por canal e situação."},
    {tipo:"melhoria", area:"Encomendas e reposições", txt:"Calculadora e Regras seguem as regras novas; as faixas antigas de limite e quantidade por mês saíram até chegar a tabela de valores."}]},
  {v:"0.12.8", data:"2026-10-21", titulo:"Faturamento dia a dia", itens:[
    {tipo:"novo", area:"Financeiro · Faturamento", txt:"Tabela \"Faturamento dia a dia\" na tela Faturamento: acertos e recebido de cada dia, média do dia, acumulado do mês e média geral, com seta para trocar de mês. Componente components/tabela-faturamento-dia.js."},
  ]},
  {v:"0.12.20", data:"2026-10-21", titulo:"Cadastro de peças: pedidos de bruto, faturas de banho e controle do mês", itens:[
    {tipo:"novo", area:"Cadastro de peças → Pedidos de bruto", txt:"Cada compra com fornecedor, nota, romaneio, valor, desconto, a pagar, chegadas (Pontual, Ellos e Sorelly), peças por categoria e status (Montando pedido, Aguardando envio, A caminho da Pontual/Ellos, Aguardando banho, Parcial, Banhado, Cadastrando, Finalizado). Importados os 138 pedidos de 2026 da aba Brutos Pedidos."},
    {tipo:"novo", area:"Cadastro de peças → Controle do mês", txt:"Quanto foi comprado de bruto em cada mês: pedidos, valor, desconto médio, a pagar, peças por fornecedor e por categoria, banho faturado no mês e comparação com o mês anterior."},
    {tipo:"novo", area:"Cadastro de peças → Faturas Pontual, Faturas Ellos e Retirar ouro", txt:"Uma tela para cada galvânica, com os serviços de cada uma. Ligar a fatura aos pedidos de bruto muda o status deles para Banhado. Retirar ouro registra o envio e, depois, a fatura e o valor descontado."},
    {tipo:"melhoria", area:"Cadastro de peças → Calculadora", txt:"Lote virou Planilha de cadastro (pode ter vários pedidos). Banho padronizado: Ouro 1 a 4 (milésimos) e Prata, nas duas galvânicas (Ouro 556-1 da Ellos = Ouro 1). Tabelas bem menores. Quem faz cada atividade se define em Configurações (Rayssa e Graziella lançam pedidos, Nickolas lança faturas; a diretoria sempre pode)."},
  ]},
  {v:"0.12.7", data:"2026-10-21", titulo:"Faturamento fixado até 20/10", itens:[
    {tipo:"melhoria", area:"Financeiro · Faturamento", txt:"20/10 fixado: 1.124 acertos, R$ 888.787,53 e média R$ 790,74 (dia 20: 116 acertos e R$ 99.437,29). Gravado no código (aplicaFat20b), em FATURAMENTO-DIARIO.md e aqui."},
  ]},
  {v:"0.12.19", data:"2026-10-21", titulo:"Cadastro de peças virou setor próprio", itens:[
    {tipo:"melhoria", area:"Menu lateral", txt:"Cadastro de peças saiu de Materiais & Estoque e agora é um setor próprio na barra lateral (abre direto na tela)."},
  ]},
  {v:"0.12.18", data:"2026-10-20", titulo:"Cadastro de peças no estilo de Pagamentos a fornecedores", itens:[
    {tipo:"melhoria", area:"Materiais e estoque → Cadastro de peças", txt:"Sem blocos coloridos: azul único das telas de fornecedor, resumos em branco (cor só para estado). Aba nova Lotes (uma linha por lote com bruto, banho, a pagar, venda, markup e quanto já foi ao chat, com total). Calculadora com busca, filtro por fornecedor e situação, marcar várias peças e enviar ao chat, custo total e venda total por peça e linha de total no rodapé."},
  ]},
  {v:"0.12.17", data:"2026-10-20", titulo:"Cadastro de peças: calculadora de custo e preço", itens:[
    {tipo:"novo", area:"Materiais e estoque → Cadastro de peças", txt:"Tela nova com 4 abas. Calculadora: um lote por vez (cada aba da planilha Bruto/Ouro), com a tabela de banho da fatura (Pontual ou Ellos), peças coladas do romaneio, peso, banho (ou banho fixo por peça), desconto de pedra, custo, preço sugerido e markup (sobre os 54,86% que a Sorelly recebe), com markup alvo por lote. O preço vai para aprovação no SorellyChat (grupo Cadastro de Peças). Fornecedores: custo médio por peça para ver qual sai mais barato. DevMaster: pedidos de alteração em Kanban (já com a limpeza de grupos e classes combinada). Configurações: percentual recebido, markup alvo e preço terminado em 8. Dados de teste das 5 abas atuais ficam só em domain/cadastro-pecas.local.js (fora do repositório). Pedidos de bruto, faturas de banho e Retirar ouro entram na próxima etapa."},
  ]},
  {v:"0.11.5", data:"2026-10-20", titulo:"Comissão do atendimento interno (quem acompanha a revendedora)", itens:[
    {tipo:"novo", area:"Financeiro → Comissões → Atendimento interno", txt:"Bloco novo: R$ 5,00 fixo por atendimento; venda acima de R$ 4.000,00 paga R$ 10,00. Qualquer funcionária que atender recebe (hoje atendem Leci e Maria Aparecida). Soma no total do mês do setor e na Visão geral das comissões."},
  ]},
  {v:"0.12.16", data:"2026-10-20", titulo:"Marcus: menu lateral e Faturamento limpo", itens:[
    {tipo:"melhoria", area:"Marcus", txt:"No modo Marcus, o menu lateral lista as 7 telas (Resumo, Faturamento, Patrimônio e dívidas, Contas do mês, Atividades, Acessos e senhas, Dados), cada uma com endereço próprio (/montagem/marcus-faturamento etc.), como no Admin. Faturamento virou só o registro: tabela mês, recebido, faturado e %, com total e média; sem blocos nem textos."}]},
  {v:"0.12.6", data:"2026-10-20", titulo:"Faturamento de hoje (20/10) e regra de gravar tudo no código", itens:[
    {tipo:"melhoria", area:"Financeiro · Faturamento", txt:"Hoje (20/10): 1.120 acertos, R$ 887.486,78 e média R$ 792,40; 7 vendas no Carregar e 783 acertos a realizar (total do mês 1.910; previsão a 97%). Gravado fixo no código (aplicaHoje20), em FATURAMENTO-DIARIO.md e aqui."},
    {tipo:"melhoria", area:"Processo", txt:"Regra escrita em FATURAMENTO-DIARIO.md: o que o Marcus passa no chat sempre vira código, documento, versão e decisão no mesmo dia."},
  ]},
  {v:"0.12.15", data:"2026-10-20", titulo:"Marcus: faturado automático", itens:[
    {tipo:"melhoria", area:"Marcus", txt:"Recebimentos puxa sozinho o faturado do ano do admin (Visão geral → Faturamento mês a mês): meses fechados = real, mês atual = faturado até agora (oficial do dia anterior + Hoje). Atualiza ao abrir e a cada 10 min com a tela aberta; mês digitado à mão no Marcus não é sobrescrito. Sem servidor não há rotina das 6h com o sistema fechado."}]},
  {v:"0.12.15", data:"2026-10-20", titulo:"Reposição das representantes: R$ 20,00", itens:[
    {tipo:"melhoria", area:"Representantes", txt:"A comissão por reposição entregue agora é R$ 20,00 por entrega, para todas as representantes (o R$ 15,00 que havia no sistema era só provisório). Aparece nas Regras dos representantes, em Comissões e no app da representante. Continua só com a condicional assinada, e o valor se muda em Configurar comissões."},
  ]},
  {v:"0.12.14", data:"2026-10-20", titulo:"Sistema Marcus: controle particular", itens:[
    {tipo:"novo", area:"Marcus", txt:"A tela Marcus (botão Admin / Marcus no menu, só o Marcus vê) ganhou 7 abas: Resumo, Recebimentos (recebido × faturado × % mês a mês, 2025 e 2026 lado a lado), Patrimônio e dívidas (bens, dívidas no CPF, propostas de crédito), Contas do mês (fixas repetem, marca pago, por conta/cartão), Atividades (kanban), Acessos e senhas (escondidas, revelar e copiar) e Dados (pessoais, empresas, carros). Dados da planilha Controle Marcus ficam só em domain/marcus.local.js (fora do GitHub) e o estado em sorelly_marcus_v1, separado do admin."}]},
  {v:"0.12.13", data:"2026-10-20", titulo:"Kits altos: Agatha, Elen e Eduarda e a mesa maior", itens:[
    {tipo:"melhoria", area:"Montagem", txt:"O setor Encomendas acabou: Agatha, Elen e Eduarda Gabriela agora montam kits. Kit de R$ 3.000 para cima (venda atual ou média) só elas montam (antes era R$ 4.000). Kit com venda acima de R$ 4.000 ganha o selo Mesa maior: montar só na mesa da Agatha. Os dois limites ficam no Configurador geral (Montagem e bipagem → Kits de alto valor)."}]},
  {v:"0.12.12", data:"2026-10-20", titulo:"Anéis voltam a ser número fixo", itens:[
    {tipo:"melhoria", area:"Peças por kit", txt:"Anéis deixam de ser faixa: cada kit tem um número fixo, de 7 (kit de R$ 5 mil) até 35 (kit de R$ 25 mil). Os valores do meio são sugestão a confirmar."}]},
  {v:"0.12.11", data:"2026-10-20", titulo:"Faixa de anéis: kit de R$ 5 mil passa a 6 a 7", itens:[
    {tipo:"melhoria", area:"Peças por kit", txt:"Kit de R$ 5 mil = 6 a 7 anéis; os outros sobem na ordem até 26 a 35 no kit de R$ 25 mil. Sugestão a confirmar."}]},
  {v:"0.12.10", data:"2026-10-20", titulo:"Faixa de anéis reorganizada (7 a 9 até 35)", itens:[
    {tipo:"melhoria", area:"Peças por kit", txt:"Kit de R$ 5 mil = 7 a 9 anéis e o máximo é 35 anéis (kit de R$ 25 mil). Os kits do meio sobem proporcionalmente, como sugestão a confirmar. Vale também nos dados já salvos (uma vez; depois o Configurador manda)."}]},
  {v:"0.12.9", data:"2026-10-20", titulo:"Anéis em faixa na tabela de peças por kit", itens:[
    {tipo:"melhoria", area:"Peças por kit", txt:"Anéis deixam de ter número fechado e viram faixa (mínimo e máximo; kit de R$ 12 mil = \"20 a 24\"). Aparece assim em Regras, em O que enviar (janela de montar, etiqueta e app da montadora) e no Configurador geral, onde cada kit tem dois campos (de e até). Faixas sugeridas, a confirmar."}]},
  {v:"0.12.8", data:"2026-10-20", titulo:"Estoque baixo: vendas a partir de R$ 4.000 mantêm o valor do estoque alto", itens:[
    {tipo:"melhoria", area:"Calculadora de kits", txt:"Na tabela de estoque baixo, média de R$ 4.000 em diante dá o mesmo kit da tabela de estoque alto (R$ 4.000 → kit R$ 17.000; R$ 5.000 → kit R$ 20.000). Abaixo de R$ 4.000 a tabela de estoque baixo continua como estava. Vale também nos dados já salvos."}]},
  {v:"0.12.7", data:"2026-10-20", titulo:"Contas a pagar: custos agrupados por fornecedor, com nota e sem nota", itens:[
    {tipo:"novo", area:"Contas a pagar", txt:"Análise de custos com grupos novos: Bruto (MegaSul, Art Ello, Point, Linda, Tucano, Charme, Xangai, Ramos Laser, Bruto Joias e Cia), Banho (Pontual e Ellos), Material gráfico e embalagem (Office Graf), Representantes (comissão do consignado + combustível juntos), Segurança (Higor) e Encargos da folha (FGTS, INSS, medicina) separados da folha."},
    {tipo:"novo", area:"Contas a pagar", txt:"Dentro de Bruto, Banho e Material gráfico, cada fornecedor é UMA linha só (cheque, boleto, Pix e CNPJs diferentes somados). Ao abrir, aparecem Com nota (pago pelo CNPJ) e Sem nota (Pix revendedora). A Ellos é outra empresa e não se junta com a Art Ello."},
    {tipo:"novo", area:"Contas a pagar", txt:"Grupo novo Marketing e tráfego pago (Facebook e despesas de marketing); Sistemas e tecnologia separado. João Guilherme passou para Encomendas (folha e comissão de reposição dele entram no setor)."},
    {tipo:"correção", area:"Contas a pagar", txt:"CNPJ 34 (Patriarca): o aluguel (R$ 19.160,71) e o condomínio (R$ 13.141,08) cobrem duas duplas de salas e cada um é dividido ao meio: salas 501 e 502 e salas 503 e 504. CNPJ 46: sala 703. Coluna Sala na tabela."},
    {tipo:"melhoria", area:"Contas a pagar", txt:"Aluguéis agora são uma linha por CNPJ (34, 46, 59 e 67) que soma tudo; abrindo cada CNPJ aparecem as contas, com a coluna Sala. O condomínio continua na sua própria linha."},
    {tipo:"melhoria", area:"Contas a pagar", txt:"Grupos que abrem dentro de outro: Folha e pessoal reúne Salários e benefícios, Representantes e Encargos da folha; Matéria-prima reúne Bruto e Banho (que abrem por fornecedor). Comissão atacado foi para o grupo Comissões de funcionários."},
    {tipo:"ajuste", area:"Contas a pagar", txt:"Coluna Sala removida (a sala fica na primeira linha da descrição da conta). Colunas na ordem Total, Pago, Falta pagar; Falta pagar em vermelho e Atrasado em laranja, na tabela, nos cartões e no topo."},
    {tipo:"melhoria", area:"Contas a pagar", txt:"Setores no custo de pessoal: Cadastro de revendedoras reúne Camilly, Thalyanny, Michele e Hellen, com Link de pagamento e Kits novos dentro dele; Julia e Rebeca em Marketing; Thaina em RH. O bônus do Nickolas entra na linha dele."},
    {tipo:"ajuste", area:"Contas a pagar", txt:"Barra de filtros alinhada em duas fileiras (Mês, Situação, Nota e Buscar; Ver por setores, Ver por dia, Lançar conta e Limpar filtros). O botão Folha por funcionária foi retirado."},
    {tipo:"ajuste", area:"SorellyChat", txt:"O botão flutuante do SorellyChat saiu da tela por padrão. Ele só aparece se for ligado no botão do SorellyChat no topo (ao lado do tema); a escolha fica lembrada."},
    {tipo:"novo", area:"Contas a pagar", txt:"Nova aba no menu: Funcionários e representantes (só supervisão). Funcionários com salário base do RH, salário + adiantamento, VR, VT, 13º, bônus, hora extra do RH e a negociação de cada um; Representantes com comissão do consignado e combustível. Negociação do Nickolas: bônus de R$ 2.000 por mês (dias 10 e 23) de outubro a dezembro, R$ 1.000 já pago em dinheiro."},
    {tipo:"ajuste", area:"Contas a pagar", txt:"Saiu a coluna Peso da análise de custos (já tem o % do total) e a descrição de cada conta passou a ser por extenso (Salário, Adiantamento, Vale Alimentação...), sem a sigla do DevMaster. Na aba Funcionários, a negociação aparece só no mês aberto. Edna ganhou o quadro de remuneração mês a mês (julho a setembro) com horas extras, 13º e totais."},
    {tipo:"melhoria", area:"Contas a pagar", txt:"Tabela de Funcionários refeita: Salário base (contrato), Total recebido, e sob o grupo SALÁRIO as colunas Adiantamento (40%, dia 20) e Salário; depois VR, VT, horas extras, bônus, 13º e outros, mais Pago e Falta pagar. A Edna mostra os valores reais de julho a setembro vindos do relatório do RH."},
    {tipo:"melhoria", area:"Contas a pagar", txt:"Aba Funcionários: Bônus e Bônus adicional (extra por fora) em colunas separadas; o holerite da Deysiane (setembro) mostra horas extras a 65% e 85%, reflexo no DSR, INSS, FGTS e líquido."},
    {tipo:"novo", area:"Contas a pagar", txt:"Filtro Nota: todas / Com nota / Sem nota (cheque conta como com nota)."},
    {tipo:"novo", area:"Contas a pagar", txt:"Busca por setor: escrever Encomendas (ou outro setor) no campo de busca traz tudo da folha do setor; escrever o nome da funcionária traz tudo dela. Botão Ver por setores troca o relatório inteiro para custo de pessoal por setor (salário, vale, bônus, férias), e cada setor abre por funcionária. FGTS, INSS e medicina aparecem à parte porque não têm divisão por setor."},
    {tipo:"novo", area:"Contas a pagar", txt:"Pix revendedora lançado em Pagamentos a fornecedores entra dentro do fornecedor e já conta como pago. Se o DevMaster já tem o mesmo pagamento (mesmo valor, até 7 dias), fica só um: o mais recente."}]},
  {v:"0.12.6", data:"2026-10-20", titulo:"SorellyChat: horário em uma linha e presença do RH em bolinhas", itens:[
    {tipo:"melhoria", area:"SorellyChat", txt:"O bloco de horário no alto da conversa virou uma faixa de uma linha só: dias (Seg a sáb, Seg a qui + Sex quando a sexta é diferente), entrada e saída, almoço e a situação de agora (ponto verde, amarelo ou cinza). Todos veem o horário de todos; a Direção ajusta no lápis."},
    {tipo:"melhoria", area:"SorellyChat", txt:"O horário passa a vir direto do cadastro do RH (entrada e escala de cada colaborador; saída = jornada de 44h por semana + 1h de almoço). Mudou no RH, mudou no chat. Ajuste feito à mão pela Direção e horários do Agendamento continuam valendo; \"Voltar ao horário do RH\" desfaz o ajuste."},
    {tipo:"novo", area:"SorellyChat", txt:"Presença do colaborador na mesma faixa: 10 bolinhas dos últimos dias de trabalho (verde presente, laranja atraso, roxo falta com atestado, vermelho falta sem atestado, amarelo falta com aviso, cinza sem registro) com explicação ao passar o mouse, e o resumo do mês (atrasos, atestados e faltas). Lê a Presença diária do RH."},
    {tipo:"novo", area:"RH · Acessos", txt:"Nova autorização \"Ver a presença dos colaboradores no chat\" (RH → Acessos e autorizações → Quem pode fazer o quê). Padrão: Marcus, Nickolas, Lucas e Maria Claudia (RH). Quem não está na lista vê só o horário."},
    {tipo:"novo", area:"SorellyChat", txt:"Foto da Ana Beatriz no chat (public/fotos/ana-beatriz.jpg)."}]},
  {v:"0.12.5", data:"2026-10-20", titulo:"Geral dos fornecedores em planilha e filtros em lista", itens:[
    {tipo:"novo", area:"Pagamentos a fornecedores · Geral", txt:"Tela do fornecedor agora em planilha (mês → dezenas → pagamentos, com pago, falta, % e barra), igual à análise de Contas a pagar. Só na Pontual há o botão \"Dezenas em blocos\". Em Todos os fornecedores não há divisão em blocos."},
    {tipo:"novo", area:"Pontual · Maquininha", txt:"Maquininha em blocos no estilo da planilha de descontos: valor total, juros, líquido, parcelas e o desconto que cai no mês (mês atual e seguinte)."},
    {tipo:"ajuste", area:"Controle de pagamentos", txt:"Tela reorganizada em duas colunas: à esquerda \"Chegou um Pix?\" e Orientações, à direita Pagamentos para conferir; Destinos embaixo, sem as colunas de banco e chave Pix e sem o botão Escolher chave Pix."},
    {tipo:"novo", area:"Contas a pagar · pagas do ano", txt:"Lançadas as contas PAGAS de janeiro a setembro/2026 (relatório Baixas a Pagar por Data de 22/10, 12.249 pagamentos, R$ 11,9 milhões). Jan a jun batem com o relatório até o centavo. Os Pix de Pagamentos a fornecedores (planilha, ex.: Tucano de 20/04) só entram depois da última baixa do DevMaster: o que vale é o DevMaster. A faixa de meses virou dois blocos (Pago e A pagar), o ano inteiro de janeiro a dezembro, letra branca e sem marcar o mês atual."},
    {tipo:"ajuste", area:"Contas a pagar · faixa dos meses", txt:"A faixa dos meses usa o mesmo bloco da faixa de totais do Faturamento (caixa única, colunas separadas por linha fina): uma coluna por mês, mês em cima, PAGO (verde) e A PAGAR (vermelho) embaixo. Clicar troca o mês."},
    {tipo:"ajuste", area:"Contas a pagar · lista (Financeiro → Contas)", txt:"A faixa Total / Pago / A pagar / Atrasadas virou blocos: em cima o PAGO (total e cada CNPJ), embaixo o A PAGAR (total, atrasadas e cada CNPJ); clicar num CNPJ filtra a lista. A tela agora soma empresa + pró-labore e retiradas (antes só a empresa e outubro dava R$ 1.306.833,68)."},
    {tipo:"ajuste", area:"Contas a pagar · faixa de meses", txt:"A faixa de meses do topo agora usa a mesma conta dos blocos (aba Total = empresa + pró-labore e retiradas). Antes mostrava só a empresa, e outubro aparecia R$ 1.306.833,68 em vez de R$ 1.517.334,88."},
    {tipo:"novo", area:"Contas a pagar · história inteira", txt:"Lançado o relatório Contas a Pagar por Vencimento de 22/10: 3.033 contas de novembro/2026 até 2042 (empréstimos longos), R$ 12,5 milhões. Substitui as planilhas por filial de nov/2026 a mar/2027. Conferido: novembro R$ 1.382.862,74, dezembro R$ 1.426.056,90, janeiro R$ 1.010.391,78, fevereiro R$ 895.357,52, março R$ 817.820,07. O relatório não traz filial nem natureza: 2.022 contas vieram das planilhas por filial, 984 pelo nome e 27 por regra. A aba Total agora inclui as contas da Ana Beatriz quando ela não tem meta de Pix."},
    {tipo:"ajuste", area:"Contas a pagar · por vencimento e total", txt:"A tela abre em Total (empresa + pró-labore e retiradas). As abas viraram Empresa, Pró-labore e retiradas e Total. Por vencimento agora segue o mês escolhido, mostra cada dia com seu total e tem os botões Abrir todos os dias e Fechar todos os dias (cada dia também abre sozinho). Corrigido o vencimento das contas pagas de outubro."},
    {tipo:"ajuste", area:"Menu do topo · cores", txt:"Todas as palavras dos menus, itens das listas, resultados da busca e abas agora têm letra branca e a mesma cor dourada ao passar o mouse (antes o item da tela aberta e alguns itens não mudavam de cor)."},
    {tipo:"ajuste", area:"Menu do topo", txt:"Voltou à ordem de antes: 1) cabeçalho no alto, 2) menus do setor + busca, 3) abas abertas. Mudou só isto: o nome do setor (ex.: FINANCEIRO) e o caminho Setor / Área / Tela saíram; no lugar vai o símbolo do setor na barra de cima, junto do título da tela."},
    {tipo:"novo", area:"Contas a pagar · outubro/2026 atualizado", txt:"Outubro trocado pelas planilhas do DevMaster de 22/10: 1.306 contas pagas (R$ 1.141.034,30) e 206 a pagar até 31/10 (R$ 374.100,65), total R$ 1.515.134,95, conferido com o seu resumo. Saldos das contas e contas pagas do dia 22/10 lidos do admin antigo. 168 contas pagas (R$ 74.360,03) vieram sem nome do fornecedor porque a planilha de baixas não traz nome nem natureza; ficam com nome genérico até chegar o relatório por natureza."},
    {tipo:"ajuste", area:"Contas a pagar · tela", txt:"Blocos da tela agora são fixos (não abrem nem fecham) e o valor vai junto do título, sem ficar solto no canto. No topo, uma faixa com todos os meses (total e quanto falta); clicar troca o mês."},
    {tipo:"novo", area:"Contas a pagar · nov/2026 a mar/2027", txt:"Lançadas as contas a pagar de novembro, dezembro, janeiro, fevereiro e março (2.318 contas) das planilhas do DevMaster por filial. Totais conferidos com o cabeçalho de cada filial: novembro R$ 1.439.041,20, dezembro R$ 1.493.221,45, janeiro R$ 1.094.387,82, fevereiro R$ 901.244,63 e março R$ 818.221,49. Dados só em domain/contas-empresa-meses.local.js (fora do GitHub); a tela Contas a pagar já mostra esses meses."},
    {tipo:"novo", area:"Marcus · Extratos", txt:"Tela nova no sistema pessoal do Marcus (modo Marcus do menu): sobe o CSV do extrato da Nubank de cada mês (subir o mesmo mês de novo substitui). Mostra lado a lado ENTROU (revendedoras e clientes, família, Sorelly/pró-labore, outras) e SAIU (Pix enviados por pessoa, Pix para família e minhas contas, boletos, compras no débito, fatura). Tudo somado por pessoa ou lugar; clicar abre os lançamentos; a busca (ex.: Higor, Lucas, Amanda) soma quanto enviou e quanto recebeu. Os dados ficam só neste navegador, nunca no Admin da empresa."},
    {tipo:"novo", area:"Resumo do sócio · Pix de revendedoras dividido", txt:"Novo bloco no Resumo: o Pix de revendedoras se divide em 'Recebido na minha conta' (por conta: Nubank, Caixa...) e 'Direto para prestadores de serviço' (lista dos prestadores com valor e %). Clicar no prestador abre a tela dele. Outubro/2026 do Marcus: R$ 44.049,67 = R$ 33.076,97 nas contas + R$ 10.972,70 direto para prestadores."},
    {tipo:"ajuste", area:"Financeiro familiar · pró-labore do Marcus", txt:"Atualizado do admin antigo (22/10): os Pix do Itaú de agosto (R$ 1.000 e R$ 7.800) agora são da categoria Pix Itaú Black, pagos em 27/08. Pró-labore do Marcus em agosto = R$ 13.282,81 (Salário R$ 8.062,81 + Adiantamento R$ 5.220,00); o total pago de agosto continua R$ 112.822,57."},
    {tipo:"novo", area:"Financeiro familiar · editar pagamento direto no Resumo", txt:"Cada linha da tabela de Pagamentos (aba Resumo do sócio) tem o botão ✎: abre a janela Editar pagamento com valor, data, forma, conta pagadora, categoria (vale para a conta inteira, com a opção + Nova categoria) e observação, e o botão Excluir pagamento. Mês que já passou está travado: ao salvar ou excluir o mês é liberado sozinho. Nova categoria Pix Itaú Black (a mesma que você criou no admin antigo) já está na lista."},
    {tipo:"novo", area:"Financeiro familiar · Sócios · Resumo", txt:"Primeira aba de cada sócio (no estilo do admin familiar antigo, em dourado degradê): total pago no período, Pix de revendedoras recebido com a meta, pró-labore pago, contas sem Pix e pró-labore, 'Por categoria' em barras e a tabela de Pagamentos (descrição, pessoa, categoria, valor, data, conta pagadora, forma) com filtros de categoria, conta, forma e busca, e o TOTAL PAGO NO PERÍODO. Agosto/2026 do Marcus fecha em R$ 112.822,57 (31 pagamentos), igual ao admin antigo."},
    {tipo:"ajuste", area:"Financeiro familiar · atualização do admin antigo (21/10/2026)", txt:"Pagamentos de agosto e outubro puxados de novo do admin antigo (Marcus, Marco Antonio, Anamaria, Casa Alphaville, Casa Jardine, Família) e 6 Pix do Marcus que faltavam (mais um valor corrigido de R$ 195 para R$ 210). Pix revendedora de agosto do Marcus passou de R$ 54.338,29 para os dois pagamentos reais (R$ 14.734,10 + R$ 10.324,80 = R$ 25.058,90) e o Salário de R$ 8.062,81 entrou no Marcus. Conferido: todos os meses de abril a outubro batem com o admin antigo, exceto outubro da Família, que tem a mais o aluguel Uphills de R$ 25.000 que só existe aqui."},
    {tipo:"novo", area:"Calendário de vencimentos", txt:"Bloco novo e largo logo abaixo do Limite de fornecedores. Cada dia mostra o total e o valor por tipo (Banho, Bruto, Serviços, Fora do teto), com total da semana, dias de conta fixa em vermelho (evitar!), pendente de aprovação e pago. Clicar no dia abre o detalhe (fornecedor, forma, valor, situação). Setas trocam o mês, filtro Tudo, Só Pix ou Boleto, cheque e cartão, e a sugestão dos 5 melhores dias para boleto e cheque."},
    {tipo:"ajuste", area:"Limite de fornecedores · layout em tabela", txt:"Bloco refeito no layout de tabela: por tipo (Total, Banho, Bruto, Serviços) com Limite, Lançado, Pendente, Folga, barra de % com semáforo e Quem pesa (os maiores fornecedores). Ao lado, as regras escritas (semáforo com a faixa atual destacada, mês de cada pagamento, fora do teto, teto por tipo, como fechar negociação), os próximos 4 meses com folga para jogar Pix e parcelas e o calendário de vencimentos de boleto, cheque e cartão com os dias de conta fixa marcados."},
    {tipo:"novo", area:"Pagamentos a fornecedores · limite mensal", txt:"Resumo do mês ganhou o bloco Limite de fornecedores: teto de R$ 300 mil com semáforo (verde até 80%, amarelo até 90%, laranja até 100%, vermelho acima), três barras por tipo (Banho R$ 150 mil, Bruto R$ 100 mil, Serviços e produtos R$ 50 mil), Pix × boleto/cheque/cartão, fora do teto (sócios, casa, mídia) e os dias a evitar para boleto e cheque (1, 5, 10, 11, 13, 20, 21, 23, 25 e o 5º dia útil). Pedido novo que estoura o teto do mês ou da categoria fica PENDENTE e não conta como lançado até aprovar; só quem tem a autorização 'Aprovar pedido acima do limite mensal' (padrão Marcus) aprova, ajusta os tetos e muda a classificação dos fornecedores. A visão do ano mostra o limite mês a mês."},
    {tipo:"novo", area:"Dívida · ler PDF da ordem de serviço", txt:"Em Dívida > + Lançar dívida há uma área para arrastar o PDF da ordem de serviço da 68 Gang. O sistema guarda o PDF e lê sozinho o código (D#...), a data de abertura, o veículo, o valor total e o serviço (observação do cliente). Testado com o PDF do DRL (R$ 1.350,00). O botão PDF da dívida baixa o arquivo de volta."},
    {tipo:"novo", area:"Sócios · dívida por código do orçamento", txt:"Tela do prestador refeita: blocos Dívida e Enviado (termos curtos). Cada dívida tem o código do orçamento (ex.: D#280826140921), mostra Pago, Falta e quando foi Quitada; cada Enviado aponta para a sua dívida e dá para filtrar por ela. Botão Copiar mensagem (formato da 68 Gang, com *negrito*) por dívida e depois de cada Pix lançado. Botão ✎ Editar no canto de cada bloco: edita e só ali aparecem Fechar dívida e Excluir. Lançar dívida por PDF (guardado no navegador, leitura em melhor esforço) ou colando a mensagem do prestador (cria a dívida e os pagamentos). 68 Gang: 320i falta R$ 8.059,30, DRL quitada, OS quitada com R$ 375,94 a mais. Sorelly saiu da lista de sócios."},
    {tipo:"novo", area:"Sócios · fechar dívida e datas", txt:"Tela do prestador: botão Fechar dívida (zera o que falta no valor de hoje, fica registrado como fechamento), tabela do que é devido com Descrição, Pago, Falta e a data em que cada dívida foi quitada (os envios baixam as dívidas da mais antiga para a mais nova), e 'Pago a mais' no lugar de 'Quitado' quando enviou além do combinado. Amanda: devido R$ 350,00, enviado R$ 170,00, falta R$ 180,00. 68 Gang atualizada com os 3 orçamentos (320i, DRL, OS)."},
    {tipo:"ajuste", area:"Padrão visual · compacto e alinhado", txt:"Regra fixa nova em PADRAO-VISUAL.md e CLAUDE.md: bloco que encolhe quando há pouco conteúdo, texto sempre cabendo no campo ou bloco, formulários em grade alinhada. Aplicada na tela Sócios (resumo em 2 colunas, campos com largura certa)."},
    {tipo:"novo", area:"Sócios · duas telas", txt:"Sócios agora tem duas telas: Consolidado (Pix, salário, nas minhas contas × terceiros, com enviado no período, já enviado, falta e data limite) e Prestadores (tabela com progresso). Clicar num prestador abre a tela dele: o que é devido, o que foi enviado e Lançar Pix enviado manual (de qual conta saiu, Pix de revendedora ou não). Filtro por mês ou Geral; botões + Nova conta e + Novo prestador. Amanda: total R$ 350,00."},
    {tipo:"novo", area:"Financeiro familiar · Sócios", txt:"Nova tela Sócios no lugar de Prestadores: por sócio, Pix de revendedoras e salário recebidos, PARA ONDE FOI o Pix (nas minhas contas × terceiros, conta a conta) e a tabela de prestadores com combinado, enviado no mês, já enviado, barra de progresso, falta pagar, data limite editável e situação. O cadastro dos prestadores ficou em Cadastro de prestadores."},
    {tipo:"novo", area:"Contas a pagar · aba própria", txt:"Nova aba Contas a pagar no menu do Financeiro (lista no estilo DevMaster): seletor Sorelly / Família / Sorelly + Família, visões A pagar / Pagas / A pagar + pagas, resumo por dia, semana e CNPJ (clicar filtra), filtros de mês, período, CNPJ, nota e busca. A tela antiga virou Análise de custos. Financeiro familiar voltou ao menu do alto."},
    {tipo:"novo", area:"Controle de pagamentos · Pix para representantes e sócios", txt:"Representantes e cada sócio (Marcus, Anamaria, Ana Beatriz, Marco Antonio) viraram destinos; as 6 orientações de 21/10 (R$ 10.296,41) entraram. Ao registrar Pix para um sócio aparece Para onde foi (Higor, Greyce, 68 Gang, Nubank...) e o Pix já é lançado no Financeiro familiar."},
    {tipo:"novo", area:"Contas a pagar · nova ordem", txt:"No alto, o seletor Sorelly / Família / Sorelly + Família; primeiro a Análise de custos; embaixo a lista de contas no estilo DevMaster (filial, prefixo, número, parcela, emissão, fornecedor, natureza, vencimento, valor, saldo, histórico) com filtros alinhados (mês, situação, nota, natureza, ordem, busca). A agenda por dia continua num botão."},
    {tipo:"novo", area:"Marcus · tema e listas", txt:"Sistema do Marcus em preto e dourado mais estilizado (letras maiores, linhas e botões que acendem e respondem ao clique); Resumo em listas; Faturamento com 2025 e 2026 em sequência (recebido, faturado e %); Empresas no meu nome só H&O e Mayz; Meus carros separados dos carros da família; botão Copiar para WhatsApp (palavras importantes entre *asteriscos*) em cada bloco."},
    {tipo:"novo", area:"Geral · lançar negociação e cadastrar", txt:"Dentro de cada fornecedor: botão + Lançar nova negociação (abre o Lançar pedido já com o fornecedor escolhido). Na lista geral: + Nova negociação, + Novo fornecedor e + Novo prestador de serviço."},
    {tipo:"ajuste", area:"Geral · fornecedor sem cor", txt:"Clicar no fornecedor (Pontual, Point, Mega Sul, Office Graf, Ellos, Art Ello, Devmaster, Linda e prestadores) na lista geral abre a tela dele, com a mesma estrutura da Pontual (maquininha só na Pontual): o que pagar × o que foi pago, pedidos e negociações, meses e dezenas. Sem cores decorativas: só verde e vermelho para pago e falta. As cores fixas do Nickolas ficaram guardadas (CORES_FORN em pages/pf/ui.js) e desligadas."},
    {tipo:"novo", area:"Fornecedores · dados da planilha", txt:"Puxados da planilha (abas de negociação e Pag. Fornecedores): Mega Sul (cheque NF 150179), Art Ello (romaneio 23419 e NF 23462-23544), Ellos (pedidos 1023, 1176, 1233, 1250, 1251), Office Graf (nov/26 a abr/27), Linda (pedido 2 andar) e os Pix de revendedora de outubro de Office Graf, Devmaster e Mega Sul. Sempre só o que a planilha tem e o sistema não."},
    {tipo:"novo", area:"Pontual · tela principal", txt:"Ao escolher a Pontual (Geral ou Negociações) abre a mesma tela principal, sem blocos soltos: 1) Maquininha no alto (passou no cartão, já descontado, desconta neste mês, ainda vai descontar e próximos meses), 2) O que pagar × o que foi pago (boleto e Pix, com o pago em dinheiro e pelo desconto da maquininha), 3) Pedidos e negociações com quem paga e os vencimentos de cada um (clicando mostra boletos e Pix), 4) Meses e dezenas e 5) cronograma da maquininha. Pedido NF 11689 lançado (Serenity, R$ 14.343,00)."},
    {tipo:"novo", area:"Pontual · Pedido NF 11660", txt:"Primeiro pedido da Pontual lançado por NF: NF 11660 / fatura 13401, Serenity (CNPJ 59), R$ 22.226,64 = 35% boleto (6x de R$ 1.296,55) + 65% Pix (6x), 08/11/2026 a 08/04/2027. O Pix que já estava dentro do pedido do mês saiu de lá para não contar duas vezes."},
    {tipo:"ajuste", area:"Point · Planilha", txt:"Point puxada da planilha: setembro entrou com os 12 pedidos (R$ 58.525,42), boleto de R$ 12.336,50 e Pix de R$ 35.010,30 pago em 30/09; 44 Pix de revendedora de setembro e outubro (outubro R$ 21.503,70 de R$ 40.000,00). Até agosto o sistema já batia com a planilha."},
    {tipo:"novo", area:"Geral · Pontual", txt:"Pontual refeita: quadro de totais do ano separando boleto (com nota), Pix em dinheiro (sem nota) e maquininha, com pago, falta e %; abas Total do ano, Boleto, Pix e Maquininha. Regra da planilha: boleto vencido antes do mês atual conta como pago. Falta a aba Conferência ERP (aguardando respostas)."},
    {tipo:"novo", area:"Menu · Admin e Marcus", txt:"No lugar de Completo e HTML ficou Admin e Marcus (só o Marcus vê). Modo Marcus abre um sistema particular, ainda só a casca; informações em MARCUS.local.md fora do GitHub."},
    {tipo:"ajuste", area:"Pontual · Planilha atualizada", txt:"Planilha nova do Nickolas lida: 34 datas erradas viraram 4. Pix de R$ 1.734,24 de junho entrou como pago (junho fecha em R$ 200.480,87 igual à planilha); março/2027 ajustado; 2 cartões de 20/10 (R$ 650,00 e R$ 301,20) entraram na maquininha."},
    {tipo:"novo", area:"Fornecedores · Cores", txt:"Etiqueta colorida fixa por fornecedor (Pontual azul, Mega Sul verde, Point laranja, Art Ello roxo, Ellos vermelho, Xangai verde-água), nome em branco; o fornecedor escolhido fica no alto e as barras usam a cor dele. Pedido do Nickolas."},
    {tipo:"ajuste", area:"Pontual · Datas", txt:"Datas com ano errado na planilha (Marco/2027 com 2026) eram jogadas em marco/2026 e o mes aparecia atrasado. Corrigido: a coluna define o mes. Coluna Peso removida da Geral."},
    {tipo:"novo", area:"Geral · Prestadores", txt:"Prestadores de outubro lançados do resumo do mês: Higor R$ 2.000,00, Lucas Castilho R$ 4.500,00, Priscila R$ 3.234,42 (só out e nov) e Izadora R$ 1.221,60 (pagamento único), todos em Pix de revendedora."},
    {tipo:"novo", area:"Negociações · Pontual", txt:"Ao filtrar Pontual: resumo do ano (total em pedidos, com nota = boleto, sem nota = Pix, Pix pago e que falta, barra boleto x Pix) e lista de pedidos por mês que abre e mostra os boletos e os Pix; botões de ano 2025/2026/2027."},
    {tipo:"novo", area:"Pontual · Negociações", txt:"Parcelas de Pix e boleto da Pontual de nov/2026 a abr/2027 puxadas da planilha de negociação (nov/26 R$ 232.062,92; dez R$ 181.294,03; jan/27 R$ 127.460,35; fev R$ 72.405,16; mar R$ 50.462,02; abr R$ 4.395,31). Até out/2026 o sistema já batia com a planilha."},
    {tipo:"novo", area:"Geral · Resumo do ano", txt:"Ao clicar no fornecedor (ou escolher na lista): bloco com total do ano, pago até agora, falta pagar e %; na Pontual também quanto passou na maquininha, já descontado e ainda a descontar. Sem setinhas; linha azul marca as dezenas do fornecedor."},
    {tipo:"novo", area:"Pontual · Descontos", txt:"Tabela de descontos do cartão no estilo da planilha: mês atual em diante até onde há desconto, meses anteriores em cima para abrir; mês atual em azul e seguinte em roxo."},
    {tipo:"ajuste", area:"Geral", txt:"Listas de período e fornecedor mais largas (não cortam mais o nome)."},
    {tipo:"ajuste", area:"Contas a pagar", txt:"Situação, Nota e Mês viraram listas (dropdown) alinhadas, com rótulo em cima."}]},
  {v:"0.12.5", data:"2026-10-20", titulo:"Contas a pagar: lançar conta, aluguéis juntos, cores dos CNPJs e chaves Pix", itens:[
    {tipo:"novo", area:"Contas a pagar", txt:"Botão + Lançar conta (boleto, nota, conta fixa, parcelas) com cadastro de fornecedor, de um CNPJ ou particular."},
    {tipo:"novo", area:"Contas a pagar", txt:"Aluguéis de todas as salas somados numa linha só dentro do Administrativo."},
    {tipo:"novo", area:"Contas a pagar", txt:"Com a família junta, salário e adiantamento dos sócios saem do pessoal e ficam só na Família."},
    {tipo:"novo", area:"Contas a pagar", txt:"Cartões de CNPJ com as mesmas cores da aba CNPJs; saíram o seletor de ordem e o Ver em blocos."},
    {tipo:"novo", area:"Contas a pagar", txt:"Empréstimos, viagens, móveis e equipamentos, veículos e aluguéis juntos numa linha que abre. Empréstimos abre a nova tela Financeiro → Empréstimos com o empréstimo clicado já aberto e os dados do contrato."},
    {tipo:"ajuste", area:"Contas a pagar", txt:"DevMaster e demais sistemas em Comissões, marketing e sistemas; Itaú imobiliário na Família; conta de saída do lançamento voltou a ser lista suspensa."},
    {tipo:"novo", area:"Caixa", txt:"Campo de busca em Lançar saldos (CNPJ, banco ou conta). Saldos de 14, 15, 16 e 19/10 e contas pagas desses dias puxados do admin antigo."},
    {tipo:"ajuste", area:"Pagamentos a fornecedores", txt:"Geral com dois formatos (botões Blocos e Planilha no alto). Sempre as 3 dezenas do mês e as 3 do mês seguinte. Pontual: o cartão que passa em um mês desconta a partir da 1ª dezena do mês seguinte; mês ainda não fechado entra como estimativa (passou -5%, 3 parcelas), marcada a confirmar. Pagando agora só no mês em andamento."},
    {tipo:"ajuste", area:"Pagamentos a fornecedores", txt:"Geral: cada mês abre em 3 divisões (1ª, 2ª e 3ª dezena) com números grandes: concluída em verde, pagando agora em azul (já aberta), atrasada em vermelho, em aberto em cinza. Ao abrir um fornecedor, o mês atual já vem aberto, com aviso do que está atrasado. Pontual com resumo da maquininha no alto (quanto passou, fechamento e o desconto que cai no mês)."},
    {tipo:"novo", area:"Pagamentos a fornecedores", txt:"Geral (era Resumo do mês): o RESUMO MÊS da planilha ao vivo. Abre no mês atual; troca de mês ou ano inteiro; escolhe um fornecedor e vê mês a mês; clicando abre as janelas e os pagamentos. Pontual com botão Só maquininha. Fornecedores e prestadores de serviço em blocos separados."},
    {tipo:"ajuste", area:"Pagamentos a fornecedores", txt:"Pontual atualizada com a planilha: 39 Pix de setembro e outubro que faltavam (R$ 66.283,28), 7 passadas de cartão de outubro (R$ 5.820,00), fechamento do cartão de setembro e o desconto de setembro entrando nas janelas."},
    {tipo:"ajuste", area:"Bancos", txt:"Chaves Pix mais simples: tudo aberto (sem Abrir/Fechar), sem números, menos cor; Família virou Sócios; fornecedores com o que fornecem (Pontual e Ellos banho; MegaSul, Linda, Tucano, Charme bruto; Office Graf gráfica; Devmaster sistema; Ello Print tintas); Marco Antonio só com a chave do telefone (o CPF é da conta Itaú Marco PJ em CNPJs); Beaté Cosméticos na Ana Beatriz."},
    {tipo:"ajuste", area:"Controle de pagamentos", txt:"Destinos sem campo de chave Pix: botão Escolher chave Pix abre a lista de todas as chaves de Chaves Pix; a chave escolhida não aparece na tela."},
    {tipo:"ajuste", area:"Bancos", txt:"Chaves Pix: sem as setas do alto; ordem CNPJs, Fornecedores, Funcionários, Família, Prestadores de serviço, todas da mesma cor. Funcionários por CNPJ ou por setor, como na tela de Funcionários do RH, que agora mostra a chave Pix e um botão Editar que leva para cá. Família e Prestadores sempre abertos, separados por pessoa (Marcus, Anamaria, Marco Antonio, Ana Beatriz) e Greice como universal."},
    {tipo:"ajuste", area:"Bancos", txt:"Chaves Pix refeita: topo em degradê, cinco partes (CNPJs, Funcionários, Prestadores de serviço, Fornecedores e Pessoal da família), colunas alinhadas, busca e Abrir todos à esquerda e um botão Editar no alto que abre os campos de todas as linhas. Pessoal separado da empresa; Julia Marketing e Marcus Poupança fora, Greice numa linha só, Serviço Detran, Rebel Mode e 68 Gang como Carros Marcus."},
    {tipo:"novo", area:"Bancos", txt:"Chaves Pix: barra no alto com setas troca entre CNPJs, Funcionários e Prestadores de serviço (quem já é funcionário, como o Higor, não repete). O bloco de chaves de funcionários saiu do Controle de pagamentos."},
    {tipo:"ajuste", area:"Bancos", txt:"Chaves Pix dos bancos: cada linha mostra só os dados e um botão Editar que abre o tipo e a chave. 18 chaves lidas do admin antigo entram com a data de hoje e alterado por Marcus (arquivo local, fora do GitHub)."},
    {tipo:"novo", area:"Bancos", txt:"Nova aba Chaves Pix dos bancos (Financeiro → Bancos): blocos por CNPJ que abrem e fecham (Abrir todos / Fechar todos), com busca e as colunas CNPJ, Banco, Tipo de chave Pix, Chave Pix, Data de alteração e Quem alterou. As chaves saíram do Controle de pagamentos."},
    {tipo:"ajuste", area:"Caixa", txt:"Posição das contas: Bloqueado / retido na penúltima linha e Total de tudo na última (início, agora, variação, cheque especial, disponível); degradê dos blocos mais fraco; nomes dos CNPJs na ponta e números centralizados."},
    {tipo:"ajuste", area:"Caixa", txt:"Posição das contas: fontes maiores, tudo centralizado, cartões coloridos e sem cinza."},
    {tipo:"novo", area:"Caixa", txt:"Nova Posição das contas: saldo real, cheque especial e disponível, com início do mês × agora, por CNPJ (cores dos CNPJs) e por conta, com barra do cheque especial usado. A planilha dia a dia ficou atrás de um botão."},
    {tipo:"correção", area:"Caixa", txt:"Ao rolar a tela, as colunas fixas da planilha passavam por cima da barra do Financeiro; agora ficam por baixo."},
    {tipo:"novo", area:"Caixa", txt:"No fim da planilha, depois de Bloqueado / A receber: Saldo real das contas e Saldo com cheque especial (saldo + limite)."},
    {tipo:"novo", area:"RH", txt:"Presença do RH lida do admin antigo todo dia às 3h30 (arquivo local); nomes casados sozinhos com a lista de Pessoas."},
    {tipo:"ajuste", area:"Contas pagas", txt:"Contas pagas de outubro iguais à tela contas-diario do admin antigo: R$ 810.459,59 até 19/10 (todos os dias, não só os últimos). Dias de exemplo depois de 19/10 saíram."},
    {tipo:"ajuste", area:"Visão geral", txt:"Acertos do mês mostra os novos previstos do Marcus (feitos + Carregar + a realizar = 1.932) e o que falta; os previstos do Agendamento aparecem pequenos embaixo. Previsão a 96/97/98%, valendo 97."},
    {tipo:"ajuste", area:"Caixa", txt:"Cabeçalho dos dias menor e alinhado: QUA 30/09 numa linha só."},
    {tipo:"ajuste", area:"Faturamento", txt:"Faturamento dos dias 15, 16 e 19/10 fixado com os números do Marcus (791 acertos / R$ 630.605,94; 868 / R$ 689.631,19; 1.008 / R$ 789.350,24). Visão geral e Caixa leem o mesmo número. O Hoje antigo de 19/10 saiu."},
    {tipo:"ajuste", area:"Faturamento", txt:"Faturamento do mês fixado em 19/10/2026: 1.008 acertos e R$ 789.350,24 (média R$ 783,09). Registro dos dias em FATURAMENTO-DIARIO.md."},
    {tipo:"ajuste", area:"Caixa", txt:"Lançar saldos: cada CNPJ vira um bloco que abre ao clicar, com o nome completo, limite, usado e folga; botões Ver só (CNPJ) filtram tudo; Pagamentos do dia e Recebido do dia ficaram em blocos embaixo."},
    {tipo:"ajuste", area:"Controle de pagamentos", txt:"Contas bancárias e chaves Pix em listagem, separada por cores dos CNPJs (as mesmas da aba CNPJs). Aplicações não têm chave Pix."},
    {tipo:"ajuste", area:"Controle de pagamentos", txt:"Contas bancárias, funcionários e destinos lado a lado, 2 em 2. Pagamentos para conferir com um selo de situação só por acerto. Pix de uma venda com link ou cartão só mostra as contas do mesmo CNPJ."},
    {tipo:"novo", area:"Controle de pagamentos", txt:"Contas bancárias com chave Pix (a mesma do Saldo das contas), destinos em listagem ou blocos e bloco de funcionários e prestadores com chave Pix."}]},
  {v:"0.12.4", data:"2026-10-19", titulo:"Barra do setor no padrão DevMaster em todos os setores", itens:[
    {tipo:"correção", area:"Menu", txt:"A lista que abre ao clicar numa palavra da barra do setor saía deslocada para a direita (a barra tem desfoque de fundo e isso desalinhava a lista). Agora abre colada embaixo da própria palavra, e o submenu abre ao lado."},
    {tipo:"melhoria", area:"Menu", txt:"Todos os setores usam a barra em cascata de uma linha só (setor → grupo → tela, como na DevMaster). Setor sem menu próprio ganha o menu montado das suas áreas; o menu lateral continua igual. O Financeiro mantém o menu próprio dele."},
    {tipo:"novo", area:"Financeiro", txt:"Contas a pagar: botão \"Só totais e %\" deixa todos os grupos fechados, cada um com o valor total e a porcentagem do total (barra proporcional); clicar abre o grupo. Dentro dos grupos, cada natureza mostra também a % do total."},
    {tipo:"melhoria", area:"Financeiro", txt:"Contas a pagar: os grupos viram uma tabela de análise de custos (pago, falta pagar, total, % do total e barra de peso), com ordem por maior ou menor valor; clicar na linha abre as naturezas. Em Sorelly + família a Família é uma linha da tabela, ordenada por valor, e as porcentagens usam o novo 100% (R$ 1.515.154,53). Por fora ficou junto dos CNPJs, em outra tonalidade."},
    {tipo:"melhoria", area:"Financeiro", txt:"Contas a pagar: ao abrir um grupo (ou a Família) da tabela de análise, as naturezas entram como linhas da PRÓPRIA tabela, nas mesmas colunas e alinhadas à esquerda; saiu a barra repetida com o nome do grupo."},
    {tipo:"melhoria", area:"Financeiro", txt:"Contas a pagar: a linha Família abre por sócio (Marcus, Anamaria, Marco Antonio, Ana Beatriz e Casas, viagem e outros), cada um acumulado; clicar em um sócio abre as naturezas e depois as contas, uma abrindo dentro da outra. A tela não pula mais para cima ao clicar (a linha clicada fica no mesmo lugar). Bloco de sócios de baixo da tabela removido."},
    {tipo:"melhoria", area:"Financeiro", txt:"Contas a pagar: textos em letra normal (nada tudo em maiúsculo: Bônus, Salário, Pró-labore Marcus), recuos menores, e as contas de uma natureza aparecem como linhas da própria tabela (mesmas colunas), sem abrir outra tela."},
    {tipo:"novo", area:"Financeiro", txt:"Contas a pagar: botão Ver por dia (agenda do financeiro): escolhe o dia e mostra o que vence, o que está atrasado, o que foi pago no dia, o que foi pago em dias anteriores (por data) e os próximos 7 dias; respeita o filtro de CNPJ."},
    {tipo:"melhoria", area:"Financeiro", txt:"Contas a pagar: salário e adiantamento juntos por funcionário (do maior para o menor); Pix revendedoras de cada sócio em 2 grupos (contas do sócio × direto para terceiros, por fornecedor); Ana Beatriz só com a meta de Pix (R$ 7.000); cartão novo H&O Apps ao lado do CNPJ 67; bônus mensal do Nickolas lançado até dez/2026 (Por fora); Pix do app Sorelly renomeado de Lucas para Juan; \"Família\" sem o texto do DevMaster."},
  ]},
  {v:"0.12.5", data:"2026-10-19", titulo:"Financeiro: barra de menus em cascata (modelo DevMaster)", itens:[
    {tipo:"novo", area:"Financeiro", txt:"Barra do topo numa linha só, com listas que abrem em cascata (até 3 níveis): Pagamentos, Fornecedores, Contas a pagar, Faturamento, Representantes, Comissões, Cobrança, Bancos e Link de pagamento. Componente reaproveitável em components/barra-cascata.js; para usar em outro setor basta dar a ele um menu em navigation/setores.js."},
    {tipo:"melhoria", area:"Financeiro", txt:"Contas a pagar abre em Sorelly, Família e Sorelly + Família. Cobrança abre em Inadimplência e Cobrança de funcionários, que abre as 7 telas dela."},
    {tipo:"novo", area:"RH · Acessos e autorizações", txt:"Nova autorização \"Ver o Financeiro da família\" (padrão: Marcus, Lucas, Anamaria e Nayale). Quem não tem só enxerga a Sorelly."},
  ]},
  {v:"0.11.5", data:"2026-10-19", titulo:"Previsão do mês por acertos a realizar (96/97/98%)", itens:[
    {tipo:"novo", area:"Financeiro · Faturamento", txt:"Campos \"Vendas no Carregar sem valor\" e \"Acertos que ainda faltam realizar no mês\" (atualizados à mão). Total do mês = feitos + Carregar + a realizar, no lugar dos previstos do Agendamento. A média por acerto continua só com os acertos que têm valor."},
    {tipo:"melhoria", area:"Visão geral · Financeiro", txt:"Os três cenários da previsão passam de 94/95/96% para 96/97/98%, padrão 97%, calculados sobre o total de acertos do mês. Outubro: 997 feitos + 16 do Carregar + 908 a realizar = 1.921; com 97% são 1.863 acertos e R$ 1.467.779,85."},
  ]},
  {v:"0.12.4", data:"2026-10-19", titulo:"Representantes sem bônus e Sabrina fora da lista", itens:[
    {tipo:"melhoria", area:"Representantes", txt:"Representante não tem bonificação: saiu o bônus de R$ 200 por nota da Avaliação das representantes (cartão, texto e coluna Situação) e as duas linhas do Configurador. A nota e os pontos continuam, só como acompanhamento e bloqueio de kit novo. O bônus das funcionárias não mudou."},
    {tipo:"melhoria", area:"RH", txt:"Sabrina saiu da empresa e foi tirada da lista de representantes (agora 23, sendo 4 também funcionárias). No Agendamento ela fica inativa, sem cota, com o histórico guardado."},
  ]},
  {v:"0.10.6", data:"2026-10-19", titulo:"Representantes que saíram, Link 34 e nome do CNPJ 46", itens:[
    {tipo:"melhoria", area:"Link de pagamento e maquininhas", txt:"Sabrina e Julia G. (saíram da empresa) e a maquininha Serenity antiga foram retiradas. As 32 revendedoras delas aparecem como Sem representante (era ...) até serem passadas para quem assumiu."},
    {tipo:"melhoria", area:"Link de pagamento e maquininhas", txt:"Link 34 desativado (não utilizar em 2026). Nome do CNPJ 46 padronizado como Mayz nas taxas e nos saldos."},
  ]},
  {v:"0.12.3", data:"2026-10-19", titulo:"Contas a pagar: tudo num lugar só, com família somada e conciliação", itens:[
    {tipo:"novo", area:"Financeiro", txt:"Tela Contas a pagar (Financeiro → Contas a pagar): Todas, CNPJ 34, 46, 59, Axis (67), Por fora, Família e Conciliação numa linha só. Cada filial mostra Pago, Falta pagar e Total do mês; abre por tipo de gasto → natureza → cada conta, com busca, mês e filtro Todas/Pagas/A pagar."},
    {tipo:"melhoria", area:"Financeiro", txt:"Regra corrigida: o salário dos sócios conta na Empresa e na Família; nada do DevMaster é cortado. Bloco Principal em cima (Empresa, Família e Empresa + família lado a lado), 4 CNPJs embaixo e Por fora, Família e Conciliação por último."},
    {tipo:"novo", area:"Financeiro", txt:"Conciliação DevMaster × familiar (por valor e mês): o que está nos dois, só no DevMaster e só no familiar, mais o Pix revendedoras de cada sócio nos dois sistemas."},
        {tipo:"novo", area:"Financeiro", txt:"A tela abre na Sorelly (empresa): total, 4 CNPJs e Por fora. No topo, o seletor Sorelly / Família / Sorelly + família leva para a família (A pagar, Pagas, Sócios, Resumo, Conciliação) ou soma só o que está no familiar e não está na Sorelly. Bloco \"Sócios: salário e meta de Pix revendedoras\" (pró-labore líquido, salário pago e a pagar, meta, recebido e falta de cada sócio, do Financeiro familiar) fica abaixo, sem competir com o total."},
    {tipo:"melhoria", area:"Financeiro", txt:"Regra certa: Sorelly = DevMaster menos as contas da família que ele já traz (out/2026: Sorelly R$ 1.307.365,14 + Família R$ 207.789,39 = R$ 1.515.154,53). Cada conta tem a marcação \"De quem é\" (Sorelly ou Família) e o Marcus corrige na própria linha (ex.: BMW X1 do CNPJ 59 sobe para a Família). Aba Família ganhou \"Lançado no DevMaster\". Ana Beatriz sem pró-labore; meta de Pix dela de out/2026 em R$ 7.000."},
    {tipo:"novo", area:"Financeiro", txt:"Importadas as contas PAGAS (998 pagamentos, R$ 822.611,68) e A PAGAR (359 contas, R$ 692.542,85) de outubro das 5 filiais, relatórios do DevMaster de 19/10/2026."},
    {tipo:"melhoria", area:"Menu", txt:"O Financeiro familiar saiu da barra de cima e ficou dentro da área Contas a pagar (Home, Alertas, Contas a pagar/pagas da família, PIX, Prestadores, Pró-labores, Relatório, Histórico e Configurações). O total de revendedoras saiu da barra de cima do Financeiro, Agendamento e Cadastro (continua na Visão geral e na Base de revendedoras)."},
  ]},
  {v:"0.12.1", data:"2026-10-19", titulo:"Financeiro familiar: \"Para quem entra\" e divisão da casa entre os 4", itens:[
    {tipo:"novo", area:"Financeiro familiar", txt:"Ao lançar uma conta, e também ao registrar o pagamento, há o campo \"Para quem entra\": uma pessoa, ou \"Família (divide entre os 4)\" = 25% para Marcus, Anamaria, Marco Antonio e Ana Beatriz. A conta é paga de uma conta só (ex.: Itaú Black do Marco) e o resumo de cada um mostra a sua parte. Nas listas aparece \"÷4\" ao lado do nome."},
    {tipo:"melhoria", area:"Financeiro familiar", txt:"Dados do familiar reimportados do admin antigo às 19h de 19/10/2026 (só 1 parcela tinha mudado: Viagem EUA de setembro, R$ 846,92 → R$ 332,64)."},
  ]},
  {v:"0.12.2", data:"2026-10-19", titulo:"Link de pagamento com parcelas por faixa de valor", itens:[
    {tipo:"melhoria", area:"Link de pagamento", txt:"Nova regra: mínimo de R$ 80,00; até R$ 80,00 em 1x; até R$ 400,00 em 4x; até R$ 1.500,00 em 6x; acima disso em 10x (parcela mínima R$ 50,00). Vale no admin, no app da revendedora e no fluxo de venda; as faixas se editam em Meios e acessos → Editar regras do link."},
    {tipo:"melhoria", area:"Link de pagamento", txt:"Parcelas que não cabem no valor aparecem apagadas no app e somem do seletor do admin; a janela das regras passou a ter colunas; o aviso de bandeira não aparece mais em vermelho."},
  ]},
  {v:"0.12.1", data:"2026-10-19", titulo:"Análise por bloco e app da montadora mais legível", itens:[
    {tipo:"melhoria", area:"Preferências do kit", txt:"Análise: cada bloco é uma comparação própria, com Mais pedido dentro do bloco; saiu o ranking misturado."},
    {tipo:"melhoria", area:"App da montadora", txt:"Listagens do dia por representante, tudo escrito por extenso; próximo kit com as preferências reais da revendedora."},
  ]},
  {v:"0.12", data:"2026-10-19", titulo:"Financeiro familiar com os dados reais do admin antigo", itens:[
    {tipo:"novo", area:"Financeiro familiar", txt:"Importados do banco do admin antigo: 11 pessoas/casas, 146 contas com 1.238 parcelas e 222 pagamentos, 42 contas bancárias, 559 PIX de revendedoras e 33 metas, 20 prestadores com 45 dívidas e 183 repasses, 5 pró-labores com vigências. Os dados ficam só em arquivo local (fora do GitHub) e só entram se o familiar ainda estiver vazio."},
    {tipo:"melhoria", area:"Financeiro familiar", txt:"Novas formas de pagamento: Débito em conta e PIX revendedoras. Ficou de fora a hora extra do pró-labore do Lucas (5 registros) e o histórico de alterações."},
  ]},
  {v:"0.11.3", data:"2026-10-19", titulo:"Ello Print lançada (com nota no cartão + sem nota no pix)", itens:[
    {tipo:"novo", area:"Pagamentos a fornecedores", txt:"Pedido Ello Print: R$ 3.600,00 = R$ 1.080,00 com NF no cartão à vista (CNPJ 46, 20/10) + R$ 2.520,00 sem NF em pix de revendedora até 01/11. O resumo da negociação (itens e combinado) agora vale para qualquer fornecedor, não só prestador."},
  ]},
  {v:"0.11.4", data:"2026-10-19", titulo:"RH: aba Negociações (hora extra por fora)", itens:[
    {tipo:"novo", area:"RH", txt:"Nova aba Negociações: padrão por grupo (Diretoria, Setor Marcus, Cadastro, Geral) e negociação de cada pessoa (1h, 2h, 3h, sábado, máx. h/dia, vezes por semana, sábados por mês e observação). Quem não preenche herda o padrão do grupo. Valores iniciais da planilha de horas extras, para o Marcus revisar. Só supervisão e diretoria veem."},
    {tipo:"melhoria", area:"RH", txt:"A ficha do colaborador mostra um resumo da negociação dele, com o caminho para editar."},
  ]},
  {v:"0.10.6", data:"2026-10-19", titulo:"Tela de ver as preferências no app da revendedora", itens:[
    {tipo:"novo", area:"App da revendedora", txt:"Preferências do kit agora abre a tela de ver, como no app de verdade: nome, data da atualização, resumo ouro e prata, botão Editar preferências, aviso de que não é pedido garantido e um cartão numerado por categoria (metal, anel, brincos, cores, observações). Lê o que está salvo em Kits → Preferências do kit. A tela de perguntas que já existia virou o Editar. Tamanho igual ao original por enquanto, para enxugar depois."},
  ]},
  {v:"0.10.5", data:"2026-10-19", titulo:"Tabela nova do Itaú", itens:[
    {tipo:"melhoria", area:"Link de pagamento e maquininhas", txt:"Itaú com taxas separadas de Visa/Master e Elo de 1x a 6x, débito, recebimento em 1 dia útil. Substitui a tabela anterior."},
  ]},
  {v:"0.11.8", data:"2026-10-19", titulo:"Preferências do kit copiadas da produção", itens:[
    {tipo:"melhoria", area:"Preferências do kit", txt:"Blocos do formulário agora são os do admin de produção (mesma ordem, opções e liga/desliga): 13 ligados e 6 desligados prontos para ligar (Brincos, Conjuntos, Choker, Pulseiras, Braceletes, Identificação)"},
    {tipo:"melhoria", area:"Preferências do kit", txt:"Análise: Fontes e configuração foi para o fim da tela"},
  ]},
  {v:"0.11.7", data:"2026-10-19", titulo:"Preferências do kit: todas as revendedoras por representante e relatório", itens:[
    {tipo:"melhoria", area:"Preferências do kit", txt:"Aba Revendedoras lista todas as revendedoras do sistema, separadas por representante, com valor de venda e se preencheu ou não"},
    {tipo:"melhoria", area:"Preferências do kit", txt:"Botão Baixar relatório (planilha com uma coluna por bloco do formulário)"},
    {tipo:"melhoria", area:"Preferências do kit", txt:"Saiu o cadastro de revendedora nessa tela: elas vêm do sistema"},
    {tipo:"melhoria", area:"Preferências do kit", txt:"10 revendedoras do app já com as preferências preenchidas, para conferir"},
  ]},
  {v:"0.11.6", data:"2026-10-19", titulo:"App da revendedora: preferências do kit completas e tela inicial nova", itens:[
    {tipo:"melhoria", area:"App da revendedora", txt:"Editar preferências no formato do app de verdade: Observações, Anéis, Conjunto, Colares, Colar Filhos, Colar de Letras, Pulseira, Bracelete, Tornozeleira, Infantil, Masculino, Flanela, Material de Apoio e Pingentes Avulsos"},
    {tipo:"melhoria", area:"App da revendedora", txt:"Os blocos são os mesmos de Kits > Preferências do kit: o que a revendedora marca no app aparece no admin (fonte App da revendedora) e mudar um bloco no admin muda no app"},
    {tipo:"melhoria", area:"App da revendedora", txt:"Tela inicial da revendedora igual à da representante: cabeçalho escuro com Total vendido, Acerto previsto e Comissão, e cartões pastéis por assunto"},
  ]},
  {v:"0.11.5", data:"2026-10-19", titulo:"Acertos do mês na página inicial e passadas para o próximo mês", itens:[
    {tipo:"melhoria", area:"Visão geral", txt:"Visão geral: bloco Acertos do mês (realizados, faltam, previstos e metas 94/95/96%) acima da Bipagem de retorno"},
    {tipo:"melhoria", area:"Visão geral", txt:"Passar várias revendedoras para o próximo mês de uma vez, dizendo quem passou (Marcus ou Ana Maria); os previstos, as metas e a previsão de faturamento mudam na hora"},
    {tipo:"melhoria", area:"Visão geral", txt:"Solicitações da Visão geral: só pedidos de pagamento acima de R$ 2.000,00, no máximo 3"},
    {tipo:"melhoria", area:"Visão geral", txt:"Atendimento interno: 10 atendimentos feitos em 19/10 para conferir o consolidado"},
    {tipo:"melhoria", area:"Visão geral", txt:"Maquininha Pontual: passadas de setembro e outubro conferidas com a planilha"},
  ]},
  {v:"0.11.4", data:"2026-10-19", titulo:"Consolidado do faturamento em tabela visual", itens:[
    {tipo:"melhoria", area:"Financeiro · Consolidado do faturamento", txt:"Tabela com degradê, títulos em duas linhas (Revendedoras em cima, Início/Fim/Com kit embaixo), explicação ao passar o mouse e valores sem quebrar de linha (R$ 32.095,00 não parte mais). Abre só com os valores."},
    {tipo:"novo", area:"Financeiro · Consolidado do faturamento", txt:"Botão Editar só para quem tem a nova liberação \"Editar o Consolidado do faturamento\" (padrão: Marcus; muda em RH → Acessos e autorizações). Mês fechado (Setembro) não edita nenhum campo, nem a base do Agendamento e as contas."},
  ]},
  {v:"0.10.4", data:"2026-10-19", titulo:"Tabela completa do Bradesco", itens:[
    {tipo:"melhoria", area:"Link de pagamento e maquininhas", txt:"Bradesco com taxas reais de 1x a 10x para Visa/Master, Elo e Amex, recebimento em 1 dia útil e Pix Cielo de 0,99%. A antecipação já vem dentro da taxa, então não é somada de novo."},
  ]},
  {v:"0.11.3", data:"2026-10-19", titulo:"RH: planilha de funcionários conferida e horários no SorellyChat", itens:[
    {tipo:"melhoria", area:"RH", txt:"Planilha FUNCIONARIOS - PLANILHA MARCUS conferida com o cadastro: salários, entradas, escalas, setores e funções já batiam. Atualizados: Kislieydi e Milene em aviso prévio, função da Milenna."},
    {tipo:"novo", area:"SorellyChat", txt:"Horário de cada funcionária (entrada da planilha, saída pela jornada de 44h com 1h de almoço, dias da escala) entra no perfil do chat. Quem já tinha horário próprio (Agendamento) não foi alterado."},
    {tipo:"correção", area:"RH", txt:"Entrada da Ana Maria corrigida para 07:00 (RH e SorellyChat)."},
  ]},
  {v:"0.11.2", data:"2026-10-19", titulo:"Campo \"Colar endereço\" na barra de cima", itens:[
    {tipo:"novo", area:"Barra de cima", txt:"Campo para colar o endereço de uma tela (completo ou só o final, ex.: /montagem/pf-negociacoes) e apertar Enter para ir direto. Aparece em telas médias e grandes."},
  ]},
  {v:"0.10.3", data:"2026-10-19", titulo:"Taxas das maquininhas por banco", itens:[
    {tipo:"novo", area:"Link de pagamento e maquininhas", txt:"Taxas de débito, crédito à vista, 2x a 6x (e 7x a 12x onde existe) e antecipação para Bradesco, Safra, Sicredi 59, Sicredi 67 (Axis) e Itaú, com Visa/Master separadas de Elo e demais bandeiras. As parcelas do meio de 2x a 6x do Bradesco são estimadas em linha reta."},
    {tipo:"melhoria", area:"Link de pagamento e maquininhas", txt:"As 10 representantes sem máquina passam a constar como Sem maquininha (usam só link)."},
  ]},
  {v:"0.11.1", data:"2026-10-19", titulo:"Prestadores de serviço: negociação com data limite e pix mínimo", itens:[
    {tipo:"novo", area:"Pagamentos a fornecedores", txt:"Negociação de prestador agora tem data limite, valor mínimo de pix e resumo do que estamos pagando (obrigatórios para prestador). Bloco \"Prestadores de serviço — pendente\" em Negociações, com botão Ver negociação."},
    {tipo:"novo", area:"Pagamentos a fornecedores", txt:"Helcio cadastrado: R$ 990,00, já entrou R$ 618,80, faltam R$ 371,20, pagar até 25/10/2026, pix mínimo R$ 200,00."},
  ]},
  {v:"0.11", data:"2026-10-19", titulo:"App da revendedora: todas as telas do menu", itens:[
    {tipo:"novo", area:"App da revendedora", txt:"Garantias (certificados emitidos nas vendas, código, validade de 1 ano, busca, abrir reclamação) e aba Reclamações; Condicionais refeitas compactas (uma linha por condicional, chave ligar/desligar, histórico de vendas ao tocar)."},
    {tipo:"novo", area:"App da revendedora", txt:"Clientes (lista única compartilhada com a venda, detalhe com compras e WhatsApp), Mensagens para vender (9 modelos, copiar e WhatsApp) e Indique & Ganhe (a indicação cai no Funil do admin)."},
    {tipo:"novo", area:"App da revendedora", txt:"Artes & Criativos (do Marketing), Preferências do kit (só o básico, com aviso de que não garante a peça; grava no admin), Aulas sobre o aplicativo e Central de Ajuda (estrutura editável)."},
  ]},
  {v:"0.10.2", data:"2026-10-19", titulo:"Maquininhas: uma linha por máquina, aluguel e isenção do Itaú", itens:[
    {tipo:"novo", area:"Link de pagamento e maquininhas", txt:"Cadastro por maquininha física (banco, CNPJ, aluguel por mês e quem usa), a partir da lista de 19/10/2026. Bradesco, Itaú e Safra entram como bancos. Resumo de aluguel por banco no topo de Meios e acessos."},
    {tipo:"novo", area:"Link de pagamento e maquininhas", txt:"Isenção do aluguel do Itaú: vendas do mês somadas das máquinas, meta de R$ 50.000,00, quanto falta (zera na virada do mês). Representantes sem banco informado aparecem como Sem dados (conferir)."},
  ]},
  {v:"0.10.1", data:"2026-10-19", titulo:"Pedido de link com bandeira e nome da cliente; topo do app mais enxuto", itens:[
    {tipo:"melhoria", area:"App da revendedora", txt:"Pedido de link de pagamento pede valor, parcelas e bandeira do cartão (obrigatória) e o nome simplificado da cliente (opcional, só para controle da revendedora). Vale na tela Link de pagamento e na venda com link Sorelly. O admin mostra a bandeira e o nome da cliente na solicitação."},
    {tipo:"melhoria", area:"App da revendedora", txt:"Tela inicial: a meta voltou, com texto menor e barra de progresso real, sem espaço sobrando entre o topo e o Total vendido. O total vendido soma as vendas feitas no app."},
    {tipo:"novo", area:"App da revendedora", txt:"Beatriz Nogueira já abre com 6 vendas de demonstração (formas variadas e uma cobrança que vence hoje); não entram nos números do admin."},
  ]},
  {v:"0.10", data:"2026-10-19", titulo:"Venda no app da revendedora reformulada", itens:[
    {tipo:"novo", area:"App da revendedora", txt:"Venda em 4 passos na janela que sobe de baixo: carrinho e cliente, desconto (sem, 3%, 5%, 10% ou outro, em % ou R$), forma de pagamento (à vista, combinado, link Sorelly, Mercado Pago por último) e resumo para mostrar à cliente com Registrar venda ou Enviar proposta (texto pronto para o WhatsApp). O desconto sai da comissão dela e o app mostra quanto ela ganha."},
    {tipo:"novo", area:"App da revendedora", txt:"Pagamento combinado (entrada hoje + o resto em datas) vira cobrança: o app avisa na tela inicial e em Vendas e Pedidos, com o botão Recebi."},
    {tipo:"novo", area:"App da revendedora", txt:"Tela Vendas e Pedidos com as abas Abertos, Pagamentos (propostas) e Fechados (vendas finalizadas, forma de pagamento e garantias a emitir)."},
  ]},
  {v:"0.9.9", data:"2026-10-19", titulo:"Relatório de links por dia e por mês; ajustes do carrinho", itens:[
    {tipo:"melhoria", area:"Financeiro", txt:"Relatório de links de pagamento saiu de Dinheiro e bancos e ganhou botão próprio (Relatórios → Link de pagamento), com resumo por mês e por dia: gerados, pagos (e valor), expirados, com erro e abandonados."},
    {tipo:"novo", area:"Link de pagamento", txt:"Análises do setor com o mesmo resumo por dia e por mês e o bloco de como as revendedoras recebem nas vendas do app (inclui quantas usam o Mercado Pago)."},
    {tipo:"melhoria", area:"App da revendedora", txt:"Link da Sorelly deixou de ser Recomendado (é só mais uma forma; avisa do horário de geração até as 18h); sem aviso no topo ao adicionar peça; barra Ver carrinho mais fina e mais baixa; sem a linha do rodapé na tela do catálogo."},
  ]},
  {v:"0.9.8", data:"2026-10-19", titulo:"Venda no app da revendedora com forma de pagamento e pedido de link", itens:[
    {tipo:"novo", area:"App da revendedora", txt:"Janela do carrinho que sobe de baixo: cliente, Vender ou Criar pedido, forma de pagamento (à vista, link Sorelly com 1x a 6x, link Mercado Pago, personalizado com entrada, parcelas e datas), itens e total. No Vender com link Sorelly, o pedido do link já vai para o setor Link de pagamento."},
    {tipo:"novo", area:"Link de pagamento", txt:"Relatório: formas de pagamento nas vendas do app (vendas, % do total, valor e quantas revendedoras usam cada forma, inclusive o Mercado Pago)."},
    {tipo:"melhoria", area:"App da revendedora", txt:"Clientes de teste cadastradas (só no arquivo local)."},
  ]},
  {v:"0.9.7", data:"2026-10-19", titulo:"Catálogo da revendedora com mais peças", itens:[
    {tipo:"melhoria", area:"App da revendedora", txt:"Catálogo: botão Adicionar no carrinho em degradê dourado, do mesmo tamanho em todas as peças, com Reportar problema alinhado embaixo; cada peça mostra o tipo pela letra do código (A anel, B brinco, BB brinco select...) e a busca também procura pelo tipo."},
    {tipo:"novo", area:"App da revendedora", txt:"6 peças novas no catálogo de teste: B4732, B3519, B3863, A2089, A2114 e A2112 (10 no total)."},
    {tipo:"melhoria", area:"Financeiro", txt:"Barra de cima do Financeiro com nomes em duas linhas (Controle de / pagamentos), botões mais estreitos."},
  ]},
  {v:"0.9.7", data:"2026-10-19", titulo:"Catálogo no app da revendedora (teste com 4 peças)", itens:[
    {tipo:"novo", area:"App da revendedora", txt:"Botão Catálogos abre a tela Catálogo: busca, abas Disponíveis, Em pedidos e Vendidos, e grade de 2 colunas com foto, código, preço, Reportar problema e Adicionar no carrinho. Começa com 4 peças de teste (A2080, A2072, A2051 e SP0589); fotos em public/fotos/catalogo e lista em domain/catalogo-rev.js. Compartilhar, filtros e carrinho ainda não estão ligados."},
  ]},
  {v:"0.9.6", data:"2026-10-19", titulo:"Montar direto na listagem, regra do kit acima de R$ 4.000 e montador obrigatório", itens:[
    {tipo:"novo", area:"Listagens", txt:"Botão Montar direto na linha do kit (Marcus, Deysiane e as funcionárias da Montagem): abre a janela do kit com as preferências da revendedora (Preferências do Kit), as condicionais e o botão Iniciar montagem. Marcus e Deysiane montam ou escolhem qualquer pessoa. Montadora vê a listagem sem nenhum valor em dinheiro."},
    {tipo:"novo", area:"Montagem", txt:"Kit acima de R$ 4.000 (venda atual do app ou média do kit): só o setor Encomendas monta (Elen, Agatha e Eduarda Gabriela, agora cadastradas como montadoras). Selo Só Encomendas no kit; Marcus e Deysiane liberam exceção. O limite fica no Configurador geral (Montagem e bipagem). A regra antiga de R$ 12 mil continua valendo depois dela."},
    {tipo:"correção", area:"Montagem e bipagem", txt:"Quem montou é obrigatório: sem montador válido o kit não conclui, não é conferido, não é bipado nem retirado. Kit antigo sem montador aparece com selo vermelho, a supervisão informa quem montou pelo menu, e ele não conta na comissão da bipadora."},
  ]},
  {v:"0.9.5", data:"2026-10-19", titulo:"Limite da conta fixa, cores dos pagamentos e comissão do Link", itens:[
    {tipo:"melhoria", area:"Financeiro", txt:"Conta fixa de cada representante com limite: vale até um dia e hora e/ou até um valor (mostra quanto já foi enviado); passou do limite, o Pix volta para as regras gerais."},
    {tipo:"melhoria", area:"Controle de pagamentos", txt:"Cada pagamento muda de cor conforme a etapa: amarelo (falta a conta), roxo (conta definida), azul (aguardando comprovante), verde (conferido)."},
    {tipo:"novo", area:"Financeiro", txt:"Comissões → Link de pagamento: bônus do setor pelas faixas do valor pago no mês, próxima faixa e links descontados em acertos."},
  ]},
  {v:"0.9.4", data:"2026-10-19", titulo:"Link de pagamento pedido pelo app da revendedora e descontado no acerto", itens:[
    {tipo:"novo", area:"App da revendedora", txt:"Botão Link de pagamento: a revendedora informa o valor e as parcelas (1x a 6x, sem juros) e solicita o link; as regras (mínimo, parcela mínima, 3 pedidos por dia, dia do acerto) são as do Link de pagamento."},
    {tipo:"novo", area:"App da revendedora", txt:"Meus links: andamento de cada pedido (solicitado, link pronto com botão copiar, pago, expirado, cancelado ou com erro) em linguagem simples."},
    {tipo:"novo", area:"App da representante", txt:"Na calculadora de acertos aparecem os links pagos da revendedora (botão Usar como pagamento lança a linha, forma link, na conta do CNPJ do link) e os avisos de link cancelado, expirado ou com erro. Link usado fica marcado e não desconta duas vezes."},
    {tipo:"melhoria", area:"Link de pagamento", txt:"A equipe cola o endereço do link gerado na ficha da solicitação (aparece no app da revendedora); pedido do app nasce mesmo sem link vinculado à representante; corrigido o erro que impedia salvar a data do acerto ao editar."},
  ]},
  {v:"0.9.3", data:"2026-10-19", titulo:"Representante pede a conta do pagamento (sem esperar)", itens:[
    {tipo:"novo", area:"App da representante", txt:"No acerto, a representante informa só a forma e o valor do pagamento (Pix, link, crédito, débito) e a conta é solicitada ao financeiro em segundo plano: ela segue com brindes e o resto sem esperar. O pagamento mostra \"Conta solicitada, aguardando\"; quando a conta chega, aparece no pagamento com aviso e som. Dinheiro, acerto com loja e Pix representante não pedem conta."},
    {tipo:"melhoria", area:"Controle de pagamentos", txt:"Os pedidos de conta das representantes sobem na hora em Pagamentos para conferir, com a identificação Representante X, a hora do pedido e há quanto tempo aguardam. Qualquer pessoa que pode definir contas resolve; a regra automática do Financeiro envia a conta sozinha."},
    {tipo:"novo", area:"Chaves Pix e regras", txt:"Bloco Representantes: conta fixa do Pix. Cada representante pode ter o CNPJ da maquininha dela e uma conta Pix fixa (ou a conta padrão desse CNPJ). Vale depois do mesmo CNPJ do link/cartão da venda e antes das regras gerais."},
  ]},
  {v:"0.9.2", data:"2026-10-19", titulo:"Chaves Pix e regras: contas decididas sozinhas", itens:[
    {tipo:"novo", area:"Financeiro", txt:"Aba Chaves Pix e regras (Controle de pagamentos): contas Pix com CNPJ, banco, chave e conta padrão de cada CNPJ; regras automáticas em ordem (dinheiro a partir de X%, Pix acima/abaixo de R$, total pago); maquininha única; aviso de vendas para dividir."},
    {tipo:"melhoria", area:"Atendimento interno", txt:"Ao enviar o acerto ao financeiro: dinheiro e maquininha única entram já pagos; Pix procura primeiro o mesmo CNPJ do link/cartão e depois as regras, e vai direto para a funcionária. O que não tiver regra espera alguém definir."},
    {tipo:"novo", area:"Financeiro", txt:"Adquirentes e taxas (Dinheiro e bancos): taxas, antecipação, aluguéis, alertas e pendências da Sicredi por CNPJ, Getnet e Cielo (Pontual), a partir do documento de 16/10/2026. Dados reais só no arquivo local; \"não informado\" nunca vira zero."},
    {tipo:"melhoria", area:"Link de pagamento", txt:"As taxas de crédito da Sicredi (CNPJs 34, 46 e 59) entram no simulador dos links e da maquininha Serenity; Getnet e Cielo seguem sem taxa até a Pontual informar."},
    {tipo:"melhoria", area:"Visão geral", txt:"A lista de revendedoras que vão à empresa mostra só quem vende acima de R$ 2.000; a definição de contas fica no Controle de pagamentos."},
  ]},
  {v:"0.9.1", data:"2026-10-16", titulo:"Link de pagamento: planilha de 2026, Histórico e Análises", itens:[
    {tipo:"novo", area:"Link de pagamento", txt:"Carga da planilha de links de Janeiro a Outubro/2026 (cerca de 3.900 solicitações), com situações novas: negada, abandonada, bloqueada, antifraude, pagamento desfeito e desistiu."},
    {tipo:"novo", area:"Link de pagamento", txt:"Aba Histórico: tabela com filtros por mês, situação, representante, link, canal e busca, com paginação. O quadro mostra só o que está em andamento."},
    {tipo:"novo", area:"Link de pagamento", txt:"Aba Análises: pago por mês e conversão, bônus do setor por mês (faixas editáveis), rankings de representantes e revendedoras, parcelas, bandeira, canal, link/CNPJ e motivos de não conclusão."},
    {tipo:"melhoria", area:"Financeiro", txt:"Relatório de links de pagamento com links gerados, pagos, conversão, valor pago e bônus do setor."},
  ]},
  {v:"0.9", data:"2026-10-16", titulo:"Padrão visual, atalhos de tela e Financeiro reorganizado", itens:[
    {tipo:"novo", area:"Padrão visual", txt:"Peças padrão (Indicador, Faixa, Tabela, Mosaico, Dinheiro), regras escritas e prompt para criar sistemas novos (Tecnologia → Padrão visual)."},
    {tipo:"novo", area:"Todas as telas", txt:"Arrastar tabelas para o lado clicando no vazio, busca com Ctrl+F, botão Voltar para a tela anterior e som padrão nos números que sobem."},
    {tipo:"novo", area:"Tecnologia", txt:"Registro de versões."},
    {tipo:"novo", area:"Cadastro de revendedoras", txt:"Aprovação de cadastros (fila com aprovar, reprovar, desfazer e opção de kit) e Desempenho do cadastro com Métricas, Funil, Campanhas (Meta Ads), Origem e Registros. Entrada manual até a integração com o CRM."},
    {tipo:"novo", area:"RH", txt:"Acessos e autorizações: aba nova \"Quem pode fazer o quê\" reúne as autorizações por pessoa (aprovar cadastros, conferir pagamentos, configurar comissões, gerenciar o Agendamento, bipar retornos)."},
    {tipo:"melhoria", area:"Menu lateral", txt:"Saiu o item Métricas de baixo (os Relatórios continuam dentro do setor Kits)."},
    {tipo:"melhoria", area:"Indicações", txt:"Novo visual nas 5 abas: indicadores compactos com degradê, barra de filtros única, janelas em colunas lado a lado com etapas concluídas, cartões do kanban com iniciais e selo de tempo colorido."},
    {tipo:"novo", area:"Padrão visual", txt:"Mais regras e peças: degradê claro (Indicador e degrade), Abas, BarraFiltros e Janela em colunas."},
    {tipo:"melhoria", area:"Kits novos", txt:"Faixa de indicadores compacta com degradê, barra de filtros única, detalhe da revendedora em 3 colunas, e novos modos Representantes (controle de kits novos por representante) e Entregues."},
    {tipo:"melhoria", area:"Link de pagamento", txt:"Virou setor próprio (quem opera é a Helen); o Financeiro ficou só com o Relatório de links de pagamento do mês."},
    {tipo:"novo", area:"Cadastro de revendedoras", txt:"Avaliações: visão geral, representantes (pelas revendedoras e pelo sistema), kits, montagem, funcionários avaliados pelos supervisores e configurador de perguntas e critérios."},
    {tipo:"novo", area:"Encomendas e reposições", txt:"Expositores: quadro kanban de condicionais (na fila, bipado, com a cliente, devolvido), fila de espera, danificados com reparo, estoque de expositores, clientes e fotos dos kits novos."},
    {tipo:"novo", area:"Financeiro", txt:"Link de pagamento e maquininhas (esboço): fila de solicitações em kanban, comprovantes do dia seguinte, simulador de taxas e de quando o dinheiro entra, meios (links Sicredi 34, 46 e 59; maquininhas Getnet e Cielo) com acessos e passo a passo, e o vínculo de cada representante com maquininha e link."},
    {tipo:"novo", area:"RH", txt:"Equipes: organograma de departamentos (mosaico e árvore), departamentos, pessoas e histórico. Saiu do menu lateral de baixo."},
    {tipo:"novo", area:"Financeiro", txt:"Estoque Sorelly (estoque geral de peças, mês a mês): resumo geral com giro e gráficos, preenchimento da foto do estoque e do fechamento do mês, e configurador."},
    {tipo:"novo", area:"Representantes e Kits", txt:"Produção: painel por período, produção diária com salvamento automático e resumo do dia, premiação mensal por faixas e configurações."},
    {tipo:"novo", area:"Kits", txt:"Preferências do kit: revendedoras com respostas, formulário do app em blocos (com prévia), análise ouro/prata e importação por planilha. O item Metas saiu do menu."},
    {tipo:"melhoria", area:"Compras", txt:"Nova etapa \"Liberada para compra\": o financeiro aprova e libera (só OK ou já definindo como comprar); quem compra (Nayale, Lucas e Marcus, por padrão) efetua; não se efetua sem o plano de pagamento fechado."},
    {tipo:"novo", area:"Materiais e estoque", txt:"Compras e estoque de material: quadro kanban de compras (solicitada, aprovada, efetuada, recebida), detalhe em colunas com plano de pagamento e envio para pagamentos, planilha, visão geral, estoque de material com contagem e alertas, movimentos, pedidos de material em kanban, cadastros e configurações. Aprovação por pessoa em RH → Acessos e autorizações."},
    {tipo:"melhoria", area:"Financeiro", txt:"Estoque Sorelly (estoque geral mês a mês) passa a ficar no Financeiro, separado do estoque de material."},
    {tipo:"melhoria", area:"Padrão visual", txt:"Tecnologia → Padrão visual ficou com duas visões: prompt geral com um botão que copia tudo e as peças ao vivo."},
    {tipo:"novo", area:"Cadastro de revendedoras", txt:"Indicações: funil em kanban, resgates de prêmios em kanban, agendamentos e retiradas do dia (com CSV), ranking de moedas, crédito manual, catálogo de prêmios e histórico. Entrada manual até a integração com o app da revendedora."},
    {tipo:"melhoria", area:"Aprovação de cadastros e Kits novos", txt:"Viraram quadro kanban: cartões que se arrastam entre as etapas, com botão para concluir a etapa; Kits novos mantém a Planilha como alternativa."},
    {tipo:"melhoria", area:"Todas as telas", txt:"Sem tela de entrada: o sistema abre aberto e os apps de celular simulados abrem direto; a troca de pessoa é no seletor do topo."},
    {tipo:"novo", area:"Padrão visual", txt:"Kanban padrão (src/shared/kanban.js) para tudo que anda por etapas."},
    {tipo:"melhoria", area:"Avaliações", txt:"Regras da avaliação das representantes saíram do Configurador e foram para a área de Avaliações."},
    {tipo:"melhoria", area:"Cadastro de revendedoras", txt:"Setor enxuto: 24 telas viraram 6 áreas; configuradores vão para o Configurador geral. O total de revendedoras fica fixo na barra do Financeiro, do Agendamento e do Cadastro."},
    {tipo:"melhoria", area:"Barra do topo", txt:"Botões do Financeiro agrupados por assunto (Pagamentos, Faturamento, Pessoas, Bancos), menores e sem rolar para o lado."},
    {tipo:"melhoria", area:"Fornecedores e Controle de pagamentos", txt:"Campo de dinheiro sem vírgula nos lançamentos, indicadores clicáveis e textos formais."},
    {tipo:"melhoria", area:"Financeiro", txt:"Cor única do setor, Financeiro acima do Agendamento no menu, telas compactas e centralizadas."},
    {tipo:"melhoria", area:"Pagamentos a fornecedores", txt:"Lançamento de pagamentos em tabela por data; fornecedores e prestadores de serviço separados."},
    {tipo:"melhoria", area:"Controle de pagamentos", txt:"Blocos em mosaico, Destinos com busca e filtro por tipo, textos formais."},
    {tipo:"correção", area:"Menu lateral", txt:"O menu não cobre mais a tela ao redimensionar a janela."}]},
  {v:"0.8", data:"2026-10-15", titulo:"Módulos trazidos do SorellyAdmin", itens:[
    {tipo:"novo", area:"RH e Contratos", txt:"Controle de RH, Contratos e modelos em Word."},
    {tipo:"novo", area:"Agendamento", txt:"Painel, representantes, abertura do mês, bônus e metas."},
    {tipo:"novo", area:"Financeiro", txt:"Financeiro familiar, Cobrança de funcionárias, Controle de pagamentos e Pagamentos a fornecedores."}]}
];
export { VERSOES };
