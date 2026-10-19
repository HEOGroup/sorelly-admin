// Sorelly Admin · montagem — pages/pf/Resumo.js
// Resumo do mês (Pagamentos a Fornecedores): Pix (sem NF) do mês por fornecedor e por data de acerto. Mesmo mês da tela de Lançamento.
// As contas vêm de domain/pf.js (resumoMes); aqui só o desenho.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { mesAtual, mesLabel, mesesComLanc, resumoMes } from "@/apps/montagem/domain/pf";
import { useMesLanc } from "@/apps/montagem/pages/pf/extrato";
import { COR, Chip, Sel, TD, Tile, brl, dbr, th, usePf } from "@/apps/montagem/pages/pf/ui";
import { PageHead } from "@/apps/montagem/ui/page";
import { e } from "@/shared/react";

// chip 💳 quando o pago inclui desconto da maquininha
function ChipDesc(p){ return p.v ? e("span",{title:p.v.dica, className:"ml-1 cursor-help"}, p.v.texto) : null; }

// várias datas em aberto: mostra a próxima e abre a lista completa com o valor de cada uma
function CelulaDatas(p){
  var ds = p.c.datas;
  if(!ds.length) return e("td",{className:TD+" text-muted-foreground"}, "—");
  if(ds.length===1) return e("td",{className:TD}, dbr(ds[0].venc));
  return e("td",{className:TD}, e("details",{onClick:function(ev){ ev.stopPropagation(); }, className:"relative"},
    e("summary",{className:"flex cursor-pointer list-none items-center gap-1.5 whitespace-nowrap"}, dbr(ds[0].venc), e("span",{className:"rounded-full bg-[#3B82F6]/25 px-2 text-[11px] font-bold text-[#F59E0B]"}, "+"+(ds.length-1)+" data"+(ds.length>2 ? "s" : "")), e(Ph,{n:"caret-down", s:12})),
    e("div",{className:"mt-1 flex min-w-52 flex-col gap-1 rounded-lg bg-black/30 p-2"}, ds.map(function(d){
      var quit = d.aberto<=0.005;
      return e("div",{key:d.venc, className:"flex items-center justify-between gap-4 text-[12.5px]"}, e("span",null, dbr(d.venc)), e("b",{className:"font-mono", style:{color:quit ? COR.green : undefined}}, brl(d.valor)+(quit ? " ✓" : "")));
    }))));
}

function AbaPfResumo(){
  var c = usePf(), pf = c.pf, mm = useMesLanc(), mes = mm[0], setMes = mm[1];
  var r = resumoMes(pf, mes), meses = mesesComLanc(pf, mes);
  var ir = function(){ c.d({type:"ABA", aba:"pfneg"}); };
  var tdn = TD+" text-right font-mono";
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Resumo do Mês", sub:"Mesmo recorte da tela de Lançamento — Pix (sem NF) por fornecedor e por data de acerto"},
      e(Sel,{value:mes, label:"Mês", className:"w-52", onChange:setMes}, meses.map(function(m){ return e("option",{key:m, value:m}, mesLabel(m+"-01")+(m===mesAtual() ? " · mês atual" : "")); }))),
    e("div",{className:"grid grid-cols-1 gap-3 md:grid-cols-3"},
      e(Tile,{t:"Total a pagar em Pix (sem NF)", v:brl(r.total), cor:COR.yellow, sub:r.nFornecedores+" fornecedor(es) · "+r.nDatas+" data(s) de pagamento em "+mesLabel(mes+"-01")}),
      e("div",{className:"flex flex-col items-center gap-1 rounded-xl bg-linear-to-br from-[#22C55E]/20 via-card to-card px-4 py-3 text-center ring-1 ring-[#22C55E]/40"},
        e("span",{className:"text-[10.5px] font-bold uppercase tracking-[.12em] text-muted-foreground"}, "Pix já enviados"),
        e("b",{className:"font-mono text-[22px] tabular-nums", style:{color:COR.green}}, brl(r.pago)),
        e("div",{className:"h-2 w-full overflow-hidden rounded-full bg-black/30"}, e("i",{className:"block h-full rounded-full", style:{width:Math.min(r.pct,100)+"%", background:r.pct>=99.5 ? COR.green : COR.orange}}))),
      e(Tile,{t:"Diferença que falta", v:brl(r.falta), cor:r.falta>0.005 ? COR.red : COR.green, sub:r.nAbertas ? r.nAbertas+" fornecedor(es) ainda em aberto" : "Tudo quitado neste mês"})),
    e(BlocoBarra,{t:"Pix do mês por fornecedor", sub:"Datas de acerto do mês selecionado · ordenado pela mais próxima", cor:"azul"},
      e("div",{className:"overflow-x-auto p-3"}, e("table",{className:"w-full border-collapse"},
        e("thead",null, e("tr",null, th("Fornecedor"), th("Datas de pagamento"), th("Próximo prazo"), th("A pagar","text-right"), th("Pago","text-right"), th("Falta","text-right"), th("%","text-right"), th("Status"))),
        e("tbody",null,
          !r.linhas.length ? e("tr",null, e("td",{colSpan:8, className:"px-3 py-8 text-center text-[14px] text-muted-foreground"}, "Nenhum pagamento sem NF (Pix) em "+mesLabel(mes+"-01")+".")) :
          r.linhas.map(function(l){
            return e("tr",{key:l.fornId, onClick:ir, title:"Ver nas Negociações", className:"cursor-pointer border-b border-border/50 hover:bg-white/5"},
              e("td",{className:TD}, e("b",null, l.nome)),
              e(CelulaDatas,{c:l.c}),
              e("td",{className:TD}, l.prazo ? e(Chip,{s:l.prazo}) : "—"),
              e("td",{className:tdn}, brl(l.c.total)),
              e("td",{className:tdn, style:{color:COR.green}}, brl(l.c.pago), e(ChipDesc,{v:l.chip})),
              e("td",{className:tdn, style:{color:l.c.aberto>0.005 ? COR.red : undefined}}, brl(l.c.aberto)),
              e("td",{className:tdn}, l.pct.toFixed(0)+"%"),
              e("td",{className:TD}, e(Chip,{s:l.status})));
          }),
          r.linhas.length>0 && e("tr",{className:"bg-black/25 font-bold"},
            e("td",{className:TD}, "TOTAL"), e("td",{className:TD}, r.nDatas+" data"+(r.nDatas>1 ? "s" : "")), e("td",{className:TD}),
            e("td",{className:tdn}, brl(r.total)),
            e("td",{className:tdn, style:{color:COR.green}}, brl(r.pago), e(ChipDesc,{v:r.descTot>0.005 ? {texto:"💳", dica:"Inclui "+brl(r.descTot)+" de desconto da maquininha"} : null})),
            e("td",{className:tdn, style:{color:COR.red}}, brl(r.falta)),
            e("td",{className:tdn}, r.pct.toFixed(0)+"%"), e("td",{className:TD})))))));
}

export { AbaPfResumo };
