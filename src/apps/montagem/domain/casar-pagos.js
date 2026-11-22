// Sorelly Admin · montagem — domain/casar-pagos.js
// CRUZAMENTO EXATO DEVMASTER x PAGAMENTOS A FORNECEDORES (Marcus, 20/11/2026: "o Admin tem que olhar a DevMaster e dar baixa aqui sozinho").
// Problema: o fornecedor é pago e a planilha (Pagamentos a fornecedores) marca a parcela como Pago, mas a DevMaster só ganha a baixa depois, e a Contas a pagar mostrava a conta como se ainda fosse devida.
// Regra: um título ABERTO da DevMaster casa com uma parcela JÁ PAGA do Admin quando tem o MESMO fornecedor, o MESMO tipo (Pix, boleto, cheque ou cartão), o MESMO valor (até 1 centavo)
// e o vencimento do título cai entre 3 dias antes e 12 dias depois da data da parcela. Cada parcela casa com UM título só (o de vencimento mais próximo).
// Por que só 12 dias: fatura em parcelas iguais (ex.: 6 x R$ 441,90) tem o mesmo valor todo mês. Com janela larga, o Pix do mês passado baixaria a parcela do mês que vem. Testado em 20/11/2026 com dados reais: 15 casamentos certos (o mais longe, 9 dias) e 4 errados com 30 dias.
// Parcela sem casamento fica como está (a conta continua visível): errar para o lado seguro.
// O título casado vira PAGO ("falta baixa na DevMaster"): sai do A pagar, entra no Pago do mês em que foi pago, e a coluna "Na DevMaster" avisa o que falta baixar lá.
// Quando a DevMaster der a baixa, o título deixa de estar aberto lá e esta regra para de agir sozinha (a baixa da DevMaster vale).
// Puro: não lê tela nem servidor. Quem monta as parcelas pagas é setPf (contas-empresa.js).

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var semAc = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim(); };
var dias = function(iso){ var p = String(iso||"").slice(0,10).split("-"); return Date.UTC(+p[0], (+p[1])-1, +p[2])/86400000; };

// tipo do título da DevMaster: pelo nome da natureza ("PIX BANHO PONTUAL", "BOLETO POINT"...). "outro" não casa (só casa o que se sabe ao certo).
function tipoDoTitulo(i){
  var t = String(i.natNome||"")+" "+String(i.nome||"");
  return /PIX/i.test(t) ? "pix" : /CHEQUE/i.test(t) ? "cheque" : /BOLETO/i.test(t) ? "boleto" : /CART[ÃA]O/i.test(t) ? "cartao" : "outro";
}
// tipo da parcela do Admin: pelo campo forma ("pix_revendedora", "pix_empresa", "boleto", "cheque", "cartao")
function tipoDaParcela(forma){
  var f = String(forma||""); return /^pix/.test(f) ? "pix" : f==="cheque" ? "cheque" : f==="boleto" ? "boleto" : /^cart/.test(f) ? "cartao" : "outro";
}
var JANELA_DEPOIS = 12;
var NOME_TIPO ={pix:"Pix", boleto:"Boleto", cheque:"Cheque", cartao:"Cartão"};

// por canon: até que data o Pix lançado um a um já está contado pelo cruzamento (aplicarPf não pode contar de novo)
var COBERTO_ATE = {};
function cobertoAte(canon){ return COBERTO_ATE[semAc(canon)] || ""; }

/**
 * l = itens da Contas a pagar (já com as baixas do Admin); parcelas = [{id, canon, venc, valor, tipo, ped}] só as PAGAS.
 * Devolve a mesma lista, com os títulos casados trocados por itens "pago" (faltaBaixaDm:true).
 */
function casarPagos(l, parcelas){
  COBERTO_ATE = {};
  if(!parcelas || !parcelas.length) return l;
  var por = {}; parcelas.forEach(function(p){ var k = semAc(p.canon); (por[k] = por[k] || []).push(p); });
  var candidatos = [];
  l.forEach(function(i, k){ if(i.status==="apagar" && i.origem!=="pf" && !i.manual && i.fornCanon && por[semAc(i.fornCanon)] && tipoDoTitulo(i)!=="outro") candidatos.push(k); });
  if(!candidatos.length) return l;
  candidatos.sort(function(a, b){ return String(l[a].venc).localeCompare(String(l[b].venc)) || l[a].valor-l[b].valor; });
  var out = l.slice(), usadas = {}, mudou = false;
  candidatos.forEach(function(k){
    var i = l[k], ps = por[semAc(i.fornCanon)], t = tipoDoTitulo(i), melhor = null;
    ps.forEach(function(p){
      if(usadas[p.id] || p.tipo!==t || Math.abs(p.valor-i.valor)>0.011) return;
      var d = dias(i.venc)-dias(p.venc); if(d<-3 || d>JANELA_DEPOIS) return;
      var a = Math.abs(d); if(!melhor || a<melhor.a) melhor = {p:p, a:a};
    });
    if(!melhor) return;
    var p = melhor.p; usadas[p.id] = 1; mudou = true;
    out[k] = Object.assign({}, i, {status:"pago", baixa:p.venc, mes:String(p.venc).slice(0,7), outroMes:String(i.venc).slice(0,7)!==String(p.venc).slice(0,7), atraso:0, valorTitulo:i.valorTitulo==null ? i.valor : i.valorTitulo,
      faltaBaixaDm:true, pagoPed:p.ped, formaTxt:NOME_TIPO[t] || "—", saidaTxt:"Pagamentos a fornecedores"});
    var c = semAc(i.fornCanon); if(p.venc>(COBERTO_ATE[c]||"")) COBERTO_ATE[c] = p.venc;
  });
  return mudou ? out : l;
}

export { casarPagos, cobertoAte, tipoDaParcela, tipoDoTitulo, r2 };
