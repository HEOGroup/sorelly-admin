// Sorelly Admin · montagem e bipagem — domain/status.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { badge } from "@/apps/montagem/ui/badge";

var STATUS_LB = {semvalor:"Aguardando valor", pendente:"Na fila", montando:"Montando", supervisao:"Para conferir",
  ajuste:"Voltou para ajuste", montado:"Aguardando bipagem", bipando:"Bipando", bipado:"Bipado", retirado:"Retirado", condicional:"Pegar condicionais",
  precond:"Conferir condicional"};
var TIPO_KIT = {kit_novo:["Kit novo","Kit novo","info"], acerto_kit:["Acerto + kit","Acerto + kit","muted"],
  kit_novo_exp:["Kit novo + expositor","Kit novo + expositor","purple"], acerto_kit_exp:["Acerto + expositor","Acerto + expositor","primary"],
  reposicao:["Reposição (sem valor de venda)","Reposição","success"],
  condicional:["Só condicional (sem kit)","Só condicional","warning"], saiu:["Saída da revendedora: só retirar a condicional","Saída da revendedora","destructive"]};
var SEM_KIT = {condicional:true, saiu:true};
var SITUACOES = [
  {id:"fila", lb:"Na fila", st:["semvalor","pendente","ajuste","condicional"], tom:"muted"},
  {id:"montando", lb:"Montando", st:["montando","supervisao"], tom:"purple"},
  {id:"aguardando", lb:"Aguardando bipagem", st:["montado","bipando"], tom:"info"},
  {id:"bipado", lb:"Bipado", st:["bipado"], tom:"success"},
  {id:"retirado", lb:"Retirado", st:["retirado"], tom:"muted"}];
var STATUS_TP = {semvalor:"warning", pendente:"muted", montando:"purple", supervisao:"warning", ajuste:"destructive",
  montado:"info", bipando:"primary", bipado:"success", retirado:"muted", condicional:"warning", precond:"warning"};
function StatusBadge(p){ var k=p.k; return badge(k.pausadoEm?"Pausado":STATUS_LB[k.status], k.pausadoEm?"warning":STATUS_TP[k.status]); }

export { STATUS_LB, TIPO_KIT, SEM_KIT, SITUACOES, STATUS_TP, StatusBadge };
