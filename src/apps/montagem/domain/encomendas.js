import { globLocal } from "@/lib/glob-local";
// Sorelly Admin · montagem — domain/encomendas.js
// Encomendas e Reposições (ESBOÇO, 16/10/2026; contexto e regras em ENCOMENDAS-REPOSICOES.md). Módulo novo: não existe no SorellyAdmin.
// Controle INTERNO dos pedidos que hoje chegam bagunçados pelo WhatsApp: reposição, liberação de expositor e encomenda. (Decisão de 07/10/2026: reposição NÃO é oferecida às revendedoras por ora.)
// Estado s.er (só neste navegador). Nasce VAZIO (repositório é público). Dados reais, se existirem, vêm só de domain/encomendas.local.js (gitignored):
//   export default {config:{...parcial}, revendedoras:[{nome, representante, media3m, maiorVenda}], pedidos:[...]}
// Funções puras (sem React/DOM). Dinheiro em reais; datas ISO no fuso America/Sao_Paulo ("2026-10-16" ou "2026-10-16T14:30:00").
// Ações (type "ER", op = nome): rev_salvar, rev_excluir, ped_criar, ped_mover, ped_agendar, ped_foto, ped_nota, bloqueio_avaliar, bloqueio_remover, config_salvar. Toda ação guarda a.por.
// Pendências (perguntas ao Marcus): regras das ENCOMENDAS (campos livres por enquanto), de onde vem a média dos 3 meses (hoje digitada), o que conta como "vendas" para o bloqueio de 30%.

import { hojeSP, agoraSP, somaDias } from "./cadastro-leads";
import { DIRETORIA } from "./equipe";

var LOCAL = (function(){ try { var m = globLocal("apps/montagem/domain/encomendas.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(x){ return null; } })();

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var p2 = function(n){ return String(n).padStart(2,"0"); };
var num = function(v){ var n = Number(typeof v==="string" ? v.replace(",", ".") : v); return isFinite(n) ? n : 0; };
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var trim = function(v){ return String(v==null ? "" : v).trim(); };
var norm = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
var diaDe = function(iso){ return iso ? String(iso).slice(0,10) : ""; };
var vazioN = function(v){ return v===undefined || v===null || v==="" || (typeof v==="number" && isNaN(v)); };
function minutosDe(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(String(iso||"")); if(!m) return null; return Date.UTC(+m[1], +m[2]-1, +m[3], +(m[4]||0), +(m[5]||0), +(m[6]||0))/60000; }
var diaValido = function(d){ return /^\d{4}-\d{2}-\d{2}$/.test(String(d||"")) && !isNaN(minutosDe(d)) && minutosDe(d)!==null; };

// ---------- formatação ----------
function formatarReais(v){ return "R$ "+Number(v||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); }
function formatarDia(dia){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dia||"")); return m ? m[3]+"/"+m[2]+"/"+m[1] : ""; }
function formatarDataHora(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(String(iso||"")); return m ? m[3]+"/"+m[2]+"/"+m[1]+(m[4] ? " "+m[4]+":"+m[5] : "") : ""; }
// soma meses a uma data ISO (dia 31 + 1 mês cai no último dia do mês seguinte)
function somaMeses(dia, n){
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dia||"")); if(!m) return "";
  var t = (+m[1])*12 + (+m[2]-1) + n, ano = Math.floor(t/12), mes = t%12, ult = new Date(Date.UTC(ano, mes+1, 0)).getUTCDate();
  return ano+"-"+p2(mes+1)+"-"+p2(Math.min(+m[3], ult));
}

// ---------- vocabulário ----------
var TIPOS = [["reposicao", "Reposição"], ["expositor", "Expositor"], ["encomenda", "Encomenda"]];
var ROTULO_TIPO = {reposicao:"Reposição", expositor:"Expositor", encomenda:"Encomenda"};
var COR_TIPO = {reposicao:"#60A5FA", expositor:"#F3D98B", encomenda:"#F97316"};
var ICONE_TIPO = {reposicao:"arrows-clockwise", expositor:"storefront", encomenda:"package"};
var STATUS = ["novo", "conferindo", "comprovante", "separando", "agendado", "representante", "atendimento", "bipagem", "concluido", "recusado", "cancelado"];
var ROTULO_STATUS = {novo:"Novo", conferindo:"Conferindo", comprovante:"Aguardando comprovante", separando:"Separando", agendado:"Agendado", representante:"Com a representante", atendimento:"Em atendimento", bipagem:"Bipagem", concluido:"Concluído", recusado:"Recusado", cancelado:"Cancelado"};
var COR_STATUS = {novo:"#9CA3AF", conferindo:"#38BDF8", comprovante:"#F87171", separando:"#D4A64A", agendado:"#A78BFA", representante:"#34D399", atendimento:"#F472B6", bipagem:"#A3E635", concluido:"#4ADE80", recusado:"#EF4444", cancelado:"#94A3B8"};
// etapas de cada canal (22/10/2026): o cartão só anda dentro do caminho do seu canal
var CAMINHOS = {
  entrega:["novo", "conferindo", "comprovante", "separando", "agendado", "concluido"],
  representante:["novo", "conferindo", "representante", "bipagem", "concluido"],
  empresa:["novo", "conferindo", "agendado", "atendimento", "bipagem", "concluido"],
  encomenda:["novo", "conferindo", "separando", "concluido"],
  padrao:["novo", "conferindo", "separando", "agendado", "concluido"]};
var FLUXO = ["novo", "conferindo", "comprovante", "separando", "agendado", "representante", "atendimento", "bipagem", "concluido"];   // colunas do funil, na ordem
var TRANSICOES = CAMINHOS;
function caminhoDe(p){ return p.tipo==="encomenda" ? CAMINHOS.encomenda : p.tipo==="reposicao" ? (CAMINHOS[p.canal] || CAMINHOS.padrao) : CAMINHOS.padrao; }
var EXIGE_MOTIVO = {recusado:1, cancelado:1};
var FINAIS = {concluido:1, recusado:1, cancelado:1};
var FORMAS = [["entrega", "Entrega pelo entregador"], ["retirada_empresa", "Retirada na empresa"], ["retirada_acerto", "Retirada na data do acerto"]];
var ROTULO_FORMA = {entrega:"Entrega", retirada_empresa:"Retirada na empresa", retirada_acerto:"Retirada no acerto"};

// regras de partida (todas editáveis em Regras e configuração; nunca fixas em tela)
var FAIXAS_PADRAO = [
  {de:0, qtd:0, limite:0, taxa:0},
  {de:500, qtd:1, limite:2500, taxa:20},
  {de:1000, qtd:2, limite:3000, taxa:20},
  {de:1500, qtd:2, limite:3000, taxa:10},
  {de:2000, qtd:2, limite:3500, taxa:10},
  {de:3000, qtd:2, limite:4000, taxa:10},
  {de:4000, qtd:3, limite:5000, taxa:10}];
var CONFIG_PADRAO = {
  faixas:FAIXAS_PADRAO,
  expositor:{media3m:1500, vendaMinima:1000, taxaEntrega:10, exigeFoto:true},
  bloqueio:{pctMinimo:30, meses:3},
  // 21/10/2026: o setor Encomendas acabou; regras novas da reposição (taxa fixa, sem exceção). Pix e Top 50 reais só em encomendas.local.js
  reposicao:{taxa:15, taxaRepresentante:15, mediaMinima:2000, mediaMinimaRep:500, repPorSemana:10, minutosEscolha:30},
  // valor máximo de cada reposição pela média de vendas dos últimos 3 meses (abaixo da 1ª faixa = sem direito, exceto Top 50)
  valores:[{de:500, max:2500}, {de:1000, max:3000}, {de:2000, max:3500}, {de:3000, max:4000}, {de:4000, max:5000}],
  // quantas reposições por mês: média abaixo do limite = 1, a partir dele = 2; Top 50 = 2
  qtd:{limiteMedia:2000, abaixo:1, acima:2, top50:2},
  top50:{mediaMinima:3000, mesInicial:"2026-07"},   // alerta quando a média cai abaixo; planilha de vendas começa em jul/2026
  atendentes:["Leci", "Amanda de Oliveira", "Geovanna Santos", "Isadora", "Kátia"],
  prazoHoras:24,
  mensagens:{},
  pix:{chave:"", tipo:"", titular:"", recebedor:"João Guilherme de Oliveira"}};

// ---------- criação e migração do estado ----------
function erDemo(){
  var s = {v:1, seq:0, config:clone(CONFIG_PADRAO), revendedoras:[], pedidos:[], log:[], top50Hist:[], top50Snap:[], top50Sol:[], agenda:[], agendaEnvios:{}};
  if(LOCAL){
    if(LOCAL.config) Object.keys(LOCAL.config).forEach(function(k){ s.config[k] = clone(LOCAL.config[k]); });
    ["revendedoras", "pedidos"].forEach(function(k){ (LOCAL[k]||[]).forEach(function(x){ x = clone(x); if(!x.id) x.id = (k==="pedidos" ? "P" : "R")+(++s.seq); s[k].push(x); }); });
  }
  return s;
}
function erMigrar(er){
  if(!er) return erDemo(); var base = erDemo();
  Object.keys(base).forEach(function(k){ if(er[k]===undefined) er[k] = base[k]; });
  er.config = er.config || clone(CONFIG_PADRAO);
  Object.keys(CONFIG_PADRAO).forEach(function(k){ if(er.config[k]===undefined) er.config[k] = clone(CONFIG_PADRAO[k]); });
  if((er.v||1)<2){
    // v2 (21/10/2026): Top 50 e Pix vêm do arquivo local (nada real no código)
    if(LOCAL){
      if(LOCAL.config && LOCAL.config.pix && !er.config.pix.chave) er.config.pix = clone(LOCAL.config.pix);
      (LOCAL.revendedoras||[]).forEach(function(x){ var ex = er.revendedoras.find(function(r){ return norm(r.nome)===norm(x.nome); });
        if(ex){ if(x.top50) ex.top50 = true; if(x.telefone && !ex.telefone) ex.telefone = x.telefone; } else { x = clone(x); x.id = "R"+(++er.seq); er.revendedoras.push(x); } });
    }
  }
  if((er.v||1)<3 && er.config.reposicao && er.config.reposicao.minutosEscolha===60) er.config.reposicao.minutosEscolha = 30;   // v3 (22/10/2026): reposição na empresa = 30 minutos
  ["reposicao", "qtd"].forEach(function(k){ Object.keys(CONFIG_PADRAO[k]).forEach(function(c){ if(er.config[k][c]===undefined) er.config[k][c] = CONFIG_PADRAO[k][c]; }); });
  if((er.v||1)<4){
    // v4 (22/10/2026): funil novo (Novo, Conferindo, Aguardando comprovante...): troca as etapas antigas
    er.pedidos.forEach(function(q){
      var m = {solicitado:"novo", analise:"conferindo", aprovado:(q.canal==="entrega" && q.taxa>0 && !q.comprovante) ? "comprovante" : "separando"}[q.status];
      if(m){ q.status = m; }
      if(q.conferido===undefined) q.conferido = (q.status==="novo" || q.status==="conferindo" || q.status==="recusado" || q.status==="cancelado") ? null : {por:"sistema", em:q.etapaEm || q.criadoEm};
    });
  }
  ["top50"].forEach(function(k){ Object.keys(CONFIG_PADRAO[k]).forEach(function(c){ if(er.config[k]===undefined) er.config[k] = clone(CONFIG_PADRAO[k]); else if(er.config[k][c]===undefined) er.config[k][c] = CONFIG_PADRAO[k][c]; }); });
  er.revendedoras.forEach(function(r){ if(!r.vendas) r.vendas = {}; });
  er.v = 5; return er;
}
var podeConfigurar = function(usuario){ return DIRETORIA.some(function(x){ return x.id===usuario; }) || usuario===29; };

// ---------- direito (regras puras) ----------
// faixa da média: a de maior "de" que ainda cabe na média (faixas editáveis, qualquer ordem)
function faixaDaMedia(config, media){
  var m = num(media), lista = (config.faixas||[]).slice().sort(function(a,b){ return a.de-b.de; }), f = null;
  lista.forEach(function(x){ if(m>=x.de) f = x; });
  return f;
}
function proximaFaixa(config, media){
  var m = num(media), lista = (config.faixas||[]).slice().sort(function(a,b){ return a.de-b.de; });
  return lista.find(function(x){ return x.de>m && x.qtd>0; }) || null;
}
// direito de reposição: quantidade no mês, quantas restam, limite por reposição e taxa
function direitoReposicao(config, media, reposicoesNoMes){
  var m = num(media), f = faixaDaMedia(config, m), usadas = Math.max(0, Math.round(num(reposicoesNoMes)));
  if(!f || !(f.qtd>0)){
    var min = ((config.faixas||[]).filter(function(x){ return x.qtd>0; }).sort(function(a,b){ return a.de-b.de; })[0] || {}).de;
    return {tem:false, quantidadeMes:0, restantes:0, limite:0, taxa:0, faixa:f, motivo:"Sem direito à reposição: média de vendas dos últimos 3 meses abaixo de "+formatarReais(min||0)+"."};
  }
  var rest = Math.max(0, f.qtd-usadas);
  return {tem:rest>0, quantidadeMes:f.qtd, restantes:rest, limite:f.limite, taxa:f.taxa, faixa:f,
    motivo:rest>0 ? "" : "Limite de "+f.qtd+(f.qtd===1 ? " reposição" : " reposições")+" no mês já atingido."};
}
// direito de expositor: média de R$ 1.500 em 3 meses OU ao menos uma venda de R$ 1.000
function direitoExpositor(config, media3m, maiorVenda){
  var x = config.expositor || CONFIG_PADRAO.expositor, m = num(media3m), v = num(maiorVenda);
  if(m>=x.media3m) return {tem:true, motivo:"", por:"media"};
  if(v>=x.vendaMinima) return {tem:true, motivo:"", por:"venda"};
  return {tem:false, por:"", motivo:"Sem direito ao expositor: é preciso média de "+formatarReais(x.media3m)+" nos últimos 3 meses ou ao menos uma venda de "+formatarReais(x.vendaMinima)+"."};
}
// bloqueio: vendas abaixo de 30% do valor da reposição bloqueiam por 3 meses. Devolve {pct, bloqueia, ate}
function bloqueioReposicao(config, valorReposicao, vendas, dataBase){
  var b = config.bloqueio || CONFIG_PADRAO.bloqueio, val = num(valorReposicao), v = num(vendas);
  if(!(val>0)) return {pct:0, bloqueia:false, ate:"", motivo:"Informe o valor da reposição."};
  var pct = r2(v/val*100), bloqueia = pct<b.pctMinimo, ate = bloqueia ? somaMeses(dataBase || hojeSP(), b.meses) : "";
  return {pct:pct, bloqueia:bloqueia, ate:ate, motivo:bloqueia ? "Vendas de "+pct.toLocaleString("pt-BR")+"% do valor da reposição (mínimo de "+b.pctMinimo+"%): bloqueada para novas solicitações até "+formatarDia(ate)+"." : ""};
}
var bloqueadaNaData = function(ate, data){ return !!ate && diaDe(ate) > diaDe(data || hojeSP()); };

// ---------- vendas por mês, média e alerta do Top 50 (23/10/2026) ----------
var ymDe = function(iso){ return String(iso||"").slice(0, 7); };
// colunas da planilha: do mês inicial até o mês de hoje (no dia 1 do mês novo a coluna nova abre sozinha)
function mesesColunas(config, hoje){
  var ini = (config.top50 || CONFIG_PADRAO.top50).mesInicial, fim = ymDe(hoje || hojeSP()), out = [], y = +ini.slice(0, 4), m = +ini.slice(5, 7);
  while(y*12+m <= +fim.slice(0, 4)*12 + +fim.slice(5, 7) && out.length<60){ out.push(y+"-"+p2(m)); m++; if(m>12){ m = 1; y++; } }
  return out;
}
var NOME_MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
var rotuloMes = function(ym){ return NOME_MES[(+String(ym).slice(5, 7))-1]+"/"+String(ym).slice(2, 4); };
// média dos últimos 3 meses que têm venda lançada (pode ser 1 ou 2 meses só)
function mediaVendas(r, config, hoje){
  var cols = mesesColunas(config, hoje).slice().reverse(), v = r.vendas || {}, usados = [];
  cols.forEach(function(m){ if(usados.length<3 && !vazioN(v[m])) usados.push(m); });
  var soma = usados.reduce(function(t, m){ return t+num(v[m]); }, 0);
  return {media:usados.length ? r2(soma/usados.length) : null, meses:usados.length, usados:usados};
}
// alerta: está no Top 50, não foi selecionada pelo Marcus, tem venda lançada e a média ficou abaixo do mínimo
function abaixoDaMedia(config, r, hoje){
  var t = (config.top50 || CONFIG_PADRAO.top50), m = mediaVendas(r, config, hoje);
  return !!(r.top50 && !r.marcus && m.meses>0 && m.media<t.mediaMinima);
}

// ---------- acesso à reposição (21/10/2026) ----------
// Top 50: entrega pelo João, taxa de R$ 15 paga ANTES (comprovante). Média de R$ 2.000 ou mais: ida na empresa (agendada) ou pela representante (R$ 15 é da representante, não da revendedora).
var CANAIS = [["entrega", "Entrega pelo João (Top 50)"], ["empresa", "Ida na empresa"], ["representante", "Pela representante"]];
var ROTULO_CANAL = {entrega:"Entrega", empresa:"Ida na empresa", representante:"Representante"};
function acessoReposicao(config, rev, media){
  var c = config.reposicao || CONFIG_PADRAO.reposicao, top = !!(rev && rev.top50), ok = num(media)>=c.mediaMinima;
  var temRep = top || num(media)>=num(c.mediaMinimaRep);   // abaixo de R$ 500 não tem direito, nem pela representante
  var canais = top ? ["entrega", "empresa", "representante"] : ok ? ["empresa", "representante"] : temRep ? ["representante"] : [];
  return {top50:top, mediaOk:ok, canais:canais, tem:canais.length>0,
    motivo:canais.length ? "" : "Sem direito à reposição na Sorelly: precisa estar no Top 50 ou ter média de vendas de "+formatarReais(c.mediaMinima)+" ou mais."};
}
// valor máximo da reposição pela média (tabela editável). Top 50 sem média usa o maior teto; Top 50 abaixo da 1ª faixa usa o menor teto
function valorMaximo(config, media, top){
  var v = (config.valores||[]).slice().sort(function(a, b){ return a.de-b.de; }), m = num(media), f = null;
  if(!v.length) return 0;
  if(vazioN(media)) return top ? v[v.length-1].max : 0;
  v.forEach(function(x){ if(m>=x.de) f = x; });
  return f ? f.max : (top ? v[0].max : 0);
}
// quantas reposições por mês: Top 50 usa o próprio limite; os demais, pela média
function qtdMes(config, media, top){ var q = config.qtd || CONFIG_PADRAO.qtd; return top ? q.top50 : (num(media)>=q.limiteMedia ? q.acima : q.abaixo); }
// segunda-feira da semana (limite semanal da representante)
function inicioSemana(dia){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dia||"")); if(!m) return ""; var d = new Date(Date.UTC(+m[1], +m[2]-1, +m[3])), w = (d.getUTCDay()+6)%7; d.setUTCDate(d.getUTCDate()-w); return d.toISOString().slice(0,10); }
function reposicoesDaRepresentanteNaSemana(er, nome, dia){
  var n = norm(nome), sem = inicioSemana(dia); if(!n) return 0;
  return er.pedidos.filter(function(p){ return p.tipo==="reposicao" && p.canal==="representante" && norm(p.representante)===n && p.status!=="recusado" && p.status!=="cancelado" && inicioSemana(p.dataAgendada || diaDe(p.criadoEm))===sem; }).length;
}

// ---------- consultas ----------
var revDe = function(er, id){ return er.revendedoras.find(function(r){ return r.id===id; }) || null; };
var revPorNome = function(er, nome){ var n = norm(nome); return n ? er.revendedoras.find(function(r){ return norm(r.nome)===n; }) || null : null; };
// reposições da revendedora no mês (as recusadas e canceladas não contam)
function reposicoesDoMes(er, nome, mes){
  var n = norm(nome); if(!n) return 0;
  return er.pedidos.filter(function(p){ return p.tipo==="reposicao" && norm(p.revendedora)===n && p.status!=="recusado" && p.status!=="cancelado" && String(p.criadoEm).slice(0,7)===mes; }).length;
}
var proximosStatus = function(p){
  if(p.status==="recusado" || p.status==="cancelado") return ["novo"];   // reativar
  if(p.status==="concluido") return [];
  var c = caminhoDe(p), i = c.indexOf(p.status), out = [];
  if(i>=0 && i<c.length-1) out.push(c[i+1]);
  if(i>1) out.push(c[i-1]);   // voltar uma etapa (de Conferindo para Novo não)
  if(p.status==="novo" || p.status==="conferindo") out.push("recusado");
  out.push("cancelado");
  return out;
};
var proximaEtapa = function(p){ var c = caminhoDe(p), i = c.indexOf(p.status); return i>=0 && i<c.length-1 ? c[i+1] : null; };
function minutosNaEtapa(p, agora){ var a = minutosDe(p.etapaEm || p.criadoEm), b = minutosDe(agora || agoraSP()); return a==null || b==null ? null : Math.max(0, Math.round(b-a)); }
function textoTempo(min){ if(min==null) return ""; if(min<60) return min+" min"; if(min<1440) return Math.floor(min/60)+" h"; return Math.floor(min/1440)+" d"; }
function listaPedidos(s, f){
  f = f || {}; var b = norm(f.busca);
  return s.er.pedidos.filter(function(p){
    if(f.tipo && p.tipo!==f.tipo) return false;
    if(f.forma && p.forma!==f.forma) return false;
    if(f.canal && p.canal!==f.canal) return false;
    if(f.status && p.status!==f.status) return false;
    if(f.representante && norm(p.representante)!==norm(f.representante)) return false;
    if(b && (norm(p.revendedora)+" "+norm(p.representante)+" "+norm(p.descricao)).indexOf(b)<0) return false;
    return true;
  }).sort(function(a, c){ return String(a.criadoEm)<String(c.criadoEm) ? 1 : -1; });
}
function indicadoresEr(s, hoje){
  var er = s.er, h = hoje || hojeSP(), mes = h.slice(0, 7), agora = agoraSP(), pz = num(er.config.prazoHoras)*60;
  var abertos = er.pedidos.filter(function(p){ return !FINAIS[p.status]; });
  var atras = abertos.filter(function(p){ var m = minutosNaEtapa(p, agora); return pz>0 && m!=null && m>pz; }).length;
  return {abertos:abertos.length, atrasados:atras,
    entradasMes:er.pedidos.filter(function(p){ return String(p.criadoEm).slice(0, 7)===mes; }).length,
    semComprovante:abertos.filter(faltaComprovante).length, top50:er.revendedoras.filter(function(r){ return r.top50; }).length,
    agendadosHoje:abertos.filter(function(p){ return p.status==="agendado" && p.dataAgendada===h; }).length,
    concluidosMes:er.pedidos.filter(function(p){ return p.status==="concluido" && String(p.etapaEm).slice(0, 7)===mes; }).length,
    recusados:er.pedidos.filter(function(p){ return p.status==="recusado" && String(p.criadoEm).slice(0, 7)===mes; }).length,
    abaixoMedia:er.revendedoras.filter(function(r){ return abaixoDaMedia(er.config, r, h); }).length,
    solicitacoes:(er.top50Sol||[]).filter(function(x){ return x.status==="pendente"; }).length,
    bloqueadas:er.revendedoras.filter(function(r){ return bloqueadaNaData(r.bloqueadaAte, h); }).length};
}
// resumo por representante: reposições na semana e no mês, entregues e valor a receber
function resumoRepresentantes(er, hoje){
  var h = hoje || hojeSP(), sem = inicioSemana(h), mes = h.slice(0, 7), o = {};
  er.pedidos.filter(function(p){ return p.tipo==="reposicao" && p.canal==="representante" && trim(p.representante) && p.status!=="recusado" && p.status!=="cancelado"; }).forEach(function(p){
    var k = trim(p.representante), r = o[k] = o[k] || {nome:k, semana:0, mes:0, abertos:0, entregues:0, receber:0};
    var d = p.dataAgendada || diaDe(p.criadoEm);
    if(inicioSemana(d)===sem) r.semana++;
    if(String(d).slice(0, 7)===mes) r.mes++;
    if(p.status==="concluido"){ r.entregues++; r.receber = r2(r.receber+num(p.taxaRep)); } else r.abertos++;
  });
  return Object.keys(o).sort().map(function(k){ return o[k]; });
}
// representantes que aparecem nos pedidos e no cadastro (para o filtro)
function representantesEr(er){
  var o = {}; er.pedidos.concat(er.revendedoras).forEach(function(x){ var n = trim(x.representante); if(n) o[n] = 1; });
  return Object.keys(o).sort();
}

// ---------- validação de pedido ----------
// devolve null (aceito) ou {msg, formal}: formal = recusa de regra (sem direito, acima do limite, além da quantidade, bloqueada), que pode ser registrada como Recusado
function validarPedido(s, v, agora){
  var er = s.er, cfg = er.config, hoje = diaDe(agora || agoraSP()), mes = hoje.slice(0,7);
  var dados = function(t){ return {msg:t, formal:false}; }, formal = function(t){ return {msg:t, formal:true}; };
  if(!TIPOS.some(function(t){ return t[0]===v.tipo; })) return dados("Escolha o tipo do pedido.");
  if(!trim(v.revendedora)) return dados("Informe a revendedora.");
  if(v.forma && !FORMAS.some(function(f){ return f[0]===v.forma; })) return dados("Forma de receber inválida.");
  if(v.dataAgendada && !diaValido(v.dataAgendada)) return dados("Data agendada inválida.");
  if(!vazioN(v.valor) && num(v.valor)<0) return dados("O valor não pode ser negativo.");
  if(v.tipo==="reposicao"){
    var rev = revPorNome(er, v.revendedora), ac = acessoReposicao(cfg, rev, v.media3m), rp = cfg.reposicao || CONFIG_PADRAO.reposicao, top = !!(rev && rev.top50);
    if(!top && vazioN(v.media3m)) return dados("Informe a média de vendas da revendedora.");
    if(!vazioN(v.valor) && num(v.valor)<0) return dados("O valor não pode ser negativo.");
    if(rev && bloqueadaNaData(rev.bloqueadaAte, hoje)) return formal("Revendedora bloqueada para novas solicitações até "+formatarDia(rev.bloqueadaAte)+(rev.bloqueioMotivo ? " ("+rev.bloqueioMotivo+")" : "")+".");
    if(!ac.tem) return formal(ac.motivo);
    if(!v.canal) return dados("Escolha como a reposição será recebida.");
    if(ac.canais.indexOf(v.canal)<0) return formal(v.canal==="entrega" ? "A entrega pelo João é só para o Top 50." : "Canal não liberado para esta revendedora.");
    var mx = valorMaximo(cfg, v.media3m, top), lim = qtdMes(cfg, v.media3m, top), usadas = reposicoesDoMes(er, v.revendedora, mes);
    if(usadas>=lim) return formal("Limite de "+lim+(lim===1 ? " reposição" : " reposições")+" por mês já atingido.");
    if(mx>0 && num(v.valor)>mx) return formal("Valor acima do máximo de "+formatarReais(mx)+" para esta média.");
    if(v.canal==="representante"){
      if(!trim(v.representante)) return dados("Informe a representante que vai levar.");
      var qs = reposicoesDaRepresentanteNaSemana(er, v.representante, v.dataAgendada || hoje);
      if(qs>=rp.repPorSemana) return formal("A representante já tem "+qs+" reposições nesta semana (limite de "+rp.repPorSemana+").");
    }
  }
  if(v.tipo==="expositor"){
    if(vazioN(v.media3m) && vazioN(v.maiorVenda)) return dados("Informe a média dos 3 meses ou a maior venda.");
    var x = direitoExpositor(cfg, v.media3m, v.maiorVenda);
    if(!x.tem) return formal(x.motivo);
  }
  if(v.tipo==="encomenda"){
    var rvE = revPorNome(er, v.revendedora);
    if(!(rvE && rvE.top50)) return formal("Encomenda só para o Top 50. As demais revendedoras pedem pelo aplicativo, somente para o novo kit.");
    if(!trim(v.descricao)) return dados("Descreva a encomenda.");
  }
  return null;
}

// taxa do pedido: reposição = taxa da faixa; expositor = taxa de entrega só quando a forma é entrega; encomenda = sem taxa (regra pendente)
function taxaDoPedido(config, p){
  if(p.tipo==="reposicao") return p.canal==="entrega" ? num((config.reposicao||CONFIG_PADRAO.reposicao).taxa) : 0;   // paga pela revendedora, antes, sem exceção
  if(p.tipo==="expositor") return p.forma==="entrega" ? num((config.expositor||{}).taxaEntrega) : 0;
  return 0;
}

// valor que a EMPRESA paga à representante quando ela leva a reposição (a revendedora não paga nada)
var taxaDaRepresentante = function(config, p){ return p.tipo==="reposicao" && p.canal==="representante" ? num((config.reposicao||CONFIG_PADRAO.reposicao).taxaRepresentante) : 0; };
// sem comprovante a taxa não libera a reposição (Top 50 por entrega)
var faltaComprovante = function(p){ return p.tipo==="reposicao" && p.taxa>0 && !p.comprovante && !FINAIS[p.status]; };

// ---------- mensagens para o WhatsApp (geradas das regras, nunca fixas) ----------
function textoRegrasReposicao(config){
  var c = config.reposicao || CONFIG_PADRAO.reposicao, b = config.bloqueio || CONFIG_PADRAO.bloqueio;
  return ["*Reposição de semijoias*", "",
    "• Top 50: a reposição é enviada por entrega e pode sair durante o mês.",
    "• Taxa de "+formatarReais(c.taxa)+" por reposição, paga antes por Pix, com o comprovante anexado. Sem o comprovante a reposição não é liberada, sem exceção.",
    "• Média de vendas de "+formatarReais(c.mediaMinima)+" ou mais: pode agendar a ida na empresa (até "+c.minutosEscolha+" minutos para escolher as peças).",
    "• Qualquer revendedora pode receber a reposição pela representante, que separa as peças na empresa (até "+c.repPorSemana+" por semana).",
    "• Atendimento somente por mensagem escrita, sem áudio. Aguarde o retorno da equipe.", "",
    "Atenção: se as vendas forem inferiores a "+b.pctMinimo+"% do valor da reposição, a revendedora fica bloqueada por "+b.meses+" meses para novas solicitações."].join("\n");
}
// listagem do dia (ida na empresa): pedidos agendados + horários lançados à mão
function listagemDoDia(er, data){
  var deP = er.pedidos.filter(function(p){ return p.tipo==="reposicao" && p.canal==="empresa" && p.dataAgendada===data && p.status!=="recusado" && p.status!=="cancelado"; })
    .map(function(p){ return {id:p.id, origem:"pedido", hora:p.hora || "", revendedora:p.revendedora, representante:p.representante || "", obs:p.atendente ? "Atende: "+p.atendente : ROTULO_STATUS[p.status]}; });
  var deA = er.agenda.filter(function(x){ return x.data===data; }).map(function(x){ return {id:x.id, origem:"lista", hora:x.hora, revendedora:x.revendedora, representante:x.representante, obs:x.obs}; });
  return deP.concat(deA).sort(function(a, b){ return (a.hora || "99:99").localeCompare(b.hora || "99:99") || a.revendedora.localeCompare(b.revendedora); });
}
function textoListagem(data, itens){
  var linhas = itens.length ? itens.map(function(x, i){ return (i+1)+". *"+(x.hora || "sem hora")+"* · "+x.revendedora+(x.representante ? " · Rep.: "+x.representante : "")+(x.obs ? " ("+x.obs+")" : ""); }) : ["Nenhuma ida na empresa marcada."];
  return ["📅 *IDAS NA EMPRESA: "+formatarDia(data)+"*", "", linhas.join("\n"), "", "Setor de Encomendas e Reposições"].join("\n");
}
// pedido de autorização ao Marcus (entrada ou saída do Top 50), pronto para copiar
function mensagemSolicitacao(config, so, link){
  var R = formatarReais, ent = so.tipo==="entrar";
  return [ent ? "📋 *PEDIDO DE ENTRADA NO TOP 50*" : "📋 *PEDIDO DE SAÍDA DO TOP 50*", "",
    "*Revendedora:* "+so.nome, "*Telefone:* "+(so.telefone || "—"), "*Representante:* "+(so.representante || "—"), "*Média de vendas:* "+(so.media>0 ? R(so.media) : "—"),
    "*Motivo:* "+so.motivo, "*Pedido por:* "+(so.por || "—"), "", "Marcus, você autoriza? ✅ Sim ou ❌ Não"].concat(link ? ["", "🔗 *Para analisar e autorizar (entre com o seu login):*", link] : []).join("\n");
}

// mensagens prontas (geradas das regras; a diretoria pode trocar o texto, que fica em config.mensagens[chave])
var MENSAGENS = [
  ["setor", "Regras do setor"], ["representantes", "Regras para as representantes"], ["fora_top50", "Comunicado: fora do Top 50"], ["recusa", "Recusa de reposição"],
  ["taxa_pix", "Aviso da taxa e chave Pix"], ["atendimento", "Atendimento: sem áudio"], ["ida_empresa", "Fluxo da ida na empresa"]];
function tabelaValoresTexto(c){
  var v = (c.valores||[]).slice().sort(function(a, b){ return a.de-b.de; });
  var linhas = ["🔴 *Abaixo de "+formatarReais(v.length ? v[0].de : 0)+":* sem direito"];
  v.forEach(function(x, i){ var prox = v[i+1]; linhas.push((i===0 ? "🟡 " : i===v.length-1 ? "🔵 " : "🟢 ")+"*"+(prox ? formatarReais(x.de)+" a "+formatarReais(prox.de-0.01) : formatarReais(x.de)+" ou mais")+":* até *"+formatarReais(x.max)+"*"); });
  return linhas.join("\n");
}
function mensagemPadrao(config, k){
  var r = config.reposicao || CONFIG_PADRAO.reposicao, q = config.qtd || CONFIG_PADRAO.qtd, b = config.bloqueio || CONFIG_PADRAO.bloqueio, px = config.pix || {};
  var R = function(n){ return formatarReais(n); }, L = "━━━━━━━━━━━━━━━━━━━━", at = (config.atendentes||[]).join(", ");
  var quant = "🟡 *Média abaixo de "+R(q.limiteMedia)+":* "+q.abaixo+(q.abaixo===1 ? " reposição" : " reposições")+" por mês\n🟢 *Média de "+R(q.limiteMedia)+" ou mais:* "+q.acima+" reposições por mês *(máximo)*\n⭐ *Top 50:* "+q.top50+" reposições por mês";
  if(k==="setor") return ["📦 *SETOR DE ENCOMENDAS E REPOSIÇÕES: PROCEDIMENTO OFICIAL*", L, "",
    "⭐ *TOP 50*", "• Reposição: máximo de *"+q.top50+" por mês*, sem exigir média mínima.", "• Encomenda: o Top 50 pode pedir que o setor *separe peças para o próximo kit*.",
    "• *Entrega pelo João:* taxa de "+R(r.taxa)+" *obrigatória*, paga *antes* por Pix, com o *comprovante anexado no sistema*. Sem comprovante, não separa. Sem exceção.",
    "• *Representante leva:* a revendedora não paga taxa. A representante recebe "+R(r.taxaRepresentante)+" por entrega.",
    "• *Ida na empresa:* com agendamento, até "+r.minutosEscolha+" minutos, sem taxa.", "", L, "",
    "👤 *DEMAIS REVENDEDORAS*", "• Encomenda: *não têm direito*. Pedem pelo aplicativo, somente para o novo kit.", "• Reposição: *somente pela representante*.",
    "• A representante escolhe as peças dentro do valor máximo. Vocês passam a ela a *média*, a *tabela de valores* e o *valor máximo*.", "• Depois ela pede à Deysiane que a bipagem bipe a reposição.", "", L, "",
    "🔢 *QUANTAS POR MÊS*", quant, "", "💎 *VALOR MÁXIMO POR REPOSIÇÃO*", tabelaValoresTexto(config), "", L, "",
    "🔒 *BLOQUEIOS*", "• Vendas abaixo de "+b.pctMinimo+"% do valor da reposição: bloqueada por "+b.meses+" meses.", "• Insistir em áudio: bloqueada.", "• Só a diretoria libera antes do prazo.", "", L, "",
    "💬 *ATENDIMENTO*", "• Somente mensagem escrita. Poucas fotos. Sem áudio.", "• A revendedora aguarda o retorno. Nenhum prazo é prometido na hora."].join("\n");
  if(k==="representantes") return ["🧑‍💼 *REPOSIÇÃO: REGRAS PARA REPRESENTANTES*", "",
    "• Você retira *até "+r.repPorSemana+" reposições por semana* na empresa.", "• Você decide se leva ou não, para qualquer revendedora que escolher.",
    "• O setor passa a você a *média de vendas*, a *tabela de valores* e o *valor máximo*.", "• Você *escolhe as peças* dentro desse valor. *Nunca passe* do limite.",
    "• *Peça à Deysiane* que a bipagem *bipe* a reposição. Depois, entregue à revendedora.", "• 💵 Você recebe *"+R(r.taxaRepresentante)+" por reposição entregue*.",
    "• Revendedora com média *abaixo de "+R(r.mediaMinimaRep)+"* não tem direito.", "• Cada revendedora tem *"+q.abaixo+" reposição por mês* (média abaixo de "+R(q.limiteMedia)+") ou *"+q.acima+" por mês* (média de "+R(q.limiteMedia)+" ou mais).", "",
    "⚠️ Fale com o setor *somente por mensagem escrita*. *Sem áudio.*", "⚠️ Vendas abaixo de "+b.pctMinimo+"% do valor da reposição bloqueiam a revendedora por "+b.meses+" meses.", "⚠️ *Não diga* à revendedora a média nem o valor máximo."].join("\n");
  if(k==="fora_top50") return ["📢 *COMUNICADO*", "", "O setor de *encomendas e reposições* foi *encerrado*.", "", "Não atendemos mais pedidos de *reposição*.", "",
    "As *encomendas* devem ser preenchidas *no aplicativo*, *somente para o novo kit*.", "", "Atendemos somente por *mensagem escrita*. Não enviamos nem ouvimos áudios.", "", "Obrigado pela compreensão. 💛"].join("\n");
  if(k==="recusa") return ["Prezada revendedora, informamos que não foi possível atender à sua solicitação de reposição.", "", "Atendemos somente por *mensagem escrita*. Aguarde o retorno da nossa equipe para novas orientações."].join("\n");
  if(k==="taxa_pix") return ["💰 *TAXA DA REPOSIÇÃO*", "", "A entrega tem taxa de *"+R(r.taxa)+"*, paga *antes* por Pix.", "",
    "*Chave Pix ("+(px.tipo||"tipo")+"):* "+(px.chave||"informe a chave nas regras"), "*Titular:* "+(px.titular||"—"), "",
    "Depois do pagamento, envie o *comprovante* por mensagem escrita. *Sem o comprovante a reposição não é liberada.*"].join("\n");
  if(k==="atendimento") return ["💬 *ATENDIMENTO: REGRAS*", "", "✍️ Somente *mensagens escritas*", "📷 *Poucas fotos*, só o necessário", "🚫 *Sem áudio.* Quem insistir em áudio será *bloqueada*",
    "⏳ Aguarde o retorno da equipe. Nenhum prazo é prometido na hora."].join("\n");
  if(k==="ida_empresa") return ["📦 *REPOSIÇÃO NA EMPRESA: FLUXO*", "", "⏱️ *Tempo máximo: "+r.minutosEscolha+" minutos*", L, "",
    "1️⃣ A *bipagem* recebe a revendedora.", "2️⃣ A *bipagem* encaminha à *sala de Encomendas*.", "3️⃣ *Encomendas* confere a *média de vendas* e o *valor da reposição*.", "4️⃣ *Encomendas* chama a *atendente*.",
    "5️⃣ *Atendimento das peças:* mostrar as peças na frente, pedir ajuda a Encomendas, ver as gavetas da produção, procurar na mesa de produção.", "6️⃣ A atendente *conclui* e chama a *Deysiane*.", "7️⃣ A *Deysiane* define *quem bipa* a reposição.", "",
    "👩‍💼 *Atendem:* "+at, "💎 Média de "+R(r.mediaMinima)+" ou mais: pode ver as peças de luxo na sala do Marcus.", "", "⚠️ Nunca comece sem conferir a média. Nunca passe do valor máximo. Só com agendamento."].join("\n");
  return "";
}
function mensagemTexto(config, k){ var o = (config.mensagens||{})[k]; return o!==undefined && o!=="" ? o : mensagemPadrao(config, k); }

function textoRegrasExpositor(config){
  var x = config.expositor || CONFIG_PADRAO.expositor;
  return ["*Expositor Sorelly*", "", "O expositor permite vender as semijoias Sorelly em um ponto fixo (salão, loja, clínica), em consignação.", "",
    "Tem direito quem tem média de "+formatarReais(x.media3m)+" nos últimos 3 meses ou realizou ao menos uma venda de "+formatarReais(x.vendaMinima)+".", "",
    x.exigeFoto ? "É preciso avaliar o local: envie uma foto do espaço. Depois da aprovação o processo continua." : "O local será avaliado antes da liberação.", "",
    "Formas de receber: entrega pelo entregador (taxa de "+formatarReais(x.taxaEntrega)+"), retirada na empresa ou retirada/entrega na data do acerto pela representante, conforme a disponibilidade do expositor.", "",
    "Ao receber, confira se há dano ou defeito e avise na hora, com fotos para registro. Depois de assinada a condicional, considera-se recebido em perfeito estado e deve ser devolvido nas mesmas condições. Dano na devolução não informado antes pode gerar cobrança do reparo."].join("\n");
}
// leitura da calculadora: tudo o que as regras dizem para uma média (e maior venda) digitadas
function calcularDireito(config, media, maiorVenda, reposicoesNoMes){
  var rep = direitoReposicao(config, media, reposicoesNoMes||0);
  return {reposicao:rep, expositor:direitoExpositor(config, media, maiorVenda), proxima:proximaFaixa(config, media), faixa:rep.faixa};
}

// ---------- reducer ----------
function erReduz(s, a){
  var er = clone(s.er), cfg = er.config, por = a.por || "—", agora = a.agora || agoraSP(), hoje = diaDe(agora);
  var recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg){ er.log.push({em:agora, por:por, op:a.op, txt:msg||""}); if(er.log.length>500) er.log = er.log.slice(-500); return {patch:{er:er}, msg:msg}; };
  var ped1 = function(id){ return er.pedidos.find(function(x){ return x.id===(id!=null ? id : a.id); }); };
  var hist = function(p, de, para, nota){ p.historico.push({em:agora, por:por, de:de, para:para, nota:nota||""}); };
  switch(a.op){
    case "config_salvar": {
      if(!podeConfigurar(s.usuario)) return recusa("Sem autorização: só a diretoria altera as regras.");
      var c = a.config || {}, novo = {};
      if(c.faixas){
        var fx = c.faixas.map(function(f){ return {de:r2(num(f.de)), qtd:Math.round(num(f.qtd)), limite:r2(num(f.limite)), taxa:r2(num(f.taxa))}; }).sort(function(p, q){ return p.de-q.de; });
        if(!fx.length) return recusa("Informe ao menos uma faixa.");
        if(fx[0].de!==0) return recusa("A primeira faixa deve começar em R$ 0,00.");
        for(var i = 0; i<fx.length; i++){ if(i>0 && fx[i].de===fx[i-1].de) return recusa("Há duas faixas começando no mesmo valor."); if(fx[i].qtd<0 || fx[i].limite<0 || fx[i].taxa<0) return recusa("Confira os valores das faixas."); if(fx[i].qtd>0 && fx[i].limite<=0) return recusa("Informe o limite por reposição das faixas com direito."); }
        novo.faixas = fx;
      }
      if(c.reposicao){ var rr0 = c.reposicao, rp = {taxa:r2(num(rr0.taxa)), taxaRepresentante:r2(num(rr0.taxaRepresentante)), mediaMinima:r2(num(rr0.mediaMinima)), repPorSemana:Math.round(num(rr0.repPorSemana)), minutosEscolha:Math.round(num(rr0.minutosEscolha))};
        if(rp.taxa<0 || rp.taxaRepresentante<0 || rp.mediaMinima<=0 || rp.repPorSemana<1 || rp.minutosEscolha<1) return recusa("Confira os valores da reposição."); novo.reposicao = rp; }
      if(c.top50){ var t5 = {mediaMinima:r2(num(c.top50.mediaMinima)), mesInicial:/^d{4}-d{2}$/.test(String(c.top50.mesInicial)) ? c.top50.mesInicial : cfg.top50.mesInicial}; if(t5.mediaMinima<=0) return recusa("Confira a média mínima do Top 50."); novo.top50 = t5; }
      if(c.valores){ var vs = c.valores.map(function(x){ return {de:r2(num(x.de)), max:r2(num(x.max))}; }).sort(function(m, n){ return m.de-n.de; });
        if(!vs.length || vs.some(function(x){ return x.de<=0 || x.max<=0; })) return recusa("Confira a tabela de valores."); novo.valores = vs; }
      if(c.qtd){ var qq = {limiteMedia:r2(num(c.qtd.limiteMedia)), abaixo:Math.round(num(c.qtd.abaixo)), acima:Math.round(num(c.qtd.acima)), top50:Math.round(num(c.qtd.top50))};
        if(qq.limiteMedia<=0 || qq.abaixo<1 || qq.acima<1 || qq.top50<1) return recusa("Confira as quantidades por mês."); novo.qtd = qq; }
      if(c.atendentes){ novo.atendentes = c.atendentes.map(trim).filter(Boolean); }
      if(c.prazoHoras!==undefined){ var ph = Math.round(num(c.prazoHoras)); if(ph<1 || ph>720) return recusa("Confira o prazo do alerta."); novo.prazoHoras = ph; }
      if(c.mensagens){ novo.mensagens = c.mensagens; }
      if(c.pix){ novo.pix = {chave:trim(c.pix.chave), tipo:trim(c.pix.tipo), titular:trim(c.pix.titular), recebedor:trim(c.pix.recebedor)}; }
      if(c.expositor){ var x = {media3m:r2(num(c.expositor.media3m)), vendaMinima:r2(num(c.expositor.vendaMinima)), taxaEntrega:r2(num(c.expositor.taxaEntrega)), exigeFoto:!!c.expositor.exigeFoto};
        if(x.media3m<=0 || x.vendaMinima<=0 || x.taxaEntrega<0) return recusa("Confira os valores do expositor."); novo.expositor = x; }
      if(c.bloqueio){ var b = {pctMinimo:num(c.bloqueio.pctMinimo), meses:Math.round(num(c.bloqueio.meses))};
        if(b.pctMinimo<0 || b.pctMinimo>100 || b.meses<1 || b.meses>24) return recusa("Confira as regras de bloqueio."); novo.bloqueio = b; }
      Object.assign(cfg, novo); return ok("Regras salvas");
    }
    case "rev_salvar": {
      var nome = trim(a.nome); if(!nome) return recusa("Informe o nome da revendedora.");
      if(!vazioN(a.media3m) && num(a.media3m)<0) return recusa("A média não pode ser negativa.");
      var dup = er.revendedoras.find(function(r){ return norm(r.nome)===norm(nome) && r.id!==a.id; }); if(dup) return recusa("Esta revendedora já está cadastrada.");
      var reg = {nome:nome, representante:trim(a.representante), telefone:trim(a.telefone), top50:!!a.top50, media3m:r2(num(a.media3m)), maiorVenda:r2(num(a.maiorVenda)), bloqueadaAte:"", atualizadoEm:agora};
      var antesTop = a.id ? !!(revDe(er, a.id) || {}).top50 : false;
      if(!!a.top50!==antesTop && (a.id || a.top50)) er.top50Hist.push({em:agora, por:por, nome:nome, acao:a.top50 ? "entrou" : "saiu"});
      if(a.id){ var ri = er.revendedoras.findIndex(function(r){ return r.id===a.id; }); if(ri<0) return recusa("Revendedora não encontrada."); reg.id = a.id; reg.bloqueadaAte = er.revendedoras[ri].bloqueadaAte || ""; er.revendedoras[ri] = reg; }
      else { reg.id = "R"+(++er.seq); er.revendedoras.push(reg); }
      return ok("Revendedora salva");
    }
    case "rev_excluir": {
      var rx = revDe(er, a.id); if(!rx) return recusa("Revendedora não encontrada.");
      if(er.pedidos.some(function(p){ return p.revendedoraId===rx.id; })) return recusa("Esta revendedora já tem pedidos: não é possível excluir.");
      er.revendedoras = er.revendedoras.filter(function(r){ return r.id!==rx.id; }); return ok("Revendedora excluída");
    }
    case "ped_criar": {
      var v = a.pedido || {}, rv = v.revendedoraId ? revDe(er, v.revendedoraId) : null;
      if(rv){ v = Object.assign({}, v, {revendedora:rv.nome, representante:v.representante || rv.representante}); }
      var er1 = validarPedido({er:er}, v, agora), formalReg = er1 && er1.formal && a.registrarRecusa;
      if(er1 && !formalReg) return recusa(er1.msg);
      var p = {id:"P"+(++er.seq), tipo:v.tipo, status:formalReg ? "recusado" : "novo", revendedoraId:rv ? rv.id : "", revendedora:trim(v.revendedora), representante:trim(v.representante),
        media3m:vazioN(v.media3m) ? null : r2(num(v.media3m)), maiorVenda:vazioN(v.maiorVenda) ? null : r2(num(v.maiorVenda)), valor:r2(num(v.valor)), descricao:trim(v.descricao), observacao:trim(v.observacao),
        fotoLocal:trim(v.fotoLocal), forma:v.forma || "", canal:v.canal || "", comprovante:null, taxaRep:0, responsavel:trim(v.responsavel) || por, conferido:null, valorMax:0, hora:"", atendente:"", atendInicio:"", atendFim:"", dataAgendada:v.dataAgendada || "", taxa:0, motivo:formalReg ? er1.msg : "", criadoEm:agora, criadoPor:por, etapaEm:agora, historico:[]};
      p.taxa = taxaDoPedido(cfg, p); p.taxaRep = taxaDaRepresentante(cfg, p);
      if(p.tipo==="reposicao"){ var rvx = rv || revPorNome(er, p.revendedora); p.valorMax = valorMaximo(cfg, p.media3m, !!(rvx && rvx.top50)); }
      hist(p, "", p.status, formalReg ? "Recusa formal: "+er1.msg : "Pedido registrado");
      er.pedidos.push(p);
      return ok(formalReg ? "Recusa registrada" : "Pedido registrado");
    }
    case "ped_mover": {
      var q = ped1(); if(!q) return recusa("Pedido não encontrado.");
      if(proximosStatus(q).indexOf(a.para)<0) return recusa("Este pedido não pode ir de “"+ROTULO_STATUS[q.status]+"” para “"+(ROTULO_STATUS[a.para]||a.para)+"”.");
      if(EXIGE_MOTIVO[a.para] && !trim(a.nota)) return recusa("Informe o motivo.");
      var cam = caminhoDe(q), iDe = cam.indexOf(q.status), iPara = cam.indexOf(a.para), avanca = iPara>iDe && iDe>=0;
      if(avanca && q.status==="conferindo" && !q.conferido) return recusa("Confira a média e o valor antes de avançar.");
      if(avanca && q.status==="comprovante" && faltaComprovante(q)) return recusa("Taxa de "+formatarReais(q.taxa)+" sem comprovante: a reposição não é liberada. Anexe o comprovante do Pix.");
      if(avanca && q.tipo==="expositor" && q.status==="conferindo" && cfg.expositor.exigeFoto && !trim(q.fotoLocal)) return recusa("Para avançar o expositor, registre antes a foto do local.");
      if(avanca && a.para==="agendado"){
        var data = a.data || q.dataAgendada;
        if(!diaValido(data)) return recusa("Informe a data agendada."); if(data<hoje) return recusa("A data agendada deve ser a partir de hoje.");
        q.dataAgendada = data; if(a.hora!==undefined) q.hora = trim(a.hora);
      }
      if(avanca && a.para==="representante" && !trim(q.representante)) return recusa("Informe a representante que vai levar.");
      if(avanca && a.para==="atendimento"){ var at = trim(a.atendente); if(!at) return recusa("Escolha quem atende."); q.atendente = at; q.atendInicio = agora; }
      if(q.status==="atendimento" && avanca) q.atendFim = agora;
      if(a.para==="concluido") q.concluidoEm = agora;
      if(a.para==="novo" && (q.status==="recusado" || q.status==="cancelado")) q.motivo = "";
      var de = q.status; q.status = a.para; q.etapaEm = agora; if(EXIGE_MOTIVO[a.para]) q.motivo = trim(a.nota);
      hist(q, de, a.para, a.nota); return ok(ROTULO_STATUS[a.para]);
    }
    case "ped_conferir": {
      var pf = ped1(); if(!pf) return recusa("Pedido não encontrado.");
      if(pf.status!=="conferindo") return recusa("Só se confere um pedido na etapa Conferindo.");
      var rvv = pf.revendedoraId ? revDe(er, pf.revendedoraId) : revPorNome(er, pf.revendedora), top = !!(rvv && rvv.top50);
      var media = vazioN(a.media) || num(a.media)===0 ? pf.media3m : r2(num(a.media));
      if(!top && vazioN(media)) return recusa("Informe a média de vendas.");
      if(pf.tipo==="reposicao"){
        var ac = acessoReposicao(cfg, rvv, media); if(!ac.tem) return recusa(ac.motivo);
        if(ac.canais.indexOf(pf.canal)<0) return recusa("Com esta média o canal escolhido não é permitido.");
        var mx = valorMaximo(cfg, media, top); if(mx>0 && num(pf.valor)>mx) return recusa("Valor acima do máximo de "+formatarReais(mx)+" para esta média.");
        pf.valorMax = mx;
      }
      pf.media3m = vazioN(media) ? null : media; if(rvv && !vazioN(media)) rvv.media3m = media;
      pf.conferido = {por:por, em:agora}; hist(pf, pf.status, pf.status, "Média e valor conferidos"+(pf.valorMax>0 ? " (máximo "+formatarReais(pf.valorMax)+")" : ""));
      return ok("Pedido conferido");
    }
    case "ped_agendar": {
      var g = ped1(); if(!g) return recusa("Pedido não encontrado."); if(FINAIS[g.status]) return recusa("Este pedido já foi encerrado.");
      if(!diaValido(a.data)) return recusa("Informe a data agendada."); if(a.data<hoje) return recusa("A data agendada deve ser a partir de hoje.");
      g.dataAgendada = a.data; g.hora = trim(a.hora);
      hist(g, g.status, g.status, "Agendado para "+formatarDia(a.data)+(g.hora ? " às "+g.hora : "")); return ok("Agendamento salvo");
    }
    case "ped_responsavel": {
      var pr = ped1(); if(!pr) return recusa("Pedido não encontrado."); if(!trim(a.responsavel)) return recusa("Escolha a responsável.");
      var antes = pr.responsavel; pr.responsavel = trim(a.responsavel); hist(pr, pr.status, pr.status, "Responsável: "+(antes || "—")+" → "+pr.responsavel); return ok("Responsável alterada");
    }
    case "ped_comprovante": {
      var pc = ped1(); if(!pc) return recusa("Pedido não encontrado."); if(!(pc.taxa>0)) return recusa("Este pedido não tem taxa a pagar.");
      if(!trim(a.arquivoId)) return recusa("Anexe o comprovante.");
      pc.comprovante = {arquivoId:trim(a.arquivoId), nome:trim(a.nome), em:agora, por:por}; hist(pc, pc.status, pc.status, "Comprovante da taxa anexado"); return ok("Comprovante anexado");
    }
    case "ped_foto": { var h = ped1(); if(!h) return recusa("Pedido não encontrado."); if(!trim(a.foto)) return recusa("Informe a referência da foto do local."); h.fotoLocal = trim(a.foto); hist(h, h.status, h.status, "Foto do local registrada"); return ok("Foto registrada"); }
    case "ped_nota": { var n = ped1(); if(!n) return recusa("Pedido não encontrado."); if(!trim(a.nota)) return recusa("Escreva a anotação."); hist(n, n.status, n.status, trim(a.nota)); return ok("Anotação registrada"); }
    case "bloqueio_avaliar": {
      // a.id = pedido de reposição concluído; a.vendas = quanto a revendedora vendeu depois dela
      var r = ped1(); if(!r || r.tipo!=="reposicao") return recusa("Escolha uma reposição.");
      if(r.status!=="concluido") return recusa("Só se avalia o bloqueio de uma reposição concluída.");
      if(vazioN(a.vendas) || num(a.vendas)<0) return recusa("Informe as vendas da revendedora.");
      var bl = bloqueioReposicao(cfg, r.valor, a.vendas, hoje);
      r.bloqueio = {vendas:r2(num(a.vendas)), pct:bl.pct, bloqueia:bl.bloqueia, ate:bl.ate, em:agora};
      if(bl.bloqueia){ var rr = r.revendedoraId ? revDe(er, r.revendedoraId) : revPorNome(er, r.revendedora);
        if(!rr){ rr = {id:"R"+(++er.seq), nome:r.revendedora, representante:r.representante, media3m:r.media3m||0, maiorVenda:0, bloqueadaAte:"", atualizadoEm:agora}; er.revendedoras.push(rr); }
        rr.bloqueadaAte = bl.ate; r.revendedoraId = rr.id; }
      hist(r, r.status, r.status, bl.bloqueia ? bl.motivo : "Vendas de "+bl.pct.toLocaleString("pt-BR")+"% do valor da reposição: sem bloqueio.");
      return ok(bl.bloqueia ? "Revendedora bloqueada" : "Sem bloqueio");
    }
    case "rev_venda": {
      var rvv2 = revDe(er, a.id); if(!rvv2) return recusa("Revendedora não encontrada.");
      var mm = String(a.mes||""); if(mesesColunas(cfg, hoje).indexOf(mm)<0) return recusa("Este mês não está aberto para lançamento.");
      var vv = a.valor; rvv2.vendas = rvv2.vendas || {};
      if(vazioN(vv)) delete rvv2.vendas[mm]; else { if(num(vv)<0) return recusa("A venda não pode ser negativa."); rvv2.vendas[mm] = r2(num(vv)); }
      var md2 = mediaVendas(rvv2, cfg, hoje); rvv2.media3m = md2.media!=null ? md2.media : 0;
      var mxv = 0; Object.keys(rvv2.vendas).forEach(function(k){ mxv = Math.max(mxv, num(rvv2.vendas[k])); }); rvv2.maiorVenda = r2(mxv);
      rvv2.atualizadoEm = agora; return ok("Venda lançada");
    }
    case "rev_marcus": {
      if(!podeConfigurar(s.usuario)) return recusa("Sem autorização: só a diretoria marca “selecionada pelo Marcus”.");
      var rm = revDe(er, a.id); if(!rm) return recusa("Revendedora não encontrada."); rm.marcus = !!a.valor; return ok(rm.marcus ? "Marcada como selecionada pelo Marcus" : "Marca removida");
    }
    case "top50_retirar": {
      var rt = revDe(er, a.id); if(!rt) return recusa("Revendedora não encontrada."); if(!rt.top50) return recusa("Esta revendedora não está no Top 50.");
      if(!trim(a.motivo)) return recusa("Escreva o motivo.");
      if(!podeConfigurar(s.usuario)){   // ninguém do setor tira sozinha: sempre vira pedido para o Marcus analisar e autorizar
        er.top50Sol.push({id:"S"+(++er.seq), tipo:"sair", revendedoraId:rt.id, nome:rt.nome, telefone:rt.telefone || "", representante:rt.representante || "", media:rt.media3m || 0, motivo:trim(a.motivo), por:por, em:agora, status:"pendente"});
        return ok("Pedido de saída criado: envie a mensagem ao Marcus");
      }
      rt.top50 = false; rt.marcus = false; er.top50Hist.push({em:agora, por:por, nome:rt.nome, acao:"saiu", motivo:trim(a.motivo)}); return ok("Retirada do Top 50");
    }
    case "top50_solicitar": {
      var nomeS = trim(a.nome); if(!nomeS) return recusa("Informe o nome da revendedora."); if(!trim(a.representante)) return recusa("Informe a representante.");
      if(!trim(a.motivo)) return recusa("Escreva o motivo.");
      var jaS = revPorNome(er, nomeS); if(jaS && jaS.top50) return recusa("Esta revendedora já está no Top 50.");
      er.top50Sol.push({id:"S"+(++er.seq), tipo:"entrar", revendedoraId:jaS ? jaS.id : "", nome:nomeS, telefone:trim(a.telefone), representante:trim(a.representante), media:vazioN(a.media) ? 0 : r2(num(a.media)), motivo:trim(a.motivo), por:por, em:agora, status:"pendente"});
      return ok("Pedido de entrada criado: envie a mensagem ao Marcus");
    }
    case "top50_decidir": {
      if(!podeConfigurar(s.usuario)) return recusa("Sem autorização: só a diretoria decide.");
      var so = er.top50Sol.find(function(x){ return x.id===a.id; }); if(!so) return recusa("Pedido não encontrado."); if(so.status!=="pendente") return recusa("Este pedido já foi decidido.");
      so.status = a.ok ? "autorizado" : "recusado"; so.decididoPor = por; so.decididoEm = agora; so.nota = trim(a.nota);
      if(a.ok){
        var rv3 = (so.revendedoraId ? revDe(er, so.revendedoraId) : null) || revPorNome(er, so.nome);
        if(so.tipo==="entrar"){
          if(!rv3){ rv3 = {id:"R"+(++er.seq), nome:so.nome, telefone:so.telefone, representante:so.representante, media3m:so.media || 0, maiorVenda:0, vendas:{}, bloqueadaAte:"", atualizadoEm:agora}; er.revendedoras.push(rv3); }
          rv3.top50 = true; rv3.marcus = true; er.top50Hist.push({em:agora, por:por, nome:rv3.nome, acao:"entrou", motivo:"Autorizada pelo Marcus: "+so.motivo});
        } else if(rv3){ rv3.top50 = false; rv3.marcus = false; er.top50Hist.push({em:agora, por:por, nome:rv3.nome, acao:"saiu", motivo:so.motivo}); }
      }
      return ok(a.ok ? "Pedido autorizado" : "Pedido recusado");
    }
    case "agenda_add": {
      if(!diaValido(a.data)) return recusa("Informe a data."); if(!trim(a.revendedora)) return recusa("Informe a revendedora.");
      er.agenda.push({id:"A"+(++er.seq), data:a.data, hora:trim(a.hora), revendedora:trim(a.revendedora), representante:trim(a.representante), obs:trim(a.obs), por:por}); return ok("Horário lançado");
    }
    case "agenda_del": { var ag0 = er.agenda.length; er.agenda = er.agenda.filter(function(x){ return x.id!==a.id; }); return er.agenda.length<ag0 ? ok("Horário removido") : recusa("Horário não encontrado."); }
    case "agenda_enviar": {
      if(!diaValido(a.data)) return recusa("Informe a data."); er.agendaEnvios[a.data] = {em:agora, por:por, texto:String(a.texto||"")}; return ok("Listagem enviada ao Agendamento");
    }
    case "bloqueio_manual": {
      var rb = revDe(er, a.id); if(!rb) return recusa("Revendedora não encontrada.");
      var mesesB = Math.round(num(a.meses)); if(!(mesesB>=1 && mesesB<=24)) return recusa("Informe os meses de bloqueio.");
      if(!trim(a.motivo)) return recusa("Informe o motivo do bloqueio.");
      rb.bloqueadaAte = somaMeses(hoje, mesesB); rb.bloqueioMotivo = trim(a.motivo); return ok("Revendedora bloqueada");
    }
    case "top50_registrar": {
      if(!podeConfigurar(s.usuario)) return recusa("Sem autorização: só a diretoria aprova a lista do Top 50.");
      er.top50Snap.push({em:agora, por:por, lista:er.revendedoras.filter(function(r){ return r.top50; }).map(function(r){ return r.nome; })});
      if(er.top50Snap.length>24) er.top50Snap = er.top50Snap.slice(-24); return ok("Lista do Top 50 aprovada");
    }
    case "bloqueio_remover": {
      if(!podeConfigurar(s.usuario)) return recusa("Sem autorização: só a diretoria libera uma revendedora bloqueada.");
      var rl = revDe(er, a.id); if(!rl) return recusa("Revendedora não encontrada."); rl.bloqueadaAte = ""; rl.bloqueioMotivo = ""; return ok("Bloqueio removido");
    }
    default: return recusa("Operação desconhecida.");
  }
}

// link direto para a tela onde o Marcus autoriza (Top 50, bloco Pedidos ao Marcus)
function linkPedidos(){ return (typeof window!=="undefined" ? window.location.origin : "")+"/montagem/top-50#pedidos"; }
export { linkPedidos, listagemDoDia, textoListagem, mensagemSolicitacao, mesesColunas, rotuloMes, mediaVendas, abaixoDaMedia, minutosDe, MENSAGENS, mensagemPadrao, mensagemTexto, valorMaximo, qtdMes, resumoRepresentantes, caminhoDe, CAMINHOS, inicioSemana, CANAIS, ROTULO_CANAL, acessoReposicao, taxaDaRepresentante, faltaComprovante, reposicoesDaRepresentanteNaSemana, erDemo, erMigrar, erReduz, podeConfigurar, TIPOS, ROTULO_TIPO, COR_TIPO, ICONE_TIPO, STATUS, ROTULO_STATUS, COR_STATUS, FLUXO, TRANSICOES, FINAIS, FORMAS, ROTULO_FORMA, CONFIG_PADRAO,
  formatarReais, formatarDia, formatarDataHora, somaMeses, faixaDaMedia, proximaFaixa, direitoReposicao, direitoExpositor, bloqueioReposicao, bloqueadaNaData, calcularDireito,
  revDe, revPorNome, reposicoesDoMes, proximosStatus, proximaEtapa, minutosNaEtapa, textoTempo, listaPedidos, indicadoresEr, representantesEr, validarPedido, taxaDoPedido,
  textoRegrasReposicao, textoRegrasExpositor, hojeSP, agoraSP, somaDias };
