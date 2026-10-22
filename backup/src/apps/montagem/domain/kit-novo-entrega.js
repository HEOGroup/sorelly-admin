// Sorelly Admin — domain/kit-novo-entrega.js
// Estado da entrega do kit novo feita JUNTO: a representante começa, cada etapa só libera a próxima quando as DUAS deram o check
// (a representante e a revendedora). Sem celular: a representante confirma sozinha e a revendedora assina no app da representante.
// Guardado em s.entregasKN[kitId] = {kitId, rev, rep, inicio, montou, bipou, checks:{n:{rep:ts, rev:ts}}, semCelular, fotoExpositor, assinatura, status}.
var TOTAL_PASSOS = 16;   // 1 a 15 = leitura/conferência com check das duas · 16 = assinatura da revendedora
var PASSO_CONF = 15;     // conferência final do kit

function passoFeito(entrada, n){
  if(!entrada) return false;
  if(n===TOTAL_PASSOS) return !!entrada.assinatura;
  var c = (entrada.checks||{})[n] || {};
  return !!c.rep && (!!c.rev || !!entrada.semCelular);
}
// Primeira etapa que ainda não foi concluída pelas duas (TOTAL_PASSOS+1 = tudo pronto)
function passoAtual(entrada){
  for(var n=1; n<=TOTAL_PASSOS; n++){ if(!passoFeito(entrada, n)) return n; }
  return TOTAL_PASSOS+1;
}

export { TOTAL_PASSOS, PASSO_CONF, passoFeito, passoAtual };
