// Sorelly Admin · montagem — domain/garantias-rev.js
// Garantias e Condicionais do app da REVENDEDORA (19/10/2026).
//  · Cada peça de uma venda registrada no app (s.lp.vendasApp, tipo "venda") vira um certificado de garantia, emitido junto com a venda (data = dia da venda).
//  · O código do certificado é calculado da venda + peça (SRL-AAMM-XXXXXX): mesma venda e mesma peça dão sempre o mesmo código.
//  · Validade: 12 meses (configurável em s.lp.config.garantiaMeses). Vencida = passou da validade. Em reclamação = tem reclamação aberta.
//  · Reclamações ficam em s.gr.reclamacoes (para o setor Garantia & Pós-venda ver depois: use `reclamacoesDeGarantia(s)`).
//  · Condicionais: a chave ligar/desligar de cada uma fica em s.gr.cond. Os dados de condicionais da Beatriz Nogueira são DEMONSTRAÇÃO (condicionaisDemo), sem dado real.
import { hojeSP, agoraSP, somaDias, vendasDaRevendedora } from "./link-pagamento";

var VALIDADE_MESES_PADRAO = 12;
var MOTIVOS_RECLAMACAO = ["Peça escureceu", "Pedra solta", "Quebrou", "Fecho com defeito", "Outro"];
var ROTULO_STATUS_RECLAMACAO = {aberta:"Aberta", resolvida:"Resolvida"};
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };

// ---------- estado ----------
function grDemo(){ return {v:1, seq:0, reclamacoes:[], cond:{}, log:[]}; }
function grMigrar(g){ var s = g && typeof g==="object" ? g : grDemo(); if(!Array.isArray(s.reclamacoes)) s.reclamacoes = []; if(!s.cond || typeof s.cond!=="object") s.cond = {}; if(!Array.isArray(s.log)) s.log = []; s.seq = s.seq||0; s.v = 1; return s; }

// ---------- garantias ----------
var ALFA = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
function hashTexto(t){ var h = 2166136261; for(var i=0; i<t.length; i++){ h ^= t.charCodeAt(i); h = Math.imul(h, 16777619)>>>0; } return h>>>0; }
// código do certificado: SRL-AAMM-XXXXXX (AAMM = ano e mês da venda; as 6 letras/números vêm da venda + peça + posição)
function codigoCertificado(venda, codigoPeca, pos){
  var d = String(venda.em||"").slice(0, 7).split("-"), aamm = (d[0]||"0000").slice(2)+(d[1]||"00"), h = hashTexto(venda.id+"|"+codigoPeca+"|"+pos), h2 = hashTexto(codigoPeca+"|"+venda.id+"|"+pos+"|x"), out = "";
  for(var i=0; i<6; i++){ var src = i<3 ? h : h2; out += ALFA.charAt((src>>>((i%3)*8)) % ALFA.length); }
  return "SRL-"+aamm+"-"+out;
}
function somaMeses(dia, meses){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dia||"")); if(!m) return ""; var y = +m[1], mo = +m[2]-1+meses, d = +m[3]; y += Math.floor(mo/12); mo = ((mo%12)+12)%12;
  var ult = new Date(y, mo+1, 0).getDate(); return y+"-"+String(mo+1).padStart(2, "0")+"-"+String(Math.min(d, ult)).padStart(2, "0"); }
function mesesDeGarantia(s){ var n = Number(((s && s.lp && s.lp.config) || {}).garantiaMeses); return n>0 ? n : VALIDADE_MESES_PADRAO; }
// todos os certificados da revendedora (mais novos primeiro), já com status
function garantiasDaRevendedora(s, rev){
  var hoje = hojeSP(), meses = mesesDeGarantia(s), abertas = {};
  ((s.gr && s.gr.reclamacoes) || []).forEach(function(r){ if(r.status==="aberta") abertas[r.cert] = 1; });
  var out = [];
  vendasDaRevendedora(s.lp, rev).forEach(function(v){ if(v.tipo!=="venda") return;
    (v.itens||[]).forEach(function(it, pos){ var peca = typeof it==="string" ? it : (it && it.codigo), emissao = String(v.em||"").slice(0, 10), validade = somaMeses(emissao, meses), cert = codigoCertificado(v, peca, pos);
      var status = abertas[cert] ? "reclamacao" : (validade && validade<hoje ? "vencida" : "ativa");
      out.push({cert:cert, peca:peca, vendaId:v.id, pedido:v.numero, cliente:v.cliente, emissao:emissao, validade:validade, status:status, em:v.em, pos:pos}); }); });
  return out;
}
var reclamacoesDaRevendedora = function(s, rev){ return ((s.gr && s.gr.reclamacoes) || []).filter(function(r){ return r.revendedora===rev; }).slice().reverse(); };
// LEITURA PARA O ADMIN (setor Garantia & Pós-venda): todas as reclamações vindas do app, mais novas primeiro; filtros opcionais {status, revendedora}
function reclamacoesDeGarantia(s, f){ f = f||{}; return ((s.gr && s.gr.reclamacoes) || []).filter(function(r){ return (!f.status || r.status===f.status) && (!f.revendedora || r.revendedora===f.revendedora); }).slice().reverse(); }

// ---------- condicionais ----------
// DEMONSTRAÇÃO (Beatriz Nogueira): datas relativas a hoje, valores e peças do catálogo de teste. Nada disso é dado real.
function condicionaisDemo(){
  var hoje = hojeSP(), d = function(n){ return somaDias(hoje, n); };
  var h = function(dias, cod, valor){ return {codigo:cod, data:d(dias), valor:valor}; };
  return [
    {numero:"092983", saida:d(-17), devolucao:d(13), itens:124, valor:12072, ativa:true, aberta:true, vendas:[h(-12, "A2072", 96), h(-9, "B4732", 144), h(-4, "SP0589", 188)]},
    {numero:"080385", saida:d(-153), devolucao:"", itens:1, valor:452.76, ativa:false, aberta:true, vendas:[]},
    {numero:"074507", saida:d(-221), devolucao:"", itens:1, valor:80, ativa:false, aberta:true, vendas:[h(-190, "A2114", 44)]},
    {numero:"056536", saida:d(-290), devolucao:"", itens:6, valor:612, ativa:false, aberta:true, vendas:[h(-250, "B3519", 78), h(-240, "A2089", 78)]},
    {numero:"049310", saida:d(-340), devolucao:"", itens:2, valor:176, ativa:false, aberta:true, vendas:[]},
    {numero:"041877", saida:d(-70), devolucao:d(-42), itens:98, valor:9420, ativa:false, aberta:false, vendas:[h(-65, "A2080", 96), h(-60, "B3863", 138), h(-52, "A2051", 88)]},
    {numero:"036204", saida:d(-130), devolucao:d(-101), itens:76, valor:7180, ativa:false, aberta:false, vendas:[h(-120, "A2112", 88), h(-110, "B3519", 78)]},
    {numero:"029741", saida:d(-190), devolucao:d(-163), itens:64, valor:5890, ativa:false, aberta:false, vendas:[h(-180, "SP0589", 188)]},
    {numero:"022118", saida:d(-250), devolucao:d(-221), itens:52, valor:4310, ativa:false, aberta:false, vendas:[]}
  ];
}
// condicionais da revendedora, com o estado da chave aplicado. Demo só para a Beatriz; as demais usam o que já existe no sistema (perfisRev[..].condicionaisAbertas: número e nº de peças).
function condicionaisDaRevendedora(s, rev){
  var ov = (s.gr && s.gr.cond) || {}, base;
  if(rev==="Beatriz Nogueira") base = condicionaisDemo().map(function(c){ return Object.assign({demo:true}, c); });
  else base = (((s.perfisRev||{})[rev]||{}).condicionaisAbertas || []).map(function(c){ return {numero:String(c.numero), saida:"", devolucao:"", itens:c.pecas||0, valor:null, ativa:true, aberta:true, vendas:[]}; });
  return base.map(function(c){ var k = rev+"|"+c.numero; return Object.assign({}, c, {ativa:ov[k]!==undefined ? !!ov[k] : c.ativa}); });
}

// ---------- operações (dispatch {type:"GR", op, ...}) ----------
function grReduz(s, a){
  var g = grMigrar(clone(s.gr||null)), por = a.por||"—", agora = a.agora||agoraSP();
  var recusa = function(t){ return {patch:{}, msg:t}; };
  var ok = function(msg){ g.log.push({em:agora, por:por, op:a.op, texto:msg}); if(g.log.length>200) g.log = g.log.slice(-200); return {patch:{gr:g}, msg:msg}; };
  switch(a.op){
    case "reclamar": {
      if(!a.revendedora || !a.cert || !a.peca) return recusa("Escolha o certificado.");
      if(MOTIVOS_RECLAMACAO.indexOf(a.motivo)<0) return recusa("Escolha o motivo da reclamação.");
      if(g.reclamacoes.some(function(r){ return r.cert===a.cert && r.status==="aberta"; })) return recusa("Este certificado já tem uma reclamação aberta.");
      g.reclamacoes.push({id:"RG"+(++g.seq), em:agora, revendedora:a.revendedora, cert:a.cert, peca:a.peca, vendaId:a.vendaId||"", pedido:a.pedido||0, cliente:a.cliente||"", motivo:a.motivo, descricao:String(a.descricao||"").trim().slice(0, 300), status:"aberta"});
      return ok("Reclamação aberta");
    }
    case "cond_ativar": {
      if(!a.revendedora || !a.numero) return recusa("Condicional não encontrada.");
      g.cond[a.revendedora+"|"+a.numero] = !!a.ativa; return ok("Condicional "+a.numero+(a.ativa ? " ativada" : " desativada"));
    }
    default: return recusa("Operação desconhecida.");
  }
}

export { grDemo, grMigrar, grReduz, codigoCertificado, garantiasDaRevendedora, reclamacoesDaRevendedora, reclamacoesDeGarantia, condicionaisDaRevendedora, condicionaisDemo, mesesDeGarantia,
  MOTIVOS_RECLAMACAO, ROTULO_STATUS_RECLAMACAO, VALIDADE_MESES_PADRAO };
