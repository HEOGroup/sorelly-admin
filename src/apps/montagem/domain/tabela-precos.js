// Sorelly Admin · montagem — domain/tabela-precos.js
// TABELA DE PREÇOS POR FORNECEDOR (etapa 1 de 3, Nickolas, 16/11/2026). Vive dentro do módulo de Compras (s.ce), gravado no servidor item por item:
//   ce.precos    = [{id, fornecedorId, nome, codigo, categoriaId, unidade, unidadesPorEmb, qtdMinima, obs, ativo, modelo, opcoes:[...], materialId, foto, criadoEm, criadoPor, atualizadoEm, atualizadoPor}]
//   opção        = {id, qtd (lote) | de, ate (faixa; ate null = sem limite), tipoValor:"unitario"|"total", valor, qtdRef (faixa com total), prazo, prazoUn, obs}
//   ce.logPrecos = [{id, produtoId, fornecedorId, opcaoId, campo, antes, depois, por, em}]  (histórico: campo, valor anterior e novo)
//   fornecedor.pedidoMinimo = valor mínimo do pedido (condição comercial ÚNICA do fornecedor; não se repete em cada produto)
// Etapa 2 (preparado, sem tela): materialId (ligar à mão ao material do estoque; NUNCA pelo nome) e foto ({key, nome}).
// Etapa 3 (preparado): ids estáveis do produto e de cada opção; a compra vai guardar precoProdutoId/precoOpcaoId no item, e aí o produto/opção usado não se apaga (só arquiva).
// O "preço de referência" do Catálogo de itens NÃO é outra fonte de preço: o preço mora só aqui.
// Regras: nada vazio vira zero; quantidades e valores > 0; faixas não se sobrepõem (a última pode ficar sem fim); faixa com preço TOTAL exige a quantidade de referência dentro da faixa.
// Contas a partir do valor digitado (sem arredondar duas vezes); o unitário aparece com até 4 casas (material barato).

var UNIDADES_PRECO = [["UNID", "Unidade"], ["PACOTE", "Pacote"], ["CAIXA", "Caixa"], ["MILHEIRO", "Milheiro"], ["ROLO", "Rolo"], ["PAR", "Par"], ["KIT", "Kit"], ["BLOCO", "Bloco"]];
var MODELOS_PRECO = [["lote", "Lote fechado"], ["faixa", "Faixa de quantidade"]];
var TIPOS_VALOR = [["unitario", "Preço unitário"], ["total", "Preço total"]];
var PRAZO_UNIDADES = [["uteis", "dias úteis"], ["corridos", "dias corridos"]];
var rotuloDe = function(lista, k){ var x = lista.find(function(i){ return i[0]===k; }); return x ? x[1] : (k || ""); };

var vazio = function(v){ return v===undefined || v===null || (typeof v==="string" && v.trim()===""); };
var trim = function(v){ return String(v==null ? "" : v).trim(); };
// "1.234,56" ou "1234.56" ou número → número; vazio → null; texto inválido → NaN
function numero(v){
  if(vazio(v)) return null; if(typeof v==="number") return isFinite(v) ? v : NaN;
  var t = trim(v).replace(/^R\$\s*/i, ""); if(t.indexOf(",")>=0) t = t.replace(/\./g, "").replace(",", ".");
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
}
var r2 = function(n){ return Math.round((n+Number.EPSILON)*100)/100; };
function reais(v){ return v==null || !isFinite(v) ? "—" : "R$ "+Number(v).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); }
function reaisUnit(v){ return v==null || !isFinite(v) ? "—" : "R$ "+Number(v).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:4}); }   // até 4 casas: R$ 0,0125
function qtdTxt(v){ return v==null ? "—" : Number(v).toLocaleString("pt-BR", {maximumFractionDigits:3}); }
function unidadeNome(u, n){ var r = rotuloDe(UNIDADES_PRECO, u).toLowerCase(); if(n==null || n===1) return r; return r==="unidade" ? "unidades" : r==="par" ? "pares" : r==="kit" ? "kits" : r+"s"; }

// quantas unidades de estoque cabem em UMA unidade de compra (só para o custo informativo): unidades por embalagem; milheiro = 1.000; unidade = 1
function fatorEstoque(p){ var n = numero(p.unidadesPorEmb); if(n>0) return n; if(p.unidade==="MILHEIRO") return 1000; if(p.unidade==="UNID") return 1; return null; }

// conta de uma opção: unitário (por unidade de compra), total (lote) ou total de referência (faixa), rótulo da quantidade e custo por unidade de estoque
function calcOpcao(p, o){
  var v = numero(o.valor), out = {unit:null, total:null, totalRef:false, qtdRef:null, rotulo:"", erro:""};
  if(p.modelo==="faixa"){
    var de = numero(o.de), ate = numero(o.ate);
    out.rotulo = qtdTxt(de)+(ate==null ? " ou mais" : " a "+qtdTxt(ate));
    if(o.tipoValor==="total"){ var qr = numero(o.qtdRef); if(qr>0 && v>0){ out.unit = v/qr; out.total = v; out.totalRef = true; out.qtdRef = qr; } }
    else if(v>0) out.unit = v;
  } else {
    var q = numero(o.qtd); out.rotulo = qtdTxt(q);
    if(q>0 && v>0){ if(o.tipoValor==="total"){ out.total = v; out.unit = v/q; } else { out.unit = v; out.total = r2(v*q); } }
  }
  var f = fatorEstoque(p);
  if(out.unit!=null && f && f!==1) out.custoEstoque = {valor:out.unit/f, txt:reaisUnit(out.unit)+" por "+unidadeNome(p.unidade)+" ÷ "+qtdTxt(f)+" unidades = "+reaisUnit(out.unit/f)+" por unidade"};
  return out;
}
var chaveOrdem = function(p, o){ return numero(p.modelo==="faixa" ? o.de : o.qtd) || 0; };
function opcoesOrdenadas(p){ return (p.opcoes||[]).slice().sort(function(a, b){ return chaveOrdem(p, a)-chaveOrdem(p, b); }); }

// confere o produto inteiro (dados + opções). Devolve "" ou a mensagem do primeiro problema
function validarProduto(p, fornecedores){
  if(!p.fornecedorId || !(fornecedores||[]).some(function(f){ return String(f.id)===String(p.fornecedorId); })) return "Escolha o fornecedor.";
  if(!trim(p.nome)) return "Informe o nome do produto no fornecedor.";
  if(!UNIDADES_PRECO.some(function(u){ return u[0]===p.unidade; })) return "Escolha a unidade de compra.";
  var upe = numero(p.unidadesPorEmb); if(upe!==null && !(upe>0)) return "Unidades por embalagem: informe um número maior que zero (ou deixe vazio).";
  var qm = numero(p.qtdMinima); if(qm!==null && !(qm>0)) return "Quantidade mínima de compra: informe um número maior que zero (ou deixe vazio).";
  if(!MODELOS_PRECO.some(function(m){ return m[0]===p.modelo; })) return "Escolha o modelo da tabela: lote fechado ou faixa.";
  var ops = p.opcoes||[], faixa = p.modelo==="faixa";
  for(var i = 0; i<ops.length; i++){
    var o = ops[i], n = "Opção "+(i+1)+": ", v = numero(o.valor), pr = numero(o.prazo);
    if(!TIPOS_VALOR.some(function(t){ return t[0]===o.tipoValor; })) return n+"escolha se o valor é unitário ou total.";
    if(!(v>0)) return n+"informe o valor em reais (maior que zero).";
    if(pr!==null && !(pr>0)) return n+"o prazo de entrega precisa ser maior que zero (ou fique vazio).";
    if(pr!==null && !PRAZO_UNIDADES.some(function(x){ return x[0]===o.prazoUn; })) return n+"escolha se o prazo é em dias úteis ou corridos.";
    if(faixa){
      var de = numero(o.de), ate = numero(o.ate);
      if(!(de>0)) return n+"informe a quantidade inicial da faixa (maior que zero).";
      if(ate!==null && !(ate>=de)) return n+"a quantidade final precisa ser maior ou igual à inicial.";
      if(o.tipoValor==="total"){ var qr = numero(o.qtdRef); if(!(qr>0)) return n+"com preço total, informe a quantidade de referência."; if(qr<de || (ate!==null && qr>ate)) return n+"a quantidade de referência precisa estar dentro da faixa ("+qtdTxt(de)+(ate===null ? " ou mais" : " a "+qtdTxt(ate))+")."; }
    } else if(!(numero(o.qtd)>0)) return n+"informe a quantidade do lote (maior que zero).";
  }
  var ord = opcoesOrdenadas(p);
  for(var k = 1; k<ord.length; k++){
    var a = ord[k-1], b = ord[k];
    if(faixa){ var fimA = numero(a.ate); if(fimA===null) return "A faixa \""+qtdTxt(numero(a.de))+" ou mais\" não tem fim: só a última faixa pode ficar sem quantidade final."; if(numero(b.de)<=fimA) return "As faixas "+qtdTxt(numero(a.de))+" a "+qtdTxt(fimA)+" e "+qtdTxt(numero(b.de))+(numero(b.ate)===null ? " ou mais" : " a "+qtdTxt(numero(b.ate)))+" se sobrepõem."; }
    else if(numero(a.qtd)===numero(b.qtd)) return "Há duas opções com o mesmo lote de "+qtdTxt(numero(a.qtd))+".";
  }
  return "";
}

// grava os números como número (ou null quando vazio): nada vazio vira zero
function normalizarOpcao(o, faixa){
  var x = {id:o.id, tipoValor:o.tipoValor, valor:numero(o.valor), prazo:numero(o.prazo), prazoUn:numero(o.prazo)===null ? null : o.prazoUn, obs:trim(o.obs)};
  if(faixa){ x.de = numero(o.de); x.ate = numero(o.ate); x.qtdRef = o.tipoValor==="total" ? numero(o.qtdRef) : null; } else x.qtd = numero(o.qtd);
  return x;
}

// rótulos do histórico
var CAMPOS = {fornecedorId:"Fornecedor", nome:"Nome", codigo:"Código", categoriaId:"Categoria", unidade:"Unidade de compra", unidadesPorEmb:"Unidades por embalagem", qtdMinima:"Quantidade mínima", obs:"Observações", modelo:"Modelo da tabela", ativo:"Situação"};
var CAMPOS_OP = {qtd:"Quantidade", de:"Faixa de", ate:"Faixa até", tipoValor:"Tipo de valor", valor:"Valor", qtdRef:"Quantidade de referência", prazo:"Prazo", prazoUn:"Unidade do prazo", obs:"Observações"};
function txtValor(campo, v, ctx){
  if(v===null || v===undefined || v==="") return "—";
  if(campo==="ativo") return v ? "Ativo" : "Arquivado"; if(campo==="unidade") return rotuloDe(UNIDADES_PRECO, v); if(campo==="modelo") return rotuloDe(MODELOS_PRECO, v);
  if(campo==="tipoValor") return rotuloDe(TIPOS_VALOR, v); if(campo==="prazoUn") return rotuloDe(PRAZO_UNIDADES, v); if(campo==="valor") return reaisUnit(v);
  if(campo==="fornecedorId" && ctx && ctx.forn) return ctx.forn(v); if(campo==="categoriaId" && ctx && ctx.cat) return ctx.cat(v);
  if(typeof v==="number") return qtdTxt(v); return String(v);
}
// diferenças entre o produto antes e depois → linhas do histórico ({campo, antes, depois, opcaoId}); o rótulo da opção vai no campo
function diferencas(antes, depois, ctx){
  var out = [], igual = function(x, y){ return (x==null || x==="" ? null : x)===(y==null || y==="" ? null : y); };
  Object.keys(CAMPOS).forEach(function(k){ if(!antes){ return; } if(!igual(antes[k], depois[k])) out.push({campo:CAMPOS[k], antes:txtValor(k, antes[k], ctx), depois:txtValor(k, depois[k], ctx), opcaoId:null}); });
  var rot = function(p, o){ return p.modelo==="faixa" ? "faixa "+qtdTxt(o.de)+(o.ate==null ? " ou mais" : " a "+qtdTxt(o.ate)) : "lote de "+qtdTxt(o.qtd); };
  var velhas = antes ? antes.opcoes||[] : [], novas = depois.opcoes||[];
  novas.forEach(function(o){ var v = velhas.find(function(x){ return x.id===o.id; });
    if(!v){ if(antes) out.push({campo:"Opção de preço incluída ("+rot(depois, o)+")", antes:"—", depois:txtValor("valor", o.valor)+" "+rotuloDe(TIPOS_VALOR, o.tipoValor).toLowerCase(), opcaoId:o.id}); return; }
    Object.keys(CAMPOS_OP).forEach(function(k){ if(!igual(v[k], o[k])) out.push({campo:CAMPOS_OP[k]+" ("+rot(depois, o)+")", antes:txtValor(k, v[k]), depois:txtValor(k, o[k]), opcaoId:o.id}); }); });
  velhas.forEach(function(v){ if(!novas.some(function(o){ return o.id===v.id; })) out.push({campo:"Opção de preço removida ("+rot(antes, v)+")", antes:txtValor("valor", v.valor)+" "+rotuloDe(TIPOS_VALOR, v.tipoValor).toLowerCase(), depois:"—", opcaoId:v.id}); });
  return out;
}

// referências de compras (etapa 3): produto/opção usados em pedido não se apagam
function usoDoProduto(ce, id){ return (ce.pedidos||[]).filter(function(p){ return (p.itens||[]).some(function(i){ return String(i.precoProdutoId)===String(id); }); }).length; }
function usoDaOpcao(ce, id){ return (ce.pedidos||[]).some(function(p){ return (p.itens||[]).some(function(i){ return String(i.precoOpcaoId)===String(id); }); }); }

export { UNIDADES_PRECO, MODELOS_PRECO, TIPOS_VALOR, PRAZO_UNIDADES, rotuloDe, numero, reais, reaisUnit, qtdTxt, unidadeNome, fatorEstoque, calcOpcao, opcoesOrdenadas, validarProduto, normalizarOpcao, diferencas, usoDoProduto, usoDaOpcao };
