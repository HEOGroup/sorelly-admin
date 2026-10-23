// Sorelly Admin · montagem — mobile/links-pagamento-app.js
// Link de pagamento nos apps de celular (19/10/2026; regras em LINK-DE-PAGAMENTO.md, lógica em domain/link-pagamento.js):
//  · TelaLinksRev: app da REVENDEDORA — botão "Solicitar link" (valor + parcelas) e "Meus links" com o andamento de cada pedido.
//  · LinksDoAcerto: app da REPRESENTANTE — mostra os links PAGOS da revendedora (botão "Usar como pagamento" lança a linha no acerto) e avisa dos cancelados/com erro.
// Dados reais ficam no estado s.lp (nunca neste arquivo). Estilo do app: cartões brancos, cores sólidas, sem degradê.
import { BANDEIRAS, agoraSP, hojeSP, formatarDia, formatarDataHora, formatarReais, linksDaRevendedora, linksParaAcerto, meioDe, nomeMeio, parcelasPermitidas, situacaoParaRevendedora, textoFaixas, validarSolicitacao } from "@/apps/montagem/domain/link-pagamento";
import { listagemDe } from "@/apps/montagem/domain/regras";
import { CampoDinheiro } from "@/apps/montagem/mobile/campos";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useEffect, useState } from "@/shared/react";

var TOM = {espera:["#FEF3C7", "#B45309"], info:["#DBEAFE", "#1D4ED8"], ok:["#DCFCE7", "#15803D"], ruim:["#FEE2E2", "#B91C1C"], neutro:["#F3F4F6", "#374151"]};
var ETAPAS = ["Solicitado", "Link pronto", "Pago"];
var BR = "txt-branco";

function copiar(txt){ try{ if(navigator.clipboard) navigator.clipboard.writeText(txt); }catch(x){} }

// uma linha de andamento (3 bolinhas): solicitado → link pronto → pago
function Andamento(p){
  var alcancou = p.etapa===0 ? 1 : p.etapa===1 ? 2 : 3, corFinal = {ok:"#16A34A", espera:"#F59E0B", info:"#2563EB", ruim:"#DC2626", neutro:"#9CA3AF"}[p.tom];
  return e("div",{className:"flex items-center gap-1"}, ETAPAS.map(function(nome, i){
    var cor = i<alcancou-1 ? "#16A34A" : i===alcancou-1 ? corFinal : "#D1D5DB";
    return e("div",{key:nome, className:"flex flex-1 flex-col items-center gap-0.5"},
      e("span",{className:"h-1.5 w-full rounded-full", style:{background:cor}}),
      e("span",{className:"text-[9.5px] font-semibold", style:{color:i<alcancou ? "#374151" : "#9CA3AF"}}, nome)); }));
}

function CartaoLink(p){
  var x = p.x, s = p.s, sit = situacaoParaRevendedora(x, p.agora), t = TOM[sit.tom], n = x.parcelas || 1, m = meioDe(s, x.meioId), pronto = x.status==="gerado" && sit.titulo==="Link pronto";
  var cs = useState(false), copiado = cs[0], setCopiado = cs[1];
  return e("div",{className:"flex flex-col gap-1.5 rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-[#E5E7EB]"},
    e("div",{className:"flex items-start justify-between gap-2"},
      e("div",{className:"min-w-0"}, e("b",{className:"block text-[16px] leading-tight text-[#111827]"}, formatarReais(x.valor)+(x.cliente ? " · "+x.cliente : "")), e("span",{className:"text-[11.5px] text-[#6B7280]"}, n+"x de "+formatarReais(Math.round(x.valor/n*100)/100)+" · "+formatarDataHora(x.criadoEm))),
      e("span",{className:"shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold", style:{background:t[0], color:t[1]}}, sit.titulo)),
    e(Andamento,{etapa:sit.etapa, tom:sit.tom}),
    e("p",{className:"text-[12px] leading-snug text-[#374151]"}, sit.detalhe),
    pronto && (x.linkUrl
      ? e("div",{className:"flex items-center gap-1.5 rounded-lg bg-[#EFF6FF] p-1.5"},
          e("span",{className:"min-w-0 flex-1 truncate text-[11.5px] font-semibold text-[#1D4ED8]"}, x.linkUrl),
          e("button",{onClick:function(){ copiar(x.linkUrl); setCopiado(true); setTimeout(function(){ setCopiado(false); }, 2000); }, className:"flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[#1D4ED8] px-2.5 text-[12px] font-bold "+BR}, e(Icon,{n:"copiar", s:13}), copiado ? "Copiado" : "Copiar"))
      : e("p",{className:"rounded-lg bg-[#F3F4F6] px-2 py-1 text-[11.5px] text-[#6B7280]"}, "O endereço do link aparece aqui assim que a Sorelly enviar.")),
    m && x.status!=="solicitado" && e("span",{className:"text-[10.5px] text-[#9CA3AF]"}, nomeMeio(m)));
}

// Tela "Link de pagamento" do app da revendedora. k = kit/cadastro da revendedora logada; onVoltar volta à tela inicial.
function TelaLinksRev(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = p.k, lp = s.lp, cfg = lp.config;
  var vs = useState(null), valor = vs[0], setValor = vs[1], bd = useState(""), bandeira = bd[0], setBandeira = bd[1], cn = useState(""), cliente = cn[0], setCliente = cn[1], ps = useState(1), parc = ps[0], setParc = ps[1], en = useState(""), enviado = en[0], setEnviado = en[1];
  var tk = useState(0), setTick = tk[1];
  useEffect(function(){ var t = setInterval(function(){ setTick(function(n){ return n+1; }); }, 30000); return function(){ clearInterval(t); }; }, []);
  var perfil = (s.perfisRev||{})[k.rev] || {}, hoje = hojeSP(), agora = agoraSP();
  var rep = k.interno ? "" : (k.rep || (listagemDe(s, k) || {}).rep || "");
  var dataAcerto = /^\d{4}-\d{2}-\d{2}$/.test(perfil.dataAcerto || "") && perfil.dataAcerto>=hoje ? perfil.dataAcerto : "";
  var permitidas = valor ? parcelasPermitidas(cfg, valor) : cfg.maxParcelasSemJuros;
  if(valor && parc>permitidas) parc = permitidas;   // o valor mudou e a escolha anterior deixou de valer: usa o maior permitido
  var dados = {revendedora:k.rev, canal:"app", valor:valor||0, parcelas:parc, representante:rep, dataAcerto:dataAcerto, emissor:"atendimento", semMeio:true, bandeira:bandeira, cliente:cliente.trim()};
  var recusa = valor ? validarSolicitacao(s, dados, agora) : "";
  var lista = linksDaRevendedora(s, k.rev), maxP = cfg.maxParcelasSemJuros, parcs = []; for(var i = 1; i<=maxP; i++) parcs.push(i);
  var enviar = function(){
    if(!valor || recusa) return;
    d(Object.assign({type:"LP", op:"sol_criar", por:k.rev+" (app)"}, dados));
    setEnviado("Pedido enviado! Acompanhe abaixo em \"Meus links\"."); setValor(null); setParc(1); setBandeira(""); setCliente(""); setTimeout(function(){ setEnviado(""); }, 6000);
  };
  var cabeca = e("div",{key:"h", className:"flex items-center gap-2 "+BR},
    e("button",{onClick:p.onVoltar, "aria-label":"Voltar", className:"grid size-8 place-items-center rounded-full bg-[#2A2A2E]"}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
    e("b",{className:"text-[16px]"}, "Link de pagamento"));
  var form = e("div",{key:"f", className:"flex flex-col gap-2 rounded-2xl bg-[#FFF7E0] p-3 ring-1 ring-[#E8D9A8]"},
    e("b",{className:"text-[14px] text-[#5B4A1E]"}, "Solicitar link de pagamento"),
    e("p",{className:"text-[12px] leading-snug text-[#7A6730]"}, "Para a sua cliente pagar no cartão de crédito, sem juros. O valor pago entra como pagamento no seu acerto."),
    e(CampoDinheiro,{value:valor, label:"Valor do link", onChange:setValor, className:"h-12 w-full rounded-xl bg-white px-3 text-left text-[18px] font-bold text-[#111827] outline-none ring-1 ring-[#E8D9A8]"}),
    e("div",{className:"grid grid-cols-5 gap-1"}, parcs.map(function(n){ var ok = !valor || n<=parcelasPermitidas(cfg, valor);
      return e("button",{key:n, disabled:!ok, onClick:function(){ setParc(n); }, className:"h-9 rounded-lg text-[13px] font-bold disabled:opacity-35 "+(parc===n ? "bg-[#C9A13B] "+BR : "bg-white text-[#374151] ring-1 ring-[#E8D9A8]")}, n+"x"); })),
    e("span",{className:"text-[12px] font-semibold text-[#5B4A1E]"}, "Bandeira do cartão"),
    e("div",{className:"grid grid-cols-3 gap-1"}, BANDEIRAS.map(function(b){ return e("button",{key:b, onClick:function(){ setBandeira(b); }, className:"h-9 rounded-lg text-[12.5px] font-bold "+(bandeira===b ? "bg-[#C9A13B] "+BR : "bg-white text-[#374151] ring-1 ring-[#E8D9A8]")}, b); })),
    e("input",{value:cliente, maxLength:30, onChange:function(ev){ setCliente(ev.target.value); }, placeholder:"Nome da cliente (opcional)", "aria-label":"Nome da cliente, opcional", className:"h-11 w-full rounded-xl bg-white px-3 text-[14px] text-[#111827] outline-none ring-1 ring-[#E8D9A8]"}),
    valor>0 && e("p",{className:"text-center text-[13px] font-semibold text-[#5B4A1E]"}, parc+"x de "+formatarReais(Math.round(valor/parc*100)/100)+" sem juros"),
    recusa && e("p",{className:"rounded-lg px-2.5 py-1.5 text-[12px] font-semibold "+(/bandeira/.test(recusa) ? "bg-[#FEF3C7] text-[#92400E]" : "bg-[#FEE2E2] text-[#B91C1C]")}, recusa),   // faltar a bandeira é uma dica (amarelo), não um erro (vermelho)
    enviado && e("p",{className:"rounded-lg bg-[#DCFCE7] px-2.5 py-1.5 text-[12px] font-bold text-[#15803D]"}, enviado),
    e("button",{disabled:!valor || !!recusa || !bandeira, onClick:enviar, className:"flex h-11 items-center justify-center gap-2 rounded-xl text-[14px] font-bold disabled:opacity-40 "+BR, style:{background:"#C9A13B"}}, e(Icon,{n:"send", s:15}), "Solicitar link"),
    e("p",{className:"text-center text-[11px] leading-snug text-[#7A6730]"}, "Mínimo "+formatarReais(cfg.minimo)+" · parcela mínima "+formatarReais(cfg.parcelaMinima)+" · o link vale "+cfg.validadeHoras+" h · até "+cfg.tentativasDia+" pedidos por dia. Atendimento em horário comercial."),
    e("div",{className:"flex flex-col gap-0.5 rounded-lg bg-white/70 p-2"}, textoFaixas(cfg).map(function(f){ return e("div",{key:f[0], className:"flex items-center justify-between text-[11.5px] text-[#5B4A1E]"}, e("span",null, f[0]), e("b",null, f[1])); })));
  var meus = e("div",{key:"m", className:"flex flex-col gap-2"},
    e("p",{className:"px-1 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]"}, "Meus links · "+lista.length),
    lista.length===0 ? e("p",{className:"rounded-xl bg-white p-4 text-center text-[13px] text-[#6B7280] ring-1 ring-[#E5E7EB]"}, "Você ainda não solicitou nenhum link.")
      : lista.slice(0, 12).map(function(x){ return e(CartaoLink,{key:x.id, x:x, s:s, agora:agora}); }));
  return [cabeca, e("div",{key:"c"}, e("div",{className:"-mx-4 -mb-10 flex min-h-[calc(100%-3.5rem)] flex-col gap-2 bg-white px-4 pb-10 pt-3"}, [form, meus]))];
}

// Bloco da calculadora de acertos da representante. rev = nome da revendedora; usados = pagamentos já lançados (para não repetir); falta = quanto ainda falta pagar;
// formasLink = descrições da forma "link" (ex.: "LINK - SICREDI - SERENITY - 59"); onUsar(linha) acrescenta o pagamento ao acerto.
function LinksDoAcerto(p){
  var s = use().state, lp = s.lp; if(!lp) return null;
  var info = linksParaAcerto(s, p.rev), jaNoAcerto = {}; (p.pagamentos || []).forEach(function(x){ if(x.linkSolId) jaNoAcerto[x.linkSolId] = 1; });
  var pagos = info.pagos.filter(function(x){ return !jaNoAcerto[x.sol.id]; });
  if(!pagos.length && !info.avisos.length && !info.aguardando.length) return null;
  var contaDe = function(sol){
    var m = meioDe(s, sol.meioId), lista = p.formasLink || [], dsc = m && m.cnpjId ? lista.find(function(c){ return String(c).replace(/\s+/g, " ").endsWith(" - "+m.cnpjId); }) : null;
    return dsc || (lista.length===1 ? lista[0] : (m ? m.nome : "")); };
  var usar = function(x){
    var sol = x.sol, valor = Math.min(sol.valor, Math.round(Math.max(0, p.falta||0)*100)/100), conta = contaDe(sol);
    if(!(valor>0)) return;
    p.onUsar({forma:"link", descricao:conta, parcelas:sol.parcelas || 1, data:sol.pagoEm ? String(sol.pagoEm).slice(0, 10) : hojeSP(), valor:valor, anexo:null, linkSolId:sol.id, jaPagoLink:true}); };
  var linha = function(k, bg, cor, ic, txt, sub, acao){
    return e("div",{key:k, className:"flex items-center gap-2 rounded-lg px-2.5 py-1.5", style:{background:bg}},
      e("span",{className:"shrink-0", style:{color:cor}}, e(Icon,{n:ic, s:15})),
      e("div",{className:"min-w-0 flex-1"}, e("p",{className:"text-[12.5px] font-semibold leading-tight", style:{color:cor}}, txt), sub && e("p",{className:"text-[11px] leading-tight text-[#B5B5BA]"}, sub)), acao); };
  return e("div",{className:"flex flex-col gap-1.5 rounded-xl bg-white/5 p-2.5 ring-1 ring-emerald-400/25"},
    e("p",{className:"text-[12px] font-bold uppercase tracking-wide text-emerald-300"}, "Links de pagamento da revendedora"),
    pagos.map(function(x){ var sol = x.sol, sobra = Math.max(0, sol.valor-Math.max(0, p.falta||0));
      return linha(sol.id, "rgba(16,185,129,.12)", "#6EE7B7", "check", "Pago por link · "+formatarReais(sol.valor)+(sol.parcelas>1 ? " em "+sol.parcelas+"x" : ""),
        "Pago em "+formatarDia(sol.pagoEm)+(x.usavel ? "" : " · pago hoje: conta só no próximo acerto")+(x.usavel && sobra>0 ? " · sobram "+formatarReais(sobra)+" de crédito" : ""),
        x.usavel && e("button",{disabled:!(p.falta>0), onClick:function(){ usar(x); }, className:"h-8 shrink-0 rounded-lg bg-emerald-500 px-2.5 text-[11.5px] font-bold text-white disabled:opacity-40"}, "Usar como pagamento")); }),
    info.avisos.map(function(x){ var sit = situacaoParaRevendedora(x);
      return linha(x.id, "rgba(239,68,68,.12)", "#FCA5A5", "alert", "Link: "+sit.titulo+" · não conta · "+formatarReais(x.valor), formatarDia(x.criadoEm)+" · "+sit.detalhe); }),
    info.aguardando.map(function(x){ var sit = situacaoParaRevendedora(x);
      return linha(x.id, "rgba(251,191,36,.10)", "#FCD34D", "clock", "Link aguardando pagamento · "+formatarReais(x.valor), "Ainda não pago: só conta depois de pago."); }),
    e("p",{className:"text-[10.5px] leading-snug text-[#8E8E93]"}, "Só valem links emitidos e pagos até o dia anterior ao acerto. O valor não é devolvido em dinheiro: o que passar do acerto vira crédito."));
}

export { TelaLinksRev, LinksDoAcerto };
