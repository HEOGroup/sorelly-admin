// Sorelly Admin · montagem — pages/cadpecas/Pedidos.js
// Cadastro de peças → "Pedidos" (layout escolhido pelo Marcus em 03/11/2026, "opção 4 com fases"): quadro com as 12 etapas em 3 fases (Compra, Banho, Empresa), colunas finas que rolam para o lado, zoom no topo e cartão que abre.
// Sem faixa de totais e filtro numa linha só (regras de 02/11/2026). Também tem a Planilha (uma linha por pedido).
// Etapas e status: o status do pedido é o nome da etapa (regras em domain/cadastro-pecas.js: ETAPAS_PED, FASES_PED, etapaPed, statusDaEtapa). O pedido fecha no romaneio.
// Quem lança: Rayssa e Graziella (config.quem.pedidos_bruto); a diretoria sempre pode. "Enviado para Sorelly" entra sozinho quando uma fatura de banho é ligada ao pedido.
// Editar chegadas, valores e peças por categoria: botão "Abrir ficha" dentro do cartão (ou clique na linha da planilha).
import { Janela, Pagina } from "@/apps/montagem/components/padrao";
import { Botao, Segmentado, TabelaP, Td, Tr, brl } from "@/apps/montagem/components/padrao-fin";
import { hojeSP } from "@/apps/montagem/domain/cadastro-leads";
import { CATS, ETAPAS_PED, FASES_PED, STATUS_PED, atrasadoPed, banhoPed, chegouPed, diasNaEtapa, etapaPed, fasePed, mesesCpc, pecasPedido, podeFazer, prazoEtapa, statusDaEtapa } from "@/apps/montagem/domain/cadastro-pecas";
import { Cel, Sl, useCpc } from "@/apps/montagem/pages/cadpecas/visualCad";
import { Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useEffect, useRef, useState } from "@/shared/react";

var CAMPO = "h-8 rounded-md border border-border bg-card px-2.5 text-center text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-primary";
var INP = "w-full "+CAMPO;
var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
var VAZIO_F = {q:"", forn:"", banho:"", sit:""};
var COR_FASE = {compra:"#5B8DEF", banho:"#A78BFA", empresa:"#2DD4BF"};
var COR_BANHO = {Pontual:"#E8B84B", Ellos:"#60A5FA"};   // o nome da galvânica em dois tons: Pontual dourado e Ellos azul (Marcus, 03/11/2026)
var NIVEIS_ZOOM = [70, 80, 90, 100, 115, 130, 150];
var CHAVE_ZOOM = "sorelly_pedidos_zoom";
function rotuloMes(m){ var p = String(m).split("-"); return p.length===2 ? MESES[+p[1]-1]+" de "+p[0] : "Todos os meses"; }
function cap(t){ return t ? t.charAt(0).toUpperCase()+t.slice(1) : t; }
function dmy(iso){ var p = String(iso||"").split("-"); return p.length===3 ? p[2]+"/"+p[1]+"/"+p[0] : ""; }
function noPeriodo(p, per){ if(!per || per.tipo==="todos") return true; if(per.tipo==="mes") return !per.mes || p.data.slice(0, 7)===per.mes; return (!per.de || p.data>=per.de) && (!per.ate || p.data<=per.ate); }
function dia(iso){ var p = String(iso||"").split("-"); return p.length===3 ? p[2]+"/"+p[1] : "—"; }
function hojeISO(){ return hojeSP(); }
function numPct(t){ return String(t||"").trim()==="" ? 0 : parseFloat(String(t).replace(",", "."))/100 || 0; }
function proxima(p){ var i = ETAPAS_PED.findIndex(function(k){ return k[0]===etapaPed(p); }); return i>=0 && i<ETAPAS_PED.length-1 ? ETAPAS_PED[i+1][0] : null; }
function nomeEtapa(k){ return (ETAPAS_PED.find(function(x){ return x[0]===k; })||[])[1] || k; }
function diasDesde(iso, hoje){ var a = Date.parse(String(iso||"")+"T12:00:00"), b = Date.parse(String(hoje)+"T12:00:00"); return isNaN(a) || isNaN(b) ? 0 : Math.max(0, Math.round((b-a)/86400000)); }
function txtDias(n){ return n+(n===1 ? " dia" : " dias"); }
function lerZoom(){ try { var z = parseInt(window.localStorage.getItem(CHAVE_ZOOM), 10); return NIVEIS_ZOOM.indexOf(z)>=0 ? z : 100; } catch(x){ return 100; } }
function gravaZoom(z){ try { window.localStorage.setItem(CHAVE_ZOOM, String(z)); } catch(x){} }
function plural(n, um, varios){ return n+" "+(n===1 ? um : varios); }
function semRomaneio(p){ var et = etapaPed(p); return (et==="escolha" || et==="separacao") && !p.romaneio; }

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
    e("button",{type:"button", "aria-haspopup":"dialog", "aria-expanded":aberto, title:"Período da compra", onClick:function(){ op[1](!aberto); }, className:CAMPO+" w-52 hover:bg-white/10"}, rot+" ▾"),
    aberto && e("div",{role:"dialog", "aria-label":"Período da compra", className:"absolute left-0 top-full z-30 mt-1 flex w-72 flex-col gap-2 rounded-lg border border-border bg-popover p-2 text-center shadow-xl"},
      e("button",{type:"button", onClick:function(){ p.set({tipo:"todos", mes:per.mes, de:"", ate:""}); op[1](false); }, className:"h-8 rounded-md border text-[13px] hover:bg-white/10 "+(per.tipo==="todos" ? "border-primary bg-primary/20 font-semibold text-primary" : "border-border")}, "Todo o período"),
      e("div",{className:"flex flex-col gap-1"}, e("span",{className:ro}, "Por mês"),
        e("select",{"aria-label":"Mês da compra", value:per.tipo==="mes" ? per.mes : "", onChange:function(ev){ if(ev.target.value){ p.set({tipo:"mes", mes:ev.target.value, de:"", ate:""}); op[1](false); } }, className:CAMPO+" w-full"},
          e("option",{value:""}, "Escolha o mês"), p.meses.map(function(m){ return e("option",{key:m, value:m}, cap(rotuloMes(m))); }))),
      e("div",{className:"flex flex-col gap-1"}, e("span",{className:ro}, "Por data"),
        e("div",{className:"grid grid-cols-2 gap-2"},
          e("label",{className:"flex flex-col gap-0.5 text-[11px]"}, "De", e("input",{type:"date", "aria-label":"Data inicial", value:per.de, onChange:function(ev){ p.set({tipo:"datas", mes:per.mes, de:ev.target.value, ate:per.ate}); }, className:CAMPO+" w-full"})),
          e("label",{className:"flex flex-col gap-0.5 text-[11px]"}, "Até", e("input",{type:"date", "aria-label":"Data final", value:per.ate, onChange:function(ev){ p.set({tipo:"datas", mes:per.mes, de:per.de, ate:ev.target.value}); }, className:CAMPO+" w-full"})))),
      e("p",{className:"text-[11px]"}, "Os pedidos que ainda estão andando aparecem sempre. O período vale para os que já chegaram na Sorelly.")));
}

function AbaPedidos(){
  var x = useCpc(), c = x.c, cfg = c.config, meses = mesesCpc(c), pode = podeFazer(c, "pedidos_bruto", x.por, x.admin), hoje = hojeISO();
  var md = useState("quadro"), modo = md[0], fl = useState(Object.assign({per:{tipo:meses[0] ? "mes" : "todos", mes:meses[0] || "", de:"", ate:""}}, VAZIO_F)), f = fl[0], mo = useState(null), modal = mo[0];
  var zs = useState(lerZoom), zoom = zs[0], ab = useState({}), aberto = ab[0];
  var set = function(k, v){ var n = Object.assign({}, f); n[k] = v; fl[1](n); };
  var setZoom = function(z){ zs[1](z); gravaZoom(z); };
  var alterna = function(id){ var n = Object.assign({}, aberto); n[id] = !n[id]; ab[1](n); };
  var forns = c.pedidos.map(function(p){ return p.forn; }).filter(function(v, i, a){ return a.indexOf(v)===i; }).sort();
  var q = f.q.trim().toLowerCase();
  // os que já chegaram na Sorelly aparecem só do período escolhido (todo o período, um mês ou entre duas datas da compra); o que ainda está andando aparece sempre (nenhum pedido some do quadro por causa do período)
  var vis = c.pedidos.filter(function(p){
    var chegou = chegouPed(p);
    return (!chegou || noPeriodo(p, f.per)) && (!f.forn || p.forn===f.forn) && (!f.banho || banhoPed(p)===f.banho)
      && (!q || (p.forn+" "+p.romaneio+" "+p.nota).toLowerCase().indexOf(q)>=0) && (!f.sit || (f.sit==="atr" ? atrasadoPed(p, hoje, cfg) : etapaPed(p)!=="finalizado"));
  }).sort(function(a, b){ return a.data<b.data ? 1 : a.data>b.data ? -1 : 0; });
  var ativo = !!(f.q || f.forn || f.banho || f.sit);
  var ir = function(m){ mo[1](m); };

  var avancar = function(p){
    var prox = proxima(p); if(!prox || !pode) return;
    if(semRomaneio(p) && prox!=="separacao"){ ir({tipo:"romaneio", id:p.id, para:prox}); return; }
    x.exec("ped_edit", {id:p.id, status:statusDaEtapa(p, prox)});
  };

  var sel = function(id, rot, k, opcoes, title){ return e("select",{id:id, "aria-label":rot, title:title, value:f[k], onChange:function(ev){ set(k, ev.target.value); }, className:CAMPO+" w-52"},
    opcoes.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })); };
  var filtros = e("div",{className:"flex flex-wrap items-center justify-start gap-2"},
    e("input",{id:"ped-busca", type:"search", "aria-label":"Buscar", value:f.q, placeholder:"Buscar fornecedor, romaneio ou nota", onChange:function(ev){ set("q", ev.target.value); }, className:CAMPO+" w-80"}),
    sel("ped-forn", "Fornecedor do bruto", "forn", [["", "Fornecedores bruto"]].concat(forns.map(function(n){ return [n, n]; }))),
    sel("ped-banho", "Fornecedor do banho", "banho", [["", "Fornecedores banho"], ["Pontual", "Pontual"], ["Ellos", "Ellos"]]),
    sel("ped-sit", "Situação", "sit", [["", "Todas as situações"], ["aberto", "Em aberto"], ["atr", "Atrasados"]]),
    e(Periodo,{per:f.per, meses:meses, set:function(v){ set("per", v); }}),
    ativo && e(Botao,{onClick:function(){ fl[1](Object.assign({per:f.per}, VAZIO_F)); }}, "Limpar"));

  // ---- quadro: linha 1 = barra das fases, linha 2 = as 12 colunas ----
  var bandas = FASES_PED.map(function(fa){
    var idx = ETAPAS_PED.map(function(k, i){ return k[2]===fa[0] ? i : -1; }).filter(function(i){ return i>=0; });
    var it = vis.filter(function(p){ return fasePed(etapaPed(p))===fa[0]; }), tot = it.reduce(function(t, p){ return t+p.pagar; }, 0), at = it.filter(function(p){ return atrasadoPed(p, hoje, cfg); }).length, cor = COR_FASE[fa[0]];
    return e("div",{key:"f-"+fa[0], className:"relative h-9 overflow-hidden rounded-lg border", style:{gridRow:1, gridColumn:(idx[0]+1)+" / "+(idx[idx.length-1]+2), borderColor:cor, background:cor+"2E"}},
      e("span",{className:"sticky left-0 right-0 flex h-full items-center justify-center gap-2 whitespace-nowrap text-[13px]"}, e("b",null, fa[1]), e("span",{className:"tabular-nums"}, plural(it.length, "pedido", "pedidos")+" · "+brl(tot)+(at ? " · "+plural(at, "atrasado", "atrasados") : ""))));
  });
  var colunas = ETAPAS_PED.map(function(k, i){
    var cor = COR_FASE[k[2]], it = vis.filter(function(p){ return etapaPed(p)===k[0]; }), at = it.filter(function(p){ return atrasadoPed(p, hoje, cfg); }).length, tot = it.reduce(function(t, p){ return t+p.pagar; }, 0), z = prazoTxt(cfg, k[0]);
    return e("section",{key:k[0], className:"flex min-w-0 flex-col gap-1.5 rounded-xl bg-black/20 p-1.5 ring-1 ring-white/10", style:{gridRow:2, gridColumn:i+1, borderTop:"3px solid "+cor}},
      e("div",{className:"flex flex-col items-center gap-0.5 border-b border-white/10 pb-1.5 text-center"},
        e("b",{className:"flex min-h-9 items-center justify-center gap-1.5 text-[13px] leading-tight"}, e("span",{className:"grid size-5 shrink-0 place-items-center rounded-full text-[11px]", style:{border:"1px solid "+cor, color:cor}}, i+1), k[1]),
        e("span",{className:"text-[11px]"}, plural(it.length, "pedido", "pedidos")+(z ? " · prazo "+z : "")+(at ? " · "+plural(at, "atrasado", "atrasados") : "")),
        e("span",{className:"text-[11px] tabular-nums"}, brl(tot))),
      it.length ? it.map(function(p){ return e(Cartao,{key:p.id, p:p, cfg:cfg, hoje:hoje, pode:pode, aberto:!!aberto[p.id], alterna:alterna, avancar:avancar, ficha:function(){ ir({tipo:"ficha", id:p.id}); }}); })
        : e("p",{className:"py-2 text-center text-[13px]"}, "Nenhum pedido nesta etapa."));
  });
  var quadro = e("div",{className:"overflow-x-auto pb-2"}, e("div",{className:"grid items-start gap-x-2 gap-y-1.5", style:{gridTemplateColumns:"repeat("+ETAPAS_PED.length+", 280px)", gridTemplateRows:"auto 1fr", zoom:zoom/100, width:"max-content"}}, bandas, colunas));

  var tot = vis.reduce(function(t, p){ t.valor += p.valor; t.pagar += p.pagar; t.pecas += pecasPedido(p); return t; }, {valor:0, pagar:0, pecas:0});
  var planilha = vis.length ? e(TabelaP,{minW:1280, cols:[{t:"Compra", w:76}, {t:"Fornecedor", w:130}, {t:"Romaneio", w:92}, {t:"Etapa", w:250}, {t:"Dias", w:56}, {t:"Peças", w:70}, {t:"Valor", w:116}, {t:"Desc.", w:66}, {t:"A pagar", w:116}, {t:"Banho", w:84}, {t:"", w:104}]},
    vis.slice(0, 300).map(function(p){ var et = etapaPed(p), prox = proxima(p);
      return e(Tr,{key:p.id, alerta:atrasadoPed(p, hoje, cfg), onClick:function(){ ir({tipo:"ficha", id:p.id}); }},
        e(Td,null, dia(p.data)), e(Td,{forte:true}, p.forn), e(Td,null, p.romaneio || "—"), e(Td,null, nomeEtapa(et)),
        e(Td,null, et==="finalizado" ? "—" : diasNaEtapa(p, hoje)), e(Td,null, pecasPedido(p) || "—"), e(Td,null, brl(p.valor)),
        e(Td,null, Math.round(p.desc*10000)/100+"%"), e(Td,{forte:true}, brl(p.pagar)), e(Td,null, banhoPed(p) || "—"),
        e(Td,null, pode && prox && e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); avancar(p); }, className:"h-8 rounded border border-border px-2 text-[13px] hover:bg-white/10"}, "Concluir ›")));
    }).concat([e(Tr,{key:"total", total:true}, e(Td,{forte:true}, "Total"), e(Td,null, plural(vis.length, "pedido", "pedidos")), e(Td,null), e(Td,null), e(Td,null), e(Td,{forte:true}, tot.pecas), e(Td,{forte:true}, brl(tot.valor)),
      e(Td,{forte:true}, tot.valor>0 ? Math.round((1-tot.pagar/tot.valor)*1000)/10+"%" : "—"), e(Td,{forte:true}, brl(tot.pagar)), e(Td,null), e(Td,null))])) : e(Vazio,{ic:"package"}, "Nenhum pedido neste filtro.");

  return e(Pagina,null,
    e(PageHead,{t:"Pedidos de bruto e banho", sub:"Da escolha das peças até o cadastro na Sorelly."},
      modo==="quadro" && e(Zoom,{z:zoom, set:setZoom}),
      e(Segmentado,{opcoes:[["quadro", "Quadro"], ["planilha", "Planilha"]], atual:modo, onMudar:md[1]}),
      pode && e(Botao,{principal:true, onClick:function(){ ir({tipo:"novo"}); }}, "Novo pedido")),
    filtros,
    !pode && e("p",{className:"text-center text-[13px] font-semibold"}, "Somente quem lança os pedidos edita."),
    modo==="planilha" ? planilha : quadro,
    modal && modal.tipo==="novo" && e(NovoPedido,{x:x, forns:forns, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="romaneio" && e(Romaneio,{x:x, id:modal.id, para:modal.para, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="ficha" && e(Ficha,{x:x, id:modal.id, pode:pode, hoje:hoje, cfg:cfg, avancar:avancar, fechar:function(){ ir(null); }}));
}

// texto do prazo de uma etapa: "5 dias"; no Banho, o de cada galvânica
function prazoTxt(cfg, k){
  if(k==="banho"){ var a = prazoEtapa(cfg, k, {chegPontual:"x"}), b = prazoEtapa(cfg, k, {chegEllos:"x"}); if(!a && !b) return ""; return a===b ? a+" dias" : "Pontual "+(a || "—")+" · Ellos "+(b || "—")+" dias"; }
  var z = prazoEtapa(cfg, k); return z ? z+" dias" : "";
}
function Par(p){ return [e("span",{key:"r", className:"text-[11px] font-medium uppercase tracking-[.04em]"}, p.t), e("span",{key:"v", className:"text-right text-[13px] font-bold"}, p.v)]; }

// cartão do quadro: fechado = fornecedor, valor e dias; clicando abre os detalhes e o botão de avançar
function Cartao(p){
  var pd = p.p, et = etapaPed(pd), atr = atrasadoPed(pd, p.hoje, p.cfg), prox = proxima(pd), b = banhoPed(pd), cor = COR_FASE[fasePed(et)];
  var chegBanho = pd.chegPontual ? "Pontual "+dia(pd.chegPontual) : pd.chegEllos ? "Ellos "+dia(pd.chegEllos) : "—";
  return e("div",{"data-sem-arrastar":true, className:"rounded-lg bg-card text-center ring-1 "+(atr ? "ring-destructive" : "ring-white/10 hover:ring-white/30"), style:{boxShadow:"inset 3px 0 0 "+cor}},
    e("button",{type:"button", "aria-expanded":p.aberto, onClick:function(){ p.alterna(pd.id); }, className:"flex min-h-8 w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 px-2 py-1 pl-3 text-[13px]"},
      e("span",{className:"whitespace-nowrap"}, e("span",{className:"font-semibold", style:b ? {color:COR_BANHO[b]} : undefined}, b || "A definir"), " · ", e("b",null, pd.forn)),
      e("span",{className:"whitespace-nowrap text-[11px] tabular-nums"}, brl(pd.pagar)),
      e("b",{className:"whitespace-nowrap text-[11px] "+(atr ? "text-destructive" : ""), title:atr ? "Atrasado" : "Dias nesta etapa"}, et==="finalizado" ? "Concluído" : txtDias(diasNaEtapa(pd, p.hoje)))),
    p.aberto && e("div",{className:"flex flex-col gap-1.5 border-t border-white/10 py-1.5 pl-3 pr-2"},
      e("div",{className:"grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-0.5 text-left"},
        e(Par,{t:"Romaneio", v:pd.romaneio || "—"}), e(Par,{t:"Comprado em", v:dia(pd.data)}), e(Par,{t:"Dias desde a compra", v:diasDesde(pd.data, p.hoje)}),
        e(Par,{t:"Nota", v:pd.nota || "—"}), e(Par,{t:"Valor da lista", v:brl(pd.valor)}), e(Par,{t:"Desconto", v:Math.round(pd.desc*10000)/100+"%"}),
        e(Par,{t:"Peças", v:pecasPedido(pd) || "—"}), e(Par,{t:"Banho", v:e("span",{style:b ? {color:COR_BANHO[b]} : undefined}, b || "a definir")}), e(Par,{t:"Chegada no banho", v:chegBanho}),
        e(Par,{t:"Data que o banho conta", v:pd.contaBanho ? dia(pd.contaBanho) : "—"}), e(Par,{t:"Chegada na Sorelly", v:pd.chegSorelly ? dia(pd.chegSorelly) : "—"})),
      e("div",{className:"flex flex-col gap-1.5"},
        p.pode && prox && e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); p.avancar(pd); }, className:"h-8 w-full rounded-md border border-primary bg-primary/20 text-[13px] font-semibold text-primary hover:bg-primary/30"}, semRomaneio(pd) && prox!=="separacao" ? "Romaneio ›" : "Concluir ›"),
        e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); p.ficha(); }, className:"h-8 w-full rounded-md border border-border text-[13px] hover:bg-white/10"}, "Abrir ficha"))));
}

function Linha(p){ return e("div",{className:"flex items-center justify-between gap-2"}, e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, p.t), p.children); }
function Coluna(p){ return e("section",{className:"flex min-w-0 flex-col gap-2 rounded-xl bg-black/20 p-3 ring-1 ring-white/10"}, e("h3",{className:"border-b border-white/10 pb-1 text-center text-[11px] font-medium uppercase tracking-[.07em]"}, p.t), p.children); }

// ficha do pedido: dados (editáveis), etapas e ações
function Ficha(p){
  var x = p.x, pd = x.c.pedidos.find(function(o){ return o.id===p.id; }), ob = useState(null), pode = p.pode;
  if(!pd) return null;
  var set = function(k){ return function(v){ x.exec("ped_edit", Object.assign({id:pd.id}, (function(){ var o = {}; o[k] = v; return o; })())); }; };
  var et = etapaPed(pd), i0 = ETAPAS_PED.findIndex(function(k){ return k[0]===et; }), prox = proxima(pd), gal = banhoPed(pd);
  var dados = e(Coluna,{key:"d", t:"Dados"},
    e(Linha,{t:"Compra"}, e(Cel,{v:pd.data, data:true, off:!pode, rot:"Data da compra", w:"w-32", onSet:set("data")})),
    e(Linha,{t:"Fornecedor"}, e(Cel,{v:pd.forn, texto:true, off:!pode, rot:"Fornecedor", w:"w-32", onSet:set("forn")})),
    e(Linha,{t:"Nota"}, e(Cel,{v:pd.nota, texto:true, off:!pode, rot:"Nota", w:"w-32", onSet:set("nota")})),
    e(Linha,{t:"Romaneio"}, e(Cel,{v:pd.romaneio, texto:true, off:!pode, rot:"Romaneio", w:"w-32", onSet:set("romaneio")})),
    e(Linha,{t:"Valor R$"}, e(Cel,{v:pd.valor, off:!pode, rot:"Valor do pedido", w:"w-32", onSet:set("valor")})),
    e(Linha,{t:"Desconto %"}, e(Cel,{v:Math.round(pd.desc*10000)/100, off:!pode, rot:"Desconto em %", w:"w-32", onSet:set("desc")})),
    e(Linha,{t:"A pagar"}, e("b",{className:"tabular-nums"}, brl(pd.pagar))),
    e(Linha,{t:"Chegou na Pontual"}, e(Cel,{v:pd.chegPontual, data:true, off:!pode, rot:"Chegada na Pontual", w:"w-32", onSet:set("chegPontual")})),
    e(Linha,{t:"Chegou na Ellos"}, e(Cel,{v:pd.chegEllos, data:true, off:!pode, rot:"Chegada na Ellos", w:"w-32", onSet:set("chegEllos")})),
    e(Linha,{t:"Data que "+(gal ? "a "+gal : "o banho")+" conta"}, e(Cel,{v:pd.contaBanho, data:true, off:!pode, rot:"Data que o banho conta", w:"w-32", onSet:set("contaBanho")})),
    e(Linha,{t:"Chegou na Sorelly"}, e(Cel,{v:pd.chegSorelly, data:true, off:!pode, rot:"Chegada na Sorelly", w:"w-32", onSet:set("chegSorelly")})));
  var linha = e(Coluna,{key:"e", t:"Etapas"}, ETAPAS_PED.map(function(k, i){ var feito = i<i0, atual = i===i0, atr = atual && atrasadoPed(pd, p.hoje, p.cfg), cor = COR_FASE[k[2]];
    return e("div",{key:k[0], className:"flex items-start gap-2.5 py-0.5"},
      e("span",{className:"mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-2", style:feito ? {borderColor:"#4ADE80", background:"#4ADE80"} : atual ? {borderColor:cor, background:cor} : {borderColor:cor, borderStyle:"dashed"}}),
      e("div",{className:"min-w-0"}, e("b",{className:"block text-[13px]"}, k[1]),
        e("span",{className:"block text-[13px] "+(atr ? "font-semibold text-destructive" : "")}, feito ? "Concluída" : atual ? (et==="finalizado" ? "Pedido finalizado" : txtDias(diasNaEtapa(pd, p.hoje))+" nesta etapa"+(atr ? " · atrasado" : "")) : prazoTxt(p.cfg, k[0]) ? "Prazo de "+prazoTxt(p.cfg, k[0]) : ""))); }));
  var acoes = e(Coluna,{key:"a", t:"Ações"},
    pode && prox && e(Botao,{principal:true, onClick:function(){ p.avancar(pd); }}, "Concluir ›"),
    e(Linha,{t:"Status"}, e(Sl,{v:pd.status, set:set("status"), off:!pode, rot:"Status do pedido", opcoes:STATUS_PED.map(function(t){ return [t, t]; }), className:"w-56 h-8!"})),
    e("button",{type:"button", onClick:function(){ ob[1](!ob[0]); }, className:"h-8 rounded-md border border-border text-[13px] hover:bg-white/10"}, "Peças por categoria · "+(pecasPedido(pd) || "0")),
    ob[0] && e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-1"}, CATS.map(function(k){ return e("label",{key:k[0], className:"flex items-center justify-between gap-1 text-[13px]"}, k[1], e(Cel,{v:pd.cats[k[0]] || "", dica:"0", off:!pode, rot:k[1], w:"w-14", onSet:function(q){ x.exec("ped_edit", {id:pd.id, cat:k[0], qtd:q}); }})); })),
    e(Linha,{t:"Observação"}), e(Cel,{v:pd.obs, texto:true, off:!pode, rot:"Observação", w:"w-full", onSet:set("obs")}),
    pode && e(Botao,{onClick:function(){ if(window.confirm("Remover o pedido de "+pd.forn+"?")){ x.exec("ped_del", {id:pd.id}); p.fechar(); } }}, "Remover pedido"));
  return e(Janela,{t:"Pedido de "+pd.forn, sub:(pd.romaneio ? "Romaneio "+pd.romaneio+" · " : "")+nomeEtapa(et), fechar:p.fechar, colunas:[dados, linha, acoes]});
}

// pedir o romaneio antes de fechar o pedido (o pedido fecha no romaneio)
function Romaneio(p){
  var pd = p.x.c.pedidos.find(function(o){ return o.id===p.id; }), v = useState("");
  if(!pd) return null;
  var ok = function(){ if(p.x.exec("ped_edit", {id:pd.id, romaneio:v[0], status:statusDaEtapa(pd, p.para)})) p.fechar(); };
  return e(Janela,{t:"Romaneio do pedido", sub:pd.forn, fechar:p.fechar, colunas:[e(Coluna,{key:"r", t:"Fechar o pedido"},
    e("p",{className:"text-center text-[13px]"}, "Informe o número do romaneio para fechar o pedido."),
    e("input",{value:v[0], autoFocus:true, onChange:function(ev){ v[1](ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") ok(); }, placeholder:"Romaneio", "aria-label":"Romaneio", className:INP}),
    e("div",{className:"flex justify-center gap-2"}, e(Botao,{onClick:p.fechar}, "Cancelar"), e(Botao,{principal:true, desabilitado:!v[0].trim(), onClick:ok}, "Fechar pedido")))]});
}

// novo pedido (a escolha das peças com preço vem na tela Compras, a ser criada)
function NovoPedido(p){
  var nv = useState({forn:"", data:"", nota:"", romaneio:"", valor:"", desc:""}), v = nv[0];
  var campo = function(k, rot, extra){ return e("label",{className:"flex flex-col gap-0.5"}, e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, rot),
    e("input",Object.assign({value:v[k], onChange:function(ev){ var n = Object.assign({}, v); n[k] = ev.target.value; nv[1](n); }, "aria-label":rot, className:INP}, extra||{}))); };
  var lancar = function(){ if(p.x.exec("ped_add", {forn:v.forn, data:v.data || hojeISO(), nota:v.nota, romaneio:v.romaneio, valor:v.valor, desc:numPct(v.desc), status:"Escolha das peças"})) p.fechar(); };
  return e(Janela,{t:"Novo pedido de bruto", sub:"O pedido entra na etapa Escolha das peças.", fechar:p.fechar, colunas:[e(Coluna,{key:"n", t:"Dados do pedido"},
    e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-3"},
      campo("forn", "Fornecedor", {list:"cpc-forns"}), e("datalist",{id:"cpc-forns"}, p.forns.map(function(n){ return e("option",{key:n, value:n}); })),
      campo("data", "Data da compra", {type:"date"}), campo("nota", "Nota"), campo("romaneio", "Romaneio"), campo("valor", "Valor R$", {inputMode:"decimal"}), campo("desc", "Desconto %", {inputMode:"decimal"})),
    e("div",{className:"flex justify-center gap-2 pt-1"}, e(Botao,{onClick:p.fechar}, "Cancelar"), e(Botao,{principal:true, onClick:lancar}, "Lançar pedido")))]});
}
export { AbaPedidos, rotuloMes, dia };
