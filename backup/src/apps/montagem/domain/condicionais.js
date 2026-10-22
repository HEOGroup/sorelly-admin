// Sorelly Admin · montagem e bipagem — domain/condicionais.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.

function condNums(k){ return (k.cond && k.cond.nums) || []; }
function condNovas(k){ var c = k.cond || {}; return c.novas || (c.nova ? [c.nova] : []); }
function condEstado(k, n){ var c = k.cond || {};
  return {m: !!(c.pegas || (c.chkM||{})[n]), b: !!(c.chkB||{})[n], p: !!(c.chkP||{})[n], imp: (c.impressas||{})[n] || null, falta: !!(c.faltas||{})[n] && !(c.impressas||{})[n]}; }
function condOk(k, papel){ return condNums(k).every(function(n){ var st = condEstado(k, n); return papel==="b" ? st.b : st.m; }); }
// Quais condicionais a DevMaster traz pra conferência prévia: saída da revendedora traz todas (inclusive expositor,
// que sempre tem previsão de devolução lá na frente); nos demais casos (acerto + kit, kit novo) só as com previsão
// de devolução em até 90 dias — é assim que o expositor fica de fora sem confundir quem tá conferindo.
function condVisiveisPre(k){
  var nums = condNums(k); if(k.tipoKit==="saiu") return nums;
  var prev = (k.cond||{}).prev || {}, lim = Date.now() + 90*86400000;
  return nums.filter(function(n){ var d = prev[n]; return !d || new Date(d).getTime()<=lim; });
}
// Conferência prévia (antes de liberar para a fila de montagem): true quando não há nenhuma pra conferir, ou todas já foram
function condOkPre(k){ var n = condVisiveisPre(k); return n.length===0 || n.every(function(x){ return condEstado(k, x).p; }); }

export { condNums, condNovas, condEstado, condOk, condVisiveisPre, condOkPre };
