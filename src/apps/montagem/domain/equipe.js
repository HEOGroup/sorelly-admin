// Sorelly Admin · montagem e bipagem — domain/equipe.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { e } from "@/shared/react";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";

var MONTADORAS = [
  // Montagem de kits (todas também fazem produção e troca de plástico); funcao = tarefa extra de cada uma
  {id:1, nome:"Pamela",  mes:{n:140, e:22, soma:98*4.7, aval:98, div:3, tempoMedioMin:24}},
  {id:2, nome:"Ivanete", mes:{n:130, e:18, soma:90*4.3, aval:90, div:7, tempoMedioMin:27}},
  {id:3, nome:"Paula Melissa", mes:{n:136, e:19, soma:94*4.6, aval:94, div:2, tempoMedioMin:23}},
  {id:4, nome:"Let\u00edcia", mes:{n:124, e:15, soma:85*3.8, aval:85, div:11, tempoMedioMin:31}},
  {id:5, nome:"Jenifer", mes:{n:118, e:13, soma:80*4.1, aval:80, div:4, tempoMedioMin:26}},
  {id:6, nome:"Eduarda Helena", mes:{n:112, e:15, soma:77*4.4, aval:77, div:5, tempoMedioMin:25}},
  {id:7, nome:"Maria Vitória", funcao:"Verificação das maletas", mes:{n:86,  e:10, soma:60*3.4, aval:60, div:9, tempoMedioMin:34}},
  {id:19, nome:"Larissa", mes:{n:108, e:14, soma:74*4.2, aval:74, div:6, tempoMedioMin:28}},
  {id:20, nome:"Rakieli", mes:{n:101, e:12, soma:70*4.0, aval:70, div:8, tempoMedioMin:29}},
  {id:21, nome:"Taynara", funcao:"Conferência de estoque", mes:{n:92, e:11, soma:64*4.3, aval:64, div:5, tempoMedioMin:32}},
  // Setor Encomendas (19/10/2026): só elas montam kit acima do limite de Encomendas (Configurador, `limiteEncomendas`). Começam sem histórico no mês.
  {id:39, nome:"Elen", completo:"Elen Vitoria Lourenço de Bonfim", encomendas:true, mes:{n:0, e:0, soma:0, aval:0, div:0, tempoMedioMin:0}},
  {id:40, nome:"Agatha", completo:"Agatha Kristye Lencioni Mota", encomendas:true, mes:{n:0, e:0, soma:0, aval:0, div:0, tempoMedioMin:0}},
  {id:41, nome:"Eduarda Gabriela", completo:"Eduarda Gabriela Henrique Lima", encomendas:true, mes:{n:0, e:0, soma:0, aval:0, div:0, tempoMedioMin:0}}
];
var ENCOMENDAS_IDS = [39,40,41];   // padrão de quem monta kit grande (a lista em uso fica nas montadoras com `encomendas:true`)
var BIPADORAS = [{id:9, nome:"Natasha", completo:"Natasha Ribeiro", mes:{n:180, e:32, faltas:1}}, {id:10, nome:"Edna", completo:"Edna Pereira", funcao:"Treinamento e atacado", mes:{n:171, e:27, faltas:3}},
  {id:12, nome:"Natalia", completo:"Natalia Araujo", mes:{n:150, e:26, faltas:0}}, {id:13, nome:"Nataly", completo:"Nataly Fernanda", mes:{n:142, e:22, faltas:5}},
  {id:14, nome:"Sthefany", completo:"Sthefany Marques", mes:{n:131, e:20, faltas:2}}, {id:15, nome:"Kawany", completo:"Kawany Coutinho", mes:{n:128, e:21, faltas:4}},
  {id:22, nome:"Renata", mes:{n:96, e:15, faltas:2}},
  {id:33, nome:"Gabrielly", completo:"Gabrielly Morais", mes:{n:90, e:14, faltas:1}}, {id:34, nome:"Maria Eduarda", completo:"Maria Eduarda de Assunção", mes:{n:84, e:12, faltas:0}}];
// Leci: só atende as clientes que vêm à empresa e escolhe as peças depois que os kits são bipados (mesmo acesso da bipagem)
var ATENDENTE_PECAS = {id:35, nome:"Leci"};
// Acesso total e fixo: só os sócios (Marcus, Anamaria, Lucas). Nickolas, Marco Antonio e Ana Beatriz: tudo menos os Configuradores. Amanda de Miranda: Inadimplência e Compras de joias.
// O que cada grupo abre fica em navigation/perfis.js e se ajusta em RH → Acessos por setor.
var ACESSO_TOTAL = [{id:29, nome:"Anamaria"}, {id:37, nome:"Priscila"}, {id:38, nome:"Maria Claudia"}, {id:44, nome:"Leonardo"}];   // Priscila e Maria (RH): acesso igual ao do Marcus
var AMANDA_M = {id:32, nome:"Amanda de Miranda"};
var DIRECAO_FAMILIA = [{id:17, nome:"Nickolas"}];
var FAMILIA = [{id:31, nome:"Marco Antonio"}, {id:30, nome:"Ana Beatriz"}];
var LISTAGENS_RESP = {id:23, nome:"Majorry"};
var SUPERVISORA = {id:11, nome:"Deysiane"};
var DIRETORIA = [{id:16, nome:"Marcus"}, {id:17, nome:"Nickolas"}, {id:28, nome:"Lucas"}];
var LEONARDO = {id:44, nome:"Leonardo"};   // desenvolvedor: acesso total (conta com pessoa_id 44)
var KITNOVO = {id:18, nome:"Michele"};
var CADASTRO_REV = [{id:45, nome:"Camilly"}];   // Cadastro de revendedoras: mesmo grupo de acesso da Michele (Kits novos e Cadastro)
// Cadastro de peças (23/10/2026): Rayssa (supervisora) e Graziella lançam as peças e respondem os pedidos da produção (Cadastro de peças → Solicitações)
var CADASTRO_PECAS = [{id:42, nome:"Rayssa"}, {id:43, nome:"Graziella"}];
// Agendamento confere o dinheiro e a promissória do acerto; financeiro dá o OK de cada pagamento (Ana Maria faz os dois)
var AGENDAMENTO = [{id:24, nome:"Ana Maria"}, {id:25, nome:"Mariana"}, {id:26, nome:"Tamara"}];
var FINANCEIRO = [{id:27, nome:"Nayale"}, {id:36, nome:"Bruna"}];   // Bruna faz o faturamento e vê as comissões
// Agendamento (acertos): todos do setor lançam; gerenciam (abrir/fechar o mês e configurar) a Diretoria e quem estiver marcado no Configurador (padrão: Ana Maria)
function podeGerirAgend(id, ag){ return DIRETORIA.some(function(x){ return x.id===id; }) || (((ag && ag.config && ag.config.gerentes) || [24]).indexOf(id)>=0); }
var ACAO_AGENDAMENTO = [24,25,26], ACAO_FINANCEIRO = [27,36];
var EQUIPE = MONTADORAS.concat(BIPADORAS,[ATENDENTE_PECAS],ACESSO_TOTAL,[AMANDA_M],FAMILIA,[SUPERVISORA],DIRETORIA,[LEONARDO],[KITNOVO],CADASTRO_REV,CADASTRO_PECAS,[LISTAGENS_RESP],AGENDAMENTO,FINANCEIRO);
// Quem pode ser montador de um kit: pessoa que existe na equipe e é da montagem ou da supervisão/diretoria (bipadora, financeiro etc. não montam)
function montadorValido(id){ return id!=null && nomeDe(id)!=="—" && (MONTADORAS.some(function(m){ return m.id===id; }) || papelDe(id)==="supervisao"); }
// Quem libera a exceção do kit acima do limite de Encomendas: Marcus e Deysiane
var PODE_EXCECAO = [16, 11, 39, 44];   // Marcus, Deysiane e a Elen (Encomendas): Marcus pediu em 19/10/2026 (ele às vezes manda ela fazer um kit específico)
function podeLiberarExcecao(id){ return PODE_EXCECAO.indexOf(id)>=0; }
// Contas com grupo de acesso próprio (funcionário que não está na lista de 43 nomes): o App informa o grupo e o nome da conta que entrou.
var GRUPO_CONTA = {}, NOME_CONTA = {};
function definirContaEquipe(id, grupo, nome){ if(id==null || isNaN(id)) return; if(grupo) GRUPO_CONTA[id] = grupo; else delete GRUPO_CONTA[id]; if(nome) NOME_CONTA[id] = nome; else delete NOME_CONTA[id]; }
function nomeDe(id){ var p = EQUIPE.find(function(x){return x.id===id;}); return p ? p.nome : (NOME_CONTA[id] || "\u2014"); }
function papelDe(id){
  if(GRUPO_CONTA[id]) return GRUPO_CONTA[id]==='supervisora' ? 'supervisao' : GRUPO_CONTA[id];   // grupo definido na conta vale sobre a lista
  if(id===SUPERVISORA.id || DIRETORIA.some(function(x){return x.id===id;})) return "supervisao";
  if(id===KITNOVO.id || CADASTRO_REV.some(function(x){return x.id===id;})) return "kitnovo";
  if(CADASTRO_PECAS.some(function(x){return x.id===id;})) return "cadastropecas";
  if(id===LISTAGENS_RESP.id) return "listagens";
  if(FAMILIA.some(function(x){return x.id===id;})) return "familia";
  if(id===AMANDA_M.id) return "inadimplencia";
  if(id===ATENDENTE_PECAS.id) return "bipadora";
  if(ACAO_AGENDAMENTO.indexOf(id)>=0) return "agendamento";
  if(ACAO_FINANCEIRO.indexOf(id)>=0) return "financeiro";
  if(BIPADORAS.some(function(b){return b.id===id;})) return "bipadora";
  if(MONTADORAS.some(function(m){return m.id===id;})) return "montadora";
  return "supervisao";
}

// Supervisão e diretoria podem tudo; agendamento e financeiro só as ações do seu setor
// Quem bipa o retorno (bipadora) também mexe nas peças do próximo mês: gera a condicional nova e coloca o número
function podeBipRetorno(id){ return podeAgendar(id) || BIPADORAS.some(function(b){ return b.id===id; }); }
// Grupo de ACESSO (menu e blocos de cada tela). Diferente do papel (função na montagem): Nickolas e Deysiane seguem como supervisão nas ações,
// mas o acesso deles é editável. Sócios = fixo.
// Só Início, SorellyChat e Melhorias por enquanto (Marcus, 29/10/2026): Bruna (36), as montadoras (1 a 7, 19 a 21) e Elen, Agatha e Eduarda (39 a 41, que ainda ganham o setor Encomendas pela conta). Vale também no "atuar como". Tirar o id daqui quando for liberar telas novas.
var SO_CHAT = [36, 1, 2, 3, 4, 5, 6, 7, 19, 20, 21, 39, 40, 41];
function grupoDe(id){
  if(SO_CHAT.indexOf(id)>=0) return "basico";
  if(GRUPO_CONTA[id]) return GRUPO_CONTA[id];
  if(id===16 || id===17 || id===37 || id===LEONARDO.id) return "supervisao";   // Acesso total: Marcus, Nickolas, Priscila (secretária) e Leonardo (Marcus, 28/10/2026)
  if(id===28 || id===29 || id===30 || id===31 || id===38 || id===AMANDA_M.id) return "familia";   // Direção: sem Configuradores; o Marcus ajusta o acesso de cada um em RH → Acessos
  if(id===SUPERVISORA.id) return "supervisora";
  return papelDe(id);
}
// Partes de cada tela que o RH liberta por grupo. Os grupos padrão reproduzem o que já valia; "supervisao" (sócios) sempre vê tudo.
var BLOCOS = {
  valores:{tela:"consrep", nome:"Ver totais em dinheiro, placar e exportar", padrao:["familia","supervisora","financeiro"]},   // só a diretoria: quem bipa os retornos usa o Consolidado sem ver os totais
  conferir:{tela:"consrep", nome:"Conferir recebimento (dinheiro, condicional, peças)", padrao:["familia","supervisora","agendamento","inadimplencia"]},
  conciliar:{tela:"comissoes", nome:"Conciliar pagamentos (OK do financeiro)", padrao:["familia","supervisora","financeiro","inadimplencia"]},
  configurar:{tela:"comissoes", nome:"Configurar as comissões", padrao:["financeiro"]}};
var BLOCOS_OVR = {};
function definirBlocos(o){ BLOCOS_OVR = o || {}; }
function veBloco(id, k){ var g = grupoDe(id); return g==="supervisao" || (BLOCOS_OVR[k] || BLOCOS[k].padrao).indexOf(g)>=0; }
function veTudo(id){ var p = papelDe(id); return p==="supervisao" || p==="familia"; }
function podeAgendar(id){ return veBloco(id,"conferir"); }
// O agendamento (Mariana, Tamara) não vê valores totais nem as contas: só quantidades. Quem tem o financeiro, a supervisão e a diretoria veem tudo.
// Quem define a conta e confere os pagamentos do atendimento interno (Visão geral): Marcus, Nickolas, Lucas e Ana Maria
var CONFERE_PAGAMENTOS = [16,28,29];   // quem define as contas dos pagamentos do atendimento interno: Marcus, Lucas e Anamaria
function podeConferirPag(id){ return temAutorizacao("financeiro_confere", id); }   // lista ajustável em RH → Acessos e autorizações (padrão em domain/autorizacoes.js)
// Configuração das comissões (botão em Comissões): só Marcus, Ana Maria e Nayale
var CONFIG_COMISSAO = [16,29,27];
function podeConfigComissao(id){ return temAutorizacao("comissao_config", id); }   // só o Marcus altera as regras e os valores das comissões
function veTotais(id){ return veBloco(id,"valores"); }
function podeFinanceiro(id){ return veBloco(id,"conciliar"); }

// quem bipa os retornos por padrão (editável em Configurador geral → Quem bipa): bipadoras, atendente de peças, Michele (kits novos) e Deysiane
var BIPA_RETORNO_PADRAO = function(){ return BIPADORAS.map(function(b){ return b.id; }).concat([ATENDENTE_PECAS.id, KITNOVO.id, SUPERVISORA.id]); };
function podeDecidirCadastro(id){ return temAutorizacao("cadastro_decide", id); }
// quem está na lista de pessoas do sistema (pessoa desconhecida não pode ganhar acesso total por padrão)
var pessoaConhecida = function(id){ return !!GRUPO_CONTA[id] || EQUIPE.some(function(p){ return p.id===id; }); };
export { definirContaEquipe, pessoaConhecida, CADASTRO_PECAS, ENCOMENDAS_IDS, montadorValido, podeLiberarExcecao, podeDecidirCadastro, podeGerirAgend, BLOCOS, definirBlocos,BIPA_RETORNO_PADRAO,  veBloco, grupoDe, AMANDA_M, DIRECAO_FAMILIA, ACESSO_TOTAL, FAMILIA, ATENDENTE_PECAS, podeConfigComissao, podeConferirPag, AGENDAMENTO, FINANCEIRO, veTotais, podeAgendar, podeBipRetorno, podeFinanceiro, MONTADORAS, BIPADORAS, LISTAGENS_RESP, SUPERVISORA, DIRETORIA, LEONARDO, KITNOVO, EQUIPE, nomeDe, papelDe };
