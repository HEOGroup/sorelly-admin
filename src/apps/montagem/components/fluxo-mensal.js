// Sorelly Admin · montagem — components/fluxo-mensal.js
// Aba "Mês a mês" da tela Faturamento: os 12 meses do ano LADO A LADO (meses nas colunas), com faturamento, contas pagas, contas a pagar, resultado e saldo acumulado.
// Meses fechados e o atual vêm do que foi lançado; os meses que faltam entram como previsão (mesma conta da Visão geral), em colunas apagadas e marcadas "prev.".
// Resultado do mês fechado = faturamento − contas pagas; do mês atual, até o último dia lançado; do mês previsto = faturamento previsto − contas a pagar.
import { COR, TabelaP, Td, Tr, corSinal, brl } from "@/apps/montagem/components/padrao-fin";
import { contasDoMes, fatEfetivo, projetarAno } from "@/apps/montagem/domain/financeiro";
import { e } from "@/shared/react";

var MES3 = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function FluxoMensal(p){
  var s = p.s, ano = p.ano, anoStr = String(ano), hoje = new Date(), anoAtual = hoje.getFullYear(), mesAtual = hoje.getMonth();
  var fd = fatEfetivo(s);
  var proj = ano===anoAtual ? projetarAno(Object.assign({}, s, {faturamentoDiario:fd}), anoStr, 2, Number(s.metaPct)>=96 && Number(s.metaPct)<=98 ? Number(s.metaPct) : 97) : null;
  var acum = 0;
  var cols = [0,1,2,3,4,5,6,7,8,9,10,11].map(function(m){
    var pref = ano+"-"+String(m+1).padStart(2,"0"), ks = Object.keys(fd).filter(function(k){ return k.slice(0,7)===pref; }).sort(), reg = ks.length ? fd[ks[ks.length-1]] : null;
    var cp = contasDoMes(s, anoStr, m), atual = ano===anoAtual && m===mesAtual, futuro = ano>anoAtual || (ano===anoAtual && m>mesAtual), fechado = !!(reg && reg.travado);
    if(futuro){
      var pm = proj && proj.porMes[m], fat = pm ? pm.valor : 0, aPagar = (cp.pago||0)+(cp.apagar||0), res = fat-aPagar; acum += res;
      return {m:m, prev:true, fat:fat, pago:null, apagar:aPagar, res:res, acum:acum, fechado:false, atual:false};
    }
    var fatR = reg ? reg.recebido||0 : 0, pagoR = cp.pago||0, resR = fatR-pagoR; acum += resR;
    return {m:m, prev:false, fat:fatR, pago:pagoR, apagar:atual ? (cp.apagar||0) : null, res:resR, acum:acum, fechado:fechado, atual:atual};
  });
  var cab = [{t:"R$", w:150}].concat(cols.map(function(c){ return {t:MES3[c.m]+(c.fechado ? " 🔒" : c.prev ? " prev." : c.atual ? " atual" : ""), n:true, w:152}; }));
  var linha = function(rotulo, f, cor, forte, total){ return e(Tr,{key:rotulo, total:total}, e(Td,{forte:true}, rotulo), cols.map(function(c){ var v = f(c); return e(Td,{key:c.m, n:true, forte:forte, cor:v===null || v===undefined ? "" : cor(v)}, v===null || v===undefined ? "—" : brl(v)); })); };
  var entra = function(){ return COR.entra; }, sai = function(){ return COR.sai; };
  return e(TabelaP,{minW:2000, cols:cab},
    linha("Faturamento", function(c){ return c.fat>0 || !c.prev ? c.fat : null; }, entra),
    linha("Contas pagas", function(c){ return c.pago; }, sai),
    linha("Contas a pagar", function(c){ return c.apagar; }, sai),
    linha("Resultado do mês", function(c){ return c.res; }, function(v){ return corSinal(v); }, true, true),
    linha("Saldo acumulado", function(c){ return c.acum; }, function(v){ return corSinal(v); }, true, true));
}

export { FluxoMensal };
