// Sorelly Admin · montagem — domain/cnpjs.js
// Cadastro das empresas (CNPJs) da Sorelly. O que for editado na tela fica em state.cnpjs e vale sobre este padrão.
// Não guardar aqui senhas nem códigos de acesso (ex.: código do e-CAC).
var CAMPOS_CNPJ = [
  ["razao","Razão social"], ["cnpj","CNPJ"], ["ie","Inscrição estadual"], ["endereco","Endereço"], ["bairro","Bairro"],
  ["cidade","Cidade"], ["estado","Estado"], ["cep","CEP"], ["email","E-mail"], ["socio","Sócio"], ["cpf","CPF do sócio"]];
// campos extras, só na tela cheia de cada CNPJ
var CAMPOS_EXTRA = [["contrato","Contrato social"], ["im","Inscrição municipal"], ["abertura","Data de abertura"], ["regime","Regime tributário"], ["cnae","Atividade (CNAE)"], ["telefone","Telefone"], ["contador","Contador (nome e contato)"], ["alvaraVal","Validade do alvará"], ["certVal","Validade do certificado digital"]];
// documentos que cada CNPJ deve ter anexados
var DOCS_CNPJ = ["Alvará de funcionamento", "Contrato social", "Cartão CNPJ", "Inscrição estadual", "Inscrição municipal", "Certidões negativas", "Certificado digital", "Procuração", "Outros"];
// CPF e e-mail dos sócios: arquivo local (fora do Git)
var SOCIOS = (function(){ var m = import.meta.glob("./cnpjs-socios.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : {}; })();
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
// textos já bonitos para a mensagem pronta (maiúsculas e minúsculas) e dados que o Marcus sempre envia aos bancos
var COMUM = {contador:"Vanzella Contabilidade (contato a informar)", regime:"Simples Nacional (a confirmar com a contabilidade)"};
var MSG0 = {
  "34": {razaoMsg:"Sorelly Comércio Atacadista de Semijoias Ltda", endMsg:"Rua Marechal Deodoro, 950 - Sala 501, Centro, Curitiba/PR", socioMsg:"Anamaria Hess de Oliveira", socioRot:"Sócia", semEmailMsg:true},
  "46": {razaoMsg:"Mayz Comércio de Moda Praia, Lingerie e Acessórios Ltda", endMsg:"Rua Marechal Deodoro, 950 - Sala 703, Centro, Curitiba/PR", socioMsg:"Marcus Vinícius Hess de Oliveira", socioRot:"Sócio", im:"17 02 1.028.774-3", telefone:"(41) 3366-9676", contrato:"alteração nº 6, assinada em 24/08/2026 (protocolo PRP2617311333)"},
  "59": {razaoMsg:"Serenity Porta Joias e Acessórios Ltda", endMsg:"Rua Marechal Deodoro, 857 - Sala 1401, Centro, Curitiba/PR", socioMsg:"Marco Antonio de Oliveira", socioRot:"Sócio"},
  "67": {razaoMsg:"Axis Comércio de Joias e Acessórios Ltda", endMsg:"Rua Vinte e Quatro de Maio, 412 - Cj 50, Centro, Curitiba/PR", socioMsg:"Lucas Oliveira da Rocha", socioRot:"Sócio"}};
// mensagem pronta para copiar e colar (WhatsApp): cabeçalho com nome e CNPJ e as palavras importantes entre * (ficam em negrito)
function mensagemCnpj(c){
  var m = Object.assign({}, MSG0[c.id], {}), v = function(k){ return c[k] || m[k] || ""; };
  if(!c.cnpj) return "";
  var lin = function(rot, val){ return val ? "*"+rot+":* "+val : null; };
  return ["🏢 *"+c.nome+"* · CNPJ "+c.cnpj, "",
    lin("Razão social", m.razaoMsg || c.razao), lin("CNPJ", c.cnpj), lin("Inscrição Estadual", c.ie), lin("Inscrição Municipal", v("im")),
    lin("Endereço", m.endMsg || [c.endereco, c.bairro, c.cidade && c.estado ? c.cidade+"/"+c.estado : ""].filter(Boolean).join(", ")), lin("CEP", c.cep),
    m.semEmailMsg ? null : lin("E-mail", c.email), lin("Telefone", v("telefone")), lin(m.socioRot || "Sócio", m.socioMsg || c.socio), lin("Contrato social", v("contrato"))]
    .filter(function(x){ return x!==null; }).join("\n");
}
function cnpjsDe(editados){
  return CNPJS0.map(function(c){ var so = SOCIOS[c.id] || {}, base = Object.assign({}, c, (c.num ? COMUM : {}), {im:(MSG0[c.id]||{}).im, telefone:(MSG0[c.id]||{}).telefone, contrato:(MSG0[c.id]||{}).contrato}); if(so.cpf) base.cpf = so.cpf; if(so.email) base.email = so.email; return Object.assign(base, (editados||{})[c.id]); });
}
export { mensagemCnpj, CAMPOS_EXTRA, DOCS_CNPJ, CAMPOS_CNPJ, CNPJS0, COLUNAS_CONTAS, CONTAS_CNPJ0, FISCAL0, SUBLIMITE_ANUAL, VERDE_ATE_PCT, cnpjsDe, fiscalAtual, indicadoresFiscais, projecaoCnpj };
