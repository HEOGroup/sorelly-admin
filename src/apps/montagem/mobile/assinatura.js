// Sorelly Admin — mobile/assinatura.js
// Tela de fechamento com assinatura digital da revendedora: usada ao finalizar um acerto (deixou o kit) e na entrega de kit novo.
// modo "unico": um check só ("li e entendi as regras"). modo "lista": a representante vai lendo e marcando regra por regra.
import { AssinaturaDigital } from "@/apps/montagem/mobile/campos";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";
import React from "react";

var ARROW = "grid size-8 shrink-0 place-items-center rounded-full bg-amber-200/10 text-amber-200";
var TITULO = "text-[13px] font-black uppercase tracking-[.18em] text-amber-200";
var CARTAO = "overflow-hidden rounded-2xl border border-[#E9DDBB] bg-white shadow-sm";

// Cartão numerado de um passo: fica apagado e sem clique enquanto o passo anterior não terminou.
function CartaoPasso(p){
  var cor = p.cor || "#C9A13B";
  return e("div",{className:CARTAO+(p.travado ? " pointer-events-none opacity-45" : "")},
    e("div",{className:"flex items-center gap-2 px-3 py-2", style:{background:cor+"1F"}},
      e("span",{className:"grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-extrabold text-white", style:{background:p.ok ? "#16A34A" : cor}},
        p.ok ? e(Icon,{n:"check", s:12}) : p.n),
      e("b",{className:"min-w-0 flex-1 text-[13.5px] text-[#111827]"}, p.titulo),
      p.direita && e("span",{className:"shrink-0 text-[11.5px] font-bold text-[#6B7280]"}, p.direita)),
    e("div",{className:"flex flex-col gap-2 p-3 text-[12.5px] leading-snug text-[#374151]"}, p.children));
}

// ACERTO SEM ASSINATURA (Marcus, 24/11/2026): só em caso esporádico, AUTORIZADO por Marcus, Nickolas ou Lucas. Fica gravado quem autorizou, quem entregou a maleta, o motivo e a hora. O kit novo continua exigindo a assinatura dela.
var AUTORIZAM = ["Marcus", "Nickolas", "Lucas"], ENTREGOU = ["Marido", "Familiar", "Vizinho ou portaria", "Outra pessoa"];
var CAMPO_SA = "h-8 w-full rounded-lg bg-white px-2 text-[13px] text-[#111827] outline-none ring-1 ring-black/10";

function TelaAssinatura(p){
  var sa = useState({ligado:false, quem:"", entregou:"", nome:"", motivo:""}), semA = sa[0], setSemA = function(k, v){ var o = Object.assign({}, semA); o[k] = v; sa[1](o); };
  var semOk = semA.ligado && !!semA.quem && !!semA.entregou && !!semA.nome.trim() && semA.motivo.trim().length>=5;
  var as = useState(null), assinatura = as[0], setAssinatura = as[1];
  var ck = useState({}), checks = ck[0], setChecks = ck[1];
  var ci = useState(false), ciente = ci[0], setCiente = ci[1];
  var lista = p.modo==="lista", regras = p.regras || [];
  var marcadas = regras.filter(function(r,i){ return checks[i]; }).length;
  var regrasOk = lista ? (regras.length>0 && marcadas===regras.length) : ciente;
  var antesOk = p.antesOk !== false;
  var nAntes = (p.passosAntes || []).length;
  var pronto = semA.ligado ? semOk : (antesOk && regrasOk && !!assinatura);
  var alterna = function(i){ var o = Object.assign({}, checks); o[i] = !o[i]; setChecks(o); };
  return e(React.Fragment,null,
    e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex flex-col gap-1 bg-[#0B0B0D] px-4 pb-3 pt-4"},
      e("div",{className:"flex items-center gap-2"},
        e("button",{onClick:p.onVoltar, "aria-label":"Voltar", className:ARROW}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
        e("b",{className:TITULO+" min-w-0 flex-1 truncate"}, p.titulo)),
      p.nome && e("p",{className:"truncate text-[17px] font-extrabold txt-branco"}, p.nome)),
    e("div",{className:"mt-3 flex flex-col gap-3 pb-4"},
      p.resumo && e("div",{className:CARTAO+" p-3"},
        p.resumo.map(function(l,i){ return e("div",{key:i, className:"flex items-baseline justify-between gap-3 py-0.5 text-[12.5px]"},
          e("span",{className:"text-[#6B7280]"}, l[0]),
          e("b",{className:MONO+" whitespace-nowrap "+(l[2]||"text-[#111827]")}, l[1])); })),
      p.passosAntes,
      e(CartaoPasso,{n:nAntes+1, titulo: lista ? "Regras — leia e marque uma por uma" : "Regras passadas para a revendedora", cor:"#7C3AED", ok:regrasOk, travado:!antesOk,
          direita: lista ? marcadas+"/"+regras.length : null},
        p.onAbrirRegras && e("button",{type:"button", onClick:p.onAbrirRegras, className:"flex h-10 items-center justify-center gap-2 rounded-xl bg-[#7C3AED] text-[13.5px] font-bold txt-branco"}, e(Icon,{n:"book", s:16}), "Abrir as regras para a revendedora ler"),
        p.onAbrirRegras && e("p",{className:"rounded-xl bg-[#f6efdf] px-3 py-2 text-center text-[12.5px] font-semibold text-[#161616]"}, "Avise a revendedora: as regras também ficam no app dela, em Regras e comissões. Ela pode ler de novo quando quiser."),
        lista
          ? regras.map(function(r,i){ return e("label",{key:i, className:"flex items-start gap-2.5 rounded-xl px-2.5 py-2 "+(checks[i] ? "bg-emerald-50" : "bg-[#F4F5F7]")},
              e("input",{type:"checkbox", checked:!!checks[i], onChange:function(){ alterna(i); }, className:"mt-0.5 size-4 shrink-0"}),
              e("span",null, e("b",{className:"text-[#111827]"}, r.t+". "), r.x)); })
          : e(React.Fragment,null,
              !p.onAbrirRegras && regras.map(function(r,i){ return e("p",{key:i}, e("b",{className:"text-[#111827]"}, r.t+". "), r.x); }),   // com o botão "Abrir as regras" o texto não é repetido aqui (Marcus, 03/11/2026)
              e("label",{className:"mt-1 flex items-center gap-2.5 rounded-xl bg-emerald-50 px-3 py-2.5 text-[13px] font-semibold text-emerald-900"},
                e("input",{type:"checkbox", checked:ciente, onChange:function(ev){ setCiente(ev.target.checked); }, className:"size-5 shrink-0"}),
                "A revendedora leu e entendeu as regras passadas"))),
      e(CartaoPasso,{n:nAntes+2, titulo:"Assinatura da revendedora", cor:"#0891B2", ok:!!assinatura, travado:!(antesOk && regrasOk)},
        e(AssinaturaDigital,{onChange:setAssinatura, legenda:p.nome ? "Assinatura de "+p.nome : ""}),
        e("p",{className:"text-center text-[12px] text-[#6B7280]"}, "A assinatura fica gravada neste acerto, com a data e a versão das regras que ela leu.")),
      p.semAssinatura && e(CartaoPasso,{n:nAntes+3, titulo:"Revendedora não atendeu", cor:"#B45309", ok:semOk, travado:false},
        e("label",{className:"flex items-center gap-2.5 rounded-xl bg-[#FEF3C7] px-3 py-2 text-[13px] font-semibold text-[#92400E]"},
          e("input",{type:"checkbox", checked:semA.ligado, disabled:!p.semAssinatura.permitido, onChange:function(ev){ setSemA("ligado", ev.target.checked); }, className:"size-5 shrink-0"}),
          p.semAssinatura.permitido ? "Finalizar sem a assinatura (só com autorização)" : p.semAssinatura.bloqueio),
        semA.ligado && e(React.Fragment,null,
          e("select",{value:semA.quem, "aria-label":"Quem autorizou", onChange:function(ev){ setSemA("quem", ev.target.value); }, className:CAMPO_SA}, [e("option",{key:"", value:""}, "Autorizado por")].concat(AUTORIZAM.map(function(n){ return e("option",{key:n, value:n}, n); }))),
          e("select",{value:semA.entregou, "aria-label":"Quem entregou a maleta", onChange:function(ev){ setSemA("entregou", ev.target.value); }, className:CAMPO_SA}, [e("option",{key:"", value:""}, "Quem entregou a maleta")].concat(ENTREGOU.map(function(n){ return e("option",{key:n, value:n}, n); }))),
          e("input",{value:semA.nome, placeholder:"Nome de quem entregou", onChange:function(ev){ setSemA("nome", ev.target.value); }, className:CAMPO_SA}),
          e("input",{value:semA.motivo, placeholder:"Motivo (obrigatório)", onChange:function(ev){ setSemA("motivo", ev.target.value); }, className:CAMPO_SA}))),
      e("button",{disabled:!pronto, onClick:function(){ if(semA.ligado) p.onConcluir({assinatura:null, regrasLidas:false, semAssinatura:{autorizadoPor:semA.quem, entreguePor:semA.entregou, entregueNome:semA.nome.trim(), motivo:semA.motivo.trim(), em:new Date().toISOString()}}); else p.onConcluir({assinatura:assinatura, regrasLidas:regras.map(function(r){return r.t;})}); },
        className:"h-12 rounded-2xl bg-[#C9A13B] text-[14px] font-bold txt-branco disabled:opacity-40"}, p.rotuloBotao || "Concluir"),
      !pronto && e("p",{className:"text-center text-[11.5px] text-[#9CA3AF]"},
        semA.ligado ? "Preencha quem autorizou, quem entregou, o nome e o motivo." : !antesOk ? "Complete o passo anterior para liberar as regras." : !regrasOk ? "Marque as regras para liberar a assinatura." : "Falta a assinatura da revendedora.")));
}

export { CartaoPasso, TelaAssinatura };
