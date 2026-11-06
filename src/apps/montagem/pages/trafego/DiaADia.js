// Sorelly Admin · montagem — pages/trafego/DiaADia.js
// Tráfego pago › Dia a dia (abas "Base GOOGLE ADS" e "Base META ADS" do Diego): lança o resultado de um dia numa plataforma e lista o mês com todas as contas.
// Lançar um dia que já existe atualiza o dia (uma linha por data e plataforma). Clicar numa linha da tabela carrega o dia no formulário.
import { Bloco, CampoSel, Botao, Segmentado } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { PLATAFORMAS, formatarDia, hojeSP, linhasDiarias, mesesDe, rotuloMes, rotuloPlataforma, totalDe } from "@/apps/montagem/domain/trafego";
import { CampoDin, CampoNum, CampoTexto, N, PCT, R$, col, diaAnterior, porDe } from "@/apps/montagem/pages/trafego/comum";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var TEXTO = function(v){ return v==null || v==="" ? "—" : String(v); };
var VAZIO = {investimento:null, impressoes:"", cliques:"", leads:"", aprovadas:"", cadastradas:"", obs:""};

function colunas(plat){
  var meta = plat==="meta";
  return [col("data", "Data", function(v){ return formatarDia(v); }), col("semana", "Dia", TEXTO), col("investimento", "Investimento", R$)]
    .concat(meta ? [col("impressoes", "Impressões", N), col("cpm", "CPM", R$)] : [])
    .concat([col("cliques", meta ? "Cliques no link" : "Cliques", N), col("cpc", "CPC", R$)])
    .concat(meta ? [col("ctr", "CTR", PCT)] : [])
    .concat([col("leads", "Leads", N), col("cpl", "Custo por lead", R$)])
    .concat(meta ? [] : [col("cvr", "CVR", PCT)])
    .concat([col("aprovadas", "Aprovadas", N), col("custoAprov", "Custo por aprovada", R$), col("pctAprov", "% Aprovação", PCT),
      col("cadastradas", "Cadastradas", N), col("custoCad", "Custo por cadastrada", R$), col("pctCadAprov", "% Cadastrada sobre aprovada", PCT), col("obs", "Observação", TEXTO)]);
}

function AbaTpDia(){
  var cx = use(), s = cx.state, d = cx.dispatch, tp = s.tp, hoje = hojeSP();
  var sp = useState("google"), plat = sp[0];
  var ultimo = mesesDe({dias:tp.dias, resumos:[]}).pop() || hoje.slice(0, 7);
  var sm = useState(ultimo), mes = sm[0];
  var sd = useState(diaAnterior(hoje)), dia = sd[0];
  var doDia = function(data, p){ return tp.dias.find(function(x){ return x.data===data && x.plataforma===p; }); };
  var daqui = function(x){ return x ? {investimento:x.investimento, impressoes:String(x.impressoes), cliques:String(x.cliques), leads:String(x.leads), aprovadas:String(x.aprovadas), cadastradas:String(x.cadastradas), obs:x.obs} : VAZIO; };
  var sf = useState(function(){ return daqui(doDia(dia, "google")); }), f = sf[0];
  var set = function(k, v){ var n = Object.assign({}, f); n[k] = v; sf[1](n); };
  // troca a plataforma ou o dia: carrega o que já foi lançado (ou limpa o formulário)
  var carregar = function(data, p){ sd[1](data); sp[1](p); sf[1](daqui(doDia(data, p))); if(data.slice(0, 7)!==mes) sm[1](data.slice(0, 7)); };
  var existe = !!doDia(dia, plat);
  var meta = plat==="meta";
  var salvar = function(){
    d({type:"TP", op:"dia_set", data:dia, plataforma:plat, investimento:f.investimento||0, impressoes:f.impressoes||0, cliques:f.cliques||0, leads:f.leads||0, aprovadas:f.aprovadas||0, cadastradas:f.cadastradas||0, obs:f.obs, por:porDe(s)});
    if(dia.slice(0, 7)!==mes) sm[1](dia.slice(0, 7));
  };
  var excluir = function(){ if(window.confirm("Excluir o dia "+formatarDia(dia)+" ("+rotuloPlataforma(plat)+")?")){ d({type:"TP", op:"dia_del", data:dia, plataforma:plat}); sf[1](VAZIO); } };
  var meses = mesesDe({dias:tp.dias, resumos:[]}); if(meses.indexOf(mes)===-1) meses.push(mes); if(meses.indexOf(hoje.slice(0, 7))===-1) meses.push(hoje.slice(0, 7));
  meses.sort().reverse();
  var linhas = linhasDiarias(tp, mes, plat), cols = colunas(plat);
  var total = function(ls){ var t = totalDe(ls); return cols.map(function(c, i){ if(!i) return "Total"; if(c.k==="semana" || c.k==="obs") return ""; var v = t[c.k]; return v==null ? "—" : c.fmt(v, t); }); };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Bloco,{t:(existe ? "Editar dia" : "Lançar dia")+" · "+rotuloPlataforma(plat), dir:e(Segmentado,{opcoes:PLATAFORMAS.map(function(p){ return [p.valor, p.rotulo]; }), atual:plat, onMudar:function(p){ carregar(dia, p); }})},
      e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4"},
        e(CampoTexto,{t:"Data", id:"tp-data", tipo:"date", value:dia, max:hoje, onChange:function(v){ if(v) carregar(v, plat); }}),
        e(CampoDin,{t:"Investimento", id:"tp-inv", value:f.investimento, onChange:function(v){ set("investimento", v); }}),
        meta && e(CampoNum,{t:"Impressões", id:"tp-imp", value:f.impressoes, onChange:function(v){ set("impressoes", v); }}),
        e(CampoNum,{t:meta ? "Cliques no link" : "Cliques", id:"tp-cli", value:f.cliques, onChange:function(v){ set("cliques", v); }}),
        e(CampoNum,{t:"Leads", id:"tp-leads", value:f.leads, onChange:function(v){ set("leads", v); }}),
        e(CampoNum,{t:"Aprovadas", id:"tp-apr", value:f.aprovadas, onChange:function(v){ set("aprovadas", v); }}),
        e(CampoNum,{t:"Cadastradas", id:"tp-cad", value:f.cadastradas, onChange:function(v){ set("cadastradas", v); }}),
        e(CampoTexto,{t:"Observação", id:"tp-obs", value:f.obs, maxLength:500, cls:meta ? "col-span-2" : "col-span-2 md:col-span-1", onChange:function(v){ set("obs", v); }}),
        e("div",{className:"col-span-2 flex items-end justify-end gap-2"},
          existe && e(Botao,{onClick:excluir}, "Excluir"),
          e(Botao,{principal:true, onClick:salvar}, existe ? "Atualizar" : "Lançar")))),
    e("div",{className:"grid grid-cols-2 gap-x-3 md:grid-cols-4"}, e(CampoSel,{t:"Mês", id:"tp-mes", value:mes, onChange:function(v){ sm[1](v); }, opcoes:meses.map(function(m){ return [m, rotuloMes(m)]; })})),
    e(TabelaPlanilha,{key:plat+mes, cols:cols, linhas:linhas, chave:"data", aoClicar:function(l){ carregar(l.data, plat); window.scrollTo({top:0, behavior:"smooth"}); }, totalLinha:total, semContagem:true, vazio:"Nenhum dia lançado neste mês."}));
}
export { AbaTpDia };
