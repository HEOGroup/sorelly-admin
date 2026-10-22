// Sorelly Admin · montagem e bipagem — pages/Equipe.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { BlocoBarra, Extrato, ExtratoBip, TabelaEquipe } from "@/apps/montagem/components/equipe-blocos";
import { BIPADORAS } from "@/apps/montagem/domain/equipe";
import { dataPagamento, resumoBipadora, resumoMontadora } from "@/apps/montagem/domain/regras";
import { BK, N1, durCurta } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { badge } from "@/apps/montagem/ui/badge";
import { Btn } from "@/apps/montagem/ui/button";
import { KPI } from "@/apps/montagem/ui/card";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO, brl } from "@/apps/montagem/ui/input";
import { AlertaBadge, PageHead, Secao } from "@/apps/montagem/ui/page";
import { Relogio, RelogioB } from "@/apps/montagem/ui/relogio";
import { TD, TR, Tabela } from "@/apps/montagem/ui/table";
import { e } from "@/shared/react";
import React from "react";

function AbaEquipe(){
  var cx = use(), s = cx.state, d = cx.dispatch, c = s.cfg;
  var rm = s.montadoras.map(function(m){return resumoMontadora(m,s);}), rb = BIPADORAS.map(function(b){return resumoBipadora(b,s);});
  var soma = function(arr, f){ return arr.reduce(function(t,x){return t+x[f];},0); };
  var totM = soma(rm,"liquido"), totB = soma(rb,"liquido"), kitsM = soma(rm,"total"), kitsB = soma(rb,"total");
  var C = "py-2! px-2! text-center! ";
  var vazio = e("span",{className:"text-muted-foreground"},"—");
  var media = function(arr){ return arr.length ? arr.reduce(function(t,x){return t+x;},0)/arr.length : 0; };
  var rank = function(t, arr, nome, fmt, cor){ return e(BlocoBarra,{t:t, cor:cor}, e("ol",null,
    arr.map(function(r,i){ return e("li",{key:i, className:"grid grid-cols-[2.5rem_1fr_5.5rem] items-center border-b border-border px-3 py-1.5 text-center text-sm last:border-0"+(i===0?" bg-primary/10":"")},
      e("span",{className:MONO+" text-primary"}, (i+1)+"º"), e("span",{className:"truncate"+(i===0?" font-semibold":"")}, nome(r)), e("b",{className:MONO+(i===0?" text-primary":"")}, fmt(r))); }))); };
  return e(React.Fragment,null,
    e(PageHead,{t:"Equipe e comissões", sub:"Resultado de cada montadora e bipadora e o valor a receber em tempo real. Pagamento no dia "+c.diaPagamento+" do mês seguinte."},
      s.mesFechado ? badge("Mês fechado em "+new Date(s.mesFechado).toLocaleDateString("pt-BR"),"success","lock")
        : e(Btn,{v:"primary", ic:"lock", onClick:function(){d({type:"FECHAR_MES"});}},"Fechar mês")),
    e("div",{className:"grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5"},
      e(KPI,{compacto:true, l:"Total a pagar", v:brl(totM+totB), tom:"text-primary", sub:"em "+dataPagamento(c)}),
      e(KPI,{compacto:true, l:"Montadoras", v:brl(totM), sub:s.montadoras.length+" pessoas"}),
      e(KPI,{compacto:true, l:"Bipadoras", v:brl(totB), sub:BIPADORAS.length+" pessoas"}),
      e(KPI,{compacto:true, l:"Kits montados no mês", v:kitsM, sub:"custo "+brl(kitsM?totM/kitsM:0)+" por kit"}),
      e(KPI,{compacto:true, l:"Kits bipados no mês", v:kitsB, sub:"custo "+brl(kitsB?totB/kitsB:0)+" por kit"})),
    e(BlocoBarra,{t:"Montadoras", sub:brl(c.valorNormal)+" por kit, "+brl(c.valorEspecial)+" acima de "+BK(c.limiteEspecial)+" · a nota define o % · −"+c.divPerda+"% a cada "+c.divBloco+" divergências · clique para o extrato"},
      e(TabelaEquipe,{solta:true, min:"min-w-[66rem]", larg:[110,116,180,56,70,76,56,68,80,62,84,110],
          cols:["Montadora","Nota do mês","Agora","Hoje","Normais","Especiais","Nota","Recebe","Diverg.","Perda","Tempo méd.","A receber"]},
        rm.map(function(r){
          var ab = s.extrato===r.m.id, tempos = r.hojeK.map(function(k){return k.tempoM;}).filter(function(x){return x>0;});
          var linhas = [e("tr",{key:r.m.id, className:TR+" cursor-pointer"+(ab?" bg-primary/10":r.atual?" bg-purple/5":""), onClick:function(){d({type:"EXTRATO", id:r.m.id});}},
            e(TD,{className:C+"font-medium"}, e("span",{className:"inline-flex items-center gap-1.5"}, e(Icon,{n:ab?"chevrondown":"chevron", s:13, className:"text-primary"}), r.m.nome)),
            e(TD,{className:C}, e(AlertaBadge,{a:r.alerta, curto:true})),
            e(TD,{className:C+"truncate text-muted-foreground"}, r.atual
              ? e("span",{title:r.atual.rev}, r.atual.rev+" ", e(Relogio,{k:r.atual, curto:true, className:"font-semibold text-purple"})) : "Livre"),
            e(TD,{className:C+MONO}, r.hoje),
            e(TD,{className:C+MONO}, r.n),
            e(TD,{className:C+MONO}, r.e),
            e(TD,{className:C+MONO}, r.m.mes.aval?N1(r.media):"—"),
            e(TD,{className:C+MONO+(r.fator<100?" text-warning":"")}, r.fator+"%"),
            e(TD,{className:C+MONO+(r.div>=10?" font-bold text-destructive":"")}, r.div, e("span",{className:"ml-1 text-[11px] text-muted-foreground", title:"faltam para a próxima perda"},"("+r.faltamBloco+")")),
            e(TD,{className:C+MONO+(r.perda?" text-destructive":"")}, r.perda?"−"+r.perda+"%":"0%"),
            e(TD,{className:C+MONO}, tempos.length ? durCurta(media(tempos)) : vazio),
            e(TD,{className:C+MONO+" font-bold text-primary"}, brl(r.liquido)))];
          if(ab) linhas.push(e("tr",{key:r.m.id+"x", className:"bg-muted/20"}, e("td",{colSpan:12, className:"px-4 py-4"}, e(Extrato,{r:r}))));
          return linhas;
        }).concat([e("tr",{key:"tot", className:"bg-primary/10 font-medium"}, e(TD,{colSpan:11, className:"py-2! text-right!"},"Total das montadoras"), e(TD,{className:C+MONO+" font-bold"}, brl(totM)))]))),
    e(BlocoBarra,{cor:"azul", t:"Bipadoras", sub:brl(c.valorBipNormal)+" por kit, "+brl(c.valorBipEspecial)+" acima de "+BK(c.limiteBipEspecial)+" · −"+brl(c.perdaFalta)+" por peça faltando apontada pela representante · clique para o extrato"},
      e(TabelaEquipe,{solta:true, min:"min-w-[66rem]", larg:[110,180,56,70,90,84,110,100,100,84,110],
          cols:["Bipadora","Agora","Hoje","Normais","Acima 15 mil","Tempo méd.","Bip. x esp.","Diverg.","Faltando","Perda","A receber"]},
        rb.map(function(r){
          var ab = s.extrato===r.b.id;
          var linhas = [e("tr",{key:r.b.id, className:TR+" cursor-pointer"+(ab?" bg-primary/10":r.atual?" bg-info/5":""), onClick:function(){d({type:"EXTRATO", id:r.b.id});}},
            e(TD,{className:C+"font-medium"}, e("span",{className:"inline-flex items-center gap-1.5"}, e(Icon,{n:ab?"chevrondown":"chevron", s:13, className:"text-primary"}), r.b.nome)),
            e(TD,{className:C+"truncate text-muted-foreground"}, r.atual
              ? e("span",{title:r.atual.rev}, r.atual.rev+" ", e(RelogioB,{desde:r.atual.iniB, curto:true, className:"font-semibold text-info"})) : "Livre"),
            e(TD,{className:C+MONO}, r.hoje),
            e(TD,{className:C+MONO}, r.n),
            e(TD,{className:C+MONO}, r.e),
            e(TD,{className:C+MONO}, r.hoje ? durCurta(r.tempo) : vazio),
            e(TD,{className:C+MONO}, r.esp ? (r.real>=r.esp?"+":"")+N1((r.real-r.esp)/r.esp*100)+"%" : vazio),
            e(TD,{className:C+MONO}, r.divs),
            e(TD,{className:C+MONO+(r.faltas?" text-destructive":"")}, r.faltas),
            e(TD,{className:C+MONO+(r.perda?" text-destructive":"")}, r.perda?"−"+brl(r.perda):brl(0)),
            e(TD,{className:C+MONO+" font-bold text-primary"}, brl(r.liquido)))];
          if(ab) linhas.push(e("tr",{key:r.b.id+"x", className:"bg-muted/20"}, e("td",{colSpan:11, className:"px-4 py-4"}, e(ExtratoBip,{r:r}))));
          return linhas;
        }).concat([e("tr",{key:"tot", className:"bg-primary/10 font-medium"}, e(TD,{colSpan:10, className:"py-2! text-right!"},"Total das bipadoras"), e(TD,{className:C+MONO+" font-bold"}, brl(totB)))]))),
    e("div",{className:"grid grid-cols-1 gap-5 md:grid-cols-3"},
      rank("Mais kits montados", rm.slice().sort(function(a,b){return b.total-a.total;}), function(r){return r.m.nome;}, function(r){return r.total+" kits";}),
      rank("Mais bem avaliadas", rm.slice().sort(function(a,b){return b.media-a.media;}), function(r){return r.m.nome;}, function(r){return N1(r.media);}),
      rank("Mais kits bipados", rb.slice().sort(function(a,b){return b.total-a.total;}), function(r){return r.b.nome;}, function(r){return r.total+" kits";}, "azul")),
    e(Secao,{t:"Histórico de pagamentos"},
      e(Tabela,{min:"min-w-[30rem]", cols:[{t:"Mês"},{t:"Total",r:1},{t:"Pagamento"},{t:"Situação"}]},
        s.historico.map(function(h,i){ return e("tr",{key:i, className:TR}, e(TD,null,h.mes), e(TD,{r:true}, brl(h.total)), e(TD,{className:MONO}, h.pagoEm),
          e(TD,null, badge(h.situacao, h.situacao==="Pago"?"success":"warning"))); }))));
}

export { AbaEquipe };
