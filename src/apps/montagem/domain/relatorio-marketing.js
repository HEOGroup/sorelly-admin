// Sorelly Admin · montagem — domain/relatorio-marketing.js
// MARKETING › RELATÓRIO DIÁRIO (17/11/2026, pedido do Marcus): o que o setor fez em cada dia (artes, stories, vídeos...) e quantas foram feitas.
// Estado s.mr = {v, atividades:[{id, nome}], dias:{"AAAA-MM-DD":{data, q:{idDaAtividade:quantidade}, obs, por, em}}}; ação MR.
// Ações: {op:"ativ_set", id?, nome} · {op:"ativ_del", id} · {op:"dia_set", data, q, obs} · {op:"dia_del", data}.
// A lista de atividades começa com quatro nomes e a equipe muda na tela (botão Atividades). Dados reais entram pela tela; nada fixo aqui além dos nomes de partida.
var ATIVIDADES_PADRAO = [{id:"a1", nome:"Artes do dia"}, {id:"a2", nome:"Stories"}, {id:"a3", nome:"Reels e vídeos"}, {id:"a4", nome:"Fotos editadas"}];

var trim = function(v){ return String(v==null ? "" : v).trim(); };
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var agoraSP = function(){ return new Intl.DateTimeFormat("sv-SE", {timeZone:"America/Sao_Paulo", dateStyle:"short", timeStyle:"medium"}).format(new Date()).replace(" ", "T"); };
var ehData = function(d){ return /^\d{4}-\d{2}-\d{2}$/.test(String(d||"")) && !isNaN(new Date(d+"T12:00:00Z").getTime()); };
var qtd = function(v){ var n = Math.floor(Number(v)); return isFinite(n) && n>0 ? Math.min(n, 9999) : 0; };

function mrMigrar(m){
  var o = (m && typeof m==="object") ? clone(m) : {v:1};
  o.v = 1;
  o.atividades = Array.isArray(o.atividades) && o.atividades.length ? o.atividades : clone(ATIVIDADES_PADRAO);
  o.dias = (o.dias && typeof o.dias==="object") ? o.dias : {};
  return o;
}

function mrReduz(s, a){
  var m = clone(mrMigrar(s.mr)), por = a.por || "—", agora = a.agora || agoraSP();
  var recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(t){ return {patch:{mr:m}, msg:t}; };
  if(a.op==="ativ_set"){
    var nome = trim(a.nome); if(!nome) return recusa("Escreva o nome da atividade."); if(nome.length>60) return recusa("O nome passou de 60 letras.");
    if(m.atividades.some(function(x){ return x.id!==a.id && x.nome.toLowerCase()===nome.toLowerCase(); })) return recusa("Já existe uma atividade com esse nome.");
    var ex = a.id && m.atividades.find(function(x){ return x.id===a.id; });
    if(ex) ex.nome = nome; else m.atividades.push({id:"a"+Date.now().toString(36)+Math.floor(Math.random()*1296).toString(36), nome:nome});
    return ok(ex ? "Atividade renomeada" : "Atividade criada");
  }
  if(a.op==="ativ_del"){
    if(m.atividades.length<=1) return recusa("Precisa ficar pelo menos uma atividade.");
    m.atividades = m.atividades.filter(function(x){ return x.id!==a.id; });
    return ok("Atividade tirada da lista");
  }
  if(a.op==="dia_set"){
    if(!ehData(a.data)) return recusa("Escolha a data.");
    var q = {}; m.atividades.forEach(function(x){ var n = qtd((a.q||{})[x.id]); if(n) q[x.id] = n; });
    var antes = m.dias[a.data];
    m.dias[a.data] = {data:a.data, q:q, obs:trim(a.obs).slice(0, 500), por:por, em:agora, criadoPor:antes ? antes.criadoPor || antes.por : por};
    return ok("Relatório do dia salvo");
  }
  if(a.op==="dia_del"){
    if(!m.dias[a.data]) return recusa("Esse dia não tem relatório.");
    delete m.dias[a.data];
    return ok("Relatório do dia apagado");
  }
  return recusa("Ação desconhecida.");
}

// texto do dia para copiar (WhatsApp)
function mrTexto(m, data){
  var o = mrMigrar(m), d = o.dias[data] || {q:{}}, br = data.slice(8, 10)+"/"+data.slice(5, 7)+"/"+data.slice(0, 4), total = 0;
  var linhas = o.atividades.map(function(x){ var n = (d.q||{})[x.id] || 0; total += n; return "• "+x.nome+": *"+n+"*"; });
  return ["*Relatório diário do Marketing · "+br+"*", ""].concat(linhas, ["", "*Total: "+total+"*"], d.obs ? ["", d.obs] : []).join("\n");
}

export { ATIVIDADES_PADRAO, mrMigrar, mrReduz, mrTexto };
