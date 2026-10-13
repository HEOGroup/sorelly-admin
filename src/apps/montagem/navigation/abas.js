// Sorelly Admin · montagem e bipagem — navigation/abas.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.

var ABAS = [["painel","Listagens","lista","bip"],["calc","Calculadora de kits","calc","bip"],["consolidado","Consolidado","arquivo","bip"],["relatorios","Relatórios","grafico","bip"],["equipe","Equipe e comissões","equipe","bip"],["avalrep","Representantes","trofeu","bip"],
  ["registros","Registros","registro","bip"],["regras","Regras","book","bip"],["regrasrep","Regras dos representantes","book","bip"],["regrasacerto","Regras dos acertos","book","bip"],["regreposicao","Regras de reposição e encomendas","book","bip"],["expositores","Expositores","coroa","bip"],["comprasrep","Compras de joias","coins","bip"],["configrep","Configurações","config","bip"],
  ["consrep","Consolidado Representante","arquivo","bip"],["controlekits","Controle de kits","caixa","bip"],["placar","Placar das representantes","trofeu","bip"],["comissoes","Comissões","banco","bip"],["pixdireto","Pix direto a enviar","coins","bip"],["inadimp","Inadimplência","registro","bip"],["comconfig","Configurador de comissões","config","bip"],["intlist","Atendimento interno · Listagens","lista","bip"],["intrevs","Revendedoras internas","users","bip"],["intcalc","Atendimento Sorelly","calc","bip"],["intcons","Consolidado Sorelly","arquivo","bip"],
  ["condicionais","Condicionais","scan","bip"],["celcond","App das condicionais","scan","aparte"],
  ["kitnovo","Revendedoras novas","novas","kitnovo"],
  ["knpendencias","Pendências (kits novos)","registro","kitnovo"],["knconsolidado","Consolidado (kits novos)","arquivo","kitnovo"],
  ["knregras","Regras (kits novos)","book","kitnovo"],["knconfigurador","Configurador (kits novos)","config","kitnovo"],
  ["config","Configurador","config","sistema"],["avisos","Avisos","sino","sistema"],
  ["celular","App da montadora","montadora","aparte"],["celbip","App da bipagem","bipagem","aparte"],
  ["celrep","App da representante","representante","aparte"],["celrev","App da revendedora","revendedora","aparte"],
  ["vendas","Análise de vendas","ia","bip"],["contaspagar","Contas a pagar","banco","fin"],["inadfin","Inadimplência (financeiro)","registro","fin"],["previsaofat","Faturamento","banco","fin"],
  ["cnpjs","CNPJs","banco","fin"],["limitefat","Limite de faturamento","banco","fin"],["painelacertos","Painel dos acertos","agenda","fin"],["visaogeral","Visão geral","grid4","visao"],
  ["pessoas","Funcionários e representantes","users","rh"],["acessos","Acessos por setor","escudo","rh"],["fluxo","Fluxo da empresa","grafico","dir"]];
var GRUPOS_MENU = {bip:["Bipagem de kits","caixa"], kitnovo:["Kit novo","kitnovo"], sistema:["Sistema","config"], aparte:["Sistemas à parte","celular"], espera:["Em espera","espera"]};
var COR_ABA = {painel:"#D9A63A", consolidado:"#F97316", relatorios:"#3B82F6", equipe:"#22C55E", avalrep:"#EAB308", registros:"#EF4444", regras:"#8B5CF6",
  kitnovo:"#EC4899", condicionais:"#D97706", celcond:"#D97706", config:"#94A3B8", vendas:"#14B8A6", calc:"#F59E0B", celular:"#F59E0B", celbip:"#0EA5E9", celrep:"#8B5CF6", celrev:"#EC4899"};

export { ABAS, GRUPOS_MENU, COR_ABA };
