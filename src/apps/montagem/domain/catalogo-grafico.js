// Sorelly Admin · montagem — domain/catalogo-grafico.js
// CATÁLOGO DO MATERIAL GRÁFICO (17/11/2026, Marcus mandou o zip "Tags e Adesivos Recortados"): 61 modelos com foto, por tipo e grupo.
// As fotos ficam em public/material-grafico/<id>.png. São RECORTES de fotos de um PDF (cerca de 150 px): servem para identificar o modelo, NÃO para imprimir.
// Para acrescentar bolsinhas, maletas, envelopes etc.: copie a foto para a mesma pasta e acrescente uma linha aqui com o tipo novo; a tela cria o grupo sozinha.
var CATALOGO = [
  {"id":"01-coracao-rosa","tipo":"Tags","grupo":"Personalizadas","nome":"Coração — Rosa","w":140,"h":131,"sug":"TAG CORAÇÃO | MINI | ROSA | PADRÃO"},
  {"id":"02-coracao-vinho-bordo","tipo":"Tags","grupo":"Personalizadas","nome":"Coração — Vinho Bordô","w":141,"h":136,"sug":"TAG CORAÇÃO | MINI | VINHO | PADRÃO"},
  {"id":"03-borboleta-aquarela-multicolorida","tipo":"Tags","grupo":"Personalizadas","nome":"Borboleta — Aquarela Multicolorida","w":145,"h":126,"sug":"TAG BORBOLETA | MÉDIA | PADRÃO"},
  {"id":"04-arco-floral-branco-com-flores","tipo":"Tags","grupo":"Personalizadas","nome":"Arco Floral — Branco com Flores","w":148,"h":204,"sug":"TAG FLÓREA"},
  {"id":"05-flor-pink","tipo":"Tags","grupo":"Personalizadas","nome":"Flor — Pink","w":157,"h":159,"sug":"TAG FLOWER (4 MODELOS)"},
  {"id":"06-flor-verde","tipo":"Tags","grupo":"Personalizadas","nome":"Flor — Verde","w":150,"h":159,"sug":"TAG FLOWER (4 MODELOS)"},
  {"id":"07-flor-bege-dourado","tipo":"Tags","grupo":"Personalizadas","nome":"Flor — Bege e dourado","w":147,"h":151,"sug":"TAG FLOWER (4 MODELOS)"},
  {"id":"08-flor-roxo-lilas","tipo":"Tags","grupo":"Personalizadas","nome":"Flor — Roxo e lilás","w":154,"h":157,"sug":"TAG FLOWER (4 MODELOS)"},
  {"id":"09-grande-sorelly","tipo":"Tags","grupo":"Peças douradas","nome":"Grande — Sorelly","w":174,"h":284,"sug":"TAG TRIO | GRANDE | PRETA | PADRÃO"},
  {"id":"10-media-premium-com-arabesco","tipo":"Tags","grupo":"Peças douradas","nome":"Média — Premium Com Arabesco","w":142,"h":240,"sug":"TAG TRIO | MÉDIA | PRETA | PREMIUM"},
  {"id":"11-media-sorelly-joias","tipo":"Tags","grupo":"Peças douradas","nome":"Média — Sorelly Joias","w":142,"h":239,"sug":"TAG TRIO | MÉDIA | PRETA | PADRÃO"},
  {"id":"12-media-premium-modelo-2","tipo":"Tags","grupo":"Peças douradas","nome":"Média — Premium Modelo 2","w":153,"h":240,"sug":"TAG CONJUNTO | MÉDIA | PRETA | PREMIUM"},
  {"id":"13-pequena-modelo-1","tipo":"Tags","grupo":"Peças douradas","nome":"Pequena — Modelo 1","w":99,"h":147,"sug":"TAG TRIO | PEQUENA | PRETA | PADRÃO"},
  {"id":"14-pequena-joias-modelo-2","tipo":"Tags","grupo":"Peças douradas","nome":"Pequena — Joias Modelo 2","w":106,"h":147,"sug":"TAG DUO | PEQUENA | PRETA | PADRÃO"},
  {"id":"15-pequena-joias-modelo-3","tipo":"Tags","grupo":"Peças douradas","nome":"Pequena — Joias Modelo 3","w":101,"h":146,"sug":"TAG ANEL | PEQUENA | PRETA | PADRÃO"},
  {"id":"16-mini-modelo-4","tipo":"Tags","grupo":"Peças douradas","nome":"Mini — Modelo 4","w":107,"h":127,"sug":"TAG MINI | MINI | PRETA | PADRÃO"},
  {"id":"17-grande-sorelly","tipo":"Tags","grupo":"Peças pratas","nome":"Grande — Sorelly","w":164,"h":240,"sug":"TAG TRIO | GRANDE | PRATA | PADRÃO"},
  {"id":"18-media-premium-arabesco","tipo":"Tags","grupo":"Peças pratas","nome":"Média — Premium Arabesco","w":143,"h":239,"sug":"TAG CONJUNTO | MÉDIA | PRATA | PREMIUM"},
  {"id":"19-media-premium-com-furos","tipo":"Tags","grupo":"Peças pratas","nome":"Média — Premium Com Furos","w":160,"h":240,"sug":"TAG TRIO | MÉDIA | PRATA | PREMIUM"},
  {"id":"20-media-sorelly-prata","tipo":"Tags","grupo":"Peças pratas","nome":"Média — Sorelly Prata","w":151,"h":238,"sug":"TAG TRIO | MÉDIA | PRATA | PADRÃO"},
  {"id":"21-pequena-sorelly-prata-modelo-1","tipo":"Tags","grupo":"Peças pratas","nome":"Pequena — Sorelly Prata Modelo 1","w":108,"h":134,"sug":"TAG TRIO | PEQUENA | PRATA | PADRÃO"},
  {"id":"22-pequena-sorelly-prata-modelo-2","tipo":"Tags","grupo":"Peças pratas","nome":"Pequena — Sorelly Prata Modelo 2","w":109,"h":134,"sug":"TAG DUO | PEQUENA | PRATA | PADRÃO"},
  {"id":"23-pequena-sorelly-prata-modelo-3","tipo":"Tags","grupo":"Peças pratas","nome":"Pequena — Sorelly Prata Modelo 3","w":99,"h":136,"sug":"TAG ANEL | PEQUENA | PRATA | PADRÃO"},
  {"id":"24-mini-sorelly-prata","tipo":"Tags","grupo":"Peças pratas","nome":"Mini — Sorelly Prata","w":107,"h":103,"sug":"TAG MINI | MINI | PRATA | PADRÃO"},
  {"id":"25-grande-sorelly-kids","tipo":"Tags","grupo":"Infantis rosa","nome":"Grande — Sorelly Kids","w":262,"h":418},
  {"id":"26-media-sorelly-kids-modelo-1","tipo":"Tags","grupo":"Infantis rosa","nome":"Média — Sorelly Kids Modelo 1","w":170,"h":255,"sug":"TAG CONJUNTO | MÉDIA | KIDS ROSA | PADRÃO"},
  {"id":"27-media-sorelly-kids-modelo-2","tipo":"Tags","grupo":"Infantis rosa","nome":"Média — Sorelly Kids Modelo 2","w":167,"h":254},
  {"id":"28-mini-sorelly-kids","tipo":"Tags","grupo":"Infantis rosa","nome":"Mini — Sorelly Kids","w":163,"h":154,"sug":"TAG MINI | MINI | KIDS ROSA | PADRÃO"},
  {"id":"29-dourado-grande","tipo":"Tags","grupo":"Collection dourado e preto","nome":"Dourado — Grande","w":232,"h":364},
  {"id":"30-preto-grande","tipo":"Tags","grupo":"Collection dourado e preto","nome":"Preto — Grande","w":235,"h":363},
  {"id":"31-dourado-pequena","tipo":"Tags","grupo":"Collection dourado e preto","nome":"Dourado — Pequena","w":155,"h":232,"sug":"TAG TRIO | PEQUENA | DOURADA | COLLECTION"},
  {"id":"32-preto-pequena","tipo":"Tags","grupo":"Collection dourado e preto","nome":"Preto — Pequena","w":152,"h":234,"sug":"TAG TRIO | PEQUENA | PRETA | COLLECTION"},
  {"id":"33-prata-holografico-grande","tipo":"Tags","grupo":"Collection prata holográfico","nome":"Prata Holográfico — Grande","w":190,"h":305},
  {"id":"34-prata-holografico-pequena","tipo":"Tags","grupo":"Collection prata holográfico","nome":"Prata Holográfico — Pequena","w":225,"h":305,"sug":"TAG TRIO | PEQUENA | PRATA | COLLECTION"},
  {"id":"35-man-grande","tipo":"Tags","grupo":"Sorelly Man","nome":"Man — Grande","w":294,"h":506},
  {"id":"36-man-media","tipo":"Tags","grupo":"Sorelly Man","nome":"Man — Média","w":146,"h":212,"sug":"TAG MAN CONJUNTO | MÉDIA | AZUL | PADRÃO"},
  {"id":"37-man-mini","tipo":"Tags","grupo":"Sorelly Man","nome":"Man — Mini","w":155,"h":121,"sug":"TAG MAN | MINI | AZUL | PADRÃO"},
  {"id":"38-tornozeleira-ouro-roxo","tipo":"Tags","grupo":"Por categoria (tornozeleira, colar e pulseira)","nome":"Tornozeleira Ouro — Roxo","w":197,"h":296,"sug":"TAG TORNOZELEIRA OURO | MÉDIA | PADRÃO"},
  {"id":"39-colar-ouro-creme","tipo":"Tags","grupo":"Por categoria (tornozeleira, colar e pulseira)","nome":"Colar Ouro — Creme","w":175,"h":278,"sug":"TAG COLAR OURO | MÉDIA | PADRÃO"},
  {"id":"40-pulseira-ouro-rosa","tipo":"Tags","grupo":"Por categoria (tornozeleira, colar e pulseira)","nome":"Pulseira Ouro — Rosa","w":199,"h":314,"sug":"TAG PULSEIRA OURO | MÉDIA | PADRÃO"},
  {"id":"41-tornozeleira-prata-azul-claro","tipo":"Tags","grupo":"Por categoria (tornozeleira, colar e pulseira)","nome":"Tornozeleira Prata — Azul-claro","w":197,"h":300,"sug":"TAG TORNOZELEIRA PRATA | MÉDIA | PADRÃO"},
  {"id":"42-colar-prata-cinza","tipo":"Tags","grupo":"Por categoria (tornozeleira, colar e pulseira)","nome":"Colar Prata — Cinza","w":176,"h":290,"sug":"TAG COLAR PRATA | MÉDIA | PADRÃO"},
  {"id":"43-pulseira-prata-verde-acinzentado","tipo":"Tags","grupo":"Por categoria (tornozeleira, colar e pulseira)","nome":"Pulseira Prata — Verde-acinzentado","w":199,"h":305,"sug":"TAG PULSEIRA PRATA | MÉDIA | PADRÃO"},
  {"id":"44-conjunto-ouro-terracota","tipo":"Tags","grupo":"Por categoria (conjunto, bracelete e choker)","nome":"Conjunto Ouro — Terracota","w":179,"h":320,"sug":"TAG CONJUNTO | MÉDIA | OURO (TERRACOTA) | PADRÃO"},
  {"id":"45-bracelete-ouro-pink","tipo":"Tags","grupo":"Por categoria (conjunto, bracelete e choker)","nome":"Bracelete Ouro — Pink","w":186,"h":317,"sug":"TAG BRACELETE | MÉDIA | OURO (PINK) | PADRÃO"},
  {"id":"46-choker-ouro-verde-escuro","tipo":"Tags","grupo":"Por categoria (conjunto, bracelete e choker)","nome":"Choker Ouro — Verde-escuro","w":199,"h":321,"sug":"TAG CHOKER | MÉDIA | OURO (VERDE ESCURO) | PADRÃO"},
  {"id":"47-conjunto-prata-verde-menta","tipo":"Tags","grupo":"Por categoria (conjunto, bracelete e choker)","nome":"Conjunto Prata — Verde-menta","w":181,"h":318,"sug":"TAG CONJUNTO | MÉDIA | PRATA (VERDE) | PADRÃO"},
  {"id":"48-bracelete-prata-lilas","tipo":"Tags","grupo":"Por categoria (conjunto, bracelete e choker)","nome":"Bracelete Prata — Lilás","w":201,"h":318,"sug":"TAG BRACELETE | MÉDIA | PRATA (LILÁS) | PADRÃO"},
  {"id":"49-sorelly-bb-select-grande","tipo":"Tags","grupo":"Sorelly BB Select","nome":"Sorelly BB Select — Grande","w":367,"h":619},
  {"id":"50-sorelly-bb-select-media","tipo":"Tags","grupo":"Sorelly BB Select","nome":"Sorelly BB Select — Média","w":202,"h":294,"sug":"TAG CONJUNTO | MÉDIA | BB SELECT | PADRÃO"},
  {"id":"51-sorelly-bb-select-mini","tipo":"Tags","grupo":"Sorelly BB Select","nome":"Sorelly BB Select — Mini","w":243,"h":208,"sug":"TAG MINI | MINI | BB SELECT | PADRÃO"},
  {"id":"52-sorelly-baby-retangular-aquarela","tipo":"Tags","grupo":"Baby e Kids masculino","nome":"Sorelly Baby — Retangular Aquarela","w":384,"h":614,"sug":"TAG RETANGULAR | MÉDIA | SORELLY BABY | PADRÃO"},
  {"id":"53-sorelly-kids-masculino-azul","tipo":"Tags","grupo":"Baby e Kids masculino","nome":"Sorelly Kids Masculino — Azul","w":250,"h":364},
  {"id":"54-sorelly-baby-borboleta-aquarela","tipo":"Tags","grupo":"Baby e Kids masculino","nome":"Sorelly Baby — Borboleta Aquarela","w":252,"h":237,"sug":"TAG BORBOLETA | PEQUENA | SORELLY BABY | PADRÃO"},
  {"id":"55-70cm-dourado","tipo":"Adesivos","grupo":"Adesivos","nome":"70cm — Dourado","w":167,"h":166},
  {"id":"56-60cm-dourado","tipo":"Adesivos","grupo":"Adesivos","nome":"60cm — Dourado","w":161,"h":167,"sug":"ADESIVO | 60 CM | PADRÃO"},
  {"id":"57-bb-prata","tipo":"Adesivos","grupo":"Adesivos","nome":"BB — Prata","w":162,"h":168},
  {"id":"58-promo-vermelho","tipo":"Adesivos","grupo":"Adesivos","nome":"PROMO — Vermelho","w":172,"h":171,"sug":"ADESIVO PROMO | VERMELHO"},
  {"id":"59-super-promo-dourado","tipo":"Adesivos","grupo":"Adesivos","nome":"SUPER PROMO — Dourado","w":174,"h":174},
  {"id":"60-exclusivo-dourado","tipo":"Adesivos","grupo":"Adesivos","nome":"EXCLUSIVO — Dourado","w":173,"h":175},
  {"id":"61-mega-promo-dourado","tipo":"Adesivos","grupo":"Adesivos","nome":"MEGA PROMO — Dourado","w":174,"h":174,"sug":"ADESIVO MEGA PROMO"},
  {"id":"62-bolsinha-almofada-preta","tipo":"Bolsinhas","grupo":"Almofada com alça","nome":"Almofada com alça — Preta","w":1600,"h":1452,"ext":"jpeg","extra":["62-bolsinha-almofada-preta-lado"],"sug":"BOLSINHA ALMOFADA 1 ALÇA | PADRÃO | PRETA | PADRÃO"},
  {"id":"63-bolsinha-almofada-natal-creme","tipo":"Bolsinhas","grupo":"Almofada com alça","nome":"Almofada com alça — Natal creme","w":1600,"h":1232,"ext":"jpeg","extra":["63-bolsinha-almofada-natal-creme-lado","63-bolsinha-almofada-natal-creme-medidas"],"medidas":"Comprimento 13,4 cm · altura da frente 9 cm · painel de trás 8,9 cm · abas curvas 2,3 cm","novo":true,"painel":{"titulo":"BOLSINHA ALMOFADA 1 ALÇA | PEQUENA | CREME | NATAL","forn":"A definir","dados":[{"r":"Comprimento","v":"13,4 cm"},{"r":"Altura","v":"9 cm"},{"r":"Painel de trás","v":"8,9 cm"}]}},
  {"id":"64-bolsinha-almofada-natal-vermelha","tipo":"Bolsinhas","grupo":"Almofada com alça","nome":"Almofada com alça — Natal vermelha","w":1600,"h":1485,"ext":"jpeg","extra":["64-bolsinha-almofada-natal-vermelha-lado","64-bolsinha-almofada-natal-vermelha-medidas"],"medidas":"Comprimento 13,4 cm · altura da frente 9 cm · painel de trás 8,9 cm · abas curvas 3,3 cm","novo":true,"painel":{"titulo":"BOLSINHA ALMOFADA 1 ALÇA | PEQUENA | VERMELHA | NATAL","forn":"A definir","dados":[{"r":"Comprimento","v":"13,4 cm"},{"r":"Altura","v":"9 cm"},{"r":"Painel de trás","v":"8,9 cm"}]}},
  {"id":"65-sacolinha-aba-dourada","tipo":"Sacolas","grupo":"Bolsinha com Hot","nome":"Bolsinha com Hot — Dourada","w":1522,"h":1600,"ext":"jpeg","extra":["65-sacolinha-aba-dourada-lado"],"sug":"BOLSINHA COM HOT 1 ALÇA | PADRÃO | DOURADA | COLLECTION"},
  {"id":"66-sacolinha-aba-preta","tipo":"Sacolas","grupo":"Bolsinha com Hot","nome":"Bolsinha com Hot — Preta","w":1432,"h":1600,"ext":"jpeg","extra":["66-sacolinha-aba-preta-lado"],"sug":"BOLSINHA COM HOT 1 ALÇA | PADRÃO | PRETA | PADRÃO"},
  {"id":"67-sacolinha-aba-prata","tipo":"Sacolas","grupo":"Bolsinha com Hot","nome":"Bolsinha com Hot — Prata","w":1600,"h":1502,"ext":"jpeg","extra":["67-sacolinha-aba-prata-lado"],"sug":"BOLSINHA COM HOT 1 ALÇA | PADRÃO | PRATA | COLLECTION"},
  {"id":"68-envelope-kit-apoio-preto","tipo":"Envelopes","grupo":"Envelope kit apoio","nome":"Envelope kit apoio — Preto","w":1426,"h":1600,"ext":"jpeg","sug":"ENVELOPE KIT APOIO | PADRÃO | PRETA | PADRÃO"}
];
var foto = function(m){ return "/material-grafico/"+m.id+"."+(m.ext || "png"); };
// fotos extras do modelo (ex.: a foto de lado), na mesma pasta e com a mesma extensão
var fotosExtras = function(m){ return (m.extra || []).map(function(x){ return "/material-grafico/"+x+"."+(m.ext || "png"); }); };
function tiposDoCatalogo(){ var t = []; CATALOGO.forEach(function(m){ if(t.indexOf(m.tipo)<0) t.push(m.tipo); }); return t; }
// grupos na ordem em que aparecem, já com os modelos dentro; tipo vazio = todos
function gruposDoCatalogo(tipo){
  var g = [];
  CATALOGO.filter(function(m){ return !tipo || m.tipo===tipo; }).forEach(function(m){
    var x = g.filter(function(k){ return k.tipo===m.tipo && k.grupo===m.grupo; })[0];
    if(!x){ x = {tipo:m.tipo, grupo:m.grupo, itens:[]}; g.push(x); }
    x.itens.push(m);
  });
  return g;
}
// Ligação com o ESTOQUE (17/11/2026): cada modelo aponta para um material de Materiais e estoque. "sug" é o material sugerido pelo nome;
// a escolha da equipe (ce.catalogoLig, id do modelo -> id do material, "" = sem material) vale mais que a sugestão.
var CACHE_NM = {}, N_NM = 0;   // 18/11/2026: a tela do Painel levava 2 s para desenhar porque o nm era refeito milhões de vezes; agora cada texto é normalizado uma vez só
var nm = function(t){
  var k = String(t || ""), c = CACHE_NM[k]; if(c!==undefined) return c;
  if(N_NM>30000){ CACHE_NM = {}; N_NM = 0; }
  c = k.normalize("NFD").replace(new RegExp("[" + String.fromCharCode(768) + "-" + String.fromCharCode(879) + "]", "g"), "").toUpperCase().split(" ").filter(Boolean).join(" ");
  CACHE_NM[k] = c; N_NM++; return c;
};
function materialDoModelo(ce, m){
  var mats = ce.materiais || [], lig = (ce.catalogoLig || {})[m.id];
  if(lig!=null) return lig==="" ? null : (mats.filter(function(x){ return String(x.id)===String(lig); })[0] || null);
  var alvo = m.sug ? nm(m.sug) : "";
  return alvo ? (mats.filter(function(x){ return nm(x.material)===alvo; })[0] || null) : null;
}
// Preço do material na Tabela de preços (ce.precos): casa pelo id do material ou pelo mesmo nome. Devolve {codigo, opcoes, menor} ou null.
function precoDoMaterial(ce, mat){
  if(!mat) return null;
  var alvo = nm(mat.material), p = (ce.precos || []).filter(function(x){ return x.ativo!==false && (String(x.materialId)===String(mat.id) || nm(x.nome)===alvo); })[0];
  if(!p) return null;
  var un = (p.opcoes || []).filter(function(o){ return o.tipoValor==="unitario" && o.valor!=null; }).map(function(o){ return o.valor; });
  return {fornecedorId:p.fornecedorId || null, codigo:p.codigo || "", opcoes:p.opcoes || [], obs:p.obs || "", menor:un.length ? Math.min.apply(null, un) : null};
}
// PRODUÇÃO do material: pedidos de Materiais e estoque que ainda não terminaram (não entregues, negados nem cancelados) com item deste material.
// O item casa pelo id do material ou pelo nome (nome igual, ou, com 2 partes ou mais separadas por "|", todas as partes dentro do nome do material).
var FINAIS_PED = ["ENTREGUE", "NEGADA", "CANCELADA"];
function itemDoMaterial(i, mat, alvo){
  if(i.materialId!=null && String(i.materialId)===String(mat.id)) return true;
  var t = nm(i.titulo); if(!t) return false; if(t===alvo) return true;
  var partes = t.split("|").map(function(x){ return x.trim(); }).filter(Boolean);
  return partes.length>=2 && partes.every(function(x){ return alvo.indexOf(x)>=0; });
}
// Em produção = pedido já aprovado (liberado, em trânsito ou recebido, ainda não entregue); Solicitado = o resto que está aberto (pedido ainda sem aprovação ou sem orçamento).
var EM_PRODUCAO = ["LIBERADA", "EM_TRANSITO", "RECEBIDA"];
function producaoDoMaterial(ce, mat){
  if(!mat) return null;
  var alvo = nm(mat.material), r = {qtd:0, solicitado:0, previsao:"", status:"", pedidos:[]};
  (ce.pedidos || []).forEach(function(p){
    if(FINAIS_PED.indexOf(p.status)>=0) return;
    var q = 0; (p.itens || []).forEach(function(i){ if(itemDoMaterial(i, mat, alvo)) q += Number(i.quantidade) || 0; });
    if(!q) return; r.pedidos.push(p.id);
    if(EM_PRODUCAO.indexOf(p.status)>=0){ r.qtd += q; if(p.previsaoEntrega && (!r.previsao || p.previsaoEntrega<r.previsao)){ r.previsao = p.previsaoEntrega; r.status = p.status; } else if(!r.status) r.status = p.status; }
    else { r.solicitado += q; if(!r.status && !r.qtd) r.status = p.status; if(!r.qtd && p.previsaoEntrega && (!r.previsao || p.previsaoEntrega<r.previsao)) r.previsao = p.previsaoEntrega; }
  });
  return r;
}
// FOTO de um material, pedido ou orçamento (para o Painel e outras telas): usa o modelo do Catálogo ligado ao material.
// FOTO DE REFERÊNCIA (Marcus, 18/11/2026: "o que faltar você pode preencher"): o PDF "Tags e Adesivos" mostra só uma foto por modelo de tag e diz os tamanhos e as cores de cada linha.
// Material que não tem foto própria usa a foto do modelo parecido (mesma tag em outro tamanho, mesma forma em outra cor). Fica marcado como referência.
var REF_FOTO = {
  
  "TAG CORAÇÃO | MINI | VERMELHA | PADRÃO":"02-coracao-vinho-bordo", "TAG CORAÇÃO VERMELHO":"02-coracao-vinho-bordo",
  
  "TAG BORBOLETA | PEQUENA | ROSA | PADRÃO":"03-borboleta-aquarela-multicolorida",
  "TAG TRIO | PEQUENA | BB SELECT | PADRÃO":"51-sorelly-bb-select-mini", "TAG TRIO | PEQUENA | ROSA | PADRÃO":"28-mini-sorelly-kids", "TAG DUO | PEQUENA | KIDS ROSA | PADRÃO":"28-mini-sorelly-kids",
  "TAG CONJUNTO | MÉDIA | PRETA | PADRÃO":"11-media-sorelly-joias", "TAG CONJUNTO | MÉDIA | PRATA | PADRÃO":"20-media-sorelly-prata",
  "TAG CONJUNTO | MÉDIA | PRETA | COLLECTION":"30-preto-grande", "TAG CONJUNTO | MÉDIA | DOURADA | COLLECTION":"29-dourado-grande", "TAG CONJUNTO | MÉDIA | PRATA | COLLECTION":"33-prata-holografico-grande",
  "TAG PULSEIRA OURO | MÉDIA | OURO (PINK) | PADRÃO":"40-pulseira-ouro-rosa", "TAG PULSEIRA OURO | MÉDIA | OURO (PINK) | HOT":"40-pulseira-ouro-rosa",
  "TAG PRATA (MÉDIA)":"20-media-sorelly-prata", "TAG TRIO MASCULINO-AZUL":"37-man-mini", "TAG CONJUNTO MASCULINO":"36-man-media", "TAG FLORÉA CONJUNTO":"04-arco-floral-branco-com-flores",
  "TAG MAN MINI COM HOT | MINI | AZUL | PREMIUM":"37-man-mini", "TAG MAN CONJUNTO COM HOT | MÉDIA | AZUL | PREMIUM":"36-man-media",
 
};
var REF_NM = null;
function itemRef(mat){
  if(!REF_NM){ REF_NM = {}; Object.keys(REF_FOTO).forEach(function(k){ REF_NM[nm(k)] = REF_FOTO[k]; }); }
  var id = REF_NM[nm(mat.material)]; if(!id) return null;
  return CATALOGO.filter(function(x){ return x.id===id || x.id.indexOf(id)===0; })[0] || null;
}
// material do estoque -> modelo do Catálogo ligado a ele (calculado uma vez por versão do estoque; o estado do estoque é copiado a cada ação, então a chave é o próprio objeto)
var CACHE_LIG = new WeakMap();
function ligacoes(ce){
  var c = CACHE_LIG.get(ce); if(c) return c;
  c = {}; CATALOGO.forEach(function(x){ var b = materialDoModelo(ce, x); if(b && c[String(b.id)]===undefined) c[String(b.id)] = x; });
  CACHE_LIG.set(ce, c); return c;
}
function fotoDoMaterial(ce, mat){
  if(!mat) return "";
  var m = ligacoes(ce)[String(mat.id)];
  if(m) return foto(m);
  var r = itemRef(mat); return r ? foto(r) : "";
}
// true quando a foto do material é só de referência (modelo parecido)
function fotoEhReferencia(ce, mat){
  if(!mat) return false;
  return ligacoes(ce)[String(mat.id)]===undefined && !!itemRef(mat);
}
function fotoDoTitulo(ce, titulo, materialId){
  var mats = ce.materiais || [], mat = materialId!=null ? mats.filter(function(x){ return String(x.id)===String(materialId); })[0] : null;
  if(!mat && titulo){ mat = mats.filter(function(x){ return itemDoMaterial({titulo:titulo}, x, nm(x.material)); })[0] || null; }
  if(!mat && titulo){ var rr = itemRef({material:titulo}); if(rr) return foto(rr); }   // pedido sem material ligado, mas com nome conhecido
  return fotoDoMaterial(ce, mat);
}
function fotoDoPedido(ce, p){
  if((p.itens || []).length>1) return "";
  var f = ""; (p.itens || []).forEach(function(i){ if(!f) f = fotoDoTitulo(ce, i.titulo, i.materialId); });
  return f || fotoDoTitulo(ce, p.titulo, null);
}
function fotoDoOrcamento(o){
  if(o.campos && o.campos.fotoId){ var fx = CATALOGO.filter(function(x){ return x.id===o.campos.fotoId; })[0]; if(fx) return foto(fx); }
  var chave = nm((o.campos && (o.campos.linha || o.campos.tipo || o.campos.modelo)) || ""); if(!chave) return "";
  var m = CATALOGO.filter(function(x){ return nm(x.nome).indexOf(chave)>=0; })[0];
  return m ? foto(m) : "";
}
// MATERIAL do estoque ligado a um pedido (pelo item) ou a um orçamento (pelo modelo do Catálogo com o mesmo nome da linha).
function materialDoPedido(ce, p){
  if((p.itens || []).length>1) return null;
  var mats = ce.materiais || [], achado = null;
  (p.itens || []).forEach(function(i){ if(achado) return;
    achado = (i.materialId!=null ? mats.filter(function(x){ return String(x.id)===String(i.materialId); })[0] : null) || mats.filter(function(x){ return itemDoMaterial(i, x, nm(x.material)); })[0] || null; });
  return achado || mats.filter(function(x){ return itemDoMaterial({titulo:p.titulo}, x, nm(x.material)); })[0] || null;
}
function materialDoOrcamento(ce, o){
  var chave = nm((o.campos && (o.campos.linha || o.campos.tipo || o.campos.modelo)) || ""); if(!chave) return null;
  var m = CATALOGO.filter(function(x){ return nm(x.nome).indexOf(chave)>=0 && materialDoModelo(ce, x); })[0];
  return m ? materialDoModelo(ce, m) : null;
}
// TIPO do material gráfico para o filtro do Painel (Tags, Bolsinhas, Sacolas, Maletas, Caixas de presente...): vem do nome do material e da categoria do estoque.
var ORDEM_TIPOS = ["Tags", "Embalagens de presente", "Maletas", "Embalagens plásticas", "Etiquetas", "Cartões e blocos", "Adesivos e cordinhas", "Outros"];
function tipoDoMaterial(mat, catNome){
  var n = nm(mat.material), k = nm(catNome);
  if(n.indexOf("BOLSINHA")>=0) return "Embalagens de presente";
  if(n.indexOf("SACOLA")>=0) return "Embalagens de presente";
  if(n.indexOf("ENVELOPE")>=0) return "Embalagens de presente";
  if(n.indexOf("CAIXA")>=0 && n.indexOf("PRESENTE")>=0) return "Embalagens de presente";
  if(k.indexOf("MALETA")===0) return "Maletas";
  if(n.indexOf("PLASTICO")>=0) return "Embalagens plásticas";
  if(k.indexOf("ETIQUETA")===0) return "Etiquetas";
  if(k.indexOf("CARTAO")===0 || n.indexOf("BLOCO")>=0) return "Cartões e blocos";
  if(k.indexOf("ADESIV")===0) return "Adesivos e cordinhas";
  if(n.indexOf("TAG")===0 || k.indexOf("TAG")===0) return "Tags";
  return "Outros";
}
// material do estoque de UM item de pedido (pelo id ou pelo nome), para o kanban do Painel
function materialDoItem(ce, i){
  var mats = ce.materiais || [];
  return (i.materialId!=null ? mats.filter(function(x){ return String(x.id)===String(i.materialId); })[0] : null) || mats.filter(function(x){ return itemDoMaterial(i, x, nm(x.material)); })[0] || null;
}
// NOME PADRONIZADO em duas linhas (Marcus, 18/11/2026): "TAG MAN MINI | MINI | AZUL | PADRÃO" -> ["Tag Man / Mini", "Azul / Padrão"].
// 1ª linha = o item e o tamanho; 2ª linha = a cor e a linha. A palavra do tamanho repetida no fim do nome sai ("TAG MAN MINI" + "MINI" = "Tag Man").
function maiuscula(t){
  return String(t).toLowerCase().split(" ").filter(Boolean).map(function(w){ var i = w.charAt(0)==="(" ? 1 : 0; return w.slice(0, i)+w.charAt(i).toUpperCase()+w.slice(i+1); }).join(" ");
}
function nomePadrao(titulo){
  var partes = String(titulo || "").split("|").map(function(x){ return x.trim(); }).filter(Boolean);
  if(partes.length<=1) return [maiuscula(partes[0] || ""), ""];
  var base = partes[0], tam = partes[1], palavras = base.split(" ");
  if(palavras.length>1 && nm(palavras[palavras.length-1])===nm(tam)) base = palavras.slice(0, -1).join(" ");
  return [maiuscula(base)+" / "+maiuscula(tam), partes.slice(2).map(maiuscula).join(" / ")];
}
// NOVOS MATERIAIS (Marcus, 18/11/2026): produtos novos que ainda não têm material no estoque nem pedido no sistema. Aparecem no Painel, na coluna Novos materiais.
// Quando o pedido for lançado, tirar o "novo":true do modelo acima.
function novosMateriais(orcamentos){ return CATALOGO.filter(function(m){ return m.novo && m.painel && !(orcamentos || []).some(function(o){ return o.etapa!=="CANCELADO" && o.campos && o.campos.fotoId===m.id; }); }); }
// TAMANHO, COR e LINHA do nome padronizado ("TAG MAN | MINI | AZUL | PADRÃO"), para os filtros do Painel.
var TAMANHOS = ["MINI", "PEQUENA", "MÉDIA", "GRANDE"], LINHAS = ["PADRÃO", "PREMIUM", "COLLECTION", "HOT", "BB SELECT", "KIDS", "SORELLY BABY", "NATAL"];
function atributosDoNome(titulo){
  var p = String(titulo || "").split("|").map(function(x){ return x.trim().toUpperCase(); }).filter(Boolean), r = {tamanho:"", cor:"", linha:""};
  if(p.length<2) return r;
  if(TAMANHOS.indexOf(p[1])>=0) r.tamanho = maiuscula(p[1]);
  var resto = p.slice(2); if(!resto.length) return r;
  var ult = resto[resto.length-1]; if(LINHAS.indexOf(ult)>=0){ r.linha = maiuscula(ult); resto = resto.slice(0, -1); }
  if(resto.length) r.cor = maiuscula(resto.join(" / "));
  return r;
}
// MODELO do material para o filtro do Painel: o nome sem a palavra do item (TAG, BOLSINHA...) e sem o tamanho repetido.
// "TAG MAN MINI | MINI | AZUL | PADRÃO" -> "Man"; "TAG TRIO | PEQUENA | PRETA | PADRÃO" -> "Trio"; "BOLSINHA ALMOFADA 1 ALÇA | ..." -> "Almofada 1 Alça".
var ITENS_NOME = ["TAG", "BOLSINHA", "SACOLA", "ENVELOPE", "MALETA", "ETIQUETA", "ADESIVO"];
function modeloDoNome(titulo){
  var p = String(titulo || "").split("|").map(function(x){ return x.trim(); }).filter(Boolean), w = (p[0] || "").toUpperCase().split(" ").filter(Boolean), tag = w[0]==="TAG";
  if(p.length>1 && w.length>1 && nm(w[w.length-1])===nm(p[1])){ var ult = w.pop(); if(w.length===1 && ITENS_NOME.indexOf(w[0])>=0) w.push(ult); }   // "TAG MAN MINI | MINI" -> Man; "TAG MINI | MINI" continua Mini
  if(w.length>1 && ITENS_NOME.indexOf(w[0])>=0) w.shift();
  while(w.length>2 && w[w.length-2]==="COM" && w[w.length-1]==="HOT") w.length = w.length-2;   // o Hot é acabamento, não modelo
  if(tag && w.length>1 && (w[w.length-1]==="OURO" || w[w.length-1]==="PRATA")) w.pop();   // Tornozeleira Ouro / Prata = modelo Tornozeleira
  var m = maiuscula(w.join(" "));
  return m==="Prata (Média)" ? "Trio" : m==="Flórea" ? "Floréa Conjunto" : m;   // a "tag prata (média)" é a Trio (resposta da Rayssa, 18/11/2026)
}
export { modeloDoNome, atributosDoNome, novosMateriais, fotoEhReferencia, nomePadrao, materialDoItem, tipoDoMaterial, ORDEM_TIPOS, materialDoPedido, materialDoOrcamento, fotoDoMaterial, fotoDoPedido, fotoDoOrcamento, fotosExtras, producaoDoMaterial, precoDoMaterial, materialDoModelo, nm, CATALOGO, foto, tiposDoCatalogo, gruposDoCatalogo };
