// Sorelly Admin · montagem — pages/trafego/Investimento.js
// Tráfego pago › Investimento (aba "Investimento" da planilha do Diego): por mês, quanto se investiu e quanto custa cada revendedora cadastrada, no Google, no Meta (sem e com imposto) e nas duas juntas.
import { brl } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { linhasInvestimento, rotuloMes, totalInvestimento } from "@/apps/montagem/domain/trafego";
import { N, R$, col } from "@/apps/montagem/pages/trafego/comum";
import { use } from "@/apps/montagem/state/context";
import { e } from "@/shared/react";

function AbaTpInvestimento(){
  var tp = use().state.tp, taxa = tp.config.taxaMeta, linhas = linhasInvestimento(tp);
  var taxaTxt = taxa.toLocaleString("pt-BR", {maximumFractionDigits:2});
  // plataforma sem lançamento no mês aparece "—" (diferente de zero real)
  var g = function(f){ return function(v, l){ return l.google ? f(v) : "—"; }; }, m = function(f){ return function(v, l){ return l.meta ? f(v) : "—"; }; };
  var cols = [
    col("mes", "Mês", function(v){ return rotuloMes(v); }),
    col("gInv", "Investimento", g(R$), true), col("gCad", "Cadastradas", g(N)), col("gCusto", "Custo por cadastrada", g(R$)),
    col("mInv", "Investimento", m(R$), true), col("mCad", "Cadastradas", m(N)), col("mCusto", "Custo por cadastrada", m(R$)),
    col("mInvImp", "Investimento", m(R$), true), col("mCustoImp", "Custo por cadastrada", m(R$)),
    col("totalInv", "Investimento", R$, true), col("totalCad", "Cadastradas", N), col("totalCusto", "Custo por cadastrada", R$)];
  var grupos = [[{t:"", span:1}, {t:"Google Ads", span:3, sep:true}, {t:"Meta Ads · sem imposto", span:3, sep:true}, {t:"Meta Ads · com imposto de "+taxaTxt+"%", span:2, sep:true}, {t:"Google + Meta com imposto", span:3, sep:true}]];
  var total = function(ls){
    var t = totalInvestimento(ls, taxa);
    return ["Total", brl(t.gInv), N(t.gCad), R$(t.gCusto), brl(t.mInv), N(t.mCad), R$(t.mCusto), brl(t.mInvImp), R$(t.mCustoImp), brl(t.totalInv), N(t.totalCad), R$(t.totalCusto)];
  };
  return e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"mes", cabAcima:grupos, totalLinha:total, semContagem:true, vazio:"Nenhum mês lançado ainda. Lance o primeiro dia em Dia a dia."});
}
export { AbaTpInvestimento };
