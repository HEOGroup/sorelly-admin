// Sorelly Admin · montagem — domain/producao-nomes.js
// NOMES DA PRODUÇÃO PADRONIZADOS PELO RH (Marcus, 16/11/2026: "arruma tudo padronizado e puxa lá do RH"). O nome de quem produziu era texto solto: AMANDA, Helen, crisbele... virava gente diferente na Premiação.
// Agora o nome sai da lista do RH (colaboradoresRh) no formato "Nome Sobrenome" (primeira e última palavra do nome do RH, com inicial maiúscula; se duas pessoas ficarem iguais, vale o nome completo).
// padronizarNome(s, texto): igual a um nome do RH (sem diferenciar maiúscula nem acento) → o nome do RH; a primeira palavra digitada é o primeiro nome de UMA pessoa do RH e as outras estão no nome dela (prefere quem é da Produção) → o nome do RH;
// senão (não está no RH, ou há mais de uma pessoa possível, como "Ana") → só a inicial maiúscula em cada palavra. Não inventa: na dúvida, não troca a pessoa.
import { colaboradoresRh } from "./rh";

var semAcento = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
var PARTICULA = {da:1, de:1, do:1, das:1, dos:1, e:1};
var tokens = function(t){ return semAcento(t).replace(/["'\/]+/g, " ").split(/\s+/).filter(function(w){ return w && !PARTICULA[w]; }); };
// inicial maiúscula em cada palavra (da, de, do... ficam minúsculas)
function titulo(t){
  return String(t||"").trim().replace(/\s+/g, " ").toLowerCase().replace(/(^|[\s"(\/])([a-zà-ÿ])/g, function(m, a, b){ return a+b.toUpperCase(); }).replace(/\s(Da|De|Do|Das|Dos|E)\s/g, function(m){ return m.toLowerCase(); });
}
// pessoas ativas do RH, com nome completo, nome curto (primeira + última palavra) e se são do setor Produção. Cache pelo estado do RH.
var memo = {rh:null, lista:null};
function equipeRh(s){
  if(!s || !s.rh) return [];
  if(memo.rh===s.rh && memo.lista) return memo.lista;
  var ativos = colaboradoresRh(s).filter(function(c){ return c.status!=="DESLIGADO"; }).map(function(c){
    var completo = titulo(c.nome), pal = completo.split(" ");
    return {completo:completo, curto:pal.length>1 ? pal[0]+" "+pal[pal.length-1] : completo, toks:tokens(c.nome), prod:c.setor==="Produção"};
  });
  var conta = {}; ativos.forEach(function(p){ var k = semAcento(p.curto); conta[k] = (conta[k]||0)+1; });
  ativos.forEach(function(p){ if(conta[semAcento(p.curto)]>1) p.curto = p.completo; });   // duas pessoas com o mesmo nome curto: vale o completo
  memo = {rh:s.rh, lista:ativos};
  return ativos;
}
/** Nomes do setor Produção no RH (nome curto), em ordem alfabética: é a lista que o Lançamento oferece. */
function nomesProducaoRh(s){ return equipeRh(s).filter(function(p){ return p.prod; }).map(function(p){ return p.curto; }).sort(function(a, b){ return a.localeCompare(b, "pt-BR"); }); }
/** Nome padronizado pelo RH (ver regra no topo do arquivo). Vazio continua vazio. */
function padronizarNome(s, texto){
  var t = String(texto||"").trim().replace(/\s+/g, " "); if(!t) return "";
  var lista = equipeRh(s), q = tokens(t); if(!q.length) return titulo(t);
  var nt = semAcento(t), iguais = lista.filter(function(p){ return semAcento(p.curto)===nt || semAcento(p.completo)===nt; });
  if(iguais.length===1) return iguais[0].curto;
  // a PRIMEIRA palavra digitada tem que ser o PRIMEIRO nome da pessoa (Natalia não vira Fernanda Natalia); as outras palavras podem estar em qualquer lugar do nome
  var acha = lista.filter(function(p){ return q[0]===p.toks[0] && q.slice(1).every(function(w){ return p.toks.indexOf(w)>=0; }); }), daProd = acha.filter(function(p){ return p.prod; });
  if(daProd.length===1) return daProd[0].curto;
  if(!daProd.length && acha.length===1) return acha[0].curto;
  return titulo(t);
}
/** {nome antigo: nome padronizado} de tudo que está lançado ou cadastrado e muda ao padronizar. Vazio = já está tudo padronizado. */
function mapaPadronizar(s, pr){
  var nomes = {}; Object.keys(pr.lancamentos||{}).forEach(function(d){ (pr.lancamentos[d]||[]).forEach(function(l){ if(l.func) nomes[l.func] = 1; }); });
  (pr.funcionarias||[]).forEach(function(f){ nomes[f.nome] = 1; });
  var mapa = {}; Object.keys(nomes).forEach(function(n){ var novo = padronizarNome(s, n); if(novo && novo!==n) mapa[n] = novo; });
  return mapa;
}
export { padronizarNome, nomesProducaoRh, mapaPadronizar, titulo as tituloNome };
