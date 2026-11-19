// Sorelly Admin · montagem — domain/producao-tipos.js
// TIPO DA PEÇA para somar a produção (Marcus, 17/11/2026: "agrupado: B, CL, A, BBA... BBA e Anel são códigos separados, mas juntos porque é anel também, para saber quanto foi feito de anel, pulseira e colar por dia e por mês").
// O tipo vem da DevMaster, não do começo do código: o GRUPO do produto (aaa_grupo) diz o que a peça é, então A (anel) e BBA (anel select) caem juntos em "Anel".
// Grupos conhecidos (docs/negocio/KIT-PERFEITO.md): 01 anel, 02 brinco, 03 conjunto, 04 colar, 05 infantil, 06 pulseira, 10 masculino, 19 brinco, 34 choker, 38 collection, 45 bracelete.
// Trio de brincos é tipo à parte ("Trio"), porque dá mais trabalho que um brinco comum. Grupo que ainda não tem nome cai na primeira palavra da descrição (TORNOZELEIRA, ARGOLA...).
// Para juntar ou separar tipos, é só mudar a tabela abaixo.
var TIPO_POR_GRUPO = {"01":"Anel", "02":"Brinco", "03":"Conjunto", "04":"Colar", "05":"Infantil", "06":"Pulseira", "10":"Masculino", "19":"Brinco", "34":"Choker", "38":"Collection", "45":"Bracelete"};

var cap = function(t){ t = String(t||"").toLowerCase(); return t ? t.charAt(0).toUpperCase()+t.slice(1) : ""; };

/** Nome do tipo de uma peça, a partir do que a DevMaster devolveu ({descricao, grupo}). Sem dado da DevMaster = "Sem cadastro". */
function tipoDaPeca(dm){
  if(!dm) return "Sem cadastro";
  var desc = String(dm.descricao||"").trim().toUpperCase();
  if(/^TRIO\b/.test(desc)) return "Trio";
  var g = String(dm.grupo||"").trim();
  if(TIPO_POR_GRUPO[g]) return TIPO_POR_GRUPO[g];
  var p = desc.split(/\s+/)[0];
  return p ? cap(p) : "Outros";
}
export { tipoDaPeca, TIPO_POR_GRUPO };
