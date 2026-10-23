// Sorelly Admin · montagem — pages/ConsolidadoFaturamento.js
// Financeiro → Faturamento & contas a pagar → Consolidado. O faturamento do mês atual e a atualização do dia ficam na Visão geral (não repete aqui).
// Aqui fica o ANO INTEIRO, mês a mês, de qualquer ano: revendedoras, acertos previstos e realizados, faturamento, média por acerto, contas a pagar e resultado.
// A tela abre só para LEITURA (valores). Quem tem a autorização "faturamento_edita" (padrão: Marcus; muda em RH → Acessos e autorizações) vê o botão Editar.
// Cada campo grava no mesmo lugar de onde a Visão geral lê (faturamentoDiario, revendedorasDiario, metaMensal e contasPagar), então nunca divergem.
// Mês travado (fechado) não edita nenhum campo até ser destravado.
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { contasDoMes, fatEfetivo, MESES_LONGO, resumoMensalRevendedoras } from "@/apps/montagem/domain/financeiro";
import { BKC } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO, MoneyInput } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var BK = function(v){ return v<0 ? "−"+BKC(-v) : BKC(v); };   // negativo com o sinal na frente: −R$ 1.000,00
var num = function(v){ return v===null || v===undefined ? "" : Math.round(v).toLocaleString("pt-BR"); };
var ultimoDia = function(ano, m){ return ano+"-"+String(m+1).padStart(2,"0")+"-"+String(new Date(ano, m+1, 0).getDate()).padStart(2,"0"); };

// colunas: grupo (linha de cima) + nome (linha de baixo) + explicação que aparece ao passar o mouse
var GRUPOS = [
  {g:"Mês", cols:[{n:"Mês", i:"Mês do ano. Cadeado = mês fechado e travado pelo Marcus."}]},
  {g:"Revendedoras", cols:[
    {n:"Início", i:"Quantas revendedoras o mês começou (total do dia 1)."},
    {n:"Fim", i:"Quantas revendedoras o mês terminou (último lançamento do mês; no mês atual, a de hoje)."},
    {n:"Com kit no início", i:"Revendedoras que tinham kit no começo do mês. Vem do Agendamento e é a base da meta de acertos."}]},
  {g:"Acertos", cols:[
    {n:"Previstos", i:"Quantos acertos o Agendamento previu para o mês inteiro."},
    {n:"Feitos", i:"Acertos realizados no mês (total do mês, não o do dia)."}]},
  {g:"Faturamento", cols:[
    {n:"Recebido", i:"Valor recebido no mês inteiro."},
    {n:"Média por acerto", i:"Faturamento recebido dividido pelos acertos feitos."}]},
  {g:"Contas", cols:[
    {n:"Pagas", i:"Contas do mês que já foram pagas. É o mesmo dado de Contas a pagar."},
    {n:"A pagar", i:"Contas do mês que ainda faltam pagar. É o mesmo dado de Contas a pagar."}]},
  {g:"Resultado", cols:[{n:"Do mês", i:"Faturamento recebido menos todas as contas do mês (pagas e a pagar)."}]}
];

// campo de número inteiro (revendedoras, acertos), só aparece no modo editar
function Inteiro(p){
  return e("input",{inputMode:"numeric", value:p.value ? num(p.value) : "", placeholder:"—", disabled:p.disabled, "aria-label":p.label,
    className:INPUT+" h-8! w-24 px-2! text-center text-sm! "+MONO+(p.disabled ? " opacity-60" : ""),
    onChange:function(ev){ p.onChange(Number(ev.target.value.replace(/\D/g,"").slice(0,7)||0)); }});
}

var TH_G = "whitespace-nowrap px-2 pt-1.5 pb-0 text-center text-[10px] font-extrabold uppercase tracking-[.14em] text-white/55";
var TH_N = "whitespace-nowrap px-2 pb-1.5 pt-0 text-center text-[11.5px] font-bold uppercase tracking-wide text-white";
var TD_N = "whitespace-nowrap px-2 py-1.5 text-center align-middle text-[13px] ";

function AbaConsolidadoFaturamento(p){
  p = p || {};
  var cx = use(), s = cx.state, d = cx.dispatch, hoje = new Date(), anoAtual = hoje.getFullYear(), mesAtual = hoje.getMonth();
  var an = useState(anoAtual), ano = p.ano || an[0], setAno = an[1], anoStr = String(ano);
  var ed = useState(false), editando = ed[0], setEditando = ed[1];
  var pode = temAutorizacao("faturamento_edita", s.usuario), modoEdit = pode && editando;
  var fd = fatEfetivo(s), rv = resumoMensalRevendedoras(s, ano);
  var meta = ((s.metaMensal||{})[anoStr]) || {};
  // o registro do mês: o último lançamento do mês (é sempre o acumulado do mês inteiro)
  var regDo = function(m){ var pref = ano+"-"+String(m+1).padStart(2,"0"); var ks = Object.keys(fd).filter(function(k){ return k.slice(0,7)===pref; }).sort(); return ks.length ? fd[ks[ks.length-1]] : null; };
  var linhas = [0,1,2,3,4,5,6,7,8,9,10,11].map(function(m){
    var atual = ano===anoAtual && m===mesAtual, futuro = ano>anoAtual || (ano===anoAtual && m>mesAtual), reg = regDo(m) || {}, ct = contasDoMes(s, anoStr, m), mt = Object.assign({base:0, previstos:0}, meta[m]);
    var fat = reg.recebido||0, acertos = reg.acertos||0, contas = (ct.pago||0)+(ct.apagar||0);
    return {travado:!!reg.travado, m:m, atual:atual, futuro:futuro, reg:reg, fat:fat, acertos:acertos, media:acertos>0 ? fat/acertos : 0, ini:rv[m].ini, fim:rv[m].fim, base:mt.base, previstos:mt.previstos, pago:ct.pago||0, apagar:ct.apagar||0, fixado:!!ct.fixado, contas:contas, res:fat-contas};
  });
  var tot = linhas.reduce(function(t, x){ return {fat:t.fat+x.fat, acertos:t.acertos+x.acertos, contas:t.contas+x.contas, pago:t.pago+x.pago, apagar:t.apagar+x.apagar, previstos:t.previstos+x.previstos}; }, {fat:0, acertos:0, contas:0, pago:0, apagar:0, previstos:0});
  var ultimaRev = linhas.reduce(function(r, x){ return x.fim!==null && x.fim!==undefined ? x.fim : r; }, null);
  // gravações: cada uma vai para a mesma fonte da Visão geral
  var salvaFat = function(x, campo, v){ var base = {data:ultimoDia(ano, x.m), recebido:x.reg.recebido||0, acertos:x.reg.acertos||0, revendedoras:x.reg.revendedoras||x.fim||0}; base[campo] = v; d({type:"FAT_LANCAR", data:base.data, recebido:base.recebido, acertos:base.acertos, revendedoras:base.revendedoras}); };
  var salvaRev = function(x, v){ d({type:"REV_LANCAR", data:ultimoDia(ano, x.m), quantidade:v}); };
  var salvaMeta = function(x, campo, v){ d({type:"META_SET", ano:anoStr, mes:x.m, campo:campo, valor:v}); };
  var salvaConta = function(x, campo, v){ d({type:"CP_SET", ano:anoStr, mes:x.m, campo:campo, valor:v}); };
  var corRes = function(v, tem){ return tem ? (v>=0 ? "#4ADE80" : "#EF4444") : undefined; };
  // célula: no modo leitura mostra só o valor; no modo editar mostra o campo (a menos que o mês esteja travado/ao vivo)
  var cel = function(texto, campo, bloqueado, cor, forte){ return e("td",{className:TD_N+MONO+(forte ? " font-bold" : ""), style:cor ? {color:cor} : undefined}, modoEdit && !bloqueado ? campo : texto); };
  var linhaTotal = function(){ var r = tot.fat-tot.contas; return e("tr",{className:"border-t-2 border-[#3B82F6]/50", style:{background:"linear-gradient(180deg,#3B82F633,#3B82F610)"}},
    e("td",{className:TD_N+"font-extrabold uppercase tracking-wide"}, "Ano "+ano), e("td",{className:TD_N}, "—"), e("td",{className:TD_N+MONO+" font-bold"}, num(ultimaRev) || "—"), e("td",{className:TD_N}, "—"),
    e("td",{className:TD_N+MONO+" font-bold"}, num(tot.previstos)), e("td",{className:TD_N+MONO+" font-bold"}, num(tot.acertos)),
    e("td",{className:TD_N+MONO+" font-bold", style:{color:"#4ADE80"}}, BK(tot.fat)), e("td",{className:TD_N+MONO+" font-bold"}, tot.acertos>0 ? BK(tot.fat/tot.acertos) : "—"),
    e("td",{className:TD_N+MONO+" font-bold"}, BK(tot.pago)), e("td",{className:TD_N+MONO+" font-bold"}, BK(tot.apagar)),
    e("td",{className:TD_N+MONO+" font-extrabold", style:{color:corRes(r, true)}}, BK(r))); };
  // Aba "Mês a mês" da tela Faturamento: detalhe do ano (revendedoras, acertos, faturamento, contas) com modo de edição para quem tem a autorização faturamento_edita.
  // Meses fechados e o mês ao vivo não editam. O ano vem da tela (p.ano); sem ele, usa as setas daqui.
  var tabela = (
      e("div",{className:"overflow-x-auto rounded-xl ring-1 ring-[#3B82F6]/40", style:{background:"linear-gradient(180deg,#3B82F61f,#3B82F608)"}},
        e("table",{className:"w-full min-w-[64rem] border-collapse"},
          e("thead",{style:{background:"linear-gradient(180deg,#3B82F666,#3B82F628)"}},
            e("tr",null, GRUPOS.map(function(g){ return e("th",{key:g.g, colSpan:g.cols.length, className:TH_G+(g.cols.length>1 ? " border-b border-white/15" : "")}, g.g); })),
            e("tr",null, GRUPOS.map(function(g){ return g.cols.map(function(c){ return e("th",{key:g.g+c.n, title:c.i, className:TH_N+" cursor-help"}, g.cols.length>1 ? c.n : ""); }); }))),
          e("tbody",null, linhas.map(function(x){ var bloqueioMes = x.travado, ro = x.atual || x.futuro || bloqueioMes;
            var fundo = x.atual ? "linear-gradient(90deg,#FBBF2428,transparent 85%)" : undefined;   // mês fechado não fica verde: verde é cor de estado (21/10/2026)
            return e("tr",{key:x.m, className:"border-t border-white/10 "+(x.futuro ? "opacity-55" : ""), style:fundo ? {background:fundo} : undefined},
              e("td",{className:TD_N+"text-left! font-bold"}, e("span",{className:"inline-flex items-center gap-1.5"}, MESES_LONGO[x.m],
                x.atual && e("span",{className:"rounded bg-warning/20 px-1.5 py-px text-[10px] font-bold text-warning", title:"O mês atual é atualizado na Visão geral"}, "ao vivo"),
                x.travado && e("button",{type:"button", title:s.usuario===16 ? "Mês fechado e travado. Clique para destravar" : "Mês fechado e travado pelo Marcus", disabled:s.usuario!==16, onClick:function(){ if(window.confirm("Destravar "+MESES_LONGO[x.m]+"?")) d({type:"FAT_TRAVAR", data:ultimoDia(ano, x.m), travado:false}); }, className:"rounded bg-white/10 px-1.5 py-px text-[10px] font-bold text-white/80"}, "🔒 fechado"))),
              e("td",{className:TD_N+MONO+" text-white/70"}, num(x.ini) || "—"),
              cel(x.fim ? num(x.fim) : "—", e(Inteiro,{value:x.fim, label:MESES_LONGO[x.m]+" revendedoras no fim", onChange:function(v){ salvaRev(x, v); }}), ro),
              cel(x.base ? num(x.base) : "—", e(Inteiro,{value:x.base, label:MESES_LONGO[x.m]+" revendedoras com kit no início", onChange:function(v){ salvaMeta(x, "base", v); }}), bloqueioMes),
              cel(x.previstos ? num(x.previstos) : "—", e(Inteiro,{value:x.previstos, label:MESES_LONGO[x.m]+" acertos previstos", onChange:function(v){ salvaMeta(x, "previstos", v); }}), bloqueioMes),
              cel(x.acertos ? num(x.acertos) : "—", e(Inteiro,{value:x.acertos, label:MESES_LONGO[x.m]+" acertos feitos", onChange:function(v){ salvaFat(x, "acertos", v); }}), ro),
              cel(x.fat>0 ? BK(x.fat) : "—", e(MoneyInput,{value:x.fat, sm:true, className:"w-36 text-center!", label:MESES_LONGO[x.m]+" faturamento", onChange:function(v){ salvaFat(x, "recebido", v); }}), ro, x.fat>0 ? "#4ADE80" : undefined),
              e("td",{className:TD_N+MONO}, x.media>0 ? BK(x.media) : "—"),
              cel(x.pago>0 ? BK(x.pago) : "—", e(MoneyInput,{value:x.pago, sm:true, className:"w-32 text-center!", label:MESES_LONGO[x.m]+" contas pagas", onChange:function(v){ salvaConta(x, "pago", v); }}), x.fixado || bloqueioMes),
              cel(x.apagar>0 ? BK(x.apagar) : "—", e(MoneyInput,{value:x.apagar, sm:true, className:"w-32 text-center!", label:MESES_LONGO[x.m]+" contas a pagar", onChange:function(v){ salvaConta(x, "apagar", v); }}), x.fixado || bloqueioMes),
              e("td",{className:TD_N+MONO+" font-bold", style:{color:corRes(x.res, x.fat>0)}}, x.fat>0 || x.contas>0 ? BK(x.res) : "—")); }),
            linhaTotal())))

  );
  return e("div",{className:"flex flex-col gap-2"},
    e("div",{className:"flex min-h-8 items-center justify-between gap-2"},
      e("h3",{className:"text-[13px] font-semibold text-foreground"}, "Detalhe por mês · "+ano),
      pode && e("button",{type:"button", onClick:function(){ setEditando(!editando); }, className:"h-8 min-w-24 truncate rounded-md border px-3.5 text-[13px] "+(modoEdit ? "border-primary bg-primary/20 font-semibold text-primary" : "border-border bg-card text-foreground hover:bg-white/10")}, modoEdit ? "Concluir edição" : "Editar")),
    tabela,
    modoEdit && e("p",{className:"text-[13px] text-foreground"}, "Modo edição ligado. Meses fechados (cadeado) e o mês ao vivo não editam aqui."));
}
export { AbaConsolidadoFaturamento };
