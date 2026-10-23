// Sorelly Admin · montagem — domain/mensagens-vender.js
// Modelos de mensagem do app da revendedora ("Mensagens para vender"). EDITÁVEL: o admin pode trocar títulos e textos aqui.
// Variáveis: {cliente} e {revendedora}. Não colocar preço, prazo nem regra nova: só o que já vale na Sorelly (garantia de 1 ano; link de pagamento até 6x sem juros).
var CATEGORIAS_MENSAGEM = ["Apresentar", "Oferecer", "Cobrar", "Pós-venda", "Relacionamento"];
var MENSAGENS_VENDER = [
  {id:"m1", cat:"Apresentar", titulo:"Apresentar o catálogo", texto:"Oi, {cliente}! Aqui é a {revendedora}, da Sorelly Joias. Separei o nosso catálogo com as semijoias do momento. Posso te mandar para você escolher com calma?"},
  {id:"m2", cat:"Apresentar", titulo:"Primeiro contato", texto:"Oi, {cliente}, tudo bem? Sou a {revendedora} e trabalho com semijoias da Sorelly. Quer dar uma olhadinha nas peças? Tenho lindezas que combinam com você."},
  {id:"m3", cat:"Oferecer", titulo:"Peça nova chegou", texto:"{cliente}, chegou peça nova e lembrei de você! Quer que eu te mande a foto para ver de pertinho? Um abraço, {revendedora}."},
  {id:"m4", cat:"Oferecer", titulo:"Opção de pagamento", texto:"Oi, {cliente}! Se ficar melhor para você, posso gerar um link de pagamento da Sorelly em até 6x sem juros. Quer que eu envie?"},
  {id:"m5", cat:"Cobrar", titulo:"Lembrar do pagamento combinado", texto:"Oi, {cliente}, tudo bem? Passando para lembrar com carinho do nosso pagamento combinado. Se precisar de qualquer ajuda para pagar, me chama. Obrigada! {revendedora}"},
  {id:"m6", cat:"Pós-venda", titulo:"Agradecer a compra", texto:"{cliente}, obrigada pela compra! Espero que você ame suas peças. Qualquer dúvida é só chamar. Beijos, {revendedora}."},
  {id:"m7", cat:"Pós-venda", titulo:"Garantia", texto:"Oi, {cliente}! Só para você saber: suas semijoias têm garantia de 1 ano. Se algo não ficar como esperado, me avisa que eu te ajudo. Um beijo, {revendedora}."},
  {id:"m8", cat:"Relacionamento", titulo:"Aniversário", texto:"Parabéns, {cliente}! Que seu dia seja lindo e cheio de brilho. Com carinho, {revendedora}."},
  {id:"m9", cat:"Relacionamento", titulo:"Convite para indicar", texto:"Oi, {cliente}! Conhece alguém que gostaria de revender semijoias da Sorelly? Se tiver uma amiga com esse perfil, me conta que eu indico. Obrigada! {revendedora}"}
];
// troca {cliente} e {revendedora} no texto; sem cliente escolhida, usa um espaço neutro
function preencherMensagem(texto, cliente, revendedora){ return String(texto).replace(/\{cliente\}/g, cliente || "[nome da cliente]").replace(/\{revendedora\}/g, revendedora || ""); }
export { CATEGORIAS_MENSAGEM, MENSAGENS_VENDER, preencherMensagem };
