// Sorelly Admin · montagem — mobile/pedido-data-rep.js
// App da representante: PEDIR a mudança da data do acerto de uma revendedora dela (24/10/2026). Até N dias depois da data atual vale na hora; além disso o pedido vai para a Diretoria
// (Agendamento → Plano 45/60 → Aprovação → Pedidos do app) e, sem aprovação, vale a multa de remarcação. Pode pedir 45 ou 60 dias e deixar o prazo fixo. Regras em domain/plano45-60.js.
// 05/11/2026 (Marcus): a tela abre como tela própria, clara, no mesmo desenho da calculadora de acertos (cabeçalho com seta, fundo branco, campos de 32 px). Sem a data atual do acerto, ela é informada na tela.
import { diasEntre, fmtData, hojeIsoLocal, minimoSugerido } from "@/apps/montagem/domain/plano45-60";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var BK = function(n){ return "R$ "+Number(n||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); };
var MOTIVOS = ["Dia de pagamento da revendedora", "Vende pouco e precisa de mais tempo", "Viagem ou compromisso", "Problema de saúde ou família", "Outro"];
var ST = {analise:["Aguardando aprovação", "#B45309"], registrada:["Alterada na hora", "#15803D"], aprovada:["Aprovada, sem multa", "#15803D"], reprovada:["Reprovada, vale a multa", "#B91C1C"]};
var CAMPO = "h-8 w-full rounded-lg bg-white px-2 text-[13px] text-[#1F1A10] outline-none ring-1 ring-[#CFC7B2]";
var CARTAO = "rounded-xl border border-[#E4E0D6] bg-white px-3 py-2";
var ROTULO = "flex flex-col gap-1 text-[11px] font-bold uppercase tracking-wide text-[#8A6A12]";

// "dd/mm" do cartão da revendedora vira data completa (este ano; se ficou muito no passado, ano que vem)
function isoDeDM(dm){
  var p = String(dm||"").split("/"); if(p.length<2) return "";
  var h = new Date(), ano = h.getFullYear(), iso = ano+"-"+p[1]+"-"+p[0];
  return diasEntre(iso, hojeIsoLocal())>180 ? (ano+1)+"-"+p[1]+"-"+p[0] : iso;
}

function PedidoDataRep(p){
  var s = p.s, d = p.d, cfg = s.p45.config, rev = p.rev;
  var st = useState({atual:"", nova:"", prazo:"0", fixo:false, motivo:"", obs:""}), f = st[0], set = function(k, v){ var o = Object.assign({}, f); o[k] = v; st[1](o); };
  var atualCartao = isoDeDM(rev.data), atual = atualCartao || f.atual;   // sem data no cartão: a representante informa
  var meus = (s.p45.pedidos||[]).filter(function(x){ return x.nome.toLowerCase()===rev.rev.toLowerCase(); }).slice().reverse().slice(0, 4);
  var prz = Number(f.prazo), dias = f.nova && atual ? diasEntre(atual, f.nova) : null, livre = !prz && dias!==null && dias>=0 && dias<=cfg.diasLivres;
  var min = prz ? minimoSugerido(prz, "representante", cfg) : null;
  var mesma = !!(f.nova && atual && f.nova===atual);   // a mesma data não é pedido
  var enviar = function(){ d({type:"P45", op:"pedido_novo", por:p.l.rep, dados:{rep:p.l.rep, nome:rev.rev, dataAtual:atual, novaData:f.nova, prazo:prz, fixo:f.fixo, motivo:f.motivo, obs:f.obs}}); st[1]({atual:"", nova:"", prazo:"0", fixo:false, motivo:"", obs:""}); };
  var pronto = f.nova && f.motivo && atual && !mesma;
  var campo = function(rotulo, filho){ return e("label",{className:ROTULO}, rotulo, filho); };
  return e("div",{className:"-mx-4 flex flex-col gap-2.5 px-4 pb-12 pt-3", style:{background:"#FFFFFF", color:"#1F1A10", marginTop:"-0.5rem", marginBottom:"-2.5rem", minHeight:"calc(100% + 3rem)"}},
    e("div",{className:"flex items-center gap-2"},
      e("button",{onClick:p.onVoltar, "aria-label":"Voltar", className:"grid size-8 shrink-0 place-items-center rounded-full bg-[#F4EFE0] text-[#8A6A12]"}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
      e("b",{className:"min-w-0 flex-1 text-[13px] font-black uppercase tracking-[.18em] text-[#8A6A12]"}, "Alterar data do acerto")),
    e("div",{className:CARTAO},
      e("p",{className:"text-[13px] font-semibold"}, rev.rev),
      e("p",{className:"text-[11px]"}, "Acerto atual: "+(atual ? fmtData(atual) : "sem data no sistema"))),
    e("div",{className:"flex flex-col gap-2 "+CARTAO},
      !atualCartao && campo("Data atual do acerto", e("input",{type:"date", value:f.atual, onChange:function(ev){ set("atual", ev.target.value); }, className:CAMPO})),
      campo("Nova data", e("input",{type:"date", value:f.nova, min:hojeIsoLocal(), onChange:function(ev){ set("nova", ev.target.value); }, className:CAMPO})),
      campo("Prazo", e("select",{value:f.prazo, onChange:function(ev){ set("prazo", ev.target.value); }, className:CAMPO},
        e("option",{value:"0"}, "Só mudar a data"), e("option",{value:"45"}, "45 dias"), e("option",{value:"60"}, "60 dias"))),
      prz>0 && e("label",{className:"flex min-h-8 items-center gap-2 text-[13px] font-semibold"}, e("input",{type:"checkbox", checked:f.fixo, onChange:function(ev){ set("fixo", ev.target.checked); }, className:"size-4"}), "Deixar sempre nesse prazo (a Diretoria decide)"),
      campo("Motivo", e("select",{value:f.motivo, onChange:function(ev){ set("motivo", ev.target.value); }, className:CAMPO}, e("option",{value:""}, "Escolher"), MOTIVOS.map(function(m){ return e("option",{key:m, value:m}, m); }))),
      campo("Observação (opcional)", e("input",{value:f.obs, onChange:function(ev){ set("obs", ev.target.value); }, className:CAMPO, placeholder:"Ex.: a escola paga só no dia 10"})),
      f.nova && atual && e("p",{className:"rounded-lg px-3 py-2 text-[13px] font-semibold "+(livre && !mesma ? "bg-[#ECFDF3] text-[#15803D]" : "bg-[#FFF7E6] text-[#B45309]")},
        mesma ? "Esta já é a data do acerto. Escolha outra data."
        : livre ? "Até "+cfg.diasLivres+" dias depois do acerto: a data muda na hora."
        : dias<0 ? "A nova data é antes da data atual. Precisa de autorização da Diretoria."
        : "Precisa de autorização da Diretoria. Sem ela, vale a multa de remarcação. Não prometa a mudança à revendedora antes da resposta."),
      prz>0 && min && e("p",{className:"text-[11px]"}, "Mínimo de vendas esperado: ", e("b",{className:MONO}, BK(min)), " (a Diretoria confirma)."),
      e("button",{disabled:!pronto, onClick:enviar, className:"h-8 rounded-2xl bg-[#C9A13B] text-[13px] font-bold txt-branco disabled:opacity-40"}, livre && !mesma ? "Alterar a data" : "Enviar pedido")),
    meus.length>0 && e("div",{className:"flex flex-col "+CARTAO},
      e("p",{className:"flex min-h-8 items-center text-[11px] font-bold uppercase tracking-wide text-[#8A6A12]"}, "Pedidos desta revendedora"),
      meus.map(function(x){ var t = ST[x.status] || ST.analise;
        return e("div",{key:x.id, className:"flex min-h-8 items-center justify-between gap-2 border-t border-[#E4E0D6] text-[13px]"},
          e("span",{className:"min-w-0"}, fmtData(x.dataAtual)+" → "+fmtData(x.novaData)+(x.prazo ? " · "+x.prazo+" dias"+(x.fixo ? " fixo" : "") : "")),
          e("b",{className:"shrink-0 text-[11px]", style:{color:t[1]}}, t[0])); })));
}

export { PedidoDataRep, isoDeDM };
