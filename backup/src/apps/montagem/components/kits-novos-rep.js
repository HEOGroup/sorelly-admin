// Sorelly Admin · montagem e bipagem — components/kits-novos-rep.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { capacidadeListagem, kitsNaListagem, listagemCheia } from "@/apps/montagem/domain/regras";
import { BK } from "@/apps/montagem/lib/format";
import { OURO_APP } from "@/apps/montagem/mobile/bipagem";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var GRAD_OURO = "linear-gradient(135deg,#FFFFFF 0%,#F5E6BE 100%)";
var LINHA_CARD = "border-[#E9DDBB]";
var CorInfo = "#A67C12";

function foraDoPrazo(l, s){
  var p = l.horario.split(":"), ret = new Date();
  if(l.data){ var dp = l.data.split("-"); ret.setFullYear(+dp[0], +dp[1]-1, +dp[2]); }
  ret.setHours(+p[0], +p[1], 0, 0);
  return (ret.getTime() - Date.now())/3600000 < s.cfg.prazoPedidoHoras;
}
function linhaInfoNova(label, valor, primeiro){
  return e("div",{key:label, className:"flex flex-col gap-0.5 py-1.5"+(primeiro?"":" border-t "+LINHA_CARD)},
    e("p",{className:"text-[10px] font-bold uppercase tracking-wide", style:{color:CorInfo}}, label),
    valor ? e("p",{className:"text-[13px] font-semibold leading-snug text-[#111827]"}, valor)
          : e("p",{className:"text-[12.5px] font-semibold text-amber-700"}, "Pendente"));
}
function fmtDataISO(iso){ if(!iso) return ""; var p = iso.split("-"); return p[2]+"/"+p[1]; }
function CardListagemEscolha(p){
  var n = p.n, l = p.l, s = p.s, d = p.d, onIncluir = p.onIncluir;
  var kitsL = s.kits.filter(function(k){return k.lid===l.id;});
  var cheia = listagemCheia(s, l.id), fora = foraDoPrazo(l, s);
  return e("div",{className:"flex flex-col gap-1.5 rounded-xl border "+LINHA_CARD+" bg-white p-2.5"},
    e("div",{className:"flex items-center justify-between gap-2"},
      e("div",null,
        e("b",{className:"text-[13px] text-[#111827]"}, "Retirada "+l.horario+" · "+l.destino),
        e("p",{className:"text-[11px] text-[#6B7280]"}, fmtDataISO(l.data)+(l.viagem?" · Viagem":""))),
      e("span",{className:"shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
        style: cheia ? {background:"#DC26261F", color:"#DC2626"} : {background:"#16A34A1F", color:"#16A34A"}},
        kitsNaListagem(s,l.id)+"/"+(l.viagem?"∞":capacidadeListagem(l)))),
    kitsL.length>0 && e("div",{className:"flex flex-col gap-0.5 border-t "+LINHA_CARD+" pt-1.5"},
      kitsL.map(function(k){ return e("p",{key:k.id, className:"truncate text-[11.5px] text-[#6B7280]"},
        (k.horaAtend?k.horaAtend+" · ":"")+k.rev+(k.bairro?" · "+k.bairro:"")); })),
    fora && e("p",{className:"text-[11px] text-amber-700"},"Menos de "+s.cfg.prazoPedidoHoras+" h: entra como atrasado."),
    e("button",{disabled:cheia || l.fechada, onClick:function(){ onIncluir(l, fora); },
      className:"h-9 rounded-lg text-[12.5px] font-bold disabled:opacity-40 "+OURO_APP}, cheia ? "Listagem cheia" : "Incluir nessa listagem"));
}
function CardNova(p){
  var n = p.n, d = p.d, s = p.s, minhasL = p.minhasL;
  var ab = useState(false), aberto = ab[0], setAberto = ab[1];
  var onIncluir = function(l, fora){ d({type:"NOVA_INCLUIR", id:n.id, lid:l.id, foraPrazo:fora, quem:"rep"}); setAberto(false); };
  return e("div",{className:"overflow-hidden rounded-2xl border "+LINHA_CARD, style:{background:GRAD_OURO}},
    e("div",{className:"flex items-center justify-between gap-2 px-3.5 py-3"},
      e("div",{className:"min-w-0 flex-1"},
        e("b",{className:"block truncate text-[17px] font-extrabold tracking-tight text-[#111827]"}, n.nome),
        e("span",{className:"text-[11px] text-[#6B7280]"}, n.bairro+", "+n.cidade+(n.expositor?" · kit + expositor":""))),
      e("span",{className:MONO+" shrink-0 text-[14px] font-bold"}, BK(n.valor))),
    n.fone && e("div",{className:"flex items-center justify-between gap-2 border-t "+LINHA_CARD+" px-3.5 py-2"},
      e("span",{className:MONO+" text-[14px] font-bold text-[#4B3B14]"}, n.fone),
      e("a",{href:"https://wa.me/55"+n.fone.replace(/\D/g,""), target:"_blank", rel:"noreferrer", "aria-label":"WhatsApp de "+n.nome,
        className:"grid size-8 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"}, e(Icon,{n:"whats", s:14}))),
    e("div",{className:"flex flex-col border-t "+LINHA_CARD+" px-3.5 py-1"},
      linhaInfoNova("Profissão", n.profissao, true),
      linhaInfoNova("Endereço residencial", n.endereco || (n.bairro ? n.bairro+", "+n.cidade : "")),
      linhaInfoNova("Endereço de trabalho", n.trab ? n.trab+(n.trabEnd?" · "+n.trabEnd:"") : n.trabEnd),
      linhaInfoNova("Disponibilidade pra atendimento", n.disp)),
    n.status==="na listagem"
      ? e("div",{className:"border-t "+LINHA_CARD+" px-3.5 py-2.5"}, e("span",{className:"text-[12px] font-semibold text-emerald-700"},"✓ Na listagem"))
      : e("div",{className:"flex flex-col gap-2 border-t "+LINHA_CARD+" p-2.5"},
          e("div",{className:"flex gap-2"},
            e("button",{onClick:function(){ setAberto(!aberto); }, className:"h-10 flex-1 rounded-xl text-[13px] font-bold "+OURO_APP},"Agendar"),
            e("button",{onClick:function(){ d({type:"RECUSAR_NOVA", id:n.id}); }, title:"A recusa entra na sua avaliação",
              className:"h-10 rounded-xl px-3 text-[13px] font-bold text-white", style:{background:"#DC2626"}},"Recusar")),
          aberto && e("div",{className:"flex flex-col gap-2"},
            minhasL.length===0
              ? e("p",{className:"text-[12px] text-[#6B7280]"},"Nenhuma listagem aberta no momento.")
              : minhasL.map(function(l){ return e(CardListagemEscolha,{key:l.id, n:n, l:l, s:s, d:d, onIncluir:onIncluir}); }))));
}
function KitsNovosRep(p){
  var cx = use(), s = cx.state, d = cx.dispatch, l = p.l;
  var minhas = (s.novas||[]).filter(function(n){return n.rep===l.rep && n.status!=="aguardando";});
  var minhasL = s.listagens.filter(function(x){return x.rep===l.rep && !x.fechada;});
  if(!minhas.length) return e("div",{className:"rounded-2xl bg-[#1C1C1E] p-4 text-center text-[13px] text-[#8E8E93]"},"Nenhuma revendedora nova direcionada para você.");
  return e("div",{className:"flex flex-col gap-2.5"},
    minhas.map(function(n){ return e(CardNova,{key:n.id, n:n, d:d, s:s, minhasL:minhasL}); }),
    minhas.some(function(n){return n.status==="direcionada";}) && e("p",{className:"px-1 text-[11.5px] text-[#8E8E93]"},"Recusar kit novo entra na sua avaliação. Com "+s.cfg.recusasBloqueio+" recusas você deixa de receber revendedoras novas."));
}

export { foraDoPrazo, KitsNovosRep };
