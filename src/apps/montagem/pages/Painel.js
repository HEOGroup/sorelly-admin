// Sorelly Admin · montagem e bipagem — pages/Painel.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { BarraBipadora } from "@/apps/montagem/components/barra-bipadora";
import { DlgNovoKit, DlgRetirada } from "@/apps/montagem/components/dialogos";
import { Fila } from "@/apps/montagem/components/fila";
import { papelDe } from "@/apps/montagem/domain/equipe";
import { listagemDe } from "@/apps/montagem/domain/regras";
import { SITUACOES } from "@/apps/montagem/domain/status";
import { BK, isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { BADGE } from "@/apps/montagem/ui/badge";
import { Btn } from "@/apps/montagem/ui/button";
import { Icon } from "@/apps/montagem/ui/icon";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { BlocoErrosBipagem } from "@/apps/montagem/components/erros-bipagem";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

function AbaPainel(){
  var cx = use(), s = cx.state;
  var fl = useState({rep:"todas", busca:"", sit:"todas", ordem:"fila"}), f = fl[0], setFs = fl[1];
  var setF = function(n){ setFs(Object.assign({}, f, n)); };
  // Kits das listagens abertas de hoje (respeitando o filtro de representante), para as contagens por situação
  var hojeISO = isoDia(new Date());
  var abertos = s.kits.filter(function(k){ var l = listagemDe(s,k); return l && !l.fechada && (!l.data || l.data===hojeISO) && k.status!=="precond" && (f.rep==="todas" || k.lid===f.rep); });
  var chipSit = function(id, lb, qtd, tom){ var on = f.sit===id;
    return e("button",{key:id, onClick:function(){setF({sit: on && id!=="todas" ? "todas" : id});}, "aria-pressed":on,
      className:"inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors "+
        (on ? BADGE[tom] : "border-border bg-card text-muted-foreground hover:text-foreground")},
      lb, e("span",{className:MONO+" rounded-md px-1.5 text-[12px] "+(on?"bg-black/20":"bg-muted")}, qtd)); };
  var dg = useState({tipo:null, lid:null}), dlg = dg[0], setDlg = dg[1];
  var abrir = function(t, lid){ setDlg({tipo:t, lid:lid}); }, fechar = function(){ setDlg({tipo:null, lid:null}); };
  var n = abertos.length;
  var conferir = s.kits.filter(function(k){return k.status==="supervisao";}).length;
  return e(React.Fragment,null,
    e(PageHead,{t:"Listagens do dia", sub: papelDe(s.usuario)==="bipadora"
      ? "Inicie a bipagem pelo bot\u00e3o abaixo (pr\u00f3ximo da fila) ou pelo Bipar na linha do kit. O cron\u00f4metro come\u00e7a na hora."
      : "Fila \u00fanica por hor\u00e1rio de retirada, com os priorit\u00e1rios na frente desde o in\u00edcio do dia."}),
    e(BlocoErrosBipagem),
    papelDe(s.usuario)==="bipadora" && e(BarraBipadora),
    e("div",{className:"flex flex-col gap-3"},
          e("div",{className:"flex flex-wrap items-center gap-2"},
            e("div",{className:"relative"}, e(Icon,{n:"search", s:16, className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"}),
              e("input",{className:INPUT+" w-60 pl-9 text-sm!", placeholder:"Buscar revendedora", value:f.busca, onChange:function(ev){setF({busca:ev.target.value});}})),
            // Mesmo padrão para todos os controles da barra: 40px de altura, cantos iguais, texto 14px
            e("div",{className:"relative"},
              e(Icon,{n:"user", s:16, className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary"}),
              e("select",{value:f.rep, "aria-label":"Representante", onChange:function(ev){setF({rep:ev.target.value});},
                  className:"h-10 cursor-pointer rounded-lg border border-primary/50 bg-primary/10 pl-9 pr-3 text-sm font-semibold outline-none hover:bg-primary/15 focus:ring-3 focus:ring-ring/50"},
                e("option",{value:"todas"},"Todas as representantes"), s.listagens.filter(function(l){return !l.fechada && (!l.data || l.data===hojeISO);}).map(function(l){return e("option",{key:l.id, value:l.id}, l.rep);}))),
            e("div",{className:"relative"},
              e(Icon,{n:"clock", s:16, className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary"}),
              e("select",{value:f.ordem, "aria-label":"Ordenar por", onChange:function(ev){setF({ordem:ev.target.value});},
                  className:"h-10 cursor-pointer rounded-lg border border-primary/50 bg-primary/10 pl-9 pr-3 text-sm font-semibold outline-none hover:bg-primary/15 focus:ring-3 focus:ring-ring/50"},
                e("option",{value:"fila"},"Ordem da fila"), e("option",{value:"horario"},"Por horário de atendimento"), e("option",{value:"situacao"},"Por situação (montado…)"))),
            conferir>0 && e("span",{className:"inline-flex h-10 items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 text-sm font-semibold text-warning"},
              e(Icon,{n:"alert", s:16}), conferir+(conferir>1?" kits acima de ":" kit acima de ")+BK(s.cfg.limiteAtencao)+" esperando a conferência da Deysiane"),
            e("span",{className:"ml-auto text-sm text-muted-foreground"}, n+" kits"),
            e("div",{className:"flex h-10 items-center gap-1 rounded-lg border border-border px-1"},
              e(Btn,{v:"ghost", sm:true, ic:"chevrondown", onClick:function(){cx.dispatch({type:"TODAS", v:true});}},"Abrir todas"),
              e(Btn,{v:"ghost", sm:true, ic:"chevron", onClick:function(){cx.dispatch({type:"TODAS", v:false});}},"Fechar todas"))),
          // Situação: 5 opções, com a contagem ao vivo de cada uma
          e("div",{className:"flex flex-wrap items-center gap-2"},
            chipSit("todas","Todas", abertos.length, "primary"),
            SITUACOES.map(function(x){ return chipSit(x.id, x.lb, abertos.filter(function(k){return x.st.indexOf(k.status)>=0;}).length, x.tom); })),
          e(Fila,{filtroRep:f.rep, busca:f.busca, sit:f.sit, ordem:f.ordem, abrir:abrir})),
    e(DlgNovoKit,{lid: dlg.tipo==="kit" ? dlg.lid : null, fechar:fechar}),
    e(DlgRetirada,{lid: dlg.tipo==="ret" ? dlg.lid : null, fechar:fechar}));
}

export { AbaPainel };
