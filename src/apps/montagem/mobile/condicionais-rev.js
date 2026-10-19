// Sorelly Admin · montagem — mobile/condicionais-rev.js
// Tela "Condicionais" do app da REVENDEDORA (19/10/2026). Refeita COMPACTA: no app de hoje cada condicional ocupava um cartão enorme (Marcus: "os blocos teriam que ser menos").
// Agora: resumo no topo, abas Em aberto / Encerradas e UMA linha-cartão por condicional (número, selo, datas, itens e valor, chave ligar/desligar); ao tocar, abre o Histórico de vendas.
// Dados: domain/garantias-rev.js (condicionaisDaRevendedora). Beatriz Nogueira = DEMONSTRAÇÃO; as demais usam as condicionais em aberto que o sistema já guarda. A chave fica em s.gr.cond.
import { formatarDia } from "@/apps/montagem/domain/link-pagamento";
import { tipoDoCodigo } from "@/apps/montagem/domain/catalogo-rev";
import { condicionaisDaRevendedora } from "@/apps/montagem/domain/garantias-rev";
import { BKC } from "@/apps/montagem/lib/format";
import { CabecaTela, FolhaTela } from "@/apps/montagem/mobile/rev-comum";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useState } from "@/shared/react";

var BR = "txt-branco";
var DOURADO = "#B8862B";
var dia = function(iso){ var f = formatarDia(iso); return f ? f.slice(0, 6)+f.slice(8) : "—"; };       // 02/10/26
var prazo = function(iso){ return !iso || String(iso).slice(0, 4)>="3000" ? "sem prazo" : dia(iso); };

function Chave(p){
  return e("button",{onClick:function(ev){ ev.stopPropagation(); p.onClick(); }, role:"switch", "aria-checked":p.on, "aria-label":p.on ? "Desativar condicional" : "Ativar condicional", className:"relative h-6 w-11 shrink-0 rounded-full transition-colors", style:{background:p.on ? DOURADO : "#D1D5DB"}},
    e("span",{className:"absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", style:{left:p.on ? 22 : 2}}));
}
function Mini(p){ return e("div",{className:"flex min-w-0 flex-1 flex-col rounded-xl bg-white px-2 py-1.5 ring-1 ring-[#E5E7EB]"}, e("span",{className:"truncate whitespace-nowrap text-[10px] font-bold tracking-wider text-[#9CA3AF]"}, p.t), e("b",{className:"whitespace-nowrap text-[12px] "+(p.dest ? "" : "text-[#111827]"), style:p.dest ? {color:DOURADO} : undefined}, p.v)); }

function TelaCondicionaisRev(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = p.k;
  var ab = useState("abertas"), aba = ab[0], setAba = ab[1];
  var ae = useState(null), aberta = ae[0], setAberta = ae[1];
  var todas = condicionaisDaRevendedora(s, k.rev), abertas = todas.filter(function(c){ return c.aberta; }), enc = todas.filter(function(c){ return !c.aberta; });
  var lista = aba==="abertas" ? abertas : enc;
  var totItens = abertas.reduce(function(t, c){ return t+c.itens; }, 0), totValor = abertas.reduce(function(t, c){ return t+(c.valor||0); }, 0);
  var linha = function(c){
    var on = c.aberta && c.ativa, selo = !c.aberta ? ["Encerrada", "#6B7280", "#F3F4F6", "#9CA3AF"] : on ? ["Ativa", "#15803D", "#DCFCE7", "#22C55E"] : ["Desativada", "#92400E", "#FEF3C7", "#F59E0B"], aberto = aberta===c.numero;
    return e("div",{key:c.numero, className:"flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-[#D1D5DB]", style:{borderLeft:"4px solid "+selo[3]}},
      e("div",{role:"button", tabIndex:0, onClick:function(){ setAberta(aberto ? null : c.numero); }, className:"flex cursor-pointer flex-col gap-1 px-2.5 py-2"},
        e("div",{className:"flex items-center gap-2"},
          e("b",{className:"truncate whitespace-nowrap text-[15px] tracking-wide text-[#111827]"}, c.numero),
          e("span",{className:"whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold", style:{background:selo[2], color:selo[1]}}, selo[0]),
          e("span",{className:"ml-auto flex items-center gap-2"}, c.aberta && e(Chave,{on:c.ativa, onClick:function(){ d({type:"GR", op:"cond_ativar", por:k.rev+" (app)", revendedora:k.rev, numero:c.numero, ativa:!c.ativa}); }}),
            e(Icon,{n:"chevron", s:14, className:"text-[#9CA3AF] transition-transform "+(aberto ? "rotate-90" : ""), "aria-hidden":true}))),
        e("div",{className:"flex items-center justify-between gap-2"},
          e("span",{className:"flex min-w-0 items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-[#4B5563]"},
            e(Icon,{n:"calendario", s:12, className:"text-[#6B7280]"}), dia(c.saida), e(Icon,{n:"undo", s:12, className:"text-[#6B7280]"}), prazo(c.devolucao)),
          e("span",{className:"flex shrink-0 items-baseline gap-1.5 whitespace-nowrap"}, e("span",{className:"flex items-center gap-0.5 text-[11.5px] text-[#6B7280]", title:"Itens"}, e(Icon,{n:"cubos", s:11}), c.itens), e("b",{className:"text-[13.5px]", style:{color:DOURADO}}, c.valor!=null ? BKC(c.valor) : "—")))),
      aberto && e("div",{className:"flex flex-col gap-1 border-t border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-2"},
        e("b",{className:"flex items-center gap-1.5 text-[12px] text-[#374151]"}, e(Icon,{n:"lista", s:13}), "Histórico de vendas"),
        c.vendas.length===0 ? e("span",{className:"py-1 text-[12px] text-[#6B7280]"}, "Nenhuma venda nesta condicional ainda.")
          : c.vendas.map(function(v, i){ return e("div",{key:i, className:"flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 ring-1 ring-[#E5E7EB]"},
              e("span",{className:"min-w-0 flex-1 truncate whitespace-nowrap text-[12.5px] text-[#111827]"}, v.codigo+" · "+tipoDoCodigo(v.codigo)), e("span",{className:"whitespace-nowrap text-[11.5px] text-[#6B7280]"}, dia(v.data)), e("b",{className:"whitespace-nowrap text-[12.5px] text-[#111827]"}, BKC(v.valor))); }),
        c.demo && e("span",{className:"text-[10.5px] text-[#9CA3AF]"}, "Dados de demonstração.")));
  };
  var abas = [["abertas", "Em aberto", abertas.length], ["encerradas", "Encerradas", enc.length]];
  return [e(CabecaTela,{key:"h", t:"Condicionais", sub:abertas.length+" em aberto · "+enc.length+" encerradas", onVoltar:p.onVoltar}),
    e(FolhaTela,{key:"c"},
      e("div",{className:"-mx-4 flex border-b border-[#E5E7EB] bg-white px-2"}, abas.map(function(a){ var on = aba===a[0];
        return e("button",{key:a[0], onClick:function(){ setAba(a[0]); setAberta(null); }, className:"flex flex-1 items-center justify-center gap-1.5 border-b-[3px] py-2.5 text-[14px] font-bold", style:{borderColor:on ? DOURADO : "transparent", color:on ? DOURADO : "#6B7280"}},
          a[1], e("span",{className:"grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-black "+(on ? BR : "bg-[#D1D5DB] "+BR), style:on ? {background:DOURADO} : undefined}, a[2])); })),
      aba==="abertas" && abertas.length>0 && e("div",{className:"flex gap-2"}, e(Mini,{t:"EM ABERTO", v:String(abertas.length)}), e(Mini,{t:"ITENS", v:String(totItens)}), e(Mini,{t:"VALOR", v:totValor ? BKC(totValor) : "—", dest:true})),
      lista.length===0 ? e("p",{className:"rounded-xl bg-[#F9FAFB] p-5 text-center text-[13px] text-[#6B7280]"}, aba==="abertas" ? "Nenhuma condicional em aberto." : "Nenhuma condicional encerrada.") : lista.map(linha)
    )];
}
export { TelaCondicionaisRev };
