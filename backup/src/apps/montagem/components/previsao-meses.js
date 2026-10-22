// Sorelly Admin · montagem — components/previsao-meses.js
// Aba "Previsão" da tela Faturamento (tudo previsão, separado do que já aconteceu):
//  (1) ResumoMesAno: mês atual e ano em duas faixas de totais — recebido, a receber, total, contas e resultado;
//  (2) PrevisaoMeses: meses que faltam até dezembro — revendedoras, previstos, realizados esperados, média por acerto subindo como na Visão geral
//      (+5% novembro, +15% dezembro), faturamento, contas e resultado.
// Mesmas contas da Visão geral (resumoFinanceiro e projetarAno), então os números batem nas duas telas. Peças do padrão do Financeiro.
import { COR, FaixaTotais, TabelaP, Td, Tr, corSinal, brl } from "@/apps/montagem/components/padrao-fin";
import { contasDoMes, fatEfetivo, MESES_LONGO, projetarAno } from "@/apps/montagem/domain/financeiro";
import { resumoFinanceiro } from "@/apps/montagem/domain/resumo-financeiro";
import { BKC } from "@/apps/montagem/lib/format";
import { e } from "@/shared/react";

var n0 = function(v){ return Math.round(v||0).toLocaleString("pt-BR"); };
var titulo = function(t){ return e("h3",{className:"text-[13px] font-semibold text-foreground"}, t); };

function ResumoMesAno(p){
  var r = resumoFinanceiro(p.s), m = r.mes, a = r.ano;
  return e("div",{className:"flex flex-col gap-2"},
    titulo(m.nome+" · "+n0(m.acertos)+" acertos feitos de "+n0(m.previstos)+" no mês · previsão a "+m.metaPct+"%"),
    e(FaixaTotais,{itens:[{t:"Recebido", v:BKC(m.recebido), cor:COR.entra},{t:"A receber", v:BKC(m.aReceber), cor:COR.entra},{t:"Total do mês", v:BKC(m.recebido+m.aReceber), cor:COR.entra},{t:"Contas do mês", v:BKC(m.contasTotal), cor:COR.sai},{t:"Resultado do mês", v:brl(m.resultadoEsperado), cor:corSinal(m.resultadoEsperado)}]}),
    titulo("Ano "+a.ano),
    e(FaixaTotais,{itens:[{t:"Recebido", v:BKC(a.recebido), cor:COR.entra},{t:"A receber", v:BKC(a.aReceber), cor:COR.entra},{t:"Total do ano", v:BKC(a.previsto), cor:COR.entra},{t:"Contas do ano", v:BKC(a.contasTotal), cor:COR.sai},{t:"Resultado do ano", v:brl(a.resultadoEsperado), cor:corSinal(a.resultadoEsperado)}]}));
}

function PrevisaoMeses(p){
  var s = p.s, hoje = new Date(), ano = hoje.getFullYear(), mes = hoje.getMonth(), anoStr = String(ano);
  var m = resumoFinanceiro(s).mes;
  var proj = projetarAno(Object.assign({}, s, {faturamentoDiario:fatEfetivo(s)}), anoStr, 2, m.metaPct);
  var linhas = [{nome:MESES_LONGO[mes]+" · atual", rev:null, previstos:m.previstos, realizados:m.metaAlvo, media:m.mediaAcerto, alta:null, fat:m.recebido+m.aReceber, contas:m.contasTotal}];
  proj.porMes.forEach(function(x){ if(x.mes<=mes) return; var cp = contasDoMes(s, anoStr, x.mes);
    linhas.push({nome:MESES_LONGO[x.mes], rev:x.revendedoras, previstos:x.previstos, realizados:x.realizados, media:x.mediaAcerto, alta:x.alta, fat:x.valor, contas:(cp.pago||0)+(cp.apagar||0)}); });
  var tot = linhas.reduce(function(t, l){ return {fat:t.fat+l.fat, contas:t.contas+l.contas}; }, {fat:0, contas:0});
  return e("div",{className:"flex flex-col gap-2"},
    titulo("Previsão até dezembro · realizados = previstos × "+m.metaPct+"%"),
    e(TabelaP,{minW:1040, cols:[{t:"Mês", w:130},{t:"Revendedoras", n:true, w:136},{t:"Previstos", n:true, w:100},{t:"Realizados esperados", n:true, w:176},{t:"Média por acerto", n:true, w:150},{t:"Faturamento", n:true, w:150},{t:"Contas", n:true, w:150},{t:"Resultado", n:true, w:150}]},
      linhas.map(function(l){ var res = l.fat-l.contas;
        return e(Tr,{key:l.nome}, e(Td,null, l.nome), e(Td,{n:true}, l.rev===null ? "—" : n0(l.rev)), e(Td,{n:true}, n0(l.previstos)), e(Td,{n:true}, n0(l.realizados)),
          e(Td,{n:true, title:l.alta ? "Média atual do mês + "+Math.round(l.alta*100)+"%" : undefined}, BKC(l.media)+(l.alta ? " (+"+Math.round(l.alta*100)+"%)" : "")),
          e(Td,{n:true, cor:COR.entra}, BKC(l.fat)), e(Td,{n:true, cor:COR.sai}, BKC(l.contas)), e(Td,{n:true, forte:true, cor:corSinal(res)}, brl(res))); }),
      e(Tr,{key:"t", total:true}, e(Td,null, "Total"), e(Td,null, ""), e(Td,null, ""), e(Td,null, ""), e(Td,null, ""), e(Td,{n:true, cor:COR.entra}, BKC(tot.fat)), e(Td,{n:true, cor:COR.sai}, BKC(tot.contas)), e(Td,{n:true, cor:corSinal(tot.fat-tot.contas)}, brl(tot.fat-tot.contas)))));
}

export { ResumoMesAno, PrevisaoMeses };
