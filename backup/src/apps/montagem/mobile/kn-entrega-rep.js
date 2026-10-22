// Sorelly Admin — mobile/kn-entrega-rep.js
// Entrega do kit novo no app da REPRESENTANTE: 16 blocos que vão abrindo (como na calculadora de acertos). Ela lê e dá o check; a revendedora dá o OK
// dela no app dela; só com os dois checks libera o próximo bloco (o que acabou de ser concluído fecha e o próximo abre; dá para reabrir). Sem celular:
// a representante confirma sozinha e a revendedora assina aqui. Fica registrado quem montou e quem bipou o kit; peça em falta conta na divergência deles.
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { passoAtual, TOTAL_PASSOS, PASSO_CONF } from "@/apps/montagem/domain/kit-novo-entrega";
import { BlocoKN } from "@/apps/montagem/mobile/kn-bloco";
import { PASSOS_KN, conteudoPasso, dataPrimeiroAcerto } from "@/apps/montagem/mobile/kn-conteudo";
import { AssinaturaDigital } from "@/apps/montagem/mobile/campos";
import { ConfPecas } from "@/apps/montagem/mobile/conf-pecas";
import { MONO } from "@/apps/montagem/ui/input";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useEffect, useRef, useState } from "@/shared/react";
import React from "react";

var CAMPO = "h-9 rounded-lg bg-white px-2 text-[13px] text-[#111827] outline-none ring-1 ring-black/10";
var ARROW = "grid size-8 shrink-0 place-items-center rounded-full bg-amber-200/10 text-amber-200";
var PASSO_EXPOSITOR = (PASSOS_KN.find(function(x){ return x.id==="expositores"; })||{}).n;

function EntregaKNRep(p){
  var s = p.s, d = p.d, k = p.k, versao = p.versao;
  var entrada = (s.entregasKN||{})[k.id], atual = passoAtual(entrada);
  var ab = useState(null), aberto = ab[0], setAberto = ab[1];
  var as = useState(null), assinatura = as[0], setAssinatura = as[1];
  // conferência final do kit: agora é a bipagem das peças com a câmera (Liberar kit → Começar a bipar → Finalizar); o resultado alimenta a entrega
  var conf = (s.confBip||{})[k.id] || {}, res = conf.fim ? conf.resultado : null;
  var autoAbriu = useRef(false);
  // confirmadas as etapas anteriores, o app já leva para a tela da conferência das peças (uma vez)
  useEffect(function(){ if(atual===PASSO_CONF && !conf.lib && !autoAbriu.current && p.onConferir){ autoAbriu.current = true; p.onConferir(); } }, [atual]);
  var cx = useState(false), caixinhas = cx[0], setCaixinhas = cx[1];
  var esperado = res ? res.esperadas : 0, faltaram = res ? res.nFaltas : 0, selecionadas = res ? res.conds : [];
  var obs = res && res.erros ? "Faltaram: "+res.faltas.map(function(f){ return f.codigo+(f.qtd>1 ? " ×"+f.qtd : ""); }).join(", ")+(res.nSobras ? " · peça a mais: "+res.sobras.map(function(x){ return x.codigo; }).join(", ") : "") : "";
  var confOk = !!res && caixinhas;
  var perfil = (s.perfisRev||{})[k.rev] || {};
  var montou = entrada && entrada.montou, bipou = entrada && entrada.bipou;

  var conferenciaUI = e("div",{className:"flex flex-col gap-2.5"},
    (montou || bipou) && e("div",{className:"flex flex-col gap-0.5 rounded-xl bg-[#F0FDFA] px-3 py-2 text-[12px] text-[#0F766E] ring-1 ring-[#99F6E4]"},
      e("b",null,"Registro do kit"), e("span",null,"Montado por "+(montou||"—")+" · Bipado por "+(bipou||"—"))),
    // a conferência das peças abre numa TELA SEPARADA (câmera); aqui fica só o resumo e o botão
    res ? e("div",{className:"flex flex-col gap-1 rounded-xl px-3 py-2 "+(res.erros ? "bg-[#FEE2E2]" : "bg-[#DCFCE7]")},
        e("b",{className:"text-[13px] "+(res.erros ? "text-[#991B1B]" : "text-[#15803D]")}, res.erros ? "Conferência feita com "+res.erros+" erro(s)" : "Conferência feita: "+res.lidas+" de "+res.esperadas+" peças, sem erros"),
        e("button",{onClick:function(){ p.onConferir && p.onConferir(); }, className:"text-left text-[11.5px] font-semibold text-[#6B7280] underline"},"Ver a conferência"))
      : e("button",{onClick:function(){ p.onConferir && p.onConferir(); }, className:"h-12 w-full rounded-2xl bg-[#C9A13B] text-[14px] font-bold txt-branco"}, conf.lib ? "Continuar a conferência das peças" : "Conferir as peças do kit (câmera)"),
    e("label",{className:"flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 text-[13px] font-semibold text-[#111827] ring-1 ring-[#E5E7EB]"},
      e("input",{type:"checkbox", checked:caixinhas, onChange:function(ev){ setCaixinhas(ev.target.checked); }, className:"size-5 shrink-0"}), "Entreguei as caixinhas de presente"));

  var assinaturaUI = e("div",{className:"flex flex-col gap-2.5"},
    e("p",{className:"text-[12.5px] text-[#374151]"},"A revendedora confirma o recebimento do kit e das orientações assinando aqui."),
    e(AssinaturaDigital,{onChange:setAssinatura, legenda:"Assinatura de "+k.rev}),
    e("button",{disabled:!assinatura || !confOk, onClick:function(){
        d({type:"KITNOVO_ENTREGAR", id:k.id, condicionais:selecionadas, pecasTotal:esperado, pecasFaltaram:faltaram, obsDivergencia:faltaram ? obs : "",
          regrasLidas:PASSOS_KN.slice(1, PASSO_CONF-1).map(function(x){ return x.t; }), assinatura:assinatura});
        d({type:"KN_ENT_CONCLUIR", kitId:k.id, assinatura:assinatura}); p.onConcluido(); },
      className:"h-12 rounded-2xl bg-[#C9A13B] text-[14px] font-bold txt-branco disabled:opacity-40"}, "Concluir entrega do kit novo"),
    !confOk && e("p",{className:"text-center text-[11.5px] text-[#9CA3AF]"},"Falta fechar a conferência final do kit (bloco "+PASSO_CONF+")."));

  // foto do expositor (a representante arruma o expositor e anexa a foto; ela fica na aba Expositores)
  var fotoSel = function(ev){ var fl = ev.target.files && ev.target.files[0]; if(!fl) return;
    var rd = new FileReader(); rd.onload = function(){ d({type:"KN_ENT_FOTO", kitId:k.id, foto:rd.result, nome:fl.name}); }; rd.readAsDataURL(fl); };
  var expositorUI = entrada && e("div",{key:"exp", className:"flex flex-col gap-2 rounded-xl bg-[#F9FAFB] p-2.5 ring-1 ring-[#E5E7EB]"},
    e("label",{className:"flex items-center gap-2.5 text-[12.5px] font-semibold text-[#111827]"},
      e("input",{type:"checkbox", checked:!!entrada.temExpositor, onChange:function(ev){ d({type:"KN_ENT_EXPOSITOR", kitId:k.id, v:ev.target.checked}); }, className:"size-5 shrink-0"}), "Esta entrega tem expositor"),
    entrada.temExpositor && e("label",{className:"flex cursor-pointer items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-2 text-[12px] text-[#6B7280] ring-1 ring-[#E5E7EB]"},
      e("span",{className:"min-w-0 truncate"}, entrada.fotoExpositor ? "Foto anexada" : "Anexar a foto do expositor arrumado"),
      e("span",{className:"shrink-0 rounded-md bg-[#F3F4F6] px-2 py-1 font-bold text-[#111827]"}, entrada.fotoExpositor ? "Trocar" : "Tirar foto"),
      e("input",{type:"file", accept:"image/*", capture:"environment", className:"hidden", onChange:fotoSel})),
    entrada.temExpositor && entrada.fotoExpositor && e("img",{src:entrada.fotoExpositor, alt:"Foto do expositor", className:"max-h-40 w-full rounded-lg object-cover"}));
  var expositorOk = !entrada || !entrada.temExpositor || !!entrada.fotoExpositor;

  var iniciar = function(){ d({type:"KN_ENT_INICIAR", kitId:k.id}); };
  var check = function(n){ d({type:"KN_ENT_CHECK", kitId:k.id, n:n, quem:"rep"}); setAberto(null); };
  var abertoEf = aberto===null ? Math.min(atual, TOTAL_PASSOS) : aberto;
  var pct = entrada ? Math.round((Math.min(atual, TOTAL_PASSOS+1)-1)/TOTAL_PASSOS*100) : 0;
  var ctx = {v:versao, k:k, perfil:perfil, dataAcerto:dataPrimeiroAcerto(), d:d, editavel:true};
  var montouKit = k.montId ? nomeDe(k.montId) : null, bipouKit = k.bipId ? nomeDe(k.bipId) : null;

  return e(React.Fragment,null,
    e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex flex-col gap-1.5 bg-[#0B0B0D] px-4 pb-3 pt-4"},
      e("div",{className:"flex items-center gap-2"},
        e("button",{onClick:p.onVoltar, "aria-label":"Voltar", className:ARROW}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
        e("b",{className:"min-w-0 flex-1 truncate text-[13px] font-black uppercase tracking-[.18em] text-amber-200"}, "Entrega do kit novo")),
      e("p",{className:"truncate text-[17px] font-extrabold txt-branco"}, k.rev),
      entrada && e("div",{className:"flex items-center gap-2"},
        e("span",{className:"h-1.5 flex-1 overflow-hidden rounded-full bg-white/15"}, e("span",{className:"block h-full rounded-full bg-[#E8B84B]", style:{width:pct+"%"}})),
        e("span",{className:"text-[11px] font-bold text-amber-200"}, entrada.status==="concluida" ? "concluída" : "etapa "+Math.min(atual,TOTAL_PASSOS)+" de "+TOTAL_PASSOS))),
    !entrada
      ? e("div",{className:"mt-3 flex flex-col items-center gap-3 rounded-2xl bg-white p-5 text-center ring-1 ring-[#E5E7EB]"},
          e("span",{className:"grid size-14 place-items-center rounded-full bg-[#FCE7F3] text-[#DB2777]"}, e(Icon,{n:"caixa", s:28})),
          e("b",{className:"text-[16px] text-[#111827]"},"Pronta para entregar o kit novo?"),
          (montouKit || bipouKit) && e("p",{className:"rounded-xl bg-[#F0FDFA] px-3 py-1.5 text-[12px] text-[#0F766E]"},"Kit montado por "+(montouKit||"—")+" · bipado por "+(bipouKit||"—")),
          e("p",{className:"text-[13px] text-[#6B7280]"},"Você e a revendedora vão ler juntas, etapa por etapa. Cada etapa só libera a próxima quando as duas derem o check."),
          e("button",{onClick:iniciar, className:"h-12 w-full rounded-2xl bg-[#C9A13B] text-[14px] font-bold txt-branco"}, "Iniciar entrega"))
      : e("div",{className:"mt-3 flex flex-col gap-2.5 pb-4"},
          e("label",{className:"flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 text-[12.5px] font-semibold text-[#111827] ring-1 ring-[#E5E7EB]"},
            e("input",{type:"checkbox", checked:!!entrada.semCelular, disabled:entrada.status==="concluida", onChange:function(ev){ d({type:"KN_ENT_SEMCEL", kitId:k.id, v:ev.target.checked}); }, className:"size-5 shrink-0"}),
            "A revendedora está sem celular agora"),
          PASSOS_KN.map(function(meta){
            var n = meta.n, c = (entrada.checks||{})[n] || {};
            var conteudo = conteudoPasso(n, Object.assign({}, ctx, {conferencia:conferenciaUI, assinatura:assinaturaUI, expositorUI:expositorUI}));
            var bloqueado = n>atual || (n===PASSO_CONF && !confOk) || (n===PASSO_EXPOSITOR && !expositorOk);
            var botao = n<TOTAL_PASSOS && e("button",{key:"ck", disabled:bloqueado && !c.rep, onClick:function(){ check(n); },
              className:"h-11 rounded-xl text-[13.5px] font-bold txt-branco disabled:opacity-40 "+(c.rep ? "bg-[#16A34A]" : "bg-[#C9A13B]")}, c.rep ? "✓ Check dado. Toque para desfazer" : "Dar o check");
            var aviso = (n===PASSO_CONF && !confOk && !c.rep) ? "Feche a conferência (e as caixinhas) para dar o check." : (n===PASSO_EXPOSITOR && !expositorOk && !c.rep) ? "Anexe a foto do expositor para dar o check." : null;
            return e(BlocoKN,{key:n, meta:meta, repOk:!!c.rep, revOk:!!c.rev, semCelular:!!entrada.semCelular, atual:atual,
              aberto:abertoEf===n, onToggle:function(){ setAberto(abertoEf===n ? 0 : n); },
              children:[e("div",{key:"cont"}, conteudo), botao, aviso && e("p",{key:"av", className:"text-center text-[11.5px] text-[#9CA3AF]"}, aviso)]}); })));
}

export { EntregaKNRep };
