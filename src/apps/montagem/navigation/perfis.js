// Sorelly Admin · montagem e bipagem — navigation/perfis.js
// Quais telas cada GRUPO de acesso abre. O padrão fica aqui; o RH ajusta em RH → Acessos por setor (state.acessos vale sobre o padrão).
// supervisao = só os sócios (Marcus, Anamaria, Lucas): acesso total, fixo. Quem está em cada grupo: grupoDe() em domain/equipe.js.
import { ABAS } from "@/apps/montagem/navigation/abas";

var TODAS = ABAS.map(function(a){ return a[0]; });
// Telas dos Configuradores: Direção e família abrem tudo menos estas
var CONFIGURADORES = ["config","comconfig","knconfigurador","configrep","rhconfig"];
var ABAS_PERFIL = {supervisao:null, bipadora:["visaobip","meudesemp","painel","calc","condicionais","consolidado","intrevs","intlist","intcalc","intcons","consrep","controlekits","celbip"],   // listagens (representantes e internas), calculadora, condicionais, consolidados; Equipe e Registros só Deysiane e Diretoria montadora:["painel","celular"],
  kitnovo:["kitnovo","knpendencias","knconsolidado","knregras","knconfigurador","aprovacaocad","desempenhocad","indicacoes","msgcad","repcad"], listagens:["painel","pedirpecas","kitnovo","condicionais","celcond"],
  agendamento:["agpainel","p45ind","p45apr","p45acomp","p45msg","p45pnl","agremarc","agreps","agabertura","agconfig","aganalises","aghistorico","consrep","controlekits","inadimp","dinheiro"], financeiro:["cpagamentos","direcionar","ctapagar","ctalista","chavespixbanco","emprestimos","chavespix","adquirentes","comlink","compras","cadpecas","estoquesorelly","linkrel","cfregras","pfresumo","pflanc","pfneg","pfmaq","pfforn","pfcadastro","pfprest","dinheiro","comisstodos","agbonus","agmetas","comdatas","comisbip","comismont","comisint","comcad","cominad","consrep","controlekits","placar","comissoes","pixdireto","inadimp","inadfin","caixa"],
  familia:TODAS.filter(function(k){ return CONFIGURADORES.indexOf(k)<0 && k.indexOf("marcus")!==0; }),
  supervisora:TODAS.filter(function(k){ return k!=="fluxo" && k.indexOf("marcus")!==0; }),                       // Deysiane: como era (tudo)
  cadastropecas:["cadpecas"],          // Rayssa e Graziella
  inadimplencia:["inadimp","comprasrep"],          // Amanda de Miranda
  representante:["celrep","painel","consrep","comissoes"]};
var PAPEL_LB = {supervisao:"Sócios (acesso total)", familia:"Direção e família (sem Configuradores)", supervisora:"Supervisão da montagem", agendamento:"Agendamento",
  financeiro:"Financeiro", inadimplencia:"Inadimplência", bipadora:"Atendimento e bipagem", montadora:"Montagem de kits", listagens:"Listagens e condicionais", kitnovo:"Kit novo", cadastropecas:"Cadastro de peças",
  representante:"Representantes"};
// cor e ícone de cada grupo (tela de Acessos e seletor do topo)
var VISUAL = {supervisao:["#D9A63A","coroa"], familia:["#A855F7","equipe"], supervisora:["#22C55E","caixa"], agendamento:["#3B82F6","calendario"],
  financeiro:["#14B8A6","banco"], inadimplencia:["#EF4444","alert"], bipadora:["#0EA5E9","bipagem"], montadora:["#F59E0B","montadora"],
  listagens:["#D97706","lista"], kitnovo:["#EC4899","kitnovo"], cadastropecas:["#3B82F6","cubos"], representante:["#8B5CF6","representante"]};
// grupos que o RH pode editar, na ordem da tela
var GRUPOS_EDITAVEIS = ["familia","supervisora","agendamento","financeiro","inadimplencia","bipadora","montadora","listagens","kitnovo","cadastropecas","representante"];

/** Telas liberadas para o grupo: o que o RH marcou, ou o padrão. null = tudo. */
function abasDoPapel(papel, acessos){
  var m = acessos && acessos[papel];
  return papel!=="supervisao" && m ? m : ABAS_PERFIL[papel];
}

export { ABAS_PERFIL, PAPEL_LB, VISUAL, GRUPOS_EDITAVEIS, abasDoPapel };
