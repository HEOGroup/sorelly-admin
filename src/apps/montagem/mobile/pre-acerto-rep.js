// Sorelly Admin · montagem — mobile/pre-acerto-rep.js
// Pré-acerto (02/11/2026, Marcus): a representante preenche ANTES do acerto as remarcações (com multa ou isentas) e os dias de atraso.
// No acerto esses dados chegam TRAVADOS ("é o sistema, não fui eu que coloquei"). Layout aprovado em docs/rascunhos/pre-acerto-compacto.html.
// Remarcações ficam no kit (KIT_REMARCAR, a mesma lista do acerto); os dias de atraso ficam em kit.preAcerto (KIT_PRE_ACERTO).
import { MOTIVOS_ISENCAO, atrasoAcerto, vezCobravel } from "@/apps/montagem/domain/consignado";
import { MONO } from "@/apps/montagem/ui/input";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useState } from "@/shared/react";

var MOTIVOS = MOTIVOS_ISENCAO;
var CAMPO = "h-8 w-full rounded-lg bg-white px-2 text-[11px] text-[#1F1A10] outline-none ring-1 ring-[#CFC7B2]";
var LINHA = "flex min-h-8 items-center justify-between gap-2 border-b border-[#E4E0D6]";

function PreAcertoRep(p){
  var kit = p.kit, versao = p.versao, N = versao && versao.novas, escada = (versao && versao.remarcacao) || [];
  var a1 = useState(function(){ return (kit.preAcerto && kit.preAcerto.atrasoDias) || 0; }), dias = a1[0], setDias = a1[1];
  var a2 = useState(false), abre = a2[0], setAbre = a2[1];
  var a3 = useState("multa"), novo = a3[0], setNovo = a3[1];
  var a4 = useState(MOTIVOS[0]), motivo = a4[0], setMotivo = a4[1];
  var a5 = useState(""), outro = a5[0], setOutro = a5[1];
  var a6 = useState(false), info = a6[0], setInfo = a6[1];
  var lista = kit.remarcacoesLista || [];
  var escadaDe = function(k){ return k>0 && escada.length ? escada[Math.min(k, escada.length)-1] : {comissaoPct:0, brindePct:0}; };
  var multas = vezCobravel(lista), rem = escadaDe(multas);
  var at = N ? atrasoAcerto(dias, N) : {comissaoPct:0, brindePct:0, tudo:false};
  var cb = function(c, b){ return "Comissão −"+c+"% · Brinde −"+b+"%"; };
  var nums = "text-[11px] font-bold whitespace-nowrap "+MONO;
  var motivoFinal = motivo==="Outro" ? outro.trim() : motivo;
  var adicionar = function(){ p.d({type:"KIT_REMARCAR", id:kit.id, isenta:novo==="isenta", motivo:novo==="isenta" ? motivoFinal : ""}); setAbre(false); setOutro(""); };
  var k = 0;
  var linhas = lista.map(function(r, i){ if(!r.isenta) k++; var x = escadaDe(k);
    return e("div",{key:i, className:LINHA},
      e("div",{className:"min-w-0"},
        e("p",{className:"whitespace-nowrap text-[11px] font-semibold"}, (i+1)+"ª · "+(r.isenta ? "Isenta" : "Com multa")),
        e("p",{className:"text-[11px]"}, r.isenta ? "Não pesa"+(r.motivo ? " · "+r.motivo : "") : cb(x.comissaoPct, x.brindePct))),
      e("div",{className:"flex shrink-0 items-center gap-1"},
        e("button",{onClick:function(){ p.d({type:"KIT_REMARCAR_REMOVER", id:kit.id, indice:i}); }, "aria-label":"Tirar a "+(i+1)+"ª remarcação", className:"grid size-8 place-items-center text-[11px] text-[#1F1A10]"}, "×"))); });
  var perda = function(c, b){ return e("div",{className:"grid grid-cols-[1.2fr_1fr_1fr_1fr] items-center border-b border-[#E4E0D6] text-right"},
    e("span",{className:"py-1.5 text-left text-[11px] font-semibold"}, c[0]),
    e("span",{className:nums}, c[1]), e("span",{className:nums}, c[2]), e("b",{className:nums+" text-[13px]"}, c[3])); };
  var totC = at.tudo ? "Tudo" : "−"+Math.min(100, rem.comissaoPct+at.comissaoPct)+"%", totB = at.tudo ? "Tudo" : "−"+Math.min(100, rem.brindePct+at.brindePct)+"%";
  return e("div",{className:"-mx-4 flex flex-col gap-2.5 px-4 pb-12 pt-3", style:{background:"#FFFFFF", color:"#1F1A10", marginTop:"-0.5rem", marginBottom:"-2.5rem", minHeight:"calc(100% + 3rem)"}},
    e("div",{className:"flex items-center gap-2"},
      e("button",{onClick:p.onVoltar, "aria-label":"Voltar", className:"grid size-8 shrink-0 place-items-center rounded-full bg-[#F4EFE0] text-[#8A6A12]"}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
      e("b",{className:"min-w-0 flex-1 text-[13px] font-black uppercase tracking-[.18em] text-[#8A6A12]"}, "Pré-acerto"),
      e("button",{onClick:function(){ setInfo(!info); }, "aria-label":"Regras", className:"grid size-8 shrink-0 place-items-center rounded-full font-serif text-[13px] font-bold italic "+(info ? "bg-[#1F1A10] text-white" : "bg-white text-[#1F1A10] ring-1 ring-[#CFC7B2]")}, "i")),
    e("div",{className:"rounded-xl border border-[#E4E0D6] bg-white px-3 py-2"},
      e("p",{className:"text-[13px] font-semibold"}, p.rev),
      e("p",{className:"text-[11px]"}, "Acerto previsto para "+p.prevista)),
    info && e("div",{className:"flex flex-col rounded-xl border border-[#E4E0D6] bg-white px-3 py-2"},
      e("p",{className:"text-[11px] font-bold uppercase"}, "Remarcação com multa · Comissão · Brinde"),
      escada.map(function(t, i, arr){ return e("div",{key:"e"+i, className:LINHA}, e("span",{className:"text-[11px]"}, (i+1)+"ª remarcação"+(i===arr.length-1 ? " em diante" : "")), e("span",{className:nums}, "−"+t.comissaoPct+"% · −"+t.brindePct+"%")); }),
      e("p",{className:"py-1 text-[11px]"}, "A remarcação isenta, com motivo, não pesa."),
      N && e("p",{className:"pt-1 text-[11px] font-bold uppercase"}, "Atraso do acerto · Comissão · Brinde"),
      N && (N.atrasoAcerto||[]).slice().sort(function(a, b){ return a.ate-b.ate; }).map(function(t, i){ return e("div",{key:"a"+i, className:LINHA}, e("span",{className:"text-[11px]"}, "Até "+t.ate+" dias"), e("span",{className:nums}, "−"+t.comissaoPct+"% · −"+t.brindePct+"%")); }),
      N && e("div",{className:LINHA}, e("span",{className:"text-[11px]"}, (N.juridicoDias||60)+" dias ou mais"), e("span",{className:nums}, "Perde tudo"))),
    e("div",{className:"rounded-xl border border-[#E4E0D6] bg-white px-3 pb-2"},
      e("div",{className:"flex min-h-8 items-center justify-between"},
        e("p",{className:"text-[11px] font-bold uppercase tracking-wide"}, "Remarcações"),
        e("button",{onClick:function(){ setAbre(!abre); }, className:"h-8 rounded-lg px-3 text-[11px] font-bold txt-branco bg-[#1F1A10]"}, "+ Remarcação")),
      linhas.length ? linhas : e("div",{className:LINHA}, e("span",{className:"text-[11px] font-semibold"}, "Nenhuma remarcação")),
      abre && e("div",{className:"flex flex-col gap-2 border-b border-[#E4E0D6] py-2"},
        e("div",{className:"grid grid-cols-2 gap-2"},
          [["multa","Com multa"],["isenta","Isenta"]].map(function(o){ return e("button",{key:o[0], onClick:function(){ setNovo(o[0]); }, "aria-pressed":novo===o[0], className:"h-8 rounded-lg text-[11px] font-semibold "+(novo===o[0] ? "bg-[#C9A13B] txt-branco" : "bg-white text-[#1F1A10] ring-1 ring-[#CFC7B2]")}, o[1]); })),
        novo==="isenta" && e("select",{value:motivo, onChange:function(ev){ setMotivo(ev.target.value); }, "aria-label":"Motivo da isenção", className:CAMPO}, MOTIVOS.map(function(m){ return e("option",{key:m, value:m}, m); })),
        novo==="isenta" && motivo==="Outro" && e("input",{value:outro, onChange:function(ev){ setOutro(ev.target.value); }, placeholder:"Qual o motivo", className:CAMPO}),
        e("button",{disabled:novo==="isenta" && !motivoFinal, onClick:adicionar, className:"h-8 rounded-lg bg-[#1F1A10] text-[11px] font-bold txt-branco disabled:opacity-40"}, "Adicionar"))),
    N && e("div",{className:"rounded-xl border border-[#E4E0D6] bg-white px-3 pb-2"},
      e("p",{className:"flex min-h-8 items-center text-[11px] font-bold uppercase tracking-wide"}, "Atraso do acerto"),
      e("div",{className:LINHA},
        e("span",{className:"whitespace-nowrap text-[11px] font-semibold"}, "Dias úteis de atraso"),
        e("span",{className:"flex items-center gap-1.5"},
          e("button",{onClick:function(){ setDias(Math.max(0, dias-1)); }, "aria-label":"Menos um dia", className:"size-8 rounded-lg bg-white text-[13px] font-bold text-[#1F1A10] ring-1 ring-[#CFC7B2]"}, "−"),
          e("b",{className:MONO+" w-14 text-center text-[13px]"}, dias+(dias===1 ? " dia" : " dias")),
          e("button",{onClick:function(){ setDias(Math.min(99, dias+1)); }, "aria-label":"Mais um dia", className:"size-8 rounded-lg bg-white text-[13px] font-bold text-[#1F1A10] ring-1 ring-[#CFC7B2]"}, "+"))),
      e("div",{className:"flex min-h-8 items-center justify-between"},
        e("span",{className:"text-[11px]"}, "Perda pelo atraso"),
        e("span",{className:nums}, dias<=0 ? "No prazo" : at.tudo ? "Perde tudo" : cb(at.comissaoPct, at.brindePct)))),
    e("div",{className:"rounded-xl border border-[#E4E0D6] border-t-2 border-t-[#C9A13B] bg-white px-3 py-1"},
      e("div",{className:"grid grid-cols-[1.2fr_1fr_1fr_1fr] items-center border-b border-[#E4E0D6] text-right"},
        e("span",null), ["Remarcação","Atraso","Total"].map(function(t){ return e("span",{key:t, className:"py-1.5 text-[11px] font-bold uppercase"}, t); })),
      perda(["Comissão", "−"+rem.comissaoPct+"%", at.tudo ? "Tudo" : "−"+at.comissaoPct+"%", totC]),
      perda(["Brinde", "−"+rem.brindePct+"%", at.tudo ? "Tudo" : "−"+at.brindePct+"%", totB]),
      at.tudo && e("p",{className:"py-1.5 text-center text-[11px] font-bold"}, (N.juridicoDias||60)+" dias ou mais: perde toda a comissão e todo o brinde (jurídico).")),
    e("button",{onClick:function(){ p.d({type:"KIT_PRE_ACERTO", id:kit.id, atrasoDias:dias}); p.onSalvar(); }, className:"h-8 rounded-2xl bg-[#C9A13B] text-[11px] font-bold txt-branco"}, p.textoSalvar || "Salvar pré-acerto"));
}
export { PreAcertoRep };
