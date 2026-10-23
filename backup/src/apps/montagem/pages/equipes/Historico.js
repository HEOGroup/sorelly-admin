// Sorelly Admin · montagem — pages/equipes/Historico.js
// Aba Histórico: registro das alterações do organograma e, só para quem pode editar, a configuração (nome do centro e quem edita).
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { LINHA, Tab, Td } from "@/apps/montagem/components/padrao";
import { eqHistorico } from "@/apps/montagem/domain/equipes";
import { Bt, Ic, useEquipes } from "@/apps/montagem/pages/equipes/pecas";
import { Campo, Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { INPUT } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var ROTULO_OP = {dep_add:"Departamento criado", dep_edit:"Departamento alterado", dep_arquivar:"Arquivamento", dep_del:"Departamento excluído", dep_ordem:"Ordem alterada", mem_add:"Pessoa adicionada", mem_edit:"Pessoa alterada",
  mem_del:"Pessoa removida", mem_ordem:"Ordem alterada", importar_setores:"Importação de setores", vincular_auto:"Vínculo automático", config:"Configuração"};
// "2026-10-16T14:30:05" -> "16/10/2026 14:30"
function quando(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(iso||"")); return m ? m[3]+"/"+m[2]+"/"+m[1]+" "+m[4]+":"+m[5] : String(iso||""); }

function Configuracao(p){
  var cfg = p.eq.config, nome = useState(cfg.nomeRaiz), novo = useState("");
  var salvaNome = function(){ p.exec("config", {nomeRaiz:nome[0]}); };
  var grava = function(lista){ p.exec("config", {editores:lista}); };
  var add = function(){ var n = novo[0].trim(); if(!n) return; grava(cfg.editores.concat([n])); novo[1](""); };
  return e(BlocoBarra,{cor:"roxo", t:"Configuração de Equipes", compacto:true},
    e("div",{className:"grid gap-3 p-3", style:{gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 17rem), 1fr))"}},
      e("div",{className:"flex flex-col gap-2"},
        e(Campo,{rot:"Nome do centro do organograma"}, e("input",{value:nome[0], onChange:function(ev){ nome[1](ev.target.value); }, className:INPUT+" h-9! w-full text-center text-[13px]!"})),
        e(Bt,{tipo:"forte", ic:"floppy-disk", disabled:!nome[0].trim() || nome[0].trim()===cfg.nomeRaiz, onClick:salvaNome}, "Salvar nome")),
      e("div",{className:"flex flex-col gap-2"},
        e("span",{className:"text-center text-[11px] font-bold uppercase tracking-wide text-white/75"}, "Quem pode editar o organograma"),
        e("div",{className:"flex flex-wrap justify-center gap-1.5"}, cfg.editores.map(function(x){ return e("span",{key:x, className:"inline-flex items-center gap-1 rounded-full bg-white/10 py-0.5 pl-2.5 pr-1 text-[12px] font-bold ring-1 ring-white/15"}, x,
          e("button",{type:"button", "aria-label":"Remover "+x, title:cfg.editores.length<2 ? "Deve restar ao menos uma pessoa" : "Remover", disabled:cfg.editores.length<2, onClick:function(){ grava(cfg.editores.filter(function(y){ return y!==x; })); }, className:"grid size-5 place-items-center rounded-full hover:bg-white/20 disabled:opacity-30"}, e(Ph,{n:"x-circle", s:14}))); })),
        e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
          e("input",{value:novo[0], onChange:function(ev){ novo[1](ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") add(); }, placeholder:"Primeiro nome da pessoa", "aria-label":"Primeiro nome", className:INPUT+" h-9! min-w-0 flex-1 text-center text-[13px]!"}),
          e(Bt,{tipo:"forte", ic:"plus", disabled:!novo[0].trim(), onClick:add}, "Autorizar")))));
}

function AbaHistorico(){
  var q = useEquipes(), log = eqHistorico(q.s, 100);
  return e("div",{className:"flex flex-col gap-2.5"},
    log.length
      ? e("div",{className:"rounded-xl bg-black/20 p-1 ring-1 ring-white/10"}, e(Tab,{cols:["Data e hora", "Responsável", "Ação", "Descrição"]},
          log.map(function(l, i){ return e("tr",{key:i, className:LINHA}, e(Td,{dinheiro:true}, quando(l.em)), e(Td,{forte:true}, l.por), e(Td,null, ROTULO_OP[l.acao] || l.acao), e("td",{className:"px-2 py-1.5 text-center text-[13px] align-middle"}, l.txt)); })))
      : e(Vazio,{ic:"clock-counter-clockwise"}, "Nenhuma alteração registrada."),
    q.pode && e(Configuracao,{key:q.eq.config.nomeRaiz+q.eq.config.editores.join(), eq:q.eq, exec:q.exec}));
}

export { AbaHistorico };
