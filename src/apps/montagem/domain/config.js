// Sorelly Admin · montagem e bipagem — domain/config.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { kit } from "@/apps/montagem/domain/seed";

var CFG0 = {
  valorNormal:1.80, valorEspecial:2.80,
  limiteEspecial:12000, limiteAtencao:15000, limiteMelhores:12000, limiteEncomendas:4000,
  // Bipadoras: valor por kit bipado, kit maior e desconto por peça faltando apontada pela representante
  valorBipNormal:1.50, valorBipEspecial:2.50, limiteBipEspecial:15000, perdaFalta:10,
  // Peças por kit (caminho 1, tabelado): quantidade de cada categoria conforme o valor do kit. null = ainda não levantado.
  // Trio de argolas e conjunto contam como 1 peça. 1 flanela por kit. Faixas ("2 a 3") viraram número exato.
  // sug:true = kit que não estava na tabela da Sorelly (valor sugerido, a confirmar); a linha de Anéis inteira é sugestão (proporcional ao kit).
  categorias:["Colares ouro","Colares prata","Pulseiras ouro","Pulseiras prata","Conjuntos ouro","Conjuntos prata","Trios de argolas ouro","Trios de argolas prata",
    "Brincos grandes","Brincos (B)","Brincos Select (BB)","Anéis","Peças infantis","Peças masculinas","Tornozeleiras ouro","Tornozeleiras prata","Flanela"],
  pecasSugCat:[11],
  pecasKit:[
    {kit:5000,  q:[5,5,5,5,1,1,1,1,3,15,15,10,3,3,1,1,1]},
    {kit:6000,  q:[6,6,6,6,1,1,1,1,3,15,15,11,3,3,1,1,1]},
    {kit:7000,  q:[7,7,7,7,2,1,1,1,4,15,15,12,3,3,1,1,1]},
    {kit:8000,  q:[8,8,8,8,2,1,2,1,4,18,18,14,4,4,2,1,1]},
    {kit:9000,  q:[9,9,9,9,2,2,2,1,5,21,18,15,4,4,2,1,1], sug:true},
    {kit:10000, q:[10,10,10,10,2,2,2,2,5,24,18,17,4,4,2,1,1]},
    {kit:12000, q:[12,12,12,12,2,2,2,2,6,24,20,20,4,5,2,1,1]},
    {kit:14000, q:[14,14,14,14,3,3,2,2,7,30,22,23,5,5,2,2,1], sug:true},
    {kit:16000, q:[16,16,16,16,3,3,2,2,7,33,24,26,6,6,2,2,1], sug:true},
    {kit:18000, q:[18,18,18,18,3,3,3,3,8,36,27,29,7,7,2,2,1], sug:true},
    {kit:20000, q:[20,20,20,20,4,4,3,3,9,40,30,33,8,8,3,3,1], sug:true},
    {kit:25000, q:[25,25,25,25,5,5,4,4,11,50,36,40,10,10,3,3,1], sug:true}],
  divPct:20, divBloco:5, divPerda:5,
  faixas:[{min:4.5,pct:100},{min:4.0,pct:90},{min:3.5,pct:75},{min:3.0,pct:60},{min:0,pct:40}],
  alertaAmarelo:4.0, alertaVermelho:3.0,
  minKitsRestricao:100, topN:2, minAvalRanking:20,
  diaPagamento:15, kitInicial:7000, minVendaApp:500, reposicaoMax:2500, // sem vendas: kit de R$ 7.000 a confirmar · reposição: valor máximo liberado (provisório, regras a definir)
  // Avaliação da representante (provisório, regras a definir): nota média das 3 perguntas menos descontos. SEM bônus para representante (decisão de 19/10/2026)
  perdaRecusa:0.3, recusasBloqueio:2, perdaDiaParado:0.2, diasParadosTolerancia:1,
  // Pedido da representante: precisa chegar com esta antecedência; depois disso conta como atrasado
  prazoPedidoHoras:48,
  // Duas tabelas de kit: estoque alto (mais peças) e estoque baixo (menos peças). A ativa vale para a sugestão.
  tabelaAtiva:"alto",
  tabelaKit:[{min:5000,kit:20000},{min:4000,kit:17000},{min:2500,kit:15000},{min:1600,kit:12000},
             {min:1000,kit:10000},{min:700,kit:8000},{min:400,kit:6000},{min:0,kit:5000}],
  // Valores provisórios: substituir pela tabela real de estoque baixo da Sorelly
  tabelaKitBaixo:[{min:5000,kit:17000},{min:4000,kit:15000},{min:2500,kit:12000},{min:1600,kit:10000},
             {min:1000,kit:8000},{min:700,kit:7000},{min:400,kit:5000},{min:0,kit:5000}],
  // Calculadora de kits: média acima deste valor → chamar o Marcus
  limiteMarcus:4000,
  // Calculadora de kits: média acima deste valor → obrigatório mandar a análise de vendas (prints) antes de liberar
  limiteAnaliseVendas:2500,
  // Comissão da revendedora e brindes pelo valor vendido (tabela oficial do consignado — ver domain/consignado.js para a versão vigente/versionada)
  comissoesRev:[{min:7000,pct:45,bn:442,bb:282},{min:5000,pct:45,bn:368,bb:232},{min:2500,pct:40,bn:312,bb:188},{min:1600,pct:40,bn:196,bb:144},
    {min:1000,pct:35,bn:118,bb:122},{min:700,pct:30,bn:88,bb:96},{min:500,pct:25,bn:48,bb:68},{min:300,pct:15,bn:0,bb:0}]
};
function tabelaAtual(c){ return c.tabelaAtiva==="baixo" && c.tabelaKitBaixo ? c.tabelaKitBaixo : c.tabelaKit; }
var MOTIVOS = ["Aro fora do pedido","Metal fora da propor\u00e7\u00e3o pedida","Faltou encomenda",
  "Pe\u00e7a que a revendedora n\u00e3o quer","Valor acima do kit","Valor abaixo do kit"];

export { CFG0, tabelaAtual, MOTIVOS };
