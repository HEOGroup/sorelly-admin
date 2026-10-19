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

var LOCAL = (function(){ try { var m = import.meta.glob("./encomendas.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(x){ return null; } })();

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
var STATUS = ["solicitado", "analise", "aprovado", "separando", "agendado", "concluido", "recusado", "cancelado"];
var ROTULO_STATUS = {solicitado:"Solicitado", analise:"Em análise", aprovado:"Aprovado", separando:"Separando", agendado:"Entrega ou retirada agendada", concluido:"Concluído", recusado:"Recusado", cancelado:"Cancelado"};
var COR_STATUS = {solicitado:"#FBBF24", analise:"#60A5FA", aprovado:"#14B8A6", separando:"#F97316", agendado:"#8B5CF6", concluido:"#4ADE80", recusado:"#EF4444", cancelado:"#94A3B8"};
var FLUXO = ["solicitado", "analise", "aprovado", "separando", "agendado", "concluido"];
var TRANSICOES = {solicitado:["analise", "recusado", "cancelado"], analise:["aprovado", "recusado", "cancelado"], aprovado:["separando", "cancelado"], separando:["agendado", "cancelado"], agendado:["concluido", "cancelado"], concluido:[], recusado:[], cancelado:[]};
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
  bloqueio:{pctMinimo:30, meses:3}};

// ---------- criação e migração do estado ----------
function erDemo(){
  var s = {v:1, seq:0, config:clone(CONFIG_PADRAO), revendedoras:[], pedidos:[], log:[]};
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
  er.v = 1; return er;
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

// ---------- consultas ----------
var revDe = function(er, id){ return er.revendedoras.find(function(r){ return r.id===id; }) || null; };
var revPorNome = function(er, nome){ var n = norm(nome); return n ? er.revendedoras.find(function(r){ return norm(r.nome)===n; }) || null : null; };
// reposições da revendedora no mês (as recusadas e canceladas não contam)
function reposicoesDoMes(er, nome, mes){
  var n = norm(nome); if(!n) return 0;
  return er.pedidos.filter(function(p){ return p.tipo==="reposicao" && norm(p.revendedora)===n && p.status!=="recusado" && p.status!=="cancelado" && String(p.criadoEm).slice(0,7)===mes; }).length;
}
var proximosStatus = function(p){ return TRANSICOES[p.status] || []; };
var proximaEtapa = function(p){ var t = proximosStatus(p).filter(function(x){ return FLUXO.indexOf(x)>=0; }); return t[0] || null; };
function minutosNaEtapa(p, agora){ var a = minutosDe(p.etapaEm || p.criadoEm), b = minutosDe(agora || agoraSP()); return a==null || b==null ? null : Math.max(0, Math.round(b-a)); }
function textoTempo(min){ if(min==null) return ""; if(min<60) return min+" min"; if(min<1440) return Math.floor(min/60)+" h"; return Math.floor(min/1440)+" d"; }
function listaPedidos(s, f){
  f = f || {}; var b = norm(f.busca);
  return s.er.pedidos.filter(function(p){
    if(f.tipo && p.tipo!==f.tipo) return false;
    if(f.forma && p.forma!==f.forma) return false;
    if(f.representante && norm(p.representante)!==norm(f.representante)) return false;
    if(b && (norm(p.revendedora)+" "+norm(p.representante)+" "+norm(p.descricao)).indexOf(b)<0) return false;
    return true;
  }).sort(function(a, c){ return String(a.criadoEm)<String(c.criadoEm) ? 1 : -1; });
}
function indicadoresEr(s, hoje){
  var er = s.er, h = hoje || hojeSP(), mes = h.slice(0,7), abertos = er.pedidos.filter(function(p){ return !FINAIS[p.status]; });
  return {abertos:abertos.length, porTipo:{reposicao:abertos.filter(function(p){ return p.tipo==="reposicao"; }).length, expositor:abertos.filter(function(p){ return p.tipo==="expositor"; }).length, encomenda:abertos.filter(function(p){ return p.tipo==="encomenda"; }).length},
    analise:er.pedidos.filter(function(p){ return p.status==="solicitado" || p.status==="analise"; }).length,
    agendadosHoje:er.pedidos.filter(function(p){ return p.status==="agendado" && p.dataAgendada===h; }).length,
    concluidosMes:er.pedidos.filter(function(p){ return p.status==="concluido" && String(p.etapaEm).slice(0,7)===mes; }).length,
    recusados:er.pedidos.filter(function(p){ return p.status==="recusado" && String(p.criadoEm).slice(0,7)===mes; }).length,
    bloqueadas:er.revendedoras.filter(function(r){ return bloqueadaNaData(r.bloqueadaAte, h); }).length,
    valorAberto:r2(abertos.reduce(function(t, p){ return t+num(p.valor); }, 0))};
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
    if(vazioN(v.media3m)) return dados("Informe a média de vendas dos últimos 3 meses.");
    if(!(num(v.valor)>0)) return dados("Informe o valor da reposição.");
    var rev = revPorNome(er, v.revendedora);
    if(rev && bloqueadaNaData(rev.bloqueadaAte, hoje)) return formal("Revendedora bloqueada para novas solicitações até "+formatarDia(rev.bloqueadaAte)+" (vendas inferiores a "+cfg.bloqueio.pctMinimo+"% do valor da reposição anterior).");
    var d = direitoReposicao(cfg, v.media3m, reposicoesDoMes(er, v.revendedora, mes));
    if(!d.tem) return formal(d.motivo);
    if(num(v.valor)>d.limite) return formal("Valor acima do limite de "+formatarReais(d.limite)+" por reposição para a média informada.");
  }
  if(v.tipo==="expositor"){
    if(vazioN(v.media3m) && vazioN(v.maiorVenda)) return dados("Informe a média dos 3 meses ou a maior venda.");
    var x = direitoExpositor(cfg, v.media3m, v.maiorVenda);
    if(!x.tem) return formal(x.motivo);
  }
  if(v.tipo==="encomenda" && !trim(v.descricao)) return dados("Descreva a encomenda.");
  return null;
}

// taxa do pedido: reposição = taxa da faixa; expositor = taxa de entrega só quando a forma é entrega; encomenda = sem taxa (regra pendente)
function taxaDoPedido(config, p){
  if(p.tipo==="reposicao"){ var f = faixaDaMedia(config, p.media3m); return f ? f.taxa : 0; }
  if(p.tipo==="expositor") return p.forma==="entrega" ? num((config.expositor||{}).taxaEntrega) : 0;
  return 0;
}

// ---------- mensagens para o WhatsApp (geradas das regras, nunca fixas) ----------
function textoRegrasReposicao(config){
  var fx = (config.faixas||[]).slice().sort(function(a,b){ return a.de-b.de; }), b = config.bloqueio || CONFIG_PADRAO.bloqueio;
  var linhas = fx.map(function(f, i){
    var prox = fx[i+1], faixa = f.de===0 ? "Abaixo de "+formatarReais(prox ? prox.de : 0) : prox ? formatarReais(f.de)+" a "+formatarReais(prox.de-0.01) : "A partir de "+formatarReais(f.de);
    return "• "+faixa+": "+(f.qtd>0 ? f.qtd+(f.qtd===1 ? " reposição" : " reposições")+" por mês, limite de "+formatarReais(f.limite)+(f.qtd>1 ? " cada" : "")+", taxa de "+formatarReais(f.taxa) : "sem direito à reposição");
  });
  return ["*Reposição de semijoias*", "", "A quantidade de reposições, o limite de valor e a taxa variam conforme a média de vendas dos últimos 3 meses:", ""].concat(linhas, ["",
    "Entrega conforme a rota disponível ou retirada na empresa mediante agendamento.", "",
    "Atenção: se as vendas forem inferiores a "+b.pctMinimo+"% do valor da reposição, a revendedora fica bloqueada por "+b.meses+" meses para novas solicitações."]).join("\n");
}
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
      var reg = {nome:nome, representante:trim(a.representante), media3m:r2(num(a.media3m)), maiorVenda:r2(num(a.maiorVenda)), bloqueadaAte:"", atualizadoEm:agora};
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
      var p = {id:"P"+(++er.seq), tipo:v.tipo, status:formalReg ? "recusado" : "solicitado", revendedoraId:rv ? rv.id : "", revendedora:trim(v.revendedora), representante:trim(v.representante),
        media3m:vazioN(v.media3m) ? null : r2(num(v.media3m)), maiorVenda:vazioN(v.maiorVenda) ? null : r2(num(v.maiorVenda)), valor:r2(num(v.valor)), descricao:trim(v.descricao), observacao:trim(v.observacao),
        fotoLocal:trim(v.fotoLocal), forma:v.forma || "", dataAgendada:v.dataAgendada || "", taxa:0, motivo:formalReg ? er1.msg : "", criadoEm:agora, criadoPor:por, etapaEm:agora, historico:[]};
      p.taxa = taxaDoPedido(cfg, p);
      hist(p, "", p.status, formalReg ? "Recusa formal: "+er1.msg : "Pedido registrado");
      er.pedidos.push(p);
      return ok(formalReg ? "Recusa registrada" : "Pedido registrado");
    }
    case "ped_mover": {
      var q = ped1(); if(!q) return recusa("Pedido não encontrado.");
      if(proximosStatus(q).indexOf(a.para)<0) return recusa("Este pedido não pode ir de “"+ROTULO_STATUS[q.status]+"” para “"+(ROTULO_STATUS[a.para]||a.para)+"”.");
      if(EXIGE_MOTIVO[a.para] && !trim(a.nota)) return recusa("Informe o motivo.");
      if(a.para==="aprovado" && q.tipo==="expositor" && cfg.expositor.exigeFoto && !trim(q.fotoLocal)) return recusa("Para aprovar o expositor, registre antes a foto do local.");
      if(a.para==="agendado"){
        var forma = a.forma || q.forma, data = a.data || q.dataAgendada;
        if(!forma) return recusa("Informe a forma de receber."); if(!diaValido(data)) return recusa("Informe a data agendada.");
        if(data<hoje) return recusa("A data agendada deve ser a partir de hoje.");
        q.forma = forma; q.dataAgendada = data; q.taxa = taxaDoPedido(cfg, q);
      }
      var de = q.status; q.status = a.para; q.etapaEm = agora; if(EXIGE_MOTIVO[a.para]) q.motivo = trim(a.nota);
      hist(q, de, a.para, a.nota); return ok(ROTULO_STATUS[a.para]);
    }
    case "ped_agendar": {
      var g = ped1(); if(!g) return recusa("Pedido não encontrado."); if(FINAIS[g.status]) return recusa("Este pedido já foi encerrado.");
      if(!FORMAS.some(function(f){ return f[0]===a.forma; })) return recusa("Informe a forma de receber.");
      if(!diaValido(a.data)) return recusa("Informe a data agendada."); if(a.data<hoje) return recusa("A data agendada deve ser a partir de hoje.");
      g.forma = a.forma; g.dataAgendada = a.data; g.taxa = taxaDoPedido(cfg, g); hist(g, g.status, g.status, "Agendado: "+ROTULO_FORMA[a.forma]+" em "+formatarDia(a.data)+(g.taxa ? " (taxa "+formatarReais(g.taxa)+")" : ""));
      return ok("Agendamento salvo");
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
    case "bloqueio_remover": {
      if(!podeConfigurar(s.usuario)) return recusa("Sem autorização: só a diretoria libera uma revendedora bloqueada.");
      var rl = revDe(er, a.id); if(!rl) return recusa("Revendedora não encontrada."); rl.bloqueadaAte = ""; return ok("Bloqueio removido");
    }
    default: return recusa("Operação desconhecida.");
  }
}

export { erDemo, erMigrar, erReduz, podeConfigurar, TIPOS, ROTULO_TIPO, COR_TIPO, ICONE_TIPO, STATUS, ROTULO_STATUS, COR_STATUS, FLUXO, TRANSICOES, FINAIS, FORMAS, ROTULO_FORMA, CONFIG_PADRAO,
  formatarReais, formatarDia, formatarDataHora, somaMeses, faixaDaMedia, proximaFaixa, direitoReposicao, direitoExpositor, bloqueioReposicao, bloqueadaNaData, calcularDireito,
  revDe, revPorNome, reposicoesDoMes, proximosStatus, proximaEtapa, minutosNaEtapa, textoTempo, listaPedidos, indicadoresEr, representantesEr, validarPedido, taxaDoPedido,
  textoRegrasReposicao, textoRegrasExpositor, hojeSP, agoraSP, somaDias };
