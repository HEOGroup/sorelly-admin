// Sorelly Admin · montagem — domain/indicacoes.js
// Indicações (setor Cadastro de revendedoras: Michele, supervisor Nickolas), trazido do SorellyAdmin (docs/modulos/indicacoes.md).
// A revendedora indica alguém no "Indique & Ganhe" e pede prêmio com moedas; aqui a empresa avança a indicação pelo funil, atende o resgate (fila → agendar → retirar) e dá moedas.
// O app da revendedora e a Kommo NÃO estão ligados: tudo entra por lançamento manual (ops "ind_add", "resgate_add", "moedas_credito"). As moedas ficam num extrato próprio (s.ind.extrato).
// Estado s.ind (só neste navegador). Nasce VAZIO (repositório é público). Dados reais, se existirem, vêm só de domain/indicacoes.local.js (gitignored):
//   export default {revendedoras:[], premios:[], indicacoes:[], resgates:[], extrato:[], arquivo:[]}  (arquivo = linhas da planilha antiga de retirada de prêmios)
// Datas ISO no fuso America/Sao_Paulo ("2026-10-16" ou "2026-10-16T14:30:00"), sem depender de UTC. Dinheiro em reais e moedas como números (nada de centavos).
// Números e prazos moram em s.ind.config; nenhuma tela precisa de valor fixo.

import { hojeSP, agoraSP, somaDias, diasEntre, listaDias, janela } from "./cadastro-leads";

var LOCAL = (function(){ try { var m = import.meta.glob("./indicacoes.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var p2 = function(n){ return String(n).padStart(2,"0"); };
var num = function(v){ var n = Number(v); return isFinite(n) ? n : 0; };
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var trim = function(v){ return String(v==null ? "" : v).trim(); };
var diaDe = function(iso){ return iso ? String(iso).slice(0,10) : ""; };
var apenasDigitos = function(v){ return String(v==null ? "" : v).replace(/\D/g, ""); };
var norm = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
var utcDe = function(dia){ var a = String(dia).split("-").map(Number); return Date.UTC(a[0], a[1]-1, a[2]); };
var ehDia = function(v){ return /^\d{4}-\d{2}-\d{2}$/.test(String(v||"")); };
// minutos desde 1970 de um ISO local (sem fuso): serve só para diferenças
function minutosDe(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(String(iso||"")); if(!m) return null; return Date.UTC(+m[1], +m[2]-1, +m[3], +(m[4]||0), +(m[5]||0), +(m[6]||0))/60000; }
function isoDeMinutos(min){ var d = new Date(min*60000); return d.getUTCFullYear()+"-"+p2(d.getUTCMonth()+1)+"-"+p2(d.getUTCDate())+"T"+p2(d.getUTCHours())+":"+p2(d.getUTCMinutes())+":00"; }
var semanaLonga = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"], semanaCurta = ["dom","seg","ter","qua","qui","sex","sáb"];
var MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
var diaSemana = function(dia){ return new Date(utcDe(dia)).getUTCDay(); };
var emHM = function(min){ return p2(Math.floor(min/60))+":"+p2(min%60); };
var deHM = function(hm){ var a = String(hm||"").split(":"); return (+a[0]||0)*60 + (+a[1]||0); };

// ---------- formatação ----------
function formatarReais(v){ return "R$ "+Number(v||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); }
function formatarMoedas(n){ n = Math.round(num(n)); return n.toLocaleString("pt-BR")+" "+(n===1 ? "moeda" : "moedas"); }
function formatarDia(dia){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dia||"")); return m ? m[3]+"/"+m[2]+"/"+m[1] : ""; }
function formatarDataHora(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(String(iso||"")); return m ? m[3]+"/"+m[2]+"/"+m[1]+(m[4] ? " "+m[4]+":"+m[5] : "") : ""; }
// "5541998402844" → "41998402844" (o 55 só serve no link do WhatsApp)
function semDdi(t){ var d = apenasDigitos(t); return (d.length===12 || d.length===13) && d.slice(0,2)==="55" ? d.slice(2) : d; }
function formatarTelefone(t){ var d = semDdi(t); if(d.length===11) return "("+d.slice(0,2)+") "+d.slice(2,7)+"-"+d.slice(7); if(d.length===10) return "("+d.slice(0,2)+") "+d.slice(2,6)+"-"+d.slice(6); return t ? String(t) : ""; }
// link do WhatsApp (null se não há telefone usável)
function linkWhatsapp(t){ var d = apenasDigitos(t); if(d.length<10) return null; return "https://wa.me/"+(d.slice(0,2)==="55" && d.length>=12 ? d : "55"+d); }
// "R$ 400 em semijoias" → "em semijoias"
function descricaoDoPremio(t){ var r = String(t||"").replace(/^R\$\s*[\d.,]+\s*/i, "").trim(); return r || null; }
// "há 2h", "há 1 dia e 6h"
function tempoDecorrido(desde, agora){
  var a = minutosDe(desde), b = minutosDe(agora||agoraSP()); if(a==null || b==null) return ""; var min = Math.max(0, Math.floor(b-a)); if(min<1) return "agora"; if(min<60) return "há "+min+"min";
  var h = Math.floor(min/60); if(h<24) return "há "+h+"h"; var d = Math.floor(h/24), r = h%24; return "há "+d+" "+(d===1 ? "dia" : "dias")+(r ? " e "+r+"h" : "");
}
// códigos de peça: aceita espaço, vírgula, ;, /, | e quebra de linha; sai em maiúsculas, sem vazios e sem repetidos
function normalizarCodigosPecas(entrada){
  var bruto = Array.isArray(entrada) ? entrada.join(" ") : String(entrada||""), vistos = {}, out = [];
  bruto.split(/[\s,;/|]+/).forEach(function(p){ var c = p.trim().toUpperCase(); if(c && !vistos[c]){ vistos[c] = 1; out.push(c); } });
  return out;
}

// ---------- vocabulário ----------
// resgate (prêmio que a revendedora pede com moedas)
var ETAPAS_RESGATE = ["solicitado", "aprovado", "entregue", "cancelado"];
var ROTULO_ABA_RESGATE = {solicitado:"Na fila", aprovado:"Aguardando retirada", entregue:"Retirados", cancelado:"Cancelados"};
var ROTULO_ITEM_RESGATE = {solicitado:"Na fila", aprovado:"Aguardando retirada", entregue:"Retirado", cancelado:"Cancelado · moedas devolvidas"};
var EXPLICACAO_RESGATE = {solicitado:"Pedido novo, ainda sem triagem", aprovado:"Kit separado, esperando a revendedora buscar", entregue:"Prêmio já retirado pela revendedora", cancelado:"Pedido cancelado — as moedas voltaram para ela"};
var TOM_RESGATE = {solicitado:"primary", aprovado:"info", entregue:"success", cancelado:"muted"};
// ações por etapa (a operação manda ação, nunca escolhe o status)
var ACOES_RESGATE = {
  solicitado:[{acao:"cancelar", rotulo:"Cancelar", tom:"perigo"}, {acao:"aprovar", rotulo:"Agendar retirada", tom:"avancar"}],
  aprovado:[{acao:"cancelar", rotulo:"Cancelar", tom:"perigo"}, {acao:"entregar", rotulo:"Confirmar retirada", tom:"avancar"}],
  entregue:[], cancelado:[]};
// funil da pessoa indicada
var ETAPAS_FUNIL = ["criado", "em_andamento", "cadastro_aprovado", "finalizado", "cancelado"];
var ETAPAS_FUNIL_ABAS = ["em_andamento", "cadastro_aprovado", "finalizado", "cancelado"];   // "Novas" (criado) não vira aba
var ORDEM_FUNIL = ["criado", "em_andamento", "cadastro_aprovado", "finalizado"];            // caminho de avançar/voltar
var ROTULO_FUNIL = {criado:"Novas", em_andamento:"Em andamento", cadastro_aprovado:"Cadastro aprovado", finalizado:"Kit entregue", cancelado:"Canceladas"};
var EXPLICACAO_FUNIL = {criado:"Indicação registrada, o funil ainda não começou a andar", em_andamento:"A indicada está sendo trabalhada no funil de cadastro", cadastro_aprovado:"Cadastro aprovado — falta o kit chegar até ela", finalizado:"Kit entregue à indicada: é o que credita as moedas", cancelado:"Indicação não avançou e não gera moedas"};
var TOM_FUNIL = {criado:"muted", em_andamento:"info", cadastro_aprovado:"primary", finalizado:"success", cancelado:"muted"};
var ETAPA_QUE_CREDITA = "finalizado";
var SITUACOES_TRABALHO = [{valor:"sim", rotulo:"Trabalha em empresa"}, {valor:"autonoma", rotulo:"Autônoma"}, {valor:"nao", rotulo:"Não trabalha"}];
var rotuloAba = function(e){ return ROTULO_ABA_RESGATE[e]||e; }, rotuloItem = function(e){ return ROTULO_ITEM_RESGATE[e]||e; }, explicacaoEtapa = function(e){ return EXPLICACAO_RESGATE[e]||""; }, tomEtapa = function(e){ return TOM_RESGATE[e]||"muted"; };
var rotuloFunil = function(e){ return ROTULO_FUNIL[e]||e; }, explicacaoFunil = function(e){ return EXPLICACAO_FUNIL[e]||""; }, tomFunil = function(e){ return TOM_FUNIL[e]||"muted"; };
function acoesDaEtapa(etapa){ return ACOES_RESGATE[etapa]||[]; }
function acaoPrincipal(etapa){ return acoesDaEtapa(etapa).find(function(a){ return a.tom==="avancar"; })||null; }
function podeExecutar(acao, etapa){ return acoesDaEtapa(etapa).some(function(a){ return a.acao===acao; }); }
function etapaSomenteLeitura(etapa){ return acoesDaEtapa(etapa).length===0; }
var etapaEmAberto = function(e){ return e==="solicitado" || e==="aprovado"; };

// ---------- estado ----------
// todos os números e prazos ficam aqui (config_set altera)
var CONFIG_PADRAO = {
  atrasoHoras:24, criticoHoras:48,                              // pedido em aberto há 24h = atrasado, 48h = crítico
  agendaDias:7, horaInicio:"08:00", horaFim:"18:00", passoMinutos:30,   // agendar: de hoje até +6, 08:00 a 18:00, de 30 em 30
  moedasMin:1, moedasMax:100000, motivoMax:120, observacaoMax:2000,     // crédito manual de moedas
  validadeDias:90, aplicarValidade:false,                       // moedas valem 90 dias (no app é regra do app; aqui só informa, a menos que ligue aplicarValidade)
  moedasPorKit:1000, creditarAoFinalizar:true,                  // ASSUMIDO: o app credita ao "Kit entregue"; 1.000 vem do rótulo da planilha antiga. Confirmar com o Marcus
  paginaFunil:50, paginaHistorico:50, paginaRanking:50,
  motivosCancelamento:["sem estoque", "não localizou", "pedido duplicado", "outro"]};
function indDemo(){
  var s = {v:1, seq:0, config:Object.assign({}, CONFIG_PADRAO, {motivosCancelamento:CONFIG_PADRAO.motivosCancelamento.slice()}), premios:[], revendedoras:[], indicacoes:[], resgates:[], extrato:[], arquivo:[]};
  if(LOCAL){
    (LOCAL.premios||[]).forEach(function(p){ s.premios.push(novoPremio(s, p)); });
    (LOCAL.revendedoras||[]).forEach(function(r){ s.revendedoras.push(novaRev(s, r)); });
    (LOCAL.indicacoes||[]).forEach(function(i){ s.indicacoes.push(novaIndicacao(s, i, agoraSP(), "arquivo", true)); });
    (LOCAL.resgates||[]).forEach(function(r){ s.resgates.push(novoResgate(s, r, agoraSP(), "arquivo", true)); });
    (LOCAL.extrato||[]).forEach(function(l){ s.extrato.push(novoLanc(s, l)); });
    s.arquivo = (LOCAL.arquivo||[]).map(function(l, i){ return Object.assign({linhaPlanilha:i+1}, l); });
  }
  return s;
}
function proximoId(s, d){ var id = d && d.id!=null ? d.id : (++s.seq); if(typeof id==="number" && id>s.seq) s.seq = id; return id; }
function novoPremio(s, d){ return {codigo:trim(d.codigo)||("P"+proximoId(s)), titulo:trim(d.titulo), custoMoedas:Math.max(0, Math.round(num(d.custoMoedas))), valor:r2(num(d.valor))}; }
function novaRev(s, d){ return {id:proximoId(s, d), nome:trim(d.nome), telefone:trim(d.telefone), email:trim(d.email), origem:d.origem||"manual", criadoEm:d.criadoEm||hojeSP()}; }
function novoLanc(s, d){ return {id:proximoId(s, d), revendedoraId:d.revendedoraId, tipo:d.tipo||"credito_manual", moedas:Math.round(num(d.moedas)), motivo:trim(d.motivo), em:d.em||agoraSP(), por:d.por||"—", ref:d.ref||null}; }
function opVazia(){ return {codigosPecas:[], responsavelNome:null, observacao:null, dataAgendada:null, valorVenda:null, valorDiferencaBrinde:null, vendidoSistema:false, vendidoSistemaEm:null, pecasNaoVendidas:false, pecasNaoVendidasEm:null, emContato:false, emContatoEm:null, retiradaMaleta:false, dataAcertoMaleta:null, representanteMaleta:null, atualizadoPor:null, atualizadoEm:null}; }
function novoResgate(s, d, agora, por, doArquivo){
  var criado = d.criadoEm||agora;
  return {id:proximoId(s, d), revendedoraId:d.revendedoraId, premioCodigo:d.premioCodigo||"", premioTitulo:d.premioTitulo||"", premioValor:r2(num(d.premioValor)), custoMoedas:Math.round(num(d.custoMoedas)), etapa:d.etapa||"solicitado",
    origem:d.origem||"balcao", debitou:d.debitou!==false, criadoEm:criado, aprovadoEm:d.aprovadoEm||null, entregueEm:d.entregueEm||null, canceladoEm:d.canceladoEm||null, canceladoMotivo:d.canceladoMotivo||null,
    operacao:Object.assign(opVazia(), d.operacao||{}), historico:d.historico||(doArquivo ? [] : [{em:criado, por:por, de:null, para:d.etapa||"solicitado", nota:d.origem==="app" ? "Lançado do app" : "Pedido no balcão"}])};
}
// caminho profissional do formulário → profissão, empresa, tempo, endereço da empresa e observação (igual ao original)
function pathCampos(f){
  var t = function(v){ return trim(v); }, cam = f.situacao;
  if(cam==="sim"){ var ee = [t(f.enderecoEmpresa), t(f.numeroEmpresa), t(f.cidadeEmpresa) ? "- "+t(f.cidadeEmpresa) : ""].filter(Boolean).join(", ").replace(", -", " -"); return {profissao:t(f.cargo), empresa:t(f.nomeEmpresa), tempoAtuacao:t(f.tempoAtuacaoEmpresa), enderecoEmpresa:ee, caminho:"Caminho: empresa"}; }
  if(cam==="autonoma") return {profissao:t(f.areaAutonoma), empresa:"", tempoAtuacao:t(f.tempoAutonoma), enderecoEmpresa:"", caminho:"Caminho: autônoma"};
  var curso = f.estudaGraduacao==="sim" ? t(f.cursoGraduacao) : "", obs = ["Caminho: não trabalha"]; if(curso) obs.push("Graduação: "+curso);
  return {profissao:curso || "Não trabalha", empresa:"", tempoAtuacao:"", enderecoEmpresa:"", caminho:obs.join(" | ")};
}
var CAMPOS_FORM = ["situacao", "nomeEmpresa", "cargo", "tempoAtuacaoEmpresa", "enderecoEmpresa", "numeroEmpresa", "cidadeEmpresa", "areaAutonoma", "tempoAutonoma", "estudaGraduacao", "cursoGraduacao"];
function novaIndicacao(s, d, agora, por, doArquivo){
  var form = {}; CAMPOS_FORM.forEach(function(k){ form[k] = d.form && d.form[k]!==undefined ? d.form[k] : (d[k]!==undefined ? d[k] : ""); }); if(!form.situacao) form.situacao = "nao";
  var pc = pathCampos(form), etapa = d.etapa||"em_andamento", criado = d.criadoEm||agora;
  var hist = d.historico || (doArquivo ? [] : [{em:criado, por:por, de:null, para:"criado", nota:""}].concat(etapa==="criado" ? [] : [{em:criado, por:por, de:"criado", para:"em_andamento", nota:""}]));
  return {id:proximoId(s, d), revendedoraId:d.revendedoraId, indicadaNome:trim(d.nome!==undefined ? d.nome : d.indicadaNome), indicadaWhatsapp:trim(d.whatsapp!==undefined ? d.whatsapp : d.indicadaWhatsapp),
    cidade:trim(d.cidade), cep:trim(d.cep), endereco:trim(d.endereco), numero:trim(d.numero), form:form, profissao:pc.profissao, empresa:pc.empresa, tempoAtuacao:pc.tempoAtuacao, enderecoEmpresa:pc.enderecoEmpresa,
    observacao:d.observacao!==undefined ? trim(d.observacao) : "Origem: admin | "+pc.caminho,
    etapa:etapa, etapaAntesCancelar:d.etapaAntesCancelar||null, motivoReprovacao:d.motivoReprovacao||null, moedasCreditadas:Math.round(num(d.moedasCreditadas)), creditadoEm:d.creditadoEm||null,
    criadoEm:criado, etapaAlteradaEm:d.etapaAlteradaEm||criado, origem:d.origem||"admin", historico:hist};
}

// ---------- moedas (extrato) ----------
// saldo da revendedora. FIFO: cada crédito vira um lote que vence em validadeDias; o débito consome o lote mais antigo ainda válido.
// Devolve {saldo, total, vencidas, proximoVencimento:{dia,moedas}|null}. total = soma simples do extrato; saldo = total, ou só o que não venceu se config.aplicarValidade
function saldoDe(s, revId, hoje){
  var h = hoje||hojeSP(), cfg = s.config, val = cfg.validadeDias>0 ? cfg.validadeDias : 0, total = 0, lotes = [];
  var ls = s.extrato.filter(function(l){ return String(l.revendedoraId)===String(revId); }).sort(function(a, b){ return (a.em||"").localeCompare(b.em||"") || (Number(a.id)-Number(b.id)); });
  ls.forEach(function(l){
    total += l.moedas; var dia = diaDe(l.em);
    if(l.moedas>0) lotes.push({rest:l.moedas, vence:val ? somaDias(dia, val) : "9999-12-31"});
    else { var falta = -l.moedas; lotes.forEach(function(lt){ if(falta>0 && lt.rest>0 && lt.vence>dia){ var t = Math.min(lt.rest, falta); lt.rest -= t; falta -= t; } }); }
  });
  var valido = 0, venc = 0, prox = null;
  lotes.forEach(function(lt){ if(lt.rest<=0) return; if(lt.vence>=h){ valido += lt.rest; if(val && (!prox || lt.vence<prox.dia)) prox = {dia:lt.vence, moedas:lt.rest}; else if(val && prox && lt.vence===prox.dia) prox.moedas += lt.rest; } else venc += lt.rest; });
  return {saldo:cfg.aplicarValidade ? valido : total, total:total, vencidas:venc, proximoVencimento:prox};
}
function extratoDe(s, revId){ return s.extrato.filter(function(l){ return String(l.revendedoraId)===String(revId); }).sort(function(a, b){ return (b.em||"").localeCompare(a.em||"") || (Number(b.id)-Number(a.id)); }); }
function lanca(s, revId, tipo, moedas, motivo, por, agora, ref){ var l = novoLanc(s, {revendedoraId:revId, tipo:tipo, moedas:moedas, motivo:motivo, em:agora, por:por, ref:ref}); s.extrato.push(l); return l; }

// ---------- agendamento ----------
function horariosDeRetirada(cfg){ var out = [], a = deHM(cfg.horaInicio), b = deHM(cfg.horaFim), p = Math.max(5, cfg.passoMinutos||30); for(var m=a; m<=b; m+=p) out.push(emHM(m)); return out; }
function rotuloDiaLongo(dia){ var d = new Date(utcDe(dia)); return semanaLonga[d.getUTCDay()]+", "+d.getUTCDate()+" de "+MESES[d.getUTCMonth()]; }
function rotuloDoChip(dia, hoje){ if(dia===hoje) return "Hoje"; if(dia===somaDias(hoje, 1)) return "Amanhã"; return semanaCurta[diaSemana(dia)]+" "+Number(dia.slice(8,10)); }
// dias de hoje até +agendaDias-1 ("Hoje", "Amanhã", "Quinta, 22 de outubro"); "Outra data…" fica para a tela (calendário)
function opcoesDeDia(cfg, hoje){ var h = hoje||hojeSP(), out = []; for(var i=0; i<cfg.agendaDias; i++){ var d = somaDias(h, i); out.push({valor:d, rotulo:i===0 ? "Hoje" : i===1 ? "Amanhã" : rotuloDiaLongo(d)}); } return out; }
function faixaDeDias(inicio, tamanho){ var n = tamanho||7, out = []; for(var i=0; i<n; i++) out.push(somaDias(inicio, i)); return out; }
function avancarFaixa(inicio, direcao, tamanho){ return somaDias(inicio, direcao*(tamanho||7)); }
function montarIsoAgendamento(dia, horario){ return dia+"T"+horario+":00"; }
// {dia, horario} do ISO guardado; horário arredondado para a meia hora mais próxima
function partirIsoAgendamento(iso){
  var m = minutosDe(iso); if(m==null || String(iso).length<16) return null; var d = new Date(m*60000), min = d.getUTCMinutes(), alvo = min<15 ? 0 : min<45 ? 30 : 60;
  var base = Math.floor(m/60)*60 + alvo, f = new Date(base*60000);
  return {dia:f.getUTCFullYear()+"-"+p2(f.getUTCMonth()+1)+"-"+p2(f.getUTCDate()), horario:p2(f.getUTCHours())+":"+p2(f.getUTCMinutes())};
}
// não aceita dia passado nem horário fora da grade
function podeConfirmarAgendamento(dia, horario, cfg, hoje){ if(!ehDia(dia)) return false; if(dia<(hoje||hojeSP())) return false; return horariosDeRetirada(cfg).indexOf(horario)>=0; }
// "Hoje, 14:30" / "Amanhã, 14:30" / "Quinta, 14:30"
function formatarHorarioAgendado(iso, hoje){
  var p = partirIsoAgendamento(iso); if(!p) return null; var h = hoje||hojeSP();
  return (p.dia===h ? "Hoje" : p.dia===somaDias(h, 1) ? "Amanhã" : semanaLonga[diaSemana(p.dia)])+", "+p.horario;
}

// ---------- atraso e ordem da fila ----------
function horasEsperando(criadoEm, agora){ var a = minutosDe(criadoEm), b = minutosDe(agora||agoraSP()); if(a==null || b==null) return 0; return Math.max(0, (b-a)/60); }
// só pedido em aberto atrasa; WhatsApp já feito (emContato) mantém "em dia"
function nivelDeAtraso(r, agora, cfg){
  if(!etapaEmAberto(r.etapa)) return "em-dia"; if(r.operacao && r.operacao.emContato) return "em-dia";
  var h = horasEsperando(r.criadoEm, agora); return h>=cfg.criticoHoras ? "critico" : h>=cfg.atrasoHoras ? "atrasado" : "em-dia";
}
var PESO_NIVEL = {critico:2, atrasado:1, "em-dia":0};
// mais atrasado primeiro; empatado, o mais antigo primeiro
function ordenarFila(lista, agora, cfg){ return lista.slice().sort(function(a, b){ return PESO_NIVEL[nivelDeAtraso(b, agora, cfg)]-PESO_NIVEL[nivelDeAtraso(a, agora, cfg)] || (a.criadoEm||"").localeCompare(b.criadoEm||"") || (Number(a.id)-Number(b.id)); }); }
function contarAtrasados(lista, agora, cfg){ return lista.filter(function(r){ return nivelDeAtraso(r, agora, cfg)!=="em-dia"; }).length; }
function avisoDeAtraso(s, agora){ var n = contarAtrasados(s.resgates, agora||agoraSP(), s.config); return n===0 ? null : n===1 ? "1 pedido esperando há mais de 1 dia" : n+" pedidos esperando há mais de 1 dia"; }

// ---------- busca ----------
function buscaRevendedoraPorId(s, id){ return s.revendedoras.find(function(r){ return String(r.id)===String(id); })||null; }
var nomeRev = function(s, id){ var r = buscaRevendedoraPorId(s, id); return r && r.nome ? r.nome : (id==null ? "Revendedora" : "Revendedora #"+id); };
var primeiroNome = function(s, id){ var r = buscaRevendedoraPorId(s, id); return r && r.nome ? r.nome.split(/\s+/)[0] : (id==null ? "a revendedora" : "a revendedora #"+id); };
// resgate com os dados da revendedora e o atraso, pronto para o card
function resgateVista(s, r, agora){
  var a = agora||agoraSP(), rv = buscaRevendedoraPorId(s, r.revendedoraId), nv = nivelDeAtraso(r, a, s.config), hs = horasEsperando(r.criadoEm, a);
  return Object.assign({}, r, {revendedora:rv ? {id:rv.id, nome:rv.nome, telefone:rv.telefone} : null, nomeRevendedora:nomeRev(s, r.revendedoraId), nivel:nv, horas:hs, esperando:tempoDecorrido(r.criadoEm, a), horarioAgendado:formatarHorarioAgendado(r.operacao.dataAgendada, diaDe(a)), acoes:acoesDaEtapa(r.etapa)});
}
// nome, telefone sem máscara, prêmio, nº do pedido e id da revendedora; ignora acento e caixa
function combinaBuscaResgate(s, r, termo){
  var alvo = norm(termo); if(!alvo) return true; var rv = buscaRevendedoraPorId(s, r.revendedoraId), tel = rv ? rv.telefone : "";
  var texto = norm([rv ? rv.nome : "", tel, r.premioTitulo, "#"+r.id, r.id].join(" ")); if(texto.indexOf(alvo)>=0) return true;
  var dg = apenasDigitos(termo); return dg.length>0 && [apenasDigitos(tel), String(r.id), String(r.revendedoraId)].join(" ").indexOf(dg)>=0;
}
function digitosCasam(tel, dg){ var n = semDdi(tel); return n.length>=8 && (n.indexOf(dg)>=0 || dg.indexOf(n)>=0); }

// ---------- leituras: fila de resgates ----------
function contagemEtapas(s){ var c = {solicitado:0, aprovado:0, entregue:0, cancelado:0}; s.resgates.forEach(function(r){ c[r.etapa]++; }); return c; }
function abasDaFila(s){ var c = contagemEtapas(s); return ETAPAS_RESGATE.map(function(e){ return {etapa:e, rotulo:ROTULO_ABA_RESGATE[e], quantidade:c[e]}; }); }
// o.q (busca), o.agora. Em aberto: mais atrasado primeiro; retirados/cancelados: mais recente primeiro
function filaPorEtapa(s, etapa, o){
  o = o||{}; var agora = o.agora||agoraSP(), lista = s.resgates.filter(function(r){ return r.etapa===etapa && combinaBuscaResgate(s, r, o.q||""); });
  if(etapaEmAberto(etapa)) lista = ordenarFila(lista, agora, s.config);
  else { var campo = etapa==="entregue" ? "entregueEm" : "canceladoEm"; lista = lista.sort(function(a, b){ return (b[campo]||b.criadoEm||"").localeCompare(a[campo]||a.criadoEm||"") || (Number(b.id)-Number(a.id)); }); }
  return lista.map(function(r){ return resgateVista(s, r, agora); });
}
function resgateDe(s, id, agora){ var r = s.resgates.find(function(x){ return String(x.id)===String(id); }); return r ? resgateVista(s, r, agora) : null; }
// peças + valor em venda > 0 + "revendedora confirmou"
function podeConfirmarEntrega(c){ var v = c.valorVenda==null || c.valorVenda==="" ? null : num(c.valorVenda); return normalizarCodigosPecas(c.codigosPecas||c.pecasTexto||"").length>0 && v!=null && v>0 && !!c.revendedoraConfirmou; }
// "R$ 20,00 acima do prêmio" (null se for exatamente o valor)
function diferencaDoPremio(valorVenda, premioValor){ var d = r2(num(valorVenda)-num(premioValor)); if(d===0) return null; return d>0 ? formatarReais(d)+" acima do prêmio" : formatarReais(-d)+" abaixo do prêmio"; }
// aviso na tela de cancelar: quantas moedas voltam e para quem
function avisoDeEstorno(s, r){ return r.debitou ? "Vamos devolver "+formatarMoedas(r.custoMoedas)+" para "+primeiroNome(s, r.revendedoraId)+"." : "As moedas deste pedido não foram debitadas aqui, então nada será devolvido."; }
// motivo final do cancelamento: chip pronto ou, se "outro", o texto livre
function motivoFinal(escolha, livre){ if(!escolha) return null; if(escolha!=="outro") return escolha; var t = trim(livre); return t||null; }
function filtrarBrindeMaleta(lista, soMaleta){ return soMaleta ? lista.filter(function(r){ return r.operacao && r.operacao.retiradaMaleta===true; }) : lista; }
function textoBrindeMaleta(op){ if(!op || !op.retiradaMaleta) return null; var d = formatarDia(op.dataAcertoMaleta), n = trim(op.representanteMaleta); return d && n ? "Brinde retirado da maleta no dia do acerto · "+d+" · "+n : null; }

// ---------- leituras: agendamentos e retiradas do dia ----------
// quem já tem data combinada e ainda não retirou, na ordem do relógio
function agendamentosDoDia(s, dia, agora){ return s.resgates.filter(function(r){ return r.etapa==="aprovado" && r.operacao.dataAgendada && diaDe(r.operacao.dataAgendada)===dia; }).sort(function(a, b){ return a.operacao.dataAgendada.localeCompare(b.operacao.dataAgendada); }).map(function(r){ return resgateVista(s, r, agora); }); }
// aprovados sem horário (aparecem hoje)
function resgatesSemHorario(s, agora){ return s.resgates.filter(function(r){ return r.etapa==="aprovado" && !r.operacao.dataAgendada; }).sort(function(a, b){ return (a.criadoEm||"").localeCompare(b.criadoEm||""); }).map(function(r){ return resgateVista(s, r, agora); }); }
function contagemPorDia(s, dias){ var c = {}; dias.forEach(function(d){ c[d] = 0; }); s.resgates.forEach(function(r){ if(r.etapa!=="aprovado" || !r.operacao.dataAgendada) return; var d = diaDe(r.operacao.dataAgendada); if(d in c) c[d]++; }); return c; }
// valor da retirada = o vendido ou, se vazio, o valor do prêmio
function valorDaRetirada(r){ return r.operacao && r.operacao.valorVenda!=null ? r.operacao.valorVenda : r.premioValor; }
function retiradasDoDia(s, dia, agora){ return s.resgates.filter(function(r){ return r.etapa==="entregue" && r.entregueEm && diaDe(r.entregueEm)===dia; }).sort(function(a, b){ return a.entregueEm.localeCompare(b.entregueEm); }).map(function(r){ return resgateVista(s, r, agora); }); }
function resumoDoDia(s, dia, agora){ var it = retiradasDoDia(s, dia, agora); return {dia:dia, quantidade:it.length, valorTotal:r2(it.reduce(function(t, r){ return t+valorDaRetirada(r); }, 0)), moedasTotal:it.reduce(function(t, r){ return t+r.custoMoedas; }, 0), itens:it}; }
var COLUNAS_CSV = ["Pedido", "Revendedora", "Telefone", "Prêmio", "Valor em venda (R$)", "Moedas", "Responsável", "Códigos das peças", "Retirado em", "Data do acerto", "Representante"];
var celulaCsv = function(v){ v = String(v==null ? "" : v); return /[";\r\n]/.test(v) ? '"'+v.replace(/"/g, '""')+'"' : v; };
// CSV com ; e vírgula decimal (o Excel em português abre direto); arquivo retiradas-indicacoes-<dia>.csv
function gerarCsvDoDia(s, dia, agora){
  var linhas = resumoDoDia(s, dia, agora).itens.map(function(r){ var op = r.operacao, rv = r.revendedora;
    return [r.id, r.nomeRevendedora, rv ? rv.telefone : "", r.premioTitulo, valorDaRetirada(r).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}), r.custoMoedas, op.responsavelNome||"", (op.codigosPecas||[]).join(" "), formatarDataHora(r.entregueEm), op.retiradaMaleta ? formatarDia(op.dataAcertoMaleta) : "", op.retiradaMaleta ? (op.representanteMaleta||"") : ""].map(celulaCsv).join(";"); });
  return [COLUNAS_CSV.join(";")].concat(linhas).join("\r\n");
}
var nomeDoArquivoCsv = function(dia){ return "retiradas-indicacoes-"+dia+".csv"; };

// ---------- leituras: revendedoras e ranking ----------
// busca: mínimo 2 caracteres; só dígitos com até 6 = id; telefone casa com 3 ou mais dígitos
function buscarRevendedoras(s, q){
  var t = trim(q); if(t.length<2) return []; var alvo = norm(t), dg = apenasDigitos(t), soDig = /^\d+$/.test(t);
  return s.revendedoras.filter(function(r){ if(soDig && dg.length<=6 && String(r.id)===dg) return true; if(norm(r.nome).indexOf(alvo)>=0 || norm(r.email).indexOf(alvo)>=0) return true; return dg.length>=3 && digitosCasam(r.telefone, dg); });
}
function contagemDaRev(s, revId){ var inds = s.indicacoes.filter(function(i){ return String(i.revendedoraId)===String(revId); }); return {indicacoes:inds.length, emAndamento:inds.filter(function(i){ return i.etapa==="criado" || i.etapa==="em_andamento" || i.etapa==="cadastro_aprovado"; }).length, kits:inds.filter(function(i){ return i.etapa==="finalizado"; }).length}; }
// ranking: mais indicações, depois mais moedas (saldo), depois nome. o = {q, pagina (0 = primeira), limite, hoje}
function ranking(s, o){
  o = o||{}; var base = trim(o.q) ? buscarRevendedoras(s, o.q) : s.revendedoras, lim = Math.max(1, o.limite||s.config.paginaRanking), pg = Math.max(0, o.pagina||0);
  var todos = base.map(function(r){ var c = contagemDaRev(s, r.id), sd = saldoDe(s, r.id, o.hoje); return {id:r.id, nome:r.nome, telefone:r.telefone, indicacoes:c.indicacoes, emAndamento:c.emAndamento, kits:c.kits, moedas:sd.saldo, vencidas:sd.vencidas, proximoVencimento:sd.proximoVencimento, resgates:s.resgates.filter(function(x){ return String(x.revendedoraId)===String(r.id); }).length}; })
    .sort(function(a, b){ return b.indicacoes-a.indicacoes || b.moedas-a.moedas || a.nome.localeCompare(b.nome, "pt-BR"); });
  todos.forEach(function(x, i){ x.posicao = i+1; });
  return {itens:todos.slice(pg*lim, (pg+1)*lim), paginacao:{total:todos.length, limit:lim, offset:pg*lim, hasMore:(pg+1)*lim<todos.length}};
}
// prêmios que ela pode pedir agora (com saldo)
function premiosDaRevendedora(s, revId, hoje){ var sd = saldoDe(s, revId, hoje).saldo; return {saldoMoedas:sd, premios:s.premios.map(function(p){ return Object.assign({}, p, {resgatavel:sd>=p.custoMoedas && p.custoMoedas>0}); })}; }

// ---------- leituras: funil das indicadas ----------
function totaisVaziosFunil(){ return {criado:0, em_andamento:0, cadastro_aprovado:0, finalizado:0, cancelado:0}; }
function totaisDoFunil(s, revId){ var t = totaisVaziosFunil(); s.indicacoes.forEach(function(i){ if(revId!=null && revId!=="" && String(i.revendedoraId)!==String(revId)) return; t[i.etapa]++; }); return t; }
function abasDoFunil(totais){ return ETAPAS_FUNIL_ABAS.map(function(e){ return {etapa:e, rotulo:ROTULO_FUNIL[e], quantidade:totais[e]||0}; }); }
var nomeDaIndicada = function(i){ return trim(i.indicadaNome) || "Indicação #"+i.id; };
// conversão = Kit entregue ÷ (Kit entregue + Canceladas); sem nada fechado, taxa = null (a tela mostra "—", nunca 0%)
function resumoDeConversao(t){
  var kit = t.finalizado, canc = t.cancelado, apr = t.cadastro_aprovado, and = t.criado+t.em_andamento, fech = kit+canc;
  return {entraram:and+apr+fech, viraramKit:kit, emAndamento:and, cadastroAprovado:apr, canceladas:canc, fecharam:fech, taxa:fech===0 ? null : kit/fech};
}
var taxaFormatada = function(taxa){ return taxa===null || taxa===undefined ? "—" : Math.round(taxa*100)+"%"; };
var legendaDaTaxa = function(r){ return r.taxa===null ? "nenhuma indicação fechou ainda" : r.viraramKit+" de "+r.fecharam+" que já fecharam"; };
// o = {etapa (padrão em_andamento), q, revendedoraId, pagina (0 = primeira), limite}. Mais recente mexida primeiro. totais acompanham só o filtro de revendedora
function funilPagina(s, o){
  o = o||{}; var etapa = o.etapa||"em_andamento", alvo = norm(o.q), dg = apenasDigitos(o.q), lim = Math.max(1, o.limite||s.config.paginaFunil), pg = Math.max(0, o.pagina||0), hasRev = o.revendedoraId!=null && o.revendedoraId!=="";
  var lista = s.indicacoes.filter(function(i){
    if(i.etapa!==etapa) return false; if(hasRev && String(i.revendedoraId)!==String(o.revendedoraId)) return false; if(!alvo) return true;
    var texto = norm([i.indicadaNome, i.indicadaWhatsapp, nomeRev(s, i.revendedoraId), "#"+i.id, i.cidade].join(" ")); if(texto.indexOf(alvo)>=0) return true;
    return dg.length>0 && (digitosCasam(i.indicadaWhatsapp, dg) || String(i.id)===dg);
  }).sort(function(a, b){ return (b.etapaAlteradaEm||"").localeCompare(a.etapaAlteradaEm||"") || (Number(b.id)-Number(a.id)); });
  var itens = lista.slice(pg*lim, (pg+1)*lim).map(function(i){ var rv = buscaRevendedoraPorId(s, i.revendedoraId); return Object.assign({}, i, {nome:nomeDaIndicada(i), rotuloEtapa:ROTULO_FUNIL[i.etapa], revendedora:rv ? {id:rv.id, nome:rv.nome, telefone:rv.telefone} : null, nomeRevendedora:nomeRev(s, i.revendedoraId)}); });
  return {itens:itens, paginacao:{total:lista.length, limit:lim, offset:pg*lim, hasMore:(pg+1)*lim<lista.length}, totais:totaisDoFunil(s, hasRev ? o.revendedoraId : null)};
}
// "51–100 de 128"
function estadoDaPaginacao(p, qtd){ var lim = Math.max(1, p.limit); return {paginaAtual:Math.floor(p.offset/lim)+1, totalDePaginas:Math.max(1, Math.ceil(p.total/lim)), primeiroDaPagina:qtd===0 ? 0 : p.offset+1, ultimoDaPagina:p.offset+qtd, total:p.total, podeVoltar:p.offset>0, podeAvancar:p.hasMore}; }
var textoDaPaginacao = function(e){ return e.total===0 ? "nenhum resultado" : e.primeiroDaPagina+"–"+e.ultimoDaPagina+" de "+e.total; };
function indicacaoDe(s, id){ var i = s.indicacoes.find(function(x){ return String(x.id)===String(id); }); if(!i) return null; var rv = buscaRevendedoraPorId(s, i.revendedoraId); return Object.assign({}, i, {nome:nomeDaIndicada(i), rotuloEtapa:ROTULO_FUNIL[i.etapa], revendedora:rv ? {id:rv.id, nome:rv.nome, telefone:rv.telefone} : null, nomeRevendedora:nomeRev(s, i.revendedoraId), proxima:proximaEtapa(i.etapa), anterior:etapaAnterior(i)}); }
function proximaEtapa(e){ var k = ORDEM_FUNIL.indexOf(e); return k>=0 && k<ORDEM_FUNIL.length-1 ? ORDEM_FUNIL[k+1] : null; }
function etapaAnterior(i){ if(i.etapa==="cancelado") return i.etapaAntesCancelar || "em_andamento"; var k = ORDEM_FUNIL.indexOf(i.etapa); return k>0 ? ORDEM_FUNIL[k-1] : null; }

// ---------- leituras: histórico ----------
// arquivo da planilha antiga + indicações que viraram "Kit entregue" aqui. Moedas da planilha (1.000 por kit) são só rótulo.
var rotuloDoStatus = function(st){ var l = trim(st); if(!l) return "Sem status"; var m = l.toLocaleLowerCase("pt-BR"); return m.charAt(0).toLocaleUpperCase("pt-BR")+m.slice(1); };
function itemDaPlanilha(l, moedasKit){
  var sit = rotuloDoStatus(l.status), det = [l.motivo, l.observacao].filter(function(p){ return p && String(p).trim(); }).join(" · ");
  return {id:"planilha:"+l.linhaPlanilha, origem:"planilha", quando:(l.contaMoedas ? (l.dataKitEntregue||l.dataIndicacao) : l.dataIndicacao)||null, nomeRevendedora:trim(l.nomeRevendedora)||"Revendedora sem nome", telefoneRevendedora:l.telefoneRevendedora||null, categoria:l.categoria||null,
    nomeIndicada:l.nomeIndicada||null, telefoneIndicada:l.telefoneIndicada||null, situacao:sit, contaMoedas:!!l.contaMoedas, aVerificar:!!l.aVerificar, moedas:l.contaMoedas ? moedasKit : 0, detalhe:det && norm(det)!==norm(sit) ? det : null};
}
function itemDoSistema(s, i){ var rv = buscaRevendedoraPorId(s, i.revendedoraId); return {id:"sistema:"+i.id, origem:"sistema", quando:i.creditadoEm||i.etapaAlteradaEm||i.criadoEm, nomeRevendedora:nomeRev(s, i.revendedoraId), telefoneRevendedora:rv ? rv.telefone : null, categoria:null, nomeIndicada:i.indicadaNome||null, telefoneIndicada:i.indicadaWhatsapp||null, situacao:"Kit entregue", contaMoedas:i.moedasCreditadas>0, aVerificar:false, moedas:i.moedasCreditadas, detalhe:null}; }
// o = {origem:"todas"|"planilha"|"sistema", soMoedas, q, from, to (dias), pagina (0 = primeira), limite}. Indicada com o mesmo telefone nos dois lados aparece uma vez só em "Tudo"
function historico(s, o){
  o = o||{}; var origem = o.origem||"todas", lim = Math.max(1, Math.min(100, o.limite||s.config.paginaHistorico)), pg = Math.max(0, o.pagina||0), kit = s.config.moedasPorKit;
  var daPlan = s.arquivo.map(function(l){ return itemDaPlanilha(l, kit); }), doSis = s.indicacoes.filter(function(i){ return i.etapa==="finalizado" || i.moedasCreditadas>0; }).map(function(i){ return itemDoSistema(s, i); });
  var tels = {}; doSis.forEach(function(x){ var d = semDdi(x.telefoneIndicada); if(d.length>=8) tels[d] = 1; });
  var rep = function(x){ var d = semDdi(x.telefoneIndicada); return d.length>=8 && !!tels[d]; };
  var repetidas = daPlan.filter(rep), semRep = daPlan.filter(function(x){ return !rep(x); });
  var por = {todas:doSis.concat(semRep), planilha:daPlan, sistema:doSis}, soM = function(l){ return o.soMoedas ? l.filter(function(x){ return x.contaMoedas; }) : l; };
  var de = o.from ? diaDe(o.from) : null, ate = o.to ? diaDe(o.to) : null, alvo = norm(o.q), dg = apenasDigitos(o.q);
  var filtrados = soM(por[origem]||por.todas).filter(function(x){
    var d = diaDe(x.quando); if(de && (!d || d<de)) return false; if(ate && (!d || d>ate)) return false; if(!alvo) return true;
    if([x.nomeRevendedora, x.nomeIndicada, x.telefoneRevendedora, x.telefoneIndicada, x.situacao, x.categoria, x.detalhe].some(function(c){ return c && norm(c).indexOf(alvo)>=0; })) return true;
    return dg.length>=3 && (digitosCasam(x.telefoneRevendedora, dg) || digitosCasam(x.telefoneIndicada, dg));
  }).sort(function(a, b){ if(a.quando===b.quando) return a.nomeRevendedora.localeCompare(b.nomeRevendedora, "pt-BR"); if(!a.quando) return 1; if(!b.quando) return -1; return a.quando<b.quando ? 1 : -1; });
  return {itens:filtrados.slice(pg*lim, (pg+1)*lim), paginacao:{total:filtrados.length, limit:lim, offset:pg*lim, hasMore:(pg+1)*lim<filtrados.length},
    resumo:{planilha:daPlan.length, planilhaComMoedas:daPlan.filter(function(x){ return x.contaMoedas; }).length, sistema:doSis.length, repetidasNoSistema:repetidas.length},
    contagem:{todas:soM(por.todas).length, planilha:soM(por.planilha).length, sistema:soM(por.sistema).length}};
}

// ---------- leituras: indicadores do topo ----------
function indicadoresResgates(s, hoje, agora){
  var h = hoje||hojeSP(), a = agora||(h+"T12:00:00"), c = contagemEtapas(s), ab = s.resgates.filter(function(r){ return etapaEmAberto(r.etapa); }), rd = resumoDoDia(s, h, a);
  var niv = ab.map(function(r){ return nivelDeAtraso(r, a, s.config); });
  return {naFila:c.solicitado, aguardando:c.aprovado, retirados:c.entregue, cancelados:c.cancelado, atrasados:niv.filter(function(n){ return n!=="em-dia"; }).length, criticos:niv.filter(function(n){ return n==="critico"; }).length,
    agendadosHoje:agendamentosDoDia(s, h, a).length, semHorario:resgatesSemHorario(s, a).length, retiradasHoje:rd.quantidade, valorHoje:rd.valorTotal, moedasHoje:rd.moedasTotal, aviso:avisoDeAtraso(s, a)};
}
function indicadoresFunil(s, revId){ var t = totaisDoFunil(s, revId), c = resumoDeConversao(t); return {totais:t, conversao:c, taxaTexto:taxaFormatada(c.taxa), legenda:legendaDaTaxa(c)}; }
function indicadoresMoedas(s, hoje){ var emCirculo = 0, venc = 0; s.revendedoras.forEach(function(r){ var sd = saldoDe(s, r.id, hoje); emCirculo += sd.saldo; venc += sd.vencidas; }); return {revendedoras:s.revendedoras.length, emCirculo:emCirculo, vencidas:venc}; }

// ---------- ações ----------
// devolve {patch, msg}; patch vazio + msg = recusado. a.por = quem fez; a.agora (opcional, ISO) só para testes
// ops: config_set · premio_add/set/del · rev_add/set/del · ind_add/set/avancar/voltar/etapa/del · resgate_add/set/agendar/entregar/cancelar/del · moedas_credito · moedas_del
function indReduz(s, a){
  var ind = clone(s.ind), cfg = ind.config, por = a.por||"—", agora = a.agora||agoraSP(), hoje = diaDe(agora), recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg){ return {patch:{ind:ind}, msg:msg}; };
  var rev = function(id){ return buscaRevendedoraPorId(ind, id); };
  var ind1 = function(id){ return ind.indicacoes.find(function(x){ return String(x.id)===String(id!=null ? id : a.id); }); };
  var res1 = function(id){ return ind.resgates.find(function(x){ return String(x.id)===String(id!=null ? id : a.id); }); };
  // revendedora pelo id; ou, se veio só o nome, acha pelo telefone/nome ou cria (o app não está ligado: cadastro manual)
  var achaRev = function(){
    if(a.revendedoraId!=null && a.revendedoraId!==""){ var r0 = rev(a.revendedoraId); return r0 ? {r:r0} : {erro:"Revendedora não encontrada."}; }
    var nm = trim(a.revendedoraNome); if(!nm) return {erro:"Escolha a revendedora."};
    var dg = semDdi(a.revendedoraTelefone), r1 = (dg.length>=8 ? ind.revendedoras.find(function(x){ return semDdi(x.telefone)===dg; }) : null) || ind.revendedoras.find(function(x){ return norm(x.nome)===norm(nm); });
    if(r1) return {r:r1}; var nr = novaRev(ind, {nome:nm, telefone:a.revendedoraTelefone, email:a.revendedoraEmail, criadoEm:hoje}); ind.revendedoras.push(nr); return {r:nr};
  };
  // muda a etapa de uma indicação: histórico, crédito de moedas ao entrar em "Kit entregue" e estorno ao sair
  var muda = function(i, para, nota){
    var de = i.etapa; if(de===para) return "Já está em "+ROTULO_FUNIL[para]+".";
    if(para==="cancelado") i.etapaAntesCancelar = de; if(de==="cancelado") i.etapaAntesCancelar = null;
    i.etapa = para; i.etapaAlteradaEm = agora;
    if(para!=="cancelado") i.motivoReprovacao = null;
    if(para===ETAPA_QUE_CREDITA && cfg.creditarAoFinalizar && !(i.moedasCreditadas>0)){ var m = a.moedas!=null && a.moedas!=="" ? Math.round(num(a.moedas)) : cfg.moedasPorKit; if(m>0){ lanca(ind, i.revendedoraId, "indicacao", m, "Kit entregue: "+nomeDaIndicada(i), por, agora, {indicacaoId:i.id}); i.moedasCreditadas = m; i.creditadoEm = agora; } }
    if(de===ETAPA_QUE_CREDITA && i.moedasCreditadas>0){ lanca(ind, i.revendedoraId, "estorno_indicacao", -i.moedasCreditadas, "Indicação saiu de Kit entregue: "+nomeDaIndicada(i), por, agora, {indicacaoId:i.id}); i.moedasCreditadas = 0; i.creditadoEm = null; }
    i.historico.push({em:agora, por:por, de:de, para:para, nota:trim(nota)}); return null;
  };
  var numOpc = function(v){ return v===undefined || v===null || v==="" ? undefined : num(v); };
  // grava dados de balcão: campo não enviado (undefined) NÃO apaga; null limpa. Nunca mexe na etapa. Devolve texto de erro ou null
  var balcao = function(op, d){
    if(d.codigosPecas!==undefined) op.codigosPecas = d.codigosPecas==null ? [] : normalizarCodigosPecas(d.codigosPecas);
    ["responsavelNome", "observacao"].forEach(function(k){ if(d[k]!==undefined) op[k] = d[k]==null ? null : (trim(d[k]) || null); });
    if(op.observacao && op.observacao.length>cfg.observacaoMax) return "A observação passou de "+cfg.observacaoMax+" caracteres.";
    if(op.responsavelNome && op.responsavelNome.length>120) return "O nome do responsável é grande demais.";
    if(d.dataAgendada!==undefined) op.dataAgendada = d.dataAgendada || null;
    var er = null; ["valorVenda", "valorDiferencaBrinde"].forEach(function(k){ if(d[k]===undefined) return; if(d[k]===null || d[k]==="") op[k] = null; else { var v = num(d[k]); if(v<0) er = "O valor não pode ser negativo."; else op[k] = r2(v); } }); if(er) return er;
    ["vendidoSistema", "pecasNaoVendidas", "emContato"].forEach(function(k){ if(d[k]===undefined) return; var v = !!d[k]; if(v && !op[k]) op[k+"Em"] = agora; if(!v) op[k+"Em"] = null; op[k] = v; });   // a data da marca nasce quando vira verdadeira; desmarcar limpa
    if(d.retiradaMaleta!==undefined){ op.retiradaMaleta = !!d.retiradaMaleta; if(!op.retiradaMaleta){ op.dataAcertoMaleta = null; op.representanteMaleta = null; } }
    if(d.dataAcertoMaleta!==undefined && d.retiradaMaleta!==false){ var dm = trim(d.dataAcertoMaleta); if(dm && !ehDia(dm)) return "Data do acerto inválida."; op.dataAcertoMaleta = dm || null; }
    if(d.representanteMaleta!==undefined && d.retiradaMaleta!==false) op.representanteMaleta = trim(d.representanteMaleta) || null;
    op.atualizadoPor = por; op.atualizadoEm = agora; return null;
  };
  switch(a.op){
    case "config_set": {
      var NUMS = ["atrasoHoras", "criticoHoras", "agendaDias", "passoMinutos", "moedasMin", "moedasMax", "motivoMax", "observacaoMax", "validadeDias", "moedasPorKit", "paginaFunil", "paginaHistorico", "paginaRanking"];
      for(var ci=0; ci<NUMS.length; ci++){ var kn = NUMS[ci], v = numOpc(a[kn]); if(v!==undefined){ if(v<0) return recusa("O valor não pode ser negativo."); cfg[kn] = Math.round(v); } }
      if(cfg.criticoHoras<cfg.atrasoHoras) return recusa("O prazo crítico não pode ser menor que o de atraso."); if(cfg.moedasMax<cfg.moedasMin) return recusa("O máximo de moedas não pode ser menor que o mínimo.");
      ["horaInicio", "horaFim"].forEach(function(k){ if(a[k]!==undefined && /^\d{2}:\d{2}$/.test(a[k])) cfg[k] = a[k]; }); if(deHM(cfg.horaFim)<deHM(cfg.horaInicio)) return recusa("A hora final não pode ser antes da inicial.");
      if(a.aplicarValidade!==undefined) cfg.aplicarValidade = !!a.aplicarValidade; if(a.creditarAoFinalizar!==undefined) cfg.creditarAoFinalizar = !!a.creditarAoFinalizar;
      if(a.motivosCancelamento!==undefined){ var ml = (a.motivosCancelamento||[]).map(trim).filter(Boolean); if(!ml.length) return recusa("Deixe pelo menos um motivo de cancelamento."); cfg.motivosCancelamento = ml; }
      return ok("Configuração salva.");
    }
    case "premio_add": { var np = trim(a.titulo); if(!np) return recusa("Informe o nome do prêmio."); if(!(num(a.custoMoedas)>0)) return recusa("Informe quantas moedas o prêmio custa."); var pn = novoPremio(ind, a); if(ind.premios.some(function(x){ return x.codigo===pn.codigo; })) return recusa("Já existe um prêmio com esse código."); ind.premios.push(pn); return ok("Prêmio adicionado."); }
    case "premio_set": { var pr = ind.premios.find(function(x){ return x.codigo===a.codigo; }); if(!pr) return recusa("Prêmio não encontrado."); if(a.titulo!==undefined){ if(!trim(a.titulo)) return recusa("Informe o nome do prêmio."); pr.titulo = trim(a.titulo); } if(a.custoMoedas!==undefined){ if(!(num(a.custoMoedas)>0)) return recusa("Informe quantas moedas o prêmio custa."); pr.custoMoedas = Math.round(num(a.custoMoedas)); } if(a.valor!==undefined) pr.valor = r2(num(a.valor)); return ok("Prêmio atualizado."); }
    case "premio_del": { if(!ind.premios.some(function(x){ return x.codigo===a.codigo; })) return recusa("Prêmio não encontrado."); ind.premios = ind.premios.filter(function(x){ return x.codigo!==a.codigo; }); return ok("Prêmio removido (os pedidos antigos continuam com o nome que tinham)."); }
    case "rev_add": {
      var nmr = trim(a.nome); if(!nmr) return recusa("Informe o nome da revendedora."); var dgr = semDdi(a.telefone);
      if(dgr.length>=8 && ind.revendedoras.some(function(x){ return semDdi(x.telefone)===dgr; })) return recusa("Já existe uma revendedora com esse telefone.");
      var nr2 = novaRev(ind, Object.assign({}, a, {id:a.id, criadoEm:hoje})); if(a.id!=null && rev(a.id)) return recusa("Já existe uma revendedora com esse número."); ind.revendedoras.push(nr2); return ok(nmr+" cadastrada.");
    }
    case "rev_set": { var rs = rev(a.id); if(!rs) return recusa("Revendedora não encontrada."); if(a.nome!==undefined){ if(!trim(a.nome)) return recusa("Informe o nome da revendedora."); rs.nome = trim(a.nome); } if(a.telefone!==undefined) rs.telefone = trim(a.telefone); if(a.email!==undefined) rs.email = trim(a.email); return ok("Revendedora atualizada."); }
    case "rev_del": {
      var rd = rev(a.id); if(!rd) return recusa("Revendedora não encontrada.");
      if(ind.indicacoes.some(function(x){ return String(x.revendedoraId)===String(a.id); }) || ind.resgates.some(function(x){ return String(x.revendedoraId)===String(a.id); }) || ind.extrato.some(function(x){ return String(x.revendedoraId)===String(a.id); })) return recusa("Ela já tem indicações, pedidos ou moedas lançadas: não dá para excluir.");
      ind.revendedoras = ind.revendedoras.filter(function(x){ return x!==rd; }); return ok("Revendedora removida.");
    }
    case "ind_add": {
      var rr = achaRev(); if(rr.erro) return recusa(rr.erro);
      var nmi = trim(a.nome!==undefined ? a.nome : a.indicadaNome); if(!nmi) return recusa("Informe o nome da indicada.");
      var wpp = a.whatsapp!==undefined ? a.whatsapp : a.indicadaWhatsapp, dgi = semDdi(wpp); if(dgi.length<10) return recusa("WhatsApp inválido.");
      if(ind.indicacoes.some(function(x){ return x.etapa!=="cancelado" && semDdi(x.indicadaWhatsapp)===dgi; })) return recusa("Esse WhatsApp já foi indicado.");
      var ni = novaIndicacao(ind, Object.assign({}, a, {revendedoraId:rr.r.id, nome:nmi, whatsapp:wpp, id:undefined, etapa:a.etapa==="criado" ? "criado" : "em_andamento", moedasCreditadas:0, creditadoEm:null, motivoReprovacao:null, etapaAntesCancelar:null, historico:undefined, origem:a.origem==="app" ? "app" : "admin"}), agora, por, false);
      ind.indicacoes.push(ni); return ok(nmi+" indicada por "+rr.r.nome+".");
    }
    case "ind_set": {
      var is = ind1(); if(!is) return recusa("Indicação não encontrada.");
      if(a.nome!==undefined || a.indicadaNome!==undefined){ var nn = trim(a.nome!==undefined ? a.nome : a.indicadaNome); if(!nn) return recusa("Informe o nome da indicada."); is.indicadaNome = nn; }
      if(a.whatsapp!==undefined || a.indicadaWhatsapp!==undefined){ var w2 = a.whatsapp!==undefined ? a.whatsapp : a.indicadaWhatsapp, d2 = semDdi(w2); if(d2.length<10) return recusa("WhatsApp inválido."); if(ind.indicacoes.some(function(x){ return x!==is && x.etapa!=="cancelado" && semDdi(x.indicadaWhatsapp)===d2; })) return recusa("Esse WhatsApp já foi indicado."); is.indicadaWhatsapp = trim(w2); }
      ["cidade", "cep", "endereco", "numero", "observacao"].forEach(function(k){ if(a[k]!==undefined) is[k] = trim(a[k]); });
      if(a.motivoReprovacao!==undefined) is.motivoReprovacao = trim(a.motivoReprovacao) || null;
      var mexeuForm = false; CAMPOS_FORM.forEach(function(k){ var v = a.form && a.form[k]!==undefined ? a.form[k] : a[k]; if(v!==undefined){ is.form[k] = v; mexeuForm = true; } });
      if(mexeuForm){ var pc = pathCampos(is.form); is.profissao = pc.profissao; is.empresa = pc.empresa; is.tempoAtuacao = pc.tempoAtuacao; is.enderecoEmpresa = pc.enderecoEmpresa; if(a.observacao===undefined && /^Origem: admin \| Caminho:/.test(is.observacao)) is.observacao = "Origem: admin | "+pc.caminho; }
      return ok("Indicação atualizada.");
    }
    case "ind_avancar": {
      var ia = ind1(); if(!ia) return recusa("Indicação não encontrada."); if(ia.etapa==="cancelado") return recusa("Está cancelada: use \"voltar\" para reabrir."); var prox = proximaEtapa(ia.etapa); if(!prox) return recusa("Já está no último passo.");
      var e1 = muda(ia, prox, a.nota); if(e1) return recusa(e1); return ok(nomeDaIndicada(ia)+": "+ROTULO_FUNIL[prox]+(ia.moedasCreditadas>0 && prox===ETAPA_QUE_CREDITA ? " · "+formatarMoedas(ia.moedasCreditadas)+" creditadas" : "")+".");
    }
    case "ind_voltar": {
      var iv = ind1(); if(!iv) return recusa("Indicação não encontrada."); var ant = etapaAnterior(iv); if(!ant) return recusa("Já está no primeiro passo.");
      var ev = muda(iv, ant, a.nota); if(ev) return recusa(ev); return ok(nomeDaIndicada(iv)+" voltou para "+ROTULO_FUNIL[ant]+".");
    }
    case "ind_etapa": {   // pular direto para uma etapa (inclusive cancelar, com o motivo)
      var ie = ind1(); if(!ie) return recusa("Indicação não encontrada."); if(ETAPAS_FUNIL.indexOf(a.etapa)<0) return recusa("Etapa desconhecida.");
      var motivo = trim(a.motivo!==undefined ? a.motivo : a.motivoReprovacao), ee = muda(ie, a.etapa, a.nota || (a.etapa==="cancelado" ? motivo : "")); if(ee) return recusa(ee); if(a.etapa==="cancelado") ie.motivoReprovacao = motivo || null;
      return ok(nomeDaIndicada(ie)+": "+ROTULO_FUNIL[a.etapa]+".");
    }
    case "ind_del": {
      var id0 = ind1(); if(!id0) return recusa("Indicação não encontrada.");
      if(id0.moedasCreditadas>0) lanca(ind, id0.revendedoraId, "estorno_indicacao", -id0.moedasCreditadas, "Indicação excluída: "+nomeDaIndicada(id0), por, agora, {indicacaoId:id0.id});
      ind.indicacoes = ind.indicacoes.filter(function(x){ return x!==id0; }); return ok("Indicação excluída"+(id0.moedasCreditadas>0 ? " (as moedas dela foram devolvidas ao extrato)." : "."));
    }
    case "resgate_add": {
      var rg = achaRev(); if(rg.erro) return recusa(rg.erro);
      var pm = ind.premios.find(function(x){ return x.codigo===a.premioCodigo; }); if(!pm) return recusa("Escolha o prêmio.");
      var deb = a.debitar!==false, ori = a.origem==="app" ? "app" : "balcao";   // balcão debita na hora; lançado do app também, a menos que o saldo dela já tenha saído lá (debitar:false)
      if(deb){ var sd = saldoDe(ind, rg.r.id, hoje).saldo; if(sd<pm.custoMoedas) return recusa("Saldo insuficiente. Ela tem "+sd.toLocaleString("pt-BR")+" moedas; o prêmio custa "+pm.custoMoedas.toLocaleString("pt-BR")+"."); }
      var nrg = novoResgate(ind, {revendedoraId:rg.r.id, premioCodigo:pm.codigo, premioTitulo:pm.titulo, premioValor:pm.valor, custoMoedas:pm.custoMoedas, origem:ori, debitou:deb, operacao:{observacao:trim(a.observacao)||null, responsavelNome:trim(a.responsavelNome)||null, atualizadoPor:por, atualizadoEm:agora}}, agora, por, false);
      if(a.criadoEm) nrg.criadoEm = a.criadoEm; ind.resgates.push(nrg);
      if(deb) lanca(ind, rg.r.id, "resgate", -pm.custoMoedas, (ori==="balcao" ? "Resgate balcão: " : "Resgate: ")+pm.titulo, por, agora, {resgateId:nrg.id});
      return ok("Pedido de "+pm.titulo+" criado para "+rg.r.nome+(deb ? " ("+formatarMoedas(pm.custoMoedas)+" debitadas)." : "."));
    }
    case "resgate_set": {
      var rt = res1(); if(!rt) return recusa("Pedido não encontrado."); var ers = balcao(rt.operacao, a); if(ers) return recusa(ers); return ok("Dados do balcão salvos.");
    }
    case "resgate_agendar": {   // agendar pela primeira vez leva o pedido para "Aguardando retirada"; reagendar só regrava a data
      var ra = res1(); if(!ra) return recusa("Pedido não encontrado."); if(!podeExecutar("aprovar", ra.etapa) && ra.etapa!=="aprovado") return recusa("Esse pedido já foi "+(ra.etapa==="entregue" ? "retirado." : "cancelado."));
      var dia = a.dia, hor = a.horario; if(a.iso){ var pa = partirIsoAgendamento(a.iso); if(!pa) return recusa("Data inválida."); dia = pa.dia; hor = pa.horario; }
      if(!ehDia(dia)) return recusa("Escolha o dia da retirada."); if(dia<hoje) return recusa("Não dá para agendar em um dia que já passou."); if(horariosDeRetirada(cfg).indexOf(hor)<0) return recusa("Escolha um horário entre "+cfg.horaInicio+" e "+cfg.horaFim+".");
      var antes = ra.operacao.dataAgendada; ra.operacao.dataAgendada = montarIsoAgendamento(dia, hor); ra.operacao.atualizadoPor = por; ra.operacao.atualizadoEm = agora;
      if(ra.etapa==="solicitado"){ ra.etapa = "aprovado"; ra.aprovadoEm = agora; ra.historico.push({em:agora, por:por, de:"solicitado", para:"aprovado", nota:"Retirada marcada para "+formatarDia(dia)+" "+hor}); }
      else ra.historico.push({em:agora, por:por, de:"aprovado", para:"aprovado", nota:"Reagendado"+(antes ? " de "+formatarDataHora(antes) : "")+" para "+formatarDia(dia)+" "+hor});
      return ok((antes ? "Reagendado" : "Retirada agendada")+": "+formatarDia(dia)+" às "+hor+".");
    }
    case "resgate_entregar": {   // confirmar retirada: exige peças, valor em venda > 0 e a revendedora ter confirmado
      var re = res1(); if(!re) return recusa("Pedido não encontrado."); if(re.etapa!=="aprovado") return recusa(re.etapa==="solicitado" ? "Agende a retirada antes de confirmar." : "Esse pedido já foi "+(re.etapa==="entregue" ? "retirado." : "cancelado."));
      var cod = a.codigosPecas!==undefined ? normalizarCodigosPecas(a.codigosPecas) : re.operacao.codigosPecas, vv = a.valorVenda!==undefined ? (a.valorVenda==null || a.valorVenda==="" ? null : num(a.valorVenda)) : re.operacao.valorVenda;
      if(cod.length===0) return recusa("Informe as peças retiradas antes de confirmar."); if(vv==null || vv<=0) return recusa("Informe o valor em venda das peças antes de confirmar."); if(a.revendedoraConfirmou!==true) return recusa("Confirme que a revendedora conferiu as peças.");
      var eb = balcao(re.operacao, {codigosPecas:cod, valorVenda:vv, valorDiferencaBrinde:a.valorDiferencaBrinde, responsavelNome:a.responsavelNome, observacao:a.observacao}); if(eb) return recusa(eb);
      re.etapa = "entregue"; re.entregueEm = a.entregueEm||agora; re.historico.push({em:agora, por:por, de:"aprovado", para:"entregue", nota:formatarReais(vv)+" em venda"+(diferencaDoPremio(vv, re.premioValor) ? " · "+diferencaDoPremio(vv, re.premioValor) : "")});
      return ok("Retirada confirmada: "+re.premioTitulo+" ("+formatarReais(vv)+").");
    }
    case "resgate_cancelar": {   // exige motivo; devolve as moedas se elas foram debitadas aqui
      var rc = res1(); if(!rc) return recusa("Pedido não encontrado."); if(!podeExecutar("cancelar", rc.etapa)) return recusa("Esse pedido já foi "+(rc.etapa==="entregue" ? "retirado." : "cancelado."));
      var mot = trim(a.motivo); if(!mot) return recusa("Diga o motivo do cancelamento.");
      var de0 = rc.etapa; rc.etapa = "cancelado"; rc.canceladoEm = agora; rc.canceladoMotivo = mot; var est = false;
      if(rc.debitou){ lanca(ind, rc.revendedoraId, "estorno", rc.custoMoedas, "Resgate cancelado: "+rc.premioTitulo+" ("+mot+")", por, agora, {resgateId:rc.id}); est = true; }
      rc.historico.push({em:agora, por:por, de:de0, para:"cancelado", nota:mot});
      return ok("Pedido cancelado"+(est ? " · "+formatarMoedas(rc.custoMoedas)+" devolvidas." : "."));
    }
    case "resgate_del": {
      var rx = res1(); if(!rx) return recusa("Pedido não encontrado."); if(etapaEmAberto(rx.etapa) && rx.debitou) lanca(ind, rx.revendedoraId, "estorno", rx.custoMoedas, "Pedido excluído: "+rx.premioTitulo, por, agora, {resgateId:rx.id});
      ind.resgates = ind.resgates.filter(function(x){ return x!==rx; }); return ok("Pedido excluído"+(etapaEmAberto(rx.etapa) && rx.debitou ? " (moedas devolvidas)." : "."));
    }
    case "moedas_credito": {   // crédito manual: inteiro de cfg.moedasMin a cfg.moedasMax; motivo opcional
      var rm = achaRev(); if(rm.erro) return recusa(rm.erro); var mo = num(a.moedas);
      if(mo!==Math.floor(mo) || mo<cfg.moedasMin || mo>cfg.moedasMax) return recusa("Informe um número inteiro de moedas entre "+cfg.moedasMin.toLocaleString("pt-BR")+" e "+cfg.moedasMax.toLocaleString("pt-BR")+".");
      var mt = trim(a.motivo); if(mt.length>cfg.motivoMax) return recusa("O motivo passou de "+cfg.motivoMax+" caracteres.");
      lanca(ind, rm.r.id, "credito_manual", mo, mt, por, agora, null); var sdn = saldoDe(ind, rm.r.id, hoje).saldo;
      return ok(formatarMoedas(mo)+" para "+rm.r.nome+". Saldo: "+formatarMoedas(sdn)+(cfg.validadeDias>0 ? " (valem "+cfg.validadeDias+" dias)." : "."));
    }
    case "moedas_del": {   // desfaz um crédito manual (os outros lançamentos nascem de indicação ou pedido e se corrigem por lá)
      var lm = ind.extrato.find(function(x){ return String(x.id)===String(a.id); }); if(!lm) return recusa("Lançamento não encontrado."); if(lm.tipo!=="credito_manual") return recusa("Só dá para excluir crédito manual; os outros se corrigem na indicação ou no pedido.");
      ind.extrato = ind.extrato.filter(function(x){ return x!==lm; }); return ok("Crédito de "+formatarMoedas(lm.moedas)+" excluído.");
    }
    default: return recusa("Ação desconhecida.");
  }
}

export { indDemo, indReduz, hojeSP, agoraSP, somaDias, diasEntre, listaDias, janela,
  CONFIG_PADRAO, ETAPAS_RESGATE, ETAPAS_FUNIL, ETAPAS_FUNIL_ABAS, ORDEM_FUNIL, SITUACOES_TRABALHO, ETAPA_QUE_CREDITA,
  formatarReais, formatarMoedas, formatarDia, formatarDataHora, semDdi, formatarTelefone, linkWhatsapp, descricaoDoPremio, tempoDecorrido, normalizarCodigosPecas,
  rotuloAba, rotuloItem, explicacaoEtapa, tomEtapa, rotuloFunil, explicacaoFunil, tomFunil, acoesDaEtapa, acaoPrincipal, podeExecutar, etapaSomenteLeitura, etapaEmAberto,
  saldoDe, extratoDe, horariosDeRetirada, rotuloDiaLongo, rotuloDoChip, opcoesDeDia, faixaDeDias, avancarFaixa, montarIsoAgendamento, partirIsoAgendamento, podeConfirmarAgendamento, formatarHorarioAgendado,
  horasEsperando, nivelDeAtraso, ordenarFila, contarAtrasados, avisoDeAtraso, buscaRevendedoraPorId, nomeRev, resgateVista, combinaBuscaResgate,
  contagemEtapas, abasDaFila, filaPorEtapa, resgateDe, podeConfirmarEntrega, diferencaDoPremio, avisoDeEstorno, motivoFinal, filtrarBrindeMaleta, textoBrindeMaleta,
  agendamentosDoDia, resgatesSemHorario, contagemPorDia, valorDaRetirada, retiradasDoDia, resumoDoDia, gerarCsvDoDia, nomeDoArquivoCsv,
  buscarRevendedoras, ranking, premiosDaRevendedora, totaisVaziosFunil, totaisDoFunil, abasDoFunil, nomeDaIndicada, resumoDeConversao, taxaFormatada, legendaDaTaxa, funilPagina, estadoDaPaginacao, textoDaPaginacao, indicacaoDe, proximaEtapa, etapaAnterior,
  historico, indicadoresResgates, indicadoresFunil, indicadoresMoedas };
