// Sorelly Admin · montagem — domain/versoes.js
// REGISTRO DE VERSÕES do sistema: o que mudou, quando e em qual tela. Mais novo primeiro.
// Regra: quem mexer no sistema (pessoa ou Claude) acrescenta uma entrada NO TOPO ao terminar. Aparece em Tecnologia → Versões.
// area = módulo/tela principal; tipo = "novo" | "melhoria" | "correção".
var VERSOES = [
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
