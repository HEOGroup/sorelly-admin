// Sorelly Admin · montagem — domain/chat-canais.js
// "Manual" do chat da representante: cada setor é um contato (canal). A representante escreve para o setor e a mensagem cai na FILA dele:
// quem responder primeiro pega a conversa (atendente). Se o atendente estiver ausente ("ocupado"), a conversa volta para a fila.
// Quem atende cada setor muda sempre: aqui entram os nomes de hoje; depois isto sai do Configurador.
import { idPorNome } from "@/apps/montagem/domain/chat-contatos";

var CANAIS_REP = [
  {id:"diretoria", nome:"Diretoria", ic:"crown-simple", cor:"#B8862B", para:"Só urgências. Marcus responde 24 horas; Nickolas e Lucas, no horário de trabalho.", membros:["Marcus","Nickolas","Lucas"]},
  {id:"financeiro", nome:"Financeiro", ic:"bank", cor:"#3B82F6", para:"Comissões e pagamentos: primeiro com o Lucas.", membros:["Lucas","Nayale","Bruna"]},
  {id:"agendamento", nome:"Agendamento", ic:"calendar-dots", cor:"#A855F7", para:"Horários de acerto, atrasos e remarcações.", membros:["Ana Maria Divino","Mariana","Tamara"]},
  {id:"cadastro", nome:"Cadastro de Revendedoras", ic:"identification-card", cor:"#F97316", para:"Atualizar o cadastro de uma revendedora (endereço, telefone, dados).", membros:["Camilly","Thalyanny"]},
  {id:"kits", nome:"Kits", ic:"gift", cor:"#22C55E", para:"Informar ou tirar dúvida sobre algum kit.", membros:["Deysiane","Leci","Edna"]},
  {id:"encomendas", nome:"Encomendas", ic:"package", cor:"#14B8A6", para:"Saber se as peças de uma cliente já foram separadas.", membros:["Agatha","Eduarda Gabriela","Elen"]},
  {id:"kitsnovos", nome:"Kits Novos", ic:"sparkle", cor:"#EC4899", para:"Revendedoras novas que foram direcionadas para você.", membros:["Michele"]}
];
// Chat do app da revendedora (14/10/2026): com quem ela pode falar. "Minha representante" depende de quem é a dela.
var CANAIS_REV = [
  {id:"r_rep", nome:"Minha representante", ic:"user-circle", cor:"#8B5CF6", para:"", membros:[]},
  {id:"r_indicacao", nome:"Indique uma revendedora", ic:"heart", cor:"#EC4899", para:"", membros:["Michele"]},
  {id:"r_link", nome:"Link de pagamento", ic:"link", cor:"#0EA5E9", para:"", membros:["Helen"]},
  {id:"r_garantias", nome:"Garantias", ic:"shield-check", cor:"#F59E0B", para:"", membros:["Deysiane","Leci"]},   // quem atende Garantias e SAC é provisório: confirmar com o Marcus
  {id:"r_curriculo", nome:"Envie seu currículo para trabalhar na Sorelly", ic:"briefcase", cor:"#14B8A6", para:"", membros:["Maria Claudia"]},
  {id:"r_sac", nome:"SAC", ic:"headset", cor:"#22C55E", para:"", membros:["Camilly","Thaylianny"]}];
function canal(id){ return CANAIS_REP.concat(CANAIS_REV).find(function(c){ return c.id===id; }); }
function membrosDoCanal(id){ var c = canal(id); return c ? c.membros.map(function(n){ return idPorNome(n); }).filter(Boolean) : []; }
// respostas de demonstração por setor (o servidor troca isto pelas pessoas de verdade)
var RESPOSTAS_CANAL = {
  diretoria:["Oi! Pode falar, é urgente?","Entendi. Já estou vendo e te retorno."],
  cadastro:["Oi! Me passa o nome da revendedora e o que mudou que eu atualizo agora.","Atualizei o cadastro dela. Qualquer coisa me avisa 😊"],
  encomendas:["Oi! Já vou olhar a separação. Qual o nome da cliente?","Conferi: as peças dela já estão separadas e vão no próximo kit."],
  kits:["Oi! Me diz o nome da revendedora e o que aconteceu com o kit.","Entendi. Vou avisar a montagem e já te retorno."],
  financeiro:["Oi! Qual comissão você quer conferir? Me manda a data do pagamento.","Conferi aqui: está tudo certo com o seu pagamento desse período."],
  agendamento:["Oi! Qual dia e horário você consegue vir à empresa?","Combinado, deixei você agendada. Chegando atrasada, é só avisar por aqui."],
  kitsnovos:["Oi! Já te mando os dados da revendedora nova.","Perfeito, pode entregar o kit. Qualquer dúvida me chama."]
};
export { CANAIS_REV, CANAIS_REP, canal, membrosDoCanal, RESPOSTAS_CANAL };
