// Sorelly Admin · montagem — domain/direcionar-pix.js
// Financeiro → Contas → Pagamentos → "Direcionar" (23/10/2026). O Lucas recebe os PEDIDOS DE CONTA do Pix: os de DENTRO da Sorelly (atendimento interno; nunca têm conta fixa, sempre se define) e os das
// REPRESENTANTES (chegam do app). Cada pedido pode ser dividido em vários destinos. O sistema SUGERE com o motivo escrito; o Lucas CONFIRMA SEMPRE (até o sistema ficar bem feito, decisão do Marcus).
// Regras em lista, na ordem de prioridade, com liga/desliga (s.dp.regras); texto em REGRAS-DE-PIX.md. Estado s.dp = {v, pix:[...], regras:[...]}.
// DADOS DE TESTE: os pedidos internos vieram das mensagens que as atendentes mandaram ao Marcus em 23/10/2026 (sem CPF nem chave Pix).
var r2 = function(n){ return Math.round((n||0)*100)/100; };
var uid = function(p){ return p+Date.now().toString(36)+Math.floor(Math.random()*46656).toString(36); };

var REGRAS0 = [
  {id:"r1", n:1, se:"Venda no link ou no cartão (CNPJ definido)", entao:"Pix vai para o mesmo CNPJ do link", ativa:true},
  {id:"r2", n:2, se:"Pix de dentro da Sorelly (atendimento interno)", entao:"Sem conta fixa: o Lucas escolhe; o sistema só ajuda", ativa:true},
  {id:"r3", n:3, se:"Pix de representante, com meta de Pix direto aberta em outra representante", entao:"Direciona para a outra representante, nunca para ela mesma", ativa:true},
  {id:"r4", n:4, se:"Valor acima de R$ 3.000", entao:"Pontual ou Point", ativa:true},
  {id:"r5", n:5, se:"Cartão Getnet na empresa e Pix acima de R$ 750", entao:"Pontual", ativa:true},
  {id:"r6", n:6, se:"Valor abaixo de R$ 750", entao:"Prestadores menores (Higor, Camilly)", ativa:true},
  {id:"r7", n:7, se:"Todo o resto", entao:"CNPJ mais perto do limite do cheque especial, com mais contas para pagar hoje e amanhã", ativa:true},
  {id:"r8", n:8, se:"Qualquer valor (inclusive abaixo de R$ 500)", entao:"A sugestão é sempre UMA conta só, com o valor inteiro (a conta que mais receberia na sugestão). Dividir em mais de uma conta é escolha do Lucas, nunca da sugestão", ativa:true}];

// partes (opcional): como ela vai pagar o que falta, por forma: [{forma:"maquininha"|"link"|"pix", valor}] (soma = valor). Sem partes vale uma parte só, a forma do pedido.
// pagos: o que a revendedora já pagou por outras formas {forma:"dinheiro"|"link"|"getnet"|"credito"|"pix", valor, cnpj?, parc?, obs?}; valor = o Pix que falta definir a conta
function dpDemo(){
  var agora = Date.now(), min = function(m){ return agora-m*60000; };
  var it = function(quem, atend, vendas, aPagar, pagos, valor, mAtras, obs){ return {id:uid("p"), origem:"interno", atendente:atend, quem:quem, vendas:vendas, aPagar:aPagar, pagos:pagos, valor:valor, obs:obs||"", recebidoEm:min(mAtras), status:"fila", divisoes:[], forma:"pix"}; };
  var rp = function(quem, maq, valor, mAtras, repOrigem){ return {id:uid("p"), origem:"rep", atendente:"", quem:quem, repOrigem:repOrigem, vendas:0, aPagar:valor, pagos:[], valor:valor, maq:maq, obs:"", recebidoEm:min(mAtras), status:"fila", divisoes:[], forma:"pix"}; };
  return {v:1, regras:JSON.parse(JSON.stringify(REGRAS0)), pix:[
    it("Ingrid Martins dos Santos", "Edna", 1556.00, 1011.40, [{forma:"dinheiro", valor:190}], 821.40, 52),
    it("Bianka dos Santos Sutil", "Kawany", 1838.00, 1102.80, [], 1102.80, 47),
    it("Emanoelle Nicolle Dias", "Kawany", 2272.00, 1363.20, [{forma:"link", valor:648, cnpj:"59"}, {forma:"link", valor:144, cnpj:"59"}, {forma:"link", valor:164, cnpj:"59"}], 407.20, 41),
    it("Maria Eduarda Peres Pedroso", "Edna", 1326.00, 795.60, [], 795.60, 38),
    it("Cristiane do Rocio Skora", "Sthefany", 716.00, 501.20, [{forma:"credito", valor:301.20, parc:4}], 200.00, 33),
    it("Jean Soares da Costa", "Kawany", 1817.00, 1090.20, [{forma:"dinheiro", valor:270}], 820.20, 29),
    it("Tatiane Cristina Pinati", "Kawany", 2270.00, 1362.00, [{forma:"getnet", valor:112}], 1250.00, 24),
    it("Josiele Azevedo Trindade", "Kawany", 252.00, 252.00, [{forma:"dinheiro", valor:110}], 142.00, 19, "Não vai renovar o kit: está fraco e ela não quer peças paradas em casa."),
    it("Jhenifer Vitória de Morais Jacob", "Sthefany", 1714.00, 1028.00, [{forma:"link", valor:468, cnpj:"59"}, {forma:"credito", valor:360.40, parc:2}], 200.00, 12, "Vai pausar as vendas deste mês (mudança de estúdio) e volta no mês que vem."),
    Object.assign(it("Ana Paula Ribeiro Lima", "Edna", 6200.00, 3720.00, [{forma:"link", valor:700, cnpj:"59"}, {forma:"link", valor:500, cnpj:"59"}, {forma:"link", valor:520, cnpj:"59"}], 2000.00, 58, ""), {partes:[{forma:"pix", valor:800}, {forma:"maquininha", valor:700}, {forma:"maquininha", valor:500}]}),
    Object.assign(it("Karina Moraes Duarte", "Kawany", 4100.00, 2460.00, [{forma:"dinheiro", valor:300}], 2160.00, 8, "Vai pagar por link de pagamento."), {forma:"link"}),
    rp("Representante Thalita", "maquininha do CNPJ 46", 3700.00, 18, "Thalita"),
    rp("Representante Marciane", "maquininha do CNPJ 34", 1900.00, 9, "Marciane"),
    rp("Representante Nagela", "maquininha do CNPJ 59", 533.75, 5, "Nagela")]};
}

// ── contexto por CNPJ (contas a pagar de hoje/amanhã/atrasadas + disponível) montado pela tela
// Conta fixa a partir da maquininha ou do link (Marcus, 03/11/2026: "você já tem as maquininhas, aplique alguma regra; amanhã o Lucas verifica"). Quem já tem conta marcada não muda.
// Marca extra.auto (veio do sistema) até o Lucas conferir. Quem não tem maquininha nem link fica sem conta fixa: o pedido pergunta à empresa.
function dpAplicarMaquininhas(s){
  var dp = JSON.parse(JSON.stringify(s.dp || dpDemo())), cp = s.cp, lp = s.lp, n = 0;
  dp.contasRep = dp.contasRep || {}; dp.contasRepExtra = dp.contasRepExtra || {};
  if(!cp || !lp) return {dp:dp, n:0};
  var nn = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); }, mesma = function(a, b){ a = nn(a); b = nn(b); return a===b || a.indexOf(b+" ")===0 || b.indexOf(a+" ")===0; };
  (lp.vinculos||[]).forEach(function(v){
    var rep = String(v.representante||"").replace(/^Representante\s+/i, "").trim(); if(!rep) return;
    if(Object.keys(dp.contasRep).some(function(k){ return mesma(k, rep); })) return;
    var m = (lp.meios||[]).find(function(x){ return x.id===v.maquininhaId || x.id===v.linkId; }), q = m ? String(m.cnpjId||"").match(/(34|46|59|67)/) : null; if(!q) return;
    var d = cp.destinos.find(function(x){ return x.ativo && x.nome.indexOf("CNPJ "+q[1])===0; }); if(!d) return;
    dp.contasRep[rep] = d.id; dp.contasRepExtra[rep] = {auto:true, de:(m.nome||"Maquininha")+" · CNPJ "+q[1]}; n++; });
  dp.maqV = 1;
  return {dp:dp, n:n};
}
// ── sugestão: devolve {opcoes:[{destinoId, nome, motivo, valor}], regras:[{n, texto, estado:"usada"|"nao_se_aplica"|"info"}], semContaFixa}
// Regras editáveis do Pix (s.px.regras, tela Pagamentos → Regras e contas): casam pelo que a venda já pagou (dinheiro, link, cartão) e pelo valor do Pix. Marcus, 02/11/2026.
function cenarioPix(pix){
  var pg = pix.pagos||[], soma = function(fn){ return r2(pg.filter(fn).reduce(function(t, p){ return t+(p.valor||0); }, 0)); };
  var din = soma(function(p){ return p.forma==="dinheiro"; }), link = soma(function(p){ return p.forma==="link"; }), cartao = soma(function(p){ return p.forma==="getnet" || p.forma==="credito" || p.forma==="debito" || p.forma==="maquininha"; });
  return {din:din, pix:pix.valor||0, total:r2(din+link+cartao+(pix.valor||0)), comLink:link>0 || cartao>0};
}
function regraPixCasa(r, c){
  var q = r.quando||{}, tem = function(k){ return q[k]!==undefined && q[k]!==null && q[k]!==""; };
  if(q.comLink && !c.comLink) return false;
  if(tem("pixMin") && !(c.pix>=Number(q.pixMin))) return false;
  if(tem("pixMax") && !(c.pix<Number(q.pixMax))) return false;
  if(tem("dinheiroPctMin") && !(c.total>0 && c.din/c.total*100>=Number(q.dinheiroPctMin)-0.0001)) return false;
  if(tem("totalMin") && !(c.total>=Number(q.totalMin))) return false;
  return tem("pixMin") || tem("pixMax") || tem("dinheiroPctMin") || tem("totalMin");
}
function sugerir(pix, ctx){
  var cp = ctx.cp, regras = (ctx.regras || []).filter(function(r){ return r.ativa; }), resumo = [], opcoes = [], usada = null;
  var dest = function(nome){ return cp.destinos.find(function(d){ return d.ativo && d.nome.indexOf(nome)===0; }); };
  var porTipo = function(t){ return cp.destinos.filter(function(d){ return d.ativo && d.tipo===t; }); };
  var link = (pix.pagos||[]).filter(function(p){ return (p.forma==="link") && p.cnpj; })[0], temGetnet = (pix.pagos||[]).some(function(p){ return p.forma==="getnet"; });
  var urg = (ctx.cnpjs || []).slice().sort(function(a, b){ return ((b.hoje+b.amanha)-b.disp) - ((a.hoje+a.amanha)-a.disp); });
  var add = function(d, motivo, valor, n){ if(!d || opcoes.some(function(o){ return o.destinoId===d.id; })) return; opcoes.push({destinoId:d.id, nome:d.nome, motivo:motivo, valor:valor==null ? pix.valor : r2(valor), regra:n}); };
  // conta fixa da representante (24/10/2026): a que o Lucas marcou; sem marca, o CNPJ da maquininha ou do link dela. Valor fora do normal NÃO usa conta fixa: sobe para o Lucas definir.
  var limite = ctx.limiteAlto || 7000, alto = pix.valor>=limite;
  var normN = function(x){ return String(x||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); };
  var ex = ctx.regrasPx||[], cen = cenarioPix(pix);
  for(var ix=0; ix<ex.length; ix++){
    var rx = ex[ix]; if(rx.ativa===false || !regraPixCasa(rx, cen)) continue;
    if(rx.acao==="perguntar"){
      resumo.push({n:20, texto:"Regra do Pix: "+rx.nome+". Perguntar à empresa antes de definir a conta.", estado:"usada"});
      return {opcoes:[], regras:resumo, semContaFixa:pix.origem==="interno", alto:alto, perguntar:true, motivoPergunta:rx.nome};
    }
    if(rx.destino){   // conta da regra: acha o destino cujo nome tem as palavras da conta (ex.: "PIX - ITAÚ PJ - MARCO")
      var pal = normN(rx.destino).replace(/^pix\s*-\s*/, "").split(/[^a-z0-9]+/).filter(function(w){ return w.length>=2; }), dx = cp.destinos.find(function(d){ var nn = normN(d.nome); return d.ativo && pal.length && pal.every(function(w){ return nn.indexOf(w)>=0; }); });
      if(dx){ add(dx, "Regra do Pix: "+rx.nome+".", null, 21); resumo.push({n:21, texto:"Regra do Pix: "+rx.nome, estado:"usada"}); break; }
      resumo.push({n:21, texto:"Regra do Pix: "+rx.nome+" manda para "+rx.destino+" (sem destino igual cadastrado)", estado:"info"}); break;
    }
  }
  if(pix.origem==="rep"){
    if(alto) resumo.push({n:13, texto:"Valor fora do normal (R$ "+limite.toLocaleString("pt-BR")+" ou mais): o Lucas define a conta", estado:"info"});
    else {
      // "Thalita" (pedido) e "Thalita Torazzi" (Link de pagamento) são a mesma pessoa: o nome curto casa com o começo do completo
      var nm = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); }, mesma = function(a, b){ a = nm(a); b = nm(b); return a===b || a.indexOf(b+" ")===0 || b.indexOf(a+" ")===0; };
      var chaveFixa = Object.keys(ctx.contasRep||{}).filter(function(k){ return mesma(k, pix.repOrigem); })[0];
      var fixa = chaveFixa ? ctx.contasRep[chaveFixa] : "", d0 = fixa ? cp.destinos.find(function(d){ return d.id===fixa && d.ativo; }) : null;
      var xt = (ctx.contasRepExtra||{})[chaveFixa] || {}, hoje0 = new Date().toISOString().slice(0, 10);
      if(d0 && xt.ate && xt.ate<hoje0){ d0 = null; resumo.push({n:11, texto:"Conta fixa de "+pix.repOrigem+" venceu em "+xt.ate.split("-").reverse().join("/"), estado:"info"}); }
      else if(d0 && xt.limite>0 && pix.valor>xt.limite){ d0 = null; resumo.push({n:11, texto:"Pix acima do limite da conta fixa de "+pix.repOrigem+" ("+brl(xt.limite)+")", estado:"info"}); }
      if(d0){ add(d0, "Conta fixa de "+pix.repOrigem+", marcada pelo Lucas.", null, 11); resumo.push({n:11, texto:"Conta fixa de "+pix.repOrigem, estado:"usada"}); }
      else { var cn = ctx.cnpjDaRep ? ctx.cnpjDaRep(pix.repOrigem) : ""; var dc0 = cn ? dest("CNPJ "+cn) : null;
        if(dc0){ add(dc0, "A maquininha ou o link de "+pix.repOrigem+" é do CNPJ "+cn+".", null, 12); resumo.push({n:12, texto:"Maquininha ou link de "+pix.repOrigem+": CNPJ "+cn, estado:"usada"}); } }
    }
  }
  regras.forEach(function(r){
    var antes = opcoes.length, estado = "nao_se_aplica", txt = r.se;
    if(r.n===1 && link){ var dc = dest("CNPJ "+link.cnpj); add(dc, "A venda foi paga no link do CNPJ "+link.cnpj+": o Pix vai para o mesmo CNPJ.", null, 1); estado = "usada"; }
    else if(r.n===2 && pix.origem==="interno"){ estado = "info"; txt = "Pix de dentro da Sorelly: não tem conta fixa, o Lucas escolhe"; }
    else if(r.n===3 && pix.origem==="rep"){
      var abertas = (cp.orientacoes||[]).filter(function(o){ var d = cp.destinos.find(function(x){ return x.id===o.destinoId; }); return o.status==="aberta" && d && d.tipo==="REPRESENTANTE" && d.nome!==pix.repOrigem; });
      var rest = pix.valor; abertas.forEach(function(o){ var d = cp.destinos.find(function(x){ return x.id===o.destinoId; }), falta = r2(o.valor-(o.lanc||[]).reduce(function(t, l){ return t+l.valor; }, 0)); if(rest>0.004 && falta>0){ var v = Math.min(rest, falta); add(d, "Meta de Pix direto aberta: faltam "+brl(falta)+" para "+d.nome+" (ela não recebe o próprio Pix).", v, 3); rest = r2(rest-v); } });
      if(opcoes.length>antes) estado = "usada";
    }
    else if(r.n===4 && pix.valor>3000){ add(dest("Pontual"), "Pix acima de R$ 3.000 vai para Pontual ou Point."+detPontual(pix, ctx.pontual), null, 4); add(dest("Point"), "Alternativa para Pix acima de R$ 3.000.", null, 4); if(opcoes.length>antes) estado = "usada"; }
    else if(r.n===5 && temGetnet && pix.valor>750){ add(dest("Pontual"), "Cartão Getnet na empresa e Pix acima de R$ 750: mesmo fornecedor da maquininha."+detPontual(pix, ctx.pontual), null, 5); if(opcoes.length>antes) estado = "usada"; }
    else if(r.n===6 && pix.valor<750){ porTipo("PRESTADOR").forEach(function(d){ add(d, "Pix abaixo de R$ 750: prestador menor.", null, 6); }); if(opcoes.length>antes) estado = "usada"; }
    else if(r.n===7 && urg.length){ var c = urg[0], d7 = dest("CNPJ "+c.id); var fr = function(x){ return "CNPJ "+x.id+": "+((x.hoje+x.amanha)>0 ? "vencem "+brl(x.hoje+x.amanha)+" hoje e amanhã" : "nada vence hoje e amanhã")+"; disponível "+(x.disp<0 ? "−"+brl(-x.disp) : brl(x.disp))+"."; };
      add(d7, fr(c), null, 7); if(urg[1]) add(dest("CNPJ "+urg[1].id), fr(urg[1]), null, 7); if(opcoes.length>antes) estado = "usada"; }
    resumo.push({n:r.n, texto:txt, estado:estado});
  });
  return {opcoes:opcoes.slice(0, 4), regras:resumo, semContaFixa:pix.origem==="interno", alto:alto};
}
// Pontual: o Pix quita a parcela aberta mais antiga; o que passa vai para a próxima (Marcus, 24/10/2026)
function detPontual(pix, parcelas){
  var rest = pix.valor, partes = []; (parcelas||[]).forEach(function(p){ if(rest>0.004){ var v = Math.min(rest, p.total); partes.push("quita "+p.nome+" ("+brl(v)+")"); rest = r2(rest-v); } });
  return partes.length ? " Na Pontual: "+partes.join(", depois ")+(rest>0.004 ? "; sobram "+brl(rest)+" para a próxima parcela" : "")+"." : "";
}
var brl = function(v){ return "R$ "+(Math.round((v||0)*100)/100).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); };

// ação do reducer: {type:"DP", op, ...}
function dpReduz(s, a){
  var dp = JSON.parse(JSON.stringify(s.dp || dpDemo())), por = a.por || "—", recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg){ return {patch:{dp:dp}, msg:msg}; };
  var pix = function(id){ return dp.pix.find(function(x){ return x.id===id; }); };
  switch(a.op){
    case "divisao": { var p = pix(a.id); if(!p) return recusa("Pix não encontrado."); p.divisoes = (a.divisoes||[]).map(function(d){ return {destinoId:d.destinoId, valor:r2(d.valor), regra:d.regra||0, conta:d.conta||"", via:d.via||"pix"}; }); return ok(); }
    case "confirma": { var p2 = pix(a.id); if(!p2) return recusa("Pix não encontrado."); var soma = r2((p2.divisoes||[]).reduce(function(t, d){ return t+d.valor; }, 0));
      if(!p2.divisoes.length) return recusa("Escolha pelo menos um destino."); if(Math.abs(soma-p2.valor)>0.009) return recusa("A soma dos destinos precisa fechar com "+brl(p2.valor)+"."); p2.status = "direcionado"; p2.confirmadoPor = por; p2.confirmadoEm = Date.now(); return ok("Pix direcionado"); }
    // pedido de conta feito no app da representante (acerto): entra na fila do Direcionar; quando o financeiro confirma, a conta volta para o app (reducer DP)
    case "rep_pedir": { if(!a.pid || !(a.valor>0)) return recusa("Pedido sem valor."); if(dp.pix.some(function(x){ return x.pid===a.pid; })) return ok();
      dp.pix.push({id:uid("p"), origem:"rep", atendente:"", quem:"Representante "+(a.rep||""), repOrigem:a.rep||"", revendedora:a.rev||"", kitId:a.kitId, pid:a.pid, vendas:0, aPagar:a.valor, pagos:[], valor:a.valor, maq:"", obs:a.obs||"", recebidoEm:Date.now(), status:"fila", divisoes:[], forma:a.forma==="link" ? "link" : "pix", comprovante:a.comprovante||null}); return ok(); }
    // vendas, valor a pagar e demais pagamentos do acerto (dinheiro, link, cartão, Pix já direcionado) para o financeiro ver tudo, como no Interno
    case "rep_ctx": { dp.pix.forEach(function(x){ if(x.kitId!==a.kitId || x.origem!=="rep") return; var ctx = a.ctx || {};
        x.vendas = ctx.vendas>0 ? ctx.vendas : 0; x.aPagar = ctx.aPagar>0 ? ctx.aPagar : x.valor;
        x.pagos = (ctx.pagos||[]).filter(function(p){ return p.pid!==x.pid && !dp.pix.some(function(y){ return y.pid && y.pid===p.pid && y.status==="fila"; }); }).map(function(p){ return {forma:p.forma, valor:p.valor, cnpj:p.cnpj||"", parc:p.parc||0, obs:p.obs||""}; }); }); return ok(); }
    case "rep_comp": { dp.pix.forEach(function(x){ if(x.pid===a.pid) x.comprovante = {nome:a.nome}; }); return ok(); }   // a representante pagou na conta e anexou o comprovante
    case "rep_remover": { dp.pix = dp.pix.filter(function(x){ return !(x.pid===a.pid && x.status==="fila"); }); return ok(); }
    case "reabre": { var p3 = pix(a.id); if(!p3) return recusa("Pix não encontrado."); p3.status = "fila"; delete p3.confirmadoPor; delete p3.confirmadoEm; return ok("Pix voltou para a fila"); }
    case "regra": { var r = dp.regras.find(function(x){ return x.id===a.id; }); if(!r) return recusa("Regra não encontrada."); Object.assign(r, a.patch); return ok(); }
    case "fixa": { dp.contasRep = dp.contasRep || {}; dp.contasRepExtra = dp.contasRepExtra || {}; if(a.destinoId) dp.contasRep[a.rep] = a.destinoId; else { delete dp.contasRep[a.rep]; delete dp.contasRepExtra[a.rep]; } return ok(a.destinoId ? "Conta fixa de "+a.rep+" salva" : "Conta fixa de "+a.rep+" solta"); }
    case "aplicar_maq": { var rm = dpAplicarMaquininhas(s); dp.contasRep = rm.dp.contasRep; dp.contasRepExtra = rm.dp.contasRepExtra; dp.maqV = 1; return ok(rm.n ? rm.n+" representante(s) com a conta fixa da maquininha ou do link" : "Nenhuma representante nova para aplicar"); }
    case "fixa_extra": { dp.contasRepExtra = dp.contasRepExtra || {}; var xe = dp.contasRepExtra[a.rep] = Object.assign({}, dp.contasRepExtra[a.rep], a.patch||{}); if(!xe.ate && !(xe.limite>0) && !xe.auto && !xe.conferida) delete dp.contasRepExtra[a.rep]; return ok(); }
    case "limite": { dp.limiteAlto = Math.max(0, Number(a.valor)||0) || 7000; return ok("Valor fora do normal salvo"); }
    case "demo": { dp.pix = dpDemo().pix; return ok("Pedidos de teste recarregados"); }
  }
  return recusa("Ação desconhecida.");
}
export { REGRAS0, dpDemo, dpReduz, sugerir, dpAplicarMaquininhas };
