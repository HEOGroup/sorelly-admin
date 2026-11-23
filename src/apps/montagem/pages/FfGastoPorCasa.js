// Sorelly Admin · montagem — pages/FfGastoPorCasa.js
// FINANCEIRO › FAMÍLIA › GASTO POR CASA (Marcus, 22/11/2026: "precisa ter uma tela para ver os totais"): para cada centro de gasto (Casa Praia, Casa Jardine, Casa Alphaville, Marco / Anamaria, Casa/Família, Viagem EUA e os gastos pessoais)
// mostra quantas contas, quanto é no mês, quanto já foi pago e quanto falta, e a PARTE de cada pessoa (a divisão vem da casa: Praia e Jardine = Anamaria e Marco; Alphaville = os 4 sócios; Família = os 4).
// Mesmo desenho da Contas a pagar da Sorelly (peças de components/planilha-cheia.js). Só leitura: nada aqui grava no Financeiro familiar. Regras em domain/financeiro-familiar.js.
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { Pagina } from "@/apps/montagem/components/padrao";
import { PAGINA_CHEIA, CLS_FINA_ESPACO, BarraTabela, CelulaBarra, CampoMini, refCheia } from "@/apps/montagem/components/planilha-cheia";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { daPessoa, ehCasa, casaPixOk, pixCasa, hojeYm, janela, nomeMes, parcelasDe, parteDe, r2 } from "@/apps/montagem/domain/financeiro-familiar";
import { BKC } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

// quem aparece nas colunas de "parte de cada um"
var PESSOAS = [["marcus", "Marcus"], ["anamaria", "Anamaria"], ["marco", "Marco Antonio"], ["anabeatriz", "Ana Beatriz"], ["lucas", "Lucas"]];
var ORDEM = ["juan", "casajardine", "casaalphaville", "marco_ana", "familia", "__viagem", "__pessoal", "__semcasa"];
var NOMES = {juan:"Casa Praia", casajardine:"Casa Jardine", casaalphaville:"Casa Alphaville", marco_ana:"Marco / Anamaria", familia:"Casa/Família (geral)", __viagem:"Viagem EUA", __pessoal:"Gastos pessoais (sem casa)", __semcasa:"Pix da Casa sem casa definida"};

// o centro de gasto de uma parcela: Viagem EUA vale por categoria; casa e Família valem pela "pessoa" da conta; o resto é gasto pessoal
var centroDe = function(x){ return x.conta.categoria==="VIAGEM_EUA" ? "__viagem" : (ehCasa(x.conta.personaId) || x.conta.personaId==="familia") ? x.conta.personaId : "__pessoal"; };

function AbaFfCasas(){
  var cx = use(), s = cx.state, ff = s.ff, pode = temAutorizacao("financeiro_familia", s.usuario), es = useState(hojeYm()), ym = es[0], setYm = es[1];
  if(!pode) return e(Pagina,null, e("p",{className:"px-4 py-6 text-center text-[13px]"}, "Só os sócios abrem o Financeiro Familiar."));
  if(!ff || !ff.contas) return e(Pagina,null, e("p",{className:"px-4 py-6 text-center text-[13px]"}, "O Financeiro familiar ainda não carregou."));
  var parcelas = parcelasDe(ff, ym ? {ym:ym} : {yms:janela()}), grupos = {};
  parcelas.forEach(function(x){
    var k = centroDe(x), g = grupos[k] || (grupos[k] = {n:0, total:0, pago:0, falta:0, partes:{}});
    g.n++; g.total = r2(g.total+x.valor); g.pago = r2(g.pago+x.pago); g.falta = r2(g.falta+x.restante);
    PESSOAS.forEach(function(p){ if(daPessoa(x.conta, p[0])) g.partes[p[0]] = r2((g.partes[p[0]] || 0)+x.valor*parteDe(x.conta)); });
  });
  // PIX DE REVENDEDORA da Casa por casa (Marcus, 22/11/2026): o que entrou para pagar a casa, no mesmo mês; o saldo é o Pix recebido menos o que já foi pago
  var yms = ym ? [ym] : janela(), pixPorCasa = {};
  (ff.pix || []).forEach(function(x){ if(!pixCasa(ff, x) || x.auditoria==="REJEITADO" || x.auditoria==="NAOIDENT" || yms.indexOf(String(x.data).slice(0, 7))<0) return; var k = casaPixOk(x.casa) || "__semcasa"; pixPorCasa[k] = r2((pixPorCasa[k] || 0)+x.valor); if(!grupos[k]) grupos[k] = {n:0, total:0, pago:0, falta:0, partes:{}}; });
  var linhas = ORDEM.filter(function(k){ return grupos[k]; }).map(function(k){ var g = grupos[k], pxr = pixPorCasa[k] || 0, o = {id:k, centro:NOMES[k] || k, n:g.n, total:g.total, pago:g.pago, falta:g.falta, pixrec:pxr, saldo:r2(pxr-g.pago)}; PESSOAS.forEach(function(p){ o["p_"+p[0]] = g.partes[p[0]] || 0; }); return o; });
  var cols = [{k:"centro", t:"Centro de gasto"}, {k:"n", t:"Contas"}, {k:"total", t:"Total", fmt:BKC}, {k:"pago", t:"Pago", fmt:BKC, cor:function(l){ return l.pago>0 ? "text-success" : ""; }}, {k:"falta", t:"Falta", fmt:BKC, cor:function(l){ return l.falta>0.005 ? "text-warning" : "text-success"; }}, {k:"pixrec", t:"Pix recebido", fmt:BKC, cor:function(l){ return l.pixrec>0 ? "text-success" : ""; }}, {k:"saldo", t:"Saldo do Pix", fmt:BKC, cor:function(l){ return l.pixrec===0 && l.pago===0 ? "" : l.saldo<-0.005 ? "text-danger" : "text-success"; }}]
    .concat(PESSOAS.map(function(p){ return {k:"p_"+p[0], t:p[1], fmt:BKC}; }));
  var soma = function(ls, k){ return r2(ls.reduce(function(t, l){ return t+(Number(l[k]) || 0); }, 0)); };
  var rodape = function(ls){ return cols.map(function(c, j){ return j===0 ? "Total" : c.k==="n" ? soma(ls, "n") : c.fmt ? BKC(soma(ls, c.k)) : ""; }); };
  return e(Pagina,{className:PAGINA_CHEIA},
    e(BlocoPainel,{titulo:"Gasto por casa", compacto:true},
      e(BarraTabela,null,
        e(CelulaBarra,{rotulo:"Mês"}, e(CampoMini,{valor:ym, aoMudar:setYm, rotulo:"Mês", ops:[["", "Todos os meses"]].concat(janela().map(function(k){ return [k, nomeMes(k)]; }))}))),
      e("div",{ref:refCheia(), className:CLS_FINA_ESPACO}, e(TabelaPlanilha,{key:"ffcasas"+ym, fina:true, cols:cols, alturaMax:"calc(100vh - 6.6rem)", linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, semMao:true, limite:6000, totalRodape:rodape, vazio:"Nenhuma conta neste mês."}))));
}

export { AbaFfCasas };
