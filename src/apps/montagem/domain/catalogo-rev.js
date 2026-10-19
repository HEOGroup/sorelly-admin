// Sorelly Admin · montagem — domain/catalogo-rev.js
// Peças do Catálogo do app da revendedora (19/10/2026). Teste com 10 peças; o código e o preço também estão escritos na própria foto.
// As fotos ficam em public/fotos/catalogo/<código>.jpg. Quando o cadastro de peças existir, esta lista passa a vir de lá.
// O TIPO da peça vem das letras do código (mesmas da Produção): A = anel, B = brinco, BB = brinco select, SP = Sorelly Premium...
var CATALOGO_REV = [
  { codigo:"A2080",  preco:96,  estoque:1, foto:"/fotos/catalogo/A2080.jpg" },
  { codigo:"A2072",  preco:96,  estoque:1, foto:"/fotos/catalogo/A2072.jpg" },
  { codigo:"A2051",  preco:88,  estoque:1, foto:"/fotos/catalogo/A2051.jpg" },
  { codigo:"SP0589", preco:188, estoque:1, foto:"/fotos/catalogo/SP0589.jpg" },
  { codigo:"B4732",  preco:144, estoque:1, foto:"/fotos/catalogo/B4732.jpg" },
  { codigo:"B3519",  preco:78,  estoque:1, foto:"/fotos/catalogo/B3519.jpg" },
  { codigo:"B3863",  preco:138, estoque:1, foto:"/fotos/catalogo/B3863.jpg" },
  { codigo:"A2089",  preco:78,  estoque:1, foto:"/fotos/catalogo/A2089.jpg" },
  { codigo:"A2114",  preco:44,  estoque:1, foto:"/fotos/catalogo/A2114.jpg" },
  { codigo:"A2112",  preco:88,  estoque:1, foto:"/fotos/catalogo/A2112.jpg" }
];

// letras do código → tipo (a mais longa que combinar vale: BB é brinco select, não brinco)
var TIPOS_CODIGO = {A:"Anel", AP:"Anel prata 925", AA:"Collection", AX:"Joias Axis", B:"Brinco", BB:"Brinco select", BC:"Brinco collection", BL:"Brinco borboleta", BR:"Brinde", BT:"Bracelete",
  BBC:"Colar select", BBA:"Anel select", BBP:"Pulseira select", BBI:"Infantil select", BCC:"Conjunto select", BBT:"Tornozeleira select", BBRT:"Bracelete select", BBCK:"Choker select",
  CC:"Conjunto", CL:"Colar", CK:"Choker", COL:"Collection", I:"Infantil", P:"Pulseira", T:"Tornozeleira", M:"Masculino", ES:"Religioso", PI:"Pingente", SP:"Sorelly Premium", DUO:"Duo de brincos"};
function tipoDoCodigo(codigo){
  var letras = (String(codigo||"").toUpperCase().match(/^[A-Z]+/) || [""])[0];
  for(var n = letras.length; n>0; n--){ var t = TIPOS_CODIGO[letras.slice(0, n)]; if(t) return t; }
  return "";
}

// Clientes de teste do app (nomes e telefones reais passados pelo Marcus): só no arquivo local gitignored domain/clientes-rev.local.js; sem ele a lista começa vazia.
var CLIENTES_TESTE = (function(){ try { var m = import.meta.glob("./clientes-rev.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : []; } catch(x){ return []; } })();

export { CATALOGO_REV, CLIENTES_TESTE, tipoDoCodigo };
