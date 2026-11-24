// Sorelly Admin · montagem — domain/kit-apoio.js
// KIT APOIO BOLSINHAS DE NATAL (pedido do Marcus pela conversa Material gráfico, 24/11/2026). Produto da DevMaster MP0063 "KIT APOIO BOLSINHAS SORELLY NATAL COM 5 UNIDADES",
// cadastrado pela Rayssa em 23/11/2026, R$ 10,00 por kit, comissão ZERO. O preço mora SÓ aqui (nunca fixo dentro de tela). Só leitura da DevMaster: nada é gravado lá.
// No acerto o valor SOMA ao que a revendedora paga (como tags e excedente de brinde) e fica FORA de: venda líquida, faixa, comissão, brinde, taxa de deslocamento e meta.
var KIT_APOIO = {codigo:"MP0063", nome:"Kit apoio bolsinhas de Natal (5 unidades)", valorUnit:10, maxPorAcerto:500};

var brl = function(n){ return "R$ "+Number(n||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); };
var AVISO_KIT_APOIO = "Kits de apoio de Natal (5 bolsinhas) a "+brl(KIT_APOIO.valorUnit)+" cada. Sem comissão. Cobrar o valor integral.";

// form.kitApoio = {qtd}; devolve {qtd, valorUnit, valor} (valor arredondado em centavos)
function kitApoioDoForm(form){
  var q = Math.max(0, Math.min(KIT_APOIO.maxPorAcerto, Math.floor(Number(form && form.kitApoio && form.kitApoio.qtd)||0)));
  return {qtd:q, valorUnit:KIT_APOIO.valorUnit, valor:Math.round(q*KIT_APOIO.valorUnit*100)/100};
}

export { KIT_APOIO, AVISO_KIT_APOIO, kitApoioDoForm };
