// Sorelly Admin · kits novos Curitiba — domain/regioes-rep.js
// MAPA DE REGIÕES DAS REPRESENTANTES (dados enviados pelas próprias representantes, 23/10/2026): onde cada uma atende hoje.
// 10 de 23 mapeadas; as outras aparecem como "Pendente" até responderem. Sabrina saiu em 19/10/2026 e não entra na lista.
// HORÁRIOS (jan) = SIMULAÇÃO até as representantes passarem os dias e horários reais (marcados com sim:true; ao editar na tela, passam a "Informado").
// jan: {seg:"mt", ...} = letras dos períodos em que atende: m manhã, t tarde, n noite. lim = entregas de kit novo por dia.
var DIAS = [["seg","Seg"],["ter","Ter"],["qua","Qua"],["qui","Qui"],["sex","Sex"],["sab","Sáb"],["dom","Dom"]];
var PERIODOS = [["m","Manhã"],["t","Tarde"],["n","Noite"]];
// Cidades da região metropolitana de Curitiba que aparecem no mapa (para "RMC inteira")
var RMC = ["Almirante Tamandaré","Araucária","Campina Grande do Sul","Campo Largo","Campo Magro","Colombo","Contenda","Fazenda Rio Grande","Itaperuçu","Pinhais","Piraquara","Quatro Barras","Rio Branco do Sul","São José dos Pinhais"];

var c = function(nome, b){ return {c:nome, b:b||[]}; };
var semana = function(m, sab, dom){ return {seg:m, ter:m, qua:m, qui:m, sex:m, sab:sab||"", dom:dom||""}; };   // segunda a sexta iguais

var PERFIS0 = {
  "Anne": {completo:"Anne Asley de Souza Crispim",
    cur:["Capão Raso","Portão","CIC","Sítio Cercado","Umbará","Uberaba","Alto Boqueirão","Boqueirão","Xaxim","Lindóia","Cajuru","Bairro Alto","Fanny","Pinheirinho"],
    rmc:[c("Pinhais"), c("Araucária"), c("Colombo"), c("Campo Largo"), c("Campo Magro")], pg:true, outras:[c("Joinville")], prior:[],
    jan:semana("mt", "m"), lim:4},
  "Bruna": {completo:"Bruna Ribeiro dos Santos",
    cur:["Cajuru","Uberaba","Centro"], rmc:[c("São José dos Pinhais"), c("Pinhais"), c("Piraquara")], prior:[],
    jan:{seg:"tn", ter:"tn", qua:"tn", qui:"tn", sex:"tn", sab:"mt", dom:""}, lim:3},
  "Dayanne": {completo:"Dayanne Ferreira Scapin",
    cur:["CIC","Fazendinha","Novo Mundo","Campo Comprido","Sítio Cercado","Boqueirão","Alto Boqueirão","Pinheirinho","Capão Raso","Xaxim"],
    rmc:[c("Araucária"), c("Fazenda Rio Grande")], prior:[],
    jan:{seg:"mt", ter:"mt", qua:"mt", qui:"mt", sex:"mtn", sab:"m", dom:""}, lim:5},
  "Fabila": {completo:"Fabila Kerolaine Serra Sales",
    cur:["Cajuru","Uberaba","Santa Felicidade","Tatuquara","Campo de Santana","Sítio Cercado"],
    rmc:[c("Almirante Tamandaré"), c("Rio Branco do Sul"), c("Itaperuçu"), c("São José dos Pinhais"), c("Pinhais",["Weissópolis"])], prior:["Cajuru","Uberaba"],
    obs:"Quer receber mais leads de Cajuru e Uberaba (prioridade)",
    jan:{seg:"", ter:"mt", qua:"mt", qui:"mt", sex:"mtn", sab:"", dom:""}, lim:4},
  "Jessica Castro": {completo:"Jessica Castro Reis", curTodos:true, rmcTodos:true,
    cur:["Atuba","Alto Boqueirão","Boqueirão","Bairro Alto","Bigorrilho","Rebouças","Umbará","Campo de Santana","Parolin","Pinheirinho","Xaxim","Ganchinho","Barreirinha","Tingui","Pilarzinho","Uberaba","Sítio Cercado","Cajuru","Portão","Capão Raso","Capão da Imbuia","Abranches","Santa Felicidade","Orleans","São Braz","Butiatuvinha","Tatuquara","Fanny","CIC","Hauer","Vila Izabel","Santa Cândida","Lindóia"],
    rmc:[c("Pinhais"), c("São José dos Pinhais",["Pedro Moro","Iná","Cidade Jardim","Afonso Pena"]), c("Campo Largo"), c("Araucária"), c("Contenda")], prior:[],
    jan:{seg:"mtn", ter:"mtn", qua:"mtn", qui:"mtn", sex:"mtn", sab:"mt", dom:""}, lim:6},
  "Leticia Moroz": {completo:"Leticia Adrielle Moroz",
    cur:["CIC","Fazendinha","Pinheirinho","Capão Raso","Umbará","Ganchinho"],
    rmc:[c("Araucária",["Capela Velha"]), c("São José dos Pinhais",["Borda do Campo","Quissisana"])], outras:[c("Joinville",["Cubatão","Aventureiro","Iririu"])], prior:[],
    jan:{seg:"tn", ter:"tn", qua:"tn", qui:"tn", sex:"tn", sab:"m", dom:""}, lim:3},
  "Lysie": {completo:"Lysie Karine Lencioni",
    cur:["Boa Vista","Santa Cândida","Cajuru","Sítio Cercado"], rmc:[c("Campina Grande do Sul")], prior:[],
    jan:{seg:"", ter:"m", qua:"m", qui:"m", sex:"m", sab:"m", dom:""}, lim:4},
  "Maria Eduarda": {completo:"Maria Eduarda Antunes",
    cur:["Sítio Cercado","Xaxim","Hauer","Boqueirão","Novo Mundo","Alto Boqueirão","Umbará","Capão da Imbuia","CIC"], rmc:[c("São José dos Pinhais"), c("Colombo")], prior:[],
    jan:semana("mt"), lim:4},
  "Thaina": {completo:"Thaina Cristina Idalgo",
    cur:["Uberaba","Boqueirão","Xaxim","Hauer","Capão Raso","Novo Mundo"],
    rmc:[c("São José dos Pinhais",["Cidade Jardim","Guatupê","Iná","Independência","Centro"]), c("Pinhais")], prior:[],
    jan:{seg:"tn", ter:"", qua:"tn", qui:"", sex:"tn", sab:"m", dom:""}, lim:3},
  "Thalita": {completo:"Thalita Torazzi Arndt", func:true,
    cur:["Cajuru","Uberaba","Centro","Bairro Alto","Boqueirão","Alto Boqueirão","Pinheirinho","Capão Raso","CIC","Cristo Rei","Hauer","Jardim Social","Jardim das Américas"],
    rmc:[c("São José dos Pinhais"), c("Colombo"), c("Quatro Barras"), c("Pinhais"), c("Araucária"), c("Piraquara")],
    outras:[c("Matinhos"), c("Paranaguá"), c("Guaratuba"), c("Pontal do Paraná"), c("Itajaí"), c("Balneário Camboriú"), c("Camboriú"), c("Itapema")], prior:[],
    obs:"Também atende o litoral do Paraná e de Santa Catarina",
    jan:{seg:"n", ter:"n", qua:"n", qui:"n", sex:"n", sab:"mt", dom:"m"}, lim:5}
};
Object.keys(PERFIS0).forEach(function(k){ var p = PERFIS0[k]; p.nome = k; p.curTodos = !!p.curTodos; p.rmcTodos = !!p.rmcTodos; p.pg = !!p.pg; p.outras = p.outras || []; p.prior = p.prior || []; p.obs = p.obs || ""; p.sim = true; });

// Ainda sem mapa (13). func = também é funcionária.
var PENDENTES = [["Ana Claudia"], ["Ana Maria", true], ["Edlaine"], ["Francieli"], ["Jessica Tobias"], ["Leticia Alves"], ["Marciane"], ["Mariana"], ["Mayara"], ["Nagela"], ["Nayale", true], ["Rayssa", true], ["Vanessa"], ["Veridiana"]]
  .map(function(x){ return {nome:x[0], func:!!x[1]}; });

// Mapa de regiões das pendentes que já mandaram (24/10/2026). Só o que elas escreveram; o resto continua para mapear.
var REGIOES_EXTRA = {
  "Jessica Tobias": {completo:"Jessica Tobias da Silva", cur:["Sítio Cercado","Ganchinho","Umbará","Pinheirinho","Capão Raso","Novo Mundo","Alto Boqueirão","Boqueirão","Xaxim","Tatuquara","Campo de Santana","Bairro Novo","Hauer","Portão","Água Verde","Mercês"], rmc:[{c:"São José dos Pinhais", b:[]}], obs:"Representante nova. Estes são os bairros de interesse prioritário, mas atende outras regiões conforme a demanda e as rotas. Pode passar do horário alguns dias, mas não quer chegar sempre às 22h em casa"},
  "Vanessa": {completo:"Vanessa", cur:["CIC","Tatuquara","Novo Mundo","Uberaba","Cajuru","Guabirotuba","Capão da Imbuia","Sítio Cercado","Fazendinha"], rmc:[{c:"São José dos Pinhais", b:["Parque da Fonte","Pedro Moro","Centro","Iná","Aviação"]}, {c:"Araucária", b:["Iguaçu","Costeira","Campina da Barra","Thomaz Coelho","Cachoeira"]}, {c:"Pinhais", b:["Centro","Maria Antonieta","Vargem Grande","Jardim Cláudia"]}, {c:"Piraquara", b:["Jd. Santa Mônica","Vila Juliana","Vila Ipanema"]}], nao:[{c:"Piraquara", b:[]}], obs:"Não gosta de atender Piraquara: não indicar mais kits novos para lá. Disse que pode atender mais em Pinhais, Cajuru e São José dos Pinhais"},
  "Mariana": {completo:"Mariana", outras:[{c:"Maringá", b:[]}], obs:"De Maringá. É a única representante que atende lá"},
  "Edlaine": {completo:"Edlaine Guerra", cur:["CIC","Fazendinha","Campo de Santana","Vila Verde","Tatuquara","Vitória Régia","Campo Comprido","Pinheirinho","Novo Mundo","São Miguel"], rmc:[{c:"Campina Grande do Sul", b:["Sede"]}, {c:"Quatro Barras", b:[]}]},
  "Nayale": {completo:"Nayale Emanuele Calixto", func:true, cur:["Cajuru","Capão da Imbuia"], rmc:[{c:"São José dos Pinhais", b:[]}, {c:"Piraquara", b:[]}, {c:"Pinhais", b:[]}], obs:"Funcionária (Financeiro, 07h30 às 17h18). Hoje atende 8 revendedoras: 4 no Cajuru, 1 na Capão da Imbuia, 1 em SJP, 1 em Piraquara e 1 em Pinhais. Falta dizer os dias e horários"},
  "Mayara": {completo:"Mayara", rmc:[{c:"Fazenda Rio Grande", b:[]}], obs:"Atende qualquer revendedora de Fazenda Rio Grande, em qualquer dia e horário. Disse também \"pro lado de cá da cidade, pode contar comigo\" (falta saber qual lado)"},
  "Ana Claudia": {completo:"Ana Cláudia", cur:["Umbará","Sítio Cercado","Pinheirinho","Novo Mundo","Capão Raso","CIC","Fazendinha","Santa Cândida","Centro","Xaxim","Campo de Santana","São Braz","Cajuru","Guaíra","Boqueirão","Hauer"], rmc:[{c:"São José dos Pinhais", b:[]}, {c:"Pinhais", b:[]}, {c:"Fazenda Rio Grande", b:[]}]},
  "Marciane": {completo:"Marciane", cur:["Cajuru","Boa Vista","Uberaba","Santa Cândida"], rmc:[{c:"São José dos Pinhais", b:[]}, {c:"Quatro Barras", b:[]}, {c:"Araucária", b:[]}], obs:"Representante nova. Curitiba é o que atende hoje, ainda não passou todos os bairros. Região metropolitana: pode começar a atender, perto das que já atende"},
  "Ana Maria": {completo:"Ana Maria", func:true, cur:[], rmc:[{c:"Fazenda Rio Grande", b:["Estados","Nações","Eucaliptos","Pioneiros","Santa Terezinha","Gralha Azul"]}, {c:"Araucária", b:["Iguaçu"]}], obs:"Só uma revendedora em Araucária (indicação dela)"},
  "Leticia Alves": {completo:"Letícia Alves", cur:["Xaxim","Sítio Cercado","Alto Boqueirão","Cajuru","Uberaba","Hauer","Boqueirão","CIC","Ganchinho","Santa Quitéria","Pinheirinho","Pilarzinho","Fazendinha","Butiatuvinha"],
    rmc:[{c:"São José dos Pinhais", b:["São Marcos","Ouro Fino","Parque da Fonte","Aristocrata","Rio Pequeno","São Roque","Cruzeiro","Santo Antônio","Cidade Jardim","Colônia Murici","Quississana","Jurema","Campo Largo da Roseira","Ipê","Jardim Independência"]}, {c:"Colombo", b:["Jd. Guaraituba","Fátima","Canguiri"]}, {c:"Piraquara", b:["Vila Rosa"]}, {c:"Araucária", b:["Capela Velha","Sabiá","Costeira"]}]}
};
// RESPOSTAS das representantes ao pedido de dias e horários (SIMULAÇÃO de 23/10/2026: elas ainda não responderam de verdade). Formato que elas usam: um horário exato por dia, e observação.
// Quem está aqui vira "Informado" (sem o selo de simulação); se for pendente do mapa de regiões, só os horários entram e a região continua para mapear. Quando as reais chegarem, substitui-se pelo botão Editar.
var D = "das 8h às 12h e das 14h às 18h";
var RESPOSTAS = {
  "Anne": {hor:{seg:"manhã, tarde e noite (total disponibilidade)", ter:"manhã, tarde e noite (total disponibilidade)", qua:"manhã, tarde e noite (total disponibilidade)", qui:"das 8:30 às 16:30", sex:"das 8:30 às 16:30", sab:"manhã, tarde e noite (total disponibilidade)", dom:"não atendo"}, obs:"Anne Ashley. Sábado: só 2 sábados por mês. Domingo não atende, só se a demanda for muito necessária", lim:0},
  "Bruna": {hor:{seg:"das 10h às 20h", ter:"das 10h às 20h", qua:"das 10h às 20h", qui:"das 10h às 20h", sex:"das 10h às 20h", sab:"se necessário", dom:"não atendo"}, obs:"Começa às 10h porque treina de manhã; em dia cheio começa mais cedo. Vai até as 20h se for perto de casa. Sexta: ela escreveu \"20 às 20h\"; entendi 10h às 20h. Sábado só se necessário", lim:0},
  "Thaina": {hor:{seg:"das 8h às 12h e das 14h às 18h", ter:"das 14h30 às 20h", qua:"das 14h30 às 20h", qui:"das 14h30 às 20h", sex:"das 8h às 12h e das 14h às 19h", sab:"das 8h às 12h", dom:"não atendo"}, obs:"Thainá Idalgo. De terça a quinta só depois das 14h, por causa do trabalho interno", lim:0},
  "Dayanne": {hor:{seg:"das 8h às 18h", ter:"das 8h às 18h", qua:"das 8h às 18h", qui:"das 8h às 18h", sex:"das 8h às 18h", sab:"das 8h às 12h", dom:"não atendo"}, obs:"Já pegou kits novos em outubro. Viaja em novembro: segura kits novos agora e volta a atender depois da viagem", lim:0},
  "Ana Claudia": {hor:{seg:"das 8h às 16h", ter:"das 8h às 16h", qua:"das 8h às 16h", qui:"das 8h às 16h", sex:"das 8h às 16h", sab:"das 8h às 12h", dom:"não atendo"}, obs:"Pode começar a atender mais em Boqueirão, Xaxim, Sítio Cercado e Umbará", lim:0},
  "Lysie": {hor:{seg:"das 8h às 17h", ter:"das 8h às 17h", qua:"das 8h às 17h", qui:"das 8h às 17h", sex:"das 8h às 17h", sab:"não atendo", dom:"não atendo"}, obs:"Horário comercial 8h às 17h. Há revendedoras atendidas às 7h e às 19h, conforme a rota do dia", lim:0},
  "Edlaine": {hor:{seg:"das 9h às 19h", ter:"das 9h às 19h", qua:"das 9h às 19h", qui:"das 9h às 19h", sex:"das 9h às 19h", sab:"não atendo", dom:"não atendo"}, obs:"Sábado trabalha em outra empresa (loja). Região metropolitana: 1 vez no mês, tudo no mesmo dia. Pode começar a atender Sítio Cercado, Santa Quitéria e Capão Raso", lim:0},
  "Vanessa": {hor:{seg:"das 9h30 às 18h30", ter:"das 9h30 às 18h30", qua:"das 9h30 às 18h30", qui:"das 9h30 às 18h30", sex:"das 9h30 às 18h", sab:"não atendo", dom:"não atendo"}, obs:"Sem almoço. Duas clientes às 19h30; o horário depende da cliente. Não gosta de atender Piraquara: não indicar kit novo para lá. Pode atender mais em Pinhais, Cajuru e São José dos Pinhais", lim:0},
  "Ana Maria": {hor:{seg:"das 18h às 21h", ter:"das 18h às 21h", qua:"das 18h às 21h", qui:"das 18h às 21h", sex:"das 18h às 21h", sab:"das 8h às 12h", dom:"não atendo"}, obs:"Funcionária (Agendamento, 07h às 16h48): não atende durante o expediente. Sábado a confirmar", lim:2},
  "Leticia Alves": {hor:{seg:"das 8h às 18h", ter:"das 8h às 21h", qua:"das 8h às 18h", qui:"das 8h às 18h", sex:"das 8h às 18h", sab:"das 8h às 18h", dom:"não atendo"}, obs:"Segunda, quarta, quinta e sexta em horário comercial; terça até 21h; sábado intercalado", lim:3},
  "Francieli": {hor:{seg:"das 8h às 18h", ter:"das 8h às 18h", qua:"das 8h às 18h", qui:"das 8h às 18h", sex:"das 8h às 18h", sab:"das 8h às 12h", dom:"não atendo"}, obs:"Horário comercial (por causa da filha); sábado às vezes. Na semana de 26/10 não pode se comprometer. Falta dizer as regiões", lim:0},
  "Mayara": {hor:{seg:"manhã, tarde e noite", ter:"manhã, tarde e noite", qua:"manhã, tarde e noite", qui:"manhã, tarde e noite", sex:"manhã, tarde e noite", sab:"manhã, tarde e noite", dom:"manhã, tarde e noite"}, obs:"Disse que atende qualquer horário e dia da semana para revendedora de Fazenda Rio Grande", lim:0},
  "Jessica Castro": {hor:{seg:"das 8h às 18h", ter:"das 8h às 18h", qua:"das 8h às 18h", qui:"das 8h às 18h", sex:"das 8h às 18h", sab:"das 9h às 14h", dom:"não atendo"}, obs:"Jéssica Félix (no WhatsApp). Sábado: só 2 no mês, o primeiro e o último. Às vezes tira um dia da semana para atender até as 21h. A partir do dia 20 trabalha até mais tarde, para entregar os kits dentro do mês", lim:0},
  "Jessica Tobias": {hor:{seg:"das 8h às 18h", ter:"das 8h às 18h", qua:"das 8h às 18h", qui:"das 8h às 18h", sex:"das 8h às 18h", sab:"manhã", dom:"não atendo"}, obs:"Disse \"horário comercial\"; gravei 8h às 18h. Sábado de manhã. Não tem problema em passar do horário alguns dias. Indisponível de 12 a 15/11", lim:0},
  "Thalita": {hor:{seg:"das 9:00 às 20:00", ter:"das 9:00 às 20:00", qua:"a partir das 10:00", qui:"das 14:00 às 20:00", sex:"", sab:"", dom:""}, obs:"Atende por rota: segunda Paranaguá (até 20h/21h); terça Paranaguá, Matinhos, Pontal do Paraná e Guaratuba (até 20h/21h); quarta a partir das 10h em Quatro Barras e Campina Grande do Sul; quinta depois do almoço até 20h, para finalizar tudo do mês. Sexta, sábado e domingo vieram em branco: confirmar", lim:0},
  "Veridiana": {hor:{seg:"das 8h às 18h", ter:"não atendo", qua:"das 8h às 18h", qui:"não atendo", sex:"das 8h às 18h", sab:"das 8h às 12h", dom:"não atendo"}, obs:"Terça e quinta trabalho em outro lugar", lim:3}
};

// "das 8h às 12h e das 14h às 18h" → letras dos períodos que o horário toca: m manhã (até 12h), t tarde (12h às 18h), n noite (depois das 18h). Também entende "manhã", "tarde", "noite" e "a partir das 14h".
function periodosDe(txt){
  var t = String(txt||"").toLowerCase(); if(!t.trim() || /n[aã]o atendo|n[aã]o trabalho|folga/.test(t)) return "";
  var set = {}; if(/manh/.test(t)) set.m = 1; if(/tarde/.test(t)) set.t = 1; if(/noite/.test(t)) set.n = 1;
  var marca = function(a, b){ if(b>a && a<12) set.m = 1; if(b>12 && a<18) set.t = 1; if(b>18 && a<24) set.n = 1; };
  var re = /(\d{1,2})(?:[:h]\d{2})?\s*h?\s*(?:às|as|a|-|–|até)\s*(\d{1,2})/g, m;
  while((m = re.exec(t))) marca(Number(m[1]), Number(m[2]));
  var ap = /a partir d[aeo]s?\s*(\d{1,2})/.exec(t); if(ap) marca(Number(ap[1]), 20);
  return ["m", "t", "n"].filter(function(l){ return set[l]; }).join("");
}
var janDe = function(hor){ var o = {}; DIAS.forEach(function(d){ o[d[0]] = periodosDe((hor||{})[d[0]]); }); return o; };
// letras → texto, para quem só tinha os períodos ("mt" → "manhã e tarde")
var horDeJan = function(jan){ var o = {}; DIAS.forEach(function(d){ var v = String((jan||{})[d[0]]||""); o[d[0]] = v ? v.split("").map(function(l){ return {m:"manhã", t:"tarde", n:"noite"}[l]; }).join(" e ") : "não atendo"; }); return o; };
// "das 8h às 12h e das 14h às 18h" → "8–12 · 14–18" (para caber na tabela)
function horasCompacto(txt){
  var t = String(txt||""); if(!t.trim()) return "—"; if(/n[aã]o atendo|n[aã]o trabalho|folga/i.test(t)) return "não atende"; if(/manh/i.test(t) && /tarde/i.test(t) && /noite/i.test(t)) return "dia todo";
  var r = [], re = /(\d{1,2})(?:[:h]\d{2})?\s*h?\s*(?:às|as|a|-|–|até)\s*(\d{1,2})/gi, m; while((m = re.exec(t))) r.push(m[1]+"–"+m[2]);
  return r.length ? r.join(" · ") : t;
}

export { DIAS, PERIODOS, RMC, PERFIS0, REGIOES_EXTRA, PENDENTES, RESPOSTAS, periodosDe, janDe, horDeJan, horasCompacto };
