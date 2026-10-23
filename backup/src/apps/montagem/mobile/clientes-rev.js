// Sorelly Admin · montagem — mobile/clientes-rev.js
// Tela "Clientes" do app da revendedora: lista com busca, "+" para cadastrar (nome + WhatsApp), editar, excluir e o detalhe de cada cliente
// (total comprado, quantidade de compras, última compra, histórico e botão do WhatsApp). A lista é a MESMA da venda (domain/clientes-rev.js).
// As compras vêm das vendas feitas no app (s.lp.vendasApp, pelo nome da cliente). Props: k (a revendedora), onVoltar.
import { adicionar, editar, excluir, formatarFone, lerClientes, linkWhats, validarCliente } from "@/apps/montagem/domain/clientes-rev";
import { formatarDia, formatarReais, vendasDaRevendedora } from "@/apps/montagem/domain/link-pagamento";
import { CabecaTela, FolhaTela } from "@/apps/montagem/mobile/rev-comum";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useState } from "@/shared/react";

var CAMPO = "h-11 w-full rounded-xl bg-white px-3 text-[14px] text-[#111827] outline-none ring-1 ring-[#E5E7EB] focus:ring-[#C9A13B]";
var BR = "txt-branco";
var norm = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };

function Avatar(p){ return e("span",{className:"grid size-10 shrink-0 place-items-center rounded-full bg-[#B8862B] text-[15px] font-black "+BR}, (p.nome||"?").trim().charAt(0).toUpperCase()); }

// formulário de nova cliente / edição
function FormCliente(p){
  var st = useState({nome:p.c ? p.c.nome : "", fone:p.c ? p.c.fone : ""}), v = st[0], setV = st[1];
  var er = useState(""), erro = er[0], setErro = er[1];
  var salvar = function(){ var m = validarCliente(v); if(m){ setErro(m); return; } p.onSalvar(v); };
  return e("div",{className:"flex flex-col gap-2 rounded-xl bg-[#FBF7EC] p-3 ring-1 ring-[#E8D9AE]"},
    e("b",{className:"text-[13px] text-[#5B4A1E]"}, p.c ? "Editar cliente" : "Nova cliente"),
    e("input",{className:CAMPO, placeholder:"Nome", value:v.nome, onChange:function(x){ setV({nome:x.target.value, fone:v.fone}); setErro(""); }}),
    e("input",{className:CAMPO, placeholder:"WhatsApp com DDD", inputMode:"tel", value:v.fone, onChange:function(x){ setV({nome:v.nome, fone:x.target.value}); setErro(""); }}),
    erro && e("span",{className:"text-[12px] font-semibold text-[#B91C1C]"}, erro),
    e("div",{className:"flex gap-2"},
      e("button",{onClick:p.onCancelar, className:"h-10 flex-1 rounded-xl bg-white text-[13px] font-bold text-[#374151] ring-1 ring-[#E5E7EB]"}, "Cancelar"),
      e("button",{onClick:salvar, className:"h-10 flex-1 rounded-xl bg-[#B8862B] text-[13px] font-bold "+BR}, "Salvar")));
}

function TelaClientesRev(p){
  var cx = use(), s = cx.state, k = p.k;
  var cl = useState(lerClientes), lista = cl[0], setLista = cl[1];
  var bs = useState(""), busca = bs[0], setBusca = bs[1];
  var fs = useState(null), form = fs[0], setForm = fs[1];        // null | "novo" | cliente em edição
  var ds = useState(null), detalheId = ds[0], setDetalheId = ds[1];
  var ex = useState(null), apagarId = ex[0], setApagarId = ex[1];
  var vendas = vendasDaRevendedora(s.lp, k.rev);
  var comprasDe = function(c){ return vendas.filter(function(v){ return norm(v.cliente)===norm(c.nome); }); };
  var resumo = function(c){ var l = comprasDe(c).filter(function(v){ return v.tipo==="venda"; }); var tot = 0; l.forEach(function(v){ tot += v.valor; }); return {qtd:l.length, total:Math.round(tot*100)/100, ultima:l.length ? l[0].em : null}; };
  var atual = detalheId ? lista.find(function(c){ return c.id===detalheId; }) : null;
  var cab = e(CabecaTela,{key:"h", t:atual ? atual.nome : "Clientes", sub:atual ? null : lista.length+(lista.length===1 ? " cliente" : " clientes"), onVoltar:atual ? function(){ setDetalheId(null); setForm(null); } : p.onVoltar,
    extra:!atual && e("button",{onClick:function(){ setForm("novo"); }, "aria-label":"Nova cliente", className:"grid size-8 shrink-0 place-items-center rounded-full bg-[#B8862B] "+BR}, e(Icon,{n:"plus", s:16}))});

  // ---- detalhe ----
  if(atual){
    var r = resumo(atual), hist = comprasDe(atual), wa = linkWhats(atual.fone);
    return [cab, e(FolhaTela,{key:"c"},
      e("div",{className:"flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-[#E5E7EB]"}, e(Avatar,{nome:atual.nome}),
        e("div",{className:"min-w-0 flex-1"}, e("b",{className:"block truncate text-[15px] text-[#111827]"}, atual.nome), e("span",{className:"block truncate whitespace-nowrap text-[12px] text-[#6B7280]"}, atual.fone ? formatarFone(atual.fone) : "Sem WhatsApp")),
        e("button",{onClick:function(){ setForm(atual); }, "aria-label":"Editar", className:"grid size-9 place-items-center rounded-full bg-[#F3F4F6] text-[#374151]"}, e(Icon,{n:"pencil", s:15}))),
      form && form!=="novo" && e(FormCliente,{c:atual, onCancelar:function(){ setForm(null); }, onSalvar:function(d){ setLista(editar(atual.id, d)); setForm(null); }}),
      e("div",{className:"grid grid-cols-3 gap-2"},
        [["Comprou", formatarReais(r.total)], ["Compras", String(r.qtd)], ["Última", r.ultima ? formatarDia(r.ultima.slice(0,10)).slice(0,5) : "—"]].map(function(x){
          return e("div",{key:x[0], className:"rounded-xl bg-[#F9FAFB] p-2 text-center ring-1 ring-[#E5E7EB]"}, e("span",{className:"block text-[10.5px] text-[#6B7280]"}, x[0]), e("b",{className:"block truncate text-[14px] text-[#111827]"}, x[1])); })),
      wa ? e("a",{href:wa, target:"_blank", rel:"noreferrer", className:"flex h-11 items-center justify-center gap-2 rounded-xl bg-[#15803D] text-[14px] font-bold "+BR}, e(Icon,{n:"phone", s:16}), "Chamar no WhatsApp")
         : e("p",{className:"rounded-xl bg-[#F9FAFB] p-3 text-center text-[12.5px] text-[#6B7280]"}, "Cadastre o WhatsApp para chamar daqui."),
      e("b",{className:"mt-1 text-[13px] text-[#111827]"}, "Histórico"),
      hist.length===0 ? e("p",{className:"rounded-xl bg-[#F9FAFB] p-4 text-center text-[12.5px] text-[#6B7280]"}, "Nenhuma venda ou proposta para esta cliente ainda.")
        : hist.map(function(v){ return e("div",{key:v.id, className:"flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-[#E5E7EB]"},
            e("div",{className:"min-w-0"}, e("b",{className:"block truncate whitespace-nowrap text-[13px] text-[#111827]"}, formatarReais(v.valor)), e("span",{className:"block text-[11.5px] text-[#6B7280]"}, formatarDia((v.em||"").slice(0,10)))),
            e("span",{className:"shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold "+(v.tipo==="venda" ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEF3C7] text-[#B45309]")}, v.tipo==="venda" ? "Venda" : "Proposta")); }))];
  }

  // ---- lista ----
  var q = norm(busca), qd = busca.replace(/\D/g, "");
  var vis = lista.filter(function(c){ return !q || norm(c.nome).indexOf(q)>=0 || (qd && String(c.fone||"").replace(/\D/g, "").indexOf(qd)>=0); }).sort(function(a, b){ return a.nome.localeCompare(b.nome); });
  return [cab, e(FolhaTela,{key:"c"},
    form==="novo" && e(FormCliente,{onCancelar:function(){ setForm(null); }, onSalvar:function(d){ setLista(adicionar(d)); setForm(null); }}),
    e("label",{className:"flex h-10 items-center gap-2 rounded-xl bg-[#F3F4F6] px-3"}, e(Icon,{n:"search", s:15, className:"text-[#9CA3AF]"}),
      e("input",{className:"min-w-0 flex-1 bg-transparent text-[14px] text-[#111827] outline-none", placeholder:"Buscar por nome ou telefone", value:busca, onChange:function(x){ setBusca(x.target.value); }})),
    vis.length===0 && e("p",{className:"rounded-xl bg-[#F9FAFB] p-5 text-center text-[13px] text-[#6B7280]"}, lista.length ? "Nenhuma cliente encontrada." : "Você ainda não tem clientes. Toque no + para cadastrar."),
    vis.map(function(c){
      var rr = resumo(c), confirma = apagarId===c.id;
      return e("div",{key:c.id, className:"flex flex-col gap-2 rounded-xl bg-white p-2.5 ring-1 ring-[#E5E7EB]"},
        e("div",{className:"flex items-center gap-2.5"},
          e("button",{onClick:function(){ setDetalheId(c.id); setForm(null); }, className:"flex min-w-0 flex-1 items-center gap-2.5 text-left"}, e(Avatar,{nome:c.nome}),
            e("span",{className:"min-w-0 flex-1"}, e("b",{className:"block truncate text-[14px] leading-tight text-[#111827]"}, c.nome),
              e("span",{className:"block truncate whitespace-nowrap text-[11.5px] text-[#6B7280]"}, (c.fone ? formatarFone(c.fone) : "Sem WhatsApp")+(rr.qtd ? " · "+rr.qtd+(rr.qtd===1 ? " compra" : " compras") : "")))),
          e("button",{onClick:function(){ setDetalheId(c.id); setForm(c); }, "aria-label":"Editar", className:"grid size-8 place-items-center rounded-full bg-[#F3F4F6] text-[#374151]"}, e(Icon,{n:"pencil", s:14})),
          e("button",{onClick:function(){ setApagarId(confirma ? null : c.id); }, "aria-label":"Excluir", className:"grid size-8 place-items-center rounded-full bg-[#FEE2E2] text-[#B91C1C]"}, e(Icon,{n:"trash", s:14}))),
        confirma && e("div",{className:"flex items-center justify-between gap-2 rounded-lg bg-[#FEF2F2] px-2.5 py-1.5"},
          e("span",{className:"min-w-0 truncate text-[12px] font-semibold text-[#B91C1C]"}, "Excluir "+c.nome+"?"),
          e("div",{className:"flex shrink-0 gap-1.5"}, e("button",{onClick:function(){ setApagarId(null); }, className:"rounded-lg bg-white px-2.5 py-1 text-[12px] font-bold text-[#374151] ring-1 ring-[#E5E7EB]"}, "Não"),
            e("button",{onClick:function(){ setLista(excluir(c.id)); setApagarId(null); }, className:"rounded-lg bg-[#B91C1C] px-2.5 py-1 text-[12px] font-bold "+BR}, "Excluir"))));
    }))];
}
export { TelaClientesRev };
