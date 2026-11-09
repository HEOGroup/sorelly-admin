// Sorelly Admin · montagem — components/calendario-acertos.js
// CALENDÁRIO DOS ACERTOS (Marcus, 02/11/2026): o mesmo desenho no Painel e em Revendedoras. Cada dia mostra o dia da semana, o número do dia e a quantidade de acertos (ouro mais forte = mais acertos).
//  · Domingo e feriado (sábado tem expediente) têm pintura própria (violeta, borda tracejada); os demais dias ficam na cor padrão. O nome do feriado aparece ao passar o mouse.
//  · Botão Sistema | Agendado: Sistema conta todos os kits abertos pela data da DevMaster; Agendado conta só os que já têm agendamento na DevMaster.
// Acerto de domingo ou feriado passa para o próximo dia útil: valor(iso) pode trazer sai {n, para} (o que saiu deste dia) e entra (o que chegou de dias sem expediente).
// Props: ano, mes (0 a 11), valor(iso) → {n, f, sai, entra} (n = previstos/agendados do dia, f = feitos), dia (selecionado), onDia(iso), hojeIso, modo, setModo, onMes(ano, mes) (sem ele, não há setas), titulo (texto ao lado do mês), celula (altura fixa da célula em px; sem ele a grade preenche o espaço)
import { Segmentado } from "@/apps/montagem/components/padrao-fin";
import { tipoDoDia } from "@/apps/montagem/domain/feriados";
import { e } from "@/shared/react";

var MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
var NDIA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"], NDIA3 = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
var BORDA = "border-[rgba(232,184,75,.22)]";
var ouro = function(n, max){ return n<=0 ? null : "rgba(232,184,75,"+(0.10+0.42*(n/Math.max(1, max)))+")"; };
var violeta = function(n, max){ return "rgba(129,140,248,"+(n>0 ? 0.14+0.30*(n/Math.max(1, max)) : 0.07)+")"; };
var iso = function(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2, "0")+"-"+String(d.getDate()).padStart(2, "0"); };
var br = function(i){ return i.slice(8, 10)+"/"+i.slice(5, 7)+"/"+i.slice(0, 4); };

function CalendarioAcertos(p){
  var ano = p.ano, mes = p.mes, ult = new Date(ano, mes+1, 0).getDate(), vazios = new Date(ano, mes, 1).getDay(), dias = [];
  for(var d=1; d<=ult; d++) dias.push(iso(new Date(ano, mes, d)));
  var max = 0, total = 0; dias.forEach(function(i){ var v = p.valor(i), n = v && v.n ? v.n : 0; total += n; if(!tipoDoDia(i).tipo) max = Math.max(max, n); });
  var nav = function(delta){ var t = new Date(ano, mes+delta, 1); p.onMes(t.getFullYear(), t.getMonth()); };
  var BTN = "h-8 rounded-md border border-border bg-[#1d1d21] px-2.5 text-[13px]";
  return e("div",{className:"flex h-full flex-col rounded-xl border bg-[#131315] px-2 pb-2 pt-1.5 "+BORDA},
    e("div",{className:"mb-1.5 flex flex-wrap items-center justify-between gap-2"},
      p.onMes ? e("button",{type:"button", "aria-label":"Mês anterior", onClick:function(){ nav(-1); }, className:BTN}, "◀") : e("span",null),
      e("span",{className:"flex items-baseline gap-2"}, e("b",{className:"text-[13px]"}, MESES[mes]+" de "+ano), e("span",{className:"text-[13px] font-semibold text-[#E8B84B]"}, total.toLocaleString("pt-BR")+(p.modo==="agendado" ? " agendados" : " previstos")), p.titulo),
      p.onMes ? e("button",{type:"button", "aria-label":"Próximo mês", onClick:function(){ nav(1); }, className:BTN}, "▶") : e("span",null)),
    e("div",{className:"mb-1.5 flex flex-wrap items-center justify-between gap-2"},
      p.setModo ? e(Segmentado,{opcoes:[["sistema", "Todos os previstos"], ["agendado", "Já agendados"]], atual:p.modo || "sistema", onMudar:p.setModo}) : e("span",null),
      e("span",{className:"inline-flex items-center gap-1.5 text-[11px] text-foreground"}, e("i",{className:"inline-block size-3 rounded-sm border border-dashed", style:{background:"rgba(129,140,248,.30)", borderColor:"rgba(129,140,248,.65)"}}), "Domingo e feriado")),
    p.setModo && e("div",{className:"mb-1.5 text-[11px] text-foreground"}, p.modo==="agendado" ? "Só quem tem o acerto marcado na Agenda da DevMaster ou a Data Acerto preenchida na condicional. Observação sozinha não conta." : "Todas as revendedoras com acerto previsto no dia, tenham agendado ou não."),
    e("div",{className:"grid min-h-0 flex-1 grid-cols-7 gap-[3px]", style:{gridAutoRows:p.celula ? p.celula+"px" : "minmax(0,1fr)"}},
      Array.from({length:vazios}).map(function(_, i){ return e("div",{key:"v"+i}); }),
      dias.map(function(i){
        var v = p.valor(i) || {}, n = v.n || 0, f = v.f, sai = v.sai, entra = v.entra, w = new Date(i+"T00:00:00").getDay(), t = tipoDoDia(i), nu = !!t.tipo, sel = i===p.dia, hj = i===p.hojeIso, grande = sai ? 0 : (n>0 || f===undefined || f===null ? n : f);
        var tip = NDIA[w]+" "+br(i)+(t.tipo==="feriado" ? " · Feriado: "+t.nome : "")+" · "+(sai ? sai.n+" passam para "+br(sai.para) : n ? n+(p.modo==="agendado" ? " agendados" : " previstos")+(entra ? " (inclui "+entra+" de dias sem expediente)" : "") : "sem previstos")+(f!==undefined && f!==null ? " · "+f+" feitos" : "");
        return e("button",{key:i, type:"button", onClick:p.onDia ? function(){ p.onDia(i); } : undefined, title:tip,
          className:"flex flex-col justify-between rounded-[7px] border px-1.5 py-1 text-left "+(p.onDia ? "hover:border-[rgba(232,184,75,.55)] " : "")+(sel ? "border-transparent ring-2 ring-[#E8B84B]" : nu ? "border-dashed border-[rgba(129,140,248,.5)]" : "border-[#2c2c32]"),
          style:{background:nu ? violeta(n, max) : (ouro(n, max) || "#18181b")}},
          e("span",{className:"flex w-full items-baseline justify-between gap-1"}, e("span",{className:"text-[11px] font-bold "+(nu ? "text-[#c7d2fe]" : "")}, t.tipo==="feriado" ? "Feriado" : NDIA3[w]), e("span",{className:"text-[13px] font-bold leading-none "+(hj ? "text-[#E8B84B]" : "")}, new Date(i+"T00:00:00").getDate())),
          e("span",{className:"flex items-baseline justify-between gap-1"},
            e("span",{className:"text-[15px] font-bold leading-none tabular-nums "+(grande ? "" : "opacity-30")}, grande || "—"),
            n>0 && f!==undefined && f!==null && e("span",{className:"text-[11px] tabular-nums"}, f+" feitos"))); })));
}

export { CalendarioAcertos };
