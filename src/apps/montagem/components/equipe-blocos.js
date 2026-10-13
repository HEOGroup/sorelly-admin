// Sorelly Admin · montagem e bipagem — components/equipe-blocos.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { dataPagamento, ehEspecial } from "@/apps/montagem/domain/regras";
import { TIPO_KIT } from "@/apps/montagem/domain/status";
import { BK, N1, dur } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { BADGE } from "@/apps/montagem/ui/badge";
import { MONO, brl } from "@/apps/montagem/ui/input";
import { TD, TH, TR } from "@/apps/montagem/ui/table";
import { e } from "@/shared/react";

var BARRAS = {ouro:"bg-linear-to-r from-[#B8862B] via-[#E8B84B] to-[#F1E4C6] text-[#1B1409]", azul:"bg-linear-to-r from-[#1E4E8C] via-[#3B82F6] to-[#BFDBFE] text-white",
  roxo:"bg-linear-to-r from-[#5B2A86] via-[#8B5CF6] to-[#DDD6FE] text-white",
  prata:"bg-linear-to-r from-[#64748B] via-[#CBD5E1] to-[#F1F5F9] text-[#1B1409]",
  vermelho:"bg-linear-to-r from-[#991B1B] via-[#EF4444] to-[#FECACA] text-white"};
// p.ir = nome da aba: põe no canto da barra um botão "Abrir ›" que leva à tela do bloco. p.compacto = barra baixa e sem subtítulo.
function BlocoBarra(p){
  var d = use().dispatch;
  return e("section",{className:"overflow-hidden rounded-xl bg-card ring-1 ring-[#E8B84B]/25"},
    e("div",{className:"relative flex flex-col items-center text-center shadow-[inset_0_1px_0_rgba(255,255,255,.3)] "+(p.compacto ? "px-14 py-1.5 " : "px-4 py-2.5 ")+BARRAS[p.cor||"ouro"]},
      e("h2",{className:"font-heading font-bold leading-tight "+(p.compacto ? "text-[14px]" : "text-[16px]")}, p.t),
      p.sub && !p.compacto && e("p",{className:"mt-0.5 text-[12px] font-medium opacity-85"}, p.sub),
      p.ir && e("button",{onClick:function(){ d({type:"ABA", aba:p.ir}); }, title:"Abrir a tela completa",
        className:"absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-black/30 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-black/50"}, "Abrir ›")),
    p.children);
}
function ResumoCategorias(p){
  var ks = [];
  p.lista.forEach(function(h){ (h.kits||[]).forEach(function(k){ if(k.valor && k.real) ks.push(k); }); });
  var porValor = {}, porTipo = {};
  ks.forEach(function(k){
    porValor[k.valor] = porValor[k.valor] || {q:0, t:0}; porValor[k.valor].q++; porValor[k.valor].t += k.valor;
    var tp = k.tipoKit || "acerto_kit"; porTipo[tp] = porTipo[tp] || {q:0, t:0}; porTipo[tp].q++; porTipo[tp].t += k.valor;
  });
  var tot = ks.reduce(function(t,k){return t+k.valor;},0);
  var C = "py-1.5! px-3! text-center! ";
  var tabela = function(cab, linhas){ return e("table",{className:"w-full border-collapse text-sm"},
    e("thead",null, e("tr",{className:"bg-sidebar"}, cab.map(function(c,i){ return e(TH,{key:i, className:"py-2! text-center! text-[12px]! tracking-normal!"}, c); }))),
    e("tbody",null, linhas,
      e("tr",{className:"bg-primary/10 font-semibold"}, e(TD,{className:C},"Total"), e(TD,{className:C+MONO}, ks.length), e(TD,{className:C+MONO+" text-primary"}, BK(tot))))); };
  return e(BlocoBarra,{t:"Kits bipados por categoria", sub:(p.rep==="todas" ? "todas as representantes" : p.rep)+" · "+ks.length+" kits · "+BK(tot)},
    e("div",{className:"grid grid-cols-1 gap-0 md:grid-cols-2 md:divide-x md:divide-border"},
      tabela(["Valor do kit","Quantidade","Total"], Object.keys(porValor).map(Number).sort(function(a,b){return a-b;}).map(function(v){
        return e("tr",{key:v, className:TR}, e(TD,{className:C+MONO+" font-semibold text-primary"}, BK(v)), e(TD,{className:C+MONO}, porValor[v].q), e(TD,{className:C+MONO}, BK(porValor[v].t))); })),
      tabela(["Tipo","Quantidade","Total"], Object.keys(TIPO_KIT).filter(function(tp){return porTipo[tp];}).map(function(tp){
        return e("tr",{key:tp, className:TR}, e(TD,{className:C}, e("span",{className:"rounded-md border px-1.5 py-0.5 text-[12px] font-semibold "+BADGE[TIPO_KIT[tp][2]]}, TIPO_KIT[tp][0])),
          e(TD,{className:C+MONO}, porTipo[tp].q), e(TD,{className:C+MONO}, BK(porTipo[tp].t))); }))));
}
function TabelaEquipe(p){
  return e("div",{className:"overflow-x-auto bg-card "+(p.solta ? "" : "rounded-xl border border-border")},
    e("table",{className:"w-full table-fixed border-collapse text-sm "+(p.min||"min-w-[60rem]")},
      e("colgroup",null, p.larg.map(function(w,i){ return e("col",{key:i, style:w?{width:w}:undefined}); })),
      e("thead",null, e("tr",{className:"bg-sidebar"}, p.cols.map(function(c,i){ return e(TH,{key:i, className:"py-2! px-2! text-center! text-[12px]! tracking-normal!"}, c); }))),
      e("tbody",null, p.children)));
}
function Extrato(p){
  var s = use().state, r = p.r, c = s.cfg;
  var regs = s.registros.filter(function(x){return x.montId===r.m.id && x.tipo==="div";});
  var li = function(a,b,cls){ return e("li",{className:"flex justify-between gap-4 border-b border-border py-1.5 text-sm last:border-0 "+(cls||"")}, e("span",null,a), e("b",{className:MONO}, b)); };
  return e("div",{className:"grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]"},
    e("div",null, e("h4",{className:"mb-2 font-heading text-sm font-semibold"},"Composição"),
      e("ul",null,
        li("Até ontem: "+r.m.mes.n+" normais e "+r.m.mes.e+" especiais", brl(r.m.mes.n*c.valorNormal + r.m.mes.e*c.valorEspecial)),
        r.hojeK.map(function(k){ var esp = ehEspecial(k.valor,c); return e("li",{key:k.id, className:"flex justify-between gap-4 border-b border-border py-1.5 text-sm"},
          e("span",null,"Hoje, "+k.rev+", kit "+BK(k.valor)+(esp?" (especial)":"")), e("b",{className:MONO}, brl(esp?c.valorEspecial:c.valorNormal))); }),
        li("Valor bruto", brl(r.bruto), "font-medium"),
        li("Nota "+(r.m.mes.aval?N1(r.media):"—")+" com "+r.m.mes.aval+" avaliações, recebe "+r.fator+"%", "× "+r.fator+"%"),
        li(r.div+" divergências, perda de "+r.perda+"%", r.perda?"−"+r.perda+"%":"0%"),
        e("li",{className:"flex justify-between gap-4 pt-2 text-sm font-medium"}, e("span",null,"A receber em "+dataPagamento(c)), e("b",{className:MONO+" text-primary"}, brl(r.liquido))))),
    e("div",null, e("h4",{className:"mb-2 font-heading text-sm font-semibold"},"Divergências registradas"),
      regs.length ? e("ul",null, regs.map(function(x,i){ return li(x.dia+", "+x.rev, (x.pct>0?"+":"")+N1(x.pct)+"%", "text-destructive"); })) : e("p",{className:"text-sm text-muted-foreground"},"Nenhuma divergência no mês.")));
}
function ExtratoBip(p){
  var s = use().state, r = p.r, c = s.cfg;
  var li = function(a,b,cls){ return e("li",{className:"flex justify-between gap-4 border-b border-border py-1.5 text-sm last:border-0 "+(cls||"")}, e("span",null,a), e("b",{className:MONO}, b)); };
  return e("div",{className:"grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]"},
    e("div",null, e("h4",{className:"mb-2 font-heading text-sm font-semibold"},"Composição"),
      e("ul",null,
        li(r.n+" kits × "+brl(c.valorBipNormal), brl(r.n*c.valorBipNormal)),
        li(r.e+" kits acima de "+BK(c.limiteBipEspecial)+" × "+brl(c.valorBipEspecial), brl(r.e*c.valorBipEspecial)),
        li("Valor bruto", brl(r.bruto), "font-medium"),
        li(r.faltas+(r.faltas===1?" peça faltando":" peças faltando")+" apontadas pela representante × "+brl(c.perdaFalta), r.perda?"−"+brl(r.perda):brl(0), r.perda?"text-destructive":""),
        e("li",{className:"flex justify-between gap-4 pt-2 text-sm font-medium"}, e("span",null,"A receber em "+dataPagamento(c)), e("b",{className:MONO+" text-primary"}, brl(r.liquido))))),
    e("div",null, e("h4",{className:"mb-2 font-heading text-sm font-semibold"},"Bipados hoje"),
      r.hojeK.length ? e("ul",null, r.hojeK.map(function(k){ var df = k.valorReal ? (k.valorReal-k.valor)/k.valor*100 : 0;
          return li(k.rev+", "+dur(k.fimB-k.iniB), (df>0?"+":"")+N1(df)+"%", Math.abs(df)>c.divPct?"text-warning":""); }))
        : e("p",{className:"text-sm text-muted-foreground"},"Nenhum kit bipado hoje.")));
}

export { BARRAS, BlocoBarra, ResumoCategorias, TabelaEquipe, Extrato, ExtratoBip };
