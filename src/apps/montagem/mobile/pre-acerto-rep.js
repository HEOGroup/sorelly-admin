// Sorelly Admin · montagem — mobile/pre-acerto-rep.js
// Pré-acerto (02/11/2026, Marcus): a representante preenche ANTES do acerto as remarcações (com multa ou isentas) e os dias de atraso.
// No acerto esses dados chegam TRAVADOS ("é o sistema, não fui eu que coloquei"). Layout aprovado em docs/rascunhos/pre-acerto-compacto.html.
// Remarcações ficam no kit (KIT_REMARCAR, a mesma lista do acerto); os dias de atraso ficam em kit.preAcerto (KIT_PRE_ACERTO).
import { MOTIVOS_ISENCAO, atrasoAcerto, hojeIso, linhasAtraso, vezCobravel } from "@/apps/montagem/domain/consignado";
import { RESPONSAVEIS, responsavelDe, diasUteisDeAtraso } from "@/apps/montagem/domain/ocorrencias-acerto";
import { MONO } from "@/apps/montagem/ui/input";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useState } from "@/shared/react";

var MOTIVOS = MOTIVOS_ISENCAO;
var CAMPO = "h-8 w-full rounded-lg bg-white px-2 text-[11px] text-[#1F1A10] outline-none ring-1 ring-[#CFC7B2]";
var LINHA = "flex min-h-8 items-center justify-between gap-2 border-b border-[#E4E0D6]";

function PreAcertoRep(p){
  var kit = p.kit, versao = p.versao, N = versao && versao.novas, escada = (versao && versao.remarcacao) || [];
  var a1 = useState(function(){ var q = kit.preAcerto||{}; if(q.conferido || q.confirmada || q.atrasoDias) return q.atrasoDias||0; var d0 = q.dataOriginal || p.previstaIso; return d0 ? Math.min(99, diasUteisDeAtraso(d0, hojeIso())) : 0; }), dias = a1[0], setDias = a1[1];
  var a2 = useState(false), abre = a2[0], setAbre = a2[1];
  var a4 = useState(MOTIVOS[0]), motivo = a4[0], setMotivo = a4[1];
  var a5 = useState(""), outro = a5[0], setOutro = a5[1];
  var a6 = useState(false), info = a6[0], setInfo = a6[1];
  // 28/11/2026 (Marcus): a representante INFORMA os fatos (data original, quem causou, motivo, prova); o sistema calcula a penalidade. Corrigir dado já conferido pede justificativa e fica no histórico do kit.
  var pa0 = kit.preAcerto || {}, hoje = hojeIso();
  var a7 = useState(function(){ return pa0.dataOriginal || p.previstaIso || ""; }), dataOrig = a7[0], setDataOrig = a7[1];
  var a8 = useState("revendedora"), resp = a8[0], setResp = a8[1];
  var a9 = useState(false), prova = a9[0], setProva = a9[1];
  var a10 = useState(""), just = a10[0], setJust = a10[1];
  var calcDias = dataOrig ? Math.min(99, diasUteisDeAtraso(dataOrig, hoje)) : null;
  var pedeJust = (!!pa0.conferido && ((pa0.atrasoDias||0)!==dias || (pa0.dataOriginal||"")!==dataOrig)) || (calcDias!=null && dias!==calcDias);
  var rObj = responsavelDe(resp) || RESPONSAVEIS[0], isentaNova = !rObj.pesa;
  var lista = kit.remarcacoesLista || [];
  var escadaDe = function(k){ return k>0 && escada.length ? escada[Math.min(k, escada.length)-1] : {comissaoPct:0, brindePct:0}; };
  var multas = vezCobravel(lista), rem = escadaDe(multas);
  var at = N ? atrasoAcerto(dias, N) : {comissaoPct:0, brindePct:0, tudo:false};
  var cb = function(c, b){ return "Comissão −"+c+"% · Brinde −"+b+"%"; };
  var nums = "text-[11px] font-bold whitespace-nowrap "+MONO;
  var motivoFinal = motivo==="Outro" ? outro.trim() : motivo;
  var adicionar = function(){ p.d({type:"KIT_REMARCAR", id:kit.id, responsavel:resp, isenta:isentaNova, motivo:isentaNova ? motivoFinal : "", prova:!!(rObj.prova && prova), por:p.por||""}); setAbre(false); setOutro(""); setProva(false); };
  var emb = !!p.embutido, k = 0;
  var linhas = lista.map(function(r, i){ if(!r.isenta) k++; var x = escadaDe(k);
    return e("div",{key:i, className:LINHA},
      e("div",{className:"min-w-0"},
        e("p",{className:"whitespace-nowrap text-[11px] font-semibold"}, (i+1)+"ª · "+(responsavelDe(r.responsavel) ? responsavelDe(r.responsavel).nome : r.isenta ? "Isenta" : "Com multa")),
        e("p",{className:"text-[11px]"}, r.isenta ? "Não pesa"+(r.motivo ? " · "+r.motivo : "") : cb(x.comissaoPct, x.brindePct))),
      e("div",{className:"flex shrink-0 items-center gap-1"},
        e("button",{disabled:!!pa0.conferido && !just.trim(), onClick:function(){ p.d({type:"KIT_REMARCAR_REMOVER", id:kit.id, indice:i, justificativa:just.trim(), por:p.por||""}); }, "aria-label":"Tirar a "+(i+1)+"ª remarcação", className:"grid size-8 place-items-center text-[11px] text-[#1F1A10] disabled:opacity-40"}, "×"))); });
  var totC = at.tudo ? "Tudo" : "−"+Math.min(100, rem.comissaoPct+at.comissaoPct)+"%", totB = at.tudo ? "Tudo" : "−"+Math.min(100, rem.brindePct+at.brindePct)+"%";
  return e("div",{className:emb ? "flex flex-col gap-1 bg-white p-1" : "-mx-4 flex flex-col gap-2.5 px-4 pb-12 pt-3", style:emb ? undefined : {background:"#FFFFFF", color:"#1F1A10", marginTop:"-0.5rem", marginBottom:"-2.5rem", minHeight:"calc(100% + 3rem)"}},
    !emb && e("div",{className:"flex items-center gap-2"},
      e("button",{onClick:p.onVoltar, "aria-label":"Voltar", className:"grid size-8 shrink-0 place-items-center rounded-full bg-[#F4EFE0] text-[#8A6A12]"}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
      e("b",{className:"min-w-0 flex-1 text-[13px] font-black uppercase tracking-[.18em] text-[#8A6A12]"}, "Pré-acerto"),
      e("button",{onClick:function(){ setInfo(!info); }, "aria-label":"Regras", className:"grid size-8 shrink-0 place-items-center rounded-full font-serif text-[13px] font-bold italic "+(info ? "bg-[#1F1A10] text-white" : "bg-white text-[#1F1A10] ring-1 ring-[#CFC7B2]")}, "i")),
    !emb && e("div",{className:"rounded-xl border border-[#E4E0D6] bg-white px-3 py-2"},
      e("p",{className:"text-[13px] font-semibold"}, p.rev),
      e("p",{className:"text-[11px]"}, "Acerto previsto para "+p.prevista)),
    info && !emb && e("div",{className:"flex flex-col rounded-xl border border-[#E4E0D6] bg-white px-3 py-2"},
      e("p",{className:"text-[11px] font-bold uppercase"}, "Remarcação com multa · Comissão · Brinde"),
      escada.map(function(t, i, arr){ return e("div",{key:"e"+i, className:LINHA}, e("span",{className:"text-[11px]"}, (i+1)+"ª remarcação"+(i===arr.length-1 ? " em diante" : "")), e("span",{className:nums}, "−"+t.comissaoPct+"% · −"+t.brindePct+"%")); }),
      e("p",{className:"py-1 text-[11px]"}, "A remarcação isenta, com motivo, não pesa."),
      N && e("p",{className:"pt-1 text-[11px] font-bold uppercase"}, "Atraso do acerto · Comissão · Brinde"),
      N && linhasAtraso(N).map(function(t, i){ return e("div",{key:"a"+i, className:LINHA}, e("span",{className:"text-[11px]"}, t[0]), e("span",{className:nums}, t[1])); })),
    e("div",{className:"border border-[#C9A13B]/60 bg-white pb-1"},
      e("div",{className:"flex min-h-8 items-center justify-between"},
        e("p",{className:"flex h-7 items-center bg-[#F3EAD3] px-2 text-[11px] font-bold text-[#8A6A12]"}, "Remarcações"),
        e("button",{onClick:function(){ setAbre(!abre); }, className:"h-8 rounded-lg px-3 text-[11px] font-bold txt-branco bg-[#1F1A10]"}, "+ Remarcação")),
      linhas.length ? linhas : e("div",{className:LINHA}, e("span",{className:"text-[11px] font-semibold"}, "Nenhuma remarcação")),
      abre && e("div",{className:"flex flex-col gap-2 border-b border-[#E4E0D6] py-2"},
        e("select",{value:resp, onChange:function(ev){ setResp(ev.target.value); }, "aria-label":"Quem causou a remarcação", className:CAMPO}, RESPONSAVEIS.map(function(r0){ return e("option",{key:r0.id, value:r0.id}, r0.nome+(r0.pesa ? " · com multa" : " · sem multa")); })),
        isentaNova && e("select",{value:motivo, onChange:function(ev){ setMotivo(ev.target.value); }, "aria-label":"Motivo da isenção", className:CAMPO}, MOTIVOS.map(function(m){ return e("option",{key:m, value:m}, m); })),
        isentaNova && motivo==="Outro" && e("input",{value:outro, onChange:function(ev){ setOutro(ev.target.value); }, placeholder:"Qual o motivo", className:CAMPO}),
        rObj.prova && e("label",{className:"flex min-h-8 items-center gap-2 text-[11px] font-semibold"}, e("input",{type:"checkbox", checked:prova, onChange:function(ev){ setProva(ev.target.checked); }, className:"size-4"}), "Comprovação apresentada"),
        e("button",{disabled:(isentaNova && !motivoFinal) || (!!rObj.prova && !prova), onClick:adicionar, className:"h-8 rounded-lg bg-[#1F1A10] text-[11px] font-bold txt-branco disabled:opacity-40"}, "Adicionar"))),
    N && e("div",{className:"border border-[#C9A13B]/60 bg-white pb-1"},
      e("p",{className:"flex h-7 items-center bg-[#F3EAD3] px-2 text-[11px] font-bold text-[#8A6A12]"}, "Atraso do acerto"),
      e("div",{className:LINHA},
        e("span",{className:"whitespace-nowrap text-[11px] font-semibold"}, "Data original do acerto"),
        e("input",{type:"date", value:dataOrig, max:hoje, onChange:function(ev){ var v = ev.target.value; setDataOrig(v); if(v) setDias(Math.min(99, diasUteisDeAtraso(v, hoje))); }, "aria-label":"Data original do acerto", className:"h-8 rounded-lg bg-white px-2 text-[11px] text-[#1F1A10] outline-none ring-1 ring-[#CFC7B2]"})),
      e("div",{className:LINHA},
        e("span",{className:"text-[11px]"}, "Contagem do sistema"),
        e("span",{className:nums}, calcDias==null ? "Informe a data" : calcDias+(calcDias===1 ? " dia útil" : " dias úteis"))),
      e("div",{className:LINHA},
        e("span",{className:"whitespace-nowrap text-[11px] font-semibold"}, "Dias úteis de atraso"),
        e("span",{className:"flex items-center gap-1.5"},
          e("button",{onClick:function(){ setDias(Math.max(0, dias-1)); }, "aria-label":"Menos um dia", className:"size-8 rounded-lg bg-white text-[13px] font-bold text-[#1F1A10] ring-1 ring-[#CFC7B2]"}, "−"),
          e("b",{className:MONO+" w-14 text-center text-[13px]"}, dias+(dias===1 ? " dia" : " dias")),
          e("button",{onClick:function(){ setDias(Math.min(99, dias+1)); }, "aria-label":"Mais um dia", className:"size-8 rounded-lg bg-white text-[13px] font-bold text-[#1F1A10] ring-1 ring-[#CFC7B2]"}, "+"))),
      e("div",{className:"flex min-h-8 items-center justify-between"},
        e("span",{className:"text-[11px]"}, "Perda pelo atraso"),
        e("span",{className:nums}, dias<=0 ? "No prazo" : at.tudo ? "Perde tudo" : cb(at.comissaoPct, at.brindePct)))),
    e("div",{className:"grid grid-cols-2 gap-px border border-[#C9A13B]/60 bg-[#E4D3A3]"}, [["Comissão", totC], ["Brinde", totB]].map(function(c){
      return e("div",{key:c[0], className:"flex min-h-8 items-center justify-between gap-2 bg-white px-2 text-[11px]"}, e("span",{className:"font-semibold"}, c[0]), e("b",{className:nums+" text-[13px]"}, c[1])); })),
    at.tudo && e("p",{className:"text-center text-[11px] font-bold"}, "Depois do "+(N.juridicoDiasUteis||30)+"º dia útil: perde toda a comissão e todo o brinde (jurídico)."),
    (pedeJust || pa0.conferido) && e("input",{value:just, onChange:function(ev){ setJust(ev.target.value); }, placeholder:"Justificativa da correção", "aria-label":"Justificativa da correção", className:CAMPO}),
    e("button",{disabled:!dataOrig || (pedeJust && !just.trim()), onClick:function(){ p.d({type:"KIT_PRE_ACERTO", id:kit.id, atrasoDias:dias, dataOriginal:dataOrig, diasCalculados:calcDias, justificativa:just.trim(), origem:"manual", por:p.por||""}); p.onSalvar(); },
      className:"h-8 rounded-2xl bg-[#C9A13B] text-[11px] font-bold txt-branco disabled:opacity-40"}, !dataOrig ? "Informe a data original" : pedeJust && !just.trim() ? "Escreva a justificativa" : (p.textoSalvar || "Salvar pré-acerto")));
}
export { PreAcertoRep };
