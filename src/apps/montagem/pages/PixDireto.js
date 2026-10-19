// Sorelly Admin — pages/PixDireto.js
// Representantes & Kits → Financeiro → Pix representantes. Tela do FINANCEIRO: quanto cada representante negociou receber por Pix direto da revendedora
// (Regras dos representantes → Negociação do Pix direto), quanto já entrou no mês e quanto FALTA. Os valores sobem durante o mês; o Pix entra até a
// data da comissão (ex.: do dia 1 ao 10, até o dia 11). Há também um relatório em texto por representante para copiar.
import { comisEfetiva, repsEfetivas } from "@/apps/montagem/domain/comissoes";
import { podeFinanceiro } from "@/apps/montagem/domain/equipe";
import { INPUT } from "@/apps/montagem/ui/input";
import { relatorioPix, textoNegociacao } from "@/apps/montagem/domain/pix-direto";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { KPI } from "@/apps/montagem/ui/card";
import { MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var dm = function(iso){ return (iso||"").split("-").reverse().slice(0,2).join("/"); };

function AbaPixDireto(){
  var cx = use(), s = cx.state, d = cx.dispatch, c = comisEfetiva(s), agora = Date.now();
  var mesAtual = new Date(agora).toISOString().slice(0,7);
  var ms = useState(mesAtual), mes = ms[0], setMes = ms[1];
  var vai = function(dl){ var p = mes.split("-"), n = new Date(+p[0], +p[1]-1+dl, 1); setMes(n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")); };
  var nomes = repsEfetivas(s).map(function(x){ return x.nome; });
  var lista = relatorioPix(c, s, mes, agora, nomes);
  var tot = function(f){ return lista.reduce(function(t,x){ return t+f(x); }, 0); };
  var totMeta = tot(function(x){ return x.meta; }), totEnv = tot(function(x){ return x.enviado; }), totFalta = tot(function(x){ return x.falta; });
  var rot = MESES[+mes.slice(5,7)-1]+"/"+mes.slice(0,4);
  var copiar = function(){
    var linhas = ["💸 PIX DIRETO A ENVIAR — "+rot.toUpperCase(), ""];
    lista.forEach(function(x){ linhas.push("👤 "+x.rep+" ("+textoNegociacao(x.neg)+")", "Meta: "+BK(x.meta)+" · Enviado: "+BK(x.enviado)+" · FALTA: "+BK(x.falta)+(x.prazoBR ? " · até "+x.prazoBR : ""), ""); });
    linhas.push("TOTAL — Meta: "+BK(totMeta)+" · Enviado: "+BK(totEnv)+" · FALTA: "+BK(totFalta));
    try { navigator.clipboard.writeText(linhas.join("\n")); d({type:"AVISO", txt:"Relatório copiado"}); } catch(err){}
  };
  var podeMeta = podeFinanceiro(s.usuario);
  var mf = useState({rep:"", modo:"pct", valor:"100", fixo:true}), nova = mf[0], setNova = mf[1];
  var semMeta = nomes.filter(function(n){ return !(s.negPix||{})[n]; });
  var gravar = function(){ if(!nova.rep) return; d({type:"NEGPIX_SET", rep:nova.rep, patch:{modo:nova.modo, valor:Number(String(nova.valor).replace(",","."))||0, vigencia:nova.fixo ? "fixo" : "mes", mes:mes}}); setNova({rep:"", modo:"pct", valor:"100", fixo:true}); };
  var cartao = function(x){
    return e("div",{key:x.rep, className:"flex flex-col gap-2 rounded-xl border border-border bg-card p-3"},
      e("div",{className:"flex flex-wrap items-center justify-between gap-2"},
        e("div",{className:"flex flex-col"}, e("b",{className:"text-[15px]"}, x.rep), e("span",{className:"text-[12px] text-white/70"}, textoNegociacao(x.neg)+(x.neg && x.neg.extraTxt ? " · "+x.neg.extraTxt : ""))),
        e("span",{className:"rounded-lg px-2.5 py-1 text-[12px] font-bold "+(x.falta<=0.009 ? "bg-success/20 text-success" : "bg-warning/20 text-warning")}, x.falta<=0.009 ? "✓ completo" : "enviar até "+(x.prazoBR||"—"))),
      e("div",{className:"grid grid-cols-2 gap-1.5 md:grid-cols-4"},
        [["Comissão do mês",x.comissao,""],["Meta Pix direto",x.meta,"text-primary"],["Já enviado",x.enviado,"text-success"],["Falta enviar",x.falta,x.falta>0.009 ? "text-destructive" : "text-success"]].map(function(k){
          return e("div",{key:k[0], className:"flex flex-col items-center rounded-lg bg-black/25 px-2 py-1.5 text-center"}, e("span",{className:"text-[10px] font-semibold uppercase tracking-wide text-white/70"}, k[0]), e("b",{className:MONO+" text-[15px] "+k[2]}, BK(k[1]))); })),
      e("div",{className:"h-2 overflow-hidden rounded-full bg-black/40"}, e("div",{className:"h-full rounded-full bg-primary", style:{width:x.pct+"%"}})),
      x.sobra>0.009 && e("p",{className:"rounded-md bg-success/10 px-2.5 py-1 text-[12px] font-semibold text-success"}, "Passou "+BK(x.sobra)+": o que passou fica para a próxima comissão."),
      x.falta>0.009 && e("div",{className:"flex flex-wrap items-center gap-2 rounded-md bg-warning/10 px-2.5 py-1 text-[12px] font-semibold text-warning"},
        e("span",null, x.neg && x.neg.proxAcerto ? "Fica pendente: enviar no próximo acerto." : "Falta "+BK(x.falta)+": enviar até "+(x.prazoBR||"—")+" ou deixar para o próximo acerto."),
        podeMeta && e("button",{onClick:function(){ d({type:"NEGPIX_SET", rep:x.rep, patch:{proxAcerto:!(x.neg && x.neg.proxAcerto)}}); }, className:"ml-auto rounded-md bg-black/30 px-2 py-0.5 text-white hover:bg-black/50"}, x.neg && x.neg.proxAcerto ? "Voltar a cobrar agora" : "Enviar no próximo acerto")),
      podeMeta && e("div",{className:"flex flex-wrap items-center gap-2 border-t border-white/10 pt-2 text-[12px]"},
        e("span",{className:"text-white/70"}, "Meta:"),
        e("select",{value:x.neg ? x.neg.modo : "pct", className:INPUT+" h-8! w-28 text-[12px]!", onChange:function(ev){ d({type:"NEGPIX_SET", rep:x.rep, patch:{modo:ev.target.value}}); }}, e("option",{value:"pct"},"% da comissão"), e("option",{value:"valor"},"valor em R$")),
        e("input",{type:"number", min:0, defaultValue:x.neg ? x.neg.valor : 0, className:INPUT+" h-8! w-24 text-[12px]!", "aria-label":"Valor da meta de "+x.rep, onBlur:function(ev){ d({type:"NEGPIX_SET", rep:x.rep, patch:{valor:Number(ev.target.value)||0}}); }}),
        e("label",{className:"flex items-center gap-1"}, e("input",{type:"checkbox", checked:!!(x.neg && x.neg.vigencia==="fixo"), onChange:function(ev){ d({type:"NEGPIX_SET", rep:x.rep, patch:{vigencia:ev.target.checked ? "fixo" : "mes", mes:mes}}); }}), "vale sempre"),
        e("button",{onClick:function(){ if(window.confirm("Tirar a meta de "+x.rep+"?")) d({type:"NEGPIX_DEL", rep:x.rep}); }, className:"ml-auto text-white/60 hover:text-red-300"}, "tirar meta")),
      x.lista.length>0 && e("div",{className:"flex flex-col gap-0.5"}, x.lista.map(function(i){
        return e("div",{key:i.id, className:"flex items-center justify-between gap-2 rounded-md bg-black/20 px-2.5 py-1 text-[12px]"},
          e("span",{className:"min-w-0 truncate"}, dm(i.data)+" · "+i.rev), e("b",{className:MONO+" shrink-0 text-success"}, BK(i.valorPago))); })));
  };
  return e(React.Fragment,null,
    e(PageHead,{t:"Pix representantes", sub:"Quanto cada representante negociou receber por Pix direto da revendedora, quanto já entrou e quanto falta. O financeiro e a diretoria definem a meta aqui mesmo."},
      e(Btn,{v:"secondary", sm:true, ic:"check", onClick:copiar}, "Copiar relatório")),
    e("div",{className:"flex flex-wrap items-center gap-2"},
      e(Btn,{v:"ghost", sm:true, ic:"chevron", onClick:function(){ vai(-1); }},""),
      e("span",{className:"grid h-9 min-w-[9rem] place-items-center rounded-lg border border-primary/40 bg-primary/10 px-3 text-sm font-bold"}, rot),
      e(Btn,{v:"ghost", sm:true, ic:"chevrondown", onClick:function(){ vai(1); }},"")),
    e("div",{className:"grid grid-cols-1 gap-2 md:grid-cols-3"},
      e(KPI,{compacto:true, l:"Meta total de Pix direto", v:BK(totMeta), tom:"text-primary"}),
      e(KPI,{compacto:true, l:"Já enviado", v:BK(totEnv), tom:"text-success"}),
      e(KPI,{compacto:true, l:"Falta enviar", v:BK(totFalta), tom:totFalta>0.009 ? "text-destructive" : "text-success"})),
    podeMeta && e("div",{className:"flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 text-[13px]"},
      e("b",null, "Definir meta de Pix direto"),
      e("select",{value:nova.rep, className:INPUT+" h-9! w-44", "aria-label":"Representante", onChange:function(ev){ setNova(Object.assign({}, nova, {rep:ev.target.value})); }}, e("option",{value:""},"Escolha a representante…"), semMeta.map(function(n){ return e("option",{key:n, value:n}, n); })),
      e("select",{value:nova.modo, className:INPUT+" h-9! w-36", onChange:function(ev){ setNova(Object.assign({}, nova, {modo:ev.target.value})); }}, e("option",{value:"pct"},"% da comissão"), e("option",{value:"valor"},"valor em R$")),
      e("input",{value:nova.valor, className:INPUT+" h-9! w-24", "aria-label":"Valor da meta", onChange:function(ev){ setNova(Object.assign({}, nova, {valor:ev.target.value})); }}),
      e("label",{className:"flex items-center gap-1"}, e("input",{type:"checkbox", checked:nova.fixo, onChange:function(ev){ setNova(Object.assign({}, nova, {fixo:ev.target.checked})); }}), "vale sempre"),
      e(Btn,{v:"primary", sm:true, onClick:gravar, disabled:!nova.rep}, "Definir"),
      e("span",{className:"text-[12px] text-white/60"}, "Ex.: Thalita 100% da comissão por Pix direto.")),
    lista.length===0 ? e("p",{className:"rounded-xl border border-dashed border-border p-6 text-center text-[13px] text-white/70"},"Nenhuma representante com Pix direto negociado neste mês. Defina a meta acima.")
    : e("div",{className:"grid grid-cols-1 gap-3 xl:grid-cols-2"}, lista.map(cartao)));
}

export { AbaPixDireto };
