// Sorelly Admin — domain/comissoes.js
// Comissão das representantes sobre os atendimentos do Consolidado, datas de pagamento (grupos A e B), combustível e inadimplência.
// Funções puras: recebem o estado (ou a config `s.comis`) e devolvem números. Nenhum valor fixo dentro de tela: tudo vem do Configurador de comissões.
//
// Fluxo fechado com o Marcus:
//  · O que a representante preenche no app aparece sozinho no Consolidado (controle do que entrou). Fica pendente até trazer na empresa e o agendamento dar o OK.
//  · Depois do OK do agendamento, o financeiro (Comissões) dá um check em cada valor — com o nome de quem confirmou, e a conta onde o dinheiro entrou.
//  · A comissão é % de cada representante sobre o valor RECEBIDO; o que está em aberto (inadimplência) fica retido. Promissória não assinada bloqueia (dá para desligar).
//  · Cada data de pagamento (grupo A: 1/11/21, grupo B: 6/16/26) paga o que foi confirmado até o corte (padrão: 13h do dia anterior). Confirmado depois entra na data seguinte.
//  · Pix que a revendedora mandou direto para a representante ("Pix representante"): o financeiro diz de qual representante é e já conta como comissão paga a ela.
//  · A pagar = confirmado + combustível (km × gasolina do dia ÷ km por litro) + ajuste − pago direto.
//  · Kit novo (R$ 20, R$ 35 com expositor — provisório) só com o termo assinado; reposição tem comissão fixa da própria entrega.
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { REPS_AVAL } from "@/apps/montagem/domain/representantes";

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var pad = function(n){ return String(n).padStart(2,"0"); };
var isoData = function(a, m, dia){ return a+"-"+pad(m+1)+"-"+pad(dia); };

var COMIS0 = {pctPadrao:8, reps:[], ciclos:{A:[1,11,21], B:[6,16,26]}, corteHora:13, corteDias:1,
  nf:{ativo:false, entrega:25, pctKitNovo:2, pctAcerto1:6, revs:[]},   // TESTE do novo fluxo (26/10/2026, Curitiba, 60 dias): Representante Kit Novo entrega (R$ 25 + gasolina) e leva 2% do 1º acerto; a Rep. Acerto leva 6% no 1º acerto e 8% depois. Só vale para as revendedoras marcadas em nf.revs.
  kitNovo:20, kitNovoExpo:35, reposicao:20, exigirProm:true, termos:{}, kmPorLitro:11, combSemEnvio:200, fixoV:2, gasolinaPR:null, gasolina:{}, fech:{}, kmDia:{}};

function comisEfetiva(s){
  var c = Object.assign({}, COMIS0, s.comis || {});
  c.ciclos = Object.assign({}, COMIS0.ciclos, c.ciclos || {});
  if(!c.v2){ c.corteHora = 13; c.kmPorLitro = 11; }   // regra de 06/10/2026: km até 13h e 11 km por litro (vale até alguém salvar a configuração)
  c.nf = Object.assign({}, COMIS0.nf, c.nf || {}); c.nf.revs = c.nf.revs || [];
  c._nfPrim = nfPrimeiros(c, s);   // id do 1º acerto de cada revendedora do novo fluxo
  c.termos = c.termos || {}; c.fech = c.fech || {}; c.gasolina = c.gasolina || {}; c.kmDia = c.kmDia || {}; c.reps = c.reps || [];
  return c;
}
function ehInterno(r){ return r.origem==="interno"; }
// Novo fluxo (teste): a revendedora está marcada? Devolve {rev, repKitNovo} ou null. Só vale com a chave "ativo" ligada.
var nmNf = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); };
function nfDe(c, rev){ if(!c.nf || !c.nf.ativo) return null; var n = nmNf(rev); return (c.nf.revs||[]).filter(function(x){ return nmNf(x.rev)===n; })[0] || null; }
// o 1º acerto de cada revendedora marcada (o mais antigo): {idDoAcerto: entrada}. Os 2% e 6% valem só nele; do 2º em diante a Rep. Acerto leva a % normal.
function nfPrimeiros(c, s){
  var m = {}; if(!c.nf || !c.nf.ativo || !(c.nf.revs||[]).length) return m;
  var vistos = {}; (s.acertosConsignado||[]).filter(function(r){ return r.tipo==="acerto" && !ehInterno(r) && nfDe(c, r.rev); })
    .sort(function(a, b){ return (a.data||"")<(b.data||"") ? -1 : (a.data||"")>(b.data||"") ? 1 : String(a.id)<String(b.id) ? -1 : 1; })
    .forEach(function(r){ var k = nmNf(r.rev); if(!vistos[k]){ vistos[k] = 1; m[r.id] = nfDe(c, r.rev); } });
  return m;
}
function tsDe(r){ var t = new Date((r.data||"")+"T"+(r.hora||"00:00")+":00").getTime(); return isNaN(t) ? 0 : t; }
function tsIso(x){ var t = x ? new Date(x).getTime() : 0; return isNaN(t) ? 0 : t; }

// Status do atendimento (coluna Status do Consolidado e das Comissões)
var STATUS_KIT = {kit_novo:"Kit novo", kit_novo_exp:"Kit novo + expositor", acerto_kit:"Acerto + kit", acerto_kit_exp:"Acerto + kit + expositor",
  saiu:"Acerto + saiu", condicional:"Acerto + condicional", reposicao:"Reposição"};
function statusDe(r){
  if(r.tipo==="kit_novo_entrega") return STATUS_KIT[r.tipoKit==="kit_novo_exp" ? "kit_novo_exp" : "kit_novo"];
  if(r.tipo==="reposicao" || r.tipo==="reposicao_especial") return STATUS_KIT.reposicao;
  return STATUS_KIT[r.tipoKit] || STATUS_KIT.acerto_kit;
}
var STATUS_LISTA = ["Kit novo","Kit novo + expositor","Acerto + kit","Acerto + saiu","Reposição"];

// Todas as representantes conhecidas: as da configuração + as que já aparecem em listagens e atendimentos (com % padrão e grupo A até alguém editar)
function repsEfetivas(s){
  var c = comisEfetiva(s), nomes = [];
  var add = function(n){ if(n && n!=="Atendimento interno" && nomes.indexOf(n)<0) nomes.push(n); };
  REPS_AVAL.forEach(add);                                              // as representantes que temos até agora
  c.reps.forEach(function(x){ add(x.nome); });
  (s.listagens||[]).forEach(function(l){ add(l.rep); });
  (s.acertosConsignado||[]).forEach(function(r){ if(!ehInterno(r)) add(r.rep); });
  return nomes.sort().map(function(n){ var x = c.reps.find(function(y){ return y.nome===n; });
    return {nome:n, pct:x && x.pct!=null ? x.pct : c.pctPadrao, grupo:x && x.grupo ? x.grupo : "A", salva:!!x}; });
}
function pctDaRep(c, nome){ var x = (c.reps||[]).find(function(y){ return y.nome===nome; }); return x && x.pct!=null ? x.pct : c.pctPadrao; }
function grupoDaRep(c, nome){ var x = (c.reps||[]).find(function(y){ return y.nome===nome; }); return x && x.grupo ? x.grupo : "A"; }

// ── Datas de pagamento ──
function diasNoMes(a, m){ return new Date(a, m+1, 0).getDate(); }
function datasDoGrupo(c, grupo, ts, antes, depois){
  var base = new Date(ts), out = [];
  for(var k=-antes; k<=depois; k++){ var dm = new Date(base.getFullYear(), base.getMonth()+k, 1);
    (c.ciclos[grupo]||[]).forEach(function(dia){ out.push(isoData(dm.getFullYear(), dm.getMonth(), Math.min(dia, diasNoMes(dm.getFullYear(), dm.getMonth())))); }); }
  return out.sort();
}
// as datas de pagamento de um grupo num mês ("2026-10")
function datasDoMes(c, grupo, mes){
  var p = mes.split("-"), a = +p[0], m = +p[1]-1;
  return (c.ciclos[grupo]||[]).map(function(dia){ return isoData(a, m, Math.min(dia, diasNoMes(a, m))); }).sort();
}
// Momento do corte de uma data de pagamento (padrão: 12h do dia anterior)
function corteDe(c, iso){ var p = iso.split("-"); return new Date(+p[0], +p[1]-1, +p[2]-(c.corteDias||0), c.corteHora||0, 0, 0).getTime(); }
// Primeira data do grupo cujo corte ainda não tinha passado quando a comissão foi confirmada
function remessaDe(c, grupo, ts){ return datasDoGrupo(c, grupo, ts, 1, 2).find(function(d){ return corteDe(c, d) >= ts; }); }
// Remessa pela DATA do atendimento: o pagamento é a primeira data do grupo depois do atendimento (ex.: atendimentos de 21/09 a 30/09 → pagamento 01/10)
function remessaPorData(c, grupo, iso){ var ts = new Date(iso+"T12:00:00").getTime(); return datasDoGrupo(c, grupo, ts, 1, 2).find(function(d){ return d>iso; }); }
// Janela de atendimentos de uma data de pagamento: da data de pagamento anterior até o dia antes desta
function janelaDe(c, grupo, data){
  var ts = new Date(data+"T12:00:00").getTime(), l = datasDoGrupo(c, grupo, ts, 1, 1), i = l.indexOf(data);
  var ant = i>0 ? l[i-1] : data, p = data.split("-"), fim = new Date(+p[0], +p[1]-1, +p[2]-1);
  return {ini:ant, fim:isoData(fim.getFullYear(), fim.getMonth(), fim.getDate())};
}
// Taxa de deslocamento: faz parte do que a revendedora paga. Só conta como paga se o acerto foi quitado; senão fica registrada como não recebida (métrica das representantes)
function taxaDe(r){
  var t = r2(r.taxaDeslocamento||0); if(!(t>0) || ehInterno(r) || r.tipo!=="acerto") return {taxa:0, paga:true, aberta:0};
  var falta = faltaDe(r); return {taxa:t, paga:falta<0.01, aberta:r2(Math.min(t, falta))};
}
// Relatório de taxas por representante (quantas teve, quantas a revendedora não pagou): quem "não cobra direito" aparece com percentual alto
function relatorioTaxas(s, filtro){
  var por = {};
  (s.acertosConsignado||[]).filter(function(r){ return r.tipo==="acerto" && !ehInterno(r) && (!filtro || filtro(r)); }).forEach(function(r){
    var x = taxaDe(r); if(!(x.taxa>0)) return;
    var o = por[r.rep] = por[r.rep] || {rep:r.rep, n:0, pagas:0, naoPagas:0, valor:0, aberto:0, lista:[]};
    o.n++; o.valor = r2(o.valor+x.taxa); if(x.paga) o.pagas++; else { o.naoPagas++; o.aberto = r2(o.aberto+x.aberta); }
    o.lista.push({r:r, taxa:x.taxa, paga:x.paga, aberta:x.aberta}); });
  return Object.keys(por).map(function(k){ var o = por[k]; o.pct = o.n>0 ? Math.round(o.naoPagas/o.n*100) : 0; return o; }).sort(function(a,b){ return b.pct-a.pct || b.aberto-a.aberto; });
}
function proximasDatas(c, grupo, agora, n){
  return datasDoGrupo(c, grupo, agora, 0, 2).filter(function(d){ return new Date(d+"T23:59:59").getTime() >= agora; }).slice(0,n);
}

// ── Atendimento: pago, em aberto e comissão linha a linha ──
// Valor recebido de verdade: o financeiro pode corrigir o valor de uma linha (divergência) e "Acerto com loja" não é pagamento (fica em aberto → Inadimplência)
function valorLinha(r, i){
  var f = r.fin && r.fin[i], p = (r.pagamentos||[])[i] || {};
  if(f && f.valorReal!=null) return f.valorReal;
  var din = r.recebimento && r.recebimento.din;   // a funcionária contou o dinheiro na empresa: se for diferente do lançado, vale o contado (a diferença vira inadimplência)
  if(p.forma==="dinheiro" && din && din.contado!=null){ var primeiro = (r.pagamentos||[]).findIndex(function(x){ return x.forma==="dinheiro"; }); return i===primeiro ? din.contado : 0; }
  return p.valor||0; }
function ehLoja(r, p){ return !ehInterno(r) && p.forma==="acerto_loja"; }
// abatidoDivida: parte do que foi pago neste acerto que quitou dívida de acertos anteriores da mesma revendedora (o pagamento quita primeiro a dívida mais antiga)
function pagoDe(r){ return Math.max(0, r2((r.pagamentos||[]).reduce(function(t,p,i){ return ehLoja(r, p) ? t : t+valorLinha(r, i); }, 0) - (r.abatidoDivida||0))); }
function devidoDe(r){ return r2((r.valorDevido!=null ? r.valorDevido : r.valorAcerto||0) + (r.excedenteBrinde||0) + (r.multas||0)); }   // multas: regras de 27/10/2026 (10% do valor pendente), somam no que ela deve
// Prazo de 15 dias para quitar o pendente (regras de 27/10/2026): dias desde o acerto, dias de atraso e % de multa de atraso (1% ao dia, teto 10%). Acerto de regras antigas: null.
function prazoPendente(r, hoje){
  var N = r.regrasNovas; if(!N || !r.data) return null;
  var dias = Math.max(0, Math.floor((new Date((hoje||new Date().toISOString().slice(0,10))+"T12:00:00") - new Date(r.data+"T12:00:00"))/86400000));
  var atraso = Math.max(0, dias-(N.prazoQuitarDias||15));
  return {dias:dias, prazo:N.prazoQuitarDias||15, atraso:atraso, pct:Math.min(N.atrasoQuitacaoTetoPct||10, atraso*(N.atrasoQuitacaoPctDia||1))};
}
function faltaDe(r){ return Math.max(0, r2(devidoDe(r) - pagoDe(r))); }
// Dívidas abertas de acertos anteriores da mesma revendedora, da mais antiga para a mais nova: [{id, falta}]
function dividasAnteriores(lista, rev, exceto){
  return (lista||[]).filter(function(r){ return r.tipo==="acerto" && r.rev===rev && r.id!==exceto && faltaDe(r)>0.009; })
    .sort(function(a,b){ return (a.data||"")<(b.data||"") ? -1 : (a.data||"")>(b.data||"") ? 1 : 0; })
    .map(function(r){ return {id:r.id, falta:faltaDe(r)}; });
}
function totalDividaAnterior(lista, rev, exceto){ return r2(dividasAnteriores(lista, rev, exceto).reduce(function(t,x){ return t+x.falta; }, 0)); }

function analisar(c, r){
  var nfp = c._nfPrim && c._nfPrim[r.id];   // 1º acerto do novo fluxo: a Rep. Acerto leva só a parte dela (6%); a Rep. Kit Novo leva 2% num item à parte
  var rec = r.recebimento || {}, pct = ehInterno(r) ? 0 : (nfp ? c.nf.pctAcerto1 : pctDaRep(c, r.rep))/100, ehAcerto = r.tipo==="acerto";
  var semCond = !!rec.semCond, promPrec = ehAcerto && !!c.exigirProm && !semCond && r.tipoKit!=="saiu", prom = rec.prom || {};
  var promOk = !promPrec || !!prom.ok, conferido = !!rec.ok;
  var restante = r.valorAcerto||0, linhas = [];
  (r.pagamentos||[]).forEach(function(p, idx){
    var fin = r.fin && r.fin[idx] ? r.fin[idx] : null, loja = ehLoja(r, p), vl = valorLinha(r, idx);
    var base = loja ? 0 : Math.max(0, Math.min(vl, restante)); restante = r2(restante - base);
    var libera = null;
    if(fin && conferido && promOk) libera = Math.max(tsIso(fin.ts), tsIso(rec.em), promPrec ? tsIso(prom.em) : 0, p.ts||0);
    linhas.push({idx:idx, p:p, valor:vl, valorOrig:p.valor||0, loja:loja, div:(r.divs && r.divs[idx]) || null, base:base, comissao:r2(base*pct), extra:!!p.extra, fin:fin, conta:(fin && fin.conta) || p.descricao || "", libera:libera});
  });
  var total = r2((r.valorAcerto||0)*pct);
  var liberada = r2(linhas.filter(function(l){ return l.libera!=null; }).reduce(function(t,l){ return t+l.comissao; }, 0));
  return {pct:pct*100, total:total, liberada:liberada, retida:r2(total-liberada), linhas:linhas, conferido:conferido, promPrec:promPrec, promOk:promOk,
    pago:pagoDe(r), falta:faltaDe(r), finPend:linhas.filter(function(l){ return !l.fin; }).length};
}

// ── Itens de comissão: cada valor que a representante tem a receber (linha de pagamento, kit novo ou reposição) ──
// Confirmado = financeiro deu o check (e o agendamento já tinha conferido). Pendente = ainda falta alguma etapa.
function itensComissao(c, s, agora){
  var itens = [];
  var poe = function(it){
    it.confirmado = it.libera!=null;
    it.pagoDireto = !!it.pixRep && !!it.fin;                              // Pix representante: o Pix foi direto para ela = PAGAMENTO feito (só depende do OK do financeiro)
    it.dest = it.rep;                                                    // quem recebe: no Pix representante é a escolhida pelo financeiro
    if(it.dest){ var g = grupoDaRep(c, it.dest); it.grupo = g; it.dataRem = remessaPorData(c, g, it.data); }   // cada atendimento cai no pagamento cuja janela o contém
    itens.push(it); };
  (s.acertosConsignado||[]).filter(function(r){ return !ehInterno(r); }).forEach(function(r){
    var rec = r.recebimento || {}, conferido = !!rec.ok, st = statusDe(r);
    if(r.tipo==="acerto"){
      var a = analisar(c, r);
      a.linhas.forEach(function(l){ if(!(l.base>0 || l.valor>0)) return;
        var pixRep = l.p.forma==="pix_representante", nfp = c._nfPrim && c._nfPrim[r.id];
        if(nfp && !pixRep && l.base>0) poe({id:r.id+"#"+l.idx+"n", chave:l.idx, tipo:"pag", r:r, rev:r.rev, data:r.data, ts:tsDe(r), status:"1º acerto · Rep. Kit Novo", forma:l.p.forma, conta:l.conta, valorPago:0, valorOrig:l.valorOrig, loja:l.loja, div:l.div,
          comissao:r2(l.base*c.nf.pctKitNovo/100), fin:l.fin, conferido:conferido, promOk:a.promOk, motivo:!conferido ? "Aguardando o agendamento conferir" : !a.promOk ? "Promissória não assinada" : "", libera:l.libera, pixRep:false, rep:nfp.repKitNovo, repAcerto:r.rep, extra:l.extra, nfKitNovo:true});
        poe({id:r.id+"#"+l.idx, chave:l.idx, tipo:"pag", r:r, rev:r.rev, data:r.data, ts:tsDe(r), status:st, forma:l.p.forma, conta:l.conta, valorPago:l.valor, valorOrig:l.valorOrig, loja:l.loja, div:l.div, comissao:l.comissao,
          fin:l.fin, conferido:conferido, promOk:a.promOk, motivo:!conferido ? "Aguardando o agendamento conferir" : !a.promOk ? "Promissória não assinada" : "",
          libera:l.libera, pixRep:pixRep, rep:pixRep ? (l.fin && l.fin.rep) || null : r.rep, repAcerto:r.rep, extra:l.extra}); });
    }
    if(r.tipo==="kit_novo_entrega" || r.tipo==="acerto" && r.kitNovoOk || r.tipo==="reposicao" || r.tipo==="reposicao_especial"){
      var fin = r.fin && r.fin.k ? r.fin.k : null, repos = r.tipo.indexOf("reposicao")===0, expo = r.tipoKit==="kit_novo_exp" || (r.expositoresMarcados||[]).length>0;
      var nfk = !repos ? nfDe(c, r.rev) : null;
      var valor = repos ? (c.reposicao!=null ? c.reposicao : (r.comissao||0)) : nfk ? (r.desistencia ? 0 : c.nf.entrega) : (expo ? c.kitNovoExpo : c.kitNovo);   // reposição entregue: R$ 20 (Configurador), com a condicional assinada
      var man = c.termos[r.id], termo = repos ? true : !!(r.assinatura || man), condOk = !!(rec.prom && rec.prom.ok);   // kit novo só é pago com a condicional assinada
      var libera = fin && conferido && termo && condOk ? Math.max(tsIso(fin.ts), tsIso(rec.em)) : null;
      if(valor>0) poe({id:r.id+"#k", chave:"k", tipo:repos ? "repos" : "kitnovo", r:r, rev:r.rev, data:r.data, ts:tsDe(r), status:r.tipo==="acerto" ? (expo ? "Kit novo + expositor" : "Kit novo") : st, forma:"", conta:fin ? fin.conta : "",
        valorPago:0, comissao:r2(valor), fin:fin, conferido:conferido, motivo:!conferido ? "Aguardando o agendamento conferir" : !termo ? "Termo do kit novo não assinado" : !condOk ? "Condicional não assinada" : "", libera:libera, rep:nfk ? nfk.repKitNovo : r.rep, repAcerto:r.rep, nfKitNovo:!!nfk, extra:false, termoAuto:!!r.assinatura, termoManual:man || null, termoOk:termo});
    }
  });
  return itens;
}

// Fechamento de uma representante numa data de pagamento
function chaveFech(data, rep){ return data+"|"+rep; }
function resumoSituacao(c, itens, rep, data, agora){
  var meus = itens.filter(function(i){ return i.dest===rep && i.dataRem===data; });
  var soma = function(l){ return r2(l.reduce(function(t,i){ return t+i.comissao; }, 0)); };
  var normais = meus.filter(function(i){ return !i.pixRep; });                        // o Pix representante não é comissão pendente nem a pagar: é só pagamento
  var confirmado = soma(normais.filter(function(i){ return i.confirmado; })), pendente = soma(normais.filter(function(i){ return !i.confirmado; })),
      direto = r2(meus.filter(function(i){ return i.pagoDireto; }).reduce(function(t,i){ return t+i.valorPago; }, 0));
  var fech = c.fech[chaveFech(data, rep)] || {}, preco = (c.gasolinaPR && c.gasolinaPR.valor>0) ? c.gasolinaPR.valor : (c.gasolina[data] || 0);   // preço médio da ANP (um valor só, atualizado por quem paga)
  var porKm = c.kmPorLitro>0 ? preco/c.kmPorLitro : 0, ajuste = 0, corte = corteDe(c, data), aposCorte = agora>=corte;
  // combustível: SÓ a representante informa o km, até o corte. Duas formas, à escolha dela: "total" (um número no final) ou "dias" (km início/fim de cada dia do período).
  // Sem km no prazo, paga só o valor fixo (Configurador).
  var jan = janelaDe(c, grupoDaRep(c, rep), data), kmDias = 0, ultTs = 0, diasKm = [];
  for(var dt = new Date(jan.ini+"T12:00:00"); isoDataD(dt) <= jan.fim; dt.setDate(dt.getDate()+1)){ var dia = isoDataD(dt), k = c.kmDia[chaveKmDia(rep, dia)];
    if(k && k.ini!=null && k.fim!=null && k.fim>=k.ini){ kmDias += k.fim-k.ini; ultTs = Math.max(ultTs, tsIso(k.tsFim)); diasKm.push(dia); } }
  kmDias = r2(kmDias);
  var kmModo = "total";   // o km é só o TOTAL DO PERÍODO (decisão do Marcus); o dia a dia (c.kmDia) não é mais usado
  var kmUso = kmModo==="dias" ? kmDias : (fech.km||0);
  var kmOk = kmUso>0 && (kmModo==="dias" ? ultTs<=corte : (fech.kmPor!=="rep" || tsIso(fech.kmTs)<=corte)), combFixo = meus.length>0 && aposCorte && !kmOk;
  var comb = combFixo ? r2(c.combSemEnvio) : r2((kmOk ? kmUso : 0)*porKm);
  var aPagar = r2(confirmado + comb);
  var manuais = r2((fech.pagamentos||[]).reduce(function(t,p){ return t+(p.valor||0); }, 0)), pagos = r2(manuais + direto);   // Pix representante já conta como pago
  var falta = r2(aPagar - pagos);
  return {itens:meus, comissaoTotal:r2(confirmado+pendente), litros:c.kmPorLitro>0 ? r2(kmUso/c.kmPorLitro) : 0, confirmado:confirmado, datasAt:meus.map(function(i){ return i.data; }).filter(function(x,k,a){ return x && a.indexOf(x)===k; }).sort(), pendente:pendente, direto:direto, comb:comb, ajuste:ajuste, aPagar:aPagar, pagos:pagos, falta:falta, km:kmUso, kmTotal:fech.km||0, kmDias:kmDias, kmModo:kmModo, diasKm:diasKm, kmTs:fech.kmTs||null, kmPor:fech.kmPor||null, kmOk:kmOk, combFixo:combFixo, preco:preco, porKm:porKm,
    corte:corte, aposCorte:agora>=corte, paga:(aPagar>0.009 || pagos>0.009) && falta<=0.009, lista:fech.pagamentos||[], diretos:meus.filter(function(i){ return i.pagoDireto; })};
}

// Quilometragem de um dia da representante: km do carro no início e no fim do dia, km rodados e km por atendimento
function isoDataD(d){ return isoData(d.getFullYear(), d.getMonth(), d.getDate()); }
function chaveKmDia(rep, dia){ return rep+"|"+dia; }
function resumoKmDia(c, s, rep, dia){
  var k = c.kmDia[chaveKmDia(rep, dia)] || {}, ini = k.ini, fim = k.fim;
  var rodados = ini!=null && fim!=null && fim>=ini ? r2(fim-ini) : null;
  var n = (s.acertosConsignado||[]).filter(function(r){ return r.origem!=="interno" && r.rep===rep && r.data===dia; }).length;
  return {dia:dia, ini:ini, fim:fim, tsIni:k.tsIni||null, tsFim:k.tsFim||null, rodados:rodados, atend:n, porAtend:rodados!=null && n>0 ? r2(rodados/n) : null};
}

// Quem fez: o estado guarda o id da pessoa logada; textos antigos (nome) passam como estão
function quemNome(v){ return typeof v==="number" ? nomeDe(v) : (v || "—"); }
function dataHora(x){ var t = typeof x==="number" ? x : tsIso(x); return t ? new Date(t).toLocaleString("pt-BR",{day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit"}) : "—"; }
function fmtDataBR(iso){ return iso ? iso.split("-").reverse().join("/") : ""; }

export { nfDe, nfPrimeiros, taxaDe, relatorioTaxas, remessaPorData, janelaDe, valorLinha, ehLoja, chaveKmDia, resumoKmDia, quemNome, dataHora, fmtDataBR, COMIS0, STATUS_LISTA, statusDe, comisEfetiva, repsEfetivas, pctDaRep, grupoDaRep, corteDe, remessaDe, datasDoGrupo, datasDoMes, proximasDatas,
  pagoDe, devidoDe, faltaDe, prazoPendente, dividasAnteriores, totalDividaAnterior, analisar, itensComissao, chaveFech, resumoSituacao, ehInterno, tsDe, r2 };
