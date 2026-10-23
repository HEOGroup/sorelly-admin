// Sorelly Admin · montagem — domain/escala42.js
// Escala nova (fim da 6x1, vale a partir de 16/12/2026): 42h por semana e 2 folgas. É só planejamento por pessoa: não mexe na escala atual do RH.
// Equipe A = seg a sex (folga sáb e dom) · Equipe B = ter a sáb (folga dom e seg) · Padrão = seg a sex, igual à A.
// Seg a qui (A/Padrão) e ter a sex (B): entrada + 9h30. Sexta (A/Padrão) e sábado (B): entrada + 9h. Com 1h de almoço dá 42h.
var VIGENCIA = "16/12/2026";
var SETORES_DIVIDEM = ["atendimento de kits", "bipagem", "agendamento", "cadastro de peças", "cadastro de revendedoras"];
var EQUIPES = {
  A:{nome:"Equipe A", dias:[1,2,3,4,5], folga:"Sáb e dom", cor:"#60A5FA", curto:5},
  B:{nome:"Equipe B", dias:[2,3,4,5,6], folga:"Dom e seg", cor:"#F59E0B", curto:6},
  C:{nome:"Equipe C", dias:[3,4,5,6,0], folga:"Seg e ter", cor:"#A855F7", curto:0},
  P:{nome:"Padrão", dias:[1,2,3,4,5], folga:"Sáb e dom", cor:"#94A3B8", curto:5}};
var DIAS = [[1,"Seg"],[2,"Ter"],[3,"Qua"],[4,"Qui"],[5,"Sex"],[6,"Sáb"],[0,"Dom"]];

var hm = function(min){ var m = ((min%1440)+1440)%1440; return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0"); };
var minDe = function(t){ var m = /^(\d{1,2}):(\d{2})$/.exec(String(t||"")); return m ? Number(m[1])*60+Number(m[2]) : null; };

// saída do dia longo e do dia curto a partir da entrada da pessoa
function horario42(entrada){
  var ini = minDe(entrada); if(ini===null) ini = 8*60;
  return {ini:hm(ini), fim:hm(ini+9*60+30), fimCurto:hm(ini+9*60)};
}
var divide = function(setor){ return SETORES_DIVIDEM.indexOf(String(setor||"").toLowerCase())>=0; };

// equipe de cada colaborador ativo: o que o RH marcou vale; senão, setor que se divide alterna A/B por ordem de nome, o resto é Padrão
function equipesDe(rh, colabs){
  var marc = rh.escala42 || {}, r = {}, porSetor = {};
  colabs.filter(function(c){ return c.status!=="DESLIGADO"; }).sort(function(a, b){ return a.nome.localeCompare(b.nome, "pt-BR"); }).forEach(function(c){
    if(marc[c.id]){ r[c.id] = marc[c.id]; return; }
    if(!divide(c.setor)){ r[c.id] = "P"; return; }
    var n = porSetor[c.setor] = (porSetor[c.setor]||0)+1; r[c.id] = n%2 ? "A" : "B"; });
  return r;
}
// quantas pessoas trabalham em cada dia (1 a 6) numa lista de colaboradores
function coberturaDe(lista, eq){
  var r = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0};
  lista.forEach(function(c){ EQUIPES[eq[c.id]||"P"].dias.forEach(function(d){ r[d]++; }); });
  return r;
}
// mensagem de texto (WhatsApp) com quem está em cada equipe, por setor
function textoEscala42(colabs, eq){
  var ativos = colabs.filter(function(c){ return c.status!=="DESLIGADO"; }), setores = [];
  ativos.forEach(function(c){ if(setores.indexOf(c.setor)<0) setores.push(c.setor); });
  var l = ["*Escala nova (fim da 6x1) · a partir de "+VIGENCIA+"*", "", "*Equipe A:* seg a qui 8h às 17h30, sex 8h às 17h. Folga sáb e dom.", "*Equipe B:* ter a sex 8h às 17h30, sáb 8h às 17h. Folga dom e seg.", "*Equipe C:* qua a sáb 8h às 17h30, dom 8h às 17h. Folga seg e ter.", "*Padrão:* igual à Equipe A.", ""];
  setores.sort(function(a, b){ return a.localeCompare(b, "pt-BR"); }).forEach(function(st){
    var dele = ativos.filter(function(c){ return c.setor===st; }), nomes = function(k){ return dele.filter(function(c){ return eq[c.id]===k; }).map(function(c){ return c.nome.split(" ")[0]; }).join(", "); };
    var a = nomes("A"), b = nomes("B"), c = nomes("C"), p = nomes("P");
    l.push("*"+st+"*"); if(a) l.push("A: "+a); if(b) l.push("B: "+b); if(c) l.push("C: "+c); if(p) l.push("Padrão: "+p); l.push("");
  });
  return l.join("\n").trim();
}

export { VIGENCIA, SETORES_DIVIDEM, EQUIPES, DIAS, horario42, divide, equipesDe, coberturaDe, textoEscala42 };
