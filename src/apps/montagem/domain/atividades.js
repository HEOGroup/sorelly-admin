// Sorelly Admin · montagem — domain/atividades.js
// ATIVIDADES DO SETOR (pedido do Marcus, 02/11/2026): tudo o que o Agendamento precisa CONFERIR vira uma atividade com dono, prazo de 1 dia útil e resposta obrigatória.
// Ela fica aberta até alguém concluir com a resposta escrita; não some no WhatsApp. O Admin cria sozinho, a cada leitura da DevMaster, e nunca repete a mesma.
// Regras que geram atividade (só leitura da DevMaster, tela Revendedoras):
//  · "atrasada": a data do acerto já passou e o kit continua aberto. Chave = revendedora + data do acerto.
//  · "nota": a anotação do campo Obs. gerais cita uma data que já passou (ex.: "Rep solicitou o kit para 27/10"), mas o acerto na DevMaster está a menos de 25 dias dessa data. Chave = revendedora + data citada.
// Quando a situação some da DevMaster, a atividade aberta sai da lista (não vira "concluída": concluída é só o que uma pessoa respondeu). Atrasada concluída que continua atrasada (mesma data) reabre depois de 1 dia.
// Guarda em módulo "agrev" (chaves "at_..." uma por atividade e "atdono" = quem cuida de cada representante): mesma permissão do Agendamento, sem módulo novo.
import { diaEfetivo } from "@/apps/montagem/domain/feriados";
var dia = function(iso){ return new Date(String(iso).slice(0, 10)+"T00:00:00"); };
var iso = function(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2, "0")+"-"+String(d.getDate()).padStart(2, "0"); };
function diasEntre(a, b){ return Math.round((dia(b)-dia(a))/86400000); }
// próximo dia útil depois da data (sábado e domingo pulam para segunda)
function diaUtilSeguinte(isoData){ var d = dia(isoData); do { d.setDate(d.getDate()+1); } while(d.getDay()===0 || d.getDay()===6); return iso(d); }

// data que a anotação cita ("27/10", "dia 20"): a mais distante das citadas; sem ano = ano da anotação; data menor que a da anotação = mês/ano seguinte
function citaData(c){
  if(!c || !c.txt || !c.iso) return null;
  var base = dia(c.iso), ds = [], m;
  var re1 = /\b(\d{1,2})\/(\d{1,2})\b/g; while((m = re1.exec(c.txt))){ var d1 = new Date(base.getFullYear(), Number(m[2])-1, Number(m[1])); if(d1<base) d1.setFullYear(d1.getFullYear()+1); ds.push(d1); }
  var re2 = /\bdia\s+(\d{1,2})\b(?!\/)/gi; while((m = re2.exec(c.txt))){ var d2 = new Date(base.getFullYear(), base.getMonth(), Number(m[1])); if(d2<base) d2 = new Date(base.getFullYear(), base.getMonth()+1, Number(m[1])); ds.push(d2); }
  return ds.length ? iso(new Date(Math.max.apply(null, ds.map(function(x){ return x.getTime(); })))) : null;
}
var textoCaso = function(c){ return c ? c.iso.slice(8, 10)+"/"+c.iso.slice(5, 7)+(c.quem ? " "+c.quem : "")+": "+c.txt : "Sem anotação na DevMaster."; };

// o que a DevMaster pede hoje: {id: {tipo, cod, nome, rep, repCod, titulo, detalhe}}
function pedidosDe(itens, hoje){
  var out = {};
  itens.forEach(function(i){
    var base = {cod:i.cod, nome:i.nome, rep:i.representante, repCod:i.repCod || "", detalhe:textoCaso(i.caso), prev:i.prev};
    // atrasada só depois do DIA EFETIVO: acerto de domingo ou feriado vale no próximo dia útil (ex.: 01/11 domingo e 02/11 Finados valem 03/11)
    if(i.prev && diaEfetivo(i.prev)<hoje){ out["at_atr_"+i.cod+"_"+i.prev] = Object.assign({id:"at_atr_"+i.cod+"_"+i.prev, tipo:"atrasada", titulo:"Acerto atrasado"}, base); return; }
    // ciclo longo (03/11/2026): data do acerto a mais de 90 dias da emissão do kit; alguém precisa explicar quem mudou a data e por quê
    if(i.emissao && i.prev && diasEntre(i.emissao, i.prev)>90) out["at_ciclo_"+i.cod+"_"+i.prev] = Object.assign({id:"at_ciclo_"+i.cod+"_"+i.prev, tipo:"ciclo", titulo:"Explicar a data do acerto (ciclo de "+diasEntre(i.emissao, i.prev)+" dias)"}, base);
    var cita = citaData(i.caso);
    if(cita && diasEntre(cita, hoje)>=2 && i.prev && diasEntre(cita, i.prev)<25){ out["at_nota_"+i.cod+"_"+cita] = Object.assign({id:"at_nota_"+i.cod+"_"+cita, tipo:"nota", titulo:"Nota diz que o kit já saiu (data citada: "+cita.slice(8, 10)+"/"+cita.slice(5, 7)+")", cita:cita}, base); }
  });
  return out;
}

// compara os pedidos de hoje com as atividades já guardadas e devolve só o que mudou (chaves prontas para gravar)
function atualizar(itens, atuais, hoje){
  var pedidos = pedidosDe(itens, hoje), mudou = {};
  Object.keys(pedidos).forEach(function(id){
    var a = atuais[id], p = pedidos[id];
    if(a && a.status==="concluida" && a.por==="Sistema") a = null;   // o setor nunca mexeu nela: volta a ser nova
    if(!a){ mudou[id] = Object.assign({}, p, {criadaEm:hoje, prazo:diaUtilSeguinte(hoje), status:"aberta", reaberturas:0}); return; }
    if(a.status==="concluida" && a.tipo==="atrasada" && a.concluidaEm && diasEntre(a.concluidaEm.slice(0, 10), hoje)>=1 && a.por!=="Sistema"){
      mudou[id] = Object.assign({}, a, {status:"aberta", prazo:diaUtilSeguinte(hoje), reaberturas:(a.reaberturas||0)+1, reabertaEm:hoje, detalhe:p.detalhe}); return; }
    if(a.status==="aberta" && a.detalhe!==p.detalhe) mudou[id] = Object.assign({}, a, {detalhe:p.detalhe});   // o caso escrito mudou: atualiza o texto
  });
  Object.keys(atuais).forEach(function(id){
    var a = atuais[id]; if(!a || pedidos[id]) return;
    // Concluída só vale se uma PESSOA concluiu (Marcus, 03/11/2026). Situação que some da DevMaster (e as antigas fechadas pelo sistema) saem da lista: valor null apaga.
    if(a.status==="aberta" || (a.status==="concluida" && a.por==="Sistema")) mudou[id] = null;
  });
  return mudou;
}

var RESULTADOS = [["acerto_marcado", "Acerto marcado (informe a data)"], ["acerto_feito", "Acerto já foi feito"], ["sem_previsao", "Sem previsão (informe o motivo)"], ["nota_velha", "Nota estava velha, a data da DevMaster está certa"]];
var rotuloResultado = function(k){ var r = RESULTADOS.find(function(x){ return x[0]===k; }); return r ? r[1] : k==="resolvido" ? "Resolvido na DevMaster" : ""; };

// quem cuida de cada representante: dono = {repCod: "Tamara"} (escolha manual); sem dono = o setor inteiro
var donoDe = function(dono, repCod){ return (dono && dono[repCod]) || ""; };
// QUEM CUIDA (Marcus, 02/11/2026): o nome que está escrito no caso ("30/10 Tamara: ...") é de quem cuida daquela revendedora. Só valem as pessoas do setor; "Ana" é a Ana Maria.
var PESSOAS_SETOR = ["Ana Maria", "Mariana", "Tamara"];
function pessoaDe(quem){ var p = String(quem || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/)[0]; return p==="ana" ? "Ana Maria" : p==="mariana" ? "Mariana" : p==="tamara" ? "Tamara" : ""; }
var quemDoDetalhe = function(detalhe){ var m = String(detalhe || "").match(/^\d{2}\/\d{2}\s+([^:]+):/); return m ? pessoaDe(m[1]) : ""; };
// quem mais escreve sobre as revendedoras de cada representante: {repCod: "Tamara"}
function donoAutomatico(itens){
  var conta = {}; itens.forEach(function(i){ if(!i.repCod) return; (i.caso ? [i.caso].concat(i.casos || []) : []).forEach(function(c){ var p = pessoaDe(c.quem); if(!p) return; var g = conta[i.repCod] || (conta[i.repCod] = {}); g[p] = (g[p] || 0) + 1; }); });
  var out = {}; Object.keys(conta).forEach(function(k){ var g = conta[k], melhor = Object.keys(g).sort(function(a, b){ return g[b]-g[a]; })[0]; out[k] = melhor; }); return out;
}

export { diaUtilSeguinte, citaData, pedidosDe, atualizar, RESULTADOS, rotuloResultado, donoDe, diasEntre, PESSOAS_SETOR, pessoaDe, quemDoDetalhe, donoAutomatico };
