// Sorelly Admin · montagem — pages/trafego/Criativos.js
// Tráfego pago › Criativos (pedido do Diego): os anúncios que mais trouxeram revendedoras em cada mês, para o Marketing consultar e usar de referência nas próximas artes.
// Hoje cada criativo é lançado à mão. Quando o Gerenciador de Anúncios puder ser lido pelo sistema, os números entram sozinhos (ainda não ligado).
import { Bloco, Botao, BlocoFiltros, CampoSel } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { FORMATOS, PLATAFORMAS, hojeSP, mesesDe, rankingCriativos, rotuloFormato, rotuloMes, rotuloPlataforma } from "@/apps/montagem/domain/trafego";
import { CampoDin, CampoNum, CampoTexto, N, R$, col, porDe } from "@/apps/montagem/pages/trafego/comum";
import { use } from "@/apps/montagem/state/context";
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

function AbaTpCriativos(){
  var tp = use().state.tp, hoje = hojeSP();
  var sm = useState(""), mes = sm[0], sp = useState(""), plat = sp[0], se = useState(null), ed = se[0];
  var meses = mesesDe(tp, true).reverse();
  var linhas = rankingCriativos(tp, mes, plat).map(function(c, i){ return Object.assign({}, c, {pos:i+1}); });
  var cols = [col("pos", "Posição", function(v){ return v+"º"; }), col("nome", "Criativo", function(v){ return v; }), col("plataforma", "Plataforma", rotuloPlataforma), col("formato", "Formato", rotuloFormato),
    col("mes", "Mês", rotuloMes), col("investimento", "Investimento", R$), col("leads", "Leads", N), col("aprovadas", "Aprovadas", N), col("cadastradas", "Cadastradas", N), col("custoCad", "Custo por cadastrada", R$),
    {k:"link", t:"Link", fmt:function(v){ return v ? "Abrir" : "—"; }, render:function(v){ return ehLink(v) ? e("a",{href:v, target:"_blank", rel:"noopener noreferrer", onClick:function(ev){ ev.stopPropagation(); }, className:"text-primary underline"}, "Abrir") : "—"; }},
    col("obs", "Observação", function(v){ return v || "—"; })];
  return e("div",{className:"flex flex-col gap-2.5"},
    e(BlocoFiltros,{},
      e(CampoSel,{t:"Mês", id:"cr-fmes", value:mes, onChange:sm[1], opcoes:[["", "Todos os meses"]].concat(meses.map(function(m){ return [m, rotuloMes(m)]; }))}),
      e(CampoSel,{t:"Plataforma", id:"cr-fplat", value:plat, onChange:sp[1], opcoes:[["", "Todas"]].concat(PLATAFORMAS.map(function(x){ return [x.valor, x.rotulo]; }))}),
      e("div",{className:"col-span-2 flex items-end justify-end gap-2"}, e(Botao,{onClick:function(){ sm[1](""); sp[1](""); }}, "Limpar"), e(Botao,{principal:true, onClick:function(){ se[1](NOVO(mes || hoje.slice(0, 7))); }}, "Novo criativo"))),
    ed && e(FormCriativo,{key:ed.id || "novo", ed:ed, fechar:function(){ se[1](null); }}),
    e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", aoClicar:function(l){ se[1](tp.criativos.find(function(x){ return x.id===l.id; })); }, semContagem:true,
      vazio:"Nenhum criativo lançado neste período. Use o botão Novo criativo."}));
}
export { AbaTpCriativos };
