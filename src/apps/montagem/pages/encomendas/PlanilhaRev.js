// Sorelly Admin · montagem — pages/encomendas/PlanilhaRev.js
// PLANILHA DAS REVENDEDORAS (23/10/2026): uma linha por revendedora, uma coluna por mês (de jul/2026 até o mês de hoje; no dia 1 do mês novo a coluna nova abre sozinha).
// A equipe lança a venda de cada mês; o sistema calcula a média dos últimos 3 meses COM venda lançada (pode ser 1 ou 2 meses só) e avisa quando passa a ficar abaixo de R$ 3.000.
// "Selecionada pelo Marcus" não entra no alerta. Retirar pede o motivo; se a revendedora é do Marcus, vira pedido de autorização (mensagem pronta). Usada no Funil (aba Revendedoras) e na tela Top 50.
import { BlocoFiltros, Botao, CampoBusca, CampoSel, FaixaTotais, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { abaixoDaMedia, formatarDia, formatarReais, hojeSP, mediaVendas, mesesColunas, rotuloMes } from "@/apps/montagem/domain/encomendas";
import { Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { e, useState } from "@/shared/react";

var BTN = "h-6 rounded border border-border px-2 text-[12px] hover:bg-white/10 disabled:opacity-40";

// célula de venda: digita e confirma ao sair do campo
function Cel(p){
  var st = useState(null), v = st[0], atual = p.v===undefined || p.v===null || p.v==="" ? "" : String(p.v), txt = v===null ? atual : v;
  return e("input",{type:"number", min:0, step:"0.01", value:txt, placeholder:"—", "aria-label":p.rot, title:p.rot,
    onChange:function(ev){ st[1](ev.target.value); },
    onBlur:function(){ if(v!==null && v!==atual) p.on(v); st[1](null); },
    onKeyDown:function(ev){ if(ev.key==="Enter") ev.currentTarget.blur(); },
    className:"h-7 w-full min-w-0 rounded border bg-card px-1.5 text-right text-[13px] tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary "+(p.falta ? "border-warning" : "border-border")});
}

function PlanilhaRev(p){
  var E = p.E, er = E.er, cfg = E.cfg, hoje = hojeSP(), cols = mesesColunas(cfg, hoje), ult = cols[cols.length-1], min = cfg.top50.mediaMinima;
  var st = useState({busca:"", grupo:p.grupo || "", alerta:""}), f = st[0];
  var set = function(k, v){ st[1](function(o){ var n = Object.assign({}, o); n[k] = v; return n; }); };
  var tem = function(r){ return Object.assign({}, r, {m:mediaVendas(r, cfg, hoje), alerta:abaixoDaMedia(cfg, r, hoje)}); };
  var todas = er.revendedoras.map(tem);
  var lista = todas.filter(function(r){
    if(f.grupo==="top50" && !r.top50) return false; if(f.grupo==="fora" && r.top50) return false; if(f.alerta && !r.alerta) return false;
    return !f.busca || (r.nome+" "+(r.representante || "")+" "+(r.telefone || "")).toLowerCase().indexOf(f.busca.toLowerCase())>=0;
  }).sort(function(a, b){ return (b.top50 ? 1 : 0)-(a.top50 ? 1 : 0) || a.nome.localeCompare(b.nome); });
  var extra = p.grupo==="top50";
  var top = todas.filter(function(r){ return r.top50; }), faltam = top.filter(function(r){ return vazio(r.vendas && r.vendas[ult]); });
  function vazio(x){ return x===undefined || x===null || x===""; }
  var alertas = todas.filter(function(r){ return r.alerta; });
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"mx-auto w-full max-w-6xl"}, e(FaixaTotais,{itens:[
      {t:"No Top 50", v:String(top.length)}, {t:"Abaixo de "+formatarReais(min), v:String(alertas.length), cor:alertas.length>0 ? "text-destructive" : ""},
      {t:"Selecionadas Marcus", v:String(top.filter(function(r){ return r.marcus; }).length)},
      {t:"Sem "+rotuloMes(ult), v:String(faltam.length), cor:faltam.length>0 ? "text-warning" : ""},
      {t:"Pedidos ao Marcus", v:String(E.er.top50Sol.filter(function(x){ return x.status==="pendente"; }).length)}]})),
    faltam.length>0 && e("div",{className:"rounded-lg border border-warning/60 bg-warning/10 px-3 py-2 text-[13px]"}, "Mês aberto: lance as vendas de "+rotuloMes(ult)+" ("+faltam.length+(faltam.length===1 ? " revendedora do Top 50 sem valor" : " revendedoras do Top 50 sem valor")+"). As células em amarelo estão vazias."),
    alertas.length>0 && e("div",{className:"rounded-lg border border-destructive/60 bg-destructive/10 px-3 py-2 text-[13px]"}, "Alerta: a média de "+alertas.length+(alertas.length===1 ? " revendedora ficou" : " revendedoras ficou")+" abaixo de "+formatarReais(min)+": "+alertas.slice(0, 6).map(function(r){ return r.nome; }).join(", ")+(alertas.length>6 ? "…" : "")+"."),
    e(BlocoFiltros,{onLimpar:(f.busca || f.grupo!==(p.grupo || "") || f.alerta) ? function(){ st[1]({busca:"", grupo:p.grupo || "", alerta:""}); } : undefined},
      e(CampoBusca,{id:"pl-busca", t:"Buscar", value:f.busca, placeholder:"Nome, representante ou telefone", onChange:function(v){ set("busca", v); }}),
      e(CampoSel,{id:"pl-grupo", t:"Grupo", value:f.grupo, onChange:function(v){ set("grupo", v); }, opcoes:[["", "Todas"], ["top50", "Top 50"], ["fora", "Fora do Top 50"]]}),
      e(CampoSel,{id:"pl-alerta", t:"Alerta", value:f.alerta, onChange:function(v){ set("alerta", v); }, opcoes:[["", "Todas"], ["sim", "Abaixo de "+formatarReais(min)]]}),
      e("div",{className:"flex items-end justify-end gap-2"}, e(Botao,{onClick:function(){ p.ir({tipo:"solicitar"}); }}, "Pedir entrada"), e(Botao,{principal:true, onClick:function(){ p.ir({tipo:"revs"}); }}, "Nova revendedora"))),
    lista.length ? e(TabelaP,{minW:910+cols.length*96+(extra ? 480 : 0), cols:[{t:"Revendedora", w:210}, {t:"Telefone", w:118}, {t:"Representante", w:120}].concat(extra ? [{t:"Última venda", w:110, n:true}, {t:"Acerto", w:80}, {t:"Montagem", w:290}] : [], cols.map(function(m){ return {t:rotuloMes(m), w:96, n:true}; }), [{t:"Média", w:132, n:true}, {t:"Situação", w:150}, {t:"Marcus", w:64, c:true}, {t:"", w:84}])},
      lista.map(function(r){
        return e(Tr,{key:r.id, alerta:r.alerta},
          e(Td,{forte:true, title:r.nome}, r.nome), e(Td,null, r.telefone || "—"), e(Td,null, r.representante || "—"),
          extra && e(Td,{n:true}, r.ultimaVenda>0 ? formatarReais(r.ultimaVenda) : "—"), extra && e(Td,null, r.dataAcerto ? formatarDia(r.dataAcerto).slice(0, 5) : "—"),
          extra && e(Td,{title:[r.sitMont, r.respMont, r.obs].filter(Boolean).join(" · ")}, [r.sitMont, r.respMont ? "Resp.: "+r.respMont : "", r.obs].filter(Boolean).join(" · ") || "—"),
          cols.map(function(m){ return e("td",{key:m, className:"h-8 border-b border-border px-1.5"}, e(Cel,{v:r.vendas && r.vendas[m], rot:r.nome+" · "+rotuloMes(m), falta:r.top50 && m===ult && vazio(r.vendas && r.vendas[m]), on:function(v){ E.exec("rev_venda", {id:r.id, mes:m, valor:v}); }})); }),
          e(Td,{n:true, cor:r.alerta ? "text-destructive" : "", title:r.m.meses ? "Média de "+r.m.meses+(r.m.meses===1 ? " mês" : " meses")+": "+r.m.usados.map(rotuloMes).join(", ") : ""}, r.m.media!=null ? formatarReais(r.m.media)+(r.m.meses<3 ? " ("+r.m.meses+"m)" : "") : "—"),
          e(Td,{cor:r.alerta ? "text-destructive" : r.top50 ? "text-success" : "", title:r.bloqueadaAte ? "Bloqueada até "+r.bloqueadaAte : ""}, r.alerta ? "Média abaixo" : r.top50 ? (r.marcus ? "Top 50 · Marcus" : "Top 50") : "Fora do Top 50"),
          e(Td,{c:true}, e("input",{type:"checkbox", checked:!!r.marcus, disabled:!E.pode || !r.top50, title:E.pode ? "Selecionada pelo Marcus: fica no Top 50 mesmo com média baixa" : "Só a diretoria marca", onChange:function(ev){ E.exec("rev_marcus", {id:r.id, valor:ev.target.checked}); }})),
          e(Td,null, r.top50 ? e("button",{type:"button", className:BTN, onClick:function(){ p.ir({tipo:"retirar", id:r.id}); }}, "Retirar") : e("button",{type:"button", className:BTN, onClick:function(){ p.ir({tipo:"solicitar", id:r.id}); }}, "Incluir")));
      })) : e(Vazio,{ic:"table"}, "Nenhuma revendedora encontrada."));
}
export { PlanilhaRev };
