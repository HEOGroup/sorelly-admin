// Sorelly Admin · montagem — domain/falta-comprar.js (17/11/2026, pedido do Marcus)
// Cadastro de peças › Pedidos › Peças: quadro com UM CARTÃO POR CATEGORIA em cada etapa da vida da peça
//   Falta comprar → Comprado → No banho → Na empresa → Estoque.
// Sem importações: o MESMO arquivo é lido pela tela e pelo servidor (src/server/reposicao.js, que lê a DevMaster, só leitura).
// Conta (aprovada pelo Marcus em 17/11/2026): saída do mês-base (outubro/2026, TODOS os tipos de saída: venda, brinde, troca, indicação, premiação) × o crescimento que cada categoria teve
// no ano passado (out/2025 → nov/2025, dez/2025, jan/2026, só vendas, lidas na DevMaster); desconta o que já saiu no mês corrente, o estoque principal (almoxarifado 01) e o que está vindo (pedidos não finalizados).
// A falta é calculada MODELO A MODELO (estoque parado em um modelo não cobre a falta de outro) e depois desconta o que está vindo, que só se sabe por categoria.

var MES_BASE = "2026-10";
var MESES_PLANO = [["nov", "2026-11", "Novembro"], ["dez", "2026-12", "Dezembro"], ["jan", "2027-01", "Janeiro"]];   // o plano acaba em janeiro/2027; depois disso escolher outra base

// categorias do quadro, na ordem pedida pelo Marcus (brincos, pulseiras, anéis, tornozeleiras, masculino e as outras)
var CATS_REP = [["brincos", "Brincos"], ["pulseiras", "Pulseiras"], ["aneis", "Anéis"], ["tornozeleiras", "Tornozeleiras"], ["masculino", "Masculino"], ["colares", "Colares"], ["chokers", "Chokers"],
  ["conjuntos", "Conjuntos"], ["infantil", "Infantil"], ["pingentes", "Pingentes"], ["religiosos", "Religiosos"], ["premium", "Premium e Collection"]];

// grupo de produto da DevMaster (dmaad) → categoria. Os grupos "Select" entram junto da categoria normal. Grupo fora da lista (material, expositor, porta-joias, brinde...) não entra.
var GRUPO_CAT = {"02":"brincos", "19":"brincos", "40":"brincos", "28":"brincos", "30":"brincos", "66":"brincos",
  "06":"pulseiras", "43":"pulseiras", "PUUM":"pulseiras", "45":"pulseiras", "63":"pulseiras",
  "01":"aneis", "15":"aneis", "42":"aneis", "04":"colares", "41":"colares", "34":"chokers", "64":"chokers",
  "03":"conjuntos", "61":"conjuntos", "05":"infantil", "60":"infantil", "07":"tornozeleiras", "62":"tornozeleiras",
  "10":"masculino", "13":"pingentes", "11":"religiosos", "16":"premium", "38":"premium", "BD":"premium"};

// categorias do pedido de bruto (CATS de cadastro-pecas.js) → categoria do quadro. Trios entram em Brincos e Venezianas em Colares (a confirmar com o Marcus); o resto não entra.
var CAT_PEDIDO = {aneis:"aneis", brincos:"brincos", trios:"brincos", colares:"colares", chokers:"chokers", pulseiras:"pulseiras", masculino:"masculino", pingentes:"pingentes", tornozeleiras:"tornozeleiras",
  infantil:"infantil", conjuntos:"conjuntos", venezianas:"colares"};

// crescimento de cada categoria contra OUTUBRO/2025, em peças vendidas (S001 e S501 da DevMaster): nov/2025, dez/2025 e jan/2026. Calculado em 17/11/2026.
var FATORES_PADRAO = {brincos:{nov:1.060, dez:1.202, jan:0.887}, pulseiras:{nov:1.105, dez:1.261, jan:1.183}, aneis:{nov:1.224, dez:1.140, jan:1.054}, tornozeleiras:{nov:1.214, dez:1.634, jan:1.592},
  masculino:{nov:1.256, dez:1.533, jan:1.813}, colares:{nov:1.138, dez:1.437, jan:1.291}, chokers:{nov:1.203, dez:1.371, jan:1.073}, conjuntos:{nov:0.933, dez:0.907, jan:1.118},
  infantil:{nov:1.038, dez:1.061, jan:1.002}, pingentes:{nov:0.880, dez:0.739, jan:0.370}, religiosos:{nov:1.128, dez:2.000, jan:2.205}, premium:{nov:0.909, dez:0.923, jan:1.035}};

// colunas do quadro e a cor de cada uma
var COLUNAS_REP = [["falta", "Falta comprar", "#EF4444"], ["comprado", "Comprado", "#5B8DEF"], ["banho", "No banho", "#A78BFA"], ["empresa", "Na empresa", "#2DD4BF"], ["estoque", "Estoque", "#4ADE80"]];

// etapa do pedido (ETAPAS_PED de cadastro-pecas.js) → coluna. Escolha das peças ainda não é compra; Finalizado já está no estoque da DevMaster.
function colunaDaEtapa(k){
  if(k==="separacao" || k==="fechado" || k==="enviado") return "comprado";
  if(k==="nobanho" || k==="fotos" || k==="precos" || k==="banho" || k==="paraSorelly") return "banho";
  if(k==="chegou" || k==="cadastrando") return "empresa";
  return null;
}

// monta o quadro. rep = c.reposicao (lido pelo servidor), pedidos = c.pedidos, etapaDe = função etapaPed, h = "nov" | "dez" | "jan" (até quando precisa).
// Devolve {atualizadoEm, ate, linhas:[{k, nome, falta:{pecas, modelos}, precisa, comprado:{q, forn:{}}, banho, empresa, estoque:{q, vivo, parado}, saida, cobre}]}
function montarRep(rep, pedidos, etapaDe, h){
  var por = {}; CATS_REP.forEach(function(c){ por[c[0]] = {k:c[0], nome:c[1], comprado:{q:0, forn:{}}, banho:{q:0, forn:{}}, empresa:{q:0, forn:{}}}; });
  (pedidos||[]).forEach(function(p){
    var col = colunaDaEtapa(etapaDe(p)); if(!col) return;
    Object.keys(p.cats||{}).forEach(function(k){
      var cat = CAT_PEDIDO[k], q = Math.round(Number(p.cats[k])||0); if(!cat || !por[cat] || q<=0) return;
      var o = por[cat][col]; o.q += q; var f = p.forn || "—"; o.forn[f] = (o.forn[f]||0) + q;
    });
  });
  var cats = (rep && rep.cats) || {};
  var linhas = CATS_REP.map(function(c){
    var l = por[c[0]], d = cats[c[0]] || {}, vindo = l.comprado.q + l.banho.q + l.empresa.q, fm = (d.faltaMod && d.faltaMod[h]) || {pecas:0, modelos:0};
    l.precisa = Math.round((d.precisa && d.precisa[h]) || 0);
    l.falta = {pecas:Math.max(0, Math.round(fm.pecas||0) - vindo), modelos:fm.modelos||0, bruta:Math.round(fm.pecas||0), vindo:vindo};
    l.estoque = {q:Math.round(d.estoque||0), vivo:Math.round(d.vivo||0), parado:Math.round(d.parado||0)};
    l.saida = Math.round(d.saida||0);
    l.cobre = l.saida>0 ? Math.round((l.estoque.q / l.saida)*10)/10 : null;   // estoque cobre quantos meses no ritmo do mês-base
    return l;
  });
  return {atualizadoEm:rep && rep.atualizadoEm || "", mesBase:rep && rep.mesBase || MES_BASE, mesAtual:rep && rep.mesAtual || "", diaAte:rep && rep.diaAte || 0, linhas:linhas, temDados:!!(rep && rep.cats)};
}

export { MES_BASE, MESES_PLANO, CATS_REP, GRUPO_CAT, CAT_PEDIDO, FATORES_PADRAO, COLUNAS_REP, colunaDaEtapa, montarRep };
