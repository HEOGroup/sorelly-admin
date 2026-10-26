// Sorelly Admin · montagem — domain/previsao-caixa.js
// Previsão de caixa: parte do último saldo real lançado e desconta, dia a dia, as contas a pagar já lançadas
// no admin antigo (domain/contas-pagar-previsto.local.js). Duas visões:
//  · Por CNPJ: soma o previsto a receber dividido IGUALMENTE entre os 5 (pedido do Marcus, 26/10/2026: hoje
//    ninguém sabe de verdade quanto Pix cai em cada CNPJ, então 1/5 pra cada é a estimativa até ter o real).
//  · Consolidado: soma os 5 "CNPJs" (saldo, limite e a pagar) e o previsto a receber inteiro, pra ver se, no
//    total, o dinheiro que entra cobre o que sai — é a soma das 5 linhas "por CNPJ" desta mesma tela.
import { globLocal } from "@/lib/glob-local";
import { datasLancadas, posicaoEm } from "@/apps/montagem/domain/saldos-contas";

var LOCAL = (function(){ try { var m = globLocal("apps/montagem/domain/contas-pagar-previsto.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();

var CNPJS = [["34","CNPJ 34 · Atacadista"],["46","CNPJ 46 · Mayz"],["59","CNPJ 59 · Serenity"],["67","CNPJ 67 · Axis"],["sem","Sem CNPJ"]];

// Previsto a receber: média de acertos por dia da semana em outubro/2026 (real, calculada com o Marcus em
// 26/10/2026, 0=domingo) x preço médio do acerto (outubro R$ 789,14 + 5%, pedido do Marcus pra novembro).
// Fica fixo aqui (mesma regra de domain/CLAUDE.md: o que o Marcus passa no chat vira código); atualizar
// quando ele mandar números novos de novembro/dezembro.
var MEDIA_ACERTOS_SEMANA = {0:0, 1:93.5, 2:75.33, 3:100.67, 4:64.5, 5:72.25, 6:22.67};
var PRECO_MEDIO_ACERTO = 789.14*1.05;
function receberPrevistoDoDia(iso){
  var p = iso.split("-").map(Number), semana = new Date(Date.UTC(p[0], p[1]-1, p[2])).getUTCDay();
  return Math.round((MEDIA_ACERTOS_SEMANA[semana]||0)*PRECO_MEDIO_ACERTO*100)/100;
}

function blocoPara(id, porBloco){
  if(id==="sem"){
    var din = porBloco.DIN || {real:0, disp:0}, part = porBloco.PART || {real:0, disp:0}, ho = porBloco.HO || {real:0, disp:0};
    return {real: din.real+part.real+ho.real, disp: din.disp+part.disp+ho.disp};
  }
  return porBloco[id] || {real:0, disp:0};
}

/** {cnpjs:[{id,nome,saldoHoje,dataHoje,limite,linhas:[{dia,apagar,saldo,estourou}],pior,piorDia}], consolidado:{...,linhas:[{dia,apagar,receber,saldo,estourou}]}} */
function previsaoCaixa(sc){
  if(!LOCAL || !sc) return null;
  var dias = Object.keys(LOCAL).sort();
  if(!dias.length) return null;
  var dl = datasLancadas(sc), dataHoje = dl[dl.length-1];
  if(!dataHoje) return null;
  var pos = posicaoEm(sc, dataHoje), porBloco = {};
  pos.blocos.forEach(function(b){ porBloco[b.id] = b; });

  var N = CNPJS.length;
  var cnpjs = CNPJS.map(function(c){
    var b = blocoPara(c[0], porBloco), limite = Math.max(0, b.disp-b.real), saldo = b.real, pior = saldo, piorDia = dataHoje;
    var linhas = dias.map(function(d){
      var apagar = (LOCAL[d]||{})[c[0]] || 0, receber = receberPrevistoDoDia(d)/N;
      saldo = saldo-apagar+receber;
      if(saldo<pior){ pior = saldo; piorDia = d; }
      return {dia:d, apagar:apagar, receber:receber, saldo:saldo, estourou: saldo < -limite};
    });
    return {id:c[0], nome:c[1], saldoHoje:b.real, dataHoje:dataHoje, limite:limite, linhas:linhas, pior:pior, piorDia:piorDia};
  });

  var saldoReal = cnpjs.reduce(function(t, c){ return t+c.saldoHoje; }, 0);
  var limiteTotal = cnpjs.reduce(function(t, c){ return t+c.limite; }, 0);
  var saldo = saldoReal, pior = saldo, piorDia = dataHoje;
  var linhasCons = dias.map(function(d){
    var apagar = cnpjs.reduce(function(t, c){ return t+((LOCAL[d]||{})[c.id]||0); }, 0);
    var receber = receberPrevistoDoDia(d);
    saldo = saldo-apagar+receber;
    if(saldo<pior){ pior = saldo; piorDia = d; }
    return {dia:d, apagar:apagar, receber:receber, saldo:saldo, estourou: saldo < -limiteTotal};
  });
  var consolidado = {saldoHoje:saldoReal, dataHoje:dataHoje, limite:limiteTotal, linhas:linhasCons, pior:pior, piorDia:piorDia};

  return {cnpjs:cnpjs, consolidado:consolidado};
}

export { CNPJS, previsaoCaixa };
