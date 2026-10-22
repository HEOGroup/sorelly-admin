// Sorelly Admin · kits novos Curitiba — domain/status.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { badge } from "@/apps/kits-novos/ui/badge";

var STATUS_LB = {semvalor:"Aguardando valor", pendente:"Na fila", montando:"Montando", supervisao:"Para conferir",
  ajuste:"Voltou para ajuste", montado:"Montado", bipando:"Bipando", bipado:"Pronto", retirado:"Retirado"};
var STATUS_TP = {semvalor:"warning", pendente:"muted", montando:"purple", supervisao:"warning", ajuste:"destructive",
  montado:"info", bipando:"primary", bipado:"success", retirado:"muted"};
function StatusBadge(p){ var k=p.k; return badge(k.pausadoEm?"Pausado":STATUS_LB[k.status], k.pausadoEm?"warning":STATUS_TP[k.status]); }

export { STATUS_LB, STATUS_TP, StatusBadge };
