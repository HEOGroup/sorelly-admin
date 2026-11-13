// Sorelly Admin · montagem — components/tabela-faturamento-dia.js
// Aba "Dia a dia" da tela Faturamento, no padrão do Financeiro de 12/11/2026 (a mesma peça da tela Contas a pagar: TabelaPlanilha dentro do bloco azul, filtro no nome de cada coluna).
// Três visões, escolhidas no botão da faixa azul de cima: Faturamento · Contas pagas · Saldo (faturamento do dia menos contas pagas, com o acumulado).
// Faturamento (pedido do Marcus, 12/11/2026): Dia · Acertos · Recebido · Média · Previsto · % do previsto · Faturamento previsto. Acertos e recebido são o ACUMULADO do mês até o dia.
// Previsto do dia = acertos feitos + Carregar + a realizar daquele dia (s.restanteDia); sem registro no dia, vale o último previsto anterior do mês, ou o do fechamento do mês (s.fechaMes).
// Faturamento previsto = média do dia × acertos previstos a X% (X = meta do mês, s.metaPct). Valor do dia = acumulado do dia − acumulado do dia anterior.
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { COR, corSinal, brl } from "@/apps/montagem/components/padrao-fin";
import { fatEfetivo } from "@/apps/montagem/domain/financeiro";
import { BKC } from "@/apps/montagem/lib/format";
import { e } from "@/shared/react";

var SEMANA = ["dom","seg","ter","qua","qui","sex","sáb"];
var p2 = function(n){ return String(n).padStart(2,"0"); };
var n0 = function(v){ return Math.round(v).toLocaleString("pt-BR"); };
var r2 = function(v){ return Math.round(v*100)/100; };
var ymd = function(a, m, d){ return a+"-"+p2(m+1)+"-"+p2(d); };

// monta as linhas do mês (ano, mes 0-11) a partir do acumulado; null se o mês não tem dia a dia (só o fechamento)
function montar(s, ano, mes){
  var fd = fatEfetivo(s), dias = new Date(ano, mes+1, 0).getDate(), regs = [];
  for(var d=1; d<=dias; d++){ if(fd[ymd(ano, mes, d)]) regs.push(d); }
  if(regs.length<3) return null;
  var ult = regs[regs.length-1], cpd = s.contasPagasDiario || {}, rd = s.restanteDia || {}, fm = (s.fechaMes || {})[ano+"-"+p2(mes+1)] || {};
  var pct = (s.metaPct || 98)/100, prevAnt = null;
  var pagoReal = function(iso){ var x = cpd[iso]; if(!x) return 0; return r2(Object.keys(x.cnpjs||{}).reduce(function(t, k){ return t+(x.cnpjs[k]||0); }, 0)+(x.contasPorFora||0)); };
  var linhas = [], cumR = 0, cumA = 0;
  for(var dia=1; dia<=ult; dia++){
    var iso = ymd(ano, mes, dia), x = fd[iso], tem = x && x.recebido!==undefined;
    var rr = tem ? (x.recebido||0) : cumR, aa = tem ? (x.acertos||0) : cumA, parcial = !!(x && x.parcial);
    var dr = r2(Math.max(0, rr-cumR)), da = Math.max(0, aa-cumA); cumR = Math.max(cumR, rr); cumA = Math.max(cumA, aa);
    var rs = rd[iso], prev = rs ? (rs.feitos||0)+(rs.carregar||0)+(rs.aRealizar||0) : prevAnt;
    if(prev===null && dia===ult && (fm.aRealizar || fm.carregar)) prev = cumA+(fm.carregar||0)+(fm.aRealizar||0);
    if(prev!==null) prevAnt = prev;
    var prevPct = prev ? Math.round(prev*pct) : null, media = cumA>0 ? Math.round(cumR/cumA*100+1e-6)/100 : 0;   // arredonda a metade para cima, como o relatório do Marcus (R$ 648,195 vira R$ 648,20)
    linhas.push({id:iso, dia:p2(dia)+"/"+p2(mes+1)+" · "+SEMANA[new Date(ano, mes, dia).getDay()]+(parcial ? " · hoje" : ""), da:da, dr:dr, a:cumA, r:cumR, media:media, prev:prev, prevPct:prevPct, fatPrev:prevPct ? r2(media*prevPct) : null, contas:pagoReal(iso), car:(s.carregarDia||{})[iso]});
  }
  return {linhas:linhas, ult:ult, pct:Math.round(pct*100)};
}

var VISOES = [["fat","Faturamento"],["contas","Contas pagas"],["vs","Saldo"]];

function DiaADia(p){
  var dados = montar(p.s, p.ano, p.mes), visao = p.visao || "fat";
  if(!dados) return e("p",{className:"px-4 py-6 text-center text-[13px] text-foreground"}, "Este mês só tem o fechamento (total do mês), sem o dia a dia.");
  var L = dados.linhas, ac = 0, sa = 0;
  var mostra = function(v, fmt){ return v===null || v===undefined ? "—" : fmt(v); };
  var cols, linhas;
  if(visao==="fat"){
    cols = [{k:"dia", t:"Dia"}, {k:"a", t:"Acertos", fmt:n0}, {k:"r", t:"Recebido", fmt:BKC, cor:function(l){ return l.r>0 ? COR.entra : ""; }}, {k:"media", t:"Média", fmt:function(v){ return v>0 ? BKC(v) : "—"; }}, {k:"prev", t:"Previsto", fmt:function(v){ return mostra(v, n0); }}, {k:"prevPct", t:dados.pct+"% do previsto", fmt:function(v){ return mostra(v, n0); }}, {k:"fatPrev", t:"Faturamento previsto", fmt:function(v){ return mostra(v, BKC); }}];
    linhas = L;
  } else if(visao==="contas"){
    cols = [{k:"dia", t:"Dia"}, {k:"contas", t:"Contas pagas", fmt:BKC, cor:function(l){ return l.contas>0 ? COR.sai : ""; }}, {k:"acum", t:"Acumulado", fmt:BKC, cor:function(l){ return l.acum>0 ? COR.sai : ""; }}];
    linhas = L.map(function(l){ ac = r2(ac+l.contas); return Object.assign({}, l, {acum:ac}); });
  } else {
    cols = [{k:"dia", t:"Dia"}, {k:"da", t:"Acertos no dia", fmt:n0}, {k:"dr", t:"Faturamento do dia", fmt:BKC, cor:function(l){ return l.dr>0 ? COR.entra : ""; }}, {k:"contas", t:"Contas pagas", fmt:BKC, cor:function(l){ return l.contas>0 ? COR.sai : ""; }}, {k:"saldo", t:"Saldo do dia", fmt:brl, cor:function(l){ return corSinal(l.saldo); }}, {k:"acum", t:"Saldo acumulado", fmt:brl, cor:function(l){ return corSinal(l.acum); }}];
    linhas = L.map(function(l){ var sd = r2(l.dr-l.contas); sa = r2(sa+sd); return Object.assign({}, l, {saldo:sd, acum:sa}); });
  }
  return e(TabelaPlanilha,{key:visao, cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, vazio:"Nenhum dia lançado."});
}

export { DiaADia, montar, VISOES };
