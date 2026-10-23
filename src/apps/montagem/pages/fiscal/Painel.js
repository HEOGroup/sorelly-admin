// Sorelly Admin · montagem — pages/fiscal/Painel.js
// Fiscal → Painel (23/10/2026): barra de totais do grupo com o botão Ano | Mês (muda tudo) e um bloco por CNPJ, 2 em 2, na ordem de quem mais precisa de nota de entrada (maior falta de lastro).
// Cada bloco separa ILF (lastro × meta) e Contas (quanto ainda cabe de contas). Clicar abre o CNPJ sozinho na tela: relatório em cima e notas de entrada embaixo (aparecem aos poucos). Regras em domain/fiscal.js.
import { ESTADO, Indicador, degrade } from "@/apps/montagem/components/padrao";
import { MESES, fxVisaoGeral } from "@/apps/montagem/domain/fiscal";
import { AbaFxEntradas } from "@/apps/montagem/pages/fiscal/EntradasSaidas";
import { JanelaResumo } from "@/apps/montagem/pages/fiscal/VisaoGeral";
import { Bt, Chip, Grade, Selo, corCls, copiar, fmt, useFx } from "@/apps/montagem/pages/fiscal/visual";
import { fxResumoTexto } from "@/apps/montagem/domain/fiscal";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useEffect, useState } from "@/shared/react";

var r2 = function(v){ return Math.round(v*100)/100; };
var GRAU = {grey:0, ok:1, amber:2, red:3};

// aparece aos poucos (opacidade e leve subida) depois de um atraso
function Revela(p){
  var v = useState(false);
  useEffect(function(){ var t = setTimeout(function(){ v[1](true); }, p.atraso || 30); return function(){ clearTimeout(t); }; }, []);
  return e("div",{className:p.className, style:{opacity:p.fora ? 0 : (v[0] ? 1 : 0), transform:v[0] && !p.fora ? "none" : "translateY(8px)", transition:"opacity .6s ease, transform .6s ease"}}, p.children);
}

// números de um CNPJ no período escolhido (ano todo ou um mês)
function dados(x, modo, mes, meta){
  var k = x.k;
  if(modo==="ano") return {fat:k.acum, lastro:k.lastro, need:k.acum*meta, ilf:k.ilfAno, ilfSt:k.ilfSt, gap:k.gapAno, contas:k.contas, sobra:k.sobra,
    folga:k.folgaFiscal, capSt:k.capSt, folgaRot:"Folga para novas contas", contasRot:"Contas do ano", rot:"do ano", sub:k.sub};
  var m = k.mc[mes-1], cm = k.contasMes[mes-1], pode = r2(k.maxMes-cm);
  var capSt = cm<=0 ? {cls:"grey", txt:"—"} : pode<0 ? {cls:"red", txt:"CONFLITO"} : pode<k.maxMes*0.15 ? {cls:"amber", txt:"NO LIMITE"} : {cls:"ok", txt:"CABE"};
  return {fat:m.venda, lastro:m.lastro, need:m.venda*meta, ilf:m.ilf, ilfSt:m.st, gap:m.gap, contas:cm, sobra:r2(m.venda-cm), folga:pode, capSt:capSt,
    folgaRot:"Folga do mês", contasRot:"Contas do mês", rot:"do mês", sub:null};
}

function Painel2(p){
  var d = p.d, ilfCor = corCls(d.ilfSt.cls), capCor = corCls(d.capSt.cls), semVenda = d.fat<=0;
  var pct = d.need>0 ? Math.max(0, Math.min(1, d.lastro/d.need)) : 0, ce = ESTADO[ilfCor];
  var Linha = function(t, v, cor){ return e("div",{className:"flex items-center justify-between gap-2 border-b border-white/10 py-1 text-[13px]"}, e("span",{className:"text-white/85"}, t), e("b",{className:MONO, style:cor ? {color:ESTADO[cor]} : undefined}, v)); };
  var Aviso = function(cor, txt){ return e("div",{className:"mt-2 flex items-center justify-center gap-1.5 text-center text-[12px] text-white"}, e("span",{className:"h-2 w-2 shrink-0 rounded-full", style:{background:ESTADO[cor]}}), e("span",null, txt)); };
  var ilfAviso = semVenda ? ["ruim", "Sem venda lançada"] : d.gap>0 ? [ilfCor==="ruim" ? "ruim" : "alerta", "Faltam "+fmt.brl(d.gap)+" de lastro"] : ["ok", "Meta de lastro batida"];
  var capAviso = d.capSt.cls==="red" ? ["ruim", "Contas passam do que cabe"] : d.capSt.cls==="amber" ? ["alerta", "Contas perto do limite"] : d.capSt.cls==="grey" ? ["neutro", "Sem contas lançadas"] : ["ok", "Contas dentro do que cabe"];
  var painel = function(titulo, selo, cor, rot, valor, corpo, aviso){
    return e("div",{className:"flex min-w-0 flex-col rounded-xl p-2.5 text-center ring-1 ring-white/10", style:degrade(cor)},
      e("div",{className:"flex items-center justify-between"}, e("span",{className:"text-[13px] font-bold uppercase tracking-wide", style:{color:"#06B6D4"}}, titulo), selo),
      e("span",{className:"mt-2 text-[10.5px] font-bold uppercase tracking-wide text-white/80"}, rot),
      e("b",{className:MONO+" text-[20px] leading-tight", style:{color:ESTADO[cor]}}, valor), corpo, aviso);
  };
  return e("div",{className:"grid gap-2", style:{gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 12.5rem), 1fr))"}},
    painel("ILF", e(Selo,{cor:ilfCor}, fmt.cap(d.ilfSt.txt==="—" ? "sem venda" : d.ilfSt.txt.toLowerCase())), ilfCor, "Lastro "+d.rot, fmt.brl(d.lastro),
      e("div",{className:"mt-1.5 flex flex-col"},
        e("div",{className:"mb-1.5 h-2 overflow-hidden rounded-full bg-white/10"}, e("div",{className:"h-full rounded-full transition-all duration-700", style:{width:(pct*100)+"%", background:ce}})),
        Linha("ILF × meta", fmt.pct(d.ilf)+" × "+fmt.pct(p.meta, 0), ilfCor), Linha("Falta de lastro", fmt.brl(d.gap), d.gap>0 ? "alerta" : "ok")),
      Aviso(ilfAviso[0], ilfAviso[1])),
    painel("Contas", e(Selo,{cor:capCor}, fmt.cap(d.capSt.txt==="—" ? "sem contas" : d.capSt.txt.toLowerCase())), capCor, d.folgaRot, fmt.brl(d.folga),
      e("div",{className:"mt-1.5 flex flex-col"}, e("div",{className:"mb-1.5 h-2"}), Linha(d.contasRot, fmt.brl(d.contas)), Linha("Sobra (venda − contas)", fmt.brl(d.sobra), d.sobra>=0 ? "ok" : "ruim")),
      Aviso(capAviso[0], capAviso[1])));
}

// bloco de um CNPJ: cabeçalho com CNPJ inteiro, faturamento do período e as duas partes
function BlocoCnpj(p){
  var x = p.x, d = p.d, pior = GRAU[d.ilfSt.cls] >= GRAU[d.capSt.cls] ? d.ilfSt : d.capSt, geral = pior.cls==="grey" ? "neutro" : corCls(pior.cls);
  return e("div",{onClick:p.aberto ? undefined : p.onAbrir, role:p.aberto ? undefined : "button", tabIndex:p.aberto ? undefined : 0, onKeyDown:p.aberto ? undefined : function(ev){ if(ev.key==="Enter") p.onAbrir(); },
    title:p.aberto ? undefined : "Abrir notas de entrada deste CNPJ", className:"flex flex-col gap-2 rounded-2xl p-3 ring-1 transition "+(p.aberto ? "ring-[#06B6D4]/70" : "cursor-pointer ring-white/10 hover:ring-[#06B6D4]/60"), style:degrade("cian")},
    e("div",{className:"flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center"},
      e("h3",{className:"font-heading text-[16px] font-bold"}, x.empresa.nome),
      e(Selo,{cor:geral}, p.pos+"º na fila de notas"),
      e("span",{className:MONO+" w-full text-[12px] text-white/80"}, "CNPJ "+(x.empresa.cnpj || "—")+(x.empresa.razao ? " · "+x.empresa.razao : ""))),
    e("div",{className:"flex flex-col items-center rounded-xl bg-black/20 py-1.5 ring-1 ring-white/10"},
      e("span",{className:"text-[10.5px] font-bold uppercase tracking-wide text-white/80"}, "Faturamento "+d.rot),
      e("b",{className:MONO+" text-[20px] leading-tight", style:{color:ESTADO.cian}}, fmt.brl(d.fat))),
    e(Painel2,{d:d, meta:p.meta}),
    !p.aberto && e("span",{className:"text-center text-[12px] font-bold", style:{color:"#06B6D4"}}, "Abrir notas de entrada ›"));
}

function AbaFxPainel(p){
  var f = useFx(), s = f.s, ano = p.ano, vg = fxVisaoGeral(s, ano), meta = vg.config.metaIlf;
  var st = useState({modo:"ano", mes:vg.dec, aberto:null, saindo:false, resumo:false}), v = st[0];
  var set = function(o){ st[1](Object.assign({}, v, o)); };
  var lista = vg.ativos.map(function(x){ return {x:x, d:dados(x, v.modo, v.mes, meta)}; }).sort(function(a, b){ return b.d.gap-a.d.gap || (a.x.empresa.nome < b.x.empresa.nome ? -1 : 1); });
  var tot = {fat:0, lastro:0, gap:0, contas:0, folga:0};
  lista.forEach(function(y){ tot.fat += y.d.fat; tot.lastro += y.d.lastro; tot.gap += y.d.gap; tot.contas += y.d.contas; tot.folga += y.d.folga; });
  var ilfG = tot.fat>0 ? tot.lastro/tot.fat : 0, corIlf = tot.fat<=0 ? "neutro" : ilfG>=meta ? "ok" : ilfG>=vg.config.criticoIlf ? "alerta" : "ruim";
  var abrir = function(id){ set({saindo:true}); setTimeout(function(){ st[1](function(c){ return Object.assign({}, c, {aberto:id, saindo:false}); }); }, 420); };
  var copia = function(){ copiar(fxResumoTexto(s, ano), function(ok){ f.aviso(ok ? "Resumo fiscal copiado. Já pode colar no WhatsApp." : "Não foi possível copiar. Use a janela de conferência.", ok ? "ok" : "alerta"); }); set({resumo:true}); };
  var aberto = v.aberto ? lista.filter(function(y){ return y.x.empresa.id===v.aberto; })[0] : null;
  var rotPeriodo = v.modo==="ano" ? "Ano "+ano : fmt.cap(MESES[v.mes-1])+" de "+ano;
  var barra = e("div",{className:"flex flex-col gap-2 rounded-2xl p-2.5 ring-1 ring-[#06B6D4]/40", style:degrade("cian")},
    e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
      e(Chip,{on:v.modo==="ano", onClick:function(){ set({modo:"ano"}); }, ic:"calendar", className:"w-24"}, "Ano"),
      e(Chip,{on:v.modo==="mes", onClick:function(){ set({modo:"mes"}); }, ic:"calendar-blank", className:"w-24"}, "Mês"),
      v.modo==="mes" && e("select",{value:v.mes, "aria-label":"Mês", onChange:function(ev){ set({mes:Number(ev.target.value)}); }, className:"h-9 rounded-lg border border-white/15 bg-white/10 px-3 text-center text-[13px] font-bold text-white"},
        MESES.map(function(m, i){ return e("option",{key:i, value:i+1, style:{color:"#000"}}, fmt.cap(m)); })),
      e("span",{className:"px-2 text-[13px] font-bold text-white/85"}, "Total do grupo · "+rotPeriodo),
      e(Bt,{ic:"copy", onClick:copia, titulo:"Copia o resumo fiscal para o WhatsApp"}, "Resumo fiscal")),
    e(Grade,{min:"11.5rem"},
      e(Indicador,{t:"Faturamento", v:fmt.brl(tot.fat), cor:"cian", sub:v.modo==="ano" ? "Acumulado no ano" : "No mês"}),
      e(Indicador,{t:"Lastro", v:fmt.brl(tot.lastro), cor:corIlf, sub:"ILF "+fmt.pct(ilfG)+" · meta "+fmt.pct(meta, 0)}),
      e(Indicador,{t:"Falta de lastro", v:fmt.brl(tot.gap), cor:tot.gap>0 ? "alerta" : "ok", sub:"Nota de entrada a lançar"}),
      e(Indicador,{t:"Contas", v:fmt.brl(tot.contas), cor:"total", sub:v.modo==="ano" ? "No ano" : "No mês"}),
      e(Indicador,{t:"Folga", v:fmt.brl(tot.folga), cor:tot.folga>=0 ? "ok" : "ruim", sub:"Ainda cabe de contas"})));
  var corpo;
  if(!lista.length) corpo = e("p",{className:"rounded-xl bg-black/20 p-4 text-center text-[13px] text-white/85 ring-1 ring-white/10"}, "Nenhum CNPJ com movimento em "+ano+".");
  else if(aberto) corpo = e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"flex justify-start"}, e(Bt,{ic:"arrow-left", onClick:function(){ set({aberto:null}); }}, "Voltar")),
    e(Revela,{key:"b"+aberto.x.empresa.id, atraso:30}, e(BlocoCnpj,{x:aberto.x, d:aberto.d, meta:meta, pos:lista.indexOf(aberto)+1, aberto:true})),
    e(Revela,{key:"n"+aberto.x.empresa.id, atraso:600}, e(AbaFxEntradas,{ano:ano, ir:p.ir, emp:aberto.x.empresa.id, mes0:v.modo==="mes" ? ano+"-"+("0"+v.mes).slice(-2) : ""})));
  else corpo = e("div",{className:"grid gap-2.5", style:{gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 22rem), 1fr))"}},
    lista.map(function(y, i){ return e(Revela,{key:y.x.empresa.id+v.modo, atraso:30+i*90, fora:v.saindo}, e(BlocoCnpj,{x:y.x, d:y.d, meta:meta, pos:i+1, aberto:false, onAbrir:function(){ abrir(y.x.empresa.id); }})); }));
  return e("div",{className:"flex flex-col gap-2.5"}, barra, corpo, v.resumo && e(JanelaResumo,{f:f, ano:ano, mesInicial:vg.dec, fechar:function(){ set({resumo:false}); }}));
}
export { AbaFxPainel };
