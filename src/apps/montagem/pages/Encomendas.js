// Sorelly Admin · montagem — pages/Encomendas.js
// Encomendas e reposições → FUNIL DE PEDIDOS, layout 2 (09/11/2026, Marcus): MESMO FORMATO da tela Cadastro de peças › Pedidos: tudo num bloco com borda, título com os botões à direita, filtros numa linha,
// faixas coloridas por FASE (Entrada, Preparo, Atendimento, Fim) que abrem e fecham, colunas numeradas. As 9 etapas do funil NÃO mudaram (a fase é só visual).
// O cartão NÃO tem botão: clica no cartão, a ficha abre e tudo se faz nela (Detalhe em pages/encomendas/Quadro.js; Separar peças em pages/encomendas/Atencao.js).
// SEPARAR PEÇAS é um pedido normal que entra em Novo (estado s.er.atencao, regras em domain/encomendas.js, ops aten_*); aparece no quadro e na planilha junto com os outros.
// Cada canal tem o seu caminho (domain/encomendas.js → CAMINHOS). Regras e contas em domain/encomendas.js (estado s.er).
import { Pagina } from "@/apps/montagem/components/padrao";
import { Botao, CampoSel, FileiraCampos, Segmentado, TabelaCampos } from "@/apps/montagem/components/padrao-fin";
import { FINAIS, FLUXO, ROTULO_CANAL, ROTULO_STATUS, CANAIS, agoraSP, faltaComprovante, formatarDia, formatarReais, indicadoresEr, listaPedidos, minutosDe, minutosNaEtapa, revDe, revPorNome, textoTempo } from "@/apps/montagem/domain/encomendas";
import { Agendar, Atender, Detalhe, Motivo, NovoPedido, Revendedoras } from "@/apps/montagem/pages/encomendas/Quadro";
import { useEr } from "@/apps/montagem/pages/encomendas/visual";
import { Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { PlanilhaRev } from "@/apps/montagem/pages/encomendas/PlanilhaRev";
import { Janelas } from "@/apps/montagem/pages/encomendas/janelas";
import { ETAPAS_SEP, JanelaSeparar } from "@/apps/montagem/pages/encomendas/Atencao";
import { NIVEIS_ZOOM, Zoom } from "@/apps/montagem/pages/cadpecas/Pedidos";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useEffect, useState } from "@/shared/react";

var CAMPO_BARRA = "h-8 rounded-md border border-border bg-card px-2.5 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary";
var VAZIO_F = {busca:"", canal:"", resp:"", grupo:"", tipo:""};
// fases do funil (só visual): cada fase tem as suas etapas, na ordem do fluxo; "cancelado" junta recusado e cancelado
var FASES = [["entrada", "Entrada", ["novo", "conferindo", "comprovante"], "#5B8DEF"], ["preparo", "Preparo", ["separando", "agendado"], "#A78BFA"],
  ["atendimento", "Atendimento", ["representante", "atendimento", "bipagem"], "#2DD4BF"], ["fim", "Fim", ["concluido", "cancelado"], "#4CC38A"]];
var LIMITE_COLUNA = 30;   // cada coluna mostra 30 cartões e o botão Ver mais (a Concluída tem centenas)
var CHAVE_FASES = "sorelly_funil_fases", CHAVE_ZOOM = "sorelly_funil_zoom";
function lerFases(){ try { var o = JSON.parse(window.localStorage.getItem(CHAVE_FASES) || "null"); if(o && typeof o==="object") return o; } catch(x){} return {}; }   // false = fechada; padrão: TODAS as fases abertas (Marcus, 09/11/2026: o Fim fechado parecia que o histórico tinha sumido)
function gravaFases(o){ try { window.localStorage.setItem(CHAVE_FASES, JSON.stringify(o)); } catch(x){} }
function lerZoom(){ try { var z = parseInt(window.localStorage.getItem(CHAVE_ZOOM), 10); return NIVEIS_ZOOM.indexOf(z)>=0 ? z : 100; } catch(x){ return 100; } }
function gravaZoom(z){ try { window.localStorage.setItem(CHAVE_ZOOM, String(z)); } catch(x){} }
function plural(n, um, varios){ return n+" "+(n===1 ? um : varios); }
function chaveCanal(x){ return x.tipo==="separar" ? "separar" : x.tipo==="encomenda" ? "encomenda" : (x.canal || "entrega"); }
function faixaRotulo(x){ var k = chaveCanal(x); return k==="separar" ? "Separar peças" : k==="encomenda" ? "Encomenda · kit" : k==="representante" ? "Representante"+(x.representante ? " · "+x.representante : "") : ROTULO_CANAL[k]; }

// cartão do quadro (sem botão e sem foto): nome e tempo, canal e responsável, e só os detalhes que existem. O cartão inteiro abre a ficha.
function CartaoE(p){
  var x = p.x, rev = p.rev, sep = x.tipo==="separar", cor = p.cor;
  var min = sep ? (x.mudou ? Math.max(0, Math.round(minutosDe(p.agora)-minutosDe(x.mudou))) : null) : minutosNaEtapa(x, p.agora), prazo = Number(p.prazo)*60;
  var atras = !FINAIS[x.status] && prazo>0 && min!=null && min>prazo, ate = x.atendInicio && !x.atendFim ? Math.max(0, Math.round(minutosDe(p.agora)-minutosDe(x.atendInicio))) : null, sem = !sep && faltaComprovante(x);
  var det = [];
  if(!sep){
    if(x.tipo==="encomenda") det.push(e("span",{key:"d"}, x.descricao || "Sem descrição"));
    else det.push(e("span",{key:"m", className:"tabular-nums"}, "Média "+(x.media3m!=null ? formatarReais(x.media3m) : "—")+" · Máx "+(x.valorMax>0 ? formatarReais(x.valorMax) : "—")));
    if(x.taxa>0) det.push(e("span",{key:"t", className:"font-semibold "+(sem ? "text-destructive" : "text-success")}, "Taxa "+formatarReais(x.taxa)+": "+(x.comprovante ? "paga" : "sem comprovante")));
    if(x.taxaRep>0) det.push(e("span",{key:"r"}, "Rep. "+formatarReais(x.taxaRep)));
    if(x.dataAgendada) det.push(e("span",{key:"a"}, "Agendado "+formatarDia(x.dataAgendada)+(x.hora ? " · "+x.hora : "")));
    if(ate!=null) det.push(e("span",{key:"e", className:"font-semibold "+(ate>p.limiteAt ? "text-destructive" : "text-success")}, (x.atendente || "Atendente")+" "+ate+"/"+p.limiteAt+" min"));
  }
  return e("button",{type:"button", title:"Abrir o pedido", onClick:p.abrir, className:"flex min-h-8 w-full cursor-pointer flex-col justify-center gap-0.5 rounded-lg bg-card px-2 py-1 pl-3 text-left ring-1 "+(atras ? "ring-destructive" : "ring-white/10 hover:ring-white/30"), style:{boxShadow:"inset 3px 0 0 "+(atras ? "#EF4444" : cor)}},
    e("span",{className:"flex w-full items-baseline justify-between gap-2"},
      e("b",{className:"min-w-0 break-words text-[13px] leading-tight"}, x.revendedora),
      e("span",{className:"shrink-0 text-[11px] tabular-nums "+(atras ? "font-semibold text-destructive" : "")}, !FINAIS[x.status] && min!=null ? textoTempo(min) : "")),
    e("span",{className:"text-[11px]"}, faixaRotulo(x)+(rev && rev.top50 ? " · Top 50" : "")+" · "+(x.responsavel || "sem responsável")),
    det.length>0 && e("span",{className:"flex flex-wrap gap-x-2 text-[11px]"}, det));
}

function AbaEncomendas(){
  var E = useEr(), s = E.s, er = E.er, cfg = E.cfg, md = useState(null), modal = md[0], mo = useState("quadro"), modo = mo[0], ft = useState(VAZIO_F), f = ft[0], tk = useState(0), fl = useState(false);
  var sfa = useState(lerFases), fases = sfa[0], szm = useState(lerZoom), zoom = szm[0], svm = useState({}), vermais = svm[0];
  useEffect(function(){ var t = setInterval(function(){ tk[1](function(n){ return n+1; }); }, 30000); return function(){ clearInterval(t); }; }, []);
  var set = function(k, v){ ft[1](function(o){ var n = Object.assign({}, o); n[k] = v; return n; }); };
  var agora = agoraSP(), ind = indicadoresEr(s), ativo = !!(f.busca || f.canal || f.resp || f.grupo || f.tipo);
  var repDe = function(x){ return (x.revendedoraId ? revDe(er, x.revendedoraId) : null) || revPorNome(er, x.revendedora); };
  var lista = f.canal==="separar" || f.tipo==="separar" ? [] : listaPedidos(s, {busca:f.busca, canal:f.canal, tipo:f.tipo}).filter(function(x){
    if(f.resp && x.responsavel!==f.resp) return false;
    if(f.grupo){ var r = repDe(x), top = !!(r && r.top50); if((f.grupo==="top50")!==top) return false; }
    return true; });
  // separar peças: pedidos do mesmo funil (entram em Novo); a ficha própria abre no clique
  var q = String(f.busca || "").trim().toLowerCase();
  var seps = (er.atencao || []).filter(function(a){
    if(f.canal && f.canal!=="separar") return false;
    if(f.tipo && f.tipo!=="separar") return false;
    if(f.resp && a.resp!==f.resp) return false;
    if(f.grupo){ var r = revPorNome(er, a.rev), top = !!(r && r.top50); if((f.grupo==="top50")!==top) return false; }
    return !q || String(a.rev).toLowerCase().indexOf(q)>=0; }).map(function(a){ return {id:a.id, tipo:"separar", revendedora:a.rev, responsavel:a.resp || "", status:a.status, mudou:a.mudou, criadoEm:a.em, por:a.por}; });
  var todos = lista.concat(seps);
  var base = (er.atencao || []).reduce(function(o, a){ if(a.resp) o[a.resp] = 1; return o; }, {"Agatha":1, "Elen":1, "Eduarda Gabriela":1});
  var resps = Object.keys(er.pedidos.reduce(function(o, x){ if(x.responsavel) o[x.responsavel] = 1; return o; }, base)).sort();
  var ir = function(m){ md[1](m); };
  var abre = function(x){ if(x.tipo==="separar") ir({tipo:"separar", id:x.id}); else ir({tipo:"detalhe", id:x.id}); };
  var minDe = function(x){ return x.tipo==="separar" ? (x.mudou ? Math.max(0, Math.round(minutosDe(agora)-minutosDe(x.mudou))) : null) : minutosNaEtapa(x, agora); };
  var atrasado = function(x){ var m = minDe(x); return !FINAIS[x.status] && cfg.prazoHoras>0 && m!=null && m>cfg.prazoHoras*60; };
  var abertos = todos.filter(function(x){ return !FINAIS[x.status]; }).length, atrasados = todos.filter(atrasado).length;
  var setFase = function(k, v){ var n = Object.assign({}, fases); n[k] = v; sfa[1](n); gravaFases(n); };
  var aberta = function(k){ return fases[k]!==false; };
  var todasAbertas = FASES.every(function(fa){ return aberta(fa[0]); });
  var alternaTodas = function(){ var n = {}; FASES.forEach(function(fa){ n[fa[0]] = !todasAbertas; }); sfa[1](n); gravaFases(n); };
  var setZoom = function(z){ szm[1](z); gravaZoom(z); };
  // quadro: linha 1 = faixas das fases, linha 2 = colunas numeradas (só as que têm pedido); fase fechada mostra só a faixa com o resumo
  var estaEtapa = function(x, k){ return k==="cancelado" ? (x.status==="cancelado" || x.status==="recusado") : x.status===k; };
  var ordem = FLUXO.concat(["cancelado"]), faixas = [], colunas = [], trilhas = [], pos = 0;
  FASES.forEach(function(fa){
    var itensFase = todos.filter(function(x){ return fa[2].some(function(k){ return estaEtapa(x, k); }); }), atr = itensFase.filter(atrasado).length, ab = aberta(fa[0]);
    var vis = fa[2].filter(function(k){ return todos.some(function(x){ return estaEtapa(x, k); }); });
    var resumo = fa[2].map(function(k){ var n = todos.filter(function(x){ return estaEtapa(x, k); }).length; return n>0 ? n+" "+(k==="cancelado" ? "recusado ou cancelado" : (ROTULO_STATUS[k] || k).toLowerCase()) : ""; }).filter(Boolean).join(" · ");
    var tog = e("button",{type:"button", "aria-expanded":ab, "aria-label":(ab ? "Fechar " : "Abrir ")+"a fase "+fa[1], title:ab ? "Fechar a fase" : "Abrir a fase", onClick:function(){ setFase(fa[0], !ab); }, className:"grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-card text-[13px] hover:bg-white/10"}, ab ? "▾" : "▸");
    var corpoFaixa = e("span",{className:"flex h-full items-center gap-3 whitespace-nowrap text-[13px]"}, tog, e("b",null, fa[1]), e("b",{className:"tabular-nums"}, plural(itensFase.length, "pedido", "pedidos")), atr>0 && e("span",{className:"text-destructive"}, atr+(atr>1 ? " atrasados" : " atrasado")), !ab && resumo && e("span",{className:"ml-4 tabular-nums"}, resumo));
    if(!ab || !vis.length){   // fase fechada (ou sem nenhum pedido): só a faixa, com o botão para abrir e fechar
      pos++; trilhas.push("max-content"); faixas.push(e("div",{key:"f-"+fa[0], className:"flex h-9 items-center overflow-hidden rounded-lg border px-1", style:{gridRow:1, gridColumn:pos, borderColor:fa[3], background:fa[3]+"2E"}}, corpoFaixa)); return; }
    var ini = pos+1; pos += vis.length; vis.forEach(function(){ trilhas.push("300px"); });
    faixas.push(e("div",{key:"f-"+fa[0], className:"relative flex h-9 items-center overflow-hidden rounded-lg border px-1", style:{gridRow:1, gridColumn:ini+" / "+(pos+1), borderColor:fa[3], background:fa[3]+"2E"}}, corpoFaixa));
    vis.forEach(function(k, j){
      var it = todos.filter(function(x){ return estaEtapa(x, k); }), atrC = it.filter(atrasado).length, num = ordem.indexOf(k)+1;
      colunas.push(e("section",{key:k, className:"flex min-w-0 flex-col gap-1.5 rounded-xl bg-black/20 p-1.5 ring-1 ring-white/10", style:{gridRow:2, gridColumn:ini+j, borderTop:"3px solid "+fa[3]}},
        e("div",{className:"flex flex-col items-center gap-0.5 border-b border-white/10 pb-1.5 text-center"},
          e("b",{className:"flex min-h-8 items-center justify-center gap-1.5 text-[13px] leading-tight"}, e("span",{className:"grid size-5 shrink-0 place-items-center rounded-full text-[11px]", style:{border:"1px solid "+fa[3], color:fa[3]}}, num), k==="cancelado" ? "Recusado ou cancelado" : ROTULO_STATUS[k]),
          e("span",{className:"text-[13px] font-semibold"}, plural(it.length, "pedido", "pedidos")),
          atrC>0 && e("span",{className:"text-[11px] text-destructive"}, atrC+(atrC>1 ? " atrasados" : " atrasado"))),
        (vermais[k] ? it : it.slice(0, LIMITE_COLUNA)).map(function(x){ return e(CartaoE,{key:x.id, x:x, rev:x.tipo==="separar" ? revPorNome(er, x.revendedora) : repDe(x), agora:agora, prazo:cfg.prazoHoras, limiteAt:cfg.reposicao.minutosEscolha, cor:fa[3], abrir:function(){ abre(x); }}); }),
        !vermais[k] && it.length>LIMITE_COLUNA && e("button",{type:"button", onClick:function(){ var n = Object.assign({}, vermais); n[k] = true; svm[1](n); }, className:"h-8 rounded-md border border-dashed border-border text-[13px] hover:bg-white/10"}, "Ver mais · "+(it.length-LIMITE_COLUNA))));
    });
  });
  var quadro = todos.length ? e("div",{className:"overflow-x-auto pb-2"}, e("div",{className:"grid items-start gap-x-2 gap-y-1.5", style:{gridTemplateColumns:trilhas.join(" "), gridTemplateRows:"auto 1fr", zoom:zoom/100, width:"max-content"}}, faixas, colunas)) : e(Vazio,{ic:"clipboard-text"}, "Nenhum pedido encontrado.");
  // planilha em layout D (TabelaCampos + FileiraCampos): colunas de largura fixa, nada quebra, tudo centralizado
  var planilha = todos.length ? e(TabelaCampos,{minW:"1240px", cols:[{t:"Pedido", w:"90px"}, {t:"Revendedora", w:"1fr"}, {t:"Canal", w:"170px"}, {t:"Responsável", w:"140px"}, {t:"Valor máximo", w:"130px"}, {t:"Taxa", w:"160px"}, {t:"Etapa", w:"190px"}, {t:"Tempo", w:"90px"}]},
    todos.slice(0, 300).map(function(x){ var min = minDe(x), sep = x.tipo==="separar", sem = !sep && faltaComprovante(x), r = sep ? revPorNome(er, x.revendedora) : repDe(x);
      return e(FileiraCampos,{key:x.id, onClick:function(){ abre(x); }, cells:[formatarDia(String(x.criadoEm).slice(0, 10)), e("b",null, x.revendedora+(r && r.top50 ? " · Top 50" : "")),
        sep ? "Separar peças" : x.tipo==="encomenda" ? "Encomenda" : ROTULO_CANAL[x.canal] || "—", x.responsavel || "—", !sep && x.valorMax>0 ? formatarReais(x.valorMax) : "—",
        !sep && x.taxa>0 ? {v:(x.comprovante ? "Paga " : "Falta ")+formatarReais(x.taxa), cor:sem ? "#F87171" : "#4ADE80"} : !sep && x.taxaRep>0 ? "Rep. "+formatarReais(x.taxaRep) : "—",
        sep ? (ETAPAS_SEP.filter(function(y){ return y[0]===x.status; })[0] || [0, x.status])[1] : ROTULO_STATUS[x.status], !FINAIS[x.status] && min!=null ? textoTempo(min) : "—"]});
    })) : e(Vazio,{ic:"clipboard-text"}, "Nenhum pedido encontrado.");
  var nFiltros = (f.grupo ? 1 : 0)+(f.tipo ? 1 : 0);
  var barra = e("div",{className:"flex flex-wrap items-center gap-2"},
    e("input",{type:"search", "aria-label":"Buscar", value:f.busca, placeholder:"Buscar revendedora, representante ou encomenda", onChange:function(ev){ set("busca", ev.target.value); }, className:CAMPO_BARRA+" w-80"}),
    e("select",{"aria-label":"Canal", value:f.canal, onChange:function(ev){ set("canal", ev.target.value); }, className:CAMPO_BARRA+" w-52"}, e("option",{value:""}, "Canal: todos"), CANAIS.concat([["separar", "Separar peças"]]).map(function(c){ return e("option",{key:c[0], value:c[0]}, c[1]); })),
    e("select",{"aria-label":"Responsável", value:f.resp, onChange:function(ev){ set("resp", ev.target.value); }, className:CAMPO_BARRA+" w-52"}, e("option",{value:""}, "Responsável: todas"), resps.map(function(n){ return e("option",{key:n, value:n}, n); })),
    e("div",{className:"relative"},
      e("button",{type:"button", "aria-expanded":fl[0], onClick:function(){ fl[1](!fl[0]); }, className:CAMPO_BARRA+" w-52 text-center hover:bg-white/10"}, "Grupo e assunto ▾"+(nFiltros ? " · "+nFiltros : "")),
      fl[0] && e("div",{className:"absolute left-0 top-full z-30 mt-1 grid w-64 gap-2 rounded-lg border border-border bg-popover p-3 shadow-xl"},
        e(CampoSel,{id:"enc-grupo", t:"Grupo", value:f.grupo, onChange:function(v){ set("grupo", v); }, opcoes:[["", "Todos"], ["top50", "Top 50"], ["demais", "Demais"]]}),
        e(CampoSel,{id:"enc-tipo", t:"Assunto", value:f.tipo, onChange:function(v){ set("tipo", v); }, opcoes:[["", "Todos"], ["reposicao", "Reposição"], ["encomenda", "Encomenda"], ["separar", "Separar peças"]]}))),
    ativo && e(Botao,{onClick:function(){ ft[1](VAZIO_F); }}, "Limpar"),
    e("span",{className:"ml-auto whitespace-nowrap text-[13px]"}, "Em aberto ", e("b",null, String(abertos)), " · Atrasados ", e("b",{className:atrasados>0 ? "text-destructive" : ""}, String(atrasados)), " · Sem comprovante ", e("b",{className:ind.semComprovante>0 ? "text-destructive" : ""}, String(ind.semComprovante))));
  var itemSep = modal && modal.tipo==="separar" ? (er.atencao || []).find(function(a){ return a.id===modal.id; }) : null;
  return e(Pagina,null,
    e("section",{className:"flex flex-col gap-3 rounded-lg border-2 border-white/30 bg-card/60 p-3"},   // tudo da tela num bloco só com borda, como o Pedidos de bruto e banho
      e(PageHead,{t:"Funil de pedidos", sub:"Reposição e encomenda: do pedido até a entrega."},
        modo==="quadro" && e(Botao,{onClick:alternaTodas}, todasAbertas ? "Fechar todas as fases" : "Abrir todas as fases"),
        modo==="quadro" && e(Zoom,{z:zoom, set:setZoom}),
        e(Segmentado,{opcoes:[["quadro", "Quadro"], ["planilha", "Planilha"], ["revendedoras", "Revendedoras"]], atual:modo, onMudar:mo[1]}),
        e(Botao,{onClick:function(){ ir({tipo:"separar", id:null}); }}, "Separar peças"),
        e(Botao,{principal:true, onClick:function(){ ir({tipo:"novo"}); }}, "Novo pedido")),
      modo==="revendedoras" ? e(PlanilhaRev,{E:E, ir:ir}) : null,
      modo!=="revendedoras" && barra,
      modo==="revendedoras" ? null : modo==="planilha" ? planilha : quadro),
    modal && modal.tipo==="novo" && e(NovoPedido,{E:E, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="separar" && (modal.id===null || itemSep) && e(JanelaSeparar,{key:modal.id || "novo", E:E, item:itemSep || null, resps:resps, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="motivo" && e(Motivo,{E:E, id:modal.id, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="agendar" && e(Agendar,{E:E, id:modal.id, mover:modal.mover, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="atender" && e(Atender,{E:E, id:modal.id, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="detalhe" && e(Detalhe,{E:E, id:modal.id, ir:ir, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="revs" && e(Revendedoras,{E:E, fechar:function(){ ir(null); }}),
    modal && (modal.tipo==="retirar" || modal.tipo==="solicitar" || modal.tipo==="msgsol" || modal.tipo==="bloquear") && e(Janelas,{E:E, modal:modal, ir:ir}));
}
export { AbaEncomendas };
