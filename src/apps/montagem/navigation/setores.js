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
  {nome:"Saldo das contas", itens:[M("Contas bancárias","caixa"), M("Chaves Pix","chavespixbanco"), M("Regras do Pix","chavespix"), M("Dinheiro","dinheiro"), M("Taxas e adquirentes","adquirentes")]},   // 1º item da barra: o Financeiro abre direto no saldo das contas (Marcus, 21/10/2026)
  M("Pagamentos","cpagamentos"),
  {nome:"Fornecedores", itens:[M("Geral","pfresumo"), M("Lançamento de pagamentos","pflanc"), M("Negociações","pfneg"), M("Maquininha Banho","pfmaq"), M("Fornecedores","pfforn"), M("Prestadores de serviço","pfprest")]},
  M("Contas a pagar","ctalista"),
  M("Análise de custos","ctapagar"),   // uma tela só: Sorelly, Família, Sorelly + Família e Funcionários são escolhidos DENTRO da tela (Marcus, 22/10/2026)
  {nome:"Financeiro familiar", perm:"financeiro_familia", itens:[M("Home da família","ffhome"), M("Alertas","ffalertas"), M("Contas a pagar da família","ffcontas"), M("Contas pagas da família","ffpagas"), M("PIX revendedoras","ffpix"), M("Sócios","ffsocios"), M("Cadastro de prestadores","ffprest"), M("Pró-labores","ffprolab"), M("Relatório","ffrelatorio"), M("Histórico","ffhist"), M("Configurações","ffconfig")]},
  {nome:"Faturamento", itens:[M("Faturamento","previsaofat"), M("Consolidado interno","intcons"), M("Estoque Sorelly","estoquesorelly")]},
  {nome:"Representantes", itens:[M("Consolidado dos representantes","consrep"), M("Comissões dos representantes","comissoes"), M("Inadimplência dos representantes","inadimp")]},
  {nome:"Comissões", itens:[M("Visão geral","comisstodos"), M("Agendamento","agbonus"), M("Bipagem","comisbip"), M("Montagem de kits","comismont"), M("Atendimento interno","comisint"), M("Link de pagamento","comlink"), M("Datas de pagamento","comdatas")]},
  {nome:"Cobrança", itens:[M("Inadimplência","inadfin"), {nome:"Cobrança de funcionários", itens:[M("Visão geral","cfvisao"), M("Devendo","cfdevendo"), M("Quitadas","cfquitados"), M("Relatórios mensais","cfrelatorio"), M("Funcionárias","cffunc"), M("Regras","cfregras"), M("Configuração","cfconfig")]}]},
  M("Link de pagamento","linkrel")
];

var SETORES = [
  {id:"whats", nome:"SorellyChat", ic:"whats", cor:"#E8B84B", direto:T("whats","SorellyChat")},
  {id:"visao", nome:"Visão geral", ic:"grid4", cor:"#D9A63A", direto:T("visaogeral","Visão geral")},
  {id:"rotina", nome:"Rotina do dia", ic:"calendario", cor:"#22C55E", direto:T("rotina","Rotina do dia")},
  {id:"apps", nome:"Apps", ic:"phone", cor:"#8B5CF6", direto:T("apps","Apps")},
  {id:"cnpjs", nome:"CNPJs", ic:"banco", cor:"#B8892B", direto:T("cnpjs","CNPJs")},
  {id:"fiscal", nome:"Fiscal", ic:"arquivo", cor:"#06B6D4", areas:[
    G("Fiscal", [
      ["Fiscal", [I("limitefat","Limite de faturamento",["Projeção até 31/12 por CNPJ contra o limite de R$ 3,6 milhões, com alerta"]), I("fiscal","Painel e notas",["Fiscal → Painel, Entradas, Saídas, Contas a pagar, Dashboard anual e Configuração"])]]])
  ]},
  // Agendamento (acertos): trazido do SorellyAdmin: painel mensal, cotas por representante, abertura, configurador, análises e histórico
  {id:"financeiro", nome:"Financeiro", ic:"banco", cor:"#3B82F6", menu:MENU_FINANCEIRO, areas:[
    G("Saldo das\ncontas", [
      ["Contas bancárias", [I("caixa","Contas bancárias",["Contas Bancárias → Visão geral, Lançamento diário, Histórico e Configurador","Faturamento vs Contas a Pagar → Saldos bancários (agora calculado sozinho)"])]],
      ["Chaves Pix", [T("chavespixbanco","Chaves Pix"), T("chavespix","Chaves Pix e regras")]],
      ["Dinheiro", [T("dinheiro","Dinheiro")]],
      ["Adquirentes e taxas", [T("adquirentes","Taxas e adquirentes")]]]),
    {nome:"Controle de\npagamentos", telas:[T("cpagamentos","Controle de pagamentos")]},
    // Contas a pagar: tela única (empresa por CNPJ + família) e, dentro da mesma área, o Financeiro familiar (decisão do Marcus de 19/10/2026: o familiar fica dentro do Contas a pagar)
    G("Contas a\npagar", [
      ["Contas a pagar", [T("ctalista","Contas a pagar"), T("ctapagar","Análise de custos"), T("emprestimos","Empréstimos")]],
      ["Financeiro familiar", [T("ffhome","Home da família"), T("ffalertas","Alertas da família"), T("ffcontas","Contas a pagar da família"), T("ffpagas","Contas pagas da família"), T("ffpix","PIX revendedoras")]],
      ["Família: gestão e análise", [T("ffsocios","Sócios"), T("ffprest","Cadastro de prestadores"), T("ffprolab","Pró-labores"), T("ffrelatorio","Relatório"), T("ffhist","Histórico"), T("ffconfig","Configurações da família")]]]),
    G("Pagamentos a\nfornecedores", [
      ["Principal", [T("pfresumo","Geral"), T("pflanc","Lançamento de pagamentos"), T("pfneg","Negociações"), T("pfmaq","Maquininha Banho")]],
      ["Cadastros", [T("pfforn","Fornecedores"), T("pfprest","Prestadores de serviço")]]]),
    G("Faturamento &\ncontas a pagar", [
      ["Faturamento", [I("previsaofat","Consolidado do faturamento",["Faturamento vs Contas a Pagar → Painel (refeita: lançamento diário só do dia anterior, ligada à Contas a pagar)"])]],
      ["Contas a pagar", [I("contaspagar","Contas a pagar",["Faturamento vs Contas a Pagar → Contas a pagar (refeita: lançamento manual de Pago e A pagar por mês, visão Total e por CNPJ)"]),
        E("Histórico de contas",["Faturamento vs Contas a Pagar → Histórico de contas"])]],
      ["Inadimplência", [T("inadfin","Inadimplência")]],
      ["Interno e estoque", [T("intcons","Consolidado interno"), T("estoquesorelly","Estoque Sorelly")]]]),
    {nome:"Representantes", telas:[T("consrep","Consolidado dos representantes"), Ti("comissoes","Comissões dos representantes","representante","#8B5CF6"), T("inadimp","Inadimplência dos representantes")]},
    {nome:"Comissões", telas:[Ti("comisstodos","Visão geral","grid4","#D9A63A"), Ti("agbonus","Agendamento","agenda","#A855F7"), Ti("comcad","Cadastro de revendedoras","cadastro","#F97316"), Ti("cominad","Inadimplência","alert","#EF4444"),
    Ti("comisbip","Bipagem","bipagem","#0EA5E9"), Ti("comismont","Montagem de kits","montadora","#F59E0B"), Ti("comisint","Atendimento interno","calendario","#E8B84B"), Ti("comlink","Link de pagamento","coins","#14B8A6"), Ti("comdatas","Datas de pagamento","calendario","#3B82F6")]},
    {nome:"Link de\npagamento", telas:[T("linkrel","Relatório de links de pagamento")]},
    {nome:"Cobrança", telas:[T("cfvisao","Visão geral da cobrança"), T("cfdevendo","Devendo"), T("cfquitados","Quitadas"), T("cfrelatorio","Relatórios mensais"), T("cffunc","Funcionárias da cobrança"), T("cfregras","Regras da cobrança"), T("cfconfig","Configuração da cobrança")]}]},
  {id:"agendamento", nome:"Agendamento", ic:"agenda", cor:"#A855F7", areas:[
    {nome:"Acertos", telas:[T("agpainel","Painel")]}, {nome:"Remarcações", telas:[T("agremarc","Remarcações")]}, {nome:"Representantes", telas:[T("agreps","Representantes")]},
    {nome:"Análises", telas:[T("aganalises","Análises")]}, {nome:"Histórico", telas:[T("aghistorico","Histórico")]}, {nome:"Gestão do mês", telas:[T("agabertura","Abertura do mês"), T("agconfig","Configurador")]}]},
  // Fiscal separado do Financeiro (14/10/2026), logo abaixo dele na barra do topo
  // Cadastro de revendedoras: 4 categorias e 20 telas (estrutura passada pelo Marcus em 14/10/2026) + Kits novos, que já existe pronto
  {id:"cadastro", nome:"Cadastro de revendedoras", ic:"cadastro", cor:"#F97316", areas:[
    {nome:"Base de revendedoras", telas:[
      Object.assign(T("revendedoras","Base de revendedoras"), {adm:true, origem:["Revendedoras diárias: histórico dia a dia, entradas, saídas e saldo"]})]},
    {nome:"Aprovação de cadastros", telas:[
      T("aprovacaocad","Aprovação de cadastros")]},
    {nome:"Desempenho do cadastro", telas:[
      T("desempenhocad","Desempenho do cadastro")]},
    {nome:"Indicações", telas:[
      T("indicacoes","Indicações")]},
    {nome:"Avaliações", telas:[
      T("avaliacoes","Avaliações")]},
    {nome:"Kits novos", telas:[
      Object.assign(T("kitnovo","Kits novos"), {adm:true, origem:["Cadastro, liberação, direcionamento e entrega — planilha Curitiba"]}),
      T("knpendencias","Pendências"), T("knconsolidado","Consolidado"), T("knregras","Regras")]}]},
  // Kits = só a montagem. Representantes e Atendimento interno viraram setores próprios (decisão de 13/10/2026).
  // Representantes & Kits num setor só (decisão de 15/10/2026): as áreas de Representantes (campo) e de Kits (interno) ficam separadas lá dentro; o financeiro vai chegar às comissões por aqui e pela aba Financeiro
  {id:"representantes", nome:"Representantes & Kits", ic:"representante", cor:"#8B5CF6", areas:[
    {nome:"Representantes", telas:[T("consrep","Consolidado Representante"), T("controlekits","Controle de kits")]},
    {nome:"Financeiro", telas:[Ti("comissoes","Comissões dos representantes","representante","#8B5CF6"), Ti("pixdireto","Pix representantes","coins","#8B5CF6"), T("inadimp","Inadimplência"), T("comprasrep","Compras de joias")]},
    {nome:"Regras", telas:[T("regrasrep","Regras dos representantes"), T("regrasacerto","Regras dos acertos")]},
    {nome:"Desempenho", telas:[T("placar","Placar das representantes")]},
    {nome:"Kits (interno)", telas:[T("visaobip"), T("meudesemp"), T("painel"), T("condicionais"), I("calc","Calculadora de kits",["Calculadora de Kits do admin"]),
      T("vendas","Análise de vendas"), T("consolidado"), T("regras"),
      T("prefkit","Preferências do kit"),
      T("equipe"), T("registros"), T("relatorios")]},
    {nome:"Produção", telas:[T("producao","Produção")]}]},
  // Link de pagamento: setor próprio (quem opera é a Helen); o Financeiro só tem o relatório (decisão de 16/10/2026)
  {id:"linkpag", nome:"Link de pagamento", ic:"banco", cor:"#0EA5E9", direto:T("linkpag","Link de pagamento")},
  {id:"atendimento", nome:"Atendimento interno", ic:"calendario", cor:"#E8B84B", areas:[
    {nome:"Revendedoras na empresa", telas:[T("intrevs","Revendedoras"), T("intlist","Listagens"), T("intcalc","Atendimento Sorelly"), T("intcons","Consolidado Sorelly")]}]},
  {id:"estoque", nome:"Materiais & Estoque", ic:"cubos", cor:"#6366F1", areas:[
    {nome:"Compras e estoque de material", telas:[T("compras","Compras e estoque de material")]}]},
  // Cadastro de peças: setor próprio na barra lateral (pedido do Marcus, 21/10/2026; responsável Rayssa, Financeiro também acessa)
  {id:"cadpecas", nome:"Cadastro de peças", ic:"cubos", cor:"#3B82F6", direto:T("cadpecas","Cadastro de peças")},
  {id:"encomendas", nome:"Encomendas & Reposições", ic:"caminhao", cor:"#14B8A6", areas:[
    {nome:"Encomendas & Reposições", telas:[T("encomendas","Encomendas e reposições"), T("regreposicao","Regras")]},
    {nome:"Entregas", telas:[B("Entregas")]},
    {nome:"Expositores", telas:[T("expositores","Expositores")]}]},
  {id:"garantia", nome:"Garantia & Pós-venda", ic:"escudo", cor:"#A855F7", areas:[
    {nome:"Garantias", telas:[T("garantia","Garantia")]},
    {nome:"Pós-vendas", telas:[B("Pós-vendas")]}]},
  {id:"rh", nome:"Recursos Humanos", ic:"maleta", cor:"#8B5CF6", areas:[
    {nome:"Visão geral", telas:[T("rhvisao","Visão geral do RH")]},
    {nome:"Presença", telas:[T("rhpresenca","Presença diária"), T("rhrelatorio","Relatório diário")]},
    {nome:"Colaboradores", telas:[T("rhcolab","Colaboradores"), T("rhexp","Controle de experiência"), T("rhadv","Advertências"), T("rhhoras","Horas extras"), T("rhnegoc","Negociações"), T("rhescala42","Escala 42h")]},
    {nome:"Contratos", telas:[T("rhcrep","Representantes"), T("rhcfunc","Funcionários (CLT)"), T("rhcterc","Terceiros"), T("rhcmarcus","Particulares do Marcus"), T("rhcmodelos","Modelos de contrato")]},
    {nome:"Pessoas", telas:[T("pessoas","Funcionários e representantes"), T("equipes","Equipes"), T("acessos","Acessos e autorizações")]},
    {nome:"Configurador", telas:[T("rhconfig","Configurador do RH")]}]},
  {id:"diretoria", nome:"Diretoria", ic:"coroa", cor:"#D9A63A", areas:[
    {nome:"Empresa", telas:[T("fluxo","Fluxo da empresa"), B("Comissões e desempenho")]}]},
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
  // Jurídico (16/10/2026): só as abas por enquanto; o Marcus quer ver tudo no menu e executar depois. Contexto em docs/negocio/JURIDICO-COBRANCA.md
  {id:"juridico", nome:"Jurídico", ic:"escudo", cor:"#DC2626", areas:[
    {nome:"Notas promissórias", telas:[B("Execução de notas promissórias"), B("Inadimplência jurídica")]},
    {nome:"Salas comerciais", telas:[B("Contratos de salas comerciais")]},
    {nome:"Marcas e patentes", telas:[B("Marcas e patentes")]}]},
  {id:"servicos", nome:"Segurança e limpeza", ic:"vassoura", cor:"#64748B", areas:[
    {nome:"Segurança", telas:[B("Segurança")]},
    {nome:"Limpeza", telas:[B("Limpeza e zeladoria")]}]},
  {id:"marketing", nome:"Marketing", ic:"megafone", cor:"#EC4899", areas:[
    {nome:"Marketing", telas:[T("marketing","Marketing"), B("Campanhas"), B("Tráfego pago")]}]},
  {id:"tec", nome:"Tecnologia", ic:"celular", cor:"#0EA5E9", areas:[
    {nome:"Sistema", telas:[B("App Sorelly"), T("avisos","Avisos"), T("padrao","Padrão visual"), T("versoes","Versões"), T("mapa","Mapa do sistema"), B("Projetos (dev)")]}]}
];
// Barra do topo em grupos (padrão visual, opção D): o nome do grupo aparece em cima dos botões. Setor sem "grupo" nas áreas segue com a barra simples.
var GRUPO_BARRA = {"financeiro":{"Controle de\npagamentos":"Pagamentos", "Contas a\npagar":"Pagamentos", "Pagamentos a\nfornecedores":"Pagamentos", "Faturamento &\ncontas a pagar":"Faturamento", 
  "Representantes":"Pessoas", "Comissões":"Pessoas", "Cobrança":"Pessoas", "Saldo das\ncontas":"Bancos", "Link de\npagamento":"Relatórios"}};
SETORES.forEach(function(st){ var g = GRUPO_BARRA[st.id]; if(g) (st.areas||[]).forEach(function(ar){ if(g[ar.nome]) ar.grupo = g[ar.nome]; }); });
var APPS_TOPO = [["celrep","App representante","representante","#8B5CF6"],["celrev","App revendedora","revendedora","#EC4899"],["celular","App montagem","montadora","#F59E0B"],["celbip","App bipagem","bipagem","#0EA5E9"],["celcond","App condicionais","scan","#D97706"]];
var SETORES_BAIXO = [];   // Equipes passou para o RH (16/10/2026)
function ondeEsta(aba){ var r = null; SETORES.forEach(function(st){ (st.areas||[]).forEach(function(ar, i){ ar.telas.forEach(function(t){ if(!r && t.aba===aba) r = {setor:st, area:ar, i:i}; }); }); }); return r; }
function telaPorNome(nome){ var r = null; SETORES.forEach(function(st){ (st.areas||[]).forEach(function(ar){ ar.telas.forEach(function(t){ if(!r && t.nome===nome) r = t; }); }); }); return r; }

export { T, B, E, G, I, SETORES, APPS_TOPO, SETORES_BAIXO, ondeEsta, telaPorNome };
