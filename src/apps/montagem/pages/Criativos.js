// Sorelly Admin · montagem — pages/Criativos.js
// Marketing › Criativos (05/11/2026, pedido do Marcus: tela própria no menu de cima, fora do Tráfego pago): os anúncios que mais trouxeram revendedoras em cada mês, para o Marketing consultar e usar de referência nas próximas artes.
// Duas visões da mesma lista: Cartões (galeria, um cartão por anúncio) e Planilha. Hoje cada criativo é lançado à mão aqui mesmo (estado s.tp, ação TP, o mesmo módulo do Tráfego pago).
// Quando o Gerenciador de Anúncios puder ser lido pelo sistema, os números entram sozinhos (ainda não ligado).
import { Pagina } from "@/apps/montagem/components/padrao";
import { Bloco, Botao, BlocoFiltros, CampoSel, Segmentado } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { FORMATOS, PLATAFORMAS, hojeSP, mesesDe, rankingCriativos, rotuloFormato, rotuloMes, rotuloPlataforma } from "@/apps/montagem/domain/trafego";
import { CampoDin, CampoNum, CampoTexto, N, R$, col, porDe } from "@/apps/montagem/pages/trafego/comum";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var NOVO = function(mes){ return {id:null, nome:"", mes:mes, plataforma:"meta", formato:"VIDEO", link:"", investimento:null, leads:"", aprovadas:"", cadastradas:"", obs:""}; };
var ehLink = function(v){ return /^https?:\/\//i.test(String(v||"")); };

function FormCriativo(p){
  var cx = use(), s = cx.state, d = cx.dispatch, c = p.ed;
  var sf = useState(Object.assign({}, c, {leads:String(c.leads), aprovadas:String(c.aprovadas), cadastradas:String(c.cadastradas)})), f = sf[0];
  var set = function(k, v){ var n = Object.assign({}, f); n[k] = v; sf[1](n); };
  var salvar = function(){
    d({type:"TP", op:"criativo_set", id:f.id, nome:f.nome, mes:f.mes, plataforma:f.plataforma, formato:f.formato, link:f.link, investimento:f.investimento||0, leads:f.leads||0, aprovadas:f.aprovadas||0, cadastradas:f.cadastradas||0, obs:f.obs, por:porDe(s)});
    p.fechar();
  };
  var excluir = function(){ if(window.confirm("Excluir o criativo \""+f.nome+"\"?")){ d({type:"TP", op:"criativo_del", id:f.id}); p.fechar(); } };
  return e(Bloco,{t:f.id ? "Editar criativo" : "Novo criativo"},
    e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4"},
      e(CampoTexto,{t:"Nome do criativo", id:"cr-nome", value:f.nome, maxLength:200, cls:"col-span-2", onChange:function(v){ set("nome", v); }}),
      e(CampoTexto,{t:"Mês", id:"cr-mes", tipo:"month", value:f.mes, onChange:function(v){ set("mes", v); }}),
      e(CampoSel,{t:"Plataforma", id:"cr-plat", value:f.plataforma, onChange:function(v){ set("plataforma", v); }, opcoes:PLATAFORMAS.map(function(x){ return [x.valor, x.rotulo]; })}),
      e(CampoSel,{t:"Formato", id:"cr-fmt", value:f.formato, onChange:function(v){ set("formato", v); }, opcoes:FORMATOS.map(function(x){ return [x.valor, x.rotulo]; })}),
      e(CampoDin,{t:"Investimento", id:"cr-inv", value:f.investimento, onChange:function(v){ set("investimento", v); }}),
      e(CampoNum,{t:"Leads", id:"cr-leads", value:f.leads, onChange:function(v){ set("leads", v); }}),
      e(CampoNum,{t:"Aprovadas", id:"cr-apr", value:f.aprovadas, onChange:function(v){ set("aprovadas", v); }}),
      e(CampoNum,{t:"Cadastradas", id:"cr-cad", value:f.cadastradas, onChange:function(v){ set("cadastradas", v); }}),
      e(CampoTexto,{t:"Link do anúncio", id:"cr-link", value:f.link, maxLength:500, placeholder:"https://", cls:"col-span-2", onChange:function(v){ set("link", v); }}),
      e(CampoTexto,{t:"Observação", id:"cr-obs", value:f.obs, maxLength:500, cls:"col-span-2", onChange:function(v){ set("obs", v); }}),
      e("div",{className:"col-span-2 flex items-end justify-end gap-2 md:col-span-4"},
        f.id && e(Botao,{onClick:excluir}, "Excluir"), e(Botao,{onClick:p.fechar}, "Cancelar"), e(Botao,{principal:true, onClick:salvar}, "Salvar"))));
}

// um dado do cartão: rótulo pequeno em cima, valor embaixo
function Dado(p){ return e("div",{className:"flex flex-col items-center gap-0.5 py-1"}, e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, p.t), e("span",{className:"text-[13px] font-semibold tabular-nums"}, p.v)); }

// cartão de um anúncio: posição no ranking, nome, onde rodou, o que trouxe e o custo de cada cadastrada
function Cartao(p){
  var c = p.c, top = c.pos<=3;
  return e("article",{className:"flex flex-col overflow-hidden rounded-lg border bg-card text-center "+(top ? "border-primary/60" : "border-border")},
    e("div",{className:"flex h-8 items-center justify-between gap-2 px-3 text-[13px] font-semibold "+(top ? "bg-primary/20 text-primary" : "bg-white/5 text-foreground")},
      e("span",null, c.pos+"º lugar"), e("span",null, rotuloPlataforma(c.plataforma))),
    e("div",{className:"flex flex-col items-center gap-1 px-3 py-2"},
      e("h3",{className:"break-words text-[13px] font-semibold"}, c.nome),
      e("p",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, rotuloFormato(c.formato)+" · "+rotuloMes(c.mes))),
    e("div",{className:"grid grid-cols-2 border-y border-border px-2 py-1"},
      e(Dado,{t:"Cadastradas", v:N(c.cadastradas)}), e(Dado,{t:"Custo por cadastrada", v:R$(c.custoCad)}),
      e(Dado,{t:"Leads", v:N(c.leads)}), e(Dado,{t:"Aprovadas", v:N(c.aprovadas)}),
      e("div",{className:"col-span-2"}, e(Dado,{t:"Investimento", v:R$(c.investimento)}))),
    c.obs && e("p",{className:"break-words px-3 py-2 text-[13px]"}, c.obs),
    e("div",{className:"mt-auto flex items-center justify-center gap-2 px-3 py-2"},
      ehLink(c.link) && e("a",{href:c.link, target:"_blank", rel:"noopener noreferrer", className:"inline-flex h-8 min-w-24 items-center justify-center rounded-md border border-primary bg-primary/20 px-3.5 text-[13px] font-semibold text-primary hover:bg-primary/30"}, "Abrir anúncio"),
      e(Botao,{onClick:p.editar}, "Editar")));
}

function AbaCriativos(){
  var tp = use().state.tp, hoje = hojeSP();
  var sm = useState(""), mes = sm[0], sp = useState(""), plat = sp[0], sv = useState("cartoes"), vis = sv[0], se = useState(null), ed = se[0];
  var cab = e(PageHead,{t:"Criativos", sub:"Os anúncios que mais trouxeram revendedoras, para usar de referência nas próximas artes."});
  if(!tp) return e(Pagina,null, cab, e("p",{className:"py-6 text-center text-[13px] text-foreground"}, "Dados dos criativos indisponíveis."));
  var meses = mesesDe(tp, true).reverse();
  var linhas = rankingCriativos(tp, mes, plat).map(function(c, i){ return Object.assign({}, c, {pos:i+1}); });
  var editar = function(l){ se[1](tp.criativos.find(function(x){ return x.id===l.id; })); };
  var cols = [col("pos", "Posição", function(v){ return v+"º"; }), col("nome", "Criativo", function(v){ return v; }), col("plataforma", "Plataforma", rotuloPlataforma), col("formato", "Formato", rotuloFormato),
    col("mes", "Mês", rotuloMes), col("investimento", "Investimento", R$), col("leads", "Leads", N), col("aprovadas", "Aprovadas", N), col("cadastradas", "Cadastradas", N), col("custoCad", "Custo por cadastrada", R$),
    {k:"link", t:"Link", fmt:function(v){ return v ? "Abrir" : "—"; }, render:function(v){ return ehLink(v) ? e("a",{href:v, target:"_blank", rel:"noopener noreferrer", onClick:function(ev){ ev.stopPropagation(); }, className:"text-primary underline"}, "Abrir") : "—"; }},
    col("obs", "Observação", function(v){ return v || "—"; })];
  var vazio = "Nenhum criativo lançado neste período. Use o botão Novo criativo.";
  return e(Pagina,null, cab,
    e(BlocoFiltros,{},
      e(CampoSel,{t:"Mês", id:"cr-fmes", value:mes, onChange:sm[1], opcoes:[["", "Todos os meses"]].concat(meses.map(function(m){ return [m, rotuloMes(m)]; }))}),
      e(CampoSel,{t:"Plataforma", id:"cr-fplat", value:plat, onChange:sp[1], opcoes:[["", "Todas"]].concat(PLATAFORMAS.map(function(x){ return [x.valor, x.rotulo]; }))}),
      e("div",{className:"flex items-end justify-center"}, e(Segmentado,{opcoes:[["cartoes", "Cartões"], ["planilha", "Planilha"]], atual:vis, onMudar:sv[1]})),
      e("div",{className:"flex items-end justify-end gap-2"}, e(Botao,{onClick:function(){ sm[1](""); sp[1](""); }}, "Limpar"), e(Botao,{principal:true, onClick:function(){ se[1](NOVO(mes || hoje.slice(0, 7))); }}, "Novo criativo"))),
    ed && e(FormCriativo,{key:ed.id || "novo", ed:ed, fechar:function(){ se[1](null); }}),
    vis==="cartoes"
      ? (linhas.length ? e("div",{className:"grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"}, linhas.map(function(c){ return e(Cartao,{key:c.id, c:c, editar:function(){ editar(c); }}); })) : e("p",{className:"py-6 text-center text-[13px] text-foreground"}, vazio))
      : e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", aoClicar:editar, semContagem:true, vazio:vazio}));
}
export { AbaCriativos };
