// Sorelly Admin · montagem — pages/PrevisaoCaixa.js
// Previsão de caixa (Marcus, 26/10/2026): parte do saldo real de hoje e desconta dia a dia as contas a pagar
// já lançadas (domain/previsao-caixa.js). Cada CNPJ soma 1/5 do previsto a receber (dividido igual entre os
// 5, porque ainda não se sabe em qual CNPJ o Pix vai cair); "Consolidado" soma os 5 CNPJs inteiros.
import { Bloco, brl, corSinal, FaixaTotais, Segmentado, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { CNPJS, previsaoCaixa } from "@/apps/montagem/domain/previsao-caixa";
import { BKC } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
var diaSemana = function(iso){ var p = iso.split("-").map(Number); return SEMANA[new Date(Date.UTC(p[0], p[1]-1, p[2])).getUTCDay()]; };
var br = function(iso){ return iso.slice(8,10)+"/"+iso.slice(5,7); };
var OPCOES = [["cons","Consolidado"]].concat(CNPJS);

function AbaPrevisaoCaixa(){
  var cx = use(), s = cx.state;
  var st = useState("cons"), sel = st[0], setSel = st[1];
  var dados = previsaoCaixa(s.saldosContas);
  var consView = dados && Object.assign({id:"cons", nome:"Consolidado"}, dados.consolidado);
  var atual = dados && (sel==="cons" ? consView : dados.cnpjs.find(function(c){ return c.id===sel; }));
  return e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"flex h-10 items-center justify-between gap-2"},
      e("h1",{className:"truncate text-[16px] font-semibold text-foreground"}, "Previsão de caixa")),
    !dados
      ? e("p",{className:"px-1 text-[13px] text-muted-foreground"}, "Sem contas a pagar lançadas por dia ainda.")
      : e("div",{className:"flex flex-col gap-3"},
          e(FaixaTotais,{itens:[{t:"Consolidado hoje", v:brl(consView.saldoHoje), cor:corSinal(consView.saldoHoje)}].concat(dados.cnpjs.map(function(c){ return {t:c.nome+" hoje", v:brl(c.saldoHoje), cor:corSinal(c.saldoHoje)}; }))}),
          e(FaixaTotais,{itens:[{t:"Consolidado · pior dia", v:brl(consView.pior), cor:corSinal(consView.pior)}].concat(dados.cnpjs.map(function(c){ return {t:c.nome+" · pior dia", v:brl(c.pior), cor:corSinal(c.pior)}; }))}),
          e(Segmentado,{opcoes:OPCOES, atual:sel, onMudar:setSel}),
          atual && e("div",{className:"flex flex-col gap-3"},
            e(Bloco,{t:"Saldo real hoje ("+br(atual.dataHoje)+")", dir:e("span",{className:"text-[13px] "+corSinal(atual.saldoHoje)}, brl(atual.saldoHoje)+(atual.limite>0 ? " · limite "+BKC(atual.limite) : " · sem cheque especial"))}),
            e("p",{className:"px-1 text-[12px] text-muted-foreground"}, sel==="cons" ? "Soma os 5 CNPJs, com o previsto a receber inteiro." : "O previsto a receber está dividido igual entre os 5 (1/5 por CNPJ), porque ainda não se sabe em qual CNPJ o Pix vai cair."),
            e(TabelaP,{cols:[{t:"Dia", w:64}, {t:"Semana", w:64}, {t:"A pagar", w:110, n:true}, {t:"A receber", w:110, n:true}, {t:"Saldo projetado", w:140, n:true}, {t:"Situação", w:110, c:true}]},
              atual.linhas.map(function(l){ return e(Tr,{key:l.dia, alerta:l.estourou},
                e(Td,null, br(l.dia)), e(Td,null, diaSemana(l.dia)),
                e(Td,{n:true}, l.apagar>0 ? BKC(l.apagar) : "—"),
                e(Td,{n:true, cor:"text-success"}, l.receber>0 ? BKC(l.receber) : "—"),
                e(Td,{n:true, cor:corSinal(l.saldo)}, brl(l.saldo)),
                e(Td,{c:true, cor:l.estourou ? "text-destructive" : "text-success"}, l.estourou ? "Estourou" : "OK")); })))));
}

export { AbaPrevisaoCaixa };
