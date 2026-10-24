import { globLocal } from "@/lib/glob-local";
import { leadsDemo, leadsHistorico, CAMPANHAS_DEMO } from "@/apps/montagem/domain/cadastro-leads-demo";
// Sorelly Admin · montagem — domain/cadastro-leads.js
// Aprovação de cadastros, trazida do SorellyAdmin (docs/modulos/aprovacao-cadastros.md): fila de candidatas a revendedora, aprovar (escolhendo como recebe o kit) ou reprovar,
// métricas das decisões, funil "Desempenho", campanhas de anúncio, origem por tag e histórico (Registros).
// Estado s.cl (só neste navegador). A Kommo e a Meta NÃO estão ligadas: o lead entra na fila por lançamento manual (op "lead_add") e as campanhas são digitadas (op "campanha_add").
// Nasce VAZIO (repositório é público). Dados reais, se existirem, vêm só de domain/cadastro-leads.local.js (gitignored): export default {leads:[...], campanhas:[...]}.
// Datas em ISO no fuso America/Sao_Paulo ("2026-10-16" ou "2026-10-16T14:30:00"), sem depender de UTC.

var LOCAL = (function(){ try { var m = globLocal("apps/montagem/domain/cadastro-leads.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();

var r1 = function(n){ return Math.round((n||0)*10)/10; };
var r2 = function(n){ return Math.round((n||0)*100)/100; };
var p2 = function(n){ return String(n).padStart(2,"0"); };
var num = function(v){ var n = Number(v); return isFinite(n) ? n : 0; };
var pct = function(a, b){ return b<=0 ? 0 : Math.round(a/b*1000)/10; };
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };

// ---------- datas (São Paulo) ----------
var FMT_SP = typeof Intl!=="undefined" ? new Intl.DateTimeFormat("en-CA", {timeZone:"America/Sao_Paulo", year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit", hourCycle:"h23"}) : null;
function partesSP(d){ var o = {}; FMT_SP.formatToParts(d||new Date()).forEach(function(p){ o[p.type] = p.value; }); return o; }
// dia de hoje em São Paulo ("2026-10-16")
function hojeSP(){ if(!FMT_SP){ var d = new Date(); return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate()); } var o = partesSP(); return o.year+"-"+o.month+"-"+o.day; }
// data e hora de agora em São Paulo ("2026-10-16T14:30:05")
function agoraSP(){ if(!FMT_SP){ var d = new Date(); return hojeSP()+"T"+p2(d.getHours())+":"+p2(d.getMinutes())+":"+p2(d.getSeconds()); } var o = partesSP(); return o.year+"-"+o.month+"-"+o.day+"T"+o.hour+":"+o.minute+":"+o.second; }
var diaDe = function(iso){ return iso ? String(iso).slice(0,10) : ""; };
var utcDe = function(dia){ var a = dia.split("-").map(Number); return Date.UTC(a[0], a[1]-1, a[2]); };
function somaDias(dia, n){ var d = new Date(utcDe(dia)+n*86400000); return d.getUTCFullYear()+"-"+p2(d.getUTCMonth()+1)+"-"+p2(d.getUTCDate()); }
function diasEntre(de, ate){ return Math.round((utcDe(ate)-utcDe(de))/86400000); }
function ultimoDiaDoMes(mes){ var a = mes.split("-").map(Number); return mes+"-"+p2(new Date(Date.UTC(a[0], a[1], 0)).getUTCDate()); }
function listaDias(de, ate){ var out = [], c = de, n = 0; while(c<=ate && n<4000){ out.push(c); c = somaDias(c, 1); n++; } return out; }
// janela de análise. p = {mes:"2026-10"} | {from,to} | {dias:N} (0 = tudo) | vazio (= mês corrente). Devolve {from,to,tudo} (tudo = sem limite de início)
function janela(p, hoje){
  p = p||{}; var h = hoje||hojeSP();
  if(p.from && p.to){ var a = diaDe(p.from), b = diaDe(p.to); return a<=b ? {from:a, to:b, tudo:false} : {from:b, to:a, tudo:false}; }
  if(p.mes){ var fim = ultimoDiaDoMes(p.mes); return {from:p.mes+"-01", to:(h>=p.mes+"-01" && h<fim) ? h : fim, tudo:false}; }
  if(p.dias===0) return {from:null, to:h, tudo:true};
  if(p.dias>0) return {from:somaDias(h, -(p.dias-1)), to:h, tudo:false};
  return {from:h.slice(0,7)+"-01", to:h, tudo:false};
}
var dentro = function(dia, j){ return !!dia && (j.tudo || dia>=j.from) && dia<=j.to; };

// ---------- estado ----------
var ETAPAS_FUNIL = [
  {slug:"contato-inicial", nome:"Contato inicial", curto:"Contato"},
  {slug:"responderam", nome:"Responderam", curto:"Responderam"},
  {slug:"iniciou-cadastro", nome:"Começaram o cadastro", curto:"Começaram"},
  {slug:"enviou-dados", nome:"Enviaram os dados", curto:"Dados ok"},
  {slug:"iniciou-análise", nome:"Em análise", curto:"Análise"},
  {slug:"aprovada", nome:"Aprovadas", curto:"Aprovadas"},
  {slug:"cadastradas", nome:"Cadastradas", curto:"Cadastradas"}];
var SAIDAS_FUNIL = [{slug:"nao-respondem", nome:"Não respondem", curto:"Sem resp."}, {slug:"reprovadas", nome:"Reprovadas", curto:"Reprovadas"}];
var NOME_ETAPA = {cliques:{nome:"Cliques no link da campanha", curto:"Cliques link"}};
ETAPAS_FUNIL.concat(SAIDAS_FUNIL).forEach(function(e){ NOME_ETAPA[e.slug] = {nome:e.nome, curto:e.curto}; });
var CONFIG_PADRAO = {kitCasaPadrao:5000, kitEmpresaPadrao:8000, tagsFacebook:"FACEBOOK ADS"};

// estado inicial: vazio (ou o arquivo local gitignored)
function clDemo(){
  var s = {v:1, leads:[], campanhas:[], etapasFunil:clone(ETAPAS_FUNIL), saidasFunil:clone(SAIDAS_FUNIL), config:Object.assign({}, CONFIG_PADRAO), seq:0};
  if(LOCAL){ (LOCAL.leads||[]).forEach(function(l){ s.leads.push(novoLead(s, l, true)); }); (LOCAL.campanhas||[]).forEach(function(c){ s.campanhas.push(novaCampanha(s, c)); }); }
  return clSemear(s);
}
// 20 candidatas de demonstração na fila (23/10/2026), uma vez só (flag demo20): serve para testar Cadastro → Kits novos. Estado antigo também recebe.
function clSemear(s){
  if(!s || (s.demo20 && s.demo50)) return s;
  var out = clone(s); out.leads = (out.leads||[]).slice(); out.campanhas = (out.campanhas||[]).slice(); out.seq = out.seq||0;
  if(!out.demo20){ out.demo20 = 1; leadsDemo(hojeSP(), somaDias).forEach(function(d){ out.leads.push(novoLead(out, Object.assign({}, d, {id:undefined}))); }); }
  if(!out.demo50){ out.demo50 = 1;   // mais 30 candidatas com histórico (funil, origem, decisões) e 3 campanhas, para analisar o Desempenho do cadastro
    var cfg = out.config || CONFIG_PADRAO;
    leadsHistorico(hojeSP(), somaDias, {casa:cfg.kitCasaPadrao, empresa:cfg.kitEmpresaPadrao}).forEach(function(d){ out.leads.push(novoLead(out, Object.assign({}, d, {id:undefined}))); });
    CAMPANHAS_DEMO.forEach(function(k){ out.campanhas.push(novaCampanha(out, k)); }); }
  return out;
}

// ---------- kit (portado de lib/cadastro/kit-opcao.ts) ----------
var KIT_OPCOES = [{valor:"kit_normal", rotulo:"Kit normal"}, {valor:"kit_normal_expositor", rotulo:"Kit normal + expositor"}, {valor:"vir_empresa", rotulo:"Vir na empresa"}, {valor:"vir_empresa_expositor", rotulo:"Vir na empresa + expositor"}];
function rotuloKit(opcao){ var o = KIT_OPCOES.find(function(x){ return x.valor===opcao; }); return o ? o.rotulo : ""; }
function kitNaEmpresa(opcao){ return opcao==="vir_empresa" || opcao==="vir_empresa_expositor"; }
// valor que vale para o jeito escolhido (em casa ou na empresa)
function valorDoKit(opcao, valorCasa, valorEmpresa){ return kitNaEmpresa(opcao) ? valorEmpresa : valorCasa; }
// "R$ 5.000" (sem centavos quando redondo)
function formatarValorKit(v){ var red = Math.floor(v)===v; return "R$ "+Number(v).toLocaleString("pt-BR", {minimumFractionDigits:red?0:2, maximumFractionDigits:2}); }
// mensagem de WhatsApp para a revendedora aprovada (negrito com *). A opção escolhida não muda o texto (igual ao original).
function mensagemKit(opcao, valorCasa, valorEmpresa){
  return ["✅ *Seu cadastro foi concluído!* 💎", "", "Agora você tem *2 jeitos* de receber o seu kit 👇", "", "🏠 *EM CASA*",
    "Kit inicial de até *"+formatarValorKit(valorCasa)+"*, *montado pela nossa equipe* e entregue pra você.", "", "🏢 *NA EMPRESA*",
    "Kit de até *"+formatarValorKit(valorEmpresa)+"*, e aqui *você escolhe as suas peças* ✨", "", "Qual dos dois combina mais com você? 😊"].join("\n");
}

// ---------- leads ----------
var idTag = function(nome){ return "t_"+String(nome).trim().toLowerCase().replace(/\s+/g, "-"); };
// tags podem vir como "FACEBOOK ADS" ou {name, color}
function normTags(ts){ var vistos = {}; return (ts||[]).map(function(t){ var nome = String(typeof t==="string" ? t : (t&&t.name)||"").trim(); if(!nome) return null; return {id:(t&&t.id)||idTag(nome), name:nome, color:(t&&t.color)||null}; })
  .filter(function(t){ if(!t || vistos[t.name.toLowerCase()]) return false; vistos[t.name.toLowerCase()] = 1; return true; }); }
function novoLead(s, d, doArquivo){
  var id = d.id!=null ? d.id : (++s.seq); if(typeof id==="number" && id>s.seq) s.seq = id;
  return {id:id, nome:String(d.nome||"").trim(), cidade:d.cidade||"", endereco:d.endereco||"", cep:d.cep||"", profissao:d.profissao||"", empresa:d.empresa||"", observacoes:d.observacoes||"", telefone:d.telefone||"",
    tags:normTags(d.tags), desempenho:d.desempenho||"iniciou-análise", etapaCriadaEm:d.etapaCriadaEm||"", criadoEm:d.criadoEm||hojeSP(), entrouNaFilaEm:d.entrouNaFilaEm||agoraSP(),
    fotos:(d.fotos||[]).map(function(f){ return {campo:f.campo||"", rotulo:f.rotulo||"", url:f.url||""}; }), indicadora:d.indicadora||null,
    reviewStatus:d.reviewStatus||"PENDING", reviewedAt:d.reviewedAt||null, reviewedBy:d.reviewedBy||null, reviewNote:d.reviewNote||"",
    kitOpcao:d.kitOpcao||null, kitValorCasa:d.kitValorCasa!=null?d.kitValorCasa:null, kitValorEmpresa:d.kitValorEmpresa!=null?d.kitValorEmpresa:null};
}
var CAMPOS_LEAD = ["nome","cidade","endereco","cep","profissao","empresa","observacoes","telefone","desempenho","criadoEm","etapaCriadaEm","indicadora"];
var leadDe = function(s, id){ return s.leads.find(function(l){ return String(l.id)===String(id); }); };
var revisado = function(l){ return l.reviewStatus==="APPROVED" || l.reviewStatus==="REJECTED"; };

// fila de aprovação: pendentes, mais antigo primeiro (entrou na fila, depois id)
function fila(s){ return s.leads.filter(function(l){ return l.reviewStatus==="PENDING"; }).sort(function(a, b){ return (a.entrouNaFilaEm||"").localeCompare(b.entrouNaFilaEm||"") || (Number(a.id)-Number(b.id) || 0); }); }
// "Pular" (só na sessão da tela): move o id para o fim dos adiados, e aplica essa ordem na lista
function adiar(adiados, id){ return (adiados||[]).filter(function(x){ return x!==id; }).concat([id]); }
function filaComAdiados(lista, adiados){
  if(!adiados || !adiados.length) return lista;
  var set = {}; adiados.forEach(function(i){ set[i] = 1; }); var resto = lista.filter(function(l){ return !set[l.id]; });
  var adi = []; adiados.forEach(function(i){ var l = lista.find(function(x){ return x.id===i; }); if(l) adi.push(l); }); return resto.concat(adi);
}
// tudo que as telas precisam do "hoje" da fila: pendentes e decisões do dia
function resumoDia(s, dia){
  var d = dia||hojeSP(), ap = 0, rp = 0, pend = 0;
  s.leads.forEach(function(l){ if(l.reviewStatus==="PENDING") pend++; else if(diaDe(l.reviewedAt)===d){ if(l.reviewStatus==="APPROVED") ap++; else if(l.reviewStatus==="REJECTED") rp++; } });
  return {dia:d, aprovados:ap, reprovados:rp, decisoes:ap+rp, pendentes:pend};
}
// tags que existem nos leads (para o filtro da Origem), com a cor e quantos leads têm
function tagsDisponiveis(s){ var m = {}; s.leads.forEach(function(l){ l.tags.forEach(function(t){ var o = m[t.name] = m[t.name]||{name:t.name, color:t.color, qtd:0}; o.qtd++; if(!o.color && t.color) o.color = t.color; }); }); return Object.keys(m).map(function(k){ return m[k]; }).sort(function(a, b){ return b.qtd-a.qtd || a.name.localeCompare(b.name); }); }

// ---------- métricas das decisões ----------
// p = {mes} | {from,to} | {dias} | vazio (mês corrente). Conta pela data da decisão (reviewedAt).
function metricas(s, p, hoje){
  var h = hoje||hojeSP(), j = janela(p, h), ap = 0, rp = 0, porDia = {}, menor = h;
  s.leads.forEach(function(l){ if(!revisado(l)) return; var d = diaDe(l.reviewedAt); if(!dentro(d, j)) return; if(d<menor) menor = d; var b = porDia[d] = porDia[d]||{aprovados:0, rejeitados:0}; if(l.reviewStatus==="APPROVED"){ ap++; b.aprovados++; } else { rp++; b.rejeitados++; } });
  var de = j.tudo ? (Object.keys(porDia).length ? menor : h) : j.from, serie = listaDias(de, j.to).map(function(d){ var b = porDia[d]||{aprovados:0, rejeitados:0}; return {data:d, aprovados:b.aprovados, reprovados:b.rejeitados}; });
  var hoje2 = resumoDia(s, h);
  return {periodo:{from:de, to:j.to, tudo:j.tudo}, kpis:{aprovados:ap, reprovados:rp, decididos:ap+rp, taxaAprovacao:pct(ap, ap+rp), pendentes:hoje2.pendentes, aprovadosHoje:hoje2.aprovados, reprovadosHoje:hoje2.reprovados, decisoesHoje:hoje2.decisoes}, serie:serie};
}

// ---------- origem por tag ----------
// tagsFiltro: lista de nomes de tag (vazio = todas). Lead com várias tags conta em CADA tag; sem tag = "Sem origem". Os KPIs acompanham o filtro (como na tela original).
function origemPorTag(s, p, tagsFiltro, hoje){
  var j = janela(p, hoje), b = {}, filtro = (tagsFiltro||[]).map(function(t){ return String(t).toLowerCase(); });
  s.leads.forEach(function(l){ if(!revisado(l) || !dentro(diaDe(l.reviewedAt), j)) return; var ok = l.reviewStatus==="APPROVED", orig = l.tags.length ? l.tags : [{id:null, name:"Sem origem", color:null}];
    orig.forEach(function(t){ var k = t.id==null ? "__sem_origem__" : t.name.toLowerCase(); var o = b[k] = b[k]||{tagId:t.id, nome:t.name, cor:t.color||null, aprovados:0, reprovados:0}; if(ok) o.aprovados++; else o.reprovados++; if(!o.cor && t.color) o.cor = t.color; }); });
  var linhas = Object.keys(b).map(function(k){ var o = b[k], v = o.aprovados+o.reprovados; return {tagId:o.tagId, nome:o.nome, cor:o.cor, aprovados:o.aprovados, reprovados:o.reprovados, volume:v, taxaAprovacao:pct(o.aprovados, v)}; })
    .sort(function(a, c){ return c.volume-a.volume || a.nome.localeCompare(c.nome); });
  var vis = filtro.length ? linhas.filter(function(o){ return filtro.indexOf(o.nome.toLowerCase())>=0; }) : linhas;
  var ap = vis.reduce(function(t, o){ return t+o.aprovados; }, 0), tot = vis.reduce(function(t, o){ return t+o.volume; }, 0), topo = vis[0]||null;
  return {periodo:{from:j.from, to:j.to, tudo:j.tudo}, kpis:{decididos:tot, origens:vis.length, taxaAprovacao:pct(ap, tot), topOrigem:topo?topo.nome:null, topVolume:topo?topo.volume:0}, origens:vis, todasOrigens:linhas};
}

// ---------- funil Desempenho ----------
// leads (todos, não só os revisados) criados na janela e com o valor atual do campo Desempenho. soFacebook = só leads com a tag de anúncio.
function estoqueDesempenho(s, j, soFacebook){
  var est = {}, total = 0, tagFb = String(s.config.tagsFacebook||"").trim().toLowerCase();
  s.leads.forEach(function(l){ if(!l.desempenho) return; if(!dentro(diaDe(l.criadoEm), j)) return; if(soFacebook && !l.tags.some(function(t){ return t.name.trim().toLowerCase()===tagFb; })) return; est[l.desempenho] = (est[l.desempenho]||0)+1; total++; });
  return {estoque:est, total:total};
}
// acumulado do contato até o cadastro (mesma conta do original: "não respondem" soma no contato; "reprovadas" soma do contato até a análise)
function montaFunil(s, estoque, totalComDesempenho){
  var etapas = s.etapasFunil||ETAPAS_FUNIL, saidas = s.saidasFunil||SAIDAS_FUNIL, st = function(sl){ return estoque[sl]||0; };
  var cum = new Array(etapas.length).fill(0), run = 0, i;
  for(i=etapas.length-1; i>=0; i--){ run += st(etapas[i].slug); cum[i] = run; }
  var nao = st("nao-respondem"), rep = st("reprovadas"); if(cum.length) cum[0] += nao;
  var ia = etapas.findIndex(function(e){ return e.slug==="iniciou-análise"; }); if(ia>=0 && rep>0) for(i=0; i<=ia; i++) cum[i] += rep;
  var ini = cum[0]||0;
  var stages = etapas.map(function(e, k){ return {slug:e.slug, nome:e.nome, curto:e.curto, count:st(e.slug), cumulative:cum[k], ofStartPct:pct(cum[k], ini), fromPrevPct:k===0 ? 100 : pct(cum[k], cum[k-1])}; });
  var exits = saidas.map(function(e){ return {slug:e.slug, nome:e.nome, curto:e.curto, count:st(e.slug)}; });
  var cad = st("cadastradas");
  return {kpis:{totalPeriodo:totalComDesempenho, cadastradas:cad, conversao:pct(cad, ini), reprovadas:rep, naoRespondem:nao}, stages:stages, exits:exits};
}
// "Maior queda: Dados ok para Análise, -42%" (maior queda percentual entre etapas seguidas)
function maiorQueda(stages){
  if(!stages || stages.length<2) return null; var pior = null;
  for(var i=1; i<stages.length; i++){ var a = stages[i-1], b = stages[i]; if(a.cumulative<=0) continue; var q = (a.cumulative-b.cumulative)/a.cumulative*100; if(q<=0) continue; if(!pior || q>pior.q) pior = {de:(NOME_ETAPA[a.slug]||{curto:a.slug}).curto, para:(NOME_ETAPA[b.slug]||{curto:b.slug}).curto, q:q}; }
  if(!pior) return null;
  return "Maior queda: "+pior.de+" para "+pior.para+", "+new Intl.NumberFormat("pt-BR", {minimumFractionDigits:0, maximumFractionDigits:0}).format(-pior.q)+"%";
}
function funilDesempenho(s, p, hoje){
  var j = janela(p, hoje), e = estoqueDesempenho(s, j, false), f = montaFunil(s, e.estoque, e.total);
  return {periodo:{from:j.from, to:j.to, tudo:j.tudo}, kpis:f.kpis, stages:f.stages, exits:f.exits, insight:maiorQueda(f.stages), contatos:f.stages.length?f.stages[0].cumulative:0, emAnalise:(f.stages.find(function(x){ return x.slug==="iniciou-análise"; })||{cumulative:0}).cumulative, saidas:f.kpis.reprovadas+f.kpis.naoRespondem};
}

// ---------- campanhas ----------
var campanhaIgnorada = function(nome){ var n = String(nome||"").toLowerCase(); return n.indexOf("consultoras")===0 || n.indexOf("seguidores")===0; };
function montaLinhaCamp(o){ var g = r2(num(o.gasto)), im = Math.round(num(o.impressoes)), cl = Math.round(num(o.cliques)); return {id:o.id, nome:o.nome, gasto:g, impressoes:im, cliques:cl, cpc:r2(cl>0 ? g/cl : 0), ctr:r1(im>0 ? cl/im*100 : 0)}; }
// funil das campanhas: "Cliques" no início, depois o Desempenho só dos leads da tag de anúncio, com o gasto diluído (custo por pessoa em cada etapa). "Cadastradas" só com janela de 7 dias ou mais
function funilCampanhas(s, j, gasto, cliques, mostrarCad){
  var e = estoqueDesempenho(s, j, true), base = montaFunil(s, e.estoque, e.total), custo = function(n){ return n>0 ? r2(gasto/n) : null; };
  var kom = base.stages.filter(function(x){ return mostrarCad || x.slug!=="cadastradas"; }), cl = Math.max(0, Math.round(cliques)), inicio = cl>0 ? cl : (kom[0] ? kom[0].cumulative : 0);
  var etCliques = {slug:"cliques", nome:NOME_ETAPA.cliques.nome, curto:NOME_ETAPA.cliques.curto, count:cl, cumulative:cl, ofStartPct:100, fromPrevPct:100, cost:custo(cl), costCumulative:custo(cl)};
  var stages = [etCliques].concat(kom.map(function(x, k){ var prev = k===0 ? cl : kom[k-1].cumulative;
    return Object.assign({}, x, {cost:custo(x.count), costCumulative:custo(x.cumulative), ofStartPct:pct(x.cumulative, inicio), fromPrevPct:k===0 && cl>0 ? pct(x.cumulative, cl) : (k===0 ? 100 : pct(x.cumulative, prev))}); }));
  var iniConv = inicio>0 ? inicio : (base.stages[0] ? base.stages[0].cumulative : 0);
  return {kpis:Object.assign({}, base.kpis, {gasto:gasto, cliques:cl, mostrarCadastradas:mostrarCad, conversao:pct(base.kpis.cadastradas, iniConv)}), stages:stages, exits:base.exits.map(function(x){ return Object.assign({}, x, {cost:custo(x.count)}); }), insight:maiorQueda(stages)};
}
// p = {mes} | {from,to} | {dias} | vazio (mês corrente). Campanha entra se o mês dela encosta na janela.
function campanhas(s, p, hoje){
  var j = janela(p, hoje), mesDe = j.from ? j.from.slice(0,7) : "", mesAte = j.to.slice(0,7);
  var lista = s.campanhas.filter(function(c){ return !campanhaIgnorada(c.nome) && (j.tudo || (c.mes>=mesDe && c.mes<=mesAte)); })
    .map(function(c){ var l = montaLinhaCamp(c); l.mes = c.mes; l.anuncios = (c.anuncios||[]).map(montaLinhaCamp); return l; })
    .filter(function(c){ return c.gasto>0 || c.impressoes>0 || c.cliques>0; }).sort(function(a, b){ return b.gasto-a.gasto; });
  var g = r2(lista.reduce(function(t, c){ return t+c.gasto; }, 0)), im = lista.reduce(function(t, c){ return t+c.impressoes; }, 0), cl = lista.reduce(function(t, c){ return t+c.cliques; }, 0);
  var dias = j.tudo ? 9999 : diasEntre(j.from, j.to)+1, mostrarCad = j.tudo || dias>=7;
  return {periodo:{from:j.from, to:j.to, tudo:j.tudo}, kpis:{gasto:g, impressoes:im, cliques:cl, campanhasQtd:lista.length, cpc:r2(cl>0 ? g/cl : 0), ctr:r1(im>0 ? cl/im*100 : 0)}, campanhas:lista, funil:funilCampanhas(s, j, g, cl, mostrarCad)};
}
// anúncios de uma campanha (drill-down)
function anunciosDa(s, campanhaId){ var c = s.campanhas.find(function(x){ return x.id===campanhaId; }); return c ? (c.anuncios||[]).map(montaLinhaCamp).sort(function(a, b){ return b.gasto-a.gasto; }) : []; }
function novaCampanha(s, d){
  var an = (d.anuncios||[]).map(function(x){ return {id:x.id||("a"+(++s.seq)), nome:String(x.nome||"Anúncio").trim(), gasto:r2(num(x.gasto)), impressoes:Math.round(num(x.impressoes)), cliques:Math.round(num(x.cliques))}; });
  return {id:d.id||("c"+(++s.seq)), nome:String(d.nome||"").trim(), mes:d.mes||hojeSP().slice(0,7), gasto:r2(num(d.gasto)), impressoes:Math.round(num(d.impressoes)), cliques:Math.round(num(d.cliques)), anuncios:an};
}

// ---------- registros (histórico das decisões) ----------
// {q, from, to, page, limit}: leads já revisados, mais recente primeiro; busca por nome, empresa, cidade, telefone ou número; período pela data da decisão
function registros(s, o, hoje){
  o = o||{}; var q = String(o.q||"").trim().toLowerCase(), de = o.from ? diaDe(o.from) : null, ate = o.to ? diaDe(o.to) : null, limite = Math.min(100, Math.max(1, o.limit||20)), pagina = Math.max(1, o.page||1);
  var todos = s.leads.filter(function(l){
    if(!revisado(l)) return false; var d = diaDe(l.reviewedAt); if(de && d<de) return false; if(ate && d>ate) return false;
    if(q && [l.nome, l.empresa, l.cidade, l.telefone, String(l.id)].every(function(t){ return String(t||"").toLowerCase().indexOf(q)<0; })) return false; return true; })
    .sort(function(a, b){ return (b.reviewedAt||"").localeCompare(a.reviewedAt||"") || (Number(b.id)-Number(a.id) || 0); });
  var d0 = resumoDia(s, hoje);
  return {itens:todos.slice((pagina-1)*limite, pagina*limite), meta:{page:pagina, limit:limite, total:todos.length, paginas:Math.max(1, Math.ceil(todos.length/limite)), pendentes:d0.pendentes, aprovadosHoje:d0.aprovados, reprovadosHoje:d0.reprovados}};
}

// ---------- ações ----------
// devolve {patch, msg}; patch vazio + msg = recusado. a.por = quem decidiu; a.agora (opcional, ISO) só para testes
function clReduz(s, a){
  var cl = clone(s.cl), por = a.por||"—", agora = a.agora||agoraSP(), recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg){ return {patch:{cl:cl}, msg:msg}; };
  var lead = function(){ return leadDe(cl, a.id); }, camp = function(id){ return cl.campanhas.find(function(c){ return c.id===(id!=null ? id : a.id); }); };
  var numOpc = function(v){ return v===undefined || v===null || v==="" ? undefined : num(v); };
  switch(a.op){
    case "lead_add": { var nm = String(a.nome||"").trim(); if(!nm) return recusa("Informe o nome."); var l = novoLead(cl, Object.assign({}, a, {nome:nm, id:undefined, reviewStatus:"PENDING", reviewedAt:null, reviewedBy:null, reviewNote:"", kitOpcao:null, kitValorCasa:null, kitValorEmpresa:null, entrouNaFilaEm:agora})); cl.leads.push(l); return ok(nm+" entrou na fila."); }
    case "lead_set": { var l1 = lead(); if(!l1) return recusa("Cadastro não encontrado."); CAMPOS_LEAD.forEach(function(k){ if(a[k]!==undefined) l1[k] = a[k]; }); if(a.tags!==undefined) l1.tags = normTags(a.tags); if(a.fotos!==undefined) l1.fotos = a.fotos; if(!String(l1.nome||"").trim()) return recusa("Informe o nome."); return ok("Cadastro atualizado."); }
    case "lead_del": { var l2 = lead(); if(!l2) return recusa("Cadastro não encontrado."); cl.leads = cl.leads.filter(function(x){ return x!==l2 && String(x.id)!==String(a.id); }); return ok("Cadastro removido."); }
    case "aprovar": {
      var l3 = lead(); if(!l3) return recusa("Cadastro não encontrado."); if(l3.reviewStatus!=="PENDING") return recusa("Esse cadastro já foi decidido.");
      if(!KIT_OPCOES.some(function(x){ return x.valor===a.opcao; })) return recusa("Escolha como ela recebe o kit.");
      var vc = numOpc(a.valorCasa), ve = numOpc(a.valorEmpresa); vc = vc===undefined ? cl.config.kitCasaPadrao : vc; ve = ve===undefined ? cl.config.kitEmpresaPadrao : ve;
      if(vc<0 || ve<0) return recusa("Os valores do kit não podem ser negativos.");
      l3.reviewStatus = "APPROVED"; l3.reviewedAt = agora; l3.reviewedBy = por; l3.reviewNote = a.nota||""; l3.kitOpcao = a.opcao; l3.kitValorCasa = r2(vc); l3.kitValorEmpresa = r2(ve);
      if(l3.desempenho!=="cadastradas") l3.desempenho = "aprovada";   // sem a Kommo, o próprio sistema avança a etapa do funil
      return ok(l3.nome+" aprovada ("+rotuloKit(a.opcao)+").");
    }
    case "reprovar": {
      var l4 = lead(); if(!l4) return recusa("Cadastro não encontrado."); if(l4.reviewStatus!=="PENDING") return recusa("Esse cadastro já foi decidido.");
      l4.reviewStatus = "REJECTED"; l4.reviewedAt = agora; l4.reviewedBy = por; l4.reviewNote = a.nota||""; l4.kitOpcao = null; l4.kitValorCasa = null; l4.kitValorEmpresa = null; if(l4.desempenho!=="cadastradas") l4.desempenho = "reprovadas";
      return ok(l4.nome+" reprovada.");
    }
    case "desfazer": {
      var l5 = lead(); if(!l5) return recusa("Cadastro não encontrado."); if(!revisado(l5)) return recusa("Esse cadastro ainda não foi decidido.");
      l5.reviewStatus = "PENDING"; l5.reviewedAt = null; l5.reviewedBy = null; l5.reviewNote = ""; l5.kitOpcao = null; l5.kitValorCasa = null; l5.kitValorEmpresa = null; if(l5.desempenho==="aprovada" || l5.desempenho==="reprovadas") l5.desempenho = "iniciou-análise";
      return ok("Decisão desfeita: "+l5.nome+" voltou para a fila.");
    }
    case "campanha_add": { var nc = String(a.nome||"").trim(); if(!nc) return recusa("Informe o nome da campanha."); cl.campanhas.push(novaCampanha(cl, Object.assign({}, a, {nome:nc, id:undefined}))); return ok("Campanha adicionada."); }
    case "campanha_set": { var c1 = camp(); if(!c1) return recusa("Campanha não encontrada."); if(a.nome!==undefined){ if(!String(a.nome).trim()) return recusa("Informe o nome da campanha."); c1.nome = String(a.nome).trim(); } if(a.mes!==undefined) c1.mes = a.mes;
      if(a.gasto!==undefined) c1.gasto = r2(num(a.gasto)); if(a.impressoes!==undefined) c1.impressoes = Math.round(num(a.impressoes)); if(a.cliques!==undefined) c1.cliques = Math.round(num(a.cliques)); return ok("Campanha atualizada."); }
    case "campanha_del": { if(!camp()) return recusa("Campanha não encontrada."); cl.campanhas = cl.campanhas.filter(function(c){ return c.id!==a.id; }); return ok("Campanha removida."); }
    case "anuncio_add": { var c2 = camp(a.campanhaId); if(!c2) return recusa("Campanha não encontrada."); var na = String(a.nome||"").trim(); if(!na) return recusa("Informe o nome do anúncio.");
      c2.anuncios = c2.anuncios||[]; c2.anuncios.push({id:"a"+(++cl.seq), nome:na, gasto:r2(num(a.gasto)), impressoes:Math.round(num(a.impressoes)), cliques:Math.round(num(a.cliques))}); return ok("Anúncio adicionado."); }
    case "anuncio_set": { var c3 = camp(a.campanhaId); if(!c3) return recusa("Campanha não encontrada."); var an = (c3.anuncios||[]).find(function(x){ return x.id===a.id; }); if(!an) return recusa("Anúncio não encontrado.");
      if(a.nome!==undefined){ if(!String(a.nome).trim()) return recusa("Informe o nome do anúncio."); an.nome = String(a.nome).trim(); } if(a.gasto!==undefined) an.gasto = r2(num(a.gasto)); if(a.impressoes!==undefined) an.impressoes = Math.round(num(a.impressoes)); if(a.cliques!==undefined) an.cliques = Math.round(num(a.cliques)); return ok("Anúncio atualizado."); }
    case "anuncio_del": { var c4 = camp(a.campanhaId); if(!c4) return recusa("Campanha não encontrada."); if(!(c4.anuncios||[]).some(function(x){ return x.id===a.id; })) return recusa("Anúncio não encontrado."); c4.anuncios = c4.anuncios.filter(function(x){ return x.id!==a.id; }); return ok("Anúncio removido."); }
    case "config_set": {
      var kc = numOpc(a.kitCasaPadrao), ke = numOpc(a.kitEmpresaPadrao); if((kc!==undefined && kc<0) || (ke!==undefined && ke<0)) return recusa("Os valores do kit não podem ser negativos.");
      if(kc!==undefined) cl.config.kitCasaPadrao = r2(kc); if(ke!==undefined) cl.config.kitEmpresaPadrao = r2(ke);
      if(a.tagsFacebook!==undefined){ var tf = String(a.tagsFacebook).trim(); if(!tf) return recusa("Informe a tag dos anúncios."); cl.config.tagsFacebook = tf; }
      return ok("Configuração salva.");
    }
    default: return recusa("Ação desconhecida.");
  }
}

export { clDemo, clSemear, clReduz, hojeSP, agoraSP, somaDias, diasEntre, ultimoDiaDoMes, listaDias, janela,
  KIT_OPCOES, rotuloKit, kitNaEmpresa, valorDoKit, formatarValorKit, mensagemKit,
  ETAPAS_FUNIL, SAIDAS_FUNIL, CONFIG_PADRAO,
  fila, adiar, filaComAdiados, resumoDia, tagsDisponiveis, metricas, origemPorTag, funilDesempenho, maiorQueda, campanhas, anunciosDa, registros };
