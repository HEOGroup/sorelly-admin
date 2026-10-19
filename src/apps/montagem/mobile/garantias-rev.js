// Sorelly Admin · montagem — mobile/garantias-rev.js
// Tela "Garantias" do app da REVENDEDORA (19/10/2026, a partir do print do app de hoje): busca e 2 abas (Certificados / Reclamações).
// Cada certificado é uma peça vendida no app (derivado das vendas: domain/garantias-rev.js). Reclamações ficam guardadas em s.gr para o setor Garantia & Pós-venda.
import { formatarDia } from "@/apps/montagem/domain/link-pagamento";
import { CATALOGO_REV, tipoDoCodigo } from "@/apps/montagem/domain/catalogo-rev";
import { MOTIVOS_RECLAMACAO, garantiasDaRevendedora, reclamacoesDaRevendedora } from "@/apps/montagem/domain/garantias-rev";
import { CabecaTela, FolhaTela } from "@/apps/montagem/mobile/rev-comum";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useState } from "@/shared/react";

var BR = "txt-branco";
var curta = function(iso){ var f = formatarDia(iso); return f ? f.slice(0, 6)+f.slice(8) : ""; };   // 06/10/26
var DOURADO = "#B8862B";
var SELO = {ativa:["Ativo", "#15803D", "#DCFCE7", "#22C55E"], vencida:["Vencida", "#6B7280", "#F3F4F6", "#9CA3AF"], reclamacao:["Em reclamação", "#B45309", "#FEF3C7", "#F59E0B"]};

function Foto(p){
  var c = CATALOGO_REV.filter(function(x){ return x.codigo===p.codigo; })[0];
  return c && c.foto ? e("img",{src:c.foto, alt:p.codigo, className:"size-12 shrink-0 rounded-lg object-cover"}) : e("span",{className:"grid size-12 shrink-0 place-items-center rounded-lg bg-[#F3F4F6] text-[#9CA3AF]"}, e(Icon,{n:"cubos", s:20}));
}
function Chip(p){ return e("span",{className:"flex items-center gap-1 whitespace-nowrap rounded-full bg-[#F3F4F6] px-1.5 py-1 text-[10.5px] font-semibold text-[#374151]"}, e(Icon,{n:p.ic, s:12, className:"text-[#6B7280]"}), p.t); }

function TelaGarantiasRev(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = p.k;
  var ab = useState("cert"), aba = ab[0], setAba = ab[1];
  var bq = useState(""), busca = bq[0], setBusca = bq[1];
  var ae = useState(null), aberta = ae[0], setAberta = ae[1];          // certificado com o formulário de reclamação aberto
  var mt = useState(""), motivo = mt[0], setMotivo = mt[1];
  var ds = useState(""), desc = ds[0], setDesc = ds[1];
  var cp = useState(""), copiado = cp[0], setCopiado = cp[1];
  var certs = garantiasDaRevendedora(s, k.rev), recs = reclamacoesDaRevendedora(s, k.rev);
  var q = busca.trim().toLowerCase();
  var lista = certs.filter(function(c){ return !q || [c.cert, c.cliente, "pedido #"+c.pedido, String(c.pedido), c.peca, tipoDoCodigo(c.peca)].join(" ").toLowerCase().indexOf(q)>=0; });
  var listaRec = recs.filter(function(r){ return !q || [r.cert, r.cliente, r.peca, r.motivo, "pedido #"+r.pedido].join(" ").toLowerCase().indexOf(q)>=0; });
  var copiar = function(cod){ try { navigator.clipboard.writeText(cod); } catch(x){} setCopiado(cod); setTimeout(function(){ setCopiado(""); }, 1500); };
  var abrirForm = function(c){ setAberta(aberta===c.cert ? null : c.cert); setMotivo(""); setDesc(""); };
  var enviar = function(c){ if(!motivo) return;
    d({type:"GR", op:"reclamar", por:k.rev+" (app)", revendedora:k.rev, cert:c.cert, peca:c.peca, vendaId:c.vendaId, pedido:c.pedido, cliente:c.cliente, motivo:motivo, descricao:desc});
    setAberta(null); setAba("rec"); };

  var cartao = function(c){ var st = SELO[c.status], form = aberta===c.cert;
    return e("div",{key:c.cert, className:"flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-[#D1D5DB]", style:{borderLeft:"4px solid "+st[3]}},
      e("div",{className:"flex items-start gap-2.5 px-2.5 pt-2.5"},
        e(Foto,{codigo:c.peca}),
        e("div",{className:"flex min-w-0 flex-1 flex-col"},
          e("div",{className:"flex items-center justify-between gap-2"}, e("span",{className:"text-[10.5px] font-bold tracking-wider text-[#9CA3AF]"}, "GARANTIA"),
            e("span",{className:"whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold", style:{background:st[2], color:st[1]}}, st[0])),
          e("div",{className:"flex items-center gap-1.5"}, e("b",{className:"truncate text-[14.5px] text-[#111827]"}, c.cert),
            e("button",{onClick:function(){ copiar(c.cert); }, "aria-label":"Copiar código", className:"grid size-6 shrink-0 place-items-center rounded-md text-[#6B7280]"}, copiado===c.cert ? e(Icon,{n:"check", s:14, className:"text-[#15803D]"}) : e(Icon,{n:"copiar", s:14}))),
          e("span",{className:"truncate whitespace-nowrap text-[12.5px] text-[#4B5563]"}, c.cliente+" · Pedido #"+c.pedido+" · "+c.peca))),
      e("div",{className:"mt-2 flex items-center gap-1 border-t border-[#F3F4F6] px-2.5 py-2"},
        e(Chip,{ic:"calendario", t:curta(c.emissao)}), e(Chip,{ic:"clock", t:curta(c.validade)}),
        c.status==="ativa" && e("button",{onClick:function(){ abrirForm(c); }, className:"ml-auto whitespace-nowrap rounded-lg px-2 py-1 text-[11.5px] font-bold ring-1 ring-[#E5E7EB]", style:{color:form ? "#6B7280" : DOURADO}}, form ? "Cancelar" : "Abrir reclamação")),
      form && e("div",{className:"flex flex-col gap-2 border-t border-[#E5E7EB] bg-[#F9FAFB] p-2.5"},
        e("b",{className:"text-[12.5px] text-[#111827]"}, "Qual é o problema?"),
        e("div",{className:"flex flex-wrap gap-1.5"}, MOTIVOS_RECLAMACAO.map(function(m){ var on = motivo===m;
          return e("button",{key:m, onClick:function(){ setMotivo(m); }, className:"whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-semibold ring-1 "+(on ? BR+" ring-transparent" : "bg-white text-[#374151] ring-[#D1D5DB]"), style:on ? {background:DOURADO} : undefined}, m); })),
        e("textarea",{value:desc, maxLength:300, rows:2, onChange:function(ev){ setDesc(ev.target.value); }, placeholder:"Descreva em poucas palavras (opcional)", className:"w-full resize-none rounded-lg bg-white p-2 text-[13px] text-[#111827] outline-none ring-1 ring-[#D1D5DB] placeholder:text-[#9CA3AF]"}),
        e("button",{onClick:function(){ enviar(c); }, disabled:!motivo, className:"h-10 rounded-xl text-[14px] font-bold "+BR+(motivo ? "" : " opacity-40"), style:{background:DOURADO}}, "Enviar reclamação")));
  };
  var cartaoRec = function(r){
    return e("div",{key:r.id, className:"flex items-start gap-2.5 rounded-xl bg-white p-2.5 ring-1 ring-[#D1D5DB]", style:{borderLeft:"4px solid "+(r.status==="aberta" ? "#F59E0B" : "#22C55E")}},
      e(Foto,{codigo:r.peca}),
      e("div",{className:"flex min-w-0 flex-1 flex-col"},
        e("div",{className:"flex items-center justify-between gap-2"}, e("b",{className:"truncate text-[14px] text-[#111827]"}, r.motivo),
          e("span",{className:"whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold "+(r.status==="aberta" ? "bg-[#FEF3C7] text-[#B45309]" : "bg-[#DCFCE7] text-[#15803D]")}, r.status==="aberta" ? "Aberta" : "Resolvida")),
        e("span",{className:"truncate whitespace-nowrap text-[12px] text-[#4B5563]"}, r.cert+" · Pedido #"+r.pedido),
        e("span",{className:"truncate whitespace-nowrap text-[12px] text-[#6B7280]"}, r.cliente+" · "+formatarDia(r.em)),
        r.descricao && e("span",{className:"mt-1 text-[12px] text-[#374151]"}, r.descricao)));
  };
  var abas = [["cert", "Certificados", certs.length], ["rec", "Reclamações", recs.length]];
  var vazio = function(t){ return e("p",{className:"rounded-xl bg-[#F9FAFB] p-5 text-center text-[13px] text-[#6B7280]"}, t); };
  return [e(CabecaTela,{key:"h", t:"Garantias", onVoltar:p.onVoltar}),
    e(FolhaTela,{key:"c"},
      e("label",{className:"flex h-11 items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-[#D1D5DB]"}, e(Icon,{n:"search", s:15, className:"shrink-0 text-[#9CA3AF]"}),
        e("input",{value:busca, onChange:function(ev){ setBusca(ev.target.value); }, placeholder:"Buscar por venda, código, nome ou produto", "aria-label":"Buscar garantia", className:"min-w-0 flex-1 truncate bg-transparent text-[14px] text-[#111827] outline-none placeholder:text-[#9CA3AF]"})),
      e("div",{className:"-mx-4 flex border-b border-[#E5E7EB] bg-white px-2"}, abas.map(function(a){ var on = aba===a[0];
        return e("button",{key:a[0], onClick:function(){ setAba(a[0]); }, className:"flex flex-1 items-center justify-center gap-1.5 border-b-[3px] py-2.5 text-[14px] font-bold", style:{borderColor:on ? DOURADO : "transparent", color:on ? DOURADO : "#6B7280"}},
          a[1], a[2]>0 && e("span",{className:"grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-black "+(on ? BR : "bg-[#D1D5DB] "+BR), style:on ? {background:DOURADO} : undefined}, a[2])); })),
      aba==="cert"
        ? (lista.length===0 ? vazio(certs.length===0 ? "Ainda não há garantias. Elas são emitidas junto com cada venda feita no app." : "Nenhum certificado encontrado.") : lista.map(cartao))
        : (listaRec.length===0 ? vazio(recs.length===0 ? "Nenhuma reclamação. Para abrir uma, toque em Abrir reclamação no certificado." : "Nenhuma reclamação encontrada.") : listaRec.map(cartaoRec))
    )];
}
export { TelaGarantiasRev };
