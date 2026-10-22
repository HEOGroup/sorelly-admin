// Sorelly Admin — pages/RegrasAcertos.js
// Representantes → Regras dos acertos: regras do acerto da REVENDEDORA (régua, taxa, remarcação, pagamento, brindes). A comissão da representante fica em RegrasRepresentantes.js. Tudo que a representante precisa saber, descrito e alinhado, sempre com os números em vigor
// (régua, taxa, remarcação, pagamento, formas de pagamento). Só leitura: quem edita é Representantes → Configurações.
import { AVISO_BB, PECAS_PROX_PADRAO, formasPagamentoPadrao, reais, textoRegrasPrata, versaoVigente } from "@/apps/montagem/domain/consignado";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e } from "@/shared/react";
import React from "react";

var v = function(x){ return e("b",{className:"text-primary"}, x); };

// Cartão de regra: título, subtítulo e conteúdo livre
function bloco(titulo, ic, sub, filhos){
  return e("div",{key:titulo, className:"flex flex-col rounded-xl bg-linear-to-br from-[#E8B84B]/10 via-card to-card p-5 ring-1 ring-[#E8B84B]/20"},
    e("div",{className:"mb-1 flex items-center gap-2"}, e("span",{className:"grid size-8 place-items-center rounded-lg bg-primary/15 text-primary"}, e(Icon,{n:ic, s:16})),
      e("h2",{className:"font-heading text-lg font-semibold"}, titulo)),
    e("p",{className:"mb-3 text-[13px] text-muted-foreground"}, sub),
    filhos);
}
// Lista numerada (mesmo visual da tela de Regras das listagens)
function passos(itens){
  return e("ol",{className:"flex flex-col gap-2"}, itens.filter(Boolean).map(function(it,i){ return e("li",{key:i, className:"flex gap-2.5 text-sm leading-snug"},
    e("span",{className:MONO+" mt-px grid size-5 shrink-0 place-items-center rounded-md bg-muted text-[11px] font-bold text-primary"}, i+1), e("span",null, it)); }));
}
// Tabela alinhada: 1ª coluna à esquerda, números à direita
function tabela(cols, linhas){
  return e("div",{className:"overflow-x-auto rounded-lg border border-border"},
    e("table",{className:"w-full border-collapse text-sm"},
      e("thead",null, e("tr",{className:"bg-muted/40"}, cols.map(function(c,i){ return e("th",{key:i, className:"px-3 py-2 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground "+(i===0 ? "text-left" : "text-right")}, c); }))),
      e("tbody",null, linhas.map(function(l,i){ return e("tr",{key:i, className:"border-t border-border/60 "+(l.destaque ? "bg-muted/20" : "")},
        l.c.map(function(c,j){ return e("td",{key:j, className:"whitespace-nowrap px-3 py-2 "+(j===0 ? "text-left" : "text-right "+MONO+" tabular-nums")+(l.cor && j>0 ? " "+l.cor : "")}, c); })); }))));
}

function AbaRegrasAcertos(){
  var cx = use(), d = cx.dispatch, s = cx.state, vr = versaoVigente(s), c = s.cfg, g = vr.gerais;
  var formas = s.formasPagamento || formasPagamentoPadrao();
  var asc = vr.faixas.slice().sort(function(a,b){return a.min-b.min;});
  var taxas = (vr.taxaBaixa||[]).slice().sort(function(a,b){return a.min-b.min;});
  var pp = vr.pecasProx || PECAS_PROX_PADRAO;
  var tab = vr.pagamentoBrinde || [], parc = tab.filter(function(t){return t.max>0;}), teto = tab.length ? tab[tab.length-1].max : 10;
  return e(React.Fragment,null,
    e("div",{className:"flex flex-wrap items-end justify-between gap-3"}, e(PageHead,{t:"Regras dos acertos das revendedoras", sub:"O que a representante precisa saber e ir falando para a revendedora no acerto, com os valores atuais. Para mudar algo, é em Configurações — muda aqui e no app na hora."}),
      e(Btn,{v:"ghost", sm:true, ic:"chevron", onClick:function(){ d({type:"ABA", aba:"regrasrep"}); }}, "Ver regras dos representantes")),
    e("div",{className:"grid grid-cols-1 items-start gap-4 xl:grid-cols-2"},
      bloco("Régua de comissão e brinde","grafico","Pela venda líquida da revendedora no acerto. O teto de cada faixa inclui o centavo.",[
        tabela(["Venda líquida","Comissão","Brinde Normal","Brinde Select"],
          [{c:["Abaixo de "+reais(g.minRenovar),"0%",reais(0),reais(0)], cor:"text-muted-foreground"}].concat(asc.map(function(f,i){ var prox = asc[i+1];
            return {c:[prox ? reais(f.min)+" a "+reais(prox.min-0.01) : reais(f.min)+" ou mais", f.pct+"%", reais(f.bn), reais(f.bb)]}; }))),
        e("p",{key:"n", className:"mt-3 text-[13px] text-muted-foreground"},"Abaixo de "+reais(g.minRenovar)+" de venda líquida não existe faixa: a comissão é zero.")]),
      bloco("Taxa de deslocamento","caminhao","Taxa fixa para venda pequena. Ela soma no valor que a revendedora paga.",[
        tabela(["Venda líquida","Taxa"], taxas.map(function(t,i){ var prox = taxas[i+1], fim = (prox ? prox.min : g.taxaAbaixoDe)-0.01;
          return {c:[t.min<=0 ? "Até "+reais(fim) : reais(t.min)+" a "+reais(fim), reais(t.taxa)]}; })),
        e("p",{key:"n", className:"mt-3 text-[13px] text-muted-foreground"},"A partir de "+reais(g.taxaAbaixoDe)+" não tem taxa.")]),
      bloco("Remarcação","calendario","Cada vez que o acerto é remarcado a comissão e o brinde diminuem.",[
        tabela(["Remarcação","Comissão","Brinde"], vr.remarcacao.map(function(t,i,arr){ return {c:[(i+1)+"ª vez"+(i===arr.length-1 ? " em diante" : ""), "− "+t.comissaoPct+"%", "− "+t.brindePct+"%"], cor:"text-destructive"}; })),
        e("p",{key:"n", className:"mt-3 text-[13px] text-muted-foreground"},"Remarcação com motivo justificado (como falecimento na família) é marcada como isenta e não conta. O desconto do brinde vale proporcional em cada categoria, Normal e Select.")]),
      bloco("Pagamento e brindes","banco","O acerto tem que ser pago por inteiro. O que falta mexe no brinde.",[
        tabela(["Quanto faltou pagar","Brinde que recebe"],
          [{c:["Nada — pagou tudo","100%"], cor:"text-success"}].concat(parc.map(function(t,i){ return {c:["Até "+t.max+"%"+(i>0 ? " (de "+parc[i-1].max+"%)" : ""), Math.round(t.fator*100)+"%"], cor:"text-warning"}; }))
            .concat([{c:["Mais de "+teto+"%","Sem brinde"], cor:"text-destructive"}])),
        e("div",{key:"l", className:"mt-3"}, passos([
          "Faltando valor, dá para negociar parcelas. Se as parcelas fecharem o valor exato, o brinde é liberado.",
          "Se a revendedora não quiser negociar: sem brinde e a nota promissória é executada em 48h úteis.",
          "O brinde só é entregue depois do pagamento."]))]),
      bloco("Como lançar os brindes","presente","Depois de pagar, a representante lança peça por peça (código e valor).",[
        passos([
          e(React.Fragment,null,v("Brinde Normal: ")," peças comuns do kit. Aceita código normal ou BB."),
          e(React.Fragment,null,v("Brinde Select (BB): "),v(AVISO_BB)," O código só começa com ",v("BB")," — ou ",v("BB + 1 ou 2 letras")," (BBA, BBCL, BBP, BBT) — e termina sempre com ",v("4 números"),". Ex.: BB0001, BBA0001."),
          "O que passar do Select abate do saldo do Normal. Passou de tudo: o excedente entra no total a pagar."])]),
      bloco("Formas de pagamento aceitas","coins","Na hora de lançar o pagamento: forma, descrição (código da conta), data e valor.",[
        e("div",{key:"f", className:"flex flex-col gap-2"}, formas.map(function(f){ return e("div",{key:f.k, className:"flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0"},
          e("b",{className:"text-sm"}, f.label), e("span",{className:"text-right text-[12.5px] text-muted-foreground"}, f.descricoes.length+(f.descricoes.length===1?" descrição":" descrições")+(f.parcelas?" · 1x a 6x":""))); })),
        e("p",{key:"n", className:"mt-3 text-[13px] text-muted-foreground"},"O valor lançado entra inteiro no total pago — o app não divide por parcela.")]),
      bloco("Kit novo e entrega","novas","Liberação do próximo kit e entrega do kit para revendedora nova.",[
        passos([
          e(React.Fragment,null,"Com ",v((g.kitNovoMinPct)+"%")," ou mais do acerto pago, o kit novo é ",v("liberado")," sem precisar de autorização do financeiro. Abaixo disso, precisa de autorização."),
          "Entrega: a representante marca a condicional (ou condicionais) enviada, vê o total de peças e confirma. Se faltar peça, marca quantas faltaram.",
          "Depois lê as regras para a revendedora, uma a uma, marcando cada uma.",
          "A revendedora assina na tela. Sem todas as regras marcadas e a assinatura, a entrega não conclui."])]),
      bloco("Fechamento do acerto","lista","Ordem da calculadora, do começo ao fim.",[
        passos([
          "Condicionais: marca as que conferiu — soma das peças.",
          "Remarcação: registra e diz se é com multa ou isenta.",
          "Crédito de garantia, se houver.",
          "Vendas e pagamentos: valor vendido, depois os pagamentos (ou negociação).",
          "Brindes: peça por peça, quando liberados.",
          "Kit novo: só mostra se está liberado ou não.",
          "Devolução: peças vendidas, brindes e trocas — o resto volta para a empresa ("+reais(g.taxaTagExtraviada)+" por tag riscada ou extraviada; peça sem etiqueta conta como vendida).",
          "Assinatura da revendedora, com o check de que leu e entendeu as regras."])]),
      vr.prata && bloco("Kit 100% Prata","gem","Segunda modalidade, só com peças de prata: +5% de comissão em todas as faixas. A representante vê a modalidade da revendedora na ficha dela, antes da calculadora.",[
        tabela(["Venda líquida","Comissão","Brinde Normal","Brinde Select"],
          vr.prata.faixas.slice().sort(function(a,b){return a.min-b.min;}).map(function(f,i,asc){ var prox = asc[i+1];
            return {c:[prox ? reais(f.min)+" a "+reais(prox.min-0.01) : reais(f.min)+" ou mais", f.pct+"%", reais(f.bn), reais(f.bb)]}; })),
        e("div",{key:"rp", className:"mt-3"}, passos(textoRegrasPrata(vr).map(function(r){ return e(React.Fragment,null, v(r.t+": "), r.x); })))]),
      bloco("Peças para o próximo mês","caixa","Quantas peças ela pode separar para o próximo mês: pelo valor da venda, reduzido pelo que ficou em aberto. Conta só a quantidade — o valor da peça não entra.",[
        tabela(["Valor da venda","Peças (base)"], pp.faixas.slice().sort(function(a,b){return a.min-b.min;}).map(function(f,i,asc){ var prox = asc[i+1];
          return {c:[prox ? reais(f.min)+" a "+reais(prox.min-0.01) : reais(f.min)+" ou mais", f.qtd+" peças"]}; })),
        e("div",{key:"pr", className:"mt-3"}, tabela(["Em aberto do acerto","Libera da base"],
          [{c:["Quitado (até R$ 0,01)","100%"], cor:"text-success"}].concat(pp.reducao.slice().sort(function(a,b){return a.ate-b.ate;}).map(function(r,i,arr){
            return {c:[(i===0 ? "Mais de R$ 0,01 e até " : "Acima de "+arr[i-1].ate+"% e até ")+r.ate+"%", Math.round(r.fator*100)+"%"], cor:"text-warning"}; }))
            .concat([{c:["Acima de "+pp.reducao[pp.reducao.length-1].ate+"%","0 peças"], cor:"text-destructive"}]))),
        e("p",{key:"pn", className:"mt-3 text-[13px] text-muted-foreground"},"Ex.: venda de R$ 3.500 (base 20): quitado 20 · até 5% em aberto 15 · de 5% a 10% 10 · acima de 10% nenhuma. A representante escreve só o código das peças escolhidas.")])));
}

export { AbaRegrasAcertos };
