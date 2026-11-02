// Sorelly Admin · montagem — state/agend-patches.js
// AJUSTES FIXOS DO AGENDAMENTO (Marcus, 01/11/2026). Ficam DENTRO do objeto do Agendamento (ag.patches) e não em flags soltas do estado, porque o módulo "agend" é sincronizado
// com o servidor: quando chega uma cópia mais antiga do servidor (sem os ajustes), eles são aplicados de novo nela (state/reducer.js, ao receber o módulo) e voltam para o servidor.
// Cada ajuste só roda uma vez por versão (ag.patches.<nome>); o que o Marcus mudar depois na tela não é desfeito.
//  · nov     : abertura de novembro/2026 = 2.047 revendedoras e 1.975 acertos previstos (a virada automática tinha estimado 2.106 e 2.057)
//  · metas   : metas do Agendamento a partir de novembro = 96, 97 e 98% sobre o previsto vigente, bônus R$ 200, R$ 300 e R$ 600 por funcionária
//  · viagem  : Thalita - SC (vendedor CU) entra na lista e as representantes de fora de Curitiba já vêm marcadas como viagem (a Ana Maria ajusta)
var VIAGEM = {EE:"Ponta Grossa", EX:"Joinville", CV:"Litoral PR", FG:"Maringá", CU:"Santa Catarina"};
function aplicaAgendPatches(s){
  if(!s.agend || !s.agend.config) return s;
  var ag = JSON.parse(JSON.stringify(s.agend)), pt = ag.patches = ag.patches || {}, mudou = false;
  if(pt.nov!==3){
    ag.mes = ag.mes || {}; var mN = ag.mes["2026-11"];
    if(!mN || !mN.fechadoEm) ag.mes["2026-11"] = Object.assign({pagamento:{prevista:null, confirmada:null, por:null}, abertoEm:new Date().toISOString(), fechadoEm:null}, mN, {base:2047, previstos:1975, estimado:false, aberturaAuto:false});
    pt.nov = 3; mudou = true; }
  if(pt.metas!==2){ ag.config.faixas = [{id:"f96", pct:96, bonus:200}, {id:"f97", pct:97, bonus:300}, {id:"f98", pct:98, bonus:600}]; pt.metas = 2; mudou = true; }
  if(pt.viagem!==2){
    var rs = ag.config.representantes = ag.config.representantes || [];
    if(!rs.some(function(r){ return String(r.codigo)==="CU"; })) rs.push({id:"ar-CU", codigo:"CU", nome:"Thalita - SC", ativo:true, grupo:"Thalita"});
    rs.forEach(function(r){ if(VIAGEM[String(r.codigo)] && !r.viagem) r.viagem = VIAGEM[String(r.codigo)]; });
    pt.viagem = 2; mudou = true; }
  if(pt.fotos!==1){   // fechamentos de setembro e outubro: a foto guardada na virada do mês tinha o faturamento parcial (set 1.778, out 1.652); valem os números do Marcus
    var sS = ag.mes && ag.mes["2026-09"] && ag.mes["2026-09"].snapshot, sO = ag.mes && ag.mes["2026-10"] && ag.mes["2026-10"].snapshot;
    if(sS){ sS.realizado = 1809; }
    if(sO){ sO.realizado = 1843; sO.acertosPrevistos = 1886; sO.previstosBase = 1976; sO.saidasPropositais = 90; sO.revendedorasComKit = 2023; }
    pt.fotos = 1; mudou = true; }
  if(mudou) s.agend = ag;
  return s;
}
export { aplicaAgendPatches };
