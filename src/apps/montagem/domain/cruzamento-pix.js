// Sorelly Admin · montagem — domain/cruzamento-pix.js
// CRUZAMENTO DO PIX DA DEVMASTER COM O PIX DA FAMÍLIA (Marcus, 21/11/2026): a DevMaster só diz "PIX - MARCUS HESS - PF" (o sócio que recebeu), nunca o prestador nem a conta.
// A Família (módulo ff) sabe a conta de verdade (Truck Plaza, Higor, Nubank...). Esta função liga cada título da DevMaster ao Pix da Família: mesma revendedora (nome parecido),
// mesmo valor, o Pix até 45 dias antes do título e o sócio da forma de pagamento igual ao dono do Pix. Cada Pix casa com UM título só.
// Função pura: não lê banco, não grava nada. Teste: scripts/testar-cruzamento-pix.mjs.
// Resultado: mapa por título {pixId, conta (nome padrão, ex. "Marcus · Truck Plaza"), dono, data, certeza "certo"|"provavel"} e a lista dos Pix da Família que ficaram sem título.
import { nomePropio, junta } from "../lib/nome-conta.js";

var r2 = function(v){ return Math.round((Number(v)||0)*100)/100; };
var sem = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
var LIGA = {de:1, da:1, do:1, dos:1, das:1, e:1};
var palavras = function(t){ return sem(t).replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(function(w){ return w && !LIGA[w]; }); };
var dias = function(a, b){ return Math.round((new Date(a+"T12:00:00Z") - new Date(b+"T12:00:00Z"))/86400000); };

/** Quem recebeu, pelo texto da forma da DevMaster: "PIX - MARCUS HESS - PF" → ["marcus"]. Sem sócio reconhecido devolve null (vale qualquer dono). */
function donosDaForma(forma){
  var t = sem(forma).toUpperCase();
  if(/\bPJ\b/.test(t)) return null;   // conta de empresa (Itaú PJ do Marco): o Pix pode ter caído na conta de qualquer sócio da Família
  if(/ANA BEATRIZ/.test(t)) return ["anabeatriz"];
  if(/ANAMARIA/.test(t)) return ["anamaria", "familia", "marco_ana"];
  if(/MARCUS/.test(t)) return ["marcus"];
  if(/LUCAS/.test(t)) return ["lucas"];
  if(/MARCO/.test(t)) return ["marco", "marco_ana"];
  return null;
}

/** Pix para conta de EMPRESA (Itaú PJ do Marco). Entra no cruzamento só pelo nome (a Família lançou 62 Pix na conta Itaú Black com o mesmo valor), mas nunca aparece como "Sem par". */
function ehEmpresa(forma){ return /\bPJ\b/i.test(sem(forma)); }

/** Nome da conta da Família no padrão das telas (sem "Conta", bolinha no lugar do traço, dono na frente): "Conta Truck Plaza" do Marcus → "Marcus · Truck Plaza"; "Conta Anamaria - Caixa" da casa → "Anamaria · Caixa". */
function rotuloContaFamilia(conta, personas){
  if(!conta) return "";
  var pe = (personas || []).filter(function(p){ return p.id===conta.personaId; })[0], dono = pe && pe.tipo!=="FAMILIAR" ? nomePropio(pe.nome) : "";
  var partes = String(conta.nome || "").replace(/\bConta\b/gi, " ").split(/\s[-–—]\s|\s{2,}/).map(function(x){ return x.replace(/\s+/g, " ").trim(); }).filter(Boolean).map(nomePropio);
  if(dono && partes.length && sem(partes[0])===sem(dono)) partes.shift();   // o dono já vai na frente
  else if(dono && partes.length && sem(partes[0]).indexOf(sem(dono)+" ")===0) partes[0] = partes[0].slice(dono.length+1);
  if(dono && partes.length){ var u = partes.length-1, fim = " "+sem(dono); if(sem(partes[u]).slice(-fim.length)===fim && partes[u].length>fim.length) partes[u] = partes[u].slice(0, partes[u].length-fim.length); }   // "Greicy Anamaria" dentro da Anamaria fica só "Greicy"
  return junta((dono ? [dono] : []).concat(partes));
}

// ---- nomes: a mesma pessoa aparece de jeitos diferentes ("Nathalia Gabriela Bortotti Souza" × "Nathalia Gabriela B Souza"; "Jeiniffer" × "Jeniffer"; "Gagliard" × "Gagliardi") ----
var dist1 = function(a, b){   // true se os dois textos diferem em no máximo UMA letra (trocada, a mais ou a menos)
  if(a===b) return true; var la = a.length, lb = b.length; if(Math.abs(la-lb)>1) return false;
  var i = 0; while(i<la && i<lb && a[i]===b[i]) i++;
  if(la===lb) return a.slice(i+1)===b.slice(i+1) || (a[i]===b[i+1] && a[i+1]===b[i] && a.slice(i+2)===b.slice(i+2));   // uma letra trocada, ou duas vizinhas invertidas
  return la>lb ? a.slice(i+1)===b.slice(i) : b.slice(i+1)===a.slice(i);
};
// 2 = palavra igual; 1 = quase igual (inicial, uma letra diferente, começo da outra); 0 = outra palavra
var palavraIgual = function(a, b){
  if(a===b) return 2;
  if(a.length===1 || b.length===1) return a[0]===b[0] ? 1 : 0;
  if(a.length>=5 && b.length>=5 && dist1(a, b)) return 1;
  if(a.length>=4 && b.length>=4 && Math.abs(a.length-b.length)<=2 && (a.indexOf(b)===0 || b.indexOf(a)===0)) return 1;
  return 0;
};
/** 3 = nome igual (o menor é o começo do maior); 2 = parecido (inicial, letra a mais ou a menos, nome do meio faltando); 1 = só uma palavra; 0 = outra pessoa. */
function nomeCombina(a, b){
  var c = a.length<=b.length ? a : b, g = c===a ? b : a;
  if(!c.length) return 0;
  var exato = true; for(var i = 0; i<c.length; i++){ if(c[i]!==g[i]){ exato = false; break; } }
  if(exato) return c.length>=2 ? 3 : 1;
  if(palavraIgual(c[0], g[0])===0) return 0;   // a primeira palavra precisa combinar
  var pos = 0, ok = 0;
  for(var j = 0; j<c.length; j++){ var achou = false; for(var k = pos; k<g.length; k++){ var v = palavraIgual(c[j], g[k]); if(v===2 || (v===1 && (j===0 || c[j].length===1 || g[k].length===1))){ pos = k+1; achou = true; break; } } if(!achou) return 0; ok++; }   // só o primeiro nome pode ter letra trocada; o resto tem que ser igual (ou uma inicial)
  return c.length>=2 ? 2 : 1;
}

/**
 * titulos: [{rid, rev, d, valor, forma}] (cada título da DevMaster, uma parcela por linha)
 * ff: o módulo Financeiro familiar ({pix, contasBanc, personas})
 * Três passadas, da mais segura para a mais solta; o que casa primeiro não volta:
 *   1) nome igual, sócio igual ao dono do Pix, Pix até 10 dias depois e 45 dias antes do título → "certo" se for o único par dos dois lados
 *   2) nome parecido OU sócio diferente, Pix de 120 dias depois a 90 dias antes (pagamento atrasado: o título tem a data do acerto e o Pix chega depois) → "provável"
 *   4) o MESMO Pix com valor diferente (a funcionária lançou R$ 195 na DevMaster e o Pix na Família é de R$ 210): nome igual ou parecido, sócio igual, até 10 dias de diferença, diferença de até R$ 50 e 20% → "diferença" (mostra quanto)
 *   5) o Pix existe na Família, mas a DevMaster lançou o pagamento em OUTRA forma (Acerto com loja, Compra funcionários...): título que não é Pix, nome igual ou parecido e valor igual → "outra forma" (a DevMaster diz que a revendedora não pagou, ou pagou de outro jeito)
 *   3) sem olhar o nome (quem pagou pode ser outra pessoa): mesmo valor, sócio igual, até 10 dias de diferença, e só se o par for único dos dois lados → "provável"
 */
function cruzarPix(titulos, ff){
  var contas = {}; ((ff && ff.contasBanc) || []).forEach(function(c){ contas[c.id] = c; });
  var personas = (ff && ff.personas) || [];
  var donoDe = function(p){ return (personas.filter(function(x){ return x.id===p.personaId; })[0] || {}).nome || ""; };
  var nomeDaConta = function(p){ return rotuloContaFamilia(contas[p.contaId], personas) || (donoDe(p) ? junta([nomePropio(donoDe(p)), "Conta não informada"]) : "Conta não informada"); };
  var pix = ((ff && ff.pix) || []).filter(function(p){ return Number(p.valor)>0 && p.data && !p.semAcerto; }).map(function(p){ return {p:p, nome:palavras(p.origem), usado:false}; });
  var tits = (titulos || []).filter(function(t){ return t && t.rid && Number(t.valor)>0; }).map(function(t){ return {t:t, nome:palavras(t.rev), donos:donosDaForma(t.forma), pj:ehEmpresa(t.forma), outra:!!(t.grupo && t.grupo!=="Pix"), feito:false}; });   // outra = título que NÃO é Pix na DevMaster (só a 5ª passada olha para eles)
  var socioOk = function(a, b){ return !a.donos || a.donos.indexOf(b.p.personaId)>=0 || (a.donos.indexOf("anabeatriz")>=0 && b.p.personaId==="familia"); };   // a Ana Beatriz às vezes está lançada na conta da casa
  var mapa = {};
  var passada = function(num, regra, valorLivre){
    var pares = [], candA = {}, candB = {};
    tits.forEach(function(a){ if(a.feito || (a.pj && num>=3) || (a.outra!==(num===5))) return; pix.forEach(function(b){ if(b.usado) return;   // título de empresa (PJ) só casa pelo nome
      var difV = r2(a.t.valor-b.p.valor);
      if(valorLivre ? Math.abs(difV)<0.005 || Math.abs(difV)>50 || Math.abs(difV)>0.2*Math.max(a.t.valor, b.p.valor) : Math.abs(difV)>=0.005) return;
      var gap = dias(a.t.d, b.p.data), forca = nomeCombina(a.nome, b.nome), socio = socioOk(a, b);
      var m = regra(gap, forca, socio); if(!m) return;
      pares.push({a:a, b:b, gap:Math.abs(gap), forca:forca, motivo:m, difV:Math.abs(difV), dif:difV});
      candA[a.t.rid] = (candA[a.t.rid] || 0)+1; candB[b.p.id] = (candB[b.p.id] || 0)+1; }); });
    pares.sort(function(x, y){ return (valorLivre ? x.difV-y.difV : 0) || x.gap-y.gap || y.forca-x.forca || String(x.a.t.rid).localeCompare(String(y.a.t.rid)); });
    pares.forEach(function(r){
      if(r.a.feito || r.b.usado) return;
      if(num===3 && (candA[r.a.t.rid]!==1 || candB[r.b.p.id]!==1)) return;   // sem o nome, só vale quando não há dúvida
      r.a.feito = true; r.b.usado = true;
      mapa[r.a.t.rid] = {pixId:r.b.p.id, conta:nomeDaConta(r.b.p), dono:donoDe(r.b.p), data:r.b.p.data, certeza:num===5 ? "outraforma" : valorLivre ? "diferenca" : num===1 && candA[r.a.t.rid]===1 && candB[r.b.p.id]===1 ? "certo" : "provavel", motivo:r.motivo, dif:valorLivre ? r.dif : 0, formaDm:r.a.t.forma || "", valorPix:r2(r.b.p.valor), temComp:!!r.b.p.compKey};
    });
  };
  passada(1, function(gap, forca, socio){ return forca===3 && socio && gap>=-10 && gap<=45 ? "Nome, valor, sócio e data conferem" : ""; });
  passada(2, function(gap, forca, socio){ return forca>=1 && gap>=-120 && gap<=90 ? (!socio ? "Nome e valor conferem, mas o Pix está em outro sócio" : forca<3 ? "Nome parecido, valor e sócio conferem" : "Nome e valor conferem, data distante") : ""; });
  passada(3, function(gap, forca, socio){ return socio && gap>=-10 && gap<=10 ? "Só valor, sócio e data (quem pagou tem outro nome)" : ""; });
  passada(4, function(gap, forca, socio){ return forca>=2 && socio && gap>=-10 && gap<=10 ? "Mesmo Pix com valor diferente" : ""; }, true);
  passada(5, function(gap, forca){ return forca>=2 && gap>=-120 && gap<=90 ? "O Pix está na Família, mas a DevMaster lançou como outra forma" : ""; });
  var semTitulo = pix.filter(function(b){ return !b.usado; }).map(function(b){ return {pixId:b.p.id, data:b.p.data, valor:r2(b.p.valor), rev:b.p.origem || "", conta:nomeDaConta(b.p), dono:donoDe(b.p), temComp:!!b.p.compKey, auditoria:b.p.auditoria || ""}; });
  return {mapa:mapa, semTitulo:semTitulo};
}

export { cruzarPix, ehEmpresa, donosDaForma, rotuloContaFamilia, nomeCombina };
