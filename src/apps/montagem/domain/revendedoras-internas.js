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

// ── Registro de contatos (Tamara, 28/10/2026) ──
// Hoje a Tamara escreve no campo "Obs. Gerais" de CADA condicional da DevMaster, uma linha por contato: "27/10 TAMARA: ACERTO FICOU AGENDADO PARA DIA 28/11 ÀS 08H".
// Aqui o registro é UM SÓ por revendedora (cadastro da cliente, com todas as condicionais dentro) e ESTRUTURADO: tipo + motivo em caixas, sem escrever.
// Análise de 6.329 anotações de 798 revendedoras: docs/negocio/REGISTRO-DE-CONTATOS-ANALISE.md. As linhas antigas da DevMaster entram como histórico (origem "devmaster")
// já classificadas nas mesmas opções; os registros novos (origem "sistema") são feitos aqui. A mesma frase em várias condicionais da mesma cliente entra uma vez só.
var TIPOS_REG = [
  {k:"contato", t:"Entrei em contato", cor:"k-out"},
  {k:"t1", t:"1ª tentativa de contato para acerto", cor:"k-t"}, {k:"t2", t:"2ª tentativa de contato para acerto", cor:"k-t"}, {k:"t3", t:"3ª tentativa de contato para acerto", cor:"k-t"},
  {k:"sem_retorno", t:"Sem retorno", cor:"k-falt"},
  {k:"marcado", t:"Acerto marcado", cor:"k-ag", pedeData:true},
  {k:"remarcado", t:"Remarcado", cor:"k-des", pedeData:true, pedeMotivo:true, multa:true},
  {k:"nao_veio", t:"Não veio / faltou", cor:"k-falt", pedeMotivo:true, multa:true},
  {k:"desmarcado", t:"Desmarcado", cor:"k-des", pedeMotivo:true, multa:true},
  {k:"quer_vir", t:"Quer vir na empresa (sem data)", cor:"k-out"},
  {k:"rep_kit", t:"Representante pediu o kit", cor:"k-rep"},
  {k:"ciclo", t:"Mudou o ciclo", cor:"k-extra", pedeCiclo:true},
  {k:"troca", t:"Troca pendente", cor:"k-out"},
  {k:"passou", t:"Passou para outra pessoa", cor:"k-out"},
  {k:"regras", t:"Regras novas enviadas", cor:"k-ag"},
  {k:"marca", t:"Marca da cliente (funcionária, Veneziana…)", cor:"k-out"},
  {k:"outro", t:"Outro", cor:"k-out"}
];
var MOTIVOS_REG = ["Saúde","Família ou filho","Viagem","Trabalho","Transporte","Esqueceu ou imprevisto","Sem dinheiro","Clima","Mudança","Outro"];
var AUTORIZADORES = ["Marcus","Lucas","Nickolas","Ana Maria"];
var tipoReg = function(k){ return TIPOS_REG.find(function(x){ return x.k===k; }) || TIPOS_REG[TIPOS_REG.length-1]; };

var RX_LINHA = /^\s*(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+([A-Za-zÀ-ÿ]{2,20})\s*[;:]+\s*(.*)$/;
function dataDaLinha(dia, mes, ano, hojeIso){
  var h = parteData(hojeIso), a = ano ? (ano.length===2 ? 2000+Number(ano) : Number(ano)) : h.getFullYear();
  var d = new Date(a, mes-1, dia);
  if(!ano && d.getTime() > h.getTime()+7*86400000) d = new Date(a-1, mes-1, dia);   // sem ano e no futuro distante = é do ano passado
  return isoDe(d);
}
function semAcento(t){ return String(t||"").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
var MOTIVO_RX = [["Saúde",/DOENT|DOENCA|SAUDE|HOSPITAL|\bUTI\b|TRATAMENTO|CIRURGIA|MEDIC|REMEDIO|INTERNAD|COVID|GRIPE|ATESTADO|GESTANT|GRAVIDA|BEBE|NASCEU|PARTO|ACIDENTE/],["Clima",/CHUV|TEMPO (ESTA )?(FEIO|RUIM)|TEMPORAL|ALAGAD/],
  ["Família ou filho",/FILH[OA]|CRIANCA|FAMILIA|FALEC|LUTO|VELORIO|ENTERRO|MARIDO|ESPOSO|\bMAE\b|\bPAI\b/],["Viagem",/VIAGEM|VIAJ|FORA DA CIDADE|FERIAS|CARNAVAL/],["Trabalho",/TRABALH|SERVICO|PLANTAO|ESCALA|EXPEDIENTE|FOLGA/],
  ["Transporte",/CARRO|ONIBUS|MOTO\b|TRANSPORTE|ESTRAGOU|PNEU|SEM CONDUCAO/],["Sem dinheiro",/SEM DINHEIRO|NAO TEM DINHEIRO|NAO TERIA O DINHEIRO|PAGAMENTO DAS CLIENTES|FINANCEIR/],["Esqueceu ou imprevisto",/ESQUEC|CONFUND|COMPROMISSO|IMPREVISTO/],["Mudança",/MUDANCA|MUDOU|MUDANDO/]];
var RX_AUT = /AUT\w*\.? (?:POR )?(MARCUS|LUCAS|NICKOLAS|ANAMARIA|ANA MARIA|MARCO)|(MARCUS|LUCAS|NICKOLAS|ANAMARIA) AUTORIZ|AUTO (MARCUS|LUCAS)|PEDIU (?:ESSA DATA )?PARA (MARCUS|LUCAS)/;
// dia e hora de um texto: "PARA O DIA 28/11 AS 14:30H", "VEM NA EMPRESA 06/03 - 13:00", "VEM HOJE DIA 10/08 ÀS 13H", "AGENDAR PARA 19/02"
var RX_DIA = /(?:AGEND\w*|PARA|VEM NA EMPRESA|VEM HOJE|VEM AMANHA|DIA)\s*(?:O\s+)?(?:AMANHA\s+)?(?:DIA\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/;
function diaHoraDoTexto(texto, baseIso){
  var t = semAcento(texto), m = t.match(RX_DIA); if(!m) return null;
  var base = parteData(baseIso || isoDe(new Date())), ano = m[3] ? (m[3].length===2 ? 2000+Number(m[3]) : Number(m[3])) : base.getFullYear();
  var d = new Date(ano, m[2]-1, m[1]); if(!m[3] && baseIso && d.getTime() < base.getTime()-30*86400000) d = new Date(ano+1, m[2]-1, m[1]);   // linha sem data: ano de hoje, sem virar o ano
  var resto = t.slice(m.index+m[0].length), h = resto.match(/(\d{1,2})\s*(?::\s*(\d{2}))?\s*(?:H\b|HORAS?)|\bAS\s*(\d{1,2})(?:\s*:\s*(\d{2}))?|^\W*(\d{1,2})\s*:\s*(\d{2})/);
  var hh = h ? (h[1]||h[3]||h[5]) : null, mm = h ? (h[2]||h[4]||h[6]||"00") : "00";
  return {dia:isoDe(d), hora:hh ? String(hh).padStart(2,"0")+":"+String(mm).padStart(2,"0") : ""};
}
// Classifica UMA linha de anotação nas opções do card (tipo, motivo, autorizado por, isenta, dia/hora, ciclo)
function classificarLinha(texto, dataIso){
  var t = semAcento(texto), dh = diaHoraDoTexto(texto, dataIso), r = {tipo:"outro", motivo:"", autorizado:"", isenta:false, dia:"", hora:"", ciclo:0};
  var multaTxt = /MULTA|\+ ?\d+ ?%/.test(t);
  if(/DESMARC|CANCEL/.test(t)) r.tipo = "desmarcado";
  else if(/NAO CONSEGU\w+ (VIR|CHEGAR|COMPARECER)|NAO (VEIO|COMPARECEU|VAI CONSEGUIR VIR|PODE VIR)|FALTOU|NAO APARECEU|NAO CONSEGUE VIR/.test(t) && !/REAGEND|REMARC/.test(t)) r.tipo = dh && /AGENDAD|AGENDAO|VEM NA EMPRESA/.test(t) ? "remarcado" : "nao_veio";
  else if(/REAGEND|REMARC|DATA ALTERADA|ALTERAD[OA] (A )?DATA|ALTERACAO DE DATA|MUDOU (A )?DATA|ADIAD|REAGENDAO/.test(t)) r.tipo = "remarcado";
  else if(/REP\.? (SOLICITOU|SOLITOU|PEDIU)|KIT COM A REP|REPRESENTANTE (VAI|FARA|INFORMOU)/.test(t)) r.tipo = "rep_kit";
  else if(/AGENDAD|AGENDAO|AGENDOU|VEM NA EMPRESA|VAI VIR|VEM HOJE|VEM AMANHA|\bAGENDAR\b/.test(t) && dh) r.tipo = "marcado";
  else if(/\b(30|45|60|90) DIAS\b|MAIS PRAZO|MAIOR PRAZO|SOLICITOU ALTERACAO/.test(t)) r.tipo = "ciclo";
  else if(/TEM TROCA|TROCA/.test(t)) r.tipo = "troca";
  else if(/PASSEI PARA|PASSADO PARA|REPASSADO PARA|TRANSFERIDO PARA|ALTERAD[OA] DE/.test(t)) r.tipo = "passou";
  else if(/QUER VIR|QUER VIM|VIR NA EMPRESA|VEM NA EMPRESA|VEM FAZER|ACERTO NA EMPRESA/.test(t)) r.tipo = "quer_vir";
  else if(/NAO (RESPONDE|ATENDE|RETORN|VISUALIZ|RESPONDEU|ATENDEU|DA RETORNO)|SEM RETORNO|SEM RESPOSTA|CAIXA POSTAL|NUMERO (ERRADO|NAO EXISTE|INEXISTENTE)/.test(t)) r.tipo = "sem_retorno";
  else if(/ENTREI EM CONTATO|ENTROU EM CONTATO|JA ENTREI|CONTATO/.test(t)) r.tipo = "contato";
  else if(/^\W*(FUNC|FUCION|VENEZIANA)/.test(t)) r.tipo = "marca";
  if(dh && (r.tipo==="marcado" || r.tipo==="remarcado")){ r.dia = dh.dia; r.hora = dh.hora; }
  var cm = t.match(/\b(30|45|60|90) DIAS\b/); if(cm) r.ciclo = Number(cm[1]);
  var am = t.match(RX_AUT); if(am){ var n = am[1]||am[2]||am[3]||am[4]; r.autorizado = n==="ANAMARIA" || n==="ANA MARIA" ? "Ana Maria" : n==="MARCO" ? "Marcus" : n.charAt(0)+n.slice(1).toLowerCase(); }
  var ms = MOTIVO_RX.find(function(x){ return x[1].test(t); }); if(ms) r.motivo = ms[0];
  r.isenta = !!r.autorizado && (r.tipo==="remarcado" || r.tipo==="nao_veio" || r.tipo==="desmarcado") && !multaTxt;
  return r;
}
// Separa o texto de uma ou mais condicionais em contatos estruturados. Linha sem data continua o contato anterior.
function parseObs(textos, hojeIso){
  var vistos = {}, out = [];
  [].concat(textos||[]).forEach(function(tx){
    var atual = null;
    String(tx||"").split(/\r?\n/).forEach(function(l){
      if(!l.trim()) return;
      var m = l.match(RX_LINHA);
      if(m){ atual = {data:dataDaLinha(+m[1], +m[2], m[3], hojeIso), autor:m[4].charAt(0).toUpperCase()+m[4].slice(1).toLowerCase(), texto:m[5].trim(), origem:"devmaster"}; out.push(atual); }
      else if(atual){ atual.texto += " "+l.trim(); }
      else { atual = {data:null, autor:"", texto:l.trim(), origem:"devmaster"}; out.push(atual); }
    });
  });
  out.forEach(function(c){ Object.assign(c, classificarLinha(c.texto, c.data || null), {por:c.autor, quem:c.autor}); });
  return out.filter(function(c){ var k = (c.data||"")+"|"+c.autor.toLowerCase()+"|"+c.texto.toLowerCase(); if(vistos[k]) return false; vistos[k] = 1; return true; })
    .sort(function(a,b){ return (b.data||"").localeCompare(a.data||""); });   // mais novo primeiro
}
// Marcação em vigor: vale o contato mais novo entre marcado, remarcado, desmarcado e não veio (os dois últimos limpam a data). Contato sem campos usa o texto.
function agendadoDe(contatos){
  var lista = (contatos||[]).slice().sort(function(a,b){ return (b.data||"").localeCompare(a.data||""); });
  for(var i=0;i<lista.length;i++){
    var c = lista[i], tp = c.tipo, dia = c.dia, hora = c.hora;
    if(!tp){ var cl = classificarLinha(c.texto, c.data); tp = cl.tipo; dia = cl.dia; hora = cl.hora; }
    if(tp==="desmarcado" || tp==="nao_veio") return null;
    if((tp==="marcado" || tp==="remarcado") && dia) return {data:dia, hora:hora || "08:00"};
  }
  return null;
}
// Situação sugerida pelo que está registrado: agendada (data futura), entrei em contato ou a contatar. Só vale para quem a agendadora ainda não mexeu.
function situacaoDoRegistro(contatos, hojeIso){
  var ag = agendadoDe(contatos);
  if(ag && ag.data >= hojeIso) return "agendada";
  return (contatos||[]).length ? "contato" : "contatar";
}
// Remarcações que pesam no acerto: remarcado, não veio e desmarcado SEM isenção, desde o último acerto (sem acerto na lista: últimos 60 dias).
var TIPOS_MULTA = {remarcado:1, nao_veio:1, desmarcado:1};
function remarcacoesDoCiclo(registro, desdeIso, hojeIso){
  var corte = desdeIso || somaDias(hojeIso || isoDe(new Date()), -60);
  return (registro||[]).filter(function(c){ return TIPOS_MULTA[c.tipo] && (c.data||"") >= corte; });
}
// Escada da regra do sistema (domain/consignado.js, REMARCACAO; Marcus confirmou em 28/10/2026): 1ª −5 pontos de comissão e −15% de brinde; 2ª −8 e −50%; 3ª ou mais −15 e −100%. Isenta não conta nem sobe a escada.
var ESCADA = [{comissaoPct:5, brindePct:15}, {comissaoPct:8, brindePct:50}, {comissaoPct:15, brindePct:100}];
function multaDaVez(vez){ return vez<1 ? {comissaoPct:0, brindePct:0} : ESCADA[Math.min(vez, ESCADA.length)-1]; }
function resumoMulta(registro, desdeIso, hojeIso){
  var l = remarcacoesDoCiclo(registro, desdeIso, hojeIso), cobr = l.filter(function(c){ return !c.isenta; }).length;
  return {total:l.length, cobraveis:cobr, isentas:l.length-cobr, atual:multaDaVez(cobr), proxima:multaDaVez(cobr+1)};
}
// Textos prontos que a Tamara copia: aviso de remarcação (com a multa) e envio das regras novas
function avisoRemarcacao(r, c, hojeIso){
  var nome = primeiroNome(r.nome), res = resumoMulta(r.registro, (r.hist && r.hist[0] && r.hist[0].data) || null, hojeIso);
  var quando = c && c.dia ? fmtDataBR(c.dia)+(c.hora ? " às "+c.hora : "") : "a nova data combinada";
  var base = "Olá, "+nome+"! Seu acerto foi remarcado para "+quando+", aqui na Sorelly Joias. ";
  if(c && c.isenta) return base+"Esta remarcação foi autorizada"+(c.autorizado ? " por "+c.autorizado : "")+" e não tem multa. Combinado? Te esperamos!";
  var m = res.atual, p = res.proxima;
  return base+"Pelas regras do consignado, esta é a "+res.cobraveis+"ª remarcação e tem multa de "+m.comissaoPct+" pontos na comissão e "+m.brindePct+"% no brinde. Se não vier nesta data, a próxima remarcação terá multa de "+p.comissaoPct+" pontos na comissão e "+p.brindePct+"% no brinde. Posso confirmar o seu horário?";
}
function mensagemRegras(r, origem){
  return "Olá, "+primeiroNome(r.nome)+"! Estamos com novas regras e comissões do consignado, que valem para o seu próximo acerto. Leia o guia com atenção: "+(origem||"")+"/regras/GUIA-DA-REVENDEDORA.pdf . Qualquer dúvida, é só me chamar!";
}

// ── Regras da agenda (Marcus, 28/10/2026) ──
// Até 3 revendedoras no MESMO horário e até 15 por dia, horários de 1 hora das 08h às 18h (inclui 11h–12h e 12h–13h).
// Sábado: só marca até as 11h (08h, 09h e 10h), no máximo 9 no dia. Domingo: sem atendimento, não marca nada.
var CAP_HORA = 3;
var HORAS_AGENDA = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"];
function diaDaSemana(iso){ return parteData(iso).getDay(); }
function horasDoDia(iso){ var w = diaDaSemana(iso); return w===0 ? [] : w===6 ? HORAS_AGENDA.slice(0,3) : HORAS_AGENDA; }
function capacidadeDia(iso){ var w = diaDaSemana(iso); return w===0 ? 0 : w===6 ? 9 : 15; }
// marcadas num dia: [{r, hora}] vindas de r.agend (dia e hora marcados na revendedora)
function marcadasDoDia(lista, iso){ return (lista||[]).filter(function(r){ return r.agend && r.agend.data===iso; }).map(function(r){ return {r:r, hora:r.agend.hora}; }); }
function vagasDoDia(lista, iso){ return capacidadeDia(iso) - marcadasDoDia(lista, iso).length; }
// pode marcar naquele dia e horário? Devolve "" se pode, ou o motivo de não poder. "ignorarId" = a própria revendedora (remarcar o mesmo horário não conta duas vezes)
function motivoNaoMarcar(lista, iso, hora, ignorarId){
  var w = diaDaSemana(iso); if(w===0) return "Domingo: sem atendimento.";
  if(horasDoDia(iso).indexOf(hora)<0) return w===6 ? "Sábado só marca até as 11h." : "Horário fora do atendimento.";
  var outros = marcadasDoDia((lista||[]).filter(function(r){ return r.id!==ignorarId; }), iso);
  if(outros.length>=capacidadeDia(iso)) return "Dia lotado ("+capacidadeDia(iso)+" marcadas).";
  if(outros.filter(function(x){ return x.hora===hora; }).length>=CAP_HORA) return "Horário cheio ("+CAP_HORA+" no mesmo horário).";
  return "";
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

export { CAP_HORA, HORAS_AGENDA, diaDaSemana, horasDoDia, capacidadeDia, marcadasDoDia, vagasDoDia, motivoNaoMarcar, TIPOS_REG, MOTIVOS_REG, AUTORIZADORES, tipoReg, classificarLinha, remarcacoesDoCiclo, multaDaVez, resumoMulta, avisoRemarcacao, mensagemRegras, parseObs, agendadoDe, situacaoDoRegistro, MEDIA_MINIMA_SORELLY, mediaTres, kitDaMedia, histDemoDe, avaliarKit, internoDeAgendada, agendaHojeDemo, CICLOS, SITUACOES, DIAS_ALERTA, parteData, isoDe, somaDias, diasEntre, fmtDataBR, proximoAcerto, emAlerta, primeiroNome, mensagens, revInternasDemo };
