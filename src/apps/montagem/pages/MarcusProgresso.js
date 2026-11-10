// Sorelly Admin · montagem — pages/MarcusProgresso.js
// Progresso do Marcus (09/11/2026), layout B1 escolhido pelo Marcus: calendário do mês grande à DIREITA, com tudo do dia dentro do quadrado; à ESQUERDA os controles
// (Filtros, Agora, Academia e Trechos do dia). Clicar num dia do calendário troca o dia da esquerda. Só dropdown e menu suspenso (sem chips); só dourado de destaque.
// O relógio fica na barra de cima (components/relogio-progresso.js). Perguntas e edições abrem na Janela do sistema. Lógica em domain/progresso.js.
import { Bloco, Botao, CAMPO, CampoSel, MenuMulti, Rotulo, TabelaCampos, FileiraCampos } from "@/apps/montagem/components/padrao-fin";
import { Janela, Pagina } from "@/apps/montagem/components/padrao";
import { Pergunta, useAgora } from "@/apps/montagem/components/relogio-progresso";
import { Btn } from "@/apps/montagem/ui/button";
import { MOTIVOS, MEMBROS, useProgresso, chaveDia, dia, aberto, comecarDia, pausar, voltar, encerrarDia, reabrirDia, ajustarTrecho, removerTrecho, setAcademia, somas, hms, hm, rotuloMotivo, dataBr } from "@/apps/montagem/domain/progresso";
import { e, useState } from "@/shared/react";
import { createPortal } from "react-dom";

var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var SEMANA = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];
var SIMNAO = [["n","Não"],["s","Sim"]];
var OURO = "#E8B84B";
var nomeMes = function(m){ var p = m.split("-"); return MESES[+p[1]-1]+" de "+p[0]; };
var hmm = function(ms){ var m = Math.floor(Math.max(0, ms)/60000); return Math.floor(m/60)+":"+String(m%60).padStart(2,"0"); };   // 5:42 (horas e minutos)
function hmParaTs(k, txt){ var m = /^(\d{1,2}):(\d{2})$/.exec((txt||"").trim()); if(!m) return null; var p = k.split("-"); return new Date(+p[0], +p[1]-1, +p[2], +m[1], +m[2], 0).getTime(); }

// Janela para corrigir a hora de um trecho (esqueci de voltar do almoço)
function Horas(p){
  var st = useState({ini:hm(p.t.ini), fim:p.t.fim==null ? "" : hm(p.t.fim), erro:""}), v = st[0], setV = st[1];
  var salvar = function(){ var ti = hmParaTs(p.k, v.ini), tf = p.t.fim==null ? null : hmParaTs(p.k, v.fim); if(ti==null || (p.t.fim!=null && tf==null) || (tf!=null && tf<ti)){ setV(Object.assign({}, v, {erro:"Use o formato HH:MM e o fim depois do início."})); return; } ajustarTrecho(p.k, p.i, ti, tf); p.fechar(); };
  var campo = function(rot, chave){ return e("div",{className:"min-w-0 text-left"}, e(Rotulo,{t:rot}), e("input",{type:"time", value:v[chave], onChange:function(ev){ var n = Object.assign({}, v, {erro:""}); n[chave] = ev.target.value; setV(n); }, className:CAMPO})); };
  return createPortal(e(Janela,{t:"Corrigir horas", sub:rotuloMotivo(p.t.tipo)+" · "+dataBr(p.k), fechar:p.fechar,
    colunas:[e("div",{key:"c", className:"mx-auto flex w-full max-w-sm flex-col gap-2 text-center text-[13px]"}, campo("Início", "ini"), p.t.fim!=null && campo("Fim", "fim"), v.erro && e("p",{className:"text-destructive"}, v.erro))],
    rodape:[e(Btn,{key:"s", v:"primary", onClick:salvar}, "Salvar"), e(Btn,{key:"c", onClick:p.fechar}, "Cancelar")]}), document.body);
}

// um quadrado do calendário: tudo do dia, centralizado
function Celula(p){
  var d = p.d, so = p.so, ac = d.academia && d.academia.fez ? d.academia : null, tem = d.trechos.length>0 || ac;
  var linha = function(rot, v){ return v>=30000 ? e("span",{key:rot, className:"text-[13px] tabular-nums"}, rot+" "+hmm(v)) : null; };
  return e("div",{role:"gridcell", tabIndex:0, onClick:p.onClick, style:{minHeight:150}, className:"flex cursor-pointer flex-col items-center gap-0.5 rounded-lg border p-2 text-center "+(p.sel ? "border-primary ring-1 ring-primary " : "border-border ")+(p.fora ? "opacity-40" : "bg-card/60 hover:bg-white/5")},
    e("span",{className:"self-start text-[11px]"}, p.num+(p.hoje ? " · Hoje" : "")),
    !tem || p.fora ? (p.fora ? null : e("span",{className:"my-auto text-[11px]"}, "Sem registro")) : [
      so.trabalho>0 && e("span",{key:"h", className:"text-[18px] font-semibold leading-tight tabular-nums", style:{color:OURO}}, hmm(so.trabalho)),
      d.inicio && e("span",{key:"i", className:"mb-1 border-b border-border pb-1 text-[11px] tabular-nums"}, hm(d.inicio)+" – "+(d.fim ? hm(d.fim) : "aberto")),
      linha("Fumar", so.fumar), linha("Almoçar", so.almocar), linha("Treinar", so.treinar), linha("Parado", so.parado), linha("Outro", so.outro),
      ac && e("span",{key:"a", className:"mt-auto border-t pt-1 text-[11px]", style:{color:OURO, borderColor:"#9A6F1E"}}, "Academia"+(ac.membros.length ? " · "+(ac.membros.length<=2 ? ac.membros.join(", ") : ac.membros.length+" membros") : "")),
      ac && (ac.correu || ac.bola) && e("span",{key:"c", className:"text-[11px]"}, [ac.correu ? "Correu" : "", ac.bola ? "Bola" : ""].filter(Boolean).join(" · "))]);
}

function Progresso(){
  var s = useProgresso(), agora = useAgora(), hoje = chaveDia(agora), mesHoje = hoje.slice(0,7);
  var mst = useState(mesHoje), mes = mst[0], setMes = mst[1], dst = useState(hoje), sel = dst[0], setSel = dst[1], dg = useState(null), dlg = dg[0], setDlg = dg[1];
  var dSel = dia(s, sel), aSel = dSel.academia || {fez:false, membros:[], correu:false, bola:false};
  var diaHoje = dia(s, hoje), abertoHoje = aberto(diaHoje), soHoje = somas(diaHoje, agora);
  var salvarAc = function(p){ setAcademia(sel, p); };
  var pausa = function(m){ if(m==="outro") setDlg({t:"Outra pausa", campo:"Qual o motivo?", ok:"Iniciar pausa", onOk:function(txt){ pausar("outro", Date.now(), txt); }}); else pausar(m, Date.now(), ""); };
  var trocaMes = function(m){ setMes(m); setSel(m===mesHoje ? hoje : m+"-01"); };

  // meses do seletor: os que têm registro, o atual e os 5 anteriores
  var setM = {}; setM[mesHoje] = 1; Object.keys(s.dias).forEach(function(k){ var x = s.dias[k]; if(x.trechos.length || (x.academia && x.academia.fez)) setM[k.slice(0,7)] = 1; });
  for(var i=1;i<=5;i++){ var dm = new Date(+mesHoje.slice(0,4), +mesHoje.slice(5)-1-i, 1); setM[dm.getFullYear()+"-"+String(dm.getMonth()+1).padStart(2,"0")] = 1; }
  var opMeses = Object.keys(setM).sort().reverse().map(function(m){ return [m, nomeMes(m)]; });

  // grade do mês (segunda a domingo), com os dias vizinhos apagados
  var ano = +mes.slice(0,4), mm = +mes.slice(5), primeiro = new Date(ano, mm-1, 1), ini = (primeiro.getDay()+6)%7, nd = new Date(ano, mm, 0).getDate();
  var total = Math.ceil((ini+nd)/7)*7, cel = [], totMs = 0, diasTrab = 0;
  for(var c=0;c<total;c++){
    var dt = new Date(ano, mm-1, 1-ini+c), k = chaveDia(dt.getTime()), fora = dt.getMonth()!==mm-1, dd = dia(s, k), so = somas(dd, agora);
    if(!fora && so.trabalho>0){ totMs += so.trabalho; diasTrab++; }
    cel.push(e(Celula,{key:k, num:dt.getDate(), d:dd, so:so, fora:fora, hoje:k===hoje, sel:k===sel && !fora, onClick:fora ? undefined : (function(kk){ return function(){ setSel(kk); }; })(k)}));
  }

  var colsTr = [{t:"Motivo", w:"110px"}, {t:"Início", w:"64px"}, {t:"Fim", w:"64px"}, {t:"Duração", w:"76px"}, {t:"Ajustar", w:"1fr"}];
  var botTxt = "h-8 whitespace-nowrap text-[13px] underline";

  return e("div",{className:"flex flex-col gap-3"},
    e("h1",{className:"flex h-8 items-center text-[13px] font-semibold text-foreground"}, "Progresso"),
    e("div",{className:"grid items-start gap-3 lg:grid-cols-[460px_minmax(0,1fr)]"},

      e("div",{className:"flex min-w-0 flex-col gap-3"},
        e(Bloco,{t:"Filtros"}, e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 pt-1"}, e(CampoSel,{t:"Mês", id:"pg-mes", value:mes, opcoes:opMeses, onChange:trocaMes}))),

        e(Bloco,{t:"Agora", dir:e("span",{className:"tabular-nums", style:{color:OURO}}, hms(soHoje.trabalho))},
          e("div",{className:"grid grid-cols-2 items-end gap-x-3 gap-y-2 pt-1"},
            !abertoHoje && !diaHoje.inicio && e(Botao,{principal:true, onClick:function(){ comecarDia(Date.now()); }}, "Começar o dia"),
            !abertoHoje && diaHoje.inicio && e(Botao,{onClick:function(){ reabrirDia(Date.now()); }}, "Reabrir o dia"),
            abertoHoje && e(CampoSel,{t:"Estado", id:"pg-agora", value:abertoHoje.tipo, opcoes:[["trabalho","Trabalhando"]].concat(MOTIVOS), onChange:function(v){ if(v==="trabalho") voltar(Date.now()); else pausa(v); }}),
            abertoHoje && e("div",{className:"min-w-0 [&>button]:w-full"}, e(Rotulo,{t:"Dia"}), e(Botao,{onClick:function(){ setDlg({t:"Encerrar o dia", texto:"O tempo de hoje para de contar. Você pode reabrir depois.", ok:"Encerrar dia", onOk:function(){ encerrarDia(Date.now()); }}); }}, "Encerrar dia")))),

        e(Bloco,{t:"Academia · "+dataBr(sel)},
          e("div",{className:"grid grid-cols-2 items-end gap-x-3 gap-y-2 pt-1"},
            e(CampoSel,{t:"Academia", id:"pg-ac", value:aSel.fez ? "s" : "n", opcoes:SIMNAO, onChange:function(v){ salvarAc(v==="s" ? {fez:true} : {fez:false, membros:[], correu:false, bola:false}); }}),
            aSel.fez && e(MenuMulti,{t:"Membros", id:"pg-mem", opcoes:MEMBROS.map(function(m){ return [m, m]; }), valor:aSel.membros, plural:"membros", onChange:function(l){ salvarAc({membros:l}); }}),
            aSel.fez && e(CampoSel,{t:"Corri", id:"pg-co", value:aSel.correu ? "s" : "n", opcoes:SIMNAO, onChange:function(v){ salvarAc({correu:v==="s"}); }}),
            aSel.fez && e(CampoSel,{t:"Joguei bola", id:"pg-bo", value:aSel.bola ? "s" : "n", opcoes:SIMNAO, onChange:function(v){ salvarAc({bola:v==="s"}); }}))),

        e(Bloco,{t:"Trechos de "+dataBr(sel), dir:e("span",{className:"tabular-nums", style:{color:OURO}}, hms(somas(dSel, agora).trabalho))},
          dSel.trechos.length ? e("div",{className:"pt-1"}, e(TabelaCampos,{cols:colsTr, minW:"420px"},
            dSel.trechos.map(function(t, i){ var fim = t.fim==null ? agora : t.fim;
              return e(FileiraCampos,{key:i, cells:[rotuloMotivo(t.tipo)+(t.obs ? " · "+t.obs : ""), hm(t.ini), t.fim==null ? "aberto" : hm(t.fim), hms(fim - t.ini),
                e("span",{className:"flex items-center gap-3"},
                  e("button",{type:"button", className:botTxt, onClick:function(){ setDlg({horas:true, k:sel, i:i, t:t}); }}, "Corrigir"),
                  e("button",{type:"button", className:botTxt, onClick:function(){ setDlg({t:"Excluir trecho", texto:"Excluir este trecho de "+rotuloMotivo(t.tipo)+" do dia "+dataBr(sel)+"?", ok:"Excluir", onOk:function(){ removerTrecho(sel, i); }}); }}, "Excluir"))]}); })))
          : e("p",{className:"py-3 text-center text-[13px]"}, "Sem trechos neste dia."))),

      e(Bloco,{t:nomeMes(mes), dir:e("span",{className:"tabular-nums", style:{color:OURO}}, "Total "+hmm(totMs)+" · "+diasTrab+(diasTrab===1 ? " dia" : " dias")+(diasTrab ? " · média "+hmm(totMs/diasTrab) : ""))},
        e("div",{className:"overflow-x-auto pt-1"}, e("div",{style:{minWidth:840}},
          e("div",{className:"grid grid-cols-7 gap-1.5"}, SEMANA.map(function(n){ return e("div",{key:n, className:"flex h-[30px] items-center justify-center text-[11px] font-semibold uppercase tracking-[.05em]"}, n); })),
          e("div",{className:"grid grid-cols-7 gap-1.5", role:"grid"}, cel))))),

    dlg && (dlg.horas ? e(Horas,{k:dlg.k, i:dlg.i, t:dlg.t, fechar:function(){ setDlg(null); }}) : e(Pergunta,Object.assign({}, dlg, {fechar:function(){ setDlg(null); }}))));
}
function AbaMarcusProg(){ return e(Pagina, null, e("style",null, ".mx{font-size:13px}"), e("div",{className:"mx flex flex-col gap-3"}, e(Progresso))); }
export { AbaMarcusProg };
