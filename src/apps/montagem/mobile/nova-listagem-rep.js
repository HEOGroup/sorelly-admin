// Sorelly Admin · montagem — mobile/nova-listagem-rep.js
// App da representante: CRIAR uma listagem (dia, horário e destino). Uma peça só, usada na aba Listagens e na tela da revendedora (05/11/2026, Marcus).
// Destino = Curitiba ou uma cidade da região metropolitana (lista de kits-novos/domain/regioes-rep.js); fora de Curitiba é viagem e não tem limite de revendedoras.
import { RMC } from "@/apps/kits-novos/domain/regioes-rep";
import { isoDia } from "@/apps/montagem/lib/format";
import { e, useState } from "@/shared/react";

var DESTINOS = ["Curitiba"].concat(RMC);
var HORARIOS = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","13:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];
var CAMPO = "h-8 w-full rounded-lg bg-white px-2 text-[13px] text-[#111827] outline-none ring-1 ring-black/10";
var ROTULO = "flex min-w-0 flex-col gap-1 text-[11px] font-bold uppercase tracking-wide text-[#6B7280]";

// p: {s, d, rep, data (dia já escolhido: some o campo), aoCriar(lista nova), ouro (classe do botão principal), aoCancelar}
function NovaListagemRep(p){
  var s = p.s, hoje = isoDia(new Date());
  var st = useState({data:p.data || hoje, horario:"10:00", destino:"Curitiba"}), f = st[0], set = function(k, v){ var o = Object.assign({}, f); o[k] = v; st[1](o); };
  var igual = s.listagens.find(function(x){ return x.rep===p.rep && !x.fechada && x.data===f.data && x.horario===f.horario && x.destino===f.destino; });
  var passado = f.data<hoje, pronto = f.data && f.horario && f.destino && !passado && !igual;
  var campo = function(rotulo, filho){ return e("label",{className:ROTULO}, rotulo, filho); };
  return e("div",{className:"flex flex-col gap-2 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm"},
    e("p",{className:"text-[11px] font-bold uppercase tracking-wide text-[#6B7280]"}, "Nova listagem"),
    e("div",{className:"grid grid-cols-2 gap-2"},
      !p.data && campo("Dia", e("input",{type:"date", value:f.data, min:hoje, onChange:function(ev){ set("data", ev.target.value); }, className:CAMPO})),
      campo("Horário da retirada", e("select",{value:f.horario, onChange:function(ev){ set("horario", ev.target.value); }, className:CAMPO}, HORARIOS.map(function(h){ return e("option",{key:h, value:h}, h); })))),
    campo("Destino", e("select",{value:f.destino, onChange:function(ev){ set("destino", ev.target.value); }, className:CAMPO}, DESTINOS.map(function(x){ return e("option",{key:x, value:x}, x); }))),
    f.destino!=="Curitiba" && e("p",{className:"text-[11px] text-[#374151]"}, "Fora de Curitiba é viagem: a listagem não tem limite de revendedoras."),
    passado && e("p",{className:"text-[11px] font-bold text-[#B91C1C]"}, "O dia não pode ser no passado."),
    igual && e("p",{className:"text-[11px] font-bold text-[#B45309]"}, "Você já tem uma listagem neste dia, horário e destino."),
    e("div",{className:"flex gap-2"},
      p.aoCancelar && e("button",{type:"button", onClick:p.aoCancelar, className:"h-8 flex-1 rounded-xl bg-[#F3F4F6] text-[13px] font-semibold text-[#111827]"}, "Cancelar"),
      e("button",{type:"button", disabled:!pronto, onClick:function(){ p.d({type:"CRIAR_LISTAGEM", rep:p.rep, destino:f.destino, viagem:f.destino!=="Curitiba", horario:f.horario, data:f.data}); if(p.aoCriar) p.aoCriar(f); },
        className:"h-8 flex-1 rounded-xl text-[13px] font-bold disabled:opacity-40 "+(p.ouro||"bg-[#C9A13B] txt-branco")}, "Criar listagem")));
}

export { NovaListagemRep, DESTINOS };
