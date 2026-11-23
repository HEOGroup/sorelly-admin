// Sorelly Admin · montagem — lib/comprovante.js
// Comprovante de pagamento anexado pelo celular (23/11/2026): a foto vira JPEG pequeno (lado maior de 900 px), para caber no pedido de conta e chegar ao Financeiro.
// Antes, no app da representante, foto acima de 400 KB era guardada SEM a imagem. Mesma medida do Atendimento Sorelly (lerComprovante em pages/AtendimentoInternoCalculadora.js).
//   fotoPequena(arq, fim) → chama fim({nome, url}) com a imagem reduzida; se não conseguir abrir, chama fim(null)
function fotoPequena(arq, fim){
  var img = new Image(), url = URL.createObjectURL(arq);
  img.onload = function(){
    var k = Math.min(1, 900/Math.max(img.width, img.height)), c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.width*k)); c.height = Math.max(1, Math.round(img.height*k));
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
    fim({nome:arq.name, url:c.toDataURL("image/jpeg", 0.6)});
  };
  img.onerror = function(){ URL.revokeObjectURL(url); fim(null); };
  img.src = url;
}
export { fotoPequena };
