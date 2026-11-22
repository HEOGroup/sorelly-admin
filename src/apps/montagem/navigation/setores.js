// Sorelly Admin · montagem e bipagem — navigation/setores.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { ABAS } from "@/apps/montagem/navigation/abas";

function T(aba, nome){ return {aba:aba, nome:nome || (ABAS.find(function(a){return a[0]===aba;})||[])[1]}; }
function B(nome){ return {breve:true, nome:nome}; }
// com ícone próprio (alinhado ao do setor) e cor, mostrado no lugar da marca de situação
function Ti(aba, nome, ic, cor){ return Object.assign(T(aba, nome), {ic:ic, icCor:cor}); }
function Bi(nome, ic, cor){ return Object.assign(B(nome), {ic:ic, icCor:cor}); }
function E(nome, origem){ return {breve:true, enviar:true, nome:nome, origem:origem||[]}; }
function G(nome, grupos){ return {nome:nome, grupos:grupos.map(function(g){ return {titulo:g[0], telas:g[1]}; }), telas:[].concat.apply([], grupos.map(function(g){ return g[1]; }))}; }
function I(aba, nome, origem){ return Object.assign(T(aba, nome), {integrado:true, origem:origem||[]}); }   // veio do admin e já foi integrado
// Menu do Financeiro (estilo DevMaster, opção 3 aprovada em 22/10/2026): palavras no topo, listas em cascata alinhadas (components/barra-menu.js), abas das telas abertas e busca de tela. aba = tela; modo = Contas a pagar (Sorelly, Família ou junto); perm = autorização exigida.
var M = function(nome, aba, extra){ return Object.assign({nome:nome, aba:aba}, extra||{}); };
var MENU_FINANCEIRO = [
  {nome:"Pagamentos", itens:[M("Resumo geral","pfresumo"), M("Direcionar","direcionar"), M("Contas das representantes","dirregras"), M("Chaves Pix","chavespixbanco")]},   // Chaves Pix = TERCEIRA tela de Pagamentos (Marcus, 12/11/2026); antes ficava em Contas   // principal e PRIMEIRO de todos (Marcus, 12/11/2026): duas telas, Direcionar e Contas das representantes (esta com Valor fora do normal e as Regras do Pix); a tela Regras e contas deixou de existir
  M("Contas bancárias","caixa"),
  M("Faturas","fffaturas"),   // só de faturas do cartão (Marcus, 19/11/2026); só os sócios abrem   // sem o nível "Saldos e análises": Análise de custos e Estoque Sorelly foram para Relatórios (Marcus, 12/11/2026)
  {nome:"Contas", itens:[   // tudo que SAI de dinheiro (estrutura de 22/10/2026, alinhada com o Marcus)
    M("A pagar / Pagas","ctalista"),   // UMA tela só (A pagar | Pagas | Todas; Separado | Por dia | Por mês) e mais as duas listas de baixo (Marcus, 12/11/2026); Contas pagas abre a mesma tela
    {nome:"Comissões", itens:[M("Representantes","comissoes"), M("Comissão interna","comisstodos"), M("Agendamento","agbonus"), M("Montagem de kits","comismont"), M("Atendimento interno","comisint"), M("Link de pagamento","comlink"), M("Datas de pagamento","comdatas")]},
    {nome:"Fornecedores", itens:[M("Conferência de pagamentos","pflanc"), M("Negociações","pfneg"), M("Maquininha Banho","pfmaq"), M("Cadastro","pfcadastro")]}]},   // Cadastro = fornecedores e prestadores juntos, com filtro de tipo
  {nome:"Receber", itens:[   // tudo que ENTRA de dinheiro
    M("Contas a receber","revreceber"),
    {nome:"Faturamento", itens:[M("Faturamento","previsaofat"), M("Consolidado interno","intcons")]},
    {nome:"Representantes", itens:[M("Consolidado dos representantes","consrep"), M("Comissões dos representantes","comissoes")]},   // 12/11/2026 (Marcus): o financeiro das representantes mora no Financeiro
    ]},
  {nome:"Família", perm:"financeiro_familia", itens:[M("Home da família","ffhome"), {nome:"Contas", itens:[M("A pagar","ctafam"), M("Pagas","ctafamp")]}, M("Gasto por casa","ffcasas"), M("PIX revendedoras","ffpix"), M("Sócios","ffsocios"), M("Cadastro de prestadores","ffprest"), M("Pró-labores","ffprolab"), M("Relatório","ffrelatorio"), M("Histórico","ffhist"), M("Configurações","ffconfig")]},
  Object.assign(M("PIX dos sócios","ffpix"), {perm:"ff_pix,ff_pix_ver"}),   // só quem tem a autorização ff_pix (Ana Beatriz) vê este atalho para a tela PIX, sem o resto da Família
  {nome:"Relatórios", itens:[M("Resultado do mês","resultado"), M("Dinheiro","dinheiro"), Object.assign(M("Resumo do grupo","ffgrupo"), {perm:"financeiro_familia"}), M("Previsão de caixa","previsaocaixa"), M("Estoque Sorelly","estoquesorelly"), M("Análise de custos","ctapagar"), M("Taxas e adquirentes","adquirentes")]},
  {nome:"Cadastro", itens:[M("Bancos","finbancos"), M("Formas de pagamento","finformas")]},   // copia da DevMaster (Marcus, 20/11/2026): bancos e tipos de numerário, com dono e uso em 90 dias
  {nome:"Controle", itens:[M("Arrumar na DevMaster","findm"), M("Atividades","finativ")]}   // só o Marcus (18/11/2026): o menu esconde para as demais pessoas e o servidor confere   // Análise de custos: uma tela só (Sorelly, Família, Sorelly + Família e Funcionários são escolhidos DENTRO da tela)   // no FINAL (Marcus, 12/11/2026): Resumo do grupo e Previsão de caixa
];
// Fiscal (Marcus, 12/11/2026): saiu do Financeiro e virou setor próprio, logo abaixo dele.
// Link de pagamento (Marcus, 16/11/2026: "reorganiza igual ao Financeiro"): cada antiga aba virou tela do menu, na ordem do fluxo: pedido → comprovante → acerto → histórico; depois relatórios e cadastro.
var MENU_LINKPAG = [M("Solicitações","linkpag"), M("Descontados no acerto","linkdesc"),
  {nome:"Relatórios", itens:[M("Relatório de links","linkrel"), M("Análises","linkanal"), M("Taxas e recebimentos","linktaxas")]},
  {nome:"Cadastro", itens:[M("Meios e acessos","linkmeios"), M("Representantes","linkreps")]}];
var MENU_FISCAL = [M("Painel e notas","fiscal"), M("Limite de faturamento","limitefat"), M("CNPJs","cnpjs")];

// Menu do Cadastro de revendedoras (23/10/2026): mesmo estilo do Financeiro (palavras no topo, listas em cascata, abas abertas e busca), na ORDEM DO FLUXO: Cadastro (aprovar) → Kits novos (liberar, solicitar, entregar) → Desempenho.
var MENU_CADASTRO = [
  {nome:"Cadastro", itens:[M("Aprovação de cadastros","aprovacaocad"), M("Base de revendedoras","revendedoras")]},
  {nome:"Kits novos", itens:[M("Kits novos","kitnovo"), M("Pendências","knpendencias"), M("Consolidado","knconsolidado"), M("Regras","knregras"), M("Representantes","knrepresentantes"), M("Entregues","knentregues")]},
  {nome:"Indicações", itens:[M("Funil","indicacoes"), M("Resgates de prêmios","indresgates"), M("Retiradas","indretiradas"), M("Revendedoras e moedas","indrevs"), M("Histórico","indhistorico")]},
  {nome:"Desempenho", itens:[M("Desempenho do cadastro","desempenhocad"), M("Avaliações","avaliacoes")]},
  M("Representantes","repcad"),
  M("Mensagens prontas","msgcad")
];

// Menu do Cadastro de peças (29/10/2026, pedido do Marcus: igual ao Financeiro, com as telas no menu do topo e não em abas dentro da tela). ORDEM DO FLUXO: pedidos de bruto (tela mãe) → controle do mês → banho → peças (cadastro e preço) → fornecedores → configurações. Plano das próximas telas em docs/negocio/FLUXO-DE-COMPRA-DE-BRUTO.md (seção 11).
var MENU_CADPECAS = [
  {nome:"Pedidos", itens:[M("Compras de Bruto","cadpecas"), M("Pedidos Banho/Bruto","cpctrl")]},   // 17/11/2026 (Marcus): Pedidos vira lista de DUAS telas; a primeira abre ao entrar no setor (o quadro); a tela "Compras" (cpcompras) saiu do menu por enquanto
  M("Peças","cppecas"),
  {nome:"Banho", itens:[M("Tabela do banho","cpbanho"), M("Faturas","cpfp"), M("Retirar ouro","cpouro")]},
  {nome:"Cadastro", itens:[M("Solicitações","cpsol"), M("Planilhas de cadastro","cplotes"), M("Calculadora","cpcalc"), M("DevMaster","cpdev")]},
  M("Fornecedores","cpforn"),
  M("Configurações","cpcfg")
];

// Menu das Encomendas e reposições (23/10/2026): mesmo estilo do Financeiro e do Cadastro. Poucas telas = palavras diretas no topo (sem lista), na ORDEM DO FLUXO: pedido → ida na empresa → Top 100 → representantes → expositores → regras.
var MENU_ENCOMENDAS = [
  M("Funil de pedidos","encomendas"),
  M("Top 100","enctop50"),
  M("Representantes","encrep"),
  M("Expositores","expositores"),
  M("Regras e mensagens","encregras")
];

// Menu do Agendamento (23/10/2026): mesmo estilo do Financeiro. Ordem do fluxo: acompanhar o mês → plano 45/60 (indicar, aprovar, medir) → remarcações → representantes → análises e histórico → gestão do mês.
var MENU_AGENDAMENTO = [   // 01/11/2026 (Marcus): Painel (versão D, calendário no centro) volta a ser a PRIMEIRA aba do setor; Plano 45/60 e Remarcações saíram
  M("Painel","agpainel"),
  M("Revendedoras","agrevs"),
  M("Representantes","agreps"),
  M("Atividades","agatividades"),
  M("Pedidos do app","agpedidosapp"),   // 05/11/2026: pedidos de mudança da data do acerto feitos no app da representante
  M("Análises","aganalises"),
  M("Expositores","expositores")   // 09/11/2026: o agendamento dá baixa quando o expositor volta (a tela é a mesma do setor Encomendas)
];

// Menu de Representantes & Kits (23/10/2026): mesmo estilo do Financeiro e do Cadastro, na ORDEM DO FLUXO: Kits (montar, bipar, acompanhar) → Representantes (acerto na rua) → Financeiro (comissões, Pix, inadimplência) → Regras. Nenhuma tela saiu: só mudou de lugar.
var MENU_PRODUCAO = [M("Produção","producao"), M("Premiação","prodpremio"), M("Produção externa","prodcasa"), M("Pagamento por produção","prodpagproducao"), M("Cadastro","prodfunc")];   // setor próprio desde 16/11/2026: Produção (grade do mês), Premiação, Produção externa (Dávila) e Cadastro
var MENU_REPRESENTANTES = [
  // no máximo 2 níveis (palavra → lista): os três grupos de Kits subiram para a barra, na ordem do fluxo
  {nome:"Montagem", itens:[M("Listagens","painel"), M("Condicionais","condicionais"), M("Preferências do kit","prefkit")]},
  {nome:"Bipagem", itens:[M("Visão geral da bipagem","visaobip"), M("Meu desempenho","meudesemp"), M("Comissões da bipagem","comisbip",{perm:"comissao_bipagem"})]},
  {nome:"Acompanhamento", itens:[M("Consolidado","consolidado"), M("Equipe e comissões","equipe"), M("Produtividade da montagem","prodmont"), M("Registros","registros"), M("Relatórios","relatorios")]},
  {nome:"Representantes", itens:[M("Painel","reppainel"), M("Consolidado","consrep"), M("Controle de kits","controlekits"), M("Placar","placar")]}
  // 20/11/2026 (Marcus): saíram do menu Regras dos representantes, Regras dos acertos e Regras da montagem: as regras já estão no banco do servidor e no PDF. As telas continuam abrindo pelo endereço.
];

// Menu do RH (23/10/2026): mesmo estilo do Financeiro. Ordem do fluxo: acompanhar o dia → pessoas → contratos → acessos → configurar. Nenhuma tela saiu: só mudou de lugar. Contratos ganhou Crédito bancário, Aluguéis e Consórcios.
var MENU_RH = [
  M("Visão geral","rhvisao"),
  {nome:"Presença", itens:[M("Presença diária","rhpresenca"), M("Relatório diário","rhrelatorio")]},
  {nome:"Colaboradores", itens:[M("Colaboradores","rhcolab")]},
  M("Segurança do trabalho","rhseg"),
  M("Pesquisa de clima","clima"),   // só Marcus e Maria (RH): o menu esconde para as demais pessoas e o servidor confere
  M("Canal de denúncias","denuncias"),   // só Marcus e Maria (RH): o menu esconde para as demais pessoas e o servidor confere
  {nome:"Contratos", itens:[
    {nome:"Pessoas", itens:[M("Representantes","rhcrep"), M("Funcionários (CLT)","rhcfunc"), M("Terceiros","rhcterc")]},
    {nome:"Empresa", itens:[M("Crédito bancário","rhccred"), M("Aluguéis","rhcalug"), M("Consórcios","rhcconsor")]},
    M("Particulares do Marcus","rhcmarcus"), M("Modelos de contrato","rhcmodelos")]},
  {nome:"Pessoas", itens:[M("Funcionários e representantes","pessoas"), M("Equipes","equipes"), M("Acessos e autorizações","acessos")]},
  M("Configurador","rhconfig")
];

// Menus dos setores pequenos (26/10/2026, padronização do topo): mesma peça `menu` de Financeiro/RH/Encomendas, só que com `semAbas:true`
// (poucas telas, viram palavra direta, sem faixa de abas abertas — regra de PADRAO-VISUAL.md "MENU DO SETOR"). Nenhuma tela mudou de lugar: só ganhou a faixa padronizada.
var MENU_REVENDEDORAS = [M("Cadastro","revbase"), M("Kits e vendas","revkits"), M("Condicional","revcond")];
var MENU_METAS = [M("Revendedoras","metrev"), M("Acompanhamento","metacomp"), M("Histórico","methist"), M("Notificações","metnotif"), M("Regras","metregras")];   // Metas das revendedoras (retomadas em 02/11/2026); as outras telas (Campanha, Simulador, Acompanhamento, Brindes, Histórico, Regras) vêm depois
var MENU_PONTUAL = [M("Clientes","pontclientes"), M("Tabelas de preço","pontprecos"), M("Inadimplência","pontinad"), M("Pós-venda","pontposvenda"), M("Regras","pontregras")];   // Pontual, empresa de banho do Valdir (06/11/2026): demonstração com 250 clientes inventados
var MENU_ATENDIMENTO = [M("Revendedoras","intrevs"), M("Listagens","intlist"), M("Bipagem de envio","intbipenv"), M("Atendimento Sorelly","intcalc"), M("Consolidado Sorelly","intcons")];
// Materiais e estoque (17/11/2026, Marcus: "igual ao Financeiro"): as abas de dentro da tela viraram itens do menu, na ordem do fluxo: painel → visão geral → estoque (saldo, entradas e saídas, retiradas) → tabela de preços → cadastros → configurações.
// Quadro de compras e Planilha de compras saíram do menu (o Painel faz os dois) e continuam só como endereço.
var MENU_ESTOQUE = [
  M("Painel","compras"),
  M("Visão geral","cevisao"),
  {nome:"Estoque", itens:[M("Estoque de material","ceestoque"), M("Movimentos","cemov"), M("Pedidos de material","cesol")]},
  M("Tabela de preços","ceprecos"),
  M("Cadastros","cecad"),
  M("Configurações","cecfg")
];
// Material gráfico (17/11/2026, Marcus: "menos abas"): seis palavras diretas, sem lista dentro de lista. Kits e Vendas entram nas fases 2 e 3.
var MENU_GRAFICO = [M("Painel","gfpainel"), M("Compras","gfcompras"), M("Tabela de preços","gfprecos"), M("Estoque","gfestoque"), M("Kits","gfkits"), M("Vendas","gfvendas")];
var MENU_GARANTIA = [M("Garantia","garantia"), M("Créditos","garantiacred")];
var MENU_POSVENDAS = [M("Contatos","posvendas")];
// Central de controle vem PRIMEIRO (28/10/2026, pedido do Marcus); "Comissões e desempenho" saiu (não é usada, já existe em Financeiro → Comissões).
var MENU_DIRETORIA = [
  M("Mapa do sistema","mapa")];
var MENU_JURIDICO = [
  {nome:"Notas promissórias", itens:[M("Execução de notas promissórias", undefined, {breve:true}), M("Inadimplência jurídica", undefined, {breve:true})]},
  M("Contratos de salas comerciais", undefined, {breve:true}),
  M("Marcas e patentes", undefined, {breve:true})
];
// Inadimplência (11/11/2026, Marcus): setor da Amanda de Miranda, no lugar da planilha de negociações. Palavras na ordem do fluxo.
// 13/11/2026 (Marcus): toda cobrança num setor só, com um botão no topo por público: Revendedoras, Funcionários (compra de peças) e Representantes.
var MENU_INAD = [{nome:"Revendedoras", itens:[M("Dívidas","inaddiv"), M("Cobrança do dia","inadcob"), M("Pagamentos","inadpag"), M("Serasa","inadser"), M("Kits em atraso","inadkit"), M("Relatórios","inadrel"), M("Regras","inadreg")]}, {nome:"Funcionários", itens:[M("Visão geral","cfvisao"), M("Devendo","cfdevendo"), M("Quitadas","cfquitados"), M("Relatórios mensais","cfrelatorio"), M("Funcionárias","cffunc"), M("Regras","cfregras"), M("Configuração","cfconfig")]}, {nome:"Representantes", itens:[M("Inadimplência","inadimp"), M("Compras de joias","comprasrep")]}];
var MENU_SERVICOS = [M("Segurança", undefined, {breve:true}), M("Limpeza e zeladoria", undefined, {breve:true})];
var MENU_MARKETING = [M("Marketing","marketing"), M("Fotos de catálogo","fotoscat"), M("Relatório diário","relmkt"), M("Campanhas", undefined, {breve:true}), M("Tráfego pago","trafego"), M("Criativos","criativos"), Object.assign(M("Modelos","modelos"), {perm:"modelos_ver"})];   // Modelos veio das Encomendas para o Marketing em 12/11/2026 (pedido do Marcus); só quem tem a autorização modelos_ver

var SETORES = [
  // Grupo "Geral" (28/10/2026, reorganização do menu lateral): Início, SorellyChat e Dashboard juntos no topo.
  {id:"inicio", grupo:"geral", nome:"Início", ic:"coroa", cor:"#E8B84B", direto:T("inicio","Início")},   // página inicial de todos (27/10/2026): foto, mensagem de fé, setores e o dia da pessoa
  {id:"melhorias", grupo:"geral", nome:"Chamados", ic:"sino", cor:"#E8B84B", direto:T("melhorias","Chamados")},   // todo funcionário pede mudanças no sistema (28/10/2026)
  {id:"whats", grupo:"geral", nome:"SorellyChat", ic:"whats", cor:"#E8B84B", direto:T("whats","SorellyChat")},
  {id:"visao", grupo:"geral", nome:"Dashboard", ic:"dashboard", cor:"#D9A63A", direto:T("visaogeral","Visão geral")},
  // Rotina do dia SAIU do menu (28/10/2026, pedido do Marcus): a DevMaster vai trazer tudo automático; o que precisar atualizar à mão vira UMA aba só, ainda a definir. Tela e código continuam no projeto, só não aparecem mais.
  // CNPJs virou parte do Financeiro → Fiscal (28/10/2026, pedido do Marcus: "o CNPJ é o fiscal"); saiu do topo.
  {id:"apps", grupo:"geral", nome:"Apps", ic:"phone", cor:"#8B5CF6", direto:T("apps","Apps")},
  // Agendamento (acertos): trazido do SorellyAdmin: painel mensal, cotas por representante, abertura, configurador, análises e histórico
  {id:"financeiro", nome:"Financeiro", ic:"banco", cor:"#3B82F6", menu:MENU_FINANCEIRO, areas:[
    {nome:"Resultado", telas:[T("resultado","Resultado do mês")]},
    {nome:"Atividades", telas:[T("finativ","Atividades")]},
    {nome:"Arrumar na DevMaster", telas:[T("findm","Arrumar na DevMaster")]},
    {nome:"Cadastro", telas:[T("finbancos","Bancos"), T("finformas","Formas de pagamento")]},
    {nome:"Faturas", telas:[T("fffaturas","Faturas do cartão")]},
    {nome:"Pagamentos", telas:[T("direcionar","Direcionar"), T("dirregras","Contas das representantes")]},
    G("Saldo das\ncontas", [
      ["Contas bancárias", [I("caixa","Contas bancárias",["Contas Bancárias → Visão geral, Lançamento diário, Histórico e Configurador","Faturamento vs Contas a Pagar → Saldos bancários (agora calculado sozinho)"])]],
      ["Chaves Pix", [T("chavespixbanco","Chaves Pix"), T("chavespix","Contas Pix")]],
      ["Dinheiro", [T("dinheiro","Dinheiro")]],
      ["Adquirentes e taxas", [T("adquirentes","Taxas e adquirentes")]]]),
    // Contas a pagar: tela única (empresa por CNPJ + família) e, dentro da mesma área, o Financeiro familiar (decisão do Marcus de 19/10/2026: o familiar fica dentro do Contas a pagar)
    G("Contas a\npagar", [
      ["Contas a pagar", [T("ctalista","A pagar / Pagas"), T("pagaspordia","Contas pagas"), T("ctapagar","Análise de custos"), T("emprestimos","Empréstimos")]],
      ["Financeiro familiar", [T("ffhome","Home da família"), T("ffcontas","Contas a pagar da família"), T("ffpagas","Contas pagas da família"), T("ctafam","Contas a pagar da família"), T("ctafamp","Contas pagas da família"), T("ffpix","PIX revendedoras"), T("ffgrupo","Resumo do grupo")]],
      ["Família: gestão e análise", [T("ffsocios","Sócios"), T("ffprest","Cadastro de prestadores"), T("ffprolab","Pró-labores")]]]),
    G("Pagamentos a\nfornecedores", [
      ["Principal", [T("pfresumo","Geral"), T("pflanc","Conferência de pagamentos"), T("pfneg","Negociações"), T("pfmaq","Maquininha Banho")]],
      ["Cadastros", [T("pfcadastro","Cadastro"), T("pfforn","Fornecedores"), T("pfprest","Prestadores de serviço")]]]),
    G("Faturamento &\ncontas a pagar", [
      ["Faturamento", [I("previsaofat","Consolidado do faturamento",["Faturamento vs Contas a Pagar → Painel (refeita: lançamento diário só do dia anterior, ligada à Contas a pagar)"])]],
      ["Contas a pagar", [I("contaspagar","Contas a pagar",["Faturamento vs Contas a Pagar → Contas a pagar (refeita: lançamento manual de Pago e A pagar por mês, visão Total e por CNPJ)"]),
        E("Histórico de contas",["Faturamento vs Contas a Pagar → Histórico de contas"])]],
      ["Contas a receber", [T("revreceber","Contas a receber")]],
      ["Interno e estoque", [T("intcons","Consolidado interno"), T("estoquesorelly","Estoque Sorelly")]]]),
    {nome:"Representantes", telas:[T("consrep","Consolidado dos representantes"), Ti("comissoes","Comissões dos representantes","representante","#8B5CF6")]},
    {nome:"Comissões", telas:[Ti("comisstodos","Comissão interna","grid4","#D9A63A"), Ti("agbonus","Agendamento","agenda","#A855F7"), Ti("comcad","Cadastro de revendedoras","cadastro","#F97316"), Ti("cominad","Inadimplência","alert","#EF4444"),
    Ti("comismont","Montagem de kits","montadora","#F59E0B"), Ti("comisint","Atendimento interno","calendario","#E8B84B"), Ti("comlink","Link de pagamento","coins","#14B8A6"), Ti("comdatas","Datas de pagamento","calendario","#3B82F6")]},
  ]},
  {id:"fiscal", nome:"Fiscal", ic:"arquivo", cor:"#3B82F6", menu:MENU_FISCAL, semAbas:true, areas:[
    {nome:"Fiscal", telas:[T("fiscal","Painel e notas"), T("limitefat","Limite de faturamento"), T("cnpjs","CNPJs")]}]},
  {id:"agendamento", nome:"Agendamento", ic:"agenda", cor:"#A855F7", menu:MENU_AGENDAMENTO, semAbas:true, areas:[
    {nome:"Painel", telas:[T("agpainel","Painel")]}, {nome:"Revendedoras", telas:[T("agrevs","Revendedoras")]}, {nome:"Representantes", telas:[T("agreps","Representantes")]},
    {nome:"Atividades", telas:[T("agatividades","Atividades")]}, {nome:"Pedidos do app", telas:[T("agpedidosapp","Pedidos do app")]}, {nome:"Análises", telas:[T("aganalises","Análises")]}]},
  // Fiscal voltou para dentro do Financeiro (23/10/2026, pedido do Marcus)
  // Cadastro de revendedoras: 4 categorias e 20 telas (estrutura passada pelo Marcus em 14/10/2026) + Kits novos, que já existe pronto
  {id:"cadastro", nome:"Cadastro de revendedoras", ic:"cadastro", cor:"#F97316", menu:MENU_CADASTRO, areas:[
    {nome:"Base de revendedoras", telas:[
      Object.assign(T("revendedoras","Base de revendedoras"), {adm:true, origem:["Revendedoras diárias: histórico dia a dia, entradas, saídas e saldo"]})]},
    {nome:"Aprovação de cadastros", telas:[
      T("aprovacaocad","Aprovação de cadastros")]},
    {nome:"Desempenho do cadastro", telas:[
      T("desempenhocad","Desempenho do cadastro")]},
    {nome:"Indicações", telas:[
      T("indicacoes","Funil"), T("indresgates","Resgates de prêmios"), T("indretiradas","Retiradas"), T("indrevs","Revendedoras e moedas"), T("indhistorico","Histórico")]},
    {nome:"Representantes", telas:[
      T("repcad","Representantes")]},
    {nome:"Mensagens prontas", telas:[
      T("msgcad","Mensagens prontas")]},
    {nome:"Avaliações", telas:[
      T("avaliacoes","Avaliações")]},
    {nome:"Kits novos", telas:[
      Object.assign(T("kitnovo","Kits novos"), {adm:true, origem:["Cadastro, liberação, direcionamento e entrega — planilha Curitiba"]}),
      T("knpendencias","Pendências"), T("knconsolidado","Consolidado"), T("knregras","Regras"), T("knrepresentantes","Representantes"), T("knentregues","Entregues")]}]},
  // Kits = só a montagem. Representantes e Atendimento interno viraram setores próprios (decisão de 13/10/2026).
  // Representantes & Kits num setor só (decisão de 15/10/2026): as áreas de Representantes (campo) e de Kits (interno) ficam separadas lá dentro; o financeiro vai chegar às comissões por aqui e pela aba Financeiro
  {id:"revbase", nome:"Revendedoras", ic:"users", cor:"#F59E0B", menu:MENU_REVENDEDORAS, semAbas:true, areas:[
    {nome:"Revendedoras", telas:[T("revbase","Cadastro"), T("revkits","Kits e vendas"), T("revcond","Condicional")]}]},   // base de todos os setores, lida da DevMaster (26/10/2026); por ora só Diretoria
  {id:"metas", nome:"Metas", ic:"grafico", cor:"#D4A84B", menu:MENU_METAS, semAbas:true, areas:[
    {nome:"Metas", telas:[T("metrev","Revendedoras"), T("metacomp","Acompanhamento"), T("methist","Histórico"), T("metnotif","Notificações"), T("metregras","Regras")]}]},   // metas por revendedora, mês a mês (02/11/2026); por ora só Diretoria
  {id:"pontual", nome:"Pontual", ic:"caixa", cor:"#C98B2C", menu:MENU_PONTUAL, semAbas:true, areas:[
    {nome:"Pontual", telas:[T("pontclientes","Clientes"), T("pontprecos","Tabelas de preço"), T("pontinad","Inadimplência"), T("pontposvenda","Pós-venda"), T("pontregras","Regras")]}]},   // admin do Valdir (empresa de banho), dados de demonstração; só a supervisão abre (06/11/2026)
  {id:"representantes", nome:"Representantes & Kits", ic:"representante", cor:"#8B5CF6", menu:MENU_REPRESENTANTES, areas:[
    {nome:"Representantes", telas:[T("reppainel","Painel das representantes"), T("consrep","Consolidado Representante"), T("controlekits","Controle de kits")]},
    {nome:"Regras", telas:[T("regrasrep","Regras dos representantes"), T("regrasacerto","Regras dos acertos")]},
    {nome:"Desempenho", telas:[T("placar","Placar das representantes")]},
    {nome:"Kits (interno)", telas:[T("visaobip"), T("meudesemp"), T("comisbip","Comissões da bipagem"), T("painel"), T("condicionais"),
      T("consolidado"), T("regras"),
      T("prefkit","Preferências do kit"), T("filamont","Fila de montagem"), T("prodmont","Produtividade da montagem"),
      T("equipe"), T("registros"), T("relatorios")]},
  ]},
  // Produção de peças: setor próprio (16/11/2026, pedido do Marcus). Saiu de Representantes & Kits › Montagem; a tela e os dados são os mesmos (`pages/Producao.js`, `domain/producao.js`).
  {id:"producao", nome:"Produção", ic:"montadora", cor:"#EC4899", menu:MENU_PRODUCAO, semAbas:true, areas:[
    {nome:"Produção", telas:[T("producao","Produção"), T("prodpremio","Premiação"), T("prodcasa","Produção externa"), T("prodpagproducao","Pagamento por produção"), T("prodfunc","Cadastro")]}]},
  // Link de pagamento: setor próprio (quem opera é a Helen); o Financeiro só tem o relatório (decisão de 16/10/2026)
  // 12/11/2026 (Marcus): o relatório de links de pagamento mora AQUI, no setor Link de pagamento (saiu do Financeiro).
  {id:"linkpag", nome:"Link de pagamento", ic:"banco", cor:"#0EA5E9", menu:MENU_LINKPAG, areas:[
    {nome:"Link de pagamento", telas:[T("linkpag","Solicitações"), T("linkdesc","Descontados no acerto"), T("linkrel","Relatório de links de pagamento"), T("linkanal","Análises"), T("linktaxas","Taxas e recebimentos"), T("linkmeios","Meios e acessos"), T("linkreps","Representantes")]}]},
  {id:"atendimento", nome:"Atendimento interno", ic:"calendario", cor:"#E8B84B", menu:MENU_ATENDIMENTO, semAbas:true, areas:[
    {nome:"Revendedoras na empresa", telas:[T("intrevs","Revendedoras"), T("intlist","Listagens"), T("intbipenv","Bipagem de envio"), T("intcalc","Atendimento Sorelly"), T("intcons","Consolidado Sorelly")]}]},
  {id:"estoque", nome:"Materiais & Estoque", ic:"cubos", cor:"#6366F1", menu:MENU_ESTOQUE, areas:[
    {nome:"Compras", telas:[T("compras","Painel"), T("cevisao","Visão geral"), T("cequadro","Quadro de compras"), T("ceplanilha","Planilha de compras")]},   // Quadro e Planilha ficam só no endereço (fora do menu): os links antigos continuam abrindo o Funil
    {nome:"Estoque", telas:[T("ceestoque","Estoque de material"), T("cemov","Movimentos"), T("cesol","Pedidos de material"), T("ceprecos","Tabela de preços")]},
    {nome:"Cadastros", telas:[T("cecad","Cadastros"), T("cecfg","Configurações")]}]},
  {id:"grafico", nome:"Material gráfico", ic:"cubos", cor:"#EC4899", menu:MENU_GRAFICO, areas:[
    {nome:"Material gráfico", telas:[T("gfpainel","Painel"), T("gfcompras","Compras"), T("gfprecos","Tabela de preços"), T("gfestoque","Estoque"), T("gfkits","Kits"), T("gfvendas","Vendas")]}]},
  // Cadastro de peças: setor próprio na barra lateral (pedido do Marcus, 21/10/2026; responsável Rayssa, Financeiro também acessa)
  {id:"cadpecas", nome:"Cadastro de peças", ic:"cubos", cor:"#3B82F6", menu:MENU_CADPECAS, areas:[
    {nome:"Pedidos", telas:[T("cadpecas","Compras de Bruto"), T("cpctrl","Pedidos Banho/Bruto")]},
    {nome:"Peças", telas:[T("cppecas","Peças")]},
    {nome:"Banho", telas:[T("cpbanho","Tabela do banho"), T("cpfp","Faturas"), T("cpouro","Retirar ouro")]},
    {nome:"Cadastro", telas:[T("cpsol","Solicitações"), T("cplotes","Planilhas de cadastro"), T("cpcalc","Calculadora"), T("cpdev","DevMaster")]},
    {nome:"Fornecedores", telas:[T("cpforn","Fornecedores")]},
    {nome:"Configurações", telas:[T("cpcfg","Configurações")]}]},
  {id:"encomendas", nome:"Encomendas", ic:"caminhao", cor:"#14B8A6", menu:MENU_ENCOMENDAS, semAbas:true, areas:[
    {nome:"Funil de pedidos", telas:[T("encomendas","Funil de pedidos")]},
    {nome:"Top 100", telas:[T("enctop50","Top 100")]},
    {nome:"Representantes", telas:[T("encrep","Representantes")]},
    {nome:"Expositores", telas:[T("expositores","Expositores")]},
    {nome:"Regras e mensagens", telas:[T("encregras","Regras e mensagens")]}]},
  {id:"garantia", nome:"Garantia", ic:"escudo", cor:"#A855F7", menu:MENU_GARANTIA, semAbas:true, areas:[
    {nome:"Garantias", telas:[T("garantia","Garantia")]},
    {nome:"Créditos", telas:[T("garantiacred","Créditos")]}]},
  {id:"posvendas", nome:"Pós-vendas", ic:"phone", cor:"#EC4899", menu:MENU_POSVENDAS, semAbas:true, areas:[
    {nome:"Contatos", telas:[T("posvendas","Pós-vendas")]}]},
  {id:"rh", nome:"Recursos Humanos", ic:"maleta", cor:"#8B5CF6", menu:MENU_RH, areas:[
    {nome:"Visão geral", telas:[T("rhvisao","Visão geral do RH")]},
    {nome:"Presença", telas:[T("rhpresenca","Presença diária"), T("rhrelatorio","Relatório diário")]},
    {nome:"Colaboradores", telas:[T("rhcolab","Colaboradores")]},
    {nome:"Segurança do trabalho", telas:[T("rhseg","Segurança do trabalho")]},
    {nome:"Pesquisa de clima", telas:[T("clima","Pesquisa de clima")]},
    {nome:"Canal de denúncias", telas:[T("denuncias","Canal de denúncias")]},
    {nome:"Contratos", telas:[T("rhcrep","Representantes"), T("rhcfunc","Funcionários (CLT)"), T("rhcterc","Terceiros"), T("rhcmarcus","Particulares do Marcus"), T("rhccred","Crédito bancário"), T("rhcalug","Aluguéis"), T("rhcconsor","Consórcios"), T("rhcmodelos","Modelos de contrato")]},
    {nome:"Pessoas", telas:[T("pessoas","Funcionários e representantes"), T("equipes","Equipes"), T("acessos","Acessos e autorizações")]},
    {nome:"Configurador", telas:[T("rhconfig","Configurador do RH")]}]},
  // Diretoria subiu para o grupo "Geral" (28/10/2026, pedido do Marcus) e ganhou a área "Central de controle" (era o setor Tecnologia), que vem PRIMEIRO.
  // "Comissões e desempenho" saiu (28/10/2026): não é usada, já existe em Financeiro → Comissões.
  {id:"diretoria", grupo:"geral", nome:"Diretoria", ic:"coroa", cor:"#D9A63A", menu:MENU_DIRETORIA, semAbas:true, areas:[
    {nome:"Central de controle", telas:[T("mapa","Mapa do sistema")]}]},
  // Sistema particular do Marcus (20/10/2026): só aparece no modo "Marcus" do botão do alto do menu, e só para ele
  // Sistema particular do Marcus (20/10/2026): cada tela é um item do menu lateral, só aparece no modo "Marcus" (ids começam com "marcus")
  {id:"marcus", nome:"Resumo", ic:"grid4", cor:"#D9A63A", direto:T("marcus","Resumo")},
  {id:"marcusfat", nome:"Faturamento", ic:"grafico", cor:"#D9A63A", direto:T("marcusfat","Faturamento")},
  {id:"marcuspat", nome:"Patrimônio e dívidas", ic:"banco", cor:"#D9A63A", direto:T("marcuspat","Patrimônio e dívidas")},
  {id:"marcuscontas", nome:"Contas do mês", ic:"calendario", cor:"#D9A63A", direto:T("marcuscontas","Contas do mês")},
  {id:"marcusextratos", nome:"Extratos", ic:"banco", cor:"#D9A63A", direto:T("marcusextratos","Extratos")},
  {id:"marcusativ", nome:"Atividades", ic:"caixa", cor:"#D9A63A", direto:T("marcusativ","Atividades")},
  {id:"marcusacessos", nome:"Acessos e senhas", ic:"escudo", cor:"#D9A63A", direto:T("marcusacessos","Acessos e senhas")},
  {id:"marcusdados", nome:"Dados", ic:"users", cor:"#D9A63A", direto:T("marcusdados","Dados")},
  {id:"marcusprog", nome:"Progresso", ic:"calendario", cor:"#D9A63A", direto:T("marcusprog","Progresso")},
  // Jurídico (16/10/2026): só as abas por enquanto; o Marcus quer ver tudo no menu e executar depois. Contexto em docs/negocio/JURIDICO-COBRANCA.md
  {id:"inadimplencia", nome:"Inadimplência", ic:"registro", cor:"#F97316", menu:MENU_INAD, semAbas:true, areas:[
    {nome:"Inadimplência", telas:[T("inaddiv","Dívidas"), T("inadcob","Cobrança do dia"), T("inadpag","Pagamentos"), T("inadser","Serasa"), T("inadkit","Kits em atraso"), T("inadrel","Relatórios"), T("inadreg","Regras")]},
    {nome:"Funcionários", telas:[T("cfvisao","Visão geral da cobrança"), T("cfdevendo","Devendo"), T("cfquitados","Quitadas"), T("cfrelatorio","Relatórios mensais"), T("cffunc","Funcionárias da cobrança"), T("cfregras","Regras da cobrança"), T("cfconfig","Configuração da cobrança")]},
    {nome:"Representantes", telas:[T("inadimp","Inadimplência dos representantes"), T("comprasrep","Compras de joias")]}]},
  {id:"juridico", nome:"Jurídico", ic:"escudo", cor:"#DC2626", menu:MENU_JURIDICO, semAbas:true, areas:[
    {nome:"Notas promissórias", telas:[B("Execução de notas promissórias"), B("Inadimplência jurídica")]},
    {nome:"Salas comerciais", telas:[B("Contratos de salas comerciais")]},
    {nome:"Marcas e patentes", telas:[B("Marcas e patentes")]}]},
  {id:"servicos", nome:"Segurança e limpeza", ic:"vassoura", cor:"#64748B", menu:MENU_SERVICOS, semAbas:true, areas:[
    {nome:"Segurança", telas:[B("Segurança")]},
    {nome:"Limpeza", telas:[B("Limpeza e zeladoria")]}]},
  {id:"marketing", nome:"Marketing", ic:"megafone", cor:"#EC4899", menu:MENU_MARKETING, semAbas:true, areas:[
    {nome:"Marketing", telas:[T("marketing","Marketing"), T("fotoscat","Fotos de catálogo"), T("relmkt","Relatório diário"), B("Campanhas"), T("trafego","Tráfego pago"), T("criativos","Criativos"), T("modelos","Modelos")]}]},
  // Regras (05/11/2026, Marcus): setor próprio, todos os funcionários veem; só o Guia resumido e o Guia da revendedora em PDF (saiu de Cadastro de revendedoras → Folders)
  {id:"regrasguias", nome:"Regras", ic:"book", cor:"#E8B84B", direto:T("regrasguias","Regras")},
  // PGR e PCMSO (17/11/2026, Maria e Marcus): aba só para os documentos de segurança; todo colaborador abre, e vê só os do próprio CNPJ
  {id:"segdocs", nome:"PGR e PCMSO", ic:"escudo", cor:"#3B82F6", direto:T("segdocs","PGR e PCMSO")},
  // Aulas do setor (02/11/2026): ÚLTIMO item do menu; cada pessoa vê só os cursos do próprio setor (domain/aulas.js)
  {id:"aulas", nome:"Aulas do setor", ic:"book", cor:"#14B8A6", direto:T("aulas","Aulas do setor")}
];
// Barra do topo em grupos (padrão visual, opção D): o nome do grupo aparece em cima dos botões. Setor sem "grupo" nas áreas segue com a barra simples.
var GRUPO_BARRA = {"financeiro":{"Controle de\npagamentos":"Pagamentos", "Contas a\npagar":"Pagamentos", "Pagamentos a\nfornecedores":"Pagamentos", "Faturamento &\ncontas a pagar":"Faturamento", 
  "Representantes":"Pessoas", "Comissões":"Pessoas", "Cobrança":"Pessoas", "Saldo das\ncontas":"Bancos", "Link de\npagamento":"Relatórios"}};
SETORES.forEach(function(st){ var g = GRUPO_BARRA[st.id]; if(g) (st.areas||[]).forEach(function(ar){ if(g[ar.nome]) ar.grupo = g[ar.nome]; }); });
var APPS_TOPO = [["celrep","App representante","representante","#8B5CF6"],["celfunc","App das funcionárias","montadora","#F59E0B"]];
var SETORES_BAIXO = [];   // Equipes passou para o RH (16/10/2026)
function ondeEsta(aba){ var r = null; SETORES.forEach(function(st){ (st.areas||[]).forEach(function(ar, i){ ar.telas.forEach(function(t){ if(!r && t.aba===aba) r = {setor:st, area:ar, i:i}; }); }); }); return r; }
function telaPorNome(nome){ var r = null; SETORES.forEach(function(st){ (st.areas||[]).forEach(function(ar){ ar.telas.forEach(function(t){ if(!r && t.nome===nome) r = t; }); }); }); return r; }

// Tela que abre ao clicar no setor (Marcus, 12/11/2026: "100% das vezes abrir no Direcionar"): a PRIMEIRA tela do menu do setor (campo `menu`), na ordem em que o menu mostra; sem menu, a primeira das áreas. Tela "em breve" fica por último.
function primeiraTelaDoSetor(st){
  if(st.direto) return st.direto;
  var todas = [].concat.apply([], (st.areas||[]).map(function(ar){ return ar.telas; }));
  var achaTela = function(aba){ return todas.find(function(t){ return t.aba===aba; }); };
  var daLista = function(lista){ for(var i=0; i<(lista||[]).length; i++){ var n = lista[i], t = null; if(n.aba && !n.breve) t = achaTela(n.aba); if(!t && n.itens) t = daLista(n.itens); if(t) return t; } return null; };
  return daLista(st.menu) || todas.find(function(t){ return !t.breve; }) || todas[0];
}
export { primeiraTelaDoSetor, T, B, E, G, I, SETORES, APPS_TOPO, SETORES_BAIXO, ondeEsta, telaPorNome };
