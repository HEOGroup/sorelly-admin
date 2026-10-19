// Sorelly Admin — domain/agendamento.js
// Setor de AGENDAMENTO (acertos), trazido do SorellyAdmin e adaptado: controle mensal dos acertos contra a meta.
//  · O número de acertos REALIZADOS não é lançado aqui: vem da Visão geral / Consolidado do faturamento (faturamentoDiario), que o Marcus já preenche.
//  · REMARCAÇÕES: revendedoras que saem da meta do mês (adiadas de propósito para 45/60 dias, ou remarcadas pela Ana Maria para o mês seguinte) diminuem os acertos previstos
//    do mês de origem e vão formando os previstos do mês de destino. Previstos ajustados = previstos da abertura − quem saiu + quem chegou.
//  · Faixas de meta (94/95/96%) com bônus por funcionária, cotas e saldos por representante, ranking, alertas; no fim do mês quem gerencia FECHA (retrato travado para Histórico/Análises).
// Tudo vive em s.agend: {config, mes, cotas, saldos, remarc, log}. Funções puras; as telas estão em pages/Agendamento.js.
import { completarDias, fatEfetivo } from "@/apps/montagem/domain/financeiro";
import { REPRESENTANTES } from "@/apps/montagem/domain/pessoas";

var NOMES_MES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var MEDALHAS = ["🥇","🥈","🥉"];
var chaveMes = function(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"); };
var nomeMes = function(ym){ return NOMES_MES[Number(String(ym).slice(5,7))-1] || ym; };
var anoDe = function(ym){ return String(ym).slice(0,4); };
var diasNoMes = function(ym){ return new Date(Number(ym.slice(0,4)), Number(ym.slice(5,7)), 0).getDate(); };
var pct = function(a, b){ return b>0 ? a/b*100 : 0; };
var mesAnterior = function(ym){ return chaveMes(new Date(Number(ym.slice(0,4)), Number(ym.slice(5,7))-2, 1)); };
var proximoMes = function(ym){ return chaveMes(new Date(Number(ym.slice(0,4)), Number(ym.slice(5,7)), 1)); };
var isoHoje = function(){ var d = new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };

// motivos de remarcação: 45 e 60 dias são adiadas de propósito (não contam na meta); os outros também saem do mês. Quem autorizou é um campo à parte (sempre obrigatório).
var TIPOS_REMARC = [
  {id:"p45", lb:"Adiada · 45 dias", cor:"#60A5FA", proposito:true},
  {id:"p60", lb:"Adiada · 60 dias", cor:"#A78BFA", proposito:true},
  {id:"ana", lb:"Remarcada para o mês seguinte", cor:"#F59E0B", proposito:false},
  {id:"outro", lb:"Outro motivo", cor:"#94A3B8", proposito:false}];
var AUTORIZADORES = ["Marcus","Nickolas","Lucas","Ana Maria"];
var tipoDe = function(id){ return TIPOS_REMARC.find(function(t){ return t.id===id; }) || TIPOS_REMARC[3]; };

// ---------- acertos realizados: vêm do faturamento (Visão geral) ----------
// {dia:{acumulado}} do mês, a partir dos lançamentos do faturamento (cada um guarda o acumulado de acertos do mês até aquele dia)
function diarioDeFd(fd, ym){
  var out = {}; Object.keys(fd||{}).filter(function(k){ return k.slice(0,7)===ym && fd[k] && fd[k].acertos!==undefined; }).sort().forEach(function(k){ out[Number(k.slice(8,10))] = {acumulado:fd[k].acertos||0}; });
  return out;
}
function incrementos(diario, totalDias){
  var out = new Array(totalDias+1).fill(null), ult = 0;
  for(var dia=1; dia<=totalDias; dia++){ var e = (diario||{})[dia]; if(!e) continue; out[dia] = e.acumulado-ult; ult = e.acumulado; }
  return out;
}
function realizadoDe(diario){ var ks = Object.keys(diario||{}).map(Number).sort(function(a,b){ return a-b; }); return ks.length ? diario[ks[ks.length-1]].acumulado : 0; }
// semanas do CALENDÁRIO (segunda a domingo): a 1ª e a última podem ter menos de 7 dias
var DIA_SEM = ["dom","seg","ter","qua","qui","sex","sáb"];
function semanas(inc, total, ym){
  var out = [], ano = Number(ym.slice(0,4)), mes = Number(ym.slice(5,7))-1, w = null;
  for(var d=1; d<=total; d++){ var dow = new Date(ano, mes, d).getDay();
    if(!w || dow===1){ w = {semana:out.length+1, ini:d, fim:d, iniDow:dow, fimDow:dow, soma:0, tem:false}; out.push(w); }
    w.fim = d; w.fimDow = dow; if(inc[d]!==null && inc[d]!==undefined){ w.soma += inc[d]; w.tem = true; } }
  return out.map(function(x){ return {semana:x.semana, ini:x.ini, fim:x.fim, rotulo:DIA_SEM[x.iniDow]+" "+x.ini+" a "+DIA_SEM[x.fimDow]+" "+x.fim, total:x.tem ? x.soma : null}; });
}

// ---------- remarcações e previstos ajustados ----------
// quem saiu da meta do mês (origem) e quem chegou nele (destino)
function movimentos(ag, ym){
  var l = ag.remarc||[], saem = l.filter(function(x){ return x.origem===ym && x.destino!==ym; }), entram = l.filter(function(x){ return x.destino===ym && x.origem!==ym; });
  var q = function(arr){ return arr.reduce(function(t, x){ return t+(x.qtd||1); }, 0); };   // uma anotação em lote vale várias revendedoras (qtd)
  var cont = function(arr, prop){ return q(arr.filter(function(x){ return tipoDe(x.tipo).proposito===prop; })); };
  var porAutor = {}; saem.forEach(function(x){ porAutor[x.autorizadoPor] = (porAutor[x.autorizadoPor]||0)+(x.qtd||1); });
  return {saem:saem, entram:entram, nSaem:q(saem), nEntram:q(entram), porAutor:porAutor, propositais:cont(saem, true), outras:cont(saem, false), chegaram:q(entram)};
}
function previstosAjustados(ag, ym, base){ var mv = movimentos(ag, ym); return Math.max(0, base-mv.nSaem+mv.nEntram); }

// ---------- faixas de meta e bônus ----------
function avaliarFaixas(faixas, previstos, realizado){
  return faixas.slice().sort(function(a,b){ return a.pct-b.pct; }).map(function(f){ var alvo = previstos*f.pct/100;
    return {id:f.id, pct:f.pct, bonus:f.bonus, alvo:alvo, pctAtingido:alvo>0 ? realizado/alvo*100 : 0, bateu:realizado>=alvo, falta:Math.max(0, Math.ceil(alvo-realizado))}; });
}
function maiorFaixa(av){ var m = null; av.forEach(function(r){ if(r.bateu && (!m || r.pct>m.pct)) m = r; }); return m; }

// ---------- representantes ----------
var saldoAtualDe = function(cota, saldos){ var ks = Object.keys(saldos||{}).map(Number).sort(function(a,b){ return a-b; }); return ks.length ? saldos[ks[ks.length-1]] : cota; };
var repPct = function(cota, saldo){ return cota>0 ? (cota-saldo)/cota*100 : null; };
function ordenarReps(linhas){
  var com = linhas.filter(function(l){ return l.cota>0; }).sort(function(a,b){ return (b.pct||0)-(a.pct||0); }), sem = linhas.filter(function(l){ return l.cota<=0; });
  return {comMeta:com, semMeta:sem, todas:com.concat(sem), podio:com.slice(0,3), zona:com.slice(-5).reverse()};
}

// Quem tem o mesmo "grupo" (ex.: Thalita e Thalita SC) segue com controle separado (cota e saldo próprios), mas nos relatórios (pódio, zona de atenção, análises, histórico) aparece somada numa linha só
function agrupar(linhas){
  var out = [], idx = {};
  linhas.forEach(function(l){ var g = String(l.grupo||"").trim(); if(!g){ out.push(l); return; } var k = g.toLowerCase();
    if(idx[k]===undefined){ idx[k] = out.length; out.push({id:null, codigo:"G:"+k, nome:g, ativo:true, cota:l.cota, saldoAtual:l.saldoAtual, saldosPorDia:{}, grupo:g, membros:1}); }
    else { var x = out[idx[k]]; x.cota += l.cota; x.saldoAtual += l.saldoAtual; x.membros++; } });
  return out.map(function(l){ if(l.membros) l.pct = repPct(l.cota, l.saldoAtual); return l; });
}

// ---------- estado e leitura ----------
function mesAberto(ag){ var ks = Object.keys(ag.mes||{}).filter(function(k){ return !ag.mes[k].fechadoEm; }).sort(); return ks.length ? ks[ks.length-1] : null; }
function representantesDoMes(ag, ym){
  var m = ag.mes[ym]; if(!m) return [];
  if(m.fechadoEm && m.snapshot) return (m.snapshot.representantes||[]).map(function(r){ return {id:null, codigo:r.codigo, nome:r.nome, ativo:true, cota:r.cota, saldoAtual:r.saldoFinal, pct:r.pctFinal, saldosPorDia:{}, grupo:r.grupo||""}; });
  var cotas = (ag.cotas||{})[ym]||{}, saldos = (ag.saldos||{})[ym]||{};
  return (ag.config.representantes||[]).filter(function(r){ return r.ativo || (cotas[r.id]>0); }).map(function(r){
    var cota = cotas[r.id]||0, sd = saldos[r.id]||{}, atual = saldoAtualDe(cota, sd);
    return {id:r.id, codigo:r.codigo, nome:r.nome, ativo:r.ativo, cota:cota, saldoAtual:atual, pct:repPct(cota, atual), saldosPorDia:sd, grupo:r.grupo||""}; });
}
function pctPorCodigo(ag, ym){ var o = {}; representantesDoMes(ag, ym).forEach(function(r){ if(r.pct!==null && r.pct!==undefined) o[r.codigo] = r.pct; }); return o; }

function painelDe(ag, ym, agora, fd){
  var m = ag.mes[ym]; if(!m) return null;
  var fechado = !!m.fechadoEm, snap = m.snapshot, diario = diarioDeFd(fd, ym), total = diasNoMes(ym), inc = incrementos(diario, total), mv = movimentos(ag, ym);
  var realizado = fechado && snap ? snap.realizado : realizadoDe(diario), base = fechado && snap ? snap.revendedorasComKit : m.base;
  var previstosBase = fechado && snap ? (snap.previstosBase!==undefined ? snap.previstosBase : snap.acertosPrevistos) : m.previstos;
  var previstos = fechado && snap ? snap.acertosPrevistos : previstosAjustados(ag, ym, m.previstos);
  var faixas = fechado && snap ? snap.metasVigentes : ag.config.faixas, funcs = fechado && snap ? snap.funcionariasVigentes : ag.config.funcionarias.filter(function(f){ return f.ativa; }).map(function(f){ return f.nome; });
  var metas = avaliarFaixas(faixas, previstos, realizado), maior = maiorFaixa(metas), reps = representantesDoMes(ag, ym), somaCotas = reps.reduce(function(t,r){ return t+r.cota; }, 0);
  var pg = fechado && snap ? snap.pagamento : (m.pagamento||{prevista:null, confirmada:null, por:null}), hojeIso = isoHoje(), cur = chaveMes(agora||new Date());
  var evolucao = []; for(var d=1; d<=total; d++) evolucao.push({dia:d, dow:new Date(Number(ym.slice(0,4)), Number(ym.slice(5,7))-1, d).getDay(), acumulado:diario[d] ? diario[d].acumulado : null, incremento:inc[d]});
  var ult = evolucao.filter(function(x){ return x.incremento!==null; }).slice(-1)[0], prox = proximoMes(ym), mvProx = movimentos(ag, prox);
  var texto = "🎯 Acertos — "+nomeMes(ym)+"\n"+(ult ? "📅 Hoje (dia "+ult.dia+"): +"+ult.incremento+" acertos\n" : "")+"📊 Total do mês: "+realizado.toLocaleString("pt-BR")+"/"+previstos.toLocaleString("pt-BR")+"\n⏳ Restam "+Math.max(previstos-realizado, 0).toLocaleString("pt-BR")+" acertos para bater a meta";
  return {ym:ym, fechado:fechado, aoVivo:!fechado, base:base, previstosBase:previstosBase, previstos:previstos, realizado:realizado, restante:Math.max(previstos-realizado, 0),
    saidasPropositais:fechado && snap && snap.saidasPropositais!==undefined ? snap.saidasPropositais : mv.propositais, saidasOutras:fechado && snap && snap.saidasOutras!==undefined ? snap.saidasOutras : mv.outras,
    passadas:mv.nSaem, passadasPor:mv.porAutor, chegadas:fechado && snap && snap.chegadas!==undefined ? snap.chegadas : mv.chegaram, proximo:{ym:prox, formados:mvProx.chegaram},
    metas:metas, maior:maior, funcs:funcs, bonus:funcs.map(function(n){ return {nome:n, valor:maior ? maior.bonus : 0}; }), evolucao:evolucao, semanas:semanas(inc, total, ym), pagamento:pg, ranking:ordenarReps(agrupar(reps)), linhas:ordenarReps(reps).todas, somaCotas:somaCotas,
    alertaVencido:!fechado && cur!==ym, alertaConciliacao:somaCotas!==previstos && reps.length>0 ? {somaCotas:somaCotas, previstos:previstos, diferenca:Math.abs(somaCotas-previstos)} : null,
    alertaPagamento:false, texto:texto, estimado:!!m.estimado, vencimento:vencimentoBonus(ym)};
}

// o que valeu no último dia do mês: recebido e quantidade de revendedoras
var recebidoDe = function(fd, ym){ var ks = Object.keys(fd||{}).filter(function(k){ return k.slice(0,7)===ym; }).sort(); return ks.length ? (fd[ks[ks.length-1]].recebido||0) : 0; };
function revFimDe(s, ym){
  var h = completarDias(s.revendedorasDiario||{}), ks = Object.keys(h).sort(), fim = ym+"-"+String(diasNoMes(ym)).padStart(2,"0"), v = null;
  for(var i=0; i<ks.length; i++){ if(ks[i]<=fim) v = h[ks[i]]; else break; } return v;
}
var vencimentoBonus = function(ym, dia){ return proximoMes(ym)+"-"+String(dia||15).padStart(2,"0"); };   // o bônus das metas é pago no dia combinado (padrão 15) do mês seguinte; o dia vem de Comissões → Datas de pagamento
function snapshotDe(ag, ym, fd, revFim){
  var m = ag.mes[ym], mv = movimentos(ag, ym);
  return {recebido:recebidoDe(fd, ym), revendedorasFim:revFim===undefined ? null : revFim, revendedorasComKit:m.base, previstosBase:m.previstos, acertosPrevistos:previstosAjustados(ag, ym, m.previstos), saidasPropositais:mv.propositais, saidasOutras:mv.outras, chegadas:mv.chegaram,
    realizado:realizadoDe(diarioDeFd(fd, ym)), metasVigentes:ag.config.faixas.map(function(f){ return {pct:f.pct, bonus:f.bonus}; }),
    funcionariasVigentes:ag.config.funcionarias.filter(function(f){ return f.ativa; }).map(function(f){ return f.nome; }), pagamento:Object.assign({prevista:null, confirmada:null, por:null}, m.pagamento),
    representantes:representantesDoMes(ag, ym).map(function(r){ return {codigo:r.codigo, nome:r.nome, grupo:r.grupo||"", cota:r.cota, saldoFinal:r.saldoAtual, pctFinal:r.pct}; })};
}

// bônus das metas de um mês: valor por funcionária (maior faixa batida), vencimento no dia 15 do mês seguinte e o registro de pagamento de cada uma
function bonusDoMes(ag, ym, fd, dia){
  var p = painelDe(ag, ym, undefined, fd); if(!p) return null; var pagos = (ag.bonusPag||{})[ym]||{}, hojeIso = isoHoje();
  var linhas = p.bonus.map(function(b){ return {nome:b.nome, valor:b.valor, pag:pagos[b.nome]||null}; });
  var antes = ym < (ag.bonusDesde||"2026-09"), total = linhas.reduce(function(t,l){ return t+l.valor; }, 0), pago = linhas.reduce(function(t,l){ return t+(l.pag ? l.pag.valor : 0); }, 0);
  var tudoPago = linhas.length>0 && linhas.every(function(l){ return l.pag || l.valor<=0; });
  return {ym:ym, fechado:p.fechado, faixa:p.maior ? p.maior.pct : null, previstos:p.previstos, realizado:p.realizado, vencimento:vencimentoBonus(ym, dia), linhas:linhas, total:total, pago:pago, aPagar:antes ? 0 : Math.max(0, total-pago), antes:antes,
    atrasado:!antes && p.fechado && !tudoPago && total>0 && vencimentoBonus(ym, dia)<hojeIso, situacao:!p.fechado ? "em andamento" : antes ? "anterior ao sistema" : total<=0 ? "sem bônus" : tudoPago ? "pago" : "pendente"};
}
// resumo do Agendamento para a Visão geral das comissões: o que há a pagar, a próxima data e o andamento da meta do mês aberto
function resumoComissaoAg(s, dia){
  var ag = s.agend, fd = fatEfetivo(s), meses = Object.keys(ag.mes).sort().reverse().map(function(k){ return bonusDoMes(ag, k, fd, dia); }).filter(function(x){ return !!x; });
  var pend = meses.filter(function(x){ return x.fechado && !x.antes && x.aPagar>0; }), ym = mesAberto(ag), p = ym ? painelDe(ag, ym, undefined, fd) : null;
  return {aPagar:pend.reduce(function(t, x){ return t+x.aPagar; }, 0), pago:meses.reduce(function(t, x){ return t+x.pago; }, 0), pendentes:pend.length, proxVenc:pend.length ? pend.map(function(x){ return x.vencimento; }).sort()[0] : null,
    ym:ym, painel:p, bonusProjetado:p ? p.bonus.reduce(function(t, b){ return t+b.valor; }, 0) : 0, proxFaixa:p ? p.metas.find(function(m){ return !m.bateu; }) : null};
}
// virada do mês: há mês antigo aberto, ou o mês de hoje ainda não existe?
var precisaVirar = function(ag, hojeYm){ return !ag.mes[hojeYm] || Object.keys(ag.mes).some(function(k){ return !ag.mes[k].fechadoEm && k<hojeYm; }); };

// séries para Análises: meses fechados (retrato) + o aberto "ao vivo"
function analisesDe(ag, fd){
  var meses = Object.keys(ag.mes).sort().map(function(ym){ var m = ag.mes[ym], snap = m.fechadoEm ? m.snapshot : null;
    var realizado = snap ? snap.realizado : realizadoDe(diarioDeFd(fd, ym)), prev = snap ? snap.acertosPrevistos : previstosAjustados(ag, ym, m.previstos), base = snap ? snap.revendedorasComKit : m.base;
    return {ym:ym, nome:nomeMes(ym), ano:anoDe(ym), base:base, previstos:prev, realizado:realizado, pctMeta:pct(realizado, prev), pctSobreVendedoras:pct(realizado, base), aoVivo:!m.fechadoEm}; });
  var porNome = {}, ordemNomes = []; meses.forEach(function(m){ if(!porNome[m.nome]){ porNome[m.nome] = []; ordemNomes.push(m.nome); } porNome[m.nome].push({ano:m.ano, pctMeta:m.pctMeta}); });
  var acc = {}; Object.keys(ag.mes).forEach(function(ym){ var m = ag.mes[ym]; if(!m.fechadoEm || !m.snapshot) return; agrupar((m.snapshot.representantes||[]).map(function(r){ return {codigo:r.codigo, nome:r.nome, grupo:r.grupo, cota:r.cota, saldoAtual:r.saldoFinal, pct:r.pctFinal}; })).forEach(function(r){ if(r.pct===null || r.pct===undefined) return; var a = acc[r.codigo] || (acc[r.codigo] = {codigo:r.codigo, nome:r.nome, pcts:[]}); a.pcts.push(r.pct); }); });
  var consistencia = Object.keys(acc).map(function(k){ var a = acc[k]; return {codigo:a.codigo, nome:a.nome, mesesFechados:a.pcts.length, mediaPct:a.pcts.reduce(function(t,x){ return t+x; }, 0)/a.pcts.length}; }).sort(function(a,b){ return b.mediaPct-a.mediaPct; });
  return {meses:meses, comparativo:ordemNomes.map(function(n){ return {nomeMes:n, porAno:porNome[n]}; }), consistencia:consistencia};
}

// ---------- ações (usadas pelo reducer) ----------
// devolve {patch, msg}; patch vazio + msg = recusado. Mudou remarcação ou abertura? a meta do Financeiro (metaMensal) acompanha os previstos ajustados.
function agendReduz(s, a, agora){
  var ag = JSON.parse(JSON.stringify(s.agend)), por = a.por || "—", em = new Date(agora||Date.now()).toISOString(), recusa = function(t){ return {patch:{}, msg:t}; };
  var ym = mesAberto(ag), exigeAberto = function(){ return ym ? null : recusa("Abra o mês primeiro (Abertura do mês)."); };
  var cfg = ag.config, ok = function(msg){ return {patch:{agend:ag}, msg:msg}; };
  var sincMeta = function(meses){
    var mm = JSON.parse(JSON.stringify(s.metaMensal||{}));
    meses.forEach(function(k){ var m = ag.mes[k]; if(!m) return; var an = anoDe(k), ix = Number(k.slice(5,7))-1; mm[an] = mm[an]||{}; mm[an][ix] = Object.assign({}, mm[an][ix], {base:m.base||0, previstos:previstosAjustados(ag, k, m.previstos||0)}); });
    return mm;
  };
  switch(a.op){
    case "abrir": {
      var alvo = a.ym, ja = ag.mes[alvo];
      if(ja && ja.fechadoEm) return recusa("Este mês já está fechado. Reabra-o primeiro.");
      if(ym && ym!==alvo) return recusa("Feche "+nomeMes(ym)+" antes de abrir "+nomeMes(alvo)+".");
      ag.mes[alvo] = Object.assign({pagamento:{prevista:null, confirmada:null, por:null}}, ja, {base:a.base||0, previstos:a.previstos||0, abertoEm:(ja||{}).abertoEm || em, fechadoEm:null, estimado:false});
      return {patch:{agend:ag, metaMensal:sincMeta([alvo])}, msg:"Abertura de "+nomeMes(alvo)+" salva (vale também para o Financeiro)"};
    }
    case "remarc_add": { var er0 = exigeAberto(); if(er0) return er0; if(AUTORIZADORES.indexOf(a.autorizadoPor)<0) return recusa("Informe quem autorizou (Marcus, Nickolas, Lucas ou Ana Maria).");
      var nm = String(a.nome||"").trim(); if(!nm) return recusa("Escreva o nome da revendedora."); if(!a.destino || a.destino===ym) return recusa("Escolha o mês para onde ela vai (diferente do mês atual).");
      if((ag.remarc||[]).some(function(x){ return x.origem===ym && x.nome.toLowerCase()===nm.toLowerCase(); })) return recusa(nm+" já está nas remarcações de "+nomeMes(ym)+".");
      ag.remarc = (ag.remarc||[]).concat([{id:"rm"+Date.now(), nome:nm, tipo:a.tipo||"outro", autorizadoPor:a.autorizadoPor, origem:ym, destino:a.destino, obs:String(a.obs||"").trim(), por:por, em:em}]);
      return {patch:{agend:ag, metaMensal:sincMeta([ym, a.destino])}, msg:nm+" sai da meta de "+nomeMes(ym)+" e vai para "+nomeMes(a.destino)}; }
    // LOTE: o Marcus/Ana Maria passam várias revendedoras para o próximo mês de uma vez (só a quantidade, sem os nomes); vale na hora para previstos, metas e Financeiro
    case "remarc_lote": { var erL = exigeAberto(); if(erL) return erL; if(AUTORIZADORES.indexOf(a.autorizadoPor)<0) return recusa("Escolha quem passou (Marcus ou Ana Maria).");
      var qL = Math.round(Number(a.qtd)); if(!(qL>0)) return recusa("Informe quantas revendedoras foram passadas."); if(!a.destino || a.destino===ym) return recusa("Escolha o mês para onde elas vão (diferente do mês atual).");
      ag.remarc = (ag.remarc||[]).concat([{id:"rm"+Date.now(), nome:"Lote de "+qL+" · "+String(a.data||em).slice(8,10)+"/"+String(a.data||em).slice(5,7), qtd:qL, tipo:a.tipo||"outro", autorizadoPor:a.autorizadoPor, origem:ym, destino:a.destino, obs:String(a.obs||"").trim(), por:por, em:em}]);
      return {patch:{agend:ag, metaMensal:sincMeta([ym, a.destino])}, msg:qL+" revendedora"+(qL===1 ? "" : "s")+" passada"+(qL===1 ? "" : "s")+" por "+a.autorizadoPor+" para "+nomeMes(a.destino)}; }
    case "remarc_del": { var rx = (ag.remarc||[]).find(function(x){ return x.id===a.id; }); if(!rx) return recusa("Remarcação não encontrada.");
      var mfx = ag.mes[rx.origem]; if(mfx && mfx.fechadoEm) return recusa("O mês de origem está fechado. Reabra para desfazer.");
      ag.remarc = ag.remarc.filter(function(x){ return x.id!==a.id; }); return {patch:{agend:ag, metaMensal:sincMeta([rx.origem, rx.destino])}, msg:"Remarcação desfeita"}; }
    // VIRADA DO MÊS (automática): fecha o mês que ficou para trás com o que valia no último dia e abre o mês novo com as revendedoras do fim do mês anterior
    case "virar": {
      var hojeYm = chaveMes(new Date(agora||Date.now())), mudou = false, fd2 = fatEfetivo(s);
      Object.keys(ag.mes).filter(function(k){ return !ag.mes[k].fechadoEm && k<hojeYm; }).sort().forEach(function(k){
        ag.mes[k].snapshot = snapshotDe(ag, k, fd2, revFimDe(s, k)); ag.mes[k].fechadoEm = em; ag.mes[k].fechadoPor = "Automático (virada do mês)"; ag.log.unshift({ym:k, acao:"FECHADO", por:"Automático", em:em}); mudou = true; });
      if(!ag.mes[hojeYm]){
        var ant = mesAnterior(hojeYm), antM = ag.mes[ant], snA = antM && antM.snapshot, mmv = ((s.metaMensal||{})[anoDe(hojeYm)]||{})[Number(hojeYm.slice(5,7))-1];
        var baseNova = revFimDe(s, ant) || (mmv && mmv.base) || (snA ? snA.revendedorasComKit : 0), temMeta = !!(mmv && mmv.previstos>0);
        var mvN = movimentos(ag, hojeYm);   // a meta do Financeiro já vem com as remarcações descontadas: volta ao número da abertura para não descontar duas vezes
        var prev = temMeta ? Math.max(0, mmv.previstos+mvN.nSaem-mvN.nEntram) :(snA && snA.revendedorasComKit>0 ? Math.round(baseNova*(snA.previstosBase||0)/snA.revendedorasComKit) : 0);
        ag.mes[hojeYm] = {base:baseNova, previstos:prev, abertoEm:em, fechadoEm:null, aberturaAuto:true, estimado:!temMeta, pagamento:{prevista:null, confirmada:null, por:null}}; mudou = true; }
      if(!mudou) return {patch:{}, msg:null};
      return {patch:{agend:ag, metaMensal:sincMeta([hojeYm])}, msg:"Virou o mês: "+nomeMes(hojeYm)+" aberto com as revendedoras do fim do mês anterior"}; }
    case "bonus_pag": { var mb = ag.mes[a.ym]; if(!mb || !mb.fechadoEm) return recusa("Feche o mês antes de pagar o bônus.");
      ag.bonusPag = ag.bonusPag||{}; var pm = ag.bonusPag[a.ym] = ag.bonusPag[a.ym]||{};
      if(a.desfazer){ delete pm[a.nome]; return ok("Pagamento desfeito"); }
      if(!a.forma) return recusa("Escolha a forma de pagamento."); var bb = bonusDoMes(ag, a.ym, fatEfetivo(s)), ln = bb && bb.linhas.find(function(l){ return l.nome===a.nome; }); if(!ln) return recusa("Funcionária não encontrada neste mês.");
      pm[a.nome] = {forma:a.forma, conta:String(a.conta||"").trim(), obs:String(a.obs||"").trim(), valor:ln.valor, pagoEm:isoHoje(), por:por, em:em}; return ok("Bônus de "+a.nome+" registrado como pago"); }
    case "cota": { var er3 = exigeAberto(); if(er3) return er3; ag.cotas[ym] = ag.cotas[ym]||{}; ag.cotas[ym][a.repId] = Math.max(0, Math.round(a.cota||0)); return ok(); }
    case "saldo": { var er4 = exigeAberto(); if(er4) return er4; ag.saldos[ym] = ag.saldos[ym]||{}; var sr = ag.saldos[ym][a.repId] = ag.saldos[ym][a.repId]||{};
      if(a.saldo===null || a.saldo===undefined || a.saldo==="") delete sr[a.dia]; else sr[a.dia] = Math.max(0, Math.round(a.saldo)); return ok(); }
    case "faixa_add": { if(!(a.pct>=0)) return recusa("Informe a porcentagem."); cfg.faixas.push({id:"f"+Date.now(), pct:Math.round(a.pct), bonus:Math.max(0, a.bonus||0)}); return ok("Faixa criada"); }
    case "faixa_set": { var fx = cfg.faixas.find(function(f){ return f.id===a.id; }); if(!fx) return recusa("Faixa não encontrada."); if(a.pct!==undefined) fx.pct = Math.max(0, Math.min(999, Math.round(a.pct))); if(a.bonus!==undefined) fx.bonus = Math.max(0, a.bonus); return ok(); }
    case "faixa_del": { if(cfg.faixas.length<=1) return recusa("Precisa sobrar ao menos uma faixa."); cfg.faixas = cfg.faixas.filter(function(f){ return f.id!==a.id; }); return ok("Faixa excluída"); }
    case "func_add": { if(!String(a.nome||"").trim()) return recusa("Escreva o nome."); cfg.funcionarias.push({id:"fn"+Date.now(), nome:String(a.nome).trim(), ativa:true}); return ok("Funcionária adicionada"); }
    case "func_set": { var fn = cfg.funcionarias.find(function(f){ return f.id===a.id; }); if(!fn) return recusa("Funcionária não encontrada."); if(a.nome!==undefined) fn.nome = a.nome; if(a.ativa!==undefined) fn.ativa = !!a.ativa; return ok(); }   // funcionária não se exclui, só se inativa
    case "rep_add": { var cod = String(a.codigo||"").trim(), nm2 = String(a.nome||"").trim(); if(!cod || !nm2) return recusa("Informe código e nome.");
      if(cfg.representantes.some(function(r){ return r.codigo===cod; })) return recusa("Já existe uma representante com este código."); cfg.representantes.push({id:"rp"+Date.now(), codigo:cod, nome:nm2, ativo:true}); return ok("Representante criada"); }
    case "rep_set": { var rp = cfg.representantes.find(function(r){ return r.id===a.id; }); if(!rp) return recusa("Representante não encontrada.");
      var codAntigo = rp.codigo;
      if(a.codigo!==undefined && String(a.codigo).trim()!==rp.codigo){ var nc = String(a.codigo).trim(); if(!nc) return recusa("O código não pode ficar vazio."); if(cfg.representantes.some(function(r){ return r.codigo===nc && r.id!==rp.id; })) return recusa("Já existe uma representante com este código."); rp.codigo = nc; }
      if(a.nome!==undefined && String(a.nome).trim()) rp.nome = String(a.nome).trim(); if(a.ativo!==undefined) rp.ativo = !!a.ativo;
      // código e nome também mudam nos meses fechados (o histórico liga os meses pelo código)
      Object.keys(ag.mes).forEach(function(k){ var sn = ag.mes[k].snapshot; if(sn) (sn.representantes||[]).forEach(function(r){ if(r.codigo===codAntigo){ r.codigo = rp.codigo; r.nome = rp.nome; } }); });
      return ok(); }
    case "rep_del": { var rd = cfg.representantes.find(function(r){ return r.id===a.id; }); if(!rd) return recusa("Representante não encontrada.");
      cfg.representantes = cfg.representantes.filter(function(r){ return r.id!==a.id; });
      Object.keys(ag.cotas||{}).forEach(function(k){ delete ag.cotas[k][a.id]; }); Object.keys(ag.saldos||{}).forEach(function(k){ delete ag.saldos[k][a.id]; }); return ok("Representante excluída (os meses fechados não mudam)"); }
    // JUNTAR duplicadas (ex.: "Thalita" e "Thalita SC"): a duplicada some da lista, as cotas e os saldos dela somam na principal (inclusive nos meses fechados),
    // e o nome/código antigo vira apelido da principal para os relatórios não separarem mais as duas
    case "rep_merge": { var pri = cfg.representantes.find(function(r){ return r.id===a.id; }), dup = cfg.representantes.find(function(r){ return r.id===a.dupId; });
      if(!pri || !dup || pri.id===dup.id) return recusa("Escolha duas representantes diferentes.");
      Object.keys(ag.cotas||{}).forEach(function(k){
        var cp = (ag.cotas[k]||{})[pri.id]||0, cd = (ag.cotas[k]||{})[dup.id]||0; if(!ag.cotas[k]) return; ag.cotas[k][pri.id] = cp+cd; delete ag.cotas[k][dup.id];
        var sp = (ag.saldos[k]||{})[pri.id]||{}, sd = (ag.saldos[k]||{})[dup.id]||{}, dias = {}; Object.keys(sp).concat(Object.keys(sd)).forEach(function(d){ dias[d] = 1; });
        var na = function(sx, cx, dia){ var ks = Object.keys(sx).map(Number).filter(function(d){ return d<=Number(dia); }).sort(function(x,y){ return y-x; }); return ks.length ? sx[ks[0]] : cx; };
        var novo = {}; Object.keys(dias).forEach(function(d){ novo[d] = na(sp, cp, d)+na(sd, cd, d); });
        if(ag.saldos[k]){ if(Object.keys(novo).length) ag.saldos[k][pri.id] = novo; delete ag.saldos[k][dup.id]; } });
      Object.keys(ag.mes).forEach(function(k){ var sn = ag.mes[k].snapshot; if(!sn) return; var reps = sn.representantes||[], ip = reps.findIndex(function(x){ return x.codigo===pri.codigo; }), id = reps.findIndex(function(x){ return x.codigo===dup.codigo; });
        if(id<0) return; if(ip<0){ reps[id].codigo = pri.codigo; reps[id].nome = pri.nome; return; }
        reps[ip].cota += reps[id].cota; reps[ip].saldoFinal += reps[id].saldoFinal; reps[ip].pctFinal = reps[ip].cota>0 ? (reps[ip].cota-reps[ip].saldoFinal)/reps[ip].cota*100 : null; reps.splice(id, 1); });
      pri.apelidos = (pri.apelidos||[]).concat([dup.nome, dup.codigo]).concat(dup.apelidos||[]).filter(function(v, i, x){ return v && x.indexOf(v)===i && v!==pri.nome && v!==pri.codigo; });
      cfg.representantes = cfg.representantes.filter(function(r){ return r.id!==dup.id; }); return ok(dup.nome+" juntada com "+pri.nome); }
    case "rep_grupo": { var rg = cfg.representantes.find(function(r){ return r.id===a.id; }); if(!rg) return recusa("Representante não encontrada."); var gn = String(a.grupo||"").trim(); if(gn) rg.grupo = gn; else delete rg.grupo; return ok(gn ? rg.nome+" agrupada em "+gn+" nos relatórios" : rg.nome+" saiu do grupo"); }
    case "gerente": { var g = cfg.gerentes||[]; cfg.gerentes = a.on ? (g.indexOf(a.id)>=0 ? g : g.concat([a.id])) : g.filter(function(x){ return x!==a.id; }); return ok(); }
    case "pagto": { var er5 = exigeAberto(); if(er5) return er5; ag.mes[ym].pagamento = Object.assign({prevista:null, confirmada:null, por:null}, ag.mes[ym].pagamento, {prevista:a.prevista||null}); return ok("Data prevista salva"); }
    case "pagto_ok": { var er6 = exigeAberto(); if(er6) return er6; ag.mes[ym].pagamento = Object.assign({prevista:null, confirmada:null, por:null}, ag.mes[ym].pagamento, {confirmada:isoHoje(), por:por}); return ok("Pagamento do bônus confirmado"); }
    case "fechar": { var mf = ag.mes[a.ym]; if(!mf || mf.fechadoEm) return recusa("Este mês não está aberto.");
      mf.snapshot = snapshotDe(ag, a.ym, fatEfetivo(s), revFimDe(s, a.ym)); mf.fechadoEm = em; mf.fechadoPor = por; ag.log.unshift({ym:a.ym, acao:"FECHADO", por:por, em:em}); return ok(nomeMes(a.ym)+" fechado e guardado no histórico"); }
    case "reabrir": { var mr = ag.mes[a.ym]; if(!mr || !mr.fechadoEm) return recusa("Este mês não está fechado.");
      if(ym && ym!==a.ym) return recusa("Feche "+nomeMes(ym)+" antes de reabrir "+nomeMes(a.ym)+"."); mr.fechadoEm = null; mr.fechadoPor = null; mr.snapshot = null; ag.log.unshift({ym:a.ym, acao:"REABERTO", por:por, em:em}); return ok(nomeMes(a.ym)+" reaberto"); }
  }
  return recusa("Ação desconhecida.");
}

// ---------- dados de demonstração ----------
// Parte do que o sistema já sabe: meta mensal (revendedoras com kit e acertos previstos) e os acertos de cada mês (faturamento). Mês corrente = aberto, com cotas e saldos de demonstração.
// Nenhuma remarcação é inventada: o setor e o Marcus lançam as reais na tela Remarcações.
function agendDemo(s){
  var hoje = new Date(), cur = chaveMes(hoje), fd = s.faturamentoDiario||{}, mm = s.metaMensal||{}, hash = function(t){ var h = 7; String(t).split("").forEach(function(c){ h = (h*31+c.charCodeAt(0))%100003; }); return h; };
  var ag = {v:2, config:{faixas:[{id:"f94", pct:94, bonus:200}, {id:"f95", pct:95, bonus:300}, {id:"f96", pct:96, bonus:600}],
      funcionarias:[{id:"fn1", nome:"Ana Maria", ativa:true}, {id:"fn2", nome:"Mariana", ativa:true}, {id:"fn3", nome:"Tamara", ativa:true}],
      representantes:REPRESENTANTES.map(function(r, i){ return {id:"rp"+(i+1), codigo:String(i+1).padStart(2,"0"), nome:r.nome, ativo:true}; }), gerentes:[24]},
    mes:{}, cotas:{}, saldos:{}, remarc:[], log:[]};
  var ano = hoje.getFullYear();
  for(var m=0; m<=hoje.getMonth(); m++){
    var ym = ano+"-"+String(m+1).padStart(2,"0"), meta = (mm[String(ano)]||{})[m]; if(!meta) continue;
    var ks = Object.keys(fd).filter(function(k){ return k.slice(0,7)===ym; }).sort(), ultimo = ks.length ? fd[ks[ks.length-1]] : null, aberto = ym===cur;
    ag.mes[ym] = {base:meta.base||0, previstos:meta.previstos||0, abertoEm:ym+"-01T08:00:00.000Z", fechadoEm:null, pagamento:{prevista:null, confirmada:null, por:null}};
    if(aberto){
      var diario = diarioDeFd(fd, ym), dias = Object.keys(diario).map(Number).sort(function(a,b){ return a-b; });
      var ativos = ag.config.representantes, pesos = ativos.map(function(r){ return 40 + hash(r.nome)%60; }), somaP = pesos.reduce(function(t,x){ return t+x; }, 0), cotas = {}, usado = 0;
      ativos.forEach(function(r, i){ var c = Math.floor((meta.previstos||0)*pesos[i]/somaP); cotas[r.id] = c; usado += c; }); var resto = (meta.previstos||0)-usado; for(var i2=0; resto>0; i2=(i2+1)%ativos.length, resto--) cotas[ativos[i2].id]++;
      ag.cotas[ym] = cotas; ag.saldos[ym] = {};
      ativos.forEach(function(r){ var fator = 0.75 + (hash(r.codigo+r.nome)%50)/100, sd = {}; dias.forEach(function(dd){ var feito = Math.min(cotas[r.id], Math.round(cotas[r.id]*(diario[dd].acumulado/(meta.previstos||1))*fator)); sd[dd] = cotas[r.id]-feito; }); ag.saldos[ym][r.id] = sd; });
    } else if(ultimo){
      ag.mes[ym].fechadoEm = ym+"-"+String(diasNoMes(ym)).padStart(2,"0")+"T23:59:00.000Z"; ag.mes[ym].fechadoPor = "Demonstração";
      ag.mes[ym].snapshot = {revendedorasComKit:meta.base||0, previstosBase:meta.previstos||0, acertosPrevistos:meta.previstos||0, saidasPropositais:0, saidasOutras:0, chegadas:0, realizado:ultimo.acertos||0, metasVigentes:ag.config.faixas.map(function(f){ return {pct:f.pct, bonus:f.bonus}; }),
        funcionariasVigentes:ag.config.funcionarias.map(function(f){ return f.nome; }), pagamento:{prevista:null, confirmada:null, por:null}, representantes:[]};
    }
  }
  return ag;
}

// representantes com nome parecido (mesmo primeiro nome): candidatas a duplicadas para juntar
function parecidas(ag){
  var grupos = {}; (ag.config.representantes||[]).forEach(function(r){ var k = String(r.nome).trim().split(/\s+/)[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); (grupos[k] = grupos[k]||[]).push(r); });
  return Object.keys(grupos).filter(function(k){ return grupos[k].length>1; }).map(function(k){ return grupos[k]; });
}
export { resumoComissaoAg, agrupar, AUTORIZADORES, DIA_SEM, recebidoDe, revFimDe, vencimentoBonus, bonusDoMes, precisaVirar, parecidas, NOMES_MES, MEDALHAS, TIPOS_REMARC, tipoDe, chaveMes, nomeMes, anoDe, diasNoMes, pct, mesAnterior, proximoMes, diarioDeFd, incrementos, realizadoDe, movimentos, previstosAjustados,
  avaliarFaixas, maiorFaixa, saldoAtualDe, repPct, ordenarReps, mesAberto, representantesDoMes, pctPorCodigo, painelDe, snapshotDe, analisesDe, agendReduz, agendDemo };
