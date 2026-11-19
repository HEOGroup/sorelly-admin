// Sorelly Admin · montagem — domain/cerebro-financeiro.js
// CÉREBRO DO FINANCEIRO, versão 1 (18/11/2026): lê os saldos das contas e as contas a pagar de cada CNPJ, dia a dia, e devolve os AVISOS do dia. SÓ SUGERE: quem confirma é o Lucas, no Direcionar.
// Regras (Marcus, 18/11/2026; texto completo em docs/negocio/cerebro-financeiro/02-regras-de-orientacao.md):
//  - orientação POR CNPJ; cheque especial conta como dinheiro (disponível = saldo + limite); meta = nenhuma conta negativa;
//  - olha o mês dia a dia, não só o dia seguinte; aviso com 1 a 2 dias de antecedência; conta atrasada entra na soma;
//  - até R$ 2.000 negativo por conta: mandar só o suficiente para deixar positiva; Rotativo + Sicredi 34 são um grupo; Safra primeiro, depois Rotativo + Sicredi, depois Unicred;
//  - todo saldo positivo do Sicredi 34 amortiza o Rotativo no mesmo dia; vale sempre o ÚLTIMO saldo lançado.
// Ainda NÃO entra: recebimento previsto por CNPJ (a DevMaster junta o recebido em um CNPJ só) e colchão mínimo (o Marcus ainda vai dizer o valor).
import { dataReferencia, posicaoEm } from "@/apps/montagem/domain/saldos-contas";

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var LIMITE_POUCO_NEGATIVO = 2000;                         // até este valor negativo, manda só o suficiente para ficar positiva
var CNPJS = ["34", "46", "59", "67"];
var GRUPOS = {"34":[["sicredi_34", "sicredi_rot_34"]]};   // contas que andam juntas (o positivo de uma abate a outra)
var ORDEM_NEG = {"34":["safra_34", "grupo:sicredi_34", "unicred_34"]};   // ordem de quem recebe primeiro; fora da lista, a mais negativa primeiro
var ROTATIVO = {"34":{conta:"sicredi_34", rotativo:"sicredi_rot_34"}};
var brl = function(v){ return "R$ "+(Math.round(Math.abs(v||0)*100)/100).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); };
var dd = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7) : "—"; };
var somaDias = function(iso, n){ var d = new Date(iso+"T12:00:00Z"); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0, 10); };
var fimDoMes = function(iso){ var p = iso.split("-").map(Number); return new Date(Date.UTC(p[0], p[1], 0)).toISOString().slice(0, 10); };

// itens: contas a pagar EM ABERTO [{filial:"34"|"46"|"59"|"67", venc:"AAAA-MM-DD", valor}] (sem vencimento ou com ano errado ficam de fora)
// opcoes.diasAtras: de quantos dias antes o aviso é urgente (padrão 2) e opcoes.horizonte: até quantos dias à frente olhar (padrão: até o fim do mês que vem)
function orientacaoDoDia(sc, itens, hoje, opcoes){
  opcoes = opcoes || {};
  var urgenteAte = somaDias(hoje, opcoes.diasUrgente || 2), atencaoAte = somaDias(hoje, opcoes.diasAtencao || 10);
  var horizonte = opcoes.horizonte || fimDoMes(somaDias(fimDoMes(hoje), 1));
  var ref = sc ? dataReferencia(sc, hoje) : null;
  var pos = ref ? posicaoEm(sc, ref) : {blocos:[]};
  var avisos = [], n = 0;
  var aviso = function(cnpj, pri, tipo, texto, valor, quando){ avisos.push({id:"cv"+(n++), cnpj:cnpj, pri:pri, tipo:tipo, texto:texto, valor:r2(valor), quando:quando||""}); };
  if(!ref){ aviso("—", 2, "Saldos", "Nenhum saldo lançado. Lance os saldos das contas para o cérebro avaliar.", 0, ""); return avisos; }
  if(ref<hoje) aviso("—", 2, "Saldos", "O último saldo lançado é de "+dd(ref)+". Vale o último lançado; lance os saldos de hoje por volta das 17h.", 0, ref);

  CNPJS.forEach(function(id){
    var b = pos.blocos.filter(function(x){ return x.id===id; })[0]; if(!b) return;
    var contas = {}; b.contas.forEach(function(c){ contas[c.conta.id] = c; });
    var abertos = (itens||[]).filter(function(i){ return i.filial===id && i.venc && i.venc<=horizonte && i.valor>0; });
    // 1) cobertura dia a dia: soma acumulada (atrasadas + dias) contra o disponível
    var porDia = {}, atras = 0;
    abertos.forEach(function(i){ if(i.venc<hoje) atras += i.valor; else porDia[i.venc] = (porDia[i.venc]||0)+i.valor; });
    var acum = r2(atras), disp = r2(b.disp), primeiro = null, pico = {dia:"", valor:0};
    if(acum>disp+0.004) primeiro = {dia:hoje, falta:r2(acum-disp), acum:acum};
    Object.keys(porDia).sort().forEach(function(d){
      acum = r2(acum+porDia[d]); if(porDia[d]>pico.valor) pico = {dia:d, valor:r2(porDia[d])};
      if(!primeiro && acum>disp+0.004) primeiro = {dia:d, falta:r2(acum-disp), acum:acum}; });
    if(primeiro){
      var pri = primeiro.dia<=urgenteAte ? 1 : primeiro.dia<=atencaoAte ? 2 : 3;
      aviso(id, pri, "Cobertura", "Contas a pagar até "+dd(primeiro.dia)+" somam "+brl(primeiro.acum)+" (com as atrasadas) e o disponível é "+brl(disp)+": faltam "+brl(primeiro.falta)+". Orientar Pix para o CNPJ "+id+".", primeiro.falta, primeiro.dia);
    } else if(pico.valor>0 && pico.valor>disp*0.5){
      aviso(id, 3, "Pico", "Maior dia de contas: "+dd(pico.dia)+", "+brl(pico.valor)+". O disponível ("+brl(disp)+") cobre, mas olhe os dias seguintes.", pico.valor, pico.dia);
    }
    // 2) contas negativas: grupos, até R$ 2.000 só o suficiente, ordem definida
    var usadas = {}, itensNeg = [];
    (GRUPOS[id]||[]).forEach(function(g){ var ex = g.filter(function(k){ return contas[k]; }); if(ex.length<2) return;
      ex.forEach(function(k){ usadas[k] = 1; });
      itensNeg.push({chave:"grupo:"+g[0], nome:g.map(function(k){ return contas[k].conta.nome; }).join(" + "), saldo:r2(ex.reduce(function(t, k){ return t+contas[k].saldo; }, 0))}); });
    b.contas.forEach(function(c){ if(usadas[c.conta.id] || c.conta.bloqueada || c.conta.tipo==="CAIXA") return; itensNeg.push({chave:c.conta.id, nome:c.conta.nome, saldo:r2(c.saldo)}); });
    var negativas = itensNeg.filter(function(x){ return x.saldo<-0.004; }), ordem = ORDEM_NEG[id] || [];
    negativas.sort(function(a, b2){ var ia = ordem.indexOf(a.chave), ib = ordem.indexOf(b2.chave); if(ia<0) ia = 999; if(ib<0) ib = 999; return ia-ib || a.saldo-b2.saldo; });
    negativas.forEach(function(x, i){
      var falta = r2(-x.saldo);
      if(falta<=LIMITE_POUCO_NEGATIVO) aviso(id, 2, "Conta negativa", x.nome+" está "+brl(falta)+" negativa: mandar só "+brl(falta)+" para deixar positiva.", falta, "");
      else aviso(id, 3, "Conta negativa", x.nome+" está "+brl(falta)+" negativa ("+(i+1)+"ª na ordem de liquidar).", falta, ""); });
    // 3) amortizar o Rotativo com o saldo positivo da conta
    var ro = ROTATIVO[id];
    if(ro && contas[ro.conta] && contas[ro.rotativo]){ var pos0 = contas[ro.conta].saldo, rot = contas[ro.rotativo].saldo;
      if(pos0>0.004 && rot<-0.004){ var v = r2(Math.min(pos0, -rot)); aviso(id, 2, "Rotativo", "Amortizar o Rotativo com o saldo positivo de "+contas[ro.conta].conta.nome+": "+brl(v)+" hoje. O limite liberado volta amanhã.", v, ""); } }
  });
  avisos.sort(function(a, b2){ return a.pri-b2.pri || String(a.cnpj).localeCompare(String(b2.cnpj)) || a.id.localeCompare(b2.id); });
  return avisos;
}
export { LIMITE_POUCO_NEGATIVO, CNPJS, GRUPOS, ORDEM_NEG, orientacaoDoDia };
