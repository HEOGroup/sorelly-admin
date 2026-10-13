// Sorelly Admin · montagem — domain/cnpjs.js
// Cadastro das empresas (CNPJs) da Sorelly. O que for editado na tela fica em state.cnpjs e vale sobre este padrão.
// Não guardar aqui senhas nem códigos de acesso (ex.: código do e-CAC).
var CAMPOS_CNPJ = [
  ["razao","Razão social"], ["cnpj","CNPJ"], ["ie","Inscrição estadual"], ["endereco","Endereço"], ["bairro","Bairro"],
  ["cidade","Cidade"], ["estado","Estado"], ["cep","CEP"], ["email","E-mail"], ["socio","Sócio"], ["cpf","CPF do sócio"]];
var CNPJS0 = [
  {id:"34", num:"34", nome:"Sorelly Atacadista", cor:"#B8892B", razao:"SORELLY COMERCIO ATACADISTA DE SEMIJOIAS LTDA", cnpj:"34.753.252/0001-03", ie:"90882691-41",
    endereco:"RUA MARECHAL DEODORO - N° 950 (SALA 501)", bairro:"CENTRO", cidade:"CURITIBA", estado:"PARANÁ", cep:"80060-010", email:"", socio:"ANAMARIA HESS DE OLIVEIRA", cpf:""},
  {id:"46", num:"46", nome:"Mayz Comércio de Moda", cor:"#BE185D", razao:"MAYZ COMERCIO DE MODA PRAIA, LINGERIES E ACESSORIOS LTDA", cnpj:"46.873.285/0001-76", ie:"90951966-72",
    endereco:"RUA MARECHAL DEODORO - N° 950 (SALA 703)", bairro:"CENTRO", cidade:"CURITIBA", estado:"PARANÁ", cep:"80060-010", email:"", socio:"MARCUS VINICIUS HESS DE OLIVEIRA", cpf:""},
  {id:"59", num:"59", nome:"Serenity", cor:"#0F766E", razao:"SERENITY PORTA JOIAS E ACESSORIOS LTDA", cnpj:"59.146.403/0001-96", ie:"91121910-78",
    endereco:"RUA MARECHAL DEODORO - N° 857 (SALA 1401)", bairro:"CENTRO", cidade:"CURITIBA", estado:"PARANÁ", cep:"80060-010", email:"serenetyportajoias@gmail.com", socio:"MARCO ANTONIO DE OLIVEIRA", cpf:""},
  {id:"67", num:"67", nome:"Axis", cor:"#1D4ED8", razao:"AXIS COMÉRCIO DE JOIAS E ACESSÓRIOS LTDA", cnpj:"67.702.461/0001-87", ie:"91240996-14",
    endereco:"RUA VINTE E QUATRO DE MAIO, 412 - CJ 50", bairro:"CENTRO", cidade:"CURITIBA", estado:"PARANÁ", cep:"82800-260", email:"axisjoiasoficial@gmail.com", socio:"LUCAS OLIVEIRA DA ROCHA", cpf:""},
  {id:"ho", num:"", nome:"H&O Apps", cor:"#6D28D9", razao:"", cnpj:"", ie:"", endereco:"", bairro:"", cidade:"", estado:"", cep:"", email:"", socio:"", cpf:""}];
// Dados fiscais por CNPJ. Cada lançamento é uma "foto" do resumo fiscal numa data (acumulado do ano até aquela data);
// o valor atual é o lançamento de data mais recente. Lucas lança; a futura tela do Fiscal vai ler e gravar no mesmo lugar (state.fiscal.hist).
var SUBLIMITE_ANUAL = 3600000;   // limite do faturamento fiscal anual (a mudar no Configurador)
var VERDE_ATE_PCT = 90;          // projetado até este % do limite = verde; de aí até 100% = amarelo; acima do limite = vermelho
function lanc(data, fatAnual, brindesMes, entradaMes, entradaAnual){ return {data:data, fatAnual:fatAnual, brindesMes:brindesMes, entradaMes:entradaMes, entradaAnual:entradaAnual}; }
var FISCAL0 = {hist:{
  "34":[lanc("2026-09-30", 2605437.25, 13571.40, 29579.27, 373787.86)],
  "46":[lanc("2026-09-30", 1910914.05, 19353.10, 25913.97, 312467.35)],
  "59":[lanc("2026-09-30", 2087146.20, 27850.80, 48833.84, 295212.10)],
  "67":[lanc("2026-09-30", 61854.80, 3004.50, 27627.54, 55800.77)],
  "ho":[]}};
// Contas a pagar por CNPJ e por mês (valor a pagar), por ano. "sem" = contas sem CNPJ (Sorelly / Hess & Oliveira). Mês é 0-11.
var COLUNAS_CONTAS = [["34","34 Atacadista"],["46","46 Mayz"],["59","59 Serenity"],["67","67 Axis"],["ho","H&O Apps"],["sem","Contas sem CNPJ"]];
var CONTAS_CNPJ0 = {"2026":{
  "34":{9:268085.24, 10:277891.73, 11:276861.27}, "59":{9:272262.79, 10:317717.51, 11:338319.06}, "46":{9:268336.52, 10:274690.21, 11:308315.64},
  "sem":{9:458819.41, 10:533378.63, 11:486250.45}, "67":{9:38454.43, 10:41183.11, 11:46030.65}}};
function fiscalAtual(fiscal, id){
  var h = ((fiscal||{}).hist||{})[id]||[];
  return h.length ? h.slice().sort(function(a,b){ return a.data<b.data ? 1 : -1; })[0] : {data:"", fatAnual:0, brindesMes:0, entradaMes:0, entradaAnual:0};
}
// ILF = notas de entrada com lastro (acumulado do ano) ÷ faturamento fiscal anual
function indicadoresFiscais(f){
  var fat = f.fatAnual||0, ent = f.entradaAnual||0;
  return {falta:Math.max(0, SUBLIMITE_ANUAL-fat), pctSublimite:fat/SUBLIMITE_ANUAL*100, ilf: fat>0 ? ent/fat*100 : 0};
}
// Projeção até 31/12: faturamento fiscal até a data do último lançamento + contas a pagar dos meses seguintes ao da data.
function projecaoCnpj(id, f, contasCnpj){
  var ate = f.data || "", ano = ate.slice(0,4) || String(new Date().getFullYear()), mesAte = ate ? Number(ate.slice(5,7))-1 : -1;
  var meses = (contasCnpj||{})[ano]; var doCnpj = (meses && meses[id]) || {};
  var restantes = [0,1,2,3,4,5,6,7,8,9,10,11].filter(function(m){ return m>mesAte; });
  var contas = restantes.reduce(function(t,m){ return t+(doCnpj[m]||0); },0);
  var projetado = (f.fatAnual||0)+contas, pct = projetado/SUBLIMITE_ANUAL*100;
  var nMeses = restantes.length;
  return {contas:contas, projetado:projetado, pct:pct, sobra:SUBLIMITE_ANUAL-projetado, porMes: nMeses ? Math.max(0, SUBLIMITE_ANUAL-(f.fatAnual||0))/nMeses : 0,
    nivel: pct>100 ? "vermelho" : pct>VERDE_ATE_PCT ? "amarelo" : "verde"};
}
function cnpjsDe(editados){
  return CNPJS0.map(function(c){ return Object.assign({}, c, (editados||{})[c.id]); });
}
export { CAMPOS_CNPJ, CNPJS0, COLUNAS_CONTAS, CONTAS_CNPJ0, FISCAL0, SUBLIMITE_ANUAL, VERDE_ATE_PCT, cnpjsDe, fiscalAtual, indicadoresFiscais, projecaoCnpj };
