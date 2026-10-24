// Sorelly Admin · montagem — lib/fila-kits-novos.js
// LEITURA da fila dos Kits novos (app kits-novos: Michele e Nickolas) para o Painel do Plano 45/60. Só lê; nunca grava lá.
// Os dois apps guardam o estado no navegador (sem servidor ainda): se o Kits novos nunca foi aberto neste computador, devolve null.
// Chave e formato precisam bater com src/apps/kits-novos/state/store.js (CHAVE, s.dados[].st/.rep) e domain/etapas.js.
var CHAVE_KN = "sorelly_kits_novos_curitiba_v2";
var NA_FILA = ["cadastrada", "liberado", "solicitado"];             // ainda sem representante aceitar
var COM_REP = ["aceito", "contato", "agendado"];                    // com a representante
var NA_EMPRESA = ["montando", "bipado", "retirado"];                // sendo montado ou esperando retirada

function lerFilaKitsNovos(){
  try {
    var j = localStorage.getItem(CHAVE_KN); if(!j) return null;
    var s = JSON.parse(j); if(!s || !s.dados || !s.dados.length) return null;
    var r = {total:0, fila:0, comRep:0, naEmpresa:0, entregues:0, devolvidos:0, semRep:0, agendados:0, porRep:{}};
    s.dados.forEach(function(c){
      if(c.st==="cancelado") return; r.total++;
      if(NA_FILA.indexOf(c.st)>=0){ r.fila++; if(!c.rep) r.semRep++; }
      else if(COM_REP.indexOf(c.st)>=0){ r.comRep++; if(c.st==="agendado") r.agendados++; }
      else if(NA_EMPRESA.indexOf(c.st)>=0) r.naEmpresa++;
      else if(c.st==="entregue") r.entregues++; else if(c.st==="devolvido") r.devolvidos++;
      if(c.rep && c.rep!=="Sorelly" && (COM_REP.indexOf(c.st)>=0 || NA_EMPRESA.indexOf(c.st)>=0)) r.porRep[c.rep] = (r.porRep[c.rep]||0)+1;
    });
    return r;
  } catch(x){ return null; }
}
export { lerFilaKitsNovos };
