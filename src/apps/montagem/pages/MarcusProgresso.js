// Sorelly Admin · montagem — pages/MarcusProgresso.js
// Marcus › Progresso (Marcus, 23/11/2026: "deixa o Progresso na mesma estrutura" do Acessos e senhas, que é a da Contas a pagar do Financeiro):
// PAGINA_CHEIA, BlocoPainel, barra azul em forma de tabela e TabelaPlanilha fina, uma linha por dia do mês. Clicar no dia abre a janela com os trechos e a academia.
// Perguntas e edições abrem na Janela do sistema. Lógica em domain/progresso.js; dados só neste navegador (e no módulo marcusprog do servidor).
import { Janela, Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { PAGINA_CHEIA, CLS_FINA_ESPACO, BarraTabela, CelulaBarra, CampoMini, refCheia } from "@/apps/montagem/components/planilha-cheia";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { Botao, CAMPO, CampoSel, MenuMulti, Rotulo } from "@/apps/montagem/components/padrao-fin";
import { Pergunta, useAgora } from "@/apps/montagem/components/relogio-progresso";
import { Btn } from "@/apps/montagem/ui/button";
import { MOTIVOS, MEMBROS, useProgresso, useSincronizarProgresso, chaveDia, dia, aberto, comecarDia, pausar, voltar, encerrarDia, reabrirDia, fecharAbertosAntigos, ajustarTrecho, removerTrecho, setAcademia, somas, hms, hm, rotuloMotivo, dataBr } from "@/apps/montagem/domain/progresso";
import { e, useState, useEffect } from "@/shared/react";

var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var SEMANA = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
var SIMNAO = [["n","Não"],["s","Sim"]];
var nomeMes = function(m){ var p = m.split("-"); return MESES[+p[1]-1]+" de "+p[0]; };
var semanaDe = function(k){ var p = k.split("-"); return SEMANA[new Date(+p[0], +p[1]-1, +p[2]).getDay()]; };
function hmParaTs(k, txt){ var m = /^(\d{1,2}):(\d{2})$/.exec((txt||"").trim()); if(!m) return null; var p = k.split("-"); return new Date(+p[0], +p[1]-1, +p[2], +m[1], +m[2], 0).getTime(); }

// Janela para corrigir a hora de um trecho (esqueci de voltar do almoço)
function Horas(p){
  var st = useState({ini:hm(p.t.ini), fim:p.t.fim==null ? "" : hm(p.t.fim), erro:""}), v = st[0], setV = st[1];
  var salvar = function(){ var ti = hmParaTs(p.k, v.ini), tf = p.t.fim==null ? null : hmParaTs(p.k, v.fim); if(ti==null || (p.t.fim!=null && tf==null) || (tf!=null && tf<ti)){ setV(Object.assign({}, v, {erro:"Use o formato HH:MM e o fim depois do início."})); return; } ajustarTrecho(p.k, p.i, ti, tf); p.fechar(); };
  var campo = function(rot, chave){ return e("div",{className:"min-w-0 text-left"}, e(Rotulo,{t:rot}), e("input",{type:"time", value:v[chave], onChange:function(ev){ var n = Object.assign({}, v, {erro:""}); n[chave] = ev.target.value; setV(n); }, className:CAMPO})); };
  return e(Janela,{t:"Corrigir horas", sub:rotuloMotivo(p.t.tipo)+" · "+dataBr(p.k), fechar:p.fechar,
    colunas:[e("div",{key:"c", className:"mx-auto flex w-full max-w-sm flex-col gap-2 text-center text-[13px]"}, campo("Início", "ini"), p.t.fim!=null && campo("Fim", "fim"), v.erro && e("p",{className:"text-destructive"}, v.erro))],
    rodape:[e(Btn,{key:"s", v:"primary", onClick:salvar}, "Salvar"), e(Btn,{key:"c", onClick:p.fechar}, "Cancelar")]});
}

// Janela do dia: trechos (corrigir e excluir) e academia
function JanelaDia(p){
  var s = useProgresso(), agora = useAgora(), k = p.k, d = dia(s, k), ac = d.academia || {fez:false, membros:[], correu:false, bola:false};
  var salvarAc = function(x){ setAcademia(k, x); };
  var botTxt = "h-8 whitespace-nowrap text-[13px] underline";
  var trechos = d.trechos.length ? e("div",{className:"flex flex-col gap-1"}, d.trechos.map(function(t, i){ var fim = t.fim==null ? agora : t.fim;
    return e("div",{key:i, className:"flex flex-wrap items-center justify-between gap-2 border-b border-border py-1 text-[13px]"},
      e("span",null, rotuloMotivo(t.tipo)+(t.obs ? " · "+t.obs : "")), e("span",{className:"tabular-nums"}, hm(t.ini)+" - "+(t.fim==null ? "aberto" : hm(t.fim))+" · "+hms(fim - t.ini)),
      e("span",{className:"flex items-center gap-3"},
        e("button",{type:"button", className:botTxt, onClick:function(){ p.corrigir(i, t); }}, "Corrigir"),
        e("button",{type:"button", className:botTxt, onClick:function(){ p.excluir(i, t); }}, "Excluir"))); })) : e("p",{className:"py-3 text-center text-[13px]"}, "Sem trechos neste dia.");
  var academia = e("div",{className:"grid grid-cols-2 items-end gap-x-3 gap-y-2"},
    e(CampoSel,{t:"Academia", id:"pg-ac", value:ac.fez ? "s" : "n", opcoes:SIMNAO, onChange:function(v){ salvarAc(v==="s" ? {fez:true} : {fez:false, membros:[], correu:false, bola:false}); }}),
    ac.fez && e(MenuMulti,{t:"Membros", id:"pg-mem", opcoes:MEMBROS.map(function(m){ return [m, m]; }), valor:ac.membros, plural:"membros", onChange:function(l){ salvarAc({membros:l}); }}),
    ac.fez && e(CampoSel,{t:"Corri", id:"pg-co", value:ac.correu ? "s" : "n", opcoes:SIMNAO, onChange:function(v){ salvarAc({correu:v==="s"}); }}),
    ac.fez && e(CampoSel,{t:"Joguei bola", id:"pg-bo", value:ac.bola ? "s" : "n", opcoes:SIMNAO, onChange:function(v){ salvarAc({bola:v==="s"}); }}));
  return e(Janela,{t:semanaDe(k)+" · "+dataBr(k), sub:"Trabalhado "+hms(somas(d, agora).trabalho), fechar:p.fechar,
    colunas:[e("div",{key:"t", className:"min-w-0"}, e(Rotulo,{t:"Trechos"}), trechos), e("div",{key:"a", className:"min-w-0"}, e(Rotulo,{t:"Academia"}), academia)],
    rodape:[e(Btn,{key:"f", onClick:p.fechar}, "Fechar")]});
}

function TelaProgresso(){
  var s = useProgresso(), agora = useAgora(), hoje = chaveDia(agora), mesHoje = hoje.slice(0, 7);
  useSincronizarProgresso();   // guarda no servidor (módulo marcusprog) e traz de outro computador
  useEffect(function(){ fecharAbertosAntigos(); }, []);
  var ms = useState(mesHoje), mes = ms[0], setMes = ms[1], sl = useState(null), sel = sl[0], setSel = sl[1], dg = useState(null), dlg = dg[0], setDlg = dg[1];
  var diaHoje = dia(s, hoje), abertoHoje = aberto(diaHoje), soHoje = somas(diaHoje, agora);
  var pausa = function(m){ if(m==="outro") setDlg({t:"Outra pausa", campo:"Qual o motivo?", ok:"Iniciar pausa", onOk:function(txt){ pausar("outro", Date.now(), txt); }}); else pausar(m, Date.now(), ""); };

  // meses do seletor: os que têm registro, o atual e os 5 anteriores
  var setM = {}; setM[mesHoje] = 1; Object.keys(s.dias).forEach(function(k){ var x = s.dias[k]; if(x.trechos.length || (x.academia && x.academia.fez)) setM[k.slice(0, 7)] = 1; });
  for(var i = 1; i<=5; i++){ var dm = new Date(+mesHoje.slice(0, 4), +mesHoje.slice(5)-1-i, 1); setM[dm.getFullYear()+"-"+String(dm.getMonth()+1).padStart(2, "0")] = 1; }
  var opMeses = Object.keys(setM).sort().reverse().map(function(m){ return [m, nomeMes(m)]; });

  // uma linha por dia do mês (do último para o primeiro), com registro ou o dia de hoje
  var nd = new Date(+mes.slice(0, 4), +mes.slice(5), 0).getDate(), linhas = [], totMs = 0, diasTrab = 0;
  for(var n = nd; n>=1; n--){
    var k = mes+"-"+String(n).padStart(2, "0"), d = dia(s, k), so = somas(d, agora), ac = d.academia && d.academia.fez ? d.academia : null;
    if(!d.trechos.length && !ac && k!==hoje) continue;
    if(so.trabalho>0){ totMs += so.trabalho; diasTrab++; }
    linhas.push({id:k, dia:dataBr(k), sem:semanaDe(k), ini:d.inicio ? hm(d.inicio) : "", fim:d.inicio ? (d.fim ? hm(d.fim) : "aberto") : "", trab:so.trabalho, fumar:so.fumar, almocar:so.almocar, treinar:so.treinar, parado:so.parado, outro:so.outro,
      acad:ac ? "Sim" : "Não", corri:ac && ac.correu ? "Sim" : "Não", bola:ac && ac.bola ? "Sim" : "Não", membros:ac ? ac.membros.join(", ") : ""});
  }
  var hmsV = function(v){ return v>=30000 ? hms(v) : ""; };
  var cols = [{k:"dia", t:"Dia"}, {k:"sem", t:"Semana"}, {k:"ini", t:"Início"}, {k:"fim", t:"Fim"}, {k:"trab", t:"Trabalhado", fmt:function(v){ return v>0 ? hms(v) : ""; }},
    {k:"fumar", t:"Fumar", fmt:hmsV}, {k:"almocar", t:"Almoçar", fmt:hmsV}, {k:"treinar", t:"Treinar", fmt:hmsV}, {k:"parado", t:"Parado", fmt:hmsV}, {k:"outro", t:"Outro", fmt:hmsV},
    {k:"acad", t:"Academia"}, {k:"corri", t:"Corri"}, {k:"bola", t:"Joguei bola"}, {k:"membros", t:"Membros"}];
  var rodape = function(ls){ var tr = ls.reduce(function(t, l){ return t+(l.trab || 0); }, 0); return cols.map(function(c, j){ return j===0 ? "Total" : c.k==="sem" ? ls.length+(ls.length===1 ? " dia" : " dias") : c.k==="trab" ? hms(tr) : ""; }); };

  var acaoDia = !abertoHoje && !diaHoje.inicio ? e(Botao,{principal:true, onClick:function(){ comecarDia(Date.now()); }}, "Começar o dia")
    : !abertoHoje ? e(Botao,{onClick:function(){ reabrirDia(Date.now()); }}, "Reabrir o dia")
    : e(Botao,{onClick:function(){ setDlg({t:"Encerrar o dia", texto:"O tempo de hoje para de contar. Você pode reabrir depois.", ok:"Encerrar dia", onOk:function(){ encerrarDia(Date.now()); }}); }}, "Encerrar dia");

  return e(Pagina,{className:PAGINA_CHEIA},
    sel && !dlg && e(JanelaDia,{key:sel, k:sel, fechar:function(){ setSel(null); },
      corrigir:function(i, t){ setDlg({horas:true, k:sel, i:i, t:t}); },
      excluir:function(i, t){ setDlg({t:"Excluir trecho", texto:"Excluir este trecho de "+rotuloMotivo(t.tipo)+" do dia "+dataBr(sel)+"?", ok:"Excluir", onOk:function(){ removerTrecho(sel, i); }}); }}),
    dlg && (dlg.horas ? e(Horas,{k:dlg.k, i:dlg.i, t:dlg.t, fechar:function(){ setDlg(null); }}) : e(Pergunta,Object.assign({}, dlg, {fechar:function(){ setDlg(null); }}))),
    e(BlocoPainel,{titulo:"Progresso - Marcus", compacto:true},
      e(BarraTabela,null,
        e(CelulaBarra,{rotulo:"Mês"}, e(CampoMini,{valor:mes, aoMudar:setMes, rotulo:"Mês", ops:opMeses})),
        e(CelulaBarra,{rotulo:"Agora"}, abertoHoje
          ? e(CampoMini,{valor:abertoHoje.tipo, aoMudar:function(v){ if(v==="trabalho") voltar(Date.now()); else pausa(v); }, rotulo:"Estado agora", ops:[["trabalho", "Trabalhando"]].concat(MOTIVOS)})
          : e("span",{className:"text-[11px]"}, diaHoje.inicio ? "Dia encerrado" : "Não iniciado")),
        e(CelulaBarra,{rotulo:"Hoje"}, e("span",{className:"text-[11px] tabular-nums"}, hms(soHoje.trabalho))),
        e(CelulaBarra,{rotulo:"Média do mês"}, e("span",{className:"text-[11px] tabular-nums"}, diasTrab ? hms(totMs/diasTrab) : "—")),
        e(CelulaBarra,{rotulo:"Dia"}, acaoDia)),
      e("div",{ref:refCheia({}), className:CLS_FINA_ESPACO},
        e(TabelaPlanilha,{key:mes, fina:true, cols:cols, aoClicar:function(l){ setSel(l.id); }, alturaMax:"calc(100vh - 6.6rem)", linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, semMao:true, limite:6000, totalRodape:rodape, vazio:"Nenhum dia neste mês."}))));
}
function AbaMarcusProg(){ return e(TelaProgresso,null); }
export { AbaMarcusProg };
