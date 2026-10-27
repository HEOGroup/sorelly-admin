// Sorelly Admin · montagem — domain/cadastro-leads-demo.js
// 20 candidatas de DEMONSTRAÇÃO para a fila de Aprovação de cadastros (pedido do Marcus, 23/10/2026), para testar o caminho Cadastro → Kits novos.
// Nomes e telefones são inventados (nada de pessoa real; o repositório é público). Entram uma vez só (flag demo20 em s.cl) e podem ser apagadas em Aprovação de cadastros.
// [nome, cidade, bairro, rua e número, profissão, onde trabalha]
var LINHAS = [
  ["Aline Moreira Pacheco", "Curitiba", "Cajuru", "Rua Pedro Gusso, 410", "Professora", "Escola Municipal Cajuru"],
  ["Bianca Freitas Duarte", "Curitiba", "Uberaba", "Rua Rio Grande do Norte, 88", "Manicure", "Studio Bianca"],
  ["Camila Rocha Lemos", "Curitiba", "Sítio Cercado", "Rua Pedro Zacharias, 250", "Atendente", "Mercado Bom Preço"],
  ["Daniela Souza Andrade", "Curitiba", "Xaxim", "Rua Atílio Bório, 31", "Enfermeira", "UPA Boqueirão"],
  ["Eliane Prado Vieira", "Curitiba", "Boqueirão", "Rua Waldemar Loureiro Campos, 77", "Recepcionista", "Clínica Vida"],
  ["Fernanda Lima Batista", "Curitiba", "CIC", "Rua Francisco Vieira, 15", "Costureira", "Confecção Fio de Ouro"],
  ["Gabriela Neves Tavares", "Curitiba", "Pinheirinho", "Rua Nicola Pellanda, 600", "Cabeleireira", "Salão Gabi"],
  ["Helena Castro Barros", "Curitiba", "Capão Raso", "Rua Rio Bonito, 120", "Técnica de enfermagem", "Hospital Rocio"],
  ["Isabela Martins Cruz", "Curitiba", "Umbará", "Rua Tapajós, 45", "Vendedora autônoma", ""],
  ["Juliana Ferraz Nunes", "Curitiba", "Hauer", "Rua Francisco Derosso, 330", "Auxiliar administrativa", "Contábil Hauer"],
  ["Karina Mendes Lopes", "Curitiba", "Santa Felicidade", "Rua Manoel Ribas, 900", "Garçonete", "Cantina da Vila"],
  ["Larissa Gomes Pinto", "Curitiba", "Portão", "Avenida República Argentina, 1200", "Vendedora", "Loja Centro Sul"],
  ["Mariana Teixeira Rosa", "São José dos Pinhais", "Afonso Pena", "Rua Joaquim Nabuco, 70", "Professora", "Colégio Afonso Pena"],
  ["Natália Cardoso Alves", "São José dos Pinhais", "Cidade Jardim", "Rua das Orquídeas, 140", "Confeiteira", "Doces da Nat"],
  ["Patrícia Ribeiro Cunha", "Colombo", "Centro", "Rua XV de Novembro, 410", "Cuidadora de idosos", ""],
  ["Renata Dias Monteiro", "Pinhais", "Weissópolis", "Rua das Hortênsias, 18", "Atendente", "Padaria Pão Quente"],
  ["Sabrina Azevedo Lins", "Araucária", "Capela Velha", "Rua das Acácias, 90", "Operadora de caixa", "Supermercado Central"],
  ["Tatiane Barbosa Queiroz", "Fazenda Rio Grande", "Eucaliptos", "Rua dos Ipês, 22", "Merendeira", "Escola Municipal Eucaliptos"],
  ["Vanessa Coelho Matos", "Ponta Grossa", "Oficinas", "Rua Doutor Colares, 300", "Esteticista", "Espaço Vanessa"],
  ["Yasmin Pereira Godoy", "Joinville", "Cubatão", "Rua das Palmeiras, 55", "Auxiliar de enfermagem", "Clínica Cubatão"]
];

// d = quantos dias atrás cada uma entrou (as mais antigas primeiro na fila)
function leadsDemo(hoje, somaDias){
  return LINHAS.map(function(l, i){
    var dia = somaDias(hoje, -(i % 4)), min = String((i * 7) % 60).padStart(2, "0");
    return {nome:l[0], cidade:l[1], endereco:l[3]+" - "+l[2], profissao:l[4], empresa:l[5], telefone:"(41) 99999-"+String(i+1).padStart(4, "0"),
      observacoes:"Cadastro de demonstração", tags:["FACEBOOK ADS"], desempenho:"iniciou-análise", criadoEm:dia, etapaCriadaEm:dia, entrouNaFilaEm:dia+"T"+String(8 + (i % 9)).padStart(2, "0")+":"+min+":00"};
  });
}

// 30 candidatas de HISTÓRICO (23/10/2026), dos últimos 27 dias, para dar números ao Desempenho do cadastro (funil, origem, campanhas, registros).
// [nome, cidade, bairro, rua e número, profissão, origem (tag), dias atrás que entrou, decisão (A aprovada, R reprovada, P na fila), etapa do funil, dias até decidir, kit (só aprovadas)]
var HIST = [
  ["Adriana Salles Pires","Curitiba","Cajuru","Rua Pedro Gusso, 88","Professora","FACEBOOK ADS",27,"A","cadastradas",1,"kit_normal"],
  ["Beatriz Cordeiro Luz","Curitiba","Uberaba","Rua Rio Grande do Norte, 410","Manicure","FACEBOOK ADS",26,"R","reprovadas",1],
  ["Carolina Bastos Ayres","São José dos Pinhais","Cidade Jardim","Rua Padre Jaime, 15","Atendente","INDICAÇÃO",25,"A","cadastradas",0,"kit_normal"],
  ["Deise Menezes Prado","Curitiba","Sítio Cercado","Rua Pedro Zacharias, 190","Enfermeira","FACEBOOK ADS",24,"A","cadastradas",1,"kit_normal_expositor"],
  ["Elaine Furtado Neri","Colombo","Centro","Rua Coronel Ottoni, 60","Costureira","INSTAGRAM",23,"R","reprovadas",2],
  ["Flávia Lacerda Souto","Curitiba","Xaxim","Rua Atílio Bório, 210","Vendedora","FACEBOOK ADS",22,"A","cadastradas",1,"kit_normal"],
  ["Giovana Pontes Rangel","Curitiba","Boqueirão","Rua Waldemar Loureiro Campos, 12","Recepcionista","SITE",21,"R","nao-respondem",0],
  ["Heloísa Marques Dias","Pinhais","Weissópolis","Rua das Hortênsias, 70","Cabeleireira","INDICAÇÃO",20,"A","cadastradas",1,"vir_empresa"],
  ["Ingrid Vasconcelos Reis","Curitiba","CIC","Rua Francisco Vieira, 330","Auxiliar administrativa","FACEBOOK ADS",19,"R","reprovadas",1],
  ["Jaqueline Torres Bento","Araucária","Centro","Rua Pedro Druszcz, 45","Cuidadora de idosos","FACEBOOK ADS",18,"A","cadastradas",2,"kit_normal"],
  ["Kelly Moura Falcão","Curitiba","Pinheirinho","Rua Nicola Pellanda, 700","Esteticista","INSTAGRAM",17,"A","cadastradas",1,"kit_normal_expositor"],
  ["Luana Siqueira Paes","Curitiba","Capão Raso","Rua Rio Bonito, 95","Técnica de enfermagem","FACEBOOK ADS",16,"R","reprovadas",1],
  ["Monique Andrade Cruz","Fazenda Rio Grande","Nações","Rua das Palmeiras, 18","Merendeira","FACEBOOK ADS",15,"A","aprovada",1,"kit_normal"],
  ["Nádia Carvalho Leal","Curitiba","Hauer","Rua Francisco Derosso, 140","Confeiteira","SITE",14,"R","nao-respondem",0],
  ["Olívia Ramos Teles","Curitiba","Umbará","Rua Tapajós, 220","Vendedora autônoma","INDICAÇÃO",13,"A","aprovada",0,"kit_normal"],
  ["Paula Guedes Brandão","Campo Largo","Centro","Rua Prefeito Milton Pereira, 300","Professora","FACEBOOK ADS",12,"R","reprovadas",1],
  ["Rafaela Duarte Lins","Curitiba","Portão","Avenida República Argentina, 2100","Atendente","INSTAGRAM",11,"A","aprovada",1,"kit_normal"],
  ["Silvia Nogueira Matos","Curitiba","Santa Felicidade","Rua Manoel Ribas, 1500","Garçonete","FACEBOOK ADS",10,"R","reprovadas",1],
  ["Tamires Lopes Veiga","Curitiba","Alto Boqueirão","Rua Mauro Ferreira, 33","Auxiliar de limpeza","FACEBOOK ADS",9,"A","aprovada",1,"vir_empresa_expositor"],
  ["Úrsula Batista Rocha","São José dos Pinhais","Afonso Pena","Rua Joaquim Nabuco, 400","Vendedora","INDICAÇÃO",8,"A","cadastradas",0,"kit_normal"],
  ["Valéria Pimentel Sá","Curitiba","Bairro Alto","Rua Ivo Leão, 25","Cabeleireira","FACEBOOK ADS",7,"R","nao-respondem",0],
  ["Wanessa Quintana Dias","Curitiba","Tatuquara","Rua Jorge Pelanda, 60","Operadora de caixa","FACEBOOK ADS",6,"P","iniciou-análise"],
  ["Yara Lemos Sanches","Curitiba","Fanny","Rua Eduardo Sprada, 250","Costureira","INSTAGRAM",5,"P","iniciou-análise"],
  ["Zélia Bertoldi Maia","Curitiba","Novo Mundo","Rua João Bettega, 880","Manicure","FACEBOOK ADS",4,"P","iniciou-análise"],
  ["Amanda Rezende Pinho","Curitiba","Lindóia","Rua Eurico de Freitas, 12","Professora","SITE",3,"P","iniciou-análise"],
  ["Bárbara Fontes Guimarães","Curitiba","Campo de Santana","Rua Deputado Odilon Mader, 77","Atendente","FACEBOOK ADS",12,"R","nao-respondem",0],
  ["Cíntia Alvim Soares","Curitiba","Cajuru","Rua Pedro Gusso, 600","Vendedora","FACEBOOK ADS",8,"R","nao-respondem",0],
  ["Dalila Pacheco Rios","São José dos Pinhais","Pedro Moro","Rua Engenheiro Rebouças, 90","Recepcionista","INSTAGRAM",6,"R","nao-respondem",0],
  ["Edna Ferreira Lobo","Curitiba","Uberaba","Rua Rio Grande do Norte, 900","Cuidadora","FACEBOOK ADS",13,"R","nao-respondem",0],
  ["Fabíola Mendes Garcia","Curitiba","Sítio Cercado","Rua Pedro Zacharias, 500","Enfermeira","INDICAÇÃO",5,"A","cadastradas",0,"kit_normal"]
];
var REVISORAS = ["Camilly", "Alessandra"];
function leadsHistorico(hoje, somaDias, valores){
  return HIST.map(function(l, i){
    var criado = somaDias(hoje, -l[6]), decide = somaDias(criado, l[9]||0); if(decide>hoje) decide = hoje;
    var hora = String(8 + (i % 9)).padStart(2, "0")+":"+String((i * 11) % 60).padStart(2, "0")+":00";
    var o = {nome:l[0], cidade:l[1], endereco:l[3]+" - "+l[2], profissao:l[4], empresa:"", telefone:"(41) 98888-"+String(i+1).padStart(4, "0"), observacoes:"Cadastro de demonstração",
      tags:[l[5]], desempenho:l[8], criadoEm:criado, etapaCriadaEm:criado, entrouNaFilaEm:criado+"T"+hora};
    if(l[7]==="A") Object.assign(o, {reviewStatus:"APPROVED", reviewedAt:decide+"T"+hora, reviewedBy:REVISORAS[i % 2], kitOpcao:l[10], kitValorCasa:valores.casa, kitValorEmpresa:valores.empresa});
    if(l[7]==="R") Object.assign(o, {reviewStatus:"REJECTED", reviewedAt:decide+"T"+hora, reviewedBy:REVISORAS[i % 2], reviewNote:l[8]==="nao-respondem" ? "Não respondeu" : "Não atende aos critérios"});
    return o;
  });
}
// campanhas de anúncio de OUTUBRO/2026 (valores de demonstração, digitados como no sistema hoje; a Meta ainda não está ligada)
var CAMPANHAS_DEMO = [
  {nome:"Captação revendedoras - Outubro", mes:"2026-10", gasto:5400, impressoes:412000, cliques:6100, anuncios:[{nome:"Vídeo depoimento", gasto:3100, impressoes:240000, cliques:3700}, {nome:"Carrossel kit", gasto:2300, impressoes:172000, cliques:2400}]},
  {nome:"Remarketing - Outubro", mes:"2026-10", gasto:1800, impressoes:96000, cliques:1900, anuncios:[{nome:"Lembrete cadastro", gasto:1800, impressoes:96000, cliques:1900}]},
  {nome:"Instagram stories - Outubro", mes:"2026-10", gasto:1200, impressoes:88000, cliques:1300, anuncios:[{nome:"Stories ganhe comissão", gasto:1200, impressoes:88000, cliques:1300}]}
];

export { leadsDemo, leadsHistorico, CAMPANHAS_DEMO };
