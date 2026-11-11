// Sorelly Admin · montagem — lib/estado-patch.js (11/11/2026)
// GRAVAÇÃO POR ITEM dos módulos do servidor (sorelly.estado_modulo). Usado pela tela (lib/sync-modulos.js) e pelo servidor (src/server/estado-modulo.js).
//
// Problema que resolve (11/11/2026: PIX de novembro do Financeiro familiar e materiais do Estoque de material sumiram):
// a tela mandava a chave INTEIRA (ex.: ff.pix com 600 PIX) e o servidor trocava o que tinha pelo que chegou. Uma tela que ainda não tinha recebido
// os lançamentos de outra pessoa gravava a cópia antiga por cima e apagava esses lançamentos.
//
// Agora a tela manda só a DIFERENÇA entre o que ela recebeu do servidor (a base) e o que tem agora, e o servidor aplica essa diferença no que está guardado:
//   {$set: valor}                                trocar o valor inteiro (número, texto, lista sem id...)
//   {$o: {chave: op}, $d: [chaves]}              objeto: mexe só nas chaves que mudaram ($d = chaves apagadas de propósito)
//   {$a: {u: [itens], r: [ids], p: [ids]}}       lista de itens com id: u = itens novos ou alterados, r = ids apagados de propósito, p = novos que vão no começo
// Uma tela desatualizada só consegue apagar o que ela mesma viu e tirou; o que ela nunca recebeu continua guardado.

var ehObj = function(v){ return v!==null && typeof v==="object" && !Array.isArray(v); };
var js = function(v){ try { return JSON.stringify(v===undefined ? null : v); } catch(x){ return ""; } };
var idDe = function(x){ return ehObj(x) && (typeof x.id==="string" || typeof x.id==="number") ? x.id : undefined; };
var chaveId = function(id){ return typeof id+":"+id; };

// lista em que todo item é um objeto com id próprio e sem repetir
function ehListaIds(a){
  if(!Array.isArray(a)) return false;
  var vistos = {};
  for(var i = 0; i < a.length; i++){ var id = idDe(a[i]); if(id===undefined) return false; var k = chaveId(id); if(vistos[k]) return false; vistos[k] = 1; }
  return true;
}

// diferença entre base (o que veio do servidor) e atual (o que a tela tem). null = nada mudou.
function diff(base, atual){
  if(js(base)===js(atual)) return null;
  if(ehObj(base) && ehObj(atual)){
    var o = {}, d = [], n = 0;
    Object.keys(atual).forEach(function(k){ if(atual[k]===undefined) return; var op = k in base ? diff(base[k], atual[k]) : {$set:atual[k]}; if(op){ o[k] = op; n++; } });
    Object.keys(base).forEach(function(k){ if(base[k]!==undefined && (!(k in atual) || atual[k]===undefined)){ d.push(k); n++; } });
    if(!n) return null;
    var r = {$o:o}; if(d.length) r.$d = d; return r;
  }
  // lista vazia de um lado: vale como lista de itens se o outro lado for (ex.: primeiro material cadastrado numa lista vazia)
  if(Array.isArray(base) && Array.isArray(atual) && ehListaIds(base) && ehListaIds(atual) && (base.length || atual.length)){
    var antes = {}; base.forEach(function(x){ antes[chaveId(x.id)] = js(x); });
    var agora = {}, u = [], p = [], primeiroVelho = -1;
    atual.forEach(function(x, i){ var k = chaveId(x.id); agora[k] = 1; if(!(k in antes)){ u.push(x); } else { if(primeiroVelho<0) primeiroVelho = i; if(antes[k]!==js(x)) u.push(x); } });
    // novos que estão antes do primeiro item que já existia: a tela põe os mais novos no começo (unshift)
    if(primeiroVelho>0) atual.slice(0, primeiroVelho).forEach(function(x){ if(!(chaveId(x.id) in antes)) p.push(x.id); });
    var r2 = base.filter(function(x){ return !agora[chaveId(x.id)]; }).map(function(x){ return x.id; });
    if(!u.length && !r2.length) return null;   // só mudou a ordem: a ordem do servidor fica
    var a = {u:u}; if(r2.length) a.r = r2; if(p.length) a.p = p; return {$a:a};
  }
  return {$set:atual};
}

// aplica uma diferença no valor guardado. Nunca muda o objeto recebido (devolve outro).
function aplicar(valor, op){
  if(!ehObj(op)) return valor;
  if("$set" in op) return op.$set;
  if(op.$o || op.$d){
    var o = ehObj(valor) ? Object.assign({}, valor) : {};
    Object.keys(op.$o || {}).forEach(function(k){ o[k] = aplicar(o[k], op.$o[k]); });
    (op.$d || []).forEach(function(k){ delete o[k]; });
    return o;
  }
  if(op.$a){
    var lista = Array.isArray(valor) ? valor.slice() : [], a = op.$a, pos = {};
    lista.forEach(function(x, i){ var id = idDe(x); if(id!==undefined && !(chaveId(id) in pos)) pos[chaveId(id)] = i; });
    var frente = {}; (a.p || []).forEach(function(id){ frente[chaveId(id)] = 1; });
    var noComeco = [];
    (a.u || []).forEach(function(x){
      var id = idDe(x); if(id===undefined) return; var k = chaveId(id);
      if(k in pos) lista[pos[k]] = x;
      else if(frente[k]) noComeco.push(x);
      else { pos[k] = lista.length; lista.push(x); }
    });
    if(noComeco.length) lista = noComeco.concat(lista);
    if(a.r && a.r.length){ var tira = {}; a.r.forEach(function(id){ tira[chaveId(id)] = 1; }); lista = lista.filter(function(x){ var id = idDe(x); return id===undefined || !tira[chaveId(id)]; }); }
    return lista;
  }
  return valor;
}

// Gravação de TELA ANTIGA (manda a chave inteira, {chaves:{...}}), até todas as telas serem atualizadas:
// junta sem apagar. Lista de itens com id: os itens que chegaram valem e os que só o servidor tem continuam. Objeto: junta chave a chave.
function juntarSemApagar(guardado, chegou){
  if(ehObj(guardado) && ehObj(chegou)){
    var o = Object.assign({}, guardado);
    Object.keys(chegou).forEach(function(k){ o[k] = k in guardado ? juntarSemApagar(guardado[k], chegou[k]) : chegou[k]; });
    return o;
  }
  if(Array.isArray(guardado) && Array.isArray(chegou) && guardado.length && ehListaIds(guardado) && ehListaIds(chegou)){
    var tem = {}; chegou.forEach(function(x){ tem[chaveId(x.id)] = 1; });
    return chegou.concat(guardado.filter(function(x){ return !tem[chaveId(x.id)]; }));
  }
  return chegou;
}

// contador de ids (seq) nunca volta: uma tela atrasada que grava um seq menor faria o próximo item repetir um id já usado
function seqNuncaVolta(guardado, novo){
  if(typeof guardado==="number" && typeof novo==="number" && novo < guardado) return guardado;
  return novo;
}

export { diff, aplicar, juntarSemApagar, seqNuncaVolta, ehListaIds };
