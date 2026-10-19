// Sorelly Admin · montagem — domain/saldos-contas.js
// Saldos das contas bancárias (o "Contas Bancárias" do admin de produção) e a prova real do caixa mês a mês.
// A funcionária lança TODO DIA o saldo de cada conta, por CNPJ. Conta sem lançamento no dia vale o último saldo conhecido (carry-forward).
// O saldo de fim de mês NÃO é digitado: é o total das contas no último dia lançado do mês. Saldo início = saldo fim do mês anterior.
// Estrutura copiada do admin (blocos e contas, sem saldos nem limites: os limites de cheque especial são preenchidos em Configurador).
var BLOCOS0 = [
  {id:"34", nome:"Sorelly Atac · 34"}, {id:"46", nome:"Mayz Comércio · 46"}, {id:"59", nome:"Serenity · 59"}, {id:"67", nome:"Axis · 67"},
  {id:"HO", nome:"H&O"}, {id:"PART", nome:"Particular"}, {id:"DIN", nome:"Dinheiro"}, {id:"BLOQ", nome:"Bloqueado / A receber"}];
var TIPOS_CONTA = {PJ:"Empresa", PF:"Pessoa física", CAIXA:"Caixa / aplicação"};
// [id, nome, bloco, tipo, bloqueada]
var CONTAS_LISTA = [
  ["aplic_sicredi","Aplicação Sicredi","34","CAIXA",false], ["aplic_caixa","Aplicação Caixa Econômica","34","CAIXA",false],
  ["itau_emp_34","Itaú Empresas 34","34","PJ",false], ["caixa_34","Caixa Econômica 34","34","PJ",false], ["sicredi_34","Sicredi Sorelly 34","34","PJ",false],
  ["sicredi_rot_34","Sicredi Rotativo 34","34","PJ",false], ["safra_34","Safra 34","34","PJ",false], ["unicred_34","Unicred 34","34","PJ",false],
  ["sicredi_46","Sicredi Shopping 46","46","PJ",false], ["stone_46","Stone 46","46","PJ",false], ["safra_46","Safra 46","46","PJ",false],
  ["bradesco_46","Bradesco 46","46","PJ",false], ["caixa_46","Caixa 46","46","PJ",false], ["unicred_46","Unicred 46","46","PJ",false],
  ["sicredi_59","Sicredi Serenity","59","PJ",false], ["aplic_sicredi_59","Aplicação Sicredi Serenity","59","CAIXA",false],
  ["safra_59","Safra Serenity","59","PJ",false], ["bradesco_59","Bradesco Serenity","59","PJ",false],
  ["sicredi_ho_app","Sicredi H&O App","HO","PJ",false], ["itau_black","Itaú Black","PART","PF",false],
  ["dinheiro_sorelly","Dinheiro Sorelly","DIN","CAIXA",false], ["dinheiro_caixa_seguro","Dinheiro Caixa Seguro","DIN","CAIXA",false],
  ["retido_safra_34","Retido Safra 34","BLOQ","PJ",true], ["retido_safra_46","Retido Safra 46","BLOQ","PJ",true]];
// Dados reais (contas, limites e saldos) ficam num arquivo só deste computador, fora do GitHub; sem ele, vale a lista genérica abaixo.
var LOCAL = (function(){ var m = import.meta.glob("./saldos-iniciais.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : null; })();
var FAT_NF_LOCAL = LOCAL && LOCAL.fatNF ? LOCAL.fatNF : null;
var FAT_DIA_LOCAL = LOCAL && LOCAL.fatDia ? LOCAL.fatDia : null;
var RECEBER_LOCAL = LOCAL && LOCAL.receber ? LOCAL.receber : null;
var RECEBER_MAPA_LOCAL = LOCAL && LOCAL.receberMapa ? LOCAL.receberMapa : {};
var PAGOS_LOCAL = LOCAL && LOCAL.pagos ? LOCAL.pagos : null;
/** Faturamento por dia → acumulado do mês em cada data (faturamentoDiario guarda o ACUMULADO do mês). */
function acumularFaturamento(fatDia, fd){
  var out = JSON.parse(JSON.stringify(fd||{})), porMes = {};
  Object.keys(fatDia||{}).sort().forEach(function(k){ var m = k.slice(0,7), c = porMes[m] || (porMes[m] = {r:0, a:0}); c.r += fatDia[k].recebido||0; c.a += fatDia[k].acertos||0; c.n = (c.n||0)+(fatDia[k].nf||0); c.l = (c.l||0)+(fatDia[k].loja||0); c.u = (c.u||0)+(fatDia[k].recup||0); out[k] = Object.assign({}, out[k], {recebido:Math.round(c.r*100)/100, acertos:c.a, loja:Math.round(c.l*100)/100, nf:Math.round((c.n||0)*100)/100, recup:Math.round(c.u*100)/100}); });
  return out;
}
function saldosContas0(){
  if(LOCAL) return {blocos:JSON.parse(JSON.stringify(LOCAL.blocos)), contas:JSON.parse(JSON.stringify(LOCAL.contas)), saldos:JSON.parse(JSON.stringify(LOCAL.saldos)), fechamentos:{}, aportes:{}, ajustes:{}};
  return {blocos:BLOCOS0.map(function(b){ return Object.assign({}, b); }),
    contas:CONTAS_LISTA.map(function(c){ return {id:c[0], nome:c[1], bloco:c[2], tipo:c[3], limite:0, bloqueada:c[4]}; }),
    saldos:{}, fechamentos:{}, aportes:{},      // fechamentos: {"2026-10-14": {"34":true}} = CNPJs já conferidos naquele dia
    // {"2026-10-13": {idDaConta: valor}}
    ajustes:{}};    // {"2026-10": [{id, desc, valor}]}  valor + = entrou dinheiro que não é faturamento · valor − = saiu fora das contas a pagar
}
// Feriados nacionais sem trabalho: aparecem na mesma cor do fim de semana, com a observação. Acrescente aqui quando houver outros (ex.: municipais).
var FERIADOS = {"2026-01-01":"Confraternização Universal","2026-04-03":"Sexta-feira Santa","2026-04-21":"Tiradentes","2026-05-01":"Dia do Trabalho","2026-06-04":"Corpus Christi","2026-09-07":"Independência","2026-10-12":"N. Sra. Aparecida","2026-11-02":"Finados","2026-11-15":"Proclamação da República","2026-12-25":"Natal"};
var p2 = function(n){ return String(n).padStart(2,"0"); };
var isoDia = function(d){ return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate()); };
var chaveMes = function(ano, mes){ return ano+"-"+p2(mes+1); };
function datasLancadas(sc){ return Object.keys((sc&&sc.saldos)||{}).filter(function(k){ return Object.keys(sc.saldos[k]).length>0; }).sort(); }
/** Último saldo conhecido da conta até a data (inclusive). null = nunca lançado. */
function saldoConta(sc, id, ate){
  var ds = datasLancadas(sc);
  for(var i=ds.length-1; i>=0; i--){ if(ds[i]<=ate && sc.saldos[ds[i]][id]!==undefined) return sc.saldos[ds[i]][id]; }
  return null;
}
/** Totais numa data: real (soma sem as bloqueadas), disponível (saldo + limite, sem as bloqueadas), bloqueado e cada bloco. */
function posicaoEm(sc, ate){
  var blocos = {}, real = 0, disp = 0, bloq = 0;
  (sc.blocos||[]).forEach(function(b){ blocos[b.id] = {id:b.id, nome:b.nome, real:0, disp:0, contas:[]}; });
  (sc.contas||[]).forEach(function(c){
    var v = saldoConta(sc, c.id, ate), saldo = v||0, b = blocos[c.bloco]; if(!b) return;
    var d = c.bloqueada ? 0 : saldo + (c.limite||0);
    b.contas.push({conta:c, saldo:saldo, lancado:v!==null, disp:d}); b.real += saldo; b.disp += d;
    if(c.bloqueada) bloq += saldo; else { real += saldo; disp += d; }
  });
  return {real:real, disp:disp, bloq:bloq, blocos:(sc.blocos||[]).map(function(b){ return blocos[b.id]; })};
}
/** Data de referência: o lançamento mais recente com data ≤ hoje. */
function dataReferencia(sc, hoje){ var ds = datasLancadas(sc).filter(function(k){ return k<=hoje; }); return ds.length ? ds[ds.length-1] : null; }
/** Total real no último dia lançado até a data limite (null se não há lançamento). */
function totalReal(sc, ate){ var ds = datasLancadas(sc).filter(function(k){ return k<=ate; }); return ds.length ? {data:ds[ds.length-1], real:posicaoEm(sc, ds[ds.length-1]).real} : null; }
/** Fechamento do mês anterior = último dia lançado ANTES do dia 1º do mês. */
function saldoInicioMes(sc, ano, mes){ var r = totalReal(sc, isoDia(new Date(ano, mes, 0))); return r; }
/** Saldo fim do mês = último dia lançado dentro do mês (até hoje, se o mês estiver aberto). null = mês sem lançamentos. */
function saldoFimMes(sc, ano, mes, hoje){
  var ult = isoDia(new Date(ano, mes+1, 0)); if(hoje && hoje<ult) ult = hoje;
  var r = totalReal(sc, ult); return r && r.data>=chaveMes(ano, mes)+"-01" ? r : null;
}
/** Prova real do mês: o resultado que o Faturamento e as Contas a pagar dizem × o que as contas bancárias mostram. */
function provaDoMes(sc, ano, mes, recebido, pago, hoje){
  var ini = saldoInicioMes(sc, ano, mes), fim = saldoFimMes(sc, ano, mes, hoje);
  var ajustes = ((sc.ajustes||{})[chaveMes(ano, mes)]||[]), somaAj = ajustes.reduce(function(t,a){ return t+(a.valor||0); },0);
  var resultado = (recebido||0) - (pago||0), variacao = ini && fim ? fim.real - ini.real : null;
  return {ini:ini, fim:fim, recebido:recebido||0, pago:pago||0, resultado:resultado, variacao:variacao, ajustes:ajustes, somaAjustes:somaAj,
    esperado:resultado+somaAj, divergencia: variacao===null ? null : variacao - (resultado+somaAj)};
}

export { RECEBER_LOCAL, RECEBER_MAPA_LOCAL, FAT_DIA_LOCAL, acumularFaturamento, FAT_NF_LOCAL, PAGOS_LOCAL, FERIADOS, BLOCOS0, TIPOS_CONTA, CONTAS_LISTA, saldosContas0, isoDia, chaveMes, datasLancadas, saldoConta, posicaoEm, dataReferencia, totalReal, saldoInicioMes, saldoFimMes, provaDoMes };
