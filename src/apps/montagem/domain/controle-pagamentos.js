// Sorelly Admin · montagem — domain/controle-pagamentos.js
// Controle de pagamentos (Financeiro, primeira aba): para onde vai o Pix das revendedoras. O Financeiro (Nayale) cria ORIENTAÇÕES ("direcionar R$ X para tal conta até tal data"),
// o sistema acompanha quanto falta e SUGERE o destino de cada Pix que chega; quem direciona (Lucas) confirma ou troca. Contexto completo em FLUXO-DE-PAGAMENTOS.md.
// Estado s.cp. Chaves Pix e contas ficam só no navegador (o repositório é público).

var TIPOS_DESTINO = {CNPJ:["Conta da empresa","#3B82F6"], FAMILIA:["Família / sócio","#EC4899"], FORNECEDOR:["Fornecedor","#F59E0B"], REPRESENTANTE:["Representante","#8B5CF6"], PRESTADOR:["Prestador / funcionário","#14B8A6"]};
var r2 = function(n){ return Math.round((n||0)*100)/100; };
var hojeIso = function(){ var d = new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
var uid = function(p){ return p+Date.now().toString(36)+Math.floor(Math.random()*46656).toString(36); };

function cpDemo(){
  var d = function(nome, tipo, extra){ return Object.assign({id:uid("d"), nome:nome, tipo:tipo, cnpjId:"", banco:"", chavePix:"", obs:"", ativo:true}, extra||{}); };
  return {v:1, orientacoes:[], destinos:[
    d("CNPJ 34 · Sorelly Atacadista", "CNPJ", {cnpjId:"34"}), d("CNPJ 46 · Mayz Comércio de Moda", "CNPJ", {cnpjId:"46"}), d("CNPJ 59 · Serenity", "CNPJ", {cnpjId:"59"}), d("CNPJ 67 · Axis", "CNPJ", {cnpjId:"67"}),
    d("Marcus PF", "FAMILIA"), d("Pontual", "FORNECEDOR"), d("Point", "FORNECEDOR"), d("Office Graf", "FORNECEDOR"), d("Ellos Galvânica", "FORNECEDOR"), d("Mega Sul", "FORNECEDOR"), d("Art Ello Bruto", "FORNECEDOR"),
    d("Devmaster", "FORNECEDOR"), d("Linda", "FORNECEDOR"), d("Tucano", "FORNECEDOR"), d("Charme", "FORNECEDOR"), d("Higor (segurança)", "PRESTADOR"), d("Camilly", "PRESTADOR")]};
}
var direcionado = function(o){ return r2((o.lanc||[]).reduce(function(t, x){ return t+x.valor; }, 0)); };
var faltaDe = function(o){ return r2(Math.max(0, o.valor-direcionado(o))); };
// sugestão para um Pix que chegou: primeiro o que está atrasado, depois a data mais próxima, depois o maior valor em aberto
function sugestoes(cp, hoje){
  var h = hoje || hojeIso();
  return cp.orientacoes.filter(function(o){ return o.status==="aberta" && faltaDe(o)>0; }).map(function(o){ return {o:o, falta:faltaDe(o), atrasada:!!(o.ate && o.ate<h)}; })
    .sort(function(a, b){ return (b.atrasada?1:0)-(a.atrasada?1:0) || (a.o.ate||"9999").localeCompare(b.o.ate||"9999") || b.falta-a.falta; });
}

// devolve {patch, msg}; patch vazio + msg = recusado
function cpReduz(s, a){
  var cp = JSON.parse(JSON.stringify(s.cp)), por = a.por||"—", recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg){ return {patch:{cp:cp}, msg:msg}; };
  var orient = function(id){ return cp.orientacoes.find(function(o){ return o.id===id; }); };
  switch(a.op){
    case "destino_add": { var nm = String(a.nome||"").trim(); if(!nm || !TIPOS_DESTINO[a.tipo]) return recusa("Informe o nome e o tipo."); cp.destinos.push({id:uid("d"), nome:nm, tipo:a.tipo, cnpjId:a.cnpjId||"", banco:a.banco||"", chavePix:a.chavePix||"", obs:a.obs||"", ativo:true}); return ok("Destino criado"); }
    case "destino_set": { var ds = cp.destinos.find(function(x){ return x.id===a.id; }); if(!ds) return recusa("Destino não encontrado."); Object.assign(ds, a.patch); return ok(); }
    case "destino_del": { if(cp.orientacoes.some(function(o){ return o.destinoId===a.id; })) return recusa("Há orientações para este destino. Desative em vez de excluir."); cp.destinos = cp.destinos.filter(function(x){ return x.id!==a.id; }); return ok("Destino excluído"); }
    case "orient_add": { var v = r2(a.valor); if(!a.destinoId || !(v>0)) return recusa("Escolha o destino e informe o valor."); cp.orientacoes.push({id:uid("o"), destinoId:a.destinoId, valor:v, ate:a.ate||"", obs:String(a.obs||"").trim(), por:por, em:Date.now(), status:"aberta", lanc:[]}); return ok("Orientação criada"); }
    case "orient_set": { var o1 = orient(a.id); if(!o1) return recusa("Orientação não encontrada."); Object.assign(o1, a.patch); if(a.patch.valor!==undefined) o1.valor = r2(o1.valor); return ok(); }
    case "orient_status": { var o2 = orient(a.id); if(!o2) return recusa("Orientação não encontrada."); o2.status = a.status; return ok(a.status==="concluida" ? "Orientação concluída" : a.status==="cancelada" ? "Orientação cancelada" : "Orientação reaberta"); }
    case "orient_del": { cp.orientacoes = cp.orientacoes.filter(function(o){ return o.id!==a.id; }); return ok("Orientação excluída"); }
    case "orient_lanc": { var o3 = orient(a.id), vl = r2(a.valor); if(!o3) return recusa("Orientação não encontrada."); if(!(vl>0)) return recusa("Informe o valor do Pix.");
      o3.lanc.push({id:uid("l"), valor:vl, data:a.data||hojeIso(), origem:String(a.origem||"").trim(), por:por, em:Date.now()}); if(direcionado(o3)>=o3.valor-0.005) o3.status = "concluida"; return ok(o3.status==="concluida" ? "Pix direcionado: orientação concluída" : "Pix direcionado"); }
    case "lanc_del": { var o4 = orient(a.id); if(!o4) return recusa("Orientação não encontrada."); o4.lanc = o4.lanc.filter(function(x){ return x.id!==a.lancId; }); if(o4.status==="concluida" && direcionado(o4)<o4.valor-0.005) o4.status = "aberta"; return ok("Lançamento removido"); }
  }
  return recusa("Ação desconhecida.");
}

export { TIPOS_DESTINO, cpDemo, cpReduz, direcionado, faltaDe, sugestoes, hojeIso as hojeIsoCp };
