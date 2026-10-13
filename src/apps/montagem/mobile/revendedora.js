// Sorelly Admin · montagem e bipagem — mobile/revendedora.js
// RecebimentoRep: confirmação de recebimento dos kits na tela da representante.
// AppRevendedora: clone da tela inicial do app real da revendedora (o app de verdade fica nas lojas de aplicativos).
import { calcularAcerto, modalidadeDe, versaoEfetiva, versaoVigente } from "@/apps/montagem/domain/consignado";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { passoAtual, TOTAL_PASSOS } from "@/apps/montagem/domain/kit-novo-entrega";
import { BK, BKC } from "@/apps/montagem/lib/format";
import { OURO_APP } from "@/apps/montagem/mobile/bipagem";
import { IPhone15 } from "@/apps/montagem/mobile/iphone";
import { BlocoKN } from "@/apps/montagem/mobile/kn-bloco";
import { PASSOS_KN, conteudoPasso, dataPrimeiroAcerto } from "@/apps/montagem/mobile/kn-conteudo";
import { Avatar } from "@/apps/montagem/mobile/theme";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

function RecebimentoRep(p){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var pend = (s.retPend||[]).find(function(r){return r.lid===p.l.id;}); if(!pend) return null;
  var ks = s.kits.filter(function(k){return pend.ids.indexOf(k.id)>=0;});
  return e("div",{className:"mb-3 flex flex-col gap-2 rounded-2xl bg-amber-400/15 p-3 ring-2 ring-amber-400/50"},
    e("p",{className:"text-[12px] font-semibold uppercase tracking-wide text-amber-200"},"Confirmar recebimento"),
    e("p",{className:"text-[13px]"}, nomeDe(pend.por)+" está entregando "+ks.length+(ks.length>1?" kits:":" kit:")),
    e("div",{className:"overflow-hidden rounded-xl bg-black/40"}, ks.map(function(k){ return e("div",{key:k.id, className:"flex justify-between gap-2 border-b border-white/5 px-3 py-1.5 text-[13px] last:border-0"},
      e("span",{className:"truncate"}, k.rev), e("span",{className:MONO+" text-amber-200"}, k.valor ? BK(k.valor) : "cond.")); })),
    e("div",{className:"flex gap-2"},
      e("button",{onClick:function(){ d({type:"RESP_RET", id:pend.id, aceita:true}); }, className:"h-10 flex-1 rounded-xl text-sm font-semibold "+OURO_APP},"Recebi os kits"),
      e("button",{onClick:function(){ d({type:"RESP_RET", id:pend.id, aceita:false}); }, className:"h-10 rounded-xl bg-white/10 px-4 text-sm font-semibold"},"Recusar")));
}

// Letras brancas dentro do tema claro do app (a classe txt-branco não é trocada pelo tema)
var BRANCO = "txt-branco";
function Cartao(p){
  return e("button",{onClick:p.onClick, className:"flex w-full items-center gap-2.5 rounded-xl bg-white px-2.5 py-2 text-left shadow-sm ring-1 "+(p.destaque ? "ring-2 ring-[#C9A13B]" : "ring-[#E5E7EB]")},
    e("span",{className:"grid size-10 shrink-0 place-items-center rounded-lg", style:{background:p.cor+"1F", color:p.cor}}, e(Icon,{n:p.ic, s:19})),
    e("span",{className:"min-w-0 flex-1"},
      e("b",{className:"flex items-center gap-2 text-[14.5px] leading-tight text-[#111827]"}, p.t, p.badge && e("span",{className:"ml-auto rounded-full bg-[#DB2777] px-2 py-px text-[10px] font-black "+BRANCO}, p.badge), p.novo && e("span",{className:"rounded-full bg-[#C9A13B] px-1.5 py-px text-[9.5px] font-black uppercase "+BRANCO}, "novo")),
      e("span",{className:"block text-[12px] leading-tight text-[#6B7280]"}, p.sub)),
    e(Icon,{n:"chevron", s:14, className:"text-[#9CA3AF]"}));
}
function AppRevendedora(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = p.k;
  var ts = useState("inicio"), tela = ts[0], setTela = ts[1];
  var ab = useState(null), aberto = ab[0], setAberto = ab[1];
  var vig = versaoVigente(s), mod = modalidadeDe(s, k.rev), perfil = (s.perfisRev||{})[k.rev] || {};
  var versao = vig ? versaoEfetiva(vig, mod) : null;
  var total = (k.vendas||[])[0] || 0;
  var res = versao ? calcularAcerto({vendaBruta:total, devolvida:0, garantia:0, vez:0, valorPago:null, atrasoDias:0}, versao) : null;
  var metaMin = versao ? Math.min.apply(null, versao.faixas.filter(function(f){ return f.pct>0; }).map(function(f){ return f.min; }).concat([Infinity])) : 0;
  var pecas = Math.round(total/110);
  var dataAcerto = perfil.dataAcerto ? perfil.dataAcerto.split("-").reverse().join("/") : "—";
  var entrega = (s.acertosConsignado||[]).filter(function(a){ return a.tipo==="kit_novo_entrega" && a.rev===k.rev; })[0];

  // o tema do app pinta o PRIMEIRO bloco da tela de preto (cabeçalho); o resto é a folha branca com os blocos
  // Cabeçalho no mesmo estilo do app da representante: fundo preto, ondas douradas, logo Sorelly e sino
  var chama = e("svg",{viewBox:"0 0 24 30", width:13, height:16, "aria-hidden":true},
    e("defs",null, e("linearGradient",{id:"revFlame", x1:"0%", y1:"0%", x2:"0%", y2:"100%"},
      e("stop",{offset:"0%", stopColor:"#F1E4C6"}), e("stop",{offset:"55%", stopColor:"#E8B84B"}), e("stop",{offset:"100%", stopColor:"#B8862B"}))),
    e("path",{fill:"url(#revFlame)", d:"M12 0c2 4-3 6-3 10a3 3 0 0 0 6 0c0-1-.4-2-.4-2 2 1.5 3.4 4.2 3.4 7a6 6 0 1 1-12 0c0-6 4-8 6-15Z"}));
  // Brasão do nível (escudo com estrela, na cor do nível)
  var brasao = function(tam){ return e("svg",{viewBox:"0 0 24 28", width:tam, height:tam*28/24, "aria-hidden":true},
    e("defs",null, e("linearGradient",{id:"revBronze", x1:"0%", y1:"0%", x2:"100%", y2:"100%"}, e("stop",{offset:"0%", stopColor:"#E3A164"}), e("stop",{offset:"100%", stopColor:"#7A4015"}))),
    e("path",{d:"M12 1 22 5v8c0 6-4.5 11-10 14C6.5 24 2 19 2 13V5Z", fill:"url(#revBronze)", stroke:"#F2C99B", strokeWidth:1}),
    e("path",{d:"m12 7 1.9 3.9 4.3.6-3.1 3 .7 4.3L12 16.7 8.2 18.8l.7-4.3-3.1-3 4.3-.6Z", fill:"#FFE8C8"})); };
  var topo = e("div",{key:"t", className:"relative -mx-4 -mt-2 overflow-hidden rounded-b-[34px] bg-[#0B0B0D] px-5 pb-4 pt-4 "+BRANCO},
    e("svg",{viewBox:"0 0 380 190", preserveAspectRatio:"none", className:"pointer-events-none absolute inset-0 h-full w-full", "aria-hidden":true},
      e("defs",null, e("linearGradient",{id:"revGoldA", x1:"0%", y1:"0%", x2:"100%", y2:"100%"},
        e("stop",{offset:"0%", stopColor:"#B8862B", stopOpacity:0.9}), e("stop",{offset:"55%", stopColor:"#E8B84B", stopOpacity:0.5}), e("stop",{offset:"100%", stopColor:"#F1E4C6", stopOpacity:0}))),
      e("path",{d:"M80 -30 C 200 15 250 65 410 35 L 410 -30 Z", fill:"url(#revGoldA)"}),
      e("path",{d:"M-30 140 C 90 95 220 175 410 105 L 410 210 L -30 210 Z", fill:"url(#revGoldA)", opacity:.35})),
    e("div",{className:"relative flex items-center justify-between gap-2"},
      e("div",{className:"flex min-w-0 items-center gap-2"},
        e(Avatar,{nome:k.rev, i:0, className:"size-9 shrink-0 text-sm"}),
        e("span",{className:"flex min-w-0 items-center gap-1"}, e("b",{className:"flex flex-col text-[13px] font-bold leading-tight"}, e("span",null, k.rev.split(" ")[0]), e("span",null, k.rev.split(" ").slice(1).join(" "))), e(Icon,{n:"chevrondown", s:11, className:"shrink-0 text-white/50"}))),
      e("span",{className:"flex shrink-0 items-center gap-1.5"}, chama, e("b",{className:"text-[12px] font-black tracking-[.25em] text-amber-200"},"SORELLY")),
      e("span",{className:"relative grid size-8 shrink-0 place-items-center rounded-full bg-[#2A2A2E]"}, e(Icon,{n:"alert", s:14}),
        e("span",{className:"absolute -right-1 -top-1 grid min-w-[1.05rem] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold"}, "8"))),
    e("div",{className:"relative mt-3 flex items-center justify-between"},
      e("div",{className:"flex items-center gap-2"}, brasao(30),
        e("div",null, e("p",{className:"text-[10px] font-black uppercase tracking-wider text-[#E8B84B]"},"Nível atual"), e("b",{className:"text-[19px] leading-none"},"Bronze"))),
      e("div",{className:"flex items-center gap-2 text-right"},
        e("div",null, e("p",{className:"text-[10.5px] opacity-60"},"Próximo nível"), e("b",{className:"text-[13px]"},"Bronze")), brasao(22))),
    e("div",{className:"relative mt-2 h-1.5 rounded-full bg-[#3A3A3F]"}, e("span",{className:"block h-full w-[6%] rounded-full bg-[#E8B84B]"})),
    e("p",{className:"relative mt-2.5 rounded-xl bg-[#2A2A2E] px-3 py-2 text-[12px] leading-snug"}, "Sua meta é ", e("b",{className:"text-[#E8B84B]"}, BKC(metaMin===Infinity ? 0 : metaMin)), " em vendas para começar a ganhar comissão e brindes!"));

  var resumo = e("div",{className:"overflow-hidden rounded-2xl bg-white ring-1 ring-[#E5E7EB]"},
    e("div",{className:"grid grid-cols-2 divide-x divide-[#E5E7EB]"},
      e("div",{className:"flex flex-col items-center gap-1 px-2 py-3"}, e("span",{className:"text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]"},"Total vendido"),
        e("b",{className:"text-[20px] text-[#111827]"}, BKC(total)), e("span",{className:"rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#15803D]"}, pecas+" peças vendidas")),
      e("div",{className:"flex flex-col items-center gap-1 px-2 py-3"}, e("span",{className:"text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]"},"Acerto previsto ⓘ"),
        e("b",{className:"text-[20px] text-[#111827]"}, BKC(res ? res.valorAcerto : 0)), e("span",{className:"rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#374151]"}, dataAcerto))),
    e("div",{className:"flex flex-col items-center gap-1.5 border-t border-[#E5E7EB] px-2 py-2.5", style:{background:"linear-gradient(180deg,#FFFBEF,#FFFFFF)"}},
      e("span",{className:"flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#6B7280]"},"Valor da comissão", e("span",{className:"rounded-full bg-[#C9A13B] px-2 py-0.5 text-[11px] font-black "+BRANCO}, (res ? res.comissaoPct : 0)+"%")),
      e("b",{className:"text-[30px] font-black leading-none text-[#B8862B]"}, BKC(res ? res.comissao : 0)),
      e("div",{className:"flex gap-2"},
        e("span",{className:"rounded-lg bg-[#F3F4F6] px-3 py-1 text-[12px] font-semibold text-[#111827]"},"Regras & Comissões"),
        e("span",{className:"rounded-lg bg-[#F3F4F6] px-3 py-1 text-[12px] font-semibold text-[#111827]"},"Indicações"))));

  var folha = function(filhos){ return e("div",{className:"-mx-4 -mb-10 flex min-h-[calc(100%-3.5rem)] flex-col gap-2 bg-white px-4 pb-10 pt-3"}, filhos); };
  // Entrega do kit novo feita JUNTO com a representante: a representante inicia no app dela; cada etapa só libera a próxima com o OK das duas
  var temKitNovo = (k.tipoKit||"").indexOf("kit_novo")===0 || !!k.demoKitNovo;   // só quem tem um kit novo para receber vê o aviso
  var ent = (s.entregasKN||{})[k.id], atual = passoAtual(ent), concluida = !!ent && ent.status==="concluida";
  var abertoEf = aberto===null ? Math.min(atual, TOTAL_PASSOS) : aberto;
  var ctxKN = {v:versao, k:k, perfil:perfil, dataAcerto:dataPrimeiroAcerto()};
  var okRev = function(n){ d({type:"KN_ENT_CHECK", kitId:k.id, n:n, quem:"rev"}); setAberto(null); };
  var telaKitNovo = [
    e("div",{key:"h", className:"flex flex-col gap-1.5 "+BRANCO},
      e("div",{className:"flex items-center gap-2"},
        e("button",{onClick:function(){ setTela("inicio"); }, "aria-label":"Voltar", className:"grid size-8 place-items-center rounded-full bg-[#2A2A2E]"}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
        e("b",{className:"text-[16px]"},"Receber kit novo")),
      ent && e("div",{className:"flex items-center gap-2"},
        e("span",{className:"h-1.5 flex-1 overflow-hidden rounded-full bg-[#3A3A3F]"}, e("span",{className:"block h-full rounded-full bg-[#E8B84B]", style:{width:Math.round((Math.min(atual,TOTAL_PASSOS+1)-1)/TOTAL_PASSOS*100)+"%"}})),
        e("span",{className:"text-[11px] font-bold text-[#E8B84B]"}, concluida ? "recebido" : "etapa "+Math.min(atual,TOTAL_PASSOS)+" de "+TOTAL_PASSOS))),
    e("div",{key:"c"}, folha(!temKitNovo
      ? e("div",{className:"flex flex-col items-center gap-2 rounded-xl bg-white p-5 text-center shadow-sm ring-1 ring-[#E5E7EB]"}, e("span",{className:"grid size-12 place-items-center rounded-full bg-[#F3F4F6] text-[#6B7280]"}, e(Icon,{n:"box", s:24})), e("b",{className:"text-[15px] text-[#111827]"}, "Nenhum kit novo para receber agora"), e("p",{className:"text-[13px] text-[#6B7280]"}, "Quando a sua representante tiver um kit novo para você, ele aparece aqui."))
      : !ent
      ? e("div",{className:"flex flex-col items-center gap-2 rounded-xl bg-white p-5 text-center shadow-sm ring-1 ring-[#E5E7EB]"},
          e("span",{className:"grid size-12 place-items-center rounded-full bg-[#FCE7F3] text-[#DB2777]"}, e(Icon,{n:"box", s:24})),
          e("b",{className:"text-[15px] text-[#111827]"}, "1 kit novo para receber"),
          e("p",{className:"text-[13px] text-[#6B7280]"}, "Sua representante "+(p.k.rep || "Dayanne")+" vai iniciar a entrega no app dela. Vocês vão ler tudo juntas, etapa por etapa, e cada uma confirma a sua parte."),
          e("span",{className:"rounded-full bg-[#FEF3C7] px-3 py-1 text-[12px] font-bold text-[#B45309]"}, "Aguardando a representante iniciar"))
      : [concluida && e("div",{key:"ok", className:"flex items-center gap-2 rounded-xl bg-[#DCFCE7] px-3 py-2.5 text-[13px] font-bold text-[#15803D]"}, e(Icon,{n:"check", s:16}), "Kit novo recebido e assinado"),
         ent.semCelular && e("p",{key:"sc", className:"rounded-xl bg-[#FEF3C7] px-3 py-2 text-[12px] font-semibold text-[#92400E]"}, "Sua representante está confirmando por você."),
         PASSOS_KN.map(function(meta){
           var n = meta.n, c = (ent.checks||{})[n] || {};
           var botao = n<TOTAL_PASSOS && e("button",{key:"ok", disabled:n>atual || concluida, onClick:function(){ okRev(n); },
             className:"h-11 rounded-xl text-[13.5px] font-bold txt-branco disabled:opacity-40 "+(c.rev ? "bg-[#16A34A]" : "bg-[#C9A13B]")},
             c.rev ? "✓ OK dado. Toque para desfazer" : (c.rep ? "OK, entendi" : "OK, entendi (a representante também dá o dela)"));
           return e(BlocoKN,{key:n, meta:meta, repOk:!!c.rep, revOk:!!c.rev, semCelular:!!ent.semCelular, atual:atual, aberto:abertoEf===n, onToggle:function(){ setAberto(abertoEf===n ? 0 : n); },
             children:[conteudoPasso(n, ctxKN), botao]}); })])) ];

  var inicio = [
    topo,
    e("div",{key:"f"}, folha([resumo,
      e("div",{key:"cat", className:"flex h-11 items-center justify-center gap-2 rounded-xl text-[15px] font-bold shadow "+BRANCO, style:{backgroundImage:"linear-gradient(90deg,#E8B84B,#C9921F)"}}, e(Icon,{n:"send", s:16}), "Compartilhar catálogo"),
      e(Cartao,{key:"k", ic:"box", cor:"#DB2777", t:"Kit novo", sub:temKitNovo ? "Receba seu kit junto com a representante" : "Nenhum kit novo para receber agora", novo:temKitNovo, destaque:temKitNovo, badge:!temKitNovo ? null : ((ent && ent.status==="concluida") ? "recebido" : (ent ? "em andamento" : "1 para receber")), onClick:function(){ setTela("kitnovo"); }}),
      e(Cartao,{key:"c1", ic:"grid", cor:"#2563EB", t:"Catálogos", sub:"Veja e compartilhe as peças", onClick:function(){}}),
      e(Cartao,{key:"c2", ic:"list", cor:"#16A34A", t:"Vendas e Pedidos", sub:"Pedidos e pagamentos", onClick:function(){}}),
      e(Cartao,{key:"c3", ic:"wallet", cor:"#9333EA", t:"Pagamentos", sub:"Gerencie seus pagamentos", onClick:function(){}}),
      e(Cartao,{key:"c4", ic:"users", cor:"#4F46E5", t:"Clientes", sub:"Gerencie seus clientes", onClick:function(){}})]))];

  return e(IPhone15,null, tela==="kitnovo" ? telaKitNovo : inicio);
}

export { RecebimentoRep, AppRevendedora };
