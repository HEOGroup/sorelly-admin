// Sorelly Admin · montagem — pages/cadpecas/Pedidos.js
// Cadastro de peças → "Pedidos de bruto" (layout A+B escolhido pelo Marcus em 29/10/2026): Quadro por etapa e Planilha na mesma tela, faixa de totais e filtros no topo (mesmo desenho dos Kits novos).
// Etapas: Escolha, Separação, Fechado, Banho, Chegou (o pedido fecha no romaneio). Cada etapa agrupa os status detalhados (regras em domain/cadastro-pecas.js: ETAPAS_PED, etapaPed, statusDaEtapa).
// Quem lança: Rayssa e Graziella (config.quem.pedidos_bruto); a diretoria sempre pode. O status "Banhado" entra sozinho quando uma fatura de banho é ligada ao pedido.
// Editar chegadas, valores e peças por categoria: abrir a ficha do pedido (clique no cartão ou na linha).
import { Janela, Pagina } from "@/apps/montagem/components/padrao";
import { BlocoFiltros, Botao, CampoBusca, CampoSel, FaixaTotais, Segmentado, TabelaP, Td, Tr, brl } from "@/apps/montagem/components/padrao-fin";
import { hojeSP } from "@/apps/montagem/domain/cadastro-leads";
import { limiteDe, usoMes } from "@/apps/montagem/domain/pf-limite";
import { CATS, ETAPAS_PED, PRAZO_ETAPA, STATUS_PED, atrasadoPed, banhoPed, diasNaEtapa, etapaPed, mesesCpc, pecasPedido, podeFazer, statusDaEtapa } from "@/apps/montagem/domain/cadastro-pecas";
import { Cel, Sl, useCpc } from "@/apps/montagem/pages/cadpecas/visualCad";
import { Etiqueta } from "@/apps/montagem/pages/pf/ui";
import { Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { PageHead } from "@/apps/montagem/ui/page";
import { Kanban } from "@/shared/kanban";
import { e, useState } from "@/shared/react";

var INP = "h-8 w-full rounded-md border border-border bg-card px-2.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-primary";
var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
var VAZIO_F = {q:"", forn:"", banho:"", sit:""};
function rotuloMes(m){ var p = String(m).split("-"); return p.length===2 ? MESES[+p[1]-1]+" de "+p[0] : "Todos os meses"; }
function dia(iso){ var p = String(iso||"").split("-"); return p.length===3 ? p[2]+"/"+p[1] : "—"; }
function hojeISO(){ return hojeSP(); }
function numPct(t){ return String(t||"").trim()==="" ? 0 : parseFloat(String(t).replace(",", "."))/100 || 0; }
function proxima(p){ var i = ETAPAS_PED.findIndex(function(k){ return k[0]===etapaPed(p); }); return i>=0 && i<ETAPAS_PED.length-1 ? ETAPAS_PED[i+1][0] : null; }
function nomeEtapa(k){ return (ETAPAS_PED.find(function(x){ return x[0]===k; })||[])[1] || k; }
function dicaPrazo(k, itens, hoje){ var z = PRAZO_ETAPA[k], at = itens.filter(function(it){ return atrasadoPed(it.p, hoje); }).length; return (z ? "prazo "+z+" dias" : "")+(at ? (z ? " · " : "")+at+(at>1 ? " atrasados" : " atrasado") : ""); }

function AbaPedidos(){
  var x = useCpc(), c = x.c, s = x.s, meses = mesesCpc(c), pode = podeFazer(c, "pedidos_bruto", x.por, x.admin), hoje = hojeISO();
  var md = useState("quadro"), modo = md[0], fl = useState(Object.assign({mes:meses[0] || ""}, VAZIO_F)), f = fl[0], mo = useState(null), modal = mo[0];
  var set = function(k, v){ var n = Object.assign({}, f); n[k] = v; fl[1](n); };
  var forns = c.pedidos.map(function(p){ return p.forn; }).filter(function(v, i, a){ return a.indexOf(v)===i; }).sort();
  var q = f.q.trim().toLowerCase();
  // os que já chegaram aparecem só do mês escolhido; o que ainda está andando aparece sempre (nenhum pedido some do quadro por causa do mês)
  var vis = c.pedidos.filter(function(p){
    var chegou = etapaPed(p)==="chegou";
    return (!f.mes || !chegou || p.data.slice(0, 7)===f.mes) && (!f.forn || p.forn===f.forn) && (!f.banho || banhoPed(p)===f.banho)
      && (!q || (p.forn+" "+p.romaneio+" "+p.nota).toLowerCase().indexOf(q)>=0) && (!f.sit || (f.sit==="atr" ? atrasadoPed(p, hoje) : !chegou));
  }).sort(function(a, b){ return a.data<b.data ? 1 : a.data>b.data ? -1 : 0; });
  var doMes = c.pedidos.filter(function(p){ return !f.mes || p.data.slice(0, 7)===f.mes; });
  var comprado = doMes.reduce(function(t, p){ return t+p.pagar; }, 0);
  var folga = null; if(s.pf && f.mes){ var L = limiteDe(s.pf), U = usoMes(s.pf, f.mes); folga = L.cat.bruto-U.cat.bruto; }
  var atrasados = vis.filter(function(p){ return atrasadoPed(p, hoje); }).length;
  var ativo = !!(f.q || f.forn || f.banho || f.sit);
  var ir = function(m){ mo[1](m); };

  var avancar = function(p){
    var prox = proxima(p); if(!prox || !pode) return;
    if((etapaPed(p)==="escolha" || etapaPed(p)==="separacao") && prox!=="separacao" && !p.romaneio){ ir({tipo:"romaneio", id:p.id, para:prox}); return; }
    x.exec("ped_edit", {id:p.id, status:statusDaEtapa(p, prox)});
  };
  var mover = function(it, de, para){
    var p = it.p; if(!pode || etapaPed(p)===para) return;
    var vaiFechar = para!=="escolha" && para!=="separacao";
    if((etapaPed(p)==="escolha" || etapaPed(p)==="separacao") && vaiFechar && !p.romaneio){ ir({tipo:"romaneio", id:p.id, para:para}); return; }
    x.exec("ped_edit", {id:p.id, status:statusDaEtapa(p, para)});
  };
  var colunas = ETAPAS_PED.map(function(k){
    var itens = vis.filter(function(p){ return etapaPed(p)===k[0]; }).map(function(p){ return {id:p.id, p:p, arrastavel:pode}; });
    return {k:k[0], titulo:k[1], cor:k[0]==="chegou" ? "#4ADE80" : "#3B82F6", itens:itens, dica:dicaPrazo(k[0], itens, hoje)};
  });
  var quadro = e(Kanban,{colunas:colunas, onMover:mover, semMover:!pode, vazio:"Nenhum pedido nesta etapa.", unidade:["pedido", "pedidos"], onAbrir:function(it){ ir({tipo:"ficha", id:it.id}); },
    card:function(it){ return e(Cartao,{p:it.p, hoje:hoje, pode:pode, avancar:avancar}); }});

  var tot = vis.reduce(function(t, p){ t.valor += p.valor; t.pagar += p.pagar; t.pecas += pecasPedido(p); return t; }, {valor:0, pagar:0, pecas:0});
  var planilha = vis.length ? e(TabelaP,{minW:1080, cols:[{t:"Compra", w:76}, {t:"Fornecedor", w:130}, {t:"Romaneio", w:92}, {t:"Etapa", w:104}, {t:"Dias", w:56, n:true}, {t:"Peças", w:70, n:true}, {t:"Valor", w:116, n:true}, {t:"Desc.", w:66, n:true}, {t:"A pagar", w:116, n:true}, {t:"Banho", w:84}, {t:"", w:104}]},
    vis.slice(0, 300).map(function(p){ var et = etapaPed(p), prox = proxima(p);
      return e(Tr,{key:p.id, alerta:atrasadoPed(p, hoje), onClick:function(){ ir({tipo:"ficha", id:p.id}); }},
        e(Td,null, dia(p.data)), e(Td,{forte:true, title:p.forn}, p.forn), e(Td,null, p.romaneio || "—"), e(Td,{title:p.status}, nomeEtapa(et)),
        e(Td,{n:true}, et==="chegou" ? "—" : diasNaEtapa(p, hoje)), e(Td,{n:true}, pecasPedido(p) || "—"), e(Td,{n:true}, brl(p.valor)),
        e(Td,{n:true}, Math.round(p.desc*10000)/100+"%"), e(Td,{n:true, forte:true}, brl(p.pagar)), e(Td,null, banhoPed(p) || "—"),
        e(Td,null, pode && prox && e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); avancar(p); }, className:"h-8 rounded border border-border px-2 text-[13px] hover:bg-white/10"}, "Concluir ›")));
    }).concat([e(Tr,{key:"total", total:true}, e(Td,{forte:true}, "Total"), e(Td,null, vis.length+" pedido"+(vis.length===1 ? "" : "s")), e(Td,null), e(Td,null), e(Td,null), e(Td,{n:true, forte:true}, tot.pecas), e(Td,{n:true, forte:true}, brl(tot.valor)),
      e(Td,{n:true, forte:true}, tot.valor>0 ? Math.round((1-tot.pagar/tot.valor)*1000)/10+"%" : "—"), e(Td,{n:true, forte:true}, brl(tot.pagar)), e(Td,null), e(Td,null))])) : e(Vazio,{ic:"package"}, "Nenhum pedido neste filtro.");

  return e(Pagina,null,
    e(PageHead,{t:"Pedidos de bruto", sub:"Da escolha das peças até a chegada na Sorelly."},
      e(Segmentado,{opcoes:[["quadro", "Quadro"], ["planilha", "Planilha"]], atual:modo, onMudar:md[1]}),
      pode && e(Botao,{principal:true, onClick:function(){ ir({tipo:"novo"}); }}, "Novo pedido")),
    e("div",{className:"mx-auto w-full max-w-6xl"}, e(FaixaTotais,{itens:[
      {t:"Abertos", v:String(vis.filter(function(p){ return etapaPed(p)!=="chegou"; }).length)},
      {t:"Comprado", v:brl(comprado)},
      {t:"Folga do teto", v:folga==null ? "—" : brl(folga), cor:folga==null ? "" : folga<0 ? "text-destructive" : "text-success"},
      {t:"No banho", v:String(vis.filter(function(p){ return etapaPed(p)==="banho"; }).length)},
      {t:"Atrasados", v:String(atrasados), cor:atrasados>0 ? "text-destructive" : ""},
      {t:"Peças", v:tot.pecas.toLocaleString("pt-BR")}]})),
    e(BlocoFiltros,{onLimpar:ativo ? function(){ fl[1](Object.assign({mes:f.mes}, VAZIO_F)); } : undefined},
      e(CampoBusca,{id:"ped-busca", t:"Buscar", value:f.q, placeholder:"Fornecedor, romaneio ou nota", onChange:function(v){ set("q", v); }}),
      e(CampoSel,{id:"ped-forn", t:"Fornecedor", value:f.forn, onChange:function(v){ set("forn", v); }, opcoes:[["", "Todos"]].concat(forns.map(function(n){ return [n, n]; }))}),
      e(CampoSel,{id:"ped-banho", t:"Banho", value:f.banho, onChange:function(v){ set("banho", v); }, opcoes:[["", "Todos"], ["Pontual", "Pontual"], ["Ellos", "Ellos"]]}),
      e(CampoSel,{id:"ped-sit", t:"Situação", value:f.sit, onChange:function(v){ set("sit", v); }, opcoes:[["", "Todos"], ["aberto", "Em aberto"], ["atr", "Atrasados"]]}),
      e(CampoSel,{id:"ped-mes", t:"Mês da compra", value:f.mes, onChange:function(v){ set("mes", v); }, opcoes:[["", "Todos os meses"]].concat(meses.map(function(m){ return [m, rotuloMes(m)]; })), title:"Os pedidos que ainda estão andando aparecem sempre; o mês vale para os que já chegaram"})),
    !pode && e("p",{className:"text-center text-[13px] font-semibold"}, "Somente quem lança os pedidos edita."),
    modo==="planilha" ? planilha : quadro,
    modal && modal.tipo==="novo" && e(NovoPedido,{x:x, forns:forns, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="romaneio" && e(Romaneio,{x:x, id:modal.id, para:modal.para, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="ficha" && e(Ficha,{x:x, id:modal.id, pode:pode, hoje:hoje, avancar:avancar, fechar:function(){ ir(null); }}));
}

// cartão do quadro: fornecedor e dias na etapa, romaneio, valor a pagar, banho e o botão de avançar
function Cartao(p){
  var pd = p.p, et = etapaPed(pd), atr = atrasadoPed(pd, p.hoje), prox = proxima(pd), b = banhoPed(pd), semRom = (et==="escolha" || et==="separacao") && !pd.romaneio;
  return e("div",{className:"flex flex-col gap-1.5"},
    e("div",{className:"flex items-center justify-between gap-2"},
      e("b",{className:"truncate text-[13px]", title:pd.forn}, pd.forn),
      e("span",{className:"shrink-0 rounded px-1.5 text-[13px] font-bold "+(atr ? "bg-destructive text-white" : "bg-white/10"), title:atr ? "Atrasado" : "Dias nesta etapa"}, et==="chegou" ? dia(pd.chegSorelly) : diasNaEtapa(pd, p.hoje)+" d")),
    e("div",{className:"flex items-center justify-between gap-2 text-[13px]"}, e("span",{className:"truncate"}, pd.romaneio ? "Romaneio "+pd.romaneio : "Sem romaneio"), e("span",{className:"shrink-0"}, (pecasPedido(pd) || "—")+" peças")),
    e("div",{className:"flex items-baseline justify-between gap-2"}, e("b",{className:"text-[15px] tabular-nums"}, brl(pd.pagar)), e("span",{className:"text-[13px]"}, "Desc. "+Math.round(pd.desc*10000)/100+"%")),
    e("div",{className:"flex items-center justify-between gap-2 text-[13px]"}, e("span",{className:"truncate"}, b ? "Banho "+b : "Banho a definir"), e("span",{className:"shrink-0 truncate", title:pd.status}, pd.status)),
    p.pode && prox && e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); p.avancar(pd); }, className:"h-8 w-full rounded-md border border-primary bg-primary/20 text-[13px] font-semibold text-primary hover:bg-primary/30"}, semRom && prox!=="separacao" ? "Romaneio ›" : "Concluir ›"));
}

function Linha(p){ return e("div",{className:"flex items-center justify-between gap-2"}, e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, p.t), p.children); }
function Coluna(p){ return e("section",{className:"flex min-w-0 flex-col gap-2 rounded-xl bg-black/20 p-3 ring-1 ring-white/10"}, e("h3",{className:"border-b border-white/10 pb-1 text-center text-[11px] font-medium uppercase tracking-[.07em]"}, p.t), p.children); }

// ficha do pedido: dados (editáveis), etapas e ações
function Ficha(p){
  var x = p.x, pd = x.c.pedidos.find(function(o){ return o.id===p.id; }), ob = useState(null), pode = p.pode;
  if(!pd) return null;
  var set = function(k){ return function(v){ x.exec("ped_edit", Object.assign({id:pd.id}, (function(){ var o = {}; o[k] = v; return o; })())); }; };
  var et = etapaPed(pd), i0 = ETAPAS_PED.findIndex(function(k){ return k[0]===et; }), prox = proxima(pd);
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
    e(Linha,{t:"Chegou na Sorelly"}, e(Cel,{v:pd.chegSorelly, data:true, off:!pode, rot:"Chegada na Sorelly", w:"w-32", onSet:set("chegSorelly")})));
  var linha = e(Coluna,{key:"e", t:"Etapas"}, ETAPAS_PED.map(function(k, i){ var feito = i<i0, atual = i===i0, atr = atual && atrasadoPed(pd, p.hoje);
    return e("div",{key:k[0], className:"flex items-start gap-2.5 py-1"},
      e("span",{className:"mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-2 "+(feito ? "border-success bg-success" : atual ? "border-primary bg-primary" : "border-dashed border-white/50")}),
      e("div",{className:"min-w-0"}, e("b",{className:"block text-[13px]"}, k[1]),
        e("span",{className:"block text-[13px] "+(atr ? "font-semibold text-destructive" : "")}, feito ? "Concluída" : atual ? (et==="chegou" ? pd.status : diasNaEtapa(pd, p.hoje)+" dias nesta etapa"+(atr ? " · atrasado" : "")+" · "+pd.status) : PRAZO_ETAPA[k[0]] ? "Prazo de "+PRAZO_ETAPA[k[0]]+" dias" : ""))); }));
  var acoes = e(Coluna,{key:"a", t:"Ações"},
    pode && prox && e(Botao,{principal:true, onClick:function(){ p.avancar(pd); }}, "Concluir ›"),
    e(Linha,{t:"Status"}, e(Sl,{v:pd.status, set:set("status"), off:!pode, rot:"Status do pedido", opcoes:STATUS_PED.map(function(t){ return [t, t]; }), className:"w-44 h-8!"})),
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
    e("input",{value:v[0], autoFocus:true, onChange:function(ev){ v[1](ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") ok(); }, placeholder:"Romaneio", "aria-label":"Romaneio", className:INP+" text-center"}),
    e("div",{className:"flex justify-center gap-2"}, e(Botao,{onClick:p.fechar}, "Cancelar"), e(Botao,{principal:true, desabilitado:!v[0].trim(), onClick:ok}, "Fechar pedido")))]});
}

// novo pedido (a escolha das peças com preço vem na tela Compras, a ser criada)
function NovoPedido(p){
  var nv = useState({forn:"", data:"", nota:"", romaneio:"", valor:"", desc:""}), v = nv[0];
  var campo = function(k, rot, extra){ return e("label",{className:"flex flex-col gap-0.5"}, e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, rot),
    e("input",Object.assign({value:v[k], onChange:function(ev){ var n = Object.assign({}, v); n[k] = ev.target.value; nv[1](n); }, "aria-label":rot, className:INP}, extra||{}))); };
  var lancar = function(){ if(p.x.exec("ped_add", {forn:v.forn, data:v.data || hojeISO(), nota:v.nota, romaneio:v.romaneio, valor:v.valor, desc:numPct(v.desc), status:"Montando pedido"})) p.fechar(); };
  return e(Janela,{t:"Novo pedido de bruto", sub:"O pedido entra na etapa Escolha.", fechar:p.fechar, colunas:[e(Coluna,{key:"n", t:"Dados do pedido"},
    e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-3"},
      campo("forn", "Fornecedor", {list:"cpc-forns"}), e("datalist",{id:"cpc-forns"}, p.forns.map(function(n){ return e("option",{key:n, value:n}); })),
      campo("data", "Data da compra", {type:"date"}), campo("nota", "Nota"), campo("romaneio", "Romaneio"), campo("valor", "Valor R$", {inputMode:"decimal"}), campo("desc", "Desconto %", {inputMode:"decimal"})),
    e("div",{className:"flex justify-center gap-2 pt-1"}, e(Botao,{onClick:p.fechar}, "Cancelar"), e(Botao,{principal:true, onClick:lancar}, "Lançar pedido")))]});
}
export { AbaPedidos, rotuloMes, dia };
