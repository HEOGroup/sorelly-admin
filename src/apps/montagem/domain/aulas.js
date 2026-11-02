// Sorelly Admin · montagem — domain/aulas.js
// "Aulas do setor" (02/11/2026, pedido do Marcus): curso de cada setor, no fim do menu. Cada pessoa vê só as aulas do próprio setor; quem é responsável por mais de um setor vê os dois.
// REGRA DO VÍDEO (02/11/2026, Marcus): o vídeo mostra SEMPRE a tela inteira do sistema (menu lateral + barra de cima + conteúdo), começa no Início e o cursor clica em cada passo até chegar ao local. Nunca só a aba.
// Lista de setores e aulas ficam AQUI (catálogo). Aula nova = uma linha em AULAS (vídeo ou demonstração animada em public/tutoriais). O que a pessoa já assistiu fica neste navegador (localStorage).
// Quem vê o quê: Direção (grupo supervisão ou família) vê tudo; os demais veem o setor do RH em que estão + os setores extras de EXTRA_POR_PESSOA + as aulas "Para todos".
import { grupoDe, nomeDe } from "@/apps/montagem/domain/equipe";
import { colaboradoresRh } from "@/apps/montagem/domain/rh";

// id, nome, cor, nomes do setor no cadastro do RH
var SETORES_AULAS = [
  {id:"geral", nome:"Para todos", cor:"#14B8A6", rh:[]},
  {id:"financeiro", nome:"Financeiro", cor:"#3B82F6", rh:["Financeiro"]},
  {id:"agendamento", nome:"Agendamento", cor:"#A855F7", rh:["Agendamento"]},
  {id:"cadastro", nome:"Cadastro de revendedoras", cor:"#F97316", rh:["Cadastro de revendedoras"]},
  {id:"pecas", nome:"Cadastro de peças", cor:"#6366F1", rh:["Cadastro de peças"]},
  {id:"compras", nome:"Compras e estoque", cor:"#0EA5E9", rh:["Compras"]},
  {id:"montagem", nome:"Montagem de kits", cor:"#F59E0B", rh:["Montagem de kits"]},
  {id:"bipagem", nome:"Bipagem", cor:"#38BDF8", rh:["Bipagem"]},
  {id:"atendimento", nome:"Atendimento de kits", cor:"#E8B84B", rh:["Atendimento de kits", "Kits"]},
  {id:"condicionais", nome:"Condicionais", cor:"#22C55E", rh:["Condicionais"]},
  {id:"producao", nome:"Produção", cor:"#D97706", rh:["Produção"]},
  {id:"encomendas", nome:"Encomendas e reposições", cor:"#2DD4BF", rh:["Encomendas"]},
  {id:"trocas", nome:"Trocas e pós-vendas", cor:"#C084FC", rh:["Trocas", "Pós-vendas", "Pós Vendas"]},
  {id:"rh", nome:"Recursos Humanos", cor:"#8B5CF6", rh:["RH"]},
  {id:"marketing", nome:"Marketing", cor:"#EC4899", rh:["Marketing"]},
  {id:"juridico", nome:"Jurídico e inadimplência", cor:"#EF4444", rh:["Jurídico", "Juridico"]},
  {id:"facilities", nome:"Facilities", cor:"#64748B", rh:["Facilities"]},
  {id:"direcao", nome:"Direção", cor:"#D9A63A", rh:["Equipe direção", "Equipe Direção"]}
];

// quem é responsável por mais de um setor (id da pessoa em domain/equipe.js): vê as aulas de todos eles
var EXTRA_POR_PESSOA = {11: ["montagem", "bipagem", "condicionais", "producao"]};   // Deysiane

// Aulas. setores = em quais cursos aparece. modulo = grupo dentro do curso. video = arquivo de vídeo (opcional); url = demonstração animada (opcional).
var AULAS = [
  {id:"rh-pedir-mudanca", setores:["rh", "montagem", "bipagem", "producao", "condicionais", "atendimento", "encomendas", "agendamento"], modulo:"Fluxos", titulo:"Pedir ao RH a mudança de uma colaboradora", dur:"0:58",
   url:"/tutoriais/pedir-mudanca-video.html", video:"/tutoriais/videos/pedir-mudanca.webm",
   passos:["Abra Recursos Humanos → Solicitações.", "Escolha a colaboradora.", "Escolha o que muda (setor, função, escala ou horário) e o novo valor.", "Escreva o motivo.", "Clique em Enviar ao RH.", "Espere a resposta do RH: Aprovada ou Recusada."]},
  {id:"rh-presenca-dia", setores:["rh"], modulo:"Presença", titulo:"Lançar a presença do dia", dur:"1:02",
   url:"/tutoriais/presenca-diaria-video.html", video:"/tutoriais/videos/presenca-diaria.webm",
   passos:["Abra Recursos Humanos → Presença.", "Fique em Visão do dia.", "Clique em Marcar todos como presentes.", "Marque só quem faltou: F (falta sem justificativa), AJ (falta com aviso), AT (atestado).", "Clique de novo no mesmo código para tirar a marca.", "Use o filtro Todas as ocorrências para ver só quem faltou."]},
  {id:"fin-pagas-por-dia", setores:["financeiro"], modulo:"Contas", titulo:"Ver o que foi pago em cada dia", dur:"0:50",
   url:"/tutoriais/pagas-por-dia-video.html", video:"/tutoriais/videos/pagas-por-dia.webm",
   passos:["Abra Financeiro → Contas → Pagas por dia.", "Veja o Total do dia e o valor de cada CNPJ na faixa de cima.", "Use Dia anterior, Hoje e Dia seguinte para trocar o dia.", "Em CNPJ, escolha um CNPJ para ver só ele.", "Em Buscar, escreva o fornecedor, a natureza ou o valor."]},
  {id:"fin-excluir-lancamento", setores:["financeiro"], modulo:"Contas", titulo:"Excluir um lançamento feito à mão", dur:"0:58",
   url:"/tutoriais/excluir-lancamento-video.html", video:"/tutoriais/videos/excluir-lancamento.webm",
   passos:["Abra Financeiro → Contas → Contas a pagar.", "Clique na aba A pagar e ache o lançamento.", "Clique na linha. A janela da conta abre.", "Embaixo, à esquerda, clique em Excluir lançamento.", "Confirme em OK.", "Só lançamento feito à mão (botão Lançar conta) pode ser excluído. Para pagar, use Registrar pagamento."]}
];

var norm = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim(); };

// setores (ids) cujas aulas a pessoa pode ver
function setoresDaPessoa(s){
  var eu = s.usuario, g = grupoDe(eu);
  if(g==="supervisao" || g==="familia") return SETORES_AULAS.map(function(x){ return x.id; });
  var ids = ["geral"].concat(EXTRA_POR_PESSOA[eu] || []);
  var curto = norm(nomeDe(eu)), achados = curto ? colaboradoresRh(s).filter(function(c){ return norm(c.nome).indexOf(curto)===0; }) : [];
  if(achados.length===1){ var st = norm(achados[0].setor); SETORES_AULAS.forEach(function(x){ if(x.rh.some(function(n){ return norm(n)===st; }) && ids.indexOf(x.id)<0) ids.push(x.id); }); }
  return ids;
}
var aulasDoSetor = function(id){ return AULAS.filter(function(a){ return a.setores.indexOf(id)>=0 || (id==="geral" && a.setores.indexOf("geral")>=0); }); };
var minutos = function(l){ var t = 0; l.forEach(function(a){ var p = String(a.dur||"0:0").split(":"); t += (+p[0])*60 + (+p[1]||0); }); return Math.max(l.length ? 1 : 0, Math.round(t/60)); };

// o que cada pessoa já assistiu (só neste navegador por enquanto)
var chaveVistas = function(eu){ return "sorelly_aulas_vistas_" + eu; };
function lerVistas(eu){ try { var l = JSON.parse(localStorage.getItem(chaveVistas(eu)) || "[]"); return Array.isArray(l) ? l : []; } catch(x){ return []; } }
function marcarVista(eu, id, sim){
  var l = lerVistas(eu).filter(function(x){ return x!==id; }); if(sim) l.push(id);
  try { localStorage.setItem(chaveVistas(eu), JSON.stringify(l)); } catch(x){}
  try { window.dispatchEvent(new Event("sorelly-aulas")); } catch(x){}
}
export { SETORES_AULAS, AULAS, setoresDaPessoa, aulasDoSetor, minutos, lerVistas, marcarVista };
