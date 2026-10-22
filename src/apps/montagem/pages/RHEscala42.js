// Sorelly Admin · montagem — pages/RHEscala42.js
// RH → Escala 42h: planejamento do fim da 6x1 (a partir de 16/12/2026). Cada pessoa fica na Equipe A, na Equipe B ou no Padrão; não muda a escala atual do RH.
// Regras e contas em domain/escala42.js; o que o RH marca fica em rh.escala42 (ops esc42_set e esc42_setor em domain/rh.js).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { DIAS, EQUIPES, VIGENCIA, coberturaDe, divide, equipesDe, horario42, textoEscala42 } from "@/apps/montagem/domain/escala42";
import { colaboradoresRh } from "@/apps/montagem/domain/rh";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

var CARD = "rounded-xl bg-card px-4 py-3 ring-1 ring-[#8B5CF6]/40";
var th = function(t, c){ return e("th",{key:t, className:"whitespace-nowrap border-b border-border px-3 py-2 text-left text-[11.5px] font-semibold uppercase tracking-wide "+(c||"")}, t); };
var TD = "px-3 py-1.5 text-[13.5px]";
var Tile = function(p){ return e("div",{className:CARD+" flex flex-col items-center text-center"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-[.12em] text-muted-foreground"}, p.t), e("b",{className:MONO+" text-[24px]", style:{color:p.cor}}, p.v), p.sub && e("span",{className:"text-[11.5px] text-muted-foreground"}, p.sub)); };

function AbaRhEscala42(){
  var cx = use(), s = cx.state, rh = s.rh, por = nomeDe(s.usuario), fs = useState(""), filtro = fs[0], setFiltro = fs[1], cp = useState(false), copiou = cp[0], setCopiou = cp[1];
  var todos = colaboradoresRh(s), ativos = todos.filter(function(c){ return c.status!=="DESLIGADO"; }), eq = equipesDe(rh, ativos);
  var marc = rh.escala42 || {};
  var acao = function(op, extra){ cx.dispatch(Object.assign({type:"RH", op:op, por:por}, extra)); };
  var setores = []; ativos.forEach(function(c){ if(setores.indexOf(c.setor)<0) setores.push(c.setor); }); setores.sort(function(a, b){ return a.localeCompare(b, "pt-BR"); });
  var conta = function(k){ return ativos.filter(function(c){ return eq[c.id]===k; }).length; };
  var hojeSab = function(c){ return c.escalaDias.indexOf(6)>=0; };
  // quem hoje trabalha sábado e ficou no Padrão (sem sábado na escala nova): o Marcus decide se precisa de alguém no sábado
  var perdemSab = {}; ativos.forEach(function(c){ if(hojeSab(c) && eq[c.id]!=="B" && eq[c.id]!=="C") perdemSab[c.setor] = (perdemSab[c.setor]||0)+1; });
  var lista = ativos.filter(function(c){ return !filtro || c.setor===filtro; }).sort(function(a, b){ return a.setor.localeCompare(b.setor, "pt-BR") || a.nome.localeCompare(b.nome, "pt-BR"); });
  var copiar = function(){ var t = textoEscala42(todos, eq); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function(){ setCopiou(true); setTimeout(function(){ setCopiou(false); }, 2000); }, function(){ window.prompt("Copie a mensagem:", t); }); };
  var botoesSetor = function(st){ return [["A","A"],["B","B"],["C","C"],["P","Padrão"],["dividir","A/B"],["tres","A/B/C"]].map(function(x){
    return e("button",{key:x[0], onClick:function(){ acao("esc42_setor", {setor:st, modo:x[0]}); }, className:"h-8 rounded-lg bg-card px-2.5 text-[12px] font-bold ring-1 ring-border hover:bg-muted/50"}, x[1]); }); };

  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Escala 42h", sub:"Fim da 6x1, vale a partir de "+VIGENCIA+": 42h por semana e 2 folgas. É um planejamento: não muda a escala atual do RH."}),
    e("div",{className:"grid grid-cols-2 gap-3 xl:grid-cols-6"},
      e(Tile,{t:"Equipe A", v:conta("A"), cor:EQUIPES.A.cor, sub:"seg a sex"}), e(Tile,{t:"Equipe B", v:conta("B"), cor:EQUIPES.B.cor, sub:"ter a sáb"}), e(Tile,{t:"Equipe C", v:conta("C"), cor:EQUIPES.C.cor, sub:"qua a dom"}), e(Tile,{t:"Padrão", v:conta("P"), cor:EQUIPES.P.cor, sub:"seg a sex"}),
      e(Tile,{t:"Na empresa sábado", v:conta("B")+conta("C"), cor:"#F59E0B"})),
    Object.keys(perdemSab).length>0 && e("p",{className:"flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-2.5 text-[13.5px] font-medium text-warning"},
      "Hoje trabalham aos sábados e ficariam sem sábado: "+Object.keys(perdemSab).sort().map(function(k){ return k+" ("+perdemSab[k]+")"; }).join(", ")+". Se o setor precisa do sábado, divida em A e B."),
    e(BlocoBarra,{cor:"roxo", t:"Cobertura por setor", sub:"quantas pessoas trabalham em cada dia; use os botões para mudar o setor inteiro"},
      e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"},
        e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Setor")].concat(DIAS.map(function(d){ return th(d[1], "text-center"); }), [th("Mudar setor")]))),
        e("tbody",null, setores.map(function(st){
          var dele = ativos.filter(function(c){ return c.setor===st; }), cob = coberturaDe(dele, eq), falha = divide(st) && (cob[1]+cob[0]===0 || cob[6]===0);
          return e("tr",{key:st, className:"border-b border-border/60"},
            e("td",{className:TD+" font-semibold"}, st, e("span",{className:"ml-2 text-[12px] font-normal text-muted-foreground"}, dele.length+(dele.length===1 ? " pessoa" : " pessoas"))),
            DIAS.map(function(d){ var n = cob[d[0]]; return e("td",{key:d[0], className:TD+" text-center "+MONO, style:{color:n===0 ? (falha ? "#EF4444" : undefined) : "#4ADE80", opacity:n===0 && !falha ? .35 : 1}}, n===0 ? "—" : n); }),
            e("td",{className:TD}, e("div",{className:"flex gap-1"}, botoesSetor(st)))); }))))),
    e(BlocoBarra,{cor:"roxo", t:"Pessoas", sub:"escolha a equipe de cada uma; o horário de saída sai da entrada cadastrada no RH"},
      e("div",{className:"flex flex-wrap items-center gap-2 border-b border-white/10 p-3"},
        e("select",{value:filtro, "aria-label":"Setor", className:INPUT+" h-9! w-56 cursor-pointer", onChange:function(ev){ setFiltro(ev.target.value); }}, e("option",{value:""}, "Todos os setores"), setores.map(function(st){ return e("option",{key:st, value:st}, st); })),
        e("div",{className:"flex-1"}), e(Btn,{v:"secondary", sm:true, onClick:copiar}, copiou ? "Copiado!" : "Copiar mensagem")),
      e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"},
        e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Nome"), th("Setor"), th("Hoje"), th("Entrada", "text-center"), th("Equipe"), th("Folga"), th("Saída", "text-center")])),
        e("tbody",null, lista.map(function(c){
          var k = eq[c.id], q = EQUIPES[k], h = horario42(c.entrada), cfgEsc = (rh.config.escalas.find(function(x){ return x.id===c.escalaId; })||{}).nome||"";
          return e("tr",{key:c.id, className:"border-b border-border/60"},
            e("td",{className:TD+" font-semibold"}, c.nome), e("td",{className:TD+" text-muted-foreground"}, c.setor), e("td",{className:TD+" text-muted-foreground"}, cfgEsc),
            e("td",{className:TD+" text-center "+MONO}, h.ini),
            e("td",{className:TD}, e("select",{value:marc[c.id]||"", "aria-label":"Equipe de "+c.nome, className:INPUT+" h-9! w-40 cursor-pointer font-bold", style:{color:q.cor}, onChange:function(ev){ acao("esc42_set", {id:c.id, eq:ev.target.value}); }},
              e("option",{value:""}, "Sugerido ("+q.nome+")"), ["A","B","C","P"].map(function(x){ return e("option",{key:x, value:x}, EQUIPES[x].nome); }))),
            e("td",{className:TD}, q.folga),
            e("td",{className:TD+" text-center "+MONO}, h.fim, e("span",{className:"text-muted-foreground"}, " · "+(k==="B" ? "sáb " : k==="C" ? "dom " : "sex ")+h.fimCurto))); }))))));
}

export { AbaRhEscala42 };
