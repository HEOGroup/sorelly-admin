// Sorelly Admin — domain/regras-acerto.js
// REGRAS OFICIAIS DA CALCULADORA DE ACERTOS, para LEITURA (Marcus, 28/11/2026: uma fonte única, que o Sorelly Intel consulta e que a aba de regras mostra).
// Nenhum número é escrito aqui: tudo vem das constantes de domain/consignado.js, as mesmas que a conta usa (calcularAcerto e derivarAcerto).
// Texto para pessoas: docs/regras/CALCULADORA-DE-ACERTOS.md. Folder oficial: materiais-do-app/folder-revendedoras.html (PDF em public/regras/GUIA-DA-REVENDEDORA.pdf).
// Devolve a versão VIGENTE e, separadas, as CONDIÇÕES NOVAS de 28/11/2026 (ativas ou não, com a data de vigência). Regra nova aparece aqui sozinha.
import { MEDIA_N, MOTIVOS_ISENCAO, VIGENCIA_CONDICOES_2, condicoes2Ativas, novaVersaoRegras, versaoCondicoes2 } from "@/apps/montagem/domain/consignado";
import { RESPONSAVEIS } from "@/apps/montagem/domain/ocorrencias-acerto";
import { feriadosDe } from "@/apps/montagem/domain/feriados";

var ATUALIZADO_EM = "2026-11-28";
var ID_REGRAS_1 = "rv20261027", VIGENCIA_REGRAS_1 = "2026-10-27";   // o mesmo id e a mesma data que state/store.js usa ao montar as regras em cada computador

function faixas(l){ return l.map(function(f, i){ return {vendaDe:f.min, vendaAte:l[i+1] ? Math.round((l[i+1].min-0.01)*100)/100 : null, comissaoPct:f.pct, brindeNormal:f.bn, brindeSelect:f.bb}; }); }
// Uma versão de regras (objeto de novaVersaoRegras) no formato de leitura. Serve para a vigente e para as condições novas: mesma função, nenhum número repetido.
function regrasDaVersao(v){
  var N = v.novas, G = v.gerais, pb = v.pagamentoBrinde, c2 = v.condicoes===2;
  return {
    comissaoEBrinde:{kitNormal:faixas(v.faixas), kitPrata:faixas(v.prata.faixas), abaixoDe:G.minRenovar, abaixoTexto:"Venda abaixo desse valor não tem comissão nem brinde."},
    brinde:{saldos:"Normal e Select (código BB) têm saldos separados. Não há transferência nem acúmulo. Saldo não usado é perdido.",
      arredondamento:N.brindeArredondamento==="matematico" ? "Reais inteiros, por categoria, depois de todas as penalidades. Arredondamento matemático (R$ 162,68 = R$ 163,00)." : "Reais inteiros, por categoria, depois de todas as penalidades. Arredonda para cima.",
      basePendencia:N.baseCompleta ? "Acerto completo: joias, taxa, materiais, tags e kit de apoio. Ficam fora a diferença de brinde e a multa." : "Valor do acerto: joias e taxa.",
      diferencaComPendencia:N.semExcedenteComPendencia ? "Proibida. Com valor pendente os brindes têm de caber no direito; a diferença não vira cobrança nem dívida." : "Soma no valor a pagar e é quitada por último."},
    taxaDeslocamento:{vendaAbaixoDe:G.taxaAbaixoDe, valor:v.taxaBaixa[0].taxa, atendimentoInterno:"sem taxa"},
    remarcacao:v.remarcacao.map(function(x, i){ return {vez:i+1, comissaoMenosPct:x.comissaoPct, brindeMenosPct:x.brindePct}; }),
    remarcacaoRegra:"Vale a linha da vez; as anteriores não se somam. Da última linha em diante repete. A contagem reinicia a cada kit novo.",
    acertoForaDaData:{semDescontoAteDiaUtil:N.prazoAcertoDiasUteis, descontoPctPorDiaUtil:N.atrasoPctDiaUtil, juridicoDepoisDoDiaUtil:N.juridicoDiasUteis,
      regra:"Dia útil = segunda a sexta, sem feriado de Curitiba. Conta da primeira data marcada e não recomeça na remarcação nem em mudança de data. O desconto vale para comissão e brinde e soma com a multa da remarcação. A comissão nunca fica negativa. Depois do limite: perde tudo, sem kit novo, e o caso segue para análise do Jurídico (não é automático)."},
    brindePorPendencia:pb.map(function(x){ return {pendenteAtePct:x.max, brindeLiberadoPct:Math.round(x.fator*100)}; }).concat([{pendenteAcimaDePct:pb[pb.length-1].max, brindeLiberadoPct:0}]),
    pagamento:{multaSobrePendentePct:N.multaPendentePct, multaBase:c2 ? "Todo o valor pendente ao finalizar o acerto (joias, taxa, materiais e tags). A multa não incide sobre ela mesma." : "Valor pendente do acerto (joias e taxa).",
      ordem:"Dívida mais antiga, depois o acerto, por último a diferença de brinde.", kitNovoComPagoMinimoPct:G.kitNovoMinPct, parcelasMaximo:N.parcelasMax, parcelaMinima:N.parcelaMinima, parcelaUnicaAbaixoDe:N.parcelaUnicaAbaixo,
      prazoQuitarDiasCorridos:N.prazoQuitarDias, parcelaAtrasadaPctAoDia:N.atrasoQuitacaoPctDia, parcelaAtrasadaTetoPct:N.atrasoQuitacaoTetoPct},
    vendaMinima:{mediaDasUltimasVendas:MEDIA_N, comMenosVendas:"Usa as vendas que existem.", vendaZero:"Acerto com venda zero entra na média.", referenciaRepresentante:N.minimoRepresentante, referenciaInterno:N.minimoInterno,
      abaixo:"Kit novo bloqueado.", novaChance:"Uma única vez por revendedora, registrada no acerto."},
    tags:{valorPorTagRiscadaOuExtraviada:G.taxaTagExtraviada},
    pecasProximoMes:{faixas:v.pecasProx.faixas, reducaoPorPendencia:[{pendenteAtePct:0, liberadoPct:100}].concat(v.pecasProx.reducao.map(function(x){ return {pendenteAtePct:x.ate, liberadoPct:Math.round(x.fator*100)}; })), acima:"Sem peças.", arredondamento:"Sempre para baixo."}
  };
}

function regrasAcertoOficiais(){
  var v1 = novaVersaoRegras({id:ID_REGRAS_1, vigenciaDesde:VIGENCIA_REGRAS_1}), v2 = versaoCondicoes2(), ativa2 = condicoes2Ativas(), vig = ativa2 ? v2 : v1;
  var ano = Number(ATUALIZADO_EM.slice(0, 4));
  return Object.assign({
    atualizadoEm:ATUALIZADO_EM, somenteLeitura:true,
    fonte:"Folder oficial da Sorelly (Regulamento da revendedora, atualizado em 11/11/2026) e definições da direção de 28/11/2026.",
    versaoVigente:{id:vig.id, condicoes:vig.condicoes||1, vigenciaDesde:vig.vigenciaDesde, aplicaA:ativa2 ? "Todo acerto feito a partir da data de vigência, com kit novo ou em circulação." : "Kits recebidos pela revendedora a partir de 27/10/2026.", modalidades:["Kit Normal (Ouro)", "Kit 100% Prata"], canais:["Representante", "Atendimento interno"]},
    vigencia:ativa2 ? "Acertos feitos a partir de "+VIGENCIA_CONDICOES_2+"." : "Kits recebidos pela revendedora a partir de 27/10/2026. Vale para acerto com representante e atendimento interno, Kit Normal e Kit 100% Prata."},
    regrasDaVersao(vig), {
    // CONDIÇÕES DE 28/11/2026: aprovadas pela direção. "ativas" diz se já valem. Enquanto não valem, a conta usa a versão vigente acima.
    condicoesNovas:Object.assign({id:v2.id, ativas:ativa2, vigenciaDesde:VIGENCIA_CONDICOES_2, situacao:ativa2 ? "Em vigor." : "Aprovadas pela direção. Aguardam homologação jurídica e autorização de publicação.",
      aplicaA:"Próximos acertos a partir da data de vigência, com kit novo ou em circulação. Acerto já finalizado não é recalculado."}, regrasDaVersao(v2)),
    penalidades:{quemDefine:"O sistema. A representante informa os fatos (data original, remarcações, quem causou, motivo, prova) e não altera percentuais.",
      responsaveis:RESPONSAVEIS.map(function(r){ return {id:r.id, nome:r.nome, pesaMulta:r.pesa, exigeProva:!!r.prova}; }), motivosDeIsencao:MOTIVOS_ISENCAO,
      isencao:"Ocorrência causada pela representante, pela Sorelly ou por motivo sério com prova não pesa. Aviso com 10 dias ou mais não pesa, uma vez por kit.",
      historico:"Toda correção guarda: valor anterior, valor corrigido, justificativa, quem, data e hora e origem (automática ou manual).",
      feriadosDoAno:Object.keys(feriadosDe(ano)).sort().map(function(d){ return {data:d, nome:feriadosDe(ano)[d]}; })},
    definicoes:[
      "Joia não devolvida no acerto é considerada vendida, respeitadas as etapas de trocas e garantias.",
      "Material sujeito a cobrança (MP, MU, maleta, bolsa, expositor, kit de apoio) é conferido pela bipagem. Não bipado é cobrado pelo valor inteiro, sem comissão e sem desconto. Não existe segunda confirmação.",
      "Materiais e tags entram no valor a pagar. Não entram na venda, na faixa de comissão, no brinde nem na média de vendas.",
      "A diferença de uma troca, para mais ou para menos, altera a venda comissionável.",
      "O crédito de garantia reduz a venda antes da faixa, da comissão e do brinde. Crédito maior que a venda não é consumido: a sobra fica para uso futuro.",
      "Tudo que foi cobrado no acerto e não foi pago é dívida da revendedora na Inadimplência: joias, taxa, multas, tags e materiais.",
      "A revendedora escolhe os brindes antes de pagar. Essa escolha é provisória: com pagamento lançado, o direito segue a tabela de pendência e muda a cada pagamento.",
      "Brinde sem direito não é entregue e não gera dívida. O acerto parcial fecha depois que a escolha de brindes é acertada.",
      "Dívida anterior é quitada primeiro. O valor usado na dívida anterior não conta como pagamento do acerto atual.",
      "Acertos já finalizados não são recalculados. Cada acerto guarda a versão das regras e a memória de cálculo."],
    formulas:[
      "vendaComissionavel = vendaDigitada + diferencaDasTrocas - creditoDeGarantiaUsado (nunca abaixo de zero)",
      "comissaoPct = max(0, pctDaFaixa - perdaDaRemarcacao - perdaDoAtraso); comissao = vendaComissionavel x comissaoPct",
      "valorDoAcerto = vendaComissionavel - comissao + taxaDeDeslocamento",
      "brinde = arredonda(brindeDaFaixa x (1 - (remarcacaoPct + atrasoPct) / 100) x fatorDaPendencia), por categoria",
      "pendente = baseDaPendencia - pagoNoAcerto; pagoNoAcerto = totalPago - valorUsadoNaDividaAnterior",
      "multa = pendente x multaPct (só com o acerto finalizado, com acordo ou com recusa de negociar)",
      "valorAPagar = valorDoAcerto + materiais + tags + diferencaDeBrinde + multa",
      "divida = valorAPagar - pagoNoAcerto"],
    contaOficial:{calculo:"calcularAcerto (domain/consignado.js)", tela:"derivarAcerto (domain/acerto-derivado.js)", registro:"contaDoRegistro (domain/acerto-derivado.js)", conferencia:"conferirRegistro (domain/acerto-derivado.js)", divida:"devidoDe, pagoDe e faltaDe (domain/comissoes.js)", ocorrencias:"domain/ocorrencias-acerto.js"}
  });
}

export { ATUALIZADO_EM, regrasAcertoOficiais, regrasDaVersao };
