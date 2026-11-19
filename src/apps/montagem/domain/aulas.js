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
  {id:"pecas-lancar-fatura-banho", setores:["pecas"], modulo:"Banho", titulo:"Lançar uma fatura de banho", dur:"1:17",
   url:"/tutoriais/lancar-fatura-banho-video.html", video:"/tutoriais/videos/lancar-fatura-banho.webm",
   passos:["Abra Cadastro de peças → Banho → Faturas Pontual (ou Faturas Ellos).", "No bloco Nova fatura, preencha Data, Nº da fatura e Fornecedor do bruto.", "Clique em Criar fatura. A linha nova aparece no alto da tabela.", "Na linha nova, digite o valor de cada serviço. O Total soma sozinho.", "Desconto de peça: valor negativo na coluna Desc.", "Clique em ligar, marque os pedidos de bruto e clique em Salvar ligação. Os pedidos viram Banhado.", "Para enviar ouro, use Banho → Retirar ouro → Registrar envio."]},
  {id:"geral-abrir-chamado", setores:["geral"], modulo:"Primeiros passos", titulo:"Abrir um chamado", dur:"1:08",
   url:"/tutoriais/abrir-chamado-video.html", video:"/tutoriais/videos/abrir-chamado.webm",
   passos:["Abra Chamados, no menu da esquerda.", "Clique em Novo chamado.", "Confira o link da tela.", "Marque o que é: Não sei como fazer, Melhoria do layout ou Algo que falta.", "Escreva o que você quer, do seu jeito. Cole o print com Ctrl+V (até 4).", "Clique no botão verde ou aperte Enter.", "Quando aparecer o aviso de resposta, clique em Ver resposta e teste se a situação for Mudança feita, testar."]},
  {id:"rh-pedir-mudanca", setores:["rh", "montagem", "bipagem", "producao", "condicionais", "atendimento", "encomendas", "agendamento"], modulo:"Fluxos", titulo:"Pedir ao RH a mudança de uma colaboradora", dur:"0:58",
   url:"/tutoriais/pedir-mudanca-video.html", video:"/tutoriais/videos/pedir-mudanca.webm",
   passos:["Abra Recursos Humanos → Solicitações.", "Escolha a colaboradora.", "Escolha o que muda (setor, função, escala ou horário) e o novo valor.", "Escreva o motivo.", "Clique em Enviar ao RH.", "Espere a resposta do RH: Aprovada ou Recusada."]},
  {id:"rh-presenca-dia", setores:["rh"], modulo:"Presença", titulo:"Lançar a presença do dia", dur:"1:02",
   url:"/tutoriais/presenca-diaria-video.html", video:"/tutoriais/videos/presenca-diaria.webm",
   passos:["Abra Recursos Humanos → Presença.", "Fique em Visão do dia.", "Clique em Marcar todos como presentes.", "Marque só quem faltou: F (falta sem justificativa), AJ (falta com aviso), AT (atestado).", "Clique de novo no mesmo código para tirar a marca.", "Use o filtro Todas as ocorrências para ver só quem faltou."]},
  {id:"fin-pagas-por-dia", setores:["financeiro"], modulo:"Contas", titulo:"Ver o que foi pago em cada dia", dur:"1:02",
   url:"/tutoriais/pagas-por-dia-video.html", video:"/tutoriais/videos/pagas-por-dia.webm",
   passos:["Abra Financeiro → Contas → Contas pagas e filtre a coluna Pago em.", "Veja o Total do dia e o valor de cada CNPJ na faixa de cima.", "Use Dia anterior, Hoje e Dia seguinte para trocar o dia.", "Em CNPJ, escolha um CNPJ para ver só ele.", "Em Buscar, escreva o fornecedor, a natureza ou o valor."]},
  {id:"fin-excluir-lancamento", setores:["financeiro"], modulo:"Contas", titulo:"Excluir um lançamento feito à mão", dur:"1:02",
   url:"/tutoriais/excluir-lancamento-video.html", video:"/tutoriais/videos/excluir-lancamento.webm",
   passos:["Abra Financeiro → Contas → Contas a pagar.", "Clique na aba A pagar e ache o lançamento.", "Clique na linha. A janela da conta abre.", "Embaixo, à esquerda, clique em Excluir lançamento.", "Confirme em OK.", "Só lançamento feito à mão (botão Lançar conta) pode ser excluído. Para pagar, use Registrar pagamento."]},
  {id:"fin-trocar-cnpj", setores:["financeiro"], modulo:"Contas", titulo:"Trocar o CNPJ de uma conta (mesmo paga)", dur:"0:37",
   url:"/tutoriais/trocar-cnpj-video.html", video:"/tutoriais/videos/trocar-cnpj.webm",
   passos:["Abra Financeiro → Contas → Contas a pagar.", "Clique na aba Pagas (ou A pagar) e ache a conta.", "Clique na linha. A janela da conta abre.", "No quadro CNPJ da conta, escolha o CNPJ certo.", "Clique em Trocar CNPJ e confirme em OK.", "Errou? Abra a conta de novo e clique em Voltar ao original. A troca fica no histórico."]},
  {id:"fin-lancar-saldos", setores:["financeiro"], modulo:"Contas", titulo:"Lançar e corrigir o saldo das contas", dur:"0:36",
   url:"/tutoriais/lancar-saldos-video.html", video:"/tutoriais/videos/lancar-saldos.webm",
   passos:["Abra Financeiro → Saldos e análises → Contas bancárias.", "Clique no botão Lançar saldos. A data já vem de hoje.", "No CNPJ, digite o saldo de cada conta. Fica salvo na hora.", "Clique em Fechar para confirmar o CNPJ.", "Errou? Clique em Editar, corrija e feche de novo.", "Para outro dia, use a data ou as setas."]}
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
