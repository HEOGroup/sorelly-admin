// Sorelly Admin · montagem — domain/material-grafico.js
// Setor MATERIAL GRÁFICO (17/11/2026, Marcus: "vamos vender material, prazos, fazer kits padrão"). Fase 1: Painel, Compras (funil de orçamento → pedido), Tabela de preços e Estoque.
// Os pedidos, a tabela de preços e o estoque são os de Materiais & Estoque (s.ce); aqui só entram os ORÇAMENTOS (s.ce.orcamentos) e os modelos de mensagem.
// Etapas do funil: Orçamento (mensagem enviada) → Negociando (rodadas de preço e prazo) → Fechado → Pedido feito (vira compra em Materiais & Estoque).
// Fornecedor principal hoje: Office Graff (tags, adesivos, etiquetas, bolsinhas, envelopes, maletas, blocos de trocas).

var ETAPAS = ["ORCAMENTO", "NEGOCIANDO", "FECHADO", "PEDIDO"];
var ROTULO_ETAPA = {ORCAMENTO:"Orçamento", NEGOCIANDO:"Negociando", FECHADO:"Fechado", PEDIDO:"Pedido feito", CANCELADO:"Cancelado"};

// Modelos de orçamento: um por tipo de material. Cada campo vira uma linha da mensagem copiada para o chat.
// ops = lista de opções (campo com menu); sem ops = texto livre.
var MODELOS = [
  {id:"tag", nome:"Tag", campos:[{k:"linha", rot:"Linha", ph:"Ex.: Choker, Colar, Conjunto kids"}, {k:"variacao", rot:"Variação", ph:"Ex.: Coração, Tradicional"}, {k:"tamanho", rot:"Tamanho", ph:"Ex.: 5x3 cm"}, {k:"cor", rot:"Cor", ph:"Ex.: Verde escuro"}]},
  {id:"adesivo", nome:"Adesivo", campos:[{k:"tipo", rot:"Tipo", ops:["70 cm", "60 cm", "BB", "PROMO", "SUPER PROMO", "MEGA PROMO", "EXCLUSIVO", "Kit sem mexer"]}, {k:"detalhe", rot:"Detalhe", ph:"Ex.: 100 cartelas"}]},
  {id:"etiqueta", nome:"Etiqueta", campos:[{k:"tipo", rot:"Tipo", ph:"Ex.: Preço, Código"}, {k:"tamanho", rot:"Tamanho", ph:"Ex.: 3x2 cm"}]},
  {id:"bolsinha", nome:"Bolsinha", campos:[{k:"modelo", rot:"Modelo", ph:"Ex.: Com alça 10x10x3"}, {k:"tema", rot:"Tema ou cor", ph:"Ex.: Natal, Vermelha, Bege"}]},
  {id:"envelope", nome:"Envelope", campos:[{k:"modelo", rot:"Modelo", ph:"Ex.: Kit apoio"}, {k:"cor", rot:"Cor", ph:"Ex.: Preta"}]},
  {id:"maleta", nome:"Maleta", campos:[{k:"modelo", rot:"Modelo", ph:"Ex.: Maleta grande"}, {k:"cor", rot:"Cor", ph:"Ex.: Preta"}]},
  {id:"bloco", nome:"Bloco de trocas", campos:[{k:"modelo", rot:"Modelo", ph:"Ex.: Bloco de trocas 50 folhas"}]},
  {id:"almofadinha", nome:"Almofadinha", campos:[{k:"tamanho", rot:"Tamanho", ph:"Ex.: 135x90"}, {k:"cor", rot:"Cor", ph:"Ex.: Preta"}]},
  {id:"garantia", nome:"Cartão garantia", campos:[{k:"modelo", rot:"Modelo", ph:"Ex.: Padrão"}]},
  {id:"outro", nome:"Outro material", campos:[{k:"descricao", rot:"Descrição", ph:"Descreva o material"}]}
];
var modeloDe = function(id){ return MODELOS.filter(function(m){ return m.id===id; })[0] || null; };

// categorias do estoque que são material gráfico (nome começa assim)
var CATEGORIA_GRAFICA = /^(tag|adesiv|cart[aã]o garantia|embalagen|etiqueta|kit apoio|maleta)/i;
var ehCategoriaGrafica = function(nome){ return CATEGORIA_GRAFICA.test(String(nome || "").trim()); };

var miles = function(n){ return Number(n || 0).toLocaleString("pt-BR"); };
function descricao(o){
  var m = modeloDe(o.modeloId); if(!m) return o.titulo || "Material";
  var partes = m.campos.map(function(c){ return String((o.campos || {})[c.k] || "").trim(); }).filter(Boolean);
  return m.nome+(partes.length ? " — "+partes.join(" · ") : "");
}
// mensagem pronta para colar no chat do fornecedor
function mensagemOrcamento(o, fornecedorNome){
  var linhas = ["Olá"+(fornecedorNome ? ", "+fornecedorNome : "")+"! Preciso de um orçamento:", "", "• "+descricao(o), "Quantidade: "+miles(o.quantidade)+" unidades"];
  if(o.prazoDesejado) linhas.push("Prazo desejado: "+o.prazoDesejado);
  if(o.obs) linhas.push("Observação: "+o.obs);
  linhas.push("", "Pode me passar o valor unitário, o total e o prazo de entrega? Obrigado!");
  return linhas.join("\n");
}
var numero = function(v){ if(v==null || v==="") return null; var n = Number(String(v).replace(/\./g, "").replace(",", ".")); return isFinite(n) ? n : null; };

// Executa a operação sobre ce (já clonado). ctx = {por, agora, proximoId}. Devolve {erro} ou {msg}.
function gfOp(ce, a, ctx){
  ce.orcamentos = ce.orcamentos || [];
  var o = a.id!=null ? ce.orcamentos.filter(function(x){ return String(x.id)===String(a.id); })[0] : null;
  var vazio = function(v){ return v==null || String(v).trim()===""; };
  if(a.op==="orc_add"){
    if(!modeloDe(a.modeloId)) return {erro:"Escolha o tipo de material."};
    var q = numero(a.quantidade); if(!(q>=1) || Math.round(q)!==q) return {erro:"A quantidade precisa ser um número inteiro de 1 em diante."};
    var novo = {id:ctx.proximoId(ce), modeloId:a.modeloId, campos:Object.assign({}, a.campos || {}), quantidade:q, fornecedorId:a.fornecedorId || null, prazoDesejado:String(a.prazoDesejado || "").trim(), obs:String(a.obs || "").trim(),
      etapa:"ORCAMENTO", rodadas:[], final:null, pedidoId:null, criadoEm:ctx.agora, por:ctx.por};
    ce.orcamentos.push(novo); return {msg:"Orçamento #"+novo.id+" criado.", id:novo.id};
  }
  if(!o) return {erro:"Orçamento não encontrado."};
  if(a.op==="orc_rodada"){
    if(["ORCAMENTO", "NEGOCIANDO"].indexOf(o.etapa)<0) return {erro:"Esse orçamento não está mais em negociação."};
    var vu = numero(a.valorUnit); if(!(vu>0)) return {erro:"Informe o valor unitário (maior que zero)."};
    var pz = vazio(a.prazoDias) ? null : numero(a.prazoDias); if(pz!==null && !(pz>=0)) return {erro:"O prazo precisa ser um número de dias."};
    o.rodadas.push({n:o.rodadas.length+1, valorUnit:vu, prazoDias:pz, obs:String(a.obs || "").trim(), quem:String(a.quem || "").trim(), em:ctx.agora, por:ctx.por});
    o.etapa = "NEGOCIANDO"; return {msg:"Rodada "+o.rodadas.length+" registrada."};
  }
  if(a.op==="orc_fechar"){
    if(["ORCAMENTO", "NEGOCIANDO"].indexOf(o.etapa)<0) return {erro:"Esse orçamento já foi fechado ou cancelado."};
    var ult = o.rodadas[o.rodadas.length-1]; var v2 = vazio(a.valorUnit) ? (ult && ult.valorUnit) : numero(a.valorUnit); if(!(v2>0)) return {erro:"Registre uma rodada com o valor antes de fechar."};
    var p2 = vazio(a.prazoDias) ? (ult ? ult.prazoDias : null) : numero(a.prazoDias);
    o.final = {valorUnit:v2, prazoDias:p2, total:Math.round(v2*o.quantidade*100)/100, em:ctx.agora, por:ctx.por}; o.etapa = "FECHADO"; return {msg:"Orçamento fechado."};
  }
  if(a.op==="orc_cancelar"){ if(o.etapa==="PEDIDO") return {erro:"Já virou pedido: cancele a compra em Materiais e estoque."}; o.etapa = "CANCELADO"; return {msg:"Orçamento cancelado."}; }
  if(a.op==="orc_reabrir"){ if(o.etapa!=="CANCELADO" && o.etapa!=="FECHADO") return {erro:"Só dá para reabrir orçamento fechado ou cancelado."}; o.etapa = o.rodadas.length ? "NEGOCIANDO" : "ORCAMENTO"; o.final = null; return {msg:"Orçamento reaberto."}; }
  return {erro:"Ação desconhecida."};
}

export { ETAPAS, ROTULO_ETAPA, MODELOS, modeloDe, ehCategoriaGrafica, descricao, mensagemOrcamento, gfOp, numero, miles };
