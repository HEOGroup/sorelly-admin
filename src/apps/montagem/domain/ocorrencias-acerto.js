// Sorelly Admin — domain/ocorrencias-acerto.js
// OCORRÊNCIAS DO ACERTO (Marcus, 28/11/2026): a representante INFORMA o que aconteceu (data original, remarcações, quem causou, motivo, prova).
// O SISTEMA define a penalidade (domain/consignado.js: REMARCACAO e atrasoAcerto). Nenhum percentual é digitado em tela.
// Toda mudança de dado já conferido fica no histórico do kit (preAcerto.edicoes): antes, depois, justificativa, quem, quando e origem (automática ou manual).
import { feriadosDe } from "@/apps/montagem/domain/feriados";

// Quem causou a ocorrência. Só a causada pela REVENDEDORA pesa multa. "prova" = só vale com comprovação apresentada.
var RESPONSAVEIS = [
  {id:"revendedora", nome:"Revendedora", pesa:true},
  {id:"representante", nome:"Representante", pesa:false},
  {id:"sorelly", nome:"Sorelly", pesa:false},
  {id:"motivo_serio", nome:"Motivo sério com prova", pesa:false, prova:true}
];
function responsavelDe(id){ return RESPONSAVEIS.find(function(x){ return x.id===id; }) || null; }
// ocorrência antiga (sem responsável) segue a marca "isenta" que já tinha
function ocorrenciaPesa(o){ var r = responsavelDe(o && o.responsavel); return r ? r.pesa : !(o && o.isenta); }

var pad = function(n){ return String(n).padStart(2, "0"); };
function somaDia(iso, n){ var d = new Date(iso+"T12:00:00"); d.setDate(d.getDate()+n); return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
function ehData(iso){ return /^\d{4}-\d{2}-\d{2}$/.test(String(iso||"")) && !isNaN(new Date(iso+"T12:00:00").getTime()); }
// Dia útil = segunda a sexta, sem feriado de Curitiba (nacionais, do Paraná e da cidade: domain/feriados.js). extras = feriados a mais do RH, no formato {"AAAA-MM-DD": nome}.
function ehDiaUtil(iso, extras){ var w = new Date(iso+"T12:00:00").getDay(); return w!==0 && w!==6 && !feriadosDe(iso.slice(0, 4))[iso] && !(extras && extras[iso]); }
// Dias úteis DEPOIS da data original do acerto, até a data em que o acerto acontece (inclusive). No dia marcado ou antes = 0. Data inválida = 0.
// A contagem parte sempre da PRIMEIRA data marcada: remarcar não recomeça o relógio.
function diasUteisDeAtraso(dataOriginal, dataAcerto, extras){
  if(!ehData(dataOriginal) || !ehData(dataAcerto) || dataAcerto<=dataOriginal) return 0;
  var n = 0, d = dataOriginal, guarda = 0;
  while(d<dataAcerto && guarda++<800){ d = somaDia(d, 1); if(ehDiaUtil(d, extras)) n++; }
  return n;
}
// pré-acerto conferido: pela representante (manual, "conferido") ou pela confirmação do cálculo automático ("confirmada")
function preAcertoConferido(kit){ var p = kit && kit.preAcerto; return !!(p && (p.conferido || p.confirmada)); }

export { RESPONSAVEIS, responsavelDe, ocorrenciaPesa, ehDiaUtil, diasUteisDeAtraso, preAcertoConferido };
