import { revInternasReais } from "@/apps/montagem/domain/revendedoras-reais";
// Sorelly Admin — domain/revendedoras-internas.js
// Kits → Atendimento interno → Revendedoras internas. Controle das revendedoras que acertam na própria Sorelly:
// ciclo de acerto (30/45/60 dias), próxima data, agendamento (feito pela agendadora) e mensagens prontas.
// A data do próximo acerto = último acerto + ciclo, a não ser que alguém digite uma data à mão (proximoManual).

var CICLOS = [30, 45, 60];
var SITUACOES = [
  {k:"contatar", t:"A contatar", cor:"bg-muted/60 text-foreground ring-border"},
  {k:"contato", t:"Entrei em contato", cor:"bg-info/15 text-info ring-info/40"},
  {k:"agendada", t:"Agendada", cor:"bg-primary/20 text-primary ring-primary/40"},
  {k:"confirmada", t:"Confirmada na véspera", cor:"bg-success/15 text-success ring-success/40"},
  {k:"lembrete", t:"Lembrete enviado", cor:"bg-success/25 text-success ring-success/50"}
];
var DIAS_ALERTA = 5;   // até 5 dias do vencimento sem contato = linha em alerta

function parteData(iso){ var p = iso.split("-"); return new Date(+p[0], +p[1]-1, +p[2]); }
function isoDe(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function somaDias(iso, n){ var d = parteData(iso); d.setDate(d.getDate()+n); return isoDe(d); }
function diasEntre(deIso, ateIso){ return Math.round((parteData(ateIso).getTime() - parteData(deIso).getTime())/86400000); }
function fmtDataBR(iso){ return iso ? iso.split("-").reverse().join("/") : ""; }

// sem histórico (revendedora nova): vale a data da agenda; ao acertar, o sistema passa a calcular último + ciclo
function proximoAcerto(r){ if(r.proximoManual) return r.proximoManual; var h = r.hist && r.hist[0]; if(h && h.data) return somaDias(h.data, r.ciclo); return r.agend ? r.agend.data : isoDe(new Date()); }
function emAlerta(r, hojeIso){ return r.situacao==="contatar" && diasEntre(hojeIso, proximoAcerto(r)) <= DIAS_ALERTA; }
function primeiroNome(nome){ var p = (nome||"").trim().split(/\s+/)[0] || ""; return p.charAt(0).toUpperCase()+p.slice(1).toLowerCase(); }

// Textos prontos (a agendadora só copia e cola no WhatsApp)
function mensagens(r, hojeIso){
  var nome = primeiroNome(r.nome), venc = fmtDataBR(proximoAcerto(r));
  var ag = r.agend || {}, dataAg = fmtDataBR(ag.data), hora = ag.hora || "";
  return [
    {k:"contato", t:"1º contato (até 5 dias antes)", x:"Olá, "+nome+"! Tudo bem? Aqui é da Sorelly Joias. O seu acerto vence em "+venc+". Vamos agendar o seu atendimento? Me diga qual dia e horário ficam melhores para você."},
    {k:"vespera", t:"Confirmação na véspera", x:"Olá, "+nome+"! Passando para confirmar o seu acerto amanhã"+(dataAg ? ", "+dataAg : "")+(hora ? ", às "+hora : "")+", aqui na Sorelly Joias. Posso confirmar o seu horário?"},
    {k:"dia", t:"Lembrete do dia", x:"Bom dia, "+nome+"! Lembrete: o seu acerto é hoje"+(hora ? ", às "+hora : "")+", aqui na Sorelly Joias. Te esperamos!"}
  ];
}

// Revendedoras internas: agora com dados REAIS (planilha de 14/10/2026), carregados de revendedoras-reais.js; sem o arquivo local a lista fica vazia.
function revInternasDemo(){ return revInternasReais(); }

// Regra do kit novo pela média (14/10/2026): média dos últimos 5 meses (a venda de agora + os 4 meses anteriores; vendas do mesmo mês somam),
// mínimo de R$ 500 de média, e duas vendas seguidas abaixo de R$ 500 já bloqueiam mesmo com média alta. Números vêm do Configurador (cfg.mediaMeses / cfg.mediaMinima).
// Histórico de demonstração (5 meses) para a revendedora que ainda não tem vendas lançadas: valores estáveis a partir do nome. Quando a DevMaster/app informar, vale o real.
function histDemoDe(nome){
  var h = 0; String(nome||"").split("").forEach(function(ch){ h = (h*31 + ch.charCodeAt(0)) % 100003; });
  var base = 1800 + (h%2400), out = [], d = new Date();
  for(var i=1;i<=5;i++){ var m = new Date(d.getFullYear(), d.getMonth()-i, 15); out.push({data:m.toISOString().slice(0,10), venda:Math.round((base*(0.8+((h>>i)%9)/20))/10)*10, demo:true}); }
  return out;
}
function avaliarKit(hist, vendaAtual, cfg, mesAtual){
  cfg = cfg || {}; var nMeses = cfg.mediaMeses || 5, minimo = cfg.mediaMinima || 500;
  var porMes = {}; (hist||[]).forEach(function(h){ if(h && h.data && h.venda>0 && h.data.slice(0,7)!==mesAtual) porMes[h.data.slice(0,7)] = (porMes[h.data.slice(0,7)]||0)+h.venda; });
  var meses = Object.keys(porMes).sort().reverse();                       // do mais recente para o mais antigo
  var lista = (vendaAtual>0 ? [{mes:mesAtual, venda:vendaAtual, atual:true}] : []).concat(meses.map(function(m){ return {mes:m, venda:porMes[m]}; })).slice(0, nMeses);
  var media = lista.length ? lista.reduce(function(t,x){ return t+x.venda; }, 0)/lista.length : null;
  var duasSeguidas = lista.length>=2 && lista[0].venda<minimo && lista[1].venda<minimo;
  var motivo = media===null ? "Sem vendas para calcular" : duasSeguidas ? "Duas vendas seguidas abaixo de "+minimo+": não libera, mesmo com média alta" : media<minimo ? "Média abaixo de "+minimo+": não libera" : null;
  return {lista:lista, media:media, liberado:media!==null && !motivo, motivo:motivo, minimo:minimo, nMeses:nMeses};
}

// Item da agenda da Atendimento Sorelly criado a partir de uma agendada (a condicional vem da DevMaster; aqui é inventada para testar a calculadora)
function internoDeAgendada(r, versaoId, agora, extra){
  var n = r.id.replace("RI","");
  var venda = (r.hist[1] && r.hist[1].venda) || (r.hist[0] && r.hist[0].venda) || 1500;
  return Object.assign({id:"I"+agora+n, nome:r.nome, fone:(r.contatos[0]||{}).fone||"", devmaster:"", data:r.agend.data, hora:r.agend.hora,
    condicionais:[{numero:String(90000+Number(n)*173), valor:Math.round(venda*1.35/10)*10, pecas:30+Number(n)*3}], obs:"Agendada em Revendedoras internas", remarcacoesLista:[],
    status:"agendado", regrasVersaoId:versaoId||null, criadoPor:"Agendamento", criadoEm:agora, vendaApp:0, vendaFonte:"app_revendedora",
    vendasAnt:[r.hist[1] && r.hist[1].venda, r.hist[2] && r.hist[2].venda].filter(function(v){ return v>0; }), revIntId:r.id}, extra||{});
}
// 4 atendimentos já marcados para hoje (pedido do Marcus: poder testar a Atendimento Sorelly e a calculadora)
var HOJE_DEMO = [["KETLYN","09:30"],["BRUNA","11:00"],["KATIA","13:30"],["MARIA LUYSA","15:00"]];
function agendaHojeDemo(lista, hojeIso, versaoId, agora){
  var itens = [];
  HOJE_DEMO.forEach(function(h, i){
    var r = lista.find(function(x){ return x.nome.indexOf(h[0])===0; }); if(!r) return;
    r.agend = {data:hojeIso, hora:h[1]}; r.situacao = "agendada";
    var it = internoDeAgendada(r, versaoId, agora+i, {demoHoje:true}); r.internoId = it.id; itens.push(it);
  });
  return itens;
}

export { histDemoDe, avaliarKit,  internoDeAgendada, agendaHojeDemo, CICLOS, SITUACOES, DIAS_ALERTA, parteData, isoDe, somaDias, diasEntre, fmtDataBR, proximoAcerto, emAlerta, primeiroNome, mensagens, revInternasDemo };
