// Sorelly Admin · montagem — domain/joias-pagamento.js
// PAGAMENTO EM JOIAS (RH, 17/11/2026, pedido do Marcus: "sempre damos joias como pagamento para os funcionários; precisa organizar a retirada e já para outros setores").
// Um registro por pagamento: quem recebe, o setor, o motivo, o valor a PREÇO DE VENDA, o custo (padrão 20% do valor), as peças e o caminho até a retirada:
//   Pedido → Autorizado (diretoria) → Separado (cadastro de peças) → Retirado (a pessoa leva). Cancelado sai da conta.
// Estado s.jp = {v, itens:[{id, pessoa, setor, motivo, descricao, valor, custoPct, pecas, situacao, criadoPor, criadoEm, mes, autorizadoPor, autorizadoEm, separadoPor, separadoEm, retiradoPor, retiradoEm, recebeu, canceladoPor, canceladoEm, historico:[{em, por, ato}]}]}.
// Ação JP: {op:"add", item} · {op:"etapa", id, para:"Autorizado"|"Separado"|"Retirado", pecas?, recebeu?} · {op:"cancelar", id} · {op:"apagar", id}.
// Dados reais NÃO ficam no código (o repositório é público): entram pela tela ou pelo servidor.
var SETORES = ["Marketing", "Cadastro de peças", "Produção", "Montagem e bipagem", "Atendimento", "Agendamento", "Financeiro", "RH", "Cadastro de revendedoras", "Kits novos", "Encomendas", "Garantia", "Diretoria", "Outro"];
var MOTIVOS = ["Modelo para fotos", "Bônus", "Premiação", "Acordo", "Outro"];
var SITUACOES = ["Pedido", "Autorizado", "Separado", "Retirado", "Cancelado"];
var CUSTO_PADRAO = 20;   // % do valor a preço de venda (Marcus, 17/11/2026: "custo das joias 20%")
var ANTES = {Autorizado:"Pedido", Separado:"Autorizado", Retirado:"Separado"};   // de que situação cada etapa pode vir

var trim = function(v){ return String(v==null ? "" : v).trim(); };
var num = function(v){ var n = Number(v); return isFinite(n) && n>0 ? Math.round(n*100)/100 : 0; };
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var agoraSP = function(){ return new Intl.DateTimeFormat("sv-SE", {timeZone:"America/Sao_Paulo", dateStyle:"short", timeStyle:"medium"}).format(new Date()).replace(" ", "T"); };
var pctCusto = function(v){ if(v==="" || v==null) return CUSTO_PADRAO; var n = Number(v); return isFinite(n) && n>=0 && n<=100 ? Math.round(n*100)/100 : CUSTO_PADRAO; };
var custoDe = function(x){ return Math.round((Number(x.valor) || 0)*pctCusto(x.custoPct))/100; };   // custo em reais

function jpMigrar(j){
  var o = (j && typeof j==="object") ? clone(j) : {v:1, itens:[]};
  o.v = o.v || 1; o.itens = Array.isArray(o.itens) ? o.itens : [];
  return o;
}

function jpReduz(s, a){
  var j = clone(jpMigrar(s.jp)), por = a.por || "—", agora = a.agora || agoraSP();
  var recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(t){ return {patch:{jp:j}, msg:t}; };
  var achar = function(id){ return j.itens.find(function(x){ return x.id===id; }); };
  if(a.op==="add"){
    var x = a.item || {}, pessoa = trim(x.pessoa), valor = num(x.valor);
    if(!pessoa) return recusa("Escreva o nome de quem recebe.");
    if(pessoa.length>80) return recusa("O nome passou de 80 letras.");
    if(SETORES.indexOf(x.setor)<0) return recusa("Escolha o setor.");
    if(!valor) return recusa("Informe o valor das joias, a preço de venda.");
    var id = trim(x.id) || ("jp"+Date.now().toString(36)+Math.floor(Math.random()*1296).toString(36));
    if(achar(id)) return recusa("Esse pagamento já foi registrado.");
    j.itens.unshift({id:id, pessoa:pessoa, setor:x.setor, motivo:MOTIVOS.indexOf(x.motivo)>=0 ? x.motivo : MOTIVOS[0], descricao:trim(x.descricao).slice(0, 200), valor:valor, custoPct:pctCusto(x.custoPct), pecas:trim(x.pecas).toUpperCase().slice(0, 600),
      situacao:"Pedido", criadoPor:por, criadoEm:agora, mes:agora.slice(0, 7), historico:[{em:agora, por:por, ato:"Pedido criado"}]});
    return ok("Pagamento em joias registrado");
  }
  var it = achar(a.id); if(!it) return recusa("Pagamento não encontrado.");
  if(a.op==="etapa"){
    var para = a.para; if(!ANTES[para]) return recusa("Etapa inválida.");
    if(it.situacao!==ANTES[para]) return recusa("Este pagamento está em \""+it.situacao+"\"; a etapa \""+para+"\" só vem depois de \""+ANTES[para]+"\".");
    it.situacao = para;
    if(para==="Autorizado"){ it.autorizadoPor = por; it.autorizadoEm = agora; }
    if(para==="Separado"){ it.separadoPor = por; it.separadoEm = agora; if(trim(a.pecas)) it.pecas = trim(a.pecas).toUpperCase().slice(0, 600); }
    if(para==="Retirado"){ it.retiradoPor = por; it.retiradoEm = agora; it.recebeu = trim(a.recebeu) || it.pessoa; }
    it.historico = (it.historico || []).concat([{em:agora, por:por, ato:para}]);
    return ok(it.pessoa+": "+para.toLowerCase());
  }
  if(a.op==="cancelar"){
    if(it.situacao==="Retirado") return recusa("As joias já foram retiradas; não dá para cancelar.");
    if(it.situacao==="Cancelado") return recusa("Já está cancelado.");
    it.situacao = "Cancelado"; it.canceladoPor = por; it.canceladoEm = agora; it.historico = (it.historico || []).concat([{em:agora, por:por, ato:"Cancelado"}]);
    return ok("Pagamento cancelado");
  }
  if(a.op==="apagar"){
    if(it.situacao!=="Pedido" && it.situacao!=="Cancelado") return recusa("Só se apaga um pedido ou um pagamento cancelado.");
    j.itens = j.itens.filter(function(y){ return y.id!==it.id; });
    return ok("Registro apagado");
  }
  return recusa("Ação desconhecida.");
}

// resumo por mês e setor (o que foi cancelado não conta): quantos pagamentos, valor a preço de venda, custo e quanto já foi retirado
function jpResumo(j){
  var m = {};
  ((j && j.itens) || []).forEach(function(x){
    if(x.situacao==="Cancelado") return;
    var mes = x.mes || String(x.criadoEm || "").slice(0, 7), k = mes+"|"+x.setor, r = m[k] = m[k] || {id:k, mes:mes, setor:x.setor, qtd:0, valor:0, custo:0, retirado:0};
    r.qtd++; r.valor += Number(x.valor) || 0; r.custo += custoDe(x); if(x.situacao==="Retirado") r.retirado += Number(x.valor) || 0;
  });
  return Object.keys(m).map(function(k){ var r = m[k]; r.valor = Math.round(r.valor*100)/100; r.custo = Math.round(r.custo*100)/100; r.retirado = Math.round(r.retirado*100)/100; return r; }).sort(function(a, b){ return a.mes<b.mes ? 1 : a.mes>b.mes ? -1 : a.setor<b.setor ? -1 : 1; });
}

// texto do recibo de retirada (para copiar e mandar ou imprimir)
function jpRecibo(x){
  var dia = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7)+"/"+iso.slice(0, 4) : "—"; }, brl = function(v){ return "R$ "+Number(v||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); };
  return ["RECIBO DE RETIRADA DE JOIAS", "", "Pessoa: "+x.pessoa, "Setor: "+x.setor, "Motivo: "+x.motivo+(x.descricao ? " ("+x.descricao+")" : ""), "Valor das joias (preço de venda): "+brl(x.valor), "Peças: "+(x.pecas || "—"),
    "Autorizado por: "+(x.autorizadoPor || "—")+" em "+dia(x.autorizadoEm), "Separado por: "+(x.separadoPor || "—")+" em "+dia(x.separadoEm), "Retirado por: "+(x.recebeu || x.pessoa)+" em "+dia(x.retiradoEm), "", "Assinatura: ______________________________"].join("\n");
}

export { SETORES, MOTIVOS, SITUACOES, CUSTO_PADRAO, jpMigrar, jpReduz, jpResumo, jpRecibo, custoDe, pctCusto };
