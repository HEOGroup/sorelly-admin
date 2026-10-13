// Sorelly Admin — mobile/conf-pecas.js
// Conferência das peças do kit, no app da representante (a leitura pela câmera fica para o app de verdade; aqui se toca na peça ou se digita o código) (kit novo e acerto + kit). Depois de explicar as regras ela clica em
// "Liberar kit", vê o resumo (condicionais, peças e valor) e "Começar a bipar". Cada peça lida ganha o OK; código que não é do kit dá erro.
// Ao finalizar, o que faltou (ou veio a mais) sobe como erro de quem bipou o kit na empresa. No computador não há leitor de código de barras:
// ficam o campo para digitar o código e o botão de simular a leitura (para testar).
import { condicionaisDoKit, itensDe, resultado, totaisDe, totaisKit } from "@/apps/montagem/domain/conferencia-pecas";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";
import React from "react";

var BR = function(n){ return "R$ "+Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}); };
var BTN = "h-12 w-full rounded-2xl bg-[#C9A13B] text-[14px] font-bold txt-branco disabled:opacity-40";
var CARD = "rounded-2xl bg-white p-3 ring-1 ring-[#E5E7EB]";

function ConfPecas(p){
  var s = p.s, d = p.d, k = p.k, conf = (s.confBip||{})[k.id] || {};
  var conds = condicionaisDoKit(k), tot = totaisKit(conds);
  var cd = useState(""), codigo = cd[0], setCodigo = cd[1];
  var ab = useState(null), aberta = ab[0], setAberta = ab[1], cf = useState(false), confirmar = cf[0], setConfirmar = cf[1];
  var bipadora = k.bipId ? nomeDe(k.bipId) : "—", montadora = k.montId ? nomeDe(k.montId) : "—";
  var lido = function(c, i){ return Math.min(i.qtd, (conf.lidos||{})[c.numero+"|"+i.codigo]||0); };
  var lidas = conds.reduce(function(t,c){ return t+itensDe(c).reduce(function(x,i){ return x+lido(c,i); },0); },0);
  var bipar = function(c){ if(!c) return; d({type:"CONF_BIPAR", kitId:k.id, codigo:c}); };
  var proxima = function(){ var r = null; conds.some(function(c){ return itensDe(c).some(function(i){ if(lido(c,i)<i.qtd){ r = i; return true; } return false; }); }); return r; };

  var resumo = e("div",{className:"flex flex-col gap-2"},
    e("div",{className:"grid grid-cols-3 gap-2"},
      [["Condicionais", tot.condicionais],["Peças", tot.pecas],["Valor total", BR(tot.valor)]].map(function(x){
        return e("div",{key:x[0], className:"flex flex-col items-center rounded-xl bg-[#FEF3C7] px-1 py-2 text-center"},
          e("span",{className:"text-[10.5px] font-semibold uppercase text-[#92400E]"}, x[0]), e("b",{className:MONO+" text-[14px] text-[#92400E]"}, x[1])); })),
    conds.map(function(c){ var t = totaisDe(c); return e("div",{key:c.numero, className:"flex items-center justify-between rounded-xl bg-[#F9FAFB] px-3 py-2 ring-1 ring-[#E5E7EB]"},
      e("b",{className:"text-[13px] text-[#111827]"},"Condicional "+c.numero), e("span",{className:MONO+" text-[12px] text-[#6B7280]"}, t.modelos+" modelos · "+t.pecas+" peças · "+BR(t.valor))); }),
    e("p",{className:"text-[11.5px] text-[#6B7280]"},"Bipado na empresa por "+bipadora+" · montado por "+montadora));

  // 1) liberar
  if(!conf.lib) return e("div",{className:"flex flex-col gap-2.5"},
    e("p",{className:"text-[12.5px] text-[#374151]"},"Depois de explicar as regras para a revendedora, libere o kit para entregar e conferir as peças."), resumo,
    e("button",{onClick:function(){ d({type:"CONF_LIBERAR", kitId:k.id}); }, className:BTN},"Liberar kit"));
  // 2) começar a bipar
  if(!conf.ini) return e("div",{className:"flex flex-col gap-2.5"},
    e("p",{className:"rounded-xl bg-[#DCFCE7] px-3 py-2 text-[12.5px] font-bold text-[#15803D]"},"Kit liberado"), resumo,
    e("button",{onClick:function(){ d({type:"CONF_INICIAR", kitId:k.id}); }, className:BTN},"Começar a bipar"));
  // 4) resultado
  if(conf.fim){ var r = conf.resultado; return e("div",{className:"flex flex-col gap-2.5"},
    r.erros===0 ? e("div",{className:"flex flex-col gap-1 rounded-xl bg-[#DCFCE7] px-3 py-2.5"}, e("b",{className:"text-[13px] text-[#15803D]"},"Conferência concluída: "+r.lidas+" de "+r.esperadas+" peças, sem faltas."), r.nSobras>0 && e("span",{className:"text-[12px] text-[#92400E]"},"Peça(s) de outro kit (ficaram com a revendedora, só registrado): "+r.sobras.map(function(x){ return x.codigo; }).join(", ")))
    : e("div",{className:"flex flex-col gap-1.5 rounded-xl bg-[#FEE2E2] px-3 py-2.5"},
        e("b",{className:"text-[13px] text-[#991B1B]"},"Conferência concluída com "+r.erros+(r.erros===1 ? " erro" : " erros")),
        r.nFaltas>0 && e("span",{className:"text-[12px] text-[#991B1B]"},"Faltaram "+r.nFaltas+" peça(s): "+r.faltas.map(function(f){ return f.codigo+(f.qtd>1 ? " (×"+f.qtd+")" : ""); }).join(", ")),
        r.nSobras>0 && e("span",{className:"text-[12px] text-[#92400E]"},"Peça(s) de outro kit (ficaram com a revendedora, só registrado): "+r.sobras.map(function(x){ return x.codigo; }).join(", ")),
        e("span",{className:"text-[11.5px] text-[#991B1B]"},"Registrado como erro de "+bipadora+" (quem bipou o kit) no Consolidado e na Listagem.")),
    p.onContinuar && e("button",{onClick:p.onContinuar, className:BTN},"Continuar"),
    e("button",{onClick:function(){ d({type:"CONF_REINICIAR", kitId:k.id}); }, className:"h-9 rounded-xl bg-[#F3F4F6] text-[12px] font-semibold text-[#6B7280]"},"Refazer a conferência (teste)")); }
  // 3) bipando
  var ult = conf.ultimo, pct = tot.pecas ? Math.round(lidas/tot.pecas*100) : 0, falta = tot.pecas-lidas;
  var aviso = !ult ? null : ult.tipo==="ok" ? ["#DCFCE7","#15803D","✓ OK · "+ult.codigo+" · "+ult.desc]
    : ult.tipo==="repetida" ? ["#FEF3C7","#92400E","Já conferida: "+ult.codigo+". Peça lida de novo, não conta."]
    : ["#FEF3C7","#92400E","Peça "+ult.codigo+" não é deste kit. Pode deixar com a revendedora: fica só registrado."];
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"flex flex-col gap-1"},
      e("div",{className:"flex items-center justify-between text-[12.5px] font-bold text-[#111827]"}, e("span",null,"Conferidas "+lidas+" de "+tot.pecas), e("span",{className:MONO},pct+"%")),
      e("span",{className:"h-2 overflow-hidden rounded-full bg-[#E5E7EB]"}, e("span",{className:"block h-full rounded-full bg-[#16A34A]", style:{width:pct+"%"}}))),
    e("p",{className:"text-[12px] text-[#6B7280]"},"Toque em cada peça para marcar OK ou digite o código. Peça que não é deste kit: pode deixar com a revendedora, só fica registrado."),
    e("form",{onSubmit:function(ev){ ev.preventDefault(); bipar(codigo); setCodigo(""); }, className:"flex gap-1.5"},
      e("input",{value:codigo, onChange:function(ev){ setCodigo(ev.target.value); }, placeholder:"digite o código da peça", autoCapitalize:"characters", className:"h-10 min-w-0 flex-1 rounded-lg bg-white px-3 text-[13px] text-[#111827] outline-none ring-1 ring-black/10"}),
      e("button",{type:"submit", className:"h-10 shrink-0 rounded-lg bg-[#111827] px-3 text-[12.5px] font-bold txt-branco"},"Bipar")),
    aviso && e("p",{className:"rounded-xl px-3 py-2 text-[12.5px] font-bold", style:{background:aviso[0], color:aviso[1]}}, aviso[2]),
    conds.map(function(c){ var its = itensDe(c), feitas = its.reduce(function(t,i){ return t+lido(c,i); },0), tp = its.reduce(function(t,i){ return t+i.qtd; },0), on = aberta===c.numero || (aberta===null && conds.length===1);
      return e("div",{key:c.numero, className:CARD+" flex flex-col gap-1.5 p-2!"},
        e("button",{onClick:function(){ setAberta(on ? "" : c.numero); }, className:"flex items-center gap-2 px-1 py-1 text-left"},
          e("b",{className:"flex-1 text-[13px] text-[#111827]"},"Condicional "+c.numero), e("span",{className:MONO+" text-[12px] font-bold "+(feitas===tp ? "text-[#15803D]" : "text-[#6B7280]")}, feitas+"/"+tp),
          e(Icon,{n:on ? "chevrondown" : "chevron", s:14, className:"text-[#6B7280]"})),
        on && c.grupos.map(function(g){ var gf = g.itens.reduce(function(t,i){ return t+lido(c,i); },0), gt = g.itens.reduce(function(t,i){ return t+i.qtd; },0);
          return e("div",{key:g.cod, className:"flex flex-col gap-1"},
            e("p",{className:"mt-1 flex items-center justify-between rounded-lg bg-[#F3F4F6] px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-[#6B7280]"}, e("span",null,g.cod+" · "+g.nome), e("span",{className:MONO}, gf+"/"+gt)),
            g.itens.map(function(i){ var l = lido(c,i), ok = l>=i.qtd;
              return e("button",{key:i.codigo, onClick:function(){ bipar(i.codigo); }, title:"Toque para marcar OK",
                className:"flex items-start gap-2 rounded-lg px-2 py-1.5 text-left "+(ok ? "bg-[#F0FDF4]" : l>0 ? "bg-[#FEF9C3]" : "bg-white ring-1 ring-[#F3F4F6]")},
                e("span",{className:"mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-black "+(ok ? "bg-[#16A34A] txt-branco" : "bg-[#E5E7EB] text-[#9CA3AF]")}, ok ? "✓" : ""),
                e("span",{className:"min-w-0 flex-1"}, e("b",{className:MONO+" block text-[12px] text-[#111827]"}, i.codigo), e("span",{className:"block text-[10.5px] leading-tight text-[#6B7280]"}, i.desc)),
                e("span",{className:"flex shrink-0 flex-col items-end"}, e("b",{className:MONO+" text-[11.5px] "+(ok ? "text-[#15803D]" : "text-[#6B7280]")}, l+"/"+i.qtd), e("span",{className:MONO+" text-[10.5px] text-[#6B7280]"}, BR(i.valor)))); })); })); }),
    (conf.erros||[]).length>0 && e("div",{className:"flex flex-col gap-1 rounded-xl bg-[#FEF3C7] px-3 py-2"},
      e("b",{className:"text-[12.5px] text-[#92400E]"},"Peças de outro kit — pode deixar, só registrado ("+conf.erros.length+")"), e("span",{className:MONO+" text-[12px] text-[#92400E]"}, conf.erros.map(function(x){ return x.codigo; }).join(", "))),
    !confirmar ? e("button",{onClick:function(){ setConfirmar(true); }, className:BTN},"Finalizar a conferência")
    : e("div",{className:"flex flex-col gap-2 rounded-2xl bg-[#FEF3C7] p-3"},
        e("p",{className:"text-[12.5px] font-bold text-[#92400E]"}, falta>0 ? "Ainda faltam "+falta+" peça(s). Ao finalizar elas viram ERRO de "+bipadora+"." : "Tudo conferido. Finalizar?"),
        e("div",{className:"flex gap-2"},
          e("button",{onClick:function(){ setConfirmar(false); }, className:"h-10 flex-1 rounded-xl bg-white text-[12.5px] font-bold text-[#111827] ring-1 ring-[#E5E7EB]"},"Voltar"),
          e("button",{onClick:function(){ setConfirmar(false); d({type:"CONF_FINALIZAR", kitId:k.id}); }, className:"h-10 flex-1 rounded-xl bg-[#C9A13B] text-[12.5px] font-bold txt-branco"},"Sim, finalizar"))));
}

export { ConfPecas };
