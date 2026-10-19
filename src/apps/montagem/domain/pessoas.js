// Sorelly Admin · montagem — domain/pessoas.js
// Quadro de pessoas: funcionários (por setor e CNPJ) e representantes. Lista passada pelo Marcus em 07/10/2026.
// Só leitura por enquanto; depois a tela vai definir quem pode mexer no quê. O nome do cargo é de quem ocupa hoje.
// Funcionário: [nome, CPF (só números), id do CNPJ do cadastro (34, 46, 59 ou 67)].
var FUNCIONARIOS_POR_SETOR = [
  ["Agendamento", [["Ana Maria Divino da Silva","","46"], ["Mariana Cardoso de Almeida","","46"], ["Tamara Marques de Gouveia","","34"]]],
  ["Atendimento de kits", [["Deysiane Portugues da Silva","","46"], ["Edna Pereira Cardoso","","46"], ["Kawany Cristine Coutinho Silva","","59"],
    ["Leci Nunes da Rosa","","46"], ["Natalia Araujo de Souza","","34"], ["Nataly Fernanda Felipe Ribeiro","","59"],
    ["Natasha Ribeiro Lemes da Silva","","46"], ["Renata Dolato","","67"], ["Sthafany Marques de Aquino Correa","","67"]]],
  ["Bipagem", [["Gabrielly Morais Evangelista da Silva","","59"], ["Maria Eduarda de Assunção","","67"]]],
  ["Cadastro de peças", [["Graziella de Antoni dos Anjos","","67"], ["Rayssa Alessandra Ingatain","","46"]]],
  ["Cadastro de revendedoras", [["Camilly de Sousa Maciel","","46"], ["Thaylianny Aparecida Jacob","","67"]]],
  ["Compras", [["Helen Garmier da Silva","","59"]]],
  ["Condicionais", [["Majorry Prost Fermino dos Santos","","34"]]],
  ["Encomendas", [["Agatha Kristye Lencioni Mota","","46"], ["Eduarda Gabriela Henrique Lima","","46"], ["Elen Vitoria Lourenço de Bonfim","","34"]]],
  ["Equipe direção", [["Nickolas Gabriel Leal Neves","","46"], ["Nicole de Oliveira Ferreira","","46"], ["Priscila Schmidt Pinheiro","","46"]]],
  ["Facilities", [["Higor Fernando Goulart de Oliveira","","34"], ["Ines Scupura de Gouvea","","46"], ["Joao Guilherme de Oliveira","","46"]]],
  ["Financeiro", [["Bruna Rigos","","46"], ["Nayale Emanuele Calixto","","46"]]],
  ["Inadimplência", [["Amanda de Miranda Gonçalves","","46"], ["Amanda Thimoteo Coelho","","67"]]],
  ["Kits novos e indicação", [["Michele Brito Lima Cassemiro","","34"]]],
  ["Marketing", [["Beatriz Mascencio Gomes","","34"]]],   // Julia e Rebeca saíram em 15/10/2026
  ["Montagem de kits", [["Eduarda Helena França de Lima","","59"], ["Ivanete Silva dos Reis","","59"], ["Jenifer Mariah Linhares Martins","","67"],
    ["Larissa Vitoria Cordeiro Skirzinski","","59"], ["Leticia Laastsch Carvalho","","46"], ["Maria Vitória da Silva Moreira","","59"],
    ["Pamela Leticia Alves Mateus Gomes","","46"], ["Paula Melissa Lopes Clazer","","59"], ["Rakiely Polli de Andrade","","67"],
    ["Tainara de França dos Santos","","59"]]],
  ["Produção", [["Amanda de Oliveira Silva","","46"], ["Audrieli Maria de Abreu","","59"], ["Crisbele da Silva","","59"],
    ["Cristiane Silva Soares","","46"], ["Fernanda Natalia Cordeiro dos Santos","","46"], ["Geisimara Melo Batista","","59"],
    ["Geovana Santos Neves","","46"], ["Isadora Julia Cordeiro de Franca","","34"], ["Jordana dos Santos Amorim","","34"],
    ["Katia Danielle Biscoto","","67"], ["Kislieydi Delurdes Moletta","","34"], ["Maria Aparecida Barreto dos Santos","","59"],
    ["Milene Slivinski de Godoi","","34"], ["Milenna Rafaela de França Chaves","","67"], ["Sandra da Conceição Oliveira Maia","","59"],
    ["Solange Batista Pires","","46"], ["Viviane Cristina Gomes","","34"]]],
  ["Representante", [["Thalita Torazzi Arndt","","46"]]],
  ["RH", [["Ana Paula de Almeida Fernandes","","67"], ["Maria Claudia Stresser de Faria","","46"]]],
  ["SAC", [["Leticia de Sá Vargas","","46"]]],
  ["Trocas", [["Ana Paula Slovinski","","59"], ["Giovanna Franco Rodrigues","","67"]]],
  // fora da lista de funcionários (CLT): sócios e família (CNPJ = empresa da qual é sócio) e PJs que trabalham para a Sorelly (H&O Apps = "ho")
  ["Sócios e família", [["Anamaria Hess de Oliveira","","34","Sócia"], ["Marcus Vinicius Hess de Oliveira","","46","Sócio (dono)"], ["Marco Antonio de Oliveira","","59","Sócio"],
    ["Lucas Oliveira da Rocha","","67","Sócio"], ["Ana Beatriz Hess de Oliveira","","","Família"]]],
  ["PJ · prestadores", [["Leonardo","","ho","Desenvolvedor (H&O Apps)"], ["Juan","","ho","Desenvolvedor (H&O Apps)"], ["Diego Franco","","","Gestor de tráfego"]]]];
var VINCULO_DO_SETOR = {"Sócios e família":"socio", "PJ · prestadores":"pj"};

// Representantes atualizadas por enquanto (CPF e CNPJ de cada uma o Marcus manda depois). Sabrina e Julia G. saíram da empresa (19/10/2026): fora da lista.
// `tambemFunc`: já está na lista de funcionários, por isso não entra de novo na contagem de representantes.
var REPRESENTANTES0 = ["Ana Claudia Adriano", "Ana Maria Divino da Silva", "Anne Asley de Souza Crispim", "Bruna Ribeiro dos Santos", "Dayanne Ferreira Scapin",
  "Edlaine Goncalves Guerra", "Fabila Kerolaine Serra Sales", "Francieli de Almeida", "Jessica Castro Reis", "Leticia Adrielle Moroz",
  "Leticia Alves de Oliveira Bariveira", "Lysie Karine Lencioni", "Marciane Silva de Castro", "Maria Eduarda Antunes", "Mariana Ribeiro Amaral",
  "Mayara Heloise Cruz de Almeida", "Nagela Eliney Hess", "Nayale Emanuele Calixto", "Rayssa Alessandra Ingatain Teixeira",
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
