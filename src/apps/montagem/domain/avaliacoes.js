// Sorelly Admin · montagem — domain/avaliacoes.js
// Área Avaliações, trazida do SorellyAdmin (docs/modulos/avaliacoes.md). Quatro frentes:
//  1) representantes avaliadas pelas REVENDEDORAS (perguntas configuráveis, com peso; as respostas vêm do app da revendedora, que NÃO está ligado: entram à mão);
//  2) representantes avaliadas pelo SISTEMA (nota calculada): só LÊ resumoRep de domain/representantes.js, sem duplicar a regra;
//  3) montagem de kits: erros de bipagem / divergências, só LÊ s.errosBipagem (conferência da representante);
//  4) FUNCIONÁRIOS avaliados pelos supervisores do setor (critérios com peso, nota por mês, comentário). Cada supervisor só avalia e vê o seu setor.
// Estado s.av (só neste navegador). Nasce VAZIO (repositório é público). Dados reais, se existirem, só em domain/avaliacoes.local.js (gitignored):
//   export default {perguntas:[], avaliacoes:[], supervisores:{}, func:{criterios:[], avaliacoes:[]}}
// Datas ISO no fuso America/Sao_Paulo ("2026-10-16" ou "2026-10-16T14:30:00"): o mês de cada avaliação vem do texto da data, nunca de UTC.
// Notas: estrela 1 a 5, nota 0 a 10; a "média geral" converte tudo para 0 a 5 e pondera pelo peso da pergunta (peso 1 em todas = média simples do original).

import { hojeSP, agoraSP, somaDias, listaDias } from "./cadastro-leads";
import { resumoRep } from "./representantes";

var LOCAL = (function(){ try { var m = import.meta.glob("./avaliacoes.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var p2 = function(n){ return String(n).padStart(2,"0"); };
var num = function(v){ var n = Number(v); return isFinite(n) ? n : 0; };
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var trim = function(v){ return String(v==null ? "" : v).trim(); };
var diaDe = function(iso){ return iso ? String(iso).slice(0,10) : ""; };
var ehDia = function(v){ return /^\d{4}-\d{2}-\d{2}$/.test(String(v||"")); };
var norm = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
var mesDe = function(iso){ return diaDe(iso).slice(0,7); };
var MESES_CURTOS = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

// ---------- tipos, categorias e limites ----------
var TIPOS = {
  estrela5:{rotulo:"Estrelas (1 a 5)", min:1, max:5, opcional:false},
  nota10:{rotulo:"Nota (0 a 10)", min:0, max:10, opcional:false},
  multipla:{rotulo:"Múltipla escolha", min:null, max:null, opcional:false, exigeOpcoes:true},
  texto:{rotulo:"Texto livre", min:null, max:null, opcional:true}   // texto livre é opcional; nota e escolha são obrigatórias
};
var CATEGORIAS = {representante:"Representante", kit:"Kit"};
var PERIODOS = [{k:"mes_atual", rotulo:"Mês atual"}, {k:"30d", rotulo:"30 dias"}, {k:"3m", rotulo:"3 meses"}, {k:"tudo", rotulo:"Tudo"}];
var TEXTO_MAX = 300, OPCAO_MAX = 120, TEXTO_LIVRE_MAX = 2000, MIN_OPCOES = 2;

// valores que mandam em tudo; mudam em avaliações → Configurador (cfg_set), nunca valor fixo dentro de tela
var CONFIG_PADRAO = {
  notaBoaPiso:4.5,       // nota boa: a partir daqui (escala 0 a 5); também é o corte do ranking "melhores" / "precisam de atenção"
  notaRuimTeto:4.0,      // nota ruim: abaixo daqui
  limiteRanking:5,       // quantas representantes em cada lista do ranking
  mesesEvolucao:7,       // colunas da tabela de evolução
  func:{escalaMax:5, comentarioMax:1000, notaBoa:4.5, notaRuim:3.5}   // avaliação de funcionários (escala 1 a escalaMax)
};
// perguntas que já existem na "Avaliação das representantes" (pontualidade, explicou direito, respondeu o WhatsApp); a diretoria edita
var PERGUNTAS_PADRAO = [
  {texto:"Pontualidade", tipo:"estrela5"}, {texto:"Explicou direito", tipo:"estrela5"}, {texto:"Respondeu o WhatsApp", tipo:"estrela5"}];
// critérios iniciais da avaliação de funcionários (suposição: o Marcus/RH ajustam)
var CRITERIOS_FUNC_PADRAO = [
  {nome:"Assiduidade e pontualidade", peso:1}, {nome:"Qualidade do trabalho", peso:2}, {nome:"Trabalho em equipe", peso:1}, {nome:"Iniciativa", peso:1}];

// ---------- formatação e rótulos ----------
function formatarNota(n){ return n==null ? "—" : Number(n).toFixed(1).replace(".", ","); }
function formatarMes(mes){ var m = /^(\d{4})-(\d{2})$/.exec(String(mes||"")); return m ? MESES_CURTOS[+m[2]-1]+"/"+m[1] : ""; }
function formatarDia(dia){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dia||"")); return m ? m[3]+"/"+m[2]+"/"+m[1] : ""; }
function rotuloTipo(t){ return TIPOS[t] ? TIPOS[t].rotulo : t; }
function rotuloCategoria(c){ return CATEGORIAS[c] || c; }
function escalaDoTipo(t){ return TIPOS[t] ? TIPOS[t].max : null; }
function tipoNumerico(t){ return !!(TIPOS[t] && TIPOS[t].max); }
// "bom" (verde) / "medio" (amarelo) / "ruim" (vermelho); media na escala da pergunta; sem dado → null
function tomDaNota(media, max, cfg){ cfg = cfg||CONFIG_PADRAO; if(media==null || !max) return null; var n = media/max*5; return n>=cfg.notaBoaPiso ? "bom" : n>=cfg.notaRuimTeto ? "medio" : "ruim"; }
function percentualDaNota(media, max){ return media==null || !max ? 0 : Math.max(0, Math.min(100, media/max*100)); }

// ---------- validação de perguntas e respostas (regras do original) ----------
function validarTextoPergunta(texto){ var t = trim(texto); if(!t) return "O texto da pergunta é obrigatório."; if(t.length>TEXTO_MAX) return "O texto deve ter no máximo "+TEXTO_MAX+" caracteres."; return null; }
// aparar, descartar vazias e repetidas (mantém a ordem)
function normalizarOpcoes(ops){ var vistas = {}, out = []; (ops||[]).forEach(function(o){ var l = trim(o); if(!l || vistas[l]) return; vistas[l] = true; out.push(l); }); return out; }
// opções que sumiriam: presentes nas atuais e ausentes das novas (renomear/remover corrompe o histórico; acrescentar e reordenar é livre)
function opcoesRemovidas(atuais, novas){ return (atuais||[]).filter(function(o){ return novas.indexOf(o)<0; }); }
function validarOpcoesParaTipo(tipo, opcoes){
  var t = TIPOS[tipo]; if(!t) return "Tipo de pergunta inválido.";
  if(t.exigeOpcoes){
    if(opcoes.length<MIN_OPCOES) return "Perguntas de múltipla escolha precisam de pelo menos "+MIN_OPCOES+" opções.";
    if(opcoes.some(function(o){ return o.length>OPCAO_MAX; })) return "Cada opção deve ter no máximo "+OPCAO_MAX+" caracteres.";
    return null;
  }
  return opcoes.length ? "Somente perguntas de múltipla escolha aceitam opções." : null;
}
// valor de uma resposta contra a pergunta: devolve o texto do erro ou null. v = {valorNumerico, valorTexto}
function validarResposta(p, v){
  var t = TIPOS[p.tipo], vn = v.valorNumerico, vt = v.valorTexto;
  if(t && t.max){
    if(vt!=null && vt!=="") return "Resposta numérica não aceita texto.";
    if(vn==null || vn==="") return "Resposta numérica ausente.";
    if(!Number.isInteger(Number(vn))) return "Resposta deve ser um número inteiro.";
    if(Number(vn)<t.min || Number(vn)>t.max) return "Resposta deve estar entre "+t.min+" e "+t.max+".";
    return null;
  }
  if(p.tipo==="multipla"){
    if(vn!=null && vn!=="") return "Resposta de múltipla escolha não aceita valor numérico.";
    if(vt==null || vt==="") return "Resposta de escolha ausente.";
    return (p.opcoes||[]).indexOf(vt)<0 ? "Opção não pertence à pergunta." : null;
  }
  if(vn!=null && vn!=="") return "Resposta de texto não aceita valor numérico.";
  var tx = trim(vt); if(!tx) return "Resposta de texto ausente.";
  return tx.length>TEXTO_LIVRE_MAX ? "Resposta deve ter no máximo "+TEXTO_LIVRE_MAX+" caracteres." : null;
}
// tira caracteres de controle (menos a quebra de linha) e apara
function limparTexto(t){ return t==null ? null : String(t).replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g, "").trim(); }
// cruza as respostas com as perguntas ATIVAS: resposta de pergunta inexistente/inativa é descartada em silêncio; repetida vale a primeira;
// pergunta ativa obrigatória sem resposta ou valor inválido bloqueia. respostas = [{perguntaId, valorNumerico, valorTexto}]
function reconciliarRespostas(ativas, respostas){
  var porId = {}; ativas.forEach(function(p){ porId[p.id] = p; });
  var aceitas = [], invalidas = [], descartadas = [], respondidas = {};
  (respostas||[]).forEach(function(r){
    var p = porId[r.perguntaId]; if(!p || respondidas[p.id]){ descartadas.push(r.perguntaId); return; }
    respondidas[p.id] = true; var motivo = validarResposta(p, r);
    if(motivo){ invalidas.push({perguntaId:p.id, motivo:motivo}); return; }
    var tx = r.valorTexto==null || r.valorTexto==="" ? null : limparTexto(r.valorTexto);
    aceitas.push({perguntaId:p.id, num:r.valorNumerico==null || r.valorNumerico==="" ? null : Number(r.valorNumerico), txt:tx});
  });
  var faltantes = ativas.filter(function(p){ return !(TIPOS[p.tipo]||{}).opcional && !respondidas[p.id]; }).map(function(p){ return p.id; });
  return {aceitas:aceitas, faltantes:faltantes, invalidas:invalidas, descartadas:descartadas};
}

// ---------- estado ----------
function avDemo(){
  var s = {v:1, seq:0, config:clone(CONFIG_PADRAO), perguntas:[], avaliacoes:[], func:{criterios:[], avaliacoes:[]}};
  s.config.supervisores = {};   // {setor:[ids de quem supervisiona]}
  s.config.diretoria = [];      // ids que avaliam qualquer setor (a tela também manda diretoria:true pelo perfil)
  var pp = LOCAL && LOCAL.perguntas && LOCAL.perguntas.length ? LOCAL.perguntas : PERGUNTAS_PADRAO;
  pp.forEach(function(p){ s.perguntas.push(novaPergunta(s, Object.assign({categoria:"representante"}, p))); });
  var cc = LOCAL && LOCAL.func && LOCAL.func.criterios && LOCAL.func.criterios.length ? LOCAL.func.criterios : CRITERIOS_FUNC_PADRAO;
  cc.forEach(function(c){ s.func.criterios.push(novoCriterio(s, c)); });
  if(LOCAL){
    if(LOCAL.supervisores) s.config.supervisores = clone(LOCAL.supervisores);
    (LOCAL.avaliacoes||[]).forEach(function(x){ s.avaliacoes.push(novaAvaliacao(s, x, "arquivo")); });
    ((LOCAL.func||{}).avaliacoes||[]).forEach(function(x){ var n = Object.assign({id:"FA"+(++s.seq)}, clone(x)); s.func.avaliacoes.push(n); });
  }
  return s;
}
// completa campos que faltam em estado salvo antes (ou cria vazio)
function avMigrar(av){
  if(!av) return avDemo(); var base = avDemo();
  Object.keys(base).forEach(function(k){ if(av[k]===undefined) av[k] = base[k]; });
  av.config = av.config||{}; Object.keys(CONFIG_PADRAO).forEach(function(k){ if(av.config[k]===undefined) av.config[k] = clone(CONFIG_PADRAO[k]); });
  Object.keys(CONFIG_PADRAO.func).forEach(function(k){ if(av.config.func[k]===undefined) av.config.func[k] = CONFIG_PADRAO.func[k]; });
  av.config.supervisores = av.config.supervisores||{}; av.config.diretoria = av.config.diretoria||[];
  av.func = av.func||{criterios:[], avaliacoes:[]}; av.func.criterios = av.func.criterios||[]; av.func.avaliacoes = av.func.avaliacoes||[];
  av.v = 1; return av;
}
function proximoId(s, pre){ return pre+(++s.seq); }
function novaPergunta(s, d){
  var cat = d.categoria==="kit" ? "kit" : "representante", ordem = s.perguntas.filter(function(p){ return p.categoria===cat; }).length;
  return {id:d.id||proximoId(s,"Q"), categoria:cat, texto:trim(d.texto), tipo:d.tipo||"estrela5", opcoes:normalizarOpcoes(d.opcoes), peso:d.peso!=null && num(d.peso)>0 ? r2(num(d.peso)) : 1,
    ordem:d.ordem!=null ? d.ordem : ordem, ativo:d.ativo!==false};
}
function novoCriterio(s, d){ return {id:d.id||proximoId(s,"C"), nome:trim(d.nome), peso:d.peso!=null && num(d.peso)>0 ? r2(num(d.peso)) : 1, ativo:d.ativo!==false, ordem:d.ordem!=null ? d.ordem : s.func.criterios.length}; }
function novaAvaliacao(s, d, por){
  var env = d.enviadaEm || agoraSP();
  return {id:d.id||proximoId(s,"A"), revId:d.revId!=null && d.revId!=="" ? String(d.revId) : null, revNome:trim(d.revNome), repNome:trim(d.repNome)||null, kit:trim(d.kit)||null,
    enviadaEm:env, dia:diaDe(env), respostas:(d.respostas||[]).map(function(r){ return {perguntaId:r.perguntaId, num:r.num!=null ? r.num : null, txt:r.txt!=null ? r.txt : null}; }), por:d.por||por||"—"};
}
var perguntasAtivas = function(s, cat){ return s.perguntas.filter(function(p){ return p.ativo && (!cat || p.categoria===cat); }).sort(function(a,b){ return a.ordem-b.ordem; }); };
var perguntaTemRespostas = function(s, id){ return s.avaliacoes.some(function(a){ return a.respostas.some(function(r){ return r.perguntaId===id; }); }); };
var criterioTemNotas = function(s, id){ return s.func.avaliacoes.some(function(a){ return a.notas && a.notas[id]!==undefined; }); };
var ordemEm = function(lista){ lista.forEach(function(x, i){ x.ordem = i; }); };

// ---------- métricas (funções puras sobre listas) ----------
// só a avaliação mais recente de cada revendedora (quem responde mais não pesa mais); empate desempata pelo id
function ultimaPorRevendedora(avs){
  var m = {}; avs.forEach(function(a){ var k = a.revId || norm(a.revNome), c = m[k]; if(!c || a.enviadaEm>c.enviadaEm || (a.enviadaEm===c.enviadaEm && a.id>c.id)) m[k] = a; });
  return Object.keys(m).map(function(k){ return m[k]; });
}
// média por pergunta numérica na escala original (nota 10 não vira 5); sem resposta: media null, n 0
function calcularMedias(perguntas, avs){
  var acc = {}; avs.forEach(function(a){ a.respostas.forEach(function(r){ if(r.num==null) return; var c = acc[r.perguntaId] || (acc[r.perguntaId] = {soma:0, n:0}); c.soma += r.num; c.n++; }); });
  return perguntas.filter(function(p){ return tipoNumerico(p.tipo); }).map(function(p){ var c = acc[p.id];
    return {perguntaId:p.id, texto:p.texto, tipo:p.tipo, categoria:p.categoria, peso:p.peso||1, media:c && c.n ? r2(c.soma/c.n) : null, n:c ? c.n : 0, max:escalaDoTipo(p.tipo)}; });
}
// contagem por alternativa (alternativa sem escolha aparece com 0)
function calcularDistribuicoes(perguntas, avs){
  var acc = {}; avs.forEach(function(a){ a.respostas.forEach(function(r){ if(r.txt==null || r.num!=null) return; var c = acc[r.perguntaId] || (acc[r.perguntaId] = {}); c[r.txt] = (c[r.txt]||0)+1; }); });
  return perguntas.filter(function(p){ return p.tipo==="multipla"; }).map(function(p){ var c = acc[p.id]||{}, ops = (p.opcoes||[]).map(function(o){ return {opcao:o, count:c[o]||0}; });
    return {perguntaId:p.id, texto:p.texto, opcoes:ops, total:ops.reduce(function(t,o){ return t+o.count; }, 0)}; });
}
// série mensal de médias por pergunta numérica (mês sem avaliação é omitido, não vira zero); mês = texto da data (fuso de São Paulo)
function historicoMensal(perguntas, avs){
  var num_ = {}; perguntas.forEach(function(p, i){ if(tipoNumerico(p.tipo)) num_[p.id] = i; }); var porMes = {};
  avs.forEach(function(a){ var mes = mesDe(a.enviadaEm), dm = porMes[mes]||{}; a.respostas.forEach(function(r){ if(r.num==null || num_[r.perguntaId]===undefined) return; var c = dm[r.perguntaId] || (dm[r.perguntaId] = {soma:0, n:0}); c.soma += r.num; c.n++; }); if(Object.keys(dm).length) porMes[mes] = dm; });
  return Object.keys(porMes).sort().map(function(mes){ var dm = porMes[mes];
    return {mes:mes, medias:Object.keys(dm).sort(function(a,b){ return num_[a]-num_[b]; }).map(function(id){ return {perguntaId:id, media:r2(dm[id].soma/dm[id].n), n:dm[id].n}; })}; });
}
// nota única 0 a 5: cada resposta numérica vira valor/max*5 e entra com o peso da pergunta; null sem resposta numérica
function mediaGeralNormalizada(perguntas, avs){
  var info = {}; perguntas.forEach(function(p){ if(tipoNumerico(p.tipo)) info[p.id] = {max:escalaDoTipo(p.tipo), peso:p.peso>0 ? p.peso : 1}; });
  var soma = 0, pt = 0; avs.forEach(function(a){ a.respostas.forEach(function(r){ var i = info[r.perguntaId]; if(r.num==null || !i) return; soma += r.num/i.max*5*i.peso; pt += i.peso; }); });
  return pt>0 ? r2(soma/pt) : null;
}
// janelas por DIA: {from, ate} com "ate" exclusivo (null = sem limite). anterior = mesmo tamanho, logo antes; "tudo" não tem anterior
function janelasPeriodo(periodo, hoje){
  hoje = hoje||hojeSP();
  if(periodo==="tudo") return {atual:{from:null, ate:null}, anterior:null};
  if(periodo==="mes_atual"){
    var a = hoje.slice(0,7).split("-").map(Number), ini = hoje.slice(0,7)+"-01", ant = a[1]===1 ? (a[0]-1)+"-12-01" : a[0]+"-"+p2(a[1]-1)+"-01";
    return {atual:{from:ini, ate:null}, anterior:{from:ant, ate:ini}};
  }
  var n = periodo==="30d" ? 30 : 90, de = somaDias(hoje, -(n-1));
  return {atual:{from:de, ate:null}, anterior:{from:somaDias(hoje, -(2*n-1)), ate:de}};
}
function dentroDaJanela(dia, j){ if(!j) return false; return (!j.from || dia>=j.from) && (!j.ate || dia<j.ate); }
// valor do período + variação contra o anterior; variação % é null quando a base é 0
function deltaKpi(atual, anterior){
  return {valor:atual, deltaAbs:atual!=null && anterior!=null ? r2(atual-anterior) : null, deltaPct:atual!=null && anterior!=null && anterior!==0 ? r2((atual-anterior)/anterior*100) : null};
}
// ordena e corta um ranking por média; quem não tem média fica de fora
function ordenarPorMedia(itens, direcao, limite){
  return itens.filter(function(i){ return i.mediaGeral!=null; }).sort(function(a,b){ return direcao==="asc" ? a.mediaGeral-b.mediaGeral : b.mediaGeral-a.mediaGeral; }).slice(0, limite);
}

// ---------- leitura para as telas: avaliações das revendedoras ----------
// quais perguntas medem a representante e quais medem o kit (só ativas)
function avPerguntas(s, cat){ return perguntasAtivas(s.av, cat); }
function avTodasPerguntas(s, cat){ return s.av.perguntas.filter(function(p){ return !cat || p.categoria===cat; }).sort(function(a,b){ return a.ordem-b.ordem; }).map(function(p){ return Object.assign({}, p, {temRespostas:perguntaTemRespostas(s.av, p.id)}); }); }
// nota 0 a 5 de UMA avaliação (todas as ativas, ou só uma categoria)
function notaDaAvaliacao(s, a, cat){ return mediaGeralNormalizada(perguntasAtivas(s.av, cat), [a]); }
// cartão de uma avaliação, já com a pergunta e o valor de cada resposta (para a tela de revendedoras e detalhe)
function avCartao(s, a){
  var porId = {}; s.av.perguntas.forEach(function(p){ porId[p.id] = p; });
  var item = function(r){ var p = porId[r.perguntaId]||{texto:"(pergunta removida)", tipo:"texto", categoria:"representante"}; return {perguntaId:r.perguntaId, texto:p.texto, tipo:p.tipo, categoria:p.categoria, max:escalaDoTipo(p.tipo), num:r.num, txt:r.txt}; };
  var rs = a.respostas.map(item);
  return Object.assign({}, a, {nota:notaDaAvaliacao(s, a), notaRepresentante:notaDaAvaliacao(s, a, "representante"), notaKit:notaDaAvaliacao(s, a, "kit"),
    representante:rs.filter(function(r){ return r.categoria==="representante"; }), kitRespostas:rs.filter(function(r){ return r.categoria==="kit"; })});
}
// revendedoras que já responderam: {revId, revNome, avaliacoes, ultimaEm, notaMedia}; busca por nome (sem acento); mais recente primeiro
function avRevendedoras(s, busca){
  var b = norm(busca), m = {};
  s.av.avaliacoes.forEach(function(a){ var k = a.revId || norm(a.revNome); (m[k] = m[k]||{revId:a.revId, revNome:a.revNome, lista:[]}).lista.push(a); });
  return Object.keys(m).map(function(k){ var g = m[k], ult = g.lista.reduce(function(t,a){ return a.enviadaEm>t ? a.enviadaEm : t; }, "");
    return {revId:g.revId, revNome:g.revNome, avaliacoes:g.lista.length, ultimaEm:ult, notaMedia:mediaGeralNormalizada(perguntasAtivas(s.av), g.lista)}; })
    .filter(function(g){ return !b || norm(g.revNome).indexOf(b)>=0; }).sort(function(a,c){ return a.ultimaEm<c.ultimaEm ? 1 : -1; });
}
// cartões de uma revendedora (por id ou nome), mais recentes primeiro
function avRevendedoraDetalhe(s, quem){
  var k = String(quem==null ? "" : quem), lista = s.av.avaliacoes.filter(function(a){ return (a.revId && a.revId===k) || norm(a.revNome)===norm(k); }).sort(function(a,b){ return a.enviadaEm<b.enviadaEm ? 1 : -1; });
  return {revNome:lista.length ? lista[0].revNome : k, total:lista.length, cartoes:lista.map(function(a){ return avCartao(s, a); })};
}
// nomes de todas as representantes que existem (a tela passa a lista do sistema) + as que já têm avaliação
function nomesReps(s, reps){ var v = {}, out = []; (reps||[]).concat(s.av.avaliacoes.map(function(a){ return a.repNome; })).forEach(function(n){ n = trim(n); if(n && !v[norm(n)]){ v[norm(n)] = 1; out.push(n); } }); return out; }
var avsDaRep = function(s, nome){ return s.av.avaliacoes.filter(function(a){ return a.repNome && norm(a.repNome)===norm(nome); }); };
// lista de representantes: total de avaliações e média geral (só perguntas da representante). opts.inativas:true inclui perguntas desativadas (como no original); padrão: só ativas
function avRepresentantes(s, reps, opts){
  opts = opts||{}; var ps = opts.inativas ? s.av.perguntas.filter(function(p){ return p.categoria==="representante"; }) : perguntasAtivas(s.av, "representante");
  return nomesReps(s, reps).map(function(n){ var l = avsDaRep(s, n); return {nome:n, totalAvaliacoes:l.length, mediaGeral:mediaGeralNormalizada(ps, l)}; })
    .sort(function(a,b){ return (b.mediaGeral==null ? -1 : b.mediaGeral)-(a.mediaGeral==null ? -1 : a.mediaGeral); });
}
// detalhe da representante: médias, distribuições, lista de avaliações e comentários (a base de um resumo por IA, que NÃO foi portado)
function avRepresentanteDetalhe(s, nome){
  var ps = perguntasAtivas(s.av, "representante"), l = avsDaRep(s, nome).sort(function(a,b){ return a.enviadaEm<b.enviadaEm ? 1 : -1; });
  return {nome:nome, total:l.length, mediaGeral:mediaGeralNormalizada(ps, l), medias:calcularMedias(ps, l), distribuicoes:calcularDistribuicoes(ps, l), historico:historicoMensal(ps, l),
    avaliacoes:l.map(function(a){ return avCartao(s, a); }), comentarios:avComentarios(s, nome)};
}
// comentários (texto livre) mais recentes de uma representante: até `limite` (padrão 40), cada um com até `max` caracteres (padrão 600)
function avComentarios(s, nome, limite, max){
  var tx = {}; s.av.perguntas.forEach(function(p){ if(p.tipo==="texto") tx[p.id] = p; }); var out = [];
  avsDaRep(s, nome).sort(function(a,b){ return a.enviadaEm<b.enviadaEm ? 1 : -1; }).forEach(function(a){ a.respostas.forEach(function(r){ if(tx[r.perguntaId] && r.txt) out.push({em:a.enviadaEm, revNome:a.revNome, pergunta:tx[r.perguntaId].texto, texto:r.txt.slice(0, max||600)}); }); });
  return out.slice(0, limite||40);
}
// kits avaliados: média por pergunta do kit usando só a última avaliação de cada revendedora; gráfico mensal usa todas
function avKits(s){
  var ps = perguntasAtivas(s.av, "kit"), todas = s.av.avaliacoes.filter(function(a){ return a.respostas.some(function(r){ return ps.some(function(p){ return p.id===r.perguntaId; }); }); });
  var ult = ultimaPorRevendedora(todas);
  return {total:todas.length, revendedoras:ult.length, mediaGeral:mediaGeralNormalizada(ps, ult), medias:calcularMedias(ps, ult), distribuicoes:calcularDistribuicoes(ps, ult), historico:historicoMensal(ps, todas)};
}
// Visão geral: totais vitalícios, KPIs do período com variação, média por pergunta, ranking de representantes (vitalício) e evolução mensal.
// reps = nomes das representantes do sistema (para contar e rankear também as sem avaliação)
function avVisaoGeral(s, periodo, reps, hoje){
  var av = s.av, cfg = av.config, ps = perguntasAtivas(av), psRep = perguntasAtivas(av, "representante"), j = janelasPeriodo(periodo||"mes_atual", hoje), todas = av.avaliacoes;
  var nota = function(a){ return mediaGeralNormalizada(ps, [a]); };
  var ruins = function(l){ return l.filter(function(a){ var n = nota(a); return n!=null && n<cfg.notaRuimTeto; }).length; };
  var pctBoas = function(l){ return l.length ? l.filter(function(a){ var n = nota(a); return n!=null && n>=cfg.notaBoaPiso; }).length/l.length*100 : null; };
  var atual = todas.filter(function(a){ return dentroDaJanela(a.dia, j.atual); }), ante = j.anterior ? todas.filter(function(a){ return dentroDaJanela(a.dia, j.anterior); }) : [];
  var nomes = nomesReps(s, reps), itens = nomes.map(function(n){ var l = avsDaRep(s, n); return {nome:n, mediaGeral:mediaGeralNormalizada(psRep, l), totalAvaliacoes:l.length}; });
  var abaixo = itens.filter(function(i){ return i.mediaGeral!=null && i.mediaGeral<cfg.notaBoaPiso; }), acima = itens.filter(function(i){ return i.mediaGeral!=null && i.mediaGeral>=cfg.notaBoaPiso; });
  var porMes = {}; todas.forEach(function(a){ (porMes[mesDe(a.enviadaEm)] = porMes[mesDe(a.enviadaEm)]||[]).push(a); });
  return {
    periodo:periodo||"mes_atual",
    totalGeral:{avaliacoes:todas.length, revendedoras:new Set(todas.map(function(a){ return a.revId || norm(a.revNome); })).size, representantes:nomes.length, notaGeral:mediaGeralNormalizada(ps, todas), notasRuins:ruins(todas)},
    notaGeral:deltaKpi(mediaGeralNormalizada(ps, atual), j.anterior ? mediaGeralNormalizada(ps, ante) : null),
    avaliacoesNoPeriodo:deltaKpi(atual.length, j.anterior ? ante.length : null),
    notasBoas:deltaKpi(pctBoas(atual), j.anterior ? pctBoas(ante) : null),
    notasRuins:{valor:ruins(atual), percentual:atual.length ? ruins(atual)/atual.length*100 : null},
    mediaPorPergunta:calcularMedias(ps, atual),
    piores:ordenarPorMedia(abaixo, "asc", cfg.limiteRanking), totalAbaixoDoCorte:abaixo.length,
    melhores:ordenarPorMedia(acima, "desc", cfg.limiteRanking), totalAcimaDoCorte:acima.length,
    evolucaoMensal:historicoMensal(ps, todas).slice(-cfg.mesesEvolucao).map(function(i){ var dm = porMes[i.mes]||[]; return {mes:i.mes, avaliacoes:dm.length, notaGeral:mediaGeralNormalizada(ps, dm), medias:i.medias}; })
  };
}

// ---------- avaliação pelo SISTEMA (nota calculada; só lê domain/representantes.js, não duplica a regra) ----------
// resumoRep: {rep, n, pont, expl, whats, media, rec, vir, parados, desc, pontos, bloqueada}
function avSistemaRep(s, rep){ return resumoRep(rep, s); }
function avSistema(s, reps){ return nomesReps(s, reps).map(function(r){ return resumoRep(r, s); }).sort(function(a,b){ return (b.pontos==null ? -1 : b.pontos)-(a.pontos==null ? -1 : a.pontos); }); }
// lado a lado: o que as revendedoras avaliaram (s.av) e a nota que o sistema calculou (pontos, com recusas e dias parados)
function avPainelRep(s, rep){
  var d = avRepresentanteDetalhe(s, rep), sis = resumoRep(rep, s);
  return {nome:rep, revendedoras:{total:d.total, nota:d.mediaGeral}, sistema:sis, diferenca:d.mediaGeral!=null && sis.pontos!=null ? r2(sis.pontos-d.mediaGeral) : null};
}

// ---------- montagem de kits: erros de bipagem e divergências (lê s.errosBipagem, não altera) ----------
// registro: {id, kitId, rev, rep, data:"AAAA-MM-DD", bipadora, montadora, condicionais, esperadas, lidas, faltas:[{codigo,desc,qtd}], nFaltas, sobras:[{codigo}], nSobras, erros}
// descontoEstimado = erros × s.cfg.perdaFalta: a tela só mostra para quem vê valores (bipadora nunca vê)
function avMontagem(s, periodo, hoje){
  var j = janelasPeriodo(periodo||"mes_atual", hoje), lista = (s.errosBipagem||[]).filter(function(x){ return dentroDaJanela(diaDe(x.data), j.atual); }), perda = (s.cfg||{}).perdaFalta||0;
  var agr = function(chave){ var m = {}; lista.forEach(function(x){ var k = x[chave]||"—", c = m[k] || (m[k] = {nome:k, registros:0, erros:0, faltas:0, sobras:0, esperadas:0}); c.registros++; c.erros += x.erros||0; c.faltas += x.nFaltas||0; c.sobras += x.nSobras||0; c.esperadas += x.esperadas||0; });
    return Object.keys(m).map(function(k){ var c = m[k]; c.taxaErro = c.esperadas ? r2(c.erros/c.esperadas*100) : null; c.descontoEstimado = r2(c.erros*perda); return c; }).sort(function(a,b){ return b.erros-a.erros; }); };
  var mes = {}; lista.forEach(function(x){ var k = mesDe(x.data); (mes[k] = mes[k]||{mes:k, registros:0, erros:0}); mes[k].registros++; mes[k].erros += x.erros||0; });
  var cod = {}; lista.forEach(function(x){ (x.faltas||[]).forEach(function(f){ cod[f.codigo] = (cod[f.codigo]||0)+(f.qtd||1); }); });
  var conferidos = Object.keys(s.confBip||{}).filter(function(k){ return s.confBip[k] && s.confBip[k].fim; }).length, erros = lista.reduce(function(t,x){ return t+(x.erros||0); }, 0), esp = lista.reduce(function(t,x){ return t+(x.esperadas||0); }, 0);
  return {periodo:periodo||"mes_atual", totais:{registros:lista.length, erros:erros, faltas:lista.reduce(function(t,x){ return t+(x.nFaltas||0); }, 0), sobras:lista.reduce(function(t,x){ return t+(x.nSobras||0); }, 0), pecasEsperadas:esp,
      taxaErro:esp ? r2(erros/esp*100) : null, kitsConferidos:conferidos, descontoEstimado:r2(erros*perda)},
    porBipadora:agr("bipadora"), porMontadora:agr("montadora"), porRepresentante:agr("rep"), porMes:Object.keys(mes).sort().map(function(k){ return mes[k]; }),
    pecasMaisFaltantes:Object.keys(cod).map(function(k){ return {codigo:k, qtd:cod[k]}; }).sort(function(a,b){ return b.qtd-a.qtd; }).slice(0, 10),
    ultimos:lista.slice().sort(function(a,b){ return (b.em||0)-(a.em||0); }).slice(0, 20)};
}

// ---------- avaliação de FUNCIONÁRIOS pelos supervisores ----------
// quem pode avaliar/ver um setor: diretoria (quem = {diretoria:true} ou id em config.diretoria) ou id listado em config.supervisores[setor]
function avFuncPodeSetor(s, setor, quem){
  quem = quem||{}; var uid = quem.usuarioId==null ? null : String(quem.usuarioId);
  if(quem.diretoria===true || (uid!==null && s.av.config.diretoria.map(String).indexOf(uid)>=0)) return true;
  return uid!==null && (s.av.config.supervisores[setor]||[]).map(String).indexOf(uid)>=0;
}
// setores que essa pessoa enxerga (todosSetores = lista de nomes de setor do sistema; a diretoria vê todos)
function avFuncSetoresVisiveis(s, quem, todosSetores){
  var nomes = (todosSetores||[]).concat(Object.keys(s.av.config.supervisores)).filter(function(n,i,a){ return a.indexOf(n)===i; });
  return nomes.filter(function(n){ return avFuncPodeSetor(s, n, quem); });
}
function avFuncCriterios(s, soAtivos){ return s.av.func.criterios.filter(function(c){ return !soAtivos || c.ativo; }).sort(function(a,b){ return a.ordem-b.ordem; }).map(function(c){ return Object.assign({}, c, {temNotas:criterioTemNotas(s.av, c.id)}); }); }
// nota final do mês = média das notas dos critérios ponderada pelos pesos (guardados na própria avaliação: mudar o peso depois não reescreve o passado)
function notaFinalFunc(notas, pesos){ var soma = 0, pt = 0; Object.keys(notas||{}).forEach(function(id){ var p = pesos && pesos[id]>0 ? pesos[id] : 1; soma += notas[id]*p; pt += p; }); return pt ? r2(soma/pt) : null; }
var mediaDe = function(l, f){ var v = l.map(f).filter(function(x){ return x!=null; }); return v.length ? r2(v.reduce(function(t,x){ return t+x; }, 0)/v.length) : null; };
// avaliações que essa pessoa pode ver; filtros {setor, mes, funcId}
function avFuncAvaliacoes(s, quem, f){
  f = f||{}; return s.av.func.avaliacoes.filter(function(a){ return avFuncPodeSetor(s, a.setor, quem) && (!f.setor || a.setor===f.setor) && (!f.mes || a.mes===f.mes) && (!f.funcId || String(a.funcId)===String(f.funcId)); })
    .sort(function(a,b){ return a.mes<b.mes ? 1 : a.mes>b.mes ? -1 : (a.em<b.em ? 1 : -1); });
}
// média por funcionária (todas as avaliações dela, ou só de um mês): {funcId, funcNome, setor, n, media, ultima:{mes,nota}, porCriterio:[{id,nome,media}]}
function avFuncPorFuncionaria(s, quem, f){
  f = f||{}; var m = {}, crit = {}; s.av.func.criterios.forEach(function(c){ crit[c.id] = c; });
  avFuncAvaliacoes(s, quem, f).forEach(function(a){ (m[a.funcId] = m[a.funcId]||{funcId:a.funcId, funcNome:a.funcNome, setor:a.setor, lista:[]}).lista.push(a); });
  return Object.keys(m).map(function(k){ var g = m[k], ids = {}; g.lista.forEach(function(a){ Object.keys(a.notas).forEach(function(i){ ids[i] = 1; }); });
    return {funcId:g.funcId, funcNome:g.funcNome, setor:g.setor, n:g.lista.length, media:mediaDe(g.lista, function(a){ return a.notaFinal; }), ultima:{mes:g.lista[0].mes, nota:g.lista[0].notaFinal},
      porCriterio:Object.keys(ids).map(function(i){ return {id:i, nome:crit[i] ? crit[i].nome : i, media:mediaDe(g.lista, function(a){ return a.notas[i]!==undefined ? a.notas[i] : null; })}; })}; })
    .sort(function(a,b){ return (b.media==null ? -1 : b.media)-(a.media==null ? -1 : a.media); });
}
// média por setor: {setor, funcionarias, avaliacoes, media, bons, ruins}
function avFuncPorSetor(s, quem, f){
  var cfg = s.av.config.func, m = {}; avFuncPorFuncionaria(s, quem, f).forEach(function(p){ (m[p.setor] = m[p.setor]||[]).push(p); });
  return Object.keys(m).map(function(k){ var l = m[k]; return {setor:k, funcionarias:l.length, avaliacoes:l.reduce(function(t,p){ return t+p.n; }, 0), media:mediaDe(l, function(p){ return p.media; }),
    bons:l.filter(function(p){ return p.media!=null && p.media>=cfg.notaBoa; }).length, ruins:l.filter(function(p){ return p.media!=null && p.media<cfg.notaRuim; }).length}; }).sort(function(a,b){ return (b.media==null ? -1 : b.media)-(a.media==null ? -1 : a.media); });
}
// histórico de uma funcionária (mais recente primeiro), com a série mensal para o gráfico
function avFuncHistorico(s, quem, funcId){
  var l = avFuncAvaliacoes(s, quem, {funcId:funcId}); return {funcId:funcId, funcNome:l.length ? l[0].funcNome : "", setor:l.length ? l[0].setor : "", media:mediaDe(l, function(a){ return a.notaFinal; }), avaliacoes:l,
    serie:l.slice().reverse().map(function(a){ return {mes:a.mes, nota:a.notaFinal}; })};
}
// quem ainda falta avaliar no mês: funcionarias = [{id, nome, setor}] (a tela passa a lista de pessoas.js); só dos setores que a pessoa pode avaliar
function avFuncPendentes(s, quem, funcionarias, mes){
  mes = mes||mesDe(hojeSP()); var feitas = {}; s.av.func.avaliacoes.forEach(function(a){ if(a.mes===mes) feitas[a.funcId] = 1; });
  return (funcionarias||[]).filter(function(p){ return avFuncPodeSetor(s, p.setor, quem) && !feitas[String(p.id)]; });
}
function avFuncResumo(s, quem, mes){
  var l = avFuncAvaliacoes(s, quem, {mes:mes||mesDe(hojeSP())}); return {mes:mes||mesDe(hojeSP()), avaliacoes:l.length, media:mediaDe(l, function(a){ return a.notaFinal; })};
}

// ---------- operações (reducer): cada ação guarda a.por (quem fez) ----------
function avReduz(s, a){
  var av = clone(s.av), cfg = av.config, por = a.por||"—", agora = a.agora||agoraSP(), hoje = diaDe(agora), recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg){ return {patch:{av:av}, msg:msg}; };
  var perg = function(id){ return av.perguntas.find(function(p){ return p.id===id; }); };
  switch(a.op){
    // --- Configurador: perguntas (representante e kit) ---
    case "perg_add": {   // {categoria, texto, tipo, opcoes, peso}: entra no fim da categoria
      var et = validarTextoPergunta(a.texto); if(et) return recusa(et); if(!TIPOS[a.tipo]) return recusa("Escolha o tipo da pergunta.");
      var op = normalizarOpcoes(a.opcoes), eo = validarOpcoesParaTipo(a.tipo, op); if(eo) return recusa(eo);
      var np = novaPergunta(av, {categoria:a.categoria, texto:a.texto, tipo:a.tipo, opcoes:op, peso:a.peso}); av.perguntas.push(np); return ok("Pergunta criada em "+rotuloCategoria(np.categoria)+".");
    }
    case "perg_edit": {   // {id, texto?, tipo?, opcoes?, peso?, ativo?}; com respostas: tipo travado e opções só acrescentam
      var p = perg(a.id); if(!p) return recusa("Pergunta não encontrada."); var tem = perguntaTemRespostas(av, p.id), tipo = a.tipo!==undefined ? a.tipo : p.tipo;
      if(!TIPOS[tipo]) return recusa("Tipo de pergunta inválido.");
      if(tem && tipo!==p.tipo) return recusa("O tipo não pode ser alterado: a pergunta já possui respostas.");
      if(a.texto!==undefined){ var e2 = validarTextoPergunta(a.texto); if(e2) return recusa(e2); }
      var ops = a.opcoes!==undefined ? normalizarOpcoes(a.opcoes) : (tipo===p.tipo ? p.opcoes : []);
      if(tem && a.opcoes!==undefined && opcoesRemovidas(p.opcoes, ops).length) return recusa("As opções não podem ser renomeadas nem removidas: a pergunta já possui respostas (acrescentar e reordenar pode).");
      var e3 = validarOpcoesParaTipo(tipo, ops); if(e3) return recusa(e3);
      if(a.peso!==undefined && !(num(a.peso)>0)) return recusa("O peso precisa ser maior que zero.");
      if(a.texto!==undefined) p.texto = trim(a.texto); p.tipo = tipo; p.opcoes = ops; if(a.peso!==undefined) p.peso = r2(num(a.peso)); if(a.ativo!==undefined) p.ativo = !!a.ativo;
      return ok("Pergunta atualizada.");
    }
    case "perg_del": {   // com respostas só DESATIVA (some do app, mantém o histórico); sem respostas apaga de vez
      var pd = perg(a.id); if(!pd) return recusa("Pergunta não encontrada.");
      if(perguntaTemRespostas(av, pd.id)){ pd.ativo = false; return ok("A pergunta já tem respostas: foi desativada (o histórico fica)."); }
      av.perguntas = av.perguntas.filter(function(x){ return x!==pd; }); ["representante", "kit"].forEach(function(c){ ordemEm(av.perguntas.filter(function(x){ return x.categoria===c; }).sort(function(x,y){ return x.ordem-y.ordem; })); }); return ok("Pergunta excluída.");
    }
    case "perg_ordem": {   // {categoria, ids}: ordem nova, só dentro de uma categoria; ids repetidos, inexistentes ou de outra categoria recusam
      var ids = a.ids||[]; if(new Set(ids).size!==ids.length) return recusa("A lista de ordenação tem ids repetidos.");
      var alvo = ids.map(perg); if(alvo.some(function(x){ return !x; })) return recusa("A lista de ordenação tem perguntas inexistentes.");
      if(alvo.some(function(x){ return x.categoria!==a.categoria; })) return recusa("A lista de ordenação tem perguntas de outra categoria.");
      var resto = av.perguntas.filter(function(x){ return x.categoria===a.categoria && ids.indexOf(x.id)<0; }).sort(function(x,y){ return x.ordem-y.ordem; }); ordemEm(alvo.concat(resto)); return ok("Ordem salva.");
    }
    case "cfg_set": {   // {notaBoaPiso, notaRuimTeto, limiteRanking, mesesEvolucao}: o que for enviado muda
      var nb = a.notaBoaPiso!==undefined ? num(a.notaBoaPiso) : cfg.notaBoaPiso, nr = a.notaRuimTeto!==undefined ? num(a.notaRuimTeto) : cfg.notaRuimTeto;
      if(nb<0 || nb>5 || nr<0 || nr>5 || nr>nb) return recusa("As notas vão de 0 a 5 e a nota ruim não pode passar da boa.");
      cfg.notaBoaPiso = nb; cfg.notaRuimTeto = nr;
      if(a.limiteRanking!==undefined) cfg.limiteRanking = Math.max(1, Math.round(num(a.limiteRanking))); if(a.mesesEvolucao!==undefined) cfg.mesesEvolucao = Math.max(1, Math.round(num(a.mesesEvolucao)));
      return ok("Configuração das avaliações salva.");
    }
    // --- Avaliações das revendedoras (entram à mão: o app da revendedora não está ligado) ---
    case "resp_add": {   // {revNome, revId?, repNome?, kit?, enviadaEm?, respostas:[{perguntaId, valorNumerico, valorTexto}]}
      var rn = trim(a.revNome); if(!rn) return recusa("Informe a revendedora.");
      var env = a.enviadaEm || agora; if(!ehDia(diaDe(env))) return recusa("Data inválida."); if(diaDe(env)>hoje) return recusa("A data não pode ser no futuro.");
      var kit = trim(a.kit), repn = trim(a.repNome), rk = a.revId!=null && a.revId!=="" ? String(a.revId) : null;
      var dup = kit ? av.avaliacoes.find(function(x){ return x.kit===kit && ((rk && x.revId===rk) || norm(x.revNome)===norm(rn)); }) : null;
      if(dup) return recusa("Esse kit já foi avaliado por "+dup.revNome+" (cada revendedora avalia um kit uma vez).");
      // sem representante a etapa "Representante" não existe: só as perguntas do kit são cobradas (o original travava aqui)
      var ativas = perguntasAtivas(av).filter(function(x){ return repn || x.categoria!=="representante"; }), rc = reconciliarRespostas(ativas, a.respostas);
      if(rc.invalidas.length){ var pi = perg(rc.invalidas[0].perguntaId); return recusa((pi ? "\""+pi.texto+"\": " : "")+rc.invalidas[0].motivo); }
      if(rc.faltantes.length){ var pf = perg(rc.faltantes[0]); return recusa("Falta responder: "+(pf ? pf.texto : rc.faltantes[0])+(rc.faltantes.length>1 ? " (e mais "+(rc.faltantes.length-1)+")" : "")+"."); }
      var na = novaAvaliacao(av, {revNome:rn, revId:rk, repNome:repn, kit:kit, enviadaEm:env, respostas:rc.aceitas, por:por}, por); av.avaliacoes.push(na);
      var nt = mediaGeralNormalizada(ativas, [na]); return ok("Avaliação de "+rn+" lançada"+(nt!=null ? " (nota "+formatarNota(nt)+")" : "")+(rc.descartadas.length ? ". "+rc.descartadas.length+" resposta(s) fora das perguntas ativas foram ignoradas" : "")+".");
    }
    case "resp_del": {
      var ra = av.avaliacoes.find(function(x){ return x.id===a.id; }); if(!ra) return recusa("Avaliação não encontrada.");
      av.avaliacoes = av.avaliacoes.filter(function(x){ return x!==ra; }); return ok("Avaliação de "+ra.revNome+" excluída.");
    }
    // --- Funcionários: critérios (com peso) e quem supervisiona cada setor ---
    case "func_crit_add": {   // {nome, peso}
      var cn = trim(a.nome); if(!cn) return recusa("Informe o nome do critério."); if(cn.length>120) return recusa("O nome do critério é grande demais.");
      if(a.peso!==undefined && !(num(a.peso)>0)) return recusa("O peso precisa ser maior que zero.");
      if(av.func.criterios.some(function(c){ return norm(c.nome)===norm(cn); })) return recusa("Já existe um critério com esse nome.");
      av.func.criterios.push(novoCriterio(av, {nome:cn, peso:a.peso})); return ok("Critério criado.");
    }
    case "func_crit_edit": {   // {id, nome?, peso?, ativo?}: o peso novo vale só para avaliações novas
      var c1 = av.func.criterios.find(function(c){ return c.id===a.id; }); if(!c1) return recusa("Critério não encontrado.");
      if(a.nome!==undefined){ var n1 = trim(a.nome); if(!n1) return recusa("Informe o nome do critério."); c1.nome = n1; }
      if(a.peso!==undefined){ if(!(num(a.peso)>0)) return recusa("O peso precisa ser maior que zero."); c1.peso = r2(num(a.peso)); } if(a.ativo!==undefined) c1.ativo = !!a.ativo;
      return ok("Critério atualizado.");
    }
    case "func_crit_del": {   // com notas dadas só desativa; sem notas apaga
      var c2 = av.func.criterios.find(function(c){ return c.id===a.id; }); if(!c2) return recusa("Critério não encontrado.");
      if(criterioTemNotas(av, c2.id)){ c2.ativo = false; return ok("O critério já tem notas: foi desativado (o histórico fica)."); }
      av.func.criterios = av.func.criterios.filter(function(c){ return c!==c2; }); ordemEm(av.func.criterios.sort(function(x,y){ return x.ordem-y.ordem; })); return ok("Critério excluído.");
    }
    case "func_crit_ordem": {   // {ids}
      var ci = a.ids||[], cs = ci.map(function(i){ return av.func.criterios.find(function(c){ return c.id===i; }); });
      if(new Set(ci).size!==ci.length || cs.some(function(x){ return !x; })) return recusa("A lista de ordenação tem ids repetidos ou inexistentes.");
      ordemEm(cs.concat(av.func.criterios.filter(function(c){ return ci.indexOf(c.id)<0; }).sort(function(x,y){ return x.ordem-y.ordem; }))); return ok("Ordem salva.");
    }
    case "func_sup_set": {   // {setor, ids:[...]}: quem supervisiona esse setor (lista vazia remove)
      var st = trim(a.setor); if(!st) return recusa("Informe o setor.");
      var li = (a.ids||[]).map(String).filter(function(x, i, arr){ return x && arr.indexOf(x)===i; }); if(li.length) av.config.supervisores[st] = li; else delete av.config.supervisores[st];
      return ok(li.length ? "Supervisão de "+st+" salva." : "Supervisão de "+st+" removida.");
    }
    case "func_dir_set": { av.config.diretoria = (a.ids||[]).map(String).filter(function(x, i, arr){ return x && arr.indexOf(x)===i; }); return ok("Quem avalia todos os setores foi salvo."); }
    case "func_cfg_set": {   // {escalaMax?, comentarioMax?, notaBoa?, notaRuim?} (mudar a escala vale só para as notas novas)
      var f = cfg.func, em = a.escalaMax!==undefined ? Math.round(num(a.escalaMax)) : f.escalaMax, nb2 = a.notaBoa!==undefined ? num(a.notaBoa) : f.notaBoa, nr2 = a.notaRuim!==undefined ? num(a.notaRuim) : f.notaRuim;
      if(em<2 || em>10) return recusa("A escala vai de 2 a 10."); if(nb2>em || nr2<1 || nr2>nb2) return recusa("A nota ruim não pode passar da boa, e as duas ficam dentro da escala.");
      f.escalaMax = em; f.notaBoa = nb2; f.notaRuim = nr2; if(a.comentarioMax!==undefined) f.comentarioMax = Math.max(50, Math.round(num(a.comentarioMax))); return ok("Configuração da avaliação de funcionários salva.");
    }
    // --- Funcionários: nota do mês dada pelo supervisor do setor ---
    case "func_nota": {   // {funcId, funcNome, setor, mes?, notas:{critId:n}, comentario, usuarioId, diretoria}: refazer o mês guarda a versão anterior no histórico
      var fid = a.funcId==null ? "" : String(a.funcId), setor = trim(a.setor), fnome = trim(a.funcNome); if(!fid || !fnome || !setor) return recusa("Escolha a funcionária.");
      if(!avFuncPodeSetor(s, setor, {usuarioId:a.usuarioId, diretoria:a.diretoria})) return recusa("Só o supervisor de "+setor+" (ou a diretoria) avalia esse setor.");
      var mes = a.mes || hoje.slice(0,7); if(!/^\d{4}-\d{2}$/.test(mes)) return recusa("Mês inválido."); if(mes>hoje.slice(0,7)) return recusa("Não dá para avaliar um mês que ainda não começou.");
      var fc = cfg.func, crits = av.func.criterios.filter(function(c){ return c.ativo; }); if(!crits.length) return recusa("Cadastre ao menos um critério ativo.");
      var notas = {}, pesos = {}, ern = null;
      crits.forEach(function(c){ var v = a.notas ? a.notas[c.id] : undefined; if(v==null || v===""){ ern = ern||"Falta a nota de \""+c.nome+"\"."; return; } v = Number(v);
        if(!Number.isInteger(v) || v<1 || v>fc.escalaMax){ ern = ern||"A nota de \""+c.nome+"\" vai de 1 a "+fc.escalaMax+"."; return; } notas[c.id] = v; pesos[c.id] = c.peso; });
      if(ern) return recusa(ern);
      var cm = limparTexto(a.comentario)||""; if(cm.length>fc.comentarioMax) return recusa("O comentário passou de "+fc.comentarioMax+" caracteres.");
      var ex = av.func.avaliacoes.find(function(x){ return String(x.funcId)===fid && x.mes===mes; }), reg = {funcId:fid, funcNome:fnome, setor:setor, mes:mes, notas:notas, pesos:pesos, notaFinal:notaFinalFunc(notas, pesos), escalaMax:fc.escalaMax, comentario:cm, por:por, supervisorId:a.usuarioId==null ? null : String(a.usuarioId), em:agora};
      if(ex){ reg.id = ex.id; reg.historico = (ex.historico||[]).concat([{em:ex.em, por:ex.por, notas:ex.notas, notaFinal:ex.notaFinal, comentario:ex.comentario}]); av.func.avaliacoes[av.func.avaliacoes.indexOf(ex)] = reg; }
      else { reg.id = proximoId(av, "FA"); reg.historico = []; av.func.avaliacoes.push(reg); }
      return ok((ex ? "Avaliação de " : "Avaliação de ")+fnome+" ("+formatarMes(mes)+") "+(ex ? "refeita" : "salva")+": nota "+formatarNota(reg.notaFinal)+".");
    }
    case "func_nota_del": {   // {id, usuarioId, diretoria}
      var fa = av.func.avaliacoes.find(function(x){ return x.id===a.id; }); if(!fa) return recusa("Avaliação não encontrada.");
      if(!avFuncPodeSetor(s, fa.setor, {usuarioId:a.usuarioId, diretoria:a.diretoria})) return recusa("Só o supervisor de "+fa.setor+" (ou a diretoria) mexe nessa avaliação.");
      av.func.avaliacoes = av.func.avaliacoes.filter(function(x){ return x!==fa; }); return ok("Avaliação de "+fa.funcNome+" ("+formatarMes(fa.mes)+") excluída.");
    }
    default: return recusa("Ação desconhecida.");
  }
}

export { avDemo, avMigrar, avReduz, hojeSP, agoraSP, somaDias, listaDias,
  TIPOS, CATEGORIAS, PERIODOS, CONFIG_PADRAO, TEXTO_MAX, OPCAO_MAX, TEXTO_LIVRE_MAX, MIN_OPCOES,
  formatarNota, formatarMes, formatarDia, rotuloTipo, rotuloCategoria, escalaDoTipo, tipoNumerico, tomDaNota, percentualDaNota,
  validarTextoPergunta, normalizarOpcoes, opcoesRemovidas, validarOpcoesParaTipo, validarResposta, limparTexto, reconciliarRespostas,
  ultimaPorRevendedora, calcularMedias, calcularDistribuicoes, historicoMensal, mediaGeralNormalizada, janelasPeriodo, dentroDaJanela, deltaKpi, ordenarPorMedia, notaFinalFunc,
  avPerguntas, avTodasPerguntas, notaDaAvaliacao, avCartao, avRevendedoras, avRevendedoraDetalhe, avRepresentantes, avRepresentanteDetalhe, avComentarios, avKits, avVisaoGeral,
  avSistemaRep, avSistema, avPainelRep, avMontagem,
  avFuncPodeSetor, avFuncSetoresVisiveis, avFuncCriterios, avFuncAvaliacoes, avFuncPorFuncionaria, avFuncPorSetor, avFuncHistorico, avFuncPendentes, avFuncResumo };
