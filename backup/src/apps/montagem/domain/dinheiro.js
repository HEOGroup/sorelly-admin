// Sorelly Admin · montagem — domain/dinheiro.js
// Caminho do dinheiro (decisão de 15/10/2026): toda vez que ele troca de mãos, os dois lados confirmam no app, com um CÓDIGO de 4 números.
//   etapa 1: representante (ou a funcionária do atendimento interno) → agendamento. Quem entrega vê o código no app e quem recebe digita.
//   etapa 2: agendamento → financeiro, do mesmo jeito (as duas com o celular na sala do financeiro).
// A lista "Dinheiro" mostra em tempo real onde está cada valor. Um código por dinheiro recebido.
import { hash } from "@/apps/montagem/domain/chat-contatos";
import { isoDia } from "@/apps/montagem/lib/format";

var r2 = function(n){ return Math.round(n*100)/100; };
// código estável de 4 números para cada dinheiro e etapa (em produção o servidor sorteia e guarda)
function codigoDinheiro(id, etapa){ return String(1000 + hash("sorelly|"+id+"|"+etapa)%9000); }

// todos os dinheiros do sistema: acertos das representantes (forma "dinheiro") e acertos do atendimento interno enviados ao financeiro
function itensDinheiro(s){
  var fx = s.dinheiroFluxo || {}, out = [];
  (s.acertosConsignado || []).forEach(function(r){
    if(r.origem==="interno" || r.tipo!=="acerto") return;
    var v = r2((r.pagamentos||[]).filter(function(x){ return x.forma==="dinheiro"; }).reduce(function(t, x){ return t+(x.valor||0); }, 0)); if(!(v>0)) return;
    var din = (r.recebimento||{}).din || {}, f = fx["R"+r.id] || {};
    out.push({id:"R"+r.id, origem:"rep", quem:r.rep, rev:r.rev, data:r.data, valor:v, e1:din.ok ? {por:din.por, ts:din.ts, valor:din.contado!=null ? din.contado : v} : (f.e1||null), e2:f.e2||null});
  });
  (s.lancFin || []).forEach(function(lf){
    var v = r2((lf.linhas||[]).filter(function(l){ return l.forma==="dinheiro" && !l.isento; }).reduce(function(t, l){ return t+(l.valor||0); }, 0)); if(!(v>0)) return;
    var f = fx["I"+lf.id] || {};
    out.push({id:"I"+lf.id, origem:"interno", quem:lf.por || "Atendimento", rev:lf.nome, data:isoDia(new Date(lf.enviadoTs || Date.now())), valor:v, e1:f.e1||null, e2:f.e2||null});
  });
  return out.sort(function(a, b){ return (a.data||"").localeCompare(b.data||""); });
}
// onde o dinheiro está: 0 = com a representante / na bipagem, 1 = com o agendamento, 2 = entregue ao financeiro
function etapaDe(it){ return it.e2 ? 2 : it.e1 ? 1 : 0; }
export { codigoDinheiro, itensDinheiro, etapaDe };
