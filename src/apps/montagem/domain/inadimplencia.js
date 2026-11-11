// Sorelly Admin · montagem — domain/inadimplencia.js
// Setor de Inadimplência (11/11/2026, pedido do Marcus; a Amanda de Miranda opera). Substitui a planilha "Negociações Jurídico".
// Estado s.inad (ação INAD), guardado no servidor no módulo "inad", UMA CHAVE POR REGISTRO: d_<id> dívida, p_<id> pagamento, n_<id> negativação (Serasa), k_<id> kit em atraso, m = configuração.
// Assim duas pessoas mexendo em registros diferentes não se apagam e uma tela antiga nunca grava a lista inteira por cima. Dados reais só no servidor, nunca no Git.
// Regras do setor: docs/negocio/INADIMPLENCIA-REGRAS-DO-SETOR.md. O que é automático: saldo após pagamento confirmado, Verificar com parcela vencida, Quitada com saldo zero.
// O que NUNCA é automático: multa, juros, Serasa, Jurídico, cancelar acordo.

import { devidoDe, faltaDe } from "@/apps/montagem/domain/comissoes";

var r2 = function(v){ return Math.round((Number(v)||0)*100)/100; };
var trim = function(v){ return String(v==null ? "" : v).trim(); };
var ehDia = function(v){ return /^\d{4}-\d{2}-\d{2}$/.test(String(v||"")); };
function hojeIso(){ var d = new Date(); return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2); }
function agoraTxt(){ var d = new Date(); return hojeIso()+" "+("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2); }
function diasEntre(a, b){ if(!ehDia(a) || !ehDia(b)) return 0; return Math.round((Date.parse(b+"T12:00:00Z")-Date.parse(a+"T12:00:00Z"))/86400000); }
function maisDias(iso, n){ var d = new Date(Date.parse(iso+"T12:00:00Z")+n*86400000); return d.toISOString().slice(0, 10); }
function maisMeses(iso, n){ var a = +iso.slice(0, 4), m = +iso.slice(5, 7)-1+n, dia = +iso.slice(8, 10); a += Math.floor(m/12); m = ((m%12)+12)%12; var ult = new Date(Date.UTC(a, m+1, 0)).getUTCDate(); return a+"-"+("0"+(m+1)).slice(-2)+"-"+("0"+Math.min(dia, ult)).slice(-2); }
function formatarDia(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso||"")); return m ? m[3]+"/"+m[2]+"/"+m[1] : ""; }
var MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
function rotuloMes(mes){ return /^\d{4}-\d{2}$/.test(String(mes||"")) ? MESES[+mes.slice(5, 7)-1]+" de "+mes.slice(0, 4) : ""; }

// Listas (a Amanda ajusta depois; valores da planilha foram mantidos)
var SITUACOES = ["OK", "Negociação", "Verificar", "Não responde", "Próximo mês", "Pagará no acerto", "Negativada", "Executar nota", "Perda", "Pedir a baixa", "Quitada"];
var ETAPAS = ["1º contato", "2º contato", "3º contato", "OK", "Verificar", "P/A", "B.O.", "Negativada", "Execução", "Baixa", "Concluído"];
var QUEM_COBRA = ["Representante", "Setor", "Marcus", "Nickolas", "Empresa"];
var NOTAS = ["Assinada", "Não assinada", "Perdida", "Verificar"];
var POS_VENDA = ["Cliente ativo", "Pode retornar", "Não retornar", "Verificar"];
var FORMAS = [["pix", "Pix"], ["cartao", "Cartão de crédito (link)"]];
var CONTATOS = ["Respondeu e negociou", "Respondeu sem data", "Não respondeu", "Recusou negociar", "Número errado"];
var COR_SIT = {"OK":"text-emerald-400", "Quitada":"text-emerald-400", "Negociação":"text-amber-300", "Não responde":"text-amber-300", "Próximo mês":"text-amber-300", "Pagará no acerto":"text-amber-300", "Pedir a baixa":"text-amber-300",
  "Verificar":"text-red-400", "Negativada":"text-red-400", "Executar nota":"text-red-400", "Perda":"text-red-400"};
// Regras de negociação (texto do Marcus, 11/11/2026): Pix parcelado conforme o valor, parcela mínima, cartão em até 6 vezes
var CFG_PADRAO = {parcelaMinima:150, cartaoMax:6, pixFaixas:[{ate:300, max:2}, {ate:600, max:3}, {ate:1200, max:4}], prazoRepDias:7, serasaDias:30, contato2Dias:2, contato3Dias:7};

function inadVazio(){ return {v:1, dividas:[], pagamentos:[], serasa:[], kits:[], cfg:JSON.parse(JSON.stringify(CFG_PADRAO))}; }
function inadMigrar(x){
  if(!x || typeof x!=="object") return inadVazio();
  var o = Object.assign({}, x); o.v = o.v || 1;
  ["dividas", "pagamentos", "serasa", "kits"].forEach(function(k){ if(!Array.isArray(o[k])) o[k] = []; });
  o.cfg = Object.assign({}, CFG_PADRAO, o.cfg||{}); return o;
}

// ---------- servidor: uma chave por registro ----------
var PREFIXO = {d_:"dividas", p_:"pagamentos", n_:"serasa", k_:"kits"};
var CACHE = new WeakMap();
function inadFatia(inad){
  if(!inad) return {}; var c = CACHE.get(inad); if(c) return c;
  var o = {m:{cfg:inad.cfg||{}}};
  Object.keys(PREFIXO).forEach(function(pre){ (inad[PREFIXO[pre]]||[]).forEach(function(x){ if(x && x.id && !x.demo) o[pre+x.id] = x; }); });
  CACHE.set(inad, o); return o;
}
// junta o que veio do servidor (null = registro tirado)
function inadDoServidor(inad, conteudo){
  var o = inadMigrar(inad), mexeu = {};
  Object.keys(conteudo||{}).forEach(function(k){ var v = conteudo[k];
    if(k==="m"){ if(v && v.cfg) o.cfg = Object.assign({}, CFG_PADRAO, v.cfg); return; }
    var lista = PREFIXO[k.slice(0, 2)]; if(!lista) return;
    if(!mexeu[lista]){ mexeu[lista] = {arr:o[lista].slice(), ix:new Map()}; mexeu[lista].arr.forEach(function(x, i){ mexeu[lista].ix.set(x.id, i); }); }
    var m = mexeu[lista], id = k.slice(2), i = m.ix.get(id);
    if(v===null){ if(i!==undefined) m.arr[i] = null; } else if(i!==undefined) m.arr[i] = v; else { m.ix.set(id, m.arr.length); m.arr.push(v); } });
  Object.keys(mexeu).forEach(function(l){ o[l] = mexeu[l].arr.filter(Boolean); });
  o.doServidor = true; return o;
}

// ---------- contas ----------
// pagamentos lançados NO SISTEMA e confirmados abatem o saldo; os da planilha já estão dentro do "falta" importado (faltaBase)
// noAcerto = pagamento de dívida nascida do acerto: ele entra no ACERTO (ação INAD_PAGAR) e o pendente do acerto já baixa a dívida; aqui não abate de novo
function indicePagos(inad){ var m = {}; (inad.pagamentos||[]).forEach(function(p){ if(p.novo && p.confirmado && p.dividaId && !p.noAcerto) m[p.dividaId] = r2((m[p.dividaId]||0)+(p.valor||0)); }); return m; }
function totalDe(d){ return r2((d.valor||0)+(d.acrescimos||[]).reduce(function(t, a){ return t+(a.valor||0); }, 0)); }
function saldoDe(d, pagos){ var base = d.faltaBase!=null ? d.faltaBase : totalDe(d); return Math.max(0, r2(base+(d.acrescimos||[]).reduce(function(t, a){ return t+(a.valor||0); }, 0)-((pagos||{})[d.id]||0))); }
function parcelaVencida(d, hoje){ var ps = (d.acordo && d.acordo.parcelas) || []; return ps.find(function(p){ return !p.pagoEm && p.venc && p.venc<hoje; }) || null; }
// Situação mostrada: Quitada e Verificar entram sozinhas; o resto é o que o setor marcou
function situacaoDe(d, pagos, hoje){
  if(saldoDe(d, pagos)<=0.005) return d.sit==="Pedir a baixa" ? "Pedir a baixa" : "Quitada";
  if(d.sit!=="Negativada" && d.sit!=="Executar nota" && d.sit!=="Perda" && parcelaVencida(d, hoje || hojeIso())) return "Verificar";
  return d.sit==="Quitada" ? "Verificar" : (d.sit || "Verificar");
}
function aberta(d, pagos){ return saldoDe(d, pagos)>0.005 && d.sit!=="Perda"; }
// Próxima ação da dívida (texto, data e peso para a Cobrança do dia)
function proximaAcao(d, pagos, cfg, hoje){
  hoje = hoje || hojeIso(); cfg = cfg || CFG_PADRAO;
  var saldo = saldoDe(d, pagos); if(saldo<=0.005) return {txt:d.sit==="Pedir a baixa" ? "Pedir a baixa no Serasa" : "", tipo:d.sit==="Pedir a baixa" ? "Serasa" : "", dias:0};
  if(d.sit==="Perda") return {txt:"", tipo:"", dias:0};
  var ps = (d.acordo && d.acordo.parcelas) || [], venc = parcelaVencida(d, hoje);
  if(venc){ var dv = diasEntre(venc.venc, hoje); return {txt:"Parcela vencida há "+dv+" dia"+(dv===1 ? "" : "s"), tipo:"Parcela vencida", dias:dv, data:venc.venc}; }
  var prox = ps.find(function(p){ return !p.pagoEm; });
  if(prox){ var i = ps.indexOf(prox)+1; return {txt:"Parcela "+i+" de "+ps.length+" · "+formatarDia(prox.venc), tipo:"", dias:0, data:prox.venc}; }
  var idade = d.data ? diasEntre(d.data, hoje) : 0;
  if(d.sit==="Negativada" || d.sit==="Executar nota") return {txt:d.sit==="Negativada" ? "Negativada · avaliar Jurídico" : "Executar a nota promissória", tipo:"", dias:idade};
  if(d.cobra==="Representante"){ var falta = cfg.prazoRepDias-idade; return falta>=0 ? {txt:"Prazo da representante: "+(falta===0 ? "acaba hoje" : "faltam "+falta+" dia"+(falta===1 ? "" : "s")), tipo:"", dias:0} : {txt:"Prazo da representante passou há "+(-falta)+" dia"+(falta===-1 ? "" : "s"), tipo:"Prazo da representante", dias:-falta}; }
  var cs = d.contatos || [], ult = cs.length ? cs[cs.length-1] : null;
  if(idade>=cfg.serasaDias) return {txt:"Analisar Serasa · "+idade+" dias em aberto", tipo:"Analisar Serasa", dias:idade};
  if(!ult) return {txt:"Fazer o 1º contato", tipo:"Contato", dias:idade};
  var espera = cs.length===1 ? cfg.contato2Dias : cfg.contato3Dias, quando = maisDias(String(ult.em).slice(0, 10), espera);
  if(cs.length>=3) return {txt:"3 contatos feitos · analisar próximas medidas", tipo:quando<=hoje ? "Contato" : "", dias:idade};
  return {txt:(cs.length+1)+"º contato · "+formatarDia(quando), tipo:quando<=hoje ? "Contato" : "", dias:Math.max(0, diasEntre(quando, hoje)), data:quando};
}
// Regra do Pix parcelado: devolve o máximo de parcelas e as exceções do acordo proposto
function maxParcelasPix(valor, cfg){ cfg = cfg || CFG_PADRAO; var f = (cfg.pixFaixas||[]).find(function(x){ return valor<=x.ate; }); return f ? f.max : 0; }   // 0 = acima da última faixa: analisar ou cartão
function excecoesDoAcordo(d, forma, n, valorParcela, saldo, cfg){
  cfg = cfg || CFG_PADRAO; var ex = [];
  if(forma==="pix"){ var mx = maxParcelasPix(saldo, cfg); if(n>1 && mx===0) ex.push("Pix parcelado acima de R$ "+cfg.pixFaixas[cfg.pixFaixas.length-1].ate.toLocaleString("pt-BR")+",00"); else if(mx && n>mx) ex.push("Mais de "+mx+" parcelas no Pix para este valor");
    if(n>1 && valorParcela<cfg.parcelaMinima) ex.push("Parcela abaixo de R$ "+cfg.parcelaMinima+",00");
    if((d.acordosAnt||[]).some(function(a){ return a.forma==="pix" && a.descumprido; })) ex.push("Novo Pix parcelado depois de acordo descumprido"); }
  else if(n>cfg.cartaoMax) ex.push("Mais de "+cfg.cartaoMax+" vezes no cartão");
  if((d.acordosAnt||[]).length>=1) ex.push("Segunda renegociação");
  return ex;
}
function gerarParcelas(saldo, n, primeira){ var base = Math.floor(saldo/n*100)/100, ps = []; for(var i=0;i<n;i++) ps.push({venc:maisMeses(primeira, i), valor:i===n-1 ? r2(saldo-base*(n-1)) : base}); return ps; }

// ---------- relatórios: a dívida conta no mês em que NASCEU; o pagamento, no mês em que ENTROU ----------
function mesDaDivida(d){ return d.mes || String(d.data||"").slice(0, 7); }
function mesDoPagamento(p){ return ehDia(p.data) ? p.data.slice(0, 7) : (p.mes || ""); }
function relatorioMensal(inad, ano){
  var pagos = indicePagos(inad), hoje = hojeIso(), ms = {};
  var linha = function(m){ return ms[m] || (ms[m] = {mes:m, novas:0, valor:0, pagamentos:0, recuperado:0, negociacao:0, semRetorno:0, saldo:0}); };
  for(var i=1;i<=12;i++) linha(ano+"-"+("0"+i).slice(-2));
  (inad.dividas||[]).forEach(function(d){ var m = mesDaDivida(d); if(m.slice(0, 4)!==String(ano)) return; var l = linha(m), sd = saldoDe(d, pagos), st = situacaoDe(d, pagos, hoje);
    l.novas++; l.valor += d.valor||0; l.saldo += sd; if(sd>0.005 && (st==="OK" || st==="Negociação" || st==="Próximo mês" || st==="Pagará no acerto")) l.negociacao += sd; if(sd>0.005 && st==="Não responde") l.semRetorno += sd; });
  (inad.pagamentos||[]).forEach(function(p){ var m = mesDoPagamento(p); if(m.slice(0, 4)!==String(ano) || (p.novo && !p.confirmado)) return; var l = linha(m); l.pagamentos++; l.recuperado += p.valor||0; });
  return Object.keys(ms).sort().map(function(m){ var l = ms[m]; ["valor", "recuperado", "negociacao", "semRetorno", "saldo"].forEach(function(k){ l[k] = r2(l[k]); }); l.pct = l.valor>0 ? Math.round((l.valor-l.saldo)/l.valor*1000)/10 : null; return l; });
}
function relatorioPorRep(inad, ano){
  var pagos = indicePagos(inad), rs = {};
  (inad.dividas||[]).forEach(function(d){ if(mesDaDivida(d).slice(0, 4)!==String(ano)) return; var k = trim(d.rep) || "(sem representante)", l = rs[k] || (rs[k] = {rep:k, qtd:0, valor:0, saldo:0}); l.qtd++; l.valor += d.valor||0; l.saldo += saldoDe(d, pagos); });
  return Object.keys(rs).map(function(k){ var l = rs[k]; l.valor = r2(l.valor); l.saldo = r2(l.saldo); return l; }).sort(function(a, b){ return b.qtd-a.qtd; });
}
function anosDe(inad){ var o = {}; (inad.dividas||[]).forEach(function(d){ var a = mesDaDivida(d).slice(0, 4); if(a) o[a] = 1; }); (inad.pagamentos||[]).forEach(function(p){ var a = mesDoPagamento(p).slice(0, 4); if(a) o[a] = 1; }); var l = Object.keys(o).sort().reverse(); return l.length ? l : [hojeIso().slice(0, 4)]; }

// ---------- ligação com o acerto (11/11/2026): a dívida nasce sozinha ----------
// Vale para acerto REAL (Atendimento Sorelly ou app da representante) a partir de NASCE_DESDE; os anteriores já estão na planilha trazida.
// O acerto manda no valor pendente: se ele cair por pagamento lançado no acerto, a dívida cai junto. Pagamento lançado na ficha da dívida abate só aqui.
var NASCE_DESDE = "2026-11-11";
function pendenciasDoAcerto(inad, acertos){
  var out = {criar:[], atualizar:[]}; if(!inad || !inad.doServidor) return out;
  var porAcerto = {}, porNome = {}; (inad.dividas||[]).forEach(function(d){ if(d.acertoId) porAcerto[d.acertoId] = d; else porNome[d.nome+"|"+d.data] = 1; });
  (acertos||[]).forEach(function(r){
    if(!r || r.tipo!=="acerto" || r.demo || !r.rev || !r.data || r.data<NASCE_DESDE) return;
    var interno = r.origem==="interno" && !!r.internoId; if(!interno && r.origem!=="app") return;
    var falta = faltaDe(r), d = porAcerto[r.id];
    if(d){ if(Math.abs((d.acertoFalta||0)-falta)>0.009) out.atualizar.push({id:d.id, falta:falta}); return; }
    var nome = String(r.rev).trim().toUpperCase(); if(falta<=0.009 || porNome[nome+"|"+r.data]) return;
    out.criar.push({id:"ac_"+r.id, acertoId:r.id, novo:true, data:r.data, mes:r.data.slice(0, 7), ano:+r.data.slice(0, 4), nome:nome, rep:interno ? "Sorelly" : trim(r.rep), cobra:interno ? "Setor" : "Representante",
      valor:falta, faltaBase:falta, acertoFalta:falta, pagoBase:0, sit:"Verificar", etapa:"1º contato", nota:"Verificar", contatos:[],
      origem:"Nasceu do acerto de "+formatarDia(r.data)+" ("+(interno ? "Atendimento Sorelly" : "representante "+trim(r.rep))+")", devidoAcerto:devidoDe(r)});
  });
  return out;
}

// ---------- ações ----------
function inadReduz(s, a){
  var inad = inadMigrar(s.inad), por = a.por || "—", agora = agoraTxt();
  var recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg){ return {patch:{inad:inad}, msg:msg}; };
  var troca = function(lista, id, f){ var i = inad[lista].findIndex(function(x){ return x.id===id; }); if(i<0) return null; inad[lista] = inad[lista].slice(); inad[lista][i] = f(Object.assign({}, inad[lista][i])); return inad[lista][i]; };
  var nota = function(d, txt){ d.hist = (d.hist||[]).concat([{em:agora, por:por, txt:txt}]); return d; };
  var novoId = function(letra){ return letra+Date.now().toString(36)+Math.floor(Math.random()*1296).toString(36); };
  switch(a.op){
    case "div_nova": {
      var nome = trim(a.nome), valor = r2(a.valor); if(!nome) return recusa("Informe o nome da devedora."); if(!(valor>0)) return recusa("Informe o valor da dívida."); if(!ehDia(a.data)) return recusa("Informe a data da dívida.");
      var d = {id:novoId("d"), novo:true, data:a.data, mes:a.data.slice(0, 7), ano:+a.data.slice(0, 4), nome:nome.toUpperCase(), rep:trim(a.rep), cobra:a.cobra || "Representante", valor:valor, faltaBase:valor, pagoBase:0,
        sit:"Verificar", etapa:"1º contato", nota:a.nota || "Assinada", condicional:trim(a.condicional), obs:trim(a.obs), origem:"Lançada no sistema por "+por, hist:[{em:agora, por:por, txt:"Dívida lançada."}], contatos:[]};
      inad.dividas = [d].concat(inad.dividas); return ok("Dívida lançada.");
    }
    case "div_campos": {   // situação, etapa, quem cobra, nota, pós-venda, representante, condicional, observação: tudo fica no histórico
      var antes = inad.dividas.find(function(x){ return x.id===a.id; }); if(!antes) return recusa("Dívida não encontrada.");
      var mud = Object.keys(a.campos||{}).filter(function(k){ return String(antes[k]==null ? "" : antes[k])!==String(a.campos[k]==null ? "" : a.campos[k]); }); if(!mud.length) return {patch:{}};
      troca("dividas", a.id, function(d){ mud.forEach(function(k){ d[k] = a.campos[k]; }); return nota(d, "Alterado: "+mud.map(function(k){ return (ROTULO[k]||k)+" de \""+(antes[k]==null || antes[k]==="" ? "vazio" : antes[k])+"\" para \""+(a.campos[k]==="" ? "vazio" : a.campos[k])+"\""; }).join("; ")+"."); });
      return ok("Salvo.");
    }
    case "hist": { if(!trim(a.txt)) return recusa("Escreva a observação."); if(!troca("dividas", a.id, function(d){ return nota(d, trim(a.txt)); })) return recusa("Dívida não encontrada."); return ok("Observação gravada."); }
    case "contato": {
      if(!trim(a.resultado)) return recusa("Escolha o resultado do contato.");
      if(!troca("dividas", a.id, function(d){ d.contatos = (d.contatos||[]).concat([{em:agora, por:por, resultado:a.resultado, obs:trim(a.obs)}]); var n = d.contatos.length; d.etapa = n>=3 ? "3º contato" : n===2 ? "2º contato" : "1º contato";
        if(a.resultado==="Não respondeu" && n>=2) d.sit = "Não responde"; return nota(d, n+"º contato: "+a.resultado+(trim(a.obs) ? " · "+trim(a.obs) : "")+"."); })) return recusa("Dívida não encontrada.");
      return ok("Contato registrado.");
    }
    case "acordo": {   // acordo novo: valor, forma e data de cada parcela são obrigatórios; fora das regras só com quem autorizou
      var dA = inad.dividas.find(function(x){ return x.id===a.id; }); if(!dA) return recusa("Dívida não encontrada.");
      var ps = (a.parcelas||[]).map(function(p){ return {venc:p.venc, valor:r2(p.valor)}; }); if(!ps.length || ps.some(function(p){ return !ehDia(p.venc) || !(p.valor>0); })) return recusa("Toda parcela precisa de valor e data.");
      var sd = saldoDe(dA, indicePagos(inad)), soma = r2(ps.reduce(function(t, p){ return t+p.valor; }, 0)); if(Math.abs(soma-sd)>0.01 && !trim(a.autorizadoPor)) return recusa("As parcelas somam R$ "+soma.toFixed(2).replace(".", ",")+" e o saldo é R$ "+sd.toFixed(2).replace(".", ",")+". Desconto só com autorização.");
      var ex = excecoesDoAcordo(dA, a.forma, ps.length, Math.min.apply(null, ps.map(function(p){ return p.valor; })), sd, inad.cfg); if(Math.abs(soma-sd)>0.01) ex.push("Desconto ou acréscimo sobre a dívida");
      if(a.forma==="pix" && ps[0].venc.slice(0, 7)>hojeIso().slice(0, 7)) ex.push("Primeira parcela fora do mês da negociação");
      if(ex.length && !trim(a.autorizadoPor)) return recusa("Fora das regras: "+ex.join("; ")+". Informe quem autorizou.");
      troca("dividas", a.id, function(d){ if(d.acordo) d.acordosAnt = (d.acordosAnt||[]).concat([Object.assign({}, d.acordo, {descumprido:!!parcelaVencida(d, hojeIso()), encerradoEm:agora})]);
        d.acordo = {forma:a.forma, parcelas:ps, criadoEm:agora, por:por, excecoes:ex, autorizadoPor:trim(a.autorizadoPor)}; d.sit = ps[0].venc.slice(0, 7)>hojeIso().slice(0, 7) ? "Próximo mês" : "OK"; d.etapa = "OK";
        return nota(d, "Acordo: "+ps.length+"x no "+(a.forma==="pix" ? "Pix" : "cartão")+" ("+ps.map(function(p){ return formatarDia(p.venc)+" R$ "+p.valor.toFixed(2).replace(".", ","); }).join(", ")+")"+(ex.length ? " · EXCEÇÃO autorizada por "+trim(a.autorizadoPor)+": "+ex.join("; ") : "")+"."); });
      return ok(ex.length ? "Acordo gravado como exceção." : "Acordo gravado.");
    }
    case "prorrogar": {   // 1 prorrogação por parcela, pedida antes do vencimento, com justificativa
      var dP = inad.dividas.find(function(x){ return x.id===a.id; }), pP = dP && dP.acordo && dP.acordo.parcelas[a.i]; if(!pP) return recusa("Parcela não encontrada."); if(!ehDia(a.venc) || a.venc<=pP.venc) return recusa("A nova data precisa ser depois do vencimento."); if(!trim(a.motivo)) return recusa("Escreva a justificativa.");
      if((pP.prorrogada || pP.venc<hojeIso()) && !trim(a.autorizadoPor)) return recusa(pP.prorrogada ? "Esta parcela já foi prorrogada uma vez. Só com autorização." : "A parcela já venceu. Prorrogação só com autorização.");
      troca("dividas", a.id, function(d){ var ac = Object.assign({}, d.acordo), l = ac.parcelas.slice(), de = l[a.i].venc; l[a.i] = Object.assign({}, l[a.i], {venc:a.venc, prorrogada:true}); ac.parcelas = l; d.acordo = ac;
        return nota(d, "Parcela "+(a.i+1)+" prorrogada de "+formatarDia(de)+" para "+formatarDia(a.venc)+". Motivo: "+trim(a.motivo)+(trim(a.autorizadoPor) ? " · autorizado por "+trim(a.autorizadoPor) : "")+"."); });
      return ok("Parcela prorrogada.");
    }
    case "acrescimo": {   // multa ou juros: só com autorização; o valor original fica guardado
      var vA = r2(a.valor); if(!(vA>0) || !trim(a.motivo) || !trim(a.autorizadoPor)) return recusa("Informe o valor, o motivo e quem autorizou.");
      if(!troca("dividas", a.id, function(d){ d.acrescimos = (d.acrescimos||[]).concat([{em:agora, por:por, valor:vA, motivo:trim(a.motivo), autorizadoPor:trim(a.autorizadoPor)}]); return nota(d, "Acréscimo de R$ "+vA.toFixed(2).replace(".", ",")+" ("+trim(a.motivo)+"), autorizado por "+trim(a.autorizadoPor)+"."); })) return recusa("Dívida não encontrada.");
      return ok("Acréscimo gravado.");
    }
    case "pag_novo": {   // pagamento sempre ligado a uma dívida; só abate o saldo quando confirmado
      var dG = inad.dividas.find(function(x){ return x.id===a.dividaId; }); if(!dG) return recusa("Escolha a dívida."); var vP = r2(a.valor); if(!(vP>0)) return recusa("Informe o valor pago."); if(!ehDia(a.data)) return recusa("Informe a data do pagamento."); if(!trim(a.quem)) return recusa("Informe quem recuperou o pagamento."); if(!trim(a.conta)) return recusa("Informe a conta de recebimento.");
      var p = {id:novoId("p"), novo:true, dividaId:dG.id, nome:dG.nome, dataDivida:dG.data, data:a.data, mes:a.data.slice(0, 7), valor:vP, quem:trim(a.quem), conta:trim(a.conta), comissao:a.comissao || (/rep/i.test(a.quem) ? "Sim" : "Não"),
        comprovante:trim(a.comprovante), obs:trim(a.obs), confirmado:!!a.confirmado, noAcerto:!!dG.acertoId, baixado:false, lancadoPor:por, lancadoEm:agora};
      inad.pagamentos = [p].concat(inad.pagamentos);
      troca("dividas", dG.id, function(d){ if(p.confirmado){ var ac = d.acordo; if(ac){ var l = ac.parcelas.slice(), i = l.findIndex(function(x){ return !x.pagoEm; }); if(i>=0){ l[i] = Object.assign({}, l[i], {pagoEm:a.data}); d.acordo = Object.assign({}, ac, {parcelas:l}); } } }
        return nota(d, "Pagamento de R$ "+vP.toFixed(2).replace(".", ",")+" em "+formatarDia(a.data)+" ("+p.conta+"), recuperado por "+p.quem+(p.confirmado ? ", confirmado." : ", aguardando confirmação.")); });
      var dF = inad.dividas.find(function(x){ return x.id===dG.id; }); if(p.confirmado && saldoDe(dF, indicePagos(inad))<=0.005) troca("dividas", dG.id, function(d){ var neg = d.sit==="Negativada"; d.sit = neg ? "Pedir a baixa" : "Quitada"; d.etapa = neg ? "Baixa" : "Concluído"; d.quitadaEm = a.data; return nota(d, neg ? "Dívida quitada. Falta pedir a baixa da restrição no Serasa." : "Dívida quitada."); });
      return ok(p.confirmado ? "Pagamento registrado e saldo atualizado." : "Pagamento registrado. Falta confirmar o recebimento.");
    }
    case "pag_campos": {   // confirmar recebimento, baixa na DevMaster, comissão, conta, observação
      var pA = inad.pagamentos.find(function(x){ return x.id===a.id; }); if(!pA) return recusa("Pagamento não encontrado.");
      troca("pagamentos", a.id, function(p){ Object.keys(a.campos||{}).forEach(function(k){ p[k] = a.campos[k]; }); if(a.campos.baixado!==undefined){ p.baixadoPor = a.campos.baixado ? por : ""; p.baixadoEm = a.campos.baixado ? agora : ""; } return p; });
      if(a.campos && a.campos.confirmado && pA.novo && !pA.confirmado && pA.dividaId){ var dC = inad.dividas.find(function(x){ return x.id===pA.dividaId; });
        if(dC){ troca("dividas", dC.id, function(d){ var ac = d.acordo; if(ac){ var l = ac.parcelas.slice(), i = l.findIndex(function(x){ return !x.pagoEm; }); if(i>=0){ l[i] = Object.assign({}, l[i], {pagoEm:pA.data}); d.acordo = Object.assign({}, ac, {parcelas:l}); } } return nota(d, "Recebimento de R$ "+(pA.valor||0).toFixed(2).replace(".", ",")+" confirmado."); });
          var dQ = inad.dividas.find(function(x){ return x.id===dC.id; }); if(saldoDe(dQ, indicePagos(inad))<=0.005) troca("dividas", dC.id, function(d){ var neg = d.sit==="Negativada"; d.sit = neg ? "Pedir a baixa" : "Quitada"; d.etapa = neg ? "Baixa" : "Concluído"; d.quitadaEm = pA.data; return nota(d, neg ? "Dívida quitada. Falta pedir a baixa da restrição no Serasa." : "Dívida quitada."); }); } }
      return ok("Salvo.");
    }
    case "ser_nova": {
      var nS = trim(a.nome); if(!nS || !ehDia(a.dataNeg)) return recusa("Informe a devedora e a data da negativação.");
      inad.serasa = [{id:novoId("n"), novo:true, dividaId:a.dividaId || "", nome:nS.toUpperCase(), condicional:trim(a.condicional), dataDivida:a.dataDivida || "", dataNeg:a.dataNeg, valor:r2(a.valor), status:"Negativada", notificacao:a.notificacao || "Pendente", obs:"", anotacao:trim(a.anotacao), secao:"Negativadas em "+rotuloMes(a.dataNeg.slice(0, 7)), origem:"Lançada no sistema por "+por}].concat(inad.serasa);
      if(a.dividaId) troca("dividas", a.dividaId, function(d){ d.sit = "Negativada"; d.etapa = "Negativada"; return nota(d, "Negativada no Serasa em "+formatarDia(a.dataNeg)+"."); });
      return ok("Negativação registrada.");
    }
    case "ser_campos": { if(!troca("serasa", a.id, function(n){ return Object.assign(n, a.campos||{}, {alteradoPor:por, alteradoEm:agora}); })) return recusa("Registro não encontrado."); return ok("Salvo."); }
    case "kit_novo": {
      var nK = trim(a.nome); if(!nK || !ehDia(a.data)) return recusa("Informe a revendedora e a data.");
      inad.kits = [{id:novoId("k"), novo:true, data:a.data, nome:nK.toUpperCase(), rep:trim(a.rep), quemPassou:trim(a.quemPassou), atraso:trim(a.atraso), status:a.status || "Verificar", condicional:trim(a.condicional), valor:r2(a.valor), nota:a.nota || "Verificar", notaCom:trim(a.notaCom), extra:trim(a.obs), secao:rotuloMes(a.data.slice(0, 7)), origem:"Lançado no sistema por "+por}].concat(inad.kits);
      return ok("Kit em atraso lançado.");
    }
    case "kit_campos": { if(!troca("kits", a.id, function(k){ return Object.assign(k, a.campos||{}, {alteradoPor:por, alteradoEm:agora}); })) return recusa("Registro não encontrado."); return ok("Salvo."); }
    case "do_acerto": {   // automático (App.js): cria as dívidas dos acertos com valor pendente e acompanha o pendente do acerto
      var din = function(v){ return "R$ "+r2(v).toFixed(2).replace(".", ","); }, fez = 0;
      (a.criar||[]).forEach(function(n){ if(inad.dividas.some(function(x){ return x.id===n.id || x.acertoId===n.acertoId; })) return; var c = Object.assign({}, n); delete c.devidoAcerto;
        c.hist = [{em:agora, por:"Automático", txt:"Dívida criada pelo acerto: faltou pagar "+din(n.valor)+" de "+din(n.devidoAcerto)+"."}]; inad.dividas = [c].concat(inad.dividas); fez++; });
      (a.atualizar||[]).forEach(function(u){ if(troca("dividas", u.id, function(d){ var delta = r2((d.acertoFalta||0)-u.falta); d.faltaBase = Math.max(0, r2((d.faltaBase||0)-delta)); d.acertoFalta = u.falta;
        d.hist = (d.hist||[]).concat([{em:agora, por:"Automático", txt:delta>0 ? "Pagamento de "+din(delta)+" lançado no acerto." : "O valor pendente do acerto subiu "+din(-delta)+"."}]);
        if(d.faltaBase<=0.005 && saldoDe(d, indicePagos(inad))<=0.005){ d.sit = d.sit==="Negativada" ? "Pedir a baixa" : "Quitada"; d.etapa = d.sit==="Quitada" ? "Concluído" : "Baixa"; d.quitadaEm = hojeIso(); }
        return d; })) fez++; });
      return fez ? {patch:{inad:inad}} : {patch:{}};
    }
    case "cfg": { inad.cfg = Object.assign({}, inad.cfg, a.cfg||{}); return ok("Regras salvas."); }
  }
  return {patch:{}};
}
var ROTULO = {sit:"Situação", etapa:"Etapa", cobra:"Quem cobra", nota:"Nota promissória", posVenda:"Pós-venda", rep:"Representante", condicional:"Condicional", obs:"Observação", comissaoRep:"Comissão da representante", comissaoMotivo:"Motivo da comissão"};

// Regras do setor em duas colunas (aba Regras). Texto completo: docs/negocio/INADIMPLENCIA-REGRAS-DO-SETOR.md
function regrasDoSetor(cfg){
  cfg = cfg || CFG_PADRAO; var fx = cfg.pixFaixas, din = function(v){ return "R$ "+v.toLocaleString("pt-BR", {minimumFractionDigits:2}); };
  return [
    ["Formas de pagamento", "Pix à vista, Pix parcelado e cartão de crédito em até "+cfg.cartaoMax+" vezes sem juros por link. Boleto não."],
    ["Pix parcelado", fx.map(function(f, i){ return (i ? "de "+din(fx[i-1].ate+0.01)+" a " : "até ")+din(f.ate)+": até "+f.max+" vezes"; }).join(" · ")+" · acima disso: analisar ou cartão."],
    ["Parcela mínima", din(cfg.parcelaMinima)+". Vale junto com o limite de parcelas."],
    ["Primeira parcela", "Paga no mês da negociação, de preferência na hora do acordo."],
    ["Negociação", "Toda negociação tem valor, forma e data. Promessa sem data não é negociação."],
    ["Vencimentos", "Definidos no acordo. Mudar depende do setor."],
    ["Prazo da representante", cfg.prazoRepDias+" dias para negociar e informar valor, entrada, parcelas, datas e forma. Sem negociação concreta, o setor assume."],
    ["Comissão da representante", "Recuperou o pagamento: tem comissão. Sem cobrança, acompanhamento ou atualização: o setor assume e ela perde a comissão. Cobrou certo e precisou de ajuda: o setor analisa."],
    ["Rotina do setor", "1º contato ao assumir · 2º contato depois de "+cfg.contato2Dias+" dias · 3º contato depois de "+cfg.contato3Dias+" dias, com aviso final e 48 horas para resposta."],
    ["Acordo descumprido", "Parcela não paga na data vira Verificar sozinha. Sem justificativa ou retorno, o acordo é descumprido. Novo acordo não é automático."],
    ["Pix descumprido", "Não há novo parcelamento por Pix. Oferecer cartão ou quitação do saldo."],
    ["Prorrogação", "Uma por parcela, pedida antes do vencimento, com justificativa e aprovada pelo setor."],
    ["Última oportunidade", "Informar valor pendente, forma aceita, data final, que não há nova prorrogação e as consequências."],
    ["Negativação", "A partir de "+cfg.serasaDias+" dias de atraso, sem acordo sendo cumprido. Nunca automática: depende de análise."],
    ["Encargos", "Multa e juros só com autorização. O valor original fica guardado."],
    ["Quitação", "Pagamento confirmado e saldo zero: a dívida vira Quitada sozinha. Comprovante sem confirmação não quita."],
    ["Baixa na DevMaster", "Controle separado da confirmação do recebimento."],
    ["Exceções", "Parcela abaixo do mínimo, prazo maior, segunda renegociação, novo Pix depois de descumprimento e desconto: só com o nome de quem autorizou."]
  ];
}

export { SITUACOES, ETAPAS, QUEM_COBRA, NOTAS, POS_VENDA, FORMAS, CONTATOS, COR_SIT, CFG_PADRAO, MESES, hojeIso, diasEntre, maisMeses, formatarDia, rotuloMes, inadVazio, inadMigrar, inadFatia, inadDoServidor,
  indicePagos, totalDe, saldoDe, situacaoDe, aberta, proximaAcao, maxParcelasPix, excecoesDoAcordo, gerarParcelas, mesDaDivida, mesDoPagamento, relatorioMensal, relatorioPorRep, anosDe, inadReduz, regrasDoSetor, pendenciasDoAcerto, NASCE_DESDE };
