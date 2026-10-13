// Sorelly Admin · montagem e bipagem — navigation/setores.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { ABAS } from "@/apps/montagem/navigation/abas";

function T(aba, nome){ return {aba:aba, nome:nome || (ABAS.find(function(a){return a[0]===aba;})||[])[1]}; }
function B(nome){ return {breve:true, nome:nome}; }
function E(nome, origem){ return {breve:true, enviar:true, nome:nome, origem:origem||[]}; }
function G(nome, grupos){ return {nome:nome, grupos:grupos.map(function(g){ return {titulo:g[0], telas:g[1]}; }), telas:[].concat.apply([], grupos.map(function(g){ return g[1]; }))}; }
function I(aba, nome, origem){ return Object.assign(T(aba, nome), {integrado:true, origem:origem||[]}); }   // veio do admin e já foi integrado
var SETORES = [
  {id:"visao", nome:"Visão geral", ic:"grid4", cor:"#D9A63A", direto:T("visaogeral","Visão geral")},
  {id:"chamados", nome:"Chamados", ic:"chamado", cor:"#EF4444", direto:B("Chamados")},
  {id:"financeiro", nome:"Financeiro", ic:"banco", cor:"#3B82F6", areas:[
    G("CNPJs", [["CNPJs", [I("cnpjs","CNPJs",["Cadastro das 5 empresas da Sorelly (34, 46, 59, 67 e H&O Apps)"]),
      I("limitefat","Limite de faturamento",["Projeção até 31/12 por CNPJ contra o limite de R$ 3,6 milhões, com alerta"])]]]),
    G("Faturamento &\ncontas a pagar", [
      ["Faturamento &\ncontas a pagar", [I("previsaofat","Faturamento",["Faturamento vs Contas a Pagar → Painel (refeita: lançamento diário só do dia anterior, ligada à Contas a pagar)"]),
        I("contaspagar","Contas a pagar",["Faturamento vs Contas a Pagar → Contas a pagar (refeita: lançamento manual de Pago e A pagar por mês, visão Total e por CNPJ)"]), T("inadfin","Inadimplência"),
        E("Histórico de contas",["Faturamento vs Contas a Pagar → Histórico de contas"])]]]),
    G("Saldos Bancários", [
      ["Saldos Bancários", [E("Visão geral",["Saldo das Contas → Visão geral","Saldo das Contas → Lançamento diário","Saldo das Contas → Histórico","Saldo das Contas → Gráficos","Saldo das Contas → Relatório"]),
        E("Chaves PIX",["Saldo das Contas → Chaves PIX e Configurador"])]]]),
    G("Fiscal", [
      ["Fiscal", [E("Visão geral fiscal",["Fiscal → Visão geral"]), E("Entradas",["Fiscal → Entradas"]), E("Saídas",["Fiscal → Saídas"]),
        E("Contas a pagar fiscal",["Fiscal → Contas a pagar"]), E("Dashboard anual",["Fiscal → Dashboard anual"])]]]),
    G("Recebimentos &\nleilão", [
      ["Recebimentos", [B("Link de pagamento"), B("Maquininhas")]],
      ["Leilão", [B("Leilão")]]]),
    G("Financeiro\nfamiliar", [["Financeiro\nfamiliar", [E("Home",["Financeiro Familiar → Home"]), E("Alertas",["Financeiro Familiar → Alertas"]), E("Contas a pagar da família",["Financeiro Familiar → Contas a Pagar"]),
      E("Contas pagas",["Financeiro Familiar → Contas Pagas"]), E("PIX revendedoras",["Financeiro Familiar → PIX Revendedoras"]), E("Prestadores",["Financeiro Familiar → Prestadores"]),
      E("Pró-labores",["Financeiro Familiar → Pró-labores"]), E("Relatório da família",["Financeiro Familiar → Relatório"]), E("Configurações da família",["Financeiro Familiar → Configurações"])]]]),
    {nome:"Cobrança", telas:[E("Visão geral da cobrança",["Cobrança → Visão Geral"]), E("Devendo",["Cobrança → Devendo"]), E("Quitados",["Cobrança → Quitados"]),
      E("Relatórios mensais",["Cobrança → Relatórios Mensais"]), E("Funcionários da cobrança",["Cobrança → Funcionários"]), E("Regras da cobrança",["Cobrança → Regras"]),
      E("Configuração da cobrança",["Cobrança → Configuração"])]}]},
  {id:"cadastro", nome:"Cadastro de revendedoras", ic:"cadastro", cor:"#F97316", areas:[
    {nome:"Revendedoras", telas:[
      E("Revendedoras (ficha única)", ["Cadastro de revendedoras → Revendedoras","Indicações → Revendedoras","Avaliações → Revendedoras"]),
      E("Revendedoras diárias", ["Revendedoras diárias"])]},
    {nome:"Cadastro", telas:[
      E("Aprovação de cadastro", ["Cadastro de revendedoras → Aprovação Cadastro"]),
      E("Origem e campanhas", ["Cadastro de revendedoras → Origem e Campanhas"]),
      E("Métricas e desempenho", ["Cadastro de revendedoras → Métricas e Desempenho"]),
      E("Registros do cadastro", ["Cadastro de revendedoras → Registros"])]},
    {nome:"Kits novos", telas:[
      Object.assign(T("kitnovo","Kits novos"), {adm:true, origem:["Cadastro, liberação, direcionamento e entrega — planilha Curitiba"]}),
      T("knpendencias","Pendências"), T("knconsolidado","Consolidado"), T("knregras","Regras")]},
    {nome:"Indicações", telas:[
      E("Indicações", ["Indicações → Indicações"]),
      E("Resgates e retiradas", ["Indicações → Fila de resgates, Agendamentos e Retiradas do dia"])]},
    {nome:"Avaliações", telas:[
      E("Avaliações: visão geral", ["Avaliações → Visão geral"]),
      E("Avaliação dos kits", ["Avaliações → Kits"]),
      Object.assign(T("avalrep","Avaliação das representantes"), {adm:true, origem:["Avaliações → Representantes"]})]}]},
  // Kits = só a montagem. Representantes e Atendimento interno viraram setores próprios (decisão de 13/10/2026).
  {id:"kits", nome:"Kits", ic:"caixa", cor:"#22C55E", areas:[
    {nome:"Listagens & Kits", telas:[T("painel"), T("condicionais"), I("calc","Calculadora de kits",["Calculadora de Kits do admin"]),
      T("vendas","Análise de vendas"), T("consolidado"), T("regras"),
      E("Metas", ["Sistema de metas do admin (vendas dos meses anteriores + regras)"]),
      T("equipe"), T("registros"), T("relatorios")]},
    {nome:"Produção", telas:[B("Produção Sorelly"), B("Produção Serenity")]}]},
  {id:"representantes", nome:"Representantes", ic:"representante", cor:"#8B5CF6", areas:[
    {nome:"Operação", telas:[T("celrep","App da Representante"), T("consrep","Consolidado Representante"), T("controlekits","Controle de kits")]},
    {nome:"Financeiro", telas:[T("comissoes","Comissões"), T("pixdireto","Pix direto a enviar"), T("inadimp","Inadimplência"), T("comprasrep","Compras de joias")]},
    {nome:"Regras", telas:[T("regrasrep","Regras dos representantes"), T("regrasacerto","Regras dos acertos")]},
    {nome:"Desempenho", telas:[T("placar","Placar das representantes")]}]},
  {id:"atendimento", nome:"Atendimento interno", ic:"calendario", cor:"#E8B84B", areas:[
    {nome:"Revendedoras na empresa", telas:[T("intrevs","Revendedoras"), T("intlist","Listagens"), T("intcalc","Atendimento Sorelly"), T("intcons","Consolidado Sorelly")]}]},
  {id:"estoque", nome:"Materiais & Estoque", ic:"cubos", cor:"#6366F1", areas:[
    {nome:"Estoque de peças", telas:[E("Estoque Sorelly", ["Estoque Sorelly → Resumo geral e Preenchimento (estoque geral de peças)"]), B("Cadastro de peças")]},
    {nome:"Estoque de materiais", telas:[B("Estoque de materiais")]},
    {nome:"Compras", telas:[B("Compras Sorelly"), B("Fornecedores de banho"), B("Fornecedores de brutos")]}]},
  {id:"encomendas", nome:"Encomendas e reposições", ic:"caminhao", cor:"#14B8A6", areas:[
    {nome:"Encomendas e reposições", telas:[T("regreposicao","Regras"), B("Encomendas"), B("Reposições")]},
    {nome:"Entregas", telas:[B("Entregas")]},
    {nome:"Expositores", telas:[T("expositores","Controle de expositores")]}]},
  {id:"garantia", nome:"Garantia & Pós-venda", ic:"escudo", cor:"#A855F7", areas:[
    {nome:"Garantias", telas:[B("Garantias")]},
    {nome:"Pós-vendas", telas:[B("Pós-vendas")]}]},
  {id:"rh", nome:"Recursos Humanos", ic:"maleta", cor:"#8B5CF6", areas:[
    {nome:"Pessoas", telas:[T("pessoas","Funcionários e representantes"), T("acessos","Acessos por setor"), B("Ponto e horas extras")]}]},
  {id:"diretoria", nome:"Diretoria", ic:"coroa", cor:"#D9A63A", areas:[
    {nome:"Empresa", telas:[T("fluxo","Fluxo da empresa"), B("Comissões e desempenho")]}]},
  {id:"servicos", nome:"Segurança e limpeza", ic:"vassoura", cor:"#64748B", areas:[
    {nome:"Segurança", telas:[B("Segurança")]},
    {nome:"Limpeza", telas:[B("Limpeza e zeladoria")]}]},
  {id:"marketing", nome:"Marketing", ic:"megafone", cor:"#EC4899", areas:[
    {nome:"Marketing", telas:[B("Campanhas"), B("Tráfego pago")]}]},
  {id:"tec", nome:"Tecnologia", ic:"celular", cor:"#0EA5E9", areas:[
    {nome:"Sistema", telas:[B("App Sorelly"), Object.assign(T("config","Configurador geral"), {origem:["Um configurador só no lugar dos configuradores do financeiro, do estoque, das avaliações, dos acertos, do consignado e dos kits"]}), T("avisos","Avisos"), B("Projetos (dev)")]}]}
];
var APPS_TOPO = [["celrep","App representante","representante","#8B5CF6"],["celrev","App revendedora","revendedora","#EC4899"],["celular","App montagem","montadora","#F59E0B"],["celbip","App bipagem","bipagem","#0EA5E9"],["celcond","App condicionais","scan","#D97706"]];
var SETORES_BAIXO = [{id:"equipes", nome:"Equipes", ic:"equipe", cor:"#A855F7", direto:B("Equipes")}, {id:"metricas", nome:"Métricas", ic:"grafico", cor:"#94A3B8", direto:T("relatorios","Métricas")}];
function ondeEsta(aba){ var r = null; SETORES.forEach(function(st){ (st.areas||[]).forEach(function(ar, i){ ar.telas.forEach(function(t){ if(!r && t.aba===aba) r = {setor:st, area:ar, i:i}; }); }); }); return r; }
function telaPorNome(nome){ var r = null; SETORES.forEach(function(st){ (st.areas||[]).forEach(function(ar){ ar.telas.forEach(function(t){ if(!r && t.nome===nome) r = t; }); }); }); return r; }

export { T, B, E, G, I, SETORES, APPS_TOPO, SETORES_BAIXO, ondeEsta, telaPorNome };
