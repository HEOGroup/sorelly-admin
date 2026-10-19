// Sorelly Admin · montagem — domain/financeiro-familiar.js
// Financeiro Familiar trazido do SorellyAdmin: finanças pessoais/familiares dos sócios. Por pessoa (sócio ou "Casa/Família"): contas a pagar (parcelas, pagamento parcial), pró-labore,
// PIX das revendedoras, prestadores (dívidas e repasses), transferências, alertas, relatório mensal com fechamento e histórico. Estado s.ff, SÓ neste navegador (dados pessoais: nunca vão para o GitHub).
// Todas as contas ficam aqui; as telas em pages/FinFamiliar.js.

var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var FORMAS = ["PIX","Dinheiro","Cartão de crédito","Cartão de débito","Transferência","Boleto","Débito em conta","PIX revendedoras","A confirmar"];
// dados reais importados do admin antigo (arquivo local, fora do GitHub); sem o arquivo o sistema nasce vazio
var LOCAL = (function(){ try { var m = import.meta.glob("./ff-dados.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();
function ffLocal(){ return LOCAL ? JSON.parse(JSON.stringify(LOCAL)) : null; }
var FORMAS_REPASSE = ["PIX","Dinheiro","Cartão de crédito"];
var TIPOS_REGRA = [["CONTAS_MES_ACIMA","Contas do mês acima de (R$)"], ["ATRASADAS_ACIMA","Contas atrasadas acima de (R$)"], ["PIX_ABAIXO_META","PIX abaixo da meta (%)"], ["SALDO_PRESTADOR_ACIMA","Saldo de prestador acima de (R$)"]];
var ACESSO_FF = [16, 28, 29];   // quem abre o Financeiro Familiar: Marcus, Lucas e Anamaria (sócios). Nem a família nem outras pessoas de acesso total.

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var p2 = function(n){ return String(n).padStart(2,"0"); };
var hojeIso = function(){ var d = new Date(); return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate()); };
var hojeYm = function(){ return hojeIso().slice(0,7); };
var somaMes = function(ym, n){ var a = ym.split("-").map(Number), t = a[0]*12+(a[1]-1)+n; return Math.floor(t/12)+"-"+p2(t%12+1); };
var ultimoDia = function(ym){ return new Date(Number(ym.slice(0,4)), Number(ym.slice(5,7)), 0).getDate(); };
var vencIso = function(ym, dia){ return ym+"-"+p2(Math.min(Number(dia)||1, ultimoDia(ym))); };   // dia 31 em fevereiro vira 28/29
var nomeMes = function(ym){ return MESES[Number(ym.slice(5,7))-1]+"/"+ym.slice(0,4); };
var br = function(iso){ return iso ? iso.split("-").reverse().join("/") : "—"; };
var diasEntre = function(a, b){ var u = function(i){ var x = i.split("-").map(Number); return Date.UTC(x[0], x[1]-1, x[2]); }; return Math.round((u(b)-u(a))/86400000); };
var semanaDoDia = function(dia){ return dia<=10 ? 1 : dia<=15 ? 2 : dia<=20 ? 3 : dia<=25 ? 4 : 5; };
var chaveCategoria = function(nome){ return String(nome||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toUpperCase().replace(/[^A-Z0-9]+/g,"_").replace(/^_|_$/g,""); };
var uid = function(p){ return p+Date.now().toString(36)+Math.floor(Math.random()*46656).toString(36); };

// ---------- estado inicial (vazio: nada é inventado; o Marcus/Lucas lançam as contas reais) ----------
function ffDemo(){
  var real = ffLocal(); if(real) return real;
  return {v:1,
    personas:[{id:"marcus", nome:"Marcus", cor:"#EC4899", tipo:"SOCIO", ativo:true, mostrarProlabore:true, mostrarContas:true, mostrarPix:true}, {id:"lucas", nome:"Lucas", cor:"#3B82F6", tipo:"SOCIO", ativo:true, mostrarProlabore:true, mostrarContas:true, mostrarPix:true},
      {id:"familia", nome:"Casa / Família", cor:"#22C55E", tipo:"FAMILIAR", ativo:true, mostrarProlabore:false, mostrarContas:true, mostrarPix:true}],
    categorias:[{chave:"PRO_LABORE", nome:"Pró-labore", sistema:true}, {chave:"MORADIA", nome:"Moradia"}, {chave:"ALIMENTACAO", nome:"Alimentação"}, {chave:"SAUDE", nome:"Saúde"}, {chave:"EDUCACAO", nome:"Educação"}, {chave:"TRANSPORTE", nome:"Transporte"}, {chave:"CARTAO", nome:"Cartão de crédito"}, {chave:"LAZER", nome:"Lazer"}, {chave:"OUTROS", nome:"Outros"}],
    contasBanc:[], contas:[], parcelas:{}, transf:[], liberados:[], prolabore:{}, pixMeta:{}, pix:[], prest:[], dividas:[], repasses:[], regras:[], fechamentos:{}, hist:[]};
}

// ---------- derivações ----------
var pagoDe = function(p){ return r2((p.pagamentos||[]).reduce(function(t, x){ return t+x.valor; }, 0)); };
var statusDe = function(valor, pago){ return valor>0 && pago>=valor-0.005 ? "PAGO" : pago>0 ? "PARCIAL" : "PENDENTE"; };
// parcelas (uma por conta e mês) já com pago, restante, status e atraso. filtro: {ym} ou {yms:[...]}
function parcelasDe(ff, filtro, hoje){
  var h = hoje||hojeIso(), out = [], f = filtro||{};
  ff.contas.forEach(function(c){ var ps = ff.parcelas[c.id]||{};
    Object.keys(ps).forEach(function(ym){ if(f.ym && f.ym!==ym) return; if(f.yms && f.yms.indexOf(ym)<0) return; var p = ps[ym], pago = pagoDe(p), st = statusDe(p.valor, pago), venc = vencIso(ym, c.dia);
      out.push({chave:c.id+"|"+ym, conta:c, ym:ym, valor:p.valor, pago:pago, restante:r2(p.valor-pago), status:st, venc:venc, atrasada:st!=="PAGO" && venc<h, pagamentos:p.pagamentos||[]}); }); });
  return out.sort(function(a, b){ return a.venc.localeCompare(b.venc) || a.conta.descricao.localeCompare(b.conta.descricao); });
}
var janela = function(){ var h = hojeYm(), l = []; for(var i=-6; i<=12; i++) l.push(somaMes(h, i)); return l; };   // 6 meses para trás e 12 para a frente

function pixDoMes(ff, pid, ym){
  var a = ff.pix.filter(function(x){ return x.personaId===pid && x.data.slice(0,7)===ym && x.auditoria!=="REJEITADO"; }).reduce(function(t, x){ return t+x.valor; }, 0);
  var b = ff.repasses.filter(function(x){ return x.origemPixPersonaId===pid && !x.origemPixLancId && x.data.slice(0,7)===ym; }).reduce(function(t, x){ return t+x.valor; }, 0);
  return r2(a+b);
}
function pixDivisao(ff, pid, ym){   // direto × repassado a prestadores
  var pres = ff.repasses.filter(function(x){ return x.origemPixPersonaId===pid && x.data.slice(0,7)===ym; }).reduce(function(t, x){ return t+x.valor; }, 0), tot = pixDoMes(ff, pid, ym);
  return {direto:r2(Math.max(0, tot-pres)), prestadores:r2(pres)};
}
// "Para quem entra": uma pessoa, ou "Família" = divide em partes iguais entre os 4 (Marcus, Anamaria, Marco Antonio, Ana Beatriz)
var FAMILIA4 = "__familia4";
var MEMBROS_FAMILIA = ["marcus","anamaria","marco","anabeatriz"];
function membrosFamilia(ff){ var l = MEMBROS_FAMILIA.filter(function(id){ return ff.personas.some(function(p){ return p.id===id; }); }); return l.length ? l : ff.personas.filter(function(p){ return p.tipo==="SOCIO" && p.ativo; }).map(function(p){ return p.id; }); }
function destinoConta(ff, pid){ if(pid!==FAMILIA4) return {personaId:pid, rateio:null}; var casa = ff.personas.find(function(p){ return p.id==="familia"; }); return {personaId:casa ? casa.id : (ff.personas[0]||{}).id, rateio:membrosFamilia(ff)}; }
var daPessoa = function(conta, pid){ return conta.rateio && conta.rateio.length ? conta.rateio.indexOf(pid)>=0 : conta.personaId===pid; };
var parteDe = function(conta){ return conta.rateio && conta.rateio.length ? 1/conta.rateio.length : 1; };
function totaisPersona(ff, pid, ym){
  var ps = parcelasDe(ff, {ym:ym}).filter(function(x){ return daPessoa(x.conta, pid); }).map(function(x){ var f = parteDe(x.conta); return f===1 ? x : Object.assign({}, x, {valor:r2(x.valor*f), pago:r2(x.pago*f), restante:r2(x.restante*f)}); }), soma = function(l, k){ return r2(l.reduce(function(t, x){ return t+x[k]; }, 0)); };
  var contas = ps.filter(function(x){ return x.conta.categoria!=="PRO_LABORE"; }), pro = ps.filter(function(x){ return x.conta.categoria==="PRO_LABORE"; });
  var meta = ff.pixMeta[pid+"|"+ym]||0, rec = pixDoMes(ff, pid, ym);
  return {contas:{total:soma(contas,"valor"), pago:soma(contas,"pago"), restante:soma(contas,"restante"), pendentes:contas.filter(function(x){ return x.status!=="PAGO"; }).length, atrasado:r2(contas.filter(function(x){ return x.atrasada; }).reduce(function(t, x){ return t+x.restante; }, 0))},
    pro:{total:soma(pro,"valor"), recebido:soma(pro,"pago"), restante:soma(pro,"restante")}, pix:{meta:meta, recebido:rec, restante:r2(Math.max(0, meta-rec)), pendentesAud:ff.pix.filter(function(x){ return x.personaId===pid && x.data.slice(0,7)===ym && x.auditoria==="PENDENTE"; }).length},
    todasContas:soma(ps,"valor")};
}
var saldoPrestador = function(ff, id){ var d = ff.dividas.filter(function(x){ return x.prestId===id; }).reduce(function(t, x){ return t+x.valor; }, 0), r = ff.repasses.filter(function(x){ return x.prestId===id; }).reduce(function(t, x){ return t+x.valor; }, 0); return r2(d-r); };
var vigenciaEm = function(ff, pid, ym){ var pr = ff.prolabore[pid]; if(!pr) return null; return (pr.vigencias||[]).filter(function(v){ return v.desde<=ym; }).sort(function(a, b){ return b.desde.localeCompare(a.desde); })[0] || null; };
var liquidoDe = function(bruto, inss, irrf){ return r2((bruto||0)-(inss||0)-(irrf||0)); };

// alertas (só do mês corrente) e regras
function alertasDe(ff, hoje){
  var h = hoje||hojeIso(), ym = h.slice(0,7), out = [], nome = function(id){ var p = ff.personas.find(function(x){ return x.id===id; }); return p ? p.nome : "—"; };
  ff.dividas.forEach(function(d){ var pr = ff.prest.find(function(x){ return x.id===d.prestId; }); if(!pr || !pr.ativo || !d.prazo || saldoPrestador(ff, pr.id)<=0) return; var dias = diasEntre(h, d.prazo);
    if(dias<=7) out.push({tipo:"prazo", grave:dias<0, titulo:(dias<0 ? "Prazo vencido" : "Prazo em "+dias+" dia(s)")+" · "+pr.nome, texto:"Dívida de "+d.valor.toLocaleString("pt-BR",{style:"currency", currency:"BRL"})+" com prazo em "+br(d.prazo)+" · saldo "+saldoPrestador(ff, pr.id).toLocaleString("pt-BR",{style:"currency", currency:"BRL"})}); });
  ff.personas.filter(function(p){ return p.ativo; }).forEach(function(p){ var t = totaisPersona(ff, p.id, ym);
    if(t.contas.atrasado>0) out.push({tipo:"atrasada", grave:true, titulo:"Contas atrasadas · "+p.nome, texto:"Falta pagar "+t.contas.atrasado.toLocaleString("pt-BR",{style:"currency", currency:"BRL"})+" de contas já vencidas neste mês."});
    if(t.pix.pendentesAud>0) out.push({tipo:"pix", grave:false, titulo:"PIX aguardando conferência · "+p.nome, texto:t.pix.pendentesAud+" PIX do mês esperando a conciliação com o extrato."}); });
  (ff.regras||[]).filter(function(r){ return r.ativo; }).forEach(function(r){ var ps = r.personaId ? ff.personas.filter(function(p){ return p.id===r.personaId; }) : ff.personas.filter(function(p){ return p.ativo; }), R = function(v){ return v.toLocaleString("pt-BR",{style:"currency", currency:"BRL"}); };
    if(r.tipo==="SALDO_PRESTADOR_ACIMA"){ ff.prest.filter(function(x){ return x.ativo && (!r.personaId || x.responsavelId===r.personaId); }).forEach(function(x){ var s = saldoPrestador(ff, x.id); if(s>r.limite) out.push({tipo:"regra", grave:false, titulo:"Saldo de prestador alto · "+x.nome, texto:"Saldo "+R(s)+" acima do limite de "+R(r.limite)+"."}); }); return; }
    ps.forEach(function(p){ var t = totaisPersona(ff, p.id, ym);
      if(r.tipo==="CONTAS_MES_ACIMA" && t.todasContas>r.limite) out.push({tipo:"regra", grave:false, titulo:"Contas do mês acima do limite · "+p.nome, texto:R(t.todasContas)+" no mês, limite "+R(r.limite)+"."});
      if(r.tipo==="ATRASADAS_ACIMA" && t.contas.atrasado>r.limite) out.push({tipo:"regra", grave:true, titulo:"Atrasadas acima do limite · "+p.nome, texto:R(t.contas.atrasado)+" atrasado, limite "+R(r.limite)+"."});
      if(r.tipo==="PIX_ABAIXO_META" && t.pix.meta>0 && t.pix.recebido/t.pix.meta*100<r.limite) out.push({tipo:"regra", grave:false, titulo:"PIX abaixo da meta · "+p.nome, texto:Math.round(t.pix.recebido/t.pix.meta*100)+"% da meta, limite "+r.limite+"%."}); }); });
  return out;
}
// relatório do mês por pessoa (sem PRO_LABORE nas contas, para não contar em dobro)
function relatorioMes(ff, ym){
  return ff.personas.filter(function(p){ return p.ativo; }).map(function(p){ var t = totaisPersona(ff, p.id, ym), v = vigenciaEm(ff, p.id, ym);
    return {id:p.id, nome:p.nome, cor:p.cor, contas:t.contas, pix:{meta:t.pix.meta, recebido:pixDoMes(ff, p.id, ym)}, proLiquido:t.pro.recebido || (v ? v.liquido : 0), saldoPrest:r2(ff.prest.filter(function(x){ return x.responsavelId===p.id && x.ativo; }).reduce(function(t2, x){ return t2+saldoPrestador(ff, x.id); }, 0))}; });
}

// ---------- ações ----------
// devolve {patch, msg}; patch vazio + msg = recusado. Cada ação que dá certo vira uma linha do Histórico.
function ffReduz(s, a){
  var ff = JSON.parse(JSON.stringify(s.ff)), por = a.por||"—", recusa = function(t){ return {patch:{}, msg:t}; }, hojeI = hojeIso(), hym = hojeYm();
  var ok = function(msg, area, acao, alvo, detalhe){ ff.hist.unshift({id:uid("h"), em:Date.now(), por:por, area:area||"Outros", acao:acao||a.op, alvo:alvo||"", detalhe:detalhe||""}); if(ff.hist.length>2000) ff.hist.length = 2000; return {patch:{ff:ff}, msg:msg}; };
  var editavel = function(ym){ return ym>=hym || ff.liberados.indexOf(ym)>=0; };
  var nomeP = function(id){ var p = ff.personas.find(function(x){ return x.id===id; }); return p ? p.nome : "—"; };
  var conta = function(id){ return ff.contas.find(function(c){ return c.id===id; }); };
  var parc = function(id, ym){ return ff.parcelas[id] && ff.parcelas[id][ym]; };
  var money = function(v){ return Number(v||0).toLocaleString("pt-BR",{style:"currency", currency:"BRL"}); };
  var syncRepasse = function(l){   // o PIX caiu numa conta de prestador: gera (ou ajusta, ou apaga) o repasse automático
    ff.repasses = ff.repasses.filter(function(r){ return r.origemPixLancId!==l.id; }); var cb = ff.contasBanc.find(function(c){ return c.id===l.contaId; });
    if(cb && cb.prestadorId) ff.repasses.push({id:uid("rp"), prestId:cb.prestadorId, valor:l.valor, data:l.data, origem:"PIX revendedora", forma:"PIX", conta:cb.nome, chavePixDestino:cb.chavePix||"", origemPixPersonaId:l.personaId, origemPixLancId:l.id}); };
  switch(a.op){
    // ---- configurações
    case "persona_add": { var nm = String(a.nome||"").trim(); if(!nm) return recusa("Informe o nome."); var id = chaveCategoria(nm).toLowerCase().replace(/_/g,"-")||uid("p"); if(ff.personas.some(function(p){ return p.id===id; })) id = id+"-"+Math.floor(Math.random()*99);
      ff.personas.push({id:id, nome:nm, cor:a.cor||"#E8B84B", tipo:a.tipo||"SOCIO", ativo:true, mostrarProlabore:a.tipo!=="FAMILIAR", mostrarContas:true, mostrarPix:true}); return ok("Pessoa criada", "Configurações", "Criou pessoa", nm); }
    case "persona_set": { var pp = ff.personas.find(function(p){ return p.id===a.id; }); if(!pp) return recusa("Pessoa não encontrada."); Object.assign(pp, a.patch); return ok("Salvo", "Configurações", "Editou pessoa", pp.nome); }
    case "cat_add": { var cn = String(a.nome||"").trim(); if(!cn) return recusa("Informe o nome."); var ch = chaveCategoria(cn), k = ch, n = 2; while(ff.categorias.some(function(c){ return c.chave===k; })) k = ch+"_"+(n++); ff.categorias.push({chave:k, nome:cn}); return ok("Categoria criada", "Configurações", "Criou categoria", cn); }
    case "cat_set": { var ct = ff.categorias.find(function(c){ return c.chave===a.chave; }); if(!ct) return recusa("Categoria não encontrada."); ct.nome = String(a.nome||"").trim() || ct.nome; return ok("Salvo", "Configurações", "Renomeou categoria", ct.nome); }
    case "cat_del": { var cd = ff.categorias.find(function(c){ return c.chave===a.chave; }); if(!cd) return recusa("Categoria não encontrada."); if(cd.sistema) return recusa("Categoria do sistema não se exclui."); if(ff.contas.some(function(c){ return c.categoria===a.chave; })) return recusa("Há contas nessa categoria."); ff.categorias = ff.categorias.filter(function(c){ return c.chave!==a.chave; }); return ok("Excluída", "Configurações", "Excluiu categoria", cd.nome); }
    case "cb_add": { var bn = String(a.nome||"").trim(); if(!bn) return recusa("Informe o nome da conta."); ff.contasBanc.push({id:uid("cb"), nome:bn, banco:a.banco||"", tipo:a.tipo||"PF", chavePixTipo:a.chavePixTipo||"", chavePix:a.chavePix||"", personaId:a.personaId||"", prestadorId:a.prestadorId||"", ativo:true}); return ok("Conta criada", "Contas bancárias", "Criou conta bancária", bn); }
    case "cb_set": { var cb = ff.contasBanc.find(function(c){ return c.id===a.id; }); if(!cb) return recusa("Conta não encontrada."); Object.assign(cb, a.patch); return ok("Salvo", "Contas bancárias", "Editou conta bancária", cb.nome); }
    case "cb_del": { var cx = ff.contasBanc.find(function(c){ return c.id===a.id; }); if(!cx) return recusa("Conta não encontrada."); if(ff.contas.some(function(c){ return c.contaBancId===a.id; }) || ff.transf.some(function(t){ return t.origem===a.id || t.destino===a.id; })) return recusa("Está em uso por conta a pagar ou transferência.");
      ff.contasBanc = ff.contasBanc.filter(function(c){ return c.id!==a.id; }); ff.pix.forEach(function(l){ if(l.contaId===a.id) l.contaId = ""; }); return ok("Excluída", "Contas bancárias", "Excluiu conta bancária", cx.nome); }
    case "mes_liberar": { if(ff.liberados.indexOf(a.ym)<0) ff.liberados.push(a.ym); return ok("Mês liberado", "Configurações", "Liberou mês para edição", nomeMes(a.ym)); }
    case "mes_revogar": { ff.liberados = ff.liberados.filter(function(x){ return x!==a.ym; }); return ok("Liberação removida", "Configurações", "Tirou a liberação do mês", nomeMes(a.ym)); }
    // ---- contas a pagar
    case "conta_add": {
      var dst = destinoConta(ff, a.personaId); a.personaId = dst.personaId;
      var ds = String(a.descricao||"").trim(), vl = r2(a.valor); if(!a.personaId || !ds) return recusa("Informe a pessoa e a descrição."); if(!(vl>0)) return recusa("Informe o valor."); if(!a.mesInicio) return recusa("Informe o mês de início.");
      var dia = Math.min(31, Math.max(1, Number(a.dia)||1)), rec = a.recorrencia||"unica", fim = rec==="fixa" ? somaMes(a.mesInicio, 23) : rec==="parcelada" ? a.mesFim : a.mesInicio; if(!fim || fim<a.mesInicio) return recusa("O mês final precisa ser igual ou depois do início.");
      var cid = uid("c"); ff.contas.push({id:cid, personaId:a.personaId, descricao:ds, categoria:a.categoria||"OUTROS", contaBancId:a.contaBancId||"", dia:dia, forma:a.forma||"PIX", beneficiario:a.beneficiario||"", obs:a.obs||"", encerraEm:rec==="fixa" ? null : fim, rateio:dst.rateio});
      ff.parcelas[cid] = {}; for(var m=a.mesInicio; m<=fim; m=somaMes(m, 1)) ff.parcelas[cid][m] = {valor:vl, pagamentos:[]};
      return ok("Conta lançada", "Contas a pagar", "Lançou conta", ds, nomeP(a.personaId)+" · "+money(vl)+(rec==="unica" ? "" : rec==="fixa" ? " · fixa (24 meses)" : " · parcelada até "+nomeMes(fim))); }
    case "conta_set": { var cs = conta(a.id); if(!cs) return recusa("Conta não encontrada."); var pch = Object.assign({}, a.patch); if(pch.personaId!==undefined){ var dst2 = destinoConta(ff, pch.personaId); pch.personaId = dst2.personaId; pch.rateio = dst2.rateio; } Object.assign(cs, pch); return ok("Conta atualizada", "Contas a pagar", "Editou conta", cs.descricao); }
    case "conta_del": { var cdl = conta(a.id); if(!cdl) return recusa("Conta não encontrada."); ff.contas = ff.contas.filter(function(c){ return c.id!==a.id; }); delete ff.parcelas[a.id]; return ok("Conta excluída", "Contas a pagar", "Excluiu conta", cdl.descricao, "com todas as parcelas"); }
    case "conta_estender": { var ce = conta(a.id); if(!ce) return recusa("Conta não encontrada."); var ps = Object.keys(ff.parcelas[a.id]||{}).sort(), ult = ps[ps.length-1], vv = r2(a.valor); if(!(vv>0)) return recusa("Informe o valor das novas parcelas.");
      var ate = a.ateMes || somaMes(ult, 24); if(ate<=ult) return recusa("O mês final precisa ser depois da última parcela ("+nomeMes(ult)+")."); for(var m2=somaMes(ult, 1); m2<=ate; m2=somaMes(m2, 1)) ff.parcelas[a.id][m2] = {valor:vv, pagamentos:[]}; ce.encerraEm = a.ateMes ? ate : null;
      return ok("Conta estendida", "Contas a pagar", "Estendeu conta", ce.descricao, "até "+nomeMes(ate)); }
    case "parc_valor": { var pv = parc(a.id, a.ym), cv = conta(a.id); if(!pv) return recusa("Parcela não encontrada."); if(!editavel(a.ym)) return recusa("Mês passado travado. Libere em Configurações para corrigir."); var nv = r2(a.valor);
      if(nv<pagoDe(pv)-0.005) return recusa("O valor não pode ficar abaixo do que já foi pago."); var antes = pv.valor; pv.valor = nv; return ok("Valor corrigido", "Contas a pagar", "Corrigiu valor da parcela", cv.descricao+" · "+nomeMes(a.ym), money(antes)+" → "+money(nv)); }
    case "parc_baixa": { var pb = parc(a.id, a.ym), cb2 = conta(a.id); if(!pb) return recusa("Parcela não encontrada."); var pg = pagoDe(pb), rest = r2(pb.valor-pg), vb = r2(a.valor); if(statusDe(pb.valor, pg)==="PAGO") return recusa("Parcela já paga.");
      if(!(vb>0)) return recusa("Informe o valor pago."); if(vb>rest+0.005) return recusa("O valor passa do que falta ("+money(rest)+")."); pb.pagamentos = (pb.pagamentos||[]).concat([{id:uid("pg"), valor:vb, em:a.em||hojeI, forma:a.forma||"PIX", conta:a.contaTxt||"", obs:a.obs||"", por:por}]);
      return ok(statusDe(pb.valor, pagoDe(pb))==="PAGO" ? "Parcela paga" : "Pagamento parcial registrado", "Contas a pagar", "Deu baixa", cb2.descricao+" · "+nomeMes(a.ym), money(vb)+" em "+(a.forma||"PIX")); }
    case "parc_baixa_multipla": { var pm = parc(a.id, a.ym), cm = conta(a.id); if(!pm) return recusa("Parcela não encontrada."); var rest2 = r2(pm.valor-pagoDe(pm)), ls = (a.linhas||[]).filter(function(l){ return r2(l.valor)>0; });
      if(ls.length<2) return recusa("Use ao menos duas formas de pagamento."); if(Math.abs(ls.reduce(function(t, l){ return t+r2(l.valor); }, 0)-rest2)>0.005) return recusa("As formas precisam somar exatamente "+money(rest2)+".");
      var maior = ls.slice().sort(function(x, y){ return y.valor-x.valor; })[0]; pm.pagamentos = (pm.pagamentos||[]).concat([{id:uid("pg"), valor:rest2, em:a.em||hojeI, forma:maior.forma, conta:ls.map(function(l){ return l.contaTxt||l.forma; }).join(" + "), obs:ls.map(function(l){ return l.forma+" "+money(l.valor); }).join(" + "), por:por}]);
      return ok("Parcela paga (dividida)", "Contas a pagar", "Deu baixa dividida", cm.descricao+" · "+nomeMes(a.ym), ls.map(function(l){ return l.forma+" "+money(l.valor); }).join(" + ")); }
    case "parc_pago_edit": { var pe = parc(a.id, a.ym), cpe = conta(a.id); if(!pe) return recusa("Parcela não encontrada."); if(statusDe(pe.valor, pagoDe(pe))!=="PAGO") return recusa("Só se edita pagamento de parcela totalmente paga."); if(!editavel(a.ym)) return recusa("Mês passado travado. Libere em Configurações.");
      var ve = r2(a.valor); if(!(ve>0)) return recusa("Informe o valor."); pe.valor = ve; pe.pagamentos = [{id:uid("pg"), valor:ve, em:a.em||hojeI, forma:a.forma||"PIX", conta:a.contaTxt||"", obs:a.obs||"", por:por}]; return ok("Pagamento editado", "Contas pagas", "Editou pagamento", cpe.descricao+" · "+nomeMes(a.ym), money(ve)); }
    case "parc_reverter": { var pr2 = parc(a.id, a.ym), cr = conta(a.id); if(!pr2) return recusa("Parcela não encontrada."); if(!editavel(a.ym)) return recusa("Mês passado travado. Libere em Configurações."); pr2.pagamentos = []; return ok("Pagamento excluído: a parcela voltou para Contas a pagar", "Contas pagas", "Excluiu pagamento", cr.descricao+" · "+nomeMes(a.ym)); }
    // ---- transferências
    case "transf_add": { var tv = r2(a.valor); if(!a.origem || !a.destino || a.origem===a.destino) return recusa("Escolha contas de origem e destino diferentes."); if(!(tv>0)) return recusa("Informe o valor."); ff.transf.push({id:uid("t"), origem:a.origem, destino:a.destino, valor:tv, data:a.data||hojeI, status:"PENDENTE"}); return ok("Transferência anotada", "Transferências", "Anotou transferência", money(tv)); }
    case "transf_baixa": { var tb = ff.transf.find(function(t){ return t.id===a.id; }); if(!tb) return recusa("Transferência não encontrada."); tb.status = "PAGO"; tb.pagoEm = a.pagoEm||hojeI; tb.forma = a.forma||"PIX"; return ok("Transferência concluída", "Transferências", "Deu baixa em transferência", money(tb.valor)); }
    case "transf_del": { var td = ff.transf.find(function(t){ return t.id===a.id; }); if(!td) return recusa("Transferência não encontrada."); ff.transf = ff.transf.filter(function(t){ return t.id!==a.id; }); return ok("Excluída", "Transferências", "Excluiu transferência", money(td.valor)); }
    // ---- pró-labore
    case "prolab_set": { var pl = ff.prolabore[a.personaId] = Object.assign({empresa:"", cnpj:"", vigencias:[]}, ff.prolabore[a.personaId], {empresa:String(a.empresa||"").trim(), cnpj:String(a.cnpj||"").trim()}); return ok("Empresa salva", "Pró-labore", "Definiu empresa do pró-labore", nomeP(a.personaId), pl.empresa); }
    case "prolab_vig_add": { var pr3 = ff.prolabore[a.personaId]; if(!pr3 || !pr3.empresa) return recusa("Cadastre a empresa antes."); if(!/^\d{4}-\d{2}$/.test(a.desde||"")) return recusa("Informe o mês de início."); if((pr3.vigencias||[]).some(function(v){ return v.desde===a.desde; })) return recusa("Já existe vigência começando em "+nomeMes(a.desde)+".");
      var liq = liquidoDe(Number(a.bruto), Number(a.inss), Number(a.irrf)); if(!(liq>0)) return recusa("O líquido precisa ser maior que zero."); var v = {id:uid("v"), desde:a.desde, bruto:r2(a.bruto), inss:r2(a.inss), irrf:r2(a.irrf), liquido:liq};
      if(a.split){ var v1 = r2(a.valor1), v2 = r2(liq-v1); if(!(v1>0) || !(v2>0)) return recusa("O valor 1 precisa ser maior que zero e menor que o líquido."); v.dia1 = Number(a.dia1)||20; v.valor1 = v1; v.dia2 = Number(a.dia2)||5; v.valor2 = v2; }
      pr3.vigencias.push(v); return ok("Vigência criada", "Pró-labore", "Criou vigência", nomeP(a.personaId)+" · desde "+nomeMes(a.desde), "líquido "+money(liq)); }
    case "prolab_vig_del": { var pr4 = ff.prolabore[a.personaId]; if(!pr4) return recusa("Não encontrado."); pr4.vigencias = pr4.vigencias.filter(function(x){ return x.id!==a.id; }); return ok("Vigência excluída (as contas já geradas ficam)", "Pró-labore", "Excluiu vigência", nomeP(a.personaId)); }
    case "prolab_gerar": { var ym = a.ym, criadas = 0, bancoPad = function(pid){ return ff.contasBanc.filter(function(c){ return c.ativo && c.personaId===pid; }).sort(function(x, y){ return x.nome.localeCompare(y.nome); })[0]; };
      ff.personas.filter(function(p){ return p.ativo && p.tipo==="SOCIO" && ff.prolabore[p.id]; }).forEach(function(p){ var vg = vigenciaEm(ff, p.id, ym); if(!vg) return; var cbp = bancoPad(p.id);
        var parts = vg.valor1 ? [["d1", vg.dia1, vg.valor1, "Pró-labore (adiantamento)"], ["d2", vg.dia2, vg.valor2, "Pró-labore (saldo)"]] : [["d1", 5, vg.liquido, "Pró-labore"]];
        parts.forEach(function(x){ var cid = "prolabore_"+p.id+"_"+x[0], c = conta(cid); if(!c){ c = {id:cid, personaId:p.id, descricao:x[3], categoria:"PRO_LABORE", contaBancId:cbp ? cbp.id : "", dia:x[1], forma:"PIX", beneficiario:p.nome, obs:"", encerraEm:null}; ff.contas.push(c); ff.parcelas[cid] = {}; } else c.dia = x[1];
          if(!ff.parcelas[cid][ym]){ ff.parcelas[cid][ym] = {valor:x[2], pagamentos:[]}; criadas++; } }); });
      return ok(criadas ? criadas+" conta(s) de pró-labore geradas" : "Nada novo para gerar neste mês", "Pró-labore", "Gerou contas do mês", nomeMes(ym), criadas+" nova(s)"); }
    // ---- PIX das revendedoras
    case "pix_meta": { ff.pixMeta[a.personaId+"|"+a.ym] = r2(a.valor); return ok("Meta salva", "PIX revendedoras", "Definiu meta de PIX", nomeP(a.personaId)+" · "+nomeMes(a.ym), money(a.valor)); }
    case "pix_add": { var pv2 = r2(a.valor); if(!a.personaId || !a.data || !(pv2>0)) return recusa("Informe data, valor e pessoa."); var l = {id:uid("px"), personaId:a.personaId, data:a.data, valor:pv2, origem:String(a.origem||"").trim(), contaId:a.contaId||"", forma:a.forma||"PIX", auditoria:"PENDENTE", auditadoPor:""}; ff.pix.push(l); syncRepasse(l);
      return ok("PIX anotado (aguardando conferência)", "PIX revendedoras", "Lançou PIX", (l.origem||"sem nome")+" · "+nomeP(a.personaId), money(pv2)); }
    case "pix_set": { var lx = ff.pix.find(function(x){ return x.id===a.id; }); if(!lx) return recusa("PIX não encontrado."); Object.assign(lx, a.patch); if(a.patch.valor!==undefined) lx.valor = r2(lx.valor); syncRepasse(lx); return ok("PIX atualizado", "PIX revendedoras", "Editou PIX", lx.origem||"sem nome"); }
    case "pix_del": { var ld = ff.pix.find(function(x){ return x.id===a.id; }); if(!ld) return recusa("PIX não encontrado."); ff.pix = ff.pix.filter(function(x){ return x.id!==a.id; }); ff.repasses = ff.repasses.filter(function(r){ return r.origemPixLancId!==a.id; }); return ok("PIX excluído", "PIX revendedoras", "Excluiu PIX", ld.origem||"sem nome", money(ld.valor)); }
    case "pix_aud": { var la = ff.pix.find(function(x){ return x.id===a.id; }); if(!la) return recusa("PIX não encontrado."); la.auditoria = a.auditoria; la.auditadoPor = por; return ok("Conferência salva", "PIX revendedoras", a.auditoria==="CONFIRMADO" ? "Confirmou PIX" : a.auditoria==="REJEITADO" ? "Rejeitou PIX" : "Marcou PIX como aguardando", la.origem||"sem nome", money(la.valor)); }
    // ---- prestadores
    case "prest_add": { var pn = String(a.nome||"").trim(); if(!pn) return recusa("Informe o nome."); ff.prest.push({id:uid("pr"), nome:pn, servico:a.servico||"", chavePix:a.chavePix||"", obs:"", responsavelId:a.responsavelId||"", ativo:true}); return ok("Prestador criado", "Prestadores", "Criou prestador", pn); }
    case "prest_set": { var pt = ff.prest.find(function(x){ return x.id===a.id; }); if(!pt) return recusa("Prestador não encontrado."); Object.assign(pt, a.patch); return ok("Salvo", "Prestadores", a.patch.ativo===false ? "Finalizou prestador" : a.patch.ativo===true ? "Reabriu prestador" : "Editou prestador", pt.nome); }
    case "prest_del": { var px = ff.prest.find(function(x){ return x.id===a.id; }); if(!px) return recusa("Prestador não encontrado."); ff.prest = ff.prest.filter(function(x){ return x.id!==a.id; }); ff.dividas = ff.dividas.filter(function(x){ return x.prestId!==a.id; }); ff.repasses = ff.repasses.filter(function(x){ return x.prestId!==a.id; }); ff.contasBanc.forEach(function(c){ if(c.prestadorId===a.id) c.prestadorId = ""; }); return ok("Prestador excluído", "Prestadores", "Excluiu prestador", px.nome, "com dívidas e repasses"); }
    case "divida_add": { var dv = r2(a.valor); if(!a.prestId || !a.data || !(dv>0)) return recusa("Informe prestador, data e valor."); ff.dividas.push({id:uid("dv"), prestId:a.prestId, valor:dv, data:a.data, prazo:a.prazo||""}); var pd = ff.prest.find(function(x){ return x.id===a.prestId; }); return ok("Dívida lançada", "Prestadores", "Lançou dívida", pd ? pd.nome : "", money(dv)); }
    case "divida_del": { var dd = ff.dividas.find(function(x){ return x.id===a.id; }); if(!dd) return recusa("Não encontrada."); ff.dividas = ff.dividas.filter(function(x){ return x.id!==a.id; }); return ok("Dívida excluída", "Prestadores", "Excluiu dívida", money(dd.valor)); }
    case "repasse_add": { var rv = r2(a.valor); if(!a.prestId || !a.data || !(rv>0)) return recusa("Informe prestador, data e valor."); if(!String(a.origem||"").trim()) return recusa("Informe quem pagou."); var pxr = ff.prest.find(function(x){ return x.id===a.prestId; });
      if(a.pixRevendedora && (!pxr || !pxr.responsavelId)) return recusa("Defina o sócio responsável do prestador para contar como PIX de revendedora.");
      ff.repasses.push({id:uid("rp"), prestId:a.prestId, valor:rv, data:a.data, origem:String(a.origem).trim(), forma:a.forma||"PIX", conta:a.contaTxt||"", chavePixDestino:a.chavePixDestino||(pxr ? pxr.chavePix : ""), origemPixPersonaId:a.pixRevendedora ? pxr.responsavelId : ""}); return ok("Repasse lançado", "Prestadores", "Lançou repasse", pxr ? pxr.nome : "", money(rv)); }
    case "repasse_del": { var rd = ff.repasses.find(function(x){ return x.id===a.id; }); if(!rd) return recusa("Não encontrado."); if(rd.origemPixLancId) return recusa("Esse repasse veio de um PIX: edite ou exclua o PIX."); ff.repasses = ff.repasses.filter(function(x){ return x.id!==a.id; }); return ok("Repasse excluído", "Prestadores", "Excluiu repasse", money(rd.valor)); }
    // ---- alertas, fechamento
    case "regra_add": { if(!a.tipo || !(Number(a.limite)>0)) return recusa("Escolha o tipo e um limite maior que zero."); ff.regras.push({id:uid("rg"), tipo:a.tipo, limite:Number(a.limite), personaId:a.personaId||"", ativo:true}); return ok("Regra criada", "Alertas", "Criou regra de alerta", a.tipo, String(a.limite)); }
    case "regra_set": { var rg = ff.regras.find(function(x){ return x.id===a.id; }); if(!rg) return recusa("Regra não encontrada."); Object.assign(rg, a.patch); return ok("Salvo", "Alertas", "Editou regra de alerta", rg.tipo); }
    case "regra_del": { ff.regras = ff.regras.filter(function(x){ return x.id!==a.id; }); return ok("Regra excluída", "Alertas", "Excluiu regra de alerta", ""); }
    case "fechar": { if(ff.fechamentos[a.ym]) return recusa("Esse mês já está fechado. Reabra para fechar de novo."); ff.fechamentos[a.ym] = {snapshot:relatorioMes(ff, a.ym), em:Date.now(), por:por}; return ok("Mês fechado e guardado", "Relatório", "Fechou o mês", nomeMes(a.ym)); }
    case "reabrir": { if(!ff.fechamentos[a.ym]) return recusa("Esse mês não está fechado."); delete ff.fechamentos[a.ym]; return ok("Mês reaberto", "Relatório", "Reabriu o mês", nomeMes(a.ym)); }
  }
  return recusa("Ação desconhecida.");
}

export { ultimoDia, MESES, FORMAS, FORMAS_REPASSE, TIPOS_REGRA, ACESSO_FF, r2, hojeIso, hojeYm, somaMes, vencIso, nomeMes, br, diasEntre, semanaDoDia, chaveCategoria, ffDemo, ffLocal, FAMILIA4, daPessoa, membrosFamilia, pagoDe, statusDe, parcelasDe, janela, pixDoMes, pixDivisao,
  totaisPersona, saldoPrestador, vigenciaEm, liquidoDe, alertasDe, relatorioMes, ffReduz };
