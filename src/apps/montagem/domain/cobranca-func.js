import { globLocal } from "@/lib/glob-local";
// Sorelly Admin · montagem — domain/cobranca-func.js
// Cobrança de Funcionárias, trazida do SorellyAdmin ("Crédito de Peças"): joias que funcionárias compram a crédito, com desconto, da própria Sorelly. Operada pelo setor de Cobranças (Amanda).
// Lança-se a compra, o desconto sai sozinho; os pagamentos abatem o SALDO DEVEDOR TOTAL; o sistema mostra quem deve, quem quitou, quem está em atraso, as negociações e o relatório mensal.
// Estado s.cf (só neste navegador: dívida de funcionária é dado sensível). Regras de cálculo portadas de apps/backend/src/lib/credito-pecas/regras.ts.

var LIMITE_SALDO = 500;
var ACESSO_COBRANCA_BASE = [16, 28, 29];   // Marcus, Lucas e Anamaria (somados à Amanda de Miranda, que opera a cobrança, em pages/CobrancaFunc.js)
var r2 = function(n){ return Math.round((n||0)*100)/100; };
var p2 = function(n){ return String(n).padStart(2,"0"); };
var hojeIso = function(){ var d = new Date(); return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate()); };
var uid = function(p){ return p+Date.now().toString(36)+Math.floor(Math.random()*46656).toString(36); };
var CONFIG_PADRAO = {descontoAte200:40, desconto200a300:45, desconto300a400:50, descontoAcima400:60, descontoPromocaoPortaJoias:35, descontoPecaLuxo:40, penalidadeAtrasoPct:15,
  pagamentoMinimoAte99:50, pagamentoMinimo100a199:75, pagamentoMinimo200a299:100, pagamentoMinimo300a399:125, pagamentoMinimo400a500:150};

// dados reais (credito_peca_* do admin antigo) só no arquivo local gitignored domain/cobranca-func.local.js; sem ele, nasce vazio
var LOCAL = (function(){ try { var m = globLocal("apps/montagem/domain/cobranca-func.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(x){ return null; } })();
function cfDemo(){
  var cf = {v:1, importV:0, config:Object.assign({}, CONFIG_PADRAO), funcionarias:[], compras:[], pagamentos:[], negociacoes:[]};
  if(LOCAL){ var c = JSON.parse(JSON.stringify(LOCAL)); Object.assign(cf.config, c.config||{}); cf.funcionarias = c.funcionarias||[]; cf.compras = c.compras||[]; cf.pagamentos = c.pagamentos||[]; cf.negociacoes = c.negociacoes||[]; cf.importV = 1; }
  return cf;
}
// estado salvo antes da carga: traz o que veio do arquivo local, sem apagar nada que já foi lançado no sistema novo
// Todo pagamento de funcionária vai para o FINANCEIRO (Controle de pagamentos): vira um pedido igual ao do acerto interno, com a conta (a informada ou a que o financeiro definir).
function lancFinDoPagamento(pag, func, por){
  return {id:"LFF_"+pag.id, origem:"func", cfPagId:pag.id, nome:func ? func.nome : "Funcionária", por:por||"", enviadoTs:Date.now(), etapaComprovantes:true, finalizado:true, conferido:false,
    linhas:[{tipo:"pagamento", forma:"pix", valor:pag.valor, isento:false, enviada:!!pag.conta, auto:pag.conta ? "Conta informada no lançamento" : undefined, partes:[{descricao:pag.conta||"", valor:pag.valor, comprovante:null, ok:false}]}]};
}
// conta de um pagamento: a que foi lançada ou a que o financeiro definiu depois no Controle de pagamentos
function contaDoPagamento(lancFin, pag){ if(pag.conta) return pag.conta; var lf = (lancFin||[]).find(function(x){ return x.id==="LFF_"+pag.id; }); var d = lf && lf.linhas[0] && lf.linhas[0].partes && lf.linhas[0].partes.map(function(q){ return q.descricao; }).filter(Boolean).join(" + "); return d || ""; }
function cfMigrar(cf){
  if(!cf) return cfDemo();
  if(LOCAL && cf.importV!==1){ var base = cfDemo(); ["funcionarias", "compras", "pagamentos", "negociacoes"].forEach(function(k){ var ids = {}; (cf[k]||[]).forEach(function(x){ ids[x.id] = 1; }); cf[k] = (cf[k]||[]).concat(base[k].filter(function(x){ return !ids[x.id]; })); }); cf.config = Object.assign({}, base.config, cf.config); cf.importV = 1; }
  return cf;
}

// ---------- regras ----------
// desconto (fração 0-1): luxo > promoção/porta-joias > faixa pelo valor da peça
function calcularDescontoPct(valorOriginal, promocao, portaJoias, luxo, cfg){
  if(luxo) return cfg.descontoPecaLuxo/100; if(promocao || portaJoias) return cfg.descontoPromocaoPortaJoias/100;
  if(valorOriginal<=200) return cfg.descontoAte200/100; if(valorOriginal<=300) return cfg.desconto200a300/100; if(valorOriginal<=400) return cfg.desconto300a400/100; return cfg.descontoAcima400/100;
}
// pagamento mínimo exigido sobre o saldo TOTAL (faixas são política fixa; os valores vêm da configuração)
function calcularPagamentoMinimo(saldo, cfg){ if(saldo<=0) return 0; if(saldo<100) return cfg.pagamentoMinimoAte99; if(saldo<200) return cfg.pagamentoMinimo100a199; if(saldo<300) return cfg.pagamentoMinimo200a299; if(saldo<400) return cfg.pagamentoMinimo300a399; return cfg.pagamentoMinimo400a500; }
var diaNoMes = function(ano, mes, dia){ var ult = new Date(Date.UTC(ano, mes+1, 0)).getUTCDate(); return new Date(Date.UTC(ano, mes, Math.min(dia, ult))); };
var utc = function(iso){ var a = iso.split("-").map(Number); return new Date(Date.UTC(a[0], a[1]-1, a[2])); };
// pagamento mínimo mensal: vencida a data combinada, a funcionária precisa pagar ao menos o mínimo em cada mês (a cobrança se repete todo mês no mesmo dia)
function pagouMinimoNoMesVigente(vencimento, hoje, pagamentos, minimo){
  if(minimo<=0) return true; var v = utc(vencimento), h = utc(hoje), dia = v.getUTCDate(), ref = diaNoMes(h.getUTCFullYear(), h.getUTCMonth(), dia);
  if(ref.getTime()>=h.getTime()) ref = diaNoMes(h.getUTCFullYear(), h.getUTCMonth()-1, dia); if(ref.getTime()<v.getTime()) ref = v;
  var pago = pagamentos.filter(function(p){ var d = utc(p.data); return d.getUTCFullYear()===ref.getUTCFullYear() && d.getUTCMonth()===ref.getUTCMonth(); }).reduce(function(t, p){ return t+p.valor; }, 0);
  return pago+0.005>=minimo;
}
// situação de uma funcionária: compras em ordem cronológica cobertas pelo "pool" de pagamentos; próxima cobrança; atraso; multa manual; saldo; mínimo
function situacaoDe(cf, funcId, hoje){
  var h = hoje || hojeIso(), cfg = cf.config, f = cf.funcionarias.find(function(x){ return x.id===funcId; });
  var compras = cf.compras.filter(function(c){ return c.funcId===funcId; }), pags = cf.pagamentos.filter(function(p){ return p.funcId===funcId; }), negs = cf.negociacoes.filter(function(n){ return n.funcId===funcId; });
  var totalPago = r2(pags.reduce(function(t, p){ return t+p.valor; }, 0)), datasPorCompra = {};
  negs.forEach(function(n){ if(!n.dataAcordada) return; (n.compraIds||[]).forEach(function(id){ (datasPorCompra[id] = datasPorCompra[id]||[]).push(n.dataAcordada); }); });
  var ordenadas = compras.slice().sort(function(a, b){ return a.data.localeCompare(b.data); }), acum = 0, porId = {};
  ordenadas.forEach(function(c){
    acum += c.valorCobrado; var paga = acum<=totalPago+0.01, ds = datasPorCompra[c.id]||[], prox = ds.length ? ds.slice().sort().pop() : (c.previsao||null);
    var vencida = !paga && prox!==null && prox<h, descEf = c.multa ? Math.max(0, c.descontoPct-cfg.penalidadeAtrasoPct) : c.descontoPct, valEf = c.multa ? r2(c.valorOriginal*(1-descEf/100)) : c.valorCobrado;
    porId[c.id] = {compra:c, paga:paga, proxima:prox, emAtraso:vencida, multa:!!c.multa, descEf:descEf, valorEf:valEf}; });
  var sts = Object.keys(porId).map(function(k){ return porId[k]; }), comprado = r2(sts.reduce(function(t, s){ return t+(s.paga ? s.compra.valorCobrado : s.valorEf); }, 0)), saldo = r2(comprado-totalPago), minimo = calcularPagamentoMinimo(saldo, cfg);
  sts.forEach(function(s){ if(s.emAtraso && pagouMinimoNoMesVigente(s.proxima, h, pags, minimo)) s.emAtraso = false; });
  var atrasos = sts.filter(function(s){ return !s.paga && s.emAtraso; }), proximas = sts.filter(function(s){ return !s.paga && s.proxima; }).map(function(s){ return s.proxima; }).sort();
  return {f:f, compras:ordenadas.map(function(c){ return porId[c.id]; }), pagamentos:pags.slice().sort(function(a, b){ return b.data.localeCompare(a.data); }), negociacoes:negs, comprado:comprado, pago:totalPago, saldo:saldo, minimo:minimo,
    quitado:saldo<=0.01 && compras.length>0, atrasada:atrasos.length>0, proximaCobranca:proximas[0]||null};
}
function todasSituacoes(cf, hoje){ return cf.funcionarias.filter(function(f){ return f.ativo; }).map(function(f){ return situacaoDe(cf, f.id, hoje); }).sort(function(a, b){ return a.f.nome.localeCompare(b.f.nome); }); }
// visão geral: KPIs e negociações em andamento
function resumoGeral(cf, hoje){
  var sts = todasSituacoes(cf, hoje), negs = [];
  sts.forEach(function(s){ s.negociacoes.forEach(function(n){ var valor = r2((n.compraIds||[]).reduce(function(t, id){ var c = s.compras.find(function(x){ return x.compra.id===id; }); return t+(c ? (c.paga ? c.compra.valorCobrado : c.valorEf) : 0); }, 0));
    negs.push({id:n.id, funcId:s.f.id, nome:s.f.nome, valor:valor, data:n.data, dataAcordada:n.dataAcordada, obs:n.obs, codigos:(n.compraIds||[]).reduce(function(l, id){ var c = s.compras.find(function(x){ return x.compra.id===id; }); return c ? l.concat(c.compra.codigos) : l; }, [])}); }); });
  return {totalEmAberto:r2(sts.reduce(function(t, s){ return t+Math.max(0, s.saldo); }, 0)), inadimplentes:sts.filter(function(s){ return s.atrasada; }).length, quitados:sts.filter(function(s){ return s.quitado; }).length,
    negociados:Object.keys(negs.reduce(function(o, n){ o[n.funcId] = 1; return o; }, {})).length, negociacoes:negs.sort(function(a, b){ return b.data.localeCompare(a.data); })};
}
// relatório mensal: comprado × pago por funcionária, mês a mês (pelas datas)
function relatorioMensal(cf){
  var nome = {}, porMes = {}; cf.funcionarias.forEach(function(f){ nome[f.id] = f.nome; });
  var add = function(mes, funcId, tipo, valor){ var m = porMes[mes] = porMes[mes]||{}; var o = m[funcId] = m[funcId]||{funcId:funcId, nome:nome[funcId]||"—", comprado:0, pago:0}; o[tipo] += valor; };
  cf.compras.forEach(function(c){ add(c.data.slice(0,7), c.funcId, "comprado", c.valorCobrado); }); cf.pagamentos.forEach(function(p){ add(p.data.slice(0,7), p.funcId, "pago", p.valor); });
  return Object.keys(porMes).sort().reverse().map(function(mes){ var fs = Object.keys(porMes[mes]).map(function(k){ var o = porMes[mes][k]; return {funcId:o.funcId, nome:o.nome, comprado:r2(o.comprado), pago:r2(o.pago)}; }).sort(function(a, b){ return a.nome.localeCompare(b.nome); });
    var tc = r2(fs.reduce(function(t, x){ return t+x.comprado; }, 0)), tp = r2(fs.reduce(function(t, x){ return t+x.pago; }, 0)); return {mes:mes, comprado:tc, pago:tp, pendente:r2(tc-tp), funcionarias:fs}; });
}

// ---------- ações ----------
// devolve {patch, msg}; patch vazio + msg = recusado
function cfReduz(s, a){
  var cf = JSON.parse(JSON.stringify(s.cf)), por = a.por||"—", recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg){ return {patch:{cf:cf}, msg:msg}; };
  var func = function(id){ return cf.funcionarias.find(function(x){ return x.id===id; }); };
  var money = function(v){ return Number(v||0).toLocaleString("pt-BR",{style:"currency", currency:"BRL"}); };
  var montaCompra = function(a2, atual){
    var vo = r2(a2.valorOriginal); if(!(vo>0)) return {erro:"Informe o valor da peça."}; var cods = (a2.codigos||[]).map(function(x){ return String(x).trim(); }).filter(Boolean); if(!cods.length) return {erro:"Informe ao menos um código de peça."};
    var pct = r2(calcularDescontoPct(vo, !!a2.promocao, !!a2.portaJoias, !!a2.luxo, cf.config)*100);
    return {compra:Object.assign({}, atual||{}, {data:a2.data||hojeIso(), codigos:cods, valorOriginal:vo, promocao:!!a2.promocao, portaJoias:!!a2.portaJoias, luxo:!!a2.luxo, descontoPct:pct, valorCobrado:r2(vo*(1-pct/100)), previsao:a2.previsao||""})}; };
  switch(a.op){
    case "func_add": { var nm = String(a.nome||"").trim(); if(!nm) return recusa("Informe o nome."); if(cf.funcionarias.some(function(x){ return x.ativo && x.nome.toLowerCase()===nm.toLowerCase(); })) return recusa("Já existe uma funcionária com esse nome.");
      cf.funcionarias.push({id:uid("f"), nome:nm, cnpj:a.cnpj||"", setor:a.setor||"", admissao:a.admissao||"", bloqueado:false, ativo:true}); return ok("Funcionária cadastrada"); }
    case "func_lote": { var novas = 0; (a.itens||[]).forEach(function(it){ if(!it.nome || cf.funcionarias.some(function(x){ return x.ativo && x.nome.toLowerCase()===it.nome.toLowerCase(); })) return; novas++; cf.funcionarias.push({id:uid("f"), nome:it.nome, cnpj:it.cnpj||"", setor:it.setor||"", admissao:it.admissao||"", bloqueado:false, ativo:true}); }); return ok(novas ? novas+" funcionária(s) trazida(s) do cadastro" : "Todas já estavam cadastradas"); }
    case "func_set": { var f1 = func(a.id); if(!f1) return recusa("Funcionária não encontrada."); Object.assign(f1, a.patch); return ok(a.patch.bloqueado===true ? "Funcionária bloqueada para novas compras" : a.patch.bloqueado===false ? "Funcionária liberada" : "Salvo"); }
    case "func_del": { var f2 = func(a.id); if(!f2) return recusa("Funcionária não encontrada."); var st = situacaoDe(cf, a.id), tem = cf.compras.some(function(c){ return c.funcId===a.id; });
      if(!tem){ cf.funcionarias = cf.funcionarias.filter(function(x){ return x.id!==a.id; }); cf.pagamentos = cf.pagamentos.filter(function(p){ return p.funcId!==a.id; }); return ok("Funcionária excluída"); }
      if(st.saldo>0.01) return recusa("Ela ainda tem saldo devedor. Quite ou renegocie antes."); f2.ativo = false; return ok("Funcionária arquivada (o histórico fica guardado)"); }
    case "compra_add": { var f3 = func(a.funcId); if(!f3) return recusa("Escolha a funcionária."); if(f3.bloqueado) return recusa("Funcionária bloqueada: não recebe compra nova."); var mc = montaCompra(a); if(mc.erro) return recusa(mc.erro);
      var saldo = situacaoDe(cf, a.funcId).saldo; if(saldo+mc.compra.valorCobrado>LIMITE_SALDO && !a.confirmarLimite) return recusa("LIMITE");
      cf.compras.push(Object.assign({id:uid("c"), funcId:a.funcId, multa:false, por:por, em:Date.now()}, mc.compra)); return ok("Compra lançada: "+money(mc.compra.valorCobrado)+" ("+mc.compra.descontoPct+"% de desconto)"); }
    case "compra_set": { var c1 = cf.compras.find(function(x){ return x.id===a.id; }); if(!c1) return recusa("Compra não encontrada."); var mc2 = montaCompra(Object.assign({}, c1, a.dados), c1); if(mc2.erro) return recusa(mc2.erro);
      var saldoSem = r2(situacaoDe(cf, c1.funcId).saldo-c1.valorCobrado); if(saldoSem+mc2.compra.valorCobrado>LIMITE_SALDO && !a.confirmarLimite) return recusa("LIMITE"); Object.assign(c1, mc2.compra); return ok("Compra atualizada (desconto recalculado com a configuração de hoje)"); }
    case "compra_del": { cf.compras = cf.compras.filter(function(x){ return x.id!==a.id; }); cf.negociacoes.forEach(function(n){ n.compraIds = (n.compraIds||[]).filter(function(id){ return id!==a.id; }); }); cf.negociacoes = cf.negociacoes.filter(function(n){ return n.compraIds.length>0; }); return ok("Compra excluída"); }
    case "compra_multa": { var c2 = cf.compras.find(function(x){ return x.id===a.id; }); if(!c2) return recusa("Compra não encontrada."); if(a.aplicar){ var sit = situacaoDe(cf, c2.funcId), st2 = sit.compras.find(function(x){ return x.compra.id===a.id; }); if(!st2 || !st2.emAtraso || st2.paga) return recusa("A multa só pode ser aplicada em compra em atraso."); } c2.multa = !!a.aplicar; return ok(a.aplicar ? "Multa de atraso aplicada" : "Multa removida"); }
    case "pag_add": { var pv = r2(a.valor); if(!func(a.funcId)) return recusa("Escolha a funcionária."); if(!(pv>0)) return recusa("Informe o valor do pagamento."); cf.pagamentos.push({id:uid("p"), funcId:a.funcId, data:a.data||hojeIso(), valor:pv, obs:String(a.obs||"").trim(), comp:a.comp||null, conta:String(a.conta||""), por:por, em:Date.now()}); return ok("Pagamento de "+money(pv)+" registrado"); }
    case "pag_del": { cf.pagamentos = cf.pagamentos.filter(function(x){ return x.id!==a.id; }); return ok("Pagamento excluído"); }
    case "neg_add": { if(!func(a.funcId)) return recusa("Escolha a funcionária."); var ids = (a.compraIds||[]).filter(function(id){ return cf.compras.some(function(c){ return c.id===id && c.funcId===a.funcId; }); }); if(!ids.length) return recusa("Escolha ao menos uma compra dela."); if(!String(a.obs||"").trim()) return recusa("A observação da negociação é obrigatória.");
      cf.negociacoes.push({id:uid("n"), funcId:a.funcId, data:a.data||hojeIso(), dataAcordada:a.dataAcordada||"", obs:String(a.obs).trim(), compraIds:ids, por:por, em:Date.now()}); return ok("Negociação registrada"); }
    case "neg_set": { var n1 = cf.negociacoes.find(function(x){ return x.id===a.id; }); if(!n1) return recusa("Negociação não encontrada."); if(a.patch.obs!==undefined && !String(a.patch.obs).trim()) return recusa("A observação é obrigatória."); Object.assign(n1, a.patch); return ok("Negociação atualizada"); }
    case "neg_del": { cf.negociacoes = cf.negociacoes.filter(function(x){ return x.id!==a.id; }); return ok("Negociação excluída"); }
    case "config_set": { Object.keys(a.patch||{}).forEach(function(k){ var v = Number(a.patch[k]); if(!isNaN(v) && v>=0 && k in cf.config) cf.config[k] = v; }); return ok("Configuração salva"); }
  }
  return recusa("Ação desconhecida.");
}

export { lancFinDoPagamento, contaDoPagamento, cfMigrar, LIMITE_SALDO, ACESSO_COBRANCA_BASE, CONFIG_PADRAO, hojeIso, cfDemo, calcularDescontoPct, calcularPagamentoMinimo, situacaoDe, todasSituacoes, resumoGeral, relatorioMensal, cfReduz };
