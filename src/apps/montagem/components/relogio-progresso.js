// Sorelly Admin · montagem — components/relogio-progresso.js
// Relógio do Progresso na barra de cima (só no modo Marcus, 09/11/2026). Mostra o estado e o tempo; botões: Começar, Pausa (motivos), Voltar, Encerrar dia.
// Perguntas e edições abrem na Janela do sistema (components/padrao.js), nunca na caixa do navegador. Lógica em domain/progresso.js.
import { Janela } from "@/apps/montagem/components/padrao";
import { CAMPO, Rotulo } from "@/apps/montagem/components/padrao-fin";
import { Btn } from "@/apps/montagem/ui/button";
import { MOTIVOS, useProgresso, useSincronizarProgresso, chaveDia, dia, aberto, comecarDia, pausar, voltar, encerrarDia, reabrirDia, fecharAbertosAntigos, somas, hms, rotuloMotivo } from "@/apps/montagem/domain/progresso";
import { e, useState, useEffect } from "@/shared/react";
import { createPortal } from "react-dom";

function useAgora(){
  var st = useState(Date.now()), agora = st[0], set = st[1];
  useEffect(function(){ var id = setInterval(function(){ set(Date.now()); }, 1000); return function(){ clearInterval(id); }; }, []);
  return agora;
}
var BTN = "h-8 whitespace-nowrap rounded-md border border-border bg-card px-3 text-[13px] text-foreground hover:bg-white/10";

// Janela de confirmação (Sim/Não) e de texto, no padrão do sistema; vai para o fim da página para não ficar presa na barra de cima
function Pergunta(p){
  var st = useState(p.valor || ""), v = st[0], setV = st[1];
  var corpo = e(Janela,{t:p.t, sub:p.sub, fechar:p.fechar,
    colunas:[e("div",{key:"c", className:"mx-auto flex w-full max-w-sm flex-col gap-2 text-center text-[13px]"}, p.texto && e("p",null, p.texto), p.campo && e("div",{className:"text-left"}, e(Rotulo,{t:p.campo}), e("input",{type:"text", autoFocus:true, value:v, onChange:function(ev){ setV(ev.target.value); }, className:CAMPO})))],
    rodape:[e(Btn,{key:"o", v:"primary", onClick:function(){ p.onOk(v); p.fechar(); }}, p.ok || "Confirmar"), e(Btn,{key:"c", onClick:p.fechar}, "Cancelar")]});
  return typeof document!=="undefined" ? createPortal(corpo, document.body) : null;
}

function RelogioProgresso(){
  var s = useProgresso(), agora = useAgora(), menu = useState(false), aberta = menu[0], setAberta = menu[1], dg = useState(null), dlg = dg[0], setDlg = dg[1];
  useEffect(function(){ fecharAbertosAntigos(); }, []);
  useSincronizarProgresso();   // guarda no servidor (módulo marcusprog) e traz de outro computador
  var k = chaveDia(agora), d = dia(s, k), a = aberto(d), so = somas(d, agora);
  var estado = a ? (a.tipo==="trabalho" ? "trabalhando" : "pausa") : (d.inicio ? "encerrado" : "parado");
  var cor = estado==="trabalhando" ? "#22C55E" : estado==="pausa" ? "#FBBF24" : "#94A3B8";
  var rotulo = estado==="trabalhando" ? "TRABALHANDO" : estado==="pausa" ? rotuloMotivo(a.tipo).toUpperCase() : estado==="encerrado" ? "DIA ENCERRADO" : "NÃO INICIADO";
  var tempo = estado==="pausa" ? hms(agora - a.ini) : hms(so.trabalho);
  var escolher = function(m){ setAberta(false); if(m==="outro") setDlg({t:"Outra pausa", campo:"Qual o motivo?", ok:"Iniciar pausa", onOk:function(txt){ pausar("outro", Date.now(), txt); }}); else pausar(m, Date.now(), ""); };
  return e("div",{className:"relative flex items-center gap-1.5"},
    e("div",{className:"flex h-8 items-center gap-2 rounded-md border border-border bg-card px-2.5", title:"Trabalhado hoje: "+hms(so.trabalho)+" · Pausas: "+hms(so.pausas)},
      e("span",{className:"inline-block size-2 rounded-full", style:{background:cor}}),
      e("span",{className:"text-[11px] font-medium tracking-[.05em]"}, rotulo),
      e("span",{className:"text-[18px] font-semibold tabular-nums leading-none"}, tempo),
      estado==="pausa" && e("span",{className:"text-[11px] tabular-nums"}, "Trabalho "+hms(so.trabalho))),
    estado==="parado" && e("button",{type:"button", className:BTN+" border-primary bg-primary/20 font-semibold text-primary", onClick:function(){ comecarDia(Date.now()); }}, "Começar"),
    estado==="encerrado" && e("button",{type:"button", className:BTN, onClick:function(){ reabrirDia(Date.now()); }}, "Reabrir"),
    estado==="pausa" && e("button",{type:"button", className:BTN+" border-primary bg-primary/20 font-semibold text-primary", onClick:function(){ voltar(Date.now()); }}, "Voltar"),
    (estado==="trabalhando" || estado==="pausa") && e("button",{type:"button", className:BTN, onClick:function(){ setAberta(!aberta); }, "aria-expanded":aberta}, estado==="pausa" ? "Trocar pausa" : "Pausa"),
    (estado==="trabalhando" || estado==="pausa") && e("button",{type:"button", className:BTN, onClick:function(){ setDlg({t:"Encerrar o dia", texto:"O tempo de hoje para de contar. Você pode reabrir depois.", ok:"Encerrar dia", onOk:function(){ encerrarDia(Date.now()); }}); }}, "Encerrar dia"),
    aberta && e("div",{className:"absolute right-0 top-9 z-50 flex gap-1 rounded-lg border border-border bg-card p-1.5"},
      MOTIVOS.map(function(m){ return e("button",{key:m[0], type:"button", className:BTN, onClick:function(){ escolher(m[0]); }}, m[1]); })),
    dlg && e(Pergunta,Object.assign({}, dlg, {fechar:function(){ setDlg(null); }})));
}
export { RelogioProgresso, Pergunta, useAgora };
