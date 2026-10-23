// Sorelly Admin · montagem e bipagem — domain/financeiro.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.

// Contas a pagar: lançamento manual por mês, só 2 números (Pago e A pagar); o Total é sempre calculado (pago+apagar).
// Meses passados fechados ficam "fixado" (não editam mais); meses futuros só têm a previsão em "apagar".
var MESES_LONGO = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var CONTAS_PAGAR_DEMO = {"2026": {   // atualizado em 13/10/2026 (Marcus): pago de jan a set; outubro pago + a pagar; nov e dez só a pagar
  0:{pago:1306339.82, apagar:0, fixado:true}, 1:{pago:1029580.06, apagar:0, fixado:true}, 2:{pago:1160323.33, apagar:0, fixado:true},
  3:{pago:1242369.07, apagar:0, fixado:true}, 4:{pago:1375428.85, apagar:0, fixado:true}, 5:{pago:1433820.45, apagar:0, fixado:true},
  6:{pago:1369387.93, apagar:0, fixado:true}, 7:{pago:1551292.19, apagar:0, fixado:true}, 8:{pago:1422665.77, apagar:0, fixado:true},
  9:{pago:530060.74, apagar:955527.90, fixado:false},   // outubro: pago = soma dos dias lançados (01 a 13/10 = 530.060,74); total do mês 1.485.588,64; o pago cresce com os lançamentos diários   // outubro: valores informados pelo financeiro (manual vale sobre a soma dos dias)
  10:{pago:0, apagar:1457779.93, fixado:false}, 11:{pago:0, apagar:1479278.78, fixado:false}
}};
// Previsão de faturamento: lançamento diário, sempre referente ao DIA ANTERIOR (Amanda de manhã; se faltar, o Lucas lança).
// "revendedoras" é a contagem TOTAL naquele dia (não soma; é o número absoluto, como na exportação de revendedoras diárias).
var FATURAMENTO_DIARIO_DEMO = {   // dados reais passados pelo usuário; uma data por mês fechado (a última), com o total do mês inteiro
  "2026-01-31":{recebido:1392910.06, acertos:1654, revendedoras:1827},
  "2026-02-28":{recebido:1012357.60, acertos:1530, revendedoras:1750},
  "2026-03-31":{recebido:1157120.52, acertos:1635, revendedoras:1791},
  "2026-04-30":{recebido:1263754.42, acertos:1653, revendedoras:1780},
  "2026-05-31":{recebido:1416595.39, acertos:1749, revendedoras:1836},
  "2026-06-30":{recebido:1318670.29, acertos:1764, revendedoras:1902},
  "2026-07-31":{recebido:1214587.01, acertos:1669, revendedoras:1834},
  "2026-08-31":{recebido:1361845.04, acertos:1741, revendedoras:1834},
  "2026-09-27":{recebido:1139192.78, acertos:1399, revendedoras:2007},
  "2026-09-28":{recebido:1152731.48, acertos:1413, revendedoras:2007},   // 28/09/2026, sem contagem nova de revendedoras nesta data, mantido o último número real (27/09)
  "2026-09-30":{recebido:1427724.88, acertos:1778, revendedoras:2023, travado:true},   // fechamento de Setembro TRAVADO (decisão do Marcus, 16/10/2026): R$ 1.427.724,88 e 1.778 acertos
  "2026-10-08":{recebido:207855.36, acertos:291, revendedoras:2051}, "2026-10-14":{recebido:530576.39, acertos:668, revendedoras:2077, fixadoEm:1792022400000}, "2026-10-15":{recebido:630605.94, acertos:791, revendedoras:2078, fixadoEm:1792108800000}     // atualizado até ontem (08/10), passado pelo Marcus em 09/10
};
// Meta mensal (vem do setor de Agendamento): revendedoras com kit no início do mês e quantos acertos eles previram para o mês inteiro.
// Histórico de abertura por mês, passado pelo usuário (índice do mês: 0=Jan ... 8=Set).
var META_MENSAL_DEMO = {"2026": {
  0:{base:1827, previstos:1754}, 1:{base:1750, previstos:1707}, 2:{base:1791, previstos:1757}, 3:{base:1780, previstos:1667},
  4:{base:1836, previstos:1763}, 5:{base:1902, previstos:1826}, 6:{base:1834, previstos:1793}, 7:{base:1834, previstos:1815},
  8:{base:1932, previstos:1889},   // base e previstos de Setembro ainda são o valor antigo — a confirmar (ver pergunta ao usuário)
  9:{base:2023, previstos:1976}   // base = fechamento de Setembro (2.023), previstos passados pelo usuário em 01/10
}};
// Vendido na ponta (relatório de notas fiscais), passado pelo usuário mês a mês. "comBrindes" = venda com brindes e trocas;
// "semBrinde" = preço de venda sem brinde. Custo (com/sem brinde) ainda não veio — fica de fora até ele mandar.
// TES pra puxar o relatório contando com brindes: S001/S002 (atual) · até fev/2026: S0501/S0502.
var VENDIDO_PONTA_DEMO = {"2026": {
  1:{comBrindes:2527330.59, semBrinde:1553141.43}, 2:{comBrindes:1829615.14, semBrinde:1779668.14}, 3:{comBrindes:2129250.02, semBrinde:1966019.75},
  4:{comBrindes:2341501.15, semBrinde:2194269.12}, 5:{comBrindes:2577440.48, semBrinde:2041566.18}, 6:{comBrindes:2722091.60, semBrinde:1950157.95}
}};
// Contas pagas: lançamento diário por CNPJ — é uma FOTO do dia (não altera a grade mensal de Contas a pagar, que é lançada
// à parte). O total pago é sempre a soma dos CNPJs + "contas por fora"; o faturado do dia entra junto, por enquanto também
// digitado aqui (dá pra reavaliar puxar automaticamente da Previsão de Faturamento, é só pedir). Clonado dos prints do
// admin que o usuário mandou (2026-09-28) — a fonte real desse admin não está neste projeto.
var CNPJS_CONTAS_PAGAS = ["34","46","59","67"];
var CONTAS_PAGAS_DIARIO_DEMO = {
  "2026-09-01":{cnpjs:{34:16121.50,46:18009.09,59:88022.00,67:0}, contasPorFora:10080.10, faturado:7266.80},
  "2026-09-02":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:16195.29, faturado:10394.60},
  "2026-09-03":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:5853.00, faturado:22489.80},
  "2026-09-04":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:109403.18, faturado:30661.35},
  "2026-09-08":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:525.00, faturado:0},
  "2026-09-09":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:52170.72, faturado:49026.30},
  "2026-09-10":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:126025.32, faturado:150141.65},
  "2026-09-11":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:74937.41, faturado:108388.99},
  "2026-09-15":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:36565.86, faturado:107315.13},
  "2026-09-16":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:3471.23, faturado:55653.25},
  "2026-09-17":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:44746.90, faturado:80623.71},
  "2026-09-18":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:153963.28, faturado:56640.15},
  "2026-09-20":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:50216.54, faturado:0},
  "2026-09-21":{cnpjs:{34:14315.48,46:24733.86,59:88412.13,67:4428.60}, contasPorFora:16053.61, faturado:98833.00},
  "2026-09-22":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:54712.95, faturado:0},
  "2026-09-23":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:48210.36, faturado:0},
  "2026-09-24":{cnpjs:{34:1517.69,46:4060.29,59:3052.82,67:0}, contasPorFora:3518.79, faturado:0},
  "2026-09-25":{cnpjs:{34:2705.31,46:1851.26,59:2632.56,67:0}, contasPorFora:41539.85, faturado:0},
  "2026-09-28":{cnpjs:{34:0,46:4391.14,59:0,67:0}, contasPorFora:0, faturado:0},
  "2026-09-30":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:146564.88, faturado:0},
  // Outubro/2026, passado pelo Marcus em 09/10 (contas pagas por CNPJ + faturado e acertos do dia, do resumo "contas a pagar x faturamento")
  "2026-10-01":{cnpjs:{34:14645.29,46:22515.89,59:52329.08,67:8316.46}, contasPorFora:18388.32, faturado:8883.20, acertos:12},
  "2026-10-02":{cnpjs:{34:32308.17,46:489.63,59:225.20,67:705.11}, contasPorFora:9417.89, faturado:15571.15, acertos:29},
  "2026-10-03":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:0, faturado:0, acertos:0},
  "2026-10-04":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:0, faturado:0, acertos:0},
  "2026-10-05":{cnpjs:{34:339.00,46:175.00,59:15128.11,67:470.30}, contasPorFora:13397.18, faturado:29848.99, acertos:47},
  "2026-10-06":{cnpjs:{34:19788.95,46:60573.52,59:40112.41,67:9030.64}, contasPorFora:2039.80, faturado:34802.67, acertos:49},
  "2026-10-07":{cnpjs:{34:7482.81,46:8251.94,59:357.68,67:350.85}, contasPorFora:7443.70, faturado:70328.35, acertos:105},
  "2026-10-08":{cnpjs:{34:1876.32,46:1654.00,59:122.85,67:4135.50}, contasPorFora:2615.64, faturado:47367.10, acertos:58},
  // 09, 10 e 13/10: o Marcus passou só o TOTAL geral pago (ainda sem a divisão por CNPJ): entra em "contas por fora" até ele passar por CNPJ. 11 e 12 foram fim de semana, sem pagamento.
  "2026-10-09":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:20986.79, faturado:0, acertos:0},
  "2026-10-10":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:31897.33, faturado:0, acertos:0},
  "2026-10-13":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:128155.96, faturado:0, acertos:0},
  // 14/10/2026 fechado (passado pelo Marcus, 15/10): o faturado e os acertos do dia saem sozinhos do faturamento fixado (diferença para o dia anterior)
  "2026-10-14":{cnpjs:{34:19030.27,46:3394.07,59:1002.80,67:0}, contasPorFora:25764.52, faturado:104466.15, acertos:142},
  // valores já pagos, com baixa nestes dias (a funcionária vai acumulando e dá baixa na data): organizar depois
  "2026-10-20":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:10658.69, faturado:0, acertos:0},
  "2026-10-30":{cnpjs:{34:0,46:0,59:0,67:0}, contasPorFora:50418.77, faturado:0, acertos:0}
};
var VERSAO_CPD = 4;   // sobe quando os dias de demonstração acima mudam (store.js recoloca os dias de outubro)

// ── Contas pagas e faturamento DIÁRIOS (tela Contas a pagar → Diário) ──
function totalDiaCP(dia){ var c = (dia && dia.cnpjs) || {}; return CNPJS_CONTAS_PAGAS.reduce(function(t,k){ return t+(c[k]||0); },0) + ((dia && dia.contasPorFora)||0); }
// Contas do mês para o resto do sistema: se o mês tem dias lançados (e não está fixado), o PAGO é a soma dos dias e o A PAGAR é o
// que sobra do total previsto do mês (pago+a pagar lançados à mão); senão vale a grade mensal de Contas a pagar.
function contasDoMes(s, anoStr, mes){
  var m = Object.assign({pago:0, apagar:0}, ((s.contasPagar||{})[anoStr]||{})[mes]);
  if(m.fixado || m.manual) return m;   // manual = valor passado pelo financeiro vale sobre a soma dos dias
  var pref = anoStr+"-"+String(mes+1).padStart(2,"0")+"-", dias = Object.keys(s.contasPagasDiario||{}).filter(function(k){ return k.indexOf(pref)===0; });
  if(!dias.length) return m;
  var pago = dias.reduce(function(t,k){ return t+totalDiaCP(s.contasPagasDiario[k]); },0), total = Math.max(m.pago+m.apagar, pago);
  return Object.assign({}, m, {pago:pago, apagar:total-pago});
}
// Faturamento "ao vivo": o registro oficial é do dia anterior (fixo); durante o dia o Marcus lança o acumulado de HOJE (s.fatHoje)
// só para acompanhar e atualizar média/previsão. No dia seguinte o de hoje deixa de valer e entra o oficial.
function fatEfetivo(s){
  var fd = Object.assign({}, s.faturamentoDiario), h = s.fatHoje, hoje = isoDia0(new Date());
  if(h && h.data===hoje){ var revs = Object.keys(s.revendedorasDiario||{}).sort(); fd[hoje] = {loja:(fd[hoje]||{}).loja||0, recup:(fd[hoje]||{}).recup||0, nf:(fd[hoje]||{}).nf||0, recebido:h.recebido||0, acertos:h.acertos||0, revendedoras:revs.length ? s.revendedorasDiario[revs[revs.length-1]] : 0, parcial:true}; }
  return fd;
}
function isoDia0(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
// Faturado e acertos de CADA DIA do mês atual, calculados sozinhos a partir do acumulado do mês (registro do dia anterior, "Hoje" ou dia fixado):
// valor do dia = acumulado daquele dia − tudo que já foi somado nos dias anteriores. Dia sem registro de acumulado usa o que foi digitado em Contas a pagar → Diário.
function faturadoPorDia(s, ano, mes){
  var fd = fatEfetivo(s), dias = new Date(ano, mes+1, 0).getDate(), out = {}, somaF = 0, somaA = 0, p2 = function(n){ return String(n).padStart(2,"0"); };
  var hojeMes = new Date().getFullYear()===ano && new Date().getMonth()===mes;
  for(var d=1; d<=dias; d++){
    var iso = ano+"-"+p2(mes+1)+"-"+p2(d), cum = fd[iso], man = (s.contasPagasDiario||{})[iso] || {};
    if(hojeMes && cum && cum.recebido!==undefined){
      var f = Math.max(0, cum.recebido-somaF), a = Math.max(0, (cum.acertos||0)-somaA);
      out[iso] = {faturado:f, acertos:a, auto:true, parcial:!!cum.parcial}; somaF += f; somaA += a;
    } else { var f2 = man.faturado||0, a2 = man.acertos||0; out[iso] = {faturado:f2, acertos:a2, auto:false}; somaF += f2; somaA += a2; }
  }
  return out;
}
// ── Previsão de Faturamento vs Contas a Pagar: lançamento diário (sempre do DIA ANTERIOR), ligado à tela de Contas a pagar ──
// Meta do mês para a previsão. Se o Marcus lançou "a realizar" (s.fechaMes["AAAA-MM"] = {aRealizar, carregar}), o total de acertos do mês passa a ser
// FEITOS + vendas do Carregar sem valor + A REALIZAR (e não mais os previstos do Agendamento); a média continua só com os feitos que têm valor.
// feitos = acertos lançados até agora no mês. Devolve {base, previstos (total que vale), previstosAgend, carregar, aRealizar, manual}.
function metaDoMes(s, anoStr, mes, feitos){
  var base = Object.assign({base:0, previstos:0}, ((s.metaMensal||{})[anoStr]||{})[mes]), fm = (s.fechaMes||{})[anoStr+"-"+String(mes+1).padStart(2,"0")] || {};
  var carregar = Number(fm.carregar)||0, aRealizar = Number(fm.aRealizar)||0;
  if(!(aRealizar>0)) return {base:base.base, previstos:base.previstos, previstosAgend:base.previstos, carregar:carregar, aRealizar:0, manual:false};
  return {base:base.base, previstos:(feitos||0)+carregar+aRealizar, previstosAgend:base.previstos, carregar:carregar, aRealizar:aRealizar, manual:true};
}
function isoOntem(){ var d = new Date(); d.setDate(d.getDate()-1); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
// Crescimento real de revendedoras, calculado a partir do CSV que o usuário mandou (revendedoras-diarias, até 27/09/2026 = 2007).
// Cada valor é a média de variação líquida por dia na janela. Para atualizar, é só mandar um CSV novo.
var CRESCIMENTO_REVENDEDORAS = [{lb:"7 dias", dia:1.00},{lb:"15 dias", dia:2.20},{lb:"30 dias", dia:1.87},
  {lb:"60 dias", dia:2.52},{lb:"90 dias", dia:1.54},{lb:"Último mês (ago)", dia:2.87}];
// meses FECHADOS (antes do mês atual) que já têm base/previstos (Agendamento) e faturamento lançado — usados para calcular as médias históricas
function mesesFechados(s, anoStr, mesAtual){
  var out = [];
  for(var i=0;i<mesAtual;i++){
    var meta = ((s.metaMensal||{})[anoStr]||{})[i];
    var chaves = Object.keys(s.faturamentoDiario||{}).filter(function(k){ return k.slice(0,7)===anoStr+"-"+String(i+1).padStart(2,"0"); }).sort();
    var fat = chaves.length ? s.faturamentoDiario[chaves[chaves.length-1]] : null;
    if(meta && meta.base>0 && fat) out.push({mes:i, base:meta.base, previstos:meta.previstos, realizados:fat.acertos, recebido:fat.recebido});
  }
  return out;
}
// Ajuste sazonal sobre a média de faturamento por revendedora, mês a mês (0=Jan ... 11=Dez). Novembro e dezembro vendem mais
// (fim de ano); janeiro cai um pouco na volta; fevereiro ainda vem mais fraco. Provisório — o usuário vai confirmar/ajustar
// com dados reais de anos anteriores assim que mandar. Usado tanto no ano corrente quanto em anos seguintes projetados.
var FATOR_SAZONAL = {10:1.05, 11:1.10, 0:1.10, 1:0.90};
// projeta o ano inteiro: meses fechados usam o real; o mês atual usa o lançamento mais recente (parcial); os futuros usam a cadeia
// revendedoras → previstos → realizados → faturamento, com as proporções médias (ponderadas pelo tamanho de cada mês) dos meses fechados.
// metaPct (94/95/96, escolhido na tela) troca a conversão previstos→realizados pela meta assumida; sem ele, usa a média histórica.
function projetarAno(s, anoStr, janelaIdx, metaPct){
  var hoje = new Date(), mesAtual = hoje.getMonth();
  var fechados = mesesFechados(s, anoStr, mesAtual);
  var somaBase=0, somaPrevistos=0, somaRealizados=0, somaRecebido=0;
  fechados.forEach(function(m){ somaBase+=m.base; somaPrevistos+=m.previstos; somaRealizados+=m.realizados; somaRecebido+=m.recebido; });
  var ratioPB = somaBase>0 ? somaPrevistos/somaBase : 0;
  var ratioRP = somaPrevistos>0 ? somaRealizados/somaPrevistos : 0;
  var ratioRPUsado = metaPct ? metaPct/100 : ratioRP;   // o que realmente entra na conta dos meses futuros
  var mediaAcertoHist = somaRealizados>0 ? somaRecebido/somaRealizados : 0;
  var entradas = Object.keys(s.faturamentoDiario||{}).sort();
  var revDatas = Object.keys(s.revendedorasDiario||{}).sort();
  var revHoje = revDatas.length ? s.revendedorasDiario[revDatas[revDatas.length-1]] : 0;
  var mFechado = {}; fechados.forEach(function(m){ mFechado[m.mes]=m; });
  var porMes = [];
  var mediaAtualMes = mediaMesAtual(s, anoStr, mesAtual);   // média por acerto do mês atual, já com o lançamento de hoje
  for(var i=0;i<12;i++){
    if(mFechado[i]){ porMes.push({mes:i, valor:mFechado[i].recebido, tipo:"real", realizados:mFechado[i].realizados, mediaAcerto:mFechado[i].realizados>0 ? mFechado[i].recebido/mFechado[i].realizados : 0}); continue; }
    if(i===mesAtual){
      var doMesAtual = entradas.filter(function(k){ return k.slice(0,7)===anoStr+"-"+String(i+1).padStart(2,"0"); });
      var ultAt = doMesAtual.length ? s.faturamentoDiario[doMesAtual[doMesAtual.length-1]] : null;
      var v = ultAt ? ultAt.recebido : 0;
      porMes.push({mes:i, valor:v, tipo:"atual", realizados:ultAt ? ultAt.acertos : 0, mediaAcerto:mediaAtualMes}); continue;
    }
    if(i<mesAtual){ porMes.push({mes:i, valor:0, tipo:"real"}); continue; }
    var dia1 = new Date(Number(anoStr), i, 1), dias = Math.round((dia1-hoje)/86400000);
    var revProj = revHoje + taxaCrescimento(s, janelaIdx)*dias;
    var fatorSazonal = FATOR_SAZONAL[i] || 1;   // aplicado sobre a média de faturamento por revendedora, não sobre a contagem de previstos
    var alta = altaDe(s, i), usaAlta = alta!==undefined && mediaAtualMes>0;   // novembro/dezembro: média atual + 5% / + 15% (configurável)
    var mediaProj = usaAlta ? mediaAtualMes*(1+alta) : mediaAcertoHist*fatorSazonal;
    var prevProj = Math.round(revProj*ratioPB), realProj = Math.round(prevProj*ratioRPUsado), fatProj = realProj*mediaProj;
    porMes.push({mes:i, valor:fatProj, tipo:"projetado", revendedoras:Math.round(revProj), previstos:prevProj, realizados:realProj, mediaAcerto:mediaProj, alta:usaAlta ? alta : null, sazonal:!usaAlta && fatorSazonal!==1?fatorSazonal:null});
  }
  return {porMes:porMes, ratioPB:ratioPB, ratioRP:ratioRP, ratioRPUsado:ratioRPUsado, mediaAcertoHist:mediaAcertoHist, mediaAtualMes:mediaAtualMes, fechados:fechados, revHoje:revHoje, mesAtual:mesAtual};
}
// Novembro e dezembro do ano corrente: a média por acerto é a média ATUAL do mês + 5% e + 15% (pedido do Marcus, 09/10/2026).
var ALTA_MEDIA = {10:0.05, 11:0.15};
// regra do mês i: o que o Marcus definiu no Configurador (s.altaMedia, null = sem regra) ou o padrão acima
function altaDe(s, i){ var a = s.altaMedia; if(a && Object.prototype.hasOwnProperty.call(a, i)) return a[i]===null ? undefined : a[i]; return ALTA_MEDIA[i]; }
function mediaMesAtual(s, anoStr, mes){
  var pref = anoStr+"-"+String(mes+1).padStart(2,"0"), ks = Object.keys(s.faturamentoDiario||{}).sort().filter(function(k){ return k.slice(0,7)===pref; });
  var u = ks.length ? s.faturamentoDiario[ks[ks.length-1]] : null;
  return u && u.acertos>0 ? u.recebido/u.acertos : 0;
}
// Igual ao projetarAno, mas encadeia vários anos seguidos (usado na tabela "Ano inteiro, mês a mês", que agora também
// mostra o ano seguinte). Os meses fechados/realizados só existem no ano corrente (onde há dados reais); dali em diante
// é tudo projeção. anoInicial+totalMeses definem o intervalo (ex.: anoInicial=2026, totalMeses=24 → 2026 e 2027 inteiros).
function projetarVariosAnos(s, anoInicial, totalMeses, janelaIdx, metaPct){
  var hoje = new Date(), anoAtual = hoje.getFullYear(), mesAtual = hoje.getMonth(), anoAtualStr = String(anoAtual);
  var fechados = mesesFechados(s, anoAtualStr, mesAtual);
  var somaBase=0, somaPrevistos=0, somaRealizados=0, somaRecebido=0;
  fechados.forEach(function(m){ somaBase+=m.base; somaPrevistos+=m.previstos; somaRealizados+=m.realizados; somaRecebido+=m.recebido; });
  var ratioPB = somaBase>0 ? somaPrevistos/somaBase : 0;
  var ratioRP = somaPrevistos>0 ? somaRealizados/somaPrevistos : 0;
  var ratioRPUsado = metaPct ? metaPct/100 : ratioRP;
  var mediaAcertoHist = somaRealizados>0 ? somaRecebido/somaRealizados : 0;
  var entradas = Object.keys(s.faturamentoDiario||{}).sort();
  var revDatas = Object.keys(s.revendedorasDiario||{}).sort();
  var revHoje = revDatas.length ? s.revendedorasDiario[revDatas[revDatas.length-1]] : 0;
  var mFechado = {}; fechados.forEach(function(m){ mFechado[m.mes]=m; });
  var porMes = [], mediaAtualMes = mediaMesAtual(s, anoAtualStr, mesAtual);
  for(var k=0;k<totalMeses;k++){
    var anoI = anoInicial + Math.floor(k/12), i = k%12;
    if(anoI===anoAtual && mFechado[i]){ porMes.push({ano:anoI, mes:i, valor:mFechado[i].recebido, tipo:"real", revendedoras:mFechado[i].base, realizados:mFechado[i].realizados}); continue; }
    if(anoI===anoAtual && i===mesAtual){
      var doMesAtual = entradas.filter(function(k2){ return k2.slice(0,7)===anoAtualStr+"-"+String(i+1).padStart(2,"0"); });
      var ult = doMesAtual.length ? s.faturamentoDiario[doMesAtual[doMesAtual.length-1]] : null;
      porMes.push({ano:anoI, mes:i, valor: ult?ult.recebido:0, tipo:"atual", revendedoras:revHoje, realizados: ult?ult.acertos:0}); continue;
    }
    if(anoI===anoAtual && i<mesAtual){ porMes.push({ano:anoI, mes:i, valor:0, tipo:"real", revendedoras:0, realizados:0}); continue; }
    var dia1 = new Date(anoI, i, 1), dias = Math.round((dia1-hoje)/86400000);
    var revProj = revHoje + taxaCrescimento(s, janelaIdx)*dias;
    var fatorSazonal = FATOR_SAZONAL[i] || 1;
    var alta = anoI===anoAtual ? altaDe(s, i) : undefined, usaAlta = alta!==undefined && mediaAtualMes>0;
    var prevProj = Math.round(revProj*ratioPB), realProj = Math.round(prevProj*ratioRPUsado), fatProj = realProj*(usaAlta ? mediaAtualMes*(1+alta) : mediaAcertoHist*fatorSazonal);
    porMes.push({ano:anoI, mes:i, valor:fatProj, tipo:"projetado", revendedoras:Math.round(revProj), previstos:prevProj, realizados:realProj, sazonal:!usaAlta && fatorSazonal!==1?fatorSazonal:null});
  }
  return {porMes:porMes, ratioPB:ratioPB, ratioRP:ratioRP, ratioRPUsado:ratioRPUsado, mediaAcertoHist:mediaAcertoHist, fechados:fechados, revHoje:revHoje, mesAtual:mesAtual};
}
// janelas de visualização do gráfico de revendedoras: quantos dias reais mostrar, além da projeção (dia 1 de cada mês futuro)
var JANELAS_GRAFICO_REV = [{lb:"7 dias", ultimosDias:7},{lb:"15 dias", ultimosDias:15},{lb:"30 dias", ultimosDias:30},
  {lb:"60 dias", ultimosDias:60},{lb:"90 dias", ultimosDias:90},{lb:"Mês atual", mesAtual:true},{lb:"História completa", tudo:true}];
// início do ano várias revendedoras saem (fim de contrato, balanço); em fevereiro o crescimento normal já volta a valer —
// por enquanto um número fixo, o usuário vai confirmar com dados reais de janeiros anteriores
var QUEDA_JANEIRO = 100;
// Crescimento médio POR DIA, calculado dos lançamentos reais (nada de número fixo): variação líquida na janela ÷ dias da janela.
// Dias sem lançamento (fim de semana) entram como "sem aumento". Sem histórico suficiente, cai nos valores antigos de CRESCIMENTO_REVENDEDORAS.
function crescimentoPorDia(s, dias){
  var hist = completarDias(s.revendedorasDiario || {}), ks = Object.keys(hist).sort();
  if(ks.length<2 || !(dias>1)) return null;   // dias = quantos pontos o filtro mostra (7 dias = 7 pontos, 6 intervalos)
  var ult = ks.length-1, ini = Math.max(0, ult-(dias-1));
  return (hist[ks[ult]]-hist[ks[ini]])/(ult-ini);
}
var DIAS_JANELA = [7,15,30,60,90];
function taxaCrescimento(s, idx){
  var t = null;
  if(idx<DIAS_JANELA.length) t = crescimentoPorDia(s, DIAS_JANELA[idx]);
  else { var h = new Date(), ano = h.getFullYear(), m = h.getMonth()-1; if(m<0){ m = 11; ano--; }   // "Último mês": o mês fechado anterior
    var r = resumoMensalRevendedoras(s, ano)[m]; t = r && r.delta!==null ? r.delta/new Date(ano, m+1, 0).getDate() : null; }
  return t===null || t===undefined ? CRESCIMENTO_REVENDEDORAS[idx].dia : t;
}
// um lançamento por dia útil; sábado, domingo e qualquer dia sem lançamento ficam no último valor (até hoje)
function isoLocal(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function completarDias(hist){
  var ks = Object.keys(hist).sort(); if(!ks.length) return hist;
  var ate = isoLocal(new Date()); if(ks[ks.length-1]>ate) ate = ks[ks.length-1];
  var d = new Date(ks[0]+"T12:00:00"), out = {}, ultimo = hist[ks[0]], iso;
  for(iso = isoLocal(d); iso<=ate; d.setDate(d.getDate()+1), iso = isoLocal(d)){ if(hist[iso]!==undefined) ultimo = hist[iso]; out[iso] = ultimo; }
  return out;
}
// Visão geral: quantas revendedoras começaram e terminaram cada mês do ano (o mês atual vai até hoje, em tempo real)
function resumoMensalRevendedoras(s, ano){
  var hist = completarDias(s.revendedorasDiario || {}), ks = Object.keys(hist).sort(), hojeIso = isoLocal(new Date()), out = [];
  var valorAte = function(iso){ var v = null; for(var i=0;i<ks.length;i++){ if(ks[i]<=iso) v = hist[ks[i]]; else break; } return v; };
  for(var m=0;m<12;m++){
    var ym = ano+"-"+String(m+1).padStart(2,"0"), primeiro = ym+"-01", ultimo = ym+"-"+String(new Date(ano, m+1, 0).getDate()).padStart(2,"0");
    var futuro = primeiro>hojeIso, atual = hojeIso.slice(0,7)===ym;
    var ini = valorAte(primeiro); if(ini===null){ var k1 = ks.find(function(k){ return k.slice(0,7)===ym; }); ini = k1 ? hist[k1] : null; }
    var fim = futuro ? null : valorAte(atual ? hojeIso : ultimo);
    var delta = ini!==null && fim!==null ? fim-ini : null;
    out.push({mes:m, ini:ini, fim:fim, delta:delta, pct:ini ? delta/ini*100 : null, atual:atual, futuro:futuro});
  }
  return out;
}
// monta os pontos (dia a dia) da quantidade de revendedoras, pra usar no gráfico. opts.ultimosDias/mesAtual/tudo escolhem a janela
// de dias reais mostrados (padrão: tudo); opts.desde filtra por data (usado na Visão Geral, só o ano atual); opts.projetarMeses
// acrescenta um ponto por mês futuro (dia 1), usando a janela de crescimento escolhida (opts.janela); pode passar do fim do
// ano — em janeiro (de qualquer ano) entra a queda sazonal, e o crescimento normal volta a partir de fevereiro.
function pontosRevendedoras(s, opts){
  opts = opts || {};
  var hist = completarDias(s.revendedorasDiario || {});
  var todasDatas = Object.keys(hist).sort();
  var datas = todasDatas;
  if(opts.ultimosDias) datas = todasDatas.slice(-opts.ultimosDias);
  else if(opts.mesAtual){ var hoje0 = new Date(), ym = hoje0.getFullYear()+"-"+String(hoje0.getMonth()+1).padStart(2,"0");
    datas = todasDatas.filter(function(dt){ return dt.slice(0,7)===ym; }); }
  else if(opts.desde) datas = todasDatas.filter(function(dt){ return dt>=opts.desde; });
  var pts = datas.map(function(dt){ return {data:dt, v:hist[dt], tipo:"real"}; });
  if(opts.projetarMeses && todasDatas.length){
    var ultimaData = todasDatas[todasDatas.length-1], ultimoValor = hist[ultimaData], hoje = new Date(ultimaData+"T00:00:00");
    // média diária conforme o filtro escolhido (7/15/30/60/90 dias, mês atual ou história completa)
    var diasFiltro = opts.ultimosDias || (opts.mesAtual ? (new Date().getDate()>1 ? new Date().getDate() : 30) : opts.tudo ? todasDatas.length : 30);
    var taxaPontos = crescimentoPorDia(s, diasFiltro);
    if(taxaPontos===null) taxaPontos = CRESCIMENTO_REVENDEDORAS[opts.janela||2].dia;
    for(var mf=1; mf<=opts.projetarMeses; mf++){
      var alvo = new Date(hoje.getFullYear(), hoje.getMonth()+mf, 1);
      var dias = Math.round((alvo-hoje)/86400000);
      var v = Math.round(ultimoValor+taxaPontos*dias);
      if(alvo.getMonth()===0) v -= QUEDA_JANEIRO;
      pts.push({data:alvo.toISOString().slice(0,10), v:v, tipo:"projetado"});
    }
  }
  return pts;
}

export { metaDoMes, completarDias, isoLocal, altaDe, ALTA_MEDIA, faturadoPorDia, VERSAO_CPD, totalDiaCP, contasDoMes, fatEfetivo, MESES_LONGO, CONTAS_PAGAR_DEMO, FATURAMENTO_DIARIO_DEMO, META_MENSAL_DEMO, VENDIDO_PONTA_DEMO, CNPJS_CONTAS_PAGAS, CONTAS_PAGAS_DIARIO_DEMO, isoOntem, CRESCIMENTO_REVENDEDORAS, mesesFechados, FATOR_SAZONAL, projetarAno, projetarVariosAnos, JANELAS_GRAFICO_REV, QUEDA_JANEIRO, pontosRevendedoras, resumoMensalRevendedoras, taxaCrescimento, crescimentoPorDia };
