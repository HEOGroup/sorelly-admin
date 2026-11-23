// Sorelly Admin · montagem — pages/producao/ProdPagamentoProducao.js
// Produção › PAGAMENTO POR PRODUÇÃO (Marcus, 19/11/2026: "faz uma tela da produção externa de pagamento por produção"; 22/11/2026: "dinheiro de novembro, peças de novembro e com ela agora é tudo aqui"):
// de cima para baixo: (1) escolha da pessoa e do mês; (2) três resumos lado a lado (Dinheiro, Peças, Com ela agora); (3) UMA linha por dia produzido: peças, valor da peça (R$ 0,45 de 16/11 em diante; antes, diária), valor do dia, ciclo (terça a segunda), quinta-feira do pagamento e situação;
// (4) Pagamentos da produção por ciclo (enviar ao Financeiro). INTERNAS (Marcus, 22/11/2026: "teria que ter a parte de pagamento por produção das internas, e no filtro alteraria para cada funcionária interna"): a mesma tela vale para cada funcionária interna; aí cada dia mostra o BÔNUS do dia (R$ 15, R$ 20 ou R$ 25, meta de 300 peças) e NÃO existe "bônus do mês": cada dia vale por si e a soma dos dias é o que ela recebe, EM DINHEIRO, no dia 12 do mês seguinte (ou segunda-feira, se cair no fim de semana); o bloco "Pagamentos da produção" envia isso ao Contas a pagar (forma Dinheiro). O ciclo de quinta-feira é só da produção externa. SEM botão "Marcar pago" (Marcus, 22/11/2026): o pago vem do Contas a pagar; a situação aqui só lê o que já estava baixado em pr.diasPagos. Só a diretoria.
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { CASA_PECA_DESDE, CASA_POR_PECA, diaDaSemana, faixasDe, eCasa, formatarDia, formatarInteiro, formatarReais, hojeSP, intervaloPeriodo, linhasDoPeriodo, dataPagBonus, listaExternas, nomeMes, premiacaoDoMes, quartaDaSemana, resumoExterna, somaDias, valorDiaCasa } from "@/apps/montagem/domain/producao";
import { AbaProdPagamentos } from "@/apps/montagem/pages/producao/ProdPagamentos";
import { Aviso, CAMPO_FAIXA, FaixaAzul, MIUDA, Raiz, usePr } from "@/apps/montagem/pages/producao/visualProd";
import { e, useState } from "@/shared/react";

var cols0 = function(cols, f){ return cols.map(f); };
var cap = function(t){ return t ? t.charAt(0).toUpperCase()+t.slice(1) : t; };
var n0 = function(v){ return formatarInteiro(v); };

function AbaProdPagamentoProducao(){
  var x = usePr(), pr = x.pr, hoje = hojeSP(), sP = useState("Davila Aline"), sM = useState(hoje.slice(0, 7));
  if(!x.admin && !x.leitura) return e(Raiz,null, e(BlocoPainel,{titulo:"Pagamento por produção", compacto:true}, e(Aviso,null, "Somente a diretoria acessa.")));
  var externas = listaExternas(pr), mes = sM[0], ym = mes.split("-").map(Number), pm = premiacaoDoMes(pr, ym[0], ym[1]);
  var internas = (pr.funcionarias || []).filter(function(f){ return f.ativa; }).sort(function(x1, x2){ return x1.posicao-x2.posicao; }).map(function(f){ return f.nome; }).filter(function(n){ return externas.indexOf(n)<0; });   // as funcionárias internas ativas do Cadastro (não os nomes soltos dos lançamentos)
  var pessoas = externas.concat(internas), func = pessoas.indexOf(sP[0])>=0 ? sP[0] : pessoas[0], interna = internas.indexOf(func)>=0;
  var opcoes = [e("optgroup",{key:"ext", label:"Produção externa"}, externas.map(function(n){ return e("option",{key:n, value:n}, n); })), internas.length>0 && e("optgroup",{key:"int", label:"Internas"}, internas.map(function(n){ return e("option",{key:n, value:n}, n); }))];
  var iv = intervaloPeriodo("mes", mes+"-01"), dp = pr.diasPagos || {}, porDia = {};
  linhasDoPeriodo(pr, iv.from, iv.to, null).filter(eCasa).forEach(function(l){ var q = Number(l.qtd) || 0; if(q>0 && String(l.func).trim().toLowerCase()===String(func).trim().toLowerCase()) porDia[l.dia] = (porDia[l.dia] || 0)+q; });
  var linhas = Object.keys(porDia).sort().map(function(d){
    var pago = !!dp[func+"|"+d], pagarEm = quartaDaSemana(d);   // ciclo de terça a segunda, paga na quinta (22/11/2026)
    return {id:d, dia:d, quando:formatarDia(d)+" · "+cap(diaDaSemana(d)), semana:formatarDia(somaDias(pagarEm, -9)).slice(0, 5)+" a "+formatarDia(somaDias(pagarEm, -3)).slice(0, 5), pagarEm:formatarDia(pagarEm), pecas:porDia[d],
      porPeca:d<CASA_PECA_DESDE ? "Diária" : formatarReais(CASA_POR_PECA), valor:valorDiaCasa(pr, func, d), pago:pago, situ:pago ? "Pago" : pagarEm<hoje ? "Atrasado" : "A pagar"};
  });
  var cols = [{k:"quando", t:"Dia"}, {k:"semana", t:"Ciclo"}, {k:"pagarEm", t:"Pagar em"}, {k:"pecas", t:"Peças", fmt:formatarInteiro}, {k:"porPeca", t:"Valor da peça"},
    {k:"valor", t:"Valor do dia", fmt:formatarReais}, {k:"situ", t:"Situação", cor:function(r){ return r.pago ? "text-success" : r.situ==="Atrasado" ? "text-danger" : "text-warning"; }}];
  var soma = function(ls, f){ return ls.reduce(function(t, r){ return t+(f(r) || 0); }, 0); };
  var totalRodape = function(ls){ return cols.map(function(c, i){
    if(i===0) return "TOTAL · "+ls.length;
    if(c.k==="pecas") return formatarInteiro(soma(ls, function(r){ return r.pecas; }));
    if(c.k==="valor") return formatarReais(soma(ls, function(r){ return r.valor; }));
    if(c.k==="situ") return "Pago "+formatarReais(soma(ls, function(r){ return r.pago ? r.valor : 0; }))+" · Falta "+formatarReais(soma(ls, function(r){ return r.pago ? 0 : r.valor; }));
    return ""; }); };
  // três resumos (vieram da Produção externa em 22/11/2026): cor só no estado (verde recebeu, amarelo falta)
  var r = resumoExterna(pr, ym[0], ym[1], func), nome = nomeMes(ym[0], ym[1]).toLowerCase()+" · "+func.split(" ")[0];
  var bloco = function(chave, titulo, itens){ return e(BlocoPainel,{key:chave, titulo:titulo, compacto:true}, e(TabelaPlanilha,{fina:true, cols:[{k:"r", t:"Item"}, {k:"v", t:"Valor", cor:function(l){ return l.cor || ""; }}], linhas:itens.map(function(l, i){ return {id:chave+i, r:l[0], v:l[1], cor:l[2]}; }), chave:"id", grade:true, semContagem:true, semLimpar:true, semFiltro:true})); };
  var barra = e(BlocoPainel,{key:"barra", titulo:"Pagamento por produção · "+nomeMes(ym[0], ym[1]), dir:func, compacto:true},
      e(FaixaAzul,null,
        e("label",{className:"flex items-center gap-2 text-[13px] font-semibold text-white"}, "Pessoa", e("select",{value:func, "aria-label":"Pessoa", onChange:function(ev){ sP[1](ev.target.value); }, className:CAMPO_FAIXA+" w-48 cursor-pointer"}, opcoes)),
        e("label",{className:"flex items-center gap-2 text-[13px] font-semibold text-white"}, "Mês", e("input",{type:"month", value:mes, "aria-label":"Mês", onChange:function(ev){ if(ev.target.value) sM[1](ev.target.value); }, className:CAMPO_FAIXA}))));
  if(interna){
    var li = pm.linhas.filter(function(l){ return l.nome===func; })[0] || {porDia:{}, bonusDia:{}, pecas:0, valor:0, f15:0, f20:0, f25:0};
    var dataPag = dataPagBonus(ym[0], ym[1]), mesFechado = mes<hoje.slice(0, 7);   // as internas recebem EM DINHEIRO, dia 12 do mês seguinte (segunda-feira se cair no fim de semana)
    var pagoBonus = (pr.pagos || {})["bonus|"+func+"|"+mes], situBonus = !mesFechado ? "Em andamento" : pagoBonus ? "Pago" : "A pagar";
    var diasI = Object.keys(li.porDia || {}).sort().filter(function(d){ return li.porDia[d]>0; });
    var linhasI = diasI.map(function(d){ var b = (li.bonusDia || {})[d] || 0; return {id:d, quando:formatarDia(d)+" · "+cap(diaDaSemana(d)), pagarEm:formatarDia(dataPag), pecas:li.porDia[d], faixa:b>0 ? formatarReais(b) : "Abaixo da meta", bonus:b, situ:situBonus}; });
    var colsI = [{k:"quando", t:"Dia"}, {k:"pagarEm", t:"Pagar em"}, {k:"pecas", t:"Peças", fmt:formatarInteiro}, {k:"faixa", t:"Faixa"}, {k:"bonus", t:"Valor do dia", fmt:formatarReais, cor:function(r){ return r.bonus>0 ? "text-success" : ""; }},
      {k:"situ", t:"Situação", cor:function(r){ return r.situ==="Pago" ? "text-success" : r.situ==="A pagar" ? "text-warning" : ""; }}];
    var totalI = function(ls){ return cols0(colsI, function(c, i){ return i===0 ? "TOTAL · "+ls.length : c.k==="pecas" ? formatarInteiro(soma(ls, function(r){ return r.pecas; })) : c.k==="bonus" ? formatarReais(soma(ls, function(r){ return r.bonus; })) : ""; }); };
    var nomeI = nomeMes(ym[0], ym[1]).toLowerCase()+" · "+func.split(" ")[0], dBr = dataPag.slice(8)+"/"+dataPag.slice(5, 7)+"/"+dataPag.slice(0, 4), diasTrab = diasI.length;
    return e(Raiz,{cls:MIUDA}, barra,
      e("div",{className:"grid grid-cols-1 items-stretch gap-0 md:grid-cols-3"},
        bloco("d", "Dinheiro de "+nomeI, [["Valor dos dias", formatarReais(li.valor || 0)], ["Já recebeu", formatarReais(pagoBonus ? (li.valor || 0) : 0), "text-success"], ["A receber", formatarReais(pagoBonus ? 0 : (li.valor || 0)), pagoBonus ? "text-success" : "text-warning"], ["Pagar em dinheiro", dBr]]),
        bloco("p", "Peças de "+nomeI, [["Peças do mês", n0(li.pecas || 0)], ["Dias com produção", n0(diasTrab)], ["Média por dia", diasTrab ? n0(Math.round((li.pecas || 0)/diasTrab)) : "—"], ["Faixas (R$ 15 · 20 · 25)", (li.faixas || faixasDe(func)).slice().reverse().map(function(f){ return f.min; }).join(" · ")+" peças"+(li.supervisora ? " · supervisora" : "")]]),
        bloco("c", "Dias que valeram", [["Dias de R$ 15,00", n0(li.f15 || 0)], ["Dias de R$ 20,00", n0(li.f20 || 0)], ["Dias de R$ 25,00", n0(li.f25 || 0)], ["Situação", situBonus, situBonus==="Pago" ? "text-success" : situBonus==="A pagar" ? "text-warning" : ""]])),
      e(BlocoPainel,{titulo:"Dias produzidos", compacto:true},
        e(TabelaPlanilha,{key:"pi"+func+mes, fina:true, cols:colsI, linhas:linhasI, chave:"id", grade:true, semContagem:true, semLimpar:true, totalRodape:totalI, vazio:"Nenhuma produção neste mês."})),
      e(AbaProdPagamentos,{key:"gi"+func, func:func, interna:true, semRaiz:true}));
  }
  return e(Raiz,{cls:MIUDA},
    e(BlocoPainel,{titulo:"Pagamento por produção · "+nomeMes(ym[0], ym[1]), dir:func, compacto:true},
      e(FaixaAzul,null,
        e("label",{className:"flex items-center gap-2 text-[13px] font-semibold text-white"}, "Pessoa", e("select",{value:func, "aria-label":"Pessoa", onChange:function(ev){ sP[1](ev.target.value); }, className:CAMPO_FAIXA+" w-48 cursor-pointer"}, opcoes)),
        e("label",{className:"flex items-center gap-2 text-[13px] font-semibold text-white"}, "Mês", e("input",{type:"month", value:mes, "aria-label":"Mês", onChange:function(ev){ if(ev.target.value) sM[1](ev.target.value); }, className:CAMPO_FAIXA})))),
    e("div",{className:"grid grid-cols-1 items-stretch gap-0 md:grid-cols-3"},
      bloco("d", "Dinheiro de "+nome, [["Valor do mês", formatarReais(r.valor)], ["Já recebeu", formatarReais(r.recebido), "text-success"], ["A receber", formatarReais(r.aReceber), r.aReceber>0 ? "text-warning" : "text-success"], ["Enviado ao Financeiro", formatarReais(r.enviadoFin)]]),
      bloco("p", "Peças de "+nome, [["Peças feitas e devolvidas", n0(r.pecas)], ["Dias com produção", n0(r.diasPecas)], ["Média por dia", r.diasPecas ? n0(Math.round(r.pecas/r.diasPecas)) : "—"], ["Valor por peça", formatarReais(CASA_POR_PECA)]]),
      bloco("c", "Com ela agora", [["Enviadas a ela", n0(r.enviadoPecas)], ["Devolvidas à Sorelly", n0(r.devolvidoPecas), "text-success"], ["Com ela agora", n0(r.comEla), r.comEla>0 ? "text-warning" : "text-success"], ["Códigos com ela", n0(r.codigosComEla)]])),
    e(BlocoPainel,{titulo:"Dias produzidos", compacto:true},
      e(TabelaPlanilha,{key:"pp"+func+mes, fina:true, cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, totalRodape:totalRodape, vazio:"Nenhuma produção externa neste mês."})),
    e(AbaProdPagamentos,{key:"g"+func, func:func, semRaiz:true}));
}
export { AbaProdPagamentoProducao };
