// Sorelly Admin · montagem — pages/Encomendas.js
// Encomendas e reposições → FUNIL DE PEDIDOS, no MESMO jeito do Financeiro › Contas a pagar (Marcus, 12/11/2026: "tudo mais compacto, jogue tudo lá pra cima, sem um monte de cores, com as coisas azul"):
// um bloco só (BlocoPainel, barra azul) e UMA faixa azul no alto com tudo junto: visão (Quadro | Planilha | Revendedoras), filtros do quadro, números do dia e os botões. Sem faixas coloridas por fase e sem zoom.
// Cor só para estado: vermelho = atrasado ou sem comprovante. O resto é o azul do sistema (--bloco-titulo e --bloco-colunas, em theme.css).
// Planilha = TabelaPlanilha (filtro e ordem em cada coluna). O quadro de cartões não tem cabeçalho de coluna da tabela, então os filtros dele são menus suspensos na faixa azul (sem bloco "Filtros" e sem busca no topo; a busca é o Ctrl+F do sistema).
// O cartão NÃO tem botão: clica no cartão, a ficha abre e tudo se faz nela (Detalhe em pages/encomendas/Quadro.js; Separar peças em pages/encomendas/Atencao.js).
// SEPARAR PEÇAS é um pedido normal que entra em Novo (estado s.er.atencao, regras em domain/encomendas.js, ops aten_*); aparece no quadro e na planilha junto com os outros.
// Cada canal tem o seu caminho (domain/encomendas.js → CAMINHOS). As 9 etapas do funil NÃO mudaram. Regras e contas em domain/encomendas.js (estado s.er).
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { FINAIS, FLUXO, fotoDaRevendedora, ROTULO_CANAL, ROTULO_STATUS, CANAIS, agoraSP, faltaComprovante, formatarDia, formatarReais, indicadoresEr, listaPedidos, minutosDe, minutosNaEtapa, revDe, revPorNome, textoTempo } from "@/apps/montagem/domain/encomendas";
import { Agendar, Atender, Detalhe, Motivo, NovoPedido, Revendedoras } from "@/apps/montagem/pages/encomendas/Quadro";
import { useEr } from "@/apps/montagem/pages/encomendas/visual";
import { Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { PlanilhaRev } from "@/apps/montagem/pages/encomendas/PlanilhaRev";
import { Janelas } from "@/apps/montagem/pages/encomendas/janelas";
import { FichaPedido } from "@/apps/montagem/pages/encomendas/FichaPedido";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { LinkPedido } from "@/apps/montagem/pages/encomendas/LinkPedido";
import { NovaSolicitacao } from "@/apps/montagem/pages/encomendas/NovaSolicitacao";
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { ETAPAS_SEP, Foto, JanelaSeparar } from "@/apps/montagem/pages/encomendas/Atencao";
import { e, useEffect, useRef, useState } from "@/shared/react";

// controles menores da faixa azul, iguais aos do Contas a pagar (Marcus, 12/11/2026)
var SEL = "h-7 rounded-md border border-white/50 bg-[#14233f] px-2 text-[13px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-white";   // padrao-ok: controles menores na faixa azul, como no Contas a pagar (Marcus, 12/11/2026)
var BTN = "h-7 whitespace-nowrap rounded-md border border-white/50 bg-[#14233f] px-2.5 text-[13px] font-semibold normal-case text-white hover:bg-white/15";   // padrao-ok: botões menores na faixa azul, como no Contas a pagar (Marcus, 12/11/2026)
var BTN_VISAO = "h-7 px-2.5 text-[13px] font-semibold normal-case ";   // padrao-ok: botões menores na faixa azul, como no Contas a pagar (Marcus, 12/11/2026)
var VAZIO_F = {canal:"", resp:"", grupo:"", tipo:""};
var LIMITE_COLUNA = 30, LIMITE_FIM = 8;   // coluna aberta mostra 30 cartões; Concluído e Recusado mostram 8 (têm centenas) e o botão Ver mais, para tudo ficar no alto da tela
var AZUL = "#2d5190", VERMELHO = "#f87171";
function plural(n, um, varios){ return n+" "+(n===1 ? um : varios); }
function chaveCanal(x){ return x.tipo==="separar" ? "separar" : x.tipo==="encomenda" ? "encomenda" : (x.canal || "entrega"); }
function faixaRotulo(x){ var k = chaveCanal(x); return k==="separar" ? "Separar peças" : k==="encomenda" ? "Encomenda · kit" : k==="representante" ? "Representante"+(x.representante ? " · "+x.representante : "") : ROTULO_CANAL[k]; }

// botões juntos numa caixa só (visão da tela), brancos sobre a faixa azul
function grupoBtn(ops, atual, aoMudar){
  return e("div",{className:"inline-flex overflow-hidden rounded-md border border-white/50"}, ops.map(function(o, i){ var on = atual===o[0];
    return e("button",{key:o[0], type:"button", "aria-pressed":on, onClick:function(){ aoMudar(o[0]); }, className:BTN_VISAO+(i ? "border-l border-white/50 " : "")+(on ? "bg-white text-[#14233f]" : "text-white hover:bg-white/15")}, o[1]); }));
}
var SEL_F = SEL.replace("text-[13px]", "text-[11px]"), BTN_F = BTN.replace("text-[13px]", "text-[11px]");   // faixa azul com letra de 11 px (Marcus, 17/11/2026)
function seletorF(rotulo, valor, aoMudar, opcoes){
  return e("select",{"aria-label":rotulo, value:valor, onChange:function(ev){ aoMudar(ev.target.value); }, className:SEL_F}, e("option",{value:""}, rotulo), opcoes.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }));
}
function seletor(rotulo, valor, aoMudar, opcoes){
  return e("select",{"aria-label":rotulo, value:valor, onChange:function(ev){ aoMudar(ev.target.value); }, className:SEL}, e("option",{value:""}, rotulo+": todos"), opcoes.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }));
}

// Nome no cartão: no máximo 4 nomes numa linha só (Marcus, 17/11/2026). "da", "de", "do", "dos", "das" e "e" não contam. Com mais de 4, ficam os 2 primeiros e os 2 últimos. O nome inteiro aparece ao passar o mouse e na ficha.
var PARTICULAS = {da:1, de:1, do:1, dos:1, das:1, e:1};
function nomeCurto(n){
  var p = String(n || "").trim().split(/\s+/), nomes = p.filter(function(w){ return !PARTICULAS[w.toLowerCase()]; });
  if(nomes.length<=4) return p.join(" ");
  var fica = nomes.slice(0, 2).concat(nomes.slice(-2));
  return fica.join(" ");
}
// cartão do quadro (17/11/2026, Marcus: "só o nome da vendedora e poucas informações, cada um com uma borda completa e mais compacto"): uma linha com o nome e o tempo na etapa; canal, responsável, média e taxa aparecem ao passar o mouse e na ficha. O cartão inteiro abre a ficha.
function CartaoE(p){
  var x = p.x, rev = p.rev, sep = x.tipo==="separar";
  var min = sep ? (x.mudou ? Math.max(0, Math.round(minutosDe(p.agora)-minutosDe(x.mudou))) : null) : minutosNaEtapa(x, p.agora), prazo = Number(p.prazo)*60;
  var atras = !FINAIS[x.status] && prazo>0 && min!=null && min>prazo, ate = x.atendInicio && !x.atendFim ? Math.max(0, Math.round(minutosDe(p.agora)-minutosDe(x.atendInicio))) : null, sem = !sep && x.status!=="novo" && faltaComprovante(x);
  var dica = [faixaRotulo(x)+(rev && rev.top50 ? " · Top 50" : ""), x.responsavel || "sem responsável"];
  if(!sep){
    if(x.tipo==="encomenda") dica.push(x.descricao || "Sem descrição"); else dica.push("Média "+(x.media3m!=null ? formatarReais(x.media3m) : "—")+" · Máx "+(x.valorMax>0 ? formatarReais(x.valorMax) : "—"));
    if(x.taxa>0) dica.push("Taxa "+formatarReais(x.taxa)+": "+(x.comprovante ? "paga" : "sem comprovante"));
    if(x.dataAgendada) dica.push("Agendado "+formatarDia(x.dataAgendada)+(x.hora ? " · "+x.hora : ""));
    if(ate!=null) dica.push((x.atendente || "Atendente")+" "+ate+"/"+p.limiteAt+" min");
  }
  var taxaTxt = x.tipo==="reposicao" && x.canal==="entrega" ? (x.taxa>0 ? "Taxa "+formatarReais(x.taxa) : "Sem taxa") : "";   // o cartão mostra se é para cobrar a taxa de reposição ou não
  var quem = x.responsavel ? (FINAIS[x.status] ? "Atendeu: " : "Atendendo: ")+x.responsavel : "Sem responsável";
  // o texto nunca passa da borda do cartão (Marcus, 17/11/2026): a linha 1 é só o nome (até 4 nomes); a linha 2 tem quem atende à esquerda e, à direita, a taxa e o tempo na etapa; o que sobrar é cortado pela borda, nunca sai dela
  var tempo = !FINAIS[x.status] && min!=null ? textoTempo(min) : "";
  // card em linhas (Marcus, 17/11/2026): foto da cliente à esquerda, ocupando a altura; nome, quem solicitou, quem atende, e a taxa com o tempo na etapa. Cada linha é uma só e nunca passa da borda.
  var solicitou = x.criadoPor || x.por || "";
  var linha = "block w-full whitespace-nowrap text-[11px] leading-tight";
  return e("button",{type:"button", title:x.revendedora+" · "+dica.join(" · "), onClick:p.abrir, className:"flex w-full cursor-pointer items-stretch gap-2 overflow-hidden rounded-lg border-2 bg-gradient-to-br from-[#2a4a80] to-[#16233d] p-1.5 text-left shadow-md "+(atras || sem ? "border-destructive" : "border-[#6f9be0]/70 hover:border-[#9bbcf0]")},
    p.perfil && e(Foto,{k:p.perfil.key, cls:"w-16 shrink-0 self-stretch rounded-md object-cover", alt:"Foto de "+x.revendedora}),
    e("span",{className:"flex min-w-0 flex-1 flex-col justify-center gap-1"},
      e("b",{className:"block w-full whitespace-nowrap text-[13px] font-semibold leading-tight"}, nomeCurto(x.revendedora)),
      solicitou && e("span",{className:linha}, "Solicitação: "+solicitou),
      e("span",{className:linha}, quem),
      (taxaTxt || tempo) && e("span",{className:linha+" tabular-nums"}, taxaTxt ? e("span",{className:"font-semibold "+(sem ? "text-destructive" : x.taxaIsenta || !(x.taxa>0) ? "text-success" : "")}, taxaTxt) : null, taxaTxt && tempo ? " · " : "", tempo ? e("span",{className:atras ? "font-semibold text-destructive" : ""}, tempo) : null)));
}

function AbaEncomendas(){
  var E = useEr(), s = E.s, er = E.er, cfg = E.cfg, md = useState(null), modal = md[0], mo = useState("quadro"), modo = mo[0], ft = useState(VAZIO_F), f = ft[0], tk = useState(0), svm = useState({}), vermais = svm[0];
  useEffect(function(){ var t = setInterval(function(){ tk[1](function(n){ return n+1; }); }, 30000); return function(){ clearInterval(t); }; }, []);
  var set = function(k, v){ ft[1](function(o){ var n = Object.assign({}, o); n[k] = v; return n; }); };
  var agora = agoraSP(), ind = indicadoresEr(s), ativo = !!(f.canal || f.resp || f.grupo || f.tipo);
  var repDe = function(x){ return (x.revendedoraId ? revDe(er, x.revendedoraId) : null) || revPorNome(er, x.revendedora); };
  var lista = f.canal==="separar" || f.tipo==="separar" ? [] : listaPedidos(s, {canal:f.canal, tipo:f.tipo}).filter(function(x){
    if(f.resp && x.responsavel!==f.resp) return false;
    if(f.grupo){ var r = repDe(x), top = !!(r && r.top50); if((f.grupo==="top50")!==top) return false; }
    return true; });
  // separar peças: pedidos do mesmo funil (entram em Novo); a ficha própria abre no clique
  var seps = (er.atencao || []).filter(function(a){
    if(f.canal && f.canal!=="separar") return false;
    if(f.tipo && f.tipo!=="separar") return false;
    if(f.resp && a.resp!==f.resp) return false;
    if(f.grupo){ var r = revPorNome(er, a.rev), top = !!(r && r.top50); if((f.grupo==="top50")!==top) return false; }
    return true; }).map(function(a){ return {id:a.id, tipo:"separar", revendedora:a.rev, responsavel:a.resp || "", status:a.status, mudou:a.mudou, criadoEm:a.em, por:a.por}; });
  var todos = lista.concat(seps);
  var base = (er.atencao || []).reduce(function(o, a){ if(a.resp) o[a.resp] = 1; return o; }, {"Agatha":1, "Elen":1, "Eduarda Gabriela":1});
  var resps = Object.keys(er.pedidos.reduce(function(o, x){ if(x.responsavel) o[x.responsavel] = 1; return o; }, base)).sort();
  var refE = useRef(E); refE.current = E;
  // PEDIDO POR LINK (17/11/2026): o que a revendedora enviou pela página pública entra no Funil sozinho. "Reivindicar" garante que só uma tela cria o pedido; se o sistema recusar, devolve para a fila.
  useEffect(function(){
    if(!apiAtiva()) return undefined; var vivo = true, rodando = false;
    var nomeCor = function(c){ return c ? c.charAt(0).toUpperCase()+c.slice(1) : ""; };
    var trazer = function(){
      if(rodando) return; rodando = true;
      chamar("GET", "/encomendas/link/recebidos").then(function(j){
        return (j.itens || []).reduce(function(p, it){
          return p.then(function(){
            if(!vivo) return null;
            return chamar("POST", "/encomendas/link/reivindicar", {id:it.id}).then(function(r){
              if(!r.ok) return null;
              var d = it.dados || {};
              var ok = refE.current.exec("ped_criar_link", {linkId:it.id, responsavel:"", pedido:{tipo:d.tipo || "reposicao", revendedora:it.revendedora, cod:it.cod, representante:it.representante, telefone:it.telefone, cidade:it.cidade, media3m:it.media, observacao:d.obs || "", aceite:!!d.aceite, entrega:d.entrega || null, retirada:d.retirada || null},
                fotos:(d.fotos || []).map(function(x){ return {key:x.key, nota:[nomeCor(x.cor), x.obs].filter(Boolean).join(" · ")}; }), textos:d.textos || []});
              if(!ok) return chamar("POST", "/encomendas/link/reivindicar", {id:it.id, desfazer:true});
              // só dá o pedido como entregue ao Funil depois de ver que ele chegou ao servidor (se a tela fechar antes, o link volta para a fila em 3 minutos)
              setTimeout(function(){
                chamar("GET", "/estado/er").then(function(g){
                  var ps = (g && g.conteudo && g.conteudo.pedidos) || [];
                  if(ps.some(function(x){ return x.linkId===it.id; })) return chamar("POST", "/encomendas/link/reivindicar", {id:it.id, confirmar:true});
                  return null;
                }).catch(function(){ /* tenta de novo quando o link voltar para a fila */ });
              }, 20000);
              return null;
            });
          });
        }, Promise.resolve());
      }).catch(function(x){ if(typeof console!=="undefined") console.warn("[pedido por link] não consegui trazer:", x && x.message ? x.message : x); }).then(function(){ rodando = false; });
    };
    trazer(); var t = setInterval(trazer, 20000);
    return function(){ vivo = false; clearInterval(t); };
  }, []);
  var ir = function(m){ md[1](m); };
  var abre = function(x){ if(x.tipo==="separar") ir({tipo:"separar", id:x.id}); else if(x.tipo==="reposicao" && x.canal==="entrega") ir({tipo:"ficha", id:x.id}); else ir({tipo:"detalhe", id:x.id}); };
  var minDe = function(x){ return x.tipo==="separar" ? (x.mudou ? Math.max(0, Math.round(minutosDe(agora)-minutosDe(x.mudou))) : null) : minutosNaEtapa(x, agora); };
  var atrasado = function(x){ var m = minDe(x); return !FINAIS[x.status] && cfg.prazoHoras>0 && m!=null && m>cfg.prazoHoras*60; };
  var abertos = todos.filter(function(x){ return !FINAIS[x.status]; }).length, atrasados = todos.filter(atrasado).length;
  // quadro: uma coluna por etapa (todas, mesmo vazias), todas no mesmo azul; "cancelado" junta recusado e cancelado
  var estaEtapa = function(x, k){ return k==="cancelado" ? (x.status==="cancelado" || x.status==="recusado") : x.status===k; };
  var PRINCIPAL = ["novo", "aceite", "separando", "comprovante", "bipagem", "liberado", "rota", "condicional", "concluido", "cancelado"];
  var ordem = FLUXO.concat(["cancelado"]), vis = ordem.filter(function(k){ return PRINCIPAL.indexOf(k)>=0 || todos.some(function(x){ return estaEtapa(x, k); }); });
  var colunas = vis.map(function(k){
    var it = todos.filter(function(x){ return estaEtapa(x, k); }), atrC = it.filter(atrasado).length, lim = k==="concluido" || k==="cancelado" ? LIMITE_FIM : LIMITE_COLUNA;
    return e("section",{key:k, className:"flex w-[350px] shrink-0 flex-col gap-1 pb-1"},   // sem borda na coluna: a borda é só dos cartões (Marcus, 17/11/2026)
      e("div",{className:"flex h-7 items-center justify-between gap-2 rounded-md bg-[var(--bloco-colunas)] px-2 text-[11px] font-bold uppercase"},
        e("span",{className:"whitespace-nowrap"}, (vis.indexOf(k)+1)+" · "+(k==="cancelado" ? "Recusado ou cancelado" : ROTULO_STATUS[k])),
        e("span",{className:"flex items-center gap-2 whitespace-nowrap tabular-nums"}, atrC>0 && e("span",{className:"text-destructive"}, plural(atrC, "atrasado", "atrasados")), e("span",null, String(it.length)))),
      e("div",{className:"flex flex-col gap-1 px-1"},
        (vermais[k] ? it : it.slice(0, lim)).map(function(x){ return e(CartaoE,{key:x.id, x:x, perfil:fotoDaRevendedora(er, x.revendedora), rev:x.tipo==="separar" ? revPorNome(er, x.revendedora) : repDe(x), agora:agora, prazo:cfg.prazoHoras, limiteAt:cfg.reposicao.minutosEscolha, abrir:function(){ abre(x); }}); }),
        !vermais[k] && it.length>lim && e("button",{type:"button", onClick:function(){ var n = Object.assign({}, vermais); n[k] = true; svm[1](n); }, className:"h-8 rounded-md border border-dashed border-white/30 text-[13px] hover:bg-white/10"}, "Ver mais · "+(it.length-lim))));
  });
  // as colunas vão até o fim da tela, tenham poucos ou muitos cartões (Marcus, 17/11/2026)
  var quadro = e("div",{className:"flex overflow-x-auto p-2", style:{minHeight:"calc(100vh - 8.5rem)"}}, e("div",{className:"flex items-stretch gap-2", style:{width:"max-content"}}, colunas));
  // planilha: TabelaPlanilha, filtro e ordem no título de cada coluna (nada de filtro no topo)
  var rotEtapa = function(x){ return x.tipo==="separar" ? (ETAPAS_SEP.filter(function(y){ return y[0]===x.status; })[0] || [0, x.status])[1] : ROTULO_STATUS[x.status]; };
  var linhas = todos.slice().sort(function(a, b){ var fa = FINAIS[a.status] ? 1 : 0, fb = FINAIS[b.status] ? 1 : 0; return fa-fb || String(b.criadoEm).localeCompare(String(a.criadoEm)); }).map(function(x){ var min = minDe(x), sep = x.tipo==="separar", sem = !sep && faltaComprovante(x), r = sep ? revPorNome(er, x.revendedora) : repDe(x);
    return {id:x.id, _x:x, data:String(x.criadoEm).slice(0, 10), rev:x.revendedora+(r && r.top50 ? " · Top 50" : ""), canal:faixaRotulo(x), resp:x.responsavel || "—", max:!sep && x.valorMax>0 ? formatarReais(x.valorMax) : "—",
      taxa:!sep && x.taxa>0 ? (x.comprovante ? "Paga " : "Falta ")+formatarReais(x.taxa) : !sep && x.taxaRep>0 ? "Rep. "+formatarReais(x.taxaRep) : "—", taxaRuim:sem, etapa:rotEtapa(x), tempo:!FINAIS[x.status] && min!=null ? textoTempo(min) : "—", atras:atrasado(x)}; });
  var cols = [{k:"data", t:"Pedido", fmt:formatarDia}, {k:"rev", t:"Revendedora"}, {k:"canal", t:"Canal"}, {k:"resp", t:"Responsável"}, {k:"max", t:"Valor máximo"},
    {k:"taxa", t:"Taxa", cor:function(l){ return l.taxa==="—" ? "" : l.taxaRuim ? "text-destructive" : "text-success"; }}, {k:"etapa", t:"Etapa"}, {k:"tempo", t:"Tempo", cor:function(l){ return l.atras ? "text-destructive" : ""; }}];
  var planilha = e(TabelaPlanilha,{key:"plan", cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, limite:300, aoClicar:function(l){ abre(l._x); }, vazio:"Nenhum pedido encontrado."});
  // Rota do João: o que está liberado, na rua ou voltando com a condicional assinada, com o botão da próxima etapa
  var linhasRota = er.pedidos.filter(function(x){ return x.tipo==="reposicao" && x.canal==="entrega" && ["liberado", "rota", "condicional"].indexOf(x.status)>=0; }).sort(function(a, b){ return String(a.etapaEm).localeCompare(String(b.etapaEm)); }).map(function(x){ var m = minutosNaEtapa(x, agora);
    return {id:x.id, _x:x, rev:x.revendedora, rep:x.representante || "—", cidade:x.cidade || "—", taxa:x.taxaIsenta ? "Isenta" : x.taxa>0 ? (x.comprovante ? "Paga " : "Falta ")+formatarReais(x.taxa) : "—", etapa:ROTULO_STATUS[x.status], tempo:m!=null ? textoTempo(m) : "—", acao:""}; });
  var PROX_ROTA = {liberado:["rota", "Saiu com o pedido"], rota:["condicional", "Condicional OK"], condicional:["concluido", "Concluir pedido"]};
  var colsRota = [{k:"rev", t:"Revendedora"}, {k:"rep", t:"Representante"}, {k:"cidade", t:"Cidade"}, {k:"taxa", t:"Taxa"}, {k:"etapa", t:"Etapa"}, {k:"tempo", t:"Tempo na etapa"},
    {k:"acao", t:"Ação", render:function(v, l){ var pr = PROX_ROTA[l._x.status]; return e(Botao,{principal:true, onClick:function(){ E.exec("ped_mover", {id:l.id, para:pr[0]}); }}, pr[1]); }}];
  var rota = e(TabelaPlanilha,{key:"rota", cols:colsRota, linhas:linhasRota, chave:"id", grade:true, semContagem:true, semCaixaAlta:true, aoClicar:function(l){ abre(l._x); }, vazio:"Nenhum pedido liberado para o João."});
  var itemSep = modal && modal.tipo==="separar" ? (er.atencao || []).find(function(a){ return a.id===modal.id; }) : null;
  // faixa azul única: visão, filtros do quadro (só no quadro), números do dia à direita e os botões
  // faixa azul única, numa linha só e com letra de 11 px: visão e filtros à esquerda, o título da tela no meio, números do dia e botões à direita
  var tituloTela = {quadro:"Funil de pedidos", rota:"Rota do João", planilha:"Planilha de pedidos", revendedoras:"Revendedoras"}[modo];
  // FAIXA AZUL (Marcus, 17/11/2026: "tudo gigante, uma bagunça: diminui, centraliza"): título no meio, e embaixo uma linha só, centralizada, com as escolhas, os números e os botões
  var faixa = e("div",{className:"flex flex-col items-center gap-1 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1.5 text-[11px] text-white"},
    e("h2",{className:"whitespace-nowrap text-[13px] font-bold uppercase leading-tight"}, tituloTela),
    e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
      e("select",{"aria-label":"Visão", value:modo, onChange:function(ev){ mo[1](ev.target.value); }, className:SEL_F+" w-24"}, [["quadro", "Quadro"], ["rota", "Rota do João"], ["planilha", "Planilha"], ["revendedoras", "Revendedoras"]].map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })),
      modo==="quadro" && seletorF("Canal", f.canal, function(v){ set("canal", v); }, CANAIS),
      modo==="quadro" && seletorF("Responsável", f.resp, function(v){ set("resp", v); }, resps.map(function(n){ return [n, n]; })),
      modo==="quadro" && seletorF("Grupo", f.grupo, function(v){ set("grupo", v); }, [["top50", "Top 50"], ["demais", "Demais"]]),
      modo==="quadro" && seletorF("Assunto", f.tipo, function(v){ set("tipo", v); }, [["reposicao", "Reposição"], ["encomenda", "Encomenda"]]),
      modo==="quadro" && ativo && e("button",{type:"button", onClick:function(){ ft[1](VAZIO_F); }, className:BTN_F}, "Limpar"),
      e("span",{className:"mx-1 whitespace-nowrap text-[11px] tabular-nums"}, "Em aberto ", e("b",null, String(abertos)), " · Atrasados ", e("b",{className:atrasados>0 ? "text-[var(--negativo)]" : ""}, String(atrasados)), " · Sem comprovante ", e("b",{className:ind.semComprovante>0 ? "text-[var(--negativo)]" : ""}, String(ind.semComprovante))),
      e("button",{type:"button", onClick:function(){ ir({tipo:"link"}); }, className:BTN_F}, "Link do pedido"),
      e("button",{type:"button", onClick:function(){ ir({tipo:"nova"}); }, className:BTN_F+" !bg-white !text-[#14233f]"}, "Nova solicitação")));
  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e(BlocoPainel,{titulo:"Funil de pedidos", compacto:true, semBarra:true},
      faixa,
      modo==="revendedoras" ? e(PlanilhaRev,{E:E, ir:ir}) : modo==="planilha" ? planilha : modo==="rota" ? rota : quadro),
    modal && modal.tipo==="ficha" && e(FichaPedido,{E:E, id:modal.id, ir:ir, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="link" && e(LinkPedido,{E:E, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="nova" && e(NovaSolicitacao,{E:E, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="novo" && e(NovoPedido,{E:E, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="separar" && (modal.id===null || itemSep) && e(JanelaSeparar,{key:modal.id || "novo", E:E, item:itemSep || null, resps:resps, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="motivo" && e(Motivo,{E:E, id:modal.id, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="agendar" && e(Agendar,{E:E, id:modal.id, mover:modal.mover, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="atender" && e(Atender,{E:E, id:modal.id, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="detalhe" && e(Detalhe,{E:E, id:modal.id, ir:ir, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="revs" && e(Revendedoras,{E:E, fechar:function(){ ir(null); }}),
    modal && (modal.tipo==="retirar" || modal.tipo==="solicitar" || modal.tipo==="msgsol" || modal.tipo==="bloquear") && e(Janelas,{E:E, modal:modal, ir:ir}));
}
export { AbaEncomendas, BTN, SEL, grupoBtn, seletor };
