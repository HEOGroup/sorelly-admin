// Sorelly Admin · montagem — pages/Encomendas.js
// Encomendas e reposições → FUNIL DE PEDIDOS (22/10/2026). Mesmo desenho dos Kits novos: título com seletor Quadro/Planilha e botão, faixa de totais, bloco Filtros e quadro de colunas (Kanban padrão).
// Cada canal tem o seu caminho (domain/encomendas.js → CAMINHOS). Cartão no modelo "faixa do canal": faixa colorida, nome e sobrenome, telefone, média, valor máximo, taxa e botão de avançar.
// As janelas (novo pedido, agendar, atender, detalhe, revendedoras) ficam em pages/encomendas/Quadro.js. Regras e contas em domain/encomendas.js (estado s.er).
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoFiltros, Botao, CampoBusca, CampoSel, FaixaTotais, Segmentado, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { COR_STATUS, FINAIS, FLUXO, ROTULO_CANAL, ROTULO_STATUS, ROTULO_TIPO, STATUS, CANAIS, agoraSP, faltaComprovante, formatarDia, formatarReais, indicadoresEr, listaPedidos, minutosDe, minutosNaEtapa, proximaEtapa, proximosStatus, revDe, revPorNome, textoTempo } from "@/apps/montagem/domain/encomendas";
import { Agendar, Atender, Detalhe, Motivo, NovoPedido, Revendedoras, avancarPedido } from "@/apps/montagem/pages/encomendas/Quadro";
import { useEr } from "@/apps/montagem/pages/encomendas/visual";
import { Selo, Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { PlanilhaRev } from "@/apps/montagem/pages/encomendas/PlanilhaRev";
import { Janelas } from "@/apps/montagem/pages/encomendas/janelas";
import { PageHead } from "@/apps/montagem/ui/page";
import { Kanban } from "@/shared/kanban";
import { e, useEffect, useState } from "@/shared/react";

var COR_CANAL = {entrega:["#14B8A6", "#06312C"], representante:["#7F77DD", "#FFFFFF"], empresa:["#EF9F27", "#412402"], encomenda:["#F97316", "#2A1204"]};
var ACAO = {conferindo:"Conferir ›", agendado:"Agendar ›", atendimento:"Iniciar atendimento ›", concluido:"Concluir ›"};
var VAZIO_F = {busca:"", canal:"", resp:"", grupo:"", tipo:""};

function chaveCanal(x){ return x.tipo==="encomenda" ? "encomenda" : (x.canal || "entrega"); }
function faixaRotulo(x){ var k = chaveCanal(x); return k==="encomenda" ? "Encomenda · kit" : k==="representante" ? "Representante"+(x.representante ? " · "+x.representante : "") : ROTULO_CANAL[k]; }
function kv(rot, val){ return e("div",{className:"min-w-0 rounded-md bg-black/30 px-2 py-1"}, e("div",{className:"truncate text-[10px] font-medium uppercase tracking-[.05em] text-white/70"}, rot), e("div",{className:"truncate text-[13px] font-semibold tabular-nums", title:val}, val)); }

// cartão no modelo "faixa do canal" (opção E)
function CartaoE(p){
  var x = p.x, rev = p.rev, cor = COR_CANAL[chaveCanal(x)], min = minutosNaEtapa(x, p.agora), prazo = Number(p.prazo)*60, atras = !FINAIS[x.status] && prazo>0 && min!=null && min>prazo;
  var prox = proximaEtapa(x), sem = faltaComprovante(x), trava = (x.status==="conferindo" && !x.conferido) ? false : (x.status==="comprovante" && sem);
  var ate = x.atendInicio && !x.atendFim ? Math.max(0, Math.round(minutosDe(p.agora)-minutosDe(x.atendInicio))) : null;
  var tel = rev && rev.telefone;
  return e("div",{className:"flex flex-col items-center gap-1.5", style:{minWidth:0}},
    e("div",{className:"-mx-2.5 -mt-2.5 mb-0.5 flex items-center justify-between gap-2 rounded-t-lg px-2.5 py-1 text-[11.5px] font-semibold", style:{background:cor[0], color:cor[1], width:"calc(100% + 1.25rem)"}},
      e("span",{className:"truncate", title:faixaRotulo(x)}, faixaRotulo(x)), e("span",{className:"shrink-0"}, !FINAIS[x.status] && min!=null ? textoTempo(min)+(atras ? " (atrasado)" : "") : "")),
    e("b",{className:"break-words text-[15px] leading-tight"}, x.revendedora),
    rev && rev.top50 && e(Selo,{cor:"#14B8A6", ic:"star"}, "Top 50"),
    tel && e("span",{className:"text-[12px] text-white/80", title:"Telefone"}, "Tel. "+tel),
    x.tipo==="encomenda"
      ? e("span",{className:"break-words text-[12px] text-white/85"}, x.descricao || "Sem descrição")
      : e("div",{className:"grid w-full grid-cols-2 gap-1.5"}, kv("Média", x.media3m!=null ? formatarReais(x.media3m) : "—"), kv("Máximo", x.valorMax>0 ? formatarReais(x.valorMax) : "—")),
    x.taxa>0 && e("span",{className:"text-[12px] font-semibold "+(sem ? "text-destructive" : "text-success")}, "Taxa "+formatarReais(x.taxa)+": "+(x.comprovante ? "paga" : "sem comprovante")),
    x.taxaRep>0 && e("span",{className:"text-[12px] text-white/85"}, "Pagamento à representante: "+formatarReais(x.taxaRep)),
    x.dataAgendada && e("span",{className:"text-[12px] text-white/85"}, "Agendado: "+formatarDia(x.dataAgendada)+(x.hora ? " · "+x.hora : "")),
    ate!=null && e("span",{className:"text-[12px] font-semibold "+(ate>p.limiteAt ? "text-destructive" : "text-success")}, (x.atendente || "Atendente")+": "+ate+" de "+p.limiteAt+" min"),
    e("span",{className:"text-[11.5px] text-white/70"}, "Resp.: "+(x.responsavel || "—")),
    prox && e("button",{type:"button", disabled:trava, title:trava ? "Anexe o comprovante da taxa para liberar" : undefined,
      onClick:function(ev){ ev.stopPropagation(); p.avancar(x); },
      className:"h-8 w-full rounded-md border px-2 text-[13px] font-semibold "+(trava ? "cursor-not-allowed border-border bg-white/5 text-white/50" : "border-primary bg-primary/20 text-primary hover:bg-primary/30")}, trava ? "Aguardando comprovante" : (x.status==="conferindo" && !x.conferido) ? "Conferir média ›" : (ACAO[prox] || "Concluir etapa ›")));
}

function AbaEncomendas(){
  var E = useEr(), s = E.s, er = E.er, cfg = E.cfg, md = useState(null), modal = md[0], mo = useState("quadro"), modo = mo[0], ft = useState(VAZIO_F), f = ft[0], tk = useState(0);
  useEffect(function(){ var t = setInterval(function(){ tk[1](function(n){ return n+1; }); }, 30000); return function(){ clearInterval(t); }; }, []);
  var set = function(k, v){ ft[1](function(o){ var n = Object.assign({}, o); n[k] = v; return n; }); };
  var agora = agoraSP(), ind = indicadoresEr(s), ativo = !!(f.busca || f.canal || f.resp || f.grupo || f.tipo);
  var repDe = function(x){ return (x.revendedoraId ? revDe(er, x.revendedoraId) : null) || revPorNome(er, x.revendedora); };
  var lista = listaPedidos(s, {busca:f.busca, canal:f.canal, tipo:f.tipo}).filter(function(x){
    if(f.resp && x.responsavel!==f.resp) return false;
    if(f.grupo){ var r = repDe(x), top = !!(r && r.top50); if((f.grupo==="top50")!==top) return false; }
    return true; });
  var resps = Object.keys(er.pedidos.reduce(function(o, x){ if(x.responsavel) o[x.responsavel] = 1; return o; }, {"Agatha":1, "Elen":1, "Eduarda Gabriela":1})).sort();
  var ir = function(m){ md[1](m); };
  var avancar = function(x){ avancarPedido(E, x, ir); };
  var mover = function(x, de, para){
    if(para==="cancelado" || para==="recusado") ir({tipo:"motivo", id:x.id});
    else if(para==="agendado") ir({tipo:"agendar", id:x.id, mover:true});
    else if(para==="atendimento") ir({tipo:"atender", id:x.id});
    else E.exec("ped_mover", {id:x.id, para:para});
  };
  var colunas = FLUXO.concat(["cancelado"]).map(function(k){
    var itens = lista.filter(function(x){ return k==="cancelado" ? (x.status==="cancelado" || x.status==="recusado") : x.status===k; }).map(function(x){ return Object.assign({}, x, {arrastavel:!(x.status==="concluido")}); });
    var atr = itens.filter(function(x){ var m = minutosNaEtapa(x, agora); return !FINAIS[x.status] && cfg.prazoHoras>0 && m!=null && m>cfg.prazoHoras*60; }).length;
    return {k:k, titulo:k==="cancelado" ? "Recusado ou cancelado" : ROTULO_STATUS[k], cor:COR_STATUS[k], itens:itens,
      dica:(k==="concluido" || k==="cancelado" ? "" : "prazo "+cfg.prazoHoras+" h")+(atr>0 ? (k==="concluido" || k==="cancelado" ? "" : " · ")+atr+(atr>1 ? " atrasados" : " atrasado") : ""),
      aceita:function(it){ var t = proximosStatus(it); return k==="cancelado" ? (t.indexOf("cancelado")>=0 || t.indexOf("recusado")>=0) : t.indexOf(k)>=0; }};
  });
  var planilha = lista.length ? e(TabelaP,{minW:980, cols:[{t:"Pedido", w:88}, {t:"Revendedora"}, {t:"Canal", w:150}, {t:"Responsável", w:120}, {t:"Valor máximo", w:110, n:true}, {t:"Taxa", w:150}, {t:"Etapa", w:170}, {t:"Tempo", w:80, n:true}, {t:"", w:110}]},
    lista.slice(0, 300).map(function(x){ var prox = proximaEtapa(x), min = minutosNaEtapa(x, agora), sem = faltaComprovante(x), r = repDe(x);
      return e(Tr,{key:x.id, onClick:function(){ ir({tipo:"detalhe", id:x.id}); }},
        e(Td,null, formatarDia(String(x.criadoEm).slice(0, 10))),
        e(Td,{forte:true, title:x.revendedora}, x.revendedora+(r && r.top50 ? " · Top 50" : "")),
        e(Td,null, x.tipo==="encomenda" ? "Encomenda" : ROTULO_CANAL[x.canal] || "—"),
        e(Td,null, x.responsavel || "—"),
        e(Td,{n:true}, x.valorMax>0 ? formatarReais(x.valorMax) : "—"),
        e(Td,{cor:sem ? "text-destructive" : x.taxa>0 ? "text-success" : ""}, x.taxa>0 ? (x.comprovante ? "Paga "+formatarReais(x.taxa) : "Falta "+formatarReais(x.taxa)) : x.taxaRep>0 ? "Rep. "+formatarReais(x.taxaRep) : "—"),
        e(Td,null, ROTULO_STATUS[x.status]),
        e(Td,{n:true}, !FINAIS[x.status] && min!=null ? textoTempo(min) : "—"),
        e(Td,null, prox && e("button",{type:"button", disabled:(x.status==="comprovante" && sem), onClick:function(ev){ ev.stopPropagation(); avancar(x); }, className:"h-6 rounded border border-border px-2 text-[12px] hover:bg-white/10 disabled:opacity-40"}, "Avançar ›")));
    })) : e(Vazio,{ic:"clipboard-text"}, "Nenhum pedido encontrado.");
  var novo = function(){ ir({tipo:"novo"}); };
  return e(Pagina,null,
    e(PageHead,{t:"Funil de pedidos", sub:"Reposição e encomenda: do pedido até a entrega."},
      e(Segmentado,{opcoes:[["quadro", "Quadro"], ["planilha", "Planilha"], ["revendedoras", "Revendedoras"]], atual:modo, onMudar:mo[1]}),
      e(Botao,{principal:true, onClick:novo}, "Novo pedido")),
    modo==="revendedoras" ? e(PlanilhaRev,{E:E, ir:ir}) : null,
    modo!=="revendedoras" && e("div",{className:"mx-auto w-full max-w-6xl"}, e(FaixaTotais,{itens:[
      {t:"Entradas mês", v:String(ind.entradasMes)},
      {t:"Em aberto", v:String(ind.abertos)},
      {t:"Atrasados", v:String(ind.atrasados), cor:ind.atrasados>0 ? "text-destructive" : ""},
      {t:"Sem comprovante", v:String(ind.semComprovante), cor:ind.semComprovante>0 ? "text-destructive" : ""},
      {t:"Concluídos mês", v:String(ind.concluidosMes), cor:ind.concluidosMes>0 ? "text-success" : ""},
      {t:"Top 50", v:String(ind.top50)}]})),
    modo!=="revendedoras" && e(BlocoFiltros,{onLimpar:ativo ? function(){ ft[1](VAZIO_F); } : undefined},
      e(CampoBusca,{id:"enc-busca", t:"Buscar", value:f.busca, placeholder:"Revendedora, representante ou encomenda", onChange:function(v){ set("busca", v); }}),
      e(CampoSel,{id:"enc-canal", t:"Canal", value:f.canal, onChange:function(v){ set("canal", v); }, opcoes:[["", "Todos"]].concat(CANAIS)}),
      e(CampoSel,{id:"enc-resp", t:"Responsável", value:f.resp, onChange:function(v){ set("resp", v); }, opcoes:[["", "Todas"]].concat(resps.map(function(n){ return [n, n]; }))}),
      e(CampoSel,{id:"enc-grupo", t:"Grupo", value:f.grupo, onChange:function(v){ set("grupo", v); }, opcoes:[["", "Todos"], ["top50", "Top 50"], ["demais", "Demais"]]}),
      e(CampoSel,{id:"enc-tipo", t:"Assunto", value:f.tipo, onChange:function(v){ set("tipo", v); }, opcoes:[["", "Todos"], ["reposicao", "Reposição"], ["encomenda", "Encomenda"]]})),
    modo==="revendedoras" ? null : modo==="planilha" ? planilha : e(Kanban,{colunas:colunas, onMover:mover, vazio:"Nenhum pedido nesta etapa.", unidade:["pedido", "pedidos"], onAbrir:function(x){ ir({tipo:"detalhe", id:x.id}); },
      card:function(x){ return e(CartaoE,{x:x, rev:repDe(x), agora:agora, prazo:cfg.prazoHoras, limiteAt:cfg.reposicao.minutosEscolha, avancar:avancar}); }}),
    modal && modal.tipo==="novo" && e(NovoPedido,{E:E, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="motivo" && e(Motivo,{E:E, id:modal.id, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="agendar" && e(Agendar,{E:E, id:modal.id, mover:modal.mover, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="atender" && e(Atender,{E:E, id:modal.id, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="detalhe" && e(Detalhe,{E:E, id:modal.id, ir:ir, fechar:function(){ ir(null); }}),
    modal && modal.tipo==="revs" && e(Revendedoras,{E:E, fechar:function(){ ir(null); }}),
    modal && (modal.tipo==="retirar" || modal.tipo==="solicitar" || modal.tipo==="msgsol" || modal.tipo==="bloquear") && e(Janelas,{E:E, modal:modal, ir:ir}));
}
export { AbaEncomendas };
