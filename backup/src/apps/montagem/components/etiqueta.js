// Sorelly Admin · montagem e bipagem — components/etiqueta.js
// Cartão do kit no app da montadora (próximo kit / kit que ela está montando). Layout claro, uma coisa por bloco, tudo escrito por extenso (19/10/2026).
// A montadora NÃO vê valores (vendas, valor do kit): vê o tipo do kit, o que enviar e as preferências reais da revendedora (módulo Preferências do kit).
import { CondChips, CondLista } from "@/apps/montagem/components/condicionais";
import { condOk } from "@/apps/montagem/domain/condicionais";
import { modalidadeDe } from "@/apps/montagem/domain/consignado";
import { pkResumoParaMontagem } from "@/apps/montagem/domain/preferencias-relatorio";
import { ehAtencao, listagemDe, pecasPara } from "@/apps/montagem/domain/regras";
import { TIPO_KIT } from "@/apps/montagem/domain/status";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { Relogio } from "@/apps/montagem/ui/relogio";
import { e, useState } from "@/shared/react";

var BORDA = "border border-[#E9DDBB]";
// bloco com título pequeno em cima e conteúdo embaixo
function Bloco(p){ return e("div",{className:"flex flex-col gap-2 rounded-2xl bg-[#FAFAF7] p-3.5 "+BORDA+" "+(p.className||"")}, p.t && e("p",{className:"text-[12.5px] font-bold uppercase tracking-wide text-[#8A6A12]"}, p.t), p.children); }
function Selinho(p){ return e("span",{className:"rounded-full px-3 py-1 text-[13px] font-bold", style:{background:p.cor+"1F", color:p.cor}}, p.children); }

function Etiqueta(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = p.k, l = listagemDe(s, k);
  var ativo = k.status==="montando", atencao = ehAtencao(k.valor, s.cfg), pecas = pecasPara(k.valor, s.cfg);
  var conds = (k.cond && k.cond.nums) || [], pc = useState(false), pegou = pc[0], setPegou = pc[1];
  var prefsReais = pkResumoParaMontagem(s, k.rev);
  var tipo = (TIPO_KIT[k.tipoKit]||TIPO_KIT.acerto_kit)[0], total = pecas ? pecas.itens.reduce(function(t,x){return t+x.q;},0) : 0;
  var destaque = ativo ? " ring-2 ring-[#C9A13B]" : p.tipo==="pedido" ? " ring-2 ring-[#F59E0B]" : "";
  return e("div",{className:"overflow-hidden rounded-3xl bg-white shadow-sm "+BORDA+destaque},
    e("div",{className:"flex flex-col gap-1.5 bg-[#F6EBCB] px-4 py-3"},
      e("b",{className:"text-[17px] leading-tight text-[#111827]"}, "Representante "+l.rep),
      e("div",{className:"flex flex-wrap items-center gap-2"},
        e("span",{className:"inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[13px] font-bold text-[#6B5B2A]"}, e(Icon,{n:"clock", s:14}), "Retirada às "+l.horario),
        l.viagem && e("span",{className:"text-[13px] font-semibold text-[#6B5B2A]"}, "Viagem para "+l.destino))),
    e("div",{className:"flex flex-col gap-3 p-4"},
      p.tipo==="pedido" && e("div",{className:"rounded-xl bg-[#FEF5DC] px-3 py-2.5 text-[14px] font-bold text-[#92400E]"}, "A Deysiane pediu este kit agora"),
      k.status==="ajuste" && e("div",{className:"rounded-xl bg-[#FDECEC] px-3 py-2.5 text-[14px] font-bold text-[#B91C1C]"}, "Voltou para ajuste: "+k.motivo),
      e("div",{className:"flex flex-col gap-1"},
        e("p",{className:"text-[24px] font-extrabold leading-tight text-[#111827]"}, k.rev),
        k.bairro && e("p",{className:"text-[14px] text-[#6B7280]"}, k.bairro),
        e("div",{className:"mt-1 flex flex-wrap gap-2"},
          e(Selinho,{cor:"#8A6A12"}, tipo),
          modalidadeDe(s, k.rev)==="prata" && e(Selinho,{cor:"#475569"}, "Kit 100% Prata"),
          k.prio && e(Selinho,{cor:"#B45309"}, "Prioridade"),
          atencao && e(Selinho,{cor:"#B91C1C"}, "Precisa de conferência"),
          k.tipo==="ac_sai" && e(Selinho,{cor:"#2563EB"}, "Vai sair"),
          k.ultimaHora && e(Selinho,{cor:"#EA580C"}, "Última hora"))),
      conds.length>0 && !ativo && e(Bloco,{t:conds.length>1 ? conds.length+" condicionais para pegar" : "1 condicional para pegar"},
        e(CondChips,{k:k, papel:"m"}), e("p",{className:"text-[13px] text-[#6B7280]"}, "Só dá para marcar depois de iniciar a montagem.")),
      pecas && e(Bloco,{t:"O que enviar · "+pecas.totalTxt+" peças no total"},
        e("div",{className:"grid grid-cols-2 gap-2"}, pecas.itens.map(function(x){ return e("div",{key:x.nome, className:"flex items-center gap-2.5 rounded-xl bg-white px-2.5 py-2 "+BORDA},
          e("span",{className:MONO+" grid h-8 min-w-8 shrink-0 place-items-center whitespace-nowrap rounded-lg bg-[#E7F6EC] px-1.5 font-extrabold text-[#15803D] "+(String(x.txt).length>2?"text-[12.5px]":"text-[15px]")}, x.txt),
          e("span",{className:"text-[14px] font-semibold capitalize leading-tight text-[#111827]"}, x.nome.toLowerCase())); }))),
      e(Bloco,{t:"Preferências da revendedora"},
        prefsReais.length===0 ? e("p",{className:"text-[14px] text-[#6B7280]"}, "Ela ainda não informou as preferências do kit.")
          : e("div",{className:"flex flex-col divide-y divide-[#EEF0F4]"}, prefsReais.map(function(x){ return e("div",{key:x.titulo, className:"flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0"}, e("b",{className:"text-[14.5px] leading-tight text-[#111827]"}, x.titulo), e("span",{className:"text-[14px] leading-snug text-[#4B5563]"}, x.texto)); }))),
      e(Bloco,{t:"Pedidos dela"},
        e("div",{className:"flex items-baseline justify-between gap-3 text-[14px]"}, e("span",{className:"text-[#6B7280]"}, "Encomendas"), e("b",{className:"text-[#111827]"}, k.pref.enc ? k.pref.enc+(k.pref.enc>1 ? " peças separadas" : " peça separada") : "Nenhuma encomenda")),
        k.pref.evitar && e("div",{className:"flex items-baseline justify-between gap-3 text-[14px]"}, e("span",{className:"text-[#6B7280]"}, "Pedido dela"), e("b",{className:"text-right text-[#111827]"}, k.pref.evitar))),
      ativo
        ? e("div",{className:"flex flex-col gap-2.5"},
            e("div",{className:"flex items-center justify-between rounded-2xl bg-[#F1EAFE] px-4 py-3"},
              e("span",{className:"text-[14px] font-semibold text-[#5B21B6]"}, k.pausadoEm ? "Pausado em" : "Montando há"),
              e(Relogio,{k:k, className:"text-[22px] font-extrabold text-[#6D28D9]"})),
            conds.length>0 && e(Bloco,{t:"Pegue e marque cada condicional ("+conds.length+")"},
              e("p",{className:"text-[13.5px] text-[#6B7280]"}, "Só conclui com todas marcadas."), e(CondLista,{k:k, papel:"m"})),
            e("button",{disabled:!condOk(k, "m"), onClick:function(){d({type:"CONCLUIR_M", id:k.id});}, className:"flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-emerald-400 to-teal-400 px-3 py-3.5 text-[15.5px] font-bold text-black active:translate-y-px disabled:opacity-40"},
              e(Icon,{n:"check"}), atencao ? "Concluir e enviar para conferência" : "Concluir montagem"),
            e("div",{className:"grid grid-cols-2 gap-2"},
              e("button",{onClick:function(){d({type: k.pausadoEm ? "RETOMAR" : "PAUSAR", id:k.id});}, className:"flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#F1F2F4] text-[14.5px] font-bold text-[#1F2937] active:translate-y-px"}, e(Icon,{n:k.pausadoEm ? "play" : "pause", s:15}), k.pausadoEm ? "Retomar" : "Pausar"),
              e("button",{onClick:function(){d({type:"DEVOLVER", id:k.id});}, className:"flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#F1F2F4] text-[14.5px] font-bold text-[#1F2937] active:translate-y-px"}, e(Icon,{n:"undo", s:15}), "Devolver")))
        : e("button",{onClick:function(){d({type:"INICIAR_M", id:k.id, montId:p.montId});}, className:"flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[#B8862B] via-[#E8B84B] to-[#F1E4C6] px-3 py-3.5 text-[15.5px] font-bold text-[#1B1409] active:translate-y-px"},
            e(Icon,{n:"play"}), k.status==="ajuste" ? "Iniciar ajuste" : "Iniciar montagem")));
}

export { Etiqueta };
