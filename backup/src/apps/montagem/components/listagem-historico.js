// Sorelly Admin · montagem e bipagem — components/listagem-historico.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { CondChips } from "@/apps/montagem/components/condicionais";
import { condNovas } from "@/apps/montagem/domain/condicionais";
import { SEM_KIT, TIPO_KIT } from "@/apps/montagem/domain/status";
import { BK, N1, durCurta } from "@/apps/montagem/lib/format";
import { BADGE } from "@/apps/montagem/ui/badge";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { TD, TH } from "@/apps/montagem/ui/table";
import { e } from "@/shared/react";

function ListagemHistorico(p){
  var h = p.h, aberta = p.aberta, busca = p.busca;
  var C = "text-center!", TINTA = "text-[#1B1409]", vazio = e("span",{className:"text-muted-foreground"},"—");
  var chip = function(txt, ic, cls, tit){ return e("span",{title:tit, className:"inline-flex max-w-full items-center gap-1 truncate rounded-md px-2 py-0.5 text-[13px] font-semibold "+(cls||"bg-black/15 "+TINTA)}, ic && e(Icon,{n:ic, s:13}), txt); };
  // Nome | Tipo | Média venda | Valor do kit | Bipado | Montadora | Cond. | Bipadora | Nova cond. | Retirado | Avaliação da representante
  var LARG = [200,150,100,100,100,110,96,110,110,84,130];
  var COLUNAS = [["Nome"],["Tipo"],["Média venda"],["Valor kit"],["Bipado"],["Montadora","text-purple!"],["Cond.","text-warning!"],
    ["Bipadora","text-info!"],["Nova cond.","text-warning!"],["Retirado"],["Avaliação"]];
  var BLOCO = "[&_tr.kit>*:first-child]:border-l-2! [&_tr.kit>*:last-child]:border-r-2! [&_tr.kit>*:first-child]:border-l-[#D9A63A]! [&_tr.kit>*:last-child]:border-r-[#D9A63A]! "+
    "[&_tr.fim>td]:border-b-2! [&_tr.fim>td]:border-b-[#D9A63A]! [&_tr.fim>td:first-child]:rounded-bl-xl [&_tr.fim>td:last-child]:rounded-br-xl";
  var avals = (h.kits||[]).filter(function(k){return k.aval;}), notaMedia = avals.length ? avals.reduce(function(t,k){return t+k.aval.nota;},0)/avals.length : null;
  var linhas = [e("tr",{key:"f"},
    e("td",{colSpan:LARG.length, className:"cursor-pointer px-3! py-2! shadow-[inset_0_1px_0_rgba(255,255,255,.35)] bg-linear-to-r from-[#B8862B] via-[#E8B84B] to-[#F1E4C6] "+TINTA+" "+(aberta?"rounded-t-xl":"rounded-xl"), onClick:p.alternar},
      // grade fixa: data | retirada | kits | valor | concluída | nota | atrasados | divergências | reabrir
      e("div",{className:"grid grid-cols-[8rem_10.5rem_5rem_7rem_9.5rem_6.5rem_minmax(0,1fr)_10rem_8.5rem_6rem] items-center gap-2.5"},
        e("span",{className:"inline-flex items-center gap-2 font-heading text-[14px] font-bold", "aria-expanded":aberta}, e(Icon,{n: aberta?"chevrondown":"chevron", s:15}), h.hoje ? "Hoje" : h.data),
        chip(h.horario+(h.viagem ? " · "+h.destino : ""), h.viagem?"send":"clock", null, (h.viagem?"Viagem para "+h.destino+", ":"")+"retirada às "+h.horario),
        chip(h.qtd+" kits"),
        e("span",{className:MONO+" text-sm font-semibold"}, BK(h.total)),
        e("span",{className:"text-[13px] font-medium opacity-80"},"concluída "+h.concluida),
        e("span",{className:"text-[13px] font-semibold", title:"Nota média dada pela representante"}, notaMedia ? "★ "+N1(notaMedia) : ""),
        e("span",null, h.sozinha && chip("Retirou sozinha","user","bg-black/20 text-[#1B1409]","A representante veio na empresa e retirou os kits sozinha")),
        e("span",{className:"justify-self-end"}, h.atrasados>0 && chip(h.atrasados+(h.atrasados>1?" atrasados":" atrasado"),"clock","bg-[#9A4A00] text-white","Pedidos fora do prazo")),
        e("span",{className:"justify-self-end"}, h.divs>0 && chip(h.divs+(h.divs>1?" divergências":" divergência"),null,"bg-[#7A1F1F] text-white")),
        e("span",{className:"justify-self-end"}, h.hoje && h.lid && e("button",{onClick:function(ev){ ev.stopPropagation(); p.reabrir(h.lid); },
          className:"inline-flex h-8 items-center gap-1.5 rounded-lg bg-black/10 px-2.5 text-sm font-semibold "+TINTA+" hover:bg-black/20"}, e(Icon,{n:"unlock", s:14}), "Reabrir")))))];
  if(aberta && h.kits){
    linhas.push(e("tr",{key:"cab", className:"kit bg-sidebar"}, COLUNAS.map(function(c,j){ return e(TH,{key:j, className:C+" px-1! text-[12px]! tracking-normal! "+(c[1]||"")}, c[0]); })));
    h.kits.forEach(function(k, j){
      var df = k.real && k.valor ? (k.real-k.valor)/k.valor*100 : null, achou = busca && k.rev.toLowerCase().indexOf(busca)>=0;
      var tipo = TIPO_KIT[k.tipoKit] || TIPO_KIT.acerto_kit, conds = (k.cond && k.cond.nums) || [];
      var tempos = (k.tempoM ? "Montagem "+durCurta(k.tempoM)+" (fim "+k.fimM+")" : "")+(k.tempoB ? " · bipagem "+durCurta(k.tempoB)+" (fim "+k.fimB+")" : "");
      linhas.push(e("tr",{key:"k"+j, className:"kit "+(achou?"bg-primary/15":"bg-card hover:bg-muted/40")+(j===h.kits.length-1?" fim":"")},
        e(TD,{className:C+" truncate font-medium"}, e("span",{title:k.rev+(k.atrasado?" (pedido fora do prazo)":"")}, k.prio && e("span",{className:"text-primary"},"★ "), k.rev),
          k.atrasado && e("span",{className:"ml-1.5 rounded bg-[#9A4A00]/80 px-1.5 py-px text-[10px] font-semibold text-white"},"atras.")),
        e(TD,{className:C}, e("span",{title:tipo[0], className:"inline-block max-w-full truncate rounded-md border px-1.5 py-0.5 text-[11.5px] font-semibold "+BADGE[tipo[2]]}, tipo[1])),
        e(TD,{className:C+" "+MONO}, k.media ? BK(k.media) : e("span",{className:"text-muted-foreground"}, SEM_KIT[k.tipoKit] ? "—" : k.tipoKit==="reposicao" ? "reposição" : "nova")),
        e(TD,{className:C+" "+MONO+" text-primary"}, k.valor ? BK(k.valor) : vazio),
        e(TD,{className:C+" "+MONO+(k.div?" text-destructive":"")}, k.real ? e("span",{title: df!==null ? (df>0?"+":"")+N1(df)+"% do esperado" : ""}, BK(k.real)) : vazio),
        e(TD,{className:C+" truncate"}, k.mont && k.mont!=="—" ? e("span",{title:tempos}, k.mont) : vazio),
        e(TD,{className:C+" "+MONO}, conds.length ? e(CondChips,{k:Object.assign({status:"retirado"}, k), papel:"b"}) : vazio),
        e(TD,{className:C+" truncate"}, k.bip && k.bip!=="—" ? e("span",{title:tempos}, k.bip) : vazio),
        e(TD,{className:C+" "+MONO+" text-[12.5px]! text-warning"}, condNovas(k).length ? e("span",{title:condNovas(k).join(", ")}, condNovas(k)[0], condNovas(k).length>1 && e("b",{className:"ml-1 rounded bg-warning/20 px-1 text-[10.5px]"}, "+"+(condNovas(k).length-1))) : vazio),
        e(TD,{className:C+" "+MONO+" text-success"}, k.ret || vazio),
        e(TD,{className:C}, k.aval
          ? e("span",{className:"inline-flex items-center gap-1.5", title:"Avaliação da representante"+(k.aval.faltas?" · "+k.aval.faltas+" peça(s) faltando":"")},
              e("span",{className:"text-[13px] tracking-tight text-primary"}, "★".repeat(k.aval.nota)+"☆".repeat(5-k.aval.nota)),
              k.aval.faltas>0 && e("span",{className:"rounded bg-destructive/20 px-1 text-[11px] font-semibold text-destructive"}, "−"+k.aval.faltas))
          : e("span",{className:"text-[12px] text-muted-foreground"}, SEM_KIT[k.tipoKit] ? "—" : "aguardando"))));
    });
  }
  return e("table",{className:"w-full min-w-[62rem] table-fixed border-separate border-spacing-0 text-sm [&_td]:px-1.5! [&_td]:py-2! [&_th]:px-1.5! [&_tr.kit>td]:border-b [&_tr.kit>td]:border-border "+BLOCO},
    e("colgroup",null, LARG.map(function(w,i){ return e("col",{key:i, style:w?{width:w}:undefined}); })),
    e("tbody",null, linhas));
}

export { ListagemHistorico };
