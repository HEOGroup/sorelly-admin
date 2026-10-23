// Sorelly Admin — domain/contatos.js
// Telefones e setores da Sorelly (lista passada pelo Marcus em 07/10/2026). É a base do futuro "configurador mãe": quando um telefone ou nome mudar,
// muda aqui (depois, no Configurador) e atualiza em todos os apps. `revendedora:true` = aparece no app da revendedora.
// Reposição NÃO aparece para as revendedoras (só controle geral); o número de encomendas aparece com o nome "Encomendas".
var CONTATOS = [
  {id:"encomendas", nome:"Encomendas", fone:"(41) 99840-2844", para:"Pedir peças específicas depois do primeiro kit", revendedora:true},
  {id:"sac", nome:"SAC", fone:"(41) 98747-6138", para:"Dúvidas e atendimento geral", revendedora:true},
  {id:"indicacao", nome:"Indique e Ganhe", fone:"(41) 99584-5699", para:"Indicar novas revendedoras e acompanhar as indicações", revendedora:true},
  {id:"garantias", nome:"Garantias", fone:"(41) 98900-8085", para:"Pedir e acompanhar a garantia das peças", revendedora:true},
  {id:"cadastro", nome:"Cadastro", fone:"(41) 9875-7352", para:"Alterar seus dados cadastrais", revendedora:true},   // número com 8 dígitos depois do 9: confirmar com o Marcus
  {id:"juridico", nome:"Jurídico", fone:"(41) 9743-0862", para:"", revendedora:false}                                   // interno por enquanto (definir quem vê o quê)
];
var contatosRevendedora = function(){ return CONTATOS.filter(function(c){ return c.revendedora; }); };

export { CONTATOS, contatosRevendedora };
