// Sorelly Admin — domain/plano45-60.js
// PLANO 45/60 DIAS (Agendamento, 23/10/2026). Contexto e regras: documento "Plano 45/60 Dias" do Marcus + planilha GERAL DE VENDAS (aba 45 E 60 DIAS). Registrado em DECISOES.md.
// A revendedora indicada passa de 30 para 45 ou 60 dias, com nova data de preferência. Só vale o que a Diretoria aprova. Aprovada e mudando de mês = SAI da meta do mês de origem
// e ENTRA no mês de destino: isso é uma remarcação do Agendamento (domain/agendamento.js, ops remarc_plano e remarc_plano_del), então a meta, a cota e o Financeiro acompanham.
// Estado s.p45 (só neste navegador). Nasce VAZIO (repositório é público). Dados reais, se existirem, vêm só de domain/plano45-60.local.js (gitignored) e entram pelo botão Importar.
// FASE 1: Indicações, Aprovação e Painel. (Fase 2: Acompanhamento do ciclo — contato, entrega, venda, crescimento, MANTÉM ou VOLTA A 30 DIAS. Os campos já existem na linha.)
import { globLocal } from "@/lib/glob-local";
import { agendReduz, chaveMes, mesAberto, movimentos, nomeMes, previstosAjustados } from "@/apps/montagem/domain/agendamento";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { destinosDe } from "@/apps/montagem/domain/avisos";

var LOCAL = (function(){ try { var m = globLocal("apps/montagem/domain/plano45-60.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(x){ return null; } })();

var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var trim = function(t){ return String(t==null ? "" : t).trim(); };
var norm = function(t){ return trim(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " "); };
var agoraIso = function(){ return new Date().toISOString(); };

// ---------- parâmetros (ficam no estado; a tela de ajuste vem na Fase 3, no Configurador) ----------
var CONFIG_PADRAO = {
  mediaAcerto:800,     // premissa do Marcus: média por acerto na previsão
  minimoPorRep:3,      // mínimo de revendedoras que cada representante indica
  janelaIni:1, janelaFim:10,   // dias do mês em que a nova data deve cair (a data é só referência; fora da janela só avisa)
  crescimentoMin:30,   // % de crescimento sobre a média que mostra que o prazo maior funcionou (informativo; o mínimo em reais fixado na aprovação decide)
  diasLivres:5,        // mudança de data até N dias depois do acerto atual vale na hora; além disso, só com autorização (senão vale a multa de remarcação)
  minimos:{representante:{45:750, 60:1000}, sorelly:{45:1000, 60:1500}},   // mínimo de vendas sugerido por canal e prazo (Marcus, 24/10/2026); ele ainda digita o valor final na aprovação
  teto:160             // teto de revendedoras por representante (sugestão do documento; o bloqueio vem na Fase 3)
};

var SITUACOES = {
  analise:{lb:"Em análise", cor:"#FBBF24"}, aprovada:{lb:"Aprovada", cor:"#4ADE80"}, reprovada:{lb:"Reprovada", cor:"#F87171"},
  saiu:{lb:"Saiu", cor:"#94A3B8"}, sem_interesse:{lb:"Sem interesse", cor:"#94A3B8"}};
var ORDEM_SIT = ["analise", "aprovada", "reprovada", "sem_interesse", "saiu"];
var CONTATOS = ["MENSAGEM", "LIGAÇÃO", "SEM RETORNO"];
var MOTIVOS = [["venda_baixa", "Venda baixa"], ["pediu_prazo", "Pediu mais prazo"], ["potencial", "Venda alta com potencial"], ["outro", "Outro"]];
var ORIGENS = [["representante", "Representante"], ["sistema", "Sistema"], ["revendedora", "Revendedora"]];

// mínimo sugerido pelo canal (representante ou Sorelly = atendimento interno) e pelo prazo; o Marcus fixa o valor final na aprovação
function minimoSugerido(prazo, canal, cfg){
  var m = ((cfg && cfg.minimos) || CONFIG_PADRAO.minimos)[canal==="sorelly" ? "sorelly" : "representante"];
  return m && m[prazo] ? m[prazo] : null;
}

// ---------- datas (texto AAAA-MM-DD) ----------
var addDias = function(iso, n){ var d = new Date(iso+"T12:00:00Z"); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0, 10); };
var mesDe = function(iso){ return iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.slice(0, 7) : null; };
var fmtData = function(iso){ return mesDe(iso) ? iso.slice(8, 10)+"/"+iso.slice(5, 7)+"/"+iso.slice(2, 4) : "—"; };
var novaCalculada = function(orig, prazo){ return mesDe(orig) && (prazo===45 || prazo===60) ? addDias(orig, prazo===45 ? 15 : 30) : null; };
var rotuloMes = function(ym){ return ym ? nomeMes(ym)+"/"+ym.slice(2, 4) : "—"; };

// ---------- representantes ----------
// o plano usa o nome curto ("Leticia Alves"); o cadastro usa o nome completo. Casam quando todas as palavras do curto estão no completo e a primeira é igual.
function repConfere(curto, completo){
  var a = norm(curto).split(" "), b = norm(completo).split(" ");
  return !!a[0] && a[0]===b[0] && a.every(function(t){ return b.indexOf(t)>=0; });
}
function repResolve(nome, reps){
  var ex = (reps||[]).filter(function(r){ return norm(r.nome)===norm(nome); })[0] || (reps||[]).filter(function(r){ return repConfere(nome, r.nome); })[0];
  return ex ? ex.nome : trim(nome);
}
var repCurto = function(nome){ var p = trim(nome).split(" "); return p.length>1 && ["de", "da", "do", "dos", "das"].indexOf(p[1].toLowerCase())<0 && p[0].length>0 ? p.slice(0, 2).join(" ") : p[0]; };

// ---------- regras da linha ----------
var nomeCompleto = function(nome){ return trim(nome).split(" ").filter(Boolean).length>=2; };
// pendências da linha: grave = impede aprovar; aviso = só mostra
function pendencias(l, hojeYm, cfg){
  var p = [];
  if(!nomeCompleto(l.nome)) p.push({k:"nome", txt:"Sem nome completo", grave:true});
  if(!mesDe(l.orig)) p.push({k:"orig", txt:"Sem data do acerto", grave:true});
  if(l.prazo!==45 && l.prazo!==60) p.push({k:"prazo", txt:"Prazo inválido"+(l.prazoOrig!=null ? " ("+l.prazoOrig+")" : ""), grave:true});
  if(!mesDe(l.nova)) p.push({k:"nova", txt:"Sem nova data", grave:true});
  if(!(l.media>0)) p.push({k:"media", txt:"Sem média de venda", grave:false});
  if(l.situacao==="aprovada" && !(l.minimo>0)) p.push({k:"minimo", txt:"Sem mínimo de vendas", grave:false});
  if(l.situacao==="aprovada" && !l.contato) p.push({k:"contato", txt:"Sem contato registrado", grave:false});
  if(l.situacao==="aprovada" && l.contato==="SEM RETORNO") p.push({k:"semretorno", txt:"Sem retorno da revendedora", grave:false});
  var d = mesDe(l.nova) ? Number(l.nova.slice(8, 10)) : null;
  if(d!==null && (d<cfg.janelaIni || d>cfg.janelaFim)) p.push({k:"janela", txt:"Nova data fora dos dias "+cfg.janelaIni+" a "+cfg.janelaFim, grave:false, info:true});
  if(mesDe(l.orig) && mesDe(l.orig)<hojeYm) p.push({k:"atrasada", txt:"Acerto de mês anterior", grave:false, info:true});
  return p;
}
var temGrave = function(p){ return p.some(function(x){ return x.grave; }); };

// efeito na meta do Agendamento: "sai" = muda de mês (sai da meta do mês de origem e entra no de destino);
// "mesmo" = continua na meta do mês; "atrasada" = acerto de mês que já passou (o documento pede confirmar se conta na meta; não mexe sozinho)
function efeitoMeta(l, ag, hojeYm){
  var o = mesDe(l.orig), n = mesDe(l.nova);
  if(!o || !n) return {tipo:"incompleta"};
  if(o===n) return {tipo:"mesmo", origem:o, destino:n};
  if(o<hojeYm || (ag && ag.mes && ag.mes[o] && ag.mes[o].fechadoEm)) return {tipo:"atrasada", origem:o, destino:n};
  return {tipo:"sai", origem:o, destino:n};
}
var naMeta = function(l, ag){ return !!l.id && (ag.remarc||[]).some(function(r){ return r.planoId===l.id; }); };

// ---------- permissões ----------
var podeAprovar = function(id){ return temAutorizacao("p45_aprova", id); };
var podeLancar = function(id){ return podeAprovar(id) || temAutorizacao("p45_lanca", id); };

// ---------- ciclo estendido (Fase 2) ----------
// Crescimento = (venda no ciclo − média das 3 últimas) ÷ média. Decisão: MANTÉM se a venda atinge o mínimo em reais fixado na aprovação; sem mínimo, vale o crescimento mínimo (parâmetro). Senão VOLTA A 30 DIAS.
var crescimento = function(l){ return l.vendaCiclo!=null && l.media>0 ? (l.vendaCiclo-l.media)/l.media*100 : null; };
function decisaoDe(l, cfg){
  if(l.vendaCiclo==null) return null;
  if(l.fixo) return "mantem";   // prazo fixo: o Marcus decidiu deixar direto nesse prazo
  var cr = crescimento(l);
  return l.minimo>0 ? (l.vendaCiclo>=l.minimo ? "mantem" : "volta30") : (cr!==null && cr>=cfg.crescimentoMin ? "mantem" : "volta30");
}
var decisaoFinal = function(l, cfg){ return l.decisao || decisaoDe(l, cfg); };
var DECISOES = {mantem:{lb:"Mantém", cor:"#4ADE80"}, volta30:{lb:"Volta a 30 dias", cor:"#F87171"}};
// momento do ciclo de uma aprovada: avaliada (tem venda lançada), vencido (a nova data já passou e falta lançar a venda) ou aguardando
function cicloDe(l, hojeIso){ return l.vendaCiclo!=null ? "avaliada" : (mesDe(l.nova) && l.nova<=hojeIso ? "vencido" : "aguardando"); }
var hojeIsoLocal = function(){ var d = new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2, "0")+"-"+String(d.getDate()).padStart(2, "0"); };
var diasEntre = function(a, b){ return mesDe(a) && mesDe(b) ? Math.round((new Date(b+"T12:00:00Z")-new Date(a+"T12:00:00Z"))/864e5) : null; };

// números que a Diretoria acompanha à mão (resumo de 24/10/2026): acertos de outubro que SAÍRAM, confirmados, e quantos ainda podem entrar (em análise e saídas da empresa, listas novas, linhas fora da planilha)
var ALINHA_PADRAO = {confirmadas:92, analise:7, novas:2, extra:1, nota:""};

// ---------- estado ----------
function p45Vazio(){ return {v:2, seq:0, linhas:[], pedidos:[], alinha:clone(ALINHA_PADRAO), config:clone(CONFIG_PADRAO), log:[]}; }
function p45Migrar(p){
  if(!p) return p45Vazio();
  var base = p45Vazio();
  Object.keys(base).forEach(function(k){ if(p[k]===undefined) p[k] = base[k]; });
  Object.keys(CONFIG_PADRAO).forEach(function(k){ if(p.config[k]===undefined) p.config[k] = clone(CONFIG_PADRAO[k]); });
  p.alinha = Object.assign(clone(ALINHA_PADRAO), p.alinha||{});
  p.linhas.forEach(function(l){ if(l.canal===undefined) l.canal = "representante"; if(l.fixo===undefined) l.fixo = false; });
  return p;
}
var temLocal = function(){ return !!(LOCAL && LOCAL.linhas && LOCAL.linhas.length); };
var origemLocal = function(){ return LOCAL ? LOCAL.origem : ""; };

function linhaNova(d, id, por){
  var prazo = d.prazo===45 || d.prazo===60 ? d.prazo : null;
  return {id:id, rep:trim(d.rep), nome:trim(d.nome).replace(/\s+/g, " "), codigo:trim(d.codigo), tel:trim(d.tel), origem:d.origem || "representante", motivo:d.motivo || "",
    orig:mesDe(d.orig) ? d.orig : null, prazo:prazo, prazoOrig:prazo ? null : (d.prazoOrig!=null ? d.prazoOrig : null), nova:mesDe(d.nova) ? d.nova : novaCalculada(d.orig, prazo),
    media:d.media>0 ? Math.round(d.media) : null, minimo:d.minimo>0 ? Math.round(d.minimo) : null,
    canal:d.canal==="sorelly" ? "sorelly" : "representante", fixo:!!d.fixo, situacao:d.situacao || "analise", via:d.via || "sistema", decididoPor:d.decididoPor || "", decididoEm:d.decididoEm || "",
    contato:d.contato || "", rh:d.rh===true || d.rh===false ? d.rh : null, entrega:d.entrega || null, contatoEm:d.contatoEm || "", vendaCiclo:null, vendaEm:"", decisao:"", decisaoManual:false, obs:trim(d.obs),
    criadoPor:por, criadoEm:agoraIso()};
}

// ---------- ações (usadas pelo reducer) ----------
// devolve {patch, msg}; patch vazio + msg = recusado. Quando muda a meta do Agendamento, o patch leva também agend e metaMensal.
function p45Reduz(s, a){
  var p = clone(s.p45 || p45Vazio()), cfg = p.config, por = a.por || "—", hojeYm = chaveMes(new Date()), ag = s.agend;
  var recusa = function(t){ return {patch:{}, msg:t}; };
  var ok = function(msg, extra){ p.log.push({em:agoraIso(), por:por, op:a.op, txt:msg||""}); if(p.log.length>500) p.log = p.log.slice(-500); return {patch:Object.assign({p45:p}, extra||{}), msg:msg}; };
  var achar = function(id){ return p.linhas.filter(function(x){ return x.id===id; })[0]; };
  var ligar = function(ls, quem){   // grava na meta do Agendamento as linhas aprovadas que mudam de mês
    var itens = ls.filter(function(l){ var f = efeitoMeta(l, ag, hojeYm); return l.situacao==="aprovada" && f.tipo==="sai" && !naMeta(l, ag); }).map(function(l){ var f = efeitoMeta(l, ag, hojeYm); return {planoId:l.id, nome:l.nome, tipo:l.prazo===45 ? "p45" : "p60", autorizadoPor:quem, origem:f.origem, destino:f.destino}; });
    if(!itens.length) return {r:null, n:0};
    var r = agendReduz(s, {op:"remarc_plano", por:por, itens:itens}); return {r:r, n:itens.length};
  };
  var desligar = function(ids){ return ids.length ? agendReduz(s, {op:"remarc_plano_del", por:por, ids:ids}) : null; };
  switch(a.op){
    case "add": {
      if(!podeLancar(s.usuario)) return recusa("Sem autorização para lançar indicações do plano 45/60.");
      var d = a.dados || {};
      if(!trim(d.rep)) return recusa("Escolha a representante.");
      if(!nomeCompleto(d.nome)) return recusa("Escreva o nome completo da revendedora.");
      if(!mesDe(d.orig)) return recusa("Informe a data do acerto original.");
      if(d.prazo!==45 && d.prazo!==60) return recusa("O prazo é 45 ou 60 dias.");
      var nv = mesDe(d.nova) ? d.nova : novaCalculada(d.orig, d.prazo); if(!nv) return recusa("Informe a nova data do acerto.");
      var dup = p.linhas.filter(function(x){ return (trim(d.codigo) && norm(x.codigo)===norm(d.codigo)) || norm(x.nome)===norm(d.nome); })[0];
      if(dup) return recusa(dup.nome+" já está no plano ("+SITUACOES[dup.situacao].lb.toLowerCase()+", representante "+repCurto(dup.rep)+").");
      p.seq++; var l = linhaNova(Object.assign({}, d, {nova:nv}), "p"+p.seq, por); p.linhas.push(l);
      return ok(l.nome+" entrou no plano para análise");
    }
    case "edit": {
      if(!podeLancar(s.usuario)) return recusa("Sem autorização para alterar o plano 45/60.");
      var x = achar(a.id); if(!x) return recusa("Linha não encontrada.");
      var d2 = a.dados || {}, trava = x.situacao==="aprovada" && naMeta(x, ag);
      var muda = ["orig", "prazo", "nova"].some(function(k){ return d2[k]!==undefined && d2[k]!==x[k]; });
      if(trava && muda) return recusa("Esta linha já está na meta do Agendamento. Desfaça a aprovação para mudar prazo ou datas.");
      var nome2 = d2.nome!==undefined ? trim(d2.nome).replace(/\s+/g, " ") : x.nome;
      if(!nomeCompleto(nome2)) return recusa("Escreva o nome completo da revendedora.");
      if(p.linhas.some(function(y){ return y.id!==x.id && norm(y.nome)===norm(nome2); })) return recusa(nome2+" já está no plano.");
      ["rep", "codigo", "tel", "origem", "motivo", "contato", "obs"].forEach(function(k){ if(d2[k]!==undefined) x[k] = typeof d2[k]==="string" ? trim(d2[k]) : d2[k]; });
      if(d2.canal!==undefined) x.canal = d2.canal==="sorelly" ? "sorelly" : "representante";
      if(d2.fixo!==undefined) x.fixo = !!d2.fixo;
      x.nome = nome2;
      if(d2.orig!==undefined) x.orig = mesDe(d2.orig) ? d2.orig : null;
      if(d2.prazo!==undefined){ x.prazo = d2.prazo===45 || d2.prazo===60 ? d2.prazo : null; if(x.prazo) x.prazoOrig = null; }
      if(d2.nova!==undefined) x.nova = mesDe(d2.nova) ? d2.nova : null;
      if(!x.nova) x.nova = novaCalculada(x.orig, x.prazo);
      if(d2.media!==undefined) x.media = d2.media>0 ? Math.round(d2.media) : null;
      if(d2.minimo!==undefined) x.minimo = d2.minimo>0 ? Math.round(d2.minimo) : null;
      return ok(x.nome+" atualizada");
    }
    case "aprovar": {
      if(!podeAprovar(s.usuario)) return recusa("Só quem tem a autorização de aprovar o plano 45/60 (Diretoria) decide.");
      var l1 = achar(a.id); if(!l1) return recusa("Linha não encontrada.");
      if(l1.situacao==="aprovada") return recusa(l1.nome+" já está aprovada.");
      var d3 = a.dados || {};
      if(d3.prazo!==undefined) l1.prazo = d3.prazo===45 || d3.prazo===60 ? d3.prazo : null;
      if(l1.prazo) l1.prazoOrig = null;
      if(d3.nova!==undefined) l1.nova = mesDe(d3.nova) ? d3.nova : null;
      if(!l1.nova) l1.nova = novaCalculada(l1.orig, l1.prazo);
      if(d3.media!==undefined) l1.media = d3.media>0 ? Math.round(d3.media) : null;
      if(d3.minimo!==undefined) l1.minimo = d3.minimo>0 ? Math.round(d3.minimo) : null;
      var gr = pendencias(l1, hojeYm, cfg).filter(function(y){ return y.grave; });
      if(gr.length) return recusa("Antes de aprovar, corrija: "+gr.map(function(y){ return y.txt.toLowerCase(); }).join(", ")+".");
      if(!(l1.minimo>0)) return recusa("Fixe o mínimo de vendas do ciclo (em reais) antes de aprovar.");
      l1.situacao = "aprovada"; l1.via = "sistema"; l1.decididoPor = por; l1.decididoEm = agoraIso();
      var lg = ligar([l1], por), msg1 = l1.nome+" aprovada: "+l1.prazo+" dias, nova data "+fmtData(l1.nova);
      var f1 = efeitoMeta(l1, ag, hojeYm);
      msg1 += f1.tipo==="sai" ? ". Saiu da meta de "+nomeMes(f1.origem)+" e entrou em "+nomeMes(f1.destino) : f1.tipo==="atrasada" ? ". Acerto de mês anterior: a meta não foi mexida (confirme)" : ". Continua na meta de "+nomeMes(f1.origem);
      return ok(msg1, lg.r ? lg.r.patch : null);
    }
    case "situacao": {   // reprovar, sem interesse, saiu, ou voltar para análise (desfaz a aprovação)
      if(!podeAprovar(s.usuario)) return recusa("Só a Diretoria decide o plano 45/60.");
      var l2 = achar(a.id); if(!l2) return recusa("Linha não encontrada.");
      if(!SITUACOES[a.sit]) return recusa("Situação inválida.");
      var eraAprov = l2.situacao==="aprovada", dl = eraAprov ? desligar([l2.id]) : null;
      l2.situacao = a.sit; l2.decididoPor = a.sit==="analise" ? "" : por; l2.decididoEm = a.sit==="analise" ? "" : agoraIso(); if(a.motivo) l2.obs = trim(a.motivo);
      return ok(l2.nome+": "+SITUACOES[a.sit].lb.toLowerCase()+(eraAprov && dl && dl.patch.agend ? " (saiu do ajuste da meta do Agendamento)" : ""), dl ? dl.patch : null);
    }
    case "importar": {
      if(!podeAprovar(s.usuario)) return recusa("Só a Diretoria importa a planilha do plano 45/60.");
      if(!temLocal()) return recusa("Não há planilha local neste computador (domain/plano45-60.local.js).");
      var reps = (ag && ag.config && ag.config.representantes) || [], novas = 0, repetidas = 0, mapa = {analise:"analise", aprovada:"aprovada", "aprovada nova marcus":"aprovada", reprovada:"reprovada", saiu:"saiu", "nao tem interesse":"sem_interesse"}, atualizadas = 0;
      LOCAL.linhas.forEach(function(r){
        var igual = p.linhas.find(function(y){ return norm(y.nome)===norm(r.nome); });
        if(igual){   // já está no plano: linha que veio de planilha só recebe os números novos (média, mínimo e "Ana do RH chamou"); o que foi decidido ou lançado no sistema não muda
          repetidas++;
          if(igual.via==="planilha" || igual.via==="nova"){
            var mm = r.media>0 ? Math.round(r.media) : null, mi = r.minimo>0 ? Math.round(r.minimo) : null, mudou = false;
            if(mm!==igual.media){ igual.media = mm; mudou = true; } if(mi!==igual.minimo){ igual.minimo = mi; mudou = true; }
            if((r.rh===true || r.rh===false) && igual.rh!==r.rh){ igual.rh = r.rh; mudou = true; }
            if(mudou) atualizadas++; }
          return; }
        var sit = mapa[norm(r.sit)] || "analise", prazoOk = r.prazo===45 || r.prazo===60;
        p.seq++; var l = linhaNova({rep:repResolve(r.rep, reps), nome:r.nome, orig:r.orig, prazo:prazoOk ? r.prazo : null, prazoOrig:prazoOk ? null : r.prazo, nova:prazoOk ? r.nova : null, media:r.media, minimo:r.minimo,
          situacao:sit, via:norm(r.sit)==="aprovada nova marcus" ? "nova" : "planilha", decididoPor:sit==="analise" ? "" : "Marcus (planilha)", decididoEm:sit==="analise" ? "" : agoraIso(), contato:r.contato==="REPROVADA" ? "" : r.contato, rh:r.rh, entrega:r.entrega}, "p"+p.seq, por);
        p.linhas.push(l); novas++;
      });
      if(!novas && !atualizadas) return recusa("Nada novo para importar: as "+repetidas+" linhas da planilha já estão no plano.");
      return ok(novas+" linhas importadas da planilha"+(atualizadas ? ", "+atualizadas+" atualizadas (média, mínimo ou RH)" : "")+(repetidas ? " ("+repetidas+" já estavam no plano)" : "")+". Nada foi mexido na meta do Agendamento ainda.");
    }
    case "aplicar_meta": {   // aprovadas que mudam de mês e ainda não estão na meta (ex.: vindas da planilha)
      if(!podeAprovar(s.usuario)) return recusa("Só a Diretoria ajusta a meta pelo plano 45/60.");
      var lg2 = ligar(p.linhas, "Marcus");
      if(!lg2.n) return recusa("Nenhuma aprovada para ajustar: todas já estão na meta ou não mudam de mês.");
      if(!lg2.r || !lg2.r.patch.agend) return recusa(lg2.r ? lg2.r.msg : "Não foi possível ajustar a meta.");
      return ok(lg2.r.msg, lg2.r.patch);
    }
    case "acomp": {   // contato, RH, entrega do kit e venda no ciclo de uma aprovada
      if(!podeLancar(s.usuario)) return recusa("Sem autorização para registrar o acompanhamento do plano 45/60.");
      var l3 = achar(a.id); if(!l3) return recusa("Linha não encontrada.");
      if(l3.situacao!=="aprovada") return recusa("O acompanhamento é das aprovadas.");
      var d4 = a.dados || {};
      if(d4.contato!==undefined){ if(d4.contato && CONTATOS.indexOf(d4.contato)<0) return recusa("Contato inválido."); l3.contato = d4.contato; }
      if(d4.contatoEm!==undefined) l3.contatoEm = mesDe(d4.contatoEm) ? d4.contatoEm : "";
      if(l3.contato && !l3.contatoEm) l3.contatoEm = hojeIsoLocal();   // contato registrado sem data = hoje
      if(d4.rh!==undefined) l3.rh = d4.rh===true || d4.rh===false ? d4.rh : null;
      if(d4.entrega!==undefined) l3.entrega = mesDe(d4.entrega) ? d4.entrega : null;
      if(d4.venda!==undefined){
        if(d4.venda===null || d4.venda===""){ l3.vendaCiclo = null; l3.vendaEm = ""; if(!l3.decisaoManual) l3.decisao = ""; }
        else { var vv = Math.round(Number(d4.venda)); if(!(vv>=0)) return recusa("Informe a venda do ciclo em reais."); l3.vendaCiclo = vv; l3.vendaEm = hojeIsoLocal(); if(!l3.decisaoManual) l3.decisao = decisaoDe(l3, cfg) || ""; }
      }
      var fim = decisaoFinal(l3, cfg);
      return ok(l3.nome+" atualizada"+(d4.venda!==undefined && fim ? ": "+DECISOES[fim].lb.toLowerCase() : ""));
    }
    case "decisao": {   // a Diretoria muda a decisão do ciclo à mão, ou volta para o cálculo automático (valor vazio)
      if(!podeAprovar(s.usuario)) return recusa("Só a Diretoria muda a decisão do ciclo.");
      var l4 = achar(a.id); if(!l4) return recusa("Linha não encontrada.");
      if(l4.vendaCiclo==null) return recusa("Lance a venda do ciclo antes de decidir.");
      if(a.valor && !DECISOES[a.valor]) return recusa("Decisão inválida.");
      l4.decisaoManual = !!a.valor; l4.decisao = a.valor || decisaoDe(l4, cfg) || "";
      return ok(l4.nome+": "+(a.valor ? DECISOES[a.valor].lb.toLowerCase()+" (decidido à mão)" : "decisão volta ao cálculo automático"));
    }
    case "pedido_novo": {   // a REPRESENTANTE pede, pelo app, a mudança da data do acerto de uma revendedora dela
      var q = a.dados || {}, hojeI = hojeIsoLocal();
      if(!nomeCompleto(q.nome)) return recusa("Escolha a revendedora.");
      if(!mesDe(q.dataAtual) || !mesDe(q.novaData)) return recusa("Informe a nova data do acerto.");
      if(q.novaData<hojeI) return recusa("A nova data não pode ser no passado.");
      if(q.novaData===q.dataAtual) return recusa("A nova data é igual à data atual.");
      var prz = q.prazo===45 || q.prazo===60 ? q.prazo : 0;
      if(!trim(q.motivo)) return recusa("Escolha o motivo.");
      if((p.pedidos||[]).some(function(x){ return x.status==="analise" && norm(x.nome)===norm(q.nome); })) return recusa(trim(q.nome)+" já tem um pedido aguardando aprovação.");
      var dias = diasEntre(q.dataAtual, q.novaData), livre = !prz && dias<=cfg.diasLivres;
      p.seq++; var pd = {id:"d"+p.seq, rep:trim(q.rep), nome:trim(q.nome).replace(/\s+/g, " "), codigo:trim(q.codigo), dataAtual:q.dataAtual, novaData:q.novaData, dias:dias, prazo:prz, fixo:!!q.fixo && prz>0, motivo:trim(q.motivo), obs:trim(q.obs),
        status:livre ? "registrada" : "analise", criadoPor:por, criadoEm:agoraIso(), decididoPor:livre ? "Automático" : "", decididoEm:livre ? agoraIso() : "", minimo:null};
      p.pedidos = (p.pedidos||[]).concat([pd]);
      if(livre){
        var oP = mesDe(pd.dataAtual), nP = mesDe(pd.novaData), rmP = oP!==nP && oP>=hojeYm && !(ag.mes[oP] && ag.mes[oP].fechadoEm) ? agendReduz(s, {op:"remarc_plano", por:por, itens:[{planoId:"pd"+pd.id, nome:pd.nome, tipo:"outro", autorizadoPor:"Automático", origem:oP, destino:nP}]}) : null;
        return ok(pd.nome+": data alterada para "+fmtData(pd.novaData)+" (até "+cfg.diasLivres+" dias do acerto, vale na hora)", rmP && rmP.patch.agend ? rmP.patch : null);
      }
      var al = {id:"AL"+Date.now(), tipo:"p45_pedido", chave:"p45_pedido:"+pd.id, ref:pd.id, titulo:"Pedido de mudança de data", texto:repCurto(pd.rep)+" pediu "+fmtData(pd.novaData)+" para "+pd.nome+(prz ? " ("+prz+" dias)" : "")+". Aprove em Agendamento → Plano 45/60 → Aprovação.", para:destinosDe(s, "p45_pedido"), aba:"p45apr", cor:null, ts:Date.now(), lidoPor:[]};
      return ok(pd.nome+": pedido enviado, aguardando aprovação. Sem aprovação, vale a multa de remarcação", {alertas:[al].concat(s.alertas||[]).slice(0, 200)});
    }
    case "pedido_decidir": {
      if(!podeAprovar(s.usuario)) return recusa("Só a Diretoria decide os pedidos de mudança de data.");
      var pe = (p.pedidos||[]).filter(function(x){ return x.id===a.id; })[0]; if(!pe) return recusa("Pedido não encontrado.");
      if(pe.status!=="analise") return recusa("Este pedido já foi decidido.");
      if(a.valor!=="aprovada" && a.valor!=="reprovada") return recusa("Decisão inválida.");
      pe.status = a.valor; pe.decididoPor = por; pe.decididoEm = agoraIso(); if(a.motivo) pe.respostaTxt = trim(a.motivo);
      if(a.valor==="reprovada") return ok(pe.nome+": pedido reprovado. Vale a multa de remarcação");
      if(pe.prazo){
        var ex = p.linhas.filter(function(x){ return norm(x.nome)===norm(pe.nome); })[0];
        if(ex && naMeta(ex, ag)) return recusa(pe.nome+" já está na meta do Agendamento pelo plano. Desfaça a aprovação dela em Aprovação e tente de novo.");
        var mn = a.minimo>0 ? Math.round(a.minimo) : minimoSugerido(pe.prazo, "representante", cfg);
        var dadosL = {rep:pe.rep, nome:pe.nome, codigo:pe.codigo, orig:pe.dataAtual, prazo:pe.prazo, nova:pe.novaData, minimo:mn, motivo:"outro", origem:"representante", situacao:"aprovada", via:"app", decididoPor:por, decididoEm:agoraIso(), obs:pe.motivo, fixo:pe.fixo, canal:"representante"};
        var ln; if(ex){ Object.assign(ex, {rep:pe.rep, orig:pe.dataAtual, prazo:pe.prazo, prazoOrig:null, nova:pe.novaData, minimo:mn||ex.minimo, situacao:"aprovada", via:"app", decididoPor:por, decididoEm:agoraIso(), fixo:pe.fixo, canal:"representante"}); ln = ex; }
        else { p.seq++; ln = linhaNova(dadosL, "p"+p.seq, por); p.linhas.push(ln); }
        pe.linhaId = ln.id;
        var lgP = ligar([ln], por);
        return ok(pe.nome+": pedido aprovado, "+pe.prazo+" dias, nova data "+fmtData(pe.novaData)+(pe.fixo ? ", prazo fixo" : "")+(lgP.r ? ". Saiu da meta de "+nomeMes(mesDe(ln.orig))+" e entrou em "+nomeMes(mesDe(ln.nova)) : ""), lgP.r ? lgP.r.patch : null);
      }
      var oD = mesDe(pe.dataAtual), nD = mesDe(pe.novaData), rmD = oD!==nD && oD>=hojeYm && !(ag.mes[oD] && ag.mes[oD].fechadoEm) ? agendReduz(s, {op:"remarc_plano", por:por, itens:[{planoId:"pd"+pe.id, nome:pe.nome, tipo:"outro", autorizadoPor:por, origem:oD, destino:nD}]}) : null;
      return ok(pe.nome+": pedido aprovado, nova data "+fmtData(pe.novaData)+" sem multa"+(rmD && rmD.patch.agend ? ". Saiu da meta de "+nomeMes(oD)+" e entrou em "+nomeMes(nD) : ""), rmD && rmD.patch.agend ? rmD.patch : null);
    }
    case "alinha": {   // números informados da conversa de alinhamento (Alinhamento)
      if(!podeAprovar(s.usuario)) return recusa("Só a Diretoria muda os números do alinhamento.");
      var an = a.dados || {}, nn = function(v){ var n = Math.round(Number(v)); return n>=0 ? n : null; };
      ["confirmadas", "analise", "novas", "extra"].forEach(function(k){ if(an[k]!==undefined){ var n = nn(an[k]); if(n!==null) p.alinha[k] = n; } });
      if(an.nota!==undefined) p.alinha.nota = trim(an.nota);
      return ok("Números do alinhamento salvos");
    }
    case "config": {   // parâmetros do plano (Configurador geral)
      if(!podeAprovar(s.usuario)) return recusa("Só a Diretoria muda os parâmetros do plano 45/60.");
      var cc = a.dados || {}, num = function(v){ var n = Math.round(Number(v)); return n>=0 ? n : null; };
      ["mediaAcerto", "minimoPorRep", "janelaIni", "janelaFim", "teto", "crescimentoMin", "diasLivres"].forEach(function(k){ if(cc[k]!==undefined){ var n = num(cc[k]); if(n!==null) cfg[k] = n; } });
      if(cc.minimos) ["representante", "sorelly"].forEach(function(c){ [45, 60].forEach(function(z){ var n = cc.minimos[c] && num(cc.minimos[c][z]); if(n) cfg.minimos[c][z] = n; }); });
      return ok("Parâmetros do plano 45/60 salvos");
    }
    default: return recusa("Ação desconhecida.");
  }
}

// ---------- números do painel ----------
function resumoPlano(s, ymEscolhido){
  var p = s.p45, ag = s.agend, cfg = p.config, hojeYm = chaveMes(new Date()), ym = ymEscolhido || mesAberto(ag) || hojeYm;
  var ls = p.linhas, porSit = {}; ORDEM_SIT.forEach(function(k){ porSit[k] = 0; });
  var pend = {sem_media:0, prazo:0, nova:0, sem_contato:0, sem_retorno:0, atrasada:0, janela:0, fora_meta:0, sem_minimo:0};
  var fluxo = {}, repsMap = {}, minimoTotal = 0, saiMes = 0;
  ls.forEach(function(l){
    porSit[l.situacao]++;
    var pe = pendencias(l, hojeYm, cfg), f = efeitoMeta(l, ag, hojeYm), tem = function(k){ return pe.some(function(x){ return x.k===k; }); };
    if(l.situacao==="analise" || l.situacao==="aprovada"){ if(tem("media")) pend.sem_media++; if(tem("prazo")) pend.prazo++; if(tem("nova") && !tem("prazo")) pend.nova++; }
    if(l.situacao==="aprovada"){
      minimoTotal += l.minimo||0; if(tem("contato")) pend.sem_contato++; if(tem("semretorno")) pend.sem_retorno++; if(tem("minimo")) pend.sem_minimo++; if(tem("atrasada")) pend.atrasada++; if(tem("janela")) pend.janela++;
      if(f.tipo!=="incompleta"){ var k = f.origem+">"+f.destino, c = fluxo[k] || (fluxo[k] = {origem:f.origem, destino:f.destino, tipo:f.tipo, aprovadas:0, naMeta:0}); c.aprovadas++; if(naMeta(l, ag)) c.naMeta++; }
      if(f.tipo==="sai" && !naMeta(l, ag)) pend.fora_meta++;
      if(f.tipo==="sai" && f.origem===ym) saiMes++;
    }
    var rp = repsMap[l.rep] || (repsMap[l.rep] = {rep:l.rep, total:0, analise:0, aprovada:0, outras:0});
    rp.total++; if(l.situacao==="analise") rp.analise++; else if(l.situacao==="aprovada") rp.aprovada++; else rp.outras++;
  });
  // representantes ativas do cadastro que ainda não indicaram ninguém
  ((ag.config && ag.config.representantes) || []).filter(function(r){ return r.ativo; }).forEach(function(r){
    if(!Object.keys(repsMap).some(function(k){ return repConfere(k, r.nome) || norm(k)===norm(r.nome); })) repsMap[r.nome] = {rep:r.nome, total:0, analise:0, aprovada:0, outras:0};
  });
  var foraCadastro = Object.keys(repsMap).filter(function(k){ return !((ag.config && ag.config.representantes) || []).some(function(r){ return norm(r.nome)===norm(k) || repConfere(k, r.nome); }) && repsMap[k].total+repsMap[k].outras>0; });
  // efeito do plano no mês: só as remarcações que vieram do plano
  var rm = (ag.remarc||[]).filter(function(r){ return r.planoId; }), saemPlano = rm.filter(function(r){ return r.origem===ym && r.destino!==ym; }).length, entramPlano = rm.filter(function(r){ return r.destino===ym && r.origem!==ym; }).length;
  var mesAg = ag.mes[ym], base = mesAg ? (mesAg.previstos||0) : null, ajust = mesAg ? previstosAjustados(ag, ym, base) : null, mv = movimentos(ag, ym);
  var cen = mesAg ? [94, 95, 96].map(function(pc){ var ac = Math.round(ajust*pc/100); return {pct:pc, acertos:ac, valor:ac*cfg.mediaAcerto}; }) : [];
  var hj = hojeIsoLocal(), ap = ls.filter(function(l){ return l.situacao==="aprovada"; }), cic = {aprovadas:ap.length, avaliadas:0, mantem:0, volta30:0, vencidas:0, aguardando:0, semContato:0, cresc:[]};
  ap.forEach(function(l){ var c = cicloDe(l, hj); if(c==="avaliada"){ cic.avaliadas++; var d = decisaoFinal(l, cfg); if(d==="mantem") cic.mantem++; else cic.volta30++; var cr = crescimento(l); if(cr!==null) cic.cresc.push(cr); } else if(c==="vencido") cic.vencidas++; else cic.aguardando++; if(!l.contato) cic.semContato++; });
  cic.taxa = cic.avaliadas ? cic.mantem/cic.avaliadas*100 : null; cic.crescMedio = cic.cresc.length ? cic.cresc.reduce(function(t, x){ return t+x; }, 0)/cic.cresc.length : null;
  var pedAnalise = (p.pedidos||[]).filter(function(x){ return x.status==="analise"; }).length;
  return {pedAnalise:pedAnalise, ciclo:cic, ym:ym, total:ls.length, porSit:porSit, pend:pend, fluxo:Object.keys(fluxo).sort().map(function(k){ return fluxo[k]; }), reps:Object.keys(repsMap).map(function(k){ return repsMap[k]; }).sort(function(x, y){ return y.total-x.total || (norm(x.rep)<norm(y.rep) ? -1 : 1); }),
    foraCadastro:foraCadastro, minimoTotal:minimoTotal, saiMes:saiMes, mesAberto:!!mesAg, base:base, ajustados:ajust, saemPlano:saemPlano, entramPlano:entramPlano, outrasSaidas:mv.nSaem-saemPlano, outrasChegadas:mv.nEntram-entramPlano, cenarios:cen, semPlano:mesAg ? ajust+saemPlano-entramPlano : null};
}

// ---------- alertas (App.js confere a cada 10 minutos; um alerta por tipo por dia, com a contagem) ----------
// aprovada sem contato registrado há mais de 24 horas · nova data já chegou e a venda do ciclo não foi lançada · representante com menos indicadas que o mínimo (só no primeiro dia útil da semana)
function p45Alertas(s, agoraMs){
  var p = s.p45; if(!p || !p.linhas || !p.linhas.length) return [];
  var agora = agoraMs || Date.now(), dia = new Date(agora), iso = dia.getFullYear()+"-"+String(dia.getMonth()+1).padStart(2, "0")+"-"+String(dia.getDate()).padStart(2, "0"), cfg = p.config, out = [];
  var semContato = p.linhas.filter(function(l){ return l.situacao==="aprovada" && !l.contato && l.decididoEm && agora-new Date(l.decididoEm).getTime()>24*3600*1000; });
  if(semContato.length) out.push({tipo:"p45_contato", chave:"p45_contato:"+iso, titulo:"Plano 45/60: "+semContato.length+" aprovada"+(semContato.length===1 ? "" : "s")+" sem contato", texto:"Aprovadas há mais de 24 horas sem contato registrado com a revendedora. Registre em Plano 45/60 → Acompanhamento.", aba:"p45acomp"});
  var semVenda = p.linhas.filter(function(l){ return l.situacao==="aprovada" && l.vendaCiclo==null && mesDe(l.nova) && l.nova<=iso; });
  if(semVenda.length) out.push({tipo:"p45_venda", chave:"p45_venda:"+iso, titulo:"Plano 45/60: "+semVenda.length+" acerto"+(semVenda.length===1 ? "" : "s")+" sem venda lançada", texto:"A nova data já chegou e a venda do ciclo não foi lançada. Lance em Plano 45/60 → Acompanhamento para decidir mantém ou volta a 30 dias.", aba:"p45acomp"});
  return out;
}

export { p45Alertas, crescimento, decisaoDe, decisaoFinal, DECISOES, cicloDe, hojeIsoLocal, diasEntre, CONFIG_PADRAO, SITUACOES, ORDEM_SIT, CONTATOS, MOTIVOS, ORIGENS, minimoSugerido, addDias, mesDe, fmtData, novaCalculada, rotuloMes, repConfere, repResolve, repCurto, nomeCompleto, pendencias, temGrave, efeitoMeta, naMeta,
  podeAprovar, podeLancar, p45Vazio, p45Migrar, temLocal, origemLocal, p45Reduz, resumoPlano, norm };
