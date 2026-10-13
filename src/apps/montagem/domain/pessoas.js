// Sorelly Admin · montagem — domain/pessoas.js
// Quadro de pessoas: funcionários (por setor e CNPJ) e representantes. Lista passada pelo Marcus em 07/10/2026.
// Só leitura por enquanto; depois a tela vai definir quem pode mexer no quê. O nome do cargo é de quem ocupa hoje.
// Funcionário: [nome, CPF (só números), id do CNPJ do cadastro (34, 46, 59 ou 67)].
var FUNCIONARIOS_POR_SETOR = [
  ["Agendamento", [["Ana Maria Divino da Silva","11576315924","46"], ["Mariana Cardoso de Almeida","12487754907","46"], ["Tamara Marques de Gouveia","09415575964","34"]]],
  ["Atendimento de kits", [["Deysiane Portugues da Silva","12753951985","46"], ["Edna Pereira Cardoso","05646655250","46"], ["Kawany Cristine Coutinho Silva","09848450971","59"],
    ["Leci Nunes da Rosa","02426575913","46"], ["Natalia Araujo de Souza","07724983933","34"], ["Nataly Fernanda Felipe Ribeiro","13998317988","59"],
    ["Natasha Ribeiro Lemes da Silva","11229166980","46"], ["Renata Dolato","06010050901","67"], ["Sthafany Marques de Aquino Correa","50254494803","67"]]],
  ["Bipagem", [["Gabrielly Morais Evangelista da Silva","12307795901","59"], ["Maria Eduarda de Assunção","13990786903","67"]]],
  ["Cadastro de peças", [["Graziella de Antoni dos Anjos","01231682957","67"], ["Rayssa Alessandra Ingatain","13513381964","46"]]],
  ["Cadastro de revendedoras", [["Camilly de Sousa Maciel","10007382995","46"], ["Thaylianny Aparecida Jacob","12664254979","67"]]],
  ["Compras", [["Helen Garmier da Silva","13403260941","59"]]],
  ["Condicionais", [["Majorry Prost Fermino dos Santos","10803001983","34"]]],
  ["Encomendas", [["Agatha Kristye Lencioni Mota","14946028900","46"], ["Eduarda Gabriela Henrique Lima","14176396954","46"], ["Elen Vitoria Lourenço de Bonfim","14746959900","34"]]],
  ["Equipe direção", [["Nickolas Gabriel Leal Neves","14675427928","46"], ["Nicole de Oliveira Ferreira","13183891948","46"], ["Priscila Schmidt Pinheiro","07315353917","46"]]],
  ["Facilities", [["Higor Fernando Goulart de Oliveira","08406053909","34"], ["Ines Scupura de Gouvea","64001350904","46"], ["Joao Guilherme de Oliveira","92280897920","46"]]],
  ["Financeiro", [["Bruna Rigos","04391975971","46"], ["Nayale Emanuele Calixto","08803032983","46"]]],
  ["Inadimplência", [["Amanda de Miranda Gonçalves","07099011944","46"], ["Amanda Thimoteo Coelho","11812514948","67"]]],
  ["Kits novos e indicação", [["Michele Brito Lima Cassemiro","11593112939","34"]]],
  ["Marketing", [["Beatriz Mascencio Gomes","37164761884","34"], ["Julia da Silva Zambonin","10165645970","46"], ["Rebeca Marques Melo","11402078900","34"]]],
  ["Montagem de kits", [["Eduarda Helena França de Lima","09007375903","59"], ["Ivanete Silva dos Reis","97402460959","59"], ["Jenifer Mariah Linhares Martins","15301831976","67"],
    ["Larissa Vitoria Cordeiro Skirzinski","08156704940","59"], ["Leticia Laastsch Carvalho","14231412960","46"], ["Maria Vitória da Silva Moreira","11493209906","59"],
    ["Pamela Leticia Alves Mateus Gomes","10397598904","46"], ["Paula Melissa Lopes Clazer","08448580990","59"], ["Rakiely Polli de Andrade","13909736971","67"],
    ["Tainara de França dos Santos","09295302923","59"]]],
  ["Produção", [["Amanda de Oliveira Silva","11237927471","46"], ["Audrieli Maria de Abreu","11088371906","59"], ["Crisbele da Silva","08864706925","59"],
    ["Cristiane Silva Soares","06824989983","46"], ["Fernanda Natalia Cordeiro dos Santos","01404689940","46"], ["Geisimara Melo Batista","08988350979","59"],
    ["Geovana Santos Neves","45896376855","46"], ["Isadora Julia Cordeiro de Franca","05087646298","34"], ["Jordana dos Santos Amorim","03271983208","34"],
    ["Katia Danielle Biscoto","02137560992","67"], ["Kislieydi Delurdes Moletta","07606390940","34"], ["Maria Aparecida Barreto dos Santos","04999989522","59"],
    ["Milene Slivinski de Godoi","09965974926","34"], ["Milenna Rafaela de França Chaves","14606603909","67"], ["Sandra da Conceição Oliveira Maia","02246103924","59"],
    ["Solange Batista Pires","09285669948","46"], ["Viviane Cristina Gomes","04865240942","34"]]],
  ["Representante", [["Thalita Torazzi Arndt","09850064986","46"]]],
  ["RH", [["Ana Paula de Almeida Fernandes","10865662975","67"], ["Maria Claudia Stresser de Faria","09883277911","46"]]],
  ["SAC", [["Leticia de Sá Vargas","09209849914","46"]]],
  ["Trocas", [["Ana Paula Slovinski","05863243996","59"], ["Giovanna Franco Rodrigues","13097985913","67"]]],
  // fora da lista de funcionários (CLT): sócios e família (CNPJ = empresa da qual é sócio) e PJs que trabalham para a Sorelly (H&O Apps = "ho")
  ["Sócios e família", [["Anamaria Hess de Oliveira","49156322968","34","Sócia"], ["Marcus Vinicius Hess de Oliveira","08577212912","46","Sócio (dono)"], ["Marco Antonio de Oliveira","40479218900","59","Sócio"],
    ["Lucas Oliveira da Rocha","10158918967","67","Sócio"], ["Ana Beatriz Hess de Oliveira","","","Família"]]],
  ["PJ · prestadores", [["Leonardo","","ho","Desenvolvedor (H&O Apps)"], ["Juan","","ho","Desenvolvedor (H&O Apps)"], ["Diego Franco","","","Gestor de tráfego"]]]];
var VINCULO_DO_SETOR = {"Sócios e família":"socio", "PJ · prestadores":"pj"};

// Representantes atualizadas por enquanto (CPF e CNPJ de cada uma o Marcus manda depois).
// `tambemFunc`: já está na lista de funcionários, por isso não entra de novo na contagem de representantes.
var REPRESENTANTES0 = ["Ana Claudia Adriano", "Ana Maria Divino da Silva", "Anne Asley de Souza Crispim", "Bruna Ribeiro dos Santos", "Dayanne Ferreira Scapin",
  "Edlaine Goncalves Guerra", "Fabila Kerolaine Serra Sales", "Francieli de Almeida", "Jessica Castro Reis", "Leticia Adrielle Moroz",
  "Leticia Alves de Oliveira Bariveira", "Lysie Karine Lencioni", "Marciane Silva de Castro", "Maria Eduarda Antunes", "Mariana Ribeiro Amaral",
  "Mayara Heloise Cruz de Almeida", "Nagela Eliney Hess", "Nayale Emanuele Calixto", "Rayssa Alessandra Ingatain Teixeira", "Sabrina da Silva Nascimento",
  "Thaina Cristina Idalgo", "Thalita Torazzi Arndt", "Vanessa Alves Lapa", "Veridiana da Rosa Lemke Fausto"];
var TAMBEM_FUNCIONARIA = ["Ana Maria Divino da Silva", "Nayale Emanuele Calixto", "Rayssa Alessandra Ingatain Teixeira", "Thalita Torazzi Arndt"];
var REPRESENTANTES = REPRESENTANTES0.map(function(n){ return {nome:n, cpf:"", cnpj:"", tambemFunc:TAMBEM_FUNCIONARIA.indexOf(n)>=0}; });

function funcionarios(){
  var r = [];
  FUNCIONARIOS_POR_SETOR.forEach(function(st){ st[1].forEach(function(f){ r.push({nome:f[0], cpf:f[1], cnpj:f[2], funcao:f[3]||"", setor:st[0], vinculo:VINCULO_DO_SETOR[st[0]]||"clt"}); }); });
  return r;
}
function cpfBR(v){ var n = String(v||"").replace(/\D/g,""); return n.length===11 ? n.slice(0,3)+"."+n.slice(3,6)+"."+n.slice(6,9)+"-"+n.slice(9) : (v||"—"); }
// totais usados na tela e na Visão geral
function resumoPessoas(){
  var fs = funcionarios(), porCnpj = {}, porSetor = FUNCIONARIOS_POR_SETOR.map(function(st){ return {setor:st[0], total:st[1].length}; });
  fs.forEach(function(f){ porCnpj[f.cnpj] = (porCnpj[f.cnpj]||0)+1; });
  var soReps = REPRESENTANTES.filter(function(r){ return !r.tambemFunc; }).length;
  var n = function(v){ return fs.filter(function(f){ return f.vinculo===v; }).length; };
  return {operacao:fs.length, funcionarios:n("clt"), socios:n("socio"), pjs:n("pj"), porCnpj:porCnpj, porSetor:porSetor, representantes:soReps, representantesLista:REPRESENTANTES.length, repsTambemFunc:REPRESENTANTES.length-soReps};
}

export { FUNCIONARIOS_POR_SETOR, REPRESENTANTES, funcionarios, cpfBR, resumoPessoas };
