// Sorelly Admin · montagem e bipagem — mobile/revendedora.js
// RecebimentoRep: confirmação de recebimento dos kits na tela da representante.
// AppRevendedora: clone da tela inicial do app real da revendedora (o app de verdade fica nas lojas de aplicativos).
import { LogoChat } from "@/apps/montagem/components/chat/chat-ui";
import { calcularAcerto, modalidadeDe, versaoEfetiva, versaoVigente } from "@/apps/montagem/domain/consignado";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { passoAtual, TOTAL_PASSOS } from "@/apps/montagem/domain/kit-novo-entrega";
import { BK, BKC } from "@/apps/montagem/lib/format";
import { OURO_APP } from "@/apps/montagem/mobile/bipagem";
import { IPhone15 } from "@/apps/montagem/mobile/iphone";
import { MensagensRev } from "@/apps/montagem/mobile/mensagens-rev";
import { listagemDe } from "@/apps/montagem/domain/regras";
import { TelaCatalogoRev } from "@/apps/montagem/mobile/catalogo-rev";
import { TelaLinksRev } from "@/apps/montagem/mobile/links-pagamento-app";
import { TelaGarantiasRev } from "@/apps/montagem/mobile/garantias-rev";
import { TelaCondicionaisRev } from "@/apps/montagem/mobile/condicionais-rev";
import { TelaClientesRev } from "@/apps/montagem/mobile/clientes-rev";
import { TelaMensagensVenderRev } from "@/apps/montagem/mobile/mensagens-vender-rev";
import { TelaIndiqueRev } from "@/apps/montagem/mobile/indique-rev";
import { TelaArtesRev } from "@/apps/montagem/mobile/artes-rev";
import { TelaPreferenciasRev } from "@/apps/montagem/mobile/preferencias-rev";
import { TelaPreferenciasVer } from "@/apps/montagem/mobile/preferencias-ver-rev";
import { TelaAulasRev } from "@/apps/montagem/mobile/aulas-rev";
import { TelaAjudaRev } from "@/apps/montagem/mobile/ajuda-rev";
import { TelaVendasPedidos } from "@/apps/montagem/mobile/vendas-pedidos-rev";
import { cobrancasDaRevendedora, hojeSP, vendidoNoApp } from "@/apps/montagem/domain/link-pagamento";
import { TelaRegrasComissoes } from "@/apps/montagem/mobile/regras-comissoes-app";
import { BlocoKN } from "@/apps/montagem/mobile/kn-bloco";
import { PASSOS_KN, conteudoPasso, dataPrimeiroAcerto } from "@/apps/montagem/mobile/kn-conteudo";
import { Avatar } from "@/apps/montagem/mobile/theme";
import { use } from "@/apps/montagem/state/context";
import { COR_FUNCAO, FUNDO_BARRA } from "@/apps/montagem/mobile/cores-app";
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
// mistura a cor com branco (fundo pastel do cartão, igual ao app da representante)
function claro(hex, p){ var n = parseInt(hex.slice(1),16), r = (n>>16)&255, g = (n>>8)&255, b = n&255, m = function(c){ return Math.round(c+(255-c)*(1-p)); };
  return "#"+[m(r),m(g),m(b)].map(function(x){ return x.toString(16).padStart(2,"0"); }).join(""); }
function Cartao(p){
  return e("button",{onClick:p.onClick, style:{background:FUNDO_BARRA}, className:"flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left shadow-sm active:scale-[.99]"},
    e("span",{className:"grid size-8 shrink-0 place-items-center rounded-lg", style:{background:p.cor+"1F", color:p.cor}}, e(Icon,{n:p.ic, s:16, peso:"fill"})),
    e("span",{className:"min-w-0 flex-1"},
      e("b",{className:"flex items-center gap-2 text-[13px] leading-tight text-[#111827]"}, e("span",{className:"shrink-0 whitespace-nowrap"}, p.t), p.badge && e("span",{className:"ml-auto whitespace-nowrap rounded-full bg-[#DB2777] px-1.5 py-px text-[9.5px] font-black "+BRANCO}, p.badge), p.novo && !p.badge && e("span",{className:"rounded-full bg-[#C9A13B] px-1.5 py-px text-[9px] font-black uppercase "+BRANCO}, "novo")),
      e("span",{className:"block truncate whitespace-nowrap text-[11px] leading-tight text-[#6B7280]"}, p.sub)),
    e(Icon,{n:"chevron", s:13, className:"shrink-0 text-[#9CA3AF]"}));
}
function AppRevendedora(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = p.k;
  var ts = useState(function(){ var t = window.__revTelaIni; window.__revTelaIni = null; return t || "inicio"; }), tela = ts[0], setTela = ts[1];   // atalho do admin (Preferências do kit) abre direto numa tela
  var ab = useState(null), aberto = ab[0], setAberto = ab[1];
  var vig = versaoVigente(s), mod = modalidadeDe(s, k.rev), perfil = (s.perfisRev||{})[k.rev] || {};
  var versao = vig ? versaoEfetiva(vig, mod) : null;
  var total = ((k.vendas||[])[0] || 0) + (s.lp ? vendidoNoApp(s.lp, k.rev, hojeSP().slice(0, 7)) : 0);   // vendido do mês + vendas feitas no app
  var res = versao ? calcularAcerto({vendaBruta:total, devolvida:0, garantia:0, vez:0, valorPago:null, atrasoDias:0}, versao) : null;
  var metaMin = versao ? Math.min.apply(null, versao.faixas.filter(function(f){ return f.pct>0; }).map(function(f){ return f.min; }).concat([Infinity])) : 0;
  var faixasCom = versao ? versao.faixas.filter(function(f){ return f.pct>0; }).sort(function(a, b){ return a.min-b.min; }) : [];
  var faixaAtual = faixasCom.filter(function(f){ return total>=f.min; }).pop() || null, faixaProx = faixasCom.filter(function(f){ return total<f.min && f.pct>(faixaAtual ? faixaAtual.pct : 0); })[0] || null;   // o objetivo é a PRÓXIMA comissão maior
  // barra: de onde ela está até o próximo degrau (antes da 1ª comissão, do zero até a meta mínima)
  var pctBarra = faixaProx ? Math.round((total-(faixaAtual ? faixaAtual.min : 0))/(faixaProx.min-(faixaAtual ? faixaAtual.min : 0))*100) : 100;
  var textoMeta = !faixaAtual ? ["Sua meta é ", e("b",{key:"m", className:"text-[#E8B84B]"}, BKC(metaMin===Infinity ? 0 : metaMin)), " em vendas para começar a ganhar comissão e brindes!"]
    : faixaProx ? ["Próxima comissão: ", e("b",{key:"p", className:"text-[#E8B84B]"}, faixaProx.pct+"%"), " a partir de ", e("b",{key:"m", className:"text-[#E8B84B]"}, BKC(faixaProx.min)), " · faltam ", e("b",{key:"f", className:"text-[#E8B84B]"}, BKC(Math.max(0, Math.round((faixaProx.min-total)*100)/100)))]
    : ["Você está na maior comissão: ", e("b",{key:"p", className:"text-[#E8B84B]"}, faixaAtual.pct+"%"), "!"];
  var pecas = Math.round(total/110);
  var dataAcerto = perfil.dataAcerto ? perfil.dataAcerto.split("-").reverse().join("/") : "—";
  var cobrancas = s.lp ? cobrancasDaRevendedora(s.lp, k.rev, hojeSP()) : [];   // pagamentos combinados que vencem hoje ou já venceram
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
  var topo = e("div",{key:"t", className:"relative -mx-4 -mt-2 overflow-hidden rounded-b-[22px] bg-[#0B0B0D] px-5 pb-1.5 pt-3 "+BRANCO, style:{paddingBottom:"10px", marginBottom:"8px"}},   // o tema do app põe 18px/14px no primeiro bloco: aqui fica bem junto do Total vendido
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
    e("div",{className:"relative mt-1.5 flex items-center justify-between"},
      e("div",{className:"flex items-center gap-1.5"}, brasao(20),
        e("div",null, e("p",{className:"text-[9px] font-black uppercase tracking-wider text-[#E8B84B]"},"Nível atual"), e("b",{className:"text-[14px] leading-none"},"Bronze"))),
      e("div",{className:"flex items-center gap-1.5 text-right"},
        e("div",null, e("p",{className:"text-[9px] opacity-60"},"Próximo nível"), e("b",{className:"text-[12px] leading-none"},"Bronze")), brasao(17))),
    e("div",{className:"relative mt-1.5 h-1 rounded-full bg-[#3A3A3F]"}, e("span",{className:"block h-full rounded-full bg-[#E8B84B]", style:{width:Math.max(4, Math.min(100, pctBarra))+"%"}})),
    e("p",{className:"relative mt-1.5 rounded-lg bg-[#2A2A2E] px-2.5 py-1 text-[10px] leading-tight"}, textoMeta),
    e("div",{className:"relative mt-1.5 grid grid-cols-3 gap-1.5"},
      [{lb:"Vendido", v:BKC(total), ic:"grafico", cor:"#F3D8A0"}, {lb:"Acerto", v:BKC(res ? res.valorAcerto : 0), ic:"wallet", cor:"#C6DFF8", dica:"Acerto previsto"+(dataAcerto==="—" ? "" : " para "+dataAcerto)}, {lb:"Comissão", v:BKC(res ? res.comissao : 0), ic:"coins", cor:"#C1EDD1"}].map(function(m){
        return e("div",{key:m.lb, title:m.dica, className:"flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5", style:{background:"rgba(255,255,255,.08)"}},
          e("span",{className:"flex max-w-full items-center gap-1", style:{color:m.cor}}, e(Icon,{n:m.ic, s:11, peso:"fill"}), e("b",{className:"truncate whitespace-nowrap text-[10px] font-semibold "+BRANCO}, m.lb)),
          e("span",{className:MONO+" whitespace-nowrap text-[12.5px] font-extrabold text-amber-200"}, m.v)); })));

  var resumo = e("div",{className:"overflow-hidden rounded-2xl bg-white ring-1 ring-[#E5E7EB]"},
    e("div",{className:"grid grid-cols-2 divide-x divide-[#E5E7EB]"},
      e("div",{className:"flex flex-col items-center gap-0.5 px-2 py-1.5"}, e("span",{className:"text-[10.5px] font-semibold uppercase tracking-wide text-[#6B7280]"},"Total vendido"),
        e("b",{className:"text-[17px] text-[#111827]"}, BKC(total)), e("span",{className:"rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#15803D]"}, pecas+" peças vendidas")),
      e("div",{className:"flex flex-col items-center gap-0.5 px-2 py-1.5"}, e("span",{className:"text-[10.5px] font-semibold uppercase tracking-wide text-[#6B7280]"},"Acerto previsto ⓘ"),
        e("b",{className:"text-[17px] text-[#111827]"}, BKC(res ? res.valorAcerto : 0)), e("span",{className:"rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#374151]"}, dataAcerto))),
    e("div",{className:"flex flex-col items-center gap-1 border-t border-[#E5E7EB] px-2 py-1.5", style:{background:"linear-gradient(180deg,#FFFBEF,#FFFFFF)"}},
      e("span",{className:"flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#6B7280]"},"Valor da comissão", e("span",{className:"rounded-full bg-[#C9A13B] px-2 py-0.5 text-[11px] font-black "+BRANCO}, (res ? res.comissaoPct : 0)+"%")),
      e("b",{className:"text-[24px] font-black leading-none text-[#B8862B]"}, BKC(res ? res.comissao : 0)),
      e("div",{className:"flex gap-1.5"},
        e("span",{className:"rounded-lg bg-[#F3F4F6] px-2.5 py-0.5 text-[11px] font-semibold text-[#111827]"},"Regras & Comissões"),
        e("span",{className:"rounded-lg bg-[#F3F4F6] px-2.5 py-0.5 text-[11px] font-semibold text-[#111827]"},"Indicações"))));

  var folha = function(filhos){ return e("div",{className:"-mx-4 -mb-10 flex min-h-[calc(100%-3.5rem)] flex-col gap-2 bg-white px-4 pb-10 pt-0.5"}, filhos); };
  // Entrega do kit novo feita JUNTO com a representante: a representante inicia no app dela; cada etapa só libera a próxima com o OK das duas
  var temKitNovo = (k.tipoKit||"").indexOf("kit_novo")===0 || !!k.demoKitNovo;   // só quem tem um kit novo para receber vê o aviso
  var ent = (s.entregasKN||{})[k.id], atual = passoAtual(ent), concluida = !!ent && ent.status==="concluida";
  var kitNovoPendente = temKitNovo && !concluida;   // tem kit novo para receber e ainda não assinou: vendas bloqueadas
  var av = useState(""), aviso = av[0], setAviso = av[1];
  var avisa = function(){ setAviso("Receba o kit novo para liberar as vendas."); setTimeout(function(){ setAviso(""); }, 2500); };
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

  // revendedora do atendimento interno (representante "Sorelly"): avalia o atendimento e marca quantas vezes errou a contagem das peças (conta para o bônus de quem bipou)
  var itInt = k.interno ? (s.internos||[]).find(function(x){ return x.id===k.internoId; }) : null, avI = (itInt && itInt.avaliacao) || {};
  var nt = useState(avI.nota || 0), nota = nt[0], setNota = nt[1], er = useState(avI.erros || 0), erros = er[0], setErros = er[1];
  var blocoAval = k.interno && e("div",{key:"av", className:"flex flex-col gap-2 rounded-2xl bg-[#FFF7E0] p-3 ring-1 ring-[#E8D9A8]"},
    e("b",{className:"text-[14px] text-[#5B4A1E]"}, "Avalie o seu atendimento na Sorelly"),
    e("div",{className:"flex justify-center gap-1.5"}, [1,2,3,4,5].map(function(n){ return e("button",{key:n, onClick:function(){ setNota(n); }, "aria-label":n+" estrelas", className:"text-[26px] leading-none "+(n<=nota ? "text-[#E8A317]" : "text-[#D1D5DB]")}, "★"); })),
    e("div",{className:"flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2"},
      e("span",{className:"text-[12.5px] font-semibold text-[#374151]"}, "Quantas vezes errou a contagem das peças?"),
      e("span",{className:"flex items-center gap-2"}, e("button",{onClick:function(){ setErros(Math.max(0, erros-1)); }, className:"grid size-8 place-items-center rounded-full bg-[#F3F4F6] text-[18px] font-bold text-[#111827]"}, "−"), e("b",{className:"w-5 text-center text-[16px] text-[#111827]"}, erros), e("button",{onClick:function(){ setErros(erros+1); }, className:"grid size-8 place-items-center rounded-full bg-[#F3F4F6] text-[18px] font-bold text-[#111827]"}, "+"))),
    e("button",{disabled:!nota, onClick:function(){ d({type:"INT_AVALIAR", id:k.internoId, nota:nota, erros:erros}); }, className:"h-10 rounded-xl text-[13.5px] font-bold disabled:opacity-40 "+BRANCO, style:{background:"#C9A13B"}}, avI.nota ? "✓ Avaliação enviada. Toque para atualizar" : "Enviar avaliação"));
  var lkAbertos = ((s.lp && s.lp.solicitacoes) || []).filter(function(x){ return x.canal==="app" && x.revendedora===k.rev && (x.status==="solicitado" || x.status==="gerado"); }).length;
  var inicio = [
    topo,
    e("div",{key:"f"}, folha([blocoAval,
      // Ordem (Marcus, 29/10/2026): Visualizar catálogo em cima de tudo, depois SorellyChat e, logo abaixo, Kit novo.
      e("button",{key:"cat", onClick:function(){ setTela("catalogo"); }, className:"flex h-9 items-center justify-center gap-2 rounded-xl text-[13px] font-bold shadow active:scale-[.99] "+BRANCO, style:{backgroundImage:"linear-gradient(90deg,#E8B84B,#C9921F)"}}, e(Icon,{n:"grid", s:15}), "Visualizar catálogo"),
      e("button",{key:"zap", onClick:function(){ setTela("whats"); }, className:"flex w-full items-center gap-2 rounded-xl bg-[#F6EBCB] px-2 py-1.5 text-left shadow-sm"},
        e("span",{className:"grid size-8 shrink-0 place-items-center rounded-lg bg-[#24180a]"}, e(LogoChat,{s:22})),
        e("span",{className:"min-w-0 flex-1"}, e("b",{className:"block text-[13px] leading-tight text-[#5B4A1E]"}, "SorellyChat"), e("span",{className:"block truncate whitespace-nowrap text-[11px] leading-tight text-[#7A6730]"}, "Fale com a representante e com a Sorelly"))),
      // Kit novo: só aparece até ser recebido (assinado); depois some e só volta quando ela ficar sem kit de novo. Enquanto não for recebido, as vendas ficam bloqueadas.
      kitNovoPendente && e(Cartao,{key:"k", ic:"box", cor:"#DB2777", t:"Kit novo", sub:"Receba o kit para liberar as vendas", destaque:true, badge:ent ? "em andamento" : "1 para receber", onClick:function(){ setTela("kitnovo"); }}),
      aviso && e("p",{key:"av", className:"rounded-lg bg-[#FEF3C7] px-2.5 py-1.5 text-center text-[12px] font-semibold text-[#92400E]"}, aviso),
      // Ordem (Marcus, 29/10/2026): catálogo, Kit novo, SorellyChat, Vendas e Pedidos, depois o dia a dia (link, pagamentos, clientes, condicionais, garantias), divulgação e, no fim, regras e ajuda.
      // O cartão "Cobranças" saiu: as cobranças ficam dentro de Pagamentos.
      e(Cartao,{key:"c2", ic:"list", cor:"#16A34A", t:"Vendas e Pedidos", sub:"Pedidos e pagamentos", badge:kitNovoPendente ? "bloqueado" : null, onClick:function(){ if(kitNovoPendente) avisa(); else setTela("vendas"); }}),
      e(Cartao,{key:"lk", ic:"wallet", cor:"#0891B2", t:"Link de pagamento", sub:"Cobre a cliente no cartão", novo:!kitNovoPendente, badge:kitNovoPendente ? "bloqueado" : (lkAbertos>0 ? lkAbertos+" em andamento" : null), onClick:function(){ if(kitNovoPendente) avisa(); else setTela("links"); }}),
      e(Cartao,{key:"c3", ic:"wallet", cor:"#9333EA", t:"Pagamentos", sub:cobrancas.length>0 ? cobrancas.length+(cobrancas.length===1 ? " pagamento para cobrar" : " pagamentos para cobrar") : "Gerencie seus pagamentos", badge:cobrancas.length>0 ? cobrancas.length+" hoje" : null, onClick:function(){ if(kitNovoPendente) avisa(); else setTela("vendas"); }}),
      e(Cartao,{key:"c4", ic:"users", cor:"#4F46E5", t:"Clientes", sub:"Gerencie seus clientes", onClick:function(){ setTela("clientes"); }}),
      e(Cartao,{key:"c6", ic:"maleta", cor:COR_FUNCAO.condicionais, t:"Condicionais", sub:"Gerencie seus kits", onClick:function(){ setTela("condicionais"); }}),
      e(Cartao,{key:"c5", ic:"escudo", cor:"#D97706", t:"Garantias", sub:"Gerencie suas garantias", onClick:function(){ setTela("garantias"); }}),
      e(Cartao,{key:"c7", ic:"whats", cor:"#2563EB", t:"Mensagens para vender", sub:"Modelos prontos para enviar", onClick:function(){ setTela("mensagens"); }}),
      e(Cartao,{key:"c9", ic:"grid", cor:"#A21CAF", t:"Artes & Criativos", sub:"Baixe artes para divulgar", onClick:function(){ setTela("artes"); }}),
      e(Cartao,{key:"c10", ic:"gem", cor:"#DB2777", t:"Preferências do kit", sub:"Consolidado do kit ideal", onClick:function(){ setTela("preferencias"); }}),
      e(Cartao,{key:"c8", ic:"presente", cor:"#EAB308", t:"Indique & Ganhe", sub:"Ganhe prêmios indicando", onClick:function(){ setTela("indique"); }}),
      e(Cartao,{key:"rc", ic:"book", cor:"#B8862B", t:"Regras e comissões", sub:"Tabela, brindes, taxas e multas", onClick:function(){ setTela("regrascom"); }}),
      e(Cartao,{key:"c11", ic:"play", cor:"#DC2626", t:"Aulas sobre o aplicativo", sub:"Aprenda a usar o app", onClick:function(){ setTela("aulas"); }}),
      e(Cartao,{key:"c12", ic:"inbox", cor:"#6B7280", t:"Central de Ajuda", sub:"Suporte e tutoriais", onClick:function(){ setTela("ajuda"); }})]))];

  return e(IPhone15,{semIndicador:tela==="catalogo"}, tela==="regrascom" ? e(TelaRegrasComissoes,{publico:"revendedora", onVoltar:function(){ setTela("inicio"); }}) : tela==="kitnovo" ? telaKitNovo : tela==="catalogo" ? e(TelaCatalogoRev,{k:k, bloqueado:kitNovoPendente, onVoltar:function(){ setTela("inicio"); }}) : tela==="vendas" ? e(TelaVendasPedidos,{k:k, onVoltar:function(){ setTela("inicio"); }}) : tela==="garantias" ? e(TelaGarantiasRev,{k:k, onVoltar:function(){ setTela("inicio"); }}) : tela==="condicionais" ? e(TelaCondicionaisRev,{k:k, onVoltar:function(){ setTela("inicio"); }}) : tela==="clientes" ? e(TelaClientesRev,{k:k, onVoltar:function(){ setTela("inicio"); }}) : tela==="mensagens" ? e(TelaMensagensVenderRev,{k:k, onVoltar:function(){ setTela("inicio"); }}) : tela==="indique" ? e(TelaIndiqueRev,{k:k, onVoltar:function(){ setTela("inicio"); }}) : tela==="artes" ? e(TelaArtesRev,{k:k, onVoltar:function(){ setTela("inicio"); }}) : tela==="preferencias" ? e(TelaPreferenciasVer,{k:k, onVoltar:function(){ setTela("inicio"); }, onEditar:function(){ setTela("prefs_editar"); }}) : tela==="prefs_editar" ? e(TelaPreferenciasRev,{k:k, onVoltar:function(){ setTela("preferencias"); }}) : tela==="aulas" ? e(TelaAulasRev,{k:k, onVoltar:function(){ setTela("inicio"); }}) : tela==="ajuda" ? e(TelaAjudaRev,{k:k, onVoltar:function(){ setTela("inicio"); }, onChat:function(){ setTela("whats"); }, onAulas:function(){ setTela("aulas"); }}) : tela==="links" ? e(TelaLinksRev,{k:k, onVoltar:function(){ setTela("inicio"); }}) : tela==="whats" ? e(MensagensRev,{nome:k.rev, rep:k.rep || listagemDe(s,k).rep, onInicio:function(){ setTela("inicio"); }}) : inicio);
}

export { RecebimentoRep, AppRevendedora };
