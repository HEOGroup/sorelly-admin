// Sorelly Admin — components/interno-resumo.js
// Visão geral → Atendimento interno: consolidado do mês (vendido, faturado, kits novos, reposições, média paga por acerto) e a listagem de HOJE resumida
// (horário, revendedora, tipo e valor). Só lê o que já existe: acertos registrados no atendimento interno (origem "interno") e a agenda (s.internos).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { BK, isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { MONO } from "@/apps/montagem/ui/input";
import { e } from "@/shared/react";

var TIPOS = {acerto:["Acerto","#E8B84B"], kit_novo:["Kit novo","#22C55E"], reposicao:["Reposição","#38BDF8"], premio:["Prêmio","#EC4899"], indicacao:["Indicação","#A78BFA"]};
var SIT = {acertado:["✓ feito","text-success"], atendendo:["atendendo","text-primary"], agendado:["agendado","text-white/70"]};

function resumoInterno(s){
  var hoje = isoDia(new Date()), mes = hoje.slice(0,7);
  var acs = (s.acertosConsignado||[]).filter(function(r){ return r.origem==="interno" && r.tipo==="acerto" && (r.data||"").slice(0,7)===mes; });
  var soma = function(f){ return acs.reduce(function(t,r){ return t+(f(r)||0); },0); };
  var vendido = soma(function(r){ return r.vendaLiquida!=null ? r.vendaLiquida : r.vendaBruta; }), faturado = soma(function(r){ return r.valorDevido!=null ? r.valorDevido : r.valorAcerto; });
  var pago = soma(function(r){ return (r.pagamentos||[]).filter(function(p){ return p.forma!=="acerto_loja"; }).reduce(function(t,p){ return t+(p.valor||0); },0); });
  var doMes = (s.internos||[]).filter(function(x){ return (x.data||"").slice(0,7)===mes && x.data<=hoje; });
  var hojeL = (s.internos||[]).filter(function(x){ return x.data===hoje; }).sort(function(a,b){ return (a.hora||"")<(b.hora||"") ? -1 : 1; });
  return {acertos:acs.length, vendido:vendido, faturado:faturado, pago:pago, media:acs.length ? pago/acs.length : 0,
    kitsNovos:doMes.filter(function(x){ return x.tipo==="kit_novo"; }).length, reposicoes:doMes.filter(function(x){ return x.tipo==="reposicao"; }).length, hoje:hojeL};
}

// faturado (valor devido) dos acertos do atendimento interno num dia
function faturadoDoDia(s, iso){
  return (s.acertosConsignado||[]).filter(function(r){ return r.origem==="interno" && r.tipo==="acerto" && (r.data||"").slice(0,10)===iso; })
    .reduce(function(t,r){ return t+((r.valorDevido!=null ? r.valorDevido : r.valorAcerto)||0); },0);
}

function BlocoInternoHoje(p){
  var s = use().state, r = resumoInterno(s);
  p = p || {};
  var cel = function(t, v, cor){ return e("div",{key:t, className:"flex min-w-0 flex-col items-center rounded-lg bg-black/25 px-1.5 py-1.5 text-center"},
    e("span",{className:"text-[9.5px] font-semibold uppercase leading-tight tracking-wide text-white/65"}, t), e("b",{className:MONO+" whitespace-nowrap text-[13.5px] leading-tight "+(cor||"")}, v)); };
  var valorDe = function(x){ if(x.acerto && x.acerto.vendaLiquida!=null) return x.acerto.vendaLiquida; if(x.vendaApp>0) return x.vendaApp;
    return (x.condicionais||[]).reduce(function(t,c){ return t+(c.valor||0); },0); };
  return e(BlocoBarra,{fixo:true, cor:"ouro", t:"Atendimento interno", sub:"consolidado do mês e a listagem de hoje", ir:p.ir, compacto:p.compacto},
    e("div",{className:"flex flex-col gap-2 p-2"},
      p.semLista ? e("div",{className:"grid grid-cols-2 gap-1.5"}, cel("Faturamento do dia", BK(faturadoDoDia(s, p.dia || isoDia(new Date()))), "text-success"), cel("Faturamento do mês", BK(r.faturado), "text-primary"))
      : e("div",{className:"grid grid-cols-3 gap-1.5"},
        cel("Vendido no mês", BK(r.vendido), "text-success"), cel("Faturado no mês", BK(r.faturado), "text-primary"), cel("Média paga/acerto", BK(r.media)),
        cel("Acertos no mês", r.acertos), cel("Kits novos", r.kitsNovos, "text-success"), cel("Reposições", r.reposicoes, "text-info")),
      p.semLista ? null : e("div",{className:"flex items-center justify-between rounded-lg bg-black/20 px-2.5 py-1.5"},
        e("b",{className:"text-[12.5px]"},"Hoje · "+r.hoje.length+(r.hoje.length===1 ? " revendedora" : " revendedoras")),
        e("span",{className:"text-[11px] text-white/65"}, r.hoje.filter(function(x){ return x.status==="acertado"; }).length+" já atendidas")),
      p.children || null,
      p.semLista ? null : r.hoje.length===0 ? e("p",{className:"p-2 text-center text-[12px] text-white/70"},"Nenhuma revendedora agendada para hoje.")
      : e("div",{className:"flex flex-col gap-1"}, r.hoje.map(function(x){ var tp = TIPOS[x.tipo||"acerto"] || TIPOS.acerto, st = SIT[x.status] || ["—","text-white/70"], v = valorDe(x);
          return e("div",{key:x.id, className:"flex items-center gap-2 rounded-lg bg-black/20 px-2.5 py-1 text-[12px]", style:{boxShadow:"inset 3px 0 0 "+tp[1]}},
            e("b",{className:MONO+" w-11 shrink-0 text-white/80"}, x.hora||"—"),
            e("span",{className:"min-w-0 flex-1 truncate font-semibold"}, x.nome),
            e("span",{className:"shrink-0 rounded px-1.5 text-[10px] font-bold", style:{background:tp[1]+"33", color:tp[1]}}, tp[0]),
            e("b",{className:MONO+" w-[6rem] shrink-0 whitespace-nowrap text-right"}, v>0 ? BK(v) : "—"),
            e("span",{className:"w-14 shrink-0 text-right text-[10.5px] font-semibold "+st[1]}, st[0])); }))));
}

export { BlocoInternoHoje, resumoInterno };
