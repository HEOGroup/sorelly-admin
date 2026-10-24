// Sorelly Admin · montagem — lib/estilo-plano.js
// Chave do visual "plano" do Financeiro (regra fixa do Marcus, 22/10/2026): sem degradê, sem cartões coloridos, textos brancos, cor só no estado.
// O App liga a chave quando o setor aberto é o Financeiro; as peças compartilhadas (BlocoBarra, Indicador, Abas, BarraFiltros, Tab) trocam de aparência sozinhas.
// Assim todas as telas do Financeiro ficam no padrão de uma vez, e os outros setores seguem como estão até o Marcus mandar.
var PLANO = false;
function setPlano(v){ PLANO = !!v; }
function plano(){ return PLANO; }
export { setPlano, plano };
