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
// Ordem: data digitada à mão › previsão de devolução do kit na DevMaster (já considera fim de semana e feriado) › último acerto + ciclo.
function proximoAcerto(r){ if(r.proximoManual) return r.proximoManual; if(r.proximoDm) return r.proximoDm; var h = r.hist && r.hist[0]; if(h && h.data) return somaDias(h.data, r.ciclo); return r.agend ? r.agend.data : isoDe(new Date()); }
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
// 28/10/2026 (Marcus): a lista nasce VAZIA. As revendedoras do vendedor Sorelly (02, FE e BY) entram pelo botão "Buscar da DevMaster"; a lista geral vem da aba Revendedoras.
function revInternasDemo(){ return []; }

// Regra do kit novo pela média (14/10/2026): média dos últimos 5 meses (a venda de agora + os 4 meses anteriores; vendas do mesmo mês somam),
// mínimo de R$ 500 de média, e duas vendas seguidas abaixo de R$ 500 já bloqueiam mesmo com média alta. Números vêm do Configurador (cfg.mediaMeses / cfg.mediaMinima).
// Histórico de demonstração (5 meses) para a revendedora que ainda não tem vendas lançadas: valores estáveis a partir do nome. Quando a DevMaster/app informar, vale o real.
function histDemoDe(nome){
  var h = 0; String(nome||"").split("").forEach(function(ch){ h = (h*31 + ch.charCodeAt(0)) % 100003; });
  var base = 1800 + (h%2400), out = [], d = new Date();
  for(var i=1;i<=5;i++){ var m = new Date(d.getFullYear(), d.getMonth()-i, 15); out.push({data:m.toISOString().slice(0,10), venda:Math.round((base*(0.8+((h>>i)%9)/20))/10)*10, demo:true}); }
  return out;
}
// Regra de 27/10/2026 (Marcus): média das 3 últimas vendas = a de agora + as 2 anteriores (ou as 3 mais novas do histórico quando ainda não há venda de agora),
// divide pelas que existem; abaixo de R$ 700 (atendimento Sorelly) o kit novo não libera. Substitui a regra de 5 meses (14/10/2026).
function avaliarKit(hist, vendaAtual, cfg, mesAtual){
  var nVendas = 3, minimo = MEDIA_MINIMA_SORELLY;
  var antes = (hist||[]).filter(function(h){ return h && h.data && h.venda>0 && !(vendaAtual>0 && h.data.slice(0,7)===mesAtual); }).sort(function(a,b){ return b.data.localeCompare(a.data); });   // venda de agora já é deste mês: não conta duas vezes
  var lista = (vendaAtual>0 ? [{mes:mesAtual, venda:vendaAtual, atual:true}] : []).concat(antes.map(function(h){ return {mes:h.data.slice(0,7), venda:h.venda}; })).slice(0, nVendas);
  var media = lista.length ? lista.reduce(function(t,x){ return t+x.venda; }, 0)/lista.length : null;
  var motivo = media===null ? "Sem vendas para calcular" : media<minimo ? "Média abaixo de "+minimo+": não libera" : null;
  return {lista:lista, media:media, liberado:media!==null && !motivo, motivo:motivo, minimo:minimo, nMeses:nVendas};
}

// Média das 3 últimas vendas (regra de 27/10/2026, docs/negocio/MEDIA-DE-VENDAS.md): do histórico, só vendas > 0, divide pelas que existem.
// Valor do próximo kit = faixa da tabela do Configurador (a que estiver em uso) para essa média. Sem média: null.
function mediaTres(hist){
  var v = (hist||[]).filter(function(h){ return h && h.venda>0; }).slice(0,3).map(function(h){ return h.venda; });
  return v.length ? {media:v.reduce(function(t,x){ return t+x; }, 0)/v.length, n:v.length} : null;
}
var MEDIA_MINIMA_SORELLY = 700;   // atendimento Sorelly: média das 3 últimas vendas abaixo de R$ 700 = kit novo não liberado (MEDIA-DE-VENDAS.md)
function kitDaMedia(media, cfg){
  cfg = cfg || {}; if(media==null || media<MEDIA_MINIMA_SORELLY) return null;
  var tab = ((cfg.tabelaAtiva==="baixo" ? cfg.tabelaKitBaixo : cfg.tabelaKit) || []).slice().sort(function(a,b){ return b.min-a.min; });
  var f = tab.find(function(x){ return media>=x.min; }); return f ? f.kit : null;
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

export { MEDIA_MINIMA_SORELLY, mediaTres, kitDaMedia, histDemoDe, avaliarKit, internoDeAgendada, agendaHojeDemo, CICLOS, SITUACOES, DIAS_ALERTA, parteData, isoDe, somaDias, diasEntre, fmtDataBR, proximoAcerto, emAlerta, primeiroNome, mensagens, revInternasDemo };
