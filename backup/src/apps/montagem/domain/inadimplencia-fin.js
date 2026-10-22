// Sorelly Admin — domain/inadimplencia-fin.js
// Financeiro → Inadimplência: quanto virou inadimplência em cada mês e quanto já foi recuperado (pago), mais as COMPRAS INTERNAS (peças que os
// funcionários compram da empresa: nunca pagam à vista, então vendido e pago ficam separados). Valores passados pelo Marcus em 09/10/2026:
// janeiro a setembro do relatório da inadimplência e outubro (01/10 a 09/10) do resumo do dia. A tela é editável; depois liga nos lançamentos reais.
var INAD_FIN0 = {"2026":{
  0:{divida:64779.07, pago:20053.77}, 1:{divida:41858.67, pago:22255.00}, 2:{divida:32584.32, pago:20629.24}, 3:{divida:31706.41, pago:17163.93},
  4:{divida:32040.81, pago:22574.47}, 5:{divida:49513.04, pago:21928.77}, 6:{divida:34830.00, pago:21012.01}, 7:{divida:36494.20, pago:18972.77},
  8:{divida:46693.31, pago:17321.84}, 9:{divida:7218.55, pago:6354.21}}};
var COMPRAS_INT0 = {"2026":{9:{vendido:4713.70, pago:4482.30}}};

function inadDoMes(s, ano, mes){ return Object.assign({divida:0, pago:0}, ((s.inadFin||{})[String(ano)]||{})[mes]); }
function comprasDoMes(s, ano, mes){ return Object.assign({vendido:0, pago:0}, ((s.comprasInt||{})[String(ano)]||{})[mes]); }

export { INAD_FIN0, COMPRAS_INT0, inadDoMes, comprasDoMes };
