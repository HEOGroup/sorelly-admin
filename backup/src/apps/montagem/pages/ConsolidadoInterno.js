// Sorelly Admin — pages/ConsolidadoInterno.js
// Kits → Atendimento interno → Consolidado. Só os atendimentos feitos na própria Sorelly (nada disso entra no Consolidado das representantes).
// Mostra o acerto de cada atendimento, quem bipou, quem atendeu, se levou kit novo e QUANTO TEMPO durou (de "Iniciar atendimento" até "Finalizar bipagem").
import { FORMA_LABEL } from "@/apps/montagem/domain/consignado";
import { BK, N1, isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var fmtData = function(iso){ return iso ? iso.split("-").reverse().join("/") : ""; };
var nomeMes = function(m){ var p = m.split("-"); return MESES[+p[1]-1]+"/"+p[0]; };
var th = function(t){ return e("th",{key:t, className:"whitespace-nowrap border-b border-r border-border px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide last:border-r-0"}, t); };
var td = function(v, c){ return e("td",{className:"whitespace-nowrap border-r border-border/60 px-2 py-1.5 text-center text-[12.5px] last:border-r-0 "+(c||"")}, v); };

// Cabeçalho com filtro igual de planilha: clica no título, abre a lista de valores com caixinhas (busca, marcar tudo, limpar)
function CabecalhoFiltro(p){
  var ab = useState(false), aberto = ab[0], setAberto = ab[1];
  var bq = useState(""), busca = bq[0], setBusca = bq[1];
  var sel = p.selecionados;                                   // null = todos
  var ativo = sel !== null;
  var visiveis = p.opcoes.filter(function(o){ return !busca || String(o).toLowerCase().indexOf(busca.toLowerCase())>=0; });
  var marcado = function(o){ return sel===null || sel.indexOf(o)>=0; };
  var alternar = function(o){ var base = sel===null ? p.opcoes.slice() : sel.slice(); var i = base.indexOf(o); if(i>=0) base.splice(i,1); else base.push(o); p.onChange(base.length===p.opcoes.length ? null : base); };
  return e("th",{className:"relative whitespace-nowrap border-b border-r border-border px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide"},
    e("button",{type:"button", onClick:function(){ setAberto(!aberto); setBusca(""); }, "aria-expanded":aberto, "aria-label":"Filtrar "+p.titulo,
      className:"inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 uppercase hover:bg-white/10 "+(ativo ? "bg-primary/25 text-primary" : "")}, p.titulo, e("span",{className:"text-[11px]"}, ativo ? "▼●" : "▼")),
    aberto && e("div",{className:"fixed inset-0 z-40", onClick:function(){ setAberto(false); }}),
    aberto && e("div",{className:"absolute left-1/2 top-full z-50 mt-1 flex w-64 -translate-x-1/2 flex-col gap-2 rounded-xl border border-border bg-popover p-3 text-left normal-case tracking-normal shadow-2xl"},
      e("input",{autoFocus:true, value:busca, onChange:function(ev){ setBusca(ev.target.value); }, placeholder:"Buscar…", className:INPUT+" h-9! text-sm!"}),
      e("div",{className:"flex gap-2 text-[12.5px] font-semibold"},
        e("button",{type:"button", onClick:function(){ p.onChange(null); }, className:"rounded-md bg-white/10 px-2 py-1 hover:bg-white/15"},"Marcar tudo"),
        e("button",{type:"button", onClick:function(){ p.onChange([]); }, className:"rounded-md bg-white/10 px-2 py-1 hover:bg-white/15"},"Limpar")),
      e("div",{className:"flex max-h-60 flex-col gap-0.5 overflow-y-auto"},
        visiveis.length===0 ? e("span",{className:"px-1 py-2 text-[12.5px] text-muted-foreground"},"Nada encontrado") : visiveis.map(function(o){
          return e("label",{key:o, className:"flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-[13.5px] hover:bg-white/10"},
            e("input",{type:"checkbox", checked:marcado(o), onChange:function(){ alternar(o); }, className:"size-4"}), e("span",{className:"truncate"}, p.rotulo ? p.rotulo(o) : o)); })),
      e("button",{type:"button", onClick:function(){ setAberto(false); }, className:"rounded-lg bg-primary px-3 py-1.5 text-[13px] font-bold text-primary-foreground"},"OK")));
}
var hm = function(ts){ return new Date(ts).toLocaleTimeString("pt-BR",{hour:"2-digit", minute:"2-digit"}); };

function AbaConsolidadoInterno(){
  var cx = use(), s = cx.state;
  var hoje = isoDia(new Date());
  var mm = useState(hoje.slice(0,7)), mes = mm[0], setMes = mm[1];
  var bs = useState(""), busca = bs[0], setBusca = bs[1];
  var fd = useState(null), fData = fd[0], setFData = fd[1];       // filtros de planilha: null = tudo
  var fr = useState(null), fRev = fr[0], setFRev = fr[1];
  var fb = useState(null), fBip = fb[0], setFBip = fb[1];
  var fa = useState(null), fAte = fa[0], setFAte = fa[1];
  var dash = e("span",{className:"text-muted-foreground"},"—");
  var feitos = (s.internos||[]).filter(function(x){ return x.status==="acertado"; }).map(function(x){
    var r = (s.acertosConsignado||[]).find(function(a){ return a.internoId===x.id; }) || {};
    var pag = (r.pagamentos||[]).reduce(function(t,p){ return t+(p.valor||0); }, 0);
    return {x:x, r:r, pag:pag, dur:x.inicioTs && x.fimTs ? Math.max(1, Math.round((x.fimTs-x.inicioTs)/60000)) : null}; });
  var meses = feitos.map(function(f){ return (f.x.data||"").slice(0,7); }).concat([mes]).filter(function(m,i,a){ return m && a.indexOf(m)===i; }).sort().reverse();
  var b = busca.trim().toLowerCase();
  var linhas = feitos.filter(function(f){ return (f.x.data||"").slice(0,7)===mes && (!b || (f.x.nome||"").toLowerCase().indexOf(b)>=0); })
    .sort(function(a,c){ return (c.x.data+(c.x.hora||"")).localeCompare(a.x.data+(a.x.hora||"")); });
  var unicos = function(fn){ return linhas.map(fn).filter(function(v,i,a){ return v && a.indexOf(v)===i; }).sort(); };
  var opData = unicos(function(f){ return f.x.data; }), opRev = unicos(function(f){ return f.x.nome; }), opBip = unicos(function(f){ return f.x.bipou ? f.x.bipou.split(" ")[0] : "—"; }), opAte = unicos(function(f){ return f.x.atendeu ? f.x.atendeu.split(" ")[0] : "—"; });
  var passa = function(sel, v){ return sel===null || sel.indexOf(v)>=0; };
  linhas = linhas.filter(function(f){ return passa(fData, f.x.data) && passa(fRev, f.x.nome) && passa(fBip, f.x.bipou ? f.x.bipou.split(" ")[0] : "—") && passa(fAte, f.x.atendeu ? f.x.atendeu.split(" ")[0] : "—"); });
  var comDur = linhas.filter(function(f){ return f.dur!=null; }), media = comDur.length ? Math.round(comDur.reduce(function(t,f){ return t+f.dur; }, 0)/comDur.length) : null;
  var semFim = linhas.filter(function(f){ return !f.x.fimTs; }).length, nKit = linhas.filter(function(f){ return f.x.kitNovo; }).length;
  // linha de TOTAL logo abaixo dos títulos (do que está filtrado): venda, % de comissão (média pela venda) e valor do acerto
  var tVenda = linhas.reduce(function(t,f){ return t+(f.r.vendaLiquida||0); }, 0), tAcerto = linhas.reduce(function(t,f){ return t+(f.r.valorAcerto||0); }, 0), tPago = linhas.reduce(function(t,f){ return t+f.pag; }, 0);
  var tPct = tVenda>0 ? linhas.reduce(function(t,f){ return t+(f.r.vendaLiquida||0)*(f.r.comissaoPct||0); }, 0)/tVenda : null;
  var linhaTotal = e("tr",{key:"total", className:"border-b-2 border-primary/50 bg-primary/10 font-bold"},
    e("td",{colSpan:3, className:"whitespace-nowrap border-r border-border/60 px-2 py-1.5 text-center text-[12.5px] uppercase tracking-wide text-primary"}, "Total · "+linhas.length+(linhas.length===1 ? " atendimento" : " atendimentos")),
    td(BK(tVenda), MONO), td(tPct!=null ? N1(tPct)+"%" : dash, MONO), td(BK(tAcerto), MONO+" text-primary"), td(BK(tPago), MONO),
    e("td",{colSpan:9, className:"px-2 py-1.5"}));
  var chip = function(rot, v, cor){ return e("span",{className:"inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12.5px] ring-1 "+(cor||"bg-muted/40 ring-border")}, rot, e("b",{className:MONO}, v)); };
  return e(React.Fragment,null,
    e("div",{className:"flex flex-wrap items-end justify-between gap-3"},
      e(PageHead,{t:"Consolidado Sorelly", sub:"Atendimentos feitos aqui na Sorelly: quem bipou, quem atendeu, kit novo e quanto tempo durou cada acerto"}),
      e("div",{className:"flex items-center gap-2"},
        e("div",{className:"relative"}, e(Icon,{n:"search", s:16, className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"}),
          e("input",{className:INPUT+" h-10! w-56 pl-9 text-sm!", placeholder:"Buscar revendedora", value:busca, onChange:function(ev){ setBusca(ev.target.value); }})),
        e("select",{value:mes, "aria-label":"Mês", className:INPUT+" h-10! cursor-pointer text-sm!", onChange:function(ev){ setMes(ev.target.value); }}, meses.map(function(m){ return e("option",{key:m, value:m}, nomeMes(m)); })))),
    e("div",{className:"flex flex-wrap items-center justify-center gap-1.5 rounded-xl bg-card px-2.5 py-1.5 ring-1 ring-[#E8B84B]/25"},
      chip("Atendimentos", linhas.length, "bg-muted/60 font-bold ring-border"), chip("Kit novo", nKit),
      chip("Tempo médio", media!=null ? media+" min" : "—", "bg-info/10 text-info ring-info/40"),
      chip("Sem finalizar a bipagem", semFim, semFim>0 ? "bg-warning/10 text-warning ring-warning/40" : "bg-muted/40 ring-border")),
    linhas.length===0
      ? e("p",{className:"rounded-xl border border-dashed border-border p-10 text-center text-[14px] text-muted-foreground"},"Nenhum atendimento interno feito em "+nomeMes(mes)+".")
      : e("div",{className:"overflow-x-auto rounded-xl border border-border bg-card pb-24"},
          e("table",{className:"w-full min-w-max border-collapse"},
            e("thead",{className:"sticky top-0 z-10"}, e("tr",{className:"bg-sidebar"},
              e(CabecalhoFiltro,{key:"d", titulo:"Data", opcoes:opData, selecionados:fData, onChange:setFData, rotulo:fmtData}), th("Hora"),
              e(CabecalhoFiltro,{key:"r", titulo:"Revendedora", opcoes:opRev, selecionados:fRev, onChange:setFRev}),
              ["Venda","Comissão %","Valor do acerto","Valor pago","Formas de pagamento","Comprovantes"].map(th),
              e(CabecalhoFiltro,{key:"b", titulo:"Quem bipou", opcoes:opBip, selecionados:fBip, onChange:setFBip}),
              e(CabecalhoFiltro,{key:"a", titulo:"Quem atendeu", opcoes:opAte, selecionados:fAte, onChange:setFAte}),
              ["Kit novo","Continua?","Início","Fim (bipagem)","Duração"].map(th))),
            e("tbody",null, linhaTotal, linhas.map(function(f){ var x = f.x, r = f.r;
              return e("tr",{key:x.id, className:"border-b border-border/60 hover:bg-muted/30"},
                td(fmtData(x.data)), td(x.hora || "—", MONO), td(e("b",null, x.nome)),
                td(r.vendaLiquida!=null ? BK(r.vendaLiquida) : dash, MONO), td(r.comissaoPct!=null ? r.comissaoPct+"%" : dash, MONO), td(r.valorAcerto!=null ? BK(r.valorAcerto) : dash, MONO+" font-semibold text-primary"),
                td(BK(f.pag), MONO),
                td((r.pagamentos||[]).length ? (r.pagamentos||[]).map(function(p){ return (FORMA_LABEL[p.forma]||p.forma)+" "+BK(p.valor); }).join(" · ") : dash),
                td((function(){ var lf = (s.lancFin||[]).find(function(l){ return l.internoId===x.id; }); if(!lf) return dash;
                  var links = []; lf.linhas.forEach(function(l){ (l.partes||[]).forEach(function(q){ if(q.comprovante) links.push({c:q.descricao||"Comprovante", u:q.comprovante.url, k:links.length}); }); });
                  return lf.conferido ? e("span",{className:"flex flex-wrap justify-center gap-1.5"}, links.map(function(k){ return e("a",{key:k.k, href:k.u, target:"_blank", rel:"noreferrer", title:k.c, className:"rounded-md bg-success/15 px-2 py-0.5 text-[12.5px] font-semibold text-success underline"}, "✓ "+k.c); }))
                    : e("span",{className:"text-warning"},"Em conferência"); })()),
                td(x.bipou ? x.bipou.split(" ")[0] : dash), td(x.atendeu ? x.atendeu.split(" ")[0] : dash),
                td(x.kitNovo ? e("span",{className:"font-semibold text-success"},"Sim") : "Não"),
                td(x.continua==="sim" ? e("span",{className:"font-semibold text-success"},"Sim"+(x.novaCond ? " · nova "+x.novaCond : "")) : x.continua==="nao_regras" ? e("span",{className:"text-destructive"},"Não · regras") : x.continua==="nao_quer" ? e("span",{className:"text-warning"},"Não · não quis") : dash),
                td(x.inicioTs ? hm(x.inicioTs) : (x.chegada || dash), MONO), td(x.fimTs ? hm(x.fimTs) : dash, MONO),
                td(f.dur!=null ? e("span",{className:"rounded bg-info/15 px-1.5 py-0 text-[11px] font-semibold text-info"}, f.dur+" min") : dash)); })))));
}

export { AbaConsolidadoInterno };
