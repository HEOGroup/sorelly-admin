// Sorelly Admin · montagem — mobile/preferencias-ver-rev.js
// Tela "Preferências do kit" do app da REVENDEDORA, só para VER (19/10/2026): cabeçalho com nome e resumo ouro/prata, aviso e um cartão por categoria
// (número colorido, título, resposta). Lê o módulo do admin (s.pk) pelo nome da revendedora. "Editar preferências" abre a tela de perguntas (preferencias-rev.js).
// Tamanho igual ao do app de verdade por enquanto; o Marcus vai pedir para enxugar depois.
import { pkDetalhe, formatarDataHora } from "@/apps/montagem/domain/preferencias-kit";
import { CabecaTela, FolhaTela } from "@/apps/montagem/mobile/rev-comum";
import { Avatar } from "@/apps/montagem/mobile/theme";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e } from "@/shared/react";

var norm = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
var BR = "txt-branco";

function BarraMetal(p){
  var o = p.ouro, pr = 100 - o, escuro = p.escuro;
  return e("div",{className:"flex flex-col gap-1.5"},
    e("div",{className:"flex items-center justify-between text-[13px] font-bold"}, e("span",{className:"text-[#D4A024]"}, o+"% Ouro"), e("span",{className:escuro ? "text-white" : "text-[#6B7280]"}, pr+"% Prata")),
    e("div",{className:"h-2.5 overflow-hidden rounded-full "+(escuro ? "bg-[#2A2A2E]" : "bg-[#E5E7EB]")}, e("span",{className:"block h-full rounded-full", style:{width:o+"%", background:"linear-gradient(90deg,#E8B84B,#C9921F)"}})));
}
function PontoMetal(p){
  var m = p.m, fundo = m==="Ouro" ? "#E0A12A" : m==="Prata" ? "#A6ABB3" : "linear-gradient(90deg,#E0A12A 50%,#A6ABB3 50%)";
  return e("span",{className:"inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[14px] text-[#111827]"}, e("span",{className:"size-5 rounded-full", style:{background:fundo}}), m);
}
function Pilula(p){ return e("span",{className:"inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-[#F3F4F6] px-3 py-1.5 text-[14px] text-[#374151]"}, p.hex && e("span",{className:"size-3.5 rounded-full border border-black/20", style:{background:p.hex}}), p.t); }
var Rotulo = function(t){ return e("p",{key:"r"+t, className:"text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]"}, t); };
var Vazio = function(t){ return e("p",{className:"text-[14px] italic text-[#9CA3AF]"}, t); };

function corpoDoBloco(it){
  var x = it.exibir, f = [];
  if(x.vazio) return Vazio("Não preenchido");
  if(x.vende===false) return Vazio("Não vende");
  if(x.ouroPct!=null) f.push(e(BarraMetal,{key:"b", ouro:x.ouroPct}));
  var linhasMetal = x.linhas.filter(function(l){ return l.metal && !l.valores.length; }), outras = x.linhas.filter(function(l){ return !(l.metal && !l.valores.length); });
  // quando o bloco só tem UM metal "solto" (ex.: Tornozeleira) mostra o rótulo e a pílula; vários (letras, filhos) viram linhas
  if(linhasMetal.length===1 && it.bloco.type!=="letras" && it.bloco.type!=="filhos" && it.bloco.type!=="vendmetal") f.push(Rotulo("Qual metal"), e("div",{key:"m"}, e(PontoMetal,{m:linhasMetal[0].metal})));
  else linhasMetal.forEach(function(l){ f.push(e("div",{key:"l"+l.rotulo, className:"flex items-center justify-between border-t border-[#F3F4F6] py-2 first:border-0"}, e("span",{className:"text-[15px] text-[#111827]"}, l.rotulo), e(PontoMetal,{m:l.metal}))); });
  outras.forEach(function(l){
    if(l.metal) f.push(Rotulo(l.rotulo), e("div",{key:"om"+l.rotulo}, e(PontoMetal,{m:l.metal})));
    else if(l.valores.length) f.push(Rotulo(l.rotulo), e("div",{key:"v"+l.rotulo, className:"flex flex-wrap gap-2"}, l.valores.map(function(v, i){ return e(Pilula,{key:v, t:v, hex:l.hex && l.hex[i]}); })));
    else if(l.vende===false) f.push(Vazio(l.rotulo+": não vende")); });
  return f.length ? f : Vazio("Não preenchido");
}
function CartaoCategoria(p){
  return e("div",{className:"flex flex-col gap-3 rounded-[22px] border border-[#D5D9E0] bg-white p-4"},
    e("div",{className:"flex items-center gap-3 border-b border-[#F0F1F4] pb-3"},
      e("span",{className:"grid size-11 shrink-0 place-items-center rounded-xl text-[18px] font-bold text-[#111827]", style:{background:p.cor}}, p.n),
      e("b",{className:"text-[19px] leading-tight text-[#111827]"}, p.t)),
    p.children);
}

function TelaPreferenciasVer(p){
  var cx = use(), s = cx.state, k = p.k, nome = k.rev, pk = s.pk;
  var rv = pk && (pk.revendedoras||[]).find(function(r){ return norm(r.nome)===norm(nome); });
  var det = rv ? pkDetalhe(s, rv.id) : null, pf = det && det.preferencias, tem = !!(pf && pf.temPreferencias);
  var faltam = det ? det.blocos.filter(function(b){ return b.exibir.vazio; }).map(function(b){ return b.bloco.title; }) : [];
  if(det && !(pf.observacoes||"").trim()) faltam.push("Observações");
  var editar = p.onEditar;
  var topo = e("div",{key:"h", className:"flex flex-col gap-3 "+BR},
    e(CabecaTela,{t:"Preferências do kit", onVoltar:p.onVoltar}),
    e("div",{className:"flex items-center gap-3 border-t border-dashed border-[#3A3A3F] pt-3"},
      e(Avatar,{nome:nome, i:0, className:"size-11 shrink-0 text-base"}),
      e("div",{className:"min-w-0"}, e("b",{className:"block truncate text-[17px] leading-tight"}, nome), e("span",{className:"text-[12.5px] opacity-60"}, tem && pf.atualizadoEm ? "Atualizado em "+formatarDataHora(pf.atualizadoEm) : "Ainda sem preferências"))),
    e("p",{className:"text-[12px] font-semibold uppercase tracking-wider opacity-60"}, "Resumo geral do kit"),
    tem && pf.resumoGeral ? e(BarraMetal,{ouro:pf.resumoGeral.ouro, escuro:true}) : e("p",{className:"text-[13px] italic opacity-60"}, "Sem proporção de ouro e prata ainda"),
    e("button",{onClick:editar, className:"flex h-12 items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-[#1B1409]", style:{background:"linear-gradient(90deg,#E8B84B,#C9921F)"}}, e(Icon,{n:"pencil", s:16}), tem ? "Editar preferências" : "Preencher preferências"));
  var aviso = e("div",{key:"av", className:"flex items-start gap-2.5 rounded-2xl border border-[#F2B8B5] bg-[#FDF1F0] p-3.5"}, e("span",{className:"mt-0.5 shrink-0 text-[#B42318]"}, e(Icon,{n:"alert", s:20})),
    e("p",{className:"text-[14px] leading-snug text-[#B42318]"}, e("b",null, "Atenção: "), "Estas são preferências, não um pedido garantido. As peças entram no kit conforme o estoque na data da montagem!"));
  var novas = faltam.length>0 && tem && e("button",{key:"nv", onClick:editar, className:"flex items-center gap-3 rounded-2xl border border-[#E8C766] bg-[#FDF5E4] p-3.5 text-left"},
    e("span",{className:"grid size-11 shrink-0 place-items-center rounded-xl bg-white text-[#D4A024]"}, e(Icon,{n:"gem", s:22})),
    e("span",{className:"min-w-0 flex-1"}, e("b",{className:"block text-[15px] text-[#111827]"}, faltam.length+(faltam.length>1 ? " novas preferências para preencher" : " nova preferência para preencher")), e("span",{className:"block text-[13px] leading-tight text-[#6B7280]"}, faltam.slice(0, 3).join(", ")+" — toque para atualizar")),
    e(Icon,{n:"chevron", s:16, className:"text-[#D4A024]"}));
  var cartoes = !tem ? [e("p",{key:"nada", className:"rounded-xl bg-[#F9FAFB] p-4 text-center text-[13px] text-[#6B7280]"}, "Você ainda não escolheu suas preferências. Toque em Preencher preferências.")]
    : det.blocos.map(function(b){ return e(CartaoCategoria,{key:b.bloco.key, n:b.numero, t:b.bloco.title, cor:b.bloco.accent || "#FFF3D6"}, corpoDoBloco(b)); })
      .concat([(pf.observacoes||"").trim() && e(CartaoCategoria,{key:"obs", n:det.blocos.length+1, t:"Observações", cor:"#FFF3D6"}, e("p",{className:"text-[14px] text-[#374151]"}, pf.observacoes))]);
  return [topo, e("div",{key:"c"}, e(FolhaTela,null, aviso, novas, tem && e("p",{key:"dt", className:"pt-1 text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]"}, "Detalhes por categoria"), cartoes))];
}
export { TelaPreferenciasVer };
