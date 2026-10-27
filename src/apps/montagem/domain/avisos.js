// Sorelly Admin — domain/avisos.js
// Avisos do sistema: o que dispara cada alerta e QUEM recebe (definido em Tecnologia → Avisos). O alerta aparece no canto da tela de cada
// pessoa da lista, com som, até ela clicar. Quem recebe é por pessoa/cargo, nunca fixo dentro de tela.
import { AGENDAMENTO, BIPADORAS, DIRETORIA, FINANCEIRO, KITNOVO, LISTAGENS_RESP, SUPERVISORA } from "@/apps/montagem/domain/equipe";

var TIPOS = [
  {k:"media_alta", t:"Média de vendas acima do limite", desc:"Na Atendimento Sorelly, quando a média das vendas da revendedora passa do limite do Configurador geral (limite do Marcus, hoje R$ 4.000). O alerta sai uma vez por atendimento.", padrao:[SUPERVISORA.id, 16, 17]},
  {k:"fila_retorno", t:"Fila de retornos para bipar", desc:"Quando a fila de kits que voltaram das representantes e ainda faltam bipar passa de 20, 30, 40 e 50. Cada degrau novo gera um alerta mais vermelho: acione cadastro, Deysiane e encomendas para ajudar a bipar.", padrao:[11,16,17,28,29,27,24,26]},
  {k:"p45_pedido", t:"Pedido de mudança de data (app da representante)", desc:"Quando a representante pede, pelo app, uma data de acerto mais de 5 dias depois da atual. Aprovar em Agendamento → Plano 45/60 → Aprovação → Pedidos do app. Sem aprovação vale a multa de remarcação.", padrao:[16,17,28]},
  {k:"p45_contato", t:"Plano 45/60: aprovada sem contato", desc:"Uma vez por dia, quando há revendedora aprovada no plano 45/60 há mais de 24 horas sem contato registrado.", padrao:[16,17,28,24,25,26]},
  {k:"p45_venda", t:"Plano 45/60: nova data sem venda lançada", desc:"Uma vez por dia, quando a nova data de uma aprovada já chegou e a venda do ciclo não foi lançada.", padrao:[16,17,28,24,25,26]}
];
var GRUPOS_PESSOAS = [
  {t:"Diretoria", ps:DIRETORIA},
  {t:"Supervisão da montagem", ps:[SUPERVISORA]},
  {t:"Bipadoras", ps:BIPADORAS},
  {t:"Financeiro e agendamento", ps:FINANCEIRO.concat(AGENDAMENTO)},
  {t:"Outros setores", ps:[KITNOVO, LISTAGENS_RESP]}
];
function destinosDe(s, tipo){
  var c = (s.avisosCfg||{})[tipo];
  if(c) return c;
  var t = TIPOS.find(function(x){ return x.k===tipo; });
  return t ? t.padrao.slice() : [];
}

export { TIPOS, GRUPOS_PESSOAS, destinosDe };
