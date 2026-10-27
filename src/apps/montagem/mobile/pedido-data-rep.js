// Sorelly Admin · montagem — mobile/pedido-data-rep.js
// App da representante: PEDIR a mudança da data do acerto de uma revendedora dela (24/10/2026). Até N dias depois da data atual vale na hora; além disso o pedido vai para a Diretoria
// (Agendamento → Plano 45/60 → Aprovação → Pedidos do app) e, sem aprovação, vale a multa de remarcação. Pode pedir 45 ou 60 dias e deixar o prazo fixo. Regras em domain/plano45-60.js.
import { diasEntre, fmtData, hojeIsoLocal, minimoSugerido } from "@/apps/montagem/domain/plano45-60";
import { e, useState } from "@/shared/react";

var BK = function(n){ return "R$ "+Number(n||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); };
var MOTIVOS = ["Dia de pagamento da revendedora", "Vende pouco e precisa de mais tempo", "Viagem ou compromisso", "Problema de saúde ou família", "Outro"];
var ST = {analise:["Aguardando aprovação", "#B45309"], registrada:["Alterada na hora", "#15803D"], aprovada:["Aprovada, sem multa", "#15803D"], reprovada:["Reprovada, vale a multa", "#B91C1C"]};
var CAMPO = "h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-[14px] text-[#111827] outline-none";

// "dd/mm" do cartão da revendedora vira data completa (este ano; se ficou muito no passado, ano que vem)
function isoDeDM(dm){
  var p = String(dm||"").split("/"); if(p.length<2) return "";
  var h = new Date(), ano = h.getFullYear(), iso = ano+"-"+p[1]+"-"+p[0];
  return diasEntre(iso, hojeIsoLocal())>180 ? (ano+1)+"-"+p[1]+"-"+p[0] : iso;
}

function PedidoDataRep(p){
  var s = p.s, d = p.d, cfg = s.p45.config, rev = p.rev, atual = isoDeDM(rev.data);
  var st = useState({nova:"", prazo:"0", fixo:false, motivo:"", obs:""}), f = st[0], set = function(k, v){ var o = Object.assign({}, f); o[k] = v; st[1](o); };
  var meus = (s.p45.pedidos||[]).filter(function(x){ return x.nome.toLowerCase()===rev.rev.toLowerCase(); }).slice().reverse().slice(0, 4);
  var prz = Number(f.prazo), dias = f.nova && atual ? diasEntre(atual, f.nova) : null, livre = !prz && dias!==null && dias<=cfg.diasLivres;
  var min = prz ? minimoSugerido(prz, "representante", cfg) : null;
  var enviar = function(){ d({type:"P45", op:"pedido_novo", por:p.l.rep, dados:{rep:p.l.rep, nome:rev.rev, dataAtual:atual, novaData:f.nova, prazo:prz, fixo:f.fixo, motivo:f.motivo, obs:f.obs}}); st[1]({nova:"", prazo:"0", fixo:false, motivo:"", obs:""}); };
  var pronto = f.nova && f.motivo && atual;
  return e("div",{className:"flex flex-col gap-3 pb-4"},
    e("div",{className:"rounded-2xl border border-black/10 bg-white p-3"},
      e("p",{className:"text-[11px] font-bold uppercase tracking-wide text-[#A67C12]"}, "Alterar data do acerto"),
      e("p",{className:"text-[16px] font-extrabold text-[#111827]"}, rev.rev),
      e("p",{className:"text-[13px] text-[#4B5563]"}, "Acerto atual: "+(atual ? fmtData(atual) : "—"))),
    e("div",{className:"flex flex-col gap-2.5 rounded-2xl border border-black/10 bg-white p-3"},
      e("label",{className:"flex flex-col gap-1 text-[12px] font-bold text-[#374151]"}, "Nova data", e("input",{type:"date", value:f.nova, min:hojeIsoLocal(), onChange:function(ev){ set("nova", ev.target.value); }, className:CAMPO})),
      e("label",{className:"flex flex-col gap-1 text-[12px] font-bold text-[#374151]"}, "Prazo", e("select",{value:f.prazo, onChange:function(ev){ set("prazo", ev.target.value); }, className:CAMPO},
        e("option",{value:"0"}, "Só mudar a data"), e("option",{value:"45"}, "45 dias"), e("option",{value:"60"}, "60 dias"))),
      prz>0 && e("label",{className:"flex items-center gap-2 text-[13px] font-semibold text-[#374151]"}, e("input",{type:"checkbox", checked:f.fixo, onChange:function(ev){ set("fixo", ev.target.checked); }, className:"size-4"}), "Deixar sempre nesse prazo (a Diretoria decide)"),
      e("label",{className:"flex flex-col gap-1 text-[12px] font-bold text-[#374151]"}, "Motivo", e("select",{value:f.motivo, onChange:function(ev){ set("motivo", ev.target.value); }, className:CAMPO}, e("option",{value:""}, "Escolher"), MOTIVOS.map(function(m){ return e("option",{key:m, value:m}, m); }))),
      e("label",{className:"flex flex-col gap-1 text-[12px] font-bold text-[#374151]"}, "Observação (opcional)", e("input",{value:f.obs, onChange:function(ev){ set("obs", ev.target.value); }, className:CAMPO, placeholder:"Ex.: a escola paga só no dia 10"})),
      f.nova && dias!==null && e("p",{className:"rounded-xl px-3 py-2 text-[12.5px] font-semibold "+(livre ? "bg-green-50 text-[#15803D]" : "bg-amber-50 text-[#B45309]")},
        livre ? "Até "+cfg.diasLivres+" dias depois do acerto: a data muda na hora." : "Precisa de autorização da Diretoria. Sem ela, vale a multa de remarcação. Não prometa a mudança à revendedora antes da resposta."),
      prz>0 && min && e("p",{className:"text-[12px] text-[#4B5563]"}, "Mínimo de vendas esperado: "+BK(min)+" (a Diretoria confirma)."),
      e("button",{disabled:!pronto, onClick:enviar, className:"h-11 rounded-2xl bg-[#C9A13B] text-[14px] font-extrabold text-black disabled:opacity-40"}, livre ? "Alterar a data" : "Enviar pedido")),
    meus.length>0 && e("div",{className:"flex flex-col gap-1.5 rounded-2xl border border-black/10 bg-white p-3"},
      e("p",{className:"text-[11px] font-bold uppercase tracking-wide text-[#A67C12]"}, "Pedidos desta revendedora"),
      meus.map(function(x){ var t = ST[x.status] || ST.analise;
        return e("div",{key:x.id, className:"flex items-center justify-between gap-2 text-[12.5px]"}, e("span",{className:"min-w-0 truncate text-[#111827]"}, fmtData(x.dataAtual)+" → "+fmtData(x.novaData)+(x.prazo ? " · "+x.prazo+" dias"+(x.fixo ? " fixo" : "") : "")), e("b",{className:"shrink-0", style:{color:t[1]}}, t[0])); })));
}

export { PedidoDataRep, isoDeDM };
