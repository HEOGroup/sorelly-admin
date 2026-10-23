import { globLocal } from "@/lib/glob-local";
// Sorelly Admin · montagem — domain/pix-regras.js
// Chaves Pix e regras do Financeiro: decidem SOZINHAS a conta de cada pagamento do atendimento interno (a funcionária só informa forma e valor).
// Ordem: dinheiro e maquininha única entram já como pagos · Pix: 1) mesmo CNPJ do link/cartão da venda, 2) regras do Financeiro (em ordem), 3) sem resposta = fila para o Lucas/diretoria definirem.
// Pix em CNPJ diferente do link/cartão = "dividir venda" (aviso para a empresa dividir na Devmaster por causa do faturamento). Estado s.px. Chaves Pix só no navegador (repositório público).
import { CONTAS_PAGAMENTO } from "@/apps/montagem/domain/consignado";
import { contasDefinidas } from "@/apps/montagem/domain/atendimento-interno";

// Contas Pix reais do SorellyAdmin antigo (sem as chaves), só no arquivo local gitignored: preenche banco, CNPJ, favorecido e tipo das contas
var LOCAL_CONTAS = (function(){ try { var m = globLocal("apps/montagem/domain/pix-contas.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(x){ return null; } })();
// chaves Pix reais (só no arquivo local gitignored)
var LOCAL_CHAVES = (function(){ try { var m = globLocal("apps/montagem/domain/pix-chaves.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(x){ return null; } })();
// liga cada conta Pix à conta bancária do Caixa (Saldos bancários): serve para mostrar a chave lá e, depois, sugerir a conta pelo saldo mais negativo
var CAIXA_DE_PIX = {"PIX - SICREDI - SORELLY - 34":"sicredi_34", "PIX - ITAÚ - 34":"itau_emp_34", "PIX - CAIXA - 34":"caixa_34", "PIX - SAFRA - 34":"safra_34", "PIX - UNICRED - 34":"unicred_34", "PIX - SICREDI - SHOPPING 46":"sicredi_46", "PIX - STONE - 46":"stone_46", "PIX - BRADESCO - 46":"bradesco_46", "PIX - CAIXA - 46":"caixa_46", "PIX - SAFRA - SHOPPING - 46":"safra_46", "PIX - UNICRED - 46":"unicred_46", "PIX - SICREDI - SERENITY - 59":"sicredi_59", "PIX - SAFRA - SERENITY - 59":"safra_59", "PIX - BRADESCO - SERENITY - 59":"bradesco_59", "PIX - SICREDI - H&O":"sicredi_ho_app"};
var r2 = function(n){ return Math.round((n||0)*100)/100; };
var uid = function(p){ return p+Date.now().toString(36)+Math.floor(Math.random()*46656).toString(36); };
var CNPJS = ["34", "46", "59", "67"];
var TIPOS_CONTA = {empresa:["Empresa","#3B82F6"], familia:["Família / sócio","#EC4899"], fora:["Fora (fornecedor, prestador)","#F59E0B"]};
// adivinha o CNPJ pelo nome oficial da conta (ex.: "PIX - SICREDI - SERENITY - 59" = 59); o Financeiro corrige na tela
var cnpjDoTexto = function(t){ var s = String(t||"").toUpperCase(), m = s.match(/(?:^|[^0-9])(34|46|59|67)(?![0-9])/); return m ? m[1] : /AXIS/.test(s) ? "67" : /SERENITY/.test(s) ? "59" : ""; };
var tipoDoTexto = function(t){ var s = String(t||"").toUpperCase(); return /ANAMARIA|MARCO|MARCUS|LUCAS|ANA BEATRIZ|HABITA/.test(s) ? "familia" : /POINT|DEVMASTER|BANHO|TUCANO|ACRILICOS|CHARME|ELLO|LINDA|MADEIRA|OFFICE|PRESTADORES|REPRESENTANTES|H&O/.test(s) ? "fora" : "empresa"; };

function pxDemo(){
  return pxMigrar({v:1, maquininha:{ativa:true, nome:"GETNET - P"}, regras:[], reps:[], contas:CONTAS_PAGAMENTO.pix.map(function(c){
    return {id:c.label, label:c.label, cnpj:cnpjDoTexto(c.label), tipo:tipoDoTexto(c.label), banco:"", chave:"", padrao:false, ativa:true}; })}, null);
}
var contaPorLabel = function(px, label){ return (px.contas||[]).find(function(c){ return c.label===label; }) || null; };
// CNPJ de uma conta já escolhida (cadastro primeiro, depois o nome)
var cnpjDaConta = function(px, label){ var c = contaPorLabel(px, label); return (c && c.cnpj) || cnpjDoTexto(label); };
var pagamentos = function(lf){ return (lf.linhas||[]).filter(function(l){ return l.tipo==="pagamento"; }); };
var semConta = function(l){ var ps = l.partes||[]; return !contasDefinidas(l) && ps.every(function(p){ return !p.descricao; }) && !l.manual; };
var ehCartaoOuLink = function(l){ return l.forma==="link" || l.forma==="credito" || l.forma==="debito"; };
var cnpjsDe = function(px, linhas){ var o = {}; linhas.forEach(function(l){ (l.partes||[]).forEach(function(p){ var c = p.descricao ? cnpjDaConta(px, p.descricao) : ""; if(c) o[c] = 1; }); }); return Object.keys(o); };

// regra "quando": tudo o que estiver preenchido precisa valer (dinheiroPctMin = % do total pago em dinheiro; pixMin/pixMax = valor deste Pix; totalMin = total pago no atendimento)
function regraCasa(r, lf, linha){
  var q = r.quando || {}, pg = pagamentos(lf), total = pg.reduce(function(t, l){ return t+l.valor; }, 0), din = pg.filter(function(l){ return l.forma==="dinheiro"; }).reduce(function(t, l){ return t+l.valor; }, 0);
  var tem = function(k){ return q[k]!==undefined && q[k]!==null && q[k]!==""; };
  if(tem("dinheiroPctMin") && !(total>0 && din/total*100 >= Number(q.dinheiroPctMin)-0.0001)) return false;
  if(tem("pixMin") && !(linha.valor >= Number(q.pixMin))) return false;
  if(tem("pixMax") && !(linha.valor < Number(q.pixMax))) return false;
  if(tem("totalMin") && !(total >= Number(q.totalMin))) return false;
  return tem("dinheiroPctMin") || tem("pixMin") || tem("pixMax") || tem("totalMin");
}
// conta sugerida para um Pix: {conta, motivo} ou null (fica na fila)
function sugerirPix(px, lf, linha, todos){
  var outras = pagamentos(lf).filter(ehCartaoOuLink);
  if(outras.some(function(l){ return !contasDefinidas(l); })) return null;                       // link/cartão ainda sem conta: o Pix espera
  var cn = cnpjsDe(px, outras);
  if(cn.length>1) return null;                                                                    // link/cartão em CNPJs diferentes: alguém decide
  if(cn.length===1){
    var cands = (px.contas||[]).filter(function(c){ return c.ativa && c.cnpj===cn[0]; }), c1 = cands.find(function(c){ return c.padrao; }) || (cands.length===1 ? cands[0] : null);
    if(c1) return {conta:c1.label, motivo:"Mesmo CNPJ do link/cartão ("+cn[0]+")"};
    return null;
  }
  // venda sem link/cartão (ou já resolvida acima): conta fixa da representante, antes das regras gerais
  var rp = lf.origem==="rep" ? repPixDe(px, lf.por) : null, cf = rp ? contaFixaRep(px, rp) : null;
  if(cf && !repLimiteAtingido(rp, linha.valor, todos, lf)) return {conta:cf.label, repFixa:rp.representante, motivo:"Conta fixa de "+rp.representante+(rp.cnpj ? " (maquininha CNPJ "+rp.cnpj+")" : "")};
  var rs = px.regras||[];
  for(var i=0; i<rs.length; i++){ if(rs[i].ativa!==false && rs[i].destino && regraCasa(rs[i], lf, linha) && contaPorLabel(px, rs[i].destino)) return {conta:rs[i].destino, motivo:"Regra: "+rs[i].nome}; }
  return null;
}
// conta fixa da representante (px.reps: {representante, cnpj da maquininha dela, contaPix, obs}); a venda guarda só o primeiro nome (ex.: "Dayanne"), o cadastro pode ter o nome completo
var norm = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
function repPixDe(px, nome){
  var n = norm(nome), rs = (px.reps||[]).filter(function(r){ return r.contaPix || r.cnpj; }); if(!n) return null;
  var exato = rs.find(function(r){ return norm(r.representante)===n; }); if(exato) return exato;
  var ini = rs.filter(function(r){ return norm(r.representante).indexOf(n+" ")===0; }); return ini.length===1 ? ini[0] : null;
}
// conta Pix fixa da representante: a escolhida; senão a conta padrão do CNPJ da maquininha dela
function contaFixaRep(px, rp){
  var c = rp.contaPix ? contaPorLabel(px, rp.contaPix) : null;
  if(!c && rp.cnpj){ var cs = (px.contas||[]).filter(function(x){ return x.ativa && x.cnpj===rp.cnpj; }); c = cs.find(function(x){ return x.padrao; }) || (cs.length===1 ? cs[0] : null); }
  return c && c.ativa!==false ? c : null;
}
// limite da conta fixa: vale até uma data/hora (rp.ate) e/ou até um valor (rp.valorMax, contado a partir de rp.desde); passou = volta para as regras gerais
function pxRepEnviado(rp, todos, ate){ var t = 0; (todos||[]).forEach(function(x){ if(ate && x.id===ate.id) return; if((x.enviadoTs||0) < (rp.desde||0)) return; (x.linhas||[]).forEach(function(l){ if(l.tipo==="pagamento" && l.repFixa===rp.representante) t += l.valor; }); }); return r2(t); }
function repLimiteAtingido(rp, valor, todos, lf){
  if(rp.ate && Date.now() > new Date(rp.ate).getTime()) return true;
  var max = Number(rp.valorMax); return max>0 && pxRepEnviado(rp, todos, lf)+valor > max+0.005;
}
var parte = function(desc, v, ok){ return [{descricao:desc, valor:v, comprovante:null, ok:!!ok}]; };
// aplica o que dá para decidir sozinho; devolve o lançamento (mesmo objeto se nada mudou)
function pxAplicar(px, lf, todos){
  if(!px || !lf || lf.cancelado) return lf;
  var mud = false, linhas = lf.linhas.map(function(l){
    if(l.tipo!=="pagamento" || !semConta(l)) return l;
    if(l.forma==="dinheiro"){ mud = true; return Object.assign({}, l, {partes:parte("DINHEIRO", l.valor, true), enviada:true, auto:"Dinheiro: já pago"}); }
    if((l.forma==="credito" || l.forma==="debito") && px.maquininha && px.maquininha.ativa){ mud = true; return Object.assign({}, l, {partes:parte((l.forma==="credito" ? "CRÉDITO - " : "DÉBITO - ")+px.maquininha.nome, l.valor, true), enviada:true, auto:"Maquininha única: já pago"}); }
    return l;
  });
  var base = Object.assign({}, lf, {linhas:linhas});
  linhas = linhas.map(function(l){
    if(l.tipo!=="pagamento" || l.forma!=="pix" || !semConta(l)) return l;
    var s = sugerirPix(px, base, l, todos); if(!s) return l;
    mud = true; return Object.assign({}, l, {partes:parte(s.conta, l.valor, false), enviada:true, auto:s.motivo}, s.repFixa ? {repFixa:s.repFixa} : null);
  });
  return mud ? Object.assign({}, lf, {linhas:linhas}) : lf;
}
// venda para dividir: Pix num CNPJ diferente do link/cartão da mesma venda
function pxDividir(px, lf){
  var pg = pagamentos(lf), cartao = cnpjsDe(px, pg.filter(ehCartaoOuLink)), pix = cnpjsDe(px, pg.filter(function(l){ return l.forma==="pix"; }));
  if(!cartao.length || !pix.length) return null;
  var fora = pix.filter(function(c){ return cartao.indexOf(c)<0; });
  return fora.length ? {cartao:cartao, pix:fora} : null;
}

// devolve {patch, msg}; patch vazio + msg = recusado
// migração única (px.contasV): traz as contas do arquivo local; não sobrescreve o que o Financeiro já preencheu
function pxMigrar(px, s){
  if(!px) return px;
  if(px.contasV!==1 && LOCAL_CONTAS){
    LOCAL_CONTAS.forEach(function(x){ var c = contaPorLabel(px, x.label);
      if(!c){ c = {id:x.label, label:x.label, cnpj:x.cnpj||"", tipo:x.tipo||tipoDoTexto(x.label), banco:"", chave:"", padrao:false, ativa:true}; px.contas.push(c); }
      if(!c.banco) c.banco = x.banco; if(x.cnpj) c.cnpj = x.cnpj; c.tipo = x.tipo || c.tipo; c.favorecido = x.favorecido; c.tipoChave = x.tipoChave; });
    px.contasV = 1;
  }
  if(px.chavesV!==1 && LOCAL_CHAVES){
    LOCAL_CHAVES.forEach(function(x){ x.labels.forEach(function(lb){ var c = contaPorLabel(px, lb);
      if(!c){ c = {id:lb, label:lb, cnpj:cnpjDoTexto(lb), tipo:tipoDoTexto(lb), banco:"", chave:"", padrao:false, ativa:true}; px.contas.push(c); }
      if(!c.chave) c.chave = x.chave; if(!c.banco) c.banco = x.banco; if(!c.favorecido) c.favorecido = x.favorecido; if(!c.tipoChave) c.tipoChave = x.tipoChave; if(x.agencia && !c.agencia) c.agencia = x.agencia; if(x.conta && !c.numConta) c.numConta = x.conta; }); });
    px.chavesV = 1;
  }
  px.contas.forEach(function(c){ if(!c.caixaId && CAIXA_DE_PIX[c.label]) c.caixaId = CAIXA_DE_PIX[c.label]; });
  // toda conta Pix cadastrada precisa aparecer na lista de contas dos pagamentos (formas de pagamento)
  if(s && s.formasPagamento) s.formasPagamento = s.formasPagamento.map(function(f){ if(f.k!=="pix") return f; var falta = px.contas.map(function(c){ return c.label; }).filter(function(l){ return f.descricoes.indexOf(l)<0; }); return falta.length ? Object.assign({}, f, {descricoes:f.descricoes.concat(falta)}) : f; });
  return px;
}
function pxReduz(s, a){
  var px = JSON.parse(JSON.stringify(s.px)), recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg, extra){ return {patch:Object.assign({px:px}, extra||{}), msg:msg}; };
  switch(a.op){
    case "conta_add": { var lb = String(a.label||"").trim(); if(!lb) return recusa("Informe o nome da conta (ex.: PIX - ITAÚ - 59)."); if(contaPorLabel(px, lb)) return recusa("Essa conta já existe.");
      px.contas.push({id:lb, label:lb, cnpj:a.cnpj||cnpjDoTexto(lb), tipo:a.tipo||tipoDoTexto(lb), banco:a.banco||"", chave:a.chave||"", padrao:false, ativa:true});
      var fp = s.formasPagamento && s.formasPagamento.map(function(f){ return f.k==="pix" && f.descricoes.indexOf(lb)<0 ? Object.assign({}, f, {descricoes:f.descricoes.concat([lb])}) : f; });
      return ok("Conta criada", fp ? {formasPagamento:fp} : null); }
    case "conta_set": { var c = contaPorLabel(px, a.id); if(!c) return recusa("Conta não encontrada."); Object.assign(c, a.patch);
      if(a.patch.padrao){ px.contas.forEach(function(o){ if(o!==c && o.cnpj===c.cnpj) o.padrao = false; }); } return ok(); }
    case "caixa_chave": { var cc = (px.contas||[]).find(function(x){ return x.caixaId===a.caixaId; });
      if(!cc){ cc = {id:"PIX - "+a.nome, label:"PIX - "+a.nome, cnpj:/^(34|46|59|67)$/.test(a.cnpj) ? a.cnpj : "", tipo:"empresa", banco:"", chave:"", caixaId:a.caixaId, padrao:false, ativa:true}; px.contas.push(cc); }
      var mudou = a.chave!==undefined && a.chave!==(cc.chave||""), tmudou = !!a.tipo && a.tipo!==(cc.chaveTipo||"");
      if(a.chave!==undefined) cc.chave = a.chave; if(a.tipo!==undefined) cc.chaveTipo = a.tipo;
      if(mudou || tmudou){ cc.chaveEm = a.em || 0; cc.chavePor = a.por || ""; }   // data e quem alterou a chave
      return ok(a.chave ? "Chave Pix salva" : mudou ? "Chave Pix removida" : undefined); }
    case "maq_set": { px.maquininha = Object.assign({}, px.maquininha, a.patch); return ok(); }
    case "rep_set": { px.reps = px.reps||[]; var nm0 = String(a.representante||"").trim(); if(!nm0) return recusa("Escolha a representante.");
      var rp0 = px.reps.find(function(x){ return x.representante===nm0; }); if(!rp0){ rp0 = {representante:nm0, cnpj:"", contaPix:"", obs:""}; px.reps.push(rp0); }
      Object.assign(rp0, a.patch||{}); if(a.patch && ("valorMax" in a.patch || "contaPix" in a.patch)) rp0.desde = Date.now();   // mudou a conta ou o limite de valor: recomeça a contagem do que já foi enviado
      if(!rp0.cnpj && !rp0.contaPix && !rp0.obs && !rp0.ate && !rp0.valorMax) px.reps = px.reps.filter(function(x){ return x!==rp0; }); return ok(); }
    case "regra_add": { var nm = String(a.nome||"").trim(); if(!nm) return recusa("Dê um nome para a regra."); px.regras.push({id:uid("r"), nome:nm, ativa:true, quando:a.quando||{}, destino:a.destino||""}); return ok("Regra criada"); }
    case "regra_set": { var r = px.regras.find(function(x){ return x.id===a.id; }); if(!r) return recusa("Regra não encontrada."); Object.assign(r, a.patch); return ok(); }
    case "regra_del": { px.regras = px.regras.filter(function(x){ return x.id!==a.id; }); return ok("Regra excluída"); }
    case "regra_mover": { var i = px.regras.findIndex(function(x){ return x.id===a.id; }), j = i+(a.dir||0); if(i<0 || j<0 || j>=px.regras.length) return recusa(""); var t = px.regras[i]; px.regras[i] = px.regras[j]; px.regras[j] = t; return ok(); }
  }
  return recusa("Ação desconhecida.");
}
// chaves Pix das contas bancárias lidas do admin antigo (arquivo local gitignored): entram com a data de hoje e "alterado por Marcus"
var CHAVES_ADMIN = (function(){ try { var m = globLocal("apps/montagem/domain/pix-chaves-admin.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(x){ return null; } })();
var TEM_CHAVES_ADMIN = !!(CHAVES_ADMIN && CHAVES_ADMIN.chaves && CHAVES_ADMIN.chaves.length);
var normConta = function(n){ return String(n||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/serenety/g,"serenity").replace(/[^a-z0-9&]/g,""); };
function pxAplicarChavesAdmin(px, contasCaixa, por, agora){
  if(!TEM_CHAVES_ADMIN || !px) return px;
  CHAVES_ADMIN.chaves.forEach(function(x){
    var conta = (contasCaixa||[]).find(function(c){ return normConta(c.nome)===normConta(x[0]); }); if(!conta) return;
    var cc = (px.contas||[]).find(function(k){ return k.caixaId===conta.id; });
    if(!cc){ cc = {id:"PIX - "+conta.nome, label:"PIX - "+conta.nome, cnpj:/^(34|46|59|67)$/.test(conta.bloco) ? conta.bloco : "", tipo:"empresa", banco:"", chave:"", caixaId:conta.id, padrao:false, ativa:true}; px.contas.push(cc); }
    if(cc.chaveEm) return;   // já preenchida ou editada: não sobrescreve
    cc.chave = x[2]; cc.chaveTipo = x[1]; cc.chaveEm = agora; cc.chavePor = por;
  });
  return px;
}
// chaves de pessoal (família), prestador da empresa e fornecedores: ficam em s.cp.chaves (id → {grupo, nome, banco, servico, chave, chaveTipo, chaveEm, chavePor})
function cpAplicarExtras(cp, por, agora){
  if(!cp || !CHAVES_ADMIN || !CHAVES_ADMIN.extras) return cp;
  var mapa = Object.assign({}, cp.chaves);
  delete mapa["forn|Beaté Cosméticos"]; delete mapa["pes|Marco Antonio|Itaú cpf"];   // mudaram de lugar
  CHAVES_ADMIN.extras.forEach(function(x){ if(mapa[x[0]] && mapa[x[0]].chaveEm) return; mapa[x[0]] = Object.assign({}, mapa[x[0]], {grupo:x[1], nome:x[2], banco:x[3], servico:x[4], chaveTipo:x[5], chave:x[6], chaveEm:agora, chavePor:por}); });
  return Object.assign({}, cp, {chaves:mapa});
}
// conta Pix (com chave) ligada a uma conta bancária do Caixa
function contaDaCaixa(px, caixaId){ return px ? (px.contas||[]).find(function(c){ return c.caixaId===caixaId; }) || null : null; }
function pixDaCaixa(px, caixaId){ return px ? (px.contas||[]).find(function(c){ return c.caixaId===caixaId && c.chave; }) || null : null; }
export {cpAplicarExtras, TEM_CHAVES_ADMIN, pxAplicarChavesAdmin, contaDaCaixa, pixDaCaixa, pxMigrar, repPixDe, contaFixaRep, CNPJS, TIPOS_CONTA, pxDemo, pxReduz, pxAplicar, pxDividir, sugerirPix, cnpjDaConta, contaPorLabel, pxRepEnviado };
