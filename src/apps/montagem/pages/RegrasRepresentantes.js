// Sorelly Admin — pages/RegrasRepresentantes.js
// Representantes → Regras dos representantes: SÓ o que é da representante (comissão, datas de pagamento, combustível, Pix, kit novo).
// As regras do acerto da revendedora (régua, taxa, remarcação, pagamento, brindes) ficam em RegrasAcertos.js, com botão para ir até lá.
// Comissão: 8% para todas (quem tem 10% é negociação à parte e não entra nas regras). Valores vêm do Configurador de comissões.
import { comisEfetiva, repsEfetivas } from "@/apps/montagem/domain/comissoes";
import { DIRETORIA } from "@/apps/montagem/domain/equipe";
import { MoneyInput, NumInput } from "@/apps/montagem/ui/input";
import { reais } from "@/apps/montagem/domain/consignado";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { isoDia } from "@/apps/montagem/lib/format";
import { PageHead } from "@/apps/montagem/ui/page";
import { e } from "@/shared/react";
import React from "react";

var v = function(x){ return e("b",{className:"text-primary"}, x); };

function bloco(titulo, ic, sub, filhos){
  return e("div",{key:titulo, className:"flex flex-col rounded-xl bg-linear-to-br from-[#E8B84B]/10 via-card to-card p-5 ring-1 ring-[#E8B84B]/20"},
    e("div",{className:"mb-1 flex items-center gap-2"}, e("span",{className:"grid size-8 place-items-center rounded-lg bg-primary/15 text-primary"}, e(Icon,{n:ic, s:16})),
      e("h2",{className:"font-heading text-lg font-semibold"}, titulo)),
    e("p",{className:"mb-3 text-[13px] text-muted-foreground"}, sub),
    filhos);
}
function passos(itens){
  return e("ol",{className:"flex flex-col gap-2"}, itens.filter(Boolean).map(function(it,i){ return e("li",{key:i, className:"flex gap-2.5 text-sm leading-snug"},
    e("span",{className:MONO+" mt-px grid size-5 shrink-0 place-items-center rounded-md bg-muted text-[11px] font-bold text-primary"}, i+1), e("span",null, it)); }));
}

// Negociação do Pix direto: quanto da comissão de cada representante vai por Pix direto da revendedora. SÓ a diretoria vê e edita.
function NegociacaoPix(p){
  var s = p.s, d = p.d, mesAtual = isoDia(new Date()).slice(0,7), reps = repsEfetivas(s).map(function(x){ return x.nome; });
  var lista = reps.filter(function(n){ return (s.negPix||{})[n]; }), livres = reps.filter(function(n){ return !(s.negPix||{})[n]; });
  var set = function(rep, patch){ d({type:"NEGPIX_SET", rep:rep, patch:patch}); };
  var sel = "h-9 rounded-lg border border-border bg-black/30 px-2 text-[13px] text-white";
  var linha = function(n){ var x = s.negPix[n];
    return e("div",{key:n, className:"flex flex-col gap-2 rounded-lg bg-black/20 p-3"},
      e("div",{className:"flex items-center justify-between gap-2"}, e("b",{className:"text-[14px]"}, n),
        e("button",{onClick:function(){ d({type:"NEGPIX_DEL", rep:n}); }, className:"rounded-md bg-white/10 px-2 py-0.5 text-[12px] font-semibold hover:bg-destructive/30"}, "Remover")),
      e("div",{className:"flex flex-wrap items-center gap-2"},
        e("select",{value:x.modo, "aria-label":"Tipo da negociação", className:sel, onChange:function(ev){ set(n, {modo:ev.target.value}); }}, e("option",{value:"pct"},"% da comissão do mês"), e("option",{value:"valor"},"Valor em reais")),
        x.modo==="valor" ? e(MoneyInput,{value:x.valor, label:"Valor em reais", sm:true, className:"w-32", onChange:function(val){ set(n, {valor:val||0}); }})
          : e("span",{className:"flex items-center gap-1"}, e(NumInput,{value:x.valor, label:"Porcentagem", className:"h-9! w-20 text-sm!", onChange:function(val){ set(n, {valor:val||0}); }}), e("b",null,"%")),
        e("select",{value:x.vigencia, "aria-label":"Vigência", className:sel, onChange:function(ev){ set(n, {vigencia:ev.target.value, mes:mesAtual}); }}, e("option",{value:"mes"},"Só neste mês ("+mesAtual.split("-").reverse().join("/")+")"), e("option",{value:"fixo"},"Fixo (todo mês)"))),
      e("div",{className:"flex flex-wrap items-center gap-2"},
        e("span",{className:"text-[12px] text-white/70"},"Valor extra:"), e(MoneyInput,{value:x.extra, label:"Valor extra", sm:true, className:"w-28", onChange:function(val){ set(n, {extra:val||0}); }}),
        e("input",{value:x.extraTxt||"", placeholder:"Motivo do extra (opcional)", "aria-label":"Motivo do extra", onChange:function(ev){ set(n, {extraTxt:ev.target.value}); }, className:"h-9 min-w-0 flex-1 rounded-lg border border-border bg-black/30 px-2 text-[13px] text-white placeholder:text-white/40"}))); };
  return bloco("Negociação do Pix direto","banco","Combine com cada representante quanto da comissão dela vai por Pix direto da revendedora. O financeiro acompanha em Representantes → Financeiro → Pix direto a enviar. Só a diretoria edita.",[
    e("div",{key:"l", className:"flex flex-col gap-2"},
      lista.length===0 && e("p",{className:"text-[13px] text-muted-foreground"},"Nenhuma negociação ainda."), lista.map(linha),
      livres.length>0 && e("select",{value:"", "aria-label":"Adicionar representante", className:sel+" self-start", onChange:function(ev){ if(ev.target.value) set(ev.target.value, {modo:"pct", valor:0, vigencia:"mes", mes:mesAtual}); }},
        e("option",{value:""},"+ Adicionar representante"), livres.map(function(n){ return e("option",{key:n, value:n}, n); })))]);
}

function AbaRegrasRepresentantes(){
  var cx = use(), d = cx.dispatch, s = cx.state, c = comisEfetiva(s);
  var hora = String(c.corteHora).padStart(2,"0")+"h";
  return e(React.Fragment,null,
    e("div",{className:"flex flex-wrap items-end justify-between gap-3"},
      e(PageHead,{t:"Regras dos representantes", sub:"O que vale para a representante: comissão, datas de pagamento, combustível e Pix. Os valores vêm do Configurador de comissões."}),
      e(Btn,{v:"ghost", sm:true, ic:"chevron", onClick:function(){ d({type:"ABA", aba:"regrasacerto"}); }}, "Ver regras dos acertos das revendedoras")),
    e("div",{className:"grid grid-cols-1 items-start gap-4 xl:grid-cols-2"},
      bloco("Comissão","coins","Igual para todas as representantes.",[
        e("div",{key:"p", className:"mb-3 flex items-baseline gap-2"}, e("b",{className:MONO+" text-4xl text-primary"}, c.pctPadrao+"%"), e("span",{className:"text-[13px] text-muted-foreground"},"sobre o valor do acerto da revendedora")),
        e("div",{key:"l"}, passos([
          "A comissão é calculada sobre o valor que a revendedora realmente pagou no acerto. O que ficou em aberto fica retido até ser pago.",
          "Para liberar: o agendamento confere o recebimento"+(c.exigirProm ? ", a nota promissória precisa estar assinada" : "")+" e o financeiro dá o OK dizendo em que conta o dinheiro entrou."]))]),
      bloco("Datas de pagamento","calendario","A comissão é paga em 3 datas por mês, conforme o grupo da representante.",[
        e("div",{key:"l"}, passos([
          e(React.Fragment,null,v("Grupo A: ")," dias "+(c.ciclos.A||[]).join(", ")+" · ",v("Grupo B: ")," dias "+(c.ciclos.B||[]).join(", ")+"."),
          "O que o financeiro confirmou até o corte entra naquela data; o que for confirmado depois entra na data seguinte.",
          e(React.Fragment,null,"Corte: ",v(hora+(c.corteDias===1 ? " do dia anterior" : c.corteDias>1 ? " de "+c.corteDias+" dias antes" : "")),"."),
          "Na tela de Comissões o caminho é: Pendente (falta o check do financeiro) → A pagar (já com check) → Pago → Restante."]))]),
      bloco("Combustível e quilometragem","caminhao","A representante informa o km total do período no app e a Sorelly paga o combustível pelo preço médio da gasolina.",[
        e("div",{key:"l"}, passos([
          e(React.Fragment,null,"Quem informa o combustível é a representante, no app, em cada pagamento, ",v("até as "+hora+" do último dia de acertos"),"."),
          e(React.Fragment,null,"Sem o km no prazo, o combustível pago é só o valor fixo de ",v(reais(c.combSemEnvio)),"."),
          e(React.Fragment,null,"A Sorelly paga ",v(c.kmPorLitro+" km por litro"),". Cálculo: km rodados ÷ "+c.kmPorLitro+" × preço do litro. Ex.: 110 km = 10 litros × R$ 6,78 = R$ 67,80."),
          "O preço do litro é a média de revenda da gasolina comum no Paraná, do levantamento semanal da ANP. Quem paga a comissão atualiza o valor sempre que for pagar.",
          "Em Comissões, cada representante tem a média de km por atendimento, comparada com a média de todas."]))]),
      bloco("Pix direto para a representante","banco","Quando a revendedora paga por Pix na conta da representante.",[
        e("div",{key:"l"}, passos([
          "O financeiro escolhe a representante e dá OK em Comissões.",
          "O valor já entra como pago na comissão dela. Se ainda não houver nada a pagar, o restante fica negativo."]))]),
      bloco("Kit novo e reposição","novas","Comissão fixa por entrega.",[
        e("div",{key:"l"}, passos([
          e(React.Fragment,null,"Kit novo: ",v(reais(c.kitNovo)),", ou ",v(reais(c.kitNovoExpo))," com expositor ",e("span",{className:"text-warning"},"(valores provisórios)"),"."),
          "Só libera com o termo assinado da revendedora (assinatura no app ou check manual do agendamento).",
          e(React.Fragment,null,"Reposição entregue: ",v(reais(c.reposicao||0))," por entrega, descrita como comissão. A representante entrega a ",v("condicional assinada")," (como no kit novo) e ela já sobe nas condicionais da revendedora.")]))]),
      (DIRETORIA.some(function(x){ return x.id===s.usuario; }) ? e(NegociacaoPix,{key:"neg", s:s, d:d}) : null),
      bloco("Compras de joias","gem","A representante também pode comprar joias da Sorelly.",[
        e("div",{key:"l"}, passos([
          "A compra é negociada e registrada em Representantes → Compras de joias.",
          "Os pagamentos da compra são lançados dentro dela, com forma, data e valor."]))])));
}

export { AbaRegrasRepresentantes };
