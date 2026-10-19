// Sorelly Admin · montagem — domain/link-pagamento.js
// Financeiro → Link de pagamento e maquininhas (ESBOÇO; contexto e regras em LINK-DE-PAGAMENTO.md). Módulo novo: não existe no SorellyAdmin.
// A revendedora pede um link (app ou WhatsApp), alguém do atendimento (ou a representante) gera, a cliente paga, o valor abate o acerto da revendedora e o comprovante vai no dia seguinte ao grupo da representante.
// Estado s.lp (só neste navegador). Nasce VAZIO (repositório é público). Dados reais, se existirem, vêm só de domain/link-pagamento.local.js (gitignored):
//   export default {config:{...}, meios:[], vinculos:[], revendedoras:[], solicitacoes:[]}
// NUNCA guardar senha, chave ou nome de pessoa no código: nos acessos só URL, identificação (usuário) e uma NOTA de onde a senha está guardada.
// Funções puras (sem React/DOM). Dinheiro em reais; datas ISO no fuso America/Sao_Paulo ("2026-10-16" ou "2026-10-16T14:30:00").
// Planilha de 2026 (Jan a Out): carregada de link-pagamento.local.js. Campos opcionais das solicitações importadas: autorizacao, vendaComLink, descontado, importado, mesPlanilha, suspeitaDuplicada, suspeitaDados.
// Ações (type "LP", op = nome): bonus_salvar, meio_salvar, meio_ativo, meio_excluir, vinc_salvar, vinc_excluir, rev_vincular, rev_remover, sol_criar, sol_mover, sol_obs, expirar, config_salvar. Toda ação guarda a.por.
// App da revendedora (19/10/2026): sol_criar com canal "app" + semMeio (a equipe escolhe o link ao gerar); campos novos da solicitação: linkUrl (endereço do link, a equipe cola), acertoId/usadoEm/usadoValor/excedente (link já descontado num acerto: usarLinksNoAcerto).
// Pendências: "conta mais negativa" para o Pix restante depende do módulo de caixa; Pagamentos a fornecedores recebe só o dado gerado por passadaParaFornecedor (não é lançado sozinho).

import { hojeSP, agoraSP, somaDias, diasEntre } from "./cadastro-leads";
import { CNPJS0 } from "./cnpjs";

import { ADQ, aplicarTaxasAdq, taxasDaFicha } from "@/apps/montagem/domain/adquirentes";
var LOCAL = (function(){ try { var m = import.meta.glob("./link-pagamento.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(x){ return null; } })();

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var p2 = function(n){ return String(n).padStart(2,"0"); };
var num = function(v){ var n = Number(typeof v==="string" ? v.replace(",", ".") : v); return isFinite(n) ? n : 0; };
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var trim = function(v){ return String(v==null ? "" : v).trim(); };
var norm = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
var diaDe = function(iso){ return iso ? String(iso).slice(0,10) : ""; };
function minutosDe(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(String(iso||"")); if(!m) return null; return Date.UTC(+m[1], +m[2]-1, +m[3], +(m[4]||0), +(m[5]||0), +(m[6]||0))/60000; }
function isoDeMinutos(min){ var d = new Date(min*60000); return d.getUTCFullYear()+"-"+p2(d.getUTCMonth()+1)+"-"+p2(d.getUTCDate())+"T"+p2(d.getUTCHours())+":"+p2(d.getUTCMinutes())+":00"; }

// ---------- formatação ----------
function formatarReais(v){ return "R$ "+Number(v||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); }
function formatarDia(dia){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dia||"")); return m ? m[3]+"/"+m[2]+"/"+m[1] : ""; }
function formatarDataHora(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(String(iso||"")); return m ? m[3]+"/"+m[2]+"/"+m[1]+(m[4] ? " "+m[4]+":"+m[5] : "") : ""; }

// ---------- vocabulário ----------
var TIPOS_MEIO = [["LINK", "Link de pagamento"], ["MAQUININHA", "Maquininha"]];
var ADQUIRENTES = ["Sicredi", "Getnet", "Cielo", "Bradesco", "Itaú", "Safra", "Axis", "Outro"];
var ADQ_FORNECEDOR = {Getnet:true, Cielo:true};   // maquininhas da Pontual (fornecedor): o valor passado vira pagamento de fornecedor
var BANDEIRAS = ["Visa", "Mastercard", "Elo", "Amex", "Hipercard", "Outras"];
var CANAIS = [["app", "Aplicativo"], ["whatsapp", "WhatsApp"]];
var EMISSORES = [["atendimento", "Atendimento"], ["representante", "Representante"]];
var INFORMACOES = [["nao_informado", "Não informado"], ["enviado", "Enviado"], ["ciente", "Ciente"]];
var ROTULO_INFO = {nao_informado:"Não informado", enviado:"Enviado", ciente:"Ciente"};
var STATUS_SEM_SUCESSO = ["negada", "abandonada", "bloqueada", "antifraude", "desfeito", "desistiu"];   // finais vindos da planilha (e do retorno da operadora): o link não virou pagamento
var STATUS = ["solicitado", "gerado", "pago", "comprovante", "expirado", "cancelado", "recusado"].concat(STATUS_SEM_SUCESSO);
var ROTULO_STATUS = {solicitado:"Solicitado", gerado:"Link gerado", pago:"Pago", comprovante:"Comprovante enviado", expirado:"Expirado", cancelado:"Cancelado", recusado:"Recusado", negada:"Negada", abandonada:"Abandonada", bloqueada:"Bloqueada", antifraude:"Antifraude", desfeito:"Pagamento desfeito", desistiu:"Desistiu"};
var COR_STATUS = {solicitado:"#FBBF24", gerado:"#60A5FA", pago:"#4ADE80", comprovante:"#22D3EE", expirado:"#EF4444", cancelado:"#94A3B8", recusado:"#94A3B8", negada:"#EF4444", antifraude:"#EF4444", bloqueada:"#EF4444", desfeito:"#EF4444", abandonada:"#94A3B8", desistiu:"#94A3B8"};
var FLUXO = ["solicitado", "gerado", "pago", "comprovante"];
var TRANSICOES = {solicitado:["gerado", "cancelado", "recusado"], gerado:["pago", "expirado", "cancelado"], pago:["comprovante"], comprovante:[], expirado:[], cancelado:[], recusado:[], negada:[], abandonada:[], bloqueada:[], antifraude:[], desfeito:[], desistiu:[]};
var EM_ANDAMENTO = {solicitado:1, gerado:1, pago:1};   // o que fica no quadro; o resto vai para o Histórico
var MOTIVOS_NAO_CONCLUSAO = STATUS_SEM_SUCESSO.concat(["expirado", "cancelado", "recusado"]);
var EXIGE_MOTIVO = {cancelado:1, recusado:1};
var MAX_PARCELAS = 12;   // limite técnico da tabela de taxas (o limite sem juros do link vem da configuração)
var PRAZO_PADRAO = {primeira:30, intervalo:30, antecipado:1};   // dias para o crédito sem antecipação (1ª parcela, entre parcelas) e com antecipação
var CONFIG_PADRAO = {horaLimite:18, minimo:80, parcelaMinima:50, maxParcelasSemJuros:10, faixas:[{ate:80, max:1}, {ate:400, max:4}, {ate:1500, max:6}], validadeHoras:12, tentativasDia:3, antecipaPadrao:true, bonus:{faixas:[], obs:""}};   // bonus.faixas = [{min, valor}]: valor pago no mês >= min dá o bônus do setor (editável em Análises)
// Lista de maquininhas por representante (19/10/2026): uma linha por máquina física. Dados reais só em domain/maquininhas.local.js (gitignored); sem o arquivo, nada muda.
var MAQ = (function(){ try { var m = import.meta.glob("./maquininhas.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(x){ return null; } })();
var ROTULO_STATUS_FN = function(s){ return ROTULO_STATUS[s] || s; };

// ---------- criação e migração do estado ----------
// 6 vendas SIMULADAS da Beatriz Nogueira (pedido do Marcus, 19/10/2026) para o app já abrir com dados: formas variadas e uma cobrança que vence hoje. Marcadas demo: não entram nos números do admin.
function demoVendasApp(){
  var hoje = hojeSP(), mes = hoje.slice(0, 7), dia = function(n, h){ return mes+"-"+String(n).padStart(2, "0")+"T"+h+":00"; };
  var v = function(i, quando, cliente, itens, bruto, desconto, forma, plano){ var liq = Math.round((bruto-desconto)*100)/100;
    return {id:"VD"+i, em:quando, revendedora:"Beatriz Nogueira", cliente:cliente, tipo:"venda", formas:[forma], bruto:bruto, desconto:desconto, valor:liq, parcelas:forma==="sorelly" ? 2 : (plano.length>1 ? plano.length-1 : 1), plano:plano, comissaoPct:0, comissao:0, itens:itens, demo:true}; };
  var p = function(valor, forma, data, pago){ return {valor:valor, forma:forma, data:data, pago:pago, pagoEm:pago ? data+"T12:00:00" : ""}; };
  return [
    v(1, dia(2, "10:12"), "Ana Paula", ["A2072", "B3519", "A2114"], 218, 0, "vista", [p(218, "vista", dia(2, "").slice(0, 10), true)]),
    v(2, dia(3, "15:40"), "Joana", ["B4732", "A2089"], 222, 0, "sorelly", [p(222, "link", dia(3, "").slice(0, 10), true)]),
    v(3, dia(4, "11:05"), "Carla", ["SP0589", "A2112", "B3863"], 414, 0, "combinado", [p(200, "pix", dia(4, "").slice(0, 10), true), p(214, "pix", dia(5, "").slice(0, 10), true)]),
    v(4, dia(5, "16:30"), "Fernanda", ["A2080"], 96, 0, "vista", [p(96, "vista", dia(5, "").slice(0, 10), true)]),
    v(5, dia(6, "09:50"), "Luciana", ["A2051", "A2112", "B3519", "A2089"], 332, 0, "mp", [p(332, "mp", dia(6, "").slice(0, 10), true)]),
    v(6, dia(7, "14:20"), "Patrícia", ["B4732", "B3863", "A2072"], 378, 18.9, "combinado", [p(160, "pix", dia(7, "").slice(0, 10), true), p(199.1, "pix", hoje, false)])];
}
function lpDemo(){
  var s = {v:1, seq:0, importV:0, config:clone(CONFIG_PADRAO), meios:[], vinculos:[], revendedoras:[], solicitacoes:[], vendasApp:demoVendasApp(), isencoes:[], log:[]};
  if(LOCAL){
    if(LOCAL.config) Object.assign(s.config, LOCAL.config);
    ["meios", "vinculos", "revendedoras", "solicitacoes"].forEach(function(k){ (LOCAL[k]||[]).forEach(function(x){ x = clone(x); if(!x.id) x.id = k.charAt(0).toUpperCase()+(++s.seq); s[k].push(k==="meios" ? novoMeio(s, x, "importação", "2026-10-16T00:00:00") : x); }); });   // meios passam por novoMeio: completam taxas, antecipação e prazos (sem taxa cadastrada = 0%)
    s.importV = 1;
  }
  return aplicarListaMaq(aplicarTaxasAdq(s));
}
// Migração única (lp.maqListaV): cria as máquinas da lista, liga cada representante à sua e marca as sem dados. Não apaga nada.
function aplicarListaMaq(lp){
  if(!MAQ || !lp || (lp.maqListaV||0)>=MAQ.versao) return lp;
  lp.isencoes = lp.isencoes || [];
  var achaVinc = function(rep){ return lp.vinculos.find(function(v){ return norm(v.representante)===norm(rep); }); };
  var poe = function(rep, mqId, semDados){ var v = achaVinc(rep); if(!v){ v = {id:"V"+(++lp.seq), representante:rep, maquininhaId:"", linkId:"", confirmacao:"", informacoes:"nao_informado"}; lp.vinculos.push(v); } v.maquininhaId = mqId; v.semDados = !!semDados; };
  var modelo = lp.meios.find(function(m){ return m.id==="MSERENITY"; });
  MAQ.maquininhas.forEach(function(d){
    if(!lp.meios.some(function(m){ return m.id===d.id; })){
      var ficha = ADQ && d.adquirente==="Sicredi" ? (ADQ.fichas||[]).find(function(x){ return x.cnpj===d.cnpjId && x.adq==="Sicredi"; }) : null;
      var base = {id:d.id, tipo:"MAQUININHA", nome:d.nome, cnpjId:d.cnpjId, adquirente:d.adquirente, aluguel:d.aluguel, grupoIsencao:d.grupo || ""};
      if(ficha) base.taxas = taxasDaFicha(ficha);   // reserva: a tabela da lista (abaixo) sobrescreve
      if(modelo && ficha && d.cnpjId==="59"){ base.antecipacao = modelo.antecipacao; base.prazoCredito = modelo.prazoCredito; }
      lp.meios.push(novoMeio(lp, base, "importação", "2026-10-19T00:00:00"));
    }
    var spec = MAQ.tabelas && MAQ.tabelas[d.adquirente+"|"+d.cnpjId], mq = lp.meios.find(function(m){ return m.id===d.id; });
    if(spec && mq){ var n = novoMeio(lp, Object.assign({}, mq, {taxas:spec.taxas, antecipacao:spec.antecipacao, debito:spec.debito, prazoCredito:spec.prazoCredito || mq.prazoCredito, taxaPix:spec.taxaPix || mq.taxaPix, aluguel:d.aluguel, grupoIsencao:d.grupo || ""}), "importação", mq.criadoEm); mq.prazoCredito = n.prazoCredito; mq.taxaPix = n.taxaPix; mq.taxas = n.taxas; mq.antecipacao = n.antecipacao; mq.debito = n.debito; mq.aluguel = n.aluguel; mq.grupoIsencao = n.grupoIsencao; }
    poe(d.rep, d.id, false);
  });
  (MAQ.pontual||[]).forEach(function(p){ var m = lp.meios.find(function(x){ return x.id===p.id; }); if(!m) return; m.aluguel = p.aluguel; m.dono = "Valdir"; if(p.uso) m.uso = p.uso; if(p.rep) poe(p.rep, p.id, false); });
  (MAQ.desligadas||[]).forEach(function(rep){ lp.vinculos = lp.vinculos.filter(function(v){ return norm(v.representante)!==norm(rep); }); (lp.revendedoras||[]).forEach(function(r){ if(norm(r.representante)===norm(rep)){ r.antiga = r.representante; r.representante = ""; } }); });
  (MAQ.inativos||[]).forEach(function(i){ var m = lp.meios.find(function(x){ return x.id===i.id; }); if(m){ m.ativo = false; m.uso = i.uso; } });
  (MAQ.semMaquininha||[]).forEach(function(rep){ poe(rep, "", false); });
  (MAQ.removerMeios||[]).forEach(function(id){ var emUso = lp.vinculos.some(function(v){ return v.maquininhaId===id || v.linkId===id; }) || (lp.solicitacoes||[]).some(function(x){ return x.meioId===id; }); if(!emUso) lp.meios = lp.meios.filter(function(m){ return m.id!==id; }); });
  (MAQ.isencoes||[]).forEach(function(i){ if(!lp.isencoes.some(function(x){ return x.grupo===i.grupo; })) lp.isencoes.push({grupo:i.grupo, rotulo:i.rotulo, meta:i.meta, mes:"", vendido:0}); });
  lp.maqListaV = MAQ.versao;
  if(lp.log) lp.log.push({em:Date.now(), por:"importação", op:"lista_maq", txt:"Lista de maquininhas de "+MAQ.atualizadoEm+" aplicada."});
  return lp;
}
function lpMigrar(lp){
  if(!lp) return lpDemo(); var maqV = lp.maqListaV, base = lpDemo(), traz = base.importV===1 && lp.importV!==1;   // traz = estado salvo antes da carga da planilha: acrescenta o que veio do arquivo local
  Object.keys(base).forEach(function(k){ if(lp[k]===undefined) lp[k] = base[k]; });
  Object.keys(CONFIG_PADRAO).forEach(function(k){ if(lp.config[k]===undefined) lp.config[k] = CONFIG_PADRAO[k]; });
  if(lp.regrasV!==2){ lp.regrasV = 2; ["minimo", "parcelaMinima", "maxParcelasSemJuros", "faixas"].forEach(function(k){ lp.config[k] = clone(CONFIG_PADRAO[k]); }); }   // regras por faixa de valor (19/10/2026): mínimo R$ 80 · 1x, 4x, 6x, 10x
  if(traz){ ["meios", "vinculos", "revendedoras", "solicitacoes"].forEach(function(k){ var ids = {}; lp[k].forEach(function(x){ ids[x.id] = 1; }); base[k].forEach(function(x){ if(!ids[x.id]) lp[k].push(x); }); }); lp.importV = 1; if(!(lp.config.bonus && lp.config.bonus.faixas && lp.config.bonus.faixas.length) && base.config.bonus) lp.config.bonus = base.config.bonus; }
  if(lp.demoVendasV!==1){ lp.demoVendasV = 1; if(!(lp.vendasApp||[]).some(function(v){ return v.demo; })) lp.vendasApp = (lp.vendasApp||[]).concat(demoVendasApp()); }   // 6 vendas de demonstração (Beatriz Nogueira)
  lp.maqListaV = maqV;   // a cópia das chaves da base não pode marcar a lista de maquininhas como já aplicada
  lp.v = 1; return aplicarListaMaq(aplicarTaxasAdq(lp));
}

// ---------- CNPJ e meios ----------
function opcoesCnpj(){ return CNPJS0.filter(function(c){ return c.id!=="ho"; }).map(function(c){ return {id:c.id, rotulo:"CNPJ "+c.id+(c.nome ? " · "+c.nome : "")}; }); }
var cnpjValido = function(id){ return !id || CNPJS0.some(function(c){ return c.id===id; }); };
var rotuloCnpj = function(id){ return id ? "CNPJ "+id : "Sem CNPJ"; };
var meioDe = function(s, id){ return s.lp.meios.find(function(m){ return m.id===id; }) || null; };
var nomeMeio = function(m){ return m ? m.nome+(m.cnpjId ? " (CNPJ "+m.cnpjId+")" : "") : "—"; };
var adquirenteVira = function(ad){ return !!ADQ_FORNECEDOR[ad]; };

// taxas: {todas:{"1":2.1,"2":3.4,...}, Visa:{...}} (% simples sobre o valor). Limpa e limita entre 0 e 100.
function normalizarTaxas(t){
  var out = {todas:{}}; t = t || {};
  Object.keys(t).forEach(function(b){ var linha = t[b] || {}, o = {};
    Object.keys(linha).forEach(function(n){ var v = linha[n]; if(v===""||v==null) return; var x = num(v); if(+n>=1 && +n<=MAX_PARCELAS) o[String(+n)] = Math.min(100, Math.max(0, r2(x))); });
    if(b==="todas" || Object.keys(o).length) out[b] = o; });
  return out;
}
// % da taxa para N parcelas: a da bandeira, senão a de "todas", senão 0
function taxaDe(meio, bandeira, n){
  var t = (meio && meio.taxas) || {}, k = String(n);
  if(bandeira && t[bandeira] && t[bandeira][k]!==undefined) return num(t[bandeira][k]);
  return t.todas && t.todas[k]!==undefined ? num(t.todas[k]) : 0;
}
function novoMeio(lp, d, por, agora){
  var ant = d.antecipacao || {};
  var pc = d.prazoCredito || {};
  return {id:d.id || "M"+(++lp.seq), tipo:d.tipo==="MAQUININHA" ? "MAQUININHA" : "LINK", nome:trim(d.nome), cnpjId:trim(d.cnpjId), adquirente:ADQUIRENTES.indexOf(d.adquirente)>=0 ? d.adquirente : "Outro", ativo:d.ativo!==false,
    viraPagamentoFornecedor:d.viraPagamentoFornecedor===undefined ? adquirenteVira(d.adquirente) : !!d.viraPagamentoFornecedor,
    taxas:normalizarTaxas(d.taxas),
    antecipacao:{ativa:!!ant.ativa, modo:ant.modo==="parcela" ? "parcela" : "mes", pctMes:Math.max(0, num(ant.pctMes)), pctParcela:normalizarTaxas({todas:ant.pctParcela}).todas},
    prazoCredito:{primeira:Math.max(0, Math.round(num(pc.primeira!==undefined ? pc.primeira : PRAZO_PADRAO.primeira))), intervalo:Math.max(0, Math.round(num(pc.intervalo!==undefined ? pc.intervalo : PRAZO_PADRAO.intervalo))), antecipado:Math.max(0, Math.round(num(pc.antecipado!==undefined ? pc.antecipado : PRAZO_PADRAO.antecipado)))},
    acessos:{url:trim((d.acessos||{}).url), identificacao:trim((d.acessos||{}).identificacao), notaSenha:trim((d.acessos||{}).notaSenha)},
    aluguel:(d.aluguel==null || d.aluguel==="") ? null : Math.max(0, r2(num(d.aluguel))), grupoIsencao:trim(d.grupoIsencao), dono:trim(d.dono), uso:trim(d.uso), taxaPix:d.taxaPix && num(d.taxaPix.pct)>0 ? {pct:r2(num(d.taxaPix.pct)), rotulo:trim(d.taxaPix.rotulo) || "Pix"} : null, debito:d.debito ? {vm:Math.max(0, r2(num(d.debito.vm))), dem:Math.max(0, r2(num(d.debito.dem)))} : null,
    passoAPasso:String(d.passoAPasso||""), criadoEm:d.criadoEm || agora, criadoPor:d.criadoPor || por};
}
// recusa formal de um meio; a nota da senha só pode dizer ONDE ela está guardada
function validarMeio(lp, d){
  if(!trim(d.nome)) return "Informe o nome do meio de recebimento.";
  if(!cnpjValido(trim(d.cnpjId))) return "CNPJ inválido.";
  if(d.tipo!=="LINK" && d.tipo!=="MAQUININHA") return "Escolha o tipo: link ou maquininha.";
  var nota = trim((d.acessos||{}).notaSenha);
  if(/(senha|password|chave|token)\s*[:=]\s*\S+/i.test(nota) || nota.length>120) return "Não registre a senha: indique apenas onde ela está guardada.";
  var t = d.taxas || {}, ruim = false;
  Object.keys(t).forEach(function(b){ Object.keys(t[b]||{}).forEach(function(n){ var v = t[b][n]; if(v!=="" && v!=null && (num(v)<0 || num(v)>100)) ruim = true; }); });
  if(ruim) return "As taxas devem estar entre 0% e 100%.";
  if(d.aluguel!=null && d.aluguel!=="" && (isNaN(num(d.aluguel)) || num(d.aluguel)<0)) return "O aluguel deve ser um valor de 0 em diante (ou vazio, se não foi informado).";
  var rep = lp.meios.find(function(m){ return m.id!==d.id && norm(m.nome)===norm(d.nome) && m.cnpjId===trim(d.cnpjId); });
  if(rep) return "Já existe um meio com esse nome neste CNPJ.";
  return null;
}

// ---------- aluguel das maquininhas e isenção ----------
// Custo fixo mensal por banco (só o aluguel; não é o custo total das transações). Aluguel vazio = não informado (nunca vira zero).
var chaveBanco = function(m){ return m.adquirente+(m.adquirente==="Sicredi" && m.cnpjId ? " · CNPJ "+m.cnpjId : ""); };
function isencaoDoMes(lp, grupo){
  var i = (lp.isencoes||[]).find(function(x){ return x.grupo===grupo; }); if(!i) return null;
  var vendido = i.mes===hojeSP().slice(0, 7) ? num(i.vendido) : 0;   // o vendido zera sozinho na virada do mês
  return {grupo:i.grupo, rotulo:i.rotulo, meta:i.meta, vendido:vendido, falta:Math.max(0, r2(i.meta-vendido)), atingida:vendido>=i.meta};
}
function resumoAluguel(lp){
  var maqs = lp.meios.filter(function(m){ return m.tipo==="MAQUININHA" && m.ativo; }), porBanco = {}, total = 0, semInfo = 0, esteMes = 0, deIsencao = 0;
  maqs.forEach(function(m){
    if(m.aluguel==null){ semInfo++; return; }
    var k = chaveBanco(m), o = porBanco[k] || (porBanco[k] = {rotulo:k, valor:0, qtd:0}); o.valor = r2(o.valor+m.aluguel); o.qtd++; total = r2(total+m.aluguel);
    var iso = m.grupoIsencao ? isencaoDoMes(lp, m.grupoIsencao) : null; if(m.grupoIsencao) deIsencao = r2(deIsencao+m.aluguel); if(!(iso && iso.atingida)) esteMes = r2(esteMes+m.aluguel);
  });
  return {porBanco:Object.keys(porBanco).sort().map(function(k){ return porBanco[k]; }), total:total, seIsento:r2(total-deIsencao), esteMes:esteMes, semInfo:semInfo, maquinas:maqs.length};
}

// ---------- taxas, antecipação, líquido e previsão de crédito ----------
// Ex.: calcularTaxa(meio, 2345, 5, true) → {taxaPct, taxaValor, antecipacaoValor, liquido, previsaoCredito:[{parcela, data, bruto, taxa, antecipacao, liquido}]}
// Sem antecipação: 1ª parcela entra em prazoCredito.primeira dias, as demais a cada prazoCredito.intervalo dias. Com antecipação: tudo em prazoCredito.antecipado dias, e a antecipação custa
//   modo "mes": % ao mês proporcional aos dias antecipados de cada parcela · modo "parcela": % (por nº de parcelas) sobre o líquido.
function calcularTaxa(meio, valor, parcelas, antecipa, dataVenda, bandeira){
  valor = r2(Math.max(0, num(valor))); var n = Math.min(MAX_PARCELAS, Math.max(1, Math.round(num(parcelas)) || 1));
  var pct = taxaDe(meio, bandeira, n), taxaValor = r2(valor*pct/100), base = r2(valor-taxaValor);
  var pz = (meio && meio.prazoCredito) || PRAZO_PADRAO, ant = (meio && meio.antecipacao) || {ativa:false}, usa = !!(antecipa && ant.ativa), dia0 = dataVenda ? diaDe(dataVenda) : hojeSP();
  var linhas = [], accB = 0, accL = 0, totalAnt = 0;
  for(var k = 1; k<=n; k++){
    var bruto = k<n ? r2(valor/n) : r2(valor-accB), liq = k<n ? r2(base/n) : r2(base-accL); accB = r2(accB+bruto); accL = r2(accL+liq);
    var diasSem = pz.primeira+pz.intervalo*(k-1), dias = diasSem, custo = 0;
    if(usa){ dias = Math.min(diasSem, pz.antecipado);
      if(ant.modo==="parcela") custo = r2(liq*num((ant.pctParcela||{})[String(n)])/100);
      else custo = r2(liq*num(ant.pctMes)/100*Math.max(0, diasSem-dias)/30); }
    totalAnt = r2(totalAnt+custo);
    linhas.push({parcela:k, data:somaDias(dia0, dias), bruto:bruto, taxa:r2(bruto-liq), antecipacao:custo, liquido:r2(liq-custo)});
  }
  var liquido = r2(valor-taxaValor-totalAnt);
  return {valor:valor, parcelas:n, antecipa:usa, taxaPct:pct, taxaValor:taxaValor, antecipacaoValor:totalAnt, totalDescontos:r2(taxaValor+totalAnt), liquido:liquido, liquidoPct:valor>0 ? r2(liquido/valor*100) : 0, previsaoCredito:linhas};
}
// Dado para o módulo Pagamentos a fornecedores (Maquininha Banho: {data, rev, valor, band, parc, maq}). Só gera; quem lança é a pessoa. null se o meio não vira pagamento de fornecedor.
function passadaParaFornecedor(meio, v){
  if(!meio || !meio.viraPagamentoFornecedor) return null;
  var r = calcularTaxa(meio, v.valor, v.parcelas, false, v.data, v.bandeira);
  return {origem:"link-pagamento", meioId:meio.id, maq:meio.adquirente, cnpjId:meio.cnpjId, data:diaDe(v.data) || hojeSP(), rev:trim(v.revendedora), valor:r2(num(v.valor)), band:String(v.bandeira || "Outras").toUpperCase(), parc:r.parcelas+"x", descontoMaquininha:r.taxaValor};
}
var avisoFornecedor = function(meio){ return meio && meio.viraPagamentoFornecedor ? "O valor passado neste meio vira pagamento de fornecedor (desconto da maquininha em Pagamentos a fornecedores)." : ""; };

// ---------- vínculos ----------
var vinculoDeRep = function(lp, rep){ var n = norm(rep); return n ? lp.vinculos.find(function(v){ return norm(v.representante)===n; }) || null : null; };
var repDaRevendedora = function(lp, rev){ var n = norm(rev), r = lp.revendedoras.find(function(x){ return norm(x.nome)===n; }); return r ? r.representante : ""; };
// meio do link da revendedora: revendedora → representante → link vinculado (ou o escolhido). {meio} ou {erro}
function resolverMeio(s, revendedora, meioId, representante){
  var lp = s.lp, m = null;
  if(meioId){ m = meioDe(s, meioId); if(!m) return {erro:"Meio de recebimento não encontrado."}; }
  else { var rep = representante || repDaRevendedora(lp, revendedora), v = vinculoDeRep(lp, rep);
    if(!rep) return {erro:"A revendedora não está vinculada a uma representante: vincule-a ou escolha o link."};
    if(!v || !v.linkId) return {erro:"A representante não tem link de crédito vinculado."}; m = meioDe(s, v.linkId); if(!m) return {erro:"Link vinculado à representante não encontrado."}; }
  if(m.tipo!=="LINK") return {erro:"Este meio é uma maquininha: escolha um link de pagamento."};
  if(!m.ativo) return {erro:"Meio de recebimento inativo: escolha outro."};
  return {meio:m};
}
var meioSugerido = function(s, revendedora, representante){ var r = resolverMeio(s, revendedora, "", representante); return r.meio || null; };

// ---------- solicitações: regras ----------
var nTentativasDia = function(lp, revendedora, dia){ var n = norm(revendedora); return lp.solicitacoes.filter(function(x){ return norm(x.revendedora)===n && diaDe(x.criadoEm)===dia && x.status!=="recusado" && x.status!=="cancelado"; }).length; };
// Máximo de parcelas sem juros para um valor (regra por faixa, 19/10/2026): até {ate} reais cabem {max}x; acima da última faixa vale maxParcelasSemJuros (10x)
function parcelasMaximas(cfg, valor){
  var v = r2(num(valor)), fx = (cfg && cfg.faixas) || [], teto = Math.round(num(cfg && cfg.maxParcelasSemJuros)) || 1;
  for(var i = 0; i<fx.length; i++) if(v<=num(fx[i].ate)+0.001) return Math.max(1, Math.round(num(fx[i].max)));
  return teto;
}
// O mesmo, já respeitando a parcela mínima (ex.: R$ 120,00 cabe 2x, pois 3x daria parcela de R$ 40,00)
function parcelasPermitidas(cfg, valor){
  var v = r2(num(valor)), m = parcelasMaximas(cfg, v), pm = num(cfg && cfg.parcelaMinima);
  while(m>1 && pm>0 && r2(v/m)+0.005<pm) m--;
  return m;
}
// Faixas em texto para a revendedora e para a equipe: [["Até R$ 80,00", "1x"], ["De R$ 80,01 a R$ 400,00", "até 4x"], ...]
function textoFaixas(cfg){
  var fx = (cfg && cfg.faixas) || [], o = [], ant = 0;
  fx.forEach(function(f, i){ o.push([i===0 ? "Até "+formatarReais(f.ate) : "De "+formatarReais(ant+0.01)+" a "+formatarReais(f.ate), f.max===1 ? "1x" : "até "+f.max+"x"]); ant = num(f.ate); });
  o.push(["Acima de "+formatarReais(ant), "até "+cfg.maxParcelasSemJuros+"x"]); return o;
}
// Recusa formal (texto) ou null. d = {revendedora, canal, valor, parcelas, meioId, representante, dataAcerto, emissor}
function validarSolicitacao(s, d, agora){
  var lp = s.lp, c = lp.config, hoje = diaDe(agora || agoraSP()), valor = r2(num(d.valor)), n = Math.round(num(d.parcelas)) || 0;
  if(!trim(d.revendedora)) return "Informe a revendedora.";
  if(!CANAIS.some(function(x){ return x[0]===d.canal; })) return "Informe o canal da solicitação.";
  if(valor<c.minimo) return "Valor abaixo do mínimo de "+formatarReais(c.minimo)+" por link.";
  if(n<1) return "Informe o número de parcelas.";
  if(n>c.maxParcelasSemJuros) return "Parcelamento máximo de "+c.maxParcelasSemJuros+"x sem juros.";
  var pmax = parcelasMaximas(c, valor); if(n>pmax) return "Para "+formatarReais(valor)+" o parcelamento máximo é "+(pmax===1 ? "1x (à vista)." : pmax+"x sem juros.");
  if(r2(valor/n)+0.005<c.parcelaMinima) return "Parcela abaixo do mínimo de "+formatarReais(c.parcelaMinima)+": reduza o número de parcelas.";
  if(d.semMeio && d.canal==="app" && BANDEIRAS.indexOf(d.bandeira)<0) return "Escolha a bandeira do cartão.";   // pedido feito no app: valor, parcelas e bandeira são o mínimo para gerar o link
  if(d.dataAcerto && !/^\d{4}-\d{2}-\d{2}$/.test(d.dataAcerto)) return "Data do acerto inválida.";
  if(d.dataAcerto===hoje && (d.emissor||"atendimento")!=="representante") return "No dia do acerto somente a representante pode emitir o link.";
  if(nTentativasDia(lp, d.revendedora, hoje)>=c.tentativasDia) return "Limite de "+c.tentativasDia+" tentativas de link por dia atingido para esta revendedora.";
  var r = resolverMeio(s, d.revendedora, d.meioId, trim(d.representante)); if(r.erro && !d.semMeio) return r.erro;   // semMeio: pedido vindo do app da revendedora; a equipe escolhe o link ao gerar
  return null;
}
// Formas de pagamento escolhidas nas vendas do app, no mês: por forma, quantas vendas, valor e quantas revendedoras diferentes usam
function resumoVendasApp(lp, mes){
  var o = {total:0, valor:0, formas:{vista:{vendas:0, valor:0, revs:{}}, combinado:{vendas:0, valor:0, revs:{}}, sorelly:{vendas:0, valor:0, revs:{}}, mp:{vendas:0, valor:0, revs:{}}}};
  ((lp && lp.vendasApp) || []).forEach(function(v){ if(v.demo) return; if(v.tipo==='proposta' || (mes && mesDe(v.em)!==mes)) return; o.total++; o.valor = r2(o.valor+v.valor); (v.formas||[]).forEach(function(f){ var g = o.formas[f]; if(!g) return; g.vendas++; g.valor = r2(g.valor+v.valor); g.revs[v.revendedora] = 1; }); });
  Object.keys(o.formas).forEach(function(k){ o.formas[k].revendedoras = Object.keys(o.formas[k].revs).length; delete o.formas[k].revs; });
  return o;
}
// Resumo de links por DIA e por MÊS (Financeiro → Relatório e Link de pagamento → Análises): gerados, pagos (e valor), expirados, com erro (negada, bloqueada, antifraude, pagamento desfeito) e abandonados/desistiram.
// Cada coisa conta no dia em que aconteceu: gerado = geradoEm · pago = pagoEm · expirado = expiraEm · erro/abandono = dia em que o link foi gerado (ou pedido).
var ERROS_LINK = ["negada", "bloqueada", "antifraude", "desfeito"], ABANDONOS_LINK = ["abandonada", "desistiu"];
function resumoLinks(lp, filtroMes){
  var dias = {}, linha = function(d){ return dias[d] || (dias[d] = {dia:d, gerados:0, pagos:0, valorPago:0, expirados:0, erros:0, abandonados:0}); };
  ((lp && lp.solicitacoes) || []).forEach(function(x){
    var gerado = diaDe(x.geradoEm || ""), criado = diaDe(x.criadoEm || ""), st = x.status;
    var foiGerado = !!gerado || ["pago", "comprovante", "expirado", "gerado"].indexOf(st)>=0 || ERROS_LINK.indexOf(st)>=0 || ABANDONOS_LINK.indexOf(st)>=0;
    var dGer = gerado || criado;
    if(foiGerado && dGer) linha(dGer).gerados++;
    if(st==="pago" || st==="comprovante"){ var dp = diaDe(x.pagoEm || "") || dGer; if(dp){ var l = linha(dp); l.pagos++; l.valorPago = r2(l.valorPago+x.valor); } }
    else if(st==="expirado"){ var de = diaDe(x.expiraEm || "") || dGer; if(de) linha(de).expirados++; }
    else if(ERROS_LINK.indexOf(st)>=0){ if(dGer) linha(dGer).erros++; }
    else if(ABANDONOS_LINK.indexOf(st)>=0){ if(dGer) linha(dGer).abandonados++; }
  });
  var lista = Object.keys(dias).sort().map(function(d){ return dias[d]; }), meses = {};
  lista.forEach(function(l){ var m = l.dia.slice(0, 7), o = meses[m] || (meses[m] = {mes:m, gerados:0, pagos:0, valorPago:0, expirados:0, erros:0, abandonados:0});
    o.gerados += l.gerados; o.pagos += l.pagos; o.valorPago = r2(o.valorPago+l.valorPago); o.expirados += l.expirados; o.erros += l.erros; o.abandonados += l.abandonados; });
  var porMes = Object.keys(meses).sort().map(function(m){ var o = meses[m]; o.conversao = o.gerados ? r2(o.pagos/o.gerados*100) : 0; return o; });
  return {dias:lista.filter(function(l){ return !filtroMes || l.dia.slice(0, 7)===filtroMes; }).reverse(), meses:porMes.slice().reverse()};
}
// Vendas e propostas de UMA revendedora, da mais nova para a mais antiga, com o número do pedido (1, 2, 3...)
function vendasDaRevendedora(lp, rev){
  var l = ((lp && lp.vendasApp) || []).filter(function(v){ return v.revendedora===rev; });
  return l.map(function(v, i){ return Object.assign({}, v, {numero:i+1}); }).reverse();
}
// Cobranças: pagamentos combinados em Pix/dinheiro que já venceram ou vencem hoje e ainda não foram recebidos (o app avisa a revendedora para cobrar)
function cobrancasDaRevendedora(lp, rev, hoje){
  var o = [];
  vendasDaRevendedora(lp, rev).forEach(function(v){ if(v.tipo!=="venda") return;
    (v.plano||[]).forEach(function(p, i){ if(!p.pago && (p.forma==="pix" || p.forma==="dinheiro") && p.data && p.data<=hoje) o.push({vendaId:v.id, i:i, numero:v.numero, cliente:v.cliente, valor:p.valor, data:p.data, forma:p.forma, atrasada:p.data<hoje}); }); });
  return o.sort(function(x, y){ return x.data.localeCompare(y.data); });
}
// Total vendido (já com desconto) das vendas registradas no app por uma revendedora no mês
function vendidoNoApp(lp, rev, mes){ var t = 0; ((lp && lp.vendasApp) || []).forEach(function(v){ if(v.revendedora===rev && v.tipo==="venda" && (!mes || mesDe(v.em)===mes)) t += v.valor; }); return r2(t); }
function minutosRestantes(sol, agora){ if(!sol || sol.status!=="gerado" || !sol.expiraEm) return null; var a = minutosDe(agora || agoraSP()), b = minutosDe(sol.expiraEm); return a==null || b==null ? null : Math.floor(b-a); }
var textoRestante = function(min){ if(min==null) return ""; if(min<=0) return "Expirado"; var h = Math.floor(min/60), m = min%60; return h>0 ? h+"h "+p2(m)+"min" : m+"min"; };
var expirados = function(lp, agora){ var a = minutosDe(agora || agoraSP()); return lp.solicitacoes.filter(function(x){ var e = minutosDe(x.expiraEm); return x.status==="gerado" && e!=null && e<=a; }).map(function(x){ return x.id; }); };
var proximosStatus = function(sol){ return TRANSICOES[sol.status] || []; };
var proximaEtapa = function(sol){ var i = FLUXO.indexOf(sol.status); return i>=0 && i<FLUXO.length-1 ? FLUXO[i+1] : null; };

// ---------- crédito do acerto ----------
// Links emitidos E pagos até o dia anterior ao acerto (pagos no próprio dia não contam). Se passar do valor do acerto, o excedente vira crédito/peças, nunca dinheiro.
function creditoDoAcerto(s, revendedora, dataAcerto, valorAcerto){
  var ate = somaDias(dataAcerto, -1), n = norm(revendedora), links = [], fora = [], total = 0, totalFora = 0;
  s.lp.solicitacoes.forEach(function(x){
    if(norm(x.revendedora)!==n || (x.status!=="pago" && x.status!=="comprovante")) return;
    if(x.dataAcerto && x.dataAcerto!==dataAcerto) return;
    if(diaDe(x.pagoEm)<=ate && diaDe(x.geradoEm)<=ate){ links.push(x.id); total = r2(total+x.valor); } else { fora.push(x.id); totalFora = r2(totalFora+x.valor); }
  });
  var temValor = valorAcerto!==undefined && valorAcerto!==null && valorAcerto!=="", abat = temValor ? Math.min(total, Math.max(0, r2(num(valorAcerto)))) : total, exc = r2(total-abat);
  return {revendedora:revendedora, dataAcerto:dataAcerto, ate:ate, links:links, total:total, abatimento:abat, excedente:exc, fora:fora, totalFora:totalFora,
    aviso:exc>0 ? "O excedente de "+formatarReais(exc)+" não é devolvido em dinheiro: vira crédito para o próximo acerto ou peças (semijoias)." : ""};
}

// ---------- comprovantes ----------
// Pendentes = pagos em dia anterior a hoje (o envio é no dia seguinte ao pagamento). diasAtraso: 0 = enviar hoje.
function comprovantesPendentes(s, hoje){
  hoje = hoje || hojeSP();
  return s.lp.solicitacoes.filter(function(x){ return x.status==="pago" && diaDe(x.pagoEm)<hoje; })
    .map(function(x){ return {sol:x, diasAtraso:Math.max(0, diasEntre(somaDias(diaDe(x.pagoEm), 1), hoje))}; })
    .sort(function(a, b){ return a.sol.pagoEm<b.sol.pagoEm ? -1 : 1; });
}
var aguardandoDiaSeguinte = function(s, hoje){ hoje = hoje || hojeSP(); return s.lp.solicitacoes.filter(function(x){ return x.status==="pago" && diaDe(x.pagoEm)>=hoje; }); };
// Modelo do arquivo: Revendedora · Link (CNPJ) · Data do pagamento · Valor pago · Parcelas · Data do acerto · Responsável · Gerado em
function textoComprovante(sol, s){
  var m = s && s.lp ? meioDe(s, sol.meioId) : null, n = sol.parcelas || 1, parc = n+"x de "+formatarReais(r2(sol.valor/n));
  return ["Comprovante de link de pagamento",
    "Revendedora: "+sol.revendedora,
    "Link: "+(m ? nomeMeio(m) : "—"),
    "Data do pagamento: "+(formatarDia(sol.pagoEm) || "—"),
    "Valor pago: "+formatarReais(sol.valor),
    "Parcelas: "+parc,
    "Data do acerto: "+(formatarDia(sol.dataAcerto) || "—"),
    "Responsável: "+(sol.geradoPor || "—"),
    "Gerado em: "+(formatarDataHora(sol.geradoEm) || "—")].join("\n");
}

// ---------- Pix restante ----------
// O Pix que falta do acerto deve ir para conta do MESMO CNPJ do link. Devolve só o CNPJ e um aviso (a "conta mais negativa" depende do módulo de caixa: pendência).
function sugestaoContaPix(s, cnpjId){
  if(!cnpjId) return {cnpjId:"", aviso:"Link sem CNPJ informado: não há conta sugerida."};
  return {cnpjId:cnpjId, aviso:"Orientar o Pix restante para uma conta do "+rotuloCnpj(cnpjId)+" (de preferência a mais negativa; depende do módulo de caixa, ainda pendente)."};
}

// ---------- leituras e indicadores ----------
function listaSolicitacoes(s, f){
  f = f || {}; var b = norm(f.busca);
  return s.lp.solicitacoes.filter(function(x){
    return (!f.status || x.status===f.status) && (!f.mes || mesDe(x.criadoEm)===f.mes) && (!f.canal || x.canal===f.canal) && (!f.meioId || x.meioId===f.meioId) && (!f.representante || norm(x.representante)===norm(f.representante))
      && (!b || norm(x.revendedora).indexOf(b)>=0 || norm(x.representante).indexOf(b)>=0 || (x.autorizacao && String(x.autorizacao).indexOf(b)>=0)); })
    .sort(function(a, c){ return a.criadoEm<c.criadoEm ? 1 : -1; });
}
function taxaDaSolicitacao(s, x){ var m = meioDe(s, x.meioId); return calcularTaxa(m, x.valor, x.parcelas, m ? m.antecipacao.ativa : false, x.pagoEm, x.bandeira); }
// Quando existe pagoEm usamos o mês do pagamento ("pago no mês"); a conversão e as análises usam o mês em que o link foi gerado (a mesma conta da planilha).
var mesDe = function(iso){ return diaDe(iso).slice(0,7); };
var foiGerado = function(x){ return !!x.geradoEm; };
var foiPago = function(x){ return x.status==="pago" || x.status==="comprovante"; };
var mesDoLink = function(x){ return mesDe(x.geradoEm || x.criadoEm); };
// mes = "2026-10" (padrão: o mês de hoje). Valor pago = links pagos (inclui comprovante enviado) no mês do pagamento.
// geradosMes/pagosCoorte/valorCoorte: links gerados no mês e quantos deles viraram pagamento; conversao = pagos/gerados (%).
function indicadoresLp(s, mes){
  mes = mes || hojeSP().slice(0,7);
  var o = {total:0, porCanal:{app:0, whatsapp:0}, porStatus:{}, abertas:0, pagoMes:0, qtdPagosMes:0, taxaTotal:0, antecipacaoTotal:0, liquido:0, comprovantesPendentes:comprovantesPendentes(s).length,
    geradosMes:0, pagosCoorte:0, valorCoorte:0, conversao:0, porMeio:{}};
  STATUS.forEach(function(k){ o.porStatus[k] = 0; });
  s.lp.solicitacoes.forEach(function(x){
    var mc = mesDe(x.criadoEm);
    if(mc===mes){ o.total++; if(o.porCanal[x.canal]!==undefined) o.porCanal[x.canal]++; }
    o.porStatus[x.status] = (o.porStatus[x.status]||0)+1;
    if(x.status==="solicitado" || x.status==="gerado") o.abertas++;
    if(foiGerado(x) && mesDoLink(x)===mes){
      var pm = o.porMeio[x.meioId||"-"] || (o.porMeio[x.meioId||"-"] = {gerados:0, pagos:0, valor:0});
      o.geradosMes++; pm.gerados++;
      if(foiPago(x)){ o.pagosCoorte++; o.valorCoorte = r2(o.valorCoorte+x.valor); pm.pagos++; pm.valor = r2(pm.valor+x.valor); } }
    if(foiPago(x) && mesDe(x.pagoEm)===mes){
      var t = taxaDaSolicitacao(s, x); o.pagoMes = r2(o.pagoMes+x.valor); o.qtdPagosMes++; o.taxaTotal = r2(o.taxaTotal+t.taxaValor); o.antecipacaoTotal = r2(o.antecipacaoTotal+t.antecipacaoValor); o.liquido = r2(o.liquido+t.liquido); }
  });
  o.conversao = o.geradosMes ? r2(o.pagosCoorte/o.geradosMes*100) : 0;
  return o;
}

// ---------- bônus do setor ----------
// faixas = [{min, valor}]: vale a maior faixa alcançada pelo valor pago do mês; abaixo da menor faixa = R$ 0,00.
function bonusDoValor(cfg, valor){
  var fx = ((cfg && cfg.bonus && cfg.bonus.faixas) || []).slice().sort(function(a, b){ return b.min-a.min; });
  for(var i = 0; i<fx.length; i++) if(valor>=fx[i].min) return {valor:fx[i].valor, min:fx[i].min};
  return {valor:0, min:null};
}
function validarBonus(faixas){
  if(!Array.isArray(faixas)) return "Faixas inválidas.";
  if(faixas.length>12) return "No máximo 12 faixas.";
  var vistos = {};
  for(var i = 0; i<faixas.length; i++){ var mn = num(faixas[i].min), vl = num(faixas[i].valor);
    if(!(mn>0)) return "Cada faixa precisa de um valor mínimo maior que zero.";
    if(vl<0) return "O valor do bônus não pode ser negativo.";
    if(vistos[mn]) return "Há duas faixas com o mesmo valor mínimo."; vistos[mn] = 1; }
  return null;
}

// ---------- análises (uma passada só) ----------
// f = {mes:"2026-09" ("" = todos), ano:"2026"}. Considera links gerados (geradoEm); pago = pago ou comprovante enviado. Tudo agrupado pelo mês em que o link foi gerado.
// Devolve {meses:[{mes, gerados, pagos, conversao, valorGerado, valorPago, ticket, bonus}], reps, revs, parcelas, bandeiras, canais, meios, motivos, totais}
function analiseLp(s, f){
  f = f || {}; var cfg = s.lp.config, meses = {}, reps = {}, revs = {}, parc = {}, band = {}, canais = {app:{gerados:0, pagos:0, valor:0}, whatsapp:{gerados:0, pagos:0, valor:0}}, meios = {}, motivos = {}, tot = {gerados:0, pagos:0, valorGerado:0, valorPago:0, suspeitas:0};
  var soma = function(m, k, x, pago){ var o = m[k] || (m[k] = {gerados:0, pagos:0, valor:0}); o.gerados++; if(pago){ o.pagos++; o.valor = r2(o.valor+x.valor); } };
  s.lp.solicitacoes.forEach(function(x){
    if(!foiGerado(x)) return; var mc = mesDoLink(x), pago = foiPago(x);
    var mm = meses[mc] || (meses[mc] = {mes:mc, gerados:0, pagos:0, valorGerado:0, valorPago:0});
    mm.gerados++; mm.valorGerado = r2(mm.valorGerado+x.valor); if(pago){ mm.pagos++; mm.valorPago = r2(mm.valorPago+x.valor); }
    if(f.mes && mc!==f.mes) return; if(f.ano && mc.slice(0,4)!==f.ano) return;
    tot.gerados++; tot.valorGerado = r2(tot.valorGerado+x.valor); if(pago){ tot.pagos++; tot.valorPago = r2(tot.valorPago+x.valor); }
    if(x.suspeitaDuplicada || x.suspeitaDados) tot.suspeitas++;
    soma(reps, trim(x.representante) || "Sem representante", x, pago); soma(revs, trim(x.revendedora) || "—", x, pago);
    soma(parc, String(x.parcelas || 1), x, pago); soma(band, x.bandeira || "Não informada", x, pago); soma(meios, x.meioId || "-", x, pago);
    if(canais[x.canal]){ canais[x.canal].gerados++; if(pago){ canais[x.canal].pagos++; canais[x.canal].valor = r2(canais[x.canal].valor+x.valor); } }
    if(!pago && MOTIVOS_NAO_CONCLUSAO.indexOf(x.status)>=0){ var mo = motivos[x.status] || (motivos[x.status] = {qtd:0, valor:0}); mo.qtd++; mo.valor = r2(mo.valor+x.valor); }
  });
  var lista = function(m, ord){ return Object.keys(m).map(function(k){ var o = m[k]; return {nome:k, gerados:o.gerados, pagos:o.pagos, valor:o.valor, conversao:o.gerados ? r2(o.pagos/o.gerados*100) : 0}; }).sort(ord); };
  var porValor = function(a, b){ return b.valor-a.valor || b.pagos-a.pagos; };
  var ms = Object.keys(meses).sort().map(function(k){ var m = meses[k]; return Object.assign({conversao:m.gerados ? r2(m.pagos/m.gerados*100) : 0, ticket:m.pagos ? r2(m.valorPago/m.pagos) : 0, bonus:bonusDoValor(cfg, m.valorPago).valor}, m); });
  Object.keys(canais).forEach(function(k){ canais[k].conversao = canais[k].gerados ? r2(canais[k].pagos/canais[k].gerados*100) : 0; });
  tot.conversao = tot.gerados ? r2(tot.pagos/tot.gerados*100) : 0; tot.ticket = tot.pagos ? r2(tot.valorPago/tot.pagos) : 0;
  return {meses:ms, reps:lista(reps, porValor), revs:lista(revs, porValor), parcelas:lista(parc, function(a, b){ return +a.nome-+b.nome; }), bandeiras:lista(band, porValor), canais:canais, meios:lista(meios, porValor), motivos:motivos, totais:tot};
}

// ---------- app da revendedora e acerto da representante (19/10/2026) ----------
// O que a revendedora vê de cada pedido, em linguagem simples. tom: espera | info | ok | ruim | neutro.
var MSG_SEM_SUCESSO = {negada:"Pagamento negado pelo cartão", abandonada:"A cliente não concluiu o pagamento", bloqueada:"Pagamento bloqueado", antifraude:"Recusado pela análise de segurança", desfeito:"Pagamento desfeito (estornado)", desistiu:"A cliente desistiu"};
function situacaoParaRevendedora(x, agora){
  var min = minutosRestantes(x, agora);
  if(x.status==="solicitado") return {titulo:"Solicitado", detalhe:"A Sorelly está gerando o seu link.", tom:"espera", etapa:0};
  if(x.status==="gerado"){
    if(min!=null && min<=0) return {titulo:"Link expirado", detalhe:"O prazo de validade acabou. Solicite outro link.", tom:"ruim", etapa:1};
    return {titulo:"Link pronto", detalhe:"Envie para a cliente"+(min!=null ? " · vale por mais "+textoRestante(min) : "")+".", tom:"info", etapa:1};
  }
  if(x.status==="pago" || x.status==="comprovante") return {titulo:"Pago", detalhe:x.acertoId ? "Já descontado no seu acerto." : "Vai abater o valor do seu acerto"+(x.dataAcerto ? " de "+formatarDia(x.dataAcerto) : "")+".", tom:"ok", etapa:3};
  if(x.status==="expirado") return {titulo:"Link expirado", detalhe:"O prazo acabou sem pagamento. Solicite outro link.", tom:"ruim", etapa:1};
  if(x.status==="cancelado") return {titulo:"Cancelado", detalhe:x.motivo || "Este pedido foi cancelado.", tom:"neutro", etapa:0};
  if(x.status==="recusado") return {titulo:"Recusado", detalhe:x.motivo || "A Sorelly não pôde gerar este link.", tom:"ruim", etapa:0};
  return {titulo:ROTULO_STATUS[x.status] || x.status, detalhe:MSG_SEM_SUCESSO[x.status] || "Este link não virou pagamento.", tom:"ruim", etapa:1};
}
// pedidos de uma revendedora (mais novos primeiro)
function linksDaRevendedora(s, revendedora){
  var n = norm(revendedora); return s.lp.solicitacoes.filter(function(x){ return norm(x.revendedora)===n; }).sort(function(a, b){ return a.criadoEm<b.criadoEm ? 1 : -1; });
}
// Para a calculadora do acerto. Só entram pedidos criados pelo sistema (não os importados da planilha, que já foram descontados na época).
//   pagos: pagos e ainda não usados em acerto (usavel = emitido e pago até o dia anterior; senão conta só no próximo acerto)
//   avisos: cancelados, recusados, expirados ou com erro nos últimos 30 dias · aguardando: solicitados ou gerados ainda sem pagamento
function linksParaAcerto(s, revendedora, hoje){
  hoje = hoje || hojeSP(); var desde = somaDias(hoje, -30), o = {pagos:[], avisos:[], aguardando:[]};
  linksDaRevendedora(s, revendedora).forEach(function(x){
    if(x.importado || x.descontado) return;
    if(foiPago(x)){ if(!x.acertoId && diaDe(x.pagoEm)>=somaDias(hoje, -60)) o.pagos.push({sol:x, usavel:diaDe(x.pagoEm)<hoje && diaDe(x.geradoEm)<hoje}); }
    else if(x.status==="solicitado" || x.status==="gerado"){ var mn = minutosRestantes(x); if(mn!=null && mn<=0) { if(diaDe(x.criadoEm)>=desde) o.avisos.push(x); } else o.aguardando.push(x); }
    else if(diaDe(x.criadoEm)>=desde) o.avisos.push(x);
  });
  return o;
}
// Marca como USADOS no acerto os links que entraram como pagamento (cada linha de pagamento traz linkSolId). Devolve o novo lp, ou null se nada mudou.
function usarLinksNoAcerto(lp0, pagamentos, acertoId, agora, por){
  var ids = (pagamentos || []).filter(function(p){ return p && p.linkSolId; }); if(!ids.length) return null;
  var lp = clone(lp0), mudou = false;
  ids.forEach(function(p){
    var x = lp.solicitacoes.find(function(y){ return y.id===p.linkSolId; });
    if(!x || !foiPago(x) || x.acertoId) return;
    x.acertoId = acertoId; x.usadoEm = agora; x.usadoValor = r2(num(p.valor)); x.excedente = Math.max(0, r2(x.valor-num(p.valor)));
    (x.historico = x.historico || []).push({em:agora, por:por || "—", de:x.status, para:x.status, nota:"Descontado no acerto"+(x.excedente>0 ? " (sobrou "+formatarReais(x.excedente)+" de crédito)" : "")}); mudou = true;
  });
  return mudou ? lp : null;
}

// ---------- reducer ----------
function lpReduz(s, a){
  var lp = clone(s.lp), cfg = lp.config, por = a.por || "—", agora = a.agora || agoraSP(), hoje = diaDe(agora);
  var recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg){ lp.log.push({em:agora, por:por, op:a.op, txt:msg||""}); if(lp.log.length>500) lp.log = lp.log.slice(-500); return {patch:{lp:lp}, msg:msg}; };
  var sx = {lp:lp, ce:s.ce}, sol1 = function(id){ return lp.solicitacoes.find(function(x){ return x.id===(id!=null ? id : a.id); }); };
  switch(a.op){
    case "config_salvar": {
      var c = a.config || {};
      var v = {minimo:num(c.minimo), parcelaMinima:num(c.parcelaMinima), maxParcelasSemJuros:Math.round(num(c.maxParcelasSemJuros)), validadeHoras:num(c.validadeHoras), tentativasDia:Math.round(num(c.tentativasDia))};
      if(c.faixas){ v.faixas = c.faixas.map(function(z){ return {ate:r2(num(z.ate)), max:Math.round(num(z.max))}; }); var ant = 0;
        for(var q = 0; q<v.faixas.length; q++){ if(!(v.faixas[q].ate>ant) || v.faixas[q].max<1 || v.faixas[q].max>v.maxParcelasSemJuros) return recusa("Confira as faixas de parcelamento: valores crescentes e parcelas até o máximo."); ant = v.faixas[q].ate; } }
      if(v.minimo<=0 || v.parcelaMinima<=0 || v.maxParcelasSemJuros<1 || v.maxParcelasSemJuros>MAX_PARCELAS || v.validadeHoras<=0 || v.tentativasDia<1) return recusa("Confira os valores das regras do link.");
      Object.assign(cfg, v); return ok("Regras do link salvas");
    }
    case "bonus_salvar": {
      var fb = (a.faixas || []).map(function(z){ return {min:num(z.min), valor:Math.max(0, num(z.valor))}; }), eb = validarBonus(fb); if(eb) return recusa(eb);
      cfg.bonus = {faixas:fb.sort(function(p, q){ return q.min-p.min; }), obs:trim(a.obs !== undefined ? a.obs : (cfg.bonus||{}).obs)}; return ok("Faixas de bônus salvas");
    }
    case "isencao_vendido": {
      var iso = (lp.isencoes||[]).find(function(x){ return x.grupo===a.grupo; }); if(!iso) return recusa("Isenção não encontrada.");
      var vv = num(a.vendido); if(isNaN(vv) || vv<0) return recusa("Informe o valor vendido (0 em diante).");
      iso.vendido = r2(vv); iso.mes = hojeSP().slice(0, 7); return ok("Vendas do mês em "+iso.rotulo+" atualizadas");
    }
    case "meio_salvar": {
      var d = a.meio || {}; if(a.meio && a.meio.id && !meioDe(sx, a.meio.id)) return recusa("Meio de recebimento não encontrado.");
      var er = validarMeio(lp, d); if(er) return recusa(er);
      if(d.id){ var i = lp.meios.findIndex(function(m){ return m.id===d.id; }), antigo = lp.meios[i], novo = novoMeio(lp, Object.assign({}, d, {criadoEm:antigo.criadoEm, criadoPor:antigo.criadoPor}), por, agora); lp.meios[i] = novo; return ok("Meio salvo"); }
      lp.meios.push(novoMeio(lp, d, por, agora)); return ok("Meio criado");
    }
    case "meio_ativo": { var m = meioDe(sx, a.id); if(!m) return recusa("Meio de recebimento não encontrado."); m.ativo = !!a.ativo; return ok(m.ativo ? "Meio ativado" : "Meio desativado"); }
    case "meio_excluir": {
      var m2 = meioDe(sx, a.id); if(!m2) return recusa("Meio de recebimento não encontrado.");
      if(lp.solicitacoes.some(function(x){ return x.meioId===m2.id; })) return recusa("Este meio já teve solicitações: desative-o em vez de excluir.");
      if(lp.vinculos.some(function(x){ return x.linkId===m2.id || x.maquininhaId===m2.id; })) return recusa("Este meio está vinculado a uma representante: remova o vínculo antes.");
      lp.meios = lp.meios.filter(function(x){ return x.id!==m2.id; }); return ok("Meio excluído");
    }
    case "vinc_salvar": {
      var rep = trim(a.representante); if(!rep) return recusa("Informe a representante.");
      var mq = a.maquininhaId ? meioDe(sx, a.maquininhaId) : null, lk = a.linkId ? meioDe(sx, a.linkId) : null;
      if(a.maquininhaId && (!mq || mq.tipo!=="MAQUININHA")) return recusa("Escolha uma maquininha válida.");
      if(a.linkId && (!lk || lk.tipo!=="LINK")) return recusa("Escolha um link de pagamento válido.");
      if(a.confirmacao && !/^\d{4}-\d{2}-\d{2}$/.test(a.confirmacao)) return recusa("Data de confirmação inválida.");
      var info = INFORMACOES.some(function(x){ return x[0]===a.informacoes; }) ? a.informacoes : "nao_informado";
      var dup = lp.vinculos.find(function(x){ return norm(x.representante)===norm(rep) && x.id!==a.id; }); if(dup) return recusa("Esta representante já tem vínculo cadastrado.");
      var antigoV = a.id ? lp.vinculos.find(function(x){ return x.id===a.id; }) : null;
      var reg = {representante:rep, maquininhaId:a.maquininhaId||"", linkId:a.linkId||"", confirmacao:a.confirmacao||"", informacoes:info, semDados:!!(antigoV && antigoV.semDados && !a.maquininhaId)};
      if(a.id){ var vi = lp.vinculos.findIndex(function(x){ return x.id===a.id; }); if(vi<0) return recusa("Vínculo não encontrado."); reg.id = a.id; lp.vinculos[vi] = reg; }
      else { reg.id = "V"+(++lp.seq); lp.vinculos.push(reg); }
      return ok("Vínculo salvo");
    }
    case "vinc_excluir": { if(!lp.vinculos.some(function(x){ return x.id===a.id; })) return recusa("Vínculo não encontrado."); lp.vinculos = lp.vinculos.filter(function(x){ return x.id!==a.id; }); return ok("Vínculo removido"); }
    case "rev_vincular": {
      var rv = trim(a.revendedora), rp = trim(a.representante); if(!rv || !rp) return recusa("Informe a revendedora e a representante.");
      var ex = lp.revendedoras.find(function(x){ return norm(x.nome)===norm(rv); }); if(ex) ex.representante = rp; else lp.revendedoras.push({id:"R"+(++lp.seq), nome:rv, representante:rp});
      return ok("Revendedora vinculada");
    }
    case "rev_remover": { lp.revendedoras = lp.revendedoras.filter(function(x){ return x.id!==a.id; }); return ok("Vínculo da revendedora removido"); }
    // Venda registrada no app da revendedora (19/10/2026): guarda COMO a cliente vai pagar (à vista, link Sorelly, Mercado Pago, personalizado) para o admin acompanhar quantas usam cada forma.
    case "venda_app": {
      // formas: vista (Pix ou dinheiro) · combinado (entrada hoje + o resto em datas) · sorelly (link) · mp (Mercado Pago). Desconto sai da comissão da revendedora (ela escolhe quanto dar).
      var FORMAS_VENDA = ["vista", "combinado", "sorelly", "mp"], fv = Array.isArray(a.formas) ? a.formas.filter(function(x){ return FORMAS_VENDA.indexOf(x)>=0; }) : [];
      if(!trim(a.revendedora)) return recusa("Informe a revendedora."); if(!fv.length) return recusa("Escolha como a cliente vai pagar.");
      var plano = Array.isArray(a.plano) ? a.plano.map(function(x){ return {valor:r2(num(x.valor)), forma:String(x.forma||"pix"), data:diaDe(x.data||""), pago:!!x.pago, pagoEm:x.pago ? agora : ""}; }).filter(function(x){ return x.valor>0; }) : [];
      lp.vendasApp = lp.vendasApp || [];
      lp.vendasApp.push({id:"V"+(++lp.seq), em:agora, revendedora:trim(a.revendedora), cliente:trim(a.cliente), tipo:a.tipo==="proposta" || a.tipo==="pedido" ? "proposta" : "venda", formas:fv, bruto:r2(num(a.bruto!=null ? a.bruto : a.valor)), desconto:r2(num(a.desconto)), valor:r2(num(a.valor)),
        parcelas:Math.round(num(a.parcelas))||1, plano:plano, comissaoPct:r2(num(a.comissaoPct)), comissao:r2(num(a.comissao)), itens:Array.isArray(a.itens) ? a.itens.map(String) : []});
      if(lp.vendasApp.length>3000) lp.vendasApp = lp.vendasApp.slice(-3000);
      return ok(a.tipo==="proposta" || a.tipo==="pedido" ? "Proposta registrada" : "Venda registrada");
    }
    // a revendedora recebeu um pagamento combinado (Pix ou dinheiro): tira a cobrança
    case "venda_receber": {
      var vr = (lp.vendasApp || []).find(function(x){ return x.id===a.id; }); if(!vr || !vr.plano || !vr.plano[a.i]) return recusa("Pagamento não encontrado.");
      vr.plano[a.i].pago = true; vr.plano[a.i].pagoEm = agora; return ok("Pagamento recebido");
    }
    case "sol_criar": {
      var semMeio = a.canal==="app" && !!a.semMeio, dd = {revendedora:a.revendedora, canal:a.canal, valor:a.valor, parcelas:a.parcelas, meioId:a.meioId, representante:a.representante, dataAcerto:a.dataAcerto, emissor:a.emissor, semMeio:semMeio, bandeira:a.bandeira};
      var e1 = validarSolicitacao(sx, dd, agora); if(e1) return recusa(e1);
      var rm = resolverMeio(sx, a.revendedora, a.meioId, trim(a.representante)), repn = trim(a.representante) || repDaRevendedora(lp, a.revendedora);
      if(trim(a.representante) && !repDaRevendedora(lp, a.revendedora)) lp.revendedoras.push({id:"R"+(++lp.seq), nome:trim(a.revendedora), representante:trim(a.representante)});
      var sol = {id:"S"+(++lp.seq), canal:a.canal, revendedora:trim(a.revendedora), representante:repn, valor:r2(num(a.valor)), parcelas:Math.round(num(a.parcelas)), meioId:rm.meio ? rm.meio.id : "", bandeira:a.bandeira||"", status:"solicitado", emissor:a.emissor==="representante" ? "representante" : "atendimento",
        geradoPor:"", geradoEm:"", expiraEm:"", pagoEm:"", comprovanteEm:"", comprovantePor:"", dataAcerto:a.dataAcerto||"", tentativa:nTentativasDia(lp, a.revendedora, hoje)+1, observacao:trim(a.observacao), motivo:"", linkUrl:"", acertoId:"", usadoEm:"", usadoValor:0, excedente:0, criadoEm:agora, criadoPor:por, historico:[{em:agora, por:por, de:"", para:"solicitado", nota:""}]};
      sol.cliente = trim(a.cliente);   // nome simplificado da cliente, só para controle da revendedora (opcional)
      lp.solicitacoes.push(sol); return ok("Solicitação registrada");
    }
    case "sol_mover": {
      var x = sol1(); if(!x) return recusa("Solicitação não encontrada.");
      var para = a.para, de = x.status; if(para===de) return recusa("A solicitação já está em "+ROTULO_STATUS[para]+".");
      if(STATUS.indexOf(para)<0) return recusa("Etapa inválida.");
      if(proximosStatus(x).indexOf(para)<0) return recusa("Não é possível mover de "+ROTULO_STATUS[de]+" para "+ROTULO_STATUS[para]+".");
      if(EXIGE_MOTIVO[para] && !trim(a.nota)) return recusa("Informe o motivo.");
      if(para==="gerado"){
        var rr = resolverMeio(sx, x.revendedora, x.meioId, x.representante); if(rr.erro) return recusa(rr.erro);
        if(x.dataAcerto===hoje && x.emissor!=="representante") return recusa("No dia do acerto somente a representante pode emitir o link.");
        x.geradoPor = por; x.geradoEm = agora; x.expiraEm = isoDeMinutos(minutosDe(agora)+Math.round(cfg.validadeHoras*60));
      }
      if(para==="pago"){
        var pg = a.pagoEm || agora; if(x.expiraEm && minutosDe(pg)>minutosDe(x.expiraEm)) return recusa("Pagamento posterior à validade do link ("+cfg.validadeHoras+" h): solicite um novo link.");
        x.pagoEm = pg;
      }
      if(para==="comprovante"){ x.comprovanteEm = agora; x.comprovantePor = por; }
      if(EXIGE_MOTIVO[para]) x.motivo = trim(a.nota);
      x.status = para; (x.historico = x.historico || []).push({em:agora, por:por, de:de, para:para, nota:trim(a.nota)});
      return ok(para==="gerado" ? "Link gerado" : para==="pago" ? "Pagamento registrado" : para==="comprovante" ? "Comprovante registrado como enviado" : ROTULO_STATUS[para]);
    }
    case "sol_editar": {
      var ed = sol1(); if(!ed) return recusa("Solicitação não encontrada.");
      if(a.meioId && (!meioDe(sx, a.meioId) || meioDe(sx, a.meioId).tipo!=="LINK")) return recusa("Escolha um link de pagamento válido.");
      if(a.dataAcerto && !/^d{4}-d{2}-d{2}$/.test(a.dataAcerto)) return recusa("Data do acerto inválida.");
      var rp2 = trim(a.representante); ed.representante = rp2; if(a.meioId) ed.meioId = a.meioId; ed.dataAcerto = a.dataAcerto || ""; ed.bandeira = trim(a.bandeira); ed.observacao = trim(a.observacao); if(a.linkUrl!==undefined) ed.linkUrl = trim(a.linkUrl);
      if(rp2 && !repDaRevendedora(lp, ed.revendedora)) lp.revendedoras.push({id:"R"+(++lp.seq), nome:ed.revendedora, representante:rp2});
      ed.historico.push({em:agora, por:por, de:ed.status, para:ed.status, nota:"Dados editados"});
      return ok("Solicitação atualizada");
    }
    case "sol_obs": { var y = sol1(); if(!y) return recusa("Solicitação não encontrada."); y.observacao = trim(a.observacao); return ok("Observação salva"); }
    case "expirar": {
      var ids = expirados(lp, agora); if(!ids.length) return recusa("");
      lp.solicitacoes.forEach(function(z){ if(ids.indexOf(z.id)>=0){ (z.historico = z.historico || []).push({em:agora, por:"sistema", de:"gerado", para:"expirado", nota:"Validade de "+cfg.validadeHoras+" h vencida"}); z.status = "expirado"; } });
      return {patch:{lp:lp}, msg:""};
    }
    default: return recusa("Ação desconhecida.");
  }
}

export { vendidoNoApp, vendasDaRevendedora, cobrancasDaRevendedora, resumoLinks, resumoVendasApp, lpDemo, lpMigrar, lpReduz, hojeSP, agoraSP, somaDias, diasEntre, formatarReais, formatarDia, formatarDataHora,
  TIPOS_MEIO, ADQUIRENTES, BANDEIRAS, CANAIS, EMISSORES, INFORMACOES, ROTULO_INFO, STATUS, STATUS_SEM_SUCESSO, EM_ANDAMENTO, MOTIVOS_NAO_CONCLUSAO, ROTULO_STATUS, COR_STATUS, FLUXO, TRANSICOES, EXIGE_MOTIVO, MAX_PARCELAS, CONFIG_PADRAO, PRAZO_PADRAO, ROTULO_STATUS_FN,
  opcoesCnpj, rotuloCnpj, resumoAluguel, isencaoDoMes, meioDe, nomeMeio, adquirenteVira, normalizarTaxas, taxaDe, validarMeio, calcularTaxa, passadaParaFornecedor, avisoFornecedor,
  vinculoDeRep, repDaRevendedora, resolverMeio, meioSugerido, validarSolicitacao, parcelasMaximas, parcelasPermitidas, textoFaixas, nTentativasDia, minutosRestantes, textoRestante, expirados, proximosStatus, proximaEtapa,
  creditoDoAcerto, situacaoParaRevendedora, linksDaRevendedora, linksParaAcerto, usarLinksNoAcerto, comprovantesPendentes, aguardandoDiaSeguinte, textoComprovante, sugestaoContaPix, listaSolicitacoes, taxaDaSolicitacao, indicadoresLp, analiseLp, bonusDoValor, validarBonus, mesDe, foiGerado, foiPago };
