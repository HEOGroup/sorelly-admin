// Sorelly Admin · montagem — pages/cadastro/DesempenhoCampanhas.js
// Corpo de duas abas do módulo Aprovação de cadastros: "Desempenho" (funil do contato até o cadastro) e "Campanhas" (Meta Ads, com cadastro manual).
// Sem PageHead próprio: a tela com abas (outro arquivo) envolve estes corpos. Toda a conta vem de domain/cadastro-leads.js (estado s.cl).
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { ESTADO, Dinheiro, Faixa, Indicador, LINHA, Pagina, TH_P, Td } from "@/apps/montagem/components/padrao";
import { anunciosDa, campanhas, funilDesempenho, hojeSP } from "@/apps/montagem/domain/cadastro-leads";
import { use } from "@/apps/montagem/state/context";
import { INPUT, brl } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var COR_SETOR = "azul";
var nInt = function(n){ return Number(n||0).toLocaleString("pt-BR"); };
var nPct = function(n){ return Number(n||0).toLocaleString("pt-BR", {minimumFractionDigits:0, maximumFractionDigits:1})+"%"; };
var dbr = function(iso){ return iso ? String(iso).slice(0, 10).split("-").reverse().join("/") : ""; };
var mesBr = function(m){ return m ? m.slice(5, 7)+"/"+m.slice(0, 4) : ""; };

// ---------- peças pequenas ----------
var BT = {normal:"bg-muted/50 hover:bg-white/15", forte:"bg-[#3B82F6] text-black hover:bg-[#FBBF24]", on:"bg-[#3B82F6]/30 text-white ring-1 ring-[#3B82F6]/70", perigo:"bg-destructive/20 text-destructive hover:bg-destructive/30"};
function Bt(p){ return e("button",{type:"button", onClick:p.onClick, disabled:p.disabled, title:p.titulo, className:"inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[12.5px] font-bold transition "+BT[p.tipo||"normal"]+(p.disabled ? " opacity-40" : "")+" "+(p.className||"")}, p.ic && e(Ph,{n:p.ic, s:14}), p.children); }
function BtIcone(p){ return e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); p.onClick(); }, title:p.titulo, "aria-label":p.titulo, className:"grid size-7 place-items-center rounded-lg bg-muted/50 transition "+(p.perigo ? "hover:bg-destructive/25 hover:text-destructive" : "hover:bg-white/15")}, e(Ph,{n:p.ic, s:14})); }
function Vazio(p){ return e("p",{className:"px-3 py-4 text-center text-[13px] text-white/70"}, p.children); }
function Th(p){ return e("th",{className:TH_P+(p.oculta ? " hidden "+p.oculta+":table-cell" : "")}, p.children); }
function TdO(p){ return e(Td,{dinheiro:p.dinheiro, forte:p.forte, cor:p.cor, className:(p.oculta ? "hidden "+p.oculta+":table-cell " : "")+(p.className||"")}, p.children); }
// barra horizontal proporcional (0 a 100)
function BarraPct(p){ return e("div",{className:"h-2.5 w-full min-w-16 overflow-hidden rounded-full bg-black/35"}, e("i",{className:"block h-full rounded-full", style:{width:Math.max(p.pct>0 ? 3 : 0, Math.min(100, p.pct))+"%", background:p.cor||ESTADO.total}})); }

// ---------- filtro de período (igual ao original: 7/15/30/60/90 dias, mês, tudo, de/até) ----------
var DIAS = [7, 15, 30, 60, 90];
function paramsDe(f){
  if(f.modo==="dias") return {dias:f.dias};
  if(f.modo==="tudo") return {dias:0};
  if(f.modo==="mes") return f.mes ? {mes:f.mes} : {};
  if(f.modo==="intervalo") return f.de && f.ate ? {from:f.de, to:f.ate} : {dias:30};
  return {dias:30};
}
function FiltroPeriodo(p){
  var f = p.f, set = function(k, v){ var n = Object.assign({}, f); n[k] = v; p.set(n); }, modo = function(m){ var n = Object.assign({}, f); n.modo = m; p.set(n); };
  return e("div",{className:"flex flex-wrap items-center justify-center gap-1.5 rounded-xl bg-black/25 p-2 ring-1 ring-white/10"},
    DIAS.map(function(d){ return e(Bt,{key:d, tipo:f.modo==="dias" && f.dias===d ? "on" : "normal", onClick:function(){ var n = Object.assign({}, f); n.modo = "dias"; n.dias = d; p.set(n); }}, d+" dias"); }),
    e(Bt,{tipo:f.modo==="mes" ? "on" : "normal", onClick:function(){ modo("mes"); }}, "Mês"),
    e(Bt,{tipo:f.modo==="tudo" ? "on" : "normal", onClick:function(){ modo("tudo"); }}, "Tudo"),
    e(Bt,{tipo:f.modo==="intervalo" ? "on" : "normal", onClick:function(){ modo("intervalo"); }}, "De / até"),
    f.modo==="mes" && e("input",{type:"month", value:f.mes||"", "aria-label":"Mês", className:INPUT+" h-9! w-40 text-center text-[13px]!", onChange:function(ev){ set("mes", ev.target.value); }}),
    f.modo==="intervalo" && e("div",{className:"flex flex-wrap items-center justify-center gap-1.5 text-[12px] font-semibold"},
      e("label",{className:"flex items-center gap-1"}, "De", e("input",{type:"date", value:f.de||"", className:INPUT+" h-9! w-36 text-center text-[13px]!", onChange:function(ev){ set("de", ev.target.value); }})),
      e("label",{className:"flex items-center gap-1"}, "Até", e("input",{type:"date", value:f.ate||"", className:INPUT+" h-9! w-36 text-center text-[13px]!", onChange:function(ev){ set("ate", ev.target.value); }}))));
}
function textoPeriodo(per){ return per.tudo ? "Todo o histórico até "+dbr(per.to) : dbr(per.from)+" a "+dbr(per.to); }
var FILTRO_INICIAL = {modo:"dias", dias:30, mes:hojeSP().slice(0, 7), de:"", ate:""};

// ---------- tabela do funil (cumulativo) ----------
// comCusto = colunas de custo por etapa (funil de Facebook Ads)
function FunilTabela(p){
  var etapas = p.stages, saidas = p.exits, comCusto = p.comCusto, ncol = comCusto ? 7 : 5;
  var custo = function(v){ return v==null ? "—" : brl(v); };
  return e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"},
    e("thead",null, e("tr",null, e(Th,null, "Etapa"), e(Th,null, "Pessoas"), e(Th,null, "% do início"), e(Th,{oculta:"sm"}, "% da anterior"), e(Th,{oculta:"md"}, "Proporção"),
      comCusto && e(Th,{oculta:"sm"}, "Custo por etapa"), comCusto && e(Th,{oculta:"sm"}, "Custo acumulado"))),
    e("tbody",null,
      etapas.map(function(s){
        return e("tr",{key:s.slug, className:LINHA},
          e(Td,{forte:true, className:"whitespace-normal!"}, s.nome),
          e(Td,{dinheiro:true, forte:true}, nInt(s.cumulative)),
          e(Td,{dinheiro:true}, nPct(s.ofStartPct)),
          e(TdO,{dinheiro:true, oculta:"sm"}, nPct(s.fromPrevPct)),
          e(TdO,{oculta:"md", className:"w-48"}, e(BarraPct,{pct:s.ofStartPct})),
          comCusto && e(TdO,{dinheiro:true, oculta:"sm"}, custo(s.cost)),
          comCusto && e(TdO,{dinheiro:true, oculta:"sm"}, custo(s.costCumulative)));
      }),
      saidas && saidas.length>0 && e("tr",{key:"sd", className:LINHA}, e("td",{colSpan:ncol, className:"px-2 pt-2 text-center text-[10.5px] font-bold uppercase tracking-wide text-white/60"}, "Saídas do funil")),
      saidas && saidas.map(function(s){
        return e("tr",{key:s.slug, className:LINHA},
          e(Td,{forte:true, className:"whitespace-normal!"}, s.nome),
          e(Td,{dinheiro:true, forte:true, cor:s.count>0 ? "alerta" : undefined}, nInt(s.count)),
          e(Td,{className:"text-white/50"}, "—"),
          e(TdO,{oculta:"sm", className:"text-white/50"}, "—"),
          e(TdO,{oculta:"md"}, ""),
          comCusto && e(TdO,{dinheiro:true, oculta:"sm"}, custo(s.cost)),
          comCusto && e(TdO,{oculta:"sm"}, ""));
      }))));
}

// ---------- aba: Funil de desempenho ----------
function AbaCadFunil(){
  var s = use().state, cl = s.cl, st = useState(FILTRO_INICIAL), f = st[0], setF = st[1];
  var fu = funilDesempenho(cl, paramsDe(f));
  var vazio = fu.kpis.totalPeriodo===0;
  return e(Pagina,null,
    e(FiltroPeriodo,{f:f, set:setF}),
    e(Faixa,{n:3},
      e(Indicador,{t:"Total no período", v:nInt(fu.kpis.totalPeriodo), cor:"total", sub:textoPeriodo(fu.periodo)}),
      e(Indicador,{t:"Cadastradas", v:nInt(fu.kpis.cadastradas), cor:"ok"}),
      e(Indicador,{t:"Conversão", v:nPct(fu.kpis.conversao), cor:"info", sub:"Do contato ao cadastro"})),
    vazio
      ? e(BlocoBarra,{t:"Funil de desempenho", cor:COR_SETOR, compacto:true}, e(Vazio,null, "Nenhum contato registrado no período selecionado."))
      : e(BlocoBarra,{t:"Funil de desempenho", sub:"Do contato inicial ao cadastro", cor:COR_SETOR, compacto:true, dir:nPct(fu.kpis.conversao)},
          e("div",{className:"flex flex-col gap-1 p-2"},
            e(FunilTabela,{stages:fu.stages, exits:fu.exits}),
            fu.insight && e("p",{className:"px-2 pb-1 pt-1 text-center text-[12.5px] font-semibold text-white/85"}, fu.insight))));
}

// ---------- janela (modal) ----------
function Modal(p){
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/60 p-4", onClick:p.fechar},
    e("div",{className:"flex max-h-[92vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-2xl bg-card p-5 ring-1 ring-[#3B82F6]/50", onClick:function(ev){ ev.stopPropagation(); }},
      e("div",{className:"flex items-start justify-between gap-3"}, e("h2",{className:"font-heading text-lg font-bold"}, p.t),
        e("button",{type:"button", onClick:p.fechar, "aria-label":"Fechar", className:"grid size-9 place-items-center rounded-lg bg-muted/50"}, e(Ph,{n:"x", s:16}))), p.children));
}
function Campo(p){ return e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold "+(p.className||"")}, p.rot, p.children); }

// criar/editar campanha ou anúncio. alvo = {tipo:"camp"|"anu", campId, id}
function ModalCamp(p){
  var d = use().dispatch, cl = use().state.cl, a = p.alvo, ehAnu = a.tipo==="anu";
  var camp = cl.campanhas.find(function(c){ return c.id===(ehAnu ? a.campId : a.id); });
  var atual = a.id==null ? null : (ehAnu ? ((camp && camp.anuncios)||[]).find(function(x){ return x.id===a.id; }) : camp);
  var st = useState({nome:atual ? atual.nome : "", mes:atual && atual.mes ? atual.mes : hojeSP().slice(0, 7), gasto:atual ? atual.gasto : 0, impressoes:atual ? atual.impressoes : "", cliques:atual ? atual.cliques : ""}), v = st[0], setV = st[1];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; setV(n); };
  var salvar = function(){
    if(!String(v.nome).trim()){ window.alert("Informe o nome "+(ehAnu ? "do anúncio." : "da campanha.")); return; }
    var dados = {nome:v.nome, gasto:v.gasto||0, impressoes:v.impressoes===""?0:v.impressoes, cliques:v.cliques===""?0:v.cliques};
    if(ehAnu) d({type:"CL", op:a.id==null ? "anuncio_add" : "anuncio_set", campanhaId:a.campId, id:a.id, nome:dados.nome, gasto:dados.gasto, impressoes:dados.impressoes, cliques:dados.cliques});
    else d(Object.assign({type:"CL", op:a.id==null ? "campanha_add" : "campanha_set", id:a.id, mes:v.mes}, dados));
    p.fechar();
  };
  var titulo = (a.id==null ? "Nova " : "Editar ")+(ehAnu ? "anúncio" : "campanha");
  if(ehAnu) titulo = (a.id==null ? "Novo " : "Editar ")+"anúncio";
  return e(Modal,{t:titulo, fechar:p.fechar},
    ehAnu && camp && e("p",{className:"text-center text-[12.5px] text-white/70"}, "Campanha: "+camp.nome),
    e(Campo,{rot:"Nome"}, e("input",{type:"text", value:v.nome, autoFocus:true, className:INPUT+" h-10 text-center", onChange:function(ev){ set("nome", ev.target.value); }})),
    !ehAnu && e(Campo,{rot:"Mês"}, e("input",{type:"month", value:v.mes, className:INPUT+" h-10 text-center", onChange:function(ev){ set("mes", ev.target.value); }})),
    e(Campo,{rot:"Gasto"}, e(Dinheiro,{value:v.gasto, label:"Gasto", onChange:function(x){ set("gasto", x||0); }})),
    e("div",{className:"grid grid-cols-2 gap-2"},
      e(Campo,{rot:"Impressões"}, e("input",{type:"number", min:0, value:v.impressoes, className:INPUT+" h-10 text-center", onChange:function(ev){ set("impressoes", ev.target.value); }})),
      e(Campo,{rot:"Cliques"}, e("input",{type:"number", min:0, value:v.cliques, className:INPUT+" h-10 text-center", onChange:function(ev){ set("cliques", ev.target.value); }}))),
    !ehAnu && e("p",{className:"text-center text-[11.5px] text-white/60"}, "A campanha aparece na lista quando tiver gasto, impressões ou cliques e o mês estiver dentro do período."),
    e("div",{className:"flex justify-center gap-2"}, e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{tipo:"forte", ic:"plus", onClick:salvar}, "Salvar")));
}

// ---------- tabelas de campanhas e anúncios ----------
function TabelaMeta(p){
  var linhas = p.linhas, c = p.c;
  return e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"},
    e("thead",null, e("tr",null, e(Th,null, p.rotulo), e(Th,null, "Gasto"), e(Th,{oculta:"sm"}, "Impressões"), e(Th,null, "Cliques"), e(Th,{oculta:"sm"}, "CPC"), e(Th,{oculta:"md"}, "CTR"), e(Th,null, ""))),
    e("tbody",null, linhas.map(function(l){
      return e("tr",{key:l.id, className:LINHA+(p.abrir ? " cursor-pointer transition hover:bg-white/5" : ""), onClick:p.abrir ? function(){ p.abrir(l.id); } : undefined, title:p.abrir ? "Ver os anúncios" : undefined},
        e(Td,{forte:true, className:"whitespace-normal!"}, e("div",{className:"flex items-center justify-center gap-1"}, p.abrir && e(Ph,{n:"caret-right", s:12}), l.nome), l.mes && e("div",{className:"text-[11px] font-normal text-white/55"}, mesBr(l.mes))),
        e(Td,{dinheiro:true, forte:true, cor:"total"}, brl(l.gasto)),
        e(TdO,{dinheiro:true, oculta:"sm"}, nInt(l.impressoes)),
        e(Td,{dinheiro:true}, nInt(l.cliques)),
        e(TdO,{dinheiro:true, oculta:"sm"}, brl(l.cpc)),
        e(TdO,{dinheiro:true, oculta:"md"}, nPct(l.ctr)),
        e(Td,null, e("div",{className:"flex items-center justify-center gap-1"}, e(BtIcone,{ic:"pencil-simple", titulo:"Editar", onClick:function(){ p.editar(l.id); }}), e(BtIcone,{ic:"trash", perigo:true, titulo:"Excluir", onClick:function(){ p.excluir(l); }}))));
    }))));
}

// ---------- aba: Campanhas ----------
function AbaCadCampanhas(){
  var ctx = use(), d = ctx.dispatch, cl = ctx.state.cl;
  var st = useState(FILTRO_INICIAL), f = st[0], setF = st[1];
  var vs = useState("campanhas"), vista = vs[0], setVista = vs[1];       // "campanhas" | "facebook" | "geral"
  var ds = useState(null), detalhe = ds[0], setDetalhe = ds[1];          // id da campanha aberta (drill-down)
  var ms = useState(null), modal = ms[0], setModal = ms[1];
  var par = paramsDe(f), cp = campanhas(cl, par), fu = funilDesempenho(cl, par);
  var aberta = detalhe ? cp.campanhas.find(function(c){ return c.id===detalhe; }) : null;
  var anuncios = aberta ? anunciosDa(cl, aberta.id) : [];
  var excluirCamp = function(l){ if(!window.confirm("Excluir a campanha \""+l.nome+"\" e os anúncios dela?")) return; d({type:"CL", op:"campanha_del", id:l.id}); if(detalhe===l.id) setDetalhe(null); };
  var excluirAnu = function(l){ if(!window.confirm("Excluir o anúncio \""+l.nome+"\"?")) return; d({type:"CL", op:"anuncio_del", campanhaId:aberta.id, id:l.id}); };
  var k = cp.kpis;

  var blocoCamp = aberta
    ? e(BlocoBarra,{t:aberta.nome, sub:"Anúncios da campanha", cor:COR_SETOR, compacto:true, dir:brl(aberta.gasto)},
        e("div",{className:"flex flex-col gap-2 p-2"},
          e("div",{className:"flex flex-wrap items-center justify-center gap-2"},
            e(Bt,{ic:"caret-left", onClick:function(){ setDetalhe(null); }}, "Voltar às campanhas"),
            e(Bt,{ic:"pencil-simple", onClick:function(){ setModal({tipo:"camp", id:aberta.id}); }}, "Editar campanha"),
            e(Bt,{tipo:"forte", ic:"plus", onClick:function(){ setModal({tipo:"anu", campId:aberta.id, id:null}); }}, "Novo anúncio")),
          anuncios.length
            ? e(TabelaMeta,{linhas:anuncios, rotulo:"Anúncio", editar:function(id){ setModal({tipo:"anu", campId:aberta.id, id:id}); }, excluir:excluirAnu})
            : e(Vazio,null, "Nenhum anúncio cadastrado nesta campanha.")))
    : e(BlocoBarra,{t:"Campanhas", sub:"Meta Ads · "+textoPeriodo(cp.periodo), cor:COR_SETOR, compacto:true, dir:nInt(k.campanhasQtd)},
        e("div",{className:"flex flex-col gap-2 p-2"},
          e("div",{className:"flex justify-center"}, e(Bt,{tipo:"forte", ic:"plus", onClick:function(){ setModal({tipo:"camp", id:null}); }}, "Nova campanha")),
          cp.campanhas.length
            ? e(TabelaMeta,{linhas:cp.campanhas, rotulo:"Campanha", abrir:setDetalhe, editar:function(id){ setModal({tipo:"camp", id:id}); }, excluir:excluirCamp})
            : e(Vazio,null, "Nenhuma campanha com dados no período selecionado."),
          e("p",{className:"px-2 text-center text-[11.5px] text-white/60"}, "Os números serão preenchidos pela integração com a Meta quando ela estiver ligada. Enquanto isso, o cadastro é manual.")));

  var fb = cp.funil;
  var blocoFunil = vista==="facebook"
    ? e(BlocoBarra,{t:"Funil de Facebook Ads", sub:"Leads com a tag "+cl.config.tagsFacebook, cor:COR_SETOR, compacto:true, dir:nPct(fb.kpis.conversao)},
        e("div",{className:"flex flex-col gap-1 p-2"},
          e(Faixa,{n:3}, e(Indicador,{t:"Gasto", v:brl(fb.kpis.gasto), cor:"total"}), e(Indicador,{t:"Cliques", v:nInt(fb.kpis.cliques), cor:"info"}), e(Indicador,{t:"Conversão", v:nPct(fb.kpis.conversao), cor:"ok"})),
          fb.kpis.totalPeriodo===0 && fb.kpis.cliques===0
            ? e(Vazio,null, "Nenhum lead de anúncio registrado no período selecionado.")
            : e(FunilTabela,{stages:fb.stages, exits:fb.exits, comCusto:true}),
          !fb.kpis.mostrarCadastradas && e("p",{className:"px-2 text-center text-[11.5px] text-white/60"}, "A etapa Cadastradas aparece em períodos de 7 dias ou mais."),
          fb.insight && e("p",{className:"px-2 pb-1 text-center text-[12.5px] font-semibold text-white/85"}, fb.insight)))
    : e(BlocoBarra,{t:"Funil geral", sub:"Todos os contatos do período", cor:COR_SETOR, compacto:true, dir:nPct(fu.kpis.conversao)},
        e("div",{className:"flex flex-col gap-1 p-2"},
          fu.kpis.totalPeriodo===0 ? e(Vazio,null, "Nenhum contato registrado no período selecionado.") : e(FunilTabela,{stages:fu.stages, exits:fu.exits}),
          fu.insight && e("p",{className:"px-2 pb-1 text-center text-[12.5px] font-semibold text-white/85"}, fu.insight)));

  return e(Pagina,null,
    e(FiltroPeriodo,{f:f, set:setF}),
    e(Faixa,{n:6},
      e(Indicador,{t:"Gasto", v:brl(k.gasto), cor:"total"}),
      e(Indicador,{t:"Impressões", v:nInt(k.impressoes), cor:"info"}),
      e(Indicador,{t:"Cliques", v:nInt(k.cliques), cor:"info"}),
      e(Indicador,{t:"CPC", v:brl(k.cpc), cor:"cian"}),
      e(Indicador,{t:"CTR", v:nPct(k.ctr), cor:"cian"}),
      e(Indicador,{t:"Campanhas", v:nInt(k.campanhasQtd), cor:"total"})),
    e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
      e(Bt,{ic:"megaphone", tipo:vista==="campanhas" ? "on" : "normal", onClick:function(){ setVista("campanhas"); }}, "Campanhas"),
      e(Bt,{ic:"funnel", tipo:vista==="facebook" ? "on" : "normal", onClick:function(){ setVista("facebook"); }}, "Funil de Facebook Ads"),
      e(Bt,{ic:"funnel", tipo:vista==="geral" ? "on" : "normal", onClick:function(){ setVista("geral"); }}, "Funil geral")),
    vista==="campanhas" ? blocoCamp : blocoFunil,
    modal && e(ModalCamp,{alvo:modal, fechar:function(){ setModal(null); }}));
}

export { AbaCadFunil, AbaCadCampanhas };
