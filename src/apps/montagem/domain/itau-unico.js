// Itaú: só existe UMA conta (Marcus, 04/11/2026). A antiga "Itaú Black" absorve a "Itaú Marco PJ" (saldos dos dias e a chave Pix) e passa a se chamar "Itaú Marco PJ", no bloco da empresa, com o maior limite das duas.
// Roda sozinha (ação ITAU_UNIR, disparada pelo App.js) quando as duas contas existem; muda o estado de saldosContas e px, que o sistema grava no servidor.
function precisaUnirItau(s){ var cs = (s && s.saldosContas && s.saldosContas.contas) || []; return cs.some(function(c){ return c.id==="itau_black"; }) && cs.some(function(c){ return c.id==="itau_marco_pj"; }); }
function uneItau(s){
  if(!precisaUnirItau(s)) return s;
  var sc = JSON.parse(JSON.stringify(s.saldosContas)), b = sc.contas.find(function(c){ return c.id==="itau_black"; }), m = sc.contas.find(function(c){ return c.id==="itau_marco_pj"; });
  Object.keys(sc.saldos||{}).forEach(function(dia){ var d = sc.saldos[dia]; if(d && d.itau_marco_pj!==undefined){ if(d.itau_black===undefined) d.itau_black = d.itau_marco_pj; delete d.itau_marco_pj; } });
  b.nome = "Itaú Marco PJ"; b.bloco = "ITM"; b.tipo = "PJ"; b.limite = Math.max(b.limite||0, m.limite||0);
  sc.contas = sc.contas.filter(function(c){ return c.id!=="itau_marco_pj"; });
  var out = Object.assign({}, s, {saldosContas:sc});
  if(s.px && s.px.contas){ var px = JSON.parse(JSON.stringify(s.px)), pb = px.contas.find(function(k){ return k.caixaId==="itau_black"; }), pm = px.contas.find(function(k){ return k.caixaId==="itau_marco_pj"; });
    if(pm){ if(!pb) pm.caixaId = "itau_black"; else { if(!pb.chave){ pb.chave = pm.chave; pb.chaveTipo = pm.chaveTipo; pb.chaveEm = pm.chaveEm; pb.chavePor = pm.chavePor; } px.contas = px.contas.filter(function(k){ return k!==pm; }); } }
    out.px = px; }
  return out;
}
export { precisaUnirItau, uneItau };
