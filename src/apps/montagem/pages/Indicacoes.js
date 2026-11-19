// Sorelly Admin · montagem — pages/Indicacoes.js
// Cadastro de revendedoras → Indicações (17/11/2026, pedido do Marcus: "Indicações deveria ser uma aba lá de cima e daí ter as coisas dentro, não assim"):
// Indicações é uma palavra do menu do topo com 5 telas dentro (Funil, Resgates de prêmios, Retiradas, Revendedoras e moedas, Histórico). Antes eram abas dentro de UMA tela.
// Cada tela tem o seu próprio título e os corpos ficam em pages/indicacoes/.
import { AbaIndFunil, AbaIndHistorico } from "@/apps/montagem/pages/indicacoes/FunilHistorico";
import { AbaIndResgates, AbaIndRetiradas, AbaIndRevendedoras } from "@/apps/montagem/pages/indicacoes/ResgatesMoedas";

export { AbaIndFunil as AbaIndicacoes, AbaIndResgates as AbaIndResgatesPag, AbaIndRetiradas as AbaIndRetiradasPag, AbaIndRevendedoras as AbaIndRevendedorasPag, AbaIndHistorico as AbaIndHistoricoPag };
