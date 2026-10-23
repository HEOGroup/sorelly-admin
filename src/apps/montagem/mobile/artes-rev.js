// Sorelly Admin · montagem — mobile/artes-rev.js
// Tela "Artes & Criativos" do app da revendedora: grade de artes (Feed, Story, Reels) para baixar e compartilhar. Props: k (a revendedora), onVoltar.
// Fonte: Marketing (s.mk); sem dados reais mostra artes de demonstração (domain/artes-rev.js).
import { FILTROS_ARTE, artesDisponiveis, rotuloTipoArte } from "@/apps/montagem/domain/artes-rev";
import { CabecaTela, FolhaTela } from "@/apps/montagem/mobile/rev-comum";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useState } from "@/shared/react";

var base = function(){ return "/" || "/"; };
var urlDe = function(u){ return /^(https?:|data:|blob:)/.test(u) ? u : base()+String(u).replace(/^\//, ""); };
var dia = function(iso){ var a = String(iso||"").split("-"); return a.length>=3 ? a[2].slice(0,2)+"/"+a[1] : ""; };
var botao = "flex h-11 flex-1 items-center justify-center rounded-xl text-[14px] font-bold active:scale-[.98]";

function ArteGrande(p){
  var a = p.a, link = a.url ? new URL(urlDe(a.url), window.location.href).href : a.videoLink;
  var zap = "https://wa.me/?text="+encodeURIComponent((a.legenda||a.nome)+(link ? "\n"+link : ""));
  return e("div",{className:"flex flex-col gap-3"},
    e("button",{onClick:p.onFechar, className:"flex items-center gap-1 self-start text-[13px] font-semibold text-[#6B7280]"}, e(Icon,{n:"chevron", s:13, className:"rotate-180"}), "Voltar às artes"),
    a.url ? e("img",{src:urlDe(a.url), alt:a.nome, className:"w-full rounded-2xl border border-[#E5E7EB] object-cover", style:{maxHeight:380}}) : e("div",{className:"grid h-48 place-items-center rounded-2xl bg-[#F9FAFB] text-[13px] text-[#6B7280]"}, "Vídeo disponível pelo link"),
    e("div",null, e("b",{className:"block truncate whitespace-nowrap text-[15px] text-[#111827]"}, a.nome), e("span",{className:"block truncate whitespace-nowrap text-[12px] text-[#6B7280]"}, rotuloTipoArte(a.tipo)+" · "+dia(a.data))),
    a.legenda && e("p",{className:"rounded-xl bg-[#F9FAFB] p-3 text-[12.5px] leading-snug text-[#374151]"}, a.legenda),
    e("div",{className:"flex gap-2"},
      a.url ? e("a",{href:urlDe(a.url), download:(a.nome||"arte").replace(/\s+/g, "-")+".jpg", className:botao+" text-[#1B1409]", style:{background:"#E8B84B"}}, "Baixar")
        : e("a",{href:a.videoLink, target:"_blank", rel:"noreferrer", className:botao+" text-[#1B1409]", style:{background:"#E8B84B"}}, "Abrir vídeo"),
      e("a",{href:zap, target:"_blank", rel:"noreferrer", className:botao+" border border-[#E5E7EB] bg-white text-[#111827]"}, "Compartilhar")));
}

function TelaArtesRev(p){
  var s = use().state, f = useState("TODAS"), filtro = f[0], setFiltro = f[1], sel = useState(null), aberta = sel[0], setAberta = sel[1];
  var lista = artesDisponiveis(s), vis = lista.filter(function(a){ return filtro==="TODAS" || a.tipo===filtro; });
  var conteudo = aberta ? e(ArteGrande,{a:aberta, onFechar:function(){ setAberta(null); }}) : [
    e("div",{key:"f", className:"flex gap-1.5"}, FILTROS_ARTE.map(function(x){ var on = filtro===x.v;
      return e("button",{key:x.v, onClick:function(){ setFiltro(x.v); }, className:"h-8 flex-1 rounded-full text-[12.5px] font-bold "+(on ? "text-[#1B1409]" : "border border-[#E5E7EB] text-[#374151]"), style:on ? {background:"#E8B84B"} : null}, x.r); })),
    vis.length ? e("div",{key:"g", className:"grid grid-cols-2 gap-2"}, vis.map(function(a){
      return e("button",{key:a.id, onClick:function(){ setAberta(a); }, className:"overflow-hidden rounded-xl border border-[#E5E7EB] bg-white text-left active:scale-[.98]"},
        e("div",{className:"relative"}, a.url ? e("img",{src:urlDe(a.url), alt:a.nome, className:"h-32 w-full object-cover"}) : e("div",{className:"grid h-32 place-items-center bg-[#F9FAFB]"}, e(Icon,{n:"play", s:24})),
          e("span",{className:"absolute left-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold txt-branco"}, rotuloTipoArte(a.tipo))),
        e("div",{className:"px-2 py-1.5"}, e("b",{className:"block truncate whitespace-nowrap text-[12.5px] text-[#111827]"}, a.nome), e("span",{className:"block truncate whitespace-nowrap text-[11px] text-[#6B7280]"}, dia(a.data)+" · Toque para ver")));
    })) : e("div",{key:"v", className:"rounded-xl bg-[#F9FAFB] p-5 text-center"}, e("b",{className:"block text-[14px] text-[#111827]"}, "Ainda não há artes aqui"), e("span",{className:"mt-1 block text-[12.5px] text-[#6B7280]"}, "Quando o Marketing publicar novas artes, elas aparecem nesta tela.")),
    lista.length && !lista[0].demo ? null : e("p",{key:"d", className:"text-center text-[11px] text-[#9CA3AF]"}, "Artes de demonstração")
  ];
  return [e(CabecaTela,{key:"h", t:"Artes & Criativos", sub:"Baixe e divulgue", onVoltar:aberta ? function(){ setAberta(null); } : p.onVoltar}), e(FolhaTela,{key:"c"}, conteudo)];
}
export { TelaArtesRev };
