// Sorelly Admin · montagem — domain/chat-contatos.js
// Quem aparece no SorellyChat: todos de domain/pessoas.js (funcionários, sócios, PJ) + representantes.
// Cada pessoa vira um contato com id estável. `contatoDoLogin` liga quem entrou no sistema (EQUIPE, id numérico) ao contato.
import { FUNCIONARIOS_POR_SETOR, REPRESENTANTES } from "@/apps/montagem/domain/pessoas";
import { EQUIPE, grupoDe } from "@/apps/montagem/domain/equipe";

var sem = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z ]/g,"").trim(); };
var PARTICULAS = {de:1, da:1, do:1, dos:1, das:1, e:1};
var CORES = ["#1FA855","#128C7E","#34B7F1","#7E57C2","#E91E63","#FF7043","#8D6E63","#00A884","#C2185B","#5C6BC0","#00897B","#F4511E","#6D4C41","#3949AB"];
var APELIDOS = {"Marcus Vinicius Hess de Oliveira":"Marcus Hess", "Anamaria Hess de Oliveira":"Anamaria Hess", "Marco Antonio de Oliveira":"Marco Antonio", "Lucas Oliveira da Rocha":"Lucas Rocha",
  "Ana Beatriz Hess de Oliveira":"Ana Beatriz", "Nickolas Gabriel Leal Neves":"Nickolas Neves", "Castilho":"Lucas Castilho"};
function hash(t){ var h = 7; for(var i=0;i<t.length;i++) h = (h*31 + t.charCodeAt(i)) % 1000003; return h; }
function curto(completo, todos){
  if(APELIDOS[completo]) return APELIDOS[completo];
  var p = completo.split(/\s+/).filter(function(x){ return !PARTICULAS[x.toLowerCase()]; });
  var duas = p.length>1 ? p[0]+" "+p[p.length-1] : p[0];
  var igual = todos.filter(function(c){ return c!==completo && (function(q){ var a = q.split(/\s+/).filter(function(x){ return !PARTICULAS[x.toLowerCase()]; }); return (a.length>1 ? a[0]+" "+a[a.length-1] : a[0])===duas; })(c); }).length;
  return igual && p.length>2 ? p[0]+" "+p[1]+" "+p[p.length-1] : duas;
}
var tudo = [];
FUNCIONARIOS_POR_SETOR.forEach(function(st){ st[1].forEach(function(f){ tudo.push({completo:f[0], setor:st[0], funcao:f[3]||"", tipo:"func"}); }); });
REPRESENTANTES.filter(function(r){ return !r.tambemFunc; }).forEach(function(r){ tudo.push({completo:r.nome, setor:"Representantes", funcao:"Representante", tipo:"rep"}); });
tudo.push({completo:"Castilho", setor:"Marketing", funcao:"Marketing (PJ)", tipo:"func"});   // Lucas Castilho, PJ do Marcus no Marketing (15/10/2026); o id do contato nasce de "Castilho", por isso o nome da lista não muda (só o apelido acima)
var nomesTodos = tudo.map(function(x){ return x.completo; });
var CONTATOS = tudo.map(function(x){
  var id = (x.tipo==="rep" ? "r_" : "f_") + sem(x.completo).replace(/ /g,"");
  return {id:id, nome:curto(x.completo, nomesTodos), completo:x.completo, setor:x.setor, funcao:x.funcao, tipo:x.tipo, cor:CORES[hash(id)%CORES.length]};
});
var CURTO = {"Kits novos e indicação":"Kits Novos", "Equipe direção":"Diretoria", "Sócios e família":"Diretoria", "Montagem de kits":"Montagem", "Atendimento de kits":"Kits e Atendimento", "Cadastro de revendedoras":"Cadastro"};
function setorCurtoDe(c){
  if(c.setor==="PJ · prestadores") return /Desenvolvedor/.test(c.funcao) ? "Tecnologia" : "Marketing";
  if(c.setor==="Sócios e família" && c.funcao==="Família") return "Família";
  return CURTO[c.setor] || c.setor;
}
CONTATOS.forEach(function(c){ c.setorCurto = setorCurtoDe(c); });
var primeiros = {}; CONTATOS.forEach(function(c){ var p = c.completo.split(" ")[0]; primeiros[p] = (primeiros[p]||0)+1; });
CONTATOS.forEach(function(c){ var p = c.completo.split(" ")[0]; c.titulo = (primeiros[p]>1 ? c.nome : p)+" - "+c.setorCurto; });
// nome curto para abas e chips: o primeiro nome; se houver mais de uma pessoa com ele (ex.: Ana Maria), os dois primeiros
var POR_ID = {}; CONTATOS.forEach(function(c){ POR_ID[c.id] = c; });
var ALIAS_LOGIN = {Taynara:"Tainara", Sthefany:"Sthafany", Rakieli:"Rakiely"};
function prefixo(a, b){ var n = 0; while(n<a.length && n<b.length && a[n]===b[n]) n++; return n; }
// id do contato de quem está logado (EQUIPE usa nomes curtos: "Pamela", "Paula Melissa"…)
var cacheLogin = {};
// contato do chat definido na conta (funcionário fora da lista de 43 nomes): o App informa
var CID_CONTA = {};
function definirCidConta(id, cid){ if(id==null || isNaN(id)) return; if(cid) CID_CONTA[id] = cid; else delete CID_CONTA[id]; }
function contatoDoLogin(idLogin){
  if(CID_CONTA[idLogin]) return CID_CONTA[idLogin];
  if(cacheLogin[idLogin]!==undefined) return cacheLogin[idLogin];
  var p = EQUIPE.find(function(x){ return x.id===idLogin; }); var r = null;
  if(p){
    var alvo = sem(ALIAS_LOGIN[p.nome] || p.nome), melhor = 0;
    CONTATOS.forEach(function(c){ if(c.tipo!=="func") return; var n = prefixo(alvo, sem(c.completo)); if(n>melhor && n>=Math.min(alvo.length, 5)){ melhor = n; r = c.id; } });
  }
  cacheLogin[idLogin] = r; return r;
}
// o Configurador do SorellyChat é só do dono (Marcus, login 16)
function ehDono(idLogin){ return idLogin===16; }
// direção pelo contato (Marcus, Nickolas, Lucas, Anamaria e a família): vê todas as conversas paralelas dos grupos
var DIRECAO_NOMES = ["Marcus","Nickolas","Lucas","Anamaria","Marco Antonio","Ana Beatriz"];
function ehDirecaoCid(cid){ return DIRECAO_NOMES.some(function(n){ var c = CONTATOS.find(function(x){ return sem(x.completo).indexOf(sem(n))===0; }); return c && c.id===cid; }); }
function ehDirecao(idLogin){ var g = grupoDe(idLogin); return g==="supervisao" || g==="familia"; }
// quem pode colocar/trocar a foto de qualquer pessoa: Direção e Marketing
function podeEditarFotos(idLogin){ if(ehDirecao(idLogin)) return true; var c = POR_ID[contatoDoLogin(idLogin)]; return !!c && c.setorCurto==="Marketing"; }
// representante do app (nome curto, ex.: "Dayanne") -> contato do chat
function contatoDaRepresentante(nome){ var q = sem(nome); var c = CONTATOS.find(function(x){ return (x.tipo==="rep" || x.setor==="Representante") && sem(x.completo).indexOf(q)===0; }); return c ? c.id : null; }
function rotuloCurto(id){ var c = POR_ID[id]; if(!c) return "?"; var t = c.completo.split(" "); return primeiros[t[0]]>1 && t[1] ? t[0]+" "+t[1] : t[0]; }
// a revendedora do app vira contato do chat (id v_nome) para poder conversar com os setores
function registrarRevendedora(nome){ var idc = "v_"+sem(nome).replace(/ /g,""); if(!POR_ID[idc]){ var c = {id:idc, nome:nome, completo:nome, setor:"Revendedoras", funcao:"Revendedora", tipo:"rev", cor:CORES[hash(idc)%CORES.length], setorCurto:"Revendedora", titulo:nome+" - Revendedora"}; CONTATOS.push(c); POR_ID[idc] = c; } return idc; }
function contato(id){ return POR_ID[id] || {id:id, nome:"Contato", titulo:"Contato", completo:"Contato", setor:"", setorCurto:"", tipo:"func", cor:"#8696A0"}; }
function iniciais(nome){ var p = String(nome||"?").split(/\s+/).filter(Boolean); return ((p[0]||"?")[0] + (p.length>1 ? p[p.length-1][0] : "")).toUpperCase(); }
// presença de demonstração: estável por pessoa; em produção virá do servidor (WebSocket)
function presenca(id){ var h = hash(id); return {online: h%100 < 58, visto: Date.now() - (h%420)*60000}; }
var id = function(parte){ var c = CONTATOS.find(function(x){ return sem(x.completo).indexOf(sem(parte))===0; }); return c ? c.id : null; };
export { definirCidConta, registrarRevendedora, CONTATOS, rotuloCurto, contato, contatoDaRepresentante, contatoDoLogin, ehDirecao, ehDirecaoCid, ehDono, podeEditarFotos, iniciais, presenca, id as idPorNome, hash, sem };
