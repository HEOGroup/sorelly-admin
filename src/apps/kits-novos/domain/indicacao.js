// Sorelly Admin · kits novos Curitiba — domain/indicacao.js
// Indicação da representante para um kit novo: cruza a REGIÃO (cidade e bairro da revendedora) e os HORÁRIOS (janelas dela x dias e períodos da representante).
// Hoje é só sugestão: a Michele escolhe. Os pesos ficam aqui no topo para ajustar com o Marcus (nada de valor fixo dentro de tela).
import { emCurso } from "@/apps/kits-novos/domain/etapas";
import { DIAS, PENDENTES, PERFIS0, REGIOES_EXTRA, PERIODOS, RESPOSTAS, RMC, janDe } from "@/apps/kits-novos/domain/regioes-rep";
import { recusasPorRep, revendedorasPorRep } from "@/apps/kits-novos/lib/bridge-montagem";

var PESO = {bairro:50, cidade:40, inteira:35, prioridade:20, horario:4, horarioMax:40, aberto:6, recusa:8};
var LIMITE_REV = 120;        // acima disso a representante atende pior: o ideal é NÃO mandar kit novo (pode, mas pesa contra na indicação)
var FORTALECER_ATE = 80;     // até aqui a representante é "para fortalecer": ganha pontos na indicação
PESO.acimaDoLimite = 25; PESO.divCarga = 3;   // pontos: −25 se passar de 120; abaixo de 120 ganha (120 − revendedoras) ÷ 3 (60 revendedoras = +20)
var LIMITE_RECUSAS = 2;   // com 2 recusas a representante fica bloqueada para kits novos (mesma regra do app de montagem)

var tokens = function(n){ return String(n||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter(Boolean); };
// "Leticia Moroz" casa com "Leticia Adrielle Moroz": todas as palavras do nome curto estão no nome completo do Agendamento
function casaNome(curto, completo){ var a = tokens(curto), b = tokens(completo); return a.length>0 && a.every(function(t){ return b.indexOf(t)>=0; }); }
function cotaDe(nome, mapa){ var melhor = null; Object.keys(mapa||{}).forEach(function(k){ if(casaNome(nome, k) && (!melhor || tokens(k).length<tokens(melhor).length)) melhor = k; }); return melhor ? mapa[melhor] : null; }
var faixaCarga = function(n){ return n==null ? "" : n>LIMITE_REV ? "evitar" : n<=FORTALECER_ATE ? "fortalecer" : "normal"; };
var norm = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim(); };

// Todas as representantes: as mapeadas (com edição salva em s.perfis por cima do mapa inicial) e as pendentes. p = perfil ou null.
var VAZIO = function(nome){ return {nome:nome, completo:"", cur:[], curTodos:false, rmc:[], rmcTodos:false, pg:false, outras:[], prior:[], obs:"", jan:{}, lim:0, sim:false}; };
// perfil de partida: o mapa de regiões (se houver) + a resposta de dias e horários (se já respondeu)
function perfilBase(nome){
  var x = REGIOES_EXTRA[nome], b = PERFIS0[nome] || (x ? Object.assign(VAZIO(nome), x) : null), r = RESPOSTAS[nome]; if(!b && !r) return null;
  var p = Object.assign({}, b || VAZIO(nome));
  if(r){ p.hor = r.hor; p.jan = janDe(r.hor); p.sim = false; p.resposta = true; if(r.obs) p.obs = r.obs; if(r.lim) p.lim = r.lim; }
  return p;
}
// tem região no mapa (só horário não conta)
var mapeada = function(p){ return !!p && ((p.cur||[]).length>0 || !!p.curTodos || (p.rmc||[]).length>0 || !!p.rmcTodos || !!p.pg || (p.outras||[]).length>0); };
function todasReps(s){
  var salvo = s.perfis || {}, saida = [], vistos = {};
  Object.keys(PERFIS0).forEach(function(n){ var p = salvo[n] || perfilBase(n); vistos[n] = 1; saida.push({nome:n, func:!!p.func, p:p}); });
  PENDENTES.forEach(function(x){ vistos[x.nome] = 1; saida.push({nome:x.nome, func:x.func, p:salvo[x.nome] || perfilBase(x.nome)}); });
  Object.keys(salvo).forEach(function(n){ if(!vistos[n]) saida.push({nome:n, func:!!salvo[n].func, p:salvo[n]}); });
  return saida;
}

// Região que a representante NÃO quer receber kit novo: nao = [{c:cidade, b:[bairros]}]; sem bairro = a cidade inteira (vale também para Curitiba)
function naoAtende(p, cid, bai){
  var cd = norm(cid), b = norm(bai); if(!p || !cd) return false;
  return (p.nao||[]).some(function(x){ return norm(x.c)===cd && (!x.b || !x.b.length || x.b.some(function(y){ return norm(y)===b; })); });
}

// "bairro" = atende aquele bairro · "cidade" = atende a cidade · "inteira" = atende a cidade inteira · null = não atende
function cobre(p, cid, bai){
  var cd = norm(cid), b = norm(bai);
  if(!p || !cd) return null;
  if(cd==="curitiba"){ if((p.cur||[]).some(function(x){ return norm(x)===b; })) return "bairro"; return p.curTodos ? "inteira" : null; }
  var r = (p.rmc||[]).find(function(x){ return norm(x.c)===cd; });
  if(r) return r.b && r.b.length ? (r.b.some(function(x){ return norm(x)===b; }) ? "bairro" : "cidade") : "cidade";
  if(p.rmcTodos && RMC.some(function(x){ return norm(x)===cd; })) return "inteira";
  if(cd==="ponta grossa" && p.pg) return "cidade";
  var o = (p.outras||[]).find(function(x){ return norm(x.c)===cd; });
  if(o) return o.b && o.b.length && o.b.some(function(x){ return norm(x)===b; }) ? "bairro" : "cidade";
  return null;
}

// "seg-m", "seg-t"... em que a pessoa atende (jan = {seg:"mt", ...})
function slotsDe(jan){ var o = []; DIAS.forEach(function(d){ String((jan||{})[d[0]]||"").split("").forEach(function(l){ o.push(d[0]+"-"+l); }); }); return o; }
function rotuloSlot(sl){ var d = sl.split("-"); return DIAS.find(function(x){ return x[0]===d[0]; })[1]+" "+PERIODOS.find(function(x){ return x[0]===d[1]; })[1].toLowerCase(); }

function sugerir(s, rev){
  var rec = recusasPorRep(), mapaRev = revendedorasPorRep(), abertos = {}, slotsRev = slotsDe(rev.jan), lista = [], fora = [];
  s.dados.forEach(function(c){ if(c.rep && emCurso(c)) abertos[c.rep] = (abertos[c.rep]||0)+1; });
  todasReps(s).forEach(function(it){
    if(!it.p) return;
    var nivel = cobre(it.p, rev.cid, rev.bai);
    if(naoAtende(it.p, rev.cid, rev.bai)){ if(nivel) fora.push({nome:it.nome, motivo:"Não quer atender esta região"}); return; }
    if(!nivel) return;
    var slotsRep = slotsDe(it.p.jan), comum = slotsRev.length ? slotsRev.filter(function(x){ return slotsRep.indexOf(x)>=0; }) : null;
    if((rec[it.nome]||0) >= LIMITE_RECUSAS){ fora.push({nome:it.nome, motivo:"Bloqueada por recusas"}); return; }
    if(comum && slotsRep.length && !comum.length){ fora.push({nome:it.nome, motivo:"Sem horário em comum"}); return; }
    var cota = cotaDe(it.nome, mapaRev);
    var prior = nivel!=="inteira" && (it.p.prior||[]).some(function(x){ return norm(x)===norm(rev.bai); });
    var pontos = PESO[nivel] + (prior ? PESO.prioridade : 0) + (comum ? Math.min(PESO.horarioMax, comum.length*PESO.horario) : 0) - (abertos[it.nome]||0)*PESO.aberto - (rec[it.nome]||0)*PESO.recusa + (cota==null ? 0 : cota>LIMITE_REV ? -PESO.acimaDoLimite : Math.round((LIMITE_REV-cota)/PESO.divCarga));
    lista.push({nome:it.nome, nivel:nivel, prior:prior, comum:comum, semHorario:!slotsRep.length, abertos:abertos[it.nome]||0, recusas:rec[it.nome]||0, cota:cota, pontos:pontos});
  });
  lista.sort(function(a, b){ return b.pontos-a.pontos || a.nome.localeCompare(b.nome); });
  return {lista:lista, fora:fora};
}

// Por que esta representante foi sugerida (frases curtas, para a Michele conferir antes de dar o OK)
function motivoSugestao(x, rev){
  var m = [];
  m.push(x.nivel==="bairro" ? "atende o bairro"+(rev && rev.bai ? " "+rev.bai : "") : x.nivel==="inteira" ? "atende "+(rev && rev.cid ? rev.cid : "a cidade")+" inteira" : "atende a cidade"+(rev && rev.cid ? " "+rev.cid : ""));
  if(x.prior) m.push("é prioridade neste bairro");
  if(x.comum && x.comum.length) m.push(x.comum.length+(x.comum.length===1 ? " horário em comum" : " horários em comum")+" ("+x.comum.slice(0, 2).map(rotuloSlot).join(", ")+(x.comum.length>2 ? "…" : "")+")");
  else if(x.semHorario) m.push("ainda sem horário informado");
  if(x.cota!=null) m.push(x.cota>LIMITE_REV ? "já tem "+x.cota+" revendedoras (acima de "+LIMITE_REV+")" : x.cota<=FORTALECER_ATE ? "tem só "+x.cota+" revendedoras (fortalecer)" : "tem "+x.cota+" revendedoras");
  m.push(x.abertos ? x.abertos+(x.abertos===1 ? " kit em aberto" : " kits em aberto") : "nenhum kit em aberto");
  if(x.recusas) m.push(x.recusas+(x.recusas===1 ? " recusa" : " recusas"));
  return m.join(" · ");
}

// Cobertura: para cada bairro de Curitiba e cada cidade, quais representantes atendem. 1 pessoa = alerta; 3 ou mais = rodízio.
function cobertura(s){
  var m = {};
  var add = function(grupo, regiao, nome){ var k = grupo+"|"+regiao; var r = m[k] || (m[k] = {grupo:grupo, regiao:regiao, reps:[]}); if(r.reps.indexOf(nome)<0) r.reps.push(nome); };
  var reps = todasReps(s).filter(function(x){ return x.p; });
  reps.forEach(function(it){
    var p = it.p;
    var recusa = function(c, b){ return naoAtende(p, c, b); };
    (p.cur||[]).forEach(function(b){ if(!recusa("Curitiba", b)) add("Curitiba", b, it.nome); });
    (p.rmc||[]).forEach(function(x){ if(!recusa(x.c, "")) add("Região metropolitana", x.c, it.nome); });
    if(p.pg) add("Outras cidades", "Ponta Grossa", it.nome);
    (p.outras||[]).forEach(function(x){ add("Outras cidades", x.c, it.nome); });
  });
  // quem atende a cidade inteira cobre também os bairros/cidades que os outros citaram
  reps.forEach(function(it){ var p = it.p;
    if(p.curTodos) Object.keys(m).forEach(function(k){ if(m[k].grupo==="Curitiba") add("Curitiba", m[k].regiao, it.nome); });
    if(p.rmcTodos) Object.keys(m).forEach(function(k){ if(m[k].grupo==="Região metropolitana") add("Região metropolitana", m[k].regiao, it.nome); });
  });
  return Object.keys(m).map(function(k){ var r = m[k]; r.reps.sort(); r.n = r.reps.length; r.situacao = r.n===1 ? "unica" : r.n>=3 ? "rodizio" : "ok"; return r; })
    .sort(function(a, b){ return a.n-b.n || a.grupo.localeCompare(b.grupo) || a.regiao.localeCompare(b.regiao); });
}

// Quantas representantes atendem em cada dia e período (mapa de calor dos horários)
function calor(s){
  var o = {}, max = 0;
  todasReps(s).forEach(function(it){ if(it.p) slotsDe(it.p.jan).forEach(function(sl){ o[sl] = (o[sl]||0)+1; if(o[sl]>max) max = o[sl]; }); });
  return {n:o, max:max};
}

// Texto <-> lista (campos de edição)
function listaDeTexto(t){ return String(t||"").split(/[,;\n]/).map(function(x){ return x.trim(); }).filter(Boolean); }
function textoDeLista(a){ return (a||[]).join(", "); }
// Cidades com bairros, uma por linha: "São José dos Pinhais: Pedro Moro, Iná"
function cidadesDeTexto(t){ return String(t||"").split("\n").map(function(l){ return l.trim(); }).filter(Boolean).map(function(l){ var i = l.indexOf(":"); return i<0 ? {c:l, b:[]} : {c:l.slice(0, i).trim(), b:listaDeTexto(l.slice(i+1))}; }); }
function textoDeCidades(a){ return (a||[]).map(function(x){ return x.b && x.b.length ? x.c+": "+x.b.join(", ") : x.c; }).join("\n"); }

export { PESO, motivoSugestao, naoAtende, mapeada, LIMITE_REV, FORTALECER_ATE, casaNome, cotaDe, faixaCarga, norm, todasReps, cobre, slotsDe, rotuloSlot, sugerir, cobertura, calor, listaDeTexto, textoDeLista, cidadesDeTexto, textoDeCidades };
