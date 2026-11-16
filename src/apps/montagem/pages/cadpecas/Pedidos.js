// Sorelly Admin · montagem — pages/cadpecas/Pedidos.js
// Cadastro de peças → "Pedidos" (layout escolhido pelo Marcus em 03/11/2026, "opção 4 com fases"): quadro com as 12 etapas em 3 fases (Compra, Banho, Empresa), colunas finas que rolam para o lado, zoom no topo e cartão que abre.
// Sem faixa de totais e filtro numa linha só (regras de 02/11/2026). Também tem a Planilha (uma linha por pedido).
// Etapas e status: o status do pedido é o nome da etapa (regras em domain/cadastro-pecas.js: ETAPAS_PED, FASES_PED, etapaPed, statusDaEtapa). O pedido fecha no romaneio.
// Quem lança: Rayssa e Graziella (config.quem.pedidos_bruto); a diretoria sempre pode. "Enviado para Sorelly" entra sozinho quando uma fatura de banho é ligada ao pedido.
// Editar chegadas, valores e peças por categoria: botão "Abrir ficha" dentro do cartão (ou clique na linha da planilha).
import { Janela, Pagina } from "@/apps/montagem/components/padrao";
import { Botao, Segmentado, brl } from "@/apps/montagem/components/padrao-fin";
import { hojeSP } from "@/apps/montagem/domain/cadastro-leads";
import { CATS, ETAPAS_PED, FASES_PED, STATUS_PED, atrasadoPed, banhoPed, diasNaEtapa, diasNaGalvanica, etapaPed, fasePed, mesesCpc, naGalvanica, romaneioCompleto, banhoCompleto, totalPed, ultimosMeses, resumoCompras, pecasPedido, podeFazer, prazoEtapa, statusDaEtapa, parcialPed } from "@/apps/montagem/domain/cadastro-pecas";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { Cel, useCpc } from "@/apps/montagem/pages/cadpecas/visualCad";
import { Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { abrirAnexo, enviarAnexo, lerArquivo } from "@/apps/montagem/lib/anexo";
import { e, useEffect, useRef, useState } from "@/shared/react";

var CAMPO = "h-8 rounded-md border border-border bg-card px-2.5 text-center text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-primary";
var INP = "w-full "+CAMPO;
var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
var VAZIO_F = {q:"", forn:"", banho:"", sit:""};
var COR_FASE = {compra:"#5B8DEF", banho:"#A78BFA", empresa:"#2DD4BF"};
var COR_BANHO = {Pontual:"#E8B84B", Ellos:"#60A5FA"};   // o nome da galvânica em dois tons: Pontual dourado e Ellos azul (Marcus, 03/11/2026)
var NIVEIS_ZOOM = [70, 80, 90, 100, 115, 130, 150];
var CHAVE_ZOOM = "sorelly_pedidos_zoom";
var CHAVE_VAZIAS ="sorelly_pedidos_vazias";   // "0" = colunas sem pedido escondidas; o sistema lembra a escolha neste navegador
function rotuloMes(m){ var p = String(m).split("-"); return p.length===2 ? MESES[+p[1]-1]+" de "+p[0] : "Todos os meses"; }
function cap(t){ return t ? t.charAt(0).toUpperCase()+t.slice(1) : t; }
function dmy(iso){ var p = String(iso||"").split("-"); return p.length===3 ? p[2]+"/"+p[1]+"/"+p[0] : ""; }
function noPeriodo(p, per){ if(!per || per.tipo==="todos") return true; if(per.tipo==="mes") return !per.mes || p.data.slice(0, 7)===per.mes; return (!per.de || p.data>=per.de) && (!per.ate || p.data<=per.ate); }
function dia(iso){ var p = String(iso||"").split("-"); return p.length===3 ? p[2]+"/"+p[1] : "—"; }
function hojeISO(){ return hojeSP(); }
function numPct(t){ return String(t||"").trim()==="" ? 0 : parseFloat(String(t).replace(",", "."))/100 || 0; }
function proxima(p){ var i = ETAPAS_PED.findIndex(function(k){ return k[0]===etapaPed(p); }); return i>=0 && i<ETAPAS_PED.length-1 ? ETAPAS_PED[i+1][0] : null; }
function nomeEtapa(k){ return (ETAPAS_PED.find(function(x){ return x[0]===k; })||[])[1] || k; }
function txtDias(n){ return n+(n===1 ? " dia" : " dias"); }
function lerZoom(){ try { var z = parseInt(window.localStorage.getItem(CHAVE_ZOOM), 10); return NIVEIS_ZOOM.indexOf(z)>=0 ? z : 100; } catch(x){ return 100; } }
function lerVazias(){ try { return window.localStorage.getItem(CHAVE_VAZIAS)!=="0"; } catch(x){ return true; } }
function gravaVazias(v){ try { window.localStorage.setItem(CHAVE_VAZIAS, v ? "1" : "0"); } catch(x){} }
function gravaZoom(z){ try { window.localStorage.setItem(CHAVE_ZOOM, String(z)); } catch(x){} }
function plural(n, um, varios){ return n+" "+(n===1 ? um : varios); }
function semRomaneio(p){ return etapaPed(p)==="fechado" && !romaneioCompleto(p); }   // etapa 3 sem romaneio (número e arquivo): aguarda e não anda
function faltaRomaneio(p){ return !p.romaneio ? "romaneio" : !(p.romaneioArq && p.romaneioArq.key) ? "arquivo" : ""; }   // o que falta, em uma palavra, em vermelho no bloco

// zoom do quadro: menos, porcentagem (volta para 100%) e mais, igual ao dos apps
function Zoom(p){
  var i = NIVEIS_ZOOM.indexOf(p.z), bt = "h-8 w-8 text-[13px] font-bold hover:bg-white/10 disabled:opacity-40";
  return e("div",{role:"group", "aria-label":"Zoom do quadro", className:"flex h-8 items-center overflow-hidden rounded-md border border-border bg-card"},
    e("button",{type:"button", "aria-label":"Diminuir", title:"Diminuir", disabled:i<=0, onClick:function(){ p.set(NIVEIS_ZOOM[i-1]); }, className:bt}, "−"),
    e("button",{type:"button", title:"Voltar para 100%", onClick:function(){ p.set(100); }, className:"h-8 w-16 border-x border-border text-[13px] tabular-nums hover:bg-white/10 "+(p.z!==100 ? "text-primary" : "")}, p.z+"%"),
    e("button",{type:"button", "aria-label":"Aumentar", title:"Aumentar", disabled:i>=NIVEIS_ZOOM.length-1, onClick:function(){ p.set(NIVEIS_ZOOM[i+1]); }, className:bt}, "+"));
}

// período da compra: clicar abre as 3 opções (todo o período, por mês, por data)
function Periodo(p){
  var per = p.per, op = useState(false), aberto = op[0], setAberto = op[1], ref = useRef(null);
  useEffect(function(){
    if(!aberto) return undefined;
    var fora = function(ev){ if(ref.current && !ref.current.contains(ev.target)) setAberto(false); };
    var esc = function(ev){ if(ev.key==="Escape") setAberto(false); };
    document.addEventListener("mousedown", fora); document.addEventListener("keydown", esc);
    return function(){ document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc); };
  }, [aberto, setAberto]);
  var rot = per.tipo==="todos" ? "Todo o período" : per.tipo==="mes" ? cap(rotuloMes(per.mes)) : per.de && per.ate ? dmy(per.de)+" a "+dmy(per.ate) : per.de ? "A partir de "+dmy(per.de) : per.ate ? "Até "+dmy(per.ate) : "Por data";
  var ro = "text-[11px] font-medium uppercase tracking-[.05em]";
  return e("div",{ref:ref, className:"relative"},
    e("button",{type:"button", "aria-haspopup":"dialog", "aria-expanded":aberto, title:p.inativo ? "Em aberto e Atrasados o período não vale: aparece tudo" : "Período da compra", onClick:function(){ op[1](!aberto); }, className:CAMPO+" "+(p.larg || "w-52")+" hover:bg-white/10"+(p.inativo ? " opacity-50" : "")}, rot+" ▾"),
    aberto && e("div",{role:"dialog", "aria-label":"Período da compra", className:"absolute left-0 top-full z-30 mt-1 flex w-72 flex-col gap-2 rounded-lg border border-border bg-popover p-2 text-center shadow-xl"},
      e("button",{type:"button", onClick:function(){ p.set({tipo:"todos", mes:per.mes, de:"", ate:""}); op[1](false); }, className:"h-8 rounded-md border text-[13px] hover:bg-white/10 "+(per.tipo==="todos" ? "border-primary bg-primary/20 font-semibold text-primary" : "border-border")}, "Todo o período"),
      e("div",{className:"flex flex-col gap-1"}, e("span",{className:ro}, "Por mês"),
        e("select",{"aria-label":"Mês da compra", value:per.tipo==="mes" ? per.mes : "", onChange:function(ev){ if(ev.target.value){ p.set({tipo:"mes", mes:ev.target.value, de:"", ate:""}); op[1](false); } }, className:CAMPO+" w-full"},
          e("option",{value:""}, "Escolha o mês"), p.meses.map(function(m){ return e("option",{key:m, value:m}, cap(rotuloMes(m))); }))),
      e("div",{className:"flex flex-col gap-1"}, e("span",{className:ro}, "Por data"),
        e("div",{className:"grid grid-cols-2 gap-2"},
          e("label",{className:"flex flex-col gap-0.5 text-[11px]"}, "De", e("input",{type:"date", "aria-label":"Data inicial", value:per.de, onChange:function(ev){ p.set({tipo:"datas", mes:per.mes, de:ev.target.value, ate:per.ate}); }, className:CAMPO+" w-full"})),
          e("label",{className:"flex flex-col gap-0.5 text-[11px]"}, "Até", e("input",{type:"date", "aria-label":"Data final", value:per.ate, onChange:function(ev){ p.set({tipo:"datas", mes:per.mes, de:per.de, ate:ev.target.value}); }, className:CAMPO+" w-full"})))),
      e("p",{className:"text-[11px]"}, "O período vale só para os pedidos finalizados. Pedido em aberto aparece sempre, de qualquer data.")));
}

function AbaPedidos(){
  var x = useCpc(), c = x.c, cfg = c.config, meses = mesesCpc(c), pode = podeFazer(c, "pedidos_bruto", x.por, x.admin), hoje = hojeISO();
  var md = useState("quadro"), modo = md[0], fl = useState(Object.assign({per:{tipo:meses[0] ? "mes" : "todos", mes:meses[0] || "", de:"", ate:""}}, VAZIO_F)), f = fl[0], mo = useState(null), modal = mo[0];
  var zs = useState(lerZoom), zoom = zs[0], vzs = useState(lerVazias), mostraVazias = vzs[0];
  var set = function(k, v){ var n = Object.assign({}, f); n[k] = v; fl[1](n); };
  var setZoom = function(z){ zs[1](z); gravaZoom(z); };
  var alternaVazias = function(){ var v = !mostraVazias; vzs[1](v); gravaVazias(v); };
  var forns = c.pedidos.map(function(p){ return p.forn; }).filter(function(v, i, a){ return a.indexOf(v)===i; }).sort();
  var q = f.q.trim().toLowerCase();
  // o período (todo o período, um mês ou entre duas datas da compra) só vale para os pedidos FINALIZADOS; o que está em aberto aparece sempre, mesmo de 45 dias atrás (Marcus, 03/11/2026)
  var vis = c.pedidos.filter(function(p){
    var fin = etapaPed(p)==="finalizado";
    var tipoOk = f.sit==="aberto" ? !fin : f.sit==="atr" ? atrasadoPed(p, hoje, cfg) : f.sit==="final" ? fin && noPeriodo(p, f.per) : (!fin || noPeriodo(p, f.per));   // aberto e atrasado: sem período; finalizado: só dentro do período
    return tipoOk && (!f.forn || p.forn===f.forn) && (!f.banho || banhoPed(p)===f.banho)
      && (!q || (p.forn+" "+p.romaneio+" "+p.nota).toLowerCase().indexOf(q)>=0);
  }).sort(function(a, b){ return a.data<b.data ? 1 : a.data>b.data ? -1 : 0; });
  var ativo = !!(f.q || f.forn || f.banho || f.sit);
  var ir = function(m){ mo[1](m); };

  var avancar = function(p){
    var prox = proxima(p); if(!prox || !pode) return;
    if(semRomaneio(p)){ ir({tipo:"romaneio", id:p.id, para:prox}); return; }
    if(prox==="chegou" && !banhoCompleto(p)){ ir({tipo:"banho", id:p.id, para:prox}); return; }   // chegou na empresa: valor e fatura do banho são obrigatórios
    x.exec("ped_edit", {id:p.id, status:statusDaEtapa(p, prox)});
  };

  // TOPO COMPACTO (Marcus, 16/11/2026, igual ao Contas a pagar do Financeiro): barra azul com o título e UMA faixa de controles; o resumo por mês fica numa barra que abre e fecha.
  var menu = function(id, rot, valor, opcoes, aoMudar, larg, dica){ return e("select",{id:id, "aria-label":rot, title:dica || rot, value:valor, onChange:function(ev){ aoMudar(ev.target.value); }, className:CAMPO+" cursor-pointer "+larg}, opcoes.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })); };
  var campoForn = e("select",{id:"ped-forn", "aria-label":"Fornecedor do bruto", value:f.forn, onChange:function(ev){ set("forn", ev.target.value); }, className:CAMPO+" w-36"},
    [["", "Fornecedor bruto"]].concat(forns.map(function(n){ return [n, n]; })).map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }));
  var controles = function(){ return e("div",{className:"flex flex-nowrap items-center gap-x-1.5 overflow-x-auto [&>*]:shrink-0 [&>*]:whitespace-nowrap border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 [&_button]:!h-7 [&_select]:!h-7 [&_input]:!h-7 [&_button]:!px-2 [&_button]:!text-[11px] [&_select]:!text-[11px] [&_input]:!text-[11px]"},   // padrao-ok: controles de 28 px numa linha só, igual ao Contas a pagar (pedido do Marcus, 16/11/2026)
    pode && e(Botao,{onClick:function(){ ir({tipo:"comum"}); }}, "Fatura em comum"),   // Fatura em comum e Novo pedido no começo da faixa (Marcus, 16/11/2026)
    pode && e(Botao,{principal:true, onClick:function(){ ir({tipo:"novo"}); }}, "Novo pedido"),
    menu("ped-modo", "Visão", modo, [["quadro", "Quadro"], ["planilha", "Planilha"]], md[1], "w-20"),
    menu("ped-sit", "Tipo do pedido", f.sit, [["", "Todos os pedidos"], ["aberto", "Em aberto"], ["atr", "Atrasados"], ["final", "Finalizados"]], function(k){ set("sit", k); }, "w-32", "Em aberto e Atrasados mostram tudo, de qualquer data. O período vale só para os finalizados."),
    menu("ped-banho", "Fornecedor do banho", f.banho, [["", "Banho: todos"], ["Pontual", "Pontual"], ["Ellos", "Ellos"]], function(k){ set("banho", k); }, "w-28"),
    campoForn,
    e(Periodo,{larg:"w-28", per:f.per, meses:meses, inativo:f.sit==="aberto" || f.sit==="atr", set:function(v){ set("per", v); }}),
    e("input",{id:"ped-busca", type:"search", "aria-label":"Buscar", value:f.q, placeholder:"Romaneio ou nota", onChange:function(ev){ set("q", ev.target.value); }, className:CAMPO+" w-32"}),
    ativo && e(Botao,{onClick:function(){ fl[1](Object.assign({per:f.per}, VAZIO_F)); }}, "Limpar"),
        modo==="quadro" && nVazias>0 && e("button",{type:"button", "aria-pressed":!mostraVazias, title:mostraVazias ? "Esconder as colunas que não têm pedido" : "Mostrar de novo as colunas que não têm pedido", onClick:alternaVazias, className:"h-8 whitespace-nowrap rounded-md border border-border bg-card px-3 text-[13px] hover:bg-white/10"}, (mostraVazias ? "Ocultar vazias" : "Mostrar vazias")+" ("+nVazias+")"),
    modo==="quadro" && menu("ped-zoom", "Zoom do quadro", String(zoom), NIVEIS_ZOOM.map(function(z){ return [String(z), "Zoom "+z+"%"]; }), function(v){ setZoom(parseInt(v, 10)); }, "w-28"),
    null); };

  // ---- quadro: linha 1 = barra das fases, linha 2 = as 12 colunas ----
  // colunas sem pedido: o botão do alto abre e fecha (fechadas, as outras colunas e a barra das fases se juntam)
  var cont = ETAPAS_PED.map(function(k){ return vis.filter(function(p){ return etapaPed(p)===k[0]; }).length; });
  var mostra = ETAPAS_PED.map(function(k, i){ return mostraVazias || cont[i]>0; });
  var pos = [], nVis = 0; mostra.forEach(function(m, i){ if(m) nVis++; pos[i] = nVis; });
  var nVazias = cont.filter(function(n){ return n===0; }).length;
  var bandas = FASES_PED.map(function(fa){
    var idx = ETAPAS_PED.map(function(k, i){ return k[2]===fa[0] && mostra[i] ? i : -1; }).filter(function(i){ return i>=0; });
    if(!idx.length) return null;
    var it = vis.filter(function(p){ return fasePed(etapaPed(p))===fa[0]; }), sm = somasPed(it), cor = COR_FASE[fa[0]];
    return e("div",{key:"f-"+fa[0], className:"relative h-9 overflow-hidden rounded-lg border", style:{gridRow:1, gridColumn:pos[idx[0]]+" / "+(pos[idx[idx.length-1]]+1), borderColor:cor, background:cor+"2E"}},
      e("span",{className:"sticky left-0 right-0 flex h-full items-center justify-center gap-3 whitespace-nowrap text-[11px]"}, e("b",null, fa[1]), e("b",{className:"tabular-nums"}, plural(it.length, "pedido", "pedidos")),
        fa[0]==="empresa" ? e("span",{className:"tabular-nums"}, "Bruto "+brl(sm.bruto)+" · Banho "+brl(sm.banho)+" · Total ", e("b",null, brl(sm.total))) : e("b",{className:"tabular-nums"}, "Total "+brl(sm.total))));
  });
  var colunas = ETAPAS_PED.map(function(k, i){
    if(!mostra[i]) return null;
    var cor = COR_FASE[k[2]], it = vis.filter(function(p){ return etapaPed(p)===k[0]; }), sm = somasPed(it);
    return e("section",{key:k[0], className:"flex min-w-0 flex-col gap-1.5 rounded-xl bg-black/20 p-1.5 ring-1 ring-white/10", style:{gridRow:2, gridColumn:pos[i], borderTop:"3px solid "+cor}},
      e("div",{className:"flex flex-col items-center gap-0.5 border-b border-white/10 pb-1.5 text-center"},
        e("b",{className:"flex min-h-9 items-center justify-center gap-1.5 text-[13px] leading-tight"}, e("span",{className:"grid size-5 shrink-0 place-items-center rounded-full text-[11px]", style:{border:"1px solid "+cor, color:cor}}, i+1), k[1]),
        e("span",{className:"text-[11px] font-semibold"}, plural(it.length, "pedido", "pedidos")),
        e("span",{className:"text-[13px] font-bold tabular-nums"}, brl(sm.total)),
        k[2]==="empresa" && e("span",{className:"text-[11px] tabular-nums"}, "Bruto "+brl(sm.bruto)+" + Banho "+brl(sm.banho))),
      it.map(function(p){ return e(Cartao,{key:p.id, p:p, cfg:cfg, hoje:hoje, ficha:function(){ ir({tipo:"ficha", id:p.id}); }}); }));
  });
  var quadro = e("div",{className:"overflow-x-auto pb-2"}, e("div",{className:"grid items-start gap-x-2 gap-y-1.5", style:{gridTemplateColumns:"repeat("+Math.max(nVis, 1)+", 370px)", gridTemplateRows:"auto 1fr", zoom:zoom/100, width:"max-content"}}, bandas, colunas));

  var tot = vis.reduce(function(t, p){ t.valor += p.valor; t.pagar += p.pagar; t.banho += p.valorBanho || 0; t.pecas += pecasPedido(p); return t; }, {valor:0, pagar:0, banho:0, pecas:0});
  // PLANILHA (Marcus, 16/11/2026): a tabela única do sistema (TabelaPlanilha), com filtro e ordem em cada coluna, coluna Parcial e Total no fim da tabela
  var linhasPlan = vis.map(function(p){ var et = etapaPed(p), pa = parcialPed(p), atr = atrasadoPed(p, hoje, cfg);
    return {id:p.id, data:p.data, forn:p.forn, romaneio:p.romaneio || "—", etapa:nomeEtapa(et), dias:et==="finalizado" ? "—" : diasNaEtapa(p, hoje), atrasado:atr && et!=="finalizado", pecas:pecasPedido(p) || "—",
      parcial:pa ? "Parcial: chegaram "+pa.chegaram+" de "+pa.pedidas : "—", valor:p.valor, desc:Math.round(p.desc*10000)/100, pagar:p.pagar, banho:p.valorBanho>0 ? p.valorBanho : null, total:totalPed(p), galv:banhoPed(p) || "—", prox:proxima(p)}; });
  var colsPlan = [{k:"data", t:"Compra", fmt:function(v){ return dia(v); }}, {k:"forn", t:"Fornecedor"}, {k:"romaneio", t:"Romaneio"}, {k:"etapa", t:"Etapa"},
    {k:"dias", t:"Dias", cor:function(l){ return l.atrasado ? "text-destructive" : ""; }}, {k:"pecas", t:"Peças"}, {k:"parcial", t:"Parcial", cor:function(l){ return l.parcial!=="—" ? "text-warning" : ""; }},
    {k:"valor", t:"Valor", fmt:brl}, {k:"desc", t:"Desc.", fmt:function(v){ return v+"%"; }}, {k:"pagar", t:"A pagar (bruto)", fmt:brl}, {k:"banho", t:"Banho R$", fmt:function(v){ return v==null ? "—" : brl(v); }},
    {k:"total", t:"Total", fmt:brl}, {k:"galv", t:"Galvânica"},
    {k:"prox", t:"Avançar", render:function(v, l){ return pode && v ? e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); avancar(vis.find(function(o){ return o.id===l.id; })); }, className:"h-8 rounded border border-border px-2 text-[13px] hover:bg-white/10"}, "Concluir ›") : ""; }, fmt:function(v){ return v ? "Pode avançar" : "—"; }}];
  var rodapePlan = function(ls){ var t = ls.reduce(function(a, l){ a.pecas += typeof l.pecas==="number" ? l.pecas : 0; a.valor += l.valor || 0; a.pagar += l.pagar || 0; a.banho += l.banho || 0; a.total += l.total || 0; return a; }, {pecas:0, valor:0, pagar:0, banho:0, total:0});
    return ["Total", plural(ls.length, "pedido", "pedidos"), "", "", "", t.pecas, "", brl(t.valor), t.valor>0 ? Math.round((1-t.pagar/t.valor)*1000)/10+"%" : "—", brl(t.pagar), brl(t.banho), brl(t.total), "", ""]; };
  var planilha = vis.length ? e(TabelaPlanilha,{cols:colsPlan, linhas:linhasPlan, chave:"id", grade:true, semContagem:true, semLimpar:true, limite:300, aoClicar:function(l){ ir({tipo:"ficha", id:l.id}); }, totalRodape:rodapePlan, vazio:"Nenhum pedido neste filtro."}) : e(Vazio,{ic:"package"}, "Nenhum pedido neste filtro.");

  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e(BlocoPainel,{titulo:"Resumo por mês · comprado", compacto:true}, e(ResumoMeses,{c:c, hoje:hoje})),
    e(BlocoPainel,{titulo:"Pedidos de bruto e banho"},
      controles(),
      !pode && e("p",{className:"py-1 text-center text-[13px] font-semibold"}, "Somente quem lança os pedidos edita."),
      e("div",{className:"p-2"}, modo==="planilha" ? planilha : quadro)),
    modal && modal.tipo==="novo" && e(NovoPedido,{x:x, forns:forns, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="banho" && e(FaturaBanho,{x:x, id:modal.id, para:modal.para, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="romaneio" && e(Romaneio,{x:x, id:modal.id, para:modal.para, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="comum" && e(FaturaComum,{x:x, id:modal.id, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="ficha" && e(Ficha,{x:x, id:modal.id, pode:pode, hoje:hoje, cfg:cfg, avancar:avancar, comum:function(id){ ir({tipo:"comum", id:id}); }, fechar:function(){ ir(null); }}));
}

// somas de um grupo de pedidos: bruto (a pagar), banho lançado e total (bruto + banho)
function somasPed(it){ var s = {bruto:0, banho:0, total:0}; it.forEach(function(p){ s.bruto += p.pagar || 0; s.banho += p.valorBanho || 0; s.total += totalPed(p); }); return s; }

// resumo por mês no alto da tela (Marcus, 09/11/2026): filtro Mês atual | 3 meses | 2026, sempre com as MESMAS colunas (mês, bruto, banho, comprado, custo vendido + brinde, diferença).
// Bruto = valor a pagar dos pedidos no mês da compra; banho = faturas da Pontual e da Ellos no mês da fatura; custo vendido + brinde = DevMaster (s.cpc.custoMes).
// Diferença = comprado - custo: verde = o estoque AUMENTOU (comprou mais do que saiu), vermelho = o estoque DIMINUIU.
var COR_RES = {mes:"#A78BFA", compra:"#5B8DEF", custo:"#E8B84B", dif:"#2DD4BF"};   // cabeçalho do resumo: comprado (bruto, banho e total) azul, custo vendido + brinde dourado, diferença turquesa (Marcus, 09/11/2026)
// nomes dos tipos de saída (TES da DevMaster, tabela dmabc); o que não está aqui aparece com o código
var NOME_TES = {S001:"Venda", S002:"Venda sem estoque", S004:"Entrada de brinde", S006:"Troca", S007:"Indicação", S009:"Brinde", S011:"Premiação", S501:"Venda antiga", S502:"Venda antiga", S503:"Brinde antigo"};
function ResumoMeses(p){
  var vt = useState(false), verTes = vt[0];   // botão no título de Custo das saídas: abre uma coluna por TES
  // fixo no ano, sem seletor e sem nota explicativa (Marcus, 16/11/2026); tabela única do sistema (TabelaPlanilha) dentro do bloco compacto
  // custo das saídas = custo de TUDO que saiu do estoque (venda, brinde, troca, indicação, premiação), lido da DevMaster; botão Total | Por TES
  var meses = mesesCpc(p.c).filter(function(k){ return k.slice(0, 4)==="2026"; }).sort();
  var ls = resumoCompras(p.c, meses).map(function(l){ var o = {mes:l.mes, nome:cap(rotuloMes(l.mes)), bruto:l.bruto, banho:l.banho, total:l.total, custo:l.custo, dif:l.dif};
    Object.keys(l.tes || {}).forEach(function(k){ o["t_"+k] = l.tes[k].custo; }); return o; });
  var codigos = []; ls.forEach(function(o){ Object.keys(o).forEach(function(k){ if(k.indexOf("t_")===0 && codigos.indexOf(k.slice(2))<0) codigos.push(k.slice(2)); }); }); codigos.sort();
  ls.forEach(function(o){ if(o.custo!=null) codigos.forEach(function(k){ if(o["t_"+k]==null) o["t_"+k] = 0; }); });   // mês com custo e sem aquele tipo de saída = R$ 0,00 (não fica em branco)
  var brlOuTraco = function(v){ return v==null ? "—" : brl(v); };
  var cdif = function(v){ return v==null ? "—" : e("span",{style:{color:v>0 ? "#4ADE80" : v<0 ? "#F87171" : undefined}}, (v>0 ? "+" : "")+brl(v)); };
  var porTes = verTes && codigos.length>0;
  var cols = [{k:"nome", t:"Mês", faixa:COR_RES.mes}, {k:"bruto", t:"Bruto", fmt:brl, faixa:COR_RES.compra}, {k:"banho", t:"Banho", fmt:brl, faixa:COR_RES.compra}, {k:"total", t:"Comprado (total)", fmt:brl, faixa:COR_RES.compra}]
    .concat(porTes ? codigos.map(function(k){ return {k:"t_"+k, t:NOME_TES[k] ? NOME_TES[k]+" ("+k+")" : "TES "+k, fmt:brlOuTraco, faixa:COR_RES.custo}; }) : [])
    .concat([{k:"custo", t:porTes ? "Custo total das saídas" : "Custo das saídas", fmt:brlOuTraco, faixa:COR_RES.custo, acao:codigos.length ? {rotulo:porTes ? "−" : "+", titulo:porTes ? "Esconder o custo por TES" : "Ver o custo por TES", onClick:function(){ vt[1](!verTes); }} : undefined}, {k:"dif", t:"Diferença", render:cdif, fmt:function(v){ return v==null ? "—" : (v>0 ? "+" : "")+brl(v); }, faixa:COR_RES.dif}]);
  var totalLinha = function(l){ var t = l.reduce(function(a, x){ a.bruto += x.bruto; a.banho += x.banho; a.total += x.total; if(x.custo!=null){ a.custo += x.custo; a.totalComCusto += x.total; a.n++; } codigos.forEach(function(k){ a.tes[k] = (a.tes[k] || 0) + (x["t_"+k] || 0); }); return a; }, {bruto:0, banho:0, total:0, custo:0, totalComCusto:0, n:0, tes:{}});
    return ["TOTAL", brl(t.bruto), brl(t.banho), brl(t.total)].concat(porTes ? codigos.map(function(k){ return t.n ? brl(t.tes[k] || 0) : "—"; }) : [], [t.n ? brl(t.custo) : "—", t.n ? cdif(t.totalComCusto-t.custo) : "—"]); };
  return e(TabelaPlanilha,{key:porTes ? "tes" : "total", cols:cols, linhas:ls, chave:"mes", grade:true, semContagem:true, semLimpar:true, totalRodape:totalLinha, vazio:"Nenhum mês."});
}

// texto do prazo de uma etapa: "5 dias"; no Banho, o de cada galvânica
function prazoTxt(cfg, k){
  if(["nobanho", "fotos", "precos", "banho"].indexOf(k)>=0){ var a = prazoEtapa(cfg, "banho", {chegPontual:"x"}), b = prazoEtapa(cfg, "banho", {chegEllos:"x"}); if(!a && !b) return ""; return a===b ? a+" dias" : "Pontual "+(a || "—")+" · Ellos "+(b || "—")+" dias"; }
  var z = prazoEtapa(cfg, k); return z ? z+" dias" : "";
}
// cartão do quadro: UMA linha (banho · fornecedor · romaneio, valor e dias). Clicar abre a ficha do pedido direto; o quadro fica na tela (Marcus, 04/11/2026).
function Cartao(p){
  var pd = p.p, et = etapaPed(pd), atr = atrasadoPed(pd, p.hoje, p.cfg), b = banhoPed(pd), cor = COR_FASE[fasePed(et)];
  var dGal = naGalvanica(pd) ? diasNaGalvanica(pd, p.hoje) : null, diasCartao = dGal!=null ? dGal : diasNaEtapa(pd, p.hoje);
  return e("div",{"data-sem-arrastar":true, className:"rounded-lg bg-card text-left ring-1 "+(atr ? "ring-destructive" : "ring-white/10 hover:ring-white/30"), style:{boxShadow:"inset 3px 0 0 "+cor}},
    e("button",{type:"button", title:"Abrir a ficha do pedido", onClick:p.ficha, className:"flex min-h-8 w-full cursor-pointer flex-col justify-center gap-0.5 px-2 py-1 pl-3 text-left text-[11px]"},
      e("div",{className:"flex flex-nowrap items-center justify-between gap-2 whitespace-nowrap"},
      e("span",{className:"whitespace-nowrap"}, e("span",{className:"font-semibold", style:b ? {color:COR_BANHO[b]} : undefined}, b || "A definir"), " · ", e("b",null, pd.forn), pd.romaneio && e("span",{className:"text-[11px]"}, " · "+pd.romaneio), et==="fechado" && faltaRomaneio(pd) && e("span",{className:"text-[11px] font-semibold text-destructive", title:"Falta: "+faltaRomaneio(pd)+" (a etapa só anda com o número e o arquivo do romaneio)"}, " · "+faltaRomaneio(pd))),
      !(pd.valorBanho>0) && e("span",{className:"ml-auto whitespace-nowrap text-[11px] tabular-nums", title:"Só o bruto (o banho entra quando chega na empresa)"}, brl(totalPed(pd))),
      e("b",{className:"whitespace-nowrap text-[11px] "+(atr ? "text-destructive" : ""), title:atr ? "Atrasado: dias nesta etapa" : "Dias nesta etapa"}, et==="finalizado" ? "Concluído" : txtDias(diasCartao))),
      // Parcial (16/11/2026): chegou menos peças do que o pedido; fica visível até chegar o resto
      parcialPed(pd) && e("div",{className:"mt-0.5 flex flex-nowrap items-baseline justify-between gap-2 whitespace-nowrap border-t border-white/10 pt-1 text-[11px] font-semibold tabular-nums text-warning", title:"Pedido parcial: só finaliza quando chegar tudo"},
        e("span",null, "Parcial"), e("span",null, "Chegaram "+parcialPed(pd).chegaram+" de "+parcialPed(pd).pedidas), e("span",null, "Faltam "+parcialPed(pd).faltam)),
      // com banho: segunda linha em forma de conta, Bruto + Banho = total (o total em destaque à direita)
      pd.valorBanho>0 && e("div",{className:"mt-0.5 flex flex-wrap items-baseline justify-between gap-x-2 border-t border-white/10 pt-1 text-[11px] tabular-nums [&>span]:whitespace-nowrap", title:"Bruto + banho = total do pedido"},
        e("span",null, "Bruto ", e("b",null, brl(pd.pagar))), e("span",null, "+ Banho ", e("b",null, brl(pd.valorBanho))), e("span",{className:"text-[11px]"}, "= ", e("b",null, brl(totalPed(pd)))))));
}

function Linha(p){ return e("div",{className:"flex items-center justify-between gap-2"}, e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, p.t), p.children); }
function Coluna(p){ return e("section",{className:"flex min-w-0 flex-col gap-2 rounded-xl bg-black/20 p-3 ring-1 ring-white/10"}, e("h3",{className:"border-b border-white/10 pb-1 text-center text-[11px] font-medium uppercase tracking-[.07em]"}, p.t), p.children); }

// ficha do pedido (layout A escolhido pelo Marcus em 09/11/2026): três blocos lado a lado — Bruto (compra), Banho e Empresa — com as etapas em faixa embaixo e as ações no rodapé.
// Cada bloco tem a cor da fase no fio de cima; o resumo em dinheiro fica no fim do bloco (bruto a pagar, banho e total do pedido = bruto + banho).
function CampoF(p){   // rótulo em cima, campo de 32 px embaixo; grava ao sair do campo (ou Enter) só se mudou
  var ini = p.v==null ? "" : String(p.v);
  return e("label",{className:"min-w-0 "+(p.cls||"")}, e("span",{className:"mb-0.5 block text-[11px] font-medium uppercase tracking-[.05em]"}, p.t),
    p.opcoes ? e("select",{value:p.v, disabled:p.off, "aria-label":p.rot || p.t, onChange:function(ev){ p.onSet(ev.target.value); }, className:CAMPO+" w-full cursor-pointer"}, p.opcoes.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))
      : e("input",{key:ini, defaultValue:ini, type:p.data ? "date" : "text", readOnly:p.off, inputMode:p.data || p.texto ? undefined : "decimal", placeholder:p.dica, "aria-label":p.rot || p.t,
        onBlur:function(ev){ if(!p.off && ev.target.value!==ini) p.onSet(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }, className:INP+(p.off ? " opacity-70" : "")}));
}
function BlocoF(p){
  return e("section",{className:"flex min-w-0 flex-col overflow-hidden rounded-md border-2 border-[var(--bloco-titulo)]"},   // barra azul de título, igual ao Contas a pagar (Marcus, 16/11/2026)
    e("div",{className:"flex items-center justify-between gap-2 bg-[var(--bloco-titulo)] px-3 py-0.5 text-[13px] font-bold uppercase"}, e("span",null, p.t), p.nota && e("span",{className:"text-[11px] font-medium normal-case"}, p.nota)),
    e("div",{className:"flex flex-1 flex-col gap-2.5 p-3"}, p.children,
      p.resumo && e("div",{className:"mt-auto flex flex-col gap-1 rounded-lg bg-[#1c1d21] px-3 py-2"}, p.resumo)));
}
function Resumo(p){ return e("div",{className:"flex items-center justify-between gap-3 text-[13px]"}, e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, p.t), e("b",{className:"tabular-nums "+(p.grande ? "text-[18px]" : "")}, p.v)); }

function Ficha(p){
  var x = p.x, pd = x.c.pedidos.find(function(o){ return o.id===p.id; }), ob = useState(null), pode = p.pode;
  if(!pd) return null;
  var set = function(k){ return function(v){ x.exec("ped_edit", Object.assign({id:pd.id}, (function(o){ o[k] = v; return o; })({}))); }; };
  var et = etapaPed(pd), i0 = ETAPAS_PED.findIndex(function(k){ return k[0]===et; }), prox = proxima(pd), gal = banhoPed(pd);
  var bruto = e(BlocoF,{key:"b", t:"Bruto", cor:COR_FASE.compra, nota:"Compra",
    resumo:[e(Resumo,{key:"v", t:"Valor", v:brl(pd.valor)}), e(Resumo,{key:"p", t:"A pagar (bruto)", v:brl(pd.pagar), grande:true})]},
    e("div",{className:"grid grid-cols-2 gap-2"},
      e(CampoF,{t:"Compra", v:pd.data, data:true, off:!pode, onSet:set("data")}), e(CampoF,{t:"Fornecedor", v:pd.forn, texto:true, off:!pode, onSet:set("forn")}),
      e(CampoF,{t:"Nota", v:pd.nota, texto:true, off:!pode, onSet:set("nota")}), e(CampoF,{t:"Romaneio", v:pd.romaneio, texto:true, off:!pode, onSet:set("romaneio")})),
    e(Linha,{t:"Arquivo do romaneio"}, e(AnexoCampo,{atual:pd.romaneioArq, off:!pode, onMudou:function(m){ x.exec("ped_edit", {id:pd.id, romaneioArq:m}); }})),
    e("div",{className:"grid grid-cols-2 gap-2 border-t border-white/10 pt-2.5"},
      e(CampoF,{t:"Valor R$", v:pd.valor, off:!pode, onSet:set("valor")}), e(CampoF,{t:"Desconto %", v:Math.round(pd.desc*10000)/100, off:!pode, onSet:set("desc")})));
  var banho = e(BlocoF,{key:"n", t:"Banho", cor:COR_FASE.banho, nota:gal || "Galvânica a definir",
    resumo:[e(Resumo,{key:"v", t:"Valor do banho", v:brl(pd.valorBanho || 0), grande:true})]},
    e("div",{className:"grid grid-cols-2 gap-2"},
      e(CampoF,{t:"Chegou na Pontual", v:pd.chegPontual, data:true, off:!pode, onSet:set("chegPontual")}), e(CampoF,{t:"Chegou na Ellos", v:pd.chegEllos, data:true, off:!pode, onSet:set("chegEllos")}),
      e(CampoF,{t:"Fotos enviadas", v:pd.fotosEm, data:true, off:!pode, onSet:set("fotosEm")}), e(CampoF,{t:"Verniz novo", v:pd.vernizNovo ? "sim" : "nao", off:!pode, rot:"Tem verniz novo (+2 dias na Pontual)", opcoes:[["nao", "Não"], ["sim", "Sim (+2 dias)"]], onSet:set("vernizNovo")}),
      e(CampoF,{t:"Data que "+(gal ? "a "+gal : "o banho")+" conta", v:pd.contaBanho, data:true, off:!pode, onSet:set("contaBanho"), cls:"col-span-2"})),
    e("div",{className:"grid grid-cols-2 gap-2 border-t border-white/10 pt-2.5"},
      e(CampoF,{t:"Valor do banho R$", v:pd.valorBanho || "", dica:"0", off:!pode, onSet:set("valorBanho")})),
    e(Linha,{t:"Fatura do banho"}, e(AnexosCampo,{lista:pd.faturasBanho, off:!pode, onMudou:function(l){ x.exec("ped_edit", {id:pd.id, faturasBanho:l}); }})),
    pd.faturaComum && e("p",{className:"text-center text-[13px]"}, "Fatura em comum de ", e("b",{className:"tabular-nums"}, brl(pd.faturaComum.total)), " dividida em "+pd.faturaComum.n+" pedidos"),
    pode && e(Botao,{onClick:function(){ p.comum(pd.id); }}, "Fatura em comum"));
  var empresa = e(BlocoF,{key:"m", t:"Empresa", cor:COR_FASE.empresa, nota:"Chegada",
    resumo:[e(Resumo,{key:"b", t:"Bruto", v:brl(pd.pagar)}), e(Resumo,{key:"n", t:"Banho", v:brl(pd.valorBanho || 0)}), e(Resumo,{key:"t", t:"Total do pedido", v:brl(totalPed(pd)), grande:true})]},
    e(CampoF,{t:"Chegou na Sorelly", v:pd.chegSorelly, data:true, off:!pode, onSet:set("chegSorelly")}),
    e(CampoF,{t:"Peças que chegaram", v:pd.chegaram, dica:pecasPedido(pd) ? "Pedidas: "+pecasPedido(pd)+" (vazio = chegou tudo)" : "Lance as peças por categoria", off:!pode, onSet:set("chegaram")}),
    parcialPed(pd) && e("p",{className:"rounded-md border border-warning px-2 py-1 text-center text-[13px] font-semibold text-warning"}, "Parcial: chegaram "+parcialPed(pd).chegaram+" de "+parcialPed(pd).pedidas+" · faltam "+parcialPed(pd).faltam),
    e(CampoF,{t:"Observação", v:pd.obs, texto:true, off:!pode, onSet:set("obs")}),
    e("button",{type:"button", onClick:function(){ ob[1](!ob[0]); }, className:"h-8 rounded-md border border-border text-[13px] hover:bg-white/10"}, "Peças por categoria · "+(pecasPedido(pd) || "0")),
    ob[0] && e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-1"}, CATS.map(function(k){ return e("label",{key:k[0], className:"flex items-center justify-between gap-1 text-[13px]"}, k[1], e(Cel,{v:pd.cats[k[0]] || "", dica:"0", off:!pode, rot:k[1], w:"w-14", onSet:function(q){ x.exec("ped_edit", {id:pd.id, cat:k[0], qtd:q}); }})); })));
  var etapas = e("div",{key:"e", className:"grid gap-2", style:{gridColumn:"1 / -1", gridTemplateColumns:"repeat(auto-fit, minmax(15rem, 1fr))"}}, FASES_PED.map(function(fa){
    return e("div",{key:fa[0], className:"min-w-0 overflow-hidden rounded-md border-2 border-[var(--bloco-titulo)] pb-2"},
      e("h4",{className:"mb-1 flex items-center gap-2 bg-[var(--bloco-titulo)] px-3 py-0.5 text-[13px] font-bold uppercase"}, e("span",{className:"size-2.5 rounded-full", style:{background:COR_FASE[fa[0]]}}), fa[1]),
      ETAPAS_PED.map(function(k, i){ if(k[2]!==fa[0]) return null;
        var feito = i<i0, atual = i===i0, atr = atual && atrasadoPed(pd, p.hoje, p.cfg), cor = COR_FASE[k[2]];
        return e("div",{key:k[0], className:"px-3 py-0.5"},
          e("div",{className:"flex items-center gap-2 text-[13px] "+(atual ? "font-semibold" : "")},
            e("span",{className:"size-3 shrink-0 rounded-full border-2", style:feito ? {borderColor:"#4ADE80", background:"#4ADE80"} : atual ? {borderColor:cor, background:cor} : {borderColor:cor, borderStyle:"dashed"}}), k[1]),
          atual && e("span",{className:"ml-5 block text-[11px] "+(atr ? "font-semibold text-destructive" : "")}, et==="finalizado" ? "Pedido finalizado" : (naGalvanica(pd) && diasNaGalvanica(pd, p.hoje)!=null ? txtDias(diasNaGalvanica(pd, p.hoje))+" na galvânica" : txtDias(diasNaEtapa(pd, p.hoje))+" nesta etapa")+(prazoTxt(p.cfg, k[0]) ? " · prazo "+prazoTxt(p.cfg, k[0]) : "")+(atr ? " · atrasado" : ""))); }));
  }));
  var rodape = [
    pode && e(Botao,{key:"r", onClick:function(){ if(window.confirm("Remover o pedido de "+pd.forn+"?")){ x.exec("ped_del", {id:pd.id}); p.fechar(); } }}, "Remover pedido"),
    e("select",{key:"s", value:pd.status, disabled:!pode, "aria-label":"Status do pedido", title:"Status do pedido", onChange:function(ev){ set("status")(ev.target.value); }, className:CAMPO+" w-64 cursor-pointer"}, STATUS_PED.map(function(t){ return e("option",{key:t, value:t}, t); })),
    pode && prox && e(Botao,{key:"c", principal:true, onClick:function(){ p.avancar(pd); }}, "Concluir ›")];
  return e(JanelaAzul,{t:"Pedido de "+pd.forn, sub:(pd.romaneio ? "Romaneio "+pd.romaneio+" · " : "")+nomeEtapa(et), fechar:p.fechar, larga:true, colunas:[bruto, banho, empresa, etapas], rodape:rodape});
}


// campo do arquivo do romaneio (foto ou PDF): anexar, trocar, abrir e tirar. O arquivo vai para o servidor; o pedido guarda só a chave e o nome.
function AnexoCampo(p){
  var st = useState(""), msg = st[0], a = p.atual;
  var abre = function(){ abrirAnexo(a.key).catch(function(x){ st[1](x.message || "Não consegui abrir o arquivo."); }); };
  var escolhe = function(ev){
    var f = ev.target.files && ev.target.files[0]; ev.target.value = ""; if(!f) return;
    st[1]("Enviando o arquivo...");
    lerArquivo(f).then(function(ar){ return enviarAnexo("cpc", ar); }).then(function(m){ st[1](""); p.onMudou(m); }).catch(function(x){ st[1](x.message || "Não consegui enviar o arquivo."); });
  };
  var bt = "h-8 rounded-md border border-border px-2.5 text-[13px] hover:bg-white/10";
  return e("div",{className:"flex flex-col items-end gap-1 text-right text-[13px]"},
    a && a.key && e("span",{className:"break-all"}, a.nome),
    e("div",{className:"flex flex-wrap items-center justify-end gap-1.5"},
      a && a.key && e("button",{type:"button", onClick:abre, className:bt}, "Abrir"),
      !p.off && e("label",{className:"inline-flex cursor-pointer items-center "+bt}, a && a.key ? "Trocar" : "Anexar arquivo", e("input",{type:"file", accept:"image/*,application/pdf", onChange:escolhe, className:"hidden", "aria-label":"Arquivo do romaneio"})),
      a && a.key && !p.off && e("button",{type:"button", onClick:function(){ p.onMudou(null); }, className:bt}, "Tirar")),
    msg && e("span",null, msg));
}

// várias fotos (as faturas do banho): cada uma com Abrir e Tirar; "Anexar foto" acrescenta
function AnexosCampo(p){
  var st = useState(""), msg = st[0], lista = p.lista || [];
  var escolhe = function(ev){
    var fs = [].slice.call(ev.target.files || []); ev.target.value = ""; if(!fs.length) return;
    st[1]("Enviando...");
    Promise.all(fs.map(function(f){ return lerArquivo(f).then(function(ar){ return enviarAnexo("cpc", ar); }); })).then(function(ms){ st[1](""); p.onMudou(lista.concat(ms)); }).catch(function(x){ st[1](x.message || "Não consegui enviar o arquivo."); });
  };
  var bt = "h-8 rounded-md border border-border px-2.5 text-[13px] hover:bg-white/10";
  return e("div",{className:"flex flex-col items-end gap-1 text-right text-[13px]"},
    lista.map(function(a, i){ return e("div",{key:a.key, className:"flex flex-wrap items-center justify-end gap-1.5"}, e("span",{className:"break-all"}, a.nome || "Fatura "+(i+1)),
      e("button",{type:"button", onClick:function(){ abrirAnexo(a.key).catch(function(x){ st[1](x.message || "Não consegui abrir o arquivo."); }); }, className:bt}, "Abrir"),
      !p.off && e("button",{type:"button", onClick:function(){ p.onMudou(lista.filter(function(o){ return o.key!==a.key; })); }, className:bt}, "Tirar")); }),
    !p.off && e("label",{className:"inline-flex cursor-pointer items-center "+bt}, lista.length ? "Anexar outra foto" : "Anexar foto", e("input",{type:"file", accept:"image/*,application/pdf", multiple:true, onChange:escolhe, className:"hidden", "aria-label":"Foto da fatura do banho"})),
    msg && e("span",{className:"text-[13px] text-warning"}, msg));
}

// Chegou na empresa: o valor do banho e a foto da fatura são obrigatórios (Marcus, 09/11/2026); o total do pedido passa a ser bruto + banho
function FaturaBanho(p){
  var pd = p.x.c.pedidos.find(function(o){ return o.id===p.id; }), v = useState(pd && pd.valorBanho ? String(pd.valorBanho).replace(".", ",") : ""), ls = useState(pd ? pd.faturasBanho || [] : []);
  if(!pd) return null;
  var valor = parseFloat(String(v[0]).replace(/\./g, "").replace(",", ".")) || 0, pronto = valor>0 && ls[0].length>0;
  var ok = function(){ if(pronto && p.x.exec("ped_edit", {id:pd.id, valorBanho:v[0], faturasBanho:ls[0], status:statusDaEtapa(pd, p.para)})) p.fechar(); };
  return e(Janela,{t:"Banho do pedido", sub:pd.forn+(pd.romaneio ? " · Romaneio "+pd.romaneio : ""), fechar:p.fechar, colunas:[e(Coluna,{key:"b", t:"Chegou na empresa"},
    e("p",{className:"text-center text-[13px]"}, "Informe o valor do banho e anexe a foto da fatura que a galvânica enviou."),
    e("input",{value:v[0], autoFocus:true, inputMode:"decimal", onChange:function(ev){ v[1](ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") ok(); }, placeholder:"Valor do banho R$", "aria-label":"Valor do banho", className:INP}),
    e(AnexosCampo,{lista:ls[0], onMudou:function(l){ ls[1](l); }}),
    e("p",{className:"text-center text-[13px]"}, "Total do pedido: ", e("b",{className:"tabular-nums"}, brl(totalPed(Object.assign({}, pd, {valorBanho:valor}))))),
    e("div",{className:"flex justify-center gap-2"}, e(Botao,{onClick:p.fechar}, "Cancelar"), e(Botao,{principal:true, desabilitado:!pronto, onClick:ok}, "Salvar e concluir")))]});
}

// o pedido espera o romaneio na etapa 3 e só segue com o número E o arquivo salvos (Marcus, 04/11/2026)
function Romaneio(p){
  var pd = p.x.c.pedidos.find(function(o){ return o.id===p.id; }), v = useState(pd ? pd.romaneio || "" : ""), ar = useState(pd ? pd.romaneioArq : null);
  if(!pd) return null;
  var pronto = !!v[0].trim() && !!(ar[0] && ar[0].key);
  var ok = function(){ if(pronto && p.x.exec("ped_edit", {id:pd.id, romaneio:v[0], romaneioArq:ar[0], status:statusDaEtapa(pd, p.para)})) p.fechar(); };
  return e(Janela,{t:"Romaneio do pedido", sub:pd.forn, fechar:p.fechar, colunas:[e(Coluna,{key:"r", t:"Aguardando romaneio"},
    e("p",{className:"text-center text-[13px]"}, "O pedido só segue para Em trânsito com o número e o arquivo do romaneio salvos."),
    e("input",{value:v[0], autoFocus:true, onChange:function(ev){ v[1](ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") ok(); }, placeholder:"Número do romaneio", "aria-label":"Romaneio", className:INP}),
    e(AnexoCampo,{atual:ar[0], onMudou:function(m){ ar[1](m); }}),
    e("div",{className:"flex justify-center gap-2"}, e(Botao,{onClick:p.fechar}, "Cancelar"), e(Botao,{principal:true, desabilitado:!pronto, onClick:ok}, "Salvar e enviar")))]});
}

// Fatura em comum (Marcus, 16/11/2026): a galvânica manda UMA fatura para vários pedidos. A Rayssa digita o total, marca os pedidos e escolhe como dividir.
// A soma das partes é sempre igual ao total da fatura (o último pedido recebe a sobra dos centavos). A mesma foto da fatura vai para todos os pedidos.
// JANELA NO PADRÃO AZUL (Marcus, 16/11/2026): barra azul de título com o × à direita, borda azul e fundo escuro, igual ao bloco do Contas a pagar (BlocoPainel).
function JanelaAzul(p){
  return e("div",{className:"fixed inset-0 z-[80] flex justify-center overflow-y-auto bg-black/70 p-3 md:p-6", onClick:function(ev){ if(ev.target===ev.currentTarget) p.fechar(); }},
    e("div",{className:PADRAO_BLOCOS+" m-auto w-full "+(p.larga ? "max-w-6xl" : "max-w-3xl")+" rounded-lg bg-[#14171c] text-[13px] [&>section]:!bg-[#14171c]"},
      e(BlocoPainel,{titulo:p.t, dir:e("button",{type:"button", "aria-label":"Fechar", title:"Fechar", onClick:p.fechar, className:"px-2 text-[13px] font-bold hover:text-white/70"}, "×")},
        e("div",{className:"flex flex-col gap-2 p-3"}, p.sub && e("p",{className:"text-center text-[13px]"}, p.sub),
          p.colunas ? e("div",{className:"grid items-start gap-2", style:{gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 19.5rem), 1fr))"}}, p.colunas) : p.children,
          p.rodape && e("div",{className:"flex flex-wrap items-center justify-center gap-2 border-t border-border pt-2"}, p.rodape)))));
}
var DIVISOES = [["iguais", "Partes iguais"], ["pecas", "Pelas peças"], ["valor", "Pelo valor do bruto"]];
function pesoDiv(p, modo){ return modo==="pecas" ? pecasPedido(p) : modo==="valor" ? (p.pagar || 0) : 1; }
function dividirFatura(totalCent, pedidos, modo){   // [{id, cent}]; cai em partes iguais se algum peso for zero
  var pesos = pedidos.map(function(p){ return pesoDiv(p, modo); }), soma = pesos.reduce(function(s, v){ return s+v; }, 0);
  if(!(soma>0) || pesos.some(function(v){ return !(v>0); })){ pesos = pedidos.map(function(){ return 1; }); soma = pedidos.length; }
  var usado = 0;
  return pedidos.map(function(p, i){ var c = i===pedidos.length-1 ? totalCent-usado : Math.round(totalCent*pesos[i]/soma); usado += c; return {id:p.id, cent:c}; });
}
function FaturaComum(p){
  var ped = p.x.c.pedidos, ini = ped.find(function(o){ return o.id===p.id; }), gs = useState(ini ? banhoPed(ini) || "Pontual" : "Pontual"), galv = gs[0];
  var vs = useState(""), sel = useState(ini ? [ini.id] : []), md = useState("iguais"), ls = useState([]);
  var cand = ped.filter(function(o){ return banhoPed(o)===galv || (ini && o.id===ini.id); }).sort(function(a, b){ return a.data<b.data ? 1 : a.data>b.data ? -1 : 0; }).slice(0, 40);
  var marcados = cand.filter(function(o){ return sel[0].indexOf(o.id)>=0; });
  var total = Math.round((parseFloat(String(vs[0]).replace(/\./g, "").replace(",", ".")) || 0)*100);
  var partes = marcados.length && total>0 ? dividirFatura(total, marcados, md[0]) : [];
  var parte = function(id){ var x = partes.find(function(q){ return q.id===id; }); return x ? x.cent/100 : null; };
  var semPeso = md[0]!=="iguais" && marcados.some(function(o){ return !(pesoDiv(o, md[0])>0); });
  var pronto = total>0 && marcados.length>0 && ls[0].length>0;
  var alterna = function(id){ sel[1](sel[0].indexOf(id)>=0 ? sel[0].filter(function(v){ return v!==id; }) : sel[0].concat([id])); };
  var ok = function(){
    if(!pronto) return;
    var tudo = partes.every(function(q){ return p.x.exec("ped_edit", {id:q.id, valorBanho:(q.cent/100).toFixed(2).replace(".", ","), faturasBanho:ls[0], faturaComum:{total:total/100, n:partes.length}}); });
    if(tudo) p.fechar();
  };
  return e(JanelaAzul,{t:"Fatura em comum", sub:"Uma fatura de banho para vários pedidos.", fechar:p.fechar},
    e("div",{className:"flex flex-wrap items-center justify-center gap-2"},
      e(Segmentado,{opcoes:[["Pontual", "Pontual"], ["Ellos", "Ellos"]], atual:galv, onMudar:function(v){ gs[1](v); sel[1](ini && banhoPed(ini)===v ? [ini.id] : []); }}),
      e("input",{value:vs[0], autoFocus:true, inputMode:"decimal", onChange:function(ev){ vs[1](ev.target.value); }, placeholder:"Valor total da fatura R$", "aria-label":"Valor total da fatura", className:CAMPO+" w-56"}),
      e(Segmentado,{opcoes:DIVISOES, atual:md[0], onMudar:md[1]})),
    e("p",{className:"text-center text-[13px]"}, "Marque os pedidos que estão nesta fatura."),
    cand.length ? e("div",{className:"flex max-h-72 flex-col gap-1 overflow-y-auto"}, cand.map(function(o){
      var on = sel[0].indexOf(o.id)>=0, v = parte(o.id);
      return e("label",{key:o.id, className:"flex min-h-8 cursor-pointer items-center justify-between gap-3 rounded-md border px-3 text-[13px] "+(on ? "border-primary bg-primary/10" : "border-border")},
        e("span",{className:"flex items-center gap-2"}, e("input",{type:"checkbox", checked:on, onChange:function(){ alterna(o.id); }, "aria-label":"Pedido "+o.forn+" "+(o.romaneio || "")}), e("b",null, o.forn), o.romaneio ? " · "+o.romaneio : "", " · "+dia(o.data)),
        e("span",{className:"tabular-nums"}, "Peças "+(pecasPedido(o) || "—")+" · Bruto "+brl(o.pagar)+(on && v!=null ? " · Banho " : ""), on && v!=null && e("b",null, brl(v))));
    })) : e(Vazio,{ic:"package"}, "Nenhum pedido desta galvânica."),
    semPeso && e("p",{className:"text-center text-[13px] font-semibold text-warning"}, "Tem pedido sem peças lançadas (ou sem valor). Neste caso a divisão sai em partes iguais."),
    e(Linha,{t:"Foto da fatura"}, e(AnexosCampo,{lista:ls[0], onMudou:function(l){ ls[1](l); }})),
    e("p",{className:"text-center text-[13px]"}, "Soma dos pedidos marcados: ", e("b",{className:"tabular-nums"}, brl(partes.reduce(function(s, q){ return s+q.cent; }, 0)/100)), " de ", e("b",{className:"tabular-nums"}, brl(total/100))),
    e("div",{className:"flex justify-center gap-2"}, e(Botao,{onClick:p.fechar}, "Cancelar"), e(Botao,{principal:true, desabilitado:!pronto, onClick:ok}, "Salvar fatura")));
}

// novo pedido (a escolha das peças com preço vem na tela Compras, a ser criada)
function NovoPedido(p){
  var nv = useState({forn:"", data:"", nota:"", romaneio:"", valor:"", desc:""}), v = nv[0];
  var campo = function(k, rot, extra){ return e("label",{className:"flex flex-col gap-0.5"}, e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, rot),
    e("input",Object.assign({value:v[k], onChange:function(ev){ var n = Object.assign({}, v); n[k] = ev.target.value; nv[1](n); }, "aria-label":rot, className:INP}, extra||{}))); };
  var lancar = function(){ if(p.x.exec("ped_add", {forn:v.forn, data:v.data || hojeISO(), nota:v.nota, romaneio:v.romaneio, valor:v.valor, desc:numPct(v.desc), status:"Escolha das peças"})) p.fechar(); };
  return e(JanelaAzul,{t:"Novo pedido de bruto", sub:"O pedido entra na etapa Escolha das peças. O valor pode ficar vazio até acabar a escolha.", fechar:p.fechar},
    e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-3"},
      campo("forn", "Fornecedor", {list:"cpc-forns"}), e("datalist",{id:"cpc-forns"}, p.forns.map(function(n){ return e("option",{key:n, value:n}); })),
      campo("data", "Data da compra", {type:"date"}), campo("nota", "Nota"), campo("romaneio", "Romaneio"), campo("valor", "Valor R$", {inputMode:"decimal"}), campo("desc", "Desconto %", {inputMode:"decimal"})),
    e("div",{className:"flex justify-center gap-2 pt-1"}, e(Botao,{onClick:p.fechar}, "Cancelar"), e(Botao,{principal:true, onClick:lancar}, "Lançar pedido")));
}
export { AbaPedidos, rotuloMes, dia, Zoom, NIVEIS_ZOOM };
