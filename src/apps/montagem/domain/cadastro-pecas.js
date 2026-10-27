import { globLocal } from "@/lib/glob-local";
// Sorelly Admin · montagem — domain/cadastro-pecas.js
// Cadastro de peças (Rayssa): custo e preço sugerido de cada peça, por LOTE (= uma aba da planilha Bruto/Ouro 2026), comparação de fornecedores
// e pedidos de alteração para a DevMaster. Estado s.cpc (só neste navegador). Nasce VAZIO (repositório é público); dados de teste, se existirem,
// vêm só de domain/cadastro-pecas.local.js (gitignored): export default {lotes:[{id, nome, galvanica:"pontual"|"ellos", tabela:[{tipo, rg}], linhas:[{data, fornecedor, codigo, qtd, bruto, peso, banho, descPedra, preco, codDev}]}]}
//
// Regras (decididas com o Marcus em 20/10/2026, ver docs/DECISOES.md):
//   banho unitário = peso × R$/g do tipo de banho (tabela da fatura da galvânica, já com +10%); desconto da pedra (%) abate só o banho.
//   custo = preço bruto do romaneio + banho. Etiqueta (R$ 0,04) e embalagem (R$ 0,10) entram só na DevMaster.
//   a Sorelly recebe 54,86% do preço de venda (config.recebido); markup = (recebido − custo) ÷ custo. O markup do lote é ponderado pela quantidade.
//   preço sugerido = o menor preço que bate o markup alvo do lote, arredondado para cima (terminando em 8, se config.arred8).
//   banho sugerido por tipo de peça (config.banhoPadrao): anéis Ouro 4, colares/braceletes/pulseiras/correntes Ouro 3, prata só "Prata"; verniz em todo ouro da Pontual.
var LOCAL = (function(){ try { var m = globLocal("apps/montagem/domain/cadastro-pecas.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();

var GALVANICAS = {pontual:"Pontual", ellos:"Ellos"};
// Status do pedido de bruto (Marcus, 21/10/2026). "Banhado" entra sozinho quando uma fatura de banho é lançada para o pedido.
var STATUS_PED = ["Montando pedido", "Aguardando envio", "A caminho da Pontual", "A caminho da Ellos", "Aguardando banho", "Parcial", "Banhado", "Cadastrando", "Finalizado"];
var ANTES_BANHO = ["Montando pedido", "Aguardando envio", "A caminho da Pontual", "A caminho da Ellos", "Aguardando banho", "Parcial"];
var CATS = [["aneis","Anéis"], ["brincos","Brincos"], ["trios","Trios"], ["colares","Colares"], ["chokers","Chokers"], ["pulseiras","Pulseiras"], ["masculino","Masculino"], ["pingentes","Pingentes"], ["tornozeleiras","Tornozeleiras"], ["infantil","Infantil"], ["conjuntos","Conjuntos"], ["venezianas","Venezianas"], ["acessorios","Acessórios"], ["portaJoias","Porta joias"]];
// serviços de cada fatura de banho (as galvânicas cobram coisas diferentes)
var SERV = {pontual:[["rodio","Caneta ródio"], ["verniz","Verniz"], ["tarraxa","Tarraxa"], ["flash","Flash"], ["prata","Prata"], ["ouro1","Ouro 1"], ["ouro2","Ouro 2"], ["ouro3","Ouro 3"], ["ouro4","Ouro 4"], ["ouro5","Ouro 5"], ["ouroBranco","Ouro branco"]],
  ellos:[["tarraxa","Tarraxa"], ["flash","Flash"], ["prata","Prata"], ["ouro1","Ouro 1"], ["ouro2","Ouro 2"], ["ouro3","Ouro 3"], ["ouro4","Ouro 4"]]};
var ATIVIDADES = [["pedidos_bruto","Lançar pedidos de bruto e romaneios"], ["faturas_banho","Lançar faturas de banho e retirar ouro"], ["cadastro_pecas","Calcular custo e cadastrar peças"], ["devmaster","Pedir alterações à DevMaster"], ["pedidos_producao","Responder pedidos de peças da produção"]];
var QUEM_PADRAO = {pedidos_bruto:["Rayssa", "Graziella"], faturas_banho:["Nickolas"], cadastro_pecas:["Rayssa", "Graziella"], devmaster:["Rayssa"], pedidos_producao:["Rayssa", "Graziella"]};
// "Ouro 556-1" da Ellos é só "Ouro 1" (1 milésimo); "Prata 50" é só "Prata". Um nome só para as duas galvânicas.
function normBanho(t){ return trim(t).replace(/^Ouro 556-(\d)$/i, "Ouro $1").replace(/^Prata 50$/i, "Prata").replace(/^Ouro (\d)\s*\+\s*Verniz$/i, "Ouro $1 + Verniz"); }
var FORN_NOMES = {"megasul":"Mega Sul", "art ello":"Art Ello", "joias & cia":"Joias & Cia", "point":"Point", "cm3":"CM3", "cwb flanelas":"CWB Flanelas"};
function normForn(n){ var s = trim(n), k = s.toLowerCase(); return FORN_NOMES[k] || s.toLowerCase().replace(/(^|\s)\S/g, function(m){ return m.toUpperCase(); }); }
function normStatus(s){ var k = trim(s).toLowerCase(); return STATUS_PED.find(function(x){ return x.toLowerCase()===k; }) || "Aguardando banho"; }
var ESTADOS_SOL = [["pedido","Pedido"], ["enviado","Enviado à DevMaster"], ["feito","Feito"]];
var PENDENCIAS_BANHO = ["Pontual manda um preço só para a prata e um só para o verniz, sem dizer o nível da prata (30M ou 50M) nem o tipo do verniz: confirmar com eles para fechar o comparativo."];
var CONFIG_PADRAO = {quem:QUEM_PADRAO, banhoComp:{cotacaoEllos:0, atualizado:"", ellos:{}, pontual:{}, pendencias:PENDENCIAS_BANHO}, recebido:0.5486, markupAlvo:2.75, arred8:true, vernizPontual:0.37,
  banhoPadrao:[["Anéis","Ouro 4"], ["Colares","Ouro 3"], ["Braceletes e pulseiras","Ouro 3"], ["Correntes","Ouro 3"], ["Peças de prata","Prata"]]};

var num = function(v){ var n = typeof v==="number" ? v : parseFloat(String(v==null ? "" : v).replace(/\./g,"").replace(",",".")); return isFinite(n) ? n : 0; };
var numPonto = function(v){ var n = typeof v==="number" ? v : parseFloat(String(v==null ? "" : v).replace(",",".")); return isFinite(n) ? n : 0; };
var r2 = function(n){ return Math.round(n*100)/100; };
var trim = function(t){ return String(t==null ? "" : t).trim(); };
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
function hojeISO(){ return new Date().toISOString().slice(0, 10); }
function novoId(c, p){ c.seq = (c.seq||0) + 1; return p + c.seq; }

function novoCpc(){ return {seq:0, lotes:[], pedidos:[], fatP:[], fatE:[], envios:[], solic:[], config:clone(CONFIG_PADRAO), historico:[]}; }
function pedidoNovo(c, x){
  var cats = {}; CATS.forEach(function(k){ var v = Math.round(num((x.cats||{})[k[0]])); if(v>0) cats[k[0]] = v; });
  var valor = numPonto(x.valor), desc = Math.min(1, Math.max(0, numPonto(x.desc)));
  return {id:novoId(c, "o"), forn:normForn(x.forn), data:trim(x.data), nota:trim(x.nota), valor:valor, desc:desc, pagar:x.pagar!=null && x.pagar!=="" ? numPonto(x.pagar) : r2(valor*(1-desc)), chegPontual:trim(x.chegPontual), chegEllos:trim(x.chegEllos), chegSorelly:trim(x.chegSorelly), romaneio:trim(x.romaneio), status:normStatus(x.status || "Montando pedido"), cats:cats, obs:trim(x.obs)};
}
function faturaNova(c, galv, x){
  var serv = {}; SERV[galv].forEach(function(k){ var v = numPonto((x.serv||{})[k[0]]); if(v) serv[k[0]] = v; });
  return {id:novoId(c, "f"), data:trim(x.data), mes:trim(x.mes), fatura:trim(x.fatura), forn:normForn(x.forn), cnpj:trim(x.cnpj), desc:numPonto(x.desc), serv:serv, kgPrata:numPonto(x.kgPrata), kgOuro:numPonto(x.kgOuro), pedidos:(x.pedidos||[]).slice()};
}
function envioNovo(c, x){ return {id:novoId(c, "e"), data:trim(x.data), galv:x.galv==="ellos" ? "ellos" : "pontual", kg:numPonto(x.kg), status:trim(x.status) || "Enviado", faturaId:x.faturaId||"", faturaNum:trim(x.faturaNum), valor:numPonto(x.valor), dataFatura:trim(x.dataFatura)}; }
function cpcDemo(){
  var c = novoCpc();
  if(LOCAL) (LOCAL.lotes||[]).forEach(function(l){
    var lote = {id:novoId(c, "l"), nome:trim(l.nome), galvanica:l.galvanica==="ellos" ? "ellos" : "pontual", markup:null, tabela:(l.tabela||[]).map(function(t){ return {tipo:trim(t.tipo), rg:numPonto(t.rg)}; }), linhas:[], criado:hojeISO()};
    (l.linhas||[]).forEach(function(x){ lote.linhas.push(linhaNova(c, x)); });
    c.lotes.push(lote);
  });
  if(LOCAL){
    (LOCAL.pedidos||[]).forEach(function(p){ c.pedidos.push(pedidoNovo(c, p)); });
    (LOCAL.fatP||[]).forEach(function(f){ c.fatP.push(faturaNova(c, "pontual", f)); });
    (LOCAL.fatE||[]).forEach(function(f){ c.fatE.push(faturaNova(c, "ellos", f)); });
    (LOCAL.envios||[]).forEach(function(v){ var e1 = envioNovo(c, {data:v.data, galv:v.galv, kg:v.kg, status:/desconta/i.test(v.status) ? "Descontado em fatura" : "Enviado", valor:v.desconto, dataFatura:v.dataFatura, faturaNum:v.faturaValor ? "R$ "+v.faturaValor : ""}); c.envios.push(e1); });
  }
  // solicitações iniciais à DevMaster (limpeza combinada com o Marcus em 20/10/2026)
  [["Inativar grupos que não são mais usados", "Sorelly Premium, Brincos Select e os demais \"Select\", Borboleta, 3K, 2K, Sorelly VIP/Gold e os já marcados como inativos que ainda aparecem."],
   ["Inativar classes que não são mais usadas", "Ródio, Ródio negro, Ouro rosé, Produto de apoio, Produtos de beleza, Ativo fixo e Collection (Collection e Ativo fixo não deveriam estar em classe)."],
   ["Criar a classe \"Ouro 18K + Caneta de Ródio\"", "Classe nova: peças com ouro 18K e caneta de ródio."],
   ["Rever a classe \"Prata 925\"", "As peças são semijoias banhadas a prata, não prata 925. Alinhar o nome com o Marcus (ex.: Prata banhada)."]
  ].forEach(function(p){ c.solic.push({id:novoId(c, "s"), titulo:p[0], texto:p[1], estado:"pedido", por:"Sistema", em:hojeISO()}); });
  return c;
}
function cpcMigrar(c){
  if(!c || typeof c!=="object") return cpcDemo();
  var b = novoCpc(); Object.keys(b).forEach(function(k){ if(c[k]===undefined) c[k] = b[k]; });
  Object.keys(CONFIG_PADRAO).forEach(function(k){ if(c.config[k]===undefined) c.config[k] = clone(CONFIG_PADRAO[k]); });
  var bc = c.config.banhoComp;   // tabela de preços do banho (Ellos x Pontual): os valores reais vêm só do arquivo local
  if(LOCAL && LOCAL.comparativo && !Object.keys(bc.ellos).length && !Object.keys(bc.pontual).length){ var lc = LOCAL.comparativo; bc.cotacaoEllos = numPonto(lc.cotacaoEllos); bc.atualizado = trim(lc.atualizado); bc.ellos = clone(lc.ellos||{}); bc.pontual = clone(lc.pontual||{}); }
  c.lotes.forEach(function(l){ l.tabela.forEach(function(t){ t.tipo = normBanho(t.tipo); }); l.linhas.forEach(function(x){ x.banho = normBanho(x.banho); x.fornecedor = normForn(x.fornecedor); }); });   // nomes do banho e dos fornecedores padronizados
  return c;
}
function linhaNova(c, x){
  return {id:novoId(c, "p"), data:trim(x.data), fornecedor:trim(x.fornecedor), codigo:trim(x.codigo), qtd:Math.max(0, Math.round(num(x.qtd))), bruto:numPonto(x.bruto), peso:numPonto(x.peso), banho:trim(x.banho), banhoManual:numPonto(x.banhoManual), descPedra:numPonto(x.descPedra), preco:numPonto(x.preco), codDev:trim(x.codDev), enviado:!!x.enviado};
}

// ---------- cálculo ----------
function rgDe(lote, tipo){ var t = (lote.tabela||[]).find(function(x){ return x.tipo===tipo; }); return t ? t.rg : null; }
/** menor preço que bate o markup alvo (arredondado para cima; terminando em 8 se arred8) */
function precoParaMarkup(custo, alvo, cfg){
  if(!(custo>0)) return 0;
  var p = Math.ceil(custo*(1+alvo)/cfg.recebido);
  if(cfg.arred8 && p>=8){ var base = Math.floor(p/10)*10 + 8; p = base<p ? base+10 : base; }
  return p;
}
/** números de uma linha. banhoOk=false quando falta o tipo de banho na tabela do lote */
function calcLinha(l, lote, cfg){
  var rg = l.banho ? rgDe(lote, l.banho) : null, manual = l.banhoManual>0, banhoOk = rg!=null || manual, peso = l.peso||0;   // banho manual = valor fixo por peça (ex.: Linda), vale no lugar de peso × R$/g
  var banhoRaw = manual ? l.banhoManual : (rg!=null ? peso*rg : 0), banhoUn = r2(banhoRaw), banhoDesc = banhoRaw*(1-(l.descPedra||0));
  var custo = (l.bruto||0) + banhoDesc, alvo = lote.markup!=null ? lote.markup : cfg.markupAlvo;
  var sugerido = precoParaMarkup(custo, alvo, cfg), preco = l.preco>0 ? l.preco : sugerido, recebido = preco*cfg.recebido;
  return {banhoOk:banhoOk, banhoUn:banhoUn, banhoDesc:banhoDesc, custo:custo, sugerido:sugerido, preco:preco, recebido:recebido, markup:custo>0 ? (recebido-custo)/custo : 0,
    brutoTotal:(l.bruto||0)*(l.qtd||0), banhoTotal:banhoDesc*(l.qtd||0), custoTotal:custo*(l.qtd||0), vendaTotal:preco*(l.qtd||0), recebidoTotal:recebido*(l.qtd||0)};
}
function resumoLote(lote, cfg){
  var t = {pecas:0, linhas:lote.linhas.length, brutoTotal:0, banhoTotal:0, custoTotal:0, vendaTotal:0, recebidoTotal:0, semBanho:0, semPreco:0, enviadas:0};
  lote.linhas.forEach(function(l){ var c = calcLinha(l, lote, cfg); t.pecas += l.qtd||0; t.brutoTotal += c.brutoTotal; t.banhoTotal += c.banhoTotal; t.custoTotal += c.custoTotal; t.vendaTotal += c.vendaTotal; t.recebidoTotal += c.recebidoTotal;
    if(!c.banhoOk) t.semBanho++; if(!(l.preco>0)) t.semPreco++; if(l.enviado) t.enviadas++; });
  t.markup = t.custoTotal>0 ? (t.recebidoTotal-t.custoTotal)/t.custoTotal : 0;
  t.pagar = t.brutoTotal + t.banhoTotal;
  return t;
}
/** comparação de fornecedores (todos os lotes, ou só um) — custo médio por peça ponderado pela quantidade */
function porFornecedor(c, loteId){
  var m = {};
  c.lotes.forEach(function(lote){ if(loteId && lote.id!==loteId) return;
    lote.linhas.forEach(function(l){ var nome = trim(l.fornecedor) || "—", k = nome.toLowerCase(), x = m[k] || (m[k] = {fornecedor:nome, pecas:0, bruto:0, banho:0, custo:0, venda:0, recebido:0, modelos:0}), q = l.qtd||0, v = calcLinha(l, lote, c.config);
      x.pecas += q; x.bruto += v.brutoTotal; x.banho += v.banhoTotal; x.custo += v.custoTotal; x.venda += v.vendaTotal; x.recebido += v.recebidoTotal; x.modelos++; }); });
  return Object.keys(m).map(function(k){ var x = m[k]; x.brutoMedio = x.pecas ? x.bruto/x.pecas : 0; x.banhoMedio = x.pecas ? x.banho/x.pecas : 0; x.custoMedio = x.pecas ? x.custo/x.pecas : 0; x.precoMedio = x.pecas ? x.venda/x.pecas : 0; x.markup = x.custo>0 ? (x.recebido-x.custo)/x.custo : 0; return x; })
    .sort(function(a, b){ return a.custoMedio - b.custoMedio; });
}

// ---------- pedidos de bruto, faturas de banho e controle do mês ----------
function mesDe(iso){ return trim(iso).slice(0, 7); }
function valorFatura(f){ return r2(Object.keys(f.serv||{}).reduce(function(s, k){ return s + (f.serv[k]||0); }, 0) + (f.desc||0)); }
function pecasPedido(p){ return Object.keys(p.cats||{}).reduce(function(s, k){ return s + (p.cats[k]||0); }, 0); }
/** o que foi comprado de bruto num mês (pela data da compra) */
function controleMes(c, mes){
  var ps = c.pedidos.filter(function(p){ return mesDe(p.data)===mes; }), forn = {}, cat = {};
  var t = {n:ps.length, valor:0, pagar:0, pecas:0};
  ps.forEach(function(p){ t.valor += p.valor; t.pagar += p.pagar; var q = pecasPedido(p); t.pecas += q;
    var x = forn[p.forn] || (forn[p.forn] = {forn:p.forn, n:0, valor:0, pagar:0, pecas:0}); x.n++; x.valor += p.valor; x.pagar += p.pagar; x.pecas += q;
    Object.keys(p.cats||{}).forEach(function(k){ cat[k] = (cat[k]||0) + (p.cats[k]||0); }); });
  t.desc = t.valor>0 ? (t.valor-t.pagar)/t.valor : 0;
  var fat = c.fatP.concat(c.fatE).filter(function(f){ return mesDe(f.data)===mes; }), banho = fat.reduce(function(s, f){ return s + valorFatura(f); }, 0);
  return {t:t, banho:banho, faturas:fat.length, forn:Object.keys(forn).map(function(k){ var x = forn[k]; x.desc = x.valor>0 ? (x.valor-x.pagar)/x.valor : 0; return x; }).sort(function(a, b){ return b.pagar-a.pagar; }),
    cats:CATS.map(function(k){ return {k:k[0], nome:k[1], q:cat[k[0]]||0}; }).filter(function(x){ return x.q>0; })};
}
/** meses que têm compra ou fatura, do mais novo para o mais antigo */
function mesesCpc(c){
  var m = {}; c.pedidos.forEach(function(p){ if(mesDe(p.data)) m[mesDe(p.data)] = 1; }); c.fatP.concat(c.fatE).forEach(function(f){ if(mesDe(f.data)) m[mesDe(f.data)] = 1; });
  return Object.keys(m).sort().reverse();
}

// ---------- ações ----------
function cpcReduz(s, a){
  var c = clone(s.cpc || novoCpc()), por = a.por || "—", recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg){ return {patch:{cpc:c}, msg:msg}; };
  var log = function(op, nota){ c.historico.push({em:new Date().toISOString(), por:por, op:op, nota:nota||""}); if(c.historico.length>300) c.historico = c.historico.slice(-300); };
  var lote1 = function(id){ return c.lotes.find(function(x){ return x.id===id; }); };
  switch(a.op){
    case "lote_add": {
      var nome = trim(a.nome); if(!nome) return recusa("Informe o nome da planilha (ex.: 26/10 (Pontual)).");
      var galv = a.galvanica==="ellos" ? "ellos" : "pontual", ult = c.lotes.slice().reverse().find(function(x){ return x.galvanica===galv; });
      c.lotes.unshift({id:novoId(c, "l"), nome:nome, galvanica:galv, markup:null, tabela:ult ? clone(ult.tabela) : [], linhas:[], criado:hojeISO()});   // a tabela de banho do último lote da mesma galvânica serve de ponto de partida
      log("lote_add", nome); return ok("Planilha criada"+(ult ? " (tabela de banho copiada da última da "+GALVANICAS[galv]+": confira os valores da fatura nova)." : "."));
    }
    case "lote_del": { var i = c.lotes.findIndex(function(x){ return x.id===a.id; }); if(i<0) return recusa("Planilha não encontrada."); var g = c.lotes.splice(i, 1)[0]; log("lote_del", g.nome); return ok("Planilha removida."); }
    case "lote_edit": {
      var l1 = lote1(a.id); if(!l1) return recusa("Planilha não encontrada.");
      if(a.nome!==undefined){ var n2 = trim(a.nome); if(!n2) return recusa("O nome da planilha não pode ficar vazio."); l1.nome = n2; }
      if(a.markup!==undefined) l1.markup = a.markup===null || a.markup==="" ? null : Math.max(0, numPonto(a.markup)/100);   // vem em % (275 = 275%)
      log("lote_edit", l1.nome); return ok("Planilha atualizada.");
    }
    case "tabela_set": {
      var l2 = lote1(a.lote); if(!l2) return recusa("Planilha não encontrada."); var tp = trim(a.tipo); if(!tp) return recusa("Informe o tipo de banho.");
      var rg = numPonto(a.rg); if(rg<0) return recusa("O valor do banho não pode ser negativo.");
      var t = l2.tabela.find(function(x){ return x.tipo===tp; }); if(t) t.rg = rg; else l2.tabela.push({tipo:tp, rg:rg});
      log("tabela_set", l2.nome+" · "+tp); return ok("Tabela de banho atualizada.");
    }
    case "tabela_del": { var l3 = lote1(a.lote); if(!l3) return recusa("Planilha não encontrada."); l3.tabela = l3.tabela.filter(function(x){ return x.tipo!==a.tipo; }); log("tabela_del", l3.nome+" · "+a.tipo); return ok("Tipo de banho removido."); }
    case "linha_add": {
      var l4 = lote1(a.lote); if(!l4) return recusa("Planilha não encontrada.");
      (Array.isArray(a.linhas) ? a.linhas : [a]).forEach(function(x){ if(trim(x.codigo)) l4.linhas.push(linhaNova(c, Object.assign({data:hojeISO()}, x))); });
      log("linha_add", l4.nome); return ok("Peças lançadas.");
    }
    case "linha_edit": {
      var l5 = lote1(a.lote); if(!l5) return recusa("Planilha não encontrada."); var ln = l5.linhas.find(function(x){ return x.id===a.id; }); if(!ln) return recusa("Linha não encontrada.");
      ["fornecedor", "codigo", "banho", "codDev", "data"].forEach(function(k){ if(a[k]!==undefined) ln[k] = trim(a[k]); });
      ["bruto", "peso", "preco", "banhoManual"].forEach(function(k){ if(a[k]!==undefined) ln[k] = Math.max(0, numPonto(a[k])); });
      if(a.qtd!==undefined) ln.qtd = Math.max(0, Math.round(num(a.qtd)));
      if(a.descPedra!==undefined) ln.descPedra = Math.min(1, Math.max(0, numPonto(a.descPedra)/100));   // vem em %
      return ok("");
    }
    case "linha_del": { var l6 = lote1(a.lote); if(!l6) return recusa("Planilha não encontrada."); l6.linhas = l6.linhas.filter(function(x){ return x.id!==a.id; }); return ok("Linha removida."); }
    case "linhas_enviadas": { var l7 = lote1(a.lote); if(!l7) return recusa("Planilha não encontrada."); (a.ids||[]).forEach(function(id){ var x = l7.linhas.find(function(y){ return y.id===id; }); if(x) x.enviado = true; }); log("enviadas", l7.nome+" · "+(a.ids||[]).length); return ok("Preços enviados ao chat."); }
    case "config": {
      if(a.recebido!==undefined){ var r = numPonto(a.recebido)/100; if(!(r>0 && r<=1)) return recusa("O percentual que a Sorelly recebe precisa estar entre 1% e 100%."); c.config.recebido = r; }
      if(a.markupAlvo!==undefined){ var m = numPonto(a.markupAlvo)/100; if(m<0) return recusa("O markup alvo não pode ser negativo."); c.config.markupAlvo = m; }
      if(a.arred8!==undefined) c.config.arred8 = !!a.arred8;
      log("config", ""); return ok("Configuração salva.");
    }
    case "ped_add": { var po = pedidoNovo(c, a); if(!po.forn) return recusa("Informe o fornecedor."); if(!(po.valor>0)) return recusa("Informe o valor do pedido."); c.pedidos.unshift(po); log("ped_add", po.forn+" · "+brlC(po.valor)); return ok("Pedido lançado."); }
    case "ped_edit": {
      var pe = c.pedidos.find(function(x){ return x.id===a.id; }); if(!pe) return recusa("Pedido não encontrado.");
      ["forn", "data", "nota", "romaneio", "chegPontual", "chegEllos", "chegSorelly", "obs"].forEach(function(k){ if(a[k]!==undefined) pe[k] = k==="forn" ? normForn(a[k]) : trim(a[k]); });
      if(a.status!==undefined){ if(STATUS_PED.indexOf(a.status)<0) return recusa("Status inválido."); pe.status = a.status; }
      if(a.valor!==undefined){ pe.valor = Math.max(0, numPonto(a.valor)); pe.pagar = r2(pe.valor*(1-pe.desc)); }
      if(a.desc!==undefined){ pe.desc = Math.min(1, Math.max(0, numPonto(a.desc)/100)); pe.pagar = r2(pe.valor*(1-pe.desc)); }
      if(a.pagar!==undefined){ pe.pagar = Math.max(0, numPonto(a.pagar)); pe.desc = pe.valor>0 ? Math.min(1, Math.max(0, 1-pe.pagar/pe.valor)) : 0; }
      if(a.cat!==undefined){ var q = Math.max(0, Math.round(num(a.qtd))); if(q) pe.cats[a.cat] = q; else delete pe.cats[a.cat]; }
      return ok("");
    }
    case "ped_del": { c.pedidos = c.pedidos.filter(function(x){ return x.id!==a.id; }); c.fatP.concat(c.fatE).forEach(function(f){ f.pedidos = (f.pedidos||[]).filter(function(i){ return i!==a.id; }); }); log("ped_del", a.id); return ok("Pedido removido."); }
    case "fat_add": {
      var gl = a.galv==="ellos" ? "ellos" : "pontual", fn = faturaNova(c, gl, a); if(!fn.fatura && !fn.forn) return recusa("Informe o número da fatura e o fornecedor.");
      (gl==="ellos" ? c.fatE : c.fatP).unshift(fn); log("fat_add", GALVANICAS[gl]+" · "+fn.fatura); return ok("Fatura lançada.");
    }
    case "fat_edit": {
      var lista = a.galv==="ellos" ? c.fatE : c.fatP, fe = lista.find(function(x){ return x.id===a.id; }); if(!fe) return recusa("Fatura não encontrada.");
      if(a.campo && a.campo.indexOf("serv.")===0){ var sk = a.campo.slice(5), sv = numPonto(a.valor); if(sv) fe.serv[sk] = sv; else delete fe.serv[sk]; }
      else if(["desc", "kgPrata", "kgOuro"].indexOf(a.campo)>=0) fe[a.campo] = numPonto(a.valor);
      else if(["data", "mes", "fatura", "cnpj"].indexOf(a.campo)>=0) fe[a.campo] = trim(a.valor);
      else if(a.campo==="forn") fe.forn = normForn(a.valor);
      return ok("");
    }
    case "fat_del": { var l2 = a.galv==="ellos" ? "fatE" : "fatP"; c[l2] = c[l2].filter(function(x){ return x.id!==a.id; }); c.envios.forEach(function(v){ if(v.faturaId===a.id){ v.faturaId = ""; v.status = "Enviado"; } }); log("fat_del", a.id); return ok("Fatura removida."); }
    case "fat_pedidos": {   // liga a fatura aos pedidos de bruto; pedido que ainda não tinha sido banhado passa sozinho para "Banhado"
      var l3 = a.galv==="ellos" ? c.fatE : c.fatP, f3 = l3.find(function(x){ return x.id===a.id; }); if(!f3) return recusa("Fatura não encontrada.");
      f3.pedidos = (a.pedidos||[]).slice();
      c.pedidos.forEach(function(p){ if(f3.pedidos.indexOf(p.id)>=0 && ANTES_BANHO.indexOf(p.status)>=0) p.status = "Banhado"; });
      log("fat_pedidos", f3.fatura+" · "+f3.pedidos.length+" pedido(s)"); return ok("Pedidos ligados à fatura; os que esperavam banho passaram para Banhado.");
    }
    case "env_add": { var ev = envioNovo(c, a); if(!(ev.kg>0)) return recusa("Informe o peso enviado (kg)."); c.envios.unshift(ev); log("env_add", ev.kg+" kg"); return ok("Envio de ouro registrado."); }
    case "env_edit": {
      var en = c.envios.find(function(x){ return x.id===a.id; }); if(!en) return recusa("Envio não encontrado.");
      if(a.data!==undefined) en.data = trim(a.data); if(a.galv!==undefined) en.galv = a.galv==="ellos" ? "ellos" : "pontual"; if(a.kg!==undefined) en.kg = Math.max(0, numPonto(a.kg));
      if(a.faturaNum!==undefined) en.faturaNum = trim(a.faturaNum); if(a.dataFatura!==undefined) en.dataFatura = trim(a.dataFatura);
      if(a.valor!==undefined){ en.valor = Math.max(0, numPonto(a.valor)); en.status = en.valor>0 ? "Descontado em fatura" : "Enviado"; }   // registrar o valor descontado marca o envio como descontado
      return ok("");
    }
    case "env_del": { c.envios = c.envios.filter(function(x){ return x.id!==a.id; }); return ok("Envio removido."); }
    case "comp_set": {   // preço do banho de um milésimo (R$/g) em uma galvânica; vazio apaga
      var gk = a.galv==="ellos" ? "ellos" : "pontual", mil = Math.round(num(a.mil)); if(!(mil>=1 && mil<=40)) return recusa("Informe o milésimo (de 1 a 40).");
      var vc = numPonto(a.valor), bc2 = c.config.banhoComp; if(a.valor==="" || a.valor==null || !(vc>0)) delete bc2[gk][mil]; else bc2[gk][mil] = r2(vc);
      bc2.atualizado = hojeISO(); log("comp_set", GALVANICAS[gk]+" · milésimo "+mil); return ok("");
    }
    case "comp_cotacao": { var cv = numPonto(a.valor); if(!(cv>0)) return recusa("Informe a cotação do ouro em R$ por grama."); c.config.banhoComp.cotacaoEllos = cv; c.config.banhoComp.atualizado = hojeISO(); log("comp_cotacao", String(cv)); return ok("Cotação salva."); }
    case "comp_recalc": {   // Ellos: cada milésimo a mais custa a cotação ÷ 1.000 (R$ 640/g → +R$ 0,64); parte do preço do milésimo 1
      var bc3 = c.config.banhoComp, base = bc3.ellos[1]; if(!(base>0)) return recusa("Informe o preço do milésimo 1 da Ellos.");
      if(!(bc3.cotacaoEllos>0)) return recusa("Informe a cotação do ouro da Ellos.");
      Object.keys(bc3.ellos).forEach(function(k){ bc3.ellos[k] = r2(base + (Math.round(num(k))-1)*bc3.cotacaoEllos/1000); }); bc3.atualizado = hojeISO(); log("comp_recalc", ""); return ok("Preços da Ellos recalculados pela cotação.");
    }
    case "quem": {
      var at = ATIVIDADES.find(function(x){ return x[0]===a.atividade; }); if(!at) return recusa("Atividade inválida.");
      c.config.quem[a.atividade] = String(a.nomes||"").split(/[,;]/).map(trim).filter(Boolean); log("quem", at[1]); return ok("Responsáveis atualizados.");
    }
    case "sol_add": {
      var tt = trim(a.titulo); if(!tt) return recusa("Escreva o que precisa mudar na DevMaster.");
      c.solic.unshift({id:novoId(c, "s"), titulo:tt, texto:trim(a.texto), estado:"pedido", por:por, em:hojeISO()}); log("sol_add", tt); return ok("Pedido para a DevMaster criado.");
    }
    case "sol_estado": { var so = c.solic.find(function(x){ return x.id===a.id; }); if(!so) return recusa("Pedido não encontrado."); if(!ESTADOS_SOL.some(function(e2){ return e2[0]===a.estado; })) return recusa("Etapa inválida."); so.estado = a.estado; so.atualizado = hojeISO(); log("sol_estado", so.titulo+" → "+a.estado); return ok(""); }
    case "sol_del": { c.solic = c.solic.filter(function(x){ return x.id!==a.id; }); return ok("Pedido removido."); }
    default: return recusa("Ação desconhecida.");
  }
}

function brlC(n){ return "R$ "+Number(n||0).toFixed(2).replace(".", ","); }
/** a pessoa pode fazer a atividade? a diretoria sempre pode; os demais, só se o primeiro nome estiver na lista de quem faz */
function podeFazer(c, atividade, nome, admin){
  if(admin) return true; var p = trim(nome).split(" ")[0].toLowerCase(), l = (c.config.quem && c.config.quem[atividade]) || [];
  return l.some(function(n){ return trim(n).toLowerCase()===p; });
}
function brl(n){ return "R$ "+Number(n||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); }
function pct0(f){ return Math.round((f||0)*100)+"%"; }
export { STATUS_PED, CATS, SERV, ATIVIDADES, valorFatura, pecasPedido, controleMes, mesesCpc, podeFazer, normBanho, GALVANICAS, ESTADOS_SOL, CONFIG_PADRAO, cpcDemo, cpcMigrar, cpcReduz, calcLinha, resumoLote, porFornecedor, precoParaMarkup, rgDe, brl, pct0, numPonto };
