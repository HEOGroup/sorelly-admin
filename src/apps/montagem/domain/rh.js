// Sorelly Admin · montagem — domain/rh.js
// Recursos Humanos trazido do SorellyAdmin: presença diária, ABS (absenteísmo) e TO (turnover), relatório diário para o WhatsApp,
// advertências, controle de experiência e horas extras. As regras ficam aqui; as telas em pages/RH.js. Estado: s.rh (só neste navegador por enquanto).
// A lista de colaboradores é a lista de funcionários CLT de domain/pessoas.js (sócios e PJ não entram no controle de presença); o RH completa o cadastro (admissão, escala, salário...).
import { funcionarios, REPRESENTANTES } from "@/apps/montagem/domain/pessoas";

var CODIGOS = [["P","Presença","#22C55E"], ["F","Falta sem justificativa","#EF4444"], ["AJ","Falta com aviso","#F59E0B"], ["AT","Atestado","#A855F7"], ["FE","Férias","#3B82F6"], ["FO","Folga","#94A3B8"], ["AF","Afastamento","#EC4899"]];
var AUSENTES = ["F","AJ","AT","AF"];
var STATUS = [["ATIVO","Ativo"], ["FERIAS","Férias"], ["AFASTADO","Afastado"], ["DESLIGADO","Desligado"]];
var TIPOS_DESLIG = ["Pedido de demissão", "Sem justa causa", "Justa causa", "Término de contrato", "Acordo", "Outro"];
var DIAS_SEMANA = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
// contratos: o vocabulário de status varia por tipo
var STATUS_BY_TIPO = {REPRESENTANTE:["antigo","feito","assinado","encerrado"], CLT:["nao_revisado","em_revisao","atualizado"], TERCEIRO:["ativo","encerrado"], PARTICULAR:["ativo","encerrado"]};
var STATUS_LB = {antigo:"Contrato antigo", feito:"Novo feito", assinado:"Assinado e anexado", nao_revisado:"Não revisado", em_revisao:"Em revisão", atualizado:"Atualizado e assinado", ativo:"Ativo", encerrado:"Encerrado"};
var TIPOS_CONTRATO = {REPRESENTANTE:"Representantes", CLT:"Funcionários (CLT)", TERCEIRO:"Terceiros", PARTICULAR:"Particulares do Marcus"};
var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

// ---------- datas (sempre texto AAAA-MM-DD, sem fuso) ----------
var p2 = function(n){ return String(n).padStart(2,"0"); };
var isoDe = function(d){ return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate()); };
var hojeIso = function(){ return isoDe(new Date()); };
var utc = function(iso){ var a = iso.split("-").map(Number); return Date.UTC(a[0], a[1]-1, a[2]); };
var diasEntre = function(a, b){ return Math.round((utc(b)-utc(a))/86400000); };
var somaDias = function(iso, n){ var d = new Date(utc(iso)+n*86400000); return d.getUTCFullYear()+"-"+p2(d.getUTCMonth()+1)+"-"+p2(d.getUTCDate()); };
var diaSem = function(iso){ return new Date(utc(iso)).getUTCDay(); };
var ultimoDia = function(ano, mes){ return new Date(ano, mes, 0).getDate(); };
var dataIso = function(ano, mes, dia){ return ano+"-"+p2(mes)+"-"+p2(dia); };
var br = function(iso){ return iso ? iso.split("-").reverse().join("/") : "—"; };
var slug = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); };
var minutosDe = function(hhmm){ var m = /^(\d{1,2}):(\d{2})$/.exec(hhmm||""); return m ? Number(m[1])*60+Number(m[2]) : null; };
// horas extras: lançadas e mostradas em HH:MM, guardadas em horas decimais
var formatHoras = function(h){ var t = Math.round((h||0)*60); return p2(Math.floor(t/60))+":"+p2(t%60); };
var parseHoras = function(t){ var s = String(t||"").trim(), m = /^(\d{1,3}):([0-5]\d)$/.exec(s); if(m) return Number(m[1])+Number(m[2])/60; return /^\d{1,3}$/.test(s) ? Number(s) : null; };
var valorHoraExtra = function(salario, horas, pct){ return (salario/220)*horas*(1+pct/100); };

// ---------- estado inicial ----------
// feriados nacionais de 2026 (o RH acrescenta os da cidade e da empresa no Configurador)
var FERIADOS2026 = [["2026-01-01","Confraternização Universal"], ["2026-04-03","Sexta-feira Santa"], ["2026-04-21","Tiradentes"], ["2026-05-01","Dia do Trabalho"], ["2026-06-04","Corpus Christi"],
  ["2026-09-07","Independência"], ["2026-10-12","Nossa Senhora Aparecida"], ["2026-11-02","Finados"], ["2026-11-15","Proclamação da República"], ["2026-12-25","Natal"]];
function rhDemo(){
  return {v:1, config:{
    escalas:[{id:"e1", nome:"Segunda a sexta", dias:[1,2,3,4,5]}, {id:"e2", nome:"Segunda a sábado", dias:[1,2,3,4,5,6]}], escalaPadrao:"e1", entradaPadrao:"08:00",
    planos:[{id:"p1", nome:"45 + 45 dias", marco1:45, marco2:45}],
    tiposAdv:[{id:"ta1", nome:"Verbal", suspensao:false}, {id:"ta2", nome:"Escrita", suspensao:false}, {id:"ta3", nome:"Suspensão", suspensao:true}],
    motivosAdv:[{id:"ma1", nome:"Atraso"}, {id:"ma2", nome:"Falta sem justificativa"}, {id:"ma3", nome:"Conduta"}],
    tiposHE:[{id:"he1", nome:"Hora extra 50%", pct:50}, {id:"he2", nome:"Hora extra 100%", pct:100}, {id:"he3", nome:"Banco de horas", pct:0}],
    feriados:FERIADOS2026.map(function(f, i){ return {id:"fr"+i, data:f[0], nome:f[1], cnpj:""}; }), socios:5},
    colab:{}, novos:[], presenca:{}, adv:[], horas:[], contratos:[], modelos:[], colunasRep:[]};
}

// ---------- colaboradores ----------
// Dados pessoais e de folha vêm da planilha FUNCIONARIOS - CONTROLE 2026, guardada num arquivo LOCAL (fora do GitHub). Sem o arquivo, o cadastro começa vazio e o RH preenche na tela.
var LOCAIS = (function(){ var m = import.meta.glob("./rh-funcionarios.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : []; })();
var ALIAS_PLANILHA = {"sthefany-marques-de-aquino-correa":"sthafany-marques-de-aquino-correa"};   // a planilha escreve Sthefany; a lista de Pessoas, Sthafany
var LOCAL_POR_ID = {}; LOCAIS.forEach(function(x){ LOCAL_POR_ID[ALIAS_PLANILHA[x.id]||x.id] = x; });
var titulo = function(t){ return String(t||"").toLowerCase().replace(/(^|\s)(\S)/g, function(m, a, b){ return a+b.toUpperCase(); }).replace(/\s(Da|De|Do|Das|Dos|E)\s/g, function(m){ return m.toLowerCase(); }); };
var dadosLocal = function(x){ return {funcao:x.funcao, folha:x.folha, termoPeca:!!x.termoPeca, cpf:x.cpf, vt:x.vt, nascimento:x.nascimento, telefone:x.telefone, cidade:x.cidade, admissao:x.admissao, salario:x.salario, entrada:x.entrada, escalaId:x.escala, aviso:!!x.aviso,
  status:x.deslig ? "DESLIGADO" : x.status, deslig:x.deslig||null, afastamento:x.afastamento || (x.status==="AFASTADO" ? "A confirmar (consta como afastada na planilha)" : "")}; };
function colaboradoresRh(s){
  var rh = s.rh, cfg = rh.config;
  var base = funcionarios().filter(function(f){ return f.vinculo==="clt"; }).map(function(f){ return {id:slug(f.nome), nome:f.nome, setor:f.setor, cnpj:f.cnpj}; });
  var ids = {}; base.forEach(function(b){ ids[b.id] = 1; });
  // quem está na planilha e não está mais na lista de Pessoas (Julia e Rebeca, do Marketing) continua no cadastro do RH: Julia desligada, Rebeca cumprindo aviso
  var saiu = LOCAIS.filter(function(x){ return !ids[ALIAS_PLANILHA[x.id]||x.id]; }).map(function(x){ return {id:x.id, nome:titulo(x.nome), setor:x.setor, cnpj:x.cnpj}; });
  var novos = (rh.novos||[]).map(function(n){ return {id:n.id, nome:n.nome, setor:n.setor, cnpj:n.cnpj, novo:true}; });
  return base.concat(saiu, novos).map(function(b){ var o = rh.colab[b.id]||{}, l = LOCAL_POR_ID[b.id] ? dadosLocal(LOCAL_POR_ID[b.id]) : {}, esc = cfg.escalas.find(function(x){ return x.id===(o.escalaId||l.escalaId||cfg.escalaPadrao); }) || cfg.escalas[0];
    return Object.assign({status:"ATIVO", entrada:cfg.entradaPadrao, admissao:"", salario:0, planoId:"", efetivadoEm:"", efetivadoPor:"", ferias:null, afastamento:"", deslig:null, aviso:false}, l, o, b, {escalaId:esc.id, escalaDias:esc.dias}); });
}
var rotuloCnpj = function(c){ return c ? "CNPJ "+c : "CNPJ a informar"; };

// ---------- presença ----------
var presencaDe = function(rh, id, iso){ var d = (rh.presenca||{})[iso]; return d && d[id] ? d[id] : null; };
function feriadoNoDia(rh, cnpj, iso){ return (rh.config.feriados||[]).some(function(f){ return f.data===iso && (!f.cnpj || f.cnpj===cnpj); }); }
// dia escalado: não é domingo, está na escala, não é feriado, não é antes da admissão e o lançamento não é férias nem folga
function diaEscalado(rh, c, iso){
  var dw = diaSem(iso); if(dw===0 || c.escalaDias.indexOf(dw)<0) return false; if(feriadoNoDia(rh, c.cnpj, iso)) return false;
  if(c.admissao && iso<c.admissao) return false; var p = presencaDe(rh, c.id, iso); if(p && (p.c==="FE" || p.c==="FO")) return false; return true;
}
function limiteDoMes(ano, mes, hoje){ var h = hoje||new Date(); return ano===h.getFullYear() && mes===h.getMonth()+1 ? h.getDate() : ultimoDia(ano, mes); }
// ABS e TO: sempre soma os números brutos antes de dividir (nunca média de percentuais)
function brutosMes(s, colabs, ano, mes, hoje){
  var rh = s.rh, lim = limiteDoMes(ano, mes, hoje), r = {ativos:0, escalados:0, ausentes:0, desligados:0}, ini = dataIso(ano, mes, 1), fim = dataIso(ano, mes, ultimoDia(ano, mes));
  colabs.forEach(function(c){
    if(c.status==="ATIVO"){ r.ativos++; for(var d=1; d<=lim; d++){ var iso = dataIso(ano, mes, d); if(!diaEscalado(rh, c, iso)) continue; r.escalados++; var p = presencaDe(rh, c.id, iso); if(p && AUSENTES.indexOf(p.c)>=0) r.ausentes++; } }
    if(c.status==="DESLIGADO" && c.deslig && c.deslig.data>=ini && c.deslig.data<=fim) r.desligados++; });
  return r;
}
var somarBrutos = function(l){ return l.reduce(function(a, x){ return {ativos:a.ativos+x.ativos, escalados:a.escalados+x.escalados, ausentes:a.ausentes+x.ausentes, desligados:a.desligados+x.desligados}; }, {ativos:0, escalados:0, ausentes:0, desligados:0}); };
var agregar = function(b){ var tot = b.ativos+b.desligados; return Object.assign({}, b, {abs:b.escalados ? b.ausentes/b.escalados : 0, to:tot ? b.desligados/tot : 0}); };
// escopo: {cnpj:"" (grupo) ou id, ano, mes, anual}
function statsEscopo(s, esc, hoje){
  var h = hoje||new Date(), todos = colaboradoresRh(s), lista = esc.cnpj ? todos.filter(function(c){ return c.cnpj===esc.cnpj; }) : todos, brutos;
  if(esc.anual){ var meses = []; for(var m=1; m<=12; m++){ if(esc.ano>h.getFullYear() || (esc.ano===h.getFullYear() && m>h.getMonth()+1)) break; meses.push(Object.assign({mes:m}, agregar(brutosMes(s, lista, esc.ano, m, h)))); }
    brutos = somarBrutos(meses); return Object.assign(agregar(brutos), {porMes:meses, ativos:brutosMes(s, lista, esc.ano, Math.min(h.getFullYear()===esc.ano ? h.getMonth()+1 : 12, 12), h).ativos}); }
  return agregar(brutosMes(s, lista, esc.ano, esc.mes, h));
}
function porEmpresaStats(s, esc, hoje){
  var ids = []; colaboradoresRh(s).forEach(function(c){ if(ids.indexOf(c.cnpj)<0) ids.push(c.cnpj); }); ids.sort();
  return ids.map(function(id){ return Object.assign({cnpj:id}, statsEscopo(s, Object.assign({}, esc, {cnpj:id}), hoje)); });
}
function desligadosDoPeriodo(s, esc){ var ini = esc.anual ? esc.ano+"-01-01" : dataIso(esc.ano, esc.mes, 1), fim = esc.anual ? esc.ano+"-12-31" : dataIso(esc.ano, esc.mes, ultimoDia(esc.ano, esc.mes));
  return colaboradoresRh(s).filter(function(c){ return c.status==="DESLIGADO" && c.deslig && c.deslig.data>=ini && c.deslig.data<=fim && (!esc.cnpj || c.cnpj===esc.cnpj); }).sort(function(a, b){ return b.deslig.data.localeCompare(a.deslig.data); }); }

// ---------- relatório diário (texto pronto para o WhatsApp) ----------
function periodoContinuo(rh, id, iso, aceita, vazioPode){
  var ini = iso, fim = iso, gap = 0, d;
  for(d=1; d<=120; d++){ var x = somaDias(iso, d), p = presencaDe(rh, id, x), c = p ? p.c : ""; if(aceita(c)){ fim = x; gap = 0; } else if(vazioPode && (c==="" || c==="FO") && gap<4){ gap++; } else break; }
  gap = 0; for(d=1; d<=120; d++){ var y = somaDias(iso, -d), q = presencaDe(rh, id, y), c2 = q ? q.c : ""; if(aceita(c2)){ ini = y; gap = 0; } else if(vazioPode && (c2==="" || c2==="FO") && gap<4){ gap++; } else break; }
  return {inicio:ini, fim:fim, dias:diasEntre(ini, fim)+1};
}
function relatorioDiario(s, iso){
  var rh = s.rh, colabs = colaboradoresRh(s);
  var ativosNoDia = colabs.filter(function(c){ if(c.admissao && c.admissao>iso) return false; return c.deslig && c.deslig.data ? c.deslig.data>iso : c.status!=="DESLIGADO"; });
  var por = {}; ativosNoDia.forEach(function(c){ por[c.cnpj] = (por[c.cnpj]||0)+1; });
  var porEmpresa = Object.keys(por).map(function(k){ return {rotulo:rotuloCnpj(k), total:por[k]}; }).sort(function(a, b){ return b.total-a.total; });
  var reps = REPRESENTANTES.filter(function(r){ return !r.tambemFunc; }).length, socios = rh.config.socios||0;
  var pes = function(c){ return {nome:c.nome, setor:c.setor||null}; };
  var atrasos = [], faltas = [], atestados = [], ferias = [];
  colabs.forEach(function(c){ var p = presencaDe(rh, c.id, iso);
    if(p && p.atraso){ var a = minutosDe(p.atraso), e0 = minutosDe(c.entrada); atrasos.push(Object.assign(pes(c), {minutos:(a!==null && e0!==null && a>e0) ? a-e0 : null})); }
    if(p && (p.c==="F" || p.c==="AJ")) faltas.push(Object.assign(pes(c), {justificada:p.c==="AJ"}));
    if(p && p.c==="AT") atestados.push(Object.assign(pes(c), periodoContinuo(rh, c.id, iso, function(x){ return x==="AT"; }, true)));
    if(c.ferias && c.ferias.ini && c.ferias.fim && c.ferias.ini<=iso && c.ferias.fim>=iso) ferias.push(Object.assign(pes(c), {inicio:c.ferias.ini, fim:c.ferias.fim, dias:diasEntre(c.ferias.ini, c.ferias.fim)+1}));
    else if(p && p.c==="FE") ferias.push(Object.assign(pes(c), periodoContinuo(rh, c.id, iso, function(x){ return x==="FE"; }, false))); });
  return {data:iso, funcionariosAtivos:ativosNoDia.length, porEmpresa:porEmpresa, representantesAtivos:reps, socios:socios, total:ativosNoDia.length+reps+socios,
    admitidos:colabs.filter(function(c){ return c.admissao===iso; }).length, demitidos:colabs.filter(function(c){ return c.deslig && c.deslig.data===iso; }).length, atrasos:atrasos, faltas:faltas, atestados:atestados, ferias:ferias};
}
function formatarRelatorio(r){
  var comAviso = r.faltas.filter(function(f){ return f.justificada; }), semJust = r.faltas.filter(function(f){ return !f.justificada; });
  var pessoa = function(p, i){ return (i+1)+". "+(p.setor ? p.setor+" — " : "")+"*"+p.nome+"*"; };
  var bloco = function(titulo, vazio, itens){ return itens.length ? [titulo+" ("+itens.length+")*"].concat(itens) : [titulo+":* "+vazio]; };
  var l = ["📋 *RELATÓRIO RH — "+br(r.data)+"*", "", "👥 *Funcionários ativos: "+r.funcionariosAtivos+"*"].concat(r.porEmpresa.map(function(x){ return x.rotulo+": "+x.total; }), ["",
    "💼 *Representantes ativos:* "+r.representantesAtivos, "🤝 *Sócios:* "+r.socios, "📊 *TOTAL GERAL: "+r.total+"*", "", "📈 Admitidos no dia: *"+r.admitidos+"*", "📉 Demitidos no dia: *"+r.demitidos+"*", ""],
    bloco("⏰ *ATRASOS", "nenhum", r.atrasos.map(function(a, i){ return a.minutos!=null ? pessoa(a, i)+"\n⏱️ "+a.minutos+" min" : pessoa(a, i); })), [""],
    r.faltas.length ? ["🚫 *FALTAS ("+r.faltas.length+")*", ""].concat(bloco("✅ *Com aviso", "nenhuma", comAviso.map(pessoa)), ["" ], bloco("❌ *Sem justificativa", "nenhuma", semJust.map(pessoa))) : ["🚫 *FALTAS:* nenhuma"], [""],
    bloco("🩺 *ATESTADOS", "nenhum", r.atestados.map(function(a, i){ return pessoa(a, i)+"\n"+a.dias+" dias · "+br(a.inicio)+" a "+br(a.fim)+" · retorno "+br(somaDias(a.fim, 1)); })), r.atestados.length ? [""] : [],
    bloco("🏖️ *FÉRIAS", "nenhuma", r.ferias.map(function(f, i){ return pessoa(f, i)+"\n"+f.dias+" dias · "+br(f.inicio)+" a "+br(f.fim); })));
  return l.join("\n");
}

// ---------- advertências ----------
var flagAdv = function(n){ return n>=3 ? "Reincidente" : n===2 ? "Em observação" : "Regular"; };
// lista com a sequência de cada uma dentro do ano (1ª, 2ª...) por colaborador
function advertenciasComSeq(rh){
  var lista = (rh.adv||[]).slice().sort(function(a, b){ return a.data.localeCompare(b.data) || a.em-b.em; }), cont = {};
  return lista.map(function(a){ var k = a.colabId+"|"+a.data.slice(0,4); cont[k] = (cont[k]||0)+1; return Object.assign({}, a, {seq:cont[k], flag:flagAdv(cont[k])}); }).reverse();
}
function resumoAdvertencias(rh, ano){
  var por = {}; (rh.adv||[]).filter(function(a){ return a.data.slice(0,4)===String(ano); }).forEach(function(a){ por[a.colabId] = (por[a.colabId]||0)+1; });
  return por;
}

// ---------- experiência ----------
function experienciaLista(s, hoje){
  var rh = s.rh, h = hoje||hojeIso();
  return colaboradoresRh(s).filter(function(c){ return c.status!=="DESLIGADO" && !c.efetivadoEm && c.planoId && c.admissao; }).map(function(c){
    var pl = rh.config.planos.find(function(x){ return x.id===c.planoId; }); if(!pl) return null;
    var a1 = somaDias(c.admissao, pl.marco1), a2 = somaDias(c.admissao, pl.marco1+pl.marco2), ef = somaDias(a2, 1);
    var chip = h<=a1 ? {t:"1ª avaliação em "+diasEntre(h, a1)+" dias", aviso:diasEntre(h, a1)<=7} : h<=a2 ? {t:"2ª avaliação em "+diasEntre(h, a2)+" dias", aviso:diasEntre(h, a2)<=7} : h<=ef ? {t:"Efetivar em "+diasEntre(h, ef)+" dias", aviso:true} : {t:"Efetivação pendente", vencido:true};
    return {c:c, plano:pl, a1:a1, a2:a2, ef:ef, chip:chip, visivel:diasEntre(a2, h)<=45}; }).filter(function(x){ return x && x.visivel; }).sort(function(a, b){ return a.ef.localeCompare(b.ef); });
}

// ---------- negociações paralelas (hora extra "por fora", 19/10/2026) ----------
// Valores fechados em reais, combinados entre supervisor e funcionária; NÃO substituem a hora extra oficial da folha. Cada pessoa herda o padrão do grupo e só preenche o que for diferente.
// Valores iniciais = planilha CONTROLE HORAS EXTRAS (setembro/outubro 2026); o Marcus está revendo para baixo. h3 vazio = "valor a combinar" (3ª hora só com aprovação prévia).
function negocPadrao(){
  var G = function(id, nome, h1, h2, h3, sab, maxDia, vezesSem, sabMes, obs){ return {id:id, nome:nome, h1:h1, h2:h2, h3:h3, sab:sab, maxDia:maxDia, vezesSem:vezesSem, sabMes:sabMes, obs:obs||""}; };
  var P = function(id, nome, grupoId, o){ return Object.assign({id:id, nome:nome, grupoId:grupoId, h1:null, h2:null, h3:null, sab:null, maxDia:null, vezesSem:null, sabMes:null, obs:""}, o||{}); };
  return {
    grupos:[G("g-dir","Diretoria",70,125,null,220,2,null,2,"Negociação com Nickolas e Lucas."), G("g-marcus","Setor Marcus",50,120,null,180,2,3,2,"Amanda, Maria Claudia e Deysiane."), G("g-cad","Cadastro (supervisão do Nickolas)",40,80,null,120,2,3,2,"Camilly, Helen, Michelle e Thali."), G("g-geral","Geral Sorelly",null,null,null,null,2,null,2,"Escolhido caso a caso pelo Marcus.")],
    pessoas:[
      P("nickolas-gabriel-leal-neves","Nickolas Gabriel Leal Neves","g-dir"), P("lucas-oliveira-da-rocha","Lucas Oliveira da Rocha","g-dir"),
      P("amanda-de-miranda-goncalves","Amanda de Miranda Gonçalves","g-marcus"), P("maria-claudia-stresser-de-faria","Maria Claudia Stresser de Faria","g-marcus"), P("deysiane-portugues-da-silva","Deysiane Portugues da Silva","g-marcus",{h2:120,obs:"Planilha tinha 110 na tabela e 120 nos lançamentos; seguiu 120. Confirmar."}),
      P("camilly-de-sousa-maciel","Camilly de Sousa Maciel","g-cad"), P("helen-garmier-da-silva","Helen Garmier da Silva","g-cad"), P("michele-brito-lima-cassemiro","Michele Brito Lima Cassemiro","g-cad"), P("thalita-torazzi-arndt","Thalita Torazzi Arndt","g-cad"),
      P("rayssa-alessandra-ingatain","Rayssa Alessandra Ingatain","g-geral",{h2:100,h3:150,obs:"Escolhido caso a caso pelo Marcus."}),
      P("amanda-d","Amanda D.","g-geral",{h1:40,h2:80,h3:120,obs:"Vincular ao cadastro (qual Amanda?)."}), P("kesiane","Kesiane","g-geral",{h1:40,h2:80,h3:120,obs:"PENDENTE: valor ainda não definido. Vincular ao cadastro."})]};
}
// o que vale para a pessoa: o dela, senão o do grupo
function negocEfetiva(rh, id){
  var n = rh.negoc || negocPadrao(), p = n.pessoas.find(function(x){ return x.id===id; }); if(!p) return null;
  var g = n.grupos.find(function(x){ return x.id===p.grupoId; }) || {}, v = function(k){ return p[k]!==null && p[k]!==undefined ? p[k] : (g[k]!==undefined ? g[k] : null); };
  return {grupo:g.nome||"—", h1:v("h1"), h2:v("h2"), h3:v("h3"), sab:v("sab"), maxDia:v("maxDia"), vezesSem:v("vezesSem"), sabMes:v("sabMes"), obs:p.obs||""};
}

// ---------- reducer ----------
// devolve {patch, msg}; patch vazio + msg = recusado
function rhReduz(s, a){
  var rh = JSON.parse(JSON.stringify(s.rh)), por = a.por||"—", cfg = rh.config, recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg){ return {patch:{rh:rh}, msg:msg}; };
  var novoId = function(p){ return p+Date.now().toString(36)+Math.floor(Math.random()*1000).toString(36); };
  switch(a.op){
    case "colab_set": {
      var cs = colaboradoresRh(s).find(function(x){ return x.id===a.id; }); if(!cs) return recusa("Colaborador não encontrado.");
      var pt = Object.assign({}, a.patch), st = pt.status!==undefined ? pt.status : cs.status;
      if(st==="DESLIGADO"){ var d0 = pt.deslig || cs.deslig; if(!d0 || !d0.data || !d0.tipo || !d0.motivo) return recusa("Para desligar, informe data, tipo e motivo."); pt.ferias = null; pt.afastamento = ""; }
      else if(st==="FERIAS"){ var f0 = pt.ferias || cs.ferias; if(!f0 || !f0.ini || !f0.fim) return recusa("Para férias, informe início e fim."); pt.deslig = null; pt.afastamento = ""; }
      else if(st==="AFASTADO"){ var m0 = pt.afastamento!==undefined ? pt.afastamento : cs.afastamento; if(!String(m0||"").trim()) return recusa("Para afastamento, informe o motivo."); pt.deslig = null; pt.ferias = null; }
      else { pt.deslig = null; pt.ferias = null; pt.afastamento = ""; }
      if(st==="DESLIGADO" && cs.status!=="DESLIGADO") pt.desligPor = por;
      rh.colab[a.id] = Object.assign({}, rh.colab[a.id], pt); return ok("Cadastro de "+cs.nome+" salvo"); }
    case "colab_add": { var nm = String(a.nome||"").trim(); if(!nm || !a.setor) return recusa("Informe nome e setor."); var id = novoId("n-");
      rh.novos.push({id:id, nome:nm, setor:a.setor, cnpj:a.cnpj||""}); rh.colab[id] = {admissao:a.admissao||""}; return ok(nm+" cadastrada"); }
    case "colab_del": { if(!rh.novos.some(function(n){ return n.id===a.id; })) return recusa("Só se exclui quem foi cadastrado aqui. Para quem saiu, use Desligado."); rh.novos = rh.novos.filter(function(n){ return n.id!==a.id; }); delete rh.colab[a.id];
      Object.keys(rh.presenca).forEach(function(d){ delete rh.presenca[d][a.id]; }); rh.adv = rh.adv.filter(function(x){ return x.colabId!==a.id; }); rh.horas = rh.horas.filter(function(x){ return x.colabId!==a.id; }); return ok("Colaboradora excluída"); }
    case "pres_set": { rh.presenca[a.data] = rh.presenca[a.data]||{}; var pr = rh.presenca[a.data][a.id] || {}; if(a.codigo) pr.c = a.codigo; else delete pr.c;
      if(!pr.c && !pr.atraso) delete rh.presenca[a.data][a.id]; else rh.presenca[a.data][a.id] = pr; return ok(); }
    case "pres_atraso": { rh.presenca[a.data] = rh.presenca[a.data]||{}; var pa = rh.presenca[a.data][a.id] || {}; if(a.atraso) pa.atraso = a.atraso; else delete pa.atraso;
      if(!pa.c && !pa.atraso) delete rh.presenca[a.data][a.id]; else rh.presenca[a.data][a.id] = pa; return ok(a.atraso ? "Atraso lançado" : "Atraso removido"); }
    case "pres_marcar_dia": { var n = 0; rh.presenca[a.data] = rh.presenca[a.data]||{};
      colaboradoresRh(s).filter(function(c){ return c.status==="ATIVO" && (!a.cnpj || c.cnpj===a.cnpj) && diaEscalado(s.rh, c, a.data); }).forEach(function(c){ var p = rh.presenca[a.data][c.id]; if(!p || !p.c){ rh.presenca[a.data][c.id] = Object.assign({}, p, {c:"P"}); n++; } });
      return ok(n+" marcadas como Presença em "+br(a.data)); }
    case "adv_add": { if(!a.colabId || !a.data || !a.tipoId || !a.motivoId) return recusa("Escolha colaborador, data, tipo e motivo.");
      var tp = cfg.tiposAdv.find(function(x){ return x.id===a.tipoId; }); var dias = tp && tp.suspensao ? Number(a.dias||0) : 0; if(tp && tp.suspensao && !(dias>0)) return recusa("Informe os dias de suspensão.");
      rh.adv.push({id:novoId("ad-"), colabId:a.colabId, data:a.data, tipoId:a.tipoId, motivoId:a.motivoId, dias:dias, obs:String(a.obs||"").trim(), por:por, em:Date.now()}); return ok("Advertência registrada"); }
    case "efetivar": { var ce = colaboradoresRh(s).find(function(x){ return x.id===a.id; }); if(!ce) return recusa("Colaborador não encontrado."); if(ce.status==="DESLIGADO") return recusa("Colaboradora desligada."); if(ce.efetivadoEm) return recusa("Já efetivada.");
      rh.colab[a.id] = Object.assign({}, rh.colab[a.id], {efetivadoEm:hojeIso(), efetivadoPor:por}); return ok(ce.nome+" efetivada"); }
    case "he_add": { var horas = parseHoras(a.horas); if(!a.colabId || !a.data || !a.tipoId) return recusa("Escolha colaborador, data e tipo."); if(horas===null || horas<=0) return recusa("Informe as horas em HH:MM (ex.: 02:30).");
      rh.horas.push({id:novoId("he-"), colabId:a.colabId, data:a.data, tipoId:a.tipoId, horas:horas, obs:String(a.obs||"").trim(), por:por, em:Date.now()}); return ok("Hora extra lançada"); }
    case "he_del": { rh.horas = rh.horas.filter(function(x){ return x.id!==a.id; }); return ok("Hora extra excluída"); }
    // ---- contratos (representantes, CLT, terceiros, particulares) e modelos
    case "contr_add": { var tp = a.tipo, nmc = String(a.nome||"").trim(); if(!STATUS_BY_TIPO[tp]) return recusa("Tipo de contrato inválido."); if(!nmc) return recusa("Informe o nome.");
      rh.contratos.push(Object.assign({id:novoId("ct-"), tipo:tp, status:STATUS_BY_TIPO[tp][0], nome:nmc, cpf:"", cnpj:"", documento:"", valor:null, vigenciaInicio:"", vigenciaFim:"", obs:"", extra:{}, modeloId:"", documentoId:"", anexos:[], criadoEm:Date.now(), por:por}, a.dados||{}, {nome:nmc})); return ok("Cadastrado"); }
    case "contr_lote": { var jaTem = {}; rh.contratos.filter(function(x){ return x.tipo===a.tipo; }).forEach(function(x){ jaTem[slug(x.nome)] = 1; }); var novosC = 0;
      (a.itens||[]).forEach(function(it){ if(!it.nome || jaTem[slug(it.nome)]) return; jaTem[slug(it.nome)] = 1; novosC++; rh.contratos.push(Object.assign({id:novoId("ct-"), tipo:a.tipo, status:STATUS_BY_TIPO[a.tipo][0], cpf:"", cnpj:"", documento:"", valor:null, vigenciaInicio:"", vigenciaFim:"", obs:"", extra:{}, modeloId:"", documentoId:"", anexos:[], criadoEm:Date.now(), por:por}, it)); });
      return ok(novosC ? novosC+" cadastrado(s) a partir da lista" : "Todos já estavam cadastrados"); }
    case "contr_set": { var cc = rh.contratos.find(function(x){ return x.id===a.id; }); if(!cc) return recusa("Contrato não encontrado."); if(a.patch.status && STATUS_BY_TIPO[cc.tipo].indexOf(a.patch.status)<0) return recusa("Status inválido para este tipo."); Object.assign(cc, a.patch); return ok(); }
    case "contr_extra": { var ce = rh.contratos.find(function(x){ return x.id===a.id; }); if(!ce) return recusa("Contrato não encontrado."); ce.extra = Object.assign({}, ce.extra); ce.extra[a.chave] = a.valor; return ok(); }
    case "contr_del": { rh.contratos = rh.contratos.filter(function(x){ return x.id!==a.id; }); return ok("Removido"); }
    case "contr_anexo_add": { var ca = rh.contratos.find(function(x){ return x.id===a.id; }); if(!ca) return recusa("Contrato não encontrado."); ca.anexos = ca.anexos.filter(function(x){ return x.tipo!==a.anexo.tipo; }).concat([Object.assign({}, a.anexo, {em:Date.now(), por:por})]); return ok("Arquivo anexado"); }
    case "contr_anexo_del": { var cd = rh.contratos.find(function(x){ return x.id===a.id; }); if(!cd) return recusa("Contrato não encontrado."); cd.anexos = cd.anexos.filter(function(x){ return x.id!==a.anexoId; }); return ok("Arquivo removido"); }
    case "contr_gerar": { var nmg = String((a.dados||{}).nome||"").trim(); if(!STATUS_BY_TIPO[a.tipo] || !nmg) return recusa("Informe o nome."); rh.contratos.push(Object.assign({id:novoId("ct-"), tipo:a.tipo, status:STATUS_BY_TIPO[a.tipo][0], cpf:"", cnpj:"", documento:"", valor:null, vigenciaInicio:"", vigenciaFim:"", obs:"", extra:{}, anexos:[], criadoEm:Date.now(), por:por}, a.dados, {modeloId:a.modeloId||"", documentoId:a.docId||""})); return ok("Contrato gerado"); }
    case "contr_coluna_add": { var nc = String(a.nome||"").trim(); if(!nc) return recusa("Informe o nome da coluna."); rh.colunasRep = rh.colunasRep||[]; if(rh.colunasRep.indexOf(nc)<0) rh.colunasRep.push(nc); return ok("Coluna criada"); }
    case "modelo_save": { var nmm = String(a.nome||"").trim(); if(!nmm) return recusa("Dê um nome ao modelo."); if(!STATUS_BY_TIPO[a.tipo]) return recusa("Escolha o tipo de contrato."); var md = a.id ? rh.modelos.find(function(x){ return x.id===a.id; }) : null;
      if(!md){ md = {id:novoId("md-")}; rh.modelos.push(md); } Object.assign(md, {tipo:a.tipo, nome:nmm, conteudo:a.conteudo||"", variaveis:a.variaveis||[], atualizadoEm:Date.now(), por:por}); return ok("Modelo salvo"); }
    case "modelo_del": { rh.modelos = rh.modelos.filter(function(x){ return x.id!==a.id; }); rh.contratos.forEach(function(x){ if(x.modeloId===a.id) x.modeloId = ""; }); return ok("Modelo excluído (os contratos já gerados ficam)"); }
    // ---- negociações paralelas (hora extra por fora): grupos com valor padrão e pessoas que herdam ou sobrescrevem
    case "neg_grupo_set": { rh.negoc = rh.negoc || negocPadrao(); var gn = rh.negoc.grupos.find(function(x){ return x.id===a.id; }); if(!gn) return recusa("Grupo não encontrado."); Object.assign(gn, a.patch); return ok(); }
    case "neg_grupo_add": { var ng = String(a.nome||"").trim(); if(!ng) return recusa("Informe o nome do grupo."); rh.negoc = rh.negoc || negocPadrao(); rh.negoc.grupos.push({id:novoId("g-"), nome:ng, h1:null, h2:null, h3:null, sab:null, maxDia:2, vezesSem:null, sabMes:2, obs:""}); return ok("Grupo criado"); }
    case "neg_grupo_del": { rh.negoc = rh.negoc || negocPadrao(); if(rh.negoc.pessoas.some(function(x){ return x.grupoId===a.id; })) return recusa("Há pessoas neste grupo: mude o grupo delas antes."); rh.negoc.grupos = rh.negoc.grupos.filter(function(x){ return x.id!==a.id; }); return ok("Grupo excluído"); }
    case "neg_pessoa_set": { rh.negoc = rh.negoc || negocPadrao(); var pn = rh.negoc.pessoas.find(function(x){ return x.id===a.id; }); if(!pn) return recusa("Pessoa não encontrada."); Object.assign(pn, a.patch); return ok(); }
    case "neg_pessoa_add": { rh.negoc = rh.negoc || negocPadrao(); var nm2 = String(a.nome||"").trim(); if(!nm2 || !a.grupoId) return recusa("Escolha a pessoa e o grupo."); var id2 = a.id || slug(nm2); if(rh.negoc.pessoas.some(function(x){ return x.id===id2; })) return recusa("Esta pessoa já tem negociação.");
      rh.negoc.pessoas.push({id:id2, nome:nm2, grupoId:a.grupoId, h1:null, h2:null, h3:null, sab:null, maxDia:null, vezesSem:null, sabMes:null, obs:""}); return ok(nm2+" incluída"); }
    case "neg_pessoa_del": { rh.negoc = rh.negoc || negocPadrao(); rh.negoc.pessoas = rh.negoc.pessoas.filter(function(x){ return x.id!==a.id; }); return ok("Negociação removida"); }
    // configurador: listas simples (escalas, planos, tiposAdv, motivosAdv, tiposHE, feriados)
    case "cfg_add": { var li = cfg[a.lista]; if(!li) return recusa("Lista desconhecida."); li.push(Object.assign({id:novoId(a.lista.slice(0,2)+"-")}, a.item)); return ok("Adicionado"); }
    case "cfg_set": { var l2 = cfg[a.lista]; var it = l2 && l2.find(function(x){ return x.id===a.id; }); if(!it) return recusa("Item não encontrado."); Object.assign(it, a.patch); return ok(); }
    case "cfg_del": { var l3 = cfg[a.lista]; if(!l3) return recusa("Lista desconhecida.");
      var emUso = a.lista==="escalas" ? (cfg.escalaPadrao===a.id || Object.keys(rh.colab).some(function(k){ return rh.colab[k].escalaId===a.id; }))
        : a.lista==="tiposAdv" ? rh.adv.some(function(x){ return x.tipoId===a.id; }) : a.lista==="motivosAdv" ? rh.adv.some(function(x){ return x.motivoId===a.id; })
        : a.lista==="tiposHE" ? rh.horas.some(function(x){ return x.tipoId===a.id; }) : a.lista==="planos" ? Object.keys(rh.colab).some(function(k){ return rh.colab[k].planoId===a.id; }) : false;
      if(emUso) return recusa("Está em uso: não dá para excluir."); cfg[a.lista] = l3.filter(function(x){ return x.id!==a.id; }); return ok("Excluído"); }
    case "cfg_geral": { Object.assign(cfg, a.patch); return ok(); }
  }
  return recusa("Ação desconhecida.");
}

// horário de cada pessoa para o SorellyChat (19/10/2026): a entrada vem da planilha; a saída é a jornada CLT de 44h por semana + 1h de almoço (seg-sex 8h48, seg-sáb 7h20). O RH/Direção ajusta no chat se for diferente.
var ALIAS_CHAT = {"sthefany marques de aquino correa":"Sthafany Marques de Aquino Correa"};
function horariosParaChat(){
  var fmt = function(m){ return p2(Math.floor(m/60))+":"+p2(m%60); };
  return LOCAIS.filter(function(x){ return !x.deslig && x.status!=="DESLIGADO" && minutosDe(x.entrada)!==null; }).map(function(x){
    var ini = minutosDe(x.entrada), sab = x.escala==="e2", nome = titulo(x.nome);
    return {nome:ALIAS_CHAT[nome.toLowerCase()]||nome, ini:x.entrada, fim:fmt(ini+(sab ? 8*60+20 : 9*60+48)), dias:sab ? [1,2,3,4,5,6] : [1,2,3,4,5]};
  });
}

export { negocPadrao, negocEfetiva, horariosParaChat, STATUS_BY_TIPO, STATUS_LB, TIPOS_CONTRATO, CODIGOS, AUSENTES, STATUS, TIPOS_DESLIG, DIAS_SEMANA, MESES, hojeIso, isoDe, br, diasEntre, somaDias, diaSem, ultimoDia, dataIso, slug, formatHoras, parseHoras, valorHoraExtra, rhDemo,
  colaboradoresRh, rotuloCnpj, presencaDe, diaEscalado, feriadoNoDia, statsEscopo, porEmpresaStats, desligadosDoPeriodo, relatorioDiario, formatarRelatorio,
  advertenciasComSeq, resumoAdvertencias, flagAdv, experienciaLista, rhReduz };
