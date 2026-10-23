// Sorelly Admin · montagem e bipagem — domain/consignado.js
// Regras de comissão, brinde e remarcação do consignado (revendedoras) e cálculo do acerto.
// Cada kit "carimba" a versão de regras vigente no momento em que é criado (ver reducer ADD_KIT);
// o acerto daquele kit sempre usa a versão carimbada, mesmo que as regras já tenham mudado.
// Tudo que é número de regra mora dentro da versão (editável na tela admin "Regras do consignado" e lido pelo app).

// Régua oficial de comissão e brinde: faixa de venda líquida → comissão e brindes. O teto de cada faixa inclui o centavo.
var FAIXAS_OFICIAIS = [
  {min:300,  pct:15, bn:0,   bb:0},
  {min:500,  pct:25, bn:48,  bb:68},
  {min:700,  pct:30, bn:88,  bb:96},
  {min:1000, pct:35, bn:118, bb:122},
  {min:1600, pct:40, bn:196, bb:144},
  {min:2500, pct:40, bn:312, bb:188},
  {min:5000, pct:45, bn:368, bb:232},
  {min:7000, pct:45, bn:442, bb:282}
];

// Remarcação: desconto na comissão (pontos percentuais) e no brinde (% proporcional em cada categoria, Normal e BB).
// "Vez" reinicia a cada kit novo e só conta remarcações SEM isenção (cada remarcação pode ser marcada isenta, com motivo —
// ex.: falecimento na família — e nesse caso não pesa nem avança a escada abaixo). Da última linha em diante repete.
var REMARCACAO = [
  {comissaoPct:5, brindePct:15},
  {comissaoPct:8, brindePct:50},
  {comissaoPct:15, brindePct:100}
];

// Pagamento do acerto: tem que ser integral. "max" = % que faltou pagar até o qual aquele fator de brinde vale;
// acima da última linha não tem direito a brindes.
var FATOR_BRINDE_PAGAMENTO = [{max:0, fator:1}, {max:5, fator:0.8}, {max:10, fator:0.5}];
function fatorBrindePagamento(pctFaltante, tabela){
  var f = (tabela || FATOR_BRINDE_PAGAMENTO).find(function(x){ return pctFaltante<=x.max; });
  return f ? f.fator : 0;
}

// Taxa de deslocamento: cobrada em venda líquida abaixo de "taxaAbaixoDe" (gerais), pela faixa. Soma no que ela paga.
var TAXA_BAIXA_VENDA = [{min:0, taxa:35}];   // 07/10/2026 (Marcus): taxa só abaixo de R$ 300, R$ 35 fixo; a faixa de R$ 20 saiu
function taxaBaixaVenda(vendaLiquida, versao){
  var g = (versao && versao.gerais) || REGRAS_GERAIS_OFICIAIS;
  if(vendaLiquida >= (g.taxaAbaixoDe!=null ? g.taxaAbaixoDe : 500)) return 0;   // venda 0 (informada) também paga a taxa; quem não informou venda nem chega aqui (ver calcularAcerto)
  var tab = ((versao && versao.taxaBaixa) || TAXA_BAIXA_VENDA).slice().sort(function(a,b){return b.min-a.min;});
  var f = tab.find(function(x){ return vendaLiquida>=x.min; });
  return f ? f.taxa : 0;
}

// Contas usadas pra registrar como a revendedora pagou o acerto — a "Descrição" é o código oficial da conta, vira coluna
// no Consolidado. Lista oficial passada pela Sorelly (uma por forma de pagamento, na tela "Lançar um pagamento").
var CONTAS_PAGAMENTO = {
  pix: ["PIX - POINT","PIX - ITAÚ - 59","PIX H&O","PIX - SAFRA - SERENITY - 59","PIX - DEVMASTER","PIX - CAIXA - 46",
    "PIX - BANHO","PIX - SAFRA - SHOPPING - 46","PIX - TUCANO","PIX - STONE - 46","PIX - 3D ACRILICOS","PIX - UNICRED - 46",
    "PIX CHARME","PIX - SICREDI - SHOPPING 46","PIX ELLOS BRUTOS","PIX - CAIXA ECONÔMICA - ANAMARIA","PIX ART ELLO",
    "PIX - SANTANDER - ANAMARIA","PIX - MADEIRA COR","PIX - LUCAS - PF","PIX PRESTADORES DE SERVIÇOS","PIX - ANA BEATRIZ - PF",
    "PIX LINDA","PIX - MARCUS HESS - PF","PIX - OFFICE GRAF LTDA","PIX - ITAÚ PJ - MARCO","PIX REPRESENTANTES",
    "PIX - ITAÚ PF - MARCO ANTÔNIO","PIX - SICREDI - AXIS","PIX SAFRA 34","PIX - SICREDI - SERENITY - 59","CAIXA ECONÔMICA HABITAÇÃO"].map(function(l){return {id:l, label:l};}),
  // Pix que a revendedora mandou direto para a representante: sem conta da empresa. O financeiro diz de qual representante é (Comissões) e já dá como pago.
  pix_representante: ["PIX REPRESENTANTE"].map(function(l){return {id:l, label:l};}),
  link: ["LINK - SICREDI - SERENITY - 59","LINK - SICREDI - SORELLY - 46","LINK - SICREDI - SORELLY - 34"].map(function(l){return {id:l, label:l};}),
  credito: ["CRÉDITO - SICREDI - SERENITY - 59","CRÉDITO - BRADESCO CIELO - SERENITY - 59","CRÉDITO - SAFRA - SERENITY 59",
    "CRÉDITO - ITAÚ - SERENITY","CRÉDITO - SAFRA - 46","CRÉDITO - GETNET - P","CRÉDITO - CIELO - P",
    "CRÉDITO - SICREDI - SORELLY - 34","CRÉDITO - SAFRA - SORELLY - 34"].map(function(l){return {id:l, label:l};}),
  debito: ["DÉBITO - CIELO - P","DÉBITO - SICREDI - SERENITY - 59","DÉBITO - BRADESCO CIELO - SERENITY - 59",
    "DÉBITO - ITAÚ - SERENITY","DÉBITO - SAFRA - SERENITY 59","DÉBITO - SAFRA - 46","DÉBITO - GETNET - P",
    "DÉBITO - SAFRA - SORELLY - 34"].map(function(l){return {id:l, label:l};}),
  dinheiro: ["DINHEIRO"].map(function(l){return {id:l, label:l};}),
  acerto_loja: ["ACERTO - LOJA","ACERTO - LOJA INTERNO"].map(function(l){return {id:l, label:l};})
};
var FORMA_LABEL = {pix:"Pix", pix_representante:"Pix representante", link:"Link de pagamento", credito:"Cartão de crédito", debito:"Cartão de débito", dinheiro:"Dinheiro", acerto_loja:"Acerto com loja"};
var PARCELAS_CARTAO = [1,2,3,4,5,6]; // só pro Cartão de crédito; o valor lançado entra inteiro, o app não divide pelas parcelas

// Formas de pagamento no formato que o estado guarda (editável em Representantes → Configurações): cada forma tem nome,
// se pede parcelas (só cartão de crédito) e a lista de descrições (códigos oficiais das contas).
function formasPagamentoPadrao(){
  return Object.keys(FORMA_LABEL).map(function(k){
    return {k:k, label:FORMA_LABEL[k], parcelas:k==="credito", descricoes:CONTAS_PAGAMENTO[k].map(function(c){ return c.label; })};
  });
}
function reais(n){ return "R$ "+Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}); }

function contasLista(){
  var out = [];
  Object.keys(CONTAS_PAGAMENTO).forEach(function(forma){
    CONTAS_PAGAMENTO[forma].forEach(function(c){ out.push({forma:forma, id:c.id, label:FORMA_LABEL[forma]+" · "+c.label}); });
  });
  return out;
}
function totalPago(pagamentos){ return (pagamentos||[]).reduce(function(t,p){return t+(p.valor||0);}, 0); }

var REGRAS_GERAIS_OFICIAIS = {
  minRenovar:300,          // abaixo disso não existe faixa: comissão zero
  taxaAbaixoDe:300,        // venda líquida abaixo disso paga taxa de deslocamento (ver TAXA_BAIXA_VENDA)
  kitNovoMinPct:80,        // % do acerto já pago a partir do qual o kit novo sai sem autorização do financeiro
  taxaTagExtraviada:5,     // por tag riscada ou extraviada
  pecaSemEtiquetaVendida:true // peça sem etiqueta é considerada vendida
};

// ── KIT 100% PRATA: segunda modalidade, com régua, brindes e regras próprias (+5% de comissão em todas as faixas) ──
// Fica dentro da versão (v.prata) e é editada na mesma tela do Kit padrão. O Kit padrão não muda.
var PRATA_FAIXAS = [
  {min:300,  pct:20, bn:0,   bb:38},
  {min:500,  pct:30, bn:44,  bb:56},
  {min:700,  pct:35, bn:74,  bb:82},
  {min:1000, pct:40, bn:112, bb:96},
  {min:1600, pct:45, bn:188, bb:122},
  {min:2500, pct:45, bn:282, bb:168},
  {min:5000, pct:50, bn:344, bb:224},
  {min:7000, pct:50, bn:422, bb:262}
];
var PRATA_PADRAO = {
  faixas:PRATA_FAIXAS,
  // cancelamento no dia do acerto = −5% da comissão (sem desconto de brinde); atraso = −1% por dia (gerais.atrasoPctDia)
  remarcacao:[{comissaoPct:5, brindePct:0}],
  // brinde só depois do pagamento INTEGRAL: qualquer falta, sem brinde
  pagamentoBrinde:[{max:0, fator:1}],
  taxaBaixa:[{min:0, taxa:35}],
  gerais:{minRenovar:300, taxaAbaixoDe:300, atrasoPctDia:1, parcelaMinimaCredito:80, exigeMinimoRenovar:true, acordoLiberaBrinde:false,
    agendarAntecedenciaDias:5, reagendarAntecedenciaDias:10, trocaModalidadeDias:10}
};
var MODALIDADE_LB = {padrao:"Kit padrão", prata:"Kit 100% Prata"};
// modalidade da revendedora (fica no cadastro dela, não precisa marcar a cada acerto)
function modalidadeDe(s, rev){ return ((s.perfisRev||{})[rev]||{}).modalidade === "prata" ? "prata" : "padrao"; }

// Peças liberadas para o próximo mês: quantidade-base pelo VALOR DA VENDA, reduzida pelo % do acerto que ficou em aberto.
// O valor das peças escolhidas não entra na conta, só a quantidade.
var PECAS_PROX_PADRAO = {
  faixas:[{min:1000, qtd:10}, {min:2000, qtd:15}, {min:3000, qtd:20}, {min:5000, qtd:35}],
  reducao:[{ate:5, fator:0.75}, {ate:10, fator:0.5}]   // quitado (≤ R$ 0,01 em aberto) = 100%; acima da última linha = 0 peças
};
function pecasProximoMes(venda, valorAcerto, emAberto, cfg){
  cfg = cfg || PECAS_PROX_PADRAO;
  var faixa = cfg.faixas.slice().sort(function(a,b){return b.min-a.min;}).find(function(f){return venda>=f.min;});
  var base = faixa ? faixa.qtd : 0;
  var pct = valorAcerto>0 ? Math.max(0, emAberto)/valorAcerto*100 : 0;
  var fator = emAberto<=0.01 ? 1 : 0;
  if(emAberto>0.01){ var r = cfg.reducao.slice().sort(function(a,b){return a.ate-b.ate;}).find(function(x){return pct<=x.ate;}); fator = r ? r.fator : 0; }
  return {base:base, pctAberto:pct, fator:fator, liberadas:Math.floor(base*fator+1e-9)};
}
var SCHEMA_REGRAS = 7;   // 7 = taxa só abaixo de R$ 300 (R$ 35); antes 6 = faixa de R$ 20 de 300 a 499,99

function copia(x){ return JSON.parse(JSON.stringify(x)); }
function novaVersaoRegras(campos, anteriorId){
  return Object.assign({
    id:"rv"+Date.now(),
    schema:SCHEMA_REGRAS,
    vigenciaDesde:new Date().toISOString().slice(0,10),
    anteriorId:anteriorId||null,
    faixas:copia(FAIXAS_OFICIAIS),
    remarcacao:copia(REMARCACAO),
    pagamentoBrinde:copia(FATOR_BRINDE_PAGAMENTO),
    taxaBaixa:copia(TAXA_BAIXA_VENDA),
    gerais:copia(REGRAS_GERAIS_OFICIAIS),
    prata:copia(PRATA_PADRAO),
    pecasProx:copia(PECAS_PROX_PADRAO)
  }, campos||{});
}
// Versão guardada por uma tela antiga (localStorage) não tem os campos novos: completa com o padrão oficial.
// Schema 3 já tinha o Kit padrão (possivelmente editado no admin): só ganha o bloco do Kit 100% Prata.
// Antes disso as versões eram só o padrão, então são trocadas inteiras pelo padrão atual.
function normalizarVersao(v){
  if(v && v.schema===SCHEMA_REGRAS) return v;
  var corrigeTaxa = function(x){ return Object.assign({}, x, {taxaBaixa:copia(TAXA_BAIXA_VENDA), gerais:Object.assign({}, x.gerais, {taxaAbaixoDe:300})}); };
  if(v && v.schema===6) return corrigeTaxa(Object.assign({}, v, {schema:SCHEMA_REGRAS}));
  if(v && v.schema===5) return corrigeTaxa(Object.assign({}, v, {schema:SCHEMA_REGRAS}));
  if(v && v.schema===4) return corrigeTaxa(Object.assign({}, v, {schema:SCHEMA_REGRAS, pecasProx:copia(PECAS_PROX_PADRAO)}));
  if(v && v.schema===3) return corrigeTaxa(Object.assign({}, v, {schema:SCHEMA_REGRAS, prata:copia(PRATA_PADRAO), pecasProx:copia(PECAS_PROX_PADRAO)}));
  var d = novaVersaoRegras();
  return Object.assign({}, v, {schema:SCHEMA_REGRAS, faixas:d.faixas, remarcacao:d.remarcacao, pagamentoBrinde:d.pagamentoBrinde, taxaBaixa:d.taxaBaixa, gerais:d.gerais, prata:d.prata, pecasProx:d.pecasProx});
}
// Versão "efetiva" para a modalidade: monta, no mesmo formato que o cálculo já usa, a régua/brindes/taxa/remarcação da modalidade.
// Kit padrão devolve a versão como está.
function versaoEfetiva(v, modalidade){
  if(!v) return v;
  if(modalidade==="prata" && v.prata){
    return Object.assign({}, v, {faixas:v.prata.faixas, remarcacao:v.prata.remarcacao, pagamentoBrinde:v.prata.pagamentoBrinde, taxaBaixa:v.prata.taxaBaixa,
      gerais:Object.assign({}, v.gerais, v.prata.gerais), modalidade:"prata"});
  }
  return Object.assign({}, v, {modalidade:"padrao"});
}

function versaoVigente(s){
  var rc = s.regrasConsignado; if(!rc) return null;
  return (rc.versoes||[]).find(function(v){return v.id===rc.atualId;}) || null;
}

function versaoDoKit(s, kit){
  var rc = s.regrasConsignado; if(!rc) return versaoVigente(s);
  return (rc.versoes||[]).find(function(v){return v.id===kit.regrasVersaoId;}) || versaoVigente(s);
}

function faixaPor(vendaLiquida, versao){
  if(!versao || !vendaLiquida || vendaLiquida < versao.gerais.minRenovar) return null;
  return versao.faixas.slice().sort(function(a,b){return b.min-a.min;}).find(function(f){return vendaLiquida>=f.min;}) || null;
}

// vez: quantas remarcações SEM isenção este kit já teve (remarcações isentas não contam nem avançam a escada).
function descontoRemarcacao(vez, versao){
  if(!vez || vez<1) return {comissaoPct:0, brindePct:0};
  var lista = versao.remarcacao;
  return lista[Math.min(vez, lista.length)-1];
}
// Conta quantas remarcações de uma lista (ver kit.remarcacoesLista) pesam multa, ou seja, não foram marcadas isentas.
function vezCobravel(remarcacoesLista){ return (remarcacoesLista||[]).filter(function(r){ return !r.isenta; }).length; }

// Calcula o acerto de um kit de revenda normal (não vale para reposição/expositor, que têm comissão fixa/manual).
// entrada: {vendaBruta, devolvida, garantia, vez, valorPago}. vez = vezCobravel(kit.remarcacoesLista).
// valorPago null/undefined = assume pago integral (ainda não informado); pra bloquear brinde de verdade, informe o valor realmente pago.
// valorDevido = valorAcerto + taxa de deslocamento: é o que a revendedora precisa pagar (base de falta, % pago e brinde).
function calcularAcerto(entrada, versao){
  var vendaLiquida = Math.max(0, (entrada.vendaBruta||0) - (entrada.devolvida||0) - (entrada.garantia||0));
  var faixa = faixaPor(vendaLiquida, versao);
  var desc = faixa ? descontoRemarcacao(entrada.vez||0, versao) : {comissaoPct:0, brindePct:0};
  // atraso (Kit 100% Prata): −atrasoPctDia% de comissão por dia de atraso, além da remarcação
  var atrasoPct = faixa ? Math.max(0, entrada.atrasoDias||0) * (versao.gerais.atrasoPctDia||0) : 0;
  var comissaoPct = faixa ? Math.max(0, faixa.pct - desc.comissaoPct - atrasoPct) : 0;
  var comissao = Math.round(vendaLiquida * comissaoPct / 100 * 100)/100;
  var valorAcerto = Math.round((vendaLiquida-comissao)*100)/100;
  var taxa = (entrada.semTaxa || entrada.vendaBruta==null) ? 0 : taxaBaixaVenda(vendaLiquida, versao);   // atendimento interno: sem taxa de deslocamento (ela vem até a empresa)
  var valorDevido = Math.round((valorAcerto+taxa)*100)/100;
  var valorPago = entrada.valorPago!=null ? entrada.valorPago : valorDevido;
  var pctFaltante = valorDevido>0 ? Math.max(0, (valorDevido-valorPago)/valorDevido*100) : 0;
  var fatorPagamento = fatorBrindePagamento(pctFaltante, versao.pagamentoBrinde);
  var fatorBrinde = fatorPagamento * Math.max(0, 1 - desc.brindePct/100);
  var brindeNormal = faixa ? Math.ceil(faixa.bn * fatorBrinde - 1e-9) : 0;     // peça não tem centavo: arredonda para cima, a favor da revendedora
  var brindeSelect = faixa ? Math.ceil(faixa.bb * fatorBrinde - 1e-9) : 0;
  return {vendaLiquida:vendaLiquida, faixa:faixa, comissaoPct:comissaoPct, comissao:comissao,
    brindeNormal:brindeNormal, brindeSelect:brindeSelect, valorAcerto:valorAcerto, taxaDeslocamento:taxa, valorDevido:valorDevido,
    descontoRemarcacao:desc, atrasoPct:atrasoPct, pctFaltante:pctFaltante, fatorPagamento:fatorPagamento, semFaixa:!faixa,
    // Prata: abaixo do mínimo só cobra as peças vendidas e NÃO fornece kit novo
    podeRenovar: !(versao.gerais.exigeMinimoRenovar) || !!faixa};
}

// BB NÃO é só brinco: é o PREFIXO do código. Toda peça que começa com BB (brinco, anel, colar, pulseira...) é brinde Select. Frase única, usada em todas as telas.
var AVISO_BB = "BB não é só brinco: toda peça cujo código começa com BB (brinco, anel, colar, pulseira…) é brinde Select.";

// Código de brinde. Select (BB) só aceita BB, ou BB + 1 ou 2 letras (BBA, BBCL, BBP, BBT...), e sempre 4 números no final.
// Normal aceita qualquer código (pode ser peça normal ou BB).
function normalizarCodigo(c){ return String(c||"").toUpperCase().replace(/[^A-Z0-9]/g,""); }
// Código de peça: no máximo 4 letras seguidas de no máximo 7 números (o que passar disso é cortado enquanto digita)
function limitarCodigo(c){ var m = normalizarCodigo(c).match(/^([A-Z]{0,4})([0-9]{0,7})/); return m ? m[1]+m[2] : ""; }
function codigoPecaValido(c){ return /^[A-Z]{1,4}[0-9]{1,7}$/.test(normalizarCodigo(c)); }
function codigoBrindeValido(cat, codigo){
  var c = normalizarCodigo(codigo);
  if(cat==="bb") return /^BB[A-Z]{0,2}\d{1,7}$/.test(c);
  return codigoPecaValido(c);
}
// Confere os brindes lançados contra o que foi liberado. O que passa do Select (BB) é abatido do Normal (o Normal aceita BB também);
// o que passa do Normal inteiro é excedente e entra no total a pagar.
function conferirBrindes(lancados, libNormal, libSelect){
  var soma = function(cat){ return (lancados||[]).filter(function(b){return b.cat===cat;}).reduce(function(t,b){return t+(b.valor||0);}, 0); };
  var r2 = function(n){ return Math.round(n*100)/100; };
  var sumN = soma("normal"), sumB = soma("bb");
  var passouSelect = Math.max(0, sumB-libSelect);
  var usadoNormal = sumN + passouSelect;
  var saldoNormal = Math.max(0, libNormal - sumN);
  return {lancadoNormal:r2(sumN), lancadoSelect:r2(sumB), usadoNormal:r2(usadoNormal), saldoNormal:r2(saldoNormal),
    restanteNormal:r2(Math.max(0, libNormal-usadoNormal)), restanteSelect:r2(Math.max(0, libSelect+saldoNormal-sumB)),
    excedente:r2(Math.max(0, usadoNormal-libNormal))};
}

// Regras em frases curtas, geradas da versão em vigor (nunca digitadas à mão): é o que a representante lê pra revendedora,
// regra por regra, na entrega do kit novo, e o que aparece resumido na assinatura do acerto.
function textoRegras(v, modalidade){
  if(modalidade==="prata" && v.prata) return textoRegrasPrata(v);
  var g = v.gerais, asc = v.faixas.slice().sort(function(a,b){return a.min-b.min;});
  var pcts = asc.map(function(f){return f.pct;}), minP = Math.min.apply(null, pcts), maxP = Math.max.apply(null, pcts);
  var taxas = (v.taxaBaixa||[]).slice().sort(function(a,b){return a.min-b.min;});
  var taxaTxt = taxas.map(function(t,i){ var prox = taxas[i+1], fim = (prox ? prox.min : g.taxaAbaixoDe)-0.01;
    return (t.min<=0 ? "até "+reais(fim) : "de "+reais(t.min)+" a "+reais(fim))+": "+reais(t.taxa); }).join(" · ");
  var rem = v.remarcacao.map(function(t,i,arr){ return (i+1)+"ª vez"+(i===arr.length-1?" em diante":"")+": comissão −"+t.comissaoPct+"% e brinde −"+t.brindePct+"%"; }).join(" · ");
  var tab = v.pagamentoBrinde || [];
  var parc = tab.filter(function(t){return t.max>0;});
  var pag = parc.map(function(t,i){ var ant = i>0 ? parc[i-1].max : null;
    return "faltou "+(ant ? "de "+ant+"% até " : "até ")+t.max+"%: "+Math.round(t.fator*100)+"% do brinde"; }).join(" · ");
  var teto = tab.length ? tab[tab.length-1].max : 10;
  return [
    {t:"Comissão", x:"A comissão vai de "+minP+"% a "+maxP+"% conforme a venda líquida (a partir de "+reais(g.minRenovar)+"). Abaixo disso não tem comissão."},
    {t:"Taxa de deslocamento", x:"Venda abaixo de "+reais(g.taxaAbaixoDe)+" paga uma taxa fixa, que soma no valor do acerto — "+taxaTxt+"."},
    {t:"Remarcação", x:"Remarcar o acerto tira comissão e brinde — "+rem+". Remarcação com motivo justificado não conta."},
    {t:"Pagamento", x:"O acerto precisa ser pago por inteiro. Se faltar, o brinde diminui — "+(pag||"sem desconto")+" · faltou mais de "+teto+"%: sem brinde."},
    {t:"Negociação", x:"Faltando valor, dá para negociar parcelas que fechem o valor exato. Se não quiser negociar: sem brinde e a nota promissória é executada em 48h úteis."},
    {t:"Brinde", x:"Existem o brinde Normal e o Select (BB). BB não é só brinco: toda peça cujo código começa com BB (brinco, anel, colar, pulseira…) é Select. O brinde só é entregue depois do pagamento e precisa ser retirado com a representante NA HORA DO ACERTO: peça que não estiver nesse momento é considerada vendida. O que passar do valor liberado soma no total a pagar."},
    {t:"Kit novo", x:"Com "+g.kitNovoMinPct+"% ou mais do acerto pago, o kit novo é liberado. Abaixo disso precisa de autorização do financeiro."},
    {t:"Peças", x:(g.pecaSemEtiquetaVendida ? "Peça sem etiqueta é considerada vendida. " : "")+"Cada tag riscada ou extraviada custa "+reais(g.taxaTagExtraviada)+". O que não foi vendido volta para a empresa."}
  ];
}

// Regulamento do Kit 100% Prata, em frases geradas da versão (mesma ideia do textoRegras do Kit padrão).
function textoRegrasPrata(v){
  var p = v.prata, g = p.gerais, asc = p.faixas.slice().sort(function(a,b){return a.min-b.min;});
  var pcts = asc.map(function(f){return f.pct;});
  var rem = (p.remarcacao[0]||{}).comissaoPct || 0;
  return [
    {t:"Kit 100% Prata", x:"Modalidade só com peças de prata. Comissão "+Math.min.apply(null,pcts)+"% a "+Math.max.apply(null,pcts)+"% conforme a venda líquida, a partir de "+reais(g.minRenovar)+"."},
    {t:"Peças fora do acerto", x:"Toda peça que não estiver no acerto é considerada vendida. Peça sem etiqueta também. Tag riscada ou extraviada: "+reais(v.gerais.taxaTagExtraviada)+" cada."},
    {t:"Mínimo para renovar", x:"Com vendas abaixo de "+reais(g.minRenovar)+" cobra só as peças vendidas e não fornece kit novo."},
    {t:"Taxa de deslocamento", x:"Vendas abaixo de "+reais(g.taxaAbaixoDe)+" pagam taxa fixa de "+reais(((p.taxaBaixa||[])[0]||{}).taxa)+"."},
    {t:"Brindes e prêmios", x:"Brindes só depois da confirmação do pagamento integral. Prêmios só para revendedoras sem pendências e em dia."},
    {t:"Formas de acerto", x:"Dinheiro, transferência, Pix, cartão de débito ou crédito em até 6x sem juros, com parcela mínima de "+reais(g.parcelaMinimaCredito)+"."},
    {t:"Agendamento", x:"O acerto deve ser agendado com no mínimo "+g.agendarAntecedenciaDias+" dias de antecedência. Reagendar: pelo menos "+g.reagendarAntecedenciaDias+" dias antes da data original, sujeito a disponibilidade."},
    {t:"Cancelamento e atraso", x:"Cancelar no dia do acerto: −"+rem+"% da comissão. Atraso: −"+g.atrasoPctDia+"% de comissão por dia."},
    {t:"Troca de modalidade", x:"Para trocar de modalidade, avise com pelo menos "+g.trocaModalidadeDias+" dias de antecedência."}
  ];
}

// Diff simples entre duas versões, para o folder virtual marcar "atualizado em" por item.
function diffVersoes(atual, anterior){
  if(!anterior) return {faixas:atual.faixas.map(function(){return true;}), gerais:{}};
  var faixas = atual.faixas.map(function(f){
    var ant = anterior.faixas.find(function(a){return a.min===f.min;});
    return !ant || ant.pct!==f.pct || ant.bn!==f.bn || ant.bb!==f.bb;
  });
  var gerais = {};
  Object.keys(atual.gerais).forEach(function(k){ gerais[k] = anterior.gerais[k]!==atual.gerais[k]; });
  return {faixas:faixas, gerais:gerais};
}

export { AVISO_BB, FAIXAS_OFICIAIS, REMARCACAO, FATOR_BRINDE_PAGAMENTO, TAXA_BAIXA_VENDA, REGRAS_GERAIS_OFICIAIS, CONTAS_PAGAMENTO, FORMA_LABEL, PARCELAS_CARTAO, novaVersaoRegras, normalizarVersao, versaoVigente, versaoDoKit,
  faixaPor, descontoRemarcacao, vezCobravel, fatorBrindePagamento, taxaBaixaVenda, calcularAcerto, normalizarCodigo, limitarCodigo, codigoPecaValido, codigoBrindeValido, conferirBrindes, diffVersoes, contasLista, totalPago,
  formasPagamentoPadrao, reais, textoRegras, textoRegrasPrata, pecasProximoMes, PECAS_PROX_PADRAO, versaoEfetiva, modalidadeDe, MODALIDADE_LB, PRATA_PADRAO };
